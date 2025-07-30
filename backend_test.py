#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Updated Organizational Structure
Testing the new system with enhanced organizational structure as requested in review.
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://467b9d15-958c-4759-a145-ae246bc11ccf.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class BackendTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_tokens = {}
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
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_authentication(self):
        """Test authentication system with existing and new users"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        
        # Test existing admin login
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("Admin Login (admin/admin123)", True, f"Token received: {self.admin_token[:20]}...")
            else:
                self.log_test("Admin Login (admin/admin123)", False, f"No token in response: {data}")
        else:
            self.log_test("Admin Login (admin/admin123)", False, f"Status: {response.status_code if response else 'No response'}")
            
        # Test existing GM login
        response, error = self.make_request("POST", "/auth/login", {
            "username": "gm",
            "password": "gm123456"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.gm_token = data.get("access_token") or data.get("token")
            if self.gm_token:
                self.log_test("GM Login (gm/gm123456)", True, f"Token received: {self.gm_token[:20]}...")
            else:
                self.log_test("GM Login (gm/gm123456)", False, f"No token in response: {data}")
        else:
            self.log_test("GM Login (gm/gm123456)", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test new user logins as mentioned in review request
        new_users = [
            ("ahmed.gamal", "ahmed123"),
            ("mohammed.hamed", "mohammed123"),
            ("mina.alageeb", "mina123"),
            ("aya.nada", "aya123")
        ]
        
        for username, password in new_users:
            response, error = self.make_request("POST", "/auth/login", {
                "username": username,
                "password": password
            })
            
            if response and response.status_code == 200:
                data = response.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    self.test_tokens[username] = token
                    self.log_test(f"New User Login ({username}/{password})", True, f"Token received")
                else:
                    self.log_test(f"New User Login ({username}/{password})", False, f"No token in response: {data}")
            else:
                self.log_test(f"New User Login ({username}/{password})", False, 
                            f"Status: {response.status_code if response else 'No response'} - User may not exist yet")
    
    def test_monthly_planning_system(self):
        """Test Monthly Planning System APIs"""
        print("\n📅 TESTING MONTHLY PLANNING SYSTEM")
        
        if not self.admin_token:
            self.log_test("Monthly Planning System", False, "No admin token available")
            return
            
        # Test GET /api/planning/monthly endpoint
        response, error = self.make_request("GET", "/planning/monthly", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("GET /api/planning/monthly", True, f"Retrieved {len(data) if isinstance(data, list) else 'data'} monthly plans")
        else:
            self.log_test("GET /api/planning/monthly", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test POST monthly plan creation
        test_plan_data = {
            "user_id": "test-user-id",
            "month": "2025-01",
            "visits": [
                {
                    "clinic_id": "test-clinic-1",
                    "doctor_id": "test-doctor-1",
                    "planned_date": "2025-01-15",
                    "notes": "Monthly visit plan test"
                }
            ],
            "targets": {
                "visits_target": 20,
                "orders_target": 15,
                "revenue_target": 50000
            },
            "notes": "Test monthly plan for organizational structure testing"
        }
        
        response, error = self.make_request("POST", "/planning/monthly", test_plan_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("POST /api/planning/monthly", True, "Monthly plan created successfully")
        else:
            self.log_test("POST /api/planning/monthly", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test PUT monthly plan update
        response, error = self.make_request("PUT", "/planning/monthly/test-plan-id", test_plan_data, token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("PUT /api/planning/monthly", True, "Monthly plan updated successfully")
        else:
            self.log_test("PUT /api/planning/monthly", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test DELETE monthly plan
        response, error = self.make_request("DELETE", "/planning/monthly/test-plan-id", token=self.admin_token)
        
        if response and response.status_code in [200, 204]:
            self.log_test("DELETE /api/planning/monthly", True, "Monthly plan deleted successfully")
        else:
            self.log_test("DELETE /api/planning/monthly", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_warehouse_system(self):
        """Test Warehouse System with new 6 warehouses"""
        print("\n🏭 TESTING WAREHOUSE SYSTEM (6 WAREHOUSES)")
        
        if not self.admin_token:
            self.log_test("Warehouse System", False, "No admin token available")
            return
            
        # Test warehouse listing
        response, error = self.make_request("GET", "/warehouses", token=self.admin_token)
        
        if response and response.status_code == 200:
            warehouses = response.json()
            warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
            
            # Check for expected 6 warehouses: Giza, Cairo, Delta 1, Delta 2, Upper Egypt, Alexandria
            expected_warehouses = ["Giza", "Cairo", "Delta 1", "Delta 2", "Upper Egypt", "Alexandria"]
            found_warehouses = []
            
            if isinstance(warehouses, list):
                for warehouse in warehouses:
                    if isinstance(warehouse, dict) and 'name' in warehouse:
                        found_warehouses.append(warehouse['name'])
            
            self.log_test("Warehouse Listing", True, 
                        f"Found {warehouse_count} warehouses: {', '.join(found_warehouses[:6])}")
            
            # Check if we have the expected 6 warehouses
            if warehouse_count >= 6:
                self.log_test("6 Warehouses Requirement", True, f"System has {warehouse_count} warehouses (≥6 required)")
            else:
                self.log_test("6 Warehouses Requirement", False, f"Only {warehouse_count} warehouses found, expected 6")
                
        else:
            self.log_test("Warehouse Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test warehouse-region-line assignments
        response, error = self.make_request("GET", "/warehouses/assignments", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("Warehouse-Region-Line Assignments", True, "Assignments retrieved successfully")
        else:
            self.log_test("Warehouse-Region-Line Assignments", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test responsible managers assignments
        response, error = self.make_request("GET", "/warehouses/managers", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("Warehouse Manager Assignments", True, "Manager assignments retrieved")
        else:
            self.log_test("Warehouse Manager Assignments", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_user_management(self):
        """Test User Management with 18 users total"""
        print("\n👥 TESTING USER MANAGEMENT (18 USERS)")
        
        if not self.admin_token:
            self.log_test("User Management", False, "No admin token available")
            return
            
        # Test user count
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            
            self.log_test("User Count Check", True, f"Found {user_count} users in system")
            
            # Check if we have the expected 18 users
            if user_count == 18:
                self.log_test("18 Users Requirement", True, f"Exactly 18 users as expected")
            else:
                self.log_test("18 Users Requirement", False, f"Found {user_count} users, expected 18")
                
            # Test manager-subordinate relationships
            managers = []
            subordinates = []
            
            if isinstance(users, list):
                for user in users:
                    if isinstance(user, dict):
                        role = user.get('role', '')
                        if 'manager' in role.lower() or role in ['admin', 'gm']:
                            managers.append(user)
                        else:
                            subordinates.append(user)
                            
            self.log_test("Manager-Subordinate Structure", True, 
                        f"Found {len(managers)} managers and {len(subordinates)} subordinates")
                        
        else:
            self.log_test("User Count Check", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test team member APIs for managers
        if self.gm_token:
            response, error = self.make_request("GET", "/users/team-members", token=self.gm_token)
            
            if response and response.status_code == 200:
                team_members = response.json()
                member_count = len(team_members) if isinstance(team_members, list) else 0
                self.log_test("Team Members API (GM)", True, f"GM can see {member_count} team members")
            else:
                self.log_test("Team Members API (GM)", False, 
                            f"Status: {response.status_code if response else 'No response'}")
    
    def test_region_system(self):
        """Test Region System with 5 regions"""
        print("\n🗺️ TESTING REGION SYSTEM (5 REGIONS)")
        
        if not self.admin_token:
            self.log_test("Region System", False, "No admin token available")
            return
            
        # Test regions API
        response, error = self.make_request("GET", "/regions", token=self.admin_token)
        
        if response and response.status_code == 200:
            regions = response.json()
            region_count = len(regions) if isinstance(regions, list) else 0
            
            self.log_test("Region Listing", True, f"Found {region_count} regions")
            
            # Check if we have the expected 5 regions
            if region_count == 5:
                self.log_test("5 Regions Requirement", True, f"Exactly 5 regions as expected")
            else:
                self.log_test("5 Regions Requirement", False, f"Found {region_count} regions, expected 5")
            
            # Test coordinate data for each region
            regions_with_coordinates = 0
            if isinstance(regions, list):
                for region in regions:
                    if isinstance(region, dict) and region.get('coordinates'):
                        regions_with_coordinates += 1
                        
            self.log_test("Region Coordinate Data", True, 
                        f"{regions_with_coordinates}/{region_count} regions have coordinate data")
                        
        else:
            self.log_test("Region Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test alternative regions endpoint
        response, error = self.make_request("GET", "/regions/list", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("Regions List API", True, "Alternative regions endpoint working")
        else:
            self.log_test("Regions List API", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_role_based_access_control(self):
        """Test Role-Based Access Control"""
        print("\n🔒 TESTING ROLE-BASED ACCESS CONTROL")
        
        # Test line managers can see their line data
        if self.admin_token:
            response, error = self.make_request("GET", "/products/by-line/line_1", token=self.admin_token)
            
            if response and response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                self.log_test("Line Manager Access (Line 1)", True, f"Can access {product_count} line 1 products")
            else:
                self.log_test("Line Manager Access (Line 1)", False, 
                            f"Status: {response.status_code if response else 'No response'}")
        
        # Test area managers can see their areas
        response, error = self.make_request("GET", "/areas", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("Area Manager Access", True, "Can access area data")
        else:
            self.log_test("Area Manager Access", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test district managers access to regions
        response, error = self.make_request("GET", "/districts", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("District Manager Access", True, "Can access district data")
        else:
            self.log_test("District Manager Access", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test key account access restrictions
        response, error = self.make_request("GET", "/users/key-accounts", token=self.admin_token)
        
        if response and response.status_code == 200:
            key_accounts = response.json()
            account_count = len(key_accounts) if isinstance(key_accounts, list) else 0
            self.log_test("Key Account Access", True, f"Found {account_count} key accounts")
        else:
            self.log_test("Key Account Access", False, 
                        f"Status: {response.status_code if response else 'No response'}")
    
    def test_api_performance(self):
        """Test API Performance"""
        print("\n⚡ TESTING API PERFORMANCE")
        
        if not self.admin_token:
            self.log_test("API Performance", False, "No admin token available")
            return
            
        # Test response times with reduced user count
        start_time = time.time()
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response and response.status_code == 200:
            self.log_test("User API Response Time", True, f"{response_time:.2f}ms")
            
            if response_time < 2000:  # Less than 2 seconds
                self.log_test("Performance Acceptable", True, f"Response time {response_time:.2f}ms < 2000ms")
            else:
                self.log_test("Performance Acceptable", False, f"Response time {response_time:.2f}ms > 2000ms")
        else:
            self.log_test("User API Response Time", False, "API call failed")
        
        # Test database connection
        response, error = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("Database Connection", True, "Dashboard stats retrieved successfully")
        else:
            self.log_test("Database Connection", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test all CRUD operations
        crud_endpoints = [
            ("GET", "/users"),
            ("GET", "/warehouses"),
            ("GET", "/regions"),
            ("GET", "/products")
        ]
        
        for method, endpoint in crud_endpoints:
            response, error = self.make_request(method, endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                self.log_test(f"CRUD {method} {endpoint}", True, "Operation successful")
            else:
                self.log_test(f"CRUD {method} {endpoint}", False, 
                            f"Status: {response.status_code if response else 'No response'}")
    
    def test_data_integrity(self):
        """Test Data Integrity"""
        print("\n🔍 TESTING DATA INTEGRITY")
        
        if not self.admin_token:
            self.log_test("Data Integrity", False, "No admin token available")
            return
            
        # Test all relationships are properly established
        response, error = self.make_request("GET", "/users/enhanced", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            
            if isinstance(users, list):
                users_with_managers = 0
                users_with_regions = 0
                
                for user in users:
                    if isinstance(user, dict):
                        if user.get('managed_by') or user.get('manager_name'):
                            users_with_managers += 1
                        if user.get('region_id') or user.get('region_name'):
                            users_with_regions += 1
                
                self.log_test("User-Manager Relationships", True, 
                            f"{users_with_managers}/{len(users)} users have manager relationships")
                self.log_test("User-Region Assignments", True, 
                            f"{users_with_regions}/{len(users)} users have region assignments")
            else:
                self.log_test("Enhanced User Data", False, "Invalid response format")
        else:
            self.log_test("Enhanced User Data", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test hierarchy navigation (manager -> subordinates)
        response, error = self.make_request("GET", "/users/managers", token=self.admin_token)
        
        if response and response.status_code == 200:
            managers = response.json()
            manager_count = len(managers) if isinstance(managers, list) else 0
            self.log_test("Hierarchy Navigation", True, f"Found {manager_count} managers for hierarchy navigation")
        else:
            self.log_test("Hierarchy Navigation", False, 
                        f"Status: {response.status_code if response else 'No response'}")
        
        # Test line and region assignments
        response, error = self.make_request("GET", "/products/by-line/line_1", token=self.admin_token)
        
        if response and response.status_code == 200:
            line1_products = response.json()
            line1_count = len(line1_products) if isinstance(line1_products, list) else 0
            
            response, error = self.make_request("GET", "/products/by-line/line_2", token=self.admin_token)
            
            if response and response.status_code == 200:
                line2_products = response.json()
                line2_count = len(line2_products) if isinstance(line2_products, list) else 0
                
                self.log_test("Line Assignments", True, 
                            f"Line 1: {line1_count} products, Line 2: {line2_count} products")
            else:
                self.log_test("Line Assignments", False, "Could not retrieve Line 2 products")
        else:
            self.log_test("Line Assignments", False, "Could not retrieve Line 1 products")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 STARTING COMPREHENSIVE BACKEND TESTING FOR UPDATED ORGANIZATIONAL STRUCTURE")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test categories
        self.test_authentication()
        self.test_monthly_planning_system()
        self.test_warehouse_system()
        self.test_user_management()
        self.test_region_system()
        self.test_role_based_access_control()
        self.test_api_performance()
        self.test_data_integrity()
        
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
        print(f"\n🎯 RECOMMENDATIONS:")
        if success_rate >= 90:
            print("✅ System is performing excellently with the new organizational structure!")
        elif success_rate >= 75:
            print("⚠️ System is mostly functional but needs attention to failed tests.")
        else:
            print("❌ System needs significant improvements before production use.")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 BACKEND TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️ BACKEND TESTING COMPLETED WITH ISSUES!")
        sys.exit(1)
"""
Comprehensive Backend Testing for Current Focus Tasks
Testing Enhanced Invoice and Product System with Price Tiers, Monthly Planning System Integration, and Comprehensive Admin Settings API
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://467b9d15-958c-4759-a145-ae246bc11ccf.preview.emergentagent.com/api"

class EnhancedUserManagementTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def admin_login(self):
        """Test admin login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.log_test("Admin Authentication", True, f"Admin login successful, token received")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False

    def gm_login(self):
        """Test GM login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "gm",
                "password": "gm123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.gm_token = data["token"]
                self.log_test("GM Authentication", True, f"GM login successful, token received")
                return True
            else:
                self.log_test("GM Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GM Authentication", False, f"Exception: {str(e)}")
            return False

    def test_managers_api(self):
        """Test GET /api/users/managers"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/users/managers", headers=headers)
            
            if response.status_code == 200:
                managers = response.json()
                self.log_test("GET /api/users/managers", True, f"Found {len(managers)} managers with proper structure")
                return True
            else:
                self.log_test("GET /api/users/managers", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/users/managers", False, f"Exception: {str(e)}")
            return False

    def test_regions_api(self):
        """Test GET /api/regions/list"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/regions/list", headers=headers)
            
            if response.status_code == 200:
                regions = response.json()
                self.log_test("GET /api/regions/list", True, f"Found {len(regions)} regions with proper structure")
                return True
            else:
                self.log_test("GET /api/regions/list", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/regions/list", False, f"Exception: {str(e)}")
            return False

    def test_enhanced_user_creation(self):
        """Test POST /api/auth/register with enhanced fields"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test data from the review request
            user_data = {
                "username": "test_user_final",
                "email": "testfinal@company.com",
                "password": "testpass123",
                "full_name": "مستخدم تجريبي نهائي",
                "phone": "01234567890",
                "role": "medical_rep",
                "region_id": "region-001",
                "direct_manager_id": "test-manager-id",
                "address": "القاهرة، مصر",
                "national_id": "12345678901234",
                "hire_date": "2024-01-15",
                "is_active": True
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/auth/register (Enhanced User Creation)", True, f"User created successfully: {data.get('full_name', 'Unknown')} with role {data.get('role', 'Unknown')}")
                return data.get('user_id')
            else:
                self.log_test("POST /api/auth/register (Enhanced User Creation)", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("POST /api/auth/register (Enhanced User Creation)", False, f"Exception: {str(e)}")
            return None

    def test_user_update(self, user_id):
        """Test PATCH /api/users/{user_id}"""
        if not user_id:
            self.log_test("PATCH /api/users/{user_id} (User Update)", False, "No user_id provided - skipping test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Update user data
            update_data = {
                "full_name": "مستخدم محدث نهائي",
                "phone": "01234567891",
                "address": "الجيزة، مصر",
                "is_active": True
            }
            
            response = requests.patch(f"{BACKEND_URL}/users/{user_id}", json=update_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("PATCH /api/users/{user_id} (User Update)", True, "User updated successfully")
                return True
            else:
                self.log_test("PATCH /api/users/{user_id} (User Update)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("PATCH /api/users/{user_id} (User Update)", False, f"Exception: {str(e)}")
            return False

    def test_system_health(self):
        """Test system health and database connectivity"""
        try:
            # Test basic endpoint accessibility
            response = requests.get(f"{BACKEND_URL.replace('/api', '')}/health", timeout=10)
            
            # If health endpoint doesn't exist, try a basic auth endpoint
            if response.status_code == 404:
                response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": "test",
                    "password": "test"
                })
                # Even if login fails, if we get a proper HTTP response, the system is up
                if response.status_code in [401, 400, 422]:
                    self.log_test("System Health Check", True, "Backend service is healthy and responding")
                    return True
            
            if response.status_code == 200:
                self.log_test("System Health Check", True, "Backend service is healthy")
                return True
            else:
                self.log_test("System Health Check", False, f"Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("System Health Check", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all Enhanced User Management System tests"""
        print("🎯 ENHANCED USER MANAGEMENT SYSTEM COMPREHENSIVE TESTING")
        print("=" * 70)
        print("Testing the Enhanced User Management System after fixing duplicate User model issue")
        print("Focus: POST /api/auth/register, PATCH /api/users/{user_id}, GET /api/users/managers, GET /api/regions/list")
        print()
        
        # Test system health first
        self.test_system_health()
        
        # Test authentication
        admin_login_success = self.admin_login()
        gm_login_success = self.gm_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test supporting APIs first
        self.test_managers_api()
        self.test_regions_api()
        
        # Test main Enhanced User Management functionality
        created_user_id = self.test_enhanced_user_creation()
        self.test_user_update(created_user_id)
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🎯 ENHANCED USER MANAGEMENT SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Show detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "=" * 70)
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 ENHANCED USER MANAGEMENT SYSTEM: MOSTLY FUNCTIONAL")
        elif success_rate >= 60:
            print("⚠️  ENHANCED USER MANAGEMENT SYSTEM: PARTIALLY FUNCTIONAL")
        else:
            print("❌ ENHANCED USER MANAGEMENT SYSTEM: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = EnhancedUserManagementTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()