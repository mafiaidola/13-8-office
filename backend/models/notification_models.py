# Notification System Models - نماذج نظام الإشعارات المتقدم
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from enum import Enum

class NotificationType(str, Enum):
    ORDER_NEW = "order_new"           # طلب جديد
    ORDER_APPROVED = "order_approved" # طلب موافق عليه
    ORDER_REJECTED = "order_rejected" # طلب مرفوض
    DEBT_WARNING = "debt_warning"     # تحذير مديونية
    DEBT_CRITICAL = "debt_critical"   # مديونية حرجة
    VISIT_REMINDER = "visit_reminder" # تذكير زيارة
    VISIT_OVERDUE = "visit_overdue"   # زيارة متأخرة
    STOCK_LOW = "stock_low"           # مخزون منخفض
    STOCK_OUT = "stock_out"           # نفاد المخزون
    APPROVAL_PENDING = "approval_pending" # موافقة معلقة
    TASK_ASSIGNED = "task_assigned"   # مهمة مخصصة
    TASK_COMPLETED = "task_completed" # مهمة مكتملة
    SYSTEM_ALERT = "system_alert"     # تنبيه نظام
    PERFORMANCE_ALERT = "performance_alert" # تنبيه أداء

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationStatus(str, Enum):
    UNREAD = "unread"
    READ = "read"
    DISMISSED = "dismissed"
    ARCHIVED = "archived"

class NotificationBase(BaseModel):
    title: str = Field(..., description="عنوان الإشعار")
    message: str = Field(..., description="محتوى الإشعار")
    type: NotificationType = Field(..., description="نوع الإشعار")
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM, description="أولوية الإشعار")
    recipient_id: str = Field(..., description="معرف المستلم")
    recipient_role: Optional[str] = Field(None, description="دور المستلم")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="بيانات إضافية")
    action_url: Optional[str] = Field(None, description="رابط الإجراء")
    expires_at: Optional[datetime] = Field(None, description="تاريخ انتهاء الإشعار")

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: NotificationStatus = Field(default=NotificationStatus.UNREAD)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: Optional[datetime] = Field(None)
    dismissed_at: Optional[datetime] = Field(None)
    created_by: Optional[str] = Field(None, description="منشئ الإشعار")
    
    class Config:
        use_enum_values = True

class NotificationSettings(BaseModel):
    user_id: str = Field(..., description="معرف المستخدم")
    email_notifications: bool = Field(default=True, description="إشعارات البريد الإلكتروني")
    push_notifications: bool = Field(default=True, description="الإشعارات المنبثقة")
    sms_notifications: bool = Field(default=False, description="إشعارات SMS")
    notification_types: List[NotificationType] = Field(default=[], description="أنواع الإشعارات المفعلة")
    quiet_hours_start: Optional[int] = Field(None, ge=0, le=23, description="بداية ساعات الهدوء")
    quiet_hours_end: Optional[int] = Field(None, ge=0, le=23, description="نهاية ساعات الهدوء")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class NotificationRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="اسم القاعدة")
    description: Optional[str] = Field(None, description="وصف القاعدة")
    type: NotificationType = Field(..., description="نوع الإشعار")
    conditions: Dict[str, Any] = Field(default={}, description="شروط الإشعار")
    recipients: List[str] = Field(default=[], description="قائمة المستلمين")
    recipient_roles: List[str] = Field(default=[], description="أدوار المستلمين")
    template: str = Field(..., description="قالب الإشعار")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(..., description="منشئ القاعدة")

class NotificationTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., description="اسم القالب")
    type: NotificationType = Field(..., description="نوع الإشعار")
    title_template: str = Field(..., description="قالب العنوان")
    message_template: str = Field(..., description="قالب الرسالة")
    variables: List[str] = Field(default=[], description="المتغيرات المستخدمة")
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Real-time Notification for WebSocket
class RealTimeNotification(BaseModel):
    notification_id: str
    type: NotificationType
    title: str
    message: str
    priority: NotificationPriority
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = {}

# Notification Statistics
class NotificationStats(BaseModel):
    total_notifications: int = 0
    unread_count: int = 0
    read_count: int = 0
    dismissed_count: int = 0
    by_type: Dict[str, int] = {}
    by_priority: Dict[str, int] = {}
    recent_notifications: List[Notification] = []

# Bulk Notification Operations
class BulkNotificationCreate(BaseModel):
    recipients: List[str] = Field(..., description="قائمة المستلمين")
    recipient_roles: Optional[List[str]] = Field(None, description="أدوار المستلمين")
    title: str = Field(..., description="عنوان الإشعار")
    message: str = Field(..., description="محتوى الإشعار")
    type: NotificationType = Field(..., description="نوع الإشعار")
    priority: NotificationPriority = Field(default=NotificationPriority.MEDIUM)
    metadata: Optional[Dict[str, Any]] = Field(default={})
    action_url: Optional[str] = Field(None)

class NotificationFilter(BaseModel):
    status: Optional[NotificationStatus] = None
    type: Optional[NotificationType] = None
    priority: Optional[NotificationPriority] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    search: Optional[str] = None
    limit: int = Field(default=50, le=200)
    offset: int = Field(default=0, ge=0)