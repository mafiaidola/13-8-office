# Clinic Profile Routes - مسارات ملف العيادة التفصيلي
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

router = APIRouter(prefix="/api/clinic-profile", tags=["Clinic Profile"])

# Models
class DebtModel(BaseModel):
    amount: float
    description: str
    due_date: str
    priority: str = "medium"  # low, medium, high
    category: str = "purchase"  # purchase, service, other

class CollectionModel(BaseModel):
    amount: float
    description: str
    payment_method: str = "cash"  # cash, bank_transfer, check
    receipt_number: Optional[str] = None
    notes: Optional[str] = None

class OrderModel(BaseModel):
    products: List[Dict[str, Any]]
    total_amount: float
    order_type: str = "regular"  # regular, urgent, sample
    delivery_date: Optional[str] = None
    notes: Optional[str] = None

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

@router.get("/{clinic_id}/overview")
async def get_clinic_overview(clinic_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على نظرة عامة شاملة للعيادة"""
    try:
        # معلومات العيادة الأساسية
        clinic = await db.clinics.find_one({"id": clinic_id}, {"_id": 0})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # إحصائيات الزيارات
        total_visits = await db.visits.count_documents({"clinic_id": clinic_id})
        visits_this_month = await db.visits.count_documents({
            "clinic_id": clinic_id,
            "visit_date": {"$gte": datetime.now().replace(day=1).isoformat()}
        })
        last_visit = await db.visits.find_one(
            {"clinic_id": clinic_id},
            {"_id": 0},
            sort=[("visit_date", -1)]
        )
        
        # إحصائيات الطلبات
        total_orders = await db.orders.count_documents({"clinic_id": clinic_id})
        orders_this_month = await db.orders.count_documents({
            "clinic_id": clinic_id,
            "created_at": {"$gte": datetime.now().replace(day=1).isoformat()}
        })
        
        # إحصائيات الفواتير والمبيعات
        invoices_cursor = db.invoices.find({"clinic_id": clinic_id})
        total_invoices = 0
        total_sales = 0
        async for invoice in invoices_cursor:
            total_invoices += 1
            total_sales += invoice.get("amount", 0)
        
        # إحصائيات الديون
        debts_cursor = db.debts.find({"clinic_id": clinic_id})
        total_debts = 0
        pending_debts = 0
        overdue_debts = 0
        async for debt in debts_cursor:
            debt_amount = debt.get("amount", 0)
            total_debts += debt_amount
            if debt.get("status") == "pending":
                pending_debts += debt_amount
            due_date = debt.get("due_date")
            if due_date and datetime.fromisoformat(due_date) < datetime.now():
                overdue_debts += debt_amount
        
        # إحصائيات التحصيل
        collections_cursor = db.collections.find({"clinic_id": clinic_id})
        total_collections = 0
        collections_this_month = 0
        month_start = datetime.now().replace(day=1).isoformat()
        async for collection in collections_cursor:
            collection_amount = collection.get("amount", 0)
            total_collections += collection_amount
            if collection.get("created_at", "") >= month_start:
                collections_this_month += collection_amount
        
        # معلومات المندوب
        rep_info = None
        if clinic.get("rep_id"):
            rep_info = await db.users.find_one(
                {"id": clinic["rep_id"]},
                {"_id": 0, "password": 0}
            )
        
        # معلومات الخط والمنطقة
        line_info = None
        area_info = None
        if clinic.get("line_id"):
            line_info = await db.lines.find_one({"id": clinic["line_id"]}, {"_id": 0})
        if clinic.get("area_id"):
            area_info = await db.areas.find_one({"id": clinic["area_id"]}, {"_id": 0})
        
        # حساب النشاط الشهري (آخر 6 أشهر)
        monthly_activity = []
        for i in range(6):
            month_date = (datetime.now() - timedelta(days=i*30)).replace(day=1)
            month_visits = await db.visits.count_documents({
                "clinic_id": clinic_id,
                "visit_date": {"$gte": month_date.isoformat(), "$lt": (month_date + timedelta(days=32)).isoformat()}
            })
            monthly_activity.append({
                "month": month_date.strftime("%Y-%m"),
                "visits": month_visits
            })
        
        return {
            "success": True,
            "clinic_info": {
                **clinic,
                "rep_name": rep_info.get("full_name") if rep_info else "غير محدد",
                "rep_phone": rep_info.get("phone") if rep_info else "غير محدد",
                "line_name": line_info.get("name") if line_info else "غير محدد",
                "area_name": area_info.get("name") if area_info else "غير محدد"
            },
            "statistics": {
                "visits": {
                    "total": total_visits,
                    "this_month": visits_this_month,
                    "last_visit_date": last_visit.get("visit_date") if last_visit else None,
                    "monthly_activity": monthly_activity
                },
                "orders": {
                    "total": total_orders,
                    "this_month": orders_this_month
                },
                "financial": {
                    "total_sales": total_sales,
                    "total_invoices": total_invoices,
                    "total_debts": total_debts,
                    "pending_debts": pending_debts,
                    "overdue_debts": overdue_debts,
                    "total_collections": total_collections,
                    "collections_this_month": collections_this_month,
                    "balance": total_sales - total_collections - total_debts
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل نظرة عامة للعيادة: {str(e)}")

@router.get("/{clinic_id}/orders")
async def get_clinic_orders(clinic_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على طلبات العيادة الاحترافية"""
    try:
        orders = []
        cursor = db.orders.find({"clinic_id": clinic_id}, {"_id": 0}).sort("created_at", -1)
        
        async for order in cursor:
            # إضافة معلومات المندوب الذي أنشأ الطلب
            rep_info = None
            if order.get("rep_id"):
                rep_info = await db.users.find_one({"id": order["rep_id"]}, {"_id": 0, "password": 0})
            
            order["rep_name"] = rep_info.get("full_name") if rep_info else "غير محدد"
            orders.append(order)
        
        return {
            "success": True,
            "orders": orders,
            "total_count": len(orders)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل طلبات العيادة: {str(e)}")

@router.post("/{clinic_id}/orders")
async def create_clinic_order(clinic_id: str, order_data: OrderModel, current_user: dict = Depends(get_current_user)):
    """إنشاء طلب جديد للعيادة"""
    try:
        # التحقق من وجود العيادة
        clinic = await db.clinics.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        order = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "rep_id": current_user.get("user_id"),
            "products": order_data.products,
            "total_amount": order_data.total_amount,
            "order_type": order_data.order_type,
            "delivery_date": order_data.delivery_date,
            "notes": order_data.notes,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id")
        }
        
        result = await db.orders.insert_one(order)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="فشل في حفظ الطلب")
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "order_create",
            "description": f"إنشاء طلب جديد للعيادة: {clinic.get('clinic_name', 'غير محدد')}",
            "entity_type": "order",
            "entity_id": order["id"],
            "clinic_id": clinic_id,
            "additional_data": {
                "total_amount": order_data.total_amount,
                "products_count": len(order_data.products)
            },
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        # Return clean order data without ObjectId
        clean_order = {
            "id": order["id"],
            "clinic_id": order["clinic_id"],
            "total_amount": order["total_amount"],
            "order_type": order["order_type"],
            "status": order["status"],
            "created_at": order["created_at"]
        }
        
        return {
            "success": True,
            "message": "تم إنشاء الطلب بنجاح",
            "order": clean_order
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الطلب: {str(e)}")

@router.get("/{clinic_id}/debts")
async def get_clinic_debts(clinic_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على ديون العيادة التفصيلية"""
    try:
        debts = []
        cursor = db.debts.find({"clinic_id": clinic_id}, {"_id": 0}).sort("created_at", -1)
        
        async for debt in cursor:
            # إضافة معلومات من أنشأ الدين
            creator_info = None
            if debt.get("created_by"):
                creator_info = await db.users.find_one({"id": debt["created_by"]}, {"_id": 0, "password": 0})
            
            debt["creator_name"] = creator_info.get("full_name") if creator_info else "غير محدد"
            
            # حساب حالة الدين
            due_date = debt.get("due_date")
            if due_date:
                due_datetime = datetime.fromisoformat(due_date)
                debt["is_overdue"] = due_datetime < datetime.now()
                debt["days_until_due"] = (due_datetime - datetime.now()).days
            else:
                debt["is_overdue"] = False
                debt["days_until_due"] = None
            
            debts.append(debt)
        
        # إحصائيات الديون
        total_debts = sum(debt.get("amount", 0) for debt in debts)
        pending_debts = sum(debt.get("amount", 0) for debt in debts if debt.get("status") == "pending")
        overdue_debts = sum(debt.get("amount", 0) for debt in debts if debt.get("is_overdue"))
        
        return {
            "success": True,
            "debts": debts,
            "statistics": {
                "total_count": len(debts),
                "total_amount": total_debts,
                "pending_amount": pending_debts,
                "overdue_amount": overdue_debts
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل ديون العيادة: {str(e)}")

@router.post("/{clinic_id}/debts")
async def create_clinic_debt(clinic_id: str, debt_data: DebtModel, current_user: dict = Depends(get_current_user)):
    """إضافة دين جديد للعيادة"""
    try:
        # التحقق من وجود العيادة
        clinic = await db.clinics.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        debt = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "amount": debt_data.amount,
            "description": debt_data.description,
            "due_date": debt_data.due_date,
            "priority": debt_data.priority,
            "category": debt_data.category,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id")
        }
        
        result = await db.debts.insert_one(debt)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="فشل في حفظ الدين")
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "debt_create",
            "description": f"إضافة دين جديد للعيادة: {clinic.get('clinic_name', 'غير محدد')}",
            "entity_type": "debt",
            "entity_id": debt["id"],
            "clinic_id": clinic_id,
            "additional_data": {
                "amount": debt_data.amount,
                "category": debt_data.category
            },
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        # Return clean debt data without ObjectId
        clean_debt = {
            "id": debt["id"],
            "clinic_id": debt["clinic_id"],
            "amount": debt["amount"],
            "description": debt["description"],
            "due_date": debt["due_date"],
            "priority": debt["priority"],
            "category": debt["category"],
            "status": debt["status"],
            "created_at": debt["created_at"]
        }
        
        return {
            "success": True,
            "message": "تم إضافة الدين بنجاح",
            "debt": clean_debt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إضافة الدين: {str(e)}")

@router.get("/{clinic_id}/visits")
async def get_clinic_visits(clinic_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على سجل زيارات العيادة المحدث"""
    try:
        visits = []
        cursor = db.visits.find({"clinic_id": clinic_id}, {"_id": 0}).sort("visit_date", -1)
        
        async for visit in cursor:
            # إضافة معلومات المندوب
            rep_info = None
            if visit.get("rep_id"):
                rep_info = await db.users.find_one({"id": visit["rep_id"]}, {"_id": 0, "password": 0})
            
            visit["rep_name"] = rep_info.get("full_name") if rep_info else "غير محدد"
            visits.append(visit)
        
        # إحصائيات الزيارات
        total_visits = len(visits)
        visits_this_month = len([v for v in visits if v.get("visit_date", "") >= datetime.now().replace(day=1).isoformat()])
        
        # تجميع الزيارات حسب النوع
        visit_types = {}
        for visit in visits:
            visit_type = visit.get("visit_type", "غير محدد")
            visit_types[visit_type] = visit_types.get(visit_type, 0) + 1
        
        return {
            "success": True,
            "visits": visits,
            "statistics": {
                "total_count": total_visits,
                "this_month": visits_this_month,
                "by_type": visit_types
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل زيارات العيادة: {str(e)}")

@router.get("/{clinic_id}/collections")
async def get_clinic_collections(clinic_id: str, current_user: dict = Depends(get_current_user)):
    """الحصول على تحصيلات العيادة"""
    try:
        collections = []
        cursor = db.collections.find({"clinic_id": clinic_id}, {"_id": 0}).sort("created_at", -1)
        
        async for collection in cursor:
            # إضافة معلومات من سجل التحصيل
            collector_info = None
            if collection.get("collected_by"):
                collector_info = await db.users.find_one({"id": collection["collected_by"]}, {"_id": 0, "password": 0})
            
            # إضافة معلومات من وافق على التحصيل
            approver_info = None
            if collection.get("approved_by"):
                approver_info = await db.users.find_one({"id": collection["approved_by"]}, {"_id": 0, "password": 0})
            
            collection["collector_name"] = collector_info.get("full_name") if collector_info else "غير محدد"
            collection["approver_name"] = approver_info.get("full_name") if approver_info else "لم يوافق بعد"
            collections.append(collection)
        
        # إحصائيات التحصيل
        total_collections = sum(c.get("amount", 0) for c in collections)
        pending_approval = sum(c.get("amount", 0) for c in collections if c.get("status") == "pending")
        approved_collections = sum(c.get("amount", 0) for c in collections if c.get("status") == "approved")
        
        return {
            "success": True,
            "collections": collections,
            "statistics": {
                "total_count": len(collections),
                "total_amount": total_collections,
                "pending_approval": pending_approval,
                "approved_amount": approved_collections
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل تحصيلات العيادة: {str(e)}")

@router.post("/{clinic_id}/collections")
async def create_clinic_collection(clinic_id: str, collection_data: CollectionModel, current_user: dict = Depends(get_current_user)):
    """إنشاء تحصيل جديد للعيادة (إدخال المحاسب)"""
    try:
        # التحقق من وجود العيادة
        clinic = await db.clinics.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        collection = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "amount": collection_data.amount,
            "description": collection_data.description,
            "payment_method": collection_data.payment_method,
            "receipt_number": collection_data.receipt_number,
            "notes": collection_data.notes,
            "status": "pending",  # يحتاج موافقة المدير
            "collected_by": current_user.get("user_id"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        result = await db.collections.insert_one(collection)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="فشل في حفظ التحصيل")
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "collection_create",
            "description": f"تسجيل تحصيل جديد للعيادة: {clinic.get('clinic_name', 'غير محدد')}",
            "entity_type": "collection",
            "entity_id": collection["id"],
            "clinic_id": clinic_id,
            "additional_data": {
                "amount": collection_data.amount,
                "payment_method": collection_data.payment_method
            },
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        # Return clean collection data without ObjectId
        clean_collection = {
            "id": collection["id"],
            "clinic_id": collection["clinic_id"],
            "amount": collection["amount"],
            "description": collection["description"],
            "payment_method": collection["payment_method"],
            "receipt_number": collection["receipt_number"],
            "status": collection["status"],
            "created_at": collection["created_at"]
        }
        
        return {
            "success": True,
            "message": "تم تسجيل التحصيل بنجاح - في انتظار موافقة المدير",
            "collection": clean_collection
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تسجيل التحصيل: {str(e)}")

@router.put("/collections/{collection_id}/approve")
async def approve_collection(collection_id: str, current_user: dict = Depends(get_current_user)):
    """موافقة المدير على التحصيل"""
    try:
        # التحقق من صلاحية المستخدم (مدير أو admin)
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "gm", "manager", "line_manager", "area_manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح - يتطلب صلاحية إدارية")
        
        # تحديث حالة التحصيل
        result = await db.collections.update_one(
            {"id": collection_id},
            {
                "$set": {
                    "status": "approved",
                    "approved_by": current_user.get("user_id"),
                    "approved_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="التحصيل غير موجود")
        
        # جلب معلومات التحصيل للنشاط
        collection = await db.collections.find_one({"id": collection_id})
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "collection_approve",
            "description": f"موافقة على تحصيل بقيمة {collection.get('amount', 0)} ج.م",
            "entity_type": "collection",
            "entity_id": collection_id,
            "clinic_id": collection.get("clinic_id"),
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم الموافقة على التحصيل بنجاح"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في الموافقة على التحصيل: {str(e)}")