#!/usr/bin/env python3
"""
تنظيف قاعدة البيانات - الاحتفاظ بـ 2 عناصر فقط من كل نوع للاختبار
Database Cleanup - Keep only 2 items of each type for testing
"""

import os
from pymongo import MongoClient
from datetime import datetime
import sys

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/ep_group_system')

def connect_to_mongodb():
    """اتصال بقاعدة البيانات"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.get_database()
        print("✅ تم الاتصال بقاعدة البيانات بنجاح")
        return db
    except Exception as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        return None

def cleanup_users(db):
    """تنظيف المستخدمين - الاحتفاظ بـ 2 من كل دور"""
    print("\n🧹 تنظيف المستخدمين...")
    
    # الأدوار المطلوبة
    required_roles = {
        'admin': 1,      # 1 أدمن فقط
        'gm': 2,         # 2 مدير عام  
        'manager': 2,    # 2 مدير
        'sales_rep': 2,  # 2 مندوب مبيعات
        'warehouse': 2,  # 2 مخزن
        'accounting': 2, # 2 محاسب
        'medical_rep': 2 # 2 مندوب طبي
    }
    
    total_deleted = 0
    
    for role, keep_count in required_roles.items():
        # البحث عن المستخدمين حسب الدور
        users = list(db.users.find({"role": role}).sort("created_at", 1))
        
        if len(users) > keep_count:
            # الاحتفاظ بأول keep_count مستخدمين وحذف الباقي
            users_to_keep = users[:keep_count]
            users_to_delete = users[keep_count:]
            
            print(f"  📊 الدور {role}: موجود {len(users)}, سيتم الاحتفاظ بـ {keep_count}, سيتم حذف {len(users_to_delete)}")
            
            # حذف المستخدمين الزائدين
            for user in users_to_delete:
                result = db.users.delete_one({"_id": user["_id"]})
                if result.deleted_count > 0:
                    total_deleted += 1
                    print(f"    ❌ تم حذف المستخدم: {user.get('username', 'unknown')}")
        else:
            print(f"  ✅ الدور {role}: {len(users)} مستخدمين (لا يحتاج تنظيف)")
    
    print(f"✅ تم حذف {total_deleted} مستخدم زائد")
    return total_deleted

def cleanup_clinics(db):
    """تنظيف العيادات - الاحتفاظ بـ 2 فقط"""
    print("\n🏥 تنظيف العيادات...")
    
    clinics = list(db.clinics.find().sort("created_at", 1))
    keep_count = 2
    
    if len(clinics) > keep_count:
        clinics_to_delete = clinics[keep_count:]
        deleted_count = 0
        
        for clinic in clinics_to_delete:
            # حذف الأطباء المرتبطين بهذه العيادة أولاً
            db.doctors.delete_many({"clinic_id": str(clinic["_id"])})
            
            # حذف العيادة
            result = db.clinics.delete_one({"_id": clinic["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف العيادة: {clinic.get('name', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} عيادة زائدة")
        return deleted_count
    else:
        print(f"✅ العيادات: {len(clinics)} عيادات (لا تحتاج تنظيف)")
        return 0

def cleanup_doctors(db):
    """تنظيف الأطباء - الاحتفاظ بـ 2 فقط"""
    print("\n👨‍⚕️ تنظيف الأطباء...")
    
    doctors = list(db.doctors.find().sort("created_at", 1))
    keep_count = 2
    
    if len(doctors) > keep_count:
        doctors_to_delete = doctors[keep_count:]
        deleted_count = 0
        
        for doctor in doctors_to_delete:
            result = db.doctors.delete_one({"_id": doctor["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف الطبيب: {doctor.get('name', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} طبيب زائد")
        return deleted_count
    else:
        print(f"✅ الأطباء: {len(doctors)} أطباء (لا يحتاجون تنظيف)")
        return 0

def cleanup_products(db):
    """تنظيف المنتجات - الاحتفاظ بـ 2 فقط"""
    print("\n📦 تنظيف المنتجات...")
    
    products = list(db.products.find().sort("created_at", 1))
    keep_count = 2
    
    if len(products) > keep_count:
        products_to_delete = products[keep_count:]
        deleted_count = 0
        
        for product in products_to_delete:
            result = db.products.delete_one({"_id": product["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف المنتج: {product.get('name', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} منتج زائد")
        return deleted_count
    else:
        print(f"✅ المنتجات: {len(products)} منتجات (لا تحتاج تنظيف)")
        return 0

def cleanup_warehouses(db):
    """تنظيف المخازن - الاحتفاظ بـ 2 فقط"""
    print("\n🏪 تنظيف المخازن...")
    
    warehouses = list(db.warehouses.find().sort("created_at", 1))
    keep_count = 2
    
    if len(warehouses) > keep_count:
        warehouses_to_delete = warehouses[keep_count:]
        deleted_count = 0
        
        for warehouse in warehouses_to_delete:
            result = db.warehouses.delete_one({"_id": warehouse["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف المخزن: {warehouse.get('name', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} مخزن زائد")
        return deleted_count
    else:
        print(f"✅ المخازن: {len(warehouses)} مخازن (لا تحتاج تنظيف)")
        return 0

def cleanup_visits(db):
    """تنظيف الزيارات - الاحتفاظ بـ 3 فقط للاختبار"""
    print("\n🚗 تنظيف الزيارات...")
    
    visits = list(db.visits.find().sort("visit_date", -1))  # أحدث الزيارات أولاً
    keep_count = 3
    
    if len(visits) > keep_count:
        visits_to_delete = visits[keep_count:]
        deleted_count = 0
        
        for visit in visits_to_delete:
            result = db.visits.delete_one({"_id": visit["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف الزيارة: {visit.get('visit_date', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} زيارة زائدة")
        return deleted_count
    else:
        print(f"✅ الزيارات: {len(visits)} زيارات (لا تحتاج تنظيف)")
        return 0

def cleanup_orders(db):
    """تنظيف الطلبات - الاحتفاظ بـ 3 فقط للاختبار"""
    print("\n📋 تنظيف الطلبات...")
    
    orders = list(db.orders.find().sort("created_at", -1))  # أحدث الطلبات أولاً
    keep_count = 3
    
    if len(orders) > keep_count:
        orders_to_delete = orders[keep_count:]
        deleted_count = 0
        
        for order in orders_to_delete:
            result = db.orders.delete_one({"_id": order["_id"]})
            if result.deleted_count > 0:
                deleted_count += 1
                print(f"    ❌ تم حذف الطلب: {order.get('_id', 'unknown')}")
        
        print(f"✅ تم حذف {deleted_count} طلب زائد")
        return deleted_count
    else:
        print(f"✅ الطلبات: {len(orders)} طلبات (لا تحتاج تنظيف)")
        return 0

def show_final_stats(db):
    """عرض الإحصائيات النهائية"""
    print("\n📊 الإحصائيات النهائية بعد التنظيف:")
    print("=" * 50)
    
    collections = {
        'users': 'المستخدمين',
        'clinics': 'العيادات', 
        'doctors': 'الأطباء',
        'products': 'المنتجات',
        'warehouses': 'المخازن',
        'visits': 'الزيارات',
        'orders': 'الطلبات'
    }
    
    for collection, name in collections.items():
        count = db[collection].count_documents({})
        print(f"  📈 {name}: {count}")
    
    print("=" * 50)

def main():
    """الدالة الرئيسية للتنظيف"""
    print("🧹 بدء عملية تنظيف قاعدة البيانات...")
    print("=" * 60)
    
    # الاتصال بقاعدة البيانات
    db = connect_to_mongodb()
    if db is None:
        return
    
    try:
        # تنظيف البيانات
        total_deleted = 0
        total_deleted += cleanup_users(db)
        total_deleted += cleanup_clinics(db)
        total_deleted += cleanup_doctors(db)
        total_deleted += cleanup_products(db)
        total_deleted += cleanup_warehouses(db)
        total_deleted += cleanup_visits(db)
        total_deleted += cleanup_orders(db)
        
        # عرض النتائج النهائية
        print("\n" + "=" * 60)
        print(f"🎉 تم الانتهاء من تنظيف قاعدة البيانات!")
        print(f"📊 إجمالي العناصر المحذوفة: {total_deleted}")
        print("=" * 60)
        
        # عرض الإحصائيات النهائية
        show_final_stats(db)
        
    except Exception as e:
        print(f"❌ خطأ أثناء التنظيف: {e}")
        return
    
    print("✅ تم تنظيف قاعدة البيانات بنجاح!")

if __name__ == "__main__":
    main()