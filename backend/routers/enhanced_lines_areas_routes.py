# Enhanced Lines Areas Routes - مسارات إدارة الخطوط والمناطق المحسنة
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
from datetime import datetime
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

router = APIRouter(prefix="/api/enhanced-lines-areas", tags=["Enhanced Lines Areas"])

# Models
class LineModel(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: bool = True

class AreaModel(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    line_id: str
    manager_id: Optional[str] = None
    is_active: bool = True

class LineUpdateModel(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None

class AreaUpdateModel(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    line_id: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: Optional[bool] = None

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

@router.get("/lines")
async def get_all_lines(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع الخطوط"""
    try:
        lines = []
        cursor = db.lines.find({}, {"_id": 0}).sort("name", 1)
        async for line in cursor:
            line_id = line["id"]
            # عدد المناطق في الخط
            areas_count = await db.areas.count_documents({"line_id": line_id})
            # عدد العيادات في الخط
            clinics_count = await db.clinics.count_documents({"line_id": line_id})
            # عدد المندوبين في الخط
            reps_count = await db.users.count_documents({"line_id": line_id, "role": "medical_rep"})
            
            line["areas_count"] = areas_count
            line["clinics_count"] = clinics_count
            line["reps_count"] = reps_count
            
            # معلومات المدير
            if line.get("manager_id"):
                manager = await db.users.find_one({"id": line["manager_id"]})
                line["manager_name"] = manager["full_name"] if manager else "غير محدد"
            else:
                line["manager_name"] = "غير محدد"
            
            lines.append(line)
        
        return {
            "success": True,
            "lines": lines,
            "total_count": len(lines)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الخطوط: {str(e)}")

@router.get("/areas")
async def get_all_areas(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع المناطق"""
    try:
        areas = []
        cursor = db.areas.find({}, {"_id": 0}).sort("name", 1)
        async for area in cursor:
            line_id = area.get("line_id")
            if line_id:
                line = await db.lines.find_one({"id": line_id})
                area["line_name"] = line["name"] if line else "خط غير محدد"
            else:
                area["line_name"] = "خط غير محدد"
            
            # عدد العيادات في المنطقة
            clinics_count = await db.clinics.count_documents({"area_id": area["id"]})
            area["clinics_count"] = clinics_count
            
            # معلومات المدير
            if area.get("manager_id"):
                manager = await db.users.find_one({"id": area["manager_id"]})
                area["manager_name"] = manager["full_name"] if manager else "غير محدد"
            else:
                area["manager_name"] = "غير محدد"
            
            areas.append(area)
        
        return {
            "success": True,
            "areas": areas,
            "total_count": len(areas)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل المناطق: {str(e)}")

@router.get("/lines/{line_id}/areas")
async def get_areas_by_line(line_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على المناطق الخاصة بخط معين"""
    try:
        # التحقق من وجود الخط
        line = await db.lines.find_one({"id": line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        areas = []
        cursor = db.areas.find({"line_id": line_id}, {"_id": 0}).sort("name", 1)
        async for area in cursor:
            clinics_count = await db.clinics.count_documents({"area_id": area["id"]})
            area["clinics_count"] = clinics_count
            area["line_name"] = line["name"]
            areas.append(area)
        
        return {
            "success": True,
            "line": line,
            "areas": areas,
            "total_count": len(areas)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل مناطق الخط: {str(e)}")

@router.post("/lines")
async def create_line(line_data: LineModel, current_user: dict = Depends(get_current_user)):
    """إنشاء خط جديد"""
    try:
        # التحقق من عدم تكرار الكود
        existing_line = await db.lines.find_one({"code": line_data.code.upper()})
        if existing_line:
            raise HTTPException(status_code=400, detail="كود الخط موجود بالفعل")
        
        # إنشاء الخط
        line = {
            "id": str(uuid.uuid4()),
            "name": line_data.name,
            "code": line_data.code.upper(),
            "description": line_data.description or "",
            "manager_id": line_data.manager_id,
            "is_active": line_data.is_active,
            "created_by": current_user.get("user_id", "admin"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.lines.insert_one(line)
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "line_create",
            "description": f"إنشاء خط جديد: {line_data.name}",
            "entity_type": "line",
            "entity_id": line["id"],
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "line_name": line_data.name,
                "line_code": line_data.code
            }
        }
        await db.activities.insert_one(activity)
        
        # Remove MongoDB ObjectId for JSON serialization
        line.pop("_id", None)
        
        return {
            "success": True,
            "message": "تم إنشاء الخط بنجاح",
            "line": line
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الخط: {str(e)}")

@router.post("/areas")
async def create_area(area_data: AreaModel, current_user: dict = Depends(get_current_user)):
    """إنشاء منطقة جديدة"""
    try:
        # التحقق من وجود الخط
        line = await db.lines.find_one({"id": area_data.line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # التحقق من عدم تكرار الكود
        existing_area = await db.areas.find_one({"code": area_data.code.upper()})
        if existing_area:
            raise HTTPException(status_code=400, detail="كود المنطقة موجود بالفعل")
        
        # إنشاء المنطقة
        area = {
            "id": str(uuid.uuid4()),
            "name": area_data.name,
            "code": area_data.code.upper(),
            "description": area_data.description or "",
            "line_id": area_data.line_id,
            "manager_id": area_data.manager_id,
            "is_active": area_data.is_active,
            "created_by": current_user.get("user_id", "admin"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.areas.insert_one(area)
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "area_create",
            "description": f"إنشاء منطقة جديدة: {area_data.name} في خط: {line['name']}",
            "entity_type": "area",
            "entity_id": area["id"],
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "area_name": area_data.name,
                "area_code": area_data.code,
                "line_name": line["name"]
            }
        }
        await db.activities.insert_one(activity)
        
        # Remove MongoDB ObjectId for JSON serialization
        area.pop("_id", None)
        
        return {
            "success": True,
            "message": "تم إنشاء المنطقة بنجاح",
            "area": area
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء المنطقة: {str(e)}")

@router.put("/lines/{line_id}")
async def update_line(line_id: str, line_data: LineUpdateModel, current_user: dict = Depends(get_current_user)):
    """تحديث خط موجود"""
    try:
        # التحقق من وجود الخط
        existing_line = await db.lines.find_one({"id": line_id})
        if not existing_line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # بناء البيانات المحدثة
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if line_data.name is not None:
            update_data["name"] = line_data.name
        if line_data.code is not None:
            # التحقق من عدم تكرار الكود
            if line_data.code.upper() != existing_line.get("code"):
                existing_code = await db.lines.find_one({"code": line_data.code.upper()})
                if existing_code:
                    raise HTTPException(status_code=400, detail="كود الخط موجود بالفعل")
            update_data["code"] = line_data.code.upper()
        if line_data.description is not None:
            update_data["description"] = line_data.description
        if line_data.manager_id is not None:
            update_data["manager_id"] = line_data.manager_id
        if line_data.is_active is not None:
            update_data["is_active"] = line_data.is_active
        
        # تحديث الخط
        result = await db.lines.update_one(
            {"id": line_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="لم يتم تحديث أي بيانات")
        
        # الحصول على البيانات المحدثة
        updated_line = await db.lines.find_one({"id": line_id}, {"_id": 0})
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "line_update",
            "description": f"تحديث الخط: {updated_line['name']}",
            "entity_type": "line",
            "entity_id": line_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "line_name": updated_line["name"],
                "changes": update_data
            }
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم تحديث الخط بنجاح",
            "line": updated_line
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث الخط: {str(e)}")

@router.put("/areas/{area_id}")
async def update_area(area_id: str, area_data: AreaUpdateModel, current_user: dict = Depends(get_current_user)):
    """تحديث منطقة موجودة"""
    try:
        # التحقق من وجود المنطقة
        existing_area = await db.areas.find_one({"id": area_id})
        if not existing_area:
            raise HTTPException(status_code=404, detail="المنطقة غير موجودة")
        
        # بناء البيانات المحدثة
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if area_data.name is not None:
            update_data["name"] = area_data.name
        if area_data.code is not None:
            # التحقق من عدم تكرار الكود
            if area_data.code.upper() != existing_area.get("code"):
                existing_code = await db.areas.find_one({"code": area_data.code.upper()})
                if existing_code:
                    raise HTTPException(status_code=400, detail="كود المنطقة موجود بالفعل")
            update_data["code"] = area_data.code.upper()
        if area_data.description is not None:
            update_data["description"] = area_data.description
        if area_data.line_id is not None:
            # التحقق من وجود الخط الجديد
            line = await db.lines.find_one({"id": area_data.line_id})
            if not line:
                raise HTTPException(status_code=404, detail="الخط الجديد غير موجود")
            update_data["line_id"] = area_data.line_id
        if area_data.manager_id is not None:
            update_data["manager_id"] = area_data.manager_id
        if area_data.is_active is not None:
            update_data["is_active"] = area_data.is_active
        
        # تحديث المنطقة
        result = await db.areas.update_one(
            {"id": area_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="لم يتم تحديث أي بيانات")
        
        # الحصول على البيانات المحدثة
        updated_area = await db.areas.find_one({"id": area_id}, {"_id": 0})
        
        # إضافة معلومات الخط
        if updated_area.get("line_id"):
            line = await db.lines.find_one({"id": updated_area["line_id"]})
            updated_area["line_name"] = line["name"] if line else "خط غير محدد"
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "area_update",
            "description": f"تحديث المنطقة: {updated_area['name']}",
            "entity_type": "area",
            "entity_id": area_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "area_name": updated_area["name"],
                "line_name": updated_area.get("line_name", "غير محدد"),
                "changes": update_data
            }
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم تحديث المنطقة بنجاح",
            "area": updated_area
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث المنطقة: {str(e)}")

@router.delete("/lines/{line_id}")
async def delete_line(line_id: str, current_user: dict = Depends(get_current_user)):
    """حذف خط (إلغاء تفعيل)"""
    try:
        # التحقق من وجود الخط
        line = await db.lines.find_one({"id": line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # التحقق من وجود مناطق مرتبطة
        areas_count = await db.areas.count_documents({"line_id": line_id, "is_active": True})
        if areas_count > 0:
            raise HTTPException(status_code=400, detail=f"لا يمكن حذف الخط لوجود {areas_count} منطقة مرتبطة به")
        
        # إلغاء تفعيل الخط
        result = await db.lines.update_one(
            {"id": line_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "line_delete",
            "description": f"حذف الخط: {line['name']}",
            "entity_type": "line",
            "entity_id": line_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "line_name": line["name"],
                "line_code": line["code"]
            }
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم حذف الخط بنجاح"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في حذف الخط: {str(e)}")

@router.delete("/areas/{area_id}")
async def delete_area(area_id: str, current_user: dict = Depends(get_current_user)):
    """حذف منطقة (إلغاء تفعيل)"""
    try:
        # التحقق من وجود المنطقة
        area = await db.areas.find_one({"id": area_id})
        if not area:
            raise HTTPException(status_code=404, detail="المنطقة غير موجودة")
        
        # التحقق من وجود عيادات مرتبطة
        clinics_count = await db.clinics.count_documents({"area_id": area_id})
        if clinics_count > 0:
            raise HTTPException(status_code=400, detail=f"لا يمكن حذف المنطقة لوجود {clinics_count} عيادة مرتبطة بها")
        
        # إلغاء تفعيل المنطقة
        result = await db.areas.update_one(
            {"id": area_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow().isoformat()}}
        )
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id", "admin"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "area_delete",
            "description": f"حذف المنطقة: {area['name']}",
            "entity_type": "area",
            "entity_id": area_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": {
                "area_name": area["name"],
                "area_code": area["code"]
            }
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم حذف المنطقة بنجاح"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في حذف المنطقة: {str(e)}")

@router.get("/statistics")
async def get_lines_areas_statistics(current_user: dict = Depends(get_current_user)):
    """الحصول على إحصائيات الخطوط والمناطق"""
    try:
        # إحصائيات الخطوط
        total_lines = await db.lines.count_documents({"is_active": True})
        lines_with_manager = await db.lines.count_documents({"is_active": True, "manager_id": {"$ne": None}})
        
        # إحصائيات المناطق
        total_areas = await db.areas.count_documents({"is_active": True})
        areas_with_manager = await db.areas.count_documents({"is_active": True, "manager_id": {"$ne": None}})
        
        # إحصائيات العيادات حسب الخطوط
        lines_with_clinics = []
        cursor = db.lines.aggregate([
            {"$match": {"is_active": True}},
            {"$lookup": {
                "from": "clinics",
                "localField": "id",
                "foreignField": "line_id",
                "as": "clinics"
            }},
            {"$project": {
                "name": 1,
                "clinics_count": {"$size": "$clinics"}
            }},
            {"$sort": {"clinics_count": -1}},
            {"$limit": 10}
        ])
        async for doc in cursor:
            doc.pop("_id", None)
            lines_with_clinics.append(doc)
        
        # إحصائيات المندوبين حسب الخطوط
        lines_with_reps = []
        cursor = db.lines.aggregate([
            {"$match": {"is_active": True}},
            {"$lookup": {
                "from": "users",
                "localField": "id",
                "foreignField": "line_id",
                "as": "reps"
            }},
            {"$project": {
                "name": 1,
                "reps_count": {"$size": "$reps"}
            }},
            {"$sort": {"reps_count": -1}},
            {"$limit": 10}
        ])
        async for doc in cursor:
            doc.pop("_id", None)
            lines_with_reps.append(doc)
        
        return {
            "success": True,
            "statistics": {
                "lines": {
                    "total": total_lines,
                    "with_manager": lines_with_manager,
                    "without_manager": total_lines - lines_with_manager
                },
                "areas": {
                    "total": total_areas,
                    "with_manager": areas_with_manager,
                    "without_manager": total_areas - areas_with_manager
                },
                "lines_with_clinics": lines_with_clinics,
                "lines_with_reps": lines_with_reps
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الإحصائيات: {str(e)}")

# تصدير المسارات
__all__ = ["router"]