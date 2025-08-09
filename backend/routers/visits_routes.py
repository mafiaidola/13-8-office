#!/usr/bin/env python3
"""
Visits management routes for Medical Management System
نظام إدارة الزيارات للنظام الطبي المتكامل
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import uuid

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

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
router = APIRouter(prefix="/api/visits", tags=["visits"])

# Visit Models
class Visit(BaseModel):
    id: str
    representative_id: str
    representative_name: str
    clinic_id: str
    clinic_name: str
    visit_date: str
    visit_time: str
    visit_type: str  # "planned", "emergency", "follow_up"
    visit_status: str  # "scheduled", "completed", "cancelled", "no_show"
    visit_purpose: str
    notes: Optional[str] = None
    products_discussed: Optional[List[Dict[str, Any]]] = None
    orders_placed: Optional[List[Dict[str, Any]]] = None
    visit_duration_minutes: Optional[int] = None
    geolocation: Optional[Dict[str, Any]] = None
    created_at: str
    updated_at: str

class VisitCreate(BaseModel):
    clinic_id: str = Field(..., description="معرف العيادة")
    visit_type: str = Field(..., description="نوع الزيارة")
    visit_purpose: str = Field(..., description="الغرض من الزيارة")
    scheduled_date: str = Field(..., description="تاريخ الزيارة المجدولة")
    scheduled_time: str = Field(..., description="وقت الزيارة المجدول")
    notes: Optional[str] = Field(None, description="ملاحظات")
    geolocation: Optional[Dict[str, Any]] = Field(None, description="الموقع الجغرافي")

class VisitUpdate(BaseModel):
    visit_status: Optional[str] = Field(None, description="حالة الزيارة")
    notes: Optional[str] = Field(None, description="ملاحظات")
    products_discussed: Optional[List[Dict[str, Any]]] = Field(None, description="المنتجات المناقشة")
    orders_placed: Optional[List[Dict[str, Any]]] = Field(None, description="الطلبات المقدمة")
    visit_duration_minutes: Optional[int] = Field(None, description="مدة الزيارة بالدقائق")
    actual_visit_time: Optional[str] = Field(None, description="وقت الزيارة الفعلي")
    geolocation: Optional[Dict[str, Any]] = Field(None, description="الموقع الجغرافي")

def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    try:
        token = credentials.credentials
        payload = verify_jwt_token(token)
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Helper functions
async def get_clinic_info(clinic_id: str) -> Dict[str, Any]:
    """Get clinic information"""
    try:
        clinic = await db.clinics.find_one({"id": clinic_id}, {"_id": 0})
        if clinic:
            return {
                "id": clinic.get("id"),
                "name": clinic.get("clinic_name", "Unknown Clinic"),
                "address": clinic.get("clinic_address", ""),
                "phone": clinic.get("clinic_phone", "")
            }
        return {"id": clinic_id, "name": "Unknown Clinic", "address": "", "phone": ""}
    except:
        return {"id": clinic_id, "name": "Unknown Clinic", "address": "", "phone": ""}

async def get_user_info(user_id: str) -> Dict[str, Any]:
    """Get user information"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            return {
                "id": user.get("id"),
                "full_name": user.get("full_name", "Unknown User"),
                "role": user.get("role", "unknown")
            }
        return {"id": user_id, "full_name": "Unknown User", "role": "unknown"}
    except:
        return {"id": user_id, "full_name": "Unknown User", "role": "unknown"}

# Sample data creation function
async def ensure_sample_visits():
    """Create sample visits if none exist"""
    visits_count = await db.rep_visits.count_documents({})
    if visits_count == 0:
        # Get some sample users and clinics
        sample_users = await db.users.find({}, {"_id": 0}).limit(3).to_list(None)
        
        if sample_users:
            sample_visits = []
            for i, user in enumerate(sample_users):
                visit = {
                    "id": f"visit-{str(uuid.uuid4())[:8]}",
                    "representative_id": user.get("id", f"rep-{i}"),
                    "representative_name": user.get("full_name", f"مندوب {i+1}"),
                    "clinic_id": f"clinic-{i+1:03d}",
                    "clinic_name": f"عيادة نموذجية {i+1}",
                    "visit_date": (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d"),
                    "visit_time": f"{9 + i:02d}:00",
                    "visit_type": ["planned", "follow_up", "emergency"][i % 3],
                    "visit_status": ["completed", "scheduled", "completed"][i % 3],
                    "visit_purpose": [
                        "عرض منتجات جديدة",
                        "متابعة الطلبات السابقة", 
                        "جمع مستحقات مالية"
                    ][i % 3],
                    "notes": f"زيارة ناجحة للعيادة رقم {i+1}",
                    "products_discussed": [
                        {"name": "بانادول 500mg", "quantity": 10},
                        {"name": "أوجمنتين 1gm", "quantity": 5}
                    ],
                    "visit_duration_minutes": 30 + (i * 15),
                    "geolocation": {
                        "latitude": 30.0444 + (i * 0.01),
                        "longitude": 31.2357 + (i * 0.01),
                        "accuracy": 10,
                        "address": f"القاهرة، منطقة {i+1}"
                    },
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                sample_visits.append(visit)
            
            await db.rep_visits.insert_many(sample_visits)
            print("✅ تم إنشاء زيارات نموذجية للنظام")

# Routes

@router.get("/dashboard/overview")
async def get_visits_overview(
    current_user: dict = Depends(get_current_user),
    time_filter: str = Query("today", description="فلتر الوقت: today, week, month"),
    representative_id: Optional[str] = Query(None, description="معرف المندوب")
):
    """Get visits overview statistics"""
    try:
        # Ensure sample data exists
        await ensure_sample_visits()
        
        # Build time filter
        now = datetime.utcnow()
        if time_filter == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif time_filter == "week":
            start_date = now - timedelta(days=7)
        elif time_filter == "month":
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=1)
        
        # Build query
        query = {"visit_date": {"$gte": start_date.strftime("%Y-%m-%d")}}
        
        # Filter by representative if specified or based on role
        if representative_id:
            query["representative_id"] = representative_id
        elif current_user.get("role") in ["medical_rep", "sales_rep"]:
            # Representatives can only see their own visits
            query["representative_id"] = current_user.get("user_id")
        
        # Get visits statistics
        total_visits = await db.rep_visits.count_documents(query)
        completed_visits = await db.rep_visits.count_documents({**query, "visit_status": "completed"})
        scheduled_visits = await db.rep_visits.count_documents({**query, "visit_status": "scheduled"})
        cancelled_visits = await db.rep_visits.count_documents({**query, "visit_status": "cancelled"})
        
        # Get recent visits
        recent_visits = []
        async for visit in db.rep_visits.find(query, {"_id": 0}).sort("visit_date", -1).limit(10):
            recent_visits.append(visit)
        
        # Calculate performance metrics
        completion_rate = (completed_visits / total_visits * 100) if total_visits > 0 else 0
        
        return {
            "success": True,
            "time_filter": time_filter,
            "stats": {
                "total_visits": total_visits,
                "completed_visits": completed_visits,
                "scheduled_visits": scheduled_visits,
                "cancelled_visits": cancelled_visits,
                "completion_rate": round(completion_rate, 2)
            },
            "recent_visits": recent_visits,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving visits overview: {str(e)}")

@router.get("/list")
async def get_visits_list(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1, description="رقم الصفحة"),
    limit: int = Query(20, ge=1, le=100, description="عدد النتائج في الصفحة"),
    status: Optional[str] = Query(None, description="فلتر حسب الحالة"),
    representative_id: Optional[str] = Query(None, description="فلتر حسب المندوب"),
    date_from: Optional[str] = Query(None, description="من تاريخ"),
    date_to: Optional[str] = Query(None, description="إلى تاريخ")
):
    """Get paginated visits list with filtering"""
    try:
        # Ensure sample data exists
        await ensure_sample_visits()
        
        # Build query
        query = {}
        
        if status:
            query["visit_status"] = status
        
        if representative_id:
            query["representative_id"] = representative_id
        elif current_user.get("role") in ["medical_rep", "sales_rep"]:
            # Representatives can only see their own visits
            query["representative_id"] = current_user.get("user_id")
        
        if date_from:
            query["visit_date"] = {"$gte": date_from}
        
        if date_to:
            if "visit_date" in query:
                query["visit_date"]["$lte"] = date_to
            else:
                query["visit_date"] = {"$lte": date_to}
        
        # Get total count
        total_count = await db.rep_visits.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        visits = []
        async for visit in db.rep_visits.find(query, {"_id": 0}).skip(skip).limit(limit).sort("visit_date", -1):
            visits.append(visit)
        
        return {
            "success": True,
            "visits": visits,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving visits list: {str(e)}")

@router.post("/create")
async def create_visit(
    visit_data: VisitCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new visit"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "manager", "medical_rep", "sales_rep"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to create visits"
            )
        
        # Get clinic and representative info
        clinic_info = await get_clinic_info(visit_data.clinic_id)
        user_info = await get_user_info(current_user.get("user_id"))
        
        # Create new visit
        visit_id = str(uuid.uuid4())
        new_visit = {
            "id": visit_id,
            "representative_id": current_user.get("user_id"),
            "representative_name": user_info["full_name"],
            "clinic_id": visit_data.clinic_id,
            "clinic_name": clinic_info["name"],
            "visit_date": visit_data.scheduled_date,
            "visit_time": visit_data.scheduled_time,
            "visit_type": visit_data.visit_type,
            "visit_status": "scheduled",
            "visit_purpose": visit_data.visit_purpose,
            "notes": visit_data.notes,
            "geolocation": visit_data.geolocation,
            "products_discussed": [],
            "orders_placed": [],
            "visit_duration_minutes": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("user_id")
        }
        
        # Insert visit into database
        await db.rep_visits.insert_one(new_visit)
        
        # Return visit data without MongoDB _id
        new_visit.pop("_id", None)
        new_visit["message"] = "Visit created successfully"
        
        return new_visit
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating visit: {str(e)}")

@router.put("/{visit_id}")
async def update_visit(
    visit_id: str,
    visit_data: VisitUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update visit details"""
    try:
        # Check if visit exists
        existing_visit = await db.rep_visits.find_one({"id": visit_id})
        if not existing_visit:
            raise HTTPException(status_code=404, detail="Visit not found")
        
        # Check permissions
        if (current_user.get("role") not in ["admin", "gm", "manager"] and 
            existing_visit.get("representative_id") != current_user.get("user_id")):
            raise HTTPException(
                status_code=403,
                detail="You can only update your own visits"
            )
        
        # Prepare update data
        update_data = {}
        
        # Update only provided fields
        for field, value in visit_data.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add metadata
        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_data["updated_by"] = current_user.get("user_id")
        
        # Update visit
        result = await db.rep_visits.update_one(
            {"id": visit_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made to visit")
        
        # Return updated visit
        updated_visit = await db.rep_visits.find_one({"id": visit_id}, {"_id": 0})
        updated_visit["message"] = "Visit updated successfully"
        
        return updated_visit
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating visit: {str(e)}")

@router.get("/login-logs")
async def get_login_logs(
    current_user: dict = Depends(get_current_user),
    page: int = Query(1, ge=1, description="رقم الصفحة"),
    limit: int = Query(20, ge=1, le=100, description="عدد النتائج في الصفحة"),
    user_id: Optional[str] = Query(None, description="فلتر حسب المستخدم"),
    date_from: Optional[str] = Query(None, description="من تاريخ"),
    date_to: Optional[str] = Query(None, description="إلى تاريخ")
):
    """Get login logs - Admins see all, others see their own"""
    try:
        # Build query
        query = {}
        
        # Role-based access control
        if current_user.get("role") in ["admin", "gm"]:
            # Admin and GM can see all logs or filter by user_id
            if user_id:
                query["user_id"] = user_id
        else:
            # Other users can only see their own logs
            query["user_id"] = current_user.get("user_id")
        
        if date_from:
            query["login_time"] = {"$gte": date_from}
        
        if date_to:
            if "login_time" in query:
                query["login_time"]["$lte"] = date_to
            else:
                query["login_time"] = {"$lte": date_to}
        
        # Get total count
        total_count = await db.login_logs.count_documents(query)
        
        # Get paginated results
        skip = (page - 1) * limit
        login_logs = []
        async for log in db.login_logs.find(query, {"_id": 0}).skip(skip).limit(limit).sort("login_time", -1):
            login_logs.append(log)
        
        return {
            "success": True,
            "login_logs": login_logs,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": (total_count + limit - 1) // limit
            },
            "user_access_level": current_user.get("role"),
            "viewing_own_logs": current_user.get("role") not in ["admin", "gm"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving login logs: {str(e)}")

@router.get("/stats/representatives")
async def get_representatives_stats(
    current_user: dict = Depends(get_current_user),
    time_filter: str = Query("month", description="فلتر الوقت: week, month, quarter")
):
    """Get representatives performance statistics"""
    try:
        # Check permissions
        if current_user.get("role") not in ["admin", "gm", "manager"]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to view representatives stats"
            )
        
        # Ensure sample data exists
        await ensure_sample_visits()
        
        # Build time filter
        now = datetime.utcnow()
        if time_filter == "week":
            start_date = now - timedelta(days=7)
        elif time_filter == "month":
            start_date = now - timedelta(days=30)
        elif time_filter == "quarter":
            start_date = now - timedelta(days=90)
        else:
            start_date = now - timedelta(days=30)
        
        # Aggregate visits by representative
        pipeline = [
            {
                "$match": {
                    "visit_date": {"$gte": start_date.strftime("%Y-%m-%d")}
                }
            },
            {
                "$group": {
                    "_id": {
                        "representative_id": "$representative_id",
                        "representative_name": "$representative_name"
                    },
                    "total_visits": {"$sum": 1},
                    "completed_visits": {
                        "$sum": {"$cond": [{"$eq": ["$visit_status", "completed"]}, 1, 0]}
                    },
                    "total_duration": {"$sum": "$visit_duration_minutes"}
                }
            },
            {
                "$project": {
                    "representative_id": "$_id.representative_id",
                    "representative_name": "$_id.representative_name",
                    "total_visits": 1,
                    "completed_visits": 1,
                    "completion_rate": {
                        "$multiply": [
                            {"$divide": ["$completed_visits", "$total_visits"]},
                            100
                        ]
                    },
                    "avg_visit_duration": {
                        "$divide": ["$total_duration", "$total_visits"]
                    },
                    "_id": 0
                }
            },
            {"$sort": {"total_visits": -1}}
        ]
        
        representatives_stats = []
        async for stat in db.rep_visits.aggregate(pipeline):
            representatives_stats.append(stat)
        
        return {
            "success": True,
            "time_filter": time_filter,
            "representatives_stats": representatives_stats,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving representatives stats: {str(e)}")