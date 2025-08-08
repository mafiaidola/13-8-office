#!/usr/bin/env python3
"""
اختبار محدد لمشكلة warehouse products endpoint
التركيز على HTTP 500 error في GET /api/warehouses/{warehouse_id}/products
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://406a5bee-8cdb-4ba1-be7e-252147eebee8.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class WarehouseProductsEndpointTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status} | {test_name} | {result['response_time_ms']}ms | {details}")
        
    def login_admin(self):
        """تسجيل دخول الأدمن"""
        print("\n🔐 تسجيل دخول admin/admin123...")
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                user_info = data.get("user", {})
                details = f"User: {user_info.get('full_name', 'Unknown')} | Role: {user_info.get('role', 'Unknown')}"
                self.log_test("Admin Login", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Admin Login", False, response_time, f"Exception: {str(e)}")
            return False
    
    def get_warehouses(self):
        """الحصول على قائمة المخازن"""
        print("\n📦 اختبار GET /api/warehouses...")
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                
                details = f"Found {warehouse_count} warehouses"
                if warehouse_count > 0:
                    first_warehouse = warehouses[0]
                    warehouse_id = first_warehouse.get('id', 'Unknown')
                    warehouse_name = first_warehouse.get('name', 'Unknown')
                    details += f" | First: {warehouse_name} (ID: {warehouse_id})"
                
                self.log_test("GET Warehouses", True, response_time, details)
                return warehouses if warehouse_count > 0 else []
            else:
                self.log_test("GET Warehouses", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET Warehouses", False, response_time, f"Exception: {str(e)}")
            return []
    
    def test_warehouse_products(self, warehouse_id, warehouse_name):
        """اختبار GET /api/warehouses/{warehouse_id}/products - المشكلة الأساسية"""
        print(f"\n🔍 اختبار GET /api/warehouses/{warehouse_id}/products...")
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products", timeout=10)
            response_time = time.time() - start_time
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    products = response.json()
                    product_count = len(products) if isinstance(products, list) else 0
                    details = f"Warehouse: {warehouse_name} | Products: {product_count}"
                    
                    if product_count > 0:
                        sample_product = products[0]
                        product_name = sample_product.get('name', 'Unknown')
                        details += f" | Sample: {product_name}"
                    
                    self.log_test("GET Warehouse Products", True, response_time, details)
                    return True
                except json.JSONDecodeError as e:
                    details = f"JSON Decode Error: {str(e)} | Raw response: {response.text[:200]}"
                    self.log_test("GET Warehouse Products", False, response_time, details)
                    return False
            else:
                # This is the main issue we're investigating
                error_details = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_details += f" | Raw response: {response.text[:200]}"
                
                print(f"🚨 HTTP 500 ERROR DETAILS:")
                print(f"   Warehouse ID: {warehouse_id}")
                print(f"   Warehouse Name: {warehouse_name}")
                print(f"   Response: {response.text}")
                
                self.log_test("GET Warehouse Products", False, response_time, error_details)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            error_details = f"Exception: {str(e)}"
            print(f"🚨 EXCEPTION DETAILS: {error_details}")
            self.log_test("GET Warehouse Products", False, response_time, error_details)
            return False
    
    def test_warehouse_update(self, warehouse_id, warehouse_name):
        """اختبار PUT /api/warehouses/{warehouse_id}"""
        print(f"\n✏️ اختبار PUT /api/warehouses/{warehouse_id}...")
        
        start_time = time.time()
        try:
            # Test data for warehouse update
            update_data = {
                "name": warehouse_name,
                "location": "Updated Location - Test",
                "manager_name": "Test Manager",
                "is_active": True
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/warehouses/{warehouse_id}",
                json=update_data,
                timeout=10
            )
            response_time = time.time() - start_time
            
            print(f"📊 Update Response Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    details = f"Warehouse: {warehouse_name} | Update successful"
                    if result.get('message'):
                        details += f" | Message: {result['message']}"
                    
                    self.log_test("PUT Warehouse Update", True, response_time, details)
                    return True
                except json.JSONDecodeError:
                    details = f"Update successful but JSON decode error | Raw: {response.text[:100]}"
                    self.log_test("PUT Warehouse Update", True, response_time, details)
                    return True
            else:
                error_details = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    error_details += f" | Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_details += f" | Raw response: {response.text[:200]}"
                
                print(f"🚨 UPDATE ERROR DETAILS:")
                print(f"   Warehouse ID: {warehouse_id}")
                print(f"   Response: {response.text}")
                
                self.log_test("PUT Warehouse Update", False, response_time, error_details)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            error_details = f"Exception: {str(e)}"
            print(f"🚨 UPDATE EXCEPTION: {error_details}")
            self.log_test("PUT Warehouse Update", False, response_time, error_details)
            return False
    
    def run_focused_test(self):
        """تشغيل الاختبار المُركز على مشكلة warehouse products endpoint"""
        print("🎯 بدء اختبار محدد لمشكلة warehouse products endpoint")
        print("=" * 80)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return
        
        # Step 2: Get warehouses
        warehouses = self.get_warehouses()
        if not warehouses:
            print("❌ لا توجد مخازن متاحة - توقف الاختبار")
            return
        
        # Step 3: Test the problematic endpoint for the first warehouse
        first_warehouse = warehouses[0]
        warehouse_id = first_warehouse.get('id')
        warehouse_name = first_warehouse.get('name', 'Unknown')
        
        print(f"\n🎯 التركيز على المخزن الأول:")
        print(f"   ID: {warehouse_id}")
        print(f"   Name: {warehouse_name}")
        
        # Test the main problematic endpoint
        products_success = self.test_warehouse_products(warehouse_id, warehouse_name)
        
        # Test warehouse update as well
        update_success = self.test_warehouse_update(warehouse_id, warehouse_name)
        
        # Summary
        self.print_summary()
        
        return products_success and update_success
    
    def print_summary(self):
        """طباعة ملخص النتائج"""
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار المحدد")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"⏱️ إجمالي الوقت: {total_time:.2f}s")
        print(f"📊 متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        print(f"\n✅ اختبارات ناجحة: {successful_tests}")
        print(f"❌ اختبارات فاشلة: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n🚨 الاختبارات الفاشلة:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   ❌ {result['test']}: {result['details']}")
        
        print(f"\n🎯 التركيز الأساسي: warehouse products endpoint")
        warehouse_products_test = next((r for r in self.test_results if "Warehouse Products" in r["test"]), None)
        if warehouse_products_test:
            if warehouse_products_test["success"]:
                print(f"   ✅ GET /api/warehouses/{{id}}/products يعمل بنجاح!")
            else:
                print(f"   ❌ GET /api/warehouses/{{id}}/products يفشل: {warehouse_products_test['details']}")
        
        warehouse_update_test = next((r for r in self.test_results if "Warehouse Update" in r["test"]), None)
        if warehouse_update_test:
            if warehouse_update_test["success"]:
                print(f"   ✅ PUT /api/warehouses/{{id}} يعمل بنجاح!")
            else:
                print(f"   ❌ PUT /api/warehouses/{{id}} يفشل: {warehouse_update_test['details']}")

def main():
    """تشغيل الاختبار المحدد"""
    tester = WarehouseProductsEndpointTester()
    success = tester.run_focused_test()
    
    if success:
        print(f"\n🎉 الاختبار المحدد مكتمل بنجاح!")
    else:
        print(f"\n⚠️ الاختبار المحدد اكتشف مشاكل تحتاج إصلاح")
    
    return success

if __name__ == "__main__":
    main()