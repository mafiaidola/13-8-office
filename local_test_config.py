#!/usr/bin/env python3
"""
Local test configuration for examining the medical management system
"""

import requests
import json
from datetime import datetime

# Local backend URL
BACKEND_URL = "http://localhost:8001/api"
HEADERS = {"Content-Type": "application/json"}

def test_server_health():
    """Test if the backend server is running"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"✅ Server health check: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Server health check failed: {e}")
        return False

def test_auth_endpoints():
    """Test authentication endpoints"""
    print("\n🔐 Testing Authentication")
    print("=" * 50)
    
    # Test admin login
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data, headers=HEADERS, timeout=10)
        print(f"Admin login status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get("access_token") or data.get("token")
            print(f"✅ Admin token received: {admin_token[:20]}..." if admin_token else "❌ No token in response")
            return admin_token
        else:
            print(f"❌ Admin login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return None

def test_price_access_control(admin_token):
    """Test price access control for different user roles"""
    print("\n💰 Testing Price Access Control")
    print("=" * 50)
    
    if not admin_token:
        print("❌ No admin token available for testing")
        return False
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test products endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/products", headers=headers, timeout=10)
        print(f"Products endpoint status: {response.status_code}")
        if response.status_code == 200:
            products = response.json()
            print(f"📊 Found {len(products)} products")
            
            # Check if admin can see prices
            admin_can_see_prices = False
            for product in products[:3]:  # Check first 3 products
                print(f"   - {product.get('name', 'Unknown')}: price={product.get('price', 'N/A')}")
                if "price" in product and product["price"] is not None:
                    admin_can_see_prices = True
            
            print(f"✅ Admin can see prices: {admin_can_see_prices}")
            return admin_can_see_prices
        else:
            print(f"❌ Products endpoint failed: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Products test error: {e}")
        return False

def main():
    """Main test function"""
    print("🏥 Medical Management System - Local Testing")
    print("=" * 70)
    
    # Check server health
    if not test_server_health():
        print("❌ Backend server is not running or accessible")
        return
    
    # Test authentication
    admin_token = test_auth_endpoints()
    
    # Test price access control
    test_price_access_control(admin_token)
    
    print("\n✅ Local testing completed")

if __name__ == "__main__":
    main()