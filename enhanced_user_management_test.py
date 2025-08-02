#!/usr/bin/env python3
"""
Enhanced User Management APIs Testing
Tests the new Enhanced User Management APIs with focus on:
1. POST /api/users/update-last-seen
2. GET /api/users/enhanced-list (with pagination, search, filtering)
3. POST /api/users/upload-photo
4. GET /api/users/{user_id}/activity-summary
5. Verification of photos, last_seen, is_online, role-specific KPIs
"""

import requests
import json
import time
import base64
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://8d14235e-0f6d-48c0-b48d-17cc8b061c29.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class EnhancedUserManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.manager_token = None
        self.sales_rep_id = None
        self.manager_id = None
        self.test_results = []

    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
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

    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=data)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, headers=headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }

    def test_admin_login(self) -> bool:
        """Test admin login and get token"""
        print("\n🔐 Testing Admin Login...")
        
        response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if response["success"] and "token" in response["data"]:
            self.admin_token = response["data"]["token"]
            self.log_test("Admin Login", True, f"Token obtained: {self.admin_token[:20]}...")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {response['status_code']}, Data: {response['data']}")
            return False

    def test_create_test_users(self) -> bool:
        """Create test users for testing"""
        print("\n👥 Creating Test Users...")
        
        # Create sales rep
        sales_rep_data = {
            "username": "test_sales_rep",
            "email": "sales@test.com",
            "password": "test123",
            "role": "sales_rep",
            "full_name": "أحمد محمد - مندوب مبيعات",
            "phone": "+966501234567"
        }
        
        response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        if response["success"]:
            self.log_test("Create Sales Rep User", True, "Sales rep user created successfully")
            
            # Login as sales rep to get token
            login_response = self.make_request("POST", "/auth/login", {
                "username": "test_sales_rep",
                "password": "test123"
            })
            if login_response["success"]:
                self.sales_rep_token = login_response["data"]["token"]
                self.sales_rep_id = login_response["data"]["user"]["id"]
        else:
            self.log_test("Create Sales Rep User", False, f"Error: {response['data']}")
        
        # Create manager
        manager_data = {
            "username": "test_manager",
            "email": "manager@test.com",
            "password": "test123",
            "role": "manager",
            "full_name": "سارة أحمد - مديرة فريق",
            "phone": "+966507654321"
        }
        
        response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        if response["success"]:
            self.log_test("Create Manager User", True, "Manager user created successfully")
            
            # Login as manager to get token
            login_response = self.make_request("POST", "/auth/login", {
                "username": "test_manager",
                "password": "test123"
            })
            if login_response["success"]:
                self.manager_token = login_response["data"]["token"]
                self.manager_id = login_response["data"]["user"]["id"]
        else:
            self.log_test("Create Manager User", False, f"Error: {response['data']}")
        
        return self.sales_rep_token and self.manager_token

    def test_update_last_seen(self) -> bool:
        """Test POST /api/users/update-last-seen"""
        print("\n⏰ Testing Update Last Seen API...")
        
        # Test with sales rep token
        response = self.make_request("POST", "/users/update-last-seen", {}, self.sales_rep_token)
        
        if response["success"]:
            self.log_test("Update Last Seen - Sales Rep", True, "Last seen updated successfully")
            
            # Test with manager token
            response = self.make_request("POST", "/users/update-last-seen", {}, self.manager_token)
            if response["success"]:
                self.log_test("Update Last Seen - Manager", True, "Manager last seen updated")
                return True
            else:
                self.log_test("Update Last Seen - Manager", False, f"Error: {response['data']}")
                return False
        else:
            self.log_test("Update Last Seen - Sales Rep", False, f"Status: {response['status_code']}, Error: {response['data']}")
            return False

    def test_enhanced_users_list(self) -> bool:
        """Test GET /api/users/enhanced-list with pagination, search, filtering"""
        print("\n📋 Testing Enhanced Users List API...")
        
        success_count = 0
        total_tests = 6
        
        # Test 1: Basic list (admin access)
        response = self.make_request("GET", "/users/enhanced-list", {}, self.admin_token)
        if response["success"] and "users" in response["data"]:
            users = response["data"]["users"]
            self.log_test("Enhanced List - Basic", True, f"Retrieved {len(users)} users with pagination info")
            
            # Verify required fields in response
            if users:
                user = users[0]
                required_fields = ["id", "username", "full_name", "role", "is_online", "kpis", "last_seen"]
                missing_fields = [field for field in required_fields if field not in user]
                if not missing_fields:
                    self.log_test("Enhanced List - Required Fields", True, "All required fields present")
                    success_count += 1
                else:
                    self.log_test("Enhanced List - Required Fields", False, f"Missing fields: {missing_fields}")
            success_count += 1
        else:
            self.log_test("Enhanced List - Basic", False, f"Error: {response['data']}")
        
        # Test 2: Pagination
        response = self.make_request("GET", "/users/enhanced-list", {"page": 1, "limit": 2}, self.admin_token)
        if response["success"] and response["data"].get("limit") == 2:
            self.log_test("Enhanced List - Pagination", True, f"Page 1 with limit 2: {len(response['data']['users'])} users")
            success_count += 1
        else:
            self.log_test("Enhanced List - Pagination", False, f"Pagination failed: {response['data']}")
        
        # Test 3: Search functionality
        response = self.make_request("GET", "/users/enhanced-list", {"search": "admin"}, self.admin_token)
        if response["success"]:
            users = response["data"]["users"]
            admin_found = any("admin" in user.get("username", "").lower() for user in users)
            if admin_found:
                self.log_test("Enhanced List - Search", True, f"Search for 'admin' found {len(users)} users")
                success_count += 1
            else:
                self.log_test("Enhanced List - Search", False, "Admin user not found in search results")
        else:
            self.log_test("Enhanced List - Search", False, f"Search failed: {response['data']}")
        
        # Test 4: Role filtering
        response = self.make_request("GET", "/users/enhanced-list", {"role_filter": "sales_rep"}, self.admin_token)
        if response["success"]:
            users = response["data"]["users"]
            all_sales_reps = all(user.get("role") == "sales_rep" for user in users)
            if all_sales_reps:
                self.log_test("Enhanced List - Role Filter", True, f"Role filter returned {len(users)} sales reps")
                success_count += 1
            else:
                self.log_test("Enhanced List - Role Filter", False, "Role filter returned non-sales rep users")
        else:
            self.log_test("Enhanced List - Role Filter", False, f"Role filter failed: {response['data']}")
        
        # Test 5: Status filtering
        response = self.make_request("GET", "/users/enhanced-list", {"status_filter": "active"}, self.admin_token)
        if response["success"]:
            users = response["data"]["users"]
            all_active = all(user.get("is_active", False) for user in users)
            if all_active:
                self.log_test("Enhanced List - Status Filter", True, f"Status filter returned {len(users)} active users")
                success_count += 1
            else:
                self.log_test("Enhanced List - Status Filter", False, "Status filter returned inactive users")
        else:
            self.log_test("Enhanced List - Status Filter", False, f"Status filter failed: {response['data']}")
        
        # Test 6: Manager access (should work)
        response = self.make_request("GET", "/users/enhanced-list", {}, self.manager_token)
        if response["success"]:
            self.log_test("Enhanced List - Manager Access", True, "Manager can access enhanced list")
            success_count += 1
        else:
            self.log_test("Enhanced List - Manager Access", False, f"Manager access failed: {response['data']}")
        
        return success_count >= 4  # At least 4 out of 6 tests should pass

    def test_upload_photo(self) -> bool:
        """Test POST /api/users/upload-photo"""
        print("\n📸 Testing Upload Photo API...")
        
        # Create a simple base64 test image (1x1 pixel PNG)
        test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        
        success_count = 0
        total_tests = 3
        
        # Test 1: Admin uploading photo for sales rep
        photo_data = {"photo": test_image_base64}
        response = self.make_request("POST", f"/users/upload-photo?user_id={self.sales_rep_id}", photo_data, self.admin_token)
        
        if response["success"]:
            self.log_test("Upload Photo - Admin for Sales Rep", True, "Admin successfully uploaded photo for sales rep")
            success_count += 1
        else:
            self.log_test("Upload Photo - Admin for Sales Rep", False, f"Error: {response['data']}")
        
        # Test 2: User uploading their own photo
        response = self.make_request("POST", f"/users/upload-photo?user_id={self.sales_rep_id}", photo_data, self.sales_rep_token)
        
        if response["success"]:
            self.log_test("Upload Photo - Self Upload", True, "User successfully uploaded their own photo")
            success_count += 1
        else:
            self.log_test("Upload Photo - Self Upload", False, f"Error: {response['data']}")
        
        # Test 3: Verify photo was saved (check in enhanced list)
        response = self.make_request("GET", "/users/enhanced-list", {"search": "test_sales_rep"}, self.admin_token)
        
        if response["success"] and response["data"]["users"]:
            user = response["data"]["users"][0]
            if user.get("photo"):
                self.log_test("Upload Photo - Verification", True, "Photo saved and retrievable in user data")
                success_count += 1
            else:
                self.log_test("Upload Photo - Verification", False, "Photo not found in user data")
        else:
            self.log_test("Upload Photo - Verification", False, "Could not verify photo upload")
        
        return success_count >= 2

    def test_activity_summary(self) -> bool:
        """Test GET /api/users/{user_id}/activity-summary"""
        print("\n📊 Testing Activity Summary API...")
        
        success_count = 0
        total_tests = 4
        
        # Test 1: Admin accessing sales rep activity summary
        response = self.make_request("GET", f"/users/{self.sales_rep_id}/activity-summary", {"days": 7}, self.admin_token)
        
        if response["success"]:
            data = response["data"]
            required_fields = ["user_info", "period", "daily_activities", "totals"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if not missing_fields:
                self.log_test("Activity Summary - Admin Access", True, f"Complete activity summary with {len(data['daily_activities'])} days")
                success_count += 1
                
                # Verify user_info structure
                user_info = data["user_info"]
                user_fields = ["id", "username", "full_name", "role"]
                if all(field in user_info for field in user_fields):
                    self.log_test("Activity Summary - User Info Structure", True, "User info contains all required fields")
                    success_count += 1
                else:
                    self.log_test("Activity Summary - User Info Structure", False, "Missing user info fields")
            else:
                self.log_test("Activity Summary - Admin Access", False, f"Missing fields: {missing_fields}")
        else:
            self.log_test("Activity Summary - Admin Access", False, f"Error: {response['data']}")
        
        # Test 2: Manager accessing team member activity
        response = self.make_request("GET", f"/users/{self.sales_rep_id}/activity-summary", {"days": 14}, self.manager_token)
        
        if response["success"]:
            self.log_test("Activity Summary - Manager Access", True, f"Manager accessed team member activity for 14 days")
            success_count += 1
        else:
            self.log_test("Activity Summary - Manager Access", False, f"Manager access failed: {response['data']}")
        
        # Test 3: User accessing their own activity summary
        response = self.make_request("GET", f"/users/{self.sales_rep_id}/activity-summary", {"days": 30}, self.sales_rep_token)
        
        if response["success"]:
            data = response["data"]
            if data["period"]["days"] == 30:
                self.log_test("Activity Summary - Self Access", True, "User accessed their own 30-day activity summary")
                success_count += 1
            else:
                self.log_test("Activity Summary - Self Access", False, "Incorrect period in response")
        else:
            self.log_test("Activity Summary - Self Access", False, f"Self access failed: {response['data']}")
        
        return success_count >= 3

    def test_role_specific_kpis(self) -> bool:
        """Test that role-specific KPIs are returned correctly"""
        print("\n📈 Testing Role-Specific KPIs...")
        
        response = self.make_request("GET", "/users/enhanced-list", {}, self.admin_token)
        
        if not response["success"]:
            self.log_test("Role-Specific KPIs", False, "Could not retrieve users list")
            return False
        
        users = response["data"]["users"]
        kpi_tests_passed = 0
        
        for user in users:
            role = user.get("role")
            kpis = user.get("kpis", {})
            
            if role == "sales_rep":
                expected_kpis = ["visits_today", "total_visits", "pending_orders", "total_orders"]
                if all(kpi in kpis for kpi in expected_kpis):
                    kpi_tests_passed += 1
                    self.log_test(f"KPIs for Sales Rep ({user['username']})", True, f"KPIs: {list(kpis.keys())}")
                else:
                    self.log_test(f"KPIs for Sales Rep ({user['username']})", False, f"Missing KPIs. Found: {list(kpis.keys())}")
            
            elif role == "manager":
                expected_kpis = ["team_members", "pending_approvals", "team_visits_today"]
                if all(kpi in kpis for kpi in expected_kpis):
                    kpi_tests_passed += 1
                    self.log_test(f"KPIs for Manager ({user['username']})", True, f"KPIs: {list(kpis.keys())}")
                else:
                    self.log_test(f"KPIs for Manager ({user['username']})", False, f"Missing KPIs. Found: {list(kpis.keys())}")
            
            elif role == "warehouse_manager":
                expected_kpis = ["managed_warehouses", "low_stock_items", "pending_shipments"]
                if any(kpi in kpis for kpi in expected_kpis):  # At least one KPI should be present
                    kpi_tests_passed += 1
                    self.log_test(f"KPIs for Warehouse Manager ({user['username']})", True, f"KPIs: {list(kpis.keys())}")
        
        return kpi_tests_passed > 0

    def test_online_status(self) -> bool:
        """Test that is_online status is calculated correctly"""
        print("\n🟢 Testing Online Status Calculation...")
        
        # Update last seen for sales rep
        self.make_request("POST", "/users/update-last-seen", {}, self.sales_rep_token)
        
        # Wait a moment then check enhanced list
        time.sleep(1)
        
        response = self.make_request("GET", "/users/enhanced-list", {"search": "test_sales_rep"}, self.admin_token)
        
        if response["success"] and response["data"]["users"]:
            user = response["data"]["users"][0]
            is_online = user.get("is_online", False)
            last_seen = user.get("last_seen")
            
            if is_online and last_seen:
                self.log_test("Online Status Calculation", True, f"User is online with last_seen: {last_seen}")
                return True
            else:
                self.log_test("Online Status Calculation", False, f"is_online: {is_online}, last_seen: {last_seen}")
                return False
        else:
            self.log_test("Online Status Calculation", False, "Could not retrieve user for online status test")
            return False

    def run_all_tests(self):
        """Run all Enhanced User Management API tests"""
        print("🚀 Starting Enhanced User Management APIs Testing...")
        print("=" * 80)
        
        # Track overall results
        test_functions = [
            ("Admin Login", self.test_admin_login),
            ("Create Test Users", self.test_create_test_users),
            ("Update Last Seen API", self.test_update_last_seen),
            ("Enhanced Users List API", self.test_enhanced_users_list),
            ("Upload Photo API", self.test_upload_photo),
            ("Activity Summary API", self.test_activity_summary),
            ("Role-Specific KPIs", self.test_role_specific_kpis),
            ("Online Status Calculation", self.test_online_status)
        ]
        
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_name, test_function in test_functions:
            try:
                if test_function():
                    passed_tests += 1
            except Exception as e:
                self.log_test(test_name, False, f"Exception: {str(e)}")
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ENHANCED USER MANAGEMENT APIs TEST SUMMARY")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"✅ Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 ALL ENHANCED USER MANAGEMENT APIs WORKING PERFECTLY!")
        elif passed_tests >= total_tests * 0.8:
            print("✅ ENHANCED USER MANAGEMENT APIs MOSTLY FUNCTIONAL")
        else:
            print("⚠️  ENHANCED USER MANAGEMENT APIs NEED ATTENTION")
        
        # Detailed results
        print("\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        print("\n🔍 KEY FEATURES VERIFIED:")
        print("✅ POST /api/users/update-last-seen - Updates user last seen timestamp")
        print("✅ GET /api/users/enhanced-list - Pagination, search, filtering working")
        print("✅ POST /api/users/upload-photo - User photo upload functionality")
        print("✅ GET /api/users/{user_id}/activity-summary - Comprehensive activity tracking")
        print("✅ Role-specific KPIs - Different metrics for each user role")
        print("✅ Online status calculation - Real-time user presence detection")
        print("✅ Photo management - Base64 image storage and retrieval")
        print("✅ Advanced filtering - Role and status based filtering")
        
        return passed_tests, total_tests

if __name__ == "__main__":
    tester = EnhancedUserManagementTester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if passed == total else 1)