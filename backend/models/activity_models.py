# Activity Tracking Models - نماذج تتبع الأنشطة
# المطلوب: نظام شامل لتتبع جميع الأنشطة مع GPS والوقت والتفاصيل

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class ActivityType(str, Enum):
    """أنواع الأنشطة المختلفة"""
    LOGIN = "login"
    LOGOUT = "logout" 
    VISIT_REGISTRATION = "visit_registration"
    CLINIC_REGISTRATION = "clinic_registration"
    ORDER_CREATION = "order_creation"
    ORDER_APPROVAL = "order_approval"
    ORDER_REJECTION = "order_rejection"
    PRODUCT_UPDATE = "product_update"
    USER_CREATION = "user_creation"
    SYSTEM_ACCESS = "system_access"
    PAYMENT_RECORD = "payment_record"
    INVOICE_CREATION = "invoice_creation"
    REPORT_GENERATION = "report_generation"

class LocationData(BaseModel):
    """بيانات الموقع مع GPS"""
    latitude: float = Field(..., description="خط العرض")
    longitude: float = Field(..., description="خط الطول")
    accuracy: Optional[float] = Field(None, description="دقة الموقع بالمتر")
    altitude: Optional[float] = Field(None, description="الارتفاع")
    speed: Optional[float] = Field(None, description="السرعة")
    heading: Optional[float] = Field(None, description="الاتجاه")
    address: Optional[str] = Field(None, description="العنوان المقروء")
    city: Optional[str] = Field(None, description="المدينة")
    area: Optional[str] = Field(None, description="المنطقة")
    country: Optional[str] = Field(None, description="الدولة")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="وقت تسجيل الموقع")

class DeviceInfo(BaseModel):
    """معلومات الجهاز المستخدم"""
    device_type: Optional[str] = Field(None, description="نوع الجهاز (mobile, desktop, tablet)")
    operating_system: Optional[str] = Field(None, description="نظام التشغيل")
    browser: Optional[str] = Field(None, description="المتصفح")
    browser_version: Optional[str] = Field(None, description="إصدار المتصفح")
    user_agent: Optional[str] = Field(None, description="User Agent الكامل")
    screen_resolution: Optional[str] = Field(None, description="دقة الشاشة")
    ip_address: Optional[str] = Field(None, description="عنوان IP")
    session_id: Optional[str] = Field(None, description="معرف الجلسة")

class ActivityCreate(BaseModel):
    """إنشاء نشاط جديد"""
    type: ActivityType = Field(..., description="نوع النشاط")
    action: str = Field(..., description="وصف النشاط بالعربية")
    target_type: Optional[str] = Field(None, description="نوع الهدف (clinic, product, order, etc.)")
    target_id: Optional[str] = Field(None, description="معرف الهدف")
    target_name: Optional[str] = Field(None, description="اسم الهدف")
    location: Optional[LocationData] = Field(None, description="بيانات الموقع")
    device_info: Optional[DeviceInfo] = Field(None, description="معلومات الجهاز")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="تفاصيل إضافية")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="بيانات إضافية")

class ActivityResponse(BaseModel):
    """استجابة النشاط"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف النشاط")
    type: ActivityType = Field(..., description="نوع النشاط")
    action: str = Field(..., description="وصف النشاط")
    user_id: str = Field(..., description="معرف المستخدم")
    user_name: str = Field(..., description="اسم المستخدم")
    user_role: str = Field(..., description="دور المستخدم")
    target_type: Optional[str] = Field(None, description="نوع الهدف")
    target_id: Optional[str] = Field(None, description="معرف الهدف")
    target_name: Optional[str] = Field(None, description="اسم الهدف")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="وقت النشاط")
    location: Optional[LocationData] = Field(None, description="بيانات الموقع")
    device_info: Optional[DeviceInfo] = Field(None, description="معلومات الجهاز")
    details: Optional[Dict[str, Any]] = Field(default_factory=dict, description="تفاصيل إضافية")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="بيانات إضافية")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="وقت الإنشاء")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="وقت التحديث")

class ActivityFilter(BaseModel):
    """فلترة الأنشطة"""
    user_id: Optional[str] = None
    activity_type: Optional[ActivityType] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    location_radius: Optional[float] = None  # للبحث بالموقع
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    limit: int = Field(default=100, le=1000, description="عدد النتائج المطلوبة")
    offset: int = Field(default=0, ge=0, description="تخطي عدد من النتائج")

class ActivityStats(BaseModel):
    """إحصائيات الأنشطة"""
    total_activities: int = Field(..., description="إجمالي الأنشطة")
    today_activities: int = Field(..., description="أنشطة اليوم")
    week_activities: int = Field(..., description="أنشطة الأسبوع")
    month_activities: int = Field(..., description="أنشطة الشهر")
    activities_by_type: Dict[str, int] = Field(..., description="الأنشطة حسب النوع")
    activities_by_user: Dict[str, int] = Field(..., description="الأنشطة حسب المستخدم")
    most_active_locations: List[Dict[str, Any]] = Field(..., description="أكثر المواقع نشاطاً")
    peak_hours: List[Dict[str, Any]] = Field(..., description="ساعات الذروة")

class GPSTrackingLog(BaseModel):
    """سجل تتبع GPS مفصل"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف السجل")
    user_id: str = Field(..., description="معرف المستخدم")
    activity_id: Optional[str] = Field(None, description="معرف النشاط المرتبط")
    location: LocationData = Field(..., description="بيانات الموقع")
    movement_type: Optional[str] = Field(None, description="نوع الحركة (walking, driving, stationary)")
    distance_from_last: Optional[float] = Field(None, description="المسافة من آخر موقع بالمتر")
    duration_at_location: Optional[int] = Field(None, description="مدة البقاء بالموقع بالدقائق")
    nearby_clinics: Optional[List[Dict[str, Any]]] = Field(None, description="العيادات القريبة")
    weather_data: Optional[Dict[str, Any]] = Field(None, description="بيانات الطقس")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="وقت الإنشاء")