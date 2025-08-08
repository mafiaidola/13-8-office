# نظام الإدارة الطبية المتكامل - موجه النظام المالي المتكامل
# Medical Management System - Integrated Financial Router

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import date, datetime
from decimal import Decimal
import traceback

from models.financial_models import (
    IntegratedInvoice, IntegratedDebtRecord, DebtPaymentRecord,
    CreateInvoiceRequest, ProcessPaymentRequest, FinancialReportRequest,
    InvoiceStatus, DebtStatus, PaymentStatus,
    FinancialSummary, AgingAnalysis
)
from services.financial_service import IntegratedFinancialService
from models.all_models import User, UserRole
from routes.auth_routes import get_current_user

# إنشاء الموجه
router = APIRouter(prefix="/api/financial", tags=["Integrated Financial System"])

# ============================================================================
# DEPENDENCY INJECTION - حقن التبعيات
# ============================================================================

async def get_financial_service() -> IntegratedFinancialService:
    """الحصول على خدمة النظام المالي"""
    from server import db  # تجنب circular import
    return IntegratedFinancialService(db)

def check_financial_permissions(required_roles: List[str]):
    """فحص صلاحيات النظام المالي"""
    def permission_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=403, 
                detail="غير مصرح لك بالوصول لهذه الوظيفة المالية"
            )
        return current_user
    return permission_checker

# ============================================================================
# INVOICE MANAGEMENT APIs - واجهات إدارة الفواتير
# ============================================================================

@router.post("/invoices", response_model=Dict[str, Any])
async def create_invoice(
    request: CreateInvoiceRequest,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """إنشاء فاتورة جديدة - Create new invoice"""
    try:
        invoice = await financial_service.create_invoice(
            clinic_id=request.clinic_id,
            sales_rep_id=request.sales_rep_id,
            line_items_data=request.line_items,
            due_date=request.due_date,
            created_by=current_user.id,
            order_id=request.order_id,
            payment_terms=request.payment_terms,
            notes=request.notes
        )
        
        return {
            "success": True,
            "message": "تم إنشاء الفاتورة بنجاح",
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "total_amount": float(invoice.total_amount.amount),
            "status": invoice.status
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating invoice: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الفاتورة")

@router.get("/invoices", response_model=List[Dict[str, Any]])
async def get_invoices(
    status: Optional[InvoiceStatus] = None,
    clinic_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """الحصول على قائمة الفواتير - Get invoices list"""
    try:
        # بناء فلتر البحث
        query_filter = {}
        
        if status:
            query_filter["status"] = status
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if sales_rep_id:
            query_filter["sales_rep_id"] = sales_rep_id
        elif current_user.role == "medical_rep":
            # المندوب يرى فقط فواتيره
            query_filter["sales_rep_id"] = current_user.id
        
        if start_date:
            query_filter.setdefault("issue_date", {})["$gte"] = start_date
        
        if end_date:
            query_filter.setdefault("issue_date", {})["$lte"] = end_date
        
        # جلب الفواتير
        invoices_cursor = financial_service.db.invoices.find(query_filter).skip(skip).limit(limit)
        invoices = []
        
        async for invoice_data in invoices_cursor:
            invoice = IntegratedInvoice(**invoice_data)
            invoices.append({
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "clinic_name": invoice.clinic_name,
                "sales_rep_name": invoice.sales_rep_name,
                "issue_date": invoice.issue_date.isoformat(),
                "due_date": invoice.due_date.isoformat(),
                "total_amount": float(invoice.total_amount.amount) if invoice.total_amount else 0,
                "paid_amount": float(invoice.paid_amount.amount) if invoice.paid_amount else 0,
                "outstanding_amount": float(invoice.outstanding_amount.amount) if invoice.outstanding_amount else 0,
                "status": invoice.status,
                "currency": invoice.currency
            })
        
        return invoices
        
    except Exception as e:
        print(f"Error fetching invoices: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الفواتير")

@router.get("/invoices/{invoice_id}", response_model=Dict[str, Any])
async def get_invoice_details(
    invoice_id: str,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """تفاصيل فاتورة محددة - Get invoice details"""
    try:
        invoice_data = await financial_service.db.invoices.find_one({"id": invoice_id})
        if not invoice_data:
            raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
        
        invoice = IntegratedInvoice(**invoice_data)
        
        # فحص الصلاحيات
        if current_user.role == "medical_rep" and invoice.sales_rep_id != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض هذه الفاتورة")
        
        return {
            "invoice": invoice.dict(),
            "financial_status": await financial_service.get_clinic_financial_status(invoice.clinic_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching invoice details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب تفاصيل الفاتورة")

@router.post("/invoices/{invoice_id}/confirm")
async def confirm_invoice(
    invoice_id: str,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """تأكيد الفاتورة - Confirm invoice"""
    try:
        invoice = await financial_service.confirm_invoice(invoice_id, current_user.id)
        
        return {
            "success": True,
            "message": "تم تأكيد الفاتورة بنجاح",
            "invoice_id": invoice.id,
            "status": invoice.status
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error confirming invoice: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في تأكيد الفاتورة")

@router.post("/invoices/{invoice_id}/convert-to-debt")
async def convert_invoice_to_debt(
    invoice_id: str,
    collection_start_date: Optional[date] = None,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """تحويل فاتورة إلى دين - Convert invoice to debt"""
    try:
        debt_record = await financial_service.convert_invoice_to_debt(
            invoice_id, 
            current_user.id, 
            collection_start_date
        )
        
        return {
            "success": True,
            "message": "تم تحويل الفاتورة إلى دين بنجاح",
            "debt_id": debt_record.id,
            "debt_number": debt_record.debt_number,
            "outstanding_amount": float(debt_record.outstanding_amount.amount)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error converting invoice to debt: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في تحويل الفاتورة إلى دين")

# ============================================================================
# DEBT MANAGEMENT APIs - واجهات إدارة الديون
# ============================================================================

@router.post("/debts", response_model=Dict[str, Any])
async def create_direct_debt(
    clinic_id: str,
    sales_rep_id: str,
    amount: float,
    description: str,
    due_date: date,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """إنشاء دين مباشر - Create direct debt"""
    try:
        debt_record = await financial_service.create_direct_debt(
            clinic_id=clinic_id,
            sales_rep_id=sales_rep_id,
            amount=Decimal(str(amount)),
            description=description,
            due_date=due_date,
            created_by=current_user.id
        )
        
        return {
            "success": True,
            "message": "تم إنشاء الدين بنجاح",
            "debt_id": debt_record.id,
            "debt_number": debt_record.debt_number,
            "outstanding_amount": float(debt_record.outstanding_amount.amount)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating direct debt: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الدين")

@router.get("/debts", response_model=List[Dict[str, Any]])
async def get_debts(
    status: Optional[DebtStatus] = None,
    clinic_id: Optional[str] = None,
    sales_rep_id: Optional[str] = None,
    overdue_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep", "collection_agent"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """الحصول على قائمة الديون - Get debts list"""
    try:
        # بناء فلتر البحث
        query_filter = {}
        
        if status:
            query_filter["status"] = status
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if sales_rep_id:
            query_filter["sales_rep_id"] = sales_rep_id
        elif current_user.role == "medical_rep":
            # المندوب يرى فقط ديونه
            query_filter["sales_rep_id"] = current_user.id
        
        if overdue_only:
            query_filter["due_date"] = {"$lt": datetime.utcnow()}
        
        # جلب الديون
        debts_cursor = financial_service.db.debts.find(query_filter).skip(skip).limit(limit)
        debts = []
        
        async for debt_data in debts_cursor:
            debt = IntegratedDebtRecord(**debt_data)
            aging = debt.calculate_aging()
            
            debts.append({
                "id": debt.id,
                "debt_number": debt.debt_number,
                "invoice_number": debt.invoice_number,
                "clinic_name": debt.clinic_name,
                "sales_rep_name": debt.sales_rep_name,
                "original_amount": float(debt.original_amount.amount),
                "paid_amount": float(debt.paid_amount.amount),
                "outstanding_amount": float(debt.outstanding_amount.amount),
                "due_date": debt.due_date.isoformat(),
                "status": debt.status,
                "priority": debt.priority,
                "days_overdue": aging["days_overdue"],
                "risk_level": aging["risk_level"],
                "payments_count": len(debt.payments)
            })
        
        return debts
        
    except Exception as e:
        print(f"Error fetching debts: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الديون")

@router.get("/debts/{debt_id}", response_model=Dict[str, Any])
async def get_debt_details(
    debt_id: str,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep", "collection_agent"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """تفاصيل دين محدد - Get debt details"""
    try:
        debt_data = await financial_service.db.debts.find_one({"id": debt_id})
        if not debt_data:
            raise HTTPException(status_code=404, detail="سجل الدين غير موجود")
        
        debt = IntegratedDebtRecord(**debt_data)
        
        # فحص الصلاحيات
        if current_user.role == "medical_rep" and debt.sales_rep_id != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض هذا الدين")
        
        aging = debt.calculate_aging()
        
        return {
            "debt": debt.dict(),
            "aging_analysis": aging,
            "clinic_financial_status": await financial_service.get_clinic_financial_status(debt.clinic_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching debt details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب تفاصيل الدين")

@router.post("/debts/{debt_id}/payments")
async def process_debt_payment(
    debt_id: str,
    request: ProcessPaymentRequest,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "collection_agent"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """معالجة دفعة دين - Process debt payment"""
    try:
        result = await financial_service.process_debt_payment(
            debt_id=debt_id,
            amount=request.amount,
            payment_method=request.payment_method,
            processed_by=current_user.id,
            payment_date=request.payment_date,
            reference_number=request.reference_number,
            notes=request.notes
        )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error processing debt payment: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في معالجة دفعة الدين")

# ============================================================================
# FINANCIAL REPORTS APIs - واجهات التقارير المالية
# ============================================================================

@router.get("/reports/aging-analysis", response_model=List[Dict[str, Any]])
async def get_aging_analysis(
    clinic_ids: Optional[str] = Query(None, description="معرفات العيادات مفصولة بفاصلة"),
    as_of_date: Optional[date] = None,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """تقرير تقادم الديون - Aging analysis report"""
    try:
        # معالجة معرفات العيادات
        clinic_ids_list = None
        if clinic_ids:
            clinic_ids_list = [cid.strip() for cid in clinic_ids.split(",") if cid.strip()]
        
        aging_analysis = await financial_service.generate_aging_analysis(
            clinic_ids=clinic_ids_list,
            as_of_date=as_of_date
        )
        
        return [analysis.dict() for analysis in aging_analysis]
        
    except Exception as e:
        print(f"Error generating aging analysis: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء تقرير تقادم الديون")

@router.get("/reports/financial-summary", response_model=Dict[str, Any])
async def get_financial_summary(
    start_date: date,
    end_date: date,
    clinic_ids: Optional[str] = Query(None, description="معرفات العيادات مفصولة بفاصلة"),
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """الملخص المالي الشامل - Comprehensive financial summary"""
    try:
        # معالجة معرفات العيادات
        clinic_ids_list = None
        if clinic_ids:
            clinic_ids_list = [cid.strip() for cid in clinic_ids.split(",") if cid.strip()]
        
        summary = await financial_service.generate_financial_summary(
            start_date=start_date,
            end_date=end_date,
            clinic_ids=clinic_ids_list
        )
        
        return summary.dict()
        
    except Exception as e:
        print(f"Error generating financial summary: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الملخص المالي")

@router.get("/clinic/{clinic_id}/financial-status")
async def get_clinic_financial_status(
    clinic_id: str,
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm", "medical_rep"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """الحالة المالية للعيادة - Clinic financial status"""
    try:
        status = await financial_service.get_clinic_financial_status(clinic_id)
        return status
        
    except Exception as e:
        print(f"Error fetching clinic financial status: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الحالة المالية للعيادة")

# ============================================================================
# SYSTEM INTEGRITY APIs - واجهات سلامة النظام
# ============================================================================

@router.get("/system/integrity-check")
async def validate_financial_integrity(
    current_user: User = Depends(check_financial_permissions(["admin"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """فحص سلامة البيانات المالية - Financial data integrity check"""
    try:
        integrity_report = await financial_service.validate_financial_integrity()
        return integrity_report
        
    except Exception as e:
        print(f"Error validating financial integrity: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في فحص سلامة البيانات المالية")

@router.get("/dashboard/financial-overview")
async def get_financial_dashboard_overview(
    current_user: User = Depends(check_financial_permissions(["admin", "accounting", "gm"])),
    financial_service: IntegratedFinancialService = Depends(get_financial_service)
):
    """نظرة عامة على لوحة التحكم المالية - Financial dashboard overview"""
    try:
        # جلب الإحصائيات الأساسية
        today = date.today()
        start_of_month = today.replace(day=1)
        
        # الملخص الشهري
        monthly_summary = await financial_service.generate_financial_summary(
            start_date=start_of_month,
            end_date=today
        )
        
        # تحليل التقادم
        aging_analysis = await financial_service.generate_aging_analysis()
        
        # إحصائيات سريعة
        total_outstanding = sum(
            analysis.total_outstanding.amount for analysis in aging_analysis
        )
        
        high_risk_clients = len([
            analysis for analysis in aging_analysis 
            if analysis.risk_level in ["high", "critical"]
        ])
        
        return {
            "monthly_summary": monthly_summary.dict(),
            "aging_overview": {
                "total_outstanding": float(total_outstanding),
                "high_risk_clients_count": high_risk_clients,
                "total_clients_with_debts": len(aging_analysis)
            },
            "top_risk_clients": [
                analysis.dict() for analysis in aging_analysis[:10]
            ]
        }
        
    except Exception as e:
        print(f"Error generating financial dashboard overview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب نظرة عامة على لوحة التحكم المالية")