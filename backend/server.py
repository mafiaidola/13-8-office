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

# Additional APIs - الـ APIs المفقودة
@api_router.get("/visits")
async def get_visits(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة الزيارات"""
    try:
        if current_user.role in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
            query = {"sales_rep_id": current_user.id}
        elif current_user.role in [UserRole.ADMIN, "gm", UserRole.LINE_MANAGER, UserRole.AREA_MANAGER]:
            query = {}
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        visits = await db.visits.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        
        for visit in visits:
            if "date" in visit and isinstance(visit["date"], datetime):
                visit["date"] = visit["date"].isoformat()
            if "created_at" in visit and isinstance(visit["created_at"], datetime):
                visit["created_at"] = visit["created_at"].isoformat()
        
        return visits
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/clinics")
async def get_clinics(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة العيادات"""
    try:
        if current_user.role in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
            query = {"assigned_rep_id": current_user.id}
        elif current_user.role in [UserRole.ADMIN, "gm", UserRole.LINE_MANAGER, UserRole.AREA_MANAGER]:
            query = {}
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        clinics = await db.clinics.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
        
        for clinic in clinics:
            if "created_at" in clinic and isinstance(clinic["created_at"], datetime):
                clinic["created_at"] = clinic["created_at"].isoformat()
            if "updated_at" in clinic and isinstance(clinic["updated_at"], datetime):
                clinic["updated_at"] = clinic["updated_at"].isoformat()
        
        return clinics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/doctors")
async def get_doctors(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة الأطباء"""
    try:
        if current_user.role in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
            # Get clinics assigned to this rep first
            user_clinics = await db.clinics.find({"assigned_rep_id": current_user.id}, {"id": 1}).to_list(500)
            clinic_ids = [clinic["id"] for clinic in user_clinics]
            query = {"clinic_id": {"$in": clinic_ids}} if clinic_ids else {"clinic_id": "none"}
        elif current_user.role in [UserRole.ADMIN, "gm", UserRole.LINE_MANAGER, UserRole.AREA_MANAGER]:
            query = {}
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        doctors = await db.doctors.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
        
        for doctor in doctors:
            if "created_at" in doctor and isinstance(doctor["created_at"], datetime):
                doctor["created_at"] = doctor["created_at"].isoformat()
        
        return doctors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/products")
async def get_products(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة المنتجات"""
    try:
        query = {"is_active": True}
        
        # Filter by line if user has line assignment
        if hasattr(current_user, 'line') and current_user.line:
            query["line"] = current_user.line
        
        products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).limit(500).to_list(500)
        
        for product in products:
            if "created_at" in product and isinstance(product["created_at"], datetime):
                product["created_at"] = product["created_at"].isoformat()
        
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/warehouses")
async def get_warehouses(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة المخازن"""
    try:
        query = {"is_active": True}
        warehouses = await db.warehouses.find(query, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
        
        for warehouse in warehouses:
            if "created_at" in warehouse and isinstance(warehouse["created_at"], datetime):
                warehouse["created_at"] = warehouse["created_at"].isoformat()
            if "updated_at" in warehouse and isinstance(warehouse["updated_at"], datetime):
                warehouse["updated_at"] = warehouse["updated_at"].isoformat()
        
        return warehouses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/orders")
async def get_orders(current_user: User = Depends(get_current_user)):
    """الحصول على قائمة الطلبات"""
    try:
        if current_user.role in [UserRole.MEDICAL_REP, UserRole.KEY_ACCOUNT]:
            query = {"medical_rep_id": current_user.id}
        elif current_user.role in [UserRole.ADMIN, "gm", UserRole.LINE_MANAGER, UserRole.AREA_MANAGER, UserRole.ACCOUNTING, UserRole.WAREHOUSE_KEEPER]:
            query = {}
        else:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).limit(200).to_list(200)
        
        for order in orders:
            if "created_at" in order and isinstance(order["created_at"], datetime):
                order["created_at"] = order["created_at"].isoformat()
            if "updated_at" in order and isinstance(order["updated_at"], datetime):
                order["updated_at"] = order["updated_at"].isoformat()
        
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# LINES AND AREAS MANAGEMENT APIs
# ============================================================================

@api_router.post("/lines")
async def create_line(line_data: LineCreate, current_user: User = Depends(get_current_user)):
    """إنشاء خط جديد - Create new line"""
    # Check permissions
    if current_user.role not in ["admin", "gm", "line_manager"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء خطوط")
    
    try:
        # Check if line code already exists
        existing_line = await db.lines.find_one({"code": line_data.code})
        if existing_line:
            raise HTTPException(status_code=400, detail="رمز الخط موجود بالفعل")
        
        # Create line
        line = Line(**line_data.dict(), created_by=current_user.id)
        
        # If manager is assigned, get manager name
        if line.manager_id:
            manager = await db.users.find_one({"id": line.manager_id})
            if manager:
                line.manager_name = manager.get("full_name", "")
        
        # If products are assigned, get product names
        if line.assigned_products:
            products = await db.products.find({"id": {"$in": line.assigned_products}}).to_list(100)
            line.assigned_product_names = [p.get("name", "") for p in products]
        
        # If areas are assigned, get area names
        if line.coverage_areas:
            areas = await db.areas.find({"id": {"$in": line.coverage_areas}}).to_list(100)
            line.coverage_area_names = [a.get("name", "") for a in areas]
        
        await db.lines.insert_one(line.dict())
        
        return {"success": True, "message": "تم إنشاء الخط بنجاح", "line": line}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating line: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الخط")


@api_router.get("/lines")
async def get_lines(current_user: User = Depends(get_current_user)):
    """الحصول على جميع الخطوط - Get all lines"""
    try:
        query = {"is_active": True}
        
        # Role-based filtering
        if current_user.role == "line_manager":
            query["manager_id"] = current_user.id
        
        lines = await db.lines.find(query, {"_id": 0}).to_list(1000)
        
        # Enrich lines with additional data
        for line in lines:
            # Get manager name if exists
            if line.get("manager_id"):
                manager = await db.users.find_one({"id": line["manager_id"]})
                line["manager_name"] = manager.get("full_name", "") if manager else ""
            
            # Get product names
            if line.get("assigned_products"):
                products = await db.products.find({"id": {"$in": line["assigned_products"]}}).to_list(100)
                line["assigned_product_names"] = [p.get("name", "") for p in products]
            
            # Get area names
            if line.get("coverage_areas"):
                areas = await db.areas.find({"id": {"$in": line["coverage_areas"]}}).to_list(100)
                line["coverage_area_names"] = [a.get("name", "") for a in areas]
            
            # Calculate statistics
            total_sales_reps = await db.users.count_documents({
                "assigned_line_id": line["id"],
                "role": {"$in": ["sales_rep", "medical_rep"]},
                "is_active": True
            })
            line["total_sales_reps"] = total_sales_reps
        
        return lines
    
    except Exception as e:
        print(f"Error fetching lines: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الخطوط")


@api_router.put("/lines/{line_id}")
async def update_line(line_id: str, line_data: LineCreate, current_user: User = Depends(get_current_user)):
    """تحديث خط - Update line"""
    # Check permissions
    if current_user.role not in ["admin", "gm", "line_manager"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث الخطوط")
    
    try:
        existing_line = await db.lines.find_one({"id": line_id})
        if not existing_line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # Role-based access control
        if current_user.role == "line_manager" and existing_line.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث هذا الخط")
        
        # Update line
        update_data = line_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        # Enrich with related data
        if update_data.get("manager_id"):
            manager = await db.users.find_one({"id": update_data["manager_id"]})
            update_data["manager_name"] = manager.get("full_name", "") if manager else ""
        
        if update_data.get("assigned_products"):
            products = await db.products.find({"id": {"$in": update_data["assigned_products"]}}).to_list(100)
            update_data["assigned_product_names"] = [p.get("name", "") for p in products]
        
        if update_data.get("coverage_areas"):
            areas = await db.areas.find({"id": {"$in": update_data["coverage_areas"]}}).to_list(100)
            update_data["coverage_area_names"] = [a.get("name", "") for a in areas]
        
        await db.lines.update_one({"id": line_id}, {"$set": update_data})
        
        return {"success": True, "message": "تم تحديث الخط بنجاح"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating line: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث الخط")


@api_router.delete("/lines/{line_id}")
async def delete_line(line_id: str, current_user: User = Depends(get_current_user)):
    """حذف خط - Delete line"""
    # Check permissions
    if current_user.role not in ["admin", "gm"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف الخطوط")
    
    try:
        # Soft delete - set is_active to false
        await db.lines.update_one(
            {"id": line_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "message": "تم حذف الخط بنجاح"}
    
    except Exception as e:
        print(f"Error deleting line: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف الخط")


# ============================================================================
# AREAS MANAGEMENT APIs
# ============================================================================

@api_router.post("/areas")
async def create_area(area_data: AreaCreate, current_user: User = Depends(get_current_user)):
    """إنشاء منطقة جديدة - Create new area"""
    # Check permissions
    if current_user.role not in ["admin", "gm", "area_manager"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء مناطق")
    
    try:
        # Check if area code already exists
        existing_area = await db.areas.find_one({"code": area_data.code})
        if existing_area:
            raise HTTPException(status_code=400, detail="رمز المنطقة موجود بالفعل")
        
        # Create area
        area = Area(**area_data.dict(), created_by=current_user.id)
        
        # If parent line is assigned, get line name
        if area.parent_line_id:
            line = await db.lines.find_one({"id": area.parent_line_id})
            if line:
                area.parent_line_name = line.get("name", "")
        
        # If manager is assigned, get manager name
        if area.manager_id:
            manager = await db.users.find_one({"id": area.manager_id})
            if manager:
                area.manager_name = manager.get("full_name", "")
        
        await db.areas.insert_one(area.dict())
        
        return {"success": True, "message": "تم إنشاء المنطقة بنجاح", "area": area}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating area: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء المنطقة")


@api_router.get("/areas")
async def get_areas(current_user: User = Depends(get_current_user)):
    """الحصول على جميع المناطق - Get all areas"""
    try:
        query = {"is_active": True}
        
        # Role-based filtering
        if current_user.role == "area_manager":
            query["manager_id"] = current_user.id
        elif current_user.role == "line_manager":
            # Line managers see areas under their lines
            managed_lines = await db.lines.find({"manager_id": current_user.id}).to_list(100)
            line_ids = [line["id"] for line in managed_lines]
            query["parent_line_id"] = {"$in": line_ids}
        
        areas = await db.areas.find(query, {"_id": 0}).to_list(1000)
        
        # Enrich areas with additional data
        for area in areas:
            # Get parent line name
            if area.get("parent_line_id"):
                line = await db.lines.find_one({"id": area["parent_line_id"]})
                area["parent_line_name"] = line.get("name", "") if line else ""
            
            # Get manager name
            if area.get("manager_id"):
                manager = await db.users.find_one({"id": area["manager_id"]})
                area["manager_name"] = manager.get("full_name", "") if manager else ""
            
            # Calculate statistics
            total_clinics = await db.clinics.count_documents({
                "area_id": area["id"],
                "is_active": True
            })
            total_visits = await db.visits.count_documents({
                "clinic_area_id": area["id"]
            })
            
            area["total_clinics"] = total_clinics
            area["total_visits"] = total_visits
        
        return areas
    
    except Exception as e:
        print(f"Error fetching areas: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المناطق")


@api_router.put("/areas/{area_id}")
async def update_area(area_id: str, area_data: AreaCreate, current_user: User = Depends(get_current_user)):
    """تحديث منطقة - Update area"""
    # Check permissions
    if current_user.role not in ["admin", "gm", "area_manager"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث المناطق")
    
    try:
        existing_area = await db.areas.find_one({"id": area_id})
        if not existing_area:
            raise HTTPException(status_code=404, detail="المنطقة غير موجودة")
        
        # Role-based access control
        if current_user.role == "area_manager" and existing_area.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث هذه المنطقة")
        
        # Update area
        update_data = area_data.dict()
        update_data["updated_at"] = datetime.utcnow()
        
        # Enrich with related data
        if update_data.get("parent_line_id"):
            line = await db.lines.find_one({"id": update_data["parent_line_id"]})
            update_data["parent_line_name"] = line.get("name", "") if line else ""
        
        if update_data.get("manager_id"):
            manager = await db.users.find_one({"id": update_data["manager_id"]})
            update_data["manager_name"] = manager.get("full_name", "") if manager else ""
        
        await db.areas.update_one({"id": area_id}, {"$set": update_data})
        
        return {"success": True, "message": "تم تحديث المنطقة بنجاح"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating area: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث المنطقة")


@api_router.delete("/areas/{area_id}")
async def delete_area(area_id: str, current_user: User = Depends(get_current_user)):
    """حذف منطقة - Delete area"""
    # Check permissions
    if current_user.role not in ["admin", "gm"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف المناطق")
    
    try:
        # Soft delete - set is_active to false
        await db.areas.update_one(
            {"id": area_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "message": "تم حذف المنطقة بنجاح"}
    
    except Exception as e:
        print(f"Error deleting area: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف المنطقة")


# ============================================================================
# LINE PRODUCT ASSIGNMENT APIs
# ============================================================================

@api_router.post("/lines/{line_id}/products")
async def assign_products_to_line(line_id: str, assignment: LineProductAssignment, current_user: User = Depends(get_current_user)):
    """تخصيص منتجات للخط - Assign products to line"""
    # Check permissions
    if current_user.role not in ["admin", "gm", "line_manager"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بتخصيص المنتجات")
    
    try:
        # Check if line exists
        line = await db.lines.find_one({"id": line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # Role-based access control
        if current_user.role == "line_manager" and line.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث هذا الخط")
        
        # Verify products exist
        products = await db.products.find({"id": {"$in": assignment.product_ids}}).to_list(100)
        if len(products) != len(assignment.product_ids):
            raise HTTPException(status_code=400, detail="بعض المنتجات غير موجودة")
        
        product_names = [p.get("name", "") for p in products]
        
        # Update line with new products
        await db.lines.update_one(
            {"id": line_id},
            {
                "$set": {
                    "assigned_products": assignment.product_ids,
                    "assigned_product_names": product_names,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Record assignment history
        assignment_record = assignment.dict()
        assignment_record["assigned_by"] = current_user.id
        assignment_record["assigned_by_name"] = current_user.full_name or ""
        await db.line_product_assignments.insert_one(assignment_record)
        
        return {"success": True, "message": "تم تخصيص المنتجات للخط بنجاح"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error assigning products to line: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تخصيص المنتجات")


@api_router.get("/lines/{line_id}/products")
async def get_line_products(line_id: str, current_user: User = Depends(get_current_user)):
    """الحصول على منتجات الخط - Get line products"""
    try:
        line = await db.lines.find_one({"id": line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط غير موجود")
        
        # Role-based access control
        if current_user.role == "line_manager" and line.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض هذا الخط")
        
        product_ids = line.get("assigned_products", [])
        if not product_ids:
            return []
        
        products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
        return products
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching line products: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب منتجات الخط")


# ============================================================================
# GEOGRAPHIC STATISTICS API
# ============================================================================

@api_router.get("/geographic/statistics")
async def get_geographic_statistics(current_user: User = Depends(get_current_user)):
    """إحصائيات جغرافية شاملة - Comprehensive geographic statistics"""
    try:
        # Calculate statistics
        total_lines = await db.lines.count_documents({})
        active_lines = await db.lines.count_documents({"is_active": True})
        
        total_areas = await db.areas.count_documents({})
        active_areas = await db.areas.count_documents({"is_active": True})
        
        total_districts = await db.districts.count_documents({})
        active_districts = await db.districts.count_documents({"is_active": True})
        
        # Count assigned products across all lines
        lines_with_products = await db.lines.find(
            {"assigned_products": {"$exists": True, "$ne": []}},
            {"assigned_products": 1}
        ).to_list(1000)
        
        all_assigned_products = set()
        for line in lines_with_products:
            all_assigned_products.update(line.get("assigned_products", []))
        
        total_assigned_products = len(all_assigned_products)
        
        # Count coverage clinics
        total_coverage_clinics = await db.clinics.count_documents({"is_active": True})
        
        # Calculate average achievement percentage
        active_lines_list = await db.lines.find(
            {"is_active": True, "achievement_percentage": {"$exists": True}},
            {"achievement_percentage": 1}
        ).to_list(1000)
        
        if active_lines_list:
            total_achievement = sum(line.get("achievement_percentage", 0) for line in active_lines_list)
            average_achievement_percentage = total_achievement / len(active_lines_list)
        else:
            average_achievement_percentage = 0.0
        
        statistics = GeographicStatistics(
            total_lines=total_lines,
            active_lines=active_lines,
            total_areas=total_areas,
            active_areas=active_areas,
            total_districts=total_districts,
            active_districts=active_districts,
            total_assigned_products=total_assigned_products,
            total_coverage_clinics=total_coverage_clinics,
            average_achievement_percentage=round(average_achievement_percentage, 2)
        )
        
        return statistics
    
    except Exception as e:
        print(f"Error fetching geographic statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الإحصائيات الجغرافية")


# ============================================================================
# PRODUCTS MANAGEMENT APIs
# ============================================================================

@api_router.post("/products")
async def create_product(product_data: dict, current_user: User = Depends(get_current_user)):
    """إنشاء منتج جديد - Create new product"""
    # Check permissions
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بإنشاء منتجات")
    
    try:
        # Validate required fields
        required_fields = ["name", "unit", "line_id", "price", "price_type"]
        for field in required_fields:
            if field not in product_data or not product_data[field]:
                raise HTTPException(status_code=400, detail=f"الحقل {field} مطلوب")
        
        # Get line name
        line = await db.lines.find_one({"id": product_data["line_id"]})
        if not line:
            raise HTTPException(status_code=400, detail="الخط المحدد غير موجود")
        
        # Create product
        new_product = {
            "id": str(uuid.uuid4()),
            "name": product_data["name"],
            "description": product_data.get("description", ""),
            "category": product_data.get("category", ""),
            "unit": product_data["unit"],
            "line_id": product_data["line_id"],
            "line_name": line["name"],
            "price": float(product_data["price"]),
            "price_type": product_data["price_type"],
            "current_stock": int(product_data.get("current_stock", 0)),
            "is_active": product_data.get("is_active", True),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": current_user["id"]
        }
        
        await db.products.insert_one(new_product)
        
        return {"success": True, "message": "تم إنشاء المنتج بنجاح", "product": new_product}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating product: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء المنتج")


@api_router.get("/products")
async def get_products(current_user: User = Depends(get_current_user)):
    """الحصول على جميع المنتجات - Get all products"""
    try:
        products = await db.products.find({}, {"_id": 0}).to_list(1000)
        
        # Enrich products with line names if missing
        for product in products:
            if not product.get("line_name") and product.get("line_id"):
                line = await db.lines.find_one({"id": product["line_id"]})
                if line:
                    product["line_name"] = line["name"]
                    # Update in database
                    await db.products.update_one(
                        {"id": product["id"]},
                        {"$set": {"line_name": line["name"]}}
                    )
        
        return products
    
    except Exception as e:
        print(f"Error fetching products: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب المنتجات")


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product_data: dict, current_user: User = Depends(get_current_user)):
    """تحديث منتج - Update product"""
    # Check permissions
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بتحديث المنتجات")
    
    try:
        existing_product = await db.products.find_one({"id": product_id})
        if not existing_product:
            raise HTTPException(status_code=404, detail="المنتج غير موجود")
        
        # Get line name if line_id is updated
        if "line_id" in product_data and product_data["line_id"]:
            line = await db.lines.find_one({"id": product_data["line_id"]})
            if line:
                product_data["line_name"] = line["name"]
        
        # Update product
        update_data = product_data.copy()
        update_data["updated_at"] = datetime.utcnow()
        
        # Convert numeric fields
        if "price" in update_data:
            update_data["price"] = float(update_data["price"])
        if "current_stock" in update_data:
            update_data["current_stock"] = int(update_data["current_stock"])
        
        await db.products.update_one({"id": product_id}, {"$set": update_data})
        
        return {"success": True, "message": "تم تحديث المنتج بنجاح"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating product: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في تحديث المنتج")


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: User = Depends(get_current_user)):
    """حذف منتج - Delete product"""
    # Check permissions
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بحذف المنتجات")
    
    try:
        # Soft delete - set is_active to false
        await db.products.update_one(
            {"id": product_id},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
        
        return {"success": True, "message": "تم حذف المنتج بنجاح"}
    
    except Exception as e:
        print(f"Error deleting product: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في حذف المنتج")


# Include routers
from routes.auth_routes import router as auth_router
from routes.dashboard_routes import router as dashboard_router
from routes.settings_routes import router as settings_router

api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(settings_router)

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