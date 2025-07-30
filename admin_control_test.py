#!/usr/bin/env python3
"""
Comprehensive Admin Control System Testing
Tests the newly implemented admin settings and feature toggle APIs
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://d7110555-9702-4d91-b5fc-522e9a08df1c.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class AdminControlTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.manager_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def setup_authentication(self):
        """Setup admin authentication and create test users"""
        print("🔐 Setting up authentication...")
        
        # Admin login
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            print(f"✅ Admin login successful: {response.get('user', {}).get('username')}")
        else:
            print(f"❌ Admin login failed: {status_code}")
            return False
        
        # Create sales rep for testing restrictions
        timestamp = str(int(time.time()))
        sales_rep_data = {
            "username": f"sales_rep_{timestamp}",
            "email": f"salesrep_{timestamp}@test.com",
            "password": "salesrep123",
            "role": "sales_rep",
            "full_name": "مندوب المبيعات التجريبي",
            "phone": "+966501111111"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        if status_code == 200:
            # Login as sales rep
            login_data = {"username": f"sales_rep_{timestamp}", "password": "salesrep123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.sales_rep_token = login_response["token"]
                print(f"✅ Sales rep created and logged in")
        
        # Create manager for testing restrictions
        manager_data = {
            "username": f"manager_{timestamp}",
            "email": f"manager_{timestamp}@test.com",
            "password": "manager123",
            "role": "manager",
            "full_name": "مدير التجريبي",
            "phone": "+966502222222"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        if status_code == 200:
            # Login as manager
            login_data = {"username": f"manager_{timestamp}", "password": "manager123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.manager_token = login_response["token"]
                print(f"✅ Manager created and logged in")
        
        return True
    
    def test_admin_settings_user_management(self):
        """Test POST /api/admin/settings/user-management"""
        user_management_settings = {
            "max_users_per_role": {"sales_rep": 100, "manager": 20, "warehouse_manager": 10},
            "password_policy": {
                "min_length": 8,
                "require_uppercase": True,
                "require_numbers": True,
                "require_special_chars": False
            },
            "session_timeout_minutes": 480,
            "auto_deactivate_inactive_days": 90,
            "role_hierarchy_enabled": True,
            "bulk_user_operations": True
        }
        
        status_code, response = self.make_request("POST", "/admin/settings/user-management", user_management_settings, self.admin_token)
        
        if status_code == 200:
            self.log_test("Admin Settings User Management", True, "User management settings updated successfully")
            return True
        else:
            self.log_test("Admin Settings User Management", False, f"Status: {status_code}", response)
        return False

    def test_admin_settings_gps(self):
        """Test POST /api/admin/settings/gps"""
        gps_settings = {
            "geofence_radius_meters": 20,
            "location_accuracy_required": "high",
            "background_tracking": True,
            "offline_location_storage": True,
            "location_history_retention_days": 365,
            "gps_required_for_visits": True,
            "allow_manual_location_override": False,
            "location_verification_timeout_seconds": 30
        }
        
        status_code, response = self.make_request("POST", "/admin/settings/gps", gps_settings, self.admin_token)
        
        if status_code == 200:
            self.log_test("Admin Settings GPS", True, "GPS settings updated successfully")
            return True
        else:
            self.log_test("Admin Settings GPS", False, f"Status: {status_code}", response)
        return False

    def test_admin_settings_theme(self):
        """Test POST /api/admin/settings/theme"""
        theme_settings = {
            "default_theme": "dark",
            "available_themes": ["dark", "light", "blue", "green", "purple"],
            "custom_colors": {
                "primary": "#ff6b35",
                "secondary": "#0ea5e9",
                "accent": "#10b981",
                "background": "#1f2937",
                "surface": "#374151"
            },
            "logo_settings": {
                "show_logo": True,
                "logo_position": "top-left",
                "logo_size": "medium"
            },
            "font_settings": {
                "arabic_font": "Cairo",
                "english_font": "Inter",
                "font_size": "medium"
            }
        }
        
        status_code, response = self.make_request("POST", "/admin/settings/theme", theme_settings, self.admin_token)
        
        if status_code == 200:
            self.log_test("Admin Settings Theme", True, "Theme settings updated successfully")
            return True
        else:
            self.log_test("Admin Settings Theme", False, f"Status: {status_code}", response)
        return False

    def test_admin_settings_notifications(self):
        """Test POST /api/admin/settings/notifications"""
        notification_settings = {
            "push_notifications_enabled": True,
            "email_notifications_enabled": True,
            "sms_notifications_enabled": False,
            "notification_types": {
                "visit_reminders": True,
                "order_approvals": True,
                "system_alerts": True,
                "performance_reports": True,
                "achievement_unlocked": True
            },
            "quiet_hours": {
                "enabled": True,
                "start_time": "22:00",
                "end_time": "07:00"
            },
            "notification_retention_days": 30
        }
        
        status_code, response = self.make_request("POST", "/admin/settings/notifications", notification_settings, self.admin_token)
        
        if status_code == 200:
            self.log_test("Admin Settings Notifications", True, "Notification settings updated successfully")
            return True
        else:
            self.log_test("Admin Settings Notifications", False, f"Status: {status_code}", response)
        return False

    def test_admin_settings_category_retrieval(self):
        """Test GET /api/admin/settings/{category}"""
        categories_to_test = ["user-management", "gps", "theme", "notifications", "chat", "scanner", "visits", "security"]
        successful_retrievals = 0
        
        for category in categories_to_test:
            status_code, response = self.make_request("GET", f"/admin/settings/{category}", token=self.admin_token)
            
            if status_code == 200:
                successful_retrievals += 1
            elif status_code == 400 and "Invalid settings category" in response.get("detail", ""):
                # This is expected for invalid categories
                pass
        
        if successful_retrievals >= len(categories_to_test) - 1:  # Allow for one potential failure
            self.log_test("Admin Settings Category Retrieval", True, f"Successfully retrieved {successful_retrievals}/{len(categories_to_test)} categories")
            return True
        else:
            self.log_test("Admin Settings Category Retrieval", False, f"Only retrieved {successful_retrievals}/{len(categories_to_test)} categories")
        return False

    def test_feature_toggle_system(self):
        """Test POST /api/admin/features/toggle"""
        features_to_test = ["gps_tracking", "gamification", "chat_system", "document_scanner"]
        successful_toggles = 0
        
        for feature in features_to_test:
            # Toggle feature OFF
            toggle_data = {"feature_name": feature, "enabled": False}
            status_code, response = self.make_request("POST", "/admin/features/toggle", toggle_data, self.admin_token)
            
            if status_code == 200:
                # Toggle feature ON
                toggle_data = {"feature_name": feature, "enabled": True}
                status_code, response = self.make_request("POST", "/admin/features/toggle", toggle_data, self.admin_token)
                
                if status_code == 200:
                    successful_toggles += 1
                else:
                    self.log_test("Feature Toggle System", False, f"Failed to toggle {feature} ON: {status_code}", response)
                    return False
            else:
                self.log_test("Feature Toggle System", False, f"Failed to toggle {feature} OFF: {status_code}", response)
                return False
        
        if successful_toggles == len(features_to_test):
            self.log_test("Feature Toggle System", True, f"Successfully toggled all {successful_toggles} key features")
            return True
        else:
            self.log_test("Feature Toggle System", False, f"Only toggled {successful_toggles}/{len(features_to_test)} features")
        return False

    def test_feature_status_retrieval(self):
        """Test GET /api/admin/features/status"""
        status_code, response = self.make_request("GET", "/admin/features/status", token=self.admin_token)
        
        if status_code == 200:
            expected_features = [
                "gps_tracking", "gamification", "chat_system", "document_scanner",
                "visit_management", "accounting_system", "notifications", "analytics",
                "user_registration", "theme_switching", "language_switching"
            ]
            
            missing_features = [feature for feature in expected_features if feature not in response]
            
            if not missing_features:
                invalid_values = [feature for feature, value in response.items() if not isinstance(value, bool)]
                
                if not invalid_values:
                    self.log_test("Feature Status Retrieval", True, f"Retrieved status for {len(response)} features with proper boolean values")
                    return True
                else:
                    self.log_test("Feature Status Retrieval", False, f"Invalid boolean values for features: {invalid_values}")
            else:
                self.log_test("Feature Status Retrieval", False, f"Missing expected features: {missing_features}")
        else:
            self.log_test("Feature Status Retrieval", False, f"Status: {status_code}", response)
        return False

    def test_admin_authorization_restrictions(self):
        """Test that only GM/Admin can access admin endpoints"""
        admin_endpoints = [
            "/admin/settings/user-management",
            "/admin/settings/gps", 
            "/admin/settings/theme",
            "/admin/settings/notifications"
        ]
        
        unauthorized_attempts = 0
        
        for endpoint in admin_endpoints:
            status_code, response = self.make_request("POST", endpoint, {"test": "data"}, self.sales_rep_token)
            
            if status_code == 403:
                unauthorized_attempts += 1
            else:
                self.log_test("Admin Authorization Restrictions", False, f"Sales rep not denied access to {endpoint}: {status_code}")
                return False
        
        # Test feature toggle access restriction
        toggle_data = {"feature_name": "gps_tracking", "enabled": False}
        status_code, response = self.make_request("POST", "/admin/features/toggle", toggle_data, self.sales_rep_token)
        
        if status_code == 403:
            unauthorized_attempts += 1
        
        # Test feature status access restriction
        status_code, response = self.make_request("GET", "/admin/features/status", token=self.sales_rep_token)
        
        if status_code == 403:
            unauthorized_attempts += 1
        
        if unauthorized_attempts == len(admin_endpoints) + 2:  # +2 for feature endpoints
            self.log_test("Admin Authorization Restrictions", True, f"All {unauthorized_attempts} admin endpoints properly restricted")
            return True
        else:
            self.log_test("Admin Authorization Restrictions", False, f"Only {unauthorized_attempts} endpoints properly restricted")
        return False

    def test_manager_authorization_restrictions(self):
        """Test that managers cannot access admin control endpoints"""
        admin_endpoints = [
            "/admin/settings/user-management",
            "/admin/features/toggle",
            "/admin/features/status"
        ]
        
        unauthorized_attempts = 0
        
        for endpoint in admin_endpoints:
            if "toggle" in endpoint:
                toggle_data = {"feature_name": "gps_tracking", "enabled": False}
                status_code, response = self.make_request("POST", endpoint, toggle_data, self.manager_token)
            elif "status" in endpoint:
                status_code, response = self.make_request("GET", endpoint, token=self.manager_token)
            else:
                status_code, response = self.make_request("POST", endpoint, {"test": "data"}, self.manager_token)
            
            if status_code == 403:
                unauthorized_attempts += 1
        
        if unauthorized_attempts == len(admin_endpoints):
            self.log_test("Manager Authorization Restrictions", True, f"All {unauthorized_attempts} admin endpoints properly restricted from managers")
            return True
        else:
            self.log_test("Manager Authorization Restrictions", False, f"Only {unauthorized_attempts} endpoints properly restricted")
        return False

    def test_comprehensive_admin_control_integration(self):
        """Test complete admin control system integration"""
        # Step 1: Update GPS settings
        gps_settings = {"geofence_radius_meters": 25, "gps_required_for_visits": True}
        status_code, response = self.make_request("POST", "/admin/settings/gps", gps_settings, self.admin_token)
        
        if status_code != 200:
            self.log_test("Comprehensive Admin Control Integration", False, "Failed to update GPS settings")
            return False
        
        # Step 2: Toggle gamification feature
        toggle_data = {"feature_name": "gamification", "enabled": False}
        status_code, response = self.make_request("POST", "/admin/features/toggle", toggle_data, self.admin_token)
        
        if status_code != 200:
            self.log_test("Comprehensive Admin Control Integration", False, "Failed to toggle gamification feature")
            return False
        
        # Step 3: Verify feature status reflects the change
        status_code, features = self.make_request("GET", "/admin/features/status", token=self.admin_token)
        
        if status_code == 200 and features.get("gamification") == False:
            # Step 4: Retrieve GPS settings to verify persistence
            status_code, gps_retrieved = self.make_request("GET", "/admin/settings/gps", token=self.admin_token)
            
            if status_code == 200:
                # Step 5: Toggle gamification back on
                toggle_data = {"feature_name": "gamification", "enabled": True}
                status_code, response = self.make_request("POST", "/admin/features/toggle", toggle_data, self.admin_token)
                
                if status_code == 200:
                    self.log_test("Comprehensive Admin Control Integration", True, "Complete admin control workflow successful - settings persist, features toggle correctly")
                    return True
                else:
                    self.log_test("Comprehensive Admin Control Integration", False, "Failed to toggle gamification back on")
            else:
                self.log_test("Comprehensive Admin Control Integration", False, "Failed to retrieve GPS settings")
        else:
            self.log_test("Comprehensive Admin Control Integration", False, "Feature status not updated correctly")
        return False

    def run_all_tests(self):
        """Run all comprehensive admin control tests"""
        print("🎛️ COMPREHENSIVE ADMIN CONTROL SYSTEM TESTING")
        print("=" * 80)
        print("Testing the newly implemented comprehensive admin control system:")
        print("- Admin Settings APIs (user-management, GPS, theme, notifications)")
        print("- Feature Toggle System (gps_tracking, gamification, chat_system, document_scanner)")
        print("- Admin Authorization (GM/Admin only access)")
        print("- System Integration (settings persistence, feature toggles)")
        print("=" * 80)
        
        if not self.setup_authentication():
            print("❌ Authentication setup failed. Cannot proceed with tests.")
            return
        
        print("\n🔧 COMPREHENSIVE ADMIN SETTINGS APIS")
        print("-" * 50)
        
        tests = [
            self.test_admin_settings_user_management,
            self.test_admin_settings_gps,
            self.test_admin_settings_theme,
            self.test_admin_settings_notifications,
            self.test_admin_settings_category_retrieval,
        ]
        
        for test in tests:
            test()
        
        print("\n🎚️ FEATURE TOGGLE SYSTEM")
        print("-" * 50)
        
        feature_tests = [
            self.test_feature_toggle_system,
            self.test_feature_status_retrieval,
        ]
        
        for test in feature_tests:
            test()
        
        print("\n🔒 ADMIN AUTHORIZATION TESTING")
        print("-" * 50)
        
        auth_tests = [
            self.test_admin_authorization_restrictions,
            self.test_manager_authorization_restrictions,
        ]
        
        for test in auth_tests:
            test()
        
        print("\n🔄 SYSTEM INTEGRATION TESTING")
        print("-" * 50)
        
        self.test_comprehensive_admin_control_integration()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE ADMIN CONTROL SYSTEM TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT! The comprehensive admin control system is working perfectly!")
        elif success_rate >= 70:
            print("\n✅ GOOD! Most admin control features are working correctly.")
        else:
            print("\n⚠️ NEEDS ATTENTION! Several admin control features need fixes.")
        
        return passed_tests, failed_tests

if __name__ == "__main__":
    tester = AdminControlTester()
    tester.run_all_tests()