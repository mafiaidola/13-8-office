#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Authentication Fix Verification
Testing all core system APIs to ensure 100% backend functionality
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class BackendTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """Log test results"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": f"{response_time:.2f}ms",
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {response_time:.2f}ms - {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
            
        try:
            start_time = time.time()
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = (time.time() - start_time) * 1000
            return response, response_time
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time
    
    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        
        # Test admin login
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD,
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "Cairo",
                "country": "Egypt",
                "accuracy": 10
            },
            "device_info": "Backend Test Client",
            "ip_address": "127.0.0.1"
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.token = data.get("access_token")
            user_info = data.get("user", {})
            details = f"User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
            self.log_test("Admin Login (admin/admin123)", True, response_time, details)
            return True
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Admin Login (admin/admin123)", False, response_time, f"Error: {error_msg}")
            return False
    
    def test_user_management_apis(self):
        """Test user management CRUD operations"""
        print("\n👥 TESTING USER MANAGEMENT APIs")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test GET /api/users
        response, response_time = self.make_request("GET", "/users", headers=headers)
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            self.log_test("GET /api/users", True, response_time, f"Found {user_count} users")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("GET /api/users", False, response_time, f"Error: {error_msg}")
        
        # Test POST /api/users (Create new user)
        test_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123456",
            "full_name": "Test User for Backend Verification",
            "role": "medical_rep",
            "email": f"test_{int(time.time())}@test.com",
            "phone": "+201234567890",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/users", test_user_data, headers)
        if response and response.status_code in [200, 201]:
            data = response.json()
            test_user_id = data.get("id") or data.get("user_id")
            self.log_test("POST /api/users (Create User)", True, response_time, f"Created user ID: {test_user_id}")
            
            # Test PUT /api/users/{id} (Update user)
            if test_user_id:
                update_data = {
                    "full_name": "Updated Test User",
                    "email": f"updated_{int(time.time())}@test.com"
                }
                response, response_time = self.make_request("PUT", f"/users/{test_user_id}", update_data, headers)
                if response and response.status_code == 200:
                    self.log_test("PUT /api/users/{id} (Update User)", True, response_time, "User updated successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("PUT /api/users/{id} (Update User)", False, response_time, f"Error: {error_msg}")
                
                # Test DELETE /api/users/{id} (Delete user)
                response, response_time = self.make_request("DELETE", f"/users/{test_user_id}", headers=headers)
                if response and response.status_code in [200, 204]:
                    self.log_test("DELETE /api/users/{id} (Delete User)", True, response_time, "User deleted successfully")
                else:
                    error_msg = response.text if response else "Connection failed"
                    self.log_test("DELETE /api/users/{id} (Delete User)", False, response_time, f"Error: {error_msg}")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("POST /api/users (Create User)", False, response_time, f"Error: {error_msg}")
    
    def test_core_system_apis(self):
        """Test all core system APIs"""
        print("\n🏥 TESTING CORE SYSTEM APIs")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Core endpoints to test
        core_endpoints = [
            ("/health", "Health Check"),
            ("/products", "Products Management"),
            ("/clinics", "Clinics Management"),
            ("/lines", "Lines Management"),
            ("/areas", "Areas Management"),
            ("/dashboard/stats/admin", "Admin Dashboard Stats"),
            ("/dashboard/widgets/admin", "Admin Dashboard Widgets")
        ]
        
        for endpoint, name in core_endpoints:
            response, response_time = self.make_request("GET", endpoint, headers=headers)
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"Found {len(data)} items"
                elif isinstance(data, dict):
                    details = f"Data keys: {list(data.keys())[:5]}"
                else:
                    details = "Data received"
                self.log_test(f"GET /api{endpoint} ({name})", True, response_time, details)
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"GET /api{endpoint} ({name})", False, response_time, f"Error: {error_msg}")
    
    def test_activity_tracking_apis(self):
        """Test activity tracking and logging APIs"""
        print("\n📊 TESTING ACTIVITY TRACKING APIs")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test activities endpoint
        response, response_time = self.make_request("GET", "/activities", headers=headers)
        if response and response.status_code == 200:
            activities = response.json()
            activity_count = len(activities) if isinstance(activities, list) else 0
            self.log_test("GET /api/activities", True, response_time, f"Found {activity_count} activities")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("GET /api/activities", False, response_time, f"Error: {error_msg}")
        
        # Test activities with filters
        filters = [
            ("?activity_type=login", "Login Activities Filter"),
            ("?time_filter=today", "Today Activities Filter"),
            ("?limit=10", "Limited Activities")
        ]
        
        for filter_param, filter_name in filters:
            response, response_time = self.make_request("GET", f"/activities{filter_param}", headers=headers)
            if response and response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else 0
                self.log_test(f"GET /api/activities{filter_param} ({filter_name})", True, response_time, f"Found {count} items")
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"GET /api/activities{filter_param} ({filter_name})", False, response_time, f"Error: {error_msg}")
    
    def test_financial_system_apis(self):
        """Test invoice management and debt system APIs"""
        print("\n💰 TESTING FINANCIAL SYSTEM APIs")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Financial endpoints to test
        financial_endpoints = [
            ("/invoices", "Invoices Management"),
            ("/invoices/statistics/overview", "Invoice Statistics"),
            ("/debts", "Debts Management"),
            ("/debts/statistics/overview", "Debt Statistics")
        ]
        
        for endpoint, name in financial_endpoints:
            response, response_time = self.make_request("GET", endpoint, headers=headers)
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"Found {len(data)} items"
                elif isinstance(data, dict):
                    key_count = len(data.keys())
                    details = f"Data structure with {key_count} keys"
                else:
                    details = "Data received"
                self.log_test(f"GET /api{endpoint} ({name})", True, response_time, details)
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"GET /api{endpoint} ({name})", False, response_time, f"Error: {error_msg}")
    
    def test_visits_management_apis(self):
        """Test visits management system"""
        print("\n🏥 TESTING VISITS MANAGEMENT APIs")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Visits endpoints to test
        visits_endpoints = [
            ("/visits/dashboard/overview", "Visits Dashboard Overview"),
            ("/visits/list", "Visits List"),
            ("/visits/stats/representatives", "Representatives Stats")
        ]
        
        for endpoint, name in visits_endpoints:
            response, response_time = self.make_request("GET", endpoint, headers=headers)
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"Found {len(data)} items"
                elif isinstance(data, dict):
                    details = f"Data keys: {list(data.keys())[:3]}"
                else:
                    details = "Data received"
                self.log_test(f"GET /api{endpoint} ({name})", True, response_time, details)
            else:
                error_msg = response.text if response else "Connection failed"
                self.log_test(f"GET /api{endpoint} ({name})", False, response_time, f"Error: {error_msg}")
    
    def test_enhanced_clinic_registration(self):
        """Test enhanced clinic registration system"""
        print("\n🏥 TESTING ENHANCED CLINIC REGISTRATION")
        
        if not self.token:
            print("❌ No authentication token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test form data endpoint
        response, response_time = self.make_request("GET", "/enhanced-clinics/registration/form-data", headers=headers)
        if response and response.status_code == 200:
            data = response.json()
            lines_count = len(data.get("lines", []))
            areas_count = len(data.get("areas", []))
            classifications_count = len(data.get("clinic_classifications", []))
            details = f"Lines: {lines_count}, Areas: {areas_count}, Classifications: {classifications_count}"
            self.log_test("GET /api/enhanced-clinics/registration/form-data", True, response_time, details)
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("GET /api/enhanced-clinics/registration/form-data", False, response_time, f"Error: {error_msg}")
        
        # Test enhanced clinics list
        response, response_time = self.make_request("GET", "/enhanced-clinics", headers=headers)
        if response and response.status_code == 200:
            clinics = response.json()
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            self.log_test("GET /api/enhanced-clinics", True, response_time, f"Found {clinic_count} enhanced clinics")
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("GET /api/enhanced-clinics", False, response_time, f"Error: {error_msg}")
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        
        print(f"\n{'='*80}")
        print(f"🎯 COMPREHENSIVE BACKEND TESTING COMPLETE")
        print(f"{'='*80}")
        print(f"📊 FINAL RESULTS:")
        print(f"   • Total Tests: {total_tests}")
        print(f"   • Successful: {successful_tests}")
        print(f"   • Failed: {total_tests - successful_tests}")
        print(f"   • Success Rate: {success_rate:.1f}%")
        print(f"   • Total Time: {total_time:.2f}s")
        
        if successful_tests > 0:
            avg_response_time = sum(float(result["response_time"].replace("ms", "")) 
                                  for result in self.test_results if result["success"]) / successful_tests
            print(f"   • Average Response Time: {avg_response_time:.2f}ms")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}: {result['response_time']} - {result['details']}")
        
        # System readiness assessment
        print(f"\n🎯 SYSTEM READINESS ASSESSMENT:")
        if success_rate >= 95:
            print("   🟢 EXCELLENT - System is fully ready for production")
        elif success_rate >= 85:
            print("   🟡 GOOD - System is ready with minor issues")
        elif success_rate >= 70:
            print("   🟠 FAIR - System needs improvements before production")
        else:
            print("   🔴 POOR - System requires significant fixes")
        
        return success_rate >= 85

def main():
    """Main testing function"""
    print("🚀 STARTING COMPREHENSIVE BACKEND TESTING FOR AUTHENTICATION FIX VERIFICATION")
    print("=" * 80)
    
    tester = BackendTester()
    
    # Run all test suites
    if tester.test_authentication():
        tester.test_user_management_apis()
        tester.test_core_system_apis()
        tester.test_activity_tracking_apis()
        tester.test_financial_system_apis()
        tester.test_visits_management_apis()
        tester.test_enhanced_clinic_registration()
    else:
        print("❌ Authentication failed - cannot proceed with other tests")
    
    # Generate final report
    system_ready = tester.generate_report()
    
    if system_ready:
        print("\n🎉 BACKEND SYSTEM IS READY FOR FRONTEND AUTHENTICATION FIXES!")
    else:
        print("\n⚠️ BACKEND SYSTEM NEEDS ATTENTION BEFORE PROCEEDING!")
    
    return system_ready

if __name__ == "__main__":
    main()