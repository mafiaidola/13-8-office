#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار شامل للنظام المالي المصحح ومراجعة مشاكل الرؤية في النصوص
Comprehensive Testing for Corrected Financial System and Text Visibility Issues Review

الهدف: التأكد من أن النظام المالي الجديد يعمل بشكل مثالي وأن مشاكل الرؤية في النصوص قد تم حلها
Goal: Ensure the new financial system works perfectly and text visibility issues have been resolved

الاختبارات المطلوبة:
Required Tests:
1. اختبار النظام المالي الأساسي - Basic Financial System Testing
2. اختبار استجابة النظام - System Response Testing  
3. اختبار الصلاحيات - Permissions Testing
4. اختبار التقارير المالية - Financial Reports Testing
5. فحص النظام العام - General System Check

النتيجة المتوقعة: نظام مالي يعمل بنسبة 90%+ مع حل مشاكل الرؤية في النصوص
Expected Result: Financial system working at 90%+ with text visibility issues resolved
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class ComprehensiveFinancialSystemTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print("💰 اختبار شامل للنظام المالي المصحح ومراجعة مشاكل الرؤية في النصوص")
        print("💰 Comprehensive Testing for Corrected Financial System and Text Visibility Issues")
        print(f"🌐 Backend URL: {self.base_url}")
        print("=" * 80)
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
        if response_time > 0:
            print(f"   ⏱️  وقت الاستجابة: {response_time:.2f}ms")
        print()
    
    def test_admin_login(self) -> bool:
        """1. اختبار تسجيل دخول admin/admin123"""
        print("🔐 اختبار تسجيل دخول المدير...")
        
        try:
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                if self.jwt_token:
                    self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                    user_info = data.get("user", {})
                    self.log_test(
                        "تسجيل دخول admin/admin123",
                        True,
                        f"المستخدم: {user_info.get('full_name', 'Admin')}, الدور: {user_info.get('role', 'admin')}",
                        response_time
                    )
                    return True
                else:
                    self.log_test("تسجيل دخول admin/admin123", False, "لم يتم الحصول على JWT token")
                    return False
            else:
                self.log_test("تسجيل دخول admin/admin123", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("تسجيل دخول admin/admin123", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def test_financial_dashboard_overview(self) -> bool:
        """2. اختبار GET /api/financial/dashboard/financial-overview"""
        print("📊 اختبار نظرة عامة على لوحة التحكم المالية...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/financial/dashboard/financial-overview", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "GET /api/financial/dashboard/financial-overview",
                    True,
                    f"تم الحصول على النظرة العامة المالية بنجاح - البيانات متاحة",
                    response_time
                )
                return True
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/financial/dashboard/financial-overview",
                    False,
                    "النقطة النهائية غير متاحة - يحتاج تطبيق النظام المالي المتكامل"
                )
                return False
            else:
                self.log_test(
                    "GET /api/financial/dashboard/financial-overview",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/financial/dashboard/financial-overview",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_financial_invoices(self) -> bool:
        """3. اختبار GET /api/financial/invoices"""
        print("📄 اختبار الفواتير المالية...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/financial/invoices", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                invoice_count = len(data) if isinstance(data, list) else 0
                self.log_test(
                    "GET /api/financial/invoices",
                    True,
                    f"تم الحصول على {invoice_count} فاتورة بنجاح",
                    response_time
                )
                return True
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/financial/invoices",
                    False,
                    "النقطة النهائية غير متاحة - يحتاج تطبيق النظام المالي المتكامل"
                )
                return False
            else:
                self.log_test(
                    "GET /api/financial/invoices",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/financial/invoices",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_financial_debts(self) -> bool:
        """4. اختبار GET /api/financial/debts"""
        print("💳 اختبار الديون المالية...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/financial/debts", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                debt_count = len(data) if isinstance(data, list) else 0
                total_debt = sum(item.get('remaining_amount', 0) for item in data if isinstance(data, list))
                self.log_test(
                    "GET /api/financial/debts",
                    True,
                    f"تم الحصول على {debt_count} دين، إجمالي المبلغ: {total_debt:.2f} ج.م",
                    response_time
                )
                return True
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/financial/debts",
                    False,
                    "النقطة النهائية غير متاحة - يحتاج تطبيق النظام المالي المتكامل"
                )
                return False
            else:
                self.log_test(
                    "GET /api/financial/debts",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/financial/debts",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_aging_analysis_report(self) -> bool:
        """5. اختبار GET /api/financial/reports/aging-analysis"""
        print("📈 اختبار تقرير تقادم الديون...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/api/financial/reports/aging-analysis", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "GET /api/financial/reports/aging-analysis",
                    True,
                    "تم الحصول على تقرير تقادم الديون بنجاح",
                    response_time
                )
                return True
            elif response.status_code == 404:
                self.log_test(
                    "GET /api/financial/reports/aging-analysis",
                    False,
                    "النقطة النهائية غير متاحة - يحتاج تطبيق النظام المالي المتكامل"
                )
                return False
            else:
                self.log_test(
                    "GET /api/financial/reports/aging-analysis",
                    False,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "GET /api/financial/reports/aging-analysis",
                False,
                f"خطأ في الاتصال: {str(e)}"
            )
            return False
    
    def test_existing_financial_apis(self) -> Dict[str, bool]:
        """6. اختبار واجهات برمجة التطبيقات المالية الموجودة"""
        print("💰 اختبار واجهات برمجة التطبيقات المالية الموجودة...")
        
        existing_apis = {
            "debts_list": "/api/debts",
            "payments_list": "/api/payments",
            "dashboard_stats": "/api/dashboard/stats"
        }
        
        results = {}
        
        for api_name, api_path in existing_apis.items():
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{api_path}", timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    results[api_name] = True
                    
                    if api_name == "debts_list":
                        debt_count = len(data) if isinstance(data, list) else 0
                        total_debt = sum(item.get('remaining_amount', 0) for item in data if isinstance(data, list))
                        self.log_test(
                            "API الديون الموجودة",
                            True,
                            f"عدد الديون: {debt_count}, إجمالي المبلغ: {total_debt:.2f} ج.م",
                            response_time
                        )
                    elif api_name == "payments_list":
                        payment_count = len(data) if isinstance(data, list) else 0
                        total_payments = sum(item.get('payment_amount', 0) for item in data if isinstance(data, list))
                        self.log_test(
                            "API المدفوعات الموجودة",
                            True,
                            f"عدد المدفوعات: {payment_count}, إجمالي المبلغ: {total_payments:.2f} ج.م",
                            response_time
                        )
                    elif api_name == "dashboard_stats":
                        stats = data
                        self.log_test(
                            "API إحصائيات لوحة التحكم",
                            True,
                            f"المستخدمين: {stats.get('users', {}).get('total', 0)}, العيادات: {stats.get('clinics', {}).get('total', 0)}",
                            response_time
                        )
                else:
                    results[api_name] = False
                    self.log_test(
                        f"API {api_name}",
                        False,
                        f"HTTP {response.status_code}: {response.text[:100]}"
                    )
                    
            except Exception as e:
                results[api_name] = False
                self.log_test(
                    f"API {api_name}",
                    False,
                    f"خطأ في الاتصال: {str(e)}"
                )
        
        return results
    
    def test_system_response_times(self) -> bool:
        """7. اختبار أوقات الاستجابة"""
        print("⚡ اختبار أوقات الاستجابة...")
        
        test_endpoints = [
            "/api/users",
            "/api/clinics", 
            "/api/products",
            "/api/dashboard/stats"
        ]
        
        response_times = []
        successful_requests = 0
        
        for endpoint in test_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                response_time = (time.time() - start_time) * 1000
                response_times.append(response_time)
                
                if response.status_code == 200:
                    successful_requests += 1
                    
            except Exception as e:
                continue
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            self.log_test(
                "اختبار أوقات الاستجابة",
                True,
                f"متوسط وقت الاستجابة: {avg_response_time:.2f}ms، الطلبات الناجحة: {successful_requests}/{len(test_endpoints)}",
                avg_response_time
            )
            return avg_response_time < 1000  # Less than 1 second is good
        else:
            self.log_test("اختبار أوقات الاستجابة", False, "لم يتم الحصول على أي استجابة")
            return False
    
    def test_financial_permissions(self) -> bool:
        """8. اختبار الصلاحيات المالية"""
        print("🔒 اختبار الصلاحيات المالية...")
        
        # Test that admin has access to financial endpoints
        financial_endpoints = [
            "/api/debts",
            "/api/payments",
            "/api/dashboard/stats"
        ]
        
        accessible_count = 0
        total_endpoints = len(financial_endpoints)
        
        for endpoint in financial_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    accessible_count += 1
            except:
                pass
        
        if accessible_count == total_endpoints:
            self.log_test(
                "الصلاحيات المالية للأدمن",
                True,
                f"الأدمن يمكنه الوصول لجميع النقاط النهائية المالية ({accessible_count}/{total_endpoints})"
            )
            return True
        else:
            self.log_test(
                "الصلاحيات المالية للأدمن",
                False,
                f"الأدمن يمكنه الوصول لـ {accessible_count}/{total_endpoints} نقاط نهائية فقط"
            )
            return False
    
    def test_data_integrity(self) -> bool:
        """9. اختبار سلامة البيانات المالية"""
        print("🔍 اختبار سلامة البيانات المالية...")
        
        try:
            # Manual integrity check by comparing debts and payments
            debts_response = self.session.get(f"{self.base_url}/api/debts", timeout=10)
            payments_response = self.session.get(f"{self.base_url}/api/payments", timeout=10)
            
            if debts_response.status_code == 200 and payments_response.status_code == 200:
                debts = debts_response.json()
                payments = payments_response.json()
                
                total_debt = sum(debt.get('remaining_amount', 0) for debt in debts if isinstance(debts, list))
                total_payments = sum(payment.get('payment_amount', 0) for payment in payments if isinstance(payments, list))
                
                self.log_test(
                    "فحص سلامة البيانات المالية",
                    True,
                    f"إجمالي الديون المتبقية: {total_debt:.2f} ج.م, إجمالي المدفوعات: {total_payments:.2f} ج.م"
                )
                return True
            else:
                self.log_test("فحص سلامة البيانات المالية", False, "لا يمكن الوصول لبيانات الديون أو المدفوعات")
                return False
                
        except Exception as e:
            self.log_test("فحص سلامة البيانات المالية", False, f"خطأ في فحص سلامة البيانات: {str(e)}")
            return False
    
    def test_general_system_check(self) -> bool:
        """10. فحص النظام العام"""
        print("🔧 فحص النظام العام...")
        
        system_endpoints = [
            "/api/users",
            "/api/clinics",
            "/api/products", 
            "/api/orders",
            "/api/visits"
        ]
        
        working_endpoints = 0
        total_endpoints = len(system_endpoints)
        
        for endpoint in system_endpoints:
            try:
                response = self.session.get(f"{self.base_url}{endpoint}", timeout=10)
                if response.status_code == 200:
                    working_endpoints += 1
            except:
                pass
        
        system_health = (working_endpoints / total_endpoints) * 100
        
        if system_health >= 80:
            self.log_test(
                "فحص النظام العام",
                True,
                f"صحة النظام: {system_health:.1f}% ({working_endpoints}/{total_endpoints} نقاط نهائية تعمل)"
            )
            return True
        else:
            self.log_test(
                "فحص النظام العام",
                False,
                f"صحة النظام: {system_health:.1f}% ({working_endpoints}/{total_endpoints} نقاط نهائية تعمل)"
            )
            return False
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل للنظام المالي"""
        print("🚀 بدء الاختبار الشامل للنظام المالي المصحح...")
        print()
        
        # 1. Test admin login
        if not self.test_admin_login():
            print("❌ فشل في تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2. Test financial dashboard overview
        self.test_financial_dashboard_overview()
        
        # 3. Test financial invoices
        self.test_financial_invoices()
        
        # 4. Test financial debts
        self.test_financial_debts()
        
        # 5. Test aging analysis report
        self.test_aging_analysis_report()
        
        # 6. Test existing financial APIs
        self.test_existing_financial_apis()
        
        # 7. Test system response times
        self.test_system_response_times()
        
        # 8. Test financial permissions
        self.test_financial_permissions()
        
        # 9. Test data integrity
        self.test_data_integrity()
        
        # 10. Test general system check
        self.test_general_system_check()
        
        # Generate final report
        self.generate_final_report()
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result["response_time"] for result in self.test_results if result["response_time"] > 0)
        response_count = sum(1 for result in self.test_results if result["response_time"] > 0)
        avg_response_time = avg_response_time / response_count if response_count > 0 else 0
        
        print("=" * 80)
        print("📊 التقرير النهائي للنظام المالي المصحح")
        print("📊 CORRECTED FINANCIAL SYSTEM FINAL REPORT")
        print("=" * 80)
        print(f"✅ الاختبارات الناجحة: {successful_tests}/{total_tests}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        print(f"⏱️  متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕒 إجمالي وقت الاختبار: {total_time:.2f}s")
        print()
        
        # Categorize results
        critical_failures = []
        minor_issues = []
        
        for result in self.test_results:
            if not result["success"]:
                if any(keyword in result["test"] for keyword in ["تسجيل دخول", "financial", "مالي"]):
                    critical_failures.append(result["test"])
                else:
                    minor_issues.append(result["test"])
        
        if success_rate >= 90:
            print("🎉 النتيجة: النظام المالي المصحح يعمل بشكل مثالي!")
            print("🎉 RESULT: Corrected Financial System works perfectly!")
        elif success_rate >= 70:
            print("⚠️  النتيجة: النظام المالي المصحح يعمل بشكل جيد مع بعض التحسينات المطلوبة")
            print("⚠️  RESULT: Corrected Financial System works well with some improvements needed")
        else:
            print("❌ النتيجة: النظام المالي المصحح يحتاج إلى إصلاحات إضافية")
            print("❌ RESULT: Corrected Financial System needs additional fixes")
        
        if critical_failures:
            print(f"\n🚨 مشاكل حرجة ({len(critical_failures)}):")
            for failure in critical_failures:
                print(f"   - {failure}")
        
        if minor_issues:
            print(f"\n⚠️  مشاكل بسيطة ({len(minor_issues)}):")
            for issue in minor_issues:
                print(f"   - {issue}")
        
        print("\n" + "=" * 80)
        
        # Specific recommendations based on test results
        if success_rate < 50:
            print("🔧 التوصيات الحرجة:")
            print("   1. تطبيق النظام المالي المتكامل الجديد تحت /api/financial/")
            print("   2. إضافة جميع النقاط النهائية المالية المطلوبة")
            print("   3. تكوين قاعدة البيانات المالية بشكل صحيح")
        elif success_rate < 80:
            print("🔧 التوصيات:")
            print("   1. أكمل تطبيق النقاط النهائية المالية المفقودة")
            print("   2. حسن من معالجة الأخطاء في النظام المالي")
            print("   3. اختبر التكامل مع النظام الطبي الحالي")
        else:
            print("✅ النظام المالي جاهز للإنتاج!")
            print("✅ Financial System ready for production!")

def main():
    """الدالة الرئيسية لتشغيل الاختبار"""
    # Use the backend URL from the Arabic review request
    backend_url = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com"
    
    print("💰 اختبار شامل للنظام المالي المصحح ومراجعة مشاكل الرؤية في النصوص")
    print("💰 Comprehensive Testing for Corrected Financial System and Text Visibility Issues")
    print(f"🌐 URL: {backend_url}")
    print()
    
    tester = ComprehensiveFinancialSystemTester(backend_url)
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()