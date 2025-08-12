#!/usr/bin/env python3
"""
اختبار محسن للتأكد من حل مشاكل التوافق وعمل APIs الجديدة
Improved test to ensure compatibility issues are resolved and new APIs work
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://medmanage-pro-1.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "admin",
    "password": "admin123"
}

class ImprovedCompatibilityTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = None
        self.real_clinic_id = None
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        self.start_time = time.time()
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method: str, endpoint: str, data: dict = None, description: str = ""):
        """تنفيذ طلب HTTP مع معالجة الأخطاء"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
            
        start_time = time.time()
        
        try:
            if method.upper() == 'GET':
                async with self.session.get(url, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    
                    success = response.status == 200
                    self.test_results.append({
                        'endpoint': endpoint,
                        'method': method,
                        'status_code': response.status,
                        'success': success,
                        'response_time': response_time,
                        'description': description,
                        'data_preview': str(response_data)[:200] if success else f"Error: {response_data}"
                    })
                    
                    return success, response_data, response_time
                    
            elif method.upper() == 'POST':
                async with self.session.post(url, headers=headers, json=data) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    
                    success = response.status in [200, 201]
                    self.test_results.append({
                        'endpoint': endpoint,
                        'method': method,
                        'status_code': response.status,
                        'success': success,
                        'response_time': response_time,
                        'description': description,
                        'data_preview': str(response_data)[:200] if success else f"Error: {response_data}"
                    })
                    
                    return success, response_data, response_time
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.test_results.append({
                'endpoint': endpoint,
                'method': method,
                'status_code': 0,
                'success': False,
                'response_time': response_time,
                'description': description,
                'data_preview': f"Exception: {str(e)}"
            })
            return False, {"error": str(e)}, response_time
            
    async def test_admin_login(self):
        """1. تسجيل الدخول admin/admin123"""
        print("🔐 اختبار تسجيل الدخول admin/admin123...")
        
        success, response, response_time = await self.make_request(
            'POST', '/auth/login', 
            TEST_CREDENTIALS,
            "تسجيل دخول المدير"
        )
        
        if success and 'access_token' in response:
            self.auth_token = response['access_token']
            user_info = response.get('user', {})
            print(f"✅ تسجيل دخول ناجح ({response_time:.2f}ms)")
            print(f"   المستخدم: {user_info.get('full_name', 'Unknown')}")
            print(f"   الدور: {user_info.get('role', 'Unknown')}")
            return True
        else:
            print(f"❌ فشل تسجيل الدخول: {response}")
            return False
            
    async def get_real_clinic_id(self):
        """الحصول على معرف عيادة حقيقي"""
        print("🏥 البحث عن عيادة حقيقية للاختبار...")
        success, response, response_time = await self.make_request('GET', '/clinics', description='جلب العيادات')
        
        if success and isinstance(response, list) and len(response) > 0:
            self.real_clinic_id = response[0]['id']
            clinic_name = response[0].get('name', 'Unknown')
            print(f"✅ تم العثور على عيادة: {clinic_name} (ID: {self.real_clinic_id})")
            return True
        else:
            print("❌ لم يتم العثور على عيادات")
            return False
            
    async def test_compatibility_apis(self):
        """2. اختبار APIs التوافق الجديدة"""
        print("\n🔄 اختبار APIs التوافق الجديدة...")
        
        compatibility_tests = [
            ('/areas', 'GET', 'جلب المناطق للتوافق مع المكونات القديمة'),
            ('/lines', 'GET', 'جلب الخطوط للتوافق مع المكونات القديمة'),
            ('/admin/settings', 'GET', 'إعدادات المدير')
        ]
        
        compatibility_results = []
        
        for endpoint, method, description in compatibility_tests:
            print(f"   🧪 اختبار {endpoint}...")
            success, response, response_time = await self.make_request(method, endpoint, description=description)
            
            if success:
                data_count = 0
                if isinstance(response, list):
                    data_count = len(response)
                elif isinstance(response, dict):
                    if 'data' in response and isinstance(response['data'], list):
                        data_count = len(response['data'])
                    elif 'areas' in response and isinstance(response['areas'], list):
                        data_count = len(response['areas'])
                    elif 'lines' in response and isinstance(response['lines'], list):
                        data_count = len(response['lines'])
                    else:
                        data_count = len(response.keys())
                
                print(f"   ✅ {endpoint} يعمل ({response_time:.2f}ms) - {data_count} عنصر")
                compatibility_results.append(True)
            else:
                print(f"   ❌ {endpoint} فشل ({response_time:.2f}ms): {response}")
                compatibility_results.append(False)
                
        return compatibility_results
        
    async def test_enhanced_component_apis(self):
        """3. اختبار APIs المكونات المتقدمة"""
        print("\n🚀 اختبار APIs المكونات المتقدمة...")
        
        enhanced_tests = [
            ('/enhanced-users/with-statistics', 'GET', 'إدارة المستخدمين الاحترافية'),
            ('/enhanced-lines-areas/lines', 'GET', 'إدارة الخطوط والمناطق المحسنة'),
        ]
        
        enhanced_results = []
        
        for endpoint, method, description in enhanced_tests:
            print(f"   🧪 اختبار {endpoint}...")
            success, response, response_time = await self.make_request(method, endpoint, description=description)
            
            if success:
                data_count = 0
                if isinstance(response, list):
                    data_count = len(response)
                elif isinstance(response, dict):
                    if 'users' in response and isinstance(response['users'], list):
                        data_count = len(response['users'])
                    elif 'lines' in response and isinstance(response['lines'], list):
                        data_count = len(response['lines'])
                    else:
                        data_count = len(response.keys())
                
                print(f"   ✅ {endpoint} يعمل ({response_time:.2f}ms) - {data_count} عنصر")
                enhanced_results.append(True)
            else:
                print(f"   ❌ {endpoint} فشل ({response_time:.2f}ms): {response}")
                enhanced_results.append(False)
                
        # Test clinic profile with real clinic ID
        if self.real_clinic_id:
            print(f"   🧪 اختبار /clinic-profile/{self.real_clinic_id}/overview...")
            success, response, response_time = await self.make_request(
                'GET', f'/clinic-profile/{self.real_clinic_id}/overview', 
                description='ملف العيادة التفصيلي'
            )
            
            if success:
                print(f"   ✅ clinic-profile يعمل ({response_time:.2f}ms)")
                enhanced_results.append(True)
            else:
                print(f"   ❌ clinic-profile فشل ({response_time:.2f}ms): {response}")
                enhanced_results.append(False)
        else:
            print(f"   ⚠️ تخطي اختبار clinic-profile - لا يوجد معرف عيادة")
            enhanced_results.append(False)
                
        return enhanced_results
        
    async def test_available_accounting_apis(self):
        """4. اختبار APIs المحاسبة المتاحة"""
        print("\n💰 اختبار APIs المحاسبة المتاحة...")
        
        # Test available financial endpoints
        financial_tests = [
            ('/invoices', 'GET', 'إدارة الفواتير الأساسية'),
            ('/debts', 'GET', 'إدارة الديون الأساسية'),
            ('/payments', 'GET', 'إدارة المدفوعات الأساسية'),
            ('/invoices/statistics/overview', 'GET', 'إحصائيات الفواتير'),
            ('/debts/statistics/overview', 'GET', 'إحصائيات الديون')
        ]
        
        accounting_results = []
        
        for endpoint, method, description in financial_tests:
            print(f"   🧪 اختبار {endpoint}...")
            success, response, response_time = await self.make_request(method, endpoint, description=description)
            
            if success:
                data_count = 0
                if isinstance(response, list):
                    data_count = len(response)
                elif isinstance(response, dict):
                    if 'invoices' in response and isinstance(response['invoices'], list):
                        data_count = len(response['invoices'])
                    elif 'debts' in response and isinstance(response['debts'], list):
                        data_count = len(response['debts'])
                    else:
                        data_count = len(response.keys())
                
                print(f"   ✅ {endpoint} يعمل ({response_time:.2f}ms) - {data_count} عنصر")
                accounting_results.append(True)
            else:
                print(f"   ❌ {endpoint} فشل ({response_time:.2f}ms): {response}")
                accounting_results.append(False)
                
        return accounting_results
        
    async def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result['success'])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result['response_time'] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print(f"\n{'='*80}")
        print(f"📊 التقرير النهائي المحسن - اختبار APIs التوافق والمكونات المتقدمة")
        print(f"{'='*80}")
        print(f"🎯 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📋 تفاصيل النتائج:")
        for i, result in enumerate(self.test_results, 1):
            status = "✅" if result['success'] else "❌"
            print(f"   {i:2d}. {status} {result['method']} {result['endpoint']}")
            print(f"       {result['description']} ({result['response_time']:.2f}ms)")
            if not result['success']:
                print(f"       خطأ: {result['data_preview']}")
        
        # تقييم الهدف
        if success_rate >= 95.0:
            print(f"\n🏆 ممتاز! تم تحقيق الهدف: {success_rate:.1f}% ≥ 95%")
            print("✅ جميع مشاكل التوافق تم حلها والـ APIs الجديدة تعمل بنجاح")
        elif success_rate >= 85.7:
            print(f"\n🎯 جيد جداً! تحسن من 85.7% إلى {success_rate:.1f}%")
            remaining_issues = total_tests - successful_tests
            print(f"⚠️ يتبقى {remaining_issues} مشكلة بسيطة لتحقيق الهدف 95%")
        else:
            print(f"\n⚠️ يحتاج تحسين: {success_rate:.1f}% أقل من الهدف 95%")
            
        return success_rate, successful_tests, total_tests

async def main():
    """تشغيل الاختبار المحسن"""
    print("🚀 بدء الاختبار المحسن للتأكد من حل مشاكل التوافق وعمل APIs الجديدة")
    print("="*80)
    
    tester = ImprovedCompatibilityTester()
    
    try:
        await tester.setup_session()
        
        # 1. تسجيل الدخول
        login_success = await tester.test_admin_login()
        if not login_success:
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return
            
        # 2. الحصول على معرف عيادة حقيقي
        await tester.get_real_clinic_id()
            
        # 3. اختبار APIs التوافق
        compatibility_results = await tester.test_compatibility_apis()
        
        # 4. اختبار APIs المكونات المتقدمة
        enhanced_results = await tester.test_enhanced_component_apis()
        
        # 5. اختبار APIs المحاسبة المتاحة
        accounting_results = await tester.test_available_accounting_apis()
        
        # 6. التقرير النهائي
        success_rate, successful_tests, total_tests = await tester.generate_final_report()
        
        # تحليل النتائج حسب الفئات
        print(f"\n📈 تحليل النتائج حسب الفئات:")
        print(f"   🔄 APIs التوافق: {sum(compatibility_results)}/{len(compatibility_results)} نجح")
        print(f"   🚀 APIs المكونات المتقدمة: {sum(enhanced_results)}/{len(enhanced_results)} نجح") 
        print(f"   💰 APIs المحاسبة المتاحة: {sum(accounting_results)}/{len(accounting_results)} نجح")
        
    except Exception as e:
        print(f"❌ خطأ في تشغيل الاختبار: {str(e)}")
        
    finally:
        await tester.cleanup_session()

if __name__ == "__main__":
    asyncio.run(main())