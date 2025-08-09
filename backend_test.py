#!/usr/bin/env python3
"""
اختبار شامل ونهائي لنظام إدارة المنتجات الجديد المطور
Comprehensive Final Testing for New Product Management System

الهدف: إصلاح مشكلة "المنتجات عاجز عن تعديل او حذف او حتى اضافه منتج جديد ويوجد به اخطاء بالتنسيق"
Goal: Fix the issue "Products unable to edit, delete, or add new products with formatting errors"
"""

import requests
import json
import time
from datetime import datetime
import uuid

class ProductManagementTester:
    def __init__(self):
        # استخدام الـ URL الصحيح من frontend/.env
        self.base_url = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com/api"
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتائج الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms",
            "status": status
        })
        print(f"{status} | {test_name} | {details} | {response_time:.2f}ms")
    
    def login_admin(self):
        """تسجيل دخول الأدمن للحصول على JWT token"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            start_time = time.time()
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_test(
                    "تسجيل دخول Admin",
                    True,
                    f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول Admin",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول Admin", False, f"خطأ: {str(e)}", 0)
            return False
    
    def get_headers(self):
        """الحصول على headers مع JWT token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_products(self):
        """اختبار 1: GET /api/products - استرجاع قائمة المنتجات"""
        try:
            start_time = time.time()
            response = requests.get(f"{self.base_url}/products", headers=self.get_headers(), timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                self.log_test(
                    "GET /api/products",
                    True,
                    f"تم استرجاع {len(products)} منتج بنجاح",
                    response_time
                )
                
                # فحص تفاصيل المنتجات
                if products:
                    sample_product = products[0]
                    required_fields = ['id', 'name', 'code', 'brand', 'price', 'stock_quantity', 'stock_status']
                    missing_fields = [field for field in required_fields if field not in sample_product]
                    
                    if not missing_fields:
                        self.log_test(
                            "فحص حقول المنتجات",
                            True,
                            f"جميع الحقول المطلوبة متوفرة: {', '.join(required_fields)}",
                            0
                        )
                    else:
                        self.log_test(
                            "فحص حقول المنتجات",
                            False,
                            f"حقول مفقودة: {', '.join(missing_fields)}",
                            0
                        )
                
                return products
            else:
                self.log_test(
                    "GET /api/products",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("GET /api/products", False, f"خطأ: {str(e)}", 0)
            return []
    
    def test_create_product(self):
        """اختبار 2: POST /api/products - إنشاء منتج جديد"""
        try:
            # بيانات منتج جديد احترافية للنظام الطبي
            new_product = {
                "name": "فولتارين جل 50 جرام",
                "code": f"VOLT50-{int(time.time())}",  # كود فريد
                "brand": "Novartis",
                "description": "جل مضاد للالتهابات لعلاج آلام العضلات والمفاصل",
                "price": 42.50,
                "cost": 35.00,
                "unit": "أنبوب",
                "stock_quantity": 75,
                "minimum_stock": 15,
                "maximum_stock": 200,
                "medical_category": "مضادات الالتهاب الموضعية",
                "requires_prescription": False,
                "supplier_info": {
                    "supplier_name": "شركة نوفارتس مصر",
                    "contact_phone": "+20123456789"
                }
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/products", 
                json=new_product, 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                created_product = response.json()
                product_id = created_product.get("id")
                
                self.log_test(
                    "POST /api/products",
                    True,
                    f"تم إنشاء منتج جديد: {created_product.get('name')} (ID: {product_id})",
                    response_time
                )
                
                # التحقق من البيانات المُرجعة
                if created_product.get("stock_status"):
                    self.log_test(
                        "فحص stock_status للمنتج الجديد",
                        True,
                        f"حالة المخزون: {created_product.get('stock_status')}",
                        0
                    )
                
                return product_id
            else:
                self.log_test(
                    "POST /api/products",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test("POST /api/products", False, f"خطأ: {str(e)}", 0)
            return None
    
    def test_update_product(self, product_id: str):
        """اختبار 3: PUT /api/products/{product_id} - تحديث منتج"""
        if not product_id:
            self.log_test("PUT /api/products", False, "لا يوجد product_id للاختبار", 0)
            return False
        
        try:
            # بيانات التحديث
            update_data = {
                "name": "فولتارين جل 50 جرام - محدث",
                "price": 45.00,
                "stock_quantity": 100,
                "description": "جل مضاد للالتهابات محسن لعلاج آلام العضلات والمفاصل - تركيبة محدثة"
            }
            
            start_time = time.time()
            response = requests.put(
                f"{self.base_url}/products/{product_id}", 
                json=update_data, 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                updated_product = response.json()
                
                self.log_test(
                    "PUT /api/products",
                    True,
                    f"تم تحديث المنتج: {updated_product.get('name')} - السعر الجديد: {updated_product.get('price')} ج.م",
                    response_time
                )
                
                # التحقق من التحديث
                if updated_product.get("price") == 45.00:
                    self.log_test(
                        "التحقق من تحديث السعر",
                        True,
                        f"السعر محدث بنجاح: {updated_product.get('price')} ج.م",
                        0
                    )
                
                return True
            else:
                self.log_test(
                    "PUT /api/products",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("PUT /api/products", False, f"خطأ: {str(e)}", 0)
            return False
    
    def test_delete_product(self, product_id: str):
        """اختبار 4: DELETE /api/products/{product_id} - حذف منتج"""
        if not product_id:
            self.log_test("DELETE /api/products", False, "لا يوجد product_id للاختبار", 0)
            return False
        
        try:
            start_time = time.time()
            response = requests.delete(
                f"{self.base_url}/products/{product_id}", 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                
                self.log_test(
                    "DELETE /api/products",
                    True,
                    f"تم حذف المنتج: {result.get('deleted_product_name')} بنجاح",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "DELETE /api/products",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("DELETE /api/products", False, f"خطأ: {str(e)}", 0)
            return False
    
    def test_products_stats(self):
        """اختبار 5: GET /api/products/stats/overview - إحصائيات المنتجات"""
        try:
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/products/stats/overview", 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                
                self.log_test(
                    "GET /api/products/stats/overview",
                    True,
                    f"إجمالي المنتجات: {stats.get('total_products')}, مخزون منخفض: {stats.get('low_stock_products')}, نفد المخزون: {stats.get('out_of_stock_products')}",
                    response_time
                )
                return stats
            else:
                self.log_test(
                    "GET /api/products/stats/overview",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return None
                
        except Exception as e:
            self.log_test("GET /api/products/stats/overview", False, f"خطأ: {str(e)}", 0)
            return None
    
    def test_brands_list(self):
        """اختبار 6: GET /api/products/brands/list - قائمة العلامات التجارية"""
        try:
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/products/brands/list", 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                brands_data = response.json()
                brands = brands_data.get("brands", [])
                
                self.log_test(
                    "GET /api/products/brands/list",
                    True,
                    f"تم العثور على {len(brands)} علامة تجارية: {', '.join(brands[:3])}{'...' if len(brands) > 3 else ''}",
                    response_time
                )
                return brands
            else:
                self.log_test(
                    "GET /api/products/brands/list",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("GET /api/products/brands/list", False, f"خطأ: {str(e)}", 0)
            return []
    
    def test_categories_list(self):
        """اختبار 7: GET /api/products/categories/list - قائمة الفئات الطبية"""
        try:
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/products/categories/list", 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                categories_data = response.json()
                categories = categories_data.get("categories", [])
                
                self.log_test(
                    "GET /api/products/categories/list",
                    True,
                    f"تم العثور على {len(categories)} فئة طبية: {', '.join(categories[:2])}{'...' if len(categories) > 2 else ''}",
                    response_time
                )
                return categories
            else:
                self.log_test(
                    "GET /api/products/categories/list",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("GET /api/products/categories/list", False, f"خطأ: {str(e)}", 0)
            return []
    
    def test_stock_adjustment(self, product_id: str = None):
        """اختبار 8: POST /api/products/{product_id}/stock/adjust - تعديل المخزون"""
        # إذا لم يتم توفير product_id، استخدم منتج موجود
        if not product_id:
            products = self.test_get_products()
            if products:
                product_id = products[0].get("id")
            else:
                self.log_test("POST /api/products/stock/adjust", False, "لا توجد منتجات للاختبار", 0)
                return False
        
        try:
            # بيانات تعديل المخزون
            adjustment_data = {
                "type": "increase",
                "quantity": 25,
                "reason": "إضافة مخزون جديد - اختبار النظام"
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/products/{product_id}/stock/adjust", 
                json=adjustment_data, 
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                
                self.log_test(
                    "POST /api/products/stock/adjust",
                    True,
                    f"تم تعديل المخزون: من {result.get('stock_before')} إلى {result.get('stock_after')} - حالة المخزون: {result.get('stock_status')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "POST /api/products/stock/adjust",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("POST /api/products/stock/adjust", False, f"خطأ: {str(e)}", 0)
            return False
    
    def test_search_and_filter(self):
        """اختبار 9: البحث والتصفية في المنتجات"""
        try:
            # اختبار البحث بالاسم
            search_params = {"search": "بانادول"}
            start_time = time.time()
            response = requests.get(
                f"{self.base_url}/products", 
                params=search_params,
                headers=self.get_headers(), 
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                search_results = response.json()
                
                self.log_test(
                    "البحث في المنتجات",
                    True,
                    f"تم العثور على {len(search_results)} منتج يحتوي على 'بانادول'",
                    response_time
                )
                
                # اختبار التصفية حسب البراند
                brand_params = {"brand": "GSK"}
                start_time = time.time()
                response = requests.get(
                    f"{self.base_url}/products", 
                    params=brand_params,
                    headers=self.get_headers(), 
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    brand_results = response.json()
                    
                    self.log_test(
                        "التصفية حسب البراند",
                        True,
                        f"تم العثور على {len(brand_results)} منتج من براند GSK",
                        response_time
                    )
                    
                    # اختبار التصفية حسب حالة المخزون
                    stock_params = {"stock_status": "low"}
                    start_time = time.time()
                    response = requests.get(
                        f"{self.base_url}/products", 
                        params=stock_params,
                        headers=self.get_headers(), 
                        timeout=30
                    )
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status_code == 200:
                        stock_results = response.json()
                        
                        self.log_test(
                            "التصفية حسب حالة المخزون",
                            True,
                            f"تم العثور على {len(stock_results)} منتج بمخزون منخفض",
                            response_time
                        )
                        return True
                
            return False
                
        except Exception as e:
            self.log_test("البحث والتصفية", False, f"خطأ: {str(e)}", 0)
            return False
    
    def test_sample_data_verification(self):
        """اختبار 10: التحقق من البيانات النموذجية"""
        try:
            products = self.test_get_products()
            
            if not products:
                self.log_test("التحقق من البيانات النموذجية", False, "لا توجد منتجات في النظام", 0)
                return False
            
            # البحث عن المنتجات النموذجية المطلوبة
            expected_products = ["بانادول", "أوجمنتين", "لانتوس", "سنتروم"]
            found_products = []
            
            for product in products:
                product_name = product.get("name", "").lower()
                for expected in expected_products:
                    if expected.lower() in product_name:
                        found_products.append(expected)
                        break
            
            # فحص حالات المخزون المختلفة
            stock_statuses = [product.get("stock_status") for product in products]
            unique_statuses = list(set(stock_statuses))
            
            self.log_test(
                "التحقق من البيانات النموذجية",
                len(found_products) >= 2,  # على الأقل منتجين من المطلوبة
                f"تم العثور على {len(found_products)} من المنتجات المطلوبة: {', '.join(found_products)}",
                0
            )
            
            self.log_test(
                "التحقق من حالات المخزون المتنوعة",
                len(unique_statuses) >= 2,
                f"حالات المخزون المتاحة: {', '.join(unique_statuses)}",
                0
            )
            
            return len(found_products) >= 2 and len(unique_statuses) >= 2
            
        except Exception as e:
            self.log_test("التحقق من البيانات النموذجية", False, f"خطأ: {str(e)}", 0)
            return False
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل لنظام إدارة المنتجات الجديد")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return
        
        # 2. اختبار استرجاع المنتجات
        products = self.test_get_products()
        
        # 3. اختبار إنشاء منتج جديد
        new_product_id = self.test_create_product()
        
        # 4. اختبار تحديث المنتج
        if new_product_id:
            self.test_update_product(new_product_id)
        
        # 5. اختبار الإحصائيات والمساعدة
        self.test_products_stats()
        self.test_brands_list()
        self.test_categories_list()
        
        # 6. اختبار إدارة المخزون
        self.test_stock_adjustment(new_product_id)
        
        # 7. اختبار البحث والتصفية
        self.test_search_and_filter()
        
        # 8. اختبار البيانات النموذجية
        self.test_sample_data_verification()
        
        # 9. اختبار حذف المنتج (في النهاية)
        if new_product_id:
            self.test_delete_product(new_product_id)
        
        # تقرير النتائج النهائية
        self.generate_final_report()
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي لاختبار نظام إدارة المنتجات")
        print("=" * 80)
        
        print(f"🎯 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
        
        # حساب متوسط وقت الاستجابة
        response_times = []
        for result in self.test_results:
            try:
                time_str = result["response_time"].replace("ms", "")
                if time_str != "0":
                    response_times.append(float(time_str))
            except:
                pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"📈 متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        print("\n🔍 تفاصيل الاختبارات:")
        print("-" * 80)
        
        for result in self.test_results:
            print(f"{result['status']} {result['test']}")
            print(f"   📝 {result['details']}")
            if result['response_time'] != "0.00ms":
                print(f"   ⏱️ وقت الاستجابة: {result['response_time']}")
            print()
        
        # تقييم النتائج
        if success_rate >= 90:
            print("🏆 تقييم النظام: ممتاز - النظام يعمل بكفاءة عالية!")
        elif success_rate >= 75:
            print("✅ تقييم النظام: جيد - النظام يعمل بشكل مقبول مع بعض التحسينات المطلوبة")
        elif success_rate >= 50:
            print("⚠️ تقييم النظام: متوسط - يحتاج إصلاحات مهمة")
        else:
            print("❌ تقييم النظام: ضعيف - يحتاج إصلاحات جذرية")
        
        print("\n" + "=" * 80)
        
        # تحديد المشاكل الحرجة
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("🚨 المشاكل الحرجة التي تحتاج إصلاح:")
            for failed_test in failed_tests:
                print(f"   ❌ {failed_test['test']}: {failed_test['details']}")
        else:
            print("🎉 لا توجد مشاكل حرجة - النظام يعمل بشكل مثالي!")

if __name__ == "__main__":
    tester = ProductManagementTester()
    tester.run_comprehensive_test()
"""
Quick comprehensive test for updated dashboard system
Arabic Review: اختبار شامل سريع للتأكد من أن نظام لوحة التحكم المحدث يعمل بشكل صحيح مع التحسينات الجديدة
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class DashboardSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """Log test results"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {response_time:.2f}ms - {details}")
    
    def test_admin_login(self):
        """Test admin login with admin/admin123"""
        start_time = time.time()
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                user_info = data.get("user", {})
                details = f"User: {user_info.get('full_name')}, Role: {user_info.get('role')}"
                self.log_test("Admin Login (admin/admin123)", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Admin Login (admin/admin123)", False, response_time, f"Error: {str(e)}")
            return False
    
    def test_dashboard_stats_admin(self):
        """Test GET /api/dashboard/stats/admin - Admin statistics"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/stats/admin")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for essential admin statistics
                required_fields = ["total_users", "total_clinics", "total_products", "user_role", "dashboard_type"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    stats_summary = f"Users: {data.get('total_users')}, Clinics: {data.get('total_clinics')}, Products: {data.get('total_products')}"
                    self.log_test("Dashboard Stats Admin", True, response_time, stats_summary)
                    return data
                else:
                    self.log_test("Dashboard Stats Admin", False, response_time, f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_test("Dashboard Stats Admin", False, response_time, f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Dashboard Stats Admin", False, response_time, f"Error: {str(e)}")
            return None
    
    def test_dashboard_widgets_admin(self):
        """Test GET /api/dashboard/widgets/admin - Admin widgets"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/widgets/admin")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    # Check widget structure
                    widget_count = len(data)
                    valid_widgets = 0
                    
                    for widget in data:
                        if all(key in widget for key in ["id", "title", "type", "size"]):
                            valid_widgets += 1
                    
                    details = f"{widget_count} widgets, {valid_widgets} valid"
                    success = valid_widgets == widget_count
                    self.log_test("Dashboard Widgets Admin", success, response_time, details)
                    return data
                else:
                    self.log_test("Dashboard Widgets Admin", False, response_time, "Empty or invalid widget list")
                    return None
            else:
                self.log_test("Dashboard Widgets Admin", False, response_time, f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Dashboard Widgets Admin", False, response_time, f"Error: {str(e)}")
            return None
    
    def test_data_consistency(self, stats_data, widgets_data):
        """Test data consistency between stats and widgets"""
        start_time = time.time()
        try:
            if not stats_data or not widgets_data:
                self.log_test("Data Consistency Check", False, 0, "Missing data for comparison")
                return False
            
            # Check if dashboard_type matches role
            dashboard_type = stats_data.get("dashboard_type")
            user_role = stats_data.get("user_role")
            
            # Check if widgets are appropriate for admin role
            admin_widget_ids = [w.get("id") for w in widgets_data if w.get("id")]
            expected_admin_widgets = ["system_overview", "user_management", "financial_summary"]
            
            has_expected_widgets = any(widget in admin_widget_ids for widget in expected_admin_widgets)
            
            response_time = (time.time() - start_time) * 1000
            
            if dashboard_type == "admin" and user_role == "admin" and has_expected_widgets:
                details = f"Dashboard type: {dashboard_type}, User role: {user_role}, Admin widgets: {len(admin_widget_ids)}"
                self.log_test("Data Consistency Check", True, response_time, details)
                return True
            else:
                details = f"Inconsistent data - Dashboard: {dashboard_type}, Role: {user_role}"
                self.log_test("Data Consistency Check", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Data Consistency Check", False, response_time, f"Error: {str(e)}")
            return False
    
    def test_response_speed(self):
        """Test response speed for dashboard APIs"""
        start_time = time.time()
        try:
            # Test multiple quick requests to check performance
            speeds = []
            
            for i in range(3):
                req_start = time.time()
                response = self.session.get(f"{API_BASE}/dashboard/stats/admin")
                req_time = (time.time() - req_start) * 1000
                
                if response.status_code == 200:
                    speeds.append(req_time)
            
            if speeds:
                avg_speed = sum(speeds) / len(speeds)
                max_speed = max(speeds)
                min_speed = min(speeds)
                
                # Consider good if average response is under 100ms
                is_fast = avg_speed < 100
                
                details = f"Avg: {avg_speed:.2f}ms, Min: {min_speed:.2f}ms, Max: {max_speed:.2f}ms"
                self.log_test("Response Speed Test", is_fast, avg_speed, details)
                return is_fast
            else:
                self.log_test("Response Speed Test", False, 0, "No successful requests")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Response Speed Test", False, response_time, f"Error: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all dashboard system tests"""
        print("🎯 **QUICK COMPREHENSIVE DASHBOARD SYSTEM TEST STARTING**")
        print("=" * 70)
        
        # Test 1: Admin Login
        if not self.test_admin_login():
            print("❌ Login failed - cannot continue with other tests")
            return self.generate_report()
        
        # Test 2: Dashboard Stats
        stats_data = self.test_dashboard_stats_admin()
        
        # Test 3: Dashboard Widgets  
        widgets_data = self.test_dashboard_widgets_admin()
        
        # Test 4: Data Consistency
        self.test_data_consistency(stats_data, widgets_data)
        
        # Test 5: Response Speed
        self.test_response_speed()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 70)
        print("🎯 **DASHBOARD SYSTEM TEST RESULTS**")
        print("=" * 70)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['response_time']:.2f}ms - {result['details']}")
        
        print("\n📊 **SUMMARY**")
        print(f"Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests passed)")
        print(f"Average Response Time: {avg_response_time:.2f}ms")
        print(f"Total Execution Time: {total_time:.2f}s")
        
        if success_rate >= 80:
            print("🎉 **DASHBOARD SYSTEM STATUS: EXCELLENT** - All core functionality working!")
        elif success_rate >= 60:
            print("⚠️ **DASHBOARD SYSTEM STATUS: GOOD** - Minor issues detected")
        else:
            print("❌ **DASHBOARD SYSTEM STATUS: NEEDS ATTENTION** - Critical issues found")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "test_results": self.test_results
        }

def main():
    """Main test execution"""
    print("🚀 Starting Quick Comprehensive Dashboard System Test")
    print("Arabic Review: اختبار شامل سريع لنظام لوحة التحكم المحدث")
    print("=" * 70)
    
    tester = DashboardSystemTester()
    results = tester.run_comprehensive_test()
    
    return results

if __name__ == "__main__":
    main()