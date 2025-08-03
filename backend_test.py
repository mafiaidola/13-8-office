#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Arabic Review Issues
Target: 100% success rate (14/14 tests) instead of 78.6% (11/14)

Specific Issues to Test:
1. POST /api/activities - Fix activity type (use 'visit_registration' instead of 'clinic_visit')
2. GET /api/orders/{id} - Develop endpoint for viewing specific order details  
3. PUT /api/admin/settings - Enable endpoint for saving system settings and logo
4. Clinic fields - Enable manager_name and manager_phone fields in POST /api/clinics
5. Remove specialization - Ensure specialization field is removed from clinics
"""

import requests
import json
import time
from datetime import datetime
import sys
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://b0f2f242-ec03-4c87-84c2-74073f21fca1.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
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
        """Login as admin to get JWT token"""
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
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                self.log_test("Admin Login", True, f"JWT token obtained successfully", response_time)
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code} - {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False

    def test_activities_api(self):
        """Test POST /api/activities with correct activity type"""
        try:
            # Test creating activity with correct type 'visit_registration'
            start_time = time.time()
            activity_data = {
                "type": "visit_registration",  # Correct field name as per ActivityCreate model
                "action": "تسجيل زيارة عيادة اختبار",
                "target_type": "clinic",
                "target_id": "test-clinic-id",
                "target_details": {
                    "clinic_name": "عيادة اختبار شاملة",
                    "doctor_name": "د. أحمد محمد",
                    "specialization": "باطنة"
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
                    "products_presented": ["منتج أ", "منتج ب"],
                    "notes": "زيارة ناجحة مع عرض المنتجات الجديدة"
                }
            }
            
            response = self.session.post(f"{API_BASE}/activities", json=activity_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                self.log_test("POST /api/activities (visit_registration)", True, 
                            f"Activity created successfully with correct type", response_time)
                return True
            else:
                self.log_test("POST /api/activities (visit_registration)", False, 
                            f"Failed: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/activities (visit_registration)", False, f"Error: {str(e)}")
            return False

    def test_orders_detail_api(self):
        """Test GET /api/orders/{id} endpoint"""
        try:
            # First get list of orders to find an ID
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/orders")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                orders = response.json()
                if orders and len(orders) > 0:
                    order_id = orders[0].get("id")
                    if order_id:
                        # Test GET /api/orders/{id}
                        start_time = time.time()
                        detail_response = self.session.get(f"{API_BASE}/orders/{order_id}")
                        detail_response_time = (time.time() - start_time) * 1000
                        
                        if detail_response.status_code == 200:
                            order_detail = detail_response.json()
                            self.log_test("GET /api/orders/{id}", True, 
                                        f"Order detail retrieved successfully: {order_detail.get('order_number', 'N/A')}", 
                                        detail_response_time)
                            return True
                        else:
                            self.log_test("GET /api/orders/{id}", False, 
                                        f"Order detail failed: {detail_response.status_code} - {detail_response.text}", 
                                        detail_response_time)
                            return False
                    else:
                        self.log_test("GET /api/orders/{id}", False, "No order ID found in orders list")
                        return False
                else:
                    self.log_test("GET /api/orders/{id}", False, "No orders found to test detail endpoint")
                    return False
            else:
                self.log_test("GET /api/orders/{id}", False, f"Failed to get orders list: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/orders/{id}", False, f"Error: {str(e)}")
            return False

    def test_admin_settings_api(self):
        """Test PUT /api/admin/settings endpoint"""
        try:
            # Test GET settings first
            start_time = time.time()
            get_response = self.session.get(f"{API_BASE}/admin/settings")
            get_response_time = (time.time() - start_time) * 1000
            
            if get_response.status_code == 200:
                self.log_test("GET /api/admin/settings", True, "Settings retrieved successfully", get_response_time)
                
                # Test PUT settings
                settings_data = {
                    "company_name": "EP Group - Updated",
                    "company_logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "system_language": "ar",
                    "theme": "modern",
                    "session_timeout": 60,
                    "max_login_attempts": 5,
                    "backup_frequency": "daily",
                    "notification_settings": {
                        "email_notifications": True,
                        "sms_notifications": False,
                        "push_notifications": True
                    }
                }
                
                start_time = time.time()
                put_response = self.session.put(f"{API_BASE}/admin/settings", json=settings_data)
                put_response_time = (time.time() - start_time) * 1000
                
                if put_response.status_code == 200:
                    self.log_test("PUT /api/admin/settings", True, 
                                "Settings updated successfully", put_response_time)
                    return True
                else:
                    self.log_test("PUT /api/admin/settings", False, 
                                f"Settings update failed: {put_response.status_code} - {put_response.text}", 
                                put_response_time)
                    return False
            else:
                self.log_test("GET /api/admin/settings", False, 
                            f"Settings retrieval failed: {get_response.status_code} - {get_response.text}", 
                            get_response_time)
                return False
                
        except Exception as e:
            self.log_test("PUT /api/admin/settings", False, f"Error: {str(e)}")
            return False

    def test_clinic_manager_fields(self):
        """Test POST /api/clinics with manager_name and manager_phone fields"""
        try:
            clinic_data = {
                "name": "عيادة اختبار الحقول الجديدة",  # Fixed field name
                "address": "شارع التحرير، القاهرة",
                "phone": "01234567890",
                "email": "test@clinic.com",
                "classification": "A",
                "credit_status": "good",
                "manager_name": "أحمد محمد المدير",  # New field to test
                "manager_phone": "01111111111",        # New field to test
                "latitude": 30.0444,
                "longitude": 31.2357,
                "area_id": "test-area-id",
                "notes": "عيادة اختبار لفحص الحقول الجديدة"
            }
            
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/clinics", json=clinic_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                clinic_result = response.json()
                # Check if manager fields are included in response
                clinic_info = clinic_result.get("clinic", {})
                has_manager_name = "manager_name" in clinic_info
                has_manager_phone = "manager_phone" in clinic_info
                
                if has_manager_name and has_manager_phone:
                    self.log_test("POST /api/clinics (manager fields)", True, 
                                f"Clinic created with manager fields: {clinic_info.get('manager_name')}", 
                                response_time)
                    return True
                else:
                    self.log_test("POST /api/clinics (manager fields)", False, 
                                f"Manager fields missing in response. Has name: {has_manager_name}, Has phone: {has_manager_phone}", 
                                response_time)
                    return False
            else:
                self.log_test("POST /api/clinics (manager fields)", False, 
                            f"Clinic creation failed: {response.status_code} - {response.text}", 
                            response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/clinics (manager fields)", False, f"Error: {str(e)}")
            return False

    def test_clinic_specialization_removal(self):
        """Test that specialization field is removed from clinics"""
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/clinics")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                if clinics and len(clinics) > 0:
                    # Check if any clinic has specialization field
                    has_specialization = any("specialization" in clinic for clinic in clinics)
                    
                    if not has_specialization:
                        self.log_test("Clinic Specialization Removal", True, 
                                    f"Specialization field successfully removed from all {len(clinics)} clinics", 
                                    response_time)
                        return True
                    else:
                        clinics_with_spec = [clinic.get("name", "Unknown") for clinic in clinics if "specialization" in clinic]
                        self.log_test("Clinic Specialization Removal", False, 
                                    f"Specialization field still exists in clinics: {clinics_with_spec[:3]}", 
                                    response_time)
                        return False
                else:
                    self.log_test("Clinic Specialization Removal", False, "No clinics found to test", response_time)
                    return False
            else:
                self.log_test("Clinic Specialization Removal", False, 
                            f"Failed to get clinics: {response.status_code} - {response.text}", 
                            response_time)
                return False
                
        except Exception as e:
            self.log_test("Clinic Specialization Removal", False, f"Error: {str(e)}")
            return False

    def test_core_apis(self):
        """Test core APIs that should be working"""
        core_tests = [
            ("GET /api/users", f"{API_BASE}/users"),
            ("GET /api/clinics", f"{API_BASE}/clinics"),
            ("GET /api/products", f"{API_BASE}/products"),
            ("GET /api/orders", f"{API_BASE}/orders"),
            ("GET /api/lines", f"{API_BASE}/lines"),
            ("GET /api/areas", f"{API_BASE}/areas"),
            ("GET /api/warehouses", f"{API_BASE}/warehouses"),
            ("GET /api/visits", f"{API_BASE}/visits")
        ]
        
        success_count = 0
        for test_name, url in core_tests:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else "N/A"
                    self.log_test(test_name, True, f"Retrieved {count} records", response_time)
                    success_count += 1
                else:
                    self.log_test(test_name, False, f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(test_name, False, f"Error: {str(e)}")
        
        return success_count

    def run_comprehensive_test(self):
        """Run all tests"""
        print("🚀 Starting Comprehensive Backend Testing for Arabic Review Issues")
        print("=" * 80)
        print(f"🎯 Target: 100% success rate (14/14 tests) instead of 78.6% (11/14)")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        print("\n📋 Testing Specific Arabic Review Issues:")
        print("-" * 50)
        
        # Test specific issues mentioned in review
        issue_tests = [
            ("1. POST /api/activities (visit_registration)", self.test_activities_api),
            ("2. GET /api/orders/{id}", self.test_orders_detail_api),
            ("3. PUT /api/admin/settings", self.test_admin_settings_api),
            ("4. Clinic Manager Fields", self.test_clinic_manager_fields),
            ("5. Specialization Removal", self.test_clinic_specialization_removal)
        ]
        
        issue_success_count = 0
        for test_desc, test_func in issue_tests:
            print(f"\n🔍 {test_desc}")
            if test_func():
                issue_success_count += 1
        
        print(f"\n📋 Testing Core APIs:")
        print("-" * 50)
        core_success_count = self.test_core_apis()
        
        # Calculate results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 80)
        print(f"🎯 Target Success Rate: 100% (14/14 tests)")
        print(f"📈 Current Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests)")
        print(f"🔧 Arabic Review Issues: {issue_success_count}/5 fixed")
        print(f"⚙️  Core APIs Working: {core_success_count}/8")
        print(f"⏱️  Total Test Time: {time.time() - self.start_time:.2f} seconds")
        
        if success_rate >= 100:
            print("🎉 SUCCESS: Target 100% success rate achieved!")
        elif success_rate >= 90:
            print("✅ EXCELLENT: Very close to target, minor fixes needed")
        elif success_rate >= 80:
            print("⚠️  GOOD: Most issues resolved, some fixes still needed")
        else:
            print("❌ NEEDS WORK: Significant issues remain")
        
        print("\n🔍 DETAILED ISSUE ANALYSIS:")
        print("-" * 50)
        
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("❌ Failed Tests:")
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']}: {test['message']}")
        else:
            print("✅ All tests passed successfully!")
        
        print("\n🎯 RECOMMENDATIONS FOR MAIN AGENT:")
        print("-" * 50)
        
        if issue_success_count < 5:
            print("🔧 Priority Fixes Needed:")
            if issue_success_count < 1:
                print("   - Implement POST /api/activities with 'visit_registration' type")
            if issue_success_count < 2:
                print("   - Develop GET /api/orders/{id} endpoint")
            if issue_success_count < 3:
                print("   - Enable PUT /api/admin/settings endpoint")
            if issue_success_count < 4:
                print("   - Add manager_name and manager_phone fields to clinic creation")
            if issue_success_count < 5:
                print("   - Remove specialization field from clinic data")
        
        if core_success_count < 8:
            print("⚙️  Core API Issues:")
            print("   - Check database connectivity and data integrity")
            print("   - Verify JWT authentication is working properly")
        
        if success_rate >= 100:
            print("🎉 READY FOR PRODUCTION: All systems working perfectly!")
        
        return success_rate >= 100

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)