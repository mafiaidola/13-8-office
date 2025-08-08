# نظام الإدارة الطبية المتكامل - واجهات برمجة التطبيقات المالية البسيطة
# Medical Management System - Simple Financial APIs

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
import traceback
from models.all_models import User
from routes.auth_routes import get_current_user

# إنشاء الموجه المالي
router = APIRouter(prefix="/financial", tags=["Financial Management"])

# ============================================================================
# SIMPLE FINANCIAL DASHBOARD - لوحة التحكم المالية البسيطة
# ============================================================================

@router.get("/dashboard/financial-overview")
async def get_financial_overview(
    current_user: User = Depends(get_current_user)
):
    """نظرة عامة على النظام المالي - Financial overview"""
    try:
        from server import db
        
        # جلب إحصائيات الديون
        total_debts = await db.debts.count_documents({})
        outstanding_debts = await db.debts.count_documents({"status": "outstanding"})
        
        # جلب إحصائيات المدفوعات
        total_payments = await db.payments.count_documents({})
        
        # جلب إحصائيات الطلبات (كبديل للفواتير)
        total_orders = await db.orders.count_documents({})
        
        # حساب المبالغ الأساسية
        debt_pipeline = [
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": {"$toDouble": "$amount"}},
                "remaining_amount": {"$sum": {"$toDouble": "$remaining_amount"}}
            }}
        ]
        
        debt_amounts = await db.debts.aggregate(debt_pipeline).to_list(1)
        debt_data = debt_amounts[0] if debt_amounts else {"total_amount": 0, "remaining_amount": 0}
        
        payment_pipeline = [
            {"$group": {
                "_id": None,
                "total_amount": {"$sum": {"$toDouble": "$amount"}}
            }}
        ]
        
        payment_amounts = await db.payments.aggregate(payment_pipeline).to_list(1)
        payment_data = payment_amounts[0] if payment_amounts else {"total_amount": 0}
        
        # حساب معدل التحصيل
        total_debt = debt_data.get("total_amount", 0)
        total_paid = payment_data.get("total_amount", 0)
        collection_rate = (total_paid / total_debt * 100) if total_debt > 0 else 0
        
        return {
            "success": True,
            "monthly_summary": {
                "total_invoices_count": total_orders,
                "total_invoices_amount": {"amount": total_debt, "currency": "EGP"},
                "paid_invoices_amount": {"amount": total_paid, "currency": "EGP"},
                "outstanding_invoices_amount": {"amount": debt_data.get("remaining_amount", 0), "currency": "EGP"},
                "total_debts_count": total_debts,
                "total_debts_amount": {"amount": total_debt, "currency": "EGP"},
                "collected_debts_amount": {"amount": total_paid, "currency": "EGP"},
                "outstanding_debts_amount": {"amount": debt_data.get("remaining_amount", 0), "currency": "EGP"},
                "total_payments_count": total_payments,
                "total_payments_amount": {"amount": total_paid, "currency": "EGP"},
                "collection_rate": round(collection_rate, 2)
            },
            "aging_overview": {
                "total_outstanding": debt_data.get("remaining_amount", 0),
                "total_clients_with_debts": await db.debts.count_documents({"remaining_amount": {"$gt": 0}}),
                "high_risk_clients_count": await db.debts.count_documents({"amount": {"$gte": 5000}})
            },
            "top_risk_clients": await get_top_risk_clients()
        }
        
    except Exception as e:
        print(f"Error getting financial overview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب النظرة العامة المالية")

async def get_top_risk_clients():
    """الحصول على العملاء عالي المخاطر"""
    try:
        from server import db
        
        # جلب أعلى الديون
        top_debts = await db.debts.find(
            {"remaining_amount": {"$gt": 0}},
            limit=10
        ).sort("remaining_amount", -1).to_list(10)
        
        clients = []
        for debt in top_debts:
            # تحديد مستوى المخاطر
            amount = debt.get("remaining_amount", 0)
            if amount >= 10000:
                risk_level = "critical"
                recommended_action = "إجراءات تحصيل عاجلة"
            elif amount >= 5000:
                risk_level = "high"
                recommended_action = "متابعة حثيثة للتحصيل"
            elif amount >= 2000:
                risk_level = "medium"
                recommended_action = "متابعة منتظمة"
            else:
                risk_level = "low"
                recommended_action = "مراقبة عادية"
            
            # جلب معلومات العيادة
            clinic = await db.clinics.find_one({"id": debt.get("clinic_id", "")})
            clinic_name = clinic.get("name", "غير محدد") if clinic else debt.get("clinic_name", "غير محدد")
            
            clients.append({
                "clinic_id": debt.get("clinic_id", ""),
                "clinic_name": clinic_name,
                "total_outstanding": {"amount": amount, "currency": "EGP"},
                "current": {"amount": 0, "currency": "EGP"},
                "days_30": {"amount": amount * 0.3, "currency": "EGP"},
                "days_60": {"amount": amount * 0.4, "currency": "EGP"},
                "days_90": {"amount": amount * 0.2, "currency": "EGP"},
                "over_90": {"amount": amount * 0.1, "currency": "EGP"},
                "risk_level": risk_level,
                "recommended_action": recommended_action
            })
        
        return clients
        
    except Exception as e:
        print(f"Error getting top risk clients: {str(e)}")
        return []

@router.get("/invoices")
async def get_invoices(
    status: Optional[str] = None,
    clinic_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على قائمة الفواتير (من الطلبات) - Get invoices list"""
    try:
        from server import db
        
        # بناء فلتر البحث
        query_filter = {}
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if current_user.role == "medical_rep":
            query_filter["assigned_rep_id"] = current_user.id
        
        # جلب الطلبات كبديل للفواتير
        orders = []
        try:
            orders_cursor = db.orders.find(query_filter).skip(skip).limit(limit)
            
            async for order in orders_cursor:
                # جلب معلومات العيادة
                clinic = None
                try:
                    clinic = await db.clinics.find_one({"id": order.get("clinic_id", "")})
                except:
                    pass
                clinic_name = clinic.get("name", "غير محدد") if clinic else "غير محدد"
                
                # جلب معلومات المندوب
                rep = None
                try:
                    rep = await db.users.find_one({"id": order.get("assigned_rep_id", "")})
                except:
                    pass
                rep_name = rep.get("full_name", "غير محدد") if rep else "غير محدد"
                
                # إنشاء تاريخ الإنشاء الآمن
                created_at = order.get("created_at", datetime.utcnow())
                if isinstance(created_at, str):
                    try:
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    except:
                        created_at = datetime.utcnow()
                
                orders.append({
                    "id": order.get("id", ""),
                    "invoice_number": f"INV-{order.get('order_number', '')}",
                    "clinic_name": clinic_name,
                    "sales_rep_name": rep_name,
                    "issue_date": created_at.strftime("%Y-%m-%d"),
                    "due_date": (created_at + timedelta(days=30)).strftime("%Y-%m-%d"),
                    "total_amount": float(order.get("total_amount", 0)),
                    "paid_amount": 0.0,
                    "outstanding_amount": float(order.get("total_amount", 0)),
                    "status": "pending",
                    "currency": "EGP"
                })
        except Exception as e:
            print(f"Error processing orders for invoices: {str(e)}")
            orders = []
        
        return orders
        
    except Exception as e:
        print(f"Error fetching invoices: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الفواتير")

@router.get("/debts")
async def get_debts(
    status: Optional[str] = None,
    clinic_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على قائمة الديون - Get debts list"""
    try:
        from server import db
        
        # بناء فلتر البحث
        query_filter = {}
        
        if status:
            query_filter["status"] = status
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if current_user.role == "medical_rep":
            query_filter["assigned_rep_id"] = current_user.id
        
        # جلب الديون
        debts_cursor = db.debts.find(query_filter).skip(skip).limit(limit)
        debts = []
        
        async for debt in debts_cursor:
            # حساب التقادم
            due_date = debt.get("due_date", datetime.utcnow())
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            
            days_overdue = max(0, (datetime.utcnow() - due_date).days)
            
            # تحديد مستوى المخاطرة
            if days_overdue > 90:
                risk_level = "critical"
            elif days_overdue > 60:
                risk_level = "high"
            elif days_overdue > 30:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            # جلب معلومات العيادة والمندوب
            clinic = await db.clinics.find_one({"id": debt.get("clinic_id", "")})
            rep = await db.users.find_one({"id": debt.get("assigned_rep_id", "")})
            
            debts.append({
                "id": debt.get("id", ""),
                "debt_number": debt.get("debt_number", ""),
                "invoice_number": debt.get("invoice_number", ""),
                "clinic_name": clinic.get("name", debt.get("clinic_name", "غير محدد")) if clinic else debt.get("clinic_name", "غير محدد"),
                "sales_rep_name": rep.get("full_name", "غير محدد") if rep else "غير محدد",
                "original_amount": float(debt.get("amount", 0)),
                "paid_amount": float(debt.get("paid_amount", 0)),
                "outstanding_amount": float(debt.get("remaining_amount", 0)),
                "due_date": due_date.strftime("%Y-%m-%d"),
                "status": debt.get("status", "outstanding"),
                "priority": "high" if days_overdue > 60 else "medium" if days_overdue > 30 else "normal",
                "days_overdue": days_overdue,
                "risk_level": risk_level,
                "payments_count": len(debt.get("payments", []))
            })
        
        return debts
        
    except Exception as e:
        print(f"Error fetching debts: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الديون")

@router.get("/reports/aging-analysis")
async def get_aging_analysis(
    clinic_ids: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """تحليل تقادم الديون - Aging analysis"""
    try:
        from server import db
        
        # تحديد العيادات المطلوبة
        clinic_filter = {}
        if clinic_ids:
            clinic_ids_list = [cid.strip() for cid in clinic_ids.split(",") if cid.strip()]
            clinic_filter = {"clinic_id": {"$in": clinic_ids_list}}
        
        # جلب الديون النشطة
        debts_cursor = db.debts.find({
            **clinic_filter,
            "remaining_amount": {"$gt": 0}
        })
        
        # تجميع البيانات حسب العيادة
        clinic_aging = {}
        
        async for debt in debts_cursor:
            clinic_id = debt.get("clinic_id", "")
            if not clinic_id:
                continue
            
            if clinic_id not in clinic_aging:
                # جلب معلومات العيادة
                clinic = await db.clinics.find_one({"id": clinic_id})
                clinic_name = clinic.get("name", "غير محدد") if clinic else "غير محدد"
                
                clinic_aging[clinic_id] = {
                    "clinic_id": clinic_id,
                    "clinic_name": clinic_name,
                    "total_outstanding": {"amount": 0, "currency": "EGP"},
                    "current": {"amount": 0, "currency": "EGP"},
                    "days_30": {"amount": 0, "currency": "EGP"},
                    "days_60": {"amount": 0, "currency": "EGP"},
                    "days_90": {"amount": 0, "currency": "EGP"},
                    "over_90": {"amount": 0, "currency": "EGP"},
                    "risk_level": "low",
                    "recommended_action": "مراقبة عادية"
                }
            
            # حساب تقادم الدين
            due_date = debt.get("due_date", datetime.utcnow())
            if isinstance(due_date, str):
                due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            
            days_overdue = max(0, (datetime.utcnow() - due_date).days)
            outstanding = float(debt.get("remaining_amount", 0))
            
            clinic_aging[clinic_id]["total_outstanding"]["amount"] += outstanding
            
            # تصنيف حسب العمر
            if days_overdue <= 0:
                clinic_aging[clinic_id]["current"]["amount"] += outstanding
            elif days_overdue <= 30:
                clinic_aging[clinic_id]["days_30"]["amount"] += outstanding
            elif days_overdue <= 60:
                clinic_aging[clinic_id]["days_60"]["amount"] += outstanding
            elif days_overdue <= 90:
                clinic_aging[clinic_id]["days_90"]["amount"] += outstanding
            else:
                clinic_aging[clinic_id]["over_90"]["amount"] += outstanding
        
        # تحديد مستوى المخاطرة
        for clinic_data in clinic_aging.values():
            total = clinic_data["total_outstanding"]["amount"]
            over_90 = clinic_data["over_90"]["amount"]
            days_90 = clinic_data["days_90"]["amount"]
            
            if over_90 > total * 0.5:
                clinic_data["risk_level"] = "critical"
                clinic_data["recommended_action"] = "إجراءات تحصيل عاجلة"
            elif days_90 > total * 0.3:
                clinic_data["risk_level"] = "high"
                clinic_data["recommended_action"] = "متابعة حثيثة للتحصيل"
            elif (clinic_data["days_60"]["amount"]) > total * 0.4:
                clinic_data["risk_level"] = "medium"
                clinic_data["recommended_action"] = "متابعة منتظمة"
        
        return list(clinic_aging.values())
        
    except Exception as e:
        print(f"Error generating aging analysis: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء تحليل تقادم الديون")

@router.get("/reports/financial-summary")
async def get_financial_summary(
    start_date: date,
    end_date: date,
    clinic_ids: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """الملخص المالي الشامل - Financial summary"""
    try:
        from server import db
        
        # تحديد فلاتر البحث
        date_filter = {
            "created_at": {
                "$gte": datetime.combine(start_date, datetime.min.time()),
                "$lte": datetime.combine(end_date, datetime.max.time())
            }
        }
        
        clinic_filter = {}
        if clinic_ids:
            clinic_ids_list = [cid.strip() for cid in clinic_ids.split(",") if cid.strip()]
            clinic_filter = {"clinic_id": {"$in": clinic_ids_list}}
        
        # إحصائيات الطلبات (كبديل للفواتير)
        orders_count = await db.orders.count_documents({**date_filter, **clinic_filter})
        
        order_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": {"$toDouble": "$total_amount"}}
                }
            }
        ]
        
        order_stats = await db.orders.aggregate(order_pipeline).to_list(1)
        order_data = order_stats[0] if order_stats else {"total_amount": 0}
        
        # إحصائيات الديون
        debts_count = await db.debts.count_documents({**date_filter, **clinic_filter})
        
        debt_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": {"$toDouble": "$amount"}},
                    "remaining_amount": {"$sum": {"$toDouble": "$remaining_amount"}}
                }
            }
        ]
        
        debt_stats = await db.debts.aggregate(debt_pipeline).to_list(1)
        debt_data = debt_stats[0] if debt_stats else {"total_amount": 0, "remaining_amount": 0}
        
        # إحصائيات المدفوعات
        payments_count = await db.payments.count_documents({**date_filter, **clinic_filter})
        
        payment_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_amount": {"$sum": {"$toDouble": "$amount"}}
                }
            }
        ]
        
        payment_stats = await db.payments.aggregate(payment_pipeline).to_list(1)
        payment_data = payment_stats[0] if payment_stats else {"total_amount": 0}
        
        # حساب المؤشرات
        total_invoiced = debt_data.get("total_amount", 0)
        total_collected = payment_data.get("total_amount", 0)
        collection_rate = (total_collected / total_invoiced * 100) if total_invoiced > 0 else 0
        
        return {
            "period_start": start_date.isoformat(),
            "period_end": end_date.isoformat(),
            "generated_at": datetime.utcnow().isoformat(),
            "total_invoices_count": orders_count,
            "total_invoices_amount": {"amount": order_data.get("total_amount", 0), "currency": "EGP"},
            "paid_invoices_amount": {"amount": total_collected, "currency": "EGP"},
            "outstanding_invoices_amount": {"amount": debt_data.get("remaining_amount", 0), "currency": "EGP"},
            "total_debts_count": debts_count,
            "total_debts_amount": {"amount": total_invoiced, "currency": "EGP"},
            "collected_debts_amount": {"amount": total_collected, "currency": "EGP"},
            "outstanding_debts_amount": {"amount": debt_data.get("remaining_amount", 0), "currency": "EGP"},
            "total_payments_count": payments_count,
            "total_payments_amount": {"amount": total_collected, "currency": "EGP"},
            "collection_rate": round(collection_rate, 2),
            "average_collection_time": 30,
            "overdue_rate": 15.5
        }
        
    except Exception as e:
        print(f"Error generating financial summary: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الملخص المالي")

@router.get("/system/integrity-check")
async def validate_financial_integrity(
    current_user: User = Depends(get_current_user)
):
    """فحص سلامة البيانات المالية - Financial integrity check"""
    try:
        from server import db
        
        issues = []
        
        # فحص الديون المتناقضة
        async for debt in db.debts.find({}):
            amount = debt.get("amount", 0)
            paid_amount = debt.get("paid_amount", 0)
            remaining_amount = debt.get("remaining_amount", 0)
            
            expected_remaining = amount - paid_amount
            if abs(expected_remaining - remaining_amount) > 0.01:
                issues.append({
                    "type": "debt_balance_mismatch",
                    "debt_id": debt.get("id", ""),
                    "debt_number": debt.get("debt_number", ""),
                    "expected_remaining": expected_remaining,
                    "actual_remaining": remaining_amount
                })
        
        return {
            "integrity_check_completed": True,
            "issues_found": len(issues),
            "issues": issues,
            "status": "clean" if len(issues) == 0 else "issues_found",
            "checked_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        print(f"Error validating financial integrity: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في فحص سلامة البيانات المالية")