from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Core User Models
class UserRole:
    """نظام الأدوار الموحد - Unified Role System"""
    # Hierarchical Roles - الأدوار الهرمية
    ADMIN = "admin"                    # Level 7 - Full system control
    GM = "gm"                         # Level 6 - General Manager
    LINE_MANAGER = "line_manager"     # Level 5 - Line Manager
    AREA_MANAGER = "area_manager"     # Level 4 - Area Manager
    DISTRICT_MANAGER = "district_manager"  # Level 3 - District Manager
    KEY_ACCOUNT = "key_account"       # Level 2 - Key Account Manager
    MEDICAL_REP = "medical_rep"       # Level 1 - Medical Representative (unified with sales_rep)
    
    # Special Functional Roles
    WAREHOUSE_KEEPER = "warehouse_keeper"
    ACCOUNTING = "accounting"
    
    # Role hierarchy for permissions
    ROLE_HIERARCHY = {
        "admin": 7,
        "gm": 6,
        "line_manager": 5,
        "area_manager": 4,
        "district_manager": 3,
        "key_account": 2,
        "medical_rep": 1,
        "warehouse_keeper": 3,
        "accounting": 3
    }
    
    @staticmethod
    def normalize_role(role):
        """Normalize legacy roles to new unified system"""
        if role == "sales_rep":
            return "medical_rep"
        return role
    
    @staticmethod
    def can_manage(manager_role: str, target_role: str) -> bool:
        """Check if manager_role can manage target_role"""
        manager_level = UserRole.ROLE_HIERARCHY.get(manager_role, 0)
        target_level = UserRole.ROLE_HIERARCHY.get(target_role, 0)
        return manager_level > target_level

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    role: str
    full_name: str
    phone: Optional[str] = None
    photo: Optional[str] = None  # Base64 encoded image
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None
    managed_by: Optional[str] = None
    permissions: List[str] = []
    region_id: Optional[str] = None
    district_id: Optional[str] = None
    line: Optional[str] = None  # line_1 or line_2
    area_id: Optional[str] = None
    target_amount: Optional[float] = None
    last_login: Optional[datetime] = None
    login_count: int = 0
    address: Optional[str] = None
    national_id: Optional[str] = None
    hire_date: Optional[str] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    full_name: str
    phone: Optional[str] = None
    managed_by: Optional[str] = None
    region_id: Optional[str] = None
    district_id: Optional[str] = None
    address: Optional[str] = None
    national_id: Optional[str] = None
    hire_date: Optional[str] = None
    profile_photo: Optional[str] = None
    is_active: bool = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    region_id: Optional[str] = None
    address: Optional[str] = None
    national_id: Optional[str] = None
    hire_date: Optional[str] = None
    profile_photo: Optional[str] = None
    is_active: Optional[bool] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserPerformanceStats(BaseModel):
    """إحصائيات أداء المستخدم"""
    user_id: str
    month: str  # YYYY-MM format
    total_visits: int = 0
    successful_visits: int = 0
    total_orders: int = 0
    total_order_value: float = 0.0
    average_order_value: float = 0.0
    new_clinics_registered: int = 0
    performance_score: float = 0.0
    ranking: Optional[int] = None
    calculated_at: datetime = Field(default_factory=datetime.utcnow)