#!/usr/bin/env python3
"""
User Management Issue Testing - Arabic Review
Testing the main issue: "Users section displays as empty"
Focus: Testing user management endpoints that were not showing users in frontend
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://4a9f720a-2892-4a4a-8a02-0abb64f3fd62.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class UserManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details, response_time=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms" if response_time else "N/A",
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        if response_time:
            print(f"   Response time: {response_time:.2f}ms")
        print()

    def test_admin_login(self):
        """Test 1: Admin login with admin/admin123"""
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                
                if self.admin_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.admin_token}"
                    })
                    
                    user_info = data.get("user", {})
                    self.log_test(
                        "Admin Login (admin/admin123)",
                        True,
                        f"Login successful - User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Admin Login (admin/admin123)",
                        False,
                        "Login response missing access_token",
                        response_time
                    )
                    return False
            else:
                self.log_test(
                    "Admin Login (admin/admin123)",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "Admin Login (admin/admin123)",
                False,
                f"Request failed: {str(e)}",
                response_time
            )
            return False

    def test_get_users_endpoint(self):
        """Test 2: GET /api/users - Main issue endpoint"""
        start_time = time.time()
        
        try:
            response = self.session.get(
                f"{BACKEND_URL}/users",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                
                if isinstance(users, list):
                    user_count = len(users)
                    
                    # Analyze user data
                    roles_count = {}
                    active_users = 0
                    
                    for user in users:
                        role = user.get('role', 'unknown')
                        roles_count[role] = roles_count.get(role, 0) + 1
                        if user.get('is_active', True):
                            active_users += 1
                    
                    roles_summary = ", ".join([f"{role}: {count}" for role, count in roles_count.items()])
                    
                    self.log_test(
                        "GET /api/users (Main Issue Endpoint)",
                        True,
                        f"Users endpoint working! Found {user_count} users ({active_users} active). Roles: {roles_summary}",
                        response_time
                    )
                    return users
                else:
                    self.log_test(
                        "GET /api/users (Main Issue Endpoint)",
                        False,
                        f"Expected list but got: {type(users)}",
                        response_time
                    )
                    return []
            else:
                self.log_test(
                    "GET /api/users (Main Issue Endpoint)",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "GET /api/users (Main Issue Endpoint)",
                False,
                f"Request failed: {str(e)}",
                response_time
            )
            return []

    def test_create_user(self):
        """Test 3: POST /api/users - Create new user"""
        start_time = time.time()
        
        # Test user data with realistic Arabic names
        test_user_data = {
            "username": f"test_user_{int(time.time())}",
            "full_name": "د. أحمد محمد الطبيب",
            "password": "test123456",
            "role": "medical_rep",
            "email": "ahmed.mohamed@clinic.com",
            "line_id": None,
            "area_id": None,
            "manager_id": None
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/users",
                json=test_user_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                created_user = response.json()
                user_id = created_user.get('id')
                
                self.log_test(
                    "POST /api/users (Create User)",
                    True,
                    f"User created successfully - ID: {user_id}, Name: {created_user.get('full_name')}, Role: {created_user.get('role')}",
                    response_time
                )
                return user_id
            else:
                self.log_test(
                    "POST /api/users (Create User)",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "POST /api/users (Create User)",
                False,
                f"Request failed: {str(e)}",
                response_time
            )
            return None

    def test_update_user(self, user_id):
        """Test 4: PUT /api/users/{user_id} - Update user"""
        if not user_id:
            self.log_test(
                "PUT /api/users/{user_id} (Update User)",
                False,
                "No user ID provided for testing",
                0
            )
            return False
            
        start_time = time.time()
        
        # Update data
        update_data = {
            "full_name": "د. أحمد محمد الطبيب المحدث",
            "email": "ahmed.updated@clinic.com",
            "line_id": "line_001"
        }
        
        try:
            response = self.session.put(
                f"{BACKEND_URL}/users/{user_id}",
                json=update_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                updated_user = response.json()
                
                self.log_test(
                    "PUT /api/users/{user_id} (Update User)",
                    True,
                    f"User updated successfully - New name: {updated_user.get('full_name')}, Email: {updated_user.get('email')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "PUT /api/users/{user_id} (Update User)",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "PUT /api/users/{user_id} (Update User)",
                False,
                f"Request failed: {str(e)}",
                response_time
            )
            return False

    def test_users_data_format(self, users):
        """Test 5: Verify users data format for frontend compatibility"""
        start_time = time.time()
        
        if not users:
            self.log_test(
                "Users Data Format Verification",
                False,
                "No users data to verify",
                0
            )
            return False
        
        try:
            required_fields = ['id', 'username', 'full_name', 'role', 'is_active']
            format_issues = []
            valid_users = 0
            
            for i, user in enumerate(users):
                user_issues = []
                
                # Check required fields
                for field in required_fields:
                    if field not in user:
                        user_issues.append(f"Missing field: {field}")
                
                # Check data types
                if 'is_active' in user and not isinstance(user['is_active'], bool):
                    user_issues.append(f"is_active should be boolean, got {type(user['is_active'])}")
                
                if user_issues:
                    format_issues.append(f"User {i+1}: {', '.join(user_issues)}")
                else:
                    valid_users += 1
            
            response_time = (time.time() - start_time) * 1000
            
            if not format_issues:
                self.log_test(
                    "Users Data Format Verification",
                    True,
                    f"All {len(users)} users have correct format for frontend compatibility",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "Users Data Format Verification",
                    False,
                    f"{valid_users}/{len(users)} users valid. Issues: {'; '.join(format_issues[:3])}{'...' if len(format_issues) > 3 else ''}",
                    response_time
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "Users Data Format Verification",
                False,
                f"Format verification failed: {str(e)}",
                response_time
            )
            return False

    def run_comprehensive_test(self):
        """Run all user management tests"""
        print("🎯 **USER MANAGEMENT ISSUE TESTING - ARABIC REVIEW**")
        print("=" * 80)
        print("Testing the main issue: 'Users section displays as empty'")
        print("Focus: Verify that GET /api/users endpoint works and returns data correctly")
        print("=" * 80)
        print()
        
        # Test 1: Admin Login
        if not self.test_admin_login():
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test 2: Main issue - GET /api/users
        users = self.test_get_users_endpoint()
        
        # Test 3: Create new user
        new_user_id = self.test_create_user()
        
        # Test 4: Update user
        if new_user_id:
            self.test_update_user(new_user_id)
        
        # Test 5: Verify data format
        self.test_users_data_format(users)
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate comprehensive test summary"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        
        print("=" * 80)
        print("🎯 **USER MANAGEMENT ISSUE TESTING SUMMARY**")
        print("=" * 80)
        
        print(f"📊 **Overall Results:**")
        print(f"   • Total Tests: {total_tests}")
        print(f"   • Successful: {successful_tests}")
        print(f"   • Failed: {total_tests - successful_tests}")
        print(f"   • Success Rate: {success_rate:.1f}%")
        print(f"   • Total Execution Time: {total_time:.2f}s")
        print()
        
        print("📋 **Test Results Details:**")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}")
            print(f"      {result['details']}")
            if result["response_time"] != "N/A":
                print(f"      Response Time: {result['response_time']}")
            print()
        
        # Main issue analysis
        users_test = next((r for r in self.test_results if "GET /api/users" in r["test"]), None)
        if users_test and users_test["success"]:
            print("🎉 **MAIN ISSUE RESOLVED:**")
            print("   ✅ GET /api/users endpoint is working correctly")
            print("   ✅ Users are being returned from the backend")
            print("   ✅ Frontend should now be able to display users list")
            print()
        else:
            print("❌ **MAIN ISSUE NOT RESOLVED:**")
            print("   ❌ GET /api/users endpoint is still not working")
            print("   ❌ Users section will continue to display as empty")
            print()
        
        # Recommendations
        print("🔧 **Recommendations:**")
        if success_rate >= 80:
            print("   ✅ User management system is working well")
            print("   ✅ The main issue 'Users section displays as empty' should be resolved")
            print("   ✅ Frontend can now successfully fetch and display users")
        elif success_rate >= 50:
            print("   ⚠️ User management system has some issues but core functionality works")
            print("   ⚠️ Check failed tests and fix remaining issues")
        else:
            print("   ❌ User management system has significant issues")
            print("   ❌ Major fixes needed before users can be displayed in frontend")
        
        print()
        print("=" * 80)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": success_rate,
            "total_time": total_time,
            "main_issue_resolved": users_test and users_test["success"] if users_test else False,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = UserManagementTester()
    summary = tester.run_comprehensive_test()