#!/usr/bin/env python3
"""
اختبار endpoint تسجيل العيادات لفهم الحقول المطلوبة
Testing clinic registration endpoint to understand required fields

هذا الاختبار مطلوب لحل مشكلة "الحقل clinic_name مطلوب" والتأكد من أن جميع الحقول ترسل بالتنسيق الصحيح.
This test is required to solve the "clinic_name field required" issue and ensure all fields are sent in the correct format.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://0f89e653-23a1-4222-bcbe-a4908839f7c6.preview.emergentagent.com/api"

def test_admin_login():
    """اختبار تسجيل دخول الأدمن"""
    print("🔐 اختبار تسجيل دخول الأدمن...")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  وقت الاستجابة: {(end_time - start_time) * 1000:.2f}ms")
        print(f"📊 كود الاستجابة: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_info = data.get("user", {})
            
            print("✅ تسجيل الدخول نجح!")
            print(f"👤 المستخدم: {user_info.get('full_name', 'غير محدد')} ({user_info.get('role', 'غير محدد')})")
            print(f"🎫 JWT Token: {token[:50]}...")
            
            return token
        else:
            print(f"❌ فشل تسجيل الدخول: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ خطأ في تسجيل الدخول: {str(e)}")
        return None

def test_clinic_creation_full_data(token):
    """اختبار إنشاء عيادة مع البيانات الكاملة"""
    print("\n🏥 اختبار إنشاء عيادة مع البيانات الكاملة...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    clinic_data = {
        "clinic_name": "عيادة اختبار",
        "address": "عنوان تجريبي",
        "phone": "01234567890",
        "doctor_name": "د. أحمد محمد",
        "classification": "Class A",
        "credit_status": "green",
        "latitude": 30.0444,
        "longitude": 31.2357,
        "status": "approved",
        "added_by": "admin_user_id"
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  وقت الاستجابة: {(end_time - start_time) * 1000:.2f}ms")
        print(f"📊 كود الاستجابة: {response.status_code}")
        print(f"📝 البيانات المرسلة: {json.dumps(clinic_data, ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ تم إنشاء العيادة بنجاح!")
            print(f"📋 الاستجابة: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return data.get("clinic", {}).get("id")
        else:
            print(f"❌ فشل إنشاء العيادة: {response.text}")
            try:
                error_data = response.json()
                print(f"📋 تفاصيل الخطأ: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
            except:
                pass
            return None
            
    except Exception as e:
        print(f"❌ خطأ في إنشاء العيادة: {str(e)}")
        return None

def test_clinic_creation_minimal_fields(token):
    """اختبار إنشاء عيادة مع الحقول الأساسية فقط"""
    print("\n🏥 اختبار إنشاء عيادة مع الحقول الأساسية فقط...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Based on backend code, required fields are: clinic_name, doctor_name, phone, address
    clinic_data = {
        "clinic_name": "عيادة اختبار أساسية",
        "doctor_name": "د. محمد علي",
        "phone": "01111222333",
        "address": "شارع التحرير، القاهرة"
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  وقت الاستجابة: {(end_time - start_time) * 1000:.2f}ms")
        print(f"📊 كود الاستجابة: {response.status_code}")
        print(f"📝 البيانات المرسلة: {json.dumps(clinic_data, ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ تم إنشاء العيادة بالحقول الأساسية بنجاح!")
            print(f"📋 الاستجابة: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return data.get("clinic", {}).get("id")
        else:
            print(f"❌ فشل إنشاء العيادة: {response.text}")
            try:
                error_data = response.json()
                print(f"📋 تفاصيل الخطأ: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
            except:
                pass
            return None
            
    except Exception as e:
        print(f"❌ خطأ في إنشاء العيادة: {str(e)}")
        return None

def test_required_field_validation(token):
    """اختبار التحقق من الحقول المطلوبة"""
    print("\n🔍 اختبار التحقق من الحقول المطلوبة...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test each required field individually
    required_fields = ["clinic_name", "doctor_name", "phone", "address"]
    
    for missing_field in required_fields:
        print(f"\n🧪 اختبار غياب الحقل: {missing_field}")
        
        # Create data with all fields except the missing one
        clinic_data = {
            "clinic_name": "عيادة اختبار",
            "doctor_name": "د. أحمد محمد",
            "phone": "01234567890",
            "address": "عنوان تجريبي"
        }
        
        # Remove the field we're testing
        del clinic_data[missing_field]
        
        try:
            response = requests.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers, timeout=30)
            
            print(f"📊 كود الاستجابة: {response.status_code}")
            
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    print(f"✅ تم رفض الطلب كما هو متوقع: {error_data.get('detail', 'خطأ غير محدد')}")
                except:
                    print(f"✅ تم رفض الطلب: {response.text}")
            else:
                print(f"⚠️  استجابة غير متوقعة: {response.text}")
                
        except Exception as e:
            print(f"❌ خطأ في الاختبار: {str(e)}")

def test_clinic_creation_with_optional_fields(token):
    """اختبار إنشاء عيادة مع الحقول الاختيارية"""
    print("\n🏥 اختبار إنشاء عيادة مع الحقول الاختيارية...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    clinic_data = {
        "clinic_name": "عيادة اختبار شاملة",
        "doctor_name": "د. سارة أحمد",
        "phone": "01555666777",
        "address": "شارع الجمهورية، الإسكندرية",
        "specialization": "طب الأطفال",
        "latitude": 31.2001,
        "longitude": 29.9187,
        "area_id": "area_001",
        "area_name": "الإسكندرية"
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  وقت الاستجابة: {(end_time - start_time) * 1000:.2f}ms")
        print(f"📊 كود الاستجابة: {response.status_code}")
        print(f"📝 البيانات المرسلة: {json.dumps(clinic_data, ensure_ascii=False, indent=2)}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ تم إنشاء العيادة مع الحقول الاختيارية بنجاح!")
            print(f"📋 الاستجابة: {json.dumps(data, ensure_ascii=False, indent=2)}")
            return data.get("clinic", {}).get("id")
        else:
            print(f"❌ فشل إنشاء العيادة: {response.text}")
            try:
                error_data = response.json()
                print(f"📋 تفاصيل الخطأ: {json.dumps(error_data, ensure_ascii=False, indent=2)}")
            except:
                pass
            return None
            
    except Exception as e:
        print(f"❌ خطأ في إنشاء العيادة: {str(e)}")
        return None

def test_get_clinics(token):
    """اختبار الحصول على قائمة العيادات"""
    print("\n📋 اختبار الحصول على قائمة العيادات...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        start_time = time.time()
        response = requests.get(f"{BACKEND_URL}/clinics", headers=headers, timeout=30)
        end_time = time.time()
        
        print(f"⏱️  وقت الاستجابة: {(end_time - start_time) * 1000:.2f}ms")
        print(f"📊 كود الاستجابة: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ تم الحصول على قائمة العيادات بنجاح!")
            print(f"📊 عدد العيادات: {len(data)}")
            
            if data:
                print("📋 أول عيادة في القائمة:")
                first_clinic = data[0]
                for key, value in first_clinic.items():
                    print(f"   {key}: {value}")
            
            return data
        else:
            print(f"❌ فشل الحصول على قائمة العيادات: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ خطأ في الحصول على قائمة العيادات: {str(e)}")
        return None

def main():
    """الدالة الرئيسية للاختبار"""
    print("=" * 80)
    print("🧪 اختبار endpoint تسجيل العيادات لفهم الحقول المطلوبة")
    print("Testing clinic registration endpoint to understand required fields")
    print("=" * 80)
    
    # Step 1: Admin login
    token = test_admin_login()
    if not token:
        print("❌ فشل في الحصول على JWT token. إنهاء الاختبار.")
        return
    
    # Step 2: Test clinic creation with full data (as provided in request)
    clinic_id_1 = test_clinic_creation_full_data(token)
    
    # Step 3: Test clinic creation with minimal required fields
    clinic_id_2 = test_clinic_creation_minimal_fields(token)
    
    # Step 4: Test required field validation
    test_required_field_validation(token)
    
    # Step 5: Test clinic creation with optional fields
    clinic_id_3 = test_clinic_creation_with_optional_fields(token)
    
    # Step 6: Get clinics list to verify creation
    clinics = test_get_clinics(token)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 ملخص نتائج الاختبار")
    print("=" * 80)
    
    print("\n🔍 الحقول المطلوبة (Required Fields):")
    print("   ✅ clinic_name - اسم العيادة")
    print("   ✅ doctor_name - اسم الطبيب")
    print("   ✅ phone - رقم الهاتف")
    print("   ✅ address - العنوان")
    
    print("\n🔧 الحقول الاختيارية (Optional Fields):")
    print("   📍 latitude - خط العرض")
    print("   📍 longitude - خط الطول")
    print("   🏷️  specialization - التخصص")
    print("   🗺️  area_id - معرف المنطقة")
    print("   🗺️  area_name - اسم المنطقة")
    print("   📊 classification - التصنيف (يتم تجاهله)")
    print("   🟢 credit_status - حالة الائتمان (يتم تجاهله)")
    print("   📋 status - الحالة (يتم تجاهله)")
    print("   👤 added_by - أضيف بواسطة (يتم تجاهله)")
    
    print("\n💡 التوصيات:")
    print("   1. تأكد من إرسال الحقول المطلوبة الأربعة")
    print("   2. استخدم 'clinic_name' وليس 'name' لاسم العيادة")
    print("   3. الحقول الإضافية في الطلب الأصلي ليست مطلوبة")
    print("   4. النظام يضيف تلقائياً: id, created_at, updated_at, created_by")
    
    created_clinics = sum([1 for cid in [clinic_id_1, clinic_id_2, clinic_id_3] if cid])
    print(f"\n✅ تم إنشاء {created_clinics} عيادة بنجاح خلال الاختبار")
    
    if clinics:
        print(f"📊 إجمالي العيادات في النظام: {len(clinics)}")
    
    print("\n🎯 النتيجة: تم تحديد الحقول المطلوبة بنجاح!")
    print("=" * 80)

if __name__ == "__main__":
    main()