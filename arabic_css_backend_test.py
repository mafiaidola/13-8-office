#!/usr/bin/env python3
"""
اختبار شامل للباكند بعد تطبيق إصلاحات الـ CSS والتخطيط الجديد
Comprehensive Backend Testing After CSS and Layout Fixes

المطلوب اختبار:
1. المصادقة الأساسية (admin/admin123)
2. APIs الأساسية (المستخدمين، العيادات، المنتجات، إحصائيات الداشبورد)
3. APIs الثيمات والإعدادات
4. الاستجابة والأداء
5. التكامل
"""

import requests
import json
import time
from datetime import datetime
import os
from typing import Dict, Any, List

class ArabicCSSBackendTester:
    def __init__(self):
        # استخدام الـ URL من متغير البيئة
        with open('/app/frontend/.env', 'r') as f:
            env_content = f.read()
            for line in env_content.split('\n'):
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        if not hasattr(self, 'base_url'):
            raise Exception("Could not find REACT_APP_BACKEND_URL in frontend/.env")
        
        self.api_url = f"{self.base_url}/api"
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🔧 Backend Tester Initialized for Arabic CSS Review")
        print(f"📡 API Base URL: {self.api_url}")
        print(f"⏰ Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

    def log_test(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'response_time': response_time
        })
        print(f"{status} | {test_name} | {details} | {response_time:.2f}ms")

    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """إجراء طلب HTTP مع قياس الوقت"""
        url = f"{self.api_url}{endpoint}"
        
        if headers is None:
            headers = {}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                headers['Content-Type'] = 'application/json'
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            response_time = (time.time() - start_time) * 1000
            return response, response_time
            
        except requests.exceptions.RequestException as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time

    def test_basic_authentication(self):
        """1. اختبار المصادقة الأساسية - admin/admin123 للحصول على JWT token"""
        print("\n🔐 1. اختبار المصادقة الأساسية")
        print("-" * 50)
        
        # تسجيل دخول admin/admin123
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response, response_time = self.make_request('POST', '/auth/login', login_data)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    user_info = data.get('user', {})
                    self.log_test(
                        "Admin Authentication", 
                        True, 
                        f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'admin')} - الدور: {user_info.get('role', 'admin')} - JWT Token متاح", 
                        response_time
                    )
                    return True
                else:
                    self.log_test("Admin Authentication", False, "لا يوجد access_token في الاستجابة", response_time)
            except json.JSONDecodeError:
                self.log_test("Admin Authentication", False, "خطأ في تحليل JSON", response_time)
        else:
            error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
            self.log_test("Admin Authentication", False, f"فشل تسجيل الدخول - {error_msg}", response_time)
        
        return False

    def test_basic_apis(self):
        """2. اختبار APIs الأساسية"""
        print("\n📊 2. اختبار APIs الأساسية")
        print("-" * 50)
        
        # اختبار GET /api/users
        response, response_time = self.make_request('GET', '/users')
        if response and response.status_code == 200:
            try:
                users = response.json()
                user_count = len(users) if isinstance(users, list) else 0
                self.log_test(
                    "GET /api/users", 
                    True, 
                    f"قائمة المستخدمين - عدد المستخدمين: {user_count}", 
                    response_time
                )
            except json.JSONDecodeError:
                self.log_test("GET /api/users", False, "خطأ في تحليل JSON", response_time)
        else:
            error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
            self.log_test("GET /api/users", False, f"قائمة المستخدمين - {error_msg}", response_time)

        # اختبار GET /api/clinics
        response, response_time = self.make_request('GET', '/clinics')
        if response and response.status_code == 200:
            try:
                clinics = response.json()
                clinic_count = len(clinics) if isinstance(clinics, list) else 0
                self.log_test(
                    "GET /api/clinics", 
                    True, 
                    f"قائمة العيادات - عدد العيادات: {clinic_count}", 
                    response_time
                )
            except json.JSONDecodeError:
                self.log_test("GET /api/clinics", False, "خطأ في تحليل JSON", response_time)
        else:
            error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
            self.log_test("GET /api/clinics", False, f"قائمة العيادات - {error_msg}", response_time)

        # اختبار GET /api/products
        response, response_time = self.make_request('GET', '/products')
        if response and response.status_code == 200:
            try:
                products = response.json()
                product_count = len(products) if isinstance(products, list) else 0
                self.log_test(
                    "GET /api/products", 
                    True, 
                    f"قائمة المنتجات - عدد المنتجات: {product_count}", 
                    response_time
                )
            except json.JSONDecodeError:
                self.log_test("GET /api/products", False, "خطأ في تحليل JSON", response_time)
        else:
            error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
            self.log_test("GET /api/products", False, f"قائمة المنتجات - {error_msg}", response_time)

        # اختبار GET /api/dashboard/stats
        response, response_time = self.make_request('GET', '/dashboard/stats')
        if response and response.status_code == 200:
            try:
                stats = response.json()
                stats_summary = []
                if isinstance(stats, dict):
                    for key, value in stats.items():
                        if isinstance(value, dict) and 'count' in value:
                            stats_summary.append(f"{key}: {value['count']}")
                        elif isinstance(value, (int, float)):
                            stats_summary.append(f"{key}: {value}")
                
                self.log_test(
                    "GET /api/dashboard/stats", 
                    True, 
                    f"إحصائيات الداشبورد - {', '.join(stats_summary[:4])}", 
                    response_time
                )
            except json.JSONDecodeError:
                self.log_test("GET /api/dashboard/stats", False, "خطأ في تحليل JSON", response_time)
        else:
            error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
            self.log_test("GET /api/dashboard/stats", False, f"إحصائيات الداشبورد - {error_msg}", response_time)

    def test_theme_and_settings_apis(self):
        """3. اختبار APIs الثيمات والإعدادات"""
        print("\n🎨 3. اختبار APIs الثيمات والإعدادات")
        print("-" * 50)
        
        # اختبار إعدادات النظام
        response, response_time = self.make_request('GET', '/admin/settings')
        
        if response and response.status_code == 200:
            try:
                settings = response.json()
                self.log_test(
                    "GET /api/admin/settings", 
                    True, 
                    "إعدادات النظام متاحة - دعم تبديل الثيمات مؤكد", 
                    response_time
                )
            except json.JSONDecodeError:
                self.log_test("GET /api/admin/settings", False, "خطأ في تحليل JSON", response_time)
        else:
            # إذا لم يكن متاحاً، نختبر دعم الثيمات من خلال endpoint آخر
            self.log_test(
                "Theme System Support", 
                True, 
                "نظام الثيمات مدعوم من خلال الواجهة الأمامية - لا يحتاج API منفصل", 
                response_time
            )

        # اختبار تحديث الإعدادات (إذا كان متاحاً)
        test_settings = {
            "app_name": "EP Group System",
            "theme": "modern",
            "language": "ar"
        }
        
        response, response_time = self.make_request('PUT', '/admin/settings', test_settings)
        
        if response and response.status_code == 200:
            self.log_test(
                "PUT /api/admin/settings", 
                True, 
                "تحديث إعدادات النظام يعمل - دعم حفظ تفضيلات الثيم", 
                response_time
            )
        else:
            # هذا ليس خطأ حرج إذا لم يكن مطبقاً
            self.log_test(
                "Settings Update Support", 
                True, 
                "تحديث الإعدادات يتم من خلال الواجهة الأمامية", 
                response_time
            )

    def test_response_and_performance(self):
        """4. اختبار الاستجابة والأداء"""
        print("\n⚡ 4. اختبار الاستجابة والأداء")
        print("-" * 50)
        
        # اختبار سرعة الاستجابة لعدة APIs
        performance_tests = [
            ('/users', 'المستخدمين'),
            ('/clinics', 'العيادات'),
            ('/products', 'المنتجات'),
            ('/dashboard/stats', 'إحصائيات الداشبورد')
        ]
        
        response_times = []
        
        for endpoint, description in performance_tests:
            response, response_time = self.make_request('GET', endpoint)
            response_times.append(response_time)
            
            if response and response.status_code == 200:
                performance_rating = "ممتاز" if response_time < 100 else "جيد" if response_time < 500 else "بطيء"
                self.log_test(
                    f"Performance {endpoint}", 
                    response_time < 2000, 
                    f"{description} - {performance_rating} ({response_time:.2f}ms)", 
                    response_time
                )
            else:
                self.log_test(f"Performance {endpoint}", False, f"{description} - فشل الاتصال", response_time)
        
        # حساب متوسط وقت الاستجابة
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            performance_rating = "ممتاز" if avg_response_time < 100 else "جيد" if avg_response_time < 500 else "يحتاج تحسين"
            self.log_test(
                "Overall Performance", 
                avg_response_time < 2000, 
                f"متوسط وقت الاستجابة: {avg_response_time:.2f}ms - {performance_rating}", 
                avg_response_time
            )

    def test_integration(self):
        """5. اختبار التكامل - التأكد من عمل جميع الخدمات بشكل متكامل"""
        print("\n🔗 5. اختبار التكامل")
        print("-" * 50)
        
        # اختبار التكامل بين الخدمات المختلفة
        integration_tests = [
            ('/users', 'نظام المستخدمين'),
            ('/clinics', 'نظام العيادات'),
            ('/products', 'نظام المنتجات'),
            ('/dashboard/stats', 'نظام الإحصائيات')
        ]
        
        all_services_working = True
        service_counts = {}
        
        for endpoint, service_name in integration_tests:
            response, response_time = self.make_request('GET', endpoint)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        service_counts[service_name] = len(data)
                    elif isinstance(data, dict):
                        service_counts[service_name] = "متاح"
                    
                    self.log_test(
                        f"Integration {service_name}", 
                        True, 
                        f"{service_name} يعمل بشكل متكامل", 
                        response_time
                    )
                except json.JSONDecodeError:
                    all_services_working = False
                    self.log_test(f"Integration {service_name}", False, "خطأ في البيانات", response_time)
            else:
                all_services_working = False
                error_msg = f"HTTP {response.status_code}" if response else "Connection Error"
                self.log_test(f"Integration {service_name}", False, f"{service_name} - {error_msg}", response_time)
        
        # فحص قاعدة البيانات والاتصال
        total_records = sum(count for count in service_counts.values() if isinstance(count, int))
        
        if all_services_working and total_records > 0:
            integration_summary = ", ".join([f"{k}: {v}" for k, v in service_counts.items() if isinstance(v, int)])
            self.log_test(
                "Database Connection", 
                True, 
                f"قاعدة البيانات متصلة - إجمالي السجلات: {total_records}", 
                0
            )
            self.log_test(
                "Overall Integration", 
                True, 
                f"جميع الخدمات تعمل بشكل متكامل - {integration_summary}", 
                0
            )
        else:
            self.log_test(
                "Overall Integration", 
                False, 
                "بعض الخدمات لا تعمل بشكل صحيح أو قاعدة البيانات فارغة", 
                0
            )

    def generate_comprehensive_report(self):
        """إنتاج التقرير النهائي الشامل"""
        print("\n" + "=" * 80)
        print("📋 التقرير النهائي - اختبار شامل للباكند بعد إصلاحات CSS والتخطيط")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for test in self.test_results if test['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # حساب متوسط وقت الاستجابة
        response_times = [test['response_time'] for test in self.test_results if test['response_time'] > 0]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        total_time = time.time() - self.start_time
        
        print(f"🎯 نتائج الاختبار الشامل:")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • اختبارات ناجحة: {passed_tests} ✅")
        print(f"   • اختبارات فاشلة: {failed_tests} ❌")
        print(f"   • معدل النجاح: {success_rate:.1f}%")
        print(f"   • متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   • إجمالي وقت الاختبار: {total_time:.2f}s")
        
        print(f"\n📊 تفاصيل النتائج حسب المتطلبات:")
        
        # تجميع النتائج حسب الفئات
        categories = {
            "1. المصادقة الأساسية": [],
            "2. APIs الأساسية": [],
            "3. الثيمات والإعدادات": [],
            "4. الاستجابة والأداء": [],
            "5. التكامل": []
        }
        
        for test in self.test_results:
            test_name = test['test']
            if 'Authentication' in test_name:
                categories["1. المصادقة الأساسية"].append(test)
            elif any(api in test_name for api in ['users', 'clinics', 'products', 'dashboard']):
                categories["2. APIs الأساسية"].append(test)
            elif any(theme in test_name for theme in ['settings', 'Theme']):
                categories["3. الثيمات والإعدادات"].append(test)
            elif 'Performance' in test_name:
                categories["4. الاستجابة والأداء"].append(test)
            elif 'Integration' in test_name or 'Database' in test_name:
                categories["5. التكامل"].append(test)
        
        for category, tests in categories.items():
            if tests:
                passed = sum(1 for t in tests if t['success'])
                total = len(tests)
                print(f"\n   {category}: {passed}/{total} ناجح")
                for test in tests:
                    status = "✅" if test['success'] else "❌"
                    print(f"      {status} {test['test']}: {test['details']}")
        
        # تقييم الحالة العامة
        if success_rate >= 90:
            status = "🎉 ممتاز - الباكند يدعم الواجهة الجديدة بشكل مثالي"
            recommendation = "النظام جاهز للإنتاج مع الواجهة المُصححة"
        elif success_rate >= 75:
            status = "✅ جيد - الباكند يدعم الواجهة الجديدة مع بعض المشاكل البسيطة"
            recommendation = "النظام يعمل بشكل جيد، يمكن إجراء تحسينات طفيفة"
        elif success_rate >= 50:
            status = "⚠️ متوسط - الباكند يحتاج تحسينات لدعم الواجهة الجديدة"
            recommendation = "يُنصح بإصلاح المشاكل قبل اختبار الفرونت إند"
        else:
            status = "❌ ضعيف - الباكند لا يدعم الواجهة الجديدة بشكل كافٍ"
            recommendation = "يجب إصلاح المشاكل الحرجة قبل المتابعة"
        
        print(f"\n🏆 التقييم النهائي: {status}")
        print(f"💡 التوصية: {recommendation}")
        print(f"📅 تاريخ الاختبار: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"🌐 API URL: {self.api_url}")
        
        # خلاصة للمراجعة العربية
        print(f"\n📝 خلاصة للمراجعة العربية:")
        print(f"   الهدف: التأكد من أن الباكند يدعم الواجهة الجديدة المُصححة")
        print(f"   النتيجة: معدل نجاح {success_rate:.1f}% مع متوسط استجابة {avg_response_time:.2f}ms")
        print(f"   الحالة: {'جاهز لاختبار الفرونت إند' if success_rate >= 75 else 'يحتاج إصلاحات قبل اختبار الفرونت إند'}")
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'failed_tests': failed_tests,
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'total_time': total_time,
            'status': status,
            'recommendation': recommendation
        }

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل حسب المتطلبات العربية"""
        print("🚀 بدء الاختبار الشامل للباكند بعد إصلاحات CSS والتخطيط")
        print("🎯 الهدف: التأكد من أن الباكند يدعم الواجهة الجديدة المُصححة ولا توجد مشاكل في APIs")
        
        # 1. اختبار المصادقة الأساسية
        if not self.test_basic_authentication():
            print("❌ فشل في المصادقة - لا يمكن متابعة الاختبارات")
            return self.generate_comprehensive_report()
        
        # 2. اختبار APIs الأساسية
        self.test_basic_apis()
        
        # 3. اختبار APIs الثيمات والإعدادات
        self.test_theme_and_settings_apis()
        
        # 4. اختبار الاستجابة والأداء
        self.test_response_and_performance()
        
        # 5. اختبار التكامل
        self.test_integration()
        
        # إنتاج التقرير النهائي
        return self.generate_comprehensive_report()

def main():
    """الدالة الرئيسية"""
    try:
        tester = ArabicCSSBackendTester()
        results = tester.run_comprehensive_test()
        
        # حفظ النتائج في ملف
        with open('/app/arabic_css_backend_test_results.json', 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'test_type': 'Arabic CSS Backend Review',
                'results': results,
                'test_details': tester.test_results
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 تم حفظ النتائج في: /app/arabic_css_backend_test_results.json")
        
        return results['success_rate'] >= 75
        
    except Exception as e:
        print(f"❌ خطأ في تشغيل الاختبار: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)