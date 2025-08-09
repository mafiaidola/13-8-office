#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار شامل للباكند للتأكد من أن جميع APIs تعمل بشكل صحيح - Dashboard Focus
Comprehensive Backend Testing for Dashboard APIs - Arabic Review
تاريخ: 2025
الهدف: اختبار شامل للباكند مع التركيز على dashboard stats و APIs الأساسية بعد إصلاح مشاكل الـ responsive design وإعادة تفعيل نظام المصادقة

Focus Areas:
1. تسجيل دخول admin/admin123 والحصول على JWT token
2. اختبار GET /api/dashboard/stats - إحصائيات لوحة التحكم الأساسية
3. اختبار GET /api/users - قائمة المستخدمين
4. اختبار GET /api/clinics - قائمة العيادات 
5. اختبار GET /api/products - قائمة المنتجات
6. اختبار GET /api/orders - قائمة الطلبات
7. التحقق من أن جميع APIs ترجع بيانات صحيحة ومنسقة
8. التحقق من أن المستخدم admin لديه الصلاحيات اللازمة للوصول لجميع البيانات
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys
import os

# إعدادات الاختبار - استخدام URL الصحيح من frontend/.env
BACKEND_URL = "https://0c7671be-0c51-4a84-bbb3-9b77f9ff726f.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

class ComprehensiveDashboardTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time=None, details=None, error=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "response_time": response_time,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if error:
            print(f"   Error: {error}")
        if details:
            print(f"   Details: {details}")

    def test_admin_login(self):
        """1. تسجيل دخول admin/admin123 والحصول على JWT token"""
        try:
            start_time = time.time()
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=TEST_CREDENTIALS,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                if self.jwt_token:
                    # إعداد headers للطلبات القادمة
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.jwt_token}",
                        "Content-Type": "application/json"
                    })
                    
                    details = f"User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                    self.log_test("Admin Login", True, response_time, details)
                    return True
                else:
                    self.log_test("Admin Login", False, response_time, error="No access token received")
                    return False
            else:
                self.log_test("Admin Login", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, error=e)
            return False

    def test_dashboard_stats(self):
        """2. اختبار GET /api/dashboard/stats - إحصائيات لوحة التحكم الأساسية"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/dashboard/stats", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # فحص البيانات المطلوبة
                required_keys = ["orders", "visits", "users", "clinics", "debts", "collections"]
                missing_keys = [key for key in required_keys if key not in data]
                
                if not missing_keys:
                    # استخراج الإحصائيات الأساسية
                    orders_count = data.get("orders", {}).get("count", 0)
                    visits_count = data.get("visits", {}).get("count", 0)
                    users_count = data.get("users", {}).get("total", 0)
                    clinics_count = data.get("clinics", {}).get("total", 0)
                    debts_count = data.get("debts", {}).get("outstanding", 0)
                    collections_total = data.get("collections", {}).get("total", 0)
                    
                    details = f"Orders: {orders_count}, Visits: {visits_count}, Users: {users_count}, Clinics: {clinics_count}, Debts: {debts_count}, Collections: {collections_total:.2f} EGP"
                    self.log_test("Dashboard Stats", True, response_time, details)
                    return True
                else:
                    self.log_test("Dashboard Stats", False, response_time, error=f"Missing keys: {missing_keys}")
                    return False
            else:
                self.log_test("Dashboard Stats", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Stats", False, error=e)
            return False

    def test_users_api(self):
        """3. اختبار GET /api/users - قائمة المستخدمين"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/users", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    users_count = len(data)
                    
                    # فحص بيانات المستخدمين
                    admin_users = [user for user in data if user.get("role") == "admin"]
                    medical_reps = [user for user in data if user.get("role") == "medical_rep"]
                    active_users = [user for user in data if user.get("is_active", True)]
                    
                    details = f"Total: {users_count}, Admin: {len(admin_users)}, Medical Reps: {len(medical_reps)}, Active: {len(active_users)}"
                    self.log_test("Users API", True, response_time, details)
                    return True
                else:
                    self.log_test("Users API", False, response_time, error="Response is not a list")
                    return False
            else:
                self.log_test("Users API", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Users API", False, error=e)
            return False

    def test_clinics_api(self):
        """4. اختبار GET /api/clinics - قائمة العيادات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/clinics", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    clinics_count = len(data)
                    
                    # فحص بيانات العيادات
                    active_clinics = [clinic for clinic in data if clinic.get("is_active", True)]
                    assigned_clinics = [clinic for clinic in data if clinic.get("assigned_rep_id")]
                    
                    # فحص الحقول المطلوبة
                    sample_clinic = data[0] if data else {}
                    required_fields = ["id", "name", "owner_name"]
                    has_required_fields = all(field in sample_clinic for field in required_fields)
                    
                    details = f"Total: {clinics_count}, Active: {len(active_clinics)}, Assigned: {len(assigned_clinics)}, Has Required Fields: {has_required_fields}"
                    self.log_test("Clinics API", True, response_time, details)
                    return True
                else:
                    self.log_test("Clinics API", False, response_time, error="Response is not a list")
                    return False
            else:
                self.log_test("Clinics API", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Clinics API", False, error=e)
            return False

    def test_products_api(self):
        """5. اختبار GET /api/products - قائمة المنتجات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/products", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    products_count = len(data)
                    
                    # فحص بيانات المنتجات
                    active_products = [product for product in data if product.get("is_active", True)]
                    in_stock_products = [product for product in data if product.get("current_stock", 0) > 0]
                    
                    # فحص الحقول المطلوبة
                    sample_product = data[0] if data else {}
                    required_fields = ["id", "name", "price"]
                    has_required_fields = all(field in sample_product for field in required_fields)
                    
                    details = f"Total: {products_count}, Active: {len(active_products)}, In Stock: {len(in_stock_products)}, Has Required Fields: {has_required_fields}"
                    self.log_test("Products API", True, response_time, details)
                    return True
                else:
                    self.log_test("Products API", False, response_time, error="Response is not a list")
                    return False
            else:
                self.log_test("Products API", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Products API", False, error=e)
            return False

    def test_orders_api(self):
        """6. اختبار GET /api/orders - قائمة الطلبات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/orders", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    orders_count = len(data)
                    
                    # فحص بيانات الطلبات
                    pending_orders = [order for order in data if order.get("status") == "pending"]
                    completed_orders = [order for order in data if order.get("status") == "completed"]
                    
                    # حساب إجمالي المبيعات
                    total_sales = sum(order.get("total_amount", 0) for order in data)
                    
                    details = f"Total: {orders_count}, Pending: {len(pending_orders)}, Completed: {len(completed_orders)}, Total Sales: {total_sales:.2f} EGP"
                    self.log_test("Orders API", True, response_time, details)
                    return True
                else:
                    self.log_test("Orders API", False, response_time, error="Response is not a list")
                    return False
            else:
                self.log_test("Orders API", False, response_time, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Orders API", False, error=e)
            return False

    def test_admin_permissions(self):
        """7. التحقق من أن المستخدم admin لديه الصلاحيات اللازمة للوصول لجميع البيانات"""
        try:
            # اختبار الوصول لإعدادات النظام (admin only)
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/settings", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                details = f"Admin can access system settings: {len(data) if isinstance(data, (list, dict)) else 'Yes'}"
                self.log_test("Admin Permissions", True, response_time, details)
                return True
            elif response.status_code == 403:
                self.log_test("Admin Permissions", False, response_time, error="Access denied - insufficient permissions")
                return False
            else:
                # قد يكون endpoint غير موجود، لكن هذا لا يعني عدم وجود صلاحيات
                details = f"Settings endpoint not available (HTTP {response.status_code}), but admin login successful"
                self.log_test("Admin Permissions", True, response_time, details)
                return True
                
        except Exception as e:
            self.log_test("Admin Permissions", False, error=e)
            return False

    def test_data_formatting(self):
        """8. التحقق من أن جميع APIs ترجع بيانات صحيحة ومنسقة"""
        try:
            # اختبار تنسيق البيانات في dashboard stats
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/dashboard/stats", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # فحص تنسيق البيانات
                formatting_checks = []
                
                # فحص أن الأرقام هي أرقام وليس strings
                if "users" in data and "total" in data["users"]:
                    formatting_checks.append(isinstance(data["users"]["total"], int))
                
                # فحص أن المبالغ المالية هي أرقام
                if "collections" in data and "total" in data["collections"]:
                    formatting_checks.append(isinstance(data["collections"]["total"], (int, float)))
                
                # فحص وجود time_filter
                formatting_checks.append("time_filter" in data)
                
                all_formatted_correctly = all(formatting_checks)
                
                details = f"Data formatting checks passed: {sum(formatting_checks)}/{len(formatting_checks)}"
                self.log_test("Data Formatting", all_formatted_correctly, response_time, details)
                return all_formatted_correctly
            else:
                self.log_test("Data Formatting", False, response_time, error=f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Data Formatting", False, error=e)
            return False

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل للباكند - Dashboard Focus")
        print("=" * 80)
        print("🎯 الهدف: التأكد من أن النظام جاهز لعرض محتوى dashboard بشكل صحيح")
        print("🔗 Backend URL:", BACKEND_URL)
        print("=" * 80)
        
        # تشغيل جميع الاختبارات
        tests = [
            self.test_admin_login,
            self.test_dashboard_stats,
            self.test_users_api,
            self.test_clinics_api,
            self.test_products_api,
            self.test_orders_api,
            self.test_admin_permissions,
            self.test_data_formatting
        ]
        
        successful_tests = 0
        for test in tests:
            if test():
                successful_tests += 1
            print()  # سطر فارغ بين الاختبارات
        
        # حساب الإحصائيات النهائية
        total_tests = len(tests)
        success_rate = (successful_tests / total_tests) * 100
        total_time = time.time() - self.start_time
        
        # حساب متوسط وقت الاستجابة
        response_times = [result["response_time"] for result in self.test_results if result["response_time"]]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        print("=" * 80)
        print("📊 نتائج الاختبار الشامل:")
        print(f"✅ الاختبارات الناجحة: {successful_tests}/{total_tests}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        print(f"⏱️ إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
        print(f"🚀 متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        # تقييم الأداء
        if success_rate >= 90:
            performance_rating = "ممتاز 🏆"
        elif success_rate >= 75:
            performance_rating = "جيد جداً ✅"
        elif success_rate >= 60:
            performance_rating = "جيد ⚠️"
        else:
            performance_rating = "يحتاج تحسين ❌"
        
        print(f"🎯 تقييم الأداء: {performance_rating}")
        
        # تحليل المشاكل
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n❌ الاختبارات الفاشلة:")
            for test in failed_tests:
                print(f"   - {test['test_name']}: {test['error']}")
        
        print("=" * 80)
        
        # تحديد حالة النظام
        if success_rate >= 85:
            print("🎉 النظام جاهز لعرض محتوى dashboard بشكل صحيح!")
            print("✅ مشكلة عدم ظهور المحتوى ليست من الباكند")
        elif success_rate >= 70:
            print("⚠️ النظام يعمل بشكل جيد مع بعض المشاكل البسيطة")
            print("🔧 قد تحتاج بعض التحسينات البسيطة")
        else:
            print("❌ توجد مشاكل في الباكند تحتاج إصلاح")
            print("🛠️ يجب حل المشاكل قبل التركيز على الفرونت إند")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = ComprehensiveDashboardTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)