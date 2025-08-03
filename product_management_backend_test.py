#!/usr/bin/env python3
"""
اختبار شامل لإدارة المنتجات في الباكند - Product Management Backend Testing
Comprehensive Product Management Backend Testing

المطلوب اختبار:
1. APIs الأساسية لإدارة المنتجات
2. اختبار وظائف المنتجات مع البيانات المطلوبة
3. اختبار صلاحيات المستخدمين
4. اختبار البيانات والتحقق من التنسيق
5. التحقق من الميزات المطلوبة
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, List, Any

# Configuration
BASE_URL = "https://6fc37004-de78-473a-b926-f0438820a235.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class ProductManagementTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        self.created_products = []
        self.available_lines = []
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """تنظيف جلسة HTTP"""
        if self.session:
            await self.session.close()
            
    async def admin_login(self) -> bool:
        """تسجيل دخول الأدمن والحصول على JWT token"""
        try:
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/auth/login", json=ADMIN_CREDENTIALS) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data.get("access_token")
                    self.test_results.append({
                        "test": "Admin Login (admin/admin123)",
                        "status": "✅ PASS",
                        "duration": f"{duration:.2f}ms",
                        "details": f"JWT token obtained successfully"
                    })
                    return True
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Admin Login",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Admin Login",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def get_available_lines(self) -> bool:
        """الحصول على الخطوط المتاحة لربط المنتجات"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            start_time = time.time()
            
            async with self.session.get(f"{BASE_URL}/lines", headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    lines = await response.json()
                    self.available_lines = lines
                    
                    self.test_results.append({
                        "test": "Get Available Lines for Product Linking",
                        "status": "✅ PASS",
                        "duration": f"{duration:.2f}ms",
                        "details": f"Found {len(lines)} lines available for product linking"
                    })
                    return True
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Get Available Lines",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Get Available Lines",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_create_product_with_vial_unit(self) -> bool:
        """اختبار إنشاء منتج بوحدة ڤايل"""
        try:
            if not self.available_lines:
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            line_id = self.available_lines[0]["id"]
            
            product_data = {
                "name": "دواء تجريبي - ڤايل",
                "description": "منتج تجريبي بوحدة الڤايل للاختبار",
                "category": "أدوية",
                "unit": "ڤايل",
                "line_id": line_id,
                "price": 25.50,
                "price_type": "per_vial",
                "current_stock": 100
            }
            
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/products", json=product_data, headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success") and "product" in result:
                        product = result["product"]
                        self.created_products.append(product["id"])
                        
                        # Verify all required fields
                        required_fields = ["id", "name", "unit", "line_id", "line_name", "price", "price_type"]
                        missing_fields = [field for field in required_fields if field not in product]
                        
                        if not missing_fields:
                            self.test_results.append({
                                "test": "Create Product with Vial Unit (ڤايل)",
                                "status": "✅ PASS",
                                "duration": f"{duration:.2f}ms",
                                "details": f"Product created successfully with unit=ڤايل, price_type=per_vial, linked to line: {product.get('line_name')}"
                            })
                            return True
                        else:
                            self.test_results.append({
                                "test": "Create Product with Vial Unit",
                                "status": "❌ FAIL",
                                "duration": f"{duration:.2f}ms",
                                "details": f"Missing required fields: {missing_fields}"
                            })
                            return False
                    else:
                        self.test_results.append({
                            "test": "Create Product with Vial Unit",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Invalid response format: {result}"
                        })
                        return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Create Product with Vial Unit",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Create Product with Vial Unit",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_create_product_with_box_unit(self) -> bool:
        """اختبار إنشاء منتج بوحدة علبة"""
        try:
            if not self.available_lines:
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            line_id = self.available_lines[0]["id"]
            
            product_data = {
                "name": "دواء تجريبي - علبة",
                "description": "منتج تجريبي بوحدة العلبة للاختبار",
                "category": "أدوية",
                "unit": "علبة",
                "line_id": line_id,
                "price": 150.00,
                "price_type": "per_box",
                "current_stock": 50
            }
            
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/products", json=product_data, headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success") and "product" in result:
                        product = result["product"]
                        self.created_products.append(product["id"])
                        
                        self.test_results.append({
                            "test": "Create Product with Box Unit (علبة)",
                            "status": "✅ PASS",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Product created successfully with unit=علبة, price_type=per_box, linked to line: {product.get('line_name')}"
                        })
                        return True
                    else:
                        self.test_results.append({
                            "test": "Create Product with Box Unit",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Invalid response format: {result}"
                        })
                        return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Create Product with Box Unit",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Create Product with Box Unit",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_get_products_admin_view(self) -> bool:
        """اختبار جلب المنتجات بصلاحية الأدمن (يجب أن يرى الأسعار)"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            start_time = time.time()
            
            async with self.session.get(f"{BASE_URL}/products", headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    products = await response.json()
                    
                    # Check if products contain price information (admin should see prices)
                    products_with_prices = [p for p in products if "price" in p]
                    total_products = len(products)
                    
                    if products_with_prices:
                        self.test_results.append({
                            "test": "Get Products - Admin View (Price Visibility)",
                            "status": "✅ PASS",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Admin can see prices: {len(products_with_prices)}/{total_products} products have price information"
                        })
                        return True
                    else:
                        self.test_results.append({
                            "test": "Get Products - Admin View",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Admin cannot see prices - this is incorrect behavior"
                        })
                        return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Get Products - Admin View",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Get Products - Admin View",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_create_medical_rep_user(self) -> str:
        """إنشاء مستخدم مندوب طبي لاختبار إخفاء الأسعار"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            user_data = {
                "username": "test_medical_rep_products",
                "password": "test123",
                "full_name": "مندوب طبي لاختبار المنتجات",
                "role": "medical_rep",
                "email": "test_rep_products@example.com",
                "phone": "01234567890"
            }
            
            start_time = time.time()
            async with self.session.post(f"{BASE_URL}/users", json=user_data, headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.test_results.append({
                            "test": "Create Medical Rep User for Price Visibility Test",
                            "status": "✅ PASS",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Medical rep user created successfully"
                        })
                        return user_data["username"]
                    else:
                        self.test_results.append({
                            "test": "Create Medical Rep User",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Failed to create user: {result}"
                        })
                        return None
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Create Medical Rep User",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return None
                    
        except Exception as e:
            self.test_results.append({
                "test": "Create Medical Rep User",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return None
            
    async def test_medical_rep_login_and_price_visibility(self, username: str) -> bool:
        """اختبار تسجيل دخول المندوب الطبي واختبار إخفاء الأسعار"""
        try:
            # Login as medical rep
            login_data = {"username": username, "password": "test123"}
            start_time = time.time()
            
            async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
                login_duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    data = await response.json()
                    rep_token = data.get("access_token")
                    
                    # Test getting products as medical rep
                    headers = {"Authorization": f"Bearer {rep_token}"}
                    start_time = time.time()
                    
                    async with self.session.get(f"{BASE_URL}/products", headers=headers) as prod_response:
                        prod_duration = (time.time() - start_time) * 1000
                        
                        if prod_response.status == 200:
                            products = await prod_response.json()
                            
                            # Check if prices are hidden (medical rep should NOT see prices)
                            products_with_prices = [p for p in products if "price" in p]
                            total_products = len(products)
                            
                            if not products_with_prices:
                                self.test_results.append({
                                    "test": "Medical Rep Price Visibility Control",
                                    "status": "✅ PASS",
                                    "duration": f"{login_duration:.2f}ms + {prod_duration:.2f}ms",
                                    "details": f"Prices correctly hidden from medical rep: 0/{total_products} products show prices"
                                })
                                return True
                            else:
                                self.test_results.append({
                                    "test": "Medical Rep Price Visibility Control",
                                    "status": "❌ FAIL",
                                    "duration": f"{login_duration:.2f}ms + {prod_duration:.2f}ms",
                                    "details": f"Prices NOT hidden from medical rep: {len(products_with_prices)}/{total_products} products show prices"
                                })
                                return False
                        else:
                            error_text = await prod_response.text()
                            self.test_results.append({
                                "test": "Medical Rep Price Visibility Control",
                                "status": "❌ FAIL",
                                "duration": f"{login_duration:.2f}ms + {prod_duration:.2f}ms",
                                "details": f"Failed to get products: HTTP {prod_response.status}: {error_text}"
                            })
                            return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Medical Rep Login for Price Test",
                        "status": "❌ FAIL",
                        "duration": f"{login_duration:.2f}ms",
                        "details": f"Login failed: HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Medical Rep Price Visibility Control",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_update_product(self) -> bool:
        """اختبار تحديث منتج"""
        try:
            if not self.created_products:
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            product_id = self.created_products[0]
            
            update_data = {
                "name": "دواء محدث - ڤايل",
                "description": "منتج محدث للاختبار",
                "price": 30.00,
                "current_stock": 150
            }
            
            start_time = time.time()
            async with self.session.put(f"{BASE_URL}/products/{product_id}", json=update_data, headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.test_results.append({
                            "test": "Update Product (PUT /api/products/{id})",
                            "status": "✅ PASS",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Product updated successfully"
                        })
                        return True
                    else:
                        self.test_results.append({
                            "test": "Update Product",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Update failed: {result}"
                        })
                        return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Update Product",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Update Product",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_soft_delete_product(self) -> bool:
        """اختبار الحذف الناعم للمنتج"""
        try:
            if not self.created_products:
                return False
                
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            product_id = self.created_products[-1]  # Delete the last created product
            
            start_time = time.time()
            async with self.session.delete(f"{BASE_URL}/products/{product_id}", headers=headers) as response:
                duration = (time.time() - start_time) * 1000
                
                if response.status == 200:
                    result = await response.json()
                    if result.get("success"):
                        self.test_results.append({
                            "test": "Soft Delete Product (DELETE /api/products/{id})",
                            "status": "✅ PASS",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Product soft deleted successfully (is_active=false)"
                        })
                        return True
                    else:
                        self.test_results.append({
                            "test": "Soft Delete Product",
                            "status": "❌ FAIL",
                            "duration": f"{duration:.2f}ms",
                            "details": f"Delete failed: {result}"
                        })
                        return False
                else:
                    error_text = await response.text()
                    self.test_results.append({
                        "test": "Soft Delete Product",
                        "status": "❌ FAIL",
                        "duration": f"{duration:.2f}ms",
                        "details": f"HTTP {response.status}: {error_text}"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Soft Delete Product",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_non_admin_product_creation_blocked(self) -> bool:
        """اختبار منع غير الأدمن من إنشاء المنتجات"""
        try:
            # Create a regular user first
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            user_data = {
                "username": "test_regular_user_products",
                "password": "test123",
                "full_name": "مستخدم عادي لاختبار المنتجات",
                "role": "warehouse_keeper",
                "email": "test_regular_products@example.com"
            }
            
            # Create user
            async with self.session.post(f"{BASE_URL}/users", json=user_data, headers=headers) as response:
                if response.status != 200:
                    self.test_results.append({
                        "test": "Non-Admin Product Creation Block",
                        "status": "❌ FAIL",
                        "duration": "N/A",
                        "details": "Failed to create test user"
                    })
                    return False
            
            # Login as regular user
            login_data = {"username": user_data["username"], "password": "test123"}
            async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    regular_token = data.get("access_token")
                    
                    # Try to create product as regular user
                    regular_headers = {"Authorization": f"Bearer {regular_token}"}
                    product_data = {
                        "name": "منتج غير مصرح",
                        "unit": "ڤايل",
                        "line_id": self.available_lines[0]["id"] if self.available_lines else "test",
                        "price": 10.0,
                        "price_type": "per_vial"
                    }
                    
                    start_time = time.time()
                    async with self.session.post(f"{BASE_URL}/products", json=product_data, headers=regular_headers) as prod_response:
                        duration = (time.time() - start_time) * 1000
                        
                        if prod_response.status == 403:
                            self.test_results.append({
                                "test": "Non-Admin Product Creation Block",
                                "status": "✅ PASS",
                                "duration": f"{duration:.2f}ms",
                                "details": "Non-admin user correctly blocked from creating products (HTTP 403)"
                            })
                            return True
                        else:
                            error_text = await prod_response.text()
                            self.test_results.append({
                                "test": "Non-Admin Product Creation Block",
                                "status": "❌ FAIL",
                                "duration": f"{duration:.2f}ms",
                                "details": f"Non-admin user was NOT blocked: HTTP {prod_response.status}: {error_text}"
                            })
                            return False
                else:
                    self.test_results.append({
                        "test": "Non-Admin Product Creation Block",
                        "status": "❌ FAIL",
                        "duration": "N/A",
                        "details": "Failed to login as regular user"
                    })
                    return False
                    
        except Exception as e:
            self.test_results.append({
                "test": "Non-Admin Product Creation Block",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def test_required_fields_validation(self) -> bool:
        """اختبار التحقق من الحقول المطلوبة"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            
            # Test missing required fields
            test_cases = [
                {"missing_field": "name", "data": {"unit": "ڤايل", "line_id": "test", "price": 10.0, "price_type": "per_vial"}},
                {"missing_field": "unit", "data": {"name": "test", "line_id": "test", "price": 10.0, "price_type": "per_vial"}},
                {"missing_field": "line_id", "data": {"name": "test", "unit": "ڤايل", "price": 10.0, "price_type": "per_vial"}},
                {"missing_field": "price", "data": {"name": "test", "unit": "ڤايل", "line_id": "test", "price_type": "per_vial"}},
                {"missing_field": "price_type", "data": {"name": "test", "unit": "ڤايل", "line_id": "test", "price": 10.0}}
            ]
            
            passed_validations = 0
            total_validations = len(test_cases)
            
            for test_case in test_cases:
                start_time = time.time()
                async with self.session.post(f"{BASE_URL}/products", json=test_case["data"], headers=headers) as response:
                    duration = (time.time() - start_time) * 1000
                    
                    if response.status == 400:
                        passed_validations += 1
                    
            if passed_validations == total_validations:
                self.test_results.append({
                    "test": "Required Fields Validation",
                    "status": "✅ PASS",
                    "duration": "Multiple requests",
                    "details": f"All {total_validations} required field validations passed (HTTP 400 for missing fields)"
                })
                return True
            else:
                self.test_results.append({
                    "test": "Required Fields Validation",
                    "status": "❌ FAIL",
                    "duration": "Multiple requests",
                    "details": f"Only {passed_validations}/{total_validations} required field validations passed"
                })
                return False
                
        except Exception as e:
            self.test_results.append({
                "test": "Required Fields Validation",
                "status": "❌ ERROR",
                "duration": "N/A",
                "details": f"Exception: {str(e)}"
            })
            return False
            
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل لإدارة المنتجات"""
        print("🚀 بدء الاختبار الشامل لإدارة المنتجات في الباكند")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # Test sequence
            tests = [
                ("تسجيل دخول الأدمن", self.admin_login),
                ("جلب الخطوط المتاحة", self.get_available_lines),
                ("إنشاء منتج بوحدة ڤايل", self.test_create_product_with_vial_unit),
                ("إنشاء منتج بوحدة علبة", self.test_create_product_with_box_unit),
                ("عرض المنتجات للأدمن مع الأسعار", self.test_get_products_admin_view),
                ("تحديث منتج", self.test_update_product),
                ("حذف منتج ناعم", self.test_soft_delete_product),
                ("منع غير الأدمن من إنشاء المنتجات", self.test_non_admin_product_creation_blocked),
                ("التحقق من الحقول المطلوبة", self.test_required_fields_validation)
            ]
            
            passed_tests = 0
            total_tests = len(tests)
            
            for test_name, test_func in tests:
                print(f"\n🔍 تشغيل اختبار: {test_name}")
                try:
                    result = await test_func()
                    if result:
                        passed_tests += 1
                        print(f"✅ نجح: {test_name}")
                    else:
                        print(f"❌ فشل: {test_name}")
                except Exception as e:
                    print(f"💥 خطأ في {test_name}: {str(e)}")
            
            # Test medical rep price visibility separately
            print(f"\n🔍 تشغيل اختبار: إخفاء الأسعار عن المندوب الطبي")
            rep_username = await self.test_create_medical_rep_user()
            if rep_username:
                rep_result = await self.test_medical_rep_login_and_price_visibility(rep_username)
                if rep_result:
                    passed_tests += 1
                    total_tests += 1
                    print(f"✅ نجح: إخفاء الأسعار عن المندوب الطبي")
                else:
                    total_tests += 1
                    print(f"❌ فشل: إخفاء الأسعار عن المندوب الطبي")
            else:
                total_tests += 1
                print(f"❌ فشل: إنشاء مندوب طبي للاختبار")
            
            # Calculate success rate
            success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
            
            print("\n" + "=" * 80)
            print("📊 نتائج الاختبار الشامل لإدارة المنتجات")
            print("=" * 80)
            
            for result in self.test_results:
                print(f"{result['status']} {result['test']}")
                print(f"   ⏱️  المدة: {result['duration']}")
                print(f"   📝 التفاصيل: {result['details']}")
                print()
            
            print("=" * 80)
            print(f"📈 النتيجة النهائية: {passed_tests}/{total_tests} اختبار نجح")
            print(f"🎯 نسبة النجاح: {success_rate:.1f}%")
            
            if success_rate >= 80:
                print("🎉 نظام إدارة المنتجات يعمل بشكل ممتاز!")
            elif success_rate >= 60:
                print("⚠️  نظام إدارة المنتجات يعمل بشكل جيد مع بعض المشاكل")
            else:
                print("❌ نظام إدارة المنتجات يحتاج إلى إصلاحات")
            
            print("=" * 80)
            
            return success_rate
            
        finally:
            await self.cleanup_session()

async def main():
    """تشغيل الاختبار الرئيسي"""
    tester = ProductManagementTester()
    success_rate = await tester.run_comprehensive_test()
    return success_rate

if __name__ == "__main__":
    asyncio.run(main())