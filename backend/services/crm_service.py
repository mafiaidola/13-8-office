# CRM Service - خدمة إدارة العلاقات مع العملاء
import asyncio
import logging
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from models.crm_models import *

class CRMService:
    def __init__(self, db):
        self.db = db
        self.logger = logging.getLogger(__name__)
        
    async def create_interaction(self, interaction_data: ClientInteractionCreate, rep_id: str, rep_name: str) -> ClientInteraction:
        """إنشاء تفاعل جديد مع العميل"""
        try:
            # الحصول على معلومات العميل
            client = await self.db.clinics.find_one({"id": interaction_data.client_id})
            if not client:
                raise ValueError("العميل غير موجود")
            
            # إنشاء التفاعل
            interaction = ClientInteraction(
                **interaction_data.dict(),
                rep_id=rep_id,
                rep_name=rep_name,
                client_name=client.get("name", "غير محدد"),
                status=InteractionStatus.PLANNED
            )
            
            # حفظ في قاعدة البيانات
            await self.db.client_interactions.insert_one(interaction.dict())
            
            # تحديث ملف العميل
            await self._update_client_interaction_summary(interaction_data.client_id)
            
            self.logger.info(f"Created interaction {interaction.id} for client {interaction_data.client_id}")
            return interaction
            
        except Exception as e:
            self.logger.error(f"Error creating interaction: {e}")
            raise

    async def complete_interaction(self, interaction_id: str, outcome: str, notes: str, next_action: str = None, follow_up_date: datetime = None) -> bool:
        """إكمال تفاعل مع العميل"""
        try:
            result = await self.db.client_interactions.update_one(
                {"id": interaction_id},
                {
                    "$set": {
                        "status": InteractionStatus.COMPLETED,
                        "actual_date": datetime.utcnow(),
                        "outcome": outcome,
                        "notes": notes,
                        "next_action": next_action,
                        "follow_up_date": follow_up_date,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                # الحصول على التفاعل لتحديث ملف العميل
                interaction = await self.db.client_interactions.find_one({"id": interaction_id})
                if interaction:
                    await self._update_client_interaction_summary(interaction["client_id"])
                    
                    # إنشاء مهمة متابعة إذا لزم الأمر
                    if follow_up_date and next_action:
                        await self.create_follow_up_task(
                            client_id=interaction["client_id"],
                            assigned_to=interaction["rep_id"],
                            title=f"متابعة: {next_action}",
                            due_date=follow_up_date,
                            related_interaction_id=interaction_id,
                            created_by=interaction["rep_id"]
                        )
                
                return True
            return False
            
        except Exception as e:
            self.logger.error(f"Error completing interaction: {e}")
            return False

    async def get_client_interactions(self, client_id: str, limit: int = 50) -> List[Dict]:
        """الحصول على تفاعلات العميل"""
        try:
            interactions = await self.db.client_interactions.find(
                {"client_id": client_id},
                {"_id": 0}
            ).sort("scheduled_date", -1).limit(limit).to_list(limit)
            
            # تنسيق التواريخ
            for interaction in interactions:
                for date_field in ["scheduled_date", "actual_date", "follow_up_date", "created_at", "updated_at"]:
                    if interaction.get(date_field) and isinstance(interaction[date_field], datetime):
                        interaction[date_field] = interaction[date_field].isoformat()
            
            return interactions
            
        except Exception as e:
            self.logger.error(f"Error getting client interactions: {e}")
            return []

    async def create_client_profile(self, clinic_id: str, assigned_rep_id: str) -> ClientProfile:
        """إنشاء ملف عميل جديد"""
        try:
            # التحقق من وجود العيادة
            clinic = await self.db.clinics.find_one({"id": clinic_id})
            if not clinic:
                raise ValueError("العيادة غير موجودة")
            
            # التحقق من عدم وجود ملف مسبق
            existing_profile = await self.db.client_profiles.find_one({"clinic_id": clinic_id})
            if existing_profile:
                return ClientProfile(**existing_profile)
            
            # إنشاء ملف جديد
            profile = ClientProfile(
                clinic_id=clinic_id,
                assigned_rep_id=assigned_rep_id
            )
            
            # حساب الإحصائيات الأولية
            await self._calculate_client_metrics(profile)
            
            # حفظ في قاعدة البيانات
            await self.db.client_profiles.insert_one(profile.dict())
            
            self.logger.info(f"Created client profile for clinic {clinic_id}")
            return profile
            
        except Exception as e:
            self.logger.error(f"Error creating client profile: {e}")
            raise

    async def get_client_profile(self, clinic_id: str) -> Optional[ClientProfile]:
        """الحصول على ملف العميل"""
        try:
            profile_data = await self.db.client_profiles.find_one({"clinic_id": clinic_id}, {"_id": 0})
            if profile_data:
                # تحديث الإحصائيات
                profile = ClientProfile(**profile_data)
                await self._calculate_client_metrics(profile)
                
                # تحديث في قاعدة البيانات
                await self.db.client_profiles.update_one(
                    {"clinic_id": clinic_id},
                    {"$set": profile.dict()}
                )
                
                return profile
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting client profile: {e}")
            return None

    async def update_client_profile(self, clinic_id: str, updates: Dict[str, Any]) -> bool:
        """تحديث ملف العميل"""
        try:
            updates["updated_at"] = datetime.utcnow()
            
            result = await self.db.client_profiles.update_one(
                {"clinic_id": clinic_id},
                {"$set": updates}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            self.logger.error(f"Error updating client profile: {e}")
            return False

    async def create_follow_up_task(self, client_id: str, assigned_to: str, title: str, due_date: datetime, created_by: str, **kwargs) -> FollowUpTask:
        """إنشاء مهمة متابعة"""
        try:
            task = FollowUpTask(
                client_id=client_id,
                assigned_to=assigned_to,
                created_by=created_by,
                title=title,
                due_date=due_date,
                **kwargs
            )
            
            await self.db.follow_up_tasks.insert_one(task.dict())
            
            self.logger.info(f"Created follow-up task {task.id} for client {client_id}")
            return task
            
        except Exception as e:
            self.logger.error(f"Error creating follow-up task: {e}")
            raise

    async def get_pending_tasks(self, assigned_to: str, limit: int = 50) -> List[Dict]:
        """الحصول على المهام المعلقة"""
        try:
            tasks = await self.db.follow_up_tasks.find(
                {
                    "assigned_to": assigned_to,
                    "status": {"$in": ["pending", "in_progress"]}
                },
                {"_id": 0}
            ).sort("due_date", 1).limit(limit).to_list(limit)
            
            # إضافة معلومات العميل
            for task in tasks:
                client = await self.db.clinics.find_one({"id": task["client_id"]}, {"name": 1})
                task["client_name"] = client.get("name", "غير محدد") if client else "غير محدد"
                
                # تنسيق التواريخ
                for date_field in ["due_date", "reminder_date", "created_at", "completed_at"]:
                    if task.get(date_field) and isinstance(task[date_field], datetime):
                        task[date_field] = task[date_field].isoformat()
                        
                # تحديد حالة التأخير
                if task.get("due_date") and isinstance(task.get("due_date"), str):
                    due_date = datetime.fromisoformat(task["due_date"].replace('Z', '+00:00'))
                    task["is_overdue"] = due_date < datetime.utcnow()
            
            return tasks
            
        except Exception as e:
            self.logger.error(f"Error getting pending tasks: {e}")
            return []

    async def complete_task(self, task_id: str, completion_notes: str) -> bool:
        """إكمال مهمة"""
        try:
            result = await self.db.follow_up_tasks.update_one(
                {"id": task_id},
                {
                    "$set": {
                        "status": "completed",
                        "completion_notes": completion_notes,
                        "completed_at": datetime.utcnow()
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            self.logger.error(f"Error completing task: {e}")
            return False

    async def search_clients(self, search_filter: ClientSearchFilter, rep_id: str = None) -> Dict[str, Any]:
        """البحث في العملاء مع الفلترة"""
        try:
            # بناء استعلام البحث
            query = {}
            
            if rep_id:
                query["assigned_rep_id"] = rep_id
            
            if search_filter.status:
                query["status"] = search_filter.status
            
            if search_filter.priority:
                query["priority"] = search_filter.priority
            
            if search_filter.assigned_rep_id:
                query["assigned_rep_id"] = search_filter.assigned_rep_id
            
            if search_filter.category:
                query["category"] = search_filter.category
            
            if search_filter.last_interaction_days:
                cutoff_date = datetime.utcnow() - timedelta(days=search_filter.last_interaction_days)
                query["last_interaction_date"] = {"$lt": cutoff_date}
            
            if search_filter.order_value_min or search_filter.order_value_max:
                value_query = {}
                if search_filter.order_value_min:
                    value_query["$gte"] = search_filter.order_value_min
                if search_filter.order_value_max:
                    value_query["$lte"] = search_filter.order_value_max
                query["total_order_value"] = value_query
            
            if search_filter.tags:
                query["tags"] = {"$in": search_filter.tags}
            
            # النص البحثي
            if search_filter.search_text:
                # البحث في العيادات المرتبطة
                clinic_query = {
                    "$or": [
                        {"name": {"$regex": search_filter.search_text, "$options": "i"}},
                        {"address": {"$regex": search_filter.search_text, "$options": "i"}},
                        {"phone": {"$regex": search_filter.search_text, "$options": "i"}}
                    ]
                }
                matching_clinics = await self.db.clinics.find(clinic_query, {"id": 1}).to_list(1000)
                clinic_ids = [clinic["id"] for clinic in matching_clinics]
                query["clinic_id"] = {"$in": clinic_ids}
            
            # العدد الإجمالي
            total_count = await self.db.client_profiles.count_documents(query)
            
            # الحصول على النتائج
            profiles = await self.db.client_profiles.find(
                query, {"_id": 0}
            ).sort("updated_at", -1).skip(search_filter.offset).limit(search_filter.limit).to_list(search_filter.limit)
            
            # إضافة معلومات العيادة
            for profile in profiles:
                clinic = await self.db.clinics.find_one({"id": profile["clinic_id"]})
                if clinic:
                    profile["clinic_info"] = {
                        "name": clinic.get("name", "غير محدد"),
                        "address": clinic.get("address", "غير محدد"),
                        "phone": clinic.get("phone", "غير محدد")
                    }
                
                # تنسيق التواريخ
                for date_field in ["last_interaction_date", "next_scheduled_interaction", "last_order_date", "created_at", "updated_at"]:
                    if profile.get(date_field) and isinstance(profile[date_field], datetime):
                        profile[date_field] = profile[date_field].isoformat()
            
            return {
                "profiles": profiles,
                "total_count": total_count,
                "has_more": (search_filter.offset + len(profiles)) < total_count,
                "filter_applied": search_filter.dict()
            }
            
        except Exception as e:
            self.logger.error(f"Error searching clients: {e}")
            return {"profiles": [], "total_count": 0, "has_more": False}

    async def get_client_analytics(self, client_id: str) -> ClientAnalytics:
        """الحصول على تحليلات العميل"""
        try:
            # الحصول على معلومات العميل
            client = await self.db.clinics.find_one({"id": client_id})
            client_name = client.get("name", "غير محدد") if client else "غير محدد"
            
            analytics = ClientAnalytics(
                client_id=client_id,
                client_name=client_name
            )
            
            # تحليل التفاعلات
            total_interactions = await self.db.client_interactions.count_documents({"client_id": client_id})
            analytics.total_interactions = total_interactions
            
            # التفاعلات هذا الشهر
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            month_interactions = await self.db.client_interactions.count_documents({
                "client_id": client_id,
                "created_at": {"$gte": month_start}
            })
            analytics.interactions_this_month = month_interactions
            
            # الشهر الماضي
            last_month_start = (month_start - timedelta(days=1)).replace(day=1)
            last_month_interactions = await self.db.client_interactions.count_documents({
                "client_id": client_id,
                "created_at": {"$gte": last_month_start, "$lt": month_start}
            })
            analytics.interactions_last_month = last_month_interactions
            
            # تحليل الزيارات
            total_visits = await self.db.visits.count_documents({"clinic_id": client_id})
            successful_visits = await self.db.visits.count_documents({"clinic_id": client_id, "effective": True})
            analytics.total_visits = total_visits
            analytics.successful_visits = successful_visits
            analytics.visit_success_rate = (successful_visits / total_visits * 100) if total_visits > 0 else 0
            
            # آخر زيارة
            last_visit = await self.db.visits.find_one(
                {"clinic_id": client_id},
                sort=[("date", -1)]
            )
            if last_visit:
                analytics.last_visit_date = last_visit.get("date")
                if isinstance(analytics.last_visit_date, datetime):
                    analytics.days_since_last_visit = (datetime.utcnow() - analytics.last_visit_date).days
            
            # تحليل الطلبات
            orders = await self.db.orders.find({"clinic_id": client_id}).to_list(1000)
            analytics.total_orders = len(orders)
            
            if orders:
                total_value = sum(order.get("total_amount", 0) for order in orders)
                analytics.total_order_value = total_value
                analytics.average_order_value = total_value / len(orders)
                
                # طلبات هذا الشهر
                month_orders = [order for order in orders if order.get("created_at") and order["created_at"] >= month_start]
                analytics.orders_this_month = len(month_orders)
            
            # حساب نقاط الصحة
            health_score = self._calculate_health_score(analytics)
            analytics.health_score = health_score
            
            # التوصيات
            recommendations = self._generate_recommendations(analytics)
            analytics.recommendations = recommendations
            
            return analytics
            
        except Exception as e:
            self.logger.error(f"Error getting client analytics: {e}")
            return ClientAnalytics(client_id=client_id, client_name="خطأ في البيانات")

    async def get_crm_dashboard(self, rep_id: str = None) -> CRMDashboard:
        """الحصول على لوحة معلومات CRM"""
        try:
            dashboard = CRMDashboard()
            
            # بناء الاستعلام حسب المندوب
            query = {}
            if rep_id:
                query["assigned_rep_id"] = rep_id
            
            # إحصائيات العملاء
            dashboard.total_clients = await self.db.client_profiles.count_documents(query)
            dashboard.active_clients = await self.db.client_profiles.count_documents({**query, "status": "active"})
            
            # العملاء الجدد هذا الشهر
            month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            dashboard.new_clients_this_month = await self.db.client_profiles.count_documents({
                **query,
                "created_at": {"$gte": month_start}
            })
            
            # التفاعلات هذا الشهر
            interaction_query = {"scheduled_date": {"$gte": month_start}}
            if rep_id:
                interaction_query["rep_id"] = rep_id
            
            dashboard.total_interactions_this_month = await self.db.client_interactions.count_documents(interaction_query)
            
            # المهام المعلقة
            task_query = {"status": {"$in": ["pending", "in_progress"]}}
            if rep_id:
                task_query["assigned_to"] = rep_id
            
            dashboard.pending_follow_ups = await self.db.follow_up_tasks.count_documents(task_query)
            
            # المهام المتأخرة
            overdue_query = {**task_query, "due_date": {"$lt": datetime.utcnow()}}
            dashboard.overdue_tasks = await self.db.follow_up_tasks.count_documents(overdue_query)
            
            # أفضل العملاء
            top_clients = await self.db.client_profiles.find(
                query,
                {"_id": 0, "clinic_id": 1, "total_order_value": 1}
            ).sort("total_order_value", -1).limit(5).to_list(5)
            
            for client in top_clients:
                clinic = await self.db.clinics.find_one({"id": client["clinic_id"]}, {"name": 1})
                client["clinic_name"] = clinic.get("name", "غير محدد") if clinic else "غير محدد"
            
            dashboard.top_clients = top_clients
            
            return dashboard
            
        except Exception as e:
            self.logger.error(f"Error getting CRM dashboard: {e}")
            return CRMDashboard()

    # Helper Methods
    async def _update_client_interaction_summary(self, client_id: str):
        """تحديث ملخص تفاعلات العميل"""
        try:
            # عدد التفاعلات
            total_interactions = await self.db.client_interactions.count_documents({"client_id": client_id})
            
            # آخر تفاعل
            last_interaction = await self.db.client_interactions.find_one(
                {"client_id": client_id},
                sort=[("scheduled_date", -1)]
            )
            
            # التفاعل التالي المجدول
            next_interaction = await self.db.client_interactions.find_one(
                {
                    "client_id": client_id,
                    "status": "planned",
                    "scheduled_date": {"$gt": datetime.utcnow()}
                },
                sort=[("scheduled_date", 1)]
            )
            
            updates = {
                "total_interactions": total_interactions,
                "updated_at": datetime.utcnow()
            }
            
            if last_interaction:
                updates["last_interaction_date"] = last_interaction.get("scheduled_date")
                updates["last_interaction_type"] = last_interaction.get("interaction_type")
            
            if next_interaction:
                updates["next_scheduled_interaction"] = next_interaction.get("scheduled_date")
            
            await self.db.client_profiles.update_one(
                {"clinic_id": client_id},
                {"$set": updates},
                upsert=True
            )
            
        except Exception as e:
            self.logger.error(f"Error updating client interaction summary: {e}")

    async def _calculate_client_metrics(self, profile: ClientProfile):
        """حساب مقاييس العميل"""
        try:
            # إحصائيات الطلبات
            orders = await self.db.orders.find({"clinic_id": profile.clinic_id}).to_list(1000)
            
            profile.total_orders = len(orders)
            if orders:
                total_value = sum(order.get("total_amount", 0) for order in orders)
                profile.total_order_value = total_value
                profile.average_order_value = total_value / len(orders)
                
                # آخر طلب
                last_order = max(orders, key=lambda x: x.get("created_at", datetime.min))
                profile.last_order_date = last_order.get("created_at")
            
        except Exception as e:
            self.logger.error(f"Error calculating client metrics: {e}")

    def _calculate_health_score(self, analytics: ClientAnalytics) -> float:
        """حساب نقاط صحة العلاقة مع العميل"""
        score = 0.0
        
        # التفاعل الأخير (30 نقطة كحد أقصى)
        if analytics.days_since_last_visit is not None:
            if analytics.days_since_last_visit <= 7:
                score += 30
            elif analytics.days_since_last_visit <= 14:
                score += 20
            elif analytics.days_since_last_visit <= 30:
                score += 10
        
        # معدل نجاح الزيارات (25 نقطة كحد أقصى)
        score += (analytics.visit_success_rate / 100) * 25
        
        # تكرار الطلبات (25 نقطة كحد أقصى)
        if analytics.total_orders > 10:
            score += 25
        elif analytics.total_orders > 5:
            score += 15
        elif analytics.total_orders > 0:
            score += 10
        
        # قيمة الطلبات (20 نقطة كحد أقصى)
        if analytics.total_order_value > 10000:
            score += 20
        elif analytics.total_order_value > 5000:
            score += 15
        elif analytics.total_order_value > 1000:
            score += 10
        
        return min(score, 100.0)

    def _generate_recommendations(self, analytics: ClientAnalytics) -> List[str]:
        """إنتاج توصيات بناءً على التحليلات"""
        recommendations = []
        
        if analytics.days_since_last_visit and analytics.days_since_last_visit > 30:
            recommendations.append("يحتاج إلى زيارة عاجلة - لم تتم زيارته لأكثر من شهر")
        
        if analytics.visit_success_rate < 50:
            recommendations.append("معدل نجاح الزيارات منخفض - راجع استراتيجية الزيارة")
        
        if analytics.total_orders == 0:
            recommendations.append("لم يقم بأي طلبات - ركز على العروض التقديمية")
        
        if analytics.interactions_this_month == 0:
            recommendations.append("لا توجد تفاعلات هذا الشهر - تواصل فوري مطلوب")
        
        if analytics.average_order_value > 0 and analytics.orders_this_month == 0:
            recommendations.append("عميل نشط لكن لا توجد طلبات هذا الشهر - متابعة مطلوبة")
        
        return recommendations