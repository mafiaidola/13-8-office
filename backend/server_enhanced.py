# نظام الإدارة الطبية المتكامل - الخادم المحسن
# Medical Management System - Enhanced Server

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import traceback

# Database client
db_client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """إدارة دورة حياة التطبيق"""
    global db_client, db
    
    try:
        # الاتصال بقاعدة البيانات
        mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
        db_name = os.environ.get('DB_NAME', 'medical_management_system')
        
        print(f"🔌 Connecting to MongoDB: {mongo_url}")
        db_client = AsyncIOMotorClient(mongo_url)
        db = db_client[db_name]
        
        # اختبار الاتصال
        await db.command('ping')
        print("✅ Connected to MongoDB successfully")
        
        # إنشاء الفهارس المطلوبة
        await create_database_indexes()
        
        yield
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        print(traceback.format_exc())
        yield
    finally:
        # إغلاق الاتصال
        if db_client:
            db_client.close()
            print("🔌 MongoDB connection closed")

async def create_database_indexes():
    """إنشاء الفهارس المطلوبة لقاعدة البيانات"""
    try:
        print("🔧 Creating database indexes...")
        
        # فهارس المستخدمين
        await db.users.create_index("id", unique=True)
        await db.users.create_index("username", unique=True)
        await db.users.create_index("email", unique=True)
        await db.users.create_index("role")
        
        # فهارس العيادات
        await db.clinics.create_index("id", unique=True)
        await db.clinics.create_index("assigned_rep_id")
        await db.clinics.create_index("area_id")
        await db.clinics.create_index([("name", "text")])
        
        # فهارس السجلات المالية الموحدة
        await db.unified_financial_records.create_index("id", unique=True)
        await db.unified_financial_records.create_index("record_number", unique=True)
        await db.unified_financial_records.create_index("record_type")
        await db.unified_financial_records.create_index("clinic_id")
        await db.unified_financial_records.create_index("sales_rep_id")
        await db.unified_financial_records.create_index("status")
        await db.unified_financial_records.create_index("issue_date")
        await db.unified_financial_records.create_index("due_date")
        await db.unified_financial_records.create_index([
            ("clinic_id", 1), 
            ("record_type", 1), 
            ("status", 1)
        ])
        
        # فهارس الزيارات
        await db.rep_visits.create_index("id", unique=True)
        await db.rep_visits.create_index("visit_number", unique=True)
        await db.rep_visits.create_index("medical_rep_id")
        await db.rep_visits.create_index("clinic_id")
        await db.rep_visits.create_index("status")
        await db.rep_visits.create_index("scheduled_date")
        await db.rep_visits.create_index([
            ("medical_rep_id", 1),
            ("scheduled_date", 1)
        ])
        await db.rep_visits.create_index([
            ("clinic_id", 1),
            ("status", 1)
        ])
        
        # فهارس الطلبات
        await db.orders.create_index("id", unique=True)
        await db.orders.create_index("order_number", unique=True)
        await db.orders.create_index("clinic_id")
        await db.orders.create_index("assigned_rep_id")
        await db.orders.create_index("status")
        await db.orders.create_index("created_at")
        
        # فهارس المنتجات
        await db.products.create_index("id", unique=True)
        await db.products.create_index("product_code", unique=True)
        await db.products.create_index([("name", "text"), ("description", "text")])
        
        # فهارس الديون (للتوافق مع النظام القديم)
        await db.debts.create_index("id", unique=True)
        await db.debts.create_index("clinic_id")
        await db.debts.create_index("assigned_rep_id")
        await db.debts.create_index("status")
        await db.debts.create_index("due_date")
        
        # فهارس المدفوعات (للتوافق مع النظام القديم)
        await db.payments.create_index("id", unique=True)
        await db.payments.create_index("clinic_id")
        await db.payments.create_index("payment_date")
        
        print("✅ Database indexes created successfully")
        
    except Exception as e:
        print(f"⚠️ Error creating indexes: {str(e)}")

# إنشاء التطبيق مع إدارة دورة الحياة
app = FastAPI(
    title="نظام الإدارة الطبية المتكامل",
    description="Medical Management System with Unified Financial Management and Visit Tracking",
    version="2.0.0",
    lifespan=lifespan
)

# إعداد CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# استيراد وتسجيل الموجهات
try:
    # الموجهات الأساسية
    from routes.auth_routes import router as auth_router
    from routes.crm_routes import router as crm_router
    from routes.dashboard_routes import router as dashboard_router
    from routes.analytics_routes import router as analytics_router
    
    # الموجهات المحسنة الجديدة
    from routes.unified_financial_routes import router as unified_financial_router
    from routes.visit_management_routes import router as visit_management_router
    
    # الموجهات القديمة للتوافق
    from routes.financial_routes import router as financial_router
    from routes.debt_routes import router as debt_router
    from routers.integrated_financial_router import router as integrated_financial_router
    
    # تسجيل الموجهات الأساسية
    app.include_router(auth_router, prefix="/api")
    app.include_router(crm_router, prefix="/api")
    app.include_router(dashboard_router, prefix="/api")
    app.include_router(analytics_router, prefix="/api")
    
    # تسجيل الموجهات المحسنة الجديدة
    app.include_router(unified_financial_router, prefix="/api")
    app.include_router(visit_management_router, prefix="/api")
    
    # تسجيل الموجهات القديمة للتوافق مع النظام الحالي
    app.include_router(financial_router, prefix="/api")
    app.include_router(debt_router, prefix="/api")
    app.include_router(integrated_financial_router, prefix="/api")
    
    print("✅ All routers registered successfully")
    
except Exception as e:
    print(f"⚠️ Error importing routers: {str(e)}")
    print(traceback.format_exc())

@app.get("/")
async def root():
    """الصفحة الرئيسية"""
    return {
        "message": "نظام الإدارة الطبية المتكامل - الإصدار المحسن",
        "version": "2.0.0",
        "features": [
            "نظام مالي موحد",
            "إدارة زيارات المناديب",
            "تتبع العيادات والصلاحيات",
            "تقارير شاملة",
            "واجهة برمجية محسنة"
        ]
    }

@app.get("/api/health")
async def health_check():
    """فحص صحة النظام"""
    try:
        # فحص الاتصال بقاعدة البيانات
        if db is None:
            raise Exception("Database not connected")
        
        await db.command('ping')
        
        # إحصائيات أساسية
        users_count = await db.users.count_documents({})
        clinics_count = await db.clinics.count_documents({})
        financial_records_count = await db.unified_financial_records.count_documents({})
        visits_count = await db.rep_visits.count_documents({})
        
        return {
            "status": "healthy",
            "database": "connected",
            "statistics": {
                "users": users_count,
                "clinics": clinics_count,
                "financial_records": financial_records_count,
                "visits": visits_count
            }
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "الصفحة المطلوبة غير موجودة",
        "message": "تأكد من صحة الرابط المطلوب",
        "status_code": 404
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "خطأ داخلي في الخادم",
        "message": "يرجى المحاولة مرة أخرى أو التواصل مع الدعم التقني",
        "status_code": 500
    }

if __name__ == "__main__":
    import uvicorn
    
    # تشغيل الخادم
    uvicorn.run(
        "server_enhanced:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )