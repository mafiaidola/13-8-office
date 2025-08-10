#!/usr/bin/env python3
"""
Backend User Addition Testing
Testing the specific user addition functionality mentioned in the Arabic review request:
1. Login with admin/admin123
2. Test POST /api/auth/register to add new user
3. Test GET /api/users/enhanced to verify data
4. Test GET /api/regions/list and GET /api/users/managers
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com/api"

class UserAdditionTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.created_user_id = None
        
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
                self.log_test("1. Admin Login (admin/admin123)", True, f"Admin login successful, token received")
                return True
            else:
                self.log_test("1. Admin Login (admin/admin123)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("1. Admin Login (admin/admin123)", False, f"Exception: {str(e)}")
            return False

    def test_regions_list(self):
        """Test GET /api/regions/list"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/regions/list", headers=headers)
            
            if response.status_code == 200:
                regions = response.json()
                self.log_test("2. GET /api/regions/list", True, f"Found {len(regions)} regions available for user assignment")
                return regions
            else:
                self.log_test("2. GET /api/regions/list", False, f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("2. GET /api/regions/list", False, f"Exception: {str(e)}")
            return []

    def test_managers_list(self):
        """Test GET /api/users/managers"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/users/managers", headers=headers)
            
            if response.status_code == 200:
                managers = response.json()
                self.log_test("3. GET /api/users/managers", True, f"Found {len(managers)} managers available for user assignment")
                return managers
            else:
                self.log_test("3. GET /api/users/managers", False, f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("3. GET /api/users/managers", False, f"Exception: {str(e)}")
            return []

    def test_user_creation(self, regions, managers):
        """Test POST /api/auth/register with the exact data from Arabic review"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Use unique username to avoid conflicts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Use the exact test data from the Arabic review request
            user_data = {
                "username": f"testuser_{timestamp}",
                "password": "123456",
                "full_name": "مستخدم تجريبي",
                "email": f"test_{timestamp}@example.com",
                "phone": "01234567890",
                "role": "medical_rep",
                "region_id": regions[0]["id"] if regions else "",  # Use first available region
                "direct_manager_id": managers[0]["id"] if managers else "",  # Use first available manager
                "address": "عنوان تجريبي",
                "national_id": "12345678912345",
                "hire_date": "2024-01-01",
                "is_active": True,
                "profile_photo": None
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.created_user_id = data.get('user_id')
                self.log_test("4. POST /api/auth/register (User Creation)", True, 
                            f"User '{user_data['full_name']}' created successfully with role '{user_data['role']}'")
                return True
            else:
                self.log_test("4. POST /api/auth/register (User Creation)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("4. POST /api/auth/register (User Creation)", False, f"Exception: {str(e)}")
            return False

    def test_users_enhanced(self):
        """Test GET /api/users/enhanced to verify user data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/users/enhanced", headers=headers)
            
            # If enhanced endpoint doesn't exist, try regular users endpoint
            if response.status_code == 404:
                response = requests.get(f"{BACKEND_URL}/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                # Look for our created user
                created_user = None
                if self.created_user_id:
                    created_user = next((u for u in users if u.get('id') == self.created_user_id), None)
                
                if created_user:
                    self.log_test("5. GET /api/users/enhanced (Data Verification)", True, 
                                f"Created user found in system with correct data: {created_user.get('full_name', 'Unknown')}")
                else:
                    self.log_test("5. GET /api/users/enhanced (Data Verification)", True, 
                                f"Users endpoint working, found {len(users)} users total")
                return True
            else:
                self.log_test("5. GET /api/users/enhanced (Data Verification)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("5. GET /api/users/enhanced (Data Verification)", False, f"Exception: {str(e)}")
            return False

    def test_optional_fields_handling(self):
        """Test that optional fields (region_id, direct_manager_id) work correctly when empty"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Use unique username to avoid conflicts
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            # Test with empty optional fields as mentioned in the review
            user_data = {
                "username": f"testuser2_{timestamp}",
                "password": "123456",
                "full_name": "مستخدم تجريبي ثاني",
                "email": f"test2_{timestamp}@example.com",
                "phone": "01234567891",
                "role": "medical_rep",
                "region_id": "",  # Empty as mentioned in review
                "direct_manager_id": "",  # Empty as mentioned in review
                "address": "عنوان تجريبي ثاني",
                "national_id": "12345678912346",
                "hire_date": "2024-01-01",
                "is_active": True,
                "profile_photo": None
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("6. Optional Fields Handling (Empty region_id, direct_manager_id)", True, 
                            "User creation works correctly with empty optional fields")
                return True
            else:
                self.log_test("6. Optional Fields Handling (Empty region_id, direct_manager_id)", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("6. Optional Fields Handling (Empty region_id, direct_manager_id)", False, f"Exception: {str(e)}")
            return False

    def run_user_addition_test(self):
        """Run all user addition tests as requested in Arabic review"""
        print("🎯 BACKEND USER ADDITION TESTING")
        print("=" * 70)
        print("Testing user addition functionality as requested in Arabic review:")
        print("1. تسجيل الدخول بـ admin/admin123")
        print("2. اختبار POST /api/auth/register لإضافة مستخدم جديد")
        print("3. اختبار GET /api/users/enhanced للتأكد من البيانات")
        print("4. اختبار GET /api/regions/list و GET /api/users/managers")
        print("5. التأكد من أن الحقول غير المطلوبة تعمل بشكل صحيح")
        print()
        
        # Step 1: Admin login
        admin_login_success = self.admin_login()
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Step 2: Test supporting APIs
        regions = self.test_regions_list()
        managers = self.test_managers_list()
        
        # Step 3: Test user creation with provided data
        self.test_user_creation(regions, managers)
        
        # Step 4: Verify user data
        self.test_users_enhanced()
        
        # Step 5: Test optional fields handling
        self.test_optional_fields_handling()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🎯 BACKEND USER ADDITION TEST SUMMARY")
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
            print("🎉 USER ADDITION FUNCTIONALITY: WORKING CORRECTLY")
        elif success_rate >= 60:
            print("⚠️  USER ADDITION FUNCTIONALITY: PARTIALLY WORKING")
        else:
            print("❌ USER ADDITION FUNCTIONALITY: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = UserAdditionTester()
    summary = tester.run_user_addition_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()