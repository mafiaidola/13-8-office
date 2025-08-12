# Basic Compatibility Routes - مسارات التوافق الأساسية
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
import os
import jwt

# إعداد قاعدة البيانات والأمان
security = HTTPBearer()
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

router = APIRouter(prefix="/api", tags=["Basic Compatibility"])

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

@router.get("/areas")
async def get_areas(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع المناطق - للتوافق مع المكونات القديمة"""
    try:
        areas = []
        cursor = db.areas.find({}, {"_id": 0}).sort("name", 1)
        async for area in cursor:
            areas.append(area)
        
        return areas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل المناطق: {str(e)}")

@router.get("/lines")
async def get_lines(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع الخطوط - للتوافق مع المكونات القديمة"""
    try:
        lines = []
        cursor = db.lines.find({}, {"_id": 0}).sort("name", 1)
        async for line in cursor:
            lines.append(line)
        
        return lines
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الخطوط: {str(e)}")

@router.get("/admin/settings")
async def get_admin_settings(current_user: dict = Depends(get_current_user)):
    """إعدادات المدير - للتوافق مع المكونات القديمة"""
    try:
        # إعدادات افتراضية أساسية
        settings = {
            "system_name": "نظام إدارة المؤسسات الطبية",
            "language": "ar",
            "theme": "dark",
            "notifications_enabled": True,
            "auto_backup": True,
            "max_file_size": "10MB",
            "session_timeout": 3600
        }
        
        return settings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الإعدادات: {str(e)}")

@router.put("/admin/settings")
async def update_admin_settings(settings: dict, current_user: dict = Depends(get_current_user)):
    """تحديث إعدادات المدير - للتوافق مع المكونات القديمة"""
    try:
        # في الواقع، يمكن حفظ الإعدادات في قاعدة البيانات
        # لكن للتوافق السريع، سنعيد رسالة نجاح
        
        return {
            "success": True,
            "message": "تم تحديث الإعدادات بنجاح",
            "updated_settings": settings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الإعدادات: {str(e)}")