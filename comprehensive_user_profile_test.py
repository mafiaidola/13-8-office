#!/usr/bin/env python3
"""
اختبار شامل لمشكلة "خطأ في تحميل البيانات الشاملة" في إدارة المستخدمين
Comprehensive test for "Error loading comprehensive data" issue in user management

المطلوب حسب المراجعة العربية:
1) تسجيل دخول admin/admin123 للحصول على JWT token
2) GET /api/users - جلب قائمة المستخدمين المتاحة
3) استخدام أول user ID للاختبار: GET /api/users/{user_id}/comprehensive-profile
4) فحص الاستجابة والتأكد من إرجاع البيانات بشكل صحيح
5) إذا وُجد خطأ، تتبع التفاصيل في backend logs
6) اختبار عدة user IDs مختلفة للتأكد من الاتساق

الهدف: تحديد السبب الدقيق لرسالة "خطأ في تحميل البيانات الشاملة" وإصلاحه نهائياً
"""

import requests
import json
import time
from datetime import datetime
import os

# Configuration
BACKEND_URL = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveUserProfileTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": f"{response_time:.2f}" if response_time else "N/A"
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}: {details}{time_info}")
        
    def login_admin(self):
        """تسجيل دخول الأدمن للحصول على JWT token"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                
                if self.jwt_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.jwt_token}",
                        "Content-Type": "application/json"
                    })
                    
                    user_info = data.get("user", {})
                    self.log_test(
                        "تسجيل دخول admin/admin123",
                        True,
                        f"تم تسجيل الدخول بنجاح - المستخدم: {user_info.get('full_name', 'غير محدد')}, الدور: {user_info.get('role', 'غير محدد')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test("تسجيل دخول admin/admin123", False, "لم يتم الحصول على JWT token", response_time)
                    return False
            else:
                self.log_test("تسجيل دخول admin/admin123", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول admin/admin123", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def get_users_list(self):
        """جلب قائمة المستخدمين المتاحة"""
        try:
            start_time = time.time()
            
            response = self.session.get(f"{BACKEND_URL}/users")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                
                if isinstance(users, list) and len(users) > 0:
                    # تحليل المستخدمين
                    total_users = len(users)
                    active_users = len([u for u in users if u.get("is_active", True)])
                    roles_count = {}
                    
                    for user in users:
                        role = user.get("role", "غير محدد")
                        roles_count[role] = roles_count.get(role, 0) + 1
                    
                    roles_summary = ", ".join([f"{role}: {count}" for role, count in roles_count.items()])
                    
                    self.log_test(
                        "GET /api/users - جلب قائمة المستخدمين",
                        True,
                        f"تم جلب {total_users} مستخدم ({active_users} نشط) - الأدوار: {roles_summary}",
                        response_time
                    )
                    return users
                else:
                    self.log_test("GET /api/users", False, "قائمة المستخدمين فارغة أو غير صحيحة", response_time)
                    return []
            else:
                self.log_test("GET /api/users", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return []
                
        except Exception as e:
            self.log_test("GET /api/users", False, f"خطأ في جلب المستخدمين: {str(e)}")
            return []
    
    def test_comprehensive_profile(self, user_id, user_name="غير محدد", test_number=1):
        """اختبار الملف الشخصي الشامل لمستخدم محدد"""
        try:
            start_time = time.time()
            
            response = self.session.get(f"{BACKEND_URL}/users/{user_id}/comprehensive-profile")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # فحص بنية الاستجابة
                    if "user_profile" in data and data.get("success"):
                        user_profile = data["user_profile"]
                        comprehensive_data = user_profile.get("comprehensive_data", {})
                        
                        # تحليل البيانات المتاحة
                        data_sections = []
                        if "sales_performance" in comprehensive_data:
                            sales = comprehensive_data["sales_performance"]
                            data_sections.append(f"المبيعات ({sales.get('total_orders', 0)} طلب، {sales.get('total_sales', 0):.2f} ج.م)")
                        
                        if "assigned_clinics" in comprehensive_data:
                            clinics_count = len(comprehensive_data["assigned_clinics"])
                            data_sections.append(f"العيادات المخصصة ({clinics_count})")
                        
                        if "debt_management" in comprehensive_data:
                            debt = comprehensive_data["debt_management"]
                            data_sections.append(f"إدارة الديون ({debt.get('total_debts', 0)} دين)")
                        
                        if "direct_reports" in comprehensive_data:
                            reports_count = len(comprehensive_data["direct_reports"])
                            data_sections.append(f"المرؤوسين ({reports_count})")
                        
                        if "available_products" in comprehensive_data:
                            products_count = len(comprehensive_data["available_products"])
                            data_sections.append(f"المنتجات المتاحة ({products_count})")
                        
                        data_completeness = user_profile.get("data_completeness", 0)
                        sections_summary = ", ".join(data_sections) if data_sections else "لا توجد بيانات إضافية"
                        
                        self.log_test(
                            f"اختبار {test_number}: GET /api/users/{user_id}/comprehensive-profile",
                            True,
                            f"تم جلب البيانات الشاملة بنجاح للمستخدم '{user_name}' - اكتمال البيانات: {data_completeness:.1f}% - الأقسام: {sections_summary}",
                            response_time
                        )
                        return True, data
                    else:
                        self.log_test(
                            f"اختبار {test_number}: GET /api/users/{user_id}/comprehensive-profile",
                            False,
                            f"بنية الاستجابة غير صحيحة للمستخدم '{user_name}' - مفاتيح الاستجابة: {list(data.keys())}",
                            response_time
                        )
                        return False, data
                        
                except json.JSONDecodeError as e:
                    self.log_test(
                        f"اختبار {test_number}: GET /api/users/{user_id}/comprehensive-profile",
                        False,
                        f"خطأ في تحليل JSON للمستخدم '{user_name}': {str(e)}",
                        response_time
                    )
                    return False, response.text
            else:
                # هذا هو المكان المحتمل للخطأ "خطأ في تحميل البيانات الشاملة"
                error_details = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        error_details += f" - {error_data['detail']}"
                except:
                    error_details += f" - {response.text[:200]}"
                
                self.log_test(
                    f"اختبار {test_number}: GET /api/users/{user_id}/comprehensive-profile",
                    False,
                    f"فشل في جلب البيانات الشاملة للمستخدم '{user_name}' - {error_details}",
                    response_time
                )
                return False, error_details
                
        except Exception as e:
            self.log_test(
                f"اختبار {test_number}: GET /api/users/{user_id}/comprehensive-profile",
                False,
                f"خطأ في الاتصال للمستخدم '{user_name}': {str(e)}"
            )
            return False, str(e)
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🔍 **بدء اختبار شامل لمشكلة 'خطأ في تحميل البيانات الشاملة' في إدارة المستخدمين**")
        print("=" * 80)
        
        # 1. تسجيل دخول admin/admin123
        if not self.login_admin():
            print("❌ فشل في تسجيل الدخول - لا يمكن المتابعة")
            return
        
        # 2. جلب قائمة المستخدمين
        users = self.get_users_list()
        if not users:
            print("❌ لا توجد مستخدمين للاختبار - لا يمكن المتابعة")
            return
        
        # 3. اختبار أول مستخدم (كما طُلب في المراجعة)
        first_user = users[0]
        first_user_id = first_user.get("id")
        first_user_name = first_user.get("full_name", first_user.get("username", "غير محدد"))
        
        print(f"\n📋 **اختبار المستخدم الأول كما طُلب:**")
        print(f"   المستخدم: {first_user_name}")
        print(f"   ID: {first_user_id}")
        print(f"   الدور: {first_user.get('role', 'غير محدد')}")
        
        success, data = self.test_comprehensive_profile(first_user_id, first_user_name, 1)
        
        # 4. اختبار مستخدمين إضافيين للتأكد من الاتساق
        print(f"\n📋 **اختبار مستخدمين إضافيين للتأكد من الاتساق:**")
        
        # اختبار حتى 5 مستخدمين إضافيين أو جميع المستخدمين إذا كانوا أقل
        additional_users = users[1:6] if len(users) > 1 else []
        
        successful_tests = 1 if success else 0
        total_tests = 1
        
        for i, user in enumerate(additional_users, 2):
            user_id = user.get("id")
            user_name = user.get("full_name", user.get("username", "غير محدد"))
            user_role = user.get("role", "غير محدد")
            
            print(f"   اختبار المستخدم {i}: {user_name} ({user_role})")
            
            test_success, test_data = self.test_comprehensive_profile(user_id, user_name, i)
            if test_success:
                successful_tests += 1
            total_tests += 1
        
        # 5. تحليل النتائج النهائية
        print(f"\n📊 **تحليل النتائج النهائية:**")
        success_rate = (successful_tests / total_tests) * 100
        
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   الاختبارات الناجحة: {successful_tests}")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        
        if success_rate == 100:
            print("✅ **النتيجة: جميع اختبارات البيانات الشاملة نجحت - لا توجد مشكلة!**")
        elif success_rate >= 80:
            print("⚠️ **النتيجة: معظم الاختبارات نجحت - مشكلة جزئية تحتاج فحص**")
        else:
            print("❌ **النتيجة: مشكلة حرجة في تحميل البيانات الشاملة - تحتاج إصلاح فوري**")
        
        # 6. تحديد السبب الجذري إذا وُجدت مشاكل
        failed_tests = [test for test in self.test_results if not test["success"] and "comprehensive-profile" in test["test"]]
        
        if failed_tests:
            print(f"\n🔍 **تحليل الأخطاء المكتشفة:**")
            error_patterns = {}
            
            for failed_test in failed_tests:
                error_detail = failed_test["details"]
                if "HTTP 500" in error_detail:
                    error_patterns["خطأ خادم داخلي (HTTP 500)"] = error_patterns.get("خطأ خادم داخلي (HTTP 500)", 0) + 1
                elif "HTTP 404" in error_detail:
                    error_patterns["مستخدم غير موجود (HTTP 404)"] = error_patterns.get("مستخدم غير موجود (HTTP 404)", 0) + 1
                elif "HTTP 403" in error_detail:
                    error_patterns["عدم وجود صلاحية (HTTP 403)"] = error_patterns.get("عدم وجود صلاحية (HTTP 403)", 0) + 1
                elif "JSON" in error_detail:
                    error_patterns["خطأ في تحليل البيانات"] = error_patterns.get("خطأ في تحليل البيانات", 0) + 1
                else:
                    error_patterns["أخطاء أخرى"] = error_patterns.get("أخطاء أخرى", 0) + 1
            
            for error_type, count in error_patterns.items():
                print(f"   - {error_type}: {count} حالة")
        
        # 7. التوصيات
        print(f"\n💡 **التوصيات:**")
        if success_rate == 100:
            print("   - النظام يعمل بشكل مثالي، لا حاجة لإصلاحات")
            print("   - يمكن إبلاغ المستخدم أن المشكلة قد تكون مؤقتة أو في الواجهة الأمامية")
        else:
            print("   - فحص backend logs للحصول على تفاصيل أكثر عن الأخطاء")
            print("   - التأكد من صحة بيانات قاعدة البيانات")
            print("   - فحص صلاحيات المستخدمين")
            if "HTTP 500" in str(error_patterns):
                print("   - إصلاح الأخطاء الداخلية في الخادم (HTTP 500)")
        
        # 8. ملخص الأداء
        total_time = time.time() - self.start_time
        avg_response_time = sum([float(test["response_time_ms"]) for test in self.test_results if test["response_time_ms"] != "N/A"]) / len([test for test in self.test_results if test["response_time_ms"] != "N/A"])
        
        print(f"\n⏱️ **ملخص الأداء:**")
        print(f"   إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        print(f"   متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        return success_rate >= 80

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = ComprehensiveUserProfileTester()
    
    try:
        success = tester.run_comprehensive_test()
        
        print(f"\n{'='*80}")
        if success:
            print("🎉 **اختبار مشكلة 'خطأ في تحميل البيانات الشاملة' مكتمل بنجاح!**")
        else:
            print("⚠️ **اختبار مشكلة 'خطأ في تحميل البيانات الشاملة' اكتشف مشاكل تحتاج إصلاح**")
            
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف الاختبار بواسطة المستخدم")
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع في الاختبار: {str(e)}")

if __name__ == "__main__":
    main()