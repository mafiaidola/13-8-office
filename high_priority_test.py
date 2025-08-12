#!/usr/bin/env python3
"""
Specific High-Priority Backend API Testing
Testing key APIs mentioned in test_result.md that need verification
"""

import requests
import json
import sys
from datetime import datetime
import time

# Configuration
BACKEND_URL = "https://medmanage-pro-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class HighPriorityTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request with proper error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=30)
            else:
                return None, f"Unsupported method: {method}"
                
            return response, None
        except requests.exceptions.RequestException as e:
            return None, str(e)
    
    def authenticate(self):
        """Authenticate as admin"""
        response, error = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("Admin Authentication", True, "Successfully authenticated")
                return True
        
        self.log_test("Admin Authentication", False, "Failed to authenticate")
        return False
    
    def test_enhanced_user_profile_api(self):
        """Test Enhanced User Profile API"""
        print("\n👤 TESTING ENHANCED USER PROFILE API")
        
        if not self.admin_token:
            return
            
        # Get a user ID first
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                user_id = users[0].get('id')
                
                # Test enhanced profile endpoint
                response, error = self.make_request("GET", f"/users/{user_id}/profile", token=self.admin_token)
                if response and response.status_code == 200:
                    profile_data = response.json()
                    required_sections = ['user', 'sales_activity', 'debt_info', 'territory_info', 'team_info']
                    has_all_sections = all(section in profile_data for section in required_sections)
                    
                    if has_all_sections:
                        self.log_test("Enhanced User Profile API", True, "All required profile sections present")
                    else:
                        missing = [s for s in required_sections if s not in profile_data]
                        self.log_test("Enhanced User Profile API", False, f"Missing sections: {missing}")
                else:
                    self.log_test("Enhanced User Profile API", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("Enhanced User Profile API", False, "No users available for testing")
        else:
            self.log_test("Enhanced User Profile API", False, "Cannot retrieve users for testing")
    
    def test_gamification_apis(self):
        """Test Gamification System APIs"""
        print("\n🎮 TESTING GAMIFICATION SYSTEM APIs")
        
        if not self.admin_token:
            return
            
        # Test achievements API
        response, error = self.make_request("GET", "/achievements", token=self.admin_token)
        if response and response.status_code == 200:
            achievements = response.json()
            self.log_test("Achievements API", True, f"Retrieved {len(achievements) if isinstance(achievements, list) else 'data'} achievements")
        else:
            self.log_test("Achievements API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test gamification user profile
        response, error = self.make_request("GET", "/users", token=self.admin_token)
        if response and response.status_code == 200:
            users = response.json()
            if isinstance(users, list) and len(users) > 0:
                user_id = users[0].get('id')
                
                # Test user points API
                response, error = self.make_request("GET", f"/users/{user_id}/points", token=self.admin_token)
                if response and response.status_code == 200:
                    points_data = response.json()
                    required_fields = ['total_points', 'level', 'achievements_unlocked']
                    has_required_fields = all(field in points_data for field in required_fields)
                    
                    if has_required_fields:
                        self.log_test("User Points API", True, "Points data structure correct")
                    else:
                        self.log_test("User Points API", False, "Missing required points fields")
                else:
                    self.log_test("User Points API", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test leaderboard API
        response, error = self.make_request("GET", "/gamification/leaderboard", token=self.admin_token)
        if response and response.status_code == 200:
            self.log_test("Leaderboard API", True, "Leaderboard data retrieved")
        else:
            self.log_test("Leaderboard API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_advanced_reports_api(self):
        """Test Advanced Reports API"""
        print("\n📊 TESTING ADVANCED REPORTS API")
        
        if not self.admin_token:
            return
            
        # Test visits performance report
        response, error = self.make_request("GET", "/reports/advanced?report_type=visits_performance", token=self.admin_token)
        if response and response.status_code == 200:
            report_data = response.json()
            if 'chart_type' in report_data and 'data' in report_data:
                self.log_test("Visits Performance Report", True, f"Chart type: {report_data.get('chart_type')}")
            else:
                self.log_test("Visits Performance Report", False, "Missing chart structure")
        else:
            self.log_test("Visits Performance Report", False, f"Status: {response.status_code if response else 'No response'}")
        
        # Test sales by rep report
        response, error = self.make_request("GET", "/reports/advanced?report_type=sales_by_rep", token=self.admin_token)
        if response and response.status_code == 200:
            report_data = response.json()
            if 'chart_type' in report_data and 'data' in report_data:
                self.log_test("Sales by Rep Report", True, f"Chart type: {report_data.get('chart_type')}")
            else:
                self.log_test("Sales by Rep Report", False, "Missing chart structure")
        else:
            self.log_test("Sales by Rep Report", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_real_time_analytics(self):
        """Test Real-time Analytics API"""
        print("\n📈 TESTING REAL-TIME ANALYTICS API")
        
        if not self.admin_token:
            return
            
        response, error = self.make_request("GET", "/analytics/realtime", token=self.admin_token)
        if response and response.status_code == 200:
            analytics_data = response.json()
            required_fields = ['timestamp', 'live_stats', 'chart_data']
            has_required_fields = all(field in analytics_data for field in required_fields)
            
            if has_required_fields:
                live_stats = analytics_data.get('live_stats', {})
                stats_fields = ['visits_today', 'active_sales_reps', 'pending_orders']
                has_stats = all(field in live_stats for field in stats_fields)
                
                if has_stats:
                    self.log_test("Real-time Analytics API", True, f"Live stats: {live_stats}")
                else:
                    self.log_test("Real-time Analytics API", False, "Missing live stats fields")
            else:
                self.log_test("Real-time Analytics API", False, "Missing required analytics fields")
        else:
            self.log_test("Real-time Analytics API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_global_search_api(self):
        """Test Global Search API"""
        print("\n🔍 TESTING GLOBAL SEARCH API")
        
        if not self.admin_token:
            return
            
        response, error = self.make_request("GET", "/search/global?q=test", token=self.admin_token)
        if response and response.status_code == 200:
            search_results = response.json()
            expected_categories = ['users', 'clinics', 'doctors', 'products']
            has_categories = all(category in search_results for category in expected_categories)
            
            if has_categories:
                total_results = sum(len(search_results.get(cat, [])) for cat in expected_categories)
                self.log_test("Global Search API", True, f"Search across {len(expected_categories)} categories, {total_results} total results")
            else:
                self.log_test("Global Search API", False, "Missing search categories")
        else:
            self.log_test("Global Search API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_multi_language_support(self):
        """Test Multi-language Support"""
        print("\n🌐 TESTING MULTI-LANGUAGE SUPPORT")
        
        if not self.admin_token:
            return
            
        languages = ['ar', 'en', 'fr']
        
        for lang in languages:
            response, error = self.make_request("GET", f"/language/translations?lang={lang}", token=self.admin_token)
            if response and response.status_code == 200:
                translations = response.json()
                required_keys = ['dashboard', 'users', 'warehouses', 'visits', 'reports']
                has_required_keys = all(key in translations for key in required_keys)
                
                if has_required_keys:
                    self.log_test(f"Multi-language Support ({lang.upper()})", True, f"All required translation keys present")
                else:
                    missing_keys = [key for key in required_keys if key not in translations]
                    self.log_test(f"Multi-language Support ({lang.upper()})", False, f"Missing keys: {missing_keys}")
            else:
                self.log_test(f"Multi-language Support ({lang.upper()})", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_qr_code_system(self):
        """Test QR Code Generation and Scanning"""
        print("\n📱 TESTING QR CODE SYSTEM")
        
        if not self.admin_token:
            return
            
        # Test QR code generation for clinic
        qr_data = {
            "type": "clinic",
            "id": "test-clinic-id",
            "data": {
                "name": "Test Clinic",
                "address": "Test Address"
            }
        }
        
        response, error = self.make_request("POST", "/qr/generate", qr_data, token=self.admin_token)
        if response and response.status_code == 200:
            qr_result = response.json()
            if 'qr_code' in qr_result and qr_result['qr_code'].startswith('data:image/png;base64'):
                self.log_test("QR Code Generation", True, "QR code generated successfully")
                
                # Test QR code scanning
                scan_data = {
                    "qr_content": json.dumps(qr_data)
                }
                
                response, error = self.make_request("POST", "/qr/scan", scan_data, token=self.admin_token)
                if response and response.status_code == 200:
                    scan_result = response.json()
                    if 'type' in scan_result and 'action' in scan_result:
                        self.log_test("QR Code Scanning", True, f"Scan result: {scan_result.get('type')} - {scan_result.get('action')}")
                    else:
                        self.log_test("QR Code Scanning", False, "Missing scan result structure")
                else:
                    self.log_test("QR Code Scanning", False, f"Status: {response.status_code if response else 'No response'}")
            else:
                self.log_test("QR Code Generation", False, "Invalid QR code format")
        else:
            self.log_test("QR Code Generation", False, f"Status: {response.status_code if response else 'No response'}")
    
    def test_offline_sync(self):
        """Test Offline Sync API"""
        print("\n🔄 TESTING OFFLINE SYNC API")
        
        if not self.admin_token:
            return
            
        sync_data = {
            "visits": [
                {
                    "local_id": "offline_visit_1",
                    "doctor_id": "test-doctor-id",
                    "clinic_id": "test-clinic-id",
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "notes": "Offline visit test",
                    "visit_date": datetime.now().isoformat()
                }
            ],
            "orders": []
        }
        
        response, error = self.make_request("POST", "/offline/sync", sync_data, token=self.admin_token)
        if response and response.status_code == 200:
            sync_result = response.json()
            if 'sync_results' in sync_result:
                self.log_test("Offline Sync API", True, "Sync completed successfully")
            else:
                self.log_test("Offline Sync API", False, "Missing sync results")
        else:
            self.log_test("Offline Sync API", False, f"Status: {response.status_code if response else 'No response'}")
    
    def run_high_priority_tests(self):
        """Run all high-priority backend tests"""
        print("🎯 HIGH-PRIORITY BACKEND API TESTING")
        print("=" * 80)
        print("Testing key APIs mentioned in test_result.md")
        print()
        
        if not self.authenticate():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Run all high-priority tests
        self.test_enhanced_user_profile_api()
        self.test_gamification_apis()
        self.test_advanced_reports_api()
        self.test_real_time_analytics()
        self.test_global_search_api()
        self.test_multi_language_support()
        self.test_qr_code_system()
        self.test_offline_sync()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 HIGH-PRIORITY TESTING SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        # Print failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = HighPriorityTester()
    success = tester.run_high_priority_tests()
    
    if success:
        print("\n🎉 HIGH-PRIORITY TESTING COMPLETED SUCCESSFULLY!")
    else:
        print("\n⚠️ HIGH-PRIORITY TESTING COMPLETED WITH ISSUES!")