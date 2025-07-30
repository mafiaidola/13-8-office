from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime

# Financial Models
class Invoice(BaseModel):
    """الفاتورة - Invoice"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    clinic_id: str
    clinic_name: str
    order_id: Optional[str] = None
    
    # Amount details
    subtotal: float
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total_amount: float
    
    # Payment status - كل فاتورة تبدأ كمديونية
    payment_status: str = "pending"  # pending, paid, partially_paid, overdue
    paid_amount: float = 0.0
    outstanding_amount: float
    
    # Important dates
    issue_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: datetime
    payment_date: Optional[datetime] = None
    
    # Payment info
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    payment_notes: Optional[str] = None
    paid_by_user_id: Optional[str] = None
    
    # Creation info
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Items
    items: List[Dict] = []

    def __init__(self, **data):
        super().__init__(**data)
        if not hasattr(self, 'outstanding_amount') or self.outstanding_amount is None:
            self.outstanding_amount = self.total_amount - self.paid_amount

class PaymentRecord(BaseModel):
    """سجل دفعة - Payment Record"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_id: str
    amount: float
    payment_method: str  # cash, bank_transfer, check, card
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    processed_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InvoiceItem(BaseModel):
    """عنصر الفاتورة - Invoice Item"""
    product_id: str
    product_name: str
    quantity: int
    unit_price: float
    price_tier: str
    discount_percentage: float = 0.0
    cashback_amount: float = 0.0
    total: float

class ClinicDebt(BaseModel):
    """مديونية العيادة - Clinic Debt"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_id: str
    invoice_id: str
    amount: float
    due_date: datetime
    status: str = "pending"
    payment_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str