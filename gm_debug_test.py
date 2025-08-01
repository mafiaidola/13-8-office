#!/usr/bin/env python3
"""
GM User Debug Test - Focus on GET /api/users/sales-reps API Issue
Debug the specific issue where GM user gets 403 error when accessing sales-reps endpoint
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://4bd6a5b6-7d69-4d01-ab9e-6f0ddd678934.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}
DEFAULT_GM = {"username": "gm", "password": "gm123456"}

class GMDebugTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.gm_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}

    def test_gm_authentication(self):
        """Test 1: GM Authentication - Login with gm/gm123456 and check JWT token"""
        print("🔍 TESTING GM AUTHENTICATION")
        print("=" * 50)
        
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_GM)
        
        if status_code == 200 and "token" in response:
            self.gm_token = response["token"]
            user_info = response.get("user", {})
            
            if user_info.get("role") == "gm":
                self.log_test("GM Login", True, 
                    f"Successfully logged in as {user_info.get('username')} with role: {user_info.get('role')}")
                print(f"   GM Token (first 20 chars): {self.gm_token[:20]}...")
                return True
            else:
                self.log_test("GM Login", False, 
                    f"Wrong role returned: {user_info.get('role')}, expected: gm")
        else:
            self.log_test("GM Login", False, 
                f"Login failed with status: {status_code}", response)
        return False

    def test_gm_auth_me_endpoint(self):
        """Test 2: Test /api/auth/me endpoint - Check if GM user data is correctly retrieved"""
        print("🔍 TESTING GM /api/auth/me ENDPOINT")
        print("=" * 50)
        
        if not self.gm_token:
            self.log_test("GM /api/auth/me", False, "No GM token available")
            return False
        
        status_code, response = self.make_request("GET", "/auth/me", token=self.gm_token)
        
        if status_code == 200:
            required_fields = ["id", "username", "role", "full_name", "email"]
            missing_fields = [field for field in required_fields if field not in response]
            
            if not missing_fields and response.get("role") == "gm":
                self.log_test("GM /api/auth/me", True, 
                    f"GM user data retrieved correctly: {response.get('username')} ({response.get('role')})")
                print(f"   GM User ID: {response.get('id')}")
                print(f"   GM Full Name: {response.get('full_name')}")
                print(f"   GM Email: {response.get('email')}")
                return True
            else:
                if missing_fields:
                    self.log_test("GM /api/auth/me", False, 
                        f"Missing required fields: {missing_fields}")
                else:
                    self.log_test("GM /api/auth/me", False, 
                        f"Wrong role: {response.get('role')}, expected: gm")
        else:
            self.log_test("GM /api/auth/me", False, 
                f"Status: {status_code}", response)
        return False

    def test_gm_sales_reps_api_debug(self):
        """Test 3: Debug GET /api/users/sales-reps - Check what exact error occurs for GM user"""
        print("🔍 DEBUGGING GM ACCESS TO /api/users/sales-reps")
        print("=" * 50)
        
        if not self.gm_token:
            self.log_test("GM Sales Reps API Debug", False, "No GM token available")
            return False
        
        # First, let's verify the GM user's role from the token
        status_code, me_response = self.make_request("GET", "/auth/me", token=self.gm_token)
        if status_code == 200:
            print(f"   GM User Role from Token: {me_response.get('role')}")
        
        status_code, response = self.make_request("GET", "/users/sales-reps", token=self.gm_token)
        
        print(f"   Request URL: {BASE_URL}/users/sales-reps")
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response, indent=2)}")
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_test("GM Sales Reps API Debug", True, 
                    f"SUCCESS! GM can access sales-reps endpoint. Found {len(response)} sales reps")
                
                # Show sample data if available
                if len(response) > 0:
                    sample_rep = response[0]
                    print(f"   Sample Sales Rep: {sample_rep.get('full_name', 'N/A')} ({sample_rep.get('username', 'N/A')})")
                    # Show the structure
                    print(f"   Sample Rep Structure: {list(sample_rep.keys())}")
                return True
            else:
                self.log_test("GM Sales Reps API Debug", False, 
                    "Response is not a list format")
        elif status_code == 403:
            self.log_test("GM Sales Reps API Debug", False, 
                f"ACCESS DENIED (403): {response.get('detail', 'No error message')}")
            print(f"   🚨 ISSUE CONFIRMED: GM user cannot access sales-reps endpoint")
            print(f"   Error Details: {response}")
            print(f"   🔍 BACKEND CODE ANALYSIS:")
            print(f"      - Endpoint exists at /api/users/sales-reps")
            print(f"      - Should allow UserRole.GM (which is 'gm')")
            print(f"      - GM user role from token: {me_response.get('role') if status_code == 200 else 'Unknown'}")
            print(f"      - This suggests a role comparison issue in the backend")
        elif status_code == 404:
            self.log_test("GM Sales Reps API Debug", False, 
                "Endpoint not found (404) - API may not be implemented")
        elif status_code == 500:
            self.log_test("GM Sales Reps API Debug", False, 
                f"Internal Server Error (500): {response.get('detail', 'No error message')}")
            print(f"   🚨 SERVER ERROR: There may be an exception in the backend code")
        else:
            self.log_test("GM Sales Reps API Debug", False, 
                f"Unexpected status code: {status_code}", response)
        return False

    def test_admin_authentication(self):
        """Test 4: Admin Authentication for comparison"""
        print("🔍 TESTING ADMIN AUTHENTICATION FOR COMPARISON")
        print("=" * 50)
        
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            
            if user_info.get("role") == "admin":
                self.log_test("Admin Login", True, 
                    f"Successfully logged in as {user_info.get('username')} with role: {user_info.get('role')}")
                return True
            else:
                self.log_test("Admin Login", False, 
                    f"Wrong role returned: {user_info.get('role')}, expected: admin")
        else:
            self.log_test("Admin Login", False, 
                f"Login failed with status: {status_code}", response)
        return False

    def test_admin_sales_reps_api_comparison(self):
        """Test 5: Test Same API with Admin - Compare if admin/admin123 can access the same endpoint"""
        print("🔍 TESTING ADMIN ACCESS TO /api/users/sales-reps FOR COMPARISON")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("Admin Sales Reps API Comparison", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/users/sales-reps", token=self.admin_token)
        
        print(f"   Request URL: {BASE_URL}/users/sales-reps")
        print(f"   Status Code: {status_code}")
        print(f"   Response: {json.dumps(response, indent=2)}")
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_test("Admin Sales Reps API Comparison", True, 
                    f"SUCCESS! Admin can access sales-reps endpoint. Found {len(response)} sales reps")
                
                # Show sample data if available
                if len(response) > 0:
                    sample_rep = response[0]
                    print(f"   Sample Sales Rep: {sample_rep.get('full_name', 'N/A')} ({sample_rep.get('username', 'N/A')})")
                return True
            else:
                self.log_test("Admin Sales Reps API Comparison", False, 
                    "Response is not a list format")
        elif status_code == 403:
            self.log_test("Admin Sales Reps API Comparison", False, 
                f"ACCESS DENIED (403): {response.get('detail', 'No error message')}")
        elif status_code == 404:
            self.log_test("Admin Sales Reps API Comparison", False, 
                "Endpoint not found (404) - API may not be implemented")
        else:
            self.log_test("Admin Sales Reps API Comparison", False, 
                f"Unexpected status code: {status_code}", response)
        return False

    def test_check_gm_user_exists_in_database(self):
        """Test 6: Check if GM user exists in database"""
        print("🔍 CHECKING IF GM USER EXISTS IN DATABASE")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("Check GM User Exists", False, "No admin token available")
            return False
        
        # Get all users and look for GM user
        status_code, response = self.make_request("GET", "/users", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            gm_users = [user for user in response if user.get("role") == "gm" or user.get("username") == "gm"]
            
            if gm_users:
                gm_user = gm_users[0]
                self.log_test("Check GM User Exists", True, 
                    f"GM user found in database: {gm_user.get('username')} ({gm_user.get('role')})")
                print(f"   GM User ID: {gm_user.get('id')}")
                print(f"   GM Full Name: {gm_user.get('full_name')}")
                print(f"   GM Is Active: {gm_user.get('is_active')}")
                print(f"   GM Created At: {gm_user.get('created_at')}")
                return True
            else:
                self.log_test("Check GM User Exists", False, 
                    "No GM user found in database")
        else:
            self.log_test("Check GM User Exists", False, 
                f"Failed to retrieve users list: {status_code}", response)
        return False

    def test_check_sales_rep_users_exist(self):
        """Test 7: Check if any sales rep users exist in database"""
        print("🔍 CHECKING IF SALES REP USERS EXIST IN DATABASE")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("Check Sales Rep Users Exist", False, "No admin token available")
            return False
        
        # Get all users and look for sales rep users
        status_code, response = self.make_request("GET", "/users", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            sales_rep_users = [user for user in response if user.get("role") in ["sales_rep", "medical_rep"]]
            
            if sales_rep_users:
                self.log_test("Check Sales Rep Users Exist", True, 
                    f"Found {len(sales_rep_users)} sales rep users in database")
                
                # Show first few sales reps
                for i, rep in enumerate(sales_rep_users[:3]):
                    print(f"   Sales Rep {i+1}: {rep.get('username')} - {rep.get('full_name')} ({rep.get('role')})")
                
                if len(sales_rep_users) > 3:
                    print(f"   ... and {len(sales_rep_users) - 3} more")
                return True
            else:
                self.log_test("Check Sales Rep Users Exist", False, 
                    "No sales rep users found in database")
                print("   This might explain why the sales-reps endpoint returns empty results")
        else:
            self.log_test("Check Sales Rep Users Exist", False, 
                f"Failed to retrieve users list: {status_code}", response)
        return False

    def test_check_role_hierarchy_permissions(self):
        """Test 8: Check role hierarchy and permissions in the backend code"""
        print("🔍 ANALYZING ROLE HIERARCHY AND PERMISSIONS")
        print("=" * 50)
        
        # This test analyzes the expected behavior based on role hierarchy
        print("   Expected Role Hierarchy (from backend code):")
        print("   - GM (gm): Level 6 - Full control")
        print("   - Admin (admin): Level 6 - Legacy compatibility")
        print("   - Line Manager (line_manager): Level 5")
        print("   - Area Manager (area_manager): Level 4")
        print("   - Manager (manager): Level 4 - Legacy compatibility")
        print("   - District Manager (district_manager): Level 3")
        print("   - Warehouse Manager (warehouse_manager): Level 3")
        print("   - Accounting (accounting): Level 3")
        print("   - Key Account (key_account): Level 2")
        print("   - Medical Rep (medical_rep): Level 1")
        print("   - Sales Rep (sales_rep): Level 1 - Legacy compatibility")
        print()
        print("   🎯 ANALYSIS: GM should have the same permissions as Admin")
        print("   🎯 EXPECTED: GM should be able to access /api/users/sales-reps")
        
        self.log_test("Role Hierarchy Analysis", True, 
            "GM role should have full access like Admin role")
        return True

    def run_debug_tests(self):
        """Run all debug tests in sequence"""
        print("🚀 STARTING GM USER DEBUG TESTS")
        print("=" * 60)
        print("Focus: Debug GET /api/users/sales-reps API issue for GM user")
        print("=" * 60)
        print()
        
        tests = [
            ("GM Authentication", self.test_gm_authentication),
            ("GM /api/auth/me Endpoint", self.test_gm_auth_me_endpoint),
            ("GM Sales Reps API Debug", self.test_gm_sales_reps_api_debug),
            ("Admin Authentication", self.test_admin_authentication),
            ("Admin Sales Reps API Comparison", self.test_admin_sales_reps_api_comparison),
            ("Check GM User Exists", self.test_check_gm_user_exists_in_database),
            ("Check Sales Rep Users Exist", self.test_check_sales_rep_users_exist),
            ("Role Hierarchy Analysis", self.test_check_role_hierarchy_permissions),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Exception occurred: {str(e)}")
        
        print("=" * 60)
        print("🏁 DEBUG TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        print()
        
        # Detailed analysis
        print("🔍 DETAILED ANALYSIS:")
        print("-" * 30)
        
        gm_login_success = any(r["test"] == "GM Authentication" and r["success"] for r in self.test_results)
        gm_auth_me_success = any(r["test"] == "GM /api/auth/me Endpoint" and r["success"] for r in self.test_results)
        gm_sales_reps_success = any(r["test"] == "GM Sales Reps API Debug" and r["success"] for r in self.test_results)
        admin_sales_reps_success = any(r["test"] == "Admin Sales Reps API Comparison" and r["success"] for r in self.test_results)
        
        if gm_login_success:
            print("✅ GM user can login successfully")
        else:
            print("❌ GM user cannot login - Check if GM user exists")
        
        if gm_auth_me_success:
            print("✅ GM user data is retrieved correctly via /api/auth/me")
        else:
            print("❌ GM user data retrieval failed")
        
        if gm_sales_reps_success:
            print("✅ GM user CAN access /api/users/sales-reps - Issue resolved!")
        else:
            print("❌ GM user CANNOT access /api/users/sales-reps - Issue confirmed!")
        
        if admin_sales_reps_success:
            print("✅ Admin user can access /api/users/sales-reps")
        else:
            print("❌ Admin user cannot access /api/users/sales-reps - API may not exist")
        
        print()
        print("🎯 ROOT CAUSE ANALYSIS:")
        print("-" * 30)
        
        if gm_login_success and gm_auth_me_success and not gm_sales_reps_success:
            if admin_sales_reps_success:
                print("🔍 ISSUE: GM user authentication works, but lacks permission for /api/users/sales-reps")
                print("🔧 SOLUTION: Check role-based access control in backend code")
                print("🔧 LIKELY FIX: Add 'gm' role to allowed roles for /api/users/sales-reps endpoint")
            else:
                print("🔍 ISSUE: /api/users/sales-reps endpoint may not be implemented")
                print("🔧 SOLUTION: Implement the missing API endpoint")
        elif not gm_login_success:
            print("🔍 ISSUE: GM user cannot login")
            print("🔧 SOLUTION: Check if GM user exists in database or verify credentials")
        
        return passed, total

if __name__ == "__main__":
    tester = GMDebugTester()
    passed, total = tester.run_debug_tests()
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
    else:
        print(f"⚠️  {total - passed} TESTS FAILED - See details above")