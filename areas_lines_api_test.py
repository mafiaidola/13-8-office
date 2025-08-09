#!/usr/bin/env python3
"""
اختبار APIs المناطق والخطوط للتأكد من البيانات المتاحة
Testing Areas and Lines APIs to ensure data availability

المطلوب اختبار:
Required Testing:
1. اختبار POST /api/auth/login مع admin/admin123 للحصول على JWT token
2. اختبار GET /api/areas للحصول على قائمة المناطق المتاحة من قسم إدارة الخطوط والمناطق
3. اختبار GET /api/lines للحصول على قائمة الخطوط المتاحة
4. التحقق من تنسيق البيانات وأنها تحتوي على الحقول المطلوبة:
   - id
   - name 
   - code (إن وجد)
   - line_id للمناطق (الربط مع الخطوط)
5. اختبار أي endpoints أخرى متعلقة بالمناطق مثل:
   - GET /api/regions
   - GET /api/geographic/areas
   - GET /api/geographic/regions

هذا الاختبار مطلوب لفهم البيانات المتاحة وكيفية ربطها بشكل صحيح في واجهة إدارة المستخدمين.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://0f89e653-23a1-4222-bcbe-a4908839f7c6.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class AreasLinesAPITester:
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
        """اختبار تسجيل دخول الأدمن"""
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
                    details = f"مستخدم: {user_info.get('full_name', 'غير محدد')}, دور: {user_info.get('role', 'غير محدد')}"
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
    
    def test_get_lines(self):
        """اختبار GET /api/lines للحصول على قائمة الخطوط المتاحة"""
        print("📍 اختبار GET /api/lines...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/lines", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                lines = response.json()
                if isinstance(lines, list):
                    line_count = len(lines)
                    
                    if line_count > 0:
                        # فحص الحقول المطلوبة في أول خط
                        first_line = lines[0]
                        required_fields = ["id", "name"]
                        optional_fields = ["code", "description", "manager_id", "manager_name", "is_active"]
                        
                        found_required = [field for field in required_fields if field in first_line]
                        found_optional = [field for field in optional_fields if field in first_line]
                        
                        # تفاصيل الخط الأول
                        line_details = {
                            "id": first_line.get("id", "غير محدد"),
                            "name": first_line.get("name", "غير محدد"),
                            "code": first_line.get("code", "غير محدد"),
                            "description": first_line.get("description", "غير محدد"),
                            "manager_name": first_line.get("manager_name", "غير محدد"),
                            "is_active": first_line.get("is_active", "غير محدد")
                        }
                        
                        details = f"عدد الخطوط: {line_count} | الحقول المطلوبة: {found_required} | الحقول الاختيارية: {found_optional} | أول خط: {line_details}"
                        self.log_test("GET /api/lines", True, details, response_time)
                        return lines
                    else:
                        self.log_test("GET /api/lines", True, "لا توجد خطوط متاحة (قاعدة بيانات فارغة)", response_time)
                        return []
                else:
                    self.log_test("GET /api/lines", False, f"الاستجابة ليست قائمة: {type(lines)}", response_time)
            else:
                self.log_test("GET /api/lines", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/lines", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_get_areas(self):
        """اختبار GET /api/areas للحصول على قائمة المناطق المتاحة"""
        print("🗺️ اختبار GET /api/areas...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/areas", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                areas = response.json()
                if isinstance(areas, list):
                    area_count = len(areas)
                    
                    if area_count > 0:
                        # فحص الحقول المطلوبة في أول منطقة
                        first_area = areas[0]
                        required_fields = ["id", "name"]
                        optional_fields = ["code", "description", "parent_line_id", "manager_id", "manager_name", "is_active"]
                        
                        found_required = [field for field in required_fields if field in first_area]
                        found_optional = [field for field in optional_fields if field in first_area]
                        
                        # تفاصيل المنطقة الأولى
                        area_details = {
                            "id": first_area.get("id", "غير محدد"),
                            "name": first_area.get("name", "غير محدد"),
                            "code": first_area.get("code", "غير محدد"),
                            "description": first_area.get("description", "غير محدد"),
                            "parent_line_id": first_area.get("parent_line_id", "غير محدد"),
                            "manager_name": first_area.get("manager_name", "غير محدد"),
                            "is_active": first_area.get("is_active", "غير محدد")
                        }
                        
                        details = f"عدد المناطق: {area_count} | الحقول المطلوبة: {found_required} | الحقول الاختيارية: {found_optional} | أول منطقة: {area_details}"
                        self.log_test("GET /api/areas", True, details, response_time)
                        return areas
                    else:
                        self.log_test("GET /api/areas", True, "لا توجد مناطق متاحة (قاعدة بيانات فارغة)", response_time)
                        return []
                else:
                    self.log_test("GET /api/areas", False, f"الاستجابة ليست قائمة: {type(areas)}", response_time)
            else:
                self.log_test("GET /api/areas", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/areas", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_get_regions(self):
        """اختبار GET /api/regions (إن وجد)"""
        print("🌍 اختبار GET /api/regions...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/regions", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                regions = response.json()
                if isinstance(regions, list):
                    region_count = len(regions)
                    details = f"عدد الأقاليم: {region_count}"
                    self.log_test("GET /api/regions", True, details, response_time)
                    return regions
                else:
                    self.log_test("GET /api/regions", False, f"الاستجابة ليست قائمة: {type(regions)}", response_time)
            elif response.status_code == 404:
                self.log_test("GET /api/regions", True, "API غير موجود (متوقع)", response_time)
            else:
                self.log_test("GET /api/regions", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/regions", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_get_geographic_areas(self):
        """اختبار GET /api/geographic/areas (إن وجد)"""
        print("🗺️ اختبار GET /api/geographic/areas...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/geographic/areas", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                geo_areas = response.json()
                if isinstance(geo_areas, list):
                    area_count = len(geo_areas)
                    details = f"عدد المناطق الجغرافية: {area_count}"
                    self.log_test("GET /api/geographic/areas", True, details, response_time)
                    return geo_areas
                else:
                    self.log_test("GET /api/geographic/areas", False, f"الاستجابة ليست قائمة: {type(geo_areas)}", response_time)
            elif response.status_code == 404:
                self.log_test("GET /api/geographic/areas", True, "API غير موجود (متوقع)", response_time)
            else:
                self.log_test("GET /api/geographic/areas", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/geographic/areas", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_get_geographic_regions(self):
        """اختبار GET /api/geographic/regions (إن وجد)"""
        print("🌍 اختبار GET /api/geographic/regions...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/geographic/regions", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                geo_regions = response.json()
                if isinstance(geo_regions, list):
                    region_count = len(geo_regions)
                    details = f"عدد الأقاليم الجغرافية: {region_count}"
                    self.log_test("GET /api/geographic/regions", True, details, response_time)
                    return geo_regions
                else:
                    self.log_test("GET /api/geographic/regions", False, f"الاستجابة ليست قائمة: {type(geo_regions)}", response_time)
            elif response.status_code == 404:
                self.log_test("GET /api/geographic/regions", True, "API غير موجود (متوقع)", response_time)
            else:
                self.log_test("GET /api/geographic/regions", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/geographic/regions", False, f"خطأ: {str(e)}", response_time)
        
        return []
    
    def test_geographic_statistics(self):
        """اختبار GET /api/geographic/statistics للحصول على إحصائيات شاملة"""
        print("📊 اختبار GET /api/geographic/statistics...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/geographic/statistics", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                if isinstance(stats, dict):
                    # فحص الحقول المتوقعة في الإحصائيات
                    expected_fields = [
                        "total_lines", "active_lines", 
                        "total_areas", "active_areas",
                        "total_districts", "active_districts",
                        "total_assigned_products", "total_coverage_clinics",
                        "average_achievement_percentage"
                    ]
                    
                    found_fields = [field for field in expected_fields if field in stats]
                    
                    stats_summary = {
                        "total_lines": stats.get("total_lines", 0),
                        "active_lines": stats.get("active_lines", 0),
                        "total_areas": stats.get("total_areas", 0),
                        "active_areas": stats.get("active_areas", 0),
                        "total_coverage_clinics": stats.get("total_coverage_clinics", 0)
                    }
                    
                    details = f"الحقول المتاحة: {found_fields} | الإحصائيات: {stats_summary}"
                    self.log_test("GET /api/geographic/statistics", True, details, response_time)
                    return stats
                else:
                    self.log_test("GET /api/geographic/statistics", False, f"الاستجابة ليست كائن: {type(stats)}", response_time)
            elif response.status_code == 404:
                self.log_test("GET /api/geographic/statistics", True, "API غير موجود (متوقع)", response_time)
            else:
                self.log_test("GET /api/geographic/statistics", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/geographic/statistics", False, f"خطأ: {str(e)}", response_time)
        
        return {}
    
    def analyze_data_for_user_management(self, lines, areas):
        """تحليل البيانات لاستخدامها في واجهة إدارة المستخدمين"""
        print("🔍 تحليل البيانات لاستخدامها في واجهة إدارة المستخدمين...")
        
        analysis = {
            "lines_for_dropdown": [],
            "areas_for_dropdown": [],
            "line_area_mapping": {},
            "data_quality": {
                "lines_ready": False,
                "areas_ready": False,
                "mapping_available": False
            }
        }
        
        # تحليل الخطوط
        if lines:
            for line in lines:
                if line.get("id") and line.get("name"):
                    dropdown_item = {
                        "value": line["id"],
                        "label": line["name"],
                        "code": line.get("code", ""),
                        "description": line.get("description", ""),
                        "manager_name": line.get("manager_name", ""),
                        "is_active": line.get("is_active", True)
                    }
                    analysis["lines_for_dropdown"].append(dropdown_item)
            
            analysis["data_quality"]["lines_ready"] = len(analysis["lines_for_dropdown"]) > 0
        
        # تحليل المناطق
        if areas:
            for area in areas:
                if area.get("id") and area.get("name"):
                    dropdown_item = {
                        "value": area["id"],
                        "label": area["name"],
                        "code": area.get("code", ""),
                        "description": area.get("description", ""),
                        "parent_line_id": area.get("parent_line_id", ""),
                        "manager_name": area.get("manager_name", ""),
                        "is_active": area.get("is_active", True)
                    }
                    analysis["areas_for_dropdown"].append(dropdown_item)
                    
                    # ربط المناطق بالخطوط
                    parent_line_id = area.get("parent_line_id")
                    if parent_line_id:
                        if parent_line_id not in analysis["line_area_mapping"]:
                            analysis["line_area_mapping"][parent_line_id] = []
                        analysis["line_area_mapping"][parent_line_id].append(dropdown_item)
            
            analysis["data_quality"]["areas_ready"] = len(analysis["areas_for_dropdown"]) > 0
            analysis["data_quality"]["mapping_available"] = len(analysis["line_area_mapping"]) > 0
        
        # تسجيل النتائج
        lines_count = len(analysis["lines_for_dropdown"])
        areas_count = len(analysis["areas_for_dropdown"])
        mapped_lines = len(analysis["line_area_mapping"])
        
        details = f"خطوط جاهزة: {lines_count} | مناطق جاهزة: {areas_count} | خطوط مربوطة بمناطق: {mapped_lines}"
        
        if analysis["data_quality"]["lines_ready"] and analysis["data_quality"]["areas_ready"]:
            self.log_test("تحليل البيانات للواجهة", True, details, 0)
        else:
            self.log_test("تحليل البيانات للواجهة", False, f"بيانات ناقصة - {details}", 0)
        
        return analysis
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار APIs المناطق والخطوط للتأكد من البيانات المتاحة")
        print("=" * 80)
        print()
        
        # Step 1: Admin login
        if not self.test_admin_login():
            print("❌ فشل تسجيل دخول الأدمن - توقف الاختبار")
            return
        
        # Step 2: Test Lines API
        lines = self.test_get_lines()
        
        # Step 3: Test Areas API
        areas = self.test_get_areas()
        
        # Step 4: Test additional geographic APIs
        self.test_get_regions()
        self.test_get_geographic_areas()
        self.test_get_geographic_regions()
        self.test_geographic_statistics()
        
        # Step 5: Analyze data for user management interface
        analysis = self.analyze_data_for_user_management(lines, areas)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج اختبار APIs المناطق والخطوط")
        print("=" * 80)
        
        success_count = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
        
        print(f"🎯 نسبة النجاح: {success_rate:.1f}% ({success_count}/{total_tests} اختبار نجح)")
        print(f"⏱️ إجمالي وقت الاختبار: {time.time() - self.start_time:.2f} ثانية")
        print()
        
        # تفاصيل البيانات المتاحة
        print("📋 البيانات المتاحة لواجهة إدارة المستخدمين:")
        print(f"   📍 الخطوط المتاحة: {len(analysis['lines_for_dropdown'])}")
        print(f"   🗺️ المناطق المتاحة: {len(analysis['areas_for_dropdown'])}")
        print(f"   🔗 الخطوط المربوطة بمناطق: {len(analysis['line_area_mapping'])}")
        print()
        
        # عرض عينة من البيانات
        if analysis["lines_for_dropdown"]:
            print("📍 عينة من الخطوط المتاحة:")
            for i, line in enumerate(analysis["lines_for_dropdown"][:3]):
                print(f"   {i+1}. {line['label']} (ID: {line['value']}, كود: {line['code']})")
            print()
        
        if analysis["areas_for_dropdown"]:
            print("🗺️ عينة من المناطق المتاحة:")
            for i, area in enumerate(analysis["areas_for_dropdown"][:3]):
                print(f"   {i+1}. {area['label']} (ID: {area['value']}, خط: {area['parent_line_id']})")
            print()
        
        print("📋 تفاصيل النتائج:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']} ({result['response_time']})")
            if result['details']:
                print(f"      {result['details']}")
        print()
        
        # Final assessment
        print("🏁 التقييم النهائي:")
        if success_rate >= 80 and analysis["data_quality"]["lines_ready"] and analysis["data_quality"]["areas_ready"]:
            print("🎉 ممتاز! APIs المناطق والخطوط تعمل بشكل صحيح والبيانات جاهزة للاستخدام في واجهة إدارة المستخدمين")
        elif success_rate >= 60:
            print("✅ جيد! معظم APIs تعمل مع بعض المشاكل البسيطة")
        else:
            print("❌ يحتاج إصلاحات في APIs المناطق والخطوط")
        
        print()
        print("🎯 التوصية:")
        if analysis["data_quality"]["lines_ready"]:
            print("✅ يمكن إضافة حقل 'الخط' في واجهة تسجيل المستخدمين الجديدة")
        else:
            print("❌ يحتاج إضافة بيانات خطوط قبل استخدامها في الواجهة")
        
        if analysis["data_quality"]["areas_ready"]:
            print("✅ يمكن إضافة حقل 'المنطقة' في واجهة تسجيل المستخدمين")
        else:
            print("❌ يحتاج إضافة بيانات مناطق قبل استخدامها في الواجهة")
        
        return success_rate >= 60

if __name__ == "__main__":
    tester = AreasLinesAPITester()
    tester.run_comprehensive_test()