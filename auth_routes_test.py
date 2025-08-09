#!/usr/bin/env python3
"""
اختبار تحديثات authentication routes - Authentication Routes Testing
Testing the new /api/auth/me endpoint and complete authentication system
الهدف: التحقق من إضافة /api/auth/me endpoint الجديد وأن authentication system يعمل بشكل كامل
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://27f64219-57e1-4ae7-9f08-6723a4a751d3.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class AuthenticationTester:
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
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.Timeout:
            return None, "Request timeout"
        except requests.exceptions.ConnectionError:
            return None, "Connection error"
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_admin_login(self):
        """1. تسجيل الدخول: admin/admin123 والحصول على JWT token"""
        print("\n🔐 اختبار تسجيل الدخول - Admin Login Test")
        
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("Admin Login (admin/admin123)", True, 
                            f"JWT token received successfully: {self.admin_token[:20]}...")
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, 
                            f"No token in response: {data}")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg += f", Response: {response.text[:100]}"
            self.log_test("Admin Login (admin/admin123)", False, error_msg)
            return False
    
    def test_auth_me_endpoint(self):
        """2. اختبار /api/auth/me: باستخدام JWT token للحصول على معلومات المستخدم الحالي"""
        print("\n👤 اختبار /api/auth/me endpoint")
        
        if not self.admin_token:
            self.log_test("/api/auth/me with valid token", False, "No admin token available")
            return False
        
        response, error = self.make_request("GET", "/auth/me", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # 3. تأكيد بنية البيانات: التحقق من أن /api/auth/me يعيد معلومات المستخدم الصحيحة
            required_fields = ["user"]
            user_fields = ["id", "username", "full_name", "role"]
            
            # Check main structure
            structure_valid = True
            missing_fields = []
            
            for field in required_fields:
                if field not in data:
                    structure_valid = False
                    missing_fields.append(field)
            
            if "user" in data and isinstance(data["user"], dict):
                for field in user_fields:
                    if field not in data["user"]:
                        structure_valid = False
                        missing_fields.append(f"user.{field}")
            else:
                structure_valid = False
                missing_fields.append("user object")
            
            if structure_valid:
                user_info = data["user"]
                self.log_test("/api/auth/me with valid token", True, 
                            f"User data retrieved: {user_info.get('username')} ({user_info.get('role')})")
                self.log_test("Data structure validation", True, 
                            f"All required fields present: {', '.join(user_fields)}")
                return True
            else:
                self.log_test("/api/auth/me with valid token", False, 
                            f"Invalid data structure. Missing: {', '.join(missing_fields)}")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg += f", Response: {response.text[:100]}"
            self.log_test("/api/auth/me with valid token", False, error_msg)
            return False
    
    def test_auth_me_without_token(self):
        """4. اختبار authorization: التأكد من أن endpoint محمي ويرفض الطلبات بدون token"""
        print("\n🔒 اختبار الحماية - Authorization Protection Test")
        
        # Test without token
        response, error = self.make_request("GET", "/auth/me")
        
        if error:
            # If there's a connection error, try with curl to verify
            import subprocess
            try:
                result = subprocess.run([
                    'curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
                    f"{BACKEND_URL}/auth/me"
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    status_code = int(result.stdout.strip())
                    if status_code in [401, 403]:
                        self.log_test("/api/auth/me without token (should fail)", True, 
                                    f"Correctly rejected request without authorization token (curl: {status_code})")
                    else:
                        self.log_test("/api/auth/me without token (should fail)", False, 
                                    f"Expected 401/403, got: {status_code} (via curl)")
                else:
                    self.log_test("/api/auth/me without token (should fail)", False, 
                                f"Connection error: {error}")
            except Exception as e:
                self.log_test("/api/auth/me without token (should fail)", False, 
                            f"Connection error and curl failed: {error}")
        elif response and response.status_code in [401, 403]:
            self.log_test("/api/auth/me without token (should fail)", True, 
                        "Correctly rejected request without authorization token")
        else:
            error_msg = f"Expected 401/403, got: {response.status_code if response else 'No response'}"
            self.log_test("/api/auth/me without token (should fail)", False, error_msg)
        
        # Test with invalid token
        response, error = self.make_request("GET", "/auth/me", token="invalid_token_12345")
        
        if error:
            # If there's a connection error, try with curl to verify
            try:
                result = subprocess.run([
                    'curl', '-s', '-H', 'Authorization: Bearer invalid_token_12345',
                    '-o', '/dev/null', '-w', '%{http_code}',
                    f"{BACKEND_URL}/auth/me"
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    status_code = int(result.stdout.strip())
                    if status_code in [401, 403]:
                        self.log_test("/api/auth/me with invalid token (should fail)", True, 
                                    f"Correctly rejected invalid token (curl: {status_code})")
                    else:
                        self.log_test("/api/auth/me with invalid token (should fail)", False, 
                                    f"Expected 401/403, got: {status_code} (via curl)")
                else:
                    self.log_test("/api/auth/me with invalid token (should fail)", False, 
                                f"Connection error: {error}")
            except Exception as e:
                self.log_test("/api/auth/me with invalid token (should fail)", False, 
                            f"Connection error and curl failed: {error}")
        elif response and response.status_code in [401, 403]:
            self.log_test("/api/auth/me with invalid token (should fail)", True, 
                        f"Correctly rejected invalid token with status {response.status_code}")
        else:
            error_msg = f"Expected 401/403, got: {response.status_code if response else 'No response'}"
            self.log_test("/api/auth/me with invalid token (should fail)", False, error_msg)
    
    def test_dashboard_stats(self):
        """5. اختبار dashboard stats: للتأكد من أن التحديثات لم تكسر الوظائف الموجودة"""
        print("\n📊 اختبار Dashboard Stats - Existing Functionality Test")
        
        if not self.admin_token:
            self.log_test("Dashboard stats functionality", False, "No admin token available")
            return False
        
        response, error = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            
            # Check if we have the expected structure
            if "success" in data and data["success"]:
                stats_data = data.get("data", {})
                expected_stats = ["total_users", "total_clinics", "total_visits", "active_reps"]
                
                found_stats = []
                for stat in expected_stats:
                    if stat in stats_data:
                        found_stats.append(f"{stat}: {stats_data[stat]}")
                
                if found_stats:
                    self.log_test("Dashboard stats functionality", True, 
                                f"Stats retrieved successfully: {', '.join(found_stats)}")
                    return True
                else:
                    self.log_test("Dashboard stats functionality", False, 
                                f"No expected stats found in response: {data}")
                    return False
            else:
                self.log_test("Dashboard stats functionality", False, 
                            f"Invalid response structure: {data}")
                return False
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg += f", Response: {response.text[:100]}"
            self.log_test("Dashboard stats functionality", False, error_msg)
            return False
    
    def test_jwt_token_consistency(self):
        """اختبار إضافي: التأكد من أن جميع endpoints تتعامل مع JWT tokens بشكل متسق"""
        print("\n🔄 اختبار اتساق JWT Token - JWT Token Consistency Test")
        
        if not self.admin_token:
            self.log_test("JWT token consistency", False, "No admin token available")
            return False
        
        # Test multiple endpoints with the same token
        endpoints_to_test = [
            ("/auth/me", "GET"),
            ("/dashboard/stats", "GET"),
            ("/users", "GET")
        ]
        
        consistent_responses = 0
        total_endpoints = len(endpoints_to_test)
        
        for endpoint, method in endpoints_to_test:
            response, error = self.make_request(method, endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                consistent_responses += 1
                self.log_test(f"JWT consistency {endpoint}", True, "Token accepted")
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'}"
                self.log_test(f"JWT consistency {endpoint}", False, error_msg)
        
        if consistent_responses == total_endpoints:
            self.log_test("Overall JWT token consistency", True, 
                        f"All {total_endpoints} endpoints accept the same JWT token")
            return True
        else:
            self.log_test("Overall JWT token consistency", False, 
                        f"Only {consistent_responses}/{total_endpoints} endpoints consistent")
            return False
    
    def run_authentication_tests(self):
        """Run all authentication tests as requested in Arabic review"""
        print("🚀 بدء اختبار تحديثات authentication routes")
        print("=" * 80)
        print("الهدف: التحقق من إضافة /api/auth/me endpoint الجديد وأن authentication system يعمل بشكل كامل")
        print("المشكلة التي تم إصلاحها: كان /api/auth/me endpoint مفقود (404 error)")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all required tests
        self.test_admin_login()
        self.test_auth_me_endpoint()
        self.test_auth_me_without_token()
        self.test_dashboard_stats()
        self.test_jwt_token_consistency()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار - TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"إجمالي الاختبارات - Total Tests: {self.total_tests}")
        print(f"نجح - Passed: {self.passed_tests}")
        print(f"فشل - Failed: {self.total_tests - self.passed_tests}")
        print(f"معدل النجاح - Success Rate: {success_rate:.1f}%")
        print(f"الوقت الإجمالي - Total Time: {total_time:.2f} seconds")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة - FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # Print recommendations
        print(f"\n🎯 التوصيات - RECOMMENDATIONS:")
        if success_rate >= 90:
            print("✅ نظام المصادقة يعمل بشكل ممتاز! Authentication system working excellently!")
        elif success_rate >= 75:
            print("⚠️ نظام المصادقة يعمل بشكل جيد مع بعض المشاكل البسيطة")
        else:
            print("❌ نظام المصادقة يحتاج إلى تحسينات قبل الاستخدام في الإنتاج")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = AuthenticationTester()
    success = tester.run_authentication_tests()
    
    if success:
        print("\n🎉 AUTHENTICATION TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️ AUTHENTICATION TESTING COMPLETED WITH ISSUES!")
        sys.exit(1)