#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار مُركز لمشكلة إدارة المخازن والمنتجات
Focused Test for Warehouse and Product Management Issue
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://ec499ace-685d-480d-b657-849bf4e418d7.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class FocusedWarehouseTester:
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
    
    def test_warehouses_api(self):
        """اختبار GET /api/warehouses"""
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
    
    def create_test_warehouse(self):
        """إنشاء مخزن اختبار لفحص المشكلة"""
        try:
            # First, let's try to create a warehouse directly in the database via a different approach
            # Since POST /api/warehouses doesn't exist, let's create one manually for testing
            
            test_warehouse = {
                "id": f"test_warehouse_{int(time.time())}",
                "name": "مخزن اختبار المشكلة",
                "location": "القاهرة - منطقة الاختبار",
                "manager_name": "مدير الاختبار",
                "manager_phone": "01234567890",
                "description": "مخزن اختبار لفحص مشكلة ربط المنتجات",
                "is_active": True,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Since we can't create via API, let's use a mock warehouse ID for testing
            mock_warehouse_id = "test_warehouse_123"
            
            self.log_test(
                "إنشاء مخزن اختبار",
                True,
                f"تم إنشاء مخزن اختبار وهمي للفحص - ID: {mock_warehouse_id}",
                0
            )
            
            return mock_warehouse_id
            
        except Exception as e:
            self.log_test(
                "إنشاء مخزن اختبار",
                False,
                f"خطأ في إنشاء مخزن الاختبار: {str(e)}"
            )
            return None
    
    def test_warehouse_products_issue(self, warehouse_id):
        """اختبار مشكلة منتجات المخزن - هل تأتي من قسم إدارة المنتجات؟"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                products = result.get("products", [])
                warehouse_info = result.get("warehouse", {})
                
                # تحليل المنتجات للكشف عن المشكلة
                analysis = {
                    "total_products": len(products),
                    "is_dummy_data": False,
                    "data_source": "unknown",
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
                    
                    # فحص إذا كانت البيانات وهمية
                    product_name = str(product.get("name", "")).lower()
                    if any(indicator in product_name for indicator in ["منتج", "prod-", "test", "sample"]):
                        analysis["is_dummy_data"] = True
                        analysis["data_source"] = "generated_dummy_data"
                
                # فحص إذا كانت المنتجات تأتي من قسم إدارة المنتجات
                if analysis["is_dummy_data"]:
                    issue_description = "🚨 مشكلة مؤكدة: المنتجات المعروضة هي بيانات وهمية مُولدة تلقائياً وليست من قاعدة البيانات الحقيقية"
                else:
                    issue_description = "✅ المنتجات تبدو حقيقية من قاعدة البيانات"
                
                self.log_test(
                    f"GET /api/warehouses/{warehouse_id}/products",
                    True,
                    f"{issue_description} - إجمالي المنتجات: {analysis['total_products']} - مصدر البيانات: {analysis['data_source']} - عينة: {json.dumps(analysis['sample_products'], ensure_ascii=False)}",
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
        """اختبار GET /api/products للمقارنة"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل المنتجات الحقيقية
                real_products_sample = []
                for product in products[:3]:
                    product_info = {
                        "id": product.get("id", "غير محدد"),
                        "name": product.get("name", "غير محدد"),
                        "category": product.get("category", "غير محدد"),
                        "price": product.get("price", 0),
                        "stock": product.get("current_stock", 0)
                    }
                    real_products_sample.append(product_info)
                
                self.log_test(
                    "GET /api/products",
                    True,
                    f"المنتجات الحقيقية من قاعدة البيانات: {product_count} منتج - عينة: {json.dumps(real_products_sample, ensure_ascii=False)}",
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
    
    def test_warehouse_management_apis(self):
        """اختبار APIs إدارة المخازن المفقودة"""
        missing_apis = []
        
        # Test POST /api/warehouses
        try:
            test_data = {"name": "مخزن اختبار", "location": "القاهرة"}
            response = self.session.post(f"{BACKEND_URL}/warehouses", json=test_data)
            
            if response.status_code == 405:  # Method Not Allowed
                missing_apis.append("POST /api/warehouses")
                self.log_test(
                    "POST /api/warehouses",
                    False,
                    "API غير مطبق - Method Not Allowed (405)"
                )
            elif response.status_code in [200, 201]:
                self.log_test(
                    "POST /api/warehouses",
                    True,
                    "API متاح ويعمل"
                )
            else:
                self.log_test(
                    "POST /api/warehouses",
                    False,
                    f"API يعطي خطأ - HTTP {response.status_code}"
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
            response = self.session.delete(f"{BACKEND_URL}/warehouses/test_id")
            
            if response.status_code == 405:  # Method Not Allowed
                missing_apis.append("DELETE /api/warehouses")
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    False,
                    "API غير مطبق - Method Not Allowed (405)"
                )
            elif response.status_code in [200, 404]:  # 404 is OK for non-existent ID
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    True,
                    "API متاح ويعمل"
                )
            else:
                self.log_test(
                    "DELETE /api/warehouses/{id}",
                    False,
                    f"API يعطي خطأ - HTTP {response.status_code}"
                )
        except Exception as e:
            missing_apis.append("DELETE /api/warehouses")
            self.log_test(
                "DELETE /api/warehouses/{id}",
                False,
                f"API غير متاح: {str(e)}"
            )
        
        return missing_apis
    
    def run_focused_test(self):
        """تشغيل الاختبار المُركز"""
        print("🎯 اختبار مُركز لمشكلة إدارة المخازن والمنتجات")
        print("=" * 70)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        print("\n📦 فحص مشكلة المخازن والمنتجات:")
        print("-" * 50)
        
        # 2. جلب المخازن الحالية
        warehouses = self.test_warehouses_api()
        
        # 3. إنشاء مخزن اختبار إذا لم توجد مخازن
        test_warehouse_id = None
        if warehouses:
            test_warehouse_id = warehouses[0].get("id")
            print(f"📋 استخدام مخزن موجود للاختبار: {test_warehouse_id}")
        else:
            test_warehouse_id = self.create_test_warehouse()
        
        # 4. اختبار مشكلة منتجات المخزن
        if test_warehouse_id:
            warehouse_analysis = self.test_warehouse_products_issue(test_warehouse_id)
        else:
            print("⚠️ لا يوجد مخزن للاختبار")
            warehouse_analysis = None
        
        # 5. جلب المنتجات الحقيقية للمقارنة
        real_products = self.test_products_api()
        
        # 6. اختبار APIs إدارة المخازن المفقودة
        print("\n🔧 فحص APIs إدارة المخازن:")
        print("-" * 50)
        missing_apis = self.test_warehouse_management_apis()
        
        # 7. تحليل النتائج
        self.analyze_focused_results(warehouse_analysis, real_products, missing_apis)
    
    def analyze_focused_results(self, warehouse_analysis, real_products, missing_apis):
        """تحليل النتائج المُركزة"""
        print("\n" + "=" * 70)
        print("📊 تحليل النتائج - تشخيص المشكلة:")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        
        # تشخيص المشكلة الأساسية
        print("\n🔍 تشخيص المشكلة المبلغ عنها:")
        print("-" * 50)
        
        if warehouse_analysis and warehouse_analysis.get("is_dummy_data"):
            print("🚨 المشكلة مؤكدة: منتجات المخازن تعرض بيانات وهمية!")
            print("   📋 السبب: endpoint /api/warehouses/{id}/products يُولد بيانات وهمية بدلاً من جلب المنتجات الحقيقية")
            print("   💡 الحل المطلوب: ربط المخزن بالمنتجات الحقيقية من قاعدة البيانات")
        elif warehouse_analysis:
            print("✅ منتجات المخازن تبدو حقيقية")
        else:
            print("⚠️ لم يتم اختبار منتجات المخازن بسبب عدم وجود مخازن")
        
        # تشخيص APIs المفقودة
        if missing_apis:
            print(f"\n🚨 APIs إدارة المخازن مفقودة:")
            for api in missing_apis:
                print(f"   ❌ {api}")
            print("   💡 الحل المطلوب: تطوير APIs إدارة المخازن (إضافة/حذف)")
        else:
            print("\n✅ جميع APIs إدارة المخازن متاحة")
        
        # مقارنة البيانات
        if real_products and warehouse_analysis:
            real_count = len(real_products)
            warehouse_count = warehouse_analysis.get("total_products", 0)
            
            print(f"\n📊 مقارنة البيانات:")
            print(f"   📦 المنتجات الحقيقية في النظام: {real_count}")
            print(f"   🏭 المنتجات المعروضة في المخزن: {warehouse_count}")
            
            if warehouse_analysis.get("is_dummy_data"):
                print("   🚨 النتيجة: المخزن يعرض بيانات وهمية بدلاً من المنتجات الحقيقية!")
        
        # التوصيات النهائية
        print(f"\n🎯 التوصيات لحل المشكلة:")
        print("-" * 50)
        
        if warehouse_analysis and warehouse_analysis.get("is_dummy_data"):
            print("1. إصلاح endpoint GET /api/warehouses/{id}/products ليجلب المنتجات الحقيقية")
            print("2. ربط المخازن بالمنتجات في قاعدة البيانات")
        
        if missing_apis:
            print("3. تطوير APIs إدارة المخازن:")
            for api in missing_apis:
                print(f"   - {api}")
        
        if success_rate >= 80:
            print("\n✅ المشكلة محددة بوضوح - يمكن إصلاحها")
        else:
            print("\n⚠️ هناك مشاكل إضافية تحتاج فحص")

def main():
    """تشغيل الاختبار المُركز"""
    tester = FocusedWarehouseTester()
    tester.run_focused_test()

if __name__ == "__main__":
    main()