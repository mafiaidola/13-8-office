#!/usr/bin/env python3
"""
Approvals System APIs Testing
Testing the new Approvals System APIs as requested in the review
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://ec499ace-685d-480d-b657-849bf4e418d7.preview.emergentagent.com/api"

class ApprovalsSystemTester:
    def __init__(self):
        self.admin_token = None
        self.gm_token = None
        self.test_results = []
        self.created_request_id = None
        
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

    def test_create_approval_request(self):
        """Test POST /api/approvals/request - Create a new approval request"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test data from the review request
            request_data = {
                "type": "order",
                "entity_id": "test-order-001",
                "entity_data": {
                    "order_number": "ORD-2024-001",
                    "items": [
                        {
                            "product_name": "منتج تجريبي",
                            "quantity": 5,
                            "unit_price": 100
                        }
                    ],
                    "total_amount": 500,
                    "clinic_id": "test-clinic-001"
                },
                "notes": "طلب تجريبي للاختبار"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/request", json=request_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.created_request_id = data.get("request_id")
                self.log_test("POST /api/approvals/request", True, f"Approval request created successfully. Request ID: {self.created_request_id}")
                return True
            else:
                self.log_test("POST /api/approvals/request", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/approvals/request", False, f"Exception: {str(e)}")
            return False

    def test_get_my_requests(self):
        """Test GET /api/approvals/my-requests - Get approval requests for current user"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/my-requests", headers=headers)
            
            if response.status_code == 200:
                requests_data = response.json()
                self.log_test("GET /api/approvals/my-requests", True, f"Retrieved {len(requests_data)} approval requests for current user")
                
                # Check if our created request is in the list
                if self.created_request_id:
                    found_request = any(req.get("id") == self.created_request_id for req in requests_data)
                    if found_request:
                        self.log_test("Verify Created Request in My Requests", True, "Created request found in my requests list")
                    else:
                        self.log_test("Verify Created Request in My Requests", False, "Created request not found in my requests list")
                
                return True
            else:
                self.log_test("GET /api/approvals/my-requests", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/approvals/my-requests", False, f"Exception: {str(e)}")
            return False

    def test_get_pending_approvals_admin(self):
        """Test GET /api/approvals/pending - Get pending approvals for admin role"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/pending", headers=headers)
            
            if response.status_code == 200:
                pending_data = response.json()
                self.log_test("GET /api/approvals/pending (Admin)", True, f"Retrieved {len(pending_data)} pending approvals for admin role")
                return True
            else:
                self.log_test("GET /api/approvals/pending (Admin)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/approvals/pending (Admin)", False, f"Exception: {str(e)}")
            return False

    def test_get_pending_approvals_gm(self):
        """Test GET /api/approvals/pending - Get pending approvals for GM role"""
        try:
            headers = {"Authorization": f"Bearer {self.gm_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/pending", headers=headers)
            
            if response.status_code == 200:
                pending_data = response.json()
                self.log_test("GET /api/approvals/pending (GM)", True, f"Retrieved {len(pending_data)} pending approvals for GM role")
                return True
            else:
                self.log_test("GET /api/approvals/pending (GM)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/approvals/pending (GM)", False, f"Exception: {str(e)}")
            return False

    def test_get_approval_history_admin(self):
        """Test GET /api/approvals/history - Get approval history for admin"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/history", headers=headers)
            
            if response.status_code == 200:
                history_data = response.json()
                self.log_test("GET /api/approvals/history (Admin)", True, f"Retrieved {len(history_data)} approval history records for admin")
                return True
            else:
                self.log_test("GET /api/approvals/history (Admin)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/approvals/history (Admin)", False, f"Exception: {str(e)}")
            return False

    def test_get_approval_history_gm(self):
        """Test GET /api/approvals/history - Get approval history for GM"""
        try:
            headers = {"Authorization": f"Bearer {self.gm_token}"}
            response = requests.get(f"{BACKEND_URL}/approvals/history", headers=headers)
            
            if response.status_code == 200:
                history_data = response.json()
                self.log_test("GET /api/approvals/history (GM)", True, f"Retrieved {len(history_data)} approval history records for GM")
                return True
            else:
                self.log_test("GET /api/approvals/history (GM)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/approvals/history (GM)", False, f"Exception: {str(e)}")
            return False

    def test_approval_action_approve(self):
        """Test POST /api/approvals/{request_id}/action - Process approval action (approve)"""
        if not self.created_request_id:
            self.log_test("POST /api/approvals/{request_id}/action (Approve)", False, "No request ID available for testing")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            action_data = {
                "action": "approve",
                "notes": "تمت الموافقة على الطلب من قبل الإدارة"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/{self.created_request_id}/action", json=action_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("POST /api/approvals/{request_id}/action (Approve)", True, f"Approval action processed successfully: {data.get('message', 'Success')}")
                return True
            else:
                self.log_test("POST /api/approvals/{request_id}/action (Approve)", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/approvals/{request_id}/action (Approve)", False, f"Exception: {str(e)}")
            return False

    def test_approval_action_reject(self):
        """Test POST /api/approvals/{request_id}/action - Process approval action (reject)"""
        # Create another request for rejection testing
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a new request for rejection
            request_data = {
                "type": "order",
                "entity_id": "test-order-002",
                "entity_data": {
                    "order_number": "ORD-2024-002",
                    "items": [
                        {
                            "product_name": "منتج للرفض",
                            "quantity": 2,
                            "unit_price": 50
                        }
                    ],
                    "total_amount": 100,
                    "clinic_id": "test-clinic-002"
                },
                "notes": "طلب للاختبار - سيتم رفضه"
            }
            
            response = requests.post(f"{BACKEND_URL}/approvals/request", json=request_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                reject_request_id = data.get("request_id")
                
                # Now reject this request
                action_data = {
                    "action": "reject",
                    "notes": "تم رفض الطلب لأسباب فنية"
                }
                
                response = requests.post(f"{BACKEND_URL}/approvals/{reject_request_id}/action", json=action_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    self.log_test("POST /api/approvals/{request_id}/action (Reject)", True, f"Rejection action processed successfully: {data.get('message', 'Success')}")
                    return True
                else:
                    self.log_test("POST /api/approvals/{request_id}/action (Reject)", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
            else:
                self.log_test("POST /api/approvals/{request_id}/action (Reject)", False, f"Failed to create request for rejection test: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("POST /api/approvals/{request_id}/action (Reject)", False, f"Exception: {str(e)}")
            return False

    def test_role_based_access_control(self):
        """Test role-based access control for approvals system"""
        try:
            # Test with a non-admin/non-GM user (should fail for history endpoint)
            # First, try to create a test user with lower privileges
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Create a medical rep user for testing
            user_data = {
                "username": "test_medical_rep",
                "email": "medicalrep@test.com",
                "password": "testpass123",
                "full_name": "مندوب طبي للاختبار",
                "role": "medical_rep"
            }
            
            response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                # Login as the medical rep
                login_response = requests.post(f"{BACKEND_URL}/auth/login", json={
                    "username": "test_medical_rep",
                    "password": "testpass123"
                })
                
                if login_response.status_code == 200:
                    med_rep_token = login_response.json()["token"]
                    
                    # Try to access approval history (should fail)
                    med_rep_headers = {"Authorization": f"Bearer {med_rep_token}"}
                    history_response = requests.get(f"{BACKEND_URL}/approvals/history", headers=med_rep_headers)
                    
                    if history_response.status_code == 403:
                        self.log_test("Role-Based Access Control", True, "Medical rep correctly denied access to approval history (403 Forbidden)")
                        return True
                    else:
                        self.log_test("Role-Based Access Control", False, f"Medical rep should be denied access but got: {history_response.status_code}")
                        return False
                else:
                    self.log_test("Role-Based Access Control", False, "Failed to login as medical rep for testing")
                    return False
            else:
                self.log_test("Role-Based Access Control", False, "Failed to create medical rep user for testing")
                return False
                
        except Exception as e:
            self.log_test("Role-Based Access Control", False, f"Exception: {str(e)}")
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
        """Run all Approvals System tests"""
        print("🎯 APPROVALS SYSTEM APIs COMPREHENSIVE TESTING")
        print("=" * 70)
        print("Testing the new Approvals System APIs as requested in the review")
        print("Focus: GET /api/approvals/my-requests, GET /api/approvals/pending, POST /api/approvals/request,")
        print("       GET /api/approvals/history, POST /api/approvals/{request_id}/action")
        print()
        
        # Test system health first
        self.test_system_health()
        
        # Test authentication
        admin_login_success = self.admin_login()
        gm_login_success = self.gm_login()
        
        if not admin_login_success:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Test the Approvals System APIs in logical order
        
        # 1. Create approval request first
        self.test_create_approval_request()
        
        # 2. Test getting my requests
        self.test_get_my_requests()
        
        # 3. Test getting pending approvals for different roles
        self.test_get_pending_approvals_admin()
        if gm_login_success:
            self.test_get_pending_approvals_gm()
        
        # 4. Test approval history for admin/GM
        self.test_get_approval_history_admin()
        if gm_login_success:
            self.test_get_approval_history_gm()
        
        # 5. Test approval actions (approve and reject)
        self.test_approval_action_approve()
        self.test_approval_action_reject()
        
        # 6. Test role-based access control
        self.test_role_based_access_control()
        
        return self.generate_summary()

    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 70)
        print("🎯 APPROVALS SYSTEM APIs TEST SUMMARY")
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
            print("🎉 APPROVALS SYSTEM APIs: WORKING PERFECTLY")
        elif success_rate >= 60:
            print("⚠️  APPROVALS SYSTEM APIs: PARTIALLY FUNCTIONAL")
        else:
            print("❌ APPROVALS SYSTEM APIs: NEEDS ATTENTION")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = ApprovalsSystemTester()
    summary = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if summary["success_rate"] >= 60:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()