#!/usr/bin/env python3
"""
Initialize sample data for testing
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def create_sample_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if clinics already exist
    existing_clinics = await db.clinics.count_documents({})
    if existing_clinics > 0:
        print(f"✅ Sample data already exists! ({existing_clinics} clinics found)")
        client.close()
        return
    
    # Create sample clinics
    sample_clinics = [
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة الدكتور أحمد محمد",
            "owner_name": "د. أحمد محمد",
            "location": "القاهرة - مصر الجديدة",
            "phone": "+201234567890",
            "email": "ahmed@clinic.com",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة الدكتورة فاطمة علي",
            "owner_name": "د. فاطمة علي",
            "location": "الجيزة - المهندسين",
            "phone": "+201234567891",
            "email": "fatma@clinic.com",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مركز الشفاء الطبي",
            "owner_name": "د. محمد حسن",
            "location": "الإسكندرية - سيدي جابر",
            "phone": "+201234567892",
            "email": "shifa@clinic.com",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.clinics.insert_many(sample_clinics)
    print(f"✅ Created {len(sample_clinics)} sample clinics!")
    
    # Create sample products
    sample_products = [
        {
            "id": str(uuid.uuid4()),
            "name": "أسبرين 100 مجم",
            "category": "أدوية القلب",
            "unit": "قرص",
            "price": 15.50,
            "current_stock": 100,
            "min_stock": 20,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "باراسيتامول 500 مجم",
            "category": "مسكنات",
            "unit": "قرص",
            "price": 8.25,
            "current_stock": 200,
            "min_stock": 50,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.products.insert_many(sample_products)
    print(f"✅ Created {len(sample_products)} sample products!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())