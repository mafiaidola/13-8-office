#!/usr/bin/env python3
"""
تشخيص مفصل لمشكلة warehouse products endpoint HTTP 500
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://406a5bee-8cdb-4ba1-be7e-252147eebee8.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class DetailedWarehouseDiagnostic:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        
    def login_admin(self):
        """تسجيل دخول الأدمن"""
        print("🔐 تسجيل دخول admin/admin123...")
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                print(f"✅ تسجيل دخول ناجح - Token: {self.token[:20]}...")
                return True
            else:
                print(f"❌ فشل تسجيل الدخول: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ خطأ في تسجيل الدخول: {str(e)}")
            return False
    
    def test_auth_validation(self):
        """اختبار صحة المصادقة"""
        print("\n🔍 اختبار صحة المصادقة...")
        
        # Test with valid token
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            print(f"📊 GET /api/users with token: {response.status_code}")
            if response.status_code == 200:
                users = response.json()
                print(f"✅ المصادقة تعمل - عدد المستخدمين: {len(users)}")
            else:
                print(f"❌ مشكلة في المصادقة: {response.text}")
        except Exception as e:
            print(f"❌ خطأ في اختبار المصادقة: {str(e)}")
    
    def test_warehouse_endpoint_step_by_step(self):
        """اختبار warehouse products endpoint خطوة بخطوة"""
        print("\n🔍 اختبار warehouse products endpoint خطوة بخطوة...")
        
        # Step 1: Get warehouses first
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            print(f"📊 GET /api/warehouses: {response.status_code}")
            
            if response.status_code != 200:
                print(f"❌ فشل في الحصول على المخازن: {response.text}")
                return
            
            warehouses = response.json()
            print(f"✅ تم الحصول على {len(warehouses)} مخزن")
            
            if not warehouses:
                print("❌ لا توجد مخازن للاختبار")
                return
            
            # Step 2: Test the problematic endpoint with detailed debugging
            warehouse = warehouses[0]
            warehouse_id = warehouse.get('id')
            warehouse_name = warehouse.get('name', 'Unknown')
            
            print(f"\n🎯 اختبار المخزن: {warehouse_name} (ID: {warehouse_id})")
            
            # Test with different approaches
            self.test_warehouse_products_detailed(warehouse_id, warehouse_name)
            
        except Exception as e:
            print(f"❌ خطأ في اختبار المخازن: {str(e)}")
    
    def test_warehouse_products_detailed(self, warehouse_id, warehouse_name):
        """اختبار مفصل لـ warehouse products endpoint"""
        print(f"\n🔍 اختبار مفصل لـ GET /api/warehouses/{warehouse_id}/products...")
        
        # Test 1: Basic request
        try:
            print("📋 Test 1: Basic request...")
            response = self.session.get(
                f"{BACKEND_URL}/warehouses/{warehouse_id}/products",
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            print(f"   Content-Type: {response.headers.get('content-type', 'Unknown')}")
            print(f"   Content-Length: {response.headers.get('content-length', 'Unknown')}")
            
            if response.status_code == 500:
                print(f"   🚨 HTTP 500 Error Response: {response.text}")
                print(f"   🚨 Response encoding: {response.encoding}")
                
                # Try to get more details
                if response.text == "Internal Server Error":
                    print("   🚨 Generic internal server error - likely an unhandled exception")
                
        except requests.exceptions.Timeout:
            print("   ❌ Request timeout")
        except requests.exceptions.ConnectionError:
            print("   ❌ Connection error")
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
        
        # Test 2: Check if the warehouse exists
        try:
            print("\n📋 Test 2: Verify warehouse exists...")
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_exists = any(w.get('id') == warehouse_id for w in warehouses)
                print(f"   Warehouse exists: {warehouse_exists}")
                
                if warehouse_exists:
                    target_warehouse = next(w for w in warehouses if w.get('id') == warehouse_id)
                    print(f"   Warehouse details: {json.dumps(target_warehouse, indent=2, ensure_ascii=False)}")
                else:
                    print("   ❌ Warehouse not found in list!")
            
        except Exception as e:
            print(f"   ❌ Error checking warehouse: {str(e)}")
        
        # Test 3: Try with different headers
        try:
            print("\n📋 Test 3: Test with explicit headers...")
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            response = requests.get(
                f"{BACKEND_URL}/warehouses/{warehouse_id}/products",
                headers=headers,
                timeout=10
            )
            
            print(f"   Status with explicit headers: {response.status_code}")
            if response.status_code == 500:
                print(f"   Same error with explicit headers: {response.text}")
            
        except Exception as e:
            print(f"   ❌ Error with explicit headers: {str(e)}")
        
        # Test 4: Test a working endpoint for comparison
        try:
            print("\n📋 Test 4: Test working endpoint for comparison...")
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            print(f"   GET /api/users status: {response.status_code}")
            if response.status_code == 200:
                print("   ✅ Other endpoints work fine - issue is specific to warehouse products")
            else:
                print(f"   ❌ Other endpoints also failing: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Error testing comparison endpoint: {str(e)}")
    
    def run_diagnostic(self):
        """تشغيل التشخيص المفصل"""
        print("🔍 بدء التشخيص المفصل لمشكلة warehouse products endpoint")
        print("=" * 80)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - توقف التشخيص")
            return
        
        # Step 2: Test authentication
        self.test_auth_validation()
        
        # Step 3: Detailed warehouse endpoint testing
        self.test_warehouse_endpoint_step_by_step()
        
        print("\n" + "=" * 80)
        print("📊 خلاصة التشخيص")
        print("=" * 80)
        print("🎯 المشكلة: GET /api/warehouses/{warehouse_id}/products يعطي HTTP 500")
        print("🔍 السبب المحتمل: خطأ في الكود أو مشكلة في قاعدة البيانات")
        print("💡 التوصية: فحص logs الخادم أو إصلاح الكود")

def main():
    """تشغيل التشخيص المفصل"""
    diagnostic = DetailedWarehouseDiagnostic()
    diagnostic.run_diagnostic()

if __name__ == "__main__":
    main()