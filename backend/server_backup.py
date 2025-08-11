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
import uuid
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
from routers.visits_routes import router as visits_router
from routers.activities_routes import router as activities_router
from routers.invoice_management_routes import router as invoice_router
from routers.debt_management_routes import router as debt_router

# Import clinic routes from routes directory
from routes.enhanced_clinic_routes import router as clinic_router

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
app.include_router(products_router)
app.include_router(visits_router)
app.include_router(activities_router)
app.include_router(invoice_router)
app.include_router(debt_router)
app.include_router(clinic_router)

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
async def login(credentials: dict):
    try:
        username = credentials.get("username")
        password = credentials.get("password")
        geolocation = credentials.get("geolocation")  # البيانات الجغرافية الاختيارية
        device_info = credentials.get("device_info")  # معلومات الجهاز
        ip_address = credentials.get("ip_address")  # عنوان IP
        
        if not username or not password:
            raise HTTPException(status_code=400, detail="Username and password required")

        if username == "admin" and password == "admin123":
            # Admin login
            admin_user = await db.users.find_one({"username": "admin"})
            if not admin_user:
                # Create admin user if not exists
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
            
            token = create_jwt_token({
                "id": admin_user.get("id", "admin-001"),
                "username": admin_user["username"],
                "role": admin_user["role"],
                "full_name": admin_user.get("full_name", "System Administrator")
            })
            
            user_info = {
                "id": admin_user.get("id", "admin-001"),
                "username": admin_user["username"],
                "full_name": admin_user.get("full_name", "System Administrator"),
                "role": admin_user["role"]
            }
            
            # تسجيل عملية الدخول
            await log_user_login(user_info, geolocation, device_info, ip_address)
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": user_info
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
            
            user_info = {
                "id": user.get("id", str(user.get("_id"))),
                "username": user["username"],
                "full_name": user.get("full_name", ""),
                "role": user["role"]
            }
            
            # تسجيل عملية الدخول
            await log_user_login(user_info, geolocation, device_info, ip_address)
            
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": user_info
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login error: {str(e)}")

async def log_user_login(user_info: dict, geolocation: dict = None, device_info: str = None, ip_address: str = None):
    """تسجيل عملية دخول المستخدم مع الموقع الجغرافي"""
    try:
        login_log = {
            "id": str(uuid.uuid4()),
            "user_id": user_info["id"],
            "username": user_info["username"],
            "full_name": user_info["full_name"],
            "role": user_info["role"],
            "login_time": datetime.utcnow().isoformat(),
            "device_info": device_info or "Unknown Device",
            "ip_address": ip_address or "Unknown IP",
            "geolocation": geolocation or {},
            "session_id": str(uuid.uuid4()),
            "login_method": "web_portal",
            "is_active_session": True
        }
        
        # إضافة معلومات الموقع إذا كانت متوفرة
        if geolocation:
            login_log.update({
                "latitude": geolocation.get("latitude"),
                "longitude": geolocation.get("longitude"),
                "location_accuracy": geolocation.get("accuracy"),
                "location_timestamp": geolocation.get("timestamp"),
                "city": geolocation.get("city", "Unknown"),
                "country": geolocation.get("country", "Unknown"),
                "address": geolocation.get("address", "")
            })
        
        print(f"🔍 محاولة حفظ سجل دخول: {user_info['username']}")
        print(f"📍 الموقع: {geolocation.get('city', 'Unknown') if geolocation else 'No location'}")
        
        # حفظ سجل الدخول في قاعدة البيانات مع معالجة أفضل للأخطاء
        result = await db.login_logs.insert_one(login_log)
        
        if result.inserted_id:
            print(f"✅ تم حفظ سجل الدخول بنجاح: {user_info['username']} - ID: {result.inserted_id}")
            
            # التحقق من الحفظ
            saved_log = await db.login_logs.find_one({"id": login_log["id"]})
            if saved_log:
                print(f"🎯 تم التحقق من حفظ البيانات: session_id = {saved_log['session_id']}")
            else:
                print(f"⚠️ لم يتم العثور على السجل المحفوظ")
        else:
            print(f"❌ فشل في الحصول على inserted_id")
        
        # تسجيل النشاط في مجموعة الأنشطة
        activity_record = {
            "_id": str(uuid.uuid4()),
            "activity_type": "login",
            "description": f"تسجيل دخول للنظام - {user_info['role']}",
            "user_id": user_info["id"],
            "user_name": user_info["full_name"] or user_info["username"],
            "user_role": user_info["role"],
            "ip_address": ip_address or "Unknown IP",
            "location": f"{geolocation.get('city', 'Unknown')}, {geolocation.get('country', 'Unknown')}" if geolocation else "Unknown Location",
            "device_info": device_info or "Unknown Device",
            "details": f"جلسة جديدة: {login_log['session_id'][:8]}...",
            "geolocation": geolocation,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            await db.activities.insert_one(activity_record)
            print(f"✅ تم تسجيل نشاط تسجيل الدخول للمستخدم: {user_info['username']}")
        except Exception as activity_error:
            print(f"⚠️ خطأ في تسجيل النشاط: {activity_error}")
        
        # عرض إحصائيات سريعة
        total_logs = await db.login_logs.count_documents({})
        user_logs = await db.login_logs.count_documents({"username": user_info["username"]})
        print(f"📊 إجمالي السجلات: {total_logs} | سجلات {user_info['username']}: {user_logs}")
        
    except Exception as e:
        print(f"❌ خطأ في تسجيل عملية الدخول لـ {user_info.get('username', 'Unknown')}: {str(e)}")
        print(f"🔍 تفاصيل الخطأ: {type(e).__name__}: {e}")
        
        # محاولة بديلة للحفظ
        try:
            basic_log = {
                "_id": str(uuid.uuid4()),
                "username": user_info["username"],
                "login_time": datetime.utcnow().isoformat(),
                "role": user_info.get("role", "unknown")
            }
            await db.login_logs.insert_one(basic_log)
            print(f"✅ تم حفظ سجل مبسط كحل بديل لـ {user_info['username']}")
        except Exception as fallback_error:
            print(f"❌ فشل حتى الحل البديل: {fallback_error}")
            # لا نقف التطبيق إذا فشل التسجيل
            pass

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

@app.get("/api/clinics")
async def get_clinics(current_user: dict = Depends(get_current_user)):
    """Get all clinics - Fixed endpoint"""
    try:
        # Get clinics from database
        clinics = []
        cursor = db.clinics.find({"is_active": {"$ne": False}}, {"_id": 0})
        async for clinic in cursor:
            clinics.append(clinic)
        
        return clinics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching clinics: {str(e)}")

@app.post("/api/clinics")
async def create_clinic(clinic_data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new clinic"""
    try:
        # Verify user has permission to create clinics
        user_role = current_user.get("role", "")
        if user_role not in ["medical_rep", "admin", "manager", "line_manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بتسجيل العيادات")
        
        # Generate unique ID and registration number
        clinic_id = str(uuid.uuid4())
        registration_number = f"CL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Prepare clinic document
        clinic_document = {
            "id": clinic_id,
            "registration_number": registration_number,
            "clinic_name": clinic_data.get("clinic_name", ""),
            "clinic_phone": clinic_data.get("clinic_phone", ""),
            "clinic_email": clinic_data.get("clinic_email", ""),
            "doctor_name": clinic_data.get("doctor_name", ""),
            "doctor_phone": clinic_data.get("doctor_phone", ""),
            "clinic_address": clinic_data.get("clinic_address", ""),
            "line_id": clinic_data.get("line_id", ""),
            "area_id": clinic_data.get("area_id", ""),
            "classification": clinic_data.get("classification", "class_b"),
            "credit_classification": clinic_data.get("credit_classification", "yellow"),
            "classification_notes": clinic_data.get("classification_notes", ""),
            "registration_notes": clinic_data.get("registration_notes", ""),
            
            # Location data
            "clinic_latitude": clinic_data.get("clinic_latitude"),
            "clinic_longitude": clinic_data.get("clinic_longitude"),
            "location_accuracy": clinic_data.get("location_accuracy"),
            "formatted_address": clinic_data.get("formatted_address", ""),
            "place_id": clinic_data.get("place_id"),
            
            # System fields
            "registered_by": current_user.get("username", ""),
            "created_by": current_user.get("user_id", ""),
            "status": "pending",
            "is_active": True,
            "is_verified": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            
            # GPS tracking data
            "gps_accuracy": clinic_data.get("gps_accuracy"),
            "address_source": clinic_data.get("address_source", "manual"),
            "registration_timestamp": clinic_data.get("registration_timestamp", datetime.utcnow().isoformat())
        }
        
        # Insert into database
        result = await db.clinics.insert_one(clinic_document)
        
        if result.inserted_id:
            print(f"✅ تم تسجيل العيادة بنجاح: {clinic_data.get('clinic_name', 'Unknown')} - ID: {clinic_id}")
            
            # Create activity log
            activity_record = {
                "_id": str(uuid.uuid4()),
                "activity_type": "clinic_registration",
                "description": f"تسجيل عيادة جديدة: {clinic_data.get('clinic_name', 'Unknown')}",
                "user_id": current_user.get("user_id", ""),
                "user_name": current_user.get("full_name", current_user.get("username", "")),
                "user_role": current_user.get("role", ""),
                "details": f"عيادة: {clinic_data.get('clinic_name', 'Unknown')} - دكتور: {clinic_data.get('doctor_name', 'Unknown')}",
                "clinic_id": clinic_id,
                "clinic_name": clinic_data.get("clinic_name", ""),
                "location": clinic_data.get("clinic_address", "Unknown Location"),
                "timestamp": datetime.utcnow().isoformat(),
                "created_at": datetime.utcnow().isoformat()
            }
            
            try:
                await db.activities.insert_one(activity_record)
                print(f"✅ تم تسجيل نشاط تسجيل العيادة")
            except Exception as activity_error:
                print(f"⚠️ خطأ في تسجيل النشاط: {activity_error}")
            
            return {
                "success": True,
                "message": "تم تسجيل العيادة بنجاح",
                "clinic_id": clinic_id,
                "registration_number": registration_number,
                "status": "pending"
            }
        else:
            raise HTTPException(status_code=500, detail="فشل في حفظ العيادة")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ خطأ في تسجيل العيادة: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في حفظ بيانات العيادة: {str(e)}")

# ============================================================================
# PAYMENT MANAGEMENT ENDPOINTS - نظام إدارة المدفوعات
# ============================================================================

@app.get("/api/payments")
async def get_payments(current_user: dict = Depends(get_current_user)):
    """Get all payments - إدراج جميع المدفوعات"""
    try:
        # Get payments from database
        payments = []
        cursor = db.payments.find({}, {"_id": 0}).sort("payment_date", -1)
        async for payment in cursor:
            payments.append(payment)
        
        return payments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payments: {str(e)}")

@app.post("/api/payments/process")
async def process_payment(payment_data: dict, current_user: dict = Depends(get_current_user)):
    """Process a payment for a debt - معالجة دفعة لدين"""
    try:
        debt_id = payment_data.get("debt_id")
        payment_amount = float(payment_data.get("payment_amount", 0))
        payment_method = payment_data.get("payment_method", "cash")
        payment_notes = payment_data.get("payment_notes", "")
        
        if not debt_id or payment_amount <= 0:
            raise HTTPException(status_code=400, detail="معرف الدين ومبلغ الدفع مطلوبان")
        
        # Find the debt
        debt = await db.debts.find_one({"id": debt_id})
        if not debt:
            raise HTTPException(status_code=404, detail="الدين غير موجود")
        
        current_remaining = float(debt.get("remaining_amount", 0))
        if payment_amount > current_remaining:
            raise HTTPException(status_code=400, detail="مبلغ الدفع أكبر من المبلغ المتبقي")
        
        # Create payment record
        payment_id = str(uuid.uuid4())
        payment_record = {
            "id": payment_id,
            "debt_id": debt_id,
            "clinic_id": debt.get("clinic_id", ""),
            "clinic_name": debt.get("clinic_name", ""),
            "payment_amount": payment_amount,
            "payment_method": payment_method,
            "payment_date": datetime.utcnow().isoformat(),
            "payment_notes": payment_notes,
            "processed_by": current_user.get("user_id", ""),
            "processor_name": current_user.get("full_name", current_user.get("username", "")),
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert payment record
        await db.payments.insert_one(payment_record)
        
        # Update debt
        new_remaining = current_remaining - payment_amount
        debt_status = "paid" if new_remaining == 0 else "partially_paid"
        
        await db.debts.update_one(
            {"id": debt_id},
            {
                "$set": {
                    "remaining_amount": new_remaining,
                    "status": debt_status,
                    "last_payment_date": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        # Create activity log
        activity_record = {
            "_id": str(uuid.uuid4()),
            "activity_type": "payment_processed",
            "description": f"معالجة دفعة بمبلغ {payment_amount} ج.م للعيادة {debt.get('clinic_name', 'Unknown')}",
            "user_id": current_user.get("user_id", ""),
            "user_name": current_user.get("full_name", current_user.get("username", "")),
            "user_role": current_user.get("role", ""),
            "details": f"الدين: {debt_id} - المبلغ المدفوع: {payment_amount} ج.م - المتبقي: {new_remaining} ج.م",
            "payment_id": payment_id,
            "debt_id": debt_id,
            "amount": payment_amount,
            "timestamp": datetime.utcnow().isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        try:
            await db.activities.insert_one(activity_record)
        except Exception as activity_error:
            print(f"⚠️ خطأ في تسجيل نشاط المدفوعات: {activity_error}")
        
        return {
            "success": True,
            "message": f"تم معالجة الدفعة بنجاح - المبلغ: {payment_amount} ج.م",
            "payment_id": payment_id,
            "debt_id": debt_id,
            "new_remaining_amount": new_remaining,
            "debt_status": debt_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ خطأ في معالجة الدفعة: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطأ في معالجة الدفعة: {str(e)}")

@app.get("/api/payments/statistics")
async def get_payment_statistics(current_user: dict = Depends(get_current_user)):
    """Get payment statistics - إحصائيات المدفوعات"""
    try:
        # Calculate payment statistics
        total_payments = await db.payments.count_documents({})
        
        # Calculate total amount paid
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_amount_paid": {"$sum": "$payment_amount"},
                    "count": {"$sum": 1}
                }
            }
        ]
        
        result = await db.payments.aggregate(pipeline).to_list(1)
        total_amount_paid = result[0]["total_amount_paid"] if result else 0
        
        # Get payment methods distribution
        methods_pipeline = [
            {
                "$group": {
                    "_id": "$payment_method",
                    "count": {"$sum": 1},
                    "amount": {"$sum": "$payment_amount"}
                }
            }
        ]
        
        methods_result = await db.payments.aggregate(methods_pipeline).to_list(10)
        payment_methods = {method["_id"]: {"count": method["count"], "amount": method["amount"]} for method in methods_result}
        
        return {
            "total_payments": total_payments,
            "total_amount_paid": total_amount_paid,
            "payment_methods": payment_methods,
            "average_payment": round(total_amount_paid / total_payments, 2) if total_payments > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching payment statistics: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)