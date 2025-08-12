#!/usr/bin/env python3
"""
Debt Management Routes - نظام إدارة الديون
Comprehensive debt collection system with assignment and tracking
نظام تحصيل ديون شامل مع التعيين والتتبع
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
    Debt, DebtStatus, PaymentRecord, PaymentMethod,
    CreateDebtRequest, RecordPaymentRequest, DebtAssignmentRequest, DebtStatistics
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
router = APIRouter(prefix="/api", tags=["debts"])

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

def generate_debt_number() -> str:
    """Generate unique debt number"""
    timestamp = datetime.utcnow().strftime("%Y%m%d")
    random_part = str(uuid.uuid4())[:8].upper()
    return f"DEBT-{timestamp}-{random_part}"

def calculate_aging_category(due_date: datetime) -> tuple[int, str]:
    """Calculate aging days and category"""
    if not due_date:
        return 0, "current"
    
    days_overdue = max(0, (datetime.utcnow() - due_date).days)
    
    if days_overdue <= 0:
        category = "current"
    elif days_overdue <= 30:
        category = "1-30"
    elif days_overdue <= 60:
        category = "31-60"
    elif days_overdue <= 90:
        category = "61-90"
    else:
        category = "90+"
    
    return days_overdue, category

async def create_debt_from_invoice(invoice_id: str, current_user: dict) -> str:
    """Create debt record from approved invoice"""
    try:
        # Get invoice details
        invoice = await db.invoices.find_one({"id": invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        if invoice["status"] != "approved":
            raise HTTPException(status_code=400, detail="Invoice must be approved to create debt")
        
        # Check if debt already exists for this invoice
        existing_debt = await db.debts.find_one({"invoice_id": invoice_id})
        if existing_debt:
            return existing_debt["id"]
        
        # Calculate aging
        due_date = invoice.get("due_date")
        if isinstance(due_date, str):
            due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        
        days_overdue, aging_category = calculate_aging_category(due_date)
        
        # Determine initial status
        initial_status = DebtStatus.OVERDUE if days_overdue > 0 else DebtStatus.PENDING
        
        # Create debt record
        debt_id = str(uuid.uuid4())
        debt = Debt(
            id=debt_id,
            debt_number=generate_debt_number(),
            invoice_id=invoice_id,
            invoice_number=invoice["invoice_number"],
            clinic_id=invoice["clinic_id"],
            clinic_name=invoice["clinic_name"],
            doctor_name=invoice["doctor_name"],
            clinic_address=invoice.get("clinic_address"),
            clinic_phone=invoice.get("clinic_phone"),
            clinic_email=invoice.get("clinic_email"),
            assigned_to_id=invoice["sales_rep_id"],  # Initially assign to original sales rep
            assigned_to_name=invoice["sales_rep_name"],
            line_id=invoice.get("line_id"),
            area_id=invoice.get("area_id"),
            original_amount=invoice["total_amount"],
            remaining_amount=invoice["total_amount"],
            original_due_date=due_date,
            status=initial_status,
            days_overdue=days_overdue,
            aging_category=aging_category,
            created_by=current_user.get("user_id", "system"),
            assigned_at=datetime.utcnow()
        )
        
        # Save debt to database
        await db.debts.insert_one(debt.dict())
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "debt_created",
            "description": f"Created debt {debt.debt_number} from invoice {invoice['invoice_number']}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": debt_id,
            "details": {
                "debt_number": debt.debt_number,
                "invoice_number": invoice["invoice_number"],
                "clinic_name": debt.clinic_name,
                "amount": debt.original_amount,
                "aging_category": aging_category
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return debt_id
        
    except Exception as e:
        print(f"Error creating debt from invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating debt: {str(e)}")

@router.post("/debts", response_model=Dict[str, Any])
async def create_debt(
    debt_data: CreateDebtRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new debt record manually"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to create debts"
            )
        
        # Validate invoice exists
        invoice = await db.invoices.find_one({"id": debt_data.invoice_id})
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Check if debt already exists
        existing_debt = await db.debts.find_one({"invoice_id": debt_data.invoice_id})
        if existing_debt:
            raise HTTPException(status_code=400, detail="Debt already exists for this invoice")
        
        # Validate assigned user
        assigned_user = await db.users.find_one({"id": debt_data.assigned_to_id})
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        
        # Create debt using the helper function
        debt_id = await create_debt_from_invoice(debt_data.invoice_id, current_user)
        
        # Update assignment if different from default
        if debt_data.assigned_to_id != invoice["sales_rep_id"]:
            await assign_debt(debt_id, DebtAssignmentRequest(
                debt_id=debt_id,
                assigned_to_id=debt_data.assigned_to_id,
                assigned_to_name=debt_data.assigned_to_name,
                priority=debt_data.priority,
                notes=debt_data.collection_notes
            ), current_user)
        
        # Get created debt
        debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Debt created successfully",
            "debt": debt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating debt: {str(e)}")

@router.get("/debts", response_model=Dict[str, Any])
async def get_debts(
    status: Optional[str] = Query(None, description="Filter by status"),
    assigned_to: Optional[str] = Query(None, description="Filter by assigned user"),
    clinic_id: Optional[str] = Query(None, description="Filter by clinic"),
    aging_category: Optional[str] = Query(None, description="Filter by aging category"),
    overdue_only: bool = Query(False, description="Show only overdue debts"),
    start_date: Optional[str] = Query(None, description="Start date filter"),
    end_date: Optional[str] = Query(None, description="End date filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get debts with comprehensive filtering"""
    try:
        # Build filter query
        filter_query = {}
        
        # Role-based access control
        if current_user.get("role") in ["sales_rep", "medical_rep"]:
            filter_query["assigned_to_id"] = current_user.get("user_id")
        elif current_user.get("role") == "line_manager":
            filter_query["line_id"] = current_user.get("line_id")
        
        # Apply filters
        if status:
            filter_query["status"] = status
        if assigned_to and current_user.get("role") in ["admin", "gm", "line_manager"]:
            filter_query["assigned_to_id"] = assigned_to
        if clinic_id:
            filter_query["clinic_id"] = clinic_id
        if aging_category:
            filter_query["aging_category"] = aging_category
        if overdue_only:
            filter_query["days_overdue"] = {"$gt": 0}
        
        # Date range filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date)
        if date_filter:
            filter_query["created_at"] = date_filter
        
        # Update aging information before querying
        await update_debt_aging()
        
        # Get debts
        cursor = db.debts.find(filter_query, {"_id": 0}).sort("created_at", -1)
        debts = await cursor.skip(skip).limit(limit).to_list(length=limit)
        
        # Get total count
        total_count = await db.debts.count_documents(filter_query)
        
        # Calculate summary statistics
        pipeline = [
            {"$match": filter_query},
            {"$group": {
                "_id": None,
                "total_outstanding": {"$sum": "$remaining_amount"},
                "total_original": {"$sum": "$original_amount"},
                "total_paid": {"$sum": "$paid_amount"},
                "overdue_count": {"$sum": {"$cond": [{"$gt": ["$days_overdue", 0]}, 1, 0]}}
            }}
        ]
        
        cursor = db.debts.aggregate(pipeline)
        summary = await cursor.to_list(length=1)
        summary = summary[0] if summary else {
            "total_outstanding": 0,
            "total_original": 0,
            "total_paid": 0,
            "overdue_count": 0
        }
        
        return {
            "success": True,
            "debts": debts,
            "total_count": total_count,
            "skip": skip,
            "limit": limit,
            "summary": {
                "total_outstanding": summary["total_outstanding"],
                "total_original": summary["total_original"],
                "total_collected": summary["total_paid"],
                "collection_rate": (summary["total_paid"] / summary["total_original"] * 100) if summary["total_original"] > 0 else 0,
                "overdue_count": summary["overdue_count"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching debts: {str(e)}")

@router.get("/debts/{debt_id}", response_model=Dict[str, Any])
async def get_debt(
    debt_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed debt information"""
    try:
        # Find debt
        debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        # Check permissions
        if (current_user.get("role") in ["sales_rep", "medical_rep"] and 
            debt["assigned_to_id"] != current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update aging information
        due_date = debt.get("original_due_date")
        if due_date:
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            
            days_overdue, aging_category = calculate_aging_category(due_date)
            
            if debt["days_overdue"] != days_overdue or debt["aging_category"] != aging_category:
                await db.debts.update_one(
                    {"id": debt_id},
                    {"$set": {
                        "days_overdue": days_overdue,
                        "aging_category": aging_category,
                        "updated_at": datetime.utcnow()
                    }}
                )
                debt["days_overdue"] = days_overdue
                debt["aging_category"] = aging_category
        
        # Get related invoice
        invoice = await db.invoices.find_one({"id": debt["invoice_id"]}, {"_id": 0})
        
        # Get collection activities
        activities = await db.activities.find(
            {"related_id": debt_id, "activity_type": {"$in": ["payment_recorded", "debt_assigned", "collection_attempt"]}},
            {"_id": 0}
        ).sort("timestamp", -1).limit(20).to_list(length=20)
        
        return {
            "success": True,
            "debt": debt,
            "related_invoice": invoice,
            "recent_activities": activities
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching debt: {str(e)}")

@router.post("/debts/{debt_id}/payments", response_model=Dict[str, Any])
async def record_payment(
    debt_id: str,
    payment_data: RecordPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Record a payment against a debt"""
    try:
        # Find debt
        debt = await db.debts.find_one({"id": debt_id})
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        # Check permissions
        if (current_user.get("role") in ["sales_rep", "medical_rep"] and 
            debt["assigned_to_id"] != current_user.get("user_id")):
            raise HTTPException(status_code=403, detail="Access denied to record payments")
        
        # Validate payment amount
        if payment_data.amount > debt["remaining_amount"]:
            raise HTTPException(
                status_code=400, 
                detail=f"Payment amount ({payment_data.amount}) exceeds remaining balance ({debt['remaining_amount']})"
            )
        
        # Create payment record
        payment = PaymentRecord(
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            payment_date=payment_data.payment_date or datetime.utcnow(),
            reference_number=payment_data.reference_number,
            notes=payment_data.notes,
            collected_by=current_user.get("user_id", "unknown")
        )
        
        # Calculate new amounts
        new_paid_amount = debt["paid_amount"] + payment_data.amount
        new_remaining_amount = debt["original_amount"] - new_paid_amount
        
        # Determine new status
        if new_remaining_amount <= 0:
            new_status = DebtStatus.FULLY_COLLECTED
        elif new_paid_amount > 0:
            new_status = DebtStatus.PARTIALLY_COLLECTED
        else:
            new_status = debt["status"]
        
        # Update debt record
        update_query = {
            "$set": {
                "paid_amount": new_paid_amount,
                "remaining_amount": max(0, new_remaining_amount),
                "status": new_status.value,
                "last_payment_date": payment.payment_date,
                "updated_at": datetime.utcnow()
            },
            "$push": {"payment_history": payment.dict()}
        }
        
        await db.debts.update_one({"id": debt_id}, update_query)
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "payment_recorded",
            "description": f"Payment of {payment_data.amount} recorded for debt {debt['debt_number']}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": debt_id,
            "details": {
                "debt_number": debt["debt_number"],
                "payment_amount": payment_data.amount,
                "payment_method": payment_data.payment_method.value,
                "remaining_amount": max(0, new_remaining_amount),
                "new_status": new_status.value
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Get updated debt
        updated_debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Payment recorded successfully",
            "payment": payment.dict(),
            "debt": updated_debt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recording payment: {str(e)}")

async def assign_debt(debt_id: str, assignment_data: DebtAssignmentRequest, current_user: dict):
    """Assign debt to a sales representative"""
    try:
        # Find debt
        debt = await db.debts.find_one({"id": debt_id})
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        
        # Validate assigned user
        assigned_user = await db.users.find_one({"id": assignment_data.assigned_to_id})
        if not assigned_user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
        
        # Update debt assignment
        update_query = {
            "assigned_to_id": assignment_data.assigned_to_id,
            "assigned_to_name": assignment_data.assigned_to_name,
            "assigned_by": current_user.get("user_id"),
            "assigned_at": datetime.utcnow(),
            "status": DebtStatus.ASSIGNED.value,
            "updated_at": datetime.utcnow()
        }
        
        if assignment_data.priority:
            update_query["priority"] = assignment_data.priority
        if assignment_data.notes:
            update_query["collection_notes"] = assignment_data.notes
        
        await db.debts.update_one({"id": debt_id}, {"$set": update_query})
        
        # Log activity
        await db.activities.insert_one({
            "_id": str(uuid.uuid4()),
            "activity_type": "debt_assigned",
            "description": f"Debt {debt['debt_number']} assigned to {assignment_data.assigned_to_name}",
            "user_id": current_user.get("user_id"),
            "user_name": current_user.get("username"),
            "user_role": current_user.get("role"),
            "related_id": debt_id,
            "details": {
                "debt_number": debt["debt_number"],
                "assigned_to": assignment_data.assigned_to_name,
                "previous_assignee": debt.get("assigned_to_name"),
                "priority": assignment_data.priority
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        print(f"Error assigning debt: {e}")
        raise HTTPException(status_code=500, detail=f"Error assigning debt: {str(e)}")

@router.put("/debts/{debt_id}/assign", response_model=Dict[str, Any])
async def assign_debt_endpoint(
    debt_id: str,
    assignment_data: DebtAssignmentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Assign debt to a sales representative (API endpoint)"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "line_manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to assign debts"
            )
        
        await assign_debt(debt_id, assignment_data, current_user)
        
        # Get updated debt
        updated_debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
        
        return {
            "success": True,
            "message": "Debt assigned successfully",
            "debt": updated_debt
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assigning debt: {str(e)}")

async def update_debt_aging():
    """Update aging information for all debts"""
    try:
        # Get all active debts
        cursor = db.debts.find({"status": {"$nin": ["fully_collected", "written_off"]}})
        
        async for debt in cursor:
            due_date = debt.get("original_due_date")
            if due_date:
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                
                days_overdue, aging_category = calculate_aging_category(due_date)
                
                # Update status if now overdue
                new_status = debt["status"]
                if days_overdue > 0 and debt["status"] in ["pending", "assigned"]:
                    new_status = "overdue"
                
                # Update if changed
                if (debt["days_overdue"] != days_overdue or 
                    debt["aging_category"] != aging_category or 
                    debt["status"] != new_status):
                    
                    await db.debts.update_one(
                        {"id": debt["id"]},
                        {"$set": {
                            "days_overdue": days_overdue,
                            "aging_category": aging_category,
                            "status": new_status,
                            "updated_at": datetime.utcnow()
                        }}
                    )
        
    except Exception as e:
        print(f"Error updating debt aging: {e}")

@router.get("/debts/statistics/overview", response_model=Dict[str, Any])
async def get_debt_statistics(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get comprehensive debt statistics"""
    try:
        # Update aging before generating statistics
        await update_debt_aging()
        
        # Build date filter
        date_filter = {}
        if start_date:
            date_filter["$gte"] = datetime.fromisoformat(start_date)
        if end_date:
            date_filter["$lte"] = datetime.fromisoformat(end_date)
        
        filter_query = {}
        if date_filter:
            filter_query["created_at"] = date_filter
        
        # Role-based filtering
        if current_user.get("role") in ["sales_rep", "medical_rep"]:
            filter_query["assigned_to_id"] = current_user.get("user_id")
        
        # Aggregate comprehensive statistics
        pipeline = [
            {"$match": filter_query},
            {"$group": {
                "_id": None,
                "total_debts": {"$sum": 1},
                "total_outstanding": {"$sum": "$remaining_amount"},
                "total_original": {"$sum": "$original_amount"},
                "total_collected": {"$sum": "$paid_amount"},
                "overdue_count": {"$sum": {"$cond": [{"$gt": ["$days_overdue", 0]}, 1, 0]}},
                "fully_collected_count": {"$sum": {"$cond": [{"$eq": ["$status", "fully_collected"]}, 1, 0]}},
                "average_days_overdue": {"$avg": "$days_overdue"},
                "by_status": {"$push": "$status"},
                "by_aging": {"$push": "$aging_category"}
            }}
        ]
        
        cursor = db.debts.aggregate(pipeline)
        stats = await cursor.to_list(length=1)
        
        if not stats:
            return {
                "success": True,
                "statistics": {
                    "total_debts": 0,
                    "total_outstanding": 0,
                    "collection_rate": 0,
                    "overdue_rate": 0
                }
            }
        
        stats = stats[0]
        
        # Calculate rates
        collection_rate = (stats["total_collected"] / stats["total_original"] * 100) if stats["total_original"] and stats["total_original"] > 0 else 0
        overdue_rate = (stats["overdue_count"] / stats["total_debts"] * 100) if stats["total_debts"] and stats["total_debts"] > 0 else 0
        
        # Process status distribution
        status_counts = {}
        for status in stats["by_status"]:
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Process aging distribution
        aging_counts = {}
        for aging in stats["by_aging"]:
            aging_counts[aging] = aging_counts.get(aging, 0) + 1
        
        # Process top collectors (if admin/gm)
        top_collectors = []
        if current_user.get("role") in ["admin", "gm"]:
            collector_stats = {}
            for rep_data in stats["by_assigned_rep"]:
                rep_id = rep_data["rep_id"]
                rep_name = rep_data["rep_name"] 
                amount = rep_data["amount"]
                
                if rep_id not in collector_stats:
                    collector_stats[rep_id] = {"name": rep_name, "total_assigned": 0, "count": 0}
                
                collector_stats[rep_id]["total_assigned"] += amount
                collector_stats[rep_id]["count"] += 1
            
            # Sort by performance
            top_collectors = sorted(
                [{"rep_name": v["name"], "rep_id": k, "total_assigned": v["total_assigned"], "debt_count": v["count"]} 
                 for k, v in collector_stats.items()],
                key=lambda x: x["total_assigned"],
                reverse=True
            )[:10]
        
        return {
            "success": True,
            "statistics": {
                "total_debts": stats["total_debts"],
                "total_outstanding": stats["total_outstanding"],
                "total_original": stats["total_original"],
                "total_collected": stats["total_collected"],
                "collection_rate": round(collection_rate, 2),
                "overdue_count": stats["overdue_count"],
                "overdue_rate": round(overdue_rate, 2),
                "fully_collected_count": stats["fully_collected_count"],
                "average_days_overdue": round(stats["average_days_overdue"] or 0, 1),
                "status_distribution": status_counts,
                "aging_distribution": aging_counts,
                "top_collectors": top_collectors
            },
            "period": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching debt statistics: {str(e)}")

# Export router
__all__ = ['router', 'create_debt_from_invoice']