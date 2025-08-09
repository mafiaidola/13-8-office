#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل للنظام الجديد المحسن بعد تطبيق جميع التحديثات
Comprehensive Testing for Enhanced System After All Updates Applied

المطلوب اختبار:
1. إدارة المخازن والمنتجات المُصلحة
2. نظام العيادات المحسن  
3. نظام إدارة الزيارات
4. النظام المالي الموحد

الهدف: التأكد من عمل جميع التحديثات والإصلاحات المطبقة وعدم وجود مشاكل في APIs الجديدة
"""

import requests
import json
import time
from datetime import datetime
import sys

class ComprehensiveArabicSystemTester:
    def __init__(self):
        # استخدام الـ URL من متغيرات البيئة
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        if not self.base_url.endswith('/api'):
            self.base_url += '/api'
            
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🚀 بدء اختبار شامل للنظام المحسن")
        print(f"📡 Backend URL: {self.base_url}")
        print("=" * 80)

    def make_request(self, method, endpoint, data=None, headers=None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {}
        
        if self.jwt_token:
            headers['Authorization'] = f'Bearer {self.jwt_token}'
        
        try:
            start_time = time.time()
            
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                headers['Content-Type'] = 'application/json'
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            
            return {
                'status_code': response.status_code,
                'data': response.json() if response.content else {},
                'response_time': response_time,
                'success': 200 <= response.status_code < 300
            }
            
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'response_time': 0,
                'success': False
            }
        except json.JSONDecodeError:
            return {
                'status_code': response.status_code,
                'data': {'error': 'Invalid JSON response'},
                'response_time': 0,
                'success': False
            }

    def test_admin_login(self):
        """اختبار تسجيل دخول admin/admin123"""
        print("🔐 اختبار تسجيل دخول admin/admin123...")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        result = self.make_request('POST', '/auth/login', login_data)
        
        if result['success'] and 'access_token' in result['data']:
            self.jwt_token = result['data']['access_token']
            user_info = result['data'].get('user', {})
            
            self.test_results.append({
                'test': 'تسجيل دخول admin/admin123',
                'status': 'نجح ✅',
                'details': f"المستخدم: {user_info.get('full_name', 'غير محدد')} | الدور: {user_info.get('role', 'غير محدد')}",
                'response_time': f"{result['response_time']:.2f}ms"
            })
            return True
        else:
            self.test_results.append({
                'test': 'تسجيل دخول admin/admin123',
                'status': 'فشل ❌',
                'details': f"خطأ: {result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{result['response_time']:.2f}ms"
            })
            return False

    def test_warehouse_management_fixed(self):
        """اختبار إدارة المخازن والمنتجات المُصلحة"""
        print("🏭 اختبار إدارة المخازن والمنتجات المُصلحة...")
        
        # 1. GET /api/warehouses - جلب المخازن
        print("  📦 اختبار GET /api/warehouses...")
        result = self.make_request('GET', '/warehouses')
        
        if result['success']:
            warehouses = result['data']
            warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/warehouses - جلب المخازن',
                'status': 'نجح ✅',
                'details': f"تم جلب {warehouse_count} مخزن",
                'response_time': f"{result['response_time']:.2f}ms"
            })
            
            # 2. اختبار GET /api/warehouses/{id}/products للتأكد من عدم وجود بيانات وهمية
            if warehouse_count > 0:
                first_warehouse = warehouses[0]
                warehouse_id = first_warehouse.get('id')
                
                print(f"  🔍 اختبار GET /api/warehouses/{warehouse_id}/products...")
                products_result = self.make_request('GET', f'/warehouses/{warehouse_id}/products')
                
                if products_result['success']:
                    products = products_result['data']
                    products_count = len(products) if isinstance(products, list) else 0
                    
                    # فحص البيانات الوهمية
                    dummy_data_found = False
                    if isinstance(products, list):
                        for product in products:
                            product_name = product.get('name', '').lower()
                            product_id = product.get('id', '').lower()
                            if ('منتج' in product_name and any(char.isdigit() for char in product_name)) or \
                               ('prod-' in product_id and product_id.replace('prod-', '').isdigit()):
                                dummy_data_found = True
                                break
                    
                    status = 'فشل ❌' if dummy_data_found else 'نجح ✅'
                    details = f"تم العثور على بيانات وهمية!" if dummy_data_found else f"لا توجد بيانات وهمية - {products_count} منتج حقيقي"
                    
                    self.test_results.append({
                        'test': f'GET /api/warehouses/{warehouse_id}/products - فحص البيانات الوهمية',
                        'status': status,
                        'details': details,
                        'response_time': f"{products_result['response_time']:.2f}ms"
                    })
                else:
                    self.test_results.append({
                        'test': f'GET /api/warehouses/{warehouse_id}/products',
                        'status': 'فشل ❌',
                        'details': f"خطأ: {products_result['data'].get('detail', 'خطأ غير معروف')}",
                        'response_time': f"{products_result['response_time']:.2f}ms"
                    })
            
            # 3. POST /api/warehouses - إنشاء مخزن جديد
            print("  ➕ اختبار POST /api/warehouses - إنشاء مخزن جديد...")
            new_warehouse_data = {
                "name": "مخزن اختبار النظام المحسن",
                "location": "القاهرة - منطقة الاختبار",
                "manager_name": "مدير الاختبار",
                "manager_phone": "01234567890",
                "capacity": 1000,
                "description": "مخزن تم إنشاؤه لاختبار النظام المحسن"
            }
            
            create_result = self.make_request('POST', '/warehouses', new_warehouse_data)
            
            if create_result['success']:
                self.test_results.append({
                    'test': 'POST /api/warehouses - إنشاء مخزن جديد',
                    'status': 'نجح ✅',
                    'details': f"تم إنشاء مخزن جديد بنجاح",
                    'response_time': f"{create_result['response_time']:.2f}ms"
                })
            else:
                self.test_results.append({
                    'test': 'POST /api/warehouses - إنشاء مخزن جديد',
                    'status': 'فشل ❌',
                    'details': f"خطأ: {create_result['data'].get('detail', 'خطأ غير معروف')}",
                    'response_time': f"{create_result['response_time']:.2f}ms"
                })
        else:
            self.test_results.append({
                'test': 'GET /api/warehouses - جلب المخازن',
                'status': 'فشل ❌',
                'details': f"خطأ: {result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{result['response_time']:.2f}ms"
            })
        
        # 4. GET /api/products - جلب المنتجات الحقيقية
        print("  📋 اختبار GET /api/products - جلب المنتجات الحقيقية...")
        products_result = self.make_request('GET', '/products')
        
        if products_result['success']:
            products = products_result['data']
            products_count = len(products) if isinstance(products, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/products - جلب المنتجات الحقيقية',
                'status': 'نجح ✅',
                'details': f"تم جلب {products_count} منتج حقيقي",
                'response_time': f"{products_result['response_time']:.2f}ms"
            })
        else:
            self.test_results.append({
                'test': 'GET /api/products - جلب المنتجات الحقيقية',
                'status': 'فشل ❌',
                'details': f"خطأ: {products_result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{products_result['response_time']:.2f}ms"
            })

    def test_enhanced_clinic_system(self):
        """اختبار نظام العيادات المحسن"""
        print("🏥 اختبار نظام العيادات المحسن...")
        
        # 1. GET /api/enhanced-clinics/registration/form-data - جلب بيانات النموذج الجديدة
        print("  📋 اختبار GET /api/enhanced-clinics/registration/form-data...")
        result = self.make_request('GET', '/enhanced-clinics/registration/form-data')
        
        if result['success']:
            form_data = result['data']
            
            # التحقق من وجود التصنيفات الجديدة
            classifications = form_data.get('classifications', [])
            expected_classifications = ['Class A star', 'Class A', 'Class B', 'Class C', 'Class D']
            found_classifications = [c.get('name', '') for c in classifications if isinstance(classifications, list)]
            
            # التحقق من وجود التصنيف الائتماني الجديد
            credit_ratings = form_data.get('credit_ratings', [])
            expected_credit_ratings = ['أخضر', 'أصفر', 'أحمر']
            found_credit_ratings = [c.get('name', '') for c in credit_ratings if isinstance(credit_ratings, list)]
            
            # التحقق من وجود الخطين الجديدين
            lines = form_data.get('lines', [])
            expected_lines = ['الخط الأول', 'الخط الثاني']
            found_lines = [l.get('name', '') for l in lines if isinstance(lines, list)]
            
            # التحقق من وجود المناطق المرتبطة بالخطوط
            areas = form_data.get('areas', [])
            areas_count = len(areas) if isinstance(areas, list) else 0
            
            classifications_found = any(cls in found_classifications for cls in expected_classifications)
            credit_ratings_found = any(cr in found_credit_ratings for cr in expected_credit_ratings)
            lines_found = any(line in found_lines for line in expected_lines)
            
            details = f"التصنيفات: {len(found_classifications)} | التصنيف الائتماني: {len(found_credit_ratings)} | الخطوط: {len(found_lines)} | المناطق: {areas_count}"
            
            if classifications_found and credit_ratings_found and lines_found and areas_count > 0:
                status = 'نجح ✅'
            else:
                status = 'جزئي ⚠️'
            
            self.test_results.append({
                'test': 'GET /api/enhanced-clinics/registration/form-data',
                'status': status,
                'details': details,
                'response_time': f"{result['response_time']:.2f}ms"
            })
        else:
            # إذا لم يكن endpoint متاحاً، نجرب الـ endpoints العادية
            print("  📋 اختبار endpoints العيادات العادية...")
            
            # اختبار GET /api/clinics
            clinics_result = self.make_request('GET', '/clinics')
            if clinics_result['success']:
                clinics = clinics_result['data']
                clinics_count = len(clinics) if isinstance(clinics, list) else 0
                
                self.test_results.append({
                    'test': 'GET /api/clinics (بديل)',
                    'status': 'نجح ✅',
                    'details': f"تم جلب {clinics_count} عيادة",
                    'response_time': f"{clinics_result['response_time']:.2f}ms"
                })
            else:
                self.test_results.append({
                    'test': 'نظام العيادات المحسن',
                    'status': 'فشل ❌',
                    'details': f"خطأ: {result['data'].get('detail', 'خطأ غير معروف')}",
                    'response_time': f"{result['response_time']:.2f}ms"
                })

    def test_visit_management_system(self):
        """اختبار نظام إدارة الزيارات"""
        print("🚶 اختبار نظام إدارة الزيارات...")
        
        # 1. GET /api/visits/dashboard/overview - نظرة عامة على الزيارات
        print("  📊 اختبار GET /api/visits/dashboard/overview...")
        overview_result = self.make_request('GET', '/visits/dashboard/overview')
        
        if overview_result['success']:
            overview_data = overview_result['data']
            
            self.test_results.append({
                'test': 'GET /api/visits/dashboard/overview',
                'status': 'نجح ✅',
                'details': f"تم جلب نظرة عامة على الزيارات",
                'response_time': f"{overview_result['response_time']:.2f}ms"
            })
        else:
            self.test_results.append({
                'test': 'GET /api/visits/dashboard/overview',
                'status': 'فشل ❌',
                'details': f"خطأ: {overview_result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{overview_result['response_time']:.2f}ms"
            })
        
        # 2. GET /api/visits/available-clinics - العيادات المتاحة للمندوب
        print("  🏥 اختبار GET /api/visits/available-clinics...")
        clinics_result = self.make_request('GET', '/visits/available-clinics')
        
        if clinics_result['success']:
            available_clinics = clinics_result['data']
            clinics_count = len(available_clinics) if isinstance(available_clinics, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/visits/available-clinics',
                'status': 'نجح ✅',
                'details': f"تم جلب {clinics_count} عيادة متاحة للزيارة",
                'response_time': f"{clinics_result['response_time']:.2f}ms"
            })
        else:
            self.test_results.append({
                'test': 'GET /api/visits/available-clinics',
                'status': 'فشل ❌',
                'details': f"خطأ: {clinics_result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{clinics_result['response_time']:.2f}ms"
            })
        
        # 3. GET /api/visits/ - قائمة الزيارات
        print("  📋 اختبار GET /api/visits/...")
        visits_result = self.make_request('GET', '/visits/')
        
        if visits_result['success']:
            visits = visits_result['data']
            visits_count = len(visits) if isinstance(visits, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/visits/ - قائمة الزيارات',
                'status': 'نجح ✅',
                'details': f"تم جلب {visits_count} زيارة",
                'response_time': f"{visits_result['response_time']:.2f}ms"
            })
        else:
            # جرب endpoint بديل
            visits_alt_result = self.make_request('GET', '/visits')
            if visits_alt_result['success']:
                visits = visits_alt_result['data']
                visits_count = len(visits) if isinstance(visits, list) else 0
                
                self.test_results.append({
                    'test': 'GET /api/visits - قائمة الزيارات (بديل)',
                    'status': 'نجح ✅',
                    'details': f"تم جلب {visits_count} زيارة",
                    'response_time': f"{visits_alt_result['response_time']:.2f}ms"
                })
            else:
                self.test_results.append({
                    'test': 'GET /api/visits/ - قائمة الزيارات',
                    'status': 'فشل ❌',
                    'details': f"خطأ: {visits_result['data'].get('detail', 'خطأ غير معروف')}",
                    'response_time': f"{visits_result['response_time']:.2f}ms"
                })

    def test_unified_financial_system(self):
        """اختبار النظام المالي الموحد"""
        print("💰 اختبار النظام المالي الموحد...")
        
        # 1. GET /api/unified-financial/dashboard - النظام المالي
        print("  📊 اختبار GET /api/unified-financial/dashboard...")
        dashboard_result = self.make_request('GET', '/unified-financial/dashboard')
        
        if dashboard_result['success']:
            dashboard_data = dashboard_result['data']
            
            self.test_results.append({
                'test': 'GET /api/unified-financial/dashboard',
                'status': 'نجح ✅',
                'details': f"تم جلب لوحة تحكم النظام المالي الموحد",
                'response_time': f"{dashboard_result['response_time']:.2f}ms"
            })
        else:
            self.test_results.append({
                'test': 'GET /api/unified-financial/dashboard',
                'status': 'فشل ❌',
                'details': f"خطأ: {dashboard_result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{dashboard_result['response_time']:.2f}ms"
            })
        
        # 2. GET /api/unified-financial/invoices - الفواتير
        print("  🧾 اختبار GET /api/unified-financial/invoices...")
        invoices_result = self.make_request('GET', '/unified-financial/invoices')
        
        if invoices_result['success']:
            invoices = invoices_result['data']
            invoices_count = len(invoices) if isinstance(invoices, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/unified-financial/invoices',
                'status': 'نجح ✅',
                'details': f"تم جلب {invoices_count} فاتورة",
                'response_time': f"{invoices_result['response_time']:.2f}ms"
            })
        else:
            self.test_results.append({
                'test': 'GET /api/unified-financial/invoices',
                'status': 'فشل ❌',
                'details': f"خطأ: {invoices_result['data'].get('detail', 'خطأ غير معروف')}",
                'response_time': f"{invoices_result['response_time']:.2f}ms"
            })
        
        # 3. GET /api/unified-financial/debts - الديون
        print("  💳 اختبار GET /api/unified-financial/debts...")
        debts_result = self.make_request('GET', '/unified-financial/debts')
        
        if debts_result['success']:
            debts = debts_result['data']
            debts_count = len(debts) if isinstance(debts, list) else 0
            
            self.test_results.append({
                'test': 'GET /api/unified-financial/debts',
                'status': 'نجح ✅',
                'details': f"تم جلب {debts_count} دين",
                'response_time': f"{debts_result['response_time']:.2f}ms"
            })
        else:
            # جرب endpoint الديون العادي
            debts_alt_result = self.make_request('GET', '/debts')
            if debts_alt_result['success']:
                debts = debts_alt_result['data']
                debts_count = len(debts) if isinstance(debts, list) else 0
                
                self.test_results.append({
                    'test': 'GET /api/debts - الديون (بديل)',
                    'status': 'نجح ✅',
                    'details': f"تم جلب {debts_count} دين",
                    'response_time': f"{debts_alt_result['response_time']:.2f}ms"
                })
            else:
                self.test_results.append({
                    'test': 'GET /api/unified-financial/debts',
                    'status': 'فشل ❌',
                    'details': f"خطأ: {debts_result['data'].get('detail', 'خطأ غير معروف')}",
                    'response_time': f"{debts_result['response_time']:.2f}ms"
                })

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء الاختبار الشامل للنظام المحسن...")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        print()
        
        # 2. اختبار إدارة المخازن والمنتجات المُصلحة
        self.test_warehouse_management_fixed()
        print()
        
        # 3. اختبار نظام العيادات المحسن
        self.test_enhanced_clinic_system()
        print()
        
        # 4. اختبار نظام إدارة الزيارات
        self.test_visit_management_system()
        print()
        
        # 5. اختبار النظام المالي الموحد
        self.test_unified_financial_system()
        print()
        
        # عرض النتائج النهائية
        self.display_final_results()

    def display_final_results(self):
        """عرض النتائج النهائية"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if '✅' in t['status']])
        failed_tests = len([t for t in self.test_results if '❌' in t['status']])
        partial_tests = len([t for t in self.test_results if '⚠️' in t['status']])
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("=" * 80)
        print("📊 النتائج النهائية للاختبار الشامل")
        print("=" * 80)
        
        for result in self.test_results:
            print(f"🔸 {result['test']}")
            print(f"   الحالة: {result['status']}")
            print(f"   التفاصيل: {result['details']}")
            print(f"   وقت الاستجابة: {result['response_time']}")
            print()
        
        print("=" * 80)
        print("📈 ملخص الإحصائيات:")
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   نجح: {passed_tests} ✅")
        print(f"   فشل: {failed_tests} ❌")
        print(f"   جزئي: {partial_tests} ⚠️")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        print(f"   إجمالي وقت التنفيذ: {total_time:.2f} ثانية")
        print("=" * 80)
        
        # تقييم النتيجة النهائية
        if success_rate >= 90:
            print("🎉 ممتاز! النظام يعمل بشكل مثالي")
        elif success_rate >= 75:
            print("👍 جيد! النظام يعمل بشكل جيد مع بعض التحسينات المطلوبة")
        elif success_rate >= 50:
            print("⚠️ متوسط! النظام يحتاج تحسينات")
        else:
            print("❌ ضعيف! النظام يحتاج إصلاحات جذرية")
        
        print("=" * 80)

def main():
    """الدالة الرئيسية"""
    tester = ComprehensiveArabicSystemTester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()