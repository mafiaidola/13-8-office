# Analytics API Routes - مسارات API للتحليلات المتقدمة
from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Optional
from datetime import datetime, date
import os
from motor.motor_asyncio import AsyncIOMotorClient
import jwt

from models.analytics_models import *
from services.analytics_service import AnalyticsService

router = APIRouter()
security = HTTPBearer()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Initialize analytics service
analytics_service = AnalyticsService(db)

# JWT Configuration
JWT_SECRET_KEY = "your-secret-key-change-in-production"
JWT_ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """الحصول على المستخدم الحالي"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Sales Analytics
@router.get("/analytics/sales")
async def get_sales_analytics(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    rep_id: Optional[str] = None,
    area_id: Optional[str] = None,
    clinic_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تحليلات المبيعات"""
    try:
        filters = {}
        
        # للمندوبين: عرض بياناتهم فقط
        if current_user["role"] in ["medical_rep", "key_account"]:
            filters["rep_id"] = current_user["id"]
        elif rep_id:
            filters["rep_id"] = rep_id
        
        if area_id:
            filters["area_id"] = area_id
        if clinic_id:
            filters["clinic_id"] = clinic_id
        
        analytics = await analytics_service.generate_sales_analytics(time_range, filters)
        
        return {
            "success": True,
            "analytics": analytics.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب تحليلات المبيعات: {str(e)}")

# Visit Analytics
@router.get("/analytics/visits")
async def get_visit_analytics(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    rep_id: Optional[str] = None,
    clinic_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تحليلات الزيارات"""
    try:
        filters = {}
        
        # للمندوبين: عرض بياناتهم فقط
        if current_user["role"] in ["medical_rep", "key_account"]:
            filters["rep_id"] = current_user["id"]
        elif rep_id:
            filters["rep_id"] = rep_id
        
        if clinic_id:
            filters["clinic_id"] = clinic_id
        
        analytics = await analytics_service.generate_visit_analytics(time_range, filters)
        
        return {
            "success": True,
            "analytics": analytics.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب تحليلات الزيارات: {str(e)}")

# Performance Dashboard
@router.get("/analytics/performance")
async def get_performance_dashboard(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على لوحة الأداء الشخصية"""
    try:
        dashboard = await analytics_service.generate_performance_dashboard(
            current_user["id"], 
            time_range
        )
        
        return {
            "success": True,
            "dashboard": dashboard.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب لوحة الأداء: {str(e)}")

# Chart Configuration
@router.post("/analytics/charts/sales-by-product")
async def create_sales_by_product_chart(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء رسم بياني للمبيعات حسب المنتج"""
    try:
        # الحصول على تحليلات المبيعات
        filters = {}
        if current_user["role"] in ["medical_rep", "key_account"]:
            filters["rep_id"] = current_user["id"]
        
        analytics = await analytics_service.generate_sales_analytics(time_range, filters)
        
        # تحويل البيانات لتنسيق الرسم البياني
        chart_data = [
            {
                "label": product["product_name"],
                "value": product["total_sales"]
            }
            for product in analytics.top_products[:10]
        ]
        
        chart_config = await analytics_service.create_chart_config(
            ChartType.PIE,
            "المبيعات حسب المنتج",
            chart_data
        )
        
        return {
            "success": True,
            "chart": chart_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الرسم البياني: {str(e)}")

@router.post("/analytics/charts/visits-by-hour")
async def create_visits_by_hour_chart(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء رسم بياني للزيارات حسب الساعة"""
    try:
        filters = {}
        if current_user["role"] in ["medical_rep", "key_account"]:
            filters["rep_id"] = current_user["id"]
        
        analytics = await analytics_service.generate_visit_analytics(time_range, filters)
        
        # تحويل البيانات لتنسيق الرسم البياني
        chart_data = [
            {
                "label": item["hour"],
                "value": item["count"]
            }
            for item in analytics.visits_by_hour
        ]
        
        chart_config = await analytics_service.create_chart_config(
            ChartType.BAR,
            "الزيارات حسب الساعة",
            chart_data,
            x_axis_title="الساعة",
            y_axis_title="عدد الزيارات"
        )
        
        return {
            "success": True,
            "chart": chart_config.dict()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الرسم البياني: {str(e)}")

@router.post("/analytics/charts/rep-performance")
async def create_rep_performance_chart(
    time_range: TimeRange = TimeRange.THIS_MONTH,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء رسم بياني لأداء المندوبين"""
    try:
        # التحقق من الصلاحيات
        if current_user["role"] not in ["admin", "gm", "manager"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض أداء المندوبين")
        
        analytics = await analytics_service.generate_visit_analytics(time_range, {})
        
        # تحويل البيانات لتنسيق الرسم البياني
        chart_data = [
            {
                "label": rep["rep_name"],
                "value": rep["success_rate"]
            }
            for rep in analytics.rep_performance[:10]
        ]
        
        chart_config = await analytics_service.create_chart_config(
            ChartType.BAR,
            "أداء المندوبين - معدل نجاح الزيارات",
            chart_data,
            x_axis_title="المندوب",
            y_axis_title="معدل النجاح (%)"
        )
        
        return {
            "success": True,
            "chart": chart_config.dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء الرسم البياني: {str(e)}")

# Report Generation
@router.post("/analytics/reports/generate")
async def generate_analytics_report(
    report_request: ReportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """إنشاء تقرير تحليلات"""
    try:
        # التحقق من الصلاحيات
        if report_request.type in [ReportType.REP_PERFORMANCE, ReportType.FINANCIAL_ANALYSIS]:
            if current_user["role"] not in ["admin", "gm", "manager"]:
                raise HTTPException(status_code=403, detail="غير مصرح لك بهذا النوع من التقارير")
        
        # إنشاء التقرير في الخلفية
        report = await analytics_service.export_analytics_report(report_request, current_user["id"])
        
        return {
            "success": True,
            "message": "تم إنشاء التقرير بنجاح",
            "report_id": report.id,
            "download_url": f"/api/analytics/reports/{report.id}/download"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في إنشاء التقرير: {str(e)}")

@router.get("/analytics/reports/{report_id}")
async def get_report_details(
    report_id: str,
    current_user: dict = Depends(get_current_user)
):
    """الحصول على تفاصيل التقرير"""
    try:
        report = await db.generated_reports.find_one({"id": report_id}, {"_id": 0})
        
        if not report:
            raise HTTPException(status_code=404, detail="التقرير غير موجود")
        
        # التحقق من الصلاحيات
        if report["generated_by"] != current_user["id"] and current_user["role"] not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بعرض هذا التقرير")
        
        return {
            "success": True,
            "report": report
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التقرير: {str(e)}")

@router.get("/analytics/reports")
async def list_my_reports(
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """قائمة تقاريري"""
    try:
        query = {}
        
        # للمندوبين: تقاريرهم فقط
        if current_user["role"] in ["medical_rep", "key_account"]:
            query["generated_by"] = current_user["id"]
        elif current_user["role"] not in ["admin", "gm"]:
            query["generated_by"] = current_user["id"]
        
        total_count = await db.generated_reports.count_documents(query)
        
        reports = await db.generated_reports.find(
            query,
            {"_id": 0}
        ).sort("generated_at", -1).skip(offset).limit(limit).to_list(limit)
        
        # تنسيق التواريخ
        for report in reports:
            if "generated_at" in report and isinstance(report["generated_at"], datetime):
                report["generated_at"] = report["generated_at"].isoformat()
        
        return {
            "success": True,
            "data": {
                "reports": reports,
                "total_count": total_count,
                "has_more": (offset + len(reports)) < total_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التقارير: {str(e)}")

# Real-time Analytics
@router.get("/analytics/real-time")
async def get_real_time_analytics(
    current_user: dict = Depends(get_current_user)
):
    """الحصول على التحليلات الفورية"""
    try:
        metrics = await analytics_service.get_real_time_metrics()
        
        return {
            "success": True,
            "metrics": [metric.dict() for metric in metrics],
            "last_updated": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التحليلات الفورية: {str(e)}")

# Custom Analytics
@router.post("/analytics/custom-query")
async def execute_custom_analytics_query(
    query_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """تنفيذ استعلام تحليلات مخصص"""
    try:
        # التحقق من الصلاحيات
        if current_user["role"] not in ["admin", "gm"]:
            raise HTTPException(status_code=403, detail="غير مصرح لك بالاستعلامات المخصصة")
        
        # هذا مثال بسيط - يمكن تطويره أكثر
        collection_name = query_data.get("collection", "orders")
        aggregation_pipeline = query_data.get("pipeline", [])
        
        if collection_name not in ["orders", "visits", "clinics", "users"]:
            raise HTTPException(status_code=400, detail="مجموعة غير مدعومة")
        
        collection = getattr(db, collection_name)
        results = await collection.aggregate(aggregation_pipeline).to_list(1000)
        
        return {
            "success": True,
            "results": results,
            "count": len(results)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في تنفيذ الاستعلام: {str(e)}")

# Dashboard Templates
@router.get("/analytics/dashboard-templates")
async def get_dashboard_templates(
    current_user: dict = Depends(get_current_user)
):
    """الحصول على قوالب لوحات المعلومات"""
    try:
        templates = []
        
        if current_user["role"] in ["medical_rep", "key_account"]:
            templates = [
                {
                    "id": "rep_dashboard",
                    "name": "لوحة المندوب الطبي",
                    "description": "لوحة معلومات شخصية للمندوب الطبي",
                    "charts": ["visits_by_hour", "my_performance", "my_clients"]
                }
            ]
        else:
            templates = [
                {
                    "id": "management_dashboard",
                    "name": "لوحة الإدارة",
                    "description": "لوحة معلومات شاملة للإدارة",
                    "charts": ["sales_overview", "rep_performance", "geographic_analysis"]
                },
                {
                    "id": "sales_dashboard",
                    "name": "لوحة المبيعات",
                    "description": "تركز على تحليل المبيعات والأداء",
                    "charts": ["sales_trends", "top_products", "sales_by_area"]
                }
            ]
        
        return {
            "success": True,
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في جلب القوالب: {str(e)}")

# Export Data
@router.get("/analytics/export/{export_type}")
async def export_analytics_data(
    export_type: str,
    time_range: TimeRange = TimeRange.THIS_MONTH,
    format: str = Query("json", regex="^(json|csv|excel)$"),
    current_user: dict = Depends(get_current_user)
):
    """تصدير بيانات التحليلات"""
    try:
        data = {}
        
        if export_type == "sales":
            filters = {}
            if current_user["role"] in ["medical_rep", "key_account"]:
                filters["rep_id"] = current_user["id"]
            
            analytics = await analytics_service.generate_sales_analytics(time_range, filters)
            data = analytics.dict()
            
        elif export_type == "visits":
            filters = {}
            if current_user["role"] in ["medical_rep", "key_account"]:
                filters["rep_id"] = current_user["id"]
            
            analytics = await analytics_service.generate_visit_analytics(time_range, filters)
            data = analytics.dict()
            
        else:
            raise HTTPException(status_code=400, detail="نوع تصدير غير مدعوم")
        
        return {
            "success": True,
            "data": data,
            "format": format,
            "exported_at": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"خطأ في التصدير: {str(e)}")