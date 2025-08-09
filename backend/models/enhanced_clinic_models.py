# نماذج العيادات المحسنة - Enhanced Clinic Models
# Medical Management System - Professional Clinic Registration & Management

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, date
from decimal import Decimal
import uuid
from enum import Enum

# ============================================================================
# CLINIC CLASSIFICATION SYSTEM - نظام تصنيف العيادات
# ============================================================================

class ClinicClassification(str, Enum):
    """تصنيف العيادات حسب الأداء"""
    CLASS_A_STAR = "class_a_star"    # Class A star 
    CLASS_A = "class_a"              # Class A
    CLASS_B = "class_b"              # Class B  
    CLASS_C = "class_c"              # Class C
    CLASS_D = "class_d"              # Class D

class CreditClassification(str, Enum):
    """التصنيف الائتماني للعيادة"""
    GREEN = "green"                  # أخضر - تصنيف ائتماني جيد
    YELLOW = "yellow"                # أصفر - تصنيف ائتماني مقبول  
    RED = "red"                      # أحمر - يحتاج مراجعة الحسابات

class ClinicStatus(str, Enum):
    """حالة العيادة"""
    PENDING = "pending"           # قيد المراجعة
    APPROVED = "approved"         # معتمدة
    REJECTED = "rejected"         # مرفوضة  
    SUSPENDED = "suspended"       # معلقة
    INACTIVE = "inactive"         # غير نشطة

class RegistrationType(str, Enum):
    """نوع التسجيل"""
    FIELD_REGISTRATION = "field_registration"     # تسجيل ميداني
    OFFICE_REGISTRATION = "office_registration"   # تسجيل مكتبي
    ONLINE_REGISTRATION = "online_registration"   # تسجيل إلكتروني

# ============================================================================
# LOCATION & GEOGRAPHIC MODELS - نماذج الموقع والجغرافيا
# ============================================================================

class LocationData(BaseModel):
    """بيانات الموقع الجغرافي"""
    latitude: float = Field(..., description="خط العرض")
    longitude: float = Field(..., description="خط الطول")
    address: str = Field(..., description="العنوان التفصيلي")
    accuracy: Optional[float] = Field(default=None, description="دقة الموقع بالأمتار")
    altitude: Optional[float] = Field(default=None, description="الارتفاع")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="وقت تحديد الموقع")

class RegistrationLocationData(BaseModel):
    """بيانات موقع المسجل وقت التسجيل"""
    rep_latitude: float = Field(..., description="خط عرض المسجل")
    rep_longitude: float = Field(..., description="خط طول المسجل")
    rep_accuracy: Optional[float] = Field(default=None, description="دقة موقع المسجل")
    location_timestamp: datetime = Field(default_factory=datetime.utcnow, description="وقت تسجيل الموقع")
    device_info: Optional[str] = Field(default="", description="معلومات الجهاز")
    address_verification: bool = Field(default=False, description="تم التحقق من العنوان")

# ============================================================================
# ENHANCED CLINIC MODEL - نموذج العيادة المحسن
# ============================================================================

class EnhancedClinic(BaseModel):
    """نموذج العيادة المحسن والاحترافي"""
    
    # المعرفات الأساسية
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف العيادة")
    registration_number: str = Field(..., description="رقم التسجيل الفريد")
    
    # بيانات العيادة الأساسية
    name: str = Field(..., min_length=2, max_length=200, description="اسم العيادة")
    phone: Optional[str] = Field(default=None, description="هاتف العيادة")
    email: Optional[str] = Field(default=None, description="البريد الإلكتروني")
    website: Optional[str] = Field(default=None, description="الموقع الإلكتروني")
    
    # بيانات الطبيب الرئيسي
    primary_doctor_name: str = Field(..., min_length=2, max_length=100, description="اسم الطبيب الرئيسي")
    primary_doctor_specialty: str = Field(..., description="تخصص الطبيب الرئيسي")
    primary_doctor_phone: Optional[str] = Field(default=None, description="هاتف الطبيب")
    additional_doctors: List[Dict[str, str]] = Field(default=[], description="أطباء إضافيون")
    
    # معلومات الموقع
    location_data: LocationData = Field(..., description="بيانات الموقع الجغرافي")
    admin_approved_location: Optional[LocationData] = Field(default=None, description="الموقع المعتمد من الأدمن")
    
    # الربط الجغرافي والإداري  
    line_id: str = Field(..., description="معرف الخط التابع له")
    line_name: str = Field(..., description="اسم الخط التابع له")
    area_id: str = Field(..., description="معرف المنطقة التابعة لها")
    area_name: str = Field(..., description="اسم المنطقة التابعة لها")
    district_id: Optional[str] = Field(default=None, description="معرف المقاطعة")
    district_name: Optional[str] = Field(default=None, description="اسم المقاطعة")
    
    # التصنيفات
    classification: ClinicClassification = Field(default=ClinicClassification.AVERAGE, description="تصنيف العيادة")
    credit_classification: CreditClassification = Field(default=CreditClassification.B, description="التصنيف الائتماني")
    classification_notes: Optional[str] = Field(default=None, description="ملاحظات التصنيف")
    classification_updated_at: Optional[datetime] = Field(default=None, description="تاريخ آخر تحديث للتصنيف")
    classification_updated_by: Optional[str] = Field(default=None, description="من حدث التصنيف")
    
    # معلومات التخصيص
    assigned_rep_id: str = Field(..., description="معرف المندوب المخصص")
    assigned_rep_name: str = Field(..., description="اسم المندوب المخصص")
    backup_rep_ids: List[str] = Field(default=[], description="قائمة المناديب الاحتياطيين")
    available_reps: List[str] = Field(default=[], description="قائمة المناديب المتاحين للزيارة")
    
    # الإحصائيات والأداء
    total_visits: int = Field(default=0, description="إجمالي الزيارات")
    total_orders: int = Field(default=0, description="إجمالي الطلبات")
    total_revenue: Decimal = Field(default=Decimal("0.00"), description="إجمالي الإيرادات")
    outstanding_debt: Decimal = Field(default=Decimal("0.00"), description="الديون المستحقة")
    credit_limit: Decimal = Field(default=Decimal("5000.00"), description="الحد الائتماني")
    last_visit_date: Optional[date] = Field(default=None, description="تاريخ آخر زيارة")
    last_order_date: Optional[date] = Field(default=None, description="تاريخ آخر طلب")
    last_payment_date: Optional[date] = Field(default=None, description="تاريخ آخر دفعة")
    
    # حالة العيادة
    status: ClinicStatus = Field(default=ClinicStatus.PENDING, description="حالة العيادة")
    is_active: bool = Field(default=True, description="نشطة أم لا")
    is_verified: bool = Field(default=False, description="تم التحقق منها")
    verification_date: Optional[datetime] = Field(default=None, description="تاريخ التحقق")
    
    # بيانات التسجيل
    registration_type: RegistrationType = Field(default=RegistrationType.FIELD_REGISTRATION, description="نوع التسجيل")
    registration_location: Optional[RegistrationLocationData] = Field(default=None, description="موقع المسجل وقت التسجيل")
    registration_notes: Optional[str] = Field(default=None, description="ملاحظات التسجيل")
    registration_photos: List[str] = Field(default=[], description="صور التسجيل")
    
    # بيانات إدارية
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ الإنشاء")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ آخر تحديث")
    created_by: str = Field(..., description="من أنشأ السجل")
    updated_by: Optional[str] = Field(default=None, description="من حدث السجل")
    approved_by: Optional[str] = Field(default=None, description="من اعتمد العيادة")
    approved_at: Optional[datetime] = Field(default=None, description="تاريخ الاعتماد")
    
    # مسار التدقيق
    audit_trail: List[Dict[str, Any]] = Field(default=[], description="مسار التدقيق والتغييرات")
    
    def add_audit_entry(self, action: str, user_id: str, user_name: str, details: Dict[str, Any] = None):
        """إضافة إدخال لمسار التدقيق"""
        audit_entry = {
            "action": action,
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "user_name": user_name,
            "details": details or {},
            "ip_address": None,  # يمكن إضافتها لاحقاً
            "user_agent": None   # يمكن إضافتها لاحقاً
        }
        self.audit_trail.append(audit_entry)
        self.updated_at = datetime.utcnow()
        self.updated_by = user_id

# ============================================================================
# CLINIC REGISTRATION REQUEST - طلب تسجيل العيادة
# ============================================================================

class ClinicRegistrationRequest(BaseModel):
    """طلب تسجيل عيادة جديدة"""
    
    # بيانات العيادة
    clinic_name: str = Field(..., min_length=2, max_length=200, description="اسم العيادة")
    clinic_phone: Optional[str] = Field(default=None, description="هاتف العيادة")
    clinic_email: Optional[str] = Field(default=None, description="بريد العيادة")
    
    # بيانات الطبيب
    doctor_name: str = Field(..., min_length=2, max_length=100, description="اسم الطبيب")
    doctor_specialty: str = Field(..., description="تخصص الطبيب")
    doctor_phone: Optional[str] = Field(default=None, description="هاتف الطبيب")
    
    # بيانات الموقع (العيادة)
    clinic_latitude: float = Field(..., description="خط عرض العيادة")
    clinic_longitude: float = Field(..., description="خط طول العيادة")
    clinic_address: str = Field(..., description="عنوان العيادة")
    location_accuracy: Optional[float] = Field(default=None, description="دقة الموقع")
    
    # الربط الجغرافي
    line_id: str = Field(..., description="معرف الخط المختار")
    area_id: str = Field(..., description="معرف المنطقة المختارة")
    district_id: Optional[str] = Field(default=None, description="معرف المقاطعة")
    
    # بيانات التسجيل
    registration_notes: Optional[str] = Field(default=None, description="ملاحظات التسجيل")
    registration_photos: List[str] = Field(default=[], description="صور التسجيل")
    
    # موقع المسجل وقت التسجيل (مخفي عن المستخدم)
    rep_latitude: Optional[float] = Field(default=None, description="خط عرض المسجل")
    rep_longitude: Optional[float] = Field(default=None, description="خط طول المسجل")
    rep_location_accuracy: Optional[float] = Field(default=None, description="دقة موقع المسجل")
    device_info: Optional[str] = Field(default="", description="معلومات الجهاز")

# ============================================================================
# CLINIC MODIFICATION LOG - سجل تعديل العيادات
# ============================================================================

class ClinicModificationLog(BaseModel):
    """سجل تعديلات العيادة"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف السجل")
    clinic_id: str = Field(..., description="معرف العيادة")
    clinic_name: str = Field(..., description="اسم العيادة")
    
    # بيانات التعديل
    modification_type: Literal["create", "update", "approve", "reject", "suspend", "reactivate"] = Field(..., description="نوع التعديل")
    old_data: Dict[str, Any] = Field(default={}, description="البيانات القديمة")
    new_data: Dict[str, Any] = Field(default={}, description="البيانات الجديدة")
    changes_summary: str = Field(..., description="ملخص التغييرات")
    
    # بيانات المستخدم
    modified_by: str = Field(..., description="من قام بالتعديل")
    modifier_name: str = Field(..., description="اسم المعدل")
    modifier_role: str = Field(..., description="دور المعدل")
    
    # بيانات الموقع وقت التعديل
    modifier_location: Optional[Dict[str, Any]] = Field(default=None, description="موقع المعدل وقت التعديل")
    modification_reason: Optional[str] = Field(default=None, description="سبب التعديل")
    admin_notes: Optional[str] = Field(default=None, description="ملاحظات إدارية")
    
    # التواريخ
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ التعديل")
    approved_at: Optional[datetime] = Field(default=None, description="تاريخ الموافقة على التعديل")
    approved_by: Optional[str] = Field(default=None, description="من وافق على التعديل")

# ============================================================================
# ADMIN REGISTRATION LOG - سجل التسجيلات للأدمن
# ============================================================================

class AdminRegistrationLog(BaseModel):
    """سجل تسجيل العيادات للأدمن"""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف السجل")
    
    # بيانات العيادة المسجلة
    clinic_id: str = Field(..., description="معرف العيادة")
    clinic_name: str = Field(..., description="اسم العيادة")
    clinic_phone: Optional[str] = Field(default=None, description="هاتف العيادة")
    doctor_name: str = Field(..., description="اسم الطبيب")
    clinic_address: str = Field(..., description="عنوان العيادة")
    
    # بيانات المسجل
    registered_by: str = Field(..., description="معرف المسجل")
    registrar_name: str = Field(..., description="اسم المسجل")
    registrar_role: str = Field(..., description="دور المسجل")
    
    # بيانات الموقع
    clinic_location: LocationData = Field(..., description="موقع العيادة")
    registrar_location: Optional[RegistrationLocationData] = Field(default=None, description="موقع المسجل وقت التسجيل")
    
    # بيانات الجغرافية
    line_name: str = Field(..., description="اسم الخط")
    area_name: str = Field(..., description="اسم المنطقة")
    district_name: Optional[str] = Field(default=None, description="اسم المقاطعة")
    
    # حالة التسجيل
    registration_status: ClinicStatus = Field(default=ClinicStatus.PENDING, description="حالة التسجيل")
    registration_type: RegistrationType = Field(..., description="نوع التسجيل")
    registration_photos: List[str] = Field(default=[], description="صور التسجيل")
    registration_notes: Optional[str] = Field(default=None, description="ملاحظات التسجيل")
    
    # بيانات المراجعة
    reviewed_by: Optional[str] = Field(default=None, description="من راجع التسجيل")
    reviewer_name: Optional[str] = Field(default=None, description="اسم المراجع")
    review_date: Optional[datetime] = Field(default=None, description="تاريخ المراجعة")
    review_notes: Optional[str] = Field(default=None, description="ملاحظات المراجعة")
    review_decision: Optional[Literal["approved", "rejected", "pending"]] = Field(default="pending", description="قرار المراجعة")
    
    # التواريخ
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ التسجيل")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="تاريخ آخر تحديث")

# ============================================================================
# CLINIC SEARCH & FILTER MODELS - نماذج البحث والتصفية
# ============================================================================

class ClinicSearchFilter(BaseModel):
    """مرشح البحث في العيادات"""
    
    # معايير البحث
    search_text: Optional[str] = Field(default=None, description="نص البحث")
    line_id: Optional[str] = Field(default=None, description="معرف الخط")
    area_id: Optional[str] = Field(default=None, description="معرف المنطقة")
    district_id: Optional[str] = Field(default=None, description="معرف المقاطعة")
    assigned_rep_id: Optional[str] = Field(default=None, description="معرف المندوب")
    
    # تصفية حسب التصنيف
    classification: Optional[ClinicClassification] = Field(default=None, description="تصنيف العيادة")
    credit_classification: Optional[CreditClassification] = Field(default=None, description="التصنيف الائتماني")
    status: Optional[ClinicStatus] = Field(default=None, description="حالة العيادة")
    
    # تصفية زمنية
    created_from: Optional[date] = Field(default=None, description="من تاريخ الإنشاء")
    created_to: Optional[date] = Field(default=None, description="إلى تاريخ الإنشاء")
    last_visit_from: Optional[date] = Field(default=None, description="من تاريخ آخر زيارة")
    last_visit_to: Optional[date] = Field(default=None, description="إلى تاريخ آخر زيارة")
    
    # تصفية مالية
    min_revenue: Optional[Decimal] = Field(default=None, description="أقل إيراد")
    max_debt: Optional[Decimal] = Field(default=None, description="أقصى دين")
    
    # معايير الترقيم
    page: int = Field(default=1, ge=1, description="رقم الصفحة")
    page_size: int = Field(default=20, ge=1, le=100, description="حجم الصفحة")
    sort_by: Literal["name", "created_at", "last_visit_date", "total_revenue", "outstanding_debt"] = Field(default="created_at", description="ترتيب حسب")
    sort_order: Literal["asc", "desc"] = Field(default="desc", description="اتجاه الترتيب")

# ============================================================================
# RESPONSE MODELS - نماذج الاستجابة
# ============================================================================

class ClinicSummary(BaseModel):
    """ملخص العيادة للقوائم"""
    id: str
    name: str
    primary_doctor_name: str
    phone: Optional[str]
    address: str
    classification: ClinicClassification
    credit_classification: CreditClassification
    status: ClinicStatus
    line_name: str
    area_name: str
    assigned_rep_name: str
    total_visits: int
    total_revenue: Decimal
    outstanding_debt: Decimal
    last_visit_date: Optional[date]
    created_at: datetime

class ClinicRegistrationResponse(BaseModel):
    """استجابة تسجيل العيادة"""
    success: bool
    message: str
    clinic_id: Optional[str] = None
    registration_number: Optional[str] = None
    status: Optional[str] = None
    next_steps: List[str] = []

class ClinicModificationResponse(BaseModel):
    """استجابة تعديل العيادة"""
    success: bool
    message: str
    clinic_id: str
    modification_id: str
    changes_applied: Dict[str, Any]
    requires_approval: bool = False