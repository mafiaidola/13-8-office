#!/usr/bin/env python3
"""
اختبار شامل لمشكلة تسجيل العيادات - Clinic Registration Issue Investigation
Comprehensive testing for clinic registration issues reported by user

المشكلة المبلغ عنها:
- المستخدم سجل عيادة وظهرت رسالة "تم التسجيل بنجاح"
- لكن عند البحث عن العيادة في قسم الزيارات لا تظهر
- في حساب الأدمن لا توجد أي عيادات مسجلة

Test Plan:
1. Test clinic registration API (POST /api/clinics)
2. Test clinic retrieval APIs (GET /api/clinics)
3. Test full scenario: register → verify visibility
4. Test admin vs medical rep access
5. Check database persistence
6. Test integration with visits system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://88e771ef-8689-4c57-adf3-f00b0f131fdc.preview.emergentagent.com/api"

class ClinicRegistrationTester:
    def __init__(self):
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.registered_clinic_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} - {test_name}: {message}")
        if details:
            print(f"   التفاصيل: {details}")
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            }, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_result(
                    "Admin Login Test",
                    True,
                    f"تسجيل دخول الأدمن نجح - المستخدم: {user_info.get('full_name', 'admin')}",
                    {
                        "user_id": user_info.get("id"),
                        "role": user_info.get("role"),
                        "token_received": bool(self.admin_token)
                    }
                )
                return True
            else:
                self.log_result(
                    "Admin Login Test",
                    False,
                    f"فشل تسجيل دخول الأدمن - كود الخطأ: {response.status_code}",
                    {"response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Login Test",
                False,
                f"خطأ في تسجيل دخول الأدمن: {str(e)}"
            )
            return False
    
    def test_medical_rep_login(self):
        """اختبار تسجيل دخول مندوب طبي"""
        try:
            # First, try to find an existing medical rep
            if self.admin_token:
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                users_response = requests.get(f"{BACKEND_URL}/users", headers=headers, timeout=30)
                
                if users_response.status_code == 200:
                    users = users_response.json()
                    medical_reps = [u for u in users if u.get("role") == "medical_rep"]
                    
                    if medical_reps:
                        # Try to login with first medical rep (assuming password is username)
                        rep = medical_reps[0]
                        login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                            "username": rep["username"],
                            "password": rep["username"]  # Common pattern in test systems
                        }, timeout=30)
                        
                        if login_response.status_code == 200:
                            data = login_response.json()
                            self.medical_rep_token = data.get("access_token")
                            
                            self.log_result(
                                "Medical Rep Login Test",
                                True,
                                f"تسجيل دخول المندوب الطبي نجح - {rep.get('full_name', rep['username'])}",
                                {
                                    "username": rep["username"],
                                    "user_id": rep.get("id"),
                                    "token_received": bool(self.medical_rep_token)
                                }
                            )
                            return True
            
            # If no existing medical rep found, create a test one
            if self.admin_token:
                headers = {"Authorization": f"Bearer {self.admin_token}"}
                test_rep_data = {
                    "username": "test_clinic_rep",
                    "password": "test123",
                    "full_name": "مندوب اختبار العيادات",
                    "role": "medical_rep",
                    "email": "test_clinic_rep@example.com",
                    "phone": "01234567890",
                    "is_active": True
                }
                
                create_response = requests.post(f"{BACKEND_URL}/users", 
                                              json=test_rep_data, 
                                              headers=headers, 
                                              timeout=30)
                
                if create_response.status_code == 200:
                    # Now try to login
                    login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                        "username": "test_clinic_rep",
                        "password": "test123"
                    }, timeout=30)
                    
                    if login_response.status_code == 200:
                        data = login_response.json()
                        self.medical_rep_token = data.get("access_token")
                        
                        self.log_result(
                            "Medical Rep Login Test",
                            True,
                            "تم إنشاء وتسجيل دخول مندوب طبي تجريبي بنجاح",
                            {
                                "username": "test_clinic_rep",
                                "created_and_logged_in": True,
                                "token_received": bool(self.medical_rep_token)
                            }
                        )
                        return True
            
            self.log_result(
                "Medical Rep Login Test",
                False,
                "فشل في العثور على أو إنشاء مندوب طبي للاختبار"
            )
            return False
            
        except Exception as e:
            self.log_result(
                "Medical Rep Login Test",
                False,
                f"خطأ في تسجيل دخول المندوب الطبي: {str(e)}"
            )
            return False
    
    def test_clinic_registration_api(self):
        """اختبار API تسجيل العيادات"""
        if not self.medical_rep_token:
            self.log_result(
                "Clinic Registration API Test",
                False,
                "لا يوجد token للمندوب الطبي - تخطي الاختبار"
            )
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            
            # Test clinic data - using all required fields based on previous tests
            clinic_data = {
                "clinic_name": "عيادة اختبار تسجيل العيادات",
                "doctor_name": "د. أحمد محمد الاختبار",
                "phone": "01234567890",
                "address": "شارع الاختبار، القاهرة، مصر",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "specialization": "طب عام",
                "area_id": "test_area_001",
                "area_name": "منطقة الاختبار"
            }
            
            response = requests.post(f"{BACKEND_URL}/clinics", 
                                   json=clinic_data, 
                                   headers=headers, 
                                   timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                success_message = data.get("message", "")
                
                # Extract clinic ID from nested response structure
                clinic_info = data.get("clinic", {})
                self.registered_clinic_id = (
                    data.get("clinic_id") or 
                    data.get("id") or 
                    clinic_info.get("id")
                )
                
                self.log_result(
                    "Clinic Registration API Test",
                    True,
                    f"تسجيل العيادة نجح - الرسالة: {success_message}",
                    {
                        "clinic_id": self.registered_clinic_id,
                        "clinic_name": clinic_data["clinic_name"],
                        "doctor_name": clinic_data["doctor_name"],
                        "response_data": data
                    }
                )
                return True
            else:
                self.log_result(
                    "Clinic Registration API Test",
                    False,
                    f"فشل تسجيل العيادة - كود الخطأ: {response.status_code}",
                    {
                        "response_text": response.text,
                        "sent_data": clinic_data
                    }
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Clinic Registration API Test",
                False,
                f"خطأ في تسجيل العيادة: {str(e)}"
            )
            return False
    
    def test_admin_clinic_retrieval(self):
        """اختبار استرجاع العيادات من حساب الأدمن"""
        if not self.admin_token:
            self.log_result(
                "Admin Clinic Retrieval Test",
                False,
                "لا يوجد token للأدمن - تخطي الاختبار"
            )
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/clinics", headers=headers, timeout=30)
            
            if response.status_code == 200:
                clinics = response.json()
                total_clinics = len(clinics)
                
                # Check if our registered clinic appears
                registered_clinic_found = False
                if self.registered_clinic_id:
                    registered_clinic_found = any(
                        clinic.get("id") == self.registered_clinic_id 
                        for clinic in clinics
                    )
                
                self.log_result(
                    "Admin Clinic Retrieval Test",
                    True,
                    f"الأدمن يمكنه رؤية {total_clinics} عيادة",
                    {
                        "total_clinics": total_clinics,
                        "registered_clinic_found": registered_clinic_found,
                        "registered_clinic_id": self.registered_clinic_id,
                        "clinic_names": [c.get("clinic_name", c.get("name", "بدون اسم")) for c in clinics[:5]]
                    }
                )
                return True
            else:
                self.log_result(
                    "Admin Clinic Retrieval Test",
                    False,
                    f"فشل في استرجاع العيادات للأدمن - كود الخطأ: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Admin Clinic Retrieval Test",
                False,
                f"خطأ في استرجاع العيادات للأدمن: {str(e)}"
            )
            return False
    
    def test_medical_rep_clinic_retrieval(self):
        """اختبار استرجاع العيادات من حساب المندوب الطبي"""
        if not self.medical_rep_token:
            self.log_result(
                "Medical Rep Clinic Retrieval Test",
                False,
                "لا يوجد token للمندوب الطبي - تخطي الاختبار"
            )
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            response = requests.get(f"{BACKEND_URL}/clinics", headers=headers, timeout=30)
            
            if response.status_code == 200:
                clinics = response.json()
                total_clinics = len(clinics)
                
                # Check if our registered clinic appears
                registered_clinic_found = False
                if self.registered_clinic_id:
                    registered_clinic_found = any(
                        clinic.get("id") == self.registered_clinic_id 
                        for clinic in clinics
                    )
                
                self.log_result(
                    "Medical Rep Clinic Retrieval Test",
                    True,
                    f"المندوب الطبي يمكنه رؤية {total_clinics} عيادة",
                    {
                        "total_clinics": total_clinics,
                        "registered_clinic_found": registered_clinic_found,
                        "registered_clinic_id": self.registered_clinic_id,
                        "clinic_names": [c.get("clinic_name", c.get("name", "بدون اسم")) for c in clinics[:5]]
                    }
                )
                return True
            else:
                self.log_result(
                    "Medical Rep Clinic Retrieval Test",
                    False,
                    f"فشل في استرجاع العيادات للمندوب - كود الخطأ: {response.status_code}",
                    {"response_text": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Medical Rep Clinic Retrieval Test",
                False,
                f"خطأ في استرجاع العيادات للمندوب: {str(e)}"
            )
            return False
    
    def test_visits_integration(self):
        """اختبار تكامل العيادات مع نظام الزيارات"""
        if not self.medical_rep_token:
            self.log_result(
                "Visits Integration Test",
                False,
                "لا يوجد token للمندوب الطبي - تخطي الاختبار"
            )
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            
            # Test 1: Get visits to see if clinics appear there
            visits_response = requests.get(f"{BACKEND_URL}/visits", headers=headers, timeout=30)
            
            if visits_response.status_code == 200:
                visits = visits_response.json()
                total_visits = len(visits)
                
                # Test 2: Get doctors to see if they're linked to clinics
                doctors_response = requests.get(f"{BACKEND_URL}/doctors", headers=headers, timeout=30)
                doctors_success = doctors_response.status_code == 200
                total_doctors = len(doctors_response.json()) if doctors_success else 0
                
                self.log_result(
                    "Visits Integration Test",
                    True,
                    f"تكامل الزيارات يعمل - {total_visits} زيارة، {total_doctors} طبيب",
                    {
                        "total_visits": total_visits,
                        "total_doctors": total_doctors,
                        "visits_api_working": True,
                        "doctors_api_working": doctors_success
                    }
                )
                return True
            else:
                self.log_result(
                    "Visits Integration Test",
                    False,
                    f"فشل في الوصول لنظام الزيارات - كود الخطأ: {visits_response.status_code}",
                    {"response_text": visits_response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Visits Integration Test",
                False,
                f"خطأ في اختبار تكامل الزيارات: {str(e)}"
            )
            return False
    
    def test_clinic_search_functionality(self):
        """اختبار وظيفة البحث عن العيادات"""
        if not self.admin_token:
            self.log_result(
                "Clinic Search Test",
                False,
                "لا يوجد token للأدمن - تخطي الاختبار"
            )
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test global search if available
            search_response = requests.get(f"{BACKEND_URL}/search/global?q=عيادة", 
                                         headers=headers, timeout=30)
            
            if search_response.status_code == 200:
                search_results = search_response.json()
                clinics_in_search = search_results.get("clinics", [])
                
                self.log_result(
                    "Clinic Search Test",
                    True,
                    f"البحث العام يعمل - وجد {len(clinics_in_search)} عيادة",
                    {
                        "search_results": search_results,
                        "clinics_found": len(clinics_in_search)
                    }
                )
                return True
            else:
                # Try comprehensive search
                comp_search_response = requests.get(f"{BACKEND_URL}/search/comprehensive?q=عيادة&type=clinic", 
                                                   headers=headers, timeout=30)
                
                if comp_search_response.status_code == 200:
                    comp_results = comp_search_response.json()
                    
                    self.log_result(
                        "Clinic Search Test",
                        True,
                        "البحث الشامل يعمل",
                        {"comprehensive_search_results": comp_results}
                    )
                    return True
                else:
                    self.log_result(
                        "Clinic Search Test",
                        False,
                        "وظائف البحث غير متاحة أو لا تعمل",
                        {
                            "global_search_status": search_response.status_code,
                            "comprehensive_search_status": comp_search_response.status_code
                        }
                    )
                    return False
                
        except Exception as e:
            self.log_result(
                "Clinic Search Test",
                False,
                f"خطأ في اختبار البحث: {str(e)}"
            )
            return False
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🏥 بدء اختبار شامل لمشكلة تسجيل العيادات")
        print("=" * 60)
        
        start_time = time.time()
        
        # Run all tests
        tests = [
            self.test_admin_login,
            self.test_medical_rep_login,
            self.test_clinic_registration_api,
            self.test_admin_clinic_retrieval,
            self.test_medical_rep_clinic_retrieval,
            self.test_visits_integration,
            self.test_clinic_search_functionality
        ]
        
        successful_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            try:
                if test():
                    successful_tests += 1
                time.sleep(1)  # Brief pause between tests
            except Exception as e:
                print(f"خطأ غير متوقع في الاختبار: {str(e)}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Generate summary
        print("\n" + "=" * 60)
        print("📊 ملخص نتائج الاختبار الشامل")
        print("=" * 60)
        
        success_rate = (successful_tests / total_tests) * 100
        print(f"🎯 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبارات نجحت)")
        print(f"⏱️ مدة الاختبار: {duration:.2f} ثانية")
        
        # Detailed analysis
        print("\n🔍 تحليل مفصل للنتائج:")
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
            
            if result.get("details"):
                for key, value in result["details"].items():
                    print(f"   • {key}: {value}")
        
        # Root cause analysis
        print("\n🔬 تحليل الأسباب الجذرية:")
        
        registration_success = any(r["test"] == "Clinic Registration API Test" and r["success"] for r in self.test_results)
        admin_retrieval_success = any(r["test"] == "Admin Clinic Retrieval Test" and r["success"] for r in self.test_results)
        rep_retrieval_success = any(r["test"] == "Medical Rep Clinic Retrieval Test" and r["success"] for r in self.test_results)
        
        if registration_success and admin_retrieval_success:
            if self.registered_clinic_id:
                admin_result = next((r for r in self.test_results if r["test"] == "Admin Clinic Retrieval Test"), {})
                if admin_result.get("details", {}).get("registered_clinic_found"):
                    print("✅ العيادة المسجلة تظهر في حساب الأدمن - النظام يعمل بشكل صحيح")
                else:
                    print("⚠️ العيادة مسجلة لكن لا تظهر في قائمة الأدمن - مشكلة في الفلترة أو الصلاحيات")
            else:
                print("⚠️ تسجيل العيادة نجح لكن لم يتم إرجاع ID - مشكلة في استجابة API")
        elif registration_success and not admin_retrieval_success:
            print("❌ تسجيل العيادة نجح لكن الأدمن لا يمكنه رؤية العيادات - مشكلة في API الاسترجاع")
        elif not registration_success:
            print("❌ مشكلة في تسجيل العيادة نفسه - فحص الحقول المطلوبة والصلاحيات")
        
        # Recommendations
        print("\n💡 التوصيات:")
        
        if not registration_success:
            print("1. فحص الحقول المطلوبة في API تسجيل العيادات")
            print("2. التأكد من صلاحيات المندوب الطبي")
            print("3. فحص validation rules في الباكند")
        
        if registration_success and not admin_retrieval_success:
            print("1. فحص API استرجاع العيادات للأدمن")
            print("2. التأكد من عدم وجود فلترة خاطئة")
            print("3. فحص قاعدة البيانات مباشرة")
        
        if registration_success and admin_retrieval_success and self.registered_clinic_id:
            admin_result = next((r for r in self.test_results if r["test"] == "Admin Clinic Retrieval Test"), {})
            if not admin_result.get("details", {}).get("registered_clinic_found"):
                print("1. فحص منطق ربط العيادات بالمستخدمين")
                print("2. التأكد من حفظ created_by أو assigned_rep_id")
                print("3. فحص فلترة العيادات حسب المستخدم")
        
        print("\n🎯 الخلاصة النهائية:")
        if success_rate >= 80:
            print("النظام يعمل بشكل جيد عموماً. المشكلة قد تكون في التفاصيل الدقيقة.")
        elif success_rate >= 60:
            print("هناك مشاكل متوسطة تحتاج إلى إصلاح.")
        else:
            print("هناك مشاكل جوهرية في نظام تسجيل العيادات تحتاج إلى إصلاح فوري.")
        
        return {
            "success_rate": success_rate,
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "duration": duration,
            "results": self.test_results
        }

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = ClinicRegistrationTester()
    results = tester.run_comprehensive_test()
    
    # Return results for potential integration with other systems
    return results

if __name__ == "__main__":
    main()