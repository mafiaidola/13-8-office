from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
import math
from passlib.context import CryptContext

# Import all models from organized modules
from models.all_models import *

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create the main app
app = FastAPI(title="EP Group System API - Clean Version", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Track startup time
import time
startup_time = time.time()

# Security
security = HTTPBearer()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper Functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "username": user_data["username"],
        "role": user_data["role"],
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_jwt_token(token)
    user = await db.users.find_one({"id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # Ensure all required fields are present
    user_defaults = {
        "password_hash": "",
        "hire_date": None,
        "department": None,
        "employee_id": None,
        "profile_image": None,
        "permissions": [],
        "last_login": None,
        "login_attempts": 0,
        "is_locked": False,
        "created_at": user.get("created_at", datetime.utcnow()),
        "updated_at": user.get("updated_at", datetime.utcnow())
    }
    
    for key, default_value in user_defaults.items():
        if key not in user:
            user[key] = default_value
    
    try:
        user_obj = User(**user)
        return user_obj
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"User model error: {str(e)}")

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters"""
    R = 6371000
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

async def check_clinic_debt_status(clinic_id: str) -> dict:
    """فحص حالة مديونية العيادة"""
    try:
        outstanding_invoices = await db.invoices.find({
            "clinic_id": clinic_id,
            "payment_status": {"$in": ["pending", "partially_paid", "overdue"]}
        }).to_list(1000)
        
        total_debt = 0.0
        overdue_debt = 0.0
        current_date = datetime.utcnow()
        
        for invoice in outstanding_invoices:
            debt_amount = invoice.get("outstanding_amount", invoice.get("total_amount", 0))
            total_debt += debt_amount
            
            due_date = invoice.get("due_date")
            if due_date and isinstance(due_date, datetime) and due_date < current_date:
                overdue_debt += debt_amount
        
        return {
            "outstanding_debt": total_debt,
            "overdue_debt": overdue_debt,
            "total_invoices": len(outstanding_invoices),
            "status": "blocked" if total_debt > 5000 else ("warning" if total_debt > 1000 else "clear")
        }
    except Exception as e:
        print(f"Error checking clinic debt status: {e}")
        return {"outstanding_debt": 0.0, "overdue_debt": 0.0, "total_invoices": 0, "status": "clear"}

async def can_access_user_profile(current_user: User, target_user_id: str) -> bool:
    """فحص صلاحية الوصول للملف الشخصي"""
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == "gm":
        return True
    if current_user.id == target_user_id and current_user.role in [
        UserRole.LINE_MANAGER, UserRole.AREA_MANAGER, UserRole.DISTRICT_MANAGER, UserRole.KEY_ACCOUNT
    ]:
        return True
    
    target_user = await db.users.find_one({"id": target_user_id})
    if not target_user:
        return False
    if target_user.get("managed_by") == current_user.id:
        return True
    
    if current_user.role == UserRole.LINE_MANAGER:
        target_line = target_user.get("line")
        current_line = current_user.line
        if target_line and current_line and target_line == current_line:
            return True
    
    if current_user.role == UserRole.AREA_MANAGER:
        target_area = target_user.get("area_id")
        current_area = current_user.area_id
        if target_area and current_area and target_area == current_area:
            return True
    
    if current_user.role == UserRole.ACCOUNTING:
        if target_user.get("role") in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
            return True
    
    return False

# Authentication Routes
@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    """تسجيل الدخول"""
    user = await db.users.find_one({"username": user_data.username})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not hash_password(user_data.password) == user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    user["role"] = UserRole.normalize_role(user["role"])
    
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.utcnow()}, "$inc": {"login_count": 1}}
    )
    
    token = create_jwt_token(user)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"],
            "email": user.get("email"),
            "phone": user.get("phone")
        }
    }

# User Management Routes
@api_router.get("/users")
async def get_users(current_user: User = Depends(get_current_user)):
    """الحصول على المستخدمين"""
    try:
        if current_user.role in ["medical_rep"]:
            user_data = await db.users.find_one({"id": current_user.id}, {"_id": 0, "password_hash": 0})
            return [user_data] if user_data else []
        
        if current_user.role not in ["admin", "gm"]:
            query = {}
            if current_user.role == "manager":
                query = {"$or": [
                    {"managed_by": current_user.id},
                    {"created_by": current_user.id},
                    {"role": "medical_rep"}
                ]}
            elif current_user.role == "warehouse_keeper":
                query = {"role": {"$in": ["medical_rep", "manager"]}}
            else:
                raise HTTPException(status_code=403, detail="Insufficient permissions")
        else:
            query = {}
        
        users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
        
        for user in users:
            if "created_at" in user and isinstance(user["created_at"], datetime):
                user["created_at"] = user["created_at"].isoformat()
            if "updated_at" in user and isinstance(user["updated_at"], datetime):
                user["updated_at"] = user["updated_at"].isoformat()
            if "last_login" in user and isinstance(user["last_login"], datetime):
                user["last_login"] = user["last_login"].isoformat()
        
        return users
        
    except Exception as e:
        print(f"Error in get_users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, current_user: User = Depends(get_current_user)):
    """الحصول على الملف الشخصي للمستخدم مع تقييد الصلاحيات"""
    if not await can_access_user_profile(current_user, user_id):
        raise HTTPException(
            status_code=403, 
            detail="ليس لديك صلاحية للوصول إلى هذا الملف الشخصي"
        )
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if "_id" in user:
        del user["_id"]
    if "password_hash" in user:
        del user["password_hash"]
    
    user_stats = {
        "sales_activity": {
            "total_visits": await db.visits.count_documents({"sales_rep_id": user_id}),
            "total_orders": await db.orders.count_documents({"sales_rep_id": user_id}),
            "monthly_visits": await db.visits.count_documents({
                "sales_rep_id": user_id,
                "date": {"$gte": datetime.utcnow().replace(day=1)}
            }),
            "monthly_orders": await db.orders.count_documents({
                "sales_rep_id": user_id,
                "created_at": {"$gte": datetime.utcnow().replace(day=1)}
            })
        },
        "debt_info": {
            "total_debt": 0.0,
            "overdue_debt": 0.0,
            "clinics_with_debt": 0
        },
        "territory_info": {
            "assigned_clinics": await db.clinics.count_documents({"assigned_rep_id": user_id}),
            "active_clinics": await db.clinics.count_documents({"assigned_rep_id": user_id, "is_active": True}),
            "coverage_area": user.get("area_id") or "غير محدد"
        },
        "team_info": {
            "direct_reports": await db.users.count_documents({"managed_by": user_id}) if user.get("role") in ["manager", "line_manager", "area_manager"] else 0,
            "team_performance": "جيد"
        }
    }
    
    user.update({
        "user_stats": user_stats,
        "access_info": {
            "accessed_by": current_user.full_name,
            "access_time": datetime.utcnow().isoformat(),
            "access_reason": "profile_view"
        }
    })
    
    return {"user": user}

# Order Management Routes - تحذيرات المديونية
@api_router.get("/orders/check-clinic-status/{clinic_id}")
async def check_clinic_order_status(clinic_id: str, current_user: User = Depends(get_current_user)):
    """فحص حالة العيادة قبل إنشاء الطلب"""
    if current_user.role not in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    clinic = await db.clinics.find_one({"id": clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    debt_info = await check_clinic_debt_status(clinic_id)
    
    clinic_status = {
        "clinic_id": clinic_id,
        "clinic_name": clinic.get("name"),
        "debt_info": debt_info,
        "can_order": debt_info["outstanding_debt"] <= 5000,
        "requires_warning": debt_info["outstanding_debt"] > 1000,
        "color_classification": "red" if debt_info["outstanding_debt"] > 1000 else "green",
        "recommendation": {
            "ar": "يمكن إنشاء الطلب" if debt_info["outstanding_debt"] <= 1000 else 
                  "تحذير: العيادة لديها مديونية" if debt_info["outstanding_debt"] <= 5000 else 
                  "مرفوض: مديونية مرتفعة جداً",
            "en": "Can create order" if debt_info["outstanding_debt"] <= 1000 else
                  "Warning: Clinic has debt" if debt_info["outstanding_debt"] <= 5000 else
                  "Blocked: Very high debt"
        }
    }
    
    return clinic_status

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    """إنشاء طلب مع نظام تحذير المديونية"""
    if current_user.role not in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
        raise HTTPException(status_code=403, detail="Only medical reps and key accounts can create orders")
    
    clinic = await db.clinics.find_one({"id": order_data.clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    clinic_debt_info = await check_clinic_debt_status(order_data.clinic_id)
    
    if clinic_debt_info["outstanding_debt"] > 1000:
        if not order_data.debt_warning_acknowledged:
            raise HTTPException(
                status_code=400, 
                detail={
                    "error": "clinic_debt_warning",
                    "message": f"هذه العيادة لديها مديونية قدرها {clinic_debt_info['outstanding_debt']:.2f} ج.م. هل تريد المتابعة؟",
                    "debt_amount": clinic_debt_info["outstanding_debt"],
                    "require_acknowledgment": True
                }
            )
    
    warehouse = await db.warehouses.find_one({"id": order_data.warehouse_id})
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    total_amount = 0.0
    order_items = []
    
    for item_data in order_data.items:
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data['product_id']} not found")
        
        item_total = product["price"] * item_data["quantity"]
        total_amount += item_total
        
        order_item = OrderItem(
            order_id="",
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=product["price"],
            total_price=item_total
        )
        order_items.append(order_item)
    
    order_color = "red" if clinic_debt_info["outstanding_debt"] > 1000 else "green"
    debt_status = "blocked" if clinic_debt_info["outstanding_debt"] > 5000 else ("warning" if clinic_debt_info["outstanding_debt"] > 1000 else "clear")
    
    order = OrderEnhanced(
        medical_rep_id=current_user.id,
        clinic_id=order_data.clinic_id,
        warehouse_id=order_data.warehouse_id,
        items=[item.dict() for item in order_items],
        subtotal=total_amount,
        total_amount=total_amount,
        clinic_debt_status=debt_status,
        clinic_debt_amount=clinic_debt_info["outstanding_debt"],
        debt_warning_shown=clinic_debt_info["outstanding_debt"] > 1000,
        debt_override_reason=order_data.debt_override_reason,
        debt_override_by=current_user.id if order_data.debt_override_reason else None,
        order_color=order_color,
        line=order_data.line,
        area_id=order_data.area_id,
        notes=order_data.notes
    )
    
    await db.orders.insert_one(order.dict())
    
    for item in order_items:
        item.order_id = order.id
        await db.order_items.insert_one(item.dict())
    
    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "order_number": order.order_number,
        "total_amount": order.total_amount,
        "debt_warning": order.debt_warning_shown,
        "order_color": order.order_color
    }

# Visit Management Routes - نظام الزيارة المحسن
@api_router.post("/visits")
async def create_visit(visit_data: VisitCreate, current_user: User = Depends(get_current_user)):
    """إنشاء زيارة مع نظام المشاركة المحسن"""
    if current_user.role not in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
        raise HTTPException(status_code=403, detail="Only medical reps can create visits")
    
    clinic = await db.clinics.find_one({"id": visit_data.clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    doctor = await db.doctors.find_one({"id": visit_data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    participants_details = [
        {"user_id": current_user.id, "name": current_user.full_name, "role": current_user.role}
    ]
    participants_count = 1
    
    accompanying_manager_name = None
    accompanying_manager_role = None
    if visit_data.accompanying_manager_id:
        manager = await db.users.find_one({"id": visit_data.accompanying_manager_id})
        if manager:
            accompanying_manager_name = manager["full_name"]
            accompanying_manager_role = manager["role"]
            participants_details.append({
                "user_id": manager["id"], 
                "name": manager["full_name"], 
                "role": manager["role"]
            })
            participants_count += 1
    
    other_participant_name = None
    other_participant_role = None
    if visit_data.other_participant_id:
        participant = await db.users.find_one({"id": visit_data.other_participant_id})
        if participant:
            other_participant_name = participant["full_name"]
            other_participant_role = participant["role"]
            participants_details.append({
                "user_id": participant["id"], 
                "name": participant["full_name"], 
                "role": participant["role"]
            })
            participants_count += 1
    
    visit = Visit(
        sales_rep_id=current_user.id,
        doctor_id=visit_data.doctor_id,
        clinic_id=visit_data.clinic_id,
        visit_type=visit_data.visit_type,
        accompanying_manager_id=visit_data.accompanying_manager_id,
        accompanying_manager_name=accompanying_manager_name,
        accompanying_manager_role=accompanying_manager_role,
        other_participant_id=visit_data.other_participant_id,
        other_participant_name=other_participant_name,
        other_participant_role=other_participant_role,
        participants_count=participants_count,
        participants_details=participants_details,
        date=datetime.utcnow(),
        notes=visit_data.notes,
        latitude=visit_data.latitude,
        longitude=visit_data.longitude,
        effective=visit_data.effective
    )
    
    await db.visits.insert_one(visit.dict())
    
    return {
        "message": "Visit created successfully",
        "visit_id": visit.id,
        "visit_type": visit.visit_type,
        "participants_count": visit.participants_count,
        "participants": participants_details
    }

# Movement Log System APIs
@api_router.get("/movement-logs/warehouses")
async def get_warehouses_for_movement(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة المخازن للمستخدمين المصرح لهم"""
    if current_user.role not in [UserRole.ADMIN, "gm", UserRole.ACCOUNTING]:
        raise HTTPException(status_code=403, detail="Access denied. Only admin, GM, and accounting can access movement logs")
    
    warehouses = await db.warehouses.find({}).to_list(1000)
    return {"warehouses": warehouses}

@api_router.post("/movement-logs")
async def create_movement_log(movement_data: MovementLogCreate, current_user: User = Depends(get_current_user)):
    """إنشاء سجل حركة جديد"""
    if current_user.role not in [UserRole.ADMIN, "gm", UserRole.ACCOUNTING]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    warehouse = await db.warehouses.find_one({"id": movement_data.warehouse_id})
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    movement = MovementLog(
        movement_type=movement_data.movement_type,
        warehouse_id=movement_data.warehouse_id,
        line=movement_data.line,
        product_id=movement_data.product_id,
        quantity_change=movement_data.quantity_change,
        movement_reason=movement_data.movement_reason,
        affected_products=movement_data.affected_products,
        line_operation=movement_data.line_operation,
        customer_id=movement_data.customer_id,
        customer_operation=movement_data.customer_operation,
        order_id=movement_data.order_id,
        visit_id=movement_data.visit_id,
        description=movement_data.description,
        reference_number=movement_data.reference_number,
        created_by=current_user.id,
        created_by_name=current_user.full_name,
        created_by_role=current_user.role,
        metadata=movement_data.metadata
    )
    
    movement_dict = movement.dict()
    
    if movement_data.product_id:
        product = await db.products.find_one({"id": movement_data.product_id})
        if product:
            movement_dict["product_name"] = product.get("name")
    
    if movement_data.customer_id:
        clinic = await db.clinics.find_one({"id": movement_data.customer_id})
        if clinic:
            movement_dict["customer_name"] = clinic.get("name")
    
    await db.movement_logs.insert_one(movement_dict)
    
    return {"message": "Movement log created successfully", "movement_id": movement.id}

@api_router.get("/movement-logs")
async def get_movement_logs(
    warehouse_id: Optional[str] = None,
    line: Optional[str] = None,
    movement_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """الحصول على سجلات الحركة مع الفلترة"""
    if current_user.role not in [UserRole.ADMIN, "gm", UserRole.ACCOUNTING]:
        raise HTTPException(status_code=403, detail="Access denied. Only admin, GM, and accounting can access movement logs")
    
    filter_dict = {}
    
    if warehouse_id:
        filter_dict["warehouse_id"] = warehouse_id
    if line and line != "all":
        filter_dict["line"] = line
    if movement_type:
        filter_dict["movement_type"] = movement_type
    
    if date_from or date_to:
        date_filter = {}
        if date_from:
            try:
                date_filter["$gte"] = datetime.strptime(date_from, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")
        if date_to:
            try:
                date_filter["$lte"] = datetime.strptime(date_to, "%Y-%m-%d") + timedelta(days=1)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")
        filter_dict["movement_date"] = date_filter
    
    total_count = await db.movement_logs.count_documents(filter_dict)
    total_pages = (total_count + limit - 1) // limit
    
    skip = (page - 1) * limit
    movements = await db.movement_logs.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for movement in movements:
        if "_id" in movement:
            del movement["_id"]
        
        for date_field in ["movement_date", "created_at"]:
            if movement.get(date_field) and isinstance(movement[date_field], datetime):
                movement[date_field] = movement[date_field].isoformat()
    
    return {
        "movements": movements,
        "pagination": {
            "current_page": page,
            "total_pages": total_pages,
            "total_count": total_count,
            "limit": limit
        },
        "filter_applied": filter_dict
    }

# Technical Support System APIs
@api_router.post("/support/tickets")
async def create_support_ticket(ticket_data: SupportTicketCreate):
    """إنشاء تذكرة دعم فني جديدة - متاح للجميع"""
    try:
        ticket = SupportTicket(
            sender_name=ticket_data.sender_name,
            sender_position=ticket_data.sender_position,
            sender_whatsapp=ticket_data.sender_whatsapp,
            sender_email=ticket_data.sender_email,
            problem_description=ticket_data.problem_description,
            priority=ticket_data.priority,
            category=ticket_data.category
        )
        
        await db.support_tickets.insert_one(ticket.dict())
        
        return {
            "success": True,
            "message": "تم إنشاء تذكرة الدعم الفني بنجاح",
            "ticket_number": ticket.ticket_number,
            "ticket_id": ticket.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التذكرة: {str(e)}")

@api_router.get("/support/tickets")
async def get_support_tickets(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """الحصول على تذاكر الدعم الفني - للأدمن فقط"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    if priority:
        filter_dict["priority"] = priority
    if category:
        filter_dict["category"] = category
    
    total_count = await db.support_tickets.count_documents(filter_dict)
    total_pages = (total_count + limit - 1) // limit
    
    skip = (page - 1) * limit
    tickets = await db.support_tickets.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    for ticket in tickets:
        if "_id" in ticket:
            del ticket["_id"]
        
        for date_field in ["created_at", "updated_at", "resolved_at"]:
            if ticket.get(date_field) and isinstance(ticket[date_field], datetime):
                ticket[date_field] = ticket[date_field].isoformat()
    
    return {
        "tickets": tickets,
        "pagination": {"current_page": page, "total_pages": total_pages, "total_count": total_count, "limit": limit},
        "filters": filter_dict
    }

@api_router.get("/support/stats")
async def get_support_stats(current_user: User = Depends(get_current_user)):
    """إحصائيات الدعم الفني"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    
    total_tickets = await db.support_tickets.count_documents({})
    open_tickets = await db.support_tickets.count_documents({"status": "open"})
    in_progress_tickets = await db.support_tickets.count_documents({"status": "in_progress"})
    resolved_tickets = await db.support_tickets.count_documents({"status": "resolved"})
    closed_tickets = await db.support_tickets.count_documents({"status": "closed"})
    
    high_priority = await db.support_tickets.count_documents({"priority": "high"})
    urgent_priority = await db.support_tickets.count_documents({"priority": "urgent"})
    
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}]
    category_stats = await db.support_tickets.aggregate(pipeline).to_list(100)
    
    return {
        "total_tickets": total_tickets,
        "by_status": {
            "open": open_tickets,
            "in_progress": in_progress_tickets,
            "resolved": resolved_tickets,
            "closed": closed_tickets
        },
        "by_priority": {
            "high": high_priority,
            "urgent": urgent_priority,
            "total_critical": high_priority + urgent_priority
        },
        "by_category": {item["_id"]: item["count"] for item in category_stats}
    }

# Include router
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "EP Group System API - Clean Version", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": time.time() - startup_time
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)