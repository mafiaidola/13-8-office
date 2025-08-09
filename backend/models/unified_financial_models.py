# نظام الإدارة الطبية المتكامل - النماذج المالية الموحدة
# Medical Management System - Unified Financial Models

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union, Literal
from datetime import datetime, date
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP
import uuid

# ============================================================================
# UNIFIED FINANCIAL STATUS ENUMS - تعدادات الحالات المالية الموحدة
# ============================================================================

class UnifiedTransactionStatus(str, Enum):
    """حالات المعاملات المالية الموحدة"""
    DRAFT = "draft"                      # مسودة
    PENDING = "pending"                  # معلقة
    CONFIRMED = "confirmed"              # مؤكدة
    PARTIALLY_PAID = "partially_paid"    # مدفوعة جزئياً
    PAID = "paid"                        # مدفوعة بالكامل
    OVERDUE = "overdue"                  # متأخرة
    CANCELLED = "cancelled"              # ملغاة
    REFUNDED = "refunded"                # مردودة

class TransactionType(str, Enum):
    """أنواع المعاملات المالية"""
    INVOICE = "invoice"                  # فاتورة
    DEBT = "debt"                        # دين
    PAYMENT = "payment"                  # دفعة
    COLLECTION = "collection"            # تحصيل
    REFUND = "refund"                    # استرداد
    ADJUSTMENT = "adjustment"            # تعديل

class PaymentMethod(str, Enum):
    """طرق الدفع"""
    CASH = "cash"                        # نقداً
    CHECK = "check"                      # شيك
    BANK_TRANSFER = "bank_transfer"      # تحويل بنكي
    CREDIT_CARD = "credit_card"          # بطاقة ائتمان
    INSTALLMENT = "installment"          # أقساط

# ============================================================================
# UNIFIED FINANCIAL RECORD - السجل المالي الموحد
# ============================================================================

class UnifiedFinancialRecord(BaseModel):
    """السجل المالي الموحد - يجمع بين الفواتير والديون والتحصيل"""
    
    # معرفات أساسية
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    record_number: str  # رقم السجل (INV-xxx أو DBT-xxx أو PAY-xxx)
    record_type: TransactionType
    
    # ربط مع الكيانات الأخرى
    order_id: Optional[str] = None
    invoice_id: Optional[str] = None  # للديون المرتبطة بفواتير
    parent_record_id: Optional[str] = None  # للمدفوعات المرتبطة بديون
    
    # معلومات العميل/العيادة
    clinic_id: str
    clinic_name: str
    clinic_contact: Optional[str] = None
    clinic_address: Optional[str] = None
    
    # معلومات المندوب
    sales_rep_id: str
    sales_rep_name: str
    area_id: Optional[str] = None
    area_name: Optional[str] = None
    
    # المبالغ المالية
    original_amount: Decimal = Field(description="المبلغ الأصلي")
    discount_amount: Decimal = Field(default=Decimal("0.00"), description="مبلغ الخصم")
    tax_amount: Decimal = Field(default=Decimal("0.00"), description="مبلغ الضريبة")
    net_amount: Decimal = Field(description="المبلغ الصافي بعد الخصم والضريبة")
    paid_amount: Decimal = Field(default=Decimal("0.00"), description="المبلغ المدفوع")
    outstanding_amount: Decimal = Field(description="المبلغ المتبقي")
    
    # التواريخ
    issue_date: date = Field(default_factory=date.today)
    due_date: date
    payment_date: Optional[date] = None
    completion_date: Optional[date] = None
    
    # الحالة والتصنيف
    status: UnifiedTransactionStatus = UnifiedTransactionStatus.PENDING
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    payment_method: Optional[PaymentMethod] = None
    
    # تفاصيل إضافية
    description: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    reference_number: Optional[str] = None
    
    # معلومات إدارية
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_by: Optional[str] = None
    
    # مسار التدقيق
    audit_log: List[Dict[str, Any]] = []
    
    def calculate_outstanding(self) -> None:
        """حساب المبلغ المتبقي"""
        self.outstanding_amount = self.net_amount - self.paid_amount
        
        # تحديث الحالة بناء على المبلغ المتبقي
        if self.outstanding_amount <= Decimal("0.01"):
            self.status = UnifiedTransactionStatus.PAID
            self.completion_date = date.today()
        elif self.paid_amount > 0:
            self.status = UnifiedTransactionStatus.PARTIALLY_PAID
        elif self.due_date < date.today():
            self.status = UnifiedTransactionStatus.OVERDUE
    
    def add_payment(self, amount: Decimal, payment_method: PaymentMethod, 
                   reference: Optional[str] = None) -> None:
        """إضافة دفعة جديدة"""
        if amount > self.outstanding_amount:
            raise ValueError("مبلغ الدفعة أكبر من المبلغ المتبقي")
        
        self.paid_amount += amount
        self.payment_method = payment_method
        self.reference_number = reference
        if not self.payment_date:
            self.payment_date = date.today()
        
        # حساب المبلغ المتبقي وتحديث الحالة
        self.calculate_outstanding()
        
        # تسجيل في مسار التدقيق
        self.audit_log.append({
            "action": "payment_added",
            "amount": float(amount),
            "payment_method": payment_method,
            "timestamp": datetime.utcnow().isoformat(),
            "remaining_amount": float(self.outstanding_amount)
        })

# ============================================================================
# VISIT MANAGEMENT MODELS - نماذج إدارة الزيارات
# ============================================================================

class VisitStatus(str, Enum):
    """حالات الزيارات"""
    PLANNED = "planned"                  # مجدولة
    IN_PROGRESS = "in_progress"          # جارية
    COMPLETED = "completed"              # مكتملة
    CANCELLED = "cancelled"              # ملغاة
    RESCHEDULED = "rescheduled"          # مُعاد جدولتها

class VisitType(str, Enum):
    """أنواع الزيارات"""
    ROUTINE = "routine"                  # زيارة روتينية
    FOLLOW_UP = "follow_up"              # متابعة
    COLLECTION = "collection"            # تحصيل
    PRESENTATION = "presentation"        # عرض منتجات
    COMPLAINT_RESOLUTION = "complaint"   # حل شكوى
    EMERGENCY = "emergency"              # طارئة

class RepVisit(BaseModel):
    """زيارة مندوب طبي - Medical Rep Visit"""
    
    # معرفات أساسية
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visit_number: str  # رقم الزيارة التلقائي
    
    # معلومات الزيارة
    visit_type: VisitType = VisitType.ROUTINE
    status: VisitStatus = VisitStatus.PLANNED
    
    # المشاركون في الزيارة
    medical_rep_id: str
    medical_rep_name: str
    clinic_id: str
    clinic_name: str
    doctor_id: Optional[str] = None
    doctor_name: Optional[str] = None
    
    # تفاصيل الزيارة
    scheduled_date: datetime
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    
    # الموقع والتتبع
    clinic_address: Optional[str] = None
    gps_latitude: Optional[float] = None
    gps_longitude: Optional[float] = None
    check_in_location: Optional[Dict[str, Any]] = None
    check_out_location: Optional[Dict[str, Any]] = None
    
    # محتوى الزيارة
    visit_purpose: str
    products_presented: List[str] = []
    samples_provided: List[Dict[str, Any]] = []
    orders_taken: List[str] = []  # معرفات الطلبات المأخوذة
    
    # النتائج والملاحظات
    visit_outcome: Optional[str] = None
    doctor_feedback: Optional[str] = None
    next_visit_suggestions: Optional[str] = None
    follow_up_required: bool = False
    next_visit_date: Optional[date] = None
    
    # الوثائق والمرفقات
    photos: List[str] = []  # روابط الصور
    documents: List[str] = []  # روابط المستندات
    voice_notes: List[Dict[str, Any]] = []
    
    # التقييم
    visit_effectiveness: Optional[int] = Field(None, ge=1, le=5)  # من 1 إلى 5
    doctor_satisfaction: Optional[int] = Field(None, ge=1, le=5)  # من 1 إلى 5
    
    # معلومات إدارية
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    reviewed_by: Optional[str] = None
    review_status: Literal["pending", "approved", "rejected"] = "pending"
    review_notes: Optional[str] = None
    
    def start_visit(self) -> None:
        """بدء الزيارة"""
        self.actual_start_time = datetime.utcnow()
        self.status = VisitStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()
    
    def complete_visit(self) -> None:
        """إنهاء الزيارة"""
        if not self.actual_start_time:
            raise ValueError("لا يمكن إنهاء زيارة لم تبدأ بعد")
        
        self.actual_end_time = datetime.utcnow()
        self.status = VisitStatus.COMPLETED
        
        # حساب المدة
        if self.actual_start_time:
            duration = self.actual_end_time - self.actual_start_time
            self.duration_minutes = int(duration.total_seconds() / 60)
        
        self.updated_at = datetime.utcnow()
    
    def calculate_effectiveness_score(self) -> float:
        """حساب درجة فعالية الزيارة"""
        score = 0.0
        factors = 0
        
        # تقييم المدة
        if self.duration_minutes:
            if 30 <= self.duration_minutes <= 90:
                score += 2.0
            elif self.duration_minutes >= 15:
                score += 1.0
            factors += 1
        
        # تقييم الطبيب
        if self.doctor_satisfaction:
            score += self.doctor_satisfaction
            factors += 1
        
        # وجود عينات أو منتجات
        if self.samples_provided or self.products_presented:
            score += 1.0
            factors += 1
        
        # طلبات مأخوذة
        if self.orders_taken:
            score += 2.0
            factors += 1
        
        # تقييم المندوب
        if self.visit_effectiveness:
            score += self.visit_effectiveness
            factors += 1
        
        return score / factors if factors > 0 else 0.0

class VisitPlan(BaseModel):
    """خطة الزيارات - Visit Plan"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plan_name: str
    medical_rep_id: str
    medical_rep_name: str
    
    # فترة الخطة
    start_date: date
    end_date: date
    
    # العيادات المخططة
    planned_clinics: List[Dict[str, Any]] = []
    total_planned_visits: int = 0
    completed_visits: int = 0
    
    # الأهداف
    target_visits_per_week: int = 20
    target_orders_value: Optional[Decimal] = None
    target_new_clinics: int = 5
    
    # الحالة
    status: Literal["draft", "active", "completed", "cancelled"] = "draft"
    
    # معلومات إدارية
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None
    
    def calculate_completion_rate(self) -> float:
        """حساب معدل الإنجاز"""
        if self.total_planned_visits == 0:
            return 0.0
        return (self.completed_visits / self.total_planned_visits) * 100

# ============================================================================
# REQUEST/RESPONSE MODELS - نماذج الطلبات والاستجابات
# ============================================================================

class CreateFinancialRecordRequest(BaseModel):
    """طلب إنشاء سجل مالي"""
    record_type: TransactionType
    clinic_id: str
    original_amount: Decimal
    due_date: date
    description: Optional[str] = None
    order_id: Optional[str] = None

class ProcessPaymentRequest(BaseModel):
    """طلب معالجة دفعة"""
    financial_record_id: str
    amount: Decimal
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class CreateVisitRequest(BaseModel):
    """طلب إنشاء زيارة"""
    clinic_id: str
    visit_type: VisitType
    scheduled_date: datetime
    visit_purpose: str
    doctor_id: Optional[str] = None

class VisitCheckInRequest(BaseModel):
    """طلب تسجيل دخول للزيارة"""
    visit_id: str
    gps_latitude: float
    gps_longitude: float
    notes: Optional[str] = None

class VisitCompletionRequest(BaseModel):
    """طلب إنهاء الزيارة"""
    visit_id: str
    visit_outcome: str
    doctor_feedback: Optional[str] = None
    visit_effectiveness: int = Field(ge=1, le=5)
    doctor_satisfaction: int = Field(ge=1, le=5)
    products_presented: List[str] = []
    samples_provided: List[Dict[str, Any]] = []
    next_visit_suggestions: Optional[str] = None
    follow_up_required: bool = False

# ============================================================================
# FINANCIAL SUMMARY MODELS - نماذج الملخصات المالية
# ============================================================================

class UnifiedFinancialSummary(BaseModel):
    """ملخص مالي موحد"""
    period_start: date
    period_end: date
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # الإحصائيات الموحدة
    total_invoices: int = 0
    total_debts: int = 0
    total_payments: int = 0
    total_collections: int = 0
    
    # المبالغ
    total_invoiced_amount: Decimal = Decimal("0.00")
    total_collected_amount: Decimal = Decimal("0.00")
    total_outstanding_amount: Decimal = Decimal("0.00")
    
    # المؤشرات
    collection_rate: float = 0.0  # نسبة التحصيل
    average_payment_time: int = 0  # متوسط وقت السداد بالأيام
    overdue_percentage: float = 0.0  # نسبة المتأخرات
    
    # تحليل المخاطر
    high_risk_clients_count: int = 0
    total_overdue_amount: Decimal = Decimal("0.00")

class VisitSummary(BaseModel):
    """ملخص الزيارات"""
    period_start: date
    period_end: date
    medical_rep_id: str
    medical_rep_name: str
    
    # إحصائيات الزيارات
    total_planned_visits: int = 0
    completed_visits: int = 0
    cancelled_visits: int = 0
    average_visit_duration: int = 0  # بالدقائق
    
    # الفعالية
    average_effectiveness_score: float = 0.0
    successful_visits_rate: float = 0.0
    orders_generated: int = 0
    total_orders_value: Decimal = Decimal("0.00")
    
    # العيادات
    unique_clinics_visited: int = 0
    new_clinics_acquired: int = 0
    
    # الأهداف
    target_achievement_rate: float = 0.0