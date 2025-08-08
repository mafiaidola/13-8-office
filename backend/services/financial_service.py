# نظام الإدارة الطبية المتكامل - خدمات النظام المالي المتكامل
# Medical Management System - Integrated Financial Services

from typing import List, Dict, Any, Optional, Union
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
import uuid
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.financial_models import (
    IntegratedInvoice, IntegratedDebtRecord, DebtPaymentRecord,
    FinancialTransaction, MoneyAmount, TaxCalculation, AuditTrail,
    InvoiceStatus, DebtStatus, PaymentStatus, TransactionType,
    FinancialConfig, AgingAnalysis, FinancialSummary,
    InvoiceLineItem
)

class IntegratedFinancialService:
    """خدمة النظام المالي المتكامل - Integrated Financial Service"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.config = FinancialConfig()
    
    # ============================================================================
    # AUTO-NUMBERING SYSTEM - نظام الترقيم التلقائي
    # ============================================================================
    
    async def generate_document_number(self, document_type: str) -> str:
        """إنشاء رقم مستند تلقائي - Generate automatic document number"""
        config = self.config.AUTO_NUMBERING.get(document_type)
        if not config:
            raise ValueError(f"نوع المستند غير مدعوم: {document_type}")
        
        # البحث عن آخر رقم مستند
        last_doc = await self.db.document_sequences.find_one(
            {"document_type": document_type}
        )
        
        if last_doc:
            next_number = last_doc["last_number"] + 1
            await self.db.document_sequences.update_one(
                {"document_type": document_type},
                {"$set": {"last_number": next_number, "updated_at": datetime.utcnow()}}
            )
        else:
            next_number = 1
            await self.db.document_sequences.insert_one({
                "document_type": document_type,
                "last_number": next_number,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })
        
        # تنسيق الرقم
        prefix = config["prefix"]
        digits = config["digits"]
        formatted_number = f"{prefix}-{next_number:0{digits}d}"
        
        return formatted_number
    
    # ============================================================================
    # INVOICE MANAGEMENT - إدارة الفواتير
    # ============================================================================
    
    async def create_invoice(
        self,
        clinic_id: str,
        sales_rep_id: str,
        line_items_data: List[Dict[str, Any]],
        due_date: date,
        created_by: str,
        order_id: Optional[str] = None,
        payment_terms: str = "30 يوم",
        notes: Optional[str] = None
    ) -> IntegratedInvoice:
        """إنشاء فاتورة جديدة - Create new invoice"""
        
        # التحقق من وجود العيادة والمندوب
        clinic = await self.db.clinics.find_one({"id": clinic_id})
        if not clinic:
            raise ValueError("العيادة غير موجودة")
        
        sales_rep = await self.db.users.find_one({"id": sales_rep_id})
        if not sales_rep:
            raise ValueError("المندوب غير موجود")
        
        # إنشاء عناصر الفاتورة
        line_items = []
        for item_data in line_items_data:
            # التحقق من وجود المنتج
            product = await self.db.products.find_one({"id": item_data["product_id"]})
            if not product:
                raise ValueError(f"المنتج غير موجود: {item_data['product_id']}")
            
            line_item = InvoiceLineItem(
                product_id=item_data["product_id"],
                product_name=product.get("name", ""),
                product_code=product.get("code"),
                quantity=Decimal(str(item_data["quantity"])),
                unit_price=MoneyAmount(
                    amount=Decimal(str(item_data["unit_price"])),
                    currency="EGP"
                ),
                discount_percentage=Decimal(str(item_data.get("discount_percentage", "0.00")))
            )
            line_items.append(line_item)
        
        # إنشاء الفاتورة
        invoice = IntegratedInvoice(
            invoice_number=await self.generate_document_number("invoices"),
            clinic_id=clinic_id,
            clinic_name=clinic.get("name", ""),
            clinic_address=clinic.get("address"),
            clinic_tax_number=clinic.get("tax_number"),
            sales_rep_id=sales_rep_id,
            sales_rep_name=sales_rep.get("full_name", ""),
            area_id=sales_rep.get("area_id"),
            area_name=sales_rep.get("area_name"),
            due_date=due_date,
            line_items=line_items,
            payment_terms=payment_terms,
            order_id=order_id,
            notes=notes,
            created_by=created_by,
            status=InvoiceStatus.PENDING
        )
        
        # حساب المبالغ
        invoice.calculate_totals()
        
        # إضافة مسار التدقيق
        audit = AuditTrail(
            action="invoice_created",
            user_id=created_by,
            user_name=sales_rep.get("full_name", ""),
            timestamp=datetime.utcnow(),
            after_values={"status": "pending", "total_amount": str(invoice.total_amount)}
        )
        invoice.audit_trail.append(audit)
        
        # حفظ الفاتورة
        await self.db.invoices.insert_one(invoice.dict())
        
        return invoice
    
    async def confirm_invoice(self, invoice_id: str, confirmed_by: str) -> IntegratedInvoice:
        """تأكيد الفاتورة - Confirm invoice"""
        invoice_data = await self.db.invoices.find_one({"id": invoice_id})
        if not invoice_data:
            raise ValueError("الفاتورة غير موجودة")
        
        if invoice_data["status"] != InvoiceStatus.PENDING:
            raise ValueError("لا يمكن تأكيد هذه الفاتورة")
        
        # تحديث حالة الفاتورة
        update_data = {
            "status": InvoiceStatus.CONFIRMED,
            "approved_by": confirmed_by,
            "approved_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # إضافة مسار تدقيق
        user = await self.db.users.find_one({"id": confirmed_by})
        audit = AuditTrail(
            action="invoice_confirmed",
            user_id=confirmed_by,
            user_name=user.get("full_name", "") if user else "",
            timestamp=datetime.utcnow(),
            before_values={"status": InvoiceStatus.PENDING},
            after_values={"status": InvoiceStatus.CONFIRMED}
        )
        
        await self.db.invoices.update_one(
            {"id": invoice_id},
            {
                "$set": update_data,
                "$push": {"audit_trail": audit.dict()}
            }
        )
        
        # جلب الفاتورة المحدثة
        updated_invoice_data = await self.db.invoices.find_one({"id": invoice_id})
        return IntegratedInvoice(**updated_invoice_data)
    
    async def convert_invoice_to_debt(
        self, 
        invoice_id: str, 
        converted_by: str,
        collection_start_date: Optional[date] = None
    ) -> IntegratedDebtRecord:
        """تحويل فاتورة إلى دين - Convert invoice to debt"""
        
        # جلب الفاتورة
        invoice_data = await self.db.invoices.find_one({"id": invoice_id})
        if not invoice_data:
            raise ValueError("الفاتورة غير موجودة")
        
        invoice = IntegratedInvoice(**invoice_data)
        
        # التحقق من إمكانية التحويل
        if invoice.status == InvoiceStatus.CONVERTED_TO_DEBT:
            raise ValueError("الفاتورة محولة بالفعل إلى دين")
        
        if not invoice.outstanding_amount or invoice.outstanding_amount.amount <= 0:
            raise ValueError("لا يوجد مبلغ مستحق للتحويل إلى دين")
        
        # إنشاء سجل الدين
        debt_record = IntegratedDebtRecord(
            debt_number=await self.generate_document_number("debts"),
            invoice_id=invoice.id,
            invoice_number=invoice.invoice_number,
            clinic_id=invoice.clinic_id,
            clinic_name=invoice.clinic_name,
            clinic_contact=invoice_data.get("clinic_contact"),
            clinic_address=invoice.clinic_address,
            sales_rep_id=invoice.sales_rep_id,
            sales_rep_name=invoice.sales_rep_name,
            area_id=invoice.area_id,
            area_name=invoice.area_name,
            original_amount=invoice.total_amount,
            outstanding_amount=invoice.outstanding_amount,
            due_date=invoice.due_date,
            collection_start_date=collection_start_date or date.today(),
            created_by=converted_by
        )
        
        # إضافة مسار التدقيق
        user = await self.db.users.find_one({"id": converted_by})
        audit = AuditTrail(
            action="converted_from_invoice",
            user_id=converted_by,
            user_name=user.get("full_name", "") if user else "",
            timestamp=datetime.utcnow(),
            after_values={
                "invoice_id": invoice.id,
                "amount": str(debt_record.outstanding_amount)
            }
        )
        debt_record.audit_trail.append(audit)
        
        # حفظ سجل الدين
        await self.db.debts.insert_one(debt_record.dict())
        
        # تحديث حالة الفاتورة
        invoice_audit = AuditTrail(
            action="converted_to_debt",
            user_id=converted_by,
            user_name=user.get("full_name", "") if user else "",
            timestamp=datetime.utcnow(),
            before_values={"status": invoice.status},
            after_values={"status": InvoiceStatus.CONVERTED_TO_DEBT}
        )
        
        await self.db.invoices.update_one(
            {"id": invoice_id},
            {
                "$set": {
                    "status": InvoiceStatus.CONVERTED_TO_DEBT,
                    "debt_record_id": debt_record.id,
                    "updated_at": datetime.utcnow()
                },
                "$push": {"audit_trail": invoice_audit.dict()}
            }
        )
        
        return debt_record
    
    # ============================================================================
    # DEBT MANAGEMENT - إدارة الديون
    # ============================================================================
    
    async def create_direct_debt(
        self,
        clinic_id: str,
        sales_rep_id: str,
        amount: Decimal,
        description: str,
        due_date: date,
        created_by: str
    ) -> IntegratedDebtRecord:
        """إنشاء دين مباشر (بدون فاتورة) - Create direct debt"""
        
        # التحقق من وجود العيادة والمندوب
        clinic = await self.db.clinics.find_one({"id": clinic_id})
        if not clinic:
            raise ValueError("العيادة غير موجودة")
        
        sales_rep = await self.db.users.find_one({"id": sales_rep_id})
        if not sales_rep:
            raise ValueError("المندوب غير موجود")
        
        # إنشاء سجل الدين
        debt_record = IntegratedDebtRecord(
            debt_number=await self.generate_document_number("debts"),
            invoice_id="",  # دين مباشر بدون فاتورة
            invoice_number="",
            clinic_id=clinic_id,
            clinic_name=clinic.get("name", ""),
            clinic_contact=clinic.get("phone"),
            clinic_address=clinic.get("address"),
            sales_rep_id=sales_rep_id,
            sales_rep_name=sales_rep.get("full_name", ""),
            area_id=sales_rep.get("area_id"),
            area_name=sales_rep.get("area_name"),
            original_amount=MoneyAmount(amount=amount, currency="EGP"),
            outstanding_amount=MoneyAmount(amount=amount, currency="EGP"),
            due_date=due_date,
            collection_start_date=date.today(),
            created_by=created_by
        )
        
        # إضافة ملاحظة الوصف
        debt_record.collection_notes.append(f"دين مباشر: {description}")
        
        # إضافة مسار التدقيق
        user = await self.db.users.find_one({"id": created_by})
        audit = AuditTrail(
            action="direct_debt_created",
            user_id=created_by,
            user_name=user.get("full_name", "") if user else "",
            timestamp=datetime.utcnow(),
            after_values={
                "amount": str(amount),
                "description": description
            }
        )
        debt_record.audit_trail.append(audit)
        
        # حفظ سجل الدين
        await self.db.debts.insert_one(debt_record.dict())
        
        return debt_record
    
    async def process_debt_payment(
        self,
        debt_id: str,
        amount: Decimal,
        payment_method: str,
        processed_by: str,
        payment_date: Optional[date] = None,
        reference_number: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """معالجة دفعة دين - Process debt payment"""
        
        # جلب سجل الدين
        debt_data = await self.db.debts.find_one({"id": debt_id})
        if not debt_data:
            raise ValueError("سجل الدين غير موجود")
        
        debt_record = IntegratedDebtRecord(**debt_data)
        
        # التحقق من صحة المبلغ
        if amount <= 0:
            raise ValueError("مبلغ الدفعة يجب أن يكون أكبر من صفر")
        
        if amount > debt_record.outstanding_amount.amount:
            raise ValueError("مبلغ الدفعة أكبر من المبلغ المتبقي")
        
        # إنشاء سجل الدفعة
        payment_record = DebtPaymentRecord(
            payment_number=await self.generate_document_number("payments"),
            debt_id=debt_id,
            debt_number=debt_record.debt_number,
            amount=MoneyAmount(amount=amount, currency="EGP"),
            payment_date=payment_date or date.today(),
            payment_method=payment_method,
            reference_number=reference_number,
            processed_by=processed_by,
            processed_by_name="",  # سيتم ملؤها
            notes=notes
        )
        
        # الحصول على معلومات المعالج
        user = await self.db.users.find_one({"id": processed_by})
        if user:
            payment_record.processed_by_name = user.get("full_name", "")
        
        # إضافة مسار التدقيق للدفعة
        audit = AuditTrail(
            action="payment_processed",
            user_id=processed_by,
            user_name=payment_record.processed_by_name,
            timestamp=datetime.utcnow(),
            after_values={
                "amount": str(amount),
                "method": payment_method
            }
        )
        payment_record.audit_trail.append(audit)
        
        # تحديث سجل الدين
        debt_record.add_payment(payment_record)
        
        # إنشاء معاملة مالية
        transaction = FinancialTransaction(
            transaction_number=await self.generate_document_number("payments"),
            transaction_type=TransactionType.DEBT_PAYMENT,
            debt_id=debt_id,
            payment_id=payment_record.id,
            amount=payment_record.amount,
            description=f"دفعة على الدين {debt_record.debt_number}",
            reference=reference_number,
            processed_by=processed_by,
            processed_by_name=payment_record.processed_by_name
        )
        
        # حفظ البيانات
        await asyncio.gather(
            self.db.debts.update_one(
                {"id": debt_id},
                {"$set": debt_record.dict()}
            ),
            self.db.payments.insert_one(payment_record.dict()),
            self.db.financial_transactions.insert_one(transaction.dict())
        )
        
        # تحديث الفاتورة المرتبطة إذا وجدت
        if debt_record.invoice_id:
            await self._update_invoice_from_debt_payment(debt_record, payment_record)
        
        return {
            "success": True,
            "payment_id": payment_record.id,
            "remaining_amount": float(debt_record.outstanding_amount.amount),
            "fully_paid": debt_record.status == DebtStatus.COLLECTED,
            "message": "تم تسجيل الدفعة بنجاح"
        }
    
    async def _update_invoice_from_debt_payment(
        self, 
        debt_record: IntegratedDebtRecord, 
        payment_record: DebtPaymentRecord
    ):
        """تحديث الفاتورة المرتبطة بعد دفعة الدين"""
        if not debt_record.invoice_id:
            return
        
        # جلب الفاتورة
        invoice_data = await self.db.invoices.find_one({"id": debt_record.invoice_id})
        if not invoice_data:
            return
        
        # حساب المبلغ المدفوع الجديد
        current_paid = invoice_data.get("paid_amount", {})
        if isinstance(current_paid, dict):
            current_paid_amount = Decimal(str(current_paid.get("amount", "0.00")))
        else:
            current_paid_amount = Decimal("0.00")
        
        new_paid_amount = current_paid_amount + payment_record.amount.amount
        new_outstanding = Decimal(str(invoice_data["total_amount"]["amount"])) - new_paid_amount
        
        # تحديد الحالة الجديدة
        if new_outstanding <= Decimal("0.01"):
            new_status = InvoiceStatus.PAID
        else:
            new_status = InvoiceStatus.PARTIALLY_PAID
        
        # تحديث الفاتورة
        await self.db.invoices.update_one(
            {"id": debt_record.invoice_id},
            {
                "$set": {
                    "paid_amount": {
                        "amount": float(new_paid_amount),
                        "currency": "EGP"
                    },
                    "outstanding_amount": {
                        "amount": float(new_outstanding),
                        "currency": "EGP"
                    },
                    "status": new_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    # ============================================================================
    # FINANCIAL REPORTS - التقارير المالية
    # ============================================================================
    
    async def generate_aging_analysis(
        self, 
        clinic_ids: Optional[List[str]] = None,
        as_of_date: Optional[date] = None
    ) -> List[AgingAnalysis]:
        """إنشاء تقرير تقادم الديون - Generate aging analysis"""
        
        if as_of_date is None:
            as_of_date = date.today()
        
        # تحديد العيادات المطلوبة
        if clinic_ids:
            clinic_filter = {"clinic_id": {"$in": clinic_ids}}
        else:
            clinic_filter = {}
        
        # جلب الديون النشطة
        debts_cursor = self.db.debts.find({
            **clinic_filter,
            "status": {"$in": [DebtStatus.OUTSTANDING, DebtStatus.PARTIALLY_COLLECTED]}
        })
        
        # تجميع البيانات حسب العيادة
        clinic_aging = {}
        
        async for debt_data in debts_cursor:
            debt = IntegratedDebtRecord(**debt_data)
            clinic_id = debt.clinic_id
            
            if clinic_id not in clinic_aging:
                clinic_aging[clinic_id] = {
                    "clinic_name": debt.clinic_name,
                    "total_outstanding": Decimal("0.00"),
                    "current": Decimal("0.00"),
                    "days_30": Decimal("0.00"),
                    "days_60": Decimal("0.00"),
                    "days_90": Decimal("0.00"),
                    "over_90": Decimal("0.00")
                }
            
            # حساب تقادم الدين
            aging = debt.calculate_aging()
            outstanding = debt.outstanding_amount.amount
            
            clinic_aging[clinic_id]["total_outstanding"] += outstanding
            
            # تصنيف حسب العمر
            if aging["days_overdue"] <= 0:
                clinic_aging[clinic_id]["current"] += outstanding
            elif aging["days_overdue"] <= 30:
                clinic_aging[clinic_id]["days_30"] += outstanding
            elif aging["days_overdue"] <= 60:
                clinic_aging[clinic_id]["days_60"] += outstanding
            elif aging["days_overdue"] <= 90:
                clinic_aging[clinic_id]["days_90"] += outstanding
            else:
                clinic_aging[clinic_id]["over_90"] += outstanding
        
        # تحويل إلى قائمة AgingAnalysis
        aging_analysis = []
        for clinic_id, data in clinic_aging.items():
            # تحديد مستوى المخاطرة
            total = data["total_outstanding"]
            if data["over_90"] > total * Decimal("0.5"):  # أكثر من 50% فوق 90 يوم
                risk_level = "critical"
                recommended_action = "إجراءات تحصيل عاجلة"
            elif data["days_90"] > total * Decimal("0.3"):  # أكثر من 30% فوق 60 يوم
                risk_level = "high"
                recommended_action = "متابعة حثيثة للتحصيل"
            elif data["days_60"] > total * Decimal("0.4"):  # أكثر من 40% فوق 30 يوم
                risk_level = "medium"
                recommended_action = "متابعة منتظمة"
            else:
                risk_level = "low"
                recommended_action = "مراقبة عادية"
            
            analysis = AgingAnalysis(
                clinic_id=clinic_id,
                clinic_name=data["clinic_name"],
                total_outstanding=MoneyAmount(amount=data["total_outstanding"], currency="EGP"),
                current=MoneyAmount(amount=data["current"], currency="EGP"),
                days_30=MoneyAmount(amount=data["days_30"], currency="EGP"),
                days_60=MoneyAmount(amount=data["days_60"], currency="EGP"),
                days_90=MoneyAmount(amount=data["days_90"], currency="EGP"),
                over_90=MoneyAmount(amount=data["over_90"], currency="EGP"),
                risk_level=risk_level,
                recommended_action=recommended_action
            )
            aging_analysis.append(analysis)
        
        return sorted(aging_analysis, key=lambda x: x.total_outstanding.amount, reverse=True)
    
    async def generate_financial_summary(
        self, 
        start_date: date, 
        end_date: date,
        clinic_ids: Optional[List[str]] = None
    ) -> FinancialSummary:
        """إنشاء ملخص مالي شامل - Generate comprehensive financial summary"""
        
        # تحديد فلاتر البحث
        date_filter = {
            "created_at": {
                "$gte": datetime.combine(start_date, datetime.min.time()),
                "$lte": datetime.combine(end_date, datetime.max.time())
            }
        }
        
        clinic_filter = {}
        if clinic_ids:
            clinic_filter = {"clinic_id": {"$in": clinic_ids}}
        
        # جلب إحصائيات الفواتير
        invoice_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$total_amount.amount"}},
                    "paid_amount": {"$sum": {"$toDouble": "$paid_amount.amount"}},
                    "outstanding_amount": {"$sum": {"$toDouble": "$outstanding_amount.amount"}}
                }
            }
        ]
        
        invoice_stats = await self.db.invoices.aggregate(invoice_pipeline).to_list(1)
        invoice_data = invoice_stats[0] if invoice_stats else {}
        
        # جلب إحصائيات الديون
        debt_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_count": {"$sum": 1},
                    "original_amount": {"$sum": {"$toDouble": "$original_amount.amount"}},
                    "paid_amount": {"$sum": {"$toDouble": "$paid_amount.amount"}},
                    "outstanding_amount": {"$sum": {"$toDouble": "$outstanding_amount.amount"}}
                }
            }
        ]
        
        debt_stats = await self.db.debts.aggregate(debt_pipeline).to_list(1)
        debt_data = debt_stats[0] if debt_stats else {}
        
        # جلب إحصائيات المدفوعات
        payment_pipeline = [
            {"$match": {**date_filter, **clinic_filter}},
            {
                "$group": {
                    "_id": None,
                    "total_count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$amount.amount"}}
                }
            }
        ]
        
        payment_stats = await self.db.payments.aggregate(payment_pipeline).to_list(1)
        payment_data = payment_stats[0] if payment_stats else {}
        
        # حساب المؤشرات المالية
        total_invoiced = Decimal(str(invoice_data.get("total_amount", 0)))
        total_collected = Decimal(str(payment_data.get("total_amount", 0)))
        
        collection_rate = Decimal("0.00")
        if total_invoiced > 0:
            collection_rate = (total_collected / total_invoiced * 100).quantize(Decimal("0.01"))
        
        # حساب متوسط وقت التحصيل
        average_collection_time = await self._calculate_average_collection_time(
            start_date, end_date, clinic_ids
        )
        
        # حساب معدل التأخير
        overdue_rate = await self._calculate_overdue_rate(clinic_ids)
        
        return FinancialSummary(
            period_start=start_date,
            period_end=end_date,
            total_invoices_count=invoice_data.get("total_count", 0),
            total_invoices_amount=MoneyAmount(amount=total_invoiced, currency="EGP"),
            paid_invoices_amount=MoneyAmount(
                amount=Decimal(str(invoice_data.get("paid_amount", 0))), 
                currency="EGP"
            ),
            outstanding_invoices_amount=MoneyAmount(
                amount=Decimal(str(invoice_data.get("outstanding_amount", 0))), 
                currency="EGP"
            ),
            total_debts_count=debt_data.get("total_count", 0),
            total_debts_amount=MoneyAmount(
                amount=Decimal(str(debt_data.get("original_amount", 0))), 
                currency="EGP"
            ),
            collected_debts_amount=MoneyAmount(
                amount=Decimal(str(debt_data.get("paid_amount", 0))), 
                currency="EGP"
            ),
            outstanding_debts_amount=MoneyAmount(
                amount=Decimal(str(debt_data.get("outstanding_amount", 0))), 
                currency="EGP"
            ),
            total_payments_count=payment_data.get("total_count", 0),
            total_payments_amount=MoneyAmount(amount=total_collected, currency="EGP"),
            collection_rate=collection_rate,
            average_collection_time=average_collection_time,
            overdue_rate=overdue_rate
        )
    
    async def _calculate_average_collection_time(
        self, 
        start_date: date, 
        end_date: date,
        clinic_ids: Optional[List[str]] = None
    ) -> int:
        """حساب متوسط وقت التحصيل"""
        # هذا حساب مبسط - يمكن تطويره أكثر
        return 25  # متوسط 25 يوم كمثال
    
    async def _calculate_overdue_rate(self, clinic_ids: Optional[List[str]] = None) -> Decimal:
        """حساب معدل التأخير"""
        # فلتر العيادات
        clinic_filter = {}
        if clinic_ids:
            clinic_filter = {"clinic_id": {"$in": clinic_ids}}
        
        # عد الديون المتأخرة
        today = datetime.utcnow()
        total_debts = await self.db.debts.count_documents({
            **clinic_filter,
            "status": {"$in": [DebtStatus.OUTSTANDING, DebtStatus.PARTIALLY_COLLECTED]}
        })
        
        overdue_debts = await self.db.debts.count_documents({
            **clinic_filter,
            "status": {"$in": [DebtStatus.OUTSTANDING, DebtStatus.PARTIALLY_COLLECTED]},
            "due_date": {"$lt": today}
        })
        
        if total_debts == 0:
            return Decimal("0.00")
        
        return (Decimal(str(overdue_debts)) / Decimal(str(total_debts)) * 100).quantize(Decimal("0.01"))
    
    # ============================================================================
    # UTILITY METHODS - طرق مساعدة
    # ============================================================================
    
    async def get_clinic_financial_status(self, clinic_id: str) -> Dict[str, Any]:
        """الحصول على الحالة المالية للعيادة - Get clinic financial status"""
        
        # جلب الديون النشطة
        debts_cursor = self.db.debts.find({
            "clinic_id": clinic_id,
            "status": {"$in": [DebtStatus.OUTSTANDING, DebtStatus.PARTIALLY_COLLECTED]}
        })
        
        total_outstanding = Decimal("0.00")
        overdue_amount = Decimal("0.00")
        debt_count = 0
        
        today = date.today()
        
        async for debt_data in debts_cursor:
            debt = IntegratedDebtRecord(**debt_data)
            total_outstanding += debt.outstanding_amount.amount
            debt_count += 1
            
            if debt.due_date < today:
                overdue_amount += debt.outstanding_amount.amount
        
        # تحديد حالة الائتمان
        if total_outstanding >= Decimal(str(self.config.DEBT_LIMITS["block_threshold"])):
            credit_status = "blocked"
            risk_level = "critical"
        elif total_outstanding >= Decimal(str(self.config.DEBT_LIMITS["warning_threshold"])):
            credit_status = "warning"
            risk_level = "high"
        else:
            credit_status = "good"
            risk_level = "low"
        
        return {
            "clinic_id": clinic_id,
            "total_outstanding": float(total_outstanding),
            "overdue_amount": float(overdue_amount),
            "debt_count": debt_count,
            "credit_status": credit_status,
            "risk_level": risk_level,
            "credit_limit_used": float(total_outstanding),
            "can_create_new_orders": credit_status != "blocked"
        }
    
    async def validate_financial_integrity(self) -> Dict[str, Any]:
        """فحص سلامة البيانات المالية - Validate financial data integrity"""
        
        issues = []
        
        # فحص تطابق مجاميع الفواتير
        invoices_cursor = self.db.invoices.find({})
        async for invoice_data in invoices_cursor:
            invoice = IntegratedInvoice(**invoice_data)
            calculated_totals = invoice.calculate_totals()
            
            # مقارنة المجاميع المحفوظة مع المحسوبة
            stored_total = invoice.total_amount
            calculated_total = calculated_totals["total"]
            
            if abs(stored_total.amount - calculated_total.amount) > Decimal("0.01"):
                issues.append({
                    "type": "invoice_total_mismatch",
                    "invoice_id": invoice.id,
                    "invoice_number": invoice.invoice_number,
                    "stored_total": float(stored_total.amount),
                    "calculated_total": float(calculated_total.amount)
                })
        
        # فحص تطابق مجاميع الديون
        debts_cursor = self.db.debts.find({})
        async for debt_data in debts_cursor:
            debt = IntegratedDebtRecord(**debt_data)
            
            # حساب إجمالي المدفوعات
            total_payments = sum(
                payment.amount.amount for payment in debt.payments
            )
            
            expected_outstanding = debt.original_amount.amount - total_payments
            actual_outstanding = debt.outstanding_amount.amount
            
            if abs(expected_outstanding - actual_outstanding) > Decimal("0.01"):
                issues.append({
                    "type": "debt_balance_mismatch",
                    "debt_id": debt.id,
                    "debt_number": debt.debt_number,
                    "expected_outstanding": float(expected_outstanding),
                    "actual_outstanding": float(actual_outstanding)
                })
        
        return {
            "integrity_check_completed": True,
            "issues_found": len(issues),
            "issues": issues,
            "status": "clean" if len(issues) == 0 else "issues_found"
        }