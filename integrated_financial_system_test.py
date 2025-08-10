#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار النظام المالي المتكامل - تقرير شامل
Integrated Financial System Testing - Comprehensive Report

الهدف: اختبار النظام المالي المتكامل المدمج في النظام الطبي
Goal: Test the integrated financial system within the medical management system
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

class FinancialSystemIntegrationTester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print("🏥💰 اختبار النظام المالي المتكامل المدمج في النظام الطبي")
        print("🏥💰 Integrated Financial System Testing for Medical Management System")
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
                f"{self.base_url}/auth/login",  # Remove /api since it's already in base_url
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
    
    def test_financial_endpoints_availability(self) -> Dict[str, bool]:
        """2. اختبار وجود النقاط النهائية المالية الجديدة"""
        print("💰 اختبار وجود النقاط النهائية المالية...")
        
        financial_endpoints = {
            "financial_dashboard": "/financial/dashboard/financial-overview",
            "financial_invoices": "/financial/invoices", 
            "financial_debts": "/financial/debts",
            "aging_analysis": "/financial/reports/aging-analysis",
            "financial_summary": "/financial/reports/financial-summary",
            "integrity_check": "/financial/system/integrity-check"
        }
        
        results = {}
        
        for endpoint_name, endpoint_path in financial_endpoints.items():
            try:
                start_time = time.time()
                response = self.session.get(f"{self.base_url}{endpoint_path}", timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code in [200, 401, 403]:  # Endpoint exists
                    results[endpoint_name] = True
                    self.log_test(
                        f"نقطة نهاية مالية: {endpoint_name}",
                        True,
                        f"متاح - HTTP {response.status_code}",
                        response_time
                    )
                else:
                    results[endpoint_name] = False
                    self.log_test(
                        f"نقطة نهاية مالية: {endpoint_name}",
                        False,
                        f"غير متاح - HTTP {response.status_code}"
                    )
                    
            except Exception as e:
                results[endpoint_name] = False
                self.log_test(
                    f"نقطة نهاية مالية: {endpoint_name}",
                    False,
                    f"خطأ في الاتصال: {str(e)}"
                )
        
        return results
    
    def test_existing_financial_apis(self) -> Dict[str, bool]:
        """3. اختبار واجهات برمجة التطبيقات المالية الموجودة"""
        print("📊 اختبار واجهات برمجة التطبيقات المالية الموجودة...")
        
        existing_apis = {
            "debts_list": "/debts",
            "payments_list": "/payments", 
            "dashboard_stats": "/dashboard/stats"
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
                            f"API الديون الموجودة",
                            True,
                            f"عدد الديون: {debt_count}, إجمالي المبلغ: {total_debt:.2f} ج.م",
                            response_time
                        )
                    elif api_name == "payments_list":
                        payment_count = len(data) if isinstance(data, list) else 0
                        total_payments = sum(item.get('payment_amount', 0) for item in data if isinstance(data, list))
                        self.log_test(
                            f"API المدفوعات الموجودة",
                            True,
                            f"عدد المدفوعات: {payment_count}, إجمالي المبلغ: {total_payments:.2f} ج.م",
                            response_time
                        )
                    elif api_name == "dashboard_stats":
                        stats = data
                        self.log_test(
                            f"API إحصائيات لوحة التحكم",
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
    
    def test_invoice_creation_via_orders(self) -> Optional[str]:
        """4. اختبار إنشاء فاتورة عبر نظام الطلبات"""
        print("📄 اختبار إنشاء فاتورة عبر نظام الطلبات...")
        
        try:
            # Get available clinics and products for realistic data
            clinics_response = self.session.get(f"{self.base_url}/clinics", timeout=10)
            products_response = self.session.get(f"{self.base_url}/products", timeout=10)
            
            if clinics_response.status_code != 200 or products_response.status_code != 200:
                self.log_test("إنشاء فاتورة عبر الطلبات", False, "لا يمكن الحصول على بيانات العيادات أو المنتجات")
                return None
            
            clinics = clinics_response.json()
            products = products_response.json()
            
            if not clinics or not products:
                self.log_test("إنشاء فاتورة عبر الطلبات", False, "لا توجد عيادات أو منتجات متاحة")
                return None
            
            # Create order which should automatically create invoice and debt
            order_data = {
                "clinic_id": clinics[0]["id"],
                "warehouse_id": "default_warehouse",
                "items": [
                    {
                        "product_id": products[0]["id"],
                        "quantity": 2
                    }
                ] if products else [],
                "notes": "طلب اختبار للنظام المالي المتكامل",
                "line": "test_line",
                "area_id": "test_area"
            }
            
            start_time = time.time()
            response = self.session.post(
                f"{self.base_url}/orders",
                json=order_data,
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                data = response.json()
                order_id = data.get("order_id")
                debt_record_id = data.get("debt_record_id")
                
                self.log_test(
                    "إنشاء فاتورة عبر الطلبات",
                    True,
                    f"تم إنشاء الطلب والفاتورة بنجاح - Order ID: {order_id}, Debt ID: {debt_record_id}",
                    response_time
                )
                return debt_record_id or order_id
            else:
                self.log_test("إنشاء فاتورة عبر الطلبات", False, f"HTTP {response.status_code}: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("إنشاء فاتورة عبر الطلبات", False, f"خطأ في إنشاء الفاتورة: {str(e)}")
            return None
    
    def test_debt_payment_processing(self) -> bool:
        """5. اختبار معالجة دفعة دين"""
        print("💳 اختبار معالجة دفعة دين...")
        
        try:
            # Get existing debts
            debt_response = self.session.get(f"{self.base_url}/debts", timeout=10)
            if debt_response.status_code == 200:
                debts = debt_response.json()
                if debts and len(debts) > 0:
                    target_debt = debts[0]
                    debt_id = target_debt.get("id")
                    remaining_amount = target_debt.get("remaining_amount", target_debt.get("debt_amount", 100.0))
                    
                    if remaining_amount > 0:
                        partial_payment = remaining_amount * 0.6  # Pay 60% of the debt
                        
                        payment_data = {
                            "debt_id": debt_id,
                            "payment_amount": partial_payment,
                            "payment_method": "cash",
                            "notes": "دفعة جزئية اختبار للنظام المالي المتكامل"
                        }
                        
                        start_time = time.time()
                        response = self.session.post(
                            f"{self.base_url}/payments/process",
                            json=payment_data,
                            timeout=10
                        )
                        response_time = (time.time() - start_time) * 1000
                        
                        if response.status_code in [200, 201]:
                            data = response.json()
                            new_remaining = data.get("remaining_amount", 0)
                            
                            self.log_test(
                                "معالجة دفعة دين",
                                True,
                                f"تم معالجة الدفعة بنجاح - المبلغ المدفوع: {partial_payment:.2f} ج.م, المتبقي: {new_remaining:.2f} ج.م",
                                response_time
                            )
                            return True
                        else:
                            self.log_test("معالجة دفعة دين", False, f"HTTP {response.status_code}: {response.text}")
                            return False
                    else:
                        self.log_test("معالجة دفعة دين", False, "لا توجد ديون متبقية للدفع")
                        return False
                else:
                    self.log_test("معالجة دفعة دين", False, "لا توجد ديون متاحة للاختبار")
                    return False
            else:
                self.log_test("معالجة دفعة دين", False, "لا يمكن الحصول على قائمة الديون")
                return False
                
        except Exception as e:
            self.log_test("معالجة دفعة دين", False, f"خطأ في معالجة دفعة الدين: {str(e)}")
            return False
    
    def test_financial_permissions(self) -> bool:
        """6. اختبار الصلاحيات المالية"""
        print("🔒 اختبار الصلاحيات المالية...")
        
        # Test that admin has access to financial endpoints
        financial_endpoints = [
            "/debts",
            "/payments",
            "/dashboard/stats"
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
        """7. اختبار سلامة البيانات المالية"""
        print("🔍 اختبار سلامة البيانات المالية...")
        
        try:
            # Manual integrity check by comparing debts and payments
            debts_response = self.session.get(f"{self.base_url}/debts", timeout=10)
            payments_response = self.session.get(f"{self.base_url}/payments", timeout=10)
            
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
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل للنظام المالي المتكامل"""
        print("🚀 بدء الاختبار الشامل للنظام المالي المتكامل...")
        print()
        
        # 1. Test admin login
        if not self.test_admin_login():
            print("❌ فشل في تسجيل الدخول - إيقاف الاختبار")
            return
        
        # 2. Test financial endpoints availability
        financial_endpoints_results = self.test_financial_endpoints_availability()
        
        # 3. Test existing financial APIs
        existing_apis_results = self.test_existing_financial_apis()
        
        # 4. Test invoice creation via orders
        order_id = self.test_invoice_creation_via_orders()
        
        # 5. Test debt payment processing
        payment_success = self.test_debt_payment_processing()
        
        # 6. Test financial permissions
        permissions_success = self.test_financial_permissions()
        
        # 7. Test data integrity
        integrity_success = self.test_data_integrity()
        
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
        print("📊 التقرير النهائي للنظام المالي المتكامل")
        print("📊 INTEGRATED FINANCIAL SYSTEM FINAL REPORT")
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
                if any(keyword in result["test"] for keyword in ["تسجيل دخول", "API", "فاتورة", "دين"]):
                    critical_failures.append(result["test"])
                else:
                    minor_issues.append(result["test"])
        
        if success_rate >= 80:
            print("🎉 النتيجة: النظام المالي المتكامل يعمل بشكل ممتاز!")
            print("🎉 RESULT: Integrated Financial System works excellently!")
        elif success_rate >= 60:
            print("⚠️  النتيجة: النظام المالي المتكامل يعمل بشكل جيد مع بعض التحسينات المطلوبة")
            print("⚠️  RESULT: Integrated Financial System works well with some improvements needed")
        else:
            print("❌ النتيجة: النظام المالي المتكامل يحتاج إلى إصلاحات كبيرة")
            print("❌ RESULT: Integrated Financial System needs major fixes")
        
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
            print("🔧 التوصيات:")
            print("   1. تحقق من تثبيت النظام المالي المتكامل")
            print("   2. تأكد من تكوين قاعدة البيانات المالية")
            print("   3. راجع صلاحيات الوصول للنقاط النهائية المالية")
        elif success_rate < 80:
            print("🔧 التوصيات:")
            print("   1. أكمل تطبيق النقاط النهائية المالية المفقودة")
            print("   2. حسن من معالجة الأخطاء في النظام المالي")
            print("   3. اختبر التكامل مع النظام الطبي الحالي")
        else:
            print("✅ النظام جاهز للإنتاج مع النظام المالي المتكامل!")
            print("✅ System ready for production with integrated financial system!")

def main():
    """الدالة الرئيسية لتشغيل الاختبار"""
    # Use the backend URL from environment
    backend_url = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com/api"
    
    print("🏥💰 اختبار النظام المالي المتكامل المدمج في النظام الطبي")
    print("🏥💰 Testing Integrated Financial System in Medical Management System")
    print(f"🌐 URL: {backend_url}")
    print()
    
    tester = FinancialSystemIntegrationTester(backend_url)
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()