#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار مُركز لإصلاح مشكلة المناطق في تسجيل العيادات - Enhanced Analysis
Focused Test to Fix Clinic Registration Areas Issue

الهدف: تحديد وإصلاح السبب الدقيق لعدم ظهور المناطق المترابطة بالخطوط
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class EnhancedClinicRegistrationFixer:
    def __init__(self):
        self.base_url = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com/api"
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
        """تسجيل دخول admin/admin123"""
        print("🔐 تسجيل دخول admin/admin123...")
        
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

    def analyze_current_data_structure(self):
        """تحليل هيكل البيانات الحالي بالتفصيل"""
        print("🔍 تحليل هيكل البيانات الحالي...")
        
        try:
            # جلب الخطوط
            start_time = time.time()
            lines_response = self.session.get(f"{self.base_url}/lines", timeout=30)
            lines_time = time.time() - start_time
            
            # جلب المناطق
            start_time = time.time()
            areas_response = self.session.get(f"{self.base_url}/areas", timeout=30)
            areas_time = time.time() - start_time
            
            if lines_response.status_code == 200 and areas_response.status_code == 200:
                lines_data = lines_response.json()
                areas_data = areas_response.json()
                
                print(f"📊 البيانات الحالية:")
                print(f"   الخطوط: {len(lines_data)} خط")
                print(f"   المناطق: {len(areas_data)} منطقة")
                
                # تحليل الروابط الموجودة
                linked_areas = 0
                unlinked_areas = 0
                line_area_mapping = {}
                
                for line in lines_data:
                    line_id = line.get("id")
                    line_name = line.get("name", "Unknown")
                    line_area_mapping[line_id] = {"name": line_name, "areas": []}
                
                for area in areas_data:
                    area_name = area.get("name", "Unknown")
                    parent_line_id = area.get("parent_line_id")
                    
                    if parent_line_id and parent_line_id in line_area_mapping:
                        line_area_mapping[parent_line_id]["areas"].append(area_name)
                        linked_areas += 1
                    else:
                        unlinked_areas += 1
                
                print(f"   المناطق المرتبطة: {linked_areas}")
                print(f"   المناطق غير المرتبطة: {unlinked_areas}")
                
                print(f"\n🔗 خريطة الروابط:")
                for line_id, line_info in line_area_mapping.items():
                    areas_count = len(line_info["areas"])
                    print(f"   الخط '{line_info['name']}': {areas_count} منطقة")
                    for area_name in line_info["areas"]:
                        print(f"     - {area_name}")
                
                details = f"تحليل مكتمل - {linked_areas} منطقة مرتبطة، {unlinked_areas} منطقة غير مرتبطة"
                self.log_test("Data Structure Analysis", True, details, (lines_time + areas_time) / 2)
                
                return {
                    "lines": lines_data,
                    "areas": areas_data,
                    "linked_areas": linked_areas,
                    "unlinked_areas": unlinked_areas,
                    "line_area_mapping": line_area_mapping
                }
            else:
                self.log_test("Data Structure Analysis", False, "فشل في جلب البيانات الأساسية")
                return None
                
        except Exception as e:
            self.log_test("Data Structure Analysis", False, f"خطأ في التحليل: {str(e)}")
            return None

    def test_enhanced_api_detailed(self):
        """اختبار Enhanced API بالتفصيل"""
        print("🏥 اختبار Enhanced Clinic Registration API بالتفصيل...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/enhanced-clinics/registration/form-data", timeout=30)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                form_data = response.json()
                
                print(f"📋 استجابة Enhanced API:")
                print(f"   Success: {form_data.get('success', False)}")
                
                data_section = form_data.get("data", {})
                lines_in_form = data_section.get("lines", [])
                areas_in_form = data_section.get("areas", [])
                classifications = data_section.get("classifications", [])
                credit_classifications = data_section.get("credit_classifications", [])
                
                print(f"   الخطوط في النموذج: {len(lines_in_form)}")
                print(f"   المناطق في النموذج: {len(areas_in_form)}")
                print(f"   تصنيفات العيادات: {len(classifications)}")
                print(f"   التصنيفات الائتمانية: {len(credit_classifications)}")
                
                # تحليل البيانات المرجعة
                if lines_in_form:
                    print(f"\n📊 عينة من خط في النموذج:")
                    sample_line = lines_in_form[0]
                    for key, value in sample_line.items():
                        print(f"     {key}: {value}")
                
                if areas_in_form:
                    print(f"\n🗺️  عينة من منطقة في النموذج:")
                    sample_area = areas_in_form[0]
                    for key, value in sample_area.items():
                        print(f"     {key}: {value}")
                
                # فحص الروابط في النموذج
                linked_in_form = 0
                for area in areas_in_form:
                    if area.get("parent_line_id"):
                        linked_in_form += 1
                
                print(f"\n🔗 الروابط في النموذج:")
                print(f"   المناطق المرتبطة: {linked_in_form}/{len(areas_in_form)}")
                
                details = f"Enhanced API يعمل - {len(lines_in_form)} خط، {len(areas_in_form)} منطقة، {linked_in_form} منطقة مرتبطة"
                self.log_test("Enhanced API Detailed Test", True, details, response_time)
                
                return {
                    "success": True,
                    "lines": lines_in_form,
                    "areas": areas_in_form,
                    "linked_areas": linked_in_form,
                    "classifications": classifications,
                    "credit_classifications": credit_classifications
                }
            else:
                self.log_test("Enhanced API Detailed Test", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return {"success": False}
                
        except Exception as e:
            self.log_test("Enhanced API Detailed Test", False, f"خطأ في الاتصال: {str(e)}")
            return {"success": False}

    def fix_unlinked_areas(self, current_data: Dict, enhanced_result: Dict):
        """إصلاح المناطق غير المرتبطة"""
        print("🔧 إصلاح المناطق غير المرتبطة...")
        
        if not current_data or current_data["unlinked_areas"] == 0:
            self.log_test("Fix Unlinked Areas", True, "جميع المناطق مرتبطة بالفعل - لا حاجة للإصلاح")
            return True
        
        try:
            lines_data = current_data["lines"]
            areas_data = current_data["areas"]
            
            # العثور على المناطق غير المرتبطة
            unlinked_areas = []
            for area in areas_data:
                if not area.get("parent_line_id"):
                    unlinked_areas.append(area)
            
            print(f"🔍 المناطق غير المرتبطة: {len(unlinked_areas)}")
            for area in unlinked_areas:
                print(f"   - {area.get('name', 'Unknown')} (ID: {area.get('id')})")
            
            # ربط المناطق بالخطوط بناءً على الأسماء أو المنطق
            fixes_applied = 0
            
            for area in unlinked_areas:
                area_name = area.get("name", "").lower()
                area_id = area.get("id")
                
                # منطق الربط بناءً على الأسماء
                target_line_id = None
                
                # إذا كان اسم المنطقة يحتوي على "القاهرة" أو "الجيزة" -> الخط الأول
                if any(keyword in area_name for keyword in ["قاهرة", "جيزة", "قليوبية"]):
                    target_line_id = lines_data[0]["id"] if lines_data else None
                # إذا كان اسم المنطقة يحتوي على "إسكندرية" أو "صعيد" -> الخط الثاني
                elif any(keyword in area_name for keyword in ["إسكندرية", "صعيد", "أسيوط", "سوهاج"]):
                    target_line_id = lines_data[1]["id"] if len(lines_data) > 1 else None
                # افتراضي: ربط بالخط الأول
                else:
                    target_line_id = lines_data[0]["id"] if lines_data else None
                
                if target_line_id:
                    # تحديث المنطقة في قاعدة البيانات
                    try:
                        start_time = time.time()
                        update_response = self.session.put(
                            f"{self.base_url}/areas/{area_id}",
                            json={
                                "parent_line_id": target_line_id,
                                "parent_line_name": next((line["name"] for line in lines_data if line["id"] == target_line_id), "Unknown")
                            },
                            timeout=30
                        )
                        response_time = time.time() - start_time
                        
                        if update_response.status_code == 200:
                            fixes_applied += 1
                            print(f"   ✅ تم ربط '{area.get('name')}' بالخط '{next((line['name'] for line in lines_data if line['id'] == target_line_id), 'Unknown')}'")
                        else:
                            print(f"   ❌ فشل في ربط '{area.get('name')}': HTTP {update_response.status_code}")
                    
                    except Exception as e:
                        print(f"   ❌ خطأ في ربط '{area.get('name')}': {str(e)}")
            
            if fixes_applied > 0:
                details = f"تم إصلاح {fixes_applied} منطقة من أصل {len(unlinked_areas)} منطقة غير مرتبطة"
                self.log_test("Fix Unlinked Areas", True, details)
                return True
            else:
                details = f"لم يتم إصلاح أي منطقة - قد تحتاج تدخل يدوي"
                self.log_test("Fix Unlinked Areas", False, details)
                return False
                
        except Exception as e:
            self.log_test("Fix Unlinked Areas", False, f"خطأ في الإصلاح: {str(e)}")
            return False

    def test_after_fix(self):
        """اختبار النظام بعد الإصلاح"""
        print("🧪 اختبار النظام بعد الإصلاح...")
        
        # إعادة تحليل البيانات
        current_data = self.analyze_current_data_structure()
        if not current_data:
            return False
        
        # إعادة اختبار Enhanced API
        enhanced_result = self.test_enhanced_api_detailed()
        if not enhanced_result["success"]:
            return False
        
        # مقارنة النتائج
        basic_linked = current_data["linked_areas"]
        enhanced_linked = enhanced_result["linked_areas"]
        
        print(f"📊 مقارنة النتائج بعد الإصلاح:")
        print(f"   المناطق المرتبطة في APIs الأساسية: {basic_linked}")
        print(f"   المناطق المرتبطة في Enhanced API: {enhanced_linked}")
        
        success = basic_linked > 0 and enhanced_linked > 0 and basic_linked == enhanced_linked
        
        if success:
            details = f"الإصلاح نجح - {basic_linked} منطقة مرتبطة في كلا النظامين"
            self.log_test("Post-Fix Verification", True, details)
        else:
            details = f"الإصلاح لم يكتمل - تباين في النتائج: {basic_linked} vs {enhanced_linked}"
            self.log_test("Post-Fix Verification", False, details)
        
        return success

    def run_comprehensive_fix(self):
        """تشغيل الإصلاح الشامل"""
        print("🚀 بدء الإصلاح الشامل لمشكلة المناطق في تسجيل العيادات")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل في تسجيل الدخول - إيقاف الإصلاح")
            return
        
        # 2. تحليل البيانات الحالية
        current_data = self.analyze_current_data_structure()
        if not current_data:
            print("❌ فشل في تحليل البيانات - إيقاف الإصلاح")
            return
        
        # 3. اختبار Enhanced API قبل الإصلاح
        enhanced_result_before = self.test_enhanced_api_detailed()
        
        # 4. إصلاح المناطق غير المرتبطة
        fix_success = self.fix_unlinked_areas(current_data, enhanced_result_before)
        
        # 5. اختبار النظام بعد الإصلاح
        if fix_success:
            self.test_after_fix()
        
        # 6. تقرير نهائي
        self.generate_final_report()

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        print("\n" + "=" * 80)
        print("📋 التقرير النهائي - إصلاح مشكلة المناطق في تسجيل العيادات")
        print("=" * 80)
        
        # إحصائيات الاختبار
        total_tests = len(self.test_results)
        successful_tests = sum(1 for test in self.test_results if test["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(test["response_time_ms"] for test in self.test_results if test["response_time_ms"] > 0) / max(1, len([t for t in self.test_results if t["response_time_ms"] > 0]))
        
        print(f"📊 إحصائيات الإصلاح:")
        print(f"   ✅ معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"   ⏱️  متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📝 ملخص الاختبارات:")
        for test in self.test_results:
            status = "✅" if test["success"] else "❌"
            print(f"   {status} {test['test']}: {test['details']}")
        
        print(f"\n🎯 التوصية النهائية:")
        if success_rate >= 90:
            print("   ✅ تم إصلاح المشكلة بنجاح - النظام يعمل بشكل مثالي")
        elif success_rate >= 70:
            print("   ⚠️  تم إصلاح معظم المشاكل - قد تحتاج تحسينات إضافية")
        else:
            print("   ❌ الإصلاح لم يكتمل - تحتاج تدخل يدوي أو مراجعة الكود")
        
        print("\n" + "=" * 80)
        print("🏁 انتهى الإصلاح الشامل")

def main():
    """تشغيل الإصلاح الرئيسي"""
    fixer = EnhancedClinicRegistrationFixer()
    fixer.run_comprehensive_fix()

if __name__ == "__main__":
    main()