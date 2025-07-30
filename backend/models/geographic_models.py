"""
Geographic Models - Lines, Areas, and Districts Management
نماذج إدارة الخطوط والمناطق والمقاطعات الجغرافية
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import uuid


class LineBase(BaseModel):
    """نموذج الخط الأساسي"""
    name: str = Field(..., description="اسم الخط")
    name_en: str = Field(default="", description="اسم الخط بالإنجليزية")
    code: str = Field(..., description="رمز الخط")
    description: Optional[str] = Field(default="", description="وصف الخط")
    color: str = Field(default="#3B82F6", description="لون الخط على الخريطة")
    is_active: bool = Field(default=True, description="حالة النشاط")
    priority: int = Field(default=1, description="أولوية الخط")


class LineCreate(LineBase):
    """نموذج إنشاء خط جديد"""
    manager_id: Optional[str] = Field(default=None, description="معرف مدير الخط")
    assigned_products: List[str] = Field(default=[], description="قائمة معرفات المنتجات المخصصة للخط")
    coverage_areas: List[str] = Field(default=[], description="قائمة معرفات المناطق المغطاة")


class Line(LineBase):
    """نموذج الخط الكامل"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف الخط")
    manager_id: Optional[str] = Field(default=None, description="معرف مدير الخط")
    manager_name: Optional[str] = Field(default="", description="اسم مدير الخط")
    assigned_products: List[str] = Field(default=[], description="قائمة معرفات المنتجات المخصصة للخط")
    assigned_product_names: List[str] = Field(default=[], description="قائمة أسماء المنتجات المخصصة للخط")
    coverage_areas: List[str] = Field(default=[], description="قائمة معرفات المناطق المغطاة")
    coverage_area_names: List[str] = Field(default=[], description="قائمة أسماء المناطق المغطاة")
    total_sales_reps: int = Field(default=0, description="عدد المناديب المخصصين")
    monthly_target: float = Field(default=0.0, description="الهدف الشهري")
    current_achievement: float = Field(default=0.0, description="الإنجاز الحالي")
    achievement_percentage: float = Field(default=0.0, description="نسبة الإنجاز")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ الإنشاء")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ آخر تحديث")
    created_by: Optional[str] = Field(default=None, description="من أنشأ الخط")


class AreaBase(BaseModel):
    """نموذج المنطقة الأساسي"""
    name: str = Field(..., description="اسم المنطقة")
    name_en: str = Field(default="", description="اسم المنطقة بالإنجليزية")
    code: str = Field(..., description="رمز المنطقة")
    description: Optional[str] = Field(default="", description="وصف المنطقة")
    region_type: str = Field(default="urban", description="نوع المنطقة (urban, rural, industrial)")
    is_active: bool = Field(default=True, description="حالة النشاط")
    priority: int = Field(default=1, description="أولوية المنطقة")


class AreaCreate(AreaBase):
    """نموذج إنشاء منطقة جديدة"""
    parent_line_id: Optional[str] = Field(default=None, description="معرف الخط الرئيسي")
    manager_id: Optional[str] = Field(default=None, description="معرف مدير المنطقة")
    coordinates: Optional[Dict] = Field(default={}, description="إحداثيات المنطقة")


class Area(AreaBase):
    """نموذج المنطقة الكامل"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف المنطقة")
    parent_line_id: Optional[str] = Field(default=None, description="معرف الخط الرئيسي")
    parent_line_name: Optional[str] = Field(default="", description="اسم الخط الرئيسي")
    manager_id: Optional[str] = Field(default=None, description="معرف مدير المنطقة")
    manager_name: Optional[str] = Field(default="", description="اسم مدير المنطقة")
    coordinates: Optional[Dict] = Field(default={}, description="إحداثيات المنطقة")
    total_clinics: int = Field(default=0, description="عدد العيادات")
    total_visits: int = Field(default=0, description="عدد الزيارات")
    monthly_target: float = Field(default=0.0, description="الهدف الشهري")
    current_achievement: float = Field(default=0.0, description="الإنجاز الحالي")
    achievement_percentage: float = Field(default=0.0, description="نسبة الإنجاز")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ الإنشاء")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ آخر تحديث")
    created_by: Optional[str] = Field(default=None, description="من أنشأ المنطقة")


class DistrictBase(BaseModel):
    """نموذج المقاطعة الأساسي"""
    name: str = Field(..., description="اسم المقاطعة")
    name_en: str = Field(default="", description="اسم المقاطعة بالإنجليزية")
    code: str = Field(..., description="رمز المقاطعة")
    description: Optional[str] = Field(default="", description="وصف المقاطعة")
    is_active: bool = Field(default=True, description="حالة النشاط")


class DistrictCreate(DistrictBase):
    """نموذج إنشاء مقاطعة جديدة"""
    parent_area_id: Optional[str] = Field(default=None, description="معرف المنطقة الرئيسية")
    manager_id: Optional[str] = Field(default=None, description="معرف مدير المقاطعة")


class District(DistrictBase):
    """نموذج المقاطعة الكامل"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="معرف المقاطعة")
    parent_area_id: Optional[str] = Field(default=None, description="معرف المنطقة الرئيسية")
    parent_area_name: Optional[str] = Field(default="", description="اسم المنطقة الرئيسية")
    manager_id: Optional[str] = Field(default=None, description="معرف مدير المقاطعة")
    manager_name: Optional[str] = Field(default="", description="اسم مدير المقاطعة")
    total_clinics: int = Field(default=0, description="عدد العيادات")
    total_visits: int = Field(default=0, description="عدد الزيارات")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ الإنشاء")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ آخر تحديث")
    created_by: Optional[str] = Field(default=None, description="من أنشأ المقاطعة")


class LineProductAssignment(BaseModel):
    """نموذج تخصيص المنتجات للخط"""
    line_id: str = Field(..., description="معرف الخط")
    product_ids: List[str] = Field(..., description="قائمة معرفات المنتجات")
    assigned_by: str = Field(..., description="من قام بالتخصيص")
    assignment_date: datetime = Field(default_factory=datetime.utcnow, description="تاريخ التخصيص")
    notes: Optional[str] = Field(default="", description="ملاحظات")


class LineUserAssignment(BaseModel):
    """نموذج تخصيص المستخدمين للخط"""
    line_id: str = Field(..., description="معرف الخط")
    user_ids: List[str] = Field(..., description="قائمة معرفات المستخدمين")
    assigned_by: str = Field(..., description="من قام بالتخصيص")
    assignment_date: datetime = Field(default_factory=datetime.utcnow, description="تاريخ التخصيص")
    notes: Optional[str] = Field(default="", description="ملاحظات")


class GeographicStatistics(BaseModel):
    """إحصائيات جغرافية شاملة"""
    total_lines: int = Field(default=0, description="إجمالي الخطوط")
    active_lines: int = Field(default=0, description="الخطوط النشطة")
    total_areas: int = Field(default=0, description="إجمالي المناطق")
    active_areas: int = Field(default=0, description="المناطق النشطة")
    total_districts: int = Field(default=0, description="إجمالي المقاطعات")
    active_districts: int = Field(default=0, description="المقاطعات النشطة")
    total_assigned_products: int = Field(default=0, description="المنتجات المخصصة")
    total_coverage_clinics: int = Field(default=0, description="العيادات المغطاة")
    average_achievement_percentage: float = Field(default=0.0, description="متوسط نسبة الإنجاز")
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="تاريخ الإنتاج")