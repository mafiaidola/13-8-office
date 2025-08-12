#!/usr/bin/env python3
"""
فحص قاعدة بيانات العيادات الحقيقية ومعرفة البيانات الموجودة فعلاً
Real Clinic Database Inspection Test - Arabic Review Request

المطلوب:
1) تسجيل دخول admin/admin123
2) فحص GET /api/clinics - ما هي العيادات المسجلة فعلاً في قاعدة البيانات؟
3) فحص بنية البيانات الحقيقية للعيادات
4) التحقق من وجود عيادات حقيقية مسجلة
5) إذا لم توجد عيادات، فحص سجلات إنشاء العيادات

الهدف: معرفة البيانات الحقيقية للعيادات في قاعدة البيانات لاستخدامها بدلاً من البيانات الوهمية.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com"
BASE_URL = f"{BACKEND_URL}/api"

def print_section(title):
    print(f"\n{'='*80}")
    print(f"🔍 {title}")
    print(f"{'='*80}")

def print_test_result(test_name, success, response_time, details=""):
    status = "✅ نجح" if success else "❌ فشل"
    print(f"{status} {test_name} ({response_time:.2f}ms)")
    if details:
        print(f"   📋 {details}")

def main():
    print_section("فحص قاعدة بيانات العيادات الحقيقية - Arabic Review Request")
    
    test_results = []
    total_start_time = time.time()
    
    # Test 1: Admin Login
    print_section("المرحلة 1: تسجيل دخول admin/admin123")
    
    try:
        start_time = time.time()
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=30
        )
        response_time = (time.time() - start_time) * 1000
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            jwt_token = login_data.get("access_token")
            user_info = login_data.get("user", {})
            
            print_test_result(
                "تسجيل دخول admin/admin123", 
                True, 
                response_time,
                f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}"
            )
            test_results.append(("تسجيل الدخول", True, response_time))
            
            # Headers for authenticated requests
            headers = {"Authorization": f"Bearer {jwt_token}"}
            
        else:
            print_test_result("تسجيل دخول admin/admin123", False, response_time, f"HTTP {login_response.status_code}")
            test_results.append(("تسجيل الدخول", False, response_time))
            return
            
    except Exception as e:
        print_test_result("تسجيل دخول admin/admin123", False, 0, f"خطأ: {str(e)}")
        test_results.append(("تسجيل الدخول", False, 0))
        return
    
    # Test 2: GET /api/clinics - Real Clinic Data Inspection
    print_section("المرحلة 2: فحص GET /api/clinics - العيادات المسجلة فعلاً")
    
    try:
        start_time = time.time()
        clinics_response = requests.get(f"{BASE_URL}/clinics", headers=headers, timeout=30)
        response_time = (time.time() - start_time) * 1000
        
        if clinics_response.status_code == 200:
            clinics_data = clinics_response.json()
            clinics_count = len(clinics_data) if isinstance(clinics_data, list) else 0
            
            print_test_result(
                "GET /api/clinics - جلب العيادات", 
                True, 
                response_time,
                f"تم العثور على {clinics_count} عيادة في قاعدة البيانات"
            )
            test_results.append(("جلب العيادات", True, response_time))
            
            # Detailed analysis of clinic data
            print(f"\n📊 **تحليل مفصل للعيادات المسجلة:**")
            
            if clinics_count == 0:
                print("❌ **لا توجد عيادات مسجلة في قاعدة البيانات**")
                print("   🔍 سيتم فحص سجلات إنشاء العيادات...")
                
            else:
                print(f"✅ **تم العثور على {clinics_count} عيادة مسجلة:**")
                
                for i, clinic in enumerate(clinics_data[:5], 1):  # Show first 5 clinics
                    print(f"\n🏥 **العيادة {i}:**")
                    print(f"   📋 الاسم: {clinic.get('name', 'غير محدد')}")
                    print(f"   👨‍⚕️ الطبيب: {clinic.get('doctor_name', 'غير محدد')}")
                    print(f"   📞 الهاتف: {clinic.get('phone', 'غير محدد')}")
                    print(f"   📍 العنوان: {clinic.get('address', 'غير محدد')}")
                    print(f"   🆔 المعرف: {clinic.get('id', 'غير محدد')}")
                    print(f"   📊 التصنيف: {clinic.get('classification', 'غير محدد')}")
                    print(f"   💳 التصنيف الائتماني: {clinic.get('credit_classification', 'غير محدد')}")
                    print(f"   🔄 الحالة: {clinic.get('status', 'غير محدد')}")
                    print(f"   ✅ نشط: {clinic.get('is_active', 'غير محدد')}")
                    
                    # Location data
                    if clinic.get('clinic_latitude') and clinic.get('clinic_longitude'):
                        print(f"   🌍 الموقع: {clinic.get('clinic_latitude')}, {clinic.get('clinic_longitude')}")
                    
                    # Registration info
                    if clinic.get('created_at'):
                        print(f"   📅 تاريخ التسجيل: {clinic.get('created_at')}")
                    if clinic.get('registered_by'):
                        print(f"   👤 مسجل بواسطة: {clinic.get('registered_by')}")
                
                if clinics_count > 5:
                    print(f"\n... و {clinics_count - 5} عيادة أخرى")
                
                # Analyze clinic data structure
                print(f"\n🔍 **تحليل بنية البيانات:**")
                if clinics_data:
                    sample_clinic = clinics_data[0]
                    available_fields = list(sample_clinic.keys())
                    print(f"   📋 الحقول المتاحة ({len(available_fields)}): {', '.join(available_fields[:10])}")
                    if len(available_fields) > 10:
                        print(f"   ... و {len(available_fields) - 10} حقل آخر")
                
                # Categorize clinics by status
                status_counts = {}
                classification_counts = {}
                active_count = 0
                
                for clinic in clinics_data:
                    status = clinic.get('status', 'unknown')
                    classification = clinic.get('classification', 'unknown')
                    is_active = clinic.get('is_active', False)
                    
                    status_counts[status] = status_counts.get(status, 0) + 1
                    classification_counts[classification] = classification_counts.get(classification, 0) + 1
                    if is_active:
                        active_count += 1
                
                print(f"\n📈 **إحصائيات العيادات:**")
                print(f"   ✅ العيادات النشطة: {active_count}/{clinics_count}")
                print(f"   📊 توزيع الحالات: {status_counts}")
                print(f"   🏷️ توزيع التصنيفات: {classification_counts}")
            
        else:
            print_test_result("GET /api/clinics", False, response_time, f"HTTP {clinics_response.status_code}")
            test_results.append(("جلب العيادات", False, response_time))
            clinics_count = 0
            
    except Exception as e:
        print_test_result("GET /api/clinics", False, 0, f"خطأ: {str(e)}")
        test_results.append(("جلب العيادات", False, 0))
        clinics_count = 0
    
    # Test 3: Check Activities for Clinic Registration Logs (if no clinics found)
    if clinics_count == 0:
        print_section("المرحلة 3: فحص سجلات إنشاء العيادات في الأنشطة")
        
        try:
            start_time = time.time()
            activities_response = requests.get(
                f"{BASE_URL}/activities?activity_type=clinic_registration&limit=20", 
                headers=headers, 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if activities_response.status_code == 200:
                activities_data = activities_response.json()
                activities_count = len(activities_data) if isinstance(activities_data, list) else 0
                
                print_test_result(
                    "فحص سجلات تسجيل العيادات", 
                    True, 
                    response_time,
                    f"تم العثور على {activities_count} سجل تسجيل عيادة"
                )
                test_results.append(("سجلات تسجيل العيادات", True, response_time))
                
                if activities_count > 0:
                    print(f"\n📋 **سجلات تسجيل العيادات الأخيرة:**")
                    for i, activity in enumerate(activities_data[:5], 1):
                        print(f"\n📝 **السجل {i}:**")
                        print(f"   📋 الوصف: {activity.get('description', 'غير محدد')}")
                        print(f"   👤 المستخدم: {activity.get('user_name', 'غير محدد')}")
                        print(f"   📅 التاريخ: {activity.get('timestamp', 'غير محدد')}")
                        print(f"   🏥 اسم العيادة: {activity.get('clinic_name', 'غير محدد')}")
                        print(f"   🆔 معرف العيادة: {activity.get('clinic_id', 'غير محدد')}")
                else:
                    print("❌ **لا توجد سجلات تسجيل عيادات في الأنشطة**")
                    
            else:
                print_test_result("فحص سجلات تسجيل العيادات", False, response_time, f"HTTP {activities_response.status_code}")
                test_results.append(("سجلات تسجيل العيادات", False, response_time))
                
        except Exception as e:
            print_test_result("فحص سجلات تسجيل العيادات", False, 0, f"خطأ: {str(e)}")
            test_results.append(("سجلات تسجيل العيادات", False, 0))
    
    # Test 4: Check Enhanced Clinics (if available)
    print_section("المرحلة 4: فحص العيادات المحسنة (Enhanced Clinics)")
    
    try:
        start_time = time.time()
        enhanced_clinics_response = requests.get(f"{BASE_URL}/enhanced-clinics", headers=headers, timeout=30)
        response_time = (time.time() - start_time) * 1000
        
        if enhanced_clinics_response.status_code == 200:
            enhanced_data = enhanced_clinics_response.json()
            enhanced_count = len(enhanced_data) if isinstance(enhanced_data, list) else 0
            
            print_test_result(
                "GET /api/enhanced-clinics", 
                True, 
                response_time,
                f"تم العثور على {enhanced_count} عيادة محسنة"
            )
            test_results.append(("العيادات المحسنة", True, response_time))
            
            if enhanced_count > 0:
                print(f"\n🏥 **العيادات المحسنة المسجلة:**")
                for i, clinic in enumerate(enhanced_data[:3], 1):
                    print(f"\n🏥 **العيادة المحسنة {i}:**")
                    print(f"   📋 الاسم: {clinic.get('clinic_name', 'غير محدد')}")
                    print(f"   👨‍⚕️ الطبيب: {clinic.get('doctor_name', 'غير محدد')}")
                    print(f"   🏥 التخصص: {clinic.get('doctor_specialty', 'غير محدد')}")
                    print(f"   📊 التصنيف: {clinic.get('classification', 'غير محدد')}")
                    print(f"   🔄 الحالة: {clinic.get('status', 'غير محدد')}")
            
        else:
            print_test_result("GET /api/enhanced-clinics", False, response_time, f"HTTP {enhanced_clinics_response.status_code} - Endpoint غير متاح")
            test_results.append(("العيادات المحسنة", False, response_time))
            
    except Exception as e:
        print_test_result("GET /api/enhanced-clinics", False, 0, f"خطأ: {str(e)}")
        test_results.append(("العيادات المحسنة", False, 0))
    
    # Test 5: Database Health Check for Clinics Collection
    print_section("المرحلة 5: فحص صحة مجموعة العيادات في قاعدة البيانات")
    
    try:
        start_time = time.time()
        health_response = requests.get(f"{BASE_URL}/health", headers=headers, timeout=30)
        response_time = (time.time() - start_time) * 1000
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            db_status = health_data.get("database", "unknown")
            stats = health_data.get("statistics", {})
            clinics_in_health = stats.get("clinics", 0)
            
            print_test_result(
                "فحص صحة قاعدة البيانات", 
                True, 
                response_time,
                f"حالة قاعدة البيانات: {db_status}، العيادات في الإحصائيات: {clinics_in_health}"
            )
            test_results.append(("صحة قاعدة البيانات", True, response_time))
            
            print(f"\n🔍 **إحصائيات قاعدة البيانات:**")
            for key, value in stats.items():
                print(f"   📊 {key}: {value}")
            
        else:
            print_test_result("فحص صحة قاعدة البيانات", False, response_time, f"HTTP {health_response.status_code}")
            test_results.append(("صحة قاعدة البيانات", False, response_time))
            
    except Exception as e:
        print_test_result("فحص صحة قاعدة البيانات", False, 0, f"خطأ: {str(e)}")
        test_results.append(("صحة قاعدة البيانات", False, 0))
    
    # Final Summary
    total_time = time.time() - total_start_time
    successful_tests = sum(1 for _, success, _ in test_results if success)
    total_tests = len(test_results)
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    avg_response_time = sum(rt for _, _, rt in test_results if rt > 0) / len([rt for _, _, rt in test_results if rt > 0]) if test_results else 0
    
    print_section("الملخص النهائي - Real Clinic Database Inspection Results")
    
    print(f"🎯 **نتائج فحص قاعدة بيانات العيادات الحقيقية:**")
    print(f"   📊 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
    print(f"   ⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
    print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
    
    print(f"\n📋 **تفاصيل النتائج:**")
    for test_name, success, response_time in test_results:
        status = "✅" if success else "❌"
        print(f"   {status} {test_name}: {response_time:.2f}ms")
    
    # Key Findings
    print(f"\n🔍 **النتائج الرئيسية:**")
    if clinics_count > 0:
        print(f"   ✅ **تم العثور على {clinics_count} عيادة مسجلة في قاعدة البيانات**")
        print(f"   📊 البيانات الحقيقية متاحة للاستخدام بدلاً من البيانات الوهمية")
        print(f"   🎯 يمكن استخدام هذه البيانات في الاختبارات والتطوير")
    else:
        print(f"   ❌ **لا توجد عيادات مسجلة في قاعدة البيانات**")
        print(f"   🔍 قد تحتاج إلى إنشاء عيادات تجريبية أو فحص إعدادات قاعدة البيانات")
        print(f"   💡 يُنصح بفحص سجلات الأخطاء أو إنشاء بيانات تجريبية")
    
    # Recommendations
    print(f"\n💡 **التوصيات:**")
    if clinics_count > 0:
        print(f"   ✅ استخدم البيانات الحقيقية الموجودة في الاختبارات")
        print(f"   📊 قم بتحليل بنية البيانات لفهم الحقول المتاحة")
        print(f"   🔄 تحقق من حالة العيادات (نشطة/غير نشطة) قبل الاستخدام")
    else:
        print(f"   🏗️ قم بإنشاء عيادات تجريبية لاختبار النظام")
        print(f"   🔍 فحص إعدادات قاعدة البيانات والاتصال")
        print(f"   📝 تحقق من صلاحيات إنشاء العيادات للمستخدمين")
    
    print(f"\n🎉 **فحص قاعدة بيانات العيادات الحقيقية مكتمل!**")
    
    if success_rate >= 80:
        print(f"🟢 **النتيجة: ممتازة** - النظام يعمل بشكل جيد")
    elif success_rate >= 60:
        print(f"🟡 **النتيجة: جيدة** - توجد بعض المشاكل البسيطة")
    else:
        print(f"🔴 **النتيجة: تحتاج تحسين** - توجد مشاكل تحتاج إصلاح")

if __name__ == "__main__":
    main()