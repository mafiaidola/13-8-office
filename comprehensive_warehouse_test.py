#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل نهائي لمشكلة المخازن والمنتجات
Comprehensive Final Test for Warehouse and Products Issue
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveWarehouseTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_time_ms": response_time
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        print(f"   📋 {details}")
    
    def login_admin(self):
        """تسجيل دخول الأدمن"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}"
                })
                
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    True,
                    f"تم الحصول على JWT token - المستخدم: {user_info.get('full_name', 'غير محدد')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    False,
                    f"فشل تسجيل الدخول - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "تسجيل دخول admin/admin123",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_warehouses_list(self):
        """اختبار GET /api/warehouses"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                
                warehouse_details = []
                for warehouse in warehouses:
                    details = {
                        "id": warehouse.get("id", "غير محدد"),
                        "name": warehouse.get("name", "غير محدد"),
                        "location": warehouse.get("location", "غير محدد"),
                        "manager": warehouse.get("manager_name", "غير محدد")
                    }
                    warehouse_details.append(details)
                
                self.log_test(
                    "GET /api/warehouses",
                    True,
                    f"تم جلب {warehouse_count} مخزن - التفاصيل: {json.dumps(warehouse_details, ensure_ascii=False)}",
                    response_time
                )
                return warehouses
            else:
                self.log_test(
                    "GET /api/warehouses",
                    False,
                    f"فشل جلب المخازن - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test(
                "GET /api/warehouses",
                False,
                f"خطأ في جلب المخازن: {str(e)}"
            )
            return []
    
    def test_warehouse_products(self, warehouse_id, warehouse_name):
        """اختبار GET /api/warehouses/{warehouse_id}/products"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                products = result.get("products", [])
                warehouse_info = result.get("warehouse", {})
                
                # تحليل البيانات للكشف عن المشكلة
                analysis = {
                    "warehouse_id": warehouse_id,
                    "warehouse_name": warehouse_info.get("name", warehouse_name),
                    "total_products": len(products),
                    "is_dummy_data": False,
                    "dummy_indicators": [],
                    "sample_products": []
                }
                
                # فحص أول 3 منتجات
                for i, product in enumerate(products[:3]):
                    product_info = {
                        "id": product.get("id", "غير محدد"),
                        "name": product.get("name", "غير محدد"),
                        "category": product.get("category", "غير محدد"),
                        "quantity": product.get("quantity", 0),
                        "price": product.get("price", 0)
                    }
                    analysis["sample_products"].append(product_info)
                    
                    # فحص مؤشرات البيانات الوهمية
                    product_name = str(product.get("name", "")).lower()
                    product_id = str(product.get("id", "")).lower()
                    
                    if any(indicator in product_name for indicator in ["منتج", "prod-", "test", "sample"]):
                        analysis["is_dummy_data"] = True
                        analysis["dummy_indicators"].append(f"اسم وهمي: {product.get('name')}")
                    
                    if any(indicator in product_id for indicator in ["prod-", "test-", "sample-"]):
                        analysis["is_dummy_data"] = True
                        analysis["dummy_indicators"].append(f"ID وهمي: {product.get('id')}")
                
                # فحص الأنماط المتسلسلة
                if len(products) > 1:
                    product_ids = [str(p.get("id", "")) for p in products[:5]]
                    sequential_pattern = all(f"prod-{i}" in pid for i, pid in enumerate(product_ids, 1))
                    if sequential_pattern:
                        analysis["is_dummy_data"] = True
                        analysis["dummy_indicators"].append("IDs متسلسلة (prod-1, prod-2, ...)")
                
                # تحديد نوع البيانات
                if analysis["is_dummy_data"]:
                    data_type = "🚨 بيانات وهمية مُولدة تلقائياً"
                else:
                    data_type = "✅ بيانات حقيقية من قاعدة البيانات"
                
                self.log_test(
                    f"GET /api/warehouses/{warehouse_id}/products",
                    True,
                    f"{data_type} - المخزن: {analysis['warehouse_name']} - المنتجات: {analysis['total_products']} - مؤشرات المشكلة: {analysis['dummy_indicators']} - عينة: {json.dumps(analysis['sample_products'], ensure_ascii=False)}",
                    response_time
                )
                
                return analysis
            else:
                self.log_test(
                    f"GET /api/warehouses/{warehouse_id}/products",
                    False,
                    f"فشل جلب منتجات المخزن - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                f"GET /api/warehouses/{warehouse_id}/products",
                False,
                f"خطأ في جلب منتجات المخزن: {str(e)}"
            )
            return None
    
    def test_products_api(self):
        """اختبار GET /api/products"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل المنتجات الحقيقية
                real_products_sample = []
                categories = set()
                
                for product in products[:3]:
                    product_info = {
                        "id": product.get("id", "غير محدد"),
                        "name": product.get("name", "غير محدد"),
                        "category": product.get("category", "غير محدد"),
                        "price": product.get("price", 0),
                        "stock": product.get("current_stock", 0)
                    }
                    real_products_sample.append(product_info)
                    categories.add(product.get("category", "غير محدد"))
                
                self.log_test(
                    "GET /api/products",
                    True,
                    f"المنتجات الحقيقية: {product_count} منتج - الفئات: {list(categories)} - عينة: {json.dumps(real_products_sample, ensure_ascii=False)}",
                    response_time
                )
                return products
            else:
                self.log_test(
                    "GET /api/products",
                    False,
                    f"فشل جلب المنتجات - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test(
                "GET /api/products",
                False,
                f"خطأ في جلب المنتجات: {str(e)}"
            )
            return []
    
    def test_product_management_apis(self):
        """اختبار APIs إدارة المنتجات"""
        # Test POST /api/products
        try:
            new_product = {
                "name": "منتج اختبار المخازن",
                "category": "أدوية الاختبار",
                "description": "منتج لاختبار مشكلة المخازن",
                "unit": "علبة",
                "price": 99.99,
                "current_stock": 100,
                "min_stock": 10,
                "is_active": True,
                "line_id": "line_001"  # إضافة line_id المطلوب
            }
            
            start_time = time.time()
            response = self.session.post(f"{BACKEND_URL}/products", json=new_product)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                result = response.json()
                product_id = result.get("product", {}).get("id") or result.get("id")
                
                self.log_test(
                    "POST /api/products",
                    True,
                    f"تم إنشاء منتج جديد بنجاح - ID: {product_id} - الاسم: {new_product['name']}",
                    response_time
                )
                return product_id
            else:
                self.log_test(
                    "POST /api/products",
                    False,
                    f"فشل إنشاء المنتج - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "POST /api/products",
                False,
                f"خطأ في إنشاء المنتج: {str(e)}"
            )
            return None
    
    def test_warehouse_management_apis(self):
        """اختبار APIs إدارة المخازن المفقودة"""
        missing_apis = []
        
        # Test POST /api/warehouses
        try:
            test_data = {
                "name": "مخزن اختبار API",
                "location": "القاهرة - اختبار",
                "manager_name": "مدير الاختبار",
                "description": "مخزن لاختبار POST API"
            }
            
            start_time = time.time()
            response = self.session.post(f"{BACKEND_URL}/warehouses", json=test_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 405:  # Method Not Allowed
                missing_apis.append("POST /api/warehouses")
                self.log_test(
                    "POST /api/warehouses",
                    False,
                    "API غير مطبق - Method Not Allowed (405) - لا يمكن إضافة مخازن جديدة",
                    response_time
                )
            elif response.status_code in [200, 201]:
                self.log_test(
                    "POST /api/warehouses",
                    True,
                    "API متاح ويعمل - يمكن إضافة مخازن جديدة",
                    response_time
                )
            else:
                self.log_test(
                    "POST /api/warehouses",
                    False,
                    f"API يعطي خطأ - HTTP {response.status_code}: {response.text}",
                    response_time
                )
        except Exception as e:
            missing_apis.append("POST /api/warehouses")
            self.log_test(
                "POST /api/warehouses",
                False,
                f"API غير متاح: {str(e)}"
            )
        
        # Test DELETE /api/warehouses/{id}
        try:
            start_time = time.time()
            response = self.session.delete(f"{BACKEND_URL}/warehouses/test_id")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 405:  # Method Not Allowed
                missing_apis.append("DELETE /api/warehouses")
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    False,
                    "API غير مطبق - Method Not Allowed (405) - لا يمكن حذف المخازن",
                    response_time
                )
            elif response.status_code in [200, 404]:  # 404 is OK for non-existent ID
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    True,
                    "API متاح ويعمل - يمكن حذف المخازن",
                    response_time
                )
            else:
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    False,
                    f"API يعطي خطأ - HTTP {response.status_code}: {response.text}",
                    response_time
                )
        except Exception as e:
            missing_apis.append("DELETE /api/warehouses")
            self.log_test(
                "DELETE /api/warehouses/{id}",
                False,
                f"API غير متاح: {str(e)}"
            )
        
        return missing_apis
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 اختبار شامل لمشكلة إدارة المخازن والمنتجات المبلغ عنها من المستخدم")
        print("=" * 90)
        print("المشكلة: 'جميع المخازن تأتى بأسماء وبيانات المنتجات من قسم إدارة المنتجات'")
        print("الهدف: تحديد المشكلة في ربط المخازن بالمنتجات والتأكد من وجود APIs لإدارة المخازن")
        print("=" * 90)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        print("\n📦 اختبار جلب قائمة المخازن:")
        print("-" * 50)
        
        # 2. جلب قائمة المخازن
        warehouses = self.test_warehouses_list()
        
        print("\n🔬 اختبار منتجات المخازن (فحص البيانات الوهمية):")
        print("-" * 50)
        
        # 3. اختبار منتجات كل مخزن
        warehouse_analyses = []
        for warehouse in warehouses:
            warehouse_id = warehouse.get("id")
            warehouse_name = warehouse.get("name", "غير محدد")
            
            if warehouse_id:
                analysis = self.test_warehouse_products(warehouse_id, warehouse_name)
                if analysis:
                    warehouse_analyses.append(analysis)
        
        print("\n📊 اختبار المنتجات الحقيقية:")
        print("-" * 50)
        
        # 4. جلب المنتجات الحقيقية
        real_products = self.test_products_api()
        
        print("\n🏭 اختبار إدارة المنتجات:")
        print("-" * 50)
        
        # 5. اختبار إنشاء منتج جديد
        new_product_id = self.test_product_management_apis()
        
        print("\n🔧 اختبار APIs إدارة المخازن:")
        print("-" * 50)
        
        # 6. اختبار APIs المفقودة
        missing_apis = self.test_warehouse_management_apis()
        
        # 7. تحليل النتائج النهائية
        self.analyze_comprehensive_results(warehouse_analyses, real_products, missing_apis)
    
    def analyze_comprehensive_results(self, warehouse_analyses, real_products, missing_apis):
        """تحليل النتائج الشاملة"""
        print("\n" + "=" * 90)
        print("📊 التقرير النهائي الشامل - مشكلة إدارة المخازن والمنتجات:")
        print("=" * 90)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح الإجمالي: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        
        # تحليل المشكلة الأساسية
        print(f"\n🚨 تحليل المشكلة المبلغ عنها:")
        print("-" * 70)
        
        dummy_data_confirmed = False
        affected_warehouses = []
        
        for analysis in warehouse_analyses:
            if analysis.get("is_dummy_data"):
                dummy_data_confirmed = True
                affected_warehouses.append({
                    "id": analysis["warehouse_id"],
                    "name": analysis["warehouse_name"],
                    "products_count": analysis["total_products"],
                    "indicators": analysis["dummy_indicators"]
                })
        
        if dummy_data_confirmed:
            print("🚨 المشكلة مؤكدة: endpoint /api/warehouses/{id}/products يعرض بيانات وهمية!")
            print(f"   📋 المخازن المتأثرة: {len(affected_warehouses)}")
            for warehouse in affected_warehouses:
                print(f"      - {warehouse['name']} (ID: {warehouse['id']}): {warehouse['products_count']} منتج وهمي")
                print(f"        مؤشرات المشكلة: {warehouse['indicators']}")
            
            print("\n   💡 السبب الجذري:")
            print("      - الكود في server.py (lines 3184-3194) يُولد بيانات وهمية")
            print("      - لا يتم جلب المنتجات الحقيقية من قاعدة البيانات")
            print("      - المخازن غير مرتبطة بالمنتجات الحقيقية")
            
        else:
            print("✅ لم يتم العثور على بيانات وهمية في المخازن")
        
        # مقارنة مع المنتجات الحقيقية
        if real_products:
            print(f"\n📊 مقارنة مع المنتجات الحقيقية:")
            print("-" * 70)
            print(f"   📦 المنتجات الحقيقية في النظام: {len(real_products)}")
            
            if dummy_data_confirmed:
                total_dummy_products = sum(w["products_count"] for w in affected_warehouses)
                print(f"   🚨 المنتجات الوهمية المعروضة في المخازن: {total_dummy_products}")
                print("   💡 النتيجة: المخازن تعرض بيانات وهمية بدلاً من المنتجات الحقيقية!")
                print("   🔗 المطلوب: ربط المخازن بالمنتجات الحقيقية من قاعدة البيانات")
        
        # تحليل APIs المفقودة
        print(f"\n🔧 تحليل APIs إدارة المخازن:")
        print("-" * 70)
        
        if missing_apis:
            print(f"🚨 APIs مفقودة ({len(missing_apis)}):")
            for api in missing_apis:
                print(f"   ❌ {api}")
            print("   💡 النتيجة: لا يمكن إدارة المخازن بشكل احترافي (إضافة/حذف)")
            print("   🔗 المطلوب: تطوير APIs إدارة المخازن المفقودة")
        else:
            print("✅ جميع APIs إدارة المخازن متاحة")
        
        # الحلول المطلوبة
        print(f"\n🎯 الحلول المطلوبة لإصلاح المشكلة:")
        print("-" * 70)
        
        solution_count = 1
        
        if dummy_data_confirmed:
            print(f"{solution_count}. 🔧 إصلاح endpoint GET /api/warehouses/{{id}}/products:")
            print("   - إزالة الكود الذي يُولد بيانات وهمية (lines 3184-3194 في server.py)")
            print("   - ربط المخزن بالمنتجات الحقيقية من قاعدة البيانات")
            print("   - استخدام استعلام MongoDB: db.products.find({'warehouse_id': warehouse_id})")
            print("   - إضافة حقل warehouse_id للمنتجات في قاعدة البيانات")
            solution_count += 1
        
        if missing_apis:
            print(f"{solution_count}. 🏗️ تطوير APIs إدارة المخازن المفقودة:")
            for api in missing_apis:
                print(f"   - {api}")
            print("   - إضافة validation للبيانات")
            print("   - إضافة صلاحيات المستخدمين")
            solution_count += 1
        
        print(f"{solution_count}. 🔗 تحسين نظام ربط المخازن بالمنتجات:")
        print("   - إضافة حقل warehouse_id للمنتجات")
        print("   - تطوير نظام توزيع المنتجات على المخازن")
        print("   - إضافة واجهة لإدارة توزيع المنتجات")
        print("   - تطوير تقارير المخزون لكل مخزن")
        
        # التقييم النهائي
        print(f"\n🏆 التقييم النهائي:")
        print("-" * 70)
        
        if dummy_data_confirmed and missing_apis:
            print("🚨 مشكلة حرجة: البيانات الوهمية + APIs مفقودة")
            print("   📋 الأولوية: عالية جداً - يحتاج إصلاح فوري")
            print("   ⏰ الوقت المقدر للإصلاح: 2-3 أيام عمل")
        elif dummy_data_confirmed:
            print("⚠️ مشكلة متوسطة: البيانات الوهمية فقط")
            print("   📋 الأولوية: عالية - يحتاج إصلاح")
            print("   ⏰ الوقت المقدر للإصلاح: 1-2 يوم عمل")
        elif missing_apis:
            print("⚠️ مشكلة متوسطة: APIs مفقودة فقط")
            print("   📋 الأولوية: متوسطة - يحتاج تطوير")
            print("   ⏰ الوقت المقدر للتطوير: 1-2 يوم عمل")
        else:
            print("✅ لا توجد مشاكل حرجة")
            print("   📋 الأولوية: منخفضة - تحسينات اختيارية")
        
        # إحصائيات الأداء
        response_times = [result["response_time_ms"] for result in self.test_results if result["response_time_ms"]]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"\n⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        total_time = time.time() - self.start_time
        print(f"⏱️ إجمالي وقت الاختبار: {total_time:.2f}s")
        
        # رسالة ختامية
        print(f"\n📝 ملخص المشكلة المبلغ عنها:")
        print("   'جميع المخازن تأتى بأسماء وبيانات المنتجات من قسم إدارة المنتجات'")
        
        if dummy_data_confirmed:
            print("   ✅ المشكلة مؤكدة ومحددة بدقة")
            print("   🔧 الحل: إصلاح endpoint المنتجات وربطه بقاعدة البيانات الحقيقية")
            print("   📋 التأثير: المستخدم سيرى المنتجات الحقيقية في كل مخزن بدلاً من البيانات الوهمية")
        else:
            print("   ⚠️ المشكلة غير مؤكدة - قد تحتاج فحص إضافي")
        
        if missing_apis:
            print("   🔧 إضافة APIs إدارة المخازن ستمكن المستخدم من إضافة وحذف المخازن بشكل احترافي")

def main():
    """تشغيل الاختبار الشامل"""
    tester = ComprehensiveWarehouseTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()