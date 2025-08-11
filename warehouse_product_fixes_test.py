#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار إصلاحات المخازن والمنتجات - Warehouse and Product Management Fixes Test
=============================================================================

هذا الاختبار يفحص الإصلاحات المطبقة على نظام إدارة المخازن والمنتجات كما طُلب في المراجعة العربية:

المتطلبات المحددة:
1. تسجيل دخول admin/admin123
2. اختبار GET /api/warehouses - جلب قائمة المخازن  
3. اختبار GET /api/warehouses/{warehouse_id}/products - فحص إذا تم إصلاح البيانات الوهمية وأصبحت تُرجع منتجات حقيقية
4. اختبار POST /api/warehouses - إنشاء مخزن جديد (API المضاف حديثاً)
5. اختبار DELETE /api/warehouses/{warehouse_id} - حذف مخزن (API المضاف حديثاً) 
6. اختبار POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن (API المضاف حديثاً)
7. اختبار PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج في مخزن (API المضاف حديثاً)

الهدف: التأكد من حل المشكلة المبلغ عنها "جميع المخازن تأتى بأسماء وبيانات المنتجات من قسم إدارة المنتجات"
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class WarehouseProductFixesTest:
    def __init__(self):
        # استخدام الـ URL الصحيح من frontend/.env
        self.base_url = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        # بيانات اختبار حقيقية
        self.admin_credentials = {
            "username": "admin",
            "password": "admin123"
        }
        
        # بيانات مخزن اختبار
        self.test_warehouse_data = {
            "name": "مخزن اختبار الإصلاحات",
            "location": "القاهرة - منطقة الاختبار",
            "manager_name": "مدير المخزن التجريبي",
            "manager_phone": "01234567890",
            "capacity": 1000,
            "current_stock": 0,
            "is_active": True,
            "description": "مخزن تم إنشاؤه لاختبار الإصلاحات الجديدة"
        }
        
        # بيانات منتج اختبار
        self.test_product_data = {
            "name": "منتج اختبار الإصلاحات",
            "category": "أدوية",
            "unit": "علبة",
            "price": 125.50,
            "current_stock": 50,
            "min_stock": 10,
            "is_active": True,
            "description": "منتج تم إنشاؤه لاختبار ربط المخازن"
        }

    async def setup_session(self):
        """إعداد جلسة HTTP"""
        connector = aiohttp.TCPConnector(ssl=False, limit=100, limit_per_host=30)
        timeout = aiohttp.ClientTimeout(total=30, connect=10)
        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={"Content-Type": "application/json"}
        )

    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()

    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "response_time_ms": round(response_time * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status} | {test_name}")
        print(f"   📝 {details}")
        if response_time > 0:
            print(f"   ⏱️  Response time: {response_time * 1000:.2f}ms")
        print()

    async def make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None) -> tuple:
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{self.base_url}{endpoint}"
        headers = {}
        
        if self.jwt_token:
            headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json()
                    return response.status, response_data, response_time
            
            elif method.upper() == "POST":
                async with self.session.post(url, headers=headers, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json()
                    return response.status, response_data, response_time
            
            elif method.upper() == "PUT":
                async with self.session.put(url, headers=headers, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json()
                    return response.status, response_data, response_time
            
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=headers, params=params) as response:
                    response_time = time.time() - start_time
                    try:
                        response_data = await response.json()
                    except:
                        response_data = {"message": "Deleted successfully"}
                    return response.status, response_data, response_time
                    
        except Exception as e:
            response_time = time.time() - start_time
            return 500, {"error": str(e)}, response_time

    async def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن"""
        status, response, response_time = await self.make_request(
            "POST", "/auth/login", self.admin_credentials
        )
        
        if status == 200 and "access_token" in response:
            self.jwt_token = response["access_token"]
            user_info = response.get("user", {})
            self.log_test_result(
                "تسجيل دخول admin/admin123",
                True,
                f"تم تسجيل الدخول بنجاح - المستخدم: {user_info.get('full_name', 'غير محدد')} - الدور: {user_info.get('role', 'غير محدد')}",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "تسجيل دخول admin/admin123",
                False,
                f"فشل تسجيل الدخول - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_get_warehouses(self):
        """اختبار GET /api/warehouses - جلب قائمة المخازن"""
        status, response, response_time = await self.make_request("GET", "/warehouses")
        
        if status == 200:
            warehouses = response if isinstance(response, list) else []
            self.log_test_result(
                "GET /api/warehouses - جلب قائمة المخازن",
                True,
                f"تم جلب {len(warehouses)} مخزن بنجاح",
                response_time
            )
            return warehouses
        else:
            self.log_test_result(
                "GET /api/warehouses - جلب قائمة المخازن",
                False,
                f"فشل جلب المخازن - HTTP {status}: {response}",
                response_time
            )
            return []

    async def test_warehouse_products_real_data(self, warehouse_id: str, warehouse_name: str):
        """اختبار GET /api/warehouses/{warehouse_id}/products - فحص البيانات الحقيقية"""
        status, response, response_time = await self.make_request(
            "GET", f"/warehouses/{warehouse_id}/products"
        )
        
        if status == 200:
            products = response if isinstance(response, list) else []
            
            # فحص إذا كانت البيانات وهمية أم حقيقية
            dummy_data_indicators = []
            real_data_indicators = []
            
            for product in products:
                product_name = product.get("name", "")
                product_id = product.get("id", "")
                
                # مؤشرات البيانات الوهمية
                if (product_name.startswith("منتج ") and product_name.split()[-1].isdigit()) or \
                   (product_id.startswith("prod-") and product_id.split("-")[-1].isdigit()):
                    dummy_data_indicators.append(product_name)
                else:
                    real_data_indicators.append(product_name)
            
            is_dummy_data = len(dummy_data_indicators) > len(real_data_indicators)
            
            if is_dummy_data:
                self.log_test_result(
                    f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الحقيقية",
                    False,
                    f"🚨 المشكلة لا تزال موجودة! المخزن '{warehouse_name}' يعرض {len(dummy_data_indicators)} منتج وهمي مقابل {len(real_data_indicators)} منتج حقيقي. أمثلة البيانات الوهمية: {dummy_data_indicators[:3]}",
                    response_time
                )
                return False, products
            else:
                self.log_test_result(
                    f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الحقيقية",
                    True,
                    f"✅ تم إصلاح المشكلة! المخزن '{warehouse_name}' يعرض {len(real_data_indicators)} منتج حقيقي. أمثلة: {real_data_indicators[:3] if real_data_indicators else 'لا توجد منتجات'}",
                    response_time
                )
                return True, products
        else:
            self.log_test_result(
                f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الحقيقية",
                False,
                f"فشل جلب منتجات المخزن - HTTP {status}: {response}",
                response_time
            )
            return False, []

    async def test_create_warehouse(self):
        """اختبار POST /api/warehouses - إنشاء مخزن جديد"""
        status, response, response_time = await self.make_request(
            "POST", "/warehouses", self.test_warehouse_data
        )
        
        if status in [200, 201]:
            warehouse_id = response.get("id") or response.get("warehouse_id")
            self.log_test_result(
                "POST /api/warehouses - إنشاء مخزن جديد",
                True,
                f"تم إنشاء المخزن بنجاح - ID: {warehouse_id}",
                response_time
            )
            return warehouse_id
        else:
            self.log_test_result(
                "POST /api/warehouses - إنشاء مخزن جديد",
                False,
                f"فشل إنشاء المخزن - HTTP {status}: {response}",
                response_time
            )
            return None

    async def test_delete_warehouse(self, warehouse_id: str):
        """اختبار DELETE /api/warehouses/{warehouse_id} - حذف مخزن"""
        status, response, response_time = await self.make_request(
            "DELETE", f"/warehouses/{warehouse_id}"
        )
        
        if status in [200, 204]:
            self.log_test_result(
                "DELETE /api/warehouses/{warehouse_id} - حذف مخزن",
                True,
                f"تم حذف المخزن بنجاح - ID: {warehouse_id}",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "DELETE /api/warehouses/{warehouse_id} - حذف مخزن",
                False,
                f"فشل حذف المخزن - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_add_product_to_warehouse(self, warehouse_id: str, product_id: str):
        """اختبار POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن"""
        product_data = {
            "product_id": product_id,
            "quantity": 25,
            "location": "رف A-1",
            "notes": "تم إضافة المنتج للاختبار"
        }
        
        status, response, response_time = await self.make_request(
            "POST", f"/warehouses/{warehouse_id}/products", product_data
        )
        
        if status in [200, 201]:
            self.log_test_result(
                "POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن",
                True,
                f"تم إضافة المنتج للمخزن بنجاح - المنتج: {product_id}, الكمية: 25",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن",
                False,
                f"فشل إضافة المنتج للمخزن - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_update_product_quantity(self, warehouse_id: str, product_id: str):
        """اختبار PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج"""
        update_data = {
            "quantity": 40,
            "location": "رف B-2",
            "notes": "تم تحديث الكمية للاختبار"
        }
        
        status, response, response_time = await self.make_request(
            "PUT", f"/warehouses/{warehouse_id}/products/{product_id}", update_data
        )
        
        if status == 200:
            self.log_test_result(
                "PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج",
                True,
                f"تم تحديث كمية المنتج بنجاح - الكمية الجديدة: 40",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج",
                False,
                f"فشل تحديث كمية المنتج - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_get_products(self):
        """اختبار GET /api/products - جلب قائمة المنتجات"""
        status, response, response_time = await self.make_request("GET", "/products")
        
        if status == 200:
            products = response if isinstance(response, list) else []
            self.log_test_result(
                "GET /api/products - جلب قائمة المنتجات",
                True,
                f"تم جلب {len(products)} منتج بنجاح",
                response_time
            )
            return products
        else:
            self.log_test_result(
                "GET /api/products - جلب قائمة المنتجات",
                False,
                f"فشل جلب المنتجات - HTTP {status}: {response}",
                response_time
            )
            return []

    async def test_create_product(self):
        """اختبار POST /api/products - إنشاء منتج جديد"""
        status, response, response_time = await self.make_request(
            "POST", "/products", self.test_product_data
        )
        
        if status in [200, 201]:
            product_id = response.get("id") or response.get("product_id")
            self.log_test_result(
                "POST /api/products - إنشاء منتج جديد",
                True,
                f"تم إنشاء المنتج بنجاح - ID: {product_id}",
                response_time
            )
            return product_id
        else:
            self.log_test_result(
                "POST /api/products - إنشاء منتج جديد",
                False,
                f"فشل إنشاء المنتج - HTTP {status}: {response}",
                response_time
            )
            return None

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("=" * 80)
        print("🎯 **WAREHOUSE & PRODUCT MANAGEMENT FIXES TEST COMPLETE**")
        print("=" * 80)
        print()
        
        print("📊 **النتائج الإجمالية:**")
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   الاختبارات الناجحة: {successful_tests} ✅")
        print(f"   الاختبارات الفاشلة: {failed_tests} ❌")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        print(f"   متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   إجمالي وقت التنفيذ: {total_time:.2f}s")
        print()
        
        print("📋 **تفاصيل النتائج:**")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"   {i}. {status} {result['test_name']}")
            print(f"      📝 {result['details']}")
            print(f"      ⏱️  {result['response_time_ms']}ms")
            print()
        
        # تقييم حالة الإصلاحات
        print("🎯 **تقييم حالة الإصلاحات:**")
        
        # فحص إصلاح مشكلة البيانات الوهمية
        dummy_data_tests = [r for r in self.test_results if "فحص البيانات الحقيقية" in r["test_name"]]
        dummy_data_fixed = all(r["success"] for r in dummy_data_tests)
        
        if dummy_data_fixed:
            print("   ✅ **مشكلة البيانات الوهمية**: تم إصلاحها بالكامل!")
        else:
            print("   ❌ **مشكلة البيانات الوهمية**: لا تزال موجودة - تحتاج إصلاح")
        
        # فحص APIs الجديدة
        new_apis_tests = [r for r in self.test_results if any(api in r["test_name"] for api in ["POST /api/warehouses", "DELETE /api/warehouses", "إضافة منتج لمخزن", "تحديث كمية منتج"])]
        new_apis_working = sum(1 for r in new_apis_tests if r["success"])
        
        if new_apis_working == len(new_apis_tests) and len(new_apis_tests) > 0:
            print("   ✅ **APIs إدارة المخازن الجديدة**: تعمل بشكل مثالي!")
        elif new_apis_working > 0:
            print(f"   ⚠️  **APIs إدارة المخازن الجديدة**: {new_apis_working}/{len(new_apis_tests)} تعمل - تحتاج تحسين")
        else:
            print("   ❌ **APIs إدارة المخازن الجديدة**: غير مطبقة أو لا تعمل")
        
        # التوصية النهائية
        print()
        print("🏆 **التوصية النهائية:**")
        if success_rate >= 90:
            print("   🎉 **ممتاز!** جميع الإصلاحات تعمل بشكل مثالي - النظام جاهز للإنتاج!")
        elif success_rate >= 70:
            print("   👍 **جيد!** معظم الإصلاحات تعمل - يحتاج تحسينات بسيطة")
        elif success_rate >= 50:
            print("   ⚠️  **متوسط!** بعض الإصلاحات تعمل - يحتاج مراجعة وإصلاح")
        else:
            print("   🚨 **يحتاج عمل!** معظم الإصلاحات لا تعمل - يحتاج إعادة تطوير")
        
        print("=" * 80)

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار إصلاحات المخازن والمنتجات...")
        print("=" * 80)
        print()
        
        await self.setup_session()
        
        try:
            # 1. تسجيل دخول الأدمن
            login_success = await self.test_admin_login()
            if not login_success:
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
            
            # 2. جلب قائمة المخازن
            warehouses = await self.test_get_warehouses()
            
            # 3. فحص منتجات المخازن للتأكد من إصلاح البيانات الوهمية
            for warehouse in warehouses[:2]:  # اختبار أول مخزنين
                warehouse_id = warehouse.get("id")
                warehouse_name = warehouse.get("name", "غير محدد")
                if warehouse_id:
                    await self.test_warehouse_products_real_data(warehouse_id, warehouse_name)
            
            # 4. جلب قائمة المنتجات
            products = await self.test_get_products()
            
            # 5. إنشاء منتج جديد للاختبار
            test_product_id = await self.test_create_product()
            
            # 6. إنشاء مخزن جديد
            test_warehouse_id = await self.test_create_warehouse()
            
            # 7. اختبار إضافة منتج للمخزن (إذا تم إنشاء المخزن والمنتج)
            if test_warehouse_id and test_product_id:
                await self.test_add_product_to_warehouse(test_warehouse_id, test_product_id)
                
                # 8. اختبار تحديث كمية المنتج في المخزن
                await self.test_update_product_quantity(test_warehouse_id, test_product_id)
            
            # 9. اختبار حذف المخزن (إذا تم إنشاؤه)
            if test_warehouse_id:
                await self.test_delete_warehouse(test_warehouse_id)
            
        except Exception as e:
            print(f"❌ خطأ أثناء تشغيل الاختبار: {str(e)}")
        
        finally:
            await self.cleanup_session()
            self.generate_final_report()

async def main():
    """الدالة الرئيسية"""
    test = WarehouseProductFixesTest()
    await test.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())