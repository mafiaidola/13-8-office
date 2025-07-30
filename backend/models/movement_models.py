from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Movement Log System Models
class MovementLog(BaseModel):
    """نظام سجل الحركة - Movement Log System"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    
    # Movement Basic Information
    movement_type: str  # "product_movement", "line_movement", "customer_movement"
    warehouse_id: str
    line: str  # line_1 or line_2
    
    # Product Movement
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    quantity_change: Optional[float] = None
    movement_reason: Optional[str] = None
    
    # Line Movement
    affected_products: List[str] = []
    line_operation: Optional[str] = None
    
    # Customer Movement
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_operation: Optional[str] = None
    order_id: Optional[str] = None
    visit_id: Optional[str] = None
    
    # Movement Details
    description: str
    reference_number: Optional[str] = None
    
    # Authorization & Audit
    created_by: str
    created_by_name: str
    created_by_role: str
    
    # Timestamps
    movement_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Additional metadata
    metadata: Dict[str, Any] = {}

class MovementLogCreate(BaseModel):
    """إنشاء سجل حركة جديد - Create Movement Log"""
    movement_type: str
    warehouse_id: str
    line: str
    
    # For product movement
    product_id: Optional[str] = None
    quantity_change: Optional[float] = None
    movement_reason: Optional[str] = None
    
    # For line movement
    affected_products: List[str] = []
    line_operation: Optional[str] = None
    
    # For customer movement
    customer_id: Optional[str] = None
    customer_operation: Optional[str] = None
    order_id: Optional[str] = None
    visit_id: Optional[str] = None
    
    description: str
    reference_number: Optional[str] = None
    metadata: Dict[str, Any] = {}

class MovementLogFilter(BaseModel):
    """فلترة سجل الحركة - Movement Log Filter"""
    warehouse_id: Optional[str] = None
    line: Optional[str] = None
    movement_type: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    product_id: Optional[str] = None
    customer_id: Optional[str] = None
    created_by: Optional[str] = None
    page: int = 1
    limit: int = 50