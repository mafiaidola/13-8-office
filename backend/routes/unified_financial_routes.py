# نظام الإدارة الطبية المتكامل - واجهات برمجة التطبيقات المالية الموحدة
# Medical Management System - Unified Financial APIs

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
import traceback
import uuid

from models.all_models import User
from models.unified_financial_models import (
    UnifiedFinancialRecord, TransactionType, UnifiedTransactionStatus,
    PaymentMethod, CreateFinancialRecordRequest, ProcessPaymentRequest,
    UnifiedFinancialSummary
)
from routes.auth_routes import get_current_user

# إنشاء الموجه المالي الموحد
router = APIRouter(prefix="/unified-financial", tags=["Unified Financial Management"])

# ============================================================================
# UNIFIED FINANCIAL ENDPOINTS - واجهات النظام المالي الموحد
# ============================================================================

@router.get("/dashboard/overview")
async def get_unified_financial_overview(
    current_user: User = Depends(get_current_user)
):
    """نظرة عامة موحدة على النظام المالي"""
    try:
        from server import db
        
        # إحصائيات موحدة من جميع السجلات المالية
        total_records = await db.unified_financial_records.count_documents({})
        
        # إحصائيات حسب النوع
        invoice_count = await db.unified_financial_records.count_documents({"record_type": "invoice"})
        debt_count = await db.unified_financial_records.count_documents({"record_type": "debt"})
        payment_count = await db.unified_financial_records.count_documents({"record_type": "payment"})
        collection_count = await db.unified_financial_records.count_documents({"record_type": "collection"})
        
        # إحصائيات حسب الحالة
        pending_count = await db.unified_financial_records.count_documents({"status": "pending"})
        paid_count = await db.unified_financial_records.count_documents({"status": "paid"})
        overdue_count = await db.unified_financial_records.count_documents({"status": "overdue"})
        
        # حساب المبالغ الإجمالية
        pipeline_amounts = [
            {
                "$group": {
                    "_id": None,
                    "total_invoiced": {
                        "$sum": {
                            "$cond": [
                                {"$eq": ["$record_type", "invoice"]},
                                {"$toDouble": "$net_amount"}, 
                                0
                            ]
                        }
                    },
                    "total_collected": {
                        "$sum": {
                            "$cond": [
                                {"$in": ["$record_type", ["payment", "collection"]]},
                                {"$toDouble": "$net_amount"},
                                0
                            ]
                        }
                    },
                    "total_outstanding": {
                        "$sum": {
                            "$cond": [
                                {"$ne": ["$status", "paid"]},
                                {"$toDouble": "$outstanding_amount"},
                                0
                            ]
                        }
                    }
                }
            }
        ]
        
        amounts_result = await db.unified_financial_records.aggregate(pipeline_amounts).to_list(1)
        amounts = amounts_result[0] if amounts_result else {
            "total_invoiced": 0,
            "total_collected": 0, 
            "total_outstanding": 0
        }
        
        # حساب معدل التحصيل
        collection_rate = 0
        if amounts["total_invoiced"] > 0:
            collection_rate = (amounts["total_collected"] / amounts["total_invoiced"]) * 100
        
        # أفضل 5 عيادات من ناحية القيمة
        top_clinics_pipeline = [
            {
                "$group": {
                    "_id": "$clinic_id",
                    "clinic_name": {"$first": "$clinic_name"},
                    "total_value": {"$sum": {"$toDouble": "$net_amount"}},
                    "records_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_value": -1}},
            {"$limit": 5}
        ]
        
        top_clinics = await db.unified_financial_records.aggregate(top_clinics_pipeline).to_list(5)
        
        # العيادات عالية المخاطر (مديونيات عالية)
        high_risk_pipeline = [
            {
                "$match": {
                    "status": {"$in": ["overdue", "pending"]},
                    "outstanding_amount": {"$gt": 1000}
                }
            },
            {
                "$group": {
                    "_id": "$clinic_id",
                    "clinic_name": {"$first": "$clinic_name"},
                    "total_outstanding": {"$sum": {"$toDouble": "$outstanding_amount"}},
                    "overdue_count": {"$sum": 1}
                }
            },
            {"$sort": {"total_outstanding": -1}},
            {"$limit": 10}
        ]
        
        high_risk_clinics = await db.unified_financial_records.aggregate(high_risk_pipeline).to_list(10)
        
        return {
            "success": True,
            "overview": {
                "total_records": total_records,
                "record_breakdown": {
                    "invoices": invoice_count,
                    "debts": debt_count,
                    "payments": payment_count,
                    "collections": collection_count
                },
                "status_breakdown": {
                    "pending": pending_count,
                    "paid": paid_count,
                    "overdue": overdue_count
                },
                "financial_summary": {
                    "total_invoiced": amounts["total_invoiced"],
                    "total_collected": amounts["total_collected"],
                    "total_outstanding": amounts["total_outstanding"],
                    "collection_rate": round(collection_rate, 2)
                },
                "top_performing_clinics": top_clinics,
                "high_risk_clients": high_risk_clinics,
                "currency": "EGP"
            }
        }
        
    except Exception as e:
        print(f"Error getting unified financial overview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب النظرة العامة المالية الموحدة")

@router.get("/records")
async def get_financial_records(
    record_type: Optional[TransactionType] = None,
    status: Optional[UnifiedTransactionStatus] = None,
    clinic_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على السجلات المالية الموحدة مع فلترة"""
    try:
        from server import db
        
        # بناء فلتر البحث
        query_filter = {}
        
        # فلترة حسب الدور
        if current_user.get("role") == "medical_rep":
            query_filter["sales_rep_id"] = current_user.get("id")
        
        # فلاتر المستخدم
        if record_type:
            query_filter["record_type"] = record_type
        
        if status:
            query_filter["status"] = status
            
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if start_date and end_date:
            query_filter["issue_date"] = {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        elif start_date:
            query_filter["issue_date"] = {"$gte": start_date.isoformat()}
        elif end_date:
            query_filter["issue_date"] = {"$lte": end_date.isoformat()}
        
        # جلب السجلات
        records = []
        cursor = db.unified_financial_records.find(query_filter).skip(skip).limit(limit).sort("created_at", -1)
        
        async for record in cursor:
            # حساب تقادم السجل
            due_date_str = record.get("due_date", "")
            days_overdue = 0
            if due_date_str:
                try:
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).date()
                    days_overdue = max(0, (date.today() - due_date).days)
                except:
                    pass
            
            # تحديد أولوية التحصيل
            priority = "low"
            if days_overdue > 60:
                priority = "urgent"
            elif days_overdue > 30:
                priority = "high"
            elif days_overdue > 0:
                priority = "medium"
            
            records.append({
                "id": record.get("id", ""),
                "record_number": record.get("record_number", ""),
                "record_type": record.get("record_type", ""),
                "clinic_name": record.get("clinic_name", ""),
                "sales_rep_name": record.get("sales_rep_name", ""),
                "original_amount": float(record.get("original_amount", 0)),
                "paid_amount": float(record.get("paid_amount", 0)),
                "outstanding_amount": float(record.get("outstanding_amount", 0)),
                "issue_date": record.get("issue_date", ""),
                "due_date": record.get("due_date", ""),
                "status": record.get("status", ""),
                "priority": priority,
                "days_overdue": days_overdue,
                "payment_method": record.get("payment_method", ""),
                "reference_number": record.get("reference_number", "")
            })
        
        # إحصائيات الصفحة الحالية
        total_count = await db.unified_financial_records.count_documents(query_filter)
        
        return {
            "success": True,
            "records": records,
            "pagination": {
                "total": total_count,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total_count
            }
        }
        
    except Exception as e:
        print(f"Error fetching financial records: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب السجلات المالية")

@router.post("/records")
async def create_financial_record(
    request: CreateFinancialRecordRequest,
    current_user: User = Depends(get_current_user)
):
    """إنشاء سجل مالي جديد موحد"""
    try:
        from server import db
        
        # التحقق من الصلاحيات
        if current_user.get("role") not in ["admin", "manager", "accountant"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بإنشاء سجلات مالية")
        
        # جلب معلومات العيادة
        clinic = await db.clinics.find_one({"id": request.clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # تحديد المندوب المخصص للعيادة
        sales_rep_id = clinic.get("assigned_rep_id", "")
        sales_rep_name = "غير محدد"
        
        if sales_rep_id:
            rep = await db.users.find_one({"id": sales_rep_id})
            if rep:
                sales_rep_name = rep.get("full_name", "غير محدد")
        
        # إنشاء رقم السجل التلقائي
        prefix_map = {
            TransactionType.INVOICE: "INV",
            TransactionType.DEBT: "DBT", 
            TransactionType.PAYMENT: "PAY",
            TransactionType.COLLECTION: "COL"
        }
        prefix = prefix_map.get(request.record_type, "FIN")
        record_number = f"{prefix}-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # حساب المبلغ الصافي (مؤقتاً بدون ضرائب أو خصومات)
        net_amount = request.original_amount
        outstanding_amount = net_amount
        
        # إنشاء السجل المالي الموحد
        financial_record = {
            "id": str(uuid.uuid4()),
            "record_number": record_number,
            "record_type": request.record_type,
            "order_id": request.order_id,
            "clinic_id": request.clinic_id,
            "clinic_name": clinic.get("name", "غير محدد"),
            "clinic_contact": clinic.get("phone", ""),
            "clinic_address": clinic.get("address", ""),
            "sales_rep_id": sales_rep_id,
            "sales_rep_name": sales_rep_name,
            "area_id": clinic.get("area_id", ""),
            "area_name": clinic.get("area_name", ""),
            "original_amount": float(request.original_amount),
            "discount_amount": float(request.discount_amount or 0),
            "tax_amount": float(request.tax_amount or 0),
            "net_amount": float(net_amount),
            "paid_amount": 0.0,
            "outstanding_amount": float(outstanding_amount),
            "issue_date": date.today().isoformat(),
            "due_date": request.due_date.isoformat(),
            "status": UnifiedTransactionStatus.PENDING,
            "priority": "medium",
            "description": request.description,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("id", ""),
            "audit_log": [{
                "action": "record_created",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": current_user.get("id", ""),
                "user_name": current_user.get("full_name", ""),
                "details": f"إنشاء سجل {request.record_type} بمبلغ {request.original_amount} ج.م"
            }]
        }
        
        # حفظ السجل في قاعدة البيانات
        result = await db.unified_financial_records.insert_one(financial_record)
        
        if result.inserted_id:
            financial_record["_id"] = str(result.inserted_id)
            return {
                "success": True,
                "message": "تم إنشاء السجل المالي بنجاح",
                "record": financial_record
            }
        else:
            raise HTTPException(status_code=500, detail="خطأ في حفظ السجل المالي")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating financial record: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء السجل المالي")

@router.post("/process-payment")
async def process_payment(
    request: ProcessPaymentRequest,
    current_user: User = Depends(get_current_user)
):
    """معالجة دفعة مالية موحدة"""
    try:
        from server import db
        
        # جلب السجل المالي
        financial_record = await db.unified_financial_records.find_one({"id": request.financial_record_id})
        if not financial_record:
            raise HTTPException(status_code=404, detail="السجل المالي غير موجود")
        
        # التحقق من المبلغ
        outstanding_amount = float(financial_record.get("outstanding_amount", 0))
        if float(request.amount) > outstanding_amount:
            raise HTTPException(
                status_code=400, 
                detail=f"مبلغ الدفعة ({request.amount} ج.م) أكبر من المبلغ المتبقي ({outstanding_amount} ج.م)"
            )
        
        # تحديث المبالغ
        new_paid_amount = float(financial_record.get("paid_amount", 0)) + float(request.amount)
        new_outstanding_amount = outstanding_amount - float(request.amount)
        
        # تحديد الحالة الجديدة
        new_status = UnifiedTransactionStatus.PARTIALLY_PAID
        if new_outstanding_amount <= 0.01:  # تسامح للأخطاء الرقمية
            new_status = UnifiedTransactionStatus.PAID
            new_outstanding_amount = 0.0
        
        # إنشاء سجل دفعة منفصل
        payment_record = {
            "id": str(uuid.uuid4()),
            "record_number": f"PAY-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "record_type": TransactionType.PAYMENT,
            "parent_record_id": request.financial_record_id,
            "clinic_id": financial_record.get("clinic_id", ""),
            "clinic_name": financial_record.get("clinic_name", ""),
            "sales_rep_id": financial_record.get("sales_rep_id", ""),
            "sales_rep_name": financial_record.get("sales_rep_name", ""),
            "original_amount": float(request.amount),
            "net_amount": float(request.amount),
            "paid_amount": float(request.amount),
            "outstanding_amount": 0.0,
            "issue_date": date.today().isoformat(),
            "due_date": date.today().isoformat(),
            "payment_date": date.today().isoformat(),
            "status": UnifiedTransactionStatus.PAID,
            "payment_method": request.payment_method,
            "reference_number": request.reference_number,
            "description": f"دفعة للسجل {financial_record.get('record_number', '')}",
            "notes": request.notes,
            "created_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("id", "")
        }
        
        # حفظ سجل الدفعة
        await db.unified_financial_records.insert_one(payment_record)
        
        # تحديث السجل الأصلي
        update_data = {
            "paid_amount": new_paid_amount,
            "outstanding_amount": new_outstanding_amount,
            "status": new_status,
            "payment_date": date.today().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("id", "")
        }
        
        # إضافة إلى مسار التدقيق
        audit_entry = {
            "action": "payment_processed",
            "amount": float(request.amount),
            "payment_method": request.payment_method,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": current_user.get("id", ""),
            "user_name": current_user.get("full_name", ""),
            "remaining_amount": new_outstanding_amount
        }
        
        # تحديث مسار التدقيق
        current_audit_log = financial_record.get("audit_log", [])
        current_audit_log.append(audit_entry)
        update_data["audit_log"] = current_audit_log
        
        # إذا تم السداد بالكامل
        if new_status == UnifiedTransactionStatus.PAID:
            update_data["completion_date"] = date.today().isoformat()
        
        # تطبيق التحديثات
        result = await db.unified_financial_records.update_one(
            {"id": request.financial_record_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "تم تسجيل الدفعة بنجاح",
                "payment_record": payment_record,
                "updated_outstanding": new_outstanding_amount,
                "new_status": new_status
            }
        else:
            raise HTTPException(status_code=500, detail="خطأ في تحديث السجل المالي")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error processing payment: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في معالجة الدفعة")

@router.get("/reports/comprehensive")
async def get_comprehensive_financial_report(
    start_date: date = Query(..., description="تاريخ البداية (مطلوب)"),
    end_date: date = Query(..., description="تاريخ النهاية (مطلوب)"),
    clinic_ids: Optional[str] = Query(None, description="معرفات العيادات مفصولة بفواصل"),
    sales_rep_ids: Optional[str] = Query(None, description="معرفات المناديب مفصولة بفواصل"),
    current_user: User = Depends(get_current_user)
):
    """تقرير مالي شامل موحد"""
    try:
        from server import db
        
        # بناء فلاتر البحث
        base_filter = {
            "issue_date": {
                "$gte": start_date.isoformat(),
                "$lte": end_date.isoformat()
            }
        }
        
        if clinic_ids:
            clinic_ids_list = [cid.strip() for cid in clinic_ids.split(",") if cid.strip()]
            base_filter["clinic_id"] = {"$in": clinic_ids_list}
        
        if sales_rep_ids:
            rep_ids_list = [rid.strip() for rid in sales_rep_ids.split(",") if rid.strip()]
            base_filter["sales_rep_id"] = {"$in": rep_ids_list}
        
        # فلترة حسب دور المستخدم
        if current_user.get("role") == "medical_rep":
            base_filter["sales_rep_id"] = current_user.get("id")
        
        # إحصائيات شاملة
        summary_pipeline = [
            {"$match": base_filter},
            {
                "$group": {
                    "_id": "$record_type",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$net_amount"}},
                    "total_outstanding": {"$sum": {"$toDouble": "$outstanding_amount"}}
                }
            }
        ]
        
        summary_results = await db.unified_financial_records.aggregate(summary_pipeline).to_list(100)
        
        # تنظيم النتائج
        report = {
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat()
            },
            "generated_at": datetime.utcnow().isoformat(),
            "summary_by_type": {},
            "totals": {
                "total_records": 0,
                "total_invoiced": 0.0,
                "total_collected": 0.0,
                "total_outstanding": 0.0
            },
            "performance_metrics": {}
        }
        
        total_invoiced = 0.0
        total_collected = 0.0
        total_outstanding = 0.0
        total_records = 0
        
        for result in summary_results:
            record_type = result["_id"]
            count = result["count"]
            amount = result["total_amount"]
            outstanding = result["total_outstanding"]
            
            report["summary_by_type"][record_type] = {
                "count": count,
                "total_amount": amount,
                "outstanding_amount": outstanding
            }
            
            if record_type in ["invoice", "debt"]:
                total_invoiced += amount
                total_outstanding += outstanding
            elif record_type in ["payment", "collection"]:
                total_collected += amount
            
            total_records += count
        
        # حساب المؤشرات
        collection_rate = 0.0
        if total_invoiced > 0:
            collection_rate = (total_collected / total_invoiced) * 100
        
        overdue_percentage = 0.0
        if total_invoiced > 0:
            # حساب المتأخرات
            overdue_filter = {**base_filter, "status": "overdue"}
            overdue_amount = 0.0
            
            overdue_cursor = db.unified_financial_records.find(overdue_filter)
            async for record in overdue_cursor:
                overdue_amount += float(record.get("outstanding_amount", 0))
            
            overdue_percentage = (overdue_amount / total_invoiced) * 100
        
        report["totals"] = {
            "total_records": total_records,
            "total_invoiced": total_invoiced,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding
        }
        
        report["performance_metrics"] = {
            "collection_rate": round(collection_rate, 2),
            "overdue_percentage": round(overdue_percentage, 2),
            "outstanding_ratio": round((total_outstanding / total_invoiced * 100) if total_invoiced > 0 else 0, 2)
        }
        
        return {
            "success": True,
            "report": report
        }
        
    except Exception as e:
        print(f"Error generating comprehensive financial report: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء التقرير المالي الشامل")

# ============================================================================
# LEGACY COMPATIBILITY - التوافق مع النظام القديم
# ============================================================================

@router.get("/dashboard/financial-overview")
async def get_financial_overview_legacy(current_user: User = Depends(get_current_user)):
    """نظرة عامة مالية للتوافق مع النظام القديم"""
    # إعادة توجيه إلى النظرة العامة الموحدة
    return await get_unified_financial_overview(current_user)

@router.get("/invoices")
async def get_invoices_legacy(
    status: Optional[str] = None,
    clinic_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """جلب الفواتير للتوافق مع النظام القديم"""
    # تحويل إلى استعلام موحد
    record_type = TransactionType.INVOICE
    status_enum = None
    if status:
        try:
            status_enum = UnifiedTransactionStatus(status)
        except ValueError:
            pass
    
    return await get_financial_records(
        record_type=record_type,
        status=status_enum,
        clinic_id=clinic_id,
        skip=skip,
        limit=limit,
        current_user=current_user
    )

@router.get("/debts")
async def get_debts_legacy(
    status: Optional[str] = None,
    clinic_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """جلب الديون للتوافق مع النظام القديم"""
    # تحويل إلى استعلام موحد
    record_type = TransactionType.DEBT
    status_enum = None
    if status:
        try:
            status_enum = UnifiedTransactionStatus(status)
        except ValueError:
            pass
    
    return await get_financial_records(
        record_type=record_type,
        status=status_enum,
        clinic_id=clinic_id,
        skip=skip,
        limit=limit,
        current_user=current_user
    )