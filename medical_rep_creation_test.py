#!/usr/bin/env python3
"""
Medical Representative Creation Test
اختبار إنشاء مندوب طبي جديد للاختبار

المطلوب:
1) تسجيل دخول admin/admin123
2) إنشاء مستخدم جديد بدور medical_rep:
   - username: test_medical_rep
   - password: test123
   - full_name: مندوب طبي اختبار
   - role: medical_rep
   - email: test_rep@example.com
   - phone: 01234567890
3) اختبار تسجيل دخول المندوب الطبي الجديد
4) التأكد من أن المستخدم تم إنشاؤه بنجاح

الهدف: إنشاء مستخدم ليتمكن من رؤية تسجيل العيادات
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://90173345-bd28-4520-b247-a1bbdbaac9ff.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

def print_test_header(test_name):
    print(f"\n{'='*60}")
    print(f"🧪 {test_name}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def make_request(method, url, headers=None, json_data=None, timeout=30):
    """Make HTTP request with error handling"""
    try:
        start_time = time.time()
        
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=json_data, timeout=timeout)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=json_data, timeout=timeout)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=timeout)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        elapsed_time = (time.time() - start_time) * 1000
        
        print(f"📡 {method.upper()} {url}")
        print(f"⏱️  Response time: {elapsed_time:.2f}ms")
        print(f"📊 Status code: {response.status_code}")
        
        if response.status_code >= 400:
            print(f"❌ Error response: {response.text}")
        
        return response, elapsed_time
        
    except requests.exceptions.Timeout:
        print(f"⏰ Request timeout after {timeout}s")
        return None, 0
    except requests.exceptions.ConnectionError:
        print(f"🔌 Connection error to {url}")
        return None, 0
    except Exception as e:
        print(f"💥 Request error: {str(e)}")
        return None, 0

def test_admin_login():
    """Test 1: Admin Login"""
    print_test_header("Test 1: Admin Login (admin/admin123)")
    
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response, elapsed_time = make_request("POST", f"{API_BASE}/auth/login", json_data=login_data)
    
    if not response:
        print_error("Failed to connect to login API")
        return None
    
    if response.status_code == 200:
        try:
            data = response.json()
            if "access_token" in data:
                print_success(f"Admin login successful! Token received in {elapsed_time:.2f}ms")
                print_info(f"User: {data.get('user', {}).get('full_name', 'N/A')}")
                print_info(f"Role: {data.get('user', {}).get('role', 'N/A')}")
                return data["access_token"]
            else:
                print_error("Login response missing access_token")
                return None
        except json.JSONDecodeError:
            print_error("Invalid JSON response from login")
            return None
    else:
        print_error(f"Login failed with status {response.status_code}")
        try:
            error_data = response.json()
            print_error(f"Error details: {error_data}")
        except:
            print_error(f"Error response: {response.text}")
        return None

def test_create_medical_rep(admin_token):
    """Test 2: Create Medical Representative User"""
    print_test_header("Test 2: Create Medical Representative User")
    
    if not admin_token:
        print_error("Cannot create user without admin token")
        return False
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    user_data = {
        "username": "test_medical_rep",
        "password": "test123",
        "full_name": "مندوب طبي اختبار",
        "role": "medical_rep",
        "email": "test_rep@example.com",
        "phone": "01234567890",
        "is_active": True
    }
    
    print_info("Creating user with data:")
    for key, value in user_data.items():
        if key != "password":  # Don't print password
            print(f"  {key}: {value}")
    
    response, elapsed_time = make_request("POST", f"{API_BASE}/users", headers=headers, json_data=user_data)
    
    if not response:
        print_error("Failed to connect to user creation API")
        return False
    
    if response.status_code == 200:
        try:
            data = response.json()
            if data.get("success"):
                print_success(f"Medical rep user created successfully in {elapsed_time:.2f}ms")
                print_info(f"User ID: {data.get('user', {}).get('id', 'N/A')}")
                print_info(f"Username: {data.get('user', {}).get('username', 'N/A')}")
                print_info(f"Full Name: {data.get('user', {}).get('full_name', 'N/A')}")
                print_info(f"Role: {data.get('user', {}).get('role', 'N/A')}")
                return True
            else:
                print_error(f"User creation failed: {data.get('message', 'Unknown error')}")
                return False
        except json.JSONDecodeError:
            print_error("Invalid JSON response from user creation")
            return False
    elif response.status_code == 400:
        try:
            error_data = response.json()
            if "Username already exists" in str(error_data):
                print_info("User already exists - this is expected if running test multiple times")
                return True
            else:
                print_error(f"User creation failed: {error_data}")
                return False
        except:
            print_error(f"User creation failed with status 400: {response.text}")
            return False
    else:
        print_error(f"User creation failed with status {response.status_code}")
        try:
            error_data = response.json()
            print_error(f"Error details: {error_data}")
        except:
            print_error(f"Error response: {response.text}")
        return False

def test_medical_rep_login():
    """Test 3: Medical Representative Login"""
    print_test_header("Test 3: Medical Representative Login")
    
    login_data = {
        "username": "test_medical_rep",
        "password": "test123"
    }
    
    response, elapsed_time = make_request("POST", f"{API_BASE}/auth/login", json_data=login_data)
    
    if not response:
        print_error("Failed to connect to login API")
        return None
    
    if response.status_code == 200:
        try:
            data = response.json()
            if "access_token" in data:
                print_success(f"Medical rep login successful! Token received in {elapsed_time:.2f}ms")
                print_info(f"User: {data.get('user', {}).get('full_name', 'N/A')}")
                print_info(f"Role: {data.get('user', {}).get('role', 'N/A')}")
                print_info(f"Email: {data.get('user', {}).get('email', 'N/A')}")
                print_info(f"Phone: {data.get('user', {}).get('phone', 'N/A')}")
                return data["access_token"]
            else:
                print_error("Login response missing access_token")
                return None
        except json.JSONDecodeError:
            print_error("Invalid JSON response from login")
            return None
    else:
        print_error(f"Medical rep login failed with status {response.status_code}")
        try:
            error_data = response.json()
            print_error(f"Error details: {error_data}")
        except:
            print_error(f"Error response: {response.text}")
        return None

def test_verify_user_creation(admin_token):
    """Test 4: Verify User Creation by Getting Users List"""
    print_test_header("Test 4: Verify User Creation")
    
    if not admin_token:
        print_error("Cannot verify users without admin token")
        return False
    
    headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }
    
    response, elapsed_time = make_request("GET", f"{API_BASE}/users", headers=headers)
    
    if not response:
        print_error("Failed to connect to users API")
        return False
    
    if response.status_code == 200:
        try:
            users = response.json()
            print_success(f"Users list retrieved successfully in {elapsed_time:.2f}ms")
            print_info(f"Total users found: {len(users)}")
            
            # Look for our test medical rep
            test_user = None
            for user in users:
                if user.get("username") == "test_medical_rep":
                    test_user = user
                    break
            
            if test_user:
                print_success("Test medical rep user found in users list!")
                print_info(f"User details:")
                print_info(f"  ID: {test_user.get('id', 'N/A')}")
                print_info(f"  Username: {test_user.get('username', 'N/A')}")
                print_info(f"  Full Name: {test_user.get('full_name', 'N/A')}")
                print_info(f"  Role: {test_user.get('role', 'N/A')}")
                print_info(f"  Email: {test_user.get('email', 'N/A')}")
                print_info(f"  Phone: {test_user.get('phone', 'N/A')}")
                print_info(f"  Active: {test_user.get('is_active', 'N/A')}")
                return True
            else:
                print_error("Test medical rep user NOT found in users list")
                return False
                
        except json.JSONDecodeError:
            print_error("Invalid JSON response from users API")
            return False
    else:
        print_error(f"Failed to get users list with status {response.status_code}")
        try:
            error_data = response.json()
            print_error(f"Error details: {error_data}")
        except:
            print_error(f"Error response: {response.text}")
        return False

def test_medical_rep_clinics_access(medical_rep_token):
    """Test 5: Test Medical Rep Access to Clinics"""
    print_test_header("Test 5: Medical Rep Access to Clinics")
    
    if not medical_rep_token:
        print_error("Cannot test clinics access without medical rep token")
        return False
    
    headers = {
        "Authorization": f"Bearer {medical_rep_token}",
        "Content-Type": "application/json"
    }
    
    response, elapsed_time = make_request("GET", f"{API_BASE}/clinics", headers=headers)
    
    if not response:
        print_error("Failed to connect to clinics API")
        return False
    
    if response.status_code == 200:
        try:
            clinics = response.json()
            print_success(f"Medical rep can access clinics API in {elapsed_time:.2f}ms")
            print_info(f"Clinics accessible to medical rep: {len(clinics)}")
            
            if len(clinics) > 0:
                print_info("Sample clinic data:")
                sample_clinic = clinics[0]
                for key in ["id", "clinic_name", "doctor_name", "phone", "address"]:
                    if key in sample_clinic:
                        print_info(f"  {key}: {sample_clinic[key]}")
            else:
                print_info("No clinics assigned to this medical rep yet")
            
            return True
                
        except json.JSONDecodeError:
            print_error("Invalid JSON response from clinics API")
            return False
    else:
        print_error(f"Failed to access clinics with status {response.status_code}")
        try:
            error_data = response.json()
            print_error(f"Error details: {error_data}")
        except:
            print_error(f"Error response: {response.text}")
        return False

def main():
    """Main test execution"""
    print("🚀 Starting Medical Representative Creation Test")
    print(f"🌐 Backend URL: {BACKEND_URL}")
    print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test results tracking
    test_results = []
    
    # Test 1: Admin Login
    admin_token = test_admin_login()
    test_results.append(("Admin Login", admin_token is not None))
    
    # Test 2: Create Medical Rep User
    user_created = test_create_medical_rep(admin_token)
    test_results.append(("Create Medical Rep User", user_created))
    
    # Test 3: Medical Rep Login
    medical_rep_token = test_medical_rep_login()
    test_results.append(("Medical Rep Login", medical_rep_token is not None))
    
    # Test 4: Verify User Creation
    user_verified = test_verify_user_creation(admin_token)
    test_results.append(("Verify User Creation", user_verified))
    
    # Test 5: Test Medical Rep Clinics Access
    clinics_access = test_medical_rep_clinics_access(medical_rep_token)
    test_results.append(("Medical Rep Clinics Access", clinics_access))
    
    # Print final results
    print_test_header("FINAL TEST RESULTS")
    
    passed_tests = 0
    total_tests = len(test_results)
    
    for test_name, passed in test_results:
        if passed:
            print_success(f"{test_name}: PASSED")
            passed_tests += 1
        else:
            print_error(f"{test_name}: FAILED")
    
    success_rate = (passed_tests / total_tests) * 100
    print(f"\n📊 Overall Success Rate: {success_rate:.1f}% ({passed_tests}/{total_tests} tests passed)")
    
    if success_rate >= 80:
        print_success("🎉 Medical Representative Creation Test COMPLETED SUCCESSFULLY!")
        print_info("✅ The test medical rep user has been created and can access the system")
        print_info("✅ The user can now be used to test clinic registration functionality")
    else:
        print_error("❌ Medical Representative Creation Test FAILED")
        print_info("Some critical functionality is not working properly")
    
    print(f"\n📅 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    return success_rate >= 80

if __name__ == "__main__":
    main()