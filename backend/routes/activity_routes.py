# Activity Tracking Routes - مسارات تتبع الأنشطة
# المطلوب: نظام شامل لتتبع جميع الأنشطة مع GPS والوقت والتفاصيل للأدمن فقط

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
import jwt
import os
from datetime import datetime, timedelta
import json
import math
import random

from ..models.activity_models import (
    ActivityCreate, ActivityResponse, ActivityFilter, 
    ActivityStats, GPSTrackingLog, LocationData, DeviceInfo, ActivityType
)

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """التحقق من صحة المستخدم الحالي"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Return user info from token
        return {
            "id": user_id,
            "username": payload.get("username"),
            "role": payload.get("role", "user"),
            "full_name": payload.get("full_name", "")
        }
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def admin_required(current_user: dict = Depends(get_current_user)):
    """التحقق من صلاحيات الأدمن"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

# Mock Database - في التطبيق الحقيقي يجب استخدام قاعدة بيانات حقيقية
ACTIVITIES_DB = []
GPS_LOGS_DB = []

def generate_mock_activities():
    """توليد بيانات تجريبية شاملة للأنشطة"""
    activities = []
    users = [
        {"id": "user-001", "name": "محمد علي أحمد", "role": "medical_rep"},
        {"id": "user-002", "name": "سارة محمود علي", "role": "medical_rep"},
        {"id": "user-003", "name": "أحمد حسن محمد", "role": "line_manager"},
        {"id": "admin", "name": "مدير النظام", "role": "admin"},
        {"id": "user-004", "name": "فاطمة عبدالله", "role": "medical_rep"}
    ]
    
    locations = [
        {"lat": 30.0444, "lng": 31.2357, "address": "شارع النيل، المعادي، القاهرة", "city": "القاهرة"},
        {"lat": 30.0626, "lng": 31.2497, "address": "مدينة نصر، القاهرة", "city": "القاهرة"},
        {"lat": 31.2001, "lng": 29.9187, "address": "الإسكندرية", "city": "الإسكندرية"},
        {"lat": 30.0131, "lng": 31.2089, "address": "الجيزة", "city": "الجيزة"},
        {"lat": 26.8206, "lng": 30.8025, "address": "أسوان", "city": "أسوان"}
    ]
    
    # توليد أنشطة متنوعة
    for i in range(50):
        user = random.choice(users)
        location = random.choice(locations)
        activity_types = [
            {
                "type": ActivityType.VISIT_REGISTRATION,
                "action": "تسجيل زيارة عيادة",
                "target_type": "clinic",
                "target_name": f"عيادة الدكتور حسام {i+1}",
                "details": {
                    "visit_duration": random.randint(30, 120),
                    "doctor_present": random.choice([True, False]),
                    "samples_given": random.randint(0, 5),
                    "order_value": round(random.uniform(500, 5000), 2) if random.random() > 0.3 else 0
                }
            },
            {
                "type": ActivityType.CLINIC_REGISTRATION,
                "action": "تسجيل عيادة جديدة",
                "target_type": "clinic",
                "target_name": f"عيادة الدكتور سامي {i+1}",
                "details": {
                    "doctor_name": f"د. سامي حسن {i+1}",
                    "specialty": random.choice(["أطفال", "باطنة", "نساء وتوليد", "عظام", "قلب"]),
                    "classification": random.choice(["A", "B", "C"]),
                    "phone": f"0123456{str(i).zfill(4)}"
                }
            },
            {
                "type": ActivityType.ORDER_CREATION,
                "action": "إنشاء طلب جديد",
                "target_type": "order",
                "target_name": f"طلب رقم ORD-2024-{str(i+1).zfill(3)}",
                "details": {
                    "order_value": round(random.uniform(1000, 8000), 2),
                    "items_count": random.randint(3, 15),
                    "clinic_name": f"عيادة الدكتور أحمد {i+1}",
                    "payment_method": random.choice(["cash", "credit", "bank_transfer"])
                }
            },
            {
                "type": ActivityType.LOGIN,
                "action": "تسجيل دخول",
                "target_type": "system",
                "target_name": "نظام EP Group",
                "details": {
                    "biometric_verified": random.choice([True, False]),
                    "failed_attempts": random.randint(0, 2),
                    "login_method": random.choice(["password", "biometric", "otp"])
                }
            }
        ]
        
        activity_type = random.choice(activity_types)
        
        activity = ActivityResponse(
            id=f"act-{str(i+1).zfill(3)}",
            type=activity_type["type"],
            action=activity_type["action"],
            user_id=user["id"],
            user_name=user["name"],
            user_role=user["role"],
            target_type=activity_type["target_type"],
            target_id=f"{activity_type['target_type']}-{str(i+1).zfill(3)}",
            target_name=activity_type["target_name"],
            timestamp=datetime.utcnow() - timedelta(
                hours=random.randint(0, 72),
                minutes=random.randint(0, 59)
            ),
            location=LocationData(
                latitude=location["lat"] + random.uniform(-0.01, 0.01),
                longitude=location["lng"] + random.uniform(-0.01, 0.01),
                accuracy=random.uniform(5, 25),
                address=location["address"],
                city=location["city"]
            ),
            device_info=DeviceInfo(
                device_type=random.choice(["mobile", "desktop", "tablet"]),
                operating_system=random.choice(["Android 12", "iOS 16", "Windows 11", "macOS 13"]),
                browser=random.choice(["Chrome", "Safari", "Firefox", "Edge"]),
                ip_address=f"192.168.1.{random.randint(100, 254)}"
            ),
            details=activity_type["details"]
        )
        activities.append(activity)
    
    return activities

@router.post("/activities", response_model=ActivityResponse)
async def log_activity(
    activity: ActivityCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """تسجيل نشاط جديد مع GPS والتفاصيل"""
    try:
        # Extract device info from request
        user_agent = request.headers.get("user-agent", "")
        ip_address = request.client.host if request.client else "Unknown"
        
        # Create activity response
        activity_response = ActivityResponse(
            type=activity.type,
            action=activity.action,
            user_id=current_user["id"],
            user_name=current_user["full_name"] or current_user["username"],
            user_role=current_user["role"],
            target_type=activity.target_type,
            target_id=activity.target_id,
            target_name=activity.target_name,
            location=activity.location,
            device_info=DeviceInfo(
                user_agent=user_agent,
                ip_address=ip_address,
                **(activity.device_info.dict() if activity.device_info else {})
            ),
            details=activity.details,
            metadata=activity.metadata
        )
        
        # Store in mock database
        ACTIVITIES_DB.append(activity_response)
        
        # If location provided, also store in GPS logs
        if activity.location:
            gps_log = GPSTrackingLog(
                user_id=current_user["id"],
                activity_id=activity_response.id,
                location=activity.location
            )
            GPS_LOGS_DB.append(gps_log)
        
        return activity_response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في تسجيل النشاط: {str(e)}"
        )

@router.get("/admin/activities", response_model=List[ActivityResponse])
async def get_all_activities(
    activity_type: Optional[str] = None,
    user_id: Optional[str] = None,
    target_type: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(admin_required)
):
    """الحصول على جميع الأنشطة - للأدمن فقط"""
    try:
        # Generate mock data if empty
        if not ACTIVITIES_DB:
            ACTIVITIES_DB.extend(generate_mock_activities())
        
        # Apply filters
        filtered_activities = ACTIVITIES_DB.copy()
        
        if activity_type:
            filtered_activities = [act for act in filtered_activities if act.type == activity_type]
        
        if user_id:
            filtered_activities = [act for act in filtered_activities if act.user_id == user_id]
        
        if target_type:
            filtered_activities = [act for act in filtered_activities if act.target_type == target_type]
        
        if from_date:
            filtered_activities = [act for act in filtered_activities if act.timestamp >= from_date]
        
        if to_date:
            filtered_activities = [act for act in filtered_activities if act.timestamp <= to_date]
        
        # Sort by timestamp (newest first)
        filtered_activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Apply pagination
        return filtered_activities[offset:offset + limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في جلب الأنشطة: {str(e)}"
        )

@router.get("/admin/activities/stats", response_model=ActivityStats)
async def get_activity_stats(
    current_user: dict = Depends(admin_required)
):
    """إحصائيات شاملة للأنشطة - للأدمن فقط"""
    try:
        # Generate mock data if empty
        if not ACTIVITIES_DB:
            ACTIVITIES_DB.extend(generate_mock_activities())
        
        now = datetime.utcnow()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Calculate statistics
        total_activities = len(ACTIVITIES_DB)
        today_activities = len([act for act in ACTIVITIES_DB if act.timestamp.date() == today])
        week_activities = len([act for act in ACTIVITIES_DB if act.timestamp >= week_ago])
        month_activities = len([act for act in ACTIVITIES_DB if act.timestamp >= month_ago])
        
        # Activities by type
        activities_by_type = {}
        for activity in ACTIVITIES_DB:
            activity_type = activity.type.value
            activities_by_type[activity_type] = activities_by_type.get(activity_type, 0) + 1
        
        # Activities by user
        activities_by_user = {}
        for activity in ACTIVITIES_DB:
            user_name = activity.user_name
            activities_by_user[user_name] = activities_by_user.get(user_name, 0) + 1
        
        # Most active locations
        location_counts = {}
        for activity in ACTIVITIES_DB:
            if activity.location and activity.location.address:
                address = activity.location.address
                location_counts[address] = location_counts.get(address, 0) + 1
        
        most_active_locations = [
            {"location": loc, "count": count}
            for loc, count in sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Peak hours
        hour_counts = {}
        for activity in ACTIVITIES_DB:
            hour = activity.timestamp.hour
            hour_counts[hour] = hour_counts.get(hour, 0) + 1
        
        peak_hours = [
            {"hour": hour, "count": count}
            for hour, count in sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        return ActivityStats(
            total_activities=total_activities,
            today_activities=today_activities,
            week_activities=week_activities,
            month_activities=month_activities,
            activities_by_type=activities_by_type,
            activities_by_user=activities_by_user,
            most_active_locations=most_active_locations,
            peak_hours=peak_hours
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في جلب إحصائيات الأنشطة: {str(e)}"
        )

@router.get("/admin/gps-tracking", response_model=List[GPSTrackingLog])
async def get_gps_tracking_logs(
    user_id: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: dict = Depends(admin_required)
):
    """الحصول على سجلات تتبع GPS - للأدمن فقط"""
    try:
        # Generate mock GPS data if empty
        if not GPS_LOGS_DB:
            for activity in ACTIVITIES_DB[:20]:  # Generate GPS logs for first 20 activities
                if activity.location:
                    gps_log = GPSTrackingLog(
                        user_id=activity.user_id,
                        activity_id=activity.id,
                        location=activity.location,
                        movement_type=random.choice(["walking", "driving", "stationary"]),
                        distance_from_last=random.uniform(0, 1000),
                        duration_at_location=random.randint(5, 180)
                    )
                    GPS_LOGS_DB.append(gps_log)
        
        # Apply filters
        filtered_logs = GPS_LOGS_DB.copy()
        
        if user_id:
            filtered_logs = [log for log in filtered_logs if log.user_id == user_id]
        
        if from_date:
            filtered_logs = [log for log in filtered_logs if log.created_at >= from_date]
        
        if to_date:
            filtered_logs = [log for log in filtered_logs if log.created_at <= to_date]
        
        # Sort by timestamp (newest first)
        filtered_logs.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        return filtered_logs[offset:offset + limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في جلب سجلات GPS: {str(e)}"
        )

@router.get("/admin/activities/user/{user_id}", response_model=List[ActivityResponse])
async def get_user_activities(
    user_id: str,
    activity_type: Optional[str] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    limit: int = 50,
    current_user: dict = Depends(admin_required)
):
    """الحصول على أنشطة مستخدم محدد - للأدمن فقط"""
    try:
        # Generate mock data if empty
        if not ACTIVITIES_DB:
            ACTIVITIES_DB.extend(generate_mock_activities())
        
        # Filter activities for specific user
        user_activities = [act for act in ACTIVITIES_DB if act.user_id == user_id]
        
        if activity_type:
            user_activities = [act for act in user_activities if act.type == activity_type]
        
        if from_date:
            user_activities = [act for act in user_activities if act.timestamp >= from_date]
        
        if to_date:
            user_activities = [act for act in user_activities if act.timestamp <= to_date]
        
        # Sort by timestamp (newest first)
        user_activities.sort(key=lambda x: x.timestamp, reverse=True)
        
        return user_activities[:limit]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في جلب أنشطة المستخدم: {str(e)}"
        )

@router.post("/log-gps")
async def log_gps_location(
    location_data: LocationData,
    current_user: dict = Depends(get_current_user)
):
    """تسجيل موقع GPS للمستخدم الحالي"""
    try:
        gps_log = GPSTrackingLog(
            user_id=current_user["id"],
            location=location_data
        )
        
        GPS_LOGS_DB.append(gps_log)
        
        return {"message": "تم تسجيل الموقع بنجاح", "log_id": gps_log.id}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"خطأ في تسجيل موقع GPS: {str(e)}"
        )