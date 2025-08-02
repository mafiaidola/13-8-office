from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
import os
import json
import uuid

# Import models
from models.financial_models import (
    DebtRecord, DebtRecordCreate, CollectionRecord, CollectionRecordCreate,
    PaymentPlan, PaymentPlanCreate, DebtSummary, CollectionSummary,
    DebtStatus, CollectionStatus, PaymentMethod
)
from routes.auth_routes import get_current_user

router = APIRouter(prefix="/api/debts", tags=["Debt Management"])

# MongoDB-like file storage (can be replaced with actual MongoDB)
DEBT_DATA_FILE = "/app/debt_data.json"
COLLECTION_DATA_FILE = "/app/collection_data.json"
PAYMENT_PLAN_DATA_FILE = "/app/payment_plan_data.json"

def load_debt_data():
    """تحميل بيانات الديون"""
    if os.path.exists(DEBT_DATA_FILE):
        try:
            with open(DEBT_DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [DebtRecord(**debt) for debt in data]
        except:
            return []
    return []

def save_debt_data(debts: List[DebtRecord]):
    """حفظ بيانات الديون"""
    try:
        data = [debt.dict() for debt in debts]
        # Convert datetime objects to strings for JSON serialization
        for debt in data:
            for key, value in debt.items():
                if isinstance(value, datetime):
                    debt[key] = value.isoformat()
                elif isinstance(value, date):
                    debt[key] = value.isoformat()
        
        with open(DEBT_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving debt data: {e}")
        return False

def load_collection_data():
    """تحميل بيانات التحصيل"""
    if os.path.exists(COLLECTION_DATA_FILE):
        try:
            with open(COLLECTION_DATA_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return [CollectionRecord(**collection) for collection in data]
        except:
            return []
    return []

def save_collection_data(collections: List[CollectionRecord]):
    """حفظ بيانات التحصيل"""
    try:
        data = [collection.dict() for collection in collections]
        # Convert datetime objects to strings
        for collection in data:
            for key, value in collection.items():
                if isinstance(value, datetime):
                    collection[key] = value.isoformat()
                elif isinstance(value, date):
                    collection[key] = value.isoformat()
        
        with open(COLLECTION_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"Error saving collection data: {e}")
        return False

# ===============================
# DEBT MANAGEMENT ENDPOINTS
# ===============================

@router.get("/", response_model=List[DebtRecord])
async def get_debts(
    current_user: dict = Depends(get_current_user),
    status: Optional[str] = Query(None, description="فلترة حسب الحالة"),
    clinic_id: Optional[str] = Query(None, description="فلترة حسب العيادة"),
    medical_rep_id: Optional[str] = Query(None, description="فلترة حسب المندوب"),
    priority: Optional[str] = Query(None, description="فلترة حسب الأولوية"),
    limit: int = Query(50, description="عدد النتائج")
):
    """
    الحصول على قائمة الديون مع فلترة حسب الدور
    Get debts list with role-based filtering
    """
    try:
        debts = load_debt_data()
        
        # Role-based filtering
        if current_user.get("role") == "medical_rep":
            # Medical reps see only their own debts
            debts = [debt for debt in debts if debt.medical_rep_id == current_user.get("id")]
            
            # Hide location data for reps
            for debt in debts:
                debt.gps_latitude = None
                debt.gps_longitude = None
                debt.address = None
                debt.area = None
                debt.region = None
        
        elif current_user.get("role") == "manager":
            # Managers see debts of their team
            # TODO: Implement team hierarchy logic
            pass
        
        # Apply filters
        if status:
            debts = [debt for debt in debts if debt.status == status]
        
        if clinic_id:
            debts = [debt for debt in debts if debt.clinic_id == clinic_id]
            
        if medical_rep_id and current_user.get("role") in ["admin", "manager"]:
            debts = [debt for debt in debts if debt.medical_rep_id == medical_rep_id]
            
        if priority:
            debts = [debt for debt in debts if debt.priority == priority]
        
        # Sort by creation date (newest first) and limit
        debts = sorted(debts, key=lambda x: x.created_at, reverse=True)[:limit]
        
        return debts
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching debts: {str(e)}")

@router.post("/", response_model=DebtRecord)
async def create_debt(
    debt_data: DebtRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    إنشاء سجل دين جديد
    Create new debt record
    """
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "manager", "accountant"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بإنشاء ديون جديدة")
        
        # Generate debt number
        debt_number = f"DEBT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create new debt record
        new_debt = DebtRecord(
            debt_number=debt_number,
            clinic_id=debt_data.clinic_id,
            clinic_name=debt_data.clinic_name,
            doctor_name=debt_data.doctor_name,
            medical_rep_id=debt_data.medical_rep_id,
            medical_rep_name=debt_data.medical_rep_name,
            original_amount=debt_data.original_amount,
            outstanding_amount=debt_data.original_amount,  # Initially same as original
            debt_date=debt_data.debt_date,
            due_date=debt_data.due_date,
            priority=debt_data.priority,
            notes=debt_data.notes,
            invoice_id=debt_data.invoice_id,
            order_ids=debt_data.order_ids,
            created_by=current_user.get("id", ""),
            updated_by=current_user.get("id", "")
        )
        
        # Load existing debts and add new one
        debts = load_debt_data()
        debts.append(new_debt)
        
        # Save to file
        if save_debt_data(debts):
            return new_debt
        else:
            raise HTTPException(status_code=500, detail="Error saving debt record")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating debt: {str(e)}")

@router.get("/{debt_id}", response_model=DebtRecord)
async def get_debt_by_id(
    debt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    الحصول على دين محدد بالمعرف
    Get specific debt by ID
    """
    try:
        debts = load_debt_data()
        debt = next((d for d in debts if d.id == debt_id), None)
        
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        # Role-based access control
        if current_user.get("role") == "medical_rep":
            if debt.medical_rep_id != current_user.get("id"):
                raise HTTPException(status_code=403, detail="غير مسموح لك بالوصول لهذا الدين")
            
            # Hide location data for reps
            debt.gps_latitude = None
            debt.gps_longitude = None
            debt.address = None
            debt.area = None
            debt.region = None
        
        return debt
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching debt: {str(e)}")

@router.put("/{debt_id}", response_model=DebtRecord)
async def update_debt(
    debt_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    تحديث سجل الدين
    Update debt record
    """
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "manager", "accountant"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بتحديث الديون")
        
        debts = load_debt_data()
        debt_index = next((i for i, d in enumerate(debts) if d.id == debt_id), None)
        
        if debt_index is None:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        # Update debt record
        debt = debts[debt_index]
        for key, value in updates.items():
            if hasattr(debt, key) and key not in ['id', 'created_at', 'created_by']:
                setattr(debt, key, value)
        
        debt.updated_at = datetime.utcnow()
        debt.updated_by = current_user.get("id", "")
        
        # Save changes
        if save_debt_data(debts):
            return debt
        else:
            raise HTTPException(status_code=500, detail="Error updating debt record")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating debt: {str(e)}")

@router.get("/summary/statistics")
async def get_debt_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    الحصول على ملخص إحصائيات الديون
    Get debt summary statistics
    """
    try:
        debts = load_debt_data()
        
        # Role-based filtering
        if current_user.get("role") == "medical_rep":
            debts = [debt for debt in debts if debt.medical_rep_id == current_user.get("id")]
        
        # Calculate summary
        total_debts = len(debts)
        total_amount = sum(debt.original_amount for debt in debts)
        paid_amount = sum(debt.paid_amount for debt in debts)
        outstanding_amount = sum(debt.outstanding_amount for debt in debts)
        overdue_amount = sum(debt.outstanding_amount for debt in debts 
                           if debt.status == DebtStatus.OVERDUE)
        
        # Status breakdown
        pending_count = len([d for d in debts if d.status == DebtStatus.PENDING])
        partial_count = len([d for d in debts if d.status == DebtStatus.PARTIAL])
        paid_count = len([d for d in debts if d.status == DebtStatus.PAID])
        overdue_count = len([d for d in debts if d.status == DebtStatus.OVERDUE])
        
        # Priority breakdown
        high_priority_count = len([d for d in debts if d.priority == "high"])
        medium_priority_count = len([d for d in debts if d.priority == "medium"])
        low_priority_count = len([d for d in debts if d.priority == "low"])
        
        summary = DebtSummary(
            total_debts=total_debts,
            total_amount=total_amount,
            paid_amount=paid_amount,
            outstanding_amount=outstanding_amount,
            overdue_amount=overdue_amount,
            pending_count=pending_count,
            partial_count=partial_count,
            paid_count=paid_count,
            overdue_count=overdue_count,
            high_priority_count=high_priority_count,
            medium_priority_count=medium_priority_count,
            low_priority_count=low_priority_count
        )
        
        return summary
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

# ===============================
# COLLECTION MANAGEMENT ENDPOINTS
# ===============================

@router.get("/collections/", response_model=List[CollectionRecord])
async def get_collections(
    current_user: dict = Depends(get_current_user),
    debt_id: Optional[str] = Query(None, description="فلترة حسب الدين"),
    status: Optional[str] = Query(None, description="فلترة حسب الحالة"),
    limit: int = Query(50, description="عدد النتائج")
):
    """
    الحصول على قائمة التحصيلات
    Get collections list
    """
    try:
        collections = load_collection_data()
        debts = load_debt_data()
        
        # Role-based filtering
        if current_user.get("role") == "medical_rep":
            # Get user's debts first
            user_debts = [debt.id for debt in debts if debt.medical_rep_id == current_user.get("id")]
            collections = [c for c in collections if c.debt_id in user_debts]
            
            # Hide location data for reps
            for collection in collections:
                collection.collection_location = None
                collection.gps_latitude = None
                collection.gps_longitude = None
                collection.collection_time = None
        
        # Apply filters
        if debt_id:
            collections = [c for c in collections if c.debt_id == debt_id]
        
        if status:
            collections = [c for c in collections if c.collection_status == status]
        
        # Sort and limit
        collections = sorted(collections, key=lambda x: x.created_at, reverse=True)[:limit]
        
        return collections
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collections: {str(e)}")

@router.post("/collections/", response_model=CollectionRecord)
async def create_collection(
    collection_data: CollectionRecordCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    إنشاء سجل تحصيل جديد
    Create new collection record
    """
    try:
        # Find the debt record
        debts = load_debt_data()
        debt = next((d for d in debts if d.id == collection_data.debt_id), None)
        
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        # Check permissions
        if current_user.get("role") == "medical_rep":
            if debt.medical_rep_id != current_user.get("id"):
                raise HTTPException(status_code=403, detail="غير مسموح لك بتسجيل تحصيل لهذا الدين")
        
        # Create collection record
        new_collection = CollectionRecord(
            debt_id=collection_data.debt_id,
            debt_number=debt.debt_number,
            collection_amount=collection_data.collection_amount,
            collection_method=collection_data.collection_method,
            collector_id=current_user.get("id", ""),
            collector_name=current_user.get("full_name", ""),
            collection_date=collection_data.collection_date,
            reference_number=collection_data.reference_number,
            collection_notes=collection_data.collection_notes,
            bank_name=collection_data.bank_name,
            check_number=collection_data.check_number,
            created_by=current_user.get("id", "")
        )
        
        # Load existing collections and add new one
        collections = load_collection_data()
        collections.append(new_collection)
        
        # Update debt record
        debt.paid_amount += collection_data.collection_amount
        debt.outstanding_amount = debt.original_amount - debt.paid_amount
        
        # Update debt status
        if debt.outstanding_amount <= 0:
            debt.status = DebtStatus.PAID
            debt.payment_completion_date = collection_data.collection_date
        elif debt.paid_amount > 0:
            debt.status = DebtStatus.PARTIAL
        
        debt.updated_at = datetime.utcnow()
        debt.updated_by = current_user.get("id", "")
        
        # Save both collections and updated debts
        if save_collection_data(collections) and save_debt_data(debts):
            return new_collection
        else:
            raise HTTPException(status_code=500, detail="Error saving collection record")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating collection: {str(e)}")

@router.get("/collections/summary/statistics")
async def get_collection_summary(
    current_user: dict = Depends(get_current_user)
):
    """
    الحصول على ملخص إحصائيات التحصيل
    Get collection summary statistics
    """
    try:
        collections = load_collection_data()
        debts = load_debt_data()
        
        # Role-based filtering
        if current_user.get("role") == "medical_rep":
            user_debts = [debt.id for debt in debts if debt.medical_rep_id == current_user.get("id")]
            collections = [c for c in collections if c.debt_id in user_debts]
        
        # Calculate summary
        total_collections = len(collections)
        total_collected_amount = sum(c.collection_amount for c in collections)
        successful_collections = len([c for c in collections if c.collection_status == CollectionStatus.SUCCESSFUL])
        failed_collections = len([c for c in collections if c.collection_status == CollectionStatus.FAILED])
        pending_collections = len([c for c in collections if c.collection_status == CollectionStatus.PENDING])
        
        # By method
        cash_collections = sum(c.collection_amount for c in collections if c.collection_method == PaymentMethod.CASH)
        bank_collections = sum(c.collection_amount for c in collections if c.collection_method == PaymentMethod.BANK_TRANSFER)
        check_collections = sum(c.collection_amount for c in collections if c.collection_method == PaymentMethod.CHECK)
        card_collections = sum(c.collection_amount for c in collections if c.collection_method == PaymentMethod.CARD)
        
        summary = CollectionSummary(
            total_collections=total_collections,
            total_collected_amount=total_collected_amount,
            successful_collections=successful_collections,
            failed_collections=failed_collections,
            pending_collections=pending_collections,
            cash_collections=cash_collections,
            bank_collections=bank_collections,
            check_collections=check_collections,
            card_collections=card_collections
        )
        
        return summary
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating collection summary: {str(e)}")

# ===============================
# PDF & EXPORT ENDPOINTS
# ===============================

@router.get("/{debt_id}/export/pdf")
async def export_debt_pdf(
    debt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    تصدير الدين كملف PDF
    Export debt as PDF
    """
    try:
        debts = load_debt_data()
        debt = next((d for d in debts if d.id == debt_id), None)
        
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        # Role-based access control
        if current_user.get("role") == "medical_rep":
            if debt.medical_rep_id != current_user.get("id"):
                raise HTTPException(status_code=403, detail="غير مسموح لك بالوصول لهذا الدين")
        
        # TODO: Implement actual PDF generation
        # For now, return structured data that can be used for PDF generation
        pdf_data = {
            "debt_record": debt.dict(),
            "generated_by": current_user.get("full_name", ""),
            "generated_at": datetime.utcnow().isoformat(),
            "company_info": {
                "name": "EP Group",
                "address": "العنوان الرئيسي للشركة",
                "phone": "+20-XXX-XXXXXXX",
                "email": "info@epgroup.com"
            }
        }
        
        return {
            "message": "PDF data prepared successfully",
            "pdf_data": pdf_data,
            "download_url": f"/api/debts/{debt_id}/download/pdf"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting PDF: {str(e)}")

@router.get("/{debt_id}/print")
async def print_debt(
    debt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    طباعة الدين
    Print debt
    """
    try:
        debts = load_debt_data()
        debt = next((d for d in debts if d.id == debt_id), None)
        
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        # Role-based access control
        if current_user.get("role") == "medical_rep":
            if debt.medical_rep_id != current_user.get("id"):
                raise HTTPException(status_code=403, detail="غير مسموح لك بطباعة هذا الدين")
        
        # Prepare print data (without sensitive location info for reps)
        print_data = debt.dict()
        
        if current_user.get("role") == "medical_rep":
            # Remove sensitive data for medical reps
            print_data.pop('gps_latitude', None)
            print_data.pop('gps_longitude', None)
            print_data.pop('address', None)
            print_data.pop('area', None)
            print_data.pop('region', None)
        
        return {
            "message": "Print data prepared successfully",
            "print_data": print_data,
            "printable": debt.is_printable
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error preparing print data: {str(e)}")