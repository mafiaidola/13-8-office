from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Clinic Models
class ClinicClassification:
    """تصنيف العيادات"""
    NEW = "new"          # جيدة - أخضر
    PREMIUM = "premium"  # مميزة - ذهبي  
    DEBT = "debt"        # مديونية - أحمر

class Clinic(BaseModel):
    """العيادة - Clinic"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    email: Optional[str] = None
    
    # Classification system
    classification: str = ClinicClassification.NEW
    classification_notes: Optional[str] = None
    classification_updated_at: Optional[datetime] = None
    classification_updated_by: Optional[str] = None
    
    # Statistics
    total_visits: int = 0
    total_orders: int = 0
    total_revenue: float = 0.0
    outstanding_debt: float = 0.0
    last_visit_date: Optional[datetime] = None
    last_order_date: Optional[datetime] = None
    
    # Assignment
    assigned_rep_id: Optional[str] = None
    assigned_rep_name: Optional[str] = None
    assigned_rep_role: Optional[str] = None
    area_id: Optional[str] = None
    line: Optional[str] = None
    
    # Status
    status: str = "approved"
    added_by: str
    approved_by: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    classification: str = "new"
    area_id: Optional[str] = None
    line: Optional[str] = None

class ClinicRequest(BaseModel):
    """طلب تسجيل عيادة - Clinic Registration Request"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_name: str
    clinic_phone: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_address: str
    latitude: float
    longitude: float
    address: str
    clinic_image: Optional[str] = None
    notes: str
    sales_rep_id: str
    status: str = "PENDING"
    reviewed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicRequestCreate(BaseModel):
    clinic_name: str
    clinic_phone: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_address: str
    clinic_latitude: Optional[float] = None
    clinic_longitude: Optional[float] = None
    address: str
    clinic_image: Optional[str] = None
    notes: str
    rep_current_latitude: Optional[float] = None
    rep_current_longitude: Optional[float] = None
    rep_location_timestamp: Optional[str] = None
    rep_location_accuracy: Optional[float] = None
    registration_type: Optional[str] = "field_registration"
    device_info: Optional[str] = ""

# Doctor Models
class Doctor(BaseModel):
    """الطبيب - Doctor"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    clinic_id: str
    phone: Optional[str] = None
    email: Optional[str] = None
    added_by: str
    approved_by: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorCreate(BaseModel):
    name: str
    specialty: str
    clinic_id: str
    phone: Optional[str] = None
    email: Optional[str] = None