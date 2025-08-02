from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, date
from enum import Enum

# ===============================
# ENHANCED DEBT & COLLECTION MODELS - PHASE 2
# ===============================

class DebtStatus(str, Enum):
    """حالة الدين"""
    PENDING = "pending"           # معلق
    PARTIAL = "partial"           # جزئي
    PAID = "paid"                 # مدفوع
    OVERDUE = "overdue"           # متأخر
    WRITTEN_OFF = "written_off"   # معدوم
    DISPUTED = "disputed"         # متنازع عليه

class CollectionStatus(str, Enum):
    """حالة التحصيل"""
    PENDING = "pending"           # في الانتظار
    IN_PROGRESS = "in_progress"   # جاري
    SUCCESSFUL = "successful"     # ناجح
    FAILED = "failed"             # فاشل
    POSTPONED = "postponed"       # مؤجل

class PaymentMethod(str, Enum):
    """طريقة الدفع"""
    CASH = "cash"                 # نقداً
    BANK_TRANSFER = "bank_transfer"  # تحويل بنكي
    CHECK = "check"               # شيك
    CARD = "card"                 # بطاقة
    INSTALLMENT = "installment"   # قسط

class DebtRecord(BaseModel):
    """سجل الدين المحسن - Enhanced Debt Record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Basic Information
    debt_number: str = Field(..., description="رقم الدين الفريد")
    clinic_id: str = Field(..., description="معرف العيادة")
    clinic_name: str = Field(..., description="اسم العيادة")
    doctor_name: str = Field(..., description="اسم الطبيب")
    
    # Medical Rep Information
    medical_rep_id: str = Field(..., description="معرف المندوب الطبي")
    medical_rep_name: str = Field(..., description="اسم المندوب الطبي")
    direct_manager_id: Optional[str] = None
    direct_manager_name: Optional[str] = None
    
    # Location Information (Hidden from reps)
    area: Optional[str] = None
    region: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    address: Optional[str] = None
    
    # Financial Details
    original_amount: float = Field(..., description="المبلغ الأصلي")
    outstanding_amount: float = Field(..., description="المبلغ المستحق")
    paid_amount: float = Field(default=0.0, description="المبلغ المدفوع")
    interest_amount: float = Field(default=0.0, description="مبلغ الفوائد")
    penalty_amount: float = Field(default=0.0, description="مبلغ الغرامة")
    
    # Status and Dates
    status: DebtStatus = Field(default=DebtStatus.PENDING)
    priority: str = Field(default="medium")  # low, medium, high, urgent
    
    # Important Dates
    debt_date: date = Field(..., description="تاريخ نشوء الدين")
    due_date: date = Field(..., description="تاريخ الاستحقاق")
    last_contact_date: Optional[date] = None
    expected_payment_date: Optional[date] = None
    payment_completion_date: Optional[date] = None
    
    # Related Records
    invoice_id: Optional[str] = None
    order_ids: List[str] = Field(default_factory=list)
    contract_id: Optional[str] = None
    
    # Communication & Notes
    notes: Optional[str] = None
    collection_notes: List[Dict[str, Any]] = Field(default_factory=list)
    payment_plan: Optional[Dict[str, Any]] = None
    
    # Audit Trail
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str
    
    # Collection Assignment
    assigned_collector_id: Optional[str] = None
    assigned_collector_name: Optional[str] = None
    collection_attempts: int = Field(default=0)
    
    # PDF and Print Settings
    is_printable: bool = Field(default=True)
    pdf_generated: bool = Field(default=False)
    pdf_path: Optional[str] = None

class CollectionRecord(BaseModel):
    """سجل التحصيل - Collection Record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Reference to Debt
    debt_id: str = Field(..., description="معرف الدين")
    debt_number: str = Field(..., description="رقم الدين")
    
    # Collection Details
    collection_amount: float = Field(..., description="مبلغ التحصيل")
    collection_method: PaymentMethod = Field(..., description="طريقة التحصيل")
    collection_status: CollectionStatus = Field(default=CollectionStatus.PENDING)
    
    # Collection Information
    collector_id: str = Field(..., description="معرف المحصل")
    collector_name: str = Field(..., description="اسم المحصل")
    collection_date: date = Field(..., description="تاريخ التحصيل")
    actual_collection_date: Optional[date] = None
    
    # Payment Details
    reference_number: Optional[str] = None
    bank_name: Optional[str] = None
    check_number: Optional[str] = None
    transaction_id: Optional[str] = None
    
    # Location & Time (Hidden from reps)
    collection_location: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    collection_time: Optional[datetime] = None
    
    # Notes and Documentation
    collection_notes: Optional[str] = None
    receipt_number: Optional[str] = None
    receipt_issued: bool = Field(default=False)
    
    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None

class PaymentPlan(BaseModel):
    """خطة الدفع - Payment Plan"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    debt_id: str = Field(..., description="معرف الدين")
    
    # Plan Details
    plan_name: str = Field(..., description="اسم الخطة")
    total_amount: float = Field(..., description="المبلغ الإجمالي")
    installments_count: int = Field(..., description="عدد الأقساط")
    installment_amount: float = Field(..., description="مبلغ القسط")
    
    # Schedule
    start_date: date = Field(..., description="تاريخ البداية")
    end_date: date = Field(..., description="تاريخ النهاية")
    installments: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Status
    is_active: bool = Field(default=True)
    paid_installments: int = Field(default=0)
    remaining_amount: float
    
    # Approval
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    
    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class DebtSummary(BaseModel):
    """ملخص الديون - Debt Summary"""
    total_debts: int
    total_amount: float
    paid_amount: float
    outstanding_amount: float
    overdue_amount: float
    
    # Status Breakdown
    pending_count: int
    partial_count: int
    paid_count: int
    overdue_count: int
    
    # By Priority
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int

class CollectionSummary(BaseModel):
    """ملخص التحصيل - Collection Summary"""
    total_collections: int
    total_collected_amount: float
    successful_collections: int
    failed_collections: int
    pending_collections: int
    
    # By Method
    cash_collections: float
    bank_collections: float
    check_collections: float
    card_collections: float

# ===============================
# ORIGINAL FINANCIAL MODELS (Enhanced)
# ===============================

class Invoice(BaseModel):
    """الفاتورة - Invoice"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    clinic_id: str
    clinic_name: str
    order_id: Optional[str] = None
    
    # Amount details
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    
    # Payment status - كل فاتورة تبدأ كمديونية
    payment_status: str = "pending"  # pending, paid, partially_paid, overdue
    paid_amount: float = 0.0
    outstanding_amount: float
    
    # Important dates
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    payment_date: Optional[datetime] = None
    
    # Payment info
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_notes: Optional[str] = None
    paid_by_user_id: Optional[str] = None
    
    # Creation info
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Items
    items: List[Dict] = []
    
    # Link to Debt System
    debt_id: Optional[str] = None

    def __init__(self, **data):
        super().__init__(**data)
        if not hasattr(self, 'outstanding_amount') or self.outstanding_amount is None:
            self.outstanding_amount = self.total_amount - self.paid_amount

class PaymentRecord(BaseModel):
    """سجل دفعة - Payment Record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_id: str
    amount: float
    payment_method: str  # cash, bank_transfer, check, card
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    processed_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Enhanced fields
    debt_id: Optional[str] = None
    collection_id: Optional[str] = None

class InvoiceItem(BaseModel):
    """عنصر الفاتورة - Invoice Item"""
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    price_tier: str
    discount_percentage: float = 0.0
    cashback_amount: float = 0.0
    total: float

class ClinicDebt(BaseModel):
    """مديونية العيادة - Clinic Debt (Legacy)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_id: str
    invoice_id: str
    amount: float
    due_date: datetime
    status: str = "pending"
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

# ===============================
# CREATE & UPDATE MODELS
# ===============================

class DebtRecordCreate(BaseModel):
    """إنشاء سجل دين جديد"""
    clinic_id: str
    clinic_name: str
    doctor_name: str
    medical_rep_id: str
    medical_rep_name: str
    original_amount: float
    debt_date: date
    due_date: date
    priority: str = "medium"
    notes: Optional[str] = None
    invoice_id: Optional[str] = None
    order_ids: List[str] = Field(default_factory=list)

class CollectionRecordCreate(BaseModel):
    """إنشاء سجل تحصيل جديد"""
    debt_id: str
    collection_amount: float
    collection_method: PaymentMethod
    collection_date: date
    reference_number: Optional[str] = None
    collection_notes: Optional[str] = None
    bank_name: Optional[str] = None
    check_number: Optional[str] = None

class PaymentPlanCreate(BaseModel):
    """إنشاء خطة دفع جديدة"""
    debt_id: str
    plan_name: str
    installments_count: int
    start_date: date
    installment_amount: Optional[float] = None