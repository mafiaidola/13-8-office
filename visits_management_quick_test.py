#!/usr/bin/env python3
"""
اختبار سريع لـ APIs إدارة الزيارات المطلوبة لحل مشكلة "خطأ في تحميل المكون"
Quick test for Visits Management APIs to resolve "Component loading error" issue

المطلوب حسب المراجعة العربية:
1) تسجيل دخول admin/admin123
2) اختبار GET /api/visits - قائمة الزيارات
3) اختبار GET /api/visits/dashboard - بيانات لوحة التحكم للزيارات  
4) اختبار GET /api/visits/statistics - إحصائيات الزيارات
5) التحقق من أن endpoints الزيارات تعمل بدون مشاكل

الهدف: التأكد من أن مشكلة "خطأ في تحميل المكون" ليست بسبب APIs مفقودة أو معطلة للزيارات
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://medmanage-pro-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class VisitsManagementQuickTest:
    def __init__(self):
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method: str, endpoint: str, data: dict = None, use_auth: bool = True):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{API_BASE}{endpoint}"
        headers = {}
        
        if use_auth and self.jwt_token:
            headers['Authorization'] = f'Bearer {self.jwt_token}'
            
        try:
            start_time = time.time()
            
            if method.upper() == 'GET':
                async with self.session.get(url, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return {
                        'status_code': response.status,
                        'data': response_data,
                        'response_time': response_time,
                        'success': response.status < 400
                    }
            elif method.upper() == 'POST':
                async with self.session.post(url, json=data, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return {
                        'status_code': response.status,
                        'data': response_data,
                        'response_time': response_time,
                        'success': response.status < 400
                    }
                    
        except Exception as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'response_time': 0,
                'success': False
            }
    
    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'response_time': response_time,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_icon = "✅" if success else "❌"
        time_info = f"({response_time:.2f}ms)" if response_time > 0 else ""
        print(f"{status_icon} {test_name}: {details} {time_info}")
        
    async def test_admin_login(self):
        """اختبار 1: تسجيل دخول admin/admin123"""
        print("\n🔐 اختبار 1: تسجيل دخول admin/admin123")
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        result = await self.make_request('POST', '/auth/login', login_data, use_auth=False)
        
        if result['success'] and 'access_token' in result['data']:
            self.jwt_token = result['data']['access_token']
            user_info = result['data'].get('user', {})
            details = f"تسجيل دخول ناجح - المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
            self.log_test_result("Admin Login", True, details, result['response_time'])
            return True
        else:
            error_msg = result['data'].get('detail', 'Unknown error') if isinstance(result['data'], dict) else str(result['data'])
            self.log_test_result("Admin Login", False, f"فشل تسجيل الدخول: {error_msg}", result['response_time'])
            return False
    
    async def test_visits_list_endpoint(self):
        """اختبار 2: GET /api/visits - قائمة الزيارات"""
        print("\n📋 اختبار 2: GET /api/visits - قائمة الزيارات")
        
        result = await self.make_request('GET', '/visits/')
        
        if result['success']:
            visits_data = result['data']
            if isinstance(visits_data, dict) and 'visits' in visits_data:
                visits_list = visits_data['visits']
                visits_count = len(visits_list)
                details = f"تم جلب قائمة الزيارات بنجاح - العدد: {visits_count} زيارة"
                self.log_test_result("GET /api/visits", True, details, result['response_time'])
                
                # عرض تفاصيل بعض الزيارات إذا كانت متوفرة
                if visits_count > 0:
                    sample_visit = visits_list[0]
                    visit_details = f"مثال زيارة: ID={sample_visit.get('id', 'N/A')}, العيادة={sample_visit.get('clinic_name', 'N/A')}, التاريخ={sample_visit.get('scheduled_date', 'N/A')}"
                    print(f"   📝 {visit_details}")
                else:
                    print(f"   ℹ️ لا توجد زيارات مسجلة في النظام")
                    
                return True
            else:
                details = f"تنسيق البيانات غير متوقع - نوع البيانات: {type(visits_data)}"
                self.log_test_result("GET /api/visits", False, details, result['response_time'])
                return False
        else:
            error_msg = result['data'].get('detail', 'Unknown error') if isinstance(result['data'], dict) else str(result['data'])
            details = f"فشل في جلب قائمة الزيارات - HTTP {result['status_code']}: {error_msg}"
            self.log_test_result("GET /api/visits", False, details, result['response_time'])
            return False
    
    async def test_visits_dashboard_endpoint(self):
        """اختبار 3: GET /api/visits/dashboard/overview - بيانات لوحة التحكم للزيارات"""
        print("\n📊 اختبار 3: GET /api/visits/dashboard/overview - بيانات لوحة التحكم للزيارات")
        
        result = await self.make_request('GET', '/visits/dashboard/overview')
        
        if result['success']:
            dashboard_data = result['data']
            if isinstance(dashboard_data, dict):
                # Check if it has the expected structure
                if 'overview' in dashboard_data:
                    overview = dashboard_data['overview']
                    today_stats = overview.get('today', {})
                    week_stats = overview.get('this_week', {})
                    
                    details = f"بيانات لوحة التحكم متاحة - اليوم: {today_stats.get('total_visits', 0)} زيارة, الأسبوع: {week_stats.get('total_visits', 0)} زيارة"
                    
                    # عرض تفاصيل إضافية
                    if 'available_clinics' in overview:
                        clinics_count = len(overview['available_clinics'])
                        print(f"   🏥 العيادات المتاحة: {clinics_count}")
                    
                    if 'upcoming_visits' in overview:
                        upcoming_count = len(overview['upcoming_visits'])
                        print(f"   📅 الزيارات القادمة: {upcoming_count}")
                else:
                    # Handle direct response structure
                    success = dashboard_data.get('success', False)
                    if success:
                        details = f"بيانات لوحة التحكم متاحة - المفاتيح: {list(dashboard_data.keys())}"
                    else:
                        details = f"استجابة لوحة التحكم - نوع البيانات: {type(dashboard_data)}, المفاتيح: {len(dashboard_data.keys())}"
                
                self.log_test_result("GET /api/visits/dashboard/overview", True, details, result['response_time'])
                return True
            else:
                details = f"تنسيق بيانات لوحة التحكم غير متوقع - نوع البيانات: {type(dashboard_data)}"
                self.log_test_result("GET /api/visits/dashboard/overview", False, details, result['response_time'])
                return False
        else:
            error_msg = result['data'].get('detail', 'Unknown error') if isinstance(result['data'], dict) else str(result['data'])
            details = f"فشل في جلب بيانات لوحة التحكم - HTTP {result['status_code']}: {error_msg}"
            self.log_test_result("GET /api/visits/dashboard/overview", False, details, result['response_time'])
            return False
    
    async def test_visits_statistics_endpoint(self):
        """اختبار 4: GET /api/visits/stats/representatives - إحصائيات الزيارات"""
        print("\n📈 اختبار 4: GET /api/visits/stats/representatives - إحصائيات الزيارات")
        
        result = await self.make_request('GET', '/visits/stats/representatives')
        
        if result['success']:
            stats_data = result['data']
            if isinstance(stats_data, dict) and 'representatives_stats' in stats_data:
                reps_stats = stats_data['representatives_stats']
                reps_count = len(reps_stats)
                
                details = f"إحصائيات المناديب متاحة - عدد المناديب: {reps_count}"
                self.log_test_result("GET /api/visits/stats/representatives", True, details, result['response_time'])
                
                # عرض إحصائيات إضافية
                if reps_count > 0:
                    sample_rep = reps_stats[0]
                    rep_details = f"مثال مندوب: {sample_rep.get('representative_name', 'N/A')}, الزيارات: {sample_rep.get('total_visits', 0)}, معدل الإنجاز: {sample_rep.get('completion_rate', 0):.1f}%"
                    print(f"   👤 {rep_details}")
                
                time_filter = stats_data.get('time_filter', 'month')
                print(f"   📅 فترة الإحصائيات: {time_filter}")
                    
                return True
            else:
                details = f"تنسيق بيانات الإحصائيات غير متوقع - نوع البيانات: {type(stats_data)}"
                self.log_test_result("GET /api/visits/stats/representatives", False, details, result['response_time'])
                return False
        else:
            error_msg = result['data'].get('detail', 'Unknown error') if isinstance(result['data'], dict) else str(result['data'])
            details = f"فشل في جلب إحصائيات الزيارات - HTTP {result['status_code']}: {error_msg}"
            self.log_test_result("GET /api/visits/stats/representatives", False, details, result['response_time'])
            return False
    
    async def test_additional_visits_endpoints(self):
        """اختبار 5: endpoints إضافية للزيارات"""
        print("\n🔍 اختبار 5: endpoints إضافية للزيارات")
        
        additional_endpoints = [
            '/visits/dashboard/overview',
            '/visits/available-clinics',
            '/visits/stats/representatives'
        ]
        
        additional_results = []
        
        for endpoint in additional_endpoints:
            result = await self.make_request('GET', endpoint)
            endpoint_name = endpoint.split('/')[-1]
            
            if result['success']:
                data_info = f"متاح - نوع البيانات: {type(result['data'])}"
                if isinstance(result['data'], list):
                    data_info += f", العدد: {len(result['data'])}"
                elif isinstance(result['data'], dict):
                    data_info += f", المفاتيح: {len(result['data'].keys())}"
                    
                self.log_test_result(f"GET /api{endpoint}", True, data_info, result['response_time'])
                additional_results.append(True)
            else:
                error_msg = result['data'].get('detail', 'Unknown error') if isinstance(result['data'], dict) else str(result['data'])
                details = f"غير متاح - HTTP {result['status_code']}: {error_msg}"
                self.log_test_result(f"GET /api{endpoint}", False, details, result['response_time'])
                additional_results.append(False)
        
        return any(additional_results)  # نجح إذا نجح أي endpoint إضافي
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result['success'])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result['response_time'] for result in self.test_results if result['response_time'] > 0) / max(1, len([r for r in self.test_results if r['response_time'] > 0]))
        
        print(f"\n" + "="*80)
        print(f"🎯 **تقرير اختبار APIs إدارة الزيارات النهائي**")
        print(f"="*80)
        print(f"📊 **النتائج الإجمالية:**")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • الاختبارات الناجحة: {successful_tests}")
        print(f"   • معدل النجاح: {success_rate:.1f}%")
        print(f"   • متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"   • إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📋 **تفاصيل الاختبارات:**")
        for i, result in enumerate(self.test_results, 1):
            status_icon = "✅" if result['success'] else "❌"
            time_info = f"({result['response_time']:.2f}ms)" if result['response_time'] > 0 else ""
            print(f"   {i}. {status_icon} {result['test_name']}: {result['details']} {time_info}")
        
        # تحليل المشاكل المكتشفة
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n⚠️ **المشاكل المكتشفة:**")
            for failed_test in failed_tests:
                print(f"   • {failed_test['test_name']}: {failed_test['details']}")
        
        # التوصيات
        print(f"\n🎯 **التقييم النهائي:**")
        if success_rate >= 80:
            print(f"   🟢 **ممتاز** - معدل النجاح {success_rate:.1f}% يشير إلى أن APIs الزيارات تعمل بشكل جيد")
            print(f"   ✅ مشكلة 'خطأ في تحميل المكون' على الأرجح ليست بسبب APIs الزيارات")
        elif success_rate >= 60:
            print(f"   🟡 **جيد** - معدل النجاح {success_rate:.1f}% يشير إلى وجود بعض المشاكل البسيطة")
            print(f"   ⚠️ قد تكون هناك مشاكل جزئية في APIs الزيارات تحتاج إصلاح")
        else:
            print(f"   🔴 **يحتاج إصلاح** - معدل النجاح {success_rate:.1f}% يشير إلى مشاكل جوهرية")
            print(f"   ❌ مشكلة 'خطأ في تحميل المكون' قد تكون بسبب APIs الزيارات المعطلة")
        
        print(f"\n🔧 **التوصيات للمطور الرئيسي:**")
        if success_rate >= 80:
            print(f"   1. APIs الزيارات تعمل بشكل جيد - ابحث عن المشكلة في الواجهة الأمامية")
            print(f"   2. تحقق من مكونات React وطلبات API في الواجهة الأمامية")
            print(f"   3. فحص console errors في المتصفح")
        else:
            print(f"   1. إصلاح APIs الزيارات المعطلة أولاً")
            print(f"   2. التأكد من تطبيق جميع routes الزيارات في server.py")
            print(f"   3. فحص قاعدة البيانات والتأكد من وجود بيانات الزيارات")
        
        return {
            'total_tests': total_tests,
            'successful_tests': successful_tests,
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'total_time': total_time,
            'recommendation': 'good' if success_rate >= 80 else 'needs_fix' if success_rate < 60 else 'partial_issues'
        }

async def main():
    """تشغيل الاختبار الرئيسي"""
    print("🚀 بدء اختبار سريع لـ APIs إدارة الزيارات لحل مشكلة 'خطأ في تحميل المكون'")
    print("="*80)
    
    tester = VisitsManagementQuickTest()
    
    try:
        await tester.setup_session()
        
        # تشغيل الاختبارات بالتسلسل
        login_success = await tester.test_admin_login()
        
        if login_success:
            await tester.test_visits_list_endpoint()
            await tester.test_visits_dashboard_endpoint()
            await tester.test_visits_statistics_endpoint()
            await tester.test_additional_visits_endpoints()
        else:
            print("❌ فشل تسجيل الدخول - لا يمكن متابعة الاختبارات")
        
        # إنشاء التقرير النهائي
        final_report = tester.generate_final_report()
        
        return final_report
        
    except Exception as e:
        print(f"❌ خطأ في تشغيل الاختبار: {str(e)}")
        return None
        
    finally:
        await tester.cleanup_session()

if __name__ == "__main__":
    asyncio.run(main())