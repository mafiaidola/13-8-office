#!/usr/bin/env python3
"""
Invoice Management Routes - نظام إدارة الفواتير
Comprehensive invoice system with full workflow support
نظام فواتير شامل مع دعم تدفق العمل الكامل
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid
import jwt
import os
from models.financial_system_models import (
    Invoice, InvoiceStatus, CreateInvoiceRequest, UpdateInvoiceRequest, 
    ApproveInvoiceRequest, InvoiceItem, InvoiceStatistics
)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Create router
router = APIRouter(prefix="/api", tags=["invoices"])

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_invoice_number() -> str:
    """Generate unique invoice number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    random_part = str(uuid.uuid4())[:8].upper()
    return f"INV-{timestamp}-{random_part}"

def calculate_invoice_totals(items: List[Dict]) -> Dict[str, float]:
    """Calculate invoice totals from items"""
    subtotal = 0
    total_tax = 0
    
    for item in items:
        quantity = float(item.get('quantity', 0))
        unit_price = float(item.get('unit_price', 0))
        discount = float(item.get('discount_amount', 0))
        tax = float(item.get('tax_amount', 0))
        
        item_subtotal = (quantity * unit_price) - discount
        subtotal += item_subtotal
        total_tax += tax
    
    return {
        'subtotal': subtotal,
        'tax_amount': total_tax,
        'total_amount': subtotal + total_tax
    }

@router.post("/invoices", response_model=Dict[str, Any])
async def create_invoice(
    invoice_data: CreateInvoiceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new invoice"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "sales_rep", "medical_rep"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to create invoices"
            )
        
        # Validate clinic exists
        clinic = await db.clinics.find_one({"id": invoice_data.clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="Clinic not found")
        
        # Validate sales representative
        sales_rep = await db.users.find_one({"id": invoice_data.sales_rep_id})
        if not sales_rep:
            raise HTTPException(status_code=404, detail="Sales representative not found")
        
        # Process and validate items
        processed_items = []
        for item_data in invoice_data.items:
            # Validate product exists
            product = await db.products.find_one({"id": item_data.get("product_id")})
            if not product:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Product {item_data.get('product_id')} not found"
                )
            
            # Create invoice item
            invoice_item = InvoiceItem(
                product_id=item_data["product_id"],
                product_name=product.get("name", item_data.get("product_name", "")),
                product_code=product.get("code", ""),
                quantity=float(item_data["quantity"]),
                unit_price=float(item_data.get("unit_price", product.get("price", 0))),
                unit=item_data.get("unit", product.get("unit", "piece")),
                discount_percentage=float(item_data.get("discount_percentage", 0)),
                discount_amount=float(item_data.get("discount_amount", 0)),
                tax_percentage=float(item_data.get("tax_percentage", 0)),
                tax_amount=float(item_data.get("tax_amount", 0)),
                description=item_data.get("description", "")
            )
            processed_items.append(invoice_item.dict())
        
        # Calculate totals
        totals = calculate_invoice_totals(processed_items)
        
        # Create invoice
        invoice_id = str(uuid.uuid4())
        invoice = Invoice(
            id=invoice_id,
            invoice_number=generate_invoice_number(),
            clinic_id=invoice_data.clinic_id,
            clinic_name=clinic.get("name", invoice_data.clinic_name),
            doctor_name=clinic.get("doctor_name", invoice_data.doctor_name),
            clinic_address=clinic.get("address", invoice_data.clinic_address),
            clinic_phone=clinic.get("phone", invoice_data.clinic_phone),
            clinic_email=clinic.get("email", invoice_data.clinic_email),
            sales_rep_id=invoice_data.sales_rep_id,
            sales_rep_name=sales_rep.get("full_name", invoice_data.sales_rep_name),
            line_id=sales_rep.get("line_id", invoice_data.line_id),
            area_id=sales_rep.get("area_id", invoice_data.area_id),
            items=processed_items,
            subtotal=totals['subtotal'],
            tax_amount=totals['tax_amount'],
            total_amount=totals['total_amount'],
            due_date=invoice_data.due_date or (datetime.utcnow() + timedelta(days=30)),
            created_by=current_user.get("user_id", "unknown"),
            notes=invoice_data.notes,
            payment_terms=invoice_data.payment_terms
        )
        
        # Save to database
        await db.invoices.insert_one(invoice.dict())
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "invoice_created",
            "description": f"Created invoice {invoice.invoice_number} for {invoice.clinic_name}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": invoice_id,
            "details": {
                "invoice_number": invoice.invoice_number,
                "clinic_name": invoice.clinic_name,
                "total_amount": invoice.total_amount
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "success": True,
            "message": "Invoice created successfully",
            "invoice": invoice.dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")

@router.get("/invoices", response_model=Dict[str, Any])
async def get_invoices(
    status: Optional[str] = Query(None, description="Filter by status"),
    clinic_id: Optional[str] = Query(None, description="Filter by clinic"),
    sales_rep_id: Optional[str] = Query(None, description="Filter by sales rep"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get invoices with filtering options"""
    try:
        # Build filter query
        filter_query = {}
        
        # Role-based access control
        if current_user.get("role") in ["sales_rep", "medical_rep"]:
            filter_query["sales_rep_id"] = current_user.get("user_id")
        elif current_user.get("role") == "line_manager":
            filter_query["line_id"] = current_user.get("line_id")
        
        # Apply filters
        if status:
            filter_query["status"] = status
        if clinic_id:
            filter_query["clinic_id"] = clinic_id
        if sales_rep_id and current_user.get("role") in ["admin", "gm"]:
            filter_query["sales_rep_id"] = sales_rep_id
        
        # Date range filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date)
        if date_filter:
            filter_query["invoice_date"] = date_filter
        
        # Get invoices
        cursor = db.invoices.find(filter_query, {"_id": 0}).sort("invoice_date", -1)
        invoices = await cursor.skip(skip).limit(limit).to_list(length=limit)
        
        # Get total count
        total_count = await db.invoices.count_documents(filter_query)
        
        return {
            "success": True,
            "invoices": invoices,
            "total_count": total_count,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invoices: {str(e)}")

@router.get("/invoices/{invoice_id}", response_model=Dict[str, Any])
async def get_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get invoice by ID"""
    try:
        # Find invoice
        invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check permissions
        if (current_user.get("role") in ["sales_rep", "medical_rep"] and 
            invoice["sales_rep_id"] != current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "invoice": invoice
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invoice: {str(e)}")

@router.put("/invoices/{invoice_id}", response_model=Dict[str, Any])
async def update_invoice(
    invoice_id: str,
    update_data: UpdateInvoiceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update invoice (only if in draft status)"""
    try:
        # Find invoice
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if can be updated
        if invoice["status"] != "draft":
            raise HTTPException(
                status_code=400, 
                detail="Can only update draft invoices"
            )
        
        # Check permissions
        if (current_user.get("role") in ["sales_rep", "medical_rep"] and 
            invoice["sales_rep_id"] != current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build update query
        update_query = {"updated_at": datetime.utcnow()}
        
        if update_data.items:
            processed_items = []
            for item_data in update_data.items:
                invoice_item = InvoiceItem(**item_data)
                processed_items.append(invoice_item.dict())
            
            totals = calculate_invoice_totals(processed_items)
            update_query.update({
                "items": processed_items,
                "subtotal": totals['subtotal'],
                "tax_amount": totals['tax_amount'],
                "total_amount": totals['total_amount']
            })
        
        if update_data.due_date:
            update_query["due_date"] = update_data.due_date
        if update_data.notes:
            update_query["notes"] = update_data.notes
        if update_data.priority:
            update_query["priority"] = update_data.priority
        
        # Update invoice
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": update_query}
        )
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "invoice_updated",
            "description": f"Updated invoice {invoice['invoice_number']}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": invoice_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Return updated invoice
        updated_invoice = await db.invoices.find_one({"id": invoice_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Invoice updated successfully",
            "invoice": updated_invoice
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating invoice: {str(e)}")

@router.put("/invoices/{invoice_id}/approve", response_model=Dict[str, Any])
async def approve_invoice(
    invoice_id: str,
    approval_data: ApproveInvoiceRequest,
    current_user: dict = Depends(get_current_user)
):
    """Approve invoice and optionally convert to debt"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to approve invoices"
            )
        
        # Find invoice
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if can be approved
        if invoice["status"] not in ["draft", "pending"]:
            raise HTTPException(
                status_code=400, 
                detail="Invoice cannot be approved in current status"
            )
        
        # Update invoice status
        update_query = {
            "status": "approved",
            "approved_by": current_user.get("user_id"),
            "approved_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        if approval_data.approval_notes:
            update_query["internal_notes"] = approval_data.approval_notes
        
        await db.invoices.update_one(
            {"id": invoice_id},
            {"$set": update_query}
        )
        
        # Convert to debt if requested
        debt_id = None
        if approval_data.convert_to_debt:
            # Import debt creation function
            from routers.debt_management_routes import create_debt_from_invoice
            debt_id = await create_debt_from_invoice(invoice_id, current_user)
            
            # Update invoice status to converted
            await db.invoices.update_one(
                {"id": invoice_id},
                {"$set": {
                    "status": "converted_to_debt",
                    "converted_to_debt_at": datetime.utcnow()
                }}
            )
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "invoice_approved",
            "description": f"Approved invoice {invoice['invoice_number']}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": invoice_id,
            "details": {
                "converted_to_debt": approval_data.convert_to_debt,
                "debt_id": debt_id
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "success": True,
            "message": "Invoice approved successfully",
            "invoice_id": invoice_id,
            "debt_created": approval_data.convert_to_debt,
            "debt_id": debt_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving invoice: {str(e)}")

@router.delete("/invoices/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete invoice (only if in draft status)"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm"]:
            raise HTTPException(
                status_code=403,
                detail="Only administrators can delete invoices"
            )
        
        # Find invoice
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if can be deleted
        if invoice["status"] != "draft":
            raise HTTPException(
                status_code=400, 
                detail="Can only delete draft invoices"
            )
        
        # Delete invoice
        await db.invoices.delete_one({"id": invoice_id})
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "invoice_deleted",
            "description": f"Deleted invoice {invoice['invoice_number']}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": invoice_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "success": True,
            "message": "Invoice deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")

@router.get("/invoices/statistics/overview", response_model=Dict[str, Any])
async def get_invoice_statistics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get invoice statistics and analytics"""
    try:
        # Build date filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date)
        
        filter_query = {}
        if date_filter:
            filter_query["invoice_date"] = date_filter
        
        # Role-based filtering
        if current_user.get("role") in ["sales_rep", "medical_rep"]:
            filter_query["sales_rep_id"] = current_user.get("user_id")
        
        # Aggregate statistics
        pipeline = [
            {"$match": filter_query},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_value": {"$sum": "$total_amount"},
                "avg_value": {"$avg": "$total_amount"}
            }}
        ]
        
        cursor = db.invoices.aggregate(pipeline)
        stats_by_status = {}
        total_invoices = 0
        total_value = 0
        
        async for stat in cursor:
            status = stat["_id"]
            count = stat["count"]
            value = stat["total_value"]
            
            stats_by_status[status] = {
                "count": count,
                "total_value": value,
                "average_value": stat["avg_value"]
            }
            
            total_invoices += count
            total_value += value
        
        # Calculate overdue invoices
        overdue_count = await db.invoices.count_documents({
            **filter_query,
            "due_date": {"$lt": datetime.utcnow()},
            "status": {"$in": ["approved", "pending"]}
        })
        
        return {
            "success": True,
            "statistics": {
                "total_invoices": total_invoices,
                "total_value": total_value,
                "average_value": total_value / total_invoices if total_invoices > 0 else 0,
                "overdue_invoices": overdue_count,
                "by_status": stats_by_status
            },
            "period": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching statistics: {str(e)}")

# Export router
__all__ = ['router']