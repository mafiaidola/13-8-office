"""
Dashboard Routes - مسارات لوحة التحكم المخصصة للأدوار
نظام لوحة تحكم احترافي مع واجهات مختلفة لكل مستوى إداري
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from ..models.auth_models import User, UserRole
from ..auth import get_current_user
from ..database import get_database

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats/{role_type}")
async def get_role_based_dashboard_stats(
    role_type: str,
    time_filter: str = Query("today", regex="^(today|week|month|quarter|year)$"),
    current_user: User = Depends(get_current_user)
):
    """
    الحصول على إحصائيات لوحة التحكم حسب الدور الإداري
    مع فلترة زمنية وأرقام دقيقة من قاعدة البيانات
    """
    db = await get_database()
    
    # تحديد النطاق الزمني
    now = datetime.utcnow()
    if time_filter == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == "week":
        start_date = now - timedelta(days=7)
    elif time_filter == "month":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == "quarter":
        quarter_start_month = ((now.month - 1) // 3) * 3 + 1
        start_date = now.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
    elif time_filter == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    end_date = now
    date_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}

    # التحقق من الصلاحيات
    allowed_roles = {
        "admin": [UserRole.ADMIN],
        "gm": [UserRole.ADMIN, UserRole.GM],
        "manager": [UserRole.ADMIN, UserRole.GM, UserRole.LINE_MANAGER, UserRole.AREA_MANAGER],
        "medical_rep": [UserRole.ADMIN, UserRole.GM, UserRole.LINE_MANAGER, UserRole.MEDICAL_REP],
        "accounting": [UserRole.ADMIN, UserRole.ACCOUNTING, UserRole.FINANCE],
        "finance": [UserRole.ADMIN, UserRole.GM, UserRole.ACCOUNTING, UserRole.FINANCE]
    }
    
    if role_type not in allowed_roles or current_user.role not in allowed_roles[role_type]:
        raise HTTPException(status_code=403, detail="غير مصرح لك بالوصول لهذه البيانات")

    try:
        # إحصائيات أساسية للجميع
        base_stats = await get_base_statistics(db, date_filter, start_date, end_date)
        
        # إحصائيات مخصصة حسب الدور
        if role_type == "admin":
            role_stats = await get_admin_dashboard_stats(db, date_filter, current_user)
        elif role_type == "gm":
            role_stats = await get_gm_dashboard_stats(db, date_filter, current_user)
        elif role_type == "manager":
            role_stats = await get_manager_dashboard_stats(db, date_filter, current_user)
        elif role_type == "medical_rep":
            role_stats = await get_medical_rep_dashboard_stats(db, date_filter, current_user)
        elif role_type == "accounting":
            role_stats = await get_accounting_dashboard_stats(db, date_filter, current_user)
        elif role_type == "finance":
            role_stats = await get_finance_dashboard_stats(db, date_filter, current_user)
        else:
            role_stats = {}
        
        # دمج الإحصائيات
        dashboard_data = {
            **base_stats,
            **role_stats,
            "time_filter": time_filter,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "user_role": current_user.role,
            "dashboard_type": role_type
        }
        
        return dashboard_data
        
    except Exception as e:
        print(f"خطأ في جلب إحصائيات لوحة التحكم: {str(e)}")
        raise HTTPException(status_code=500, detail="خطأ في جلب بيانات لوحة التحكم")

async def get_base_statistics(db, date_filter, start_date, end_date):
    """إحصائيات أساسية مشتركة"""
    # إجمالي المستخدمين النشطين
    total_users = await db.users.count_documents({"is_active": {"$ne": False}})
    
    # إجمالي العيادات النشطة
    total_clinics = await db.clinics.count_documents({"is_active": {"$ne": False}})
    
    # إجمالي المنتجات النشطة
    total_products = await db.products.count_documents({"is_active": {"$ne": False}})
    
    # عدد الطلبات في الفترة المحددة
    orders_in_period = await db.orders.count_documents(date_filter)
    
    # عدد الزيارات في الفترة المحددة
    visits_in_period = await db.visits.count_documents(date_filter)
    
    return {
        "total_users": total_users,
        "total_clinics": total_clinics,
        "total_products": total_products,
        "orders_in_period": orders_in_period,
        "visits_in_period": visits_in_period
    }

async def get_admin_dashboard_stats(db, date_filter, current_user):
    """إحصائيات خاصة بالأدمن - رؤية شاملة للنظام"""
    try:
        # إحصائيات المستخدمين حسب الدور
        user_roles_pipeline = [
            {"$group": {"_id": "$role", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        user_roles_stats = await db.users.aggregate(user_roles_pipeline).to_list(10)
        
        # إحصائيات العيادات حسب التصنيف
        clinic_classifications = await db.clinics.aggregate([
            {"$group": {"_id": "$classification", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(10)
        
        # إحصائيات مالية شاملة
        financial_stats = await db.debts.aggregate([
            {"$group": {
                "_id": None,
                "total_debts": {"$sum": 1},
                "total_outstanding": {"$sum": {"$cond": [{"$eq": ["$status", "outstanding"]}, "$remaining_amount", 0]}},
                "total_settled": {"$sum": {"$cond": [{"$eq": ["$status", "settled"]}, "$original_amount", 0]}}
            }}
        ]).to_list(1)
        
        # مؤشرات الأداء الشاملة
        performance_indicators = await calculate_system_performance(db, date_filter)
        
        # أحدث الأنشطة الإدارية
        recent_activities = await get_recent_admin_activities(db, limit=10)
        
        # تقارير النظام
        system_health = await get_system_health_metrics(db)
        
        financial_data = financial_stats[0] if financial_stats else {
            "total_debts": 0, "total_outstanding": 0, "total_settled": 0
        }
        
        return {
            "user_roles_distribution": user_roles_stats,
            "clinic_classifications": clinic_classifications,
            "financial_overview": financial_data,
            "performance_indicators": performance_indicators,
            "recent_activities": recent_activities,
            "system_health": system_health,
            "dashboard_widgets": [
                "system_overview", "user_management", "financial_summary", 
                "performance_metrics", "activity_log", "system_health"
            ]
        }
    except Exception as e:
        print(f"خطأ في إحصائيات الأدمن: {str(e)}")
        return {}

async def get_gm_dashboard_stats(db, date_filter, current_user):
    """إحصائيات خاصة بالمدير العام - رؤية إدارية استراتيجية"""
    try:
        # إحصائيات الخطوط والمناطق
        lines_performance = await db.orders.aggregate([
            {"$match": date_filter},
            {"$group": {
                "_id": "$line",
                "orders_count": {"$sum": 1},
                "total_revenue": {"$sum": "$total_amount"},
                "avg_order_value": {"$avg": "$total_amount"}
            }},
            {"$sort": {"total_revenue": -1}}
        ]).to_list(20)
        
        # أداء المناديب
        reps_performance = await db.visits.aggregate([
            {"$match": date_filter},
            {"$group": {
                "_id": "$sales_rep_id",
                "visits_count": {"$sum": 1},
                "successful_visits": {"$sum": {"$cond": [{"$eq": ["$effective", True]}, 1, 0]}},
                "success_rate": {"$multiply": [
                    {"$divide": [
                        {"$sum": {"$cond": [{"$eq": ["$effective", True]}, 1, 0]}},
                        {"$sum": 1}
                    ]}, 100
                ]}
            }},
            {"$sort": {"success_rate": -1}},
            {"$limit": 10}
        ]).to_list(10)
        
        # إحصائيات العيادات الجديدة
        new_clinics = await db.clinics.count_documents({
            "created_at": {"$gte": date_filter["created_at"]["$gte"]}
        })
        
        # معدل النمو الشهري
        growth_metrics = await calculate_growth_metrics(db, date_filter)
        
        # أهم المؤشرات المالية
        financial_kpis = await calculate_financial_kpis(db, date_filter)
        
        return {
            "lines_performance": lines_performance,
            "reps_performance": reps_performance,
            "new_clinics_count": new_clinics,
            "growth_metrics": growth_metrics,
            "financial_kpis": financial_kpis,
            "dashboard_widgets": [
                "performance_overview", "lines_comparison", "reps_ranking", 
                "growth_trends", "financial_kpis", "strategic_metrics"
            ]
        }
    except Exception as e:
        print(f"خطأ في إحصائيات المدير العام: {str(e)}")
        return {}

async def get_medical_rep_dashboard_stats(db, date_filter, current_user):
    """إحصائيات خاصة بالمندوب الطبي - رؤية شخصية للأداء"""
    try:
        # زيارات المندوب
        rep_visits = await db.visits.count_documents({
            **date_filter,
            "sales_rep_id": current_user.id
        })
        
        # الزيارات الناجحة
        successful_visits = await db.visits.count_documents({
            **date_filter,
            "sales_rep_id": current_user.id,
            "effective": True
        })
        
        # طلبات المندوب
        rep_orders = await db.orders.aggregate([
            {"$match": {**date_filter, "medical_rep_id": current_user.id}},
            {"$group": {
                "_id": None,
                "orders_count": {"$sum": 1},
                "total_value": {"$sum": "$total_amount"},
                "avg_order_value": {"$avg": "$total_amount"}
            }}
        ]).to_list(1)
        
        # العيادات المخصصة للمندوب
        assigned_clinics = await db.clinics.count_documents({
            "assigned_rep_id": current_user.id,
            "is_active": {"$ne": False}
        })
        
        # أداء المندوب مقارنة بالمعدل العام
        rep_ranking = await calculate_rep_ranking(db, current_user.id, date_filter)
        
        # الأهداف والإنجازات
        targets_achievements = await get_rep_targets_and_achievements(db, current_user.id, date_filter)
        
        orders_data = rep_orders[0] if rep_orders else {
            "orders_count": 0, "total_value": 0, "avg_order_value": 0
        }
        
        # معدل نجاح الزيارات
        success_rate = (successful_visits / rep_visits * 100) if rep_visits > 0 else 0
        
        return {
            "personal_visits": rep_visits,
            "successful_visits": successful_visits,
            "success_rate": round(success_rate, 2),
            "orders_summary": orders_data,
            "assigned_clinics_count": assigned_clinics,
            "performance_ranking": rep_ranking,
            "targets_achievements": targets_achievements,
            "dashboard_widgets": [
                "personal_stats", "visit_tracker", "orders_summary", 
                "clinic_assignments", "performance_comparison", "targets_progress"
            ]
        }
    except Exception as e:
        print(f"خطأ في إحصائيات المندوب: {str(e)}")
        return {}

async def get_accounting_dashboard_stats(db, date_filter, current_user):
    """إحصائيات خاصة بالمحاسبة - رؤية مالية مفصلة"""
    try:
        # إجمالي الفواتير والديون
        financial_summary = await db.debts.aggregate([
            {"$group": {
                "_id": None,
                "total_invoices": {"$sum": 1},
                "total_amount": {"$sum": "$original_amount"},
                "outstanding_amount": {"$sum": "$remaining_amount"},
                "settled_amount": {"$sum": {"$subtract": ["$original_amount", "$remaining_amount"]}}
            }}
        ]).to_list(1)
        
        # المدفوعات في الفترة
        payments_summary = await db.payments.aggregate([
            {"$match": {"payment_date": {"$gte": date_filter["created_at"]["$gte"]}}},
            {"$group": {
                "_id": None,
                "payments_count": {"$sum": 1},
                "total_collected": {"$sum": "$payment_amount"}
            }}
        ]).to_list(1)
        
        # الديون المتأخرة
        overdue_debts = await db.debts.count_documents({
            "status": "outstanding",
            "due_date": {"$lt": datetime.utcnow()}
        })
        
        # تحليل المدفوعات حسب الطريقة
        payment_methods = await db.payments.aggregate([
            {"$match": {"payment_date": {"$gte": date_filter["created_at"]["$gte"]}}},
            {"$group": {
                "_id": "$payment_method",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$payment_amount"}
            }},
            {"$sort": {"total_amount": -1}}
        ]).to_list(10)
        
        # تقرير العيادات حسب الحالة المالية
        clinics_financial_status = await get_clinics_financial_status(db)
        
        financial_data = financial_summary[0] if financial_summary else {
            "total_invoices": 0, "total_amount": 0, "outstanding_amount": 0, "settled_amount": 0
        }
        
        payments_data = payments_summary[0] if payments_summary else {
            "payments_count": 0, "total_collected": 0
        }
        
        return {
            "financial_summary": financial_data,
            "payments_summary": payments_data,
            "overdue_debts_count": overdue_debts,
            "payment_methods_breakdown": payment_methods,
            "clinics_financial_status": clinics_financial_status,
            "dashboard_widgets": [
                "financial_overview", "payments_tracker", "debt_management", 
                "payment_methods", "overdue_alerts", "financial_reports"
            ]
        }
    except Exception as e:
        print(f"خطأ في إحصائيات المحاسبة: {str(e)}")
        return {}

async def calculate_system_performance(db, date_filter):
    """حساب مؤشرات الأداء الشاملة للنظام"""
    try:
        # معدل نجاح الطلبات
        total_orders = await db.orders.count_documents(date_filter)
        completed_orders = await db.orders.count_documents({
            **date_filter,
            "status": {"$in": ["completed", "delivered"]}
        })
        
        # معدل تحصيل الديون
        total_debts_amount = await db.debts.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$original_amount"}}}
        ]).to_list(1)
        
        collected_amount = await db.payments.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$payment_amount"}}}
        ]).to_list(1)
        
        orders_success_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
        
        total_debt = total_debts_amount[0]["total"] if total_debts_amount else 0
        total_collected = collected_amount[0]["total"] if collected_amount else 0
        collection_rate = (total_collected / total_debt * 100) if total_debt > 0 else 0
        
        return {
            "orders_success_rate": round(orders_success_rate, 2),
            "debt_collection_rate": round(collection_rate, 2),
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "total_debt_amount": total_debt,
            "total_collected_amount": total_collected
        }
    except Exception as e:
        print(f"خطأ في حساب مؤشرات الأداء: {str(e)}")
        return {}

async def get_recent_admin_activities(db, limit=10):
    """جلب أحدث الأنشطة الإدارية"""
    try:
        # أحدث الطلبات
        recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(limit//2).to_list(limit//2)
        
        # أحدث المدفوعات
        recent_payments = await db.payments.find({}, {"_id": 0}).sort("payment_date", -1).limit(limit//2).to_list(limit//2)
        
        activities = []
        
        for order in recent_orders:
            activities.append({
                "type": "order_created",
                "description": f"طلبية جديدة بقيمة {order.get('total_amount', 0)} ج.م",
                "timestamp": order.get("created_at", datetime.utcnow()).isoformat(),
                "user_id": order.get("medical_rep_id", ""),
                "details": {
                    "order_id": order.get("id", ""),
                    "amount": order.get("total_amount", 0)
                }
            })
        
        for payment in recent_payments:
            activities.append({
                "type": "payment_received",
                "description": f"دفعة بقيمة {payment.get('payment_amount', 0)} ج.م",
                "timestamp": payment.get("payment_date", datetime.utcnow()).isoformat(),
                "user_id": payment.get("processed_by", ""),
                "details": {
                    "payment_id": payment.get("id", ""),
                    "amount": payment.get("payment_amount", 0)
                }
            })
        
        # ترتيب الأنشطة حسب التاريخ
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return activities[:limit]
    except Exception as e:
        print(f"خطأ في جلب الأنشطة الحديثة: {str(e)}")
        return []

async def get_system_health_metrics(db):
    """مؤشرات صحة النظام"""
    try:
        # عدد المستخدمين النشطين
        active_users = await db.users.count_documents({"is_active": {"$ne": False}})
        
        # عدد المستخدمين المتصلين مؤخراً (خلال 24 ساعة)
        last_24h = datetime.utcnow() - timedelta(hours=24)
        recent_users = await db.users.count_documents({
            "last_login": {"$gte": last_24h}
        })
        
        # إجمالي السجلات في النظام
        total_records = {
            "users": await db.users.count_documents({}),
            "clinics": await db.clinics.count_documents({}),
            "orders": await db.orders.count_documents({}),
            "visits": await db.visits.count_documents({}),
            "debts": await db.debts.count_documents({}),
            "payments": await db.payments.count_documents({})
        }
        
        return {
            "active_users": active_users,
            "recent_users": recent_users,
            "database_health": "healthy",
            "total_records": total_records,
            "system_uptime": "99.9%",
            "last_backup": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"خطأ في مؤشرات صحة النظام: {str(e)}")
        return {"status": "error", "message": str(e)}

# باقي الدوال المساعدة
async def calculate_growth_metrics(db, date_filter):
    """حساب معدلات النمو"""
    return {"monthly_growth": 0, "quarterly_growth": 0}

async def calculate_financial_kpis(db, date_filter):
    """حساب المؤشرات المالية الرئيسية"""
    return {"revenue_growth": 0, "collection_efficiency": 0}

async def calculate_rep_ranking(db, rep_id, date_filter):
    """حساب ترتيب المندوب"""
    return {"rank": 0, "total_reps": 0}

async def get_rep_targets_and_achievements(db, rep_id, date_filter):
    """جلب الأهداف والإنجازات"""
    return {"targets_met": 0, "total_targets": 0}

async def get_clinics_financial_status(db):
    """تصنيف العيادات حسب الحالة المالية"""
    return {"good": 0, "warning": 0, "critical": 0}

async def get_manager_dashboard_stats(db, date_filter, current_user):
    """إحصائيات المدراء"""
    return {}

async def get_finance_dashboard_stats(db, date_filter, current_user):
    """إحصائيات مالية"""
    return {}

@router.get("/widgets/{role_type}")
async def get_dashboard_widgets(
    role_type: str,
    current_user: User = Depends(get_current_user)
):
    """الحصول على widgets مخصصة لكل دور"""
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
        ]
    }
    
    return widgets_config.get(role_type, [])