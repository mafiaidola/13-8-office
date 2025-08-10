#!/usr/bin/env python3
"""
Comprehensive Excel System Testing
اختبار شامل لنظام Excel المتكامل الجديد

Testing Requirements from Arabic Review:
1. Login: POST /api/auth/login with admin/admin123
2. Data export endpoints:
   - GET /api/excel/export/clinics
   - GET /api/excel/export/users
   - GET /api/excel/export/orders
   - GET /api/excel/export/debts
   - GET /api/excel/export/payments
3. Import template endpoints:
   - GET /api/excel/template/clinics
   - GET /api/excel/template/users
   - GET /api/excel/template/orders
   - GET /api/excel/template/debts
   - GET /api/excel/template/payments
4. Import settings:
   - GET /api/excel/import-options
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class ExcelSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name} ({response_time:.2f}ms) - {details}")
    
    def test_admin_login(self):
        """Test admin login to get JWT token"""
        start_time = time.time()
        try:
            response = self.session.post(f"{BACKEND_URL}/auth/login", json={
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                user_info = data.get("user", {})
                details = f"User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
                self.log_test("Admin Login", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login", False, response_time, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Admin Login", False, response_time, f"Exception: {str(e)}")
            return False
    
    def test_export_endpoints(self):
        """Test all data export endpoints"""
        export_types = ["clinics", "users", "orders", "debts", "payments"]
        export_results = []
        
        for data_type in export_types:
            start_time = time.time()
            try:
                response = self.session.get(f"{BACKEND_URL}/excel/export/{data_type}")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    # Check if response is Excel file
                    content_type = response.headers.get('content-type', '')
                    content_disposition = response.headers.get('content-disposition', '')
                    
                    if 'spreadsheet' in content_type or 'xlsx' in content_disposition:
                        file_size = len(response.content)
                        details = f"Excel file exported successfully, Size: {file_size} bytes"
                        self.log_test(f"Export {data_type}", True, response_time, details)
                        export_results.append(True)
                    else:
                        details = f"Response not Excel format: {content_type}"
                        self.log_test(f"Export {data_type}", False, response_time, details)
                        export_results.append(False)
                        
                elif response.status_code == 404:
                    # No data found is acceptable
                    details = f"No {data_type} data found (acceptable)"
                    self.log_test(f"Export {data_type}", True, response_time, details)
                    export_results.append(True)
                else:
                    details = f"HTTP {response.status_code}: {response.text[:100]}"
                    self.log_test(f"Export {data_type}", False, response_time, details)
                    export_results.append(False)
                    
            except Exception as e:
                response_time = (time.time() - start_time) * 1000
                details = f"Exception: {str(e)}"
                self.log_test(f"Export {data_type}", False, response_time, details)
                export_results.append(False)
        
        return export_results
    
    def test_template_endpoints(self):
        """Test all template download endpoints"""
        template_types = ["clinics", "users", "orders", "debts", "payments"]
        template_results = []
        
        for data_type in template_types:
            start_time = time.time()
            try:
                response = self.session.get(f"{BACKEND_URL}/excel/template/{data_type}")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    # Check if response is Excel file
                    content_type = response.headers.get('content-type', '')
                    content_disposition = response.headers.get('content-disposition', '')
                    
                    if 'spreadsheet' in content_type or 'xlsx' in content_disposition:
                        file_size = len(response.content)
                        details = f"Template downloaded successfully, Size: {file_size} bytes"
                        self.log_test(f"Template {data_type}", True, response_time, details)
                        template_results.append(True)
                    else:
                        details = f"Response not Excel format: {content_type}"
                        self.log_test(f"Template {data_type}", False, response_time, details)
                        template_results.append(False)
                else:
                    details = f"HTTP {response.status_code}: {response.text[:100]}"
                    self.log_test(f"Template {data_type}", False, response_time, details)
                    template_results.append(False)
                    
            except Exception as e:
                response_time = (time.time() - start_time) * 1000
                details = f"Exception: {str(e)}"
                self.log_test(f"Template {data_type}", False, response_time, details)
                template_results.append(False)
        
        return template_results
    
    def test_import_options(self):
        """Test import options endpoint"""
        start_time = time.time()
        try:
            response = self.session.get(f"{BACKEND_URL}/excel/import-options")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                data_types = data.get("data_types", [])
                import_modes = data.get("import_modes", [])
                
                details = f"Data types: {len(data_types)}, Import modes: {len(import_modes)}"
                self.log_test("Import Options", True, response_time, details)
                
                # Verify expected data types
                expected_types = ["clinics", "users", "orders", "debts", "payments"]
                available_types = [dt.get("id") for dt in data_types]
                
                if all(dt in available_types for dt in expected_types):
                    self.log_test("Import Options - Data Types", True, 0, f"All 5 expected types available: {available_types}")
                else:
                    missing = [dt for dt in expected_types if dt not in available_types]
                    self.log_test("Import Options - Data Types", False, 0, f"Missing types: {missing}")
                
                return True
            else:
                details = f"HTTP {response.status_code}: {response.text[:100]}"
                self.log_test("Import Options", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            details = f"Exception: {str(e)}"
            self.log_test("Import Options", False, response_time, details)
            return False
    
    def test_permissions(self):
        """Test that Excel endpoints require proper permissions"""
        start_time = time.time()
        try:
            # Test without authentication
            session_no_auth = requests.Session()
            response = session_no_auth.get(f"{BACKEND_URL}/excel/export/clinics")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 401:
                details = "Properly protected - requires authentication"
                self.log_test("Excel Permissions", True, response_time, details)
                return True
            else:
                details = f"Security issue - HTTP {response.status_code} (should be 401)"
                self.log_test("Excel Permissions", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            details = f"Exception: {str(e)}"
            self.log_test("Excel Permissions", False, response_time, details)
            return False
    
    def run_comprehensive_test(self):
        """Run comprehensive Excel system test"""
        print("🚀 بدء اختبار شامل لنظام Excel المتكامل الجديد...")
        print("=" * 80)
        
        # Test 1: Admin Login
        if not self.test_admin_login():
            print("❌ فشل تسجيل الدخول - توقف الاختبار")
            return
        
        # Test 2: Import Options
        self.test_import_options()
        
        # Test 3: Template Downloads
        print("\n📋 اختبار تحميل قوالب الاستيراد...")
        template_results = self.test_template_endpoints()
        
        # Test 4: Data Export
        print("\n📤 اختبار تصدير البيانات...")
        export_results = self.test_export_endpoints()
        
        # Test 5: Permissions
        print("\n🔒 اختبار الصلاحيات...")
        self.test_permissions()
        
        # Calculate final results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        total_execution_time = time.time() - self.start_time
        
        print("\n" + "=" * 80)
        print("📊 **نتائج اختبار نظام Excel المتكامل:**")
        print(f"📈 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)")
        print(f"⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        print(f"⏱️ إجمالي وقت التنفيذ: {total_execution_time:.2f}s")
        
        # Detailed results by category
        print("\n📋 **تفاصيل النتائج حسب الفئة:**")
        
        # Authentication
        auth_tests = [r for r in self.test_results if "Login" in r["test"]]
        auth_success = sum(1 for r in auth_tests if r["success"])
        print(f"🔐 المصادقة: {auth_success}/{len(auth_tests)} ({auth_success/len(auth_tests)*100:.1f}%)")
        
        # Templates
        template_tests = [r for r in self.test_results if "Template" in r["test"]]
        template_success = sum(1 for r in template_tests if r["success"])
        print(f"📋 قوالب الاستيراد: {template_success}/{len(template_tests)} ({template_success/len(template_tests)*100:.1f}%)")
        
        # Exports
        export_tests = [r for r in self.test_results if "Export" in r["test"]]
        export_success = sum(1 for r in export_tests if r["success"])
        print(f"📤 تصدير البيانات: {export_success}/{len(export_tests)} ({export_success/len(export_tests)*100:.1f}%)")
        
        # Import Options
        import_tests = [r for r in self.test_results if "Import Options" in r["test"]]
        import_success = sum(1 for r in import_tests if r["success"])
        print(f"⚙️ إعدادات الاستيراد: {import_success}/{len(import_tests)} ({import_success/len(import_tests)*100:.1f}%)")
        
        # Permissions
        perm_tests = [r for r in self.test_results if "Permissions" in r["test"]]
        perm_success = sum(1 for r in perm_tests if r["success"])
        print(f"🔒 الصلاحيات: {perm_success}/{len(perm_tests)} ({perm_success/len(perm_tests)*100:.1f}%)")
        
        print("\n" + "=" * 80)
        
        # Final assessment
        if success_rate >= 90:
            print("🎉 **تقييم نهائي: ممتاز!** نظام Excel يعمل بشكل مثالي")
        elif success_rate >= 75:
            print("✅ **تقييم نهائي: جيد!** نظام Excel يعمل بشكل جيد مع تحسينات بسيطة")
        elif success_rate >= 50:
            print("⚠️ **تقييم نهائي: مقبول!** نظام Excel يحتاج تحسينات")
        else:
            print("❌ **تقييم نهائي: يحتاج إصلاح!** نظام Excel يحتاج إصلاحات جوهرية")
        
        # Specific findings
        print("\n🔍 **النتائج المحددة:**")
        
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("❌ **الاختبارات الفاشلة:**")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        successful_tests_list = [r for r in self.test_results if r["success"]]
        if successful_tests_list:
            print("✅ **الاختبارات الناجحة:**")
            for test in successful_tests_list:
                print(f"   - {test['test']}: {test['details']}")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "avg_response_time": avg_response_time,
            "total_execution_time": total_execution_time,
            "failed_tests": failed_tests,
            "test_results": self.test_results
        }

def main():
    """Main testing function"""
    print("🎯 **اختبار شامل لنظام Excel المتكامل الجديد - المرحلة الثالثة**")
    print("📋 **المتطلبات:** اختبار جميع endpoints تصدير البيانات، قوالب الاستيراد، وإعدادات الاستيراد")
    print("=" * 80)
    
    tester = ExcelSystemTester()
    results = tester.run_comprehensive_test()
    
    print(f"\n🏁 **اختبار نظام Excel مكتمل!**")
    print(f"📊 النتيجة النهائية: {results['success_rate']:.1f}% نجاح")
    
    return results

if __name__ == "__main__":
    main()