from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.all_models import SystemSettings
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import jwt

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

def verify_jwt_token(token: str):
    """التحقق من JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """الحصول على المستخدم الحالي من JWT token"""
    token = credentials.credentials
    payload = verify_jwt_token(token)
    
    # Get user from database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    user = await db.users.find_one({"id": payload["user_id"]})
    client.close()
    return user

@router.get("/admin/settings")
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    """إعدادات النظام - System Settings"""
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        # Try to get existing settings
        settings = await db.system_settings.find_one({})
        
        if not settings:
            # Create default settings if none exist
            default_settings = {
                "id": "default-settings",
                "logo_image": None,
                "company_name": "نظام إدارة المناديب - EP Group",
                "primary_color": "#3b82f6",
                "secondary_color": "#1e40af",
                "available_themes": ["dark", "light", "blue", "green", "purple"],
                "default_theme": "dark",
                "available_languages": ["ar", "en"],
                "default_language": "ar",
                "currency": "EGP",
                "timezone": "Africa/Cairo",
                "notifications_enabled": True,
                "chat_enabled": True,
                "voice_notes_enabled": True,
                "map_integration": True,
                "offline_sync": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.system_settings.insert_one(default_settings)
            settings = default_settings
        
        # Remove MongoDB _id field
        if "_id" in settings:
            del settings["_id"]
        
        return {
            "success": True,
            "data": settings,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error fetching system settings: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "data": {
                "company_name": "نظام إدارة المناديب - EP Group",
                "primary_color": "#3b82f6",
                "secondary_color": "#1e40af",
                "default_theme": "dark",
                "default_language": "ar"
            }
        }
    finally:
        if 'client' in locals():
            client.close()

@router.put("/admin/settings")
async def update_system_settings(settings_data: dict, current_user: dict = Depends(get_current_user)):
    """تحديث إعدادات النظام - Update System Settings"""
    
    # Verify admin user
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        # Update or create settings
        settings_data["updated_at"] = datetime.utcnow()
        settings_data["updated_by"] = current_user.get("id")
        
        result = await db.system_settings.update_one(
            {"_id": "main_settings"},
            {"$set": settings_data},
            upsert=True
        )
        
        client.close()
        
        return {
            "success": True,
            "message": "تم تحديث الإعدادات بنجاح",
            "settings": settings_data
        }
        
    except Exception as e:
        client.close()
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإعدادات: {str(e)}")