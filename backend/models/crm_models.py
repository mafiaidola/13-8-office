# CRM System Models - نماذج نظام إدارة العلاقات مع العملاء
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from enum import Enum

class InteractionType(str, Enum):
    VISIT = "visit"                    # زيارة
    PHONE_CALL = "phone_call"         # مكالمة هاتفية
    EMAIL = "email"                   # بريد إلكتروني
    MEETING = "meeting"               # اجتماع
    ORDER = "order"                   # طلب
    COMPLAINT = "complaint"           # شكوى
    FOLLOW_UP = "follow_up"           # متابعة
    PRESENTATION = "presentation"     # عرض تقديمي
    NEGOTIATION = "negotiation"       # تفاوض
    CONTRACT = "contract"             # عقد

class InteractionStatus(str, Enum):
    PLANNED = "planned"               # مخطط
    COMPLETED = "completed"           # مكتمل
    CANCELLED = "cancelled"           # ملغي
    RESCHEDULED = "rescheduled"       # معاد جدولته
    IN_PROGRESS = "in_progress"       # قيد التنفيذ

class ClientPriority(str, Enum):
    LOW = "low"                       # منخفضة
    MEDIUM = "medium"                 # متوسطة
    HIGH = "high"                     # عالية
    VIP = "vip"                       # VIP
    STRATEGIC = "strategic"           # استراتيجي

class ClientStatus(str, Enum):
    LEAD = "lead"                     # عميل محتمل
    PROSPECT = "prospect"             # احتمالية عالية
    ACTIVE = "active"                 # نشط
    INACTIVE = "inactive"             # غير نشط
    LOST = "lost"                     # مفقود
    BLACKLISTED = "blacklisted"       # قائمة سوداء

class FollowUpPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Client Interaction Record
class ClientInteraction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str = Field(..., description="معرف العميل (عيادة)")
    client_name: str = Field(..., description="اسم العميل")
    rep_id: str = Field(..., description="معرف المندوب")
    rep_name: str = Field(..., description="اسم المندوب")
    
    interaction_type: InteractionType = Field(..., description="نوع التفاعل")
    status: InteractionStatus = Field(default=InteractionStatus.PLANNED)
    
    title: str = Field(..., description="عنوان التفاعل")
    description: Optional[str] = Field(None, description="وصف التفاعل")
    notes: Optional[str] = Field(None, description="ملاحظات")
    
    scheduled_date: datetime = Field(..., description="التاريخ المخطط")
    actual_date: Optional[datetime] = Field(None, description="التاريخ الفعلي")
    duration: Optional[int] = Field(None, description="المدة بالدقائق")
    
    location: Optional[str] = Field(None, description="الموقع")
    participants: List[str] = Field(default=[], description="المشاركون")
    
    outcome: Optional[str] = Field(None, description="النتيجة")
    next_action: Optional[str] = Field(None, description="الإجراء التالي")
    follow_up_date: Optional[datetime] = Field(None, description="تاريخ المتابعة")
    
    attachments: List[str] = Field(default=[], description="المرفقات")
    tags: List[str] = Field(default=[], description="العلامات")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Related records
    related_order_id: Optional[str] = Field(None)
    related_visit_id: Optional[str] = Field(None)
    related_complaint_id: Optional[str] = Field(None)
    
    class Config:
        use_enum_values = True

class ClientInteractionCreate(BaseModel):
    client_id: str
    interaction_type: InteractionType
    title: str
    description: Optional[str] = None
    notes: Optional[str] = None
    scheduled_date: datetime
    duration: Optional[int] = None
    location: Optional[str] = None
    participants: List[str] = []
    tags: List[str] = []

# Client Profile Enhancement
class ClientProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_id: str = Field(..., description="معرف العيادة")
    
    # Basic Information
    priority: ClientPriority = Field(default=ClientPriority.MEDIUM)
    status: ClientStatus = Field(default=ClientStatus.LEAD)
    category: Optional[str] = Field(None, description="فئة العميل")
    
    # Relationship Details
    assigned_rep_id: str = Field(..., description="المندوب المسؤول")
    backup_rep_id: Optional[str] = Field(None, description="المندوب الاحتياطي")
    account_manager_id: Optional[str] = Field(None, description="مدير الحساب")
    
    # Preferences
    preferred_contact_method: str = Field(default="phone", description="طريقة التواصل المفضلة")
    preferred_visit_time: Optional[str] = Field(None, description="وقت الزيارة المفضل")
    communication_language: str = Field(default="ar", description="لغة التواصل")
    
    # Business Information
    monthly_potential: Optional[float] = Field(None, description="الإمكانات الشهرية")
    annual_value: Optional[float] = Field(None, description="القيمة السنوية")
    payment_terms: Optional[str] = Field(None, description="شروط الدفع")
    credit_limit: Optional[float] = Field(None, description="حد الائتمان")
    
    # Interaction Summary
    total_interactions: int = Field(default=0)
    last_interaction_date: Optional[datetime] = Field(None)
    last_interaction_type: Optional[str] = Field(None)
    next_scheduled_interaction: Optional[datetime] = Field(None)
    
    # Performance Metrics
    total_orders: int = Field(default=0)
    total_order_value: float = Field(default=0.0)
    average_order_value: float = Field(default=0.0)
    last_order_date: Optional[datetime] = Field(None)
    
    # Satisfaction & Feedback
    satisfaction_score: Optional[float] = Field(None, ge=1, le=5, description="نقاط الرضا 1-5")
    feedback_notes: Optional[str] = Field(None, description="ملاحظات التغذية الراجعة")
    
    # Additional Data
    tags: List[str] = Field(default=[], description="العلامات")
    custom_fields: Dict[str, Any] = Field(default={}, description="حقول مخصصة")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

# Follow-up Task Management
class FollowUpTask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str = Field(..., description="معرف العميل")
    assigned_to: str = Field(..., description="مخصص إلى")
    created_by: str = Field(..., description="منشئ المهمة")
    
    title: str = Field(..., description="عنوان المهمة")
    description: Optional[str] = Field(None, description="وصف المهمة")
    priority: FollowUpPriority = Field(default=FollowUpPriority.MEDIUM)
    
    due_date: datetime = Field(..., description="تاريخ الاستحقاق")
    reminder_date: Optional[datetime] = Field(None, description="تاريخ التذكير")
    
    status: str = Field(default="pending", description="الحالة")
    completion_notes: Optional[str] = Field(None, description="ملاحظات الإنجاز")
    completed_at: Optional[datetime] = Field(None)
    
    related_interaction_id: Optional[str] = Field(None)
    tags: List[str] = Field(default=[])
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

# Client Communication History
class CommunicationRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_id: str = Field(..., description="معرف العميل")
    rep_id: str = Field(..., description="معرف المندوب")
    
    method: str = Field(..., description="طريقة التواصل")  # phone, email, whatsapp, sms
    direction: str = Field(..., description="الاتجاه")  # inbound, outbound
    
    subject: Optional[str] = Field(None, description="الموضوع")
    content: str = Field(..., description="المحتوى")
    
    duration: Optional[int] = Field(None, description="المدة (للمكالمات)")
    read_status: bool = Field(default=False, description="حالة القراءة")
    
    attachments: List[str] = Field(default=[], description="المرفقات")
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        use_enum_values = True

# Client Analytics Summary
class ClientAnalytics(BaseModel):
    client_id: str
    client_name: str
    
    # Interaction Analytics
    total_interactions: int = 0
    interactions_this_month: int = 0
    interactions_last_month: int = 0
    interaction_frequency: float = 0.0  # per month
    
    # Visit Analytics
    total_visits: int = 0
    successful_visits: int = 0
    visit_success_rate: float = 0.0
    last_visit_date: Optional[datetime] = None
    days_since_last_visit: Optional[int] = None
    
    # Order Analytics
    total_orders: int = 0
    total_order_value: float = 0.0
    average_order_value: float = 0.0
    orders_this_month: int = 0
    order_frequency: float = 0.0  # per month
    
    # Communication Analytics
    total_communications: int = 0
    response_rate: float = 0.0
    average_response_time: Optional[float] = None  # hours
    
    # Relationship Health Score
    health_score: float = 0.0  # 0-100
    health_trend: str = "stable"  # improving, declining, stable
    
    # Recommendations
    recommendations: List[str] = []
    next_best_action: Optional[str] = None
    
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# CRM Dashboard Summary
class CRMDashboard(BaseModel):
    total_clients: int = 0
    active_clients: int = 0
    new_clients_this_month: int = 0
    
    # Interaction Summary
    total_interactions_this_month: int = 0
    pending_follow_ups: int = 0
    overdue_tasks: int = 0
    
    # Performance Metrics
    average_client_value: float = 0.0
    total_pipeline_value: float = 0.0
    conversion_rate: float = 0.0
    
    # Top Performing Clients
    top_clients: List[Dict[str, Any]] = []
    at_risk_clients: List[Dict[str, Any]] = []
    
    # Upcoming Activities
    upcoming_visits: List[Dict[str, Any]] = []
    upcoming_follow_ups: List[Dict[str, Any]] = []

# Bulk Operations
class BulkClientUpdate(BaseModel):
    client_ids: List[str]
    updates: Dict[str, Any]
    update_reason: Optional[str] = None

class ClientSearchFilter(BaseModel):
    status: Optional[ClientStatus] = None
    priority: Optional[ClientPriority] = None
    assigned_rep_id: Optional[str] = None
    category: Optional[str] = None
    last_interaction_days: Optional[int] = None
    order_value_min: Optional[float] = None
    order_value_max: Optional[float] = None
    search_text: Optional[str] = None
    tags: List[str] = []
    limit: int = Field(default=50, le=200)
    offset: int = Field(default=0, ge=0)