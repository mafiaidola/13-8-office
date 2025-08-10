#!/usr/bin/env python3
"""
اختبار dashboard_routes.py الذي تم إصلاحه
Testing the fixed dashboard_routes.py

This test focuses on:
1. التحقق من تسجيل الدخول - Login verification with admin user (admin/admin123) and JWT token
2. اختبار /api/dashboard/stats - Test dashboard stats endpoint with JWT token
3. التحقق من Authorization Header - Verify Bearer token acceptance
4. اختبار الاستجابة - Test response contains correct statistics

This addresses the "Missing or invalid authorization header" issue from pending_tasks.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend environment
BACKEND_URL = "https://f4f7e091-f5a6-4f57-bca3-79ac25601921.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class DashboardRoutesTest:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} - {test_name}")
        if details:
            print(f"   التفاصيل: {details}")
        if error:
            print(f"   الخطأ: {error}")
        print()

    def test_admin_login(self):
        """1. التحقق من تسجيل الدخول - Admin Login Test"""
        print("🔐 اختبار تسجيل الدخول للأدمن...")
        
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.jwt_token = data["access_token"]
                    user_info = data.get("user", {})
                    
                    self.log_test(
                        "تسجيل الدخول للأدمن",
                        True,
                        f"تم الحصول على JWT token بنجاح. المستخدم: {user_info.get('username')}, الدور: {user_info.get('role')}"
                    )
                    return True
                else:
                    self.log_test(
                        "تسجيل الدخول للأدمن",
                        False,
                        error="لم يتم العثور على access_token في الاستجابة"
                    )
                    return False
            else:
                self.log_test(
                    "تسجيل الدخول للأدمن",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "تسجيل الدخول للأدمن",
                False,
                error=f"خطأ في الاتصال: {str(e)}"
            )
            return False

    def test_authorization_header(self):
        """2. التحقق من Authorization Header - Bearer Token Test"""
        print("🔑 اختبار Authorization Header...")
        
        if not self.jwt_token:
            self.log_test(
                "اختبار Authorization Header",
                False,
                error="لا يوجد JWT token للاختبار"
            )
            return False
        
        try:
            # Test with correct Bearer token format
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{API_BASE}/dashboard/stats",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_test(
                    "اختبار Authorization Header",
                    True,
                    "النظام يقبل Bearer token بشكل صحيح"
                )
                return True
            elif response.status_code == 401:
                self.log_test(
                    "اختبار Authorization Header",
                    False,
                    error=f"خطأ في المصادقة: {response.text}"
                )
                return False
            else:
                self.log_test(
                    "اختبار Authorization Header",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "اختبار Authorization Header",
                False,
                error=f"خطأ في الاتصال: {str(e)}"
            )
            return False

    def test_dashboard_stats_endpoint(self):
        """3. اختبار /api/dashboard/stats - Dashboard Stats Endpoint Test"""
        print("📊 اختبار endpoint الإحصائيات...")
        
        if not self.jwt_token:
            self.log_test(
                "اختبار endpoint الإحصائيات",
                False,
                error="لا يوجد JWT token للاختبار"
            )
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{API_BASE}/dashboard/stats",
                headers=headers,
                timeout=15
            )
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Check response structure
                    required_fields = ["success", "data", "user_role", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_test(
                            "اختبار endpoint الإحصائيات",
                            False,
                            error=f"حقول مفقودة في الاستجابة: {missing_fields}"
                        )
                        return False
                    
                    # Check if success is True
                    if not data.get("success", False):
                        self.log_test(
                            "اختبار endpoint الإحصائيات",
                            False,
                            error=f"الاستجابة تشير إلى فشل: {data.get('error', 'خطأ غير محدد')}"
                        )
                        return False
                    
                    # Check statistics data
                    stats_data = data.get("data", {})
                    admin_stats = ["total_users", "total_clinics", "total_visits", "total_orders", 
                                 "today_visits", "today_orders", "pending_approvals", "active_reps"]
                    
                    available_stats = [stat for stat in admin_stats if stat in stats_data]
                    
                    self.log_test(
                        "اختبار endpoint الإحصائيات",
                        True,
                        f"تم الحصول على الإحصائيات بنجاح. الدور: {data.get('user_role')}, الإحصائيات المتاحة: {len(available_stats)}/8"
                    )
                    
                    # Print detailed statistics
                    print("📈 الإحصائيات المستلمة:")
                    for key, value in stats_data.items():
                        print(f"   {key}: {value}")
                    
                    return True
                    
                except json.JSONDecodeError:
                    self.log_test(
                        "اختبار endpoint الإحصائيات",
                        False,
                        error="خطأ في تحليل JSON response"
                    )
                    return False
            else:
                self.log_test(
                    "اختبار endpoint الإحصائيات",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "اختبار endpoint الإحصائيات",
                False,
                error=f"خطأ في الاتصال: {str(e)}"
            )
            return False

    def test_invalid_token_handling(self):
        """4. اختبار التعامل مع Token غير صحيح - Invalid Token Handling"""
        print("🚫 اختبار التعامل مع token غير صحيح...")
        
        try:
            # Test with invalid token
            headers = {
                "Authorization": "Bearer invalid_token_12345",
                "Content-Type": "application/json"
            }
            
            response = self.session.get(
                f"{API_BASE}/dashboard/stats",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test(
                    "اختبار Token غير صحيح",
                    True,
                    "النظام يرفض Token غير صحيح بشكل صحيح (401 Unauthorized)"
                )
                return True
            else:
                self.log_test(
                    "اختبار Token غير صحيح",
                    False,
                    error=f"النظام لم يرفض Token غير صحيح. HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "اختبار Token غير صحيح",
                False,
                error=f"خطأ في الاتصال: {str(e)}"
            )
            return False

    def test_missing_authorization_header(self):
        """5. اختبار عدم وجود Authorization Header - Missing Authorization Header"""
        print("❌ اختبار عدم وجود Authorization Header...")
        
        try:
            # Test without Authorization header
            response = self.session.get(
                f"{API_BASE}/dashboard/stats",
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 401 or response.status_code == 403:
                self.log_test(
                    "اختبار عدم وجود Authorization Header",
                    True,
                    f"النظام يرفض الطلبات بدون Authorization header بشكل صحيح (HTTP {response.status_code})"
                )
                return True
            else:
                self.log_test(
                    "اختبار عدم وجود Authorization Header",
                    False,
                    error=f"النظام لم يرفض الطلب بدون Authorization header. HTTP {response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_test(
                "اختبار عدم وجود Authorization Header",
                False,
                error=f"خطأ في الاتصال: {str(e)}"
            )
            return False

    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار dashboard_routes.py الذي تم إصلاحه")
        print("=" * 60)
        print()
        
        # Test sequence
        tests = [
            self.test_admin_login,
            self.test_authorization_header,
            self.test_dashboard_stats_endpoint,
            self.test_invalid_token_handling,
            self.test_missing_authorization_header
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_func in tests:
            if test_func():
                passed_tests += 1
        
        # Summary
        print("=" * 60)
        print("📋 ملخص النتائج:")
        print(f"   الاختبارات الناجحة: {passed_tests}/{total_tests}")
        print(f"   نسبة النجاح: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("🎉 جميع الاختبارات نجحت! dashboard_routes.py يعمل بشكل صحيح")
            return True
        else:
            print("⚠️  بعض الاختبارات فشلت. يرجى مراجعة الأخطاء أعلاه")
            return False

def main():
    """الدالة الرئيسية"""
    print("اختبار dashboard_routes.py - إصلاح مشكلة Missing or invalid authorization header")
    print("Testing dashboard_routes.py - Fix for Missing or invalid authorization header issue")
    print()
    
    tester = DashboardRoutesTest()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()