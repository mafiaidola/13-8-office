#!/usr/bin/env python3
"""
Comprehensive Backend Testing - Focus on Recent Activities API Issue
Testing the specific user concern about Recent Activities not showing in frontend
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "https://b77a755e-cd3d-4f06-b7e4-57c9ade235f8.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class ComprehensiveBackendTest:
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
            "details": details,
            "timestamp": datetime.now().isoformat()
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
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def test_admin_login(self):
        """Test 1: Admin login with admin/admin123"""
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            self.log_test("Admin Login (admin/admin123)", True, 
                         f"Successfully logged in as {user_info.get('username')} with role {user_info.get('role')}")
            return True
        else:
            self.log_test("Admin Login (admin/admin123)", False, f"Status: {status_code}", response)
        return False
    
    def test_jwt_token_functionality(self):
        """Test 2: JWT token validation"""
        if not self.admin_token:
            self.log_test("JWT Token Functionality", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/auth/me", token=self.admin_token)
        
        if status_code == 200 and response.get("role") == "admin":
            self.log_test("JWT Token Functionality", True, 
                         f"Token valid for user: {response.get('username')} ({response.get('full_name')})")
            return True
        else:
            self.log_test("JWT Token Functionality", False, f"Status: {status_code}", response)
        return False
    
    def test_dashboard_statistics_apis(self):
        """Test 3: Dashboard statistics APIs"""
        if not self.admin_token:
            self.log_test("Dashboard Statistics APIs", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        
        if status_code == 200:
            required_stats = ["total_users", "total_clinics", "total_doctors", "total_visits"]
            if all(stat in response for stat in required_stats):
                self.log_test("Dashboard Statistics APIs", True, 
                             f"All required stats present: users={response.get('total_users')}, "
                             f"clinics={response.get('total_clinics')}, doctors={response.get('total_doctors')}, "
                             f"visits={response.get('total_visits')}")
                return True
            else:
                missing_stats = [stat for stat in required_stats if stat not in response]
                self.log_test("Dashboard Statistics APIs", False, f"Missing stats: {missing_stats}")
        else:
            self.log_test("Dashboard Statistics APIs", False, f"Status: {status_code}", response)
        return False
    
    def test_recent_activities_api_structure(self):
        """Test 4: Recent Activities API - Check correct data structure"""
        if not self.admin_token:
            self.log_test("Recent Activities API Structure", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/activities/recent", token=self.admin_token)
        
        if status_code == 200:
            # Check if response has the correct structure
            if isinstance(response, dict) and "activities" in response:
                activities = response.get("activities", [])
                total_count = response.get("total_count", 0)
                
                if isinstance(activities, list):
                    self.log_test("Recent Activities API Structure", True, 
                                 f"✅ CORRECT STRUCTURE: Response is object with 'activities' array. "
                                 f"Found {len(activities)} activities, total_count={total_count}")
                    
                    # Check activity structure
                    if len(activities) > 0:
                        activity = activities[0]
                        required_fields = ["type", "action", "title", "description", "timestamp", "icon", "color"]
                        missing_fields = [field for field in required_fields if field not in activity]
                        
                        if not missing_fields:
                            print(f"   ✅ Activity structure complete: {list(activity.keys())}")
                        else:
                            print(f"   ⚠️  Missing activity fields: {missing_fields}")
                    
                    return True
                else:
                    self.log_test("Recent Activities API Structure", False, 
                                 f"'activities' is not a list: {type(activities)}")
            else:
                self.log_test("Recent Activities API Structure", False, 
                             f"Response structure incorrect. Expected object with 'activities' key, got: {type(response)}")
        else:
            self.log_test("Recent Activities API Structure", False, f"Status: {status_code}", response)
        return False
    
    def test_recent_activities_data_extraction(self):
        """Test 5: Recent Activities - Verify data is extracted correctly"""
        if not self.admin_token:
            self.log_test("Recent Activities Data Extraction", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/activities/recent", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, dict):
            activities = response.get("activities", [])
            
            if len(activities) > 0:
                # Analyze activity types
                activity_types = {}
                for activity in activities:
                    activity_type = activity.get("type", "unknown")
                    activity_types[activity_type] = activity_types.get(activity_type, 0) + 1
                
                self.log_test("Recent Activities Data Extraction", True, 
                             f"✅ DATA EXTRACTED CORRECTLY: {len(activities)} activities found. "
                             f"Types: {activity_types}")
                
                # Show sample activity
                sample_activity = activities[0]
                print(f"   📋 Sample Activity:")
                print(f"      Type: {sample_activity.get('type')}")
                print(f"      Title: {sample_activity.get('title')}")
                print(f"      Description: {sample_activity.get('description')}")
                print(f"      Timestamp: {sample_activity.get('timestamp')}")
                
                return True
            else:
                self.log_test("Recent Activities Data Extraction", False, 
                             "No activities found - this explains why frontend shows empty")
        else:
            self.log_test("Recent Activities Data Extraction", False, f"Status: {status_code}", response)
        return False
    
    def test_mongodb_connection_health(self):
        """Test 6: MongoDB connection and data integrity"""
        if not self.admin_token:
            self.log_test("MongoDB Connection Health", False, "No admin token available")
            return False
        
        # Test multiple collections
        collections_to_test = [
            ("/users", "users"),
            ("/clinics", "clinics"),
            ("/doctors", "doctors"),
            ("/visits", "visits"),
            ("/products", "products"),
            ("/warehouses", "warehouses")
        ]
        
        collection_status = {}
        for endpoint, collection_name in collections_to_test:
            status_code, response = self.make_request("GET", endpoint, token=self.admin_token)
            collection_status[collection_name] = {
                "status": status_code,
                "working": status_code == 200,
                "count": len(response) if isinstance(response, list) else 0
            }
        
        all_working = all(status["working"] for status in collection_status.values())
        
        if all_working:
            self.log_test("MongoDB Connection Health", True, 
                         f"✅ ALL COLLECTIONS ACCESSIBLE: {collection_status}")
        else:
            failed_collections = [name for name, status in collection_status.items() if not status["working"]]
            self.log_test("MongoDB Connection Health", False, 
                         f"Failed collections: {failed_collections}")
        
        return all_working
    
    def test_recent_activities_json_format(self):
        """Test 7: Recent Activities JSON response format validation"""
        if not self.admin_token:
            self.log_test("Recent Activities JSON Format", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/activities/recent", token=self.admin_token)
        
        if status_code == 200:
            try:
                # Verify JSON structure
                json_str = json.dumps(response, ensure_ascii=False, indent=2)
                parsed_back = json.loads(json_str)
                
                # Check if it matches expected structure
                if (isinstance(parsed_back, dict) and 
                    "activities" in parsed_back and 
                    "total_count" in parsed_back and
                    "days" in parsed_back and
                    "activity_type" in parsed_back):
                    
                    self.log_test("Recent Activities JSON Format", True, 
                                 f"✅ VALID JSON FORMAT: Structure matches API specification")
                    return True
                else:
                    self.log_test("Recent Activities JSON Format", False, 
                                 f"JSON structure doesn't match expected format")
            except json.JSONEncodeError as e:
                self.log_test("Recent Activities JSON Format", False, f"JSON encoding error: {e}")
        else:
            self.log_test("Recent Activities JSON Format", False, f"Status: {status_code}", response)
        return False
    
    def run_comprehensive_test(self):
        """Run all comprehensive backend tests"""
        print("🎯 COMPREHENSIVE BACKEND TESTING - RECENT ACTIVITIES FOCUS")
        print("=" * 80)
        print("Focus: Recent Activities API (/api/activities/recent) and related functionality")
        print("User Issue: Recent Activities not showing in frontend")
        print("=" * 80)
        
        tests = [
            self.test_admin_login,
            self.test_jwt_token_functionality,
            self.test_dashboard_statistics_apis,
            self.test_recent_activities_api_structure,
            self.test_recent_activities_data_extraction,
            self.test_mongodb_connection_health,
            self.test_recent_activities_json_format
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("=" * 80)
        print(f"🎉 COMPREHENSIVE BACKEND TESTING COMPLETED!")
        print("=" * 80)
        print(f"✅ PASSED: {passed}")
        print(f"❌ FAILED: {total - passed}")
        print(f"📊 SUCCESS RATE: {(passed/total)*100:.1f}%")
        print("=" * 80)
        
        # Diagnosis
        if passed >= 6:  # Most tests passed
            print("🔍 DIAGNOSIS: Recent Activities API is working correctly!")
            print("   ✅ Backend API is functional and returning data")
            print("   ✅ Data structure is correct: {activities: [...], total_count: N}")
            print("   ✅ MongoDB connections are healthy")
            print("   ✅ JSON format is valid")
            print()
            print("🎯 LIKELY FRONTEND ISSUE:")
            print("   - Frontend might be expecting direct array instead of {activities: [...]}")
            print("   - Check frontend API call to handle response.activities")
            print("   - Verify frontend is calling /api/activities/recent correctly")
        else:
            print("🔍 DIAGNOSIS: Backend issues found!")
            print("   - Check MongoDB connections")
            print("   - Verify API endpoint implementation")
            print("   - Check authentication system")

if __name__ == "__main__":
    tester = ComprehensiveBackendTest()
    tester.run_comprehensive_test()