#!/usr/bin/env python3
"""
Debug Enhanced User Management APIs
"""

import requests
import json

BASE_URL = "https://8d14235e-0f6d-48c0-b48d-17cc8b061c29.preview.emergentagent.com/api"

def test_debug():
    # Login as admin
    login_response = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    print(f"Admin login: {login_response.status_code}")
    print(f"Response: {login_response.json()}")
    
    if login_response.status_code == 200:
        token = login_response.json()["token"]
        
        # Test auth/me endpoint
        headers = {"Authorization": f"Bearer {token}"}
        me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"\nAuth/me: {me_response.status_code}")
        print(f"Response: {me_response.json()}")
        
        # Test enhanced-list endpoint
        enhanced_response = requests.get(f"{BASE_URL}/users/enhanced-list", headers=headers)
        print(f"\nEnhanced list: {enhanced_response.status_code}")
        print(f"Response: {enhanced_response.json()}")
        
        # Test regular users endpoint
        users_response = requests.get(f"{BASE_URL}/users", headers=headers)
        print(f"\nRegular users: {users_response.status_code}")
        print(f"Response: {users_response.json()}")

if __name__ == "__main__":
    test_debug()