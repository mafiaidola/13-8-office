from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Order Models
class OrderEnhanced(BaseModel):
    """طلب محسن - Enhanced Order"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str = Field(default_factory=lambda: f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8]}")
    
    # Basic information
    medical_rep_id: str
    clinic_id: str
    warehouse_id: str
    
    # Order details
    items: List[Dict[str, Any]]
    subtotal: float
    tax_amount: float = 0
    discount_amount: float = 0
    total_amount: float
    
    # Debt Warning System
    clinic_debt_status: str = "clear"  # clear, warning, blocked
    clinic_debt_amount: float = 0.0
    debt_warning_shown: bool = False
    debt_override_reason: Optional[str] = None
    debt_override_by: Optional[str] = None
    
    # Order Color Classification
    order_color: str = "green"  # green, red, yellow
    
    # Approval system
    approval_request_id: Optional[str] = None
    approval_status: str = "pending"
    
    # Approval tracking
    district_manager_approval: Optional[Dict[str, Any]] = None
    area_manager_approval: Optional[Dict[str, Any]] = None
    accounting_approval: Optional[Dict[str, Any]] = None
    warehouse_approval: Optional[Dict[str, Any]] = None
    
    # Status
    status: str = "draft"  # draft, submitted, approved, fulfilled, cancelled
    line: Optional[str] = None
    area_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    """إنشاء طلب - Create Order"""
    clinic_id: str
    warehouse_id: str
    items: List[Dict[str, Any]]
    notes: Optional[str] = None
    line: Optional[str] = None
    area_id: Optional[str] = None
    # Location tracking
    rep_current_latitude: Optional[float] = None
    rep_current_longitude: Optional[float] = None
    rep_location_timestamp: Optional[str] = None
    rep_location_accuracy: Optional[float] = None
    target_clinic_latitude: Optional[float] = None
    target_clinic_longitude: Optional[float] = None
    # Additional info
    order_source: Optional[str] = "field_order"
    device_info: Optional[str] = ""
    # Debt warning system
    debt_warning_acknowledged: bool = False
    debt_override_reason: Optional[str] = None

class OrderItem(BaseModel):
    """عنصر الطلب - Order Item"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_price: float

class OrderWorkflow:
    """سير عمل الطلب - Order Workflow"""
    PENDING = "PENDING"
    MANAGER_APPROVED = "MANAGER_APPROVED"
    ACCOUNTING_APPROVED = "ACCOUNTING_APPROVED"
    WAREHOUSE_APPROVED = "WAREHOUSE_APPROVED"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

# Legacy Order Model for compatibility
class Order(BaseModel):
    """طلب تقليدي - Legacy Order"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visit_id: str
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    warehouse_id: str
    status: str
    order_type: str  # DEMO, SALE
    total_amount: float = 0.0
    approved_by: Optional[str] = None
    fulfilled_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None