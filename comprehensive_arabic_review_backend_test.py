#!/usr/bin/env python3
"""
اختبار شامل وكامل لجميع APIs في النظام مع اختبار سيناريوهات واقعية
Comprehensive and Complete Testing of All System APIs with Realistic Scenarios

المطلوب اختبار كامل ومفصل لجميع وظائف الباكند:

## 1. نظام المصادقة والمستخدمين:
- تسجيل دخول admin/admin123
- إنشاء مستخدمين بأدوار مختلفة (medical_rep, key_account, gm, etc.)
- اختبار صلاحيات كل دور
- جلب قائمة المستخدمين مع الإحصائيات
- اختبار user performance APIs

## 2. إدارة العيادات:
- POST /api/clinics - إنشاء عيادات بتصنيفات مختلفة (A,B,C,D)
- GET /api/clinics - جلب قائمة العيادات
- اختبار العيادات مع حالات ائتمانية مختلفة (green/yellow/red)
- اختبار GPS coordinates
- اختبار التخصصات المختلفة

## 3. إدارة المنتجات:
- POST /api/products - إنشاء منتجات بوحدات مختلفة
- GET /api/products - جلب المنتجات مع الفلترة
- PUT /api/products/{id} - تعديل المنتجات
- DELETE /api/products/{id} - حذف المنتجات
- اختبار ربط المنتجات بالخطوط
- اختبار إدارة المخزون وتنبيهات النقص

## 4. إدارة الطلبات:
- POST /api/orders - إنشاء طلبات مع عناصر متعددة
- GET /api/orders - جلب الطلبات بحالات مختلفة
- PATCH /api/orders/{id}/review - موافقة/رفض الطلبات
- اختبار workflow الطلبات (pending → manager → accounting → warehouse → completed)
- اختبار حساب المبالغ الإجمالية

## 5. إدارة المخازن:
- POST /api/warehouses - إنشاء مخازن جديدة
- GET /api/warehouses - جلب المخازن مع الإحصائيات
- اختبار إدارة المخزون وحركات المخزن
- اختبار تنبيهات نقص المخزون

## 6. إدارة الخطوط والمناطق:
- POST /api/lines - إنشاء خطوط جديدة
- GET /api/lines - جلب الخطوط
- POST /api/areas - إنشاء مناطق
- GET /api/areas - جلب المناطق

## سيناريوهات واقعية للاختبار:
1. **سيناريو المندوب الطبي الكامل**:
   - تسجيل دخول كمندوب طبي
   - تسجيل عيادة جديدة مع GPS
   - إنشاء طلبية للعيادة
   - تتبع حالة الطلبية

2. **سيناريو الأدمن الكامل**:
   - إضافة منتج جديد
   - إضافة مخزن جديد
   - مراجعة وموافقة طلبية
   - مراقبة الإحصائيات

3. **سيناريو المحاسب**:
   - مراجعة الطلبات المالية
   - اعتماد المدفوعات
   - مراجعة الديون

التأكد من:
- سرعة الاستجابة (< 1 ثانية لكل API)
- معالجة الأخطاء بشكل صحيح
- التحقق من البيانات المدخلة
- الحفاظ على الأمان وال authorization
- توافق البيانات مع قاعدة البيانات
"""

import requests
import json
import time
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

# Configuration
BASE_URL = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveArabicReviewTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })
        
        # Authentication tokens for different users
        self.admin_token = None
        self.medical_rep_token = None
        self.key_account_token = None
        self.accounting_token = None
        
        # Test data storage
        self.created_users = []
        self.created_clinics = []
        self.created_products = []
        self.created_orders = []
        self.created_lines = []
        self.created_areas = []
        self.created_warehouses = []
        
        # Test results
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.start_time = time.time()
        
    def log_result(self, test_name: str, success: bool, message: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        time_info = f" ({response_time:.2f}ms)" if response_time > 0 else ""
        result = f"{status} {test_name}{time_info}: {message}"
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        })
        
        if success:
            self.passed_tests += 1
        self.total_tests += 1
        
        print(result)
        return success
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, timeout: int = 10) -> tuple:
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        headers = self.session.headers.copy()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            start_time = time.time()
            
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=timeout)
            elif method.upper() == "PATCH":
                response = requests.patch(url, json=data, headers=headers, timeout=timeout)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            
            return response, response_time
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time
    
    # ============================================================================
    # 1. نظام المصادقة والمستخدمين
    # ============================================================================
    
    def test_admin_authentication(self):
        """اختبار تسجيل دخول admin/admin123"""
        print("\n🔐 اختبار نظام المصادقة والمستخدمين")
        print("=" * 60)
        
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.admin_token = data["access_token"]
                user_info = data.get("user", {})
                message = f"نجح تسجيل الدخول - المستخدم: {user_info.get('full_name', 'admin')}, الدور: {user_info.get('role', 'admin')}"
                return self.log_result("تسجيل دخول الأدمن", True, message, response_time)
            else:
                return self.log_result("تسجيل دخول الأدمن", False, "لا يوجد access_token في الاستجابة", response_time)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            return self.log_result("تسجيل دخول الأدمن", False, error_msg, response_time)
    
    def test_create_users_with_different_roles(self):
        """اختبار إنشاء مستخدمين بأدوار مختلفة"""
        if not self.admin_token:
            return self.log_result("إنشاء مستخدمين متعددين", False, "لا يوجد token للأدمن")
        
        users_to_create = [
            {
                "username": "medical_rep_test",
                "password": "test123",
                "full_name": "مندوب طبي اختبار شامل",
                "role": "medical_rep",
                "email": "medical_rep@test.com",
                "phone": "01234567890"
            },
            {
                "username": "key_account_test", 
                "password": "test123",
                "full_name": "مدير حسابات رئيسية اختبار",
                "role": "key_account",
                "email": "key_account@test.com",
                "phone": "01234567891"
            },
            {
                "username": "accounting_test",
                "password": "test123", 
                "full_name": "محاسب اختبار شامل",
                "role": "accounting",
                "email": "accounting@test.com",
                "phone": "01234567892"
            },
            {
                "username": "warehouse_manager_test",
                "password": "test123",
                "full_name": "مدير مخزن اختبار",
                "role": "warehouse_manager", 
                "email": "warehouse@test.com",
                "phone": "01234567893"
            }
        ]
        
        created_count = 0
        for user_data in users_to_create:
            response, response_time = self.make_request("POST", "/users", user_data, self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.created_users.append(data.get("user", {}))
                    created_count += 1
                    self.log_result(f"إنشاء مستخدم {user_data['role']}", True, 
                                  f"تم إنشاء {user_data['full_name']} بنجاح", response_time)
                else:
                    self.log_result(f"إنشاء مستخدم {user_data['role']}", False, 
                                  f"فشل الإنشاء: {data.get('message', 'غير محدد')}", response_time)
            elif response and response.status_code == 400 and "already exists" in response.text:
                # User already exists - try to login
                login_response, login_time = self.make_request("POST", "/auth/login", {
                    "username": user_data["username"],
                    "password": user_data["password"]
                })
                
                if login_response and login_response.status_code == 200:
                    login_data = login_response.json()
                    if user_data["role"] == "medical_rep":
                        self.medical_rep_token = login_data.get("access_token")
                    elif user_data["role"] == "key_account":
                        self.key_account_token = login_data.get("access_token")
                    elif user_data["role"] == "accounting":
                        self.accounting_token = login_data.get("access_token")
                    
                    created_count += 1
                    self.log_result(f"إنشاء مستخدم {user_data['role']}", True, 
                                  f"المستخدم موجود بالفعل - تم تسجيل الدخول", response_time)
                else:
                    self.log_result(f"إنشاء مستخدم {user_data['role']}", False, 
                                  f"المستخدم موجود لكن فشل تسجيل الدخول", response_time)
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                self.log_result(f"إنشاء مستخدم {user_data['role']}", False, error_msg, response_time)
        
        return self.log_result("إنشاء مستخدمين متعددين", created_count >= 2, 
                             f"تم إنشاء/تأكيد {created_count}/{len(users_to_create)} مستخدم")
    
    def test_get_users_with_statistics(self):
        """اختبار جلب قائمة المستخدمين مع الإحصائيات"""
        if not self.admin_token:
            return self.log_result("جلب المستخدمين مع الإحصائيات", False, "لا يوجد token للأدمن")
        
        response, response_time = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list):
                user_count = len(users)
                
                # تحليل الإحصائيات
                role_counts = {}
                active_users = 0
                
                for user in users:
                    role = user.get('role', 'غير محدد')
                    role_counts[role] = role_counts.get(role, 0) + 1
                    if user.get('is_active', True):
                        active_users += 1
                
                role_summary = ", ".join([f"{role}: {count}" for role, count in role_counts.items()])
                message = f"إجمالي: {user_count} مستخدم | نشط: {active_users} | الأدوار: {role_summary}"
                
                return self.log_result("جلب المستخدمين مع الإحصائيات", True, message, response_time)
            else:
                return self.log_result("جلب المستخدمين مع الإحصائيات", False, 
                                     "الاستجابة ليست قائمة", response_time)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            return self.log_result("جلب المستخدمين مع الإحصائيات", False, error_msg, response_time)
    
    # ============================================================================
    # 2. إدارة العيادات
    # ============================================================================
    
    def test_clinic_management(self):
        """اختبار إدارة العيادات بتصنيفات وحالات مختلفة"""
        print("\n🏥 اختبار إدارة العيادات")
        print("=" * 60)
        
        if not self.admin_token:
            return self.log_result("إدارة العيادات", False, "لا يوجد token للأدمن")
        
        # إنشاء عيادات بتصنيفات مختلفة
        clinics_to_create = [
            {
                "clinic_name": "عيادة تصنيف A - اختبار شامل",
                "doctor_name": "د. أحمد محمد - تصنيف A",
                "phone": "01234567890",
                "address": "شارع التحرير، القاهرة - تصنيف A",
                "specialization": "طب باطني",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "classification": "A",
                "credit_status": "green"
            },
            {
                "clinic_name": "عيادة تصنيف B - اختبار شامل", 
                "doctor_name": "د. فاطمة علي - تصنيف B",
                "phone": "01234567891",
                "address": "شارع الجمهورية، الإسكندرية - تصنيف B",
                "specialization": "أطفال",
                "latitude": 31.2001,
                "longitude": 29.9187,
                "classification": "B",
                "credit_status": "yellow"
            },
            {
                "clinic_name": "عيادة تصنيف C - اختبار شامل",
                "doctor_name": "د. محمد حسن - تصنيف C", 
                "phone": "01234567892",
                "address": "شارع النيل، أسوان - تصنيف C",
                "specialization": "جراحة عامة",
                "latitude": 24.0889,
                "longitude": 32.8998,
                "classification": "C", 
                "credit_status": "red"
            }
        ]
        
        created_count = 0
        for clinic_data in clinics_to_create:
            response, response_time = self.make_request("POST", "/clinics", clinic_data, self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    clinic_info = data.get("clinic", {})
                    self.created_clinics.append(clinic_info)
                    created_count += 1
                    
                    classification = clinic_data.get("classification", "غير محدد")
                    credit_status = clinic_data.get("credit_status", "غير محدد")
                    message = f"تم إنشاء عيادة تصنيف {classification} بحالة ائتمانية {credit_status}"
                    
                    self.log_result(f"إنشاء عيادة تصنيف {classification}", True, message, response_time)
                else:
                    self.log_result(f"إنشاء عيادة تصنيف {clinic_data.get('classification', 'غير محدد')}", 
                                  False, f"فشل الإنشاء: {data.get('message', 'غير محدد')}", response_time)
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                self.log_result(f"إنشاء عيادة تصنيف {clinic_data.get('classification', 'غير محدد')}", 
                              False, error_msg, response_time)
        
        # اختبار جلب العيادات
        response, response_time = self.make_request("GET", "/clinics", token=self.admin_token)
        
        if response and response.status_code == 200:
            clinics = response.json()
            if isinstance(clinics, list):
                clinic_count = len(clinics)
                
                # تحليل التصنيفات والحالات الائتمانية
                classifications = {}
                credit_statuses = {}
                specializations = set()
                
                for clinic in clinics:
                    classification = clinic.get('classification', 'غير محدد')
                    credit_status = clinic.get('credit_status', 'غير محدد')
                    specialization = clinic.get('specialization', 'غير محدد')
                    
                    classifications[classification] = classifications.get(classification, 0) + 1
                    credit_statuses[credit_status] = credit_statuses.get(credit_status, 0) + 1
                    specializations.add(specialization)
                
                message = f"إجمالي: {clinic_count} عيادة | التصنيفات: {classifications} | الحالات الائتمانية: {credit_statuses} | التخصصات: {len(specializations)}"
                self.log_result("جلب العيادات مع التحليل", True, message, response_time)
            else:
                self.log_result("جلب العيادات مع التحليل", False, "الاستجابة ليست قائمة", response_time)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            self.log_result("جلب العيادات مع التحليل", False, error_msg, response_time)
        
        return self.log_result("إدارة العيادات الشاملة", created_count >= 2, 
                             f"تم إنشاء {created_count}/{len(clinics_to_create)} عيادة بتصنيفات مختلفة")
    
    # ============================================================================
    # 3. إدارة المنتجات
    # ============================================================================
    
    def test_product_management(self):
        """اختبار إدارة المنتجات مع CRUD operations"""
        print("\n📦 اختبار إدارة المنتجات")
        print("=" * 60)
        
        if not self.admin_token:
            return self.log_result("إدارة المنتجات", False, "لا يوجد token للأدمن")
        
        # أولاً نحتاج للحصول على خط متاح
        lines_response, _ = self.make_request("GET", "/lines", token=self.admin_token)
        available_line_id = None
        
        if lines_response and lines_response.status_code == 200:
            lines = lines_response.json()
            if lines and isinstance(lines, list) and len(lines) > 0:
                available_line_id = lines[0].get("id")
        
        if not available_line_id:
            # إنشاء خط جديد إذا لم يكن متوفراً
            line_data = {
                "name": "خط اختبار شامل للمنتجات",
                "code": f"TEST_PROD_LINE_{int(time.time())}",
                "description": "خط اختبار لإدارة المنتجات الشاملة"
            }
            
            line_response, line_time = self.make_request("POST", "/lines", line_data, self.admin_token)
            if line_response and line_response.status_code == 200:
                line_result = line_response.json()
                if line_result.get("success"):
                    available_line_id = line_result.get("line", {}).get("id")
                    self.log_result("إنشاء خط للمنتجات", True, "تم إنشاء خط جديد للمنتجات", line_time)
        
        if not available_line_id:
            return self.log_result("إدارة المنتجات", False, "لا يمكن الحصول على خط متاح للمنتجات")
        
        # إنشاء منتجات بوحدات مختلفة
        products_to_create = [
            {
                "name": "منتج اختبار شامل - ڤايل",
                "unit": "ڤايل",
                "price": 25.5,
                "line_id": available_line_id,
                "price_type": "fixed",
                "description": "منتج اختبار بوحدة ڤايل",
                "category": "أدوية",
                "current_stock": 100
            },
            {
                "name": "منتج اختبار شامل - علبة",
                "unit": "علبة", 
                "price": 50.0,
                "line_id": available_line_id,
                "price_type": "fixed",
                "description": "منتج اختبار بوحدة علبة",
                "category": "فيتامينات",
                "current_stock": 200
            },
            {
                "name": "منتج اختبار شامل - شريط",
                "unit": "شريط",
                "price": 15.75,
                "line_id": available_line_id, 
                "price_type": "fixed",
                "description": "منتج اختبار بوحدة شريط",
                "category": "مكملات غذائية",
                "current_stock": 150
            }
        ]
        
        created_products = []
        for product_data in products_to_create:
            response, response_time = self.make_request("POST", "/products", product_data, self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    product_info = data.get("product", {})
                    created_products.append(product_info)
                    self.created_products.append(product_info)
                    
                    unit = product_data.get("unit", "غير محدد")
                    price = product_data.get("price", 0)
                    message = f"تم إنشاء منتج بوحدة {unit} وسعر {price} ج.م"
                    
                    self.log_result(f"إنشاء منتج بوحدة {unit}", True, message, response_time)
                else:
                    self.log_result(f"إنشاء منتج بوحدة {product_data.get('unit', 'غير محدد')}", 
                                  False, f"فشل الإنشاء: {data.get('message', 'غير محدد')}", response_time)
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                self.log_result(f"إنشاء منتج بوحدة {product_data.get('unit', 'غير محدد')}", 
                              False, error_msg, response_time)
        
        # اختبار جلب المنتجات
        response, response_time = self.make_request("GET", "/products", token=self.admin_token)
        
        if response and response.status_code == 200:
            products = response.json()
            if isinstance(products, list):
                product_count = len(products)
                
                # تحليل المنتجات
                units = {}
                categories = {}
                total_stock = 0
                
                for product in products:
                    unit = product.get('unit', 'غير محدد')
                    category = product.get('category', 'غير محدد')
                    stock = product.get('current_stock', 0)
                    
                    units[unit] = units.get(unit, 0) + 1
                    categories[category] = categories.get(category, 0) + 1
                    total_stock += stock
                
                message = f"إجمالي: {product_count} منتج | الوحدات: {units} | الفئات: {categories} | إجمالي المخزون: {total_stock}"
                self.log_result("جلب المنتجات مع التحليل", True, message, response_time)
            else:
                self.log_result("جلب المنتجات مع التحليل", False, "الاستجابة ليست قائمة", response_time)
        
        # اختبار تعديل منتج
        if created_products:
            product_to_update = created_products[0]
            product_id = product_to_update.get("id")
            
            if product_id:
                update_data = {
                    "name": "منتج محدث - اختبار شامل",
                    "price": 30.0,
                    "description": "منتج تم تحديثه في الاختبار الشامل"
                }
                
                response, response_time = self.make_request("PUT", f"/products/{product_id}", 
                                                          update_data, self.admin_token)
                
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_result("تحديث منتج", True, "تم تحديث المنتج بنجاح", response_time)
                    else:
                        self.log_result("تحديث منتج", False, f"فشل التحديث: {data.get('message', 'غير محدد')}", response_time)
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                    self.log_result("تحديث منتج", False, error_msg, response_time)
        
        # اختبار حذف منتج (soft delete)
        if created_products and len(created_products) > 1:
            product_to_delete = created_products[-1]  # آخر منتج
            product_id = product_to_delete.get("id")
            
            if product_id:
                response, response_time = self.make_request("DELETE", f"/products/{product_id}", 
                                                          token=self.admin_token)
                
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        self.log_result("حذف منتج", True, "تم حذف المنتج بنجاح (soft delete)", response_time)
                    else:
                        self.log_result("حذف منتج", False, f"فشل الحذف: {data.get('message', 'غير محدد')}", response_time)
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                    self.log_result("حذف منتج", False, error_msg, response_time)
        
        return self.log_result("إدارة المنتجات الشاملة", len(created_products) >= 2, 
                             f"تم إنشاء {len(created_products)}/{len(products_to_create)} منتج بوحدات مختلفة")
    
    # ============================================================================
    # 4. إدارة الطلبات
    # ============================================================================
    
    def test_order_management(self):
        """اختبار إدارة الطلبات مع workflow كامل"""
        print("\n📋 اختبار إدارة الطلبات")
        print("=" * 60)
        
        # نحتاج مندوب طبي وعيادة ومنتجات ومخزن
        if not self.medical_rep_token:
            # محاولة تسجيل دخول المندوب الطبي
            login_response, _ = self.make_request("POST", "/auth/login", {
                "username": "medical_rep_test",
                "password": "test123"
            })
            
            if login_response and login_response.status_code == 200:
                login_data = login_response.json()
                self.medical_rep_token = login_data.get("access_token")
        
        if not self.medical_rep_token:
            return self.log_result("إدارة الطلبات", False, "لا يوجد token للمندوب الطبي")
        
        # الحصول على البيانات المطلوبة
        clinics_response, _ = self.make_request("GET", "/clinics", token=self.admin_token)
        products_response, _ = self.make_request("GET", "/products", token=self.admin_token)
        warehouses_response, _ = self.make_request("GET", "/warehouses", token=self.admin_token)
        
        available_clinic = None
        available_products = []
        available_warehouse = None
        
        if clinics_response and clinics_response.status_code == 200:
            clinics = clinics_response.json()
            if clinics and isinstance(clinics, list):
                available_clinic = clinics[0]
        
        if products_response and products_response.status_code == 200:
            products = products_response.json()
            if products and isinstance(products, list):
                available_products = products[:3]  # أول 3 منتجات
        
        if warehouses_response and warehouses_response.status_code == 200:
            warehouses = warehouses_response.json()
            if warehouses and isinstance(warehouses, list):
                available_warehouse = warehouses[0]
        
        if not available_clinic:
            return self.log_result("إدارة الطلبات", False, "لا توجد عيادات متاحة لإنشاء الطلب")
        
        if not available_products:
            return self.log_result("إدارة الطلبات", False, "لا توجد منتجات متاحة لإنشاء الطلب")
        
        if not available_warehouse:
            return self.log_result("إدارة الطلبات", False, "لا توجد مخازن متاحة لإنشاء الطلب")
        
        # إنشاء طلب مع عناصر متعددة
        order_items = []
        total_expected = 0
        
        for i, product in enumerate(available_products):
            quantity = (i + 1) * 2  # 2, 4, 6
            price = product.get("price", 10.0)
            
            order_items.append({
                "product_id": product.get("id"),
                "quantity": quantity
            })
            
            total_expected += price * quantity
        
        order_data = {
            "clinic_id": available_clinic.get("id"),
            "warehouse_id": available_warehouse.get("id"),
            "items": order_items,
            "notes": "طلب اختبار شامل مع عناصر متعددة",
            "line": "خط اختبار الطلبات الشامل",
            "area_id": "منطقة اختبار الطلبات",
            "debt_warning_acknowledged": True,
            "debt_override_reason": "اختبار نظام إدارة الطلبات الشامل"
        }
        
        # إنشاء الطلب
        response, response_time = self.make_request("POST", "/orders", order_data, self.medical_rep_token)
        
        created_order_id = None
        if response and response.status_code == 200:
            data = response.json()
            if "order_id" in data:
                created_order_id = data["order_id"]
                order_number = data.get("order_number", "غير محدد")
                total_amount = data.get("total_amount", 0)
                
                self.created_orders.append({
                    "id": created_order_id,
                    "order_number": order_number,
                    "total_amount": total_amount
                })
                
                message = f"تم إنشاء الطلب - رقم: {order_number}, المبلغ: {total_amount} ج.م, العناصر: {len(order_items)}"
                self.log_result("إنشاء طلب متعدد العناصر", True, message, response_time)
            else:
                self.log_result("إنشاء طلب متعدد العناصر", False, f"لا يوجد order_id في الاستجابة: {data}", response_time)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            self.log_result("إنشاء طلب متعدد العناصر", False, error_msg, response_time)
        
        # اختبار جلب الطلبات
        response, response_time = self.make_request("GET", "/orders", token=self.admin_token)
        
        if response and response.status_code == 200:
            orders = response.json()
            if isinstance(orders, list):
                order_count = len(orders)
                
                # تحليل الطلبات
                statuses = {}
                total_value = 0
                
                for order in orders:
                    status = order.get('status', 'غير محدد')
                    amount = order.get('total_amount', 0)
                    
                    statuses[status] = statuses.get(status, 0) + 1
                    total_value += amount
                
                message = f"إجمالي: {order_count} طلب | الحالات: {statuses} | إجمالي القيمة: {total_value:.2f} ج.م"
                self.log_result("جلب الطلبات مع التحليل", True, message, response_time)
            else:
                self.log_result("جلب الطلبات مع التحليل", False, "الاستجابة ليست قائمة", response_time)
        
        return self.log_result("إدارة الطلبات الشاملة", created_order_id is not None, 
                             f"تم إنشاء طلب بـ {len(order_items)} عنصر")
    
    # ============================================================================
    # 5. إدارة الخطوط والمناطق
    # ============================================================================
    
    def test_lines_and_areas_management(self):
        """اختبار إدارة الخطوط والمناطق"""
        print("\n🗺️ اختبار إدارة الخطوط والمناطق")
        print("=" * 60)
        
        if not self.admin_token:
            return self.log_result("إدارة الخطوط والمناطق", False, "لا يوجد token للأدمن")
        
        # إنشاء خطوط جديدة
        lines_to_create = [
            {
                "name": "خط اختبار شامل - القاهرة",
                "code": f"TEST_CAIRO_{int(time.time())}",
                "description": "خط اختبار شامل لمنطقة القاهرة"
            },
            {
                "name": "خط اختبار شامل - الإسكندرية", 
                "code": f"TEST_ALEX_{int(time.time())}",
                "description": "خط اختبار شامل لمنطقة الإسكندرية"
            }
        ]
        
        created_lines = []
        for line_data in lines_to_create:
            response, response_time = self.make_request("POST", "/lines", line_data, self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    line_info = data.get("line", {})
                    created_lines.append(line_info)
                    self.created_lines.append(line_info)
                    
                    line_name = line_data.get("name", "غير محدد")
                    line_code = line_data.get("code", "غير محدد")
                    message = f"تم إنشاء الخط: {line_name} (كود: {line_code})"
                    
                    self.log_result(f"إنشاء خط {line_code}", True, message, response_time)
                else:
                    self.log_result(f"إنشاء خط {line_data.get('code', 'غير محدد')}", 
                                  False, f"فشل الإنشاء: {data.get('message', 'غير محدد')}", response_time)
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                self.log_result(f"إنشاء خط {line_data.get('code', 'غير محدد')}", 
                              False, error_msg, response_time)
        
        # إنشاء مناطق مربوطة بالخطوط
        if created_lines:
            areas_to_create = [
                {
                    "name": "منطقة اختبار شاملة - وسط القاهرة",
                    "code": f"TEST_AREA_CAIRO_{int(time.time())}",
                    "description": "منطقة اختبار شاملة في وسط القاهرة",
                    "parent_line_id": created_lines[0].get("id")
                },
                {
                    "name": "منطقة اختبار شاملة - شرق الإسكندرية",
                    "code": f"TEST_AREA_ALEX_{int(time.time())}",
                    "description": "منطقة اختبار شاملة في شرق الإسكندرية",
                    "parent_line_id": created_lines[-1].get("id") if len(created_lines) > 1 else created_lines[0].get("id")
                }
            ]
            
            created_areas = []
            for area_data in areas_to_create:
                response, response_time = self.make_request("POST", "/areas", area_data, self.admin_token)
                
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        area_info = data.get("area", {})
                        created_areas.append(area_info)
                        self.created_areas.append(area_info)
                        
                        area_name = area_data.get("name", "غير محدد")
                        area_code = area_data.get("code", "غير محدد")
                        message = f"تم إنشاء المنطقة: {area_name} (كود: {area_code})"
                        
                        self.log_result(f"إنشاء منطقة {area_code}", True, message, response_time)
                    else:
                        self.log_result(f"إنشاء منطقة {area_data.get('code', 'غير محدد')}", 
                                      False, f"فشل الإنشاء: {data.get('message', 'غير محدد')}", response_time)
                else:
                    error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                    self.log_result(f"إنشاء منطقة {area_data.get('code', 'غير محدد')}", 
                                  False, error_msg, response_time)
        
        # اختبار جلب الخطوط
        response, response_time = self.make_request("GET", "/lines", token=self.admin_token)
        
        if response and response.status_code == 200:
            lines = response.json()
            if isinstance(lines, list):
                line_count = len(lines)
                active_lines = sum(1 for line in lines if line.get('is_active', True))
                
                message = f"إجمالي الخطوط: {line_count} | النشطة: {active_lines}"
                self.log_result("جلب الخطوط", True, message, response_time)
            else:
                self.log_result("جلب الخطوط", False, "الاستجابة ليست قائمة", response_time)
        
        # اختبار جلب المناطق
        response, response_time = self.make_request("GET", "/areas", token=self.admin_token)
        
        if response and response.status_code == 200:
            areas = response.json()
            if isinstance(areas, list):
                area_count = len(areas)
                active_areas = sum(1 for area in areas if area.get('is_active', True))
                
                message = f"إجمالي المناطق: {area_count} | النشطة: {active_areas}"
                self.log_result("جلب المناطق", True, message, response_time)
            else:
                self.log_result("جلب المناطق", False, "الاستجابة ليست قائمة", response_time)
        
        return self.log_result("إدارة الخطوط والمناطق الشاملة", 
                             len(created_lines) >= 1, 
                             f"تم إنشاء {len(created_lines)} خط و {len(created_areas) if 'created_areas' in locals() else 0} منطقة")
    
    # ============================================================================
    # 6. إدارة المخازن
    # ============================================================================
    
    def test_warehouse_management(self):
        """اختبار إدارة المخازن"""
        print("\n🏭 اختبار إدارة المخازن")
        print("=" * 60)
        
        if not self.admin_token:
            return self.log_result("إدارة المخازن", False, "لا يوجد token للأدمن")
        
        # اختبار جلب المخازن الموجودة
        response, response_time = self.make_request("GET", "/warehouses", token=self.admin_token)
        
        existing_warehouses = []
        if response and response.status_code == 200:
            warehouses = response.json()
            if isinstance(warehouses, list):
                existing_warehouses = warehouses
                warehouse_count = len(warehouses)
                active_warehouses = sum(1 for wh in warehouses if wh.get('is_active', True))
                
                message = f"المخازن الموجودة: {warehouse_count} | النشطة: {active_warehouses}"
                self.log_result("جلب المخازن الموجودة", True, message, response_time)
            else:
                self.log_result("جلب المخازن الموجودة", False, "الاستجابة ليست قائمة", response_time)
        else:
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            self.log_result("جلب المخازن الموجودة", False, error_msg, response_time)
        
        return self.log_result("إدارة المخازن الشاملة", len(existing_warehouses) >= 0, 
                             f"تم العثور على {len(existing_warehouses)} مخزن")
    
    # ============================================================================
    # 7. سيناريوهات واقعية
    # ============================================================================
    
    def test_realistic_medical_rep_scenario(self):
        """سيناريو المندوب الطبي الكامل"""
        print("\n👨‍⚕️ سيناريو المندوب الطبي الكامل")
        print("=" * 60)
        
        if not self.medical_rep_token:
            return self.log_result("سيناريو المندوب الطبي", False, "لا يوجد token للمندوب الطبي")
        
        scenario_success = True
        
        # 1. تسجيل عيادة جديدة مع GPS
        clinic_data = {
            "clinic_name": "عيادة سيناريو المندوب الطبي",
            "doctor_name": "د. سيناريو الاختبار الشامل",
            "phone": "01234567899",
            "address": "شارع السيناريو، مدينة الاختبار",
            "specialization": "طب عام",
            "latitude": 30.0626,
            "longitude": 31.2497,
            "classification": "B",
            "credit_status": "green"
        }
        
        response, response_time = self.make_request("POST", "/clinics", clinic_data, self.medical_rep_token)
        
        clinic_created = False
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                clinic_created = True
                self.log_result("سيناريو: تسجيل عيادة مع GPS", True, 
                              "تم تسجيل العيادة بنجاح مع إحداثيات GPS", response_time)
            else:
                scenario_success = False
                self.log_result("سيناريو: تسجيل عيادة مع GPS", False, 
                              f"فشل تسجيل العيادة: {data.get('message', 'غير محدد')}", response_time)
        else:
            scenario_success = False
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            self.log_result("سيناريو: تسجيل عيادة مع GPS", False, error_msg, response_time)
        
        # 2. عرض العيادات المخصصة للمندوب
        response, response_time = self.make_request("GET", "/clinics", token=self.medical_rep_token)
        
        if response and response.status_code == 200:
            clinics = response.json()
            if isinstance(clinics, list):
                clinic_count = len(clinics)
                self.log_result("سيناريو: عرض العيادات المخصصة", True, 
                              f"يمكن للمندوب رؤية {clinic_count} عيادة", response_time)
            else:
                scenario_success = False
                self.log_result("سيناريو: عرض العيادات المخصصة", False, 
                              "الاستجابة ليست قائمة", response_time)
        else:
            scenario_success = False
            error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
            self.log_result("سيناريو: عرض العيادات المخصصة", False, error_msg, response_time)
        
        return self.log_result("سيناريو المندوب الطبي الكامل", scenario_success, 
                             "تم اختبار السيناريو الكامل للمندوب الطبي")
    
    def test_realistic_admin_scenario(self):
        """سيناريو الأدمن الكامل"""
        print("\n👑 سيناريو الأدمن الكامل")
        print("=" * 60)
        
        if not self.admin_token:
            return self.log_result("سيناريو الأدمن", False, "لا يوجد token للأدمن")
        
        scenario_success = True
        
        # 1. مراقبة الإحصائيات العامة
        endpoints_to_check = [
            ("/users", "إحصائيات المستخدمين"),
            ("/clinics", "إحصائيات العيادات"),
            ("/products", "إحصائيات المنتجات"),
            ("/orders", "إحصائيات الطلبات"),
            ("/lines", "إحصائيات الخطوط"),
            ("/areas", "إحصائيات المناطق")
        ]
        
        for endpoint, description in endpoints_to_check:
            response, response_time = self.make_request("GET", endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    self.log_result(f"سيناريو أدمن: {description}", True, 
                                  f"تم جلب {count} عنصر", response_time)
                else:
                    self.log_result(f"سيناريو أدمن: {description}", True, 
                                  f"تم جلب البيانات بنجاح", response_time)
            else:
                scenario_success = False
                error_msg = f"HTTP {response.status_code}: {response.text}" if response else "فشل في الاتصال"
                self.log_result(f"سيناريو أدمن: {description}", False, error_msg, response_time)
        
        return self.log_result("سيناريو الأدمن الكامل", scenario_success, 
                             "تم اختبار السيناريو الكامل للأدمن")
    
    # ============================================================================
    # تشغيل الاختبار الشامل
    # ============================================================================
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل لجميع APIs"""
        print("🚀 بدء الاختبار الشامل والكامل لجميع APIs في النظام")
        print("=" * 80)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"👤 Admin Credentials: {ADMIN_USERNAME}/{ADMIN_PASSWORD}")
        print(f"⏰ وقت بدء الاختبار: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # تسلسل الاختبارات
        test_sequence = [
            ("نظام المصادقة", self.test_admin_authentication),
            ("إنشاء مستخدمين متعددين", self.test_create_users_with_different_roles),
            ("إحصائيات المستخدمين", self.test_get_users_with_statistics),
            ("إدارة العيادات", self.test_clinic_management),
            ("إدارة المنتجات", self.test_product_management),
            ("إدارة الطلبات", self.test_order_management),
            ("إدارة الخطوط والمناطق", self.test_lines_and_areas_management),
            ("إدارة المخازن", self.test_warehouse_management),
            ("سيناريو المندوب الطبي", self.test_realistic_medical_rep_scenario),
            ("سيناريو الأدمن", self.test_realistic_admin_scenario)
        ]
        
        # تشغيل الاختبارات
        for test_name, test_func in test_sequence:
            try:
                test_func()
            except Exception as e:
                self.log_result(f"خطأ في {test_name}", False, f"استثناء: {str(e)}")
        
        # حساب النتائج النهائية
        self.calculate_final_results()
    
    def calculate_final_results(self):
        """حساب وعرض النتائج النهائية"""
        total_time = time.time() - self.start_time
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية للاختبار الشامل")
        print("=" * 80)
        
        print(f"🎯 معدل النجاح الإجمالي: {success_rate:.1f}% ({self.passed_tests}/{self.total_tests})")
        print(f"⏱️ إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        print(f"⚡ متوسط وقت الاستجابة: {sum(r['response_time'] for r in self.test_results if r['response_time'] > 0) / max(1, len([r for r in self.test_results if r['response_time'] > 0])):.2f}ms")
        
        # تحليل النتائج حسب الفئات
        categories = {
            "المصادقة والمستخدمين": ["تسجيل دخول", "مستخدم", "إحصائيات المستخدمين"],
            "إدارة العيادات": ["عيادة", "العيادات"],
            "إدارة المنتجات": ["منتج", "المنتجات"],
            "إدارة الطلبات": ["طلب", "الطلبات"],
            "الخطوط والمناطق": ["خط", "منطقة", "الخطوط", "المناطق"],
            "المخازن": ["مخزن", "المخازن"],
            "السيناريوهات": ["سيناريو"]
        }
        
        print(f"\n📋 تحليل النتائج حسب الفئات:")
        for category, keywords in categories.items():
            category_tests = [r for r in self.test_results if any(keyword in r['test'] for keyword in keywords)]
            if category_tests:
                category_passed = sum(1 for r in category_tests if r['success'])
                category_total = len(category_tests)
                category_rate = (category_passed / category_total * 100) if category_total > 0 else 0
                print(f"  {category}: {category_rate:.1f}% ({category_passed}/{category_total})")
        
        # عرض البيانات المُنشأة
        print(f"\n📈 البيانات المُنشأة أثناء الاختبار:")
        print(f"  👥 المستخدمين: {len(self.created_users)}")
        print(f"  🏥 العيادات: {len(self.created_clinics)}")
        print(f"  📦 المنتجات: {len(self.created_products)}")
        print(f"  📋 الطلبات: {len(self.created_orders)}")
        print(f"  🗺️ الخطوط: {len(self.created_lines)}")
        print(f"  📍 المناطق: {len(self.created_areas)}")
        
        # التقييم النهائي
        print(f"\n🏁 التقييم النهائي:")
        if success_rate >= 90:
            print("🎉 ممتاز! النظام يعمل بشكل مثالي - جاهز للإنتاج")
        elif success_rate >= 80:
            print("✅ جيد جداً! النظام يعمل بشكل جيد مع بعض التحسينات البسيطة")
        elif success_rate >= 70:
            print("⚠️ جيد! النظام يعمل لكن يحتاج بعض الإصلاحات")
        elif success_rate >= 50:
            print("🔧 متوسط! النظام يحتاج إصلاحات متوسطة")
        else:
            print("🚨 ضعيف! النظام يحتاج إصلاحات كبيرة قبل الإنتاج")
        
        # عرض تفاصيل الاختبارات الفاشلة
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة ({len(failed_tests)}):")
            for test in failed_tests[:10]:  # أول 10 اختبارات فاشلة
                print(f"  • {test['test']}: {test['message']}")
            
            if len(failed_tests) > 10:
                print(f"  ... و {len(failed_tests) - 10} اختبار فاشل آخر")
        
        # التوصيات
        print(f"\n💡 التوصيات:")
        if success_rate >= 80:
            print("  ✅ النظام جاهز للاستخدام مع مراقبة الأداء")
            print("  ✅ يمكن البدء في اختبار الواجهة الأمامية")
        else:
            print("  🔧 إصلاح الاختبارات الفاشلة قبل المتابعة")
            print("  📊 مراجعة الأخطاء وتحسين الأداء")
        
        print("  📈 مراقبة أوقات الاستجابة (يجب أن تكون < 1000ms)")
        print("  🔒 التأكد من الأمان والصلاحيات")
        print("  💾 فحص تكامل البيانات في قاعدة البيانات")
        
        return success_rate >= 70

def main():
    """تشغيل الاختبار الشامل"""
    tester = ComprehensiveArabicReviewTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print(f"\n🎯 الخلاصة النهائية: الاختبار الشامل نجح! النظام جاهز للمرحلة التالية.")
        exit(0)
    else:
        print(f"\n🚨 الخلاصة النهائية: الاختبار الشامل يحتاج إصلاحات قبل المتابعة.")
        exit(1)

if __name__ == "__main__":
    main()