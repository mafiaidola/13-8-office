#!/usr/bin/env python3
"""
GPS Tracking System Testing for Medical Sales Rep Visit Management System
Tests the existing GPS functionality and reports on Advanced GPS Tracking System APIs
"""

import requests
import json
import math
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://4869bf48-2036-4988-bb40-179ff075cfa7.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

# GPS test coordinates for testing geofencing
CLINIC_LOCATION = {"latitude": 24.7136, "longitude": 46.6753}
NEAR_CLINIC = {"latitude": 24.7137, "longitude": 46.6754}  # ~15m away
FAR_FROM_CLINIC = {"latitude": 24.7200, "longitude": 46.6800}  # ~700m away

class GPSTrackingTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.sales_rep_id = None
        self.test_clinic_id = None
        self.test_doctor_id = None
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
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in meters using Haversine formula"""
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def setup_test_data(self):
        """Setup test data for GPS testing"""
        print("🔧 SETTING UP TEST DATA FOR GPS TESTING")
        print("=" * 80)
        
        # Login as admin
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            print(f"✅ Admin login successful")
        else:
            print(f"❌ Admin login failed: {status_code}")
            return False
        
        # Create sales rep user
        import time
        timestamp = str(int(time.time()))
        sales_rep_data = {
            "username": f"gps_sales_rep_{timestamp}",
            "email": f"gpssalesrep_{timestamp}@test.com",
            "password": "gpsrep123",
            "role": "sales_rep",
            "full_name": "مندوب GPS للاختبار",
            "phone": "+966501111111"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        if status_code == 200:
            self.sales_rep_id = response.get('user_id')
            print(f"✅ Sales rep created: {self.sales_rep_id}")
            
            # Login as sales rep
            login_data = {"username": f"gps_sales_rep_{timestamp}", "password": "gpsrep123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.sales_rep_token = login_response["token"]
                print(f"✅ Sales rep login successful")
            else:
                print(f"❌ Sales rep login failed")
                return False
        else:
            print(f"❌ Sales rep creation failed: {status_code}")
            return False
        
        # Create test clinic with GPS coordinates
        clinic_data = {
            "name": "عيادة GPS للاختبار",
            "address": "شارع الملك فهد، الرياض",
            "latitude": CLINIC_LOCATION["latitude"],
            "longitude": CLINIC_LOCATION["longitude"],
            "phone": "+966501234567"
        }
        
        status_code, response = self.make_request("POST", "/clinics", clinic_data, self.sales_rep_token)
        if status_code == 200:
            self.test_clinic_id = response.get("clinic_id")
            print(f"✅ Test clinic created: {self.test_clinic_id}")
            
            # Approve clinic
            status_code, response = self.make_request("PATCH", f"/clinics/{self.test_clinic_id}/approve", token=self.admin_token)
            if status_code == 200:
                print(f"✅ Clinic approved")
            else:
                print(f"❌ Clinic approval failed: {status_code}")
        else:
            print(f"❌ Clinic creation failed: {status_code}")
            return False
        
        # Create test doctor
        doctor_data = {
            "name": "د. GPS للاختبار",
            "specialty": "طب الأطفال",
            "clinic_id": self.test_clinic_id,
            "phone": "+966509876543",
            "email": "dr.gps@clinic.com"
        }
        
        status_code, response = self.make_request("POST", "/doctors", doctor_data, self.sales_rep_token)
        if status_code == 200:
            self.test_doctor_id = response.get("doctor_id")
            print(f"✅ Test doctor created: {self.test_doctor_id}")
            
            # Approve doctor
            status_code, response = self.make_request("PATCH", f"/doctors/{self.test_doctor_id}/approve", token=self.admin_token)
            if status_code == 200:
                print(f"✅ Doctor approved")
            else:
                print(f"❌ Doctor approval failed: {status_code}")
        else:
            print(f"❌ Doctor creation failed: {status_code}")
            return False
        
        print("✅ Test data setup completed successfully")
        print()
        return True
    
    def test_haversine_distance_calculation(self):
        """Test 1: Verify Haversine formula accuracy for distance calculation"""
        print("🧮 TESTING HAVERSINE DISTANCE CALCULATION")
        
        # Test known distances
        test_cases = [
            # Same location (should be 0)
            (CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"], 
             CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"], 0, "Same location"),
            
            # Near clinic (~15m)
            (CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"],
             NEAR_CLINIC["latitude"], NEAR_CLINIC["longitude"], 15, "Near clinic"),
            
            # Far from clinic (~700m)
            (CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"],
             FAR_FROM_CLINIC["latitude"], FAR_FROM_CLINIC["longitude"], 700, "Far from clinic")
        ]
        
        all_passed = True
        for lat1, lon1, lat2, lon2, expected_distance, description in test_cases:
            calculated_distance = self.calculate_distance(lat1, lon1, lat2, lon2)
            
            # Allow 10% tolerance for GPS calculations
            tolerance = max(expected_distance * 0.1, 5)  # At least 5m tolerance
            
            if abs(calculated_distance - expected_distance) <= tolerance:
                print(f"   ✅ {description}: {calculated_distance:.1f}m (expected ~{expected_distance}m)")
            else:
                print(f"   ❌ {description}: {calculated_distance:.1f}m (expected ~{expected_distance}m)")
                all_passed = False
        
        self.log_test("Haversine Distance Calculation", all_passed, 
                     "Distance calculation accuracy verified" if all_passed else "Distance calculation inaccurate")
        return all_passed
    
    def test_visit_within_geofence(self):
        """Test 2: Create visit within 20m geofence (should succeed)"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Visit Within Geofence", False, "Missing required tokens or IDs")
            return False
        
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": NEAR_CLINIC["latitude"],
            "longitude": NEAR_CLINIC["longitude"],
            "notes": "زيارة تجريبية ضمن النطاق المسموح - اختبار GPS"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 200:
            distance = self.calculate_distance(
                CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"],
                NEAR_CLINIC["latitude"], NEAR_CLINIC["longitude"]
            )
            self.log_test("Visit Within Geofence", True, 
                         f"Visit created successfully at {distance:.1f}m from clinic (within 20m limit)")
            return True
        else:
            self.log_test("Visit Within Geofence", False, f"Status: {status_code}", response)
        return False
    
    def test_visit_outside_geofence(self):
        """Test 3: Create visit outside 20m geofence (should fail)"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Visit Outside Geofence", False, "Missing required tokens or IDs")
            return False
        
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": FAR_FROM_CLINIC["latitude"],
            "longitude": FAR_FROM_CLINIC["longitude"],
            "notes": "زيارة تجريبية خارج النطاق المسموح - اختبار GPS"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 400 and "20 meters" in response.get("detail", ""):
            distance = self.calculate_distance(
                CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"],
                FAR_FROM_CLINIC["latitude"], FAR_FROM_CLINIC["longitude"]
            )
            self.log_test("Visit Outside Geofence", True, 
                         f"Visit correctly rejected at {distance:.1f}m from clinic: {response.get('detail')}")
            return True
        else:
            self.log_test("Visit Outside Geofence", False, 
                         f"Expected 400 with distance error, got {status_code}", response)
        return False
    
    def test_gps_coordinates_storage(self):
        """Test 4: Verify GPS coordinates are properly stored and retrieved"""
        if not self.sales_rep_token:
            self.log_test("GPS Coordinates Storage", False, "No sales rep token available")
            return False
        
        # Get clinics and verify GPS coordinates
        status_code, clinics = self.make_request("GET", "/clinics", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(clinics, list):
            test_clinic = next((c for c in clinics if c.get("id") == self.test_clinic_id), None)
            if test_clinic:
                stored_lat = test_clinic.get("latitude")
                stored_lon = test_clinic.get("longitude")
                
                if (stored_lat == CLINIC_LOCATION["latitude"] and 
                    stored_lon == CLINIC_LOCATION["longitude"]):
                    self.log_test("GPS Coordinates Storage", True, 
                                 f"GPS coordinates properly stored: {stored_lat}, {stored_lon}")
                    return True
                else:
                    self.log_test("GPS Coordinates Storage", False, 
                                 f"GPS coordinates mismatch: stored {stored_lat}, {stored_lon} vs expected {CLINIC_LOCATION}")
            else:
                self.log_test("GPS Coordinates Storage", False, "Test clinic not found")
        else:
            self.log_test("GPS Coordinates Storage", False, f"Status: {status_code}", clinics)
        return False
    
    def test_visit_gps_data_retrieval(self):
        """Test 5: Verify visit GPS data is properly stored and retrieved"""
        if not self.sales_rep_token:
            self.log_test("Visit GPS Data Retrieval", False, "No sales rep token available")
            return False
        
        # Get visits and verify GPS data
        status_code, visits = self.make_request("GET", "/visits", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(visits, list):
            if len(visits) > 0:
                visit = visits[0]  # Get the first visit (should be our test visit)
                
                visit_lat = visit.get("latitude")
                visit_lon = visit.get("longitude")
                
                if visit_lat is not None and visit_lon is not None:
                    # Calculate distance from clinic
                    distance = self.calculate_distance(
                        CLINIC_LOCATION["latitude"], CLINIC_LOCATION["longitude"],
                        visit_lat, visit_lon
                    )
                    
                    self.log_test("Visit GPS Data Retrieval", True, 
                                 f"Visit GPS data retrieved: {visit_lat}, {visit_lon} (distance: {distance:.1f}m)")
                    return True
                else:
                    self.log_test("Visit GPS Data Retrieval", False, "Missing GPS coordinates in visit data")
            else:
                self.log_test("Visit GPS Data Retrieval", False, "No visits found")
        else:
            self.log_test("Visit GPS Data Retrieval", False, f"Status: {status_code}", visits)
        return False
    
    def test_advanced_gps_apis_availability(self):
        """Test 6: Check availability of Advanced GPS Tracking System APIs"""
        print("🔍 TESTING ADVANCED GPS TRACKING SYSTEM APIs AVAILABILITY")
        
        advanced_gps_endpoints = [
            "/gps/track-location",
            "/gps/location-history/test-user",
            "/gps/team-locations", 
            "/gps/create-geofence",
            "/gps/route-optimization"
        ]
        
        missing_endpoints = []
        
        for endpoint in advanced_gps_endpoints:
            status_code, response = self.make_request("GET", endpoint, token=self.admin_token)
            if status_code == 404:
                missing_endpoints.append(endpoint)
                print(f"   ❌ {endpoint}: Not implemented (404)")
            else:
                print(f"   ✅ {endpoint}: Available (status: {status_code})")
        
        if missing_endpoints:
            self.log_test("Advanced GPS APIs Availability", False, 
                         f"Missing endpoints: {', '.join(missing_endpoints)}")
            return False
        else:
            self.log_test("Advanced GPS APIs Availability", True, 
                         "All Advanced GPS Tracking System APIs are available")
            return True
    
    def test_current_location_update(self):
        """Test 7: Check if user current_location is updated (if implemented)"""
        if not self.sales_rep_token or not self.sales_rep_id:
            self.log_test("Current Location Update", False, "Missing required tokens or IDs")
            return False
        
        # Check if user has current_location field updated
        status_code, response = self.make_request("GET", "/auth/me", token=self.sales_rep_token)
        
        if status_code == 200:
            current_location = response.get("current_location")
            last_location_update = response.get("last_location_update")
            
            if current_location or last_location_update:
                self.log_test("Current Location Update", True, 
                             f"User location tracking implemented: {current_location}")
                return True
            else:
                self.log_test("Current Location Update", False, 
                             "User current_location field not implemented")
                return False
        else:
            self.log_test("Current Location Update", False, f"Status: {status_code}", response)
        return False
    
    def run_all_tests(self):
        """Run all GPS tracking tests"""
        print("🎯 STARTING GPS TRACKING SYSTEM TESTING")
        print("=" * 80)
        print("Focus: GPS Geofencing, Distance Calculation, Location Storage, Advanced APIs")
        print("=" * 80)
        print()
        
        # Setup test data
        if not self.setup_test_data():
            print("❌ Test data setup failed. Cannot proceed with GPS tests.")
            return
        
        # Run GPS tests
        print("🧮 TESTING GPS DISTANCE CALCULATION AND GEOFENCING")
        print("-" * 60)
        self.test_haversine_distance_calculation()
        self.test_visit_within_geofence()
        self.test_visit_outside_geofence()
        print()
        
        print("💾 TESTING GPS DATA STORAGE AND RETRIEVAL")
        print("-" * 60)
        self.test_gps_coordinates_storage()
        self.test_visit_gps_data_retrieval()
        print()
        
        print("🚀 TESTING ADVANCED GPS TRACKING SYSTEM APIs")
        print("-" * 60)
        self.test_advanced_gps_apis_availability()
        self.test_current_location_update()
        print()
        
        # Summary
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print("=" * 80)
        print("🎉 GPS TRACKING SYSTEM TESTING COMPLETED!")
        print("=" * 80)
        print(f"✅ PASSED: {passed_tests}")
        print(f"❌ FAILED: {total_tests - passed_tests}")
        print(f"📊 SUCCESS RATE: {success_rate:.1f}%")
        print("=" * 80)
        
        return self.test_results

if __name__ == "__main__":
    tester = GPSTrackingTester()
    results = tester.run_all_tests()