#!/usr/bin/env python3
"""
إعداد المخازن الثمانية المطلوبة
Setup the 8 required warehouses
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'fastapi_db'

async def setup_warehouses():
    """Setup the 8 warehouses as specified"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    warehouses = [
        {
            "id": str(uuid.uuid4()),
            "name": "المخزن الرئيسي",
            "location": "التجمع الخامس",
            "type": "main",
            "address": "التجمع الخامس، القاهرة الجديدة",
            "phone": "01000000000",
            "manager_id": "admin",
            "capacity": 10000,
            "current_stock": 0,
            "status": "active",
            "region": "القاهرة",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن القاهرة الفرعي",
            "location": "القاهرة",
            "type": "branch",
            "address": "مدينة نصر، القاهرة",
            "phone": "01000000001",
            "manager_id": "admin",
            "capacity": 5000,
            "current_stock": 0,
            "status": "active",
            "region": "القاهرة",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الجيزة الفرعي",
            "location": "الجيزة",
            "type": "branch",
            "address": "الدقي، الجيزة",
            "phone": "01000000002",
            "manager_id": "admin",
            "capacity": 4000,
            "current_stock": 0,
            "status": "active",
            "region": "الجيزة",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الإسكندرية الفرعي",
            "location": "الإسكندرية",
            "type": "branch",
            "address": "سموحة، الإسكندرية",
            "phone": "01000000003",
            "manager_id": "admin",
            "capacity": 4500,
            "current_stock": 0,
            "status": "active",
            "region": "الإسكندرية",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الغربية الفرعي",
            "location": "الغربية",
            "type": "branch",
            "address": "طنطا، الغربية",
            "phone": "01000000004",
            "manager_id": "admin",
            "capacity": 3000,
            "current_stock": 0,
            "status": "active",
            "region": "الغربية",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الدقهلية الفرعي",
            "location": "الدقهلية",
            "type": "branch",
            "address": "المنصورة، الدقهلية",
            "phone": "01000000005",
            "manager_id": "admin",
            "capacity": 3500,
            "current_stock": 0,
            "status": "active",
            "region": "الدقهلية",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن سوهاج الفرعي",
            "location": "سوهاج",
            "type": "branch",
            "address": "سوهاج الجديدة، سوهاج",
            "phone": "01000000006",
            "manager_id": "admin",
            "capacity": 2500,
            "current_stock": 0,
            "status": "active",
            "region": "سوهاج",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الجيزة 2 الفرعي",
            "location": "الجيزة 2",
            "type": "branch",
            "address": "6 أكتوبر، الجيزة",
            "phone": "01000000007",
            "manager_id": "admin",
            "capacity": 3000,
            "current_stock": 0,
            "status": "active",
            "region": "الجيزة",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    # Clear existing warehouses
    await db.warehouses.delete_many({})
    print("🗑️ تم حذف المخازن الموجودة")
    
    # Insert new warehouses
    result = await db.warehouses.insert_many(warehouses)
    print(f"✅ تم إنشاء {len(result.inserted_ids)} مخزن بنجاح")
    
    # Display created warehouses
    print("\n📦 المخازن المُنشأة:")
    for i, warehouse in enumerate(warehouses, 1):
        print(f"{i}. {warehouse['name']} - {warehouse['location']} (السعة: {warehouse['capacity']})")
    
    client.close()
    print("\n🎉 تم إعداد نظام المخازن بنجاح!")

if __name__ == "__main__":
    asyncio.run(setup_warehouses())