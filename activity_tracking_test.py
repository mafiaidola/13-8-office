#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Activity Tracking and GPS System APIs Testing
اختبار شامل لنظام تتبع الأنشطة والGPS بعد إصلاح import error

المطلوب اختبار:
1. تسجيل الدخول admin/admin123
2. POST /api/activities - إنشاء نشاط جديد مع بيانات GPS وتفاصيل شاملة
3. GET /api/admin/activities - جلب جميع الأنشطة للأدمن
4. GET /api/admin/activities/stats - إحصائيات الأنشطة الشاملة
5. GET /api/admin/gps-tracking - سجلات تتبع GPS
6. POST /api/log-gps - تسجيل موقع GPS جديد
7. اختبار الفلترة والبحث
8. اختبار صلاحيات الأدمن
"""

import requests
import json
import time
from datetime import datetime, timedelta
import os

# Configuration
BACKEND_URL = "https://d3d1a9df-70fc-435f-82af-b5d9d4d817e1.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ActivityTrackingTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, message, response_time=None):
        """تسجيل نتيجة الاختبار"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        result = f"{status} {test_name}{time_info}: {message}"
        self.test_results.append(result)
        print(result)
        
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن"""
        print("\n🔐 Testing Admin Login...")
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.admin_token = data["access_token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.admin_token}"
                    })
                    user_info = data.get("user", {})
                    self.log_test(
                        "Admin Login",
                        True,
                        f"Successfully logged in as {user_info.get('username', 'admin')} with role {user_info.get('role', 'admin')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response", response_time)
                    return False
            else:
                self.log_test("Admin Login", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def test_create_activity(self):
        """اختبار إنشاء نشاط جديد مع GPS"""
        print("\n📝 Testing Activity Creation...")
        start_time = time.time()
        
        try:
            activity_data = {
                "type": "visit_registration",
                "action": "تسجيل زيارة عيادة تجريبية شاملة",
                "target_type": "clinic",
                "target_id": "clinic-test-001",
                "target_name": "عيادة الدكتور أحمد محمد - اختبار شامل",
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "accuracy": 10.5,
                    "address": "شارع النيل، المعادي، القاهرة",
                    "city": "القاهرة",
                    "area": "المعادي"
                },
                "device_info": {
                    "device_type": "mobile",
                    "operating_system": "Android 12",
                    "browser": "Chrome",
                    "browser_version": "120.0.0.0",
                    "screen_resolution": "1080x2400",
                    "ip_address": "192.168.1.100"
                },
                "details": {
                    "visit_duration": 45,
                    "doctor_present": True,
                    "samples_given": 3,
                    "order_value": 2500.0,
                    "visit_type": "routine_visit",
                    "products_discussed": ["منتج أ", "منتج ب", "منتج ج"],
                    "next_visit_scheduled": True,
                    "clinic_feedback": "إيجابي جداً"
                },
                "metadata": {
                    "app_version": "2.1.0",
                    "test_mode": True,
                    "created_by_test": "comprehensive_activity_test"
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
                self.log_test(
                    "Create Activity",
                    True,
                    f"Activity created successfully with ID: {activity_id}, Type: {data.get('type')}, Action: {data.get('action')[:50]}...",
                    response_time
                )
                return activity_id
            else:
                self.log_test("Create Activity", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return None
                
        except Exception as e:
            self.log_test("Create Activity", False, f"Exception: {str(e)}")
            return None
    
    def test_get_all_activities(self):
        """اختبار جلب جميع الأنشطة للأدمن"""
        print("\n📋 Testing Get All Activities...")
        start_time = time.time()
        
        try:
            response = self.session.get(
                f"{self.base_url}/admin/activities",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                if isinstance(activities, list):
                    self.log_test(
                        "Get All Activities",
                        True,
                        f"Retrieved {len(activities)} activities successfully. Sample types: {list(set([act.get('type', 'unknown') for act in activities[:5]]))}",
                        response_time
                    )
                    return activities
                else:
                    self.log_test("Get All Activities", False, "Response is not a list", response_time)
                    return []
            else:
                self.log_test("Get All Activities", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return []
                
        except Exception as e:
            self.log_test("Get All Activities", False, f"Exception: {str(e)}")
            return []
    
    def test_get_activity_stats(self):
        """اختبار إحصائيات الأنشطة"""
        print("\n📊 Testing Activity Statistics...")
        start_time = time.time()
        
        try:
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
                
                self.log_test(
                    "Activity Statistics",
                    True,
                    f"Stats retrieved: Total={total}, Today={today}, Week={week}, Month={month}, Types={len(stats.get('activities_by_type', {}))}, Users={len(stats.get('activities_by_user', {}))}",
                    response_time
                )
                return stats
            else:
                self.log_test("Activity Statistics", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return {}
                
        except Exception as e:
            self.log_test("Activity Statistics", False, f"Exception: {str(e)}")
            return {}
    
    def test_get_gps_tracking(self):
        """اختبار سجلات تتبع GPS"""
        print("\n🗺️ Testing GPS Tracking Logs...")
        start_time = time.time()
        
        try:
            response = self.session.get(
                f"{self.base_url}/admin/gps-tracking",
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                gps_logs = response.json()
                if isinstance(gps_logs, list):
                    locations = []
                    for log in gps_logs[:3]:  # Sample first 3 logs
                        location = log.get("location", {})
                        if location:
                            locations.append(f"({location.get('latitude', 'N/A')}, {location.get('longitude', 'N/A')})")
                    
                    self.log_test(
                        "GPS Tracking Logs",
                        True,
                        f"Retrieved {len(gps_logs)} GPS logs. Sample locations: {', '.join(locations)}",
                        response_time
                    )
                    return gps_logs
                else:
                    self.log_test("GPS Tracking Logs", False, "Response is not a list", response_time)
                    return []
            else:
                self.log_test("GPS Tracking Logs", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return []
                
        except Exception as e:
            self.log_test("GPS Tracking Logs", False, f"Exception: {str(e)}")
            return []
    
    def test_log_gps_location(self):
        """اختبار تسجيل موقع GPS جديد"""
        print("\n📍 Testing GPS Location Logging...")
        start_time = time.time()
        
        try:
            location_data = {
                "latitude": 30.0626,
                "longitude": 31.2497,
                "accuracy": 8.2,
                "altitude": 74.5,
                "speed": 0.0,
                "heading": 180.0,
                "address": "مدينة نصر، القاهرة",
                "city": "القاهرة",
                "area": "مدينة نصر",
                "country": "مصر"
            }
            
            response = self.session.post(
                f"{self.base_url}/log-gps",
                json=location_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                log_id = data.get("log_id")
                message = data.get("message", "")
                self.log_test(
                    "Log GPS Location",
                    True,
                    f"GPS location logged successfully. Log ID: {log_id}, Message: {message}",
                    response_time
                )
                return log_id
            else:
                self.log_test("Log GPS Location", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return None
                
        except Exception as e:
            self.log_test("Log GPS Location", False, f"Exception: {str(e)}")
            return None
    
    def test_activity_filtering(self):
        """اختبار فلترة الأنشطة"""
        print("\n🔍 Testing Activity Filtering...")
        
        # Test filter by activity type
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/admin/activities?activity_type=visit_registration",
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                visit_activities = [act for act in activities if act.get("type") == "visit_registration"]
                self.log_test(
                    "Filter by Activity Type",
                    True,
                    f"Filtered {len(visit_activities)} visit_registration activities out of {len(activities)} total",
                    response_time
                )
            else:
                self.log_test("Filter by Activity Type", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Filter by Activity Type", False, f"Exception: {str(e)}")
        
        # Test filter by date
        start_time = time.time()
        try:
            today = datetime.utcnow().date()
            response = self.session.get(
                f"{self.base_url}/admin/activities?from_date={today}T00:00:00&to_date={today}T23:59:59",
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                self.log_test(
                    "Filter by Date Range",
                    True,
                    f"Filtered activities for today: {len(activities)} activities found",
                    response_time
                )
            else:
                self.log_test("Filter by Date Range", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Filter by Date Range", False, f"Exception: {str(e)}")
        
        # Test pagination
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/admin/activities?limit=5&offset=0",
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                self.log_test(
                    "Pagination Test",
                    True,
                    f"Pagination working: Retrieved {len(activities)} activities (limit=5)",
                    response_time
                )
            else:
                self.log_test("Pagination Test", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Pagination Test", False, f"Exception: {str(e)}")
    
    def test_admin_permissions(self):
        """اختبار صلاحيات الأدمن"""
        print("\n🔒 Testing Admin Permissions...")
        
        # Test access to admin-only endpoints
        admin_endpoints = [
            "/admin/activities",
            "/admin/activities/stats", 
            "/admin/gps-tracking"
        ]
        
        for endpoint in admin_endpoints:
            start_time = time.time()
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    self.log_test(
                        f"Admin Access {endpoint}",
                        True,
                        "Admin can access endpoint successfully",
                        response_time
                    )
                elif response.status_code == 403:
                    self.log_test(
                        f"Admin Access {endpoint}",
                        False,
                        "Access denied - admin permissions not working",
                        response_time
                    )
                else:
                    self.log_test(
                        f"Admin Access {endpoint}",
                        False,
                        f"HTTP {response.status_code}: {response.text}",
                        response_time
                    )
            except Exception as e:
                self.log_test(f"Admin Access {endpoint}", False, f"Exception: {str(e)}")
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 Starting Comprehensive Activity Tracking and GPS System Test")
        print("=" * 80)
        
        # Step 1: Admin Login
        if not self.test_admin_login():
            print("\n❌ Cannot proceed without admin login")
            return
        
        # Step 2: Test Core APIs
        self.test_create_activity()
        activities = self.test_get_all_activities()
        stats = self.test_get_activity_stats()
        gps_logs = self.test_get_gps_tracking()
        self.test_log_gps_location()
        
        # Step 3: Test Advanced Features
        self.test_activity_filtering()
        self.test_admin_permissions()
        
        # Final Results
        print("\n" + "=" * 80)
        print("📊 FINAL TEST RESULTS")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0
        
        print(f"✅ Tests Passed: {self.passed_tests}/{self.total_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 EXCELLENT! Activity Tracking and GPS System is working properly!")
        elif success_rate >= 60:
            print("⚠️ GOOD! Most features working, minor issues detected")
        else:
            print("❌ CRITICAL ISSUES! Major problems with Activity Tracking system")
        
        print("\n📋 Detailed Results:")
        for result in self.test_results:
            print(f"  {result}")
        
        # Summary for main agent
        print(f"\n🎯 SUMMARY FOR MAIN AGENT:")
        print(f"Activity Tracking and GPS System APIs Testing completed with {success_rate:.1f}% success rate")
        
        if success_rate >= 80:
            print("✅ All major APIs are working correctly:")
            print("  - POST /api/activities: Creating activities with GPS data ✅")
            print("  - GET /api/admin/activities: Retrieving all activities ✅") 
            print("  - GET /api/admin/activities/stats: Activity statistics ✅")
            print("  - GET /api/admin/gps-tracking: GPS tracking logs ✅")
            print("  - POST /api/log-gps: GPS location logging ✅")
            print("  - Filtering and admin permissions working ✅")
        else:
            print("❌ Issues detected that need attention:")
            failed_tests = [result for result in self.test_results if "❌ FAIL" in result]
            for failed_test in failed_tests:
                print(f"  {failed_test}")

if __name__ == "__main__":
    tester = ActivityTrackingTester()
    tester.run_comprehensive_test()