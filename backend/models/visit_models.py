from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Visit Models
class Visit(BaseModel):
    """الزيارة - Visit"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    
    # Visit Type Enhancement
    visit_type: str = "SOLO"  # SOLO, DUO_WITH_MANAGER, THREE_WITH_MANAGER_AND_OTHER
    
    # Manager Participation
    accompanying_manager_id: Optional[str] = None
    accompanying_manager_name: Optional[str] = None
    accompanying_manager_role: Optional[str] = None
    
    # Other Participant
    other_participant_id: Optional[str] = None
    other_participant_name: Optional[str] = None
    other_participant_role: Optional[str] = None
    
    # Visit details
    participants_count: int = 1
    participants_details: List[Dict[str, str]] = []
    
    date: datetime
    notes: str = ""
    latitude: float
    longitude: float
    effective: bool = True
    reviewed_by: Optional[str] = None
    review_status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VisitCreate(BaseModel):
    """إنشاء زيارة - Create Visit"""
    doctor_id: str
    clinic_id: str
    visit_type: str = "SOLO"
    accompanying_manager_id: Optional[str] = None
    other_participant_id: Optional[str] = None
    notes: str = ""
    latitude: float
    longitude: float
    effective: bool = True

# Voice Notes Model
class VoiceNote(BaseModel):
    """الملاحظة الصوتية - Voice Note"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visit_id: str
    audio_data: str  # base64 encoded audio
    duration: int  # in seconds
    transcript: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)