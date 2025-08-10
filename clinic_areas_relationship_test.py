#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل لمشكلة المناطق في تسجيل العيادات - Arabic Review
Comprehensive Testing for Clinic Registration Areas Issue

المطلوب اختبار:
1) تسجيل دخول admin/admin123 للحصول على JWT token
2) اختبار APIs النظام الأساسية: GET /api/lines, GET /api/areas
3) فحص هيكل البيانات بالتفصيل وطباعة عينات
4) اختبار Enhanced Clinic Registration API
5) تحليل المشكلة وتحديد سبب عدم ظهور المناطق المترابطة
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class ClinicAreasRelationshipTester:
    def __init__(self):
        self.base_url = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com/api"
        self.token = None
        self.session = requests.Session()
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}")
        if response_time > 0:
            print(f"   ⏱️  Response time: {response_time*1000:.2f}ms")
        print(f"   📝 {details}")
        print()

    def login_admin(self) -> bool:
        """1) تسجيل دخول admin/admin123 للحصول على JWT token"""
        print("🔐 1) تسجيل دخول admin/admin123...")
        
        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=30
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                if self.token:
                    self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                    user_info = data.get("user", {})
                    details = f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'admin')}, الدور: {user_info.get('role', 'admin')}"
                    self.log_test("Admin Login", True, details, response_time)
                    return True
                else:
                    self.log_test("Admin Login", False, "لم يتم الحصول على JWT token", response_time)
                    return False
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_lines_api(self) -> Dict[str, Any]:
        """2) اختبار GET /api/lines - جلب قائمة الخطوط مع فحص هيكل البيانات"""
        print("📊 2) اختبار GET /api/lines...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/lines", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                lines_data = response.json()
                lines_count = len(lines_data) if isinstance(lines_data, list) else 0
                
                # طباعة عينة من بيانات الخطوط
                print("🔍 عينة من بيانات الخطوط:")
                if lines_count > 0:
                    sample_line = lines_data[0] if isinstance(lines_data, list) else lines_data
                    print(f"   📋 عدد الخطوط: {lines_count}")
                    print(f"   🏷️  عينة من الحقول المتاحة:")
                    for key, value in sample_line.items():
                        print(f"      - {key}: {value}")
                    print()
                
                details = f"تم جلب {lines_count} خط بنجاح. الحقول المتاحة: {list(sample_line.keys()) if lines_count > 0 else 'لا توجد خطوط'}"
                self.log_test("GET /api/lines", True, details, response_time)
                return {"success": True, "data": lines_data, "count": lines_count}
            else:
                self.log_test("GET /api/lines", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return {"success": False, "data": None, "count": 0}
                
        except Exception as e:
            self.log_test("GET /api/lines", False, f"خطأ في الاتصال: {str(e)}")
            return {"success": False, "data": None, "count": 0}

    def test_areas_api(self) -> Dict[str, Any]:
        """3) اختبار GET /api/areas - جلب قائمة المناطق مع فحص هيكل البيانات"""
        print("🗺️ 3) اختبار GET /api/areas...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/areas", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                areas_data = response.json()
                areas_count = len(areas_data) if isinstance(areas_data, list) else 0
                
                # طباعة عينة من بيانات المناطق
                print("🔍 عينة من بيانات المناطق:")
                if areas_count > 0:
                    sample_area = areas_data[0] if isinstance(areas_data, list) else areas_data
                    print(f"   📋 عدد المناطق: {areas_count}")
                    print(f"   🏷️  عينة من الحقول المتاحة:")
                    for key, value in sample_area.items():
                        print(f"      - {key}: {value}")
                    print()
                
                details = f"تم جلب {areas_count} منطقة بنجاح. الحقول المتاحة: {list(sample_area.keys()) if areas_count > 0 else 'لا توجد مناطق'}"
                self.log_test("GET /api/areas", True, details, response_time)
                return {"success": True, "data": areas_data, "count": areas_count}
            else:
                self.log_test("GET /api/areas", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return {"success": False, "data": None, "count": 0}
                
        except Exception as e:
            self.log_test("GET /api/areas", False, f"خطأ في الاتصال: {str(e)}")
            return {"success": False, "data": None, "count": 0}

    def analyze_relationship(self, lines_result: Dict, areas_result: Dict):
        """4) تحليل العلاقة بين الخطوط والمناطق"""
        print("🔗 4) تحليل العلاقة بين الخطوط والمناطق...")
        
        if not lines_result["success"] or not areas_result["success"]:
            self.log_test("Relationship Analysis", False, "لا يمكن تحليل العلاقة بسبب فشل في جلب البيانات")
            return
        
        lines_data = lines_result["data"]
        areas_data = areas_result["data"]
        
        # البحث عن حقول الربط المحتملة
        linking_fields_found = []
        
        print("🔍 البحث عن حقول الربط:")
        
        # فحص الحقول في المناطق التي قد تربط بالخطوط
        if areas_data and len(areas_data) > 0:
            sample_area = areas_data[0]
            potential_linking_fields = [
                "parent_line_id", "line_id", "line", "parent_line", 
                "line_code", "parent_line_code", "belongs_to_line"
            ]
            
            for field in potential_linking_fields:
                if field in sample_area:
                    linking_fields_found.append(field)
                    print(f"   ✅ وُجد حقل ربط محتمل: {field} = {sample_area[field]}")
        
        # فحص الحقول في الخطوط التي قد تربط بالمناطق
        if lines_data and len(lines_data) > 0:
            sample_line = lines_data[0]
            potential_area_fields = [
                "areas", "related_areas", "area_ids", "assigned_areas"
            ]
            
            for field in potential_area_fields:
                if field in sample_line:
                    linking_fields_found.append(f"line.{field}")
                    print(f"   ✅ وُجد حقل مناطق في الخط: {field} = {sample_line[field]}")
        
        # تحليل البيانات الفعلية للعثور على الروابط
        actual_links = []
        if lines_data and areas_data:
            for line in lines_data:
                line_id = line.get("id")
                line_code = line.get("code")
                line_name = line.get("name")
                
                related_areas = []
                for area in areas_data:
                    # فحص جميع الحقول المحتملة للربط
                    if (area.get("parent_line_id") == line_id or 
                        area.get("line_id") == line_id or
                        area.get("line") == line_code or
                        area.get("parent_line") == line_code):
                        related_areas.append(area.get("name", area.get("id")))
                
                if related_areas:
                    actual_links.append({
                        "line": line_name or line_id,
                        "areas": related_areas
                    })
                    print(f"   🔗 الخط '{line_name}' مرتبط بـ {len(related_areas)} منطقة: {', '.join(related_areas)}")
        
        if not actual_links:
            print("   ⚠️  لم يتم العثور على روابط فعلية بين الخطوط والمناطق")
        
        details = f"تم العثور على {len(linking_fields_found)} حقل ربط محتمل، {len(actual_links)} رابط فعلي"
        self.log_test("Relationship Analysis", len(actual_links) > 0, details)
        
        return {
            "linking_fields": linking_fields_found,
            "actual_links": actual_links
        }

    def test_enhanced_clinic_registration_api(self) -> Dict[str, Any]:
        """5) اختبار Enhanced Clinic Registration API"""
        print("🏥 5) اختبار Enhanced Clinic Registration API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/enhanced-clinics/registration/form-data", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                form_data = response.json()
                
                # تحليل البيانات المرجعة
                lines_in_form = form_data.get("lines", [])
                areas_in_form = form_data.get("areas", [])
                
                print("🔍 بيانات النموذج المحسن:")
                print(f"   📊 الخطوط في النموذج: {len(lines_in_form)}")
                print(f"   🗺️  المناطق في النموذج: {len(areas_in_form)}")
                
                if lines_in_form:
                    print(f"   📋 عينة من خط في النموذج:")
                    sample_form_line = lines_in_form[0]
                    for key, value in sample_form_line.items():
                        print(f"      - {key}: {value}")
                
                if areas_in_form:
                    print(f"   📋 عينة من منطقة في النموذج:")
                    sample_form_area = areas_in_form[0]
                    for key, value in sample_form_area.items():
                        print(f"      - {key}: {value}")
                
                details = f"تم جلب بيانات النموذج بنجاح - {len(lines_in_form)} خط، {len(areas_in_form)} منطقة"
                self.log_test("Enhanced Clinic Registration API", True, details, response_time)
                return {"success": True, "data": form_data}
            else:
                self.log_test("Enhanced Clinic Registration API", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return {"success": False, "data": None}
                
        except Exception as e:
            self.log_test("Enhanced Clinic Registration API", False, f"خطأ في الاتصال: {str(e)}")
            return {"success": False, "data": None}

    def compare_apis_data(self, lines_result: Dict, areas_result: Dict, form_result: Dict):
        """6) مقارنة البيانات بين APIs النظام الأساسية و Enhanced API"""
        print("⚖️ 6) مقارنة البيانات بين APIs...")
        
        if not all([lines_result["success"], areas_result["success"], form_result["success"]]):
            self.log_test("API Data Comparison", False, "لا يمكن المقارنة بسبب فشل في بعض APIs")
            return
        
        basic_lines_count = lines_result["count"]
        basic_areas_count = areas_result["count"]
        
        form_data = form_result["data"]
        form_lines_count = len(form_data.get("lines", []))
        form_areas_count = len(form_data.get("areas", []))
        
        print(f"📊 مقارنة الأعداد:")
        print(f"   الخطوط: API أساسي ({basic_lines_count}) vs نموذج محسن ({form_lines_count})")
        print(f"   المناطق: API أساسي ({basic_areas_count}) vs نموذج محسن ({form_areas_count})")
        
        # فحص التطابق في البيانات
        data_consistency = True
        issues_found = []
        
        if basic_lines_count != form_lines_count:
            issues_found.append(f"عدم تطابق في عدد الخطوط: {basic_lines_count} vs {form_lines_count}")
            data_consistency = False
        
        if basic_areas_count != form_areas_count:
            issues_found.append(f"عدم تطابق في عدد المناطق: {basic_areas_count} vs {form_areas_count}")
            data_consistency = False
        
        if data_consistency:
            details = "البيانات متطابقة بين APIs النظام الأساسية والنموذج المحسن"
        else:
            details = f"مشاكل في التطابق: {'; '.join(issues_found)}"
        
        self.log_test("API Data Comparison", data_consistency, details)
        return {"consistent": data_consistency, "issues": issues_found}

    def provide_solution_analysis(self, relationship_analysis: Dict, comparison_result: Dict):
        """7) تحليل المشكلة واقتراح الحل"""
        print("💡 7) تحليل المشكلة واقتراح الحل...")
        
        problems_identified = []
        solutions_suggested = []
        
        # تحليل مشاكل الربط
        if not relationship_analysis.get("actual_links"):
            problems_identified.append("لا توجد روابط فعلية بين الخطوط والمناطق")
            solutions_suggested.append("إضافة حقول ربط صحيحة مثل parent_line_id أو line_id في جدول المناطق")
        
        # تحليل مشاكل التطابق
        if comparison_result and not comparison_result.get("consistent"):
            problems_identified.append("عدم تطابق البيانات بين APIs مختلفة")
            solutions_suggested.append("توحيد مصدر البيانات لجميع APIs")
        
        # تحليل حقول الربط المفقودة
        linking_fields = relationship_analysis.get("linking_fields", [])
        if not linking_fields:
            problems_identified.append("لا توجد حقول ربط واضحة بين الخطوط والمناطق")
            solutions_suggested.append("إضافة حقل parent_line_id في جدول areas وربطه بـ id في جدول lines")
        
        print("🔍 المشاكل المحددة:")
        for i, problem in enumerate(problems_identified, 1):
            print(f"   {i}. {problem}")
        
        print("💡 الحلول المقترحة:")
        for i, solution in enumerate(solutions_suggested, 1):
            print(f"   {i}. {solution}")
        
        if not problems_identified:
            problems_identified.append("لم يتم تحديد مشاكل واضحة - قد تكون المشكلة في الواجهة الأمامية")
            solutions_suggested.append("فحص كود الواجهة الأمامية لتسجيل العيادات")
        
        details = f"تم تحديد {len(problems_identified)} مشكلة و {len(solutions_suggested)} حل مقترح"
        self.log_test("Solution Analysis", True, details)
        
        return {
            "problems": problems_identified,
            "solutions": solutions_suggested
        }

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل لمشكلة المناطق في تسجيل العيادات")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل في تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2. اختبار APIs الأساسية
        lines_result = self.test_lines_api()
        areas_result = self.test_areas_api()
        
        # 3. تحليل العلاقة
        relationship_analysis = self.analyze_relationship(lines_result, areas_result)
        
        # 4. اختبار Enhanced API
        form_result = self.test_enhanced_clinic_registration_api()
        
        # 5. مقارنة البيانات
        comparison_result = self.compare_apis_data(lines_result, areas_result, form_result)
        
        # 6. تحليل الحل
        solution_analysis = self.provide_solution_analysis(relationship_analysis, comparison_result)
        
        # 7. تقرير نهائي
        self.generate_final_report(solution_analysis)

    def generate_final_report(self, solution_analysis: Dict):
        """إنشاء التقرير النهائي"""
        print("\n" + "=" * 80)
        print("📋 التقرير النهائي - اختبار مشكلة المناطق في تسجيل العيادات")
        print("=" * 80)
        
        # إحصائيات الاختبار
        total_tests = len(self.test_results)
        successful_tests = sum(1 for test in self.test_results if test["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(test["response_time_ms"] for test in self.test_results if test["response_time_ms"] > 0) / max(1, len([t for t in self.test_results if t["response_time_ms"] > 0]))
        
        print(f"📊 إحصائيات الاختبار:")
        print(f"   ✅ معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"   ⏱️  متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n🔍 المشاكل المحددة:")
        for i, problem in enumerate(solution_analysis.get("problems", []), 1):
            print(f"   {i}. {problem}")
        
        print(f"\n💡 الحلول المقترحة:")
        for i, solution in enumerate(solution_analysis.get("solutions", []), 1):
            print(f"   {i}. {solution}")
        
        print(f"\n🎯 التوصية النهائية:")
        if success_rate >= 80:
            print("   ✅ النظام يعمل بشكل جيد - المشكلة قد تكون في الواجهة الأمامية أو منطق الربط")
        elif success_rate >= 60:
            print("   ⚠️  النظام يحتاج تحسينات في APIs الربط بين الخطوط والمناطق")
        else:
            print("   ❌ النظام يحتاج إصلاحات جذرية في APIs الخطوط والمناطق")
        
        print("\n" + "=" * 80)
        print("🏁 انتهى الاختبار الشامل")

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = ClinicAreasRelationshipTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()