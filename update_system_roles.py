#!/usr/bin/env python3
"""
تحديث النظام - دمج أدوار sales_rep مع medical_rep
Update System - Merge sales_rep roles with medical_rep
"""

import os
from pymongo import MongoClient
from datetime import datetime
import sys

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

def connect_to_mongodb():
    """اتصال بقاعدة البيانات"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        print("✅ تم الاتصال بقاعدة البيانات بنجاح")
        return db
    except Exception as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        return None

def update_user_roles(db):
    """تحديث أدوار المستخدمين - دمج sales_rep مع medical_rep"""
    print("\n🔄 تحديث أدوار المستخدمين...")
    
    try:
        # البحث عن المستخدمين برول sales_rep
        sales_reps = list(db.users.find({"role": "sales_rep"}))
        
        if sales_reps:
            print(f"📊 تم العثور على {len(sales_reps)} مستخدم برول sales_rep")
            
            # تحديث جميع sales_rep إلى medical_rep
            result = db.users.update_many(
                {"role": "sales_rep"},
                {
                    "$set": {
                        "role": "medical_rep",
                        "updated_at": datetime.utcnow(),
                        "role_updated_reason": "merged_sales_rep_with_medical_rep"
                    }
                }
            )
            
            print(f"✅ تم تحديث {result.modified_count} مستخدم من sales_rep إلى medical_rep")
            
            # عرض المستخدمين المحدثين
            for user in sales_reps:
                print(f"   👤 {user.get('full_name', user.get('username'))}: sales_rep → medical_rep")
        else:
            print("✅ لا يوجد مستخدمين برول sales_rep للتحديث")
            
    except Exception as e:
        print(f"❌ خطأ في تحديث أدوار المستخدمين: {e}")
        return False
    
    return True

def update_visit_references(db):
    """تحديث مراجع الزيارات التي تشير إلى sales_rep"""
    print("\n🚗 تحديث مراجع الزيارات...")
    
    try:
        # تحديث الزيارات التي لها حقل rep_role
        result = db.visits.update_many(
            {"rep_role": "sales_rep"},
            {
                "$set": {
                    "rep_role": "medical_rep",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ تم تحديث {result.modified_count} زيارة")
        else:
            print("✅ لا توجد زيارات تحتاج تحديث")
            
    except Exception as e:
        print(f"❌ خطأ في تحديث مراجع الزيارات: {e}")
        return False
    
    return True

def update_order_references(db):
    """تحديث مراجع الطلبات التي تشير إلى sales_rep"""
    print("\n📋 تحديث مراجع الطلبات...")
    
    try:
        # تحديث الطلبات التي لها حقل created_by_role
        result = db.orders.update_many(
            {"created_by_role": "sales_rep"},
            {
                "$set": {
                    "created_by_role": "medical_rep",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ تم تحديث {result.modified_count} طلب")
        else:
            print("✅ لا توجد طلبات تحتاج تحديث")
            
    except Exception as e:
        print(f"❌ خطأ في تحديث مراجع الطلبات: {e}")
        return False
    
    return True

def update_clinic_references(db):
    """تحديث مراجع العيادات التي تشير إلى sales_rep"""
    print("\n🏥 تحديث مراجع العيادات...")
    
    try:
        # تحديث العيادات التي لها حقل created_by_role
        result = db.clinics.update_many(
            {"created_by_role": "sales_rep"},
            {
                "$set": {
                    "created_by_role": "medical_rep",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ تم تحديث {result.modified_count} عيادة")
        else:
            print("✅ لا توجد عيادات تحتاج تحديث")
            
        # تحديث طلبات تسجيل العيادات
        result2 = db.clinic_requests.update_many(
            {"created_by_role": "sales_rep"},
            {
                "$set": {
                    "created_by_role": "medical_rep",
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result2.modified_count > 0:
            print(f"✅ تم تحديث {result2.modified_count} طلب تسجيل عيادة")
            
    except Exception as e:
        print(f"❌ خطأ في تحديث مراجع العيادات: {e}")
        return False
    
    return True

def update_system_logs(db):
    """تحديث سجلات النظام"""
    print("\n📝 تحديث سجلات النظام...")
    
    try:
        # إضافة سجل للتحديث
        update_log = {
            "id": "role_merge_update_" + str(int(datetime.utcnow().timestamp())),
            "action": "merge_roles",
            "details": "تم دمج دور sales_rep مع medical_rep",
            "old_role": "sales_rep",
            "new_role": "medical_rep",
            "updated_at": datetime.utcnow(),
            "updated_by": "system_migration"
        }
        
        db.system_logs.insert_one(update_log)
        print("✅ تم إضافة سجل التحديث")
        
    except Exception as e:
        print(f"❌ خطأ في تحديث سجلات النظام: {e}")
        return False
    
    return True

def show_final_stats(db):
    """عرض الإحصائيات النهائية"""
    print("\n📊 الإحصائيات النهائية بعد التحديث:")
    print("=" * 60)
    
    # إحصائيات المستخدمين
    role_counts = {}
    users = list(db.users.find({}, {"role": 1}))
    for user in users:
        role = user.get("role", "unknown")
        role_counts[role] = role_counts.get(role, 0) + 1
    
    print("👥 توزيع المستخدمين حسب الأدوار:")
    for role, count in sorted(role_counts.items()):
        if role == "medical_rep":
            print(f"   🎯 {role}: {count} مستخدم (شامل sales_rep المدموج)")
        else:
            print(f"   📊 {role}: {count} مستخدم")
    
    print("=" * 60)

def main():
    """الدالة الرئيسية"""
    print("🔄 بدء عملية تحديث النظام - دمج أدوار sales_rep مع medical_rep")
    print("=" * 80)
    
    # الاتصال بقاعدة البيانات
    db = connect_to_mongodb()
    if db is None:
        return
    
    try:
        success = True
        
        # تحديث أدوار المستخدمين
        success &= update_user_roles(db)
        
        # تحديث مراجع الزيارات
        success &= update_visit_references(db)
        
        # تحديث مراجع الطلبات  
        success &= update_order_references(db)
        
        # تحديث مراجع العيادات
        success &= update_clinic_references(db)
        
        # تحديث سجلات النظام
        success &= update_system_logs(db)
        
        if success:
            print("\n" + "=" * 80)
            print("🎉 تم الانتهاء من تحديث النظام بنجاح!")
            print("📝 التغييرات المطبقة:")
            print("   • تم دمج جميع مستخدمي sales_rep مع medical_rep")
            print("   • تم تحديث جميع المراجع في الزيارات والطلبات والعيادات")
            print("   • أصبح medical_rep الدور الموحد لجميع المناديب الطبيين")
            print("   • التنفيذيون (key_account, medical_rep) الآن يمكنهم إضافة عيادات")
            print("=" * 80)
            
            # عرض الإحصائيات النهائية
            show_final_stats(db)
        else:
            print("\n❌ حدثت بعض الأخطاء أثناء التحديث")
        
    except Exception as e:
        print(f"❌ خطأ عام أثناء التحديث: {e}")
        return
    
    print("✅ انتهى تحديث النظام!")

if __name__ == "__main__":
    main()