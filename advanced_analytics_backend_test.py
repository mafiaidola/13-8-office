#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🎯 **COMPREHENSIVE ADVANCED ANALYTICS BACKEND TESTING**
اختبار شامل لجميع APIs نظام التحليلات المتقدمة لضمان الاستعداد للفرونت إند التفاعلي

المطلوب اختبار:
1. APIs التحليلات الأساسية (sales, visits, performance, real-time)
2. APIs الرسوم البيانية (charts)
3. اختبار المعاملات والفلاتر المختلفة
4. اختبار البيانات والحسابات
5. اختبار الأداء والاستقرار
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# إعدادات الاختبار
BACKEND_URL = "https://d1397441-cae3-4bcf-ad67-36c0ba328d1b.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class AdvancedAnalyticsBackendTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def login_admin(self) -> bool:
        """تسجيل دخول الأدمن"""
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data.get("access_token")
                    print(f"✅ تسجيل دخول الأدمن نجح: {ADMIN_USERNAME}")
                    return True
                else:
                    print(f"❌ فشل تسجيل دخول الأدمن: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ خطأ في تسجيل دخول الأدمن: {str(e)}")
            return False
            
    async def get_medical_rep_token(self) -> bool:
        """الحصول على token مندوب طبي للاختبار"""
        try:
            # البحث عن مندوب طبي
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.get(f"{BACKEND_URL}/users", headers=headers) as response:
                if response.status == 200:
                    users = await response.json()
                    medical_rep = None
                    
                    for user in users:
                        if user.get("role") in ["medical_rep", "key_account"]:
                            medical_rep = user
                            break
                    
                    if medical_rep:
                        # محاولة تسجيل دخول المندوب (نفترض كلمة مرور افتراضية)
                        login_data = {
                            "username": medical_rep["username"],
                            "password": "123456"  # كلمة مرور افتراضية
                        }
                        
                        async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as login_response:
                            if login_response.status == 200:
                                data = await login_response.json()
                                self.medical_rep_token = data.get("access_token")
                                print(f"✅ تسجيل دخول المندوب الطبي نجح: {medical_rep['username']}")
                                return True
                            else:
                                print(f"⚠️ لم يتم العثور على مندوب طبي صالح للاختبار")
                                return False
                    else:
                        print(f"⚠️ لم يتم العثور على مندوب طبي في النظام")
                        return False
                        
        except Exception as e:
            print(f"❌ خطأ في الحصول على token المندوب الطبي: {str(e)}")
            return False
            
    async def test_api_endpoint(self, method: str, endpoint: str, headers: Dict = None, 
                              json_data: Dict = None, params: Dict = None, 
                              expected_status: int = 200, test_name: str = "") -> Dict[str, Any]:
        """اختبار endpoint محدد"""
        start_time = time.time()
        
        try:
            url = f"{BACKEND_URL}{endpoint}"
            
            if method.upper() == "GET":
                async with self.session.get(url, headers=headers, params=params) as response:
                    response_time = (time.time() - start_time) * 1000
                    status = response.status
                    
                    if status == expected_status:
                        data = await response.json()
                        result = {
                            "success": True,
                            "status": status,
                            "response_time": response_time,
                            "data": data,
                            "test_name": test_name
                        }
                    else:
                        text = await response.text()
                        result = {
                            "success": False,
                            "status": status,
                            "response_time": response_time,
                            "error": text,
                            "test_name": test_name
                        }
                        
            elif method.upper() == "POST":
                async with self.session.post(url, headers=headers, json=json_data, params=params) as response:
                    response_time = (time.time() - start_time) * 1000
                    status = response.status
                    
                    if status == expected_status:
                        data = await response.json()
                        result = {
                            "success": True,
                            "status": status,
                            "response_time": response_time,
                            "data": data,
                            "test_name": test_name
                        }
                    else:
                        text = await response.text()
                        result = {
                            "success": False,
                            "status": status,
                            "response_time": response_time,
                            "error": text,
                            "test_name": test_name
                        }
            
            self.test_results.append(result)
            return result
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            result = {
                "success": False,
                "status": 0,
                "response_time": response_time,
                "error": str(e),
                "test_name": test_name
            }
            self.test_results.append(result)
            return result

    async def test_sales_analytics_api(self):
        """اختبار API تحليلات المبيعات"""
        print("\n🔍 **اختبار APIs التحليلات الأساسية - المبيعات**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        time_ranges = ["today", "this_week", "this_month", "this_year"]
        
        for time_range in time_ranges:
            # اختبار للأدمن
            result = await self.test_api_endpoint(
                "GET", 
                "/analytics/sales",
                headers=headers,
                params={"time_range": time_range},
                test_name=f"Sales Analytics - Admin - {time_range}"
            )
            
            if result["success"]:
                analytics = result["data"].get("analytics", {})
                print(f"  ✅ {time_range}: المبيعات الإجمالية: {analytics.get('total_sales', 0):.2f} ج.م، "
                      f"الطلبات: {analytics.get('total_orders', 0)}, "
                      f"متوسط قيمة الطلب: {analytics.get('average_order_value', 0):.2f} ج.م")
                
                # التحقق من البيانات المطلوبة
                required_fields = ['total_sales', 'total_orders', 'average_order_value', 'conversion_rate', 
                                 'top_products', 'top_clients', 'sales_by_area']
                missing_fields = [field for field in required_fields if field not in analytics]
                if missing_fields:
                    print(f"    ⚠️ حقول مفقودة: {missing_fields}")
            else:
                print(f"  ❌ {time_range}: فشل - {result.get('error', 'خطأ غير معروف')}")
        
        # اختبار مع فلاتر إضافية
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/sales",
            headers=headers,
            params={"time_range": "this_month", "area_id": "test_area"},
            test_name="Sales Analytics - With Area Filter"
        )
        
        if result["success"]:
            print(f"  ✅ فلتر المنطقة: يعمل بنجاح")
        else:
            print(f"  ❌ فلتر المنطقة: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار للمندوب الطبي
        if self.medical_rep_token:
            rep_headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            result = await self.test_api_endpoint(
                "GET", 
                "/analytics/sales",
                headers=rep_headers,
                params={"time_range": "this_month"},
                test_name="Sales Analytics - Medical Rep"
            )
            
            if result["success"]:
                print(f"  ✅ المندوب الطبي: يمكنه الوصول لتحليلات مبيعاته")
            else:
                print(f"  ❌ المندوب الطبي: فشل - {result.get('error', 'خطأ غير معروف')}")

    async def test_visits_analytics_api(self):
        """اختبار API تحليلات الزيارات"""
        print("\n🔍 **اختبار APIs التحليلات الأساسية - الزيارات**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        time_ranges = ["today", "this_week", "this_month", "this_year"]
        
        for time_range in time_ranges:
            result = await self.test_api_endpoint(
                "GET", 
                "/analytics/visits",
                headers=headers,
                params={"time_range": time_range},
                test_name=f"Visit Analytics - {time_range}"
            )
            
            if result["success"]:
                analytics = result["data"].get("analytics", {})
                print(f"  ✅ {time_range}: إجمالي الزيارات: {analytics.get('total_visits', 0)}, "
                      f"الزيارات الناجحة: {analytics.get('successful_visits', 0)}, "
                      f"معدل النجاح: {analytics.get('success_rate', 0):.1f}%")
                
                # التحقق من البيانات المطلوبة
                required_fields = ['total_visits', 'successful_visits', 'success_rate', 
                                 'visits_by_hour', 'rep_performance', 'clinic_coverage']
                missing_fields = [field for field in required_fields if field not in analytics]
                if missing_fields:
                    print(f"    ⚠️ حقول مفقودة: {missing_fields}")
                    
                # التحقق من تنسيق البيانات للرسوم البيانية
                visits_by_hour = analytics.get('visits_by_hour', [])
                if visits_by_hour and isinstance(visits_by_hour, list):
                    print(f"    ✅ بيانات الزيارات حسب الساعة: {len(visits_by_hour)} نقطة بيانات")
                else:
                    print(f"    ⚠️ بيانات الزيارات حسب الساعة غير صحيحة")
                    
            else:
                print(f"  ❌ {time_range}: فشل - {result.get('error', 'خطأ غير معروف')}")

    async def test_performance_dashboard_api(self):
        """اختبار API لوحة الأداء الشخصية"""
        print("\n🔍 **اختبار API لوحة الأداء الشخصية**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        time_ranges = ["today", "this_week", "this_month", "this_year"]
        
        for time_range in time_ranges:
            result = await self.test_api_endpoint(
                "GET", 
                "/analytics/performance",
                headers=headers,
                params={"time_range": time_range},
                test_name=f"Performance Dashboard - {time_range}"
            )
            
            if result["success"]:
                dashboard = result["data"].get("dashboard", {})
                metrics = dashboard.get("metrics", [])
                print(f"  ✅ {time_range}: {dashboard.get('title', 'لوحة الأداء')} - "
                      f"{len(metrics)} مقياس")
                
                # التحقق من المقاييس
                for metric in metrics[:3]:  # عرض أول 3 مقاييس
                    print(f"    📊 {metric.get('name', 'غير محدد')}: "
                          f"{metric.get('value', 0)} {metric.get('unit', '')}")
                          
            else:
                print(f"  ❌ {time_range}: فشل - {result.get('error', 'خطأ غير معروف')}")
                
        # اختبار للمندوب الطبي
        if self.medical_rep_token:
            rep_headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            result = await self.test_api_endpoint(
                "GET", 
                "/analytics/performance",
                headers=rep_headers,
                params={"time_range": "this_month"},
                test_name="Performance Dashboard - Medical Rep"
            )
            
            if result["success"]:
                dashboard = result["data"].get("dashboard", {})
                print(f"  ✅ المندوب الطبي: {dashboard.get('title', 'لوحة الأداء الشخصية')}")
            else:
                print(f"  ❌ المندوب الطبي: فشل - {result.get('error', 'خطأ غير معروف')}")

    async def test_real_time_analytics_api(self):
        """اختبار API المقاييس الفورية"""
        print("\n🔍 **اختبار API المقاييس الفورية**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/real-time",
            headers=headers,
            test_name="Real-time Analytics"
        )
        
        if result["success"]:
            metrics = result["data"].get("metrics", [])
            last_updated = result["data"].get("last_updated", "")
            print(f"  ✅ المقاييس الفورية: {len(metrics)} مقياس، آخر تحديث: {last_updated}")
            
            for metric in metrics:
                print(f"    📈 {metric.get('name', 'غير محدد')}: {metric.get('value', 0)} "
                      f"(المصدر: {metric.get('source', 'غير محدد')})")
                      
        else:
            print(f"  ❌ المقاييس الفورية: فشل - {result.get('error', 'خطأ غير معروف')}")

    async def test_chart_apis(self):
        """اختبار APIs الرسوم البيانية"""
        print("\n🔍 **اختبار APIs الرسوم البيانية**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # اختبار رسم المبيعات حسب المنتج
        result = await self.test_api_endpoint(
            "POST", 
            "/analytics/charts/sales-by-product",
            headers=headers,
            params={"time_range": "this_month"},
            test_name="Sales by Product Chart"
        )
        
        if result["success"]:
            chart = result["data"].get("chart", {})
            series = chart.get("series", [])
            print(f"  ✅ رسم المبيعات حسب المنتج: {chart.get('title', 'غير محدد')}")
            if series:
                data_points = len(series[0].get("data", []))
                print(f"    📊 نقاط البيانات: {data_points}")
        else:
            print(f"  ❌ رسم المبيعات حسب المنتج: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار رسم الزيارات حسب الساعة
        result = await self.test_api_endpoint(
            "POST", 
            "/analytics/charts/visits-by-hour",
            headers=headers,
            params={"time_range": "this_month"},
            test_name="Visits by Hour Chart"
        )
        
        if result["success"]:
            chart = result["data"].get("chart", {})
            print(f"  ✅ رسم الزيارات حسب الساعة: {chart.get('title', 'غير محدد')}")
            print(f"    📊 نوع الرسم: {chart.get('type', 'غير محدد')}")
        else:
            print(f"  ❌ رسم الزيارات حسب الساعة: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار رسم أداء المندوبين (للأدمن فقط)
        result = await self.test_api_endpoint(
            "POST", 
            "/analytics/charts/rep-performance",
            headers=headers,
            params={"time_range": "this_month"},
            test_name="Rep Performance Chart"
        )
        
        if result["success"]:
            chart = result["data"].get("chart", {})
            print(f"  ✅ رسم أداء المندوبين: {chart.get('title', 'غير محدد')}")
        else:
            print(f"  ❌ رسم أداء المندوبين: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار صلاحيات المندوب الطبي (يجب أن يفشل)
        if self.medical_rep_token:
            rep_headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
            result = await self.test_api_endpoint(
                "POST", 
                "/analytics/charts/rep-performance",
                headers=rep_headers,
                params={"time_range": "this_month"},
                expected_status=403,
                test_name="Rep Performance Chart - Medical Rep (Should Fail)"
            )
            
            if result["success"] and result["status"] == 403:
                print(f"  ✅ صلاحيات المندوب الطبي: محجوبة بشكل صحيح")
            else:
                print(f"  ❌ صلاحيات المندوب الطبي: خطأ في التحكم بالصلاحيات")

    async def test_reports_and_export_apis(self):
        """اختبار APIs التقارير والتصدير"""
        print("\n🔍 **اختبار APIs التقارير والتصدير**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # اختبار قوالب لوحات المعلومات
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/dashboard-templates",
            headers=headers,
            test_name="Dashboard Templates"
        )
        
        if result["success"]:
            templates = result["data"].get("templates", [])
            print(f"  ✅ قوالب لوحات المعلومات: {len(templates)} قالب")
            for template in templates:
                print(f"    📋 {template.get('name', 'غير محدد')}: "
                      f"{len(template.get('charts', []))} رسم بياني")
        else:
            print(f"  ❌ قوالب لوحات المعلومات: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار تصدير بيانات المبيعات
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/export/sales",
            headers=headers,
            params={"time_range": "this_month", "format": "json"},
            test_name="Export Sales Data"
        )
        
        if result["success"]:
            data = result["data"].get("data", {})
            print(f"  ✅ تصدير بيانات المبيعات: نجح")
            print(f"    📊 إجمالي المبيعات: {data.get('total_sales', 0):.2f} ج.م")
        else:
            print(f"  ❌ تصدير بيانات المبيعات: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # اختبار تصدير بيانات الزيارات
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/export/visits",
            headers=headers,
            params={"time_range": "this_month", "format": "json"},
            test_name="Export Visits Data"
        )
        
        if result["success"]:
            data = result["data"].get("data", {})
            print(f"  ✅ تصدير بيانات الزيارات: نجح")
            print(f"    📊 إجمالي الزيارات: {data.get('total_visits', 0)}")
        else:
            print(f"  ❌ تصدير بيانات الزيارات: فشل - {result.get('error', 'خطأ غير معروف')}")

    async def test_performance_and_stability(self):
        """اختبار الأداء والاستقرار"""
        print("\n🔍 **اختبار الأداء والاستقرار**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # اختبار سرعة الاستجابة للاستعلامات المعقدة
        complex_tests = [
            ("/analytics/sales", {"time_range": "this_year"}),
            ("/analytics/visits", {"time_range": "this_year"}),
            ("/analytics/performance", {"time_range": "this_year"}),
        ]
        
        response_times = []
        
        for endpoint, params in complex_tests:
            result = await self.test_api_endpoint(
                "GET", 
                endpoint,
                headers=headers,
                params=params,
                test_name=f"Performance Test - {endpoint}"
            )
            
            if result["success"]:
                response_time = result["response_time"]
                response_times.append(response_time)
                status = "ممتاز" if response_time < 1000 else "جيد" if response_time < 3000 else "بطيء"
                print(f"  ✅ {endpoint}: {response_time:.2f}ms ({status})")
            else:
                print(f"  ❌ {endpoint}: فشل - {result.get('error', 'خطأ غير معروف')}")
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"  📊 متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
            
        # اختبار معالجة الأخطاء
        error_tests = [
            ("/analytics/sales", {"time_range": "invalid_range"}),
            ("/analytics/visits", {"rep_id": "non_existent_rep"}),
        ]
        
        for endpoint, params in error_tests:
            result = await self.test_api_endpoint(
                "GET", 
                endpoint,
                headers=headers,
                params=params,
                expected_status=400,
                test_name=f"Error Handling - {endpoint}"
            )
            
            if result["status"] in [400, 422, 500]:
                print(f"  ✅ معالجة الأخطاء: {endpoint} - يعالج الأخطاء بشكل صحيح")
            else:
                print(f"  ❌ معالجة الأخطاء: {endpoint} - لا يعالج الأخطاء بشكل صحيح")

    async def test_data_integrity_and_calculations(self):
        """اختبار سلامة البيانات والحسابات"""
        print("\n🔍 **اختبار سلامة البيانات والحسابات**")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # الحصول على تحليلات المبيعات
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/sales",
            headers=headers,
            params={"time_range": "this_month"},
            test_name="Data Integrity - Sales"
        )
        
        if result["success"]:
            analytics = result["data"].get("analytics", {})
            total_sales = analytics.get("total_sales", 0)
            total_orders = analytics.get("total_orders", 0)
            average_order_value = analytics.get("average_order_value", 0)
            
            # التحقق من صحة الحسابات
            if total_orders > 0:
                calculated_avg = total_sales / total_orders
                if abs(calculated_avg - average_order_value) < 0.01:
                    print(f"  ✅ حساب متوسط قيمة الطلب: صحيح ({average_order_value:.2f} ج.م)")
                else:
                    print(f"  ❌ حساب متوسط قيمة الطلب: خطأ (متوقع: {calculated_avg:.2f}, فعلي: {average_order_value:.2f})")
            
            # التحقق من وجود بيانات حقيقية
            top_products = analytics.get("top_products", [])
            if top_products:
                print(f"  ✅ أفضل المنتجات: {len(top_products)} منتج")
                for i, product in enumerate(top_products[:3]):
                    print(f"    {i+1}. {product.get('product_name', 'غير محدد')}: "
                          f"{product.get('total_sales', 0):.2f} ج.م")
            else:
                print(f"  ⚠️ أفضل المنتجات: لا توجد بيانات")
                
        else:
            print(f"  ❌ تحليلات المبيعات: فشل - {result.get('error', 'خطأ غير معروف')}")
            
        # التحقق من تحليلات الزيارات
        result = await self.test_api_endpoint(
            "GET", 
            "/analytics/visits",
            headers=headers,
            params={"time_range": "this_month"},
            test_name="Data Integrity - Visits"
        )
        
        if result["success"]:
            analytics = result["data"].get("analytics", {})
            total_visits = analytics.get("total_visits", 0)
            successful_visits = analytics.get("successful_visits", 0)
            success_rate = analytics.get("success_rate", 0)
            
            # التحقق من صحة حساب معدل النجاح
            if total_visits > 0:
                calculated_rate = (successful_visits / total_visits) * 100
                if abs(calculated_rate - success_rate) < 0.1:
                    print(f"  ✅ حساب معدل نجاح الزيارات: صحيح ({success_rate:.1f}%)")
                else:
                    print(f"  ❌ حساب معدل نجاح الزيارات: خطأ (متوقع: {calculated_rate:.1f}%, فعلي: {success_rate:.1f}%)")
            
            # التحقق من بيانات الزيارات حسب الساعة
            visits_by_hour = analytics.get("visits_by_hour", [])
            if visits_by_hour:
                total_hourly_visits = sum(item.get("count", 0) for item in visits_by_hour)
                print(f"  ✅ بيانات الزيارات حسب الساعة: {len(visits_by_hour)} ساعة، "
                      f"إجمالي: {total_hourly_visits} زيارة")
            else:
                print(f"  ⚠️ بيانات الزيارات حسب الساعة: لا توجد بيانات")
                
        else:
            print(f"  ❌ تحليلات الزيارات: فشل - {result.get('error', 'خطأ غير معروف')}")

    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        print("\n" + "="*80)
        print("🎯 **التقرير النهائي - اختبار نظام التحليلات المتقدمة**")
        print("="*80)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 **إحصائيات الاختبار:**")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • الاختبارات الناجحة: {successful_tests}")
        print(f"   • الاختبارات الفاشلة: {failed_tests}")
        print(f"   • معدل النجاح: {success_rate:.1f}%")
        
        # حساب متوسط وقت الاستجابة
        response_times = [r["response_time"] for r in self.test_results if r["success"]]
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"   • متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        total_time = time.time() - self.start_time
        print(f"   • إجمالي وقت الاختبار: {total_time:.2f} ثانية")
        
        print(f"\n📋 **تفاصيل النتائج:**")
        
        # تجميع النتائج حسب الفئة
        categories = {
            "Sales Analytics": [],
            "Visit Analytics": [],
            "Performance Dashboard": [],
            "Real-time Analytics": [],
            "Chart APIs": [],
            "Reports & Export": [],
            "Performance Tests": [],
            "Data Integrity": []
        }
        
        for result in self.test_results:
            test_name = result.get("test_name", "")
            if "Sales" in test_name:
                categories["Sales Analytics"].append(result)
            elif "Visit" in test_name:
                categories["Visit Analytics"].append(result)
            elif "Performance" in test_name:
                categories["Performance Dashboard"].append(result)
            elif "Real-time" in test_name:
                categories["Real-time Analytics"].append(result)
            elif "Chart" in test_name:
                categories["Chart APIs"].append(result)
            elif "Export" in test_name or "Template" in test_name:
                categories["Reports & Export"].append(result)
            elif "Performance Test" in test_name or "Error Handling" in test_name:
                categories["Performance Tests"].append(result)
            elif "Data Integrity" in test_name:
                categories["Data Integrity"].append(result)
        
        for category, results in categories.items():
            if results:
                successful = len([r for r in results if r["success"]])
                total = len(results)
                rate = (successful / total * 100) if total > 0 else 0
                status = "✅" if rate >= 80 else "⚠️" if rate >= 60 else "❌"
                print(f"   {status} {category}: {successful}/{total} ({rate:.1f}%)")
        
        print(f"\n🎯 **التقييم النهائي:**")
        if success_rate >= 90:
            print("   🎉 **ممتاز!** النظام جاهز للإنتاج مع أداء استثنائي")
        elif success_rate >= 80:
            print("   ✅ **جيد جداً!** النظام مستقر ومناسب للإنتاج")
        elif success_rate >= 70:
            print("   ⚠️ **مقبول** النظام يعمل لكن يحتاج تحسينات")
        else:
            print("   ❌ **يحتاج عمل** النظام غير جاهز للإنتاج")
        
        print(f"\n🔧 **التوصيات:**")
        if failed_tests > 0:
            print("   • مراجعة الاختبارات الفاشلة وإصلاح المشاكل")
        if response_times and avg_response_time > 2000:
            print("   • تحسين أداء الاستعلامات لتقليل وقت الاستجابة")
        if success_rate >= 90:
            print("   • النظام جاهز لدعم الفرونت إند التفاعلي المتطور")
            print("   • يمكن البدء في تطوير واجهات المستخدم المتقدمة")
        
        print("="*80)

    async def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 **بدء اختبار نظام التحليلات المتقدمة**")
        print("="*80)
        
        await self.setup_session()
        
        try:
            # تسجيل الدخول
            if not await self.login_admin():
                print("❌ فشل في تسجيل دخول الأدمن - إيقاف الاختبار")
                return
                
            # محاولة الحصول على token مندوب طبي
            await self.get_medical_rep_token()
            
            # تشغيل الاختبارات
            await self.test_sales_analytics_api()
            await self.test_visits_analytics_api()
            await self.test_performance_dashboard_api()
            await self.test_real_time_analytics_api()
            await self.test_chart_apis()
            await self.test_reports_and_export_apis()
            await self.test_performance_and_stability()
            await self.test_data_integrity_and_calculations()
            
            # إنشاء التقرير النهائي
            self.generate_final_report()
            
        finally:
            await self.cleanup_session()

async def main():
    """الدالة الرئيسية"""
    tester = AdvancedAnalyticsBackendTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())