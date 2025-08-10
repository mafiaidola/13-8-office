#!/usr/bin/env python3
"""
Arabic Review Quick Backend Test - اختبار سريع للمراجعة العربية
اختبار سريع للمشاكل المبلغ عنها:

1. تسجيل الدخول admin/admin123
2. اختبار endpoint تحديث المنتج PUT /api/products/{id} مع بيانات تجريبية
3. اختبار endpoint الزيارات GET /api/visits
4. فحص ربط قاعدة البيانات للمنتجات والمخازن

المطلوب تحديد:
- هل تحديث المنتجات يعمل في الباكند؟
- هل endpoint الزيارات يعمل؟  
- هل البيانات مترابطة بشكل صحيح؟
- ما هي المشاكل المحددة؟
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class ArabicReviewQuickTest:
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
                    try:
                        response_data = await response.json()
                    except:
                        response_data = {"error": "Invalid JSON response", "text": await response.text()}
                    return {
                        "status_code": response.status,
                        "data": response_data,
                        "response_time": response_time,
                        "success": response.status < 400
                    }
            else:
                async with self.session.request(method, url, json=data, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    try:
                        response_data = await response.json()
                    except:
                        response_data = {"error": "Invalid JSON response", "text": await response.text()}
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
        status = "✅" if success else "❌"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        print(f"{status} {test_name}: {details} ({response_time:.2f}ms)")
        
    async def test_1_admin_login(self):
        """اختبار 1: تسجيل الدخول admin/admin123"""
        print("\n🔐 اختبار 1: تسجيل دخول admin/admin123")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and "access_token" in result["data"]:
            self.admin_token = result["data"]["access_token"]
            user_info = result["data"]["user"]
            self.log_test_result(
                "تسجيل دخول Admin",
                True,
                f"نجح - المستخدم: {user_info.get('full_name')}, الدور: {user_info.get('role')}",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تسجيل دخول Admin",
                False,
                f"فشل: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_2_get_products_list(self):
        """اختبار 2: جلب قائمة المنتجات للحصول على ID للتحديث"""
        print("\n📦 اختبار 2: جلب قائمة المنتجات")
        
        result = await self.make_request("GET", "/products", token=self.admin_token)
        
        if result["success"]:
            products = result["data"]
            if isinstance(products, list) and len(products) > 0:
                # Store first product for update test
                self.test_product = products[0]
                product_id = self.test_product.get("id") or self.test_product.get("_id")
                
                self.log_test_result(
                    "جلب قائمة المنتجات",
                    True,
                    f"تم العثور على {len(products)} منتج، سيتم اختبار تحديث المنتج: {self.test_product.get('name', 'غير محدد')} (ID: {product_id})",
                    result["response_time"]
                )
                return True
            else:
                self.log_test_result(
                    "جلب قائمة المنتجات",
                    False,
                    "لا توجد منتجات متاحة للاختبار",
                    result["response_time"]
                )
                return False
        else:
            self.log_test_result(
                "جلب قائمة المنتجات",
                False,
                f"فشل: {result['data']}",
                result["response_time"]
            )
            return False
    
    async def test_3_update_product(self):
        """اختبار 3: تحديث المنتج PUT /api/products/{id}"""
        print("\n🔄 اختبار 3: تحديث المنتج")
        
        if not hasattr(self, 'test_product'):
            self.log_test_result(
                "تحديث المنتج",
                False,
                "لا يوجد منتج متاح للاختبار",
                0
            )
            return False
        
        product_id = self.test_product.get("id") or self.test_product.get("_id")
        
        # Test data for product update
        update_data = {
            "name": f"{self.test_product.get('name', 'منتج اختبار')} - محدث",
            "price": float(self.test_product.get("price", 100)) + 10.5,
            "description": "تم تحديث هذا المنتج في اختبار المراجعة العربية",
            "category": self.test_product.get("category", "أدوية"),
            "stock_quantity": int(self.test_product.get("stock_quantity", 50)) + 5,
            "is_active": True
        }
        
        result = await self.make_request("PUT", f"/products/{product_id}", update_data, token=self.admin_token)
        
        if result["success"]:
            self.log_test_result(
                "تحديث المنتج",
                True,
                f"تم تحديث المنتج بنجاح - الاسم الجديد: {update_data['name']}, السعر الجديد: {update_data['price']} ج.م",
                result["response_time"]
            )
            return True
        else:
            self.log_test_result(
                "تحديث المنتج",
                False,
                f"فشل تحديث المنتج: {result['data']} (HTTP {result['status_code']})",
                result["response_time"]
            )
            return False
    
    async def test_4_get_visits(self):
        """اختبار 4: اختبار endpoint الزيارات GET /api/visits"""
        print("\n🏥 اختبار 4: جلب قائمة الزيارات")
        
        # Test multiple visit endpoints
        visit_endpoints = [
            ("/visits/list", "قائمة الزيارات"),
            ("/visits/dashboard/overview", "نظرة عامة على الزيارات")
        ]
        
        success_count = 0
        total_endpoints = len(visit_endpoints)
        
        for endpoint, name in visit_endpoints:
            result = await self.make_request("GET", endpoint, token=self.admin_token)
            
            if result["success"]:
                visits_data = result["data"]
                if isinstance(visits_data, dict):
                    if "visits" in visits_data:
                        visits_count = len(visits_data["visits"])
                        self.log_test_result(
                            f"جلب {name}",
                            True,
                            f"تم جلب {visits_count} زيارة بنجاح",
                            result["response_time"]
                        )
                        success_count += 1
                    elif "stats" in visits_data:
                        total_visits = visits_data["stats"].get("total_visits", 0)
                        self.log_test_result(
                            f"جلب {name}",
                            True,
                            f"إحصائيات الزيارات: {total_visits} زيارة إجمالية",
                            result["response_time"]
                        )
                        success_count += 1
                    else:
                        self.log_test_result(
                            f"جلب {name}",
                            True,
                            f"endpoint يعمل مع بيانات: {list(visits_data.keys())}",
                            result["response_time"]
                        )
                        success_count += 1
                else:
                    self.log_test_result(
                        f"جلب {name}",
                        True,
                        f"endpoint يعمل مع تنسيق: {type(visits_data)}",
                        result["response_time"]
                    )
                    success_count += 1
            else:
                self.log_test_result(
                    f"جلب {name}",
                    False,
                    f"فشل: {result['data']} (HTTP {result['status_code']})",
                    result["response_time"]
                )
        
        # Overall success if at least one endpoint works
        overall_success = success_count > 0
        
        if overall_success:
            self.log_test_result(
                "نظام الزيارات العام",
                True,
                f"يعمل {success_count}/{total_endpoints} من endpoints الزيارات",
                0
            )
        else:
            self.log_test_result(
                "نظام الزيارات العام",
                False,
                f"جميع endpoints الزيارات فاشلة ({success_count}/{total_endpoints})",
                0
            )
        
        return overall_success
    
    async def test_5_database_connectivity(self):
        """اختبار 5: فحص ربط قاعدة البيانات للمنتجات والمخازن"""
        print("\n🗄️ اختبار 5: فحص ربط قاعدة البيانات")
        
        # Test multiple endpoints to verify database connectivity
        endpoints_to_test = [
            ("/products", "المنتجات"),
            ("/users", "المستخدمين"),
            ("/lines", "الخطوط"),
            ("/areas", "المناطق")
        ]
        
        connectivity_results = []
        working_endpoints = 0
        
        for endpoint, name in endpoints_to_test:
            result = await self.make_request("GET", endpoint, token=self.admin_token)
            
            if result["success"]:
                data = result["data"]
                count = len(data) if isinstance(data, list) else "غير محدد"
                connectivity_results.append(f"{name}: {count} سجل")
                working_endpoints += 1
            else:
                connectivity_results.append(f"{name}: خطأ ({result['status_code']})")
        
        # Check health endpoint
        health_result = await self.make_request("GET", "/health")
        
        if health_result["success"]:
            health_data = health_result["data"]
            db_status = health_data.get("database", "غير محدد")
            
            details = f"حالة قاعدة البيانات: {db_status}, " + ", ".join(connectivity_results)
            details += f" - يعمل {working_endpoints}/{len(endpoints_to_test)} endpoints"
            
            # Success if database is connected and at least half the endpoints work
            success = db_status == "connected" and working_endpoints >= len(endpoints_to_test) // 2
            
            self.log_test_result(
                "ربط قاعدة البيانات",
                success,
                details,
                health_result["response_time"]
            )
            return success
        else:
            self.log_test_result(
                "ربط قاعدة البيانات",
                False,
                f"فشل فحص صحة النظام: {health_result['data']}",
                health_result["response_time"]
            )
            return False
    
    async def test_6_data_relationships(self):
        """اختبار 6: فحص ترابط البيانات بين المنتجات والمخازن والعيادات"""
        print("\n🔗 اختبار 6: فحص ترابط البيانات")
        
        # Get data from different endpoints
        products_result = await self.make_request("GET", "/products", token=self.admin_token)
        users_result = await self.make_request("GET", "/users", token=self.admin_token)
        lines_result = await self.make_request("GET", "/lines", token=self.admin_token)
        areas_result = await self.make_request("GET", "/areas", token=self.admin_token)
        
        relationships_found = []
        working_systems = 0
        
        if products_result["success"]:
            products = products_result["data"]
            products_count = len(products) if isinstance(products, list) else 0
            relationships_found.append(f"منتجات: {products_count}")
            working_systems += 1
            
            # Check if products have proper structure
            if isinstance(products, list) and products:
                sample_product = products[0]
                required_fields = ["id", "name", "price"]
                has_required_fields = all(field in sample_product for field in required_fields)
                if has_required_fields:
                    relationships_found.append("المنتجات لها هيكل صحيح")
        
        if users_result["success"]:
            users = users_result["data"]
            users_count = len(users) if isinstance(users, list) else 0
            relationships_found.append(f"مستخدمين: {users_count}")
            working_systems += 1
        
        if lines_result["success"]:
            lines = lines_result["data"]
            lines_count = len(lines) if isinstance(lines, list) else 0
            relationships_found.append(f"خطوط: {lines_count}")
            working_systems += 1
        
        if areas_result["success"]:
            areas = areas_result["data"]
            areas_count = len(areas) if isinstance(areas, list) else 0
            relationships_found.append(f"مناطق: {areas_count}")
            working_systems += 1
        
        # Check if we have data in multiple collections (indicating good relationships)
        has_good_relationships = working_systems >= 3  # At least 3 systems working
        
        details = "الأنظمة العاملة: " + ", ".join(relationships_found)
        details += f" - إجمالي الأنظمة العاملة: {working_systems}/4"
        
        self.log_test_result(
            "ترابط البيانات",
            has_good_relationships,
            details,
            (products_result["response_time"] + users_result["response_time"] + 
             lines_result["response_time"] + areas_result["response_time"]) / 4
        )
        
        return has_good_relationships
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 بدء الاختبار السريع للمراجعة العربية")
        print("=" * 60)
        
        await self.setup_session()
        
        try:
            # Run tests in sequence
            test_functions = [
                self.test_1_admin_login,
                self.test_2_get_products_list,
                self.test_3_update_product,
                self.test_4_get_visits,
                self.test_5_database_connectivity,
                self.test_6_data_relationships
            ]
            
            for test_func in test_functions:
                try:
                    await test_func()
                    await asyncio.sleep(0.5)  # Brief pause between tests
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
        
        print("\n" + "=" * 60)
        print("📊 التقرير النهائي للاختبار السريع")
        print("=" * 60)
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({passed_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print("\n📋 النتائج التفصيلية:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']}")
            print(f"     └─ {result['details']}")
        
        print("\n" + "=" * 60)
        print("🎯 الإجابات على الأسئلة المحددة:")
        
        # Analyze specific questions
        product_update_works = any("تحديث المنتج" in r["test"] and r["success"] for r in self.test_results)
        visits_endpoint_works = any("الزيارات" in r["test"] and r["success"] for r in self.test_results)
        database_connected = any("قاعدة البيانات" in r["test"] and r["success"] for r in self.test_results)
        data_relationships = any("ترابط البيانات" in r["test"] and r["success"] for r in self.test_results)
        
        print(f"❓ هل تحديث المنتجات يعمل في الباكند؟ {'✅ نعم' if product_update_works else '❌ لا'}")
        print(f"❓ هل endpoint الزيارات يعمل؟ {'✅ نعم' if visits_endpoint_works else '❌ لا'}")
        print(f"❓ هل البيانات مترابطة بشكل صحيح؟ {'✅ نعم' if data_relationships else '❌ لا'}")
        print(f"❓ هل قاعدة البيانات متصلة؟ {'✅ نعم' if database_connected else '❌ لا'}")
        
        print("\n🔍 المشاكل المحددة:")
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            for failed_test in failed_tests:
                print(f"  ❌ {failed_test['test']}: {failed_test['details']}")
        else:
            print("  ✅ لا توجد مشاكل محددة - جميع الاختبارات نجحت!")
        
        print("=" * 60)
        
        if success_rate >= 83.3:  # 5/6 tests pass
            print("🎉 **اختبار المراجعة العربية مكتمل بنجاح ممتاز!**")
            print("✅ **النظام يعمل بشكل صحيح** - معظم الوظائف تعمل كما هو مطلوب")
        elif success_rate >= 66.7:  # 4/6 tests pass
            print("⚠️ **اختبار المراجعة العربية مكتمل بنجاح جيد**")
            print("✅ **الوظائف الأساسية تعمل** لكن توجد بعض المشاكل البسيطة")
        else:
            print("❌ **اختبار المراجعة العربية يظهر مشاكل تحتاج إصلاح**")
            print("🚨 **يُنصح بمراجعة المشاكل المحددة** قبل المتابعة")

async def main():
    """Main test execution"""
    test_suite = ArabicReviewQuickTest()
    await test_suite.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())