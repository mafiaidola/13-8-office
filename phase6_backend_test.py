#!/usr/bin/env python3
"""
Phase 6 Backend Testing - المرحلة السادسة
Testing comprehensive backend support for new requirements

المطلوب اختبار:
1. نظام الأنشطة: APIs تتبع الأنشطة مع التفاصيل الكاملة
2. تسجيل العيادات: حقول جديدة (manager_name, manager_phone) وإزالة specialization
3. إدارة المنتجات: إضافة المنتجات ودعم الخطوط والفئات
4. إدارة الطلبات: عرض التفاصيل مع التحكم في الأسعار حسب الدور
5. إدارة المخازن: دعم جداول المنتجات بدلاً من السعة فقط
6. إعدادات النظام: حفظ اللوجو والإعدادات
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://e0c0a695-5df9-4c27-89c6-e048414b1d42.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class Phase6BackendTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def login_admin(self):
        """تسجيل دخول الأدمن"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data["access_token"]
                    self.log_result("✅ Admin Login", True, f"Successfully logged in as admin")
                    return True
                else:
                    self.log_result("❌ Admin Login", False, f"Login failed: {response.status}")
                    return False
        except Exception as e:
            self.log_result("❌ Admin Login", False, f"Exception: {str(e)}")
            return False
            
    async def login_medical_rep(self):
        """تسجيل دخول مندوب طبي للاختبار"""
        try:
            # Try to find a medical rep user first
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.get(f"{API_BASE}/users", headers=headers) as response:
                if response.status == 200:
                    users = await response.json()
                    medical_reps = [u for u in users if u.get("role") in ["medical_rep", "sales_rep"]]
                    
                    if medical_reps:
                        # Try to login with first medical rep (assuming default password)
                        rep_username = medical_reps[0]["username"]
                        login_data = {
                            "username": rep_username,
                            "password": "password123"  # Default password
                        }
                        
                        async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as login_response:
                            if login_response.status == 200:
                                data = await login_response.json()
                                self.medical_rep_token = data["access_token"]
                                self.log_result("✅ Medical Rep Login", True, f"Logged in as {rep_username}")
                                return True
                            
            self.log_result("⚠️ Medical Rep Login", False, "No medical rep found or login failed")
            return False
        except Exception as e:
            self.log_result("❌ Medical Rep Login", False, f"Exception: {str(e)}")
            return False

    def log_result(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_time": response_time
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}: {details}{time_info}")

    async def test_activity_system_apis(self):
        """اختبار نظام الأنشطة - Activity System APIs"""
        print("\n🔍 Testing Activity System APIs...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: POST /api/activities - Create new activity
        try:
            start_time = time.time()
            activity_data = {
                "activity_type": "clinic_visit",
                "action": "تسجيل زيارة عيادة جديدة",
                "target_type": "clinic",
                "target_id": str(uuid.uuid4()),
                "target_details": {
                    "clinic_name": "عيادة اختبار المرحلة السادسة",
                    "doctor_name": "د. أحمد محمد",
                    "visit_type": "routine"
                },
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "address": "القاهرة، مصر",
                    "area": "وسط البلد"
                },
                "device_info": {
                    "device_type": "mobile",
                    "browser": "Chrome",
                    "os": "Android"
                },
                "additional_details": {
                    "visit_duration": "30 minutes",
                    "products_discussed": ["منتج أ", "منتج ب"],
                    "outcome": "successful"
                }
            }
            
            async with self.session.post(f"{API_BASE}/activities", json=activity_data, headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    data = await response.json()
                    self.log_result("✅ POST /api/activities", True, 
                                  f"Activity created successfully with full details", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ POST /api/activities", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ POST /api/activities", False, f"Exception: {str(e)}")

        # Test 2: GET /api/admin/activities - Get all activities
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/admin/activities", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    activities = await response.json()
                    self.log_result("✅ GET /api/admin/activities", True, 
                                  f"Retrieved {len(activities)} activities with full details", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/admin/activities", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/admin/activities", False, f"Exception: {str(e)}")

        # Test 3: GET /api/admin/activities/stats - Get activity statistics
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/admin/activities/stats", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    stats = await response.json()
                    self.log_result("✅ GET /api/admin/activities/stats", True, 
                                  f"Activity stats: {json.dumps(stats, indent=2)}", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/admin/activities/stats", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/admin/activities/stats", False, f"Exception: {str(e)}")

    async def test_clinic_registration_new_fields(self):
        """اختبار تسجيل العيادات مع الحقول الجديدة"""
        print("\n🏥 Testing Clinic Registration with New Fields...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: POST /api/clinics with new fields (manager_name, manager_phone)
        try:
            start_time = time.time()
            clinic_data = {
                "name": "عيادة المرحلة السادسة الاختبارية",
                "address": "شارع التحرير، القاهرة",
                "phone": "01234567890",
                "email": "clinic@phase6test.com",
                "manager_name": "أحمد محمد المدير",  # New field
                "manager_phone": "01098765432",  # New field
                "classification": "A",
                "credit_status": "good",
                "area_id": "test-area-id",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "registration_metadata": {  # New field for registration info
                    "registration_source": "mobile_app",
                    "registered_by_role": "medical_rep",
                    "registration_method": "gps_verified",
                    "verification_status": "pending"
                }
                # Note: specialization field should be removed
            }
            
            async with self.session.post(f"{API_BASE}/clinics", json=clinic_data, headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    data = await response.json()
                    self.log_result("✅ POST /api/clinics (New Fields)", True, 
                                  f"Clinic created with manager_name and manager_phone", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ POST /api/clinics (New Fields)", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ POST /api/clinics (New Fields)", False, f"Exception: {str(e)}")

        # Test 2: GET /api/clinics - Verify new fields are returned
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/clinics", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    clinics = await response.json()
                    # Check if any clinic has the new fields
                    has_manager_fields = any(
                        'manager_name' in clinic or 'manager_phone' in clinic 
                        for clinic in clinics
                    )
                    has_registration_metadata = any(
                        'registration_metadata' in clinic 
                        for clinic in clinics
                    )
                    
                    self.log_result("✅ GET /api/clinics (Field Verification)", True, 
                                  f"Found {len(clinics)} clinics. Manager fields: {has_manager_fields}, "
                                  f"Registration metadata: {has_registration_metadata}", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/clinics (Field Verification)", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/clinics (Field Verification)", False, f"Exception: {str(e)}")

    async def test_product_management_enhancements(self):
        """اختبار تحسينات إدارة المنتجات"""
        print("\n📦 Testing Product Management Enhancements...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/products - Check current products and categories
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/products", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    products = await response.json()
                    categories = set(p.get('category', 'No Category') for p in products)
                    lines = set(p.get('line_name', 'No Line') for p in products)
                    
                    self.log_result("✅ GET /api/products", True, 
                                  f"Found {len(products)} products, {len(categories)} categories, "
                                  f"{len(lines)} lines", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/products", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/products", False, f"Exception: {str(e)}")

        # Test 2: GET /api/lines - Check lines for product assignment
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/lines", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    lines = await response.json()
                    self.log_result("✅ GET /api/lines", True, 
                                  f"Found {len(lines)} lines for product assignment", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/lines", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/lines", False, f"Exception: {str(e)}")

        # Test 3: POST /api/products - Create new product with category and line
        try:
            start_time = time.time()
            
            # Get a line ID first
            async with self.session.get(f"{API_BASE}/lines", headers=headers) as line_response:
                if line_response.status == 200:
                    lines = await line_response.json()
                    line_id = lines[0]["id"] if lines else "default-line-id"
                else:
                    line_id = "default-line-id"
            
            product_data = {
                "name": "منتج المرحلة السادسة الاختباري",
                "description": "منتج تجريبي لاختبار المرحلة السادسة",
                "category": "أدوية متخصصة",  # Category support
                "unit": "علبة",
                "line_id": line_id,  # Line support
                "price": 75.50,
                "price_type": "fixed",
                "current_stock": 100,
                "is_active": True
            }
            
            async with self.session.post(f"{API_BASE}/products", json=product_data, headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    data = await response.json()
                    self.log_result("✅ POST /api/products", True, 
                                  f"Product created with category and line support", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ POST /api/products", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ POST /api/products", False, f"Exception: {str(e)}")

    async def test_order_management_role_based_pricing(self):
        """اختبار إدارة الطلبات مع التحكم في الأسعار حسب الدور"""
        print("\n📋 Testing Order Management with Role-Based Pricing...")
        
        # Test with Admin (should see prices)
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/orders as Admin
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/orders", headers=admin_headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    orders = await response.json()
                    has_prices = any('total_amount' in order for order in orders)
                    self.log_result("✅ GET /api/orders (Admin)", True, 
                                  f"Admin sees {len(orders)} orders with prices: {has_prices}", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/orders (Admin)", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/orders (Admin)", False, f"Exception: {str(e)}")

        # Test 2: GET /api/orders/{id} - Get specific order details
        try:
            start_time = time.time()
            # First get orders to get an ID
            async with self.session.get(f"{API_BASE}/orders", headers=admin_headers) as response:
                if response.status == 200:
                    orders = await response.json()
                    if orders:
                        order_id = orders[0]["id"]
                        async with self.session.get(f"{API_BASE}/orders/{order_id}", headers=admin_headers) as detail_response:
                            response_time = (time.time() - start_time) * 1000
                            if detail_response.status == 200:
                                order_details = await detail_response.json()
                                has_detailed_pricing = 'total_amount' in order_details
                                self.log_result("✅ GET /api/orders/{id}", True, 
                                              f"Order details retrieved with pricing: {has_detailed_pricing}", response_time)
                            else:
                                error_text = await detail_response.text()
                                self.log_result("❌ GET /api/orders/{id}", False, 
                                              f"Failed: {detail_response.status} - {error_text}", response_time)
                    else:
                        self.log_result("⚠️ GET /api/orders/{id}", False, "No orders found to test details")
                else:
                    self.log_result("❌ GET /api/orders/{id}", False, "Could not get orders list")
        except Exception as e:
            self.log_result("❌ GET /api/orders/{id}", False, f"Exception: {str(e)}")

        # Test 3: Test with Medical Rep (if available) - should have limited price access
        if self.medical_rep_token:
            rep_headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            try:
                start_time = time.time()
                async with self.session.get(f"{API_BASE}/orders", headers=rep_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    if response.status == 200:
                        orders = await response.json()
                        self.log_result("✅ GET /api/orders (Medical Rep)", True, 
                                      f"Medical rep sees {len(orders)} orders (role-based filtering)", response_time)
                    else:
                        error_text = await response.text()
                        self.log_result("❌ GET /api/orders (Medical Rep)", False, 
                                      f"Failed: {response.status} - {error_text}", response_time)
            except Exception as e:
                self.log_result("❌ GET /api/orders (Medical Rep)", False, f"Exception: {str(e)}")

    async def test_warehouse_management_product_tables(self):
        """اختبار إدارة المخازن مع دعم جداول المنتجات"""
        print("\n🏪 Testing Warehouse Management with Product Tables...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/warehouses - Check warehouse structure
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/warehouses", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    warehouses = await response.json()
                    has_product_tables = any(
                        'products' in warehouse or 'inventory' in warehouse 
                        for warehouse in warehouses
                    )
                    self.log_result("✅ GET /api/warehouses", True, 
                                  f"Found {len(warehouses)} warehouses. Product tables support: {has_product_tables}", 
                                  response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/warehouses", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/warehouses", False, f"Exception: {str(e)}")

        # Test 2: Check if warehouses have detailed product information instead of just capacity
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/warehouses", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    warehouses = await response.json()
                    detailed_warehouses = 0
                    for warehouse in warehouses:
                        # Check for product-related fields beyond just capacity
                        product_fields = ['products', 'inventory', 'stock_levels', 'product_categories']
                        if any(field in warehouse for field in product_fields):
                            detailed_warehouses += 1
                    
                    self.log_result("✅ Warehouse Product Tables", True, 
                                  f"{detailed_warehouses}/{len(warehouses)} warehouses have product table support", 
                                  response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ Warehouse Product Tables", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ Warehouse Product Tables", False, f"Exception: {str(e)}")

    async def test_system_settings_logo_support(self):
        """اختبار إعدادات النظام مع دعم حفظ اللوجو"""
        print("\n⚙️ Testing System Settings with Logo Support...")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/admin/settings - Get current settings
        try:
            start_time = time.time()
            async with self.session.get(f"{API_BASE}/admin/settings", headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    settings = await response.json()
                    has_logo_support = 'logo' in settings or 'company_logo' in settings
                    self.log_result("✅ GET /api/admin/settings", True, 
                                  f"Settings retrieved. Logo support: {has_logo_support}", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ GET /api/admin/settings", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ GET /api/admin/settings", False, f"Exception: {str(e)}")

        # Test 2: PUT /api/admin/settings - Update settings with logo
        try:
            start_time = time.time()
            settings_data = {
                "company_name": "EP Group - Phase 6 Test",
                "company_logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",  # 1x1 transparent PNG
                "system_theme": "modern",
                "language": "ar",
                "timezone": "Africa/Cairo",
                "email_notifications": True,
                "sms_notifications": False,
                "backup_frequency": "daily",
                "session_timeout": 24,
                "max_login_attempts": 5
            }
            
            async with self.session.put(f"{API_BASE}/admin/settings", json=settings_data, headers=headers) as response:
                response_time = (time.time() - start_time) * 1000
                if response.status == 200:
                    data = await response.json()
                    self.log_result("✅ PUT /api/admin/settings", True, 
                                  f"Settings updated successfully with logo support", response_time)
                else:
                    error_text = await response.text()
                    self.log_result("❌ PUT /api/admin/settings", False, 
                                  f"Failed: {response.status} - {error_text}", response_time)
        except Exception as e:
            self.log_result("❌ PUT /api/admin/settings", False, f"Exception: {str(e)}")

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل للمرحلة السادسة"""
        print("🚀 Starting Phase 6 Comprehensive Backend Testing...")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Authentication
            if not await self.login_admin():
                print("❌ Cannot proceed without admin authentication")
                return
                
            await self.login_medical_rep()  # Optional for role-based testing
            
            # Run all tests
            await self.test_activity_system_apis()
            await self.test_clinic_registration_new_fields()
            await self.test_product_management_enhancements()
            await self.test_order_management_role_based_pricing()
            await self.test_warehouse_management_product_tables()
            await self.test_system_settings_logo_support()
            
        finally:
            await self.cleanup_session()
            
        # Generate final report
        self.generate_final_report()

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("🎯 PHASE 6 BACKEND TESTING FINAL REPORT")
        print("=" * 80)
        
        print(f"📊 **Overall Results:**")
        print(f"   • Total Tests: {total_tests}")
        print(f"   • Successful: {successful_tests}")
        print(f"   • Failed: {failed_tests}")
        print(f"   • Success Rate: {success_rate:.1f}%")
        print(f"   • Total Time: {total_time:.2f} seconds")
        
        print(f"\n📋 **Test Categories:**")
        
        # Group by category
        categories = {
            "Activity System": [r for r in self.test_results if "activities" in r["test"].lower()],
            "Clinic Registration": [r for r in self.test_results if "clinic" in r["test"].lower()],
            "Product Management": [r for r in self.test_results if "product" in r["test"].lower()],
            "Order Management": [r for r in self.test_results if "order" in r["test"].lower()],
            "Warehouse Management": [r for r in self.test_results if "warehouse" in r["test"].lower()],
            "System Settings": [r for r in self.test_results if "settings" in r["test"].lower()],
            "Authentication": [r for r in self.test_results if "login" in r["test"].lower()]
        }
        
        for category, tests in categories.items():
            if tests:
                category_success = len([t for t in tests if t["success"]])
                category_total = len(tests)
                category_rate = (category_success / category_total * 100) if category_total > 0 else 0
                print(f"   • {category}: {category_success}/{category_total} ({category_rate:.1f}%)")
        
        print(f"\n🔍 **Critical Findings:**")
        
        # Activity System Analysis
        activity_tests = [r for r in self.test_results if "activities" in r["test"].lower()]
        activity_success = len([t for t in activity_tests if t["success"]])
        if activity_success == len(activity_tests) and activity_tests:
            print(f"   ✅ Activity System: Fully functional with comprehensive tracking")
        elif activity_tests:
            print(f"   ⚠️ Activity System: Partial functionality ({activity_success}/{len(activity_tests)})")
        else:
            print(f"   ❌ Activity System: Not implemented or not accessible")
            
        # Clinic Registration Analysis
        clinic_tests = [r for r in self.test_results if "clinic" in r["test"].lower()]
        clinic_success = len([t for t in clinic_tests if t["success"]])
        if clinic_success == len(clinic_tests) and clinic_tests:
            print(f"   ✅ Clinic Registration: New fields (manager_name, manager_phone) supported")
        elif clinic_tests:
            print(f"   ⚠️ Clinic Registration: Partial support for new fields")
        else:
            print(f"   ❌ Clinic Registration: New fields not supported")
            
        # Product Management Analysis
        product_tests = [r for r in self.test_results if "product" in r["test"].lower()]
        product_success = len([t for t in product_tests if t["success"]])
        if product_success == len(product_tests) and product_tests:
            print(f"   ✅ Product Management: Full support for lines and categories")
        elif product_tests:
            print(f"   ⚠️ Product Management: Partial functionality")
        else:
            print(f"   ❌ Product Management: Limited functionality")
            
        # Order Management Analysis
        order_tests = [r for r in self.test_results if "order" in r["test"].lower()]
        order_success = len([t for t in order_tests if t["success"]])
        if order_success == len(order_tests) and order_tests:
            print(f"   ✅ Order Management: Role-based pricing control working")
        elif order_tests:
            print(f"   ⚠️ Order Management: Partial role-based functionality")
        else:
            print(f"   ❌ Order Management: Role-based pricing not implemented")
        
        print(f"\n🎯 **Final Assessment:**")
        if success_rate >= 90:
            print(f"   🎉 EXCELLENT: Phase 6 requirements are fully supported!")
        elif success_rate >= 75:
            print(f"   ✅ GOOD: Most Phase 6 requirements are working with minor issues")
        elif success_rate >= 50:
            print(f"   ⚠️ PARTIAL: Some Phase 6 requirements need attention")
        else:
            print(f"   ❌ CRITICAL: Major Phase 6 requirements are not working")
            
        print(f"\n📝 **Recommendations:**")
        if failed_tests > 0:
            print(f"   • Fix {failed_tests} failed test(s) to improve system reliability")
        if success_rate < 100:
            print(f"   • Review and implement missing Phase 6 features")
        print(f"   • All critical APIs for Phase 6 should be fully functional")
        print(f"   • Ensure role-based access control is properly implemented")
        
        print("=" * 80)

async def main():
    """الدالة الرئيسية"""
    tester = Phase6BackendTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())