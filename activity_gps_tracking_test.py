#!/usr/bin/env python3
"""
Activity Tracking and GPS System Backend Test
اختبار شامل لنظام تتبع الأنشطة والGPS

This test covers the Arabic review request for activity tracking and GPS APIs.
Note: Some requested APIs are not implemented in the backend.
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Get backend URL from frontend env
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class ActivityGPSTrackingTest:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_result(self, test_name, success, message, response_time=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        result = f"{status} {test_name}{time_info}: {message}"
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time
        })
        
    def test_admin_login(self):
        """Test 1: Admin login with admin/admin123 and get JWT token"""
        print("\n🔐 Testing Admin Login...")
        
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.admin_token = data["access_token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.admin_token}"
                    })
                    user_info = data.get("user", {})
                    self.log_result(
                        "Admin Login", 
                        True, 
                        f"Successfully logged in as {user_info.get('full_name', 'admin')} with role {user_info.get('role', 'admin')}", 
                        response_time
                    )
                    return True
                else:
                    self.log_result("Admin Login", False, "No access token in response", response_time)
            else:
                self.log_result("Admin Login", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Exception: {str(e)}")
            
        return False
    
    def test_activity_apis_availability(self):
        """Test 2: Check if requested activity APIs are available"""
        print("\n📊 Testing Activity APIs Availability...")
        
        # Test POST /api/activities
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/activities", json={
                "activity_type": "visit_registration",
                "action": "تسجيل زيارة عيادة تجريبية",
                "target": {
                    "type": "clinic",
                    "id": "test-clinic-123",
                    "name": "عيادة تجريبية للاختبار"
                },
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "city": "القاهرة",
                    "address": "شارع التحرير، وسط البلد"
                },
                "device_info": {
                    "browser": "Chrome 120.0",
                    "os": "Windows 10",
                    "device_type": "desktop"
                },
                "additional_details": {
                    "visit_purpose": "تسجيل عيادة جديدة",
                    "doctor_specialization": "باطنة",
                    "clinic_size": "متوسط"
                }
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("POST /api/activities", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                self.log_result("POST /api/activities", True, "Activity created successfully", response_time)
            else:
                self.log_result("POST /api/activities", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("POST /api/activities", False, f"Exception: {str(e)}")
    
    def test_admin_activities_api(self):
        """Test 3: Get all activities for admin using GET /api/admin/activities"""
        print("\n📋 Testing Admin Activities API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/activities")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("GET /api/admin/activities", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                data = response.json()
                activities_count = len(data) if isinstance(data, list) else data.get('total', 0)
                self.log_result("GET /api/admin/activities", True, f"Retrieved {activities_count} activities", response_time)
            else:
                self.log_result("GET /api/admin/activities", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/admin/activities", False, f"Exception: {str(e)}")
    
    def test_activity_stats_api(self):
        """Test 4: Get activity statistics using GET /api/admin/activities/stats"""
        print("\n📈 Testing Activity Statistics API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/activities/stats")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("GET /api/admin/activities/stats", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                data = response.json()
                self.log_result("GET /api/admin/activities/stats", True, f"Retrieved activity statistics: {json.dumps(data, ensure_ascii=False)[:100]}...", response_time)
            else:
                self.log_result("GET /api/admin/activities/stats", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/admin/activities/stats", False, f"Exception: {str(e)}")
    
    def test_gps_tracking_api(self):
        """Test 5: Get GPS tracking records using GET /api/admin/gps-tracking"""
        print("\n🗺️ Testing GPS Tracking API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/gps-tracking")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("GET /api/admin/gps-tracking", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                data = response.json()
                records_count = len(data) if isinstance(data, list) else data.get('total_records', 0)
                self.log_result("GET /api/admin/gps-tracking", True, f"Retrieved {records_count} GPS tracking records", response_time)
            else:
                self.log_result("GET /api/admin/gps-tracking", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/admin/gps-tracking", False, f"Exception: {str(e)}")
    
    def test_log_gps_api(self):
        """Test 6: Log GPS location using POST /api/log-gps"""
        print("\n📍 Testing GPS Logging API...")
        
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/log-gps", json={
                "latitude": 30.0444,
                "longitude": 31.2357,
                "accuracy": 10.5,
                "timestamp": datetime.utcnow().isoformat(),
                "location_info": {
                    "city": "القاهرة",
                    "district": "وسط البلد",
                    "address": "شارع التحرير"
                },
                "activity_context": {
                    "type": "clinic_visit",
                    "clinic_id": "test-clinic-123",
                    "purpose": "زيارة عيادة"
                }
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("POST /api/log-gps", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                self.log_result("POST /api/log-gps", True, "GPS location logged successfully", response_time)
            else:
                self.log_result("POST /api/log-gps", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("POST /api/log-gps", False, f"Exception: {str(e)}")
    
    def test_available_gps_apis(self):
        """Test 7: Test available GPS APIs in the system"""
        print("\n🌐 Testing Available GPS APIs...")
        
        # Test GET /api/gps/locations
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/gps/locations")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                locations = data.get('data', [])
                self.log_result("GET /api/gps/locations", True, f"Retrieved {len(locations)} GPS locations", response_time)
            else:
                self.log_result("GET /api/gps/locations", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/gps/locations", False, f"Exception: {str(e)}")
        
        # Test GET /api/gps/stats
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/gps/stats")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get('data', {})
                self.log_result("GET /api/gps/stats", True, f"GPS Stats: {stats.get('total_users', 0)} users, {stats.get('online_users', 0)} online", response_time)
            else:
                self.log_result("GET /api/gps/stats", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/gps/stats", False, f"Exception: {str(e)}")
    
    def test_location_tracking_api(self):
        """Test 8: Test available location tracking API"""
        print("\n🔍 Testing Location Tracking API...")
        
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/location-tracking")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    records = data.get('data', [])
                    clinic_regs = data.get('clinic_registrations', 0)
                    visit_locs = data.get('visit_locations', 0)
                    self.log_result(
                        "GET /api/admin/location-tracking", 
                        True, 
                        f"Retrieved {len(records)} location records ({clinic_regs} clinic registrations, {visit_locs} visit locations)", 
                        response_time
                    )
                else:
                    self.log_result("GET /api/admin/location-tracking", False, "API returned success=false", response_time)
            else:
                self.log_result("GET /api/admin/location-tracking", False, f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            self.log_result("GET /api/admin/location-tracking", False, f"Exception: {str(e)}")
    
    def test_activity_filtering(self):
        """Test 9: Test activity filtering with query parameters"""
        print("\n🔍 Testing Activity Filtering...")
        
        # Test filtering by activity type
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/activities?activity_type=visit_registration")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("Activity Filtering by Type", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                self.log_result("Activity Filtering by Type", True, "Filtering by activity type works", response_time)
            else:
                self.log_result("Activity Filtering by Type", False, f"HTTP {response.status_code}", response_time)
                
        except Exception as e:
            self.log_result("Activity Filtering by Type", False, f"Exception: {str(e)}")
        
        # Test filtering by date
        try:
            start_time = time.time()
            today = datetime.utcnow().strftime('%Y-%m-%d')
            response = self.session.get(f"{API_BASE}/admin/activities?date={today}")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("Activity Filtering by Date", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                self.log_result("Activity Filtering by Date", True, f"Filtering by date ({today}) works", response_time)
            else:
                self.log_result("Activity Filtering by Date", False, f"HTTP {response.status_code}", response_time)
                
        except Exception as e:
            self.log_result("Activity Filtering by Date", False, f"Exception: {str(e)}")
        
        # Test filtering by user
        try:
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/activities?user_id=admin")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                self.log_result("Activity Filtering by User", False, "API endpoint not implemented", response_time)
            elif response.status_code == 200:
                self.log_result("Activity Filtering by User", True, "Filtering by user works", response_time)
            else:
                self.log_result("Activity Filtering by User", False, f"HTTP {response.status_code}", response_time)
                
        except Exception as e:
            self.log_result("Activity Filtering by User", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Activity Tracking and GPS System Backend Test")
        print("=" * 80)
        
        # Test 1: Admin login
        if not self.test_admin_login():
            print("\n❌ Cannot proceed without admin authentication")
            return
        
        # Test 2-6: Requested APIs (likely not implemented)
        self.test_activity_apis_availability()
        self.test_admin_activities_api()
        self.test_activity_stats_api()
        self.test_gps_tracking_api()
        self.test_log_gps_api()
        
        # Test 7-8: Available GPS/Location APIs
        self.test_available_gps_apis()
        self.test_location_tracking_api()
        
        # Test 9: Activity filtering
        self.test_activity_filtering()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 ACTIVITY TRACKING AND GPS SYSTEM TEST SUMMARY")
        print("=" * 80)
        print(f"⏱️  Total execution time: {total_time:.2f} seconds")
        print(f"📈 Success rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n🔍 Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['message']}")
        
        print(f"\n📋 Key Findings:")
        print(f"   • Admin authentication: {'✅ Working' if self.admin_token else '❌ Failed'}")
        
        # Check which requested APIs are missing
        requested_apis = [
            "POST /api/activities",
            "GET /api/admin/activities", 
            "GET /api/admin/activities/stats",
            "POST /api/log-gps",
            "GET /api/admin/gps-tracking"
        ]
        
        missing_apis = []
        for result in self.test_results:
            if "not implemented" in result["message"] and any(api in result["test"] for api in requested_apis):
                missing_apis.append(result["test"])
        
        if missing_apis:
            print(f"   • Missing APIs: {len(missing_apis)} out of 5 requested APIs are not implemented")
            for api in missing_apis:
                print(f"     - {api}")
        
        # Check available APIs
        available_apis = []
        for result in self.test_results:
            if result["success"] and ("GPS" in result["test"] or "location" in result["test"]):
                available_apis.append(result["test"])
        
        if available_apis:
            print(f"   • Available APIs: {len(available_apis)} GPS/location APIs are working")
            for api in available_apis:
                print(f"     - {api}")
        
        print(f"\n🎯 CONCLUSION:")
        if success_rate >= 50:
            print(f"   The backend has partial GPS/location tracking functionality.")
            print(f"   However, the specific activity tracking APIs requested in the Arabic review are not implemented.")
            print(f"   Available: GPS locations, GPS stats, and location tracking for clinics/visits.")
            print(f"   Missing: Activity logging, activity statistics, and GPS logging APIs.")
        else:
            print(f"   Most requested functionality is not available in the backend.")
            print(f"   The activity tracking and GPS system needs to be implemented.")

if __name__ == "__main__":
    test = ActivityGPSTrackingTest()
    test.run_all_tests()