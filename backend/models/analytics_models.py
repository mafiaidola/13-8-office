# Advanced Analytics Models - نماذج التحليلات المتقدمة
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum
import uuid

class ReportType(str, Enum):
    SALES_PERFORMANCE = "sales_performance"           # أداء المبيعات
    VISIT_ANALYTICS = "visit_analytics"               # تحليل الزيارات
    CLIENT_BEHAVIOR = "client_behavior"               # سلوك العملاء
    GEOGRAPHIC_ANALYSIS = "geographic_analysis"       # التحليل الجغرافي
    PRODUCT_PERFORMANCE = "product_performance"       # أداء المنتجات
    REP_PERFORMANCE = "rep_performance"               # أداء المندوبين
    FINANCIAL_ANALYSIS = "financial_analysis"         # التحليل المالي
    TREND_ANALYSIS = "trend_analysis"                 # تحليل الاتجاهات

class ChartType(str, Enum):
    LINE = "line"                                     # خط بياني
    BAR = "bar"                                       # أعمدة بيانية
    PIE = "pie"                                       # دائري
    AREA = "area"                                     # منطقة
    SCATTER = "scatter"                               # نقاط متناثرة
    HEATMAP = "heatmap"                               # خريطة حرارية
    GAUGE = "gauge"                                   # مقياس
    TABLE = "table"                                   # جدول

class TimeRange(str, Enum):
    TODAY = "today"                                   # اليوم
    YESTERDAY = "yesterday"                           # أمس
    THIS_WEEK = "this_week"                          # هذا الأسبوع
    LAST_WEEK = "last_week"                          # الأسبوع الماضي
    THIS_MONTH = "this_month"                        # هذا الشهر
    LAST_MONTH = "last_month"                        # الشهر الماضي
    THIS_QUARTER = "this_quarter"                    # هذا الربع
    LAST_QUARTER = "last_quarter"                    # الربع الماضي
    THIS_YEAR = "this_year"                          # هذا العام
    LAST_YEAR = "last_year"                          # العام الماضي
    CUSTOM = "custom"                                # مخصص

# Chart Data Structure
class ChartDataPoint(BaseModel):
    x: Any = Field(..., description="القيمة السينية")
    y: Any = Field(..., description="القيمة الصادية")
    label: Optional[str] = Field(None, description="التسمية")
    color: Optional[str] = Field(None, description="اللون")
    metadata: Dict[str, Any] = Field(default={}, description="بيانات إضافية")

class ChartSeries(BaseModel):
    name: str = Field(..., description="اسم السلسلة")
    data: List[ChartDataPoint] = Field(default=[], description="نقاط البيانات")
    color: Optional[str] = Field(None, description="لون السلسلة")
    type: Optional[ChartType] = Field(None, description="نوع الرسم البياني")

class ChartConfig(BaseModel):
    title: str = Field(..., description="عنوان الرسم البياني")
    subtitle: Optional[str] = Field(None, description="العنوان الفرعي")
    type: ChartType = Field(..., description="نوع الرسم البياني")
    series: List[ChartSeries] = Field(default=[], description="سلاسل البيانات")
    x_axis_title: Optional[str] = Field(None, description="عنوان المحور السيني")
    y_axis_title: Optional[str] = Field(None, description="عنوان المحور الصادي")
    height: int = Field(default=400, description="الارتفاع")
    width: Optional[int] = Field(None, description="العرض")
    options: Dict[str, Any] = Field(default={}, description="خيارات إضافية")

# Analytics Dashboard
class AnalyticsDashboard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="عنوان لوحة المعلومات")
    description: Optional[str] = Field(None, description="الوصف")
    charts: List[ChartConfig] = Field(default=[], description="الرسوم البيانية")
    filters: Dict[str, Any] = Field(default={}, description="الفلاتر المطبقة")
    time_range: TimeRange = Field(default=TimeRange.THIS_MONTH)
    custom_start_date: Optional[date] = Field(None)
    custom_end_date: Optional[date] = Field(None)
    created_by: str = Field(..., description="منشئ لوحة المعلومات")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_public: bool = Field(default=False, description="عامة أم خاصة")
    tags: List[str] = Field(default=[], description="العلامات")

# Report Generation
class ReportRequest(BaseModel):
    title: str = Field(..., description="عنوان التقرير")
    type: ReportType = Field(..., description="نوع التقرير")
    time_range: TimeRange = Field(default=TimeRange.THIS_MONTH)
    custom_start_date: Optional[date] = Field(None)
    custom_end_date: Optional[date] = Field(None)
    filters: Dict[str, Any] = Field(default={}, description="فلاتر التقرير")
    format: str = Field(default="pdf", description="صيغة التقرير")  # pdf, excel, json
    include_charts: bool = Field(default=True, description="تضمين الرسوم البيانية")
    include_summary: bool = Field(default=True, description="تضمين الملخص")
    include_details: bool = Field(default=True, description="تضمين التفاصيل")
    recipients: List[str] = Field(default=[], description="المستلمون عبر البريد")

class GeneratedReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="عنوان التقرير")
    type: ReportType = Field(..., description="نوع التقرير")
    generated_by: str = Field(..., description="منشئ التقرير")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    file_path: Optional[str] = Field(None, description="مسار الملف")
    file_size: Optional[int] = Field(None, description="حجم الملف")
    download_count: int = Field(default=0, description="عدد مرات التحميل")
    expires_at: Optional[datetime] = Field(None, description="تاريخ انتهاء الصلاحية")
    metadata: Dict[str, Any] = Field(default={}, description="بيانات إضافية")

# Performance Metrics
class PerformanceMetric(BaseModel):
    name: str = Field(..., description="اسم المقياس")
    value: float = Field(..., description="القيمة")
    previous_value: Optional[float] = Field(None, description="القيمة السابقة")
    change_percentage: Optional[float] = Field(None, description="نسبة التغيير")
    trend: str = Field(default="stable", description="الاتجاه")  # up, down, stable
    unit: Optional[str] = Field(None, description="الوحدة")
    target: Optional[float] = Field(None, description="الهدف")
    category: Optional[str] = Field(None, description="الفئة")

class PerformanceDashboard(BaseModel):
    title: str = Field(..., description="عنوان لوحة الأداء")
    metrics: List[PerformanceMetric] = Field(default=[], description="المقاييس")
    period: str = Field(..., description="الفترة الزمنية")
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Sales Analytics
class SalesAnalytics(BaseModel):
    total_sales: float = Field(default=0.0, description="إجمالي المبيعات")
    total_orders: int = Field(default=0, description="إجمالي الطلبات")
    average_order_value: float = Field(default=0.0, description="متوسط قيمة الطلب")
    conversion_rate: float = Field(default=0.0, description="معدل التحويل")
    
    # Time-based comparisons
    sales_growth: float = Field(default=0.0, description="نمو المبيعات")
    order_growth: float = Field(default=0.0, description="نمو الطلبات")
    
    # Top performers
    top_products: List[Dict[str, Any]] = Field(default=[], description="أفضل المنتجات")
    top_clients: List[Dict[str, Any]] = Field(default=[], description="أفضل العملاء")
    top_reps: List[Dict[str, Any]] = Field(default=[], description="أفضل المندوبين")
    
    # Geographic breakdown
    sales_by_area: List[Dict[str, Any]] = Field(default=[], description="المبيعات حسب المنطقة")
    sales_by_line: List[Dict[str, Any]] = Field(default=[], description="المبيعات حسب الخط")

# Visit Analytics
class VisitAnalytics(BaseModel):
    total_visits: int = Field(default=0, description="إجمالي الزيارات")
    successful_visits: int = Field(default=0, description="الزيارات الناجحة")
    success_rate: float = Field(default=0.0, description="معدل النجاح")
    average_visits_per_rep: float = Field(default=0.0, description="متوسط الزيارات لكل مندوب")
    
    # Time analysis
    visits_by_hour: List[Dict[str, Any]] = Field(default=[], description="الزيارات حسب الساعة")
    visits_by_day: List[Dict[str, Any]] = Field(default=[], description="الزيارات حسب اليوم")
    visits_by_month: List[Dict[str, Any]] = Field(default=[], description="الزيارات حسب الشهر")
    
    # Performance analysis
    rep_performance: List[Dict[str, Any]] = Field(default=[], description="أداء المندوبين")
    clinic_coverage: List[Dict[str, Any]] = Field(default=[], description="تغطية العيادات")

# Custom Analytics Query
class AnalyticsQuery(BaseModel):
    query_name: str = Field(..., description="اسم الاستعلام")
    description: Optional[str] = Field(None, description="وصف الاستعلام")
    sql_query: Optional[str] = Field(None, description="استعلام SQL مخصص")
    aggregation_pipeline: Optional[List[Dict[str, Any]]] = Field(None, description="MongoDB aggregation")
    parameters: Dict[str, Any] = Field(default={}, description="المعاملات")
    chart_config: Optional[ChartConfig] = Field(None, description="إعدادات الرسم البياني")
    cache_duration: int = Field(default=300, description="مدة التخزين المؤقت بالثواني")

class AnalyticsQueryResult(BaseModel):
    query_name: str = Field(..., description="اسم الاستعلام")
    executed_at: datetime = Field(default_factory=datetime.utcnow)
    execution_time: float = Field(..., description="وقت التنفيذ بالثواني")
    row_count: int = Field(..., description="عدد الصفوف")
    data: List[Dict[str, Any]] = Field(default=[], description="البيانات")
    chart_data: Optional[ChartConfig] = Field(None, description="بيانات الرسم البياني")
    summary: Dict[str, Any] = Field(default={}, description="الملخص")

# KPI Management
class KPI(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="اسم المؤشر")
    description: Optional[str] = Field(None, description="وصف المؤشر")
    formula: str = Field(..., description="صيغة الحساب")
    target: Optional[float] = Field(None, description="الهدف")
    current_value: Optional[float] = Field(None, description="القيمة الحالية")
    unit: Optional[str] = Field(None, description="الوحدة")
    frequency: str = Field(default="daily", description="تكرار التحديث")  # daily, weekly, monthly
    owner: str = Field(..., description="المسؤول عن المؤشر")
    category: str = Field(..., description="فئة المؤشر")
    is_active: bool = Field(default=True, description="نشط أم لا")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class KPIHistory(BaseModel):
    kpi_id: str = Field(..., description="معرف المؤشر")
    value: float = Field(..., description="القيمة")
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    period: str = Field(..., description="الفترة")
    metadata: Dict[str, Any] = Field(default={}, description="بيانات إضافية")

# Export Configuration
class ExportConfig(BaseModel):
    format: str = Field(..., description="صيغة التصدير")  # pdf, excel, csv, json
    include_charts: bool = Field(default=True, description="تضمين الرسوم البيانية")
    include_raw_data: bool = Field(default=False, description="تضمين البيانات الخام")
    template: Optional[str] = Field(None, description="قالب التصدير")
    branding: bool = Field(default=True, description="تضمين الهوية البصرية")
    password_protect: bool = Field(default=False, description="حماية بكلمة مرور")
    email_delivery: bool = Field(default=False, description="إرسال عبر البريد")
    recipients: List[str] = Field(default=[], description="المستلمون")

# Real-time Analytics
class RealTimeMetric(BaseModel):
    name: str = Field(..., description="اسم المقياس")
    value: Any = Field(..., description="القيمة")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    source: str = Field(..., description="المصدر")
    tags: Dict[str, str] = Field(default={}, description="العلامات")

class RealTimeDashboard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = Field(..., description="عنوان لوحة المعلومات")
    metrics: List[RealTimeMetric] = Field(default=[], description="المقاييس الفورية")
    refresh_interval: int = Field(default=30, description="فترة التحديث بالثواني")
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True, description="نشطة أم لا")

# Filters and Preferences
class AnalyticsFilter(BaseModel):
    field: str = Field(..., description="الحقل")
    operator: str = Field(..., description="المشغل")  # eq, ne, gt, lt, in, between
    value: Any = Field(..., description="القيمة")
    label: Optional[str] = Field(None, description="التسمية")

class AnalyticsPreferences(BaseModel):
    user_id: str = Field(..., description="معرف المستخدم")
    default_time_range: TimeRange = Field(default=TimeRange.THIS_MONTH)
    preferred_chart_types: List[ChartType] = Field(default=[], description="أنواع الرسوم المفضلة")
    custom_dashboards: List[str] = Field(default=[], description="لوحات المعلومات المخصصة")
    notification_preferences: Dict[str, bool] = Field(default={}, description="تفضيلات الإشعارات")
    export_preferences: ExportConfig = Field(default_factory=ExportConfig)
    updated_at: datetime = Field(default_factory=datetime.utcnow)