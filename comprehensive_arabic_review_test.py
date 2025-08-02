#!/usr/bin/env python3
"""
اختبار شامل لجميع APIs المطلوبة لإصلاح النظام - المراجعة العربية
Comprehensive testing of all required APIs for system fix - Arabic Review

المهام الأساسية المطلوبة:
1. اختبار APIs إدارة المنتجات
2. اختبار APIs إدارة الخطوط  
3. اختبار APIs إدارة المناطق
4. اختبار الصلاحيات
5. اختبار التكامل
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://4869bf48-2036-4988-bb40-179ff075cfa7.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveArabicReviewTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.created_items = {
            "products": [],
            "lines": [],
            "areas": []
        }
        
    def log_test(self, test_name, success, details="", response_time=0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms",
            "timestamp": datetime.now().isoformat()
        })
        print(f"{status} | {test_name} | {response_time:.2f}ms | {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """إجراء طلب HTTP مع قياس الوقت"""
        url = f"{self.base_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = (time.time() - start_time) * 1000
            return response, response_time
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            print(f"❌ خطأ في الطلب: {str(e)}")
            return None, response_time
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن"""
        print("\n🔐 اختبار تسجيل دخول admin/admin123...")
        
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if "access_token" in data:
                    self.admin_token = data["access_token"]
                    user_info = data.get("user", {})
                    details = f"مستخدم: {user_info.get('full_name', 'غير محدد')}, دور: {user_info.get('role', 'غير محدد')}"
                    self.log_test("تسجيل دخول الأدمن", True, details, response_time)
                    return True
                else:
                    self.log_test("تسجيل دخول الأدمن", False, "لا يوجد access_token في الاستجابة", response_time)
                    return False
            except Exception as e:
                self.log_test("تسجيل دخول الأدمن", False, f"خطأ في تحليل الاستجابة: {str(e)}", response_time)
                return False
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            if response:
                try:
                    error_data = response.json()
                    error_msg += f" - {error_data.get('detail', 'خطأ غير محدد')}"
                except:
                    error_msg += f" - {response.text[:100]}"
            self.log_test("تسجيل دخول الأدمن", False, error_msg, response_time)
            return False
    
    def get_auth_headers(self):
        """الحصول على headers المصادقة"""
        if not self.admin_token:
            return {}
        return {"Authorization": f"Bearer {self.admin_token}"}
    
    def test_products_apis(self):
        """اختبار APIs إدارة المنتجات"""
        print("\n📦 اختبار APIs إدارة المنتجات...")
        
        # 1. GET /api/products - جلب جميع المنتجات
        response, response_time = self.make_request("GET", "/products", headers=self.get_auth_headers())
        
        if response and response.status_code == 200:
            try:
                products = response.json()
                # Check if admin can see prices
                admin_can_see_prices = False
                if products and len(products) > 0:
                    first_product = products[0]
                    admin_can_see_prices = "price" in first_product
                
                details = f"عدد المنتجات: {len(products)}, الأدمن يرى الأسعار: {'نعم' if admin_can_see_prices else 'لا'}"
                self.log_test("GET /api/products - جلب المنتجات", True, details, response_time)
                
                # Test price visibility specifically
                if admin_can_see_prices:
                    self.log_test("رؤية الأسعار للأدمن", True, "الأدمن يمكنه رؤية الأسعار في المنتجات", 0)
                else:
                    self.log_test("رؤية الأسعار للأدمن", False, "الأدمن لا يمكنه رؤية الأسعار", 0)
                    
            except Exception as e:
                self.log_test("GET /api/products", False, f"خطأ في تحليل البيانات: {str(e)}", response_time)
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            self.log_test("GET /api/products", False, error_msg, response_time)
        
        # 2. Get available lines for product creation
        response, response_time = self.make_request("GET", "/lines", headers=self.get_auth_headers())
        available_lines = []
        
        if response and response.status_code == 200:
            try:
                lines = response.json()
                available_lines = lines
                details = f"عدد الخطوط المتاحة: {len(lines)}"
                self.log_test("GET /api/lines - للمنتجات", True, details, response_time)
            except Exception as e:
                self.log_test("GET /api/lines - للمنتجات", False, f"خطأ: {str(e)}", response_time)
        
        # 3. POST /api/products - إنشاء منتج جديد
        if available_lines:
            first_line = available_lines[0]
            new_product_data = {
                "name": "منتج اختبار شامل",
                "description": "منتج تجريبي للاختبار الشامل",
                "category": "أدوية",
                "unit": "ڤايل",
                "line_id": first_line["id"],
                "price": 25.5,
                "price_type": "fixed",
                "current_stock": 100,
                "is_active": True
            }
            
            response, response_time = self.make_request("POST", "/products", new_product_data, headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    if result.get("success"):
                        product_info = result.get("product", {})
                        product_id = product_info.get("id")
                        if product_id:
                            self.created_items["products"].append(product_id)
                        details = f"منتج جديد: {product_info.get('name', 'غير محدد')}, الخط: {product_info.get('line_name', 'غير محدد')}"
                        self.log_test("POST /api/products - إنشاء منتج", True, details, response_time)
                    else:
                        self.log_test("POST /api/products", False, result.get("message", "فشل غير محدد"), response_time)
                except Exception as e:
                    self.log_test("POST /api/products", False, f"خطأ في التحليل: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                if response:
                    try:
                        error_data = response.json()
                        error_msg += f" - {error_data.get('detail', 'خطأ غير محدد')}"
                    except:
                        pass
                self.log_test("POST /api/products", False, error_msg, response_time)
        
        # 4. PUT /api/products/{product_id} - تحديث منتج
        if self.created_items["products"]:
            product_id = self.created_items["products"][0]
            update_data = {
                "name": "منتج اختبار شامل - محدث",
                "price": 30.0,
                "description": "تم تحديث هذا المنتج"
            }
            
            response, response_time = self.make_request("PUT", f"/products/{product_id}", update_data, headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم التحديث")
                    self.log_test("PUT /api/products - تحديث منتج", success, details, response_time)
                except Exception as e:
                    self.log_test("PUT /api/products", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("PUT /api/products", False, error_msg, response_time)
        
        # 5. DELETE /api/products/{product_id} - حذف منتج
        if self.created_items["products"]:
            product_id = self.created_items["products"][0]
            
            response, response_time = self.make_request("DELETE", f"/products/{product_id}", headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم الحذف")
                    self.log_test("DELETE /api/products - حذف منتج", success, details, response_time)
                except Exception as e:
                    self.log_test("DELETE /api/products", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("DELETE /api/products", False, error_msg, response_time)
    
    def test_lines_apis(self):
        """اختبار APIs إدارة الخطوط"""
        print("\n📈 اختبار APIs إدارة الخطوط...")
        
        # 1. GET /api/lines - جلب جميع الخطوط
        response, response_time = self.make_request("GET", "/lines", headers=self.get_auth_headers())
        
        if response and response.status_code == 200:
            try:
                lines = response.json()
                details = f"عدد الخطوط: {len(lines)}"
                self.log_test("GET /api/lines - جلب الخطوط", True, details, response_time)
            except Exception as e:
                self.log_test("GET /api/lines", False, f"خطأ: {str(e)}", response_time)
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            self.log_test("GET /api/lines", False, error_msg, response_time)
        
        # 2. POST /api/lines - إنشاء خط جديد
        new_line_data = {
            "name": "خط اختبار شامل",
            "code": "TEST_LINE_001",
            "description": "خط تجريبي للاختبار الشامل",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/lines", new_line_data, headers=self.get_auth_headers())
        
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success"):
                    line_info = result.get("line", {})
                    line_id = line_info.get("id")
                    if line_id:
                        self.created_items["lines"].append(line_id)
                    details = f"خط جديد: {line_info.get('name', 'غير محدد')}, كود: {line_info.get('code', 'غير محدد')}"
                    self.log_test("POST /api/lines - إنشاء خط", True, details, response_time)
                else:
                    self.log_test("POST /api/lines", False, result.get("message", "فشل غير محدد"), response_time)
            except Exception as e:
                self.log_test("POST /api/lines", False, f"خطأ: {str(e)}", response_time)
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            self.log_test("POST /api/lines", False, error_msg, response_time)
        
        # 3. PUT /api/lines/{line_id} - تحديث خط
        if self.created_items["lines"]:
            line_id = self.created_items["lines"][0]
            update_data = {
                "name": "خط اختبار شامل - محدث",
                "code": "TEST_LINE_001_UPDATED",
                "description": "تم تحديث هذا الخط"
            }
            
            response, response_time = self.make_request("PUT", f"/lines/{line_id}", update_data, headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم التحديث")
                    self.log_test("PUT /api/lines - تحديث خط", success, details, response_time)
                except Exception as e:
                    self.log_test("PUT /api/lines", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("PUT /api/lines", False, error_msg, response_time)
        
        # 4. DELETE /api/lines/{line_id} - حذف خط
        if self.created_items["lines"]:
            line_id = self.created_items["lines"][0]
            
            response, response_time = self.make_request("DELETE", f"/lines/{line_id}", headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم الحذف")
                    self.log_test("DELETE /api/lines - حذف خط", success, details, response_time)
                except Exception as e:
                    self.log_test("DELETE /api/lines", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("DELETE /api/lines", False, error_msg, response_time)
    
    def test_areas_apis(self):
        """اختبار APIs إدارة المناطق"""
        print("\n🗺️ اختبار APIs إدارة المناطق...")
        
        # 1. GET /api/areas - جلب جميع المناطق
        response, response_time = self.make_request("GET", "/areas", headers=self.get_auth_headers())
        
        if response and response.status_code == 200:
            try:
                areas = response.json()
                details = f"عدد المناطق: {len(areas)}"
                self.log_test("GET /api/areas - جلب المناطق", True, details, response_time)
            except Exception as e:
                self.log_test("GET /api/areas", False, f"خطأ: {str(e)}", response_time)
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            self.log_test("GET /api/areas", False, error_msg, response_time)
        
        # Get available lines for area creation
        available_lines = []
        response, response_time = self.make_request("GET", "/lines", headers=self.get_auth_headers())
        if response and response.status_code == 200:
            try:
                available_lines = response.json()
            except:
                pass
        
        # 2. POST /api/areas - إنشاء منطقة جديدة
        new_area_data = {
            "name": "منطقة اختبار شاملة",
            "code": "TEST_AREA_001",
            "description": "منطقة تجريبية للاختبار الشامل"
        }
        
        # Link to first available line if exists
        if available_lines:
            new_area_data["parent_line_id"] = available_lines[0]["id"]
        
        response, response_time = self.make_request("POST", "/areas", new_area_data, headers=self.get_auth_headers())
        
        if response and response.status_code == 200:
            try:
                result = response.json()
                if result.get("success"):
                    area_info = result.get("area", {})
                    area_id = area_info.get("id")
                    if area_id:
                        self.created_items["areas"].append(area_id)
                    details = f"منطقة جديدة: {area_info.get('name', 'غير محدد')}, كود: {area_info.get('code', 'غير محدد')}"
                    if area_info.get("parent_line_name"):
                        details += f", الخط: {area_info.get('parent_line_name')}"
                    self.log_test("POST /api/areas - إنشاء منطقة", True, details, response_time)
                else:
                    self.log_test("POST /api/areas", False, result.get("message", "فشل غير محدد"), response_time)
            except Exception as e:
                self.log_test("POST /api/areas", False, f"خطأ: {str(e)}", response_time)
        else:
            error_msg = f"HTTP {response.status_code if response else 'No Response'}"
            self.log_test("POST /api/areas", False, error_msg, response_time)
        
        # 3. PUT /api/areas/{area_id} - تحديث منطقة
        if self.created_items["areas"]:
            area_id = self.created_items["areas"][0]
            update_data = {
                "name": "منطقة اختبار شاملة - محدثة",
                "code": "TEST_AREA_001_UPDATED",
                "description": "تم تحديث هذه المنطقة"
            }
            
            response, response_time = self.make_request("PUT", f"/areas/{area_id}", update_data, headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم التحديث")
                    self.log_test("PUT /api/areas - تحديث منطقة", success, details, response_time)
                except Exception as e:
                    self.log_test("PUT /api/areas", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("PUT /api/areas", False, error_msg, response_time)
        
        # 4. DELETE /api/areas/{area_id} - حذف منطقة
        if self.created_items["areas"]:
            area_id = self.created_items["areas"][0]
            
            response, response_time = self.make_request("DELETE", f"/areas/{area_id}", headers=self.get_auth_headers())
            
            if response and response.status_code == 200:
                try:
                    result = response.json()
                    success = result.get("success", False)
                    details = result.get("message", "تم الحذف")
                    self.log_test("DELETE /api/areas - حذف منطقة", success, details, response_time)
                except Exception as e:
                    self.log_test("DELETE /api/areas", False, f"خطأ: {str(e)}", response_time)
            else:
                error_msg = f"HTTP {response.status_code if response else 'No Response'}"
                self.log_test("DELETE /api/areas", False, error_msg, response_time)
    
    def test_integration_scenarios(self):
        """اختبار سيناريوهات التكامل"""
        print("\n🔗 اختبار سيناريوهات التكامل...")
        
        # Test creating a product with line integration
        response, response_time = self.make_request("GET", "/lines", headers=self.get_auth_headers())
        if response and response.status_code == 200:
            try:
                lines = response.json()
                if lines:
                    # Create a product linked to a line
                    first_line = lines[0]
                    integration_product = {
                        "name": "منتج تكامل اختبار",
                        "unit": "ڤايل",
                        "line_id": first_line["id"],
                        "price": 25.5,
                        "price_type": "fixed"
                    }
                    
                    response, response_time = self.make_request("POST", "/products", integration_product, headers=self.get_auth_headers())
                    
                    if response and response.status_code == 200:
                        result = response.json()
                        if result.get("success"):
                            product_info = result.get("product", {})
                            line_name_updated = product_info.get("line_name") == first_line.get("name")
                            details = f"ربط المنتج بالخط: {'نجح' if line_name_updated else 'فشل'}"
                            self.log_test("تكامل المنتجات والخطوط", line_name_updated, details, response_time)
                        else:
                            self.log_test("تكامل المنتجات والخطوط", False, "فشل في إنشاء المنتج", response_time)
                    else:
                        self.log_test("تكامل المنتجات والخطوط", False, "خطأ في API", response_time)
                else:
                    self.log_test("تكامل المنتجات والخطوط", False, "لا توجد خطوط متاحة", 0)
            except Exception as e:
                self.log_test("تكامل المنتجات والخطوط", False, f"خطأ: {str(e)}", response_time)
        
        # Test area-line integration
        response, response_time = self.make_request("GET", "/areas", headers=self.get_auth_headers())
        if response and response.status_code == 200:
            try:
                areas = response.json()
                linked_areas = [area for area in areas if area.get("parent_line_id") and area.get("parent_line_name")]
                details = f"المناطق المربوطة بالخطوط: {len(linked_areas)} من {len(areas)}"
                success = len(linked_areas) > 0
                self.log_test("تكامل المناطق والخطوط", success, details, response_time)
            except Exception as e:
                self.log_test("تكامل المناطق والخطوط", False, f"خطأ: {str(e)}", response_time)
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل لجميع APIs المطلوبة لإصلاح النظام")
        print("=" * 80)
        
        # 1. Test admin authentication
        if not self.test_admin_login():
            print("❌ فشل في تسجيل الدخول - توقف الاختبار")
            return
        
        # 2. Test Products APIs
        self.test_products_apis()
        
        # 3. Test Lines APIs
        self.test_lines_apis()
        
        # 4. Test Areas APIs
        self.test_areas_apis()
        
        # 5. Test Integration Scenarios
        self.test_integration_scenarios()
        
        # Generate final report
        self.generate_final_report()
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي للاختبار الشامل")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 إجمالي الاختبارات: {total_tests}")
        print(f"✅ نجح: {successful_tests}")
        print(f"❌ فشل: {failed_tests}")
        print(f"📊 معدل النجاح: {success_rate:.1f}%")
        
        print("\n🔍 تفاصيل الاختبارات:")
        
        # Group tests by category
        categories = {
            "المصادقة": [],
            "إدارة المنتجات": [],
            "إدارة الخطوط": [],
            "إدارة المناطق": [],
            "التكامل": []
        }
        
        for test in self.test_results:
            test_name = test["test"]
            if "دخول" in test_name or "admin" in test_name.lower():
                categories["المصادقة"].append(test)
            elif "منتج" in test_name or "products" in test_name:
                categories["إدارة المنتجات"].append(test)
            elif "خط" in test_name or "lines" in test_name:
                categories["إدارة الخطوط"].append(test)
            elif "منطقة" in test_name or "areas" in test_name:
                categories["إدارة المناطق"].append(test)
            elif "تكامل" in test_name:
                categories["التكامل"].append(test)
        
        for category, tests in categories.items():
            if tests:
                print(f"\n📂 {category}:")
                for test in tests:
                    status = "✅" if test["success"] else "❌"
                    print(f"  {status} {test['test']} ({test['response_time']}) - {test['details']}")
        
        # Summary for main agent
        print("\n" + "=" * 80)
        print("📋 ملخص للوكيل الرئيسي:")
        print("=" * 80)
        
        critical_issues = []
        working_features = []
        
        for test in self.test_results:
            if not test["success"]:
                if any(keyword in test["test"] for keyword in ["POST", "PUT", "DELETE", "إنشاء", "تحديث", "حذف"]):
                    critical_issues.append(test["test"])
            else:
                working_features.append(test["test"])
        
        if critical_issues:
            print("🚨 مشاكل حرجة تحتاج إصلاح:")
            for issue in critical_issues:
                print(f"  ❌ {issue}")
        
        print(f"\n✅ الميزات التي تعمل بنجاح: {len(working_features)}")
        print(f"❌ المشاكل الحرجة: {len(critical_issues)}")
        
        if success_rate >= 80:
            print(f"\n🎉 النتيجة الإجمالية: ممتاز ({success_rate:.1f}%) - النظام جاهز للإنتاج!")
        elif success_rate >= 60:
            print(f"\n⚠️ النتيجة الإجمالية: جيد ({success_rate:.1f}%) - يحتاج بعض الإصلاحات")
        else:
            print(f"\n🚨 النتيجة الإجمالية: يحتاج عمل ({success_rate:.1f}%) - مشاكل حرجة تحتاج إصلاح فوري")
        
        # Specific findings for the Arabic review
        print("\n🎯 النتائج المحددة للمراجعة العربية:")
        
        # Check admin price visibility
        admin_price_test = next((t for t in self.test_results if "رؤية الأسعار للأدمن" in t["test"]), None)
        if admin_price_test:
            if admin_price_test["success"]:
                print("  ✅ الأدمن يمكنه رؤية الأسعار في المنتجات")
            else:
                print("  ❌ مشكلة: الأدمن لا يمكنه رؤية الأسعار")
        
        # Check CRUD operations
        crud_operations = ["POST", "PUT", "DELETE"]
        for operation in crud_operations:
            operation_tests = [t for t in self.test_results if operation in t["test"]]
            successful_operations = [t for t in operation_tests if t["success"]]
            if operation_tests:
                success_rate_op = len(successful_operations) / len(operation_tests) * 100
                print(f"  📊 عمليات {operation}: {success_rate_op:.0f}% نجاح ({len(successful_operations)}/{len(operation_tests)})")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = ComprehensiveArabicReviewTester()
    tester.run_comprehensive_test()