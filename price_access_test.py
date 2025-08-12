#!/usr/bin/env python3
"""
اختبار مخصص لإخفاء الأسعار
Custom Price Access Control Test
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "https://medmanage-pro-1.preview.emergentagent.com/api"
TIMEOUT = 30

def test_price_access_control():
    """اختبار التحكم في الوصول للأسعار"""
    session = requests.Session()
    
    # Login as admin
    print("🔐 تسجيل دخول الأدمن...")
    admin_login = session.post(
        f"{BASE_URL}/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=TIMEOUT
    )
    
    if admin_login.status_code != 200:
        print(f"❌ فشل تسجيل دخول الأدمن: {admin_login.text}")
        return False
    
    admin_token = admin_login.json()["access_token"]
    print("✅ تم تسجيل دخول الأدمن بنجاح")
    
    # Create a sales rep user
    print("\n👤 إنشاء مندوب مبيعات...")
    sales_rep_data = {
        "username": f"test_sales_rep_{uuid.uuid4().hex[:8]}",
        "password": "test123",
        "full_name": "مندوب اختبار",
        "role": "medical_rep",
        "email": "test@example.com",
        "phone": "01234567890"
    }
    
    create_user_response = session.post(
        f"{BASE_URL}/users",
        json=sales_rep_data,
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=TIMEOUT
    )
    
    if create_user_response.status_code not in [200, 201]:
        print(f"❌ فشل إنشاء مندوب المبيعات: {create_user_response.text}")
        return False
    
    print(f"✅ تم إنشاء مندوب المبيعات: {sales_rep_data['username']}")
    
    # Login as sales rep
    print("\n🔐 تسجيل دخول مندوب المبيعات...")
    sales_rep_login = session.post(
        f"{BASE_URL}/auth/login",
        json={"username": sales_rep_data["username"], "password": sales_rep_data["password"]},
        timeout=TIMEOUT
    )
    
    if sales_rep_login.status_code != 200:
        print(f"❌ فشل تسجيل دخول مندوب المبيعات: {sales_rep_login.text}")
        return False
    
    sales_rep_token = sales_rep_login.json()["access_token"]
    print("✅ تم تسجيل دخول مندوب المبيعات بنجاح")
    
    # Test admin access to products
    print("\n🔍 اختبار وصول الأدمن للمنتجات...")
    admin_products_response = session.get(
        f"{BASE_URL}/products",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=TIMEOUT
    )
    
    if admin_products_response.status_code == 200:
        admin_products = admin_products_response.json()
        admin_can_see_prices = False
        
        print(f"📊 الأدمن يرى {len(admin_products)} منتج")
        
        for product in admin_products[:3]:  # Check first 3 products
            print(f"   - {product.get('name', 'Unknown')}: price={product.get('price', 'N/A')}")
            if "price" in product and product["price"] is not None:
                admin_can_see_prices = True
        
        print(f"✅ الأدمن يمكنه رؤية الأسعار: {admin_can_see_prices}")
    else:
        print(f"❌ فشل الحصول على المنتجات للأدمن: {admin_products_response.text}")
        return False
    
    # Test sales rep access to products
    print("\n🔍 اختبار وصول مندوب المبيعات للمنتجات...")
    sales_rep_products_response = session.get(
        f"{BASE_URL}/products",
        headers={"Authorization": f"Bearer {sales_rep_token}"},
        timeout=TIMEOUT
    )
    
    if sales_rep_products_response.status_code == 200:
        sales_rep_products = sales_rep_products_response.json()
        sales_rep_can_see_prices = False
        
        print(f"📊 مندوب المبيعات يرى {len(sales_rep_products)} منتج")
        
        for product in sales_rep_products[:3]:  # Check first 3 products
            print(f"   - {product.get('name', 'Unknown')}: price={product.get('price', 'N/A')}")
            if "price" in product and product["price"] is not None:
                sales_rep_can_see_prices = True
        
        print(f"✅ مندوب المبيعات يمكنه رؤية الأسعار: {sales_rep_can_see_prices}")
        
        # Check if prices are properly hidden
        if not sales_rep_can_see_prices:
            print("🎉 إخفاء الأسعار يعمل بشكل صحيح!")
            return True
        else:
            print("❌ إخفاء الأسعار لا يعمل - مندوب المبيعات يمكنه رؤية الأسعار")
            return False
    else:
        print(f"❌ فشل الحصول على المنتجات لمندوب المبيعات: {sales_rep_products_response.text}")
        return False

if __name__ == "__main__":
    print("🧪 اختبار مخصص لإخفاء الأسعار")
    print("=" * 50)
    
    success = test_price_access_control()
    
    if success:
        print("\n🎉 الاختبار نجح!")
    else:
        print("\n💥 الاختبار فشل!")