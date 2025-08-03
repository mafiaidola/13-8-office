# Notification API Routes - مسارات API للإشعارات المتقدمة
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import json
import logging

from models.notification_models import *
from services.notification_service import NotificationService
from models.all_models import User
import os
from motor.motor_asyncio import AsyncIOMotorClient
import jwt

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Initialize notification service
notification_service = NotificationService(db)

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """الحصول على المستخدم الحالي"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", response_model=dict)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء إشعار جديد"""
    try:
        # التحقق من الصلاحيات
        if current_user["role"] not in ["admin", "gm", "manager"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء إشعارات")
        
        notification = await notification_service.create_notification(notification_data)
        
        return {
            "success": True,
            "message": "تم إنشاء الإشعار بنجاح",
            "notification_id": notification.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الإشعار: {str(e)}")

@router.post("/bulk", response_model=dict)
async def create_bulk_notifications(
    bulk_data: BulkNotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء إشعارات متعددة"""
    try:
        # التحقق من الصلاحيات
        if current_user["role"] not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء إشعارات متعددة")
        
        notification_ids = await notification_service.create_bulk_notification(bulk_data)
        
        return {
            "success": True,
            "message": f"تم إنشاء {len(notification_ids)} إشعار",
            "notification_ids": notification_ids
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الإشعارات: {str(e)}")

@router.get("/", response_model=dict)
async def get_my_notifications(
    status: Optional[NotificationStatus] = None,
    type: Optional[NotificationType] = None,
    priority: Optional[NotificationPriority] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """الحصول على إشعاراتي مع الفلترة"""
    try:
        filter_params = NotificationFilter(
            status=status,
            type=type,
            priority=priority,
            date_from=date_from,
            date_to=date_to,
            search=search,
            limit=limit,
            offset=offset
        )
        
        result = await notification_service.get_user_notifications(
            current_user["id"], 
            filter_params
        )
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإشعارات: {str(e)}")

@router.patch("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """تحديد الإشعار كمقروء"""
    try:
        success = await notification_service.mark_as_read(notification_id, current_user["id"])
        
        if not success:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        return {
            "success": True,
            "message": "تم تحديد الإشعار كمقروء"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإشعار: {str(e)}")

@router.patch("/read-all", response_model=dict)
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user)
):
    """تحديد جميع الإشعارات كمقروءة"""
    try:
        count = await notification_service.mark_all_as_read(current_user["id"])
        
        return {
            "success": True,
            "message": f"تم تحديد {count} إشعار كمقروء",
            "updated_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإشعارات: {str(e)}")

@router.delete("/{notification_id}", response_model=dict)
async def dismiss_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """إلغاء الإشعار"""
    try:
        success = await notification_service.dismiss_notification(notification_id, current_user["id"])
        
        if not success:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        return {
            "success": True,
            "message": "تم إلغاء الإشعار"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إلغاء الإشعار: {str(e)}")

@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    current_user: dict = Depends(get_current_user)
):
    """الحصول على إحصائيات الإشعارات"""
    try:
        stats = await notification_service.get_notification_stats(current_user["id"])
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإحصائيات: {str(e)}")

@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """الحصول على عدد الإشعارات غير المقروءة"""
    try:
        count = await db.notifications.count_documents({
            "recipient_id": current_user["id"],
            "status": "unread"
        })
        
        return {
            "success": True,
            "unread_count": count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب العدد: {str(e)}")

# WebSocket للإشعارات الفورية
@router.websocket("/ws/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: str):
    """WebSocket للإشعارات الفورية"""
    await websocket.accept()
    notification_service.add_connection(user_id, websocket)
    
    try:
        while True:
            # استقبال ping للحفاظ على الاتصال
            data = await websocket.receive_text()
            
            # إرسال pong
            if data == "ping":
                await websocket.send_text("pong")
                
    except WebSocketDisconnect:
        notification_service.remove_connection(user_id)
        logging.info(f"WebSocket disconnected for user {user_id}")
    except Exception as e:
        logging.error(f"WebSocket error for user {user_id}: {e}")
        notification_service.remove_connection(user_id)

# مسارات إدارية للإشعارات
@router.get("/admin/all", response_model=dict)
async def get_all_notifications_admin(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """الحصول على جميع الإشعارات - للإدارة فقط"""
    try:
        if current_user["role"] not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        total_count = await db.notifications.count_documents({})
        notifications = await db.notifications.find({}, {"_id": 0}) \
            .sort("created_at", -1) \
            .skip(offset) \
            .limit(limit) \
            .to_list(limit)
        
        return {
            "success": True,
            "data": {
                "notifications": notifications,
                "total_count": total_count,
                "has_more": (offset + len(notifications)) < total_count
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإشعارات: {str(e)}")

@router.delete("/admin/cleanup", response_model=dict)
async def cleanup_old_notifications(
    days_old: int = Query(30, ge=1, le=365),
    current_user: dict = Depends(get_current_user)
):
    """تنظيف الإشعارات القديمة - للإدارة فقط"""
    try:
        if current_user["role"] not in ["admin"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        deleted_count = await notification_service.cleanup_old_notifications(days_old)
        
        return {
            "success": True,
            "message": f"تم حذف {deleted_count} إشعار قديم",
            "deleted_count": deleted_count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التنظيف: {str(e)}")

# Trigger routes for testing (development only)
@router.post("/test/order-notification", response_model=dict)
async def test_order_notification(
    current_user: dict = Depends(get_current_user)
):
    """اختبار إشعار الطلبات - للتطوير فقط"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        # إنشاء بيانات طلب وهمية للاختبار
        test_order_data = {
            "id": "test-order-123",
            "order_number": "ORD-20250103-1234",
            "clinic_name": "عيادة الاختبار",
            "medical_rep_id": current_user["id"],
            "total_amount": 1500.0
        }
        
        await notification_service.trigger_order_notification(test_order_data, "new_order")
        
        return {
            "success": True,
            "message": "تم إرسال إشعار اختبار الطلب"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في الاختبار: {str(e)}")

@router.post("/test/debt-notification", response_model=dict)
async def test_debt_notification(
    current_user: dict = Depends(get_current_user)
):
    """اختبار إشعار المديونية - للتطوير فقط"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        # بيانات عيادة وهمية للاختبار
        test_clinic_data = {
            "id": "test-clinic-123",
            "name": "عيادة الاختبار للمديونية",
            "assigned_rep_id": current_user["id"]
        }
        
        await notification_service.trigger_debt_notification(test_clinic_data, 3500.0)
        
        return {
            "success": True,
            "message": "تم إرسال إشعار اختبار المديونية"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في الاختبار: {str(e)}")