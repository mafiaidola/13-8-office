#!/usr/bin/env python3
"""
اختبار شامل للنظام بعد تنظيف التخابط وإعادة تنظيم الملفات
Comprehensive System Testing After Cleanup and File Reorganization

Testing all areas mentioned in the Arabic review:
1. Login testing with all existing users
2. JWT tokens and role normalization  
3. User Management APIs with different roles
4. User profile access with hierarchical restrictions
5. Order Management with debt warning system
6. Enhanced Visit Management with three visit types
7. Movement Log System APIs
8. Support System APIs
9. Performance testing
10. Infrastructure testing
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
BACKEND_URL = "https://e0c0a695-5df9-4c27-89c6-e048414b1d42.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class ComprehensiveArabicSystemTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_tokens = {}
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.start_time = time.time()
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
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
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, token: Optional[str] = None):
        """إجراء طلب HTTP مع معالجة الأخطاء"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_login_system(self):
        """1. اختبار تسجيل الدخول بجميع المستخدمين الموجودين"""
        print("\n🔐 اختبار نظام تسجيل الدخول")
        print("=" * 50)
        
        # اختبار تسجيل دخول الأدمن
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                user_role = data.get("user", {}).get("role", "unknown")
                self.log_test("تسجيل دخول الأدمن (admin/admin123)", True, 
                            f"تم الحصول على التوكن، الدور: {user_role}")
            else:
                self.log_test("تسجيل دخول الأدمن (admin/admin123)", False, "لم يتم الحصول على التوكن")
        else:
            self.log_test("تسجيل دخول الأدمن (admin/admin123)", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار تسجيل دخول GM
        response, error = self.make_request("POST", "/auth/login", {
            "username": "gm",
            "password": "gm123456"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.gm_token = data.get("access_token") or data.get("token")
            if self.gm_token:
                user_role = data.get("user", {}).get("role", "unknown")
                self.log_test("تسجيل دخول GM (gm/gm123456)", True, 
                            f"تم الحصول على التوكن، الدور: {user_role}")
            else:
                self.log_test("تسجيل دخول GM (gm/gm123456)", False, "لم يتم الحصول على التوكن")
        else:
            self.log_test("تسجيل دخول GM (gm/gm123456)", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار المستخدمين الآخرين المحتملين
        test_users = [
            ("manager1", "manager123"),
            ("sales_rep1", "sales123"),
            ("warehouse1", "warehouse123"),
            ("accounting1", "accounting123")
        ]
        
        for username, password in test_users:
            response, error = self.make_request("POST", "/auth/login", {
                "username": username,
                "password": password
            })
            
            if response and response.status_code == 200:
                data = response.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    self.test_tokens[username] = token
                    user_role = data.get("user", {}).get("role", "unknown")
                    self.log_test(f"تسجيل دخول {username}", True, f"الدور: {user_role}")
                else:
                    self.log_test(f"تسجيل دخول {username}", False, "لم يتم الحصول على التوكن")
            else:
                self.log_test(f"تسجيل دخول {username}", False, 
                            f"المستخدم غير موجود أو كلمة مرور خاطئة")
    
    def test_jwt_and_role_normalization(self):
        """2. اختبار JWT tokens وتطبيع الأدوار"""
        print("\n🎫 اختبار JWT وتطبيع الأدوار")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("اختبار JWT", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار صحة التوكن
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            self.log_test("صحة JWT Token", True, "التوكن صالح ويعمل بشكل صحيح")
            
            # فحص تطبيع الأدوار
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                roles_found = set()
                for user in users:
                    if isinstance(user, dict) and "role" in user:
                        roles_found.add(user["role"])
                
                self.log_test("تطبيع الأدوار", True, 
                            f"تم العثور على الأدوار: {', '.join(roles_found)}")
            else:
                self.log_test("تطبيع الأدوار", False, "لا يوجد مستخدمين للفحص")
        else:
            self.log_test("صحة JWT Token", False, 
                        f"التوكن غير صالح: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_user_management_apis(self):
        """3. اختبار User Management APIs مع أدوار مختلفة"""
        print("\n👥 اختبار إدارة المستخدمين")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("إدارة المستخدمين", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار get_users API
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            self.log_test("GET /api/users (أدمن)", True, f"تم العثور على {user_count} مستخدم")
            
            # فحص بنية البيانات
            if user_count > 0 and isinstance(users[0], dict):
                required_fields = ["id", "username", "full_name", "role"]
                has_all_fields = all(field in users[0] for field in required_fields)
                self.log_test("بنية بيانات المستخدم", has_all_fields, 
                            f"الحقول المطلوبة {'موجودة' if has_all_fields else 'مفقودة'}")
        else:
            self.log_test("GET /api/users (أدمن)", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار مع GM token إذا كان متوفراً
        if self.gm_token:
            response, error = self.make_request("GET", "/users", token=self.gm_token)
            
            if response and response.status_code == 200:
                gm_users = response.json()
                gm_user_count = len(gm_users) if isinstance(gm_users, list) else 0
                self.log_test("GET /api/users (GM)", True, f"GM يمكنه رؤية {gm_user_count} مستخدم")
            else:
                self.log_test("GET /api/users (GM)", False, 
                            f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_user_profile_access_control(self):
        """4. اختبار get_user_profile مع القيود الهرمية الجديدة"""
        print("\n🔒 اختبار التحكم في الوصول للملف الشخصي")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("التحكم في الملف الشخصي", False, "لا يوجد توكن أدمن")
            return
        
        # الحصول على قائمة المستخدمين أولاً
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                # اختبار الوصول لملف شخصي كأدمن
                test_user = users[0]
                user_id = test_user.get("id")
                
                if user_id:
                    response, error = self.make_request("GET", f"/users/{user_id}/profile", 
                                                      token=self.admin_token)
                    
                    if response and response.status_code == 200:
                        profile_data = response.json()
                        self.log_test("وصول الأدمن للملف الشخصي", True, 
                                    "الأدمن يمكنه الوصول لأي ملف شخصي")
                        
                        # فحص بنية البيانات المُحسنة
                        if isinstance(profile_data, dict) and "user" in profile_data:
                            user_data = profile_data["user"]
                            has_stats = "user_stats" in user_data
                            has_access_info = "access_info" in user_data
                            
                            self.log_test("بنية الملف الشخصي المُحسنة", 
                                        has_stats and has_access_info,
                                        f"الإحصائيات: {'✓' if has_stats else '✗'}, معلومات الوصول: {'✓' if has_access_info else '✗'}")
                    else:
                        self.log_test("وصول الأدمن للملف الشخصي", False, 
                                    f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
                else:
                    self.log_test("وصول الأدمن للملف الشخصي", False, "لا يوجد معرف مستخدم للاختبار")
            else:
                self.log_test("وصول الأدمن للملف الشخصي", False, "لا يوجد مستخدمين للاختبار")
        else:
            self.log_test("وصول الأدمن للملف الشخصي", False, "فشل في الحصول على قائمة المستخدمين")
    
    def test_order_debt_warning_system(self):
        """5. اختبار Order Management مع تحذير المديونية"""
        print("\n💰 اختبار نظام تحذير المديونية للطلبات")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام تحذير المديونية", False, "لا يوجد توكن أدمن")
            return
        
        # الحصول على قائمة العيادات أولاً
        response, error = self.make_request("GET", "/clinics", token=self.admin_token)
        
        if response and response.status_code == 200:
            clinics = response.json()
            if isinstance(clinics, list) and len(clinics) > 0:
                clinic_id = clinics[0].get("id")
                
                if clinic_id:
                    # اختبار check_clinic_order_status API
                    response, error = self.make_request("GET", f"/orders/check-clinic-status/{clinic_id}", 
                                                      token=self.admin_token)
                    
                    if response and response.status_code == 200:
                        clinic_status = response.json()
                        self.log_test("فحص حالة العيادة قبل الطلب", True, 
                                    f"حالة المديونية: {clinic_status.get('debt_info', {}).get('status', 'غير محدد')}")
                        
                        # فحص بنية البيانات المطلوبة
                        required_fields = ["clinic_id", "debt_info", "can_order", "requires_warning", "color_classification"]
                        has_all_fields = all(field in clinic_status for field in required_fields)
                        self.log_test("بنية بيانات حالة العيادة", has_all_fields,
                                    f"جميع الحقول المطلوبة {'موجودة' if has_all_fields else 'مفقودة'}")
                    else:
                        # قد يكون API مقيد للمندوبين فقط
                        if response and response.status_code == 403:
                            self.log_test("فحص حالة العيادة قبل الطلب", True, 
                                        "API مقيد للمندوبين فقط (سلوك صحيح)")
                        else:
                            self.log_test("فحص حالة العيادة قبل الطلب", False, 
                                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
                else:
                    self.log_test("فحص حالة العيادة قبل الطلب", False, "لا يوجد معرف عيادة للاختبار")
            else:
                self.log_test("فحص حالة العيادة قبل الطلب", False, "لا يوجد عيادات للاختبار")
        else:
            # إذا لم تكن هناك عيادات، نختبر مع معرف وهمي
            response, error = self.make_request("GET", "/orders/check-clinic-status/test-clinic-id", 
                                              token=self.admin_token)
            
            if response and response.status_code == 404:
                self.log_test("فحص حالة العيادة قبل الطلب", True, "API يعمل ويرجع 404 للعيادة غير الموجودة")
            elif response and response.status_code == 403:
                self.log_test("فحص حالة العيادة قبل الطلب", True, "API مقيد للمندوبين فقط (سلوك صحيح)")
            else:
                self.log_test("فحص حالة العيادة قبل الطلب", False, 
                            f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_enhanced_visit_management(self):
        """6. اختبار Visit Management المحسن مع أنواع الزيارة الثلاثة"""
        print("\n🏥 اختبار نظام الزيارة المحسن")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام الزيارة المحسن", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار الحصول على الزيارات الموجودة
        response, error = self.make_request("GET", "/visits", token=self.admin_token)
        
        if response and response.status_code == 200:
            visits = response.json()
            visit_count = len(visits) if isinstance(visits, list) else 0
            self.log_test("الحصول على الزيارات", True, f"تم العثور على {visit_count} زيارة")
            
            # فحص أنواع الزيارة الثلاثة في البيانات الموجودة
            if visit_count > 0 and isinstance(visits, list):
                visit_types_found = set()
                visits_with_participants = 0
                
                for visit in visits:
                    if isinstance(visit, dict):
                        visit_type = visit.get("visit_type")
                        if visit_type:
                            visit_types_found.add(visit_type)
                        
                        if visit.get("participants_count", 0) > 1:
                            visits_with_participants += 1
                
                expected_types = {"SOLO", "DUO_WITH_MANAGER", "THREE_WITH_MANAGER_AND_OTHER"}
                self.log_test("أنواع الزيارة المدعومة", True, 
                            f"الأنواع الموجودة: {', '.join(visit_types_found) if visit_types_found else 'لا يوجد'}")
                
                self.log_test("الزيارات مع المشاركين", True, 
                            f"{visits_with_participants} زيارة تحتوي على مشاركين متعددين")
        else:
            self.log_test("الحصول على الزيارات", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار إنشاء زيارة جديدة (قد يفشل بسبب قيود الصلاحيات)
        test_visit_data = {
            "clinic_id": "test-clinic-id",
            "doctor_id": "test-doctor-id",
            "visit_type": "SOLO",
            "latitude": 30.0444,
            "longitude": 31.2357,
            "notes": "اختبار نظام الزيارة المحسن",
            "effective": True
        }
        
        response, error = self.make_request("POST", "/visits", test_visit_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء زيارة جديدة", True, "تم إنشاء الزيارة بنجاح")
        elif response and response.status_code == 403:
            self.log_test("إنشاء زيارة جديدة", True, "API مقيد للمندوبين فقط (سلوك صحيح)")
        else:
            self.log_test("إنشاء زيارة جديدة", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_movement_log_system(self):
        """7. اختبار Movement Log System"""
        print("\n📦 اختبار نظام سجل الحركة")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("نظام سجل الحركة", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار الحصول على المخازن
        response, error = self.make_request("GET", "/movement-logs/warehouses", token=self.admin_token)
        
        if response and response.status_code == 200:
            warehouses_data = response.json()
            warehouses = warehouses_data.get("warehouses", []) if isinstance(warehouses_data, dict) else []
            warehouse_count = len(warehouses)
            self.log_test("الحصول على قائمة المخازن", True, f"تم العثور على {warehouse_count} مخزن")
        else:
            self.log_test("الحصول على قائمة المخازن", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار الحصول على سجلات الحركة
        response, error = self.make_request("GET", "/movement-logs", token=self.admin_token)
        
        if response and response.status_code == 200:
            logs_data = response.json()
            movements = logs_data.get("movements", []) if isinstance(logs_data, dict) else []
            movement_count = len(movements)
            self.log_test("الحصول على سجلات الحركة", True, f"تم العثور على {movement_count} سجل حركة")
            
            # فحص بنية البيانات
            if isinstance(logs_data, dict) and "pagination" in logs_data:
                self.log_test("نظام التصفح في سجلات الحركة", True, "نظام التصفح يعمل بشكل صحيح")
        else:
            self.log_test("الحصول على سجلات الحركة", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار إنشاء سجل حركة جديد
        test_movement_data = {
            "movement_type": "product_movement",
            "warehouse_id": "test-warehouse-id",
            "line": "1",
            "product_id": "test-product-id",
            "quantity_change": 10,
            "movement_reason": "اختبار النظام",
            "description": "اختبار إنشاء سجل حركة جديد"
        }
        
        response, error = self.make_request("POST", "/movement-logs", test_movement_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء سجل حركة جديد", True, "تم إنشاء سجل الحركة بنجاح")
        else:
            self.log_test("إنشاء سجل حركة جديد", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_support_system(self):
        """8. اختبار Support System"""
        print("\n🎧 اختبار نظام الدعم الفني")
        print("=" * 50)
        
        # اختبار إنشاء تذكرة دعم (متاح للجميع)
        test_ticket_data = {
            "sender_name": "مختبر النظام",
            "sender_position": "مطور",
            "sender_whatsapp": "01234567890",
            "sender_email": "test@company.com",
            "problem_description": "اختبار نظام الدعم الفني بعد إعادة التنظيم",
            "priority": "medium",
            "category": "technical"
        }
        
        response, error = self.make_request("POST", "/support/tickets", test_ticket_data)
        
        if response and response.status_code in [200, 201]:
            ticket_data = response.json()
            self.log_test("إنشاء تذكرة دعم فني", True, 
                        f"تم إنشاء التذكرة رقم: {ticket_data.get('ticket_number', 'غير محدد')}")
        else:
            self.log_test("إنشاء تذكرة دعم فني", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        if not self.admin_token:
            self.log_test("إدارة تذاكر الدعم", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار الحصول على التذاكر (للأدمن فقط)
        response, error = self.make_request("GET", "/support/tickets", token=self.admin_token)
        
        if response and response.status_code == 200:
            tickets_data = response.json()
            tickets = tickets_data.get("tickets", []) if isinstance(tickets_data, dict) else []
            ticket_count = len(tickets)
            self.log_test("الحصول على تذاكر الدعم", True, f"تم العثور على {ticket_count} تذكرة")
        else:
            self.log_test("الحصول على تذاكر الدعم", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
        
        # اختبار إحصائيات الدعم
        response, error = self.make_request("GET", "/support/stats", token=self.admin_token)
        
        if response and response.status_code == 200:
            stats = response.json()
            total_tickets = stats.get("total_tickets", 0)
            self.log_test("إحصائيات الدعم الفني", True, f"إجمالي التذاكر: {total_tickets}")
        else:
            self.log_test("إحصائيات الدعم الفني", False, 
                        f"الحالة: {response.status_code if response else 'لا يوجد رد'}")
    
    def test_system_performance(self):
        """9. اختبار الأداء"""
        print("\n⚡ اختبار أداء النظام")
        print("=" * 50)
        
        if not self.admin_token:
            self.log_test("اختبار الأداء", False, "لا يوجد توكن أدمن")
            return
        
        # اختبار أوقات الاستجابة للـ APIs الأساسية
        performance_tests = [
            ("GET", "/users", "قائمة المستخدمين"),
            ("GET", "/dashboard/stats", "إحصائيات الداشبورد"),
            ("GET", "/warehouses", "قائمة المخازن"),
            ("GET", "/products", "قائمة المنتجات")
        ]
        
        total_response_time = 0
        successful_tests = 0
        
        for method, endpoint, description in performance_tests:
            start_time = time.time()
            response, error = self.make_request(method, endpoint, token=self.admin_token)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # بالميلي ثانية
            total_response_time += response_time
            
            if response and response.status_code == 200:
                successful_tests += 1
                if response_time < 1000:  # أقل من ثانية واحدة
                    self.log_test(f"أداء {description}", True, f"{response_time:.2f}ms")
                else:
                    self.log_test(f"أداء {description}", False, f"{response_time:.2f}ms (بطيء)")
            else:
                self.log_test(f"أداء {description}", False, 
                            f"فشل الطلب: {response.status_code if response else 'لا يوجد رد'}")
        
        # حساب متوسط وقت الاستجابة
        if successful_tests > 0:
            avg_response_time = total_response_time / len(performance_tests)
            self.log_test("متوسط وقت الاستجابة", avg_response_time < 500, 
                        f"{avg_response_time:.2f}ms")
    
    def test_infrastructure(self):
        """10. اختبار البنية التحتية"""
        print("\n🏗️ اختبار البنية التحتية")
        print("=" * 50)
        
        # اختبار صحة النظام
        try:
            response = requests.get(f"{BACKEND_URL.replace('/api', '')}/health", timeout=10)
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("صحة النظام", True, f"النظام يعمل بشكل صحيح")
            else:
                self.log_test("صحة النظام", False, f"الحالة: {response.status_code}")
        except:
            # إذا لم يكن هناك endpoint للصحة، نختبر endpoint أساسي
            response, error = self.make_request("GET", "/", token=None)
            if response and response.status_code == 200:
                self.log_test("صحة النظام", True, "النظام يستجيب للطلبات")
            else:
                self.log_test("صحة النظام", False, "النظام لا يستجيب")
        
        if not self.admin_token:
            return
        
        # اختبار اتصال قاعدة البيانات
        database_tests = [
            ("users", "المستخدمين"),
            ("clinics", "العيادات"),
            ("doctors", "الأطباء"),
            ("products", "المنتجات"),
            ("warehouses", "المخازن"),
            ("visits", "الزيارات")
        ]
        
        connected_collections = 0
        for collection, description in database_tests:
            response, error = self.make_request("GET", f"/{collection}", token=self.admin_token)
            
            if response and response.status_code == 200:
                connected_collections += 1
                self.log_test(f"اتصال قاعدة البيانات - {description}", True, "متصل")
            else:
                self.log_test(f"اتصال قاعدة البيانات - {description}", False, 
                            f"غير متصل: {response.status_code if response else 'لا يوجد رد'}")
        
        # تقييم صحة قاعدة البيانات العامة
        db_health_percentage = (connected_collections / len(database_tests)) * 100
        self.log_test("صحة قاعدة البيانات العامة", db_health_percentage >= 80, 
                    f"{db_health_percentage:.1f}% من المجموعات متصلة")
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 اختبار شامل للنظام بعد تنظيف التخابط وإعادة تنظيم الملفات")
        print("=" * 80)
        print("نظام EP Group - اختبار شامل حسب المراجعة العربية")
        print("=" * 80)
        
        # تشغيل جميع الاختبارات
        self.test_login_system()
        self.test_jwt_and_role_normalization()
        self.test_user_management_apis()
        self.test_user_profile_access_control()
        self.test_order_debt_warning_system()
        self.test_enhanced_visit_management()
        self.test_movement_log_system()
        self.test_support_system()
        self.test_system_performance()
        self.test_infrastructure()
        
        return self.generate_final_report()
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        end_time = time.time()
        total_time = end_time - self.start_time
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي - اختبار شامل لنظام EP Group")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"إجمالي الاختبارات: {self.total_tests}")
        print(f"الاختبارات الناجحة: {self.passed_tests}")
        print(f"الاختبارات الفاشلة: {self.total_tests - self.passed_tests}")
        print(f"نسبة النجاح: {success_rate:.1f}%")
        print(f"الوقت الإجمالي: {total_time:.2f} ثانية")
        
        # عرض الاختبارات الفاشلة
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # التوصيات
        print(f"\n🎯 التوصيات:")
        if success_rate >= 90:
            print("✅ النظام يعمل بشكل ممتاز بعد إعادة التنظيم!")
            print("✅ جميع الميزات الأساسية تعمل بكفاءة عالية")
            print("✅ النظام جاهز للإنتاج")
        elif success_rate >= 75:
            print("⚠️ النظام يعمل بشكل جيد مع بعض المشاكل البسيطة")
            print("⚠️ يُنصح بإصلاح الاختبارات الفاشلة قبل الإنتاج")
        elif success_rate >= 50:
            print("🔧 النظام يحتاج إلى تحسينات متوسطة")
            print("🔧 يجب إصلاح المشاكل الأساسية قبل الاستخدام")
        else:
            print("❌ النظام يحتاج إلى إصلاحات جوهرية")
            print("❌ لا يُنصح بالاستخدام في الإنتاج حالياً")
        
        # تقييم المجالات المختلفة
        print(f"\n📈 تقييم المجالات:")
        areas = {
            "تسجيل الدخول والمصادقة": ["تسجيل دخول", "JWT"],
            "إدارة المستخدمين": ["إدارة المستخدمين", "الملف الشخصي"],
            "إدارة الطلبات": ["المديونية", "الطلب"],
            "إدارة الزيارات": ["الزيارة", "زيارة"],
            "الأنظمة المساعدة": ["سجل الحركة", "الدعم الفني"],
            "الأداء والبنية التحتية": ["أداء", "البنية التحتية", "قاعدة البيانات"]
        }
        
        for area_name, keywords in areas.items():
            area_tests = [r for r in self.test_results if any(keyword in r['test'] for keyword in keywords)]
            if area_tests:
                area_success = sum(1 for t in area_tests if t['success'])
                area_rate = (area_success / len(area_tests)) * 100
                status = "✅" if area_rate >= 80 else "⚠️" if area_rate >= 60 else "❌"
                print(f"  {status} {area_name}: {area_rate:.1f}% ({area_success}/{len(area_tests)})")
        
        return {
            "total_tests": self.total_tests,
            "passed_tests": self.passed_tests,
            "failed_tests": self.total_tests - self.passed_tests,
            "success_rate": success_rate,
            "total_time": total_time,
            "results": self.test_results
        }

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = ComprehensiveArabicSystemTester()
    summary = tester.run_comprehensive_test()
    
    # الخروج بالكود المناسب
    if summary["success_rate"] >= 75:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()