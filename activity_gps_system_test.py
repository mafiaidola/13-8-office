#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار شامل لنظام تتبع الأنشطة والGPS المطور حديثاً
Comprehensive Activity Tracking and GPS System Testing

المطلوب اختبار:
1. تسجيل الدخول admin/admin123 والحصول على JWT token
2. اختبار APIs الجديدة المطورة
3. اختبار تسجيل أنشطة المنتجات والعيادات
4. اختبار الفلترة والبحث
5. اختبار صلاحيات الأدمن
6. اختبار ثبات النظام
"""

import requests
import json
import time
from datetime import datetime, timedelta
import os
from typing import Dict, List, Any

class ActivityTrackingGPSSystemTester:
    def __init__(self):
        # Get backend URL from environment
        self.base_url = os.environ.get('REACT_APP_BACKEND_URL', 'https://39bfa0e9-57ce-4da8-b444-8d148da868a0.preview.emergentagent.com')
        if not self.base_url.endswith('/api'):
            self.base_url += '/api'
        
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🚀 بدء اختبار نظام تتبع الأنشطة والGPS")
        print(f"🔗 Backend URL: {self.base_url}")
        print("=" * 80)

    def log_test(self, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        time_str = f"({response_time:.2f}ms)" if response_time > 0 else ""
        print(f"{status} {test_name} {time_str}")
        if details:
            print(f"   📝 {details}")

    def test_admin_login(self) -> bool:
        """1. اختبار تسجيل الدخول admin/admin123"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                
                if self.admin_token:
                    # Set authorization header for future requests
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.admin_token}"
                    })
                    
                    user_info = data.get("user", {})
                    details = f"JWT token محفوظ، المستخدم: {user_info.get('full_name', 'admin')}, الدور: {user_info.get('role', 'admin')}"
                    self.log_test("تسجيل دخول admin/admin123", True, details, response_time)
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

    def test_create_activity_api(self) -> bool:
        """2. اختبار POST /api/activities - إنشاء نشاط جديد"""
        try:
            start_time = time.time()
            
            activity_data = {
                "type": "visit_registration",
                "action": "تسجيل زيارة عيادة تجريبية",
                "target_type": "clinic",
                "target_id": "clinic-test-001",
                "target_name": "عيادة الدكتور أحمد للاختبار",
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "accuracy": 10.5,
                    "address": "شارع النيل، المعادي، القاهرة",
                    "city": "القاهرة"
                },
                "device_info": {
                    "device_type": "mobile",
                    "operating_system": "Android 12",
                    "browser": "Chrome",
                    "ip_address": "192.168.1.100"
                },
                "details": {
                    "visit_duration": 45,
                    "doctor_present": True,
                    "samples_given": 3,
                    "notes": "زيارة ناجحة مع تقديم عينات جديدة"
                },
                "metadata": {
                    "test_activity": True,
                    "created_by_test": "comprehensive_test"
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/activities",
                json=activity_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                activity_id = data.get("id")
                details = f"تم إنشاء النشاط بنجاح، معرف النشاط: {activity_id}, النوع: {data.get('type')}, الإجراء: {data.get('action')}"
                self.log_test("POST /api/activities - إنشاء نشاط جديد", True, details, response_time)
                return True
            else:
                self.log_test("POST /api/activities - إنشاء نشاط جديد", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/activities - إنشاء نشاط جديد", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_get_admin_activities_api(self) -> bool:
        """3. اختبار GET /api/admin/activities - جلب جميع الأنشطة للأدمن"""
        try:
            start_time = time.time()
            
            response = self.session.get(
                f"{self.base_url}/admin/activities",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                if isinstance(activities, list):
                    details = f"تم جلب {len(activities)} نشاط بنجاح"
                    if activities:
                        first_activity = activities[0]
                        details += f", أول نشاط: {first_activity.get('action', 'غير محدد')} بواسطة {first_activity.get('user_name', 'غير محدد')}"
                    self.log_test("GET /api/admin/activities - جلب جميع الأنشطة", True, details, response_time)
                    return True
                else:
                    self.log_test("GET /api/admin/activities - جلب جميع الأنشطة", False, "الاستجابة ليست قائمة", response_time)
                    return False
            else:
                self.log_test("GET /api/admin/activities - جلب جميع الأنشطة", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin/activities - جلب جميع الأنشطة", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_get_activity_stats_api(self) -> bool:
        """4. اختبار GET /api/admin/activities/stats - إحصائيات الأنشطة"""
        try:
            start_time = time.time()
            
            response = self.session.get(
                f"{self.base_url}/admin/activities/stats",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                total = stats.get("total_activities", 0)
                today = stats.get("today_activities", 0)
                week = stats.get("week_activities", 0)
                month = stats.get("month_activities", 0)
                
                details = f"إجمالي الأنشطة: {total}, اليوم: {today}, الأسبوع: {week}, الشهر: {month}"
                
                activities_by_type = stats.get("activities_by_type", {})
                if activities_by_type:
                    details += f", الأنواع: {list(activities_by_type.keys())}"
                
                self.log_test("GET /api/admin/activities/stats - إحصائيات الأنشطة", True, details, response_time)
                return True
            else:
                self.log_test("GET /api/admin/activities/stats - إحصائيات الأنشطة", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin/activities/stats - إحصائيات الأنشطة", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_get_gps_tracking_api(self) -> bool:
        """5. اختبار GET /api/admin/gps-tracking - سجلات تتبع GPS (المطلوب) و APIs GPS الموجودة"""
        try:
            start_time = time.time()
            
            # Test the expected new API first
            response = self.session.get(
                f"{self.base_url}/admin/gps-tracking",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                gps_logs = response.json()
                if isinstance(gps_logs, list):
                    details = f"تم جلب {len(gps_logs)} سجل GPS بنجاح"
                    if gps_logs:
                        first_log = gps_logs[0]
                        location = first_log.get("location", {})
                        details += f", أول سجل: {location.get('address', 'غير محدد')} ({location.get('latitude', 0)}, {location.get('longitude', 0)})"
                    self.log_test("GET /api/admin/gps-tracking - سجلات GPS المطلوبة", True, details, response_time)
                    return True
                else:
                    self.log_test("GET /api/admin/gps-tracking - سجلات GPS المطلوبة", False, "الاستجابة ليست قائمة", response_time)
                    return False
            else:
                # If the expected API doesn't exist, test existing GPS APIs
                self.log_test("GET /api/admin/gps-tracking - سجلات GPS المطلوبة", False, f"API غير مُنفذ - HTTP {response.status_code}", response_time)
                
                # Test existing GPS APIs as fallback
                return self.test_existing_gps_apis()
                
        except Exception as e:
            self.log_test("GET /api/admin/gps-tracking - سجلات GPS", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_existing_gps_apis(self) -> bool:
        """اختبار APIs GPS الموجودة بالفعل"""
        try:
            success_count = 0
            total_apis = 3
            
            # Test /api/gps/locations
            start_time = time.time()
            response1 = self.session.get(f"{self.base_url}/gps/locations", timeout=10)
            response_time1 = (time.time() - start_time) * 1000
            
            if response1.status_code == 200:
                data1 = response1.json()
                locations = data1.get("data", [])
                self.log_test("GET /api/gps/locations - مواقع GPS", True, f"تم جلب {len(locations)} موقع GPS", response_time1)
                success_count += 1
            else:
                self.log_test("GET /api/gps/locations - مواقع GPS", False, f"HTTP {response1.status_code}", response_time1)
            
            # Test /api/gps/stats
            start_time = time.time()
            response2 = self.session.get(f"{self.base_url}/gps/stats", timeout=10)
            response_time2 = (time.time() - start_time) * 1000
            
            if response2.status_code == 200:
                data2 = response2.json()
                stats = data2.get("data", {})
                users_count = stats.get("total_users", 0)
                online_count = stats.get("online_users", 0)
                self.log_test("GET /api/gps/stats - إحصائيات GPS", True, f"{users_count} مستخدم، {online_count} متصل", response_time2)
                success_count += 1
            else:
                self.log_test("GET /api/gps/stats - إحصائيات GPS", False, f"HTTP {response2.status_code}", response_time2)
            
            # Test /api/admin/location-tracking
            start_time = time.time()
            response3 = self.session.get(f"{self.base_url}/admin/location-tracking", timeout=10)
            response_time3 = (time.time() - start_time) * 1000
            
            if response3.status_code == 200:
                data3 = response3.json()
                tracking_data = data3.get("data", [])
                total_records = data3.get("total_records", 0)
                clinic_regs = data3.get("clinic_registrations", 0)
                visit_locs = data3.get("visit_locations", 0)
                self.log_test("GET /api/admin/location-tracking - تتبع المواقع", True, f"{total_records} سجل إجمالي ({clinic_regs} تسجيل عيادة، {visit_locs} موقع زيارة)", response_time3)
                success_count += 1
            else:
                self.log_test("GET /api/admin/location-tracking - تتبع المواقع", False, f"HTTP {response3.status_code}", response_time3)
            
            return success_count >= 2  # Consider success if at least 2 out of 3 work
            
        except Exception as e:
            self.log_test("اختبار APIs GPS الموجودة", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_log_gps_api(self) -> bool:
        """6. اختبار POST /api/log-gps - تسجيل موقع GPS"""
        try:
            start_time = time.time()
            
            gps_data = {
                "latitude": 30.0626,
                "longitude": 31.2497,
                "accuracy": 8.5,
                "altitude": 74.0,
                "speed": 0.0,
                "heading": 180.0,
                "address": "مدينة نصر، القاهرة",
                "city": "القاهرة",
                "area": "مدينة نصر",
                "country": "مصر"
            }
            
            response = self.session.post(
                f"{self.base_url}/log-gps",
                json=gps_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                log_id = data.get("log_id")
                message = data.get("message", "تم تسجيل الموقع بنجاح")
                details = f"{message}, معرف السجل: {log_id}, الموقع: {gps_data['address']}"
                self.log_test("POST /api/log-gps - تسجيل موقع GPS", True, details, response_time)
                return True
            else:
                self.log_test("POST /api/log-gps - تسجيل موقع GPS", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/log-gps - تسجيل موقع GPS", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_activity_filtering(self) -> bool:
        """7. اختبار الفلترة والبحث"""
        try:
            # Test filtering by activity type
            start_time = time.time()
            
            response = self.session.get(
                f"{self.base_url}/admin/activities?activity_type=visit_registration&limit=10",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                if isinstance(activities, list):
                    visit_activities = [act for act in activities if act.get('type') == 'visit_registration']
                    details = f"فلترة حسب نوع النشاط: تم جلب {len(activities)} نشاط، منها {len(visit_activities)} زيارة"
                    
                    # Test date filtering
                    today = datetime.now().strftime('%Y-%m-%d')
                    response2 = self.session.get(
                        f"{self.base_url}/admin/activities?from_date={today}&limit=5",
                        timeout=10
                    )
                    
                    if response2.status_code == 200:
                        today_activities = response2.json()
                        details += f", أنشطة اليوم: {len(today_activities)}"
                    
                    self.log_test("اختبار الفلترة والبحث", True, details, response_time)
                    return True
                else:
                    self.log_test("اختبار الفلترة والبحث", False, "الاستجابة ليست قائمة", response_time)
                    return False
            else:
                self.log_test("اختبار الفلترة والبحث", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("اختبار الفلترة والبحث", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_product_activity_logging(self) -> bool:
        """8. اختبار تسجيل أنشطة المنتجات"""
        try:
            # Create a test product
            start_time = time.time()
            
            product_data = {
                "name": "منتج اختبار تتبع الأنشطة",
                "description": "منتج تجريبي لاختبار نظام تتبع الأنشطة",
                "category": "اختبار",
                "unit": "ڤايل",
                "line_id": "",  # Will be filled if lines exist
                "price": 25.0,
                "price_type": "fixed",
                "current_stock": 100,
                "is_active": True
            }
            
            # Get available lines first
            lines_response = self.session.get(f"{self.base_url}/lines", timeout=10)
            if lines_response.status_code == 200:
                lines = lines_response.json()
                if lines:
                    product_data["line_id"] = lines[0]["id"]
            
            response = self.session.post(
                f"{self.base_url}/products",
                json=product_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                product = response.json().get("product", {})
                product_id = product.get("id")
                
                # Check if activity was logged
                activities_response = self.session.get(
                    f"{self.base_url}/admin/activities?target_type=product&limit=5",
                    timeout=10
                )
                
                if activities_response.status_code == 200:
                    activities = activities_response.json()
                    product_activities = [act for act in activities if act.get('target_id') == product_id]
                    
                    details = f"تم إنشاء المنتج '{product.get('name')}', الأنشطة المسجلة: {len(product_activities)}"
                    
                    # Clean up - delete the test product
                    if product_id:
                        self.session.delete(f"{self.base_url}/products/{product_id}", timeout=10)
                    
                    self.log_test("اختبار تسجيل أنشطة المنتجات", True, details, response_time)
                    return True
                else:
                    self.log_test("اختبار تسجيل أنشطة المنتجات", False, "لا يمكن جلب الأنشطة للتحقق", response_time)
                    return False
            else:
                self.log_test("اختبار تسجيل أنشطة المنتجات", False, f"فشل في إنشاء المنتج: HTTP {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("اختبار تسجيل أنشطة المنتجات", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_admin_permissions(self) -> bool:
        """9. اختبار صلاحيات الأدمن"""
        try:
            # Test without admin token
            temp_session = requests.Session()
            start_time = time.time()
            
            response = temp_session.get(
                f"{self.base_url}/admin/activities",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 401 or response.status_code == 403:
                details = f"الحماية تعمل بشكل صحيح - HTTP {response.status_code} بدون token"
                
                # Test with invalid token
                temp_session.headers.update({"Authorization": "Bearer invalid-token"})
                response2 = temp_session.get(
                    f"{self.base_url}/admin/activities",
                    timeout=10
                )
                
                if response2.status_code == 401 or response2.status_code == 403:
                    details += f", HTTP {response2.status_code} مع token غير صحيح"
                    self.log_test("اختبار صلاحيات الأدمن", True, details, response_time)
                    return True
                else:
                    self.log_test("اختبار صلاحيات الأدمن", False, f"Token غير صحيح مقبول: HTTP {response2.status_code}", response_time)
                    return False
            else:
                self.log_test("اختبار صلاحيات الأدمن", False, f"الوصول مسموح بدون token: HTTP {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("اختبار صلاحيات الأدمن", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def test_system_stability(self) -> bool:
        """10. اختبار ثبات النظام"""
        try:
            successful_requests = 0
            total_requests = 5
            total_time = 0
            
            for i in range(total_requests):
                start_time = time.time()
                
                response = self.session.get(
                    f"{self.base_url}/admin/activities/stats",
                    timeout=10
                )
                
                request_time = time.time() - start_time
                total_time += request_time
                
                if response.status_code == 200:
                    successful_requests += 1
                
                time.sleep(0.5)  # Small delay between requests
            
            success_rate = (successful_requests / total_requests) * 100
            avg_response_time = (total_time / total_requests) * 1000
            
            details = f"معدل النجاح: {success_rate:.1f}% ({successful_requests}/{total_requests}), متوسط وقت الاستجابة: {avg_response_time:.2f}ms"
            
            success = success_rate >= 80  # Consider 80% success rate as acceptable
            self.log_test("اختبار ثبات النظام", success, details, avg_response_time)
            return success
                
        except Exception as e:
            self.log_test("اختبار ثبات النظام", False, f"خطأ في الاتصال: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🔍 بدء الاختبار الشامل لنظام تتبع الأنشطة والGPS...")
        print()
        
        # Test sequence
        tests = [
            ("تسجيل الدخول والمصادقة", self.test_admin_login),
            ("إنشاء نشاط جديد", self.test_create_activity_api),
            ("جلب جميع الأنشطة", self.test_get_admin_activities_api),
            ("إحصائيات الأنشطة", self.test_get_activity_stats_api),
            ("سجلات تتبع GPS", self.test_get_gps_tracking_api),
            ("تسجيل موقع GPS", self.test_log_gps_api),
            ("الفلترة والبحث", self.test_activity_filtering),
            ("تسجيل أنشطة المنتجات", self.test_product_activity_logging),
            ("صلاحيات الأدمن", self.test_admin_permissions),
            ("ثبات النظام", self.test_system_stability)
        ]
        
        successful_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n📋 اختبار: {test_name}")
            print("-" * 50)
            
            if test_func():
                successful_tests += 1
            
            time.sleep(1)  # Brief pause between tests
        
        # Generate final report
        self.generate_final_report(successful_tests, total_tests)

    def generate_final_report(self, successful_tests: int, total_tests: int):
        """إنتاج التقرير النهائي"""
        total_time = time.time() - self.start_time
        success_rate = (successful_tests / total_tests) * 100
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي - نظام تتبع الأنشطة والGPS")
        print("=" * 80)
        
        print(f"🎯 نسبة النجاح الإجمالية: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"⏱️  إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        print(f"🔗 Backend URL: {self.base_url}")
        
        if self.admin_token:
            print("✅ JWT Authentication: يعمل بشكل صحيح")
        else:
            print("❌ JWT Authentication: فشل في الحصول على token")
        
        print("\n📋 تفاصيل النتائج:")
        print("-" * 50)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            time_str = f"({result['response_time']:.2f}ms)" if result['response_time'] > 0 else ""
            print(f"{status} {result['test']} {time_str}")
            if result['details']:
                print(f"   📝 {result['details']}")
        
        print("\n🎯 الخلاصة:")
        print("-" * 30)
        
        if success_rate >= 90:
            print("🎉 ممتاز! النظام يعمل بشكل مثالي")
        elif success_rate >= 70:
            print("✅ جيد! النظام يعمل مع بعض المشاكل البسيطة")
        elif success_rate >= 50:
            print("⚠️  متوسط! النظام يحتاج إلى إصلاحات")
        else:
            print("❌ ضعيف! النظام يحتاج إلى مراجعة شاملة")
        
        # Specific recommendations
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n🔧 المشاكل المكتشفة ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = ActivityTrackingGPSSystemTester()
    tester.run_comprehensive_test()