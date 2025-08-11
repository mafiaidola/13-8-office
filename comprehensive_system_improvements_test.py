#!/usr/bin/env python3
"""
Comprehensive System Testing After All Improvements Applied
اختبار شامل للنظام بعد تطبيق جميع التحسينات الشاملة

Testing Focus Areas:
1. Basic System Health - صحة النظام الأساسية
2. Updated Financial System - النظام المالي المحدث  
3. Enhanced Visits System - نظام الزيارات المحسن
4. New Integration Features - ميزات التكامل الجديدة
5. Activity Tracking System - نظام تتبع الأنشطة

Goal: Ensure 95%+ efficiency for all APIs
الهدف: ضمان كفاءة 95%+ لجميع APIs
"""

import requests
import json
import time
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://4a9f720a-2892-4a4a-8a02-0abb64f3fd62.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class ComprehensiveSystemImprovementsTest:
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
    
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with timing"""
        start_time = time.time()
        try:
            url = f"{BASE_URL}{endpoint}"
            if headers is None:
                headers = {}
            if self.jwt_token:
                headers["Authorization"] = f"Bearer {self.jwt_token}"
            
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            response_time = (time.time() - start_time) * 1000
            return response, response_time
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return None, response_time
    
    def test_authentication_system(self):
        """Test 1: Authentication System - نظام المصادقة"""
        print("\n🔐 Testing Authentication System...")
        
        response, response_time = self.make_request("POST", "/auth/login", ADMIN_CREDENTIALS)
        
        if response and response.status_code == 200:
            data = response.json()
            self.jwt_token = data.get("access_token")
            user_info = data.get("user", {})
            
            details = f"User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
            self.log_test("Admin Login (admin/admin123)", True, response_time, details)
            return True
        else:
            error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
            self.log_test("Admin Login (admin/admin123)", False, response_time, error_msg)
            return False
    
    def test_core_apis(self):
        """Test 2: Core APIs - APIs النظام الأساسية"""
        print("\n🏗️ Testing Core System APIs...")
        
        core_endpoints = [
            ("/users", "Users Management"),
            ("/clinics", "Clinics Management"), 
            ("/products", "Products Management"),
            ("/health", "Health Check"),
            ("/dashboard/stats/admin", "Admin Dashboard Stats")
        ]
        
        success_count = 0
        for endpoint, name in core_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"{len(data)} items"
                elif isinstance(data, dict):
                    details = f"{len(data)} fields"
                else:
                    details = "Data available"
                
                self.log_test(f"Core API: {name}", True, response_time, details)
                success_count += 1
            else:
                error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
                self.log_test(f"Core API: {name}", False, response_time, error_msg)
        
        return success_count == len(core_endpoints)
    
    def test_financial_system_apis(self):
        """Test 3: Updated Financial System - النظام المالي المحدث"""
        print("\n💰 Testing Updated Financial System APIs...")
        
        financial_endpoints = [
            ("/invoices", "Invoices Management"),
            ("/invoices/statistics/overview", "Invoice Statistics"),
            ("/debts", "Debts Management"),
            ("/debts/statistics/overview", "Debt Statistics"),
            ("/payments", "Payments Management")
        ]
        
        success_count = 0
        for endpoint, name in financial_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"{len(data)} records"
                elif isinstance(data, dict):
                    if "total" in str(data).lower():
                        details = "Statistics available"
                    else:
                        details = f"{len(data)} fields"
                else:
                    details = "Data available"
                
                self.log_test(f"Financial API: {name}", True, response_time, details)
                success_count += 1
            else:
                error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
                self.log_test(f"Financial API: {name}", False, response_time, error_msg)
        
        return success_count >= 4  # Allow 1 failure for 80% success
    
    def test_enhanced_visits_system(self):
        """Test 4: Enhanced Visits System - نظام الزيارات المحسن"""
        print("\n🏥 Testing Enhanced Visits System...")
        
        visits_endpoints = [
            ("/visits/", "Visits List"),
            ("/visits/dashboard/overview", "Visits Dashboard Overview"),
            ("/visits/stats/representatives", "Representatives Statistics")
        ]
        
        success_count = 0
        for endpoint, name in visits_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, dict) and "visits" in data:
                    visits = data["visits"]
                    details = f"{len(visits)} visits"
                elif isinstance(data, dict) and "success" in data:
                    details = "Dashboard data available"
                elif isinstance(data, list):
                    details = f"{len(data)} items"
                else:
                    details = "Data available"
                
                self.log_test(f"Visits API: {name}", True, response_time, details)
                success_count += 1
            else:
                error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
                self.log_test(f"Visits API: {name}", False, response_time, error_msg)
        
        return success_count >= 2  # Allow 1 failure for 67% success
    
    def test_activity_tracking_system(self):
        """Test 5: Activity Tracking System - نظام تتبع الأنشطة"""
        print("\n📊 Testing Enhanced Activity Tracking System...")
        
        activity_endpoints = [
            ("/activities", "Activities List"),
            ("/activities?activity_type=login", "Login Activities"),
            ("/activities?time_filter=today", "Today's Activities"),
            ("/activities?limit=10", "Limited Activities")
        ]
        
        success_count = 0
        for endpoint, name in activity_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"{len(data)} activities"
                elif isinstance(data, dict) and "activities" in data:
                    activities = data["activities"]
                    details = f"{len(activities)} activities"
                else:
                    details = "Activity data available"
                
                self.log_test(f"Activity API: {name}", True, response_time, details)
                success_count += 1
            else:
                error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
                self.log_test(f"Activity API: {name}", False, response_time, error_msg)
        
        return success_count >= 3  # Allow 1 failure for 75% success
    
    def test_new_integration_features(self):
        """Test 6: New Integration Features - ميزات التكامل الجديدة"""
        print("\n🔗 Testing New Integration Features...")
        
        integration_endpoints = [
            ("/lines", "Lines Management"),
            ("/areas", "Areas Management"),
            ("/dashboard/widgets/admin", "Dashboard Widgets"),
            ("/clinics", "Enhanced Clinic Integration")
        ]
        
        success_count = 0
        for endpoint, name in integration_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    details = f"{len(data)} items"
                elif isinstance(data, dict):
                    details = f"{len(data)} fields"
                else:
                    details = "Integration data available"
                
                self.log_test(f"Integration API: {name}", True, response_time, details)
                success_count += 1
            else:
                error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
                self.log_test(f"Integration API: {name}", False, response_time, error_msg)
        
        return success_count >= 3  # Allow 1 failure for 75% success
    
    def test_database_connectivity(self):
        """Test 7: Database Connectivity - اتصال قاعدة البيانات"""
        print("\n🗄️ Testing Database Connectivity...")
        
        # Test health endpoint for database status
        response, response_time = self.make_request("GET", "/health")
        
        if response and response.status_code == 200:
            data = response.json()
            db_status = data.get("database", "unknown")
            statistics = data.get("statistics", {})
            
            if db_status == "connected":
                details = f"DB Connected - Users: {statistics.get('users', 0)}, Clinics: {statistics.get('clinics', 0)}"
                self.log_test("Database Connectivity", True, response_time, details)
                return True
            else:
                self.log_test("Database Connectivity", False, response_time, f"DB Status: {db_status}")
                return False
        else:
            error_msg = f"HTTP {response.status_code if response else 'Connection Error'}"
            self.log_test("Database Connectivity", False, response_time, error_msg)
            return False
    
    def run_comprehensive_test(self):
        """Run all comprehensive system tests"""
        print("🚀 Starting Comprehensive System Improvements Testing...")
        print("=" * 80)
        
        # Test sequence
        test_results = []
        
        # 1. Authentication System
        auth_success = self.test_authentication_system()
        test_results.append(("Authentication System", auth_success))
        
        if not auth_success:
            print("❌ Authentication failed - cannot proceed with other tests")
            return self.generate_report(test_results)
        
        # 2. Core APIs
        core_success = self.test_core_apis()
        test_results.append(("Core System APIs", core_success))
        
        # 3. Financial System
        financial_success = self.test_financial_system_apis()
        test_results.append(("Updated Financial System", financial_success))
        
        # 4. Enhanced Visits System
        visits_success = self.test_enhanced_visits_system()
        test_results.append(("Enhanced Visits System", visits_success))
        
        # 5. Activity Tracking System
        activity_success = self.test_activity_tracking_system()
        test_results.append(("Activity Tracking System", activity_success))
        
        # 6. New Integration Features
        integration_success = self.test_new_integration_features()
        test_results.append(("New Integration Features", integration_success))
        
        # 7. Database Connectivity
        db_success = self.test_database_connectivity()
        test_results.append(("Database Connectivity", db_success))
        
        return self.generate_report(test_results)
    
    def generate_report(self, test_results):
        """Generate comprehensive test report"""
        total_time = time.time() - self.start_time
        successful_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result["response_time"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE SYSTEM IMPROVEMENTS TEST RESULTS")
        print("=" * 80)
        
        # Overall Results
        print(f"🎯 **Overall Success Rate:** {success_rate:.1f}% ({successful_tests}/{total_tests} tests passed)")
        print(f"⏱️ **Average Response Time:** {avg_response_time:.2f}ms")
        print(f"🕐 **Total Execution Time:** {total_time:.2f}s")
        
        # Category Results
        print(f"\n📋 **Category Results:**")
        for category, success in test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"   {status} {category}")
        
        # Detailed Results
        print(f"\n🔍 **Detailed Test Results:**")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}: {result['response_time']:.2f}ms - {result['details']}")
        
        # Performance Assessment
        print(f"\n🏆 **Performance Assessment:**")
        if success_rate >= 95:
            print("   🟢 EXCELLENT - System exceeds 95% efficiency target!")
        elif success_rate >= 90:
            print("   🟡 GOOD - System meets 90%+ efficiency requirement")
        elif success_rate >= 80:
            print("   🟠 ACCEPTABLE - System needs minor improvements")
        else:
            print("   🔴 NEEDS ATTENTION - System requires significant fixes")
        
        # Response Time Assessment
        if avg_response_time <= 50:
            print("   🚀 FAST - Excellent response times")
        elif avg_response_time <= 100:
            print("   ⚡ GOOD - Acceptable response times")
        else:
            print("   🐌 SLOW - Response times need optimization")
        
        print("=" * 80)
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "avg_response_time": avg_response_time,
            "total_time": total_time,
            "category_results": test_results,
            "detailed_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = ComprehensiveSystemImprovementsTest()
    results = tester.run_comprehensive_test()
    
    # Final Assessment
    print(f"\n🎯 **FINAL ASSESSMENT:**")
    if results["success_rate"] >= 95:
        print("✅ **SYSTEM STATUS:** All improvements successfully applied - System ready for production!")
        print("🏆 **RECOMMENDATION:** System exceeds efficiency targets - No immediate action required")
    elif results["success_rate"] >= 90:
        print("✅ **SYSTEM STATUS:** System improvements largely successful - Minor issues detected")
        print("🔧 **RECOMMENDATION:** Address minor issues for optimal performance")
    else:
        print("⚠️ **SYSTEM STATUS:** System improvements need attention - Some critical issues detected")
        print("🚨 **RECOMMENDATION:** Review and fix failing components before production deployment")
    
    return results

if __name__ == "__main__":
    main()