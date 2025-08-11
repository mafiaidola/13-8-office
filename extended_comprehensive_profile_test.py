#!/usr/bin/env python3
"""
اختبار موسع للتأكد من إصلاح مشكلة "خطأ في تحميل البيانات الشاملة" نهائياً
Extended test to ensure the comprehensive data loading issue is permanently fixed
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ExtendedComprehensiveProfileTester:
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
        """تسجيل دخول الأدمن"""
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
    
    def get_all_users(self):
        """جلب جميع المستخدمين"""
        try:
            start_time = time.time()
            
            response = self.session.get(f"{BACKEND_URL}/users")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                
                if isinstance(users, list) and len(users) > 0:
                    # تحليل المستخدمين حسب الأدوار
                    roles_analysis = {}
                    for user in users:
                        role = user.get("role", "غير محدد")
                        if role not in roles_analysis:
                            roles_analysis[role] = []
                        roles_analysis[role].append({
                            "id": user.get("id"),
                            "name": user.get("full_name", user.get("username", "غير محدد")),
                            "is_active": user.get("is_active", True)
                        })
                    
                    total_users = len(users)
                    roles_summary = ", ".join([f"{role}: {len(users_list)}" for role, users_list in roles_analysis.items()])
                    
                    self.log_test(
                        "GET /api/users - جلب جميع المستخدمين",
                        True,
                        f"تم جلب {total_users} مستخدم - الأدوار: {roles_summary}",
                        response_time
                    )
                    return users, roles_analysis
                else:
                    self.log_test("GET /api/users", False, "قائمة المستخدمين فارغة", response_time)
                    return [], {}
            else:
                self.log_test("GET /api/users", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return [], {}
                
        except Exception as e:
            self.log_test("GET /api/users", False, f"خطأ في جلب المستخدمين: {str(e)}")
            return [], {}
    
    def test_comprehensive_profile_detailed(self, user_id, user_name, user_role, test_number):
        """اختبار مفصل للملف الشخصي الشامل"""
        try:
            start_time = time.time()
            
            response = self.session.get(f"{BACKEND_URL}/users/{user_id}/comprehensive-profile")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    if "user_profile" in data and data.get("success"):
                        user_profile = data["user_profile"]
                        comprehensive_data = user_profile.get("comprehensive_data", {})
                        
                        # تحليل مفصل للبيانات المتاحة
                        sections_analysis = {}
                        
                        # تحليل بيانات المبيعات
                        if "sales_performance" in comprehensive_data:
                            sales = comprehensive_data["sales_performance"]
                            sections_analysis["sales"] = {
                                "total_orders": sales.get("total_orders", 0),
                                "total_sales": sales.get("total_sales", 0),
                                "conversion_rate": sales.get("conversion_rate", 0)
                            }
                        
                        # تحليل العيادات المخصصة
                        if "assigned_clinics" in comprehensive_data:
                            clinics = comprehensive_data["assigned_clinics"]
                            sections_analysis["clinics"] = {
                                "count": len(clinics),
                                "active": len([c for c in clinics if c.get("is_active", True)])
                            }
                        
                        # تحليل إدارة الديون
                        if "debt_management" in comprehensive_data:
                            debt = comprehensive_data["debt_management"]
                            sections_analysis["debt"] = {
                                "total_debts": debt.get("total_debts", 0),
                                "outstanding_debts": debt.get("outstanding_debts", 0)
                            }
                        
                        # تحليل المنتجات المتاحة
                        if "available_products" in comprehensive_data:
                            products = comprehensive_data["available_products"]
                            sections_analysis["products"] = {
                                "count": len(products),
                                "can_order": len([p for p in products if p.get("can_order", False)])
                            }
                        
                        # تحليل التسلسل الإداري
                        if "direct_reports" in comprehensive_data:
                            reports = comprehensive_data["direct_reports"]
                            sections_analysis["management"] = {
                                "direct_reports": len(reports)
                            }
                        
                        # تحليل الأداء
                        if "performance_metrics" in comprehensive_data:
                            performance = comprehensive_data["performance_metrics"]
                            sections_analysis["performance"] = {
                                "target_achievement": performance.get("target_achievement", 0),
                                "rating": performance.get("performance_rating", "غير محدد")
                            }
                        
                        data_completeness = user_profile.get("data_completeness", 0)
                        sections_count = len(sections_analysis)
                        
                        # إنشاء ملخص مفصل
                        details_parts = []
                        for section, data in sections_analysis.items():
                            if section == "sales":
                                details_parts.append(f"المبيعات ({data['total_orders']} طلب، {data['total_sales']:.2f} ج.م)")
                            elif section == "clinics":
                                details_parts.append(f"العيادات ({data['count']} إجمالي، {data['active']} نشط)")
                            elif section == "debt":
                                details_parts.append(f"الديون ({data['total_debts']} إجمالي، {data['outstanding_debts']} مستحق)")
                            elif section == "products":
                                details_parts.append(f"المنتجات ({data['count']} متاح، {data['can_order']} قابل للطلب)")
                            elif section == "management":
                                details_parts.append(f"الإدارة ({data['direct_reports']} مرؤوس)")
                            elif section == "performance":
                                details_parts.append(f"الأداء ({data['target_achievement']:.1f}% من الهدف)")
                        
                        sections_summary = ", ".join(details_parts) if details_parts else "لا توجد بيانات إضافية"
                        
                        self.log_test(
                            f"اختبار {test_number}: {user_role} - {user_name}",
                            True,
                            f"البيانات الشاملة مُحملة بنجاح - اكتمال: {data_completeness:.1f}% - الأقسام ({sections_count}): {sections_summary}",
                            response_time
                        )
                        return True, sections_analysis
                    else:
                        self.log_test(
                            f"اختبار {test_number}: {user_role} - {user_name}",
                            False,
                            f"بنية الاستجابة غير صحيحة - مفاتيح: {list(data.keys())}",
                            response_time
                        )
                        return False, {}
                        
                except json.JSONDecodeError as e:
                    self.log_test(
                        f"اختبار {test_number}: {user_role} - {user_name}",
                        False,
                        f"خطأ في تحليل JSON: {str(e)}",
                        response_time
                    )
                    return False, {}
            else:
                error_details = f"HTTP {response.status_code}"
                try:
                    error_data = response.json()
                    if "detail" in error_data:
                        error_details += f" - {error_data['detail']}"
                except:
                    error_details += f" - {response.text[:200]}"
                
                self.log_test(
                    f"اختبار {test_number}: {user_role} - {user_name}",
                    False,
                    f"فشل في تحميل البيانات الشاملة - {error_details}",
                    response_time
                )
                return False, {}
                
        except Exception as e:
            self.log_test(
                f"اختبار {test_number}: {user_role} - {user_name}",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False, {}
    
    def run_extended_test(self):
        """تشغيل الاختبار الموسع"""
        print("🔍 **بدء اختبار موسع للتأكد من إصلاح مشكلة 'خطأ في تحميل البيانات الشاملة' نهائياً**")
        print("=" * 90)
        
        # 1. تسجيل دخول admin/admin123
        if not self.login_admin():
            print("❌ فشل في تسجيل الدخول - لا يمكن المتابعة")
            return False
        
        # 2. جلب جميع المستخدمين
        users, roles_analysis = self.get_all_users()
        if not users:
            print("❌ لا توجد مستخدمين للاختبار - لا يمكن المتابعة")
            return False
        
        print(f"\n📋 **اختبار جميع المستخدمين حسب الأدوار:**")
        
        successful_tests = 0
        total_tests = 0
        role_results = {}
        
        # اختبار المستخدمين حسب الأدوار
        for role, users_list in roles_analysis.items():
            print(f"\n🔸 **اختبار مستخدمي دور '{role}' ({len(users_list)} مستخدم):**")
            
            role_success = 0
            role_total = 0
            
            for i, user_info in enumerate(users_list, 1):
                user_id = user_info["id"]
                user_name = user_info["name"]
                is_active = user_info["is_active"]
                
                status_indicator = "🟢" if is_active else "🔴"
                print(f"   {status_indicator} اختبار {i}: {user_name}")
                
                test_success, sections_data = self.test_comprehensive_profile_detailed(
                    user_id, user_name, role, f"{role}_{i}"
                )
                
                if test_success:
                    successful_tests += 1
                    role_success += 1
                
                total_tests += 1
                role_total += 1
            
            role_success_rate = (role_success / role_total * 100) if role_total > 0 else 0
            role_results[role] = {
                "success": role_success,
                "total": role_total,
                "success_rate": role_success_rate
            }
            
            print(f"   📊 نتيجة دور '{role}': {role_success}/{role_total} ({role_success_rate:.1f}%)")
        
        # 3. تحليل النتائج النهائية
        print(f"\n📊 **تحليل النتائج النهائية الشامل:**")
        overall_success_rate = (successful_tests / total_tests) * 100
        
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   الاختبارات الناجحة: {successful_tests}")
        print(f"   معدل النجاح الإجمالي: {overall_success_rate:.1f}%")
        
        print(f"\n📈 **تحليل النتائج حسب الأدوار:**")
        for role, results in role_results.items():
            status_emoji = "✅" if results["success_rate"] == 100 else "⚠️" if results["success_rate"] >= 80 else "❌"
            print(f"   {status_emoji} {role}: {results['success']}/{results['total']} ({results['success_rate']:.1f}%)")
        
        # 4. تقييم الإصلاح
        print(f"\n🎯 **تقييم نجاح الإصلاح:**")
        if overall_success_rate == 100:
            print("✅ **الإصلاح ناجح بنسبة 100% - مشكلة 'خطأ في تحميل البيانات الشاملة' تم حلها نهائياً!**")
            print("   - جميع المستخدمين من جميع الأدوار يمكنهم تحميل البيانات الشاملة بنجاح")
            print("   - النظام مستقر ويعمل بشكل مثالي")
        elif overall_success_rate >= 95:
            print("✅ **الإصلاح ناجح بشكل شبه كامل - مشكلة 'خطأ في تحميل البيانات الشاملة' محلولة تقريباً!**")
            print("   - معظم المستخدمين يمكنهم تحميل البيانات الشاملة")
            print("   - قد توجد حالات استثنائية بسيطة")
        elif overall_success_rate >= 80:
            print("⚠️ **الإصلاح جيد لكن يحتاج تحسينات - مشكلة 'خطأ في تحميل البيانات الشاملة' محلولة جزئياً**")
            print("   - معظم المستخدمين يمكنهم تحميل البيانات")
            print("   - بعض الأدوار قد تواجه مشاكل")
        else:
            print("❌ **الإصلاح غير كافي - مشكلة 'خطأ في تحميل البيانات الشاملة' لا تزال موجودة**")
            print("   - العديد من المستخدمين لا يزالون يواجهون مشاكل")
            print("   - يحتاج إصلاحات إضافية")
        
        # 5. ملخص الأداء
        total_time = time.time() - self.start_time
        successful_response_times = [float(test["response_time_ms"]) for test in self.test_results if test["success"] and test["response_time_ms"] != "N/A"]
        avg_response_time = sum(successful_response_times) / len(successful_response_times) if successful_response_times else 0
        
        print(f"\n⏱️ **ملخص الأداء:**")
        print(f"   إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        print(f"   متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   أسرع استجابة: {min(successful_response_times):.2f}ms" if successful_response_times else "N/A")
        print(f"   أبطأ استجابة: {max(successful_response_times):.2f}ms" if successful_response_times else "N/A")
        
        return overall_success_rate >= 95

def main():
    """تشغيل الاختبار الموسع"""
    tester = ExtendedComprehensiveProfileTester()
    
    try:
        success = tester.run_extended_test()
        
        print(f"\n{'='*90}")
        if success:
            print("🎉 **الاختبار الموسع مكتمل بنجاح - مشكلة 'خطأ في تحميل البيانات الشاملة' محلولة نهائياً!**")
        else:
            print("⚠️ **الاختبار الموسع اكتشف مشاكل تحتاج مراجعة إضافية**")
            
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف الاختبار بواسطة المستخدم")
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع في الاختبار: {str(e)}")

if __name__ == "__main__":
    main()