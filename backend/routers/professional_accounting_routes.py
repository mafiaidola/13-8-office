# Professional Accounting Routes - مسارات النظام المحاسبي الاحترافي
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from pymongo import MongoClient
from bson import ObjectId
from typing import List, Optional
from datetime import datetime, timedelta
import os
from decimal import Decimal, ROUND_HALF_UP
import uuid

# Import get_current_user from main server
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from server import get_current_user

# إعداد قاعدة البيانات والأمان
security = HTTPBearer()
client = MongoClient(os.getenv('MONGO_URL', 'mongodb://localhost:27017'))
db = client['medical_management']

# Collections
invoices_collection = db['invoices']
debts_collection = db['debts']
collections_collection = db['collections']
clinics_collection = db['clinics']
users_collection = db['users']
products_collection = db['products']
activities_collection = db['activities']

router = APIRouter(prefix="/api/accounting", tags=["Professional Accounting"])

def verify_token(token: str = Depends(security)):
    """التحقق من الرمز المميز"""
    # تنفيذ التحقق من الرمز المميز هنا
    return {"user_id": "admin", "role": "admin"}

@router.get("/dashboard")
async def get_accounting_dashboard(current_user: dict = Depends(verify_token)):
    """الحصول على لوحة تحكم الحسابات الشاملة"""
    try:
        # إحصائيات الفواتير
        total_invoices = invoices_collection.count_documents({})
        pending_invoices = invoices_collection.count_documents({"status": "pending"})
        paid_invoices = invoices_collection.count_documents({"status": "paid"})
        overdue_invoices = invoices_collection.count_documents({
            "status": "pending",
            "due_date": {"$lt": datetime.now()}
        })
        
        # إحصائيات الديون
        total_debts = debts_collection.count_documents({})
        active_debts = debts_collection.count_documents({"status": "active"})
        collected_debts = debts_collection.count_documents({"status": "collected"})
        
        # حساب المبالغ المالية
        invoice_pipeline = [
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": "$total_amount"},
                "paid_amount": {"$sum": {"$cond": [{"$eq": ["$status", "paid"]}, "$total_amount", 0]}},
                "pending_amount": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, "$total_amount", 0]}}
            }}
        ]
        
        debt_pipeline = [
            {"$group": {
                "_id": None,
                "total_debt_amount": {"$sum": "$amount"},
                "collected_amount": {"$sum": {"$cond": [{"$eq": ["$status", "collected"]}, "$amount", 0]}},
                "outstanding_amount": {"$sum": {"$cond": [{"$eq": ["$status", "active"]}, "$amount", 0]}}
            }}
        ]
        
        invoice_amounts = list(invoices_collection.aggregate(invoice_pipeline))
        debt_amounts = list(debts_collection.aggregate(debt_pipeline))
        
        invoice_totals = invoice_amounts[0] if invoice_amounts else {
            "total_amount": 0, "paid_amount": 0, "pending_amount": 0
        }
        debt_totals = debt_amounts[0] if debt_amounts else {
            "total_debt_amount": 0, "collected_amount": 0, "outstanding_amount": 0
        }
        
        # الأنشطة المالية الحديثة
        recent_activities = list(activities_collection.find(
            {"action": {"$in": ["invoice_create", "debt_create", "collection_create"]}},
            {"_id": 1, "user_name": 1, "action": 1, "description": 1, "timestamp": 1, "entity_id": 1}
        ).sort("timestamp", -1).limit(10))
        
        # العيادات ذات الديون العالية
        high_debt_clinics = list(debts_collection.aggregate([
            {"$match": {"status": "active"}},
            {"$group": {
                "_id": "$clinic_id",
                "total_debt": {"$sum": "$amount"},
                "debt_count": {"$sum": 1}
            }},
            {"$sort": {"total_debt": -1}},
            {"$limit": 10}
        ]))
        
        # إضافة أسماء العيادات
        for clinic_debt in high_debt_clinics:
            clinic = clinics_collection.find_one({"id": clinic_debt["_id"]})
            clinic_debt["clinic_name"] = clinic["name"] if clinic else "عيادة غير معروفة"
        
        return {
            "success": True,
            "dashboard": {
                "invoices": {
                    "total": total_invoices,
                    "pending": pending_invoices,
                    "paid": paid_invoices,
                    "overdue": overdue_invoices,
                    "total_amount": float(invoice_totals["total_amount"]),
                    "paid_amount": float(invoice_totals["paid_amount"]),
                    "pending_amount": float(invoice_totals["pending_amount"])
                },
                "debts": {
                    "total": total_debts,
                    "active": active_debts,
                    "collected": collected_debts,
                    "total_debt_amount": float(debt_totals["total_debt_amount"]),
                    "collected_amount": float(debt_totals["collected_amount"]),
                    "outstanding_amount": float(debt_totals["outstanding_amount"])
                },
                "recent_activities": recent_activities,
                "high_debt_clinics": high_debt_clinics,
                "collection_rate": round((collected_debts / total_debts * 100) if total_debts > 0 else 0, 2),
                "payment_rate": round((paid_invoices / total_invoices * 100) if total_invoices > 0 else 0, 2)
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل لوحة التحكم: {str(e)}")

@router.post("/invoices")
async def create_invoice(invoice_data: dict, current_user: dict = Depends(verify_token)):
    """إنشاء فاتورة جديدة"""
    try:
        # التحقق من البيانات المطلوبة
        required_fields = ["clinic_id", "items", "total_amount"]
        for field in required_fields:
            if field not in invoice_data:
                raise HTTPException(status_code=400, detail=f"الحقل {field} مطلوب")
        
        # التحقق من وجود العيادة
        clinic = clinics_collection.find_one({"id": invoice_data["clinic_id"]})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # إنشاء رقم الفاتورة
        invoice_count = invoices_collection.count_documents({}) + 1
        invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{invoice_count:04d}"
        
        # حساب المبالغ
        subtotal = sum(item["quantity"] * item["unit_price"] for item in invoice_data["items"])
        discount_amount = invoice_data.get("discount_amount", 0)
        tax_amount = invoice_data.get("tax_amount", 0)
        total_amount = subtotal - discount_amount + tax_amount
        
        # إنشاء الفاتورة
        invoice = {
            "id": str(uuid.uuid4()),
            "invoice_number": invoice_number,
            "clinic_id": invoice_data["clinic_id"],
            "clinic_name": clinic["name"],
            "rep_id": current_user["user_id"],
            "rep_name": current_user.get("name", "مستخدم"),
            "items": invoice_data["items"],
            "subtotal": float(subtotal),
            "discount_amount": float(discount_amount),
            "discount_percentage": invoice_data.get("discount_percentage", 0),
            "tax_amount": float(tax_amount),
            "tax_percentage": invoice_data.get("tax_percentage", 0),
            "total_amount": float(total_amount),
            "status": "pending",
            "issue_date": datetime.now(),
            "due_date": datetime.now() + timedelta(days=invoice_data.get("payment_terms", 30)),
            "notes": invoice_data.get("notes", ""),
            "created_by": current_user["user_id"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # حفظ الفاتورة
        result = invoices_collection.insert_one(invoice)
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "user_name": current_user.get("name", "مستخدم"),
            "action": "invoice_create",
            "description": f"إنشاء فاتورة جديدة: {invoice_number} للعيادة: {clinic['name']}",
            "entity_type": "invoice",
            "entity_id": invoice["id"],
            "timestamp": datetime.now(),
            "details": {
                "invoice_number": invoice_number,
                "clinic_name": clinic["name"],
                "total_amount": total_amount
            }
        }
        activities_collection.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم إنشاء الفاتورة بنجاح",
            "invoice": invoice
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الفاتورة: {str(e)}")

@router.get("/invoices")
async def get_invoices(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
    clinic_id: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """الحصول على قائمة الفواتير"""
    try:
        # بناء الاستعلام
        query = {}
        if status:
            query["status"] = status
        if clinic_id:
            query["clinic_id"] = clinic_id
        
        # الحصول على الفواتير
        invoices = list(invoices_collection.find(
            query, 
            {"_id": 0}
        ).sort("created_at", -1).skip(offset).limit(limit))
        
        # إحصائيات الفواتير
        total_count = invoices_collection.count_documents(query)
        
        return {
            "success": True,
            "invoices": invoices,
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل الفواتير: {str(e)}")

@router.post("/debts")
async def create_debt(debt_data: dict, current_user: dict = Depends(verify_token)):
    """إنشاء دين جديد"""
    try:
        # التحقق من البيانات المطلوبة
        required_fields = ["clinic_id", "amount", "description"]
        for field in required_fields:
            if field not in debt_data:
                raise HTTPException(status_code=400, detail=f"الحقل {field} مطلوب")
        
        # التحقق من وجود العيادة
        clinic = clinics_collection.find_one({"id": debt_data["clinic_id"]})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # إنشاء رقم الدين
        debt_count = debts_collection.count_documents({}) + 1
        debt_number = f"DEBT-{datetime.now().strftime('%Y%m%d')}-{debt_count:04d}"
        
        # إنشاء الدين
        debt = {
            "id": str(uuid.uuid4()),
            "debt_number": debt_number,
            "clinic_id": debt_data["clinic_id"],
            "clinic_name": clinic["name"],
            "rep_id": current_user["user_id"],
            "rep_name": current_user.get("name", "مستخدم"),
            "amount": float(debt_data["amount"]),
            "description": debt_data["description"],
            "status": "active",
            "due_date": datetime.now() + timedelta(days=debt_data.get("payment_days", 30)),
            "items": debt_data.get("items", []),
            "discount_amount": float(debt_data.get("discount_amount", 0)),
            "discount_percentage": debt_data.get("discount_percentage", 0),
            "notes": debt_data.get("notes", ""),
            "created_by": current_user["user_id"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # حفظ الدين
        result = debts_collection.insert_one(debt)
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "user_name": current_user.get("name", "مستخدم"),
            "action": "debt_create",
            "description": f"إنشاء دين جديد: {debt_number} للعيادة: {clinic['name']}",
            "entity_type": "debt",
            "entity_id": debt["id"],
            "timestamp": datetime.now(),
            "details": {
                "debt_number": debt_number,
                "clinic_name": clinic["name"],
                "amount": debt_data["amount"]
            }
        }
        activities_collection.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم إنشاء الدين بنجاح",
            "debt": debt
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الدين: {str(e)}")

@router.post("/collections")
async def create_collection(collection_data: dict, current_user: dict = Depends(verify_token)):
    """إنشاء تحصيل جديد"""
    try:
        # التحقق من البيانات المطلوبة
        required_fields = ["debt_id", "amount", "payment_method"]
        for field in required_fields:
            if field not in collection_data:
                raise HTTPException(status_code=400, detail=f"الحقل {field} مطلوب")
        
        # التحقق من وجود الدين
        debt = debts_collection.find_one({"id": collection_data["debt_id"]})
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        if debt["status"] == "collected":
            raise HTTPException(status_code=400, detail="هذا الدين تم تحصيله بالفعل")
        
        # التحقق من المبلغ
        collection_amount = float(collection_data["amount"])
        if collection_amount > debt["amount"]:
            raise HTTPException(status_code=400, detail="مبلغ التحصيل أكبر من مبلغ الدين")
        
        # إنشاء رقم التحصيل
        collection_count = collections_collection.count_documents({}) + 1
        collection_number = f"COL-{datetime.now().strftime('%Y%m%d')}-{collection_count:04d}"
        
        # إنشاء التحصيل
        collection = {
            "id": str(uuid.uuid4()),
            "collection_number": collection_number,
            "debt_id": collection_data["debt_id"],
            "debt_number": debt["debt_number"],
            "clinic_id": debt["clinic_id"],
            "clinic_name": debt["clinic_name"],
            "collector_id": current_user["user_id"],
            "collector_name": current_user.get("name", "مستخدم"),
            "amount": collection_amount,
            "payment_method": collection_data["payment_method"],
            "reference_number": collection_data.get("reference_number", ""),
            "status": "pending_approval",
            "approval_status": "pending",
            "notes": collection_data.get("notes", ""),
            "collection_date": datetime.now(),
            "created_by": current_user["user_id"],
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # حفظ التحصيل
        result = collections_collection.insert_one(collection)
        
        # تحديث حالة الدين إذا تم تحصيله بالكامل
        if collection_amount == debt["amount"]:
            debts_collection.update_one(
                {"id": collection_data["debt_id"]},
                {"$set": {"status": "pending_collection", "updated_at": datetime.now()}}
            )
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "user_name": current_user.get("name", "مستخدم"),
            "action": "collection_create",
            "description": f"تحصيل جديد: {collection_number} للدين: {debt['debt_number']}",
            "entity_type": "collection",
            "entity_id": collection["id"],
            "timestamp": datetime.now(),
            "details": {
                "collection_number": collection_number,
                "debt_number": debt["debt_number"],
                "clinic_name": debt["clinic_name"],
                "amount": collection_amount
            }
        }
        activities_collection.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم إنشاء التحصيل بنجاح وهو في انتظار الموافقة",
            "collection": collection
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التحصيل: {str(e)}")

@router.put("/collections/{collection_id}/approve")
async def approve_collection(collection_id: str, current_user: dict = Depends(verify_token)):
    """الموافقة على التحصيل"""
    try:
        # التحقق من صلاحية الموافقة
        if current_user["role"] not in ["admin", "accounting", "finance"]:
            raise HTTPException(status_code=403, detail="ليس لديك صلاحية للموافقة على التحصيل")
        
        # البحث عن التحصيل
        collection = collections_collection.find_one({"id": collection_id})
        if not collection:
            raise HTTPException(status_code=404, detail="التحصيل غير موجود")
        
        if collection["approval_status"] == "approved":
            raise HTTPException(status_code=400, detail="التحصيل معتمد بالفعل")
        
        # تحديث التحصيل
        collections_collection.update_one(
            {"id": collection_id},
            {"$set": {
                "approval_status": "approved",
                "approved_by": current_user["user_id"],
                "approved_at": datetime.now(),
                "status": "completed",
                "updated_at": datetime.now()
            }}
        )
        
        # تحديث حالة الدين
        debts_collection.update_one(
            {"id": collection["debt_id"]},
            {"$set": {"status": "collected", "updated_at": datetime.now()}}
        )
        
        # تسجيل النشاط
        activity = {
            "id": str(uuid.uuid4()),
            "user_id": current_user["user_id"],
            "user_name": current_user.get("name", "مستخدم"),
            "action": "collection_approve",
            "description": f"الموافقة على التحصيل: {collection['collection_number']}",
            "entity_type": "collection",
            "entity_id": collection_id,
            "timestamp": datetime.now(),
            "details": {
                "collection_number": collection["collection_number"],
                "amount": collection["amount"]
            }
        }
        activities_collection.insert_one(activity)
        
        return {
            "success": True,
            "message": "تم اعتماد التحصيل بنجاح"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في اعتماد التحصيل: {str(e)}")

@router.get("/reports/clinic/{clinic_id}")
async def get_clinic_financial_report(clinic_id: str, current_user: dict = Depends(verify_token)):
    """تقرير مالي شامل للعيادة"""
    try:
        # التحقق من وجود العيادة
        clinic = clinics_collection.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # الحصول على الفواتير
        invoices = list(invoices_collection.find(
            {"clinic_id": clinic_id},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # الحصول على الديون
        debts = list(debts_collection.find(
            {"clinic_id": clinic_id},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # الحصول على التحصيلات
        debt_ids = [debt["id"] for debt in debts]
        collections = list(collections_collection.find(
            {"debt_id": {"$in": debt_ids}},
            {"_id": 0}
        ).sort("created_at", -1))
        
        # حساب الإحصائيات
        total_invoices = len(invoices)
        total_invoice_amount = sum(inv["total_amount"] for inv in invoices)
        paid_invoices = sum(1 for inv in invoices if inv["status"] == "paid")
        
        total_debts = len(debts)
        total_debt_amount = sum(debt["amount"] for debt in debts)
        collected_debts = sum(1 for debt in debts if debt["status"] == "collected")
        
        total_collections = len(collections)
        total_collected_amount = sum(col["amount"] for col in collections if col["approval_status"] == "approved")
        
        return {
            "success": True,
            "clinic": clinic,
            "financial_summary": {
                "invoices": {
                    "total_count": total_invoices,
                    "total_amount": total_invoice_amount,
                    "paid_count": paid_invoices,
                    "payment_rate": round((paid_invoices / total_invoices * 100) if total_invoices > 0 else 0, 2)
                },
                "debts": {
                    "total_count": total_debts,
                    "total_amount": total_debt_amount,
                    "collected_count": collected_debts,
                    "outstanding_amount": total_debt_amount - total_collected_amount,
                    "collection_rate": round((collected_debts / total_debts * 100) if total_debts > 0 else 0, 2)
                },
                "collections": {
                    "total_count": total_collections,
                    "total_amount": total_collected_amount
                }
            },
            "invoices": invoices,
            "debts": debts,
            "collections": collections
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تحميل التقرير المالي: {str(e)}")

# تصدير المسارات
__all__ = ["router"]