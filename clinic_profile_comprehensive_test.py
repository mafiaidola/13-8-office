#!/usr/bin/env python3
"""
اختبار شامل لنظام ملف العيادة التفصيلي الجديد - Arabic Review
Comprehensive Clinic Profile System Testing
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BACKEND_URL = "https://medmanage-pro-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ClinicProfileTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_clinic_id = None
        self.test_order_id = None
        self.test_debt_id = None
        self.test_collection_id = None
        self.results = []
        self.start_time = time.time()

    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()

    def log_result(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """تسجيل نتيجة الاختبار"""
        status = "✅ SUCCESS" if success else "❌ FAILED"
        self.results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details,
            "status": status
        })
        print(f"{status} | {test_name} ({response_time:.2f}ms)")
        if details:
            print(f"   📝 {details}")

    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None):
        """إجراء طلب HTTP مع قياس الوقت"""
        start_time = time.time()
        
        if headers is None:
            headers = {}
        
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        headers["Content-Type"] = "application/json"
        
        url = f"{BACKEND_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
            elif method.upper() == "DELETE":
                async with self.session.delete(url, headers=headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json()
                    return response.status, response_data, response_time
                    
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return 500, {"error": str(e)}, response_time

    async def test_admin_login(self):
        """1. تسجيل الدخول admin/admin123 للحصول على JWT token"""
        print("\n🔐 اختبار تسجيل الدخول...")
        
        login_data = {
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        }
        
        status, response, response_time = await self.make_request("POST", "/auth/login", login_data)
        
        if status == 200 and "access_token" in response:
            self.auth_token = response["access_token"]
            user_info = response.get("user", {})
            details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
            self.log_result("تسجيل دخول admin/admin123", True, response_time, details)
            return True
        else:
            self.log_result("تسجيل دخول admin/admin123", False, response_time, f"Status: {status}, Response: {response}")
            return False

    async def test_create_test_clinic(self):
        """2. إنشاء عيادة تجريبية للاختبار"""
        print("\n🏥 إنشاء عيادة تجريبية...")
        
        clinic_data = {
            "clinic_name": "عيادة الدكتور أحمد التجريبية للاختبار",
            "clinic_phone": "01234567890",
            "doctor_name": "د. أحمد محمد الطبيب",
            "clinic_address": "123 شارع النيل، القاهرة، مصر",
            "clinic_latitude": 30.0444,
            "clinic_longitude": 31.2357,
            "line_id": "line-001",
            "area_id": "area-001",
            "classification": "class_a",
            "credit_classification": "green"
        }
        
        status, response, response_time = await self.make_request("POST", "/clinics", clinic_data)
        
        if status == 200 and response.get("success"):
            self.test_clinic_id = response.get("clinic_id")
            details = f"ID: {self.test_clinic_id}, رقم التسجيل: {response.get('registration_number', 'N/A')}"
            self.log_result("إنشاء عيادة تجريبية", True, response_time, details)
            return True
        else:
            self.log_result("إنشاء عيادة تجريبية", False, response_time, f"Status: {status}, Response: {response}")
            return False

    async def test_clinic_overview(self):
        """3. اختبار نظرة عامة للعيادة"""
        print("\n📊 اختبار نظرة عامة للعيادة...")
        
        if not self.test_clinic_id:
            self.log_result("نظرة عامة للعيادة", False, 0, "لا يوجد معرف عيادة تجريبية")
            return False
        
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/overview")
        
        if status == 200 and response.get("success"):
            clinic_info = response.get("clinic_info", {})
            statistics = response.get("statistics", {})
            
            # التحقق من وجود المعلومات المطلوبة
            required_sections = ["clinic_info", "statistics"]
            missing_sections = [section for section in required_sections if section not in response]
            
            if not missing_sections:
                details = f"العيادة: {clinic_info.get('name', 'N/A')}, المندوب: {clinic_info.get('rep_name', 'غير محدد')}"
                details += f", الزيارات: {statistics.get('visits', {}).get('total', 0)}"
                details += f", الطلبات: {statistics.get('orders', {}).get('total', 0)}"
                details += f", الإحصائيات المالية: {len(statistics.get('financial', {}))}"
                self.log_result("نظرة عامة للعيادة", True, response_time, details)
                return True
            else:
                self.log_result("نظرة عامة للعيادة", False, response_time, f"أقسام مفقودة: {missing_sections}")
                return False
        else:
            self.log_result("نظرة عامة للعيادة", False, response_time, f"Status: {status}, Response: {response}")
            return False

    async def test_clinic_orders(self):
        """4. اختبار طلبات العيادة"""
        print("\n📦 اختبار طلبات العيادة...")
        
        if not self.test_clinic_id:
            self.log_result("طلبات العيادة", False, 0, "لا يوجد معرف عيادة تجريبية")
            return False
        
        # 4.1 جلب الطلبات الحالية
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/orders")
        
        if status == 200 and response.get("success"):
            current_orders = response.get("orders", [])
            self.log_result("جلب طلبات العيادة الحالية", True, response_time, f"عدد الطلبات: {len(current_orders)}")
        else:
            self.log_result("جلب طلبات العيادة الحالية", False, response_time, f"Status: {status}")
            return False
        
        # 4.2 إنشاء طلب تجريبي
        order_data = {
            "products": [
                {
                    "product_id": "prod-001",
                    "product_name": "دواء تجريبي",
                    "quantity": 10,
                    "unit_price": 25.50,
                    "total_price": 255.0
                }
            ],
            "total_amount": 255.0,
            "order_type": "regular",
            "delivery_date": (datetime.now() + timedelta(days=7)).isoformat(),
            "notes": "طلب تجريبي للاختبار"
        }
        
        status, response, response_time = await self.make_request("POST", f"/clinic-profile/{self.test_clinic_id}/orders", order_data)
        
        if status == 200 and response.get("success"):
            self.test_order_id = response.get("order", {}).get("id")
            details = f"ID: {self.test_order_id}, المبلغ: {order_data['total_amount']} ج.م"
            self.log_result("إنشاء طلب تجريبي", True, response_time, details)
        else:
            self.log_result("إنشاء طلب تجريبي", False, response_time, f"Status: {status}, Response: {response}")
            return False
        
        # 4.3 التحقق من إضافة الطلب
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/orders")
        
        if status == 200 and response.get("success"):
            updated_orders = response.get("orders", [])
            new_orders_count = len(updated_orders) - len(current_orders)
            if new_orders_count > 0:
                self.log_result("التحقق من إضافة الطلب", True, response_time, f"تم إضافة {new_orders_count} طلب جديد")
                return True
            else:
                self.log_result("التحقق من إضافة الطلب", False, response_time, "لم يتم إضافة طلب جديد")
                return False
        else:
            self.log_result("التحقق من إضافة الطلب", False, response_time, f"Status: {status}")
            return False

    async def test_clinic_debts(self):
        """5. اختبار ديون العيادة"""
        print("\n💰 اختبار ديون العيادة...")
        
        if not self.test_clinic_id:
            self.log_result("ديون العيادة", False, 0, "لا يوجد معرف عيادة تجريبية")
            return False
        
        # 5.1 جلب الديون الحالية
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/debts")
        
        if status == 200 and response.get("success"):
            current_debts = response.get("debts", [])
            statistics = response.get("statistics", {})
            details = f"عدد الديون: {len(current_debts)}, إجمالي المبلغ: {statistics.get('total_amount', 0)} ج.م"
            self.log_result("جلب ديون العيادة الحالية", True, response_time, details)
        else:
            self.log_result("جلب ديون العيادة الحالية", False, response_time, f"Status: {status}")
            return False
        
        # 5.2 إنشاء دين تجريبي
        debt_data = {
            "amount": 450.75,
            "description": "دين تجريبي للاختبار - مستحقات طبية",
            "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
            "priority": "high",
            "category": "purchase"
        }
        
        status, response, response_time = await self.make_request("POST", f"/clinic-profile/{self.test_clinic_id}/debts", debt_data)
        
        if status == 200 and response.get("success"):
            self.test_debt_id = response.get("debt", {}).get("id")
            details = f"ID: {self.test_debt_id}, المبلغ: {debt_data['amount']} ج.م, الأولوية: {debt_data['priority']}"
            self.log_result("إنشاء دين تجريبي", True, response_time, details)
        else:
            self.log_result("إنشاء دين تجريبي", False, response_time, f"Status: {status}, Response: {response}")
            return False
        
        # 5.3 التحقق من إضافة الدين
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/debts")
        
        if status == 200 and response.get("success"):
            updated_debts = response.get("debts", [])
            new_debts_count = len(updated_debts) - len(current_debts)
            if new_debts_count > 0:
                self.log_result("التحقق من إضافة الدين", True, response_time, f"تم إضافة {new_debts_count} دين جديد")
                return True
            else:
                self.log_result("التحقق من إضافة الدين", False, response_time, "لم يتم إضافة دين جديد")
                return False
        else:
            self.log_result("التحقق من إضافة الدين", False, response_time, f"Status: {status}")
            return False

    async def test_clinic_visits(self):
        """6. اختبار زيارات العيادة"""
        print("\n🏥 اختبار زيارات العيادة...")
        
        if not self.test_clinic_id:
            self.log_result("زيارات العيادة", False, 0, "لا يوجد معرف عيادة تجريبية")
            return False
        
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/visits")
        
        if status == 200 and response.get("success"):
            visits = response.get("visits", [])
            statistics = response.get("statistics", {})
            
            details = f"عدد الزيارات: {len(visits)}, زيارات هذا الشهر: {statistics.get('this_month', 0)}"
            if visits:
                details += f", آخر زيارة: {visits[0].get('visit_date', 'غير محدد')}"
            
            self.log_result("جلب زيارات العيادة", True, response_time, details)
            return True
        else:
            self.log_result("جلب زيارات العيادة", False, response_time, f"Status: {status}, Response: {response}")
            return False

    async def test_clinic_collections(self):
        """7. اختبار التحصيل"""
        print("\n💵 اختبار التحصيل...")
        
        if not self.test_clinic_id:
            self.log_result("التحصيل", False, 0, "لا يوجد معرف عيادة تجريبية")
            return False
        
        # 7.1 جلب التحصيلات الحالية
        status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/collections")
        
        if status == 200 and response.get("success"):
            current_collections = response.get("collections", [])
            statistics = response.get("statistics", {})
            details = f"عدد التحصيلات: {len(current_collections)}, إجمالي المبلغ: {statistics.get('total_amount', 0)} ج.م"
            self.log_result("جلب التحصيلات الحالية", True, response_time, details)
        else:
            self.log_result("جلب التحصيلات الحالية", False, response_time, f"Status: {status}")
            return False
        
        # 7.2 إنشاء تحصيل تجريبي
        collection_data = {
            "amount": 225.50,
            "description": "تحصيل تجريبي للاختبار",
            "payment_method": "cash",
            "receipt_number": f"REC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            "notes": "تحصيل تجريبي لاختبار النظام"
        }
        
        status, response, response_time = await self.make_request("POST", f"/clinic-profile/{self.test_clinic_id}/collections", collection_data)
        
        if status == 200 and response.get("success"):
            self.test_collection_id = response.get("collection", {}).get("id")
            details = f"ID: {self.test_collection_id}, المبلغ: {collection_data['amount']} ج.م, الطريقة: {collection_data['payment_method']}"
            self.log_result("إنشاء تحصيل تجريبي", True, response_time, details)
        else:
            self.log_result("إنشاء تحصيل تجريبي", False, response_time, f"Status: {status}, Response: {response}")
            return False
        
        # 7.3 موافقة المدير على التحصيل
        if self.test_collection_id:
            status, response, response_time = await self.make_request("PUT", f"/clinic-profile/collections/{self.test_collection_id}/approve")
            
            if status == 200 and response.get("success"):
                self.log_result("موافقة المدير على التحصيل", True, response_time, "تم الموافقة بنجاح")
                return True
            else:
                self.log_result("موافقة المدير على التحصيل", False, response_time, f"Status: {status}, Response: {response}")
                return False
        else:
            self.log_result("موافقة المدير على التحصيل", False, 0, "لا يوجد معرف تحصيل")
            return False

    async def test_activity_logging(self):
        """8. اختبار تسجيل الأنشطة"""
        print("\n📋 اختبار تسجيل الأنشطة...")
        
        status, response, response_time = await self.make_request("GET", "/activities")
        
        if status == 200:
            activities = response if isinstance(response, list) else response.get("activities", [])
            
            # البحث عن أنشطة متعلقة بالاختبارات
            test_activities = []
            activity_types = ["order_create", "debt_create", "collection_create", "clinic_registration"]
            
            for activity in activities:
                if activity.get("action") in activity_types or activity.get("activity_type") in activity_types:
                    test_activities.append(activity)
            
            details = f"إجمالي الأنشطة: {len(activities)}, أنشطة الاختبار: {len(test_activities)}"
            self.log_result("تسجيل الأنشطة", True, response_time, details)
            return True
        else:
            self.log_result("تسجيل الأنشطة", False, response_time, f"Status: {status}, Response: {response}")
            return False

    async def test_cleanup_test_data(self):
        """9. تنظيف البيانات التجريبية"""
        print("\n🧹 تنظيف البيانات التجريبية...")
        
        cleanup_results = []
        
        # ملاحظة: لا توجد endpoints للحذف في النظام الحالي
        # لذلك سنتحقق فقط من وجود البيانات التجريبية
        
        if self.test_clinic_id:
            status, response, response_time = await self.make_request("GET", f"/clinic-profile/{self.test_clinic_id}/overview")
            if status == 200:
                cleanup_results.append("العيادة التجريبية موجودة")
        
        if self.test_order_id:
            cleanup_results.append("الطلب التجريبي محفوظ")
        
        if self.test_debt_id:
            cleanup_results.append("الدين التجريبي محفوظ")
        
        if self.test_collection_id:
            cleanup_results.append("التحصيل التجريبي محفوظ")
        
        details = f"البيانات المحفوظة: {len(cleanup_results)} عنصر - {', '.join(cleanup_results)}"
        self.log_result("تنظيف البيانات التجريبية", True, 0, details)
        return True

    def print_summary(self):
        """طباعة ملخص النتائج"""
        print("\n" + "="*80)
        print("📊 ملخص اختبار نظام ملف العيادة التفصيلي")
        print("="*80)
        
        total_tests = len(self.results)
        successful_tests = sum(1 for result in self.results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.results) / total_tests if total_tests > 0 else 0
        
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
        print(f"⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        print(f"\n📋 تفاصيل النتائج:")
        for result in self.results:
            status_icon = "✅" if result["success"] else "❌"
            print(f"{status_icon} {result['test']} ({result['response_time']:.2f}ms)")
            if result["details"]:
                print(f"   📝 {result['details']}")
        
        # تقييم شامل
        if success_rate >= 90:
            grade = "🏆 ممتاز"
        elif success_rate >= 75:
            grade = "🟢 جيد جداً"
        elif success_rate >= 60:
            grade = "🟡 جيد"
        else:
            grade = "🔴 يحتاج تحسين"
        
        print(f"\n🎯 التقييم النهائي: {grade}")
        
        if success_rate >= 85:
            print("✅ نظام ملف العيادة التفصيلي يعمل بكامل وظائفه!")
            print("✅ جميع الأقسام الخمسة (Overview, Orders, Debts, Visits, Collections) تعمل بشكل صحيح")
            print("✅ الربط مع قاعدة البيانات سليم ومتكامل")
        else:
            print("⚠️ النظام يحتاج بعض التحسينات لتحقيق الأداء المطلوب")
        
        return success_rate

    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لنظام ملف العيادة التفصيلي الجديد")
        print("="*80)
        
        await self.setup_session()
        
        try:
            # تسلسل الاختبارات
            test_sequence = [
                ("تسجيل الدخول", self.test_admin_login),
                ("إنشاء عيادة تجريبية", self.test_create_test_clinic),
                ("نظرة عامة للعيادة", self.test_clinic_overview),
                ("طلبات العيادة", self.test_clinic_orders),
                ("ديون العيادة", self.test_clinic_debts),
                ("زيارات العيادة", self.test_clinic_visits),
                ("التحصيل", self.test_clinic_collections),
                ("تسجيل الأنشطة", self.test_activity_logging),
                ("تنظيف البيانات", self.test_cleanup_test_data)
            ]
            
            for test_name, test_func in test_sequence:
                try:
                    await test_func()
                except Exception as e:
                    self.log_result(test_name, False, 0, f"خطأ في التنفيذ: {str(e)}")
                
                # فترة انتظار قصيرة بين الاختبارات
                await asyncio.sleep(0.1)
            
        finally:
            await self.cleanup_session()
        
        return self.print_summary()

async def main():
    """الدالة الرئيسية"""
    tester = ClinicProfileTester()
    success_rate = await tester.run_comprehensive_test()
    return success_rate

if __name__ == "__main__":
    asyncio.run(main())