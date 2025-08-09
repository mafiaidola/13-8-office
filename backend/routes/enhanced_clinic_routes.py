# واجهات برمجة التطبيقات المحسنة للعيادات
# Enhanced Clinic Management APIs with Professional Registration System

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import traceback
import uuid
import json

from models.all_models import User
from models.enhanced_clinic_models import (
    EnhancedClinic, ClinicRegistrationRequest, ClinicModificationLog,
    AdminRegistrationLog, ClinicSearchFilter, ClinicSummary,
    ClinicRegistrationResponse, ClinicModificationResponse,
    ClinicClassification, CreditClassification, ClinicStatus,
    LocationData, RegistrationLocationData
)
from routes.auth_routes import get_current_user

# إنشاء الموجه
router = APIRouter(prefix="/enhanced-clinics", tags=["Enhanced Clinic Management"])

# ============================================================================
# CLINIC REGISTRATION SYSTEM - نظام تسجيل العيادات
# ============================================================================

@router.get("/registration/form-data")
async def get_registration_form_data(
    current_user: User = Depends(get_current_user)
):
    """الحصول على بيانات النموذج (الخطوط والمناطق المتاحة)"""
    try:
        from server import db
        
        # جلب الخطوط النشطة
        lines = []
        lines_cursor = db.lines.find({"is_active": True}).sort("priority", 1)
        async for line in lines_cursor:
            lines.append({
                "id": line.get("id", ""),
                "name": line.get("name", ""),
                "code": line.get("code", ""),
                "description": line.get("description", "")
            })
        
        # جلب المناطق النشطة
        areas = []
        areas_cursor = db.areas.find({"is_active": True}).sort("priority", 1)
        async for area in areas_cursor:
            areas.append({
                "id": area.get("id", ""),
                "name": area.get("name", ""),
                "code": area.get("code", ""),
                "parent_line_id": area.get("parent_line_id", ""),
                "parent_line_name": area.get("parent_line_name", "")
            })
        
        # إنشاء بيانات تجريبية إذا لم تكن موجودة
        if not lines:
            default_lines = [
                {"id": str(uuid.uuid4()), "name": "خط القاهرة الكبرى", "code": "CGC", "description": "يغطي محافظات القاهرة والجيزة", "is_active": True, "priority": 1},
                {"id": str(uuid.uuid4()), "name": "خط الإسكندرية", "code": "ALX", "description": "يغطي محافظة الإسكندرية والساحل الشمالي", "is_active": True, "priority": 2},
                {"id": str(uuid.uuid4()), "name": "خط الدلتا", "code": "DLT", "description": "يغطي محافظات الدلتا", "is_active": True, "priority": 3},
                {"id": str(uuid.uuid4()), "name": "خط الصعيد", "code": "UEG", "description": "يغطي محافظات الصعيد", "is_active": True, "priority": 4}
            ]
            
            for line_data in default_lines:
                await db.lines.insert_one(line_data)
                lines.append({
                    "id": line_data["id"],
                    "name": line_data["name"],
                    "code": line_data["code"],
                    "description": line_data["description"]
                })
        
        # إنشاء مناطق تجريبية مرتبطة بالخطوط
        if not areas and lines:
            default_areas = []
            area_names = [
                "وسط القاهرة", "شرق القاهرة", "غرب القاهرة", "شمال القاهرة", "جنوب القاهرة",
                "وسط الجيزة", "شرق الجيزة", "غرب الجيزة", "6 أكتوبر", "الشيخ زايد",
                "وسط الإسكندرية", "شرق الإسكندرية", "غرب الإسكندرية", "برج العرب", "العامرية"
            ]
            
            for i, area_name in enumerate(area_names):
                line_id = lines[i % len(lines)]["id"]
                line_name = lines[i % len(lines)]["name"]
                area_data = {
                    "id": str(uuid.uuid4()),
                    "name": area_name,
                    "code": f"AR{i+1:03d}",
                    "parent_line_id": line_id,
                    "parent_line_name": line_name,
                    "is_active": True,
                    "priority": i + 1,
                    "created_at": datetime.utcnow()
                }
                
                await db.areas.insert_one(area_data)
                areas.append({
                    "id": area_data["id"],
                    "name": area_data["name"],
                    "code": area_data["code"],
                    "parent_line_id": area_data["parent_line_id"],
                    "parent_line_name": area_data["parent_line_name"]
                })
        
        return {
            "success": True,
            "data": {
                "lines": lines,
                "areas": areas,
                "classifications": [
                    {"value": "class_a_star", "label": "Class A star", "color": "#10B981", "priority": 5},
                    {"value": "class_a", "label": "Class A", "color": "#059669", "priority": 4},
                    {"value": "class_b", "label": "Class B", "color": "#0891B2", "priority": 3},
                    {"value": "class_c", "label": "Class C", "color": "#EAB308", "priority": 2},
                    {"value": "class_d", "label": "Class D", "color": "#DC2626", "priority": 1}
                ],
                "credit_classifications": [
                    {"value": "green", "label": "أخضر - تصنيف ائتماني جيد", "color": "#10B981"},
                    {"value": "yellow", "label": "أصفر - تصنيف ائتماني مقبول", "color": "#EAB308"},
                    {"value": "red", "label": "أحمر - يحتاج مراجعة الحسابات", "color": "#DC2626"}
                ]
            }
        }
        
    except Exception as e:
        print(f"Error getting form data: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب بيانات النموذج")

@router.post("/register")
async def register_clinic(
    request: ClinicRegistrationRequest,
    current_user: User = Depends(get_current_user)
):
    """تسجيل عيادة جديدة"""
    try:
        from server import db
        
        # التحقق من الصلاحيات
        if current_user.get("role") not in ["medical_rep", "admin", "manager", "line_manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بتسجيل العيادات")
        
        # التحقق من وجود الخط والمنطقة
        line = await db.lines.find_one({"id": request.line_id})
        if not line:
            raise HTTPException(status_code=404, detail="الخط المحدد غير موجود")
        
        area = await db.areas.find_one({"id": request.area_id})
        if not area:
            raise HTTPException(status_code=404, detail="المنطقة المحددة غير موجودة")
        
        # التحقق من أن المنطقة تتبع الخط المحدد
        if area.get("parent_line_id") != request.line_id:
            raise HTTPException(status_code=400, detail="المنطقة المحددة لا تتبع الخط المحدد")
        
        # إنشاء رقم تسجيل فريد
        registration_number = f"CL-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # إنشاء بيانات الموقع
        location_data = LocationData(
            latitude=request.clinic_latitude,
            longitude=request.clinic_longitude,
            address=request.clinic_address,
            accuracy=request.location_accuracy
        )
        
        # إنشاء بيانات موقع المسجل إذا توفرت
        registration_location = None
        if request.rep_latitude and request.rep_longitude:
            registration_location = RegistrationLocationData(
                rep_latitude=request.rep_latitude,
                rep_longitude=request.rep_longitude,
                rep_accuracy=request.rep_location_accuracy,
                device_info=request.device_info or ""
            )
        
        # إنشاء سجل العيادة
        clinic_id = str(uuid.uuid4())
        enhanced_clinic = {
            "id": clinic_id,
            "registration_number": registration_number,
            "name": request.clinic_name,
            "phone": request.clinic_phone,
            "email": request.clinic_email,
            "primary_doctor_name": request.doctor_name,
            "primary_doctor_specialty": request.doctor_specialty,
            "primary_doctor_phone": request.doctor_phone,
            "additional_doctors": [],
            
            # بيانات الموقع
            "location_data": location_data.dict(),
            "admin_approved_location": None,
            
            # الربط الجغرافي
            "line_id": request.line_id,
            "line_name": line.get("name", ""),
            "area_id": request.area_id,
            "area_name": area.get("name", ""),
            "district_id": request.district_id,
            "district_name": None,
            
            # التصنيفات الافتراضية
            "classification": ClinicClassification.CLASS_B,
            "credit_classification": CreditClassification.YELLOW,
            "classification_notes": "تصنيف افتراضي للعيادة الجديدة",
            
            # معلومات التخصيص
            "assigned_rep_id": current_user.get("id"),
            "assigned_rep_name": current_user.get("full_name", current_user.get("username", "")),
            "backup_rep_ids": [],
            "available_reps": [current_user.get("id")],
            
            # الإحصائيات الافتراضية
            "total_visits": 0,
            "total_orders": 0,
            "total_revenue": 0.0,
            "outstanding_debt": 0.0,
            "credit_limit": 5000.0,
            
            # حالة العيادة
            "status": ClinicStatus.PENDING,
            "is_active": True,
            "is_verified": False,
            
            # بيانات التسجيل
            "registration_type": "field_registration",
            "registration_location": registration_location.dict() if registration_location else None,
            "registration_notes": request.registration_notes,
            "registration_photos": request.registration_photos,
            
            # بيانات إدارية
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("id"),
            "audit_trail": [{
                "action": "clinic_created",
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": current_user.get("id"),
                "user_name": current_user.get("full_name", current_user.get("username", "")),
                "details": {
                    "registration_type": "field_registration",
                    "line": line.get("name", ""),
                    "area": area.get("name", "")
                }
            }]
        }
        
        # حفظ العيادة
        await db.enhanced_clinics.insert_one(enhanced_clinic)
        
        # إنشاء سجل للأدمن
        admin_log = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "clinic_name": request.clinic_name,
            "clinic_phone": request.clinic_phone,
            "doctor_name": request.doctor_name,
            "clinic_address": request.clinic_address,
            "registered_by": current_user.get("id"),
            "registrar_name": current_user.get("full_name", current_user.get("username", "")),
            "registrar_role": current_user.get("role", ""),
            "clinic_location": location_data.dict(),
            "registrar_location": registration_location.dict() if registration_location else None,
            "line_name": line.get("name", ""),
            "area_name": area.get("name", ""),
            "district_name": None,
            "registration_status": ClinicStatus.PENDING,
            "registration_type": "field_registration",
            "registration_photos": request.registration_photos,
            "registration_notes": request.registration_notes,
            "review_decision": "pending",
            "created_at": datetime.utcnow().isoformat(),
            "last_updated": datetime.utcnow().isoformat()
        }
        
        await db.admin_registration_logs.insert_one(admin_log)
        
        return ClinicRegistrationResponse(
            success=True,
            message="تم تسجيل العيادة بنجاح وهي قيد المراجعة الإدارية",
            clinic_id=clinic_id,
            registration_number=registration_number,
            status="pending",
            next_steps=[
                "ستتم مراجعة البيانات من قبل الإدارة",
                "سيتم إعلامك بنتيجة المراجعة",
                "في حالة الموافقة، ستصبح العيادة نشطة ومتاحة للزيارة"
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error registering clinic: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في تسجيل العيادة")

@router.get("/available-for-user")
async def get_available_clinics_for_user(
    line_id: Optional[str] = Query(None, description="تصفية حسب الخط"),
    area_id: Optional[str] = Query(None, description="تصفية حسب المنطقة"),
    status_filter: Optional[str] = Query("approved", description="تصفية حسب الحالة"),
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على العيادات المتاحة للمستخدم حسب الخط والمنطقة"""
    try:
        from server import db
        
        # بناء فلتر البحث حسب دور المستخدم
        query_filter = {"status": status_filter or "approved", "is_active": True}
        
        if current_user.get("role") == "medical_rep":
            # المندوب يرى العيادات المخصصة له أو المتاحة له
            user_id = current_user.get("id")
            query_filter["$or"] = [
                {"assigned_rep_id": user_id},
                {"available_reps": {"$in": [user_id]}},
                {"backup_rep_ids": {"$in": [user_id]}}
            ]
            
        elif current_user.get("role") in ["line_manager", "area_manager"]:
            # مدير الخط/المنطقة يرى العيادات في نطاق مسؤوليته
            # يمكن تطوير هذا لاحقاً بناء على بيانات المستخدم
            pass
        
        # تطبيق فلاتر إضافية
        if line_id:
            query_filter["line_id"] = line_id
            
        if area_id:
            query_filter["area_id"] = area_id
        
        # جلب العيادات
        clinics = []
        clinics_cursor = db.enhanced_clinics.find(query_filter).limit(limit).sort("created_at", -1)
        
        async for clinic in clinics_cursor:
            # حساب آخر زيارة للعيادة
            last_visit = await db.rep_visits.find_one(
                {"clinic_id": clinic.get("id", ""), "status": "completed"},
                sort=[("actual_end_time", -1)]
            )
            
            last_visit_date = None
            if last_visit and last_visit.get("actual_end_time"):
                try:
                    last_visit_date = last_visit["actual_end_time"]
                except:
                    pass
            
            # تنسيق بيانات العيادة
            clinic_summary = {
                "id": clinic.get("id", ""),
                "name": clinic.get("name", ""),
                "registration_number": clinic.get("registration_number", ""),
                "primary_doctor_name": clinic.get("primary_doctor_name", ""),
                "primary_doctor_specialty": clinic.get("primary_doctor_specialty", ""),
                "phone": clinic.get("phone", ""),
                "address": clinic.get("location_data", {}).get("address", ""),
                "classification": clinic.get("classification", "average"),
                "credit_classification": clinic.get("credit_classification", "b"),
                "status": clinic.get("status", "pending"),
                "line_name": clinic.get("line_name", ""),
                "area_name": clinic.get("area_name", ""),
                "assigned_rep_name": clinic.get("assigned_rep_name", ""),
                "total_visits": clinic.get("total_visits", 0),
                "total_revenue": clinic.get("total_revenue", 0.0),
                "outstanding_debt": clinic.get("outstanding_debt", 0.0),
                "last_visit_date": last_visit_date,
                "location": {
                    "latitude": clinic.get("location_data", {}).get("latitude"),
                    "longitude": clinic.get("location_data", {}).get("longitude")
                },
                "is_available_for_visit": True,  # يمكن تطوير هذا بناء على قواعد العمل
                "distance_from_user": None  # يمكن حسابها إذا توفر موقع المستخدم
            }
            
            clinics.append(clinic_summary)
        
        # إحصائيات سريعة
        total_count = await db.enhanced_clinics.count_documents(query_filter)
        
        return {
            "success": True,
            "clinics": clinics,
            "statistics": {
                "total_available": total_count,
                "returned_count": len(clinics),
                "user_role": current_user.get("role", ""),
                "filtered_by_line": line_id is not None,
                "filtered_by_area": area_id is not None
            }
        }
        
    except Exception as e:
        print(f"Error getting available clinics: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب العيادات المتاحة")

# ============================================================================
# ADMIN REGISTRATION LOGS - سجلات التسجيل للأدمن
# ============================================================================

@router.get("/admin/registration-logs")
async def get_admin_registration_logs(
    status: Optional[str] = Query(None, description="تصفية حسب حالة المراجعة"),
    line_id: Optional[str] = Query(None, description="تصفية حسب الخط"),
    registrar_id: Optional[str] = Query(None, description="تصفية حسب المسجل"),
    from_date: Optional[date] = Query(None, description="من تاريخ"),
    to_date: Optional[date] = Query(None, description="إلى تاريخ"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على سجلات تسجيل العيادات للأدمن"""
    try:
        from server import db
        
        # التحقق من الصلاحيات
        if current_user.get("role") not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بالوصول لهذه البيانات")
        
        # بناء فلتر البحث
        query_filter = {}
        
        if status:
            query_filter["review_decision"] = status
        
        if line_id:
            # البحث في العيادات حسب الخط
            clinics_in_line = await db.enhanced_clinics.find(
                {"line_id": line_id}, {"id": 1}
            ).to_list(1000)
            clinic_ids = [clinic["id"] for clinic in clinics_in_line]
            query_filter["clinic_id"] = {"$in": clinic_ids}
        
        if registrar_id:
            query_filter["registered_by"] = registrar_id
        
        if from_date:
            query_filter["created_at"] = {"$gte": datetime.combine(from_date, datetime.min.time()).isoformat()}
        
        if to_date:
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = datetime.combine(to_date, datetime.max.time()).isoformat()
            else:
                query_filter["created_at"] = {"$lte": datetime.combine(to_date, datetime.max.time()).isoformat()}
        
        # حساب pagination
        skip = (page - 1) * page_size
        
        # جلب السجلات
        logs = []
        logs_cursor = db.admin_registration_logs.find(query_filter).skip(skip).limit(page_size).sort("created_at", -1)
        
        async for log in logs_cursor:
            # إضافة معلومات إضافية للسجل
            log_enhanced = dict(log)
            
            # حساب المسافة بين موقع العيادة وموقع المسجل
            clinic_loc = log.get("clinic_location", {})
            registrar_loc = log.get("registrar_location", {})
            
            distance_km = None
            if (clinic_loc.get("latitude") and clinic_loc.get("longitude") and 
                registrar_loc and registrar_loc.get("rep_latitude") and registrar_loc.get("rep_longitude")):
                # يمكن حساب المسافة باستخدام formula Haversine
                import math
                
                def calculate_distance(lat1, lon1, lat2, lon2):
                    R = 6371  # نصف قطر الأرض بالكيلومتر
                    dLat = math.radians(lat2 - lat1)
                    dLon = math.radians(lon2 - lon1)
                    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
                         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                         math.sin(dLon / 2) * math.sin(dLon / 2))
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    return R * c
                
                try:
                    distance_km = round(calculate_distance(
                        clinic_loc["latitude"], clinic_loc["longitude"],
                        registrar_loc["rep_latitude"], registrar_loc["rep_longitude"]
                    ), 2)
                except:
                    pass
            
            log_enhanced["distance_between_locations_km"] = distance_km
            log_enhanced["registration_accuracy"] = "high" if distance_km and distance_km < 0.1 else "medium" if distance_km and distance_km < 1 else "low"
            
            # تنسيق التواريخ
            if "created_at" in log_enhanced and isinstance(log_enhanced["created_at"], str):
                try:
                    log_enhanced["created_at_formatted"] = datetime.fromisoformat(log_enhanced["created_at"].replace('Z', '+00:00')).strftime("%Y-%m-%d %H:%M")
                except:
                    pass
            
            logs.append(log_enhanced)
        
        # إحصائيات
        total_count = await db.admin_registration_logs.count_documents(query_filter)
        
        # إحصائيات سريعة
        stats_pipeline = [
            {"$match": query_filter if query_filter else {}},
            {
                "$group": {
                    "_id": "$review_decision",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        stats_result = await db.admin_registration_logs.aggregate(stats_pipeline).to_list(10)
        status_stats = {stat["_id"]: stat["count"] for stat in stats_result}
        
        return {
            "success": True,
            "logs": logs,
            "pagination": {
                "current_page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size,
                "has_next": skip + page_size < total_count,
                "has_previous": page > 1
            },
            "statistics": {
                "total_registrations": total_count,
                "pending": status_stats.get("pending", 0),
                "approved": status_stats.get("approved", 0),
                "rejected": status_stats.get("rejected", 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting admin registration logs: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب سجلات التسجيل")

@router.post("/admin/approve-registration/{clinic_id}")
async def approve_clinic_registration(
    clinic_id: str,
    approval_notes: Optional[str] = None,
    approved_location: Optional[Dict[str, Any]] = None,
    classification: Optional[ClinicClassification] = None,
    credit_classification: Optional[CreditClassification] = None,
    current_user: User = Depends(get_current_user)
):
    """اعتماد تسجيل العيادة"""
    try:
        from server import db
        
        # التحقق من الصلاحيات
        if current_user.get("role") not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك باعتماد التسجيلات")
        
        # البحث عن العيادة
        clinic = await db.enhanced_clinics.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        if clinic.get("status") != ClinicStatus.PENDING:
            raise HTTPException(status_code=400, detail="العيادة ليست قيد المراجعة")
        
        # تحديث بيانات العيادة
        update_data = {
            "status": ClinicStatus.APPROVED,
            "is_verified": True,
            "approved_by": current_user.get("id"),
            "approved_at": datetime.utcnow().isoformat(),
            "verification_date": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("id")
        }
        
        # إضافة التصنيفات إذا تم تحديدها
        if classification:
            update_data["classification"] = classification
            update_data["classification_updated_at"] = datetime.utcnow().isoformat()
            update_data["classification_updated_by"] = current_user.get("id")
        
        if credit_classification:
            update_data["credit_classification"] = credit_classification
        
        # إضافة الموقع المعتمد إذا تم تحديده
        if approved_location:
            update_data["admin_approved_location"] = approved_location
        
        # إضافة سجل تدقيق
        audit_entry = {
            "action": "clinic_approved",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": current_user.get("id"),
            "user_name": current_user.get("full_name", current_user.get("username", "")),
            "details": {
                "approval_notes": approval_notes,
                "classification": classification,
                "credit_classification": credit_classification,
                "location_approved": approved_location is not None
            }
        }
        
        # تحديث مسار التدقيق
        current_audit = clinic.get("audit_trail", [])
        current_audit.append(audit_entry)
        update_data["audit_trail"] = current_audit
        
        # تطبيق التحديثات
        result = await db.enhanced_clinics.update_one(
            {"id": clinic_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="فشل في تحديث العيادة")
        
        # تحديث سجل الأدمن
        await db.admin_registration_logs.update_one(
            {"clinic_id": clinic_id},
            {
                "$set": {
                    "reviewed_by": current_user.get("id"),
                    "reviewer_name": current_user.get("full_name", current_user.get("username", "")),
                    "review_date": datetime.utcnow().isoformat(),
                    "review_notes": approval_notes,
                    "review_decision": "approved",
                    "last_updated": datetime.utcnow().isoformat()
                }
            }
        )
        
        # إنشاء سجل تعديل
        modification_log = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "clinic_name": clinic.get("name", ""),
            "modification_type": "approve",
            "old_data": {"status": ClinicStatus.PENDING},
            "new_data": update_data,
            "changes_summary": f"تم اعتماد العيادة من قبل {current_user.get('full_name', 'الإدارة')}",
            "modified_by": current_user.get("id"),
            "modifier_name": current_user.get("full_name", current_user.get("username", "")),
            "modifier_role": current_user.get("role", ""),
            "modification_reason": approval_notes,
            "admin_notes": approval_notes,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.clinic_modification_logs.insert_one(modification_log)
        
        return {
            "success": True,
            "message": "تم اعتماد العيادة بنجاح",
            "clinic_id": clinic_id,
            "status": "approved",
            "modification_id": modification_log["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error approving clinic registration: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في اعتماد العيادة")

# ============================================================================
# CLINIC MODIFICATION & UPDATE SYSTEM - نظام تعديل العيادات
# ============================================================================

@router.put("/modify/{clinic_id}")
async def modify_clinic(
    clinic_id: str,
    modification_data: Dict[str, Any],
    modification_reason: str,
    current_user: User = Depends(get_current_user)
):
    """تعديل بيانات العيادة"""
    try:
        from server import db
        
        # البحث عن العيادة
        clinic = await db.enhanced_clinics.find_one({"id": clinic_id})
        if not clinic:
            raise HTTPException(status_code=404, detail="العيادة غير موجودة")
        
        # التحقق من الصلاحيات
        user_role = current_user.get("role", "")
        user_id = current_user.get("id", "")
        
        # قواعد الصلاحيات للتعديل
        can_modify = False
        
        if user_role in ["admin", "manager"]:
            can_modify = True
        elif user_role == "medical_rep" and clinic.get("assigned_rep_id") == user_id:
            can_modify = True
        elif user_role == "line_manager":
            # مدير الخط يمكنه تعديل عيادات خطه
            # يمكن إضافة منطق إضافي هنا
            can_modify = True
        
        if not can_modify:
            raise HTTPException(status_code=403, detail="غير مسموح لك بتعديل هذه العيادة")
        
        # الحصول على موقع المستخدم إذا توفر
        user_location = None
        if "user_latitude" in modification_data and "user_longitude" in modification_data:
            user_location = {
                "latitude": modification_data.pop("user_latitude"),
                "longitude": modification_data.pop("user_longitude"),
                "timestamp": datetime.utcnow().isoformat()
            }
        
        # إعداد البيانات القديمة للتدقيق
        old_data = {key: clinic.get(key) for key in modification_data.keys() if key in clinic}
        
        # إعداد البيانات الجديدة
        new_data = modification_data.copy()
        new_data["updated_at"] = datetime.utcnow().isoformat()
        new_data["updated_by"] = user_id
        
        # إضافة سجل تدقيق
        audit_entry = {
            "action": "clinic_modified",
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "user_name": current_user.get("full_name", current_user.get("username", "")),
            "details": {
                "reason": modification_reason,
                "fields_modified": list(modification_data.keys()),
                "user_location": user_location
            }
        }
        
        # تحديث مسار التدقيق
        current_audit = clinic.get("audit_trail", [])
        current_audit.append(audit_entry)
        new_data["audit_trail"] = current_audit
        
        # تطبيق التحديثات
        result = await db.enhanced_clinics.update_one(
            {"id": clinic_id},
            {"$set": new_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="فشل في تحديث العيادة")
        
        # إنشاء سجل التعديل
        modification_log = {
            "id": str(uuid.uuid4()),
            "clinic_id": clinic_id,
            "clinic_name": clinic.get("name", ""),
            "modification_type": "update",
            "old_data": old_data,
            "new_data": {k: v for k, v in modification_data.items() if k != "audit_trail"},
            "changes_summary": f"تعديل {', '.join(modification_data.keys())}",
            "modified_by": user_id,
            "modifier_name": current_user.get("full_name", current_user.get("username", "")),
            "modifier_role": user_role,
            "modifier_location": user_location,
            "modification_reason": modification_reason,
            "created_at": datetime.utcnow().isoformat()
        }
        
        await db.clinic_modification_logs.insert_one(modification_log)
        
        return ClinicModificationResponse(
            success=True,
            message="تم تحديث العيادة بنجاح",
            clinic_id=clinic_id,
            modification_id=modification_log["id"],
            changes_applied=modification_data,
            requires_approval=user_role not in ["admin", "manager"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error modifying clinic: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في تعديل العيادة")

@router.get("/modification-logs")
async def get_modification_logs(
    clinic_id: Optional[str] = Query(None, description="معرف العيادة"),
    modifier_id: Optional[str] = Query(None, description="معرف المعدل"),
    modification_type: Optional[str] = Query(None, description="نوع التعديل"),
    from_date: Optional[date] = Query(None, description="من تاريخ"),
    to_date: Optional[date] = Query(None, description="إلى تاريخ"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """الحصول على سجلات تعديل العيادات"""
    try:
        from server import db
        
        # التحقق من الصلاحيات
        if current_user.get("role") not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="غير مسموح لك بالوصول لهذه البيانات")
        
        # بناء فلتر البحث
        query_filter = {}
        
        if clinic_id:
            query_filter["clinic_id"] = clinic_id
        
        if modifier_id:
            query_filter["modified_by"] = modifier_id
        
        if modification_type:
            query_filter["modification_type"] = modification_type
        
        if from_date:
            query_filter["created_at"] = {"$gte": datetime.combine(from_date, datetime.min.time()).isoformat()}
        
        if to_date:
            if "created_at" in query_filter:
                query_filter["created_at"]["$lte"] = datetime.combine(to_date, datetime.max.time()).isoformat()
            else:
                query_filter["created_at"] = {"$lte": datetime.combine(to_date, datetime.max.time()).isoformat()}
        
        # حساب pagination
        skip = (page - 1) * page_size
        
        # جلب السجلات
        logs = []
        logs_cursor = db.clinic_modification_logs.find(query_filter).skip(skip).limit(page_size).sort("created_at", -1)
        
        async for log in logs_cursor:
            logs.append(log)
        
        # إحصائيات
        total_count = await db.clinic_modification_logs.count_documents(query_filter)
        
        return {
            "success": True,
            "logs": logs,
            "pagination": {
                "current_page": page,
                "page_size": page_size,
                "total_count": total_count,
                "total_pages": (total_count + page_size - 1) // page_size,
                "has_next": skip + page_size < total_count,
                "has_previous": page > 1
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting modification logs: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="خطأ في جلب سجلات التعديل")