from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import hashlib
import math
from passlib.context import CryptContext

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
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# User Roles with Hierarchy
class UserRole:
    ADMIN = "admin"  # Level 4 - Full control
    WAREHOUSE_MANAGER = "warehouse_manager"  # Level 3 - Manage warehouses
    MANAGER = "manager"  # Level 2 - Manage sales reps
    SALES_REP = "sales_rep"  # Level 1 - Basic operations
    
    # Role hierarchy for permissions
    ROLE_HIERARCHY = {
        "admin": 4,
        "warehouse_manager": 3,
        "manager": 2,
        "accounting": 2,  # Added accounting role
        "sales_rep": 1
    }
    
    @classmethod
    def can_manage(cls, manager_role: str, target_role: str) -> bool:
        """Check if manager_role can manage target_role"""
        manager_level = cls.ROLE_HIERARCHY.get(manager_role, 0)
        target_level = cls.ROLE_HIERARCHY.get(target_role, 0)
        return manager_level > target_level

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    role: str
    full_name: str
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: Optional[str] = None  # who created this user
    managed_by: Optional[str] = None  # direct manager
    permissions: List[str] = []

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    price: float  # Egyptian Pounds (EGP)
    price_before_discount: float  # Original price before discount
    discount_percentage: float = 0.0  # Discount percentage (0-100)
    category: str
    unit: str  # piece, box, bottle, etc.
    image: Optional[str] = None  # base64 image
    currency: str = "EGP"  # Egyptian Pounds only
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str
    approved_by: Optional[str] = None  # Admin approval required

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_before_discount: float
    discount_percentage: float = 0.0
    category: str
    unit: str
    image: Optional[str] = None

class Warehouse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    location: str
    address: str
    manager_id: str  # warehouse manager
    warehouse_number: int  # 1-5 for the 5 warehouses
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WarehouseCreate(BaseModel):
    name: str
    location: str
    address: str
    manager_id: str
    warehouse_number: int

class Inventory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    warehouse_id: str
    product_id: str
    quantity: int
    minimum_stock: int = 10
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

class InventoryUpdate(BaseModel):
    quantity: int
    minimum_stock: Optional[int] = None

class StockMovement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    warehouse_id: str
    product_id: str
    movement_type: str  # IN, OUT, ADJUSTMENT
    quantity: int
    reason: str
    reference_id: Optional[str] = None  # order_id or visit_id
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visit_id: str
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    warehouse_id: str
    status: str  # PENDING, APPROVED, REJECTED, FULFILLED
    order_type: str  # DEMO, SALE
    total_amount: float = 0.0
    approved_by: Optional[str] = None
    fulfilled_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None

class OrderItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    product_id: str
    quantity: int
    unit_price: float
    total_price: float

class OrderCreate(BaseModel):
    visit_id: str
    doctor_id: str
    clinic_id: str
    warehouse_id: str
    order_type: str
    items: List[Dict[str, Any]]  # [{product_id, quantity}]
    notes: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    full_name: str
    phone: Optional[str] = None
    managed_by: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class Clinic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    added_by: str  # user_id of sales rep
    approved_by: Optional[str] = None  # admin user_id
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicCreate(BaseModel):
    name: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None

class Doctor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    specialty: str
    clinic_id: str
    phone: Optional[str] = None
    email: Optional[str] = None
    added_by: str  # user_id of sales rep
    approved_by: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorCreate(BaseModel):
    name: str
    specialty: str
    clinic_id: str
    phone: Optional[str] = None
    email: Optional[str] = None

# Enhanced Models for Phase 2 and improvements
class SystemSettings(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    logo_image: Optional[str] = None  # base64 image for login page
    company_name: str = "نظام إدارة المناديب"
    primary_color: str = "#ff6b35"
    secondary_color: str = "#0ea5e9"
    # New enhanced settings
    available_themes: List[str] = ["dark", "light", "blue", "green", "purple"]
    default_theme: str = "dark"
    available_roles: List[str] = ["admin", "manager", "sales_rep", "warehouse_manager", "accounting"]
    role_permissions: Dict[str, List[str]] = {
        "admin": ["all"],
        "manager": ["users.view", "visits.view", "doctors.approve", "orders.approve"],
        "sales_rep": ["visits.create", "doctors.create", "orders.create"],
        "warehouse_manager": ["inventory.manage", "orders.fulfill"],
        "accounting": ["reports.view", "financial.view"]
    }
    display_mode: str = "grid"  # grid, list, compact
    language: str = "ar"  # ar, en
    notifications_enabled: bool = True
    chat_enabled: bool = True
    voice_notes_enabled: bool = True
    updated_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Achievement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    icon: str  # emoji or image
    points: int
    category: str  # VISITS, SALES, DOCTORS, CLINICS
    criteria: Dict[str, Any]  # conditions to unlock
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserPoints(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    total_points: int = 0
    level: int = 1
    achievements_unlocked: List[str] = []  # achievement IDs
    monthly_points: int = 0
    weekly_points: int = 0
    daily_points: int = 0
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PointsTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    points: int  # positive for earned, negative for spent
    reason: str
    activity_type: str  # VISIT, ORDER, ACHIEVEMENT, PENALTY
    reference_id: Optional[str] = None  # related activity ID
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorRating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    rated_by: str  # sales rep user_id
    visit_id: str
    rating: int  # 1-5 stars
    feedback: Optional[str] = None
    categories: Dict[str, int] = {}  # cooperation: 5, interest: 4, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicRating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_id: str
    rated_by: str  # sales rep user_id
    visit_id: str
    rating: int  # 1-5 stars
    feedback: Optional[str] = None
    categories: Dict[str, int] = {}  # accessibility: 5, staff: 4, environment: 3
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    preferred_products: List[str] = []  # product IDs
    preferred_visit_times: str = "morning"  # morning, afternoon, evening
    communication_preference: str = "phone"  # phone, email, whatsapp
    language_preference: str = "ar"  # ar, en
    notes: Optional[str] = None
    updated_by: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LoyaltyProgram(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_id: str
    tier: str = "BRONZE"  # BRONZE, SILVER, GOLD, PLATINUM
    points_earned: int = 0
    total_orders: int = 0
    total_visits: int = 0
    benefits: List[str] = []  # discounts, priority service, etc.
    last_order_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    scheduled_date: datetime
    duration_minutes: int = 30
    purpose: str
    status: str = "SCHEDULED"  # SCHEDULED, CONFIRMED, COMPLETED, CANCELLED
    notes: Optional[str] = None
    reminder_sent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced User model
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    password_hash: str
    full_name: str
    role: str  # Changed from UserRole to str to fix Pydantic issue
    phone: Optional[str] = None
    manager_id: Optional[str] = None
    is_active: bool = True
    # New fields for enhanced user management
    hire_date: Optional[datetime] = None
    department: Optional[str] = None
    employee_id: Optional[str] = None
    profile_image: Optional[str] = None  # base64
    permissions: List[str] = []  # custom permissions
    last_login: Optional[datetime] = None
    login_attempts: int = 0
    is_locked: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    message: str
    type: str  # SUCCESS, WARNING, ERROR, INFO, REMINDER
    recipient_id: str
    sender_id: Optional[str] = None
    is_read: bool = False
    data: Optional[Dict[str, Any]] = None  # Additional data for actions
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None

class ChatMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    sender_id: str
    recipient_id: str
    message_text: Optional[str] = None
    voice_note: Optional[str] = None  # base64 audio
    message_type: str = "TEXT"  # TEXT, VOICE, IMAGE, FILE
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participants: List[str]  # user IDs
    title: Optional[str] = None
    last_message_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoiceNote(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    visit_id: str
    audio_data: str  # base64 encoded audio
    duration: int  # in seconds
    transcript: Optional[str] = None  # AI-generated transcript
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Updated Visit model to include voice notes
class Visit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    visit_date: datetime = Field(default_factory=datetime.utcnow)
    latitude: float
    longitude: float
    notes: str
    voice_notes: List[str] = []  # List of voice note IDs
    is_effective: Optional[bool] = None  # To be evaluated by manager
    effectiveness_rating: Optional[int] = None  # 1-5 stars
    reviewed_by: Optional[str] = None  # manager user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    clinic_name: str
    clinic_phone: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_address: str
    clinic_manager_name: str
    latitude: float
    longitude: float
    address: str
    clinic_image: Optional[str] = None  # base64 image
    notes: str
    sales_rep_id: str
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    reviewed_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ClinicRequestCreate(BaseModel):
    clinic_name: str
    clinic_phone: Optional[str] = None
    doctor_name: str
    doctor_specialty: str
    doctor_address: str
    clinic_manager_name: str
    latitude: float
    longitude: float
    address: str
    clinic_image: Optional[str] = None
    notes: str

class VisitCreate(BaseModel):
    doctor_id: str
    clinic_id: str
    latitude: float
    longitude: float
    notes: str

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
    return User(**user)

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters"""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

# Authentication Routes
@api_router.post("/auth/register")
async def register_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Check permissions based on role hierarchy
    if not UserRole.can_manage(current_user.role, user_data.role):
        raise HTTPException(status_code=403, detail="You don't have permission to create this role")
    
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        role=user_data.role,
        full_name=user_data.full_name,
        phone=user_data.phone,
        created_by=current_user.id,
        managed_by=user_data.managed_by or current_user.id
    )
    
    await db.users.insert_one(user.dict())
    return {"message": "User created successfully", "user_id": user.id}

# User Management Routes
@api_router.get("/users", response_model=List[Dict[str, Any]])
async def get_users(current_user: User = Depends(get_current_user)):
    query = {}
    
    # Role-based filtering
    if current_user.role == UserRole.MANAGER:
        # Managers can only see their subordinates
        query = {"$or": [
            {"managed_by": current_user.id},
            {"created_by": current_user.id},
            {"role": UserRole.SALES_REP}
        ]}
    elif current_user.role == UserRole.WAREHOUSE_MANAGER:
        # Warehouse managers can see sales reps and managers
        query = {"role": {"$in": [UserRole.SALES_REP, UserRole.MANAGER]}}
    elif current_user.role == UserRole.SALES_REP:
        # Sales reps can only see themselves
        query = {"id": current_user.id}
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Add creator and manager names
    for user in users:
        if user.get("created_by"):
            creator = await db.users.find_one({"id": user["created_by"]}, {"_id": 0})
            user["created_by_name"] = creator["full_name"] if creator else "Unknown"
        
        if user.get("managed_by"):
            manager = await db.users.find_one({"id": user["managed_by"]}, {"_id": 0})
            user["manager_name"] = manager["full_name"] if manager else "Unknown"
    
    return users

@api_router.patch("/users/{user_id}/status")
async def toggle_user_status(user_id: str, current_user: User = Depends(get_current_user)):
    # Find the target user
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check permissions
    if not UserRole.can_manage(current_user.role, target_user["role"]):
        raise HTTPException(status_code=403, detail="You don't have permission to modify this user")
    
    new_status = not target_user["is_active"]
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status}}
    )
    
    action = "activated" if new_status else "deactivated"
    return {"message": f"User {action} successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete users")
    
    # Don't allow deleting admin users
    target_user = await db.users.find_one({"id": user_id})
    if target_user and target_user["role"] == UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Cannot delete admin users")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

# Product Management Routes
@api_router.post("/products")
async def create_product(product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    # Only Admin can create products - Warehouse managers need admin approval
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create products")
    
    # Calculate discounted price
    discounted_price = product_data.price_before_discount * (1 - product_data.discount_percentage / 100)
    
    product = Product(
        name=product_data.name,
        description=product_data.description,
        price=discounted_price,
        price_before_discount=product_data.price_before_discount,
        discount_percentage=product_data.discount_percentage,
        category=product_data.category,
        unit=product_data.unit,
        image=product_data.image,
        currency="EGP",
        created_by=current_user.id,
        approved_by=current_user.id  # Auto-approved when admin creates
    )
    
    await db.products.insert_one(product.dict())
    return {"message": "Product created successfully", "product_id": product.id}

@api_router.get("/products", response_model=List[Dict[str, Any]])
async def get_products(current_user: User = Depends(get_current_user)):
    products = await db.products.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    # Add creator information
    for product in products:
        creator = await db.users.find_one({"id": product["created_by"]}, {"_id": 0})
        product["created_by_name"] = creator["full_name"] if creator else "Unknown"
    
    return products

@api_router.patch("/products/{product_id}")
async def update_product(product_id: str, product_data: ProductCreate, current_user: User = Depends(get_current_user)):
    # Only Admin can update products - Warehouse managers need admin approval
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update products")
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": product_data.dict()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated successfully"}

# Warehouse Management Routes
@api_router.post("/warehouses")
async def create_warehouse(warehouse_data: WarehouseCreate, current_user: User = Depends(get_current_user)):
    # Only Admin can create warehouses - Warehouse managers need admin approval
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create warehouses")
    
    # Verify manager exists and has correct role
    manager = await db.users.find_one({"id": warehouse_data.manager_id})
    if not manager or manager["role"] not in [UserRole.WAREHOUSE_MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid warehouse manager")
    
    # Check if warehouse number is valid (1-5)
    if warehouse_data.warehouse_number < 1 or warehouse_data.warehouse_number > 5:
        raise HTTPException(status_code=400, detail="Warehouse number must be between 1 and 5")
    
    # Check if warehouse number already exists
    existing_warehouse = await db.warehouses.find_one({"warehouse_number": warehouse_data.warehouse_number})
    if existing_warehouse:
        raise HTTPException(status_code=400, detail=f"Warehouse number {warehouse_data.warehouse_number} already exists")
    
    warehouse = Warehouse(
        name=warehouse_data.name,
        location=warehouse_data.location,
        address=warehouse_data.address,
        manager_id=warehouse_data.manager_id,
        warehouse_number=warehouse_data.warehouse_number
    )
    
    await db.warehouses.insert_one(warehouse.dict())
    return {"message": "Warehouse created successfully", "warehouse_id": warehouse.id}

@api_router.get("/warehouses", response_model=List[Dict[str, Any]])
async def get_warehouses(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
        query = {"manager_id": current_user.id}
    
    warehouses = await db.warehouses.find(query, {"_id": 0}).to_list(1000)
    
    # Add manager information
    for warehouse in warehouses:
        manager = await db.users.find_one({"id": warehouse["manager_id"]}, {"_id": 0})
        warehouse["manager_name"] = manager["full_name"] if manager else "Unknown"
    
    return warehouses

# Inventory Management Routes
@api_router.post("/inventory/{warehouse_id}/{product_id}")
async def update_inventory(warehouse_id: str, product_id: str, inventory_data: InventoryUpdate, current_user: User = Depends(get_current_user)):
    # Only Admin and warehouse managers can update inventory
    if current_user.role not in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Only admin and warehouse managers can update inventory")
    
    # Check if warehouse manager has access to this warehouse
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
        warehouse = await db.warehouses.find_one({"id": warehouse_id, "manager_id": current_user.id})
        if not warehouse:
            raise HTTPException(status_code=403, detail="You don't have access to this warehouse")
    
    # Get current inventory
    current_inventory = await db.inventory.find_one({"warehouse_id": warehouse_id, "product_id": product_id})
    old_quantity = current_inventory["quantity"] if current_inventory else 0
    
    # Update or create inventory record
    inventory = {
        "warehouse_id": warehouse_id,
        "product_id": product_id,
        "quantity": inventory_data.quantity,
        "minimum_stock": inventory_data.minimum_stock or (current_inventory["minimum_stock"] if current_inventory else 10),
        "last_updated": datetime.utcnow(),
        "updated_by": current_user.id
    }
    
    await db.inventory.update_one(
        {"warehouse_id": warehouse_id, "product_id": product_id},
        {"$set": inventory},
        upsert=True
    )
    
    # Record stock movement
    movement_type = "ADJUSTMENT"
    quantity_change = inventory_data.quantity - old_quantity
    
    if quantity_change != 0:
        movement = StockMovement(
            warehouse_id=warehouse_id,
            product_id=product_id,
            movement_type=movement_type,
            quantity=abs(quantity_change),
            reason=f"Manual adjustment: {quantity_change:+d}",
            created_by=current_user.id
        )
        await db.stock_movements.insert_one(movement.dict())
    
    return {"message": "Inventory updated successfully"}

@api_router.get("/inventory/{warehouse_id}", response_model=List[Dict[str, Any]])
async def get_warehouse_inventory(warehouse_id: str, current_user: User = Depends(get_current_user)):
    # Check permissions
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
        warehouse = await db.warehouses.find_one({"id": warehouse_id, "manager_id": current_user.id})
        if not warehouse:
            raise HTTPException(status_code=403, detail="You don't have access to this warehouse")
    elif current_user.role == UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Sales reps cannot view inventory")
    
    inventory_items = await db.inventory.find({"warehouse_id": warehouse_id}, {"_id": 0}).to_list(1000)
    
    # Enrich with product information
    for item in inventory_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item["product_name"] = product["name"]
            item["product_price"] = product["price"]
            item["product_unit"] = product["unit"]
            item["product_category"] = product["category"]
        
        # Add low stock warning
        item["low_stock"] = item["quantity"] <= item["minimum_stock"]
    
    return inventory_items

# Reports Routes
@api_router.get("/reports/inventory")
async def get_inventory_report(current_user: User = Depends(get_current_user)):
    # Only Admin and warehouse managers can access inventory reports
    if current_user.role not in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get all inventory with low stock items
    pipeline = [
        {
            "$lookup": {
                "from": "products",
                "localField": "product_id",
                "foreignField": "id",
                "as": "product"
            }
        },
        {
            "$lookup": {
                "from": "warehouses", 
                "localField": "warehouse_id",
                "foreignField": "id",
                "as": "warehouse"
            }
        },
        {
            "$unwind": "$product"
        },
        {
            "$unwind": "$warehouse"
        },
        {
            "$project": {
                "_id": 0,
                "warehouse_name": "$warehouse.name",
                "product_name": "$product.name",
                "quantity": 1,
                "minimum_stock": 1,
                "low_stock": {"$lte": ["$quantity", "$minimum_stock"]},
                "total_value": {"$multiply": ["$quantity", "$product.price"]}
            }
        }
    ]
    
    try:
        # Note: MongoDB aggregation might not work with motor, so we'll do it manually
        query = {}
        if current_user.role == UserRole.WAREHOUSE_MANAGER:
            # Warehouse managers only see their warehouses
            my_warehouses = await db.warehouses.find({"manager_id": current_user.id}).to_list(100)
            warehouse_ids = [w["id"] for w in my_warehouses]
            query = {"warehouse_id": {"$in": warehouse_ids}}
            
        inventory_items = await db.inventory.find(query, {"_id": 0}).to_list(1000)
        report_data = []
        
        for item in inventory_items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            warehouse = await db.warehouses.find_one({"id": item["warehouse_id"]}, {"_id": 0})
            
            if product and warehouse:
                report_item = {
                    "warehouse_name": warehouse["name"],
                    "warehouse_number": warehouse.get("warehouse_number", 0),
                    "product_name": product["name"],
                    "quantity": item["quantity"],
                    "minimum_stock": item["minimum_stock"],
                    "low_stock": item["quantity"] <= item["minimum_stock"],
                    "total_value": item["quantity"] * product["price"],
                    "price_before_discount": product.get("price_before_discount", product["price"]),
                    "discount_percentage": product.get("discount_percentage", 0),
                    "currency": product.get("currency", "EGP")
                }
                report_data.append(report_item)
        
        return report_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

# New Warehouse Dashboard Statistics
@api_router.get("/dashboard/warehouse-stats")
async def get_warehouse_dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.WAREHOUSE_MANAGER:
        raise HTTPException(status_code=403, detail="Only warehouse managers can access this endpoint")
    
    # Get warehouses managed by current user
    my_warehouses = await db.warehouses.find({"manager_id": current_user.id}, {"_id": 0}).to_list(100)
    warehouse_ids = [w["id"] for w in my_warehouses]
    
    if not warehouse_ids:
        return {
            "total_warehouses": 0,
            "available_products": 0,
            "orders": {"today": 0, "week": 0, "month": 0},
            "total_products": 0,
            "low_stock_products": 0,
            "withdrawn_products": 0,
            "warehouses": []
        }
    
    # Count available products
    total_products = await db.inventory.count_documents({"warehouse_id": {"$in": warehouse_ids}, "quantity": {"$gt": 0}})
    
    # Count low stock products
    inventory_items = await db.inventory.find({"warehouse_id": {"$in": warehouse_ids}}, {"_id": 0}).to_list(1000)
    low_stock_count = sum(1 for item in inventory_items if item["quantity"] <= item["minimum_stock"])
    
    # Get orders statistics
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    orders_today = await db.orders.count_documents({
        "warehouse_id": {"$in": warehouse_ids},
        "created_at": {"$gte": today_start},
        "status": {"$in": ["APPROVED", "FULFILLED"]}
    })
    
    orders_week = await db.orders.count_documents({
        "warehouse_id": {"$in": warehouse_ids},
        "created_at": {"$gte": week_start},
        "status": {"$in": ["APPROVED", "FULFILLED"]}
    })
    
    orders_month = await db.orders.count_documents({
        "warehouse_id": {"$in": warehouse_ids},
        "created_at": {"$gte": month_start},
        "status": {"$in": ["APPROVED", "FULFILLED"]}
    })
    
    # Get withdrawn products count (from stock movements)
    withdrawn_count = 0
    stock_movements = await db.stock_movements.find({
        "warehouse_id": {"$in": warehouse_ids},
        "movement_type": "OUT",
        "created_at": {"$gte": month_start}
    }, {"_id": 0}).to_list(1000)
    withdrawn_count = len(stock_movements)
    
    # Get product categories breakdown
    product_categories = {}
    for item in inventory_items:
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            category = product.get("category", "غير محدد")
            if category in product_categories:
                product_categories[category] += item["quantity"]
            else:
                product_categories[category] = item["quantity"]
    
    return {
        "total_warehouses": len(my_warehouses),
        "available_products": total_products,
        "orders": {
            "today": orders_today,
            "week": orders_week,
            "month": orders_month
        },
        "total_products": sum(item["quantity"] for item in inventory_items),
        "low_stock_products": low_stock_count,
        "withdrawn_products": withdrawn_count,
        "product_categories": product_categories,
        "warehouses": my_warehouses
    }

@api_router.get("/reports/users")
async def get_users_report(current_user: User = Depends(get_current_user)):
    # Only Admin can access user reports - warehouse managers cannot access this
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can access user reports")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Count by role
    role_counts = {}
    active_counts = {"active": 0, "inactive": 0}
    
    for user in users:
        role = user["role"]
        role_counts[role] = role_counts.get(role, 0) + 1
        
        if user["is_active"]:
            active_counts["active"] += 1
        else:
            active_counts["inactive"] += 1
    
    return {
        "total_users": len(users),
        "role_distribution": role_counts,
        "active_distribution": active_counts,
        "users": users
    }

@api_router.post("/auth/login")
async def login_user(login_data: UserLogin):
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="User account is disabled")
    
    token = create_jwt_token(user)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "full_name": user["full_name"]
        }
    }

@api_router.get("/auth/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "phone": current_user.phone
    }

# Clinic Request Routes
@api_router.post("/clinic-requests")
async def create_clinic_request(request_data: ClinicRequestCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can submit clinic requests")
    
    clinic_request = ClinicRequest(
        clinic_name=request_data.clinic_name,
        clinic_phone=request_data.clinic_phone,
        doctor_name=request_data.doctor_name,
        doctor_specialty=request_data.doctor_specialty,
        doctor_address=request_data.doctor_address,
        clinic_manager_name=request_data.clinic_manager_name,
        latitude=request_data.latitude,
        longitude=request_data.longitude,
        address=request_data.address,
        clinic_image=request_data.clinic_image,
        notes=request_data.notes,
        sales_rep_id=current_user.id
    )
    
    await db.clinic_requests.insert_one(clinic_request.dict())
    return {"message": "Clinic request submitted successfully", "request_id": clinic_request.id}

@api_router.get("/clinic-requests", response_model=List[Dict[str, Any]])
async def get_clinic_requests(current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role == UserRole.SALES_REP:
        query = {"sales_rep_id": current_user.id}
    elif current_user.role in [UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER]:
        # Managers can see requests from their subordinates
        subordinates = await db.users.find({"managed_by": current_user.id}).to_list(100)
        subordinate_ids = [sub["id"] for sub in subordinates]
        subordinate_ids.append(current_user.id)  # Include their own if they're also a sales rep
        query = {"sales_rep_id": {"$in": subordinate_ids}}
    # Admin sees all
    
    requests = await db.clinic_requests.find(query, {"_id": 0}).to_list(1000)
    
    # Add sales rep name
    for request in requests:
        sales_rep = await db.users.find_one({"id": request["sales_rep_id"]}, {"_id": 0})
        request["sales_rep_name"] = sales_rep["full_name"] if sales_rep else "Unknown"
        
        if request.get("reviewed_by"):
            reviewer = await db.users.find_one({"id": request["reviewed_by"]}, {"_id": 0})
            request["reviewed_by_name"] = reviewer["full_name"] if reviewer else "Unknown"
    
    return requests

@api_router.patch("/clinic-requests/{request_id}/review")
async def review_clinic_request(request_id: str, approved: bool, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only managers and admin can review requests")
    
    request_doc = await db.clinic_requests.find_one({"id": request_id})
    if not request_doc:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Check if manager can review this request (from their subordinate)
    if current_user.role == UserRole.MANAGER:
        sales_rep = await db.users.find_one({"id": request_doc["sales_rep_id"]})
        if sales_rep and sales_rep.get("managed_by") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only review requests from your subordinates")
    
    status = "APPROVED" if approved else "REJECTED"
    
    # Update request status
    await db.clinic_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status, "reviewed_by": current_user.id}}
    )
    
    # If approved, create clinic and doctor
    if approved:
        try:
            # Create clinic
            clinic = Clinic(
                name=request_doc["clinic_name"],
                address=request_doc["address"],
                latitude=request_doc["latitude"],
                longitude=request_doc["longitude"],
                phone=request_doc.get("clinic_phone"),
                added_by=request_doc["sales_rep_id"],
                approved_by=current_user.id
            )
            await db.clinics.insert_one(clinic.dict())
            
            # Create doctor
            doctor = Doctor(
                name=request_doc["doctor_name"],
                specialty=request_doc["doctor_specialty"],
                clinic_id=clinic.id,
                phone=request_doc.get("clinic_phone"),  # Use clinic phone if doctor phone not provided
                added_by=request_doc["sales_rep_id"],
                approved_by=current_user.id
            )
            await db.doctors.insert_one(doctor.dict())
            
        except Exception as e:
            # Rollback request status if creation fails
            await db.clinic_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "PENDING", "reviewed_by": None}}
            )
            raise HTTPException(status_code=500, detail=f"Error creating clinic/doctor: {str(e)}")
    
    return {"message": f"Request {status.lower()} successfully"}

# Order Management Routes
@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can create orders")
    
    # Check if doctor and clinic exist
    doctor = await db.doctors.find_one({"id": order_data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    clinic = await db.clinics.find_one({"id": order_data.clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    # Check if warehouse exists
    warehouse = await db.warehouses.find_one({"id": order_data.warehouse_id})
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    
    # Calculate total amount
    total_amount = 0.0
    order_items = []
    
    for item_data in order_data.items:
        product = await db.products.find_one({"id": item_data["product_id"]})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item_data['product_id']} not found")
        
        item_total = product["price"] * item_data["quantity"]
        total_amount += item_total if order_data.order_type == "SALE" else 0.0
        
        order_item = OrderItem(
            order_id="",  # Will be set after order creation
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=product["price"],
            total_price=item_total
        )
        order_items.append(order_item)
    
    # Create order
    order = Order(
        visit_id=order_data.visit_id,
        sales_rep_id=current_user.id,
        doctor_id=order_data.doctor_id,
        clinic_id=order_data.clinic_id,
        warehouse_id=order_data.warehouse_id,
        status="PENDING",
        order_type=order_data.order_type,
        total_amount=total_amount,
        notes=order_data.notes
    )
    
    # Insert order
    await db.orders.insert_one(order.dict())
    
    # Insert order items
    for item in order_items:
        item.order_id = order.id
        await db.order_items.insert_one(item.dict())
    
    return {"message": "Order created successfully", "order_id": order.id}

@api_router.get("/orders", response_model=List[Dict[str, Any]])
async def get_orders(current_user: User = Depends(get_current_user)):
    query = {}
    
    if current_user.role == UserRole.SALES_REP:
        query = {"sales_rep_id": current_user.id}
    elif current_user.role == UserRole.MANAGER:
        # Managers can see orders from their subordinates
        subordinates = await db.users.find({"managed_by": current_user.id}).to_list(100)
        subordinate_ids = [sub["id"] for sub in subordinates]
        if subordinate_ids:
            query = {"sales_rep_id": {"$in": subordinate_ids}}
    elif current_user.role == UserRole.WAREHOUSE_MANAGER:
        # Warehouse managers see orders for their warehouses
        my_warehouses = await db.warehouses.find({"manager_id": current_user.id}).to_list(100)
        warehouse_ids = [w["id"] for w in my_warehouses]
        if warehouse_ids:
            query = {"warehouse_id": {"$in": warehouse_ids}}
    # Admin sees all orders
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with related information
    for order in orders:
        # Get sales rep info
        sales_rep = await db.users.find_one({"id": order["sales_rep_id"]}, {"_id": 0})
        order["sales_rep_name"] = sales_rep["full_name"] if sales_rep else "Unknown"
        
        # Get doctor info
        doctor = await db.doctors.find_one({"id": order["doctor_id"]}, {"_id": 0})
        order["doctor_name"] = doctor["name"] if doctor else "Unknown"
        
        # Get clinic info
        clinic = await db.clinics.find_one({"id": order["clinic_id"]}, {"_id": 0})
        order["clinic_name"] = clinic["name"] if clinic else "Unknown"
        
        # Get warehouse info
        warehouse = await db.warehouses.find_one({"id": order["warehouse_id"]}, {"_id": 0})
        order["warehouse_name"] = warehouse["name"] if warehouse else "Unknown"
        
        # Get order items
        items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
        for item in items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            item["product_name"] = product["name"] if product else "Unknown"
        order["items"] = items
        
        # Get reviewer info if reviewed
        if order.get("approved_by"):
            reviewer = await db.users.find_one({"id": order["approved_by"]}, {"_id": 0})
            order["approved_by_name"] = reviewer["full_name"] if reviewer else "Unknown"
    
    return orders

# New Pending Orders for Warehouse Manager
@api_router.get("/orders/pending", response_model=List[Dict[str, Any]])
async def get_pending_orders(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.WAREHOUSE_MANAGER:
        raise HTTPException(status_code=403, detail="Only warehouse managers can access pending orders")
    
    # Get warehouses managed by current user
    my_warehouses = await db.warehouses.find({"manager_id": current_user.id}).to_list(100)
    warehouse_ids = [w["id"] for w in my_warehouses]
    
    if not warehouse_ids:
        return []
    
    # Get approved orders for user's warehouses that need fulfillment
    orders = await db.orders.find({
        "warehouse_id": {"$in": warehouse_ids},
        "status": "APPROVED"
    }, {"_id": 0}).to_list(1000)
    
    # Enrich with related information
    for order in orders:
        # Get sales rep info
        sales_rep = await db.users.find_one({"id": order["sales_rep_id"]}, {"_id": 0})
        order["sales_rep_name"] = sales_rep["full_name"] if sales_rep else "Unknown"
        
        # Get doctor info
        doctor = await db.doctors.find_one({"id": order["doctor_id"]}, {"_id": 0})
        order["doctor_name"] = doctor["name"] if doctor else "Unknown"
        
        # Get clinic info
        clinic = await db.clinics.find_one({"id": order["clinic_id"]}, {"_id": 0})
        order["clinic_name"] = clinic["name"] if clinic else "Unknown"
        
        # Get warehouse info
        warehouse = await db.warehouses.find_one({"id": order["warehouse_id"]}, {"_id": 0})
        order["warehouse_name"] = warehouse["name"] if warehouse else "Unknown"
        
        # Get manager approval info
        if order.get("approved_by"):
            manager = await db.users.find_one({"id": order["approved_by"]}, {"_id": 0})
            order["manager_approved"] = True
            order["approved_by_name"] = manager["full_name"] if manager else "Unknown"
        else:
            order["manager_approved"] = False
            order["approved_by_name"] = None
        
        # Get order items with product details
        items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
        for item in items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            if product:
                item["product_name"] = product["name"]
                item["product_unit"] = product["unit"]
                item["product_image"] = product.get("image", "")
        order["items"] = items
    
    return orders

@api_router.patch("/orders/{order_id}/review")
async def review_order(order_id: str, approved: bool, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only managers can review orders")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if manager can review this order (from their subordinate)
    if current_user.role == UserRole.MANAGER:
        sales_rep = await db.users.find_one({"id": order["sales_rep_id"]})
        if sales_rep and sales_rep.get("managed_by") != current_user.id:
            raise HTTPException(status_code=403, detail="You can only review orders from your subordinates")
    
    # Check if warehouse manager can review orders for their warehouses
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
        warehouse = await db.warehouses.find_one({"id": order["warehouse_id"], "manager_id": current_user.id})
        if not warehouse:
            raise HTTPException(status_code=403, detail="You can only review orders for your warehouses")
    
    new_status = "APPROVED" if approved else "REJECTED"
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": new_status, "approved_by": current_user.id}}
    )
    
    # If approved, update inventory (reduce stock)
    if approved:
        try:
            order_items = await db.order_items.find({"order_id": order_id}).to_list(100)
            for item in order_items:
                # Update inventory
                inventory = await db.inventory.find_one({
                    "warehouse_id": order["warehouse_id"],
                    "product_id": item["product_id"]
                })
                
                if inventory and inventory["quantity"] >= item["quantity"]:
                    new_quantity = inventory["quantity"] - item["quantity"]
                    await db.inventory.update_one(
                        {"warehouse_id": order["warehouse_id"], "product_id": item["product_id"]},
                        {"$set": {"quantity": new_quantity, "last_updated": datetime.utcnow(), "updated_by": current_user.id}}
                    )
                    
                    # Record stock movement
                    movement = StockMovement(
                        warehouse_id=order["warehouse_id"],
                        product_id=item["product_id"],
                        movement_type="OUT",
                        quantity=item["quantity"],
                        reason=f"Order {order_id} - {order['order_type']}",
                        reference_id=order_id,
                        created_by=current_user.id
                    )
                    await db.stock_movements.insert_one(movement.dict())
                else:
                    # Insufficient stock - reject the order
                    await db.orders.update_one(
                        {"id": order_id},
                        {"$set": {"status": "REJECTED", "approved_by": current_user.id}}
                    )
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for product {item['product_id']}")
        except Exception as e:
            # Rollback order status if inventory update fails
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {"status": "PENDING", "approved_by": None}}
            )
            raise HTTPException(status_code=500, detail=f"Error updating inventory: {str(e)}")
    
    return {"message": f"Order {new_status.lower()} successfully"}

# New Warehouse Log/Movement History
@api_router.get("/warehouses/{warehouse_id}/movements", response_model=List[Dict[str, Any]])
async def get_warehouse_movements(warehouse_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.WAREHOUSE_MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if warehouse manager has access to this warehouse
    if current_user.role == UserRole.WAREHOUSE_MANAGER:
        warehouse = await db.warehouses.find_one({"id": warehouse_id, "manager_id": current_user.id})
        if not warehouse:
            raise HTTPException(status_code=403, detail="You don't have access to this warehouse")
    
    # Get stock movements for this warehouse
    movements = await db.stock_movements.find({"warehouse_id": warehouse_id}, {"_id": 0}).to_list(1000)
    
    # Enrich with product and user information
    for movement in movements:
        # Get product info
        product = await db.products.find_one({"id": movement["product_id"]}, {"_id": 0})
        movement["product_name"] = product["name"] if product else "Unknown"
        movement["product_unit"] = product["unit"] if product else "Unknown"
        
        # Get user info (who created the movement)
        user = await db.users.find_one({"id": movement["created_by"]}, {"_id": 0})
        movement["created_by_name"] = user["full_name"] if user else "Unknown"
        
        # Get order info if reference exists
        if movement.get("reference_id"):
            order = await db.orders.find_one({"id": movement["reference_id"]}, {"_id": 0})
            if order:
                movement["order_info"] = {
                    "order_type": order["order_type"],
                    "total_amount": order["total_amount"]
                }
    
    # Sort by created_at desc
    movements.sort(key=lambda x: x["created_at"], reverse=True)
    
    return movements

# System Settings APIs
@api_router.get("/settings", response_model=Dict[str, Any])
async def get_system_settings():
    settings = await db.system_settings.find_one({}, {"_id": 0})
    if not settings:
        # Create default settings
        default_settings = SystemSettings(
            updated_by="system"
        )
        await db.system_settings.insert_one(default_settings.dict())
        return default_settings.dict()
    return settings

@api_router.post("/settings")
async def update_system_settings(settings_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update system settings")
    
    # Update settings
    await db.system_settings.update_one(
        {},
        {"$set": {
            **settings_data,
            "updated_by": current_user.id,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

# Notifications APIs
@api_router.get("/notifications", response_model=List[Dict[str, Any]])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"recipient_id": current_user.id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    
    return notifications

@api_router.post("/notifications")
async def create_notification(notification_data: dict, current_user: User = Depends(get_current_user)):
    notification = Notification(
        title=notification_data["title"],
        message=notification_data["message"],
        type=notification_data.get("type", "INFO"),
        recipient_id=notification_data["recipient_id"],
        sender_id=current_user.id,
        data=notification_data.get("data")
    )
    
    await db.notifications.insert_one(notification.dict())
    return {"message": "Notification sent successfully"}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    result = await db.notifications.update_one(
        {"id": notification_id, "recipient_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

# Chat APIs
@api_router.get("/conversations", response_model=List[Dict[str, Any]])
async def get_conversations(current_user: User = Depends(get_current_user)):
    conversations = await db.conversations.find(
        {"participants": current_user.id},
        {"_id": 0}
    ).sort("last_message_at", -1).to_list(100)
    
    # Enrich with participant info and last message
    for conversation in conversations:
        # Get other participants
        other_participants = [p for p in conversation["participants"] if p != current_user.id]
        participant_names = []
        for participant_id in other_participants:
            user = await db.users.find_one({"id": participant_id}, {"_id": 0})
            if user:
                participant_names.append(user["full_name"])
        
        conversation["participant_names"] = participant_names
        
        # Get last message
        last_message = await db.chat_messages.find(
            {"conversation_id": conversation["id"]},
            {"_id": 0}
        ).sort("created_at", -1).limit(1).to_list(1)
        conversation["last_message"] = last_message[0] if last_message else None
    
    return conversations

@api_router.post("/conversations")
async def create_conversation(conversation_data: dict, current_user: User = Depends(get_current_user)):
    participants = conversation_data["participants"]
    if current_user.id not in participants:
        participants.append(current_user.id)
    
    conversation = Conversation(
        participants=participants,
        title=conversation_data.get("title")
    )
    
    await db.conversations.insert_one(conversation.dict())
    return {"message": "Conversation created successfully", "conversation_id": conversation.id}

@api_router.get("/conversations/{conversation_id}/messages", response_model=List[Dict[str, Any]])
async def get_conversation_messages(conversation_id: str, current_user: User = Depends(get_current_user)):
    # Check if user is participant
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user.id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.chat_messages.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Enrich with sender info
    for message in messages:
        sender = await db.users.find_one({"id": message["sender_id"]}, {"_id": 0})
        message["sender_name"] = sender["full_name"] if sender else "Unknown"
    
    return messages

@api_router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, message_data: dict, current_user: User = Depends(get_current_user)):
    # Check if user is participant
    conversation = await db.conversations.find_one({"id": conversation_id})
    if not conversation or current_user.id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Find recipient (assuming 2-person conversation for now)
    recipient_id = next(p for p in conversation["participants"] if p != current_user.id)
    
    message = ChatMessage(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        recipient_id=recipient_id,
        message_text=message_data.get("message_text"),
        voice_note=message_data.get("voice_note"),
        message_type=message_data.get("message_type", "TEXT")
    )
    
    await db.chat_messages.insert_one(message.dict())
    
    # Update conversation last message time
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"last_message_at": datetime.utcnow()}}
    )
    
    # Send notification to recipient
    notification = Notification(
        title="رسالة جديدة",
        message=f"رسالة جديدة من {current_user.full_name}",
        type="INFO",
        recipient_id=recipient_id,
        sender_id=current_user.id,
        data={"conversation_id": conversation_id}
    )
    await db.notifications.insert_one(notification.dict())
    
    return {"message": "Message sent successfully"}

# Voice Notes APIs
@api_router.post("/visits/{visit_id}/voice-notes")
async def add_voice_note(visit_id: str, voice_data: dict, current_user: User = Depends(get_current_user)):
    # Check if visit exists and user has access
    visit = await db.visits.find_one({"id": visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    if visit["sales_rep_id"] != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    voice_note = VoiceNote(
        visit_id=visit_id,
        audio_data=voice_data["audio_data"],
        duration=voice_data["duration"],
        transcript=voice_data.get("transcript"),
        created_by=current_user.id
    )
    
    await db.voice_notes.insert_one(voice_note.dict())
    
    # Update visit with voice note ID
    await db.visits.update_one(
        {"id": visit_id},
        {"$push": {"voice_notes": voice_note.id}}
    )
    
    return {"message": "Voice note added successfully", "voice_note_id": voice_note.id}

@api_router.get("/visits/{visit_id}/voice-notes", response_model=List[Dict[str, Any]])  
async def get_visit_voice_notes(visit_id: str, current_user: User = Depends(get_current_user)):
    # Check access
    visit = await db.visits.find_one({"id": visit_id})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    if visit["sales_rep_id"] != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    voice_notes = await db.voice_notes.find(
        {"visit_id": visit_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with creator info
    for note in voice_notes:
        creator = await db.users.find_one({"id": note["created_by"]}, {"_id": 0})
        note["created_by_name"] = creator["full_name"] if creator else "Unknown"
    
    return voice_notes

# Enhanced User Management APIs
@api_router.get("/users/{user_id}", response_model=Dict[str, Any])
async def get_user_details(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get additional user statistics
    if user.get("role") == "sales_rep":
        visits_count = await db.visits.count_documents({"sales_rep_id": user_id})
        orders_count = await db.orders.count_documents({"sales_rep_id": user_id})
        user["statistics"] = {
            "total_visits": visits_count,
            "total_orders": orders_count
        }
    
    return user

@api_router.patch("/users/{user_id}")
async def update_user(user_id: str, user_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can update users")
    
    # Hash password if provided
    if "password" in user_data:
        user_data["password_hash"] = pwd_context.hash(user_data["password"])
        del user_data["password"]
    
    user_data["updated_at"] = datetime.utcnow()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": user_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can delete users")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@api_router.patch("/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can toggle user status")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.utcnow()}}
    )
    
    action = "activated" if new_status else "deactivated"
    return {"message": f"User {action} successfully", "is_active": new_status}

# Gamification System APIs
@api_router.get("/achievements", response_model=List[Dict[str, Any]])
async def get_achievements():
    achievements = await db.achievements.find({"is_active": True}, {"_id": 0}).to_list(100)
    return achievements

@api_router.get("/users/{user_id}/points", response_model=Dict[str, Any])
async def get_user_points(user_id: str, current_user: User = Depends(get_current_user)):
    # Users can view their own points, admins/managers can view any
    if current_user.id != user_id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_points = await db.user_points.find_one({"user_id": user_id}, {"_id": 0})
    if not user_points:
        # Create initial points record
        user_points = UserPoints(user_id=user_id)
        await db.user_points.insert_one(user_points.dict())
        user_points = user_points.dict()
    
    # Get recent transactions
    transactions = await db.points_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    user_points["recent_transactions"] = transactions
    
    # Get achievements
    achievements = await db.achievements.find(
        {"id": {"$in": user_points.get("achievements_unlocked", [])}},
        {"_id": 0}
    ).to_list(100)
    
    user_points["achievements"] = achievements
    
    return user_points

@api_router.post("/users/{user_id}/points")
async def award_points(user_id: str, points_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    points = points_data["points"]
    reason = points_data["reason"]
    activity_type = points_data.get("activity_type", "MANUAL")
    
    # Update user points
    user_points = await db.user_points.find_one({"user_id": user_id})
    if not user_points:
        user_points = UserPoints(user_id=user_id)
        await db.user_points.insert_one(user_points.dict())
    
    # Create transaction
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        reason=reason,
        activity_type=activity_type
    )
    await db.points_transactions.insert_one(transaction.dict())
    
    # Update totals
    await db.user_points.update_one(
        {"user_id": user_id},
        {
            "$inc": {
                "total_points": points,
                "monthly_points": points,
                "weekly_points": points,
                "daily_points": points
            },
            "$set": {"last_activity": datetime.utcnow()}
        }
    )
    
    return {"message": "Points awarded successfully"}

# Doctor Rating APIs
@api_router.post("/doctors/{doctor_id}/rating")
async def rate_doctor(doctor_id: str, rating_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can rate doctors")
    
    # Check if doctor exists
    doctor = await db.doctors.find_one({"id": doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if user already rated this doctor for this visit
    existing_rating = await db.doctor_ratings.find_one({
        "doctor_id": doctor_id,
        "rated_by": current_user.id,
        "visit_id": rating_data["visit_id"]
    })
    
    if existing_rating:
        raise HTTPException(status_code=400, detail="Doctor already rated for this visit")
    
    rating = DoctorRating(
        doctor_id=doctor_id,
        rated_by=current_user.id,
        visit_id=rating_data["visit_id"],
        rating=rating_data["rating"],
        feedback=rating_data.get("feedback"),
        categories=rating_data.get("categories", {})
    )
    
    await db.doctor_ratings.insert_one(rating.dict())
    
    # Award points for rating
    await award_points_internal(current_user.id, 5, "Doctor rating", "RATING")
    
    return {"message": "Doctor rated successfully"}

@api_router.get("/doctors/{doctor_id}/ratings", response_model=List[Dict[str, Any]])
async def get_doctor_ratings(doctor_id: str, current_user: User = Depends(get_current_user)):
    ratings = await db.doctor_ratings.find({"doctor_id": doctor_id}, {"_id": 0}).to_list(100)
    
    # Enrich with rater info
    for rating in ratings:
        rater = await db.users.find_one({"id": rating["rated_by"]}, {"_id": 0})
        rating["rater_name"] = rater["full_name"] if rater else "Unknown"
    
    return ratings

# Clinic Rating APIs (similar structure)
@api_router.post("/clinics/{clinic_id}/rating")
async def rate_clinic(clinic_id: str, rating_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can rate clinics")
    
    clinic = await db.clinics.find_one({"id": clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    rating = ClinicRating(
        clinic_id=clinic_id,
        rated_by=current_user.id,
        visit_id=rating_data["visit_id"],
        rating=rating_data["rating"],
        feedback=rating_data.get("feedback"),
        categories=rating_data.get("categories", {})
    )
    
    await db.clinic_ratings.insert_one(rating.dict())
    await award_points_internal(current_user.id, 5, "Clinic rating", "RATING")
    
    return {"message": "Clinic rated successfully"}

# Doctor Preferences APIs
@api_router.get("/doctors/{doctor_id}/preferences", response_model=Dict[str, Any])
async def get_doctor_preferences(doctor_id: str, current_user: User = Depends(get_current_user)):
    preferences = await db.doctor_preferences.find_one({"doctor_id": doctor_id}, {"_id": 0})
    if not preferences:
        # Create default preferences
        preferences = DoctorPreferences(
            doctor_id=doctor_id,
            updated_by=current_user.id
        )
        await db.doctor_preferences.insert_one(preferences.dict())
        preferences = preferences.dict()
    
    return preferences

@api_router.post("/doctors/{doctor_id}/preferences")
async def update_doctor_preferences(doctor_id: str, preferences_data: dict, current_user: User = Depends(get_current_user)):
    preferences_data["doctor_id"] = doctor_id
    preferences_data["updated_by"] = current_user.id
    preferences_data["updated_at"] = datetime.utcnow()
    
    await db.doctor_preferences.update_one(
        {"doctor_id": doctor_id},
        {"$set": preferences_data},
        upsert=True
    )
    
    return {"message": "Doctor preferences updated successfully"}

# Appointment Management APIs
@api_router.post("/appointments")
async def create_appointment(appointment_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can create appointments")
    
    appointment = Appointment(
        sales_rep_id=current_user.id,
        doctor_id=appointment_data["doctor_id"],
        clinic_id=appointment_data["clinic_id"],
        scheduled_date=datetime.fromisoformat(appointment_data["scheduled_date"]),
        duration_minutes=appointment_data.get("duration_minutes", 30),
        purpose=appointment_data["purpose"],
        notes=appointment_data.get("notes")
    )
    
    await db.appointments.insert_one(appointment.dict())
    
    # Send notification to sales rep
    notification = Notification(
        title="موعد جديد تم حجزه",
        message=f"تم حجز موعد جديد في {appointment.scheduled_date.strftime('%Y-%m-%d %H:%M')}",
        type="INFO",
        recipient_id=current_user.id,
        data={"appointment_id": appointment.id}
    )
    await db.notifications.insert_one(notification.dict())
    
    return {"message": "Appointment created successfully", "appointment_id": appointment.id}

@api_router.get("/appointments", response_model=List[Dict[str, Any]])
async def get_appointments(current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.SALES_REP:
        appointments = await db.appointments.find({"sales_rep_id": current_user.id}, {"_id": 0}).to_list(100)
    else:
        appointments = await db.appointments.find({}, {"_id": 0}).to_list(100)
    
    # Enrich with doctor and clinic info
    for appointment in appointments:
        doctor = await db.doctors.find_one({"id": appointment["doctor_id"]}, {"_id": 0})
        clinic = await db.clinics.find_one({"id": appointment["clinic_id"]}, {"_id": 0})
        
        appointment["doctor_name"] = doctor["name"] if doctor else "Unknown"
        appointment["clinic_name"] = clinic["name"] if clinic else "Unknown"
    
    return appointments

# Utility function for awarding points
async def award_points_internal(user_id: str, points: int, reason: str, activity_type: str):
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        reason=reason,
        activity_type=activity_type
    )
    await db.points_transactions.insert_one(transaction.dict())
    
# Enhanced Visits Log API
@api_router.get("/visits/comprehensive", response_model=List[Dict[str, Any]])
async def get_comprehensive_visits_log(current_user: User = Depends(get_current_user)):
    # All roles can access, but with different data visibility
    if current_user.role == UserRole.SALES_REP:
        # Sales reps see only their visits
        query = {"sales_rep_id": current_user.id}
    elif current_user.role == UserRole.MANAGER:
        # Managers see their team's visits
        team_members = await db.users.find({"manager_id": current_user.id}, {"_id": 0}).to_list(100)
        team_ids = [member["id"] for member in team_members]
        team_ids.append(current_user.id)  # Include manager's own visits if any
        query = {"sales_rep_id": {"$in": team_ids}}
    else:
        # Admin and others see all visits
        query = {}
    
    visits = await db.visits.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich visits with comprehensive information
    for visit in visits:
        # Get sales rep info
        sales_rep = await db.users.find_one({"id": visit["sales_rep_id"]}, {"_id": 0})
        visit["sales_rep_name"] = sales_rep["full_name"] if sales_rep else "Unknown"
        visit["sales_rep_phone"] = sales_rep.get("phone", "")
        
        # Get doctor info
        doctor = await db.doctors.find_one({"id": visit["doctor_id"]}, {"_id": 0})
        if doctor:
            visit["doctor_name"] = doctor["name"]
            visit["doctor_specialty"] = doctor["specialty"]
            visit["doctor_phone"] = doctor.get("phone", "")
        else:
            visit["doctor_name"] = "Unknown"
            visit["doctor_specialty"] = ""
            visit["doctor_phone"] = ""
        
        # Get clinic info
        clinic = await db.clinics.find_one({"id": visit["clinic_id"]}, {"_id": 0})
        if clinic:
            visit["clinic_name"] = clinic["name"]
            visit["clinic_address"] = clinic["address"]
            visit["clinic_type"] = clinic.get("clinic_type", "غير محدد")
            visit["clinic_phone"] = clinic.get("phone", "")
        else:
            visit["clinic_name"] = "Unknown"
            visit["clinic_address"] = ""
            visit["clinic_type"] = ""
            visit["clinic_phone"] = ""
        
        # Get voice notes count
        voice_notes_count = await db.voice_notes.count_documents({"visit_id": visit["id"]})
        visit["voice_notes_count"] = voice_notes_count
        
        # Get orders related to this visit
        related_orders = await db.orders.find({"visit_id": visit["id"]}, {"_id": 0}).to_list(100)
        visit["orders_count"] = len(related_orders)
        visit["total_order_amount"] = sum(order.get("total_amount", 0) for order in related_orders)
        
        # Get ratings for this visit
        doctor_rating = await db.doctor_ratings.find_one({"visit_id": visit["id"]}, {"_id": 0})
        clinic_rating = await db.clinic_ratings.find_one({"visit_id": visit["id"]}, {"_id": 0})
        
        visit["doctor_rating"] = doctor_rating.get("rating") if doctor_rating else None
        visit["clinic_rating"] = clinic_rating.get("rating") if clinic_rating else None
        
        # Calculate visit duration if departure time exists
        if visit.get("departure_time"):
            arrival = datetime.fromisoformat(visit["visit_date"].replace('Z', '+00:00'))
            departure = datetime.fromisoformat(visit["departure_time"].replace('Z', '+00:00'))
            duration_minutes = (departure - arrival).total_seconds() / 60
            visit["duration_minutes"] = int(duration_minutes)
        else:
            visit["duration_minutes"] = None
        
        # Add effectiveness status
        if visit.get("is_effective") is not None:
            visit["effectiveness_status"] = "فعالة" if visit["is_effective"] else "غير فعالة"
        else:
            visit["effectiveness_status"] = "لم يتم التقييم"
        
        # Manager who reviewed if any
        if visit.get("reviewed_by"):
            reviewer = await db.users.find_one({"id": visit["reviewed_by"]}, {"_id": 0})
            visit["reviewed_by_name"] = reviewer["full_name"] if reviewer else "Unknown"
        else:
            visit["reviewed_by_name"] = None
    
    return visits

@api_router.get("/visits/{visit_id}/details", response_model=Dict[str, Any])
async def get_visit_details(visit_id: str, current_user: User = Depends(get_current_user)):
    # Get visit
    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Check access permissions
    if current_user.role == UserRole.SALES_REP and visit["sales_rep_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if current_user.role == UserRole.MANAGER:
        # Check if sales rep is in manager's team
        sales_rep = await db.users.find_one({"id": visit["sales_rep_id"]}, {"_id": 0})
        if sales_rep and sales_rep.get("manager_id") != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Enrich with all detailed information
    # Get sales rep details
    sales_rep = await db.users.find_one({"id": visit["sales_rep_id"]}, {"_id": 0})
    visit["sales_rep_details"] = {
        "name": sales_rep["full_name"] if sales_rep else "Unknown",
        "email": sales_rep.get("email", ""),
        "phone": sales_rep.get("phone", ""),
        "employee_id": sales_rep.get("employee_id", "")
    }
    
    # Get doctor details
    doctor = await db.doctors.find_one({"id": visit["doctor_id"]}, {"_id": 0})
    visit["doctor_details"] = doctor if doctor else {}
    
    # Get clinic details
    clinic = await db.clinics.find_one({"id": visit["clinic_id"]}, {"_id": 0})
    visit["clinic_details"] = clinic if clinic else {}
    
    # Get voice notes
    voice_notes = await db.voice_notes.find({"visit_id": visit_id}, {"_id": 0}).to_list(100)
    for note in voice_notes:
        # Get creator info
        creator = await db.users.find_one({"id": note["created_by"]}, {"_id": 0})
        note["created_by_name"] = creator["full_name"] if creator else "Unknown"
    visit["voice_notes"] = voice_notes
    
    # Get related orders
    orders = await db.orders.find({"visit_id": visit_id}, {"_id": 0}).to_list(100)
    for order in orders:
        # Get order items
        items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
        for item in items:
            product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
            item["product_details"] = product if product else {}
        order["items"] = items
    visit["orders"] = orders
    
    # Get ratings
    doctor_rating = await db.doctor_ratings.find_one({"visit_id": visit_id}, {"_id": 0})
    clinic_rating = await db.clinic_ratings.find_one({"visit_id": visit_id}, {"_id": 0})
    
    visit["doctor_rating_details"] = doctor_rating
    visit["clinic_rating_details"] = clinic_rating
    
    return visit
@api_router.get("/dashboard/sales-rep-stats")
async def get_sales_rep_detailed_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can access this endpoint")
    
    # Date ranges
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    week_start = today_start - timedelta(days=now.weekday())
    week_end = week_start + timedelta(days=7)
    
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
    
    # Visit statistics
    today_visits = await db.visits.count_documents({
        "sales_rep_id": current_user.id,
        "visit_date": {"$gte": today_start, "$lt": today_end}
    })
    
    week_visits = await db.visits.count_documents({
        "sales_rep_id": current_user.id,
        "visit_date": {"$gte": week_start, "$lt": week_end}
    })
    
    month_visits = await db.visits.count_documents({
        "sales_rep_id": current_user.id,
        "visit_date": {"$gte": month_start, "$lt": month_end}
    })
    
    total_visits = await db.visits.count_documents({"sales_rep_id": current_user.id})
    
    # Other statistics
    total_clinics_added = await db.clinics.count_documents({"added_by": current_user.id})
    total_doctors_added = await db.doctors.count_documents({"added_by": current_user.id})
    
    # Pending approvals
    pending_visits = await db.visits.count_documents({
        "sales_rep_id": current_user.id,
        "is_effective": None
    })
    
    pending_clinic_requests = await db.clinic_requests.count_documents({
        "sales_rep_id": current_user.id,
        "status": "PENDING"
    })
    
    pending_orders = await db.orders.count_documents({
        "sales_rep_id": current_user.id,
        "status": "PENDING"
    })
    
    return {
        "visits": {
            "today": today_visits,
            "week": week_visits,
            "month": month_visits,
            "total": total_visits
        },
        "total_clinics_added": total_clinics_added,
        "total_doctors_added": total_doctors_added,
        "pending": {
            "visits": pending_visits,
            "clinic_requests": pending_clinic_requests,
            "orders": pending_orders
        }
    }
@api_router.post("/clinics")
async def create_clinic(clinic_data: ClinicCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SALES_REP, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only sales reps and admin can add clinics")
    
    clinic = Clinic(
        name=clinic_data.name,
        address=clinic_data.address,
        latitude=clinic_data.latitude,
        longitude=clinic_data.longitude,
        phone=clinic_data.phone,
        added_by=current_user.id,
        approved_by=current_user.id if current_user.role == UserRole.ADMIN else None
    )
    
    await db.clinics.insert_one(clinic.dict())
    return {"message": "Clinic added successfully", "clinic_id": clinic.id}

@api_router.get("/clinics", response_model=List[Dict[str, Any]])
async def get_clinics(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == UserRole.SALES_REP:
        query = {"$or": [{"approved_by": {"$ne": None}}, {"added_by": current_user.id}]}
    
    clinics = await db.clinics.find(query, {"_id": 0}).to_list(1000)
    return clinics

@api_router.patch("/clinics/{clinic_id}/approve")
async def approve_clinic(clinic_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can approve clinics")
    
    result = await db.clinics.update_one(
        {"id": clinic_id},
        {"$set": {"approved_by": current_user.id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    return {"message": "Clinic approved successfully"}

# Doctor Routes
@api_router.post("/doctors")
async def create_doctor(doctor_data: DoctorCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in [UserRole.SALES_REP, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only sales reps and admin can add doctors")
    
    # Check if clinic exists and is approved
    clinic = await db.clinics.find_one({"id": doctor_data.clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    doctor = Doctor(
        name=doctor_data.name,
        specialty=doctor_data.specialty,
        clinic_id=doctor_data.clinic_id,
        phone=doctor_data.phone,
        email=doctor_data.email,
        added_by=current_user.id,
        approved_by=current_user.id if current_user.role == UserRole.ADMIN else None
    )
    
    await db.doctors.insert_one(doctor.dict())
    return {"message": "Doctor added successfully", "doctor_id": doctor.id}

@api_router.get("/doctors", response_model=List[Dict[str, Any]])
async def get_doctors(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == UserRole.SALES_REP:
        query = {"$or": [{"approved_by": {"$ne": None}}, {"added_by": current_user.id}]}
    
    doctors = await db.doctors.find(query, {"_id": 0}).to_list(1000)
    return doctors

@api_router.patch("/doctors/{doctor_id}/approve")
async def approve_doctor(doctor_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can approve doctors")
    
    result = await db.doctors.update_one(
        {"id": doctor_id},
        {"$set": {"approved_by": current_user.id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    return {"message": "Doctor approved successfully"}

# Visit Routes
@api_router.post("/visits")
async def create_visit(visit_data: VisitCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.SALES_REP:
        raise HTTPException(status_code=403, detail="Only sales reps can create visits")
    
    # Get clinic location
    clinic = await db.clinics.find_one({"id": visit_data.clinic_id})
    if not clinic:
        raise HTTPException(status_code=404, detail="Clinic not found")
    
    # Check if user is within 20 meters of the clinic
    distance = calculate_distance(
        visit_data.latitude, visit_data.longitude,
        clinic["latitude"], clinic["longitude"]
    )
    
    if distance > 20:  # 20 meters limit
        raise HTTPException(
            status_code=400, 
            detail=f"You must be within 20 meters of the clinic to register a visit. Current distance: {distance:.1f}m"
        )
    
    # Check if doctor exists
    doctor = await db.doctors.find_one({"id": visit_data.doctor_id})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    
    # Check if visit already exists today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    existing_visit = await db.visits.find_one({
        "sales_rep_id": current_user.id,
        "doctor_id": visit_data.doctor_id,
        "visit_date": {"$gte": today_start, "$lt": today_end}
    })
    
    if existing_visit:
        raise HTTPException(status_code=400, detail="Visit already registered for this doctor today")
    
    visit = Visit(
        sales_rep_id=current_user.id,
        doctor_id=visit_data.doctor_id,
        clinic_id=visit_data.clinic_id,
        latitude=visit_data.latitude,
        longitude=visit_data.longitude,
        notes=visit_data.notes
    )
    
    await db.visits.insert_one(visit.dict())
    return {"message": "Visit registered successfully", "visit_id": visit.id}

@api_router.get("/visits", response_model=List[Dict[str, Any]])
async def get_visits(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == UserRole.SALES_REP:
        query = {"sales_rep_id": current_user.id}
    elif current_user.role == UserRole.MANAGER:
        # Managers can see all visits for review
        pass
    
    visits = await db.visits.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with doctor and clinic information
    for visit in visits:
        doctor = await db.doctors.find_one({"id": visit["doctor_id"]}, {"_id": 0})
        clinic = await db.clinics.find_one({"id": visit["clinic_id"]}, {"_id": 0})
        sales_rep = await db.users.find_one({"id": visit["sales_rep_id"]}, {"_id": 0})
        
        visit["doctor_name"] = doctor["name"] if doctor else "Unknown"
        visit["clinic_name"] = clinic["name"] if clinic else "Unknown"
        visit["sales_rep_name"] = sales_rep["full_name"] if sales_rep else "Unknown"
    
    return visits

@api_router.patch("/visits/{visit_id}/review")
async def review_visit(visit_id: str, is_effective: bool, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can review visits")
    
    result = await db.visits.update_one(
        {"id": visit_id},
        {"$set": {"is_effective": is_effective, "reviewed_by": current_user.id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    return {"message": "Visit reviewed successfully"}

# Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    stats = {}
    
    if current_user.role == UserRole.ADMIN:
        total_users = await db.users.count_documents({})
        total_clinics = await db.clinics.count_documents({})
        total_doctors = await db.doctors.count_documents({})
        total_visits = await db.visits.count_documents({})
        total_products = await db.products.count_documents({"is_active": True})
        total_warehouses = await db.warehouses.count_documents({"is_active": True})
        
        # Low stock items
        low_stock_count = 0
        inventory_items = await db.inventory.find({}).to_list(1000)
        for item in inventory_items:
            if item["quantity"] <= item["minimum_stock"]:
                low_stock_count += 1
        
        stats = {
            "total_users": total_users,
            "total_clinics": total_clinics,
            "total_doctors": total_doctors,
            "total_visits": total_visits,
            "total_products": total_products,
            "total_warehouses": total_warehouses,
            "low_stock_items": low_stock_count
        }
    
    elif current_user.role == UserRole.WAREHOUSE_MANAGER:
        # Warehouse manager stats
        my_warehouses = await db.warehouses.count_documents({"manager_id": current_user.id})
        total_products = await db.products.count_documents({"is_active": True})
        
        # My warehouses inventory
        my_inventory_count = await db.inventory.count_documents({"warehouse_id": {"$in": [w["id"] for w in await db.warehouses.find({"manager_id": current_user.id}).to_list(100)]}})
        
        # Low stock in my warehouses
        low_stock_count = 0
        my_warehouse_ids = [w["id"] for w in await db.warehouses.find({"manager_id": current_user.id}).to_list(100)]
        inventory_items = await db.inventory.find({"warehouse_id": {"$in": my_warehouse_ids}}).to_list(1000)
        for item in inventory_items:
            if item["quantity"] <= item["minimum_stock"]:
                low_stock_count += 1
        
        stats = {
            "my_warehouses": my_warehouses,
            "total_products": total_products,
            "inventory_items": my_inventory_count,
            "low_stock_items": low_stock_count
        }
    
    elif current_user.role == UserRole.MANAGER:
        # Manager stats - focus on team performance
        my_team = await db.users.count_documents({"managed_by": current_user.id})
        pending_visits = await db.visits.count_documents({"is_effective": None})
        total_visits = await db.visits.count_documents({})
        
        # Team visits today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        
        team_members = await db.users.find({"managed_by": current_user.id}).to_list(100)
        team_ids = [member["id"] for member in team_members]
        
        today_team_visits = await db.visits.count_documents({
            "sales_rep_id": {"$in": team_ids},
            "visit_date": {"$gte": today_start, "$lt": today_end}
        })
        
        stats = {
            "team_members": my_team,
            "pending_reviews": pending_visits,
            "total_visits": total_visits,
            "today_team_visits": today_team_visits
        }
    
    elif current_user.role == UserRole.SALES_REP:
        my_visits = await db.visits.count_documents({"sales_rep_id": current_user.id})
        my_clinics = await db.clinics.count_documents({"added_by": current_user.id})
        my_doctors = await db.doctors.count_documents({"added_by": current_user.id})
        
        # Today's visits
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        today_visits = await db.visits.count_documents({
            "sales_rep_id": current_user.id,
            "visit_date": {"$gte": today_start, "$lt": today_end}
        })
        
        # Pending approvals
        pending_clinics = await db.clinics.count_documents({"added_by": current_user.id, "approved_by": None})
        pending_doctors = await db.doctors.count_documents({"added_by": current_user.id, "approved_by": None})
        
        stats = {
            "total_visits": my_visits,
            "total_clinics": my_clinics,
            "total_doctors": my_doctors,
            "today_visits": today_visits,
            "pending_clinics": pending_clinics,
            "pending_doctors": pending_doctors
        }
    
    return stats

# Create default admin user on startup
@app.on_event("startup")
async def create_default_admin():
    existing_admin = await db.users.find_one({"role": UserRole.ADMIN})
    if not existing_admin:
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password_hash=hash_password("admin123"),
            role=UserRole.ADMIN,
            full_name="System Administrator"
        )
        await db.users.insert_one(admin_user.dict())
        print("Default admin user created: username=admin, password=admin123")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()