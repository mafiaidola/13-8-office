#!/usr/bin/env python3
"""
اختبار سريع لتحديد سبب عدم ظهور العيادات الحقيقية في الواجهة الأمامية
Quick test to determine why real clinics are not showing up in the frontend

المطلوب حسب المراجعة العربية:
1) تسجيل دخول admin/admin123
2) فحص GET /api/clinics مرة أخرى للتأكد من العيادات الحقيقية
3) فحص بنية البيانات المُرجعة بالتفصيل
4) تجربة فلترة العيادات النشطة فقط (is_active = true)
5) فحص ما إذا كانت العيادات لها حقول مطلوبة (id, name)

الهدف: معرفة لماذا لا تظهر العيادات الحقيقية الـ 6 في الواجهة الأمامية رغم وجودها في قاعدة البيانات.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://f4f7e091-f5a6-4f57-bca3-79ac25601921.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_test_result(test_name, success, details="", response_time=0):
    status = "✅ SUCCESS" if success else "❌ FAILED"
    print(f"{status} | {test_name} ({response_time:.2f}ms)")
    if details:
        print(f"   📋 {details}")

def analyze_clinic_data(clinics_data):
    """تحليل مفصل لبيانات العيادات"""
    print(f"\n🔍 **تحليل مفصل لبيانات العيادات:**")
    
    if not clinics_data:
        print("❌ لا توجد عيادات في البيانات المُرجعة")
        return
    
    print(f"📊 **إجمالي العيادات:** {len(clinics_data)}")
    
    # تحليل الحقول المطلوبة
    required_fields = ['id', 'name']
    optional_fields = ['is_active', 'status', 'doctor_name', 'phone', 'address']
    
    clinics_with_required_fields = 0
    active_clinics = 0
    verified_clinics = 0
    
    print(f"\n📋 **تفاصيل العيادات:**")
    for i, clinic in enumerate(clinics_data, 1):
        print(f"\n🏥 **العيادة {i}:**")
        
        # فحص الحقول المطلوبة
        has_required = all(field in clinic and clinic[field] for field in required_fields)
        if has_required:
            clinics_with_required_fields += 1
            
        print(f"   📝 ID: {clinic.get('id', 'مفقود')}")
        print(f"   🏥 Name: {clinic.get('name', 'مفقود')}")
        print(f"   👨‍⚕️ Doctor: {clinic.get('doctor_name', 'مفقود')}")
        print(f"   📞 Phone: {clinic.get('phone', 'مفقود')}")
        print(f"   🏠 Address: {clinic.get('address', 'مفقود')}")
        print(f"   ✅ Active: {clinic.get('is_active', 'مفقود')}")
        print(f"   📊 Status: {clinic.get('status', 'مفقود')}")
        print(f"   ✔️ Required Fields: {'نعم' if has_required else 'لا'}")
        
        # إحصائيات
        if clinic.get('is_active') == True:
            active_clinics += 1
        if clinic.get('is_verified') == True:
            verified_clinics += 1
    
    print(f"\n📊 **الإحصائيات النهائية:**")
    print(f"   🔢 إجمالي العيادات: {len(clinics_data)}")
    print(f"   ✅ عيادات بحقول مطلوبة: {clinics_with_required_fields}")
    print(f"   🟢 عيادات نشطة: {active_clinics}")
    print(f"   ✔️ عيادات مُتحققة: {verified_clinics}")
    
    return {
        "total": len(clinics_data),
        "with_required_fields": clinics_with_required_fields,
        "active": active_clinics,
        "verified": verified_clinics
    }

def main():
    print_section("اختبار سريع لمشكلة عدم ظهور العيادات الحقيقية في الواجهة الأمامية")
    
    start_time = time.time()
    jwt_token = None
    test_results = []
    
    try:
        # ============================================================================
        # المرحلة 1: تسجيل الدخول admin/admin123
        # ============================================================================
        print_section("المرحلة 1: تسجيل الدخول admin/admin123")
        
        login_start = time.time()
        login_response = requests.post(
            f"{API_BASE}/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=30
        )
        login_time = (time.time() - login_start) * 1000
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            jwt_token = login_data.get("access_token")
            user_info = login_data.get("user", {})
            
            print_test_result(
                "تسجيل دخول admin/admin123",
                True,
                f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}",
                login_time
            )
            test_results.append(("تسجيل الدخول", True, login_time))
        else:
            print_test_result(
                "تسجيل دخول admin/admin123",
                False,
                f"HTTP {login_response.status_code}: {login_response.text}",
                login_time
            )
            test_results.append(("تسجيل الدخول", False, login_time))
            return
        
        # Headers for authenticated requests
        headers = {"Authorization": f"Bearer {jwt_token}"}
        
        # ============================================================================
        # المرحلة 2: فحص GET /api/clinics مرة أخرى للتأكد من العيادات الحقيقية
        # ============================================================================
        print_section("المرحلة 2: فحص GET /api/clinics للعيادات الحقيقية")
        
        clinics_start = time.time()
        clinics_response = requests.get(f"{API_BASE}/clinics", headers=headers, timeout=30)
        clinics_time = (time.time() - clinics_start) * 1000
        
        if clinics_response.status_code == 200:
            clinics_data = clinics_response.json()
            
            print_test_result(
                "GET /api/clinics",
                True,
                f"تم العثور على {len(clinics_data)} عيادة",
                clinics_time
            )
            test_results.append(("جلب العيادات", True, clinics_time))
            
            # تحليل مفصل للبيانات
            clinic_stats = analyze_clinic_data(clinics_data)
            
        else:
            print_test_result(
                "GET /api/clinics",
                False,
                f"HTTP {clinics_response.status_code}: {clinics_response.text}",
                clinics_time
            )
            test_results.append(("جلب العيادات", False, clinics_time))
            return
        
        # ============================================================================
        # المرحلة 3: فحص بنية البيانات المُرجعة بالتفصيل
        # ============================================================================
        print_section("المرحلة 3: فحص بنية البيانات المُرجعة بالتفصيل")
        
        if clinics_data:
            print(f"🔍 **نوع البيانات المُرجعة:** {type(clinics_data)}")
            
            if isinstance(clinics_data, list):
                print(f"📋 **البيانات عبارة عن مصفوفة (Array) تحتوي على {len(clinics_data)} عنصر**")
                
                if len(clinics_data) > 0:
                    sample_clinic = clinics_data[0]
                    print(f"\n🏥 **عينة من بنية العيادة الأولى:**")
                    print(json.dumps(sample_clinic, indent=2, ensure_ascii=False))
                    
                    # فحص الحقول الأساسية
                    essential_fields = ['id', 'name', 'doctor_name', 'is_active', 'status']
                    print(f"\n✅ **فحص الحقول الأساسية:**")
                    for field in essential_fields:
                        value = sample_clinic.get(field, 'مفقود')
                        print(f"   {field}: {value}")
                        
            elif isinstance(clinics_data, dict):
                print(f"📋 **البيانات عبارة عن كائن (Object)**")
                if 'clinics' in clinics_data:
                    actual_clinics = clinics_data['clinics']
                    print(f"   العيادات موجودة في حقل 'clinics': {len(actual_clinics)} عيادة")
                else:
                    print(f"   الحقول المتاحة: {list(clinics_data.keys())}")
            
            test_results.append(("فحص بنية البيانات", True, 0))
        else:
            print("❌ لا توجد بيانات للفحص")
            test_results.append(("فحص بنية البيانات", False, 0))
        
        # ============================================================================
        # المرحلة 4: تجربة فلترة العيادات النشطة فقط (is_active = true)
        # ============================================================================
        print_section("المرحلة 4: فلترة العيادات النشطة فقط")
        
        if clinics_data and isinstance(clinics_data, list):
            active_clinics = [clinic for clinic in clinics_data if clinic.get('is_active') == True]
            inactive_clinics = [clinic for clinic in clinics_data if clinic.get('is_active') == False]
            unknown_status_clinics = [clinic for clinic in clinics_data if clinic.get('is_active') is None]
            
            print(f"🟢 **العيادات النشطة (is_active = true):** {len(active_clinics)}")
            print(f"🔴 **العيادات غير النشطة (is_active = false):** {len(inactive_clinics)}")
            print(f"⚪ **العيادات بحالة غير محددة (is_active = null):** {len(unknown_status_clinics)}")
            
            if active_clinics:
                print(f"\n✅ **قائمة العيادات النشطة:**")
                for i, clinic in enumerate(active_clinics, 1):
                    print(f"   {i}. {clinic.get('name', 'بدون اسم')} - ID: {clinic.get('id', 'بدون ID')}")
            
            test_results.append(("فلترة العيادات النشطة", True, 0))
        else:
            print("❌ لا يمكن فلترة البيانات - البيانات ليست مصفوفة")
            test_results.append(("فلترة العيادات النشطة", False, 0))
        
        # ============================================================================
        # المرحلة 5: فحص ما إذا كانت العيادات لها حقول مطلوبة (id, name)
        # ============================================================================
        print_section("المرحلة 5: فحص الحقول المطلوبة (id, name)")
        
        if clinics_data and isinstance(clinics_data, list):
            required_fields = ['id', 'name']
            valid_clinics = []
            invalid_clinics = []
            
            for clinic in clinics_data:
                has_all_required = all(
                    field in clinic and clinic[field] and str(clinic[field]).strip()
                    for field in required_fields
                )
                
                if has_all_required:
                    valid_clinics.append(clinic)
                else:
                    invalid_clinics.append(clinic)
            
            print(f"✅ **عيادات صالحة للعرض (لديها id و name):** {len(valid_clinics)}")
            print(f"❌ **عيادات غير صالحة للعرض (مفقود id أو name):** {len(invalid_clinics)}")
            
            if valid_clinics:
                print(f"\n🏥 **العيادات الصالحة للعرض في الواجهة الأمامية:**")
                for i, clinic in enumerate(valid_clinics, 1):
                    print(f"   {i}. ID: {clinic.get('id')} | Name: {clinic.get('name')} | Active: {clinic.get('is_active')}")
            
            if invalid_clinics:
                print(f"\n⚠️ **العيادات غير الصالحة (مشاكل في البيانات):**")
                for i, clinic in enumerate(invalid_clinics, 1):
                    missing_fields = [field for field in required_fields if not (field in clinic and clinic[field] and str(clinic[field]).strip())]
                    print(f"   {i}. مفقود: {', '.join(missing_fields)} | البيانات: {clinic}")
            
            test_results.append(("فحص الحقول المطلوبة", True, 0))
        else:
            print("❌ لا يمكن فحص الحقول - البيانات ليست مصفوفة")
            test_results.append(("فحص الحقول المطلوبة", False, 0))
        
        # ============================================================================
        # التقييم النهائي والتشخيص
        # ============================================================================
        print_section("التقييم النهائي والتشخيص")
        
        total_time = time.time() - start_time
        successful_tests = sum(1 for _, success, _ in test_results if success)
        total_tests = len(test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 **نتائج الاختبار:**")
        print(f"   ✅ اختبارات ناجحة: {successful_tests}/{total_tests}")
        print(f"   📈 معدل النجاح: {success_rate:.1f}%")
        print(f"   ⏱️ إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        if clinics_data and isinstance(clinics_data, list):
            print(f"\n🎯 **التشخيص النهائي لمشكلة عدم ظهور العيادات:**")
            
            total_clinics = len(clinics_data)
            active_count = len([c for c in clinics_data if c.get('is_active') == True])
            valid_count = len([c for c in clinics_data if c.get('id') and c.get('name')])
            
            if total_clinics == 0:
                print("❌ **المشكلة:** لا توجد عيادات في قاعدة البيانات")
                print("🔧 **الحل:** إضافة عيادات جديدة أو فحص اتصال قاعدة البيانات")
            elif valid_count == 0:
                print("❌ **المشكلة:** جميع العيادات تفتقر للحقول المطلوبة (id أو name)")
                print("🔧 **الحل:** تحديث بيانات العيادات لتشمل الحقول المطلوبة")
            elif active_count == 0:
                print("❌ **المشكلة:** جميع العيادات غير نشطة (is_active = false)")
                print("🔧 **الحل:** تفعيل العيادات المطلوبة أو تعديل فلتر الواجهة الأمامية")
            else:
                print(f"✅ **البيانات سليمة:** {valid_count} عيادة صالحة، {active_count} نشطة")
                print("🔧 **المشكلة محتملة في الواجهة الأمامية:** فحص استدعاء API أو معالجة البيانات في React")
        
        print(f"\n🏆 **الخلاصة:** تم تحديد سبب مشكلة عدم ظهور العيادات بنجاح!")
        
    except Exception as e:
        print(f"❌ خطأ في تنفيذ الاختبار: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()