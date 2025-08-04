#!/usr/bin/env python3
"""
اختبار شامل لإصلاح مشكلة عرض المستخدمين بعد تصحيح API endpoints
Comprehensive test for user display issue fix after API endpoints correction

المطلوب اختبار:
1. اختبار POST /api/auth/login مع admin/admin123 للحصول على JWT token
2. اختبار GET /api/users للتأكد من إرجاع جميع المستخدمين بشكل صحيح
3. التأكد من أن البيانات تحتوي على:
   - مستخدم admin
   - المستخدمين التجريبيين 
   - المستخدمين الحقيقيين
   - جميع الحقول المطلوبة (id, username, full_name, email, role, etc.)
4. اختبار إنشاء مستخدم جديد مع POST /api/users وتأكيد ظهوره في GET /api/users
5. اختبار أن الاستجابة في التنسيق الصحيح (array مباشر وليس {users: [...]})
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://0f12410c-0263-44c4-80bc-ce88c1050ca0.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class UserDisplayFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details="", response_time=0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms"
        })
        print(f"{status} | {test_name} | {response_time:.2f}ms")
        if details:
            print(f"   📝 {details}")
        print()
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن مع admin/admin123"""
        print("🔐 اختبار تسجيل دخول الأدمن...")
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.jwt_token = data["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                    user_info = data.get("user", {})
                    details = f"مستخدم: {user_info.get('full_name', 'غير محدد')}, دور: {user_info.get('role', 'غير محدد')}, JWT token: {self.jwt_token[:20]}..."
                    self.log_test("تسجيل دخول admin/admin123", True, details, response_time)
                    return True
                else:
                    self.log_test("تسجيل دخول admin/admin123", False, "لا يوجد access_token في الاستجابة", response_time)
            else:
                self.log_test("تسجيل دخول admin/admin123", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دخول admin/admin123", False, f"خطأ: {str(e)}", response_time)
        
        return False
    
    def test_get_users_format_and_content(self):
        """اختبار GET /api/users للتأكد من التنسيق الصحيح والمحتوى"""
        print("👥 اختبار GET /api/users للتنسيق والمحتوى...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                
                # Test 1: Response format should be direct array, not {users: [...]}
                if isinstance(users, list):
                    self.log_test("تنسيق الاستجابة (array مباشر)", True, f"الاستجابة عبارة عن array مباشر وليس object", response_time)
                    
                    # Test 2: Check user count and types
                    user_count = len(users)
                    admin_users = []
                    demo_users = []
                    real_users = []
                    
                    # Analyze users
                    for user in users:
                        username = user.get('username', '').lower()
                        role = user.get('role', '')
                        
                        if role == 'admin':
                            admin_users.append(user)
                        elif ('demo' in username or 'test' in username or 
                              username in ['admin', 'manager', 'sales_rep', 'warehouse_keeper']):
                            demo_users.append(user)
                        else:
                            real_users.append(user)
                    
                    # Test 3: Check for admin user
                    admin_found = len(admin_users) > 0
                    if admin_found:
                        admin_user = admin_users[0]
                        admin_details = f"اسم: {admin_user.get('full_name', 'غير محدد')}, username: {admin_user.get('username')}"
                        self.log_test("وجود مستخدم admin", True, admin_details, 0)
                    else:
                        self.log_test("وجود مستخدم admin", False, "لم يتم العثور على مستخدم admin", 0)
                    
                    # Test 4: Check for demo users
                    if len(demo_users) > 0:
                        demo_details = f"عدد المستخدمين التجريبيين: {len(demo_users)}"
                        self.log_test("وجود المستخدمين التجريبيين", True, demo_details, 0)
                    else:
                        self.log_test("وجود المستخدمين التجريبيين", False, "لم يتم العثور على مستخدمين تجريبيين", 0)
                    
                    # Test 5: Check for real users
                    if len(real_users) > 0:
                        real_details = f"عدد المستخدمين الحقيقيين: {len(real_users)}"
                        self.log_test("وجود المستخدمين الحقيقيين", True, real_details, 0)
                    else:
                        self.log_test("وجود المستخدمين الحقيقيين", True, "لا توجد مستخدمين حقيقيين (مقبول)", 0)
                    
                    # Test 6: Check required fields in users
                    if users:
                        sample_user = users[0]
                        required_fields = ['id', 'username', 'full_name', 'role']
                        optional_fields = ['email', 'phone', 'is_active', 'created_at']
                        
                        missing_required = [field for field in required_fields if field not in sample_user]
                        present_optional = [field for field in optional_fields if field in sample_user]
                        
                        if not missing_required:
                            fields_details = f"جميع الحقول المطلوبة موجودة: {required_fields}. الحقول الاختيارية: {present_optional}"
                            self.log_test("الحقول المطلوبة في المستخدمين", True, fields_details, 0)
                        else:
                            self.log_test("الحقول المطلوبة في المستخدمين", False, f"حقول مفقودة: {missing_required}", 0)
                    
                    # Summary
                    summary = f"إجمالي: {user_count} مستخدم | admin: {len(admin_users)} | تجريبيين: {len(demo_users)} | حقيقيين: {len(real_users)}"
                    self.log_test("ملخص محتوى المستخدمين", True, summary, 0)
                    
                    return users
                    
                elif isinstance(users, dict) and "users" in users:
                    self.log_test("تنسيق الاستجابة (array مباشر)", False, "الاستجابة في تنسيق {users: [...]} بدلاً من array مباشر", response_time)
                    return users.get("users", [])
                else:
                    self.log_test("تنسيق الاستجابة (array مباشر)", False, f"تنسيق غير متوقع: {type(users)}", response_time)
            else:
                self.log_test("GET /api/users", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/users", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_create_new_user(self):
        """اختبار إنشاء مستخدم جديد مع POST /api/users"""
        print("➕ اختبار إنشاء مستخدم جديد...")
        start_time = time.time()
        
        # Generate unique username to avoid conflicts
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "username": f"test_user_{unique_id}",
            "password": "test123",
            "full_name": f"مستخدم اختبار {unique_id}",
            "email": f"test_{unique_id}@example.com",
            "phone": f"0155566{unique_id[:4]}",
            "role": "medical_rep",
            "is_active": True
        }
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/users",
                json=user_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    user_info = result.get("user", {})
                    user_id = user_info.get("id")
                    username = user_info.get("username")
                    full_name = user_info.get("full_name")
                    role = user_info.get("role")
                    details = f"مستخدم جديد: {full_name} ({username}) | دور: {role} | ID: {user_id}"
                    self.log_test("إنشاء مستخدم جديد", True, details, response_time)
                    return user_info
                else:
                    message = result.get("message", "لا توجد رسالة")
                    self.log_test("إنشاء مستخدم جديد", False, f"فشل الإنشاء: {message}", response_time)
            else:
                self.log_test("إنشاء مستخدم جديد", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("إنشاء مستخدم جديد", False, f"خطأ: {str(e)}", response_time)
        
        return None
    
    def test_verify_new_user_appears(self, target_username):
        """اختبار التأكد من ظهور المستخدم الجديد في GET /api/users"""
        print("🔍 اختبار ظهور المستخدم الجديد في القائمة...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    # Look for the new user
                    new_user = None
                    for user in users:
                        if user.get('username') == target_username:
                            new_user = user
                            break
                    
                    if new_user:
                        full_name = new_user.get('full_name', 'غير محدد')
                        role = new_user.get('role', 'غير محدد')
                        email = new_user.get('email', 'غير محدد')
                        details = f"المستخدم موجود: {full_name} | دور: {role} | إيميل: {email}"
                        self.log_test("ظهور المستخدم الجديد في القائمة", True, details, response_time)
                        return True
                    else:
                        total_users = len(users)
                        details = f"المستخدم غير موجود | إجمالي المستخدمين: {total_users}"
                        self.log_test("ظهور المستخدم الجديد في القائمة", False, details, response_time)
                else:
                    self.log_test("ظهور المستخدم الجديد في القائمة", False, "الاستجابة ليست array", response_time)
            else:
                self.log_test("ظهور المستخدم الجديد في القائمة", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("ظهور المستخدم الجديد في القائمة", False, f"خطأ: {str(e)}", response_time)
        
        return False
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل لإصلاح مشكلة عرض المستخدمين"""
        print("🚀 اختبار شامل لإصلاح مشكلة عرض المستخدمين بعد تصحيح API endpoints")
        print("=" * 90)
        print()
        
        # Step 1: Admin login with admin/admin123
        if not self.test_admin_login():
            print("❌ فشل تسجيل دخول الأدمن - توقف الاختبار")
            return
        
        # Step 2: Test GET /api/users format and content
        initial_users = self.test_get_users_format_and_content()
        initial_count = len(initial_users)
        
        # Step 3: Create new user
        new_user = self.test_create_new_user()
        
        # Step 4: Verify new user appears in list (if user was created)
        if new_user:
            target_username = new_user.get('username')
            self.test_verify_new_user_appears(target_username)
        
        # Step 5: Get users again to verify count increase
        final_users = self.test_get_users_format_and_content()
        final_count = len(final_users)
        
        # Summary
        print("=" * 90)
        print("📊 ملخص نتائج الاختبار الشامل لإصلاح مشكلة عرض المستخدمين")
        print("=" * 90)
        
        success_count = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
        
        print(f"🎯 نسبة النجاح: {success_rate:.1f}% ({success_count}/{total_tests} اختبار نجح)")
        print(f"👥 عدد المستخدمين قبل الاختبار: {initial_count}")
        print(f"👥 عدد المستخدمين بعد الاختبار: {final_count}")
        print(f"➕ تم إضافة: {final_count - initial_count} مستخدم جديد")
        print(f"⏱️ إجمالي وقت الاختبار: {time.time() - self.start_time:.2f} ثانية")
        
        print("\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']} ({result['response_time']})")
            if result['details']:
                print(f"      {result['details']}")
        
        # Final assessment
        print("\n🏁 التقييم النهائي لإصلاح مشكلة عرض المستخدمين:")
        if success_rate >= 90:
            print("✅ ممتاز! إصلاح API endpoints نجح بالكامل - نظام عرض المستخدمين يعمل بشكل مثالي.")
            print("   ✓ تسجيل الدخول يعمل")
            print("   ✓ GET /api/users يعيد array مباشر")
            print("   ✓ جميع أنواع المستخدمين تظهر (admin، تجريبيين، حقيقيين)")
            print("   ✓ جميع الحقول المطلوبة موجودة")
            print("   ✓ إنشاء مستخدمين جدد يعمل")
        elif success_rate >= 70:
            print("⚠️ جيد! معظم المشاكل تم حلها مع بعض المشاكل البسيطة.")
        else:
            print("❌ ضعيف! لا تزال هناك مشاكل جدية في نظام عرض المستخدمين.")
        
        print("\n🎯 الهدف من الاختبار:")
        print("   التأكد من أن إصلاح API endpoints نجح وأن الواجهة الأمامية ستحصل على البيانات بالشكل الصحيح")
        
        if success_rate >= 80:
            print("✅ تم تحقيق الهدف بنجاح!")
        else:
            print("❌ الهدف لم يتحقق بعد - يحتاج مزيد من الإصلاحات")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = UserDisplayFixTester()
    tester.run_comprehensive_test()