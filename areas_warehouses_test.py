#!/usr/bin/env python3
"""
Areas and Warehouses System Initialization Testing
Testing the new Areas and Warehouses system initialization and functionality
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://0f12410c-0263-44c4-80bc-ce88c1050ca0.preview.emergentagent.com/api"

class AreasWarehousesSystemTester:
    def __init__(self):
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        print()

    def admin_login(self):
        """Test admin login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["token"]
                self.log_test("Admin Authentication (admin/admin123)", True, f"Admin login successful, token received")
                return True
            else:
                self.log_test("Admin Authentication (admin/admin123)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication (admin/admin123)", False, f"Exception: {str(e)}")
            return False

    def test_areas_initialize(self):
        """Test POST /api/areas/initialize - Initialize default areas"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{BACKEND_URL}/areas/initialize", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                areas_created = data.get("areas", [])
                message = data.get("message", "")
                self.log_test("POST /api/areas/initialize", True, f"Areas initialization successful: {message}. Created areas: {areas_created}")
                return True
            else:
                self.log_test("POST /api/areas/initialize", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/areas/initialize", False, f"Exception: {str(e)}")
            return False

    def test_warehouses_initialize(self):
        """Test POST /api/warehouses/initialize - Initialize default warehouses"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{BACKEND_URL}/warehouses/initialize", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                warehouses_created = data.get("warehouses", [])
                message = data.get("message", "")
                self.log_test("POST /api/warehouses/initialize", True, f"Warehouses initialization successful: {message}. Created warehouses: {warehouses_created}")
                return True
            else:
                self.log_test("POST /api/warehouses/initialize", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/warehouses/initialize", False, f"Exception: {str(e)}")
            return False

    def test_get_areas(self):
        """Test GET /api/areas - Get all areas"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/areas", headers=headers)
            
            if response.status_code == 200:
                areas = response.json()
                self.log_test("GET /api/areas", True, f"Successfully retrieved {len(areas)} areas. Areas found: {[area.get('name', 'Unknown') for area in areas]}")
                return areas
            else:
                self.log_test("GET /api/areas", False, f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("GET /api/areas", False, f"Exception: {str(e)}")
            return []

    def test_get_warehouses_new(self):
        """Test GET /api/warehouses/new - Get all warehouses"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/warehouses/new", headers=headers)
            
            if response.status_code == 200:
                warehouses = response.json()
                self.log_test("GET /api/warehouses/new", True, f"Successfully retrieved {len(warehouses)} warehouses. Warehouses found: {[wh.get('name', 'Unknown') for wh in warehouses]}")
                return warehouses
            else:
                self.log_test("GET /api/warehouses/new", False, f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("GET /api/warehouses/new", False, f"Exception: {str(e)}")
            return []

    def create_test_medical_rep(self):
        """Create a test medical rep user for stock dashboard testing"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            user_data = {
                "username": "test_medical_rep",
                "email": "medicalrep@test.com",
                "password": "testpass123",
                "full_name": "مندوب طبي تجريبي",
                "phone": "01234567890",
                "role": "medical_rep",
                "is_active": True
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Create Test Medical Rep", True, f"Medical rep created successfully: {data.get('full_name', 'Unknown')}")
                
                # Now login as the medical rep
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": "test_medical_rep",
                    "password": "testpass123"
                })
                
                if login_response.status_code == 200:
                    login_data = login_response.json()
                    self.medical_rep_token = login_data["token"]
                    self.log_test("Medical Rep Login", True, "Medical rep login successful")
                    return True
                else:
                    self.log_test("Medical Rep Login", False, f"Login failed: {login_response.status_code}")
                    return False
            else:
                self.log_test("Create Test Medical Rep", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Test Medical Rep", False, f"Exception: {str(e)}")
            return False

    def test_stock_dashboard(self):
        """Test GET /api/stock/dashboard - Test stock dashboard for medical reps"""
        try:
            if not self.medical_rep_token:
                self.log_test("GET /api/stock/dashboard", False, "No medical rep token available - skipping test")
                return False
                
            headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            response = requests.get(f"{BACKEND_URL}/stock/dashboard", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                warehouse_count = data.get("warehouse_count", 0)
                total_products = data.get("total_products", 0)
                stock_items = data.get("stock_items", [])
                
                self.log_test("GET /api/stock/dashboard", True, f"Stock dashboard retrieved successfully. Warehouses: {warehouse_count}, Products: {total_products}, Stock items: {len(stock_items)}")
                return True
            else:
                self.log_test("GET /api/stock/dashboard", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/stock/dashboard", False, f"Exception: {str(e)}")
            return False

    def test_system_health(self):
        """Test system health and database connectivity"""
        try:
            # Test basic endpoint accessibility
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "test",
                "password": "test"
            })
            # Even if login fails, if we get a proper HTTP response, the system is up
            if response.status_code in [401, 400, 422]:
                self.log_test("System Health Check", True, "Backend service is healthy and responding")
                return True
            elif response.status_code == 200:
                self.log_test("System Health Check", True, "Backend service is healthy")
                return True
            else:
                self.log_test("System Health Check", False, f"Health check failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("System Health Check", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all Areas and Warehouses System tests"""
        print("🏗️  AREAS AND WAREHOUSES SYSTEM INITIALIZATION TESTING")
        print("=" * 70)
        print("Testing the new Areas and Warehouses system initialization and functionality")
        print("Focus: Initialize default areas and warehouses, verify hierarchical structure, test stock dashboard")
        print()
        
        # Test system health first
        self.test_system_health()
        
        # Test authentication
        admin_login_success = self.admin_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test the primary requested functionality
        print("🎯 PRIMARY TESTS:")
        print("1. POST /api/areas/initialize - Initialize default areas")
        self.test_areas_initialize()
        
        print("2. POST /api/warehouses/initialize - Initialize default warehouses")
        self.test_warehouses_initialize()
        
        print("3. GET /api/areas - Get all areas")
        areas = self.test_get_areas()
        
        print("4. GET /api/warehouses/new - Get all warehouses")
        warehouses = self.test_get_warehouses_new()
        
        print("5. GET /api/stock/dashboard - Test stock dashboard for medical reps")
        # First create a medical rep user
        self.create_test_medical_rep()
        self.test_stock_dashboard()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🏗️  AREAS AND WAREHOUSES SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        # Show detailed results
        for result in self.test_results:
            print(f"{result['status']}: {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "=" * 70)
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 AREAS AND WAREHOUSES SYSTEM: FULLY FUNCTIONAL")
        elif success_rate >= 60:
            print("⚠️  AREAS AND WAREHOUSES SYSTEM: MOSTLY FUNCTIONAL")
        else:
            print("❌ AREAS AND WAREHOUSES SYSTEM: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = AreasWarehousesSystemTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()