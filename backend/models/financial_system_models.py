#!/usr/bin/env python3
"""
Invoice and Debt Management Models
نماذج إدارة الفواتير والديون

This module defines the data models for the invoice and debt collection system
هذا الملف يحدد نماذج البيانات لنظام الفواتير وتحصيل الديون
"""

from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

# Enums for status tracking
class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CONVERTED_TO_DEBT = "converted_to_debt"
    CANCELLED = "cancelled"

class DebtStatus(str, Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_COLLECTION = "in_collection"
    PARTIALLY_COLLECTED = "partially_collected"
    FULLY_COLLECTED = "fully_collected"
    OVERDUE = "overdue"
    WRITTEN_OFF = "written_off"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CREDIT_CARD = "credit_card"
    CHECK = "check"
    DIGITAL_WALLET = "digital_wallet"

# Invoice Item Model
class InvoiceItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    product_name: str
    product_code: Optional[str] = None
    description: Optional[str] = None
    quantity: float = Field(gt=0)
    unit_price: float = Field(ge=0)
    unit: str = "piece"
    discount_percentage: float = Field(default=0, ge=0, le=100)
    discount_amount: float = Field(default=0, ge=0)
    tax_percentage: float = Field(default=0, ge=0, le=100)
    tax_amount: float = Field(default=0, ge=0)
    subtotal: float = Field(ge=0)
    total: float = Field(ge=0)

    @validator('subtotal', always=True)
    def calculate_subtotal(cls, v, values):
        quantity = values.get('quantity', 0)
        unit_price = values.get('unit_price', 0)
        discount_amount = values.get('discount_amount', 0)
        return (quantity * unit_price) - discount_amount

    @validator('total', always=True)
    def calculate_total(cls, v, values):
        subtotal = values.get('subtotal', 0)
        tax_amount = values.get('tax_amount', 0)
        return subtotal + tax_amount

# Invoice Model
class Invoice(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    invoice_number: str
    clinic_id: str
    clinic_name: str
    doctor_name: str
    clinic_address: Optional[str] = None
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    
    # Sales representative information
    sales_rep_id: str
    sales_rep_name: str
    line_id: Optional[str] = None
    area_id: Optional[str] = None
    
    # Invoice details
    items: List[InvoiceItem]
    subtotal: float = Field(ge=0)
    discount_percentage: float = Field(default=0, ge=0, le=100)
    discount_amount: float = Field(default=0, ge=0)
    tax_percentage: float = Field(default=0, ge=0, le=100)
    tax_amount: float = Field(default=0, ge=0)
    total_amount: float = Field(ge=0)
    
    # Status and workflow
    status: InvoiceStatus = InvoiceStatus.DRAFT
    priority: str = Field(default="normal")  # low, normal, high, urgent
    
    # Dates
    invoice_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None
    converted_to_debt_at: Optional[datetime] = None
    
    # Audit trail
    created_by: str
    approved_by: Optional[str] = None
    notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Payment terms
    payment_terms: str = Field(default="net_30")  # immediate, net_15, net_30, net_60
    
    # Additional fields
    reference_number: Optional[str] = None
    purchase_order_number: Optional[str] = None
    currency: str = Field(default="EGP")
    exchange_rate: float = Field(default=1.0)
    
    class Config:
        use_enum_values = True

    @validator('total_amount', always=True)
    def calculate_total_amount(cls, v, values):
        subtotal = values.get('subtotal', 0)
        discount_amount = values.get('discount_amount', 0)
        tax_amount = values.get('tax_amount', 0)
        return subtotal - discount_amount + tax_amount

# Payment Record Model
class PaymentRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    collected_by: str
    verified_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True

# Debt Model
class Debt(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    debt_number: str
    
    # Original invoice reference
    invoice_id: str
    invoice_number: str
    
    # Clinic information
    clinic_id: str
    clinic_name: str
    doctor_name: str
    clinic_address: Optional[str] = None
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    
    # Sales representative assigned to collect
    assigned_to_id: str
    assigned_to_name: str
    line_id: Optional[str] = None
    area_id: Optional[str] = None
    
    # Financial details
    original_amount: float = Field(gt=0)
    remaining_amount: float = Field(ge=0)
    paid_amount: float = Field(default=0, ge=0)
    late_fees: float = Field(default=0, ge=0)
    total_due: float = Field(ge=0)
    
    # Status and priority
    status: DebtStatus = DebtStatus.PENDING
    priority: str = Field(default="normal")  # low, normal, high, urgent
    
    # Important dates
    original_due_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_at: Optional[datetime] = None
    last_contact_date: Optional[datetime] = None
    expected_payment_date: Optional[datetime] = None
    
    # Collection information
    collection_attempts: int = Field(default=0, ge=0)
    last_payment_date: Optional[datetime] = None
    payment_history: List[PaymentRecord] = []
    
    # Audit and notes
    created_by: str
    assigned_by: Optional[str] = None
    collection_notes: Optional[str] = None
    internal_notes: Optional[str] = None
    
    # Aging information
    days_overdue: int = Field(default=0, ge=0)
    aging_category: str = Field(default="current")  # current, 1-30, 31-60, 61-90, 90+
    
    class Config:
        use_enum_values = True

    @validator('total_due', always=True)
    def calculate_total_due(cls, v, values):
        remaining = values.get('remaining_amount', 0)
        late_fees = values.get('late_fees', 0)
        return remaining + late_fees

    @validator('remaining_amount', always=True)
    def calculate_remaining_amount(cls, v, values):
        original = values.get('original_amount', 0)
        paid = values.get('paid_amount', 0)
        return max(0, original - paid)

# Request/Response Models for API
class CreateInvoiceRequest(BaseModel):
    clinic_id: str
    clinic_name: str
    doctor_name: str
    clinic_address: Optional[str] = None
    clinic_phone: Optional[str] = None
    clinic_email: Optional[str] = None
    sales_rep_id: str
    sales_rep_name: str
    line_id: Optional[str] = None
    area_id: Optional[str] = None
    items: List[Dict]
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    payment_terms: str = Field(default="net_30")

class UpdateInvoiceRequest(BaseModel):
    items: Optional[List[Dict]] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[InvoiceStatus] = None

class ApproveInvoiceRequest(BaseModel):
    approved_by: str
    approval_notes: Optional[str] = None
    convert_to_debt: bool = Field(default=True)

class CreateDebtRequest(BaseModel):
    invoice_id: str
    assigned_to_id: str
    assigned_to_name: str
    priority: str = Field(default="normal")
    expected_payment_date: Optional[datetime] = None
    collection_notes: Optional[str] = None

class RecordPaymentRequest(BaseModel):
    debt_id: str
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    payment_date: Optional[datetime] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    collected_by: str

class DebtAssignmentRequest(BaseModel):
    debt_id: str
    assigned_to_id: str
    assigned_to_name: str
    priority: Optional[str] = None
    notes: Optional[str] = None

# Statistics and Analytics Models
class InvoiceStatistics(BaseModel):
    total_invoices: int = 0
    draft_invoices: int = 0
    pending_invoices: int = 0
    approved_invoices: int = 0
    rejected_invoices: int = 0
    total_value: float = 0
    average_value: float = 0
    overdue_invoices: int = 0
    
class DebtStatistics(BaseModel):
    total_debts: int = 0
    pending_debts: int = 0
    in_collection_debts: int = 0
    overdue_debts: int = 0
    total_outstanding: float = 0
    total_collected: float = 0
    collection_rate: float = 0
    average_collection_time: float = 0

class FinancialSummary(BaseModel):
    invoice_stats: InvoiceStatistics
    debt_stats: DebtStatistics
    total_receivables: float = 0
    monthly_revenue: float = 0
    collection_efficiency: float = 0
    top_performing_reps: List[Dict] = []
    aging_analysis: Dict[str, float] = {}

# Export all models
__all__ = [
    'InvoiceStatus', 'DebtStatus', 'PaymentStatus', 'PaymentMethod',
    'InvoiceItem', 'Invoice', 'PaymentRecord', 'Debt',
    'CreateInvoiceRequest', 'UpdateInvoiceRequest', 'ApproveInvoiceRequest',
    'CreateDebtRequest', 'RecordPaymentRequest', 'DebtAssignmentRequest',
    'InvoiceStatistics', 'DebtStatistics', 'FinancialSummary'
]