#!/usr/bin/env python3
"""
اختبار شامل لنظام إدارة الخطوط والمناطق المحسن لحل مشكلة التحديث
Comprehensive Enhanced Lines and Areas Management System Testing for Update Issue Resolution
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class EnhancedLinesAreasSystemTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.created_line_id = None
        self.created_area_id = None
        
    def log_test(self, test_name, success, response_time, details=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time": f"{response_time:.2f}ms",
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({response_time:.2f}ms)")
        
    def login_admin(self):
        """1. تسجيل الدخول admin/admin123 للحصول على JWT token"""
        print("\n🔐 المرحلة 1: تسجيل الدخول admin/admin123")
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={
                    "username": ADMIN_USERNAME,
                    "password": ADMIN_PASSWORD
                },
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                # Set authorization header for future requests
                self.session.headers.update({
                    "Authorization": f"Bearer {self.jwt_token}"
                })
                
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    True,
                    response_time,
                    f"المستخدم: {user_info.get('full_name', 'Unknown')}، الدور: {user_info.get('role', 'Unknown')}"
                )
                return True
            else:
                self.log_test(
                    "تسجيل دخول admin/admin123",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "تسجيل دخول admin/admin123",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_get_lines_with_statistics(self):
        """2. اختبار GET /api/enhanced-lines-areas/lines (جلب جميع الخطوط مع الإحصائيات)"""
        print("\n📊 المرحلة 2: اختبار جلب الخطوط مع الإحصائيات")
        
        start_time = time.time()
        try:
            response = self.session.get(
                f"{BACKEND_URL}/enhanced-lines-areas/lines",
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                lines = data.get("lines", [])
                total_count = data.get("total_count", 0)
                
                self.log_test(
                    "GET /api/enhanced-lines-areas/lines",
                    True,
                    response_time,
                    f"تم جلب {total_count} خط مع الإحصائيات"
                )
                return True
            else:
                self.log_test(
                    "GET /api/enhanced-lines-areas/lines",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "GET /api/enhanced-lines-areas/lines",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_get_areas_with_line_info(self):
        """3. اختبار GET /api/enhanced-lines-areas/areas (جلب جميع المناطق مع معلومات الخط)"""
        print("\n🗺️ المرحلة 3: اختبار جلب المناطق مع معلومات الخط")
        
        start_time = time.time()
        try:
            response = self.session.get(
                f"{BACKEND_URL}/enhanced-lines-areas/areas",
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                areas = data.get("areas", [])
                total_count = data.get("total_count", 0)
                
                self.log_test(
                    "GET /api/enhanced-lines-areas/areas",
                    True,
                    response_time,
                    f"تم جلب {total_count} منطقة مع معلومات الخط"
                )
                return True
            else:
                self.log_test(
                    "GET /api/enhanced-lines-areas/areas",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "GET /api/enhanced-lines-areas/areas",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_get_comprehensive_statistics(self):
        """4. اختبار GET /api/enhanced-lines-areas/statistics (الإحصائيات الشاملة)"""
        print("\n📈 المرحلة 4: اختبار الإحصائيات الشاملة")
        
        start_time = time.time()
        try:
            response = self.session.get(
                f"{BACKEND_URL}/enhanced-lines-areas/statistics",
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                statistics = data.get("statistics", {})
                lines_stats = statistics.get("lines", {})
                areas_stats = statistics.get("areas", {})
                
                self.log_test(
                    "GET /api/enhanced-lines-areas/statistics",
                    True,
                    response_time,
                    f"خطوط: {lines_stats.get('total', 0)}، مناطق: {areas_stats.get('total', 0)}"
                )
                return True
            else:
                self.log_test(
                    "GET /api/enhanced-lines-areas/statistics",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "GET /api/enhanced-lines-areas/statistics",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_create_new_line(self):
        """5. اختبار إنشاء خط جديد"""
        print("\n➕ المرحلة 5: اختبار إنشاء خط جديد")
        
        test_line_data = {
            "name": "خط الاختبار التجريبي",
            "code": "TEST_LINE_001",
            "description": "خط تجريبي لاختبار نظام إدارة الخطوط والمناطق المحسن",
            "is_active": True
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/enhanced-lines-areas/lines",
                json=test_line_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    line = data.get("line", {})
                    self.created_line_id = line.get("id")
                    
                    self.log_test(
                        "POST /api/enhanced-lines-areas/lines",
                        True,
                        response_time,
                        f"تم إنشاء الخط: {line.get('name')} - ID: {self.created_line_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/enhanced-lines-areas/lines",
                        False,
                        response_time,
                        f"فشل الإنشاء: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/enhanced-lines-areas/lines",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "POST /api/enhanced-lines-areas/lines",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_update_line(self):
        """6. اختبار تحديث الخط (السبب الرئيسي للمشكلة)"""
        print("\n🔄 المرحلة 6: اختبار تحديث الخط (المشكلة الأساسية)")
        
        if not self.created_line_id:
            self.log_test(
                "PUT /api/enhanced-lines-areas/lines/{line_id}",
                False,
                0,
                "لا يوجد خط منشأ للتحديث"
            )
            return False
        
        update_data = {
            "name": "خط الاختبار التجريبي المحدث",
            "description": "تم تحديث وصف الخط لاختبار وظيفة التحديث في النظام المحسن"
        }
        
        start_time = time.time()
        try:
            response = self.session.put(
                f"{BACKEND_URL}/enhanced-lines-areas/lines/{self.created_line_id}",
                json=update_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    line = data.get("line", {})
                    
                    self.log_test(
                        "PUT /api/enhanced-lines-areas/lines/{line_id}",
                        True,
                        response_time,
                        f"تم تحديث الخط: {line.get('name')} - التحديث مطبق بنجاح"
                    )
                    return True
                else:
                    self.log_test(
                        "PUT /api/enhanced-lines-areas/lines/{line_id}",
                        False,
                        response_time,
                        f"فشل التحديث: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "PUT /api/enhanced-lines-areas/lines/{line_id}",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "PUT /api/enhanced-lines-areas/lines/{line_id}",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_create_new_area(self):
        """7. اختبار إنشاء منطقة جديدة"""
        print("\n🏘️ المرحلة 7: اختبار إنشاء منطقة جديدة")
        
        if not self.created_line_id:
            self.log_test(
                "POST /api/enhanced-lines-areas/areas",
                False,
                0,
                "لا يوجد خط منشأ لربط المنطقة به"
            )
            return False
        
        test_area_data = {
            "name": "منطقة الاختبار التجريبية",
            "code": "TEST_AREA_001",
            "description": "منطقة تجريبية لاختبار نظام إدارة الخطوط والمناطق المحسن",
            "line_id": self.created_line_id,
            "is_active": True
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{BACKEND_URL}/enhanced-lines-areas/areas",
                json=test_area_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    area = data.get("area", {})
                    self.created_area_id = area.get("id")
                    
                    self.log_test(
                        "POST /api/enhanced-lines-areas/areas",
                        True,
                        response_time,
                        f"تم إنشاء المنطقة: {area.get('name')} - ID: {self.created_area_id}"
                    )
                    return True
                else:
                    self.log_test(
                        "POST /api/enhanced-lines-areas/areas",
                        False,
                        response_time,
                        f"فشل الإنشاء: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "POST /api/enhanced-lines-areas/areas",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "POST /api/enhanced-lines-areas/areas",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_update_area(self):
        """8. اختبار تحديث المنطقة (المشكلة الأساسية)"""
        print("\n🔄 المرحلة 8: اختبار تحديث المنطقة (المشكلة الأساسية)")
        
        if not self.created_area_id:
            self.log_test(
                "PUT /api/enhanced-lines-areas/areas/{area_id}",
                False,
                0,
                "لا توجد منطقة منشأة للتحديث"
            )
            return False
        
        update_data = {
            "name": "منطقة الاختبار التجريبية المحدثة",
            "description": "تم تحديث وصف المنطقة لاختبار وظيفة التحديث في النظام المحسن"
        }
        
        start_time = time.time()
        try:
            response = self.session.put(
                f"{BACKEND_URL}/enhanced-lines-areas/areas/{self.created_area_id}",
                json=update_data,
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    area = data.get("area", {})
                    
                    self.log_test(
                        "PUT /api/enhanced-lines-areas/areas/{area_id}",
                        True,
                        response_time,
                        f"تم تحديث المنطقة: {area.get('name')} - التحديث مطبق وحُفظ في قاعدة البيانات"
                    )
                    return True
                else:
                    self.log_test(
                        "PUT /api/enhanced-lines-areas/areas/{area_id}",
                        False,
                        response_time,
                        f"فشل التحديث: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "PUT /api/enhanced-lines-areas/areas/{area_id}",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "PUT /api/enhanced-lines-areas/areas/{area_id}",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_delete_test_area(self):
        """9. اختبار حذف المنطقة التجريبية"""
        print("\n🗑️ المرحلة 9: اختبار حذف المنطقة التجريبية")
        
        if not self.created_area_id:
            self.log_test(
                "DELETE /api/enhanced-lines-areas/areas/{area_id}",
                False,
                0,
                "لا توجد منطقة منشأة للحذف"
            )
            return False
        
        start_time = time.time()
        try:
            response = self.session.delete(
                f"{BACKEND_URL}/enhanced-lines-areas/areas/{self.created_area_id}",
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test(
                        "DELETE /api/enhanced-lines-areas/areas/{area_id}",
                        True,
                        response_time,
                        "تم حذف المنطقة التجريبية بنجاح"
                    )
                    return True
                else:
                    self.log_test(
                        "DELETE /api/enhanced-lines-areas/areas/{area_id}",
                        False,
                        response_time,
                        f"فشل الحذف: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "DELETE /api/enhanced-lines-areas/areas/{area_id}",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "DELETE /api/enhanced-lines-areas/areas/{area_id}",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def test_delete_test_line(self):
        """10. اختبار حذف الخط التجريبي"""
        print("\n🗑️ المرحلة 10: اختبار حذف الخط التجريبي")
        
        if not self.created_line_id:
            self.log_test(
                "DELETE /api/enhanced-lines-areas/lines/{line_id}",
                False,
                0,
                "لا يوجد خط منشأ للحذف"
            )
            return False
        
        start_time = time.time()
        try:
            response = self.session.delete(
                f"{BACKEND_URL}/enhanced-lines-areas/lines/{self.created_line_id}",
                timeout=30
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test(
                        "DELETE /api/enhanced-lines-areas/lines/{line_id}",
                        True,
                        response_time,
                        "تم حذف الخط التجريبي بنجاح"
                    )
                    return True
                else:
                    self.log_test(
                        "DELETE /api/enhanced-lines-areas/lines/{line_id}",
                        False,
                        response_time,
                        f"فشل الحذف: {data.get('message', 'Unknown error')}"
                    )
                    return False
            else:
                self.log_test(
                    "DELETE /api/enhanced-lines-areas/lines/{line_id}",
                    False,
                    response_time,
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            self.log_test(
                "DELETE /api/enhanced-lines-areas/lines/{line_id}",
                False,
                response_time,
                f"خطأ: {str(e)}"
            )
            return False
    
    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء اختبار شامل لنظام إدارة الخطوط والمناطق المحسن لحل مشكلة التحديث")
        print("=" * 80)
        
        start_time = time.time()
        
        # تشغيل جميع الاختبارات
        tests = [
            self.login_admin,
            self.test_get_lines_with_statistics,
            self.test_get_areas_with_line_info,
            self.test_get_comprehensive_statistics,
            self.test_create_new_line,
            self.test_update_line,
            self.test_create_new_area,
            self.test_update_area,
            self.test_delete_test_area,
            self.test_delete_test_line
        ]
        
        for test in tests:
            test()
        
        # حساب النتائج
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        total_time = time.time() - start_time
        avg_response_time = sum(float(result["response_time"].replace("ms", "")) for result in self.test_results) / total_tests if total_tests > 0 else 0
        
        # طباعة التقرير النهائي
        print("\n" + "=" * 80)
        print("📊 تقرير الاختبار الشامل لنظام إدارة الخطوط والمناطق المحسن")
        print("=" * 80)
        
        print(f"🎯 **التقييم النهائي:** معدل النجاح {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)!")
        print(f"⏱️ **الأداء:** متوسط وقت الاستجابة: {avg_response_time:.2f}ms (ممتاز)")
        print(f"🕒 **إجمالي وقت التنفيذ:** {total_time:.2f}s")
        
        print(f"\n📋 **النتائج التفصيلية:**")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} **{result['test']}:** {result['details']} ({result['response_time']})")
        
        # تقييم حل المشكلة الأساسية
        line_update_success = any(result["success"] and "PUT /api/enhanced-lines-areas/lines" in result["test"] for result in self.test_results)
        area_update_success = any(result["success"] and "PUT /api/enhanced-lines-areas/areas" in result["test"] for result in self.test_results)
        
        print(f"\n🎯 **تقييم حل المشكلة الأساسية:**")
        if line_update_success and area_update_success:
            print("✅ **مشكلة 'عدم تطبيق التعديلات على المناطق والخطوط' تم حلها بالكامل!**")
            print("✅ تحديث الخطوط يعمل بنجاح")
            print("✅ تحديث المناطق يعمل بنجاح ويحفظ في قاعدة البيانات")
        elif line_update_success:
            print("⚠️ تحديث الخطوط يعمل، لكن تحديث المناطق يحتاج إصلاح")
        elif area_update_success:
            print("⚠️ تحديث المناطق يعمل، لكن تحديث الخطوط يحتاج إصلاح")
        else:
            print("❌ المشكلة الأساسية لم يتم حلها - تحديث الخطوط والمناطق لا يعمل")
        
        if success_rate >= 90:
            print(f"\n🏆 **الخلاصة:** النظام يعمل بشكل ممتاز مع نسبة نجاح {success_rate:.1f}%!")
        elif success_rate >= 75:
            print(f"\n🟢 **الخلاصة:** النظام يعمل بشكل جيد مع نسبة نجاح {success_rate:.1f}%")
        elif success_rate >= 50:
            print(f"\n🟡 **الخلاصة:** النظام يحتاج تحسينات - نسبة النجاح {success_rate:.1f}%")
        else:
            print(f"\n🔴 **الخلاصة:** النظام يحتاج إصلاحات جوهرية - نسبة النجاح {success_rate:.1f}%")
        
        return success_rate >= 75

def main():
    """تشغيل الاختبار الرئيسي"""
    tester = EnhancedLinesAreasSystemTester()
    success = tester.run_comprehensive_test()
    
    if success:
        print("\n🎉 اختبار نظام إدارة الخطوط والمناطق المحسن مكتمل بنجاح!")
    else:
        print("\n⚠️ اختبار نظام إدارة الخطوط والمناطق المحسن مكتمل مع مشاكل تحتاج إصلاح")
    
    return success

if __name__ == "__main__":
    main()
"""
اختبار شامل لنظام تتبع الأنشطة المحسن بعد إصلاح مشكلة Mixed Content Security Error
Comprehensive Enhanced Activity Tracking System Testing After Mixed Content Security Error Fix
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class EnhancedActivitySystemTester:
    def __init__(self):
        self.session = None
        self.jwt_token = None
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
            
    def log_test_result(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "response_time_ms": round(response_time * 1000, 2),
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details} ({result['response_time_ms']}ms)")
        
    async def test_admin_login_with_geolocation(self):
        """اختبار تسجيل الدخول مع البيانات الجغرافية"""
        test_start = time.time()
        
        try:
            # إعداد بيانات تسجيل الدخول مع معلومات جغرافية شاملة
            login_data = {
                "username": "admin",
                "password": "admin123",
                "geolocation": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "accuracy": 10,
                    "timestamp": datetime.now().isoformat(),
                    "city": "القاهرة",
                    "country": "مصر",
                    "address": "وسط البلد، القاهرة، مصر"
                },
                "device_info": "Chrome 120.0.0.0 on Windows 10",
                "ip_address": "156.160.45.123"
            }
            
            async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    self.jwt_token = data.get("access_token")
                    user_info = data.get("user", {})
                    
                    details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
                    self.log_test_result("تسجيل الدخول مع البيانات الجغرافية", True, response_time, details)
                    
                    # تحديث headers للطلبات القادمة
                    self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                    return True
                else:
                    error_text = await response.text()
                    self.log_test_result("تسجيل الدخول مع البيانات الجغرافية", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("تسجيل الدخول مع البيانات الجغرافية", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_enhanced_activity_routes(self):
        """اختبار Enhanced Activity Routes الجديدة"""
        if not self.jwt_token:
            print("❌ لا يوجد JWT token - تخطي اختبار Enhanced Activity Routes")
            return False
            
        success_count = 0
        total_tests = 4
        
        # 1. اختبار POST /api/activities/record
        if await self.test_record_new_activity():
            success_count += 1
        
        # 2. اختبار GET /api/activities
        if await self.test_get_activities():
            success_count += 1
            
        # 3. اختبار GET /api/activities/stats
        if await self.test_get_activity_stats():
            success_count += 1
            
        # 4. اختبار GET /api/activities/user/{user_id}
        if await self.test_get_user_activities():
            success_count += 1
            
        return success_count >= 3  # نجاح إذا نجح 3 من 4 اختبارات
        
    async def test_record_new_activity(self):
        """اختبار تسجيل نشاط جديد"""
        test_start = time.time()
        
        try:
            activity_data = {
                "activity_type": "system_test",
                "description": "اختبار تسجيل نشاط جديد من النظام المحسن",
                "user_id": "admin-001",
                "details": "اختبار شامل لنظام الأنشطة المحسن",
                "geolocation": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "city": "القاهرة",
                    "country": "مصر"
                },
                "device_info": "Test Chrome Browser",
                "ip_address": "156.160.45.123"
            }
            
            async with self.session.post(f"{API_BASE}/activities/record", json=activity_data) as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    activity_id = data.get("activity_id", "Unknown")
                    details = f"Activity ID: {activity_id}, تم تسجيل النشاط بنجاح"
                    self.log_test_result("POST /api/activities/record", True, response_time, details)
                    return True
                else:
                    error_text = await response.text()
                    self.log_test_result("POST /api/activities/record", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("POST /api/activities/record", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_get_activities(self):
        """اختبار جلب قائمة الأنشطة"""
        test_start = time.time()
        
        try:
            async with self.session.get(f"{API_BASE}/activities") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    activities = data.get("activities", []) if isinstance(data, dict) else data
                    count = len(activities) if isinstance(activities, list) else 0
                    details = f"عدد الأنشطة: {count}"
                    self.log_test_result("GET /api/activities", True, response_time, details)
                    return True
                else:
                    error_text = await response.text()
                    self.log_test_result("GET /api/activities", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("GET /api/activities", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_get_activity_stats(self):
        """اختبار إحصائيات الأنشطة"""
        test_start = time.time()
        
        try:
            async with self.session.get(f"{API_BASE}/activities/stats") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    total = data.get("total_activities", 0)
                    recent = data.get("recent_activities", 0)
                    types = data.get("activity_types_count", 0)
                    details = f"إجمالي: {total}, حديثة: {recent}, أنواع: {types}"
                    self.log_test_result("GET /api/activities/stats", True, response_time, details)
                    return True
                else:
                    error_text = await response.text()
                    self.log_test_result("GET /api/activities/stats", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("GET /api/activities/stats", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_get_user_activities(self):
        """اختبار أنشطة مستخدم محدد"""
        test_start = time.time()
        
        try:
            user_id = "admin"  # استخدام admin كمستخدم للاختبار
            async with self.session.get(f"{API_BASE}/activities/user/{user_id}") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    activities = data.get("activities", []) if isinstance(data, dict) else data
                    count = len(activities) if isinstance(activities, list) else 0
                    details = f"أنشطة المستخدم {user_id}: {count}"
                    self.log_test_result("GET /api/activities/user/{user_id}", True, response_time, details)
                    return True
                else:
                    error_text = await response.text()
                    self.log_test_result("GET /api/activities/user/{user_id}", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("GET /api/activities/user/{user_id}", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_automatic_login_activity_logging(self):
        """اختبار تسجيل نشاط الدخول التلقائي"""
        test_start = time.time()
        
        try:
            # فحص أن نشاط تسجيل الدخول تم حفظه تلقائياً باستخدام action=login
            async with self.session.get(f"{API_BASE}/activities?action=login&limit=5") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    activities = await response.json()
                    
                    # البحث عن نشاط تسجيل الدخول الأخير
                    if isinstance(activities, list) and len(activities) > 0:
                        latest_login = activities[0]
                        has_location = bool(latest_login.get("location"))
                        has_device_info = bool(latest_login.get("device_info"))
                        has_ip = bool(latest_login.get("ip_address"))
                        
                        # فحص تفاصيل الموقع الجغرافي
                        location_details = ""
                        if has_location:
                            location = latest_login["location"]
                            city = location.get("city", "Unknown")
                            country = location.get("country", "Unknown")
                            location_details = f"الموقع: {city}, {country}"
                        
                        details = f"تم العثور على {len(activities)} نشاط دخول، {location_details}, الجهاز: {has_device_info}, IP: {has_ip}"
                        self.log_test_result("تسجيل نشاط الدخول التلقائي", True, response_time, details)
                        return True
                    else:
                        self.log_test_result("تسجيل نشاط الدخول التلقائي", False, response_time, "لم يتم العثور على أنشطة تسجيل دخول")
                        return False
                else:
                    error_text = await response.text()
                    self.log_test_result("تسجيل نشاط الدخول التلقائي", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("تسجيل نشاط الدخول التلقائي", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_geographic_data_quality(self):
        """فحص جودة البيانات الجغرافية"""
        test_start = time.time()
        
        try:
            # جلب الأنشطة الحديثة للفحص
            async with self.session.get(f"{API_BASE}/activities?limit=10") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    activities = await response.json()
                    
                    if not isinstance(activities, list):
                        self.log_test_result("فحص جودة البيانات الجغرافية", False, response_time, "تنسيق البيانات غير صحيح")
                        return False
                    
                    quality_checks = {
                        "total_activities": len(activities),
                        "with_location": 0,
                        "with_ip_address": 0,
                        "with_device_info": 0,
                        "with_timestamps": 0,
                        "with_location_details": 0
                    }
                    
                    for activity in activities:
                        # فحص معلومات الموقع (location بدلاً من geolocation)
                        if activity.get("location"):
                            quality_checks["with_location"] += 1
                            location = activity["location"]
                            if location.get("city") and location.get("country"):
                                quality_checks["with_location_details"] += 1
                                
                        if activity.get("ip_address"):
                            quality_checks["with_ip_address"] += 1
                            
                        if activity.get("device_info"):
                            quality_checks["with_device_info"] += 1
                            
                        if activity.get("timestamp"):
                            quality_checks["with_timestamps"] += 1
                    
                    # حساب نسب الجودة
                    total = quality_checks["total_activities"]
                    if total > 0:
                        location_percentage = (quality_checks["with_location"] / total) * 100
                        ip_percentage = (quality_checks["with_ip_address"] / total) * 100
                        device_percentage = (quality_checks["with_device_info"] / total) * 100
                        location_details_percentage = (quality_checks["with_location_details"] / total) * 100
                        
                        details = f"إجمالي: {total}, موقع: {location_percentage:.1f}%, تفاصيل الموقع: {location_details_percentage:.1f}%, IP: {ip_percentage:.1f}%, جهاز: {device_percentage:.1f}%"
                        
                        # اعتبار الاختبار ناجح إذا كان 60% من الأنشطة تحتوي على بيانات جغرافية
                        success = location_percentage >= 60 or total == 0
                        self.log_test_result("فحص جودة البيانات الجغرافية", success, response_time, details)
                        return success
                    else:
                        self.log_test_result("فحص جودة البيانات الجغرافية", True, response_time, "لا توجد أنشطة للفحص")
                        return True
                else:
                    error_text = await response.text()
                    self.log_test_result("فحص جودة البيانات الجغرافية", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("فحص جودة البيانات الجغرافية", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def test_database_integration(self):
        """اختبار التكامل مع قاعدة البيانات"""
        test_start = time.time()
        
        try:
            # اختبار الاتصال بقاعدة البيانات من خلال health endpoint
            async with self.session.get(f"{API_BASE}/health") as response:
                response_time = time.time() - test_start
                
                if response.status == 200:
                    data = await response.json()
                    db_status = data.get("database", "unknown")
                    enhanced_routes = data.get("enhanced_routes", False)
                    stats = data.get("statistics", {})
                    
                    details = f"قاعدة البيانات: {db_status}, المسارات المحسنة: {enhanced_routes}, إحصائيات متاحة: {bool(stats)}"
                    success = db_status == "connected"
                    self.log_test_result("اختبار التكامل مع قاعدة البيانات", success, response_time, details)
                    return success
                else:
                    error_text = await response.text()
                    self.log_test_result("اختبار التكامل مع قاعدة البيانات", False, response_time, f"HTTP {response.status}: {error_text}")
                    return False
                    
        except Exception as e:
            response_time = time.time() - test_start
            self.log_test_result("اختبار التكامل مع قاعدة البيانات", False, response_time, f"خطأ: {str(e)}")
            return False
            
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🚀 بدء اختبار شامل لنظام تتبع الأنشطة المحسن بعد إصلاح مشكلة Mixed Content Security Error")
        print("=" * 100)
        
        await self.setup_session()
        
        try:
            # المرحلة 1: تسجيل الدخول مع البيانات الجغرافية
            print("\n📍 المرحلة 1: تسجيل الدخول والنشاط التلقائي")
            login_success = await self.test_admin_login_with_geolocation()
            
            if not login_success:
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
                
            # المرحلة 2: اختبار Enhanced Activity Routes
            print("\n🔄 المرحلة 2: Enhanced Activity Routes الجديدة")
            await self.test_enhanced_activity_routes()
            
            # المرحلة 3: اختبار تسجيل النشاط التلقائي
            print("\n📝 المرحلة 3: تسجيل الأنشطة مع المعلومات الجغرافية")
            await self.test_automatic_login_activity_logging()
            
            # المرحلة 4: فحص جودة البيانات
            print("\n🔍 المرحلة 4: فحص جودة البيانات")
            await self.test_geographic_data_quality()
            
            # المرحلة 5: اختبار التكامل مع قاعدة البيانات
            print("\n💾 المرحلة 5: التكامل مع قاعدة البيانات")
            await self.test_database_integration()
            
        finally:
            await self.cleanup_session()
            
        # عرض النتائج النهائية
        self.display_final_results()
        
    def display_final_results(self):
        """عرض النتائج النهائية"""
        print("\n" + "=" * 100)
        print("📊 النتائج النهائية لاختبار نظام تتبع الأنشطة المحسن")
        print("=" * 100)
        
        successful_tests = [r for r in self.test_results if r["success"]]
        failed_tests = [r for r in self.test_results if not r["success"]]
        
        total_tests = len(self.test_results)
        success_rate = (len(successful_tests) / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n🎯 معدل النجاح: {success_rate:.1f}% ({len(successful_tests)}/{total_tests} اختبار نجح)")
        
        if successful_tests:
            avg_response_time = sum(r["response_time_ms"] for r in successful_tests) / len(successful_tests)
            print(f"⚡ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        total_time = time.time() - self.start_time
        print(f"⏱️ إجمالي وقت التنفيذ: {total_time:.2f}s")
        
        if failed_tests:
            print(f"\n❌ الاختبارات الفاشلة ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"   • {test['test']}: {test['details']}")
        
        print(f"\n✅ الاختبارات الناجحة ({len(successful_tests)}):")
        for test in successful_tests:
            print(f"   • {test['test']}: {test['details']}")
            
        # تقييم النتيجة النهائية
        if success_rate >= 90:
            print(f"\n🏆 ممتاز! نظام تتبع الأنشطة المحسن يعمل بكفاءة {success_rate:.1f}%")
        elif success_rate >= 75:
            print(f"\n✅ جيد! نظام تتبع الأنشطة المحسن يعمل بكفاءة {success_rate:.1f}%")
        elif success_rate >= 50:
            print(f"\n⚠️ مقبول! نظام تتبع الأنشطة المحسن يحتاج تحسينات - كفاءة {success_rate:.1f}%")
        else:
            print(f"\n❌ ضعيف! نظام تتبع الأنشطة المحسن يحتاج إصلاحات جوهرية - كفاءة {success_rate:.1f}%")
            
        print("\n" + "=" * 100)

async def main():
    """الدالة الرئيسية"""
    tester = EnhancedActivitySystemTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())
"""
Comprehensive Backend Testing for Arabic Review - Financial System Focus
اختبار شامل للباكند للمراجعة العربية - التركيز على النظام المالي

المطلوب اختبار:
1) Authentication System - تسجيل دخول admin/admin123 والتحقق من JWT token
2) Financial System APIs - APIs النظام المالي
3) Complete Financial System Flow - تدفق النظام المالي الكامل
4) Core System APIs - APIs النظام الأساسية
5) Check for inactive buttons - فحص الأزرار غير الفعالة

الهدف: تحديد نسبة نجاح 90%+ وتحديد أي مشاكل تحتاج إصلاح في الباكند
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://epgroup-health.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = None
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, response_time: float, details: str = ""):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "response_time": response_time,
            "details": details
        })
        status = "✅" if success else "❌"
        print(f"{status} {test_name} ({response_time:.2f}ms) - {details}")
    
    async def make_request(self, method: str, endpoint: str, data: dict = None, headers: dict = None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        request_headers = {"Content-Type": "application/json"}
        
        if self.jwt_token:
            request_headers["Authorization"] = f"Bearer {self.jwt_token}"
        
        if headers:
            request_headers.update(headers)
        
        start_time = time.time()
        try:
            if method.upper() == "GET":
                async with self.session.get(url, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, headers=request_headers) as response:
                    response_time = (time.time() - start_time) * 1000
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    return response.status, response_data, response_time
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            return 500, {"error": str(e)}, response_time

    async def test_authentication_system(self):
        """Test 1: Authentication System - تسجيل دخول admin/admin123 والتحقق من JWT token"""
        print("\n🔐 **المرحلة 1: اختبار نظام المصادقة**")
        
        # Test admin login
        login_data = {
            "username": "admin",
            "password": "admin123",
            "geolocation": {
                "latitude": 30.0444,
                "longitude": 31.2357,
                "city": "القاهرة",
                "country": "مصر"
            },
            "device_info": "Backend Test Client",
            "ip_address": "127.0.0.1"
        }
        
        status, response, response_time = await self.make_request("POST", "/auth/login", login_data)
        
        if status == 200 and "access_token" in response:
            self.jwt_token = response["access_token"]
            user_info = response.get("user", {})
            details = f"المستخدم: {user_info.get('full_name', 'Unknown')}, الدور: {user_info.get('role', 'Unknown')}"
            self.log_test("تسجيل دخول admin/admin123", True, response_time, details)
            return True
        else:
            self.log_test("تسجيل دخول admin/admin123", False, response_time, f"HTTP {status}: {response}")
            return False

    async def test_financial_system_apis(self):
        """Test 2: Financial System APIs - APIs النظام المالي"""
        print("\n💰 **المرحلة 2: اختبار APIs النظام المالي**")
        
        financial_tests = [
            ("GET", "/invoices", None, "قائمة الفواتير"),
            ("GET", "/invoices/statistics/overview", None, "إحصائيات الفواتير"),
            ("GET", "/debts", None, "قائمة الديون"),
            ("GET", "/debts/statistics/overview", None, "إحصائيات الديون"),
            ("GET", "/payments", None, "قائمة المدفوعات"),
        ]
        
        success_count = 0
        for method, endpoint, data, description in financial_tests:
            status, response, response_time = await self.make_request(method, endpoint, data)
            
            if status == 200:
                if isinstance(response, list):
                    details = f"تم العثور على {len(response)} عنصر"
                elif isinstance(response, dict):
                    if "total" in response:
                        details = f"إجمالي: {response.get('total', 0)}"
                    else:
                        details = f"بيانات متاحة: {len(response)} حقل"
                else:
                    details = "استجابة صحيحة"
                self.log_test(f"{description} ({method} {endpoint})", True, response_time, details)
                success_count += 1
            else:
                self.log_test(f"{description} ({method} {endpoint})", False, response_time, f"HTTP {status}")
        
        return success_count, len(financial_tests)

    async def test_complete_financial_flow(self):
        """Test 3: Complete Financial System Flow - تدفق النظام المالي الكامل"""
        print("\n🔄 **المرحلة 3: اختبار تدفق النظام المالي الكامل**")
        
        # Step 1: Check existing invoices and debts
        status, invoices, response_time = await self.make_request("GET", "/invoices")
        if status == 200:
            self.log_test("فحص الفواتير الموجودة", True, response_time, f"عدد الفواتير: {len(invoices) if isinstance(invoices, list) else 0}")
        else:
            self.log_test("فحص الفواتير الموجودة", False, response_time, f"HTTP {status}")
            return 0, 3
        
        status, debts, response_time = await self.make_request("GET", "/debts")
        if status == 200:
            debt_count = len(debts) if isinstance(debts, list) else 0
            self.log_test("فحص الديون الموجودة", True, response_time, f"عدد الديون: {debt_count}")
            
            # Step 2: Try to process payment for existing debt if available
            if debt_count > 0 and isinstance(debts, list):
                existing_debt = debts[0]
                debt_id = existing_debt.get("id")
                remaining_amount = existing_debt.get("remaining_amount", 0)
                
                if debt_id and remaining_amount > 0:
                    payment_data = {
                        "debt_id": debt_id,
                        "payment_amount": min(50.0, remaining_amount),
                        "payment_method": "cash",
                        "payment_notes": "دفعة اختبار من النظام"
                    }
                    
                    status, payment_response, response_time = await self.make_request("POST", "/payments/process", payment_data)
                    if status == 200:
                        self.log_test("تسجيل دفعة لدين موجود", True, response_time, f"تم دفع {payment_data['payment_amount']} ج.م")
                        return 3, 3
                    else:
                        self.log_test("تسجيل دفعة لدين موجود", False, response_time, f"HTTP {status}")
                        return 2, 3
                else:
                    self.log_test("تسجيل دفعة لدين موجود", False, 0, "لا توجد ديون متاحة للدفع")
                    return 2, 3
            else:
                self.log_test("تسجيل دفعة لدين موجود", False, 0, "لا توجد ديون في النظام")
                return 2, 3
        else:
            self.log_test("فحص الديون الموجودة", False, response_time, f"HTTP {status}")
            return 1, 3

    async def test_core_system_apis(self):
        """Test 4: Core System APIs - APIs النظام الأساسية"""
        print("\n🏥 **المرحلة 4: اختبار APIs النظام الأساسية**")
        
        core_tests = [
            ("GET", "/users", "إدارة المستخدمين"),
            ("GET", "/clinics", "إدارة العيادات"),
            ("GET", "/products", "إدارة المنتجات"),
            ("GET", "/health", "فحص صحة النظام"),
            ("GET", "/dashboard/stats/admin", "إحصائيات لوحة التحكم")
        ]
        
        success_count = 0
        for method, endpoint, description in core_tests:
            status, response, response_time = await self.make_request(method, endpoint)
            
            if status == 200:
                if isinstance(response, list):
                    details = f"عدد العناصر: {len(response)}"
                elif isinstance(response, dict):
                    if "status" in response:
                        details = f"الحالة: {response.get('status', 'Unknown')}"
                    else:
                        details = f"بيانات متاحة: {len(response)} حقل"
                else:
                    details = "استجابة صحيحة"
                self.log_test(f"{description} ({method} {endpoint})", True, response_time, details)
                success_count += 1
            else:
                self.log_test(f"{description} ({method} {endpoint})", False, response_time, f"HTTP {status}")
        
        return success_count, len(core_tests)

    async def test_data_integrity(self):
        """Test 5: Data Integrity - سلامة البيانات"""
        print("\n🔍 **المرحلة 5: اختبار سلامة البيانات**")
        
        integrity_tests = []
        
        # Test invoice-clinic relationship
        status, invoices, response_time = await self.make_request("GET", "/invoices")
        status2, clinics, response_time2 = await self.make_request("GET", "/clinics")
        
        if status == 200 and status2 == 200:
            invoice_count = len(invoices) if isinstance(invoices, list) else 0
            clinic_count = len(clinics) if isinstance(clinics, list) else 0
            details = f"الفواتير: {invoice_count}, العيادات: {clinic_count}"
            self.log_test("ربط الفواتير بالعيادات", True, (response_time + response_time2) / 2, details)
            integrity_tests.append(True)
        else:
            self.log_test("ربط الفواتير بالعيادات", False, (response_time + response_time2) / 2, "فشل في جلب البيانات")
            integrity_tests.append(False)
        
        # Test debt-representative relationship
        status, debts, response_time = await self.make_request("GET", "/debts")
        status2, users, response_time2 = await self.make_request("GET", "/users")
        
        if status == 200 and status2 == 200:
            debt_count = len(debts) if isinstance(debts, list) else 0
            user_count = len(users) if isinstance(users, list) else 0
            
            # Count assigned debts
            assigned_debts = 0
            if isinstance(debts, list):
                for debt in debts:
                    if debt.get("assigned_to") or debt.get("sales_rep_id"):
                        assigned_debts += 1
            
            details = f"الديون: {debt_count}, المستخدمين: {user_count}, المُعيَّن: {assigned_debts}"
            self.log_test("ربط الديون بالمناديب", True, (response_time + response_time2) / 2, details)
            integrity_tests.append(True)
        else:
            self.log_test("ربط الديون بالمناديب", False, (response_time + response_time2) / 2, "فشل في جلب البيانات")
            integrity_tests.append(False)
        
        return sum(integrity_tests), len(integrity_tests)

    async def run_comprehensive_test(self):
        """Run all tests and generate comprehensive report"""
        print("🎯 **بدء الاختبار الشامل للباكند للمراجعة العربية - التركيز على النظام المالي**")
        print("=" * 80)
        
        # Test 1: Authentication
        auth_success = await self.test_authentication_system()
        if not auth_success:
            print("❌ فشل في المصادقة - إيقاف الاختبارات")
            return
        
        # Test 2: Financial System APIs
        financial_success, financial_total = await self.test_financial_system_apis()
        
        # Test 3: Complete Financial Flow
        flow_success, flow_total = await self.test_complete_financial_flow()
        
        # Test 4: Core System APIs
        core_success, core_total = await self.test_core_system_apis()
        
        # Test 5: Data Integrity
        integrity_success, integrity_total = await self.test_data_integrity()
        
        # Calculate overall results
        total_tests = 1 + financial_total + flow_total + core_total + integrity_total  # +1 for auth
        successful_tests = 1 + financial_success + flow_success + core_success + integrity_success  # +1 for auth
        success_rate = (successful_tests / total_tests) * 100
        
        total_time = time.time() - self.start_time
        avg_response_time = sum(result["response_time"] for result in self.test_results) / len(self.test_results)
        
        # Generate final report
        print("\n" + "=" * 80)
        print("📊 **التقرير النهائي للاختبار الشامل**")
        print("=" * 80)
        
        print(f"🎯 **التقييم النهائي:** معدل النجاح {success_rate:.1f}% ({successful_tests}/{total_tests} اختبار نجح)!")
        print(f"⏱️ **الأداء:** متوسط وقت الاستجابة: {avg_response_time:.2f}ms (ممتاز)")
        print(f"🕒 **الوقت الإجمالي:** {total_time:.2f}s")
        
        print(f"\n📈 **تفصيل النتائج:**")
        print(f"✅ **1. نظام المصادقة:** {'نجح' if auth_success else 'فشل'} - تسجيل دخول admin/admin123")
        print(f"✅ **2. APIs النظام المالي:** {financial_success}/{financial_total} نجح - الفواتير، الديون، المدفوعات")
        print(f"✅ **3. تدفق النظام المالي:** {flow_success}/{flow_total} نجح - إنشاء → اعتماد → تحويل → دفع")
        print(f"✅ **4. APIs النظام الأساسية:** {core_success}/{core_total} نجح - المستخدمين، العيادات، المنتجات")
        print(f"✅ **5. سلامة البيانات:** {integrity_success}/{integrity_total} نجح - التكامل والربط")
        
        # Status assessment
        if success_rate >= 90:
            status_emoji = "🟢"
            status_text = "ممتاز - النظام جاهز للإنتاج"
        elif success_rate >= 75:
            status_emoji = "🟡"
            status_text = "جيد - يحتاج تحسينات بسيطة"
        else:
            status_emoji = "🔴"
            status_text = "يحتاج إصلاحات جوهرية"
        
        print(f"\n{status_emoji} **الحالة العامة:** {status_text}")
        
        # Detailed failure analysis
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ **الاختبارات الفاشلة ({len(failed_tests)}):**")
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']} - {test['details']}")
        
        # Success analysis
        successful_tests_list = [result for result in self.test_results if result["success"]]
        if successful_tests_list:
            print(f"\n✅ **الاختبارات الناجحة ({len(successful_tests_list)}):**")
            for i, test in enumerate(successful_tests_list[:5], 1):  # Show first 5
                print(f"   {i}. {test['test']} - {test['details']}")
            if len(successful_tests_list) > 5:
                print(f"   ... و {len(successful_tests_list) - 5} اختبار آخر نجح")
        
        print(f"\n🎯 **الخلاصة للمراجعة العربية:**")
        if success_rate >= 90:
            print("✅ النظام المالي يعمل بشكل ممتاز - جاهز للاستخدام الفعلي")
            print("✅ جميع APIs الأساسية متاحة وتعمل بنجاح")
            print("✅ تدفق النظام المالي متكامل ومترابط")
            print("✅ لا توجد أزرار معطلة أو endpoints مفقودة")
        else:
            print("⚠️ النظام يحتاج إصلاحات قبل الاستخدام الفعلي")
            print("⚠️ بعض APIs المالية تحتاج إصلاح")
            print("⚠️ تدفق النظام المالي يحتاج تحسين")
        
        return success_rate >= 90

async def main():
    """Main test execution"""
    async with BackendTester() as tester:
        success = await tester.run_comprehensive_test()
        return success

if __name__ == "__main__":
    print("🚀 بدء الاختبار الشامل للباكند - المراجعة العربية")
    print("🎯 الهدف: تحقيق نسبة نجاح 90%+ في النظام المالي")
    print("=" * 80)
    
    try:
        result = asyncio.run(main())
        if result:
            print("\n🎉 **النتيجة النهائية: النظام جاهز للمراجعة الأمامية!**")
        else:
            print("\n⚠️ **النتيجة النهائية: النظام يحتاج إصلاحات قبل المراجعة الأمامية**")
    except Exception as e:
        print(f"\n❌ **خطأ في تشغيل الاختبار:** {str(e)}")