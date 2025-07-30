from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Warehouse Models
class Warehouse(BaseModel):
    """المخزن - Warehouse"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: Optional[str] = None
    address: str
    city: str
    region: str
    country: str = "Egypt"
    postal_code: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[str] = None
    capacity: Optional[float] = None
    current_occupancy: float = 0.0
    operating_hours: Optional[Dict[str, str]] = None
    warehouse_type: str = "main"
    temperature_controlled: bool = False
    security_level: str = "standard"
    insurance_info: Optional[Dict[str, Any]] = None
    certifications: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    updated_at: Optional[datetime] = None
    updated_by: Optional[str] = None

class WarehouseCreate(BaseModel):
    """إنشاء مخزن - Create Warehouse"""
    name: str
    code: str
    description: Optional[str] = None
    address: str
    city: str
    region: str
    postal_code: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    manager_id: Optional[str] = None
    capacity: Optional[float] = None
    warehouse_type: str = "main"
    temperature_controlled: bool = False
    security_level: str = "standard"
    operating_hours: Optional[Dict[str, str]] = None

# Product Models
class Product(BaseModel):
    """المنتج - Product"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float
    price_before_discount: float
    discount_percentage: float = 0.0
    category: str
    unit: str
    image: Optional[str] = None
    currency: str = "EGP"
    line: str  # line_1 or line_2
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    approved_by: Optional[str] = None

class ProductCreate(BaseModel):
    """إنشاء منتج - Create Product"""
    name: str
    description: Optional[str] = None
    price_before_discount: float
    discount_percentage: float = 0.0
    category: str
    unit: str
    image: Optional[str] = None
    line: str

# Inventory Models
class ProductStock(BaseModel):
    """مخزون المنتج - Product Stock"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    warehouse_id: str
    quantity: float
    reserved_quantity: float = 0.0
    available_quantity: float
    reorder_level: float = 0.0
    max_stock_level: float = 1000.0
    unit_cost: float
    total_value: float
    expiry_date: Optional[datetime] = None
    batch_number: Optional[str] = None
    supplier_id: Optional[str] = None
    location_in_warehouse: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

class StockMovement(BaseModel):
    """حركة المخزون - Stock Movement"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    warehouse_id: str
    product_id: str
    movement_type: str  # IN, OUT, TRANSFER, ADJUSTMENT
    quantity: float
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    from_warehouse_id: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

class StockMovementCreate(BaseModel):
    """إنشاء حركة مخزون - Create Stock Movement"""
    warehouse_id: str
    product_id: str
    movement_type: str
    quantity: float
    unit_cost: Optional[float] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    from_warehouse_id: Optional[str] = None
    to_warehouse_id: Optional[str] = None
    notes: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[datetime] = None