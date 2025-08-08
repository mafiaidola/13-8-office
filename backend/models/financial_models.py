# نظام الإدارة الطبية المتكامل - النماذج المالية المتكاملة
# Medical Management System - Integrated Financial Models

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Any, Union, Literal
from datetime import datetime, date
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP
import uuid

# ============================================================================
# BASE FINANCIAL CONFIGURATION - الإعدادات المالية الأساسية
# ============================================================================

class FinancialConfig:
    """الإعدادات المالية الثابتة - Fixed Financial Configuration"""
    
    # نظام الترقيم التلقائي
    AUTO_NUMBERING = {
        "invoices": {"prefix": "INV", "digits": 6},  # INV-000001
        "debts": {"prefix": "DBT", "digits": 6},     # DBT-000001
        "payments": {"prefix": "PAY", "digits": 6},  # PAY-000001
        "receipts": {"prefix": "REC", "digits": 6},  # REC-000001
        "credit_notes": {"prefix": "CN", "digits": 6}, # CN-000001
        "debit_notes": {"prefix": "DN", "digits": 6}   # DN-000001
    }
    
    # نظام الضرائب
    TAX_RATES = {
        "vat": 0.14,  # 14% VAT
        "discount_tax": 0.00,  # معفي من الضرائب عند التخفيض
        "compound_tax": True  # احتساب الضرائب مركبة
    }
    
    # حدود المديونية
    DEBT_LIMITS = {
        "warning_threshold": 1000.0,   # تحذير عند 1000 جنيه
        "block_threshold": 5000.0,     # حظر عند 5000 جنيه
        "overdue_days": 30,            # المدة المسموحة للسداد
        "collection_days": 60          # بدء إجراءات التحصيل بعد 60 يوم
    }
    
    # العملات المدعومة
    CURRENCIES = {
        "EGP": {"name": "جنيه مصري", "symbol": "ج.م", "precision": 2},
        "USD": {"name": "دولار أمريكي", "symbol": "$", "precision": 2},
        "EUR": {"name": "يورو", "symbol": "€", "precision": 2}
    }
    
    # طرق الدفع
    PAYMENT_METHODS = {
        "cash": "نقداً",
        "check": "شيك",
        "bank_transfer": "تحويل بنكي", 
        "credit_card": "بطاقة ائتمان",
        "installment": "أقساط",
        "contra": "مقاصة"
    }

# ============================================================================
# FINANCIAL STATUS ENUMS - تعدادات الحالات المالية
# ============================================================================

class InvoiceStatus(str, Enum):
    """حالات الفواتير"""
    DRAFT = "draft"                    # مسودة
    PENDING = "pending"                # معلقة
    CONFIRMED = "confirmed"            # مؤكدة
    PARTIALLY_PAID = "partially_paid"  # مدفوعة جزئياً
    PAID = "paid"                      # مدفوعة
    OVERDUE = "overdue"                # متأخرة
    CANCELLED = "cancelled"            # ملغاة
    CONVERTED_TO_DEBT = "converted_to_debt"  # محولة إلى دين

class DebtStatus(str, Enum):
    """حالات الديون"""
    OUTSTANDING = "outstanding"        # مستحقة
    PARTIALLY_COLLECTED = "partially_collected"  # محصلة جزئياً
    COLLECTED = "collected"           # محصلة
    OVERDUE = "overdue"               # متأخرة
    UNDER_COLLECTION = "under_collection"  # تحت التحصيل
    WRITTEN_OFF = "written_off"       # مشطوبة
    DISPUTED = "disputed"             # متنازع عليها

class PaymentStatus(str, Enum):
    """حالات المدفوعات"""
    PENDING = "pending"               # معلقة
    PROCESSING = "processing"         # قيد المعالجة
    COMPLETED = "completed"           # مكتملة
    FAILED = "failed"                 # فاشلة
    CANCELLED = "cancelled"           # ملغاة
    REFUNDED = "refunded"             # مردودة

class TransactionType(str, Enum):
    """أنواع المعاملات المالية"""
    INVOICE_CREATE = "invoice_create"
    INVOICE_PAYMENT = "invoice_payment"
    DEBT_CREATE = "debt_create"
    DEBT_PAYMENT = "debt_payment"
    DISCOUNT_APPLY = "discount_apply"
    TAX_CALCULATE = "tax_calculate"
    REFUND_PROCESS = "refund_process"
    ADJUSTMENT = "adjustment"

# ============================================================================
# UTILITY CLASSES - فئات المساعدة
# ============================================================================

class MoneyAmount(BaseModel):
    """مبلغ مالي بدقة عالية - Precision Money Amount"""
    amount: Decimal = Field(..., description="المبلغ")
    currency: str = Field(default="EGP", description="العملة")
    
    class Config:
        json_encoders = {
            Decimal: lambda v: float(v)
        }
    
    def round(self, precision: int = 2) -> Decimal:
        """تقريب المبلغ"""
        return self.amount.quantize(Decimal(10) ** -precision, rounding=ROUND_HALF_UP)
    
    def add(self, other: 'MoneyAmount') -> 'MoneyAmount':
        """جمع مبلغين"""
        if self.currency != other.currency:
            raise ValueError(f"Cannot add different currencies: {self.currency} vs {other.currency}")
        return MoneyAmount(amount=self.amount + other.amount, currency=self.currency)
    
    def subtract(self, other: 'MoneyAmount') -> 'MoneyAmount':
        """طرح مبلغين"""
        if self.currency != other.currency:
            raise ValueError(f"Cannot subtract different currencies: {self.currency} vs {other.currency}")
        return MoneyAmount(amount=self.amount - other.amount, currency=self.currency)
    
    def multiply(self, factor: Union[Decimal, float, int]) -> 'MoneyAmount':
        """ضرب المبلغ في رقم"""
        return MoneyAmount(amount=self.amount * Decimal(str(factor)), currency=self.currency)
    
    def __str__(self) -> str:
        symbol = FinancialConfig.CURRENCIES.get(self.currency, {}).get("symbol", self.currency)
        return f"{self.round()} {symbol}"

class TaxCalculation(BaseModel):
    """حساب الضرائب - Tax Calculation"""
    base_amount: MoneyAmount
    tax_rate: Decimal
    tax_amount: MoneyAmount
    total_amount: MoneyAmount
    
    @classmethod
    def calculate(cls, base_amount: MoneyAmount, tax_rate: float = None) -> 'TaxCalculation':
        """حساب الضرائب"""
        if tax_rate is None:
            tax_rate = FinancialConfig.TAX_RATES["vat"]
        
        tax_rate_decimal = Decimal(str(tax_rate))
        tax_amount = base_amount.multiply(tax_rate_decimal)
        total_amount = base_amount.add(tax_amount)
        
        return cls(
            base_amount=base_amount,
            tax_rate=tax_rate_decimal,
            tax_amount=tax_amount,
            total_amount=total_amount
        )

class AuditTrail(BaseModel):
    """مسار التدقيق - Audit Trail"""
    action: str
    user_id: str
    user_name: str
    timestamp: datetime
    before_values: Dict[str, Any] = {}
    after_values: Dict[str, Any] = {}
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    notes: Optional[str] = None

# ============================================================================
# CORE FINANCIAL ENTITIES - الكيانات المالية الأساسية
# ============================================================================

class InvoiceLineItem(BaseModel):
    """عنصر سطر الفاتورة - Invoice Line Item"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    product_code: Optional[str] = None
    quantity: Decimal
    unit_price: MoneyAmount
    discount_percentage: Decimal = Field(default=Decimal("0.00"), ge=0, le=100)
    discount_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    
    # Calculated fields
    line_subtotal: Optional[MoneyAmount] = None
    line_tax_amount: Optional[MoneyAmount] = None  
    line_total: Optional[MoneyAmount] = None
    
    def calculate_totals(self) -> Dict[str, MoneyAmount]:
        """حساب إجماليات السطر"""
        # حساب المجموع الفرعي
        subtotal = self.unit_price.multiply(self.quantity)
        
        # حساب الخصم
        if self.discount_percentage > 0:
            discount = subtotal.multiply(self.discount_percentage / 100)
        else:
            discount = self.discount_amount
        
        # المبلغ بعد الخصم
        after_discount = subtotal.subtract(discount)
        
        # حساب الضريبة
        tax_calc = TaxCalculation.calculate(after_discount)
        
        self.line_subtotal = subtotal
        self.line_tax_amount = tax_calc.tax_amount
        self.line_total = tax_calc.total_amount
        
        return {
            "subtotal": subtotal,
            "discount": discount,
            "after_discount": after_discount,
            "tax": tax_calc.tax_amount,
            "total": tax_calc.total_amount
        }

class IntegratedInvoice(BaseModel):
    """فاتورة متكاملة - Integrated Invoice"""
    # معرفات أساسية
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str  # يتم إنشاؤه تلقائياً
    invoice_type: Literal["sale", "purchase", "service", "return"] = "sale"
    
    # معلومات العميل/العيادة
    clinic_id: str
    clinic_name: str
    clinic_address: Optional[str] = None
    clinic_tax_number: Optional[str] = None
    
    # معلومات المندوب
    sales_rep_id: str
    sales_rep_name: str
    area_id: Optional[str] = None
    area_name: Optional[str] = None
    
    # التواريخ
    issue_date: date = Field(default_factory=date.today)
    due_date: date
    delivery_date: Optional[date] = None
    
    # العناصر والمبالغ
    line_items: List[InvoiceLineItem] = []
    
    # المبالغ المحسوبة
    subtotal_amount: Optional[MoneyAmount] = None
    discount_amount: Optional[MoneyAmount] = None
    tax_amount: Optional[MoneyAmount] = None
    total_amount: Optional[MoneyAmount] = None
    paid_amount: Optional[MoneyAmount] = Field(default=MoneyAmount(amount=Decimal("0.00")))
    outstanding_amount: Optional[MoneyAmount] = None
    
    # الحالة والمعاملات
    status: InvoiceStatus = InvoiceStatus.DRAFT
    payment_terms: str = "30 يوم"  # شروط الدفع
    currency: str = "EGP"
    
    # الربط مع النظم الأخرى
    order_id: Optional[str] = None
    debt_record_id: Optional[str] = None  # معرف سجل الدين المرتبط
    
    # التدقيق والمراجعة
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    
    # ملاحظات ومرفقات
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    attachments: List[str] = []  # معرفات المرفقات
    
    # مسار التدقيق
    audit_trail: List[AuditTrail] = []
    
    def calculate_totals(self) -> Dict[str, MoneyAmount]:
        """حساب إجماليات الفاتورة"""
        if not self.line_items:
            return self._zero_totals()
        
        subtotal = MoneyAmount(amount=Decimal("0.00"), currency=self.currency)
        total_discount = MoneyAmount(amount=Decimal("0.00"), currency=self.currency)
        total_tax = MoneyAmount(amount=Decimal("0.00"), currency=self.currency)
        
        for item in self.line_items:
            item_totals = item.calculate_totals()
            subtotal = subtotal.add(item_totals["subtotal"])
            total_discount = total_discount.add(item_totals["discount"])
            total_tax = total_tax.add(item_totals["tax"])
        
        total = subtotal.subtract(total_discount).add(total_tax)
        outstanding = total.subtract(self.paid_amount or MoneyAmount(amount=Decimal("0.00"), currency=self.currency))
        
        self.subtotal_amount = subtotal
        self.discount_amount = total_discount
        self.tax_amount = total_tax
        self.total_amount = total
        self.outstanding_amount = outstanding
        
        return {
            "subtotal": subtotal,
            "discount": total_discount,
            "tax": total_tax,
            "total": total,
            "outstanding": outstanding
        }
    
    def _zero_totals(self) -> Dict[str, MoneyAmount]:
        """إرجاع مبالغ صفر"""
        zero = MoneyAmount(amount=Decimal("0.00"), currency=self.currency)
        return {
            "subtotal": zero,
            "discount": zero,
            "tax": zero,
            "total": zero,
            "outstanding": zero
        }
    
    def convert_to_debt(self, collection_date: Optional[date] = None) -> 'IntegratedDebtRecord':
        """تحويل الفاتورة إلى سجل دين"""
        if self.status == InvoiceStatus.CONVERTED_TO_DEBT:
            raise ValueError("الفاتورة محولة بالفعل إلى دين")
        
        if not self.outstanding_amount or self.outstanding_amount.amount <= 0:
            raise ValueError("لا يوجد مبلغ مستحق لتحويله إلى دين")
        
        return IntegratedDebtRecord(
            invoice_id=self.id,
            invoice_number=self.invoice_number,
            clinic_id=self.clinic_id,
            clinic_name=self.clinic_name,
            sales_rep_id=self.sales_rep_id,
            sales_rep_name=self.sales_rep_name,
            area_id=self.area_id,
            area_name=self.area_name,
            original_amount=self.total_amount,
            outstanding_amount=self.outstanding_amount,
            due_date=self.due_date,
            collection_start_date=collection_date or date.today(),
            created_by=self.created_by
        )

class IntegratedDebtRecord(BaseModel):
    """سجل دين متكامل - Integrated Debt Record"""
    # معرفات أساسية
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    debt_number: str  # يتم إنشاؤه تلقائياً
    
    # ربط مع الفاتورة
    invoice_id: str
    invoice_number: str
    
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
    original_amount: MoneyAmount  # المبلغ الأصلي من الفاتورة
    paid_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    outstanding_amount: MoneyAmount  # المبلغ المتبقي
    
    # التواريخ
    creation_date: date = Field(default_factory=date.today)
    due_date: date  # تاريخ الاستحقاق من الفاتورة
    collection_start_date: date  # تاريخ بدء التحصيل
    last_payment_date: Optional[date] = None
    settlement_date: Optional[date] = None
    
    # الحالة والمعاملات
    status: DebtStatus = DebtStatus.OUTSTANDING
    priority: Literal["low", "medium", "high", "urgent"] = "medium"
    collection_method: Optional[str] = None  # طريقة التحصيل
    
    # سجل المدفوعات
    payments: List['DebtPaymentRecord'] = []
    
    # معلومات التحصيل
    collection_attempts: List[Dict[str, Any]] = []
    collection_notes: List[str] = []
    assigned_collector_id: Optional[str] = None
    assigned_collector_name: Optional[str] = None
    
    # التدقيق والمراجعة
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    
    # مسار التدقيق
    audit_trail: List[AuditTrail] = []
    
    def calculate_aging(self) -> Dict[str, Any]:
        """حساب تقادم الدين"""
        today = date.today()
        days_overdue = (today - self.due_date).days if today > self.due_date else 0
        
        if days_overdue <= 0:
            category = "current"
        elif days_overdue <= 30:
            category = "30_days"
        elif days_overdue <= 60:
            category = "60_days"
        elif days_overdue <= 90:
            category = "90_days"
        else:
            category = "over_90_days"
        
        return {
            "days_overdue": days_overdue,
            "category": category,
            "risk_level": self._calculate_risk_level(days_overdue)
        }
    
    def _calculate_risk_level(self, days_overdue: int) -> str:
        """حساب مستوى المخاطرة"""
        if days_overdue <= 0:
            return "low"
        elif days_overdue <= 30:
            return "medium"
        elif days_overdue <= 60:
            return "high"
        else:
            return "critical"
    
    def add_payment(self, payment: 'DebtPaymentRecord') -> None:
        """إضافة دفعة جديدة"""
        if payment.amount.amount > self.outstanding_amount.amount:
            raise ValueError("مبلغ الدفعة أكبر من المبلغ المتبقي")
        
        self.payments.append(payment)
        self.paid_amount = self.paid_amount.add(payment.amount)
        self.outstanding_amount = self.outstanding_amount.subtract(payment.amount)
        self.last_payment_date = payment.payment_date
        
        # تحديث الحالة
        if self.outstanding_amount.amount <= Decimal("0.01"):  # تسامح للأخطاء الرقمية
            self.status = DebtStatus.COLLECTED
            self.settlement_date = payment.payment_date
        else:
            self.status = DebtStatus.PARTIALLY_COLLECTED

class DebtPaymentRecord(BaseModel):
    """سجل دفعة دين - Debt Payment Record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_number: str  # يتم إنشاؤه تلقائياً
    
    # ربط مع الدين
    debt_id: str
    debt_number: str
    
    # تفاصيل الدفعة
    amount: MoneyAmount
    payment_date: date = Field(default_factory=date.today)
    payment_method: str = "cash"  # من FinancialConfig.PAYMENT_METHODS
    
    # معلومات إضافية
    reference_number: Optional[str] = None  # رقم الشيك أو الحوالة
    bank_name: Optional[str] = None
    check_date: Optional[date] = None
    
    # الحالة والمعالجة
    status: PaymentStatus = PaymentStatus.COMPLETED
    processed_by: str
    processed_by_name: str
    processing_date: datetime = Field(default_factory=datetime.utcnow)
    
    # ملاحظات
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # مسار التدقيق
    created_at: datetime = Field(default_factory=datetime.utcnow)
    audit_trail: List[AuditTrail] = []

class FinancialTransaction(BaseModel):
    """معاملة مالية شاملة - Comprehensive Financial Transaction"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_number: str
    transaction_type: TransactionType
    
    # الكيانات المرتبطة
    invoice_id: Optional[str] = None
    debt_id: Optional[str] = None
    payment_id: Optional[str] = None
    order_id: Optional[str] = None
    
    # معلومات المعاملة
    amount: MoneyAmount
    description: str
    reference: Optional[str] = None
    
    # التوقيت والمعالجة
    transaction_date: datetime = Field(default_factory=datetime.utcnow)
    processed_by: str
    processed_by_name: str
    
    # البيانات التفصيلية
    details: Dict[str, Any] = {}
    
    # مسار التدقيق
    audit_trail: List[AuditTrail] = []

# ============================================================================
# FINANCIAL REPORTS MODELS - نماذج التقارير المالية
# ============================================================================

class AgingAnalysis(BaseModel):
    """تحليل تقادم الديون - Aging Analysis"""
    clinic_id: str
    clinic_name: str
    total_outstanding: MoneyAmount
    
    current: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    days_30: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    days_60: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    days_90: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    over_90: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    
    risk_level: Literal["low", "medium", "high", "critical"] = "low"
    recommended_action: str = "مراقبة عادية"

class FinancialSummary(BaseModel):
    """ملخص مالي شامل - Comprehensive Financial Summary"""
    period_start: date
    period_end: date
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # الفواتير
    total_invoices_count: int = 0
    total_invoices_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    paid_invoices_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    outstanding_invoices_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    
    # الديون
    total_debts_count: int = 0
    total_debts_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    collected_debts_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    outstanding_debts_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    
    # المدفوعات
    total_payments_count: int = 0
    total_payments_amount: MoneyAmount = Field(default=MoneyAmount(amount=Decimal("0.00")))
    
    # المؤشرات المالية
    collection_rate: Decimal = Field(default=Decimal("0.00"))  # معدل التحصيل
    average_collection_time: int = 0  # متوسط وقت التحصيل بالأيام
    overdue_rate: Decimal = Field(default=Decimal("0.00"))  # معدل التأخير

# ============================================================================
# API REQUEST/RESPONSE MODELS - نماذج الطلبات والاستجابات
# ============================================================================

class CreateInvoiceRequest(BaseModel):
    """طلب إنشاء فاتورة - Create Invoice Request"""
    clinic_id: str
    sales_rep_id: str
    due_date: date
    line_items: List[Dict[str, Any]]  # سيتم تحويلها إلى InvoiceLineItem
    payment_terms: str = "30 يوم"
    notes: Optional[str] = None
    order_id: Optional[str] = None

class ProcessPaymentRequest(BaseModel):
    """طلب معالجة دفعة - Process Payment Request"""
    debt_id: str
    amount: Decimal
    payment_method: str = "cash"
    payment_date: date = Field(default_factory=date.today)
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class FinancialReportRequest(BaseModel):
    """طلب تقرير مالي - Financial Report Request"""
    report_type: Literal["aging", "summary", "transactions", "collection"]
    start_date: date
    end_date: date
    clinic_ids: Optional[List[str]] = None
    sales_rep_ids: Optional[List[str]] = None
    include_details: bool = True

# ============================================================================
# VALIDATORS - المدققات
# ============================================================================

@validator('due_date')
def validate_due_date(cls, v, values):
    """التأكد من أن تاريخ الاستحقاق في المستقبل"""
    if 'issue_date' in values and v < values['issue_date']:
        raise ValueError('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار')
    return v

@validator('outstanding_amount')
def validate_outstanding_amount(cls, v, values):
    """التأكد من صحة المبلغ المتبقي"""
    if 'total_amount' in values and 'paid_amount' in values:
        expected = values['total_amount'].subtract(values['paid_amount'])
        if abs(v.amount - expected.amount) > Decimal('0.01'):
            raise ValueError('المبلغ المتبقي غير صحيح')
    return v

# إضافة المدققات للنماذج
IntegratedInvoice.__validators__ = {
    'validate_due_date': validator('due_date', allow_reuse=True)(validate_due_date)
}