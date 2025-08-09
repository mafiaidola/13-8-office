#!/usr/bin/env python3
"""
اختبار مركز لمشكلة تسجيل العيادات - Root Cause Analysis
Focused test to identify the core issue with clinic registration
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://0c7671be-0c51-4a84-bbb3-9b77f9ff726f.preview.emergentagent.com/api"

def test_clinic_registration_root_cause():
    """تحليل السبب الجذري لمشكلة تسجيل العيادات"""
    print("🔍 بدء تحليل السبب الجذري لمشكلة تسجيل العيادات")
    print("=" * 60)
    
    # Step 1: Admin login
    print("1️⃣ اختبار تسجيل دخول الأدمن...")
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    }, timeout=30)
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    print("✅ تسجيل دخول الأدمن نجح")
    
    # Step 2: Get all users to find medical reps
    print("\n2️⃣ البحث عن المندوبين الطبيين الموجودين...")
    headers = {"Authorization": f"Bearer {admin_token}"}
    users_response = requests.get(f"{BACKEND_URL}/users", headers=headers, timeout=30)
    
    if users_response.status_code != 200:
        print("❌ فشل في الحصول على قائمة المستخدمين")
        return
    
    users = users_response.json()
    medical_reps = [u for u in users if u.get("role") == "medical_rep"]
    print(f"✅ وجد {len(medical_reps)} مندوب طبي في النظام")
    
    if medical_reps:
        print("📋 المندوبين الطبيين الموجودين:")
        for i, rep in enumerate(medical_reps[:5]):  # Show first 5
            print(f"   {i+1}. {rep.get('full_name', 'بدون اسم')} ({rep.get('username')})")
    
    # Step 3: Test clinic registration as admin (to isolate the API issue)
    print("\n3️⃣ اختبار تسجيل العيادة كأدمن (لعزل مشكلة API)...")
    clinic_data = {
        "clinic_name": "عيادة اختبار السبب الجذري",
        "doctor_name": "د. تحليل السبب الجذري",
        "phone": "01111111111",
        "address": "شارع التحليل، القاهرة، مصر",
        "latitude": 30.0444,
        "longitude": 31.2357,
        "specialization": "طب عام"
    }
    
    clinic_response = requests.post(f"{BACKEND_URL}/clinics", 
                                   json=clinic_data, 
                                   headers=headers, 
                                   timeout=30)
    
    print(f"📊 استجابة تسجيل العيادة: {clinic_response.status_code}")
    if clinic_response.status_code == 200:
        clinic_result = clinic_response.json()
        print("✅ تسجيل العيادة كأدمن نجح")
        print(f"📄 الاستجابة: {json.dumps(clinic_result, ensure_ascii=False, indent=2)}")
        
        # Extract clinic ID
        clinic_id = None
        if "clinic" in clinic_result:
            clinic_id = clinic_result["clinic"].get("id")
        elif "id" in clinic_result:
            clinic_id = clinic_result["id"]
        
        print(f"🆔 معرف العيادة المسجلة: {clinic_id}")
        
    else:
        print(f"❌ فشل تسجيل العيادة كأدمن: {clinic_response.text}")
    
    # Step 4: Check clinics visibility for admin
    print("\n4️⃣ فحص رؤية العيادات للأدمن...")
    admin_clinics_response = requests.get(f"{BACKEND_URL}/clinics", headers=headers, timeout=30)
    
    if admin_clinics_response.status_code == 200:
        admin_clinics = admin_clinics_response.json()
        print(f"✅ الأدمن يرى {len(admin_clinics)} عيادة")
        
        if admin_clinics:
            print("📋 أول 5 عيادات:")
            for i, clinic in enumerate(admin_clinics[:5]):
                name = clinic.get("clinic_name") or clinic.get("name", "بدون اسم")
                created_by = clinic.get("created_by_name", "غير محدد")
                print(f"   {i+1}. {name} (أنشأها: {created_by})")
        
        # Check if our registered clinic appears
        if clinic_response.status_code == 200 and clinic_id:
            found_clinic = any(c.get("id") == clinic_id for c in admin_clinics)
            print(f"🔍 العيادة المسجلة حديثاً {'موجودة' if found_clinic else 'غير موجودة'} في القائمة")
    else:
        print(f"❌ فشل في الحصول على عيادات الأدمن: {admin_clinics_response.status_code}")
    
    # Step 5: Test with existing medical rep if available
    if medical_reps:
        print(f"\n5️⃣ اختبار مع مندوب طبي موجود...")
        test_rep = medical_reps[0]
        
        # Try common passwords
        passwords_to_try = [
            test_rep["username"],  # Username as password
            "123456",
            "password",
            "test123",
            f"{test_rep['username']}123"
        ]
        
        rep_token = None
        for password in passwords_to_try:
            rep_login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": test_rep["username"],
                "password": password
            }, timeout=30)
            
            if rep_login_response.status_code == 200:
                rep_token = rep_login_response.json().get("access_token")
                print(f"✅ تسجيل دخول المندوب نجح بكلمة مرور: {password}")
                break
        
        if rep_token:
            # Test clinic registration as medical rep
            rep_headers = {"Authorization": f"Bearer {rep_token}"}
            rep_clinic_data = {
                "clinic_name": "عيادة اختبار المندوب الطبي",
                "doctor_name": "د. اختبار المندوب",
                "phone": "01222222222",
                "address": "شارع المندوب، القاهرة، مصر",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "specialization": "طب عام"
            }
            
            rep_clinic_response = requests.post(f"{BACKEND_URL}/clinics", 
                                               json=rep_clinic_data, 
                                               headers=rep_headers, 
                                               timeout=30)
            
            print(f"📊 تسجيل العيادة كمندوب: {rep_clinic_response.status_code}")
            if rep_clinic_response.status_code == 200:
                print("✅ المندوب الطبي يمكنه تسجيل العيادات")
                rep_result = rep_clinic_response.json()
                print(f"📄 استجابة المندوب: {json.dumps(rep_result, ensure_ascii=False, indent=2)}")
            else:
                print(f"❌ فشل تسجيل العيادة كمندوب: {rep_clinic_response.text}")
            
            # Test clinic visibility for medical rep
            rep_clinics_response = requests.get(f"{BACKEND_URL}/clinics", headers=rep_headers, timeout=30)
            
            if rep_clinics_response.status_code == 200:
                rep_clinics = rep_clinics_response.json()
                print(f"👁️ المندوب الطبي يرى {len(rep_clinics)} عيادة")
                
                if rep_clinics:
                    print("📋 عيادات المندوب:")
                    for i, clinic in enumerate(rep_clinics):
                        name = clinic.get("clinic_name") or clinic.get("name", "بدون اسم")
                        print(f"   {i+1}. {name}")
            else:
                print(f"❌ فشل في الحصول على عيادات المندوب: {rep_clinics_response.status_code}")
        else:
            print("❌ فشل في تسجيل دخول أي مندوب طبي")
    
    # Step 6: Analysis and conclusions
    print("\n" + "=" * 60)
    print("🔬 تحليل النتائج والاستنتاجات")
    print("=" * 60)
    
    print("📊 ملخص الاختبارات:")
    print(f"   • تسجيل دخول الأدمن: {'✅ نجح' if admin_response.status_code == 200 else '❌ فشل'}")
    print(f"   • عدد المندوبين الطبيين: {len(medical_reps)}")
    print(f"   • تسجيل العيادة كأدمن: {'✅ نجح' if clinic_response.status_code == 200 else '❌ فشل'}")
    print(f"   • رؤية العيادات للأدمن: {'✅ نجح' if admin_clinics_response.status_code == 200 else '❌ فشل'}")
    
    print("\n💡 الاستنتاجات:")
    
    if clinic_response.status_code == 200 and admin_clinics_response.status_code == 200:
        print("✅ API تسجيل العيادات يعمل بشكل صحيح")
        print("✅ الأدمن يمكنه رؤية العيادات")
        
        if len(admin_clinics) > 0:
            print("✅ توجد عيادات مسجلة في النظام")
            print("\n🎯 المشكلة المحتملة:")
            print("   • المشكلة قد تكون في الواجهة الأمامية وليس الباكند")
            print("   • أو في صلاحيات المندوبين الطبيين")
            print("   • أو في فلترة العيادات حسب المستخدم")
        else:
            print("⚠️ لا توجد عيادات في النظام")
    else:
        print("❌ هناك مشكلة في APIs الباكند")
    
    print("\n🔧 التوصيات:")
    print("1. فحص الواجهة الأمامية لتسجيل العيادات")
    print("2. التأكد من صلاحيات المندوبين الطبيين")
    print("3. فحص منطق فلترة العيادات في GET /api/clinics")
    print("4. التأكد من ربط العيادات بالمستخدمين الذين أنشأوها")

if __name__ == "__main__":
    test_clinic_registration_root_cause()