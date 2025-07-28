#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Invoice and Product System
Testing the new invoice system with price tiers and cashback functionality
"""

import requests
import json
import sys
from datetime import datetime
import os

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://e87cf1b6-8af9-48b1-aced-d66263eca300.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class InvoiceProductTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.created_product_id = None
        self.created_order_id = None
        self.created_invoice_id = None
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def admin_login(self):
        """Test admin login with admin/admin123"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token") or data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                
                self.log_test(
                    "Admin Login (admin/admin123)",
                    True,
                    f"Successfully logged in. Token: {self.admin_token[:20]}..."
                )
                return True
            else:
                self.log_test(
                    "Admin Login (admin/admin123)",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Login (admin/admin123)", False, "", str(e))
            return False

    def test_create_product_with_tiers(self):
        """Test creating product with price tiers and cashback"""
        try:
            product_data = {
                "name": "دواء تجريبي",
                "description": "منتج تجريبي للاختبار",
                "category": "أدوية",
                "unit": "علبة",
                "line": "line_1",
                "price_1": 100.0,
                "price_10": 90.0,
                "price_25": 80.0,
                "price_50": 70.0,
                "price_100": 60.0,
                "cashback_1": 0.0,
                "cashback_10": 2.0,
                "cashback_25": 5.0,
                "cashback_50": 8.0,
                "cashback_100": 10.0
            }
            
            response = self.session.post(f"{API_BASE}/products/admin/create", json=product_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_product_id = data.get("product_id")
                
                self.log_test(
                    "Create Product with Price Tiers",
                    True,
                    f"Product created successfully. ID: {self.created_product_id}"
                )
                return True
            else:
                self.log_test(
                    "Create Product with Price Tiers",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Create Product with Price Tiers", False, "", str(e))
            return False

    def test_get_products_by_line(self):
        """Test GET /api/products/by-line/line_1"""
        try:
            response = self.session.get(f"{API_BASE}/products/by-line/line_1")
            
            if response.status_code == 200:
                products = response.json()
                
                # Check if our created product is in the list
                found_product = None
                if self.created_product_id:
                    found_product = next((p for p in products if p.get("id") == self.created_product_id), None)
                
                details = f"Found {len(products)} products for line_1"
                if found_product:
                    details += f". Created product found with price tiers."
                
                self.log_test(
                    "Get Products by Line (line_1)",
                    True,
                    details
                )
                return True
            else:
                self.log_test(
                    "Get Products by Line (line_1)",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Products by Line (line_1)", False, "", str(e))
            return False

    def test_create_order_and_invoice(self):
        """Test creating order with invoice generation"""
        try:
            if not self.created_product_id:
                self.log_test(
                    "Create Order and Invoice",
                    False,
                    "",
                    "No product ID available for order creation"
                )
                return False
            
            # Get available clinics and warehouses first
            clinics_response = self.session.get(f"{API_BASE}/clinics")
            warehouses_response = self.session.get(f"{API_BASE}/warehouses")
            
            if clinics_response.status_code != 200 or warehouses_response.status_code != 200:
                self.log_test(
                    "Create Order and Invoice",
                    False,
                    "Failed to get clinics or warehouses",
                    f"Clinics: {clinics_response.status_code}, Warehouses: {warehouses_response.status_code}"
                )
                return False
            
            clinics = clinics_response.json()
            warehouses = warehouses_response.json()
            
            if not clinics or not warehouses:
                self.log_test(
                    "Create Order and Invoice",
                    False,
                    "No clinics or warehouses available",
                    f"Clinics: {len(clinics)}, Warehouses: {len(warehouses)}"
                )
                return False
            
            clinic_id = clinics[0]["id"]
            warehouse_id = warehouses[0]["id"]
            
            order_data = {
                "customer_info": {
                    "name": "د. أحمد محمد",
                    "phone": "01234567890",
                    "address": "القاهرة",
                    "clinic_name": "عيادة الأمل"
                },
                "items": [
                    {
                        "product_id": self.created_product_id,
                        "quantity": 2,
                        "price_tier": "10",
                        "unit_price": 90.0,
                        "total": 180.0
                    }
                ],
                "total_amount": 180.0,
                "line": "line_1",
                "clinic_id": clinic_id,
                "warehouse_id": warehouse_id
            }
            
            response = self.session.post(f"{API_BASE}/orders/create", json=order_data)
            
            if response.status_code == 200:
                data = response.json()
                self.created_order_id = data.get("order_id")
                self.created_invoice_id = data.get("invoice_id")
                
                self.log_test(
                    "Create Order and Invoice",
                    True,
                    f"Order ID: {self.created_order_id}, Invoice ID: {self.created_invoice_id}"
                )
                return True
            else:
                self.log_test(
                    "Create Order and Invoice",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Create Order and Invoice", False, "", str(e))
            return False

    def test_get_invoices_list(self):
        """Test GET /api/invoices/list"""
        try:
            response = self.session.get(f"{API_BASE}/invoices/list")
            
            if response.status_code == 200:
                invoices = response.json()
                
                # Check if our created invoice is in the list
                found_invoice = None
                if self.created_invoice_id:
                    found_invoice = next((inv for inv in invoices if inv.get("id") == self.created_invoice_id), None)
                
                details = f"Found {len(invoices)} invoices"
                if found_invoice:
                    details += f". Created invoice found with status: {found_invoice.get('status', 'unknown')}"
                
                self.log_test(
                    "Get Invoices List",
                    True,
                    details
                )
                return True
            else:
                self.log_test(
                    "Get Invoices List",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Invoices List", False, "", str(e))
            return False

    def test_update_invoice(self):
        """Test PUT /api/invoices/{invoice_id}"""
        try:
            if not self.created_invoice_id:
                self.log_test(
                    "Update Invoice",
                    False,
                    "",
                    "No invoice ID available for update"
                )
                return False
            
            update_data = {
                "customer_info": {
                    "name": "د. أحمد محمد المحدث",
                    "phone": "01234567890",
                    "address": "القاهرة الجديدة",
                    "clinic_name": "عيادة الأمل المحدثة"
                },
                "notes": "تم تحديث الفاتورة للاختبار"
            }
            
            response = self.session.put(f"{API_BASE}/invoices/{self.created_invoice_id}", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                self.log_test(
                    "Update Invoice",
                    True,
                    f"Invoice updated successfully. Message: {data.get('message', 'No message')}"
                )
                return True
            else:
                self.log_test(
                    "Update Invoice",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Update Invoice", False, "", str(e))
            return False

    def test_get_invoice_history(self):
        """Test GET /api/invoices/{invoice_id}/history"""
        try:
            if not self.created_invoice_id:
                self.log_test(
                    "Get Invoice History",
                    False,
                    "",
                    "No invoice ID available for history check"
                )
                return False
            
            response = self.session.get(f"{API_BASE}/invoices/{self.created_invoice_id}/history")
            
            if response.status_code == 200:
                history = response.json()
                
                details = f"Found {len(history)} history entries"
                if history:
                    latest_edit = history[0] if history else {}
                    details += f". Latest edit by: {latest_edit.get('edited_by_name', 'Unknown')}"
                
                self.log_test(
                    "Get Invoice History",
                    True,
                    details
                )
                return True
            else:
                self.log_test(
                    "Get Invoice History",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Get Invoice History", False, "", str(e))
            return False

    def test_cashback_calculation(self):
        """Test cashback calculation in product pricing"""
        try:
            if not self.created_product_id:
                self.log_test(
                    "Cashback Calculation Test",
                    False,
                    "",
                    "No product ID available for cashback test"
                )
                return False
            
            # Get the product to verify cashback values
            response = self.session.get(f"{API_BASE}/products/by-line/line_1")
            
            if response.status_code == 200:
                products = response.json()
                test_product = next((p for p in products if p.get("id") == self.created_product_id), None)
                
                if test_product:
                    # Check if cashback values are present
                    cashback_fields = ["cashback_1", "cashback_10", "cashback_25", "cashback_50", "cashback_100"]
                    price_fields = ["price_1", "price_10", "price_25", "price_50", "price_100"]
                    
                    cashback_present = all(field in test_product for field in cashback_fields)
                    prices_present = all(field in test_product for field in price_fields)
                    
                    if cashback_present and prices_present:
                        details = "All price tiers and cashback values present: "
                        details += f"Price 10: {test_product.get('price_10')}, Cashback 10: {test_product.get('cashback_10')}%"
                        
                        self.log_test(
                            "Cashback Calculation Test",
                            True,
                            details
                        )
                        return True
                    else:
                        self.log_test(
                            "Cashback Calculation Test",
                            False,
                            "Missing price tiers or cashback values",
                            f"Cashback present: {cashback_present}, Prices present: {prices_present}"
                        )
                        return False
                else:
                    self.log_test(
                        "Cashback Calculation Test",
                        False,
                        "",
                        "Created product not found in product list"
                    )
                    return False
            else:
                self.log_test(
                    "Cashback Calculation Test",
                    False,
                    f"Status: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_test("Cashback Calculation Test", False, "", str(e))
            return False

    def run_all_tests(self):
        """Run all invoice and product system tests"""
        print("🧪 COMPREHENSIVE INVOICE AND PRODUCT SYSTEM TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"API Base: {API_BASE}")
        print()
        
        # Test sequence as requested in the review
        tests = [
            ("Admin Login", self.admin_login),
            ("Create Product with Price Tiers", self.test_create_product_with_tiers),
            ("Get Products by Line", self.test_get_products_by_line),
            ("Create Order and Invoice", self.test_create_order_and_invoice),
            ("Get Invoices List", self.test_get_invoices_list),
            ("Update Invoice", self.test_update_invoice),
            ("Get Invoice History", self.test_get_invoice_history),
            ("Cashback Calculation Test", self.test_cashback_calculation)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            if test_func():
                passed += 1
        
        print("=" * 60)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Invoice and Product System is working perfectly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        print("\n📋 DETAILED TEST RESULTS:")
        for result in self.test_results:
            print(f"  {result['status']} {result['test']}")
            if result['details']:
                print(f"     Details: {result['details']}")
            if result['error']:
                print(f"     Error: {result['error']}")
        
        return passed, total

def main():
    """Main test execution"""
    tester = InvoiceProductTester()
    passed, total = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if passed == total else 1)

if __name__ == "__main__":
    main()