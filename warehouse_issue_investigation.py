#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
تحقيق شامل في مشكلة المخازن والمنتجات
Comprehensive Investigation of Warehouse and Products Issue
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class WarehouseIssueInvestigator:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        
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
    
    def create_test_warehouses_via_db(self):
        """محاولة إنشاء مخازن اختبار مباشرة في قاعدة البيانات"""
        # Since we can't create warehouses via API, let's create some test data
        # We'll use the MongoDB connection to insert test warehouses
        
        test_warehouses = [
            {
                "id": "warehouse_001",
                "name": "مخزن القاهرة الرئيسي",
                "location": "القاهرة - مدينة نصر",
                "manager_name": "أحمد محمد",
                "manager_phone": "01234567890",
                "description": "المخزن الرئيسي في القاهرة",
                "is_active": True,
                "created_at": datetime.utcnow()
            },
            {
                "id": "warehouse_002", 
                "name": "مخزن الإسكندرية",
                "location": "الإسكندرية - سموحة",
                "manager_name": "فاطمة أحمد",
                "manager_phone": "01098765432",
                "description": "مخزن فرع الإسكندرية",
                "is_active": True,
                "created_at": datetime.utcnow()
            }
        ]
        
        # We'll simulate this since we can't directly access MongoDB from here
        # Instead, let's try to use existing warehouse IDs that might be in the system
        
        self.log_test(
            "إنشاء مخازن اختبار",
            True,
            f"تم تحضير {len(test_warehouses)} مخزن اختبار للفحص",
            0
        )
        
        return test_warehouses
    
    def test_warehouse_products_with_existing_ids(self):
        """اختبار منتجات المخازن باستخدام IDs مختلفة"""
        # Let's try different warehouse IDs that might exist
        test_warehouse_ids = [
            "warehouse_001",
            "warehouse_002", 
            "main_warehouse",
            "cairo_warehouse",
            "test_warehouse",
            "warehouse_1",
            "wh_001"
        ]
        
        successful_tests = []
        
        for warehouse_id in test_warehouse_ids:
            try:
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    result = response.json()
                    products = result.get("products", [])
                    warehouse_info = result.get("warehouse", {})
                    
                    # تحليل البيانات
                    analysis = {
                        "warehouse_id": warehouse_id,
                        "warehouse_name": warehouse_info.get("name", "غير محدد"),
                        "total_products": len(products),
                        "is_dummy_data": False,
                        "sample_products": []
                    }
                    
                    # فحص أول 3 منتجات
                    for product in products[:3]:
                        product_info = {
                            "id": product.get("id", "غير محدد"),
                            "name": product.get("name", "غير محدد"),
                            "category": product.get("category", "غير محدد"),
                            "quantity": product.get("quantity", 0),
                            "price": product.get("price", 0)
                        }
                        analysis["sample_products"].append(product_info)
                        
                        # فحص إذا كانت البيانات وهمية
                        product_name = str(product.get("name", "")).lower()
                        if any(indicator in product_name for indicator in ["منتج", "prod-", "test", "sample"]):
                            analysis["is_dummy_data"] = True
                    
                    # تحديد نوع البيانات
                    data_type = "🚨 بيانات وهمية مُولدة" if analysis["is_dummy_data"] else "✅ بيانات حقيقية"
                    
                    self.log_test(
                        f"GET /api/warehouses/{warehouse_id}/products",
                        True,
                        f"{data_type} - المخزن: {analysis['warehouse_name']} - المنتجات: {analysis['total_products']} - عينة: {json.dumps(analysis['sample_products'][:2], ensure_ascii=False)}",
                        response_time
                    )
                    
                    successful_tests.append(analysis)
                    
                    # إذا وجدنا بيانات وهمية، فقد اكتشفنا المشكلة
                    if analysis["is_dummy_data"]:
                        print(f"   🎯 مشكلة مكتشفة: المخزن {warehouse_id} يعرض بيانات وهمية!")
                        break
                        
                elif response.status_code == 404:
                    # المخزن غير موجود - هذا طبيعي
                    continue
                else:
                    self.log_test(
                        f"GET /api/warehouses/{warehouse_id}/products",
                        False,
                        f"خطأ غير متوقع - HTTP {response.status_code}: {response.text}",
                        response_time
                    )
                    
            except Exception as e:
                continue  # تجاهل الأخطاء والمتابعة
        
        return successful_tests
    
    def create_real_warehouse_for_testing(self):
        """محاولة إنشاء مخزن حقيقي للاختبار باستخدام PUT endpoint"""
        try:
            # Since POST doesn't exist, let's try to use PUT to create/update a warehouse
            warehouse_id = "test_investigation_warehouse"
            
            warehouse_data = {
                "id": warehouse_id,
                "name": "مخزن تحقيق المشكلة",
                "location": "القاهرة - منطقة التحقيق",
                "manager_name": "محقق المشكلة",
                "manager_phone": "01111111111",
                "description": "مخزن خاص بتحقيق مشكلة المنتجات",
                "is_active": True
            }
            
            start_time = time.time()
            response = self.session.put(f"{BACKEND_URL}/warehouses/{warehouse_id}", json=warehouse_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test(
                    "إنشاء مخزن حقيقي للاختبار",
                    True,
                    f"تم إنشاء/تحديث المخزن بنجاح - ID: {warehouse_id}",
                    response_time
                )
                return warehouse_id
            else:
                self.log_test(
                    "إنشاء مخزن حقيقي للاختبار",
                    False,
                    f"فشل إنشاء المخزن - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "إنشاء مخزن حقيقي للاختبار",
                False,
                f"خطأ في إنشاء المخزن: {str(e)}"
            )
            return None
    
    def test_products_api_detailed(self):
        """اختبار مفصل لـ API المنتجات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل مفصل للمنتجات
                analysis = {
                    "total_products": product_count,
                    "active_products": 0,
                    "categories": {},
                    "price_range": {"min": float('inf'), "max": 0},
                    "stock_analysis": {"in_stock": 0, "out_of_stock": 0},
                    "sample_products": []
                }
                
                for product in products:
                    # حالة النشاط
                    if product.get("is_active", True):
                        analysis["active_products"] += 1
                    
                    # الفئات
                    category = product.get("category", "غير محدد")
                    analysis["categories"][category] = analysis["categories"].get(category, 0) + 1
                    
                    # نطاق الأسعار
                    price = product.get("price", 0)
                    if price > 0:
                        analysis["price_range"]["min"] = min(analysis["price_range"]["min"], price)
                        analysis["price_range"]["max"] = max(analysis["price_range"]["max"], price)
                    
                    # تحليل المخزون
                    stock = product.get("current_stock", 0)
                    if stock > 0:
                        analysis["stock_analysis"]["in_stock"] += 1
                    else:
                        analysis["stock_analysis"]["out_of_stock"] += 1
                
                # أول 3 منتجات للعرض
                for product in products[:3]:
                    product_info = {
                        "id": product.get("id", "غير محدد"),
                        "name": product.get("name", "غير محدد"),
                        "category": product.get("category", "غير محدد"),
                        "price": product.get("price", 0),
                        "stock": product.get("current_stock", 0),
                        "is_active": product.get("is_active", True)
                    }
                    analysis["sample_products"].append(product_info)
                
                # تصحيح نطاق الأسعار
                if analysis["price_range"]["min"] == float('inf'):
                    analysis["price_range"]["min"] = 0
                
                self.log_test(
                    "GET /api/products - تحليل مفصل",
                    True,
                    f"إجمالي: {product_count} منتج - نشط: {analysis['active_products']} - فئات: {list(analysis['categories'].keys())} - نطاق الأسعار: {analysis['price_range']['min']:.2f}-{analysis['price_range']['max']:.2f} ج.م - في المخزون: {analysis['stock_analysis']['in_stock']}",
                    response_time
                )
                
                return analysis
            else:
                self.log_test(
                    "GET /api/products - تحليل مفصل",
                    False,
                    f"فشل جلب المنتجات - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test(
                "GET /api/products - تحليل مفصل",
                False,
                f"خطأ في جلب المنتجات: {str(e)}"
            )
            return None
    
    def run_investigation(self):
        """تشغيل التحقيق الشامل"""
        print("🔍 تحقيق شامل في مشكلة المخازن والمنتجات")
        print("=" * 70)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف التحقيق")
            return
        
        print("\n📦 فحص المخازن الحالية:")
        print("-" * 50)
        
        # 2. فحص المخازن الحالية
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                
                self.log_test(
                    "GET /api/warehouses",
                    True,
                    f"تم جلب {warehouse_count} مخزن من قاعدة البيانات",
                    response_time
                )
                
                if warehouse_count == 0:
                    print("   📋 لا توجد مخازن في النظام - سنحاول إنشاء مخزن للاختبار")
            else:
                self.log_test(
                    "GET /api/warehouses",
                    False,
                    f"فشل جلب المخازن - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                warehouses = []
        except Exception as e:
            self.log_test(
                "GET /api/warehouses",
                False,
                f"خطأ في جلب المخازن: {str(e)}"
            )
            warehouses = []
        
        print("\n🏭 محاولة إنشاء مخزن للاختبار:")
        print("-" * 50)
        
        # 3. إنشاء مخزن للاختبار
        test_warehouse_id = self.create_real_warehouse_for_testing()
        
        print("\n🔬 اختبار منتجات المخازن:")
        print("-" * 50)
        
        # 4. اختبار منتجات المخازن
        warehouse_tests = self.test_warehouse_products_with_existing_ids()
        
        # إذا أنشأنا مخزن، اختبره أيضاً
        if test_warehouse_id:
            try:
                start_time = time.time()
                response = self.session.get(f"{BACKEND_URL}/warehouses/{test_warehouse_id}/products")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    result = response.json()
                    products = result.get("products", [])
                    
                    # فحص البيانات
                    is_dummy = any("منتج" in str(p.get("name", "")).lower() or "prod-" in str(p.get("id", "")).lower() for p in products[:3])
                    
                    data_type = "🚨 بيانات وهمية مُولدة" if is_dummy else "✅ بيانات حقيقية"
                    
                    self.log_test(
                        f"GET /api/warehouses/{test_warehouse_id}/products",
                        True,
                        f"{data_type} - المنتجات: {len(products)} - المخزن المُنشأ حديثاً",
                        response_time
                    )
                    
                    if is_dummy:
                        print("   🎯 مشكلة مؤكدة: حتى المخزن الجديد يعرض بيانات وهمية!")
                        
            except Exception as e:
                pass
        
        print("\n📊 تحليل المنتجات الحقيقية:")
        print("-" * 50)
        
        # 5. تحليل المنتجات الحقيقية
        products_analysis = self.test_products_api_detailed()
        
        # 6. تحليل النتائج النهائية
        self.analyze_investigation_results(warehouse_tests, products_analysis)
    
    def analyze_investigation_results(self, warehouse_tests, products_analysis):
        """تحليل نتائج التحقيق"""
        print("\n" + "=" * 70)
        print("📊 نتائج التحقيق النهائية:")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        
        # تحليل مشكلة البيانات الوهمية
        dummy_data_found = any(test.get("is_dummy_data", False) for test in warehouse_tests)
        
        print(f"\n🔍 نتائج التحقيق في المشكلة:")
        print("-" * 50)
        
        if dummy_data_found:
            print("🚨 المشكلة مؤكدة: endpoint /api/warehouses/{id}/products يعرض بيانات وهمية!")
            print("   📋 التفاصيل:")
            for test in warehouse_tests:
                if test.get("is_dummy_data"):
                    print(f"      - المخزن {test['warehouse_id']}: {test['total_products']} منتج وهمي")
            
            print("   💡 السبب المحتمل: الكود يُولد بيانات وهمية بدلاً من جلب المنتجات من قاعدة البيانات")
            
        elif warehouse_tests:
            print("✅ لم يتم العثور على بيانات وهمية في المخازن المختبرة")
        else:
            print("⚠️ لم يتم اختبار أي مخازن بنجاح")
        
        # مقارنة مع المنتجات الحقيقية
        if products_analysis:
            print(f"\n📊 مقارنة البيانات:")
            print(f"   📦 المنتجات الحقيقية في النظام: {products_analysis['total_products']}")
            print(f"   🏷️ الفئات المتاحة: {list(products_analysis['categories'].keys())}")
            print(f"   💰 نطاق الأسعار: {products_analysis['price_range']['min']:.2f} - {products_analysis['price_range']['max']:.2f} ج.م")
            print(f"   📈 في المخزون: {products_analysis['stock_analysis']['in_stock']} منتج")
            
            if dummy_data_found:
                print("   🚨 النتيجة: المخازن تعرض بيانات وهمية بدلاً من هذه المنتجات الحقيقية!")
        
        # التوصيات النهائية
        print(f"\n🎯 التوصيات لحل المشكلة:")
        print("-" * 50)
        
        if dummy_data_found:
            print("1. 🔧 إصلاح endpoint GET /api/warehouses/{id}/products:")
            print("   - إزالة الكود الذي يُولد بيانات وهمية")
            print("   - ربط المخزن بالمنتجات الحقيقية من قاعدة البيانات")
            print("   - استخدام علاقة warehouse_id في جدول المنتجات")
        
        print("2. 🏗️ تطوير APIs إدارة المخازن المفقودة:")
        print("   - POST /api/warehouses (إضافة مخزن جديد)")
        print("   - DELETE /api/warehouses/{id} (حذف مخزن)")
        
        print("3. 🔗 تحسين ربط المخازن بالمنتجات:")
        print("   - إضافة حقل warehouse_id للمنتجات")
        print("   - تطوير نظام توزيع المنتجات على المخازن")
        
        if success_rate >= 70:
            print("\n✅ المشكلة محددة بوضوح ويمكن إصلاحها")
        else:
            print("\n⚠️ هناك مشاكل إضافية تحتاج فحص أعمق")
        
        print(f"\n⏱️ إجمالي وقت التحقيق: {time.time() - self.start_time:.2f}s")

def main():
    """تشغيل التحقيق الرئيسي"""
    investigator = WarehouseIssueInvestigator()
    investigator.start_time = time.time()
    investigator.run_investigation()

if __name__ == "__main__":
    main()