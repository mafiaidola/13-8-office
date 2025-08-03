#!/usr/bin/env python3
"""
Debug Enhanced List API specifically
"""

import requests
import json

BASE_URL = "https://6fc37004-de78-473a-b926-f0438820a235.preview.emergentagent.com/api"

def test_enhanced_list_debug():
    # Login as admin
    login_response = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    print(f"Admin login: {login_response.status_code}")
    
    if login_response.status_code == 200:
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test different endpoints to see which ones work
        endpoints_to_test = [
            "/users",
            "/users/enhanced-list", 
            "/users/update-last-seen",
            "/users/upload-photo?user_id=test",
            "/dashboard/statistics"
        ]
        
        for endpoint in endpoints_to_test:
            if endpoint == "/users/update-last-seen":
                response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json={})
            elif endpoint == "/users/upload-photo?user_id=test":
                response = requests.post(f"{BASE_URL}{endpoint}", headers=headers, json={"photo": "test"})
            else:
                response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            
            print(f"{endpoint}: {response.status_code}")
            if response.status_code != 200:
                try:
                    print(f"  Error: {response.json()}")
                except:
                    print(f"  Error: {response.text}")

if __name__ == "__main__":
    test_enhanced_list_debug()