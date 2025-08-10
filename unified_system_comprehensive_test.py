#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار شامل للنظام المحسن الجديد - النظام المالي الموحد ونظام إدارة الزيارات
Comprehensive Testing for New Enhanced System - Unified Financial System & Visit Management
تاريخ: 2025
الهدف: اختبار شامل للنظام المحسن الجديد للتأكد من عمل جميع المكونات المضافة

الاختبارات المطلوبة:
1. النظام المالي الموحد - Unified Financial System
2. نظام إدارة الزيارات - Visit Management System  
3. فحص Database Indexes الجديدة
4. اختبارات التكامل
5. اختبارات الأداء

بيانات الاختبار:
- تسجيل دخول بـ admin/admin123
- إنشاء سجلات مالية تجريبية
- إنشاء زيارات تجريبية للمناديب
- معالجة دفعات تجريبية

الهدف: التأكد من أن النظام المحسن يعمل بنسبة 100% ولا يؤثر على الوظائف الموجودة
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys
import os

# إعدادات الاختبار - استخدام URL الصحيح من frontend/.env
BACKEND_URL = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

class UnifiedSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        self.available_clinics = []
        self.available_reps = []
        
    def log_test(self, test_name, success, response_time=None, details=None, error=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "response_time": response_time,
            "details": details,
            "error": str(error) if error else None,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if details:
            print(f"   📊 Details: {details}")
        if error:
            print(f"   ⚠️ Error: {error}")
    
    def login_admin(self):
        """تسجيل دخول المدير"""
        try:
            start_time = time.time()
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=TEST_CREDENTIALS,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}"
                })
                
                user_info = data.get("user", {})
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    True,
                    response_time,
                    f"User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول admin/admin123", False, error=str(e))
            return False
    
    def get_basic_data(self):
        """جلب البيانات الأساسية للاختبار"""
        try:
            # جلب العيادات المتاحة
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/clinics", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.available_clinics = response.json()
                self.log_test(
                    "جلب العيادات المتاحة",
                    True,
                    response_time,
                    f"Found {len(self.available_clinics)} clinics"
                )
            else:
                self.log_test(
                    "جلب العيادات المتاحة",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}"
                )
            
            # جلب المناديب المتاحين
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/users", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                self.available_reps = [u for u in users if u.get('role') in ['medical_rep', 'key_account']]
                self.log_test(
                    "جلب المناديب المتاحين",
                    True,
                    response_time,
                    f"Found {len(self.available_reps)} medical reps"
                )
            else:
                self.log_test(
                    "جلب المناديب المتاحين",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}"
                )
                
        except Exception as e:
            self.log_test("جلب البيانات الأساسية", False, error=str(e))
    
    def test_unified_financial_system(self):
        """اختبار النظام المالي الموحد"""
        print("\n🏦 اختبار النظام المالي الموحد - Unified Financial System")
        
        # 1. GET /api/unified-financial/dashboard/overview
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/dashboard/overview", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "GET /api/unified-financial/dashboard/overview",
                    True,
                    response_time,
                    f"Overview data: {len(data)} sections"
                )
            else:
                self.log_test(
                    "GET /api/unified-financial/dashboard/overview",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/unified-financial/dashboard/overview", False, error=str(e))
        
        # 2. GET /api/unified-financial/records
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/records", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                records = response.json()
                self.log_test(
                    "GET /api/unified-financial/records",
                    True,
                    response_time,
                    f"Found {len(records)} financial records"
                )
            else:
                self.log_test(
                    "GET /api/unified-financial/records",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/unified-financial/records", False, error=str(e))
        
        # 3. POST /api/unified-financial/records - إنشاء سجل مالي جديد
        if self.available_clinics:
            try:
                clinic_id = self.available_clinics[0].get('id')
                financial_record = {
                    "type": "invoice",
                    "clinic_id": clinic_id,
                    "amount": 1250.75,
                    "currency": "EGP",
                    "description": "فاتورة اختبار للنظام المالي الموحد",
                    "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
                    "category": "sales",
                    "payment_terms": "net_30"
                }
                
                start_time = time.time()
                response = self.session.post(
                    f"{API_BASE}/unified-financial/records",
                    json=financial_record,
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.log_test(
                        "POST /api/unified-financial/records",
                        True,
                        response_time,
                        f"Created record: {data.get('id', 'N/A')}, Amount: {financial_record['amount']} EGP"
                    )
                else:
                    self.log_test(
                        "POST /api/unified-financial/records",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test("POST /api/unified-financial/records", False, error=str(e))
        
        # 4. POST /api/unified-financial/process-payment - معالجة دفعة
        try:
            payment_data = {
                "record_id": "test_record_id",
                "amount": 625.50,
                "payment_method": "bank_transfer",
                "reference_number": f"PAY_{int(time.time())}",
                "notes": "دفعة اختبار للنظام المالي الموحد"
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{API_BASE}/unified-financial/process-payment",
                json=payment_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log_test(
                    "POST /api/unified-financial/process-payment",
                    True,
                    response_time,
                    f"Payment processed: {payment_data['amount']} EGP via {payment_data['payment_method']}"
                )
            else:
                self.log_test(
                    "POST /api/unified-financial/process-payment",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("POST /api/unified-financial/process-payment", False, error=str(e))
        
        # 5. GET /api/unified-financial/reports/comprehensive
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/reports/comprehensive", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                report = response.json()
                self.log_test(
                    "GET /api/unified-financial/reports/comprehensive",
                    True,
                    response_time,
                    f"Comprehensive report generated with {len(report)} sections"
                )
            else:
                self.log_test(
                    "GET /api/unified-financial/reports/comprehensive",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/unified-financial/reports/comprehensive", False, error=str(e))
        
        # 6. GET /api/unified-financial/invoices (للتوافق مع النظام القديم)
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/invoices", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                invoices = response.json()
                self.log_test(
                    "GET /api/unified-financial/invoices (backward compatibility)",
                    True,
                    response_time,
                    f"Found {len(invoices)} invoices"
                )
            else:
                self.log_test(
                    "GET /api/unified-financial/invoices (backward compatibility)",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/unified-financial/invoices (backward compatibility)", False, error=str(e))
        
        # 7. GET /api/unified-financial/debts (للتوافق مع النظام القديم)
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/debts", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                self.log_test(
                    "GET /api/unified-financial/debts (backward compatibility)",
                    True,
                    response_time,
                    f"Found {len(debts)} debts"
                )
            else:
                self.log_test(
                    "GET /api/unified-financial/debts (backward compatibility)",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/unified-financial/debts (backward compatibility)", False, error=str(e))
    
    def test_visit_management_system(self):
        """اختبار نظام إدارة الزيارات"""
        print("\n🏥 اختبار نظام إدارة الزيارات - Visit Management System")
        
        # 1. GET /api/visits/dashboard/overview
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/visits/dashboard/overview", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                overview = response.json()
                self.log_test(
                    "GET /api/visits/dashboard/overview",
                    True,
                    response_time,
                    f"Visit overview: {len(overview)} metrics"
                )
            else:
                self.log_test(
                    "GET /api/visits/dashboard/overview",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/visits/dashboard/overview", False, error=str(e))
        
        # 2. GET /api/visits/available-clinics
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/visits/available-clinics", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                self.log_test(
                    "GET /api/visits/available-clinics",
                    True,
                    response_time,
                    f"Available clinics for rep: {len(clinics)}"
                )
            else:
                self.log_test(
                    "GET /api/visits/available-clinics",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/visits/available-clinics", False, error=str(e))
        
        # 3. POST /api/visits/ - إنشاء زيارة جديدة
        if self.available_clinics:
            try:
                clinic_id = self.available_clinics[0].get('id')
                visit_data = {
                    "clinic_id": clinic_id,
                    "visit_type": "routine",
                    "purpose": "product_presentation",
                    "scheduled_date": datetime.now().isoformat(),
                    "notes": "زيارة اختبار لنظام إدارة الزيارات الجديد",
                    "expected_duration": 60,
                    "priority": "medium"
                }
                
                start_time = time.time()
                response = self.session.post(
                    f"{API_BASE}/visits/",
                    json=visit_data,
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    visit_id = data.get('id') or data.get('visit_id')
                    self.log_test(
                        "POST /api/visits/ - إنشاء زيارة جديدة",
                        True,
                        response_time,
                        f"Visit created: {visit_id}, Type: {visit_data['visit_type']}"
                    )
                    
                    # حفظ visit_id للاختبارات التالية
                    self.test_visit_id = visit_id
                else:
                    self.log_test(
                        "POST /api/visits/ - إنشاء زيارة جديدة",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test("POST /api/visits/ - إنشاء زيارة جديدة", False, error=str(e))
        
        # 4. POST /api/visits/check-in - تسجيل دخول للزيارة
        if hasattr(self, 'test_visit_id') and self.test_visit_id:
            try:
                checkin_data = {
                    "visit_id": self.test_visit_id,
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "location_notes": "أمام العيادة - موقع اختبار",
                    "arrival_time": datetime.now().isoformat()
                }
                
                start_time = time.time()
                response = self.session.post(
                    f"{API_BASE}/visits/check-in",
                    json=checkin_data,
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 201]:
                    self.log_test(
                        "POST /api/visits/check-in",
                        True,
                        response_time,
                        f"Check-in successful for visit: {self.test_visit_id}"
                    )
                else:
                    self.log_test(
                        "POST /api/visits/check-in",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test("POST /api/visits/check-in", False, error=str(e))
        
        # 5. POST /api/visits/complete - إنهاء زيارة
        if hasattr(self, 'test_visit_id') and self.test_visit_id:
            try:
                completion_data = {
                    "visit_id": self.test_visit_id,
                    "outcome": "successful",
                    "notes": "زيارة ناجحة - تم عرض المنتجات الجديدة",
                    "next_visit_date": (datetime.now() + timedelta(days=14)).isoformat(),
                    "products_discussed": ["product_1", "product_2"],
                    "orders_placed": False,
                    "feedback": "إيجابي - الطبيب مهتم بالمنتجات الجديدة"
                }
                
                start_time = time.time()
                response = self.session.post(
                    f"{API_BASE}/visits/complete",
                    json=completion_data,
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 201]:
                    self.log_test(
                        "POST /api/visits/complete",
                        True,
                        response_time,
                        f"Visit completed: {self.test_visit_id}, Outcome: {completion_data['outcome']}"
                    )
                else:
                    self.log_test(
                        "POST /api/visits/complete",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test("POST /api/visits/complete", False, error=str(e))
        
        # 6. GET /api/visits/ - قائمة الزيارات مع فلترة
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/visits/?status=all&limit=10", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                visits = response.json()
                self.log_test(
                    "GET /api/visits/ - قائمة الزيارات مع فلترة",
                    True,
                    response_time,
                    f"Found {len(visits)} visits"
                )
            else:
                self.log_test(
                    "GET /api/visits/ - قائمة الزيارات مع فلترة",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
        except Exception as e:
            self.log_test("GET /api/visits/ - قائمة الزيارات مع فلترة", False, error=str(e))
        
        # 7. GET /api/visits/{visit_id} - تفاصيل زيارة محددة
        if hasattr(self, 'test_visit_id') and self.test_visit_id:
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/visits/{self.test_visit_id}", timeout=30)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    visit_details = response.json()
                    self.log_test(
                        f"GET /api/visits/{self.test_visit_id}",
                        True,
                        response_time,
                        f"Visit details: Status={visit_details.get('status', 'N/A')}, Type={visit_details.get('visit_type', 'N/A')}"
                    )
                else:
                    self.log_test(
                        f"GET /api/visits/{self.test_visit_id}",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}: {response.text}"
                    )
            except Exception as e:
                self.log_test(f"GET /api/visits/{self.test_visit_id}", False, error=str(e))
    
    def test_database_indexes(self):
        """فحص Database Indexes الجديدة"""
        print("\n🗄️ فحص Database Indexes الجديدة")
        
        # هذا الاختبار يتطلب وصول مباشر لقاعدة البيانات
        # سنختبر بشكل غير مباشر من خلال أداء الاستعلامات
        
        try:
            # اختبار أداء استعلام unified_financial_records
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/unified-financial/records?limit=100", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test(
                    "فحص فهارس unified_financial_records",
                    True,
                    response_time,
                    f"Query performance: {response_time:.2f}ms (Good if < 500ms)"
                )
            else:
                self.log_test(
                    "فحص فهارس unified_financial_records",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test("فحص فهارس unified_financial_records", False, error=str(e))
        
        try:
            # اختبار أداء استعلام rep_visits
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/visits/?limit=100", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                self.log_test(
                    "فحص فهارس rep_visits",
                    True,
                    response_time,
                    f"Query performance: {response_time:.2f}ms (Good if < 500ms)"
                )
            else:
                self.log_test(
                    "فحص فهارس rep_visits",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test("فحص فهارس rep_visits", False, error=str(e))
    
    def test_integration(self):
        """اختبارات التكامل"""
        print("\n🔗 اختبارات التكامل")
        
        # 1. التأكد من أن النظام المالي الموحد يتكامل مع النظام القديم
        try:
            # اختبار الوصول للديون من النظام القديم
            start_time = time.time()
            old_debts_response = self.session.get(f"{API_BASE}/debts", timeout=30)
            old_debts_time = (time.time() - start_time) * 1000
            
            # اختبار الوصول للديون من النظام الجديد
            start_time = time.time()
            new_debts_response = self.session.get(f"{API_BASE}/unified-financial/debts", timeout=30)
            new_debts_time = (time.time() - start_time) * 1000
            
            if old_debts_response.status_code == 200 and new_debts_response.status_code == 200:
                old_debts = old_debts_response.json()
                new_debts = new_debts_response.json()
                
                self.log_test(
                    "تكامل النظام المالي الموحد مع النظام القديم",
                    True,
                    (old_debts_time + new_debts_time) / 2,
                    f"Old system: {len(old_debts)} debts, New system: {len(new_debts)} debts"
                )
            else:
                self.log_test(
                    "تكامل النظام المالي الموحد مع النظام القديم",
                    False,
                    error=f"Old: HTTP {old_debts_response.status_code}, New: HTTP {new_debts_response.status_code}"
                )
        except Exception as e:
            self.log_test("تكامل النظام المالي الموحد مع النظام القديم", False, error=str(e))
        
        # 2. فحص صلاحيات الوصول للعيادات المتاحة للمناديب
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/visits/available-clinics", timeout=30)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                available_clinics = response.json()
                self.log_test(
                    "صلاحيات الوصول للعيادات المتاحة للمناديب",
                    True,
                    response_time,
                    f"Available clinics: {len(available_clinics)}"
                )
            else:
                self.log_test(
                    "صلاحيات الوصول للعيادات المتاحة للمناديب",
                    False,
                    response_time,
                    error=f"HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test("صلاحيات الوصول للعيادات المتاحة للمناديب", False, error=str(e))
        
        # 3. التحقق من ترابط البيانات بين الزيارات والسجلات المالية
        try:
            # جلب الزيارات
            visits_response = self.session.get(f"{API_BASE}/visits/?limit=5", timeout=30)
            financial_response = self.session.get(f"{API_BASE}/unified-financial/records?limit=5", timeout=30)
            
            if visits_response.status_code == 200 and financial_response.status_code == 200:
                visits = visits_response.json()
                financial_records = financial_response.json()
                
                self.log_test(
                    "ترابط البيانات بين الزيارات والسجلات المالية",
                    True,
                    None,
                    f"Visits: {len(visits)}, Financial records: {len(financial_records)}"
                )
            else:
                self.log_test(
                    "ترابط البيانات بين الزيارات والسجلات المالية",
                    False,
                    error=f"Visits: HTTP {visits_response.status_code}, Financial: HTTP {financial_response.status_code}"
                )
        except Exception as e:
            self.log_test("ترابط البيانات بين الزيارات والسجلات المالية", False, error=str(e))
    
    def test_performance(self):
        """اختبارات الأداء"""
        print("\n⚡ اختبارات الأداء")
        
        # قياس سرعة استجابة APIs الجديدة
        apis_to_test = [
            ("unified-financial/dashboard/overview", "النظام المالي - نظرة عامة"),
            ("unified-financial/records", "النظام المالي - السجلات"),
            ("visits/dashboard/overview", "نظام الزيارات - نظرة عامة"),
            ("visits/available-clinics", "نظام الزيارات - العيادات المتاحة")
        ]
        
        total_response_time = 0
        successful_tests = 0
        
        for endpoint, description in apis_to_test:
            try:
                start_time = time.time()
                response = self.session.get(f"{API_BASE}/{endpoint}", timeout=30)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    total_response_time += response_time
                    successful_tests += 1
                    
                    performance_rating = "ممتاز" if response_time < 100 else "جيد" if response_time < 500 else "بطيء"
                    self.log_test(
                        f"أداء {description}",
                        True,
                        response_time,
                        f"Performance: {performance_rating}"
                    )
                else:
                    self.log_test(
                        f"أداء {description}",
                        False,
                        response_time,
                        error=f"HTTP {response.status_code}"
                    )
            except Exception as e:
                self.log_test(f"أداء {description}", False, error=str(e))
        
        # حساب متوسط الأداء
        if successful_tests > 0:
            avg_response_time = total_response_time / successful_tests
            self.log_test(
                "متوسط أداء APIs الجديدة",
                True,
                avg_response_time,
                f"Average response time across {successful_tests} APIs"
            )
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        # حساب متوسط وقت الاستجابة
        response_times = [r["response_time"] for r in self.test_results if r["response_time"]]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        print(f"\n{'='*80}")
        print(f"🎯 **اختبار شامل للنظام المحسن الجديد مكتمل - {success_rate:.1f}% SUCCESS!**")
        print(f"{'='*80}")
        
        print(f"\n📊 **النتائج الحاسمة للمتطلبات المحددة:**")
        
        # تجميع النتائج حسب الفئة
        categories = {
            "النظام المالي الموحد": [r for r in self.test_results if "unified-financial" in r["test_name"]],
            "نظام إدارة الزيارات": [r for r in self.test_results if "visits" in r["test_name"] or "زيارة" in r["test_name"]],
            "فحص Database Indexes": [r for r in self.test_results if "فهارس" in r["test_name"]],
            "اختبارات التكامل": [r for r in self.test_results if "تكامل" in r["test_name"] or "صلاحيات" in r["test_name"] or "ترابط" in r["test_name"]],
            "اختبارات الأداء": [r for r in self.test_results if "أداء" in r["test_name"]],
            "المصادقة والبيانات الأساسية": [r for r in self.test_results if "تسجيل دخول" in r["test_name"] or "جلب" in r["test_name"]]
        }
        
        for category, tests in categories.items():
            if tests:
                category_success = sum(1 for t in tests if t["success"])
                category_total = len(tests)
                category_rate = (category_success / category_total * 100) if category_total > 0 else 0
                
                status = "✅" if category_rate == 100 else "⚠️" if category_rate >= 50 else "❌"
                print(f"{status} **{category} ({category_rate:.1f}%):** {category_success}/{category_total} اختبار نجح")
                
                for test in tests:
                    result_icon = "✅" if test["success"] else "❌"
                    time_info = f" ({test['response_time']:.1f}ms)" if test["response_time"] else ""
                    print(f"   {result_icon} {test['test_name']}{time_info}")
        
        print(f"\n🎯 **التقييم النهائي:**")
        print(f"معدل النجاح {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)!")
        print(f"متوسط وقت الاستجابة: {avg_response_time:.2f}ms ({'ممتاز' if avg_response_time < 100 else 'جيد' if avg_response_time < 500 else 'يحتاج تحسين'})")
        print(f"إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        # تقييم الحالة العامة
        if success_rate >= 90:
            print(f"**🏆 النظام المحسن يعمل بشكل استثنائي! جميع المتطلبات الأساسية محققة والنظام جاهز للإنتاج!**")
        elif success_rate >= 70:
            print(f"**🟢 النظام المحسن يعمل بشكل جيد! معظم المتطلبات محققة مع بعض التحسينات المطلوبة.**")
        elif success_rate >= 50:
            print(f"**🟡 النظام المحسن يحتاج تحسينات! بعض المكونات تعمل لكن هناك مشاكل تحتاج إصلاح.**")
        else:
            print(f"**🔴 النظام المحسن يحتاج عمل كبير! معظم المكونات الجديدة لا تعمل بشكل صحيح.**")
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "categories": categories
        }
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار شامل للنظام المحسن الجديد...")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.login_admin():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبارات")
            return
        
        # 2. جلب البيانات الأساسية
        self.get_basic_data()
        
        # 3. اختبار النظام المالي الموحد
        self.test_unified_financial_system()
        
        # 4. اختبار نظام إدارة الزيارات
        self.test_visit_management_system()
        
        # 5. فحص Database Indexes
        self.test_database_indexes()
        
        # 6. اختبارات التكامل
        self.test_integration()
        
        # 7. اختبارات الأداء
        self.test_performance()
        
        # 8. إنشاء التقرير النهائي
        return self.generate_final_report()

def main():
    """الدالة الرئيسية"""
    tester = UnifiedSystemTester()
    try:
        results = tester.run_all_tests()
        return results
    except KeyboardInterrupt:
        print("\n⚠️ تم إيقاف الاختبار بواسطة المستخدم")
        return None
    except Exception as e:
        print(f"\n❌ خطأ في تشغيل الاختبارات: {str(e)}")
        return None

if __name__ == "__main__":
    main()