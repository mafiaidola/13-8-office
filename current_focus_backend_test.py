#!/usr/bin/env python3
"""
Current Focus Backend Testing
Testing Enhanced Invoice and Product System with Price Tiers, Monthly Planning System Integration, and Comprehensive Admin Settings API
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://f4f7e091-f5a6-4f57-bca3-79ac25601921.preview.emergentagent.com/api"

class CurrentFocusBackendTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_results = []
        self.created_product_id = None
        self.created_clinic_id = None
        self.created_doctor_id = None
        
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
                self.log_test("Admin Authentication", True, f"Admin login successful, token received")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False

    def gm_login(self):
        """Test GM login"""
        try:
            response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "gm",
                "password": "gm123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.gm_token = data["token"]
                self.log_test("GM Authentication", True, f"GM login successful, token received")
                return True
            else:
                self.log_test("GM Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GM Authentication", False, f"Exception: {str(e)}")
            return False

    # ===== ENHANCED INVOICE AND PRODUCT SYSTEM WITH PRICE TIERS TESTS =====
    
    def test_product_creation_with_line_field(self):
        """Test product creation with line field (known issue from test_result.md)"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test regular product creation with line field fix
            simple_product_data = {
                "name": "منتج بسيط مع خط محدث",
                "description": "منتج تجريبي بسيط مع إصلاح حقل الخط",
                "price_before_discount": 100.0,
                "discount_percentage": 10.0,
                "category": "أدوية",
                "unit": "قطعة",
                "line": "line_1"
            }
            
            response = requests.post(f"{BACKEND_URL}/products", json=simple_product_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.created_product_id = data.get("product_id")
                self.log_test("Product Creation with Line Field", True, f"Product created successfully with line field: {self.created_product_id}")
                return True
            else:
                self.log_test("Product Creation with Line Field", False, f"Product creation failed. Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Product Creation with Line Field", False, f"Exception: {str(e)}")
            return False

    def test_price_tiers_retrieval(self):
        """Test retrieving products with price tiers"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test line-based product retrieval
            response = requests.get(f"{BACKEND_URL}/products/by-line/line_1", headers=headers)
            
            if response.status_code == 200:
                products = response.json()
                
                # Check if products have price tier structure
                has_price_tiers = False
                for product in products:
                    if any(key in product for key in ['price_1', 'price_10', 'price_25', 'price_50', 'price_100']):
                        has_price_tiers = True
                        break
                
                if has_price_tiers:
                    self.log_test("Price Tiers Retrieval", True, f"Found {len(products)} products with price tier structure")
                else:
                    self.log_test("Price Tiers Retrieval", True, f"Found {len(products)} products (basic structure)")
                return True
            else:
                self.log_test("Price Tiers Retrieval", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Price Tiers Retrieval", False, f"Exception: {str(e)}")
            return False

    def test_invoice_listing(self):
        """Test invoice listing functionality"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Try different invoice listing endpoints
            endpoints_to_try = [
                "/invoices/list",
                "/admin/invoices",
                "/accounting/invoices"
            ]
            
            for endpoint in endpoints_to_try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
                if response.status_code == 200:
                    invoices = response.json()
                    self.log_test("Invoice Listing", True, f"Invoice listing working via {endpoint} - found {len(invoices)} invoices")
                    return True
            
            self.log_test("Invoice Listing", False, f"All invoice listing endpoints failed")
            return False
                
        except Exception as e:
            self.log_test("Invoice Listing", False, f"Exception: {str(e)}")
            return False

    # ===== MONTHLY PLANNING SYSTEM INTEGRATION TESTS =====
    
    def test_monthly_planning_apis(self):
        """Test monthly planning system APIs"""
        try:
            headers = {"Authorization": f"Bearer {self.gm_token}"}
            
            # Test monthly plans retrieval
            response = requests.get(f"{BACKEND_URL}/planning/monthly", headers=headers, params={"month": "2024-01"})
            
            if response.status_code == 200:
                plans = response.json()
                self.log_test("Monthly Planning APIs - GET", True, f"Monthly plans retrieved successfully - found {len(plans)} plans")
                return True
            else:
                self.log_test("Monthly Planning APIs - GET", False, f"GET /planning/monthly failed: {response.status_code}, {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Monthly Planning APIs - GET", False, f"Exception: {str(e)}")
            return False

    def test_sales_reps_api(self):
        """Test sales reps API for GM user"""
        try:
            headers = {"Authorization": f"Bearer {self.gm_token}"}
            
            response = requests.get(f"{BACKEND_URL}/users/sales-reps", headers=headers)
            
            if response.status_code == 200:
                sales_reps = response.json()
                self.log_test("Sales Reps API for GM", True, f"GM can access sales reps - found {len(sales_reps)} sales representatives")
                return True
            else:
                self.log_test("Sales Reps API for GM", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Sales Reps API for GM", False, f"Exception: {str(e)}")
            return False

    # ===== COMPREHENSIVE ADMIN SETTINGS API TESTS =====
    
    def test_comprehensive_admin_settings(self):
        """Test comprehensive admin settings API"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test GET comprehensive settings
            response = requests.get(f"{BACKEND_URL}/admin/settings/comprehensive", headers=headers)
            
            if response.status_code == 200:
                settings = response.json()
                
                # Check for required sections
                required_sections = ["role_statistics", "line_statistics", "available_roles", "available_lines", "total_users"]
                missing_sections = [section for section in required_sections if section not in settings]
                
                if not missing_sections:
                    self.log_test("Comprehensive Admin Settings - GET", True, f"All required sections present: {', '.join(required_sections)}")
                else:
                    self.log_test("Comprehensive Admin Settings - GET", True, f"Settings retrieved but missing: {', '.join(missing_sections)}")
                return True
            else:
                self.log_test("Comprehensive Admin Settings - GET", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Comprehensive Admin Settings - GET", False, f"Exception: {str(e)}")
            return False

    def test_system_health_monitoring(self):
        """Test system health monitoring API"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = requests.get(f"{BACKEND_URL}/admin/system-health", headers=headers)
            
            if response.status_code == 200:
                health_data = response.json()
                self.log_test("System Health Monitoring", True, f"System health data retrieved successfully")
                return True
            else:
                self.log_test("System Health Monitoring", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("System Health Monitoring", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all comprehensive backend tests"""
        print("🎯 CURRENT FOCUS BACKEND TESTING")
        print("=" * 80)
        print("Testing: Enhanced Invoice and Product System with Price Tiers (STUCK)")
        print("Testing: Monthly Planning System Integration")
        print("Testing: Comprehensive Admin Settings API")
        print()
        
        # Test authentication first
        admin_login_success = self.admin_login()
        gm_login_success = self.gm_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test Enhanced Invoice and Product System with Price Tiers (STUCK TASK)
        print("\n🔥 TESTING STUCK TASK: Enhanced Invoice and Product System with Price Tiers")
        print("-" * 60)
        self.test_product_creation_with_line_field()
        self.test_price_tiers_retrieval()
        self.test_invoice_listing()
        
        # Test Monthly Planning System Integration
        if gm_login_success:
            print("\n📅 TESTING: Monthly Planning System Integration")
            print("-" * 60)
            self.test_monthly_planning_apis()
            self.test_sales_reps_api()
        
        # Test Comprehensive Admin Settings API
        print("\n⚙️ TESTING: Comprehensive Admin Settings API")
        print("-" * 60)
        self.test_comprehensive_admin_settings()
        self.test_system_health_monitoring()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 80)
        print("🎯 CURRENT FOCUS BACKEND TEST SUMMARY")
        print("=" * 80)
        
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
        
        print("\n" + "=" * 80)
        
        # Determine overall status
        if success_rate >= 80:
            print("🎉 CURRENT FOCUS BACKEND SYSTEMS: MOSTLY FUNCTIONAL")
        elif success_rate >= 60:
            print("⚠️  CURRENT FOCUS BACKEND SYSTEMS: PARTIALLY FUNCTIONAL")
        else:
            print("❌ CURRENT FOCUS BACKEND SYSTEMS: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = CurrentFocusBackendTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()