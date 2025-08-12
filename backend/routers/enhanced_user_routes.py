# Enhanced User Routes - مسارات إدارة المستخدمين المحسنة مع الإحصائيات
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import uuid
from pydantic import BaseModel
import jwt

# إعداد قاعدة البيانات والأمان
security = HTTPBearer()
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

router = APIRouter(prefix="/api/enhanced-users", tags=["Enhanced Users"])

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    payload = verify_jwt_token(token)
    return payload

@router.get("/with-statistics")
async def get_users_with_statistics(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع المستخدمين مع إحصائياتهم الحقيقية"""
    try:
        users = []
        cursor = db.users.find({}, {"password": 0}).sort("full_name", 1)
        
        async for user in cursor:
            user_id = user["id"]
            
            # إحصائيات الزيارات
            visits_count = await db.visits.count_documents({"rep_id": user_id})
            visits_this_month = await db.visits.count_documents({
                "rep_id": user_id,
                "visit_date": {"$gte": datetime.now().replace(day=1).isoformat()}
            })
            
            # إحصائيات العيادات المضافة
            clinics_count = await db.clinics.count_documents({"rep_id": user_id})
            clinics_this_month = await db.clinics.count_documents({
                "rep_id": user_id,
                "created_at": {"$gte": datetime.now().replace(day=1).isoformat()}
            })
            
            # إحصائيات الفواتير والمبيعات
            invoices_cursor = db.invoices.find({"rep_id": user_id})
            total_sales = 0
            invoices_count = 0
            async for invoice in invoices_cursor:
                invoices_count += 1
                total_sales += invoice.get("amount", 0)
            
            # إحصائيات التحصيل
            collections_cursor = db.collections.find({"rep_id": user_id})
            total_collections = 0
            collections_count = 0
            async for collection in collections_cursor:
                collections_count += 1
                total_collections += collection.get("amount", 0)
            
            # إحصائيات الديون
            debts_cursor = db.debts.find({"rep_id": user_id})
            total_debts = 0
            debts_count = 0
            async for debt in debts_cursor:
                debts_count += 1
                total_debts += debt.get("amount", 0)
            
            # آخر نشاط من سجل الأنشطة
            last_activity = await db.activities.find_one(
                {"user_id": user_id},
                sort=[("timestamp", -1)]
            )
            
            # إحصائيات الأنشطة
            activities_count = await db.activities.count_documents({"user_id": user_id})
            activities_today = await db.activities.count_documents({
                "user_id": user_id,
                "timestamp": {"$gte": datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
            })
            
            # معلومات الخط والمنطقة
            line_info = None
            area_info = None
            if user.get("line_id"):
                line_info = await db.lines.find_one({"id": user["line_id"]})
            if user.get("area_id"):
                area_info = await db.areas.find_one({"id": user["area_id"]})
            
            # معلومات المدير
            manager_info = None
            if user.get("manager_id"):
                manager_info = await db.users.find_one({"id": user["manager_id"]})
            
            # إضافة الإحصائيات للمستخدم
            user.update({
                # إحصائيات الزيارات
                "visits_count": visits_count,
                "visits_this_month": visits_this_month,
                
                # إحصائيات العيادات
                "clinics_count": clinics_count,
                "clinics_this_month": clinics_this_month,
                
                # إحصائيات المالية
                "sales_count": invoices_count,
                "total_sales": total_sales,
                "collections_count": collections_count,
                "total_collections": total_collections,
                "debts_count": debts_count,
                "total_debts": total_debts,
                
                # إحصائيات النشاط
                "activities_count": activities_count,
                "activities_today": activities_today,
                "last_activity": last_activity.get("timestamp") if last_activity else None,
                
                # معلومات إضافية
                "line_name": line_info["name"] if line_info else None,
                "area_name": area_info["name"] if area_info else None,
                "manager_name": manager_info["full_name"] if manager_info else None,
                
                # تنسيق التواريخ
                "created_at": user.get("created_at"),
                "last_login": user.get("last_login"),
                
                # حالة النشاط
                "status": "active" if user.get("is_active", True) else "inactive"
            })
            
            users.append(user)
        
        return {
            "success": True,
            "users": users,
            "total_count": len(users),
            "active_count": len([u for u in users if u.get("is_active", True)]),
            "inactive_count": len([u for u in users if not u.get("is_active", True)])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل المستخدمين: {str(e)}")

@router.get("/{user_id}/detailed-statistics")
async def get_user_detailed_statistics(user_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على إحصائيات تفصيلية لمستخدم محدد"""
    try:
        # التحقق من وجود المستخدم
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="المستخدم غير موجود")
        
        # إحصائيات الزيارات التفصيلية
        visits_pipeline = [
            {"$match": {"rep_id": user_id}},
            {"$group": {
                "_id": "$visit_type",
                "count": {"$sum": 1}
            }}
        ]
        visits_by_type = list(await db.visits.aggregate(visits_pipeline).to_list(length=None))
        
        # إحصائيات الزيارات الشهرية (آخر 6 أشهر)
        monthly_visits_pipeline = [
            {"$match": {"rep_id": user_id}},
            {"$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": {"$dateFromString": {"dateString": "$visit_date"}}}},
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": -1}},
            {"$limit": 6}
        ]
        monthly_visits = list(await db.visits.aggregate(monthly_visits_pipeline).to_list(length=None))
        
        # إحصائيات العيادات حسب التصنيف
        clinics_pipeline = [
            {"$match": {"rep_id": user_id}},
            {"$group": {
                "_id": "$classification",
                "count": {"$sum": 1}
            }}
        ]
        clinics_by_classification = list(await db.clinics.aggregate(clinics_pipeline).to_list(length=None))
        
        # إحصائيات الأنشطة حسب النوع
        activities_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$action",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        activities_by_type = list(await db.activities.aggregate(activities_pipeline).to_list(length=None))
        
        # الأنشطة الحديثة (آخر 20)
        recent_activities = []
        cursor = db.activities.find({"user_id": user_id}).sort("timestamp", -1).limit(20)
        async for activity in cursor:
            activity["timestamp"] = activity["timestamp"].isoformat()
            recent_activities.append(activity)
        
        return {
            "success": True,
            "user_info": {
                "id": user["id"],
                "full_name": user["full_name"],
                "username": user["username"],
                "role": user["role"]
            },
            "statistics": {
                "visits": {
                    "by_type": visits_by_type,
                    "monthly_trend": monthly_visits
                },
                "clinics": {
                    "by_classification": clinics_by_classification
                },
                "activities": {
                    "by_type": activities_by_type,
                    "recent": recent_activities
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الإحصائيات التفصيلية: {str(e)}")

@router.get("/performance-metrics")
async def get_users_performance_metrics(current_user: dict = Depends(get_current_user)):
    """الحصول على مقاييس الأداء للمستخدمين"""
    try:
        # أفضل المناديب في الزيارات
        top_visits_pipeline = [
            {"$group": {
                "_id": "$rep_id",
                "visits_count": {"$sum": 1}
            }},
            {"$sort": {"visits_count": -1}},
            {"$limit": 10}
        ]
        top_visits = list(await db.visits.aggregate(top_visits_pipeline).to_list(length=None))
        
        # أفضل المناديب في المبيعات
        top_sales_pipeline = [
            {"$group": {
                "_id": "$rep_id",
                "total_sales": {"$sum": "$amount"},
                "sales_count": {"$sum": 1}
            }},
            {"$sort": {"total_sales": -1}},
            {"$limit": 10}
        ]
        top_sales = list(await db.invoices.aggregate(top_sales_pipeline).to_list(length=None))
        
        # أفضل المناديب في إضافة العيادات
        top_clinics_pipeline = [
            {"$group": {
                "_id": "$rep_id",
                "clinics_count": {"$sum": 1}
            }},
            {"$sort": {"clinics_count": -1}},
            {"$limit": 10}
        ]
        top_clinics = list(await db.clinics.aggregate(top_clinics_pipeline).to_list(length=None))
        
        # إضافة أسماء المستخدمين
        for item_list in [top_visits, top_sales, top_clinics]:
            for item in item_list:
                if item["_id"]:
                    user = await db.users.find_one({"id": item["_id"]})
                    item["user_name"] = user["full_name"] if user else "مستخدم محذوف"
        
        return {
            "success": True,
            "performance_metrics": {
                "top_visits": top_visits,
                "top_sales": top_sales,
                "top_clinics": top_clinics
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل مقاييس الأداء: {str(e)}")