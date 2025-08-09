#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
اختبار شامل وعميق للنظام بعد تطبيق جميع الإصلاحات لضمان نسبة نجاح 100%
Comprehensive and Deep System Testing After All Fixes Applied for 100% Success Rate

المطلوب اختبار:
- الاختبارات الأساسية: Health, Authentication, Core APIs
- النظام المالي الموحد: Dashboard, Records, Payments
- نظام إدارة الزيارات: Overview, Clinics, Visit Creation
- النظام المالي الموروث: Debts, Payments للتوافق
- فحص المشاكل المحددة: Route conflicts, Authentication, Validation
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# إعدادات الاختبار
class TestConfig:
    def __init__(self):
        # استخدام الـ URL من متغيرات البيئة
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        self.BASE_URL = line.split('=')[1].strip()
                        break
                else:
                    self.BASE_URL = "http://localhost:8001"
        except:
            self.BASE_URL = "http://localhost:8001"
        
        self.API_BASE = f"{self.BASE_URL}/api"
        self.ADMIN_USERNAME = "admin"
        self.ADMIN_PASSWORD = "admin123"
        self.JWT_TOKEN = None
        self.TEST_RESULTS = []
        self.TOTAL_TESTS = 0
        self.PASSED_TESTS = 0
        self.FAILED_TESTS = 0
        self.START_TIME = time.time()

config = TestConfig()

class TestResult:
    def __init__(self, test_name: str, success: bool, response_time: float, 
                 details: str = "", error: str = "", status_code: int = 0):
        self.test_name = test_name
        self.success = success
        self.response_time = response_time
        self.details = details
        self.error = error
        self.status_code = status_code
        self.timestamp = datetime.now()

def make_request(method: str, url: str, headers: Dict = None, json_data: Dict = None, 
                params: Dict = None) -> tuple:
    """إجراء طلب HTTP مع قياس الوقت"""
    start_time = time.time()
    
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=json_data,
            params=params,
            timeout=30
        )
        response_time = (time.time() - start_time) * 1000  # بالميلي ثانية
        
        try:
            response_data = response.json()
        except:
            response_data = response.text
        
        return response.status_code, response_data, response_time
    
    except Exception as e:
        response_time = (time.time() - start_time) * 1000
        return 0, str(e), response_time

def log_test_result(result: TestResult):
    """تسجيل نتيجة الاختبار"""
    config.TEST_RESULTS.append(result)
    config.TOTAL_TESTS += 1
    
    if result.success:
        config.PASSED_TESTS += 1
        status = "✅ PASS"
    else:
        config.FAILED_TESTS += 1
        status = "❌ FAIL"
    
    print(f"{status} | {result.test_name} | {result.response_time:.2f}ms | {result.details}")
    if result.error:
        print(f"      Error: {result.error}")

def test_health_endpoint():
    """اختبار Health Endpoint"""
    print("\n🔍 Testing Health Endpoint...")
    
    status, data, response_time = make_request("GET", f"{config.API_BASE}/health")
    
    success = status == 200
    details = f"Status: {status}"
    error = "" if success else f"Expected 200, got {status}"
    
    log_test_result(TestResult(
        "Health Endpoint Check",
        success, response_time, details, error, status
    ))
    
    return success

def test_authentication():
    """اختبار تسجيل الدخول والمصادقة"""
    print("\n🔐 Testing Authentication...")
    
    login_data = {
        "username": config.ADMIN_USERNAME,
        "password": config.ADMIN_PASSWORD
    }
    
    status, data, response_time = make_request(
        "POST", f"{config.API_BASE}/auth/login", json_data=login_data
    )
    
    success = False
    details = f"Status: {status}"
    error = ""
    
    if status == 200:
        if isinstance(data, dict) and "access_token" in data:
            config.JWT_TOKEN = data["access_token"]
            user_info = data.get("user", {})
            success = True
            details = f"Login successful - User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
        else:
            error = "No access_token in response"
    else:
        error = f"Login failed with status {status}: {data}"
    
    log_test_result(TestResult(
        "Admin Authentication (admin/admin123)",
        success, response_time, details, error, status
    ))
    
    return success

def test_core_system_apis():
    """اختبار Core System APIs"""
    print("\n🏗️ Testing Core System APIs...")
    
    if not config.JWT_TOKEN:
        print("❌ No JWT token available for core API testing")
        return False
    
    headers = {"Authorization": f"Bearer {config.JWT_TOKEN}"}
    
    core_apis = [
        ("GET /api/users", "GET", f"{config.API_BASE}/users"),
        ("GET /api/clinics", "GET", f"{config.API_BASE}/clinics"),
        ("GET /api/products", "GET", f"{config.API_BASE}/products"),
        ("GET /api/dashboard/stats", "GET", f"{config.API_BASE}/dashboard/stats")
    ]
    
    all_success = True
    
    for test_name, method, url in core_apis:
        status, data, response_time = make_request(method, url, headers=headers)
        
        success = status == 200
        if not success:
            all_success = False
        
        if success and isinstance(data, list):
            details = f"Status: {status}, Count: {len(data)} items"
        elif success and isinstance(data, dict):
            details = f"Status: {status}, Data keys: {list(data.keys())}"
        else:
            details = f"Status: {status}"
        
        error = "" if success else f"Expected 200, got {status}: {data}"
        
        log_test_result(TestResult(
            test_name, success, response_time, details, error, status
        ))
    
    return all_success

def test_unified_financial_system():
    """اختبار النظام المالي الموحد"""
    print("\n💰 Testing Unified Financial System...")
    
    if not config.JWT_TOKEN:
        print("❌ No JWT token available for financial system testing")
        return False
    
    headers = {"Authorization": f"Bearer {config.JWT_TOKEN}"}
    
    # Test unified financial endpoints
    financial_tests = [
        ("GET /api/unified-financial/dashboard/overview", "GET", f"{config.API_BASE}/unified-financial/dashboard/overview"),
        ("GET /api/unified-financial/records", "GET", f"{config.API_BASE}/unified-financial/records")
    ]
    
    success_count = 0
    total_count = len(financial_tests)
    
    for test_name, method, url in financial_tests:
        status, data, response_time = make_request(method, url, headers=headers)
        
        success = status == 200
        if success:
            success_count += 1
        
        details = f"Status: {status}"
        if success and isinstance(data, dict):
            details += f", Keys: {list(data.keys())}"
        elif success and isinstance(data, list):
            details += f", Count: {len(data)}"
        
        error = "" if success else f"Expected 200, got {status}: {data}"
        
        log_test_result(TestResult(
            test_name, success, response_time, details, error, status
        ))
    
    # Test creating financial record with enhanced data
    enhanced_record_data = {
        "record_type": "invoice",
        "clinic_id": "clinic-001",
        "original_amount": 1500.00,
        "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "description": "فاتورة موحدة تجريبية"
    }
    
    status, data, response_time = make_request(
        "POST", f"{config.API_BASE}/unified-financial/records",
        headers=headers, json_data=enhanced_record_data
    )
    
    success = status in [200, 201]
    if success:
        success_count += 1
    total_count += 1
    
    details = f"Status: {status}"
    if success:
        details += f", Record created successfully"
    
    error = "" if success else f"Failed to create financial record: {data}"
    
    log_test_result(TestResult(
        "POST /api/unified-financial/records (Enhanced Data)",
        success, response_time, details, error, status
    ))
    
    # Test payment processing
    payment_data = {
        "record_id": "test-record-001",
        "payment_amount": 750.00,
        "payment_method": "cash",
        "notes": "دفعة جزئية اختبارية"
    }
    
    status, data, response_time = make_request(
        "POST", f"{config.API_BASE}/unified-financial/process-payment",
        headers=headers, json_data=payment_data
    )
    
    success = status in [200, 201]
    if success:
        success_count += 1
    total_count += 1
    
    details = f"Status: {status}"
    error = "" if success else f"Payment processing failed: {data}"
    
    log_test_result(TestResult(
        "POST /api/unified-financial/process-payment",
        success, response_time, details, error, status
    ))
    
    return success_count == total_count

def test_visit_management_system():
    """اختبار نظام إدارة الزيارات"""
    print("\n🏥 Testing Visit Management System...")
    
    if not config.JWT_TOKEN:
        print("❌ No JWT token available for visit management testing")
        return False
    
    headers = {"Authorization": f"Bearer {config.JWT_TOKEN}"}
    
    visit_tests = [
        ("GET /api/visits/dashboard/overview", "GET", f"{config.API_BASE}/visits/dashboard/overview"),
        ("GET /api/visits/available-clinics", "GET", f"{config.API_BASE}/visits/available-clinics"),
        ("GET /api/visits/", "GET", f"{config.API_BASE}/visits/")
    ]
    
    success_count = 0
    total_count = len(visit_tests)
    
    for test_name, method, url in visit_tests:
        status, data, response_time = make_request(method, url, headers=headers)
        
        success = status == 200
        if success:
            success_count += 1
        
        details = f"Status: {status}"
        if success and isinstance(data, list):
            details += f", Count: {len(data)}"
        elif success and isinstance(data, dict):
            details += f", Keys: {list(data.keys())}"
        
        error = "" if success else f"Expected 200, got {status}: {data}"
        
        log_test_result(TestResult(
            test_name, success, response_time, details, error, status
        ))
    
    # Test creating visit with enhanced data
    enhanced_visit_data = {
        "clinic_id": "clinic-001",
        "visit_type": "routine",
        "scheduled_date": (datetime.now() + timedelta(days=1)).isoformat(),
        "visit_purpose": "زيارة روتينية للمتابعة"
    }
    
    status, data, response_time = make_request(
        "POST", f"{config.API_BASE}/visits/",
        headers=headers, json_data=enhanced_visit_data
    )
    
    success = status in [200, 201]
    if success:
        success_count += 1
    total_count += 1
    
    details = f"Status: {status}"
    error = "" if success else f"Visit creation failed: {data}"
    
    log_test_result(TestResult(
        "POST /api/visits/ (Enhanced Data)",
        success, response_time, details, error, status
    ))
    
    return success_count == total_count

def test_legacy_financial_system():
    """اختبار النظام المالي الموروث للتوافق"""
    print("\n🏛️ Testing Legacy Financial System (Compatibility)...")
    
    if not config.JWT_TOKEN:
        print("❌ No JWT token available for legacy financial testing")
        return False
    
    headers = {"Authorization": f"Bearer {config.JWT_TOKEN}"}
    
    # Test GET endpoints first
    legacy_get_tests = [
        ("GET /api/debts", "GET", f"{config.API_BASE}/debts"),
        ("GET /api/payments", "GET", f"{config.API_BASE}/payments")
    ]
    
    success_count = 0
    total_count = len(legacy_get_tests)
    
    for test_name, method, url in legacy_get_tests:
        status, data, response_time = make_request(method, url, headers=headers)
        
        success = status == 200
        if success:
            success_count += 1
        
        details = f"Status: {status}"
        if success and isinstance(data, list):
            details += f", Count: {len(data)}"
        
        error = "" if success else f"Expected 200, got {status}: {data}"
        
        log_test_result(TestResult(
            test_name, success, response_time, details, error, status
        ))
    
    # Test creating debt with optional sales_rep_id
    debt_data = {
        "clinic_id": "clinic-001",
        "amount": 2000.00,
        "description": "فاتورة تجريبية محسنة"
        # sales_rep_id is optional as requested
    }
    
    status, data, response_time = make_request(
        "POST", f"{config.API_BASE}/debts",
        headers=headers, json_data=debt_data
    )
    
    success = status in [200, 201]
    if success:
        success_count += 1
    total_count += 1
    
    details = f"Status: {status}"
    if success:
        details += ", Debt created with optional sales_rep_id"
    
    error = "" if success else f"Debt creation failed: {data}"
    
    log_test_result(TestResult(
        "POST /api/debts (Optional sales_rep_id)",
        success, response_time, details, error, status
    ))
    
    return success_count == total_count

def test_specific_issues():
    """فحص المشاكل المحددة"""
    print("\n🔧 Testing Specific Issues...")
    
    if not config.JWT_TOKEN:
        print("❌ No JWT token available for specific issues testing")
        return False
    
    headers = {"Authorization": f"Bearer {config.JWT_TOKEN}"}
    
    # Test for route conflicts and specific issues
    conflict_tests = [
        ("Route Conflict Check - /api/health", "GET", f"{config.API_BASE}/health", None),
        ("Authentication Check", "GET", f"{config.API_BASE}/auth/me", headers),
        ("Database Connectivity", "GET", f"{config.API_BASE}/dashboard/stats", headers)
    ]
    
    success_count = 0
    total_count = len(conflict_tests)
    
    for test_name, method, url, test_headers in conflict_tests:
        status, data, response_time = make_request(method, url, headers=test_headers)
        
        success = status == 200
        if success:
            success_count += 1
        
        details = f"Status: {status}"
        error = "" if success else f"Issue detected: {data}"
        
        log_test_result(TestResult(
            test_name, success, response_time, details, error, status
        ))
    
    return success_count == total_count

def print_comprehensive_summary():
    """طباعة ملخص شامل للنتائج"""
    print("\n" + "="*80)
    print("🎯 COMPREHENSIVE SYSTEM TESTING SUMMARY")
    print("="*80)
    
    total_time = time.time() - config.START_TIME
    success_rate = (config.PASSED_TESTS / config.TOTAL_TESTS * 100) if config.TOTAL_TESTS > 0 else 0
    avg_response_time = sum(r.response_time for r in config.TEST_RESULTS) / len(config.TEST_RESULTS) if config.TEST_RESULTS else 0
    
    print(f"📊 Overall Results:")
    print(f"   • Total Tests: {config.TOTAL_TESTS}")
    print(f"   • Passed: {config.PASSED_TESTS} ✅")
    print(f"   • Failed: {config.FAILED_TESTS} ❌")
    print(f"   • Success Rate: {success_rate:.1f}%")
    print(f"   • Average Response Time: {avg_response_time:.2f}ms")
    print(f"   • Total Execution Time: {total_time:.2f}s")
    
    print(f"\n🔍 Test Categories:")
    
    categories = {
        "Health & Authentication": ["Health Endpoint", "Admin Authentication"],
        "Core System APIs": ["GET /api/users", "GET /api/clinics", "GET /api/products", "GET /api/dashboard/stats"],
        "Unified Financial System": ["unified-financial"],
        "Visit Management": ["visits"],
        "Legacy Financial": ["debts", "payments"],
        "Specific Issues": ["Route Conflict", "Authentication Check", "Database Connectivity"]
    }
    
    for category, keywords in categories.items():
        category_results = [r for r in config.TEST_RESULTS if any(keyword in r.test_name for keyword in keywords)]
        if category_results:
            passed = sum(1 for r in category_results if r.success)
            total = len(category_results)
            rate = (passed / total * 100) if total > 0 else 0
            print(f"   • {category}: {passed}/{total} ({rate:.1f}%)")
    
    if config.FAILED_TESTS > 0:
        print(f"\n❌ Failed Tests Details:")
        for result in config.TEST_RESULTS:
            if not result.success:
                print(f"   • {result.test_name}: {result.error}")
    
    print(f"\n🎯 Final Assessment:")
    if success_rate >= 95:
        print("   🏆 EXCELLENT - System is ready for production!")
    elif success_rate >= 80:
        print("   ✅ GOOD - System works well with minor issues")
    elif success_rate >= 60:
        print("   ⚠️ NEEDS IMPROVEMENT - Several issues need fixing")
    else:
        print("   ❌ CRITICAL - Major issues require immediate attention")
    
    print("="*80)

def main():
    """الدالة الرئيسية للاختبار الشامل"""
    print("🚀 Starting Comprehensive System Testing...")
    print(f"🔗 Backend URL: {config.API_BASE}")
    print(f"👤 Admin Credentials: {config.ADMIN_USERNAME}/{config.ADMIN_PASSWORD}")
    print("="*80)
    
    # 1. اختبار Health Endpoint
    test_health_endpoint()
    
    # 2. اختبار المصادقة
    auth_success = test_authentication()
    
    if not auth_success:
        print("❌ Authentication failed - Cannot proceed with authenticated tests")
        print_comprehensive_summary()
        return
    
    # 3. اختبار Core System APIs
    test_core_system_apis()
    
    # 4. اختبار النظام المالي الموحد
    test_unified_financial_system()
    
    # 5. اختبار نظام إدارة الزيارات
    test_visit_management_system()
    
    # 6. اختبار النظام المالي الموروث
    test_legacy_financial_system()
    
    # 7. فحص المشاكل المحددة
    test_specific_issues()
    
    # طباعة الملخص الشامل
    print_comprehensive_summary()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Testing failed with error: {str(e)}")
        import traceback
        traceback.print_exc()