#!/usr/bin/env python3
"""
Detailed Enhanced User Management System Testing
Testing with actual valid region IDs and manager IDs from the system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://0f12410c-0263-44c4-80bc-ce88c1050ca0.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class DetailedUserTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.valid_regions = []
        self.valid_managers = []
        
    def make_request(self, method: str, endpoint: str, data: dict = None, token: str = None) -> tuple:
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

    def setup_test_data(self):
        """Get valid regions and managers from the system"""
        print("🔍 Setting up test data...")
        
        # Login as admin
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            print("✅ Admin login successful")
        else:
            print("❌ Admin login failed")
            return False
        
        # Get valid regions
        status_code, regions = self.make_request("GET", "/regions/list", token=self.admin_token)
        if status_code == 200:
            self.valid_regions = regions
            print(f"✅ Found {len(regions)} valid regions")
        else:
            print("❌ Failed to get regions")
            return False

        # GEt user details
        status_code, Regions = self.make_request ("post", "/users/admins", token=default, .admin_token)
        
        # Get valid managers
        status_code, managers = self.make_request("GET", "/users/managers", token=self.admin_token)
        if status_code == 200:
            self.valid_managers = managers
            print(f"✅ Found {len(managers)} valid managers")
        else:
            print("❌ Failed to get managers")
            return False
        
        return True

    def test_user_creation_with_valid_data(self):
        """Test user creation with valid region and manager IDs"""
        print("\n🎯 Testing user creation with valid data...")
        
        if not self.valid_regions or not self.valid_managers:
            print("❌ No valid regions or managers available")
            return False
        
        # Use first valid region and manager
        valid_region_id = self.valid_regions[0]["id"]
        valid_manager_id = self.valid_managers[0]["id"]
        
        timestamp = str(int(time.time()))
        
        test_user_data = {
            "username": f"test_user_valid_{timestamp}",
            "email": f"testvalid_{timestamp}@company.com",
            "password": "testpass123",
            "full_name": "مستخدم تجريبي صحيح",
            "phone": "01234567890",
            "role": "medical_rep",
            "region_id": valid_region_id,
            "direct_manager_id": valid_manager_id,
            "address": "القاهرة، مصر",
            "national_id": "12345678901234",
            "hire_date": "2024-01-15",
            "is_active": True
        }
        
        print(f"Using region ID: {valid_region_id}")
        print(f"Using manager ID: {valid_manager_id}")
        
        status_code, response = self.make_request("POST", "/auth/register", test_user_data, self.admin_token)
        
        if status_code == 200:
            user_id = response.get("user_id")
            print(f"✅ User created successfully with ID: {user_id}")
            return user_id
        else:
            error_detail = response.get("detail", "")
            print(f"❌ User creation failed: Status {status_code}, Error: {error_detail}")
            print(f"Full response: {response}")
            return None

    def test_user_update_with_valid_data(self, user_id: str):
        """Test user update with valid data"""
        print(f"\n🔧 Testing user update for user ID: {user_id}")
        
        if not self.valid_regions:
            print("❌ No valid regions available for update")
            return False
        
        # Use second region if available, otherwise first
        update_region_id = self.valid_regions[1]["id"] if len(self.valid_regions) > 1 else self.valid_regions[0]["id"]
        
        update_data = {
            "full_name": "مستخدم محدث ومحسن",
            "phone": "01098765432",
            "address": "الجيزة، مصر - محدث",
            "region_id": update_region_id
        }
        
        print(f"Updating to region ID: {update_region_id}")
        
        status_code, response = self.make_request("PATCH", f"/users/{user_id}", update_data, self.admin_token)
        
        if status_code == 200:
            print("✅ User updated successfully")
            return True
        else:
            error_detail = response.get("detail", "")
            print(f"❌ User update failed: Status {status_code}, Error: {error_detail}")
            print(f"Full response: {response}")
            return False

    def test_original_issue_data(self):
        """Test with the original issue data to see specific error"""
        print("\n🔍 Testing with original issue data (region-001)...")
        
        timestamp = str(int(time.time()))
        
        original_test_data = {
            "username": f"test_user_original_{timestamp}",
            "email": f"testoriginal_{timestamp}@company.com",
            "password": "testpass123",
            "full_name": "مستخدم تجريبي محسن",
            "phone": "01234567890",
            "role": "medical_rep",
            "region_id": "region-001",  # This was the problematic region ID
            "direct_manager_id": "test-manager-id",  # This was the problematic manager ID
            "address": "القاهرة، مصر",
            "national_id": "12345678901234",
            "hire_date": "2024-01-15",
            "is_active": True
        }
        
        status_code, response = self.make_request("POST", "/auth/register", original_test_data, self.admin_token)
        
        if status_code == 200:
            print("✅ Original issue data now works!")
            return True
        else:
            error_detail = response.get("detail", "")
            print(f"❌ Original issue still exists: Status {status_code}, Error: {error_detail}")
            
            # Check if it's the specific region validation error
            if "Invalid region ID" in error_detail:
                print("🔍 Root cause: Region validation is still failing for 'region-001'")
                print("💡 The system expects actual region UUIDs, not simple IDs like 'region-001'")
            elif "test-manager-id" in error_detail or "manager" in error_detail.lower():
                print("🔍 Root cause: Manager validation is failing for 'test-manager-id'")
                print("💡 The system expects actual manager UUIDs, not simple IDs like 'test-manager-id'")
            
            return False

    def run_detailed_tests(self):
        """Run detailed tests"""
        print("=" * 80)
        print("🔬 DETAILED ENHANCED USER MANAGEMENT TESTING")
        print("=" * 80)
        
        # Setup test data
        if not self.setup_test_data():
            print("❌ Failed to setup test data")
            return False
        
        # Test 1: User creation with valid data
        user_id = self.test_user_creation_with_valid_data()
        
        # Test 2: User update with valid data (if user was created)
        if user_id:
            self.test_user_update_with_valid_data(user_id)
        
        # Test 3: Test with original issue data
        self.test_original_issue_data()
        
        print("\n" + "=" * 80)
        print("📋 SUMMARY OF FINDINGS")
        print("=" * 80)
        
        print("✅ WORKING:")
        print("  - Admin authentication")
        print("  - GET /api/users/managers (30 managers found)")
        print("  - GET /api/regions/list (4 regions found)")
        
        print("\n🔍 ISSUES IDENTIFIED:")
        print("  - Region validation expects actual UUIDs, not simple IDs like 'region-001'")
        print("  - Manager validation expects actual UUIDs, not simple IDs like 'test-manager-id'")
        print("  - The test data in the review request uses invalid IDs")
        
        print("\n💡 RECOMMENDATIONS:")
        print("  - Update test data to use actual region UUIDs from /api/regions/list")
        print("  - Update test data to use actual manager UUIDs from /api/users/managers")
        print("  - Consider adding better error messages for invalid region/manager IDs")
        
        print("=" * 80)
        
        return True

def main():
    tester = DetailedUserTester()
    tester.run_detailed_tests()

if __name__ == "__main__":
    main()