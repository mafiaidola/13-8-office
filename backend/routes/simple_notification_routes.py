# Simple Notification Routes - مسارات الإشعارات البسيطة
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from motor.motor_asyncio import AsyncIOMotorClient
import jwt
from datetime import datetime
import uuid

router = APIRouter()
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

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

@router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
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
        return {
            "success": False,
            "unread_count": 0,
            "error": str(e)
        }

@router.get("/api/notifications/")
async def get_my_notifications(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على إشعاراتي"""
    try:
        # Get user notifications
        notifications = await db.notifications.find(
            {"recipient_id": current_user["id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Get unread count
        unread_count = await db.notifications.count_documents({
            "recipient_id": current_user["id"],
            "status": "unread"
        })
        
        return {
            "success": True,
            "data": {
                "notifications": notifications,
                "total_count": len(notifications),
                "unread_count": unread_count
            }
        }
    except Exception as e:
        return {
            "success": False,
            "data": {
                "notifications": [],
                "total_count": 0,
                "unread_count": 0
            },
            "error": str(e)
        }

@router.post("/api/notifications/")
async def create_notification(
    notification_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء إشعار جديد"""
    try:
        # Check permissions
        if current_user["role"] not in ["admin", "gm", "manager"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء إشعارات")
        
        # Create notification
        notification = {
            "id": str(uuid.uuid4()),
            "title": notification_data.get("title", "إشعار جديد"),
            "message": notification_data.get("message", ""),
            "type": notification_data.get("type", "system_alert"),
            "priority": notification_data.get("priority", "medium"),
            "recipient_id": notification_data.get("recipient_id", current_user["id"]),
            "status": "unread",
            "created_at": datetime.utcnow(),
            "metadata": notification_data.get("metadata", {}),
            "action_url": notification_data.get("action_url")
        }
        
        await db.notifications.insert_one(notification)
        
        return {
            "success": True,
            "message": "تم إنشاء الإشعار بنجاح",
            "notification_id": notification["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الإشعار: {str(e)}")

@router.patch("/api/notifications/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """تحديد الإشعار كمقروء"""
    try:
        result = await db.notifications.update_one(
            {"id": notification_id, "recipient_id": current_user["id"]},
            {
                "$set": {
                    "status": "read",
                    "read_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="الإشعار غير موجود")
        
        return {
            "success": True,
            "message": "تم تحديد الإشعار كمقروء"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإشعار: {str(e)}")

@router.post("/api/notifications/test")
async def create_test_notification(
    current_user: dict = Depends(get_current_user)
):
    """إنشاء إشعار اختبار"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        # Create test notification
        notification = {
            "id": str(uuid.uuid4()),
            "title": "إشعار اختبار",
            "message": f"مرحباً {current_user.get('full_name', 'المستخدم')}! هذا إشعار اختبار لنظام الإشعارات المتقدم.",
            "type": "system_alert",
            "priority": "medium",
            "recipient_id": current_user["id"],
            "status": "unread",
            "created_at": datetime.utcnow(),
            "metadata": {"test": True, "timestamp": datetime.utcnow().isoformat()}
        }
        
        await db.notifications.insert_one(notification)
        
        return {
            "success": True,
            "message": "تم إنشاء إشعار اختبار بنجاح",
            "notification": {
                "id": notification["id"],
                "title": notification["title"],
                "message": notification["message"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في الاختبار: {str(e)}")