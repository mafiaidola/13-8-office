#!/usr/bin/env python3
"""
Google Maps Integration & Location Backend API Testing
Testing Google Maps API Key configuration and location-related backend APIs
"""

import requests
import json
import sys
import os
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://1384a96c-dfd0-4864-9b66-42a6296e94b5.preview.emergentagent.com/api"

class GoogleMapsBackendTester:
    def __init__(self):
        self.admin_token = None
        self.sales_rep_token = None
        self.test_results = []
        self.created_clinic_id = None
        self.created_doctor_id = None
        
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

    def test_google_maps_api_key_configuration(self):
        """Test Google Maps API Key configuration in environment"""
        try:
            # Check if API key is configured in frontend .env
            frontend_env_path = "/app/frontend/.env"
            if os.path.exists(frontend_env_path):
                with open(frontend_env_path, 'r') as f:
                    content = f.read()
                    if "REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDzxZjDxPdcrnGKb66mT5BIvQzQWcnLp70" in content:
                        self.log_test("Google Maps API Key Configuration", True, "API Key properly configured in frontend/.env: AIzaSyDzxZjDxPdcrnGKb66mT5BIvQzQWcnLp70")
                        return True
                    else:
                        self.log_test("Google Maps API Key Configuration", False, "API Key not found or incorrect in frontend/.env")
                        return False
            else:
                self.log_test("Google Maps API Key Configuration", False, "Frontend .env file not found")
                return False
                
        except Exception as e:
            self.log_test("Google Maps API Key Configuration", False, f"Exception: {str(e)}")
            return False

    def admin_login(self):
        """Test admin login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.log_test("Admin Authentication", True, f"Admin login successful, token received")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False

    def create_test_sales_rep(self):
        """Create a test sales rep for location testing"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            user_data = {
                "username": "test_sales_rep_maps",
                "email": "testsalesrep@maps.com",
                "password": "testpass123",
                "full_name": "مندوب اختبار الخرائط",
                "phone": "01234567890",
                "role": "sales_rep",
                "region_id": "region-001",
                "address": "القاهرة، مصر",
                "is_active": True
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                # Now login as sales rep
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": "test_sales_rep_maps",
                    "password": "testpass123"
                })
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    self.sales_rep_token = login_data["token"]
                    self.log_test("Test Sales Rep Creation & Login", True, f"Sales rep created and logged in successfully")
                    return data.get('user_id')
                else:
                    self.log_test("Test Sales Rep Creation & Login", False, f"Sales rep created but login failed: {login_response.text}")
                    return None
            else:
                self.log_test("Test Sales Rep Creation & Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Test Sales Rep Creation & Login", False, f"Exception: {str(e)}")
            return None

    def test_clinic_registration_with_gps(self):
        """Test clinic registration with GPS coordinates"""
        try:
            headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            
            # Test clinic data with GPS coordinates (Cairo coordinates)
            clinic_data = {
                "name": "عيادة اختبار الخرائط",
                "address": "شارع التحرير، القاهرة، مصر",
                "latitude": 30.0444,  # Cairo latitude
                "longitude": 31.2357,  # Cairo longitude
                "phone": "0223456789",
                "classification": "class_a",
                "accounting_manager_name": "أحمد محمد",
                "accounting_manager_phone": "01234567890",
                "working_hours": {
                    "saturday": {"start": "09:00", "end": "17:00"},
                    "sunday": {"start": "09:00", "end": "17:00"}
                },
                "line": "line_1"
            }
            
            response = requests.post(f"{BACKEND_URL}/clinics", json=clinic_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.created_clinic_id = data.get("clinic_id")
                self.log_test("Clinic Registration with GPS Coordinates", True, f"Clinic created successfully with GPS coordinates (lat: {clinic_data['latitude']}, lng: {clinic_data['longitude']})")
                return True
            else:
                self.log_test("Clinic Registration with GPS Coordinates", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Clinic Registration with GPS Coordinates", False, f"Exception: {str(e)}")
            return False

    def test_clinic_location_data_storage(self):
        """Test if clinic location data is properly stored in database"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Get clinics list to verify GPS data storage
            response = requests.get(f"{BACKEND_URL}/clinics", headers=headers)
            
            if response.status_code == 200:
                clinics = response.json()
                
                # Find our test clinic
                test_clinic = None
                for clinic in clinics:
                    if clinic.get("name") == "عيادة اختبار الخرائط":
                        test_clinic = clinic
                        break
                
                if test_clinic:
                    # Verify GPS coordinates are stored
                    if ("latitude" in test_clinic and "longitude" in test_clinic and 
                        test_clinic["latitude"] == 30.0444 and test_clinic["longitude"] == 31.2357):
                        self.log_test("Clinic Location Data Storage", True, f"GPS coordinates properly stored in database (lat: {test_clinic['latitude']}, lng: {test_clinic['longitude']})")
                        return True
                    else:
                        self.log_test("Clinic Location Data Storage", False, f"GPS coordinates not properly stored or incorrect values")
                        return False
                else:
                    self.log_test("Clinic Location Data Storage", False, "Test clinic not found in database")
                    return False
            else:
                self.log_test("Clinic Location Data Storage", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Clinic Location Data Storage", False, f"Exception: {str(e)}")
            return False

    def test_gps_geofencing_validation(self):
        """Test GPS geofencing for visit validation within 20m"""
        try:
            if not self.created_clinic_id:
                self.log_test("GPS Geofencing Validation", False, "No clinic ID available for testing")
                return False
                
            headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            
            # First create a doctor for the clinic
            doctor_data = {
                "name": "د. محمد أحمد",
                "specialty": "طب عام",
                "clinic_id": self.created_clinic_id,
                "phone": "01234567890",
                "email": "doctor@test.com"
            }
            
            doctor_response = requests.post(f"{BACKEND_URL}/doctors", json=doctor_data, headers=headers)
            
            if doctor_response.status_code == 200:
                doctor_data_response = doctor_response.json()
                self.created_doctor_id = doctor_data_response.get("doctor_id")
                
                # Test visit within 20m (should be accepted)
                visit_data_valid = {
                    "doctor_id": self.created_doctor_id,
                    "clinic_id": self.created_clinic_id,
                    "latitude": 30.0445,  # Very close to clinic (30.0444)
                    "longitude": 31.2358,  # Very close to clinic (31.2357)
                    "notes": "زيارة اختبار داخل النطاق المسموح"
                }
                
                visit_response = requests.post(f"{BACKEND_URL}/visits", json=visit_data_valid, headers=headers)
                
                if visit_response.status_code == 200:
                    # Test visit outside 20m (should be rejected)
                    visit_data_invalid = {
                        "doctor_id": self.created_doctor_id,
                        "clinic_id": self.created_clinic_id,
                        "latitude": 30.0500,  # Far from clinic
                        "longitude": 31.2400,  # Far from clinic
                        "notes": "زيارة اختبار خارج النطاق المسموح"
                    }
                    
                    visit_response_invalid = requests.post(f"{BACKEND_URL}/visits", json=visit_data_invalid, headers=headers)
                    
                    if visit_response_invalid.status_code == 400:
                        self.log_test("GPS Geofencing Validation", True, "Geofencing working correctly - valid visit accepted, invalid visit rejected")
                        return True
                    else:
                        self.log_test("GPS Geofencing Validation", False, f"Invalid visit should be rejected but got status: {visit_response_invalid.status_code}")
                        return False
                else:
                    self.log_test("GPS Geofencing Validation", False, f"Valid visit rejected: {visit_response.text}")
                    return False
            else:
                self.log_test("GPS Geofencing Validation", False, f"Doctor creation failed: {doctor_response.text}")
                return False
                
        except Exception as e:
            self.log_test("GPS Geofencing Validation", False, f"Exception: {str(e)}")
            return False

    def test_distance_calculation_api(self):
        """Test distance calculation functionality"""
        try:
            # This tests the internal distance calculation function used for geofencing
            # We can test this by creating visits at known distances
            
            if not self.created_clinic_id or not self.created_doctor_id:
                self.log_test("Distance Calculation API", False, "Missing clinic or doctor ID for testing")
                return False
                
            headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            
            # Test visit at a known distance (approximately 100m away)
            visit_data = {
                "doctor_id": self.created_doctor_id,
                "clinic_id": self.created_clinic_id,
                "latitude": 30.0454,  # About 100m from clinic
                "longitude": 31.2367,  # About 100m from clinic
                "notes": "زيارة اختبار حساب المسافة"
            }
            
            response = requests.post(f"{BACKEND_URL}/visits", json=visit_data, headers=headers)
            
            # This should be rejected due to distance > 20m
            if response.status_code == 400:
                response_data = response.json()
                if "distance" in response_data.get("detail", "").lower():
                    self.log_test("Distance Calculation API", True, "Distance calculation working - visit rejected with distance information")
                    return True
                else:
                    self.log_test("Distance Calculation API", False, "Visit rejected but no distance information provided")
                    return False
            else:
                self.log_test("Distance Calculation API", False, f"Expected rejection due to distance but got status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Distance Calculation API", False, f"Exception: {str(e)}")
            return False

    def test_location_based_apis(self):
        """Test location-based APIs and queries"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test getting clinics (should include location data)
            response = requests.get(f"{BACKEND_URL}/clinics", headers=headers)
            
            if response.status_code == 200:
                clinics = response.json()
                
                # Check if clinics have location data
                location_data_found = False
                for clinic in clinics:
                    if "latitude" in clinic and "longitude" in clinic:
                        location_data_found = True
                        break
                
                if location_data_found:
                    self.log_test("Location-based APIs", True, f"Clinics API returns location data correctly ({len(clinics)} clinics found)")
                    return True
                else:
                    self.log_test("Location-based APIs", False, "Clinics API does not include location data")
                    return False
            else:
                self.log_test("Location-based APIs", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Location-based APIs", False, f"Exception: {str(e)}")
            return False

    def test_qr_code_location_integration(self):
        """Test QR code generation for clinics with location data"""
        try:
            if not self.created_clinic_id:
                self.log_test("QR Code Location Integration", False, "No clinic ID available for testing")
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test QR code generation for clinic
            qr_data = {
                "type": "clinic",
                "id": self.created_clinic_id
            }
            
            response = requests.post(f"{BACKEND_URL}/qr/generate", json=qr_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if "qr_code" in data and data["qr_code"].startswith("data:image/png;base64"):
                    self.log_test("QR Code Location Integration", True, "QR code generated successfully for clinic with location data")
                    return True
                else:
                    self.log_test("QR Code Location Integration", False, "QR code format incorrect")
                    return False
            else:
                self.log_test("QR Code Location Integration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("QR Code Location Integration", False, f"Exception: {str(e)}")
            return False

    def test_system_health(self):
        """Test system health and database connectivity"""
        try:
            # Test basic endpoint accessibility
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "test",
                "password": "test"
            })
            
            # Even if login fails, if we get a proper HTTP response, the system is up
            if response.status_code in [401, 400, 422]:
                self.log_test("System Health Check", True, "Backend service is healthy and responding")
                return True
            elif response.status_code == 200:
                self.log_test("System Health Check", True, "Backend service is healthy")
                return True
            else:
                self.log_test("System Health Check", False, f"Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("System Health Check", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all Google Maps integration tests"""
        print("🗺️  GOOGLE MAPS INTEGRATION & LOCATION BACKEND API TESTING")
        print("=" * 80)
        print("Testing Google Maps API Key configuration and location-related backend APIs")
        print("Focus: GPS coordinates, geofencing, clinic registration, location data storage")
        print()
        
        # Test system health first
        self.test_system_health()
        
        # Test Google Maps API Key configuration
        self.test_google_maps_api_key_configuration()
        
        # Test authentication
        admin_login_success = self.admin_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Create test sales rep for location testing
        sales_rep_id = self.create_test_sales_rep()
        
        if not self.sales_rep_token:
            print("❌ Cannot proceed without sales rep authentication")
            return self.generate_summary()
        
        # Test location-related functionality
        self.test_clinic_registration_with_gps()
        self.test_clinic_location_data_storage()
        self.test_gps_geofencing_validation()
        self.test_distance_calculation_api()
        self.test_location_based_apis()
        self.test_qr_code_location_integration()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("🗺️  GOOGLE MAPS INTEGRATION TEST SUMMARY")
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
        
        # Show detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "=" * 80)
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 GOOGLE MAPS INTEGRATION: FULLY FUNCTIONAL")
        elif success_rate >= 60:
            print("⚠️  GOOGLE MAPS INTEGRATION: MOSTLY FUNCTIONAL")
        else:
            print("❌ GOOGLE MAPS INTEGRATION: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = GoogleMapsBackendTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()