#!/usr/bin/env python3
"""
اختبار سريع للـ APIs الجديدة والمُصلحة في الباكند
Quick Backend Testing for New and Fixed APIs - Arabic Review

الهدف: التحقق من أن الإصلاحات الجديدة تعمل بشكل صحيح
Goal: Verify that new fixes work correctly

المطلوب اختبار:
Required Testing:
1. اختبار العيادات المُصلحة - Fixed Clinics APIs
2. اختبار APIs الديون الجديدة - New Debt APIs  
3. اختبار APIs لوحة التحكم المُحسنة - Enhanced Dashboard APIs
4. اختبار المخازن - Warehouse APIs
5. اختبار المناطق - Area APIs
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class ArabicReviewQuickTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details="", error=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test_name": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} | {test_name} | {result['response_time_ms']}ms | {details}")
        if error:
            print(f"   خطأ: {error}")
    
    def authenticate(self):
        """تسجيل الدخول والحصول على JWT token"""
        print("\n🔐 تسجيل الدخول...")
        
        start_time = time.time()
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                
                user_info = data.get("user", {})
                details = f"مستخدم: {user_info.get('full_name', 'admin')} | دور: {user_info.get('role', 'admin')}"
                self.log_test("تسجيل الدخول", True, response_time, details)
                return True
            else:
                self.log_test("تسجيل الدخول", False, response_time, "", f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("تسجيل الدخول", False, response_time, "", str(e))
            return False
    
    def test_fixed_clinics_apis(self):
        """اختبار العيادات المُصلحة"""
        print("\n🏥 اختبار العيادات المُصلحة...")
        
        # First, get available clinics to test with
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/clinics")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                clinics = response.json()
                clinic_count = len(clinics)
                self.log_test("GET /api/clinics", True, response_time, f"عدد العيادات: {clinic_count}")
                
                if clinics:
                    # Test with first available clinic
                    test_clinic = clinics[0]
                    clinic_id = test_clinic.get('id')
                    
                    # Test PUT /api/clinics/{id} - Update clinic
                    self.test_update_clinic(clinic_id, test_clinic)
                    
                    # Test DELETE /api/clinics/{id} - Delete clinic (if safe)
                    # Note: We'll test with a non-critical clinic or skip if all are important
                    if clinic_count > 5:  # Only test delete if we have many clinics
                        self.test_delete_clinic(clinic_id)
                    else:
                        self.log_test("DELETE /api/clinics/{id}", False, 0, "تم تخطي الحذف - عدد العيادات قليل", "Safety skip")
                else:
                    self.log_test("اختبار تحديث العيادات", False, 0, "", "لا توجد عيادات للاختبار")
            else:
                self.log_test("GET /api/clinics", False, response_time, "", f"HTTP {response.status_code}")
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/clinics", False, response_time, "", str(e))
    
    def test_update_clinic(self, clinic_id, clinic_data):
        """اختبار تحديث عيادة"""
        start_time = time.time()
        try:
            # Prepare update data
            update_data = {
                "name": clinic_data.get("name", "عيادة محدثة"),
                "owner_name": clinic_data.get("owner_name", "دكتور محدث"),
                "phone": clinic_data.get("phone", "01234567890"),
                "address": clinic_data.get("address", "عنوان محدث"),
                "is_active": True
            }
            
            response = self.session.put(f"{API_BASE}/clinics/{clinic_id}", json=update_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                details = f"تم تحديث العيادة: {update_data['name']}"
                self.log_test("PUT /api/clinics/{id}", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("PUT /api/clinics/{id}", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("PUT /api/clinics/{id}", False, response_time, "", str(e))
    
    def test_delete_clinic(self, clinic_id):
        """اختبار حذف عيادة"""
        start_time = time.time()
        try:
            response = self.session.delete(f"{API_BASE}/clinics/{clinic_id}")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                details = f"تم حذف العيادة بنجاح"
                self.log_test("DELETE /api/clinics/{id}", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("DELETE /api/clinics/{id}", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("DELETE /api/clinics/{id}", False, response_time, "", str(e))
    
    def test_new_debt_apis(self):
        """اختبار APIs الديون الجديدة"""
        print("\n💰 اختبار APIs الديون الجديدة...")
        
        # Test GET /api/debts
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/debts")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                debts = response.json()
                debt_count = len(debts)
                total_debt = sum(debt.get('remaining_amount', 0) for debt in debts)
                details = f"عدد الديون: {debt_count} | إجمالي: {total_debt:.2f} ج.م"
                self.log_test("GET /api/debts", True, response_time, details)
                
                # Test POST /api/debts (create new debt)
                self.test_create_debt()
                
                # Test payment processing if we have debts
                if debts:
                    test_debt = debts[0]
                    if test_debt.get('remaining_amount', 0) > 0:
                        self.test_process_payment(test_debt)
                
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/debts", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/debts", False, response_time, "", str(e))
    
    def test_create_debt(self):
        """اختبار إنشاء دين جديد"""
        start_time = time.time()
        try:
            # Get a clinic to create debt for
            clinics_response = self.session.get(f"{API_BASE}/clinics")
            if clinics_response.status_code == 200:
                clinics = clinics_response.json()
                if clinics:
                    clinic_id = clinics[0].get('id')
                    
                    debt_data = {
                        "clinic_id": clinic_id,
                        "debt_amount": 500.0,
                        "debt_type": "manual",
                        "notes": "دين اختبار من المراجعة العربية",
                        "due_date": "2024-02-15"
                    }
                    
                    response = self.session.post(f"{API_BASE}/debts", json=debt_data)
                    response_time = time.time() - start_time
                    
                    if response.status_code == 200 or response.status_code == 201:
                        result = response.json()
                        details = f"تم إنشاء دين بمبلغ: {debt_data['debt_amount']} ج.م"
                        self.log_test("POST /api/debts", True, response_time, details)
                    else:
                        error_msg = f"HTTP {response.status_code}"
                        try:
                            error_detail = response.json().get('detail', '')
                            if error_detail:
                                error_msg += f" - {error_detail}"
                        except:
                            pass
                        self.log_test("POST /api/debts", False, response_time, "", error_msg)
                else:
                    self.log_test("POST /api/debts", False, 0, "", "لا توجد عيادات لإنشاء دين")
            else:
                self.log_test("POST /api/debts", False, 0, "", "فشل في جلب العيادات")
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("POST /api/debts", False, response_time, "", str(e))
    
    def test_process_payment(self, debt_data):
        """اختبار معالجة دفعة"""
        start_time = time.time()
        try:
            debt_id = debt_data.get('id')
            remaining_amount = debt_data.get('remaining_amount', 0)
            
            # Pay a portion of the debt
            payment_amount = min(100.0, remaining_amount * 0.5)  # Pay 50% or 100 EGP, whichever is smaller
            
            payment_data = {
                "debt_id": debt_id,
                "payment_amount": payment_amount,
                "payment_method": "cash",
                "notes": "دفعة اختبار من المراجعة العربية"
            }
            
            response = self.session.post(f"{API_BASE}/debts/{debt_id}/payment", json=payment_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                new_remaining = result.get('remaining_amount', 0)
                details = f"تم دفع: {payment_amount:.2f} ج.م | متبقي: {new_remaining:.2f} ج.م"
                self.log_test("POST /api/debts/{id}/payment", True, response_time, details)
            else:
                # Try alternative endpoint
                response = self.session.post(f"{API_BASE}/payments/process", json=payment_data)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    result = response.json()
                    new_remaining = result.get('remaining_amount', 0)
                    details = f"تم دفع: {payment_amount:.2f} ج.م | متبقي: {new_remaining:.2f} ج.م"
                    self.log_test("POST /api/payments/process", True, response_time, details)
                else:
                    error_msg = f"HTTP {response.status_code}"
                    try:
                        error_detail = response.json().get('detail', '')
                        if error_detail:
                            error_msg += f" - {error_detail}"
                    except:
                        pass
                    self.log_test("POST /api/debts/{id}/payment", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("POST /api/debts/{id}/payment", False, response_time, "", str(e))
    
    def test_enhanced_dashboard_apis(self):
        """اختبار APIs لوحة التحكم المُحسنة"""
        print("\n📊 اختبار APIs لوحة التحكم المُحسنة...")
        
        # Test GET /api/dashboard/recent-activities
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/recent-activities")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                activities = response.json()
                activity_count = len(activities) if isinstance(activities, list) else 0
                details = f"عدد الأنشطة الحديثة: {activity_count}"
                self.log_test("GET /api/dashboard/recent-activities", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/dashboard/recent-activities", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/dashboard/recent-activities", False, response_time, "", str(e))
        
        # Test GET /api/dashboard/visits
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/visits")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                visits = response.json()
                visit_count = len(visits) if isinstance(visits, list) else 0
                details = f"عدد الزيارات: {visit_count}"
                self.log_test("GET /api/dashboard/visits", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/dashboard/visits", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/dashboard/visits", False, response_time, "", str(e))
        
        # Test GET /api/dashboard/collections
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/collections")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                collections = response.json()
                if isinstance(collections, dict):
                    total_collected = collections.get('total_amount', 0)
                    details = f"إجمالي التحصيل: {total_collected:.2f} ج.م"
                else:
                    details = f"بيانات التحصيل متاحة"
                self.log_test("GET /api/dashboard/collections", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/dashboard/collections", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/dashboard/collections", False, response_time, "", str(e))
    
    def test_warehouse_apis(self):
        """اختبار المخازن"""
        print("\n🏪 اختبار المخازن...")
        
        # First get available warehouses
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/warehouses")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                warehouses = response.json()
                warehouse_count = len(warehouses)
                self.log_test("GET /api/warehouses", True, response_time, f"عدد المخازن: {warehouse_count}")
                
                if warehouses:
                    test_warehouse = warehouses[0]
                    warehouse_id = test_warehouse.get('id')
                    
                    # Test GET /api/warehouses/{id}/products
                    self.test_warehouse_products(warehouse_id)
                    
                    # Test PUT /api/warehouses/{id}
                    self.test_update_warehouse(warehouse_id, test_warehouse)
                else:
                    self.log_test("اختبار المخازن", False, 0, "", "لا توجد مخازن للاختبار")
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/warehouses", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/warehouses", False, response_time, "", str(e))
    
    def test_warehouse_products(self, warehouse_id):
        """اختبار منتجات المخزن"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/warehouses/{warehouse_id}/products")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                details = f"عدد المنتجات في المخزن: {product_count}"
                self.log_test("GET /api/warehouses/{id}/products", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/warehouses/{id}/products", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/warehouses/{id}/products", False, response_time, "", str(e))
    
    def test_update_warehouse(self, warehouse_id, warehouse_data):
        """اختبار تحديث مخزن"""
        start_time = time.time()
        try:
            update_data = {
                "name": warehouse_data.get("name", "مخزن محدث"),
                "location": warehouse_data.get("location", "موقع محدث"),
                "manager_name": warehouse_data.get("manager_name", "مدير محدث"),
                "is_active": True
            }
            
            response = self.session.put(f"{API_BASE}/warehouses/{warehouse_id}", json=update_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                details = f"تم تحديث المخزن: {update_data['name']}"
                self.log_test("PUT /api/warehouses/{id}", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("PUT /api/warehouses/{id}", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("PUT /api/warehouses/{id}", False, response_time, "", str(e))
    
    def test_area_apis(self):
        """اختبار المناطق"""
        print("\n🗺️ اختبار المناطق...")
        
        # First get available areas
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/areas")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                areas = response.json()
                area_count = len(areas)
                self.log_test("GET /api/areas", True, response_time, f"عدد المناطق: {area_count}")
                
                if areas:
                    test_area = areas[0]
                    area_id = test_area.get('id')
                    
                    # Test PUT /api/areas/{id}
                    self.test_update_area(area_id, test_area)
                else:
                    self.log_test("اختبار المناطق", False, 0, "", "لا توجد مناطق للاختبار")
            else:
                error_msg = f"HTTP {response.status_code}"
                self.log_test("GET /api/areas", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("GET /api/areas", False, response_time, "", str(e))
    
    def test_update_area(self, area_id, area_data):
        """اختبار تحديث منطقة"""
        start_time = time.time()
        try:
            update_data = {
                "name": area_data.get("name", "منطقة محدثة"),
                "code": area_data.get("code", "UPDATED"),
                "description": area_data.get("description", "وصف محدث"),
                "manager_name": area_data.get("manager_name", "مدير محدث"),
                "is_active": True
            }
            
            response = self.session.put(f"{API_BASE}/areas/{area_id}", json=update_data)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                result = response.json()
                details = f"تم تحديث المنطقة: {update_data['name']}"
                self.log_test("PUT /api/areas/{id}", True, response_time, details)
            else:
                error_msg = f"HTTP {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    pass
                self.log_test("PUT /api/areas/{id}", False, response_time, "", error_msg)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("PUT /api/areas/{id}", False, response_time, "", str(e))
    
    def generate_report(self):
        """إنشاء تقرير شامل للنتائج"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t['success']])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        avg_response_time = sum(t['response_time_ms'] for t in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "="*80)
        print("🎯 تقرير سريع للـ APIs الجديدة والمُصلحة - Arabic Review Quick Report")
        print("="*80)
        
        print(f"\n📊 ملخص النتائج:")
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   نجح: {successful_tests} ✅")
        print(f"   فشل: {failed_tests} ❌")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        print(f"   متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        # Group results by category
        categories = {
            "المصادقة": [t for t in self.test_results if "تسجيل الدخول" in t['test_name']],
            "العيادات المُصلحة": [t for t in self.test_results if "clinics" in t['test_name'] or "العيادات" in t['test_name']],
            "الديون الجديدة": [t for t in self.test_results if "debts" in t['test_name'] or "payment" in t['test_name'] or "الديون" in t['test_name']],
            "لوحة التحكم المُحسنة": [t for t in self.test_results if "dashboard" in t['test_name']],
            "المخازن": [t for t in self.test_results if "warehouses" in t['test_name'] or "المخازن" in t['test_name']],
            "المناطق": [t for t in self.test_results if "areas" in t['test_name'] or "المناطق" in t['test_name']]
        }
        
        print(f"\n📋 تفاصيل النتائج حسب الفئة:")
        for category, tests in categories.items():
            if tests:
                successful = len([t for t in tests if t['success']])
                total = len(tests)
                rate = (successful / total * 100) if total > 0 else 0
                status = "✅" if rate >= 80 else "⚠️" if rate >= 50 else "❌"
                print(f"   {status} {category}: {successful}/{total} ({rate:.1f}%)")
                
                for test in tests:
                    status_icon = "✅" if test['success'] else "❌"
                    print(f"      {status_icon} {test['test_name']} - {test['response_time_ms']}ms")
                    if test['details']:
                        print(f"         📝 {test['details']}")
                    if test['error']:
                        print(f"         ⚠️ {test['error']}")
        
        print(f"\n🎯 خلاصة التحسن في معدل نجاح الباكند:")
        if success_rate >= 90:
            print("   🎉 ممتاز! معدل النجاح عالي جداً - الإصلاحات تعمل بشكل مثالي")
        elif success_rate >= 75:
            print("   ✅ جيد جداً! معظم الإصلاحات تعمل بشكل صحيح")
        elif success_rate >= 50:
            print("   ⚠️ متوسط - بعض الإصلاحات تحتاج مراجعة")
        else:
            print("   ❌ ضعيف - الإصلاحات تحتاج عمل إضافي")
        
        print(f"\n⏱️ تم الانتهاء في {total_time:.2f} ثانية")
        print("="*80)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "categories": categories,
            "test_results": self.test_results
        }

def main():
    """تشغيل الاختبار السريع"""
    print("🚀 بدء الاختبار السريع للـ APIs الجديدة والمُصلحة...")
    print(f"🔗 الخادم: {API_BASE}")
    
    tester = ArabicReviewQuickTester()
    
    # Step 1: Authentication
    if not tester.authenticate():
        print("❌ فشل في تسجيل الدخول - توقف الاختبار")
        return
    
    # Step 2: Test Fixed Clinics APIs
    tester.test_fixed_clinics_apis()
    
    # Step 3: Test New Debt APIs
    tester.test_new_debt_apis()
    
    # Step 4: Test Enhanced Dashboard APIs
    tester.test_enhanced_dashboard_apis()
    
    # Step 5: Test Warehouse APIs
    tester.test_warehouse_apis()
    
    # Step 6: Test Area APIs
    tester.test_area_apis()
    
    # Step 7: Generate comprehensive report
    report = tester.generate_report()
    
    return report

if __name__ == "__main__":
    main()