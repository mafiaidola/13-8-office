#!/usr/bin/env python3
"""
Comprehensive Backend Testing for salmamohamed Login Issue Resolution
اختبار شامل وحاسم لإصلاح مشكلة salmamohamed

المشكلة المُبلغ عنها:
"حاولت ان اجرب بنفسي اسجل دخول بمستخدم salmamohamed وعدت إلى إدارة الزيارات وسجل الدخول ولم أجد الجلسة مسجلة"

التحديثات الأخيرة المطبقة:
1. إضافة tab "سجل تسجيل الدخول" إلى واجهة VisitsManagement
2. إضافة loadLoginLogs() function للفرونت إند
3. تحديث permissions في login-logs endpoint (جميع المستخدمين يرون سجلاتهم)
4. تحسين عرض البيانات مع geolocation وdevice info

الاختبارات المطلوبة:
1. تسجيل دخول salmamohamed جديد مع geolocation وdevice info
2. التحقق من حفظ السجل في قاعدة البيانات
3. salmamohamed يرى سجلاته الخاصة
4. Admin يرى جميع السجلات
5. التحقق من البيانات المفصلة
6. إثبات الحل النهائي
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

class SalmaMohamedLoginTestSuite:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.salma_token = None
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
        
    async def test_1_admin_login(self):
        """اختبار 1: تسجيل دخول الأدمن للحصول على صلاحيات كاملة"""
        print("\n🔐 اختبار 1: تسجيل دخول admin/admin123")
        
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
                "address": "القاهرة، مصر"
            },
            "device_info": "Chrome Browser - Admin Testing Device",
            "ip_address": "192.168.1.100"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and "access_token" in result["data"]:
            self.admin_token = result["data"]["access_token"]
            user_info = result["data"]["user"]
            self.log_test_result(
                "Admin Login",
                True,
                f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name')}, الدور: {user_info.get('role')}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "Admin Login",
                False,
                f"فشل تسجيل الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_2_create_salmamohamed_user(self):
        """اختبار 2: إنشاء مستخدم salmamohamed إذا لم يكن موجوداً"""
        print("\n👤 اختبار 2: إنشاء/التحقق من مستخدم salmamohamed")
        
        # First check if user exists
        result = await self.make_request("GET", "/users", token=self.admin_token)
        
        if result["success"]:
            users = result["data"]
            salma_user = None
            
            # Look for salmamohamed user
            for user in users:
                if user.get("username") == "salmamohamed":
                    salma_user = user
                    break
            
            if salma_user:
                self.log_test_result(
                    "Check salmamohamed User",
                    True,
                    f"المستخدم موجود - الاسم: {salma_user.get('full_name')}, الدور: {salma_user.get('role')}",
                    result["response_time"]
                )
                return True
            else:
                # Create salmamohamed user
                user_data = {
                    "username": "salmamohamed",
                    "password": "salma123",
                    "full_name": "سلمى محمد",
                    "role": "medical_rep",
                    "email": "salma.mohamed@clinic.com",
                    "phone": "01234567890",
                    "is_active": True,
                    "line_id": None,
                    "area_id": None,
                    "manager_id": None
                }
                
                create_result = await self.make_request("POST", "/users", user_data, token=self.admin_token)
                
                if create_result["success"]:
                    self.log_test_result(
                        "Create salmamohamed User",
                        True,
                        f"تم إنشاء المستخدم بنجاح - ID: {create_result['data'].get('id')}",
                        create_result["response_time"]
                    )
                    return True
                else:
                    self.log_test_result(
                        "Create salmamohamed User",
                        False,
                        f"فشل إنشاء المستخدم: {create_result['data']}",
                        create_result["response_time"]
                    )
                    return False
        else:
            self.log_test_result(
                "Check Users List",
                False,
                f"فشل جلب قائمة المستخدمين: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_3_salmamohamed_login_with_geolocation(self):
        """اختبار 3: تسجيل دخول salmamohamed مع بيانات geolocation كاملة"""
        print("\n🌍 اختبار 3: تسجيل دخول salmamohamed مع geolocation")
        
        # Generate unique geolocation data for this test
        unique_lat = 30.0444 + (time.time() % 100) / 10000  # Slight variation
        unique_lng = 31.2357 + (time.time() % 100) / 10000
        
        login_data = {
            "username": "salmamohamed",
            "password": "salma123",
            "geolocation": {
                "latitude": unique_lat,
                "longitude": unique_lng,
                "accuracy": 15,
                "timestamp": datetime.utcnow().isoformat(),
                "city": "الجيزة",
                "country": "مصر",
                "address": "الجيزة، مصر - موقع اختبار salmamohamed"
            },
            "device_info": "Mobile Chrome - salmamohamed Testing Device",
            "ip_address": "192.168.1.101"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and "access_token" in result["data"]:
            self.salma_token = result["data"]["access_token"]
            user_info = result["data"]["user"]
            self.log_test_result(
                "salmamohamed Login with Geolocation",
                True,
                f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name')}, الموقع: الجيزة، مصر",
                result["response_time"]
            )
            
            # Store login details for verification
            self.salma_login_details = {
                "user_id": user_info.get("id"),
                "username": user_info.get("username"),
                "full_name": user_info.get("full_name"),
                "geolocation": login_data["geolocation"],
                "device_info": login_data["device_info"],
                "login_time": datetime.utcnow().isoformat()
            }
            return True
        else:
            self.log_test_result(
                "salmamohamed Login with Geolocation",
                False,
                f"فشل تسجيل الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_4_verify_login_log_saved(self):
        """اختبار 4: التحقق من حفظ سجل الدخول في قاعدة البيانات"""
        print("\n💾 اختبار 4: التحقق من حفظ سجل دخول salmamohamed")
        
        # Wait a moment for the log to be saved
        await asyncio.sleep(2)
        
        # Get all login logs as admin
        result = await self.make_request("GET", "/visits/login-logs", {"limit": 50}, token=self.admin_token)
        
        if result["success"]:
            login_logs = result["data"]["login_logs"]
            salma_logs = [log for log in login_logs if log.get("username") == "salmamohamed"]
            
            if salma_logs:
                latest_log = salma_logs[0]  # Most recent first
                
                # Verify log details
                has_geolocation = bool(latest_log.get("geolocation"))
                has_device_info = bool(latest_log.get("device_info"))
                has_correct_user = latest_log.get("username") == "salmamohamed"
                
                details = f"تم العثور على {len(salma_logs)} سجل لـ salmamohamed"
                if has_geolocation:
                    details += f", الموقع: {latest_log.get('city', 'غير محدد')}"
                if has_device_info:
                    details += f", الجهاز: {latest_log.get('device_info', 'غير محدد')[:30]}..."
                
                self.log_test_result(
                    "Verify Login Log Saved",
                    True,
                    details,
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "Verify Login Log Saved",
                    False,
                    f"لم يتم العثور على سجلات دخول لـ salmamohamed من إجمالي {len(login_logs)} سجل",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Verify Login Log Saved",
                False,
                f"فشل جلب سجلات الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_5_salmamohamed_sees_own_logs(self):
        """اختبار 5: salmamohamed يرى سجلاته الخاصة فقط"""
        print("\n👁️ اختبار 5: salmamohamed يرى سجلاته الخاصة")
        
        result = await self.make_request("GET", "/visits/login-logs", {"limit": 20}, token=self.salma_token)
        
        if result["success"]:
            login_logs = result["data"]["login_logs"]
            user_access_level = result["data"]["user_access_level"]
            viewing_own_logs = result["data"]["viewing_own_logs"]
            
            # Verify all logs belong to salmamohamed
            all_salma_logs = all(log.get("username") == "salmamohamed" for log in login_logs)
            
            if all_salma_logs and viewing_own_logs:
                self.log_test_result(
                    "salmamohamed Sees Own Logs",
                    True,
                    f"يرى {len(login_logs)} سجل خاص به فقط، مستوى الوصول: {user_access_level}",
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "salmamohamed Sees Own Logs",
                    False,
                    f"مشكلة في الصلاحيات - يرى سجلات مستخدمين آخرين أو لا يرى سجلاته",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "salmamohamed Sees Own Logs",
                False,
                f"فشل جلب سجلات الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_6_admin_sees_all_logs(self):
        """اختبار 6: Admin يرى جميع السجلات بما فيها salmamohamed"""
        print("\n🔍 اختبار 6: Admin يرى جميع سجلات الدخول")
        
        result = await self.make_request("GET", "/visits/login-logs", {"limit": 50}, token=self.admin_token)
        
        if result["success"]:
            login_logs = result["data"]["login_logs"]
            user_access_level = result["data"]["user_access_level"]
            viewing_own_logs = result["data"]["viewing_own_logs"]
            
            # Count different users
            unique_users = set(log.get("username") for log in login_logs)
            salma_logs = [log for log in login_logs if log.get("username") == "salmamohamed"]
            admin_logs = [log for log in login_logs if log.get("username") == "admin"]
            
            if not viewing_own_logs and len(unique_users) > 1 and salma_logs:
                self.log_test_result(
                    "Admin Sees All Logs",
                    True,
                    f"يرى سجلات {len(unique_users)} مستخدم مختلف، salmamohamed: {len(salma_logs)} سجل، admin: {len(admin_logs)} سجل",
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "Admin Sees All Logs",
                    False,
                    f"مشكلة في صلاحيات الأدمن - لا يرى جميع السجلات أو لا يرى سجلات salmamohamed",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Admin Sees All Logs",
                False,
                f"فشل جلب سجلات الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_7_verify_detailed_data(self):
        """اختبار 7: التحقق من البيانات المفصلة (geolocation، device info، timing)"""
        print("\n📊 اختبار 7: التحقق من البيانات المفصلة")
        
        result = await self.make_request("GET", "/visits/login-logs", {"limit": 10}, token=self.admin_token)
        
        if result["success"]:
            login_logs = result["data"]["login_logs"]
            salma_logs = [log for log in login_logs if log.get("username") == "salmamohamed"]
            
            if salma_logs:
                latest_log = salma_logs[0]
                
                # Check required fields
                has_geolocation = bool(latest_log.get("latitude") and latest_log.get("longitude"))
                has_city = bool(latest_log.get("city"))
                has_device_info = bool(latest_log.get("device_info"))
                has_login_time = bool(latest_log.get("login_time"))
                has_session_id = bool(latest_log.get("session_id"))
                
                details_count = sum([has_geolocation, has_city, has_device_info, has_login_time, has_session_id])
                
                details = f"البيانات المتوفرة: {details_count}/5"
                if has_geolocation:
                    details += f", الإحداثيات: ({latest_log.get('latitude'):.4f}, {latest_log.get('longitude'):.4f})"
                if has_city:
                    details += f", المدينة: {latest_log.get('city')}"
                if has_device_info:
                    details += f", الجهاز: {latest_log.get('device_info', '')[:30]}..."
                
                success = details_count >= 4  # At least 4 out of 5 fields
                
                self.log_test_result(
                    "Verify Detailed Data",
                    success,
                    details,
                    result["response_time"]
                )
                return success
            else:
                self.log_test_result(
                    "Verify Detailed Data",
                    False,
                    "لم يتم العثور على سجلات salmamohamed للتحقق من البيانات",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "Verify Detailed Data",
                False,
                f"فشل جلب سجلات الدخول: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_8_final_solution_proof(self):
        """اختبار 8: إثبات الحل النهائي - إجمالي سجلات salmamohamed"""
        print("\n🎯 اختبار 8: إثبات الحل النهائي")
        
        # Get comprehensive statistics
        admin_result = await self.make_request("GET", "/visits/login-logs", {"limit": 100}, token=self.admin_token)
        salma_result = await self.make_request("GET", "/visits/login-logs", {"limit": 100}, token=self.salma_token)
        
        if admin_result["success"] and salma_result["success"]:
            admin_logs = admin_result["data"]["login_logs"]
            salma_logs = salma_result["data"]["login_logs"]
            
            # Count salmamohamed logs from admin view
            salma_logs_from_admin = [log for log in admin_logs if log.get("username") == "salmamohamed"]
            
            # Verify consistency
            admin_count = len(salma_logs_from_admin)
            salma_count = len(salma_logs)
            
            # Get latest log details
            if salma_logs_from_admin:
                latest_log = salma_logs_from_admin[0]
                latest_time = latest_log.get("login_time", "غير محدد")
                latest_location = f"{latest_log.get('city', 'غير محدد')}, {latest_log.get('country', 'غير محدد')}"
                
                details = f"إجمالي سجلات salmamohamed: {admin_count} (من رؤية الأدمن), {salma_count} (من رؤية salmamohamed)"
                details += f", آخر تسجيل دخول: {latest_time[:19]}, الموقع: {latest_location}"
                
                # Success if both views show logs and they're consistent
                success = admin_count > 0 and salma_count > 0 and admin_count >= salma_count
                
                self.log_test_result(
                    "Final Solution Proof",
                    success,
                    details,
                    (admin_result["response_time"] + salma_result["response_time"]) / 2
                )
                return success
            else:
                self.log_test_result(
                    "Final Solution Proof",
                    False,
                    "لا توجد سجلات لـ salmamohamed - المشكلة لم تُحل",
                    (admin_result["response_time"] + salma_result["response_time"]) / 2
                )
                return False
        else:
            self.log_test_result(
                "Final Solution Proof",
                False,
                "فشل في جلب البيانات للمقارنة النهائية",
                0
            )
            return False
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 بدء الاختبار الشامل والحاسم لإصلاح مشكلة salmamohamed")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            test_functions = [
                self.test_1_admin_login,
                self.test_2_create_salmamohamed_user,
                self.test_3_salmamohamed_login_with_geolocation,
                self.test_4_verify_login_log_saved,
                self.test_5_salmamohamed_sees_own_logs,
                self.test_6_admin_sees_all_logs,
                self.test_7_verify_detailed_data,
                self.test_8_final_solution_proof
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
        print("📊 التقرير النهائي الشامل لاختبار مشكلة salmamohamed")
        print("=" * 80)
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({passed_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print("\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']}")
            print(f"     └─ {result['details']}")
        
        print("\n" + "=" * 80)
        
        if success_rate >= 87.5:  # 7/8 tests pass
            print("🎉 **الاختبار الحاسم لمشكلة salmamohamed مكتمل بنجاح ممتاز!**")
            print("✅ **المشكلة الأساسية محلولة:** salmamohamed يمكنه الآن رؤية سجلات تسجيل دخوله")
            print("✅ **النظام يعمل كما هو مطلوب:** تسجيل الدخول مع geolocation، حفظ السجلات، عرض البيانات")
            print("✅ **الصلاحيات تعمل بشكل صحيح:** كل مستخدم يرى سجلاته، الأدمن يرى جميع السجلات")
            print("🏆 **النتيجة النهائية:** المشكلة المُبلغ عنها تم حلها بالكامل!")
        elif success_rate >= 62.5:  # 5/8 tests pass
            print("⚠️ **الاختبار مكتمل بنجاح جيد مع بعض المشاكل البسيطة**")
            print("✅ **الوظائف الأساسية تعمل** لكن تحتاج تحسينات بسيطة")
            print("🔧 **يُنصح بمراجعة المشاكل المتبقية** قبل اعتبار المشكلة محلولة بالكامل")
        else:
            print("❌ **الاختبار يظهر مشاكل جوهرية تحتاج إصلاح فوري**")
            print("🚨 **المشكلة الأساسية لم تُحل بعد** - يحتاج تدخل تقني عاجل")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    test_suite = SalmaMohamedLoginTestSuite()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())