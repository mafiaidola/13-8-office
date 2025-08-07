#!/usr/bin/env python3
"""
اختبار شامل ومفصل لمشاكل إدارة المنتجات والخطوط والمناطق
Comprehensive Testing of Product, Lines, and Areas Management Issues

المشاكل المبلغ عنها:
1. مشكلة ربط الخطوط في إدارة المنتجات
2. مشكلة إضافة خطوط جديدة  
3. مشكلة إضافة مناطق
4. مشاكل عامة في المنتجات
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://e0c0a695-5df9-4c27-89c6-e048414b1d42.preview.emergentagent.com/api"

class ComprehensiveLinesAreasProductsTest:
    def __init__(self):
        self.admin_token = None
        self.line_manager_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.admin_token = "db5a9c90"
        self.user_token = "5d8a0907"
        self.created_line_id = None
        self.created_area_id = None
        self.created_product_id = None
        
    def log_test(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_time": f"{response_time:.2f}ms" if response_time else "N/A"
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method, endpoint, data=None, token=None):
        """إجراء طلب HTTP مع قياس الوقت"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        start_time = time.time()
        
        try:
            if method == "GET":
                response = requests.get(url, headers=headers)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers)
            elif method == "Push":
                response = request.push(url, Headers=Main.Dashboard, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = (time.time() - start_time) * 1000
            return response, response_time
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time

    def test_admin_login(self):
        """A.1 - اختبار تسجيل دخول الأدمن"""
        try:
            response, response_time = self.make_request("POST", "/auth/login", {
                "username": "admin",
                "password": "admin123"
            })
            
            if response and response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.log_test(
                    "Admin Login",
                    True,
                    f"تسجيل دخول ناجح للأدمن - الدور: {user_info.get('role')}, الاسم: {user_info.get('full_name')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "Admin Login",
                    False,
                    f"فشل تسجيل الدخول - كود الاستجابة: {response.status_code if response else 'No response'}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"خطأ في تسجيل الدخول: {str(e)}")
            return False

    def test_get_existing_lines(self):
        """A.2 - اختبار جلب الخطوط الموجودة"""
        try:
            response, response_time = self.make_request("GET", "/lines", token=self.admin_token)
            
            if response and response.status_code == 200:
                lines = response.json()
                self.log_test(
                    "Get Existing Lines",
                    True,
                    f"تم جلب {len(lines)} خط بنجاح - الخطوط المتاحة للربط مع المنتجات",
                    response_time
                )
                return lines
            else:
                self.log_test(
                    "Get Existing Lines",
                    False,
                    f"فشل جلب الخطوط - كود: {response.status_code if response else 'No response'}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("Get Existing Lines", False, f"خطأ في جلب الخطوط: {str(e)}")
            return []

    def test_create_new_line(self):
        """A.3 - اختبار إضافة خط جديد (المشكلة المبلغ عنها)"""
        try:
            line_data = {
                "name": f"خط اختبار شامل {int(time.time())}",
                "code": f"TEST_LINE_{int(time.time())}",
                "description": "خط تجريبي لاختبار إضافة الخطوط الجديدة",
                "manager_id": "",
                "target_achievement": 85.0,
                "achievement_percentage": 0.0,
                "assigned_products": [],
                "coverage_areas": [],
                "is_active": True
            }
            
            response, response_time = self.make_request("POST", "/lines", line_data, token=self.admin_token)
            
            if response and response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    line_info = result.get("line", {})
                    self.created_line_id = line_info.get("id")
                    
                    self.log_test(
                        "Create New Line",
                        True,
                        f"✅ تم إنشاء خط جديد بنجاح - الاسم: {line_info.get('name')}, الكود: {line_info.get('code')}, ID: {self.created_line_id}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Create New Line",
                        False,
                        f"فشل إنشاء الخط - الرسالة: {result.get('message', 'غير محدد')}",
                        response_time
                    )
                    return False
            else:
                error_msg = "غير محدد"
                if response:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("detail", str(error_data))
                    except:
                        error_msg = response.text
                        
                self.log_test(
                    "Create New Line",
                    False,
                    f"❌ فشل إنشاء خط جديد - كود: {response.status_code if response else 'No response'}, الخطأ: {error_msg}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("Create New Line", False, f"❌ خطأ في إنشاء خط جديد: {str(e)}")
            return False

    def test_get_existing_areas(self):
        """A.4 - اختبار جلب المناطق الموجودة"""
        try:
            response, response_time = self.make_request("GET", "/areas", token=self.admin_token)
            
            if response and response.status_code == 200:
                areas = response.json()
                self.log_test(
                    "Get Existing Areas",
                    True,
                    f"تم جلب {len(areas)} منطقة بنجاح - المناطق المتاحة للربط",
                    response_time
                )
                return areas
            else:
                self.log_test(
                    "Get Existing Areas",
                    False,
                    f"فشل جلب المناطق - كود: {response.status_code if response else 'No response'}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("Get Existing Areas", False, f"خطأ في جلب المناطق: {str(e)}")
            return []

    def test_create_new_area(self):
        """A.5 - اختبار إضافة منطقة جديدة (المشكلة المبلغ عنها)"""
        try:
            area_data = {
                "name": f"منطقة اختبار شاملة {int(time.time())}",
                "code": f"TEST_AREA_{int(time.time())}",
                "description": "منطقة تجريبية لاختبار إضافة المناطق الجديدة",
                "parent_line_id": self.created_line_id if self.created_line_id else "",
                "manager_id": "",
                "is_active": True
            }
            
            response, response_time = self.make_request("POST", "/areas", area_data, token=self.admin_token)
            
            if response and response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    area_info = result.get("area", {})
                    self.created_area_id = area_info.get("id")
                    
                    self.log_test(
                        "Create New Area",
                        True,
                        f"✅ تم إنشاء منطقة جديدة بنجاح - الاسم: {area_info.get('name')}, الكود: {area_info.get('code')}, مرتبطة بالخط: {area_info.get('parent_line_name', 'غير محدد')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test(
                        "Create New Area",
                        False,
                        f"فشل إنشاء المنطقة - الرسالة: {result.get('message', 'غير محدد')}",
                        response_time
                    )
                    return False
            else:
                error_msg = "غير محدد"
                if response:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("detail", str(error_data))
                    except:
                        error_msg = response.text
                        
                self.log_test(
                    "Create New Area",
                    False,
                    f"❌ فشل إنشاء منطقة جديدة - كود: {response.status_code if response else 'No response'}, الخطأ: {error_msg}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("Create New Area", False, f"❌ خطأ في إنشاء منطقة جديدة: {str(e)}")
            return False

    def test_get_existing_products(self):
        """A.6 - اختبار جلب المنتجات الموجودة مع فحص ربط الخطوط"""
        try:
            response, response_time = self.make_request("GET", "/products", token=self.admin_token)
            
            if response and response.status_code == 200:
                products = response.json()
                
                # فحص ربط الخطوط في المنتجات الموجودة
                products_with_lines = 0
                products_without_lines = 0
                line_linking_issues = []
                
                for product in products:
                    if product.get("line_id") and product.get("line_name"):
                        products_with_lines += 1
                    elif product.get("line_id") and not product.get("line_name"):
                        products_without_lines += 1
                        line_linking_issues.append(f"المنتج '{product.get('name')}' له line_id لكن بدون line_name")
                    elif not product.get("line_id"):
                        products_without_lines += 1
                        line_linking_issues.append(f"المنتج '{product.get('name')}' بدون line_id")
                
                success = len(line_linking_issues) == 0
                details = f"تم جلب {len(products)} منتج - مرتبط بخطوط: {products_with_lines}, غير مرتبط: {products_without_lines}"
                
                if line_linking_issues:
                    details += f" - مشاكل الربط: {'; '.join(line_linking_issues[:3])}"
                    if len(line_linking_issues) > 3:
                        details += f" و {len(line_linking_issues) - 3} مشاكل أخرى"
                
                self.log_test(
                    "Get Products with Line Linking Check",
                    success,
                    details,
                    response_time
                )
                return products
            else:
                self.log_test(
                    "Get Products with Line Linking Check",
                    False,
                    f"فشل جلب المنتجات - كود: {response.status_code if response else 'No response'}",
                    response_time
                )
                return []
                
        except Exception as e:
            self.log_test("Get Products with Line Linking Check", False, f"خطأ في جلب المنتجات: {str(e)}")
            return []

    def test_create_new_product_with_line_linking(self):
        """A.7 - اختبار إنشاء منتج جديد مع ربط الخط (المشكلة الأساسية)"""
        try:
            if not self.created_line_id:
                self.log_test(
                    "Create Product with Line Linking",
                    False,
                    "❌ لا يمكن اختبار ربط المنتج بالخط - لم يتم إنشاء خط تجريبي"
                )
                return False
            
            product_data = {
                "name": f"منتج اختبار ربط الخطوط {int(time.time())}",
                "description": "منتج تجريبي لاختبار ربط المنتجات بالخطوط",
                "category": "أدوية",
                "unit": "ڤايل",
                "line_id": self.created_line_id,
                "price": 150.0,
                "price_type": "per_vial",
                "current_stock": 100,
                "is_active": True
            }
            
            response, response_time = self.make_request("POST", "/products", product_data, token=self.admin_token)
            
            if response and response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    product_info = result.get("product", {})
                    self.created_product_id = product_info.get("id")
                    
                    # فحص ربط الخط
                    line_linked = product_info.get("line_id") == self.created_line_id
                    line_name_set = bool(product_info.get("line_name"))
                    
                    if line_linked and line_name_set:
                        self.log_test(
                            "Create Product with Line Linking",
                            True,
                            f"✅ تم إنشاء منتج مع ربط الخط بنجاح - المنتج: {product_info.get('name')}, الخط: {product_info.get('line_name')}, السعر: {product_info.get('price')} ج.م",
                            response_time
                        )
                        return True
                    else:
                        self.log_test(
                            "Create Product with Line Linking",
                            False,
                            f"❌ تم إنشاء المنتج لكن ربط الخط لا يعمل - line_linked: {line_linked}, line_name_set: {line_name_set}",
                            response_time
                        )
                        return False
                else:
                    self.log_test(
                        "Create Product with Line Linking",
                        False,
                        f"فشل إنشاء المنتج - الرسالة: {result.get('message', 'غير محدد')}",
                        response_time
                    )
                    return False
            else:
                error_msg = "غير محدد"
                if response:
                    try:
                        error_data = response.json()
                        error_msg = error_data.get("detail", str(error_data))
                    except:
                        error_msg = response.text
                        
                self.log_test(
                    "Create Product with Line Linking",
                    False,
                    f"❌ فشل إنشاء منتج مع ربط الخط - كود: {response.status_code if response else 'No response'}, الخطأ: {error_msg}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test("Create Product with Line Linking", False, f"❌ خطأ في إنشاء منتج مع ربط الخط: {str(e)}")
            return False

    def test_data_consistency_verification(self):
        """B.1 - اختبار التكامل والاتساق بين البيانات"""
        try:
            # جلب البيانات المُنشأة للتحقق من الاتساق
            verification_results = []
            
            # 1. التحقق من الخط المُنشأ
            if self.created_line_id:
                response, _ = self.make_request("GET", "/lines", token=self.admin_token)
                if response and response.status_code == 200:
                    lines = response.json()
                    created_line = next((line for line in lines if line.get("id") == self.created_line_id), None)
                    if created_line:
                        verification_results.append(f"✅ الخط المُنشأ موجود: {created_line.get('name')}")
                    else:
                        verification_results.append(f"❌ الخط المُنشأ غير موجود في القائمة")
            
            # 2. التحقق من المنطقة المُنشأة وربطها بالخط
            if self.created_area_id:
                response, _ = self.make_request("GET", "/areas", token=self.admin_token)
                if response and response.status_code == 200:
                    areas = response.json()
                    created_area = next((area for area in areas if area.get("id") == self.created_area_id), None)
                    if created_area:
                        if created_area.get("parent_line_id") == self.created_line_id:
                            verification_results.append(f"✅ المنطقة مرتبطة بالخط الصحيح: {created_area.get('parent_line_name')}")
                        else:
                            verification_results.append(f"❌ المنطقة غير مرتبطة بالخط الصحيح")
                    else:
                        verification_results.append(f"❌ المنطقة المُنشأة غير موجودة في القائمة")
            
            # 3. التحقق من المنتج المُنشأ وربطه بالخط
            if self.created_product_id:
                response, _ = self.make_request("GET", "/products", token=self.admin_token)
                if response and response.status_code == 200:
                    products = response.json()
                    created_product = next((product for product in products if product.get("id") == self.created_product_id), None)
                    if created_product:
                        if created_product.get("line_id") == self.created_line_id and created_product.get("line_name"):
                            verification_results.append(f"✅ المنتج مرتبط بالخط الصحيح: {created_product.get('line_name')}")
                        else:
                            verification_results.append(f"❌ المنتج غير مرتبط بالخط الصحيح")
                    else:
                        verification_results.append(f"❌ المنتج المُنشأ غير موجود في القائمة")
            
            success = all("✅" in result for result in verification_results)
            details = " | ".join(verification_results) if verification_results else "لا توجد بيانات للتحقق منها"
            
            self.log_test(
                "Data Consistency Verification",
                success,
                details
            )
            return success
            
        except Exception as e:
            self.log_test("Data Consistency Verification", False, f"خطأ في التحقق من اتساق البيانات: {str(e)}")
            return False

    def test_line_manager_permissions(self):
        """C.1 - اختبار صلاحيات مدير الخط"""
        try:
            # إنشاء مستخدم مدير خط تجريبي
            line_manager_data = {
                "username": f"line_manager_test_{int(time.time())}",
                "password": "test123",
                "full_name": "مدير خط تجريبي",
                "role": "line_manager",
                "email": "linemanager@test.com",
                "phone": "01234567890",
                "is_active": True
            }
            
            response, _ = self.make_request("POST", "/users", line_manager_data, token=self.admin_token)
            
            if response and response.status_code == 200:
                # تسجيل دخول مدير الخط
                login_response, _ = self.make_request("POST", "/auth/login", {
                    "username": line_manager_data["username"],
                    "password": line_manager_data["password"]
                })
                
                if login_response and login_response.status_code == 200:
                    login_data = login_response.json()
                    line_manager_token = login_data.get("access_token")
                    
                    # اختبار صلاحيات مدير الخط
                    permissions_tests = []
                    
                    # 1. يجب أن يتمكن من إنشاء خطوط
                    line_test_data = {
                        "name": f"خط مدير الخط {int(time.time())}",
                        "code": f"LM_LINE_{int(time.time())}",
                        "description": "خط من مدير خط",
                        "is_active": True
                    }
                    
                    create_response, _ = self.make_request("POST", "/lines", line_test_data, token=line_manager_token)
                    if create_response and create_response.status_code == 200:
                        permissions_tests.append("✅ يمكن إنشاء خطوط")
                    else:
                        permissions_tests.append("❌ لا يمكن إنشاء خطوط")
                    
                    # 2. يجب أن يتمكن من عرض الخطوط
                    view_response, _ = self.make_request("GET", "/lines", token=line_manager_token)
                    if view_response and view_response.status_code == 200:
                        permissions_tests.append("✅ يمكن عرض الخطوط")
                    else:
                        permissions_tests.append("❌ لا يمكن عرض الخطوط")
                    
                    # 3. يجب أن يتمكن من إنشاء مناطق
                    area_test_data = {
                        "name": f"منطقة مدير الخط {int(time.time())}",
                        "code": f"LM_AREA_{int(time.time())}",
                        "description": "منطقة من مدير خط",
                        "is_active": True
                    }
                    
                    area_response, _ = self.make_request("POST", "/areas", area_test_data, token=line_manager_token)
                    if area_response and area_response.status_code == 200:
                        permissions_tests.append("✅ يمكن إنشاء مناطق")
                    else:
                        permissions_tests.append("❌ لا يمكن إنشاء مناطق")
                    
                    success = all("✅" in test for test in permissions_tests)
                    details = " | ".join(permissions_tests)
                    
                    self.log_test(
                        "Line Manager Permissions",
                        success,
                        details
                    )
                    return success
                else:
                    self.log_test("Line Manager Permissions", False, "فشل تسجيل دخول مدير الخط")
                    return False
            else:
                self.log_test("Line Manager Permissions", False, "فشل إنشاء مستخدم مدير خط")
                return False
                
        except Exception as e:
            self.log_test("Line Manager Permissions", False, f"خطأ في اختبار صلاحيات مدير الخط: {str(e)}")
            return False

    def test_medical_rep_permissions(self):
        """C.2 - اختبار صلاحيات المندوب الطبي"""
        try:
            # إنشاء مستخدم مندوب طبي تجريبي
            medical_rep_data = {
                "username": f"medical_rep_test_{int(time.time())}",
                "password": "test123",
                "full_name": "مندوب طبي تجريبي",
                "role": "medical_rep",
                "email": "medrep@test.com",
                "phone": "01234567891",
                "is_active": True
            }
            
            response, _ = self.make_request("POST", "/users", medical_rep_data, token=self.admin_token)
            
            if response and response.status_code == 200:
                # تسجيل دخول المندوب الطبي
                login_response, _ = self.make_request("POST", "/auth/login", {
                    "username": medical_rep_data["username"],
                    "password": medical_rep_data["password"]
                })
                
                if login_response and login_response.status_code == 200:
                    login_data = login_response.json()
                    medical_rep_token = login_data.get("access_token")
                    
                    # اختبار صلاحيات المندوب الطبي
                    permissions_tests = []
                    
                    # 1. يجب أن يرى المنتجات بدون أسعار
                    products_response, _ = self.make_request("GET", "/products", token=medical_rep_token)
                    if products_response and products_response.status_code == 200:
                        products = products_response.json()
                        if products:
                            # فحص إذا كانت الأسعار مخفية
                            first_product = products[0]
                            if "price" not in first_product:
                                permissions_tests.append("✅ الأسعار مخفية بشكل صحيح")
                            else:
                                permissions_tests.append("❌ الأسعار ظاهرة (يجب إخفاؤها)")
                        else:
                            permissions_tests.append("⚠️ لا توجد منتجات للاختبار")
                    else:
                        permissions_tests.append("❌ لا يمكن عرض المنتجات")
                    
                    # 2. لا يجب أن يتمكن من إنشاء منتجات
                    product_test_data = {
                        "name": "منتج من مندوب طبي",
                        "unit": "علبة",
                        "line_id": self.created_line_id or "test",
                        "price": 100.0,
                        "price_type": "per_box"
                    }
                    
                    create_response, _ = self.make_request("POST", "/products", product_test_data, token=medical_rep_token)
                    if create_response and create_response.status_code == 403:
                        permissions_tests.append("✅ محظور من إنشاء منتجات (صحيح)")
                    else:
                        permissions_tests.append("❌ يمكنه إنشاء منتجات (خطأ)")
                    
                    # 3. لا يجب أن يتمكن من إنشاء خطوط
                    line_test_data = {
                        "name": "خط من مندوب طبي",
                        "code": "MR_LINE",
                        "description": "خط من مندوب طبي"
                    }
                    
                    line_response, _ = self.make_request("POST", "/lines", line_test_data, token=medical_rep_token)
                    if line_response and line_response.status_code == 403:
                        permissions_tests.append("✅ محظور من إنشاء خطوط (صحيح)")
                    else:
                        permissions_tests.append("❌ يمكنه إنشاء خطوط (خطأ)")
                    
                    success = all("✅" in test for test in permissions_tests)
                    details = " | ".join(permissions_tests)
                    
                    self.log_test(
                        "Medical Rep Permissions",
                        success,
                        details
                    )
                    return success
                else:
                    self.log_test("Medical Rep Permissions", False, "فشل تسجيل دخول المندوب الطبي")
                    return False
            else:
                self.log_test("Medical Rep Permissions", False, "فشل إنشاء مستخدم مندوب طبي")
                return False
                
        except Exception as e:
            self.log_test("Medical Rep Permissions", False, f"خطأ في اختبار صلاحيات المندوب الطبي: {str(e)}")
            return False

    def test_error_handling(self):
        """E - اختبار معالجة الأخطاء"""
        try:
            error_tests = []
            
            # 1. محاولة إنشاء خط بكود مكرر
            duplicate_line_data = {
                "name": "خط مكرر",
                "code": "DUPLICATE_CODE",
                "description": "اختبار الكود المكرر"
            }
            
            # إنشاء الخط الأول
            response1, _ = self.make_request("POST", "/lines", duplicate_line_data, token=self.admin_token)
            # محاولة إنشاء خط بنفس الكود
            response2, _ = self.make_request("POST", "/lines", duplicate_line_data, token=self.admin_token)
            
            if response2 and response2.status_code == 400:
                error_tests.append("✅ منع الكود المكرر للخطوط")
            else:
                error_tests.append("❌ لم يمنع الكود المكرر للخطوط")
            
            # 2. محاولة إنشاء منطقة بكود مكرر
            duplicate_area_data = {
                "name": "منطقة مكررة",
                "code": "DUPLICATE_AREA_CODE",
                "description": "اختبار الكود المكرر للمناطق"
            }
            
            response3, _ = self.make_request("POST", "/areas", duplicate_area_data, token=self.admin_token)
            response4, _ = self.make_request("POST", "/areas", duplicate_area_data, token=self.admin_token)
            
            if response4 and response4.status_code == 400:
                error_tests.append("✅ منع الكود المكرر للمناطق")
            else:
                error_tests.append("❌ لم يمنع الكود المكرر للمناطق")
            
            # 3. محاولة إنشاء منتج بحقول ناقصة
            incomplete_product_data = {
                "name": "منتج ناقص"
                # نقص الحقول المطلوبة
            }
            
            response5, _ = self.make_request("POST", "/products", incomplete_product_data, token=self.admin_token)
            
            if response5 and response5.status_code == 400:
                error_tests.append("✅ منع إنشاء منتج بحقول ناقصة")
            else:
                error_tests.append("❌ لم يمنع إنشاء منتج بحقول ناقصة")
            
            success = all("✅" in test for test in error_tests)
            details = " | ".join(error_tests)
            
            self.log_test(
                "Error Handling Tests",
                success,
                details
            )
            return success
            
        except Exception as e:
            self.log_test("Error Handling Tests", False, f"خطأ في اختبار معالجة الأخطاء: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل لمشاكل إدارة المنتجات والخطوط والمناطق")
        print("=" * 80)
        
        # A. اختبار APIs الأساسية
        print("\n📋 A. اختبار APIs الأساسية:")
        self.test_admin_login()
        self.test_get_existing_lines()
        self.test_create_new_line()
        self.test_get_existing_areas()
        self.test_create_new_area()
        self.test_get_existing_products()
        self.test_create_new_product_with_line_linking()
        
        # B. اختبار التكامل والربط
        print("\n🔗 B. اختبار التكامل والربط:")
        self.test_data_consistency_verification()
        
        # C. اختبار الصلاحيات
        print("\n🔐 C. اختبار الصلاحيات:")
        self.test_line_manager_permissions()
        self.test_medical_rep_permissions()
        
        # E. اختبار معالجة الأخطاء
        print("\n⚠️ E. اختبار معالجة الأخطاء:")
        self.test_error_handling()
        
        # تلخيص النتائج
        self.print_final_summary()

    def print_final_summary(self):
        """طباعة الملخص النهائي"""
        print("\n" + "=" * 80)
        print("📊 الملخص النهائي للاختبار الشامل")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 إجمالي الاختبارات: {total_tests}")
        print(f"✅ نجح: {successful_tests}")
        print(f"❌ فشل: {failed_tests}")
        print(f"📊 معدل النجاح: {success_rate:.1f}%")
        
        print("\n🔍 تفاصيل المشاكل المبلغ عنها:")
        
        # تحليل المشاكل المحددة
        issues_analysis = {
            "مشكلة إضافة خطوط جديدة": any("Create New Line" in t["test"] and t["success"] for t in self.test_results),
            "مشكلة إضافة مناطق": any("Create New Area" in t["test"] and t["success"] for t in self.test_results),
            "مشكلة ربط الخطوط في المنتجات": any("Line Linking" in t["test"] and t["success"] for t in self.test_results),
            "صلاحيات مدير الخط": any("Line Manager Permissions" in t["test"] and t["success"] for t in self.test_results),
            "صلاحيات المندوب الطبي": any("Medical Rep Permissions" in t["test"] and t["success"] for t in self.test_results)
        }
        
        for issue, resolved in issues_analysis.items():
            status = "✅ محلولة" if resolved else "❌ لم تُحل"
            print(f"  • {issue}: {status}")
        
        print("\n📋 الاختبارات الفاشلة:")
        failed_tests_list = [t for t in self.test_results if not t["success"]]
        if failed_tests_list:
            for test in failed_tests_list:
                print(f"  ❌ {test['test']}: {test['details']}")
        else:
            print("  🎉 لا توجد اختبارات فاشلة!")
        
        print("\n🎯 التوصيات:")
        if success_rate >= 90:
            print("  ✅ النظام يعمل بشكل ممتاز - جميع المشاكل المبلغ عنها تم حلها")
        elif success_rate >= 75:
            print("  ⚠️ النظام يعمل بشكل جيد مع بعض المشاكل البسيطة")
        else:
            print("  ❌ النظام يحتاج إلى إصلاحات جوهرية")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = ComprehensiveLinesAreasProductsTest()
    tester.run_comprehensive_test()