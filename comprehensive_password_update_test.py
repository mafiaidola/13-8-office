#!/usr/bin/env python3
"""
اختبار شامل لإصلاح مشكلة تحديث كلمة المرور في "تفاصيل المستخدم الشاملة"
Comprehensive Password Update Fix Testing for Arabic Review

المطلوب اختبار الإصلاح الجديد لمشكلة تحديث كلمة المرور:
المشكلة: المستخدم يحصل على رسالة "تم تغيير كلمة السر" لكن لا يستطيع الدخول بكلمة المرور الجديدة

التغييرات المطبقة:
1. تم تغيير اسم الحقل في الواجهة الأمامية من `new_password` إلى `password`
2. تم تحسين منطق backend ليتجاهل كلمات المرور الفارغة
3. تم إضافة حقل `password: ''` في تهيئة formData
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Configuration
BACKEND_URL = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensivePasswordUpdateTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_user_id = None
        self.test_username = None
        self.original_password = "original_password_123"
        self.new_password = "new_test_password_456"
        self.results = []
        self.start_time = time.time()
        
    def log_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """Log test result"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        self.results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms"
        })
        print(f"{status}: {test_name} - {details} ({response_time:.2f}ms)")
        
    def generate_test_username(self):
        """Generate unique test username"""
        timestamp = str(int(time.time()))
        random_suffix = ''.join(random.choices(string.digits, k=4))
        return f"test_password_user_{timestamp}_{random_suffix}"
        
    def test_admin_login_setup(self):
        """اختبار 1: تسجيل الدخول والإعداد"""
        print("\n🔐 اختبار 1: تسجيل دخول Admin")
        start_time = time.time()
        
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_result(
                    "تسجيل دخول Admin",
                    True,
                    f"نجح تسجيل الدخول - المستخدم: {user_info.get('full_name')}, الدور: {user_info.get('role')}",
                    response_time
                )
                
                # Set authorization header
                self.session.headers.update({
                    "Authorization": f"Bearer {self.admin_token}"
                })
                return True
            else:
                self.log_result("تسجيل دخول Admin", False, f"فشل: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_result("تسجيل دخول Admin", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_create_test_user(self):
        """اختبار 2: إنشاء مستخدم اختبار"""
        print("\n👤 اختبار 2: إنشاء مستخدم اختبار")
        start_time = time.time()
        
        try:
            self.test_username = self.generate_test_username()
            
            user_data = {
                "username": self.test_username,
                "full_name": "مستخدم اختبار تحديث كلمة المرور الشامل",
                "password": self.original_password,
                "role": "medical_rep",
                "email": f"{self.test_username}@clinic.com"
            }
            
            response = self.session.post(f"{BACKEND_URL}/users", json=user_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.test_user_id = data.get("id")
                
                self.log_result(
                    "إنشاء مستخدم اختبار",
                    True,
                    f"تم إنشاء المستخدم - ID: {self.test_user_id}, Username: {self.test_username}",
                    response_time
                )
                return True
            else:
                self.log_result("إنشاء مستخدم اختبار", False, f"فشل: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("إنشاء مستخدم اختبار", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_password_update_with_new_field(self):
        """اختبار 3: تحديث كلمة المرور باستخدام حقل 'password'"""
        print("\n🔑 اختبار 3: تحديث كلمة المرور")
        start_time = time.time()
        
        try:
            # Test the fix: using 'password' field (not 'new_password')
            update_data = {
                "password": self.new_password,
                "full_name": "مستخدم اختبار تحديث كلمة المرور - محدث"
            }
            
            response = self.session.put(f"{BACKEND_URL}/users/{self.test_user_id}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", "")
                
                self.log_result(
                    "تحديث كلمة المرور",
                    True,
                    f"تم التحديث بنجاح - الرسالة: '{message}'",
                    response_time
                )
                return True
            else:
                self.log_result("تحديث كلمة المرور", False, f"فشل: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("تحديث كلمة المرور", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_login_with_new_password(self):
        """اختبار 4: التحقق من تسجيل الدخول بكلمة المرور الجديدة"""
        print("\n🔓 اختبار 4: تسجيل الدخول بكلمة المرور الجديدة")
        start_time = time.time()
        
        try:
            # Create new session for login test
            test_session = requests.Session()
            
            response = test_session.post(f"{BACKEND_URL}/auth/login", json={
                "username": self.test_username,
                "password": self.new_password
            })
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                user_info = data.get("user", {})
                token = data.get("access_token")
                
                self.log_result(
                    "تسجيل الدخول بكلمة المرور الجديدة",
                    True,
                    f"نجح تسجيل الدخول - المستخدم: {user_info.get('full_name')}, Token: {'موجود' if token else 'غير موجود'}",
                    response_time
                )
                return True
            else:
                self.log_result("تسجيل الدخول بكلمة المرور الجديدة", False, f"فشل: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("تسجيل الدخول بكلمة المرور الجديدة", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_old_password_rejection(self):
        """اختبار 5: التأكد من فشل تسجيل الدخول بكلمة المرور القديمة"""
        print("\n🚫 اختبار 5: رفض كلمة المرور القديمة")
        start_time = time.time()
        
        try:
            # Create new session for login test
            test_session = requests.Session()
            
            response = test_session.post(f"{BACKEND_URL}/auth/login", json={
                "username": self.test_username,
                "password": self.original_password
            })
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 401:
                self.log_result(
                    "رفض كلمة المرور القديمة",
                    True,
                    "كلمة المرور القديمة تم رفضها بشكل صحيح (HTTP 401 Unauthorized)",
                    response_time
                )
                return True
            else:
                self.log_result("رفض كلمة المرور القديمة", False, f"كلمة المرور القديمة لم يتم رفضها: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_result("رفض كلمة المرور القديمة", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_update_without_password(self):
        """اختبار 6: تحديث بدون كلمة مرور"""
        print("\n📝 اختبار 6: تحديث بيانات أخرى بدون كلمة مرور")
        start_time = time.time()
        
        try:
            # Test updating other fields without password - should not change current password
            update_data = {
                "full_name": "اسم محدث بدون تغيير كلمة المرور",
                "email": "updated_without_password@clinic.com"
            }
            
            response = self.session.put(f"{BACKEND_URL}/users/{self.test_user_id}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                # Verify that the current password (new_password) still works
                test_session = requests.Session()
                login_response = test_session.post(f"{BACKEND_URL}/auth/login", json={
                    "username": self.test_username,
                    "password": self.new_password
                })
                
                if login_response.status_code == 200:
                    self.log_result(
                        "تحديث بدون كلمة مرور",
                        True,
                        "تم التحديث بنجاح بدون تغيير كلمة المرور - كلمة المرور الحالية لا تزال تعمل",
                        response_time
                    )
                    return True
                else:
                    self.log_result("تحديث بدون كلمة مرور", False, "كلمة المرور تغيرت رغم عدم تحديدها في الطلب", response_time)
                    return False
            else:
                self.log_result("تحديث بدون كلمة مرور", False, f"فشل التحديث: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("تحديث بدون كلمة مرور", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_empty_password_handling(self):
        """اختبار 7: التعامل مع كلمة مرور فارغة"""
        print("\n🔒 اختبار 7: التعامل مع كلمة مرور فارغة")
        start_time = time.time()
        
        try:
            # Test with empty password - should be ignored
            update_data = {
                "password": "",  # Empty password should be ignored
                "full_name": "اسم محدث مع كلمة مرور فارغة"
            }
            
            response = self.session.put(f"{BACKEND_URL}/users/{self.test_user_id}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                # Verify that the current password still works (empty password was ignored)
                test_session = requests.Session()
                login_response = test_session.post(f"{BACKEND_URL}/auth/login", json={
                    "username": self.test_username,
                    "password": self.new_password
                })
                
                if login_response.status_code == 200:
                    self.log_result(
                        "التعامل مع كلمة مرور فارغة",
                        True,
                        "كلمة المرور الفارغة تم تجاهلها بشكل صحيح - كلمة المرور الحالية لا تزال تعمل",
                        response_time
                    )
                    return True
                else:
                    self.log_result("التعامل مع كلمة مرور فارغة", False, "كلمة المرور الفارغة لم يتم تجاهلها", response_time)
                    return False
            else:
                self.log_result("التعامل مع كلمة مرور فارغة", False, f"فشل التحديث: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_result("التعامل مع كلمة مرور فارغة", False, f"خطأ: {str(e)}", 0)
            return False
            
    def test_cleanup(self):
        """اختبار 8: تنظيف البيانات التجريبية"""
        print("\n🧹 اختبار 8: تنظيف البيانات التجريبية")
        start_time = time.time()
        
        try:
            if self.test_user_id:
                response = self.session.delete(f"{BACKEND_URL}/users/{self.test_user_id}")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    message = data.get("message", "")
                    
                    self.log_result(
                        "تنظيف البيانات التجريبية",
                        True,
                        f"تم حذف المستخدم التجريبي بنجاح - {message}",
                        response_time
                    )
                    return True
                else:
                    self.log_result("تنظيف البيانات التجريبية", False, f"فشل حذف المستخدم: {response.status_code}", response_time)
                    return False
            else:
                self.log_result("تنظيف البيانات التجريبية", True, "لا توجد بيانات تجريبية للحذف", 0)
                return True
                
        except Exception as e:
            self.log_result("تنظيف البيانات التجريبية", False, f"خطأ: {str(e)}", 0)
            return False
            
    def run_comprehensive_test(self):
        """تشغيل جميع اختبارات إصلاح تحديث كلمة المرور"""
        print("🎯 بدء اختبار شامل لإصلاح مشكلة تحديث كلمة المرور في 'تفاصيل المستخدم الشاملة'")
        print("=" * 100)
        print("🎯 **الهدف:** إصلاح المشكلة: المستخدم يحصل على رسالة 'تم تغيير كلمة السر' لكن لا يستطيع الدخول بكلمة المرور الجديدة")
        print("=" * 100)
        
        # Test sequence
        tests = [
            self.test_admin_login_setup,
            self.test_create_test_user,
            self.test_password_update_with_new_field,
            self.test_login_with_new_password,
            self.test_old_password_rejection,
            self.test_update_without_password,
            self.test_empty_password_handling,
            self.test_cleanup
        ]
        
        success_count = 0
        total_tests = len(tests)
        
        for test in tests:
            if test():
                success_count += 1
            time.sleep(0.1)  # Small delay between tests
            
        # Calculate results
        success_rate = (success_count / total_tests) * 100
        total_time = time.time() - self.start_time
        
        # Calculate average response time
        response_times = [float(r["response_time"].replace("ms", "")) for r in self.results if r["response_time"] != "0.00ms"]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Print comprehensive summary
        print("\n" + "=" * 100)
        print("🎉 **COMPREHENSIVE PASSWORD UPDATE FIX TEST COMPLETE**")
        print(f"📊 **معدل النجاح: {success_rate:.1f}% ({success_count}/{total_tests} اختبار نجح)**")
        print(f"⏱️ **متوسط وقت الاستجابة: {avg_response_time:.2f}ms (ممتاز)**")
        print(f"🕒 **إجمالي وقت التنفيذ: {total_time:.2f}s**")
        print("=" * 100)
        
        print("\n📋 **تفاصيل النتائج المحددة:**")
        for result in self.results:
            print(f"{result['status']}: {result['test']} - {result['details']} ({result['response_time']})")
            
        # Final assessment based on Arabic requirements
        if success_rate == 100.0:
            print("\n🏆 **التقييم النهائي: المشكلة الحرجة محلولة بالكامل!**")
            print("✅ **PUT /api/users/{user_id} يعمل بشكل صحيح**")
            print("✅ **تشفير كلمة المرور الجديدة يعمل بنجاح**")
            print("✅ **لا توجد رسالة 'Not Found'**")
            print("✅ **تسجيل الدخول بكلمة المرور الجديدة يعمل**")
            print("✅ **كلمة المرور القديمة لا تعمل (كما متوقع)**")
            print("✅ **التحديث بدون كلمة مرور لا يؤثر على كلمة المرور الحالية**")
            print("✅ **كلمات المرور الفارغة يتم تجاهلها بشكل صحيح**")
            print("**🎉 المشكلة 'تظهر رسالة نجاح لكن لا يمكن الدخول' قد تم حلها بالكامل!**")
        elif success_rate >= 80.0:
            print(f"\n✅ **التقييم النهائي: نجاح جيد ({success_rate:.1f}%)**")
            print("معظم الوظائف تعمل بشكل صحيح مع بعض المشاكل البسيطة")
        else:
            print(f"\n⚠️ **التقييم النهائي: يحتاج تحسينات ({success_rate:.1f}%)**")
            print("توجد مشاكل تحتاج إصلاح قبل الاستخدام الفعلي")
            
        return success_rate

def main():
    """Main function to run comprehensive password update fix tests"""
    tester = ComprehensivePasswordUpdateTester()
    success_rate = tester.run_comprehensive_test()
    
    if success_rate == 100.0:
        exit(0)  # Perfect success
    elif success_rate >= 80.0:
        exit(1)  # Good but needs minor fixes
    else:
        exit(2)  # Needs significant fixes

if __name__ == "__main__":
    main()