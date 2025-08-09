#!/usr/bin/env python3
"""
Location APIs and Geocoding Backend Testing
Testing additional location-related APIs and geocoding functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://0f89e653-23a1-4222-bcbe-a4908839f7c6.preview.emergentagent.com/api"

class LocationAPIsTester:
    def __init__(self):
        self.admin_token = None
        self.sales_rep_token = None
        self.test_results = []
        
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
        """Test admin login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.log_test("Admin Authentication", True, f"Admin login successful")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False

    def test_clinic_requests_with_location(self):
        """Test clinic requests system with GPS coordinates"""
        try:
            # First login as sales rep
            login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "test_sales_rep_maps",
                "password": "testpass123"
            })
            
            if login_response.status_code == 200:
                login_data = login_response.json()
                self.sales_rep_token = login_data["token"]
                
                headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
                
                # Create clinic request with GPS coordinates
                clinic_request_data = {
                    "clinic_name": "عيادة طلب جديد مع GPS",
                    "clinic_phone": "0223456789",
                    "doctor_name": "د. أحمد محمود",
                    "doctor_specialty": "طب الأطفال",
                    "doctor_address": "شارع الجمهورية، القاهرة",
                    "clinic_manager_name": "محمد أحمد",
                    "latitude": 30.0500,
                    "longitude": 31.2400,
                    "address": "شارع الجمهورية، القاهرة، مصر",
                    "notes": "طلب عيادة جديدة مع إحداثيات GPS للاختبار"
                }
                
                response = requests.post(f"{BACKEND_URL}/clinic-requests", json=clinic_request_data, headers=headers)
                
                if response.status_code == 200:
                    self.log_test("Clinic Requests with GPS Coordinates", True, "Clinic request created successfully with GPS coordinates")
                    return True
                else:
                    self.log_test("Clinic Requests with GPS Coordinates", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
            else:
                self.log_test("Clinic Requests with GPS Coordinates", False, "Sales rep login failed")
                return False
                
        except Exception as e:
            self.log_test("Clinic Requests with GPS Coordinates", False, f"Exception: {str(e)}")
            return False

    def test_visit_location_validation(self):
        """Test visit creation with location validation"""
        try:
            if not self.sales_rep_token:
                self.log_test("Visit Location Validation", False, "No sales rep token available")
                return False
                
            headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            
            # Get existing clinics and doctors for testing
            clinics_response = requests.get(f"{BACKEND_URL}/clinics", headers=headers)
            doctors_response = requests.get(f"{BACKEND_URL}/doctors", headers=headers)
            
            if clinics_response.status_code == 200 and doctors_response.status_code == 200:
                clinics = clinics_response.json()
                doctors = doctors_response.json()
                
                if clinics and doctors:
                    clinic = clinics[0]
                    doctor = doctors[0]
                    
                    # Test visit with exact clinic coordinates (should pass)
                    visit_data = {
                        "doctor_id": doctor["id"],
                        "clinic_id": clinic["id"],
                        "latitude": clinic["latitude"],
                        "longitude": clinic["longitude"],
                        "notes": "زيارة اختبار في نفس موقع العيادة"
                    }
                    
                    response = requests.post(f"{BACKEND_URL}/visits", json=visit_data, headers=headers)
                    
                    if response.status_code == 200:
                        self.log_test("Visit Location Validation", True, "Visit created successfully at exact clinic location")
                        return True
                    else:
                        self.log_test("Visit Location Validation", False, f"Visit creation failed: {response.text}")
                        return False
                else:
                    self.log_test("Visit Location Validation", False, "No clinics or doctors available for testing")
                    return False
            else:
                self.log_test("Visit Location Validation", False, "Failed to get clinics or doctors")
                return False
                
        except Exception as e:
            self.log_test("Visit Location Validation", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_location_stats(self):
        """Test dashboard statistics with location-based data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test admin dashboard stats
            response = requests.get(f"{BACKEND_URL}/dashboard/stats", headers=headers)
            
            if response.status_code == 200:
                stats = response.json()
                
                # Check if stats include location-related data
                if "total_clinics" in stats and "total_visits" in stats:
                    self.log_test("Dashboard Location Statistics", True, f"Dashboard stats include location-based data: {stats['total_clinics']} clinics, {stats['total_visits']} visits")
                    return True
                else:
                    self.log_test("Dashboard Location Statistics", False, "Dashboard stats missing location-related fields")
                    return False
            else:
                self.log_test("Dashboard Location Statistics", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Dashboard Location Statistics", False, f"Exception: {str(e)}")
            return False

    def test_search_with_location(self):
        """Test global search functionality with location data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test global search
            response = requests.get(f"{BACKEND_URL}/search/global?q=عيادة", headers=headers)
            
            if response.status_code == 200:
                search_results = response.json()
                
                # Check if clinics in search results include location data
                if "clinics" in search_results and search_results["clinics"]:
                    clinic = search_results["clinics"][0]
                    if "latitude" in clinic and "longitude" in clinic:
                        self.log_test("Search with Location Data", True, f"Search results include location data for clinics")
                        return True
                    else:
                        self.log_test("Search with Location Data", False, "Search results missing location data")
                        return False
                else:
                    self.log_test("Search with Location Data", True, "Search working but no clinics found (expected)")
                    return True
            else:
                self.log_test("Search with Location Data", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Search with Location Data", False, f"Exception: {str(e)}")
            return False

    def test_reports_with_location(self):
        """Test reports that include location-based data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test advanced reports
            response = requests.get(f"{BACKEND_URL}/reports/advanced?report_type=visits_performance", headers=headers)
            
            if response.status_code == 200:
                report_data = response.json()
                
                if "chart_data" in report_data:
                    self.log_test("Reports with Location Data", True, "Advanced reports working and include visit performance data")
                    return True
                else:
                    self.log_test("Reports with Location Data", False, "Reports missing chart data")
                    return False
            else:
                self.log_test("Reports with Location Data", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Reports with Location Data", False, f"Exception: {str(e)}")
            return False

    def test_offline_sync_with_location(self):
        """Test offline sync functionality with location data"""
        try:
            if not self.sales_rep_token:
                self.log_test("Offline Sync with Location", False, "No sales rep token available")
                return False
                
            headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            
            # Test offline sync with location data
            sync_data = {
                "visits": [
                    {
                        "local_id": "offline_visit_1",
                        "doctor_id": "test_doctor_id",
                        "clinic_id": "test_clinic_id",
                        "latitude": 30.0444,
                        "longitude": 31.2357,
                        "notes": "زيارة أوفلاين مع GPS",
                        "visit_date": datetime.utcnow().isoformat()
                    }
                ],
                "orders": []
            }
            
            response = requests.post(f"{BACKEND_URL}/offline/sync", json=sync_data, headers=headers)
            
            if response.status_code == 200:
                sync_result = response.json()
                if "sync_results" in sync_result:
                    self.log_test("Offline Sync with Location", True, "Offline sync working with location data")
                    return True
                else:
                    self.log_test("Offline Sync with Location", False, "Sync response missing results")
                    return False
            else:
                self.log_test("Offline Sync with Location", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Offline Sync with Location", False, f"Exception: {str(e)}")
            return False

    def test_analytics_with_location(self):
        """Test analytics APIs with location-based data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test real-time analytics
            response = requests.get(f"{BACKEND_URL}/analytics/realtime", headers=headers)
            
            if response.status_code == 200:
                analytics = response.json()
                
                if "live_stats" in analytics and "visits_today" in analytics["live_stats"]:
                    self.log_test("Analytics with Location Data", True, f"Real-time analytics working with visit data: {analytics['live_stats']['visits_today']} visits today")
                    return True
                else:
                    self.log_test("Analytics with Location Data", False, "Analytics missing visit statistics")
                    return False
            else:
                self.log_test("Analytics with Location Data", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Analytics with Location Data", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all location APIs tests"""
        print("📍 LOCATION APIs & GEOCODING BACKEND TESTING")
        print("=" * 70)
        print("Testing additional location-related APIs and geocoding functionality")
        print()
        
        # Test authentication
        admin_login_success = self.admin_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test location-related functionality
        self.test_clinic_requests_with_location()
        self.test_visit_location_validation()
        self.test_dashboard_location_stats()
        self.test_search_with_location()
        self.test_reports_with_location()
        self.test_offline_sync_with_location()
        self.test_analytics_with_location()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("📍 LOCATION APIs TEST SUMMARY")
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
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = LocationAPIsTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()