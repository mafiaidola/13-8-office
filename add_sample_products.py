#!/usr/bin/env python3
"""
إضافة منتجات تجريبية للمخازن الثمانية
Add sample products to the 8 warehouses
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import random

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'fastapi_db'

async def add_sample_products():
    """Add sample products to warehouses"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    # Get all warehouses
    warehouses = await db.warehouses.find({}).to_list(1000)
    
    if not warehouses:
        print("❌ لا توجد مخازن! يرجى تشغيل setup_warehouses.py أولاً")
        return
    
    # Sample products
    sample_products = [
        {"name": "أوجمنتين 1 جم", "unit": "علبة", "category": "مضادات حيوية"},
        {"name": "كيتولاك 10 مج", "unit": "علبة", "category": "مسكنات"},
        {"name": "أموكسيل 500 مج", "unit": "علبة", "category": "مضادات حيوية"},
        {"name": "بروفين 600 مج", "unit": "علبة", "category": "مسكنات"},
        {"name": "زانتاك 150 مج", "unit": "علبة", "category": "أدوية المعدة"},
        {"name": "لوسيك 20 مج", "unit": "علبة", "category": "أدوية المعدة"},
        {"name": "نورماتين 5 مج", "unit": "علبة", "category": "أدوية القلب"},
        {"name": "كونكور 5 مج", "unit": "علبة", "category": "أدوية القلب"},
        {"name": "جلوكوفاج 500 مج", "unit": "علبة", "category": "أدوية السكر"},
        {"name": "أماريل 2 مج", "unit": "علبة", "category": "أدوية السكر"},
    ]
    
    # Clear existing products
    await db.products.delete_many({})
    await db.product_stock.delete_many({})
    print("🗑️ تم حذف المنتجات الموجودة")
    
    total_products_created = 0
    
    for warehouse in warehouses:
        print(f"\n📦 إضافة منتجات لـ {warehouse['name']}...")
        
        # Add random products to each warehouse
        num_products = random.randint(6, 10)  # Random number of products per warehouse
        selected_products = random.sample(sample_products, num_products)
        
        for product_info in selected_products:
            # Create product
            product_id = str(uuid.uuid4())
            product = {
                "id": product_id,
                "name": product_info["name"],
                "unit": product_info["unit"],
                "category": product_info["category"],
                "price": round(random.uniform(20, 200), 2),  # Random price between 20-200 EGP
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await db.products.insert_one(product)
            
            # Create stock entry
            stock_quantity = random.randint(0, 50)  # Random stock 0-50
            stock_entry = {
                "id": str(uuid.uuid4()),
                "product_id": product_id,
                "warehouse_id": warehouse["id"],
                "quantity": stock_quantity,
                "reserved_quantity": 0,
                "last_updated": datetime.utcnow(),
                "updated_by": "system"
            }
            
            await db.product_stock.insert_one(stock_entry)
            
            total_products_created += 1
            
            # Print stock status
            status = "متوفر ✅" if stock_quantity > 10 else "مخزون منخفض ⚠️" if stock_quantity > 0 else "غير متوفر ❌"
            print(f"  - {product_info['name']}: {stock_quantity} {product_info['unit']} ({status})")
    
    client.close()
    print(f"\n🎉 تم إنشاء {total_products_created} منتج في {len(warehouses)} مخزن بنجاح!")
    
    # Print summary
    print(f"\n📊 ملخص المخازن:")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    for warehouse in warehouses:
        stocks = await db.product_stock.find({"warehouse_id": warehouse["id"]}).to_list(1000)
        available = len([s for s in stocks if s["quantity"] > 10])
        low_stock = len([s for s in stocks if 0 < s["quantity"] <= 10])
        out_of_stock = len([s for s in stocks if s["quantity"] == 0])
        
        print(f"  {warehouse['name']} ({warehouse['location']}):")
        print(f"    - متوفر: {available} منتج")
        print(f"    - مخزون منخفض: {low_stock} منتج")
        print(f"    - غير متوفر: {out_of_stock} منتج")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(add_sample_products())