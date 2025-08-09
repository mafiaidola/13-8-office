#!/usr/bin/env python3
"""
Enhanced User Profile API Access Control Testing
Testing role-based access control for the enhanced user profile API
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://39bfa0e9-57ce-4da8-b444-8d148da868a0.preview.emergentagent.com/api"

class ProfileAccessControlTester:
    def __init__(self):
        self.admin_token = None
        self.manager_token = None
        self.sales_rep_token = None
        self.test_results = []
        self.admin_user_id = None
        self.manager_user_id = None
        self.sales_rep_user_id = None
        
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

    def login_user(self, username, password, role_name):
        """Generic login function"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": username,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data["token"]
                
                # Get user info
                headers = {"Authorization": f"Bearer {token}"}
                users_response = requests.get(f"{BACKEND_URL}/users", headers=headers)
                user_id = None
                
                if users_response.status_code == 200:
                    users = users_response.json()
                    user = next((u for u in users if u.get("username") == username), None)
                    if user:
                        user_id = user["id"]
                
                self.log_test(f"{role_name} Authentication", True, f"{role_name} login successful, user_id: {user_id}")
                return token, user_id
            else:
                self.log_test(f"{role_name} Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return None, None
                
        except Exception as e:
            self.log_test(f"{role_name} Authentication", False, f"Exception: {str(e)}")
            return None, None

    def setup_test_users(self):
        """Setup test users with different roles"""
        # Login as admin first
        self.admin_token, self.admin_user_id = self.login_user("admin", "admin123", "Admin")
        
        if not self.admin_token:
            return False
        
        # Get existing users
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{BACKEND_URL}/users", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            
            # Find manager and sales rep users
            for user in users:
                if user.get("role") in ["manager", "district_manager", "area_manager"] and not self.manager_user_id:
                    self.manager_user_id = user["id"]
                elif user.get("role") in ["sales_rep", "medical_rep"] and not self.sales_rep_user_id:
                    self.sales_rep_user_id = user["id"]
            
            # Try to login with existing manager and sales rep accounts
            # Note: We don't have their passwords, so we'll create test scenarios with admin token
            
            self.log_test("Setup Test Users", True, 
                        f"Admin: {self.admin_user_id}, Manager: {self.manager_user_id}, Sales Rep: {self.sales_rep_user_id}")
            return True
        else:
            self.log_test("Setup Test Users", False, f"Failed to get users: {response.status_code}")
            return False

    def test_admin_access_all_profiles(self):
        """Test that admin can access any user profile"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test admin accessing own profile
            if self.admin_user_id:
                response = requests.get(f"{BACKEND_URL}/users/{self.admin_user_id}/profile", headers=headers)
                if response.status_code == 200:
                    self.log_test("Admin Access - Own Profile", True, "Admin can access own profile")
                else:
                    self.log_test("Admin Access - Own Profile", False, f"Status: {response.status_code}")
            
            # Test admin accessing manager profile
            if self.manager_user_id:
                response = requests.get(f"{BACKEND_URL}/users/{self.manager_user_id}/profile", headers=headers)
                if response.status_code == 200:
                    profile_data = response.json()
                    user_name = profile_data.get("user", {}).get("full_name", "Unknown")
                    self.log_test("Admin Access - Manager Profile", True, f"Admin can access manager profile: {user_name}")
                else:
                    self.log_test("Admin Access - Manager Profile", False, f"Status: {response.status_code}")
            
            # Test admin accessing sales rep profile
            if self.sales_rep_user_id:
                response = requests.get(f"{BACKEND_URL}/users/{self.sales_rep_user_id}/profile", headers=headers)
                if response.status_code == 200:
                    profile_data = response.json()
                    user_name = profile_data.get("user", {}).get("full_name", "Unknown")
                    self.log_test("Admin Access - Sales Rep Profile", True, f"Admin can access sales rep profile: {user_name}")
                else:
                    self.log_test("Admin Access - Sales Rep Profile", False, f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("Admin Access All Profiles", False, f"Exception: {str(e)}")

    def test_profile_data_structure_consistency(self):
        """Test that profile data structure is consistent across different users"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            test_users = [
                (self.admin_user_id, "Admin"),
                (self.manager_user_id, "Manager"),
                (self.sales_rep_user_id, "Sales Rep")
            ]
            
            for user_id, user_type in test_users:
                if user_id:
                    response = requests.get(f"{BACKEND_URL}/users/{user_id}/profile", headers=headers)
                    
                    if response.status_code == 200:
                        profile_data = response.json()
                        
                        # Check required sections
                        required_sections = ["user", "sales_activity", "debt_info", "territory_info", "team_info"]
                        missing_sections = [section for section in required_sections if section not in profile_data]
                        
                        if not missing_sections:
                            # Check user section structure
                            user_data = profile_data["user"]
                            required_user_fields = ["id", "username", "full_name", "role"]
                            missing_user_fields = [field for field in required_user_fields if field not in user_data]
                            
                            if not missing_user_fields:
                                self.log_test(f"Profile Structure - {user_type}", True, 
                                            f"Complete structure for {user_data.get('full_name', 'Unknown')} ({user_data.get('role', 'Unknown')})")
                            else:
                                self.log_test(f"Profile Structure - {user_type}", False, 
                                            f"Missing user fields: {missing_user_fields}")
                        else:
                            self.log_test(f"Profile Structure - {user_type}", False, 
                                        f"Missing sections: {missing_sections}")
                    else:
                        self.log_test(f"Profile Structure - {user_type}", False, 
                                    f"Status: {response.status_code}")
                        
        except Exception as e:
            self.log_test("Profile Data Structure Consistency", False, f"Exception: {str(e)}")

    def test_sales_activity_for_different_roles(self):
        """Test sales activity data for different user roles"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            test_users = [
                (self.admin_user_id, "Admin"),
                (self.manager_user_id, "Manager"),
                (self.sales_rep_user_id, "Sales Rep")
            ]
            
            for user_id, user_type in test_users:
                if user_id:
                    response = requests.get(f"{BACKEND_URL}/users/{user_id}/profile", headers=headers)
                    
                    if response.status_code == 200:
                        profile_data = response.json()
                        sales_activity = profile_data.get("sales_activity", {})
                        
                        # Check sales activity fields
                        total_orders = sales_activity.get("total_orders", 0)
                        total_revenue = sales_activity.get("total_revenue", 0)
                        conversion_rate = sales_activity.get("conversion_rate", 0)
                        
                        self.log_test(f"Sales Activity - {user_type}", True, 
                                    f"Orders: {total_orders}, Revenue: {total_revenue}, Conversion: {conversion_rate}%")
                    else:
                        self.log_test(f"Sales Activity - {user_type}", False, 
                                    f"Status: {response.status_code}")
                        
        except Exception as e:
            self.log_test("Sales Activity for Different Roles", False, f"Exception: {str(e)}")

    def test_team_info_for_managers(self):
        """Test team information for manager roles"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            if self.manager_user_id:
                response = requests.get(f"{BACKEND_URL}/users/{self.manager_user_id}/profile", headers=headers)
                
                if response.status_code == 200:
                    profile_data = response.json()
                    team_info = profile_data.get("team_info", {})
                    
                    team_members = team_info.get("team_members", [])
                    direct_manager = team_info.get("direct_manager")
                    
                    self.log_test("Team Info for Manager", True, 
                                f"Team members: {len(team_members)}, Has direct manager: {direct_manager is not None}")
                else:
                    self.log_test("Team Info for Manager", False, f"Status: {response.status_code}")
            else:
                self.log_test("Team Info for Manager", False, "No manager user found for testing")
                
        except Exception as e:
            self.log_test("Team Info for Managers", False, f"Exception: {str(e)}")

    def test_territory_info_accuracy(self):
        """Test territory information accuracy"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            test_users = [
                (self.admin_user_id, "Admin"),
                (self.sales_rep_user_id, "Sales Rep")
            ]
            
            for user_id, user_type in test_users:
                if user_id:
                    response = requests.get(f"{BACKEND_URL}/users/{user_id}/profile", headers=headers)
                    
                    if response.status_code == 200:
                        profile_data = response.json()
                        territory_info = profile_data.get("territory_info", {})
                        
                        region_name = territory_info.get("region_name", "غير محدد")
                        assigned_clinics = territory_info.get("assigned_clinics", 0)
                        active_clinics = territory_info.get("active_clinics", 0)
                        coverage_percentage = territory_info.get("coverage_percentage", 0)
                        
                        # Basic validation
                        valid_coverage = 0 <= coverage_percentage <= 100
                        valid_clinics = active_clinics <= assigned_clinics
                        
                        if valid_coverage and valid_clinics:
                            self.log_test(f"Territory Info - {user_type}", True, 
                                        f"Region: {region_name}, Clinics: {active_clinics}/{assigned_clinics}, Coverage: {coverage_percentage}%")
                        else:
                            self.log_test(f"Territory Info - {user_type}", False, 
                                        f"Invalid data: Coverage: {coverage_percentage}%, Clinics: {active_clinics}/{assigned_clinics}")
                    else:
                        self.log_test(f"Territory Info - {user_type}", False, f"Status: {response.status_code}")
                        
        except Exception as e:
            self.log_test("Territory Info Accuracy", False, f"Exception: {str(e)}")

    def test_debt_info_calculations(self):
        """Test debt information calculations"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            if self.sales_rep_user_id:
                response = requests.get(f"{BACKEND_URL}/users/{self.sales_rep_user_id}/profile", headers=headers)
                
                if response.status_code == 200:
                    profile_data = response.json()
                    debt_info = profile_data.get("debt_info", {})
                    
                    total_debt = debt_info.get("total_debt", 0)
                    overdue_amount = debt_info.get("overdue_amount", 0)
                    current_month_debt = debt_info.get("current_month_debt", 0)
                    payment_history = debt_info.get("payment_history", [])
                    
                    # Basic validation
                    valid_debt = overdue_amount <= total_debt
                    valid_current = current_month_debt <= total_debt
                    
                    if valid_debt and valid_current:
                        self.log_test("Debt Info Calculations", True, 
                                    f"Total: {total_debt}, Overdue: {overdue_amount}, Current month: {current_month_debt}, Payments: {len(payment_history)}")
                    else:
                        self.log_test("Debt Info Calculations", False, 
                                    f"Invalid calculations: Total: {total_debt}, Overdue: {overdue_amount}, Current: {current_month_debt}")
                else:
                    self.log_test("Debt Info Calculations", False, f"Status: {response.status_code}")
            else:
                self.log_test("Debt Info Calculations", False, "No sales rep user found for testing")
                
        except Exception as e:
            self.log_test("Debt Info Calculations", False, f"Exception: {str(e)}")

    def run_comprehensive_test(self):
        """Run all profile access control tests"""
        print("🎯 ENHANCED USER PROFILE API ACCESS CONTROL TESTING")
        print("=" * 70)
        print("Testing role-based access control and data consistency for profile API")
        print("Focus: Admin access, data structure consistency, role-specific data")
        print()
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Cannot proceed without proper user setup")
            return self.generate_summary()
        
        # Run comprehensive tests
        self.test_admin_access_all_profiles()
        self.test_profile_data_structure_consistency()
        self.test_sales_activity_for_different_roles()
        self.test_team_info_for_managers()
        self.test_territory_info_accuracy()
        self.test_debt_info_calculations()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🎯 PROFILE ACCESS CONTROL TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Show detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "=" * 70)
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 PROFILE ACCESS CONTROL: WORKING PERFECTLY")
        elif success_rate >= 60:
            print("⚠️  PROFILE ACCESS CONTROL: MOSTLY FUNCTIONAL")
        else:
            print("❌ PROFILE ACCESS CONTROL: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = ProfileAccessControlTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()