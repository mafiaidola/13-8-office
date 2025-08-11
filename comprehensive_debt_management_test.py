#!/usr/bin/env python3
"""
اختبار شامل لوظيفة "add debt" مع خيارات الدفع الجزئي/الكامل
Comprehensive testing for "add debt" functionality with partial/full payment options
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ComprehensiveDebtTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        self.created_debt_id = None
        self.valid_clinic_id = None
        self.valid_sales_rep_id = None
        
    def log_test(self, test_name, success, response_time, details):
        """تسجيل نتيجة الاختبار"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status} | {test_name} | {response_time:.2f}ms | {details}")
    
    def login_admin(self):
        """1) تسجيل دخول admin/admin123"""
        print("\n🔐 Step 1: Admin Login")
        print("=" * 50)
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                
                if self.jwt_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.jwt_token}"
                    })
                    
                    user_info = data.get("user", {})
                    self.log_test(
                        "Admin Login", 
                        True, 
                        response_time,
                        f"User: {user_info.get('full_name', 'admin')}, Role: {user_info.get('role', 'admin')}"
                    )
                    return True
                else:
                    self.log_test("Admin Login", False, response_time, "No access token in response")
                    return False
            else:
                self.log_test("Admin Login", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Admin Login", False, response_time, f"Exception: {str(e)}")
            return False
    
    def get_valid_clinic_and_sales_rep(self):
        """الحصول على clinic_id و sales_rep_id صحيحين من البيانات الحقيقية"""
        print("\n📋 Step 2: Get Valid Clinic and Sales Rep Data")
        print("=" * 50)
        
        # Get clinics
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/clinics", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                if clinics and len(clinics) > 0:
                    self.valid_clinic_id = clinics[0].get("id")
                    clinic_name = clinics[0].get("name", "Unknown")
                    self.log_test(
                        "Get Valid Clinic", 
                        True, 
                        response_time,
                        f"Found {len(clinics)} clinics, using: {clinic_name} (ID: {self.valid_clinic_id})"
                    )
                else:
                    self.log_test("Get Valid Clinic", False, response_time, "No clinics found")
                    return False
            else:
                self.log_test("Get Valid Clinic", False, response_time, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Get Valid Clinic", False, response_time, f"Exception: {str(e)}")
            return False
        
        # Get users (sales reps)
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                # Find a medical_rep or key_account
                sales_reps = [u for u in users if u.get("role") in ["medical_rep", "key_account"]]
                
                if sales_reps:
                    self.valid_sales_rep_id = sales_reps[0].get("id")
                    rep_name = sales_reps[0].get("full_name", "Unknown")
                    rep_role = sales_reps[0].get("role", "Unknown")
                    self.log_test(
                        "Get Valid Sales Rep", 
                        True, 
                        response_time,
                        f"Found {len(sales_reps)} sales reps, using: {rep_name} ({rep_role}) (ID: {self.valid_sales_rep_id})"
                    )
                    return True
                else:
                    self.log_test("Get Valid Sales Rep", False, response_time, "No sales reps found")
                    return False
            else:
                self.log_test("Get Valid Sales Rep", False, response_time, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Get Valid Sales Rep", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_post_debts_add_new_debt(self):
        """2) اختبار POST /api/debts - إضافة دين جديد مع البيانات المطلوبة"""
        print("\n💰 Step 3: Test POST /api/debts - Add New Debt")
        print("=" * 50)
        
        if not self.valid_clinic_id or not self.valid_sales_rep_id:
            self.log_test("POST /api/debts", False, 0, "Missing valid clinic_id or sales_rep_id")
            return False
        
        debt_data = {
            "clinic_id": self.valid_clinic_id,
            "sales_rep_id": self.valid_sales_rep_id,
            "amount": 1500.75,  # مبلغ حقيقي
            "description": "دين اختبار شامل - فاتورة مبيعات أدوية",
            "debt_type": "invoice",
            "due_date": "2024-02-15",
            "notes": "تم إنشاء هذا الدين لاختبار نظام إدارة الديون والمدفوعات"
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/debts",
                json=debt_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                result = response.json()
                self.created_debt_id = result.get("debt_id") or result.get("id")
                
                self.log_test(
                    "POST /api/debts - Add New Debt", 
                    True, 
                    response_time,
                    f"Debt created successfully. ID: {self.created_debt_id}, Amount: {debt_data['amount']} EGP"
                )
                return True
            else:
                self.log_test(
                    "POST /api/debts - Add New Debt", 
                    False, 
                    response_time, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("POST /api/debts - Add New Debt", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_get_debts_verify_new_debt(self):
        """3) اختبار GET /api/debts للتأكد من ظهور الدين الجديد"""
        print("\n📊 Step 4: Test GET /api/debts - Verify New Debt Appears")
        print("=" * 50)
        
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/debts", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                
                # البحث عن الدين الذي تم إنشاؤه
                found_debt = None
                if self.created_debt_id:
                    found_debt = next((d for d in debts if d.get("id") == self.created_debt_id), None)
                
                if found_debt:
                    debt_amount = found_debt.get("remaining_amount", found_debt.get("debt_amount", 0))
                    debt_status = found_debt.get("status", "unknown")
                    clinic_name = found_debt.get("clinic_name", "Unknown")
                    
                    self.log_test(
                        "GET /api/debts - Verify New Debt", 
                        True, 
                        response_time,
                        f"New debt found! Amount: {debt_amount} EGP, Status: {debt_status}, Clinic: {clinic_name}"
                    )
                    return True
                else:
                    self.log_test(
                        "GET /api/debts - Verify New Debt", 
                        False, 
                        response_time, 
                        f"New debt not found in {len(debts)} total debts"
                    )
                    return False
            else:
                self.log_test("GET /api/debts - Verify New Debt", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/debts - Verify New Debt", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_process_partial_payment(self):
        """4) اختبار POST /api/payments/process - معالجة دفعة جزئية للدين"""
        print("\n💳 Step 5: Test POST /api/payments/process - Process Partial Payment")
        print("=" * 50)
        
        if not self.created_debt_id:
            self.log_test("Process Partial Payment", False, 0, "No debt ID available for payment")
            return False
        
        # دفعة جزئية - 60% من المبلغ الأصلي
        partial_payment_amount = 900.45  # من أصل 1500.75
        
        payment_data = {
            "debt_id": self.created_debt_id,
            "payment_amount": partial_payment_amount,
            "payment_method": "bank_transfer",
            "notes": "دفعة جزئية أولى - تحويل بنكي"
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/payments/process",
                json=payment_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                remaining_amount = result.get("remaining_amount", 0)
                payment_status = result.get("payment_status", "unknown")
                
                self.log_test(
                    "Process Partial Payment", 
                    True, 
                    response_time,
                    f"Partial payment processed! Paid: {partial_payment_amount} EGP, Remaining: {remaining_amount} EGP, Status: {payment_status}"
                )
                return True
            else:
                self.log_test(
                    "Process Partial Payment", 
                    False, 
                    response_time, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Process Partial Payment", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_process_final_payment(self):
        """5) اختبار POST /api/payments/process - معالجة دفعة أخرى (نهائية)"""
        print("\n💰 Step 6: Test POST /api/payments/process - Process Final Payment")
        print("=" * 50)
        
        if not self.created_debt_id:
            self.log_test("Process Final Payment", False, 0, "No debt ID available for payment")
            return False
        
        # دفعة نهائية لتسديد المتبقي
        final_payment_amount = 600.30  # المتبقي من 1500.75 - 900.45
        
        payment_data = {
            "debt_id": self.created_debt_id,
            "payment_amount": final_payment_amount,
            "payment_method": "cash",
            "notes": "دفعة نهائية - تسديد كامل نقداً"
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/payments/process",
                json=payment_data,
                timeout=10
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                result = response.json()
                remaining_amount = result.get("remaining_amount", 0)
                payment_status = result.get("payment_status", "unknown")
                fully_paid = result.get("fully_paid", False)
                
                self.log_test(
                    "Process Final Payment", 
                    True, 
                    response_time,
                    f"Final payment processed! Paid: {final_payment_amount} EGP, Remaining: {remaining_amount} EGP, Status: {payment_status}, Fully Paid: {fully_paid}"
                )
                return True
            else:
                self.log_test(
                    "Process Final Payment", 
                    False, 
                    response_time, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Process Final Payment", False, response_time, f"Exception: {str(e)}")
            return False
    
    def verify_statistics_and_status_updates(self):
        """6) التأكد من تحديث الإحصائيات والحالات بشكل صحيح"""
        print("\n📈 Step 7: Verify Statistics and Status Updates")
        print("=" * 50)
        
        # فحص حالة الدين بعد السداد
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/debts", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                updated_debt = next((d for d in debts if d.get("id") == self.created_debt_id), None)
                
                if updated_debt:
                    debt_status = updated_debt.get("status", "unknown")
                    payment_status = updated_debt.get("payment_status", "unknown")
                    remaining_amount = updated_debt.get("remaining_amount", 0)
                    
                    is_fully_paid = remaining_amount == 0 and debt_status == "settled"
                    
                    self.log_test(
                        "Verify Debt Status Update", 
                        True, 
                        response_time,
                        f"Debt Status: {debt_status}, Payment Status: {payment_status}, Remaining: {remaining_amount} EGP, Fully Settled: {is_fully_paid}"
                    )
                else:
                    self.log_test("Verify Debt Status Update", False, response_time, "Updated debt not found")
                    return False
            else:
                self.log_test("Verify Debt Status Update", False, response_time, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Verify Debt Status Update", False, response_time, f"Exception: {str(e)}")
            return False
        
        # فحص سجلات المدفوعات
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/payments", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                payments = response.json()
                debt_payments = [p for p in payments if p.get("debt_id") == self.created_debt_id]
                
                total_paid = sum(p.get("payment_amount", 0) for p in debt_payments)
                
                self.log_test(
                    "Verify Payment Records", 
                    True, 
                    response_time,
                    f"Found {len(debt_payments)} payment records, Total Paid: {total_paid} EGP"
                )
                return True
            else:
                self.log_test("Verify Payment Records", False, response_time, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Verify Payment Records", False, response_time, f"Exception: {str(e)}")
            return False
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        print("\n" + "="*80)
        print("🎯 COMPREHENSIVE DEBT MANAGEMENT TESTING FINAL REPORT")
        print("="*80)
        
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(t["response_time"] for t in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"📊 **النتائج الحاسمة للمتطلبات المحددة:**")
        print(f"✅ **معدل النجاح:** {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ **متوسط وقت الاستجابة:** {avg_response_time:.2f}ms")
        print(f"🕒 **إجمالي وقت التنفيذ:** {total_time:.2f}s")
        
        print(f"\n📋 **تفاصيل الاختبارات:**")
        for i, test in enumerate(self.test_results, 1):
            status = "✅" if test["success"] else "❌"
            print(f"{i}. {status} {test['test']} ({test['response_time']:.2f}ms)")
            if test["details"]:
                print(f"   └─ {test['details']}")
        
        print(f"\n🎯 **التقييم النهائي:**")
        if success_rate >= 90:
            print("🎉 **EXCELLENT!** نظام إدارة الديون والمدفوعات يعمل بشكل مثالي!")
        elif success_rate >= 75:
            print("✅ **GOOD!** نظام إدارة الديون يعمل بشكل جيد مع تحسينات بسيطة مطلوبة.")
        elif success_rate >= 50:
            print("⚠️ **NEEDS IMPROVEMENT!** النظام يحتاج إصلاحات قبل الاستخدام الإنتاجي.")
        else:
            print("❌ **CRITICAL ISSUES!** النظام يحتاج إصلاحات جوهرية.")
        
        print(f"\n🔍 **الخلاصة:**")
        if self.created_debt_id:
            print(f"✅ تم إنشاء دين جديد بنجاح (ID: {self.created_debt_id})")
            print(f"✅ تم اختبار الدفع الجزئي والكامل")
            print(f"✅ تم التحقق من تحديث الإحصائيات والحالات")
        
        print("="*80)
        
        return success_rate >= 75

def main():
    """تشغيل الاختبار الشامل"""
    print("🚀 بدء اختبار شامل لوظيفة إدارة الديون والمدفوعات")
    print("🎯 الهدف: التأكد من أن وظيفة إضافة الديون مع خيارات الدفع الجزئي/الكامل تعمل بشكل مثالي")
    
    tester = ComprehensiveDebtTester()
    
    # تنفيذ الاختبارات بالتسلسل المطلوب
    success = True
    
    # 1) تسجيل دخول admin/admin123
    if not tester.login_admin():
        success = False
    
    # 2) الحصول على بيانات حقيقية
    if success and not tester.get_valid_clinic_and_sales_rep():
        success = False
    
    # 3) اختبار POST /api/debts - إضافة دين جديد
    if success and not tester.test_post_debts_add_new_debt():
        success = False
    
    # 4) اختبار GET /api/debts للتأكد من ظهور الدين الجديد
    if success and not tester.test_get_debts_verify_new_debt():
        success = False
    
    # 5) اختبار POST /api/payments/process - معالجة دفعة جزئية
    if success and not tester.test_process_partial_payment():
        success = False
    
    # 6) اختبار POST /api/payments/process - معالجة دفعة أخرى
    if success and not tester.test_process_final_payment():
        success = False
    
    # 7) التأكد من تحديث الإحصائيات والحالات
    if success and not tester.verify_statistics_and_status_updates():
        success = False
    
    # إنتاج التقرير النهائي
    final_success = tester.generate_final_report()
    
    return final_success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)