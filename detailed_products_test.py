#!/usr/bin/env python3
"""
اختبار تفصيلي للتأكد من أن warehouse products endpoint يعيد المنتجات بشكل صحيح
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://0c7671be-0c51-4a84-bbb3-9b77f9ff726f.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class DetailedProductsTest:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        
    def login_admin(self):
        """تسجيل دخول الأدمن"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                print(f"✅ تسجيل دخول ناجح")
                return True
            else:
                print(f"❌ فشل تسجيل الدخول: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ خطأ في تسجيل الدخول: {str(e)}")
            return False
    
    def test_warehouse_products_detailed(self):
        """اختبار تفصيلي لمنتجات المخزن"""
        print("\n🔍 اختبار تفصيلي لمنتجات المخزن...")
        
        # Get warehouses first
        try:
            response = self.session.get(f"{BACKEND_URL}/warehouses", timeout=10)
            if response.status_code != 200:
                print(f"❌ فشل في الحصول على المخازن: {response.status_code}")
                return
            
            warehouses = response.json()
            if not warehouses:
                print("❌ لا توجد مخازن")
                return
            
            warehouse = warehouses[0]
            warehouse_id = warehouse.get('id')
            warehouse_name = warehouse.get('name', 'Unknown')
            
            print(f"🎯 اختبار المخزن: {warehouse_name}")
            print(f"   ID: {warehouse_id}")
            
            # Test warehouse products endpoint
            response = self.session.get(f"{BACKEND_URL}/warehouses/{warehouse_id}/products", timeout=10)
            
            print(f"📊 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"📊 Response Data Structure:")
                    print(f"   Success: {data.get('success', 'Not specified')}")
                    print(f"   Total Products: {data.get('total_products', 'Not specified')}")
                    
                    warehouse_info = data.get('warehouse', {})
                    print(f"   Warehouse Info: {warehouse_info}")
                    
                    products = data.get('products', [])
                    print(f"   Products Array Length: {len(products)}")
                    
                    if products:
                        print(f"   Sample Product:")
                        sample_product = products[0]
                        for key, value in sample_product.items():
                            print(f"     {key}: {value}")
                        
                        print(f"   All Products:")
                        for i, product in enumerate(products):
                            print(f"     {i+1}. {product.get('name', 'Unknown')} - {product.get('quantity', 0)} units - {product.get('price', 0)} EGP")
                    else:
                        print("   ⚠️ No products returned in the array")
                    
                    # Full response for debugging
                    print(f"\n📋 Full Response:")
                    print(json.dumps(data, indent=2, ensure_ascii=False))
                    
                except json.JSONDecodeError as e:
                    print(f"❌ JSON Decode Error: {str(e)}")
                    print(f"Raw Response: {response.text}")
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                print(f"Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    def run_test(self):
        """تشغيل الاختبار التفصيلي"""
        print("🔍 بدء الاختبار التفصيلي لمنتجات المخزن")
        print("=" * 60)
        
        if not self.login_admin():
            return
        
        self.test_warehouse_products_detailed()

def main():
    """تشغيل الاختبار"""
    test = DetailedProductsTest()
    test.run_test()

if __name__ == "__main__":
    main()