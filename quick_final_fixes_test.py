#!/usr/bin/env python3
"""
اختبار نهائي سريع للتأكد من الإصلاحات - Quick Final Test for Fixes Verification
المطلوب: تسجيل دخول admin/admin123، اختبار العيادات (تعديل/حذف)، المخازن (warehouse products)، المناطق (GET /api/areas)، الديون (GET /api/debts)
Required: Login admin/admin123, test clinics (edit/delete), warehouses (warehouse products), areas (GET /api/areas), debts (GET /api/debts)
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class QuickFinalFixesTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details="", status_code=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "status_code": status_code,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} | {test_name} | {result['response_time_ms']}ms | {details}")
        
    def login_admin(self):
        """تسجيل دخول الأدمن"""
        print("\n🔐 اختبار تسجيل دخول admin/admin123...")
        
        start_time = time.time()
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                user_info = data.get("user", {})
                details = f"مستخدم: {user_info.get('full_name', 'غير محدد')} | دور: {user_info.get('role', 'غير محدد')}"
                self.log_test("تسجيل دخول admin/admin123", True, response_time, details, response.status_code)
                return True
            else:
                self.log_test("تسجيل دخول admin/admin123", False, response_time, 
                            f"HTTP {response.status_code}: {response.text}", response.status_code)
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("تسجيل دخول admin/admin123", False, response_time, f"خطأ: {str(e)}")
            return False
    
    def test_clinics_apis(self):
        """اختبار APIs العيادات"""
        print("\n🏥 اختبار APIs العيادات...")
        
        # 1. GET /api/clinics
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/clinics")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                clinics = response.json()
                clinic_count = len(clinics) if isinstance(clinics, list) else 0
                details = f"عدد العيادات: {clinic_count}"
                self.log_test("GET /api/clinics", True, response_time, details, response.status_code)
                
                # Get first clinic for testing update/delete
                test_clinic_id = None
                if clinics and len(clinics) > 0:
                    test_clinic_id = clinics[0].get("id")
                    
                # 2. PUT /api/clinics/{clinic_id} - Test update
                if test_clinic_id:
                    self.test_clinic_update(test_clinic_id)
                    
                # 3. DELETE /api/clinics/{clinic_id} - Test delete
                if test_clinic_id and len(clinics) > 5:  # Only test delete if we have enough clinics
                    self.test_clinic_delete(test_clinic_id)
                else:
                    self.log_test("DELETE /api/clinics/{id}", False, 0, "تم تخطي الاختبار - عدد العيادات قليل", "SKIPPED")
                    
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("GET /api/clinics", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/clinics", False, response_time, f"خطأ: {str(e)}")
    
    def test_clinic_update(self, clinic_id):
        """اختبار تحديث عيادة"""
        start_time = time.time()
        try:
            update_data = {
                "name": f"عيادة محدثة - اختبار {int(time.time())}",
                "owner_name": "د. محمد أحمد - محدث",
                "phone": "01234567890",
                "address": "عنوان محدث للاختبار"
            }
            
            response = self.session.put(f"{BACKEND_URL}/clinics/{clinic_id}", json=update_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                details = "تم تحديث العيادة بنجاح"
                self.log_test("PUT /api/clinics/{id}", True, response_time, details, response.status_code)
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("PUT /api/clinics/{id}", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("PUT /api/clinics/{id}", False, response_time, f"خطأ: {str(e)}")
    
    def test_clinic_delete(self, clinic_id):
        """اختبار حذف عيادة"""
        start_time = time.time()
        try:
            response = self.session.delete(f"{BACKEND_URL}/clinics/{clinic_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                details = "تم حذف العيادة بنجاح"
                self.log_test("DELETE /api/clinics/{id}", True, response_time, details, response.status_code)
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("DELETE /api/clinics/{id}", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("DELETE /api/clinics/{id}", False, response_time, f"خطأ: {str(e)}")
    
    def test_areas_apis(self):
        """اختبار APIs المناطق"""
        print("\n🗺️ اختبار APIs المناطق...")
        
        # 1. GET /api/areas
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/areas")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                areas = response.json()
                area_count = len(areas) if isinstance(areas, list) else 0
                details = f"عدد المناطق: {area_count}"
                self.log_test("GET /api/areas", True, response_time, details, response.status_code)
                        
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("GET /api/areas", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/areas", False, response_time, f"خطأ: {str(e)}")
    
    def test_warehouses_apis(self):
        """اختبار APIs المخازن"""
        print("\n📦 اختبار APIs المخازن...")
        
        # 1. GET /api/warehouses
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
                details = f"عدد المخازن: {warehouse_count}"
                self.log_test("GET /api/warehouses", True, response_time, details, response.status_code)
                
                # Test with first warehouse
                if warehouses and len(warehouses) > 0:
                    test_warehouse_id = warehouses[0].get("id")
                    if test_warehouse_id:
                        self.test_warehouse_products(test_warehouse_id)
                        
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("GET /api/warehouses", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/warehouses", False, response_time, f"خطأ: {str(e)}")
    
    def test_warehouse_products(self, warehouse_id):
        """اختبار منتجات المخزن"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                details = f"عدد المنتجات: {product_count}"
                self.log_test("GET /api/warehouses/{id}/products", True, response_time, details, response.status_code)
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("GET /api/warehouses/{id}/products", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/warehouses/{id}/products", False, response_time, f"خطأ: {str(e)}")
    
    def test_debts_apis(self):
        """اختبار APIs الديون"""
        print("\n💰 اختبار APIs الديون...")
        
        # 1. GET /api/debts
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/debts")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                debts = response.json()
                debt_count = len(debts) if isinstance(debts, list) else 0
                total_debt = sum(debt.get("remaining_amount", 0) for debt in debts) if debts else 0
                details = f"عدد الديون: {debt_count}, إجمالي: {total_debt:.2f} ج.م"
                self.log_test("GET /api/debts", True, response_time, details, response.status_code)
                        
            else:
                details = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log_test("GET /api/debts", False, response_time, details, response.status_code)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/debts", False, response_time, f"خطأ: {str(e)}")
    
    def generate_report(self):
        """إنشاء تقرير شامل"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"\n" + "="*80)
        print(f"🎯 **اختبار نهائي سريع للتأكد من الإصلاحات - Quick Final Fixes Test**")
        print(f"="*80)
        print(f"📊 **النتائج الإجمالية:**")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • الاختبارات الناجحة: {successful_tests}")
        print(f"   • معدل النجاح: {success_rate:.1f}%")
        print(f"   • متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   • إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📋 **تفاصيل الاختبارات:**")
        
        # Group by category
        categories = {
            "المصادقة": [],
            "العيادات": [],
            "المناطق": [],
            "المخازن": [],
            "الديون": []
        }
        
        for result in self.test_results:
            test_name = result["test"]
            if "تسجيل دخول" in test_name:
                categories["المصادقة"].append(result)
            elif "clinics" in test_name or "عيادة" in test_name:
                categories["العيادات"].append(result)
            elif "areas" in test_name or "منطقة" in test_name:
                categories["المناطق"].append(result)
            elif "warehouses" in test_name or "مخزن" in test_name:
                categories["المخازن"].append(result)
            elif "debts" in test_name or "ديون" in test_name:
                categories["الديون"].append(result)
        
        for category, results in categories.items():
            if results:
                successful = sum(1 for r in results if r["success"])
                total = len(results)
                rate = (successful / total * 100) if total > 0 else 0
                print(f"\n🔹 **{category} ({successful}/{total} - {rate:.1f}%):**")
                
                for result in results:
                    status = "✅" if result["success"] else "❌"
                    print(f"   {status} {result['test']} | {result['response_time_ms']}ms | {result['details']}")
        
        # Critical Issues Analysis
        print(f"\n🚨 **تحليل المشاكل الحرجة:**")
        critical_issues = []
        http_500_errors = []
        
        for result in self.test_results:
            if not result["success"]:
                if result.get("status_code") == 500:
                    http_500_errors.append(result["test"])
                critical_issues.append(f"❌ {result['test']}: {result['details']}")
        
        if http_500_errors:
            print(f"   🔴 **HTTP 500 Errors المكتشفة:** {len(http_500_errors)}")
            for error in http_500_errors:
                print(f"      • {error}")
        
        if critical_issues:
            print(f"   🔴 **جميع المشاكل المكتشفة:** {len(critical_issues)}")
            for issue in critical_issues[:5]:  # Show first 5
                print(f"      • {issue}")
            if len(critical_issues) > 5:
                print(f"      • ... و {len(critical_issues) - 5} مشاكل أخرى")
        else:
            print(f"   ✅ **لا توجد مشاكل حرجة مكتشفة!**")
        
        # Recommendations
        print(f"\n💡 **التوصيات:**")
        if success_rate >= 80:
            print(f"   ✅ النظام يعمل بشكل جيد - معدل نجاح {success_rate:.1f}%")
            print(f"   🎉 **الإصلاحات الرئيسية تعمل بنجاح!**")
        elif success_rate >= 60:
            print(f"   ⚠️ النظام يحتاج تحسينات - معدل نجاح {success_rate:.1f}%")
        else:
            print(f"   🔴 النظام يحتاج إصلاحات عاجلة - معدل نجاح {success_rate:.1f}%")
        
        if http_500_errors:
            print(f"   🔧 إصلاح HTTP 500 errors في: {', '.join(http_500_errors)}")
        
        print(f"\n" + "="*80)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "http_500_errors": http_500_errors,
            "critical_issues": len(critical_issues)
        }

def main():
    """تشغيل الاختبار الرئيسي"""
    print("🚀 بدء اختبار نهائي سريع للتأكد من الإصلاحات - Quick Final Fixes Test")
    print("="*80)
    
    tester = QuickFinalFixesTester()
    
    # 1. Login first
    if not tester.login_admin():
        print("❌ فشل تسجيل الدخول - توقف الاختبار")
        return
    
    # 2. Test specific requirements
    tester.test_clinics_apis()
    tester.test_areas_apis() 
    tester.test_warehouses_apis()
    tester.test_debts_apis()
    
    # 3. Generate comprehensive report
    report = tester.generate_report()
    
    return report

if __name__ == "__main__":
    main()