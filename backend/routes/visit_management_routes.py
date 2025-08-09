# نظام الإدارة الطبية المتكامل - واجهات برمجة التطبيقات لإدارة الزيارات
# Medical Management System - Visit Management APIs

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import traceback
import uuid

from models.all_models import User
from models.unified_financial_models import (
    RepVisit, VisitStatus, VisitType, VisitPlan,
    CreateVisitRequest, VisitCheckInRequest, VisitCompletionRequest, VisitSummary
)
from routes.auth_routes import get_current_user

# إنشاء الموجه لإدارة الزيارات
router = APIRouter(prefix="/visits", tags=["Visit Management"])

# ============================================================================
# VISIT MANAGEMENT ENDPOINTS - واجهات إدارة الزيارات
# ============================================================================

@router.get("/dashboard/overview")
async def get_visits_dashboard_overview(
    current_user: User = Depends(get_current_user)
):
    """نظرة عامة على زيارات المندوب"""
    try:
        from server import db
        
        # تحديد المندوب المطلوب
        rep_id = current_user.get("id")
        if current_user.get("role") == "admin" or current_user.get("role") == "manager":
            # المدير يمكنه رؤية إحصائيات عامة
            rep_filter = {}
        else:
            # المندوب يرى زياراته فقط
            rep_filter = {"medical_rep_id": rep_id}
        
        # إحصائيات اليوم
        today = date.today()
        today_filter = {
            **rep_filter,
            "scheduled_date": {
                "$gte": datetime.combine(today, datetime.min.time()).isoformat(),
                "$lte": datetime.combine(today, datetime.max.time()).isoformat()
            }
        }
        
        today_total = await db.rep_visits.count_documents(today_filter)
        today_completed = await db.rep_visits.count_documents({**today_filter, "status": "completed"})
        today_pending = await db.rep_visits.count_documents({**today_filter, "status": {"$in": ["planned", "in_progress"]}})
        
        # إحصائيات هذا الأسبوع
        week_start = today - timedelta(days=today.weekday())
        week_filter = {
            **rep_filter,
            "scheduled_date": {
                "$gte": datetime.combine(week_start, datetime.min.time()).isoformat(),
                "$lte": datetime.combine(today, datetime.max.time()).isoformat()
            }
        }
        
        week_total = await db.rep_visits.count_documents(week_filter)
        week_completed = await db.rep_visits.count_documents({**week_filter, "status": "completed"})
        
        # إحصائيات هذا الشهر
        month_start = today.replace(day=1)
        month_filter = {
            **rep_filter,
            "scheduled_date": {
                "$gte": datetime.combine(month_start, datetime.min.time()).isoformat(),
                "$lte": datetime.combine(today, datetime.max.time()).isoformat()
            }
        }
        
        month_total = await db.rep_visits.count_documents(month_filter)
        month_completed = await db.rep_visits.count_documents({**month_filter, "status": "completed"})
        
        # العيادات المتاحة للمندوب
        available_clinics = []
        if current_user.get("role") == "medical_rep":
            # جلب العيادات المخصصة للمندوب أو المتاحة له
            clinics_cursor = db.clinics.find({
                "$or": [
                    {"assigned_rep_id": rep_id},
                    {"available_reps": {"$in": [rep_id]}},
                    {"area_reps": {"$in": [rep_id]}}
                ]
            })
            
            available_clinics = []
            async for clinic in clinics_cursor:
                available_clinics.append({
                    "id": clinic.get("id", ""),
                    "name": clinic.get("name", ""),
                    "address": clinic.get("address", ""),
                    "area_name": clinic.get("area_name", ""),
                    "phone": clinic.get("phone", ""),
                    "last_visit_date": None  # سيتم حسابه لاحقاً
                })
        else:
            # للمديرين، إحصائيات عامة عن العيادات
            total_clinics = await db.clinics.count_documents({})
            available_clinics = [{"total_clinics": total_clinics}]
        
        # الزيارات القادمة (التالية 5 زيارات)
        upcoming_filter = {
            **rep_filter,
            "scheduled_date": {"$gte": datetime.utcnow().isoformat()},
            "status": {"$in": ["planned", "in_progress"]}
        }
        
        upcoming_visits = []
        upcoming_cursor = db.rep_visits.find(upcoming_filter).sort("scheduled_date", 1).limit(5)
        
        async for visit in upcoming_cursor:
            upcoming_visits.append({
                "id": visit.get("id", ""),
                "visit_number": visit.get("visit_number", ""),
                "clinic_name": visit.get("clinic_name", ""),
                "scheduled_date": visit.get("scheduled_date", ""),
                "visit_type": visit.get("visit_type", ""),
                "visit_purpose": visit.get("visit_purpose", ""),
                "status": visit.get("status", "")
            })
        
        # متوسط مدة الزيارات المكتملة
        avg_duration_pipeline = [
            {"$match": {**rep_filter, "status": "completed", "duration_minutes": {"$exists": True, "$gt": 0}}},
            {"$group": {"_id": None, "avg_duration": {"$avg": "$duration_minutes"}}}
        ]
        
        duration_result = await db.rep_visits.aggregate(avg_duration_pipeline).to_list(1)
        avg_duration = int(duration_result[0]["avg_duration"]) if duration_result else 0
        
        # معدل النجاح
        success_rate = 0.0
        if week_total > 0:
            success_rate = (week_completed / week_total) * 100
        
        return {
            "success": True,
            "overview": {
                "today": {
                    "total_visits": today_total,
                    "completed": today_completed,
                    "pending": today_pending,
                    "completion_rate": (today_completed / today_total * 100) if today_total > 0 else 0
                },
                "this_week": {
                    "total_visits": week_total,
                    "completed": week_completed,
                    "completion_rate": (week_completed / week_total * 100) if week_total > 0 else 0
                },
                "this_month": {
                    "total_visits": month_total,
                    "completed": month_completed,
                    "completion_rate": (month_completed / month_total * 100) if month_total > 0 else 0
                },
                "performance": {
                    "average_visit_duration": avg_duration,
                    "success_rate": round(success_rate, 1),
                    "available_clinics_count": len(available_clinics)
                },
                "available_clinics": available_clinics[:10],  # أول 10 عيادات فقط
                "upcoming_visits": upcoming_visits
            }
        }
        
    except Exception as e:
        print(f"Error getting visits dashboard overview: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب نظرة عامة على الزيارات")

@router.get("/available-clinics")
async def get_available_clinics(
    current_user: User = Depends(get_current_user)
):
    """الحصول على العيادات المتاحة للمستخدم المسجل"""
    try:
        from server import db
        
        # السماح للمناديب والمديرين والأدمن بالوصول
        allowed_roles = ["medical_rep", "admin", "manager"]
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403, 
                detail=f"هذه الخدمة متاحة للمناديب والمديرين فقط. دورك الحالي: {current_user.get('role')}"
            )
        
        rep_id = current_user.get("id")
        
        # البحث عن العيادات المتاحة للمندوب
        # 1. العيادات المخصصة مباشرة للمندوب
        # 2. العيادات المتاحة عبر قائمة المناديب المسموحين
        # 3. العيادات في نفس المنطقة إذا كان مسموحاً له
        
        clinics_filter = {
            "$or": [
                {"assigned_rep_id": rep_id},                    # مخصص مباشرة
                {"available_reps": {"$in": [rep_id]}},          # في قائمة المتاحين
                {"area_reps": {"$in": [rep_id]}}                # مندوب منطقة
            ]
        }
        
        available_clinics = []
        clinics_cursor = db.clinics.find(clinics_filter)
        
        async for clinic in clinics_cursor:
            # جلب آخر زيارة لهذه العيادة
            last_visit = await db.rep_visits.find_one(
                {
                    "clinic_id": clinic.get("id", ""),
                    "medical_rep_id": rep_id,
                    "status": "completed"
                },
                sort=[("actual_end_time", -1)]
            )
            
            last_visit_date = None
            if last_visit and last_visit.get("actual_end_time"):
                try:
                    last_visit_date = datetime.fromisoformat(last_visit["actual_end_time"].replace('Z', '+00:00')).date().isoformat()
                except:
                    pass
            
            # عدد الزيارات المكتملة لهذه العيادة
            visits_count = await db.rep_visits.count_documents({
                "clinic_id": clinic.get("id", ""),
                "medical_rep_id": rep_id,
                "status": "completed"
            })
            
            # حالة العيادة (هل لها زيارة مجدولة اليوم؟)
            today = date.today()
            has_visit_today = await db.rep_visits.count_documents({
                "clinic_id": clinic.get("id", ""),
                "medical_rep_id": rep_id,
                "scheduled_date": {
                    "$gte": datetime.combine(today, datetime.min.time()).isoformat(),
                    "$lte": datetime.combine(today, datetime.max.time()).isoformat()
                },
                "status": {"$in": ["planned", "in_progress", "completed"]}
            }) > 0
            
            available_clinics.append({
                "id": clinic.get("id", ""),
                "name": clinic.get("name", ""),
                "address": clinic.get("address", ""),
                "area_name": clinic.get("area_name", ""),
                "phone": clinic.get("phone", ""),
                "email": clinic.get("email", ""),
                "specialization": clinic.get("specialization", ""),
                "doctor_name": clinic.get("primary_doctor_name", ""),
                "assignment_type": "assigned" if clinic.get("assigned_rep_id") == rep_id else "available",
                "last_visit_date": last_visit_date,
                "total_visits": visits_count,
                "has_visit_today": has_visit_today,
                "coordinates": {
                    "latitude": clinic.get("latitude"),
                    "longitude": clinic.get("longitude")
                } if clinic.get("latitude") and clinic.get("longitude") else None
            })
        
        # ترتيب حسب آخر زيارة (الأقدم أولاً)
        available_clinics.sort(key=lambda x: x["last_visit_date"] if x["last_visit_date"] else "1900-01-01")
        
        return {
            "success": True,
            "available_clinics": available_clinics,
            "total_count": len(available_clinics)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting available clinics: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب العيادات المتاحة")

@router.post("/")
async def create_visit(
    request: CreateVisitRequest,
    current_user: User = Depends(get_current_user)
):
    """إنشاء زيارة جديدة"""
    try:
        from server import db
        
        if current_user.get("role") != "medical_rep":
            raise HTTPException(status_code=403, detail="إنشاء الزيارات متاح للمناديب فقط")
        
        rep_id = current_user.get("id")
        rep_name = current_user.get("full_name", "")
        
        # التحقق من وجود العيادة
        clinic = await db.clinics.find_one({"id": request.clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # التحقق من إمكانية الوصول للعيادة
        has_access = (
            clinic.get("assigned_rep_id") == rep_id or
            rep_id in clinic.get("available_reps", []) or
            rep_id in clinic.get("area_reps", [])
        )
        
        if not has_access:
            raise HTTPException(status_code=403, detail="غير مسموح لك بزيارة هذه العيادة")
        
        # التحقق من عدم وجود زيارة أخرى في نفس الوقت
        scheduled_time = request.scheduled_date
        time_buffer = timedelta(minutes=30)  # مهلة 30 دقيقة
        
        existing_visit = await db.rep_visits.find_one({
            "medical_rep_id": rep_id,
            "scheduled_date": {
                "$gte": (scheduled_time - time_buffer).isoformat(),
                "$lte": (scheduled_time + time_buffer).isoformat()
            },
            "status": {"$in": ["planned", "in_progress"]}
        })
        
        if existing_visit:
            raise HTTPException(
                status_code=400, 
                detail=f"لديك زيارة أخرى مجدولة في نفس الوقت تقريباً (الزيارة رقم: {existing_visit.get('visit_number', '')})"
            )
        
        # إنشاء رقم الزيارة التلقائي
        visit_number = f"VISIT-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # جلب معلومات الطبيب إذا كان محدداً
        doctor_name = None
        if request.doctor_id:
            doctor = await db.users.find_one({"id": request.doctor_id, "role": "doctor"})
            if doctor:
                doctor_name = doctor.get("full_name", "")
        
        # إنشاء سجل الزيارة
        visit_data = {
            "id": str(uuid.uuid4()),
            "visit_number": visit_number,
            "visit_type": request.visit_type,
            "status": VisitStatus.PLANNED,
            "medical_rep_id": rep_id,
            "medical_rep_name": rep_name,
            "clinic_id": request.clinic_id,
            "clinic_name": clinic.get("name", ""),
            "doctor_id": request.doctor_id,
            "doctor_name": doctor_name,
            "scheduled_date": request.scheduled_date.isoformat(),
            "clinic_address": clinic.get("address", ""),
            "gps_latitude": clinic.get("latitude"),
            "gps_longitude": clinic.get("longitude"),
            "visit_purpose": request.visit_purpose,
            "products_presented": [],
            "samples_provided": [],
            "orders_taken": [],
            "photos": [],
            "documents": [],
            "voice_notes": [],
            "follow_up_required": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": rep_id,
            "review_status": "pending"
        }
        
        # حفظ الزيارة
        result = await db.rep_visits.insert_one(visit_data)
        
        if result.inserted_id:
            visit_data["_id"] = str(result.inserted_id)
            return {
                "success": True,
                "message": "تم إنشاء الزيارة بنجاح",
                "visit": visit_data
            }
        else:
            raise HTTPException(status_code=500, detail="خطأ في حفظ الزيارة")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating visit: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنشاء الزيارة")

@router.post("/check-in")
async def check_in_visit(
    request: VisitCheckInRequest,
    current_user: User = Depends(get_current_user)
):
    """تسجيل دخول للزيارة"""
    try:
        from server import db
        
        if current_user.get("role") != "medical_rep":
            raise HTTPException(status_code=403, detail="تسجيل الدخول للزيارات متاح للمناديب فقط")
        
        rep_id = current_user.get("id")
        
        # جلب الزيارة
        visit = await db.rep_visits.find_one({"id": request.visit_id})
        if not visit:
            raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
        
        # التحقق من ملكية الزيارة
        if visit.get("medical_rep_id") != rep_id:
            raise HTTPException(status_code=403, detail="هذه الزيارة غير مخصصة لك")
        
        # التحقق من حالة الزيارة
        if visit.get("status") != VisitStatus.PLANNED:
            raise HTTPException(
                status_code=400, 
                detail=f"لا يمكن تسجيل الدخول للزيارة في الحالة الحالية: {visit.get('status')}"
            )
        
        # تحديث الزيارة
        check_in_data = {
            "status": VisitStatus.IN_PROGRESS,
            "actual_start_time": datetime.utcnow().isoformat(),
            "check_in_location": {
                "latitude": request.gps_latitude,
                "longitude": request.gps_longitude,
                "timestamp": datetime.utcnow().isoformat(),
                "notes": request.notes
            },
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await db.rep_visits.update_one(
            {"id": request.visit_id},
            {"$set": check_in_data}
        )
        
        if result.modified_count > 0:
            return {
                "success": True,
                "message": "تم تسجيل الدخول للزيارة بنجاح",
                "check_in_time": check_in_data["actual_start_time"]
            }
        else:
            raise HTTPException(status_code=500, detail="خطأ في تسجيل الدخول للزيارة")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error checking in visit: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في تسجيل الدخول للزيارة")

@router.post("/complete")
async def complete_visit(
    request: VisitCompletionRequest,
    current_user: User = Depends(get_current_user)
):
    """إنهاء الزيارة"""
    try:
        from server import db
        
        if current_user.get("role") != "medical_rep":
            raise HTTPException(status_code=403, detail="إنهاء الزيارات متاح للمناديب فقط")
        
        rep_id = current_user.get("id")
        
        # جلب الزيارة
        visit = await db.rep_visits.find_one({"id": request.visit_id})
        if not visit:
            raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
        
        # التحقق من ملكية الزيارة
        if visit.get("medical_rep_id") != rep_id:
            raise HTTPException(status_code=403, detail="هذه الزيارة غير مخصصة لك")
        
        # التحقق من حالة الزيارة
        if visit.get("status") != VisitStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=400,
                detail=f"لا يمكن إنهاء الزيارة في الحالة الحالية: {visit.get('status')}"
            )
        
        # حساب مدة الزيارة
        actual_start_time = visit.get("actual_start_time")
        if not actual_start_time:
            raise HTTPException(status_code=400, detail="الزيارة لم تبدأ بعد")
        
        end_time = datetime.utcnow()
        start_time = datetime.fromisoformat(actual_start_time.replace('Z', '+00:00'))
        duration_minutes = int((end_time - start_time).total_seconds() / 60)
        
        # تحديث بيانات الزيارة
        completion_data = {
            "status": VisitStatus.COMPLETED,
            "actual_end_time": end_time.isoformat(),
            "duration_minutes": duration_minutes,
            "visit_outcome": request.visit_outcome,
            "doctor_feedback": request.doctor_feedback,
            "visit_effectiveness": request.visit_effectiveness,
            "doctor_satisfaction": request.doctor_satisfaction,
            "products_presented": request.products_presented,
            "samples_provided": request.samples_provided,
            "next_visit_suggestions": request.next_visit_suggestions,
            "follow_up_required": request.follow_up_required,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # إضافة تاريخ الزيارة التالية إذا كانت مطلوبة
        if request.follow_up_required and request.next_visit_suggestions:
            # اقتراح تاريخ بعد أسبوع
            suggested_date = (datetime.utcnow() + timedelta(days=7)).date()
            completion_data["next_visit_date"] = suggested_date.isoformat()
        
        result = await db.rep_visits.update_one(
            {"id": request.visit_id},
            {"$set": completion_data}
        )
        
        if result.modified_count > 0:
            # حساب درجة الفعالية
            effectiveness_score = calculate_visit_effectiveness(
                duration_minutes, 
                request.doctor_satisfaction,
                len(request.products_presented),
                len(request.samples_provided),
                request.visit_effectiveness
            )
            
            return {
                "success": True,
                "message": "تم إنهاء الزيارة بنجاح",
                "visit_summary": {
                    "duration_minutes": duration_minutes,
                    "effectiveness_score": effectiveness_score,
                    "products_count": len(request.products_presented),
                    "samples_count": len(request.samples_provided),
                    "follow_up_required": request.follow_up_required
                }
            }
        else:
            raise HTTPException(status_code=500, detail="خطأ في إنهاء الزيارة")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error completing visit: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في إنهاء الزيارة")

@router.get("/")
async def get_visits(
    status: Optional[VisitStatus] = None,
    visit_type: Optional[VisitType] = None,
    clinic_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على قائمة الزيارات مع فلترة"""
    try:
        from server import db
        
        # بناء فلتر البحث
        query_filter = {}
        
        # فلترة حسب الدور
        if current_user.get("role") == "medical_rep":
            query_filter["medical_rep_id"] = current_user.get("id")
        elif current_user.get("role") == "manager":
            # المدير يرى زيارات فريقه (يمكن تطوير هذا لاحقاً)
            pass
        
        # فلاتر المستخدم
        if status:
            query_filter["status"] = status
        
        if visit_type:
            query_filter["visit_type"] = visit_type
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if start_date and end_date:
            query_filter["scheduled_date"] = {
                "$gte": datetime.combine(start_date, datetime.min.time()).isoformat(),
                "$lte": datetime.combine(end_date, datetime.max.time()).isoformat()
            }
        elif start_date:
            query_filter["scheduled_date"] = {
                "$gte": datetime.combine(start_date, datetime.min.time()).isoformat()
            }
        elif end_date:
            query_filter["scheduled_date"] = {
                "$lte": datetime.combine(end_date, datetime.max.time()).isoformat()
            }
        
        # جلب الزيارات
        visits = []
        cursor = db.rep_visits.find(query_filter).skip(skip).limit(limit).sort("scheduled_date", -1)
        
        async for visit in cursor:
            # حساب الحالة المحسنة
            status_display = get_visit_status_display(visit)
            
            visits.append({
                "id": visit.get("id", ""),
                "visit_number": visit.get("visit_number", ""),
                "visit_type": visit.get("visit_type", ""),
                "status": visit.get("status", ""),
                "status_display": status_display,
                "clinic_name": visit.get("clinic_name", ""),
                "doctor_name": visit.get("doctor_name", ""),
                "scheduled_date": visit.get("scheduled_date", ""),
                "actual_start_time": visit.get("actual_start_time"),
                "actual_end_time": visit.get("actual_end_time"),
                "duration_minutes": visit.get("duration_minutes"),
                "visit_purpose": visit.get("visit_purpose", ""),
                "visit_outcome": visit.get("visit_outcome"),
                "visit_effectiveness": visit.get("visit_effectiveness"),
                "doctor_satisfaction": visit.get("doctor_satisfaction"),
                "follow_up_required": visit.get("follow_up_required", False),
                "review_status": visit.get("review_status", "pending")
            })
        
        # إحصائيات الصفحة الحالية
        total_count = await db.rep_visits.count_documents(query_filter)
        
        return {
            "success": True,
            "visits": visits,
            "pagination": {
                "total": total_count,
                "skip": skip,
                "limit": limit,
                "has_more": skip + limit < total_count
            }
        }
        
    except Exception as e:
        print(f"Error fetching visits: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب الزيارات")

@router.get("/{visit_id}")
async def get_visit_details(
    visit_id: str,
    current_user: User = Depends(get_current_user)
):
    """الحصول على تفاصيل زيارة محددة"""
    try:
        from server import db
        
        # جلب الزيارة
        visit = await db.rep_visits.find_one({"id": visit_id})
        if not visit:
            raise HTTPException(status_code=404, detail="الزيارة غير موجودة")
        
        # التحقق من الصلاحية
        if (current_user.get("role") == "medical_rep" and 
            visit.get("medical_rep_id") != current_user.get("id")):
            raise HTTPException(status_code=403, detail="غير مسموح لك بالوصول لهذه الزيارة")
        
        # حساب درجة الفعالية إذا كانت مكتملة
        effectiveness_score = None
        if visit.get("status") == VisitStatus.COMPLETED:
            effectiveness_score = calculate_visit_effectiveness(
                visit.get("duration_minutes", 0),
                visit.get("doctor_satisfaction", 0),
                len(visit.get("products_presented", [])),
                len(visit.get("samples_provided", [])),
                visit.get("visit_effectiveness", 0)
            )
        
        # إضافة معلومات إضافية
        visit_details = dict(visit)
        visit_details["effectiveness_score"] = effectiveness_score
        visit_details["status_display"] = get_visit_status_display(visit)
        
        return {
            "success": True,
            "visit": visit_details
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting visit details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب تفاصيل الزيارة")

# ============================================================================
# HELPER FUNCTIONS - دوال مساعدة
# ============================================================================

def calculate_visit_effectiveness(
    duration: int, 
    doctor_satisfaction: int,
    products_count: int, 
    samples_count: int,
    effectiveness_rating: int
) -> float:
    """حساب درجة فعالية الزيارة"""
    score = 0.0
    factors = 0
    
    # تقييم المدة
    if 30 <= duration <= 90:
        score += 2.0
    elif duration >= 15:
        score += 1.0
    if duration > 0:
        factors += 1
    
    # تقييم الطبيب
    if doctor_satisfaction > 0:
        score += doctor_satisfaction
        factors += 1
    
    # وجود عينات أو منتجات
    if samples_count > 0 or products_count > 0:
        score += 1.0
        factors += 1
    
    # تقييم المندوب
    if effectiveness_rating > 0:
        score += effectiveness_rating
        factors += 1
    
    return round(score / factors if factors > 0 else 0.0, 1)

def get_visit_status_display(visit: Dict[str, Any]) -> str:
    """الحصول على عرض محسن لحالة الزيارة"""
    status = visit.get("status", "")
    scheduled_date_str = visit.get("scheduled_date", "")
    
    if not scheduled_date_str:
        return status
    
    try:
        scheduled_date = datetime.fromisoformat(scheduled_date_str.replace('Z', '+00:00'))
        now = datetime.utcnow()
        
        if status == VisitStatus.PLANNED:
            if scheduled_date < now:
                return "متأخرة - مجدولة"
            elif (scheduled_date - now).total_seconds() < 3600:  # أقل من ساعة
                return "قريبة - مجدولة"
            else:
                return "مجدولة"
        elif status == VisitStatus.IN_PROGRESS:
            return "جارية الآن"
        elif status == VisitStatus.COMPLETED:
            return "مكتملة"
        elif status == VisitStatus.CANCELLED:
            return "ملغاة"
        else:
            return status
    except:
        return status