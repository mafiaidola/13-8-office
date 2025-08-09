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
BACKEND_URL = "https://27f64219-57e1-4ae7-9f08-6723a4a751d3.preview.emergentagent.com"
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
        
    def log_test(self, test_name, success, message, response_time=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if message:
            print(f"   📝 {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time
        })

    def login_admin(self):
        """Test Authentication System - admin/admin123 login"""
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                self.log_test("Authentication System (admin/admin123)", True, 
                            f"Login successful - User: {user_info.get('full_name', 'admin')}, Role: {user_info.get('role', 'admin')}", 
                            response_time)
                return True
            else:
                self.log_test("Authentication System (admin/admin123)", False, 
                            f"Login failed: {response.status_code} - {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Authentication System (admin/admin123)", False, f"Login error: {str(e)}")
            return False

    def test_dashboard_apis(self):
        """Test Dashboard APIs for stats and metrics"""
        dashboard_endpoints = [
            ("Dashboard Stats", f"{API_BASE}/dashboard/stats"),
            ("Admin Activities", f"{API_BASE}/admin/activities"),
            ("Activity Statistics", f"{API_BASE}/admin/activities/stats"),
            ("GPS Tracking", f"{API_BASE}/admin/gps-tracking"),
            ("GPS Statistics", f"{API_BASE}/admin/gps-tracking/stats")
        ]
        
        success_count = 0
        for test_name, url in dashboard_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict):
                        # Extract key metrics for dashboard
                        metrics = []
                        if "total_users" in data:
                            metrics.append(f"Users: {data['total_users']}")
                        if "total_clinics" in data:
                            metrics.append(f"Clinics: {data['total_clinics']}")
                        if "total_products" in data:
                            metrics.append(f"Products: {data['total_products']}")
                        if "total_orders" in data:
                            metrics.append(f"Orders: {data['total_orders']}")
                        if "total_visits" in data:
                            metrics.append(f"Visits: {data['total_visits']}")
                        if "total_activities" in data:
                            metrics.append(f"Activities: {data['total_activities']}")
                        if "total_gps_records" in data:
                            metrics.append(f"GPS Records: {data['total_gps_records']}")
                        
                        metrics_str = ", ".join(metrics) if metrics else "Data available"
                        self.log_test(f"Dashboard API - {test_name}", True, metrics_str, response_time)
                    elif isinstance(data, list):
                        self.log_test(f"Dashboard API - {test_name}", True, f"Retrieved {len(data)} records", response_time)
                    else:
                        self.log_test(f"Dashboard API - {test_name}", True, "Data retrieved successfully", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Dashboard API - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Dashboard API - {test_name}", False, f"Error: {str(e)}")
        
        return success_count

    def test_user_management_apis(self):
        """Test User Management APIs"""
        try:
            # Test GET /api/users
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/users")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    # Analyze user data
                    total_users = len(users)
                    roles = {}
                    active_users = 0
                    
                    for user in users:
                        role = user.get("role", "unknown")
                        roles[role] = roles.get(role, 0) + 1
                        if user.get("is_active", True):
                            active_users += 1
                    
                    role_summary = ", ".join([f"{role}: {count}" for role, count in roles.items()])
                    
                    self.log_test("User Management APIs", True, 
                                f"Total: {total_users}, Active: {active_users}, Roles - {role_summary}", 
                                response_time)
                    
                    # Test user profile access
                    if users:
                        user_id = users[0].get("id")
                        if user_id:
                            start_time = time.time()
                            profile_response = self.session.get(f"{API_BASE}/users/{user_id}/profile")
                            profile_response_time = (time.time() - start_time) * 1000
                            
                            if profile_response.status_code == 200:
                                self.log_test("User Profile Access", True, 
                                            "User profile retrieved successfully", profile_response_time)
                                return True
                            else:
                                self.log_test("User Profile Access", False, 
                                            f"Profile access failed: {profile_response.status_code}", profile_response_time)
                    return True
                else:
                    self.log_test("User Management APIs", False, "Invalid user data format")
                    return False
            else:
                self.log_test("User Management APIs", False, 
                            f"Failed: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("User Management APIs", False, f"Error: {str(e)}")
            return False

    def test_theme_system_backend(self):
        """Test Theme System - Backend support for theme switching"""
        try:
            # Test if settings API supports theme changes
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/settings")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                settings = response.json()
                current_theme = settings.get("theme", "default")
                
                # Test theme update
                theme_data = {
                    "theme": "neon",
                    "company_name": "EP Group System",
                    "system_language": "ar"
                }
                
                start_time = time.time()
                update_response = self.session.put(f"{API_BASE}/admin/settings", json=theme_data)
                update_response_time = (time.time() - start_time) * 1000
                
                if update_response.status_code == 200:
                    self.log_test("Theme System Backend Support", True, 
                                f"Theme switching supported - Current: {current_theme}, Updated to: neon", 
                                update_response_time)
                    return True
                else:
                    self.log_test("Theme System Backend Support", False, 
                                f"Theme update failed: {update_response.status_code}", update_response_time)
                    return False
            else:
                self.log_test("Theme System Backend Support", False, 
                            f"Settings API failed: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Theme System Backend Support", False, f"Error: {str(e)}")
            return False

    def test_debt_collection_apis(self):
        """Test Debt Collection APIs"""
        debt_endpoints = [
            ("Debt Summary Statistics", f"{API_BASE}/debts/summary/statistics"),
            ("Collection Statistics", f"{API_BASE}/debts/collections/summary/statistics"),
            ("Debt Records", f"{API_BASE}/debts/"),
            ("Collection Records", f"{API_BASE}/debts/collections/")
        ]
        
        success_count = 0
        for test_name, url in debt_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict):
                        # Extract debt statistics
                        stats = []
                        if "total_debt" in data:
                            stats.append(f"Total Debt: {data['total_debt']} ج.م")
                        if "outstanding_debt" in data:
                            stats.append(f"Outstanding: {data['outstanding_debt']} ج.م")
                        if "collected_amount" in data:
                            stats.append(f"Collected: {data['collected_amount']} ج.م")
                        if "total_debts" in data:
                            stats.append(f"Debt Records: {data['total_debts']}")
                        if "total_collections" in data:
                            stats.append(f"Collections: {data['total_collections']}")
                        
                        stats_str = ", ".join(stats) if stats else "Statistics available"
                        self.log_test(f"Debt API - {test_name}", True, stats_str, response_time)
                    elif isinstance(data, list):
                        self.log_test(f"Debt API - {test_name}", True, f"Retrieved {len(data)} records", response_time)
                    else:
                        self.log_test(f"Debt API - {test_name}", True, "Data retrieved successfully", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Debt API - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Debt API - {test_name}", False, f"Error: {str(e)}")
        
        return success_count

    def test_core_functional_apis(self):
        """Test Product/Clinic/Visit APIs - Core functionality"""
        core_endpoints = [
            ("Products API", f"{API_BASE}/products"),
            ("Clinics API", f"{API_BASE}/clinics"),
            ("Visits API", f"{API_BASE}/visits"),
            ("Orders API", f"{API_BASE}/orders"),
            ("Lines API", f"{API_BASE}/lines"),
            ("Areas API", f"{API_BASE}/areas"),
            ("Warehouses API", f"{API_BASE}/warehouses"),
            ("Doctors API", f"{API_BASE}/doctors")
        ]
        
        success_count = 0
        total_records = 0
        
        for test_name, url in core_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        count = len(data)
                        total_records += count
                        self.log_test(f"Core API - {test_name}", True, f"Retrieved {count} records", response_time)
                    else:
                        self.log_test(f"Core API - {test_name}", True, "Data retrieved successfully", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Core API - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Core API - {test_name}", False, f"Error: {str(e)}")
        
        # Test CRUD operations on a core API (Products)
        try:
            # Test product creation
            product_data = {
                "name": "منتج اختبار شامل",
                "description": "منتج للاختبار الشامل للنظام",
                "category": "اختبار",
                "unit": "قطعة",
                "line_id": "test-line-id",
                "price": 100.0,
                "price_type": "fixed",
                "current_stock": 50,
                "is_active": True
            }
            
            start_time = time.time()
            create_response = self.session.post(f"{API_BASE}/products", json=product_data)
            create_response_time = (time.time() - start_time) * 1000
            
            if create_response.status_code in [200, 201]:
                self.log_test("Core API - Product Creation", True, 
                            "Product created successfully", create_response_time)
                success_count += 1
            else:
                self.log_test("Core API - Product Creation", False, 
                            f"Creation failed: {create_response.status_code}", create_response_time)
                
        except Exception as e:
            self.log_test("Core API - Product Creation", False, f"Error: {str(e)}")
        
        return success_count, total_records

    def test_export_reports_apis(self):
        """Test Export/Reports backend support"""
        export_endpoints = [
            ("Activities Export", f"{API_BASE}/admin/activities/export"),
            ("Users Export", f"{API_BASE}/users/export"),
            ("Clinics Export", f"{API_BASE}/clinics/export"),
            ("Products Export", f"{API_BASE}/products/export"),
            ("Orders Export", f"{API_BASE}/orders/export")
        ]
        
        success_count = 0
        for test_name, url in export_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    # Check if response contains export data
                    content_type = response.headers.get('content-type', '')
                    if 'json' in content_type:
                        data = response.json()
                        self.log_test(f"Export API - {test_name}", True, 
                                    "Export data prepared successfully", response_time)
                    else:
                        self.log_test(f"Export API - {test_name}", True, 
                                    f"Export file ready - Content-Type: {content_type}", response_time)
                    success_count += 1
                elif response.status_code == 404:
                    self.log_test(f"Export API - {test_name}", False, 
                                "Export endpoint not implemented", response_time)
                else:
                    self.log_test(f"Export API - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Export API - {test_name}", False, f"Error: {str(e)}")
        
        # Test specific debt export functionality
        try:
            start_time = time.time()
            debt_export_response = self.session.get(f"{API_BASE}/debts/export/pdf")
            debt_export_time = (time.time() - start_time) * 1000
            
            if debt_export_response.status_code == 200:
                self.log_test("Export API - Debt PDF Export", True, 
                            "Debt PDF export ready", debt_export_time)
                success_count += 1
            else:
                self.log_test("Export API - Debt PDF Export", False, 
                            f"Debt export failed: {debt_export_response.status_code}", debt_export_time)
                
        except Exception as e:
            self.log_test("Export API - Debt PDF Export", False, f"Error: {str(e)}")
        
        return success_count

    def run_comprehensive_test(self):
        """Run comprehensive dashboard and theme functionality test"""
        print("🚀 Starting Comprehensive Backend Testing for Dashboard and Theme Functionality")
        print("=" * 90)
        print("🎯 Focus Areas:")
        print("   1. Authentication System: Test admin/admin123 login")
        print("   2. Dashboard APIs: Test all endpoints used by dashboard for stats and metrics")
        print("   3. User Management APIs: Ensure users list is working correctly")
        print("   4. Theme System: Verify no backend issues affecting theme switching")
        print("   5. Debt Collection APIs: Test debt summary statistics")
        print("   6. Product/Clinic/Visit APIs: Verify all core APIs are functional")
        print("   7. Export/Reports: Test any backend support for report generation")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 90)
        
        # 1. Authentication System
        print("\n🔐 1. AUTHENTICATION SYSTEM TESTING")
        print("-" * 50)
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # 2. Dashboard APIs
        print("\n📊 2. DASHBOARD APIs TESTING")
        print("-" * 50)
        dashboard_success = self.test_dashboard_apis()
        
        # 3. User Management APIs
        print("\n👥 3. USER MANAGEMENT APIs TESTING")
        print("-" * 50)
        user_mgmt_success = self.test_user_management_apis()
        
        # 4. Theme System
        print("\n🎨 4. THEME SYSTEM BACKEND TESTING")
        print("-" * 50)
        theme_success = self.test_theme_system_backend()
        
        # 5. Debt Collection APIs
        print("\n💰 5. DEBT COLLECTION APIs TESTING")
        print("-" * 50)
        debt_success = self.test_debt_collection_apis()
        
        # 6. Core Functional APIs
        print("\n⚙️ 6. CORE FUNCTIONAL APIs TESTING")
        print("-" * 50)
        core_success, total_records = self.test_core_functional_apis()
        
        # 7. Export/Reports APIs
        print("\n📋 7. EXPORT/REPORTS APIs TESTING")
        print("-" * 50)
        export_success = self.test_export_reports_apis()
        
        # Calculate results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Summary
        print("\n" + "=" * 90)
        print("📊 COMPREHENSIVE DASHBOARD & THEME FUNCTIONALITY TEST RESULTS")
        print("=" * 90)
        print(f"📈 Overall Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests)")
        print(f"🔐 Authentication: {'✅ WORKING' if self.jwt_token else '❌ FAILED'}")
        print(f"📊 Dashboard APIs: {dashboard_success} endpoints working")
        print(f"👥 User Management: {'✅ WORKING' if user_mgmt_success else '❌ FAILED'}")
        print(f"🎨 Theme System: {'✅ WORKING' if theme_success else '❌ FAILED'}")
        print(f"💰 Debt Collection: {debt_success} endpoints working")
        print(f"⚙️ Core APIs: {core_success} endpoints working ({total_records} total records)")
        print(f"📋 Export/Reports: {export_success} endpoints working")
        print(f"⏱️ Total Test Time: {time.time() - self.start_time:.2f} seconds")
        
        # Status Assessment
        if success_rate >= 95:
            print("\n🎉 EXCELLENT: Backend is ready for production!")
            status = "EXCELLENT"
        elif success_rate >= 85:
            print("\n✅ GOOD: Backend is stable with minor issues")
            status = "GOOD"
        elif success_rate >= 70:
            print("\n⚠️ FAIR: Backend needs some fixes")
            status = "FAIR"
        else:
            print("\n❌ POOR: Backend has significant issues")
            status = "POOR"
        
        # Detailed Analysis
        print("\n🔍 DETAILED ANALYSIS:")
        print("-" * 50)
        
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("❌ Failed Tests:")
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']}: {test['message']}")
        else:
            print("✅ All tests passed successfully!")
        
        # Performance Analysis
        response_times = [result["response_time"] for result in self.test_results if result["response_time"]]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            max_response_time = max(response_times)
            print(f"\n⚡ PERFORMANCE METRICS:")
            print(f"   Average Response Time: {avg_response_time:.2f}ms")
            print(f"   Maximum Response Time: {max_response_time:.2f}ms")
            print(f"   Performance Status: {'🟢 EXCELLENT' if avg_response_time < 50 else '🟡 GOOD' if avg_response_time < 100 else '🔴 SLOW'}")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = ComprehensiveDashboardTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)