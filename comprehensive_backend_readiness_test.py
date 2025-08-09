#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار شامل للباكند للتأكد من استعداده لدعم الميزات الجديدة المطلوبة
Comprehensive Backend Readiness Test for New Features Support

المتطلبات المحددة:
1. اختبار APIs الأساسية (Users, Clinics, Products, Orders, Visits)
2. اختبار الداشبورد والإحصائيات مع مرشحات الوقت
3. اختبار نظام التتبع والخريطة التفاعلية
4. اختبار نظام الزيارات المحسن
5. اختبار نظام الديون والتحصيل
6. فحص دعم الفلاتر
7. اختبار التكامل
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# Configuration
BACKEND_URL = "https://0c7671be-0c51-4a84-bbb3-9b77f9ff726f.preview.emergentagent.com/api"
TEST_ADMIN_USERNAME = "admin"
TEST_ADMIN_PASSWORD = "admin123"

class BackendReadinessTest:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'Content-Type': 'application/json'}
        )
    
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
    
    async def authenticate(self) -> bool:
        """تسجيل الدخول والحصول على JWT token"""
        try:
            login_data = {
                "username": TEST_ADMIN_USERNAME,
                "password": TEST_ADMIN_PASSWORD
            }
            
            start_time = time.time()
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                    
                    self.test_results.append({
                        "test": "Authentication System",
                        "status": "✅ PASS",
                        "details": f"تسجيل دخول {TEST_ADMIN_USERNAME} نجح",
                        "response_time": f"{response_time:.2f}ms",
                        "user_info": data.get("user", {})
                    })
                    return True
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Authentication System",
                        "status": "❌ FAIL",
                        "details": f"فشل تسجيل الدخول: {error_text}",
                        "response_time": f"{response_time:.2f}ms"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Authentication System",
                "status": "❌ ERROR",
                "details": f"خطأ في الاتصال: {str(e)}"
            })
            return False
    
    async def test_core_apis(self):
        """1. اختبار APIs الأساسية"""
        print("🔍 اختبار APIs الأساسية...")
        
        core_endpoints = [
            ("Users API", "/users", "إدارة المستخدمين"),
            ("Clinics API", "/clinics", "إدارة العيادات"),
            ("Products API", "/products", "إدارة المنتجات"),
            ("Orders API", "/orders", "إدارة الطلبات"),
            ("Visits API", "/visits", "إدارة الزيارات"),
            ("Lines API", "/lines", "إدارة الخطوط"),
            ("Areas API", "/areas", "إدارة المناطق"),
            ("Warehouses API", "/warehouses", "إدارة المخازن")
        ]
        
        api_results = {}
        total_records = 0
        
        for name, endpoint, description in core_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        count = len(data) if isinstance(data, list) else 1
                        total_records += count
                        
                        api_results[name] = {
                            "status": "✅ WORKING",
                            "count": count,
                            "response_time": f"{response_time:.2f}ms",
                            "description": description
                        }
                    else:
                        error_text = await response.text()
                        api_results[name] = {
                            "status": "❌ FAILED",
                            "error": error_text,
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                api_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # حساب معدل النجاح
        working_apis = sum(1 for result in api_results.values() if result["status"] == "✅ WORKING")
        success_rate = (working_apis / len(core_endpoints)) * 100
        
        self.test_results.append({
            "test": "Core APIs Testing",
            "status": "✅ COMPLETED" if success_rate >= 80 else "⚠️ PARTIAL",
            "details": f"نجح {working_apis}/{len(core_endpoints)} APIs",
            "success_rate": f"{success_rate:.1f}%",
            "total_records": total_records,
            "api_details": api_results
        })
    
    async def test_dashboard_and_statistics(self):
        """2. اختبار الداشبورد والإحصائيات مع مرشحات الوقت"""
        print("📊 اختبار الداشبورد والإحصائيات...")
        
        time_filters = ["today", "week", "month", "year"]
        dashboard_results = {}
        
        for time_filter in time_filters:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}/dashboard/stats?time_filter={time_filter}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        dashboard_results[time_filter] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "stats": {
                                "orders": data.get("orders", {}),
                                "visits": data.get("visits", {}),
                                "users": data.get("users", {}),
                                "clinics": data.get("clinics", {}),
                                "debts": data.get("debts", {}),
                                "collections": data.get("collections", {})
                            }
                        }
                    else:
                        error_text = await response.text()
                        dashboard_results[time_filter] = {
                            "status": "❌ FAILED",
                            "error": error_text,
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                dashboard_results[time_filter] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # اختبار إحصائيات إضافية
        additional_stats = [
            ("Admin Activities", "/dashboard/admin-activities"),
            ("Activity Statistics", "/dashboard/activity-statistics"),
            ("GPS Tracking", "/dashboard/gps-tracking")
        ]
        
        for name, endpoint in additional_stats:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        dashboard_results[name] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "data_count": len(data) if isinstance(data, list) else 1
                        }
                    else:
                        dashboard_results[name] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                dashboard_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        working_features = sum(1 for result in dashboard_results.values() if result["status"] == "✅ WORKING")
        total_features = len(dashboard_results)
        success_rate = (working_features / total_features) * 100
        
        self.test_results.append({
            "test": "Dashboard & Statistics Testing",
            "status": "✅ COMPLETED" if success_rate >= 75 else "⚠️ PARTIAL",
            "details": f"نجح {working_features}/{total_features} ميزة",
            "success_rate": f"{success_rate:.1f}%",
            "time_filters_support": "✅ SUPPORTED" if all(f in dashboard_results and dashboard_results[f]["status"] == "✅ WORKING" for f in time_filters) else "❌ LIMITED",
            "dashboard_details": dashboard_results
        })
    
    async def test_activity_tracking_and_maps(self):
        """3. اختبار نظام التتبع والخريطة التفاعلية"""
        print("🗺️ اختبار نظام التتبع والخريطة التفاعلية...")
        
        tracking_endpoints = [
            ("GPS Tracking Data", "/dashboard/gps-tracking"),
            ("GPS Statistics", "/dashboard/gps-statistics"),
            ("Activity Logs", "/activities"),
            ("Movement Logs", "/movement-logs")
        ]
        
        tracking_results = {}
        
        for name, endpoint in tracking_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        tracking_results[name] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "data_count": len(data) if isinstance(data, list) else 1,
                            "has_gps_data": any("latitude" in item or "longitude" in item for item in data) if isinstance(data, list) else False
                        }
                    elif response.status == 404:
                        tracking_results[name] = {
                            "status": "⚠️ NOT_IMPLEMENTED",
                            "response_time": f"{response_time:.2f}ms",
                            "note": "Endpoint not implemented yet"
                        }
                    else:
                        error_text = await response.text()
                        tracking_results[name] = {
                            "status": "❌ FAILED",
                            "error": error_text,
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                tracking_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # اختبار إنشاء نشاط جديد مع GPS
        try:
            activity_data = {
                "activity_type": "visit_registration",
                "description": "اختبار تسجيل نشاط مع GPS",
                "latitude": 30.0444,  # Cairo coordinates
                "longitude": 31.2357,
                "location_name": "القاهرة - اختبار",
                "metadata": {"test": True}
            }
            
            start_time = time.time()
            async with self.session.post(f"{BACKEND_URL}/activities", json=activity_data) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status in [200, 201]:
                    tracking_results["Activity Creation"] = {
                        "status": "✅ WORKING",
                        "response_time": f"{response_time:.2f}ms",
                        "note": "GPS activity creation successful"
                    }
                else:
                    tracking_results["Activity Creation"] = {
                        "status": "❌ FAILED",
                        "response_time": f"{response_time:.2f}ms"
                    }
                    
        except Exception as e:
            tracking_results["Activity Creation"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        working_features = sum(1 for result in tracking_results.values() if result["status"] == "✅ WORKING")
        total_features = len(tracking_results)
        success_rate = (working_features / total_features) * 100
        
        self.test_results.append({
            "test": "Activity Tracking & Interactive Maps",
            "status": "✅ COMPLETED" if success_rate >= 60 else "⚠️ PARTIAL",
            "details": f"نجح {working_features}/{total_features} ميزة",
            "success_rate": f"{success_rate:.1f}%",
            "gps_support": "✅ SUPPORTED" if any(result.get("has_gps_data") for result in tracking_results.values()) else "⚠️ LIMITED",
            "tracking_details": tracking_results
        })
    
    async def test_enhanced_visits_system(self):
        """4. اختبار نظام الزيارات المحسن"""
        print("🏥 اختبار نظام الزيارات المحسن...")
        
        visits_results = {}
        
        # اختبار جلب الزيارات
        try:
            start_time = time.time()
            async with self.session.get(f"{BACKEND_URL}/visits") as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    visits_data = await response.json()
                    visits_count = len(visits_data) if isinstance(visits_data, list) else 0
                    
                    visits_results["Visits Retrieval"] = {
                        "status": "✅ WORKING",
                        "response_time": f"{response_time:.2f}ms",
                        "visits_count": visits_count,
                        "has_enhanced_data": any("participants_details" in visit for visit in visits_data) if isinstance(visits_data, list) else False
                    }
                else:
                    visits_results["Visits Retrieval"] = {
                        "status": "❌ FAILED",
                        "response_time": f"{response_time:.2f}ms"
                    }
                    
        except Exception as e:
            visits_results["Visits Retrieval"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        # اختبار إحصائيات الزيارات
        try:
            start_time = time.time()
            async with self.session.get(f"{BACKEND_URL}/visits/statistics") as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    stats_data = await response.json()
                    visits_results["Visits Statistics"] = {
                        "status": "✅ WORKING",
                        "response_time": f"{response_time:.2f}ms",
                        "statistics": stats_data
                    }
                elif response.status == 404:
                    visits_results["Visits Statistics"] = {
                        "status": "⚠️ NOT_IMPLEMENTED",
                        "response_time": f"{response_time:.2f}ms"
                    }
                else:
                    visits_results["Visits Statistics"] = {
                        "status": "❌ FAILED",
                        "response_time": f"{response_time:.2f}ms"
                    }
                    
        except Exception as e:
            visits_results["Visits Statistics"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        # اختبار تصدير الزيارات
        export_formats = ["pdf", "excel"]
        for format_type in export_formats:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}/visits/export/{format_type}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        visits_results[f"Export {format_type.upper()}"] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    elif response.status == 404:
                        visits_results[f"Export {format_type.upper()}"] = {
                            "status": "⚠️ NOT_IMPLEMENTED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    else:
                        visits_results[f"Export {format_type.upper()}"] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                visits_results[f"Export {format_type.upper()}"] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        working_features = sum(1 for result in visits_results.values() if result["status"] == "✅ WORKING")
        total_features = len(visits_results)
        success_rate = (working_features / total_features) * 100
        
        self.test_results.append({
            "test": "Enhanced Visits System",
            "status": "✅ COMPLETED" if success_rate >= 50 else "⚠️ PARTIAL",
            "details": f"نجح {working_features}/{total_features} ميزة",
            "success_rate": f"{success_rate:.1f}%",
            "export_support": "✅ AVAILABLE" if any("Export" in key and result["status"] == "✅ WORKING" for key, result in visits_results.items()) else "⚠️ LIMITED",
            "visits_details": visits_results
        })
    
    async def test_debt_and_collection_system(self):
        """5. اختبار نظام الديون والتحصيل"""
        print("💰 اختبار نظام الديون والتحصيل...")
        
        debt_results = {}
        
        # اختبار APIs الديون
        debt_endpoints = [
            ("Debts List", "/debts"),
            ("Payments List", "/payments"),
            ("Debt Statistics", "/debts/summary/statistics"),
            ("Collection Statistics", "/debts/collections/summary/statistics")
        ]
        
        for name, endpoint in debt_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        debt_results[name] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "data_count": len(data) if isinstance(data, list) else 1
                        }
                    elif response.status == 404:
                        debt_results[name] = {
                            "status": "⚠️ NOT_IMPLEMENTED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    else:
                        debt_results[name] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                debt_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # اختبار معالجة دفعة جديدة
        try:
            # أولاً، جلب قائمة الديون للحصول على debt_id
            async with self.session.get(f"{BACKEND_URL}/debts") as response:
                if response.status == 200:
                    debts_data = await response.json()
                    if debts_data and len(debts_data) > 0:
                        test_debt_id = debts_data[0].get("id")
                        remaining_amount = debts_data[0].get("remaining_amount", 100)
                        
                        # اختبار معالجة دفعة
                        payment_data = {
                            "debt_id": test_debt_id,
                            "payment_amount": min(50, remaining_amount),
                            "payment_method": "cash",
                            "notes": "اختبار معالجة دفعة"
                        }
                        
                        start_time = time.time()
                        async with self.session.post(f"{BACKEND_URL}/payments/process", json=payment_data) as payment_response:
                            response_time = (time.time() - start_time) * 1000
                            
                            if payment_response.status == 200:
                                debt_results["Payment Processing"] = {
                                    "status": "✅ WORKING",
                                    "response_time": f"{response_time:.2f}ms",
                                    "note": "Payment processing successful"
                                }
                            else:
                                debt_results["Payment Processing"] = {
                                    "status": "❌ FAILED",
                                    "response_time": f"{response_time:.2f}ms"
                                }
                    else:
                        debt_results["Payment Processing"] = {
                            "status": "⚠️ SKIPPED",
                            "note": "No debts available for testing"
                        }
                        
        except Exception as e:
            debt_results["Payment Processing"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        # اختبار التكامل مع نظام الفواتير
        try:
            # فحص إذا كانت الطلبات تنشئ ديون تلقائياً
            async with self.session.get(f"{BACKEND_URL}/orders") as orders_response:
                if orders_response.status == 200:
                    orders_data = await orders_response.json()
                    
                    async with self.session.get(f"{BACKEND_URL}/debts") as debts_response:
                        if debts_response.status == 200:
                            debts_data = await debts_response.json()
                            
                            # فحص إذا كان هناك ديون مرتبطة بالطلبات
                            invoice_debts = [debt for debt in debts_data if debt.get("debt_type") == "invoice"]
                            
                            debt_results["Invoice Integration"] = {
                                "status": "✅ WORKING" if invoice_debts else "⚠️ LIMITED",
                                "orders_count": len(orders_data) if isinstance(orders_data, list) else 0,
                                "invoice_debts_count": len(invoice_debts),
                                "integration_confirmed": len(invoice_debts) > 0
                            }
                            
        except Exception as e:
            debt_results["Invoice Integration"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        working_features = sum(1 for result in debt_results.values() if result["status"] == "✅ WORKING")
        total_features = len(debt_results)
        success_rate = (working_features / total_features) * 100
        
        self.test_results.append({
            "test": "Debt & Collection System",
            "status": "✅ COMPLETED" if success_rate >= 60 else "⚠️ PARTIAL",
            "details": f"نجح {working_features}/{total_features} ميزة",
            "success_rate": f"{success_rate:.1f}%",
            "invoice_integration": "✅ CONFIRMED" if debt_results.get("Invoice Integration", {}).get("integration_confirmed") else "⚠️ NEEDS_VERIFICATION",
            "debt_details": debt_results
        })
    
    async def test_filter_support(self):
        """6. فحص دعم الفلاتر"""
        print("🔍 فحص دعم الفلاتر...")
        
        filter_results = {}
        
        # اختبار مرشحات الوقت في الداشبورد
        time_filters = ["today", "week", "month", "year"]
        for time_filter in time_filters:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}/dashboard/stats?time_filter={time_filter}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        filter_results[f"Time Filter: {time_filter}"] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "filter_applied": data.get("time_filter") == time_filter
                        }
                    else:
                        filter_results[f"Time Filter: {time_filter}"] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                filter_results[f"Time Filter: {time_filter}"] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # اختبار فلاتر أخرى
        other_filters = [
            ("User Role Filter", "/users?role=medical_rep"),
            ("Active Clinics Filter", "/clinics?is_active=true"),
            ("Product Category Filter", "/products?category=medicine")
        ]
        
        for name, endpoint in other_filters:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        filter_results[name] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    elif response.status == 404:
                        filter_results[name] = {
                            "status": "⚠️ NOT_IMPLEMENTED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    else:
                        filter_results[name] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                filter_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        working_filters = sum(1 for result in filter_results.values() if result["status"] == "✅ WORKING")
        total_filters = len(filter_results)
        success_rate = (working_filters / total_filters) * 100
        
        self.test_results.append({
            "test": "Filter Support Testing",
            "status": "✅ COMPLETED" if success_rate >= 70 else "⚠️ PARTIAL",
            "details": f"نجح {working_filters}/{total_filters} فلتر",
            "success_rate": f"{success_rate:.1f}%",
            "time_filters_working": sum(1 for key in filter_results.keys() if "Time Filter" in key and filter_results[key]["status"] == "✅ WORKING"),
            "filter_details": filter_results
        })
    
    async def test_integration_and_analytics(self):
        """7. اختبار التكامل والتحليلات"""
        print("🔗 اختبار التكامل والتحليلات...")
        
        integration_results = {}
        
        # اختبار ربط العيادات والمخازن
        try:
            async with self.session.get(f"{BACKEND_URL}/clinics") as clinics_response:
                async with self.session.get(f"{BACKEND_URL}/warehouses") as warehouses_response:
                    if clinics_response.status == 200 and warehouses_response.status == 200:
                        clinics_data = await clinics_response.json()
                        warehouses_data = await warehouses_response.json()
                        
                        integration_results["Clinics-Warehouses Integration"] = {
                            "status": "✅ WORKING",
                            "clinics_count": len(clinics_data) if isinstance(clinics_data, list) else 0,
                            "warehouses_count": len(warehouses_data) if isinstance(warehouses_data, list) else 0,
                            "integration_ready": True
                        }
                    else:
                        integration_results["Clinics-Warehouses Integration"] = {
                            "status": "❌ FAILED",
                            "note": "Failed to fetch clinics or warehouses data"
                        }
                        
        except Exception as e:
            integration_results["Clinics-Warehouses Integration"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        # اختبار التحليلات المتقدمة
        analytics_endpoints = [
            ("User Analytics", "/users/analytics"),
            ("Sales Analytics", "/orders/analytics"),
            ("Performance Analytics", "/dashboard/performance"),
            ("Advanced Analytics", "/analytics/advanced")
        ]
        
        for name, endpoint in analytics_endpoints:
            try:
                start_time = time.time()
                async with self.session.get(f"{BACKEND_URL}{endpoint}") as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        integration_results[name] = {
                            "status": "✅ WORKING",
                            "response_time": f"{response_time:.2f}ms",
                            "data_available": bool(data)
                        }
                    elif response.status == 404:
                        integration_results[name] = {
                            "status": "⚠️ NOT_IMPLEMENTED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                    else:
                        integration_results[name] = {
                            "status": "❌ FAILED",
                            "response_time": f"{response_time:.2f}ms"
                        }
                        
            except Exception as e:
                integration_results[name] = {
                    "status": "❌ ERROR",
                    "error": str(e)
                }
        
        # اختبار تكامل البيانات
        try:
            # فحص تكامل المستخدمين مع الطلبات والزيارات
            async with self.session.get(f"{BACKEND_URL}/users") as users_response:
                async with self.session.get(f"{BACKEND_URL}/orders") as orders_response:
                    async with self.session.get(f"{BACKEND_URL}/visits") as visits_response:
                        
                        if all(r.status == 200 for r in [users_response, orders_response, visits_response]):
                            users_data = await users_response.json()
                            orders_data = await orders_response.json()
                            visits_data = await visits_response.json()
                            
                            # فحص الربط
                            user_ids = {user.get("id") for user in users_data} if isinstance(users_data, list) else set()
                            order_user_ids = {order.get("medical_rep_id") for order in orders_data} if isinstance(orders_data, list) else set()
                            visit_user_ids = {visit.get("sales_rep_id") for visit in visits_data} if isinstance(visits_data, list) else set()
                            
                            linked_users = len(user_ids.intersection(order_user_ids.union(visit_user_ids)))
                            
                            integration_results["Data Integration"] = {
                                "status": "✅ WORKING",
                                "total_users": len(user_ids),
                                "linked_users": linked_users,
                                "integration_rate": f"{(linked_users / len(user_ids) * 100):.1f}%" if user_ids else "0%"
                            }
                        else:
                            integration_results["Data Integration"] = {
                                "status": "❌ FAILED",
                                "note": "Failed to fetch integration data"
                            }
                            
        except Exception as e:
            integration_results["Data Integration"] = {
                "status": "❌ ERROR",
                "error": str(e)
            }
        
        working_features = sum(1 for result in integration_results.values() if result["status"] == "✅ WORKING")
        total_features = len(integration_results)
        success_rate = (working_features / total_features) * 100
        
        self.test_results.append({
            "test": "Integration & Analytics Testing",
            "status": "✅ COMPLETED" if success_rate >= 50 else "⚠️ PARTIAL",
            "details": f"نجح {working_features}/{total_features} ميزة",
            "success_rate": f"{success_rate:.1f}%",
            "integration_ready": success_rate >= 50,
            "integration_details": integration_results
        })
    
    def generate_comprehensive_report(self):
        """إنشاء تقرير شامل"""
        total_time = time.time() - self.start_time
        
        print("\n" + "="*80)
        print("🎯 تقرير شامل عن حالة الباكند واستعداده لدعم التطوير في المرحلة التالية")
        print("="*80)
        
        # حساب الإحصائيات العامة
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if "✅" in result["status"])
        partial_tests = sum(1 for result in self.test_results if "⚠️" in result["status"])
        failed_tests = sum(1 for result in self.test_results if "❌" in result["status"])
        
        overall_success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 الإحصائيات العامة:")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • نجح بالكامل: {passed_tests} ✅")
        print(f"   • نجح جزئياً: {partial_tests} ⚠️")
        print(f"   • فشل: {failed_tests} ❌")
        print(f"   • معدل النجاح الإجمالي: {overall_success_rate:.1f}%")
        print(f"   • وقت التنفيذ الإجمالي: {total_time:.2f} ثانية")
        
        print(f"\n📋 تفاصيل النتائج:")
        for i, result in enumerate(self.test_results, 1):
            print(f"\n{i}. {result['test']}")
            print(f"   الحالة: {result['status']}")
            print(f"   التفاصيل: {result['details']}")
            
            if 'success_rate' in result:
                print(f"   معدل النجاح: {result['success_rate']}")
            
            if 'response_time' in result:
                print(f"   وقت الاستجابة: {result['response_time']}")
        
        # تقييم الاستعداد للمرحلة التالية
        print(f"\n🎯 تقييم الاستعداد للمرحلة التالية:")
        
        if overall_success_rate >= 85:
            readiness_status = "🟢 جاهز بالكامل"
            readiness_note = "النظام مستقر وجاهز لدعم جميع الميزات الجديدة"
        elif overall_success_rate >= 70:
            readiness_status = "🟡 جاهز مع تحفظات"
            readiness_note = "النظام جاهز للتطوير مع الحاجة لبعض التحسينات"
        elif overall_success_rate >= 50:
            readiness_status = "🟠 يحتاج تحسينات"
            readiness_note = "النظام يحتاج تحسينات قبل إضافة ميزات جديدة"
        else:
            readiness_status = "🔴 غير جاهز"
            readiness_note = "النظام يحتاج إصلاحات جوهرية قبل التطوير"
        
        print(f"   الحالة: {readiness_status}")
        print(f"   التقييم: {readiness_note}")
        
        # توصيات للمرحلة التالية
        print(f"\n💡 التوصيات للمرحلة التالية:")
        
        recommendations = []
        
        # تحليل النتائج وإعطاء توصيات
        for result in self.test_results:
            if "⚠️" in result["status"] or "❌" in result["status"]:
                if "Core APIs" in result["test"]:
                    recommendations.append("• إصلاح APIs الأساسية المعطلة لضمان استقرار النظام")
                elif "Dashboard" in result["test"]:
                    recommendations.append("• تحسين نظام الداشبورد والإحصائيات")
                elif "Activity Tracking" in result["test"]:
                    recommendations.append("• تطوير نظام التتبع والخريطة التفاعلية")
                elif "Visits" in result["test"]:
                    recommendations.append("• تحسين نظام الزيارات وإضافة وظائف التصدير")
                elif "Debt" in result["test"]:
                    recommendations.append("• تطوير نظام الديون والتحصيل المتكامل")
                elif "Filter" in result["test"]:
                    recommendations.append("• تحسين دعم الفلاتر في جميع الأقسام")
                elif "Integration" in result["test"]:
                    recommendations.append("• تطوير التكامل والتحليلات المتقدمة")
        
        if not recommendations:
            recommendations.append("• النظام في حالة ممتازة ويمكن البدء في تطوير الميزات الجديدة")
            recommendations.append("• التركيز على تحسين الأداء والتحسينات التدريجية")
        
        for rec in recommendations:
            print(f"   {rec}")
        
        print(f"\n🏁 الخلاصة النهائية:")
        print(f"   النظام حقق معدل نجاح {overall_success_rate:.1f}% في الاختبارات الشاملة")
        print(f"   الحالة العامة: {readiness_status}")
        print(f"   مستوى الاستعداد للتطوير: {'عالي' if overall_success_rate >= 80 else 'متوسط' if overall_success_rate >= 60 else 'منخفض'}")
        
        return {
            "overall_success_rate": overall_success_rate,
            "readiness_status": readiness_status,
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "recommendations": recommendations,
            "execution_time": total_time
        }
    
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء الاختبار الشامل للباكند...")
        print("="*60)
        
        await self.setup_session()
        
        try:
            # 1. المصادقة
            if not await self.authenticate():
                print("❌ فشل في المصادقة - توقف الاختبار")
                return
            
            # 2. تشغيل جميع الاختبارات
            await self.test_core_apis()
            await self.test_dashboard_and_statistics()
            await self.test_activity_tracking_and_maps()
            await self.test_enhanced_visits_system()
            await self.test_debt_and_collection_system()
            await self.test_filter_support()
            await self.test_integration_and_analytics()
            
            # 3. إنشاء التقرير الشامل
            report = self.generate_comprehensive_report()
            
            return report
            
        finally:
            await self.cleanup_session()

async def main():
    """الدالة الرئيسية"""
    tester = BackendReadinessTest()
    report = await tester.run_comprehensive_test()
    
    if report:
        print(f"\n✅ اكتمل الاختبار الشامل بمعدل نجاح {report['overall_success_rate']:.1f}%")
    else:
        print("\n❌ فشل في تشغيل الاختبار الشامل")

if __name__ == "__main__":
    asyncio.run(main())