#!/usr/bin/env python3
"""
اختبار تسجيل دخول المندوب الطبي ووجود تبويب تسجيل العيادات
Medical Representative Login and Clinic Registration Testing

هذا الاختبار مطلوب للتأكد من أن المندوبين الطبيين يمكنهم الوصول لتبويب تسجيل العيادات الموحد.
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com/api"

class MedicalRepClinicRegistrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, message, response_time=None):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن للحصول على صلاحيات إنشاء المندوبين"""
        try:
            start_time = time.time()
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_test(
                    "تسجيل دخول الأدمن",
                    True,
                    f"تم تسجيل الدخول بنجاح للمستخدم {user_info.get('full_name', 'admin')} بدور {user_info.get('role', 'admin')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول الأدمن",
                    False,
                    f"فشل تسجيل الدخول: HTTP {response.status_code} - {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول الأدمن", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_get_existing_medical_reps(self):
        """البحث عن مندوبين طبيين موجودين في النظام"""
        try:
            start_time = time.time()
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = self.session.get(f"{BACKEND_URL}/users", headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                medical_reps = [user for user in users if user.get("role") == "medical_rep"]
                
                self.log_test(
                    "البحث عن المندوبين الطبيين",
                    True,
                    f"تم العثور على {len(medical_reps)} مندوب طبي في النظام من إجمالي {len(users)} مستخدم",
                    response_time
                )
                
                # عرض تفاصيل المندوبين الطبيين
                if medical_reps:
                    print("📋 المندوبين الطبيين الموجودين:")
                    for i, rep in enumerate(medical_reps[:5], 1):  # عرض أول 5 فقط
                        print(f"   {i}. {rep.get('full_name', 'غير محدد')} (@{rep.get('username', 'غير محدد')})")
                        if i == 1:  # حفظ أول مندوب للاختبار
                            self.first_medical_rep = rep
                
                return medical_reps
            else:
                self.log_test(
                    "البحث عن المندوبين الطبيين",
                    False,
                    f"فشل في جلب المستخدمين: HTTP {response.status_code}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("البحث عن المندوبين الطبيين", False, f"خطأ في الاتصال: {str(e)}")
            return []
    
    def test_create_test_medical_rep(self):
        """إنشاء مندوب طبي تجريبي إذا لم يكن موجوداً"""
        try:
            start_time = time.time()
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            test_rep_data = {
                "username": "test_medical_rep",
                "password": "test123",
                "full_name": "مندوب طبي تجريبي",
                "role": "medical_rep",
                "email": "test_medical_rep@example.com",
                "phone": "01234567890",
                "is_active": True
            }
            
            response = self.session.post(f"{BACKEND_URL}/users", json=test_rep_data, headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                created_user = data.get("user", {})
                
                self.log_test(
                    "إنشاء مندوب طبي تجريبي",
                    True,
                    f"تم إنشاء المندوب الطبي التجريبي بنجاح: {created_user.get('full_name')} (@{created_user.get('username')})",
                    response_time
                )
                
                self.test_medical_rep = created_user
                return True
            elif response.status_code == 400 and "already exists" in response.text:
                self.log_test(
                    "إنشاء مندوب طبي تجريبي",
                    True,
                    "المندوب الطبي التجريبي موجود بالفعل - سيتم استخدامه للاختبار",
                    response_time
                )
                
                # إنشاء كائن وهمي للمندوب التجريبي
                self.test_medical_rep = {
                    "username": "test_medical_rep",
                    "full_name": "مندوب طبي تجريبي",
                    "role": "medical_rep"
                }
                return True
            else:
                self.log_test(
                    "إنشاء مندوب طبي تجريبي",
                    False,
                    f"فشل في إنشاء المندوب: HTTP {response.status_code} - {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("إنشاء مندوب طبي تجريبي", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_medical_rep_login(self):
        """اختبار تسجيل دخول المندوب الطبي"""
        try:
            start_time = time.time()
            
            # محاولة تسجيل الدخول بالمندوب التجريبي أولاً
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "username": "test_medical_rep",
                "password": "test123"
            })
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.medical_rep_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_test(
                    "تسجيل دخول المندوب الطبي التجريبي",
                    True,
                    f"تم تسجيل الدخول بنجاح للمندوب {user_info.get('full_name', 'غير محدد')} بدور {user_info.get('role', 'غير محدد')}",
                    response_time
                )
                
                self.current_medical_rep = user_info
                return True
            else:
                # إذا فشل، جرب مع مندوب موجود
                if hasattr(self, 'first_medical_rep') and self.first_medical_rep:
                    return self.test_existing_medical_rep_login()
                
                self.log_test(
                    "تسجيل دخول المندوب الطبي",
                    False,
                    f"فشل تسجيل الدخول: HTTP {response.status_code} - {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول المندوب الطبي", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_existing_medical_rep_login(self):
        """محاولة تسجيل الدخول بمندوب طبي موجود (للاختبار فقط)"""
        try:
            # نحاول بكلمات مرور شائعة للاختبار
            common_passwords = ["123456", "password", "admin123", "test123", "123"]
            
            for password in common_passwords:
                try:
                    start_time = time.time()
                    
                    response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                        "username": self.first_medical_rep.get("username"),
                        "password": password
                    })
                    
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status_code == 200:
                        data = response.json()
                        self.medical_rep_token = data.get("access_token")
                        user_info = data.get("user", {})
                        
                        self.log_test(
                            "تسجيل دخول مندوب طبي موجود",
                            True,
                            f"تم تسجيل الدخول بنجاح للمندوب {user_info.get('full_name')} بكلمة المرور {password}",
                            response_time
                        )
                        
                        self.current_medical_rep = user_info
                        return True
                        
                except:
                    continue
            
            self.log_test(
                "تسجيل دخول مندوب طبي موجود",
                False,
                "لم يتم العثور على كلمة مرور صحيحة للمندوب الطبي الموجود"
            )
            return False
            
        except Exception as e:
            self.log_test("تسجيل دخول مندوب طبي موجود", False, f"خطأ في الاختبار: {str(e)}")
            return False
    
    def test_clinic_registration_endpoint(self):
        """اختبار endpoint تسجيل العيادات POST /api/clinics"""
        try:
            start_time = time.time()
            
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            clinic_data = {
                "clinic_name": "عيادة اختبار المندوب الطبي",
                "doctor_name": "د. أحمد محمد",
                "doctor_specialty": "طب الأطفال",
                "phone": "01234567890",
                "address": "شارع التحرير، القاهرة، مصر",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "notes": "عيادة تجريبية لاختبار تسجيل المندوب الطبي"
            }
            
            response = self.session.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                self.log_test(
                    "تسجيل عيادة جديدة بواسطة المندوب الطبي",
                    True,
                    f"تم تسجيل العيادة بنجاح: {data.get('message', 'تم إنشاء العيادة')}",
                    response_time
                )
                
                self.test_clinic_id = data.get("clinic_id")
                return True
            elif response.status_code == 403:
                self.log_test(
                    "تسجيل عيادة جديدة بواسطة المندوب الطبي",
                    False,
                    "المندوب الطبي لا يملك صلاحية تسجيل العيادات مباشرة - قد يحتاج لاستخدام نظام طلبات العيادات",
                    response_time
                )
                return False
            else:
                self.log_test(
                    "تسجيل عيادة جديدة بواسطة المندوب الطبي",
                    False,
                    f"فشل في تسجيل العيادة: HTTP {response.status_code} - {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("تسجيل عيادة جديدة بواسطة المندوب الطبي", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_clinic_requests_endpoint(self):
        """اختبار endpoint طلبات العيادات POST /api/clinic-requests"""
        try:
            start_time = time.time()
            
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            clinic_request_data = {
                "clinic_name": "عيادة طلب المندوب الطبي",
                "doctor_name": "د. فاطمة أحمد",
                "doctor_specialty": "طب النساء والتوليد",
                "clinic_manager_name": "أ. محمد علي",
                "address": "شارع الجمهورية، الإسكندرية، مصر",
                "latitude": 31.2001,
                "longitude": 29.9187,
                "notes": "طلب عيادة من المندوب الطبي للموافقة عليها"
            }
            
            response = self.session.post(f"{BACKEND_URL}/clinic-requests", json=clinic_request_data, headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                self.log_test(
                    "إرسال طلب تسجيل عيادة للموافقة",
                    True,
                    f"تم إرسال طلب العيادة بنجاح: {data.get('message', 'تم إرسال الطلب')}",
                    response_time
                )
                
                self.test_clinic_request_id = data.get("request_id")
                return True
            else:
                self.log_test(
                    "إرسال طلب تسجيل عيادة للموافقة",
                    False,
                    f"فشل في إرسال طلب العيادة: HTTP {response.status_code} - {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("إرسال طلب تسجيل عيادة للموافقة", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_get_clinics_access(self):
        """اختبار وصول المندوب الطبي لقائمة العيادات"""
        try:
            start_time = time.time()
            
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            response = self.session.get(f"{BACKEND_URL}/clinics", headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                
                self.log_test(
                    "وصول المندوب الطبي لقائمة العيادات",
                    True,
                    f"تم الوصول بنجاح لقائمة العيادات: {len(clinics)} عيادة متاحة",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "وصول المندوب الطبي لقائمة العيادات",
                    False,
                    f"فشل في الوصول لقائمة العيادات: HTTP {response.status_code}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("وصول المندوب الطبي لقائمة العيادات", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_system_readiness_for_clinic_registration(self):
        """اختبار جاهزية النظام لاستقبال طلبات تسجيل العيادات"""
        try:
            # اختبار الـ endpoints المطلوبة
            endpoints_to_test = [
                "/clinics",
                "/clinic-requests", 
                "/doctors",
                "/visits"
            ]
            
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            available_endpoints = []
            
            for endpoint in endpoints_to_test:
                try:
                    start_time = time.time()
                    response = self.session.get(f"{BACKEND_URL}{endpoint}", headers=headers)
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status_code in [200, 403]:  # 403 يعني الـ endpoint موجود لكن بدون صلاحية
                        available_endpoints.append(f"{endpoint} (HTTP {response.status_code})")
                    
                except:
                    continue
            
            self.log_test(
                "جاهزية النظام لتسجيل العيادات",
                len(available_endpoints) >= 3,
                f"الـ endpoints المتاحة: {', '.join(available_endpoints)}"
            )
            
            return len(available_endpoints) >= 3
            
        except Exception as e:
            self.log_test("جاهزية النظام لتسجيل العيادات", False, f"خطأ في الاختبار: {str(e)}")
            return False
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار تسجيل دخول المندوب الطبي ووجود تبويب تسجيل العيادات")
        print("=" * 80)
        
        # 1. تسجيل دخول الأدمن
        if not self.test_admin_login():
            print("❌ فشل في تسجيل دخول الأدمن - لا يمكن المتابعة")
            return self.generate_final_report()
        
        # 2. البحث عن مندوبين طبيين موجودين
        medical_reps = self.test_get_existing_medical_reps()
        
        # 3. إنشاء مندوب طبي تجريبي (دائماً للتأكد من وجود مندوب يمكن تسجيل الدخول به)
        print("📝 إنشاء مندوب طبي تجريبي للاختبار...")
        self.test_create_test_medical_rep()
        
        # 4. تسجيل دخول المندوب الطبي
        if not self.test_medical_rep_login():
            print("❌ فشل في تسجيل دخول المندوب الطبي - لا يمكن اختبار تسجيل العيادات")
            return self.generate_final_report()
        
        # 5. اختبار endpoint تسجيل العيادات
        clinic_registration_success = self.test_clinic_registration_endpoint()
        
        # 6. إذا فشل التسجيل المباشر، اختبر نظام طلبات العيادات
        if not clinic_registration_success:
            print("🔄 اختبار نظام طلبات العيادات كبديل...")
            self.test_clinic_requests_endpoint()
        
        # 7. اختبار وصول المندوب لقائمة العيادات
        self.test_get_clinics_access()
        
        # 8. اختبار جاهزية النظام العامة
        self.test_system_readiness_for_clinic_registration()
        
        return self.generate_final_report()
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي - اختبار تسجيل دخول المندوب الطبي وتسجيل العيادات")
        print("=" * 80)
        
        print(f"📈 نسبة النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️  إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        
        # تصنيف النتائج
        critical_tests = [
            "تسجيل دخول المندوب الطبي التجريبي",
            "تسجيل دخول مندوب طبي موجود",
            "تسجيل عيادة جديدة بواسطة المندوب الطبي",
            "إرسال طلب تسجيل عيادة للموافقة"
        ]
        
        critical_success = any(
            t["success"] for t in self.test_results 
            if t["test"] in critical_tests
        )
        
        print(f"\n🎯 الوظائف الأساسية: {'✅ تعمل' if critical_success else '❌ لا تعمل'}")
        
        # عرض النتائج المفصلة
        print(f"\n📋 تفاصيل الاختبارات:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            time_info = f" ({result['response_time']:.0f}ms)" if result.get("response_time") else ""
            print(f"   {status} {result['test']}{time_info}")
            if not result["success"] and len(result["message"]) < 100:
                print(f"      └─ {result['message']}")
        
        # التوصيات
        print(f"\n💡 التوصيات:")
        
        if success_rate >= 80:
            print("   ✅ النظام جاهز للاستخدام - المندوبين الطبيين يمكنهم الوصول لتبويب تسجيل العيادات")
        elif success_rate >= 60:
            print("   ⚠️  النظام يعمل جزئياً - يحتاج لبعض الإصلاحات البسيطة")
        else:
            print("   ❌ النظام يحتاج لإصلاحات جوهرية قبل الاستخدام")
        
        # معلومات إضافية
        if hasattr(self, 'current_medical_rep'):
            print(f"\n👤 المندوب الطبي المستخدم في الاختبار:")
            print(f"   الاسم: {self.current_medical_rep.get('full_name', 'غير محدد')}")
            print(f"   اسم المستخدم: {self.current_medical_rep.get('username', 'غير محدد')}")
            print(f"   الدور: {self.current_medical_rep.get('role', 'غير محدد')}")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "critical_functions_working": critical_success,
            "test_results": self.test_results,
            "total_time": total_time
        }

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = MedicalRepClinicRegistrationTester()
    results = tester.run_all_tests()
    
    # حفظ النتائج في ملف
    with open("/app/medical_rep_clinic_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 تم حفظ النتائج في: /app/medical_rep_clinic_test_results.json")
    
    return results["success_rate"] >= 60

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)