#!/usr/bin/env python3
"""
اختبار APIs الخطوط والمناطق للتأكد من توفرها لدمجها في واجهة إدارة المستخدمين
Testing Lines and Areas APIs to ensure availability for integration into user management interface

المطلوب اختبار:
Required Tests:
1. اختبار GET /api/lines للحصول على قائمة الخطوط المتاحة
2. اختبار GET /api/areas للحصول على قائمة المناطق المتاحة  
3. اختبار POST /api/auth/login مع admin/admin123 للحصول على JWT token
4. التأكد من أن APIs تعيد البيانات في الشكل المطلوب لاستخدامها في قوائم الاختيار
5. اختبار إذا كانت APIs تدعم الحقول المطلوبة (id, name, code, etc.)
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://d3d1a9df-70fc-435f-82af-b5d9d4d817e1.preview.emergentagent.com/api"

class LinesAreasAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", data_sample=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "data_sample": data_sample,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} - {test_name}")
        if details:
            print(f"   📝 {details}")
        if data_sample:
            print(f"   📊 عينة البيانات: {json.dumps(data_sample, ensure_ascii=False, indent=2)}")
        print()

    def test_admin_login(self):
        """اختبار تسجيل الدخول مع admin/admin123"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                
                if self.token:
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.token}'
                    })
                    
                    user_info = data.get("user", {})
                    self.log_test(
                        "تسجيل دخول الأدمن", 
                        True, 
                        f"تم الحصول على JWT token بنجاح. المستخدم: {user_info.get('full_name', 'admin')}",
                        {"token_length": len(self.token), "user_role": user_info.get("role")}
                    )
                    return True
                else:
                    self.log_test("تسجيل دخول الأدمن", False, "لم يتم الحصول على access_token")
                    return False
            else:
                self.log_test("تسجيل دخول الأدمن", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول الأدمن", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_lines_api(self):
        """اختبار GET /api/lines للحصول على قائمة الخطوط المتاحة"""
        try:
            response = self.session.get(f"{BACKEND_URL}/lines")
            
            if response.status_code == 200:
                lines = response.json()
                
                if isinstance(lines, list):
                    lines_count = len(lines)
                    
                    if lines_count > 0:
                        # فحص البنية المطلوبة للخط الأول
                        sample_line = lines[0]
                        required_fields = ["id", "name", "code"]
                        optional_fields = ["description", "manager_id", "manager_name", "is_active"]
                        
                        # التحقق من الحقول المطلوبة
                        missing_required = [field for field in required_fields if field not in sample_line]
                        present_optional = [field for field in optional_fields if field in sample_line]
                        
                        if not missing_required:
                            self.log_test(
                                "API الخطوط - البنية والبيانات",
                                True,
                                f"تم العثور على {lines_count} خط. الحقول المطلوبة متوفرة: {required_fields}. الحقول الإضافية: {present_optional}",
                                sample_line
                            )
                            return True, lines
                        else:
                            self.log_test(
                                "API الخطوط - البنية والبيانات",
                                False,
                                f"الحقول المطلوبة مفقودة: {missing_required}",
                                sample_line
                            )
                            return False, lines
                    else:
                        self.log_test(
                            "API الخطوط - البنية والبيانات",
                            True,
                            "API يعمل لكن لا توجد خطوط في النظام (قاعدة بيانات فارغة)",
                            {"lines_count": 0}
                        )
                        return True, []
                else:
                    self.log_test(
                        "API الخطوط - البنية والبيانات",
                        False,
                        f"تنسيق الاستجابة غير متوقع: {type(lines)}",
                        {"response_type": str(type(lines))}
                    )
                    return False, None
            else:
                self.log_test(
                    "API الخطوط - البنية والبيانات",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("API الخطوط - البنية والبيانات", False, f"خطأ: {str(e)}")
            return False, None

    def test_areas_api(self):
        """اختبار GET /api/areas للحصول على قائمة المناطق المتاحة"""
        try:
            response = self.session.get(f"{BACKEND_URL}/areas")
            
            if response.status_code == 200:
                areas = response.json()
                
                if isinstance(areas, list):
                    areas_count = len(areas)
                    
                    if areas_count > 0:
                        # فحص البنية المطلوبة للمنطقة الأولى
                        sample_area = areas[0]
                        required_fields = ["id", "name", "code"]
                        optional_fields = ["description", "parent_line_id", "manager_id", "manager_name", "is_active"]
                        
                        # التحقق من الحقول المطلوبة
                        missing_required = [field for field in required_fields if field not in sample_area]
                        present_optional = [field for field in optional_fields if field in sample_area]
                        
                        if not missing_required:
                            self.log_test(
                                "API المناطق - البنية والبيانات",
                                True,
                                f"تم العثور على {areas_count} منطقة. الحقول المطلوبة متوفرة: {required_fields}. الحقول الإضافية: {present_optional}",
                                sample_area
                            )
                            return True, areas
                        else:
                            self.log_test(
                                "API المناطق - البنية والبيانات",
                                False,
                                f"الحقول المطلوبة مفقودة: {missing_required}",
                                sample_area
                            )
                            return False, areas
                    else:
                        self.log_test(
                            "API المناطق - البنية والبيانات",
                            True,
                            "API يعمل لكن لا توجد مناطق في النظام (قاعدة بيانات فارغة)",
                            {"areas_count": 0}
                        )
                        return True, []
                else:
                    self.log_test(
                        "API المناطق - البنية والبيانات",
                        False,
                        f"تنسيق الاستجابة غير متوقع: {type(areas)}",
                        {"response_type": str(type(areas))}
                    )
                    return False, None
            else:
                self.log_test(
                    "API المناطق - البنية والبيانات",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False, None
                
        except Exception as e:
            self.log_test("API المناطق - البنية والبيانات", False, f"خطأ: {str(e)}")
            return False, None

    def test_data_format_for_ui_integration(self, lines_data, areas_data):
        """اختبار تنسيق البيانات لاستخدامها في قوائم الاختيار بالواجهة"""
        
        # اختبار تنسيق بيانات الخطوط
        if lines_data:
            ui_ready_lines = []
            for line in lines_data:
                if line.get("id") and line.get("name"):
                    ui_item = {
                        "value": line["id"],
                        "label": line["name"],
                        "code": line.get("code", ""),
                        "description": line.get("description", "")
                    }
                    ui_ready_lines.append(ui_item)
            
            if ui_ready_lines:
                self.log_test(
                    "تنسيق بيانات الخطوط للواجهة",
                    True,
                    f"تم تحويل {len(ui_ready_lines)} خط إلى تنسيق مناسب لقوائم الاختيار",
                    ui_ready_lines[0] if ui_ready_lines else None
                )
            else:
                self.log_test(
                    "تنسيق بيانات الخطوط للواجهة",
                    False,
                    "لا يمكن تحويل بيانات الخطوط إلى تنسيق مناسب للواجهة"
                )
        
        # اختبار تنسيق بيانات المناطق
        if areas_data:
            ui_ready_areas = []
            for area in areas_data:
                if area.get("id") and area.get("name"):
                    ui_item = {
                        "value": area["id"],
                        "label": area["name"],
                        "code": area.get("code", ""),
                        "parent_line": area.get("parent_line_id", ""),
                        "description": area.get("description", "")
                    }
                    ui_ready_areas.append(ui_item)
            
            if ui_ready_areas:
                self.log_test(
                    "تنسيق بيانات المناطق للواجهة",
                    True,
                    f"تم تحويل {len(ui_ready_areas)} منطقة إلى تنسيق مناسب لقوائم الاختيار",
                    ui_ready_areas[0] if ui_ready_areas else None
                )
            else:
                self.log_test(
                    "تنسيق بيانات المناطق للواجهة",
                    False,
                    "لا يمكن تحويل بيانات المناطق إلى تنسيق مناسب للواجهة"
                )

    def test_api_response_time(self):
        """اختبار سرعة استجابة APIs"""
        import time
        
        # اختبار سرعة API الخطوط
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/lines")
            lines_response_time = (time.time() - start_time) * 1000  # بالميلي ثانية
            
            if response.status_code == 200:
                self.log_test(
                    "سرعة استجابة API الخطوط",
                    True,
                    f"وقت الاستجابة: {lines_response_time:.2f} ميلي ثانية",
                    {"response_time_ms": round(lines_response_time, 2)}
                )
            else:
                self.log_test("سرعة استجابة API الخطوط", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("سرعة استجابة API الخطوط", False, f"خطأ: {str(e)}")
        
        # اختبار سرعة API المناطق
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/areas")
            areas_response_time = (time.time() - start_time) * 1000  # بالميلي ثانية
            
            if response.status_code == 200:
                self.log_test(
                    "سرعة استجابة API المناطق",
                    True,
                    f"وقت الاستجابة: {areas_response_time:.2f} ميلي ثانية",
                    {"response_time_ms": round(areas_response_time, 2)}
                )
            else:
                self.log_test("سرعة استجابة API المناطق", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("سرعة استجابة API المناطق", False, f"خطأ: {str(e)}")

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار APIs الخطوط والمناطق للدمج في واجهة إدارة المستخدمين")
        print("=" * 80)
        print("🎯 الهدف: التأكد من توفر البيانات قبل دمج حقل 'الخط' في واجهة تسجيل المستخدمين الجديدة")
        print()

        # 1. اختبار تسجيل الدخول
        print("1️⃣ اختبار المصادقة:")
        if not self.test_admin_login():
            print("❌ لا يمكن المتابعة بدون تسجيل دخول ناجح")
            return False

        # 2. اختبار API الخطوط
        print("2️⃣ اختبار API الخطوط:")
        lines_success, lines_data = self.test_lines_api()

        # 3. اختبار API المناطق
        print("3️⃣ اختبار API المناطق:")
        areas_success, areas_data = self.test_areas_api()

        # 4. اختبار تنسيق البيانات للواجهة
        print("4️⃣ اختبار تنسيق البيانات للواجهة:")
        self.test_data_format_for_ui_integration(lines_data, areas_data)

        # 5. اختبار سرعة الاستجابة
        print("5️⃣ اختبار سرعة الاستجابة:")
        self.test_api_response_time()

        # النتائج النهائية
        self.print_final_results()
        
        return lines_success and areas_success

    def print_final_results(self):
        """طباعة النتائج النهائية"""
        print("=" * 80)
        print("📊 النتائج النهائية:")
        print()
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for test in self.test_results if test["success"])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"✅ الاختبارات الناجحة: {passed_tests}")
        print(f"❌ الاختبارات الفاشلة: {total_tests - passed_tests}")
        print(f"📈 نسبة النجاح: {success_rate:.1f}%")
        print()
        
        # تفاصيل الاختبارات
        for test in self.test_results:
            status = "✅" if test["success"] else "❌"
            print(f"{status} {test['test_name']}: {test['details']}")
        
        print()
        print("🎯 تقييم الجاهزية للدمج في الواجهة:")
        print("-" * 50)
        
        # فحص الجاهزية للدمج
        login_success = any(test["success"] and "تسجيل دخول" in test["test_name"] for test in self.test_results)
        lines_api_success = any(test["success"] and "API الخطوط" in test["test_name"] for test in self.test_results)
        areas_api_success = any(test["success"] and "API المناطق" in test["test_name"] for test in self.test_results)
        ui_format_success = any(test["success"] and "تنسيق" in test["test_name"] for test in self.test_results)
        
        if login_success and lines_api_success and areas_api_success:
            print("✅ النظام جاهز للدمج في واجهة إدارة المستخدمين!")
            print("✅ يمكن إضافة حقل 'الخط' في واجهة تسجيل المستخدمين الجديدة")
            print("✅ APIs الخطوط والمناطق متاحة وتعمل بشكل صحيح")
            
            if ui_format_success:
                print("✅ تنسيق البيانات مناسب لقوائم الاختيار في الواجهة")
            
        else:
            print("❌ النظام غير جاهز للدمج - يحتاج إصلاحات:")
            if not login_success:
                print("   - مشكلة في نظام المصادقة")
            if not lines_api_success:
                print("   - مشكلة في API الخطوط")
            if not areas_api_success:
                print("   - مشكلة في API المناطق")
        
        print()
        print("📋 التوصيات للمطور الرئيسي:")
        print("-" * 40)
        
        if success_rate >= 80:
            print("✅ يمكن المتابعة لتطوير الواجهة الأمامية")
            print("✅ APIs الباكند جاهزة للاستخدام")
        else:
            print("⚠️ يُنصح بإصلاح المشاكل المكتشفة قبل تطوير الواجهة")
            print("⚠️ راجع تفاصيل الاختبارات الفاشلة أعلاه")

def main():
    """الدالة الرئيسية"""
    print("🗺️ اختبار APIs الخطوط والمناطق - مراجعة عربية")
    print("=" * 60)
    
    tester = LinesAreasAPITester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 النتيجة العامة: نجح الاختبار")
        print("✅ APIs الخطوط والمناطق جاهزة للدمج في واجهة إدارة المستخدمين!")
        sys.exit(0)
    else:
        print("\n⚠️ النتيجة العامة: يحتاج انتباه")
        print("❌ بعض المشاكل تحتاج إصلاح قبل الدمج")
        sys.exit(1)

# تشغيل الاختبار المطلوب
if __name__ == "__main__":
    main()