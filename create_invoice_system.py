#!/usr/bin/env python3
"""
إنشاء فواتير تجريبية لاختبار نظام المديونية
Create sample invoices to test debt system
"""

import os
from pymongo import MongoClient
from datetime import datetime, timedelta
import sys
import uuid

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

def create_sample_invoices(db):
    """إنشاء فواتير تجريبية"""
    print("\n💰 إنشاء فواتير تجريبية...")
    
    try:
        # الحصول على العيادات الموجودة
        clinics = list(db.clinics.find({}, {"_id": 0, "id": 1, "name": 1}))
        if not clinics:
            print("❌ لا توجد عيادات لإنشاء فواتير لها")
            return
            
        # الحصول على admin user
        admin_user = db.users.find_one({"role": "admin"})
        if not admin_user:
            print("❌ لا يوجد مستخدم أدمن لإنشاء الفواتير")
            return
            
        created_invoices = []
        
        for i, clinic in enumerate(clinics[:2]):  # إنشاء فواتير لأول عيادتين فقط
            
            # فاتورة مدفوعة
            paid_invoice = {
                "id": str(uuid.uuid4()),
                "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{(i*2)+1:04d}",
                "clinic_id": clinic["id"],
                "clinic_name": clinic["name"],
                "order_id": None,
                "subtotal": 1500.0,
                "tax_amount": 150.0,
                "discount_amount": 50.0,
                "total_amount": 1600.0,
                "payment_status": "paid",
                "paid_amount": 1600.0,
                "outstanding_amount": 0.0,
                "issue_date": datetime.utcnow() - timedelta(days=30),
                "due_date": datetime.utcnow() - timedelta(days=1),
                "payment_date": datetime.utcnow() - timedelta(days=5),
                "payment_method": "bank_transfer",
                "payment_reference": f"TXN-{i+1:04d}",
                "paid_by_user_id": admin_user["id"],
                "created_by": admin_user["id"],
                "created_at": datetime.utcnow() - timedelta(days=30),
                "updated_at": datetime.utcnow() - timedelta(days=5),
                "items": [
                    {"product_name": "كيتولا 10 أمبول", "quantity": 10, "price": 80, "total": 800},
                    {"product_name": "بانادول اكسترا", "quantity": 15, "price": 25, "total": 375},
                    {"product_name": "أقراص الكالسيوم", "quantity": 20, "price": 15, "total": 300}
                ]
            }
            
            # فاتورة معلقة (مديونية)
            pending_invoice = {
                "id": str(uuid.uuid4()),
                "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{(i*2)+2:04d}",
                "clinic_id": clinic["id"],
                "clinic_name": clinic["name"],
                "order_id": None,
                "subtotal": 2500.0,
                "tax_amount": 250.0,
                "discount_amount": 0.0,
                "total_amount": 2750.0,
                "payment_status": "pending",
                "paid_amount": 0.0,
                "outstanding_amount": 2750.0,
                "issue_date": datetime.utcnow() - timedelta(days=15),
                "due_date": datetime.utcnow() + timedelta(days=15),
                "payment_date": None,
                "payment_method": None,
                "payment_reference": None,
                "paid_by_user_id": None,
                "created_by": admin_user["id"],
                "created_at": datetime.utcnow() - timedelta(days=15),
                "updated_at": datetime.utcnow() - timedelta(days=15),
                "items": [
                    {"product_name": "نوفالجين أمبول", "quantity": 25, "price": 60, "total": 1500},
                    {"product_name": "فيتامين ب مركب", "quantity": 30, "price": 20, "total": 600},
                    {"product_name": "شراب السعال", "quantity": 10, "price": 45, "total": 450}
                ]
            }
            
            # إضافة فاتورة متأخرة للعيادة الأولى
            if i == 0:
                overdue_invoice = {
                    "id": str(uuid.uuid4()),
                    "invoice_number": f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{999:04d}",
                    "clinic_id": clinic["id"],
                    "clinic_name": clinic["name"],
                    "order_id": None,
                    "subtotal": 3200.0,
                    "tax_amount": 320.0,
                    "discount_amount": 100.0,
                    "total_amount": 3420.0,
                    "payment_status": "overdue",
                    "paid_amount": 0.0,
                    "outstanding_amount": 3420.0,
                    "issue_date": datetime.utcnow() - timedelta(days=45),
                    "due_date": datetime.utcnow() - timedelta(days=15),  # متأخرة 15 يوم
                    "payment_date": None,
                    "payment_method": None,
                    "payment_reference": None,
                    "paid_by_user_id": None,
                    "created_by": admin_user["id"],
                    "created_at": datetime.utcnow() - timedelta(days=45),
                    "updated_at": datetime.utcnow() - timedelta(days=45),
                    "items": [
                        {"product_name": "أنسولين", "quantity": 20, "price": 120, "total": 2400},
                        {"product_name": "جهاز قياس السكر", "quantity": 5, "price": 80, "total": 400},
                        {"product_name": "شرائط السكر", "quantity": 10, "price": 25, "total": 250}
                    ]
                }
                created_invoices.append(overdue_invoice)
            
            created_invoices.extend([paid_invoice, pending_invoice])
        
        # إدراج الفواتير في قاعدة البيانات
        if created_invoices:
            db.invoices.insert_many(created_invoices)
            
            print(f"✅ تم إنشاء {len(created_invoices)} فاتورة تجريبية:")
            paid_count = len([inv for inv in created_invoices if inv["payment_status"] == "paid"])
            pending_count = len([inv for inv in created_invoices if inv["payment_status"] == "pending"])
            overdue_count = len([inv for inv in created_invoices if inv["payment_status"] == "overdue"])
            
            print(f"   💚 فواتير مدفوعة: {paid_count}")
            print(f"   🟡 فواتير معلقة: {pending_count}")
            print(f"   🔴 فواتير متأخرة: {overdue_count}")
            
            # تحديث إجمالي المديونية لكل عيادة
            for clinic in clinics[:2]:
                total_debt = sum(
                    inv["outstanding_amount"] 
                    for inv in created_invoices 
                    if inv["clinic_id"] == clinic["id"] and inv["payment_status"] in ["pending", "overdue", "partially_paid"]
                )
                
                db.clinics.update_one(
                    {"id": clinic["id"]},
                    {"$set": {"outstanding_debt": total_debt}}
                )
                
                print(f"   📊 تم تحديث مديونية {clinic['name']}: {total_debt:.2f}")
                
        return len(created_invoices)
        
    except Exception as e:
        print(f"❌ خطأ في إنشاء الفواتير: {e}")
        return 0

def create_sample_payments(db):
    """إنشاء بعض سجلات الدفع التجريبية"""
    print("\n💳 إنشاء سجلات دفع تجريبية...")
    
    try:
        # الحصول على admin user
        admin_user = db.users.find_one({"role": "admin"})
        if not admin_user:
            print("❌ لا يوجد مستخدم أدمن")
            return
            
        # الحصول على فاتورة مدفوعة
        paid_invoice = db.invoices.find_one({"payment_status": "paid"})
        if not paid_invoice:
            print("❌ لا توجد فواتير مدفوعة لإنشاء سجل دفع لها")
            return
            
        # إنشاء سجل دفع
        payment_record = {
            "id": str(uuid.uuid4()),
            "invoice_id": paid_invoice["id"],
            "amount": paid_invoice["total_amount"],
            "payment_method": "bank_transfer",
            "payment_date": datetime.utcnow() - timedelta(days=5),
            "reference_number": f"PAY-{paid_invoice['invoice_number'][-4:]}",
            "notes": "دفعة كاملة عبر التحويل البنكي",
            "processed_by": admin_user["id"],
            "created_at": datetime.utcnow() - timedelta(days=5)
        }
        
        db.payment_records.insert_one(payment_record)
        print(f"✅ تم إنشاء سجل دفع للفاتورة {paid_invoice['invoice_number']}")
        
        return 1
        
    except Exception as e:
        print(f"❌ خطأ في إنشاء سجلات الدفع: {e}")
        return 0

def show_debt_summary(db):
    """عرض ملخص المديونية"""
    print("\n📊 ملخص المديونية:")
    print("=" * 50)
    
    try:
        # إحصائيات الفواتير
        total_invoices = db.invoices.count_documents({})
        paid_invoices = db.invoices.count_documents({"payment_status": "paid"})
        pending_invoices = db.invoices.count_documents({"payment_status": "pending"})
        overdue_invoices = db.invoices.count_documents({"payment_status": "overdue"})
        
        print(f"📄 إجمالي الفواتير: {total_invoices}")
        print(f"💚 فواتير مدفوعة: {paid_invoices}")
        print(f"🟡 فواتير معلقة: {pending_invoices}")
        print(f"🔴 فواتير متأخرة: {overdue_invoices}")
        
        # إجمالي المبالغ
        total_amount = 0
        outstanding_amount = 0
        paid_amount = 0
        
        invoices = db.invoices.find({})
        for invoice in invoices:
            total_amount += invoice.get("total_amount", 0)
            outstanding_amount += invoice.get("outstanding_amount", 0)
            paid_amount += invoice.get("paid_amount", 0)
        
        print(f"\n💰 إجمالي المبالغ:")
        print(f"   📊 المبلغ الإجمالي: {total_amount:.2f}")
        print(f"   💚 المبلغ المدفوع: {paid_amount:.2f}")
        print(f"   🔴 المبلغ المستحق: {outstanding_amount:.2f}")
        
        # مديونية العيادات
        print(f"\n🏥 مديونية العيادات:")
        clinics_with_debt = db.clinics.find({"outstanding_debt": {"$gt": 0}})
        for clinic in clinics_with_debt:
            print(f"   🏥 {clinic['name']}: {clinic.get('outstanding_debt', 0):.2f}")
        
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ خطأ في عرض ملخص المديونية: {e}")

def main():
    """الدالة الرئيسية"""
    print("💰 بدء إنشاء فواتير ونظام المديونية التجريبي")
    print("=" * 60)
    
    # الاتصال بقاعدة البيانات
    db = connect_to_mongodb()
    if db is None:
        return
    
    try:
        # حذف الفواتير الموجودة
        db.invoices.delete_many({})
        db.payment_records.delete_many({})
        print("🗑️ تم حذف الفواتير والمدفوعات الموجودة")
        
        # إنشاء فواتير جديدة
        invoices_created = create_sample_invoices(db)
        
        # إنشاء سجلات دفع
        payments_created = create_sample_payments(db)
        
        print("\n" + "=" * 60)
        print("🎉 تم الانتهاء من إعداد نظام المديونية!")
        print(f"📄 الفواتير المُنشأة: {invoices_created}")
        print(f"💳 سجلات الدفع المُنشأة: {payments_created}")
        print("=" * 60)
        
        # عرض ملخص المديونية
        show_debt_summary(db)
        
        print("\n✅ النظام جاهز لاختبار العيادات مع المديونية!")
        print("🎨 العيادات الآن مصنفة بالألوان:")
        print("   🟢 أخضر: عيادات جديدة")
        print("   🟡 ذهبي: عيادات مميزة") 
        print("   🔴 أحمر: عيادات عليها مديونية")
        
    except Exception as e:
        print(f"❌ خطأ عام: {e}")
        return
    
    print("\n✅ انتهى إعداد نظام المديونية!")

if __name__ == "__main__":
    main()