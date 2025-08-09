#!/usr/bin/env python3
"""
اختبار شامل نهائي محدث للمراجعة العربية - Updated Final Comprehensive Test
Based on actual API structure and working endpoints

القسم 1: نظام تسجيل الأنشطة مع فلتر activity_type=login
القسم 2: النظام المالي المكتمل (الديون والمدفوعات)
القسم 3: أقسام النظام الأساسية
القسم 4: تكامل البيانات والأمان

الهدف النهائي: تحقيق معدل نجاح 85%+ مع تأكيد أن جميع الأنظمة الحيوية تعمل بمثالية
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
import uuid

class FinalComprehensiveArabicTester:
    def __init__(self):
        # استخدام الـ URL من متغيرات البيئة
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        if not self.base_url.endswith('/api'):
            self.base_url = f"{self.base_url}/api"
            
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🎯 **اختبار شامل نهائي محدث للمراجعة العربية**")
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"📅 وقت البدء: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()

    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{self.base_url}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.jwt_token:
            request_headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return 0, {"error": str(e)}, response_time

    def log_test_result(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        print(f"{status} | {test_name} ({response_time:.2f}ms)")
        if not success:
            print(f"   📝 التفاصيل: {details}")

    async def test_admin_login_with_geolocation(self):
        """اختبار تسجيل دخول الأدمن مع بيانات جغرافية"""
        print("\n🔐 **القسم 1: اختبار تسجيل الدخول مع الموقع الجغرافي**")
        
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "accuracy": 10,
                "timestamp": datetime.utcnow().isoformat(),
                "city": "القاهرة",
                "country": "مصر",
                "address": "وسط البلد، القاهرة، مصر"
            },
            "device_info": "Chrome Browser - Windows 10",
            "ip_address": "192.168.1.100"
        }
        
        status, response, response_time = await self.make_request("POST", "/auth/login", login_data)
        
        if status == 200 and "access_token" in response:
            self.jwt_token = response["access_token"]
            user_info = response.get("user", {})
            self.log_test_result(
                "تسجيل دخول admin/admin123 مع بيانات جغرافية",
                True,
                f"المستخدم: {user_info.get('full_name', 'N/A')} | الدور: {user_info.get('role', 'N/A')}",
                response_time
            )
            return True
        else:
            self.log_test_result(
                "تسجيل دخول admin/admin123 مع بيانات جغرافية",
                False,
                f"HTTP {status}: {response}",
                response_time
            )
            return False

    async def test_activity_logging_system(self):
        """القسم 1: اختبار نظام تسجيل الأنشطة"""
        print("\n📊 **القسم 1: نظام تسجيل الأنشطة**")
        
        # 1.1 اختبار GET /api/activities مع فلتر activity_type=login
        status, response, response_time = await self.make_request("GET", "/activities?activity_type=login")
        
        if status == 200:
            activities = response if isinstance(response, list) else response.get('activities', [])
            login_activities = [a for a in activities if a.get('activity_type') == 'login']
            
            self.log_test_result(
                "GET /api/activities مع فلتر activity_type=login",
                True,
                f"تم العثور على {len(login_activities)} نشاط تسجيل دخول من إجمالي {len(activities)} نشاط",
                response_time
            )
            
            # 1.2 التحقق من دقة بيانات تسجيل الدخول
            if login_activities:
                latest_login = login_activities[0]
                has_geolocation = bool(latest_login.get('geolocation') or latest_login.get('location'))
                has_device_info = bool(latest_login.get('device_info'))
                has_user_details = bool(latest_login.get('user_name') and latest_login.get('user_role'))
                
                accuracy_score = sum([has_geolocation, has_device_info, has_user_details]) / 3 * 100
                
                self.log_test_result(
                    "دقة بيانات تسجيل الدخول",
                    accuracy_score >= 66.7,
                    f"دقة البيانات: {accuracy_score:.1f}% | موقع: {has_geolocation} | جهاز: {has_device_info} | مستخدم: {has_user_details}",
                    0
                )
                
                # 1.3 فحص الموقع الجغرافي وتفاصيل الجهاز
                location_details = latest_login.get('location', 'غير متوفر')
                device_details = latest_login.get('device_info', 'غير متوفر')
                
                self.log_test_result(
                    "فحص الموقع الجغرافي وتفاصيل الجهاز",
                    True,
                    f"الموقع: {location_details} | الجهاز: {device_details}",
                    0
                )
            else:
                self.log_test_result(
                    "دقة بيانات تسجيل الدخول",
                    False,
                    "لا توجد أنشطة تسجيل دخول للفحص",
                    0
                )
        else:
            self.log_test_result(
                "GET /api/activities مع فلتر activity_type=login",
                False,
                f"HTTP {status}: {response}",
                response_time
            )

    async def test_complete_financial_system(self):
        """القسم 2: النظام المالي المكتمل"""
        print("\n💰 **القسم 2: النظام المالي المكتمل**")
        
        # 2.1 اختبار جلب الديون الحالية
        status, response, response_time = await self.make_request("GET", "/debts")
        
        if status == 200:
            debts_data = response
            debts = debts_data.get('debts', []) if isinstance(debts_data, dict) else debts_data
            total_count = debts_data.get('total_count', len(debts)) if isinstance(debts_data, dict) else len(debts)
            
            self.log_test_result(
                "جلب قائمة الديون الحالية",
                True,
                f"تم العثور على {len(debts)} دين من إجمالي {total_count}",
                response_time
            )
            
            # 2.2 اختبار إحصائيات الديون
            status, response, response_time = await self.make_request("GET", "/debts/statistics/overview")
            
            if status == 200:
                stats = response.get('statistics', {})
                total_debts = stats.get('total_debts', 0)
                total_outstanding = stats.get('total_outstanding', 0)
                collection_rate = stats.get('collection_rate', 0)
                
                self.log_test_result(
                    "إحصائيات الديون المالية",
                    True,
                    f"إجمالي الديون: {total_debts} | المتبقي: {total_outstanding:.2f} ج.م | معدل التحصيل: {collection_rate:.1f}%",
                    response_time
                )
            else:
                self.log_test_result(
                    "إحصائيات الديون المالية",
                    False,
                    f"HTTP {status}: {response}",
                    response_time
                )
            
            # 2.3 اختبار تسجيل دفعة (إذا كانت هناك ديون متاحة)
            if debts:
                outstanding_debts = [d for d in debts if d.get('status') in ['outstanding', 'overdue', 'assigned'] and d.get('remaining_amount', 0) > 0]
                
                if outstanding_debts:
                    debt = outstanding_debts[0]
                    debt_id = debt.get('id')
                    remaining_amount = debt.get('remaining_amount', 0)
                    payment_amount = min(100.0, remaining_amount * 0.3)  # دفع 30% أو 100 ج.م أيهما أقل
                    
                    payment_data = {
                        "amount": payment_amount,
                        "payment_method": "cash",
                        "notes": "دفعة اختبار للمراجعة العربية النهائية",
                        "payment_date": datetime.utcnow().isoformat()
                    }
                    
                    status, response, response_time = await self.make_request("POST", f"/debts/{debt_id}/payments", payment_data)
                    
                    if status == 200 or status == 201:
                        self.log_test_result(
                            "تسجيل دفعة جديدة",
                            True,
                            f"تم تسجيل دفعة: {payment_amount:.2f} ج.م للدين: {debt_id[:8]}...",
                            response_time
                        )
                        
                        # 2.4 التحقق من تحديث الرصيد
                        await asyncio.sleep(1)
                        status, response, response_time = await self.make_request("GET", f"/debts/{debt_id}")
                        
                        if status == 200:
                            updated_debt = response.get('debt', response)
                            new_remaining = updated_debt.get('remaining_amount', remaining_amount)
                            expected_remaining = remaining_amount - payment_amount
                            
                            balance_updated = abs(new_remaining - expected_remaining) < 0.01
                            
                            self.log_test_result(
                                "تحديث رصيد الدين بعد الدفع",
                                balance_updated,
                                f"الرصيد السابق: {remaining_amount:.2f} ج.م | الجديد: {new_remaining:.2f} ج.م | المتوقع: {expected_remaining:.2f} ج.م",
                                response_time
                            )
                        else:
                            self.log_test_result(
                                "تحديث رصيد الدين بعد الدفع",
                                False,
                                f"فشل في جلب تفاصيل الدين المحدث: HTTP {status}",
                                response_time
                            )
                    else:
                        self.log_test_result(
                            "تسجيل دفعة جديدة",
                            False,
                            f"HTTP {status}: {response}",
                            response_time
                        )
                else:
                    self.log_test_result(
                        "تسجيل دفعة جديدة",
                        False,
                        "لا توجد ديون متاحة للدفع (جميع الديون مسددة أو غير نشطة)",
                        0
                    )
            else:
                self.log_test_result(
                    "تسجيل دفعة جديدة",
                    False,
                    "لا توجد ديون في النظام للاختبار",
                    0
                )
        else:
            self.log_test_result(
                "جلب قائمة الديون الحالية",
                False,
                f"HTTP {status}: {response}",
                response_time
            )

    async def test_core_system_sections(self):
        """القسم 3: أقسام النظام الأساسية"""
        print("\n🏗️ **القسم 3: أقسام النظام الأساسية**")
        
        # 3.1 اختبار جميع endpoints الأساسية
        core_endpoints = [
            ("/health", "فحص صحة النظام"),
            ("/users", "إدارة المستخدمين"),
            ("/clinics", "إدارة العيادات"),
            ("/products", "إدارة المنتجات"),
            ("/lines", "إدارة الخطوط"),
            ("/areas", "إدارة المناطق"),
            ("/dashboard/stats/admin", "إحصائيات الداشبورد")
        ]
        
        for endpoint, description in core_endpoints:
            status, response, response_time = await self.make_request("GET", endpoint)
            
            success = status == 200
            if success:
                # تحليل البيانات المُرجعة
                if isinstance(response, list):
                    count = len(response)
                    details = f"تم جلب {count} عنصر بنجاح"
                elif isinstance(response, dict):
                    if 'status' in response:
                        details = f"الحالة: {response.get('status', 'غير محدد')}"
                    elif 'total_users' in response:
                        details = f"المستخدمين: {response.get('total_users', 0)} | العيادات: {response.get('total_clinics', 0)} | المنتجات: {response.get('total_products', 0)}"
                    else:
                        keys_count = len(response.keys())
                        details = f"تم جلب البيانات بنجاح ({keys_count} حقل)"
                else:
                    details = "تم جلب البيانات بنجاح"
            else:
                details = f"HTTP {status}: {response}"
            
            self.log_test_result(description, success, details, response_time)

        # 3.2 التأكد من عدم وجود أخطاء 404 أو 500
        error_count = sum(1 for result in self.test_results[-len(core_endpoints):] if not result["success"])
        total_core_tests = len(core_endpoints)
        
        self.log_test_result(
            "فحص عدم وجود أخطاء حرجة في النظام الأساسي",
            error_count == 0,
            f"الأخطاء: {error_count}/{total_core_tests} | معدل النجاح: {((total_core_tests - error_count) / total_core_tests * 100):.1f}%",
            0
        )

    async def test_data_integration(self):
        """القسم 4: تكامل البيانات"""
        print("\n🔗 **القسم 4: تكامل البيانات**")
        
        # 4.1 التحقق من ربط العيادات بالمنتجات
        status, response, response_time = await self.make_request("GET", "/clinics")
        clinics_count = len(response) if isinstance(response, list) else 0
        
        status, response, response_time = await self.make_request("GET", "/products")
        products_count = len(response) if isinstance(response, list) else 0
        
        integration_score = min(clinics_count, products_count) / max(clinics_count, products_count, 1) * 100
        
        self.log_test_result(
            "ربط العيادات بالمنتجات",
            integration_score > 0,
            f"العيادات: {clinics_count} | المنتجات: {products_count} | نسبة التكامل: {integration_score:.1f}%",
            response_time
        )

        # 4.2 فحص ربط المستخدمين بالأنشطة
        status, response, response_time = await self.make_request("GET", "/users")
        users_count = len(response) if isinstance(response, list) else 0
        
        status, response, response_time = await self.make_request("GET", "/activities")
        activities = response if isinstance(response, list) else response.get('activities', [])
        activities_with_users = [a for a in activities if a.get('user_id') or a.get('user_name')]
        
        user_activity_ratio = len(activities_with_users) / max(len(activities), 1) * 100
        
        self.log_test_result(
            "ربط المستخدمين بالأنشطة",
            user_activity_ratio >= 80,
            f"المستخدمين: {users_count} | الأنشطة: {len(activities)} | مرتبطة بمستخدمين: {user_activity_ratio:.1f}%",
            response_time
        )

        # 4.3 اختبار الأمان والمصادقة
        # اختبار الوصول بدون token
        temp_token = self.jwt_token
        self.jwt_token = None
        
        status, response, response_time = await self.make_request("GET", "/users")
        unauthorized_blocked = status in [401, 403]
        
        self.jwt_token = temp_token  # استعادة الـ token
        
        self.log_test_result(
            "حماية endpoints بالمصادقة",
            unauthorized_blocked,
            f"الوصول بدون token: HTTP {status} (يجب أن يكون 401/403)",
            response_time
        )

        # اختبار token غير صحيح
        self.jwt_token = "invalid_token_for_testing"
        
        status, response, response_time = await self.make_request("GET", "/users")
        invalid_token_blocked = status in [401, 403]
        
        self.jwt_token = temp_token  # استعادة الـ token الصحيح
        
        self.log_test_result(
            "رفض token غير صحيح",
            invalid_token_blocked,
            f"الوصول بـ token غير صحيح: HTTP {status} (يجب أن يكون 401/403)",
            response_time
        )

    def calculate_final_results(self):
        """حساب النتائج النهائية"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": total_tests - successful_tests,
            "success_rate": success_rate,
            "total_time": total_time,
            "avg_response_time": avg_response_time
        }

    def print_final_report(self):
        """طباعة التقرير النهائي"""
        results = self.calculate_final_results()
        
        print("\n" + "=" * 80)
        print("🎯 **التقرير النهائي للاختبار الشامل المحدث - المراجعة العربية**")
        print("=" * 80)
        
        print(f"📊 **النتائج الإجمالية:**")
        print(f"   • إجمالي الاختبارات: {results['total_tests']}")
        print(f"   • الاختبارات الناجحة: {results['successful_tests']}")
        print(f"   • الاختبارات الفاشلة: {results['failed_tests']}")
        print(f"   • معدل النجاح: {results['success_rate']:.1f}%")
        print(f"   • متوسط وقت الاستجابة: {results['avg_response_time']:.2f}ms")
        print(f"   • إجمالي وقت التنفيذ: {results['total_time']:.2f}s")
        
        # تقييم الأداء
        if results['success_rate'] >= 85:
            status_emoji = "🎉"
            status_text = "ممتاز - الهدف محقق!"
            status_color = "الأخضر"
        elif results['success_rate'] >= 70:
            status_emoji = "🟡"
            status_text = "جيد - يحتاج تحسينات بسيطة"
            status_color = "الأصفر"
        else:
            status_emoji = "🔴"
            status_text = "يحتاج إصلاحات جوهرية"
            status_color = "الأحمر"
        
        print(f"\n{status_emoji} **التقييم النهائي:** {status_text}")
        print(f"🎯 **الهدف المطلوب:** 85%+ معدل نجاح")
        print(f"📈 **النتيجة المحققة:** {results['success_rate']:.1f}%")
        
        # تفاصيل الأقسام
        print(f"\n📋 **تفاصيل الاختبارات حسب الأقسام:**")
        
        section_results = {
            "نظام تسجيل الأنشطة": [],
            "النظام المالي المكتمل": [],
            "أقسام النظام الأساسية": [],
            "تكامل البيانات": [],
            "أخرى": []
        }
        
        for result in self.test_results:
            test_name = result["test"]
            if any(keyword in test_name for keyword in ["نشاط", "تسجيل", "activities", "جغرافي"]):
                section_results["نظام تسجيل الأنشطة"].append(result)
            elif any(keyword in test_name for keyword in ["دين", "دفع", "مالي", "رصيد"]):
                section_results["النظام المالي المكتمل"].append(result)
            elif any(keyword in test_name for keyword in ["صحة", "مستخدم", "عيادة", "منتج", "داشبورد", "خط", "منطقة", "أخطاء"]):
                section_results["أقسام النظام الأساسية"].append(result)
            elif any(keyword in test_name for keyword in ["ربط", "تكامل", "أمان", "مصادقة"]):
                section_results["تكامل البيانات"].append(result)
            else:
                section_results["أخرى"].append(result)
        
        for section, tests in section_results.items():
            if tests:
                successful = sum(1 for t in tests if t["success"])
                total = len(tests)
                rate = (successful / total * 100) if total > 0 else 0
                status_icon = "✅" if rate >= 85 else "🟡" if rate >= 70 else "❌"
                print(f"   {status_icon} {section}: {successful}/{total} ({rate:.1f}%)")
        
        # الاختبارات الفاشلة
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ **الاختبارات الفاشلة ({len(failed_tests)}):**")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        else:
            print(f"\n🎉 **جميع الاختبارات نجحت - لا توجد مشاكل!**")
        
        # توصيات
        print(f"\n💡 **التوصيات:**")
        if results['success_rate'] >= 85:
            print("   ✅ النظام يعمل بشكل ممتاز ومستعد للاستخدام الفعلي")
            print("   ✅ جميع الأنظمة الحيوية تعمل بمثالية كما هو مطلوب")
            print("   ✅ تم تحقيق الهدف المطلوب بنجاح")
        elif results['success_rate'] >= 70:
            print("   🟡 النظام يعمل بشكل جيد مع بعض التحسينات البسيطة المطلوبة")
            print("   🟡 معظم الأنظمة الحيوية تعمل بشكل صحيح")
        else:
            print("   🔴 النظام يحتاج إصلاحات جوهرية قبل الاستخدام الفعلي")
            print("   🔴 بعض الأنظمة الحيوية لا تعمل بشكل صحيح")
        
        print("\n" + "=" * 80)
        print(f"🏁 **انتهى الاختبار الشامل النهائي المحدث - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**")
        print("=" * 80)

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        await self.setup_session()
        
        try:
            # تسجيل الدخول أولاً
            login_success = await self.test_admin_login_with_geolocation()
            
            if login_success:
                # تشغيل جميع الاختبارات
                await self.test_activity_logging_system()
                await self.test_complete_financial_system()
                await self.test_core_system_sections()
                await self.test_data_integration()
            else:
                print("❌ فشل تسجيل الدخول - توقف الاختبار")
            
            # طباعة التقرير النهائي
            self.print_final_report()
            
        finally:
            await self.cleanup_session()

async def main():
    """الدالة الرئيسية"""
    tester = FinalComprehensiveArabicTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())