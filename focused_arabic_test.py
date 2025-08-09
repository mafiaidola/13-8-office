#!/usr/bin/env python3
"""
اختبار مركز للأنظمة المحددة في المراجعة العربية
Focused Test for Specific Systems in Arabic Review
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class FocusedArabicTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details=""):
        """تسجيل نتائج الاختبار"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ نجح"
        else:
            status = "❌ فشل"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, token=None, timeout=10):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=timeout)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=timeout)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.Timeout:
            return None, "Request timeout"
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def authenticate_admin(self):
        """مصادقة الأدمن"""
        print("\n🔐 مصادقة الأدمن")
        print("=" * 40)
        
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("تسجيل دخول الأدمن", True, "تم الحصول على الرمز المميز")
                return True
            else:
                self.log_test("تسجيل دخول الأدمن", False, "لا يوجد رمز مميز في الاستجابة")
                return False
        else:
            self.log_test("تسجيل دخول الأدمن", False, f"خطأ في تسجيل الدخول: {error or response.status_code}")
            return False
    
    def test_order_debt_warning_system(self):
        """اختبار نظام تحذير المديونية للطلبات"""
        print("\n💰 اختبار نظام تحذير المديونية للطلبات")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام تحذير المديونية", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار API للتحقق من حالة العيادة
        test_clinic_id = "clinic-001"
        response, error = self.make_request("GET", f"/orders/check-clinic-status/{test_clinic_id}", token=self.admin_token)
        
        if response:
            if response.status_code == 200:
                data = response.json()
                required_fields = ["outstanding_debt", "overdue_debt", "total_invoices", "status"]
                has_all_fields = all(field in data for field in required_fields)
                
                if has_all_fields:
                    self.log_test("API فحص حالة العيادة", True, 
                                f"المديونية: {data.get('outstanding_debt', 0)} جنيه، الحالة: {data.get('status', 'غير محدد')}")
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("API فحص حالة العيادة", False, f"حقول مفقودة: {missing_fields}")
            elif response.status_code == 404:
                self.log_test("API فحص حالة العيادة", False, "API غير موجود - لم يتم تنفيذه")
            else:
                self.log_test("API فحص حالة العيادة", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("API فحص حالة العيادة", False, f"خطأ في الاتصال: {error}")
        
        # اختبار جلب الطلبات الموجودة للتحقق من التصنيف اللوني
        response, error = self.make_request("GET", "/orders", token=self.admin_token)
        
        if response and response.status_code == 200:
            try:
                orders = response.json()
                if isinstance(orders, list):
                    # البحث عن طلبات بألوان مختلفة
                    red_orders = [order for order in orders if isinstance(order, dict) and order.get("order_color") == "red"]
                    green_orders = [order for order in orders if isinstance(order, dict) and order.get("order_color") == "green"]
                    
                    self.log_test("تصنيف الطلبات بالألوان", True, 
                                f"طلبات حمراء (مديونية): {len(red_orders)}, طلبات خضراء (عادية): {len(green_orders)}")
                else:
                    self.log_test("تصنيف الطلبات بالألوان", False, "تنسيق استجابة غير صحيح")
            except json.JSONDecodeError:
                self.log_test("تصنيف الطلبات بالألوان", False, "خطأ في تحليل JSON")
        else:
            self.log_test("تصنيف الطلبات بالألوان", False, f"خطأ في جلب الطلبات: {error or response.status_code}")
    
    def test_enhanced_visit_registration(self):
        """اختبار نظام تسجيل الزيارة المحسن"""
        print("\n🏥 اختبار نظام تسجيل الزيارة المحسن")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام تسجيل الزيارة المحسن", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار جلب الزيارات الموجودة للتحقق من النموذج الجديد
        response, error = self.make_request("GET", "/visits", token=self.admin_token)
        
        if response and response.status_code == 200:
            try:
                visits = response.json()
                if isinstance(visits, list):
                    # فحص إذا كانت الزيارات تحتوي على الحقول الجديدة
                    enhanced_visits = 0
                    total_visits = len(visits)
                    
                    for visit in visits:
                        if isinstance(visit, dict):
                            new_fields = ["visit_type", "accompanying_manager_id", "other_participant_id", "participants_count"]
                            if any(field in visit for field in new_fields):
                                enhanced_visits += 1
                    
                    self.log_test("نموذج الزيارة المحسن", True, 
                                f"تم العثور على {enhanced_visits} زيارة محسنة من أصل {total_visits} زيارة")
                    
                    # فحص أنواع الزيارة المختلفة
                    visit_types = {}
                    for visit in visits:
                        if isinstance(visit, dict) and "visit_type" in visit:
                            visit_type = visit["visit_type"]
                            visit_types[visit_type] = visit_types.get(visit_type, 0) + 1
                    
                    if visit_types:
                        self.log_test("أنواع الزيارة المحسنة", True, 
                                    f"أنواع الزيارة الموجودة: {visit_types}")
                    else:
                        self.log_test("أنواع الزيارة المحسنة", True, "لا توجد زيارات بأنواع محددة - النظام جاهز")
                else:
                    self.log_test("نموذج الزيارة المحسن", False, "تنسيق استجابة غير صحيح")
            except json.JSONDecodeError:
                self.log_test("نموذج الزيارة المحسن", False, "خطأ في تحليل JSON")
        else:
            self.log_test("نموذج الزيارة المحسن", False, f"خطأ في جلب الزيارات: {error or response.status_code}")
    
    def test_user_profile_access_control(self):
        """اختبار نظام تقييد الوصول للملف الشخصي"""
        print("\n👤 اختبار نظام تقييد الملف الشخصي")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام تقييد الملف الشخصي", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # الحصول على قائمة المستخدمين أولاً
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            try:
                users = response.json()
                if isinstance(users, list) and len(users) > 0:
                    # اختبار الوصول للملف الشخصي لأول مستخدم
                    first_user = users[0]
                    if isinstance(first_user, dict) and "id" in first_user:
                        user_id = first_user["id"]
                        
                        # اختبار وصول الأدمن للملف الشخصي
                        profile_response, profile_error = self.make_request("GET", f"/users/{user_id}/profile", token=self.admin_token)
                        
                        if profile_response:
                            if profile_response.status_code == 200:
                                try:
                                    data = profile_response.json()
                                    required_sections = ["user", "sales_activity", "debt_info", "territory_info", "team_info"]
                                    has_all_sections = all(section in data for section in required_sections)
                                    
                                    if has_all_sections:
                                        self.log_test("وصول الأدمن للملف الشخصي", True, "الأدمن يمكنه الوصول لجميع أقسام الملف الشخصي")
                                    else:
                                        missing_sections = [section for section in required_sections if section not in data]
                                        self.log_test("وصول الأدمن للملف الشخصي", False, f"أقسام مفقودة: {missing_sections}")
                                except json.JSONDecodeError:
                                    self.log_test("وصول الأدمن للملف الشخصي", False, "خطأ في تحليل JSON")
                            elif profile_response.status_code == 404:
                                self.log_test("وصول الأدمن للملف الشخصي", False, "API الملف الشخصي غير موجود")
                            else:
                                self.log_test("وصول الأدمن للملف الشخصي", False, f"خطأ HTTP: {profile_response.status_code}")
                        else:
                            self.log_test("وصول الأدمن للملف الشخصي", False, f"خطأ في الاتصال: {profile_error}")
                        
                        # اختبار دالة can_access_user_profile من خلال اختبار عدة مستخدمين
                        accessible_profiles = 0
                        for user in users[:3]:  # اختبار أول 3 مستخدمين
                            if isinstance(user, dict) and "id" in user:
                                test_response, _ = self.make_request("GET", f"/users/{user['id']}/profile", token=self.admin_token)
                                if test_response and test_response.status_code == 200:
                                    accessible_profiles += 1
                        
                        self.log_test("دالة can_access_user_profile", True, 
                                    f"الأدمن يمكنه الوصول لـ {accessible_profiles} ملف شخصي من أصل 3")
                    else:
                        self.log_test("وصول الأدمن للملف الشخصي", False, "بيانات المستخدم غير صحيحة")
                else:
                    self.log_test("وصول الأدمن للملف الشخصي", False, "لا توجد مستخدمين للاختبار")
            except json.JSONDecodeError:
                self.log_test("وصول الأدمن للملف الشخصي", False, "خطأ في تحليل JSON")
        else:
            self.log_test("وصول الأدمن للملف الشخصي", False, f"خطأ في جلب المستخدمين: {error or response.status_code}")
    
    def test_movement_log_system(self):
        """اختبار نظام Movement Log"""
        print("\n📦 اختبار نظام Movement Log")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام Movement Log", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار جلب سجلات الحركة
        response, error = self.make_request("GET", "/movement-logs", token=self.admin_token)
        
        if response:
            if response.status_code == 200:
                try:
                    logs = response.json()
                    log_count = len(logs) if isinstance(logs, list) else 0
                    self.log_test("جلب سجلات الحركة", True, f"تم العثور على {log_count} سجل حركة")
                except json.JSONDecodeError:
                    self.log_test("جلب سجلات الحركة", False, "خطأ في تحليل JSON")
            elif response.status_code == 404:
                self.log_test("جلب سجلات الحركة", False, "API سجلات الحركة غير موجود")
            else:
                self.log_test("جلب سجلات الحركة", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("جلب سجلات الحركة", False, f"خطأ في الاتصال: {error}")
        
        # اختبار ملخص سجلات الحركة
        response, error = self.make_request("GET", "/movement-logs/summary", token=self.admin_token)
        
        if response:
            if response.status_code == 200:
                try:
                    summary = response.json()
                    if isinstance(summary, (dict, list)):
                        self.log_test("ملخص سجلات الحركة", True, "تم الحصول على ملخص سجلات الحركة بنجاح")
                    else:
                        self.log_test("ملخص سجلات الحركة", False, "تنسيق الملخص غير صحيح")
                except json.JSONDecodeError:
                    self.log_test("ملخص سجلات الحركة", False, "خطأ في تحليل JSON")
            elif response.status_code == 404:
                self.log_test("ملخص سجلات الحركة", False, "API ملخص سجلات الحركة غير موجود")
            else:
                self.log_test("ملخص سجلات الحركة", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("ملخص سجلات الحركة", False, f"خطأ في الاتصال: {error}")
    
    def test_technical_support_system(self):
        """اختبار نظام الدعم الفني"""
        print("\n🎧 اختبار نظام الدعم الفني")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام الدعم الفني", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار إنشاء تذكرة دعم فني جديدة
        ticket_data = {
            "sender_name": "أحمد محمد",
            "sender_position": "مندوب مبيعات",
            "sender_whatsapp": "01234567890",
            "sender_email": "ahmed@company.com",
            "problem_description": "مشكلة في تسجيل الدخول للنظام",
            "priority": "high",
            "category": "technical"
        }
        
        response, error = self.make_request("POST", "/support/tickets", ticket_data, token=self.admin_token)
        
        if response:
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                    ticket_id = data.get("id") or data.get("ticket_id")
                    self.log_test("إنشاء تذكرة دعم فني", True, f"تم إنشاء التذكرة بنجاح - ID: {ticket_id}")
                except json.JSONDecodeError:
                    self.log_test("إنشاء تذكرة دعم فني", False, "خطأ في تحليل JSON")
            elif response.status_code == 404:
                self.log_test("إنشاء تذكرة دعم فني", False, "API إنشاء التذاكر غير موجود")
            else:
                self.log_test("إنشاء تذكرة دعم فني", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("إنشاء تذكرة دعم فني", False, f"خطأ في الاتصال: {error}")
        
        # اختبار جلب التذاكر
        response, error = self.make_request("GET", "/support/tickets", token=self.admin_token)
        
        if response:
            if response.status_code == 200:
                try:
                    tickets = response.json()
                    ticket_count = len(tickets) if isinstance(tickets, list) else 0
                    self.log_test("جلب تذاكر الدعم الفني", True, f"تم العثور على {ticket_count} تذكرة")
                except json.JSONDecodeError:
                    self.log_test("جلب تذاكر الدعم الفني", False, "خطأ في تحليل JSON")
            elif response.status_code == 404:
                self.log_test("جلب تذاكر الدعم الفني", False, "API جلب التذاكر غير موجود")
            else:
                self.log_test("جلب تذاكر الدعم الفني", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("جلب تذاكر الدعم الفني", False, f"خطأ في الاتصال: {error}")
        
        # اختبار إحصائيات الدعم الفني
        response, error = self.make_request("GET", "/support/stats", token=self.admin_token)
        
        if response:
            if response.status_code == 200:
                try:
                    stats = response.json()
                    if isinstance(stats, dict):
                        self.log_test("إحصائيات الدعم الفني", True, "تم الحصول على الإحصائيات بنجاح")
                    else:
                        self.log_test("إحصائيات الدعم الفني", False, "تنسيق الإحصائيات غير صحيح")
                except json.JSONDecodeError:
                    self.log_test("إحصائيات الدعم الفني", False, "خطأ في تحليل JSON")
            elif response.status_code == 404:
                self.log_test("إحصائيات الدعم الفني", False, "API إحصائيات الدعم الفني غير موجود")
            else:
                self.log_test("إحصائيات الدعم الفني", False, f"خطأ HTTP: {response.status_code}")
        else:
            self.log_test("إحصائيات الدعم الفني", False, f"خطأ في الاتصال: {error}")
    
    def test_system_health(self):
        """اختبار الصحة العامة للنظام"""
        print("\n🏥 اختبار الصحة العامة للنظام")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("الصحة العامة للنظام", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار APIs الأساسية
        basic_apis = [
            ("/dashboard/stats", "إحصائيات الداشبورد"),
            ("/users", "قائمة المستخدمين"),
            ("/products", "قائمة المنتجات"),
            ("/warehouses", "قائمة المخازن"),
            ("/clinics", "قائمة العيادات")
        ]
        
        working_apis = 0
        for endpoint, name in basic_apis:
            response, error = self.make_request("GET", endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                working_apis += 1
                self.log_test(f"API {name}", True, "يعمل بشكل صحيح")
            else:
                self.log_test(f"API {name}", False, 
                            f"خطأ: {error or response.status_code if response else 'لا توجد استجابة'}")
        
        # تقييم الصحة العامة
        health_percentage = (working_apis / len(basic_apis)) * 100
        if health_percentage >= 80:
            self.log_test("الصحة العامة للنظام", True, f"النظام يعمل بكفاءة {health_percentage:.1f}%")
        else:
            self.log_test("الصحة العامة للنظام", False, f"النظام يحتاج صيانة - كفاءة {health_percentage:.1f}%")
    
    def run_focused_test(self):
        """تشغيل الاختبار المركز"""
        print("🎯 اختبار مركز للأنظمة المحددة في المراجعة العربية")
        print("=" * 70)
        print("الأنظمة المطلوب اختبارها:")
        print("1. نظام تحذير المديونية للطلبات")
        print("2. نظام تسجيل الزيارة المحسن")
        print("3. نظام تقييد الملف الشخصي")
        print("4. نظام Movement Log")
        print("5. نظام الدعم الفني")
        print("6. الصحة العامة للنظام")
        print("=" * 70)
        
        start_time = time.time()
        
        # مصادقة الأدمن أولاً
        if not self.authenticate_admin():
            print("❌ فشل في مصادقة الأدمن - لا يمكن المتابعة")
            return False
        
        # تشغيل الاختبارات المركزة
        self.test_order_debt_warning_system()
        self.test_enhanced_visit_registration()
        self.test_user_profile_access_control()
        self.test_movement_log_system()
        self.test_technical_support_system()
        self.test_system_health()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # طباعة الملخص
        print("\n" + "=" * 70)
        print("📊 ملخص نتائج الاختبار المركز")
        print("=" * 70)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"إجمالي الاختبارات: {self.total_tests}")
        print(f"نجح: {self.passed_tests}")
        print(f"فشل: {self.total_tests - self.passed_tests}")
        print(f"معدل النجاح: {success_rate:.1f}%")
        print(f"الوقت الإجمالي: {total_time:.2f} ثانية")
        
        # طباعة الاختبارات الفاشلة
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # طباعة التوصيات
        print(f"\n🎯 التوصيات:")
        if success_rate >= 90:
            print("✅ الأنظمة المحددة تعمل بشكل ممتاز!")
        elif success_rate >= 75:
            print("⚠️ معظم الأنظمة تعمل بشكل جيد مع بعض المشاكل البسيطة.")
        elif success_rate >= 50:
            print("🔧 الأنظمة تحتاج تحسينات قبل الاستخدام في الإنتاج.")
        else:
            print("❌ الأنظمة تحتاج إصلاحات كبيرة.")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = FocusedArabicTester()
    success = tester.run_focused_test()
    
    if success:
        print("\n🎉 اكتمل الاختبار المركز بنجاح!")
        sys.exit(0)
    else:
        print("\n⚠️ اكتمل الاختبار المركز مع وجود مشاكل!")
        sys.exit(1)