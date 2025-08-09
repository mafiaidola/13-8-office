#!/usr/bin/env python3
"""
Quick comprehensive test for updated dashboard system
Arabic Review: اختبار شامل سريع للتأكد من أن نظام لوحة التحكم المحدث يعمل بشكل صحيح مع التحسينات الجديدة
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class DashboardSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """Log test results"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {response_time:.2f}ms - {details}")
    
    def test_admin_login(self):
        """Test admin login with admin/admin123"""
        start_time = time.time()
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                
                user_info = data.get("user", {})
                details = f"User: {user_info.get('full_name')}, Role: {user_info.get('role')}"
                self.log_test("Admin Login (admin/admin123)", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, response_time, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Admin Login (admin/admin123)", False, response_time, f"Error: {str(e)}")
            return False
    
    def test_dashboard_stats_admin(self):
        """Test GET /api/dashboard/stats/admin - Admin statistics"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/stats/admin")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for essential admin statistics
                required_fields = ["total_users", "total_clinics", "total_products", "user_role", "dashboard_type"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    stats_summary = f"Users: {data.get('total_users')}, Clinics: {data.get('total_clinics')}, Products: {data.get('total_products')}"
                    self.log_test("Dashboard Stats Admin", True, response_time, stats_summary)
                    return data
                else:
                    self.log_test("Dashboard Stats Admin", False, response_time, f"Missing fields: {missing_fields}")
                    return None
            else:
                self.log_test("Dashboard Stats Admin", False, response_time, f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Dashboard Stats Admin", False, response_time, f"Error: {str(e)}")
            return None
    
    def test_dashboard_widgets_admin(self):
        """Test GET /api/dashboard/widgets/admin - Admin widgets"""
        start_time = time.time()
        try:
            response = self.session.get(f"{API_BASE}/dashboard/widgets/admin")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    # Check widget structure
                    widget_count = len(data)
                    valid_widgets = 0
                    
                    for widget in data:
                        if all(key in widget for key in ["id", "title", "type", "size"]):
                            valid_widgets += 1
                    
                    details = f"{widget_count} widgets, {valid_widgets} valid"
                    success = valid_widgets == widget_count
                    self.log_test("Dashboard Widgets Admin", success, response_time, details)
                    return data
                else:
                    self.log_test("Dashboard Widgets Admin", False, response_time, "Empty or invalid widget list")
                    return None
            else:
                self.log_test("Dashboard Widgets Admin", False, response_time, f"HTTP {response.status_code}")
                return None
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Dashboard Widgets Admin", False, response_time, f"Error: {str(e)}")
            return None
    
    def test_data_consistency(self, stats_data, widgets_data):
        """Test data consistency between stats and widgets"""
        start_time = time.time()
        try:
            if not stats_data or not widgets_data:
                self.log_test("Data Consistency Check", False, 0, "Missing data for comparison")
                return False
            
            # Check if dashboard_type matches role
            dashboard_type = stats_data.get("dashboard_type")
            user_role = stats_data.get("user_role")
            
            # Check if widgets are appropriate for admin role
            admin_widget_ids = [w.get("id") for w in widgets_data if w.get("id")]
            expected_admin_widgets = ["system_overview", "user_management", "financial_summary"]
            
            has_expected_widgets = any(widget in admin_widget_ids for widget in expected_admin_widgets)
            
            response_time = (time.time() - start_time) * 1000
            
            if dashboard_type == "admin" and user_role == "admin" and has_expected_widgets:
                details = f"Dashboard type: {dashboard_type}, User role: {user_role}, Admin widgets: {len(admin_widget_ids)}"
                self.log_test("Data Consistency Check", True, response_time, details)
                return True
            else:
                details = f"Inconsistent data - Dashboard: {dashboard_type}, Role: {user_role}"
                self.log_test("Data Consistency Check", False, response_time, details)
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Data Consistency Check", False, response_time, f"Error: {str(e)}")
            return False
    
    def test_response_speed(self):
        """Test response speed for dashboard APIs"""
        start_time = time.time()
        try:
            # Test multiple quick requests to check performance
            speeds = []
            
            for i in range(3):
                req_start = time.time()
                response = self.session.get(f"{API_BASE}/dashboard/stats/admin")
                req_time = (time.time() - req_start) * 1000
                
                if response.status_code == 200:
                    speeds.append(req_time)
            
            if speeds:
                avg_speed = sum(speeds) / len(speeds)
                max_speed = max(speeds)
                min_speed = min(speeds)
                
                # Consider good if average response is under 100ms
                is_fast = avg_speed < 100
                
                details = f"Avg: {avg_speed:.2f}ms, Min: {min_speed:.2f}ms, Max: {max_speed:.2f}ms"
                self.log_test("Response Speed Test", is_fast, avg_speed, details)
                return is_fast
            else:
                self.log_test("Response Speed Test", False, 0, "No successful requests")
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test("Response Speed Test", False, response_time, f"Error: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all dashboard system tests"""
        print("🎯 **QUICK COMPREHENSIVE DASHBOARD SYSTEM TEST STARTING**")
        print("=" * 70)
        
        # Test 1: Admin Login
        if not self.test_admin_login():
            print("❌ Login failed - cannot continue with other tests")
            return self.generate_report()
        
        # Test 2: Dashboard Stats
        stats_data = self.test_dashboard_stats_admin()
        
        # Test 3: Dashboard Widgets  
        widgets_data = self.test_dashboard_widgets_admin()
        
        # Test 4: Data Consistency
        self.test_data_consistency(stats_data, widgets_data)
        
        # Test 5: Response Speed
        self.test_response_speed()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 70)
        print("🎯 **DASHBOARD SYSTEM TEST RESULTS**")
        print("=" * 70)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['response_time']:.2f}ms - {result['details']}")
        
        print("\n📊 **SUMMARY**")
        print(f"Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests passed)")
        print(f"Average Response Time: {avg_response_time:.2f}ms")
        print(f"Total Execution Time: {total_time:.2f}s")
        
        if success_rate >= 80:
            print("🎉 **DASHBOARD SYSTEM STATUS: EXCELLENT** - All core functionality working!")
        elif success_rate >= 60:
            print("⚠️ **DASHBOARD SYSTEM STATUS: GOOD** - Minor issues detected")
        else:
            print("❌ **DASHBOARD SYSTEM STATUS: NEEDS ATTENTION** - Critical issues found")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "test_results": self.test_results
        }

def main():
    """Main test execution"""
    print("🚀 Starting Quick Comprehensive Dashboard System Test")
    print("Arabic Review: اختبار شامل سريع لنظام لوحة التحكم المحدث")
    print("=" * 70)
    
    tester = DashboardSystemTester()
    results = tester.run_comprehensive_test()
    
    return results

if __name__ == "__main__":
    main()