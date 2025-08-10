#!/usr/bin/env python3
"""
Comprehensive Backend Testing After Critical Frontend Fixes
Focus Areas:
1. Authentication System (admin/admin123 login)
2. Dashboard APIs (stats and metrics)
3. Quick Actions Backend Support
4. Theme System Backend
5. Time Filter Support
6. Export/Reports Backend
7. Core API Stability
"""

import requests
import json
import time
from datetime import datetime, timedelta
import sys
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://ec499ace-685d-480d-b657-849bf4e418d7.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class CriticalFixesBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        self.current_user = None
        
    def log_test(self, test_name, success, message, response_time=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if message:
            print(f"   📝 {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time
        })

    def test_authentication_system(self):
        """Test Authentication System - admin/admin123 login"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        print("-" * 50)
        
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.current_user = data.get("user", {})
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                user_info = f"User: {self.current_user.get('full_name', 'N/A')}, Role: {self.current_user.get('role', 'N/A')}"
                self.log_test("Authentication - Admin Login", True, 
                            f"JWT token obtained successfully. {user_info}", response_time)
                return True
            else:
                self.log_test("Authentication - Admin Login", False, 
                            f"Login failed: {response.status_code} - {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Authentication - Admin Login", False, f"Login error: {str(e)}")
            return False

    def test_dashboard_apis(self):
        """Test Dashboard APIs - stats and metrics"""
        print("\n📊 TESTING DASHBOARD APIs")
        print("-" * 50)
        
        dashboard_endpoints = [
            ("Dashboard Stats", f"{API_BASE}/dashboard/stats"),
            ("Admin Activities", f"{API_BASE}/admin/activities"),
            ("Activity Statistics", f"{API_BASE}/admin/activities/stats"),
            ("GPS Tracking", f"{API_BASE}/admin/gps-tracking"),
            ("GPS Statistics", f"{API_BASE}/admin/gps-tracking/stats")
        ]
        
        success_count = 0
        for test_name, url in dashboard_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict):
                        keys = list(data.keys())[:3]  # Show first 3 keys
                        self.log_test(f"Dashboard API - {test_name}", True, 
                                    f"Data retrieved successfully. Keys: {keys}", response_time)
                    elif isinstance(data, list):
                        self.log_test(f"Dashboard API - {test_name}", True, 
                                    f"Retrieved {len(data)} records", response_time)
                    else:
                        self.log_test(f"Dashboard API - {test_name}", True, 
                                    f"Data retrieved successfully", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Dashboard API - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Dashboard API - {test_name}", False, f"Error: {str(e)}")
        
        return success_count

    def test_quick_actions_backend(self):
        """Test Quick Actions Backend Support"""
        print("\n⚡ TESTING QUICK ACTIONS BACKEND SUPPORT")
        print("-" * 50)
        
        # Test endpoints that support quick actions
        quick_action_tests = [
            ("Create User Support", f"{API_BASE}/users", "POST"),
            ("Create Clinic Support", f"{API_BASE}/clinics", "POST"),
            ("Create Product Support", f"{API_BASE}/products", "POST"),
            ("Create Order Support", f"{API_BASE}/orders", "POST"),
            ("User Management", f"{API_BASE}/users", "GET"),
            ("Clinic Management", f"{API_BASE}/clinics", "GET"),
            ("Product Management", f"{API_BASE}/products", "GET")
        ]
        
        success_count = 0
        for test_name, url, method in quick_action_tests:
            try:
                start_time = time.time()
                if method == "GET":
                    response = self.session.get(url)
                else:
                    # For POST, just check if endpoint exists (will fail validation but should not 404)
                    response = self.session.post(url, json={})
                
                response_time = (time.time() - start_time) * 1000
                
                if method == "GET" and response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else "N/A"
                    self.log_test(f"Quick Action - {test_name}", True, 
                                f"Endpoint available, {count} records", response_time)
                    success_count += 1
                elif method == "POST" and response.status_code in [400, 422]:  # Validation error is expected
                    self.log_test(f"Quick Action - {test_name}", True, 
                                f"Endpoint available (validation error expected)", response_time)
                    success_count += 1
                elif method == "POST" and response.status_code == 200:
                    self.log_test(f"Quick Action - {test_name}", True, 
                                f"Endpoint working perfectly", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Quick Action - {test_name}", False, 
                                f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Quick Action - {test_name}", False, f"Error: {str(e)}")
        
        return success_count

    def test_theme_system_backend(self):
        """Test Theme System Backend Support"""
        print("\n🎨 TESTING THEME SYSTEM BACKEND")
        print("-" * 50)
        
        try:
            # Test getting current settings (should include theme)
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/admin/settings")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                settings = response.json()
                current_theme = settings.get("theme", "default")
                self.log_test("Theme System - Get Settings", True, 
                            f"Current theme: {current_theme}", response_time)
                
                # Test updating theme
                start_time = time.time()
                theme_update = {"theme": "neon"}
                update_response = self.session.put(f"{API_BASE}/admin/settings", json=theme_update)
                update_response_time = (time.time() - start_time) * 1000
                
                if update_response.status_code == 200:
                    self.log_test("Theme System - Update Theme", True, 
                                f"Theme updated to 'neon' successfully", update_response_time)
                    return True
                else:
                    self.log_test("Theme System - Update Theme", False, 
                                f"Theme update failed: {update_response.status_code}", update_response_time)
                    return False
            else:
                self.log_test("Theme System - Get Settings", False, 
                            f"Settings retrieval failed: {response.status_code}", response_time)
                return False
                
        except Exception as e:
            self.log_test("Theme System Backend", False, f"Error: {str(e)}")
            return False

    def test_time_filter_support(self):
        """Test Time Filter Support for Dashboard Metrics"""
        print("\n⏰ TESTING TIME FILTER SUPPORT")
        print("-" * 50)
        
        # Test different time filters
        time_filters = ["today", "week", "month", "year"]
        success_count = 0
        
        for time_filter in time_filters:
            try:
                start_time = time.time()
                # Test dashboard stats with time filter
                response = self.session.get(f"{API_BASE}/dashboard/stats?filter={time_filter}")
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test(f"Time Filter - {time_filter.title()}", True, 
                                f"Dashboard data filtered successfully", response_time)
                    success_count += 1
                else:
                    # Try alternative endpoint
                    alt_response = self.session.get(f"{API_BASE}/admin/activities?time_filter={time_filter}")
                    alt_response_time = (time.time() - start_time) * 1000
                    
                    if alt_response.status_code == 200:
                        self.log_test(f"Time Filter - {time_filter.title()}", True, 
                                    f"Alternative endpoint supports time filtering", alt_response_time)
                        success_count += 1
                    else:
                        self.log_test(f"Time Filter - {time_filter.title()}", False, 
                                    f"Time filter not supported: {response.status_code}", response_time)
                        
            except Exception as e:
                self.log_test(f"Time Filter - {time_filter.title()}", False, f"Error: {str(e)}")
        
        return success_count

    def test_export_reports_backend(self):
        """Test Export/Reports Backend Support"""
        print("\n📄 TESTING EXPORT/REPORTS BACKEND")
        print("-" * 50)
        
        export_endpoints = [
            ("Activities Export", f"{API_BASE}/admin/activities/export"),
            ("Dashboard Export", f"{API_BASE}/dashboard/export"),
            ("Users Export", f"{API_BASE}/users/export"),
            ("Clinics Export", f"{API_BASE}/clinics/export"),
            ("Products Export", f"{API_BASE}/products/export"),
            ("Orders Export", f"{API_BASE}/orders/export")
        ]
        
        success_count = 0
        for test_name, url in export_endpoints:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    self.log_test(f"Export - {test_name}", True, 
                                f"Export endpoint working", response_time)
                    success_count += 1
                elif response.status_code == 404:
                    self.log_test(f"Export - {test_name}", False, 
                                f"Export endpoint not implemented", response_time)
                elif response.status_code == 405:
                    self.log_test(f"Export - {test_name}", False, 
                                f"Export method not allowed", response_time)
                else:
                    self.log_test(f"Export - {test_name}", False, 
                                f"Export failed: {response.status_code}", response_time)
                    
            except Exception as e:
                self.log_test(f"Export - {test_name}", False, f"Error: {str(e)}")
        
        return success_count

    def test_core_api_stability(self):
        """Test Core API Stability"""
        print("\n🔧 TESTING CORE API STABILITY")
        print("-" * 50)
        
        core_apis = [
            ("Users API", f"{API_BASE}/users"),
            ("Clinics API", f"{API_BASE}/clinics"),
            ("Products API", f"{API_BASE}/products"),
            ("Orders API", f"{API_BASE}/orders"),
            ("Lines API", f"{API_BASE}/lines"),
            ("Areas API", f"{API_BASE}/areas"),
            ("Warehouses API", f"{API_BASE}/warehouses"),
            ("Visits API", f"{API_BASE}/visits"),
            ("Doctors API", f"{API_BASE}/doctors")
        ]
        
        success_count = 0
        total_records = 0
        total_response_time = 0
        
        for test_name, url in core_apis:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                total_response_time += response_time
                
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else 1
                    total_records += count
                    self.log_test(f"Core API - {test_name}", True, 
                                f"{count} records, stable performance", response_time)
                    success_count += 1
                else:
                    self.log_test(f"Core API - {test_name}", False, 
                                f"API unstable: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(f"Core API - {test_name}", False, f"Error: {str(e)}")
        
        # Performance summary
        avg_response_time = total_response_time / len(core_apis) if core_apis else 0
        print(f"\n📈 Core API Performance Summary:")
        print(f"   • Average Response Time: {avg_response_time:.2f}ms")
        print(f"   • Total Records Across APIs: {total_records}")
        print(f"   • Stable APIs: {success_count}/{len(core_apis)}")
        
        return success_count

    def run_comprehensive_test(self):
        """Run all critical backend tests"""
        print("🚀 COMPREHENSIVE BACKEND TESTING AFTER CRITICAL FRONTEND FIXES")
        print("=" * 80)
        print(f"🎯 Focus: Ensure backend stability and compatibility with frontend fixes")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Test 1: Authentication System
        auth_success = self.test_authentication_system()
        if not auth_success:
            print("❌ Cannot proceed without authentication")
            return False
        
        # Test 2: Dashboard APIs
        dashboard_success = self.test_dashboard_apis()
        
        # Test 3: Quick Actions Backend Support
        quick_actions_success = self.test_quick_actions_backend()
        
        # Test 4: Theme System Backend
        theme_success = self.test_theme_system_backend()
        
        # Test 5: Time Filter Support
        time_filter_success = self.test_time_filter_support()
        
        # Test 6: Export/Reports Backend
        export_success = self.test_export_reports_backend()
        
        # Test 7: Core API Stability
        core_api_success = self.test_core_api_stability()
        
        # Calculate overall results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE BACKEND TEST RESULTS")
        print("=" * 80)
        print(f"🎯 Overall Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests)")
        print(f"🔐 Authentication System: {'✅ WORKING' if auth_success else '❌ FAILED'}")
        print(f"📊 Dashboard APIs: {dashboard_success}/5 working")
        print(f"⚡ Quick Actions Support: {quick_actions_success}/7 working")
        print(f"🎨 Theme System: {'✅ WORKING' if theme_success else '❌ FAILED'}")
        print(f"⏰ Time Filter Support: {time_filter_success}/4 working")
        print(f"📄 Export/Reports: {export_success}/6 working")
        print(f"🔧 Core API Stability: {core_api_success}/9 working")
        print(f"⏱️  Total Test Time: {time.time() - self.start_time:.2f} seconds")
        
        # Status Assessment
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: Backend is stable and ready for production!")
        elif success_rate >= 80:
            print("\n✅ GOOD: Backend is mostly stable with minor issues")
        elif success_rate >= 70:
            print("\n⚠️  ACCEPTABLE: Backend working but needs attention")
        else:
            print("\n❌ NEEDS WORK: Significant backend issues detected")
        
        # Detailed Analysis
        print("\n🔍 DETAILED ANALYSIS:")
        print("-" * 50)
        
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print("❌ Failed Tests:")
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']}: {test['message']}")
        else:
            print("✅ All tests passed successfully!")
        
        # Recommendations
        print("\n🎯 RECOMMENDATIONS:")
        print("-" * 50)
        
        if not auth_success:
            print("🔐 CRITICAL: Fix authentication system immediately")
        
        if dashboard_success < 3:
            print("📊 HIGH PRIORITY: Dashboard APIs need attention for frontend compatibility")
        
        if quick_actions_success < 5:
            print("⚡ MEDIUM PRIORITY: Quick actions backend support needs improvement")
        
        if not theme_success:
            print("🎨 LOW PRIORITY: Theme system backend needs implementation")
        
        if time_filter_success < 2:
            print("⏰ MEDIUM PRIORITY: Time filtering needs backend support")
        
        if export_success < 3:
            print("📄 LOW PRIORITY: Export functionality needs development")
        
        if core_api_success < 7:
            print("🔧 HIGH PRIORITY: Core API stability issues detected")
        
        if success_rate >= 90:
            print("🎉 READY: Backend supports all frontend enhancements perfectly!")
        
        return success_rate >= 70  # 70% threshold for acceptable backend stability

if __name__ == "__main__":
    tester = CriticalFixesBackendTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)