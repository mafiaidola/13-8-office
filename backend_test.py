#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Medical Sales Rep Visit Management System
Tests all backend APIs including authentication, GPS geofencing, and role-based access
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://85c78f91-bacd-4506-a6c6-0c0928b52f9e.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

# Test data
TEST_CLINIC_DATA = {
    "name": "عيادة الدكتور أحمد الطبية",
    "address": "شارع الملك فهد، الرياض",
    "latitude": 24.7136,
    "longitude": 46.6753,
    "phone": "+966501234567"
}

TEST_DOCTOR_DATA = {
    "name": "د. محمد العلي",
    "specialty": "طب الأطفال",
    "phone": "+966509876543",
    "email": "dr.mohammed@clinic.com"
}

# GPS coordinates for testing geofencing
CLINIC_LOCATION = {"latitude": 24.7136, "longitude": 46.6753}
NEAR_CLINIC = {"latitude": 24.7137, "longitude": 46.6754}  # ~15m away
FAR_FROM_CLINIC = {"latitude": 24.7200, "longitude": 46.6800}  # ~700m away

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.manager_token = None
        self.sales_rep_id = None
        self.manager_id = None
        self.test_clinic_id = None
        self.test_doctor_id = None
        self.test_clinic_request_id = None
        self.test_results = []
        
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
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
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
            if user_info.get("role") == "admin":
                self.log_test("Admin Login", True, f"Successfully logged in as {user_info.get('username')}")
                return True
            else:
                self.log_test("Admin Login", False, f"Wrong role: {user_info.get('role')}")
        else:
            self.log_test("Admin Login", False, f"Status: {status_code}", response)
        return False
    
    def test_jwt_token_validation(self):
        """Test 2: JWT token validation"""
        if not self.admin_token:
            self.log_test("JWT Token Validation", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/auth/me", token=self.admin_token)
        
        if status_code == 200 and response.get("role") == "admin":
            self.log_test("JWT Token Validation", True, f"Token valid for user: {response.get('username')}")
            return True
        else:
            self.log_test("JWT Token Validation", False, f"Status: {status_code}", response)
        return False
    
    def test_create_sales_rep_user(self):
        """Test 3: Create sales rep user (admin only)"""
        if not self.admin_token:
            self.log_test("Create Sales Rep User", False, "No admin token available")
            return False
        
        import time
        timestamp = str(int(time.time()))
        sales_rep_data = {
            "username": f"sales_rep_{timestamp}",
            "email": f"salesrep_{timestamp}@test.com",
            "password": "salesrep123",
            "role": "sales_rep",
            "full_name": "مندوب المبيعات التجريبي",
            "phone": "+966501111111",
            "managed_by": getattr(self, 'manager_id', None)  # Link to manager if available
        }
        
        status_code, response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        
        if status_code == 200:
            self.sales_rep_id = response.get('user_id')
            self.log_test("Create Sales Rep User", True, f"User created with ID: {self.sales_rep_id}")
            
            # Login as sales rep
            login_data = {"username": f"sales_rep_{timestamp}", "password": "salesrep123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.sales_rep_token = login_response["token"]
            return True
        else:
            self.log_test("Create Sales Rep User", False, f"Status: {status_code}", response)
        return False
    
    def test_create_manager_user(self):
        """Test 4: Create manager user (admin only)"""
        if not self.admin_token:
            self.log_test("Create Manager User", False, "No admin token available")
            return False
        
        import time
        timestamp = str(int(time.time()))
        manager_data = {
            "username": f"manager_{timestamp}",
            "email": f"manager_{timestamp}@test.com",
            "password": "manager123",
            "role": "manager",
            "full_name": "مدير التجريبي",
            "phone": "+966502222222"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        
        if status_code == 200:
            self.manager_id = response.get('user_id')
            self.log_test("Create Manager User", True, f"Manager created with ID: {self.manager_id}")
            
            # Login as manager
            login_data = {"username": f"manager_{timestamp}", "password": "manager123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.manager_token = login_response["token"]
            return True
        else:
            self.log_test("Create Manager User", False, f"Status: {status_code}", response)
        return False
    
    def test_role_based_access(self):
        """Test 5: Role-based access control"""
        if not self.sales_rep_token:
            self.log_test("Role-based Access Control", False, "No sales rep token available")
            return False
        
        # Try to create user as sales rep (should fail)
        user_data = {
            "username": "unauthorized_user",
            "email": "unauth@test.com",
            "password": "test123",
            "role": "sales_rep",
            "full_name": "Unauthorized User"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", user_data, self.sales_rep_token)
        
        if status_code == 403:
            self.log_test("Role-based Access Control", True, "Sales rep correctly denied admin privileges")
            return True
        else:
            self.log_test("Role-based Access Control", False, f"Expected 403, got {status_code}", response)
        return False
    
    def test_create_clinic(self):
        """Test 6: Create clinic with GPS coordinates"""
        if not self.sales_rep_token:
            self.log_test("Create Clinic", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("POST", "/clinics", TEST_CLINIC_DATA, self.sales_rep_token)
        
        if status_code == 200 and "clinic_id" in response:
            self.test_clinic_id = response["clinic_id"]
            self.log_test("Create Clinic", True, f"Clinic created with ID: {self.test_clinic_id}")
            return True
        else:
            self.log_test("Create Clinic", False, f"Status: {status_code}", response)
        return False
    
    def test_get_clinics(self):
        """Test 7: Get clinics list"""
        if not self.sales_rep_token:
            self.log_test("Get Clinics List", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/clinics", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(response, list):
            clinic_found = any(clinic.get("id") == self.test_clinic_id for clinic in response)
            if clinic_found:
                self.log_test("Get Clinics List", True, f"Found {len(response)} clinics including test clinic")
                return True
            else:
                self.log_test("Get Clinics List", False, "Test clinic not found in list")
        else:
            self.log_test("Get Clinics List", False, f"Status: {status_code}", response)
        return False
    
    def test_approve_clinic(self):
        """Test 8: Admin approve clinic"""
        if not self.admin_token or not self.test_clinic_id:
            self.log_test("Approve Clinic", False, "Missing admin token or clinic ID")
            return False
        
        status_code, response = self.make_request("PATCH", f"/clinics/{self.test_clinic_id}/approve", token=self.admin_token)
        
        if status_code == 200:
            self.log_test("Approve Clinic", True, "Clinic approved successfully")
            return True
        else:
            self.log_test("Approve Clinic", False, f"Status: {status_code}", response)
        return False
    
    def test_create_doctor(self):
        """Test 9: Create doctor linked to clinic"""
        if not self.sales_rep_token or not self.test_clinic_id:
            self.log_test("Create Doctor", False, "Missing sales rep token or clinic ID")
            return False
        
        doctor_data = {**TEST_DOCTOR_DATA, "clinic_id": self.test_clinic_id}
        status_code, response = self.make_request("POST", "/doctors", doctor_data, self.sales_rep_token)
        
        if status_code == 200 and "doctor_id" in response:
            self.test_doctor_id = response["doctor_id"]
            self.log_test("Create Doctor", True, f"Doctor created with ID: {self.test_doctor_id}")
            return True
        else:
            self.log_test("Create Doctor", False, f"Status: {status_code}", response)
        return False
    
    def test_get_doctors(self):
        """Test 10: Get doctors list"""
        if not self.sales_rep_token:
            self.log_test("Get Doctors List", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/doctors", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(response, list):
            doctor_found = any(doctor.get("id") == self.test_doctor_id for doctor in response)
            if doctor_found:
                self.log_test("Get Doctors List", True, f"Found {len(response)} doctors including test doctor")
                return True
            else:
                self.log_test("Get Doctors List", False, "Test doctor not found in list")
        else:
            self.log_test("Get Doctors List", False, f"Status: {status_code}", response)
        return False
    
    def test_approve_doctor(self):
        """Test 11: Admin approve doctor"""
        if not self.admin_token or not self.test_doctor_id:
            self.log_test("Approve Doctor", False, "Missing admin token or doctor ID")
            return False
        
        status_code, response = self.make_request("PATCH", f"/doctors/{self.test_doctor_id}/approve", token=self.admin_token)
        
        if status_code == 200:
            self.log_test("Approve Doctor", True, "Doctor approved successfully")
            return True
        else:
            self.log_test("Approve Doctor", False, f"Status: {status_code}", response)
        return False
    
    def test_visit_within_geofence(self):
        """Test 12: Create visit within 20m geofence (should succeed)"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Visit Within Geofence", False, "Missing required tokens or IDs")
            return False
        
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": NEAR_CLINIC["latitude"],
            "longitude": NEAR_CLINIC["longitude"],
            "notes": "زيارة تجريبية ضمن النطاق المسموح"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 200:
            self.log_test("Visit Within Geofence", True, f"Visit created successfully: {response.get('visit_id')}")
            return True
        else:
            self.log_test("Visit Within Geofence", False, f"Status: {status_code}", response)
        return False
    
    def test_visit_outside_geofence(self):
        """Test 13: Create visit outside 20m geofence (should fail)"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Visit Outside Geofence", False, "Missing required tokens or IDs")
            return False
        
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": FAR_FROM_CLINIC["latitude"],
            "longitude": FAR_FROM_CLINIC["longitude"],
            "notes": "زيارة تجريبية خارج النطاق المسموح"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 400 and "20 meters" in response.get("detail", ""):
            self.log_test("Visit Outside Geofence", True, f"Visit correctly rejected: {response.get('detail')}")
            return True
        else:
            self.log_test("Visit Outside Geofence", False, f"Expected 400 with distance error, got {status_code}", response)
        return False
    
    def test_duplicate_visit_prevention(self):
        """Test 14: Prevent duplicate visits on same day"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Duplicate Visit Prevention", False, "Missing required tokens or IDs")
            return False
        
        # Try to create another visit for the same doctor today
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": NEAR_CLINIC["latitude"],
            "longitude": NEAR_CLINIC["longitude"],
            "notes": "محاولة زيارة مكررة"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 400 and "already registered" in response.get("detail", ""):
            self.log_test("Duplicate Visit Prevention", True, f"Duplicate visit correctly prevented: {response.get('detail')}")
            return True
        else:
            self.log_test("Duplicate Visit Prevention", False, f"Expected 400 with duplicate error, got {status_code}", response)
        return False
    
    def test_get_visits(self):
        """Test 15: Get visits list"""
        if not self.sales_rep_token:
            self.log_test("Get Visits List", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/visits", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(response, list):
            if len(response) > 0:
                visit = response[0]
                required_fields = ["doctor_name", "clinic_name", "sales_rep_name"]
                if all(field in visit for field in required_fields):
                    self.log_test("Get Visits List", True, f"Found {len(response)} visits with enriched data")
                    return True
                else:
                    self.log_test("Get Visits List", False, "Missing enriched fields in visit data")
            else:
                self.log_test("Get Visits List", True, "No visits found (expected after successful creation)")
                return True
        else:
            self.log_test("Get Visits List", False, f"Status: {status_code}", response)
        return False
    
    def test_visit_review_by_manager(self):
        """Test 16: Manager review visit effectiveness"""
        if not self.manager_token:
            self.log_test("Visit Review by Manager", False, "No manager token available")
            return False
        
        # First get visits as manager
        status_code, visits = self.make_request("GET", "/visits", token=self.manager_token)
        
        if status_code == 200 and len(visits) > 0:
            visit_id = visits[0]["id"]
            
            # Use PATCH with query parameter for is_effective
            url = f"/visits/{visit_id}/review?is_effective=true"
            status_code, response = self.make_request("PATCH", url, {}, self.manager_token)
            
            if status_code == 200:
                self.log_test("Visit Review by Manager", True, "Visit reviewed successfully")
                return True
            else:
                self.log_test("Visit Review by Manager", False, f"Status: {status_code}", response)
        else:
            self.log_test("Visit Review by Manager", False, "No visits available for review")
        return False
    
    def test_admin_dashboard_stats(self):
        """Test 17: Admin dashboard statistics"""
        if not self.admin_token:
            self.log_test("Admin Dashboard Stats", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/dashboard/stats", token=self.admin_token)
        
        if status_code == 200:
            required_stats = ["total_users", "total_clinics", "total_doctors", "total_visits"]
            if all(stat in response for stat in required_stats):
                self.log_test("Admin Dashboard Stats", True, f"Stats: {response}")
                return True
            else:
                self.log_test("Admin Dashboard Stats", False, "Missing required statistics")
        else:
            self.log_test("Admin Dashboard Stats", False, f"Status: {status_code}", response)
        return False
    
    def test_sales_rep_dashboard_stats(self):
        """Test 18: Sales rep dashboard statistics"""
        if not self.sales_rep_token:
            self.log_test("Sales Rep Dashboard Stats", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/dashboard/stats", token=self.sales_rep_token)
        
        if status_code == 200:
            required_stats = ["total_visits", "total_clinics", "total_doctors", "today_visits"]
            if all(stat in response for stat in required_stats):
                self.log_test("Sales Rep Dashboard Stats", True, f"Stats: {response}")
                return True
            else:
                self.log_test("Sales Rep Dashboard Stats", False, "Missing required statistics")
        else:
            self.log_test("Sales Rep Dashboard Stats", False, f"Status: {status_code}", response)
        return False
    
    def test_manager_dashboard_stats(self):
        """Test 19: Manager dashboard statistics"""
        if not self.manager_token:
            self.log_test("Manager Dashboard Stats", False, "No manager token available")
            return False
        
        status_code, response = self.make_request("GET", "/dashboard/stats", token=self.manager_token)
        
        if status_code == 200:
            required_stats = ["pending_reviews", "total_visits"]
            if all(stat in response for stat in required_stats):
                self.log_test("Manager Dashboard Stats", True, f"Stats: {response}")
                return True
            else:
                self.log_test("Manager Dashboard Stats", False, "Missing required statistics")
        else:
            self.log_test("Manager Dashboard Stats", False, f"Status: {status_code}", response)
        return False
    
    def test_distance_calculation(self):
        """Test 20: GPS distance calculation accuracy"""
        # Test the distance calculation logic by checking geofence responses
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Distance Calculation", False, "Missing required tokens or IDs")
            return False
        
        # Test with coordinates exactly 25m away (should fail)
        # Using approximate coordinates that are ~25m from clinic
        far_coords = {"latitude": 24.7138, "longitude": 46.6755}
        
        visit_data = {
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "latitude": far_coords["latitude"],
            "longitude": far_coords["longitude"],
            "notes": "اختبار حساب المسافة"
        }
        
        status_code, response = self.make_request("POST", "/visits", visit_data, self.sales_rep_token)
        
        if status_code == 400 and "distance" in response.get("detail", "").lower():
            distance_info = response.get("detail", "")
            self.log_test("Distance Calculation", True, f"Distance calculation working: {distance_info}")
            return True
        else:
            self.log_test("Distance Calculation", False, f"Expected distance error, got {status_code}", response)
        return False

    def test_enhanced_sales_rep_stats(self):
        """Test 21: Enhanced sales rep detailed statistics API"""
        if not self.sales_rep_token:
            self.log_test("Enhanced Sales Rep Stats", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/dashboard/sales-rep-stats", token=self.sales_rep_token)
        
        if status_code == 200:
            # Check for required structure
            required_sections = ["visits", "total_clinics_added", "total_doctors_added", "pending"]
            if all(section in response for section in required_sections):
                # Check visits breakdown
                visits = response.get("visits", {})
                required_visit_stats = ["today", "week", "month", "total"]
                if all(stat in visits for stat in required_visit_stats):
                    # Check pending section
                    pending = response.get("pending", {})
                    required_pending = ["visits", "clinic_requests", "orders"]
                    if all(item in pending for item in required_pending):
                        self.log_test("Enhanced Sales Rep Stats", True, f"Complete stats structure: {response}")
                        return True
                    else:
                        self.log_test("Enhanced Sales Rep Stats", False, "Missing pending statistics")
                else:
                    self.log_test("Enhanced Sales Rep Stats", False, "Missing visit breakdown statistics")
            else:
                self.log_test("Enhanced Sales Rep Stats", False, "Missing required statistics sections")
        else:
            self.log_test("Enhanced Sales Rep Stats", False, f"Status: {status_code}", response)
        return False

    def test_create_clinic_request(self):
        """Test 22: Create clinic request (sales rep only)"""
        if not self.sales_rep_token:
            self.log_test("Create Clinic Request", False, "No sales rep token available")
            return False
        
        clinic_request_data = {
            "clinic_name": "عيادة الدكتور سالم الجديدة",
            "clinic_phone": "+966501234567",
            "doctor_name": "د. سالم الأحمد",
            "doctor_specialty": "طب الأسرة",
            "doctor_address": "شارع الأمير محمد بن عبدالعزيز",
            "clinic_manager_name": "أحمد المدير",
            "latitude": 24.7136,
            "longitude": 46.6753,
            "address": "الرياض، حي الملز",
            "clinic_image": None,  # Optional base64 image
            "notes": "عيادة جديدة تحتاج موافقة"
        }
        
        status_code, response = self.make_request("POST", "/clinic-requests", clinic_request_data, self.sales_rep_token)
        
        if status_code == 200 and "request_id" in response:
            self.test_clinic_request_id = response["request_id"]
            self.log_test("Create Clinic Request", True, f"Clinic request created with ID: {self.test_clinic_request_id}")
            return True
        else:
            self.log_test("Create Clinic Request", False, f"Status: {status_code}", response)
        return False

    def test_get_clinic_requests(self):
        """Test 23: Get clinic requests list"""
        if not self.sales_rep_token:
            self.log_test("Get Clinic Requests", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/clinic-requests", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(response, list):
            if len(response) > 0:
                request = response[0]
                required_fields = ["clinic_name", "doctor_name", "status", "sales_rep_name"]
                if all(field in request for field in required_fields):
                    self.log_test("Get Clinic Requests", True, f"Found {len(response)} requests with enriched data")
                    return True
                else:
                    self.log_test("Get Clinic Requests", False, "Missing required fields in request data")
            else:
                self.log_test("Get Clinic Requests", True, "No clinic requests found (expected if none created)")
                return True
        else:
            self.log_test("Get Clinic Requests", False, f"Status: {status_code}", response)
        return False

    def test_manager_review_clinic_request(self):
        """Test 24: Manager review and approve clinic request"""
        if not self.manager_token:
            self.log_test("Manager Review Clinic Request", False, "No manager token available")
            return False
        
        # First get clinic requests as manager
        status_code, requests = self.make_request("GET", "/clinic-requests", token=self.manager_token)
        
        if status_code == 200 and len(requests) > 0:
            request_id = requests[0]["id"]
            
            # Approve the request
            status_code, response = self.make_request("PATCH", f"/clinic-requests/{request_id}/review?approved=true", {}, self.manager_token)
            
            if status_code == 200:
                self.log_test("Manager Review Clinic Request", True, "Clinic request approved successfully")
                return True
            else:
                self.log_test("Manager Review Clinic Request", False, f"Status: {status_code}", response)
        else:
            self.log_test("Manager Review Clinic Request", False, "No clinic requests available for review")
        return False

    def test_clinic_request_role_restrictions(self):
        """Test 25: Only sales reps can create clinic requests"""
        if not self.manager_token:
            self.log_test("Clinic Request Role Restrictions", False, "No manager token available")
            return False
        
        clinic_request_data = {
            "clinic_name": "عيادة غير مسموحة",
            "doctor_name": "د. غير مسموح",
            "doctor_specialty": "طب عام",
            "doctor_address": "عنوان تجريبي",
            "clinic_manager_name": "مدير تجريبي",
            "latitude": 24.7136,
            "longitude": 46.6753,
            "address": "الرياض",
            "notes": "طلب من مدير (يجب أن يفشل)"
        }
        
        status_code, response = self.make_request("POST", "/clinic-requests", clinic_request_data, self.manager_token)
        
        if status_code == 403:
            self.log_test("Clinic Request Role Restrictions", True, "Manager correctly denied clinic request creation")
            return True
        else:
            self.log_test("Clinic Request Role Restrictions", False, f"Expected 403, got {status_code}", response)
        return False

    def test_orders_api_exists(self):
        """Test 26: Check if orders API endpoint exists"""
        if not self.sales_rep_token:
            self.log_test("Orders API Exists", False, "No sales rep token available")
            return False
        
        # Try to get orders (should return empty list or proper response)
        status_code, response = self.make_request("GET", "/orders", token=self.sales_rep_token)
        
        # Accept 200 (working) or 404 (not implemented yet)
        if status_code == 200:
            self.log_test("Orders API Exists", True, f"Orders API working, found {len(response) if isinstance(response, list) else 0} orders")
            return True
        elif status_code == 404:
            self.log_test("Orders API Exists", False, "Orders API endpoint not implemented yet")
            return False
        else:
            self.log_test("Orders API Exists", False, f"Unexpected status: {status_code}", response)
        return False

    def test_create_order_demo(self):
        """Test 27: Create DEMO order"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Create DEMO Order", False, "Missing required tokens or IDs")
            return False
        
        # First need to get a visit ID
        status_code, visits = self.make_request("GET", "/visits", token=self.sales_rep_token)
        if status_code != 200 or len(visits) == 0:
            self.log_test("Create DEMO Order", False, "No visits available for order creation")
            return False
        
        visit_id = visits[0]["id"]
        
        # Get warehouses
        status_code, warehouses = self.make_request("GET", "/warehouses", token=self.sales_rep_token)
        if status_code != 200 or len(warehouses) == 0:
            self.log_test("Create DEMO Order", False, "No warehouses available")
            return False
        
        warehouse_id = warehouses[0]["id"]
        
        # Get products
        status_code, products = self.make_request("GET", "/products", token=self.sales_rep_token)
        if status_code != 200 or len(products) == 0:
            self.log_test("Create DEMO Order", False, "No products available")
            return False
        
        product_id = products[0]["id"]
        
        order_data = {
            "visit_id": visit_id,
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "warehouse_id": warehouse_id,
            "order_type": "DEMO",
            "items": [{"product_id": product_id, "quantity": 2}],
            "notes": "طلبية ديمو تجريبية"
        }
        
        status_code, response = self.make_request("POST", "/orders", order_data, self.sales_rep_token)
        
        if status_code == 200:
            self.log_test("Create DEMO Order", True, f"DEMO order created successfully")
            return True
        elif status_code == 404:
            self.log_test("Create DEMO Order", False, "Orders API not implemented yet")
            return False
        else:
            self.log_test("Create DEMO Order", False, f"Status: {status_code}", response)
        return False

    def test_create_order_sale(self):
        """Test 28: Create SALE order"""
        if not self.sales_rep_token or not self.test_doctor_id or not self.test_clinic_id:
            self.log_test("Create SALE Order", False, "Missing required tokens or IDs")
            return False
        
        # First need to get a visit ID
        status_code, visits = self.make_request("GET", "/visits", token=self.sales_rep_token)
        if status_code != 200 or len(visits) == 0:
            self.log_test("Create SALE Order", False, "No visits available for order creation")
            return False
        
        visit_id = visits[0]["id"]
        
        # Get warehouses
        status_code, warehouses = self.make_request("GET", "/warehouses", token=self.sales_rep_token)
        if status_code != 200 or len(warehouses) == 0:
            self.log_test("Create SALE Order", False, "No warehouses available")
            return False
        
        warehouse_id = warehouses[0]["id"]
        
        # Get products
        status_code, products = self.make_request("GET", "/products", token=self.sales_rep_token)
        if status_code != 200 or len(products) == 0:
            self.log_test("Create SALE Order", False, "No products available")
            return False
        
        product_id = products[0]["id"]
        
        order_data = {
            "visit_id": visit_id,
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "warehouse_id": warehouse_id,
            "order_type": "SALE",
            "items": [{"product_id": product_id, "quantity": 5}],
            "notes": "طلبية مبيعات تجريبية"
        }
        
        status_code, response = self.make_request("POST", "/orders", order_data, self.sales_rep_token)
        
        if status_code == 200:
            self.log_test("Create SALE Order", True, f"SALE order created successfully")
            return True
        elif status_code == 404:
            self.log_test("Create SALE Order", False, "Orders API not implemented yet")
            return False
        else:
            self.log_test("Create SALE Order", False, f"Status: {status_code}", response)
        return False

    # NEW ENHANCEMENT TESTS - Focus on the review request requirements
    
    def test_warehouse_manager_product_permissions(self):
        """Test 29: Warehouse managers cannot create/delete products without admin approval"""
        if not self.admin_token:
            self.log_test("Warehouse Manager Product Permissions", False, "No admin token available")
            return False
        
        # Create warehouse manager
        import time
        timestamp = str(int(time.time()))
        warehouse_manager_data = {
            "username": f"wh_mgr_test_{timestamp}",
            "email": f"whmgr_{timestamp}@test.com",
            "password": "whmgr123",
            "role": "warehouse_manager",
            "full_name": "مدير مخزن للاختبار",
            "phone": "+966504444444"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", warehouse_manager_data, self.admin_token)
        if status_code != 200:
            self.log_test("Warehouse Manager Product Permissions", False, "Failed to create warehouse manager")
            return False
        
        # Login as warehouse manager
        login_data = {"username": f"wh_mgr_test_{timestamp}", "password": "whmgr123"}
        status_code, login_response = self.make_request("POST", "/auth/login", login_data)
        if status_code != 200:
            self.log_test("Warehouse Manager Product Permissions", False, "Failed to login as warehouse manager")
            return False
        
        wh_manager_token = login_response["token"]
        
        # Try to create product as warehouse manager (should fail)
        product_data = {
            "name": "منتج غير مسموح",
            "description": "منتج من مدير المخزن",
            "price_before_discount": 100.0,
            "discount_percentage": 10.0,
            "category": "اختبار",
            "unit": "قطعة"
        }
        
        status_code, response = self.make_request("POST", "/products", product_data, wh_manager_token)
        
        if status_code == 403:
            self.log_test("Warehouse Manager Product Permissions", True, "Warehouse manager correctly denied product creation")
            return True
        else:
            self.log_test("Warehouse Manager Product Permissions", False, f"Expected 403, got {status_code}", response)
        return False

    def test_enhanced_product_model_egyptian_features(self):
        """Test 30: Enhanced product model with Egyptian features (EGP, images, discounts)"""
        if not self.admin_token:
            self.log_test("Enhanced Product Model Egyptian Features", False, "No admin token available")
            return False
        
        # Test product creation with Egyptian features
        product_data = {
            "name": "دواء مصري محسن",
            "description": "دواء بالمميزات المصرية الجديدة",
            "price_before_discount": 150.0,
            "discount_percentage": 15.0,  # 15% discount
            "category": "أدوية مصرية",
            "unit": "علبة",
            "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="  # Minimal base64 image
        }
        
        status_code, response = self.make_request("POST", "/products", product_data, self.admin_token)
        
        if status_code == 200:
            product_id = response.get("product_id")
            
            # Verify product was created with correct features
            status_code, products = self.make_request("GET", "/products", token=self.admin_token)
            if status_code == 200:
                created_product = next((p for p in products if p.get("id") == product_id), None)
                if created_product:
                    # Check Egyptian features
                    expected_price = 150.0 * (1 - 15.0/100)  # 127.5 EGP after discount
                    checks = [
                        created_product.get("currency") == "EGP",
                        created_product.get("price_before_discount") == 150.0,
                        created_product.get("discount_percentage") == 15.0,
                        abs(created_product.get("price", 0) - expected_price) < 0.01,
                        created_product.get("image") is not None,
                        created_product.get("approved_by") is not None  # Admin approval
                    ]
                    
                    if all(checks):
                        self.log_test("Enhanced Product Model Egyptian Features", True, f"Product created with EGP currency, discount calculation, and admin approval")
                        return True
                    else:
                        self.log_test("Enhanced Product Model Egyptian Features", False, f"Missing Egyptian features: {created_product}")
                else:
                    self.log_test("Enhanced Product Model Egyptian Features", False, "Created product not found")
            else:
                self.log_test("Enhanced Product Model Egyptian Features", False, "Failed to retrieve products")
        else:
            self.log_test("Enhanced Product Model Egyptian Features", False, f"Status: {status_code}", response)
        return False

    def test_warehouse_statistics_api(self):
        """Test 31: New warehouse statistics API endpoint"""
        if not self.admin_token:
            self.log_test("Warehouse Statistics API", False, "No admin token available")
            return False
        
        # Create warehouse manager first
        import time
        timestamp = str(int(time.time()))
        warehouse_manager_data = {
            "username": f"wh_stats_mgr_{timestamp}",
            "email": f"whstats_{timestamp}@test.com",
            "password": "whstats123",
            "role": "warehouse_manager",
            "full_name": "مدير مخزن للإحصائيات",
            "phone": "+966505555555"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", warehouse_manager_data, self.admin_token)
        if status_code != 200:
            self.log_test("Warehouse Statistics API", False, "Failed to create warehouse manager")
            return False
        
        warehouse_manager_id = response.get('user_id')
        
        # Login as warehouse manager
        login_data = {"username": f"wh_stats_mgr_{timestamp}", "password": "whstats123"}
        status_code, login_response = self.make_request("POST", "/auth/login", login_data)
        if status_code != 200:
            self.log_test("Warehouse Statistics API", False, "Failed to login as warehouse manager")
            return False
        
        wh_manager_token = login_response["token"]
        
        # Create a warehouse for this manager
        warehouse_data = {
            "name": "مخزن الإحصائيات",
            "location": "القاهرة",
            "address": "شارع التحرير، القاهرة",
            "manager_id": warehouse_manager_id,
            "warehouse_number": 3
        }
        
        status_code, response = self.make_request("POST", "/warehouses", warehouse_data, self.admin_token)
        if status_code != 200:
            self.log_test("Warehouse Statistics API", False, "Failed to create warehouse")
            return False
        
        # Test warehouse statistics API
        status_code, response = self.make_request("GET", "/dashboard/warehouse-stats", token=wh_manager_token)
        
        if status_code == 200:
            required_fields = [
                "total_warehouses", "available_products", "orders", 
                "total_products", "low_stock_products", "withdrawn_products",
                "product_categories", "warehouses"
            ]
            
            orders_fields = ["today", "week", "month"]
            
            if all(field in response for field in required_fields):
                orders = response.get("orders", {})
                if all(field in orders for field in orders_fields):
                    self.log_test("Warehouse Statistics API", True, f"Complete warehouse statistics: {response}")
                    return True
                else:
                    self.log_test("Warehouse Statistics API", False, "Missing orders breakdown fields")
            else:
                self.log_test("Warehouse Statistics API", False, f"Missing required fields: {response}")
        else:
            self.log_test("Warehouse Statistics API", False, f"Status: {status_code}", response)
        return False

    def test_pending_orders_api(self):
        """Test 32: New pending orders API endpoint"""
        if not self.admin_token:
            self.log_test("Pending Orders API", False, "No admin token available")
            return False
        
        # Create warehouse manager
        import time
        timestamp = str(int(time.time()))
        warehouse_manager_data = {
            "username": f"wh_pending_mgr_{timestamp}",
            "email": f"whpending_{timestamp}@test.com",
            "password": "whpending123",
            "role": "warehouse_manager",
            "full_name": "مدير مخزن للطلبات المعلقة",
            "phone": "+966506666666"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", warehouse_manager_data, self.admin_token)
        if status_code != 200:
            self.log_test("Pending Orders API", False, "Failed to create warehouse manager")
            return False
        
        warehouse_manager_id = response.get('user_id')
        
        # Login as warehouse manager
        login_data = {"username": f"wh_pending_mgr_{timestamp}", "password": "whpending123"}
        status_code, login_response = self.make_request("POST", "/auth/login", login_data)
        if status_code != 200:
            self.log_test("Pending Orders API", False, "Failed to login as warehouse manager")
            return False
        
        wh_manager_token = login_response["token"]
        
        # Test pending orders API
        status_code, response = self.make_request("GET", "/orders/pending", token=wh_manager_token)
        
        if status_code == 200:
            if isinstance(response, list):
                # Check if any orders exist and have required enriched fields
                if len(response) > 0:
                    order = response[0]
                    required_fields = [
                        "sales_rep_name", "doctor_name", "clinic_name", 
                        "warehouse_name", "manager_approved", "items"
                    ]
                    
                    if all(field in order for field in required_fields):
                        # Check items have product details
                        if len(order.get("items", [])) > 0:
                            item = order["items"][0]
                            item_fields = ["product_name", "product_unit"]
                            if all(field in item for field in item_fields):
                                self.log_test("Pending Orders API", True, f"Found {len(response)} pending orders with enriched data")
                                return True
                            else:
                                self.log_test("Pending Orders API", False, "Missing product details in order items")
                        else:
                            self.log_test("Pending Orders API", True, "No items in pending orders (expected)")
                            return True
                    else:
                        self.log_test("Pending Orders API", False, f"Missing enriched fields: {order}")
                else:
                    self.log_test("Pending Orders API", True, "No pending orders found (expected)")
                    return True
            else:
                self.log_test("Pending Orders API", False, "Response is not a list")
        else:
            self.log_test("Pending Orders API", False, f"Status: {status_code}", response)
        return False

    def test_warehouse_movement_history_api(self):
        """Test 33: New warehouse movement history API endpoint"""
        if not self.admin_token:
            self.log_test("Warehouse Movement History API", False, "No admin token available")
            return False
        
        # Get existing warehouses
        status_code, warehouses = self.make_request("GET", "/warehouses", token=self.admin_token)
        if status_code != 200 or len(warehouses) == 0:
            self.log_test("Warehouse Movement History API", False, "No warehouses available")
            return False
        
        warehouse_id = warehouses[0]["id"]
        
        # Test warehouse movements API
        status_code, response = self.make_request("GET", f"/warehouses/{warehouse_id}/movements", token=self.admin_token)
        
        if status_code == 200:
            if isinstance(response, list):
                # Check if movements have enriched data
                if len(response) > 0:
                    movement = response[0]
                    required_fields = [
                        "product_name", "product_unit", "created_by_name",
                        "movement_type", "quantity", "reason", "created_at"
                    ]
                    
                    if all(field in movement for field in required_fields):
                        self.log_test("Warehouse Movement History API", True, f"Found {len(response)} movements with enriched data")
                        return True
                    else:
                        self.log_test("Warehouse Movement History API", False, f"Missing enriched fields: {movement}")
                else:
                    self.log_test("Warehouse Movement History API", True, "No movements found (expected for new warehouse)")
                    return True
            else:
                self.log_test("Warehouse Movement History API", False, "Response is not a list")
        else:
            self.log_test("Warehouse Movement History API", False, f"Status: {status_code}", response)
        return False

    def test_warehouse_number_field(self):
        """Test 34: Updated warehouse model with warehouse_number field (1-5)"""
        if not self.admin_token:
            self.log_test("Warehouse Number Field", False, "No admin token available")
            return False
        
        # Create warehouse manager
        import time
        timestamp = str(int(time.time()))
        warehouse_manager_data = {
            "username": f"wh_num_mgr_{timestamp}",
            "email": f"whnum_{timestamp}@test.com",
            "password": "whnum123",
            "role": "warehouse_manager",
            "full_name": "مدير مخزن لاختبار الرقم",
            "phone": "+966507777777"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", warehouse_manager_data, self.admin_token)
        if status_code != 200:
            self.log_test("Warehouse Number Field", False, "Failed to create warehouse manager")
            return False
        
        warehouse_manager_id = response.get('user_id')
        
        # Test valid warehouse number (1-5)
        warehouse_data = {
            "name": "مخزن رقم 4",
            "location": "الإسكندرية",
            "address": "شارع الكورنيش، الإسكندرية",
            "manager_id": warehouse_manager_id,
            "warehouse_number": 4
        }
        
        status_code, response = self.make_request("POST", "/warehouses", warehouse_data, self.admin_token)
        
        if status_code == 200:
            warehouse_id = response.get("warehouse_id")
            
            # Verify warehouse was created with correct number
            status_code, warehouses = self.make_request("GET", "/warehouses", token=self.admin_token)
            if status_code == 200:
                created_warehouse = next((w for w in warehouses if w.get("id") == warehouse_id), None)
                if created_warehouse and created_warehouse.get("warehouse_number") == 4:
                    # Test invalid warehouse number (should fail)
                    invalid_warehouse_data = {
                        "name": "مخزن رقم غير صحيح",
                        "location": "القاهرة",
                        "address": "شارع النيل، القاهرة",
                        "manager_id": warehouse_manager_id,
                        "warehouse_number": 6  # Invalid (should be 1-5)
                    }
                    
                    status_code, response = self.make_request("POST", "/warehouses", invalid_warehouse_data, self.admin_token)
                    
                    if status_code == 400:
                        self.log_test("Warehouse Number Field", True, "Warehouse number validation working (1-5 range enforced)")
                        return True
                    else:
                        self.log_test("Warehouse Number Field", False, f"Invalid warehouse number not rejected: {status_code}")
                else:
                    self.log_test("Warehouse Number Field", False, "Warehouse number not saved correctly")
            else:
                self.log_test("Warehouse Number Field", False, "Failed to retrieve warehouses")
        else:
            self.log_test("Warehouse Number Field", False, f"Status: {status_code}", response)
        return False

    def test_role_access_restrictions(self):
        """Test 35: Verify role-based access restrictions for new APIs"""
        if not self.sales_rep_token:
            self.log_test("Role Access Restrictions", False, "No sales rep token available")
            return False
        
        # Test that sales rep cannot access warehouse statistics
        status_code, response = self.make_request("GET", "/dashboard/warehouse-stats", token=self.sales_rep_token)
        
        if status_code == 403:
            # Test that sales rep cannot access pending orders
            status_code, response = self.make_request("GET", "/orders/pending", token=self.sales_rep_token)
            
            if status_code == 403:
                # Test that sales rep cannot access warehouse movements
                status_code, warehouses = self.make_request("GET", "/warehouses", token=self.admin_token)
                if status_code == 200 and len(warehouses) > 0:
                    warehouse_id = warehouses[0]["id"]
                    status_code, response = self.make_request("GET", f"/warehouses/{warehouse_id}/movements", token=self.sales_rep_token)
                    
                    if status_code == 403:
                        self.log_test("Role Access Restrictions", True, "Sales rep correctly denied access to warehouse APIs")
                        return True
                    else:
                        self.log_test("Role Access Restrictions", False, f"Sales rep not denied warehouse movements access: {status_code}")
                else:
                    self.log_test("Role Access Restrictions", False, "No warehouses available for testing")
            else:
                self.log_test("Role Access Restrictions", False, f"Sales rep not denied pending orders access: {status_code}")
        else:
            self.log_test("Role Access Restrictions", False, f"Sales rep not denied warehouse stats access: {status_code}")
        return False
    
    def setup_test_products_and_warehouses(self):
        """Setup: Create test products and warehouses for order testing"""
        if not self.admin_token:
            self.log_test("Setup Test Data", False, "No admin token available")
            return False
        
        # Create a warehouse manager first
        import time
        timestamp = str(int(time.time()))
        warehouse_manager_data = {
            "username": f"warehouse_mgr_{timestamp}",
            "email": f"warehouse_{timestamp}@test.com",
            "password": "warehouse123",
            "role": "warehouse_manager",
            "full_name": "مدير المخزن التجريبي",
            "phone": "+966503333333"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", warehouse_manager_data, self.admin_token)
        if status_code != 200:
            self.log_test("Setup Test Data", False, "Failed to create warehouse manager")
            return False
        
        warehouse_manager_id = response.get('user_id')
        
        # Create a test warehouse
        warehouse_data = {
            "name": "مخزن الرياض الرئيسي",
            "location": "الرياض",
            "address": "شارع الملك فهد، الرياض",
            "manager_id": warehouse_manager_id
        }
        
        status_code, response = self.make_request("POST", "/warehouses", warehouse_data, self.admin_token)
        if status_code != 200:
            self.log_test("Setup Test Data", False, "Failed to create warehouse")
            return False
        
        # Create test products
        products = [
            {
                "name": "دواء الضغط",
                "description": "دواء لعلاج ضغط الدم المرتفع",
                "price": 50.0,
                "category": "أدوية القلب",
                "unit": "علبة"
            },
            {
                "name": "فيتامين د",
                "description": "مكمل غذائي فيتامين د",
                "price": 25.0,
                "category": "فيتامينات",
                "unit": "زجاجة"
            }
        ]
        
        created_products = 0
        for product in products:
            status_code, response = self.make_request("POST", "/products", product, self.admin_token)
            if status_code == 200:
                created_products += 1
        
        if created_products > 0:
            self.log_test("Setup Test Data", True, f"Created {created_products} products and 1 warehouse")
            return True
        else:
            self.log_test("Setup Test Data", False, "Failed to create products")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend Testing")
        print("=" * 60)
        
        # Authentication Tests
        print("🔐 AUTHENTICATION TESTS")
        print("-" * 30)
        self.test_admin_login()
        self.test_jwt_token_validation()
        self.test_create_manager_user()  # Create manager first
        self.test_create_sales_rep_user()  # Then sales rep with proper hierarchy
        self.test_role_based_access()
        
        # Setup Test Data
        print("🔧 SETUP TEST DATA")
        print("-" * 30)
        self.setup_test_products_and_warehouses()
        
        # Clinic Management Tests
        print("🏥 CLINIC MANAGEMENT TESTS")
        print("-" * 30)
        self.test_create_clinic()
        self.test_get_clinics()
        self.test_approve_clinic()
        
        # Doctor Management Tests
        print("👨‍⚕️ DOCTOR MANAGEMENT TESTS")
        print("-" * 30)
        self.test_create_doctor()
        self.test_get_doctors()
        self.test_approve_doctor()
        
        # Visit Management & GPS Tests
        print("📍 VISIT & GPS GEOFENCING TESTS")
        print("-" * 30)
        self.test_visit_within_geofence()
        self.test_visit_outside_geofence()
        self.test_duplicate_visit_prevention()
        self.test_get_visits()
        self.test_visit_review_by_manager()
        self.test_distance_calculation()
        
        # Dashboard Tests
        print("📊 DASHBOARD STATISTICS TESTS")
        print("-" * 30)
        self.test_admin_dashboard_stats()
        self.test_sales_rep_dashboard_stats()
        self.test_manager_dashboard_stats()
        
        # Enhanced Features Tests
        print("🆕 ENHANCED FEATURES TESTS")
        print("-" * 30)
        self.test_enhanced_sales_rep_stats()
        self.test_create_clinic_request()
        self.test_get_clinic_requests()
        self.test_manager_review_clinic_request()
        self.test_clinic_request_role_restrictions()
        
        # Orders System Tests
        print("📦 ORDERS SYSTEM TESTS")
        print("-" * 30)
        self.test_orders_api_exists()
        self.test_create_order_demo()
        self.test_create_order_sale()
        
        # Summary
        print("=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed, total

if __name__ == "__main__":
    tester = BackendTester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if passed == total else 1)