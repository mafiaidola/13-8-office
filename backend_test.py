#!/usr/bin/env python3
"""
Comprehensive Medical Management System Backend Testing
Testing all major components as requested in the review
"""

import requests
import json
import time
import uuid
from datetime import datetime

class MedicalSystemBackendTester:
    def __init__(self):
        # Get backend URL from frontend .env
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        
        self.base_url = f"{self.base_url}/api"
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🚀 Starting Comprehensive Medical Management System Backend Testing")
        print(f"🔗 Backend URL: {self.base_url}")
        print(f"📅 Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)

    def log_test(self, test_name, success, response_time, details="", status_code=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            'test': test_name,
            'success': success,
            'response_time': response_time,
            'details': details,
            'status_code': status_code
        })
        
        time_str = f"({response_time:.2f}ms)" if response_time else ""
        status_str = f"[{status_code}]" if status_code else ""
        print(f"{status} {test_name} {time_str} {status_str}")
        if details and not success:
            print(f"    💬 {details}")

    def test_authentication(self):
        """Test 1: Authentication Testing"""
        print("\n🔐 === AUTHENTICATION TESTING ===")
        
        # Test admin login
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/auth/login", 
                json={
                    "username": "admin",
                    "password": "admin123",
                    "geolocation": {
                        "latitude": 30.0444,
                        "longitude": 31.2357,
                        "city": "Cairo",
                        "country": "Egypt"
                    },
                    "device_info": "Backend Test Client",
                    "ip_address": "127.0.0.1"
                },
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.log_test(
                    "Admin Login (admin/admin123)",
                    True,
                    response_time,
                    f"User: {user_info.get('full_name')}, Role: {user_info.get('role')}",
                    response.status_code
                )
                
                # Test JWT token validation
                if self.token:
                    headers = {"Authorization": f"Bearer {self.token}"}
                    start_time = time.time()
                    test_response = requests.get(f"{self.base_url}/users", headers=headers, timeout=10)
                    response_time = (time.time() - start_time) * 1000
                    
                    self.log_test(
                        "JWT Token Validation",
                        test_response.status_code == 200,
                        response_time,
                        "Token accepted by protected endpoint" if test_response.status_code == 200 else "Token rejected",
                        test_response.status_code
                    )
                else:
                    self.log_test("JWT Token Generation", False, 0, "No token received")
                    
            else:
                self.log_test(
                    "Admin Login (admin/admin123)",
                    False,
                    response_time,
                    f"Login failed: {response.text[:100]}",
                    response.status_code
                )
                
        except Exception as e:
            self.log_test("Admin Login (admin/admin123)", False, 0, f"Connection error: {str(e)}")

        # Test protected routes access
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            protected_endpoints = [
                ("/dashboard/stats/admin", "Admin Dashboard Stats"),
                ("/users", "Users Management"),
                ("/products", "Products Management")
            ]
            
            for endpoint, name in protected_endpoints:
                start_time = time.time()
                try:
                    response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                    response_time = (time.time() - start_time) * 1000
                    
                    self.log_test(
                        f"Protected Route Access: {name}",
                        response.status_code == 200,
                        response_time,
                        f"Data received" if response.status_code == 200 else f"Access denied: {response.text[:50]}",
                        response.status_code
                    )
                except Exception as e:
                    self.log_test(f"Protected Route Access: {name}", False, 0, f"Error: {str(e)}")

    def test_api_endpoints(self):
        """Test 2: API Endpoints Testing"""
        print("\n🌐 === API ENDPOINTS TESTING ===")
        
        if not self.token:
            print("❌ Skipping API tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Core API endpoints to test
        endpoints = [
            ("GET", "/users", "Users List"),
            ("GET", "/products", "Products List"),
            ("GET", "/clinics", "Clinics List"),
            ("GET", "/health", "System Health Check"),
            ("GET", "/lines", "Lines Management"),
            ("GET", "/areas", "Areas Management"),
            ("GET", "/visits", "Visits Management"),
            ("GET", "/activities", "Activities Log"),
            ("GET", "/debts", "Debt Management"),
            ("GET", "/invoices", "Invoice Management")
        ]
        
        for method, endpoint, name in endpoints:
            start_time = time.time()
            try:
                if method == "GET":
                    response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if isinstance(data, list):
                            count = len(data)
                            details = f"{count} records found"
                        elif isinstance(data, dict):
                            if 'status' in data:
                                details = f"Status: {data.get('status')}"
                            else:
                                details = f"{len(data)} fields returned"
                        else:
                            details = "Data received"
                    except:
                        details = "Response received"
                        
                    self.log_test(f"{method} {endpoint}", True, response_time, details, response.status_code)
                else:
                    self.log_test(
                        f"{method} {endpoint}",
                        False,
                        response_time,
                        f"HTTP {response.status_code}: {response.text[:100]}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_test(f"{method} {endpoint}", False, 0, f"Connection error: {str(e)}")

    def test_database_connectivity(self):
        """Test 3: Database Connectivity"""
        print("\n🗄️ === DATABASE CONNECTIVITY TESTING ===")
        
        if not self.token:
            print("❌ Skipping database tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test health endpoint for database status
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                db_status = data.get('database', 'unknown')
                stats = data.get('statistics', {})
                
                self.log_test(
                    "MongoDB Connection Status",
                    db_status == 'connected',
                    response_time,
                    f"DB Status: {db_status}, Users: {stats.get('users', 0)}, Clinics: {stats.get('clinics', 0)}",
                    response.status_code
                )
            else:
                self.log_test("MongoDB Connection Status", False, response_time, "Health check failed", response.status_code)
                
        except Exception as e:
            self.log_test("MongoDB Connection Status", False, 0, f"Error: {str(e)}")

        # Test data persistence by creating and retrieving a test record
        test_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123",
            "full_name": "Test User for Backend Testing",
            "role": "medical_rep",
            "is_active": True
        }
        
        # Create test user
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/users", json=test_user_data, headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                data = response.json()
                test_user_id = data.get('id') or data.get('user_id')
                
                self.log_test(
                    "Data Persistence - Create User",
                    True,
                    response_time,
                    f"User created with ID: {test_user_id}",
                    response.status_code
                )
                
                # Retrieve the created user
                if test_user_id:
                    start_time = time.time()
                    get_response = requests.get(f"{self.base_url}/users", headers=headers, timeout=10)
                    response_time = (time.time() - start_time) * 1000
                    
                    if get_response.status_code == 200:
                        users = get_response.json()
                        user_found = any(user.get('id') == test_user_id or user.get('username') == test_user_data['username'] for user in users)
                        
                        self.log_test(
                            "Data Retrieval - Find Created User",
                            user_found,
                            response_time,
                            f"User found in database" if user_found else "User not found in list",
                            get_response.status_code
                        )
                        
                        # Clean up - delete test user
                        if user_found:
                            try:
                                delete_response = requests.delete(f"{self.base_url}/users/{test_user_id}", headers=headers, timeout=10)
                                self.log_test(
                                    "Data Cleanup - Delete Test User",
                                    delete_response.status_code in [200, 204],
                                    0,
                                    "Test user cleaned up" if delete_response.status_code in [200, 204] else "Cleanup failed",
                                    delete_response.status_code
                                )
                            except:
                                pass  # Cleanup failure is not critical
                    else:
                        self.log_test("Data Retrieval - Find Created User", False, response_time, "Failed to retrieve users", get_response.status_code)
            else:
                self.log_test("Data Persistence - Create User", False, response_time, f"Creation failed: {response.text[:100]}", response.status_code)
                
        except Exception as e:
            self.log_test("Data Persistence - Create User", False, 0, f"Error: {str(e)}")

    def test_data_validation(self):
        """Test 4: Data Validation"""
        print("\n✅ === DATA VALIDATION TESTING ===")
        
        if not self.token:
            print("❌ Skipping validation tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test invalid user creation
        invalid_user_data = {
            "username": "",  # Empty username
            "password": "123",  # Too short
            "role": "invalid_role"  # Invalid role
        }
        
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/users", json=invalid_user_data, headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            # Should fail validation
            self.log_test(
                "Input Validation - Invalid User Data",
                response.status_code in [400, 422],
                response_time,
                f"Validation correctly rejected invalid data" if response.status_code in [400, 422] else "Validation failed to catch errors",
                response.status_code
            )
        except Exception as e:
            self.log_test("Input Validation - Invalid User Data", False, 0, f"Error: {str(e)}")

        # Test missing required fields
        incomplete_data = {"username": "test_incomplete"}  # Missing password and role
        
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/users", json=incomplete_data, headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            self.log_test(
                "Required Fields Validation",
                response.status_code in [400, 422],
                response_time,
                f"Missing fields correctly rejected" if response.status_code in [400, 422] else "Missing fields not caught",
                response.status_code
            )
        except Exception as e:
            self.log_test("Required Fields Validation", False, 0, f"Error: {str(e)}")

        # Test unauthorized access (no token)
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/users", timeout=10)  # No headers
            response_time = (time.time() - start_time) * 1000
            
            self.log_test(
                "Authorization Validation",
                response.status_code in [401, 403],
                response_time,
                f"Unauthorized access correctly blocked" if response.status_code in [401, 403] else "Security issue: unauthorized access allowed",
                response.status_code
            )
        except Exception as e:
            self.log_test("Authorization Validation", False, 0, f"Error: {str(e)}")

    def test_api_responses(self):
        """Test 5: API Response Testing"""
        print("\n📊 === API RESPONSE TESTING ===")
        
        if not self.token:
            print("❌ Skipping response tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test response formats and status codes
        test_endpoints = [
            ("/users", "Users API Response Format"),
            ("/products", "Products API Response Format"),
            ("/dashboard/stats/admin", "Dashboard Stats Response Format"),
            ("/health", "Health Check Response Format")
        ]
        
        for endpoint, test_name in test_endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        content_type = response.headers.get('content-type', '')
                        
                        # Check if response is valid JSON
                        is_valid_json = 'application/json' in content_type
                        has_data = data is not None
                        
                        details = f"JSON: {is_valid_json}, Data: {has_data}"
                        if isinstance(data, list):
                            details += f", Count: {len(data)}"
                        elif isinstance(data, dict):
                            details += f", Fields: {len(data)}"
                            
                        self.log_test(
                            test_name,
                            is_valid_json and has_data,
                            response_time,
                            details,
                            response.status_code
                        )
                    except json.JSONDecodeError:
                        self.log_test(test_name, False, response_time, "Invalid JSON response", response.status_code)
                else:
                    self.log_test(test_name, False, response_time, f"HTTP {response.status_code}", response.status_code)
                    
            except Exception as e:
                self.log_test(test_name, False, 0, f"Error: {str(e)}")

        # Test pagination and filtering (if supported)
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/activities?limit=5", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Pagination Support",
                    isinstance(data, list) and len(data) <= 5,
                    response_time,
                    f"Returned {len(data)} items (limit=5)" if isinstance(data, list) else "Pagination not supported",
                    response.status_code
                )
            else:
                self.log_test("Pagination Support", False, response_time, "Activities endpoint not available", response.status_code)
        except Exception as e:
            self.log_test("Pagination Support", False, 0, f"Error: {str(e)}")

    def test_financial_system(self):
        """Test 6: Financial System Testing"""
        print("\n💰 === FINANCIAL SYSTEM TESTING ===")
        
        if not self.token:
            print("❌ Skipping financial tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test invoice management endpoints
        financial_endpoints = [
            ("/invoices", "Invoice Management"),
            ("/debts", "Debt Management"),
            ("/payments", "Payment Processing"),
            ("/debts/statistics/overview", "Financial Statistics")
        ]
        
        for endpoint, test_name in financial_endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        details = f"{len(data)} records found"
                    elif isinstance(data, dict):
                        if 'total_amount' in data or 'outstanding_amount' in data:
                            details = f"Financial data: {data.get('total_amount', 0)} total"
                        else:
                            details = f"{len(data)} fields returned"
                    else:
                        details = "Data received"
                        
                    self.log_test(test_name, True, response_time, details, response.status_code)
                else:
                    self.log_test(test_name, False, response_time, f"HTTP {response.status_code}: {response.text[:50]}", response.status_code)
                    
            except Exception as e:
                self.log_test(test_name, False, 0, f"Error: {str(e)}")

        # Test debt management and collection tracking
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/debts", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                total_debts = len(debts) if isinstance(debts, list) else 0
                
                # Calculate financial metrics if data exists
                if total_debts > 0 and isinstance(debts, list):
                    total_amount = sum(debt.get('original_amount', 0) for debt in debts)
                    remaining_amount = sum(debt.get('remaining_amount', 0) for debt in debts)
                    
                    details = f"Debts: {total_debts}, Total: {total_amount:.2f}, Outstanding: {remaining_amount:.2f}"
                else:
                    details = f"No debts found (system clean)"
                    
                self.log_test(
                    "Debt Collection Tracking",
                    True,
                    response_time,
                    details,
                    response.status_code
                )
            else:
                self.log_test("Debt Collection Tracking", False, response_time, "Debt system not available", response.status_code)
                
        except Exception as e:
            self.log_test("Debt Collection Tracking", False, 0, f"Error: {str(e)}")

        # Test financial calculations and data integrity
        start_time = time.time()
        try:
            # Test creating a simple financial record (if endpoint exists)
            test_debt = {
                "clinic_id": "test-clinic-001",
                "original_amount": 1000.0,
                "remaining_amount": 1000.0,
                "description": "Backend Test Debt Record",
                "due_date": (datetime.now()).isoformat()
            }
            
            response = requests.post(f"{self.base_url}/debts", json=test_debt, headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                data = response.json()
                debt_id = data.get('id') or data.get('debt_id')
                
                self.log_test(
                    "Financial Data Integrity",
                    True,
                    response_time,
                    f"Test debt created: {debt_id}",
                    response.status_code
                )
                
                # Clean up test debt
                if debt_id:
                    try:
                        requests.delete(f"{self.base_url}/debts/{debt_id}", headers=headers, timeout=5)
                    except:
                        pass  # Cleanup failure is not critical
            else:
                self.log_test("Financial Data Integrity", False, response_time, "Cannot create test financial record", response.status_code)
                
        except Exception as e:
            self.log_test("Financial Data Integrity", False, 0, f"Error: {str(e)}")

    def generate_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📋 === COMPREHENSIVE TEST REPORT ===")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(r['response_time'] for r in self.test_results if r['response_time']) / max(1, len([r for r in self.test_results if r['response_time']]))
        
        print(f"🎯 **FINAL RESULTS:**")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests} ✅")
        print(f"   Failed: {failed_tests} ❌")
        print(f"   Success Rate: {success_rate:.1f}%")
        print(f"   Average Response Time: {avg_response_time:.2f}ms")
        print(f"   Total Execution Time: {total_time:.2f}s")
        
        print(f"\n📊 **TEST CATEGORIES SUMMARY:**")
        
        categories = {
            "Authentication": ["Admin Login", "JWT Token", "Protected Route"],
            "API Endpoints": ["GET /users", "GET /products", "GET /clinics", "GET /health"],
            "Database": ["MongoDB Connection", "Data Persistence", "Data Retrieval"],
            "Validation": ["Input Validation", "Required Fields", "Authorization"],
            "Response Format": ["JSON Response", "Status Codes", "Pagination"],
            "Financial System": ["Invoice Management", "Debt Management", "Financial Integrity"]
        }
        
        for category, keywords in categories.items():
            category_tests = [r for r in self.test_results if any(keyword in r['test'] for keyword in keywords)]
            if category_tests:
                category_passed = sum(1 for r in category_tests if r['success'])
                category_total = len(category_tests)
                category_rate = (category_passed / category_total * 100) if category_total > 0 else 0
                status = "✅" if category_rate >= 80 else "⚠️" if category_rate >= 60 else "❌"
                print(f"   {status} {category}: {category_passed}/{category_total} ({category_rate:.1f}%)")
        
        if failed_tests > 0:
            print(f"\n❌ **FAILED TESTS:**")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n🏆 **OVERALL ASSESSMENT:**")
        if success_rate >= 90:
            print("   EXCELLENT - System is production ready!")
        elif success_rate >= 80:
            print("   GOOD - System is mostly functional with minor issues")
        elif success_rate >= 70:
            print("   ACCEPTABLE - System needs some improvements")
        else:
            print("   NEEDS WORK - System has significant issues requiring attention")
        
        print("=" * 80)
        
        return {
            'total_tests': total_tests,
            'passed_tests': passed_tests,
            'success_rate': success_rate,
            'avg_response_time': avg_response_time,
            'total_time': total_time
        }

    def run_all_tests(self):
        """Run all comprehensive tests"""
        try:
            self.test_authentication()
            self.test_api_endpoints()
            self.test_database_connectivity()
            self.test_data_validation()
            self.test_api_responses()
            self.test_financial_system()
            
            return self.generate_report()
            
        except KeyboardInterrupt:
            print("\n⚠️ Testing interrupted by user")
            return self.generate_report()
        except Exception as e:
            print(f"\n❌ Critical error during testing: {str(e)}")
            return self.generate_report()

def main():
    """Main testing function"""
    tester = MedicalSystemBackendTester()
    results = tester.run_all_tests()
    
    # Return results for potential integration with other systems
    return results

if __name__ == "__main__":
    main()