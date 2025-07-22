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

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# User Roles
class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    SALES_REP = "sales_rep"
    WAREHOUSE = "warehouse"
    ACCOUNTING = "accounting"

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
    permissions: List[str] = []

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    full_name: str
    phone: Optional[str] = None

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

class Visit(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sales_rep_id: str
    doctor_id: str
    clinic_id: str
    visit_date: datetime = Field(default_factory=datetime.utcnow)
    latitude: float
    longitude: float
    notes: str
    is_effective: Optional[bool] = None  # To be evaluated by manager
    reviewed_by: Optional[str] = None  # manager user_id
    created_at: datetime = Field(default_factory=datetime.utcnow)

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
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admin can create users")
    
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
        phone=user_data.phone
    )
    
    await db.users.insert_one(user.dict())
    return {"message": "User created successfully", "user_id": user.id}

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

# Clinic Routes
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
        
        stats = {
            "total_users": total_users,
            "total_clinics": total_clinics,
            "total_doctors": total_doctors,
            "total_visits": total_visits
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
        
        stats = {
            "total_visits": my_visits,
            "total_clinics": my_clinics,
            "total_doctors": my_doctors,
            "today_visits": today_visits
        }
    
    elif current_user.role == UserRole.MANAGER:
        # Pending reviews
        pending_visits = await db.visits.count_documents({"is_effective": None})
        total_visits = await db.visits.count_documents({})
        
        stats = {
            "pending_reviews": pending_visits,
            "total_visits": total_visits
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