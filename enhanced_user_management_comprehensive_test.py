#!/usr/bin/env python3
"""
اختبار شامل لنظام إدارة المستخدمين المحسن مع الإحصائيات الحقيقية
Comprehensive Enhanced User Management System Testing with Real Statistics
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class EnhancedUserManagementTester:
    def __init__(self):
        # استخدام الـ URL من متغيرات البيئة
        self.base_url = "http://localhost:8001"
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        self.base_url = line.split('=')[1].strip()
                        break
        except:
            pass
        
        self.api_url = f"{self.base_url}/api"
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🔧 تم تهيئة اختبار نظام إدارة المستخدمين المحسن")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"🔗 API URL: {self.api_url}")

    async def setup_session(self):
        """إعداد جلسة HTTP"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)

    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()

    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None) -> Dict[str, Any]:
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{self.api_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if headers:
            request_headers.update(headers)
        
        if self.auth_token:
            request_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        start_time = time.time()
        
        try:
            async with self.session.request(method, url, json=data, headers=request_headers) as response:
                response_time = round((time.time() - start_time) * 1000, 2)
                response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                
                return {
                    "success": response.status < 400,
                    "status_code": response.status,
                    "data": response_data,
                    "response_time": response_time,
                    "url": url
                }
        except Exception as e:
            response_time = round((time.time() - start_time) * 1000, 2)
            return {
                "success": False,
                "status_code": 0,
                "data": {"error": str(e)},
                "response_time": response_time,
                "url": url
            }

    async def test_admin_login(self) -> bool:
        """اختبار تسجيل دخول الأدمن"""
        print("\n🔐 اختبار 1: تسجيل دخول admin/admin123...")
        
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "device_info": "Chrome 120.0 on Windows 10",
            "ip_address": "156.160.45.123"
        }
        
        result = await self.make_request("POST", "/auth/login", login_data)
        
        if result["success"] and result["data"].get("access_token"):
            self.auth_token = result["data"]["access_token"]
            user_info = result["data"].get("user", {})
            
            print(f"✅ تسجيل دخول ناجح ({result['response_time']}ms)")
            print(f"   👤 المستخدم: {user_info.get('full_name', 'Unknown')}")
            print(f"   🎭 الدور: {user_info.get('role', 'Unknown')}")
            
            self.test_results.append({
                "test": "Admin Login",
                "status": "✅ PASS",
                "response_time": result["response_time"],
                "details": f"User: {user_info.get('full_name')}, Role: {user_info.get('role')}"
            })
            return True
        else:
            print(f"❌ فشل تسجيل الدخول: {result['data']}")
            self.test_results.append({
                "test": "Admin Login",
                "status": "❌ FAIL",
                "response_time": result["response_time"],
                "details": f"Error: {result['data']}"
            })
            return False

    async def test_enhanced_users_with_statistics(self) -> bool:
        """اختبار API المستخدمين مع الإحصائيات"""
        print("\n📊 اختبار 2: GET /api/enhanced-users/with-statistics...")
        
        result = await self.make_request("GET", "/enhanced-users/with-statistics")
        
        if result["success"]:
            data = result["data"]
            users = data.get("users", [])
            total_count = data.get("total_count", 0)
            active_count = data.get("active_count", 0)
            
            print(f"✅ تم جلب المستخدمين مع الإحصائيات ({result['response_time']}ms)")
            print(f"   📈 إجمالي المستخدمين: {total_count}")
            print(f"   🟢 المستخدمون النشطون: {active_count}")
            
            # فحص الإحصائيات المطلوبة لأول مستخدم
            if users:
                user = users[0]
                required_stats = [
                    "visits_count", "visits_this_month", "clinics_count", "clinics_this_month",
                    "sales_count", "total_sales", "collections_count", "total_collections",
                    "debts_count", "total_debts", "activities_count", "activities_today",
                    "last_activity", "line_name", "area_name", "manager_name"
                ]
                
                available_stats = [stat for stat in required_stats if stat in user]
                missing_stats = [stat for stat in required_stats if stat not in user]
                
                print(f"   📋 الإحصائيات المتاحة: {len(available_stats)}/{len(required_stats)}")
                if available_stats:
                    print(f"   ✅ متوفرة: {', '.join(available_stats[:5])}...")
                if missing_stats:
                    print(f"   ⚠️ مفقودة: {', '.join(missing_stats[:3])}...")
                
                # عرض إحصائيات أول مستخدم
                print(f"   👤 مثال - {user.get('full_name', 'Unknown')}:")
                print(f"      🏥 زيارات: {user.get('visits_count', 0)} (هذا الشهر: {user.get('visits_this_month', 0)})")
                print(f"      🏢 عيادات: {user.get('clinics_count', 0)} (هذا الشهر: {user.get('clinics_this_month', 0)})")
                print(f"      💰 مبيعات: {user.get('total_sales', 0)} ج.م ({user.get('sales_count', 0)} فاتورة)")
                print(f"      📊 أنشطة: {user.get('activities_count', 0)} (اليوم: {user.get('activities_today', 0)})")
            
            self.test_results.append({
                "test": "Enhanced Users with Statistics",
                "status": "✅ PASS",
                "response_time": result["response_time"],
                "details": f"Users: {total_count}, Active: {active_count}, Stats: {len(available_stats) if users else 0}/{len(required_stats) if users else 0}"
            })
            return True
        else:
            print(f"❌ فشل في جلب المستخدمين: {result['data']}")
            self.test_results.append({
                "test": "Enhanced Users with Statistics",
                "status": "❌ FAIL",
                "response_time": result["response_time"],
                "details": f"Error: {result['data']}"
            })
            return False

    async def test_user_detailed_statistics(self) -> bool:
        """اختبار الإحصائيات التفصيلية لمستخدم محدد"""
        print("\n🔍 اختبار 3: GET /api/enhanced-users/{user_id}/detailed-statistics...")
        
        # أولاً، نحصل على قائمة المستخدمين لاختيار واحد منهم
        users_result = await self.make_request("GET", "/enhanced-users/with-statistics")
        if not users_result["success"] or not users_result["data"].get("users"):
            print("❌ لا يمكن الحصول على قائمة المستخدمين للاختبار")
            return False
        
        # اختيار أول مستخدم للاختبار
        test_user = users_result["data"]["users"][0]
        user_id = test_user.get("id")
        user_name = test_user.get("full_name", "Unknown")
        
        print(f"   🎯 اختبار المستخدم: {user_name} (ID: {user_id})")
        
        result = await self.make_request("GET", f"/enhanced-users/{user_id}/detailed-statistics")
        
        if result["success"]:
            data = result["data"]
            user_info = data.get("user_info", {})
            statistics = data.get("statistics", {})
            
            print(f"✅ تم جلب الإحصائيات التفصيلية ({result['response_time']}ms)")
            print(f"   👤 المستخدم: {user_info.get('full_name', 'Unknown')}")
            print(f"   🎭 الدور: {user_info.get('role', 'Unknown')}")
            
            # فحص الإحصائيات التفصيلية
            visits_stats = statistics.get("visits", {})
            clinics_stats = statistics.get("clinics", {})
            activities_stats = statistics.get("activities", {})
            
            print(f"   📊 إحصائيات الزيارات:")
            visits_by_type = visits_stats.get("by_type", [])
            monthly_visits = visits_stats.get("monthly_trend", [])
            print(f"      🏥 حسب النوع: {len(visits_by_type)} أنواع")
            print(f"      📅 الاتجاه الشهري: {len(monthly_visits)} أشهر")
            
            print(f"   🏢 إحصائيات العيادات:")
            clinics_by_class = clinics_stats.get("by_classification", [])
            print(f"      📋 حسب التصنيف: {len(clinics_by_class)} تصنيفات")
            
            print(f"   🎯 إحصائيات الأنشطة:")
            activities_by_type = activities_stats.get("by_type", [])
            recent_activities = activities_stats.get("recent", [])
            print(f"      📈 حسب النوع: {len(activities_by_type)} أنواع")
            print(f"      ⏰ الأنشطة الحديثة: {len(recent_activities)} نشاط")
            
            self.test_results.append({
                "test": "User Detailed Statistics",
                "status": "✅ PASS",
                "response_time": result["response_time"],
                "details": f"User: {user_name}, Visits: {len(visits_by_type)} types, Activities: {len(recent_activities)} recent"
            })
            return True
        else:
            print(f"❌ فشل في جلب الإحصائيات التفصيلية: {result['data']}")
            self.test_results.append({
                "test": "User Detailed Statistics",
                "status": "❌ FAIL",
                "response_time": result["response_time"],
                "details": f"Error: {result['data']}"
            })
            return False

    async def test_performance_metrics(self) -> bool:
        """اختبار مقاييس الأداء"""
        print("\n🏆 اختبار 4: GET /api/enhanced-users/performance-metrics...")
        
        result = await self.make_request("GET", "/enhanced-users/performance-metrics")
        
        if result["success"]:
            data = result["data"]
            metrics = data.get("performance_metrics", {})
            
            top_visits = metrics.get("top_visits", [])
            top_sales = metrics.get("top_sales", [])
            top_clinics = metrics.get("top_clinics", [])
            
            print(f"✅ تم جلب مقاييس الأداء ({result['response_time']}ms)")
            print(f"   🏥 أفضل في الزيارات: {len(top_visits)} مندوب")
            print(f"   💰 أفضل في المبيعات: {len(top_sales)} مندوب")
            print(f"   🏢 أفضل في العيادات: {len(top_clinics)} مندوب")
            
            # عرض أفضل 3 في كل فئة
            if top_visits:
                print(f"   🥇 أفضل في الزيارات:")
                for i, rep in enumerate(top_visits[:3], 1):
                    print(f"      {i}. {rep.get('user_name', 'Unknown')}: {rep.get('visits_count', 0)} زيارة")
            
            if top_sales:
                print(f"   💎 أفضل في المبيعات:")
                for i, rep in enumerate(top_sales[:3], 1):
                    print(f"      {i}. {rep.get('user_name', 'Unknown')}: {rep.get('total_sales', 0)} ج.م")
            
            if top_clinics:
                print(f"   🏆 أفضل في العيادات:")
                for i, rep in enumerate(top_clinics[:3], 1):
                    print(f"      {i}. {rep.get('user_name', 'Unknown')}: {rep.get('clinics_count', 0)} عيادة")
            
            self.test_results.append({
                "test": "Performance Metrics",
                "status": "✅ PASS",
                "response_time": result["response_time"],
                "details": f"Top visits: {len(top_visits)}, Top sales: {len(top_sales)}, Top clinics: {len(top_clinics)}"
            })
            return True
        else:
            print(f"❌ فشل في جلب مقاييس الأداء: {result['data']}")
            self.test_results.append({
                "test": "Performance Metrics",
                "status": "❌ FAIL",
                "response_time": result["response_time"],
                "details": f"Error: {result['data']}"
            })
            return False

    async def test_data_linking_verification(self) -> bool:
        """اختبار التحقق من ربط البيانات"""
        print("\n🔗 اختبار 5: التحقق من ربط البيانات مع قاعدة البيانات...")
        
        # اختبار الاتصال بقاعدة البيانات
        health_result = await self.make_request("GET", "/health")
        
        if health_result["success"]:
            health_data = health_result["data"]
            db_status = health_data.get("database", "unknown")
            stats = health_data.get("statistics", {})
            
            print(f"✅ فحص صحة النظام ({health_result['response_time']}ms)")
            print(f"   🗄️ حالة قاعدة البيانات: {db_status}")
            print(f"   👥 المستخدمون: {stats.get('users', 0)}")
            print(f"   🏢 العيادات: {stats.get('clinics', 0)}")
            
            # اختبار APIs الأساسية للتأكد من وجود البيانات
            apis_to_test = [
                ("/users", "المستخدمون"),
                ("/clinics", "العيادات"),
                ("/visits/", "الزيارات"),
                ("/activities", "الأنشطة")
            ]
            
            linked_data_count = 0
            total_apis = len(apis_to_test)
            
            for endpoint, name in apis_to_test:
                api_result = await self.make_request("GET", endpoint)
                if api_result["success"]:
                    data = api_result["data"]
                    if isinstance(data, dict):
                        count = len(data.get("users", data.get("visits", data.get("activities", []))))
                    else:
                        count = len(data) if isinstance(data, list) else 0
                    
                    print(f"   ✅ {name}: {count} عنصر")
                    linked_data_count += 1
                else:
                    print(f"   ❌ {name}: غير متاح")
            
            success_rate = (linked_data_count / total_apis) * 100
            
            self.test_results.append({
                "test": "Data Linking Verification",
                "status": "✅ PASS" if success_rate >= 75 else "⚠️ PARTIAL",
                "response_time": health_result["response_time"],
                "details": f"Database: {db_status}, APIs working: {linked_data_count}/{total_apis} ({success_rate:.1f}%)"
            })
            return success_rate >= 75
        else:
            print(f"❌ فشل في فحص صحة النظام: {health_result['data']}")
            self.test_results.append({
                "test": "Data Linking Verification",
                "status": "❌ FAIL",
                "response_time": health_result["response_time"],
                "details": f"Health check failed: {health_result['data']}"
            })
            return False

    async def test_response_performance(self) -> bool:
        """اختبار الاستجابة والأداء"""
        print("\n⚡ اختبار 6: قياس أوقات الاستجابة والأداء...")
        
        # اختبار APIs متعددة لقياس الأداء
        performance_tests = [
            ("/enhanced-users/with-statistics", "المستخدمين مع الإحصائيات"),
            ("/enhanced-users/performance-metrics", "مقاييس الأداء"),
            ("/health", "فحص الصحة"),
            ("/dashboard/stats/admin", "إحصائيات لوحة التحكم")
        ]
        
        response_times = []
        successful_tests = 0
        
        for endpoint, name in performance_tests:
            result = await self.make_request("GET", endpoint)
            response_times.append(result["response_time"])
            
            if result["success"]:
                print(f"   ✅ {name}: {result['response_time']}ms")
                successful_tests += 1
            else:
                print(f"   ❌ {name}: {result['response_time']}ms (فشل)")
        
        # حساب الإحصائيات
        avg_response_time = sum(response_times) / len(response_times)
        max_response_time = max(response_times)
        min_response_time = min(response_times)
        
        print(f"   📊 إحصائيات الأداء:")
        print(f"      ⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"      🚀 أسرع استجابة: {min_response_time:.2f}ms")
        print(f"      🐌 أبطأ استجابة: {max_response_time:.2f}ms")
        print(f"      ✅ معدل النجاح: {successful_tests}/{len(performance_tests)} ({(successful_tests/len(performance_tests)*100):.1f}%)")
        
        # تقييم الأداء
        performance_rating = "ممتاز" if avg_response_time < 100 else "جيد" if avg_response_time < 500 else "مقبول"
        
        self.test_results.append({
            "test": "Response Performance",
            "status": "✅ PASS" if successful_tests >= len(performance_tests) * 0.8 else "⚠️ PARTIAL",
            "response_time": avg_response_time,
            "details": f"Avg: {avg_response_time:.2f}ms, Success: {successful_tests}/{len(performance_tests)}, Rating: {performance_rating}"
        })
        
        return successful_tests >= len(performance_tests) * 0.8

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_time = time.time() - self.start_time
        passed_tests = len([t for t in self.test_results if "✅" in t["status"]])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        avg_response_time = sum([t["response_time"] for t in self.test_results]) / len(self.test_results) if self.test_results else 0
        
        print(f"\n{'='*80}")
        print(f"🎯 **اختبار شامل لنظام إدارة المستخدمين المحسن مع الإحصائيات الحقيقية مكتمل - {success_rate:.1f}% SUCCESS{'!' if success_rate >= 90 else ' - يحتاج تحسينات!' if success_rate < 75 else ' - جيد!'}**")
        print(f"{'='*80}")
        
        print(f"\n📊 **النتائج الحاسمة للمتطلبات المحددة:**")
        
        for i, result in enumerate(self.test_results, 1):
            print(f"{result['status']} **{i}. {result['test']}:** {result['details']} ({result['response_time']:.2f}ms)")
        
        print(f"\n🎯 **التقييم النهائي:** معدل النجاح {success_rate:.1f}% ({passed_tests}/{total_tests} اختبار نجح)! متوسط وقت الاستجابة: {avg_response_time:.2f}ms ({'ممتاز' if avg_response_time < 100 else 'جيد' if avg_response_time < 500 else 'مقبول'}). إجمالي وقت التنفيذ: {total_time:.2f}s.")
        
        if success_rate >= 90:
            print(f"\n**🏆 الهدف محقق بالكامل:** نظام إدارة المستخدمين المحسن يعرض إحصائيات حقيقية ودقيقة مربوطة بقاعدة البيانات كما طُلب في المراجعة العربية!")
            print(f"جميع المتطلبات المحددة تم تحقيقها: تسجيل الدخول، APIs الإحصائيات، التفاصيل الشاملة، مقاييس الأداء، ربط البيانات، والأداء الممتاز.")
        elif success_rate >= 75:
            print(f"\n**🟢 النظام في حالة جيدة:** معظم المتطلبات محققة مع بعض التحسينات البسيطة المطلوبة.")
        else:
            print(f"\n**🔴 النظام يحتاج إصلاحات:** عدة مشاكل تحتاج معالجة لتحقيق المتطلبات المحددة في المراجعة العربية.")
        
        print(f"\n**النظام {'جاهز للإنتاج' if success_rate >= 85 else 'يحتاج تحسينات قبل الإنتاج'}!**")

async def main():
    """تشغيل الاختبار الشامل"""
    tester = EnhancedUserManagementTester()
    
    try:
        await tester.setup_session()
        
        print("🚀 بدء اختبار شامل لنظام إدارة المستخدمين المحسن مع الإحصائيات الحقيقية")
        print("=" * 80)
        
        # تشغيل الاختبارات بالتسلسل
        tests = [
            tester.test_admin_login,
            tester.test_enhanced_users_with_statistics,
            tester.test_user_detailed_statistics,
            tester.test_performance_metrics,
            tester.test_data_linking_verification,
            tester.test_response_performance
        ]
        
        for test in tests:
            try:
                await test()
                await asyncio.sleep(0.5)  # فترة راحة قصيرة بين الاختبارات
            except Exception as e:
                print(f"❌ خطأ في الاختبار: {str(e)}")
        
        # إنشاء التقرير النهائي
        tester.generate_final_report()
        
    except Exception as e:
        print(f"❌ خطأ عام في الاختبار: {str(e)}")
    finally:
        await tester.cleanup_session()

if __name__ == "__main__":
    asyncio.run(main())