#!/usr/bin/env python3
"""
اختبار نهائي شامل لمشكلة تسجيل العيادات - Final Comprehensive Test
Complete end-to-end test of the clinic registration issue
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://af82d270-0f9e-4b08-93b4-329c3531075a.preview.emergentagent.com/api"

def final_clinic_registration_test():
    """الاختبار النهائي الشامل لمشكلة تسجيل العيادات"""
    print("🏥 الاختبار النهائي الشامل لمشكلة تسجيل العيادات")
    print("=" * 70)
    
    results = {
        "admin_login": False,
        "medical_rep_creation": False,
        "medical_rep_login": False,
        "clinic_registration": False,
        "admin_sees_clinic": False,
        "medical_rep_sees_clinic": False,
        "clinic_in_visits_system": False
    }
    
    # Step 1: Admin login
    print("1️⃣ تسجيل دخول الأدمن...")
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    }, timeout=30)
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return results
    
    admin_token = admin_response.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    results["admin_login"] = True
    print("✅ تسجيل دخول الأدمن نجح")
    
    # Step 2: Create a medical rep with known credentials
    print("\n2️⃣ إنشاء مندوب طبي جديد...")
    rep_data = {
        "username": "final_test_rep",
        "password": "finaltest123",
        "full_name": "مندوب الاختبار النهائي",
        "role": "medical_rep",
        "email": "finaltest@example.com",
        "phone": "01999999999",
        "is_active": True
    }
    
    create_rep_response = requests.post(f"{BACKEND_URL}/users", 
                                       json=rep_data, 
                                       headers=admin_headers, 
                                       timeout=30)
    
    if create_rep_response.status_code == 200:
        results["medical_rep_creation"] = True
        print("✅ تم إنشاء المندوب الطبي بنجاح")
        rep_info = create_rep_response.json()
        print(f"📄 معلومات المندوب: {rep_info.get('user', {}).get('full_name', 'غير محدد')}")
    else:
        print(f"❌ فشل إنشاء المندوب الطبي: {create_rep_response.text}")
        # Try to continue with existing rep
        print("🔄 محاولة استخدام مندوب موجود...")
    
    # Step 3: Login as medical rep
    print("\n3️⃣ تسجيل دخول المندوب الطبي...")
    rep_login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "final_test_rep",
        "password": "finaltest123"
    }, timeout=30)
    
    if rep_login_response.status_code == 200:
        rep_token = rep_login_response.json().get("access_token")
        rep_headers = {"Authorization": f"Bearer {rep_token}"}
        results["medical_rep_login"] = True
        print("✅ تسجيل دخول المندوب الطبي نجح")
        
        rep_user_info = rep_login_response.json().get("user", {})
        rep_user_id = rep_user_info.get("id")
        print(f"👤 معرف المندوب: {rep_user_id}")
    else:
        print(f"❌ فشل تسجيل دخول المندوب الطبي: {rep_login_response.text}")
        return results
    
    # Step 4: Register clinic as medical rep
    print("\n4️⃣ تسجيل عيادة جديدة كمندوب طبي...")
    clinic_data = {
        "clinic_name": "عيادة الاختبار النهائي الشامل",
        "doctor_name": "د. الاختبار النهائي",
        "phone": "01888888888",
        "address": "شارع الاختبار النهائي، القاهرة، مصر",
        "latitude": 30.0444,
        "longitude": 31.2357,
        "specialization": "طب عام",
        "area_id": "final_test_area",
        "area_name": "منطقة الاختبار النهائي"
    }
    
    clinic_response = requests.post(f"{BACKEND_URL}/clinics", 
                                   json=clinic_data, 
                                   headers=rep_headers, 
                                   timeout=30)
    
    registered_clinic_id = None
    if clinic_response.status_code == 200:
        results["clinic_registration"] = True
        clinic_result = clinic_response.json()
        print("✅ تسجيل العيادة نجح")
        print(f"📄 رسالة النجاح: {clinic_result.get('message', 'غير محدد')}")
        
        # Extract clinic ID
        if "clinic" in clinic_result:
            registered_clinic_id = clinic_result["clinic"].get("id")
        elif "id" in clinic_result:
            registered_clinic_id = clinic_result["id"]
        
        print(f"🆔 معرف العيادة: {registered_clinic_id}")
        print(f"📊 تفاصيل الاستجابة: {json.dumps(clinic_result, ensure_ascii=False, indent=2)}")
    else:
        print(f"❌ فشل تسجيل العيادة: {clinic_response.text}")
        return results
    
    # Step 5: Check if admin can see the clinic
    print("\n5️⃣ فحص رؤية العيادة في حساب الأدمن...")
    admin_clinics_response = requests.get(f"{BACKEND_URL}/clinics", headers=admin_headers, timeout=30)
    
    if admin_clinics_response.status_code == 200:
        admin_clinics = admin_clinics_response.json()
        print(f"👁️ الأدمن يرى {len(admin_clinics)} عيادة إجمالية")
        
        # Check if our clinic is there
        clinic_found_in_admin = False
        if registered_clinic_id:
            clinic_found_in_admin = any(c.get("id") == registered_clinic_id for c in admin_clinics)
        
        if clinic_found_in_admin:
            results["admin_sees_clinic"] = True
            print("✅ العيادة المسجلة تظهر في حساب الأدمن")
        else:
            print("❌ العيادة المسجلة لا تظهر في حساب الأدمن")
        
        # Show recent clinics
        print("📋 آخر 3 عيادات مسجلة:")
        for i, clinic in enumerate(admin_clinics[:3]):
            name = clinic.get("clinic_name") or clinic.get("name", "بدون اسم")
            creator = clinic.get("created_by_name", "غير محدد")
            clinic_id = clinic.get("id", "غير محدد")
            print(f"   {i+1}. {name} (أنشأها: {creator}) [ID: {clinic_id[:8]}...]")
    else:
        print(f"❌ فشل في الحصول على عيادات الأدمن: {admin_clinics_response.status_code}")
    
    # Step 6: Check if medical rep can see the clinic
    print("\n6️⃣ فحص رؤية العيادة في حساب المندوب الطبي...")
    rep_clinics_response = requests.get(f"{BACKEND_URL}/clinics", headers=rep_headers, timeout=30)
    
    if rep_clinics_response.status_code == 200:
        rep_clinics = rep_clinics_response.json()
        print(f"👁️ المندوب الطبي يرى {len(rep_clinics)} عيادة")
        
        # Check if our clinic is there
        clinic_found_in_rep = False
        if registered_clinic_id:
            clinic_found_in_rep = any(c.get("id") == registered_clinic_id for c in rep_clinics)
        
        if clinic_found_in_rep:
            results["medical_rep_sees_clinic"] = True
            print("✅ العيادة المسجلة تظهر في حساب المندوب الطبي")
        else:
            print("❌ العيادة المسجلة لا تظهر في حساب المندوب الطبي")
        
        # Show rep's clinics
        if rep_clinics:
            print("📋 عيادات المندوب الطبي:")
            for i, clinic in enumerate(rep_clinics):
                name = clinic.get("clinic_name") or clinic.get("name", "بدون اسم")
                clinic_id = clinic.get("id", "غير محدد")
                print(f"   {i+1}. {name} [ID: {clinic_id[:8]}...]")
        else:
            print("📋 المندوب الطبي لا يرى أي عيادات")
    else:
        print(f"❌ فشل في الحصول على عيادات المندوب: {rep_clinics_response.status_code}")
    
    # Step 7: Test visits system integration
    print("\n7️⃣ اختبار تكامل نظام الزيارات...")
    visits_response = requests.get(f"{BACKEND_URL}/visits", headers=rep_headers, timeout=30)
    doctors_response = requests.get(f"{BACKEND_URL}/doctors", headers=rep_headers, timeout=30)
    
    if visits_response.status_code == 200 and doctors_response.status_code == 200:
        visits = visits_response.json()
        doctors = doctors_response.json()
        results["clinic_in_visits_system"] = True
        print(f"✅ نظام الزيارات يعمل - {len(visits)} زيارة، {len(doctors)} طبيب")
    else:
        print(f"❌ مشكلة في نظام الزيارات - Visits: {visits_response.status_code}, Doctors: {doctors_response.status_code}")
    
    # Step 8: Final analysis and recommendations
    print("\n" + "=" * 70)
    print("🔬 التحليل النهائي والتوصيات")
    print("=" * 70)
    
    success_count = sum(results.values())
    total_tests = len(results)
    success_rate = (success_count / total_tests) * 100
    
    print(f"📊 معدل النجاح الإجمالي: {success_rate:.1f}% ({success_count}/{total_tests})")
    
    print("\n📋 تفاصيل النتائج:")
    test_names = {
        "admin_login": "تسجيل دخول الأدمن",
        "medical_rep_creation": "إنشاء المندوب الطبي",
        "medical_rep_login": "تسجيل دخول المندوب الطبي",
        "clinic_registration": "تسجيل العيادة",
        "admin_sees_clinic": "رؤية العيادة في حساب الأدمن",
        "medical_rep_sees_clinic": "رؤية العيادة في حساب المندوب",
        "clinic_in_visits_system": "تكامل نظام الزيارات"
    }
    
    for key, success in results.items():
        status = "✅ نجح" if success else "❌ فشل"
        print(f"   {status} - {test_names[key]}")
    
    print("\n🎯 تحديد المشكلة الأساسية:")
    
    if results["clinic_registration"] and results["admin_sees_clinic"] and not results["medical_rep_sees_clinic"]:
        print("🔍 المشكلة الرئيسية: العيادات المسجلة لا تظهر للمندوبين الطبيين")
        print("💡 السبب المحتمل: مشكلة في فلترة العيادات حسب المستخدم في GET /api/clinics")
        print("🔧 الحل المقترح:")
        print("   1. فحص منطق الفلترة في backend/server.py في دالة get_clinics")
        print("   2. التأكد من ربط العيادات بـ assigned_rep_id أو created_by")
        print("   3. فحص صلاحيات المندوبين الطبيين")
        
    elif results["clinic_registration"] and not results["admin_sees_clinic"]:
        print("🔍 المشكلة الرئيسية: العيادات لا تُحفظ في قاعدة البيانات")
        print("💡 السبب المحتمل: مشكلة في حفظ البيانات في MongoDB")
        print("🔧 الحل المقترح:")
        print("   1. فحص اتصال قاعدة البيانات")
        print("   2. فحص دالة إنشاء العيادات في الباكند")
        
    elif not results["clinic_registration"]:
        print("🔍 المشكلة الرئيسية: فشل في تسجيل العيادات")
        print("💡 السبب المحتمل: مشكلة في API أو الصلاحيات")
        print("🔧 الحل المقترح:")
        print("   1. فحص الحقول المطلوبة")
        print("   2. فحص صلاحيات المندوبين الطبيين")
        
    else:
        print("✅ النظام يعمل بشكل صحيح!")
        print("💡 المشكلة قد تكون في الواجهة الأمامية أو في سيناريو استخدام مختلف")
    
    print("\n🚀 الخطوات التالية الموصى بها:")
    print("1. فحص كود الواجهة الأمامية لتسجيل العيادات")
    print("2. فحص منطق فلترة العيادات في الباكند")
    print("3. التأكد من ربط العيادات بالمستخدمين بشكل صحيح")
    print("4. اختبار السيناريو الكامل من الواجهة الأمامية")
    
    return results

if __name__ == "__main__":
    final_clinic_registration_test()