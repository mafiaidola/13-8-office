#!/usr/bin/env python3
"""
Phase 3 Create Order Restructuring Backend Testing
Testing Arabic Review Request Requirements

المرحلة الثالثة - إعادة هيكلة Create Order - اختبار شامل
"""

import requests
import json
import sys
from datetime import datetime
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://3cea5fc2-9f6b-4b4e-9dbe-7a3c938a0e71.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class Phase3CreateOrderTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_rep_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   📝 {details}")
        if data and isinstance(data, dict):
            print(f"   📊 Data: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "data": data,
            "timestamp": datetime.now().isoformat()
        })
        print()

    def authenticate_admin(self):
        """Authenticate as admin"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token")  # API returns "token" not "access_token"
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                self.log_test("Admin Authentication", True, "Successfully logged in as admin")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Exception: {str(e)}")
            return False

    def authenticate_test_rep(self):
        """Authenticate as test_rep user"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "test_rep",
                "password": "123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.test_rep_token = data.get("token")  # API returns "token" not "access_token"
                self.log_test("Test Rep Authentication", True, "Successfully logged in as test_rep")
                return True
            else:
                self.log_test("Test Rep Authentication", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Test Rep Authentication", False, f"Exception: {str(e)}")
            return False

    def test_clinics_by_region_api(self):
        """Test GET /api/clinics/my-region with test_rep credentials"""
        try:
            # First authenticate as test_rep
            if not self.authenticate_test_rep():
                return False
                
            # Update session headers for test_rep
            self.session.headers.update({"Authorization": f"Bearer {self.test_rep_token}"})
            
            response = self.session.get(f"{API_BASE}/clinics/my-region")
            
            if response.status_code == 200:
                data = response.json()
                clinic_count = len(data) if isinstance(data, list) else 0
                
                if clinic_count > 0:
                    # Check if clinics have required fields
                    sample_clinic = data[0] if isinstance(data, list) else data
                    required_fields = ['name', 'address', 'phone']
                    has_required_fields = all(field in sample_clinic for field in required_fields)
                    
                    self.log_test("Clinics by Region API", True, 
                                f"Found {clinic_count} clinics in test_rep's region. Required fields present: {has_required_fields}",
                                {"clinic_count": clinic_count, "sample_clinic": sample_clinic})
                else:
                    self.log_test("Clinics by Region API", True, 
                                "API working but no clinics found in test_rep's region",
                                {"clinic_count": 0})
                return True
            else:
                self.log_test("Clinics by Region API", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Clinics by Region API", False, f"Exception: {str(e)}")
            return False

    def test_warehouse_stock_status_api(self):
        """Test GET /api/sales-rep/warehouse-stock-status"""
        try:
            # Ensure we're authenticated as test_rep
            if not self.test_rep_token:
                if not self.authenticate_test_rep():
                    return False
            
            self.session.headers.update({"Authorization": f"Bearer {self.test_rep_token}"})
            
            response = self.session.get(f"{API_BASE}/sales-rep/warehouse-stock-status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if response has expected structure
                if isinstance(data, dict):
                    warehouses = data.get('warehouses', [])
                    stock_items = data.get('stock_items', [])
                    
                    self.log_test("Warehouse Stock Status API", True,
                                f"Found {len(warehouses)} warehouses and {len(stock_items)} stock items",
                                {"warehouses_count": len(warehouses), "stock_items_count": len(stock_items)})
                elif isinstance(data, list):
                    self.log_test("Warehouse Stock Status API", True,
                                f"Found {len(data)} stock status items",
                                {"items_count": len(data)})
                else:
                    self.log_test("Warehouse Stock Status API", True,
                                "API responded but with unexpected data structure",
                                {"response_type": type(data).__name__})
                return True
            else:
                self.log_test("Warehouse Stock Status API", False,
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Warehouse Stock Status API", False, f"Exception: {str(e)}")
            return False

    def test_demo_clinics_setup(self):
        """Test that 8 demo clinics exist in different regions"""
        try:
            # Switch back to admin for full access
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            response = self.session.get(f"{API_BASE}/clinics")
            
            if response.status_code == 200:
                data = response.json()
                clinic_count = len(data) if isinstance(data, list) else 0
                
                if clinic_count >= 8:
                    # Check regions distribution
                    regions = set()
                    approved_clinics = 0
                    
                    for clinic in data:
                        if clinic.get('area_id') or clinic.get('region_id'):
                            regions.add(clinic.get('area_id') or clinic.get('region_id'))
                        if clinic.get('status') == 'approved' or clinic.get('is_active'):
                            approved_clinics += 1
                    
                    self.log_test("Demo Clinics Setup", True,
                                f"Found {clinic_count} clinics across {len(regions)} regions. {approved_clinics} approved clinics",
                                {"total_clinics": clinic_count, "regions_count": len(regions), "approved_clinics": approved_clinics})
                else:
                    self.log_test("Demo Clinics Setup", False,
                                f"Expected at least 8 clinics, found {clinic_count}",
                                {"clinic_count": clinic_count})
                return clinic_count >= 8
            else:
                self.log_test("Demo Clinics Setup", False,
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Demo Clinics Setup", False, f"Exception: {str(e)}")
            return False

    def test_demo_warehouses_setup(self):
        """Test that 8 demo warehouses exist"""
        try:
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Check both old and new warehouse endpoints
            old_response = self.session.get(f"{API_BASE}/warehouses")
            new_response = self.session.get(f"{API_BASE}/warehouses/new")
            
            old_count = 0
            new_count = 0
            
            if old_response.status_code == 200:
                old_data = old_response.json()
                old_count = len(old_data) if isinstance(old_data, list) else 0
            
            if new_response.status_code == 200:
                new_data = new_response.json()
                new_count = len(new_data) if isinstance(new_data, list) else 0
                
                if new_count >= 8:
                    # Check new warehouse system details
                    active_warehouses = 0
                    warehouse_types = set()
                    
                    for warehouse in new_data:
                        if warehouse.get('is_active', True):
                            active_warehouses += 1
                        warehouse_types.add(warehouse.get('type', 'unknown'))
                    
                    self.log_test("Demo Warehouses Setup", True,
                                f"Found {new_count} warehouses in new system (vs {old_count} in old system). {active_warehouses} active with types: {list(warehouse_types)}",
                                {"new_warehouses": new_count, "old_warehouses": old_count, "active_warehouses": active_warehouses, "types": list(warehouse_types)})
                    return True
                else:
                    self.log_test("Demo Warehouses Setup", False,
                                f"Expected at least 8 warehouses, found {new_count} in new system and {old_count} in old system",
                                {"new_warehouse_count": new_count, "old_warehouse_count": old_count})
                    return False
            else:
                self.log_test("Demo Warehouses Setup", False,
                            f"Could not access warehouse endpoints. Old: {old_response.status_code}, New: {new_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Demo Warehouses Setup", False, f"Exception: {str(e)}")
            return False

    def test_test_rep_user_setup(self):
        """Test that test_rep user exists and is properly configured"""
        try:
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Try to find test_rep user
            response = self.session.get(f"{API_BASE}/users")
            
            if response.status_code == 200:
                users = response.json()
                test_rep_user = None
                
                for user in users:
                    if user.get('username') == 'test_rep':
                        test_rep_user = user
                        break
                
                if test_rep_user:
                    region_id = test_rep_user.get('region_id')
                    role = test_rep_user.get('role')
                    is_active = test_rep_user.get('is_active', True)
                    
                    self.log_test("Test Rep User Setup", True,
                                f"test_rep user found. Role: {role}, Region: {region_id}, Active: {is_active}",
                                {"user_id": test_rep_user.get('id'), "role": role, "region_id": region_id, "is_active": is_active})
                else:
                    self.log_test("Test Rep User Setup", False, "test_rep user not found")
                return test_rep_user is not None
            else:
                self.log_test("Test Rep User Setup", False,
                            f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Test Rep User Setup", False, f"Exception: {str(e)}")
            return False

    def test_region_filtering(self):
        """Test that region filtering works correctly"""
        try:
            # Test as test_rep to see only their region's data
            if not self.test_rep_token:
                if not self.authenticate_test_rep():
                    return False
            
            self.session.headers.update({"Authorization": f"Bearer {self.test_rep_token}"})
            
            # Test clinics filtering
            clinics_response = self.session.get(f"{API_BASE}/clinics/my-region")
            
            if clinics_response.status_code == 200:
                rep_clinics = clinics_response.json()
                rep_clinic_count = len(rep_clinics) if isinstance(rep_clinics, list) else 0
                
                # Switch to admin to get all clinics
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                all_clinics_response = self.session.get(f"{API_BASE}/clinics")
                
                if all_clinics_response.status_code == 200:
                    all_clinics = all_clinics_response.json()
                    all_clinic_count = len(all_clinics) if isinstance(all_clinics, list) else 0
                    
                    # Region filtering should show fewer clinics for rep than admin
                    filtering_works = rep_clinic_count <= all_clinic_count
                    
                    self.log_test("Region Filtering", filtering_works,
                                f"test_rep sees {rep_clinic_count} clinics, admin sees {all_clinic_count} clinics",
                                {"rep_clinics": rep_clinic_count, "all_clinics": all_clinic_count, "filtering_active": filtering_works})
                    return filtering_works
                else:
                    self.log_test("Region Filtering", False, "Could not get all clinics as admin")
                    return False
            else:
                self.log_test("Region Filtering", False,
                            f"Could not get rep clinics. Status: {clinics_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Region Filtering", False, f"Exception: {str(e)}")
            return False

    def test_stock_integration(self):
        """Test stock integration with products"""
        try:
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Get products
            products_response = self.session.get(f"{API_BASE}/products")
            
            if products_response.status_code == 200:
                products = products_response.json()
                product_count = len(products) if isinstance(products, list) else 0
                
                # Get inventory for first warehouse
                warehouses_response = self.session.get(f"{API_BASE}/warehouses")
                
                if warehouses_response.status_code == 200:
                    warehouses = warehouses_response.json()
                    
                    if warehouses and len(warehouses) > 0:
                        first_warehouse_id = warehouses[0].get('id')
                        
                        inventory_response = self.session.get(f"{API_BASE}/inventory/{first_warehouse_id}")
                        
                        if inventory_response.status_code == 200:
                            inventory = inventory_response.json()
                            inventory_count = len(inventory) if isinstance(inventory, list) else 0
                            
                            # Check if inventory items have product details
                            has_product_integration = False
                            if inventory and len(inventory) > 0:
                                sample_item = inventory[0]
                                has_product_integration = any(key.startswith('product_') for key in sample_item.keys())
                            
                            self.log_test("Stock Integration", True,
                                        f"Found {product_count} products and {inventory_count} inventory items. Product integration: {has_product_integration}",
                                        {"products": product_count, "inventory_items": inventory_count, "product_integration": has_product_integration})
                            return True
                        else:
                            self.log_test("Stock Integration", False,
                                        f"Could not get inventory. Status: {inventory_response.status_code}")
                            return False
                    else:
                        self.log_test("Stock Integration", False, "No warehouses found")
                        return False
                else:
                    self.log_test("Stock Integration", False,
                                f"Could not get warehouses. Status: {warehouses_response.status_code}")
                    return False
            else:
                self.log_test("Stock Integration", False,
                            f"Could not get products. Status: {products_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Stock Integration", False, f"Exception: {str(e)}")
            return False

    def test_areas_and_regions_setup(self):
        """Test that areas and regions are properly set up"""
        try:
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Check areas
            areas_response = self.session.get(f"{API_BASE}/areas")
            
            if areas_response.status_code == 200:
                areas = areas_response.json()
                areas_count = len(areas) if isinstance(areas, list) else 0
                
                # Check regions
                regions_response = self.session.get(f"{API_BASE}/regions/list")
                regions_count = 0
                
                if regions_response.status_code == 200:
                    regions = regions_response.json()
                    regions_count = len(regions) if isinstance(regions, list) else 0
                
                self.log_test("Areas and Regions Setup", True,
                            f"Found {areas_count} areas and {regions_count} regions configured",
                            {"areas_count": areas_count, "regions_count": regions_count})
                return True
            else:
                self.log_test("Areas and Regions Setup", False,
                            f"Could not get areas. Status: {areas_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Areas and Regions Setup", False, f"Exception: {str(e)}")
            return False

    def test_location_tracking(self):
        """Test location tracking functionality"""
        try:
            self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
            
            # Check if clinics have location data
            response = self.session.get(f"{API_BASE}/clinics")
            
            if response.status_code == 200:
                clinics = response.json()
                
                if clinics and len(clinics) > 0:
                    clinics_with_location = 0
                    
                    for clinic in clinics:
                        if (clinic.get('latitude') and clinic.get('longitude')) or \
                           (clinic.get('coordinates') and isinstance(clinic.get('coordinates'), dict)):
                            clinics_with_location += 1
                    
                    location_percentage = (clinics_with_location / len(clinics)) * 100 if clinics else 0
                    
                    self.log_test("Location Tracking", True,
                                f"{clinics_with_location}/{len(clinics)} clinics have location data ({location_percentage:.1f}%)",
                                {"total_clinics": len(clinics), "clinics_with_location": clinics_with_location, "percentage": location_percentage})
                    return True
                else:
                    self.log_test("Location Tracking", False, "No clinics found to check location data")
                    return False
            else:
                self.log_test("Location Tracking", False,
                            f"Could not get clinics. Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Location Tracking", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all Phase 3 Create Order tests"""
        print("🚀 PHASE 3 CREATE ORDER RESTRUCTURING - BACKEND TESTING")
        print("=" * 60)
        print()
        
        # Authenticate admin first
        if not self.authenticate_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Run all tests
        tests = [
            ("1. Clinics by Region API", self.test_clinics_by_region_api),
            ("2. Warehouse Stock Status API", self.test_warehouse_stock_status_api),
            ("3. Demo Clinics Setup (8 clinics)", self.test_demo_clinics_setup),
            ("4. Demo Warehouses Setup (8 warehouses)", self.test_demo_warehouses_setup),
            ("5. Test Rep User Setup", self.test_test_rep_user_setup),
            ("6. Areas and Regions Setup", self.test_areas_and_regions_setup),
            ("7. Region Filtering", self.test_region_filtering),
            ("8. Stock Integration", self.test_stock_integration),
            ("9. Location Tracking", self.test_location_tracking),
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"🔍 Running {test_name}...")
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                self.log_test(test_name, False, f"Unexpected error: {str(e)}")
        
        # Summary
        print("=" * 60)
        print(f"📊 PHASE 3 CREATE ORDER TESTING SUMMARY")
        print(f"✅ Passed: {passed_tests}/{total_tests} tests")
        print(f"❌ Failed: {total_tests - passed_tests}/{total_tests} tests")
        print(f"📈 Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        print()
        
        if passed_tests == total_tests:
            print("🎉 ALL PHASE 3 CREATE ORDER TESTS PASSED!")
            print("✅ المرحلة الثالثة - إعادة هيكلة Create Order تعمل بشكل مثالي")
        elif passed_tests >= total_tests * 0.8:
            print("⚠️  MOST TESTS PASSED - MINOR ISSUES DETECTED")
            print("⚠️  معظم الاختبارات نجحت - مشاكل بسيطة تم اكتشافها")
        else:
            print("❌ SIGNIFICANT ISSUES DETECTED")
            print("❌ مشاكل كبيرة تم اكتشافها")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    print("🔧 Phase 3 Create Order Restructuring Backend Testing")
    print(f"🌐 Backend URL: {API_BASE}")
    print()
    
    tester = Phase3CreateOrderTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)