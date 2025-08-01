#!/usr/bin/env python3
"""
اختبار مبسط لإنشاء منتج
Simple Product Creation Test
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "https://4bd6a5b6-7d69-4d01-ab9e-6f0ddd678934.preview.emergentagent.com/api"
TIMEOUT = 30

def test_simple_product_creation():
    """اختبار إنشاء منتج بسيط"""
    session = requests.Session()
    
    # Login as admin
    print("🔐 تسجيل دخول الأدمن...")
    login_response = session.post(
        f"{BASE_URL}/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=TIMEOUT
    )
    
    if login_response.status_code != 200:
        print(f"❌ فشل تسجيل الدخول: {login_response.text}")
        return False
    
    token = login_response.json()["access_token"]
    session.headers.update({"Authorization": f"Bearer {token}"})
    print("✅ تم تسجيل الدخول بنجاح")
    
    # Get available lines
    print("\n📋 الحصول على الخطوط المتاحة...")
    lines_response = session.get(f"{BASE_URL}/lines", timeout=TIMEOUT)
    
    if lines_response.status_code != 200:
        print(f"❌ فشل الحصول على الخطوط: {lines_response.text}")
        return False
    
    lines = lines_response.json()
    if not lines:
        print("❌ لا توجد خطوط متاحة")
        return False
    
    selected_line = lines[0]
    print(f"✅ تم العثور على {len(lines)} خط. سيتم استخدام: {selected_line['name']}")
    
    # Create product with simple structure
    print("\n🆕 إنشاء منتج جديد...")
    product_data = {
        "name": f"منتج اختبار {uuid.uuid4().hex[:8]}",
        "description": "وصف المنتج التجريبي",
        "category": "أدوية",
        "unit": "ڤايل",
        "line_id": selected_line["id"],
        "price": 25.50,
        "price_type": "per_vial",
        "current_stock": 100,
        "is_active": True
    }
    
    print(f"📝 بيانات المنتج: {json.dumps(product_data, ensure_ascii=False, indent=2)}")
    
    create_response = session.post(
        f"{BASE_URL}/products",
        json=product_data,
        timeout=TIMEOUT
    )
    
    print(f"📊 استجابة الخادم: Status {create_response.status_code}")
    print(f"📄 محتوى الاستجابة: {create_response.text}")
    
    if create_response.status_code in [200, 201]:
        result = create_response.json()
        if result.get("success"):
            print("✅ تم إنشاء المنتج بنجاح!")
            return True
        else:
            print(f"❌ فشل إنشاء المنتج: {result}")
            return False
    else:
        print(f"❌ خطأ HTTP {create_response.status_code}: {create_response.text}")
        return False

if __name__ == "__main__":
    print("🧪 اختبار مبسط لإنشاء منتج")
    print("=" * 50)
    
    success = test_simple_product_creation()
    
    if success:
        print("\n🎉 الاختبار نجح!")
    else:
        print("\n💥 الاختبار فشل!")