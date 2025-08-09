#!/usr/bin/env python3
"""
اختبار المندوب الطبي الموجود في النظام
Test existing medical rep in the system
"""

import requests
import json

BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com/api"

def test_existing_medical_rep():
    """اختبار المندوب الطبي الموجود"""
    print("🔍 اختبار المندوب الطبي الموجود في النظام...")
    
    # تسجيل دخول الأدمن
    admin_response = requests.post(f"{BACKEND_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    
    if admin_response.status_code != 200:
        print("❌ فشل تسجيل دخول الأدمن")
        return
    
    admin_token = admin_response.json().get("access_token")
    
    # جلب جميع المستخدمين
    users_response = requests.get(f"{BACKEND_URL}/users", headers={
        "Authorization": f"Bearer {admin_token}"
    })
    
    if users_response.status_code == 200:
        users = users_response.json()
        medical_reps = [user for user in users if user.get("role") == "medical_rep"]
        
        print(f"📋 تم العثور على {len(medical_reps)} مندوب طبي")
        
        if medical_reps:
            # عرض أول 3 مناديب
            for i, rep in enumerate(medical_reps[:3]):
                print(f"   {i+1}. {rep.get('username')} - {rep.get('full_name')}")
            
            # إنشاء مندوب طبي جديد بكلمة مرور معروفة للاختبار
            new_rep_data = {
                "username": f"test_medical_rep_{int(time.time())}",
                "password": "test123",
                "full_name": "مندوب طبي للاختبار",
                "role": "medical_rep",
                "email": "testrep@example.com",
                "phone": "01234567890",
                "is_active": True
            }
            
            create_response = requests.post(f"{BACKEND_URL}/users", 
                json=new_rep_data,
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            
            if create_response.status_code == 200:
                print(f"✅ تم إنشاء مندوب طبي جديد: {new_rep_data['username']}")
                
                # تسجيل دخول المندوب الجديد
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": new_rep_data["username"],
                    "password": new_rep_data["password"]
                })
                
                if login_response.status_code == 200:
                    rep_token = login_response.json().get("access_token")
                    print("✅ تسجيل دخول المندوب نجح")
                    
                    # اختبار الصلاحيات
                    test_rep_permissions(rep_token)
                else:
                    print("❌ فشل تسجيل دخول المندوب")
            else:
                print("❌ فشل إنشاء مندوب طبي جديد")
                print(f"   الاستجابة: {create_response.text}")
        else:
            print("❌ لم يتم العثور على مناديب طبيين")
    else:
        print("❌ فشل جلب المستخدمين")

def test_rep_permissions(rep_token):
    """اختبار صلاحيات المندوب الطبي"""
    print("\n🔐 اختبار صلاحيات المندوب الطبي:")
    
    # 1. اختبار عرض المنتجات (يجب أن يرى المنتجات بدون أسعار)
    products_response = requests.get(f"{BACKEND_URL}/products", headers={
        "Authorization": f"Bearer {rep_token}"
    })
    
    if products_response.status_code == 200:
        products = products_response.json()
        if products:
            first_product = products[0]
            has_price = "price" in first_product
            print(f"   📦 عرض المنتجات: ✅ نجح ({len(products)} منتج)")
            if has_price:
                print(f"   💰 الأسعار: ❌ ظاهرة (يجب إخفاؤها)")
            else:
                print(f"   💰 الأسعار: ✅ مخفية (صحيح)")
        else:
            print("   📦 عرض المنتجات: ⚠️ لا توجد منتجات")
    else:
        print(f"   📦 عرض المنتجات: ❌ فشل (كود {products_response.status_code})")
    
    # 2. اختبار محاولة إنشاء منتج (يجب أن يُمنع)
    product_data = {
        "name": "منتج من مندوب طبي",
        "unit": "علبة",
        "line_id": "test",
        "price": 100.0,
        "price_type": "per_box"
    }
    
    create_product_response = requests.post(f"{BACKEND_URL}/products", 
        json=product_data,
        headers={"Authorization": f"Bearer {rep_token}"}
    )
    
    if create_product_response.status_code == 403:
        print("   🚫 إنشاء منتجات: ✅ محظور (صحيح)")
    else:
        print(f"   🚫 إنشاء منتجات: ❌ مسموح (خطأ) - كود {create_product_response.status_code}")
    
    # 3. اختبار محاولة إنشاء خط (يجب أن يُمنع)
    line_data = {
        "name": "خط من مندوب طبي",
        "code": "MR_LINE_TEST",
        "description": "خط من مندوب طبي"
    }
    
    create_line_response = requests.post(f"{BACKEND_URL}/lines", 
        json=line_data,
        headers={"Authorization": f"Bearer {rep_token}"}
    )
    
    if create_line_response.status_code == 403:
        print("   🚫 إنشاء خطوط: ✅ محظور (صحيح)")
    else:
        print(f"   🚫 إنشاء خطوط: ❌ مسموح (خطأ) - كود {create_line_response.status_code}")
    
    # 4. اختبار محاولة إنشاء منطقة (يجب أن يُمنع)
    area_data = {
        "name": "منطقة من مندوب طبي",
        "code": "MR_AREA_TEST",
        "description": "منطقة من مندوب طبي"
    }
    
    create_area_response = requests.post(f"{BACKEND_URL}/areas", 
        json=area_data,
        headers={"Authorization": f"Bearer {rep_token}"}
    )
    
    if create_area_response.status_code == 403:
        print("   🚫 إنشاء مناطق: ✅ محظور (صحيح)")
    else:
        print(f"   🚫 إنشاء مناطق: ❌ مسموح (خطأ) - كود {create_area_response.status_code}")

if __name__ == "__main__":
    import time
    test_existing_medical_rep()