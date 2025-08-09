#!/usr/bin/env python3
"""
EP Group System Enhancement Testing
Tests the new backend features for EP Group System enhancement including:
1. Enhanced Role Hierarchy System
2. Region and District Management APIs
3. Line-Based Product Management
4. Comprehensive Admin Settings
5. System Initialization
6. User Assignment Management
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://0f89e653-23a1-4222-bcbe-a4908839f7c6.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class EPGroupSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.gm_token = None
        self.line_manager_token = None
        self.area_manager_token = None
        self.district_manager_token = None
        self.key_account_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.test_region_id = None
        self.test_district_id = None
        self.test_line_management_id = None
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None, params: Dict = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers, params=params)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def test_admin_login(self):
        """Test 1: Admin login with default credentials"""
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            user_info = response.get("user", {})
            if user_info.get("role") in ["admin", "gm"]:  # Accept both admin and gm roles
                self.log_test("Admin Login", True, f"Successfully logged in as {user_info.get('username')} with role {user_info.get('role')}")
                return True
            else:
                self.log_test("Admin Login", False, f"Wrong role: {user_info.get('role')}")
        else:
            self.log_test("Admin Login", False, f"Status: {status_code}", response)
        return False

    def test_system_initialization(self):
        """Test 2: System Initialization API - POST /api/admin/initialize-system"""
        if not self.admin_token:
            self.log_test("System Initialization", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("POST", "/admin/initialize-system", {}, self.admin_token)
        
        if status_code == 200:
            # Check if GM user was created and sample data setup
            required_fields = ["gm_user_created", "sample_regions_created", "sample_districts_created", "sample_products_created", "system_settings_initialized"]
            
            if all(field in response for field in required_fields):
                self.log_test("System Initialization", True, f"System initialized successfully: {response}")
                return True
            else:
                self.log_test("System Initialization", False, f"Missing initialization fields: {response}")
        else:
            self.log_test("System Initialization", False, f"Status: {status_code}", response)
        return False

    def test_enhanced_role_hierarchy_creation(self):
        """Test 3: Create users with new role hierarchy"""
        if not self.admin_token:
            self.log_test("Enhanced Role Hierarchy Creation", False, "No admin token available")
            return False
        
        # Test creating users with new roles
        new_roles = [
            ("gm", "General Manager", "المدير العام"),
            ("line_manager", "Line Manager", "مدير الخط"),
            ("area_manager", "Area Manager", "مدير المنطقة"),
            ("district_manager", "District Manager", "مدير المقاطعة"),
            ("key_account", "Key Account", "حساب رئيسي"),
            ("medical_rep", "Medical Rep", "مندوب طبي")
        ]
        
        created_users = []
        timestamp = str(int(time.time()))
        
        for role, role_en, role_ar in new_roles:
            user_data = {
                "username": f"{role}_test_{timestamp}",
                "email": f"{role}_{timestamp}@test.com",
                "password": f"{role}123",
                "role": role,
                "full_name": f"{role_ar} تجريبي",
                "phone": f"+96650{len(created_users)+1}111111"
            }
            
            status_code, response = self.make_request("POST", "/auth/register", user_data, self.admin_token)
            
            if status_code == 200:
                user_id = response.get('user_id')
                created_users.append((role, user_id, user_data["username"], user_data["password"]))
                
                # Login as the created user to get token
                login_data = {"username": user_data["username"], "password": user_data["password"]}
                status_code, login_response = self.make_request("POST", "/auth/login", login_data)
                if status_code == 200:
                    token = login_response["token"]
                    setattr(self, f"{role}_token", token)
                    if role == "gm":
                        self.gm_token = token
                    elif role == "line_manager":
                        self.line_manager_token = token
                    elif role == "area_manager":
                        self.area_manager_token = token
                    elif role == "district_manager":
                        self.district_manager_token = token
                    elif role == "key_account":
                        self.key_account_token = token
                    elif role == "medical_rep":
                        self.medical_rep_token = token
            else:
                self.log_test("Enhanced Role Hierarchy Creation", False, f"Failed to create {role}: {status_code}", response)
                return False
        
        if len(created_users) == 6:
            self.log_test("Enhanced Role Hierarchy Creation", True, f"Successfully created all 6 new role types: {[role for role, _, _, _ in created_users]}")
            return True
        else:
            self.log_test("Enhanced Role Hierarchy Creation", False, f"Only created {len(created_users)} out of 6 roles")
        return False

    def test_role_hierarchy_permissions(self):
        """Test 4: Test role hierarchy permissions and can_manage functionality"""
        if not self.gm_token or not self.medical_rep_token:
            self.log_test("Role Hierarchy Permissions", False, "Missing GM or Medical Rep tokens")
            return False
        
        # Test GM can manage Medical Rep (should succeed)
        timestamp = str(int(time.time()))
        subordinate_data = {
            "username": f"subordinate_test_{timestamp}",
            "email": f"subordinate_{timestamp}@test.com",
            "password": "subordinate123",
            "role": "medical_rep",
            "full_name": "مرؤوس تجريبي",
            "phone": "+966509999999"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", subordinate_data, self.gm_token)
        
        if status_code == 200:
            # Test Medical Rep cannot manage GM (should fail)
            gm_data = {
                "username": f"unauthorized_gm_{timestamp}",
                "email": f"unauth_gm_{timestamp}@test.com",
                "password": "unauth123",
                "role": "gm",
                "full_name": "مدير عام غير مسموح",
                "phone": "+966508888888"
            }
            
            status_code, response = self.make_request("POST", "/auth/register", gm_data, self.medical_rep_token)
            
            if status_code == 403:
                self.log_test("Role Hierarchy Permissions", True, "Role hierarchy working: GM can manage Medical Rep, Medical Rep cannot manage GM")
                return True
            else:
                self.log_test("Role Hierarchy Permissions", False, f"Medical Rep should not be able to create GM: {status_code}")
        else:
            self.log_test("Role Hierarchy Permissions", False, f"GM should be able to create Medical Rep: {status_code}", response)
        return False

    def test_create_region(self):
        """Test 5: Create region with line assignment - POST /api/admin/regions"""
        if not self.admin_token:
            self.log_test("Create Region", False, "No admin token available")
            return False
        
        region_data = {
            "name": "منطقة الرياض التجريبية",
            "code": "RYD_TEST",
            "description": "منطقة تجريبية لاختبار النظام",
            "manager_id": None,  # Will be assigned later
            "coordinates": {"latitude": 24.7136, "longitude": 46.6753},
            "boundaries": [
                {"latitude": 24.7000, "longitude": 46.6500},
                {"latitude": 24.7300, "longitude": 46.7000}
            ],
            "line": "LINE_1"
        }
        
        status_code, response = self.make_request("POST", "/admin/regions", region_data, self.admin_token)
        
        if status_code == 200 and "region_id" in response:
            self.test_region_id = response["region_id"]
            self.log_test("Create Region", True, f"Region created successfully with ID: {self.test_region_id}")
            return True
        else:
            self.log_test("Create Region", False, f"Status: {status_code}", response)
        return False

    def test_get_regions_role_based(self):
        """Test 6: Get regions with role-based filtering - GET /api/admin/regions"""
        if not self.admin_token:
            self.log_test("Get Regions Role-Based", False, "No admin token available")
            return False
        
        # Test as admin/GM (should see all regions)
        status_code, response = self.make_request("GET", "/admin/regions", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            admin_regions_count = len(response)
            
            # Test as line manager (should see only own line regions)
            if self.line_manager_token:
                status_code, response = self.make_request("GET", "/admin/regions", token=self.line_manager_token)
                
                if status_code == 200:
                    line_manager_regions_count = len(response)
                    self.log_test("Get Regions Role-Based", True, f"Admin sees {admin_regions_count} regions, Line Manager sees {line_manager_regions_count} regions")
                    return True
                else:
                    self.log_test("Get Regions Role-Based", False, f"Line Manager request failed: {status_code}")
            else:
                self.log_test("Get Regions Role-Based", True, f"Admin can see {admin_regions_count} regions (Line Manager test skipped)")
                return True
        else:
            self.log_test("Get Regions Role-Based", False, f"Status: {status_code}", response)
        return False

    def test_update_region(self):
        """Test 7: Update region - PATCH /api/admin/regions/{region_id}"""
        if not self.admin_token or not self.test_region_id:
            self.log_test("Update Region", False, "Missing admin token or region ID")
            return False
        
        update_data = {
            "description": "منطقة محدثة للاختبار",
            "coordinates": {"latitude": 24.7200, "longitude": 46.6800}
        }
        
        status_code, response = self.make_request("PATCH", f"/admin/regions/{self.test_region_id}", update_data, self.admin_token)
        
        if status_code == 200:
            self.log_test("Update Region", True, "Region updated successfully")
            return True
        else:
            self.log_test("Update Region", False, f"Status: {status_code}", response)
        return False

    def test_create_district(self):
        """Test 8: Create district within region - POST /api/admin/districts"""
        if not self.admin_token or not self.test_region_id:
            self.log_test("Create District", False, "Missing admin token or region ID")
            return False
        
        district_data = {
            "name": "مقاطعة الملز التجريبية",
            "code": "MLZ_TEST",
            "region_id": self.test_region_id,
            "manager_id": None,  # Will be assigned later
            "coordinates": {"latitude": 24.7136, "longitude": 46.6753},
            "boundaries": [
                {"latitude": 24.7100, "longitude": 46.6700},
                {"latitude": 24.7200, "longitude": 46.6800}
            ]
        }
        
        status_code, response = self.make_request("POST", "/admin/districts", district_data, self.admin_token)
        
        if status_code == 200 and "district_id" in response:
            self.test_district_id = response["district_id"]
            self.log_test("Create District", True, f"District created successfully with ID: {self.test_district_id}")
            return True
        else:
            self.log_test("Create District", False, f"Status: {status_code}", response)
        return False

    def test_get_districts_with_filtering(self):
        """Test 9: Get districts with region filtering - GET /api/admin/districts"""
        if not self.admin_token:
            self.log_test("Get Districts with Filtering", False, "No admin token available")
            return False
        
        # Test getting all districts
        status_code, response = self.make_request("GET", "/admin/districts", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            all_districts_count = len(response)
            
            # Test filtering by region
            if self.test_region_id:
                params = {"region_id": self.test_region_id}
                status_code, response = self.make_request("GET", "/admin/districts", token=self.admin_token, params=params)
                
                if status_code == 200:
                    filtered_districts_count = len(response)
                    self.log_test("Get Districts with Filtering", True, f"All districts: {all_districts_count}, Filtered by region: {filtered_districts_count}")
                    return True
                else:
                    self.log_test("Get Districts with Filtering", False, f"Filtered request failed: {status_code}")
            else:
                self.log_test("Get Districts with Filtering", True, f"Found {all_districts_count} districts (filtering test skipped)")
                return True
        else:
            self.log_test("Get Districts with Filtering", False, f"Status: {status_code}", response)
        return False

    def test_line_based_product_creation(self):
        """Test 10: Create products with line specification"""
        if not self.admin_token:
            self.log_test("Line-Based Product Creation", False, "No admin token available")
            return False
        
        # Create product for LINE_1
        product_line1_data = {
            "name": "منتج الخط الأول",
            "description": "منتج مخصص للخط الأول",
            "price_before_discount": 100.0,
            "discount_percentage": 10.0,
            "category": "أدوية الخط الأول",
            "unit": "علبة",
            "line": "LINE_1"
        }
        
        status_code, response = self.make_request("POST", "/products", product_line1_data, self.admin_token)
        
        if status_code == 200:
            product_line1_id = response.get("product_id")
            
            # Create product for LINE_2
            product_line2_data = {
                "name": "منتج الخط الثاني",
                "description": "منتج مخصص للخط الثاني",
                "price_before_discount": 150.0,
                "discount_percentage": 15.0,
                "category": "أدوية الخط الثاني",
                "unit": "زجاجة",
                "line": "LINE_2"
            }
            
            status_code, response = self.make_request("POST", "/products", product_line2_data, self.admin_token)
            
            if status_code == 200:
                product_line2_id = response.get("product_id")
                self.log_test("Line-Based Product Creation", True, f"Created products for both lines: LINE_1 ({product_line1_id}), LINE_2 ({product_line2_id})")
                return True
            else:
                self.log_test("Line-Based Product Creation", False, f"Failed to create LINE_2 product: {status_code}")
        else:
            self.log_test("Line-Based Product Creation", False, f"Failed to create LINE_1 product: {status_code}", response)
        return False

    def test_get_products_by_line(self):
        """Test 11: Get products filtered by line - GET /api/products/by-line/{line}"""
        if not self.admin_token:
            self.log_test("Get Products by Line", False, "No admin token available")
            return False
        
        # Test getting LINE_1 products
        status_code, response = self.make_request("GET", "/products/by-line/LINE_1", token=self.admin_token)
        
        if status_code == 200 and isinstance(response, list):
            line1_products = len(response)
            
            # Test getting LINE_2 products
            status_code, response = self.make_request("GET", "/products/by-line/LINE_2", token=self.admin_token)
            
            if status_code == 200 and isinstance(response, list):
                line2_products = len(response)
                
                # Verify products have line field
                if len(response) > 0:
                    product = response[0]
                    if "line" in product and product["line"] == "LINE_2":
                        self.log_test("Get Products by Line", True, f"LINE_1 products: {line1_products}, LINE_2 products: {line2_products}")
                        return True
                    else:
                        self.log_test("Get Products by Line", False, "Product missing line field or incorrect line")
                else:
                    self.log_test("Get Products by Line", True, f"LINE_1 products: {line1_products}, LINE_2 products: {line2_products} (no products to verify line field)")
                    return True
            else:
                self.log_test("Get Products by Line", False, f"Failed to get LINE_2 products: {status_code}")
        else:
            self.log_test("Get Products by Line", False, f"Failed to get LINE_1 products: {status_code}", response)
        return False

    def test_comprehensive_admin_settings_get(self):
        """Test 12: Get comprehensive admin settings - GET /api/admin/settings/comprehensive"""
        if not self.admin_token:
            self.log_test("Comprehensive Admin Settings (GET)", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/admin/settings/comprehensive", token=self.admin_token)
        
        if status_code == 200:
            # Check for required sections
            required_sections = ["system_overview", "role_statistics", "line_statistics", "system_health"]
            
            if all(section in response for section in required_sections):
                # Check system_overview structure
                system_overview = response.get("system_overview", {})
                required_overview_fields = ["total_users", "total_regions", "total_districts", "total_products", "active_lines"]
                
                if all(field in system_overview for field in required_overview_fields):
                    # Check role_statistics structure
                    role_statistics = response.get("role_statistics", {})
                    new_roles = ["gm", "line_manager", "area_manager", "district_manager", "key_account", "medical_rep"]
                    
                    # Check if at least some new roles are present
                    new_roles_present = any(role in role_statistics for role in new_roles)
                    
                    if new_roles_present:
                        # Check line_statistics
                        line_statistics = response.get("line_statistics", {})
                        if "LINE_1" in line_statistics and "LINE_2" in line_statistics:
                            self.log_test("Comprehensive Admin Settings (GET)", True, f"Complete system overview with {system_overview['total_users']} users, {system_overview['total_regions']} regions, {system_overview['total_districts']} districts")
                            return True
                        else:
                            self.log_test("Comprehensive Admin Settings (GET)", False, "Missing line statistics")
                    else:
                        self.log_test("Comprehensive Admin Settings (GET)", False, "Missing new role statistics")
                else:
                    self.log_test("Comprehensive Admin Settings (GET)", False, "Missing system overview fields")
            else:
                self.log_test("Comprehensive Admin Settings (GET)", False, f"Missing required sections: {response}")
        else:
            self.log_test("Comprehensive Admin Settings (GET)", False, f"Status: {status_code}", response)
        return False

    def test_comprehensive_admin_settings_post(self):
        """Test 13: Update comprehensive admin settings - POST /api/admin/settings/comprehensive"""
        if not self.admin_token:
            self.log_test("Comprehensive Admin Settings (POST)", False, "No admin token available")
            return False
        
        settings_data = {
            "company_name": "نظام إدارة المجموعة الطبية المحسن",
            "primary_color": "#ff6b35",
            "secondary_color": "#0ea5e9",
            "default_theme": "dark",
            "language": "ar",
            "notifications_enabled": True,
            "chat_enabled": True,
            "voice_notes_enabled": True,
            "role_permissions": {
                "gm": ["all"],
                "line_manager": ["regions.manage", "users.manage", "reports.view"],
                "area_manager": ["districts.manage", "users.view", "visits.approve"],
                "district_manager": ["key_accounts.manage", "orders.approve"],
                "key_account": ["medical_reps.manage", "visits.create"],
                "medical_rep": ["visits.create", "orders.create"]
            }
        }
        
        status_code, response = self.make_request("POST", "/admin/settings/comprehensive", settings_data, self.admin_token)
        
        if status_code == 200:
            self.log_test("Comprehensive Admin Settings (POST)", True, "Settings updated successfully")
            return True
        else:
            self.log_test("Comprehensive Admin Settings (POST)", False, f"Status: {status_code}", response)
        return False

    def test_system_health_monitoring(self):
        """Test 14: System health monitoring - GET /api/admin/system-health"""
        if not self.admin_token:
            self.log_test("System Health Monitoring", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/admin/system-health", token=self.admin_token)
        
        if status_code == 200:
            # Check for required health metrics
            required_metrics = ["database_status", "api_status", "user_activity", "system_performance"]
            
            if all(metric in response for metric in required_metrics):
                # Check database status
                database_status = response.get("database_status", {})
                if "connected" in database_status and database_status["connected"]:
                    self.log_test("System Health Monitoring", True, f"System health check passed: DB connected, API status: {response.get('api_status', {}).get('status', 'unknown')}")
                    return True
                else:
                    self.log_test("System Health Monitoring", False, "Database not connected")
            else:
                self.log_test("System Health Monitoring", False, f"Missing health metrics: {response}")
        else:
            self.log_test("System Health Monitoring", False, f"Status: {status_code}", response)
        return False

    def test_user_assignment_management(self):
        """Test 15: User assignment to regions/districts/lines - PATCH /api/admin/users/{user_id}/assignment"""
        if not self.admin_token or not self.medical_rep_token:
            self.log_test("User Assignment Management", False, "Missing admin or medical rep token")
            return False
        
        # Get medical rep user ID
        status_code, response = self.make_request("GET", "/auth/me", token=self.medical_rep_token)
        
        if status_code == 200:
            medical_rep_id = response.get("id")
            
            if medical_rep_id and self.test_region_id and self.test_district_id:
                assignment_data = {
                    "region_id": self.test_region_id,
                    "district_id": self.test_district_id,
                    "line": "LINE_1"
                }
                
                status_code, response = self.make_request("PATCH", f"/admin/users/{medical_rep_id}/assignment", assignment_data, self.admin_token)
                
                if status_code == 200:
                    # Verify assignment was saved
                    status_code, user_info = self.make_request("GET", "/auth/me", token=self.medical_rep_token)
                    
                    if status_code == 200:
                        user_data = user_info
                        if (user_data.get("region_id") == self.test_region_id and 
                            user_data.get("district_id") == self.test_district_id and 
                            user_data.get("line") == "LINE_1"):
                            self.log_test("User Assignment Management", True, f"User successfully assigned to region, district, and line")
                            return True
                        else:
                            self.log_test("User Assignment Management", False, f"Assignment not saved correctly: {user_data}")
                    else:
                        self.log_test("User Assignment Management", False, "Failed to verify assignment")
                else:
                    self.log_test("User Assignment Management", False, f"Assignment failed: {status_code}", response)
            else:
                self.log_test("User Assignment Management", False, "Missing required IDs for assignment")
        else:
            self.log_test("User Assignment Management", False, "Failed to get medical rep ID")
        return False

    def test_backward_compatibility_legacy_roles(self):
        """Test 16: Backward compatibility with legacy roles"""
        if not self.admin_token:
            self.log_test("Backward Compatibility Legacy Roles", False, "No admin token available")
            return False
        
        # Test creating users with legacy roles
        legacy_roles = ["admin", "manager", "sales_rep", "warehouse_manager", "accounting"]
        created_legacy_users = 0
        timestamp = str(int(time.time()))
        
        for role in legacy_roles:
            user_data = {
                "username": f"legacy_{role}_{timestamp}",
                "email": f"legacy_{role}_{timestamp}@test.com",
                "password": f"legacy{role}123",
                "role": role,
                "full_name": f"Legacy {role} User",
                "phone": f"+96650{created_legacy_users+7}111111"
            }
            
            status_code, response = self.make_request("POST", "/auth/register", user_data, self.admin_token)
            
            if status_code == 200:
                created_legacy_users += 1
            else:
                self.log_test("Backward Compatibility Legacy Roles", False, f"Failed to create legacy {role}: {status_code}")
                return False
        
        if created_legacy_users == 5:
            self.log_test("Backward Compatibility Legacy Roles", True, f"Successfully created all {created_legacy_users} legacy role users")
            return True
        else:
            self.log_test("Backward Compatibility Legacy Roles", False, f"Only created {created_legacy_users} out of 5 legacy roles")
        return False

    def test_role_based_access_control_new_endpoints(self):
        """Test 17: Role-based access control for new endpoints"""
        if not self.admin_token or not self.medical_rep_token:
            self.log_test("Role-Based Access Control New Endpoints", False, "Missing required tokens")
            return False
        
        # Test that Medical Rep cannot access admin endpoints
        test_endpoints = [
            ("/admin/regions", "GET"),
            ("/admin/districts", "GET"),
            ("/admin/settings/comprehensive", "GET"),
            ("/admin/system-health", "GET")
        ]
        
        access_denied_count = 0
        
        for endpoint, method in test_endpoints:
            status_code, response = self.make_request(method, endpoint, token=self.medical_rep_token)
            
            if status_code == 403:
                access_denied_count += 1
            else:
                self.log_test("Role-Based Access Control New Endpoints", False, f"Medical Rep should not access {endpoint}: got {status_code}")
                return False
        
        if access_denied_count == len(test_endpoints):
            self.log_test("Role-Based Access Control New Endpoints", True, f"Medical Rep correctly denied access to all {access_denied_count} admin endpoints")
            return True
        else:
            self.log_test("Role-Based Access Control New Endpoints", False, f"Only {access_denied_count} out of {len(test_endpoints)} endpoints properly restricted")
        return False

    def run_all_tests(self):
        """Run all EP Group System enhancement tests"""
        print("🚀 Starting EP Group System Enhancement Testing")
        print("=" * 60)
        
        tests = [
            self.test_admin_login,
            self.test_system_initialization,
            self.test_enhanced_role_hierarchy_creation,
            self.test_role_hierarchy_permissions,
            self.test_create_region,
            self.test_get_regions_role_based,
            self.test_update_region,
            self.test_create_district,
            self.test_get_districts_with_filtering,
            self.test_line_based_product_creation,
            self.test_get_products_by_line,
            self.test_comprehensive_admin_settings_get,
            self.test_comprehensive_admin_settings_post,
            self.test_system_health_monitoring,
            self.test_user_assignment_management,
            self.test_backward_compatibility_legacy_roles,
            self.test_role_based_access_control_new_endpoints
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ FAIL {test.__name__} - Exception: {str(e)}")
                failed += 1
        
        print("=" * 60)
        print(f"📊 EP Group System Enhancement Test Results:")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return passed, failed

if __name__ == "__main__":
    tester = EPGroupSystemTester()
    tester.run_all_tests()