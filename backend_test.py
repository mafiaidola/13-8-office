#!/usr/bin/env python3
"""
Comprehensive Invoice and Debt System Testing - Arabic Review
اختبار شامل لنظام الفواتير والديون - المراجعة العربية

This test covers:
1. Invoice System Testing (POST /api/invoices, GET /api/invoices, etc.)
2. Debt System Testing (GET /api/debts, POST /api/debts/payments, etc.) 
3. Complete Workflow Testing (create invoice → approve → convert to debt → assign rep → record payment)
4. Data Integrity Verification
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any
import uuid

class ComprehensiveFinancialSystemTester:
    def __init__(self):
        # Get backend URL from environment
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    self.base_url = line.split('=')[1].strip()
                    break
        else:
            self.base_url = "http://localhost:8001"
        
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.test_data = {}
        
        print(f"🔗 Backend URL: {self.base_url}")
        print("🎯 اختبار شامل لنظام الفواتير والديون - المراجعة العربية")
        print("=" * 80)

    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()

    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()

    async def login_admin(self) -> bool:
        """Login as admin to get JWT token"""
        try:
            start_time = time.time()
            
            login_data = {
                "username": "admin",
                "password": "admin123",
                "geolocation": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "city": "القاهرة",
                    "country": "مصر"
                }
            }
            
            async with self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data.get("access_token")
                    user_info = data.get("user", {})
                    
                    self.test_results.append({
                        "test": "Admin Login",
                        "status": "✅ PASS",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"User: {user_info.get('full_name', 'Unknown')}, Role: {user_info.get('role', 'Unknown')}"
                    })
                    return True
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Admin Login",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Login",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False

    async def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        if not self.auth_token:
            raise Exception("No auth token available")
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

    async def test_invoice_system(self) -> Dict[str, Any]:
        """Test comprehensive invoice system"""
        print("\n📋 اختبار نظام الفواتير...")
        invoice_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "details": []
        }
        
        # Test 1: Create Invoice
        try:
            start_time = time.time()
            invoice_results["total_tests"] += 1
            
            # Get a clinic and user for the invoice
            clinics_response = await self.session.get(
                f"{self.base_url}/api/clinics",
                headers=await self.get_auth_headers()
            )
            
            users_response = await self.session.get(
                f"{self.base_url}/api/users",
                headers=await self.get_auth_headers()
            )
            
            products_response = await self.session.get(
                f"{self.base_url}/api/products",
                headers=await self.get_auth_headers()
            )
            
            if clinics_response.status == 200 and users_response.status == 200 and products_response.status == 200:
                clinics = await clinics_response.json()
                users = await users_response.json()
                products = await products_response.json()
                
                # Find suitable data
                clinic = None
                sales_rep = None
                product = None
                
                if isinstance(clinics, list) and len(clinics) > 0:
                    clinic = clinics[0]
                elif isinstance(clinics, dict) and clinics.get('clinics'):
                    clinic = clinics['clinics'][0] if len(clinics['clinics']) > 0 else None
                
                if isinstance(users, list) and len(users) > 0:
                    sales_rep = users[0]
                elif isinstance(users, dict) and users.get('users'):
                    sales_rep = users['users'][0] if len(users['users']) > 0 else None
                
                if isinstance(products, list) and len(products) > 0:
                    product = products[0]
                elif isinstance(products, dict) and products.get('products'):
                    product = products['products'][0] if len(products['products']) > 0 else None
                
                if clinic and sales_rep and product:
                    invoice_data = {
                        "clinic_id": clinic.get("id", str(uuid.uuid4())),
                        "clinic_name": clinic.get("name", "عيادة الاختبار"),
                        "doctor_name": clinic.get("doctor_name", "د. أحمد محمد"),
                        "clinic_address": clinic.get("address", "القاهرة، مصر"),
                        "clinic_phone": clinic.get("phone", "01234567890"),
                        "clinic_email": clinic.get("email", "test@clinic.com"),
                        "sales_rep_id": sales_rep.get("id", str(uuid.uuid4())),
                        "sales_rep_name": sales_rep.get("full_name", "مندوب الاختبار"),
                        "line_id": sales_rep.get("line_id", "line-001"),
                        "area_id": sales_rep.get("area_id", "area-001"),
                        "items": [
                            {
                                "product_id": product.get("id", str(uuid.uuid4())),
                                "product_name": product.get("name", "منتج الاختبار"),
                                "quantity": 10,
                                "unit_price": float(product.get("price", 50.0)),
                                "unit": "box",
                                "discount_percentage": 5.0,
                                "discount_amount": 25.0,
                                "tax_percentage": 14.0,
                                "tax_amount": 70.0,
                                "description": "منتج للاختبار الشامل"
                            }
                        ],
                        "due_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                        "notes": "فاتورة اختبار شاملة للنظام المالي",
                        "payment_terms": "30 يوم من تاريخ الفاتورة"
                    }
                    
                    async with self.session.post(
                        f"{self.base_url}/api/invoices",
                        json=invoice_data,
                        headers=await self.get_auth_headers()
                    ) as response:
                        response_time = (time.time() - start_time) * 1000
                        
                        if response.status == 200:
                            data = await response.json()
                            if data.get("success") and data.get("invoice"):
                                invoice_results["passed_tests"] += 1
                                self.test_data["created_invoice"] = data["invoice"]
                                invoice_results["details"].append({
                                    "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                                    "status": "✅ PASS",
                                    "response_time": f"{response_time:.2f}ms",
                                    "details": f"Invoice Number: {data['invoice']['invoice_number']}, Amount: {data['invoice']['total_amount']} ج.م"
                                })
                            else:
                                invoice_results["failed_tests"] += 1
                                invoice_results["details"].append({
                                    "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                                    "status": "❌ FAIL",
                                    "response_time": f"{response_time:.2f}ms",
                                    "details": "Invalid response format"
                                })
                        else:
                            invoice_results["failed_tests"] += 1
                            error_text = await response.text()
                            invoice_results["details"].append({
                                "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"HTTP {response.status}: {error_text}"
                            })
                else:
                    invoice_results["failed_tests"] += 1
                    invoice_results["details"].append({
                        "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                        "status": "❌ FAIL",
                        "response_time": "N/A",
                        "details": f"Missing required data - Clinic: {clinic is not None}, Sales Rep: {sales_rep is not None}, Product: {product is not None}"
                    })
            else:
                invoice_results["failed_tests"] += 1
                invoice_results["details"].append({
                    "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                    "status": "❌ FAIL",
                    "response_time": "N/A",
                    "details": f"Failed to get prerequisite data - Clinics: {clinics_response.status}, Users: {users_response.status}, Products: {products_response.status}"
                })
                
        except Exception as e:
            invoice_results["failed_tests"] += 1
            invoice_results["details"].append({
                "test": "POST /api/invoices (إنشاء فاتورة جديدة)",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 2: Get Invoices
        try:
            start_time = time.time()
            invoice_results["total_tests"] += 1
            
            async with self.session.get(
                f"{self.base_url}/api/invoices",
                headers=await self.get_auth_headers()
            ) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        invoice_results["passed_tests"] += 1
                        invoices = data.get("invoices", [])
                        invoice_results["details"].append({
                            "test": "GET /api/invoices (جلب الفواتير)",
                            "status": "✅ PASS",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"Found {len(invoices)} invoices, Total Count: {data.get('total_count', 0)}"
                        })
                    else:
                        invoice_results["failed_tests"] += 1
                        invoice_results["details"].append({
                            "test": "GET /api/invoices (جلب الفواتير)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "Invalid response format"
                        })
                else:
                    invoice_results["failed_tests"] += 1
                    error_text = await response.text()
                    invoice_results["details"].append({
                        "test": "GET /api/invoices (جلب الفواتير)",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            invoice_results["failed_tests"] += 1
            invoice_results["details"].append({
                "test": "GET /api/invoices (جلب الفواتير)",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 3: Get Invoice Details
        if self.test_data.get("created_invoice"):
            try:
                start_time = time.time()
                invoice_results["total_tests"] += 1
                invoice_id = self.test_data["created_invoice"]["id"]
                
                async with self.session.get(
                    f"{self.base_url}/api/invoices/{invoice_id}",
                    headers=await self.get_auth_headers()
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success") and data.get("invoice"):
                            invoice_results["passed_tests"] += 1
                            invoice = data["invoice"]
                            invoice_results["details"].append({
                                "test": f"GET /api/invoices/{invoice_id} (تفاصيل فاتورة)",
                                "status": "✅ PASS",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Invoice: {invoice.get('invoice_number')}, Status: {invoice.get('status')}, Amount: {invoice.get('total_amount')} ج.م"
                            })
                        else:
                            invoice_results["failed_tests"] += 1
                            invoice_results["details"].append({
                                "test": f"GET /api/invoices/{invoice_id} (تفاصيل فاتورة)",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": "Invalid response format"
                            })
                    else:
                        invoice_results["failed_tests"] += 1
                        error_text = await response.text()
                        invoice_results["details"].append({
                            "test": f"GET /api/invoices/{invoice_id} (تفاصيل فاتورة)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                invoice_results["failed_tests"] += 1
                invoice_results["details"].append({
                    "test": f"GET /api/invoices/{invoice_id} (تفاصيل فاتورة)",
                    "status": "❌ ERROR",
                    "response_time": "N/A",
                    "details": f"Exception: {str(e)}"
                })

        # Test 4: Approve Invoice
        if self.test_data.get("created_invoice"):
            try:
                start_time = time.time()
                invoice_results["total_tests"] += 1
                invoice_id = self.test_data["created_invoice"]["id"]
                
                approval_data = {
                    "convert_to_debt": True,
                    "approval_notes": "تم اعتماد الفاتورة وتحويلها إلى دين للتحصيل"
                }
                
                async with self.session.put(
                    f"{self.base_url}/api/invoices/{invoice_id}/approve",
                    json=approval_data,
                    headers=await self.get_auth_headers()
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success"):
                            invoice_results["passed_tests"] += 1
                            self.test_data["debt_id"] = data.get("debt_id")
                            invoice_results["details"].append({
                                "test": f"PUT /api/invoices/{invoice_id}/approve (اعتماد فاتورة)",
                                "status": "✅ PASS",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Invoice approved, Debt Created: {data.get('debt_created')}, Debt ID: {data.get('debt_id', 'N/A')}"
                            })
                        else:
                            invoice_results["failed_tests"] += 1
                            invoice_results["details"].append({
                                "test": f"PUT /api/invoices/{invoice_id}/approve (اعتماد فاتورة)",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": "Invalid response format"
                            })
                    else:
                        invoice_results["failed_tests"] += 1
                        error_text = await response.text()
                        invoice_results["details"].append({
                            "test": f"PUT /api/invoices/{invoice_id}/approve (اعتماد فاتورة)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                invoice_results["failed_tests"] += 1
                invoice_results["details"].append({
                    "test": f"PUT /api/invoices/{invoice_id}/approve (اعتماد فاتورة)",
                    "status": "❌ ERROR",
                    "response_time": "N/A",
                    "details": f"Exception: {str(e)}"
                })

        # Test 5: Invoice Statistics
        try:
            start_time = time.time()
            invoice_results["total_tests"] += 1
            
            async with self.session.get(
                f"{self.base_url}/api/invoices/statistics/overview",
                headers=await self.get_auth_headers()
            ) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("statistics"):
                        invoice_results["passed_tests"] += 1
                        stats = data["statistics"]
                        invoice_results["details"].append({
                            "test": "GET /api/invoices/statistics/overview (إحصائيات الفواتير)",
                            "status": "✅ PASS",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"Total: {stats.get('total_invoices', 0)}, Value: {stats.get('total_value', 0)} ج.م, Overdue: {stats.get('overdue_invoices', 0)}"
                        })
                    else:
                        invoice_results["failed_tests"] += 1
                        invoice_results["details"].append({
                            "test": "GET /api/invoices/statistics/overview (إحصائيات الفواتير)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "Invalid response format"
                        })
                else:
                    invoice_results["failed_tests"] += 1
                    error_text = await response.text()
                    invoice_results["details"].append({
                        "test": "GET /api/invoices/statistics/overview (إحصائيات الفواتير)",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            invoice_results["failed_tests"] += 1
            invoice_results["details"].append({
                "test": "GET /api/invoices/statistics/overview (إحصائيات الفواتير)",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        return invoice_results

    async def test_debt_system(self) -> Dict[str, Any]:
        """Test comprehensive debt system"""
        print("\n💰 اختبار نظام الديون...")
        debt_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "details": []
        }
        
        # Test 1: Get Debts
        try:
            start_time = time.time()
            debt_results["total_tests"] += 1
            
            async with self.session.get(
                f"{self.base_url}/api/debts",
                headers=await self.get_auth_headers()
            ) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success"):
                        debt_results["passed_tests"] += 1
                        debts = data.get("debts", [])
                        summary = data.get("summary", {})
                        debt_results["details"].append({
                            "test": "GET /api/debts (جلب الديون)",
                            "status": "✅ PASS",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"Found {len(debts)} debts, Outstanding: {summary.get('total_outstanding', 0)} ج.م, Collection Rate: {summary.get('collection_rate', 0)}%"
                        })
                    else:
                        debt_results["failed_tests"] += 1
                        debt_results["details"].append({
                            "test": "GET /api/debts (جلب الديون)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "Invalid response format"
                        })
                else:
                    debt_results["failed_tests"] += 1
                    error_text = await response.text()
                    debt_results["details"].append({
                        "test": "GET /api/debts (جلب الديون)",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            debt_results["failed_tests"] += 1
            debt_results["details"].append({
                "test": "GET /api/debts (جلب الديون)",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 2: Get Debt Details
        if self.test_data.get("debt_id"):
            try:
                start_time = time.time()
                debt_results["total_tests"] += 1
                debt_id = self.test_data["debt_id"]
                
                async with self.session.get(
                    f"{self.base_url}/api/debts/{debt_id}",
                    headers=await self.get_auth_headers()
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success") and data.get("debt"):
                            debt_results["passed_tests"] += 1
                            debt = data["debt"]
                            debt_results["details"].append({
                                "test": f"GET /api/debts/{debt_id} (تفاصيل دين)",
                                "status": "✅ PASS",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Debt: {debt.get('debt_number')}, Status: {debt.get('status')}, Remaining: {debt.get('remaining_amount')} ج.م"
                            })
                        else:
                            debt_results["failed_tests"] += 1
                            debt_results["details"].append({
                                "test": f"GET /api/debts/{debt_id} (تفاصيل دين)",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": "Invalid response format"
                            })
                    else:
                        debt_results["failed_tests"] += 1
                        error_text = await response.text()
                        debt_results["details"].append({
                            "test": f"GET /api/debts/{debt_id} (تفاصيل دين)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                debt_results["failed_tests"] += 1
                debt_results["details"].append({
                    "test": f"GET /api/debts/{debt_id} (تفاصيل دين)",
                    "status": "❌ ERROR",
                    "response_time": "N/A",
                    "details": f"Exception: {str(e)}"
                })

        # Test 3: Record Payment
        if self.test_data.get("debt_id"):
            try:
                start_time = time.time()
                debt_results["total_tests"] += 1
                debt_id = self.test_data["debt_id"]
                
                payment_data = {
                    "amount": 100.0,
                    "payment_method": "cash",
                    "payment_date": datetime.utcnow().isoformat(),
                    "reference_number": f"PAY-{int(time.time())}",
                    "notes": "دفعة جزئية - اختبار النظام"
                }
                
                async with self.session.post(
                    f"{self.base_url}/api/debts/{debt_id}/payments",
                    json=payment_data,
                    headers=await self.get_auth_headers()
                ) as response:
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status == 200:
                        data = await response.json()
                        if data.get("success"):
                            debt_results["passed_tests"] += 1
                            debt = data.get("debt", {})
                            debt_results["details"].append({
                                "test": f"POST /api/debts/{debt_id}/payments (تسجيل دفعة)",
                                "status": "✅ PASS",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Payment: {payment_data['amount']} ج.م, New Status: {debt.get('status')}, Remaining: {debt.get('remaining_amount')} ج.م"
                            })
                        else:
                            debt_results["failed_tests"] += 1
                            debt_results["details"].append({
                                "test": f"POST /api/debts/{debt_id}/payments (تسجيل دفعة)",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": "Invalid response format"
                            })
                    else:
                        debt_results["failed_tests"] += 1
                        error_text = await response.text()
                        debt_results["details"].append({
                            "test": f"POST /api/debts/{debt_id}/payments (تسجيل دفعة)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"HTTP {response.status}: {error_text}"
                        })
                        
            except Exception as e:
                debt_results["failed_tests"] += 1
                debt_results["details"].append({
                    "test": f"POST /api/debts/{debt_id}/payments (تسجيل دفعة)",
                    "status": "❌ ERROR",
                    "response_time": "N/A",
                    "details": f"Exception: {str(e)}"
                })

        # Test 4: Assign Debt to Representative
        if self.test_data.get("debt_id"):
            try:
                start_time = time.time()
                debt_results["total_tests"] += 1
                debt_id = self.test_data["debt_id"]
                
                # Get a user to assign the debt to
                users_response = await self.session.get(
                    f"{self.base_url}/api/users",
                    headers=await self.get_auth_headers()
                )
                
                if users_response.status == 200:
                    users_data = await users_response.json()
                    users = users_data if isinstance(users_data, list) else users_data.get('users', [])
                    
                    if users:
                        assigned_user = users[0]
                        assignment_data = {
                            "debt_id": debt_id,
                            "assigned_to_id": assigned_user.get("id", str(uuid.uuid4())),
                            "assigned_to_name": assigned_user.get("full_name", "مندوب التحصيل"),
                            "priority": "high",
                            "notes": "تعيين للتحصيل العاجل - اختبار النظام"
                        }
                        
                        async with self.session.put(
                            f"{self.base_url}/api/debts/{debt_id}/assign",
                            json=assignment_data,
                            headers=await self.get_auth_headers()
                        ) as response:
                            response_time = (time.time() - start_time) * 1000
                            
                            if response.status == 200:
                                data = await response.json()
                                if data.get("success"):
                                    debt_results["passed_tests"] += 1
                                    debt = data.get("debt", {})
                                    debt_results["details"].append({
                                        "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                                        "status": "✅ PASS",
                                        "response_time": f"{response_time:.2f}ms",
                                        "details": f"Assigned to: {debt.get('assigned_to_name')}, Priority: {assignment_data['priority']}"
                                    })
                                else:
                                    debt_results["failed_tests"] += 1
                                    debt_results["details"].append({
                                        "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                                        "status": "❌ FAIL",
                                        "response_time": f"{response_time:.2f}ms",
                                        "details": "Invalid response format"
                                    })
                            else:
                                debt_results["failed_tests"] += 1
                                error_text = await response.text()
                                debt_results["details"].append({
                                    "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                                    "status": "❌ FAIL",
                                    "response_time": f"{response_time:.2f}ms",
                                    "details": f"HTTP {response.status}: {error_text}"
                                })
                    else:
                        debt_results["failed_tests"] += 1
                        debt_results["details"].append({
                            "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "No users available for assignment"
                        })
                else:
                    debt_results["failed_tests"] += 1
                    debt_results["details"].append({
                        "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"Failed to get users for assignment: HTTP {users_response.status}"
                    })
                    
            except Exception as e:
                debt_results["failed_tests"] += 1
                debt_results["details"].append({
                    "test": f"PUT /api/debts/{debt_id}/assign (تعيين مندوب)",
                    "status": "❌ ERROR",
                    "response_time": "N/A",
                    "details": f"Exception: {str(e)}"
                })

        # Test 5: Debt Statistics
        try:
            start_time = time.time()
            debt_results["total_tests"] += 1
            
            async with self.session.get(
                f"{self.base_url}/api/debts/statistics/overview",
                headers=await self.get_auth_headers()
            ) as response:
                response_time = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and data.get("statistics"):
                        debt_results["passed_tests"] += 1
                        stats = data["statistics"]
                        debt_results["details"].append({
                            "test": "GET /api/debts/statistics/overview (إحصائيات الديون)",
                            "status": "✅ PASS",
                            "response_time": f"{response_time:.2f}ms",
                            "details": f"Total: {stats.get('total_debts', 0)}, Outstanding: {stats.get('total_outstanding', 0)} ج.م, Collection Rate: {stats.get('collection_rate', 0)}%"
                        })
                    else:
                        debt_results["failed_tests"] += 1
                        debt_results["details"].append({
                            "test": "GET /api/debts/statistics/overview (إحصائيات الديون)",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "Invalid response format"
                        })
                else:
                    debt_results["failed_tests"] += 1
                    error_text = await response.text()
                    debt_results["details"].append({
                        "test": "GET /api/debts/statistics/overview (إحصائيات الديون)",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    
        except Exception as e:
            debt_results["failed_tests"] += 1
            debt_results["details"].append({
                "test": "GET /api/debts/statistics/overview (إحصائيات الديون)",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        return debt_results

    async def test_complete_workflow(self) -> Dict[str, Any]:
        """Test complete financial workflow"""
        print("\n🔄 اختبار التدفق الكامل...")
        workflow_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "details": []
        }
        
        # Test 1: New Clinic Invoice Scenario
        try:
            start_time = time.time()
            workflow_results["total_tests"] += 1
            
            # Create a complete scenario: New clinic gets products, invoice created, approved, converted to debt, payment recorded
            scenario_success = True
            scenario_details = []
            
            # Step 1: Get clinic data
            clinics_response = await self.session.get(
                f"{self.base_url}/api/clinics",
                headers=await self.get_auth_headers()
            )
            
            if clinics_response.status == 200:
                clinics_data = await clinics_response.json()
                clinics = clinics_data if isinstance(clinics_data, list) else clinics_data.get('clinics', [])
                if clinics:
                    scenario_details.append(f"✅ Found {len(clinics)} clinics for scenario")
                else:
                    scenario_success = False
                    scenario_details.append("❌ No clinics available for scenario")
            else:
                scenario_success = False
                scenario_details.append(f"❌ Failed to get clinics: HTTP {clinics_response.status}")
            
            # Step 2: Verify invoice creation worked
            if self.test_data.get("created_invoice"):
                scenario_details.append(f"✅ Invoice created: {self.test_data['created_invoice']['invoice_number']}")
            else:
                scenario_success = False
                scenario_details.append("❌ No invoice was created in previous tests")
            
            # Step 3: Verify debt conversion worked
            if self.test_data.get("debt_id"):
                scenario_details.append(f"✅ Debt created from invoice: {self.test_data['debt_id']}")
            else:
                scenario_success = False
                scenario_details.append("❌ No debt was created from invoice")
            
            # Step 4: Check data integrity
            if self.test_data.get("created_invoice") and self.test_data.get("debt_id"):
                invoice = self.test_data["created_invoice"]
                
                # Verify debt details match invoice
                debt_response = await self.session.get(
                    f"{self.base_url}/api/debts/{self.test_data['debt_id']}",
                    headers=await self.get_auth_headers()
                )
                
                if debt_response.status == 200:
                    debt_data = await debt_response.json()
                    if debt_data.get("success") and debt_data.get("debt"):
                        debt = debt_data["debt"]
                        
                        # Check data integrity
                        if (debt.get("invoice_id") == invoice.get("id") and
                            debt.get("clinic_name") == invoice.get("clinic_name") and
                            debt.get("original_amount") == invoice.get("total_amount")):
                            scenario_details.append("✅ Data integrity verified: Invoice and debt data match")
                        else:
                            scenario_success = False
                            scenario_details.append("❌ Data integrity issue: Invoice and debt data mismatch")
                    else:
                        scenario_success = False
                        scenario_details.append("❌ Failed to get debt details for integrity check")
                else:
                    scenario_success = False
                    scenario_details.append(f"❌ Failed to get debt for integrity check: HTTP {debt_response.status}")
            
            response_time = (time.time() - start_time) * 1000
            
            if scenario_success:
                workflow_results["passed_tests"] += 1
                workflow_results["details"].append({
                    "test": "Complete Workflow: New Clinic Invoice Scenario",
                    "status": "✅ PASS",
                    "response_time": f"{response_time:.2f}ms",
                    "details": " | ".join(scenario_details)
                })
            else:
                workflow_results["failed_tests"] += 1
                workflow_results["details"].append({
                    "test": "Complete Workflow: New Clinic Invoice Scenario",
                    "status": "❌ FAIL",
                    "response_time": f"{response_time:.2f}ms",
                    "details": " | ".join(scenario_details)
                })
                
        except Exception as e:
            workflow_results["failed_tests"] += 1
            workflow_results["details"].append({
                "test": "Complete Workflow: New Clinic Invoice Scenario",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 2: Old Debt Collection Scenario
        try:
            start_time = time.time()
            workflow_results["total_tests"] += 1
            
            # Test collecting an old debt
            debts_response = await self.session.get(
                f"{self.base_url}/api/debts?overdue_only=true",
                headers=await self.get_auth_headers()
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if debts_response.status == 200:
                debts_data = await debts_response.json()
                if debts_data.get("success"):
                    debts = debts_data.get("debts", [])
                    workflow_results["passed_tests"] += 1
                    workflow_results["details"].append({
                        "test": "Complete Workflow: Old Debt Collection Scenario",
                        "status": "✅ PASS",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"Found {len(debts)} overdue debts for collection scenario"
                    })
                else:
                    workflow_results["failed_tests"] += 1
                    workflow_results["details"].append({
                        "test": "Complete Workflow: Old Debt Collection Scenario",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": "Invalid response format"
                    })
            else:
                workflow_results["failed_tests"] += 1
                error_text = await debts_response.text()
                workflow_results["details"].append({
                    "test": "Complete Workflow: Old Debt Collection Scenario",
                    "status": "❌ FAIL",
                    "response_time": f"{response_time:.2f}ms",
                    "details": f"HTTP {debts_response.status}: {error_text}"
                })
                
        except Exception as e:
            workflow_results["failed_tests"] += 1
            workflow_results["details"].append({
                "test": "Complete Workflow: Old Debt Collection Scenario",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        return workflow_results

    async def test_data_integrity(self) -> Dict[str, Any]:
        """Test data integrity and relationships"""
        print("\n🔍 اختبار سلامة البيانات...")
        integrity_results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "details": []
        }
        
        # Test 1: Invoice-Clinic Relationship
        try:
            start_time = time.time()
            integrity_results["total_tests"] += 1
            
            # Get invoices and verify clinic relationships
            invoices_response = await self.session.get(
                f"{self.base_url}/api/invoices",
                headers=await self.get_auth_headers()
            )
            
            clinics_response = await self.session.get(
                f"{self.base_url}/api/clinics",
                headers=await self.get_auth_headers()
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if invoices_response.status == 200 and clinics_response.status == 200:
                invoices_data = await invoices_response.json()
                clinics_data = await clinics_response.json()
                
                invoices = invoices_data.get("invoices", []) if invoices_data.get("success") else []
                clinics = clinics_data if isinstance(clinics_data, list) else clinics_data.get('clinics', [])
                
                clinic_ids = {clinic.get("id") for clinic in clinics}
                linked_invoices = 0
                
                for invoice in invoices:
                    if invoice.get("clinic_id") in clinic_ids:
                        linked_invoices += 1
                
                integrity_results["passed_tests"] += 1
                integrity_results["details"].append({
                    "test": "Data Integrity: Invoice-Clinic Relationship",
                    "status": "✅ PASS",
                    "response_time": f"{response_time:.2f}ms",
                    "details": f"Invoices: {len(invoices)}, Clinics: {len(clinics)}, Linked: {linked_invoices}"
                })
            else:
                integrity_results["failed_tests"] += 1
                integrity_results["details"].append({
                    "test": "Data Integrity: Invoice-Clinic Relationship",
                    "status": "❌ FAIL",
                    "response_time": f"{response_time:.2f}ms",
                    "details": f"Failed to get data - Invoices: {invoices_response.status}, Clinics: {clinics_response.status}"
                })
                
        except Exception as e:
            integrity_results["failed_tests"] += 1
            integrity_results["details"].append({
                "test": "Data Integrity: Invoice-Clinic Relationship",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 2: Debt-Representative Relationship
        try:
            start_time = time.time()
            integrity_results["total_tests"] += 1
            
            # Get debts and verify representative relationships
            debts_response = await self.session.get(
                f"{self.base_url}/api/debts",
                headers=await self.get_auth_headers()
            )
            
            users_response = await self.session.get(
                f"{self.base_url}/api/users",
                headers=await self.get_auth_headers()
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if debts_response.status == 200 and users_response.status == 200:
                debts_data = await debts_response.json()
                users_data = await users_response.json()
                
                debts = debts_data.get("debts", []) if debts_data.get("success") else []
                users = users_data if isinstance(users_data, list) else users_data.get('users', [])
                
                user_ids = {user.get("id") for user in users}
                assigned_debts = 0
                
                for debt in debts:
                    if debt.get("assigned_to_id") in user_ids:
                        assigned_debts += 1
                
                integrity_results["passed_tests"] += 1
                integrity_results["details"].append({
                    "test": "Data Integrity: Debt-Representative Relationship",
                    "status": "✅ PASS",
                    "response_time": f"{response_time:.2f}ms",
                    "details": f"Debts: {len(debts)}, Users: {len(users)}, Assigned: {assigned_debts}"
                })
            else:
                integrity_results["failed_tests"] += 1
                integrity_results["details"].append({
                    "test": "Data Integrity: Debt-Representative Relationship",
                    "status": "❌ FAIL",
                    "response_time": f"{response_time:.2f}ms",
                    "details": f"Failed to get data - Debts: {debts_response.status}, Users: {users_response.status}"
                })
                
        except Exception as e:
            integrity_results["failed_tests"] += 1
            integrity_results["details"].append({
                "test": "Data Integrity: Debt-Representative Relationship",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        # Test 3: Financial Calculations Accuracy
        try:
            start_time = time.time()
            integrity_results["total_tests"] += 1
            
            # Verify financial calculations are accurate
            if self.test_data.get("debt_id"):
                debt_response = await self.session.get(
                    f"{self.base_url}/api/debts/{self.test_data['debt_id']}",
                    headers=await self.get_auth_headers()
                )
                
                response_time = (time.time() - start_time) * 1000
                
                if debt_response.status == 200:
                    debt_data = await debt_response.json()
                    if debt_data.get("success") and debt_data.get("debt"):
                        debt = debt_data["debt"]
                        
                        # Check financial calculation accuracy
                        original = float(debt.get("original_amount", 0))
                        paid = float(debt.get("paid_amount", 0))
                        remaining = float(debt.get("remaining_amount", 0))
                        
                        calculated_remaining = original - paid
                        
                        if abs(remaining - calculated_remaining) < 0.01:  # Allow for small floating point differences
                            integrity_results["passed_tests"] += 1
                            integrity_results["details"].append({
                                "test": "Data Integrity: Financial Calculations Accuracy",
                                "status": "✅ PASS",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Original: {original} ج.م, Paid: {paid} ج.م, Remaining: {remaining} ج.م (Calculated: {calculated_remaining} ج.م)"
                            })
                        else:
                            integrity_results["failed_tests"] += 1
                            integrity_results["details"].append({
                                "test": "Data Integrity: Financial Calculations Accuracy",
                                "status": "❌ FAIL",
                                "response_time": f"{response_time:.2f}ms",
                                "details": f"Calculation mismatch - Remaining: {remaining} ج.م, Expected: {calculated_remaining} ج.م"
                            })
                    else:
                        integrity_results["failed_tests"] += 1
                        integrity_results["details"].append({
                            "test": "Data Integrity: Financial Calculations Accuracy",
                            "status": "❌ FAIL",
                            "response_time": f"{response_time:.2f}ms",
                            "details": "Invalid debt data format"
                        })
                else:
                    integrity_results["failed_tests"] += 1
                    error_text = await debt_response.text()
                    integrity_results["details"].append({
                        "test": "Data Integrity: Financial Calculations Accuracy",
                        "status": "❌ FAIL",
                        "response_time": f"{response_time:.2f}ms",
                        "details": f"HTTP {debt_response.status}: {error_text}"
                    })
            else:
                integrity_results["failed_tests"] += 1
                integrity_results["details"].append({
                    "test": "Data Integrity: Financial Calculations Accuracy",
                    "status": "❌ SKIP",
                    "response_time": "N/A",
                    "details": "No debt available for calculation verification"
                })
                
        except Exception as e:
            integrity_results["failed_tests"] += 1
            integrity_results["details"].append({
                "test": "Data Integrity: Financial Calculations Accuracy",
                "status": "❌ ERROR",
                "response_time": "N/A",
                "details": f"Exception: {str(e)}"
            })

        return integrity_results

    def print_results(self, invoice_results: Dict, debt_results: Dict, workflow_results: Dict, integrity_results: Dict):
        """Print comprehensive test results"""
        print("\n" + "="*80)
        print("🎯 نتائج الاختبار الشامل لنظام الفواتير والديون")
        print("="*80)
        
        # Calculate totals
        total_tests = (invoice_results["total_tests"] + debt_results["total_tests"] + 
                      workflow_results["total_tests"] + integrity_results["total_tests"])
        total_passed = (invoice_results["passed_tests"] + debt_results["passed_tests"] + 
                       workflow_results["passed_tests"] + integrity_results["passed_tests"])
        total_failed = (invoice_results["failed_tests"] + debt_results["failed_tests"] + 
                       workflow_results["failed_tests"] + integrity_results["failed_tests"])
        
        success_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
        
        # Print summary
        print(f"\n📊 **النتائج الإجمالية:**")
        print(f"إجمالي الاختبارات: {total_tests}")
        print(f"نجح: {total_passed} ✅")
        print(f"فشل: {total_failed} ❌")
        print(f"معدل النجاح: {success_rate:.1f}%")
        
        # Print detailed results for each category
        categories = [
            ("📋 نظام الفواتير", invoice_results),
            ("💰 نظام الديون", debt_results),
            ("🔄 التدفق الكامل", workflow_results),
            ("🔍 سلامة البيانات", integrity_results)
        ]
        
        for category_name, results in categories:
            print(f"\n{category_name}:")
            print(f"  الاختبارات: {results['total_tests']} | نجح: {results['passed_tests']} | فشل: {results['failed_tests']}")
            
            for detail in results["details"]:
                print(f"  {detail['status']} {detail['test']} ({detail['response_time']})")
                if detail.get('details'):
                    print(f"    {detail['details']}")
        
        # Print overall assessment
        print(f"\n🎯 **التقييم النهائي:**")
        if success_rate >= 90:
            print("🟢 النظام المالي يعمل بشكل ممتاز!")
        elif success_rate >= 70:
            print("🟡 النظام المالي يعمل بشكل جيد مع بعض المشاكل البسيطة")
        elif success_rate >= 50:
            print("🟠 النظام المالي يحتاج تحسينات")
        else:
            print("🔴 النظام المالي يحتاج إصلاحات جوهرية")
        
        # Calculate average response time
        all_details = []
        for results in [invoice_results, debt_results, workflow_results, integrity_results]:
            all_details.extend(results["details"])
        
        response_times = []
        for detail in all_details:
            try:
                if detail["response_time"] != "N/A":
                    time_str = detail["response_time"].replace("ms", "")
                    response_times.append(float(time_str))
            except:
                pass
        
        if response_times:
            avg_response_time = sum(response_times) / len(response_times)
            print(f"متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
        
        print("\n" + "="*80)

    async def run_comprehensive_test(self):
        """Run comprehensive financial system test"""
        try:
            await self.setup_session()
            
            # Login first
            if not await self.login_admin():
                print("❌ فشل في تسجيل الدخول - توقف الاختبار")
                return
            
            print("✅ تم تسجيل الدخول بنجاح")
            
            # Run all test categories
            invoice_results = await self.test_invoice_system()
            debt_results = await self.test_debt_system()
            workflow_results = await self.test_complete_workflow()
            integrity_results = await self.test_data_integrity()
            
            # Print comprehensive results
            self.print_results(invoice_results, debt_results, workflow_results, integrity_results)
            
        except Exception as e:
            print(f"❌ خطأ في تشغيل الاختبار الشامل: {str(e)}")
        finally:
            await self.cleanup_session()

async def main():
    """Main function to run the comprehensive test"""
    tester = ComprehensiveFinancialSystemTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())