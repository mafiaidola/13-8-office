from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Organizational Structure Models
class Line(BaseModel):
    """خط الإنتاج - Production Line"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    line_manager_id: str
    coverage_areas: List[str] = []
    products: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Area(BaseModel):
    """المنطقة - Geographic Area"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    area_manager_id: str
    line_id: str
    districts: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class District(BaseModel):
    """المقاطعة - District"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    district_manager_id: str
    area_id: str
    key_accounts: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Region(BaseModel):
    """الإقليم - Region"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    boundaries: Optional[List[Dict[str, float]]] = None
    line: str  # line_1 or line_2
    districts: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str

# Create Models
class AreaCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[str] = None

class RegionCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    manager_id: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    boundaries: Optional[List[Dict[str, float]]] = None
    line: str

class DistrictCreate(BaseModel):
    name: str
    code: str
    region_id: str
    manager_id: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None
    boundaries: Optional[List[Dict[str, float]]] = None

class LineManagementCreate(BaseModel):
    line: str
    line_manager_id: str
    name: str
    description: Optional[str] = None
    regions: List[str] = []
    products: List[str] = []
    targets: Dict[str, float] = {}