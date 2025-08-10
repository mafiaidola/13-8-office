#!/usr/bin/env python3
"""
Test script for the specific APIs mentioned in the review request
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class ReviewRequestTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data=None):
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
            "details": details
        })
    
    def make_request(self, method: str, endpoint: str, data=None, token: str = None):
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
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def test_admin_login(self):
        """Test admin login"""
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            if user_info.get("role") == "admin":
                self.log_test("Admin Login", True, f"Successfully logged in as {user_info.get('username')}")
                return True
            else:
                self.log_test("Admin Login", False, f"Wrong role: {user_info.get('role')}")
        else:
            self.log_test("Admin Login", False, f"Status: {status_code}", response)
        return False
    
    def test_enhanced_search_api(self):
        """Test Enhanced Search API: /api/search/comprehensive"""
        if not self.admin_token:
            self.log_test("Enhanced Search API", False, "No admin token available")
            return False
        
        # Test comprehensive search
        status_code, response = self.make_request("GET", "/search/comprehensive?q=test", token=self.admin_token)
        
        if status_code == 200:
            expected_sections = ["representatives", "doctors", "clinics", "invoices", "products"]
            if all(section in response for section in expected_sections):
                self.log_test("Enhanced Search API", True, f"Comprehensive search working with sections: {list(response.keys())}")
                return True
            else:
                self.log_test("Enhanced Search API", False, f"Missing sections in response: {response}")
        else:
            self.log_test("Enhanced Search API", False, f"Status: {status_code}", response)
        return False
    
    def test_filtered_statistics_api(self):
        """Test Filtered Statistics API: /api/dashboard/statistics/filtered"""
        if not self.admin_token:
            self.log_test("Filtered Statistics API", False, "No admin token available")
            return False
        
        # Test with different time periods
        periods = ["today", "week", "month", "quarter"]
        
        for period in periods:
            status_code, response = self.make_request("GET", f"/dashboard/statistics/filtered?period={period}", token=self.admin_token)
            
            if status_code != 200:
                self.log_test("Filtered Statistics API", False, f"Period '{period}' failed with status {status_code}")
                return False
            
            # Check for required fields
            required_fields = ["visits", "orders", "revenue", "representatives"]
            if not all(field in response for field in required_fields):
                self.log_test("Filtered Statistics API", False, f"Missing fields for period '{period}': {response}")
                return False
        
        self.log_test("Filtered Statistics API", True, f"All time periods working: {periods}")
        return True
    
    def test_performance_charts_api(self):
        """Test Performance Charts API: /api/charts/performance"""
        if not self.admin_token:
            self.log_test("Performance Charts API", False, "No admin token available")
            return False
        
        # Test with different chart types
        chart_types = ["visits", "orders", "revenue", "representatives"]
        
        for chart_type in chart_types:
            status_code, response = self.make_request("GET", f"/charts/performance?type={chart_type}", token=self.admin_token)
            
            if status_code != 200:
                self.log_test("Performance Charts API", False, f"Chart type '{chart_type}' failed with status {status_code}")
                return False
            
            # Check for chart structure
            required_fields = ["chart_type", "data", "labels"]
            if not all(field in response for field in required_fields):
                self.log_test("Performance Charts API", False, f"Missing chart fields for type '{chart_type}': {response}")
                return False
        
        self.log_test("Performance Charts API", True, f"All chart types working: {chart_types}")
        return True
    
    def test_recent_activities_api(self):
        """Test Recent Activities API: /api/activities/recent"""
        if not self.admin_token:
            self.log_test("Recent Activities API", False, "No admin token available")
            return False
        
        # Test recent activities
        status_code, response = self.make_request("GET", "/activities/recent", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            self.log_test("Recent Activities API", True, f"Retrieved {len(response)} recent activities")
            return True
        else:
            self.log_test("Recent Activities API", False, f"Status: {status_code}", response)
        return False
    
    def test_secret_reports_api(self):
        """Test Secret Reports API with password protection"""
        if not self.admin_token:
            self.log_test("Secret Reports API", False, "No admin token available")
            return False
        
        # Test with correct password (666888)
        secret_data = {
            "password": "666888",
            "report_type": "comprehensive"
        }
        
        status_code, response = self.make_request("POST", "/reports/secret", secret_data, self.admin_token)
        
        if status_code == 200:
            # Check for comprehensive report structure
            required_sections = ["users", "visits", "orders", "revenue", "performance"]
            if all(section in response for section in required_sections):
                self.log_test("Secret Reports API", True, f"Secret reports working with password protection")
                return True
            else:
                self.log_test("Secret Reports API", False, f"Missing report sections: {response}")
        else:
            self.log_test("Secret Reports API", False, f"Status: {status_code}", response)
        return False
    
    def test_daily_selfie_api(self):
        """Test Daily Selfie API"""
        if not self.admin_token:
            self.log_test("Daily Selfie API", False, "No admin token available")
            return False
        
        # Test selfie upload
        selfie_data = {
            "selfie": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==",
            "location": {
                "latitude": 24.7136,
                "longitude": 46.6753,
                "address": "الرياض، المملكة العربية السعودية"
            }
        }
        
        status_code, response = self.make_request("POST", "/users/selfie", selfie_data, self.admin_token)
        
        if status_code == 200:
            self.log_test("Daily Selfie API", True, "Daily selfie upload working")
            return True
        else:
            self.log_test("Daily Selfie API", False, f"Status: {status_code}", response)
        return False
    
    def test_user_statistics_api(self):
        """Test Enhanced User Management - User Statistics"""
        if not self.admin_token:
            self.log_test("User Statistics API", False, "No admin token available")
            return False
        
        # Get users first
        status_code, users = self.make_request("GET", "/users", token=self.admin_token)
        if status_code != 200 or len(users) == 0:
            self.log_test("User Statistics API", False, "No users available")
            return False
        
        user_id = users[0]["id"]
        
        # Test user statistics
        status_code, response = self.make_request("GET", f"/users/{user_id}/statistics", token=self.admin_token)
        
        if status_code == 200:
            required_stats = ["visits", "orders", "performance", "achievements"]
            if all(stat in response for stat in required_stats):
                self.log_test("User Statistics API", True, f"User statistics working: {list(response.keys())}")
                return True
            else:
                self.log_test("User Statistics API", False, f"Missing statistics: {response}")
        else:
            self.log_test("User Statistics API", False, f"Status: {status_code}", response)
        return False
    
    def test_daily_plans_api(self):
        """Test Daily Plans API"""
        if not self.admin_token:
            self.log_test("Daily Plans API", False, "No admin token available")
            return False
        
        # Get users first
        status_code, users = self.make_request("GET", "/users", token=self.admin_token)
        if status_code != 200 or len(users) == 0:
            self.log_test("Daily Plans API", False, "No users available")
            return False
        
        user_id = users[0]["id"]
        
        # Test retrieving daily plan
        status_code, response = self.make_request("GET", f"/users/{user_id}/daily-plan", token=self.admin_token)
        
        if status_code == 200:
            required_fields = ["visits", "orders", "targets", "notes", "status"]
            if all(field in response for field in required_fields):
                self.log_test("Daily Plans API", True, f"Daily plans working: {list(response.keys())}")
                return True
            else:
                self.log_test("Daily Plans API", False, f"Missing plan fields: {response}")
        else:
            self.log_test("Daily Plans API", False, f"Status: {status_code}", response)
        return False
    
    def run_review_tests(self):
        """Run all review request tests"""
        print("🚀 Testing New Backend APIs from Review Request")
        print("=" * 60)
        
        # Login first
        if not self.test_admin_login():
            print("❌ Critical: Admin login failed. Cannot continue testing.")
            return
        
        print("\n🔍 Testing Review Request APIs...")
        print("-" * 40)
        
        # Test all the APIs mentioned in the review request
        self.test_enhanced_search_api()
        self.test_filtered_statistics_api()
        self.test_performance_charts_api()
        self.test_recent_activities_api()
        self.test_secret_reports_api()
        self.test_daily_selfie_api()
        self.test_user_statistics_api()
        self.test_daily_plans_api()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 REVIEW REQUEST TEST SUMMARY")
        print("=" * 60)
        
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
        
        print("\n🎉 Review request testing completed!")
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = ReviewRequestTester()
    tester.run_review_tests()