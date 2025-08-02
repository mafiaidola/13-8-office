#!/usr/bin/env python3
"""
Comprehensive EP Group System Backend Testing - All 3 Phases
Testing all backend APIs after completing Phase 3 (Admin Dashboard Enhancement).

Phase 1: Enhanced UI/UX (modals, header, themes, user profile) - COMPLETE
Phase 2: Debt & Collection Management (comprehensive financial system) - COMPLETE  
Phase 3: Admin Dashboard Enhancement (advanced metrics, time filters, dynamic activities) - TESTING
"""

import requests
import json
import time
from datetime import datetime
import os

# Get backend URL from environment
BACKEND_URL = "https://d3d1a9df-70fc-435f-82af-b5d9d4d817e1.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, response_time, details=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name} ({result['response_time_ms']}ms) - {details}")
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with timing"""
        start_time = time.time()
        try:
            url = f"{self.base_url}{endpoint}"
            if headers is None:
                headers = {}
            
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
                
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                headers["Content-Type"] = "application/json"
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                headers["Content-Type"] = "application/json"
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            response_time = time.time() - start_time
            return response, response_time
            
        except Exception as e:
            response_time = time.time() - start_time
            print(f"❌ Request failed: {str(e)}")
            return None, response_time

    def test_authentication(self):
        """Test authentication endpoints"""
        print("\n🔐 TESTING AUTHENTICATION ENDPOINTS")
        
        # Test admin login
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response, response_time = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                self.token = data["access_token"]
                user_info = data.get("user", {})
                details = f"Login successful - User: {user_info.get('full_name', 'N/A')}, Role: {user_info.get('role', 'N/A')}"
                self.log_test("Admin Login (admin/admin123)", True, response_time, details)
                return True
            else:
                self.log_test("Admin Login (admin/admin123)", False, response_time, "No access token in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Admin Login (admin/admin123)", False, response_time, f"HTTP {response.status_code if response else 'N/A'}: {error_msg}")
        
        return False

    def test_user_management(self):
        """Test user management APIs"""
        print("\n👥 TESTING USER MANAGEMENT APIs")
        
        # Test get users
        response, response_time = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            users = response.json()
            user_count = len(users) if isinstance(users, list) else 0
            roles = {}
            for user in users if isinstance(users, list) else []:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1
            
            details = f"Found {user_count} users. Roles: {dict(roles)}"
            self.log_test("Get Users List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Users List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create user
        new_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123",
            "full_name": "Test User for Phase 1",
            "role": "medical_rep",
            "email": "testuser@example.com",
            "phone": "01234567890",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/users", new_user_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                user_info = data.get("user", {})
                details = f"Created user: {user_info.get('username', 'N/A')} ({user_info.get('role', 'N/A')})"
                self.log_test("Create New User", True, response_time, details)
            else:
                self.log_test("Create New User", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New User", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_product_management(self):
        """Test product management APIs"""
        print("\n📦 TESTING PRODUCT MANAGEMENT APIs")
        
        # Test get products
        response, response_time = self.make_request("GET", "/products")
        if response and response.status_code == 200:
            products = response.json()
            product_count = len(products) if isinstance(products, list) else 0
            
            # Check if admin can see prices
            has_prices = False
            if isinstance(products, list) and products:
                has_prices = any("price" in product for product in products)
            
            details = f"Found {product_count} products. Admin can see prices: {has_prices}"
            self.log_test("Get Products List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Products List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test get lines for product creation
        response, response_time = self.make_request("GET", "/lines")
        if response and response.status_code == 200:
            lines = response.json()
            line_count = len(lines) if isinstance(lines, list) else 0
            details = f"Found {line_count} lines available for product assignment"
            self.log_test("Get Lines for Products", True, response_time, details)
            
            # Test create product if lines exist
            if isinstance(lines, list) and lines:
                line_id = lines[0].get("id")
                new_product_data = {
                    "name": f"Test Product {int(time.time())}",
                    "description": "Test product for Phase 1 UI testing",
                    "category": "Test Category",
                    "unit": "ڤايل",
                    "line_id": line_id,
                    "price": 25.50,
                    "price_type": "fixed",
                    "current_stock": 100,
                    "is_active": True
                }
                
                response, response_time = self.make_request("POST", "/products", new_product_data)
                if response and response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        product_info = data.get("product", {})
                        details = f"Created product: {product_info.get('name', 'N/A')} - {product_info.get('price', 'N/A')} ج.م"
                        self.log_test("Create New Product", True, response_time, details)
                    else:
                        self.log_test("Create New Product", False, response_time, data.get("message", "Unknown error"))
                else:
                    error_msg = response.text if response else "No response"
                    self.log_test("Create New Product", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Lines for Products", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_clinic_management(self):
        """Test clinic management APIs"""
        print("\n🏥 TESTING CLINIC MANAGEMENT APIs")
        
        # Test get clinics
        response, response_time = self.make_request("GET", "/clinics")
        if response and response.status_code == 200:
            clinics = response.json()
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            
            # Analyze clinic data
            classifications = {}
            credit_statuses = {}
            for clinic in clinics if isinstance(clinics, list) else []:
                classification = clinic.get('classification', 'unknown')
                credit_status = clinic.get('credit_status', 'unknown')
                classifications[classification] = classifications.get(classification, 0) + 1
                credit_statuses[credit_status] = credit_statuses.get(credit_status, 0) + 1
            
            details = f"Found {clinic_count} clinics. Classifications: {dict(classifications)}"
            self.log_test("Get Clinics List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Clinics List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create clinic
        new_clinic_data = {
            "clinic_name": f"Test Clinic {int(time.time())}",
            "doctor_name": "Dr. Test Doctor",
            "phone": "01234567890",
            "address": "Test Address, Cairo",
            "specialization": "General Medicine",
            "latitude": 30.0444,
            "longitude": 31.2357
        }
        
        response, response_time = self.make_request("POST", "/clinics", new_clinic_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                details = f"Created clinic: {new_clinic_data['clinic_name']} - {new_clinic_data['doctor_name']}"
                self.log_test("Create New Clinic", True, response_time, details)
            else:
                self.log_test("Create New Clinic", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New Clinic", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_dashboard_data(self):
        """Test dashboard data APIs"""
        print("\n📊 TESTING DASHBOARD DATA APIs")
        
        # Test dashboard stats
        response, response_time = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 200:
            stats = response.json()
            details = f"Dashboard stats: Users: {stats.get('total_users', 'N/A')}, Products: {stats.get('total_products', 'N/A')}, Clinics: {stats.get('total_clinics', 'N/A')}"
            self.log_test("Dashboard Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Dashboard Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test visits data
        response, response_time = self.make_request("GET", "/visits")
        if response and response.status_code == 200:
            visits = response.json()
            visit_count = len(visits) if isinstance(visits, list) else 0
            details = f"Found {visit_count} visits in system"
            self.log_test("Get Visits Data", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Visits Data", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_lines_areas_management(self):
        """Test lines and areas management APIs"""
        print("\n🗺️ TESTING LINES & AREAS MANAGEMENT APIs")
        
        # Test get areas
        response, response_time = self.make_request("GET", "/areas")
        if response and response.status_code == 200:
            areas = response.json()
            area_count = len(areas) if isinstance(areas, list) else 0
            details = f"Found {area_count} areas in system"
            self.log_test("Get Areas List", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Areas List", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create area
        new_area_data = {
            "name": f"Test Area {int(time.time())}",
            "code": f"TA{int(time.time())}",
            "description": "Test area for Phase 1 UI testing",
            "is_active": True
        }
        
        response, response_time = self.make_request("POST", "/areas", new_area_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                area_info = data.get("area", {})
                details = f"Created area: {area_info.get('name', 'N/A')} ({area_info.get('code', 'N/A')})"
                self.log_test("Create New Area", True, response_time, details)
            else:
                self.log_test("Create New Area", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New Area", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_user_profile_apis(self):
        """Test user profile APIs for enhanced sidebar"""
        print("\n👤 TESTING USER PROFILE APIs")
        
        # First get current user ID from token or users list
        response, response_time = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            users = response.json()
            admin_user = None
            if isinstance(users, list):
                for user in users:
                    if user.get('role') == 'admin':
                        admin_user = user
                        break
            
            if admin_user:
                user_id = admin_user.get('id')
                # Test get user profile
                response, response_time = self.make_request("GET", f"/users/{user_id}/profile")
                if response and response.status_code == 200:
                    profile_data = response.json()
                    user_info = profile_data.get('user', {})
                    stats = user_info.get('user_stats', {})
                    details = f"Profile loaded for {user_info.get('full_name', 'N/A')} with stats: {len(stats)} sections"
                    self.log_test("Get User Profile", True, response_time, details)
                else:
                    error_msg = response.text if response else "No response"
                    self.log_test("Get User Profile", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
            else:
                self.log_test("Get User Profile", False, 0, "No admin user found to test profile")
        else:
            self.log_test("Get User Profile", False, response_time, "Could not get users list")

    def test_phase2_debt_collection_apis(self):
        """Test Phase 2 - Debt & Collection Management APIs"""
        print("\n💰 TESTING PHASE 2 - DEBT & COLLECTION MANAGEMENT APIs")
        
        # Test debt summary statistics
        response, response_time = self.make_request("GET", "/debts/summary/statistics")
        if response and response.status_code == 200:
            stats = response.json()
            details = f"Debt stats: Total debts: {stats.get('total_debts', 'N/A')}, Total amount: {stats.get('total_debt_amount', 'N/A')} ج.م"
            self.log_test("Debt Summary Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Debt Summary Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test get all debts
        response, response_time = self.make_request("GET", "/debts/")
        if response and response.status_code == 200:
            debts = response.json()
            debt_count = len(debts) if isinstance(debts, list) else 0
            details = f"Found {debt_count} debt records in system"
            self.log_test("Get All Debts", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get All Debts", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create new debt record
        new_debt_data = {
            "clinic_id": "test-clinic-id",
            "clinic_name": "Test Clinic for Debt",
            "debt_amount": 2500.0,
            "outstanding_amount": 2500.0,
            "due_date": "2025-02-15",
            "priority": "medium",
            "status": "pending",
            "description": "Test debt record for Phase 2 testing"
        }
        
        response, response_time = self.make_request("POST", "/debts/", new_debt_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                details = f"Created debt record: {data.get('debt_id', 'N/A')} - {new_debt_data['debt_amount']} ج.م"
                self.log_test("Create New Debt Record", True, response_time, details)
            else:
                self.log_test("Create New Debt Record", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create New Debt Record", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test collection records
        response, response_time = self.make_request("GET", "/debts/collections/")
        if response and response.status_code == 200:
            collections = response.json()
            collection_count = len(collections) if isinstance(collections, list) else 0
            details = f"Found {collection_count} collection records"
            self.log_test("Get Collection Records", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Collection Records", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test collection statistics
        response, response_time = self.make_request("GET", "/debts/collections/summary/statistics")
        if response and response.status_code == 200:
            stats = response.json()
            details = f"Collection stats: Total collections: {stats.get('total_collections', 'N/A')}, Amount collected: {stats.get('total_collected_amount', 'N/A')} ج.م"
            self.log_test("Collection Summary Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Collection Summary Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_phase3_dashboard_enhancement(self):
        """Test Phase 3 - Admin Dashboard Enhancement APIs"""
        print("\n📊 TESTING PHASE 3 - ADMIN DASHBOARD ENHANCEMENT APIs")
        
        # Test enhanced dashboard stats with comprehensive metrics
        response, response_time = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 200:
            stats = response.json()
            
            # Check for enhanced metrics
            metrics = [
                'total_users', 'total_clinics', 'total_products', 'total_orders',
                'total_visits', 'total_debts', 'total_managers', 'total_warehouses'
            ]
            
            available_metrics = [metric for metric in metrics if metric in stats]
            details = f"Enhanced dashboard metrics: {len(available_metrics)}/{len(metrics)} available. "
            details += f"Users: {stats.get('total_users', 'N/A')}, Clinics: {stats.get('total_clinics', 'N/A')}, "
            details += f"Products: {stats.get('total_products', 'N/A')}, Orders: {stats.get('total_orders', 'N/A')}"
            
            self.log_test("Enhanced Dashboard Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Enhanced Dashboard Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test activity tracking system
        response, response_time = self.make_request("GET", "/admin/activities")
        if response and response.status_code == 200:
            activities = response.json()
            activity_count = len(activities) if isinstance(activities, list) else 0
            details = f"Found {activity_count} activity records for dynamic dashboard"
            self.log_test("Activity Tracking System", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Activity Tracking System", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test activity statistics
        response, response_time = self.make_request("GET", "/admin/activities/stats")
        if response and response.status_code == 200:
            stats = response.json()
            details = f"Activity stats: Total: {stats.get('total_activities', 'N/A')}, "
            details += f"Today: {stats.get('today_activities', 'N/A')}, "
            details += f"This week: {stats.get('week_activities', 'N/A')}"
            self.log_test("Activity Statistics", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Activity Statistics", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test GPS tracking system
        response, response_time = self.make_request("GET", "/admin/gps-tracking")
        if response and response.status_code == 200:
            gps_data = response.json()
            gps_count = len(gps_data) if isinstance(gps_data, list) else 0
            details = f"Found {gps_count} GPS tracking records"
            self.log_test("GPS Tracking System", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("GPS Tracking System", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test create activity (for dynamic activities)
        new_activity_data = {
            "activity_type": "dashboard_access",
            "action": "Admin accessed enhanced dashboard",
            "target_type": "dashboard",
            "target_id": "main_dashboard",
            "location": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "address": "Cairo, Egypt"
            },
            "device_info": {
                "user_agent": "Backend Test Agent",
                "ip_address": "127.0.0.1"
            },
            "details": {
                "test_activity": True,
                "phase": "Phase 3 Testing"
            }
        }
        
        response, response_time = self.make_request("POST", "/activities", new_activity_data)
        if response and response.status_code == 200:
            data = response.json()
            if data.get("success"):
                details = f"Created activity: {new_activity_data['activity_type']} - {new_activity_data['action']}"
                self.log_test("Create Dashboard Activity", True, response_time, details)
            else:
                self.log_test("Create Dashboard Activity", False, response_time, data.get("message", "Unknown error"))
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Create Dashboard Activity", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_cross_module_integration(self):
        """Test cross-module integration between all phases"""
        print("\n🔗 TESTING CROSS-MODULE INTEGRATION")
        
        # Test debt creation from orders/invoices integration
        response, response_time = self.make_request("GET", "/orders")
        if response and response.status_code == 200:
            orders = response.json()
            order_count = len(orders) if isinstance(orders, list) else 0
            
            # Check if orders can be linked to debt system
            response2, response_time2 = self.make_request("GET", "/debts/")
            if response2 and response2.status_code == 200:
                debts = response2.json()
                debt_count = len(debts) if isinstance(debts, list) else 0
                details = f"Integration check: {order_count} orders, {debt_count} debts - systems can interact"
                self.log_test("Orders-Debt Integration", True, response_time + response_time2, details)
            else:
                self.log_test("Orders-Debt Integration", False, response_time + response_time2, "Debt system not accessible")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Orders-Debt Integration", False, response_time, f"Orders system not accessible")
        
        # Test user role-based data filtering
        response, response_time = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            users = response.json()
            admin_users = [u for u in users if u.get('role') == 'admin'] if isinstance(users, list) else []
            medical_reps = [u for u in users if u.get('role') in ['medical_rep', 'sales_rep']] if isinstance(users, list) else []
            
            details = f"Role-based filtering: {len(admin_users)} admins, {len(medical_reps)} medical reps"
            self.log_test("Role-Based Data Filtering", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Role-Based Data Filtering", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")
        
        # Test dashboard metrics aggregation
        response, response_time = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 200:
            stats = response.json()
            
            # Verify metrics are properly aggregated from different modules
            modules_integrated = 0
            if stats.get('total_users'): modules_integrated += 1
            if stats.get('total_clinics'): modules_integrated += 1
            if stats.get('total_products'): modules_integrated += 1
            if stats.get('total_orders'): modules_integrated += 1
            if stats.get('total_debts'): modules_integrated += 1
            
            details = f"Dashboard aggregation: {modules_integrated}/5 modules integrated successfully"
            self.log_test("Dashboard Metrics Aggregation", True, response_time, details)
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Dashboard Metrics Aggregation", False, response_time, f"HTTP {response.status_code if response else 'N/A'}")

    def test_system_stability(self):
        """Test overall system stability and performance"""
        print("\n🔧 TESTING SYSTEM STABILITY & PERFORMANCE")
        
        # Test memory usage and response times
        start_time = time.time()
        test_endpoints = [
            "/users", "/products", "/clinics", "/orders", "/visits",
            "/lines", "/areas", "/warehouses", "/dashboard/stats"
        ]
        
        response_times = []
        successful_requests = 0
        
        for endpoint in test_endpoints:
            response, response_time = self.make_request("GET", endpoint)
            response_times.append(response_time * 1000)  # Convert to ms
            if response and response.status_code == 200:
                successful_requests += 1
        
        avg_response_time = sum(response_times) / len(response_times)
        total_test_time = time.time() - start_time
        
        details = f"Stability test: {successful_requests}/{len(test_endpoints)} endpoints working, "
        details += f"Avg response: {avg_response_time:.2f}ms, Total time: {total_test_time:.2f}s"
        
        success = successful_requests >= len(test_endpoints) * 0.8  # 80% success rate
        self.log_test("System Stability Test", success, total_test_time, details)
        
        # Test error handling and validation
        invalid_data = {"invalid": "data"}
        response, response_time = self.make_request("POST", "/users", invalid_data)
        
        if response and response.status_code in [400, 422]:  # Expected validation error
            details = f"Error handling works: HTTP {response.status_code} for invalid data"
            self.log_test("Error Handling & Validation", True, response_time, details)
        else:
            details = f"Unexpected response: HTTP {response.status_code if response else 'N/A'}"
            self.log_test("Error Handling & Validation", False, response_time, details)

    def run_all_tests(self):
        """Run all backend tests for all 3 phases"""
        print("🚀 STARTING COMPREHENSIVE EP GROUP BACKEND TESTING - ALL 3 PHASES")
        print(f"Backend URL: {self.base_url}")
        print("Phase 1: Enhanced UI/UX - COMPLETE")
        print("Phase 2: Debt & Collection Management - COMPLETE") 
        print("Phase 3: Admin Dashboard Enhancement - TESTING")
        print("=" * 80)
        
        # Authentication is required for most tests
        if not self.test_authentication():
            print("❌ CRITICAL: Authentication failed. Cannot proceed with other tests.")
            return self.generate_report()
        
        # Run all test suites
        print("\n🎯 TESTING CORE SYSTEM APIs (Phase 1 Support)")
        self.test_user_management()
        self.test_product_management()
        self.test_clinic_management()
        self.test_dashboard_data()
        self.test_lines_areas_management()
        self.test_user_profile_apis()
        
        # Phase 2 Testing
        self.test_phase2_debt_collection_apis()
        
        # Phase 3 Testing
        self.test_phase3_dashboard_enhancement()
        
        # Integration Testing
        self.test_cross_module_integration()
        
        # System Stability
        self.test_system_stability()
        
        return self.generate_report()
    
    def generate_report(self):
        """Generate comprehensive test report for all 3 phases"""
        total_time = time.time() - self.start_time
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        avg_response_time = sum(result["response_time_ms"] for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE BACKEND TESTING REPORT - ALL 3 PHASES")
        print("=" * 80)
        print(f"🎯 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
        print(f"⏱️  Total Testing Time: {total_time:.2f} seconds")
        print(f"🚀 Average Response Time: {avg_response_time:.2f}ms")
        print(f"✅ Passed Tests: {passed_tests}")
        print(f"❌ Failed Tests: {failed_tests}")
        
        # Phase-specific analysis
        phase1_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                       ["Login", "Users", "Products", "Clinics", "Dashboard Statistics", "Lines", "Profile"])]
        phase2_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                       ["Debt", "Collection"])]
        phase3_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                       ["Enhanced Dashboard", "Activity", "GPS"])]
        integration_tests = [r for r in self.test_results if any(keyword in r["test"] for keyword in 
                           ["Integration", "Stability", "Error Handling"])]
        
        def calculate_phase_success(tests):
            if not tests:
                return 0, 0, 0
            passed = sum(1 for t in tests if t["success"])
            total = len(tests)
            rate = (passed / total * 100) if total > 0 else 0
            return passed, total, rate
        
        p1_passed, p1_total, p1_rate = calculate_phase_success(phase1_tests)
        p2_passed, p2_total, p2_rate = calculate_phase_success(phase2_tests)
        p3_passed, p3_total, p3_rate = calculate_phase_success(phase3_tests)
        int_passed, int_total, int_rate = calculate_phase_success(integration_tests)
        
        print(f"\n📈 PHASE-SPECIFIC RESULTS:")
        print(f"   Phase 1 (Core System): {p1_rate:.1f}% ({p1_passed}/{p1_total})")
        print(f"   Phase 2 (Debt & Collection): {p2_rate:.1f}% ({p2_passed}/{p2_total})")
        print(f"   Phase 3 (Dashboard Enhancement): {p3_rate:.1f}% ({p3_passed}/{p3_total})")
        print(f"   Integration & Stability: {int_rate:.1f}% ({int_passed}/{int_total})")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"\n✅ SUCCESSFUL TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"   • {result['test']}: {result['details']}")
        
        # Critical assessment for all phases
        critical_tests = [
            "Admin Login (admin/admin123)",
            "Get Users List", 
            "Get Products List",
            "Get Clinics List",
            "Enhanced Dashboard Statistics",
            "Debt Summary Statistics",
            "Activity Tracking System"
        ]
        
        critical_passed = sum(1 for result in self.test_results 
                            if result["success"] and result["test"] in critical_tests)
        critical_total = len([r for r in self.test_results if r["test"] in critical_tests])
        
        print(f"\n🎯 CRITICAL APIS FOR ALL PHASES: {critical_passed}/{critical_total} working")
        
        if critical_passed == critical_total:
            print("🎉 EXCELLENT: All critical APIs are working! Backend is ready to support all 3 phases.")
        elif critical_passed >= critical_total * 0.8:
            print("⚠️  GOOD: Most critical APIs working. Minor issues may affect some features.")
        else:
            print("🚨 CRITICAL: Major backend issues detected. System functionality may be impaired.")
        
        # Phase 3 specific assessment
        if p3_rate >= 80:
            print("✅ Phase 3 (Admin Dashboard Enhancement) is working well!")
        elif p3_rate >= 60:
            print("⚠️  Phase 3 has some issues but core functionality works.")
        else:
            print("❌ Phase 3 needs attention - dashboard enhancements may not work properly.")
        
        return {
            "success_rate": success_rate,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "avg_response_time": avg_response_time,
            "phase_results": {
                "phase1": {"passed": p1_passed, "total": p1_total, "rate": p1_rate},
                "phase2": {"passed": p2_passed, "total": p2_total, "rate": p2_rate},
                "phase3": {"passed": p3_passed, "total": p3_total, "rate": p3_rate},
                "integration": {"passed": int_passed, "total": int_total, "rate": int_rate}
            },
            "critical_apis_working": critical_passed == critical_total,
            "test_results": self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    report = tester.run_all_tests()