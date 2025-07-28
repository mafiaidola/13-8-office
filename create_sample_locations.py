#!/usr/bin/env python3
"""
Create sample location tracking data for testing
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from datetime import datetime, timedelta
import random

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'ep_group_db')]

async def create_sample_location_data():
    """Create sample clinic registrations and orders with location data"""
    print("🗺️ Creating sample location tracking data...")
    
    # Cairo area coordinates for realistic testing
    cairo_center = {"lat": 30.0444, "lng": 31.2357}
    
    # Sample clinic registrations with location tracking
    clinic_registrations = []
    for i in range(5):
        # Generate random coordinates around Cairo
        lat_offset = random.uniform(-0.1, 0.1)
        lng_offset = random.uniform(-0.1, 0.1)
        
        clinic_lat = cairo_center["lat"] + lat_offset
        clinic_lng = cairo_center["lng"] + lng_offset
        
        # Generate rep location (sometimes close, sometimes far)
        distance_type = random.choice(['close', 'medium', 'far'])
        if distance_type == 'close':
            rep_lat_offset = random.uniform(-0.0005, 0.0005)  # ~50m
            rep_lng_offset = random.uniform(-0.0005, 0.0005)
        elif distance_type == 'medium':
            rep_lat_offset = random.uniform(-0.002, 0.002)    # ~200m
            rep_lng_offset = random.uniform(-0.002, 0.002)
        else:
            rep_lat_offset = random.uniform(-0.01, 0.01)      # ~1km
            rep_lng_offset = random.uniform(-0.01, 0.01)
        
        rep_lat = clinic_lat + rep_lat_offset
        rep_lng = clinic_lng + rep_lng_offset
        
        clinic_request = {
            "id": str(uuid.uuid4()),
            "clinic_name": f"عيادة الاختبار {i+1}",
            "clinic_phone": f"02123456{i}0",
            "doctor_name": f"د. محمد أحمد {i+1}",
            "doctor_specialty": "طب عام",
            "doctor_address": f"القاهرة - منطقة {i+1}",
            "clinic_manager_name": f"أحمد محمد {i+1}",
            "address": f"شارع التجريب {i+1}، القاهرة",
            "clinic_image": None,
            "notes": f"عيادة تجريبية رقم {i+1} لاختبار النظام",
            # موقع العيادة المحدد
            "clinic_latitude": clinic_lat,
            "clinic_longitude": clinic_lng,
            # موقع المندوب السري
            "rep_current_latitude": rep_lat,
            "rep_current_longitude": rep_lng,
            "rep_location_timestamp": (datetime.utcnow() - timedelta(days=random.randint(1, 30))).isoformat(),
            "rep_location_accuracy": random.uniform(5.0, 20.0),
            "registration_type": "field_registration",
            "device_info": '{"userAgent": "Mozilla/5.0 Test Browser", "timezone": "Africa/Cairo"}',
            "status": "APPROVED",
            "created_by": "amr.essam",  # One of our sales reps
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "sales_rep_id": "amr.essam"
        }
        clinic_registrations.append(clinic_request)
    
    # Insert clinic registrations
    if clinic_registrations:
        await db.clinic_requests.insert_many(clinic_registrations)
        print(f"✅ Created {len(clinic_registrations)} sample clinic registrations")
    
    # Sample orders with location tracking
    sample_orders = []
    for i in range(8):
        # Generate random coordinates around Cairo
        lat_offset = random.uniform(-0.1, 0.1)
        lng_offset = random.uniform(-0.1, 0.1)
        
        clinic_lat = cairo_center["lat"] + lat_offset
        clinic_lng = cairo_center["lng"] + lng_offset
        
        # Generate rep location
        distance_type = random.choice(['close', 'medium', 'far'])
        if distance_type == 'close':
            rep_lat_offset = random.uniform(-0.0005, 0.0005)  # ~50m
            rep_lng_offset = random.uniform(-0.0005, 0.0005)
        elif distance_type == 'medium':
            rep_lat_offset = random.uniform(-0.002, 0.002)    # ~200m
            rep_lng_offset = random.uniform(-0.002, 0.002)
        else:
            rep_lat_offset = random.uniform(-0.01, 0.01)      # ~1km
            rep_lng_offset = random.uniform(-0.01, 0.01)
        
        rep_lat = clinic_lat + rep_lat_offset
        rep_lng = clinic_lng + rep_lng_offset
        
        order = {
            "id": str(uuid.uuid4()),
            "clinic_id": str(uuid.uuid4()),
            "warehouse_id": str(uuid.uuid4()),
            "order_type": "DEMO",
            "status": "PENDING",
            "total_amount": random.randint(500, 5000),
            "notes": f"طلب تجريبي رقم {i+1}",
            # موقع المندوب السري
            "rep_current_latitude": rep_lat,
            "rep_current_longitude": rep_lng,
            "rep_location_timestamp": (datetime.utcnow() - timedelta(days=random.randint(1, 15))).isoformat(),
            "rep_location_accuracy": random.uniform(5.0, 20.0),
            # موقع العيادة المستهدفة
            "target_clinic_latitude": clinic_lat,
            "target_clinic_longitude": clinic_lng,
            "order_source": "field_order",
            "device_info": '{"userAgent": "Mozilla/5.0 Test Browser", "timezone": "Africa/Cairo"}',
            "created_by": random.choice(["amr.essam", "shahinda.shenouda", "salma.mohamed"]),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 15))
        }
        sample_orders.append(order)
    
    # Insert sample orders
    if sample_orders:
        await db.orders.insert_many(sample_orders)
        print(f"✅ Created {len(sample_orders)} sample orders with location data")
    
    # Create sample clinics for reference
    sample_clinics = []
    for i in range(5):
        lat_offset = random.uniform(-0.1, 0.1)
        lng_offset = random.uniform(-0.1, 0.1)
        
        clinic = {
            "id": str(uuid.uuid4()),
            "name": f"عيادة المرجع {i+1}",
            "address": f"عنوان العيادة {i+1}، القاهرة",
            "phone": f"02123456{i}0",
            "latitude": cairo_center["lat"] + lat_offset,
            "longitude": cairo_center["lng"] + lng_offset,
            "classification": random.choice(["Class A Star", "Class A", "Class B", "Class C"]),
            "line": random.choice(["line_1", "line_2"]),
            "created_at": datetime.utcnow()
        }
        sample_clinics.append(clinic)
    
    if sample_clinics:
        await db.clinics.insert_many(sample_clinics)
        print(f"✅ Created {len(sample_clinics)} sample clinics for reference")
    
    print("🎉 Sample location tracking data created successfully!")
    
    # Print summary
    clinic_requests_count = await db.clinic_requests.count_documents({})
    orders_count = await db.orders.count_documents({})
    clinics_count = await db.clinics.count_documents({})
    
    print(f"\n📊 Database Summary:")
    print(f"🏥 Clinic Requests: {clinic_requests_count}")
    print(f"📦 Orders: {orders_count}")
    print(f"🏢 Clinics: {clinics_count}")

async def main():
    await create_sample_location_data()

if __name__ == "__main__":
    asyncio.run(main())