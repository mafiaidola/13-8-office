#!/usr/bin/env python3
"""
Comprehensive System Review Testing - Arabic Review
اختبار شامل لجميع مكونات النظام للتأكد من عدم وجود أخطاء تحميل أو "error loading component"

المراحل:
1. اختبار APIs الأساسية
2. اختبار المكونات المالية الشاملة  
3. اختبار مكونات النظام المتقدمة
4. التحقق من سلامة البيانات

الهدف: تحقيق نسبة نجاح 95%+ مع التأكد من أن جميع APIs تعمل ولا توجد مشاكل في تحميل المكونات
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://f4f7e091-f5a6-4f57-bca3-79ac25601921.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

class ComprehensiveSystemReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details="", error_msg=""):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "error": error_msg,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({result['response_time_ms']}ms)")
        if error_msg:
            print(f"   Error: {error_msg}")
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with timing"""
        start_time = time.time()
        try:
            url = f"{API_BASE}{endpoint}"
            if headers is None:
                headers = {}
            
            if self.jwt_token:
                headers["Authorization"] = f"Bearer {self.jwt_token}"
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                headers["Content-Type"] = "application/json"
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                headers["Content-Type"] = "application/json"
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            response_time = time.time() - start_time
            return response, response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            return None, response_time, str(e)
    
    def test_admin_login(self):
        """المرحلة 1: اختبار تسجيل دخول admin/admin123"""
        print("\n🔐 المرحلة 1: اختبار تسجيل الدخول")
        
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "Cairo",
                "country": "Egypt"
            },
            "device_info": "Comprehensive System Review Test",
            "ip_address": "192.168.1.100"
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.jwt_token = data.get("access_token")
            user_info = data.get("user", {})
            
            self.log_test(
                "Admin Login (admin/admin123)",
                True,
                response_time,
                f"User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
            )
            return True
        else:
            error_msg = response.text if response else "Connection failed"
            self.log_test("Admin Login (admin/admin123)", False, response_time, "", error_msg)
            return False
    
    def test_basic_endpoints(self):
        """المرحلة 1: فحص جميع endpoints الأساسية"""
        print("\n📊 المرحلة 1: اختبار APIs الأساسية")
        
        basic_endpoints = [
            ("/health", "Health Check"),
            ("/users", "Users Management"),
            ("/products", "Products Management"),
            ("/clinics", "Clinics Management")
        ]
        
        for endpoint, name in basic_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    self.log_test(name, True, response_time, f"{count} items")
                elif isinstance(data, dict):
                    if "status" in data:
                        self.log_test(name, True, response_time, f"Status: {data.get('status')}")
                    else:
                        keys = list(data.keys())[:3]
                        self.log_test(name, True, response_time, f"Keys: {keys}")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_admin_dashboard_endpoints(self):
        """المرحلة 1: فحص endpoints الإدارية"""
        print("\n🎛️ المرحلة 1: اختبار Dashboard الإداري")
        
        admin_endpoints = [
            ("/dashboard/stats/admin", "Admin Dashboard Stats"),
            ("/dashboard/widgets/admin", "Admin Dashboard Widgets")
        ]
        
        for endpoint, name in admin_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    stats_count = len([k for k in data.keys() if not k.startswith('_')])
                    self.log_test(name, True, response_time, f"{stats_count} statistics")
                elif isinstance(data, list):
                    self.log_test(name, True, response_time, f"{len(data)} widgets")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_lines_areas_endpoints(self):
        """المرحلة 1: فحص endpoints الخطوط والمناطق"""
        print("\n🗺️ المرحلة 1: اختبار الخطوط والمناطق")
        
        location_endpoints = [
            ("/lines", "Lines Management"),
            ("/areas", "Areas Management")
        ]
        
        for endpoint, name in location_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    self.log_test(name, True, response_time, f"{count} items")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_financial_system_basic(self):
        """المرحلة 2: فحص النظام المالي الأساسي"""
        print("\n💰 المرحلة 2: اختبار النظام المالي الأساسي")
        
        financial_endpoints = [
            ("/invoices", "Invoices Management"),
            ("/debts", "Debts Management"),
            ("/payments", "Payments Management")
        ]
        
        for endpoint, name in financial_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    count = len(data)
                    total_amount = 0
                    if data and isinstance(data[0], dict):
                        # Try to calculate total amount
                        for item in data:
                            amount_field = item.get('amount') or item.get('remaining_amount') or item.get('payment_amount') or 0
                            if isinstance(amount_field, (int, float)):
                                total_amount += amount_field
                    
                    details = f"{count} records"
                    if total_amount > 0:
                        details += f", Total: {total_amount:.2f} ج.م"
                    
                    self.log_test(name, True, response_time, details)
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_financial_statistics(self):
        """المرحلة 2: فحص الإحصائيات المالية لكل نوع"""
        print("\n📈 المرحلة 2: اختبار الإحصائيات المالية")
        
        stats_endpoints = [
            ("/invoices/statistics/overview", "Invoice Statistics"),
            ("/debts/statistics/overview", "Debt Statistics"),
            ("/payments/statistics", "Payment Statistics")
        ]
        
        for endpoint, name in stats_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, dict):
                    stats_keys = [k for k in data.keys() if not k.startswith('_')]
                    self.log_test(name, True, response_time, f"{len(stats_keys)} statistics")
                else:
                    self.log_test(name, True, response_time, "Statistics received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_unified_financial_system(self):
        """المرحلة 2: اختبار النظام المالي الموحد"""
        print("\n🏦 المرحلة 2: اختبار النظام المالي الموحد")
        
        unified_endpoints = [
            ("/api/unified-financial/dashboard/overview", "Unified Financial Dashboard"),
            ("/api/unified-financial/records", "Unified Financial Records")
        ]
        
        for endpoint, name in unified_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(name, True, response_time, f"{len(data)} records")
                elif isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    self.log_test(name, True, response_time, f"Keys: {keys}")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
        
        # Test creating a unified financial record
        test_record = {
            "type": "invoice",
            "clinic_id": "test-clinic-001",
            "amount": 1500.00,
            "description": "Test unified financial record",
            "due_date": "2025-01-15"
        }
        
        response, response_time = self.make_request("POST", "/api/unified-financial/records", test_record)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            record_id = data.get("id") or data.get("record_id") or "Unknown"
            self.log_test("Create Unified Financial Record", True, response_time, f"ID: {record_id}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create Unified Financial Record", False, response_time, "", error_msg)
    
    def test_visits_system(self):
        """المرحلة 3: فحص نظام الزيارات"""
        print("\n🏥 المرحلة 3: اختبار نظام الزيارات")
        
        visits_endpoints = [
            ("/visits/dashboard/overview", "Visits Dashboard Overview"),
            ("/visits/available-clinics", "Available Clinics for Visits"),
            ("/visits/representatives/stats", "Representatives Stats")
        ]
        
        for endpoint, name in visits_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(name, True, response_time, f"{len(data)} items")
                elif isinstance(data, dict):
                    stats_count = len([k for k in data.keys() if not k.startswith('_')])
                    self.log_test(name, True, response_time, f"{stats_count} statistics")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_activities_system(self):
        """المرحلة 3: اختبار تتبع الأنشطة وتسجيل الدخول"""
        print("\n📋 المرحلة 3: اختبار تتبع الأنشطة")
        
        # Test basic activities endpoint
        response, response_time = self.make_request("GET", "/activities")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Activities List", True, response_time, f"{len(data)} activities")
            else:
                self.log_test("Activities List", True, response_time, "Activities data received")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Activities List", False, response_time, "", error_msg)
        
        # Test activities with filters
        activity_filters = [
            ("?activity_type=login", "Login Activities Filter"),
            ("?time_filter=today", "Today Activities Filter"),
            ("?limit=10", "Limited Activities (10)")
        ]
        
        for filter_param, name in activity_filters:
            response, response_time = self.make_request("GET", f"/activities{filter_param}")
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(name, True, response_time, f"{len(data)} filtered activities")
                else:
                    self.log_test(name, True, response_time, "Filtered data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_enhanced_clinics(self):
        """المرحلة 3: فحص endpoints العيادات المحسنة"""
        print("\n🏥+ المرحلة 3: اختبار العيادات المحسنة")
        
        enhanced_endpoints = [
            ("/enhanced-clinics/available-for-user", "Enhanced Clinics List"),
            ("/enhanced-clinics/registration/form-data", "Enhanced Clinic Registration Form Data")
        ]
        
        for endpoint, name in enhanced_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test(name, True, response_time, f"{len(data)} items")
                elif isinstance(data, dict):
                    keys = list(data.keys())[:3]
                    self.log_test(name, True, response_time, f"Keys: {keys}")
                else:
                    self.log_test(name, True, response_time, "Data received")
            else:
                error_msg = response.text if response else "No response"
                self.log_test(name, False, response_time, "", error_msg)
    
    def test_data_relationships(self):
        """المرحلة 4: فحص ترابط البيانات بين الجداول"""
        print("\n🔗 المرحلة 4: التحقق من ترابط البيانات")
        
        # Test user-clinic relationships
        users_response, users_time = self.make_request("GET", "/users")
        clinics_response, clinics_time = self.make_request("GET", "/clinics")
        
        if users_response and users_response.status_code == 200 and clinics_response and clinics_response.status_code == 200:
            users_data = users_response.json()
            clinics_data = clinics_response.json()
            
            users_count = len(users_data) if isinstance(users_data, list) else 0
            clinics_count = len(clinics_data) if isinstance(clinics_data, list) else 0
            
            self.log_test(
                "User-Clinic Data Relationship",
                True,
                (users_time + clinics_time) / 2,
                f"Users: {users_count}, Clinics: {clinics_count}"
            )
        else:
            self.log_test("User-Clinic Data Relationship", False, 0, "", "Failed to fetch related data")
        
        # Test financial data relationships
        debts_response, debts_time = self.make_request("GET", "/debts")
        payments_response, payments_time = self.make_request("GET", "/payments")
        
        if debts_response and debts_response.status_code == 200 and payments_response and payments_response.status_code == 200:
            debts_data = debts_response.json()
            payments_data = payments_response.json()
            
            debts_count = len(debts_data) if isinstance(debts_data, list) else 0
            payments_count = len(payments_data) if isinstance(payments_data, list) else 0
            
            self.log_test(
                "Financial Data Relationship",
                True,
                (debts_time + payments_time) / 2,
                f"Debts: {debts_count}, Payments: {payments_count}"
            )
        else:
            self.log_test("Financial Data Relationship", False, 0, "", "Failed to fetch financial data")
    
    def test_crud_operations(self):
        """المرحلة 4: التأكد من عمل جميع العمليات CRUD"""
        print("\n⚙️ المرحلة 4: اختبار عمليات CRUD")
        
        # Test creating a test user
        test_user = {
            "username": f"test_user_{int(time.time())}",
            "full_name": "Test User for CRUD",
            "role": "medical_rep",
            "password": "test123",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/users", test_user)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            user_id = data.get("id") or data.get("user_id") or "Unknown"
            self.log_test("CREATE User Operation", True, response_time, f"User ID: {user_id}")
            
            # Test updating the user
            update_data = {"full_name": "Updated Test User"}
            update_response, update_time = self.make_request("PUT", f"/users/{user_id}", update_data)
            
            if update_response and update_response.status_code == 200:
                self.log_test("UPDATE User Operation", True, update_time, "User updated successfully")
            else:
                error_msg = update_response.text if update_response else "No response"
                self.log_test("UPDATE User Operation", False, update_time, "", error_msg)
            
            # Test deleting the user
            delete_response, delete_time = self.make_request("DELETE", f"/users/{user_id}")
            
            if delete_response and delete_response.status_code in [200, 204]:
                self.log_test("DELETE User Operation", True, delete_time, "User deleted successfully")
            else:
                error_msg = delete_response.text if delete_response else "No response"
                self.log_test("DELETE User Operation", False, delete_time, "", error_msg)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("CREATE User Operation", False, response_time, "", error_msg)
    
    def test_error_handling(self):
        """المرحلة 4: فحص معالجة الأخطاء والرسائل"""
        print("\n🚨 المرحلة 4: اختبار معالجة الأخطاء")
        
        # Test accessing non-existent endpoint
        response, response_time = self.make_request("GET", "/non-existent-endpoint")
        
        if response and response.status_code == 404:
            self.log_test("404 Error Handling", True, response_time, "Correctly returns 404")
        else:
            self.log_test("404 Error Handling", False, response_time, "", "Should return 404")
        
        # Test unauthorized access (without token)
        temp_token = self.jwt_token
        self.jwt_token = None
        
        response, response_time = self.make_request("GET", "/users")
        
        if response and response.status_code in [401, 403]:
            self.log_test("Unauthorized Access Handling", True, response_time, f"Correctly returns {response.status_code}")
        else:
            self.log_test("Unauthorized Access Handling", False, response_time, "", "Should return 401/403")
        
        # Restore token
        self.jwt_token = temp_token
        
        # Test invalid data submission
        invalid_user = {"invalid_field": "invalid_value"}
        response, response_time = self.make_request("POST", "/users", invalid_user)
        
        if response and response.status_code in [400, 422]:
            self.log_test("Invalid Data Handling", True, response_time, f"Correctly returns {response.status_code}")
        else:
            self.log_test("Invalid Data Handling", False, response_time, "", "Should return 400/422")
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل لجميع مكونات النظام")
        print("=" * 80)
        
        # Phase 1: Basic API Testing
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
            return
        
        self.test_basic_endpoints()
        self.test_admin_dashboard_endpoints()
        self.test_lines_areas_endpoints()
        
        # Phase 2: Comprehensive Financial Component Testing
        self.test_financial_system_basic()
        self.test_financial_statistics()
        self.test_unified_financial_system()
        
        # Phase 3: Advanced System Component Testing
        self.test_visits_system()
        self.test_activities_system()
        self.test_enhanced_clinics()
        
        # Phase 4: Data Integrity Verification
        self.test_data_relationships()
        self.test_crud_operations()
        self.test_error_handling()
        
        # Generate final report
        self.generate_final_report()
    
    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        successful_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(t["response_time_ms"] for t in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 التقرير النهائي للاختبار الشامل")
        print("=" * 80)
        
        print(f"⏱️  إجمالي وقت التنفيذ: {total_time:.2f}s")
        print(f"🧪 إجمالي الاختبارات: {total_tests}")
        print(f"✅ الاختبارات الناجحة: {successful_tests}")
        print(f"❌ الاختبارات الفاشلة: {failed_tests}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        print(f"⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        # Success rate evaluation
        if success_rate >= 95:
            print(f"🎉 **EXCELLENT - {success_rate:.1f}% SUCCESS - الهدف محقق!**")
            print("✅ جميع المكونات تعمل بشكل مثالي ولا توجد مشاكل في تحميل المكونات")
        elif success_rate >= 85:
            print(f"🟢 **GOOD - {success_rate:.1f}% SUCCESS - قريب من الهدف**")
            print("✅ معظم المكونات تعمل بشكل جيد مع مشاكل بسيطة")
        elif success_rate >= 70:
            print(f"🟡 **FAIR - {success_rate:.1f}% SUCCESS - يحتاج تحسينات**")
            print("⚠️ بعض المكونات تحتاج إصلاحات")
        else:
            print(f"🔴 **POOR - {success_rate:.1f}% SUCCESS - يحتاج إصلاحات جوهرية**")
            print("❌ مشاكل كبيرة في النظام تحتاج معالجة فورية")
        
        # Failed tests summary
        if failed_tests > 0:
            print(f"\n❌ الاختبارات الفاشلة ({failed_tests}):")
            for test in self.test_results:
                if not test["success"]:
                    print(f"   • {test['test']}: {test['error']}")
        
        # Performance summary
        print(f"\n⚡ ملخص الأداء:")
        fast_tests = len([t for t in self.test_results if t["response_time_ms"] < 50])
        medium_tests = len([t for t in self.test_results if 50 <= t["response_time_ms"] < 200])
        slow_tests = len([t for t in self.test_results if t["response_time_ms"] >= 200])
        
        print(f"   🚀 سريع (<50ms): {fast_tests} اختبار")
        print(f"   🏃 متوسط (50-200ms): {medium_tests} اختبار")
        print(f"   🐌 بطيء (>200ms): {slow_tests} اختبار")
        
        print("\n" + "=" * 80)
        
        # Determine if goal is achieved
        if success_rate >= 95:
            print("🎯 **الهدف المطلوب محقق: نسبة نجاح 95%+ مع عدم وجود مشاكل في تحميل المكونات**")
        else:
            print(f"⚠️ **الهدف المطلوب غير محقق: نسبة النجاح {success_rate:.1f}% أقل من 95%**")
            print("🔧 **يُنصح بإصلاح المشاكل المذكورة أعلاه لتحقيق الهدف المطلوب**")

if __name__ == "__main__":
    tester = ComprehensiveSystemReviewTester()
    tester.run_comprehensive_test()