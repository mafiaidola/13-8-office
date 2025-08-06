#!/usr/bin/env python3
"""
Enhanced User Management System Testing - Focus on Fixed Issues
Testing the Enhanced User Management System with region validation fix and user update permissions
Based on review request for testing:
1. POST /api/auth/register - Test user creation with region validation fix
2. PATCH /api/users/{user_id} - Test user update with fixed permissions
3. GET /api/users/managers - Confirm managers API working
4. GET /api/regions/list - Confirm regions API working
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://3cda3dc5-f9f2-4f37-9cc1-77fdfe8786ca.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}
DEFAULT_GM = {"username": "gm", "password": "gm123456"}

# Test data from review request
ENHANCED_USER_TEST_DATA = {
    "username": "test_user_fixed",
    "email": "testfixed@company.com",
    "password": "testpass123",
    "full_name": "مستخدم تجريبي محسن",
    "phone": "01234567890",
    "role": "medical_rep",
    "region_id": "region-001",
    "direct_manager_id": "test-manager-id",
    "address": "القاهرة، مصر",
    "national_id": "12345678901234",
    "hire_date": "2024-01-15",
    "is_active": True
}

class EnhancedUserManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.gm_token = None
        self.test_user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
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

    def test_admin_authentication(self):
        """Test Admin authentication with admin/admin123 credentials"""
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            if user_info.get("role") == "admin":
                self.log_test("Admin Authentication", True, f"Successfully logged in as {user_info.get('username')}")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Wrong role: {user_info.get('role')}")
        else:
            self.log_test("Admin Authentication", False, f"Status: {status_code}", response)
        return False

    def test_gm_authentication(self):
        """Test GM authentication with gm/gm123456 credentials"""
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_GM)
        
        if status_code == 200 and "token" in response:
            self.gm_token = response["token"]
            user_info = response.get("user", {})
            if user_info.get("role") == "gm":
                self.log_test("GM Authentication", True, f"Successfully logged in as GM: {user_info.get('username')}")
                return True
            else:
                self.log_test("GM Authentication", False, f"Wrong role: {user_info.get('role')}")
        else:
            self.log_test("GM Authentication", False, f"Status: {status_code}", response)
        return False

    def test_get_managers_api(self):
        """Test GET /api/users/managers - Confirm managers API working"""
        if not self.admin_token:
            self.log_test("GET /api/users/managers", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/users/managers", token=self.admin_token)
        
        if status_code == 200:
            if isinstance(response, list):
                # Check if managers have required fields
                if len(response) > 0:
                    manager = response[0]
                    required_fields = ["id", "full_name", "role"]
                    if all(field in manager for field in required_fields):
                        self.log_test("GET /api/users/managers", True, f"Found {len(response)} managers with proper structure")
                        return True
                    else:
                        self.log_test("GET /api/users/managers", False, "Missing required fields in manager data")
                else:
                    self.log_test("GET /api/users/managers", True, f"Found {len(response)} managers (empty list is valid)")
                    return True
            else:
                self.log_test("GET /api/users/managers", False, "Response is not a list")
        else:
            self.log_test("GET /api/users/managers", False, f"Status: {status_code}", response)
        return False

    def test_get_regions_list_api(self):
        """Test GET /api/regions/list - Confirm regions API working"""
        if not self.admin_token:
            self.log_test("GET /api/regions/list", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/regions/list", token=self.admin_token)
        
        if status_code == 200:
            if isinstance(response, list):
                # Check if regions have required fields
                if len(response) > 0:
                    region = response[0]
                    required_fields = ["id", "name"]
                    if all(field in region for field in required_fields):
                        self.log_test("GET /api/regions/list", True, f"Found {len(response)} regions with proper structure")
                        return True
                    else:
                        self.log_test("GET /api/regions/list", False, "Missing required fields in region data")
                else:
                    self.log_test("GET /api/regions/list", True, f"Found {len(response)} regions (using mock data)")
                    return True
            else:
                self.log_test("GET /api/regions/list", False, "Response is not a list")
        else:
            self.log_test("GET /api/regions/list", False, f"Status: {status_code}", response)
        return False

    def test_user_creation_with_region_validation_fix(self):
        """Test POST /api/auth/register - Test user creation with region validation fix"""
        if not self.admin_token:
            self.log_test("POST /api/auth/register - Region Validation Fix", False, "No admin token available")
            return False
        
        # Use the test data from review request
        timestamp = str(int(time.time()))
        
        # Create unique test data to avoid conflicts
        test_user_data = ENHANCED_USER_TEST_DATA.copy()
        test_user_data["username"] = f"test_user_fixed_{timestamp}"
        test_user_data["email"] = f"testfixed_{timestamp}@company.com"
        
        status_code, response = self.make_request("POST", "/auth/register", test_user_data, self.admin_token)
        
        if status_code == 200:
            user_id = response.get("user_id")
            if user_id:
                self.test_user_id = user_id
                self.log_test("POST /api/auth/register - Region Validation Fix", True, f"Enhanced user created successfully with ID: {user_id}")
                return True
            else:
                self.log_test("POST /api/auth/register - Region Validation Fix", False, "User created but no user_id returned")
        else:
            # Check if it's the specific region validation error that was supposed to be fixed
            error_detail = response.get("detail", "")
            if "Invalid region ID" in error_detail:
                self.log_test("POST /api/auth/register - Region Validation Fix", False, f"Region validation still failing: {error_detail}")
            else:
                self.log_test("POST /api/auth/register - Region Validation Fix", False, f"Status: {status_code}, Error: {error_detail}")
        return False

    def test_user_update_with_fixed_permissions(self):
        """Test PATCH /api/users/{user_id} - Test user update with fixed permissions"""
        if not self.admin_token:
            self.log_test("PATCH /api/users/{user_id} - Fixed Permissions", False, "No admin token available")
            return False
        
        # Use the user created in previous test or get any existing user
        user_id = self.test_user_id
        if not user_id:
            # Get any existing user for testing
            status_code, users = self.make_request("GET", "/users", token=self.admin_token)
            if status_code == 200 and len(users) > 0:
                user_id = users[0]["id"]
            else:
                self.log_test("PATCH /api/users/{user_id} - Fixed Permissions", False, "No user available for update testing")
                return False
        
        # Test data for user update
        update_data = {
            "full_name": "مستخدم محدث ومحسن",
            "phone": "01098765432",
            "address": "الجيزة، مصر - محدث",
            "region_id": "region-002"
        }
        
        status_code, response = self.make_request("PATCH", f"/users/{user_id}", update_data, self.admin_token)
        
        if status_code == 200:
            self.log_test("PATCH /api/users/{user_id} - Fixed Permissions", True, "User updated successfully with admin permissions")
            return True
        else:
            # Check if it's the specific permission error that was supposed to be fixed
            error_detail = response.get("detail", "")
            if status_code == 403:
                self.log_test("PATCH /api/users/{user_id} - Fixed Permissions", False, f"Permission error still exists: {error_detail}")
            else:
                self.log_test("PATCH /api/users/{user_id} - Fixed Permissions", False, f"Status: {status_code}, Error: {error_detail}")
        return False

    def test_system_health_check(self):
        """Test system health check"""
        success_count = 0
        total_tests = 6
        
        # Test 1: Backend service status
        try:
            response = self.session.get(f"{BASE_URL.replace('/api', '')}/health", timeout=10)
            if response.status_code == 200:
                success_count += 1
        except:
            # Fallback: test if we can reach any API endpoint
            status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
            if status_code in [200, 401]:  # Either success or auth error means service is running
                success_count += 1
        
        # Test 2-6: Database connectivity by checking basic endpoints
        if self.admin_token:
            endpoints_to_test = [
                "/users",
                "/clinics", 
                "/doctors",
                "/visits",
                "/products"
            ]
            
            for endpoint in endpoints_to_test:
                status_code, response = self.make_request("GET", endpoint, token=self.admin_token)
                if status_code == 200:
                    success_count += 1
        
        if success_count >= 4:  # At least 4 out of 6 should work
            self.log_test("System Health Check", True, f"System healthy: {success_count}/{total_tests} checks passed")
            return True
        else:
            self.log_test("System Health Check", False, f"System issues: only {success_count}/{total_tests} checks passed")
        return False

    def run_enhanced_user_management_tests(self):
        """Run Enhanced User Management System Tests focusing on fixed issues"""
        print("=" * 80)
        print("🎯 ENHANCED USER MANAGEMENT SYSTEM - FIXED ISSUES TESTING")
        print("=" * 80)
        print("Testing the Enhanced User Management System fixes as requested:")
        print("1. POST /api/auth/register - User creation with region validation fix")
        print("2. PATCH /api/users/{user_id} - User update with fixed permissions")
        print("3. GET /api/users/managers - Confirm managers API working")
        print("4. GET /api/regions/list - Confirm regions API working")
        print("5. System health check")
        print("=" * 80)
        print()
        
        # Initialize test results
        test_results = []
        
        print("🔐 AUTHENTICATION TESTS:")
        print("-" * 50)
        
        # Test 1: Admin Authentication (required for user management)
        if self.test_admin_authentication():
            test_results.append(("Admin Authentication (admin/admin123)", True))
        else:
            test_results.append(("Admin Authentication (admin/admin123)", False))
        
        # Test 2: GM Authentication (for manager functionalities)
        if self.test_gm_authentication():
            test_results.append(("GM Authentication (gm/gm123456)", True))
        else:
            test_results.append(("GM Authentication (gm/gm123456)", False))
        
        print("\n🎯 PRIMARY FOCUS - FIXED ISSUES:")
        print("-" * 50)
        
        # Test 3: User Creation with Region Validation Fix
        if self.test_user_creation_with_region_validation_fix():
            test_results.append(("POST /api/auth/register - Region Validation Fix", True))
        else:
            test_results.append(("POST /api/auth/register - Region Validation Fix", False))
        
        # Test 4: User Update with Fixed Permissions
        if self.test_user_update_with_fixed_permissions():
            test_results.append(("PATCH /api/users/{user_id} - Fixed Permissions", True))
        else:
            test_results.append(("PATCH /api/users/{user_id} - Fixed Permissions", False))
        
        # Test 5: Get Managers API
        if self.test_get_managers_api():
            test_results.append(("GET /api/users/managers", True))
        else:
            test_results.append(("GET /api/users/managers", False))
        
        # Test 6: Get Regions List API
        if self.test_get_regions_list_api():
            test_results.append(("GET /api/regions/list", True))
        else:
            test_results.append(("GET /api/regions/list", False))
        
        print("\n🔍 SYSTEM HEALTH:")
        print("-" * 50)
        
        # Test 7: System Health Check
        if self.test_system_health_check():
            test_results.append(("System Health Check", True))
        else:
            test_results.append(("System Health Check", False))
        
        # Calculate results
        passed_tests = sum(1 for _, success in test_results if success)
        total_tests = len(test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED USER MANAGEMENT SYSTEM TEST RESULTS")
        print("=" * 80)
        
        for test_name, success in test_results:
            status = "✅ WORKING" if success else "❌ FAILING"
            print(f"{status} {test_name}")
        
        print(f"\n📈 SUCCESS RATE: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        # Specific assessment for the fixed issues
        core_fixes = [
            ("POST /api/auth/register - Region Validation Fix", test_results[2][1]),
            ("PATCH /api/users/{user_id} - Fixed Permissions", test_results[3][1]),
            ("GET /api/users/managers", test_results[4][1]),
            ("GET /api/regions/list", test_results[5][1])
        ]
        
        core_passed = sum(1 for _, success in core_fixes if success)
        
        print(f"\n🎯 CORE FIXES STATUS: {core_passed}/4 working")
        
        if core_passed == 4:
            print("🎉 EXCELLENT: All Enhanced User Management fixes are working!")
        elif core_passed >= 3:
            print("✅ GOOD: Most Enhanced User Management fixes are working")
        elif core_passed >= 2:
            print("⚠️  PARTIAL: Some Enhanced User Management fixes need attention")
        else:
            print("❌ ISSUES: Enhanced User Management fixes need significant work")
        
        print("=" * 80)
        
        return success_rate >= 60  # Consider 60% or higher as acceptable


def main():
    """Main function to run the Enhanced User Management System tests"""
    print("🚀 Starting Enhanced User Management System Testing...")
    print("Focus: Testing fixed issues as requested in the review")
    print()
    
    tester = EnhancedUserManagementTester()
    success = tester.run_enhanced_user_management_tests()
    
    if success:
        print("\n✅ Enhanced User Management System testing completed successfully!")
    else:
        print("\n❌ Enhanced User Management System testing found issues that need attention.")
    
    return success


if __name__ == "__main__":
    main()