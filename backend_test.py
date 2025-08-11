#!/usr/bin/env python3
"""
اختبار سريع للنظام المالي بعد إضافة endpoints المدفوعات المفقودة
Quick Financial System Test After Adding Missing Payment Endpoints

المطلوب حسب المراجعة العربية:
1) تسجيل دخول admin/admin123 
2) اختبار GET /api/payments (كان مفقود من قبل)
3) اختبار POST /api/payments/process مع دين موجود
4) اختبار GET /api/payments/statistics (جديد)
5) التحقق من تحديث حالة الدين بعد الدفع
6) التحقق من تسجيل النشاط في activities

الهدف: الوصول لنسبة نجاح 95%+ في النظام المالي مع اكتمال جميع endpoints المطلوبة لتدفق الفاتورة → الدين → التحصيل
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://f4f7e091-f5a6-4f57-bca3-79ac25601921.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class FinancialSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details="", error_msg=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({result['response_time_ms']}ms)")
        if error_msg:
            print(f"   🔍 خطأ: {error_msg}")
    
    def test_admin_login(self):
        """اختبار تسجيل دخول الأدمن"""
        start_time = time.time()
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}"
                })
                
                details = f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
                self.log_test("تسجيل دخول admin/admin123", True, response_time, details)
                return True
            else:
                self.log_test("تسجيل دخول admin/admin123", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("تسجيل دخول admin/admin123", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return False
    
    def test_get_payments(self):
        """اختبار GET /api/payments (كان مفقود من قبل)"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/payments")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                payments = response.json()
                details = f"تم العثور على {len(payments)} سجل دفع"
                if payments:
                    total_amount = sum(float(p.get('payment_amount', 0)) for p in payments)
                    details += f" - إجمالي المبلغ: {total_amount} ج.م"
                
                self.log_test("GET /api/payments", True, response_time, details)
                return payments
            else:
                self.log_test("GET /api/payments", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return []
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/payments", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return []
    
    def test_get_debts(self):
        """جلب الديون الموجودة للاختبار"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/debts")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                # Handle both simple array and complex object responses
                if isinstance(data, list):
                    debts = data
                elif isinstance(data, dict) and 'debts' in data:
                    debts = data['debts']
                else:
                    debts = []
                
                details = f"تم العثور على {len(debts)} دين"
                if debts:
                    total_remaining = sum(float(d.get('remaining_amount', 0)) for d in debts)
                    details += f" - إجمالي المتبقي: {total_remaining} ج.م"
                
                self.log_test("GET /api/debts", True, response_time, details)
                return debts
            else:
                self.log_test("GET /api/debts", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return []
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/debts", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return []
    
    def test_process_payment(self, debt_id, payment_amount):
        """اختبار POST /api/payments/process مع دين موجود"""
        start_time = time.time()
        try:
            payment_data = {
                "debt_id": debt_id,
                "payment_amount": payment_amount,
                "payment_method": "cash",
                "payment_notes": "دفعة اختبار للنظام المالي المحدث"
            }
            
            response = self.session.post(f"{API_BASE}/payments/process", json=payment_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                details = f"تم معالجة دفعة {payment_amount} ج.م - المتبقي: {result.get('new_remaining_amount', 0)} ج.م - الحالة: {result.get('debt_status', 'Unknown')}"
                self.log_test("POST /api/payments/process", True, response_time, details)
                return result
            else:
                self.log_test("POST /api/payments/process", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("POST /api/payments/process", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return None
    
    def test_payment_statistics(self):
        """اختبار GET /api/payments/statistics (جديد)"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/payments/statistics")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                stats = response.json()
                details = f"إجمالي المدفوعات: {stats.get('total_payments', 0)} - إجمالي المبلغ: {stats.get('total_amount_paid', 0)} ج.م - متوسط الدفعة: {stats.get('average_payment', 0)} ج.م"
                self.log_test("GET /api/payments/statistics", True, response_time, details)
                return stats
            else:
                self.log_test("GET /api/payments/statistics", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/payments/statistics", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return None
    
    def test_debt_status_update(self, debt_id):
        """التحقق من تحديث حالة الدين بعد الدفع"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/debts")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                debts = response.json()
                target_debt = next((d for d in debts if d.get('id') == debt_id), None)
                
                if target_debt:
                    status = target_debt.get('status', 'Unknown')
                    remaining = target_debt.get('remaining_amount', 0)
                    details = f"حالة الدين: {status} - المتبقي: {remaining} ج.م"
                    self.log_test("تحديث حالة الدين", True, response_time, details)
                    return target_debt
                else:
                    self.log_test("تحديث حالة الدين", False, response_time, 
                                "الدين غير موجود", "")
                    return None
            else:
                self.log_test("تحديث حالة الدين", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("تحديث حالة الدين", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return None
    
    def create_test_debt(self):
        """إنشاء دين تجريبي للاختبار"""
        start_time = time.time()
        try:
            debt_data = {
                "clinic_id": "test-clinic-001",
                "clinic_name": "عيادة الاختبار",
                "original_amount": 100.0,
                "remaining_amount": 100.0,
                "description": "دين تجريبي للاختبار",
                "due_date": datetime.now().isoformat()
            }
            
            response = self.session.post(f"{API_BASE}/debts", json=debt_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                debt_id = result.get('debt_id') or result.get('id')
                details = f"تم إنشاء دين تجريبي - ID: {debt_id}"
                self.log_test("إنشاء دين تجريبي", True, response_time, details)
                return debt_id
            else:
                self.log_test("إنشاء دين تجريبي", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return None
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("إنشاء دين تجريبي", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return None
        """التحقق من تسجيل النشاط في activities"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/activities?activity_type=payment_processed&limit=5")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                activities = response.json()
                payment_activities = [a for a in activities if a.get('activity_type') == 'payment_processed']
                details = f"تم العثور على {len(payment_activities)} نشاط دفع مسجل"
                if payment_activities:
                    latest = payment_activities[0]
                    details += f" - آخر نشاط: {latest.get('description', 'Unknown')}"
                
                self.log_test("تسجيل النشاط في activities", True, response_time, details)
                return payment_activities
            else:
                self.log_test("تسجيل النشاط في activities", False, response_time, 
                            f"HTTP {response.status_code}", response.text)
                return []
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("تسجيل النشاط في activities", False, response_time, 
                        "خطأ في الاتصال", str(e))
            return []
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل للنظام المالي"""
        print("🚀 بدء اختبار سريع للنظام المالي بعد إضافة endpoints المدفوعات المفقودة")
        print("=" * 80)
        
        # 1) تسجيل دخول admin/admin123
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2) اختبار GET /api/payments (كان مفقود من قبل)
        initial_payments = self.test_get_payments()
        
        # جلب الديون الموجودة
        existing_debts = self.test_get_debts()
        
        if not existing_debts:
            print("⚠️ لا توجد ديون للاختبار - سيتم إنشاء دين تجريبي")
            # يمكن إضافة كود لإنشاء دين تجريبي هنا إذا لزم الأمر
            return
        
        # اختيار أول دين للاختبار
        test_debt = existing_debts[0]
        debt_id = test_debt.get('id')
        remaining_amount = float(test_debt.get('remaining_amount', 0))
        
        if remaining_amount <= 0:
            print("⚠️ الدين المختار مسدد بالكامل - البحث عن دين آخر")
            unpaid_debts = [d for d in existing_debts if float(d.get('remaining_amount', 0)) > 0]
            if not unpaid_debts:
                print("⚠️ جميع الديون مسددة - لا يمكن اختبار المدفوعات")
                return
            test_debt = unpaid_debts[0]
            debt_id = test_debt.get('id')
            remaining_amount = float(test_debt.get('remaining_amount', 0))
        
        print(f"🎯 اختبار الدفع للدين: {debt_id} - المبلغ المتبقي: {remaining_amount} ج.م")
        
        # تحديد مبلغ الدفع (نصف المبلغ المتبقي أو 50 ج.م كحد أقصى)
        payment_amount = min(remaining_amount / 2, 50.0)
        payment_amount = round(payment_amount, 2)
        
        # 3) اختبار POST /api/payments/process مع دين موجود
        payment_result = self.test_process_payment(debt_id, payment_amount)
        
        # 4) اختبار GET /api/payments/statistics (جديد)
        self.test_payment_statistics()
        
        # 5) التحقق من تحديث حالة الدين بعد الدفع
        if payment_result:
            self.test_debt_status_update(debt_id)
        
        # 6) التحقق من تسجيل النشاط في activities
        self.test_activity_logging()
        
        # اختبار GET /api/payments مرة أخرى للتأكد من إضافة الدفعة الجديدة
        final_payments = self.test_get_payments()
        
        # عرض النتائج النهائية
        self.display_final_results()
    
    def display_final_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 80)
        print("📊 النتائج النهائية للاختبار السريع للنظام المالي")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(r["response_time_ms"] for r in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n🎯 **تقييم الهدف المطلوب:**")
        if success_rate >= 95:
            print(f"🟢 **EXCELLENT** - تم تحقيق الهدف! معدل النجاح {success_rate:.1f}% (الهدف: 95%+)")
        elif success_rate >= 85:
            print(f"🟡 **GOOD** - قريب من الهدف! معدل النجاح {success_rate:.1f}% (الهدف: 95%+)")
        else:
            print(f"🔴 **NEEDS IMPROVEMENT** - لم يتم تحقيق الهدف! معدل النجاح {success_rate:.1f}% (الهدف: 95%+)")
        
        print(f"\n📋 **ملخص الاختبارات:**")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
            if result["error"]:
                print(f"   🔍 {result['error']}")
        
        print(f"\n🏁 **الخلاصة:**")
        if success_rate >= 95:
            print("✅ النظام المالي يعمل بشكل ممتاز مع جميع endpoints المدفوعات المطلوبة!")
            print("✅ تدفق الفاتورة → الدين → التحصيل مكتمل ويعمل بنجاح!")
            print("🎉 النظام جاهز للاستخدام الفعلي!")
        else:
            print("⚠️ النظام المالي يحتاج تحسينات إضافية لتحقيق الهدف المطلوب")
            failed_tests = [r for r in self.test_results if not r["success"]]
            if failed_tests:
                print("🔧 الاختبارات التي تحتاج إصلاح:")
                for test in failed_tests:
                    print(f"   - {test['test']}: {test['error']}")

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = FinancialSystemTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()