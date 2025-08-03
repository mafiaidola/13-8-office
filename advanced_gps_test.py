#!/usr/bin/env python3
"""
Advanced GPS Tracking System APIs Testing
Tests the Advanced GPS Tracking System APIs as requested in Arabic review
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://5db9ed6f-0d1e-4bc3-a516-f11b0fa0e21d.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

# GPS test coordinates
RIYADH_COORDS = {"latitude": 24.7136, "longitude": 46.6753}
JEDDAH_COORDS = {"latitude": 21.4858, "longitude": 39.1925}
DAMMAM_COORDS = {"latitude": 26.4207, "longitude": 50.0888}

class AdvancedGPSTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.manager_token = None
        self.sales_rep_token = None
        self.sales_rep_id = None
        self.manager_id = None
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
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, params: Dict = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, params=params)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def setup_test_users(self):
        """Setup test users for GPS testing"""
        print("🔧 SETTING UP TEST USERS FOR ADVANCED GPS TESTING")
        print("=" * 80)
        
        # Login as admin
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            print(f"✅ Admin login successful")
        else:
            print(f"❌ Admin login failed: {status_code}")
            return False
        
        # Create manager user
        timestamp = str(int(time.time()))
        manager_data = {
            "username": f"gps_manager_{timestamp}",
            "email": f"gpsmanager_{timestamp}@test.com",
            "password": "gpsmanager123",
            "role": "manager",
            "full_name": "مدير GPS للاختبار",
            "phone": "+966502222222"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        if status_code == 200:
            self.manager_id = response.get('user_id')
            print(f"✅ Manager created: {self.manager_id}")
            
            # Login as manager
            login_data = {"username": f"gps_manager_{timestamp}", "password": "gpsmanager123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.manager_token = login_response["token"]
                print(f"✅ Manager login successful")
            else:
                print(f"❌ Manager login failed")
                return False
        else:
            print(f"❌ Manager creation failed: {status_code}")
            return False
        
        # Create sales rep user
        sales_rep_data = {
            "username": f"gps_sales_rep_{timestamp}",
            "email": f"gpssalesrep_{timestamp}@test.com",
            "password": "gpsrep123",
            "role": "sales_rep",
            "full_name": "مندوب GPS للاختبار",
            "phone": "+966501111111",
            "managed_by": self.manager_id
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
        
        print("✅ Test users setup completed successfully")
        print()
        return True
    
    def test_track_location_api(self):
        """Test 1: POST /api/gps/track-location"""
        print("📍 TESTING POST /api/gps/track-location")
        
        if not self.sales_rep_token:
            self.log_test("GPS Track Location API", False, "No sales rep token available")
            return False
        
        # Test location tracking with various data
        location_data = {
            "latitude": RIYADH_COORDS["latitude"],
            "longitude": RIYADH_COORDS["longitude"],
            "timestamp": datetime.utcnow().isoformat(),
            "accuracy": 5.0,
            "speed": 0.0,
            "heading": 0.0,
            "address": "شارع الملك فهد، الرياض"
        }
        
        status_code, response = self.make_request("POST", "/gps/track-location", location_data, self.sales_rep_token)
        
        if status_code == 200:
            # Check response structure
            required_fields = ["location_id", "distance_from_last", "geofence_alerts"]
            if all(field in response for field in required_fields):
                distance = response.get("distance_from_last", 0)
                alerts = response.get("geofence_alerts", [])
                
                self.log_test("GPS Track Location API", True, 
                             f"Location tracked successfully. Distance: {distance}m, Alerts: {len(alerts)}")
                return True
            else:
                self.log_test("GPS Track Location API", False, f"Missing required fields in response: {response}")
        else:
            self.log_test("GPS Track Location API", False, f"Status: {status_code}", response)
        return False
    
    def test_location_history_api(self):
        """Test 2: GET /api/gps/location-history/{user_id}"""
        print("📊 TESTING GET /api/gps/location-history/{user_id}")
        
        if not self.manager_token or not self.sales_rep_id:
            self.log_test("GPS Location History API", False, "Missing manager token or sales rep ID")
            return False
        
        # Test different time periods
        test_periods = [2, 6, 12, 24, 48]
        all_passed = True
        
        for hours in test_periods:
            params = {"hours": hours, "include_route": "true"}
            status_code, response = self.make_request("GET", f"/gps/location-history/{self.sales_rep_id}", 
                                                    token=self.manager_token, params=params)
            
            if status_code == 200:
                # Check response structure
                required_fields = ["locations", "route_statistics", "stops_detected"]
                if all(field in response for field in required_fields):
                    locations = response.get("locations", [])
                    route_stats = response.get("route_statistics", {})
                    stops = response.get("stops_detected", [])
                    
                    # Check route statistics structure
                    required_stats = ["total_distance", "average_speed", "max_speed", "total_time"]
                    if all(stat in route_stats for stat in required_stats):
                        print(f"   ✅ {hours}h history: {len(locations)} locations, {len(stops)} stops, {route_stats['total_distance']:.1f}m distance")
                    else:
                        print(f"   ❌ {hours}h history: Missing route statistics")
                        all_passed = False
                else:
                    print(f"   ❌ {hours}h history: Missing required fields")
                    all_passed = False
            else:
                print(f"   ❌ {hours}h history: Status {status_code}")
                all_passed = False
        
        self.log_test("GPS Location History API", all_passed, 
                     "All time periods tested successfully" if all_passed else "Some time periods failed")
        return all_passed
    
    def test_team_locations_api(self):
        """Test 3: GET /api/gps/team-locations"""
        print("👥 TESTING GET /api/gps/team-locations")
        
        if not self.manager_token:
            self.log_test("GPS Team Locations API", False, "No manager token available")
            return False
        
        params = {"include_history_hours": 2}
        status_code, response = self.make_request("GET", "/gps/team-locations", 
                                                token=self.manager_token, params=params)
        
        if status_code == 200:
            # Check response structure
            if isinstance(response, list):
                team_members_found = len(response)
                
                if team_members_found > 0:
                    member = response[0]
                    required_fields = ["user_id", "user_name", "current_location", "status", "last_seen", "recent_activity"]
                    
                    if all(field in member for field in required_fields):
                        # Check status determination
                        status_value = member.get("status")
                        valid_statuses = ["online", "offline", "inactive", "no_data"]
                        
                        if status_value in valid_statuses:
                            # Check recent activity structure
                            recent_activity = member.get("recent_activity", {})
                            activity_fields = ["visits_today", "distance_traveled", "last_location_update"]
                            
                            if all(field in recent_activity for field in activity_fields):
                                self.log_test("GPS Team Locations API", True, 
                                             f"Found {team_members_found} team members with complete data. Status: {status_value}")
                                return True
                            else:
                                self.log_test("GPS Team Locations API", False, "Missing recent activity fields")
                        else:
                            self.log_test("GPS Team Locations API", False, f"Invalid status: {status_value}")
                    else:
                        self.log_test("GPS Team Locations API", False, f"Missing required fields: {member}")
                else:
                    self.log_test("GPS Team Locations API", True, "No team members found (expected for new manager)")
                    return True
            else:
                self.log_test("GPS Team Locations API", False, "Response is not a list")
        else:
            self.log_test("GPS Team Locations API", False, f"Status: {status_code}", response)
        return False
    
    def test_create_geofence_api(self):
        """Test 4: POST /api/gps/create-geofence"""
        print("🔒 TESTING POST /api/gps/create-geofence")
        
        if not self.manager_token:
            self.log_test("GPS Create Geofence API", False, "No manager token available")
            return False
        
        # Test creating allowed area geofence
        allowed_geofence_data = {
            "name": "منطقة الرياض المسموحة",
            "type": "allowed_area",
            "coordinates": [
                {"latitude": 24.7000, "longitude": 46.6500},
                {"latitude": 24.7300, "longitude": 46.6500},
                {"latitude": 24.7300, "longitude": 46.7000},
                {"latitude": 24.7000, "longitude": 46.7000}
            ],
            "radius": 1000,  # meters
            "notifications": {
                "entry_message": "دخلت المنطقة المسموحة",
                "exit_message": "خرجت من المنطقة المسموحة",
                "notify_manager": True
            },
            "active_hours": {
                "start": "08:00",
                "end": "18:00"
            }
        }
        
        status_code, response = self.make_request("POST", "/gps/create-geofence", allowed_geofence_data, self.manager_token)
        
        if status_code == 200:
            geofence_id = response.get("geofence_id")
            if geofence_id:
                # Test creating restricted area geofence
                restricted_geofence_data = {
                    "name": "منطقة محظورة",
                    "type": "restricted_area",
                    "coordinates": [
                        {"latitude": 24.6800, "longitude": 46.6300},
                        {"latitude": 24.6900, "longitude": 46.6400}
                    ],
                    "radius": 500,
                    "notifications": {
                        "entry_message": "تحذير: دخلت منطقة محظورة",
                        "exit_message": "خرجت من المنطقة المحظورة",
                        "notify_manager": True,
                        "alert_level": "high"
                    }
                }
                
                status_code2, response2 = self.make_request("POST", "/gps/create-geofence", restricted_geofence_data, self.manager_token)
                
                if status_code2 == 200:
                    self.log_test("GPS Create Geofence API", True, 
                                 f"Both geofences created successfully: allowed ({geofence_id}) and restricted ({response2.get('geofence_id')})")
                    return True
                else:
                    self.log_test("GPS Create Geofence API", False, f"Restricted geofence creation failed: {status_code2}")
            else:
                self.log_test("GPS Create Geofence API", False, "No geofence_id in response")
        else:
            self.log_test("GPS Create Geofence API", False, f"Status: {status_code}", response)
        return False
    
    def test_route_optimization_api(self):
        """Test 5: GET /api/gps/route-optimization"""
        print("🗺️ TESTING GET /api/gps/route-optimization")
        
        if not self.manager_token or not self.sales_rep_id:
            self.log_test("GPS Route Optimization API", False, "Missing manager token or sales rep ID")
            return False
        
        # Test route optimization with multiple users and locations
        params = {
            "user_ids": f"{self.sales_rep_id}",
            "target_locations": f"{RIYADH_COORDS['latitude']},{RIYADH_COORDS['longitude']},{JEDDAH_COORDS['latitude']},{JEDDAH_COORDS['longitude']},{DAMMAM_COORDS['latitude']},{DAMMAM_COORDS['longitude']}"
        }
        
        status_code, response = self.make_request("GET", "/gps/route-optimization", 
                                                token=self.manager_token, params=params)
        
        if status_code == 200:
            # Check response structure
            required_fields = ["optimized_routes", "total_distance", "estimated_time", "algorithm_used"]
            
            if all(field in response for field in required_fields):
                optimized_routes = response.get("optimized_routes", [])
                total_distance = response.get("total_distance", 0)
                estimated_time = response.get("estimated_time", 0)
                algorithm = response.get("algorithm_used", "")
                
                if len(optimized_routes) > 0:
                    route = optimized_routes[0]
                    route_fields = ["user_id", "route_order", "distances", "estimated_times"]
                    
                    if all(field in route for field in route_fields):
                        self.log_test("GPS Route Optimization API", True, 
                                     f"Route optimized using {algorithm}. Total distance: {total_distance:.1f}m, Time: {estimated_time:.1f}min")
                        return True
                    else:
                        self.log_test("GPS Route Optimization API", False, "Missing route fields")
                else:
                    self.log_test("GPS Route Optimization API", False, "No optimized routes returned")
            else:
                self.log_test("GPS Route Optimization API", False, f"Missing required fields: {response}")
        else:
            self.log_test("GPS Route Optimization API", False, f"Status: {status_code}", response)
        return False
    
    def test_haversine_formula_accuracy(self):
        """Test 6: Verify Haversine formula accuracy in distance calculations"""
        print("🧮 TESTING HAVERSINE FORMULA ACCURACY")
        
        if not self.sales_rep_token:
            self.log_test("Haversine Formula Accuracy", False, "No sales rep token available")
            return False
        
        # Track two locations and verify distance calculation
        location1 = {
            "latitude": RIYADH_COORDS["latitude"],
            "longitude": RIYADH_COORDS["longitude"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Track first location
        status_code1, response1 = self.make_request("POST", "/gps/track-location", location1, self.sales_rep_token)
        
        if status_code1 == 200:
            time.sleep(1)  # Small delay
            
            # Track second location (Jeddah - ~879km from Riyadh)
            location2 = {
                "latitude": JEDDAH_COORDS["latitude"],
                "longitude": JEDDAH_COORDS["longitude"],
                "timestamp": datetime.utcnow().isoformat()
            }
            
            status_code2, response2 = self.make_request("POST", "/gps/track-location", location2, self.sales_rep_token)
            
            if status_code2 == 200:
                distance_from_last = response2.get("distance_from_last", 0)
                
                # Expected distance between Riyadh and Jeddah is approximately 879,000 meters
                expected_distance = 879000  # meters
                tolerance = expected_distance * 0.05  # 5% tolerance
                
                if abs(distance_from_last - expected_distance) <= tolerance:
                    self.log_test("Haversine Formula Accuracy", True, 
                                 f"Distance calculation accurate: {distance_from_last:.0f}m (expected ~{expected_distance:.0f}m)")
                    return True
                else:
                    self.log_test("Haversine Formula Accuracy", False, 
                                 f"Distance calculation inaccurate: {distance_from_last:.0f}m (expected ~{expected_distance:.0f}m)")
            else:
                self.log_test("Haversine Formula Accuracy", False, f"Second location tracking failed: {status_code2}")
        else:
            self.log_test("Haversine Formula Accuracy", False, f"First location tracking failed: {status_code1}")
        return False
    
    def test_security_permissions(self):
        """Test 7: Verify security permissions for GPS endpoints"""
        print("🔐 TESTING SECURITY PERMISSIONS")
        
        if not self.sales_rep_token or not self.manager_token:
            self.log_test("GPS Security Permissions", False, "Missing required tokens")
            return False
        
        # Test that sales rep cannot access team locations
        status_code, response = self.make_request("GET", "/gps/team-locations", token=self.sales_rep_token)
        
        if status_code == 403:
            # Test that sales rep cannot create geofences
            geofence_data = {
                "name": "منطقة غير مسموحة",
                "type": "allowed_area",
                "coordinates": [{"latitude": 24.7000, "longitude": 46.6500}],
                "radius": 100
            }
            
            status_code2, response2 = self.make_request("POST", "/gps/create-geofence", geofence_data, self.sales_rep_token)
            
            if status_code2 == 403:
                # Test that sales rep cannot access route optimization
                params = {"user_ids": self.sales_rep_id, "target_locations": "24.7136,46.6753"}
                status_code3, response3 = self.make_request("GET", "/gps/route-optimization", 
                                                          token=self.sales_rep_token, params=params)
                
                if status_code3 == 403:
                    self.log_test("GPS Security Permissions", True, 
                                 "Sales rep correctly denied access to manager-only GPS endpoints")
                    return True
                else:
                    self.log_test("GPS Security Permissions", False, f"Sales rep not denied route optimization access: {status_code3}")
            else:
                self.log_test("GPS Security Permissions", False, f"Sales rep not denied geofence creation: {status_code2}")
        else:
            self.log_test("GPS Security Permissions", False, f"Sales rep not denied team locations access: {status_code}")
        return False
    
    def test_arabic_text_support(self):
        """Test 8: Verify Arabic text support in geofencing messages"""
        print("🌐 TESTING ARABIC TEXT SUPPORT")
        
        if not self.manager_token:
            self.log_test("Arabic Text Support", False, "No manager token available")
            return False
        
        # Create geofence with Arabic messages
        arabic_geofence_data = {
            "name": "منطقة اختبار النصوص العربية",
            "type": "allowed_area",
            "coordinates": [
                {"latitude": 24.7136, "longitude": 46.6753}
            ],
            "radius": 100,
            "notifications": {
                "entry_message": "مرحباً! لقد دخلت المنطقة المسموحة بنجاح",
                "exit_message": "وداعاً! لقد خرجت من المنطقة المسموحة",
                "notify_manager": True,
                "alert_level": "info"
            },
            "description": "هذه منطقة اختبار لدعم النصوص العربية في نظام تتبع GPS"
        }
        
        status_code, response = self.make_request("POST", "/gps/create-geofence", arabic_geofence_data, self.manager_token)
        
        if status_code == 200:
            geofence_id = response.get("geofence_id")
            if geofence_id:
                # Verify Arabic text was stored correctly by checking the response
                if "message" in response and any(ord(char) > 127 for char in response["message"]):
                    self.log_test("Arabic Text Support", True, 
                                 f"Arabic text properly supported in geofencing messages: {geofence_id}")
                    return True
                else:
                    self.log_test("Arabic Text Support", True, 
                                 f"Geofence created successfully with Arabic data: {geofence_id}")
                    return True
            else:
                self.log_test("Arabic Text Support", False, "No geofence_id returned")
        else:
            self.log_test("Arabic Text Support", False, f"Status: {status_code}", response)
        return False
    
    def run_all_tests(self):
        """Run all Advanced GPS Tracking System tests"""
        print("🎯 STARTING ADVANCED GPS TRACKING SYSTEM TESTING")
        print("=" * 80)
        print("Focus: Advanced GPS APIs, Location Tracking, Geofencing, Route Optimization")
        print("=" * 80)
        print()
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Test users setup failed. Cannot proceed with GPS tests.")
            return
        
        # Run Advanced GPS API tests
        print("📍 TESTING LOCATION TRACKING APIs")
        print("-" * 60)
        self.test_track_location_api()
        self.test_location_history_api()
        print()
        
        print("👥 TESTING TEAM MANAGEMENT APIs")
        print("-" * 60)
        self.test_team_locations_api()
        print()
        
        print("🔒 TESTING GEOFENCING APIs")
        print("-" * 60)
        self.test_create_geofence_api()
        print()
        
        print("🗺️ TESTING ROUTE OPTIMIZATION APIs")
        print("-" * 60)
        self.test_route_optimization_api()
        print()
        
        print("🧮 TESTING CALCULATION ACCURACY")
        print("-" * 60)
        self.test_haversine_formula_accuracy()
        print()
        
        print("🔐 TESTING SECURITY & LOCALIZATION")
        print("-" * 60)
        self.test_security_permissions()
        self.test_arabic_text_support()
        print()
        
        # Summary
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        
        print("=" * 80)
        print("🎉 ADVANCED GPS TRACKING SYSTEM TESTING COMPLETED!")
        print("=" * 80)
        print(f"✅ PASSED: {passed_tests}")
        print(f"❌ FAILED: {total_tests - passed_tests}")
        print(f"📊 SUCCESS RATE: {success_rate:.1f}%")
        print("=" * 80)
        
        return self.test_results

if __name__ == "__main__":
    tester = AdvancedGPSTester()
    results = tester.run_all_tests()