#!/usr/bin/env python3
"""
اختبار النظام المحاسبي الاحترافي الشامل بعد إصلاح مشاكل ObjectId
Enhanced Professional Accounting System Testing After ObjectId Fix - Arabic Review
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://epgroup-health.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class EnhancedProfessionalAccountingObjectIdFixTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.test_data_ids = []  # لتتبع البيانات التجريبية للتنظيف
        self.clinic_data = None
        self.representative_data = None
        self.product_data = None
        
    def log_test(self, test_name, success, response_time, details="", error_msg=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time": f"{response_time:.2f}ms",
            "details": details,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        if error_msg:
            print(f"   خطأ: {error_msg}")
        print(f"   وقت الاستجابة: {response_time:.2f}ms")
        print()

    def test_admin_login(self):
        """1. تسجيل الدخول admin/admin123"""
        print("🔐 اختبار تسجيل الدخول admin/admin123...")
        
        start_time = time.time()
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                user_info = data.get("user", {})
                details = f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}"
                self.log_test("تسجيل دخول admin/admin123", True, response_time, details)
                return True
            else:
                self.log_test("تسجيل دخول admin/admin123", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دخول admin/admin123", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_dashboard(self):
        """2. اختبار لوحة التحكم المحاسبية"""
        print("📊 اختبار لوحة التحكم المحاسبية...")
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/enhanced-professional-accounting/dashboard")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                sections_count = len(data) if isinstance(data, list) else len(data.keys()) if isinstance(data, dict) else 0
                details = f"لوحة التحكم تعمل بنجاح - {sections_count} قسم متاح"
                self.log_test("لوحة التحكم المحاسبية", True, response_time, details)
                return True
            else:
                self.log_test("لوحة التحكم المحاسبية", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("لوحة التحكم المحاسبية", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def gather_supporting_data(self):
        """3. جمع البيانات الداعمة (عيادة ومندوب ومنتج)"""
        print("📋 جمع البيانات الداعمة...")
        
        # جلب العيادات
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/clinics")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                if clinics and len(clinics) > 0:
                    self.clinic_data = clinics[0]  # أول عيادة متاحة
                    clinic_details = f"تم جلب {len(clinics)} عيادة - العيادة المختارة: {self.clinic_data.get('name', 'Unknown')}"
                    self.log_test("جلب بيانات العيادات", True, response_time, clinic_details)
                else:
                    self.log_test("جلب بيانات العيادات", False, response_time, 
                                error_msg="لا توجد عيادات متاحة")
                    return False
            else:
                self.log_test("جلب بيانات العيادات", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("جلب بيانات العيادات", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

        # جلب المناديب
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/users")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                # البحث عن مندوب طبي
                medical_reps = [user for user in users if user.get('role') == 'medical_rep']
                if medical_reps:
                    self.representative_data = medical_reps[0]
                    rep_details = f"تم جلب {len(medical_reps)} مندوب - المندوب المختار: {self.representative_data.get('full_name', 'Unknown')}"
                    self.log_test("جلب بيانات المناديب", True, response_time, rep_details)
                else:
                    # استخدام أي مستخدم متاح
                    if users:
                        self.representative_data = users[0]
                        rep_details = f"تم جلب {len(users)} مستخدم - المستخدم المختار: {self.representative_data.get('full_name', 'Unknown')}"
                        self.log_test("جلب بيانات المناديب", True, response_time, rep_details)
                    else:
                        self.log_test("جلب بيانات المناديب", False, response_time, 
                                    error_msg="لا توجد مناديب متاحة")
                        return False
            else:
                self.log_test("جلب بيانات المناديب", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("جلب بيانات المناديب", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

        # جلب المنتجات
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/products")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                products = response.json()
                if products and len(products) > 0:
                    self.product_data = products[0]  # أول منتج متاح
                    product_details = f"تم جلب {len(products)} منتج - المنتج المختار: {self.product_data.get('name', 'Unknown')}"
                    self.log_test("جلب بيانات المنتجات", True, response_time, product_details)
                    return True
                else:
                    self.log_test("جلب بيانات المنتجات", False, response_time, 
                                error_msg="لا توجد منتجات متاحة")
                    return False
            else:
                self.log_test("جلب بيانات المنتجات", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("جلب بيانات المنتجات", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_comprehensive_invoice_creation(self):
        """4. اختبار إنشاء فاتورة شاملة"""
        print("📄 اختبار إنشاء فاتورة شاملة...")
        
        if not all([self.clinic_data, self.representative_data, self.product_data]):
            self.log_test("إنشاء فاتورة شاملة", False, 0, 
                        error_msg="البيانات الداعمة غير متوفرة")
            return False

        # إعداد بيانات الفاتورة الشاملة
        unit_price = float(self.product_data.get("price", 50.0))
        quantity = 5
        item_total = quantity * unit_price
        subtotal = item_total
        tax_amount = subtotal * 0.14
        total_amount = subtotal + tax_amount
        
        invoice_data = {
            "clinic_id": self.clinic_data.get("id"),
            "clinic_name": self.clinic_data.get("name", self.clinic_data.get("clinic_name")),
            "rep_id": self.representative_data.get("id"),
            "rep_name": self.representative_data.get("full_name"),
            "invoice_date": datetime.now().isoformat(),
            "due_date": datetime.now().isoformat(),
            "items": [
                {
                    "product_id": self.product_data.get("id"),
                    "product_name": self.product_data.get("name"),
                    "quantity": quantity,
                    "unit_price": unit_price,
                    "total_price": item_total  # Changed from 'total' to 'total_price'
                }
            ],
            "subtotal": subtotal,
            "tax_rate": 0.14,
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "notes": "فاتورة اختبار شاملة للنظام المحاسبي الاحترافي",
            "payment_terms": "30 يوم",
            "status": "draft"
        }

        start_time = time.time()
        try:
            response = self.session.post(f"{BASE_URL}/enhanced-professional-accounting/invoices", 
                                       json=invoice_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                invoice_id = data.get("invoice_id") or data.get("id")
                if invoice_id:
                    self.test_data_ids.append(("invoice", invoice_id))
                    print(f"🔍 Debug: تم حفظ معرف الفاتورة: {invoice_id}")
                
                total_amount = invoice_data["total_amount"]
                details = f"تم إنشاء الفاتورة بنجاح - المبلغ الإجمالي: {total_amount:.2f} ج.م"
                if invoice_id:
                    details += f" - ID: {invoice_id}"
                
                self.log_test("إنشاء فاتورة شاملة", True, response_time, details)
                return True
            else:
                self.log_test("إنشاء فاتورة شاملة", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("إنشاء فاتورة شاملة", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_invoice_retrieval(self):
        """5. اختبار جلب الفواتير"""
        print("📋 اختبار جلب الفواتير...")
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BASE_URL}/enhanced-professional-accounting/invoices")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                invoices_count = len(data) if isinstance(data, list) else data.get("count", 0)
                details = f"تم جلب {invoices_count} فاتورة بنجاح"
                
                # البحث عن الفاتورة الجديدة
                if isinstance(data, list) and len(data) > 0:
                    latest_invoice = data[0]  # أحدث فاتورة
                    details += f" - أحدث فاتورة: {latest_invoice.get('clinic_name', 'Unknown')}"
                
                self.log_test("جلب الفواتير", True, response_time, details)
                return True
            else:
                self.log_test("جلب الفواتير", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("جلب الفواتير", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_debt_creation(self):
        """6. اختبار إنشاء دين"""
        print("💰 اختبار إنشاء دين...")
        
        if not all([self.clinic_data, self.representative_data]):
            self.log_test("إنشاء دين", False, 0, 
                        error_msg="البيانات الداعمة غير متوفرة")
            return False

        # إعداد بيانات الدين
        debt_data = {
            "clinic_id": self.clinic_data.get("id"),
            "clinic_name": self.clinic_data.get("name", self.clinic_data.get("clinic_name")),
            "rep_id": self.representative_data.get("id"),
            "rep_name": self.representative_data.get("full_name"),
            "original_amount": 750.0,
            "remaining_amount": 750.0,
            "total_amount": 750.0,  # Added required field
            "due_date": datetime.now().isoformat(),
            "description": "دين اختبار للنظام المحاسبي الاحترافي",
            "priority": "medium",
            "status": "outstanding"
        }

        start_time = time.time()
        try:
            response = self.session.post(f"{BASE_URL}/enhanced-professional-accounting/debts", 
                                       json=debt_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                debt_id = data.get("debt_id") or data.get("id")
                if debt_id:
                    self.test_data_ids.append(("debt", debt_id))
                
                amount = debt_data["original_amount"]
                details = f"تم إنشاء الدين بنجاح - المبلغ: {amount:.2f} ج.م"
                if debt_id:
                    details += f" - ID: {debt_id}"
                
                self.log_test("إنشاء دين", True, response_time, details)
                return True
            else:
                self.log_test("إنشاء دين", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("إنشاء دين", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_collection_creation(self):
        """7. اختبار إنشاء تحصيل"""
        print("💵 اختبار إنشاء تحصيل...")
        
        # البحث عن فاتورة أو دين للتحصيل منه
        invoice_id = None
        debt_id = None
        for data_type, data_id in self.test_data_ids:
            if data_type == "invoice":
                invoice_id = data_id
            elif data_type == "debt":
                debt_id = data_id

        # استخدام الدين إذا لم تكن هناك فاتورة
        if not invoice_id and not debt_id:
            self.log_test("إنشاء تحصيل", False, 0, 
                        error_msg="لا توجد فاتورة أو دين متاح للتحصيل")
            return False

        # إعداد بيانات التحصيل
        collection_data = {
            "clinic_id": self.clinic_data.get("id") if self.clinic_data else "",
            "clinic_name": self.clinic_data.get("name", self.clinic_data.get("clinic_name")) if self.clinic_data else "",
            "amount": 300.0,
            "payment_method": "cash",
            "collection_date": datetime.now().isoformat(),
            "notes": "تحصيل اختبار للنظام المحاسبي الاحترافي",
            "collected_by": self.representative_data.get("id") if self.representative_data else "",
            "status": "pending_approval"
        }
        
        # إضافة معرف الفاتورة أو الدين
        if invoice_id:
            collection_data["invoice_id"] = invoice_id
        elif debt_id:
            collection_data["debt_id"] = debt_id

        start_time = time.time()
        try:
            response = self.session.post(f"{BASE_URL}/enhanced-professional-accounting/collections", 
                                       json=collection_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                data = response.json()
                collection_id = data.get("collection_id") or data.get("id")
                if collection_id:
                    self.test_data_ids.append(("collection", collection_id))
                
                amount = collection_data["amount"]
                source = "فاتورة" if invoice_id else "دين"
                details = f"تم إنشاء التحصيل بنجاح - المبلغ: {amount:.2f} ج.م من {source}"
                if collection_id:
                    details += f" - ID: {collection_id}"
                
                self.log_test("إنشاء تحصيل", True, response_time, details)
                return collection_id
            else:
                self.log_test("إنشاء تحصيل", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("إنشاء تحصيل", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def test_manager_approval(self, collection_id):
        """8. اختبار موافقة المدير"""
        print("✅ اختبار موافقة المدير...")
        
        if not collection_id:
            self.log_test("موافقة المدير", False, 0, 
                        error_msg="معرف التحصيل غير متوفر")
            return False

        start_time = time.time()
        try:
            response = self.session.put(f"{BASE_URL}/enhanced-professional-accounting/collections/{collection_id}/approve")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                details = f"تم اعتماد التحصيل بنجاح - ID: {collection_id}"
                if data.get("status"):
                    details += f" - الحالة: {data.get('status')}"
                
                self.log_test("موافقة المدير", True, response_time, details)
                return True
            else:
                self.log_test("موافقة المدير", False, response_time, 
                            error_msg=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("موافقة المدير", False, response_time, 
                        error_msg=f"خطأ في الاتصال: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء اختبار النظام المحاسبي الاحترافي الشامل بعد إصلاح مشاكل ObjectId")
        print("=" * 80)
        
        start_time = time.time()
        
        # 1. تسجيل الدخول
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2. اختبار لوحة التحكم
        self.test_dashboard()
        
        # 3. جمع البيانات الداعمة
        if not self.gather_supporting_data():
            print("❌ فشل في جمع البيانات الداعمة - إيقاف الاختبار")
            return
        
        # 4. إنشاء فاتورة شاملة
        self.test_comprehensive_invoice_creation()
        
        # 5. جلب الفواتير
        self.test_invoice_retrieval()
        
        # 6. إنشاء دين
        self.test_debt_creation()
        
        # 7. إنشاء تحصيل
        collection_id = self.test_collection_creation()
        
        # 8. موافقة المدير
        if collection_id:
            self.test_manager_approval(collection_id)
        
        # النتائج النهائية
        total_time = time.time() - start_time
        self.print_final_results(total_time)

    def print_final_results(self, total_time):
        """طباعة النتائج النهائية"""
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية للاختبار الشامل")
        print("=" * 80)
        
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        # حساب متوسط وقت الاستجابة
        response_times = [float(result["response_time"].replace("ms", "")) for result in self.test_results if result["success"]]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        print()
        
        # تفاصيل النتائج
        print("📋 تفاصيل النتائج:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result["success"] else "❌"
            print(f"{i:2d}. {status} {result['test']}: {result['details']}")
            if result["error"]:
                print(f"     خطأ: {result['error']}")
        
        print()
        
        # تقييم الأداء
        if success_rate >= 90:
            print("🎉 **ممتاز** - النظام المحاسبي الاحترافي يعمل بشكل مثالي!")
        elif success_rate >= 75:
            print("✅ **جيد** - النظام المحاسبي الاحترافي يعمل بشكل جيد مع تحسينات بسيطة")
        elif success_rate >= 50:
            print("⚠️ **متوسط** - النظام المحاسبي الاحترافي يحتاج تحسينات")
        else:
            print("❌ **ضعيف** - النظام المحاسبي الاحترافي يحتاج إصلاحات جوهرية")
        
        print()
        print("🎯 **الهدف:** التأكد من حل مشاكل ObjectId وأن النظام يعمل بالكامل")
        
        # تحليل المشاكل
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("\n🔍 **المشاكل المكتشفة:**")
            for failed_test in failed_tests:
                print(f"   ❌ {failed_test['test']}: {failed_test['error']}")
        
        print("\n" + "=" * 80)

if __name__ == "__main__":
    tester = EnhancedProfessionalAccountingObjectIdFixTester()
    tester.run_comprehensive_test()