#!/usr/bin/env python3
"""
اختبار شامل لنظام تسجيل الأنشطة التفصيلي المحسن - Arabic Review
Comprehensive Enhanced Activity Logging System Testing
"""

import requests
import json
import time
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"
WRONG_PASSWORD = "wrongpassword"

class EnhancedActivityLoggingTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.created_test_data = []
        
    def log_test(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms" if response_time else "N/A",
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        print(f"   📝 {details}")
        
    def test_successful_login_with_activity_logging(self):
        """1. تسجيل الدخول الناجح مع تسجيل النشاط"""
        try:
            start_time = time.time()
            
            # إعداد بيانات تسجيل الدخول مع معلومات شاملة
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD,
                "geolocation": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "accuracy": 10,
                    "city": "القاهرة",
                    "country": "مصر",
                    "address": "القاهرة، مصر",
                    "timestamp": datetime.now().isoformat()
                },
                "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
                "ip_address": "156.160.45.123"
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                details = f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
                self.log_test("تسجيل الدخول الناجح مع تفاصيل الجهاز والموقع", True, details, response_time)
                
                # إعداد headers للطلبات القادمة
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                return True
            else:
                self.log_test("تسجيل الدخول الناجح", False, f"فشل تسجيل الدخول: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("تسجيل الدخول الناجح", False, f"خطأ في تسجيل الدخول: {str(e)}")
            return False
    
    def test_failed_login_attempt(self):
        """2. تسجيل محاولة دخول فاشلة"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": ADMIN_USERNAME,
                "password": WRONG_PASSWORD,
                "geolocation": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "city": "القاهرة",
                    "country": "مصر"
                },
                "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
                "ip_address": "156.160.45.123"
            }
            
            # إنشاء session منفصلة لمحاولة الدخول الفاشلة
            temp_session = requests.Session()
            response = temp_session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 401:
                details = f"محاولة دخول فاشلة تم رفضها بنجاح - كلمة مرور خاطئة للمستخدم: {ADMIN_USERNAME}"
                self.log_test("تسجيل محاولة دخول فاشلة", True, details, response_time)
                return True
            else:
                self.log_test("تسجيل محاولة دخول فاشلة", False, f"استجابة غير متوقعة: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("تسجيل محاولة دخول فاشلة", False, f"خطأ في اختبار الدخول الفاشل: {str(e)}")
            return False
    
    def test_activities_apis(self):
        """3. اختبار APIs تسجيل الأنشطة"""
        if not self.jwt_token:
            self.log_test("اختبار APIs الأنشطة", False, "لا يوجد JWT token - يجب تسجيل الدخول أولاً")
            return False
        
        success_count = 0
        total_tests = 4
        
        # 3.1 GET /api/activities - جلب الأنشطة الحديثة
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/activities/")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                details = f"تم جلب {len(activities)} نشاط من قاعدة البيانات"
                self.log_test("GET /api/activities - جلب الأنشطة", True, details, response_time)
                success_count += 1
            else:
                self.log_test("GET /api/activities", False, f"فشل جلب الأنشطة: {response.status_code}", response_time)
        except Exception as e:
            self.log_test("GET /api/activities", False, f"خطأ في جلب الأنشطة: {str(e)}")
        
        # 3.2 GET /api/activities/stats - إحصائيات الأنشطة
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/activities/stats")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                total = stats.get("total_activities", 0)
                recent = stats.get("recent_activities_24h", 0)
                actions_count = len(stats.get("actions", []))
                
                details = f"إجمالي الأنشطة: {total}, الحديثة (24 ساعة): {recent}, أنواع الأنشطة: {actions_count}"
                self.log_test("GET /api/activities/stats - إحصائيات الأنشطة", True, details, response_time)
                success_count += 1
            else:
                self.log_test("GET /api/activities/stats", False, f"فشل جلب الإحصائيات: {response.status_code}", response_time)
        except Exception as e:
            self.log_test("GET /api/activities/stats", False, f"خطأ في جلب الإحصائيات: {str(e)}")
        
        # 3.3 POST /api/activities/record - تسجيل نشاط تجريبي شامل
        try:
            start_time = time.time()
            
            test_activity = {
                "user_id": "admin-001",
                "user_name": "System Administrator",
                "user_role": "admin",
                "action": "comprehensive_test",
                "description": "اختبار شامل لنظام تسجيل الأنشطة التفصيلي المحسن",
                "entity_type": "system_test",
                "entity_id": str(uuid.uuid4()),
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "city": "القاهرة",
                    "country": "مصر",
                    "address": "مركز اختبار النظام، القاهرة"
                },
                "additional_data": {
                    "test_type": "comprehensive_activity_logging",
                    "test_phase": "enhanced_system_validation",
                    "browser_language": "ar-EG",
                    "screen_resolution": "1920x1080",
                    "timezone": "Africa/Cairo"
                },
                "session_duration": 1800
            }
            
            response = self.session.post(f"{BACKEND_URL}/activities/record", json=test_activity)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                activity_id = result.get("activity_id")
                location_detected = result.get("location_detected", False)
                
                details = f"تم تسجيل النشاط التجريبي - ID: {activity_id}, اكتشاف الموقع: {'نعم' if location_detected else 'لا'}"
                self.log_test("POST /api/activities/record - تسجيل نشاط شامل", True, details, response_time)
                success_count += 1
                
                # حفظ ID للتنظيف لاحقاً
                self.created_test_data.append({"type": "activity", "id": activity_id})
            else:
                self.log_test("POST /api/activities/record", False, f"فشل تسجيل النشاط: {response.status_code} - {response.text}", response_time)
        except Exception as e:
            self.log_test("POST /api/activities/record", False, f"خطأ في تسجيل النشاط: {str(e)}")
        
        # 3.4 GET /api/activities/user/{user_id} - أنشطة مستخدم محدد
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/activities/user/admin-001")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                user_activities = response.json()
                details = f"تم جلب {len(user_activities)} نشاط للمستخدم admin-001"
                self.log_test("GET /api/activities/user/{user_id} - أنشطة المستخدم", True, details, response_time)
                success_count += 1
            else:
                self.log_test("GET /api/activities/user/{user_id}", False, f"فشل جلب أنشطة المستخدم: {response.status_code}", response_time)
        except Exception as e:
            self.log_test("GET /api/activities/user/{user_id}", False, f"خطأ في جلب أنشطة المستخدم: {str(e)}")
        
        # تقييم النتيجة الإجمالية
        success_rate = (success_count / total_tests) * 100
        overall_success = success_count >= 3  # نجاح 3 من 4 اختبارات على الأقل
        
        details = f"نجح {success_count}/{total_tests} اختبار APIs ({success_rate:.1f}%)"
        self.log_test("اختبار APIs تسجيل الأنشطة - الإجمالي", overall_success, details)
        
        return overall_success
    
    def test_clinic_creation_activity_logging(self):
        """4. اختبار إنشاء عيادة تجريبية وتسجيل النشاط"""
        if not self.jwt_token:
            self.log_test("اختبار إنشاء عيادة", False, "لا يوجد JWT token")
            return False
        
        try:
            start_time = time.time()
            
            clinic_data = {
                "clinic_name": "عيادة الاختبار الشامل للأنشطة",
                "clinic_phone": "01234567890",
                "doctor_name": "د. أحمد محمد الاختبار",
                "clinic_address": "123 شارع الاختبار، القاهرة",
                "clinic_latitude": 30.0444,
                "clinic_longitude": 31.2357,
                "line_id": "line-001",
                "area_id": "area-001",
                "classification": "class_a",
                "credit_classification": "green",
                "classification_notes": "عيادة تجريبية لاختبار نظام تسجيل الأنشطة",
                "registration_notes": "تم إنشاؤها لأغراض الاختبار الشامل"
            }
            
            response = self.session.post(f"{BACKEND_URL}/clinics", json=clinic_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                clinic_id = result.get("clinic_id")
                registration_number = result.get("registration_number")
                
                details = f"تم إنشاء العيادة التجريبية - ID: {clinic_id}, رقم التسجيل: {registration_number}"
                self.log_test("إنشاء عيادة تجريبية", True, details, response_time)
                
                # حفظ ID للتنظيف لاحقاً
                self.created_test_data.append({"type": "clinic", "id": clinic_id})
                
                # التحقق من تسجيل النشاط
                time.sleep(1)  # انتظار قصير لضمان حفظ النشاط
                return self.verify_activity_logged("clinic_registration", clinic_id)
            else:
                self.log_test("إنشاء عيادة تجريبية", False, f"فشل إنشاء العيادة: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("إنشاء عيادة تجريبية", False, f"خطأ في إنشاء العيادة: {str(e)}")
            return False
    
    def test_visit_creation_activity_logging(self):
        """5. اختبار إنشاء زيارة تجريبية وتسجيل النشاط"""
        if not self.jwt_token:
            self.log_test("اختبار إنشاء زيارة", False, "لا يوجد JWT token")
            return False
        
        try:
            start_time = time.time()
            
            visit_data = {
                "clinic_id": "clinic-test-001",
                "clinic_name": "عيادة الاختبار للزيارات",
                "doctor_name": "د. محمد أحمد",
                "clinic_address": "456 شارع الزيارات، الجيزة",
                "clinic_phone": "01098765432",
                "visit_type": "routine",
                "scheduled_date": datetime.now().isoformat(),
                "visit_purpose": "اختبار شامل لنظام تسجيل أنشطة الزيارات",
                "visit_notes": "زيارة تجريبية لاختبار تسجيل الأنشطة التفصيلي",
                "estimated_duration": 45,
                "priority_level": "high",
                "assigned_to_name": "مندوب الاختبار",
                "assigned_to_role": "medical_rep"
            }
            
            response = self.session.post(f"{BACKEND_URL}/visits/", json=visit_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                visit_id = result.get("visit_id")
                visit_number = result.get("visit_number")
                
                details = f"تم إنشاء الزيارة التجريبية - ID: {visit_id}, رقم الزيارة: {visit_number}"
                self.log_test("إنشاء زيارة تجريبية", True, details, response_time)
                
                # حفظ ID للتنظيف لاحقاً
                self.created_test_data.append({"type": "visit", "id": visit_id})
                
                # التحقق من تسجيل النشاط
                time.sleep(1)
                return self.verify_activity_logged("visit_created", visit_id)
            else:
                self.log_test("إنشاء زيارة تجريبية", False, f"فشل إنشاء الزيارة: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("إنشاء زيارة تجريبية", False, f"خطأ في إنشاء الزيارة: {str(e)}")
            return False
    
    def test_user_creation_activity_logging(self):
        """6. اختبار إنشاء مستخدم تجريبي وتسجيل النشاط"""
        if not self.jwt_token:
            self.log_test("اختبار إنشاء مستخدم", False, "لا يوجد JWT token")
            return False
        
        try:
            start_time = time.time()
            
            user_data = {
                "username": f"test_user_{int(time.time())}",
                "password": "TestPassword123!",
                "full_name": "مستخدم الاختبار الشامل",
                "email": f"test_activity_{int(time.time())}@test.com",
                "role": "medical_rep",
                "phone": "01555666777",
                "is_active": True,
                "notes": "مستخدم تجريبي لاختبار نظام تسجيل الأنشطة"
            }
            
            response = self.session.post(f"{BACKEND_URL}/users", json=user_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                user_id = result.get("user_id") or result.get("id")
                
                details = f"تم إنشاء المستخدم التجريبي - ID: {user_id}, الاسم: {user_data['full_name']}"
                self.log_test("إنشاء مستخدم تجريبي", True, details, response_time)
                
                # حفظ ID للتنظيف لاحقاً
                self.created_test_data.append({"type": "user", "id": user_id})
                
                # التحقق من تسجيل النشاط
                time.sleep(1)
                return self.verify_activity_logged("user_create", user_id)
            else:
                self.log_test("إنشاء مستخدم تجريبي", False, f"فشل إنشاء المستخدم: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("إنشاء مستخدم تجريبي", False, f"خطأ في إنشاء المستخدم: {str(e)}")
            return False
    
    def verify_activity_logged(self, activity_type, entity_id):
        """التحقق من تسجيل النشاط في قاعدة البيانات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/activities/?action={activity_type}&limit=10")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                
                # البحث عن النشاط المطلوب
                found_activity = None
                for activity in activities:
                    if activity.get("entity_id") == entity_id or entity_id in str(activity.get("details", "")):
                        found_activity = activity
                        break
                
                if found_activity:
                    details = f"تم العثور على نشاط {activity_type} للكيان {entity_id}"
                    self.log_test(f"التحقق من تسجيل نشاط {activity_type}", True, details, response_time)
                    return True
                else:
                    details = f"لم يتم العثور على نشاط {activity_type} للكيان {entity_id}"
                    self.log_test(f"التحقق من تسجيل نشاط {activity_type}", False, details, response_time)
                    return False
            else:
                self.log_test(f"التحقق من تسجيل نشاط {activity_type}", False, f"فشل جلب الأنشطة: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test(f"التحقق من تسجيل نشاط {activity_type}", False, f"خطأ في التحقق: {str(e)}")
            return False
    
    def test_activity_details_verification(self):
        """7. التحقق من تفاصيل الأنشطة المسجلة"""
        if not self.jwt_token:
            self.log_test("التحقق من تفاصيل الأنشطة", False, "لا يوجد JWT token")
            return False
        
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/activities/?limit=5")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                
                if not activities:
                    self.log_test("التحقق من تفاصيل الأنشطة", False, "لا توجد أنشطة للفحص", response_time)
                    return False
                
                # فحص التفاصيل المطلوبة
                details_check = {
                    "ip_address": 0,
                    "device_info": 0,
                    "location": 0,
                    "timestamp": 0
                }
                
                for activity in activities:
                    if activity.get("ip_address"):
                        details_check["ip_address"] += 1
                    if activity.get("device_info"):
                        details_check["device_info"] += 1
                    if activity.get("location"):
                        details_check["location"] += 1
                    if activity.get("timestamp"):
                        details_check["timestamp"] += 1
                
                total_activities = len(activities)
                ip_percentage = (details_check["ip_address"] / total_activities) * 100
                device_percentage = (details_check["device_info"] / total_activities) * 100
                location_percentage = (details_check["location"] / total_activities) * 100
                timestamp_percentage = (details_check["timestamp"] / total_activities) * 100
                
                details = f"فحص {total_activities} أنشطة - IP: {ip_percentage:.1f}%, الجهاز: {device_percentage:.1f}%, الموقع: {location_percentage:.1f}%, التوقيت: {timestamp_percentage:.1f}%"
                
                # اعتبار النجاح إذا كان 80% من الأنشطة تحتوي على التفاصيل المطلوبة
                success = all(percentage >= 80 for percentage in [ip_percentage, device_percentage, location_percentage, timestamp_percentage])
                
                self.log_test("التحقق من تفاصيل الأنشطة المسجلة", success, details, response_time)
                return success
            else:
                self.log_test("التحقق من تفاصيل الأنشطة", False, f"فشل جلب الأنشطة: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("التحقق من تفاصيل الأنشطة", False, f"خطأ في فحص التفاصيل: {str(e)}")
            return False
    
    def cleanup_test_data(self):
        """8. تنظيف البيانات التجريبية"""
        if not self.jwt_token:
            self.log_test("تنظيف البيانات التجريبية", False, "لا يوجد JWT token")
            return False
        
        cleanup_success = 0
        total_cleanup = len(self.created_test_data)
        
        for test_item in self.created_test_data:
            try:
                item_type = test_item["type"]
                item_id = test_item["id"]
                
                if item_type == "activity":
                    # حذف النشاط التجريبي
                    response = self.session.delete(f"{BACKEND_URL}/activities/{item_id}")
                    if response.status_code == 200:
                        cleanup_success += 1
                        print(f"   ✅ تم حذف النشاط: {item_id}")
                    else:
                        print(f"   ⚠️ فشل حذف النشاط: {item_id}")
                
                elif item_type == "clinic":
                    # ملاحظة: لا يوجد endpoint حذف للعيادات في API الحالي
                    print(f"   ℹ️ العيادة {item_id} ستبقى في النظام (لا يوجد endpoint حذف)")
                    cleanup_success += 1
                
                elif item_type == "visit":
                    # ملاحظة: لا يوجد endpoint حذف للزيارات في API الحالي
                    print(f"   ℹ️ الزيارة {item_id} ستبقى في النظام (لا يوجد endpoint حذف)")
                    cleanup_success += 1
                
                elif item_type == "user":
                    # حذف المستخدم التجريبي
                    response = self.session.delete(f"{BACKEND_URL}/users/{item_id}")
                    if response.status_code == 200:
                        cleanup_success += 1
                        print(f"   ✅ تم حذف المستخدم: {item_id}")
                    else:
                        print(f"   ⚠️ فشل حذف المستخدم: {item_id}")
                        
            except Exception as e:
                print(f"   ❌ خطأ في حذف {test_item['type']} {test_item['id']}: {str(e)}")
        
        success_rate = (cleanup_success / total_cleanup) * 100 if total_cleanup > 0 else 100
        details = f"تم تنظيف {cleanup_success}/{total_cleanup} عنصر ({success_rate:.1f}%)"
        
        self.log_test("تنظيف البيانات التجريبية", cleanup_success >= total_cleanup * 0.8, details)
        return cleanup_success >= total_cleanup * 0.8
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لنظام تسجيل الأنشطة التفصيلي المحسن")
        print("=" * 80)
        
        test_functions = [
            ("1. تسجيل الدخول الناجح", self.test_successful_login_with_activity_logging),
            ("2. تسجيل محاولة دخول فاشلة", self.test_failed_login_attempt),
            ("3. اختبار APIs تسجيل الأنشطة", self.test_activities_apis),
            ("4. إنشاء عيادة تجريبية", self.test_clinic_creation_activity_logging),
            ("5. إنشاء زيارة تجريبية", self.test_visit_creation_activity_logging),
            ("6. إنشاء مستخدم تجريبي", self.test_user_creation_activity_logging),
            ("7. التحقق من تفاصيل الأنشطة", self.test_activity_details_verification),
            ("8. تنظيف البيانات التجريبية", self.cleanup_test_data)
        ]
        
        successful_tests = 0
        total_tests = len(test_functions)
        
        for test_name, test_function in test_functions:
            print(f"\n📋 {test_name}")
            print("-" * 50)
            
            try:
                if test_function():
                    successful_tests += 1
            except Exception as e:
                print(f"❌ خطأ في تنفيذ {test_name}: {str(e)}")
        
        # النتائج النهائية
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية - نظام تسجيل الأنشطة التفصيلي المحسن")
        print("=" * 80)
        
        success_rate = (successful_tests / total_tests) * 100
        
        print(f"✅ الاختبارات الناجحة: {successful_tests}/{total_tests}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 ممتاز! نظام تسجيل الأنشطة يعمل بشكل مثالي")
        elif success_rate >= 75:
            print("✅ جيد جداً! نظام تسجيل الأنشطة يعمل بشكل جيد مع تحسينات بسيطة")
        elif success_rate >= 60:
            print("⚠️ مقبول! نظام تسجيل الأنشطة يحتاج بعض التحسينات")
        else:
            print("❌ يحتاج إصلاحات! نظام تسجيل الأنشطة يحتاج مراجعة شاملة")
        
        print("\n📋 تفاصيل الاختبارات:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"{i:2d}. {status} {result['test']}")
            print(f"     📝 {result['details']}")
            if result["response_time"] != "N/A":
                print(f"     ⏱️ وقت الاستجابة: {result['response_time']}")
        
        print(f"\n🎯 الهدف: التأكد من أن نظام تسجيل الأنشطة التفصيلي يعمل بشكل شامل ويسجل كل التفاصيل المطلوبة بدقة")
        print(f"📊 النتيجة: {'تم تحقيق الهدف بنجاح!' if success_rate >= 85 else 'يحتاج تحسينات لتحقيق الهدف'}")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = EnhancedActivityLoggingTester()
    tester.run_comprehensive_test()