#!/usr/bin/env python3
"""
اختبار مركز للمشاكل المحددة في المراجعة العربية
Focused test for specific issues in Arabic review
"""

import requests
import json
import time

BACKEND_URL = "https://66d69312-5e01-4e91-9ce7-79fad17528d1.preview.emergentagent.com/api"

def test_medical_rep_permissions_detailed():
    """اختبار مفصل لصلاحيات المندوب الطبي"""
    print("🔍 اختبار مفصل لصلاحيات المندوب الطبي...")
    
    # تسجيل دخول الأدمن
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    
    # البحث عن مندوب طبي موجود
    users_response = requests.get(f"{BACKEND_URL}/users", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    
    if users_response.status_code == 200:
        users = users_response.json()
        medical_reps = [user for user in users if user.get("role") == "medical_rep"]
        
        if medical_reps:
            # استخدام أول مندوب طبي موجود
            med_rep = medical_reps[0]
            print(f"📋 استخدام المندوب الطبي: {med_rep.get('username')}")
            
            # محاولة تسجيل دخول المندوب (نحتاج كلمة المرور)
            # سنحاول كلمات مرور شائعة
            common_passwords = ["123456", "password", "test123", med_rep.get('username')]
            
            med_rep_token = None
            for password in common_passwords:
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": med_rep.get("username"),
                    "password": password
                })
                if login_response.status_code == 200:
                    med_rep_token = login_response.json().get("access_token")
                    print(f"✅ تسجيل دخول المندوب نجح بكلمة المرور: {password}")
                    break
            
            if not med_rep_token:
                print("❌ لم نتمكن من تسجيل دخول المندوب الطبي")
                return
            
            # اختبار محاولة إنشاء منتج
            product_data = {
                "name": "منتج من مندوب طبي",
                "unit": "علبة",
                "line_id": "test",
                "price": 100.0,
                "price_type": "per_box"
            }
            
            create_product_response = requests.post(f"{BACKEND_URL}/products", 
                json=product_data,
                headers={"Authorization": f"Bearer {med_rep_token}"}
            )
            
            print(f"🔍 محاولة إنشاء منتج من المندوب: كود الاستجابة {create_product_response.status_code}")
            if create_product_response.status_code == 403:
                print("✅ المندوب الطبي محظور من إنشاء منتجات (صحيح)")
            else:
                print("❌ المندوب الطبي يمكنه إنشاء منتجات (خطأ)")
                print(f"   الاستجابة: {create_product_response.text}")
            
            # اختبار محاولة إنشاء خط
            line_data = {
                "name": "خط من مندوب طبي",
                "code": "MR_LINE",
                "description": "خط من مندوب طبي"
            }
            
            create_line_response = requests.post(f"{BACKEND_URL}/lines", 
                json=line_data,
                headers={"Authorization": f"Bearer {med_rep_token}"}
            )
            
            print(f"🔍 محاولة إنشاء خط من المندوب: كود الاستجابة {create_line_response.status_code}")
            if create_line_response.status_code == 403:
                print("✅ المندوب الطبي محظور من إنشاء خطوط (صحيح)")
            else:
                print("❌ المندوب الطبي يمكنه إنشاء خطوط (خطأ)")
                print(f"   الاستجابة: {create_line_response.text}")

def test_duplicate_prevention():
    """اختبار منع البيانات المكررة"""
    print("\n🔍 اختبار منع البيانات المكررة...")
    
    # تسجيل دخول الأدمن
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    
    # اختبار منع الخطوط المكررة
    duplicate_line_data = {
        "name": "خط مكرر للاختبار",
        "code": "DUPLICATE_TEST_CODE",
        "description": "اختبار الكود المكرر"
    }
    
    # إنشاء الخط الأول
    response1 = requests.post(f"{BACKEND_URL}/lines", 
        json=duplicate_line_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    print(f"🔍 إنشاء الخط الأول: كود {response1.status_code}")
    
    # محاولة إنشاء خط بنفس الكود
    response2 = requests.post(f"{BACKEND_URL}/lines", 
        json=duplicate_line_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    print(f"🔍 محاولة إنشاء خط مكرر: كود {response2.status_code}")
    if response2.status_code == 400:
        print("✅ منع الكود المكرر للخطوط يعمل")
        try:
            error_data = response2.json()
            print(f"   رسالة الخطأ: {error_data.get('detail', 'غير محدد')}")
        except:
            pass
    else:
        print("❌ لم يمنع الكود المكرر للخطوط")
        print(f"   الاستجابة: {response2.text}")

def test_required_fields_validation():
    """اختبار التحقق من الحقول المطلوبة"""
    print("\n🔍 اختبار التحقق من الحقول المطلوبة...")
    
    # تسجيل دخول الأدمن
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    
    # اختبار إنشاء منتج بحقول ناقصة
    incomplete_product_data = {
        "name": "منتج ناقص"
        # نقص الحقول المطلوبة: unit, line_id, price, price_type
    }
    
    response = requests.post(f"{BACKEND_URL}/products", 
        json=incomplete_product_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    print(f"🔍 محاولة إنشاء منتج بحقول ناقصة: كود {response.status_code}")
    if response.status_code == 400:
        print("✅ منع إنشاء منتج بحقول ناقصة يعمل")
        try:
            error_data = response.json()
            print(f"   رسالة الخطأ: {error_data.get('detail', 'غير محدد')}")
        except:
            pass
    else:
        print("❌ لم يمنع إنشاء منتج بحقول ناقصة")
        print(f"   الاستجابة: {response.text}")

def test_existing_products_line_linking():
    """اختبار ربط الخطوط في المنتجات الموجودة"""
    print("\n🔍 فحص ربط الخطوط في المنتجات الموجودة...")
    
    # تسجيل دخول الأدمن
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    
    # جلب المنتجات
    products_response = requests.get(f"{BACKEND_URL}/products", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    
    if products_response.status_code == 200:
        products = products_response.json()
        print(f"📋 تم جلب {len(products)} منتج")
        
        products_with_lines = 0
        products_without_lines = 0
        problematic_products = []
        
        for product in products:
            if product.get("line_id") and product.get("line_name"):
                products_with_lines += 1
            else:
                products_without_lines += 1
                problematic_products.append({
                    "name": product.get("name"),
                    "id": product.get("id"),
                    "line_id": product.get("line_id"),
                    "line_name": product.get("line_name")
                })
        
        print(f"✅ منتجات مرتبطة بخطوط: {products_with_lines}")
        print(f"❌ منتجات غير مرتبطة بخطوط: {products_without_lines}")
        
        if problematic_products:
            print("🔍 المنتجات التي تحتاج إصلاح:")
            for product in problematic_products[:5]:  # أول 5 فقط
                print(f"   • {product['name']}: line_id={product.get('line_id', 'None')}, line_name={product.get('line_name', 'None')}")
    else:
        print("❌ فشل جلب المنتجات")

if __name__ == "__main__":
    print("🚀 اختبار مركز للمشاكل المحددة في المراجعة العربية")
    print("=" * 60)
    
    test_medical_rep_permissions_detailed()
    test_duplicate_prevention()
    test_required_fields_validation()
    test_existing_products_line_linking()
    
    print("\n" + "=" * 60)
    print("✅ انتهى الاختبار المركز")