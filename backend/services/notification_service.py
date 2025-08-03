# Advanced Notification Service - خدمة الإشعارات المتقدمة
import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
from models.notification_models import *
from models.all_models import User

class NotificationService:
    def __init__(self, db):
        self.db = db
        self.logger = logging.getLogger(__name__)
        self.active_connections: Dict[str, Any] = {}  # WebSocket connections
        
    async def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """إنشاء إشعار جديد"""
        try:
            notification = Notification(**notification_data.dict())
            
            # حفظ في قاعدة البيانات
            await self.db.notifications.insert_one(notification.dict())
            
            # إرسال الإشعار الفوري
            await self._send_real_time_notification(notification)
            
            self.logger.info(f"Created notification {notification.id} for user {notification.recipient_id}")
            return notification
            
        except Exception as e:
            self.logger.error(f"Error creating notification: {e}")
            raise

    async def create_bulk_notification(self, bulk_data: BulkNotificationCreate) -> List[str]:
        """إنشاء إشعارات متعددة"""
        try:
            notification_ids = []
            
            # الحصول على المستلمين حسب الأدوار إذا تم تحديدها
            recipients = set(bulk_data.recipients)
            
            if bulk_data.recipient_roles:
                role_users = await self.db.users.find(
                    {"role": {"$in": bulk_data.recipient_roles}},
                    {"id": 1}
                ).to_list(1000)
                recipients.update([user["id"] for user in role_users])
            
            # إنشاء إشعار لكل مستلم
            notifications = []
            for recipient_id in recipients:
                notification = Notification(
                    recipient_id=recipient_id,
                    title=bulk_data.title,
                    message=bulk_data.message,
                    type=bulk_data.type,
                    priority=bulk_data.priority,
                    metadata=bulk_data.metadata or {},
                    action_url=bulk_data.action_url
                )
                notifications.append(notification.dict())
                notification_ids.append(notification.id)
            
            # حفظ جميع الإشعارات
            if notifications:
                await self.db.notifications.insert_many(notifications)
                
                # إرسال الإشعارات الفورية
                for notification_dict in notifications:
                    notification = Notification(**notification_dict)
                    await self._send_real_time_notification(notification)
            
            self.logger.info(f"Created {len(notification_ids)} bulk notifications")
            return notification_ids
            
        except Exception as e:
            self.logger.error(f"Error creating bulk notifications: {e}")
            raise

    async def get_user_notifications(
        self, 
        user_id: str, 
        filter_params: NotificationFilter
    ) -> Dict[str, Any]:
        """الحصول على إشعارات المستخدم مع الفلترة"""
        try:
            # بناء استعلام الفلترة
            query = {"recipient_id": user_id}
            
            if filter_params.status:
                query["status"] = filter_params.status
            if filter_params.type:
                query["type"] = filter_params.type
            if filter_params.priority:
                query["priority"] = filter_params.priority
            if filter_params.date_from:
                query["created_at"] = {"$gte": filter_params.date_from}
            if filter_params.date_to:
                if "created_at" in query:
                    query["created_at"]["$lte"] = filter_params.date_to
                else:
                    query["created_at"] = {"$lte": filter_params.date_to}
            if filter_params.search:
                query["$or"] = [
                    {"title": {"$regex": filter_params.search, "$options": "i"}},
                    {"message": {"$regex": filter_params.search, "$options": "i"}}
                ]
            
            # الحصول على العدد الإجمالي
            total_count = await self.db.notifications.count_documents(query)
            
            # الحصول على الإشعارات مع الترقيم
            notifications = await self.db.notifications.find(query, {"_id": 0}) \
                .sort("created_at", -1) \
                .skip(filter_params.offset) \
                .limit(filter_params.limit) \
                .to_list(filter_params.limit)
            
            # إحصائيات سريعة
            unread_count = await self.db.notifications.count_documents({
                "recipient_id": user_id,
                "status": "unread"
            })
            
            return {
                "notifications": notifications,
                "total_count": total_count,
                "unread_count": unread_count,
                "has_more": (filter_params.offset + len(notifications)) < total_count,
                "filter_applied": filter_params.dict()
            }
            
        except Exception as e:
            self.logger.error(f"Error getting user notifications: {e}")
            raise

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """تحديد الإشعار كمقروء"""
        try:
            result = await self.db.notifications.update_one(
                {"id": notification_id, "recipient_id": user_id},
                {
                    "$set": {
                        "status": "read",
                        "read_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            self.logger.error(f"Error marking notification as read: {e}")
            return False

    async def mark_all_as_read(self, user_id: str) -> int:
        """تحديد جميع الإشعارات كمقروءة"""
        try:
            result = await self.db.notifications.update_many(
                {"recipient_id": user_id, "status": "unread"},
                {
                    "$set": {
                        "status": "read",
                        "read_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count
        except Exception as e:
            self.logger.error(f"Error marking all notifications as read: {e}")
            return 0

    async def dismiss_notification(self, notification_id: str, user_id: str) -> bool:
        """إلغاء الإشعار"""
        try:
            result = await self.db.notifications.update_one(
                {"id": notification_id, "recipient_id": user_id},
                {
                    "$set": {
                        "status": "dismissed",
                        "dismissed_at": datetime.utcnow()
                    }
                }
            )
            return result.modified_count > 0
        except Exception as e:
            self.logger.error(f"Error dismissing notification: {e}")
            return False

    async def get_notification_stats(self, user_id: str) -> NotificationStats:
        """الحصول على إحصائيات الإشعارات"""
        try:
            # إحصائيات أساسية
            total_notifications = await self.db.notifications.count_documents({"recipient_id": user_id})
            unread_count = await self.db.notifications.count_documents({"recipient_id": user_id, "status": "unread"})
            read_count = await self.db.notifications.count_documents({"recipient_id": user_id, "status": "read"})
            dismissed_count = await self.db.notifications.count_documents({"recipient_id": user_id, "status": "dismissed"})
            
            # إحصائيات حسب النوع
            type_pipeline = [
                {"$match": {"recipient_id": user_id}},
                {"$group": {"_id": "$type", "count": {"$sum": 1}}}
            ]
            type_stats = await self.db.notifications.aggregate(type_pipeline).to_list(50)
            by_type = {item["_id"]: item["count"] for item in type_stats}
            
            # إحصائيات حسب الأولوية
            priority_pipeline = [
                {"$match": {"recipient_id": user_id}},
                {"$group": {"_id": "$priority", "count": {"$sum": 1}}}
            ]
            priority_stats = await self.db.notifications.aggregate(priority_pipeline).to_list(10)
            by_priority = {item["_id"]: item["count"] for item in priority_stats}
            
            # الإشعارات الحديثة
            recent_notifications = await self.db.notifications.find(
                {"recipient_id": user_id},
                {"_id": 0}
            ).sort("created_at", -1).limit(5).to_list(5)
            
            return NotificationStats(
                total_notifications=total_notifications,
                unread_count=unread_count,
                read_count=read_count,
                dismissed_count=dismissed_count,
                by_type=by_type,
                by_priority=by_priority,
                recent_notifications=[Notification(**n) for n in recent_notifications]
            )
            
        except Exception as e:
            self.logger.error(f"Error getting notification stats: {e}")
            return NotificationStats()

    # الإشعارات التلقائية للأحداث المختلفة
    async def trigger_order_notification(self, order_data: Dict[str, Any], event_type: str):
        """إشعارات الطلبات"""
        try:
            if event_type == "new_order":
                # إشعار للمدير عن طلب جديد
                await self.create_notification(NotificationCreate(
                    title="طلب جديد يحتاج موافقة",
                    message=f"طلب جديد رقم {order_data.get('order_number')} من {order_data.get('clinic_name')}",
                    type=NotificationType.ORDER_NEW,
                    priority=NotificationPriority.HIGH,
                    recipient_id="admin",  # سيتم تحسينه لاحقاً
                    metadata={"order_id": order_data.get("id"), "amount": order_data.get("total_amount")},
                    action_url=f"/orders/{order_data.get('id')}"
                ))
                
                # إشعار للمندوب عن تأكيد استلام الطلب
                await self.create_notification(NotificationCreate(
                    title="تم استلام طلبك",
                    message=f"تم استلام طلبك رقم {order_data.get('order_number')} وهو قيد المراجعة",
                    type=NotificationType.ORDER_NEW,
                    priority=NotificationPriority.MEDIUM,
                    recipient_id=order_data.get("medical_rep_id"),
                    metadata={"order_id": order_data.get("id")},
                    action_url=f"/orders/{order_data.get('id')}"
                ))
                
        except Exception as e:
            self.logger.error(f"Error triggering order notification: {e}")

    async def trigger_debt_notification(self, clinic_data: Dict[str, Any], debt_amount: float):
        """إشعارات المديونية"""
        try:
            priority = NotificationPriority.URGENT if debt_amount > 5000 else NotificationPriority.HIGH
            notification_type = NotificationType.DEBT_CRITICAL if debt_amount > 5000 else NotificationType.DEBT_WARNING
            
            # إشعار للمندوب المسؤول
            if clinic_data.get("assigned_rep_id"):
                await self.create_notification(NotificationCreate(
                    title=f"تحذير مديونية - {clinic_data.get('name')}",
                    message=f"العيادة {clinic_data.get('name')} لديها مديونية قدرها {debt_amount:.2f} ج.م",
                    type=notification_type,
                    priority=priority,
                    recipient_id=clinic_data.get("assigned_rep_id"),
                    metadata={"clinic_id": clinic_data.get("id"), "debt_amount": debt_amount},
                    action_url=f"/clinics/{clinic_data.get('id')}"
                ))
            
            # إشعار للمحاسب
            await self.create_bulk_notification(BulkNotificationCreate(
                recipients=[],
                recipient_roles=["accounting", "admin"],
                title=f"مديونية مرتفعة - {clinic_data.get('name')}",
                message=f"العيادة {clinic_data.get('name')} تحتاج متابعة مالية - المديونية: {debt_amount:.2f} ج.م",
                type=notification_type,
                priority=priority,
                metadata={"clinic_id": clinic_data.get("id"), "debt_amount": debt_amount}
            ))
            
        except Exception as e:
            self.logger.error(f"Error triggering debt notification: {e}")

    async def trigger_visit_reminder(self, user_id: str, clinic_data: Dict[str, Any]):
        """تذكير الزيارات"""
        try:
            await self.create_notification(NotificationCreate(
                title="تذكير زيارة",
                message=f"لم تقم بزيارة {clinic_data.get('name')} لأكثر من أسبوع",
                type=NotificationType.VISIT_REMINDER,
                priority=NotificationPriority.MEDIUM,
                recipient_id=user_id,
                metadata={"clinic_id": clinic_data.get("id")},
                action_url=f"/visits/new?clinic_id={clinic_data.get('id')}"
            ))
        except Exception as e:
            self.logger.error(f"Error triggering visit reminder: {e}")

    async def trigger_stock_alert(self, product_data: Dict[str, Any], stock_level: str):
        """تنبيهات المخزون"""
        try:
            title = "نفاد المخزون" if stock_level == "out" else "مخزون منخفض"
            notification_type = NotificationType.STOCK_OUT if stock_level == "out" else NotificationType.STOCK_LOW
            priority = NotificationPriority.URGENT if stock_level == "out" else NotificationPriority.HIGH
            
            await self.create_bulk_notification(BulkNotificationCreate(
                recipients=[],
                recipient_roles=["warehouse_keeper", "admin"],
                title=f"{title} - {product_data.get('name')}",
                message=f"المنتج {product_data.get('name')} {title.lower()}",
                type=notification_type,
                priority=priority,
                metadata={"product_id": product_data.get("id"), "current_stock": product_data.get("current_stock", 0)}
            ))
        except Exception as e:
            self.logger.error(f"Error triggering stock alert: {e}")

    async def _send_real_time_notification(self, notification: Notification):
        """إرسال الإشعار الفوري عبر WebSocket"""
        try:
            real_time_notification = RealTimeNotification(
                notification_id=notification.id,
                type=notification.type,
                title=notification.title,
                message=notification.message,
                priority=notification.priority,
                timestamp=notification.created_at,
                metadata=notification.metadata
            )
            
            # إرسال للمستخدم المحدد إذا كان متصلاً
            if notification.recipient_id in self.active_connections:
                connection = self.active_connections[notification.recipient_id]
                await connection.send_json(real_time_notification.dict())
                
        except Exception as e:
            self.logger.error(f"Error sending real-time notification: {e}")

    def add_connection(self, user_id: str, websocket):
        """إضافة اتصال WebSocket"""
        self.active_connections[user_id] = websocket

    def remove_connection(self, user_id: str):
        """إزالة اتصال WebSocket"""
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def cleanup_old_notifications(self, days_old: int = 30):
        """تنظيف الإشعارات القديمة"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            result = await self.db.notifications.delete_many({
                "created_at": {"$lt": cutoff_date},
                "status": {"$in": ["read", "dismissed"]}
            })
            self.logger.info(f"Cleaned up {result.deleted_count} old notifications")
            return result.deleted_count
        except Exception as e:
            self.logger.error(f"Error cleaning up notifications: {e}")
            return 0