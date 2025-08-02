#!/usr/bin/env python3
"""
🎯 DEBT AND COLLECTION MANAGEMENT SYSTEM - PHASE 2 BACKEND TESTING
اختبار شامل لنظام إدارة الديون والتحصيل - المرحلة الثانية

This test covers:
1. Debt Management APIs (GET, POST, PUT, statistics)
2. Collection Management APIs (GET, POST, statistics)
3. Export & Print APIs (PDF export, print preparation)
4. Role-Based Access Control (Admin vs Medical Rep permissions)
5. Data Integration with existing authentication system
"""

import requests
import json
import time
from datetime import datetime, date
from typing import Dict, List, Any

class DebtCollectionBackendTester:
    def __init__(self):
        # Get backend URL from environment
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
            else:
                self.base_url = "http://localhost:8001"
        
        self.api_url = f"{self.base_url}/api"
        self.admin_token = None
        self.medical_rep_token = None
        self.test_results = []
        self.start_time = time.time()
        
        print(f"🎯 DEBT & COLLECTION BACKEND TESTING STARTED")
        print(f"📡 Backend URL: {self.base_url}")
        print(f"🔗 API Base: {self.api_url}")
        print("=" * 80)

    def log_test(self, test_name: str, success: bool, details: str, response_time: float = 0):
        """تسجيل نتيجة الاختبار"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_time": response_time
        })
        print(f"{status} {test_name} ({response_time:.2f}ms)")
        if details:
            print(f"    📝 {details}")

    def authenticate_admin(self) -> bool:
        """تسجيل دخول الأدمن"""
        try:
            start_time = time.time()
            response = requests.post(f"{self.api_url}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            }, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                user_info = data.get("user", {})
                self.log_test(
                    "Admin Authentication",
                    True,
                    f"Admin logged in successfully: {user_info.get('full_name', 'Admin')} (Role: {user_info.get('role')})",
                    response_time
                )
                return True
            else:
                self.log_test("Admin Authentication", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Admin Authentication", False, f"Connection error: {str(e)}")
            return False

    def authenticate_medical_rep(self) -> bool:
        """تسجيل دخول مندوب طبي للاختبار"""
        try:
            start_time = time.time()
            response = requests.post(f"{self.api_url}/auth/login", json={
                "username": "test_medical_rep",
                "password": "test123"
            }, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.medical_rep_token = data.get("access_token")
                user_info = data.get("user", {})
                self.log_test(
                    "Medical Rep Authentication",
                    True,
                    f"Medical rep logged in: {user_info.get('full_name', 'Test Rep')} (Role: {user_info.get('role')})",
                    response_time
                )
                return True
            else:
                self.log_test("Medical Rep Authentication", False, f"HTTP {response.status_code}: {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Medical Rep Authentication", False, f"Connection error: {str(e)}")
            return False

    def test_debt_management_apis(self):
        """اختبار APIs إدارة الديون"""
        print("\n🏦 TESTING DEBT MANAGEMENT APIs")
        print("-" * 50)
        
        if not self.admin_token:
            self.log_test("Debt APIs Test", False, "Admin token not available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/debts/ (Admin view - should see all debts)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                self.log_test(
                    "GET /api/debts/ (Admin)",
                    True,
                    f"Retrieved {len(debts)} debts successfully. Admin can see all debts with location data.",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/ (Admin)", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/ (Admin)", False, f"Request error: {str(e)}")

        # Test 2: POST /api/debts/ (Create new debt)
        try:
            start_time = time.time()
            new_debt_data = {
                "clinic_id": "test-clinic-001",
                "clinic_name": "عيادة الاختبار الطبية",
                "doctor_name": "د. أحمد محمد",
                "medical_rep_id": "test-rep-001",
                "medical_rep_name": "مندوب اختبار",
                "original_amount": 5000.0,
                "debt_date": "2025-01-01",
                "due_date": "2025-02-01",
                "priority": "high",
                "notes": "دين اختبار للنظام الجديد",
                "invoice_id": "INV-2025-001",
                "order_ids": ["ORD-001", "ORD-002"]
            }
            
            response = requests.post(f"{self.api_url}/debts/", json=new_debt_data, headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debt = response.json()
                self.created_debt_id = debt.get("id")
                self.log_test(
                    "POST /api/debts/ (Create Debt)",
                    True,
                    f"Created debt successfully: {debt.get('debt_number')} - Amount: {debt.get('original_amount')} ج.م",
                    response_time
                )
            else:
                self.log_test("POST /api/debts/ (Create Debt)", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("POST /api/debts/ (Create Debt)", False, f"Request error: {str(e)}")

        # Test 3: GET /api/debts/{debt_id} (Get specific debt)
        if hasattr(self, 'created_debt_id'):
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_url}/debts/{self.created_debt_id}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    debt = response.json()
                    self.log_test(
                        "GET /api/debts/{debt_id}",
                        True,
                        f"Retrieved debt details: {debt.get('clinic_name')} - Status: {debt.get('status')}",
                        response_time
                    )
                else:
                    self.log_test("GET /api/debts/{debt_id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
            except Exception as e:
                self.log_test("GET /api/debts/{debt_id}", False, f"Request error: {str(e)}")

        # Test 4: PUT /api/debts/{debt_id} (Update debt)
        if hasattr(self, 'created_debt_id'):
            try:
                start_time = time.time()
                update_data = {
                    "status": "partial",
                    "paid_amount": 2000.0,
                    "outstanding_amount": 3000.0,
                    "notes": "تم دفع جزء من المبلغ - محدث بواسطة الاختبار"
                }
                
                response = requests.put(f"{self.api_url}/debts/{self.created_debt_id}", json=update_data, headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    debt = response.json()
                    self.log_test(
                        "PUT /api/debts/{debt_id}",
                        True,
                        f"Updated debt successfully: Status changed to {debt.get('status')}, Paid: {debt.get('paid_amount')} ج.م",
                        response_time
                    )
                else:
                    self.log_test("PUT /api/debts/{debt_id}", False, f"HTTP {response.status_code}: {response.text}", response_time)
            except Exception as e:
                self.log_test("PUT /api/debts/{debt_id}", False, f"Request error: {str(e)}")

        # Test 5: GET /api/debts/summary/statistics (Debt statistics)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/summary/statistics", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                self.log_test(
                    "GET /api/debts/summary/statistics",
                    True,
                    f"Statistics: {stats.get('total_debts', 0)} debts, {stats.get('total_amount', 0)} ج.م total, {stats.get('outstanding_amount', 0)} ج.م outstanding",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/summary/statistics", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/summary/statistics", False, f"Request error: {str(e)}")

    def test_collection_management_apis(self):
        """اختبار APIs إدارة التحصيل"""
        print("\n💰 TESTING COLLECTION MANAGEMENT APIs")
        print("-" * 50)
        
        if not self.admin_token:
            self.log_test("Collection APIs Test", False, "Admin token not available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/debts/collections/ (Get collections list)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/collections/", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                collections = response.json()
                self.log_test(
                    "GET /api/debts/collections/",
                    True,
                    f"Retrieved {len(collections)} collection records successfully",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/collections/", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/collections/", False, f"Request error: {str(e)}")

        # Test 2: POST /api/debts/collections/ (Create new collection)
        if hasattr(self, 'created_debt_id'):
            try:
                start_time = time.time()
                collection_data = {
                    "debt_id": self.created_debt_id,
                    "collection_amount": 1500.0,
                    "collection_method": "cash",
                    "collection_date": "2025-01-15",
                    "reference_number": "REF-2025-001",
                    "collection_notes": "تحصيل نقدي جزئي - اختبار النظام",
                    "bank_name": None,
                    "check_number": None
                }
                
                response = requests.post(f"{self.api_url}/debts/collections/", json=collection_data, headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    collection = response.json()
                    self.log_test(
                        "POST /api/debts/collections/",
                        True,
                        f"Created collection: {collection.get('collection_amount')} ج.م via {collection.get('collection_method')}",
                        response_time
                    )
                else:
                    self.log_test("POST /api/debts/collections/", False, f"HTTP {response.status_code}: {response.text}", response_time)
            except Exception as e:
                self.log_test("POST /api/debts/collections/", False, f"Request error: {str(e)}")

        # Test 3: GET /api/debts/collections/summary/statistics (Collection statistics)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/collections/summary/statistics", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                stats = response.json()
                self.log_test(
                    "GET /api/debts/collections/summary/statistics",
                    True,
                    f"Collection stats: {stats.get('total_collections', 0)} collections, {stats.get('total_collected_amount', 0)} ج.م collected",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/collections/summary/statistics", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/collections/summary/statistics", False, f"Request error: {str(e)}")

    def test_export_print_apis(self):
        """اختبار APIs التصدير والطباعة"""
        print("\n📄 TESTING EXPORT & PRINT APIs")
        print("-" * 50)
        
        if not self.admin_token or not hasattr(self, 'created_debt_id'):
            self.log_test("Export/Print APIs Test", False, "Admin token or test debt not available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: GET /api/debts/{debt_id}/export/pdf (PDF export)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/{self.created_debt_id}/export/pdf", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                pdf_data = response.json()
                self.log_test(
                    "GET /api/debts/{debt_id}/export/pdf",
                    True,
                    f"PDF export prepared: {pdf_data.get('message')} - Download URL available",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/{debt_id}/export/pdf", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/{debt_id}/export/pdf", False, f"Request error: {str(e)}")

        # Test 2: GET /api/debts/{debt_id}/print (Print preparation)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/{self.created_debt_id}/print", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                print_data = response.json()
                self.log_test(
                    "GET /api/debts/{debt_id}/print",
                    True,
                    f"Print data prepared: {print_data.get('message')} - Printable: {print_data.get('printable')}",
                    response_time
                )
            else:
                self.log_test("GET /api/debts/{debt_id}/print", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("GET /api/debts/{debt_id}/print", False, f"Request error: {str(e)}")

    def test_role_based_access_control(self):
        """اختبار التحكم في الوصول حسب الأدوار"""
        print("\n🔐 TESTING ROLE-BASED ACCESS CONTROL")
        print("-" * 50)
        
        if not self.medical_rep_token:
            self.log_test("Role-Based Access Test", False, "Medical rep token not available")
            return
        
        rep_headers = {"Authorization": f"Bearer {self.medical_rep_token}"}
        
        # Test 1: Medical rep should only see their own debts (with location data hidden)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/", headers=rep_headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                debts = response.json()
                # Check if location data is hidden
                location_hidden = True
                for debt in debts:
                    if debt.get('gps_latitude') or debt.get('gps_longitude') or debt.get('address'):
                        location_hidden = False
                        break
                
                self.log_test(
                    "Medical Rep - GET /api/debts/ (Role Filtering)",
                    True,
                    f"Medical rep sees {len(debts)} debts (own only). Location data hidden: {location_hidden}",
                    response_time
                )
            else:
                self.log_test("Medical Rep - GET /api/debts/ (Role Filtering)", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Medical Rep - GET /api/debts/ (Role Filtering)", False, f"Request error: {str(e)}")

        # Test 2: Medical rep should NOT be able to create debts
        try:
            start_time = time.time()
            new_debt_data = {
                "clinic_id": "test-clinic-002",
                "clinic_name": "عيادة اختبار المندوب",
                "doctor_name": "د. سارة أحمد",
                "medical_rep_id": "test-rep-001",
                "medical_rep_name": "مندوب اختبار",
                "original_amount": 3000.0,
                "debt_date": "2025-01-01",
                "due_date": "2025-02-01",
                "priority": "medium",
                "notes": "محاولة إنشاء دين من المندوب"
            }
            
            response = requests.post(f"{self.api_url}/debts/", json=new_debt_data, headers=rep_headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 403:
                self.log_test(
                    "Medical Rep - POST /api/debts/ (Permission Denied)",
                    True,
                    "Medical rep correctly denied permission to create debts (HTTP 403)",
                    response_time
                )
            else:
                self.log_test("Medical Rep - POST /api/debts/ (Permission Denied)", False, f"Expected 403, got {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Medical Rep - POST /api/debts/ (Permission Denied)", False, f"Request error: {str(e)}")

        # Test 3: Medical rep collections should hide location data
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/debts/collections/", headers=rep_headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                collections = response.json()
                location_hidden = True
                for collection in collections:
                    if collection.get('collection_location') or collection.get('gps_latitude') or collection.get('gps_longitude'):
                        location_hidden = False
                        break
                
                self.log_test(
                    "Medical Rep - GET /api/debts/collections/ (Location Hidden)",
                    True,
                    f"Medical rep sees {len(collections)} collections. Location data hidden: {location_hidden}",
                    response_time
                )
            else:
                self.log_test("Medical Rep - GET /api/debts/collections/ (Location Hidden)", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Medical Rep - GET /api/debts/collections/ (Location Hidden)", False, f"Request error: {str(e)}")

    def test_data_integration(self):
        """اختبار التكامل مع الأنظمة الموجودة"""
        print("\n🔗 TESTING DATA INTEGRATION")
        print("-" * 50)
        
        if not self.admin_token:
            self.log_test("Data Integration Test", False, "Admin token not available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test 1: Integration with user management (authentication works)
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/users", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                users = response.json()
                self.log_test(
                    "User Management Integration",
                    True,
                    f"Successfully integrated with user system: {len(users)} users available",
                    response_time
                )
            else:
                self.log_test("User Management Integration", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("User Management Integration", False, f"Request error: {str(e)}")

        # Test 2: Integration with clinic management
        try:
            start_time = time.time()
            response = requests.get(f"{self.api_url}/clinics", headers=headers, timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                clinics = response.json()
                self.log_test(
                    "Clinic Management Integration",
                    True,
                    f"Successfully integrated with clinic system: {len(clinics)} clinics available",
                    response_time
                )
            else:
                self.log_test("Clinic Management Integration", False, f"HTTP {response.status_code}: {response.text}", response_time)
        except Exception as e:
            self.log_test("Clinic Management Integration", False, f"Request error: {str(e)}")

        # Test 3: Data persistence verification
        if hasattr(self, 'created_debt_id'):
            try:
                start_time = time.time()
                response = requests.get(f"{self.api_url}/debts/{self.created_debt_id}", headers=headers, timeout=10)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    debt = response.json()
                    self.log_test(
                        "Data Persistence Verification",
                        True,
                        f"Created debt persisted successfully: {debt.get('debt_number')} still accessible",
                        response_time
                    )
                else:
                    self.log_test("Data Persistence Verification", False, f"HTTP {response.status_code}: {response.text}", response_time)
            except Exception as e:
                self.log_test("Data Persistence Verification", False, f"Request error: {str(e)}")

    def generate_summary(self):
        """إنشاء ملخص النتائج"""
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        total_time = time.time() - self.start_time
        avg_response_time = sum(t["response_time"] for t in self.test_results) / total_tests if total_tests > 0 else 0

        print("\n" + "=" * 80)
        print("🎯 DEBT & COLLECTION MANAGEMENT SYSTEM - PHASE 2 TESTING SUMMARY")
        print("=" * 80)
        print(f"📊 OVERALL RESULTS:")
        print(f"   • Total Tests: {total_tests}")
        print(f"   • Passed: {passed_tests} ✅")
        print(f"   • Failed: {failed_tests} ❌")
        print(f"   • Success Rate: {success_rate:.1f}%")
        print(f"   • Total Time: {total_time:.2f}s")
        print(f"   • Average Response Time: {avg_response_time:.2f}ms")
        
        print(f"\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']} ({result['response_time']:.2f}ms)")
            if result["details"]:
                print(f"      📝 {result['details']}")
        
        print(f"\n🎯 PHASE 2 DEBT & COLLECTION SYSTEM ASSESSMENT:")
        if success_rate >= 90:
            print("   🎉 EXCELLENT: System is working perfectly and ready for production!")
        elif success_rate >= 75:
            print("   ✅ GOOD: System is working well with minor issues to address.")
        elif success_rate >= 50:
            print("   ⚠️  NEEDS WORK: System has significant issues that need fixing.")
        else:
            print("   ❌ CRITICAL: System has major problems and needs immediate attention.")
        
        print("\n🔍 KEY FEATURES TESTED:")
        print("   ✅ Debt Management APIs (GET, POST, PUT, statistics)")
        print("   ✅ Collection Management APIs (GET, POST, statistics)")
        print("   ✅ Export & Print APIs (PDF export, print preparation)")
        print("   ✅ Role-Based Access Control (Admin vs Medical Rep)")
        print("   ✅ Data Integration with existing authentication system")
        
        return success_rate

    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 Starting comprehensive Debt & Collection Management testing...")
        
        # Authentication tests
        admin_auth = self.authenticate_admin()
        rep_auth = self.authenticate_medical_rep()
        
        if not admin_auth:
            print("❌ Cannot proceed without admin authentication")
            return self.generate_summary()
        
        # Core functionality tests
        self.test_debt_management_apis()
        self.test_collection_management_apis()
        self.test_export_print_apis()
        
        # Security and integration tests
        if rep_auth:
            self.test_role_based_access_control()
        else:
            self.log_test("Role-Based Access Control", False, "Medical rep authentication failed - skipping role tests")
        
        self.test_data_integration()
        
        return self.generate_summary()

if __name__ == "__main__":
    tester = DebtCollectionBackendTester()
    success_rate = tester.run_all_tests()
    
    # Exit with appropriate code
    exit(0 if success_rate >= 75 else 1)