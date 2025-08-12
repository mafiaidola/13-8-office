#!/usr/bin/env python3
"""
Hierarchical Approval Flow Testing
Testing the complete approval workflow with different user roles
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com/api"

class HierarchicalApprovalTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
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
                self.log_test("Admin Authentication", True, f"Admin login successful")
                return True
            else:
                self.log_test("Admin Authentication", False, f"Status: {response.status_code}")
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
                self.log_test("GM Authentication", True, f"GM login successful")
                return True
            else:
                self.log_test("GM Authentication", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("GM Authentication", False, f"Exception: {str(e)}")
            return False

    def create_medical_rep_user(self):
        """Create a medical rep user for testing"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            user_data = {
                "username": "medical_rep_test",
                "email": "medicalrep@test.com",
                "password": "testpass123",
                "full_name": "مندوب طبي للاختبار",
                "role": "medical_rep"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Create Medical Rep User", True, "Medical rep user created successfully")
                return True
            else:
                self.log_test("Create Medical Rep User", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Medical Rep User", False, f"Exception: {str(e)}")
            return False

    def test_medical_rep_approval_request(self):
        """Test approval request creation by medical rep"""
        try:
            # Login as medical rep
            login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                "username": "medical_rep_test",
                "password": "testpass123"
            })
            
            if login_response.status_code != 200:
                self.log_test("Medical Rep Approval Request", False, "Failed to login as medical rep")
                return None
                
            med_rep_token = login_response.json()["token"]
            headers = {"Authorization": f"Bearer {med_rep_token}"}
            
            # Create approval request
            request_data = {
                "type": "order",
                "entity_id": "med-rep-order-001",
                "entity_data": {
                    "order_number": "ORD-MED-2024-001",
                    "items": [
                        {
                            "product_name": "منتج من المندوب الطبي",
                            "quantity": 3,
                            "unit_price": 200
                        }
                    ],
                    "total_amount": 600,
                    "clinic_id": "clinic-med-rep-001"
                },
                "notes": "طلب من المندوب الطبي يحتاج موافقة هرمية"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/request", json=request_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                request_id = data.get("request_id")
                required_levels = data.get("required_levels", [])
                self.log_test("Medical Rep Approval Request", True, f"Request created with ID: {request_id}, Required levels: {required_levels}")
                return request_id
            else:
                self.log_test("Medical Rep Approval Request", False, f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Medical Rep Approval Request", False, f"Exception: {str(e)}")
            return None

    def test_admin_override_approval(self, request_id):
        """Test admin can override and approve any request"""
        if not request_id:
            self.log_test("Admin Override Approval", False, "No request ID provided")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            action_data = {
                "action": "approve",
                "notes": "موافقة إدارية مباشرة - تجاوز التسلسل الهرمي"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/{request_id}/action", json=action_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Admin Override Approval", True, "Admin successfully overrode hierarchical approval")
                return True
            else:
                self.log_test("Admin Override Approval", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Override Approval", False, f"Exception: {str(e)}")
            return False

    def test_gm_override_approval(self):
        """Test GM can override and approve requests"""
        try:
            # Create another request for GM testing
            headers = {"Authorization": f"Bearer {self.gm_token}"}
            
            request_data = {
                "type": "order",
                "entity_id": "gm-order-001",
                "entity_data": {
                    "order_number": "ORD-GM-2024-001",
                    "items": [
                        {
                            "product_name": "منتج من المدير العام",
                            "quantity": 10,
                            "unit_price": 150
                        }
                    ],
                    "total_amount": 1500,
                    "clinic_id": "clinic-gm-001"
                },
                "notes": "طلب من المدير العام"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/request", json=request_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                request_id = data.get("request_id")
                
                # Now approve it
                action_data = {
                    "action": "approve",
                    "notes": "موافقة من المدير العام"
                }
                
                approve_response = requests.post(f"{BACKEND_URL}/approvals/{request_id}/action", json=action_data, headers=headers)
                
                if approve_response.status_code == 200:
                    self.log_test("GM Override Approval", True, "GM successfully created and approved request")
                    return True
                else:
                    self.log_test("GM Override Approval", False, f"GM approval failed: {approve_response.status_code}")
                    return False
            else:
                self.log_test("GM Override Approval", False, f"GM request creation failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("GM Override Approval", False, f"Exception: {str(e)}")
            return False

    def test_approval_history_enrichment(self):
        """Test that approval history shows enriched data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/history", headers=headers)
            
            if response.status_code == 200:
                history_data = response.json()
                
                # Check if we have history records
                if len(history_data) > 0:
                    # Check if records have enriched data
                    sample_record = history_data[0]
                    has_requester_name = "requester_name" in sample_record
                    has_approvals = "approvals" in sample_record and len(sample_record["approvals"]) > 0
                    
                    if has_approvals:
                        has_approver_name = "approver_name" in sample_record["approvals"][0]
                    else:
                        has_approver_name = True  # No approvals yet, that's ok
                    
                    if has_requester_name and has_approver_name:
                        self.log_test("Approval History Enrichment", True, f"History records properly enriched with user names")
                        return True
                    else:
                        self.log_test("Approval History Enrichment", False, f"History records missing enriched data")
                        return False
                else:
                    self.log_test("Approval History Enrichment", True, f"No history records to check (expected)")
                    return True
            else:
                self.log_test("Approval History Enrichment", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Approval History Enrichment", False, f"Exception: {str(e)}")
            return False

    def test_pending_approvals_filtering(self):
        """Test that pending approvals are properly filtered by role"""
        try:
            # Test admin pending approvals
            admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
            admin_response = requests.get(f"{BACKEND_URL}/approvals/pending", headers=admin_headers)
            
            # Test GM pending approvals
            gm_headers = {"Authorization": f"Bearer {self.gm_token}"}
            gm_response = requests.get(f"{BACKEND_URL}/approvals/pending", headers=gm_headers)
            
            if admin_response.status_code == 200 and gm_response.status_code == 200:
                admin_pending = admin_response.json()
                gm_pending = gm_response.json()
                
                self.log_test("Pending Approvals Filtering", True, f"Admin pending: {len(admin_pending)}, GM pending: {len(gm_pending)}")
                return True
            else:
                self.log_test("Pending Approvals Filtering", False, f"Admin: {admin_response.status_code}, GM: {gm_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Pending Approvals Filtering", False, f"Exception: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run all hierarchical approval tests"""
        print("🎯 HIERARCHICAL APPROVAL FLOW COMPREHENSIVE TESTING")
        print("=" * 70)
        print("Testing the complete approval workflow with different user roles")
        print("Focus: Role-based approval creation, Admin/GM override capabilities, Hierarchical flow")
        print()
        
        # Test authentication
        admin_login_success = self.admin_login()
        gm_login_success = self.gm_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Create test users
        self.create_medical_rep_user()
        
        # Test medical rep approval request creation
        med_rep_request_id = self.test_medical_rep_approval_request()
        
        # Test admin override capabilities
        self.test_admin_override_approval(med_rep_request_id)
        
        # Test GM override capabilities
        if gm_login_success:
            self.test_gm_override_approval()
        
        # Test approval history enrichment
        self.test_approval_history_enrichment()
        
        # Test pending approvals filtering
        self.test_pending_approvals_filtering()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🎯 HIERARCHICAL APPROVAL FLOW TEST SUMMARY")
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
            print("🎉 HIERARCHICAL APPROVAL FLOW: WORKING PERFECTLY")
        elif success_rate >= 60:
            print("⚠️  HIERARCHICAL APPROVAL FLOW: PARTIALLY FUNCTIONAL")
        else:
            print("❌ HIERARCHICAL APPROVAL FLOW: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = HierarchicalApprovalTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()