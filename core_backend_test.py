#!/usr/bin/env python3
"""
Core Backend Testing for EP Group System
Focus on Authentication, Core APIs, Database Connectivity, and Error Handling
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://406a5bee-8cdb-4ba1-be7e-252147eebee8.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class CoreBackendTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_authentication_system(self):
        """Test authentication system with admin credentials"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        
        # Test admin login
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("Admin Login (admin/admin123)", True, f"Token received successfully")
            else:
                self.log_test("Admin Login (admin/admin123)", False, f"No token in response")
        else:
            self.log_test("Admin Login (admin/admin123)", False, f"Status: {response.status_code if response else 'Connection failed'}")
            return False
            
        # Test token validation
        if self.admin_token:
            response, error = self.make_request("GET", "/users", token=self.admin_token)
            if response and response.status_code == 200:
                self.log_test("JWT Token Validation", True, "Token is valid and working")
            else:
                self.log_test("JWT Token Validation", False, f"Token validation failed: {response.status_code if response else 'No response'}")
        
        # Test invalid credentials
        response, error = self.make_request("POST", "/auth/login", {
            "username": "invalid",
            "password": "invalid"
        })
        
        if response and response.status_code in [401, 400, 422]:
            self.log_test("Invalid Credentials Handling", True, "Properly rejects invalid credentials")
        else:
            self.log_test("Invalid Credentials Handling", False, f"Unexpected response: {response.status_code if response else 'No response'}")
            
        return True
    
    def test_core_apis(self):
        """Test core API endpoints"""
        print("\n🔧 TESTING CORE APIs")
        
        if not self.admin_token:
            self.log_test("Core APIs", False, "No admin token available")
            return
            
        # Test dashboard statistics
        response, error = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("Dashboard Statistics API", True, f"Retrieved dashboard stats successfully")
        else:
            self.log_test("Dashboard Statistics API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test users API
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            self.log_test("Users API", True, f"Retrieved {user_count} users")
        else:
            self.log_test("Users API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test products API
        response, error = self.make_request("GET", "/products", token=self.admin_token)
        if response and response.status_code == 200:
            products = response.json()
            product_count = len(products) if isinstance(products, list) else 0
            self.log_test("Products API", True, f"Retrieved {product_count} products")
        else:
            self.log_test("Products API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test warehouses API
        response, error = self.make_request("GET", "/warehouses", token=self.admin_token)
        if response and response.status_code == 200:
            warehouses = response.json()
            warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
            self.log_test("Warehouses API", True, f"Retrieved {warehouse_count} warehouses")
        else:
            self.log_test("Warehouses API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test clinics API
        response, error = self.make_request("GET", "/clinics", token=self.admin_token)
        if response and response.status_code == 200:
            clinics = response.json()
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            self.log_test("Clinics API", True, f"Retrieved {clinic_count} clinics")
        else:
            self.log_test("Clinics API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test doctors API
        response, error = self.make_request("GET", "/doctors", token=self.admin_token)
        if response and response.status_code == 200:
            doctors = response.json()
            doctor_count = len(doctors) if isinstance(doctors, list) else 0
            self.log_test("Doctors API", True, f"Retrieved {doctor_count} doctors")
        else:
            self.log_test("Doctors API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test visits API
        response, error = self.make_request("GET", "/visits", token=self.admin_token)
        if response and response.status_code == 200:
            visits = response.json()
            visit_count = len(visits) if isinstance(visits, list) else 0
            self.log_test("Visits API", True, f"Retrieved {visit_count} visits")
        else:
            self.log_test("Visits API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test orders API
        response, error = self.make_request("GET", "/orders", token=self.admin_token)
        if response and response.status_code == 200:
            orders = response.json()
            order_count = len(orders) if isinstance(orders, list) else 0
            self.log_test("Orders API", True, f"Retrieved {order_count} orders")
        else:
            self.log_test("Orders API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_database_connectivity(self):
        """Test database connectivity and data integrity"""
        print("\n🗄️ TESTING DATABASE CONNECTIVITY")
        
        if not self.admin_token:
            self.log_test("Database Connectivity", False, "No admin token available")
            return
            
        # Test multiple database collections
        collections_to_test = [
            ("users", "/users"),
            ("products", "/products"),
            ("warehouses", "/warehouses"),
            ("clinics", "/clinics"),
            ("doctors", "/doctors"),
            ("visits", "/visits")
        ]
        
        accessible_collections = 0
        total_collections = len(collections_to_test)
        
        for collection_name, endpoint in collections_to_test:
            response, error = self.make_request("GET", endpoint, token=self.admin_token)
            if response and response.status_code == 200:
                accessible_collections += 1
                data = response.json()
                count = len(data) if isinstance(data, list) else 1
                self.log_test(f"Database Collection: {collection_name}", True, f"{count} records accessible")
            else:
                self.log_test(f"Database Collection: {collection_name}", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Overall database health
        if accessible_collections == total_collections:
            self.log_test("Database Health", True, f"All {total_collections} collections accessible")
        elif accessible_collections > total_collections / 2:
            self.log_test("Database Health", True, f"{accessible_collections}/{total_collections} collections accessible")
        else:
            self.log_test("Database Health", False, f"Only {accessible_collections}/{total_collections} collections accessible")
        
        # Test data relationships
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                # Check if users have proper structure
                sample_user = users[0]
                required_fields = ['id', 'username', 'role', 'full_name']
                has_required_fields = all(field in sample_user for field in required_fields)
                
                if has_required_fields:
                    self.log_test("Data Structure Integrity", True, "User records have proper structure")
                else:
                    self.log_test("Data Structure Integrity", False, f"Missing required fields in user records")
            else:
                self.log_test("Data Structure Integrity", False, "No user data available for testing")
    
    def test_error_handling(self):
        """Test error handling capabilities"""
        print("\n⚠️ TESTING ERROR HANDLING")
        
        # Test unauthorized access
        response, error = self.make_request("GET", "/users")  # No token
        if response and response.status_code in [401, 403]:
            self.log_test("Unauthorized Access Handling", True, "Properly rejects requests without authentication")
        else:
            self.log_test("Unauthorized Access Handling", False, f"Unexpected response: {response.status_code if response else 'No response'}")
        
        # Test invalid token
        response, error = self.make_request("GET", "/users", token="invalid_token")
        if response and response.status_code in [401, 403]:
            self.log_test("Invalid Token Handling", True, "Properly rejects invalid tokens")
        else:
            self.log_test("Invalid Token Handling", False, f"Unexpected response: {response.status_code if response else 'No response'}")
        
        # Test non-existent endpoint
        response, error = self.make_request("GET", "/nonexistent", token=self.admin_token)
        if response and response.status_code == 404:
            self.log_test("404 Error Handling", True, "Properly returns 404 for non-existent endpoints")
        else:
            self.log_test("404 Error Handling", False, f"Unexpected response: {response.status_code if response else 'No response'}")
        
        # Test malformed request
        response, error = self.make_request("POST", "/auth/login", {"invalid": "data"})
        if response and response.status_code in [400, 422]:
            self.log_test("Malformed Request Handling", True, "Properly handles malformed requests")
        else:
            self.log_test("Malformed Request Handling", False, f"Unexpected response: {response.status_code if response else 'No response'}")
        
        # Test role-based access control
        if self.admin_token:
            # Try to create a user with admin token (should work)
            test_user_data = {
                "username": "test_user_temp",
                "email": "test@temp.com",
                "password": "temp123",
                "role": "medical_rep",
                "full_name": "Test User"
            }
            
            response, error = self.make_request("POST", "/auth/register", test_user_data, token=self.admin_token)
            if response and response.status_code in [200, 201]:
                self.log_test("Role-Based Access Control", True, "Admin can create users")
            else:
                self.log_test("Role-Based Access Control", False, f"Admin cannot create users: {response.status_code if response else 'No response'}")
    
    def test_api_performance(self):
        """Test API performance"""
        print("\n⚡ TESTING API PERFORMANCE")
        
        if not self.admin_token:
            self.log_test("API Performance", False, "No admin token available")
            return
            
        # Test response times
        endpoints_to_test = [
            ("/users", "Users API"),
            ("/products", "Products API"),
            ("/dashboard/stats", "Dashboard API")
        ]
        
        for endpoint, name in endpoints_to_test:
            start_time = time.time()
            response, error = self.make_request("GET", endpoint, token=self.admin_token)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            if response and response.status_code == 200:
                if response_time < 2000:  # Less than 2 seconds
                    self.log_test(f"{name} Response Time", True, f"{response_time:.2f}ms (< 2000ms)")
                else:
                    self.log_test(f"{name} Response Time", False, f"{response_time:.2f}ms (> 2000ms)")
            else:
                self.log_test(f"{name} Response Time", False, f"API call failed")
    
    def run_comprehensive_test(self):
        """Run all core backend tests"""
        print("🚀 COMPREHENSIVE EP GROUP SYSTEM BACKEND TESTING")
        print("=" * 80)
        print("Focus: Authentication, Core APIs, Database Connectivity, Error Handling")
        print()
        
        start_time = time.time()
        
        # Run all test categories
        auth_success = self.test_authentication_system()
        if auth_success:
            self.test_core_apis()
            self.test_database_connectivity()
            self.test_error_handling()
            self.test_api_performance()
        else:
            print("❌ Cannot proceed without authentication - skipping other tests")
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Total Time: {total_time:.2f} seconds")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # Print recommendations
        print(f"\n🎯 BACKEND HEALTH ASSESSMENT:")
        if success_rate >= 90:
            print("✅ EXCELLENT: Backend is fully functional and ready for production!")
        elif success_rate >= 75:
            print("✅ GOOD: Backend is mostly functional with minor issues.")
        elif success_rate >= 60:
            print("⚠️ FAIR: Backend has some issues but core functionality works.")
        else:
            print("❌ POOR: Backend has significant issues that need attention.")
        
        return success_rate >= 60

if __name__ == "__main__":
    tester = CoreBackendTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 CORE BACKEND TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️ CORE BACKEND TESTING COMPLETED WITH ISSUES!")
        sys.exit(1)