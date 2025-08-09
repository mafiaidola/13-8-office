#!/usr/bin/env python3
"""
Critical Testing for salmamohamed Password Update Issue
اختبار حرج لمشكلة تحديث كلمة مرور المستخدم salmamohamed

This test focuses on the specific critical issue where user salmamohamed 
cannot login after password update from ComprehensiveUserModal.

Test Requirements:
1. Update salmamohamed password (ID: 1cf45634-a655-4d0b-b96f-248c29fa1f7c) to "salmanewpass123"
2. Test salmamohamed login with new password "salmanewpass123"  
3. Test comprehensive-profile endpoint
4. Test updating user with empty password field
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com/api"
SALMAMOHAMED_USER_ID = "1cf45634-a655-4d0b-b96f-248c29fa1f7c"
NEW_PASSWORD = "salmanewpass123"

class SalmaMohamedCriticalTester:
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
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        if response_time:
            print(f"   ⏱️ Response time: {response_time:.2f}ms")
        print()

    def test_admin_login(self):
        """Test 1: Admin Login for Authentication"""
        print("🔐 Test 1: Admin Login Authentication")
        start_time = time.time()
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", 
                json={"username": "admin", "password": "admin123"})
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_test(
                    "Admin Login", 
                    True, 
                    f"Login successful - User: {user_info.get('full_name')}, Role: {user_info.get('role')}", 
                    response_time
                )
                
                # Set authorization header for future requests
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                return True
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_get_salmamohamed_user(self):
        """Test 2: Verify salmamohamed user exists"""
        print("👤 Test 2: Verify salmamohamed User Exists")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/users/{SALMAMOHAMED_USER_ID}")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                user_data = response.json()
                username = user_data.get("username", "Unknown")
                full_name = user_data.get("full_name", "Unknown")
                role = user_data.get("role", "Unknown")
                
                self.log_test(
                    "Get salmamohamed User", 
                    True, 
                    f"User found - Username: {username}, Name: {full_name}, Role: {role}", 
                    response_time
                )
                return True
            else:
                self.log_test("Get salmamohamed User", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Get salmamohamed User", False, f"Exception: {str(e)}")
            return False

    def test_update_salmamohamed_password(self):
        """Test 3: Update salmamohamed Password to 'salmanewpass123'"""
        print("🔑 Test 3: Update salmamohamed Password")
        start_time = time.time()
        
        try:
            update_data = {
                "password": NEW_PASSWORD,
                "full_name": "Salma Mohamed"  # Keep existing name
            }
            
            response = self.session.put(f"{BACKEND_URL}/users/{SALMAMOHAMED_USER_ID}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "No message")
                
                self.log_test(
                    "Update salmamohamed Password", 
                    True, 
                    f"Password updated successfully - Message: {message}", 
                    response_time
                )
                return True
            else:
                self.log_test("Update salmamohamed Password", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Update salmamohamed Password", False, f"Exception: {str(e)}")
            return False

    def test_salmamohamed_login_new_password(self):
        """Test 4: Test salmamohamed Login with New Password"""
        print("🔓 Test 4: salmamohamed Login with New Password")
        start_time = time.time()
        
        try:
            # Create new session for user login (without admin token)
            user_session = requests.Session()
            
            response = user_session.post(f"{BACKEND_URL}/auth/login", 
                json={"username": "salmamohamed", "password": NEW_PASSWORD})
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get("user", {})
                token = data.get("access_token")
                
                self.log_test(
                    "salmamohamed Login New Password", 
                    True, 
                    f"Login successful - User: {user_info.get('full_name')}, Role: {user_info.get('role')}, Token: {'Present' if token else 'Missing'}", 
                    response_time
                )
                return True
            else:
                self.log_test("salmamohamed Login New Password", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("salmamohamed Login New Password", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_profile_endpoint(self):
        """Test 5: Test comprehensive-profile endpoint for salmamohamed"""
        print("📊 Test 5: Comprehensive Profile Endpoint")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/users/{SALMAMOHAMED_USER_ID}/comprehensive-profile")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                success = data.get("success", False)
                user_profile = data.get("user_profile", {})
                comprehensive_data = user_profile.get("comprehensive_data", {})
                
                sections_count = len(comprehensive_data.keys())
                
                self.log_test(
                    "Comprehensive Profile Endpoint", 
                    True, 
                    f"Profile retrieved successfully - Success: {success}, Data sections: {sections_count}", 
                    response_time
                )
                return True
            else:
                self.log_test("Comprehensive Profile Endpoint", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Profile Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_update_empty_password(self):
        """Test 6: Test updating user with empty password field"""
        print("🔒 Test 6: Update User with Empty Password")
        start_time = time.time()
        
        try:
            update_data = {
                "password": "",  # Empty password
                "full_name": "Salma Mohamed Updated"
            }
            
            response = self.session.put(f"{BACKEND_URL}/users/{SALMAMOHAMED_USER_ID}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "No message")
                
                self.log_test(
                    "Update Empty Password", 
                    True, 
                    f"Update successful without affecting password - Message: {message}", 
                    response_time
                )
                return True
            else:
                self.log_test("Update Empty Password", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Update Empty Password", False, f"Exception: {str(e)}")
            return False

    def test_salmamohamed_login_after_empty_update(self):
        """Test 7: Verify salmamohamed can still login after empty password update"""
        print("🔐 Test 7: salmamohamed Login After Empty Password Update")
        start_time = time.time()
        
        try:
            # Create new session for user login
            user_session = requests.Session()
            
            response = user_session.post(f"{BACKEND_URL}/auth/login", 
                json={"username": "salmamohamed", "password": NEW_PASSWORD})
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get("user", {})
                
                self.log_test(
                    "salmamohamed Login After Empty Update", 
                    True, 
                    f"Login still works - User: {user_info.get('full_name')}, Password unchanged by empty update", 
                    response_time
                )
                return True
            else:
                self.log_test("salmamohamed Login After Empty Update", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("salmamohamed Login After Empty Update", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all critical tests for salmamohamed password issue"""
        print("🎯 CRITICAL TESTING FOR SALMAMOHAMED PASSWORD UPDATE ISSUE")
        print("=" * 80)
        print(f"🎯 Target User ID: {SALMAMOHAMED_USER_ID}")
        print(f"🔑 New Password: {NEW_PASSWORD}")
        print(f"🌐 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        print()
        
        # Run tests in sequence
        tests = [
            self.test_admin_login,
            self.test_get_salmamohamed_user,
            self.test_update_salmamohamed_password,
            self.test_salmamohamed_login_new_password,
            self.test_comprehensive_profile_endpoint,
            self.test_update_empty_password,
            self.test_salmamohamed_login_after_empty_update
        ]
        
        for test in tests:
            test()
            time.sleep(0.1)  # Small delay between tests
        
        # Calculate final results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        avg_response_time = sum(
            float(result["response_time"].replace("ms", "")) 
            for result in self.test_results 
            if result["response_time"] != "N/A"
        ) / len([r for r in self.test_results if r["response_time"] != "N/A"])
        
        print("=" * 80)
        print("🎯 CRITICAL TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"📊 Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests passed)")
        print(f"⏱️ Average Response Time: {avg_response_time:.2f}ms")
        print(f"🕐 Total Execution Time: {total_time:.2f}s")
        print()
        
        print("📋 DETAILED RESULTS:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"{i}. {status} {result['test']}")
            print(f"   📝 {result['details']}")
            print(f"   ⏱️ {result['response_time']} at {result['timestamp']}")
            print()
        
        # Critical issue analysis
        print("🔍 CRITICAL ISSUE ANALYSIS:")
        print("=" * 50)
        
        password_update_success = any(r["test"] == "Update salmamohamed Password" and r["success"] for r in self.test_results)
        login_new_password_success = any(r["test"] == "salmamohamed Login New Password" and r["success"] for r in self.test_results)
        comprehensive_profile_success = any(r["test"] == "Comprehensive Profile Endpoint" and r["success"] for r in self.test_results)
        empty_password_success = any(r["test"] == "Update Empty Password" and r["success"] for r in self.test_results)
        
        if password_update_success and login_new_password_success:
            print("🎉 CRITICAL ISSUE RESOLVED!")
            print("✅ salmamohamed password update works correctly")
            print("✅ salmamohamed can login with new password")
            print("✅ ComprehensiveUserModal password update functionality is working")
        else:
            print("⚠️ CRITICAL ISSUE STILL EXISTS!")
            if not password_update_success:
                print("❌ Password update failed")
            if not login_new_password_success:
                print("❌ Login with new password failed")
        
        if comprehensive_profile_success:
            print("✅ comprehensive-profile endpoint is working")
        else:
            print("❌ comprehensive-profile endpoint has issues")
            
        if empty_password_success:
            print("✅ Empty password handling works correctly")
        else:
            print("❌ Empty password handling has issues")
        
        print()
        print("🎯 FINAL ASSESSMENT:")
        if success_rate >= 85.0:
            print("🟢 EXCELLENT - Critical issue resolved, system ready for production")
        elif success_rate >= 70.0:
            print("🟡 GOOD - Most functionality works, minor issues remain")
        else:
            print("🔴 CRITICAL - Major issues need immediate attention")
        
        return success_rate

if __name__ == "__main__":
    tester = SalmaMohamedCriticalTester()
    success_rate = tester.run_comprehensive_test()
    
    print(f"\n🏁 FINAL RESULT: {success_rate:.1f}% SUCCESS RATE")
    if success_rate == 100.0:
        print("🎉 PERFECT! All critical tests passed - salmamohamed password issue completely resolved!")
    elif success_rate >= 85.0:
        print("✅ EXCELLENT! Critical functionality works - minor improvements possible")
    else:
        print("⚠️ NEEDS ATTENTION! Critical issues require immediate fixes")