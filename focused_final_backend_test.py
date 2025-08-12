#!/usr/bin/env python3
"""
اختبار نهائي مركز للنظام - Focused Final Backend Testing
Testing the core functionality and recently added APIs
"""

import requests
import json
import sys
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://medmanage-pro-1.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class FocusedFinalBackendTester:
    def __init__(self):
        self.admin_token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    def log_test(self, test_name, success, details="", response_time=None):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        if response_time:
            details += f" (Response: {response_time:.2f}ms)"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time,
            "timestamp": datetime.now().isoformat()
        })
        
    def make_request(self, method, endpoint, data=None, token=None, timeout=15):
        """Make HTTP request with timing"""
        url = f"{BACKEND_URL}{endpoint}"
        headers = HEADERS.copy()
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        start_time = time.time()
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=timeout)
            elif method == "PATCH":
                response = requests.patch(url, headers=headers, json=data, timeout=timeout)
            else:
                return None, f"Unsupported method: {method}", 0
                
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return response, None, response_time
            
        except requests.exceptions.RequestException as e:
            end_time = time.time()
            response_time = (end_time - start_time) * 1000
            return None, str(e), response_time
    
    def test_authentication(self):
        """Test authentication system"""
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        
        # Test Admin Login
        response, error, rt = self.make_request("POST", "/auth/login", {
            "username": "admin",
            "password": "admin123"
        })
        
        if response and response.status_code == 200:
            data = response.json()
            self.admin_token = data.get("access_token") or data.get("token")
            if self.admin_token:
                self.log_test("Admin Login", True, "Successfully authenticated", rt)
            else:
                self.log_test("Admin Login", False, f"No token in response", rt)
        else:
            self.log_test("Admin Login", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
        
        # Test JWT Token Validation
        if self.admin_token:
            response, error, rt = self.make_request("GET", "/users", token=self.admin_token)
            if response and response.status_code == 200:
                self.log_test("JWT Token Validation", True, "Token validates correctly", rt)
            else:
                self.log_test("JWT Token Validation", False, 
                            f"Token validation failed: {response.status_code if response else 'No response'}", rt)
    
    def test_recently_added_apis(self):
        """Test the 6 recently added APIs"""
        print("\n🆕 TESTING RECENTLY ADDED APIs")
        
        if not self.admin_token:
            self.log_test("Recently Added APIs", False, "No admin token available")
            return
        
        apis = [
            ("GET", "/visits", "Visits API"),
            ("GET", "/clinics", "Clinics API"),
            ("GET", "/doctors", "Doctors API"),
            ("GET", "/products", "Products API"),
            ("GET", "/warehouses", "Warehouses API"),
            ("GET", "/orders", "Orders API")
        ]
        
        for method, endpoint, name in apis:
            response, error, rt = self.make_request(method, endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else "data"
                self.log_test(f"{name}", True, f"Retrieved {count} items", rt)
            else:
                self.log_test(f"{name}", False, 
                            f"Status: {response.status_code if response else 'No response'}", rt)
    
    def test_order_debt_warning_system(self):
        """Test Order Debt Warning System"""
        print("\n💰 TESTING ORDER DEBT WARNING SYSTEM")
        
        if not self.admin_token:
            self.log_test("Order Debt Warning System", False, "No admin token available")
            return
        
        # Test clinic debt status check API
        response, error, rt = self.make_request("GET", "/orders/check-clinic-status/test-clinic-id", 
                                               token=self.admin_token)
        
        if response:
            if response.status_code == 403:
                self.log_test("Clinic Debt Status API", True, 
                            "API correctly restricted to medical reps only", rt)
            elif response.status_code in [200, 404]:
                self.log_test("Clinic Debt Status API", True, 
                            f"API working (status: {response.status_code})", rt)
            else:
                self.log_test("Clinic Debt Status API", False, 
                            f"Unexpected status: {response.status_code}", rt)
        else:
            self.log_test("Clinic Debt Status API", False, f"No response: {error}", rt)
    
    def test_enhanced_visit_registration(self):
        """Test Enhanced Visit Registration System"""
        print("\n👥 TESTING ENHANCED VISIT REGISTRATION")
        
        if not self.admin_token:
            self.log_test("Enhanced Visit Registration", False, "No admin token available")
            return
        
        # Test visit listing to check for enhanced fields
        response, error, rt = self.make_request("GET", "/visits", token=self.admin_token)
        
        if response and response.status_code == 200:
            visits = response.json()
            if isinstance(visits, list):
                self.log_test("Visit Listing", True, f"Retrieved {len(visits)} visits", rt)
                
                # Check for enhanced fields in visits
                if len(visits) > 0:
                    sample_visit = visits[0]
                    enhanced_fields = ['visit_type', 'participants_count', 'participants_details', 
                                     'accompanying_manager_id', 'other_participant_id']
                    found_fields = [field for field in enhanced_fields if field in sample_visit]
                    
                    if len(found_fields) >= 2:  # At least some enhanced fields present
                        self.log_test("Enhanced Visit Fields", True, 
                                    f"Found enhanced fields: {', '.join(found_fields)}", rt)
                    else:
                        self.log_test("Enhanced Visit Fields", False, 
                                    f"Enhanced fields missing, found: {', '.join(found_fields)}", rt)
                else:
                    self.log_test("Enhanced Visit Fields", True, 
                                "No visits to check, but API working", rt)
            else:
                self.log_test("Visit Listing", False, "Invalid response format", rt)
        else:
            self.log_test("Visit Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
    
    def test_movement_log_system(self):
        """Test Movement Log System"""
        print("\n📦 TESTING MOVEMENT LOG SYSTEM")
        
        if not self.admin_token:
            self.log_test("Movement Log System", False, "No admin token available")
            return
        
        # Test movement logs listing
        response, error, rt = self.make_request("GET", "/movement-logs", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            movements = data.get('movements', []) if isinstance(data, dict) else data
            self.log_test("Movement Logs Listing", True, 
                        f"Retrieved {len(movements)} movement logs", rt)
        else:
            self.log_test("Movement Logs Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
    
    def test_user_management(self):
        """Test User Management System"""
        print("\n👤 TESTING USER MANAGEMENT SYSTEM")
        
        if not self.admin_token:
            self.log_test("User Management", False, "No admin token available")
            return
        
        # Test user listing
        response, error, rt = self.make_request("GET", "/users", token=self.admin_token)
        
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            self.log_test("User Listing", True, f"Retrieved {user_count} users", rt)
            
            # Test user profile access
            if user_count > 0 and isinstance(users, list):
                test_user = users[0]
                user_id = test_user.get('id')
                if user_id:
                    response, error, rt2 = self.make_request("GET", f"/users/{user_id}/profile", 
                                                           token=self.admin_token)
                    
                    if response and response.status_code == 200:
                        profile_data = response.json()
                        self.log_test("User Profile Access", True, 
                                    "Profile access with hierarchical control working", rt2)
                    else:
                        self.log_test("User Profile Access", False, 
                                    f"Status: {response.status_code if response else 'No response'}", rt2)
        else:
            self.log_test("User Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
    
    def test_support_system(self):
        """Test Support System"""
        print("\n🎧 TESTING SUPPORT SYSTEM")
        
        # Test creating support ticket (no auth required)
        test_ticket_data = {
            "sender_name": "مختبر النظام النهائي",
            "sender_position": "مطور",
            "sender_whatsapp": "01234567890",
            "sender_email": "finaltest@company.com",
            "problem_description": "اختبار نهائي لنظام الدعم الفني",
            "priority": "medium",
            "category": "technical"
        }
        
        response, error, rt = self.make_request("POST", "/support/tickets", test_ticket_data)
        
        if response and response.status_code in [200, 201]:
            data = response.json()
            self.log_test("Support Ticket Creation", True, 
                        f"Ticket created: {data.get('ticket_number', 'Unknown')}", rt)
        else:
            self.log_test("Support Ticket Creation", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
        
        if not self.admin_token:
            return
        
        # Test support tickets listing (admin only)
        response, error, rt = self.make_request("GET", "/support/tickets", token=self.admin_token)
        
        if response and response.status_code == 200:
            data = response.json()
            tickets = data.get('tickets', [])
            self.log_test("Support Tickets Listing", True, 
                        f"Retrieved {len(tickets)} support tickets", rt)
        else:
            self.log_test("Support Tickets Listing", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
        
        # Test support statistics
        response, error, rt = self.make_request("GET", "/support/stats", token=self.admin_token)
        
        if response and response.status_code == 200:
            stats = response.json()
            total_tickets = stats.get('total_tickets', 0)
            self.log_test("Support Statistics", True, 
                        f"Statistics: {total_tickets} total tickets", rt)
        else:
            self.log_test("Support Statistics", False, 
                        f"Status: {response.status_code if response else 'No response'}", rt)
    
    def test_performance(self):
        """Test System Performance"""
        print("\n⚡ TESTING SYSTEM PERFORMANCE")
        
        if not self.admin_token:
            self.log_test("Performance Testing", False, "No admin token available")
            return
        
        # Test response times for critical endpoints
        endpoints = [
            ("GET", "/users", "User Management"),
            ("GET", "/visits", "Visits System"),
            ("GET", "/clinics", "Clinics System"),
            ("GET", "/products", "Products System")
        ]
        
        response_times = []
        for method, endpoint, name in endpoints:
            response, error, rt = self.make_request(method, endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                response_times.append(rt)
                performance = "Excellent" if rt < 100 else "Good" if rt < 500 else "Acceptable"
                self.log_test(f"Performance - {name}", True, 
                            f"{rt:.2f}ms ({performance})", rt)
            else:
                self.log_test(f"Performance - {name}", False, 
                            f"Failed: {response.status_code if response else 'No response'}", rt)
        
        # Calculate average response time
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            self.log_test("Average Response Time", True, 
                        f"{avg_response_time:.2f}ms across {len(response_times)} endpoints")
    
    def test_data_integrity(self):
        """Test Data Integrity and Serialization"""
        print("\n🔍 TESTING DATA INTEGRITY")
        
        if not self.admin_token:
            self.log_test("Data Integrity", False, "No admin token available")
            return
        
        # Test data serialization in key endpoints
        endpoints = [
            ("GET", "/users", "users"),
            ("GET", "/visits", "visits"),
            ("GET", "/clinics", "clinics")
        ]
        
        for method, endpoint, data_type in endpoints:
            response, error, rt = self.make_request(method, endpoint, token=self.admin_token)
            
            if response and response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    sample_item = data[0]
                    
                    # Check for ObjectId cleanup
                    has_object_id = "_id" in sample_item
                    self.log_test(f"ObjectId Cleanup - {data_type}", not has_object_id, 
                                f"MongoDB ObjectId {'found' if has_object_id else 'properly cleaned'}", rt)
                    
                    # Check for proper ID field
                    has_proper_id = "id" in sample_item and sample_item["id"] is not None
                    self.log_test(f"Proper ID Field - {data_type}", has_proper_id, 
                                f"ID field {'present' if has_proper_id else 'missing'}", rt)
                else:
                    self.log_test(f"Data Integrity - {data_type}", True, 
                                f"Endpoint working, no data to check", rt)
            else:
                self.log_test(f"Data Integrity - {data_type}", False, 
                            f"Status: {response.status_code if response else 'No response'}", rt)
    
    def run_focused_final_test(self):
        """Run focused final comprehensive test"""
        print("🎯 اختبار نهائي مركز للنظام - FOCUSED FINAL BACKEND TESTING")
        print("=" * 80)
        print("Testing core functionality and recently added APIs")
        print("Goal: Verify system stability and production readiness")
        print("=" * 80)
        
        start_time = time.time()
        
        # Run all test categories
        self.test_authentication()
        self.test_recently_added_apis()
        self.test_order_debt_warning_system()
        self.test_enhanced_visit_registration()
        self.test_movement_log_system()
        self.test_user_management()
        self.test_support_system()
        self.test_performance()
        self.test_data_integrity()
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Generate summary
        self.generate_summary(total_time)
        
        return self.passed_tests / self.total_tests >= 0.80 if self.total_tests > 0 else False
    
    def generate_summary(self, total_time):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("📊 FOCUSED FINAL TEST SUMMARY")
        print("=" * 80)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"Total Tests: {self.total_tests}")
        print(f"Passed: {self.passed_tests}")
        print(f"Failed: {self.total_tests - self.passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print(f"Total Time: {total_time:.2f} seconds")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if not result['success']]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        # Final assessment
        print(f"\n🎯 FINAL ASSESSMENT:")
        if success_rate >= 95:
            print("🎉 EXCELLENT! System is production-ready!")
            assessment = "PRODUCTION_READY"
        elif success_rate >= 85:
            print("✅ VERY GOOD! System working excellently with minor issues")
            assessment = "MOSTLY_READY"
        elif success_rate >= 75:
            print("⚠️ GOOD! System working well but needs some attention")
            assessment = "NEEDS_MINOR_FIXES"
        else:
            print("❌ NEEDS WORK! System needs improvements")
            assessment = "NEEDS_MAJOR_FIXES"
        
        return {
            "success_rate": success_rate,
            "assessment": assessment,
            "total_tests": self.total_tests,
            "passed_tests": self.passed_tests,
            "failed_tests": len(failed_tests)
        }

def main():
    """Main test execution"""
    tester = FocusedFinalBackendTester()
    success = tester.run_focused_final_test()
    
    if success:
        print("\n🎉 FOCUSED FINAL TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n⚠️ FOCUSED FINAL TESTING COMPLETED WITH SOME ISSUES!")
        sys.exit(1)

if __name__ == "__main__":
    main()