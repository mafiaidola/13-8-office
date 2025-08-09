#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل لمشكلة إدارة المخازن والمنتجات المبلغ عنها من المستخدم
Comprehensive Testing for Warehouse and Product Management Issue

المشكلة المبلغ عنها:
"جميع المخازن تأتى بأسماء وبيانات المنتجات من قسم إدارة المنتجات برجاء اصلاح هذا العطل والتأكد من ان يمكن تحرير المخزن بإحترافيه وايضا اضافه او ازاله مخزن"

الهدف: تحديد المشكلة في ربط المخازن بالمنتجات، والتأكد من وجود APIs لإدارة المخازن
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://27f64219-57e1-4ae7-9f08-6723a4a751d3.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class WarehouseProductTester:
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
            "timestamp": datetime.now().isoformat(),
            "response_time_ms": response_time
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if not success:
            print(f"   📋 Details: {details}")
        else:
            print(f"   📋 {details}")
    
    def login_admin(self):
        """تسجيل دخول الأدمن للحصول على JWT token"""
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
                
                # Set authorization header for future requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}"
                })
                
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    True,
                    f"تم الحصول على JWT token - المستخدم: {user_info.get('full_name', 'غير محدد')} - الدور: {user_info.get('role', 'غير محدد')}",
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
    
    def test_get_warehouses(self):
        """اختبار GET /api/warehouses - جلب قائمة المخازن"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                
                # تحليل بيانات المخازن
                warehouse_details = []
                for warehouse in warehouses[:3]:  # أول 3 مخازن للتحليل
                    details = {
                        "id": warehouse.get("id", "غير محدد"),
                        "name": warehouse.get("name", "غير محدد"),
                        "location": warehouse.get("location", "غير محدد"),
                        "manager": warehouse.get("manager_name", "غير محدد"),
                        "is_active": warehouse.get("is_active", False)
                    }
                    warehouse_details.append(details)
                
                self.log_test(
                    "GET /api/warehouses",
                    True,
                    f"تم جلب {warehouse_count} مخزن - أول 3 مخازن: {json.dumps(warehouse_details, ensure_ascii=False, indent=2)}",
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
    
    def test_warehouse_products(self, warehouse_id):
        """اختبار GET /api/warehouses/{warehouse_id}/products - فحص منتجات المخازن"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل منتجات المخزن
                product_analysis = {
                    "total_products": product_count,
                    "sample_products": []
                }
                
                for product in products[:3]:  # أول 3 منتجات للتحليل
                    product_info = {
                        "id": product.get("id", "غير محدد"),
                        "name": product.get("name", "غير محدد"),
                        "category": product.get("category", "غير محدد"),
                        "stock": product.get("current_stock", 0),
                        "price": product.get("price", 0)
                    }
                    product_analysis["sample_products"].append(product_info)
                
                # فحص إذا كانت البيانات وهمية أم حقيقية
                is_dummy_data = False
                if product_count > 0:
                    first_product = products[0]
                    dummy_indicators = [
                        "test" in str(first_product.get("name", "")).lower(),
                        "dummy" in str(first_product.get("name", "")).lower(),
                        "sample" in str(first_product.get("name", "")).lower()
                    ]
                    is_dummy_data = any(dummy_indicators)
                
                self.log_test(
                    f"GET /api/warehouses/{warehouse_id}/products",
                    True,
                    f"منتجات المخزن: {product_count} منتج - بيانات وهمية: {'نعم' if is_dummy_data else 'لا'} - تفاصيل: {json.dumps(product_analysis, ensure_ascii=False, indent=2)}",
                    response_time
                )
                return products, is_dummy_data
            else:
                self.log_test(
                    f"GET /api/warehouses/{warehouse_id}/products",
                    False,
                    f"فشل جلب منتجات المخزن - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return [], False
                
        except Exception as e:
            self.log_test(
                f"GET /api/warehouses/{warehouse_id}/products",
                False,
                f"خطأ في جلب منتجات المخزن: {str(e)}"
            )
            return [], False
    
    def test_get_products(self):
        """اختبار GET /api/products - جلب قائمة المنتجات"""
        try:
            start_time = time.time()
            response = self.session.get(f"{BACKEND_URL}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل المنتجات
                product_analysis = {
                    "total_products": product_count,
                    "active_products": 0,
                    "categories": set(),
                    "sample_products": []
                }
                
                for product in products:
                    if product.get("is_active", True):
                        product_analysis["active_products"] += 1
                    
                    category = product.get("category", "غير محدد")
                    product_analysis["categories"].add(category)
                
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
                    product_analysis["sample_products"].append(product_info)
                
                product_analysis["categories"] = list(product_analysis["categories"])
                
                self.log_test(
                    "GET /api/products",
                    True,
                    f"إجمالي المنتجات: {product_count} - النشطة: {product_analysis['active_products']} - الفئات: {product_analysis['categories']} - عينة: {json.dumps(product_analysis['sample_products'], ensure_ascii=False, indent=2)}",
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
    
    def test_create_product(self):
        """اختبار POST /api/products - إنشاء منتج جديد"""
        try:
            start_time = time.time()
            
            # بيانات منتج جديد للاختبار
            new_product = {
                "name": "دواء اختبار إدارة المخازن",
                "category": "أدوية القلب",
                "description": "منتج اختبار لفحص مشكلة ربط المخازن بالمنتجات",
                "unit": "علبة",
                "price": 125.50,
                "current_stock": 200,
                "min_stock": 20,
                "max_stock": 500,
                "is_active": True,
                "manufacturer": "شركة الاختبار الطبية",
                "batch_number": f"TEST-{int(time.time())}",
                "expiry_date": "2025-12-31"
            }
            
            response = self.session.post(f"{BACKEND_URL}/products", json=new_product)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                result = response.json()
                product_id = result.get("product", {}).get("id") or result.get("id")
                
                self.log_test(
                    "POST /api/products",
                    True,
                    f"تم إنشاء منتج جديد بنجاح - ID: {product_id} - الاسم: {new_product['name']} - السعر: {new_product['price']} ج.م",
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
    
    def test_update_product(self, product_id):
        """اختبار PUT /api/products/{product_id} - تحديث منتج"""
        if not product_id:
            self.log_test(
                "PUT /api/products/{product_id}",
                False,
                "لا يوجد product_id للاختبار"
            )
            return False
            
        try:
            start_time = time.time()
            
            # بيانات التحديث
            update_data = {
                "name": "دواء اختبار إدارة المخازن - محدث",
                "price": 135.75,
                "current_stock": 180,
                "description": "منتج اختبار محدث لفحص مشكلة ربط المخازن بالمنتجات"
            }
            
            response = self.session.put(f"{BACKEND_URL}/products/{product_id}", json=update_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                
                self.log_test(
                    "PUT /api/products/{product_id}",
                    True,
                    f"تم تحديث المنتج بنجاح - ID: {product_id} - السعر الجديد: {update_data['price']} ج.م - المخزون الجديد: {update_data['current_stock']}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "PUT /api/products/{product_id}",
                    False,
                    f"فشل تحديث المنتج - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "PUT /api/products/{product_id}",
                False,
                f"خطأ في تحديث المنتج: {str(e)}"
            )
            return False
    
    def test_delete_product(self, product_id):
        """اختبار DELETE /api/products/{product_id} - حذف منتج"""
        if not product_id:
            self.log_test(
                "DELETE /api/products/{product_id}",
                False,
                "لا يوجد product_id للاختبار"
            )
            return False
            
        try:
            start_time = time.time()
            response = self.session.delete(f"{BACKEND_URL}/products/{product_id}")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                
                self.log_test(
                    "DELETE /api/products/{product_id}",
                    True,
                    f"تم حذف المنتج بنجاح - ID: {product_id} - الرسالة: {result.get('message', 'تم الحذف')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "DELETE /api/products/{product_id}",
                    False,
                    f"فشل حذف المنتج - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "DELETE /api/products/{product_id}",
                False,
                f"خطأ في حذف المنتج: {str(e)}"
            )
            return False
    
    def test_warehouse_management_apis(self):
        """البحث عن APIs إدارة المخازن (POST/PUT/DELETE /api/warehouses)"""
        warehouse_apis = []
        
        # اختبار POST /api/warehouses - إنشاء مخزن جديد
        try:
            start_time = time.time()
            new_warehouse = {
                "name": "مخزن اختبار إدارة المخازن",
                "location": "القاهرة - منطقة الاختبار",
                "manager_name": "مدير الاختبار",
                "manager_phone": "01234567890",
                "description": "مخزن اختبار لفحص مشكلة إدارة المخازن",
                "is_active": True
            }
            
            response = self.session.post(f"{BACKEND_URL}/warehouses", json=new_warehouse)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                result = response.json()
                warehouse_id = result.get("warehouse", {}).get("id") or result.get("id")
                
                self.log_test(
                    "POST /api/warehouses",
                    True,
                    f"تم إنشاء مخزن جديد بنجاح - ID: {warehouse_id} - الاسم: {new_warehouse['name']}",
                    response_time
                )
                warehouse_apis.append(("POST", True, warehouse_id))
            else:
                self.log_test(
                    "POST /api/warehouses",
                    False,
                    f"API غير متاح أو فشل - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                warehouse_apis.append(("POST", False, None))
                
        except Exception as e:
            self.log_test(
                "POST /api/warehouses",
                False,
                f"API غير متاح: {str(e)}"
            )
            warehouse_apis.append(("POST", False, None))
        
        # اختبار PUT /api/warehouses/{warehouse_id} - تحديث مخزن
        test_warehouse_id = None
        if warehouse_apis and warehouse_apis[0][1]:  # إذا نجح إنشاء المخزن
            test_warehouse_id = warehouse_apis[0][2]
        else:
            # استخدام أول مخزن متاح من قائمة المخازن
            warehouses = self.test_get_warehouses()
            if warehouses:
                test_warehouse_id = warehouses[0].get("id")
        
        if test_warehouse_id:
            try:
                start_time = time.time()
                update_data = {
                    "name": "مخزن اختبار إدارة المخازن - محدث",
                    "location": "الجيزة - منطقة الاختبار المحدثة",
                    "manager_name": "مدير الاختبار المحدث"
                }
                
                response = self.session.put(f"{BACKEND_URL}/warehouses/{test_warehouse_id}", json=update_data)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    self.log_test(
                        "PUT /api/warehouses/{warehouse_id}",
                        True,
                        f"تم تحديث المخزن بنجاح - ID: {test_warehouse_id} - الاسم الجديد: {update_data['name']}",
                        response_time
                    )
                    warehouse_apis.append(("PUT", True, test_warehouse_id))
                else:
                    self.log_test(
                        "PUT /api/warehouses/{warehouse_id}",
                        False,
                        f"API غير متاح أو فشل - HTTP {response.status_code}: {response.text}",
                        response_time
                    )
                    warehouse_apis.append(("PUT", False, None))
                    
            except Exception as e:
                self.log_test(
                    "PUT /api/warehouses/{warehouse_id}",
                    False,
                    f"API غير متاح: {str(e)}"
                )
                warehouse_apis.append(("PUT", False, None))
        else:
            self.log_test(
                "PUT /api/warehouses/{warehouse_id}",
                False,
                "لا يوجد warehouse_id للاختبار"
            )
            warehouse_apis.append(("PUT", False, None))
        
        # اختبار DELETE /api/warehouses/{warehouse_id} - حذف مخزن
        if test_warehouse_id:
            try:
                start_time = time.time()
                response = self.session.delete(f"{BACKEND_URL}/warehouses/{test_warehouse_id}")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    self.log_test(
                        "DELETE /api/warehouses/{warehouse_id}",
                        True,
                        f"تم حذف المخزن بنجاح - ID: {test_warehouse_id}",
                        response_time
                    )
                    warehouse_apis.append(("DELETE", True, test_warehouse_id))
                else:
                    self.log_test(
                        "DELETE /api/warehouses/{warehouse_id}",
                        False,
                        f"API غير متاح أو فشل - HTTP {response.status_code}: {response.text}",
                        response_time
                    )
                    warehouse_apis.append(("DELETE", False, None))
                    
            except Exception as e:
                self.log_test(
                    "DELETE /api/warehouses/{warehouse_id}",
                    False,
                    f"API غير متاح: {str(e)}"
                )
                warehouse_apis.append(("DELETE", False, None))
        else:
            self.log_test(
                "DELETE /api/warehouses/{warehouse_id}",
                False,
                "لا يوجد warehouse_id للاختبار"
            )
            warehouse_apis.append(("DELETE", False, None))
        
        return warehouse_apis
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لمشكلة إدارة المخازن والمنتجات")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        print("\n📦 اختبار إدارة المخازن:")
        print("-" * 40)
        
        # 2. اختبار جلب المخازن
        warehouses = self.test_get_warehouses()
        
        # 3. اختبار منتجات المخازن
        dummy_data_detected = False
        if warehouses:
            for i, warehouse in enumerate(warehouses[:2]):  # اختبار أول مخزنين
                warehouse_id = warehouse.get("id")
                if warehouse_id:
                    products, is_dummy = self.test_warehouse_products(warehouse_id)
                    if is_dummy:
                        dummy_data_detected = True
        
        print("\n🏭 اختبار إدارة المنتجات:")
        print("-" * 40)
        
        # 4. اختبار جلب المنتجات
        products = self.test_get_products()
        
        # 5. اختبار إنشاء منتج جديد
        new_product_id = self.test_create_product()
        
        # 6. اختبار تحديث المنتج
        if new_product_id:
            self.test_update_product(new_product_id)
        elif products:
            # استخدام أول منتج متاح للاختبار
            first_product_id = products[0].get("id")
            self.test_update_product(first_product_id)
        
        # 7. اختبار حذف المنتج
        if new_product_id:
            self.test_delete_product(new_product_id)
        
        print("\n🔧 اختبار APIs إدارة المخازن:")
        print("-" * 40)
        
        # 8. اختبار APIs إدارة المخازن
        warehouse_apis = self.test_warehouse_management_apis()
        
        # تحليل النتائج النهائية
        self.analyze_results(dummy_data_detected, warehouse_apis)
    
    def analyze_results(self, dummy_data_detected, warehouse_apis):
        """تحليل النتائج وتقديم التوصيات"""
        print("\n" + "=" * 80)
        print("📊 تحليل النتائج النهائية:")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        
        # تحليل مشكلة البيانات الوهمية
        if dummy_data_detected:
            print("\n⚠️ مشكلة مكتشفة: البيانات الوهمية في منتجات المخازن")
            print("   📋 المشكلة: منتجات المخازن تحتوي على بيانات وهمية أو اختبار")
            print("   💡 التوصية: فحص منطق ربط المنتجات بالمخازن في الباكند")
        
        # تحليل APIs إدارة المخازن
        warehouse_api_status = {
            "POST": False,
            "PUT": False,
            "DELETE": False
        }
        
        for api_method, success, _ in warehouse_apis:
            warehouse_api_status[api_method] = success
        
        missing_apis = [method for method, available in warehouse_api_status.items() if not available]
        
        if missing_apis:
            print(f"\n⚠️ مشكلة مكتشفة: APIs إدارة المخازن غير متاحة")
            print(f"   📋 APIs المفقودة: {', '.join(missing_apis)} /api/warehouses")
            print("   💡 التوصية: تطوير APIs إدارة المخازن (إضافة/تحديث/حذف)")
        else:
            print("\n✅ جميع APIs إدارة المخازن متاحة وتعمل بشكل صحيح")
        
        # تحليل الأداء
        response_times = [result["response_time_ms"] for result in self.test_results if result["response_time_ms"]]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"\n⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        total_time = time.time() - self.start_time
        print(f"⏱️ إجمالي وقت الاختبار: {total_time:.2f}s")
        
        # التوصيات النهائية
        print("\n🎯 التوصيات النهائية:")
        print("-" * 40)
        
        if dummy_data_detected:
            print("1. إصلاح منطق ربط المنتجات بالمخازن لعرض البيانات الحقيقية")
        
        if missing_apis:
            print("2. تطوير APIs إدارة المخازن المفقودة:")
            for api in missing_apis:
                print(f"   - {api} /api/warehouses")
        
        if success_rate < 80:
            print("3. فحص وإصلاح المشاكل في APIs الأساسية")
        
        if success_rate >= 90:
            print("✅ النظام يعمل بشكل جيد مع تحسينات بسيطة مطلوبة")
        elif success_rate >= 70:
            print("⚠️ النظام يحتاج تحسينات متوسطة")
        else:
            print("❌ النظام يحتاج إصلاحات جذرية")

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = WarehouseProductTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()