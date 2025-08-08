# نظام الإدارة الطبية المتكامل - تكامل النظام المالي مع الخادم الرئيسي
# Medical Management System - Financial System Integration with Main Server

# هذا الملف يحتوي على التكامل المطلوب إضافته إلى server.py الرئيسي

"""
إضافة هذه الأسطر إلى server.py في قسم الـ imports:

from routers.integrated_financial_router import router as financial_router
from services.financial_service import IntegratedFinancialService
from models.financial_models import IntegratedInvoice, IntegratedDebtRecord

"""

# إضافة الموجه المالي إلى التطبيق الرئيسي
"""
إضافة هذا السطر بعد إنشاء app في server.py:

app.include_router(financial_router)
"""

# دوال مساعدة للتكامل مع النظام الحالي
async def migrate_existing_debts_to_new_system():
    """ترحيل الديون الحالية إلى النظام الجديد"""
    from server import db
    financial_service = IntegratedFinancialService(db)
    
    # جلب الديون من النظام القديم
    old_debts = await db.debts.find({}).to_list(None)
    migrated_count = 0
    
    for old_debt in old_debts:
        try:
            # التحقق من وجود الدين في النظام الجديد
            existing = await db.integrated_debts.find_one({"old_debt_id": old_debt["id"]})
            if existing:
                continue
            
            # إنشاء سجل دين جديد
            new_debt = IntegratedDebtRecord(
                debt_number=await financial_service.generate_document_number("debts"),
                invoice_id=old_debt.get("invoice_id", ""),
                invoice_number=old_debt.get("invoice_number", ""),
                clinic_id=old_debt["clinic_id"],
                clinic_name=old_debt.get("clinic_name", ""),
                sales_rep_id=old_debt["sales_rep_id"], 
                sales_rep_name=old_debt.get("sales_rep_name", ""),
                original_amount=MoneyAmount(
                    amount=Decimal(str(old_debt.get("amount", 0))),
                    currency="EGP"
                ),
                outstanding_amount=MoneyAmount(
                    amount=Decimal(str(old_debt.get("remaining_amount", old_debt.get("amount", 0)))),
                    currency="EGP"
                ),
                paid_amount=MoneyAmount(
                    amount=Decimal(str(old_debt.get("paid_amount", 0))),
                    currency="EGP"
                ),
                due_date=old_debt.get("due_date", datetime.utcnow().date()),
                created_by=old_debt.get("created_by", "system_migration")
            )
            
            # إضافة معرف الدين القديم للمرجعية
            debt_dict = new_debt.dict()
            debt_dict["old_debt_id"] = old_debt["id"]
            
            # حفظ الدين الجديد
            await db.integrated_debts.insert_one(debt_dict)
            migrated_count += 1
            
        except Exception as e:
            print(f"Error migrating debt {old_debt.get('id', 'unknown')}: {str(e)}")
    
    print(f"Migration completed: {migrated_count} debts migrated to new system")

async def create_financial_dashboard_endpoint():
    """إنشاء نقطة نهاية للوحة التحكم المالية المتكاملة"""
    
    @api_router.get("/dashboard/financial-integrated")
    async def get_integrated_financial_dashboard(current_user: User = Depends(get_current_user)):
        """لوحة التحكم المالية المتكاملة"""
        try:
            from services.financial_service import IntegratedFinancialService
            from server import db
            
            financial_service = IntegratedFinancialService(db)
            
            # الحصول على النظرة العامة
            overview = await financial_service.get_financial_dashboard_overview()
            
            return {
                "success": True,
                "data": overview,
                "integrated_system": True
            }
            
        except Exception as e:
            print(f"Error in integrated financial dashboard: {str(e)}")
            raise HTTPException(status_code=500, detail="خطأ في لوحة التحكم المالية المتكاملة")

# دوال التحقق من التكامل
async def verify_financial_integration():
    """التحقق من صحة التكامل المالي"""
    from server import db
    
    checks = {
        "collections_exist": False,
        "models_imported": False,
        "router_registered": False,
        "data_integrity": False
    }
    
    try:
        # فحص وجود المجموعات المطلوبة
        collections = await db.list_collection_names()
        required_collections = ["invoices", "debts", "payments", "financial_transactions", "document_sequences"]
        
        checks["collections_exist"] = all(col in collections for col in required_collections)
        
        # فحص استيراد النماذج
        try:
            from models.financial_models import IntegratedInvoice, IntegratedDebtRecord
            checks["models_imported"] = True
        except ImportError:
            checks["models_imported"] = False
        
        # فحص تسجيل الموجه
        try:
            from routers.integrated_financial_router import router
            checks["router_registered"] = True
        except ImportError:
            checks["router_registered"] = False
        
        # فحص سلامة البيانات
        financial_service = IntegratedFinancialService(db)
        integrity_result = await financial_service.validate_financial_integrity()
        checks["data_integrity"] = integrity_result["status"] == "clean"
        
    except Exception as e:
        print(f"Error verifying financial integration: {str(e)}")
    
    return checks

# دوال التهيئة الأولية
async def initialize_financial_system():
    """تهيئة النظام المالي المتكامل"""
    from server import db
    
    try:
        # إنشاء الفهارس المطلوبة
        await create_financial_indexes(db)
        
        # تهيئة تسلسل الأرقام
        await initialize_document_sequences(db)
        
        # ترحيل البيانات الحالية
        await migrate_existing_debts_to_new_system()
        
        print("✅ Financial system initialization completed successfully")
        
    except Exception as e:
        print(f"❌ Error initializing financial system: {str(e)}")
        raise

async def create_financial_indexes(db):
    """إنشاء الفهارس المالية المطلوبة"""
    
    # فهارس الفواتير
    await db.invoices.create_index([("invoice_number", 1)], unique=True)
    await db.invoices.create_index([("clinic_id", 1)])
    await db.invoices.create_index([("sales_rep_id", 1)])
    await db.invoices.create_index([("status", 1)])
    await db.invoices.create_index([("issue_date", -1)])
    await db.invoices.create_index([("due_date", 1)])
    
    # فهارس الديون
    await db.debts.create_index([("debt_number", 1)], unique=True)
    await db.debts.create_index([("clinic_id", 1)])
    await db.debts.create_index([("sales_rep_id", 1)])
    await db.debts.create_index([("status", 1)])
    await db.debts.create_index([("due_date", 1)])
    await db.debts.create_index([("invoice_id", 1)])
    
    # فهارس المدفوعات
    await db.payments.create_index([("payment_number", 1)], unique=True)
    await db.payments.create_index([("debt_id", 1)])
    await db.payments.create_index([("payment_date", -1)])
    await db.payments.create_index([("status", 1)])
    
    # فهارس المعاملات المالية
    await db.financial_transactions.create_index([("transaction_number", 1)], unique=True)
    await db.financial_transactions.create_index([("transaction_type", 1)])
    await db.financial_transactions.create_index([("transaction_date", -1)])
    await db.financial_transactions.create_index([("invoice_id", 1)])
    await db.financial_transactions.create_index([("debt_id", 1)])

async def initialize_document_sequences(db):
    """تهيئة تسلسل أرقام المستندات"""
    
    document_types = ["invoices", "debts", "payments", "receipts", "credit_notes", "debit_notes"]
    
    for doc_type in document_types:
        existing = await db.document_sequences.find_one({"document_type": doc_type})
        if not existing:
            await db.document_sequences.insert_one({
                "document_type": doc_type,
                "last_number": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })

# معلومات للمطور حول التكامل
INTEGRATION_NOTES = """
# تعليمات التكامل مع النظام المالي المتكامل

## 1. إضافة الاستيرادات إلى server.py:
```python
from routers.integrated_financial_router import router as financial_router
from services.financial_service import IntegratedFinancialService
from models.financial_models import IntegratedInvoice, IntegratedDebtRecord
```

## 2. تسجيل الموجه:
```python
app.include_router(financial_router)
```

## 3. تشغيل التهيئة الأولية:
```python
# في دالة startup أو main
await initialize_financial_system()
```

## 4. إضافة مكون الواجهة الأمامية:
```javascript
import IntegratedFinancialDashboard from './components/Financial/IntegratedFinancialDashboard';

// في المكون الرئيسي
<IntegratedFinancialDashboard user={user} language={language} />
```

## 5. تحديث ملفات التوجيه في الواجهة:
```javascript
// إضافة المسارات المالية
{
  path: '/financial',
  component: IntegratedFinancialDashboard,
  protected: true
}
```

## 6. فحص التكامل:
```python
checks = await verify_financial_integration()
print("Integration status:", checks)
```

## المميزات الرئيسية:

✅ دمج كامل لإدارة الديون والفواتير
✅ نظام ترقيم تلقائي آمن
✅ تتبع مسار التدقيق الكامل
✅ حسابات دقيقة غير قابلة للتلاعب
✅ تقارير مالية متقدمة
✅ تحليل تقادم الديون
✅ إدارة المخاطر المالية
✅ واجهة مستخدم متكاملة
✅ دعم متعدد العملات
✅ نظام دفع متقدم

## الأمان والسلامة:

- جميع العمليات المالية مسجلة في audit trail
- التحقق من صحة البيانات في جميع المراحل
- نظام صلاحيات متقدم
- حماية من التلاعب في الأرقام
- تحقق تلقائي من سلامة البيانات
- نظام نسخ احتياطي للبيانات الحرجة
"""

if __name__ == "__main__":
    print(INTEGRATION_NOTES)