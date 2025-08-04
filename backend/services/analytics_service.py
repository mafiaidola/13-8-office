# Advanced Analytics Service - خدمة التحليلات المتقدمة
import asyncio
import logging
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta, date
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from models.analytics_models import *
import json
import math

class AnalyticsService:
    def __init__(self, db):
        self.db = db
        self.logger = logging.getLogger(__name__)
        
    async def generate_sales_analytics(self, time_range: TimeRange, filters: Dict[str, Any] = {}) -> SalesAnalytics:
        """تحليل المبيعات المتقدم"""
        try:
            # تحديد الفترة الزمنية
            start_date, end_date = self._get_time_range(time_range)
            
            # استعلام الطلبات
            query = {
                "created_at": {"$gte": start_date, "$lte": end_date},
                "status": {"$ne": "cancelled"}
            }
            
            # تطبيق الفلاتر
            if filters.get("rep_id"):
                query["medical_rep_id"] = filters["rep_id"]
            if filters.get("area_id"):
                query["area_id"] = filters["area_id"]
            if filters.get("clinic_id"):
                query["clinic_id"] = filters["clinic_id"]
            
            # الحصول على الطلبات
            orders = await self.db.orders.find(query).to_list(10000)
            
            # حساب الإحصائيات الأساسية
            total_sales = sum(order.get("total_amount", 0) for order in orders)
            total_orders = len(orders)
            average_order_value = total_sales / total_orders if total_orders > 0 else 0
            
            # مقارنة بالفترة السابقة
            prev_start, prev_end = self._get_previous_period(start_date, end_date)
            prev_orders = await self.db.orders.find({
                "created_at": {"$gte": prev_start, "$lte": prev_end},
                "status": {"$ne": "cancelled"}
            }).to_list(10000)
            
            prev_total_sales = sum(order.get("total_amount", 0) for order in prev_orders)
            prev_total_orders = len(prev_orders)
            
            sales_growth = ((total_sales - prev_total_sales) / prev_total_sales * 100) if prev_total_sales > 0 else 0
            order_growth = ((total_orders - prev_total_orders) / prev_total_orders * 100) if prev_total_orders > 0 else 0
            
            # أفضل المنتجات
            product_sales = {}
            for order in orders:
                for item in order.get("items", []):
                    product_id = item.get("product_id")
                    quantity = item.get("quantity", 0)
                    total_price = item.get("total_price", 0)
                    
                    if product_id not in product_sales:
                        product_sales[product_id] = {
                            "product_name": item.get("product_name", "غير محدد"),
                            "quantity": 0,
                            "total_sales": 0
                        }
                    
                    product_sales[product_id]["quantity"] += quantity
                    product_sales[product_id]["total_sales"] += total_price
            
            top_products = sorted(
                [{"product_id": k, **v} for k, v in product_sales.items()],
                key=lambda x: x["total_sales"],
                reverse=True
            )[:10]
            
            # أفضل العملاء
            clinic_sales = {}
            for order in orders:
                clinic_id = order.get("clinic_id")
                amount = order.get("total_amount", 0)
                
                if clinic_id not in clinic_sales:
                    clinic_sales[clinic_id] = {
                        "clinic_name": order.get("clinic_name", "غير محدد"),
                        "total_sales": 0,
                        "order_count": 0
                    }
                
                clinic_sales[clinic_id]["total_sales"] += amount
                clinic_sales[clinic_id]["order_count"] += 1
            
            top_clients = sorted(
                [{"clinic_id": k, **v} for k, v in clinic_sales.items()],
                key=lambda x: x["total_sales"],
                reverse=True
            )[:10]
            
            # أفضل المندوبين
            rep_sales = {}
            for order in orders:
                rep_id = order.get("medical_rep_id")
                amount = order.get("total_amount", 0)
                
                if rep_id and rep_id not in rep_sales:
                    rep_sales[rep_id] = {
                        "rep_name": order.get("rep_name", "غير محدد"),
                        "total_sales": 0,
                        "order_count": 0
                    }
                
                if rep_id:
                    rep_sales[rep_id]["total_sales"] += amount
                    rep_sales[rep_id]["order_count"] += 1
            
            top_reps = sorted(
                [{"rep_id": k, **v} for k, v in rep_sales.items()],
                key=lambda x: x["total_sales"],
                reverse=True
            )[:10]
            
            # المبيعات حسب المنطقة
            area_sales = {}
            for order in orders:
                area = order.get("line", "غير محدد")
                amount = order.get("total_amount", 0)
                
                if area not in area_sales:
                    area_sales[area] = {"area_name": area, "total_sales": 0, "order_count": 0}
                
                area_sales[area]["total_sales"] += amount
                area_sales[area]["order_count"] += 1
            
            sales_by_area = list(area_sales.values())
            
            # حساب معدل التحويل (نسبة الزيارات التي أدت لطلبات)
            visits_count = await self.db.visits.count_documents({
                "date": {"$gte": start_date, "$lte": end_date}
            })
            conversion_rate = (total_orders / visits_count * 100) if visits_count > 0 else 0
            
            return SalesAnalytics(
                total_sales=total_sales,
                total_orders=total_orders,
                average_order_value=average_order_value,
                conversion_rate=conversion_rate,
                sales_growth=sales_growth,
                order_growth=order_growth,
                top_products=top_products,
                top_clients=top_clients,
                top_reps=top_reps,
                sales_by_area=sales_by_area,
                sales_by_line=[]  # يمكن تطويرها لاحقاً
            )
            
        except Exception as e:
            self.logger.error(f"Error generating sales analytics: {e}")
            return SalesAnalytics()

    async def generate_visit_analytics(self, time_range: TimeRange, filters: Dict[str, Any] = {}) -> VisitAnalytics:
        """تحليل الزيارات المتقدم"""
        try:
            # تحديد الفترة الزمنية
            start_date, end_date = self._get_time_range(time_range)
            
            # استعلام الزيارات
            query = {"date": {"$gte": start_date, "$lte": end_date}}
            
            if filters.get("rep_id"):
                query["sales_rep_id"] = filters["rep_id"]
            if filters.get("clinic_id"):
                query["clinic_id"] = filters["clinic_id"]
            
            visits = await self.db.visits.find(query).to_list(10000)
            
            # حساب الإحصائيات الأساسية
            total_visits = len(visits)
            successful_visits = len([v for v in visits if v.get("effective", False)])
            success_rate = (successful_visits / total_visits * 100) if total_visits > 0 else 0
            
            # حساب متوسط الزيارات لكل مندوب
            unique_reps = set(v.get("sales_rep_id") for v in visits if v.get("sales_rep_id"))
            average_visits_per_rep = total_visits / len(unique_reps) if unique_reps else 0
            
            # تحليل الزيارات حسب الساعة
            visits_by_hour = {}
            for visit in visits:
                visit_date = visit.get("date")
                if isinstance(visit_date, datetime):
                    hour = visit_date.hour
                    if hour not in visits_by_hour:
                        visits_by_hour[hour] = 0
                    visits_by_hour[hour] += 1
            
            visits_by_hour_list = [
                {"hour": f"{hour:02d}:00", "count": count}
                for hour, count in sorted(visits_by_hour.items())
            ]
            
            # تحليل الزيارات حسب اليوم
            visits_by_day = {}
            for visit in visits:
                visit_date = visit.get("date")
                if isinstance(visit_date, datetime):
                    day_name = visit_date.strftime("%A")
                    if day_name not in visits_by_day:
                        visits_by_day[day_name] = 0
                    visits_by_day[day_name] += 1
            
            visits_by_day_list = [
                {"day": day, "count": count}
                for day, count in visits_by_day.items()
            ]
            
            # أداء المندوبين
            rep_performance = {}
            for visit in visits:
                rep_id = visit.get("sales_rep_id")
                if rep_id:
                    if rep_id not in rep_performance:
                        rep_performance[rep_id] = {
                            "rep_name": "غير محدد",  # سيتم تحديثه من قاعدة البيانات
                            "total_visits": 0,
                            "successful_visits": 0,
                            "success_rate": 0
                        }
                    
                    rep_performance[rep_id]["total_visits"] += 1
                    if visit.get("effective", False):
                        rep_performance[rep_id]["successful_visits"] += 1
            
            # حساب معدل النجاح لكل مندوب
            for rep_id, data in rep_performance.items():
                if data["total_visits"] > 0:
                    data["success_rate"] = (data["successful_visits"] / data["total_visits"]) * 100
                
                # الحصول على اسم المندوب
                rep = await self.db.users.find_one({"id": rep_id}, {"full_name": 1, "username": 1})
                if rep:
                    data["rep_name"] = rep.get("full_name", rep.get("username", "غير محدد"))
            
            rep_performance_list = [
                {"rep_id": k, **v} for k, v in rep_performance.items()
            ]
            rep_performance_list.sort(key=lambda x: x["success_rate"], reverse=True)
            
            # تغطية العيادات
            clinic_coverage = {}
            for visit in visits:
                clinic_id = visit.get("clinic_id")
                if clinic_id:
                    if clinic_id not in clinic_coverage:
                        clinic_coverage[clinic_id] = {
                            "clinic_name": visit.get("clinic_name", "غير محدد"),
                            "visit_count": 0,
                            "last_visit": None
                        }
                    
                    clinic_coverage[clinic_id]["visit_count"] += 1
                    visit_date = visit.get("date")
                    if visit_date and (not clinic_coverage[clinic_id]["last_visit"] or visit_date > clinic_coverage[clinic_id]["last_visit"]):
                        clinic_coverage[clinic_id]["last_visit"] = visit_date
            
            clinic_coverage_list = [
                {"clinic_id": k, **v} for k, v in clinic_coverage.items()
            ]
            clinic_coverage_list.sort(key=lambda x: x["visit_count"], reverse=True)
            
            return VisitAnalytics(
                total_visits=total_visits,
                successful_visits=successful_visits,
                success_rate=success_rate,
                average_visits_per_rep=average_visits_per_rep,
                visits_by_hour=visits_by_hour_list,
                visits_by_day=visits_by_day_list,
                visits_by_month=[],  # يمكن تطويرها
                rep_performance=rep_performance_list[:10],
                clinic_coverage=clinic_coverage_list[:20]
            )
            
        except Exception as e:
            self.logger.error(f"Error generating visit analytics: {e}")
            return VisitAnalytics()

    async def generate_performance_dashboard(self, user_id: str, time_range: TimeRange) -> PerformanceDashboard:
        """إنشاء لوحة أداء شخصية"""
        try:
            start_date, end_date = self._get_time_range(time_range)
            
            # الحصول على معلومات المستخدم
            user = await self.db.users.find_one({"id": user_id})
            user_role = user.get("role", "") if user else ""
            
            metrics = []
            
            if user_role in ["medical_rep", "key_account"]:
                # مقاييس المندوب الطبي
                
                # الزيارات
                my_visits = await self.db.visits.count_documents({
                    "sales_rep_id": user_id,
                    "date": {"$gte": start_date, "$lte": end_date}
                })
                
                successful_visits = await self.db.visits.count_documents({
                    "sales_rep_id": user_id,
                    "date": {"$gte": start_date, "$lte": end_date},
                    "effective": True
                })
                
                success_rate = (successful_visits / my_visits * 100) if my_visits > 0 else 0
                
                # الطلبات
                my_orders = await self.db.orders.count_documents({
                    "medical_rep_id": user_id,
                    "created_at": {"$gte": start_date, "$lte": end_date}
                })
                
                # قيمة المبيعات
                sales_pipeline = self.db.orders.aggregate([
                    {
                        "$match": {
                            "medical_rep_id": user_id,
                            "created_at": {"$gte": start_date, "$lte": end_date}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "total_sales": {"$sum": "$total_amount"}
                        }
                    }
                ])
                
                sales_result = await sales_pipeline.to_list(1)
                total_sales = sales_result[0]["total_sales"] if sales_result else 0
                
                # العيادات المخصصة
                my_clinics = await self.db.clinics.count_documents({"assigned_rep_id": user_id})
                
                metrics = [
                    PerformanceMetric(
                        name="الزيارات هذا الشهر",
                        value=my_visits,
                        unit="زيارة",
                        category="productivity"
                    ),
                    PerformanceMetric(
                        name="معدل نجاح الزيارات",
                        value=success_rate,
                        unit="%",
                        target=75.0,
                        trend="up" if success_rate >= 75 else "down",
                        category="effectiveness"
                    ),
                    PerformanceMetric(
                        name="الطلبات المحققة",
                        value=my_orders,
                        unit="طلب",
                        category="sales"
                    ),
                    PerformanceMetric(
                        name="قيمة المبيعات",
                        value=total_sales,
                        unit="ج.م",
                        category="revenue"
                    ),
                    PerformanceMetric(
                        name="العيادات المخصصة",
                        value=my_clinics,
                        unit="عيادة",
                        category="coverage"
                    )
                ]
                
            elif user_role in ["admin", "gm", "manager"]:
                # مقاييس الإدارة
                
                # إحصائيات عامة
                total_visits = await self.db.visits.count_documents({
                    "date": {"$gte": start_date, "$lte": end_date}
                })
                
                total_orders = await self.db.orders.count_documents({
                    "created_at": {"$gte": start_date, "$lte": end_date}
                })
                
                # إجمالي المبيعات
                sales_pipeline = self.db.orders.aggregate([
                    {
                        "$match": {
                            "created_at": {"$gte": start_date, "$lte": end_date}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "total_sales": {"$sum": "$total_amount"}
                        }
                    }
                ])
                
                sales_result = await sales_pipeline.to_list(1)
                total_sales = sales_result[0]["total_sales"] if sales_result else 0
                
                # المندوبين النشطين
                active_reps = await self.db.users.count_documents({
                    "role": {"$in": ["medical_rep", "key_account"]},
                    "is_active": True
                })
                
                # العيادات النشطة
                active_clinics = await self.db.clinics.count_documents({"is_active": True})
                
                metrics = [
                    PerformanceMetric(
                        name="إجمالي الزيارات",
                        value=total_visits,
                        unit="زيارة",
                        category="operations"
                    ),
                    PerformanceMetric(
                        name="إجمالي الطلبات",
                        value=total_orders,
                        unit="طلب",
                        category="sales"
                    ),
                    PerformanceMetric(
                        name="إجمالي المبيعات",
                        value=total_sales,
                        unit="ج.م",
                        category="revenue"
                    ),
                    PerformanceMetric(
                        name="المندوبين النشطين",
                        value=active_reps,
                        unit="مندوب",
                        category="team"
                    ),
                    PerformanceMetric(
                        name="العيادات النشطة",
                        value=active_clinics,
                        unit="عيادة",
                        category="coverage"
                    )
                ]
            
            return PerformanceDashboard(
                title=f"لوحة أداء {user.get('full_name', user.get('username', 'المستخدم')) if user else 'المستخدم'}",
                metrics=metrics,
                period=self._get_period_description(time_range)
            )
            
        except Exception as e:
            self.logger.error(f"Error generating performance dashboard: {e}")
            return PerformanceDashboard(title="لوحة الأداء", metrics=[], period="غير محدد")

    async def create_chart_config(self, chart_type: ChartType, title: str, data: List[Dict[str, Any]], **kwargs) -> ChartConfig:
        """إنشاء إعدادات الرسم البياني"""
        try:
            series = []
            
            if chart_type == ChartType.PIE:
                # رسم دائري
                chart_data = [
                    ChartDataPoint(
                        x=item.get("label", "غير محدد"),
                        y=item.get("value", 0),
                        label=item.get("label", "غير محدد")
                    )
                    for item in data
                ]
                series.append(ChartSeries(name=title, data=chart_data))
                
            elif chart_type == ChartType.BAR:
                # أعمدة بيانية
                chart_data = [
                    ChartDataPoint(
                        x=item.get("label", "غير محدد"),
                        y=item.get("value", 0)
                    )
                    for item in data
                ]
                series.append(ChartSeries(name=title, data=chart_data))
                
            elif chart_type == ChartType.LINE:
                # خط بياني
                chart_data = [
                    ChartDataPoint(
                        x=item.get("date", item.get("label", "غير محدد")),
                        y=item.get("value", 0)
                    )
                    for item in data
                ]
                series.append(ChartSeries(name=title, data=chart_data))
            
            return ChartConfig(
                title=title,
                type=chart_type,
                series=series,
                x_axis_title=kwargs.get("x_axis_title"),
                y_axis_title=kwargs.get("y_axis_title"),
                height=kwargs.get("height", 400)
            )
            
        except Exception as e:
            self.logger.error(f"Error creating chart config: {e}")
            return ChartConfig(title=title, type=chart_type, series=[])

    async def export_analytics_report(self, report_request: ReportRequest, user_id: str) -> GeneratedReport:
        """تصدير تقرير التحليلات"""
        try:
            # إنشاء البيانات حسب نوع التقرير
            report_data = {}
            
            if report_request.type == ReportType.SALES_PERFORMANCE:
                report_data = await self.generate_sales_analytics(
                    report_request.time_range,
                    report_request.filters
                )
            elif report_request.type == ReportType.VISIT_ANALYTICS:
                report_data = await self.generate_visit_analytics(
                    report_request.time_range,
                    report_request.filters
                )
            
            # إنشاء معرف التقرير
            report_id = str(uuid.uuid4())
            
            # حفظ بيانات التقرير (مؤقتاً كـ JSON)
            report_file = {
                "id": report_id,
                "title": report_request.title,
                "type": report_request.type,
                "data": report_data.dict() if hasattr(report_data, 'dict') else report_data,
                "generated_at": datetime.utcnow(),
                "generated_by": user_id
            }
            
            # حفظ في قاعدة البيانات
            await self.db.generated_reports.insert_one(report_file)
            
            return GeneratedReport(
                id=report_id,
                title=report_request.title,
                type=report_request.type,
                generated_by=user_id,
                file_path=f"/reports/{report_id}.json",
                metadata={"format": report_request.format}
            )
            
        except Exception as e:
            self.logger.error(f"Error exporting analytics report: {e}")
            raise

    # Helper Methods
    def _get_time_range(self, time_range: TimeRange) -> Tuple[datetime, datetime]:
        """الحصول على نطاق التاريخ"""
        now = datetime.utcnow()
        
        if time_range == TimeRange.TODAY:
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif time_range == TimeRange.YESTERDAY:
            yesterday = now - timedelta(days=1)
            start = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
            end = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif time_range == TimeRange.THIS_WEEK:
            start = now - timedelta(days=now.weekday())
            start = start.replace(hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif time_range == TimeRange.THIS_MONTH:
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        elif time_range == TimeRange.LAST_MONTH:
            first_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = first_this_month - timedelta(seconds=1)
            start = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        elif time_range == TimeRange.THIS_YEAR:
            start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        else:
            # Default to this month
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = now
        
        return start, end

    def _get_previous_period(self, start_date: datetime, end_date: datetime) -> Tuple[datetime, datetime]:
        """الحصول على الفترة السابقة للمقارنة"""
        period_length = end_date - start_date
        prev_end = start_date - timedelta(seconds=1)
        prev_start = prev_end - period_length
        return prev_start, prev_end

    def _get_period_description(self, time_range: TimeRange) -> str:
        """وصف الفترة الزمنية"""
        descriptions = {
            TimeRange.TODAY: "اليوم",
            TimeRange.YESTERDAY: "أمس",
            TimeRange.THIS_WEEK: "هذا الأسبوع",
            TimeRange.LAST_WEEK: "الأسبوع الماضي",
            TimeRange.THIS_MONTH: "هذا الشهر",
            TimeRange.LAST_MONTH: "الشهر الماضي",
            TimeRange.THIS_QUARTER: "هذا الربع",
            TimeRange.LAST_QUARTER: "الربع الماضي",
            TimeRange.THIS_YEAR: "هذا العام",
            TimeRange.LAST_YEAR: "العام الماضي"
        }
        return descriptions.get(time_range, "فترة مخصصة")

    async def get_real_time_metrics(self) -> List[RealTimeMetric]:
        """الحصول على المقاييس الفورية"""
        try:
            metrics = []
            now = datetime.utcnow()
            
            # عدد المستخدمين المتصلين (تقريبي)
            online_users = await self.db.users.count_documents({
                "last_login": {"$gte": now - timedelta(minutes=30)}
            })
            
            metrics.append(RealTimeMetric(
                name="المستخدمين المتصلين",
                value=online_users,
                source="user_sessions"
            ))
            
            # الطلبات اليوم
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            today_orders = await self.db.orders.count_documents({
                "created_at": {"$gte": today_start}
            })
            
            metrics.append(RealTimeMetric(
                name="طلبات اليوم",
                value=today_orders,
                source="orders"
            ))
            
            # الزيارات اليوم
            today_visits = await self.db.visits.count_documents({
                "date": {"$gte": today_start}
            })
            
            metrics.append(RealTimeMetric(
                name="زيارات اليوم",
                value=today_visits,
                source="visits"
            ))
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Error getting real-time metrics: {e}")
            return []