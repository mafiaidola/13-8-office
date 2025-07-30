from fastapi import APIRouter, HTTPException, Depends
from models.all_models import SystemSettings
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import jwt

router = APIRouter()

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

async def get_current_user(authorization: str = None):
    """الحصول على المستخدم الحالي من JWT token"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = verify_jwt_token(token)
        
        # Get user from database
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'test_database')]
        
        user = await db.users.find_one({"id": payload["user_id"]})
        client.close()
        return user
    
    return None

@router.get("/settings")
async def get_system_settings(authorization: str = None):
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

@router.post("/settings")
async def update_system_settings(settings_data: dict, authorization: str = None):
    """تحديث إعدادات النظام - Update System Settings"""
    user = await get_current_user(authorization)
    
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    try:
        # Update settings
        settings_data["updated_at"] = datetime.utcnow()
        
        result = await db.system_settings.update_one(
            {},
            {"$set": settings_data},
            upsert=True
        )
        
        return {
            "success": True,
            "message": "تم تحديث الإعدادات بنجاح",
            "updated": result.modified_count > 0 or result.upserted_id is not None
        }
        
    except Exception as e:
        print(f"Error updating system settings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error updating settings: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()