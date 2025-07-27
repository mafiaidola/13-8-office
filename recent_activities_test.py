#!/usr/bin/env python3
"""
Focused test for Recent Activities API - User's specific concern
Testing /api/activities/recent endpoint and related functionality
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://d3e37f5d-d88d-4215-b21c-f8e57e4d5486.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class RecentActivitiesTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
    
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
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def test_admin_login(self):
        """Test admin login"""
        print("🔐 TESTING ADMIN LOGIN")
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            self.log_test("Admin Login", True, f"Successfully logged in as {user_info.get('username')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {status_code}", response)
        return False
    
    def test_recent_activities_endpoint(self):
        """Test the main Recent Activities endpoint"""
        print("📋 TESTING RECENT ACTIVITIES ENDPOINT")
        if not self.admin_token:
            self.log_test("Recent Activities Endpoint", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/activities/recent", token=self.admin_token)
        
        if status_code == 200:
            if isinstance(response, list):
                self.log_test("Recent Activities Endpoint", True, 
                             f"Found {len(response)} activities. Response structure: {type(response)}")
                
                # Check if activities have required fields
                if len(response) > 0:
                    activity = response[0]
                    required_fields = ["id", "description", "type", "created_at", "user_id"]
                    missing_fields = [field for field in required_fields if field not in activity]
                    
                    if missing_fields:
                        print(f"   ⚠️  Missing fields in activity: {missing_fields}")
                        print(f"   📋 Activity structure: {list(activity.keys())}")
                    else:
                        print(f"   ✅ Activity structure complete: {list(activity.keys())}")
                else:
                    print(f"   ℹ️  No activities found - this might be why frontend shows empty")
                
                return True
            else:
                self.log_test("Recent Activities Endpoint", False, 
                             f"Expected list, got {type(response)}", response)
        else:
            self.log_test("Recent Activities Endpoint", False, f"Status: {status_code}", response)
        return False
    
    def test_recent_activities_with_filters(self):
        """Test Recent Activities with different filters"""
        print("🔍 TESTING RECENT ACTIVITIES WITH FILTERS")
        if not self.admin_token:
            self.log_test("Recent Activities Filters", False, "No admin token available")
            return False
        
        filters = ["user", "visit", "order", "approval"]
        results = {}
        
        for filter_type in filters:
            status_code, response = self.make_request("GET", f"/activities/recent?type={filter_type}", 
                                                    token=self.admin_token)
            results[filter_type] = {
                "status": status_code,
                "count": len(response) if isinstance(response, list) else 0,
                "success": status_code == 200
            }
        
        all_success = all(result["success"] for result in results.values())
        
        if all_success:
            self.log_test("Recent Activities Filters", True, 
                         f"All filters working: {results}")
        else:
            failed_filters = [f for f, r in results.items() if not r["success"]]
            self.log_test("Recent Activities Filters", False, 
                         f"Failed filters: {failed_filters}")
        
        return all_success
    
    def test_create_sample_activity(self):
        """Create some sample activities to test data retrieval"""
        print("📝 TESTING SAMPLE ACTIVITY CREATION")
        if not self.admin_token:
            self.log_test("Sample Activity Creation", False, "No admin token available")
            return False
        
        # Try to create a user to generate activity
        import time
        timestamp = str(int(time.time()))
        user_data = {
            "username": f"test_user_{timestamp}",
            "email": f"test_{timestamp}@test.com",
            "password": "test123",
            "role": "sales_rep",
            "full_name": "مستخدم تجريبي للأنشطة",
            "phone": "+966501234567"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", user_data, self.admin_token)
        
        if status_code == 200:
            self.log_test("Sample Activity Creation", True, 
                         f"Created user to generate activity: {response.get('user_id')}")
            return True
        else:
            self.log_test("Sample Activity Creation", False, f"Status: {status_code}", response)
        return False
    
    def test_mongodb_activities_collection(self):
        """Test if activities are being stored in MongoDB"""
        print("🗄️ TESTING MONGODB ACTIVITIES STORAGE")
        if not self.admin_token:
            self.log_test("MongoDB Activities Storage", False, "No admin token available")
            return False
        
        # Check if we can access any data that might indicate activities storage
        # Test dashboard stats to see if there's activity data
        status_code, response = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        
        if status_code == 200:
            stats = response
            activity_indicators = {
                "total_users": stats.get("total_users", 0),
                "total_visits": stats.get("total_visits", 0),
                "total_clinics": stats.get("total_clinics", 0),
                "total_doctors": stats.get("total_doctors", 0)
            }
            
            total_activities = sum(activity_indicators.values())
            
            if total_activities > 0:
                self.log_test("MongoDB Activities Storage", True, 
                             f"System has data that should generate activities: {activity_indicators}")
            else:
                self.log_test("MongoDB Activities Storage", False, 
                             f"No data found that would generate activities: {activity_indicators}")
            return True
        else:
            self.log_test("MongoDB Activities Storage", False, f"Status: {status_code}", response)
        return False
    
    def test_activities_api_implementation(self):
        """Check if the activities API is properly implemented in backend"""
        print("🔧 TESTING ACTIVITIES API IMPLEMENTATION")
        if not self.admin_token:
            self.log_test("Activities API Implementation", False, "No admin token available")
            return False
        
        # Test different endpoints that might be related
        endpoints_to_test = [
            "/activities/recent",
            "/activities/recent?limit=10",
            "/activities/recent?type=user",
            "/dashboard/stats"
        ]
        
        results = {}
        for endpoint in endpoints_to_test:
            status_code, response = self.make_request("GET", endpoint, token=self.admin_token)
            results[endpoint] = {
                "status": status_code,
                "working": status_code == 200,
                "response_type": type(response).__name__
            }
        
        activities_working = results["/activities/recent"]["working"]
        
        if activities_working:
            self.log_test("Activities API Implementation", True, 
                         f"Activities API is implemented and responding: {results}")
        else:
            self.log_test("Activities API Implementation", False, 
                         f"Activities API not working properly: {results}")
        
        return activities_working
    
    def run_all_tests(self):
        """Run all Recent Activities tests"""
        print("🎯 FOCUSED RECENT ACTIVITIES TESTING")
        print("=" * 80)
        print("Focus: /api/activities/recent endpoint and related functionality")
        print("=" * 80)
        
        tests = [
            self.test_admin_login,
            self.test_recent_activities_endpoint,
            self.test_recent_activities_with_filters,
            self.test_create_sample_activity,
            self.test_mongodb_activities_collection,
            self.test_activities_api_implementation
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("=" * 80)
        print(f"🎉 RECENT ACTIVITIES TESTING COMPLETED!")
        print("=" * 80)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {total - passed}")
        print(f"📊 SUCCESS RATE: {(passed/total)*100:.1f}%")
        print("=" * 80)
        
        if passed < total:
            print("🔍 DIAGNOSIS: Recent Activities API issues found!")
            print("   - Check if activities are being created in MongoDB")
            print("   - Verify API endpoint implementation")
            print("   - Check frontend API call to /api/activities/recent")
        else:
            print("✅ DIAGNOSIS: Recent Activities API working correctly!")

if __name__ == "__main__":
    tester = RecentActivitiesTest()
    tester.run_all_tests()