#!/usr/bin/env python3
"""
Comprehensive Medical Management System Backend Testing
Focus on: Authentication, User Management, Core APIs, Translation Support, Component Loading
As requested in the review for frontend translation work readiness
"""

import requests
import json
import time
import uuid
from datetime import datetime

class MedicalSystemComprehensiveTester:
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
        
        print(f"🏥 Medical Management System Backend Testing - Translation Readiness")
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
        if details:
            print(f"    💬 {details}")

    def test_authentication_system(self):
        """Test 1: Authentication System - admin/admin123 login"""
        print("\n🔐 === AUTHENTICATION SYSTEM TESTING ===")
        
        # Test admin login with geolocation data
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
                        "country": "Egypt",
                        "accuracy": 10,
                        "timestamp": datetime.now().isoformat()
                    },
                    "device_info": "Medical System Test Client",
                    "ip_address": "127.0.0.1"
                },
                timeout=15
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.log_test(
                    "Admin Authentication (admin/admin123)",
                    True,
                    response_time,
                    f"✅ User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}, Token: {'Present' if self.token else 'Missing'}",
                    response.status_code
                )
                
                # Test token format and structure
                if self.token:
                    token_parts = self.token.split('.')
                    self.log_test(
                        "JWT Token Structure",
                        len(token_parts) == 3,
                        0,
                        f"Token parts: {len(token_parts)}/3 (Header.Payload.Signature)"
                    )
                
            else:
                self.log_test(
                    "Admin Authentication (admin/admin123)",
                    False,
                    response_time,
                    f"❌ Login failed: {response.text[:100]}",
                    response.status_code
                )
                
        except Exception as e:
            self.log_test("Admin Authentication (admin/admin123)", False, 0, f"❌ Connection error: {str(e)}")

        # Test authentication validation
        if self.token:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # Test valid token access
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/users", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                self.log_test(
                    "Authentication Token Validation",
                    response.status_code == 200,
                    response_time,
                    "✅ Token accepted by protected endpoint" if response.status_code == 200 else f"❌ Token rejected: {response.status_code}",
                    response.status_code
                )
            except Exception as e:
                self.log_test("Authentication Token Validation", False, 0, f"❌ Error: {str(e)}")
            
            # Test invalid token handling
            invalid_headers = {"Authorization": "Bearer invalid_token_12345"}
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/users", headers=invalid_headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                self.log_test(
                    "Invalid Token Rejection",
                    response.status_code in [401, 403],
                    response_time,
                    f"✅ Invalid token properly rejected" if response.status_code in [401, 403] else f"❌ Invalid token accepted: {response.status_code}",
                    response.status_code
                )
            except Exception as e:
                self.log_test("Invalid Token Rejection", False, 0, f"❌ Error: {str(e)}")

    def test_user_management_apis(self):
        """Test 2: User Management APIs - GET /api/users, user creation, deletion, updates"""
        print("\n👥 === USER MANAGEMENT APIs TESTING ===")
        
        if not self.token:
            print("❌ Skipping User Management tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test GET /api/users
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/users", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users_data = response.json()
                users_count = len(users_data) if isinstance(users_data, list) else users_data.get('total', 0)
                
                # Analyze user roles for translation support
                roles = {}
                if isinstance(users_data, list):
                    for user in users_data:
                        role = user.get('role', 'unknown')
                        roles[role] = roles.get(role, 0) + 1
                
                self.log_test(
                    "GET /api/users - User List Retrieval",
                    True,
                    response_time,
                    f"✅ Retrieved {users_count} users. Roles: {dict(roles)}",
                    response.status_code
                )
                
                # Test user data structure for frontend compatibility
                if isinstance(users_data, list) and users_data:
                    sample_user = users_data[0]
                    required_fields = ['id', 'username', 'full_name', 'role', 'is_active']
                    missing_fields = [field for field in required_fields if field not in sample_user]
                    
                    self.log_test(
                        "User Data Structure Validation",
                        len(missing_fields) == 0,
                        0,
                        f"✅ All required fields present" if len(missing_fields) == 0 else f"❌ Missing fields: {missing_fields}"
                    )
                
            else:
                self.log_test(
                    "GET /api/users - User List Retrieval",
                    False,
                    response_time,
                    f"❌ Failed to retrieve users: {response.text[:100]}",
                    response.status_code
                )
                
        except Exception as e:
            self.log_test("GET /api/users - User List Retrieval", False, 0, f"❌ Error: {str(e)}")

        # Test user creation
        test_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123456",
            "full_name": "Test User for Translation",
            "email": f"test_{int(time.time())}@medical.com",
            "role": "medical_rep",
            "is_active": True,
            "phone": "+201234567890",
            "area_id": "area-001",
            "line_id": "line-001"
        }
        
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/users", 
                json=test_user_data, 
                headers=headers, 
                timeout=10
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code in [200, 201]:
                created_user = response.json()
                test_user_id = created_user.get('id') or created_user.get('user_id')
                
                self.log_test(
                    "POST /api/users - User Creation",
                    True,
                    response_time,
                    f"✅ Created user: {test_user_data['username']} (ID: {test_user_id})",
                    response.status_code
                )
                
                # Test user update
                if test_user_id:
                    update_data = {
                        "full_name": "Updated Test User for Translation",
                        "phone": "+201987654321"
                    }
                    
                    start_time = time.time()
                    try:
                        response = requests.put(f"{self.base_url}/users/{test_user_id}", 
                            json=update_data, 
                            headers=headers, 
                            timeout=10
                        )
                        response_time = (time.time() - start_time) * 1000
                        
                        self.log_test(
                            "PUT /api/users/{id} - User Update",
                            response.status_code == 200,
                            response_time,
                            f"✅ Updated user successfully" if response.status_code == 200 else f"❌ Update failed: {response.text[:50]}",
                            response.status_code
                        )
                    except Exception as e:
                        self.log_test("PUT /api/users/{id} - User Update", False, 0, f"❌ Error: {str(e)}")
                    
                    # Test user deletion (cleanup)
                    start_time = time.time()
                    try:
                        response = requests.delete(f"{self.base_url}/users/{test_user_id}", 
                            headers=headers, 
                            timeout=10
                        )
                        response_time = (time.time() - start_time) * 1000
                        
                        self.log_test(
                            "DELETE /api/users/{id} - User Deletion",
                            response.status_code in [200, 204],
                            response_time,
                            f"✅ Deleted test user successfully" if response.status_code in [200, 204] else f"❌ Deletion failed: {response.text[:50]}",
                            response.status_code
                        )
                    except Exception as e:
                        self.log_test("DELETE /api/users/{id} - User Deletion", False, 0, f"❌ Error: {str(e)}")
                
            else:
                self.log_test(
                    "POST /api/users - User Creation",
                    False,
                    response_time,
                    f"❌ Failed to create user: {response.text[:100]}",
                    response.status_code
                )
                
        except Exception as e:
            self.log_test("POST /api/users - User Creation", False, 0, f"❌ Error: {str(e)}")

    def test_core_system_apis(self):
        """Test 3: Core System APIs - products, clinics, dashboard stats"""
        print("\n🏗️ === CORE SYSTEM APIs TESTING ===")
        
        if not self.token:
            print("❌ Skipping Core System tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Core endpoints to test
        core_endpoints = [
            ("/products", "Products Management"),
            ("/clinics", "Clinics Management"),
            ("/dashboard/stats/admin", "Admin Dashboard Statistics"),
            ("/health", "System Health Check"),
            ("/lines", "Lines Management"),
            ("/areas", "Areas Management")
        ]
        
        for endpoint, name in core_endpoints:
            start_time = time.time()
            try:
                # Health check doesn't need authentication
                test_headers = {} if endpoint == "/health" else headers
                response = requests.get(f"{self.base_url}{endpoint}", headers=test_headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Analyze data structure for translation compatibility
                    data_info = ""
                    if isinstance(data, list):
                        data_info = f"Array with {len(data)} items"
                        if data and isinstance(data[0], dict):
                            sample_keys = list(data[0].keys())[:5]
                            data_info += f", Sample keys: {sample_keys}"
                    elif isinstance(data, dict):
                        data_info = f"Object with {len(data)} properties"
                        sample_keys = list(data.keys())[:5]
                        data_info += f", Keys: {sample_keys}"
                    
                    self.log_test(
                        f"GET {endpoint} - {name}",
                        True,
                        response_time,
                        f"✅ {data_info}",
                        response.status_code
                    )
                else:
                    self.log_test(
                        f"GET {endpoint} - {name}",
                        False,
                        response_time,
                        f"❌ Failed: {response.text[:100]}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_test(f"GET {endpoint} - {name}", False, 0, f"❌ Error: {str(e)}")

        # Test dashboard stats with different roles
        dashboard_roles = ["admin", "medical_rep", "accounting", "gm", "manager"]
        
        for role in dashboard_roles:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/dashboard/stats/{role}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    stats_data = response.json()
                    widgets_count = len(stats_data.get('dashboard_widgets', []))
                    
                    self.log_test(
                        f"Dashboard Stats - {role.upper()} Role",
                        True,
                        response_time,
                        f"✅ {widgets_count} widgets available, Role-specific data provided",
                        response.status_code
                    )
                else:
                    self.log_test(
                        f"Dashboard Stats - {role.upper()} Role",
                        False,
                        response_time,
                        f"❌ Failed: {response.text[:50]}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_test(f"Dashboard Stats - {role.upper()} Role", False, 0, f"❌ Error: {str(e)}")

    def test_translation_system_compatibility(self):
        """Test 4: Translation System Compatibility - ensure APIs work properly for frontend translation"""
        print("\n🌐 === TRANSLATION SYSTEM COMPATIBILITY TESTING ===")
        
        if not self.token:
            print("❌ Skipping Translation Compatibility tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test APIs that need to support multilingual frontend
        translation_critical_endpoints = [
            ("/users", "User Management Interface"),
            ("/products", "Product Management Interface"),
            ("/clinics", "Clinic Management Interface"),
            ("/dashboard/stats/admin", "Dashboard Interface"),
            ("/activities", "Activity Tracking Interface")
        ]
        
        for endpoint, interface_name in translation_critical_endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check data structure for translation compatibility
                    translation_ready = True
                    issues = []
                    
                    if isinstance(data, list) and data:
                        # Check if data has consistent structure
                        sample_item = data[0]
                        if isinstance(sample_item, dict):
                            # Check for required fields that frontend needs
                            if 'id' not in sample_item and '_id' not in sample_item:
                                issues.append("Missing ID field")
                            
                            # Check for text fields that might need translation
                            text_fields = [k for k, v in sample_item.items() if isinstance(v, str)]
                            if len(text_fields) == 0:
                                issues.append("No text fields found")
                    
                    elif isinstance(data, dict):
                        # Check if object has proper structure
                        if not data:
                            issues.append("Empty response object")
                    
                    translation_ready = len(issues) == 0
                    
                    self.log_test(
                        f"Translation Compatibility - {interface_name}",
                        translation_ready,
                        response_time,
                        f"✅ Ready for translation" if translation_ready else f"⚠️ Issues: {', '.join(issues)}",
                        response.status_code
                    )
                else:
                    self.log_test(
                        f"Translation Compatibility - {interface_name}",
                        False,
                        response_time,
                        f"❌ API not available: {response.text[:50]}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_test(f"Translation Compatibility - {interface_name}", False, 0, f"❌ Error: {str(e)}")

        # Test error message structure for translation
        start_time = time.time()
        try:
            # Intentionally trigger an error to test error message structure
            response = requests.get(f"{self.base_url}/nonexistent-endpoint", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 404:
                try:
                    error_data = response.json()
                    has_detail = 'detail' in error_data or 'message' in error_data
                    
                    self.log_test(
                        "Error Message Structure for Translation",
                        has_detail,
                        response_time,
                        f"✅ Error messages have proper structure" if has_detail else "⚠️ Error messages may need translation support",
                        response.status_code
                    )
                except:
                    self.log_test(
                        "Error Message Structure for Translation",
                        False,
                        response_time,
                        "⚠️ Error messages not in JSON format",
                        response.status_code
                    )
            else:
                self.log_test(
                    "Error Message Structure for Translation",
                    False,
                    response_time,
                    f"❌ Unexpected response: {response.status_code}",
                    response.status_code
                )
                
        except Exception as e:
            self.log_test("Error Message Structure for Translation", False, 0, f"❌ Error: {str(e)}")

    def test_component_loading_support(self):
        """Test 5: Component Loading Support - ensure all necessary endpoints are available"""
        print("\n🧩 === COMPONENT LOADING SUPPORT TESTING ===")
        
        if not self.token:
            print("❌ Skipping Component Loading tests - no authentication token")
            return
            
        headers = {"Authorization": f"Bearer {self.token}"}
        
        # Test endpoints required for UserManagement component
        user_management_endpoints = [
            ("/users", "User List for UserManagement"),
            ("/lines", "Lines for User Assignment"),
            ("/areas", "Areas for User Assignment"),
            ("/dashboard/widgets/admin", "Admin Widgets Configuration")
        ]
        
        print("\n📋 UserManagement Component Support:")
        for endpoint, description in user_management_endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                self.log_test(
                    f"UserManagement: {description}",
                    response.status_code == 200,
                    response_time,
                    f"✅ Available" if response.status_code == 200 else f"❌ Not available: {response.status_code}",
                    response.status_code
                )
                
            except Exception as e:
                self.log_test(f"UserManagement: {description}", False, 0, f"❌ Error: {str(e)}")

        # Test endpoints for GPS/location features
        location_endpoints = [
            ("/activities", "Activity Tracking with Location"),
            ("/clinics", "Clinic Location Data")
        ]
        
        print("\n📍 GPS/Location Features Support:")
        for endpoint, description in location_endpoints:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    has_location_data = False
                    
                    if isinstance(data, list) and data:
                        # Check if any item has location data
                        for item in data[:5]:  # Check first 5 items
                            if any(key in item for key in ['latitude', 'longitude', 'location', 'geolocation']):
                                has_location_data = True
                                break
                    
                    self.log_test(
                        f"GPS/Location: {description}",
                        True,
                        response_time,
                        f"✅ Available {'with location data' if has_location_data else '(location data may be empty)'}",
                        response.status_code
                    )
                else:
                    self.log_test(
                        f"GPS/Location: {description}",
                        False,
                        response_time,
                        f"❌ Not available: {response.status_code}",
                        response.status_code
                    )
                    
            except Exception as e:
                self.log_test(f"GPS/Location: {description}", False, 0, f"❌ Error: {str(e)}")

        # Test button functionality endpoints
        button_functionality_endpoints = [
            ("/users", "User CRUD Operations"),
            ("/products", "Product CRUD Operations"),
            ("/clinics", "Clinic CRUD Operations")
        ]
        
        print("\n🔘 Button Functionality Support:")
        for endpoint, description in button_functionality_endpoints:
            # Test GET (Read)
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}{endpoint}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                get_success = response.status_code == 200
                
                self.log_test(
                    f"Button Support: {description} (READ)",
                    get_success,
                    response_time,
                    f"✅ GET operation available" if get_success else f"❌ GET failed: {response.status_code}",
                    response.status_code
                )
                
            except Exception as e:
                self.log_test(f"Button Support: {description} (READ)", False, 0, f"❌ Error: {str(e)}")

    def generate_final_report(self):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("📊 === FINAL COMPREHENSIVE TEST REPORT ===")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(r['response_time'] for r in self.test_results if r['response_time']) / max(1, len([r for r in self.test_results if r['response_time']]))
        
        print(f"🎯 **MEDICAL MANAGEMENT SYSTEM BACKEND TESTING COMPLETE - {success_rate:.1f}% SUCCESS!**")
        print(f"📊 **Test Results Summary:**")
        print(f"   ✅ Passed: {passed_tests}/{total_tests} tests")
        print(f"   ❌ Failed: {failed_tests}/{total_tests} tests")
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        print(f"   ⏱️ Average Response Time: {avg_response_time:.2f}ms")
        print(f"   🕐 Total Test Duration: {total_time:.2f}s")
        
        print(f"\n🔍 **Detailed Results by Category:**")
        
        # Group results by category
        categories = {
            "Authentication": [r for r in self.test_results if "Authentication" in r['test'] or "Token" in r['test'] or "Login" in r['test']],
            "User Management": [r for r in self.test_results if "User" in r['test'] and "Management" not in r['test']],
            "Core APIs": [r for r in self.test_results if any(api in r['test'] for api in ["Products", "Clinics", "Dashboard", "Health", "Lines", "Areas"])],
            "Translation Support": [r for r in self.test_results if "Translation" in r['test']],
            "Component Loading": [r for r in self.test_results if any(comp in r['test'] for comp in ["UserManagement", "GPS", "Button"])]
        }
        
        for category, results in categories.items():
            if results:
                cat_passed = sum(1 for r in results if r['success'])
                cat_total = len(results)
                cat_rate = (cat_passed / cat_total * 100) if cat_total > 0 else 0
                status_icon = "✅" if cat_rate >= 80 else "⚠️" if cat_rate >= 60 else "❌"
                print(f"   {status_icon} {category}: {cat_passed}/{cat_total} ({cat_rate:.1f}%)")
        
        print(f"\n🏥 **System Readiness Assessment:**")
        
        # Authentication readiness
        auth_tests = [r for r in self.test_results if "Authentication" in r['test'] or "Login" in r['test']]
        auth_success = all(r['success'] for r in auth_tests)
        print(f"   🔐 Authentication System: {'✅ READY' if auth_success else '❌ NEEDS ATTENTION'}")
        
        # User management readiness
        user_tests = [r for r in self.test_results if "User" in r['test']]
        user_success_rate = (sum(1 for r in user_tests if r['success']) / len(user_tests) * 100) if user_tests else 0
        print(f"   👥 User Management APIs: {'✅ READY' if user_success_rate >= 80 else '⚠️ PARTIAL' if user_success_rate >= 60 else '❌ NEEDS WORK'}")
        
        # Core system readiness
        core_tests = [r for r in self.test_results if any(api in r['test'] for api in ["Products", "Clinics", "Dashboard"])]
        core_success_rate = (sum(1 for r in core_tests if r['success']) / len(core_tests) * 100) if core_tests else 0
        print(f"   🏗️ Core System APIs: {'✅ READY' if core_success_rate >= 80 else '⚠️ PARTIAL' if core_success_rate >= 60 else '❌ NEEDS WORK'}")
        
        # Translation readiness
        translation_tests = [r for r in self.test_results if "Translation" in r['test']]
        translation_success_rate = (sum(1 for r in translation_tests if r['success']) / len(translation_tests) * 100) if translation_tests else 0
        print(f"   🌐 Translation Compatibility: {'✅ READY' if translation_success_rate >= 80 else '⚠️ PARTIAL' if translation_success_rate >= 60 else '❌ NEEDS WORK'}")
        
        # Component loading readiness
        component_tests = [r for r in self.test_results if any(comp in r['test'] for comp in ["UserManagement", "GPS", "Button"])]
        component_success_rate = (sum(1 for r in component_tests if r['success']) / len(component_tests) * 100) if component_tests else 0
        print(f"   🧩 Component Loading Support: {'✅ READY' if component_success_rate >= 80 else '⚠️ PARTIAL' if component_success_rate >= 60 else '❌ NEEDS WORK'}")
        
        print(f"\n🎯 **Overall System Status:**")
        if success_rate >= 90:
            print(f"   🏆 EXCELLENT - System is ready for frontend translation work")
        elif success_rate >= 80:
            print(f"   ✅ GOOD - System is mostly ready with minor issues")
        elif success_rate >= 70:
            print(f"   ⚠️ FAIR - System needs some improvements before translation work")
        else:
            print(f"   ❌ POOR - System needs significant work before translation readiness")
        
        # Failed tests summary
        if failed_tests > 0:
            print(f"\n❌ **Failed Tests Summary:**")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n📋 **Recommendations:**")
        if auth_success:
            print(f"   ✅ Authentication system is working perfectly")
        else:
            print(f"   🔧 Fix authentication issues before proceeding")
            
        if user_success_rate >= 80:
            print(f"   ✅ User management APIs are ready for frontend integration")
        else:
            print(f"   🔧 Improve user management API reliability")
            
        if core_success_rate >= 80:
            print(f"   ✅ Core system APIs are stable and ready")
        else:
            print(f"   🔧 Address core API issues for better stability")
            
        if translation_success_rate >= 80:
            print(f"   ✅ APIs are compatible with translation systems")
        else:
            print(f"   🔧 Review API responses for translation compatibility")
            
        if component_success_rate >= 80:
            print(f"   ✅ All necessary endpoints are available for component loading")
        else:
            print(f"   🔧 Ensure all required endpoints are implemented")
        
        print("=" * 80)
        return success_rate

def main():
    """Run comprehensive medical system backend testing"""
    tester = MedicalSystemComprehensiveTester()
    
    # Run all test categories
    tester.test_authentication_system()
    tester.test_user_management_apis()
    tester.test_core_system_apis()
    tester.test_translation_system_compatibility()
    tester.test_component_loading_support()
    
    # Generate final report
    success_rate = tester.generate_final_report()
    
    return success_rate >= 80  # Return True if system is ready

if __name__ == "__main__":
    main()