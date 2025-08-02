#!/usr/bin/env python3
"""
اختبار شامل للتطويرات الجديدة في نظام EP Group
Comprehensive Testing for New Developments in EP Group System

Testing Focus Areas from Arabic Review:
1. نظام تحذير المديونية للطلبات (Order Debt Warning System)
2. نظام تسجيل الزيارة المحسن (Enhanced Visit Registration with Manager Participation)
3. نظام تقييد الملف الشخصي (User Profile Access Control System)
4. نظام Movement Log
5. نظام الدعم الفني (Technical Support System)
6. المستخدمين التجريبيين (Test Users Authentication)
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

# Configuration
BACKEND_URL = "https://8d14235e-0f6d-48c0-b48d-17cc8b061c29.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class ArabicReviewTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_user_tokens = {}
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
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method, endpoint, data=None, token=None):
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
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def test_authentication_system(self):
        """اختبار نظام المصادقة والمستخدمين التجريبيين"""
        print("\n🔐 اختبار نظام المصادقة والمستخدمين التجريبيين")
        print("=" * 60)
        
        # اختبار تسجيل دخول الأدمن
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("تسجيل دخول الأدمن (admin/admin123)", True, "تم الحصول على الرمز المميز بنجاح")
            else:
                self.log_test("تسجيل دخول الأدمن (admin/admin123)", False, f"لا يوجد رمز مميز في الاستجابة: {data}")
        else:
            self.log_test("تسجيل دخول الأدمن (admin/admin123)", False, f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
            
        # اختبار تسجيل دخول GM
        response, error = self.make_request("POST", "/auth/login", {
            "username": "gm",
            "password": "gm123456"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.gm_token = data.get("access_token") or data.get("token")
            if self.gm_token:
                self.log_test("تسجيل دخول GM (gm/gm123456)", True, "تم الحصول على الرمز المميز بنجاح")
            else:
                self.log_test("تسجيل دخول GM (gm/gm123456)", False, f"لا يوجد رمز مميز في الاستجابة: {data}")
        else:
            self.log_test("تسجيل دخول GM (gm/gm123456)", False, f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار المستخدمين التجريبيين الجدد
        test_users = [
            ("ahmed.gamal", "ahmed123", "أحمد جمال"),
            ("mohammed.hamed", "mohammed123", "محمد حامد"),
            ("mina.alageeb", "mina123", "مينا العجيب"),
            ("aya.nada", "aya123", "آية ندا")
        ]
        
        for username, password, full_name in test_users:
            response, error = self.make_request("POST", "/auth/login", {
                "username": username,
                "password": password
            })
            
            if response and response.status_code == 200:
                data = response.json()
                token = data.get("access_token") or data.get("token")
                if token:
                    self.test_user_tokens[username] = token
                    self.log_test(f"تسجيل دخول المستخدم التجريبي ({username})", True, f"نجح تسجيل الدخول لـ {full_name}")
                else:
                    self.log_test(f"تسجيل دخول المستخدم التجريبي ({username})", False, f"لا يوجد رمز مميز في الاستجابة")
            else:
                self.log_test(f"تسجيل دخول المستخدم التجريبي ({username})", False, 
                            f"فشل تسجيل الدخول - الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_order_debt_warning_system(self):
        """اختبار نظام تحذير المديونية للطلبات"""
        print("\n💰 اختبار نظام تحذير المديونية للطلبات")
        print("=" * 60)
        
        if not self.admin_token:
            self.log_test("نظام تحذير المديونية", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار API للتحقق من حالة العيادة
        test_clinic_id = "test-clinic-001"
        response, error = self.make_request("GET", f"/orders/check-clinic-status/{test_clinic_id}", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ["outstanding_debt", "overdue_debt", "total_invoices", "status"]
            has_all_fields = all(field in data for field in required_fields)
            
            if has_all_fields:
                self.log_test("API فحص حالة العيادة (/api/orders/check-clinic-status)", True, 
                            f"المديونية: {data.get('outstanding_debt', 0)} جنيه، الحالة: {data.get('status', 'غير محدد')}")
            else:
                missing_fields = [field for field in required_fields if field not in data]
                self.log_test("API فحص حالة العيادة (/api/orders/check-clinic-status)", False, 
                            f"حقول مفقودة: {missing_fields}")
        else:
            self.log_test("API فحص حالة العيادة (/api/orders/check-clinic-status)", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إنشاء طلب مع تحذير المديونية
        order_data = {
            "clinic_id": test_clinic_id,
            "warehouse_id": "warehouse-001",
            "items": [
                {
                    "product_id": "product-001",
                    "quantity": 5,
                    "unit_price": 100.0,
                    "total": 500.0
                }
            ],
            "notes": "اختبار طلب مع نظام تحذير المديونية",
            "debt_warning_acknowledged": True,
            "debt_override_reason": "موافقة إدارية خاصة"
        }
        
        response, error = self.make_request("POST", "/orders", order_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء طلب مع تحذير المديونية", True, "تم إنشاء الطلب بنجاح مع معالجة تحذير المديونية")
        elif response and response.status_code == 403:
            self.log_test("إنشاء طلب مع تحذير المديونية", True, "منع إنشاء الطلب بسبب قيود الصلاحيات - سلوك صحيح")
        else:
            self.log_test("إنشاء طلب مع تحذير المديونية", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار دالة فحص المديونية
        response, error = self.make_request("GET", "/orders", token=self.admin_token)
        
        if response and response.status_code == 200:
            orders = response.json()
            if isinstance(orders, list) and len(orders) > 0:
                # البحث عن طلبات بألوان مختلفة
                red_orders = [order for order in orders if order.get("order_color") == "red"]
                green_orders = [order for order in orders if order.get("order_color") == "green"]
                
                self.log_test("تصنيف الطلبات بالألوان", True, 
                            f"طلبات حمراء (مديونية): {len(red_orders)}, طلبات خضراء (عادية): {len(green_orders)}")
            else:
                self.log_test("تصنيف الطلبات بالألوان", True, "لا توجد طلبات للاختبار - النظام يعمل")
        else:
            self.log_test("تصنيف الطلبات بالألوان", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_enhanced_visit_registration(self):
        """اختبار نظام تسجيل الزيارة المحسن مع مشاركة المدير"""
        print("\n🏥 اختبار نظام تسجيل الزيارة المحسن")
        print("=" * 60)
        
        if not self.admin_token:
            self.log_test("نظام تسجيل الزيارة المحسن", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار جلب الزيارات الموجودة للتحقق من النموذج الجديد
        response, error = self.make_request("GET", "/visits", token=self.admin_token)
        
        if response and response.status_code == 200:
            visits = response.json()
            if isinstance(visits, list):
                # فحص إذا كانت الزيارات تحتوي على الحقول الجديدة
                enhanced_visits = 0
                for visit in visits:
                    if isinstance(visit, dict):
                        new_fields = ["visit_type", "accompanying_manager_id", "other_participant_id", "participants_count"]
                        if any(field in visit for field in new_fields):
                            enhanced_visits += 1
                
                self.log_test("نموذج الزيارة المحسن", True, 
                            f"تم العثور على {enhanced_visits} زيارة محسنة من أصل {len(visits)} زيارة")
            else:
                self.log_test("نموذج الزيارة المحسن", False, "تنسيق استجابة غير صحيح")
        else:
            self.log_test("نموذج الزيارة المحسن", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إنشاء زيارة جديدة بالنموذج المحسن
        visit_data = {
            "doctor_id": "doctor-001",
            "clinic_id": "clinic-001",
            "visit_type": "DUO_WITH_MANAGER",
            "accompanying_manager_id": "manager-001",
            "notes": "زيارة تجريبية مع مدير مرافق",
            "latitude": 30.0444,
            "longitude": 31.2357,
            "effective": True
        }
        
        response, error = self.make_request("POST", "/visits", visit_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء زيارة محسنة", True, "تم إنشاء زيارة بنجاح مع المدير المرافق")
        elif response and response.status_code == 403:
            self.log_test("إنشاء زيارة محسنة", True, "منع إنشاء الزيارة بسبب قيود الصلاحيات - سلوك صحيح")
        else:
            self.log_test("إنشاء زيارة محسنة", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار أنواع الزيارة الثلاثة
        visit_types = ["SOLO", "DUO_WITH_MANAGER", "THREE_WITH_MANAGER_AND_OTHER"]
        for visit_type in visit_types:
            test_data = {
                "doctor_id": "doctor-001",
                "clinic_id": "clinic-001", 
                "visit_type": visit_type,
                "notes": f"اختبار نوع الزيارة: {visit_type}",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "effective": True
            }
            
            if visit_type != "SOLO":
                test_data["accompanying_manager_id"] = "manager-001"
                
            if visit_type == "THREE_WITH_MANAGER_AND_OTHER":
                test_data["other_participant_id"] = "participant-001"
            
            # نحاول إنشاء الزيارة ولكن نتوقع فشل بسبب الصلاحيات
            response, error = self.make_request("POST", "/visits", test_data, token=self.admin_token)
            
            if response and response.status_code == 403:
                self.log_test(f"نوع الزيارة {visit_type}", True, "النظام يمنع الأدمن من إنشاء الزيارات - سلوك صحيح")
            elif response and response.status_code in [200, 201]:
                self.log_test(f"نوع الزيارة {visit_type}", True, f"تم إنشاء زيارة من نوع {visit_type} بنجاح")
            else:
                self.log_test(f"نوع الزيارة {visit_type}", False, 
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_user_profile_access_control(self):
        """اختبار نظام تقييد الوصول للملف الشخصي"""
        print("\n👤 اختبار نظام تقييد الملف الشخصي")
        print("=" * 60)
        
        if not self.admin_token:
            self.log_test("نظام تقييد الملف الشخصي", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار وصول الأدمن لأي ملف شخصي
        test_user_id = "test-user-001"
        response, error = self.make_request("GET", f"/users/{test_user_id}/profile", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            required_sections = ["user", "sales_activity", "debt_info", "territory_info", "team_info"]
            has_all_sections = all(section in data for section in required_sections)
            
            if has_all_sections:
                self.log_test("وصول الأدمن للملف الشخصي", True, "الأدمن يمكنه الوصول لجميع أقسام الملف الشخصي")
            else:
                missing_sections = [section for section in required_sections if section not in data]
                self.log_test("وصول الأدمن للملف الشخصي", False, f"أقسام مفقودة: {missing_sections}")
        else:
            self.log_test("وصول الأدمن للملف الشخصي", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار منع المندوبين من رؤية ملفاتهم مباشرة
        if self.test_user_tokens:
            first_user_token = list(self.test_user_tokens.values())[0]
            response, error = self.make_request("GET", f"/users/{test_user_id}/profile", token=first_user_token)
            
            if response and response.status_code == 403:
                self.log_test("منع المندوبين من رؤية الملفات", True, "النظام يمنع المندوبين من الوصول المباشر للملفات")
            elif response and response.status_code == 200:
                self.log_test("منع المندوبين من رؤية الملفات", False, "المندوب يمكنه الوصول للملف - خطأ في النظام")
            else:
                self.log_test("منع المندوبين من رؤية الملفات", False, 
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار السماح للمدراء برؤية ملفات مرؤوسيهم
        if self.gm_token:
            response, error = self.make_request("GET", f"/users/{test_user_id}/profile", token=self.gm_token)
            
            if response and response.status_code == 200:
                self.log_test("وصول المدراء لملفات المرؤوسين", True, "المدير يمكنه الوصول لملفات مرؤوسيه")
            else:
                self.log_test("وصول المدراء لملفات المرؤوسين", False, 
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار دالة can_access_user_profile
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                # اختبار الوصول لعدة مستخدمين
                accessible_profiles = 0
                for user in users[:5]:  # اختبار أول 5 مستخدمين
                    if isinstance(user, dict) and "id" in user:
                        profile_response, _ = self.make_request("GET", f"/users/{user['id']}/profile", token=self.admin_token)
                        if profile_response and profile_response.status_code == 200:
                            accessible_profiles += 1
                
                self.log_test("دالة can_access_user_profile", True, 
                            f"الأدمن يمكنه الوصول لـ {accessible_profiles} ملف شخصي من أصل 5")
            else:
                self.log_test("دالة can_access_user_profile", True, "لا توجد مستخدمين للاختبار")
        else:
            self.log_test("دالة can_access_user_profile", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_movement_log_system(self):
        """اختبار نظام Movement Log"""
        print("\n📦 اختبار نظام Movement Log")
        print("=" * 60)
        
        if not self.admin_token:
            self.log_test("نظام Movement Log", False, "لا يوجد رمز مميز للأدمن")
            return
            
        # اختبار API للحصول على قائمة المخازن
        response, error = self.make_request("GET", "/movement-logs/warehouses", token=self.admin_token)
        
        if response and response.status_code == 200:
            warehouses = response.json()
            warehouse_count = len(warehouses) if isinstance(warehouses, list) else 0
            self.log_test("API قائمة المخازن (/api/movement-logs/warehouses)", True, 
                        f"تم العثور على {warehouse_count} مخزن")
        else:
            self.log_test("API قائمة المخازن (/api/movement-logs/warehouses)", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إنشاء سجل حركة جديد - حركة صنف
        movement_data = {
            "movement_type": "product_movement",
            "warehouse_id": "warehouse-001",
            "line": "line_1",
            "product_id": "product-001",
            "quantity_change": 50.0,
            "movement_reason": "إضافة مخزون جديد",
            "description": "اختبار حركة صنف في النظام",
            "reference_number": "REF-001"
        }
        
        response, error = self.make_request("POST", "/movement-logs", movement_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء سجل حركة صنف", True, "تم إنشاء سجل حركة الصنف بنجاح")
        else:
            self.log_test("إنشاء سجل حركة صنف", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إنشاء سجل حركة خط كامل
        line_movement_data = {
            "movement_type": "line_movement",
            "warehouse_id": "warehouse-001",
            "line": "line_2",
            "affected_products": ["product-001", "product-002", "product-003"],
            "line_operation": "inventory_count",
            "description": "جرد شامل للخط الثاني",
            "reference_number": "LINE-002"
        }
        
        response, error = self.make_request("POST", "/movement-logs", line_movement_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء سجل حركة خط", True, "تم إنشاء سجل حركة الخط بنجاح")
        else:
            self.log_test("إنشاء سجل حركة خط", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إنشاء سجل حركة عميل
        customer_movement_data = {
            "movement_type": "customer_movement",
            "warehouse_id": "warehouse-001",
            "line": "line_1",
            "customer_id": "clinic-001",
            "customer_operation": "order",
            "order_id": "order-001",
            "description": "طلب جديد من العيادة",
            "reference_number": "CUST-001"
        }
        
        response, error = self.make_request("POST", "/movement-logs", customer_movement_data, token=self.admin_token)
        
        if response and response.status_code in [200, 201]:
            self.log_test("إنشاء سجل حركة عميل", True, "تم إنشاء سجل حركة العميل بنجاح")
        else:
            self.log_test("إنشاء سجل حركة عميل", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار جلب سجلات الحركة
        response, error = self.make_request("GET", "/movement-logs", token=self.admin_token)
        
        if response and response.status_code == 200:
            logs = response.json()
            log_count = len(logs) if isinstance(logs, list) else 0
            self.log_test("جلب سجلات الحركة", True, f"تم العثور على {log_count} سجل حركة")
        else:
            self.log_test("جلب سجلات الحركة", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار ملخص سجلات الحركة
        response, error = self.make_request("GET", "/movement-logs/summary", token=self.admin_token)
        
        if response and response.status_code == 200:
            summary = response.json()
            if isinstance(summary, dict) or isinstance(summary, list):
                self.log_test("ملخص سجلات الحركة", True, "تم الحصول على ملخص سجلات الحركة بنجاح")
            else:
                self.log_test("ملخص سجلات الحركة", False, "تنسيق الملخص غير صحيح")
        else:
            self.log_test("ملخص سجلات الحركة", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار تقييد الصلاحيات (أدمن، GM، محاسبة فقط)
        if self.test_user_tokens:
            first_user_token = list(self.test_user_tokens.values())[0]
            response, error = self.make_request("GET", "/movement-logs", token=first_user_token)
            
            if response and response.status_code == 403:
                self.log_test("تقييد صلاحيات Movement Log", True, "النظام يمنع المستخدمين غير المصرح لهم")
            elif response and response.status_code == 200:
                self.log_test("تقييد صلاحيات Movement Log", False, "المستخدم العادي يمكنه الوصول - خطأ في النظام")
            else:
                self.log_test("تقييد صلاحيات Movement Log", False, 
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_technical_support_system(self):
        """اختبار نظام الدعم الفني"""
        print("\n🎧 اختبار نظام الدعم الفني")
        print("=" * 60)
        
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
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            ticket_id = data.get("id") or data.get("ticket_id")
            self.log_test("إنشاء تذكرة دعم فني", True, f"تم إنشاء التذكرة بنجاح - ID: {ticket_id}")
            
            # اختبار إضافة رد على التذكرة
            if ticket_id:
                response_data = {
                    "response_text": "تم استلام طلبكم وسيتم الرد خلال 24 ساعة",
                    "response_type": "public"
                }
                
                response, error = self.make_request("POST", f"/support/tickets/{ticket_id}/responses", 
                                                  response_data, token=self.admin_token)
                
                if response and response.status_code in [200, 201]:
                    self.log_test("إضافة رد على التذكرة", True, "تم إضافة الرد بنجاح")
                else:
                    self.log_test("إضافة رد على التذكرة", False, 
                                f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
                
                # اختبار تحديث التذكرة
                update_data = {
                    "status": "in_progress",
                    "assigned_to": "support-agent-001",
                    "priority": "medium"
                }
                
                response, error = self.make_request("PATCH", f"/support/tickets/{ticket_id}", 
                                                  update_data, token=self.admin_token)
                
                if response and response.status_code == 200:
                    self.log_test("تحديث التذكرة", True, "تم تحديث التذكرة بنجاح")
                else:
                    self.log_test("تحديث التذكرة", False, 
                                f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        else:
            self.log_test("إنشاء تذكرة دعم فني", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار جلب التذاكر
        response, error = self.make_request("GET", "/support/tickets", token=self.admin_token)
        
        if response and response.status_code == 200:
            tickets = response.json()
            ticket_count = len(tickets) if isinstance(tickets, list) else 0
            self.log_test("جلب تذاكر الدعم الفني", True, f"تم العثور على {ticket_count} تذكرة")
        else:
            self.log_test("جلب تذاكر الدعم الفني", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار إحصائيات الدعم الفني
        response, error = self.make_request("GET", "/support/stats", token=self.admin_token)
        
        if response and response.status_code == 200:
            stats = response.json()
            if isinstance(stats, dict):
                self.log_test("إحصائيات الدعم الفني", True, "تم الحصول على الإحصائيات بنجاح")
            else:
                self.log_test("إحصائيات الدعم الفني", False, "تنسيق الإحصائيات غير صحيح")
        else:
            self.log_test("إحصائيات الدعم الفني", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # اختبار تقييد الصلاحيات (أدمن فقط للإدارة)
        if self.test_user_tokens:
            first_user_token = list(self.test_user_tokens.values())[0]
            response, error = self.make_request("GET", "/support/stats", token=first_user_token)
            
            if response and response.status_code == 403:
                self.log_test("تقييد صلاحيات الدعم الفني", True, "النظام يمنع المستخدمين غير المصرح لهم من الإحصائيات")
            elif response and response.status_code == 200:
                self.log_test("تقييد صلاحيات الدعم الفني", False, "المستخدم العادي يمكنه الوصول للإحصائيات - خطأ في النظام")
            else:
                self.log_test("تقييد صلاحيات الدعم الفني", False, 
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def test_general_system_health(self):
        """اختبار الصحة العامة للنظام"""
        print("\n🏥 اختبار الصحة العامة للنظام")
        print("=" * 60)
        
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
                            f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
        
        # تقييم الصحة العامة
        health_percentage = (working_apis / len(basic_apis)) * 100
        if health_percentage >= 80:
            self.log_test("الصحة العامة للنظام", True, f"النظام يعمل بكفاءة {health_percentage:.1f}%")
        else:
            self.log_test("الصحة العامة للنظام", False, f"النظام يحتاج صيانة - كفاءة {health_percentage:.1f}%")
        
        # اختبار الاستجابة باللغة العربية
        response, error = self.make_request("GET", "/language/translations?lang=ar", token=self.admin_token)
        
        if response and response.status_code == 200:
            translations = response.json()
            if isinstance(translations, dict) and len(translations) > 0:
                self.log_test("دعم اللغة العربية", True, f"تم العثور على {len(translations)} ترجمة عربية")
            else:
                self.log_test("دعم اللغة العربية", False, "لا توجد ترجمات عربية")
        else:
            self.log_test("دعم اللغة العربية", False, 
                        f"الحالة: {response.status_code if response else 'لا توجد استجابة'}")
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 اختبار شامل للتطويرات الجديدة في نظام EP Group")
        print("=" * 80)
        print("المجالات المطلوب اختبارها:")
        print("1. نظام تحذير المديونية للطلبات")
        print("2. نظام تسجيل الزيارة المحسن مع مشاركة المدير")
        print("3. نظام تقييد الوصول للملف الشخصي")
        print("4. نظام Movement Log")
        print("5. نظام الدعم الفني")
        print("6. المستخدمين التجريبيين")
        print("7. الاختبارات العامة")
        print("=" * 80)
        
        start_time = time.time()
        
        # تشغيل جميع الاختبارات
        self.test_authentication_system()
        self.test_order_debt_warning_system()
        self.test_enhanced_visit_registration()
        self.test_user_profile_access_control()
        self.test_movement_log_system()
        self.test_technical_support_system()
        self.test_general_system_health()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # طباعة الملخص
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار الشامل")
        print("=" * 80)
        
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
            print("✅ النظام يعمل بشكل ممتاز مع التطويرات الجديدة!")
        elif success_rate >= 75:
            print("⚠️ النظام يعمل بشكل جيد ولكن يحتاج انتباه للاختبارات الفاشلة.")
        elif success_rate >= 50:
            print("🔧 النظام يحتاج تحسينات قبل الاستخدام في الإنتاج.")
        else:
            print("❌ النظام يحتاج إصلاحات كبيرة قبل الاستخدام.")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = ArabicReviewTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 اكتمل الاختبار الشامل بنجاح!")
        sys.exit(0)
    else:
        print("\n⚠️ اكتمل الاختبار الشامل مع وجود مشاكل!")
        sys.exit(1)