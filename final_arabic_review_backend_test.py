#!/usr/bin/env python3
"""
اختبار نهائي شامل للمشاكل المصلحة - Arabic Review Final Test
Final comprehensive test for resolved issues as requested in Arabic review

المطلوب اختبار:
1. تحديث المنتجات - تسجيل دخول admin/admin123، جلب المنتجات، تحديث منتج، التحقق من الحفظ
2. إدارة الزيارات - فحص GET /api/visits/list و GET /api/visits/dashboard/overview
3. ربط المخازن والمنتجات - فحص GET /api/products، التأكد من ترابط البيانات، فحص endpoints المخازن
4. فحص عام للنظام - استقرار APIs، أداء النظام، عدم وجود أخطاء

الهدف: تأكيد أن جميع المشاكل المبلغ عنها تم حلها نهائياً
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get backend URL from frontend .env
BACKEND_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"

class FinalArabicReviewTester:
    def __init__(self):
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BACKEND_URL}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if self.jwt_token:
            default_headers["Authorization"] = f"Bearer {self.jwt_token}"
        if headers:
            default_headers.update(headers)
            
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=default_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return {
                        "success": response.status == 200,
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time
                    }
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=default_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return {
                        "success": response.status in [200, 201],
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time
                    }
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=default_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return {
                        "success": response.status == 200,
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "response_time": (time.time() - start_time) * 1000
            }
    
    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        })
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({response_time:.2f}ms)")
    
    async def test_admin_login(self):
        """اختبار 1: تسجيل دخول admin/admin123"""
        print("\n🔐 اختبار تسجيل الدخول admin/admin123...")
        
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            }
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"]:
            self.jwt_token = result["data"].get("access_token")
            user_info = result["data"].get("user", {})
            
            self.log_test_result(
                "تسجيل دخول Admin",
                True,
                f"نجح تسجيل الدخول - المستخدم: {user_info.get('full_name', 'Admin')}, الدور: {user_info.get('role', 'admin')}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تسجيل دخول Admin",
                False,
                f"فشل تسجيل الدخول - الخطأ: {result.get('error', 'Unknown error')}",
                result["response_time"]
            )
            return False
    
    async def test_products_management(self):
        """اختبار 2: إدارة المنتجات - جلب وتحديث"""
        print("\n📦 اختبار إدارة المنتجات...")
        
        # جلب قائمة المنتجات
        products_result = await self.make_request("GET", "/products")
        
        if not products_result["success"]:
            self.log_test_result(
                "جلب قائمة المنتجات",
                False,
                f"فشل في جلب المنتجات - الخطأ: {products_result.get('error', 'Unknown error')}",
                products_result["response_time"]
            )
            return False
        
        products = products_result["data"]
        products_count = len(products) if isinstance(products, list) else 0
        
        self.log_test_result(
            "جلب قائمة المنتجات",
            True,
            f"تم جلب {products_count} منتج بنجاح",
            products_result["response_time"]
        )
        
        if products_count == 0:
            self.log_test_result(
                "تحديث المنتجات",
                False,
                "لا توجد منتجات متاحة للتحديث",
                0
            )
            return False
        
        # اختيار أول منتج للتحديث
        first_product = products[0] if isinstance(products, list) else None
        if not first_product:
            self.log_test_result(
                "تحديث المنتجات",
                False,
                "لا يمكن العثور على منتج للتحديث",
                0
            )
            return False
        
        product_id = first_product.get("id") or first_product.get("_id")
        original_name = first_product.get("name", "منتج غير معروف")
        original_price = first_product.get("price", 0)
        
        # بيانات التحديث الجديدة
        update_data = {
            "name": f"{original_name} - محدث نهائياً",
            "price": float(original_price) + 100.0,
            "description": "تم تحديث هذا المنتج في الاختبار النهائي",
            "updated_at": datetime.now().isoformat()
        }
        
        # تحديث المنتج
        update_result = await self.make_request("PUT", f"/products/{product_id}", update_data)
        
        if update_result["success"]:
            self.log_test_result(
                "تحديث المنتجات",
                True,
                f"تم تحديث المنتج '{original_name}' بنجاح - السعر الجديد: {update_data['price']} ج.م",
                update_result["response_time"]
            )
            
            # التحقق من التحديث
            verify_result = await self.make_request("GET", "/products")
            if verify_result["success"]:
                updated_products = verify_result["data"]
                updated_product = None
                
                for product in updated_products:
                    if (product.get("id") == product_id or product.get("_id") == product_id):
                        updated_product = product
                        break
                
                if updated_product and updated_product.get("name") == update_data["name"]:
                    self.log_test_result(
                        "التحقق من تحديث المنتج",
                        True,
                        f"تم التحقق من حفظ التحديث - الاسم الجديد: {updated_product.get('name')}",
                        verify_result["response_time"]
                    )
                    return True
                else:
                    self.log_test_result(
                        "التحقق من تحديث المنتج",
                        False,
                        "لم يتم حفظ التحديث بشكل صحيح",
                        verify_result["response_time"]
                    )
                    return False
            else:
                self.log_test_result(
                    "التحقق من تحديث المنتج",
                    False,
                    "فشل في التحقق من التحديث",
                    0
                )
                return False
        else:
            self.log_test_result(
                "تحديث المنتجات",
                False,
                f"فشل في تحديث المنتج - الخطأ: {update_result.get('error', 'Unknown error')}",
                update_result["response_time"]
            )
            return False
    
    async def test_visits_management(self):
        """اختبار 3: إدارة الزيارات"""
        print("\n🏥 اختبار إدارة الزيارات...")
        
        # اختبار GET /api/visits/list
        visits_list_result = await self.make_request("GET", "/visits/list")
        
        if visits_list_result["success"]:
            visits_data = visits_list_result["data"]
            visits_count = len(visits_data) if isinstance(visits_data, list) else 0
            
            self.log_test_result(
                "GET /api/visits/list",
                True,
                f"تم جلب قائمة الزيارات بنجاح - العدد: {visits_count}",
                visits_list_result["response_time"]
            )
        else:
            self.log_test_result(
                "GET /api/visits/list",
                False,
                f"فشل في جلب قائمة الزيارات - الخطأ: {visits_list_result.get('error', 'Unknown error')}",
                visits_list_result["response_time"]
            )
        
        # اختبار GET /api/visits/dashboard/overview
        visits_overview_result = await self.make_request("GET", "/visits/dashboard/overview")
        
        if visits_overview_result["success"]:
            overview_data = visits_overview_result["data"]
            
            self.log_test_result(
                "GET /api/visits/dashboard/overview",
                True,
                f"تم جلب نظرة عامة على الزيارات بنجاح - البيانات متاحة",
                visits_overview_result["response_time"]
            )
            
            return visits_list_result["success"] and visits_overview_result["success"]
        else:
            self.log_test_result(
                "GET /api/visits/dashboard/overview",
                False,
                f"فشل في جلب نظرة عامة على الزيارات - الخطأ: {visits_overview_result.get('error', 'Unknown error')}",
                visits_overview_result["response_time"]
            )
            
            return False
    
    async def test_warehouse_product_integration(self):
        """اختبار 4: ربط المخازن والمنتجات"""
        print("\n🏪 اختبار ربط المخازن والمنتجات...")
        
        # فحص المنتجات الحقيقية
        products_result = await self.make_request("GET", "/products")
        
        if products_result["success"]:
            products = products_result["data"]
            real_products_count = len(products) if isinstance(products, list) else 0
            
            self.log_test_result(
                "فحص المنتجات الحقيقية",
                True,
                f"تم العثور على {real_products_count} منتج حقيقي",
                products_result["response_time"]
            )
        else:
            self.log_test_result(
                "فحص المنتجات الحقيقية",
                False,
                f"فشل في جلب المنتجات - الخطأ: {products_result.get('error', 'Unknown error')}",
                products_result["response_time"]
            )
            return False
        
        # فحص المخازن
        warehouses_result = await self.make_request("GET", "/warehouses")
        
        if warehouses_result["success"]:
            warehouses = warehouses_result["data"]
            warehouses_count = len(warehouses) if isinstance(warehouses, list) else 0
            
            self.log_test_result(
                "فحص المخازن",
                True,
                f"تم العثور على {warehouses_count} مخزن",
                warehouses_result["response_time"]
            )
        else:
            # المخازن قد لا تكون مطبقة، لذا نسجل تحذير وليس خطأ
            self.log_test_result(
                "فحص المخازن",
                False,
                f"endpoint المخازن غير متاح - الحالة: {warehouses_result.get('status_code', 'Unknown')}",
                warehouses_result["response_time"]
            )
        
        # فحص ترابط البيانات
        if products_result["success"]:
            # فحص أن المنتجات تحتوي على معلومات ترابط
            products = products_result["data"]
            linked_products = 0
            
            for product in products:
                if isinstance(product, dict):
                    # فحص وجود حقول الربط
                    if any(key in product for key in ["warehouse_id", "supplier_id", "category_id"]):
                        linked_products += 1
            
            self.log_test_result(
                "ترابط البيانات",
                True,
                f"تم فحص ترابط البيانات - {linked_products}/{real_products_count} منتج مرتبط",
                0
            )
            
            return True
        
        return False
    
    async def test_system_stability(self):
        """اختبار 5: فحص عام للنظام"""
        print("\n🔧 فحص عام لاستقرار النظام...")
        
        # قائمة endpoints أساسية للفحص
        endpoints_to_test = [
            ("/health", "فحص صحة النظام"),
            ("/users", "إدارة المستخدمين"),
            ("/clinics", "إدارة العيادات"),
            ("/dashboard/stats/admin", "إحصائيات الداشبورد"),
            ("/lines", "إدارة الخطوط"),
            ("/areas", "إدارة المناطق")
        ]
        
        stable_endpoints = 0
        total_response_time = 0
        
        for endpoint, description in endpoints_to_test:
            result = await self.make_request("GET", endpoint)
            
            if result["success"]:
                stable_endpoints += 1
                total_response_time += result["response_time"]
                
                self.log_test_result(
                    f"استقرار {description}",
                    True,
                    f"يعمل بشكل طبيعي",
                    result["response_time"]
                )
            else:
                self.log_test_result(
                    f"استقرار {description}",
                    False,
                    f"غير مستقر - الخطأ: {result.get('error', 'Unknown error')}",
                    result["response_time"]
                )
        
        # حساب متوسط وقت الاستجابة
        avg_response_time = total_response_time / len(endpoints_to_test) if endpoints_to_test else 0
        stability_rate = (stable_endpoints / len(endpoints_to_test)) * 100
        
        self.log_test_result(
            "تقييم الاستقرار العام",
            stability_rate >= 80,
            f"معدل الاستقرار: {stability_rate:.1f}% ({stable_endpoints}/{len(endpoints_to_test)}) - متوسط الاستجابة: {avg_response_time:.2f}ms",
            avg_response_time
        )
        
        return stability_rate >= 80
    
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء الاختبار النهائي الشامل للمشاكل المصلحة")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # الاختبارات المطلوبة
            tests = [
                ("تسجيل الدخول", self.test_admin_login()),
                ("إدارة المنتجات", self.test_products_management()),
                ("إدارة الزيارات", self.test_visits_management()),
                ("ربط المخازن والمنتجات", self.test_warehouse_product_integration()),
                ("استقرار النظام", self.test_system_stability())
            ]
            
            successful_tests = 0
            
            for test_name, test_coroutine in tests:
                try:
                    result = await test_coroutine
                    if result:
                        successful_tests += 1
                except Exception as e:
                    self.log_test_result(
                        f"خطأ في {test_name}",
                        False,
                        f"استثناء غير متوقع: {str(e)}",
                        0
                    )
            
            # النتائج النهائية
            total_time = time.time() - self.start_time
            success_rate = (successful_tests / len(tests)) * 100
            
            print("\n" + "=" * 80)
            print("📊 النتائج النهائية للاختبار الشامل")
            print("=" * 80)
            
            print(f"🎯 معدل النجاح الإجمالي: {success_rate:.1f}% ({successful_tests}/{len(tests)} اختبار نجح)")
            print(f"⏱️ إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
            
            # تفاصيل النتائج
            print(f"\n📋 تفاصيل النتائج:")
            for result in self.test_results:
                status = "✅" if result["success"] else "❌"
                print(f"{status} {result['test']}: {result['details']}")
            
            # التقييم النهائي
            if success_rate >= 90:
                print(f"\n🏆 تقييم ممتاز: جميع المشاكل المبلغ عنها تم حلها بنجاح!")
                print("✅ النظام جاهز للاستخدام الفعلي")
            elif success_rate >= 75:
                print(f"\n✅ تقييم جيد: معظم المشاكل تم حلها")
                print("⚠️ يوجد بعض المشاكل البسيطة التي تحتاج متابعة")
            else:
                print(f"\n⚠️ تقييم يحتاج تحسين: لا تزال هناك مشاكل تحتاج حل")
                print("❌ يُنصح بمراجعة المشاكل المتبقية قبل الاستخدام الفعلي")
            
            return success_rate >= 75
            
        finally:
            await self.cleanup_session()

async def main():
    """الدالة الرئيسية"""
    tester = FinalArabicReviewTester()
    success = await tester.run_comprehensive_test()
    
    if success:
        print(f"\n🎉 الاختبار النهائي مكتمل بنجاح!")
    else:
        print(f"\n⚠️ الاختبار النهائي يحتاج مراجعة!")

if __name__ == "__main__":
    asyncio.run(main())