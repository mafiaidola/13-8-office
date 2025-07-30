from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Technical Support System Models
class SupportTicket(BaseModel):
    """تذكرة الدعم الفني - Support Ticket"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_number: str = Field(default_factory=lambda: f"TICKET-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}")
    
    # Sender information
    sender_name: str
    sender_position: str
    sender_whatsapp: str
    sender_email: Optional[str] = None
    
    # Problem details
    problem_description: str
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "general"  # general, technical, account, billing, feature_request
    
    # Ticket status
    status: str = "open"  # open, in_progress, resolved, closed
    assigned_to: Optional[str] = None
    assigned_to_name: Optional[str] = None
    
    # Important dates
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    
    # Responses and follow-up
    responses: List[Dict[str, Any]] = []
    internal_notes: List[Dict[str, Any]] = []
    
    # Additional info
    attachment_urls: List[str] = []
    satisfaction_rating: Optional[int] = None
    resolution_summary: Optional[str] = None

class SupportTicketCreate(BaseModel):
    """إنشاء تذكرة دعم فني جديدة - Create Support Ticket"""
    sender_name: str
    sender_position: str
    sender_whatsapp: str
    sender_email: Optional[str] = None
    problem_description: str
    priority: str = "medium"
    category: str = "general"

class SupportTicketUpdate(BaseModel):
    """تحديث تذكرة الدعم الفني - Update Support Ticket"""
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    resolution_summary: Optional[str] = None

class SupportResponse(BaseModel):
    """رد على تذكرة الدعم الفني - Support Response"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    ticket_id: str
    response_text: str
    responder_id: str
    responder_name: str
    responder_role: str
    response_type: str = "public"  # public, internal
    created_at: datetime = Field(default_factory=datetime.utcnow)
    attachments: List[str] = []