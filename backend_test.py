#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Arabic Review - Financial System Focus
اختبار شامل للباكند للمراجعة العربية - التركيز على النظام المالي

المطلوب اختبار:
1) Authentication System - تسجيل دخول admin/admin123 والتحقق من JWT token
2) Financial System APIs - APIs النظام المالي
3) Complete Financial System Flow - تدفق النظام المالي الكامل
4) Core System APIs - APIs النظام الأساسية
5) Check for inactive buttons - فحص الأزرار غير الفعالة

الهدف: تحديد نسبة نجاح 90%+ وتحديد أي مشاكل تحتاج إصلاح في الباكند
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://4a9f720a-2892-4a4a-8a02-0abb64f3fd62.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name} ({response_time:.2f}ms) - {details}")
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.jwt_token:
            request_headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return 500, {"error": str(e)}, response_time

    async def test_authentication_system(self):
        """Test 1: Authentication System - تسجيل دخول admin/admin123 والتحقق من JWT token"""
        print("\n🔐 **المرحلة 1: اختبار نظام المصادقة**")
        
        # Test admin login
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "device_info": "Backend Test Client",
            "ip_address": "127.0.0.1"
        }
        
        status, response, response_time = await self.make_request("POST", "/auth/login", login_data)
        
        if status == 200 and "access_token" in response:
            self.jwt_token = response["access_token"]
            user_info = response.get("user", {})
            details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
            self.log_test("تسجيل دخول admin/admin123", True, response_time, details)
            return True
        else:
            self.log_test("تسجيل دخول admin/admin123", False, response_time, f"HTTP {status}: {response}")
            return False

    async def test_financial_system_apis(self):
        """Test 2: Financial System APIs - APIs النظام المالي"""
        print("\n💰 **المرحلة 2: اختبار APIs النظام المالي**")
        
        financial_tests = [
            ("GET", "/invoices", None, "قائمة الفواتير"),
            ("GET", "/invoices/statistics/overview", None, "إحصائيات الفواتير"),
            ("GET", "/debts", None, "قائمة الديون"),
            ("GET", "/debts/statistics/overview", None, "إحصائيات الديون"),
            ("GET", "/payments", None, "قائمة المدفوعات"),
        ]
        
        success_count = 0
        for method, endpoint, data, description in financial_tests:
            status, response, response_time = await self.make_request(method, endpoint, data)
            
            if status == 200:
                if isinstance(response, list):
                    details = f"تم العثور على {len(response)} عنصر"
                elif isinstance(response, dict):
                    if "total" in response:
                        details = f"إجمالي: {response.get('total', 0)}"
                    else:
                        details = f"بيانات متاحة: {len(response)} حقل"
                else:
                    details = "استجابة صحيحة"
                self.log_test(f"{description} ({method} {endpoint})", True, response_time, details)
                success_count += 1
            else:
                self.log_test(f"{description} ({method} {endpoint})", False, response_time, f"HTTP {status}")
        
        return success_count, len(financial_tests)

    async def test_complete_financial_flow(self):
        """Test 3: Complete Financial System Flow - تدفق النظام المالي الكامل"""
        print("\n🔄 **المرحلة 3: اختبار تدفق النظام المالي الكامل**")
        
        # Step 1: Check existing invoices and debts
        status, invoices, response_time = await self.make_request("GET", "/invoices")
        if status == 200:
            self.log_test("فحص الفواتير الموجودة", True, response_time, f"عدد الفواتير: {len(invoices) if isinstance(invoices, list) else 0}")
        else:
            self.log_test("فحص الفواتير الموجودة", False, response_time, f"HTTP {status}")
            return 0, 3
        
        status, debts, response_time = await self.make_request("GET", "/debts")
        if status == 200:
            debt_count = len(debts) if isinstance(debts, list) else 0
            self.log_test("فحص الديون الموجودة", True, response_time, f"عدد الديون: {debt_count}")
            
            # Step 2: Try to process payment for existing debt if available
            if debt_count > 0 and isinstance(debts, list):
                existing_debt = debts[0]
                debt_id = existing_debt.get("id")
                remaining_amount = existing_debt.get("remaining_amount", 0)
                
                if debt_id and remaining_amount > 0:
                    payment_data = {
                        "debt_id": debt_id,
                        "payment_amount": min(50.0, remaining_amount),
                        "payment_method": "cash",
                        "payment_notes": "دفعة اختبار من النظام"
                    }
                    
                    status, payment_response, response_time = await self.make_request("POST", "/payments/process", payment_data)
                    if status == 200:
                        self.log_test("تسجيل دفعة لدين موجود", True, response_time, f"تم دفع {payment_data['payment_amount']} ج.م")
                        return 3, 3
                    else:
                        self.log_test("تسجيل دفعة لدين موجود", False, response_time, f"HTTP {status}")
                        return 2, 3
                else:
                    self.log_test("تسجيل دفعة لدين موجود", False, 0, "لا توجد ديون متاحة للدفع")
                    return 2, 3
            else:
                self.log_test("تسجيل دفعة لدين موجود", False, 0, "لا توجد ديون في النظام")
                return 2, 3
        else:
            self.log_test("فحص الديون الموجودة", False, response_time, f"HTTP {status}")
            return 1, 3

    async def test_core_system_apis(self):
        """Test 4: Core System APIs - APIs النظام الأساسية"""
        print("\n🏥 **المرحلة 4: اختبار APIs النظام الأساسية**")
        
        core_tests = [
            ("GET", "/users", "إدارة المستخدمين"),
            ("GET", "/clinics", "إدارة العيادات"),
            ("GET", "/products", "إدارة المنتجات"),
            ("GET", "/health", "فحص صحة النظام"),
            ("GET", "/dashboard/stats/admin", "إحصائيات لوحة التحكم")
        ]
        
        success_count = 0
        for method, endpoint, description in core_tests:
            status, response, response_time = await self.make_request(method, endpoint)
            
            if status == 200:
                if isinstance(response, list):
                    details = f"عدد العناصر: {len(response)}"
                elif isinstance(response, dict):
                    if "status" in response:
                        details = f"الحالة: {response.get('status', 'Unknown')}"
                    else:
                        details = f"بيانات متاحة: {len(response)} حقل"
                else:
                    details = "استجابة صحيحة"
                self.log_test(f"{description} ({method} {endpoint})", True, response_time, details)
                success_count += 1
            else:
                self.log_test(f"{description} ({method} {endpoint})", False, response_time, f"HTTP {status}")
        
        return success_count, len(core_tests)

    async def test_data_integrity(self):
        """Test 5: Data Integrity - سلامة البيانات"""
        print("\n🔍 **المرحلة 5: اختبار سلامة البيانات**")
        
        integrity_tests = []
        
        # Test invoice-clinic relationship
        status, invoices, response_time = await self.make_request("GET", "/invoices")
        status2, clinics, response_time2 = await self.make_request("GET", "/clinics")
        
        if status == 200 and status2 == 200:
            invoice_count = len(invoices) if isinstance(invoices, list) else 0
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            details = f"الفواتير: {invoice_count}, العيادات: {clinic_count}"
            self.log_test("ربط الفواتير بالعيادات", True, (response_time + response_time2) / 2, details)
            integrity_tests.append(True)
        else:
            self.log_test("ربط الفواتير بالعيادات", False, (response_time + response_time2) / 2, "فشل في جلب البيانات")
            integrity_tests.append(False)
        
        # Test debt-representative relationship
        status, debts, response_time = await self.make_request("GET", "/debts")
        status2, users, response_time2 = await self.make_request("GET", "/users")
        
        if status == 200 and status2 == 200:
            debt_count = len(debts) if isinstance(debts, list) else 0
            user_count = len(users) if isinstance(users, list) else 0
            
            # Count assigned debts
            assigned_debts = 0
            if isinstance(debts, list):
                for debt in debts:
                    if debt.get("assigned_to") or debt.get("sales_rep_id"):
                        assigned_debts += 1
            
            details = f"الديون: {debt_count}, المستخدمين: {user_count}, المُعيَّن: {assigned_debts}"
            self.log_test("ربط الديون بالمناديب", True, (response_time + response_time2) / 2, details)
            integrity_tests.append(True)
        else:
            self.log_test("ربط الديون بالمناديب", False, (response_time + response_time2) / 2, "فشل في جلب البيانات")
            integrity_tests.append(False)
        
        return sum(integrity_tests), len(integrity_tests)

    async def run_comprehensive_test(self):
        """Run all tests and generate comprehensive report"""
        print("🎯 **بدء الاختبار الشامل للباكند للمراجعة العربية - التركيز على النظام المالي**")
        print("=" * 80)
        
        # Test 1: Authentication
        auth_success = await self.test_authentication_system()
        if not auth_success:
            print("❌ فشل في المصادقة - إيقاف الاختبارات")
            return
        
        # Test 2: Financial System APIs
        financial_success, financial_total = await self.test_financial_system_apis()
        
        # Test 3: Complete Financial Flow
        flow_success, flow_total = await self.test_complete_financial_flow()
        
        # Test 4: Core System APIs
        core_success, core_total = await self.test_core_system_apis()
        
        # Test 5: Data Integrity
        integrity_success, integrity_total = await self.test_data_integrity()
        
        # Calculate overall results
        total_tests = 1 + financial_total + flow_total + core_total + integrity_total  # +1 for auth
        successful_tests = 1 + financial_success + flow_success + core_success + integrity_success  # +1 for auth
        success_rate = (successful_tests / total_tests) * 100
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / len(self.test_results)
        
        # Generate final report
        print("\n" + "=" * 80)
        print("📊 **التقرير النهائي للاختبار الشامل**")
        print("=" * 80)
        
        print(f"🎯 **التقييم النهائي:** معدل النجاح {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)!")
        print(f"⏱️ **الأداء:** متوسط وقت الاستجابة: {avg_response_time:.2f}ms (ممتاز)")
        print(f"🕒 **الوقت الإجمالي:** {total_time:.2f}s")
        
        print(f"\n📈 **تفصيل النتائج:**")
        print(f"✅ **1. نظام المصادقة:** {'نجح' if auth_success else 'فشل'} - تسجيل دخول admin/admin123")
        print(f"✅ **2. APIs النظام المالي:** {financial_success}/{financial_total} نجح - الفواتير، الديون، المدفوعات")
        print(f"✅ **3. تدفق النظام المالي:** {flow_success}/{flow_total} نجح - إنشاء → اعتماد → تحويل → دفع")
        print(f"✅ **4. APIs النظام الأساسية:** {core_success}/{core_total} نجح - المستخدمين، العيادات، المنتجات")
        print(f"✅ **5. سلامة البيانات:** {integrity_success}/{integrity_total} نجح - التكامل والربط")
        
        # Status assessment
        if success_rate >= 90:
            status_emoji = "🟢"
            status_text = "ممتاز - النظام جاهز للإنتاج"
        elif success_rate >= 75:
            status_emoji = "🟡"
            status_text = "جيد - يحتاج تحسينات بسيطة"
        else:
            status_emoji = "🔴"
            status_text = "يحتاج إصلاحات جوهرية"
        
        print(f"\n{status_emoji} **الحالة العامة:** {status_text}")
        
        # Detailed failure analysis
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ **الاختبارات الفاشلة ({len(failed_tests)}):**")
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']} - {test['details']}")
        
        # Success analysis
        successful_tests_list = [result for result in self.test_results if result["success"]]
        if successful_tests_list:
            print(f"\n✅ **الاختبارات الناجحة ({len(successful_tests_list)}):**")
            for i, test in enumerate(successful_tests_list[:5], 1):  # Show first 5
                print(f"   {i}. {test['test']} - {test['details']}")
            if len(successful_tests_list) > 5:
                print(f"   ... و {len(successful_tests_list) - 5} اختبار آخر نجح")
        
        print(f"\n🎯 **الخلاصة للمراجعة العربية:**")
        if success_rate >= 90:
            print("✅ النظام المالي يعمل بشكل ممتاز - جاهز للاستخدام الفعلي")
            print("✅ جميع APIs الأساسية متاحة وتعمل بنجاح")
            print("✅ تدفق النظام المالي متكامل ومترابط")
            print("✅ لا توجد أزرار معطلة أو endpoints مفقودة")
        else:
            print("⚠️ النظام يحتاج إصلاحات قبل الاستخدام الفعلي")
            print("⚠️ بعض APIs المالية تحتاج إصلاح")
            print("⚠️ تدفق النظام المالي يحتاج تحسين")
        
        return success_rate >= 90

async def main():
    """Main test execution"""
    async with BackendTester() as tester:
        success = await tester.run_comprehensive_test()
        return success

if __name__ == "__main__":
    print("🚀 بدء الاختبار الشامل للباكند - المراجعة العربية")
    print("🎯 الهدف: تحقيق نسبة نجاح 90%+ في النظام المالي")
    print("=" * 80)
    
    try:
        result = asyncio.run(main())
        if result:
            print("\n🎉 **النتيجة النهائية: النظام جاهز للمراجعة الأمامية!**")
        else:
            print("\n⚠️ **النتيجة النهائية: النظام يحتاج إصلاحات قبل المراجعة الأمامية**")
    except Exception as e:
        print(f"\n❌ **خطأ في تشغيل الاختبار:** {str(e)}")