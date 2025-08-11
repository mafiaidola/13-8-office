#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل ومتقدم لإصلاحات المخازن والمنتجات - Advanced Warehouse & Product Fixes Test
==========================================================================================

اختبار متقدم يفحص جميع الإصلاحات المطبقة مع معالجة المشاكل المكتشفة في الاختبار الأول
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class AdvancedWarehouseProductTest:
    def __init__(self):
        self.base_url = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        self.admin_credentials = {
            "username": "admin",
            "password": "admin123"
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

    async def test_warehouse_products_comprehensive(self, warehouse_id: str, warehouse_name: str):
        """اختبار شامل لمنتجات المخزن مع فحص دقيق للبيانات الوهمية"""
        status, response, response_time = await self.make_request(
            "GET", f"/warehouses/{warehouse_id}/products"
        )
        
        if status == 200:
            products = response if isinstance(response, list) else []
            
            # تحليل مفصل للبيانات
            dummy_indicators = []
            real_indicators = []
            analysis = {
                "total_products": len(products),
                "dummy_patterns": 0,
                "real_patterns": 0,
                "empty_warehouse": len(products) == 0
            }
            
            for product in products:
                product_name = product.get("name", "")
                product_id = product.get("id", "")
                
                # فحص أنماط البيانات الوهمية المعروفة
                is_dummy = False
                
                # نمط "منتج 1", "منتج 2", إلخ
                if product_name.startswith("منتج ") and len(product_name.split()) == 2:
                    try:
                        int(product_name.split()[1])
                        is_dummy = True
                        dummy_indicators.append(f"اسم وهمي: {product_name}")
                    except ValueError:
                        pass
                
                # نمط "prod-1", "prod-2", إلخ
                if product_id.startswith("prod-") and len(product_id.split("-")) == 2:
                    try:
                        int(product_id.split("-")[1])
                        is_dummy = True
                        dummy_indicators.append(f"ID وهمي: {product_id}")
                    except ValueError:
                        pass
                
                if is_dummy:
                    analysis["dummy_patterns"] += 1
                else:
                    analysis["real_patterns"] += 1
                    real_indicators.append(product_name or product_id)
            
            # تقييم النتيجة
            if analysis["empty_warehouse"]:
                # مخزن فارغ = إصلاح ناجح (لا توجد بيانات وهمية)
                self.log_test_result(
                    f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الوهمية",
                    True,
                    f"✅ **مشكلة البيانات الوهمية محلولة!** المخزن '{warehouse_name}' فارغ (لا توجد بيانات وهمية مُولدة تلقائياً)",
                    response_time
                )
                return True, "fixed_empty"
            
            elif analysis["dummy_patterns"] > 0:
                # توجد بيانات وهمية = المشكلة لا تزال موجودة
                self.log_test_result(
                    f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الوهمية",
                    False,
                    f"🚨 **المشكلة لا تزال موجودة!** المخزن '{warehouse_name}' يحتوي على {analysis['dummy_patterns']} منتج وهمي من أصل {analysis['total_products']}. أمثلة: {dummy_indicators[:3]}",
                    response_time
                )
                return False, "still_dummy"
            
            else:
                # منتجات حقيقية فقط = إصلاح ناجح
                self.log_test_result(
                    f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الوهمية",
                    True,
                    f"✅ **مشكلة البيانات الوهمية محلولة!** المخزن '{warehouse_name}' يحتوي على {analysis['real_patterns']} منتج حقيقي فقط. أمثلة: {real_indicators[:3]}",
                    response_time
                )
                return True, "fixed_real"
        
        else:
            self.log_test_result(
                f"GET /api/warehouses/{warehouse_id}/products - فحص البيانات الوهمية",
                False,
                f"فشل جلب منتجات المخزن - HTTP {status}: {response}",
                response_time
            )
            return False, "api_error"

    async def test_create_warehouse_api(self):
        """اختبار POST /api/warehouses - إنشاء مخزن جديد"""
        warehouse_data = {
            "name": "مخزن اختبار الإصلاحات المتقدم",
            "location": "القاهرة - منطقة الاختبار المتقدم",
            "manager_name": "مدير المخزن التجريبي المتقدم",
            "manager_phone": "01234567890",
            "capacity": 2000,
            "current_stock": 0,
            "is_active": True,
            "description": "مخزن تم إنشاؤه لاختبار APIs الجديدة"
        }
        
        status, response, response_time = await self.make_request(
            "POST", "/warehouses", warehouse_data
        )
        
        if status in [200, 201]:
            warehouse_id = response.get("id") or response.get("warehouse_id") or response.get("warehouse", {}).get("id")
            self.log_test_result(
                "POST /api/warehouses - إنشاء مخزن جديد (API المضاف حديثاً)",
                True,
                f"تم إنشاء المخزن بنجاح - ID: {warehouse_id}, الاستجابة: {response}",
                response_time
            )
            return warehouse_id
        else:
            self.log_test_result(
                "POST /api/warehouses - إنشاء مخزن جديد (API المضاف حديثاً)",
                False,
                f"فشل إنشاء المخزن - HTTP {status}: {response}",
                response_time
            )
            return None

    async def test_delete_warehouse_api(self, warehouse_id: str):
        """اختبار DELETE /api/warehouses/{warehouse_id} - حذف مخزن"""
        if not warehouse_id:
            self.log_test_result(
                "DELETE /api/warehouses/{warehouse_id} - حذف مخزن (API المضاف حديثاً)",
                False,
                "لا يمكن اختبار الحذف - لم يتم إنشاء مخزن للاختبار",
                0
            )
            return False
        
        status, response, response_time = await self.make_request(
            "DELETE", f"/warehouses/{warehouse_id}"
        )
        
        if status in [200, 204]:
            self.log_test_result(
                "DELETE /api/warehouses/{warehouse_id} - حذف مخزن (API المضاف حديثاً)",
                True,
                f"تم حذف المخزن بنجاح - ID: {warehouse_id}",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "DELETE /api/warehouses/{warehouse_id} - حذف مخزن (API المضاف حديثاً)",
                False,
                f"فشل حذف المخزن - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_add_product_to_warehouse_api(self, warehouse_id: str, product_id: str):
        """اختبار POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن"""
        if not warehouse_id or not product_id:
            self.log_test_result(
                "POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن (API المضاف حديثاً)",
                False,
                f"لا يمكن اختبار إضافة المنتج - warehouse_id: {warehouse_id}, product_id: {product_id}",
                0
            )
            return False
        
        product_data = {
            "product_id": product_id,
            "quantity": 30,
            "location": "رف A-1 متقدم",
            "notes": "تم إضافة المنتج للاختبار المتقدم"
        }
        
        status, response, response_time = await self.make_request(
            "POST", f"/warehouses/{warehouse_id}/products", product_data
        )
        
        if status in [200, 201]:
            self.log_test_result(
                "POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن (API المضاف حديثاً)",
                True,
                f"تم إضافة المنتج للمخزن بنجاح - المنتج: {product_id}, الكمية: 30",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "POST /api/warehouses/{warehouse_id}/products - إضافة منتج لمخزن (API المضاف حديثاً)",
                False,
                f"فشل إضافة المنتج للمخزن - HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_update_product_quantity_api(self, warehouse_id: str, product_id: str):
        """اختبار PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج"""
        if not warehouse_id or not product_id:
            self.log_test_result(
                "PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج (API المضاف حديثاً)",
                False,
                f"لا يمكن اختبار تحديث الكمية - warehouse_id: {warehouse_id}, product_id: {product_id}",
                0
            )
            return False
        
        update_data = {
            "quantity": 50,
            "location": "رف B-2 متقدم",
            "notes": "تم تحديث الكمية للاختبار المتقدم"
        }
        
        status, response, response_time = await self.make_request(
            "PUT", f"/warehouses/{warehouse_id}/products/{product_id}", update_data
        )
        
        if status == 200:
            self.log_test_result(
                "PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج (API المضاف حديثاً)",
                True,
                f"تم تحديث كمية المنتج بنجاح - الكمية الجديدة: 50",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "PUT /api/warehouses/{warehouse_id}/products/{product_id} - تحديث كمية منتج (API المضاف حديثاً)",
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
                "GET /api/products - جلب قائمة المنتجات الحقيقية",
                True,
                f"تم جلب {len(products)} منتج حقيقي من قاعدة البيانات",
                response_time
            )
            return products
        else:
            self.log_test_result(
                "GET /api/products - جلب قائمة المنتجات الحقيقية",
                False,
                f"فشل جلب المنتجات - HTTP {status}: {response}",
                response_time
            )
            return []

    def generate_comprehensive_report(self):
        """إنشاء التقرير الشامل النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("=" * 100)
        print("🎯 **COMPREHENSIVE WAREHOUSE & PRODUCT MANAGEMENT FIXES TEST COMPLETE**")
        print("=" * 100)
        print()
        
        print("📊 **النتائج الإجمالية:**")
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   الاختبارات الناجحة: {successful_tests} ✅")
        print(f"   الاختبارات الفاشلة: {failed_tests} ❌")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        print(f"   متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   إجمالي وقت التنفيذ: {total_time:.2f}s")
        print()
        
        # تحليل مفصل للإصلاحات
        print("🔍 **تحليل مفصل للإصلاحات:**")
        
        # 1. مشكلة البيانات الوهمية
        dummy_data_tests = [r for r in self.test_results if "فحص البيانات الوهمية" in r["test_name"]]
        if dummy_data_tests:
            dummy_fixed = all(r["success"] for r in dummy_data_tests)
            print(f"   1️⃣ **مشكلة البيانات الوهمية**: {'✅ محلولة بالكامل' if dummy_fixed else '❌ لا تزال موجودة'}")
            for test in dummy_data_tests:
                status = "✅" if test["success"] else "❌"
                print(f"      {status} {test['test_name'].split(' - ')[-1]}")
        
        # 2. APIs إدارة المخازن الجديدة
        new_apis = ["POST /api/warehouses", "DELETE /api/warehouses", "إضافة منتج لمخزن", "تحديث كمية منتج"]
        new_api_tests = [r for r in self.test_results if any(api in r["test_name"] for api in new_apis)]
        if new_api_tests:
            new_apis_working = sum(1 for r in new_api_tests if r["success"])
            print(f"   2️⃣ **APIs إدارة المخازن الجديدة**: {new_apis_working}/{len(new_api_tests)} تعمل")
            for test in new_api_tests:
                status = "✅" if test["success"] else "❌"
                api_name = test["test_name"].split(" - ")[0]
                print(f"      {status} {api_name}")
        
        # 3. ربط المنتجات الحقيقية بالمخازن
        product_linking_tests = [r for r in self.test_results if "منتج" in r["test_name"] and ("إضافة" in r["test_name"] or "تحديث" in r["test_name"])]
        if product_linking_tests:
            linking_working = sum(1 for r in product_linking_tests if r["success"])
            print(f"   3️⃣ **ربط المنتجات الحقيقية بالمخازن**: {linking_working}/{len(product_linking_tests)} يعمل")
        
        print()
        print("📋 **تفاصيل جميع الاختبارات:**")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"   {i}. {status} {result['test_name']}")
            print(f"      📝 {result['details']}")
            print(f"      ⏱️  {result['response_time_ms']}ms")
            print()
        
        # التقييم النهائي الشامل
        print("🏆 **التقييم النهائي الشامل:**")
        
        if success_rate >= 95:
            print("   🎉 **مثالي!** جميع الإصلاحات تعمل بشكل مثالي - النظام جاهز للإنتاج!")
            recommendation = "النظام محسن بالكامل ويمكن استخدامه في الإنتاج"
        elif success_rate >= 85:
            print("   👍 **ممتاز!** معظم الإصلاحات تعمل بنجاح - تحسينات بسيطة مطلوبة")
            recommendation = "النظام يعمل بشكل جيد مع تحسينات بسيطة"
        elif success_rate >= 70:
            print("   ⚠️  **جيد!** الإصلاحات الأساسية تعمل - يحتاج مراجعة بعض النقاط")
            recommendation = "النظام يحتاج مراجعة وإصلاح بعض المشاكل"
        elif success_rate >= 50:
            print("   🔧 **متوسط!** بعض الإصلاحات تعمل - يحتاج عمل إضافي")
            recommendation = "النظام يحتاج عمل إضافي لإكمال الإصلاحات"
        else:
            print("   🚨 **يحتاج عمل كبير!** معظم الإصلاحات لا تعمل - يحتاج إعادة تطوير")
            recommendation = "النظام يحتاج إعادة تطوير شاملة"
        
        print(f"   📋 **التوصية**: {recommendation}")
        
        # ملخص المشكلة الأساسية
        print()
        print("📌 **ملخص المشكلة الأساسية المبلغ عنها:**")
        print("   🎯 **المشكلة**: 'جميع المخازن تأتى بأسماء وبيانات المنتجات من قسم إدارة المنتجات'")
        
        dummy_data_fixed = all(r["success"] for r in dummy_data_tests) if dummy_data_tests else False
        if dummy_data_fixed:
            print("   ✅ **الحالة**: تم حل المشكلة بنجاح - لا توجد بيانات وهمية مُولدة تلقائياً")
        else:
            print("   ❌ **الحالة**: المشكلة لا تزال موجودة - يحتاج إصلاح إضافي")
        
        print("=" * 100)

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل المتقدم"""
        print("🚀 بدء الاختبار الشامل المتقدم لإصلاحات المخازن والمنتجات...")
        print("=" * 100)
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
            
            # 3. فحص شامل لمنتجات المخازن (المشكلة الأساسية)
            warehouse_results = []
            for warehouse in warehouses:
                warehouse_id = warehouse.get("id")
                warehouse_name = warehouse.get("name", "غير محدد")
                if warehouse_id:
                    success, result_type = await self.test_warehouse_products_comprehensive(warehouse_id, warehouse_name)
                    warehouse_results.append((warehouse_name, success, result_type))
            
            # 4. جلب قائمة المنتجات الحقيقية
            products = await self.test_get_products()
            
            # 5. اختبار إنشاء مخزن جديد
            test_warehouse_id = await self.test_create_warehouse_api()
            
            # 6. اختبار إضافة منتج للمخزن (إذا توفر مخزن ومنتج)
            if test_warehouse_id and products:
                first_product_id = products[0].get("id") if products else None
                if first_product_id:
                    await self.test_add_product_to_warehouse_api(test_warehouse_id, first_product_id)
                    
                    # 7. اختبار تحديث كمية المنتج
                    await self.test_update_product_quantity_api(test_warehouse_id, first_product_id)
            
            # 8. اختبار حذف المخزن
            if test_warehouse_id:
                await self.test_delete_warehouse_api(test_warehouse_id)
            
        except Exception as e:
            print(f"❌ خطأ أثناء تشغيل الاختبار: {str(e)}")
        
        finally:
            await self.cleanup_session()
            self.generate_comprehensive_report()

async def main():
    """الدالة الرئيسية"""
    test = AdvancedWarehouseProductTest()
    await test.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())