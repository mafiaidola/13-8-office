#!/usr/bin/env python3
"""
اختبار تشخيص الأدوار
Role Diagnosis Test
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "https://d1397441-cae3-4bcf-ad67-36c0ba328d1b.preview.emergentagent.com/api"
TIMEOUT = 30

def test_role_diagnosis():
    """تشخيص الأدوار"""
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
    admin_user_info = admin_login.json()["user"]
    print(f"✅ تم تسجيل دخول الأدمن بنجاح. الدور: {admin_user_info.get('role')}")
    
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
    
    created_user = create_user_response.json()["user"]
    print(f"✅ تم إنشاء مندوب المبيعات: {sales_rep_data['username']}, الدور المحفوظ: {created_user.get('role')}")
    
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
    sales_rep_user_info = sales_rep_login.json()["user"]
    print(f"✅ تم تسجيل دخول مندوب المبيعات بنجاح. الدور عند تسجيل الدخول: {sales_rep_user_info.get('role')}")
    
    # Test current user endpoint to see what role is being used
    print("\n🔍 فحص معلومات المستخدم الحالي...")
    
    # Check admin current user
    admin_me_response = session.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
        timeout=TIMEOUT
    )
    
    if admin_me_response.status_code == 200:
        admin_me = admin_me_response.json()
        print(f"📊 معلومات الأدمن الحالي: {json.dumps(admin_me, ensure_ascii=False, indent=2)}")
    else:
        print(f"⚠️ لا يوجد endpoint /auth/me: {admin_me_response.status_code}")
    
    # Check sales rep current user
    sales_rep_me_response = session.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {sales_rep_token}"},
        timeout=TIMEOUT
    )
    
    if sales_rep_me_response.status_code == 200:
        sales_rep_me = sales_rep_me_response.json()
        print(f"📊 معلومات مندوب المبيعات الحالي: {json.dumps(sales_rep_me, ensure_ascii=False, indent=2)}")
    else:
        print(f"⚠️ لا يوجد endpoint /auth/me: {sales_rep_me_response.status_code}")
    
    return True

if __name__ == "__main__":
    print("🧪 اختبار تشخيص الأدوار")
    print("=" * 50)
    
    test_role_diagnosis()