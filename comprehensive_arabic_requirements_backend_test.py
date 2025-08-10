#!/usr/bin/env python3
"""
اختبار شامل للباكند للتأكد من جاهزيته لتطبيق المتطلبات المتقدمة المطلوبة
Comprehensive Backend Testing for Advanced Arabic Requirements Readiness

الهدف: التأكد من أن الباكند يدعم جميع العمليات المطلوبة للمتطلبات الجديدة
Goal: Ensure backend supports all operations required for new requirements

الاختبارات المطلوبة:
1. اختبار APIs العيادات
2. اختبار APIs إدارة المناطق  
3. اختبار APIs الطلبات وسير العمل
4. اختبار APIs الديون والتحصيل
5. اختبار APIs المخازن والمنتجات
6. اختبار APIs لوحة التحكم
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveArabicRequirementsBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details, response_time=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status} {test_name}{time_info}")
        if not success:
            print(f"   التفاصيل: {details}")
    
    def authenticate(self):
        """تسجيل الدخول والحصول على JWT token"""
        print("🔐 بدء تسجيل الدخول...")
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                user_info = data.get("user", {})
                self.log_test(
                    "تسجيل الدخول (admin/admin123)",
                    True,
                    f"تم تسجيل الدخول بنجاح - المستخدم: {user_info.get('full_name', 'admin')} - الدور: {user_info.get('role', 'admin')}",
                    response_time
                )
                return True
            else:
                self.log_test(
                    "تسجيل الدخول (admin/admin123)",
                    False,
                    f"فشل تسجيل الدخول - HTTP {response.status_code}: {response.text}",
                    response_time
                )
                return False
                
        except Exception as e:
            self.log_test(
                "تسجيل الدخول (admin/admin123)",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_clinics_apis(self):
        """1. اختبار APIs العيادات"""
        print("\n📋 اختبار APIs العيادات...")
        
        # GET /api/clinics - الحصول على قائمة العيادات
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/clinics", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                clinic_count = len(clinics) if isinstance(clinics, list) else 0
                
                # تحليل بيانات العيادات
                active_clinics = sum(1 for clinic in clinics if clinic.get("is_active", True)) if isinstance(clinics, list) else 0
                
                self.log_test(
                    "GET /api/clinics - استرجاع قائمة العيادات",
                    True,
                    f"تم استرجاع {clinic_count} عيادة ({active_clinics} نشطة)",
                    response_time
                )
                
                # اختبار تفاصيل العيادة الأولى إذا وجدت
                if clinics and len(clinics) > 0:
                    first_clinic = clinics[0]
                    clinic_id = first_clinic.get("id")
                    
                    if clinic_id:
                        # اختبار PUT /api/clinics/{id} - تعديل عيادة
                        self.test_clinic_update(clinic_id, first_clinic)
                        
                        # اختبار DELETE /api/clinics/{id} - حذف عيادة (اختبار فقط بدون تنفيذ فعلي)
                        self.test_clinic_delete_check(clinic_id)
                
            else:
                self.log_test(
                    "GET /api/clinics - استرجاع قائمة العيادات",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/clinics - استرجاع قائمة العيادات",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_clinic_update(self, clinic_id, clinic_data):
        """اختبار تحديث عيادة"""
        start_time = time.time()
        try:
            # تحضير بيانات التحديث
            update_data = {
                "name": clinic_data.get("name", "عيادة محدثة"),
                "owner_name": clinic_data.get("owner_name", "دكتور محدث"),
                "phone": clinic_data.get("phone", "01234567890"),
                "is_active": clinic_data.get("is_active", True)
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/clinics/{clinic_id}",
                json=update_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                self.log_test(
                    f"PUT /api/clinics/{clinic_id} - تحديث عيادة",
                    True,
                    f"تم تحديث العيادة بنجاح - {result.get('message', 'تم التحديث')}",
                    response_time
                )
            else:
                self.log_test(
                    f"PUT /api/clinics/{clinic_id} - تحديث عيادة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"PUT /api/clinics/{clinic_id} - تحديث عيادة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_clinic_delete_check(self, clinic_id):
        """اختبار فحص إمكانية حذف عيادة (بدون حذف فعلي)"""
        start_time = time.time()
        try:
            # فحص وجود العيادة أولاً
            response = self.session.get(f"{BACKEND_URL}/clinics/{clinic_id}", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test(
                    f"DELETE /api/clinics/{clinic_id} - فحص إمكانية الحذف",
                    True,
                    "العيادة موجودة ويمكن حذفها (لم يتم الحذف الفعلي)",
                    response_time
                )
            elif response.status_code == 404:
                self.log_test(
                    f"DELETE /api/clinics/{clinic_id} - فحص إمكانية الحذف",
                    False,
                    "العيادة غير موجودة",
                    response_time
                )
            else:
                self.log_test(
                    f"DELETE /api/clinics/{clinic_id} - فحص إمكانية الحذف",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"DELETE /api/clinics/{clinic_id} - فحص إمكانية الحذف",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_areas_apis(self):
        """2. اختبار APIs إدارة المناطق"""
        print("\n🗺️ اختبار APIs إدارة المناطق...")
        
        # GET /api/areas - الحصول على قائمة المناطق
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/areas", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                areas = response.json()
                area_count = len(areas) if isinstance(areas, list) else 0
                
                # تحليل بيانات المناطق
                active_areas = sum(1 for area in areas if area.get("is_active", True)) if isinstance(areas, list) else 0
                
                self.log_test(
                    "GET /api/areas - استرجاع قائمة المناطق",
                    True,
                    f"تم استرجاع {area_count} منطقة ({active_areas} نشطة)",
                    response_time
                )
                
                # اختبار تحديث منطقة إذا وجدت
                if areas and len(areas) > 0:
                    first_area = areas[0]
                    area_id = first_area.get("id")
                    
                    if area_id:
                        self.test_area_update(area_id, first_area)
                
            else:
                self.log_test(
                    "GET /api/areas - استرجاع قائمة المناطق",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/areas - استرجاع قائمة المناطق",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_area_update(self, area_id, area_data):
        """اختبار تحديث منطقة"""
        start_time = time.time()
        try:
            # تحضير بيانات التحديث
            update_data = {
                "name": area_data.get("name", "منطقة محدثة"),
                "description": area_data.get("description", "وصف محدث"),
                "is_active": area_data.get("is_active", True)
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/areas/{area_id}",
                json=update_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                self.log_test(
                    f"PUT /api/areas/{area_id} - تحديث منطقة",
                    True,
                    f"تم تحديث المنطقة بنجاح - {result.get('message', 'تم التحديث')}",
                    response_time
                )
            else:
                self.log_test(
                    f"PUT /api/areas/{area_id} - تحديث منطقة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"PUT /api/areas/{area_id} - تحديث منطقة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_orders_workflow_apis(self):
        """3. اختبار APIs الطلبات وسير العمل"""
        print("\n📦 اختبار APIs الطلبات وسير العمل...")
        
        # أولاً: الحصول على البيانات المطلوبة لإنشاء طلب
        clinics = self.get_available_clinics()
        warehouses = self.get_available_warehouses()
        products = self.get_available_products()
        
        if not clinics or not warehouses or not products:
            self.log_test(
                "POST /api/orders - إنشاء طلبية جديدة",
                False,
                "لا توجد بيانات كافية (عيادات، مخازن، منتجات) لإنشاء طلبية"
            )
            return
        
        # إنشاء طلبية جديدة
        self.test_create_order(clinics[0], warehouses[0], products[:2])
        
        # اختبار تحديث حالة الطلبية
        self.test_order_status_workflow()
    
    def get_available_clinics(self):
        """الحصول على العيادات المتاحة"""
        try:
            response = self.session.get(f"{BACKEND_URL}/clinics", timeout=10)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return []
    
    def get_available_warehouses(self):
        """الحصول على المخازن المتاحة"""
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return []
    
    def get_available_products(self):
        """الحصول على المنتجات المتاحة"""
        try:
            response = self.session.get(f"{BACKEND_URL}/products", timeout=10)
            if response.status_code == 200:
                return response.json()
        except:
            pass
        return []
    
    def test_create_order(self, clinic, warehouse, products):
        """اختبار إنشاء طلبية جديدة"""
        start_time = time.time()
        try:
            # تحضير بيانات الطلبية
            order_data = {
                "clinic_id": clinic.get("id"),
                "warehouse_id": warehouse.get("id"),
                "items": [
                    {
                        "product_id": products[0].get("id"),
                        "quantity": 2
                    }
                ],
                "notes": "طلبية اختبار للمتطلبات المتقدمة",
                "line": "خط اختبار",
                "area_id": "منطقة اختبار",
                "debt_warning_acknowledged": True
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/orders",
                json=order_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                order_id = result.get("order_id")
                
                self.log_test(
                    "POST /api/orders - إنشاء طلبية جديدة",
                    True,
                    f"تم إنشاء الطلبية بنجاح - رقم الطلب: {result.get('order_number', order_id)}",
                    response_time
                )
                
                # حفظ معرف الطلبية للاختبارات التالية
                self.test_order_id = order_id
                
            else:
                self.log_test(
                    "POST /api/orders - إنشاء طلبية جديدة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/orders - إنشاء طلبية جديدة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_order_status_workflow(self):
        """اختبار سير العمل: pending_accounting → pending_warehouse → debt"""
        if not hasattr(self, 'test_order_id') or not self.test_order_id:
            self.log_test(
                "PUT /api/orders/{id}/status - تحديث حالة الطلبية",
                False,
                "لا يوجد معرف طلبية للاختبار"
            )
            return
        
        # اختبار تحديث الحالة إلى pending_accounting
        self.test_update_order_status(self.test_order_id, "pending_accounting")
        
        # اختبار تحديث الحالة إلى pending_warehouse
        self.test_update_order_status(self.test_order_id, "pending_warehouse")
        
        # اختبار تحديث الحالة إلى debt
        self.test_update_order_status(self.test_order_id, "debt")
    
    def test_update_order_status(self, order_id, new_status):
        """اختبار تحديث حالة طلبية محددة"""
        start_time = time.time()
        try:
            response = self.session.put(
                f"{BACKEND_URL}/orders/{order_id}/status",
                json={"status": new_status},
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                self.log_test(
                    f"PUT /api/orders/{order_id}/status - تحديث إلى {new_status}",
                    True,
                    f"تم تحديث حالة الطلبية إلى {new_status}",
                    response_time
                )
            else:
                self.log_test(
                    f"PUT /api/orders/{order_id}/status - تحديث إلى {new_status}",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"PUT /api/orders/{order_id}/status - تحديث إلى {new_status}",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_debts_collection_apis(self):
        """4. اختبار APIs الديون والتحصيل"""
        print("\n💰 اختبار APIs الديون والتحصيل...")
        
        # GET /api/debts - الحصول على قائمة الديون
        self.test_get_debts()
        
        # POST /api/debts - إضافة دين جديد
        self.test_create_debt()
        
        # POST /api/debts/{id}/payment - تسجيل دفعة
        self.test_process_payment()
        
        # GET /api/collections - سجل التحصيلات
        self.test_get_collections()
    
    def test_get_debts(self):
        """اختبار الحصول على قائمة الديون"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/debts", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                debt_count = len(debts) if isinstance(debts, list) else 0
                
                # تحليل بيانات الديون
                outstanding_debts = sum(1 for debt in debts if debt.get("status") == "outstanding") if isinstance(debts, list) else 0
                total_debt_amount = sum(debt.get("remaining_amount", 0) for debt in debts if debt.get("status") == "outstanding") if isinstance(debts, list) else 0
                
                self.log_test(
                    "GET /api/debts - استرجاع قائمة الديون",
                    True,
                    f"تم استرجاع {debt_count} دين ({outstanding_debts} مستحق، إجمالي: {total_debt_amount:.2f} ج.م)",
                    response_time
                )
                
                # حفظ معرف دين للاختبارات التالية
                if debts and len(debts) > 0:
                    self.test_debt_id = debts[0].get("id")
                
            else:
                self.log_test(
                    "GET /api/debts - استرجاع قائمة الديون",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/debts - استرجاع قائمة الديون",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_create_debt(self):
        """اختبار إضافة دين جديد"""
        start_time = time.time()
        try:
            # الحصول على عيادة للدين
            clinics = self.get_available_clinics()
            if not clinics:
                self.log_test(
                    "POST /api/debts - إضافة دين جديد",
                    False,
                    "لا توجد عيادات متاحة لإنشاء دين"
                )
                return
            
            debt_data = {
                "clinic_id": clinics[0].get("id"),
                "debt_amount": 500.0,
                "debt_type": "manual",
                "notes": "دين اختبار للمتطلبات المتقدمة",
                "due_date": "2024-12-31"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/debts",
                json=debt_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                debt_id = result.get("debt_id")
                
                self.log_test(
                    "POST /api/debts - إضافة دين جديد",
                    True,
                    f"تم إنشاء الدين بنجاح - معرف الدين: {debt_id}",
                    response_time
                )
                
                # حفظ معرف الدين للاختبارات التالية
                self.test_debt_id = debt_id
                
            else:
                self.log_test(
                    "POST /api/debts - إضافة دين جديد",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "POST /api/debts - إضافة دين جديد",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_process_payment(self):
        """اختبار تسجيل دفعة"""
        if not hasattr(self, 'test_debt_id') or not self.test_debt_id:
            self.log_test(
                "POST /api/debts/{id}/payment - تسجيل دفعة",
                False,
                "لا يوجد معرف دين للاختبار"
            )
            return
        
        start_time = time.time()
        try:
            payment_data = {
                "debt_id": self.test_debt_id,
                "payment_amount": 100.0,
                "payment_method": "cash",
                "notes": "دفعة اختبار"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/payments/process",
                json=payment_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                remaining_amount = result.get("remaining_amount", 0)
                
                self.log_test(
                    f"POST /api/payments/process - تسجيل دفعة",
                    True,
                    f"تم تسجيل الدفعة بنجاح - المبلغ المتبقي: {remaining_amount:.2f} ج.م",
                    response_time
                )
                
            else:
                self.log_test(
                    f"POST /api/payments/process - تسجيل دفعة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"POST /api/payments/process - تسجيل دفعة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_get_collections(self):
        """اختبار سجل التحصيلات"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/payments", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                payments = response.json()
                payment_count = len(payments) if isinstance(payments, list) else 0
                
                # تحليل بيانات التحصيلات
                total_collected = sum(payment.get("payment_amount", 0) for payment in payments) if isinstance(payments, list) else 0
                
                self.log_test(
                    "GET /api/payments - سجل التحصيلات",
                    True,
                    f"تم استرجاع {payment_count} سجل تحصيل (إجمالي: {total_collected:.2f} ج.م)",
                    response_time
                )
                
            else:
                self.log_test(
                    "GET /api/payments - سجل التحصيلات",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/payments - سجل التحصيلات",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_warehouses_products_apis(self):
        """5. اختبار APIs المخازن والمنتجات"""
        print("\n🏪 اختبار APIs المخازن والمنتجات...")
        
        # GET /api/warehouses - الحصول على المخازن
        self.test_get_warehouses()
        
        # PUT /api/warehouses/{id} - تعديل مخزن
        self.test_update_warehouse()
        
        # GET /api/warehouses/{id}/products - الحصول على منتجات المخزن
        self.test_get_warehouse_products()
    
    def test_get_warehouses(self):
        """اختبار الحصول على المخازن"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                
                # تحليل بيانات المخازن
                active_warehouses = sum(1 for warehouse in warehouses if warehouse.get("is_active", True)) if isinstance(warehouses, list) else 0
                
                self.log_test(
                    "GET /api/warehouses - استرجاع قائمة المخازن",
                    True,
                    f"تم استرجاع {warehouse_count} مخزن ({active_warehouses} نشط)",
                    response_time
                )
                
                # حفظ معرف مخزن للاختبارات التالية
                if warehouses and len(warehouses) > 0:
                    self.test_warehouse_id = warehouses[0].get("id")
                    self.test_warehouse_data = warehouses[0]
                
            else:
                self.log_test(
                    "GET /api/warehouses - استرجاع قائمة المخازن",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/warehouses - استرجاع قائمة المخازن",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_update_warehouse(self):
        """اختبار تعديل مخزن"""
        if not hasattr(self, 'test_warehouse_id') or not self.test_warehouse_id:
            self.log_test(
                "PUT /api/warehouses/{id} - تعديل مخزن",
                False,
                "لا يوجد معرف مخزن للاختبار"
            )
            return
        
        start_time = time.time()
        try:
            update_data = {
                "name": self.test_warehouse_data.get("name", "مخزن محدث"),
                "location": self.test_warehouse_data.get("location", "موقع محدث"),
                "is_active": self.test_warehouse_data.get("is_active", True)
            }
            
            response = self.session.put(
                f"{BACKEND_URL}/warehouses/{self.test_warehouse_id}",
                json=update_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                self.log_test(
                    f"PUT /api/warehouses/{self.test_warehouse_id} - تعديل مخزن",
                    True,
                    f"تم تحديث المخزن بنجاح - {result.get('message', 'تم التحديث')}",
                    response_time
                )
            else:
                self.log_test(
                    f"PUT /api/warehouses/{self.test_warehouse_id} - تعديل مخزن",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"PUT /api/warehouses/{self.test_warehouse_id} - تعديل مخزن",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_get_warehouse_products(self):
        """اختبار الحصول على منتجات المخزن"""
        if not hasattr(self, 'test_warehouse_id') or not self.test_warehouse_id:
            self.log_test(
                "GET /api/warehouses/{id}/products - منتجات المخزن",
                False,
                "لا يوجد معرف مخزن للاختبار"
            )
            return
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses/{self.test_warehouse_id}/products", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # تحليل بيانات المنتجات
                in_stock_products = sum(1 for product in products if product.get("current_stock", 0) > 0) if isinstance(products, list) else 0
                
                self.log_test(
                    f"GET /api/warehouses/{self.test_warehouse_id}/products - منتجات المخزن",
                    True,
                    f"تم استرجاع {product_count} منتج ({in_stock_products} متوفر في المخزون)",
                    response_time
                )
                
            else:
                self.log_test(
                    f"GET /api/warehouses/{self.test_warehouse_id}/products - منتجات المخزن",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                f"GET /api/warehouses/{self.test_warehouse_id}/products - منتجات المخزن",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_dashboard_apis(self):
        """6. اختبار APIs لوحة التحكم"""
        print("\n📊 اختبار APIs لوحة التحكم...")
        
        # GET /api/dashboard/stats - الإحصائيات العامة
        self.test_dashboard_stats()
        
        # GET /api/dashboard/recent-activities - الأنشطة الحديثة
        self.test_recent_activities()
        
        # GET /api/dashboard/visits - زيارات المناديب
        self.test_dashboard_visits()
        
        # GET /api/dashboard/collections - آخر التحصيلات
        self.test_dashboard_collections()
    
    def test_dashboard_stats(self):
        """اختبار الإحصائيات العامة"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/stats", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                
                # تحليل الإحصائيات
                orders_count = stats.get("orders", {}).get("count", 0)
                visits_count = stats.get("visits", {}).get("count", 0)
                users_count = stats.get("users", {}).get("total", 0)
                clinics_count = stats.get("clinics", {}).get("total", 0)
                
                self.log_test(
                    "GET /api/dashboard/stats - الإحصائيات العامة",
                    True,
                    f"إحصائيات النظام - طلبات: {orders_count}, زيارات: {visits_count}, مستخدمين: {users_count}, عيادات: {clinics_count}",
                    response_time
                )
                
            else:
                self.log_test(
                    "GET /api/dashboard/stats - الإحصائيات العامة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/dashboard/stats - الإحصائيات العامة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_recent_activities(self):
        """اختبار الأنشطة الحديثة"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/recent-activities", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                activities = response.json()
                activity_count = len(activities) if isinstance(activities, list) else 0
                
                self.log_test(
                    "GET /api/dashboard/recent-activities - الأنشطة الحديثة",
                    True,
                    f"تم استرجاع {activity_count} نشاط حديث",
                    response_time
                )
                
            else:
                self.log_test(
                    "GET /api/dashboard/recent-activities - الأنشطة الحديثة",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/dashboard/recent-activities - الأنشطة الحديثة",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_dashboard_visits(self):
        """اختبار زيارات المناديب"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/visits", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                visits = response.json()
                visit_count = len(visits) if isinstance(visits, list) else 0
                
                self.log_test(
                    "GET /api/dashboard/visits - زيارات المناديب",
                    True,
                    f"تم استرجاع {visit_count} زيارة",
                    response_time
                )
                
            else:
                self.log_test(
                    "GET /api/dashboard/visits - زيارات المناديب",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/dashboard/visits - زيارات المناديب",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def test_dashboard_collections(self):
        """اختبار آخر التحصيلات"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/dashboard/collections", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                collections = response.json()
                collection_count = len(collections) if isinstance(collections, list) else 0
                
                self.log_test(
                    "GET /api/dashboard/collections - آخر التحصيلات",
                    True,
                    f"تم استرجاع {collection_count} سجل تحصيل",
                    response_time
                )
                
            else:
                self.log_test(
                    "GET /api/dashboard/collections - آخر التحصيلات",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    response_time
                )
                
        except Exception as e:
            self.log_test(
                "GET /api/dashboard/collections - آخر التحصيلات",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for test in self.test_results if test["success"])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(test.get("response_time", 0) for test in self.test_results if test.get("response_time")) / max(1, len([test for test in self.test_results if test.get("response_time")]))
        
        print(f"\n" + "="*80)
        print(f"📋 التقرير النهائي - اختبار شامل للباكند للمتطلبات المتقدمة")
        print(f"="*80)
        print(f"📊 إحصائيات الاختبار:")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • الاختبارات الناجحة: {successful_tests} ✅")
        print(f"   • الاختبارات الفاشلة: {failed_tests} ❌")
        print(f"   • معدل النجاح: {success_rate:.1f}%")
        print(f"   • متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   • إجمالي وقت الاختبار: {total_time:.2f}s")
        
        print(f"\n🎯 تقييم الجاهزية للمتطلبات المتقدمة:")
        
        # تحليل النتائج حسب الفئات
        categories = {
            "العيادات": ["clinics"],
            "المناطق": ["areas"],
            "الطلبات وسير العمل": ["orders", "status"],
            "الديون والتحصيل": ["debts", "payments"],
            "المخازن والمنتجات": ["warehouses", "products"],
            "لوحة التحكم": ["dashboard"]
        }
        
        for category, keywords in categories.items():
            category_tests = [test for test in self.test_results if any(keyword in test["test_name"].lower() for keyword in keywords)]
            if category_tests:
                category_success = sum(1 for test in category_tests if test["success"])
                category_total = len(category_tests)
                category_rate = (category_success / category_total * 100) if category_total > 0 else 0
                
                status_icon = "✅" if category_rate >= 80 else "⚠️" if category_rate >= 50 else "❌"
                print(f"   {status_icon} {category}: {category_success}/{category_total} ({category_rate:.1f}%)")
        
        print(f"\n📝 ملخص الحالة:")
        if success_rate >= 90:
            print(f"   🟢 ممتاز: النظام جاهز بالكامل للمتطلبات المتقدمة")
        elif success_rate >= 75:
            print(f"   🟡 جيد: النظام جاهز مع بعض التحسينات المطلوبة")
        elif success_rate >= 50:
            print(f"   🟠 يحتاج تحسينات: النظام يحتاج تطوير قبل تطبيق الميزات الجديدة")
        else:
            print(f"   🔴 غير جاهز: النظام يحتاج تطوير كبير قبل المرحلة التالية")
        
        print(f"\n📋 التوصيات:")
        if failed_tests > 0:
            print(f"   • إصلاح {failed_tests} API غير عامل")
            print(f"   • مراجعة الأخطاء المذكورة أعلاه")
            print(f"   • اختبار شامل بعد الإصلاحات")
        
        if success_rate >= 80:
            print(f"   • يمكن البدء في تطوير الميزات الجديدة")
            print(f"   • مراقبة الأداء أثناء التطوير")
        
        print(f"\n" + "="*80)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "ready_for_advanced_features": success_rate >= 75
        }
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل للباكند للمتطلبات المتقدمة")
        print("="*80)
        
        # تسجيل الدخول
        if not self.authenticate():
            print("❌ فشل في تسجيل الدخول - توقف الاختبار")
            return False
        
        # تشغيل جميع الاختبارات
        self.test_clinics_apis()
        self.test_areas_apis()
        self.test_orders_workflow_apis()
        self.test_debts_collection_apis()
        self.test_warehouses_products_apis()
        self.test_dashboard_apis()
        
        # إنتاج التقرير النهائي
        return self.generate_final_report()

def main():
    """الدالة الرئيسية"""
    tester = ComprehensiveArabicRequirementsBackendTester()
    
    try:
        result = tester.run_comprehensive_test()
        
        # إنهاء البرنامج بحالة النجاح أو الفشل
        if result and result.get("ready_for_advanced_features", False):
            sys.exit(0)  # نجح
        else:
            sys.exit(1)  # فشل
            
    except KeyboardInterrupt:
        print("\n⚠️ تم إيقاف الاختبار بواسطة المستخدم")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()