#!/usr/bin/env python3
"""
تشخيص مفصل لمشكلة إخفاء الأسعار
Detailed diagnosis for price hiding issue
"""

import asyncio
import aiohttp
import json

BACKEND_URL = "https://d7110555-9702-4d91-b5fc-522e9a08df1c.preview.emergentagent.com/api"

async def detailed_diagnosis():
    """تشخيص مفصل للمشكلة"""
    connector = aiohttp.TCPConnector(ssl=False)
    timeout = aiohttp.ClientTimeout(total=30)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        # تسجيل دخول الأدمن
        login_data = {"username": "admin", "password": "admin123"}
        async with session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
            if response.status != 200:
                print("❌ فشل تسجيل دخول الأدمن")
                return
            
            data = await response.json()
            admin_token = data.get("access_token")
            print(f"✅ تم تسجيل دخول الأدمن بنجاح")
        
        # جلب المنتجات مع الأدمن
        headers = {"Authorization": f"Bearer {admin_token}"}
        async with session.get(f"{BACKEND_URL}/products", headers=headers) as response:
            if response.status == 200:
                products = await response.json()
                if products:
                    first_product = products[0]
                    print(f"\n🔍 تفاصيل المنتج الأول للأدمن:")
                    print(f"   • الحقول الموجودة: {list(first_product.keys())}")
                    print(f"   • يحتوي على 'price': {'price' in first_product}")
                    print(f"   • يحتوي على 'price_type': {'price_type' in first_product}")
                    
                    if 'price' in first_product:
                        print(f"   • قيمة price: {first_product['price']}")
                    if 'price_type' in first_product:
                        print(f"   • قيمة price_type: {first_product['price_type']}")
                    
                    # طباعة المنتج كاملاً للتشخيص
                    print(f"\n📋 المنتج الأول كاملاً:")
                    print(json.dumps(first_product, indent=2, ensure_ascii=False))
                else:
                    print("❌ لا توجد منتجات")
            else:
                print(f"❌ فشل جلب المنتجات: {response.status}")

if __name__ == "__main__":
    asyncio.run(detailed_diagnosis())