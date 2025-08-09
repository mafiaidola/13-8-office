#!/usr/bin/env python3
"""
Simple FastAPI server for testing dashboard APIs
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import uvicorn

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import routers
from routers.user_routes import router as user_router
from routers.lines_areas_routes import router as lines_areas_router
from routers.excel_routes import router as excel_router
from routers.products_routes import router as products_router

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security
security = HTTPBearer()

# Create FastAPI app
app = FastAPI(title="Medical Management System API", version="2.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(user_router)
app.include_router(lines_areas_router)
app.include_router(excel_router)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(user_data: dict) -> str:
    payload = {
        "user_id": user_data["id"],
        "username": user_data["username"],
        "role": user_data["role"],
        "full_name": user_data.get("full_name", ""),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    token = credentials.credentials
    payload = verify_jwt_token(token)
    return payload

@app.get("/")
async def root():
    return {"message": "Medical Management System API - نظام الإدارة الطبية"}

@app.get("/api/health")
async def health_check():
    try:
        # Test database connection
        users_count = await db.users.count_documents({})
        clinics_count = await db.clinics.count_documents({})
        return {
            "status": "healthy",
            "database": "connected",
            "statistics": {
                "users": users_count,
                "clinics": clinics_count,
                "financial_records": 0,
                "visits": 0
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/auth/login")
async def login(login_data: dict):
    try:
        username = login_data.get("username")
        password = login_data.get("password")
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        # Check for admin user
        if username == "admin" and password == "admin123":
            # Create or get admin user
            admin_user = await db.users.find_one({"username": "admin"})
            if not admin_user:
                # Create admin user
                admin_user = {
                    "id": "admin-001",
                    "username": "admin",
                    "password_hash": hash_password("admin123"),
                    "full_name": "System Administrator",
                    "role": "admin",
                    "is_active": True,
                    "created_at": datetime.utcnow()
                }
                await db.users.insert_one(admin_user)
            
            # Create JWT token
            token = create_jwt_token({
                "id": admin_user.get("id", "admin-001"),
                "username": admin_user["username"],
                "role": admin_user["role"],
                "full_name": admin_user.get("full_name", "System Administrator")
            })
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": admin_user.get("id", "admin-001"),
                    "username": admin_user["username"],
                    "full_name": admin_user.get("full_name", "System Administrator"),
                    "role": admin_user["role"]
                }
            }
        else:
            # Check database for user
            user = await db.users.find_one({"username": username})
            if not user or user.get("password_hash") != hash_password(password):
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            token = create_jwt_token({
                "id": user.get("id", str(user.get("_id"))),
                "username": user["username"],
                "role": user["role"],
                "full_name": user.get("full_name", "")
            })
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user.get("id", str(user.get("_id"))),
                    "username": user["username"],
                    "full_name": user.get("full_name", ""),
                    "role": user["role"]
                }
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

@app.get("/api/dashboard/stats/{role_type}")
async def get_dashboard_stats(role_type: str, time_filter: str = "today", current_user: dict = Depends(get_current_user)):
    try:
        # Get basic statistics from database
        users_count = await db.users.count_documents({"is_active": {"$ne": False}})
        clinics_count = await db.clinics.count_documents({"is_active": {"$ne": False}})
        products_count = await db.products.count_documents({"is_active": {"$ne": False}})
        orders_count = await db.orders.count_documents({})
        visits_count = await db.visits.count_documents({})
        debts_count = await db.debts.count_documents({})
        
        # Base statistics
        base_stats = {
            "total_users": users_count,
            "total_clinics": clinics_count,
            "total_products": products_count,
            "orders_in_period": orders_count,
            "visits_in_period": visits_count,
            "time_filter": time_filter,
            "user_role": current_user.get("role"),
            "dashboard_type": role_type
        }
        
        # Role-specific statistics
        if role_type == "admin":
            # Admin gets comprehensive system overview
            user_roles_stats = await db.users.aggregate([
                {"$group": {"_id": "$role", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]).to_list(10)
            
            financial_stats = await db.debts.aggregate([
                {"$group": {
                    "_id": None,
                    "total_debts": {"$sum": 1},
                    "total_outstanding": {"$sum": "$remaining_amount"},
                    "total_settled": {"$sum": {"$subtract": ["$original_amount", "$remaining_amount"]}}
                }}
            ]).to_list(1)
            
            financial_data = financial_stats[0] if financial_stats else {
                "total_debts": 0, "total_outstanding": 0, "total_settled": 0
            }
            
            base_stats.update({
                "user_roles_distribution": user_roles_stats,
                "financial_overview": financial_data,
                "dashboard_widgets": [
                    "system_overview", "user_management", "financial_summary", 
                    "performance_metrics", "activity_log", "system_health"
                ]
            })
            
        elif role_type == "medical_rep":
            # Medical rep gets personal performance data
            rep_visits = await db.visits.count_documents({"sales_rep_id": current_user.get("user_id")})
            successful_visits = await db.visits.count_documents({
                "sales_rep_id": current_user.get("user_id"),
                "effective": True
            })
            assigned_clinics = await db.clinics.count_documents({
                "assigned_rep_id": current_user.get("user_id")
            })
            
            success_rate = (successful_visits / rep_visits * 100) if rep_visits > 0 else 0
            
            base_stats.update({
                "personal_visits": rep_visits,
                "successful_visits": successful_visits,
                "success_rate": round(success_rate, 2),
                "assigned_clinics_count": assigned_clinics,
                "dashboard_widgets": [
                    "personal_stats", "visit_tracker", "orders_summary", 
                    "clinic_assignments", "performance_comparison", "targets_progress"
                ]
            })
            
        elif role_type == "accounting":
            # Accounting gets financial overview
            financial_summary = await db.debts.aggregate([
                {"$group": {
                    "_id": None,
                    "total_invoices": {"$sum": 1},
                    "total_amount": {"$sum": "$original_amount"},
                    "outstanding_amount": {"$sum": "$remaining_amount"},
                    "settled_amount": {"$sum": {"$subtract": ["$original_amount", "$remaining_amount"]}}
                }}
            ]).to_list(1)
            
            payments_count = await db.payments.count_documents({})
            overdue_debts = await db.debts.count_documents({
                "status": "outstanding",
                "due_date": {"$lt": datetime.utcnow()}
            })
            
            financial_data = financial_summary[0] if financial_summary else {
                "total_invoices": 0, "total_amount": 0, "outstanding_amount": 0, "settled_amount": 0
            }
            
            base_stats.update({
                "financial_summary": financial_data,
                "payments_count": payments_count,
                "overdue_debts_count": overdue_debts,
                "dashboard_widgets": [
                    "financial_overview", "payments_tracker", "debt_management", 
                    "payment_methods", "overdue_alerts", "financial_reports"
                ]
            })
            
        elif role_type == "gm":
            # General manager gets strategic overview
            lines_count = await db.lines.count_documents({})
            areas_count = await db.areas.count_documents({})
            
            base_stats.update({
                "lines_count": lines_count,
                "areas_count": areas_count,
                "dashboard_widgets": [
                    "performance_overview", "lines_comparison", "reps_ranking", 
                    "growth_trends", "financial_kpis", "strategic_metrics"
                ]
            })
            
        elif role_type == "manager":
            # Manager gets team overview
            base_stats.update({
                "team_performance": {},
                "dashboard_widgets": [
                    "team_overview", "performance_metrics", "targets_tracking"
                ]
            })
        
        return base_stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard stats error: {str(e)}")

@app.get("/api/dashboard/widgets/{role_type}")
async def get_dashboard_widgets(role_type: str, current_user: dict = Depends(get_current_user)):
    widgets_config = {
        "admin": [
            {"id": "system_overview", "title": "نظرة عامة على النظام", "type": "stats_grid", "size": "large"},
            {"id": "user_management", "title": "إدارة المستخدمين", "type": "user_stats", "size": "medium"},
            {"id": "financial_summary", "title": "الملخص المالي", "type": "financial_cards", "size": "large"},
            {"id": "activity_log", "title": "سجل الأنشطة", "type": "activity_list", "size": "medium"},
            {"id": "system_health", "title": "صحة النظام", "type": "health_indicators", "size": "small"}
        ],
        "gm": [
            {"id": "performance_overview", "title": "نظرة عامة على الأداء", "type": "kpi_cards", "size": "large"},
            {"id": "lines_comparison", "title": "مقارنة الخطوط", "type": "comparison_chart", "size": "medium"},
            {"id": "growth_trends", "title": "اتجاهات النمو", "type": "trend_chart", "size": "large"}
        ],
        "medical_rep": [
            {"id": "personal_stats", "title": "إحصائياتي الشخصية", "type": "personal_kpi", "size": "large"},
            {"id": "visit_tracker", "title": "متتبع الزيارات", "type": "visit_calendar", "size": "medium"},
            {"id": "targets_progress", "title": "تقدم الأهداف", "type": "progress_bars", "size": "medium"}
        ],
        "accounting": [
            {"id": "financial_overview", "title": "نظرة مالية شاملة", "type": "financial_summary", "size": "large"},
            {"id": "debt_management", "title": "إدارة الديون", "type": "debt_tracker", "size": "medium"},
            {"id": "payment_methods", "title": "طرق الدفع", "type": "payment_chart", "size": "small"}
        ],
        "manager": [
            {"id": "team_overview", "title": "نظرة عامة على الفريق", "type": "team_stats", "size": "large"},
            {"id": "performance_metrics", "title": "مقاييس الأداء", "type": "performance_chart", "size": "medium"}
        ]
    }
    
    return widgets_config.get(role_type, [])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)