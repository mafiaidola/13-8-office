# Enhanced Activity Tracking Routes - مسارات تتبع الأنشطة المحسنة
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from datetime import datetime, timedelta
import uuid
import json
from pymongo import MongoClient
import os
from ..models.activity_models import ActivityCreate, ActivityResponse, ActivityFilter, LocationData, DeviceInfo
from user_agent import parse
import requests

router = APIRouter(prefix="/api/activities", tags=["Enhanced Activity Tracking"])

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = MongoClient(MONGO_URL)
db = client.medical_management
activities_collection = db.activities

def get_client_ip(request: Request) -> str:
    """استخراج IP الحقيقي للمستخدم"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def parse_user_agent(user_agent: str) -> dict:
    """تحليل User Agent لاستخراج معلومات الجهاز"""
    try:
        parsed = parse(user_agent)
        return {
            "browser": f"{parsed.browser.family} {parsed.browser.version_string}",
            "os": f"{parsed.os.family} {parsed.os.version_string}",
            "device_type": "Mobile" if parsed.is_mobile else "Tablet" if parsed.is_tablet else "Desktop",
            "device_family": parsed.device.family
        }
    except:
        return {
            "browser": "Unknown",
            "os": "Unknown", 
            "device_type": "Unknown",
            "device_family": "Unknown"
        }

def get_location_info(ip_address: str) -> dict:
    """الحصول على معلومات الموقع من IP"""
    try:
        # استخدام خدمة مجانية للحصول على الموقع
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                return {
                    "city": data.get("city", "غير محدد"),
                    "country": data.get("country", "غير محدد"),
                    "region": data.get("regionName", "غير محدد"),
                    "latitude": data.get("lat"),
                    "longitude": data.get("lon"),
                    "timezone": data.get("timezone", "غير محدد"),
                    "isp": data.get("isp", "غير محدد")
                }
    except:
        pass
    
    return {
        "city": "غير محدد",
        "country": "غير محدد", 
        "region": "غير محدد",
        "timezone": "غير محدد"
    }

@router.post("/record", response_model=dict)
async def record_activity(request: Request, activity_data: dict):
    """تسجيل نشاط جديد بتفاصيل شاملة"""
    try:
        # استخراج معلومات الطلب
        ip_address = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        
        # تحليل User Agent
        device_info = parse_user_agent(user_agent)
        device_info["user_agent"] = user_agent
        device_info["ip_address"] = ip_address
        
        # الحصول على معلومات الموقع من IP
        location_from_ip = get_location_info(ip_address)
        
        # دمج معلومات الموقع
        location_data = activity_data.get("location", {})
        if location_data:
            location_data.update(location_from_ip)
        else:
            location_data = location_from_ip
        
        # إنشاء سجل النشاط
        activity_record = {
            "id": str(uuid.uuid4()),
            "user_id": activity_data.get("user_id"),
            "user_name": activity_data.get("user_name"),
            "user_role": activity_data.get("user_role"),
            "action": activity_data.get("action"),
            "description": activity_data.get("description"),
            "entity_type": activity_data.get("entity_type"),
            "entity_id": activity_data.get("entity_id"),
            "ip_address": ip_address,
            "device_info": device_info,
            "location": location_data,
            "additional_data": activity_data.get("additional_data", {}),
            "timestamp": datetime.utcnow(),
            "success": True,
            "session_duration": activity_data.get("session_duration")
        }
        
        # حفظ في قاعدة البيانات
        result = activities_collection.insert_one(activity_record)
        activity_record["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "تم تسجيل النشاط بنجاح",
            "activity_id": activity_record["id"],
            "location_detected": bool(location_data.get("city") != "غير محدد")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تسجيل النشاط: {str(e)}")

@router.get("/", response_model=List[dict])
async def get_activities(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """جلب قائمة الأنشطة مع الفلترة"""
    try:
        filter_query = {}
        
        if user_id:
            filter_query["user_id"] = user_id
        if action:
            filter_query["action"] = action
            
        # جلب الأنشطة مع الترتيب حسب التاريخ
        activities = list(activities_collection.find(
            filter_query,
            {"_id": 0}  # استبعاد _id من النتائج
        ).sort("timestamp", -1).skip(offset).limit(limit))
        
        # تحويل التاريخ إلى string للـ JSON
        for activity in activities:
            activity["timestamp"] = activity["timestamp"].isoformat()
            
        return activities
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الأنشطة: {str(e)}")

@router.get("/stats", response_model=dict)
async def get_activity_stats():
    """إحصائيات الأنشطة"""
    try:
        # إحصائيات عامة
        total_activities = activities_collection.count_documents({})
        
        # إحصائيات حسب نوع النشاط
        action_stats = list(activities_collection.aggregate([
            {"$group": {"_id": "$action", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # إحصائيات حسب المستخدم
        user_stats = list(activities_collection.aggregate([
            {"$group": {"_id": "$user_name", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]))
        
        # إحصائيات الأجهزة
        device_stats = list(activities_collection.aggregate([
            {"$group": {"_id": "$device_info.device_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        # الأنشطة في آخر 24 ساعة
        last_24h = datetime.utcnow() - timedelta(hours=24)
        recent_activities = activities_collection.count_documents({
            "timestamp": {"$gte": last_24h}
        })
        
        return {
            "total_activities": total_activities,
            "recent_activities_24h": recent_activities,
            "actions": [{"action": item["_id"], "count": item["count"]} for item in action_stats],
            "users": [{"user": item["_id"], "count": item["count"]} for item in user_stats],
            "devices": [{"device": item["_id"], "count": item["count"]} for item in device_stats]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب الإحصائيات: {str(e)}")

@router.delete("/{activity_id}")
async def delete_activity(activity_id: str):
    """حذف نشاط معين"""
    try:
        result = activities_collection.delete_one({"id": activity_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="النشاط غير موجود")
            
        return {"success": True, "message": "تم حذف النشاط بنجاح"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في حذف النشاط: {str(e)}")

@router.post("/bulk-delete")
async def bulk_delete_activities(activity_ids: List[str]):
    """حذف عدة أنشطة"""
    try:
        result = activities_collection.delete_many({"id": {"$in": activity_ids}})
        
        return {
            "success": True,
            "message": f"تم حذف {result.deleted_count} نشاط",
            "deleted_count": result.deleted_count
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في حذف الأنشطة: {str(e)}")

@router.get("/user/{user_id}", response_model=List[dict])
async def get_user_activities(user_id: str, limit: int = 20):
    """جلب أنشطة مستخدم معين"""
    try:
        activities = list(activities_collection.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit))
        
        # تحويل التاريخ إلى string للـ JSON
        for activity in activities:
            activity["timestamp"] = activity["timestamp"].isoformat()
            
        return activities
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب أنشطة المستخدم: {str(e)}")