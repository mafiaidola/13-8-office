#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل لمشكلة تسجيل العيادات المحسن - Enhanced Clinic Registration Testing
Comprehensive testing for enhanced clinic registration issue as requested in Arabic review

المطلوب اختبار:
1) تسجيل دخول admin/admin123 للحصول على JWT token
2) اختبار enhanced clinic registration API endpoints:
   - GET /api/enhanced-clinics/registration/form-data - جلب بيانات النموذج
   - POST /api/enhanced-clinics/register - تسجيل عيادة جديدة
3) التحقق من النتائج والبيانات المطلوبة
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class EnhancedClinicRegistrationTester:
    def __init__(self):
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
    
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
    
    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        })
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({response_time*1000:.2f}ms)")
    
    async def test_admin_login(self) -> bool:
        """اختبار تسجيل دخول admin/admin123"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    self.jwt_token = data.get("access_token")
                    
                    if self.jwt_token:
                        # تحديث headers للطلبات القادمة
                        self.session.headers.update({
                            'Authorization': f'Bearer {self.jwt_token}'
                        })
                        
                        user_info = data.get("user", {})
                        self.log_test_result(
                            "Admin Login", 
                            True, 
                            f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'admin')}, الدور: {user_info.get('role', 'admin')}", 
                            response_time
                        )
                        return True
                    else:
                        self.log_test_result("Admin Login", False, "لم يتم الحصول على JWT token", response_time)
                        return False
                else:
                    error_text = await response.text()
                    self.log_test_result("Admin Login", False, f"HTTP {response.status}: {error_text}", response_time)
                    return False
                    
        except Exception as e:
            self.log_test_result("Admin Login", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    async def test_get_form_data(self) -> Dict[str, Any]:
        """اختبار GET /api/enhanced-clinics/registration/form-data"""
        try:
            start_time = time.time()
            
            async with self.session.get(f"{API_BASE}/enhanced-clinics/registration/form-data") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success") and "data" in data:
                        form_data = data["data"]
                        
                        # التحقق من وجود البيانات المطلوبة
                        lines = form_data.get("lines", [])
                        areas = form_data.get("areas", [])
                        classifications = form_data.get("classifications", [])
                        credit_classifications = form_data.get("credit_classifications", [])
                        
                        # التحقق من التصنيفات المطلوبة
                        expected_classifications = ["class_a_star", "class_a", "class_b", "class_c", "class_d"]
                        found_classifications = [c.get("value") for c in classifications]
                        
                        expected_credit_classifications = ["green", "yellow", "red"]
                        found_credit_classifications = [c.get("value") for c in credit_classifications]
                        
                        details = f"بيانات النموذج: {len(lines)} خط، {len(areas)} منطقة، {len(classifications)} تصنيف، {len(credit_classifications)} تصنيف ائتماني"
                        
                        # التحقق من التصنيفات
                        classifications_ok = all(c in found_classifications for c in expected_classifications)
                        credit_classifications_ok = all(c in found_credit_classifications for c in expected_credit_classifications)
                        
                        if classifications_ok and credit_classifications_ok:
                            details += " - جميع التصنيفات المطلوبة متوفرة"
                            self.log_test_result("Get Form Data", True, details, response_time)
                            return form_data
                        else:
                            missing_class = [c for c in expected_classifications if c not in found_classifications]
                            missing_credit = [c for c in expected_credit_classifications if c not in found_credit_classifications]
                            details += f" - تصنيفات مفقودة: {missing_class + missing_credit}"
                            self.log_test_result("Get Form Data", False, details, response_time)
                            return form_data
                    else:
                        self.log_test_result("Get Form Data", False, "استجابة غير صحيحة من الخادم", response_time)
                        return {}
                else:
                    error_text = await response.text()
                    self.log_test_result("Get Form Data", False, f"HTTP {response.status}: {error_text}", response_time)
                    return {}
                    
        except Exception as e:
            self.log_test_result("Get Form Data", False, f"خطأ في الاتصال: {str(e)}", 0)
            return {}
    
    async def test_register_clinic(self, form_data: Dict[str, Any]) -> bool:
        """اختبار POST /api/enhanced-clinics/register"""
        try:
            start_time = time.time()
            
            # استخدام أول خط ومنطقة متاحة
            lines = form_data.get("lines", [])
            areas = form_data.get("areas", [])
            
            if not lines or not areas:
                self.log_test_result("Register Clinic", False, "لا توجد خطوط أو مناطق متاحة", 0)
                return False
            
            # اختيار أول خط ومنطقة
            selected_line = lines[0]
            # البحث عن منطقة تتبع الخط المحدد
            selected_area = None
            for area in areas:
                if area.get("parent_line_id") == selected_line.get("id"):
                    selected_area = area
                    break
            
            if not selected_area:
                # استخدام أول منطقة متاحة إذا لم نجد منطقة مرتبطة
                selected_area = areas[0]
            
            # بيانات التسجيل المطلوبة
            registration_data = {
                "clinic_name": "عيادة الدكتور أحمد المحسنة",
                "clinic_phone": "01234567890",
                "clinic_email": "dr.ahmed@clinic.com",
                "doctor_name": "د. أحمد محمد",
                "doctor_specialty": "طب عام",
                "doctor_phone": "01234567891",
                "clinic_address": "شارع التحرير، القاهرة",
                "classification": "class_a_star",
                "credit_classification": "green",
                "line_id": selected_line.get("id"),
                "area_id": selected_area.get("id"),
                "district_id": None,
                "clinic_latitude": 30.0444,
                "clinic_longitude": 31.2357,
                "location_accuracy": 10.0,
                "rep_latitude": 30.0444,
                "rep_longitude": 31.2357,
                "rep_location_accuracy": 5.0,
                "device_info": "Test Device - Enhanced Clinic Registration Test",
                "registration_notes": "تسجيل تجريبي للاختبار الشامل لنظام العيادات المحسن",
                "registration_photos": []
            }
            
            async with self.session.post(f"{API_BASE}/enhanced-clinics/register", json=registration_data) as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success"):
                        clinic_id = data.get("clinic_id")
                        registration_number = data.get("registration_number")
                        status = data.get("status")
                        
                        details = f"تسجيل ناجح - معرف العيادة: {clinic_id}, رقم التسجيل: {registration_number}, الحالة: {status}"
                        details += f", الخط: {selected_line.get('name')}, المنطقة: {selected_area.get('name')}"
                        
                        self.log_test_result("Register Clinic", True, details, response_time)
                        return True
                    else:
                        message = data.get("message", "فشل في التسجيل")
                        self.log_test_result("Register Clinic", False, f"فشل التسجيل: {message}", response_time)
                        return False
                else:
                    error_text = await response.text()
                    self.log_test_result("Register Clinic", False, f"HTTP {response.status}: {error_text}", response_time)
                    return False
                    
        except Exception as e:
            self.log_test_result("Register Clinic", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    async def test_verify_clinic_in_list(self) -> bool:
        """التحقق من ظهور العيادة في قائمة العيادات"""
        try:
            start_time = time.time()
            
            # اختبار GET /api/clinics للتحقق من ظهور العيادة
            async with self.session.get(f"{API_BASE}/clinics") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    clinics = await response.json()
                    
                    if isinstance(clinics, list):
                        # البحث عن العيادة المسجلة
                        test_clinic = None
                        for clinic in clinics:
                            if clinic.get("name") == "عيادة الدكتور أحمد المحسنة":
                                test_clinic = clinic
                                break
                        
                        if test_clinic:
                            details = f"العيادة موجودة في القائمة - الاسم: {test_clinic.get('name')}, المالك: {test_clinic.get('owner_name', 'غير محدد')}"
                            self.log_test_result("Verify Clinic in List", True, details, response_time)
                            return True
                        else:
                            details = f"العيادة غير موجودة في قائمة العيادات ({len(clinics)} عيادة إجمالي)"
                            self.log_test_result("Verify Clinic in List", False, details, response_time)
                            return False
                    else:
                        self.log_test_result("Verify Clinic in List", False, "استجابة غير صحيحة من الخادم", response_time)
                        return False
                else:
                    error_text = await response.text()
                    self.log_test_result("Verify Clinic in List", False, f"HTTP {response.status}: {error_text}", response_time)
                    return False
                    
        except Exception as e:
            self.log_test_result("Verify Clinic in List", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    async def test_enhanced_clinic_available_for_user(self) -> bool:
        """اختبار GET /api/enhanced-clinics/available-for-user"""
        try:
            start_time = time.time()
            
            async with self.session.get(f"{API_BASE}/enhanced-clinics/available-for-user") as response:
                response_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    
                    if data.get("success"):
                        clinics = data.get("clinics", [])
                        statistics = data.get("statistics", {})
                        
                        details = f"العيادات المتاحة: {len(clinics)} عيادة"
                        details += f", إجمالي متاح: {statistics.get('total_available', 0)}"
                        details += f", دور المستخدم: {statistics.get('user_role', 'غير محدد')}"
                        
                        self.log_test_result("Enhanced Clinics Available", True, details, response_time)
                        return True
                    else:
                        self.log_test_result("Enhanced Clinics Available", False, "استجابة غير صحيحة", response_time)
                        return False
                else:
                    error_text = await response.text()
                    self.log_test_result("Enhanced Clinics Available", False, f"HTTP {response.status}: {error_text}", response_time)
                    return False
                    
        except Exception as e:
            self.log_test_result("Enhanced Clinics Available", False, f"خطأ في الاتصال: {str(e)}", 0)
            return False
    
    def calculate_success_rate(self) -> float:
        """حساب معدل النجاح"""
        if not self.test_results:
            return 0.0
        
        successful_tests = sum(1 for result in self.test_results if result["success"])
        return (successful_tests / len(self.test_results)) * 100
    
    def get_average_response_time(self) -> float:
        """حساب متوسط وقت الاستجابة"""
        if not self.test_results:
            return 0.0
        
        total_time = sum(result["response_time_ms"] for result in self.test_results)
        return total_time / len(self.test_results)
    
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لمشكلة تسجيل العيادات المحسن")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # 1. تسجيل دخول admin/admin123
            login_success = await self.test_admin_login()
            if not login_success:
                print("❌ فشل في تسجيل الدخول - إيقاف الاختبار")
                return
            
            # 2. اختبار جلب بيانات النموذج
            form_data = await self.test_get_form_data()
            if not form_data:
                print("❌ فشل في جلب بيانات النموذج - إيقاف الاختبار")
                return
            
            # 3. اختبار تسجيل عيادة جديدة
            registration_success = await self.test_register_clinic(form_data)
            
            # 4. التحقق من ظهور العيادة في القائمة
            await self.test_verify_clinic_in_list()
            
            # 5. اختبار العيادات المتاحة للمستخدم
            await self.test_enhanced_clinic_available_for_user()
            
        finally:
            await self.cleanup_session()
        
        # عرض النتائج النهائية
        self.print_final_results()
    
    def print_final_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 80)
        print("📊 **نتائج اختبار تسجيل العيادات المحسن النهائية**")
        print("=" * 80)
        
        success_rate = self.calculate_success_rate()
        avg_response_time = self.get_average_response_time()
        total_time = time.time() - self.start_time
        
        print(f"🎯 **معدل النجاح:** {success_rate:.1f}% ({sum(1 for r in self.test_results if r['success'])}/{len(self.test_results)} اختبار نجح)")
        print(f"⚡ **متوسط وقت الاستجابة:** {avg_response_time:.2f}ms")
        print(f"⏱️ **إجمالي وقت التنفيذ:** {total_time:.2f}s")
        
        print(f"\n📋 **تفاصيل الاختبارات:**")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} **{result['test']}:** {result['details']} ({result['response_time_ms']}ms)")
        
        # تقييم النتائج
        if success_rate >= 90:
            print(f"\n🎉 **تقييم ممتاز!** نظام تسجيل العيادات المحسن يعمل بشكل مثالي!")
        elif success_rate >= 75:
            print(f"\n👍 **تقييم جيد!** نظام تسجيل العيادات المحسن يعمل بشكل جيد مع بعض التحسينات المطلوبة.")
        elif success_rate >= 50:
            print(f"\n⚠️ **تقييم مقبول!** نظام تسجيل العيادات المحسن يحتاج تحسينات.")
        else:
            print(f"\n❌ **تقييم ضعيف!** نظام تسجيل العيادات المحسن يحتاج إصلاحات جذرية.")
        
        # توصيات
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n🔧 **التوصيات للإصلاح:**")
            for failed_test in failed_tests:
                print(f"   • إصلاح {failed_test['test']}: {failed_test['details']}")
        
        print(f"\n✅ **الخلاصة:** {'النظام جاهز للإنتاج!' if success_rate >= 90 else 'النظام يحتاج تحسينات قبل الإنتاج.' if success_rate >= 75 else 'النظام يحتاج إصلاحات جذرية.'}")

async def main():
    """الدالة الرئيسية"""
    tester = EnhancedClinicRegistrationTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())