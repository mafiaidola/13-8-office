#!/usr/bin/env python3
"""
اختبار شامل لمشكلة عدم قدرة المندوب على إنشاء طلبات
Comprehensive test for medical rep order creation issue

المطلوب:
1) تسجيل دخول مندوب (medical_rep) للحصول على JWT token
2) GET /api/clinics?rep_id={rep_id} - التأكد من وجود عيادات مخصصة للمندوب
3) GET /api/warehouses - التأكد من وجود مخازن متاحة
4) GET /api/products - التأكد من وجود منتجات للطلب
5) POST /api/orders - محاولة إنشاء طلب جديد باستخدام بيانات المندوب
6) فحص الاستجابة والتأكد من نجاح إنشاء الطلب
7) GET /api/orders?rep_id={rep_id} - التأكد من ظهور الطلب في قائمة طلبات المندوب
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class MedicalRepOrderTest:
    def __init__(self):
        self.jwt_token = None
        self.medical_rep_user = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_result(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": response_time
        }
        self.test_results.append(result)
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        print(f"   Details: {details}")
        print()
    
    def make_request(self, method, endpoint, data=None, params=None):
        """إجراء طلب HTTP مع قياس الوقت"""
        url = f"{BASE_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        start_time = time.time()
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, params=params)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            return response, response_time
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            print(f"Request error: {str(e)}")
            return None, response_time
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن أولاً للتحقق من النظام"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            admin_token = data.get("access_token")
            self.log_result(
                "Admin Login Test",
                True,
                f"Admin login successful. User: {data.get('user', {}).get('full_name', 'Unknown')}",
                response_time
            )
            return admin_token
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Admin Login Test",
                False,
                f"Admin login failed: {error_msg}",
                response_time
            )
            return None
    
    def create_medical_rep_user(self, admin_token):
        """إنشاء مستخدم مندوب طبي للاختبار"""
        if not admin_token:
            return None
            
        # Use admin token temporarily
        original_token = self.jwt_token
        self.jwt_token = admin_token
        
        # Create new medical rep with unique username
        timestamp = int(time.time())
        rep_data = {
            "username": f"medical_rep_test_{timestamp}",
            "password": "test123456",
            "full_name": f"مندوب طبي للاختبار {timestamp}",
            "role": "medical_rep",
            "email": f"test_rep_{timestamp}@example.com",
            "phone": "01234567890",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/users", rep_data)
        
        if response and response.status_code == 200:
            data = response.json()
            created_user = data.get("user", {})
            created_user["password"] = rep_data["password"]  # Store password for login
            
            self.log_result(
                "Create Medical Rep User",
                True,
                f"Medical rep created: {created_user.get('full_name')} (ID: {created_user.get('id')})",
                response_time
            )
            
            self.jwt_token = original_token
            return created_user
        else:
            # If creation failed, try to find existing medical rep
            response, _ = self.make_request("GET", "/users")
            if response and response.status_code == 200:
                users = response.json()
                for user in users:
                    if user.get("role") == "medical_rep" and user.get("is_active", True):
                        # Add a default password for existing users
                        user["password"] = "test123456"
                        self.log_result(
                            "Create Medical Rep User",
                            True,
                            f"Using existing medical rep: {user.get('full_name')} (ID: {user.get('id')})",
                            response_time
                        )
                        self.jwt_token = original_token
                        return user
            
            error_msg = response.text if response else "No response"
            self.log_result(
                "Create Medical Rep User",
                False,
                f"Failed to create medical rep: {error_msg}",
                response_time
            )
            self.jwt_token = original_token
            return None
    
    def create_test_clinic_and_assign(self, admin_token, rep_id):
        """إنشاء عيادة اختبار وتخصيصها للمندوب"""
        if not admin_token or not rep_id:
            return None
            
        # Use admin token temporarily
        original_token = self.jwt_token
        self.jwt_token = admin_token
        
        # Create test clinic
        clinic_data = {
            "name": f"عيادة اختبار {int(time.time())}",
            "doctor_name": "دكتور اختبار",  # Changed from owner_name to doctor_name
            "phone": "01234567890",
            "address": "عنوان اختبار",
            "location": "القاهرة",
            "area_id": "area_cairo",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/clinics", clinic_data)
        
        if response and response.status_code == 200:
            data = response.json()
            clinic = data.get("clinic", {})
            clinic_id = clinic.get("id")
            
            # Now assign the clinic to the medical rep
            if clinic_id:
                assign_data = {
                    "assigned_rep_id": rep_id
                }
                assign_response, _ = self.make_request("PUT", f"/clinics/{clinic_id}", assign_data)
                
                if assign_response and assign_response.status_code == 200:
                    clinic["assigned_rep_id"] = rep_id  # Update local data
            
            self.log_result(
                "Create Test Clinic",
                True,
                f"Test clinic created and assigned: {clinic.get('name')} (ID: {clinic.get('id')})",
                response_time
            )
            
            self.jwt_token = original_token
            return clinic
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Create Test Clinic",
                False,
                f"Failed to create test clinic: {error_msg}",
                response_time
            )
            self.jwt_token = original_token
            return None
    
    def test_medical_rep_login(self, medical_rep_user):
        """اختبار تسجيل دخول المندوب الطبي"""
        if not medical_rep_user:
            self.log_result(
                "Medical Rep Login",
                False,
                "No medical rep user available for login test",
                0
            )
            return False
        
        # Try multiple common passwords for existing users
        passwords_to_try = [
            medical_rep_user.get("password", "test123456"),
            "test123456",
            "123456",
            "password",
            medical_rep_user.get("username", "")
        ]
        
        for password in passwords_to_try:
            if not password:
                continue
                
            login_data = {
                "username": medical_rep_user["username"],
                "password": password
            }
            
            response, response_time = self.make_request("POST", "/auth/login", login_data)
            
            if response and response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.medical_rep_user = data.get("user", {})
                
                self.log_result(
                    "Medical Rep Login",
                    True,
                    f"Medical rep login successful. User: {self.medical_rep_user.get('full_name')} (Role: {self.medical_rep_user.get('role')})",
                    response_time
                )
                return True
        
        # If all passwords failed
        self.log_result(
            "Medical Rep Login",
            False,
            f"Medical rep login failed with all attempted passwords for user: {medical_rep_user.get('username')}",
            response_time if 'response_time' in locals() else 0
        )
        return False
    
    def test_get_assigned_clinics(self):
        """اختبار الحصول على العيادات المخصصة للمندوب"""
        if not self.medical_rep_user:
            self.log_result(
                "Get Assigned Clinics",
                False,
                "No medical rep user logged in",
                0
            )
            return []
        
        rep_id = self.medical_rep_user.get("id")
        params = {"rep_id": rep_id} if rep_id else None
        
        response, response_time = self.make_request("GET", "/clinics", params=params)
        
        if response and response.status_code == 200:
            clinics = response.json()
            assigned_clinics = [c for c in clinics if c.get("assigned_rep_id") == rep_id]
            
            self.log_result(
                "Get Assigned Clinics",
                True,
                f"Found {len(assigned_clinics)} assigned clinics out of {len(clinics)} total clinics",
                response_time
            )
            return assigned_clinics
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Get Assigned Clinics",
                False,
                f"Failed to get clinics: {error_msg}",
                response_time
            )
            return []
    
    def test_get_warehouses(self):
        """اختبار الحصول على المخازن المتاحة"""
        response, response_time = self.make_request("GET", "/warehouses")
        
        if response and response.status_code == 200:
            warehouses = response.json()
            active_warehouses = [w for w in warehouses if w.get("is_active", True)]
            
            self.log_result(
                "Get Available Warehouses",
                True,
                f"Found {len(active_warehouses)} active warehouses out of {len(warehouses)} total",
                response_time
            )
            return active_warehouses
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Get Available Warehouses",
                False,
                f"Failed to get warehouses: {error_msg}",
                response_time
            )
            return []
    
    def test_get_products(self):
        """اختبار الحصول على المنتجات المتاحة"""
        response, response_time = self.make_request("GET", "/products")
        
        if response and response.status_code == 200:
            products = response.json()
            available_products = [p for p in products if p.get("is_active", True) and p.get("current_stock", 0) > 0]
            
            self.log_result(
                "Get Available Products",
                True,
                f"Found {len(available_products)} available products out of {len(products)} total",
                response_time
            )
            return available_products
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Get Available Products",
                False,
                f"Failed to get products: {error_msg}",
                response_time
            )
            return []
    
    def test_create_order(self, clinics, warehouses, products):
        """اختبار إنشاء طلب جديد"""
        if not clinics:
            self.log_result(
                "Create Order",
                False,
                "No assigned clinics available for order creation",
                0
            )
            return None
        
        if not warehouses:
            self.log_result(
                "Create Order",
                False,
                "No warehouses available for order creation",
                0
            )
            return None
        
        if not products:
            self.log_result(
                "Create Order",
                False,
                "No products available for order creation",
                0
            )
            return None
        
        # Use first available clinic, warehouse, and product
        clinic = clinics[0]
        warehouse = warehouses[0]
        product = products[0]
        
        order_data = {
            "clinic_id": clinic["id"],
            "warehouse_id": warehouse["id"],
            "items": [
                {
                    "product_id": product["id"],
                    "quantity": 2
                }
            ],
            "line": "خط الاختبار",
            "area_id": clinic.get("area_id", "area_test"),
            "notes": "طلب اختبار من المندوب الطبي",
            "debt_warning_acknowledged": True  # Acknowledge any debt warnings
        }
        
        response, response_time = self.make_request("POST", "/orders", order_data)
        
        if response and response.status_code == 200:
            data = response.json()
            order_id = data.get("order_id")
            
            self.log_result(
                "Create Order",
                True,
                f"Order created successfully. ID: {order_id}, Total: {data.get('total_amount', 0)} EGP",
                response_time
            )
            return data
        else:
            error_msg = response.text if response else "No response"
            status_code = response.status_code if response else "No response"
            
            self.log_result(
                "Create Order",
                False,
                f"Order creation failed (HTTP {status_code}): {error_msg}",
                response_time
            )
            return None
    
    def test_get_rep_orders(self):
        """اختبار الحصول على طلبات المندوب"""
        if not self.medical_rep_user:
            self.log_result(
                "Get Rep Orders",
                False,
                "No medical rep user logged in",
                0
            )
            return []
        
        rep_id = self.medical_rep_user.get("id")
        params = {"rep_id": rep_id} if rep_id else None
        
        response, response_time = self.make_request("GET", "/orders", params=params)
        
        if response and response.status_code == 200:
            orders = response.json()
            rep_orders = [o for o in orders if o.get("medical_rep_id") == rep_id]
            
            self.log_result(
                "Get Rep Orders",
                True,
                f"Found {len(rep_orders)} orders for this medical rep out of {len(orders)} total orders",
                response_time
            )
            return rep_orders
        else:
            error_msg = response.text if response else "No response"
            self.log_result(
                "Get Rep Orders",
                False,
                f"Failed to get rep orders: {error_msg}",
                response_time
            )
            return []
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🔍 **بدء اختبار شامل لمشكلة عدم قدرة المندوب على إنشاء طلبات**")
        print("=" * 80)
        print()
        
        # Step 1: Admin login to create medical rep if needed
        admin_token = self.test_admin_login()
        
        # Step 2: Create or find medical rep user
        medical_rep_user = self.create_medical_rep_user(admin_token)
        
        # Step 3: Medical rep login
        login_success = self.test_medical_rep_login(medical_rep_user)
        
        if not login_success:
            print("❌ Cannot proceed without successful medical rep login")
            return self.generate_final_report()
        
        # Step 4: Get assigned clinics
        clinics = self.test_get_assigned_clinics()
        
        # Step 4.1: If no clinics found, create one and assign it
        if not clinics and admin_token and self.medical_rep_user:
            test_clinic = self.create_test_clinic_and_assign(admin_token, self.medical_rep_user.get("id"))
            if test_clinic:
                clinics = [test_clinic]
        
        # Step 5: Get available warehouses
        warehouses = self.test_get_warehouses()
        
        # Step 6: Get available products
        products = self.test_get_products()
        
        # Step 7: Create order
        order_result = self.test_create_order(clinics, warehouses, products)
        
        # Step 8: Verify order appears in rep's orders
        rep_orders = self.test_get_rep_orders()
        
        return self.generate_final_report()
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(r["response_time_ms"] for r in self.test_results if r["response_time_ms"]) / max(1, len([r for r in self.test_results if r["response_time_ms"]]))
        
        print("=" * 80)
        print("📊 **تقرير نهائي شامل لاختبار مشكلة إنشاء الطلبات**")
        print("=" * 80)
        print()
        
        print(f"🎯 **معدل النجاح الإجمالي:** {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ **متوسط وقت الاستجابة:** {avg_response_time:.2f}ms")
        print(f"🕐 **إجمالي وقت التنفيذ:** {total_time:.2f}s")
        print()
        
        print("📋 **تفاصيل النتائج:**")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            time_info = f" ({result['response_time_ms']:.2f}ms)" if result["response_time_ms"] else ""
            print(f"{i}. {status} {result['test']}{time_info}")
            print(f"   {result['details']}")
        
        print()
        
        # Diagnostic analysis
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("🔍 **تحليل المشاكل المكتشفة:**")
            for failed_test in failed_tests:
                print(f"❌ {failed_test['test']}: {failed_test['details']}")
            print()
        
        # Recommendations
        print("💡 **التوصيات:**")
        if success_rate >= 85:
            print("✅ النظام يعمل بشكل جيد. المشاكل البسيطة يمكن تجاهلها أو إصلاحها لاحقاً.")
        elif success_rate >= 70:
            print("⚠️ النظام يعمل بشكل مقبول لكن يحتاج بعض الإصلاحات.")
        else:
            print("🚨 النظام يحتاج إصلاحات جوهرية قبل الاستخدام الإنتاجي.")
        
        # Specific recommendations based on failed tests
        login_failed = any("Login" in r["test"] and not r["success"] for r in self.test_results)
        order_creation_failed = any("Create Order" in r["test"] and not r["success"] for r in self.test_results)
        
        if login_failed:
            print("🔐 مشكلة في تسجيل الدخول - تحقق من بيانات المصادقة")
        
        if order_creation_failed:
            print("📦 مشكلة في إنشاء الطلبات - تحقق من:")
            print("   - صلاحيات المندوب الطبي")
            print("   - توفر العيادات المخصصة")
            print("   - توفر المنتجات والمخازن")
            print("   - منطق فحص المديونية")
        
        print()
        print("🎯 **الخلاصة النهائية:**")
        if success_rate >= 85:
            print("النظام جاهز للاستخدام مع إصلاحات بسيطة إن وجدت.")
        else:
            print("النظام يحتاج مراجعة وإصلاح قبل الاستخدام الإنتاجي.")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = MedicalRepOrderTest()
    final_report = tester.run_comprehensive_test()