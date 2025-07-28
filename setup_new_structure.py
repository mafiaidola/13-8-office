#!/usr/bin/env python3
"""
Setup New Organizational Structure
Add users and warehouses based on the provided structure
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import uuid
from datetime import datetime

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'ep_group_db')]

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def clear_existing_data():
    """Clear existing users (except admin) and warehouses"""
    print("🗑️ Clearing existing data...")
    
    # Keep only admin user
    await db.users.delete_many({"username": {"$ne": "admin"}})
    await db.warehouses.delete_many({})
    
    print("✅ Existing data cleared")

async def create_users():
    """Create users based on the new structure"""
    print("👥 Creating users...")
    
    users_data = [
        # Line 1 Management
        {
            "id": str(uuid.uuid4()),
            "username": "ahmed.gamal",
            "password": hash_password("ahmed123"),
            "full_name": "Dr Ahmed Gamal",
            "email": "ahmed.gamal@epgroup.com",
            "phone": "01001234567",
            "role": "line_manager",
            "line": "line_1",
            "region_id": "all_regions_l1",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Reports to GM/Admin
        },
        {
            "id": str(uuid.uuid4()),
            "username": "mina.alageeb",
            "password": hash_password("mina123"),
            "full_name": "Dr Mina Alageeb",
            "email": "mina.alageeb@epgroup.com",
            "phone": "01001234568",
            "role": "area_manager",
            "line": "line_1",
            "region_id": "cairo_upper_egypt",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ahmed Gamal's ID
        },
        
        # Line 1 District Managers
        {
            "id": str(uuid.uuid4()),
            "username": "ibrahim.ragab",
            "password": hash_password("ibrahim123"),
            "full_name": "Ibrahim Ragab",
            "email": "ibrahim.ragab@epgroup.com",
            "phone": "01001234569",
            "role": "district_manager",
            "line": "line_1",
            "region_id": "giza",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mina's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "samar.rostom",
            "password": hash_password("samar123"),
            "full_name": "Samar Rostom",
            "email": "samar.rostom@epgroup.com",
            "phone": "01001234570",
            "role": "district_manager",
            "line": "line_1",
            "region_id": "cairo",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mina's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "anas.alkholy",
            "password": hash_password("anas123"),
            "full_name": "Anas Alkholy",
            "email": "anas.alkholy@epgroup.com",
            "phone": "01001234571",
            "role": "district_manager",
            "line": "line_1",
            "region_id": "delta",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ahmed's ID (Delta reports to Line Manager)
        },
        {
            "id": str(uuid.uuid4()),
            "username": "khloud",
            "password": hash_password("khloud123"),
            "full_name": "Khloud",
            "email": "khloud@epgroup.com",
            "phone": "01001234572",
            "role": "district_manager",
            "line": "line_1",
            "region_id": "delta",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ahmed's ID
        },
        
        # Line 1 Key Account Reps
        {
            "id": str(uuid.uuid4()),
            "username": "amr.essam",
            "password": hash_password("amr123"),
            "full_name": "Amr Essam",
            "email": "amr.essam@epgroup.com",
            "phone": "01001234573",
            "role": "key_account",
            "line": "line_1",
            "region_id": "giza",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ibrahim's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "shahinda.shenouda",
            "password": hash_password("shahinda123"),
            "full_name": "Shahinda Shenouda",
            "email": "shahinda.shenouda@epgroup.com",
            "phone": "01001234574",
            "role": "key_account",
            "line": "line_1",
            "region_id": "upper_egypt",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mina's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "salma.mohamed",
            "password": hash_password("salma123"),
            "full_name": "Salma Mohamed",
            "email": "salma.mohamed@epgroup.com",
            "phone": "01001234575",
            "role": "key_account",
            "line": "line_1",
            "region_id": "alexandria",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ahmed's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "nagwa.amr",
            "password": hash_password("nagwa123"),
            "full_name": "Nagwa Amr",
            "email": "nagwa.amr@epgroup.com",
            "phone": "01001234576",
            "role": "key_account",
            "line": "line_1",
            "region_id": "alexandria",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Ahmed's ID
        },
        
        # Line 2 Management
        {
            "id": str(uuid.uuid4()),
            "username": "mohammed.hamed",
            "password": hash_password("mohammed123"),
            "full_name": "Mohammed Hamed",
            "email": "mohammed.hamed@epgroup.com",
            "phone": "01001234577",
            "role": "line_manager",
            "line": "line_2",
            "region_id": "all_regions_l2",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Reports to GM/Admin
        },
        {
            "id": str(uuid.uuid4()),
            "username": "aya.nada",
            "password": hash_password("aya123"),
            "full_name": "Dr Aya Nada",
            "email": "aya.nada@epgroup.com",
            "phone": "01001234578",
            "role": "area_manager",
            "line": "line_2",
            "region_id": "delta_alexandria",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mohammed's ID
        },
        
        # Line 2 District Managers
        {
            "id": str(uuid.uuid4()),
            "username": "sara.ali",
            "password": hash_password("sara123"),
            "full_name": "Sara Ali",
            "email": "sara.ali@epgroup.com",
            "phone": "01001234579",
            "role": "district_manager",
            "line": "line_2",
            "region_id": "cairo",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mohammed's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "asmaa.abdelaziz",
            "password": hash_password("asmaa123"),
            "full_name": "Asmaa Abdelaziz",
            "email": "asmaa.abdelaziz@epgroup.com",
            "phone": "01001234580",
            "role": "district_manager",
            "line": "line_2",
            "region_id": "giza",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mohammed's ID
        },
        
        # Line 2 Key Account Reps
        {
            "id": str(uuid.uuid4()),
            "username": "elaria.ashraf",
            "password": hash_password("elaria123"),
            "full_name": "Elaria Ashraf",
            "email": "elaria.ashraf@epgroup.com",
            "phone": "01001234581",
            "role": "key_account",
            "line": "line_2",
            "region_id": "upper_egypt",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Mohammed's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "mona.mohamed",
            "password": hash_password("mona123"),
            "full_name": "Mona Mohamed",
            "email": "mona.mohamed@epgroup.com",
            "phone": "01001234582",
            "role": "key_account",
            "line": "line_2",
            "region_id": "delta",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Aya's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "fatma",
            "password": hash_password("fatma123"),
            "full_name": "Fatma",
            "email": "fatma@epgroup.com",
            "phone": "01001234583",
            "role": "key_account",
            "line": "line_2",
            "region_id": "delta",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Aya's ID
        },
        {
            "id": str(uuid.uuid4()),
            "username": "salah.khaled",
            "password": hash_password("salah123"),
            "full_name": "Salah Khaled",
            "email": "salah.khaled@epgroup.com",
            "phone": "01001234584",
            "role": "key_account",
            "line": "line_2",
            "region_id": "alexandria",
            "hire_date": datetime.utcnow(),
            "is_active": True,
            "direct_manager_id": None  # Will be set to Aya's ID
        },
    ]
    
    # Insert users first
    await db.users.insert_many(users_data)
    
    # Now update manager relationships
    users = await db.users.find({}).to_list(1000)
    user_lookup = {user["username"]: user["id"] for user in users}
    
    # Set up manager relationships
    manager_relationships = [
        # Line 1
        ("mina.alageeb", "ahmed.gamal"),
        ("ibrahim.ragab", "mina.alageeb"),
        ("samar.rostom", "mina.alageeb"),
        ("anas.alkholy", "ahmed.gamal"),  # Delta reports to Line Manager
        ("khloud", "ahmed.gamal"),
        ("amr.essam", "ibrahim.ragab"),
        ("shahinda.shenouda", "mina.alageeb"),
        ("salma.mohamed", "ahmed.gamal"),
        ("nagwa.amr", "ahmed.gamal"),
        
        # Line 2
        ("aya.nada", "mohammed.hamed"),
        ("sara.ali", "mohammed.hamed"),
        ("asmaa.abdelaziz", "mohammed.hamed"),
        ("elaria.ashraf", "mohammed.hamed"),
        ("mona.mohamed", "aya.nada"),
        ("fatma", "aya.nada"),
        ("salah.khaled", "aya.nada"),
    ]
    
    for subordinate, manager in manager_relationships:
        if subordinate in user_lookup and manager in user_lookup:
            await db.users.update_one(
                {"username": subordinate},
                {"$set": {"direct_manager_id": user_lookup[manager]}}
            )
    
    print("✅ Users created and relationships established")

async def create_warehouses():
    """Create warehouses for each region"""
    print("🏭 Creating warehouses...")
    
    # Get user IDs for warehouse assignments
    users = await db.users.find({}).to_list(1000)
    user_lookup = {user["username"]: user["id"] for user in users}
    
    warehouses_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الجيزة",
            "location": "الجيزة، مصر",
            "latitude": 30.0131,
            "longitude": 31.2089,
            "manager_name": "Kamal",
            "manager_phone": "01001234585",
            "regions_served": ["giza"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("ibrahim.ragab"),  # L1 District
                user_lookup.get("amr.essam"),      # L1 Key Account
                user_lookup.get("asmaa.abdelaziz"), # L2 District
                user_lookup.get("mina.alageeb"),   # L1 Area
                user_lookup.get("ahmed.gamal"),    # L1 Line
                user_lookup.get("mohammed.hamed")  # L2 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن القاهرة",
            "location": "القاهرة، مصر",
            "latitude": 30.0444,
            "longitude": 31.2357,
            "manager_name": "Remon",
            "manager_phone": "01001234586",
            "regions_served": ["cairo"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("samar.rostom"),   # L1 District
                user_lookup.get("sara.ali"),      # L2 District
                user_lookup.get("mina.alageeb"),  # L1 Area
                user_lookup.get("ahmed.gamal"),   # L1 Line
                user_lookup.get("mohammed.hamed") # L2 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الدلتا 1",
            "location": "الدلتا، مصر",
            "latitude": 31.2001,
            "longitude": 29.9187,
            "manager_name": "Mahmoud Heikal",
            "manager_phone": "01001234587",
            "regions_served": ["delta"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("fatma"),         # L2 Key Account
                user_lookup.get("khloud"),       # L1 District
                user_lookup.get("aya.nada"),     # L2 Area
                user_lookup.get("mohammed.hamed"), # L2 Line
                user_lookup.get("ahmed.gamal")   # L1 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الدلتا 2",
            "location": "الدلتا، مصر",
            "latitude": 31.1656,
            "longitude": 29.8478,
            "manager_name": "Ahmed Mourad",
            "manager_phone": "01001234588",
            "regions_served": ["delta"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("mona.mohamed"), # L2 Key Account
                user_lookup.get("anas.alkholy"), # L1 District
                user_lookup.get("aya.nada"),     # L2 Area
                user_lookup.get("mohammed.hamed"), # L2 Line
                user_lookup.get("ahmed.gamal")   # L1 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الصعيد",
            "location": "الصعيد، مصر",
            "latitude": 26.0667,
            "longitude": 32.7167,
            "manager_name": "Ayman Saber",
            "manager_phone": "01001234589",
            "regions_served": ["upper_egypt"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("elaria.ashraf"),  # L2 Key Account
                user_lookup.get("shahinda.shenouda"), # L1 Key Account
                user_lookup.get("mina.alageeb"),    # L1 Area
                user_lookup.get("ahmed.gamal"),     # L1 Line
                user_lookup.get("mohammed.hamed")   # L2 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مخزن الإسكندرية",
            "location": "الإسكندرية، مصر",
            "latitude": 31.2001,
            "longitude": 29.9187,
            "manager_name": "Ahmed Sobhy",
            "manager_phone": "01001234590",
            "regions_served": ["alexandria"],
            "lines_served": ["line_1", "line_2"],
            "responsible_managers": [
                user_lookup.get("salma.mohamed"),  # L1 Key Account
                user_lookup.get("nagwa.amr"),     # L1 Key Account
                user_lookup.get("salah.khaled"),  # L2 Key Account
                user_lookup.get("aya.nada"),      # L2 Area
                user_lookup.get("mohammed.hamed"), # L2 Line
                user_lookup.get("ahmed.gamal")    # L1 Line
            ],
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.warehouses.insert_many(warehouses_data)
    print("✅ Warehouses created")

async def create_regions():
    """Create regions data"""
    print("🗺️ Creating regions...")
    
    regions_data = [
        {
            "id": str(uuid.uuid4()),
            "name": "الجيزة",
            "name_en": "Giza",
            "code": "giza",
            "coordinates": {"lat": 30.0131, "lng": 31.2089},
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "القاهرة",
            "name_en": "Cairo",
            "code": "cairo",
            "coordinates": {"lat": 30.0444, "lng": 31.2357},
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "الدلتا",
            "name_en": "Delta",
            "code": "delta",
            "coordinates": {"lat": 31.2001, "lng": 29.9187},
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "الصعيد",
            "name_en": "Upper Egypt",
            "code": "upper_egypt",
            "coordinates": {"lat": 26.0667, "lng": 32.7167},
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "الإسكندرية",
            "name_en": "Alexandria",
            "code": "alexandria",
            "coordinates": {"lat": 31.2001, "lng": 29.9187},
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.regions.insert_many(regions_data)
    print("✅ Regions created")

async def main():
    """Main setup function"""
    print("🚀 Setting up new organizational structure...")
    
    await clear_existing_data()
    await create_regions()
    await create_users()
    await create_warehouses()
    
    print("✅ Setup completed successfully!")
    
    # Print summary
    users_count = await db.users.count_documents({})
    warehouses_count = await db.warehouses.count_documents({})
    regions_count = await db.regions.count_documents({})
    
    print(f"\n📊 Summary:")
    print(f"👥 Users: {users_count}")
    print(f"🏭 Warehouses: {warehouses_count}")
    print(f"🗺️ Regions: {regions_count}")
    
    print(f"\n🔑 Login credentials:")
    print(f"Admin: admin / admin123")
    print(f"Ahmed Gamal (L1 Manager): ahmed.gamal / ahmed123")
    print(f"Mohammed Hamed (L2 Manager): mohammed.hamed / mohammed123")
    print(f"Mina Alageeb (Area Manager): mina.alageeb / mina123")
    print(f"Aya Nada (Area Manager): aya.nada / aya123")

if __name__ == "__main__":
    asyncio.run(main())