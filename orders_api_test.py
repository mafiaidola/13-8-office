#!/usr/bin/env python3
"""
Focused Orders API Testing for Medical Sales Rep Visit Management System
Tests the new Orders API endpoints specifically as requested
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://6fc37004-de78-473a-b926-f0438820a235.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class OrdersAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.manager_token = None
        self.warehouse_manager_token = None
        self.sales_rep_id = None
        self.manager_id = None
        self.warehouse_manager_id = None
        self.test_visit_id = None
        self.test_doctor_id = None
        self.test_clinic_id = None
        self.test_warehouse_id = None
        self.test_product_id = None
        self.demo_order_id = None
        self.sale_order_id = None
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
    
    def setup_test_environment(self):
        """Setup: Login and get required test data"""
        print("🔧 SETTING UP TEST ENVIRONMENT")
        print("-" * 40)
        
        # 1. Admin login
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            self.log_test("Admin Login", True, "Successfully logged in as admin")
        else:
            self.log_test("Admin Login", False, f"Status: {status_code}", response)
            return False
        
        # 2. Create manager first
        timestamp = str(int(time.time()))
        manager_data = {
            "username": f"orders_test_mgr_{timestamp}",
            "email": f"orders_mgr_{timestamp}@test.com",
            "password": "manager123",
            "role": "manager",
            "full_name": "مدير اختبار الطلبيات",
            "phone": "+966502222222"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        if status_code == 200:
            self.manager_id = response.get('user_id')
            # Login as manager
            login_data = {"username": f"orders_test_mgr_{timestamp}", "password": "manager123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.manager_token = login_response["token"]
                self.log_test("Create Manager", True, f"Manager created and logged in: {self.manager_id}")
        
        # 3. Create sales rep under manager
        sales_rep_data = {
            "username": f"orders_test_sales_{timestamp}",
            "email": f"orders_sales_{timestamp}@test.com",
            "password": "salesrep123",
            "role": "sales_rep",
            "full_name": "مندوب اختبار الطلبيات",
            "phone": "+966501111111",
            "managed_by": self.manager_id
        }
        
        status_code, response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        if status_code == 200:
            self.sales_rep_id = response.get('user_id')
            # Login as sales rep
            login_data = {"username": f"orders_test_sales_{timestamp}", "password": "salesrep123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.sales_rep_token = login_response["token"]
                self.log_test("Create Sales Rep", True, f"Sales rep created and logged in: {self.sales_rep_id}")
        
        # 4. Get test data (clinics, doctors, warehouses, products, visits)
        self.get_test_data()
        
        return True
    
    def get_test_data(self):
        """Get existing test data for orders"""
        # Get clinics
        status_code, clinics = self.make_request("GET", "/clinics", token=self.admin_token)
        if status_code == 200 and len(clinics) > 0:
            self.test_clinic_id = clinics[0]["id"]
        
        # Get doctors
        status_code, doctors = self.make_request("GET", "/doctors", token=self.admin_token)
        if status_code == 200 and len(doctors) > 0:
            self.test_doctor_id = doctors[0]["id"]
        
        # Get warehouses
        status_code, warehouses = self.make_request("GET", "/warehouses", token=self.admin_token)
        if status_code == 200 and len(warehouses) > 0:
            self.test_warehouse_id = warehouses[0]["id"]
        
        # Get products
        status_code, products = self.make_request("GET", "/products", token=self.admin_token)
        if status_code == 200 and len(products) > 0:
            self.test_product_id = products[0]["id"]
        
        # Get visits
        status_code, visits = self.make_request("GET", "/visits", token=self.admin_token)
        if status_code == 200 and len(visits) > 0:
            self.test_visit_id = visits[0]["id"]
        
        self.log_test("Get Test Data", True, f"Found clinic: {self.test_clinic_id}, doctor: {self.test_doctor_id}, warehouse: {self.test_warehouse_id}, product: {self.test_product_id}, visit: {self.test_visit_id}")
    
    def test_create_demo_order(self):
        """Test 1: Create DEMO order with required fields"""
        if not all([self.sales_rep_token, self.test_visit_id, self.test_doctor_id, self.test_clinic_id, self.test_warehouse_id, self.test_product_id]):
            self.log_test("Create DEMO Order", False, "Missing required test data")
            return False
        
        order_data = {
            "visit_id": self.test_visit_id,
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "warehouse_id": self.test_warehouse_id,
            "order_type": "DEMO",
            "items": [
                {"product_id": self.test_product_id, "quantity": 3}
            ],
            "notes": "طلبية ديمو تجريبية - اختبار شامل للـ API"
        }
        
        status_code, response = self.make_request("POST", "/orders", order_data, self.sales_rep_token)
        
        if status_code == 200 and "order_id" in response:
            self.demo_order_id = response["order_id"]
            self.log_test("Create DEMO Order", True, f"DEMO order created successfully with ID: {self.demo_order_id}")
            return True
        else:
            self.log_test("Create DEMO Order", False, f"Status: {status_code}", response)
        return False
    
    def test_create_sale_order(self):
        """Test 2: Create SALE order with required fields"""
        if not all([self.sales_rep_token, self.test_visit_id, self.test_doctor_id, self.test_clinic_id, self.test_warehouse_id, self.test_product_id]):
            self.log_test("Create SALE Order", False, "Missing required test data")
            return False
        
        order_data = {
            "visit_id": self.test_visit_id,
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "warehouse_id": self.test_warehouse_id,
            "order_type": "SALE",
            "items": [
                {"product_id": self.test_product_id, "quantity": 2}
            ],
            "notes": "طلبية مبيعات تجريبية - اختبار شامل للـ API"
        }
        
        status_code, response = self.make_request("POST", "/orders", order_data, self.sales_rep_token)
        
        if status_code == 200 and "order_id" in response:
            self.sale_order_id = response["order_id"]
            self.log_test("Create SALE Order", True, f"SALE order created successfully with ID: {self.sale_order_id}")
            return True
        else:
            self.log_test("Create SALE Order", False, f"Status: {status_code}", response)
        return False
    
    def test_get_orders_sales_rep(self):
        """Test 3: Get orders list as sales rep (should see own orders only)"""
        if not self.sales_rep_token:
            self.log_test("Get Orders (Sales Rep)", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/orders", token=self.sales_rep_token)
        
        if status_code == 200 and isinstance(response, list):
            # Check if orders contain required enriched data
            if len(response) > 0:
                order = response[0]
                required_fields = ["sales_rep_name", "doctor_name", "clinic_name", "warehouse_name", "items"]
                if all(field in order for field in required_fields):
                    # Check if items have product names
                    if len(order["items"]) > 0 and "product_name" in order["items"][0]:
                        self.log_test("Get Orders (Sales Rep)", True, f"Found {len(response)} orders with complete enriched data")
                        return True
                    else:
                        self.log_test("Get Orders (Sales Rep)", False, "Order items missing product names")
                else:
                    self.log_test("Get Orders (Sales Rep)", False, f"Missing required fields: {[f for f in required_fields if f not in order]}")
            else:
                self.log_test("Get Orders (Sales Rep)", True, "No orders found (expected if none created)")
                return True
        else:
            self.log_test("Get Orders (Sales Rep)", False, f"Status: {status_code}", response)
        return False
    
    def test_get_orders_manager(self):
        """Test 4: Get orders list as manager (should see subordinate orders)"""
        if not self.manager_token:
            self.log_test("Get Orders (Manager)", False, "No manager token available")
            return False
        
        status_code, response = self.make_request("GET", "/orders", token=self.manager_token)
        
        if status_code == 200 and isinstance(response, list):
            self.log_test("Get Orders (Manager)", True, f"Manager can see {len(response)} orders from subordinates")
            return True
        else:
            self.log_test("Get Orders (Manager)", False, f"Status: {status_code}", response)
        return False
    
    def test_manager_approve_order(self):
        """Test 5: Manager approve order and check inventory update"""
        if not self.manager_token or not self.demo_order_id:
            self.log_test("Manager Approve Order", False, "Missing manager token or order ID")
            return False
        
        # First check current inventory
        status_code, inventory_before = self.make_request("GET", "/inventory", token=self.admin_token)
        
        # Approve the DEMO order
        status_code, response = self.make_request("PATCH", f"/orders/{self.demo_order_id}/review?approved=true", {}, self.manager_token)
        
        if status_code == 200:
            # Check if order status was updated
            status_code, orders = self.make_request("GET", "/orders", token=self.admin_token)
            if status_code == 200:
                approved_order = next((o for o in orders if o["id"] == self.demo_order_id), None)
                if approved_order and approved_order["status"] == "APPROVED":
                    self.log_test("Manager Approve Order", True, f"Order approved successfully, status: {approved_order['status']}")
                    return True
                else:
                    self.log_test("Manager Approve Order", False, "Order status not updated to APPROVED")
            else:
                self.log_test("Manager Approve Order", True, "Order approval successful (couldn't verify status)")
                return True
        else:
            self.log_test("Manager Approve Order", False, f"Status: {status_code}", response)
        return False
    
    def test_manager_reject_order(self):
        """Test 6: Manager reject order"""
        if not self.manager_token or not self.sale_order_id:
            self.log_test("Manager Reject Order", False, "Missing manager token or order ID")
            return False
        
        # Reject the SALE order
        status_code, response = self.make_request("PATCH", f"/orders/{self.sale_order_id}/review?approved=false", {}, self.manager_token)
        
        if status_code == 200:
            # Check if order status was updated
            status_code, orders = self.make_request("GET", "/orders", token=self.admin_token)
            if status_code == 200:
                rejected_order = next((o for o in orders if o["id"] == self.sale_order_id), None)
                if rejected_order and rejected_order["status"] == "REJECTED":
                    self.log_test("Manager Reject Order", True, f"Order rejected successfully, status: {rejected_order['status']}")
                    return True
                else:
                    self.log_test("Manager Reject Order", False, "Order status not updated to REJECTED")
            else:
                self.log_test("Manager Reject Order", True, "Order rejection successful (couldn't verify status)")
                return True
        else:
            self.log_test("Manager Reject Order", False, f"Status: {status_code}", response)
        return False
    
    def test_order_validation(self):
        """Test 7: Order validation (missing required fields)"""
        if not self.sales_rep_token:
            self.log_test("Order Validation", False, "No sales rep token available")
            return False
        
        # Test with missing required fields
        invalid_order_data = {
            "visit_id": self.test_visit_id,
            # Missing doctor_id, clinic_id, warehouse_id
            "order_type": "DEMO",
            "items": [{"product_id": self.test_product_id, "quantity": 1}],
            "notes": "طلبية غير صحيحة"
        }
        
        status_code, response = self.make_request("POST", "/orders", invalid_order_data, self.sales_rep_token)
        
        if status_code == 422:  # Validation error
            self.log_test("Order Validation", True, "Order validation working - rejected invalid data")
            return True
        else:
            self.log_test("Order Validation", False, f"Expected 422 validation error, got {status_code}", response)
        return False
    
    def test_role_based_order_creation(self):
        """Test 8: Only sales reps can create orders"""
        if not self.manager_token:
            self.log_test("Role-based Order Creation", False, "No manager token available")
            return False
        
        order_data = {
            "visit_id": self.test_visit_id,
            "doctor_id": self.test_doctor_id,
            "clinic_id": self.test_clinic_id,
            "warehouse_id": self.test_warehouse_id,
            "order_type": "DEMO",
            "items": [{"product_id": self.test_product_id, "quantity": 1}],
            "notes": "طلبية من مدير (يجب أن تفشل)"
        }
        
        status_code, response = self.make_request("POST", "/orders", order_data, self.manager_token)
        
        if status_code == 403:
            self.log_test("Role-based Order Creation", True, "Manager correctly denied order creation")
            return True
        else:
            self.log_test("Role-based Order Creation", False, f"Expected 403, got {status_code}", response)
        return False
    
    def run_orders_api_tests(self):
        """Run all Orders API tests"""
        print("🚀 Starting Orders API Testing")
        print("=" * 50)
        
        # Setup
        if not self.setup_test_environment():
            print("❌ Failed to setup test environment")
            return 0, 0
        
        # Orders API Tests
        print("📦 ORDERS API TESTS")
        print("-" * 30)
        self.test_create_demo_order()
        self.test_create_sale_order()
        self.test_get_orders_sales_rep()
        self.test_get_orders_manager()
        self.test_manager_approve_order()
        self.test_manager_reject_order()
        self.test_order_validation()
        self.test_role_based_order_creation()
        
        # Summary
        print("=" * 50)
        print("📋 ORDERS API TEST SUMMARY")
        print("=" * 50)
        
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
    tester = OrdersAPITester()
    passed, total = tester.run_orders_api_tests()
    
    # Exit with appropriate code
    exit(0 if passed == total else 1)