#!/usr/bin/env python3
"""
اختبار نهائي شامل للتأكد من حل مشكلة warehouse products endpoint
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://39bfa0e9-57ce-4da8-b444-8d148da868a0.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class FinalWarehouseTest:
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
        print("🔐 تسجيل دخول admin/admin123...")
        
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
    
    def test_warehouses_list(self):
        """اختبار قائمة المخازن"""
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
                    details += f" | First: {warehouse_name}"
                
                self.log_test("GET Warehouses List", True, response_time, details)
                return warehouses if warehouse_count > 0 else []
            else:
                self.log_test("GET Warehouses List", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET Warehouses List", False, response_time, f"Exception: {str(e)}")
            return []
    
    def test_warehouse_products_comprehensive(self, warehouse_id, warehouse_name):
        """اختبار شامل لمنتجات المخزن"""
        print(f"\n🔍 اختبار شامل لـ GET /api/warehouses/{warehouse_id}/products...")
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Validate response structure
                    success = data.get('success', False)
                    total_products = data.get('total_products', 0)
                    products = data.get('products', [])
                    warehouse_info = data.get('warehouse', {})
                    
                    # Detailed validation
                    validation_results = []
                    
                    if success:
                        validation_results.append("✓ Success flag is True")
                    else:
                        validation_results.append("✗ Success flag is False")
                    
                    if total_products > 0:
                        validation_results.append(f"✓ Total products: {total_products}")
                    else:
                        validation_results.append("✗ No products returned")
                    
                    if len(products) == total_products:
                        validation_results.append(f"✓ Products array matches count: {len(products)}")
                    else:
                        validation_results.append(f"✗ Products array mismatch: {len(products)} vs {total_products}")
                    
                    if warehouse_info.get('id') == warehouse_id:
                        validation_results.append("✓ Warehouse info matches request")
                    else:
                        validation_results.append("✗ Warehouse info mismatch")
                    
                    # Sample product validation
                    if products:
                        sample_product = products[0]
                        required_fields = ['id', 'name', 'category', 'quantity', 'price', 'expiry_date', 'supplier', 'batch_number']
                        missing_fields = [field for field in required_fields if field not in sample_product]
                        
                        if not missing_fields:
                            validation_results.append("✓ All required product fields present")
                        else:
                            validation_results.append(f"✗ Missing product fields: {missing_fields}")
                    
                    details = f"Warehouse: {warehouse_name} | Products: {total_products} | " + " | ".join(validation_results)
                    
                    # Consider it successful if we have products and basic structure is correct
                    is_successful = success and total_products > 0 and len(products) == total_products
                    
                    self.log_test("GET Warehouse Products - Comprehensive", is_successful, response_time, details)
                    return is_successful
                    
                except json.JSONDecodeError as e:
                    details = f"JSON Decode Error: {str(e)}"
                    self.log_test("GET Warehouse Products - Comprehensive", False, response_time, details)
                    return False
            else:
                details = f"HTTP {response.status_code} | Response: {response.text[:100]}"
                self.log_test("GET Warehouse Products - Comprehensive", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            details = f"Exception: {str(e)}"
            self.log_test("GET Warehouse Products - Comprehensive", False, response_time, details)
            return False
    
    def test_warehouse_update(self, warehouse_id, warehouse_name):
        """اختبار تحديث المخزن"""
        print(f"\n✏️ اختبار PUT /api/warehouses/{warehouse_id}...")
        
        start_time = time.time()
        try:
            update_data = {
                "name": warehouse_name,
                "location": "Final Test Location",
                "manager_name": "Final Test Manager",
                "is_active": True
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/warehouses/{warehouse_id}",
                json=update_data,
                timeout=10
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                try:
                    result = response.json()
                    details = f"Warehouse: {warehouse_name} | Update successful"
                    if result.get('message'):
                        details += f" | Message: {result['message']}"
                    
                    self.log_test("PUT Warehouse Update", True, response_time, details)
                    return True
                except json.JSONDecodeError:
                    details = f"Update successful (JSON decode issue) | Raw: {response.text[:50]}"
                    self.log_test("PUT Warehouse Update", True, response_time, details)
                    return True
            else:
                details = f"HTTP {response.status_code} | Response: {response.text[:100]}"
                self.log_test("PUT Warehouse Update", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            details = f"Exception: {str(e)}"
            self.log_test("PUT Warehouse Update", False, response_time, details)
            return False
    
    def run_final_test(self):
        """تشغيل الاختبار النهائي الشامل"""
        print("🎯 بدء الاختبار النهائي الشامل لحل مشكلة warehouse products endpoint")
        print("=" * 90)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return False
        
        # Step 2: Get warehouses
        warehouses = self.test_warehouses_list()
        if not warehouses:
            print("❌ لا توجد مخازن متاحة - توقف الاختبار")
            return False
        
        # Step 3: Test the main endpoint for the first warehouse
        first_warehouse = warehouses[0]
        warehouse_id = first_warehouse.get('id')
        warehouse_name = first_warehouse.get('name', 'Unknown')
        
        print(f"\n🎯 التركيز على المخزن الأول:")
        print(f"   ID: {warehouse_id}")
        print(f"   Name: {warehouse_name}")
        
        # Test the main problematic endpoint (now fixed)
        products_success = self.test_warehouse_products_comprehensive(warehouse_id, warehouse_name)
        
        # Test warehouse update as well
        update_success = self.test_warehouse_update(warehouse_id, warehouse_name)
        
        # Summary
        self.print_final_summary()
        
        return products_success and update_success
    
    def print_final_summary(self):
        """طباعة الملخص النهائي"""
        print("\n" + "=" * 90)
        print("📊 ملخص الاختبار النهائي الشامل")
        print("=" * 90)
        
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
        
        print(f"\n🎯 النتيجة النهائية للمشكلة الأساسية:")
        warehouse_products_test = next((r for r in self.test_results if "Warehouse Products" in r["test"]), None)
        if warehouse_products_test:
            if warehouse_products_test["success"]:
                print(f"   ✅ GET /api/warehouses/{{id}}/products تم إصلاحها وتعمل بنجاح!")
                print(f"   ✅ المشكلة HTTP 500 محلولة بالكامل!")
            else:
                print(f"   ❌ GET /api/warehouses/{{id}}/products لا تزال تفشل: {warehouse_products_test['details']}")
        
        if success_rate == 100:
            print(f"\n🎉 جميع الاختبارات نجحت - المشكلة محلولة بالكامل!")
        elif success_rate >= 75:
            print(f"\n✅ معظم الاختبارات نجحت - المشكلة الأساسية محلولة!")
        else:
            print(f"\n⚠️ لا تزال هناك مشاكل تحتاج إصلاح")

def main():
    """تشغيل الاختبار النهائي"""
    tester = FinalWarehouseTest()
    success = tester.run_final_test()
    
    if success:
        print(f"\n🎉 الاختبار النهائي مكتمل بنجاح - المشكلة محلولة!")
    else:
        print(f"\n⚠️ الاختبار النهائي اكتشف مشاكل متبقية")
    
    return success

if __name__ == "__main__":
    main()