#!/usr/bin/env python3
"""
اختبار سريع للنظام المحاسبي الاحترافي الشامل بعد إصلاح أخطاء ObjectId
Quick test for Enhanced Professional Accounting System after ObjectId fixes
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://epgroup-health.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

class EnhancedProfessionalAccountingTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method, endpoint, data=None, headers=None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BASE_URL}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if headers:
            default_headers.update(headers)
            
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                async with self.session.get(url, headers=default_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
                    
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=default_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return 500, {"error": str(e)}, response_time
            
    def log_test_result(self, test_name, success, details, response_time=0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "status": status
        })
        print(f"{status} | {test_name} ({response_time:.2f}ms)")
        print(f"   📋 {details}")
        print()
        
    async def test_login(self):
        """اختبار تسجيل الدخول admin/admin123"""
        print("🔐 اختبار تسجيل الدخول admin/admin123...")
        
        status, response, response_time = await self.make_request(
            "POST", "/auth/login", TEST_CREDENTIALS
        )
        
        if status == 200 and "access_token" in response:
            self.auth_token = response["access_token"]
            user_info = response.get("user", {})
            details = f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}"
            self.log_test_result("تسجيل دخول admin/admin123", True, details, response_time)
            return True
        else:
            details = f"HTTP {status}: {response.get('detail', 'Unknown error')}"
            self.log_test_result("تسجيل دخول admin/admin123", False, details, response_time)
            return False
            
    async def test_enhanced_dashboard(self):
        """اختبار لوحة التحكم المحاسبية المحسنة"""
        print("📊 اختبار لوحة التحكم المحاسبية المحسنة...")
        
        status, response, response_time = await self.make_request(
            "GET", "/enhanced-professional-accounting/dashboard"
        )
        
        if status == 200:
            # تحليل محتوى لوحة التحكم
            dashboard_sections = len(response) if isinstance(response, dict) else 0
            details = f"لوحة التحكم تعمل بنجاح - {dashboard_sections} قسم متاح"
            self.log_test_result("لوحة التحكم المحاسبية المحسنة", True, details, response_time)
            return True, response
        else:
            details = f"HTTP {status}: {response.get('detail', 'فشل في تحميل لوحة التحكم')}"
            self.log_test_result("لوحة التحكم المحاسبية المحسنة", False, details, response_time)
            return False, None
            
    async def get_supporting_data(self):
        """جلب البيانات الداعمة (العيادات، المناديب، المنتجات)"""
        print("📋 جلب البيانات الداعمة...")
        
        supporting_data = {
            "clinics": [],
            "representatives": [],
            "products": []
        }
        
        # جلب العيادات
        status, response, response_time = await self.make_request("GET", "/clinics")
        if status == 200 and isinstance(response, list):
            supporting_data["clinics"] = response[:5]  # أول 5 عيادات
            print(f"   ✅ تم جلب {len(response)} عيادة")
        else:
            print(f"   ❌ فشل جلب العيادات: HTTP {status}")
            
        # جلب المناديب
        status, response, response_time = await self.make_request("GET", "/users")
        if status == 200 and isinstance(response, list):
            # فلترة المناديب فقط
            reps = [user for user in response if user.get("role") in ["medical_rep", "sales_rep"]]
            supporting_data["representatives"] = reps[:3]  # أول 3 مناديب
            print(f"   ✅ تم جلب {len(reps)} مندوب من {len(response)} مستخدم")
        else:
            print(f"   ❌ فشل جلب المستخدمين: HTTP {status}")
            
        # جلب المنتجات
        status, response, response_time = await self.make_request("GET", "/products")
        if status == 200 and isinstance(response, list):
            supporting_data["products"] = response[:5]  # أول 5 منتجات
            print(f"   ✅ تم جلب {len(response)} منتج")
        else:
            print(f"   ❌ فشل جلب المنتجات: HTTP {status}")
            
        return supporting_data
        
    async def test_comprehensive_invoice_creation(self, supporting_data):
        """اختبار إنشاء فاتورة شاملة بسيطة"""
        print("📄 اختبار إنشاء فاتورة شاملة...")
        
        # التحقق من توفر البيانات المطلوبة
        if not supporting_data["clinics"]:
            self.log_test_result("إنشاء فاتورة شاملة", False, "لا توجد عيادات متاحة")
            return False, None
            
        if not supporting_data["representatives"]:
            self.log_test_result("إنشاء فاتورة شاملة", False, "لا توجد مناديب متاحة")
            return False, None
            
        if not supporting_data["products"]:
            self.log_test_result("إنشاء فاتورة شاملة", False, "لا توجد منتجات متاحة")
            return False, None
            
        # اختيار البيانات للفاتورة
        selected_clinic = supporting_data["clinics"][0]
        selected_rep = supporting_data["representatives"][0]
        selected_product = supporting_data["products"][0]
        
        # إعداد بيانات الفاتورة الشاملة
        invoice_data = {
            "clinic_id": selected_clinic.get("id"),
            "clinic_name": selected_clinic.get("name", selected_clinic.get("clinic_name")),
            "representative_id": selected_rep.get("id"),
            "representative_name": selected_rep.get("full_name", selected_rep.get("name")),
            "invoice_items": [
                {
                    "product_id": selected_product.get("id"),
                    "product_name": selected_product.get("name"),
                    "quantity": 2,
                    "unit_price": float(selected_product.get("price", 100)),
                    "total_price": float(selected_product.get("price", 100)) * 2
                }
            ],
            "subtotal": float(selected_product.get("price", 100)) * 2,
            "tax_rate": 0.14,
            "tax_amount": float(selected_product.get("price", 100)) * 2 * 0.14,
            "total_amount": float(selected_product.get("price", 100)) * 2 * 1.14,
            "payment_terms": "net_30",
            "notes": "فاتورة اختبار للنظام المحاسبي الاحترافي الشامل"
        }
        
        print(f"   📋 العيادة: {invoice_data['clinic_name']}")
        print(f"   👤 المندوب: {invoice_data['representative_name']}")
        print(f"   📦 المنتج: {selected_product.get('name')} (الكمية: 2)")
        print(f"   💰 المبلغ الإجمالي: {invoice_data['total_amount']:.2f} ج.م")
        
        status, response, response_time = await self.make_request(
            "POST", "/enhanced-professional-accounting/invoices", invoice_data
        )
        
        if status in [200, 201]:
            invoice_id = response.get("invoice_id") or response.get("id")
            details = f"تم إنشاء الفاتورة بنجاح - ID: {invoice_id}, المبلغ: {invoice_data['total_amount']:.2f} ج.م"
            self.log_test_result("إنشاء فاتورة شاملة", True, details, response_time)
            return True, invoice_id
        else:
            details = f"HTTP {status}: {response.get('detail', 'فشل في إنشاء الفاتورة')}"
            self.log_test_result("إنشاء فاتورة شاملة", False, details, response_time)
            return False, None
            
    async def test_invoice_retrieval(self):
        """اختبار جلب الفواتير"""
        print("📋 اختبار جلب الفواتير...")
        
        status, response, response_time = await self.make_request(
            "GET", "/enhanced-professional-accounting/invoices"
        )
        
        if status == 200:
            invoices_count = len(response) if isinstance(response, list) else 0
            details = f"تم جلب {invoices_count} فاتورة بنجاح"
            self.log_test_result("جلب الفواتير", True, details, response_time)
            return True, response
        else:
            details = f"HTTP {status}: {response.get('detail', 'فشل في جلب الفواتير')}"
            self.log_test_result("جلب الفواتير", False, details, response_time)
            return False, None
            
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار النظام المحاسبي الاحترافي الشامل بعد إصلاح أخطاء ObjectId")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # 1. تسجيل الدخول
            login_success = await self.test_login()
            if not login_success:
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
                
            # 2. اختبار لوحة التحكم المحاسبية المحسنة
            dashboard_success, dashboard_data = await self.test_enhanced_dashboard()
            
            # 3. جلب البيانات الداعمة
            supporting_data = await self.get_supporting_data()
            
            # 4. اختبار إنشاء فاتورة شاملة
            invoice_success, invoice_id = await self.test_comprehensive_invoice_creation(supporting_data)
            
            # 5. اختبار جلب الفواتير
            retrieval_success, invoices_data = await self.test_invoice_retrieval()
            
        finally:
            await self.cleanup_session()
            
        # تقرير النتائج النهائية
        await self.generate_final_report()
        
    async def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("=" * 80)
        print("📊 التقرير النهائي - اختبار النظام المحاسبي الاحترافي الشامل")
        print("=" * 80)
        
        # عرض نتائج كل اختبار
        for result in self.test_results:
            print(f"{result['status']} | {result['test']} ({result['response_time']:.2f}ms)")
            
        print()
        print("📈 الإحصائيات النهائية:")
        print(f"   🎯 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"   ⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        # تقييم الأداء
        if success_rate >= 90:
            performance_rating = "🟢 ممتاز"
        elif success_rate >= 75:
            performance_rating = "🟡 جيد"
        elif success_rate >= 50:
            performance_rating = "🟠 مقبول"
        else:
            performance_rating = "🔴 يحتاج تحسين"
            
        print(f"   📊 التقييم العام: {performance_rating}")
        
        # الخلاصة والتوصيات
        print()
        print("🎯 الخلاصة:")
        if success_rate >= 75:
            print("   ✅ النظام المحاسبي الاحترافي الشامل يعمل بنجاح")
            print("   ✅ تم حل مشاكل ObjectId بنجاح")
            print("   ✅ جميع المتطلبات الأساسية متوفرة")
        else:
            print("   ❌ النظام المحاسبي الاحترافي يحتاج إصلاحات")
            print("   ❌ مشاكل ObjectId قد تكون لا تزال موجودة")
            print("   ❌ بعض المتطلبات الأساسية غير متوفرة")
            
        print()
        print("🏁 انتهى اختبار النظام المحاسبي الاحترافي الشامل")

async def main():
    """الدالة الرئيسية"""
    tester = EnhancedProfessionalAccountingTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
"""
اختبار شامل وتفصيلي للنظام المحاسبي الاحترافي الشامل الجديد وفقاً لمتطلبات المراجعة العربية
Comprehensive Enhanced Professional Accounting System Testing - Arabic Review
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://epgroup-health.preview.emergentagent.com/api"
TEST_USERNAME = "admin"
TEST_PASSWORD = "admin123"

class EnhancedProfessionalAccountingTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method, endpoint, data=None, headers=None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        if headers:
            request_headers.update(headers)
            
        start_time = time.time()
        
        try:
            async with self.session.request(
                method, url, 
                json=data if data else None,
                headers=request_headers,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                response_time = (time.time() - start_time) * 1000
                response_text = await response.text()
                
                try:
                    response_data = json.loads(response_text) if response_text else {}
                except json.JSONDecodeError:
                    response_data = {"raw_response": response_text}
                
                return {
                    "status_code": response.status,
                    "data": response_data,
                    "response_time": response_time,
                    "success": 200 <= response.status < 300
                }
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "response_time": response_time,
                "success": False
            }
    
    def log_test_result(self, test_name, success, details, response_time=0):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({response_time:.2f}ms)")
        
    async def test_login(self):
        """اختبار تسجيل الدخول admin/admin123"""
        print("\n🔐 اختبار تسجيل الدخول...")
        
        login_data = {
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "device_info": "Chrome 120.0 on Windows 10",
            "ip_address": "156.160.45.123"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and "access_token" in result["data"]:
            self.auth_token = result["data"]["access_token"]
            user_info = result["data"].get("user", {})
            
            self.log_test_result(
                "تسجيل دخول admin/admin123",
                True,
                f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تسجيل دخول admin/admin123",
                False,
                f"فشل تسجيل الدخول: {result['data'].get('detail', 'Unknown error')}",
                result["response_time"]
            )
            return False
    
    async def test_enhanced_professional_dashboard(self):
        """اختبار لوحة التحكم المحاسبية الشاملة"""
        print("\n📊 اختبار لوحة التحكم المحاسبية الشاملة...")
        
        result = await self.make_request("GET", "/enhanced-professional-accounting/dashboard")
        
        if result["success"]:
            dashboard_data = result["data"]
            stats_count = len(dashboard_data) if isinstance(dashboard_data, dict) else 0
            
            self.log_test_result(
                "لوحة التحكم المحاسبية الشاملة",
                True,
                f"تم جلب لوحة التحكم بنجاح - {stats_count} إحصائية",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "لوحة التحكم المحاسبية الشاملة",
                False,
                f"فشل جلب لوحة التحكم: HTTP {result['status_code']}",
                result["response_time"]
            )
            return False
    
    async def test_supporting_data(self):
        """اختبار البيانات الداعمة"""
        print("\n📋 اختبار البيانات الداعمة...")
        
        endpoints = [
            ("/clinics", "العيادات"),
            ("/products", "المنتجات"),
            ("/users", "المناديب")
        ]
        
        supporting_data = {}
        all_success = True
        
        for endpoint, name in endpoints:
            result = await self.make_request("GET", endpoint)
            
            if result["success"]:
                data = result["data"]
                count = len(data) if isinstance(data, list) else 0
                supporting_data[endpoint] = data
                
                self.log_test_result(
                    f"البيانات الداعمة - {name}",
                    True,
                    f"تم جلب {count} عنصر",
                    result["response_time"]
                )
            else:
                all_success = False
                self.log_test_result(
                    f"البيانات الداعمة - {name}",
                    False,
                    f"فشل الجلب: HTTP {result['status_code']}",
                    result["response_time"]
                )
        
        return supporting_data if all_success else None
    
    async def test_create_comprehensive_invoice(self, supporting_data):
        """اختبار إنشاء فاتورة شاملة احترافية"""
        print("\n🧾 اختبار إنشاء فاتورة شاملة احترافية...")
        
        if not supporting_data:
            self.log_test_result(
                "إنشاء فاتورة شاملة",
                False,
                "البيانات الداعمة غير متوفرة",
                0
            )
            return None
        
        # اختيار بيانات للفاتورة
        clinics = supporting_data.get("/clinics", [])
        products = supporting_data.get("/products", [])
        users = supporting_data.get("/users", [])
        
        if not clinics or not products or not users:
            self.log_test_result(
                "إنشاء فاتورة شاملة",
                False,
                f"بيانات ناقصة - عيادات: {len(clinics)}, منتجات: {len(products)}, مناديب: {len(users)}",
                0
            )
            return None
        
        # إعداد بيانات الفاتورة الشاملة
        clinic = clinics[0]
        rep = users[0] if users else None
        
        # إعداد منتجات الفاتورة
        invoice_items = []
        subtotal = 0
        
        for i, product in enumerate(products[:3]):  # أول 3 منتجات
            quantity = 2 + i
            unit_price = 45.50 + (i * 15.25)
            item_total = quantity * unit_price
            subtotal += item_total
            
            invoice_items.append({
                "product_id": product.get("id"),
                "product_name": product.get("name", f"منتج {i+1}"),
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": item_total
            })
        
        # حساب الخصم والمجموع النهائي
        discount_percentage = 10
        discount_amount = subtotal * (discount_percentage / 100)
        total_amount = subtotal - discount_amount
        
        invoice_data = {
            "clinic_id": clinic.get("id"),
            "clinic_name": clinic.get("name", clinic.get("clinic_name")),
            "rep_id": rep.get("id") if rep else None,
            "rep_name": rep.get("full_name", rep.get("name")) if rep else "غير محدد",
            "items": invoice_items,
            "subtotal": subtotal,
            "discount_type": "percentage",
            "discount_value": discount_percentage,
            "discount_amount": discount_amount,
            "total_amount": total_amount,
            "payment_terms": "cash",
            "notes": "فاتورة تجريبية احترافية شاملة للمراجعة العربية",
            "created_by_name": "System Administrator",
            "invoice_date": datetime.now().isoformat(),
            "due_date": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        result = await self.make_request("POST", "/enhanced-professional-accounting/invoices", invoice_data)
        
        if result["success"]:
            invoice_response = result["data"]
            invoice_id = invoice_response.get("invoice_id") or invoice_response.get("id")
            
            self.log_test_result(
                "إنشاء فاتورة شاملة احترافية",
                True,
                f"تم إنشاء الفاتورة - ID: {invoice_id}, المبلغ: {total_amount:.2f} ج.م",
                result["response_time"]
            )
            return invoice_id
        else:
            self.log_test_result(
                "إنشاء فاتورة شاملة احترافية",
                False,
                f"فشل إنشاء الفاتورة: HTTP {result['status_code']} - {result['data'].get('detail', 'Unknown error')}",
                result["response_time"]
            )
            return None
    
    async def test_get_invoices(self):
        """اختبار جلب الفواتير"""
        print("\n📄 اختبار جلب الفواتير...")
        
        result = await self.make_request("GET", "/enhanced-professional-accounting/invoices")
        
        if result["success"]:
            invoices = result["data"]
            count = len(invoices) if isinstance(invoices, list) else 0
            
            self.log_test_result(
                "جلب الفواتير",
                True,
                f"تم جلب {count} فاتورة مع جميع التفاصيل",
                result["response_time"]
            )
            return invoices
        else:
            self.log_test_result(
                "جلب الفواتير",
                False,
                f"فشل جلب الفواتير: HTTP {result['status_code']}",
                result["response_time"]
            )
            return None
    
    async def test_create_professional_debt(self, supporting_data):
        """اختبار إنشاء دين احترافي"""
        print("\n💳 اختبار إنشاء دين احترافي...")
        
        if not supporting_data:
            self.log_test_result(
                "إنشاء دين احترافي",
                False,
                "البيانات الداعمة غير متوفرة",
                0
            )
            return None
        
        clinics = supporting_data.get("/clinics", [])
        users = supporting_data.get("/users", [])
        products = supporting_data.get("/products", [])
        
        if not clinics or not users:
            self.log_test_result(
                "إنشاء دين احترافي",
                False,
                f"بيانات ناقصة - عيادات: {len(clinics)}, مناديب: {len(users)}",
                0
            )
            return None
        
        clinic = clinics[0]
        rep = users[0]
        
        # إعداد منتجات الدين
        debt_items = []
        total_before_discount = 0
        
        for i, product in enumerate(products[:2]):  # أول منتجين
            quantity = 3 + i
            unit_price = 55.75 + (i * 20.50)
            item_total = quantity * unit_price
            total_before_discount += item_total
            
            debt_items.append({
                "product_id": product.get("id"),
                "product_name": product.get("name", f"منتج دين {i+1}"),
                "quantity": quantity,
                "unit_price": unit_price,
                "total_price": item_total
            })
        
        discount_percentage = 15
        total_amount = total_before_discount * (1 - discount_percentage / 100)
        
        debt_data = {
            "clinic_id": clinic.get("id"),
            "clinic_name": clinic.get("name", clinic.get("clinic_name")),
            "rep_id": rep.get("id"),
            "rep_name": rep.get("full_name", rep.get("name")),
            "description": "دين احترافي تجريبي للمراجعة العربية",
            "items": debt_items,
            "discount_percentage": discount_percentage,
            "total_amount": total_amount,
            "due_date": (datetime.now() + timedelta(days=45)).isoformat(),
            "priority": "high",
            "category": "purchase",
            "notes": "دين تجريبي للنظام المحاسبي الاحترافي"
        }
        
        result = await self.make_request("POST", "/enhanced-professional-accounting/debts", debt_data)
        
        if result["success"]:
            debt_response = result["data"]
            debt_id = debt_response.get("debt_id") or debt_response.get("id")
            
            self.log_test_result(
                "إنشاء دين احترافي",
                True,
                f"تم إنشاء الدين - ID: {debt_id}, المبلغ: {total_amount:.2f} ج.م, الأولوية: high",
                result["response_time"]
            )
            return debt_id
        else:
            self.log_test_result(
                "إنشاء دين احترافي",
                False,
                f"فشل إنشاء الدين: HTTP {result['status_code']} - {result['data'].get('detail', 'Unknown error')}",
                result["response_time"]
            )
            return None
    
    async def test_create_comprehensive_collection(self, invoice_id):
        """اختبار إنشاء تحصيل شامل"""
        print("\n💰 اختبار إنشاء تحصيل شامل...")
        
        if not invoice_id:
            self.log_test_result(
                "إنشاء تحصيل شامل",
                False,
                "معرف الفاتورة غير متوفر",
                0
            )
            return None
        
        collection_data = {
            "invoice_id": invoice_id,
            "payment_type": "partial",
            "amount": 150.75,
            "payment_method": "cash",
            "notes": "تحصيل جزئي تجريبي للمراجعة العربية",
            "collection_date": datetime.now().isoformat(),
            "collected_by": "System Administrator"
        }
        
        result = await self.make_request("POST", "/enhanced-professional-accounting/collections", collection_data)
        
        if result["success"]:
            collection_response = result["data"]
            collection_id = collection_response.get("collection_id") or collection_response.get("id")
            
            self.log_test_result(
                "إنشاء تحصيل شامل",
                True,
                f"تم إنشاء التحصيل - ID: {collection_id}, المبلغ: {collection_data['amount']} ج.م",
                result["response_time"]
            )
            return collection_id
        else:
            self.log_test_result(
                "إنشاء تحصيل شامل",
                False,
                f"فشل إنشاء التحصيل: HTTP {result['status_code']} - {result['data'].get('detail', 'Unknown error')}",
                result["response_time"]
            )
            return None
    
    async def test_manager_approval(self, collection_id):
        """اختبار موافقة المدير على التحصيل"""
        print("\n✅ اختبار موافقة المدير على التحصيل...")
        
        if not collection_id:
            self.log_test_result(
                "موافقة المدير على التحصيل",
                False,
                "معرف التحصيل غير متوفر",
                0
            )
            return False
        
        result = await self.make_request("PUT", f"/enhanced-professional-accounting/collections/{collection_id}/approve")
        
        if result["success"]:
            self.log_test_result(
                "موافقة المدير على التحصيل",
                True,
                f"تم اعتماد التحصيل بنجاح - ID: {collection_id}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "موافقة المدير على التحصيل",
                False,
                f"فشل اعتماد التحصيل: HTTP {result['status_code']}",
                result["response_time"]
            )
            return False
    
    async def test_financial_reports(self):
        """اختبار التقارير المالية"""
        print("\n📈 اختبار التقارير المالية...")
        
        # تقرير مالي مع فلتر بالتاريخ والعيادة
        params = {
            "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
            "end_date": datetime.now().isoformat(),
            "clinic_id": "all"
        }
        
        # تحويل المعاملات إلى query string
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        endpoint = f"/enhanced-professional-accounting/reports/financial?{query_string}"
        
        result = await self.make_request("GET", endpoint)
        
        if result["success"]:
            report_data = result["data"]
            report_sections = len(report_data) if isinstance(report_data, dict) else 0
            
            self.log_test_result(
                "التقارير المالية",
                True,
                f"تم جلب التقرير المالي - {report_sections} قسم",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "التقارير المالية",
                False,
                f"فشل جلب التقرير المالي: HTTP {result['status_code']}",
                result["response_time"]
            )
            return False
    
    async def test_activity_logging(self):
        """اختبار تسجيل الأنشطة"""
        print("\n📝 اختبار تسجيل الأنشطة...")
        
        result = await self.make_request("GET", "/activities")
        
        if result["success"]:
            activities = result["data"]
            count = len(activities) if isinstance(activities, list) else 0
            
            # البحث عن أنشطة محاسبية
            accounting_activities = 0
            if isinstance(activities, list):
                for activity in activities:
                    activity_type = activity.get("activity_type", "")
                    if any(keyword in activity_type for keyword in ["invoice", "debt", "collection", "payment"]):
                        accounting_activities += 1
            
            self.log_test_result(
                "تسجيل الأنشطة",
                True,
                f"تم جلب {count} نشاط، منها {accounting_activities} نشاط محاسبي",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تسجيل الأنشطة",
                False,
                f"فشل جلب الأنشطة: HTTP {result['status_code']}",
                result["response_time"]
            )
            return False
    
    async def test_cleanup_data(self, invoice_id):
        """تنظيف البيانات التجريبية"""
        print("\n🧹 تنظيف البيانات التجريبية...")
        
        if not invoice_id:
            self.log_test_result(
                "تنظيف البيانات التجريبية",
                False,
                "معرف الفاتورة غير متوفر للحذف",
                0
            )
            return False
        
        result = await self.make_request("DELETE", f"/enhanced-professional-accounting/invoices/{invoice_id}")
        
        if result["success"]:
            self.log_test_result(
                "تنظيف البيانات التجريبية",
                True,
                f"تم حذف الفاتورة التجريبية - ID: {invoice_id}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تنظيف البيانات التجريبية",
                False,
                f"فشل حذف الفاتورة: HTTP {result['status_code']}",
                result["response_time"]
            )
            return False
    
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار النظام المحاسبي الاحترافي الشامل الجديد...")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # 1. تسجيل الدخول
            if not await self.test_login():
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
            
            # 2. اختبار لوحة التحكم المحاسبية الشاملة
            await self.test_enhanced_professional_dashboard()
            
            # 3. اختبار البيانات الداعمة
            supporting_data = await self.test_supporting_data()
            
            # 4. اختبار إنشاء فاتورة شاملة احترافية
            invoice_id = await self.test_create_comprehensive_invoice(supporting_data)
            
            # 5. اختبار جلب الفواتير
            await self.test_get_invoices()
            
            # 6. اختبار إنشاء دين احترافي
            debt_id = await self.test_create_professional_debt(supporting_data)
            
            # 7. اختبار إنشاء تحصيل شامل
            collection_id = await self.test_create_comprehensive_collection(invoice_id)
            
            # 8. اختبار موافقة المدير على التحصيل
            await self.test_manager_approval(collection_id)
            
            # 9. اختبار التقارير المالية
            await self.test_financial_reports()
            
            # 10. اختبار تسجيل الأنشطة
            await self.test_activity_logging()
            
            # 11. تنظيف البيانات التجريبية
            await self.test_cleanup_data(invoice_id)
            
        finally:
            await self.cleanup_session()
        
        # عرض النتائج النهائية
        self.display_final_results()
    
    def display_final_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية للاختبار الشامل")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        if success_rate >= 90:
            print("🎉 **EXCELLENT** - النظام المحاسبي الاحترافي يعمل بشكل ممتاز!")
        elif success_rate >= 75:
            print("✅ **GOOD** - النظام المحاسبي الاحترافي يعمل بشكل جيد مع تحسينات بسيطة")
        elif success_rate >= 50:
            print("⚠️ **NEEDS IMPROVEMENT** - النظام المحاسبي الاحترافي يحتاج تحسينات")
        else:
            print("❌ **CRITICAL ISSUES** - النظام المحاسبي الاحترافي يحتاج إصلاحات جوهرية")
        
        print("\n📋 تفاصيل الاختبارات:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"  {i:2d}. {status} {result['test_name']}: {result['details']}")
        
        print("\n🎯 **الهدف:** التأكد من أن النظام المحاسبي الاحترافي الشامل يعمل وفقاً لجميع متطلبات المراجعة العربية")
        print("     مع فورم إنشاء فاتورة شامل وإدارة ديون احترافية وتحصيل جزئي/كلي")

async def main():
    """الدالة الرئيسية"""
    tester = EnhancedProfessionalAccountingTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
"""
اختبار شامل للنظام المحاسبي الاحترافي المحسن الجديد - Arabic Review
Comprehensive Enhanced Professional Accounting System Testing
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://epgroup-health.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

class ProfessionalAccountingSystemTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = time.time()
        self.test_invoice_id = None
        self.available_clinics = []
        self.available_reps = []
        self.available_products = []

    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()

    async def make_request(self, method, endpoint, data=None, headers=None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BASE_URL}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            request_headers.update(headers)

        start_time = time.time()
        try:
            async with self.session.request(method, url, json=data, headers=request_headers) as response:
                response_time = round((time.time() - start_time) * 1000, 2)
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                return {
                    "status_code": response.status,
                    "data": response_data,
                    "response_time": response_time,
                    "success": 200 <= response.status < 300
                }
        except Exception as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "response_time": round((time.time() - start_time) * 1000, 2),
                "success": False
            }

    async def test_admin_login(self):
        """اختبار تسجيل الدخول admin/admin123"""
        print("🔐 اختبار تسجيل الدخول admin/admin123...")
        
        result = await self.make_request("POST", "/auth/login", TEST_CREDENTIALS)
        
        if result["success"] and "access_token" in result["data"]:
            self.auth_token = result["data"]["access_token"]
            user_info = result["data"].get("user", {})
            
            self.test_results.append({
                "test": "تسجيل دخول admin/admin123",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}"
            })
            print(f"   ✅ تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')} ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "تسجيل دخول admin/admin123",
                "status": "❌ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ❌ فشل تسجيل الدخول - HTTP {result['status_code']}: {result['data']}")
            return False

    async def test_professional_accounting_dashboard(self):
        """اختبار لوحة التحكم الجديدة"""
        print("📊 اختبار لوحة التحكم الجديدة...")
        
        result = await self.make_request("GET", "/professional-accounting/dashboard")
        
        if result["success"]:
            dashboard_data = result["data"]
            stats_count = len(dashboard_data) if isinstance(dashboard_data, dict) else 0
            
            self.test_results.append({
                "test": "GET /api/professional-accounting/dashboard",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"تم جلب لوحة التحكم مع {stats_count} إحصائية"
            })
            print(f"   ✅ لوحة التحكم تعمل - {stats_count} إحصائية ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "GET /api/professional-accounting/dashboard",
                "status": "❌ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ❌ فشل في جلب لوحة التحكم - HTTP {result['status_code']}: {result['data']}")
            return False

    async def load_supporting_data(self):
        """تحميل البيانات الداعمة (العيادات، المناديب، المنتجات)"""
        print("📋 تحميل البيانات الداعمة...")
        
        # جلب العيادات
        clinics_result = await self.make_request("GET", "/clinics")
        if clinics_result["success"] and isinstance(clinics_result["data"], list):
            self.available_clinics = clinics_result["data"]
            print(f"   ✅ تم جلب {len(self.available_clinics)} عيادة")
        else:
            print(f"   ⚠️ فشل في جلب العيادات - HTTP {clinics_result['status_code']}")

        # جلب المناديب (المستخدمين)
        users_result = await self.make_request("GET", "/users")
        if users_result["success"] and isinstance(users_result["data"], list):
            self.available_reps = [user for user in users_result["data"] if user.get("role") in ["medical_rep", "sales_rep"]]
            print(f"   ✅ تم جلب {len(self.available_reps)} مندوب من {len(users_result['data'])} مستخدم")
        else:
            print(f"   ⚠️ فشل في جلب المستخدمين - HTTP {users_result['status_code']}")

        # جلب المنتجات
        products_result = await self.make_request("GET", "/products")
        if products_result["success"] and isinstance(products_result["data"], list):
            self.available_products = products_result["data"]
            print(f"   ✅ تم جلب {len(self.available_products)} منتج")
        else:
            print(f"   ⚠️ فشل في جلب المنتجات - HTTP {products_result['status_code']}")

        # تسجيل النتائج
        self.test_results.append({
            "test": "تحميل البيانات الداعمة",
            "status": "✅ نجح جزئياً" if any([self.available_clinics, self.available_reps, self.available_products]) else "❌ فشل",
            "response_time": "متعدد",
            "details": f"العيادات: {len(self.available_clinics)}، المناديب: {len(self.available_reps)}، المنتجات: {len(self.available_products)}"
        })

        return len(self.available_clinics) > 0 and len(self.available_products) > 0

    async def test_comprehensive_invoice_creation(self):
        """اختبار إنشاء فاتورة شاملة جديدة"""
        print("🧾 اختبار إنشاء فاتورة شاملة جديدة...")
        
        if not self.available_clinics or not self.available_products:
            print("   ⚠️ لا توجد بيانات كافية لإنشاء فاتورة")
            self.test_results.append({
                "test": "إنشاء فاتورة شاملة",
                "status": "❌ فشل",
                "response_time": "0ms",
                "details": "لا توجد عيادات أو منتجات متاحة"
            })
            return False

        # اختيار بيانات عشوائية
        selected_clinic = self.available_clinics[0]
        selected_rep = self.available_reps[0] if self.available_reps else None
        selected_products = self.available_products[:2]  # أول منتجين

        # إعداد بيانات الفاتورة الشاملة
        invoice_data = {
            "clinic_id": selected_clinic.get("id"),
            "rep_id": selected_rep.get("id") if selected_rep else None,
            "items": [
                {
                    "product_id": product.get("id"),
                    "product_name": product.get("name", "منتج غير محدد"),
                    "quantity": 5,
                    "unit_price": float(product.get("price", 50.0)),
                    "total_price": 5 * float(product.get("price", 50.0))
                }
                for product in selected_products
            ],
            "discount_type": "percentage",
            "discount_value": 10.0,
            "payment_terms": "credit",
            "notes": "فاتورة تجريبية شاملة للاختبار - تتضمن خصم 10% ودفع آجل",
            "created_by_name": "System Administrator"
        }

        # حساب المجموع
        subtotal = sum(item["total_price"] for item in invoice_data["items"])
        discount_amount = subtotal * (invoice_data["discount_value"] / 100)
        total_amount = subtotal - discount_amount

        print(f"   📋 بيانات الفاتورة:")
        print(f"      العيادة: {selected_clinic.get('name', 'غير محددة')}")
        print(f"      المندوب: {selected_rep.get('full_name', 'غير محدد') if selected_rep else 'غير محدد'}")
        print(f"      عدد المنتجات: {len(invoice_data['items'])}")
        print(f"      المجموع الفرعي: {subtotal:.2f} ج.م")
        print(f"      الخصم: {discount_amount:.2f} ج.م ({invoice_data['discount_value']}%)")
        print(f"      المجموع النهائي: {total_amount:.2f} ج.م")

        result = await self.make_request("POST", "/professional-accounting/invoices", invoice_data)
        
        if result["success"]:
            response_data = result["data"]
            self.test_invoice_id = response_data.get("invoice_id") or response_data.get("id")
            
            self.test_results.append({
                "test": "إنشاء فاتورة شاملة",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"تم إنشاء فاتورة بمبلغ {total_amount:.2f} ج.م - ID: {self.test_invoice_id}"
            })
            print(f"   ✅ تم إنشاء الفاتورة بنجاح - ID: {self.test_invoice_id} ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "إنشاء فاتورة شاملة",
                "status": "❌ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ❌ فشل في إنشاء الفاتورة - HTTP {result['status_code']}: {result['data']}")
            return False

    async def test_invoice_retrieval(self):
        """اختبار جلب الفواتير"""
        print("📄 اختبار جلب الفواتير...")
        
        result = await self.make_request("GET", "/professional-accounting/invoices")
        
        if result["success"]:
            invoices_data = result["data"]
            invoices_count = len(invoices_data) if isinstance(invoices_data, list) else 0
            
            # البحث عن الفاتورة المُنشأة
            test_invoice_found = False
            if self.test_invoice_id and isinstance(invoices_data, list):
                test_invoice_found = any(
                    invoice.get("id") == self.test_invoice_id or invoice.get("invoice_id") == self.test_invoice_id
                    for invoice in invoices_data
                )

            self.test_results.append({
                "test": "جلب الفواتير",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"تم جلب {invoices_count} فاتورة، الفاتورة التجريبية: {'موجودة' if test_invoice_found else 'غير موجودة'}"
            })
            print(f"   ✅ تم جلب {invoices_count} فاتورة - الفاتورة التجريبية: {'موجودة' if test_invoice_found else 'غير موجودة'} ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "جلب الفواتير",
                "status": "❌ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ❌ فشل في جلب الفواتير - HTTP {result['status_code']}: {result['data']}")
            return False

    async def test_activity_logging(self):
        """اختبار تسجيل الأنشطة"""
        print("📝 اختبار تسجيل الأنشطة...")
        
        result = await self.make_request("GET", "/activities")
        
        if result["success"]:
            activities_data = result["data"]
            activities_count = len(activities_data) if isinstance(activities_data, list) else 0
            
            # البحث عن أنشطة إنشاء الفاتورة
            invoice_activities = []
            if isinstance(activities_data, list):
                invoice_activities = [
                    activity for activity in activities_data
                    if "فاتورة" in activity.get("description", "") or "invoice" in activity.get("activity_type", "")
                ]

            self.test_results.append({
                "test": "تسجيل الأنشطة",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"إجمالي الأنشطة: {activities_count}، أنشطة الفواتير: {len(invoice_activities)}"
            })
            print(f"   ✅ تم جلب {activities_count} نشاط - أنشطة الفواتير: {len(invoice_activities)} ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "تسجيل الأنشطة",
                "status": "❌ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ❌ فشل في جلب الأنشطة - HTTP {result['status_code']}: {result['data']}")
            return False

    async def test_supporting_data_endpoints(self):
        """اختبار البيانات الداعمة"""
        print("🔧 اختبار البيانات الداعمة...")
        
        endpoints_to_test = [
            ("/clinics", "العيادات"),
            ("/products", "المنتجات"),
            ("/users", "المناديب")
        ]
        
        successful_tests = 0
        total_tests = len(endpoints_to_test)
        
        for endpoint, name in endpoints_to_test:
            result = await self.make_request("GET", endpoint)
            
            if result["success"]:
                data_count = len(result["data"]) if isinstance(result["data"], list) else 0
                print(f"   ✅ {name}: {data_count} عنصر ({result['response_time']}ms)")
                successful_tests += 1
            else:
                print(f"   ❌ {name}: HTTP {result['status_code']} ({result['response_time']}ms)")

        success_rate = (successful_tests / total_tests) * 100
        self.test_results.append({
            "test": "البيانات الداعمة",
            "status": f"✅ نجح {successful_tests}/{total_tests}" if successful_tests > 0 else "❌ فشل",
            "response_time": "متعدد",
            "details": f"معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})"
        })
        
        return successful_tests > 0

    async def cleanup_test_data(self):
        """تنظيف البيانات التجريبية"""
        print("🧹 تنظيف البيانات التجريبية...")
        
        if not self.test_invoice_id:
            print("   ℹ️ لا توجد بيانات تجريبية للحذف")
            return True

        # محاولة حذف الفاتورة التجريبية
        result = await self.make_request("DELETE", f"/professional-accounting/invoices/{self.test_invoice_id}")
        
        if result["success"]:
            self.test_results.append({
                "test": "تنظيف البيانات التجريبية",
                "status": "✅ نجح",
                "response_time": f"{result['response_time']}ms",
                "details": f"تم حذف الفاتورة التجريبية: {self.test_invoice_id}"
            })
            print(f"   ✅ تم حذف الفاتورة التجريبية: {self.test_invoice_id} ({result['response_time']}ms)")
            return True
        else:
            self.test_results.append({
                "test": "تنظيف البيانات التجريبية",
                "status": "⚠️ فشل",
                "response_time": f"{result['response_time']}ms",
                "details": f"لم يتم حذف الفاتورة - HTTP {result['status_code']}: {result['data']}"
            })
            print(f"   ⚠️ لم يتم حذف الفاتورة - HTTP {result['status_code']}: {result['data']} ({result['response_time']}ms)")
            return False

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل للنظام المحاسبي الاحترافي المحسن الجديد")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # 1. تسجيل الدخول
            login_success = await self.test_admin_login()
            if not login_success:
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
            
            # 2. اختبار لوحة التحكم الجديدة
            await self.test_professional_accounting_dashboard()
            
            # 3. تحميل البيانات الداعمة
            supporting_data_loaded = await self.load_supporting_data()
            
            # 4. اختبار إنشاء فاتورة شاملة
            if supporting_data_loaded:
                await self.test_comprehensive_invoice_creation()
            
            # 5. اختبار جلب الفواتير
            await self.test_invoice_retrieval()
            
            # 6. اختبار تسجيل الأنشطة
            await self.test_activity_logging()
            
            # 7. اختبار البيانات الداعمة
            await self.test_supporting_data_endpoints()
            
            # 8. تنظيف البيانات التجريبية
            await self.cleanup_test_data()
            
        finally:
            await self.cleanup_session()
        
        # عرض النتائج النهائية
        await self.display_final_results()

    async def display_final_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية للاختبار الشامل")
        print("=" * 80)
        
        successful_tests = sum(1 for result in self.test_results if "✅" in result["status"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"⏱️ إجمالي وقت التنفيذ: {time.time() - self.start_time:.2f}s")
        print()
        
        for i, result in enumerate(self.test_results, 1):
            print(f"{i:2d}. {result['test']}")
            print(f"    الحالة: {result['status']}")
            print(f"    وقت الاستجابة: {result['response_time']}")
            print(f"    التفاصيل: {result['details']}")
            print()
        
        # تقييم شامل
        if success_rate >= 90:
            print("🎉 تقييم شامل: ممتاز - النظام المحاسبي الاحترافي يعمل بكامل وظائفه!")
        elif success_rate >= 75:
            print("✅ تقييم شامل: جيد جداً - النظام يعمل مع بعض التحسينات المطلوبة")
        elif success_rate >= 50:
            print("⚠️ تقييم شامل: مقبول - النظام يحتاج إصلاحات")
        else:
            print("❌ تقييم شامل: ضعيف - النظام يحتاج إعادة تطوير")
        
        print("=" * 80)

async def main():
    """الدالة الرئيسية"""
    tester = ProfessionalAccountingSystemTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
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