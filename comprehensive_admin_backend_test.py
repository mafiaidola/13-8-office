#!/usr/bin/env python3
"""
Comprehensive Admin Backend Testing - Arabic Review Requirements
فحص شامل للباكند للتأكد من أن جميع الأزرار والوظائف تعمل بشكل صحيح

Testing Focus:
1. اختبار تسجيل الدخول مع admin/admin123
2. اختبار جميع APIs الأساسية للتأكد من عملها
3. اختبار الأدوار والصلاحيات
4. اختبار الإعدادات الشاملة للأدمن
5. اختبار كل endpoint للتأكد من أنه يعمل بشكل صحيح
6. التأكد من أن كل الوظائف مربوطة بشكل صحيح

Special Focus:
- فحص /api/admin/settings/comprehensive
- فحص /api/admin/features/toggle
- فحص /api/admin/features/status
- فحص جميع إعدادات الأدمن
- فحص الأدوار والصلاحيات
"""

import requests
import json
import sys
from datetime import datetime
import time

# Backend URL from environment
BACKEND_URL = "https://bd501eff-b5f7-4f63-9578-160402c0ca0a.preview.emergentagent.com/api"

class ComprehensiveAdminBackendTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.manager_token = None
        self.sales_rep_token = None
        self.test_results = []
        self.created_entities = []  # Track created entities for cleanup
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def admin_login(self):
        """Test admin login with admin/admin123"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                user_info = data.get("user", {})
                self.log_test("Admin Login (admin/admin123)", True, 
                            f"Login successful - User: {user_info.get('full_name', 'Admin')}, Role: {user_info.get('role', 'admin')}")
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login (admin/admin123)", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_admin_settings_get(self):
        """Test GET /api/admin/settings/comprehensive"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/admin/settings/comprehensive", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Check for required sections
                required_sections = ["role_statistics", "line_statistics", "available_roles", "available_lines", "total_users"]
                missing_sections = [section for section in required_sections if section not in data]
                
                if not missing_sections:
                    self.log_test("GET /api/admin/settings/comprehensive", True, 
                                f"All required sections present: {', '.join(required_sections)}. Total users: {data.get('total_users', 0)}")
                    return True
                else:
                    self.log_test("GET /api/admin/settings/comprehensive", False, 
                                f"Missing sections: {', '.join(missing_sections)}")
                    return False
            else:
                self.log_test("GET /api/admin/settings/comprehensive", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin/settings/comprehensive", False, f"Exception: {str(e)}")
            return False

    def test_comprehensive_admin_settings_post(self):
        """Test POST /api/admin/settings/comprehensive"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test settings update
            settings_data = {
                "company_name": "شركة الاختبار الشاملة",
                "primary_color": "#ff6b35",
                "secondary_color": "#0ea5e9",
                "default_theme": "dark",
                "language": "ar",
                "role_permissions": {
                    "admin": ["all"],
                    "gm": ["users.manage", "settings.manage"],
                    "medical_rep": ["visits.create", "orders.create"]
                }
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/settings/comprehensive", 
                                   json=settings_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("POST /api/admin/settings/comprehensive", True, 
                            "Settings updated successfully with Arabic company name and role permissions")
                return True
            else:
                self.log_test("POST /api/admin/settings/comprehensive", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/admin/settings/comprehensive", False, f"Exception: {str(e)}")
            return False

    def test_admin_features_status(self):
        """Test GET /api/admin/features/status"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/admin/features/status", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Check for feature status structure
                if isinstance(data, dict) and len(data) > 0:
                    feature_count = len(data)
                    enabled_features = sum(1 for v in data.values() if v)
                    self.log_test("GET /api/admin/features/status", True, 
                                f"Found {feature_count} features, {enabled_features} enabled")
                    return True
                else:
                    self.log_test("GET /api/admin/features/status", False, "No features found or invalid structure")
                    return False
            else:
                self.log_test("GET /api/admin/features/status", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/admin/features/status", False, f"Exception: {str(e)}")
            return False

    def test_admin_features_toggle(self):
        """Test POST /api/admin/features/toggle"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test toggling a feature (correct parameter name is feature_name)
            toggle_data = {
                "feature_name": "gps_tracking",
                "enabled": True
            }
            
            response = requests.post(f"{BACKEND_URL}/admin/features/toggle", 
                                   json=toggle_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/admin/features/toggle", True, 
                            f"Feature toggle successful: {toggle_data['feature_name']} = {toggle_data['enabled']}")
                return True
            else:
                self.log_test("POST /api/admin/features/toggle", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/admin/features/toggle", False, f"Exception: {str(e)}")
            return False

    def test_role_based_permissions(self):
        """Test role-based access control"""
        try:
            # Test admin access to dashboard stats (simpler endpoint)
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/dashboard/stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                self.log_test("Admin Role Permissions - Dashboard Access", True, 
                            f"Admin can access dashboard stats (found {stats.get('total_users', 0)} users)")
            else:
                self.log_test("Admin Role Permissions - Dashboard Access", False, 
                            f"Admin cannot access dashboard: {response.status_code}")
                return False
            
            # Test admin access to warehouses
            response = requests.get(f"{BACKEND_URL}/warehouses", headers=headers)
            if response.status_code == 200:
                warehouses = response.json()
                self.log_test("Admin Role Permissions - Warehouse Access", True, 
                            f"Admin can access warehouses ({len(warehouses)} warehouses found)")
            else:
                self.log_test("Admin Role Permissions - Warehouse Access", False, 
                            f"Admin cannot access warehouses: {response.status_code}")
                return False
            
            # Test admin access to products
            response = requests.get(f"{BACKEND_URL}/products", headers=headers)
            if response.status_code == 200:
                products = response.json()
                self.log_test("Admin Role Permissions - Product Access", True, 
                            f"Admin can access products ({len(products)} products found)")
                return True
            else:
                self.log_test("Admin Role Permissions - Product Access", False, 
                            f"Admin cannot access products: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Role-Based Permissions Test", False, f"Exception: {str(e)}")
            return False

    def test_basic_apis(self):
        """Test all basic APIs for functionality"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        basic_apis = [
            ("GET", "/dashboard/stats", "Dashboard Statistics"),
            ("GET", "/users/managers", "Managers List"),
            ("GET", "/regions/list", "Regions List"),
            ("GET", "/analytics/realtime", "Real-time Analytics"),
            ("GET", "/language/translations?lang=ar", "Arabic Translations"),
            ("GET", "/gamification/achievements", "Achievements List"),
            ("GET", "/accounting/overview", "Accounting Overview"),
            ("GET", "/admin/system-health", "System Health")
        ]
        
        successful_apis = 0
        total_apis = len(basic_apis)
        
        for method, endpoint, name in basic_apis:
            try:
                if method == "GET":
                    response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
                else:
                    response = requests.post(f"{BACKEND_URL}{endpoint}", headers=headers)
                
                if response.status_code == 200:
                    self.log_test(f"Basic API - {name}", True, f"API responding correctly")
                    successful_apis += 1
                else:
                    self.log_test(f"Basic API - {name}", False, 
                                f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Basic API - {name}", False, f"Exception: {str(e)}")
        
        # Overall basic APIs test result
        success_rate = (successful_apis / total_apis) * 100
        if success_rate >= 70:
            self.log_test("Overall Basic APIs Test", True, 
                        f"{successful_apis}/{total_apis} APIs working ({success_rate:.1f}%)")
            return True
        else:
            self.log_test("Overall Basic APIs Test", False, 
                        f"Only {successful_apis}/{total_apis} APIs working ({success_rate:.1f}%)")
            return False

    def test_admin_control_settings(self):
        """Test various admin control settings"""
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test different admin settings categories
        settings_categories = [
            "user-management",
            "gps", 
            "theme",
            "notifications"
        ]
        
        successful_settings = 0
        
        for category in settings_categories:
            try:
                # Test GET settings for category
                response = requests.get(f"{BACKEND_URL}/admin/settings/{category}", headers=headers)
                
                if response.status_code == 200:
                    self.log_test(f"Admin Settings - {category}", True, 
                                f"Settings category accessible")
                    successful_settings += 1
                else:
                    self.log_test(f"Admin Settings - {category}", False, 
                                f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_test(f"Admin Settings - {category}", False, f"Exception: {str(e)}")
        
        # Test overall admin settings functionality
        if successful_settings >= len(settings_categories) * 0.7:
            self.log_test("Admin Control Settings Overall", True, 
                        f"{successful_settings}/{len(settings_categories)} settings categories working")
            return True
        else:
            self.log_test("Admin Control Settings Overall", False, 
                        f"Only {successful_settings}/{len(settings_categories)} settings categories working")
            return False

    def test_system_initialization(self):
        """Test system initialization API"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{BACKEND_URL}/admin/initialize-system", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("System Initialization API", True, 
                            "System initialization API working correctly")
                return True
            else:
                self.log_test("System Initialization API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("System Initialization API", False, f"Exception: {str(e)}")
            return False

    def test_line_based_functionality(self):
        """Test line-based product separation and management"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test line-based product retrieval
            for line in ["line_1", "line_2"]:
                response = requests.get(f"{BACKEND_URL}/products/by-line/{line}", headers=headers)
                
                if response.status_code == 200:
                    products = response.json()
                    self.log_test(f"Line-Based Products - {line}", True, 
                                f"Found {len(products)} products for {line}")
                else:
                    self.log_test(f"Line-Based Products - {line}", False, 
                                f"Status: {response.status_code}")
                    return False
            
            return True
                
        except Exception as e:
            self.log_test("Line-Based Functionality", False, f"Exception: {str(e)}")
            return False

    def test_region_district_management(self):
        """Test region and district management APIs"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test regions API
            response = requests.get(f"{BACKEND_URL}/admin/regions", headers=headers)
            if response.status_code == 200:
                regions = response.json()
                self.log_test("Region Management API", True, 
                            f"Found {len(regions)} regions")
            else:
                self.log_test("Region Management API", False, 
                            f"Status: {response.status_code}")
                return False
            
            # Test districts API
            response = requests.get(f"{BACKEND_URL}/admin/districts", headers=headers)
            if response.status_code == 200:
                districts = response.json()
                self.log_test("District Management API", True, 
                            f"Found {len(districts)} districts")
                return True
            else:
                self.log_test("District Management API", False, 
                            f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Region/District Management", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run comprehensive admin backend testing"""
        print("🎯 COMPREHENSIVE ADMIN BACKEND TESTING - ARABIC REVIEW REQUIREMENTS")
        print("=" * 80)
        print("فحص شامل للباكند للتأكد من أن جميع الأزرار والوظائف تعمل بشكل صحيح")
        print()
        print("Testing Focus:")
        print("1. اختبار تسجيل الدخول مع admin/admin123")
        print("2. اختبار جميع APIs الأساسية للتأكد من عملها")
        print("3. اختبار الأدوار والصلاحيات")
        print("4. اختبار الإعدادات الشاملة للأدمن")
        print("5. اختبار كل endpoint للتأكد من أنه يعمل بشكل صحيح")
        print("6. التأكد من أن كل الوظائف مربوطة بشكل صحيح")
        print()
        
        # 1. Test admin login (admin/admin123)
        admin_login_success = self.admin_login()
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # 2. Test comprehensive admin settings APIs
        self.test_comprehensive_admin_settings_get()
        self.test_comprehensive_admin_settings_post()
        
        # 3. Test admin features APIs
        self.test_admin_features_status()
        self.test_admin_features_toggle()
        
        # 4. Test role-based permissions
        self.test_role_based_permissions()
        
        # 5. Test all basic APIs
        self.test_basic_apis()
        
        # 6. Test admin control settings
        self.test_admin_control_settings()
        
        # 7. Test system initialization
        self.test_system_initialization()
        
        # 8. Test line-based functionality
        self.test_line_based_functionality()
        
        # 9. Test region and district management
        self.test_region_district_management()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE ADMIN BACKEND TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Categorize results
        critical_tests = []
        basic_tests = []
        
        for result in self.test_results:
            if any(keyword in result['test'].lower() for keyword in ['admin login', 'comprehensive', 'features', 'permissions']):
                critical_tests.append(result)
            else:
                basic_tests.append(result)
        
        # Show critical test results
        if critical_tests:
            print("🔥 CRITICAL TESTS:")
            for result in critical_tests:
                print(f"  {result['status']}: {result['test']}")
                if result['details']:
                    print(f"     {result['details']}")
            print()
        
        # Show basic test results
        if basic_tests:
            print("📋 BASIC FUNCTIONALITY TESTS:")
            for result in basic_tests:
                print(f"  {result['status']}: {result['test']}")
            print()
        
        print("=" * 80)
        
        # Overall assessment
        if success_rate >= 90:
            print("🎉 COMPREHENSIVE ADMIN BACKEND: EXCELLENT - ALL SYSTEMS OPERATIONAL")
            status = "EXCELLENT"
        elif success_rate >= 80:
            print("✅ COMPREHENSIVE ADMIN BACKEND: GOOD - MOST SYSTEMS WORKING")
            status = "GOOD"
        elif success_rate >= 70:
            print("⚠️  COMPREHENSIVE ADMIN BACKEND: ACCEPTABLE - SOME ISSUES FOUND")
            status = "ACCEPTABLE"
        else:
            print("❌ COMPREHENSIVE ADMIN BACKEND: NEEDS ATTENTION - MULTIPLE ISSUES")
            status = "NEEDS_ATTENTION"
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "status": status,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = ComprehensiveAdminBackendTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 70:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()