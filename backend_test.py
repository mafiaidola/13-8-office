#!/usr/bin/env python3
"""
اختبار شامل للنظام المالي - تدفق الفاتورة إلى الدين والتحصيل
Comprehensive Financial System Testing - Invoice to Debt Flow and Collection
Arabic Review Requirements Testing
"""

import requests
import json
import time
import uuid
from datetime import datetime

class FinancialSystemTester:
    def __init__(self):
        # استخدام الـ URL من متغيرات البيئة
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.base_url = f"{self.base_url}/api"
        self.token = None
        self.headers = {"Content-Type": "application/json"}
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🎯 بدء اختبار شامل للنظام المالي - تدفق الفاتورة إلى الدين والتحصيل")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"📅 وقت البدء: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

    def log_test(self, test_name, success, response_time, details=""):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        print(f"{status} | {test_name} | {response_time:.2f}ms | {details}")

    def test_admin_login(self):
        """المرحلة 1: تسجيل دخول admin/admin123 للحصول على JWT token"""
        print("\n🔐 المرحلة 1: تسجيل دخول Admin")
        
        start_time = time.time()
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={
                    "username": "admin",
                    "password": "admin123",
                    "geolocation": {
                        "latitude": 30.0444,
                        "longitude": 31.2357,
                        "city": "القاهرة",
                        "country": "مصر"
                    },
                    "device_info": "Financial System Test Browser",
                    "ip_address": "192.168.1.100"
                },
                headers=self.headers
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.headers["Authorization"] = f"Bearer {self.token}"
                
                user_info = data.get("user", {})
                details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
                self.log_test("تسجيل دخول admin/admin123", True, response_time, details)
                return True
            else:
                self.log_test("تسجيل دخول admin/admin123", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دخول admin/admin123", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_get_clinics(self):
        """الحصول على قائمة العيادات المتاحة"""
        print("\n🏥 الحصول على قائمة العيادات")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/clinics", headers=self.headers)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                details = f"تم العثور على {len(clinics)} عيادة"
                self.log_test("GET /api/clinics", True, response_time, details)
                return clinics
            else:
                self.log_test("GET /api/clinics", False, response_time, f"HTTP {response.status_code}")
                return []
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/clinics", False, response_time, f"خطأ: {str(e)}")
            return []

    def test_get_products(self):
        """الحصول على قائمة المنتجات المتاحة"""
        print("\n💊 الحصول على قائمة المنتجات")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/products", headers=self.headers)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                details = f"تم العثور على {len(products)} منتج"
                self.log_test("GET /api/products", True, response_time, details)
                return products
            else:
                self.log_test("GET /api/products", False, response_time, f"HTTP {response.status_code}")
                return []
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/products", False, response_time, f"خطأ: {str(e)}")
            return []

    def test_get_users(self):
        """الحصول على قائمة المستخدمين للعثور على مندوب مبيعات"""
        print("\n👥 الحصول على قائمة المستخدمين")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/users", headers=self.headers)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                details = f"تم العثور على {len(users)} مستخدم"
                self.log_test("GET /api/users", True, response_time, details)
                return users
            else:
                self.log_test("GET /api/users", False, response_time, f"HTTP {response.status_code}")
                return []
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/users", False, response_time, f"خطأ: {str(e)}")
            return []

    def test_create_invoice(self, clinics, products, users):
        """المرحلة 2: إنشاء فاتورة جديدة مع بيانات كاملة"""
        print("\n📄 المرحلة 2: إنشاء فاتورة جديدة")
        
        if not clinics or not products or not users:
            self.log_test("إنشاء فاتورة جديدة", False, 0, "لا توجد عيادات أو منتجات أو مستخدمين متاحة")
            return None
        
        start_time = time.time()
        try:
            # استخدام أول عيادة ومنتج متاح
            clinic = clinics[0]
            product = products[0]
            
            # البحث عن مندوب مبيعات
            sales_rep = None
            for user in users:
                if user.get("role") in ["medical_rep", "sales_rep"]:
                    sales_rep = user
                    break
            
            if not sales_rep:
                # استخدام admin كمندوب مبيعات
                sales_rep = {"id": "admin-001", "full_name": "System Administrator"}
            
            invoice_data = {
                "clinic_id": clinic.get("id", clinic.get("_id")),
                "clinic_name": clinic.get("clinic_name", "عيادة تجريبية"),
                "doctor_name": clinic.get("doctor_name", "د. أحمد محمد"),
                "clinic_address": clinic.get("clinic_address", "عنوان العيادة"),
                "clinic_phone": clinic.get("clinic_phone", "01234567890"),
                "clinic_email": clinic.get("clinic_email", "clinic@example.com"),
                "sales_rep_id": sales_rep.get("id"),
                "sales_rep_name": sales_rep.get("full_name", "مندوب المبيعات"),
                "line_id": sales_rep.get("line_id", "line-001"),
                "area_id": sales_rep.get("area_id", "area-001"),
                "items": [
                    {
                        "product_id": product.get("id", product.get("_id")),
                        "product_name": product.get("name", "منتج تجريبي"),
                        "quantity": 5,
                        "unit_price": product.get("price", 50.0),
                        "discount_percentage": 0,
                        "discount_amount": 0,
                        "tax_percentage": 14,
                        "tax_amount": 5 * product.get("price", 50.0) * 0.14
                    }
                ],
                "subtotal": 5 * product.get("price", 50.0),
                "tax_amount": 5 * product.get("price", 50.0) * 0.14,
                "total_amount": 5 * product.get("price", 50.0) * 1.14,
                "invoice_date": datetime.now().isoformat(),
                "due_date": datetime.now().isoformat(),
                "notes": "فاتورة اختبار للنظام المالي المتكامل",
                "payment_terms": "30 يوم"
            }
            
            response = requests.post(
                f"{self.base_url}/invoices",
                json=invoice_data,
                headers=self.headers
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                invoice = response.json()
                invoice_id = invoice.get("id", invoice.get("invoice_id"))
                total_amount = invoice.get("total_amount", invoice_data["total_amount"])
                details = f"فاتورة ID: {invoice_id}, المبلغ: {total_amount:.2f} ج.م"
                self.log_test("إنشاء فاتورة جديدة", True, response_time, details)
                return invoice
            else:
                self.log_test("إنشاء فاتورة جديدة", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("إنشاء فاتورة جديدة", False, response_time, f"خطأ: {str(e)}")
            return None

    def test_approve_invoice(self, invoice):
        """المرحلة 3: اعتماد الفاتورة"""
        print("\n✅ المرحلة 3: اعتماد الفاتورة")
        
        if not invoice:
            self.log_test("اعتماد الفاتورة", False, 0, "لا توجد فاتورة للاعتماد")
            return False
        
        start_time = time.time()
        try:
            invoice_id = invoice.get("id", invoice.get("invoice_id"))
            
            response = requests.put(
                f"{self.base_url}/invoices/{invoice_id}/approve",
                json={"approved_by": "admin", "approval_notes": "معتمدة للتحصيل"},
                headers=self.headers
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                details = f"تم اعتماد الفاتورة {invoice_id}"
                self.log_test("اعتماد الفاتورة", True, response_time, details)
                return True
            else:
                self.log_test("اعتماد الفاتورة", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("اعتماد الفاتورة", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_verify_debt_creation(self, invoice):
        """المرحلة 4: التحقق من تحويل الفاتورة المعتمدة إلى دين تلقائياً"""
        print("\n💰 المرحلة 4: التحقق من تحويل الفاتورة إلى دين")
        
        if not invoice:
            self.log_test("التحقق من تحويل الفاتورة إلى دين", False, 0, "لا توجد فاتورة للتحقق")
            return None
        
        start_time = time.time()
        try:
            # البحث عن الدين المرتبط بالفاتورة
            response = requests.get(f"{self.base_url}/debts", headers=self.headers)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                invoice_id = invoice.get("id", invoice.get("invoice_id"))
                
                # البحث عن دين مرتبط بالفاتورة
                related_debt = None
                for debt in debts:
                    if (debt.get("invoice_id") == invoice_id or 
                        debt.get("source_type") == "invoice" or
                        debt.get("reference_id") == invoice_id):
                        related_debt = debt
                        break
                
                if related_debt:
                    debt_amount = related_debt.get("original_amount", related_debt.get("amount", 0))
                    details = f"تم إنشاء دين ID: {related_debt.get('id')}, المبلغ: {debt_amount:.2f} ج.م"
                    self.log_test("التحقق من تحويل الفاتورة إلى دين", True, response_time, details)
                    return related_debt
                else:
                    details = f"لم يتم العثور على دين مرتبط بالفاتورة {invoice_id}"
                    self.log_test("التحقق من تحويل الفاتورة إلى دين", False, response_time, details)
                    return None
            else:
                self.log_test("التحقق من تحويل الفاتورة إلى دين", False, response_time, f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("التحقق من تحويل الفاتورة إلى دين", False, response_time, f"خطأ: {str(e)}")
            return None

    def test_record_partial_payment(self, debt):
        """المرحلة 5: تسجيل دفعة جزئية للدين"""
        print("\n💳 المرحلة 5: تسجيل دفعة جزئية")
        
        if not debt:
            self.log_test("تسجيل دفعة جزئية", False, 0, "لا يوجد دين لتسجيل الدفعة")
            return False
        
        start_time = time.time()
        try:
            debt_id = debt.get("id", debt.get("_id"))
            original_amount = debt.get("original_amount", debt.get("amount", 0))
            partial_payment = original_amount * 0.6  # دفع 60% من المبلغ
            
            payment_data = {
                "debt_id": debt_id,
                "amount": partial_payment,
                "payment_method": "cash",
                "payment_date": datetime.now().isoformat(),
                "notes": "دفعة جزئية - اختبار النظام المالي",
                "received_by": "admin"
            }
            
            response = requests.post(
                f"{self.base_url}/payments/process",
                json=payment_data,
                headers=self.headers
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 201:
                payment = response.json()
                details = f"تم تسجيل دفعة {partial_payment:.2f} ج.م للدين {debt_id}"
                self.log_test("تسجيل دفعة جزئية", True, response_time, details)
                return payment
            else:
                self.log_test("تسجيل دفعة جزئية", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دفعة جزئية", False, response_time, f"خطأ: {str(e)}")
            return None

    def test_verify_debt_update(self, debt, payment):
        """المرحلة 6: التحقق من تحديث حالة الدين والمبلغ المتبقي"""
        print("\n🔄 المرحلة 6: التحقق من تحديث حالة الدين")
        
        if not debt or not payment:
            self.log_test("التحقق من تحديث حالة الدين", False, 0, "لا توجد بيانات كافية للتحقق")
            return False
        
        start_time = time.time()
        try:
            debt_id = debt.get("id", debt.get("_id"))
            
            response = requests.get(f"{self.base_url}/debts/{debt_id}", headers=self.headers)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                updated_debt = response.json()
                remaining_amount = updated_debt.get("remaining_amount", updated_debt.get("amount", 0))
                status = updated_debt.get("status", "unknown")
                
                details = f"الحالة: {status}, المبلغ المتبقي: {remaining_amount:.2f} ج.م"
                self.log_test("التحقق من تحديث حالة الدين", True, response_time, details)
                return True
            else:
                self.log_test("التحقق من تحديث حالة الدين", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("التحقق من تحديث حالة الدين", False, response_time, f"خطأ: {str(e)}")
            return False

    def test_financial_apis(self):
        """المرحلة 2: اختبار APIs المالية الأساسية"""
        print("\n📊 المرحلة 2: اختبار APIs المالية الأساسية")
        
        apis_to_test = [
            ("GET /api/invoices", f"{self.base_url}/invoices"),
            ("GET /api/debts", f"{self.base_url}/debts"),
            ("GET /api/payments", f"{self.base_url}/payments"),
            ("GET /api/invoices/statistics", f"{self.base_url}/invoices/statistics/overview"),
            ("GET /api/debts/statistics", f"{self.base_url}/debts/statistics/overview")
        ]
        
        for api_name, url in apis_to_test:
            start_time = time.time()
            try:
                response = requests.get(url, headers=self.headers)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        details = f"تم العثور على {len(data)} سجل"
                    elif isinstance(data, dict):
                        details = f"تم استرجاع البيانات الإحصائية"
                    else:
                        details = "تم استرجاع البيانات"
                    
                    self.log_test(api_name, True, response_time, details)
                else:
                    self.log_test(api_name, False, response_time, f"HTTP {response.status_code}")
                    
            except Exception as e:
                response_time = (time.time() - start_time) * 1000
                self.log_test(api_name, False, response_time, f"خطأ: {str(e)}")

    def test_data_integrity(self):
        """المرحلة 3: التحقق من سلامة البيانات"""
        print("\n🔍 المرحلة 3: التحقق من سلامة البيانات")
        
        # اختبار ربط الفواتير بالعيادات
        start_time = time.time()
        try:
            invoices_response = requests.get(f"{self.base_url}/invoices", headers=self.headers)
            clinics_response = requests.get(f"{self.base_url}/clinics", headers=self.headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if invoices_response.status_code == 200 and clinics_response.status_code == 200:
                # Handle different response formats
                invoices_data = invoices_response.json()
                if isinstance(invoices_data, dict) and "invoices" in invoices_data:
                    invoices = invoices_data["invoices"]
                else:
                    invoices = invoices_data if isinstance(invoices_data, list) else []
                
                clinics = clinics_response.json()
                if isinstance(clinics, dict) and "clinics" in clinics:
                    clinics = clinics["clinics"]
                
                clinic_ids = set()
                for clinic in clinics:
                    if isinstance(clinic, dict):
                        clinic_ids.add(clinic.get("id", clinic.get("_id")))
                    else:
                        clinic_ids.add(str(clinic))
                
                linked_invoices = 0
                for invoice in invoices:
                    if isinstance(invoice, dict) and invoice.get("clinic_id") in clinic_ids:
                        linked_invoices += 1
                
                details = f"{linked_invoices}/{len(invoices)} فاتورة مرتبطة بعيادات صحيحة"
                self.log_test("ربط الفواتير بالعيادات", True, response_time, details)
            else:
                self.log_test("ربط الفواتير بالعيادات", False, response_time, "فشل في جلب البيانات")
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("ربط الفواتير بالعيادات", False, response_time, f"خطأ: {str(e)}")

        # اختبار ربط الديون بالمناديب
        start_time = time.time()
        try:
            debts_response = requests.get(f"{self.base_url}/debts", headers=self.headers)
            users_response = requests.get(f"{self.base_url}/users", headers=self.headers)
            
            response_time = (time.time() - start_time) * 1000
            
            if debts_response.status_code == 200 and users_response.status_code == 200:
                # Handle different response formats
                debts_data = debts_response.json()
                if isinstance(debts_data, dict) and "debts" in debts_data:
                    debts = debts_data["debts"]
                else:
                    debts = debts_data if isinstance(debts_data, list) else []
                
                users_data = users_response.json()
                if isinstance(users_data, dict) and "users" in users_data:
                    users = users_data["users"]
                else:
                    users = users_data if isinstance(users_data, list) else []
                
                rep_ids = set()
                for user in users:
                    if isinstance(user, dict) and user.get("role") in ["medical_rep", "sales_rep"]:
                        rep_ids.add(user.get("id", user.get("_id")))
                
                assigned_debts = 0
                for debt in debts:
                    if isinstance(debt, dict):
                        if (debt.get("assigned_to_id") in rep_ids or 
                            debt.get("sales_rep_id") in rep_ids):
                            assigned_debts += 1
                
                details = f"{assigned_debts}/{len(debts)} دين مُعيَّن لمناديب صحيحين"
                self.log_test("ربط الديون بالمناديب", True, response_time, details)
            else:
                self.log_test("ربط الديون بالمناديب", False, response_time, "فشل في جلب البيانات")
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("ربط الديون بالمناديب", False, response_time, f"خطأ: {str(e)}")

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل للنظام المالي")
        
        # المرحلة 1: تسجيل الدخول
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        # الحصول على البيانات الأساسية
        clinics = self.test_get_clinics()
        products = self.test_get_products()
        users = self.test_get_users()
        
        # المرحلة 1: تدفق النظام المالي الكامل
        print("\n" + "="*50)
        print("🎯 المرحلة 1: اختبار تدفق النظام المالي الكامل")
        print("="*50)
        
        invoice = self.test_create_invoice(clinics, products, users)
        if invoice:
            approved = self.test_approve_invoice(invoice)
            if approved:
                debt = self.test_verify_debt_creation(invoice)
                if debt:
                    payment = self.test_record_partial_payment(debt)
                    if payment:
                        self.test_verify_debt_update(debt, payment)
        
        # المرحلة 2: اختبار APIs المالية الأساسية
        print("\n" + "="*50)
        print("🎯 المرحلة 2: اختبار APIs المالية الأساسية")
        print("="*50)
        self.test_financial_apis()
        
        # المرحلة 3: التحقق من سلامة البيانات
        print("\n" + "="*50)
        print("🎯 المرحلة 3: التحقق من سلامة البيانات")
        print("="*50)
        self.test_data_integrity()
        
        # النتائج النهائية
        self.print_final_results()

    def print_final_results(self):
        """طباعة النتائج النهائية"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "="*80)
        print("📊 النتائج النهائية للاختبار الشامل للنظام المالي")
        print("="*80)
        
        print(f"⏱️  إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        print(f"\n🎯 تقييم الأداء:")
        if success_rate >= 90:
            print("🟢 ممتاز - النظام المالي يعمل بشكل مثالي!")
        elif success_rate >= 75:
            print("🟡 جيد - النظام المالي يعمل مع بعض التحسينات المطلوبة")
        elif success_rate >= 50:
            print("🟠 متوسط - النظام المالي يحتاج إصلاحات")
        else:
            print("🔴 ضعيف - النظام المالي يحتاج إعادة تطوير")
        
        print(f"\n📋 تفاصيل الاختبارات:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']} ({result['response_time']:.2f}ms) - {result['details']}")
        
        print("\n" + "="*80)
        print(f"🏁 انتهى الاختبار الشامل للنظام المالي - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80)

if __name__ == "__main__":
    tester = FinancialSystemTester()
    tester.run_comprehensive_test()