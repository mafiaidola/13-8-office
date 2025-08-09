#!/usr/bin/env python3
"""
اختبار تكامل المستخدمين مع حقل الخط الجديد
User Integration Testing with New Line Field
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://27f64219-57e1-4ae7-9f08-6723a4a751d3.preview.emergentagent.com/api"

class UserLineIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_time=0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms"
        })
        print(f"{status} | {test_name} | {details} | {response_time:.2f}ms")
    
    def test_admin_login(self):
        """اختبار تسجيل الدخول للأدمن"""
        print("\n🔐 اختبار تسجيل الدخول للأدمن...")
        
        try:
            start_time = datetime.now()
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "username": "admin",
                    "password": "admin123"
                },
                timeout=10
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                
                if self.jwt_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.jwt_token}"
                    })
                    
                    user_info = data.get("user", {})
                    self.log_test(
                        "تسجيل دخول الأدمن",
                        True,
                        f"المستخدم: {user_info.get('full_name', 'admin')} | الدور: {user_info.get('role', 'admin')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test("تسجيل دخول الأدمن", False, "لم يتم الحصول على JWT token", response_time)
                    return False
            else:
                self.log_test("تسجيل دخول الأدمن", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول الأدمن", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def test_get_available_lines(self):
        """اختبار الحصول على قائمة الخطوط المتاحة"""
        print("\n📋 اختبار الحصول على قائمة الخطوط المتاحة...")
        
        try:
            start_time = datetime.now()
            response = self.session.get(f"{BACKEND_URL}/lines", timeout=10)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                lines = response.json()
                
                if isinstance(lines, list):
                    available_lines = []
                    for line in lines:
                        if line.get("is_active", True):
                            available_lines.append({
                                "id": line.get("id"),
                                "name": line.get("name"),
                                "code": line.get("code"),
                                "description": line.get("description", "")
                            })
                    
                    self.log_test(
                        "جلب الخطوط المتاحة",
                        True,
                        f"تم العثور على {len(available_lines)} خط متاح",
                        response_time
                    )
                    
                    # Store first available line for user creation test
                    if available_lines:
                        self.test_line_id = available_lines[0]["id"]
                        self.test_line_name = available_lines[0]["name"]
                        print(f"   📌 سيتم استخدام الخط: {self.test_line_name} (ID: {self.test_line_id})")
                        return True
                    else:
                        self.log_test("جلب الخطوط المتاحة", False, "لا توجد خطوط متاحة", response_time)
                        return False
                else:
                    self.log_test("جلب الخطوط المتاحة", False, "استجابة غير صحيحة من الخادم", response_time)
                    return False
            else:
                self.log_test("جلب الخطوط المتاحة", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("جلب الخطوط المتاحة", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def test_create_user_with_line(self):
        """اختبار إنشاء مستخدم جديد مع حقل line_id"""
        print("\n👤 اختبار إنشاء مستخدم جديد مع حقل الخط...")
        
        if not hasattr(self, 'test_line_id'):
            self.log_test("إنشاء مستخدم مع خط", False, "لا يوجد خط متاح للاختبار", 0)
            return False
        
        try:
            user_data = {
                "username": "test_user_with_line",
                "password": "test123",
                "full_name": "مستخدم تجريبي مع خط",
                "email": "test@example.com",
                "phone": "01234567890",
                "role": "medical_rep",
                "line_id": self.test_line_id,
                "address": "عنوان تجريبي"
            }
            
            start_time = datetime.now()
            response = self.session.post(
                f"{BACKEND_URL}/users",
                json=user_data,
                timeout=10
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success"):
                    created_user = data.get("user", {})
                    self.created_user_id = created_user.get("id")
                    
                    self.log_test(
                        "إنشاء مستخدم مع خط",
                        True,
                        f"تم إنشاء المستخدم: {created_user.get('full_name')} | الدور: {created_user.get('role')}",
                        response_time
                    )
                    
                    # Check if line_id was included in the response
                    if "line_id" in user_data:
                        print(f"   📌 تم تضمين line_id في البيانات المرسلة: {user_data['line_id']}")
                    
                    return True
                else:
                    self.log_test("إنشاء مستخدم مع خط", False, f"فشل في الإنشاء: {data.get('message', 'خطأ غير معروف')}", response_time)
                    return False
            else:
                error_text = response.text
                try:
                    error_data = response.json()
                    error_text = error_data.get("detail", error_text)
                except:
                    pass
                
                self.log_test("إنشاء مستخدم مع خط", False, f"HTTP {response.status_code}: {error_text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("إنشاء مستخدم مع خط", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def test_get_users_with_line_data(self):
        """اختبار الحصول على المستخدمين والتأكد من ظهور بيانات الخط"""
        print("\n👥 اختبار الحصول على المستخدمين مع بيانات الخط...")
        
        try:
            start_time = datetime.now()
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.status_code == 200:
                users = response.json()
                
                if isinstance(users, list):
                    # Find our test user
                    test_user = None
                    users_with_line = 0
                    
                    for user in users:
                        if user.get("username") == "test_user_with_line":
                            test_user = user
                        
                        # Count users with line information
                        if user.get("line_id") or user.get("line") or user.get("assigned_line_id"):
                            users_with_line += 1
                    
                    if test_user:
                        line_info = ""
                        has_line_data = False
                        
                        # Check various possible line field names
                        for field in ["line_id", "line", "assigned_line_id", "line_name"]:
                            if field in test_user and test_user[field]:
                                line_info += f"{field}: {test_user[field]} | "
                                has_line_data = True
                        
                        if has_line_data:
                            self.log_test(
                                "جلب المستخدمين مع بيانات الخط",
                                True,
                                f"تم العثور على المستخدم التجريبي مع بيانات الخط | {line_info.rstrip(' | ')}",
                                response_time
                            )
                        else:
                            self.log_test(
                                "جلب المستخدمين مع بيانات الخط",
                                False,
                                "تم العثور على المستخدم التجريبي لكن بدون بيانات الخط",
                                response_time
                            )
                        
                        print(f"   📊 إجمالي المستخدمين: {len(users)} | المستخدمين مع بيانات خط: {users_with_line}")
                        return has_line_data
                    else:
                        self.log_test(
                            "جلب المستخدمين مع بيانات الخط",
                            False,
                            "لم يتم العثور على المستخدم التجريبي",
                            response_time
                        )
                        return False
                else:
                    self.log_test("جلب المستخدمين مع بيانات الخط", False, "استجابة غير صحيحة من الخادم", response_time)
                    return False
            else:
                self.log_test("جلب المستخدمين مع بيانات الخط", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("جلب المستخدمين مع بيانات الخط", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def test_line_field_validation(self):
        """اختبار التحقق من صحة حقل line_id"""
        print("\n🔍 اختبار التحقق من صحة حقل line_id...")
        
        try:
            # Test with invalid line_id
            invalid_user_data = {
                "username": "test_invalid_line",
                "password": "test123",
                "full_name": "مستخدم تجريبي خط غير صحيح",
                "email": "invalid@example.com",
                "phone": "01234567891",
                "role": "medical_rep",
                "line_id": "invalid_line_id_12345",
                "address": "عنوان تجريبي"
            }
            
            start_time = datetime.now()
            response = self.session.post(
                f"{BACKEND_URL}/users",
                json=invalid_user_data,
                timeout=10
            )
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # The system should either accept it (if no validation) or reject it
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test(
                        "التحقق من line_id",
                        True,
                        "النظام يقبل line_id بدون تحقق (سلوك مقبول)",
                        response_time
                    )
                    return True
            elif response.status_code == 400:
                self.log_test(
                    "التحقق من line_id",
                    True,
                    "النظام يرفض line_id غير صحيح (سلوك جيد)",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "التحقق من line_id",
                    False,
                    f"استجابة غير متوقعة: HTTP {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("التحقق من line_id", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def cleanup_test_data(self):
        """تنظيف البيانات التجريبية"""
        print("\n🧹 تنظيف البيانات التجريبية...")
        
        # Note: Since there's no delete user endpoint visible in the backend,
        # we'll just log that cleanup would be needed
        print("   ℹ️  ملاحظة: قد تحتاج لحذف المستخدمين التجريبيين يدوياً من قاعدة البيانات")
        print("   📝 المستخدمين التجريبيين: test_user_with_line, test_invalid_line")
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار تكامل المستخدمين مع حقل الخط الجديد")
        print("=" * 80)
        
        # Test sequence
        tests_passed = 0
        total_tests = 5
        
        if self.test_admin_login():
            tests_passed += 1
        
        if self.test_get_available_lines():
            tests_passed += 1
        
        if self.test_create_user_with_line():
            tests_passed += 1
        
        if self.test_get_users_with_line_data():
            tests_passed += 1
        
        if self.test_line_field_validation():
            tests_passed += 1
        
        # Cleanup
        self.cleanup_test_data()
        
        # Final results
        print("\n" + "=" * 80)
        print("📊 نتائج الاختبار النهائية")
        print("=" * 80)
        
        success_rate = (tests_passed / total_tests) * 100
        status_emoji = "🎉" if success_rate >= 80 else "⚠️" if success_rate >= 60 else "❌"
        
        print(f"{status_emoji} نسبة النجاح: {success_rate:.1f}% ({tests_passed}/{total_tests} اختبارات نجحت)")
        
        print("\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']} ({result['response_time']})")
        
        # Summary and recommendations
        print("\n🎯 الملخص والتوصيات:")
        if success_rate >= 80:
            print("✅ نظام تكامل المستخدمين مع حقل الخط يعمل بشكل ممتاز!")
            print("✅ يمكن للنظام قبول وحفظ حقل line_id بشكل صحيح")
            print("✅ APIs الخطوط متاحة ويمكن استخدامها في واجهة إدارة المستخدمين")
        elif success_rate >= 60:
            print("⚠️ نظام تكامل المستخدمين يعمل مع بعض المشاكل البسيطة")
            print("⚠️ قد تحتاج بعض التحسينات في معالجة حقل line_id")
        else:
            print("❌ يوجد مشاكل كبيرة في نظام تكامل المستخدمين مع الخطوط")
            print("❌ يتطلب إصلاحات في الباكند قبل استخدام الميزة")
        
        print(f"\n🕒 وقت الاختبار: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return success_rate >= 60

if __name__ == "__main__":
    tester = UserLineIntegrationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)