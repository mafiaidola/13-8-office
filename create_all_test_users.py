#!/usr/bin/env python3
"""
إنشاء جميع المستخدمين التجريبيين للنظام
Create all test users for the system with different roles
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid
import hashlib
from passlib.context import CryptContext

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = os.environ.get('DB_NAME', 'fastapi_db')

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_all_test_users():
    """Create all test users with different roles"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    # Test users data with Arabic names and roles
    test_users = [
        {
            "username": "admin",
            "password": "admin123",
            "email": "admin@epgroup.com",
            "full_name": "مدير النظام الرئيسي",
            "role": "admin",
            "phone": "01000000001",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "gm",
            "password": "gm123456",
            "email": "gm@epgroup.com", 
            "full_name": "المدير العام",
            "role": "gm",
            "phone": "01000000002",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "line_manager1",
            "password": "line123",
            "email": "linemanager1@epgroup.com",
            "full_name": "مدير الخط الأول",
            "role": "line_manager",
            "phone": "01000000003",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "line_manager2", 
            "password": "line456",
            "email": "linemanager2@epgroup.com",
            "full_name": "مدير الخط الثاني",
            "role": "line_manager",
            "phone": "01000000004",
            "region_id": "الجيزة",
            "line": "line_2"
        },
        {
            "username": "area_manager1",
            "password": "area123",
            "email": "areamanager1@epgroup.com",
            "full_name": "مدير منطقة القاهرة والجيزة",
            "role": "area_manager",
            "phone": "01000000005",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "area_manager2",
            "password": "area456",
            "email": "areamanager2@epgroup.com",
            "full_name": "مدير منطقة الدلتا الأول",
            "role": "area_manager",
            "phone": "01000000006",
            "region_id": "الدلتا",
            "line": "line_2"
        },
        {
            "username": "district_manager1",
            "password": "dist123",
            "email": "distmanager1@epgroup.com",
            "full_name": "مدير مقاطعة القاهرة الجديدة",
            "role": "district_manager",
            "phone": "01000000007",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "key_account1",
            "password": "key123",
            "email": "keyaccount1@epgroup.com",
            "full_name": "مسؤول العملاء الرئيسيين - القاهرة",
            "role": "key_account",
            "phone": "01000000008",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "medical_rep1",
            "password": "med123",
            "email": "medrep1@epgroup.com",
            "full_name": "مندوب طبي - القاهرة الشرقية",
            "role": "medical_rep",
            "phone": "01000000009",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "medical_rep2",
            "password": "med456",
            "email": "medrep2@epgroup.com",
            "full_name": "مندوب طبي - القاهرة الغربية",
            "role": "medical_rep",
            "phone": "01000000010",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "medical_rep3",
            "password": "med789",
            "email": "medrep3@epgroup.com",
            "full_name": "مندوب طبي - الجيزة",
            "role": "medical_rep",
            "phone": "01000000011",
            "region_id": "الجيزة",
            "line": "line_2"
        },
        {
            "username": "warehouse_keeper1",
            "password": "ware123",
            "email": "warehouse1@epgroup.com",
            "full_name": "أمين مخزن القاهرة الرئيسي",
            "role": "warehouse_keeper",
            "phone": "01000000012",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "warehouse_keeper2",
            "password": "ware456",
            "email": "warehouse2@epgroup.com",
            "full_name": "أمين مخزن الجيزة",
            "role": "warehouse_keeper",
            "phone": "01000000013",
            "region_id": "الجيزة",
            "line": "line_2"
        },
        {
            "username": "accounting1",
            "password": "acc123",
            "email": "accounting1@epgroup.com",
            "full_name": "محاسب أول",
            "role": "accounting",
            "phone": "01000000014",
            "region_id": "القاهرة",
            "line": "line_1"
        },
        {
            "username": "accounting2",
            "password": "acc456",
            "email": "accounting2@epgroup.com",
            "full_name": "محاسب ثاني",
            "role": "accounting",
            "phone": "01000000015",
            "region_id": "القاهرة",
            "line": "line_2"
        }
    ]
    
    print("🚀 بدء إنشاء المستخدمين التجريبيين...")
    print("=" * 60)
    
    created_count = 0
    updated_count = 0
    
    for user_info in test_users:
        try:
            # Hash password
            hashed_password = pwd_context.hash(user_info["password"])
            
            # Create user data
            user_data = {
                "id": str(uuid.uuid4()),
                "username": user_info["username"],
                "email": user_info["email"],
                "full_name": user_info["full_name"],
                "phone": user_info["phone"],
                "role": user_info["role"],
                "region_id": user_info.get("region_id"),
                "line": user_info.get("line"),
                "is_active": True,
                "password_hash": hashed_password,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "last_login": None,
                "profile_photo": None,
                "address": f"{user_info.get('region_id', 'القاهرة')}، مصر",
                "national_id": f"1234567890123{len(str(created_count))}",
                "hire_date": datetime.utcnow(),
                "direct_manager_id": None,
                "managed_by": None,
                "area_id": user_info.get("region_id"),
                "district_id": None,
                "target_amount": 50000.0 if user_info["role"] in ["medical_rep", "key_account"] else None,
                "login_count": 0,
                "permissions": []
            }
            
            # Check if user already exists
            existing_user = await db.users.find_one({"username": user_info["username"]})
            if existing_user:
                # Update existing user
                await db.users.update_one(
                    {"username": user_info["username"]},
                    {"$set": user_data}
                )
                updated_count += 1
                status = "🔄 محدث"
            else:
                # Insert new user
                await db.users.insert_one(user_data)
                created_count += 1
                status = "✅ جديد"
            
            print(f"{status}: {user_info['username']} - {user_info['full_name']} ({user_info['role']})")
            
        except Exception as e:
            print(f"❌ خطأ في إنشاء المستخدم {user_info['username']}: {str(e)}")
    
    client.close()
    
    print("\n" + "=" * 60)
    print(f"🎉 تم الانتهاء من إنشاء المستخدمين!")
    print(f"✅ تم إنشاء: {created_count} مستخدم جديد")
    print(f"🔄 تم تحديث: {updated_count} مستخدم موجود")
    
    print("\n📋 قائمة المستخدمين وكلمات السر:")
    print("=" * 60)
    
    for user_info in test_users:
        print(f"👤 {user_info['username']:<20} | 🔑 {user_info['password']:<12} | 🎯 {user_info['role']:<18} | 👥 {user_info['full_name']}")
    
    print("\n💡 يمكنك الآن استخدام أي من هذه البيانات لتسجيل الدخول!")
    print("🔗 رابط تسجيل الدخول: https://1384a96c-dfd0-4864-9b66-42a6296e94b5.preview.emergentagent.com")

if __name__ == "__main__":
    asyncio.run(create_all_test_users())