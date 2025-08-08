#!/usr/bin/env python3
"""
Initialize admin user in the database
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
import hashlib
import uuid
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def create_admin_user():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Check if admin user already exists
    existing_admin = await db.users.find_one({"username": "admin"})
    if existing_admin:
        print("✅ Admin user already exists!")
        client.close()
        return
    
    # Create admin user
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password_hash": hash_password("admin123"),
        "full_name": "System Administrator",
        "role": "admin",
        "email": "admin@system.com",
        "phone": "+1234567890",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "login_count": 0,
        "last_login": None
    }
    
    await db.users.insert_one(admin_user)
    print("✅ Admin user created successfully!")
    print(f"   Username: admin")
    print(f"   Password: admin123")
    print(f"   Full Name: {admin_user['full_name']}")
    print(f"   Role: {admin_user['role']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())