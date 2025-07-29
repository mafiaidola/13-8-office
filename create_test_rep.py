#!/usr/bin/env python3
"""
إنشاء مندوب تجريبي لاختبار النظام
Create test sales rep for system testing
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import hashlib
import secrets
from passlib.context import CryptContext

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'fastapi_db'

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_sales_rep():
    """Create a test sales representative"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    # Test sales rep data
    username = "test_rep"
    password = "123456"
    region = "القاهرة"  # Cairo region
    
    # Hash password
    hashed_password = pwd_context.hash(password)
    
    # Create user
    user_data = {
        "id": str(uuid.uuid4()),
        "username": username,
        "email": f"{username}@test.com",
        "full_name": "مندوب تجريبي - القاهرة",
        "phone": "01000000999",
        "role": "medical_rep",
        "region_id": region,
        "is_active": True,
        "hashed_password": hashed_password,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_login": None,
        "profile_photo": None,
        "address": "القاهرة، مصر",
        "national_id": "12345678901234",
        "hire_date": datetime.utcnow(),
        "direct_manager_id": None
    }
    
    # Check if user already exists
    existing_user = await db.users.find_one({"username": username})
    if existing_user:
        await db.users.delete_one({"username": username})
        print(f"🗑️ تم حذف المستخدم الموجود: {username}")
    
    # Insert new user
    await db.users.insert_one(user_data)
    
    print(f"✅ تم إنشاء مندوب تجريبي بنجاح!")
    print(f"   👤 اسم المستخدم: {username}")
    print(f"   🔑 كلمة المرور: {password}")
    print(f"   📍 المنطقة: {region}")
    print(f"   🎯 الدور: medical_rep")
    
    # Show warehouses in the same region
    warehouses = await db.warehouses.find({"region": region}).to_list(1000)
    print(f"\n📦 المخازن المتاحة في منطقة {region}:")
    for warehouse in warehouses:
        print(f"   - {warehouse['name']} ({warehouse['location']})")
    
    client.close()
    print(f"\n🎉 يمكنك الآن تسجيل الدخول باستخدام البيانات أعلاه!")

if __name__ == "__main__":
    asyncio.run(create_test_sales_rep())