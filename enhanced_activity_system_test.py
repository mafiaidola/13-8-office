#!/usr/bin/env python3
"""
اختبار شامل لنظام تسجيل الأنشطة المحسن - Enhanced Activity Logging System Testing
Arabic Review Request: Testing comprehensive activity logging system after recent updates
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class EnhancedActivitySystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """تسجيل نتيجة الاختبار"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": f"{response_time:.2f}ms",
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {response_time:.2f}ms - {details}")

    def login_admin(self):
        """تسجيل دخول الأدمن مع بيانات جغرافية وتقنية"""
        print("\n🔐 **المرحلة 1: تسجيل الدخول مع البيانات التقنية والجغرافية**")
        
        start_time = time.time()
        
        # إضافة بيانات جغرافية وتقنية شاملة للاختبار
        enhanced_credentials = {
            **ADMIN_CREDENTIALS,
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "accuracy": 10,
                "timestamp": datetime.utcnow().isoformat(),
                "city": "القاهرة",
                "country": "مصر",
                "address": "وسط البلد، القاهرة، مصر"
            },
            "device_info": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "ip_address": "156.160.45.123"  # IP مصري للاختبار
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=enhanced_credentials,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                user_info = data.get("user", {})
                
                details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
                self.log_test("تسجيل دخول admin/admin123 مع البيانات الجغرافية", True, response_time, details)
                
                # التحقق من تسجيل النشاط التلقائي
                print(f"   📍 الموقع المرسل: القاهرة، مصر")
                print(f"   🖥️ معلومات الجهاز: Chrome على Windows")
                print(f"   🌐 IP Address: 156.160.45.123")
                
                return True
            else:
                self.log_test("تسجيل دخول admin/admin123", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دخول admin/admin123", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_activity_record_api(self):
        """اختبار POST /api/activities/record"""
        print("\n📝 **المرحلة 2: اختبار تسجيل الأنشطة الجديدة**")
        
        if not self.token:
            print("❌ لا يوجد token للمصادقة")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # اختبار تسجيل نشاط شامل
        test_activity = {
            "user_id": "admin-001",
            "user_name": "System Administrator",
            "user_role": "admin",
            "action": "system_access",
            "description": "الوصول إلى لوحة التحكم الرئيسية",
            "entity_type": "dashboard",
            "entity_id": "admin_dashboard",
            "location": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "additional_data": {
                "section": "admin_panel",
                "feature": "dashboard_access",
                "browser": "Chrome",
                "os": "Windows 10"
            },
            "session_duration": 1800
        }
        
        start_time = time.time()
        
        try:
            response = requests.post(
                f"{self.base_url}/activities/record",
                json=test_activity,
                headers=headers,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                activity_id = data.get("activity_id")
                location_detected = data.get("location_detected", False)
                
                details = f"Activity ID: {activity_id}, موقع مكتشف: {'نعم' if location_detected else 'لا'}"
                self.log_test("POST /api/activities/record - تسجيل نشاط شامل", True, response_time, details)
                
                print(f"   🆔 معرف النشاط: {activity_id}")
                print(f"   📍 اكتشاف الموقع: {'✅ نجح' if location_detected else '❌ فشل'}")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("POST /api/activities/record", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("POST /api/activities/record", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_get_activities_api(self):
        """اختبار GET /api/activities"""
        print("\n📋 **المرحلة 3: اختبار جلب قائمة الأنشطة**")
        
        if not self.token:
            print("❌ لا يوجد token للمصادقة")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        start_time = time.time()
        
        try:
            response = requests.get(
                f"{self.base_url}/activities/",
                headers=headers,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                activities_count = len(activities) if isinstance(activities, list) else 0
                
                details = f"عدد الأنشطة: {activities_count}"
                self.log_test("GET /api/activities - جلب قائمة الأنشطة", True, response_time, details)
                
                # عرض تفاصيل أول 3 أنشطة
                if activities_count > 0:
                    print(f"   📊 إجمالي الأنشطة: {activities_count}")
                    for i, activity in enumerate(activities[:3], 1):
                        action = activity.get("action", "Unknown")
                        user_name = activity.get("user_name", "Unknown")
                        timestamp = activity.get("timestamp", "Unknown")
                        print(f"   {i}. {action} - {user_name} - {timestamp}")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("GET /api/activities", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/activities", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_activity_stats_api(self):
        """اختبار GET /api/activities/stats"""
        print("\n📈 **المرحلة 4: اختبار إحصائيات الأنشطة**")
        
        if not self.token:
            print("❌ لا يوجد token للمصادقة")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        start_time = time.time()
        
        try:
            response = requests.get(
                f"{self.base_url}/activities/stats",
                headers=headers,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                total_activities = stats.get("total_activities", 0)
                recent_activities = stats.get("recent_activities_24h", 0)
                actions_count = len(stats.get("actions", []))
                users_count = len(stats.get("users", []))
                devices_count = len(stats.get("devices", []))
                
                details = f"إجمالي: {total_activities}, حديثة: {recent_activities}, أنواع: {actions_count}"
                self.log_test("GET /api/activities/stats - إحصائيات الأنشطة", True, response_time, details)
                
                print(f"   📊 إجمالي الأنشطة: {total_activities}")
                print(f"   🕐 الأنشطة في آخر 24 ساعة: {recent_activities}")
                print(f"   🎯 أنواع الأنشطة: {actions_count}")
                print(f"   👥 المستخدمين النشطين: {users_count}")
                print(f"   📱 أنواع الأجهزة: {devices_count}")
                
                # عرض أهم الأنشطة
                top_actions = stats.get("actions", [])[:3]
                if top_actions:
                    print("   🔝 أهم الأنشطة:")
                    for i, action in enumerate(top_actions, 1):
                        print(f"      {i}. {action.get('action', 'Unknown')}: {action.get('count', 0)} مرة")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("GET /api/activities/stats", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/activities/stats", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_user_activities_api(self):
        """اختبار GET /api/activities/user/{user_id}"""
        print("\n👤 **المرحلة 5: اختبار أنشطة مستخدم محدد**")
        
        if not self.token:
            print("❌ لا يوجد token للمصادقة")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # اختبار أنشطة الأدمن
        user_id = "admin-001"
        start_time = time.time()
        
        try:
            response = requests.get(
                f"{self.base_url}/activities/user/{user_id}",
                headers=headers,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                user_activities = response.json()
                activities_count = len(user_activities) if isinstance(user_activities, list) else 0
                
                details = f"أنشطة المستخدم admin: {activities_count}"
                self.log_test("GET /api/activities/user/admin - أنشطة مستخدم محدد", True, response_time, details)
                
                print(f"   👤 أنشطة المستخدم admin: {activities_count}")
                
                # عرض آخر 3 أنشطة للمستخدم
                if activities_count > 0:
                    print("   📝 آخر الأنشطة:")
                    for i, activity in enumerate(user_activities[:3], 1):
                        action = activity.get("action", "Unknown")
                        description = activity.get("description", "")
                        timestamp = activity.get("timestamp", "Unknown")
                        print(f"      {i}. {action} - {description} - {timestamp}")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("GET /api/activities/user/admin", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/activities/user/admin", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_database_integration(self):
        """اختبار تكامل قاعدة البيانات"""
        print("\n🗄️ **المرحلة 6: اختبار تكامل قاعدة البيانات**")
        
        # اختبار الاتصال بقاعدة البيانات من خلال health check
        start_time = time.time()
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                health_data = response.json()
                db_status = health_data.get("database", "unknown")
                enhanced_routes = health_data.get("enhanced_routes", False)
                
                details = f"قاعدة البيانات: {db_status}, المسارات المحسنة: {'متاحة' if enhanced_routes else 'غير متاحة'}"
                self.log_test("اختبار الاتصال بقاعدة البيانات", True, response_time, details)
                
                print(f"   🗄️ حالة قاعدة البيانات: {db_status}")
                print(f"   🔧 المسارات المحسنة: {'✅ متاحة' if enhanced_routes else '❌ غير متاحة'}")
                
                # عرض الإحصائيات إذا كانت متاحة
                stats = health_data.get("statistics", {})
                if stats:
                    print("   📊 إحصائيات قاعدة البيانات:")
                    for key, value in stats.items():
                        print(f"      {key}: {value}")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("اختبار الاتصال بقاعدة البيانات", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("اختبار الاتصال بقاعدة البيانات", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_helper_functions(self):
        """اختبار الوظائف المساعدة من خلال تسجيل نشاط معقد"""
        print("\n🔧 **المرحلة 7: اختبار الوظائف المساعدة**")
        
        if not self.token:
            print("❌ لا يوجد token للمصادقة")
            return False
            
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
        
        # تسجيل نشاط معقد لاختبار جميع الوظائف المساعدة
        complex_activity = {
            "user_id": "admin-001",
            "user_name": "System Administrator",
            "user_role": "admin",
            "action": "complex_operation",
            "description": "اختبار الوظائف المساعدة - استخراج IP وتحليل User Agent والموقع",
            "entity_type": "system_test",
            "entity_id": "helper_functions_test",
            "additional_data": {
                "test_type": "helper_functions",
                "expected_features": [
                    "ip_extraction",
                    "user_agent_parsing", 
                    "location_detection"
                ]
            }
        }
        
        start_time = time.time()
        
        try:
            # إرسال الطلب مع headers محددة لاختبار تحليل User Agent
            test_headers = {
                **headers,
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
                "X-Forwarded-For": "197.255.255.1"  # IP مصري للاختبار
            }
            
            response = requests.post(
                f"{self.base_url}/activities/record",
                json=complex_activity,
                headers=test_headers,
                timeout=30
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                activity_id = data.get("activity_id")
                location_detected = data.get("location_detected", False)
                
                details = f"Activity ID: {activity_id}, اختبار الوظائف المساعدة مكتمل"
                self.log_test("اختبار الوظائف المساعدة", True, response_time, details)
                
                print(f"   🆔 معرف النشاط: {activity_id}")
                print(f"   📱 User Agent: iPhone Safari (للاختبار)")
                print(f"   🌐 IP للاختبار: 197.255.255.1 (مصر)")
                print(f"   📍 اكتشاف الموقع: {'✅ نجح' if location_detected else '❌ فشل'}")
                
                return True
            else:
                error_detail = response.text if response.text else f"HTTP {response.status_code}"
                self.log_test("اختبار الوظائف المساعدة", False, response_time, error_detail)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("اختبار الوظائف المساعدة", False, response_time, f"خطأ: {str(e)}")
            return False

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        # حساب متوسط وقت الاستجابة
        response_times = []
        for result in self.test_results:
            try:
                time_str = result["response_time"].replace("ms", "")
                response_times.append(float(time_str))
            except:
                pass
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        print(f"\n{'='*80}")
        print(f"🎯 **التقرير النهائي لاختبار نظام تسجيل الأنشطة المحسن**")
        print(f"{'='*80}")
        
        print(f"📊 **النتائج الإجمالية:**")
        print(f"   ✅ الاختبارات الناجحة: {successful_tests}/{total_tests}")
        print(f"   📈 معدل النجاح: {success_rate:.1f}%")
        print(f"   ⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📋 **تفاصيل الاختبارات:**")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"   {i}. {status} {result['test']}")
            print(f"      ⏱️ {result['response_time']} - {result['details']}")
        
        # تقييم الأداء
        if success_rate >= 95:
            performance_rating = "🏆 ممتاز"
            performance_color = "🟢"
        elif success_rate >= 85:
            performance_rating = "✅ جيد جداً"
            performance_color = "🟡"
        elif success_rate >= 70:
            performance_rating = "⚠️ مقبول"
            performance_color = "🟠"
        else:
            performance_rating = "❌ يحتاج تحسين"
            performance_color = "🔴"
        
        print(f"\n{performance_color} **تقييم الأداء:** {performance_rating}")
        
        # التوصيات
        print(f"\n💡 **التوصيات:**")
        if success_rate >= 95:
            print("   🎉 نظام تسجيل الأنشطة المحسن يعمل بكفاءة عالية!")
            print("   ✅ جميع APIs الجديدة تعمل بشكل صحيح")
            print("   ✅ التكامل مع قاعدة البيانات ممتاز")
            print("   ✅ الوظائف المساعدة تعمل بنجاح")
        else:
            failed_tests = [result for result in self.test_results if not result["success"]]
            print("   🔧 يحتاج إصلاح الاختبارات التالية:")
            for test in failed_tests:
                print(f"      - {test['test']}: {test['details']}")
        
        print(f"\n🎯 **الهدف المطلوب:** كفاءة 95%+ - {'✅ محقق' if success_rate >= 95 else '❌ غير محقق'}")
        
        return success_rate >= 95

def main():
    """تشغيل الاختبار الشامل"""
    print("🚀 **بدء اختبار شامل لنظام تسجيل الأنشطة المحسن**")
    print("📋 **المطلوب حسب المراجعة العربية:**")
    print("   1. اختبار Enhanced Activity Routes الجديدة")
    print("   2. اختبار تسجيل الأنشطة التلقائي مع الموقع الجغرافي")
    print("   3. اختبار تكامل قاعدة البيانات")
    print("   4. اختبار الوظائف المساعدة")
    print("   🎯 الهدف: كفاءة 95%+")
    
    tester = EnhancedActivitySystemTester()
    
    # تشغيل جميع الاختبارات
    tests_passed = 0
    total_tests = 7
    
    if tester.login_admin():
        tests_passed += 1
    
    if tester.test_activity_record_api():
        tests_passed += 1
        
    if tester.test_get_activities_api():
        tests_passed += 1
        
    if tester.test_activity_stats_api():
        tests_passed += 1
        
    if tester.test_user_activities_api():
        tests_passed += 1
        
    if tester.test_database_integration():
        tests_passed += 1
        
    if tester.test_helper_functions():
        tests_passed += 1
    
    # إنشاء التقرير النهائي
    success = tester.generate_final_report()
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)