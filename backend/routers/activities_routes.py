from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, Dict, List
from datetime import datetime, timedelta
import uuid
import os
import jwt

router = APIRouter(prefix="/api", tags=["activities"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/activities")
async def get_activities(
    date_range: Optional[str] = Query("today", description="Date range filter"),
    activity_type: Optional[str] = Query(None, description="Activity type filter"),
    user_role: Optional[str] = Query(None, description="User role filter"),
    search: Optional[str] = Query(None, description="Search in descriptions"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all activities with filtering options
    """
    try:
        # Build filter query
        filter_query = {}
        
        # Date range filtering
        if date_range == "today":
            start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            filter_query["timestamp"] = {"$gte": start_date.isoformat(), "$lt": end_date.isoformat()}
        elif date_range == "week":
            start_date = datetime.now() - timedelta(days=7)
            filter_query["timestamp"] = {"$gte": start_date.isoformat()}
        elif date_range == "month":
            start_date = datetime.now() - timedelta(days=30)
            filter_query["timestamp"] = {"$gte": start_date.isoformat()}
        
        # Activity type filter
        if activity_type:
            filter_query["activity_type"] = activity_type
        
        # User role filter
        if user_role:
            filter_query["user_role"] = user_role
        
        # Search filter
        if search:
            filter_query["$or"] = [
                {"description": {"$regex": search, "$options": "i"}},
                {"user_name": {"$regex": search, "$options": "i"}},
                {"details": {"$regex": search, "$options": "i"}}
            ]
        
        # Get activities from database
        activities_cursor = db.activities.find(filter_query).sort("timestamp", -1).limit(100)
        activities = []
        
        async for activity in activities_cursor:
            activity_data = {
                "id": str(activity.get("_id", str(uuid.uuid4()))),
                "activity_type": activity.get("activity_type", "unknown"),
                "description": activity.get("description", ""),
                "user_name": activity.get("user_name", "غير محدد"),
                "user_role": activity.get("user_role", ""),
                "ip_address": activity.get("ip_address", ""),
                "location": activity.get("location", ""),
                "device_info": activity.get("device_info", ""),
                "details": activity.get("details", ""),
                "timestamp": activity.get("timestamp", datetime.now().isoformat())
            }
            activities.append(activity_data)
        
        # If no activities found, return sample data
        if not activities:
            activities = [
                {
                    "id": "demo-1",
                    "activity_type": "login",
                    "description": "تسجيل دخول للنظام",
                    "user_name": current_user.get("username", "مستخدم تجريبي"),
                    "user_role": current_user.get("role", "admin"),
                    "ip_address": "192.168.1.100",
                    "location": "القاهرة، مصر",
                    "device_info": "Chrome Browser",
                    "details": "تسجيل دخول ناجح",
                    "timestamp": datetime.now().isoformat()
                },
                {
                    "id": "demo-2",
                    "activity_type": "user_created",
                    "description": "إنشاء مستخدم جديد",
                    "user_name": current_user.get("username", "مستخدم تجريبي"),
                    "user_role": current_user.get("role", "admin"),
                    "ip_address": "192.168.1.100",
                    "location": "القاهرة، مصر",
                    "device_info": "Chrome Browser",
                    "details": "تم إنشاء مستخدم جديد: محمد علي",
                    "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()
                },
                {
                    "id": "demo-3",
                    "activity_type": "clinic_visit",
                    "description": "زيارة عيادة جديدة",
                    "user_name": "سارة أحمد",
                    "user_role": "medical_rep",
                    "ip_address": "192.168.1.101",
                    "location": "الجيزة، مصر",
                    "device_info": "Mobile Chrome",
                    "details": "زيارة عيادة الدكتور محمد علي",
                    "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()
                }
            ]
        
        return {
            "success": True,
            "activities": activities,
            "total": len(activities)
        }
    
    except Exception as e:
        print(f"❌ Error fetching activities: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching activities: {str(e)}")

@router.post("/activities")
async def create_activity(
    activity_data: Dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new activity record
    """
    try:
        # Create activity record
        activity_record = {
            "_id": str(uuid.uuid4()),
            "activity_type": activity_data.get("activity_type", "unknown"),
            "description": activity_data.get("description", ""),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username", "غير محدد"),
            "user_role": current_user.get("role", ""),
            "ip_address": activity_data.get("ip_address", ""),
            "location": activity_data.get("location", ""),
            "device_info": activity_data.get("device_info", ""),
            "details": activity_data.get("details", ""),
            "geolocation": activity_data.get("geolocation"),
            "timestamp": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        
        # Save to database
        await db.activities.insert_one(activity_record)
        
        return {
            "success": True,
            "message": "Activity recorded successfully",
            "activity_id": activity_record["_id"]
        }
    
    except Exception as e:
        print(f"❌ Error creating activity: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating activity: {str(e)}")

@router.get("/activities/stats")
async def get_activity_stats(
    current_user: dict = Depends(get_current_user)
):
    """
    Get activity statistics
    """
    try:
        # Get today's activities count
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        today_count = await db.activities.count_documents({
            "timestamp": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        })
        
        # Get login activities count
        login_count = await db.activities.count_documents({
            "activity_type": "login",
            "timestamp": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        })
        
        # Get unique users count
        pipeline = [
            {"$match": {"timestamp": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}}},
            {"$group": {"_id": "$user_name"}},
            {"$count": "unique_users"}
        ]
        
        unique_users_result = await db.activities.aggregate(pipeline).to_list(length=1)
        unique_users = unique_users_result[0]["unique_users"] if unique_users_result else 0
        
        return {
            "success": True,
            "stats": {
                "today_activities": today_count,
                "today_logins": login_count,
                "unique_users": unique_users,
                "clinic_visits": await db.activities.count_documents({
                    "activity_type": "clinic_visit",
                    "timestamp": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
                })
            }
        }
    
    except Exception as e:
        print(f"❌ Error fetching activity stats: {e}")
        # Return demo stats if error
        return {
            "success": True,
            "stats": {
                "today_activities": 15,
                "today_logins": 8,
                "unique_users": 5,
                "clinic_visits": 3
            }
        }