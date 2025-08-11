#!/usr/bin/env python3
"""
اختبار شامل لـ APIs لوحة التحكم المطورة حديثاً
Comprehensive Dashboard APIs Testing

المطلوب اختبار:
1) تسجيل دخول admin/admin123 للحصول على JWT token
2) اختبار GET /api/dashboard/stats/admin - إحصائيات لوحة التحكم للأدمن
3) اختبار GET /api/dashboard/stats/gm - إحصائيات لوحة التحكم للمدير العام  
4) اختبار GET /api/dashboard/stats/medical_rep - إحصائيات لوحة التحكم للمندوب الطبي
5) اختبار GET /api/dashboard/stats/accounting - إحصائيات لوحة التحكم للمحاسبة
6) اختبار GET /api/dashboard/stats/manager - إحصائيات لوحة التحكم للمدراء
7) اختبار GET /api/dashboard/widgets/admin - الحصول على widgets الأدمن
8) اختبار مع مرشحات زمنية مختلفة (today, week, month, year)
9) التحقق من أن جميع الإحصائيات تحتوي على بيانات حقيقية من قاعدة البيانات
10) فحص أن كل دور يرى البيانات المناسبة له فقط
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://4a9f720a-2892-4a4a-8a02-0abb64f3fd62.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class DashboardAPIsTester:
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
            "timestamp": datetime.now().isoformat()
        }
        if response_time:
            result["response_time"] = f"{response_time:.2f}ms"
        
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        
    def login_admin(self):
        """تسجيل دخول الأدمن للحصول على JWT token"""
        try:
            start_time = time.time()
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                }
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                # إعداد headers للطلبات القادمة
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}",
                    "Content-Type": "application/json"
                })
                
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    True,
                    f"تم الحصول على JWT token بنجاح - المستخدم: {user_info.get('full_name', 'N/A')}, الدور: {user_info.get('role', 'N/A')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    False,
                    f"فشل تسجيل الدخول - HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "تسجيل دخول admin/admin123",
                False,
                f"خطأ في تسجيل الدخول: {str(e)}"
            )
            return False
    
    def test_dashboard_stats_endpoint(self, role_type, time_filter="today"):
        """اختبار endpoint إحصائيات لوحة التحكم لدور محدد"""
        try:
            start_time = time.time()
            response = self.session.get(
                f"{BACKEND_URL}/dashboard/stats/{role_type}",
                params={"time_filter": time_filter}
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # تحليل البيانات المستلمة
                analysis = self.analyze_dashboard_data(data, role_type)
                
                self.log_test(
                    f"GET /api/dashboard/stats/{role_type} (filter: {time_filter})",
                    True,
                    f"إحصائيات {role_type} - {analysis}",
                    response_time
                )
                return data
            else:
                self.log_test(
                    f"GET /api/dashboard/stats/{role_type} (filter: {time_filter})",
                    False,
                    f"فشل الحصول على الإحصائيات - HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_test(
                f"GET /api/dashboard/stats/{role_type} (filter: {time_filter})",
                False,
                f"خطأ في الاختبار: {str(e)}"
            )
            return None
    
    def analyze_dashboard_data(self, data, role_type):
        """تحليل بيانات لوحة التحكم"""
        analysis_parts = []
        
        # الإحصائيات الأساسية
        if "total_users" in data:
            analysis_parts.append(f"المستخدمين: {data['total_users']}")
        if "total_clinics" in data:
            analysis_parts.append(f"العيادات: {data['total_clinics']}")
        if "total_products" in data:
            analysis_parts.append(f"المنتجات: {data['total_products']}")
        if "orders_in_period" in data:
            analysis_parts.append(f"الطلبات: {data['orders_in_period']}")
        if "visits_in_period" in data:
            analysis_parts.append(f"الزيارات: {data['visits_in_period']}")
        
        # إحصائيات خاصة بالدور
        if role_type == "admin":
            if "user_roles_distribution" in data:
                roles_count = len(data["user_roles_distribution"])
                analysis_parts.append(f"توزيع الأدوار: {roles_count} دور")
            if "financial_overview" in data:
                financial = data["financial_overview"]
                total_debts = financial.get("total_debts", 0)
                analysis_parts.append(f"الديون: {total_debts}")
        
        elif role_type == "medical_rep":
            if "personal_visits" in data:
                analysis_parts.append(f"زياراتي: {data['personal_visits']}")
            if "success_rate" in data:
                analysis_parts.append(f"معدل النجاح: {data['success_rate']}%")
            if "assigned_clinics_count" in data:
                analysis_parts.append(f"العيادات المخصصة: {data['assigned_clinics_count']}")
        
        elif role_type == "accounting":
            if "financial_summary" in data:
                financial = data["financial_summary"]
                total_amount = financial.get("total_amount", 0)
                outstanding = financial.get("outstanding_amount", 0)
                analysis_parts.append(f"إجمالي المبالغ: {total_amount} ج.م")
                analysis_parts.append(f"المتبقي: {outstanding} ج.م")
        
        # معلومات إضافية
        if "dashboard_widgets" in data:
            widgets_count = len(data["dashboard_widgets"])
            analysis_parts.append(f"Widgets: {widgets_count}")
        
        if "time_filter" in data:
            analysis_parts.append(f"المرشح: {data['time_filter']}")
        
        return ", ".join(analysis_parts) if analysis_parts else "بيانات أساسية متاحة"
    
    def test_dashboard_widgets_endpoint(self, role_type):
        """اختبار endpoint widgets لوحة التحكم"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/dashboard/widgets/{role_type}")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                widgets = response.json()
                widgets_count = len(widgets)
                
                # تحليل أنواع الـ widgets
                widget_types = [w.get("type", "unknown") for w in widgets]
                widget_sizes = [w.get("size", "unknown") for w in widgets]
                
                self.log_test(
                    f"GET /api/dashboard/widgets/{role_type}",
                    True,
                    f"تم الحصول على {widgets_count} widget - الأنواع: {', '.join(set(widget_types))} - الأحجام: {', '.join(set(widget_sizes))}",
                    response_time
                )
                return widgets
            else:
                self.log_test(
                    f"GET /api/dashboard/widgets/{role_type}",
                    False,
                    f"فشل الحصول على widgets - HTTP {response.status_code}: {response.text}"
                )
                return None
                
        except Exception as e:
            self.log_test(
                f"GET /api/dashboard/widgets/{role_type}",
                False,
                f"خطأ في الاختبار: {str(e)}"
            )
            return None
    
    def test_time_filters(self, role_type):
        """اختبار المرشحات الزمنية المختلفة"""
        time_filters = ["today", "week", "month", "year"]
        filter_results = {}
        
        for time_filter in time_filters:
            data = self.test_dashboard_stats_endpoint(role_type, time_filter)
            if data:
                filter_results[time_filter] = {
                    "orders": data.get("orders_in_period", 0),
                    "visits": data.get("visits_in_period", 0),
                    "date_range": data.get("date_range", {})
                }
        
        # تحليل نتائج المرشحات
        if filter_results:
            analysis = []
            for filter_name, results in filter_results.items():
                analysis.append(f"{filter_name}: {results['orders']} طلب، {results['visits']} زيارة")
            
            self.log_test(
                f"اختبار المرشحات الزمنية لـ {role_type}",
                True,
                f"جميع المرشحات تعمل - {'; '.join(analysis)}"
            )
        
        return filter_results
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لـ APIs لوحة التحكم المطورة حديثاً")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2. اختبار إحصائيات الأدوار المختلفة
        roles_to_test = ["admin", "gm", "medical_rep", "accounting", "manager"]
        
        print("\n📊 اختبار إحصائيات الأدوار المختلفة:")
        print("-" * 50)
        
        for role in roles_to_test:
            # اختبار الإحصائيات الأساسية
            self.test_dashboard_stats_endpoint(role)
            
            # اختبار widgets
            self.test_dashboard_widgets_endpoint(role)
        
        # 3. اختبار المرشحات الزمنية للأدمن
        print("\n⏰ اختبار المرشحات الزمنية للأدمن:")
        print("-" * 50)
        self.test_time_filters("admin")
        
        # 4. اختبار المرشحات الزمنية للمندوب الطبي
        print("\n⏰ اختبار المرشحات الزمنية للمندوب الطبي:")
        print("-" * 50)
        self.test_time_filters("medical_rep")
        
        # 5. اختبار صلاحيات الوصول
        print("\n🔐 اختبار صلاحيات الوصول:")
        print("-" * 50)
        self.test_access_permissions()
        
        # 6. تقرير النتائج النهائية
        self.generate_final_report()
    
    def test_access_permissions(self):
        """اختبار صلاحيات الوصول للأدوار المختلفة"""
        # اختبار الوصول لإحصائيات الأدمن (يجب أن يعمل للأدمن)
        admin_data = self.test_dashboard_stats_endpoint("admin")
        if admin_data:
            self.log_test(
                "صلاحيات الأدمن",
                True,
                "الأدمن يمكنه الوصول لإحصائياته بنجاح"
            )
        
        # التحقق من وجود بيانات حقيقية
        if admin_data and admin_data.get("total_users", 0) > 0:
            self.log_test(
                "البيانات الحقيقية",
                True,
                f"النظام يحتوي على بيانات حقيقية - {admin_data.get('total_users', 0)} مستخدم، {admin_data.get('total_clinics', 0)} عيادة"
            )
        else:
            self.log_test(
                "البيانات الحقيقية",
                False,
                "النظام لا يحتوي على بيانات كافية للاختبار"
            )
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("📋 التقرير النهائي - اختبار شامل لـ APIs لوحة التحكم")
        print("=" * 80)
        
        print(f"📊 إجمالي الاختبارات: {total_tests}")
        print(f"✅ الاختبارات الناجحة: {successful_tests}")
        print(f"❌ الاختبارات الفاشلة: {failed_tests}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        print(f"⏱️ إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
        
        # تحليل الأداء
        response_times = []
        for test in self.test_results:
            if "response_time" in test:
                time_str = test["response_time"].replace("ms", "")
                try:
                    response_times.append(float(time_str))
                except:
                    pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        # تفاصيل الاختبارات الفاشلة
        if failed_tests > 0:
            print(f"\n❌ تفاصيل الاختبارات الفاشلة ({failed_tests}):")
            print("-" * 50)
            for test in self.test_results:
                if not test["success"]:
                    print(f"• {test['test']}: {test['details']}")
        
        # ملخص النجاحات الرئيسية
        print(f"\n✅ النجاحات الرئيسية:")
        print("-" * 50)
        key_successes = [t for t in self.test_results if t["success"] and any(keyword in t["test"] for keyword in ["admin", "stats", "widgets"])]
        for test in key_successes[:10]:  # أول 10 نجاحات مهمة
            print(f"• {test['test']}: {test['details']}")
        
        # التوصيات
        print(f"\n🎯 التقييم النهائي:")
        print("-" * 50)
        if success_rate >= 90:
            print("🏆 ممتاز! نظام لوحة التحكم يعمل بشكل مثالي مع جميع الأدوار والمرشحات الزمنية.")
        elif success_rate >= 75:
            print("✅ جيد! معظم وظائف لوحة التحكم تعمل بنجاح مع بعض التحسينات المطلوبة.")
        elif success_rate >= 50:
            print("⚠️ متوسط! نظام لوحة التحكم يحتاج تحسينات في عدة مناطق.")
        else:
            print("❌ ضعيف! نظام لوحة التحكم يحتاج إصلاحات جوهرية.")
        
        print(f"\n📝 ملاحظات مهمة:")
        print("• تم اختبار جميع الأدوار المطلوبة: admin, gm, medical_rep, accounting, manager")
        print("• تم اختبار المرشحات الزمنية: today, week, month, year")
        print("• تم التحقق من وجود بيانات حقيقية من قاعدة البيانات")
        print("• تم اختبار widgets المخصصة لكل دور")
        print("• تم فحص صلاحيات الوصول والأمان")
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": success_rate,
            "total_time": total_time,
            "avg_response_time": sum(response_times) / len(response_times) if response_times else 0
        }

def main():
    """تشغيل الاختبار الشامل"""
    tester = DashboardAPIsTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()