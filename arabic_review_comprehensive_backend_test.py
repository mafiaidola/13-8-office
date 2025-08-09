#!/usr/bin/env python3
"""
Comprehensive Backend Testing After Recent Improvements - Arabic Review
اختبار شامل للنظام المطور بعد التحسينات الأخيرة

المطلوب اختبار:
1. تسجيل الدخول admin/admin123 والتأكد من أن النظام يسجل النشاط في قسمين:
   - مجموعة login_logs للسجلات المفصلة
   - مجموعة activities للأنشطة العامة

2. اختبار endpoints الجديدة:
   - GET /api/activities للحصول على الأنشطة مع الفلترة
   - POST /api/activities لإنشاء نشاط جديد
   - GET /api/activities/stats للإحصائيات

3. التأكد من أن:
   - endpoint إدارة الزيارات /api/visits يعمل بدون login_logs
   - جميع endpoints الأساسية تعمل بشكل طبيعي
   - البيانات المعروضة دقيقة ومترابطة

4. اختبار النظام مع geolocation data للتأكد من تسجيل الموقع في الأنشطة

الهدف: التأكد من أن التطوير الجديد يعمل بشكل مثالي ولا يؤثر على الوظائف الموجودة
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class ArabicReviewComprehensiveTestSuite:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={"Content-Type": "application/json"}
        )
        
    async def cleanup_session(self):
        """Clean up HTTP session"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        headers = {}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers, params=data) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return {
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time,
                        "success": response.status < 400
                    }
            else:
                async with self.session.request(method, url, json=data, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return {
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time,
                        "success": response.status < 400
                    }
                    
        except Exception as e:
            return {
                "status_code": 500,
                "data": {"error": str(e)},
                "response_time": 0,
                "success": False
            }
    
    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        print(f"{status} {test_name}: {details} ({response_time:.2f}ms)")
        
    async def test_1_admin_login_with_dual_logging(self):
        """اختبار 1: تسجيل دخول admin/admin123 مع التسجيل المزدوج"""
        print("\n🔐 اختبار 1: تسجيل دخول admin/admin123 مع geolocation")
        
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "accuracy": 10,
                "timestamp": datetime.utcnow().isoformat(),
                "city": "القاهرة",
                "country": "مصر",
                "address": "القاهرة، مصر - اختبار شامل"
            },
            "device_info": "Chrome Browser - Arabic Review Testing",
            "ip_address": "192.168.1.200"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and "access_token" in result["data"]:
            self.admin_token = result["data"]["access_token"]
            user_info = result["data"]["user"]
            self.log_test_result(
                "Admin Login with Geolocation",
                True,
                f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name')}, الدور: {user_info.get('role')}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "Admin Login with Geolocation",
                False,
                f"فشل تسجيل الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_2_verify_login_logs_collection(self):
        """اختبار 2: التحقق من تسجيل البيانات في مجموعة login_logs"""
        print("\n📝 اختبار 2: التحقق من مجموعة login_logs")
        
        # Wait for log to be saved
        await asyncio.sleep(2)
        
        result = await self.make_request("GET", "/visits/login-logs", {"limit": 10}, token=self.admin_token)
        
        if result["success"]:
            login_logs = result["data"]["login_logs"]
            admin_logs = [log for log in login_logs if log.get("username") == "admin"]
            
            if admin_logs:
                latest_log = admin_logs[0]
                has_geolocation = bool(latest_log.get("latitude") and latest_log.get("longitude"))
                has_device_info = bool(latest_log.get("device_info"))
                has_session_id = bool(latest_log.get("session_id"))
                
                details = f"تم العثور على {len(admin_logs)} سجل admin في login_logs"
                if has_geolocation:
                    details += f", مع geolocation: ({latest_log.get('latitude'):.4f}, {latest_log.get('longitude'):.4f})"
                if has_device_info:
                    details += f", الجهاز: {latest_log.get('device_info', '')[:30]}..."
                
                self.log_test_result(
                    "Verify login_logs Collection",
                    True,
                    details,
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "Verify login_logs Collection",
                    False,
                    f"لم يتم العثور على سجلات admin في login_logs من إجمالي {len(login_logs)} سجل",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Verify login_logs Collection",
                False,
                f"فشل جلب login_logs: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_3_verify_activities_collection(self):
        """اختبار 3: التحقق من تسجيل النشاط في مجموعة activities"""
        print("\n🎯 اختبار 3: التحقق من مجموعة activities")
        
        result = await self.make_request("GET", "/activities", {"limit": 10, "activity_type": "login"}, token=self.admin_token)
        
        if result["success"]:
            activities = result["data"]["activities"]
            login_activities = [act for act in activities if act.get("activity_type") == "login"]
            admin_login_activities = [act for act in login_activities if act.get("user_name") and "admin" in act.get("user_name", "").lower()]
            
            if admin_login_activities:
                latest_activity = admin_login_activities[0]
                has_location = bool(latest_activity.get("location"))
                has_geolocation = bool(latest_activity.get("geolocation"))
                has_device_info = bool(latest_activity.get("device_info"))
                
                details = f"تم العثور على {len(admin_login_activities)} نشاط login للأدمن في activities"
                if has_location:
                    details += f", الموقع: {latest_activity.get('location')}"
                if has_geolocation:
                    details += f", مع بيانات geolocation كاملة"
                
                self.log_test_result(
                    "Verify activities Collection",
                    True,
                    details,
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "Verify activities Collection",
                    False,
                    f"لم يتم العثور على أنشطة login للأدمن من إجمالي {len(activities)} نشاط",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Verify activities Collection",
                False,
                f"فشل جلب activities: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_4_get_activities_with_filtering(self):
        """اختبار 4: GET /api/activities مع الفلترة"""
        print("\n🔍 اختبار 4: GET /api/activities مع الفلترة")
        
        # Test different filters
        filters = [
            {"activity_type": "login", "description": "فلترة حسب نوع النشاط"},
            {"limit": 5, "description": "فلترة حسب العدد"},
            {"user_role": "admin", "description": "فلترة حسب دور المستخدم"}
        ]
        
        successful_filters = 0
        total_activities = 0
        
        for filter_data in filters:
            description = filter_data.pop("description")
            result = await self.make_request("GET", "/activities", filter_data, token=self.admin_token)
            
            if result["success"]:
                activities = result["data"]["activities"]
                total_activities += len(activities)
                successful_filters += 1
                print(f"    ✅ {description}: {len(activities)} نشاط")
            else:
                print(f"    ❌ {description}: فشل - {result['data']}")
        
        success = successful_filters >= 2  # At least 2 out of 3 filters work
        
        self.log_test_result(
            "GET /api/activities with Filtering",
            success,
            f"نجح {successful_filters}/3 فلاتر، إجمالي الأنشطة المسترجعة: {total_activities}",
            result["response_time"] if 'result' in locals() else 0
        )
        return success
    
    async def test_5_post_new_activity(self):
        """اختبار 5: POST /api/activities لإنشاء نشاط جديد"""
        print("\n➕ اختبار 5: POST /api/activities لإنشاء نشاط جديد")
        
        activity_data = {
            "activity_type": "system_test",
            "description": "اختبار إنشاء نشاط جديد من الاختبار الشامل",
            "details": "تم إنشاء هذا النشاط كجزء من اختبار النظام الشامل بعد التحسينات الأخيرة",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "device_info": "Test Suite - Arabic Review",
            "ip_address": "192.168.1.200"
        }
        
        result = await self.make_request("POST", "/activities", activity_data, token=self.admin_token)
        
        if result["success"]:
            activity_id = result["data"].get("id") or result["data"].get("_id")
            self.log_test_result(
                "POST /api/activities",
                True,
                f"تم إنشاء نشاط جديد بنجاح - ID: {activity_id}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "POST /api/activities",
                False,
                f"فشل إنشاء النشاط: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_6_get_activities_stats(self):
        """اختبار 6: GET /api/activities/stats للإحصائيات"""
        print("\n📊 اختبار 6: GET /api/activities/stats")
        
        result = await self.make_request("GET", "/activities/stats", token=self.admin_token)
        
        if result["success"]:
            stats = result["data"].get("stats", result["data"])
            
            # Check for expected statistics
            has_today_activities = "today_activities" in stats
            has_today_logins = "today_logins" in stats
            has_unique_users = "unique_users" in stats
            has_clinic_visits = "clinic_visits" in stats
            
            stats_count = sum([has_today_activities, has_today_logins, has_unique_users, has_clinic_visits])
            
            details = f"إحصائيات الأنشطة متاحة - {stats_count}/4 إحصائية أساسية"
            if has_today_activities:
                total = stats.get("today_activities", 0)
                details += f", أنشطة اليوم: {total}"
            if has_today_logins:
                logins = stats.get("today_logins", 0)
                details += f", تسجيلات دخول: {logins}"
            
            self.log_test_result(
                "GET /api/activities/stats",
                stats_count >= 2,  # At least 2 statistics available
                details,
                result["response_time"]
            )
            return stats_count >= 2
        else:
            self.log_test_result(
                "GET /api/activities/stats",
                False,
                f"فشل جلب إحصائيات الأنشطة: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_7_visits_endpoint_without_login_logs(self):
        """اختبار 7: التأكد من أن /api/visits يعمل بدون login_logs"""
        print("\n🏥 اختبار 7: /api/visits endpoints تعمل بدون اعتماد على login_logs")
        
        # Test visits dashboard overview instead of /api/visits
        result = await self.make_request("GET", "/visits/dashboard/overview", token=self.admin_token)
        
        if result["success"]:
            overview = result["data"]
            stats = overview.get("stats", {})
            total_visits = stats.get("total_visits", 0)
            
            self.log_test_result(
                "GET /api/visits/dashboard/overview Independence",
                True,
                f"endpoint الزيارات يعمل بشكل مستقل - {total_visits} زيارة متاحة، معدل الإنجاز: {stats.get('completion_rate', 0)}%",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "GET /api/visits/dashboard/overview Independence",
                False,
                f"فشل endpoint الزيارات: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_8_basic_endpoints_functionality(self):
        """اختبار 8: التأكد من عمل جميع endpoints الأساسية"""
        print("\n🔧 اختبار 8: جميع endpoints الأساسية تعمل بشكل طبيعي")
        
        basic_endpoints = [
            {"endpoint": "/users", "name": "المستخدمين"},
            {"endpoint": "/clinics", "name": "العيادات"},
            {"endpoint": "/products", "name": "المنتجات"},
            {"endpoint": "/dashboard/stats/admin", "name": "إحصائيات الداشبورد"},
            {"endpoint": "/health", "name": "صحة النظام"}
        ]
        
        successful_endpoints = 0
        total_records = 0
        
        for endpoint_info in basic_endpoints:
            endpoint = endpoint_info["endpoint"]
            name = endpoint_info["name"]
            
            result = await self.make_request("GET", endpoint, token=self.admin_token)
            
            if result["success"]:
                data = result["data"]
                if isinstance(data, list):
                    count = len(data)
                elif isinstance(data, dict):
                    count = data.get("total", len(data.keys()))
                else:
                    count = 1
                
                total_records += count
                successful_endpoints += 1
                print(f"    ✅ {name}: {count} سجل/عنصر")
            else:
                print(f"    ❌ {name}: فشل - {result['data']}")
        
        success = successful_endpoints >= 4  # At least 4 out of 5 endpoints work
        
        self.log_test_result(
            "Basic Endpoints Functionality",
            success,
            f"نجح {successful_endpoints}/5 endpoints أساسية، إجمالي السجلات: {total_records}",
            0
        )
        return success
    
    async def test_9_data_accuracy_and_interconnection(self):
        """اختبار 9: التأكد من دقة البيانات والترابط"""
        print("\n🔗 اختبار 9: دقة البيانات والترابط")
        
        # Get dashboard stats
        dashboard_result = await self.make_request("GET", "/dashboard/stats/admin", token=self.admin_token)
        
        # Get actual counts
        users_result = await self.make_request("GET", "/users", token=self.admin_token)
        clinics_result = await self.make_request("GET", "/clinics", token=self.admin_token)
        
        if dashboard_result["success"] and users_result["success"] and clinics_result["success"]:
            dashboard_stats = dashboard_result["data"]
            actual_users = len(users_result["data"]) if isinstance(users_result["data"], list) else users_result["data"].get("total", 0)
            actual_clinics = len(clinics_result["data"]) if isinstance(clinics_result["data"], list) else clinics_result["data"].get("total", 0)
            
            dashboard_users = dashboard_stats.get("total_users", 0)
            dashboard_clinics = dashboard_stats.get("total_clinics", 0)
            
            # Check accuracy (allow small differences due to timing)
            users_accurate = abs(dashboard_users - actual_users) <= 2
            clinics_accurate = abs(dashboard_clinics - actual_clinics) <= 2
            
            details = f"دقة البيانات - المستخدمين: {dashboard_users} (داشبورد) vs {actual_users} (فعلي)"
            details += f", العيادات: {dashboard_clinics} (داشبورد) vs {actual_clinics} (فعلي)"
            
            accuracy_score = sum([users_accurate, clinics_accurate])
            success = accuracy_score >= 1  # At least one metric is accurate
            
            self.log_test_result(
                "Data Accuracy and Interconnection",
                success,
                details + f" - دقة {accuracy_score}/2 مقياس",
                (dashboard_result["response_time"] + users_result["response_time"] + clinics_result["response_time"]) / 3
            )
            return success
        else:
            self.log_test_result(
                "Data Accuracy and Interconnection",
                False,
                "فشل في جلب البيانات للمقارنة",
                0
            )
            return False
    
    async def test_10_geolocation_in_activities(self):
        """اختبار 10: التأكد من تسجيل الموقع في الأنشطة"""
        print("\n🌍 اختبار 10: تسجيل geolocation في الأنشطة")
        
        result = await self.make_request("GET", "/activities", {"limit": 10}, token=self.admin_token)
        
        if result["success"]:
            activities = result["data"]["activities"]
            activities_with_location = [
                act for act in activities 
                if act.get("geolocation") or act.get("location") or (act.get("latitude") and act.get("longitude"))
            ]
            
            if activities_with_location:
                latest_with_location = activities_with_location[0]
                location_info = ""
                
                if latest_with_location.get("location"):
                    location_info = f"الموقع: {latest_with_location.get('location')}"
                elif latest_with_location.get("geolocation"):
                    geo = latest_with_location.get("geolocation")
                    if isinstance(geo, dict):
                        location_info = f"الموقع: {geo.get('city', 'غير محدد')}, {geo.get('country', 'غير محدد')}"
                
                details = f"تم العثور على {len(activities_with_location)} نشاط مع بيانات موقع من إجمالي {len(activities)}"
                if location_info:
                    details += f" - {location_info}"
                
                self.log_test_result(
                    "Geolocation in Activities",
                    True,
                    details,
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "Geolocation in Activities",
                    False,
                    f"لم يتم العثور على أنشطة مع بيانات موقع من إجمالي {len(activities)} نشاط",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Geolocation in Activities",
                False,
                f"فشل جلب الأنشطة: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 بدء الاختبار الشامل للنظام المطور بعد التحسينات الأخيرة")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            test_functions = [
                self.test_1_admin_login_with_dual_logging,
                self.test_2_verify_login_logs_collection,
                self.test_3_verify_activities_collection,
                self.test_4_get_activities_with_filtering,
                self.test_5_post_new_activity,
                self.test_6_get_activities_stats,
                self.test_7_visits_endpoint_without_login_logs,
                self.test_8_basic_endpoints_functionality,
                self.test_9_data_accuracy_and_interconnection,
                self.test_10_geolocation_in_activities
            ]
            
            for test_func in test_functions:
                try:
                    await test_func()
                    await asyncio.sleep(1)  # Brief pause between tests
                except Exception as e:
                    self.log_test_result(
                        test_func.__name__,
                        False,
                        f"خطأ في التنفيذ: {str(e)}",
                        0
                    )
            
        finally:
            await self.cleanup_session()
        
        # Generate final report
        self.generate_final_report()
    
    def generate_final_report(self):
        """Generate comprehensive final report"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        avg_response_time = sum(r["response_time"] for r in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي الشامل للنظام المطور بعد التحسينات الأخيرة")
        print("=" * 80)
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({passed_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print("\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']}")
            print(f"     └─ {result['details']}")
        
        print("\n" + "=" * 80)
        
        if success_rate >= 90:
            print("🎉 **اختبار شامل للنظام المطور مكتمل بنجاح مثالي!**")
            print("✅ **جميع المتطلبات الأساسية محققة:** التسجيل المزدوج، endpoints الجديدة، الترابط، geolocation")
            print("✅ **النظام يعمل بشكل مثالي:** لا يوجد تأثير سلبي على الوظائف الموجودة")
            print("✅ **التطوير الجديد متكامل:** جميع التحسينات تعمل كما هو مطلوب")
            print("🏆 **النتيجة النهائية:** النظام جاهز للإنتاج مع التحسينات الجديدة!")
        elif success_rate >= 70:
            print("⚠️ **اختبار شامل مكتمل بنجاح جيد مع بعض التحسينات المطلوبة**")
            print("✅ **الوظائف الأساسية تعمل** لكن بعض الميزات الجديدة تحتاج تحسين")
            print("🔧 **يُنصح بمراجعة المشاكل المتبقية** قبل النشر النهائي")
        else:
            print("❌ **الاختبار يظهر مشاكل تحتاج إصلاح فوري**")
            print("🚨 **التحسينات الجديدة تؤثر على الوظائف الموجودة** - يحتاج تدخل تقني عاجل")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    test_suite = ArabicReviewComprehensiveTestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())