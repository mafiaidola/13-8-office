#!/usr/bin/env python3
"""
🔧 تحسين ترابط قواعد البيانات - Database Relationship Enhancement
This script fixes the database relationship issues identified in the analysis
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import uuid
from datetime import datetime, timedelta
import random

# Load environment
sys.path.append('/app/backend')
load_dotenv('/app/backend/.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'test_database')

print(f"🔗 Connecting to MongoDB: {mongo_url}")
print(f"📦 Database: {db_name}")

async def enhance_database_relationships():
    """تحسين ترابط قواعد البيانات"""
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print("\n🔧 **PHASE 1: ENHANCING DATABASE RELATIONSHIPS**")
        
        # 1. Get existing data
        users = await db.users.find({"role": {"$in": ["medical_rep", "key_account"]}}).to_list(100)
        clinics = await db.clinics.find({}).to_list(500)
        doctors = await db.doctors.find({}).to_list(100)
        products = await db.products.find({}).to_list(100)
        
        print(f"📊 Found: {len(users)} medical reps, {len(clinics)} clinics, {len(doctors)} doctors, {len(products)} products")
        
        # 2. Improve clinic assignments
        unassigned_clinics = [c for c in clinics if not c.get('assigned_rep_id')]
        print(f"🏥 Unassigned clinics: {len(unassigned_clinics)}")
        
        if unassigned_clinics and users:
            assignments_made = 0
            for i, clinic in enumerate(unassigned_clinics[:20]):  # Assign up to 20 clinics
                rep = users[i % len(users)]  # Round-robin assignment
                
                await db.clinics.update_one(
                    {"id": clinic["id"]},
                    {"$set": {
                        "assigned_rep_id": rep["id"],
                        "assigned_rep_name": rep.get("full_name", rep.get("username", "")),
                        "updated_at": datetime.utcnow()
                    }}
                )
                assignments_made += 1
            
            print(f"✅ Assigned {assignments_made} clinics to medical reps")
        
        # 3. Create realistic visits
        assigned_clinics = await db.clinics.find({"assigned_rep_id": {"$exists": True, "$ne": None}}).to_list(100)
        
        if assigned_clinics and doctors:
            visits_created = 0
            
            for _ in range(min(50, len(assigned_clinics) * 2)):  # Create 2 visits per clinic max
                clinic = random.choice(assigned_clinics)
                rep_id = clinic.get("assigned_rep_id")
                
                # Find doctors in this clinic
                clinic_doctors = [d for d in doctors if d.get("clinic_id") == clinic.get("id")]
                if not clinic_doctors:
                    # Create a doctor for this clinic if none exists
                    doctor = {
                        "id": str(uuid.uuid4()),
                        "name": f"د. {random.choice(['أحمد', 'محمد', 'فاطمة', 'عائشة', 'علي', 'سارة'])} {random.choice(['المصري', 'السوري', 'اللبناني', 'العراقي'])}",
                        "clinic_id": clinic["id"],
                        "clinic_name": clinic.get("name", ""),
                        "specialization": random.choice(["باطنة", "أطفال", "نساء وولادة", "جراحة", "عظام", "قلب"]),
                        "phone": f"01{random.randint(100000000, 999999999)}",
                        "created_at": datetime.utcnow(),
                        "is_active": True
                    }
                    await db.doctors.insert_one(doctor)
                    clinic_doctors = [doctor]
                
                doctor = random.choice(clinic_doctors)
                
                # Create visit
                visit_date = datetime.utcnow() - timedelta(days=random.randint(1, 30))
                visit = {
                    "id": str(uuid.uuid4()),
                    "sales_rep_id": rep_id,
                    "doctor_id": doctor["id"],
                    "clinic_id": clinic["id"],
                    "visit_type": random.choice(["routine", "follow_up", "new_client", "complaint_resolution"]),
                    "date": visit_date,
                    "created_at": visit_date,
                    "notes": f"زيارة {random.choice(['ناجحة', 'مثمرة', 'تعريفية'])} للطبيب {doctor.get('name', 'غير محدد')}",
                    "latitude": random.uniform(30.0, 31.5),  # Egypt coordinates
                    "longitude": random.uniform(31.0, 32.0),
                    "effective": random.choice([True, True, True, False]),  # 75% effective
                    "participants_count": 1,
                    "participants_details": []
                }
                
                await db.visits.insert_one(visit)
                visits_created += 1
            
            print(f"✅ Created {visits_created} realistic visits")
        
        # 4. Create some orders
        if assigned_clinics and products and users:
            orders_created = 0
            
            for _ in range(min(20, len(assigned_clinics))):  # Create orders for up to 20 clinics
                clinic = random.choice(assigned_clinics)
                rep_id = clinic.get("assigned_rep_id")
                
                # Select random products for order
                order_products = random.sample(products, min(random.randint(1, 3), len(products)))
                
                order_items = []
                total_amount = 0.0
                
                for product in order_products:
                    quantity = random.randint(1, 10)
                    price = product.get("price", 100.0)
                    item_total = price * quantity
                    total_amount += item_total
                    
                    order_items.append({
                        "product_id": product["id"],
                        "product_name": product.get("name", ""),
                        "quantity": quantity,
                        "unit_price": price,
                        "total_price": item_total
                    })
                
                order_date = datetime.utcnow() - timedelta(days=random.randint(1, 15))
                order = {
                    "id": str(uuid.uuid4()),
                    "order_number": f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}",
                    "medical_rep_id": rep_id,
                    "clinic_id": clinic["id"],
                    "clinic_name": clinic.get("name", ""),
                    "items": order_items,
                    "subtotal": total_amount,
                    "total_amount": total_amount,
                    "status": random.choice(["PENDING", "APPROVED", "DELIVERED", "CANCELLED"]),
                    "created_at": order_date,
                    "updated_at": order_date,
                    "notes": f"طلب {random.choice(['عادي', 'عاجل', 'مهم'])} من {clinic.get('name', 'العيادة')}",
                    "warehouse_id": None,  # Will be assigned when warehouse system is enhanced
                    "line": random.choice(["خط أ", "خط ب", "خط ج"]),
                    "area_id": None
                }
                
                await db.orders.insert_one(order)
                orders_created += 1
            
            print(f"✅ Created {orders_created} realistic orders")
        
        # 5. Create financial records (debt management)
        if assigned_clinics:
            debt_records_created = 0
            
            for clinic in assigned_clinics[:15]:  # Create debt records for 15 clinics
                debt_amount = random.uniform(500, 5000)
                outstanding_amount = debt_amount * random.uniform(0.3, 1.0)  # 30-100% still outstanding
                
                debt_record = {
                    "id": str(uuid.uuid4()),
                    "clinic_id": clinic["id"],
                    "clinic_name": clinic.get("name", ""),
                    "original_amount": debt_amount,
                    "outstanding_amount": outstanding_amount,
                    "paid_amount": debt_amount - outstanding_amount,
                    "status": "pending" if outstanding_amount > 100 else "paid",
                    "due_date": datetime.utcnow() + timedelta(days=random.randint(10, 60)),
                    "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                    "updated_at": datetime.utcnow(),
                    "notes": f"مديونية {clinic.get('name', 'العيادة')} - {random.choice(['فواتير معلقة', 'مستحقات سابقة', 'طلبات محددة'])}",
                    "assigned_rep_id": clinic.get("assigned_rep_id")
                }
                
                await db.debt_records.insert_one(debt_record)
                debt_records_created += 1
            
            print(f"✅ Created {debt_records_created} debt records")
        
        # 6. Update geographic relationships
        lines = await db.lines.find({}).to_list(10)
        areas = await db.areas.find({}).to_list(20)
        
        if lines and areas:
            relationships_created = 0
            
            for area in areas:
                if not area.get("parent_line_id") and lines:
                    line = random.choice(lines)
                    await db.areas.update_one(
                        {"id": area["id"]},
                        {"$set": {
                            "parent_line_id": line["id"],
                            "parent_line_name": line.get("name", ""),
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    relationships_created += 1
            
            print(f"✅ Enhanced {relationships_created} area-line relationships")
        
        # 7. Final statistics
        print("\n📊 **FINAL RELATIONSHIP STATISTICS**")
        
        total_users = await db.users.count_documents({})
        total_clinics = await db.clinics.count_documents({})
        assigned_clinics_count = await db.clinics.count_documents({"assigned_rep_id": {"$exists": True, "$ne": None}})
        total_visits = await db.visits.count_documents({})
        total_orders = await db.orders.count_documents({})
        total_debt_records = await db.debt_records.count_documents({})
        
        print(f"👥 Users: {total_users}")
        print(f"🏥 Clinics: {total_clinics} (Assigned: {assigned_clinics_count})")
        print(f"🚗 Visits: {total_visits}")
        print(f"📦 Orders: {total_orders}")
        print(f"💰 Debt Records: {total_debt_records}")
        
        print(f"\n✅ Database relationship enhancement completed successfully!")
        print(f"🎯 Assignment ratio: {(assigned_clinics_count/total_clinics*100):.1f}%")
        
    except Exception as e:
        print(f"❌ Error enhancing database relationships: {e}")
        raise
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(enhance_database_relationships())