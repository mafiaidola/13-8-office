from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# System Models
class SystemSettings(BaseModel):
    """إعدادات النظام - System Settings"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logo_image: Optional[str] = None
    company_name: str = "نظام إدارة المناديب"
    primary_color: str = "#ff6b35"
    secondary_color: str = "#0ea5e9"
    available_themes: List[str] = ["dark", "light", "blue", "green", "purple"]
    default_theme: str = "dark"
    available_roles: List[str] = ["admin", "gm", "line_manager", "area_manager", "district_manager", "key_account", "medical_rep", "warehouse_keeper", "accounting"]
    role_permissions: Dict[str, List[str]] = {
        "admin": ["all"],
        "gm": ["all"],
        "line_manager": ["users.view", "visits.view", "doctors.approve", "orders.approve", "lines.manage"],
        "area_manager": ["users.view", "visits.view", "doctors.approve", "orders.approve", "areas.manage"],
        "district_manager": ["visits.view", "doctors.approve", "orders.approve", "districts.manage"],
        "key_account": ["visits.create", "doctors.create", "orders.create", "clinics.create"],
        "medical_rep": ["visits.create", "doctors.create", "orders.create", "clinics.create"],
        "warehouse_keeper": ["inventory.manage", "orders.fulfill"],
        "accounting": ["reports.view", "financial.view", "orders.approve"]
    }
    display_mode: str = "grid"
    language: str = "ar"
    notifications_enabled: bool = True
    chat_enabled: bool = False
    voice_notes_enabled: bool = True
    updated_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemLog(BaseModel):
    """سجل النظام - System Log"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    action: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class Notification(BaseModel):
    """الإشعار - Notification"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str  # SUCCESS, WARNING, ERROR, INFO, REMINDER
    recipient_id: str
    sender_id: Optional[str] = None
    is_read: bool = False
    data: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

class ApprovalRequest(BaseModel):
    """طلب الموافقة - Approval Request"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    entity_id: str
    entity_data: Dict[str, Any]
    
    # Approval hierarchy
    current_level: int = 1
    required_levels: List[int] = [3, 4, 5]
    
    # Approval history
    approvals: List[Dict[str, Any]] = []
    
    # Request details
    requested_by: str
    requested_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Current status
    status: str = "pending"
    current_approver_id: Optional[str] = None
    
    # Metadata
    notes: Optional[str] = None
    priority: str = "normal"
    due_date: Optional[datetime] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ApprovalAction(BaseModel):
    """إجراء الموافقة - Approval Action"""
    action: str  # approve, reject, request_changes
    notes: Optional[str] = None
    level: int
    user_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)