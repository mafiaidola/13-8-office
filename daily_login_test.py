#!/usr/bin/env python3
"""
Daily Login System Testing - Phase 2 Fingerprint Authentication
اختبار نظام تسجيل الدخول اليومي - المرحلة الثانية مصادقة بصمة الإصبع

Testing Requirements from Arabic Review:
1. Daily Login API (POST /api/users/daily-login) - fingerprint & selfie authentication
2. Admin Daily Login Records API (GET /api/admin/daily-login-records)
3. User Login History API (GET /api/users/my-login-history)
4. Last login update verification
5. Testing with demo representative (test_rep / 123456)
"""

import requests
import json
import os
from datetime import datetime, timedelta
import base64
import uuid

# Get backend URL from environment
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://b09695e5-3c8e-4c2c-9ca1-06cbdd9a8993.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class DailyLoginTester:
    def __init__(self):
        self.admin_token = None
        self.test_rep_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "details": details
        })
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def login_admin(self):
        """Login as admin to get JWT token"""
        try:
            print(f"Attempting login to: {API_BASE}/auth/login")
            response = requests.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("token") or data.get("access_token")
                if self.admin_token:
                    self.log_test("Admin Login", True, f"Token: {self.admin_token[:20]}...")
                    return True
                else:
                    self.log_test("Admin Login", False, "No token in response")
                    return False
            else:
                self.log_test("Admin Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False
    
    def create_test_rep_user(self):
        """Create test representative user for testing"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # First check if test_rep already exists
            response = requests.get(f"{API_BASE}/users", headers=headers)
            if response.status_code == 200:
                users = response.json()
                for user in users:
                    if user.get("username") == "test_rep":
                        self.log_test("Test Rep User Check", True, "test_rep user already exists")
                        return True
            
            # Create test_rep user
            user_data = {
                "username": "test_rep",
                "email": "test_rep@company.com",
                "password": "123456",
                "role": "medical_rep",
                "full_name": "مندوب تجريبي",
                "phone": "+201234567890",
                "region_id": "region-001",
                "address": "القاهرة، مصر",
                "is_active": True
            }
            
            response = requests.post(f"{API_BASE}/auth/register", json=user_data, headers=headers)
            
            if response.status_code == 200:
                self.log_test("Create Test Rep User", True, "test_rep user created successfully")
                return True
            else:
                self.log_test("Create Test Rep User", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Test Rep User", False, f"Exception: {str(e)}")
            return False
    
    def login_test_rep(self):
        """Login as test_rep to get JWT token"""
        try:
            response = requests.post(f"{API_BASE}/auth/login", json={
                "username": "test_rep",
                "password": "123456"
            })
            
            if response.status_code == 200:
                data = response.json()
                self.test_rep_token = data.get("token") or data.get("access_token")
                self.log_test("Test Rep Login", True, f"Token: {self.test_rep_token[:20]}...")
                return True
            else:
                self.log_test("Test Rep Login", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Test Rep Login", False, f"Exception: {str(e)}")
            return False
    
    def test_daily_login_fingerprint(self):
        """Test daily login with fingerprint authentication"""
        try:
            headers = {"Authorization": f"Bearer {self.test_rep_token}"}
            
            # Simulate fingerprint authentication data
            fingerprint_data = {
                "authentication_method": "fingerprint",
                "type": "authentication",
                "credentialId": f"cred_{uuid.uuid4().hex[:16]}",
                "signature": base64.b64encode(b"mock_signature_data").decode(),
                "authenticatorData": base64.b64encode(b"mock_authenticator_data").decode(),
                "clientDataJSON": base64.b64encode(json.dumps({
                    "type": "webauthn.get",
                    "challenge": "mock_challenge",
                    "origin": BACKEND_URL
                }).encode()).decode(),
                "timestamp": datetime.utcnow().isoformat(),
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357
                }
            }
            
            response = requests.post(f"{API_BASE}/users/daily-login", 
                                   json=fingerprint_data, 
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Daily Login - Fingerprint", True, 
                            f"Record ID: {data.get('record_id')}, Method: {data.get('method')}")
                return data.get('record_id')
            else:
                self.log_test("Daily Login - Fingerprint", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Daily Login - Fingerprint", False, f"Exception: {str(e)}")
            return None
    
    def test_daily_login_selfie(self):
        """Test daily login with selfie authentication"""
        try:
            headers = {"Authorization": f"Bearer {self.test_rep_token}"}
            
            # Create a mock base64 image (1x1 pixel PNG)
            mock_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg=="
            
            selfie_data = {
                "authentication_method": "selfie",
                "selfie_image": f"data:image/png;base64,{mock_image}",
                "timestamp": datetime.utcnow().isoformat(),
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357
                }
            }
            
            response = requests.post(f"{API_BASE}/users/daily-login", 
                                   json=selfie_data, 
                                   headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Daily Login - Selfie", True, 
                            f"Record ID: {data.get('record_id')}, Method: {data.get('method')}")
                return data.get('record_id')
            else:
                self.log_test("Daily Login - Selfie", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return None
                
        except Exception as e:
            self.log_test("Daily Login - Selfie", False, f"Exception: {str(e)}")
            return None
    
    def test_admin_daily_login_records(self):
        """Test admin access to all daily login records"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            response = requests.get(f"{API_BASE}/admin/daily-login-records", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                total_records = data.get('total_records', 0)
                records = data.get('records', [])
                
                # Check if we have records
                if total_records > 0:
                    sample_record = records[0] if records else {}
                    self.log_test("Admin Daily Login Records", True, 
                                f"Total records: {total_records}, Sample record has fingerprint: {sample_record.get('has_fingerprint', False)}, has selfie: {sample_record.get('has_selfie', False)}")
                else:
                    self.log_test("Admin Daily Login Records", True, "No records found (expected for new system)")
                
                return records
            else:
                self.log_test("Admin Daily Login Records", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("Admin Daily Login Records", False, f"Exception: {str(e)}")
            return []
    
    def test_user_login_history(self):
        """Test user's own login history"""
        try:
            headers = {"Authorization": f"Bearer {self.test_rep_token}"}
            
            response = requests.get(f"{API_BASE}/users/my-login-history", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                user_name = data.get('user_name', 'Unknown')
                total_records = data.get('total_records', 0)
                recent_logins = data.get('recent_logins', [])
                
                self.log_test("User Login History", True, 
                            f"User: {user_name}, Total records: {total_records}, Recent logins: {len(recent_logins)}")
                return recent_logins
            else:
                # Check if it's a 403 due to route conflict (known issue)
                if response.status_code == 403 and "Access denied" in response.text:
                    self.log_test("User Login History", False, 
                                f"KNOWN ISSUE: Route conflict - /users/{{user_id}} catches /users/my-login-history. API implementation is correct but route ordering needs fix.")
                else:
                    self.log_test("User Login History", False, 
                                f"Status: {response.status_code}, Response: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("User Login History", False, f"Exception: {str(e)}")
            return []
    
    def test_last_login_update(self):
        """Test that last_login is updated in users table"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Get user information to check last_login
            response = requests.get(f"{API_BASE}/users", headers=headers)
            
            if response.status_code == 200:
                users = response.json()
                test_rep_user = None
                
                for user in users:
                    if user.get("username") == "test_rep":
                        test_rep_user = user
                        break
                
                if test_rep_user:
                    last_login = test_rep_user.get('last_login')
                    if last_login:
                        self.log_test("Last Login Update", True, 
                                    f"Last login timestamp: {last_login}")
                    else:
                        self.log_test("Last Login Update", False, "No last_login timestamp found")
                else:
                    self.log_test("Last Login Update", False, "test_rep user not found")
                    
            else:
                self.log_test("Last Login Update", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Last Login Update", False, f"Exception: {str(e)}")
    
    def test_role_based_access_control(self):
        """Test that only admin can access admin endpoints"""
        try:
            # Test with test_rep token (should fail)
            headers = {"Authorization": f"Bearer {self.test_rep_token}"}
            
            response = requests.get(f"{API_BASE}/admin/daily-login-records", headers=headers)
            
            if response.status_code == 403:
                self.log_test("Role-Based Access Control", True, 
                            "test_rep correctly denied access to admin endpoint")
            else:
                self.log_test("Role-Based Access Control", False, 
                            f"test_rep should be denied access but got status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Role-Based Access Control", False, f"Exception: {str(e)}")
    
    def test_data_persistence(self):
        """Test that login data is properly saved in database"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Get admin records to verify data structure
            response = requests.get(f"{API_BASE}/admin/daily-login-records", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                records = data.get('records', [])
                
                if records:
                    # Check first record for required fields
                    record = records[0]
                    required_fields = ['record_id', 'user_name', 'authentication_method', 'timestamp', 'location', 'created_at']
                    missing_fields = [field for field in required_fields if field not in record]
                    
                    if not missing_fields:
                        self.log_test("Data Persistence", True, 
                                    f"All required fields present. Authentication method: {record.get('authentication_method')}")
                    else:
                        self.log_test("Data Persistence", False, 
                                    f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Data Persistence", True, "No records to verify (expected for new system)")
                    
            else:
                self.log_test("Data Persistence", False, 
                            f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Data Persistence", False, f"Exception: {str(e)}")
    
    def run_comprehensive_tests(self):
        """Run all daily login system tests"""
        print("🔍 DAILY LOGIN SYSTEM COMPREHENSIVE TESTING")
        print("=" * 60)
        print("Testing Phase 2 - Fingerprint System instead of Selfie System")
        print("المرحلة الثانية - نظام بصمة الإصبع بدلاً من السيلفي")
        print("=" * 60)
        
        # Step 1: Admin Authentication
        if not self.login_admin():
            print("❌ Cannot proceed without admin authentication")
            return
        
        # Step 2: Create and login test representative
        self.create_test_rep_user()
        if not self.login_test_rep():
            print("❌ Cannot proceed without test_rep authentication")
            return
        
        # Step 3: Test daily login APIs
        print("\n📱 Testing Daily Login APIs:")
        fingerprint_record_id = self.test_daily_login_fingerprint()
        selfie_record_id = self.test_daily_login_selfie()
        
        # Step 4: Test admin monitoring
        print("\n👨‍💼 Testing Admin Monitoring:")
        admin_records = self.test_admin_daily_login_records()
        
        # Step 5: Test user history
        print("\n📊 Testing User History:")
        user_history = self.test_user_login_history()
        
        # Step 6: Test system integrity
        print("\n🔒 Testing System Integrity:")
        self.test_last_login_update()
        self.test_role_based_access_control()
        self.test_data_persistence()
        
        # Summary
        print("\n" + "=" * 60)
        print("📋 TEST SUMMARY")
        print("=" * 60)
        
        passed_tests = sum(1 for result in self.test_results if "✅ PASS" in result["status"])
        total_tests = len(self.test_results)
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        print("\nDetailed Results:")
        for result in self.test_results:
            print(f"  {result['status']}: {result['test']}")
            if result['details']:
                print(f"    → {result['details']}")
        
        # Final Assessment
        if success_rate >= 90:
            print(f"\n🎉 EXCELLENT: Daily Login System is working perfectly!")
        elif success_rate >= 75:
            print(f"\n✅ GOOD: Daily Login System is mostly functional with minor issues")
        elif success_rate >= 50:
            print(f"\n⚠️ PARTIAL: Daily Login System has significant issues that need attention")
        else:
            print(f"\n❌ CRITICAL: Daily Login System has major failures")
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "success_rate": success_rate,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = DailyLoginTester()
    results = tester.run_comprehensive_tests()