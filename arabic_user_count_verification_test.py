#!/usr/bin/env python3
"""
اختبار شامل لتأكيد عدد المستخدمين الفعلي في النظام
Comprehensive Test to Confirm Actual Number of Users in the System

المطلوب حسب المراجعة العربية:
Required according to Arabic review:
1. اختبار POST /api/auth/login مع admin/admin123 للحصول على JWT token
2. اختبار GET /api/users للحصول على قائمة شاملة بجميع المستخدمين
3. تحليل البيانات المُستلمة وعرض:
   - العدد الإجمالي للمستخدمين
   - تصنيف المستخدمين حسب الأدوار (admin, medical_rep, sales_rep, etc.)
   - قائمة بأسماء المستخدمين الرئيسيين (خاصة admin)
   - المستخدمين التجريبيين/اختباريين
4. اختبار GET /api/areas للحصول على بيانات المناطق لربطها مع واجهة المستخدمين
5. التأكد من تنسيق البيانات وأنها تحتوي على جميع الحقول المطلوبة

هذا الاختبار مطلوب لفهم السبب وراء عدم ظهور جميع المستخدمين في الواجهة الأمامية رغم وجودهم في الباكند.
"""

import requests
import json
import time
from datetime import datetime
from collections import Counter

# Configuration
BACKEND_URL = "https://4bd6a5b6-7d69-4d01-ab9e-6f0ddd678934.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class UserCountVerificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, details="", response_time=0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.2f}ms"
        })
        print(f"{status} | {test_name} | {response_time:.2f}ms")
        if details:
            print(f"   📝 {details}")
        print()
    
    def test_admin_login(self):
        """1. اختبار تسجيل دخول الأدمن للحصول على JWT token"""
        print("🔐 الخطوة 1: اختبار تسجيل دخول الأدمن...")
        start_time = time.time()
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.jwt_token = data["access_token"]
                    self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                    user_info = data.get("user", {})
                    details = f"مستخدم: {user_info.get('full_name', 'غير محدد')}, دور: {user_info.get('role', 'غير محدد')}, JWT Token: {self.jwt_token[:20]}..."
                    self.log_test("تسجيل دخول admin/admin123", True, details, response_time)
                    return True
                else:
                    self.log_test("تسجيل دخول admin/admin123", False, "لا يوجد access_token في الاستجابة", response_time)
            else:
                self.log_test("تسجيل دخول admin/admin123", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("تسجيل دخول admin/admin123", False, f"خطأ: {str(e)}", response_time)
        
        return False
    
    def test_get_all_users_comprehensive(self):
        """2. اختبار GET /api/users للحصول على قائمة شاملة بجميع المستخدمين"""
        print("👥 الخطوة 2: اختبار GET /api/users للحصول على قائمة شاملة...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/users", timeout=15)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                if isinstance(users, list):
                    user_count = len(users)
                    
                    # تحليل شامل للمستخدمين
                    analysis = self.analyze_users_comprehensive(users)
                    
                    details = f"""
📊 تحليل شامل للمستخدمين:
• العدد الإجمالي: {user_count} مستخدم
• تصنيف الأدوار: {analysis['role_breakdown']}
• المستخدمين الحقيقيين: {analysis['real_users_count']}
• المستخدمين التجريبيين: {analysis['demo_users_count']}
• المستخدمين الرئيسيين: {', '.join(analysis['key_users'])}
• الحقول المتاحة: {', '.join(analysis['available_fields'])}
• تنسيق البيانات: {analysis['data_format']}"""
                    
                    self.log_test("GET /api/users - قائمة شاملة", True, details, response_time)
                    return users, analysis
                else:
                    self.log_test("GET /api/users - قائمة شاملة", False, f"الاستجابة ليست قائمة، النوع: {type(users)}", response_time)
            else:
                self.log_test("GET /api/users - قائمة شاملة", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/users - قائمة شاملة", False, f"خطأ: {str(e)}", response_time)
        
        return [], {}
    
    def analyze_users_comprehensive(self, users):
        """3. تحليل البيانات المُستلمة وعرض التفاصيل الشاملة"""
        print("📊 الخطوة 3: تحليل البيانات المُستلمة...")
        
        analysis = {
            'total_count': len(users),
            'role_breakdown': {},
            'real_users_count': 0,
            'demo_users_count': 0,
            'key_users': [],
            'available_fields': [],
            'data_format': 'array',
            'admin_users': [],
            'medical_reps': [],
            'managers': [],
            'other_roles': []
        }
        
        # تحليل الأدوار
        roles = [user.get('role', 'غير محدد') for user in users]
        analysis['role_breakdown'] = dict(Counter(roles))
        
        # تحليل المستخدمين
        for user in users:
            username = user.get('username', '').lower()
            full_name = user.get('full_name', '')
            role = user.get('role', '')
            
            # تصنيف المستخدمين (حقيقي/تجريبي)
            if any(keyword in username for keyword in ['demo', 'test', 'sample', 'اختبار']):
                analysis['demo_users_count'] += 1
            else:
                analysis['real_users_count'] += 1
            
            # المستخدمين الرئيسيين
            if username in ['admin'] or role == 'admin':
                analysis['key_users'].append(f"{username} ({full_name})")
                analysis['admin_users'].append(user)
            elif role in ['medical_rep', 'sales_rep']:
                analysis['medical_reps'].append(user)
            elif 'manager' in role.lower():
                analysis['managers'].append(user)
            else:
                analysis['other_roles'].append(user)
        
        # الحقول المتاحة
        if users:
            analysis['available_fields'] = list(users[0].keys())
        
        return analysis
    
    def test_get_areas_for_ui_integration(self):
        """4. اختبار GET /api/areas للحصول على بيانات المناطق لربطها مع واجهة المستخدمين"""
        print("🗺️ الخطوة 4: اختبار GET /api/areas لربط بيانات المناطق...")
        start_time = time.time()
        
        try:
            response = self.session.get(f"{BACKEND_URL}/areas", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                areas = response.json()
                if isinstance(areas, list):
                    area_count = len(areas)
                    
                    # تحليل بيانات المناطق
                    area_analysis = self.analyze_areas_data(areas)
                    
                    details = f"""
🗺️ تحليل بيانات المناطق:
• عدد المناطق: {area_count}
• الحقول المتاحة: {', '.join(area_analysis['available_fields'])}
• المناطق النشطة: {area_analysis['active_areas']}
• المناطق مع مدراء: {area_analysis['areas_with_managers']}
• تنسيق مناسب للواجهة: {'نعم' if area_analysis['ui_ready'] else 'لا'}"""
                    
                    self.log_test("GET /api/areas - بيانات المناطق", True, details, response_time)
                    return areas, area_analysis
                else:
                    self.log_test("GET /api/areas - بيانات المناطق", False, f"الاستجابة ليست قائمة، النوع: {type(areas)}", response_time)
            else:
                self.log_test("GET /api/areas - بيانات المناطق", False, f"HTTP {response.status_code}: {response.text}", response_time)
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("GET /api/areas - بيانات المناطق", False, f"خطأ: {str(e)}", response_time)
        
        return [], {}
    
    def analyze_areas_data(self, areas):
        """تحليل بيانات المناطق"""
        analysis = {
            'total_count': len(areas),
            'available_fields': [],
            'active_areas': 0,
            'areas_with_managers': 0,
            'ui_ready': False
        }
        
        if areas:
            analysis['available_fields'] = list(areas[0].keys())
            
            for area in areas:
                if area.get('is_active', True):
                    analysis['active_areas'] += 1
                if area.get('manager_id') or area.get('manager_name'):
                    analysis['areas_with_managers'] += 1
            
            # تحقق من جاهزية البيانات للواجهة
            required_fields = ['id', 'name']
            analysis['ui_ready'] = all(field in analysis['available_fields'] for field in required_fields)
        
        return analysis
    
    def verify_data_format_and_fields(self, users, areas):
        """5. التأكد من تنسيق البيانات وأنها تحتوي على جميع الحقول المطلوبة"""
        print("🔍 الخطوة 5: التحقق من تنسيق البيانات والحقول المطلوبة...")
        start_time = time.time()
        
        verification_results = {
            'users_format_valid': False,
            'users_required_fields': [],
            'users_missing_fields': [],
            'areas_format_valid': False,
            'areas_required_fields': [],
            'areas_missing_fields': [],
            'frontend_compatibility': False
        }
        
        # التحقق من تنسيق المستخدمين
        if users and isinstance(users, list):
            verification_results['users_format_valid'] = True
            
            # الحقول المطلوبة للمستخدمين
            required_user_fields = ['id', 'username', 'full_name', 'role', 'is_active']
            optional_user_fields = ['email', 'phone', 'created_at', 'line_id', 'area_id']
            
            if users:
                sample_user = users[0]
                available_fields = list(sample_user.keys())
                
                verification_results['users_required_fields'] = [f for f in required_user_fields if f in available_fields]
                verification_results['users_missing_fields'] = [f for f in required_user_fields if f not in available_fields]
        
        # التحقق من تنسيق المناطق
        if areas and isinstance(areas, list):
            verification_results['areas_format_valid'] = True
            
            # الحقول المطلوبة للمناطق
            required_area_fields = ['id', 'name', 'code']
            optional_area_fields = ['description', 'manager_id', 'is_active']
            
            if areas:
                sample_area = areas[0]
                available_fields = list(sample_area.keys())
                
                verification_results['areas_required_fields'] = [f for f in required_area_fields if f in available_fields]
                verification_results['areas_missing_fields'] = [f for f in required_area_fields if f not in available_fields]
        
        # تقييم التوافق مع الواجهة الأمامية
        verification_results['frontend_compatibility'] = (
            verification_results['users_format_valid'] and 
            len(verification_results['users_missing_fields']) == 0 and
            verification_results['areas_format_valid']
        )
        
        response_time = (time.time() - start_time) * 1000
        
        details = f"""
🔍 نتائج التحقق من التنسيق:
• تنسيق المستخدمين صحيح: {'نعم' if verification_results['users_format_valid'] else 'لا'}
• الحقول المطلوبة للمستخدمين متوفرة: {', '.join(verification_results['users_required_fields'])}
• الحقول المفقودة للمستخدمين: {', '.join(verification_results['users_missing_fields']) if verification_results['users_missing_fields'] else 'لا توجد'}
• تنسيق المناطق صحيح: {'نعم' if verification_results['areas_format_valid'] else 'لا'}
• التوافق مع الواجهة الأمامية: {'نعم' if verification_results['frontend_compatibility'] else 'لا'}"""
        
        self.log_test("التحقق من تنسيق البيانات والحقول", verification_results['frontend_compatibility'], details, response_time)
        
        return verification_results
    
    def generate_detailed_report(self, users, user_analysis, areas, area_analysis, verification):
        """إنتاج تقرير مفصل عن حالة النظام"""
        print("\n" + "=" * 80)
        print("📋 التقرير المفصل لحالة المستخدمين في النظام")
        print("=" * 80)
        
        # ملخص المستخدمين
        print(f"\n👥 ملخص المستخدمين:")
        print(f"   • العدد الإجمالي: {user_analysis.get('total_count', 0)} مستخدم")
        print(f"   • المستخدمين الحقيقيين: {user_analysis.get('real_users_count', 0)}")
        print(f"   • المستخدمين التجريبيين: {user_analysis.get('demo_users_count', 0)}")
        
        # تفصيل الأدوار
        print(f"\n🎭 تصنيف المستخدمين حسب الأدوار:")
        for role, count in user_analysis.get('role_breakdown', {}).items():
            print(f"   • {role}: {count} مستخدم")
        
        # المستخدمين الرئيسيين
        print(f"\n🔑 المستخدمين الرئيسيين:")
        for key_user in user_analysis.get('key_users', []):
            print(f"   • {key_user}")
        
        # عينة من المستخدمين
        print(f"\n📝 عينة من المستخدمين (أول 10):")
        for i, user in enumerate(users[:10]):
            username = user.get('username', 'غير محدد')
            full_name = user.get('full_name', 'غير محدد')
            role = user.get('role', 'غير محدد')
            is_active = user.get('is_active', True)
            status = "نشط" if is_active else "غير نشط"
            print(f"   {i+1}. {username} - {full_name} ({role}) - {status}")
        
        # بيانات المناطق
        print(f"\n🗺️ ملخص المناطق:")
        print(f"   • عدد المناطق: {area_analysis.get('total_count', 0)}")
        print(f"   • المناطق النشطة: {area_analysis.get('active_areas', 0)}")
        print(f"   • المناطق مع مدراء: {area_analysis.get('areas_with_managers', 0)}")
        
        # تحليل المشكلة المحتملة
        print(f"\n🔍 تحليل المشكلة المحتملة:")
        if verification.get('frontend_compatibility', False):
            print("   ✅ البيانات متوافقة مع الواجهة الأمامية")
            print("   ✅ جميع الحقول المطلوبة متوفرة")
            print("   ✅ تنسيق البيانات صحيح (array مباشر)")
            print("\n   💡 التوصية: المشكلة قد تكون في الواجهة الأمامية وليس الباكند")
        else:
            print("   ❌ هناك مشاكل في توافق البيانات")
            if verification.get('users_missing_fields'):
                print(f"   ❌ حقول مفقودة في المستخدمين: {', '.join(verification['users_missing_fields'])}")
            print("\n   💡 التوصية: إصلاح مشاكل البيانات في الباكند أولاً")
        
        # الخلاصة النهائية
        print(f"\n🎯 الخلاصة النهائية:")
        total_users = user_analysis.get('total_count', 0)
        if total_users > 0:
            print(f"   ✅ الباكند يحتوي على {total_users} مستخدم")
            print(f"   ✅ البيانات متاحة ويمكن الوصول إليها")
            print(f"   ✅ تنسيق JSON صحيح")
            
            if verification.get('frontend_compatibility', False):
                print(f"   ✅ البيانات جاهزة للواجهة الأمامية")
                print(f"\n   🔧 السبب المحتمل لعدم ظهور المستخدمين في الواجهة:")
                print(f"      • مشكلة في استدعاء API من الواجهة الأمامية")
                print(f"      • مشكلة في معالجة البيانات في React")
                print(f"      • مشكلة في عرض البيانات في الجدول")
                print(f"      • مشكلة في التصفية أو البحث")
            else:
                print(f"   ❌ البيانات تحتاج إصلاح قبل الواجهة الأمامية")
        else:
            print(f"   ❌ لا توجد مستخدمين في النظام")
    
    def run_comprehensive_verification(self):
        """تشغيل الاختبار الشامل لتأكيد عدد المستخدمين"""
        print("🚀 بدء الاختبار الشامل لتأكيد عدد المستخدمين الفعلي في النظام")
        print("=" * 80)
        print("📋 هذا الاختبار مطلوب لفهم السبب وراء عدم ظهور جميع المستخدمين في الواجهة الأمامية")
        print("=" * 80)
        
        # الخطوة 1: تسجيل الدخول
        if not self.test_admin_login():
            print("❌ فشل تسجيل دخول الأدمن - توقف الاختبار")
            return
        
        # الخطوة 2: جلب جميع المستخدمين
        users, user_analysis = self.test_get_all_users_comprehensive()
        
        # الخطوة 3: جلب بيانات المناطق
        areas, area_analysis = self.test_get_areas_for_ui_integration()
        
        # الخطوة 4: التحقق من تنسيق البيانات
        verification = self.verify_data_format_and_fields(users, areas)
        
        # الخطوة 5: إنتاج التقرير المفصل
        self.generate_detailed_report(users, user_analysis, areas, area_analysis, verification)
        
        # ملخص نتائج الاختبار
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار")
        print("=" * 80)
        
        success_count = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
        
        print(f"🎯 نسبة النجاح: {success_rate:.1f}% ({success_count}/{total_tests} اختبار نجح)")
        print(f"⏱️ إجمالي وقت الاختبار: {time.time() - self.start_time:.2f} ثانية")
        
        print("\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']} ({result['response_time']})")
        
        # التقييم النهائي
        print("\n🏁 التقييم النهائي:")
        if success_rate >= 80:
            print("✅ الاختبار نجح بشكل ممتاز! الباكند يعمل بشكل صحيح.")
            print("💡 المشكلة على الأرجح في الواجهة الأمامية وليس الباكند.")
        elif success_rate >= 60:
            print("⚠️ الاختبار نجح جزئياً. هناك بعض المشاكل في الباكند.")
        else:
            print("❌ الاختبار فشل. هناك مشاكل جدية في الباكند.")
        
        return success_rate >= 60

if __name__ == "__main__":
    tester = UserCountVerificationTester()
    tester.run_comprehensive_verification()