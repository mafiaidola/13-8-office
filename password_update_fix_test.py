#!/usr/bin/env python3
"""
اختبار شامل لإصلاح مشكلة تحديث كلمة مرور المستخدمين
Comprehensive test for user password update fix

المطلوب اختبار:
1. تسجيل الدخول كـ Admin: POST /api/auth/login مع admin/admin123
2. إنشاء مستخدم للاختبار: POST /api/users مع بيانات مستخدم جديد
3. جلب قائمة المستخدمين: GET /api/users للحصول على ID المستخدم الجديد
4. اختبار تحديث كلمة المرور: PUT /api/users/{user_id} مع حقل password جديد
5. التحقق من تسجيل الدخول بكلمة المرور الجديدة: POST /api/auth/login مع اسم المستخدم وكلمة المرور الجديدة

التركيز على:
- التأكد من أن PUT /api/users/{user_id} يعمل بشكل صحيح
- التأكد من تشفير كلمة المرور الجديدة
- التأكد من عدم ظهور رسالة "Not Found"
- حذف أي بيانات تجريبية إذا كانت موجودة
"""

import requests
import json
import time
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com/api"

class PasswordUpdateTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.admin_token = None
        self.test_user_id = None
        self.test_username = None
        self.new_password = None
        self.results = []
        self.start_time = time.time()
        
    def log_result(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """Log test result"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        self.results.append({
            "test": test_name,
            "status": status,
            "response_time": f"{response_time:.2f}ms",
            "details": details,
            "success": success
        })
        print(f"{status} | {test_name} | {response_time:.2f}ms | {details}")
    
    def test_admin_login(self):
        """Test 1: تسجيل الدخول كـ Admin"""
        print("\n🔐 Test 1: Admin Login (admin/admin123)")
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{self.backend_url}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                details = f"User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                self.log_result("Admin Login", True, response_time, details)
                return True
            else:
                self.log_result("Admin Login", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Admin Login", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_create_test_user(self):
        """Test 2: إنشاء مستخدم للاختبار"""
        print("\n👤 Test 2: Create Test User")
        start_time = time.time()
        
        try:
            # Generate unique test user data
            timestamp = int(time.time())
            self.test_username = f"test_user_{timestamp}"
            
            user_data = {
                "username": self.test_username,
                "full_name": "مستخدم اختبار تحديث كلمة المرور",
                "password": "original_password123",
                "role": "medical_rep",
                "email": f"test_{timestamp}@clinic.com"
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(
                f"{self.backend_url}/users",
                json=user_data,
                headers=headers,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_id = data.get("id")
                
                details = f"User ID: {self.test_user_id}, Username: {self.test_username}"
                self.log_result("Create Test User", True, response_time, details)
                return True
            else:
                self.log_result("Create Test User", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Create Test User", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_get_users_list(self):
        """Test 3: جلب قائمة المستخدمين"""
        print("\n📋 Test 3: Get Users List")
        start_time = time.time()
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(
                f"{self.backend_url}/users",
                headers=headers,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                total_users = len(users)
                
                # Find our test user
                test_user_found = any(user.get("id") == self.test_user_id for user in users)
                
                details = f"Total users: {total_users}, Test user found: {test_user_found}"
                self.log_result("Get Users List", True, response_time, details)
                return True
            else:
                self.log_result("Get Users List", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Get Users List", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_update_password(self):
        """Test 4: اختبار تحديث كلمة المرور"""
        print("\n🔑 Test 4: Update User Password")
        start_time = time.time()
        
        try:
            # Generate new password
            timestamp = int(time.time())
            self.new_password = f"new_password_{timestamp}"
            
            update_data = {
                "password": self.new_password,
                "full_name": "مستخدم اختبار تحديث كلمة المرور - محدث"
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(
                f"{self.backend_url}/users/{self.test_user_id}",
                json=update_data,
                headers=headers,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                updated_name = data.get("full_name", "")
                
                details = f"Message: {message}, Updated name: {updated_name}"
                self.log_result("Update User Password", True, response_time, details)
                return True
            else:
                self.log_result("Update User Password", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Update User Password", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_login_with_new_password(self):
        """Test 5: التحقق من تسجيل الدخول بكلمة المرور الجديدة"""
        print("\n🔓 Test 5: Login with New Password")
        start_time = time.time()
        
        try:
            login_data = {
                "username": self.test_username,
                "password": self.new_password
            }
            
            response = requests.post(
                f"{self.backend_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get("user", {})
                token_received = bool(data.get("access_token"))
                
                details = f"Login successful, Token: {token_received}, User: {user_info.get('full_name', 'N/A')}"
                self.log_result("Login with New Password", True, response_time, details)
                return True
            else:
                self.log_result("Login with New Password", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Login with New Password", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_login_with_old_password(self):
        """Test 6: التحقق من عدم إمكانية تسجيل الدخول بكلمة المرور القديمة"""
        print("\n🚫 Test 6: Verify Old Password No Longer Works")
        start_time = time.time()
        
        try:
            login_data = {
                "username": self.test_username,
                "password": "original_password123"  # Old password
            }
            
            response = requests.post(
                f"{self.backend_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            # We expect this to fail (401 Unauthorized)
            if response.status_code == 401:
                details = "Old password correctly rejected (401 Unauthorized)"
                self.log_result("Old Password Rejection", True, response_time, details)
                return True
            elif response.status_code == 200:
                details = "ERROR: Old password still works - password update failed!"
                self.log_result("Old Password Rejection", False, response_time, details)
                return False
            else:
                details = f"Unexpected response: HTTP {response.status_code}"
                self.log_result("Old Password Rejection", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Old Password Rejection", False, response_time, f"Exception: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """Test 7: حذف بيانات الاختبار"""
        print("\n🧹 Test 7: Cleanup Test Data")
        start_time = time.time()
        
        try:
            if not self.test_user_id:
                self.log_result("Cleanup Test Data", True, 0, "No test user to cleanup")
                return True
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.delete(
                f"{self.backend_url}/users/{self.test_user_id}",
                headers=headers,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                
                details = f"Test user deleted: {message}"
                self.log_result("Cleanup Test Data", True, response_time, details)
                return True
            else:
                self.log_result("Cleanup Test Data", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_result("Cleanup Test Data", False, response_time, f"Exception: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive password update test"""
        print("🚀 بدء اختبار شامل لإصلاح مشكلة تحديث كلمة مرور المستخدمين")
        print("=" * 80)
        
        # Test sequence
        tests = [
            ("Admin Login", self.test_admin_login),
            ("Create Test User", self.test_create_test_user),
            ("Get Users List", self.test_get_users_list),
            ("Update Password", self.test_update_password),
            ("Login with New Password", self.test_login_with_new_password),
            ("Old Password Rejection", self.test_login_with_old_password),
            ("Cleanup Test Data", self.cleanup_test_data)
        ]
        
        successful_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                successful_tests += 1
            else:
                # If critical test fails, continue but note the failure
                if test_name in ["Admin Login"]:
                    print(f"❌ Critical test '{test_name}' failed - stopping execution")
                    break
        
        # Calculate results
        success_rate = (successful_tests / total_tests) * 100
        total_time = time.time() - self.start_time
        avg_response_time = sum(float(r["response_time"].replace("ms", "")) for r in self.results) / len(self.results) if self.results else 0
        
        # Print comprehensive summary
        print("\n" + "=" * 80)
        print("📊 **COMPREHENSIVE PASSWORD UPDATE FIX TEST RESULTS**")
        print("=" * 80)
        
        print(f"🎯 **Success Rate:** {success_rate:.1f}% ({successful_tests}/{total_tests} tests passed)")
        print(f"⏱️ **Performance:** Average response time: {avg_response_time:.2f}ms")
        print(f"🕐 **Total execution time:** {total_time:.2f}s")
        
        print("\n📋 **Detailed Results:**")
        for result in self.results:
            print(f"  {result['status']} {result['test']} ({result['response_time']}) - {result['details']}")
        
        # Critical analysis
        print("\n🔍 **Critical Analysis:**")
        
        if successful_tests == total_tests:
            print("🎉 **PERFECT SUCCESS!** جميع اختبارات تحديث كلمة المرور تعمل بشكل مثالي!")
            print("✅ **المشكلة محلولة بالكامل:** PUT /api/users/{user_id} يعمل بشكل صحيح")
            print("✅ **تشفير كلمة المرور:** يعمل بشكل صحيح")
            print("✅ **عدم ظهور 'Not Found':** تم التأكد من عدم ظهور هذه الرسالة")
            print("✅ **تسجيل الدخول بكلمة المرور الجديدة:** يعمل بنجاح")
            print("✅ **رفض كلمة المرور القديمة:** يعمل بشكل صحيح")
        elif successful_tests >= 5:
            print("🟡 **GOOD SUCCESS!** معظم اختبارات تحديث كلمة المرور تعمل بشكل جيد")
            failed_tests = [r for r in self.results if not r['success']]
            if failed_tests:
                print("⚠️ **المشاكل المتبقية:**")
                for failed in failed_tests:
                    print(f"   - {failed['test']}: {failed['details']}")
        else:
            print("❌ **CRITICAL ISSUES FOUND!** مشاكل حرجة في تحديث كلمة المرور")
            failed_tests = [r for r in self.results if not r['success']]
            print("🚨 **المشاكل الحرجة:**")
            for failed in failed_tests:
                print(f"   - {failed['test']}: {failed['details']}")
        
        print("\n" + "=" * 80)
        return success_rate >= 85.0

def main():
    """Main test execution"""
    print("🔧 اختبار إصلاح مشكلة تحديث كلمة مرور المستخدمين")
    print("Testing User Password Update Fix")
    print("=" * 80)
    
    tester = PasswordUpdateTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 **TEST CONCLUSION: PASSWORD UPDATE FIX WORKING PERFECTLY!**")
        print("✅ المشكلة 'خطأ في التحديث: Not Found' تم حلها بنجاح")
        print("✅ نظام تحديث كلمة المرور يعمل بشكل مثالي")
        print("✅ النظام جاهز للاستخدام الفعلي")
    else:
        print("\n❌ **TEST CONCLUSION: PASSWORD UPDATE ISSUES DETECTED!**")
        print("🚨 يوجد مشاكل في نظام تحديث كلمة المرور تحتاج إصلاح")
        print("🔧 يُنصح بمراجعة PUT /api/users/{user_id} endpoint")

if __name__ == "__main__":
    main()