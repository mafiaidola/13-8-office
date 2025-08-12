# Enhanced Professional Accounting Routes - مسارات النظام المحاسبي الاحترافي المحسن
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import os
import uuid
from pydantic import BaseModel
import jwt
from bson import ObjectId

# إعداد قاعدة البيانات والأمان
security = HTTPBearer()
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

router = APIRouter(prefix="/api/enhanced-professional-accounting", tags=["Enhanced Professional Accounting"])

# Helper function to handle ObjectId serialization
def serialize_doc(doc):
    """تحويل MongoDB document إلى JSON serializable"""
    if doc is None:
        return None
    if "_id" in doc:
        del doc["_id"]
    return doc

# Models
class InvoiceItemModel(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    total_price: float

class InvoiceModel(BaseModel):
    clinic_id: str
    rep_id: str
    items: List[InvoiceItemModel]
    subtotal: float
    discount_type: str = "percentage"  # percentage or fixed
    discount_value: float = 0
    discount_amount: float = 0
    total_amount: float
    payment_terms: str = "cash"
    due_date: Optional[str] = None
    notes: Optional[str] = ""
    created_by_name: Optional[str] = ""

class DebtModel(BaseModel):
    clinic_id: str
    rep_id: str
    description: str
    items: List[InvoiceItemModel] = []
    subtotal: float
    discount_percentage: float = 0
    discount_amount: float = 0
    total_amount: float
    due_date: str
    priority: str = "medium"
    category: str = "purchase"

class CollectionModel(BaseModel):
    invoice_id: Optional[str] = None
    debt_id: Optional[str] = None
    payment_type: str = "full"  # full, partial, items
    amount: float
    selected_items: List[str] = []
    payment_method: str = "cash"
    receipt_number: Optional[str] = None
    notes: Optional[str] = ""

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

@router.get("/dashboard")
async def get_accounting_dashboard(current_user: dict = Depends(get_current_user)):
    """الحصول على لوحة التحكم المحاسبية الشاملة"""
    try:
        # إحصائيات الفواتير
        invoices_count = await db.invoices.count_documents({})
        total_invoices_amount = 0
        pending_invoices = 0
        
        invoices_cursor = db.invoices.find({}, {"_id": 0})
        async for invoice in invoices_cursor:
            total_invoices_amount += invoice.get("total_amount", 0)
            if invoice.get("status") == "pending":
                pending_invoices += 1
        
        # إحصائيات الديون
        debts_count = await db.debts.count_documents({})
        total_debts_amount = 0
        overdue_debts = 0
        
        debts_cursor = db.debts.find({}, {"_id": 0})
        async for debt in debts_cursor:
            total_debts_amount += debt.get("total_amount", 0)
            if debt.get("due_date"):
                try:
                    due_date = datetime.fromisoformat(debt["due_date"])
                    if due_date < datetime.now():
                        overdue_debts += 1
                except:
                    pass
        
        # إحصائيات التحصيل
        collections_count = await db.collections.count_documents({})
        total_collections_amount = 0
        
        collections_cursor = db.collections.find({}, {"_id": 0})
        async for collection in collections_cursor:
            total_collections_amount += collection.get("amount", 0)
        
        # إحصائيات الأنشطة المحاسبية
        accounting_activities = await db.activities.count_documents({
            "action": {"$in": ["invoice_create", "debt_create", "collection_create", "payment_process"]}
        })
        
        # أحدث الفواتير
        recent_invoices = []
        recent_invoices_cursor = db.invoices.find({}, {"_id": 0}).sort([("created_at", -1)]).limit(5)
        async for invoice in recent_invoices_cursor:
            recent_invoices.append(invoice)
        
        # أحدث الديون
        recent_debts = []
        recent_debts_cursor = db.debts.find({}, {"_id": 0}).sort([("created_at", -1)]).limit(5)
        async for debt in recent_debts_cursor:
            recent_debts.append(debt)
        
        return {
            "success": True,
            "dashboard": {
                "invoices": {
                    "total_count": invoices_count,
                    "total_amount": total_invoices_amount,
                    "pending_count": pending_invoices,
                    "recent": recent_invoices
                },
                "debts": {
                    "total_count": debts_count,
                    "total_amount": total_debts_amount,
                    "overdue_count": overdue_debts,
                    "recent": recent_debts
                },
                "collections": {
                    "total_count": collections_count,
                    "total_amount": total_collections_amount
                },
                "activities": {
                    "accounting_activities_count": accounting_activities
                },
                "summary": {
                    "net_revenue": total_invoices_amount + total_collections_amount,
                    "outstanding_debts": total_debts_amount,
                    "collection_ratio": (total_collections_amount / total_invoices_amount * 100) if total_invoices_amount > 0 else 0
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل لوحة التحكم: {str(e)}")

@router.post("/invoices")
async def create_comprehensive_invoice(invoice_data: InvoiceModel, current_user: dict = Depends(get_current_user)):
    """إنشاء فاتورة شاملة احترافية"""
    try:
        # التحقق من وجود العيادة والمندوب
        clinic = await db.clinics.find_one({"id": invoice_data.clinic_id}, {"_id": 0})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        rep = await db.users.find_one({"id": invoice_data.rep_id}, {"_id": 0})
        if not rep:
            raise HTTPException(status_code=404, detail="المندوب غير موجود")
        
        # إنشاء رقم الفاتورة
        invoice_number = f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # إنشاء الفاتورة
        invoice = {
            "id": str(uuid.uuid4()),
            "invoice_number": invoice_number,
            "clinic_id": invoice_data.clinic_id,
            "clinic_name": clinic.get('clinic_name', clinic.get('name', '')),
            "doctor_name": clinic.get('doctor_name', ''),
            "clinic_phone": clinic.get('clinic_phone', clinic.get('phone', '')),
            "rep_id": invoice_data.rep_id,
            "rep_name": rep.get('full_name', rep.get('name', '')),
            "items": [item.dict() for item in invoice_data.items],
            "subtotal": invoice_data.subtotal,
            "discount_type": invoice_data.discount_type,
            "discount_value": invoice_data.discount_value,
            "discount_amount": invoice_data.discount_amount,
            "total_amount": invoice_data.total_amount,
            "payment_terms": invoice_data.payment_terms,
            "due_date": invoice_data.due_date,
            "notes": invoice_data.notes,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id"),
            "created_by_name": invoice_data.created_by_name or current_user.get("full_name", "مستخدم غير معروف"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # حفظ في قاعدة البيانات
        result = await db.invoices.insert_one(invoice)
        invoice["_id"] = str(result.inserted_id)  # تحويل ObjectId إلى string
        
        # تنظيف البيانات لإرجاعها
        clean_invoice = serialize_doc(dict(invoice))
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "invoice_create",
            "description": f"إنشاء فاتورة احترافية #{invoice_number} بقيمة {invoice_data.total_amount} ج.م للعيادة: {clinic.get('clinic_name', clinic.get('name', 'غير محدد'))}",
            "entity_type": "invoice",
            "entity_id": invoice["id"],
            "clinic_id": invoice_data.clinic_id,
            "additional_data": {
                "invoice_number": invoice_number,
                "total_amount": invoice_data.total_amount,
                "items_count": len(invoice_data.items),
                "discount_amount": invoice_data.discount_amount,
                "discount_type": invoice_data.discount_type,
                "payment_terms": invoice_data.payment_terms
            },
            "timestamp": datetime.utcnow(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم إنشاء الفاتورة الاحترافية بنجاح",
            "invoice": clean_invoice
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الفاتورة: {str(e)}")

@router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع الفواتير"""
    try:
        invoices = []
        cursor = db.invoices.find({}, {"_id": 0}).sort([("created_at", -1)])
        
        async for invoice in cursor:
            # إضافة معلومات العيادة والمندوب
            clinic = await db.clinics.find_one({"id": invoice.get("clinic_id")}, {"_id": 0})
            rep = await db.users.find_one({"id": invoice.get("rep_id")}, {"_id": 0})
            
            if clinic:
                invoice["clinic_info"] = {
                    "name": clinic.get('clinic_name', clinic.get('name', '')),
                    "doctor_name": clinic.get('doctor_name', ''),
                    "phone": clinic.get('clinic_phone', clinic.get('phone', ''))
                }
            
            if rep:
                invoice["rep_info"] = {
                    "name": rep.get('full_name', rep.get('name', '')),
                    "role": rep.get('role', '')
                }
            
            invoices.append(invoice)
        
        return {
            "success": True,
            "invoices": invoices,
            "total_count": len(invoices)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الفواتير: {str(e)}")

@router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    """حذف فاتورة"""
    try:
        # البحث عن الفاتورة
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
        
        # حذف الفاتورة
        result = await db.invoices.delete_one({"id": invoice_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="لم يتم العثور على الفاتورة")
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "invoice_delete",
            "description": f"حذف فاتورة #{invoice.get('invoice_number', invoice_id)} بقيمة {invoice.get('total_amount', 0)} ج.م",
            "entity_type": "invoice",
            "entity_id": invoice_id,
            "timestamp": datetime.utcnow(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم حذف الفاتورة بنجاح"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في حذف الفاتورة: {str(e)}")

@router.post("/debts")
async def create_comprehensive_debt(debt_data: DebtModel, current_user: dict = Depends(get_current_user)):
    """إنشاء دين شامل احترافي - متاح للادمن والمحاسب فقط"""
    try:
        # التحقق من الصلاحيات
        user_role = current_user.get("role", "")
        if user_role not in ["admin", "accounting", "finance"]:
            raise HTTPException(status_code=403, detail="غير مسموح - هذه الوظيفة متاحة للادمن والمحاسب فقط")
        
        # التحقق من وجود العيادة والمندوب
        clinic = await db.clinics.find_one({"id": debt_data.clinic_id}, {"_id": 0})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        rep = await db.users.find_one({"id": debt_data.rep_id}, {"_id": 0})
        if not rep:
            raise HTTPException(status_code=404, detail="المندوب غير موجود")
        
        # إنشاء رقم الدين
        debt_number = f"DEBT-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # إنشاء الدين
        debt = {
            "id": str(uuid.uuid4()),
            "debt_number": debt_number,
            "clinic_id": debt_data.clinic_id,
            "clinic_name": clinic.get('clinic_name', clinic.get('name', '')),
            "doctor_name": clinic.get('doctor_name', ''),
            "rep_id": debt_data.rep_id,
            "rep_name": rep.get('full_name', rep.get('name', '')),
            "description": debt_data.description,
            "items": [item.dict() for item in debt_data.items],
            "subtotal": debt_data.subtotal,
            "discount_percentage": debt_data.discount_percentage,
            "discount_amount": debt_data.discount_amount,
            "total_amount": debt_data.total_amount,
            "due_date": debt_data.due_date,
            "priority": debt_data.priority,
            "category": debt_data.category,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id"),
            "created_by_name": current_user.get("full_name", "مستخدم غير معروف"),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # حفظ في قاعدة البيانات
        result = await db.debts.insert_one(debt)
        debt["_id"] = str(result.inserted_id)  # تحويل ObjectId إلى string
        
        # تنظيف البيانات لإرجاعها
        clean_debt = serialize_doc(dict(debt))
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "debt_create",
            "description": f"إنشاء دين احترافي #{debt_number} بقيمة {debt_data.total_amount} ج.م للعيادة: {clinic.get('clinic_name', clinic.get('name', 'غير محدد'))}",
            "entity_type": "debt",
            "entity_id": debt["id"],
            "clinic_id": debt_data.clinic_id,
            "additional_data": {
                "debt_number": debt_number,
                "total_amount": debt_data.total_amount,
                "items_count": len(debt_data.items),
                "discount_amount": debt_data.discount_amount,
                "priority": debt_data.priority,
                "category": debt_data.category
            },
            "timestamp": datetime.utcnow(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم إنشاء الدين الاحترافي بنجاح",
            "debt": clean_debt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الدين: {str(e)}")

@router.get("/debts")
async def get_debts(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع الديون"""
    try:
        debts = []
        cursor = db.debts.find({}, {"_id": 0}).sort([("created_at", -1)])
        
        async for debt in cursor:
            # إضافة معلومات العيادة والمندوب
            clinic = await db.clinics.find_one({"id": debt.get("clinic_id")}, {"_id": 0})
            rep = await db.users.find_one({"id": debt.get("rep_id")}, {"_id": 0})
            
            if clinic:
                debt["clinic_info"] = {
                    "name": clinic.get('clinic_name', clinic.get('name', '')),
                    "doctor_name": clinic.get('doctor_name', ''),
                    "phone": clinic.get('clinic_phone', clinic.get('phone', ''))
                }
            
            if rep:
                debt["rep_info"] = {
                    "name": rep.get('full_name', rep.get('name', '')),
                    "role": rep.get('role', '')
                }
            
            # حساب حالة التأخير
            if debt.get('due_date'):
                due_date = datetime.fromisoformat(debt['due_date'])
                debt['is_overdue'] = due_date < datetime.now()
                debt['days_until_due'] = (due_date - datetime.now()).days
            
            debts.append(debt)
        
        return {
            "success": True,
            "debts": debts,
            "total_count": len(debts)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الديون: {str(e)}")

@router.post("/collections")
async def create_comprehensive_collection(collection_data: CollectionModel, current_user: dict = Depends(get_current_user)):
    """إنشاء تحصيل شامل مع إمكانية الدفع الجزئي أو الكلي"""
    try:
        # التحقق من وجود الفاتورة أو الدين
        source_document = None
        source_type = None
        
        if collection_data.invoice_id:
            source_document = await db.invoices.find_one({"id": collection_data.invoice_id}, {"_id": 0})
            source_type = "invoice"
        elif collection_data.debt_id:
            source_document = await db.debts.find_one({"id": collection_data.debt_id}, {"_id": 0})
            source_type = "debt"
        else:
            raise HTTPException(status_code=400, detail="يجب تحديد فاتورة أو دين للتحصيل")
        
        if not source_document:
            raise HTTPException(status_code=404, detail="المستند المطلوب غير موجود")
        
        # إنشاء رقم التحصيل
        collection_number = f"COL-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # إنشاء التحصيل
        collection = {
            "id": str(uuid.uuid4()),
            "collection_number": collection_number,
            "invoice_id": collection_data.invoice_id,
            "debt_id": collection_data.debt_id,
            "source_type": source_type,
            "source_number": source_document.get("invoice_number") or source_document.get("debt_number"),
            "clinic_id": source_document.get("clinic_id"),
            "clinic_name": source_document.get("clinic_name"),
            "rep_id": source_document.get("rep_id"),
            "rep_name": source_document.get("rep_name"),
            "payment_type": collection_data.payment_type,
            "amount": collection_data.amount,
            "selected_items": collection_data.selected_items,
            "payment_method": collection_data.payment_method,
            "receipt_number": collection_data.receipt_number,
            "notes": collection_data.notes,
            "status": "pending",  # يحتاج موافقة المدير
            "collected_by": current_user.get("user_id"),
            "collected_by_name": current_user.get("full_name", "مستخدم غير معروف"),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # حفظ في قاعدة البيانات
        result = await db.collections.insert_one(collection)
        collection["_id"] = str(result.inserted_id)  # تحويل ObjectId إلى string
        
        # تنظيف البيانات لإرجاعها
        clean_collection = serialize_doc(dict(collection))
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("full_name", "مستخدم"),
            "action": "collection_create",
            "description": f"تسجيل تحصيل #{collection_number} بقيمة {collection_data.amount} ج.م من {source_type} #{source_document.get('invoice_number') or source_document.get('debt_number')}",
            "entity_type": "collection",
            "entity_id": collection["id"],
            "clinic_id": source_document.get("clinic_id"),
            "additional_data": {
                "collection_number": collection_number,
                "amount": collection_data.amount,
                "payment_type": collection_data.payment_type,
                "payment_method": collection_data.payment_method,
                "source_type": source_type
            },
            "timestamp": datetime.utcnow(),
            "success": True
        }
        await db.activities.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم تسجيل التحصيل بنجاح - في انتظار موافقة المدير",
            "collection": clean_collection
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تسجيل التحصيل: {str(e)}")

@router.get("/collections")
async def get_collections(current_user: dict = Depends(get_current_user)):
    """الحصول على جميع التحصيلات"""
    try:
        collections = []
        cursor = db.collections.find({}, {"_id": 0}).sort([("created_at", -1)])
        
        async for collection in cursor:
            # إضافة معلومات من جمع التحصيل
            collector = await db.users.find_one({"id": collection.get("collected_by")}, {"_id": 0})
            if collector:
                collection["collector_info"] = {
                    "name": collector.get('full_name', collector.get('name', '')),
                    "role": collector.get('role', '')
                }
            
            # إضافة معلومات من وافق على التحصيل
            if collection.get("approved_by"):
                approver = await db.users.find_one({"id": collection["approved_by"]}, {"_id": 0})
                if approver:
                    collection["approver_info"] = {
                        "name": approver.get('full_name', approver.get('name', '')),
                        "role": approver.get('role', '')
                    }
            
            collections.append(collection)
        
        return {
            "success": True,
            "collections": collections,
            "total_count": len(collections)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل التحصيلات: {str(e)}")

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
                    "approved_by_name": current_user.get("full_name", "مستخدم غير معروف"),
                    "approved_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
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
            "description": f"موافقة على تحصيل #{collection.get('collection_number', collection_id)} بقيمة {collection.get('amount', 0)} ج.م",
            "entity_type": "collection",
            "entity_id": collection_id,
            "clinic_id": collection.get("clinic_id"),
            "additional_data": {
                "collection_number": collection.get('collection_number'),
                "amount": collection.get('amount'),
                "approved_by_role": user_role
            },
            "timestamp": datetime.utcnow(),
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

@router.get("/reports/financial")
async def get_financial_reports(
    start_date: Optional[str] = None, 
    end_date: Optional[str] = None,
    clinic_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """تقارير مالية شاملة"""
    try:
        # إعداد فلتر التاريخ
        date_filter = {}
        if start_date:
            date_filter["$gte"] = start_date
        if end_date:
            date_filter["$lte"] = end_date
        
        base_filter = {}
        if date_filter:
            base_filter["created_at"] = date_filter
        if clinic_id:
            base_filter["clinic_id"] = clinic_id
        
        # تقرير الفواتير
        invoices_pipeline = [
            {"$match": base_filter},
            {"$group": {
                "_id": None,
                "total_invoices": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"},
                "total_discount": {"$sum": "$discount_amount"}
            }}
        ]
        invoices_report = list(await db.invoices.aggregate(invoices_pipeline).to_list(length=1))
        
        # تقرير الديون
        debts_pipeline = [
            {"$match": base_filter},
            {"$group": {
                "_id": None,
                "total_debts": {"$sum": 1},
                "total_amount": {"$sum": "$total_amount"}
            }}
        ]
        debts_report = list(await db.debts.aggregate(debts_pipeline).to_list(length=1))
        
        # تقرير التحصيلات
        collections_pipeline = [
            {"$match": base_filter},
            {"$group": {
                "_id": None,
                "total_collections": {"$sum": 1},
                "total_amount": {"$sum": "$amount"}
            }}
        ]
        collections_report = list(await db.collections.aggregate(collections_pipeline).to_list(length=1))
        
        # إعداد النتائج
        invoices_data = invoices_report[0] if invoices_report else {"total_invoices": 0, "total_amount": 0, "total_discount": 0}
        debts_data = debts_report[0] if debts_report else {"total_debts": 0, "total_amount": 0}
        collections_data = collections_report[0] if collections_report else {"total_collections": 0, "total_amount": 0}
        
        return {
            "success": True,
            "report": {
                "period": {
                    "start_date": start_date,
                    "end_date": end_date,
                    "clinic_id": clinic_id
                },
                "invoices": invoices_data,
                "debts": debts_data,
                "collections": collections_data,
                "summary": {
                    "total_revenue": invoices_data["total_amount"],
                    "total_debts": debts_data["total_amount"],
                    "total_collections": collections_data["total_amount"],
                    "net_balance": invoices_data["total_amount"] - debts_data["total_amount"] + collections_data["total_amount"]
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التقرير المالي: {str(e)}")