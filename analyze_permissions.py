#!/usr/bin/env python3
"""
تحليل الصلاحيات والأدوار في نظام EP Group
Analyze roles and permissions in EP Group System
"""

import os
from pymongo import MongoClient
import requests

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')
BACKEND_URL = "https://39bfa0e9-57ce-4da8-b444-8d148da868a0.preview.emergentagent.com/api"

def connect_to_mongodb():
    """اتصال بقاعدة البيانات"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        return db
    except Exception as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        return None

def analyze_roles_and_permissions():
    """تحليل الأدوار والصلاحيات"""
    print("📋 تحليل الصلاحيات والأدوار في نظام EP Group")
    print("=" * 80)
    
    # تعريف الأدوار حسب الكود
    roles_hierarchy = {
        "admin": {"level": 7, "name_ar": "مدير النظام", "name_en": "System Administrator"},
        "gm": {"level": 6, "name_ar": "مدير عام", "name_en": "General Manager"},
        "line_manager": {"level": 5, "name_ar": "مدير خط", "name_en": "Line Manager"},
        "area_manager": {"level": 4, "name_ar": "مدير منطقة", "name_en": "Area Manager"},
        "district_manager": {"level": 3, "name_ar": "مدير مقاطعة", "name_en": "District Manager"},
        "key_account": {"level": 2, "name_ar": "حساب رئيسي", "name_en": "Key Account"},
        "medical_rep": {"level": 1, "name_ar": "مندوب طبي", "name_en": "Medical Rep"},
        "warehouse_keeper": {"level": 3, "name_ar": "حارس مخزن", "name_en": "Warehouse Keeper"},
        "accounting": {"level": 3, "name_ar": "محاسب", "name_en": "Accounting"},
        # Legacy roles
        "manager": {"level": 4, "name_ar": "مدير (قديم)", "name_en": "Manager (Legacy)"},
        "warehouse_manager": {"level": 3, "name_ar": "مدير مخزن (قديم)", "name_en": "Warehouse Manager (Legacy)"},
        "sales_rep": {"level": 1, "name_ar": "مندوب مبيعات (قديم)", "name_en": "Sales Rep (Legacy)"}
    }
    
    # الصلاحيات لكل دور
    role_permissions = {
        "admin": {
            "permissions": ["all"],
            "description_ar": "صلاحيات كاملة على النظام",
            "description_en": "Full system control",
            "capabilities": [
                "إدارة جميع المستخدمين والأدوار",
                "إدارة النظام والإعدادات",
                "عرض جميع التقارير والإحصائيات", 
                "إدارة المخازن والمنتجات",
                "الموافقة على جميع الطلبات",
                "إدارة العيادات والأطباء",
                "تتبع جميع الزيارات والأنشطة"
            ]
        },
        "gm": {
            "permissions": ["all"],
            "description_ar": "صلاحيات تشغيلية كاملة",
            "description_en": "Full operational control",
            "capabilities": [
                "إدارة جميع العمليات التشغيلية",
                "عرض جميع التقارير والإحصائيات",
                "إدارة المستخدمين (عدا الأدمن)",
                "الموافقة على الطلبات الكبيرة",
                "إدارة الخطوط والمناطق",
                "مراجعة الأداء العام"
            ]
        },
        "line_manager": {
            "permissions": ["users.view", "visits.view", "doctors.approve", "orders.approve"],
            "description_ar": "إدارة خط كامل",
            "description_en": "Manage complete line",
            "capabilities": [
                "عرض المستخدمين في الخط",
                "عرض زيارات الخط",
                "الموافقة على الأطباء",
                "الموافقة على الطلبات",
                "إدارة مديري المناطق"
            ]
        },
        "area_manager": {
            "permissions": ["users.view", "visits.view", "doctors.approve", "orders.approve"],
            "description_ar": "إدارة منطقة جغرافية",
            "description_en": "Manage geographical area",
            "capabilities": [
                "عرض المستخدمين في المنطقة",
                "عرض زيارات المنطقة",
                "الموافقة على الأطباء",
                "الموافقة على الطلبات",
                "إدارة مديري المقاطعات"
            ]
        },
        "district_manager": {
            "permissions": ["visits.view", "doctors.approve", "orders.approve"],
            "description_ar": "إدارة مقاطعة",
            "description_en": "Manage district",
            "capabilities": [
                "عرض زيارات المقاطعة",
                "الموافقة على الأطباء",
                "الموافقة على الطلبات",
                "إدارة الحسابات الرئيسية"
            ]
        },
        "key_account": {
            "permissions": ["visits.create", "doctors.create", "orders.create"],
            "description_ar": "إدارة حسابات رئيسية",
            "description_en": "Manage key accounts",
            "capabilities": [
                "إنشاء الزيارات",
                "إنشاء ملفات الأطباء",
                "إنشاء الطلبات",
                "إدارة المناديب الطبيين"
            ]
        },
        "medical_rep": {
            "permissions": ["visits.create", "doctors.create", "orders.create"],
            "description_ar": "العمليات الأساسية",
            "description_en": "Basic operations",
            "capabilities": [
                "إنشاء الزيارات",
                "تسجيل الأطباء الجدد",
                "إنشاء الطلبات",
                "تحديث بيانات العيادات",
                "تسجيل النشاطات اليومية"
            ]
        },
        "warehouse_keeper": {
            "permissions": ["inventory.manage", "orders.fulfill"],
            "description_ar": "إدارة المخزون",
            "description_en": "Inventory management",
            "capabilities": [
                "إدارة المخزون",
                "تنفيذ الطلبات",
                "تتبع حركة البضائع",
                "إصدار تقارير المخزون"
            ]
        },
        "accounting": {
            "permissions": ["reports.view", "financial.view", "orders.approve"],
            "description_ar": "العمليات المحاسبية",
            "description_en": "Accounting operations",
            "capabilities": [
                "عرض التقارير المالية",
                "عرض البيانات المالية",
                "الموافقة على الطلبات المالية",
                "إدارة الفواتير والحسابات"
            ]
        }
    }
    
    print("🎯 الأدوار والمستويات:")
    print("-" * 40)
    
    # ترتيب الأدوار حسب المستوى
    sorted_roles = sorted(roles_hierarchy.items(), key=lambda x: x[1]["level"], reverse=True)
    
    for role_key, role_info in sorted_roles:
        level = role_info["level"]
        name_ar = role_info["name_ar"]
        name_en = role_info["name_en"]
        
        print(f"\n📍 {name_ar} ({name_en})")
        print(f"   🔢 المستوى: {level}")
        print(f"   🆔 الكود: {role_key}")
        
        if role_key in role_permissions:
            perm_info = role_permissions[role_key]
            print(f"   📄 الوصف: {perm_info['description_ar']}")
            print(f"   🔑 الصلاحيات التقنية: {', '.join(perm_info['permissions'])}")
            print(f"   ⚡ القدرات:")
            for capability in perm_info['capabilities']:
                print(f"      • {capability}")
    
    print("\n" + "=" * 80)
    print("📊 ملخص النظام:")
    print(f"   🎭 إجمالي الأدوار: {len(roles_hierarchy)}")
    print(f"   📈 أعلى مستوى: {max(role['level'] for role in roles_hierarchy.values())} (Admin)")
    print(f"   📉 أقل مستوى: {min(role['level'] for role in roles_hierarchy.values())} (Medical Rep)")
    
    return roles_hierarchy, role_permissions

def check_current_users():
    """فحص المستخدمين الحاليين في النظام"""
    print("\n👥 المستخدمون الحاليون في النظام:")
    print("-" * 40)
    
    db = connect_to_mongodb()
    if db is None:
        return
    
    try:
        users = list(db.users.find({}, {"username": 1, "full_name": 1, "role": 1, "is_active": 1}))
        
        role_counts = {}
        for user in users:
            role = user.get("role", "unknown")
            role_counts[role] = role_counts.get(role, 0) + 1
            
            status = "✅ نشط" if user.get("is_active", True) else "❌ غير نشط"
            print(f"   👤 {user.get('full_name', user.get('username', 'مجهول'))}")
            print(f"      🆔 اسم المستخدم: {user.get('username', 'غير محدد')}")
            print(f"      🎭 الدور: {user.get('role', 'غير محدد')}")
            print(f"      📊 الحالة: {status}")
            print()
        
        print("📈 إحصائيات الأدوار:")
        for role, count in sorted(role_counts.items()):
            print(f"   🎭 {role}: {count} مستخدم")
            
    except Exception as e:
        print(f"❌ خطأ في جلب بيانات المستخدمين: {e}")

def main():
    """الدالة الرئيسية"""
    print("🔍 تحليل شامل للصلاحيات والأدوار في نظام EP Group")
    print("=" * 80)
    
    # تحليل الأدوار والصلاحيات
    roles_hierarchy, role_permissions = analyze_roles_and_permissions()
    
    # فحص المستخدمين الحاليين
    check_current_users()
    
    print("\n✅ تم الانتهاء من تحليل الصلاحيات والأدوار!")

if __name__ == "__main__":
    main()