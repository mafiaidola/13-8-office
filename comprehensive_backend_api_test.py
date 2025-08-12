#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
فحص شامل لجميع APIs المطلوبة للواجهة الأمامية وإصلاح المشاكل المتبقية لتحقيق نسبة نجاح 100%
Comprehensive API Testing for Frontend Requirements - Achieving 100% Success Rate
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class ComprehensiveAPITester:
    def __init__(self):
        # استخدام الـ URL الصحيح من frontend/.env
        self.base_url = "https://medmanage-pro-1.preview.emergentagent.com/api"
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
        # قائمة شاملة بجميع APIs المطلوبة للواجهة الأمامية
        self.required_apis = {
            "dashboard_apis": [
                {"method": "GET", "endpoint": "/dashboard/stats", "description": "إحصائيات لوحة التحكم"},
                {"method": "GET", "endpoint": "/dashboard/recent-activities", "description": "الأنشطة الحديثة"},
                {"method": "GET", "endpoint": "/dashboard/visits", "description": "زيارات لوحة التحكم"},
                {"method": "GET", "endpoint": "/dashboard/collections", "description": "تحصيلات لوحة التحكم"}
            ],
            "general_apis": [
                {"method": "GET", "endpoint": "/users", "description": "قائمة المستخدمين"},
                {"method": "GET", "endpoint": "/clinics", "description": "قائمة العيادات"},
                {"method": "GET", "endpoint": "/products", "description": "قائمة المنتجات"},
                {"method": "GET", "endpoint": "/orders", "description": "قائمة الطلبات"},
                {"method": "GET", "endpoint": "/areas", "description": "قائمة المناطق"},
                {"method": "GET", "endpoint": "/warehouses", "description": "قائمة المخازن"}
            ],
            "financial_system_apis": [
                {"method": "GET", "endpoint": "/financial/dashboard/financial-overview", "description": "نظرة عامة مالية"},
                {"method": "GET", "endpoint": "/financial/invoices", "description": "الفواتير المالية"},
                {"method": "GET", "endpoint": "/financial/debts", "description": "الديون المالية"},
                {"method": "GET", "endpoint": "/debts", "description": "قائمة الديون"},
                {"method": "GET", "endpoint": "/payments", "description": "قائمة المدفوعات"}
            ],
            "additional_apis": [
                {"method": "GET", "endpoint": "/visits", "description": "قائمة الزيارات"},
                {"method": "GET", "endpoint": "/lines", "description": "قائمة الخطوط"},
                {"method": "GET", "endpoint": "/admin/settings", "description": "إعدادات النظام"}
            ]
        }
    
    def login_admin(self) -> bool:
        """تسجيل دخول admin/admin123"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            start_time = time.time()
            response = requests.post(
                f"{self.base_url}/auth/login", 
                json=login_data,
                timeout=30,
                verify=False
            )
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                
                if self.jwt_token:
                    self.test_results.append({
                        "category": "authentication",
                        "endpoint": "/auth/login",
                        "method": "POST",
                        "status": "SUCCESS",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": "تسجيل دخول admin/admin123",
                        "details": f"تم الحصول على JWT token بنجاح - المستخدم: {data.get('user', {}).get('full_name', 'admin')}"
                    })
                    return True
                else:
                    self.test_results.append({
                        "category": "authentication",
                        "endpoint": "/auth/login",
                        "method": "POST",
                        "status": "FAILED",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": "تسجيل دخول admin/admin123",
                        "error": "لم يتم الحصول على JWT token"
                    })
                    return False
            else:
                self.test_results.append({
                    "category": "authentication",
                    "endpoint": "/auth/login",
                    "method": "POST",
                    "status": "FAILED",
                    "http_status": response.status_code,
                    "response_time": response_time,
                    "description": "تسجيل دخول admin/admin123",
                    "error": f"HTTP {response.status_code}: {response.text}"
                })
                return False
        
        except Exception as e:
            self.test_results.append({
                "category": "authentication",
                "endpoint": "/auth/login",
                "method": "POST",
                "status": "ERROR",
                "http_status": 0,
                "response_time": 0,
                "description": "تسجيل دخول admin/admin123",
                "error": f"خطأ في الاتصال: {str(e)}"
            })
            return False
    
    def test_api_endpoint(self, category: str, api_info: Dict[str, str]) -> Dict[str, Any]:
        """اختبار endpoint محدد"""
        method = api_info["method"]
        endpoint = api_info["endpoint"]
        description = api_info["description"]
        
        try:
            headers = {}
            if self.jwt_token:
                headers["Authorization"] = f"Bearer {self.jwt_token}"
            
            start_time = time.time()
            
            if method == "GET":
                response = requests.get(
                    f"{self.base_url}{endpoint}",
                    headers=headers,
                    timeout=30,
                    verify=False
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        data_size = len(str(data))
                        
                        # تحليل البيانات المُرجعة
                        data_analysis = self.analyze_response_data(data, endpoint)
                        
                        return {
                            "category": category,
                            "endpoint": endpoint,
                            "method": method,
                            "status": "SUCCESS",
                            "http_status": response.status_code,
                            "response_time": response_time,
                            "description": description,
                            "details": f"البيانات: {data_analysis['summary']} | حجم الاستجابة: {data_size} حرف",
                            "data_analysis": data_analysis
                        }
                    except json.JSONDecodeError:
                        text_data = response.text
                        return {
                            "category": category,
                            "endpoint": endpoint,
                            "method": method,
                            "status": "SUCCESS",
                            "http_status": response.status_code,
                            "response_time": response_time,
                            "description": description,
                            "details": f"استجابة نصية: {len(text_data)} حرف"
                        }
                
                elif response.status_code == 404:
                    return {
                        "category": category,
                        "endpoint": endpoint,
                        "method": method,
                        "status": "NOT_FOUND",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": description,
                        "error": f"API غير موجود - {response.text}",
                        "needs_implementation": True
                    }
                
                elif response.status_code == 403:
                    return {
                        "category": category,
                        "endpoint": endpoint,
                        "method": method,
                        "status": "FORBIDDEN",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": description,
                        "error": "غير مصرح - مشكلة في الصلاحيات"
                    }
                
                elif response.status_code == 500:
                    return {
                        "category": category,
                        "endpoint": endpoint,
                        "method": method,
                        "status": "SERVER_ERROR",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": description,
                        "error": f"خطأ خادم - {response.text}",
                        "needs_fix": True
                    }
                
                else:
                    return {
                        "category": category,
                        "endpoint": endpoint,
                        "method": method,
                        "status": "FAILED",
                        "http_status": response.status_code,
                        "response_time": response_time,
                        "description": description,
                        "error": f"HTTP {response.status_code}: {response.text}"
                    }
            
            else:  # POST, PUT, DELETE methods
                return {
                    "category": category,
                    "endpoint": endpoint,
                    "method": method,
                    "status": "SKIPPED",
                    "http_status": 0,
                    "response_time": 0,
                    "description": description,
                    "details": "تم تخطي اختبار الطرق غير GET في هذا الفحص"
                }
        
        except requests.exceptions.Timeout:
            return {
                "category": category,
                "endpoint": endpoint,
                "method": method,
                "status": "TIMEOUT",
                "http_status": 0,
                "response_time": 30000,
                "description": description,
                "error": "انتهت مهلة الاتصال (30 ثانية)"
            }
        
        except Exception as e:
            return {
                "category": category,
                "endpoint": endpoint,
                "method": method,
                "status": "ERROR",
                "http_status": 0,
                "response_time": 0,
                "description": description,
                "error": f"خطأ في الاتصال: {str(e)}"
            }
    
    def analyze_response_data(self, data: Any, endpoint: str) -> Dict[str, Any]:
        """تحليل البيانات المُرجعة من API"""
        analysis = {
            "type": type(data).__name__,
            "summary": "",
            "count": 0,
            "has_data": False,
            "structure": {}
        }
        
        if isinstance(data, list):
            analysis["count"] = len(data)
            analysis["has_data"] = len(data) > 0
            analysis["summary"] = f"قائمة تحتوي على {len(data)} عنصر"
            
            if data and isinstance(data[0], dict):
                analysis["structure"] = list(data[0].keys())[:5]  # أول 5 مفاتيح
        
        elif isinstance(data, dict):
            analysis["count"] = len(data.keys())
            analysis["has_data"] = len(data) > 0
            analysis["summary"] = f"كائن يحتوي على {len(data)} حقل"
            analysis["structure"] = list(data.keys())[:10]  # أول 10 مفاتيح
            
            # تحليل خاص لإحصائيات لوحة التحكم
            if "stats" in endpoint or "dashboard" in endpoint:
                if "orders" in data:
                    analysis["summary"] += f" | طلبات: {data.get('orders', {}).get('count', 0)}"
                if "users" in data:
                    analysis["summary"] += f" | مستخدمين: {data.get('users', {}).get('total', 0)}"
                if "clinics" in data:
                    analysis["summary"] += f" | عيادات: {data.get('clinics', {}).get('total', 0)}"
        
        else:
            analysis["summary"] = f"قيمة من نوع {type(data).__name__}"
            analysis["has_data"] = data is not None
        
        return analysis
    
    def run_comprehensive_test(self):
        """تشغيل الفحص الشامل لجميع APIs"""
        print("🚀 بدء الفحص الشامل لجميع APIs المطلوبة للواجهة الأمامية...")
        print("=" * 80)
        
        # 1. تسجيل الدخول
        print("1️⃣ تسجيل دخول admin/admin123...")
        login_success = self.login_admin()
        
        if not login_success:
            print("❌ فشل تسجيل الدخول - لا يمكن متابعة الاختبار")
            return
        
        print("✅ تم تسجيل الدخول بنجاح")
        
        # 2. اختبار جميع APIs
        total_apis = sum(len(apis) for apis in self.required_apis.values())
        current_api = 0
        
        for category, apis in self.required_apis.items():
            print(f"\n2️⃣ اختبار {category.replace('_', ' ').title()}...")
            
            for api_info in apis:
                current_api += 1
                print(f"   [{current_api}/{total_apis}] اختبار {api_info['endpoint']}...")
                
                result = self.test_api_endpoint(category, api_info)
                self.test_results.append(result)
                
                # طباعة النتيجة الفورية
                if result["status"] == "SUCCESS":
                    print(f"   ✅ {api_info['endpoint']} - {result.get('details', 'نجح')}")
                elif result["status"] == "NOT_FOUND":
                    print(f"   ❌ {api_info['endpoint']} - غير موجود (404)")
                elif result["status"] == "SERVER_ERROR":
                    print(f"   🔥 {api_info['endpoint']} - خطأ خادم (500)")
                elif result["status"] == "FORBIDDEN":
                    print(f"   🚫 {api_info['endpoint']} - غير مصرح (403)")
                else:
                    print(f"   ⚠️ {api_info['endpoint']} - {result.get('error', 'فشل')}")
                
                # تأخير قصير لتجنب إرهاق الخادم
                time.sleep(0.1)
        
        # 3. تحليل النتائج وإنتاج التقرير
        self.generate_comprehensive_report()
    
    def generate_comprehensive_report(self):
        """إنتاج تقرير شامل للنتائج"""
        total_time = time.time() - self.start_time
        
        # تصنيف النتائج
        success_count = len([r for r in self.test_results if r["status"] == "SUCCESS"])
        not_found_count = len([r for r in self.test_results if r["status"] == "NOT_FOUND"])
        server_error_count = len([r for r in self.test_results if r["status"] == "SERVER_ERROR"])
        forbidden_count = len([r for r in self.test_results if r["status"] == "FORBIDDEN"])
        error_count = len([r for r in self.test_results if r["status"] in ["ERROR", "TIMEOUT", "FAILED"]])
        
        total_tests = len(self.test_results)
        success_rate = (success_count / total_tests * 100) if total_tests > 0 else 0
        
        print("\n" + "=" * 80)
        print("📊 تقرير شامل لفحص APIs المطلوبة للواجهة الأمامية")
        print("=" * 80)
        
        print(f"⏱️ إجمالي وقت الفحص: {total_time:.2f} ثانية")
        print(f"🎯 إجمالي APIs المختبرة: {total_tests}")
        print(f"✅ نجح: {success_count}")
        print(f"❌ غير موجود (404): {not_found_count}")
        print(f"🔥 خطأ خادم (500): {server_error_count}")
        print(f"🚫 غير مصرح (403): {forbidden_count}")
        print(f"⚠️ أخطاء أخرى: {error_count}")
        print(f"📈 معدل النجاح: {success_rate:.1f}%")
        
        # تفاصيل APIs الناجحة
        print(f"\n✅ APIs الناجحة ({success_count}):")
        successful_apis = [r for r in self.test_results if r["status"] == "SUCCESS"]
        for result in successful_apis:
            response_time = result.get("response_time", 0)
            details = result.get("details", "")
            print(f"   • {result['endpoint']} ({response_time:.1f}ms) - {details}")
        
        # APIs المفقودة (404)
        if not_found_count > 0:
            print(f"\n❌ APIs المفقودة - تحتاج تطبيق ({not_found_count}):")
            missing_apis = [r for r in self.test_results if r["status"] == "NOT_FOUND"]
            for result in missing_apis:
                print(f"   • {result['endpoint']} - {result['description']}")
        
        # APIs بأخطاء خادم (500)
        if server_error_count > 0:
            print(f"\n🔥 APIs بأخطاء خادم - تحتاج إصلاح ({server_error_count}):")
            server_error_apis = [r for r in self.test_results if r["status"] == "SERVER_ERROR"]
            for result in server_error_apis:
                print(f"   • {result['endpoint']} - {result.get('error', 'خطأ خادم')}")
        
        # APIs غير مصرح بها (403)
        if forbidden_count > 0:
            print(f"\n🚫 APIs غير مصرح بها - مشكلة صلاحيات ({forbidden_count}):")
            forbidden_apis = [r for r in self.test_results if r["status"] == "FORBIDDEN"]
            for result in forbidden_apis:
                print(f"   • {result['endpoint']} - {result['description']}")
        
        # أخطاء أخرى
        if error_count > 0:
            print(f"\n⚠️ أخطاء أخرى ({error_count}):")
            error_apis = [r for r in self.test_results if r["status"] in ["ERROR", "TIMEOUT", "FAILED"]]
            for result in error_apis:
                print(f"   • {result['endpoint']} - {result.get('error', 'خطأ غير محدد')}")
        
        # توصيات للإصلاح
        print(f"\n🔧 توصيات الإصلاح:")
        
        if not_found_count > 0:
            print(f"   1. تطبيق {not_found_count} APIs مفقودة في الباكند")
        
        if server_error_count > 0:
            print(f"   2. إصلاح {server_error_count} APIs تعطي أخطاء خادم")
        
        if forbidden_count > 0:
            print(f"   3. مراجعة صلاحيات {forbidden_count} APIs غير مصرح بها")
        
        if success_rate < 100:
            print(f"   4. الهدف: الوصول لمعدل نجاح 100% (حالياً {success_rate:.1f}%)")
        else:
            print(f"   🎉 ممتاز! جميع APIs تعمل بنسبة 100%")
        
        # خلاصة نهائية
        print(f"\n🎯 الخلاصة النهائية:")
        if success_rate >= 90:
            print(f"   🟢 النظام في حالة ممتازة - معدل النجاح {success_rate:.1f}%")
        elif success_rate >= 70:
            print(f"   🟡 النظام في حالة جيدة - يحتاج تحسينات بسيطة - معدل النجاح {success_rate:.1f}%")
        else:
            print(f"   🔴 النظام يحتاج إصلاحات كبيرة - معدل النجاح {success_rate:.1f}%")
        
        print("=" * 80)

def main():
    """الدالة الرئيسية"""
    tester = ComprehensiveAPITester()
    tester.run_comprehensive_test()

if __name__ == "__main__":
    main()