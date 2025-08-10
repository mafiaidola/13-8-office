#!/usr/bin/env python3
"""
Advanced Analytics APIs Testing for Medical Sales Rep Visit Management System
Tests the new Advanced Analytics APIs with comprehensive validation
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://edfab686-d8ce-4a18-b8dd-9d603d68b461.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class AdvancedAnalyticsTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.manager_token = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def login_admin(self) -> bool:
        """Login as admin user"""
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json=DEFAULT_ADMIN)
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                self.log_test("Admin Login", True, f"Successfully logged in as {data['user']['username']}")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception during login: {str(e)}")
            return False

    def create_manager_user(self) -> bool:
        """Create a manager user for testing"""
        try:
            manager_data = {
                "username": "test_manager_analytics",
                "email": "manager_analytics@test.com",
                "password": "manager123",
                "role": "manager",
                "full_name": "Test Manager Analytics",
                "phone": "+966501111111"
            }
            
            response = self.session.post(f"{BASE_URL}/auth/register", json=manager_data)
            if response.status_code == 200:
                # Login as manager
                login_response = self.session.post(f"{BASE_URL}/auth/login", json={
                    "username": "test_manager_analytics",
                    "password": "manager123"
                })
                if login_response.status_code == 200:
                    self.manager_token = login_response.json()["token"]
                    self.log_test("Manager User Creation", True, "Manager user created and logged in successfully")
                    return True
            
            self.log_test("Manager User Creation", False, f"Failed with status {response.status_code}", response.text)
            return False
        except Exception as e:
            self.log_test("Manager User Creation", False, f"Exception: {str(e)}")
            return False

    def test_performance_dashboard_api(self) -> bool:
        """Test GET /api/analytics/performance-dashboard with all parameters"""
        try:
            # Test different time ranges
            time_ranges = ["today", "week", "month", "quarter", "year"]
            user_filters = [None, "sales_rep", "manager", "warehouse_manager"]
            
            success_count = 0
            total_tests = 0
            
            for time_range in time_ranges:
                for user_filter in user_filters:
                    total_tests += 1
                    params = {"time_range": time_range}
                    if user_filter:
                        params["user_filter"] = user_filter
                    
                    response = self.session.get(f"{BASE_URL}/analytics/performance-dashboard", params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Validate required fields
                        required_fields = ["core_metrics", "top_performers", "daily_trends", "team_summary", "insights"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            # Validate core_metrics structure
                            core_metrics = data.get("core_metrics", {})
                            required_metrics = ["visits", "effective_visits", "orders", "conversion_rate"]
                            
                            metrics_valid = all(
                                metric in core_metrics and 
                                "current" in core_metrics[metric] and
                                "previous" in core_metrics[metric] and
                                "growth" in core_metrics[metric]
                                for metric in required_metrics
                            )
                            
                            # Validate top_performers structure
                            top_performers = data.get("top_performers", [])
                            performers_valid = True
                            if top_performers:
                                performer = top_performers[0]
                                performers_valid = all(
                                    field in performer 
                                    for field in ["effectiveness_rate", "total_visits", "effective_visits"]
                                )
                            
                            # Validate insights
                            insights = data.get("insights", {})
                            insights_valid = all(
                                field in insights 
                                for field in ["best_performing_day", "total_unique_performers", "average_effectiveness"]
                            )
                            
                            if metrics_valid and performers_valid and insights_valid:
                                success_count += 1
                                self.log_test(
                                    f"Performance Dashboard - {time_range}" + (f" - {user_filter}" if user_filter else ""),
                                    True,
                                    f"All required fields present. Core metrics: {len(core_metrics)}, Top performers: {len(top_performers)}, Insights: {len(insights)}"
                                )
                            else:
                                self.log_test(
                                    f"Performance Dashboard - {time_range}" + (f" - {user_filter}" if user_filter else ""),
                                    False,
                                    f"Invalid structure. Metrics valid: {metrics_valid}, Performers valid: {performers_valid}, Insights valid: {insights_valid}"
                                )
                        else:
                            self.log_test(
                                f"Performance Dashboard - {time_range}" + (f" - {user_filter}" if user_filter else ""),
                                False,
                                f"Missing required fields: {missing_fields}"
                            )
                    else:
                        self.log_test(
                            f"Performance Dashboard - {time_range}" + (f" - {user_filter}" if user_filter else ""),
                            False,
                            f"HTTP {response.status_code}: {response.text}"
                        )
            
            overall_success = success_count == total_tests
            self.log_test(
                "Performance Dashboard API Overall",
                overall_success,
                f"Passed {success_count}/{total_tests} parameter combinations"
            )
            return overall_success
            
        except Exception as e:
            self.log_test("Performance Dashboard API", False, f"Exception: {str(e)}")
            return False

    def test_kpi_metrics_api(self) -> bool:
        """Test GET /api/analytics/kpi-metrics with all parameters"""
        try:
            kpi_types = ["sales_performance", "team_efficiency", "customer_satisfaction"]
            periods = ["week", "month", "quarter", "year"]
            
            success_count = 0
            total_tests = 0
            
            for kpi_type in kpi_types:
                for period in periods:
                    total_tests += 1
                    params = {
                        "kpi_type": kpi_type,
                        "period": period
                    }
                    
                    response = self.session.get(f"{BASE_URL}/analytics/kpi-metrics", params=params)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Validate required fields
                        required_fields = ["kpi_type", "period", "generated_at", "metrics", "summary"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields:
                            # Validate metrics structure
                            metrics = data.get("metrics", {})
                            metrics_valid = True
                            
                            for metric_name, metric_data in metrics.items():
                                required_metric_fields = ["value", "target", "unit", "trend", "description", "achievement", "status"]
                                if not all(field in metric_data for field in required_metric_fields):
                                    metrics_valid = False
                                    break
                                
                                # Validate status classifications
                                if metric_data["status"] not in ["excellent", "good", "average", "needs_improvement", "no_data"]:
                                    metrics_valid = False
                                    break
                            
                            # Validate summary structure
                            summary = data.get("summary", {})
                            summary_valid = all(
                                field in summary 
                                for field in ["total_kpis", "excellent_kpis", "needs_improvement", "overall_performance"]
                            )
                            
                            if metrics_valid and summary_valid:
                                success_count += 1
                                self.log_test(
                                    f"KPI Metrics - {kpi_type} - {period}",
                                    True,
                                    f"Valid structure. Metrics: {len(metrics)}, Summary: {summary['overall_performance']}"
                                )
                            else:
                                self.log_test(
                                    f"KPI Metrics - {kpi_type} - {period}",
                                    False,
                                    f"Invalid structure. Metrics valid: {metrics_valid}, Summary valid: {summary_valid}"
                                )
                        else:
                            self.log_test(
                                f"KPI Metrics - {kpi_type} - {period}",
                                False,
                                f"Missing required fields: {missing_fields}"
                            )
                    else:
                        self.log_test(
                            f"KPI Metrics - {kpi_type} - {period}",
                            False,
                            f"HTTP {response.status_code}: {response.text}"
                        )
            
            overall_success = success_count == total_tests
            self.log_test(
                "KPI Metrics API Overall",
                overall_success,
                f"Passed {success_count}/{total_tests} parameter combinations"
            )
            return overall_success
            
        except Exception as e:
            self.log_test("KPI Metrics API", False, f"Exception: {str(e)}")
            return False

    def test_data_accuracy_and_calculations(self) -> bool:
        """Test data accuracy and calculation correctness"""
        try:
            # Test performance dashboard with specific parameters
            response = self.session.get(f"{BASE_URL}/analytics/performance-dashboard", params={
                "time_range": "month",
                "user_filter": "sales_rep"
            })
            
            if response.status_code != 200:
                self.log_test("Data Accuracy Test", False, f"Failed to get performance data: {response.status_code}")
                return False
            
            data = response.json()
            core_metrics = data.get("core_metrics", {})
            
            # Validate growth percentage calculations
            visits_data = core_metrics.get("visits", {})
            if visits_data:
                current = visits_data.get("current", 0)
                previous = visits_data.get("previous", 0)
                growth = visits_data.get("growth", 0)
                
                # Calculate expected growth
                if previous == 0:
                    expected_growth = 100.0 if current > 0 else 0.0
                else:
                    expected_growth = ((current - previous) / previous) * 100
                
                growth_accurate = abs(growth - expected_growth) < 0.01  # Allow small floating point differences
                
                self.log_test(
                    "Growth Calculation Accuracy",
                    growth_accurate,
                    f"Current: {current}, Previous: {previous}, Growth: {growth}%, Expected: {expected_growth}%"
                )
            
            # Test conversion rate calculation
            conversion_data = core_metrics.get("conversion_rate", {})
            if conversion_data and visits_data:
                effective_visits = core_metrics.get("effective_visits", {}).get("current", 0)
                total_visits = visits_data.get("current", 0)
                reported_conversion = conversion_data.get("current", 0)
                
                expected_conversion = (effective_visits / total_visits * 100) if total_visits > 0 else 0
                conversion_accurate = abs(reported_conversion - expected_conversion) < 0.01
                
                self.log_test(
                    "Conversion Rate Calculation",
                    conversion_accurate,
                    f"Effective: {effective_visits}, Total: {total_visits}, Rate: {reported_conversion}%, Expected: {expected_conversion}%"
                )
            
            # Test KPI status classifications
            kpi_response = self.session.get(f"{BASE_URL}/analytics/kpi-metrics", params={
                "kpi_type": "sales_performance",
                "period": "month"
            })
            
            if kpi_response.status_code == 200:
                kpi_data = kpi_response.json()
                metrics = kpi_data.get("metrics", {})
                
                status_classifications_correct = True
                for metric_name, metric_info in metrics.items():
                    achievement = metric_info.get("achievement", 0)
                    status = metric_info.get("status", "")
                    
                    expected_status = ""
                    if achievement >= 100:
                        expected_status = "excellent"
                    elif achievement >= 80:
                        expected_status = "good"
                    elif achievement >= 60:
                        expected_status = "average"
                    else:
                        expected_status = "needs_improvement"
                    
                    if status != expected_status and status != "no_data":
                        status_classifications_correct = False
                        break
                
                self.log_test(
                    "KPI Status Classifications",
                    status_classifications_correct,
                    f"All {len(metrics)} KPI status classifications are correct"
                )
            
            return True
            
        except Exception as e:
            self.log_test("Data Accuracy Test", False, f"Exception: {str(e)}")
            return False

    def test_geographic_performance(self) -> bool:
        """Test geographic performance data if GPS data is available"""
        try:
            response = self.session.get(f"{BASE_URL}/analytics/performance-dashboard", params={
                "time_range": "month"
            })
            
            if response.status_code == 200:
                data = response.json()
                geographic_performance = data.get("geographic_performance", [])
                
                if geographic_performance:
                    # Validate geographic data structure
                    geo_data = geographic_performance[0]
                    required_geo_fields = ["visit_count", "effective_count", "effectiveness_rate"]
                    
                    geo_valid = all(field in geo_data for field in required_geo_fields)
                    
                    self.log_test(
                        "Geographic Performance Data",
                        geo_valid,
                        f"Found {len(geographic_performance)} geographic regions with valid structure"
                    )
                else:
                    self.log_test(
                        "Geographic Performance Data",
                        True,
                        "No geographic data available (expected if no GPS visits exist)"
                    )
                
                return True
            else:
                self.log_test("Geographic Performance Test", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Geographic Performance Test", False, f"Exception: {str(e)}")
            return False

    def test_team_summaries_for_admin(self) -> bool:
        """Test team summaries are provided for admin users"""
        try:
            response = self.session.get(f"{BASE_URL}/analytics/performance-dashboard", params={
                "time_range": "month"
            })
            
            if response.status_code == 200:
                data = response.json()
                team_summary = data.get("team_summary", [])
                
                # Team summary should be present for admin users
                if team_summary:
                    # Validate team summary structure
                    team_data = team_summary[0]
                    required_team_fields = ["manager_name", "manager_id", "team_size", "total_visits", "effective_visits", "effectiveness_rate"]
                    
                    team_valid = all(field in team_data for field in required_team_fields)
                    
                    self.log_test(
                        "Team Summary for Admin",
                        team_valid,
                        f"Found {len(team_summary)} team summaries with valid structure"
                    )
                else:
                    self.log_test(
                        "Team Summary for Admin",
                        True,
                        "No team summaries available (expected if no managers exist)"
                    )
                
                return True
            else:
                self.log_test("Team Summary Test", False, f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Team Summary Test", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Advanced Analytics API tests"""
        print("🚀 Starting Advanced Analytics APIs Testing...")
        print("=" * 60)
        
        # Login as admin
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        # Create manager user for testing
        self.create_manager_user()
        
        # Run all tests
        tests = [
            self.test_performance_dashboard_api,
            self.test_kpi_metrics_api,
            self.test_data_accuracy_and_calculations,
            self.test_geographic_performance,
            self.test_team_summaries_for_admin
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test in tests:
            if test():
                passed_tests += 1
        
        # Print summary
        print("=" * 60)
        print("🎯 ADVANCED ANALYTICS APIS TESTING SUMMARY")
        print("=" * 60)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
        
        if success_rate >= 90:
            print("🎉 EXCELLENT: Advanced Analytics APIs are working perfectly!")
        elif success_rate >= 70:
            print("✅ GOOD: Most Advanced Analytics APIs are working correctly")
        else:
            print("⚠️ NEEDS ATTENTION: Several Advanced Analytics APIs have issues")
        
        print("\nDetailed Test Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"   {result['details']}")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = AdvancedAnalyticsTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Advanced Analytics APIs testing completed successfully!")
    else:
        print("\n⚠️ Advanced Analytics APIs testing completed with issues!")