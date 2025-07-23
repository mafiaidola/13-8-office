#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_admin():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    # Find admin user
    admin_user = await db.users.find_one({"username": "admin"})
    
    if admin_user:
        print("Admin user found:")
        print(f"  Username: {admin_user.get('username')}")
        print(f"  Role: {admin_user.get('role')}")
        print(f"  Is Active: {admin_user.get('is_active', 'NOT SET')}")
        print(f"  Full Name: {admin_user.get('full_name')}")
        
        # Fix admin user if needed
        if not admin_user.get('is_active', True):
            print("\nAdmin user is inactive! Fixing...")
            result = await db.users.update_one(
                {"username": "admin"},
                {"$set": {"is_active": True}}
            )
            print(f"Update result: {result.modified_count} documents modified")
        else:
            print("\nAdmin user is active - no changes needed")
    else:
        print("No admin user found!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())