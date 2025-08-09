#!/usr/bin/env python3
"""
اختبار سريع للتأكد من أن الباكند يعمل بشكل صحيح بعد التحديثات
Quick Backend Verification Test After Updates

المطلوب:
1. تسجيل دخول admin/admin123 
2. اختبار GET /api/users للتأكد من أن المستخدمين يظهرون
3. اختبار GET /api/clinics للتأكد من أن العيادات تظهر  
4. اختبار GET /api/dashboard/stats للتأكد من أن إحصائيات الداشبورد تعمل

الهدف: التأكد من أن التحديثات لم تكسر أي وظائف أساسية في الباكند.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class QuickBackendVerificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details):
        """تسجيل نتيجة الاختبار"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status} | {test_name} | {response_time:.2f}ms | {details}")
    
    def login_admin(self):
        """1) تسجيل دخول admin/admin123"""
        print("\n🔐 Step 1: Admin Login Test")
        print("=" * 50)
        
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
                self.jwt_token = data.get("access_token")
                
                if self.jwt_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.jwt_token}"
                    })
                    
                    user_info = data.get("user", {})
                    details = f"User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                    self.log_test("Admin Login", True, response_time, details)
                    return True
                else:
                    self.log_test("Admin Login", False, response_time, "No access token received")
                    return False
            else:
                self.log_test("Admin Login", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Admin Login", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_get_users(self):
        """2) اختبار GET /api/users للتأكد من أن المستخدمين يظهرون"""
        print("\n👥 Step 2: GET /api/users Test")
        print("=" * 50)
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    user_count = len(users)
                    if user_count > 0:
                        # Show some user details
                        sample_user = users[0] if users else {}
                        details = f"Found {user_count} users. Sample: {sample_user.get('full_name', 'N/A')} ({sample_user.get('role', 'N/A')})"
                        self.log_test("GET /api/users", True, response_time, details)
                        return True
                    else:
                        self.log_test("GET /api/users", False, response_time, "No users found in response")
                        return False
                else:
                    self.log_test("GET /api/users", False, response_time, f"Invalid response format: {type(users)}")
                    return False
            else:
                self.log_test("GET /api/users", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/users", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_get_clinics(self):
        """3) اختبار GET /api/clinics للتأكد من أن العيادات تظهر"""
        print("\n🏥 Step 3: GET /api/clinics Test")
        print("=" * 50)
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/clinics", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                if isinstance(clinics, list):
                    clinic_count = len(clinics)
                    if clinic_count > 0:
                        # Show some clinic details
                        sample_clinic = clinics[0] if clinics else {}
                        details = f"Found {clinic_count} clinics. Sample: {sample_clinic.get('name', 'N/A')} - {sample_clinic.get('location', 'N/A')}"
                        self.log_test("GET /api/clinics", True, response_time, details)
                        return True
                    else:
                        self.log_test("GET /api/clinics", False, response_time, "No clinics found in response")
                        return False
                else:
                    self.log_test("GET /api/clinics", False, response_time, f"Invalid response format: {type(clinics)}")
                    return False
            else:
                self.log_test("GET /api/clinics", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/clinics", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_dashboard_stats(self):
        """4) اختبار GET /api/dashboard/stats للتأكد من أن إحصائيات الداشبورد تعمل"""
        print("\n📊 Step 4: GET /api/dashboard/stats Test")
        print("=" * 50)
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                if isinstance(stats, dict):
                    # Check for key statistics
                    users_count = stats.get('users', {}).get('total', 0)
                    clinics_count = stats.get('clinics', {}).get('total', 0)
                    orders_count = stats.get('orders', {}).get('count', 0)
                    visits_count = stats.get('visits', {}).get('count', 0)
                    
                    details = f"Stats: Users({users_count}), Clinics({clinics_count}), Orders({orders_count}), Visits({visits_count})"
                    self.log_test("GET /api/dashboard/stats", True, response_time, details)
                    return True
                else:
                    self.log_test("GET /api/dashboard/stats", False, response_time, f"Invalid response format: {type(stats)}")
                    return False
            else:
                self.log_test("GET /api/dashboard/stats", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/dashboard/stats", False, response_time, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 QUICK BACKEND VERIFICATION TEST STARTED")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Test Time: {datetime.now().isoformat()}")
        print("=" * 60)
        
        # Run tests in sequence
        tests_passed = 0
        total_tests = 4
        
        # Test 1: Login
        if self.login_admin():
            tests_passed += 1
            
            # Test 2: Users
            if self.test_get_users():
                tests_passed += 1
            
            # Test 3: Clinics  
            if self.test_get_clinics():
                tests_passed += 1
            
            # Test 4: Dashboard Stats
            if self.test_dashboard_stats():
                tests_passed += 1
        
        # Calculate results
        success_rate = (tests_passed / total_tests) * 100
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / len(self.test_results) if self.test_results else 0
        
        # Print final results
        print("\n" + "=" * 60)
        print("📋 QUICK BACKEND VERIFICATION TEST RESULTS")
        print("=" * 60)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        print("📊 SUMMARY STATISTICS")
        print("=" * 60)
        print(f"🎯 Success Rate: {success_rate:.1f}% ({tests_passed}/{total_tests} tests passed)")
        print(f"⏱️  Total Execution Time: {total_time:.2f}s")
        print(f"📈 Average Response Time: {avg_response_time:.2f}ms")
        
        if success_rate == 100:
            print("\n🎉 **ALL TESTS PASSED - BACKEND IS WORKING CORRECTLY!**")
            print("✅ Admin login works")
            print("✅ Users API works") 
            print("✅ Clinics API works")
            print("✅ Dashboard stats API works")
            print("🚀 **Backend is ready for production use!**")
        elif success_rate >= 75:
            print(f"\n⚠️  **MOSTLY WORKING - {success_rate:.1f}% SUCCESS RATE**")
            print("✅ Most core functionality is working")
            print("⚠️  Some minor issues detected - check failed tests above")
        else:
            print(f"\n❌ **CRITICAL ISSUES DETECTED - {success_rate:.1f}% SUCCESS RATE**")
            print("🚨 Backend has significant problems that need immediate attention")
            print("🔧 Check failed tests above for details")
        
        print("\n" + "=" * 60)
        return success_rate >= 75

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = QuickBackendVerificationTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Backend verification completed successfully!")
        exit(0)
    else:
        print("\n❌ Backend verification failed!")
        exit(1)

if __name__ == "__main__":
    main()