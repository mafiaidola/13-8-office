# CRM API Routes - مسارات API لنظام إدارة العلاقات
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorClient
import jwt

from models.crm_models import *
from services.crm_service import CRMService

router = APIRouter()
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Initialize CRM service
crm_service = CRMService(db)

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

# Client Interaction Management
@router.post("/crm/interactions")
async def create_interaction(
    interaction_data: ClientInteractionCreate,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء تفاعل جديد مع العميل"""
    try:
        interaction = await crm_service.create_interaction(
            interaction_data,
            current_user["id"],
            current_user.get("full_name", current_user["username"])
        )
        
        return {
            "success": True,
            "message": "تم إنشاء التفاعل بنجاح",
            "interaction_id": interaction.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التفاعل: {str(e)}")

@router.patch("/crm/interactions/{interaction_id}/complete")
async def complete_interaction(
    interaction_id: str,
    outcome: str,
    notes: str,
    next_action: Optional[str] = None,
    follow_up_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """إكمال تفاعل مع العميل"""
    try:
        success = await crm_service.complete_interaction(
            interaction_id, outcome, notes, next_action, follow_up_date
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="التفاعل غير موجود")
        
        return {
            "success": True,
            "message": "تم إكمال التفاعل بنجاح"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إكمال التفاعل: {str(e)}")

@router.get("/crm/interactions/{client_id}")
async def get_client_interactions(
    client_id: str,
    limit: int = Query(50, le=200),
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تفاعلات العميل"""
    try:
        interactions = await crm_service.get_client_interactions(client_id, limit)
        
        return {
            "success": True,
            "data": {
                "interactions": interactions,
                "total_count": len(interactions)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التفاعلات: {str(e)}")

# Client Profile Management
@router.post("/crm/profiles")
async def create_client_profile(
    clinic_id: str,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء ملف عميل جديد"""
    try:
        profile = await crm_service.create_client_profile(clinic_id, current_user["id"])
        
        return {
            "success": True,
            "message": "تم إنشاء ملف العميل بنجاح",
            "profile_id": profile.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء ملف العميل: {str(e)}")

@router.get("/crm/profiles/{clinic_id}")
async def get_client_profile(
    clinic_id: str,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على ملف العميل"""
    try:
        profile = await crm_service.get_client_profile(clinic_id)
        
        if not profile:
            # إنشاء ملف جديد إذا لم يكن موجود
            profile = await crm_service.create_client_profile(clinic_id, current_user["id"])
        
        return {
            "success": True,
            "profile": profile.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب ملف العميل: {str(e)}")

@router.patch("/crm/profiles/{clinic_id}")
async def update_client_profile(
    clinic_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """تحديث ملف العميل"""
    try:
        success = await crm_service.update_client_profile(clinic_id, updates)
        
        if not success:
            raise HTTPException(status_code=404, detail="ملف العميل غير موجود")
        
        return {
            "success": True,
            "message": "تم تحديث ملف العميل بنجاح"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحديث ملف العميل: {str(e)}")

# Follow-up Task Management
@router.post("/crm/tasks")
async def create_follow_up_task(
    client_id: str,
    title: str,
    due_date: datetime,
    description: Optional[str] = None,
    priority: FollowUpPriority = FollowUpPriority.MEDIUM,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء مهمة متابعة"""
    try:
        task = await crm_service.create_follow_up_task(
            client_id=client_id,
            assigned_to=assigned_to or current_user["id"],
            title=title,
            due_date=due_date,
            created_by=current_user["id"],
            description=description,
            priority=priority
        )
        
        return {
            "success": True,
            "message": "تم إنشاء مهمة المتابعة بنجاح",
            "task_id": task.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء المهمة: {str(e)}")

@router.get("/crm/tasks/pending")
async def get_pending_tasks(
    limit: int = Query(50, le=200),
    current_user: dict = Depends(get_current_user)
):
    """الحصول على المهام المعلقة"""
    try:
        tasks = await crm_service.get_pending_tasks(current_user["id"], limit)
        
        return {
            "success": True,
            "data": {
                "tasks": tasks,
                "total_count": len(tasks)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب المهام: {str(e)}")

@router.patch("/crm/tasks/{task_id}/complete")
async def complete_task(
    task_id: str,
    completion_notes: str,
    current_user: dict = Depends(get_current_user)
):
    """إكمال مهمة"""
    try:
        success = await crm_service.complete_task(task_id, completion_notes)
        
        if not success:
            raise HTTPException(status_code=404, detail="المهمة غير موجودة")
        
        return {
            "success": True,
            "message": "تم إكمال المهمة بنجاح"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إكمال المهمة: {str(e)}")

# Client Search and Analytics
@router.get("/crm/clients/search")
async def search_clients(
    status: Optional[ClientStatus] = None,
    priority: Optional[ClientPriority] = None,
    category: Optional[str] = None,
    last_interaction_days: Optional[int] = None,
    search_text: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """البحث في العملاء"""
    try:
        search_filter = ClientSearchFilter(
            status=status,
            priority=priority,
            category=category,
            last_interaction_days=last_interaction_days,
            search_text=search_text,
            limit=limit,
            offset=offset
        )
        
        # للمندوبين: البحث في عملائهم فقط
        rep_id = current_user["id"] if current_user["role"] in ["medical_rep", "key_account"] else None
        
        results = await crm_service.search_clients(search_filter, rep_id)
        
        return {
            "success": True,
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في البحث: {str(e)}")

@router.get("/crm/analytics/{client_id}")
async def get_client_analytics(
    client_id: str,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تحليلات العميل"""
    try:
        analytics = await crm_service.get_client_analytics(client_id)
        
        return {
            "success": True,
            "analytics": analytics.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التحليلات: {str(e)}")

@router.get("/crm/dashboard")
async def get_crm_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """الحصول على لوحة معلومات CRM"""
    try:
        # للمندوبين: لوحة معلومات شخصية
        rep_id = current_user["id"] if current_user["role"] in ["medical_rep", "key_account"] else None
        
        dashboard = await crm_service.get_crm_dashboard(rep_id)
        
        return {
            "success": True,
            "dashboard": dashboard.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب لوحة المعلومات: {str(e)}")

# Quick Actions for Testing
@router.post("/crm/test/create-sample-data")
async def create_sample_crm_data(
    current_user: dict = Depends(get_current_user)
):
    """إنشاء بيانات تجريبية للـ CRM - للاختبار فقط"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="غير مصرح لك")
        
        # الحصول على عيادات للاختبار
        clinics = await db.clinics.find({}, {"id": 1, "name": 1}).limit(10).to_list(10)
        
        created_count = 0
        
        for clinic in clinics[:5]:  # إنشاء ملفات CRM لـ 5 عيادات
            try:
                # إنشاء ملف العميل
                profile = await crm_service.create_client_profile(clinic["id"], current_user["id"])
                
                # تحديث الملف ببيانات تجريبية
                await crm_service.update_client_profile(clinic["id"], {
                    "priority": "high",
                    "status": "active",
                    "category": "key_client",
                    "monthly_potential": 5000.0,
                    "satisfaction_score": 4.2,
                    "tags": ["vip", "high_value"]
                })
                
                # إنشاء تفاعلات تجريبية
                interaction_data = ClientInteractionCreate(
                    client_id=clinic["id"],
                    interaction_type=InteractionType.VISIT,
                    title=f"زيارة تجريبية لـ {clinic['name']}",
                    description="زيارة تجريبية لاختبار نظام CRM",
                    scheduled_date=datetime.utcnow(),
                    notes="تم إنشاؤها للاختبار"
                )
                
                await crm_service.create_interaction(
                    interaction_data,
                    current_user["id"],
                    current_user.get("full_name", "Admin")
                )
                
                # إنشاء مهمة متابعة
                await crm_service.create_follow_up_task(
                    client_id=clinic["id"],
                    assigned_to=current_user["id"],
                    title=f"متابعة {clinic['name']}",
                    due_date=datetime.utcnow(),
                    created_by=current_user["id"],
                    description="مهمة متابعة تجريبية"
                )
                
                created_count += 1
                
            except Exception as e:
                print(f"خطأ في إنشاء بيانات {clinic['name']}: {e}")
                continue
        
        return {
            "success": True,
            "message": f"تم إنشاء {created_count} ملف CRM تجريبي",
            "created_count": created_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء البيانات التجريبية: {str(e)}")

# Communication Records (للمستقبل)
@router.post("/crm/communications")
async def log_communication(
    client_id: str,
    method: str,
    direction: str,
    content: str,
    subject: Optional[str] = None,
    duration: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """تسجيل اتصال مع العميل"""
    try:
        communication = {
            "id": str(uuid.uuid4()),
            "client_id": client_id,
            "rep_id": current_user["id"],
            "method": method,
            "direction": direction,
            "subject": subject,
            "content": content,
            "duration": duration,
            "timestamp": datetime.utcnow()
        }
        
        await db.communication_records.insert_one(communication)
        
        return {
            "success": True,
            "message": "تم تسجيل الاتصال بنجاح",
            "communication_id": communication["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تسجيل الاتصال: {str(e)}")

@router.get("/crm/communications/{client_id}")
async def get_communication_history(
    client_id: str,
    limit: int = Query(50, le=200),
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تاريخ الاتصالات"""
    try:
        communications = await db.communication_records.find(
            {"client_id": client_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        # تنسيق التواريخ
        for comm in communications:
            if "timestamp" in comm and isinstance(comm["timestamp"], datetime):
                comm["timestamp"] = comm["timestamp"].isoformat()
        
        return {
            "success": True,
            "data": {
                "communications": communications,
                "total_count": len(communications)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب تاريخ الاتصالات: {str(e)}")