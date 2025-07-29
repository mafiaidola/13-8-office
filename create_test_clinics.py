#!/usr/bin/env python3
"""
إنشاء عيادات تجريبية لاختبار نظام إنشاء الطلبات الجديد
Create test clinics for the new order creation system
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DATABASE_NAME = 'fastapi_db'

async def create_test_clinics():
    """Create test clinics for different regions"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DATABASE_NAME]
    
    test_clinics = [
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة د. أحمد محمود للأطفال",
            "doctor_name": "د. أحمد محمود",
            "doctor_specialty": "طب الأطفال",
            "address": "شارع التحرير، وسط البلد، القاهرة",
            "phone": "01012345678",
            "region": "القاهرة",
            "line": "Line 1",
            "latitude": 30.0444,
            "longitude": 31.2357,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة د. فاطمة الزهراء للنساء والتوليد",
            "doctor_name": "د. فاطمة الزهراء",
            "doctor_specialty": "نساء وتوليد",
            "address": "شارع الجمهورية، مصر الجديدة، القاهرة",
            "phone": "01023456789",
            "region": "القاهرة",
            "line": "Line 1",
            "latitude": 30.0876,
            "longitude": 31.3251,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مركز د. محمد عبد الرحمن للقلب",
            "doctor_name": "د. محمد عبد الرحمن",
            "doctor_specialty": "أمراض القلب",
            "address": "شارع النيل، المعادي، القاهرة",
            "phone": "01034567890",
            "region": "القاهرة",
            "line": "Line 2",
            "latitude": 29.9097,
            "longitude": 31.3095,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة د. سارة إبراهيم للجلدية",
            "doctor_name": "د. سارة إبراهيم",
            "doctor_specialty": "الأمراض الجلدية",
            "address": "شارع الهرم، الجيزة",
            "phone": "01045678901",
            "region": "الجيزة",
            "line": "Line 1",
            "latitude": 29.9792,
            "longitude": 31.1342,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مجمع د. خالد حسن الطبي",
            "doctor_name": "د. خالد حسن",
            "doctor_specialty": "الباطنة العامة",
            "address": "شارع 6 أكتوبر، الجيزة",
            "phone": "01056789012",
            "region": "الجيزة",
            "line": "Line 2",
            "latitude": 30.0626,
            "longitude": 31.0965,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة د. نورا علي للعيون",
            "doctor_name": "د. نورا علي",
            "doctor_specialty": "طب وجراحة العيون",
            "address": "كورنيش الإسكندرية، الإسكندرية",
            "phone": "01067890123",
            "region": "الإسكندرية",
            "line": "Line 1",
            "latitude": 31.2001,
            "longitude": 29.9187,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "مركز د. أمير الطيب للأسنان",
            "doctor_name": "د. أمير الطيب",
            "doctor_specialty": "طب وجراحة الأسنان",
            "address": "شارع فؤاد، الإسكندرية",
            "phone": "01078901234",
            "region": "الإسكندرية",
            "line": "Line 2",
            "latitude": 31.2156,
            "longitude": 29.9553,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "عيادة د. هند محمد للتغذية",
            "doctor_name": "د. هند محمد",
            "doctor_specialty": "التغذية العلاجية",
            "address": "شارع الجامعة، طنطا، الغربية",
            "phone": "01089012345",
            "region": "الغربية",
            "line": "Line 1",
            "latitude": 30.7865,
            "longitude": 31.0004,
            "status": "approved",
            "created_at": datetime.utcnow(),
            "approved_by": "admin",
            "approved_at": datetime.utcnow()
        }
    ]
    
    # Clear existing clinics
    await db.clinics.delete_many({})
    print("🗑️ تم حذف العيادات الموجودة")
    
    # Insert new clinics
    result = await db.clinics.insert_many(test_clinics)
    print(f"✅ تم إنشاء {len(result.inserted_ids)} عيادة تجريبية بنجاح")
    
    # Display created clinics by region
    print("\n🏥 العيادات المُنشأة حسب المنطقة:")
    regions = {}
    for clinic in test_clinics:
        region = clinic['region']
        if region not in regions:
            regions[region] = []
        regions[region].append(clinic)
    
    for region, clinics in regions.items():
        print(f"\n📍 {region}:")
        for i, clinic in enumerate(clinics, 1):
            print(f"  {i}. {clinic['name']}")
            print(f"     الطبيب: {clinic['doctor_name']} - {clinic['doctor_specialty']}")
            print(f"     العنوان: {clinic['address']}")
            print(f"     الهاتف: {clinic['phone']}")
            print(f"     الخط: {clinic['line']}")
    
    client.close()
    print(f"\n🎉 تم إعداد العيادات التجريبية بنجاح!")

if __name__ == "__main__":
    asyncio.run(create_test_clinics())