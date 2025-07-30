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

# Import all models from the organized modules
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
app = FastAPI(title="EP Group System API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Track startup time for performance metrics
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
        return {
            "outstanding_debt": 0.0,
            "overdue_debt": 0.0,
            "total_invoices": 0,
            "status": "clear"
        }

async def can_access_user_profile(current_user: User, target_user_id: str) -> bool:
    """فحص صلاحية الوصول للملف الشخصي"""
    if current_user.role == UserRole.ADMIN:
        return True
    
    if current_user.role == "gm":
        return True
    
    if current_user.id == target_user_id and current_user.role in [
        UserRole.LINE_MANAGER, UserRole.AREA_MANAGER, UserRole.DISTRICT_MANAGER, 
        UserRole.KEY_ACCOUNT
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

# Import route modules
from routes import auth_routes, user_routes, order_routes, visit_routes, clinic_routes, warehouse_routes, support_routes, movement_routes

# Include all route modules
app.include_router(auth_routes.router, prefix="/api")
app.include_router(user_routes.router, prefix="/api")
app.include_router(order_routes.router, prefix="/api")
app.include_router(visit_routes.router, prefix="/api")
app.include_router(clinic_routes.router, prefix="/api")
app.include_router(warehouse_routes.router, prefix="/api")
app.include_router(support_routes.router, prefix="/api")
app.include_router(movement_routes.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "EP Group System API v2.0.0", "status": "running"}

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