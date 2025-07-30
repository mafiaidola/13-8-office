#!/usr/bin/env python3
"""
إضافة منتجات تجريبية للنظام
Add sample products to the system for testing Lines Management
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
import uuid

async def add_sample_products():
    """إضافة منتجات تجريبية"""
    # Database connection
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'test_database')]
    
    print("إضافة منتجات تجريبية للسماح بتخصيصها للخطوط...")
    
    # Sample products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "أقراص الباراسيتامول 500 ملجم",
            "name_en": "Paracetamol 500mg Tablets",
            "description": "مسكن للألم وخافض للحرارة",
            "brand": "فارما بلس",
            "category": "أدوية",
            "unit_price": 15.50,
            "quantity_in_stock": 1000,
            "minimum_stock": 100,
            "is_active": True,
            "requires_prescription": False,
            "product_code": "PARA500",
            "barcode": "123456789001",
            "manufacturer": "شركة فارما بلس",
            "expiry_warning_days": 30,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "شراب الكحة للأطفال",
            "name_en": "Children's Cough Syrup",
            "description": "شراب طبيعي لعلاج الكحة عند الأطفال",
            "brand": "كيدز كير",
            "category": "أدوية الأطفال",
            "unit_price": 25.00,
            "quantity_in_stock": 500,
            "minimum_stock": 50,
            "is_active": True,
            "requires_prescription": False,
            "product_code": "COUGH100",
            "barcode": "123456789002",
            "manufacturer": "شركة كيدز كير",
            "expiry_warning_days": 45,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "فيتامين د3 1000 وحدة",
            "name_en": "Vitamin D3 1000 IU",
            "description": "مكمل غذائي لتقوية العظام والمناعة",
            "brand": "هيلث بلس",
            "category": "مكملات غذائية",
            "unit_price": 45.00,
            "quantity_in_stock": 750,
            "minimum_stock": 75,
            "is_active": True,
            "requires_prescription": False,
            "product_code": "VITD1000",
            "barcode": "123456789003",
            "manufacturer": "شركة هيلث بلس",
            "expiry_warning_days": 60,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "كريم مضاد حيوي",
            "name_en": "Antibiotic Cream",
            "description": "كريم للاستخدام الخارجي لعلاج الالتهابات الجلدية",
            "brand": "سكين كير",
            "category": "كريمات ومراهم",
            "unit_price": 18.75,
            "quantity_in_stock": 300,
            "minimum_stock": 30,
            "is_active": True,
            "requires_prescription": True,
            "product_code": "ANTIBC",
            "barcode": "123456789004",
            "manufacturer": "شركة سكين كير",
            "expiry_warning_days": 90,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "أقراص الضغط 10 ملجم",
            "name_en": "Blood Pressure Tablets 10mg",
            "description": "أقراص لعلاج ارتفاع ضغط الدم",
            "brand": "كارديو ميد",
            "category": "أدوية القلب والأوعية الدموية",
            "unit_price": 35.25,
            "quantity_in_stock": 800,
            "minimum_stock": 80,
            "is_active": True,
            "requires_prescription": True,
            "product_code": "BP10MG",
            "barcode": "123456789005",
            "manufacturer": "شركة كارديو ميد",
            "expiry_warning_days": 120,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    try:
        # Check if products already exist
        existing_count = await db.products.count_documents({})
        print(f"المنتجات الموجودة حالياً: {existing_count}")
        
        if existing_count == 0:
            # Insert products
            result = await db.products.insert_many(products)
            print(f"✅ تم إدراج {len(result.inserted_ids)} منتج تجريبي بنجاح")
        else:
            print("⚠️ توجد منتجات بالفعل في النظام")
        
        # Display all products
        all_products = await db.products.find({}, {"_id": 0, "name": 1, "product_code": 1, "unit_price": 1}).to_list(100)
        print("\n📦 المنتجات المتاحة في النظام:")
        for i, product in enumerate(all_products, 1):
            print(f"{i}. {product['name']} ({product['product_code']}) - {product['unit_price']} ر.س")
        
        print(f"\n✅ يمكن الآن تخصيص {len(all_products)} منتج للخطوط!")
        
    except Exception as e:
        print(f"❌ خطأ في إضافة المنتجات: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(add_sample_products())