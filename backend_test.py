#!/usr/bin/env python3
"""
Enhanced EP Group System Backend Testing - Phase 1 UI Support
Testing all backend APIs to ensure they support the Phase 1 UI improvements properly.
"""

import requests
import json
import time
from datetime import datetime
import os

# Get backend URL from environment
BACKEND_URL = "https://d3d1a9df-70fc-435f-82af-b5d9d4d817e1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name} ({result['response_time_ms']}ms) - {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with timing"""
        start_time = time.time()
        try:
            url = f"{self.base_url}{endpoint}"
            if headers is None:
                headers = {}
            
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
                
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                headers["Content-Type"] = "application/json"
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                headers["Content-Type"] = "application/json"
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = time.time() - start_time
            return response, response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Request failed: {str(e)}")
            return None, response_time

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
        
        # Test admin login
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                user_info = data.get("user", {})
                details = f"Login successful - User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                self.log_test("Admin Login (admin/admin123)", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, response_time, "No access token in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Admin Login (admin/admin123)", False, response_time, f"HTTP {response.status_code if response else 'N/A'}: {error_msg}")
        
        return False

    def test_user_management(self):
        """Test user management APIs"""
        print("\n👥 TESTING USER MANAGEMENT APIs")
        
        # Test get users
        response, response_time = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            roles = {}
            for user in users if isinstance(users, list) else []:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            details = f"Found {user_count} users. Roles: {dict(roles)}"
            self.log_test("Get Users List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Users List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create user
        new_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123",
            "full_name": "Test User for Phase 1",
            "role": "medical_rep",
            "email": "testuser@example.com",
            "phone": "01234567890",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/users", new_user_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                user_info = data.get("user", {})
                details = f"Created user: {user_info.get('username', 'N/A')} ({user_info.get('role', 'N/A')})"
                self.log_test("Create New User", True, response_time, details)
            else:
                self.log_test("Create New User", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New User", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_product_management(self):
        """Test product management APIs"""
        print("\n📦 TESTING PRODUCT MANAGEMENT APIs")
        
        # Test get products
        response, response_time = self.make_request("GET", "/products")
        if response and response.status_code == 200:
            products = response.json()
            product_count = len(products) if isinstance(products, list) else 0
            
            # Check if admin can see prices
            has_prices = False
            if isinstance(products, list) and products:
                has_prices = any("price" in product for product in products)
            
            details = f"Found {product_count} products. Admin can see prices: {has_prices}"
            self.log_test("Get Products List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Products List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test get lines for product creation
        response, response_time = self.make_request("GET", "/lines")
        if response and response.status_code == 200:
            lines = response.json()
            line_count = len(lines) if isinstance(lines, list) else 0
            details = f"Found {line_count} lines available for product assignment"
            self.log_test("Get Lines for Products", True, response_time, details)
            
            # Test create product if lines exist
            if isinstance(lines, list) and lines:
                line_id = lines[0].get("id")
                new_product_data = {
                    "name": f"Test Product {int(time.time())}",
                    "description": "Test product for Phase 1 UI testing",
                    "category": "Test Category",
                    "unit": "ڤايل",
                    "line_id": line_id,
                    "price": 25.50,
                    "price_type": "fixed",
                    "current_stock": 100,
                    "is_active": True
                }
                
                response, response_time = self.make_request("POST", "/products", new_product_data)
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        product_info = data.get("product", {})
                        details = f"Created product: {product_info.get('name', 'N/A')} - {product_info.get('price', 'N/A')} ج.م"
                        self.log_test("Create New Product", True, response_time, details)
                    else:
                        self.log_test("Create New Product", False, response_time, data.get("message", "Unknown error"))
                else:
                    error_msg = response.text if response else "No response"
                    self.log_test("Create New Product", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Lines for Products", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_clinic_management(self):
        """Test clinic management APIs"""
        print("\n🏥 TESTING CLINIC MANAGEMENT APIs")
        
        # Test get clinics
        response, response_time = self.make_request("GET", "/clinics")
        if response and response.status_code == 200:
            clinics = response.json()
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            
            # Analyze clinic data
            classifications = {}
            credit_statuses = {}
            for clinic in clinics if isinstance(clinics, list) else []:
                classification = clinic.get('classification', 'unknown')
                credit_status = clinic.get('credit_status', 'unknown')
                classifications[classification] = classifications.get(classification, 0) + 1
                credit_statuses[credit_status] = credit_statuses.get(credit_status, 0) + 1
            
            details = f"Found {clinic_count} clinics. Classifications: {dict(classifications)}"
            self.log_test("Get Clinics List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Clinics List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create clinic
        new_clinic_data = {
            "clinic_name": f"Test Clinic {int(time.time())}",
            "doctor_name": "Dr. Test Doctor",
            "phone": "01234567890",
            "address": "Test Address, Cairo",
            "specialization": "General Medicine",
            "latitude": 30.0444,
            "longitude": 31.2357
        }
        
        response, response_time = self.make_request("POST", "/clinics", new_clinic_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                details = f"Created clinic: {new_clinic_data['clinic_name']} - {new_clinic_data['doctor_name']}"
                self.log_test("Create New Clinic", True, response_time, details)
            else:
                self.log_test("Create New Clinic", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New Clinic", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_dashboard_data(self):
        """Test dashboard data APIs"""
        print("\n📊 TESTING DASHBOARD DATA APIs")
        
        # Test dashboard stats
        response, response_time = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 200:
            stats = response.json()
            details = f"Dashboard stats: Users: {stats.get('total_users', 'N/A')}, Products: {stats.get('total_products', 'N/A')}, Clinics: {stats.get('total_clinics', 'N/A')}"
            self.log_test("Dashboard Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Dashboard Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test visits data
        response, response_time = self.make_request("GET", "/visits")
        if response and response.status_code == 200:
            visits = response.json()
            visit_count = len(visits) if isinstance(visits, list) else 0
            details = f"Found {visit_count} visits in system"
            self.log_test("Get Visits Data", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Visits Data", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_lines_areas_management(self):
        """Test lines and areas management APIs"""
        print("\n🗺️ TESTING LINES & AREAS MANAGEMENT APIs")
        
        # Test get areas
        response, response_time = self.make_request("GET", "/areas")
        if response and response.status_code == 200:
            areas = response.json()
            area_count = len(areas) if isinstance(areas, list) else 0
            details = f"Found {area_count} areas in system"
            self.log_test("Get Areas List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Areas List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create area
        new_area_data = {
            "name": f"Test Area {int(time.time())}",
            "code": f"TA{int(time.time())}",
            "description": "Test area for Phase 1 UI testing",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/areas", new_area_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                area_info = data.get("area", {})
                details = f"Created area: {area_info.get('name', 'N/A')} ({area_info.get('code', 'N/A')})"
                self.log_test("Create New Area", True, response_time, details)
            else:
                self.log_test("Create New Area", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New Area", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_user_profile_apis(self):
        """Test user profile APIs for enhanced sidebar"""
        print("\n👤 TESTING USER PROFILE APIs")
        
        # First get current user ID from token or users list
        response, response_time = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            users = response.json()
            admin_user = None
            if isinstance(users, list):
                for user in users:
                    if user.get('role') == 'admin':
                        admin_user = user
                        break
            
            if admin_user:
                user_id = admin_user.get('id')
                # Test get user profile
                response, response_time = self.make_request("GET", f"/users/{user_id}/profile")
                if response and response.status_code == 200:
                    profile_data = response.json()
                    user_info = profile_data.get('user', {})
                    stats = user_info.get('user_stats', {})
                    details = f"Profile loaded for {user_info.get('full_name', 'N/A')} with stats: {len(stats)} sections"
                    self.log_test("Get User Profile", True, response_time, details)
                else:
                    error_msg = response.text if response else "No response"
                    self.log_test("Get User Profile", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
            else:
                self.log_test("Get User Profile", False, 0, "No admin user found to test profile")
        else:
            self.log_test("Get User Profile", False, response_time, "Could not get users list")

    def test_system_health(self):
        """Test system health and additional APIs"""
        print("\n🔧 TESTING SYSTEM HEALTH & ADDITIONAL APIs")
        
        # Test warehouses
        response, response_time = self.make_request("GET", "/warehouses")
        if response and response.status_code == 200:
            warehouses = response.json()
            warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
            details = f"Found {warehouse_count} active warehouses"
            self.log_test("Get Warehouses", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Warehouses", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test orders
        response, response_time = self.make_request("GET", "/orders")
        if response and response.status_code == 200:
            orders = response.json()
            order_count = len(orders) if isinstance(orders, list) else 0
            details = f"Found {order_count} orders in system"
            self.log_test("Get Orders", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Orders", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test doctors
        response, response_time = self.make_request("GET", "/doctors")
        if response and response.status_code == 200:
            doctors = response.json()
            doctor_count = len(doctors) if isinstance(doctors, list) else 0
            details = f"Found {doctor_count} doctors in system"
            self.log_test("Get Doctors", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Doctors", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 STARTING ENHANCED EP GROUP BACKEND TESTING - PHASE 1 UI SUPPORT")
        print(f"Backend URL: {self.base_url}")
        print("=" * 80)
        
        # Authentication is required for most tests
        if not self.test_authentication():
            print("❌ CRITICAL: Authentication failed. Cannot proceed with other tests.")
            return self.generate_report()
        
        # Run all test suites
        self.test_user_management()
        self.test_product_management()
        self.test_clinic_management()
        self.test_dashboard_data()
        self.test_lines_areas_management()
        self.test_user_profile_apis()
        self.test_system_health()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 ENHANCED BACKEND TESTING REPORT - PHASE 1 UI SUPPORT")
        print("=" * 80)
        print(f"🎯 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
        print(f"⏱️  Total Testing Time: {total_time:.2f} seconds")
        print(f"🚀 Average Response Time: {avg_response_time:.2f}ms")
        print(f"✅ Passed Tests: {passed_tests}")
        print(f"❌ Failed Tests: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ SUCCESSFUL TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}: {result['details']}")
        
        # Critical assessment for Phase 1 UI support
        critical_tests = [
            "Admin Login (admin/admin123)",
            "Get Users List", 
            "Get Products List",
            "Get Clinics List",
            "Dashboard Statistics"
        ]
        
        critical_passed = sum(1 for result in self.test_results 
                            if result["success"] and result["test"] in critical_tests)
        critical_total = len([r for r in self.test_results if r["test"] in critical_tests])
        
        print(f"\n🎯 CRITICAL APIS FOR PHASE 1 UI: {critical_passed}/{critical_total} working")
        
        if critical_passed == critical_total:
            print("🎉 EXCELLENT: All critical APIs are working! Backend is ready to support Phase 1 UI improvements.")
        elif critical_passed >= critical_total * 0.8:
            print("⚠️  GOOD: Most critical APIs working. Minor issues may affect some UI features.")
        else:
            print("🚨 CRITICAL: Major backend issues detected. Phase 1 UI may not function properly.")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "avg_response_time": avg_response_time,
            "critical_apis_working": critical_passed == critical_total,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    report = tester.run_all_tests()