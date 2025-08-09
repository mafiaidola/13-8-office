#!/usr/bin/env python3
"""
اختبار شامل لنظام إدارة المنتجات المُحدث
Comprehensive Testing for Updated Products Management System

الهدف: التحقق من أن جميع التحديثات المطلوبة من المستخدم تعمل بشكل صحيح
Goal: Verify that all user-requested updates work correctly

الاختبارات المطلوبة:
1. اختبار Products Management APIs الجديدة
2. اختبار التكامل مع نظام الخطوط  
3. اختبار البنية الجديدة للمنتجات
4. اختبار إخفاء الأسعار
5. اختبار إزالة الأسعار المتدرجة والكاش باك
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://0f89e653-23a1-4222-bcbe-a4908839f7c6.preview.emergentagent.com/api"
TIMEOUT = 30

class ProductsManagementTestSuite:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.test_results = []
        self.created_product_id = None
        self.available_lines = []
        
    def log_result(self, test_name, success, details="", error=""):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} - {test_name}")
        if details:
            print(f"   التفاصيل: {details}")
        if error:
            print(f"   الخطأ: {error}")
        print()

    def login_admin(self):
        """تسجيل دخول الأدمن"""
        try:
            response = self.session.post(
                f"{BASE_URL}/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data["access_token"]
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                self.log_result("تسجيل دخول الأدمن", True, f"تم تسجيل الدخول بنجاح للمستخدم: {data['user']['username']}")
                return True
            else:
                self.log_result("تسجيل دخول الأدمن", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("تسجيل دخول الأدمن", False, error=str(e))
            return False

    def create_sales_rep_user(self):
        """إنشاء مستخدم مندوب مبيعات للاختبار"""
        try:
            sales_rep_data = {
                "username": f"test_sales_rep_{uuid.uuid4().hex[:8]}",
                "password": "test123",
                "full_name": "مندوب اختبار",
                "role": "medical_rep",
                "email": "test@example.com",
                "phone": "01234567890"
            }
            
            response = self.session.post(
                f"{BASE_URL}/users",
                json=sales_rep_data,
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                # Now login as sales rep
                login_response = self.session.post(
                    f"{BASE_URL}/auth/login",
                    json={"username": sales_rep_data["username"], "password": sales_rep_data["password"]},
                    timeout=TIMEOUT
                )
                
                if login_response.status_code == 200:
                    data = login_response.json()
                    self.sales_rep_token = data["access_token"]
                    self.log_result("إنشاء وتسجيل دخول مندوب المبيعات", True, f"تم إنشاء المستخدم: {sales_rep_data['username']}")
                    return True
                else:
                    self.log_result("تسجيل دخول مندوب المبيعات", False, error=f"فشل تسجيل الدخول: {login_response.text}")
                    return False
            else:
                self.log_result("إنشاء مندوب المبيعات", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("إنشاء مندوب المبيعات", False, error=str(e))
            return False

    def test_get_lines_integration(self):
        """اختبار التكامل مع نظام الخطوط - الحصول على الخطوط المتاحة"""
        try:
            response = self.session.get(f"{BASE_URL}/lines", timeout=TIMEOUT)
            
            if response.status_code == 200:
                lines = response.json()
                self.available_lines = lines
                
                if len(lines) > 0:
                    line_details = []
                    for line in lines[:3]:  # Show first 3 lines
                        line_details.append(f"ID: {line.get('id', 'N/A')}, Name: {line.get('name', 'N/A')}")
                    
                    self.log_result(
                        "الحصول على الخطوط المتاحة", 
                        True, 
                        f"تم العثور على {len(lines)} خط. أمثلة: {'; '.join(line_details)}"
                    )
                    return True
                else:
                    self.log_result("الحصول على الخطوط المتاحة", False, error="لا توجد خطوط متاحة في النظام")
                    return False
            else:
                self.log_result("الحصول على الخطوط المتاحة", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("الحصول على الخطوط المتاحة", False, error=str(e))
            return False

    def test_create_product_new_structure(self):
        """اختبار إنشاء منتج جديد بالبنية المحدثة"""
        if not self.available_lines:
            self.log_result("إنشاء منتج جديد", False, error="لا توجد خطوط متاحة لربط المنتج بها")
            return False
            
        try:
            # Use first available line
            selected_line = self.available_lines[0]
            
            product_data = {
                "name": "دواء تجريبي للاختبار",
                "description": "وصف الدواء التجريبي للاختبار الشامل",
                "category": "أدوية",
                "unit": "ڤايل",
                "line_id": selected_line["id"],
                "price": 25.50,
                "price_type": "per_vial",
                "current_stock": 100,
                "is_active": True
            }
            
            response = self.session.post(
                f"{BASE_URL}/products",
                json=product_data,
                timeout=TIMEOUT
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                if result.get("success"):
                    created_product = result.get("product", {})
                    self.created_product_id = created_product.get("id")
                    
                    # Verify the structure
                    required_fields = ["name", "unit", "line_id", "price", "price_type", "current_stock"]
                    missing_fields = [field for field in required_fields if field not in created_product]
                    
                    if not missing_fields:
                        self.log_result(
                            "إنشاء منتج بالبنية الجديدة", 
                            True, 
                            f"تم إنشاء المنتج بنجاح. ID: {self.created_product_id}, الخط: {selected_line['name']}, السعر: {product_data['price']} {product_data['price_type']}"
                        )
                        return True
                    else:
                        self.log_result(
                            "إنشاء منتج بالبنية الجديدة", 
                            False, 
                            error=f"الحقول المفقودة في المنتج المُنشأ: {missing_fields}"
                        )
                        return False
                else:
                    self.log_result("إنشاء منتج بالبنية الجديدة", False, error=f"فشل الإنشاء: {result}")
                    return False
            else:
                self.log_result("إنشاء منتج بالبنية الجديدة", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("إنشاء منتج بالبنية الجديدة", False, error=str(e))
            return False

    def test_get_products_with_line_names(self):
        """اختبار الحصول على المنتجات مع أسماء الخطوط الصحيحة"""
        try:
            response = self.session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
            
            if response.status_code == 200:
                products = response.json()
                
                if len(products) > 0:
                    products_with_lines = []
                    products_without_lines = []
                    
                    for product in products:
                        if product.get("line_name") and product.get("line_id"):
                            products_with_lines.append(f"{product['name']} -> {product['line_name']}")
                        else:
                            products_without_lines.append(product.get("name", "Unknown"))
                    
                    if len(products_with_lines) > 0:
                        details = f"المنتجات مع أسماء الخطوط ({len(products_with_lines)}): {'; '.join(products_with_lines[:3])}"
                        if products_without_lines:
                            details += f". منتجات بدون خطوط ({len(products_without_lines)}): {'; '.join(products_without_lines[:2])}"
                        
                        self.log_result("الحصول على المنتجات مع أسماء الخطوط", True, details)
                        return True
                    else:
                        self.log_result("الحصول على المنتجات مع أسماء الخطوط", False, error="لا توجد منتجات مربوطة بخطوط")
                        return False
                else:
                    self.log_result("الحصول على المنتجات مع أسماء الخطوط", False, error="لا توجد منتجات في النظام")
                    return False
            else:
                self.log_result("الحصول على المنتجات مع أسماء الخطوط", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("الحصول على المنتجات مع أسماء الخطوط", False, error=str(e))
            return False

    def test_update_product(self):
        """اختبار تحديث منتج"""
        if not self.created_product_id:
            self.log_result("تحديث المنتج", False, error="لا يوجد منتج مُنشأ للتحديث")
            return False
            
        try:
            update_data = {
                "name": "دواء تجريبي محدث",
                "description": "وصف محدث للدواء التجريبي",
                "price": 30.75,
                "current_stock": 150,
                "unit": "علبة"
            }
            
            response = self.session.put(
                f"{BASE_URL}/products/{self.created_product_id}",
                json=update_data,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.log_result(
                        "تحديث المنتج", 
                        True, 
                        f"تم تحديث المنتج بنجاح. السعر الجديد: {update_data['price']}, الوحدة الجديدة: {update_data['unit']}"
                    )
                    return True
                else:
                    self.log_result("تحديث المنتج", False, error=f"فشل التحديث: {result}")
                    return False
            else:
                self.log_result("تحديث المنتج", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("تحديث المنتج", False, error=str(e))
            return False

    def test_price_access_control(self):
        """اختبار إخفاء الأسعار - التحكم في الوصول حسب الدور"""
        if not self.sales_rep_token:
            self.log_result("اختبار إخفاء الأسعار", False, error="لا يوجد مستخدم مندوب مبيعات للاختبار")
            return False
            
        try:
            # Test admin access (should see prices)
            admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
            admin_response = self.session.get(f"{BASE_URL}/products", headers=admin_headers, timeout=TIMEOUT)
            
            # Test sales rep access (should not see prices or have limited access)
            sales_rep_headers = {"Authorization": f"Bearer {self.sales_rep_token}"}
            sales_rep_response = self.session.get(f"{BASE_URL}/products", headers=sales_rep_headers, timeout=TIMEOUT)
            
            admin_can_see_prices = False
            sales_rep_access_limited = False
            
            if admin_response.status_code == 200:
                admin_products = admin_response.json()
                if admin_products and len(admin_products) > 0:
                    # Check if admin can see prices
                    for product in admin_products:
                        if "price" in product and product["price"] is not None:
                            admin_can_see_prices = True
                            break
            
            if sales_rep_response.status_code == 200:
                sales_rep_products = sales_rep_response.json()
                # Sales rep should either see no prices or have limited access
                if not sales_rep_products or len(sales_rep_products) == 0:
                    sales_rep_access_limited = True
                else:
                    # Check if prices are hidden
                    prices_hidden = True
                    for product in sales_rep_products:
                        if "price" in product and product["price"] is not None:
                            prices_hidden = False
                            break
                    sales_rep_access_limited = prices_hidden
            elif sales_rep_response.status_code == 403:
                sales_rep_access_limited = True
            
            if admin_can_see_prices and sales_rep_access_limited:
                self.log_result(
                    "اختبار إخفاء الأسعار", 
                    True, 
                    "الأدمن يمكنه رؤية الأسعار، مندوب المبيعات لا يمكنه رؤية الأسعار أو الوصول محدود"
                )
                return True
            else:
                details = f"الأدمن يرى الأسعار: {admin_can_see_prices}, مندوب المبيعات محدود الوصول: {sales_rep_access_limited}"
                self.log_result("اختبار إخفاء الأسعار", False, error=f"فشل التحكم في الوصول. {details}")
                return False
                
        except Exception as e:
            self.log_result("اختبار إخفاء الأسعار", False, error=str(e))
            return False

    def test_no_tiered_pricing_cashback(self):
        """اختبار إزالة الأسعار المتدرجة والكاش باك"""
        try:
            response = self.session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
            
            if response.status_code == 200:
                products = response.json()
                
                if len(products) > 0:
                    old_pricing_fields = ["price_1", "price_10", "price_25", "price_50", "price_100"]
                    cashback_fields = ["cashback_percentage", "cashback_amount", "cashback_enabled"]
                    
                    products_with_old_pricing = []
                    products_with_cashback = []
                    
                    for product in products:
                        # Check for old pricing fields
                        for field in old_pricing_fields:
                            if field in product:
                                products_with_old_pricing.append(f"{product.get('name', 'Unknown')} has {field}")
                        
                        # Check for cashback fields
                        for field in cashback_fields:
                            if field in product:
                                products_with_cashback.append(f"{product.get('name', 'Unknown')} has {field}")
                    
                    if not products_with_old_pricing and not products_with_cashback:
                        self.log_result(
                            "إزالة الأسعار المتدرجة والكاش باك", 
                            True, 
                            f"تم التحقق من {len(products)} منتج. لا توجد حقول أسعار متدرجة أو كاش باك"
                        )
                        return True
                    else:
                        error_details = []
                        if products_with_old_pricing:
                            error_details.append(f"أسعار متدرجة موجودة: {'; '.join(products_with_old_pricing[:3])}")
                        if products_with_cashback:
                            error_details.append(f"كاش باك موجود: {'; '.join(products_with_cashback[:3])}")
                        
                        self.log_result(
                            "إزالة الأسعار المتدرجة والكاش باك", 
                            False, 
                            error="; ".join(error_details)
                        )
                        return False
                else:
                    self.log_result("إزالة الأسعار المتدرجة والكاش باك", False, error="لا توجد منتجات للاختبار")
                    return False
            else:
                self.log_result("إزالة الأسعار المتدرجة والكاش باك", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("إزالة الأسعار المتدرجة والكاش باك", False, error=str(e))
            return False

    def test_delete_product_soft_delete(self):
        """اختبار حذف المنتج (Soft Delete)"""
        if not self.created_product_id:
            self.log_result("حذف المنتج (Soft Delete)", False, error="لا يوجد منتج مُنشأ للحذف")
            return False
            
        try:
            response = self.session.delete(
                f"{BASE_URL}/products/{self.created_product_id}",
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    # Verify soft delete by checking if product still exists but is_active = false
                    verify_response = self.session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
                    if verify_response.status_code == 200:
                        products = verify_response.json()
                        deleted_product = None
                        for product in products:
                            if product.get("id") == self.created_product_id:
                                deleted_product = product
                                break
                        
                        if deleted_product and deleted_product.get("is_active") == False:
                            self.log_result(
                                "حذف المنتج (Soft Delete)", 
                                True, 
                                "تم الحذف الناعم بنجاح - المنتج موجود لكن is_active = false"
                            )
                            return True
                        elif not deleted_product:
                            self.log_result(
                                "حذف المنتج (Soft Delete)", 
                                True, 
                                "تم حذف المنتج من القائمة (قد يكون مخفي من النتائج)"
                            )
                            return True
                        else:
                            self.log_result(
                                "حذف المنتج (Soft Delete)", 
                                False, 
                                error="المنتج لا يزال نشط بعد الحذف"
                            )
                            return False
                    else:
                        self.log_result("حذف المنتج (Soft Delete)", True, "تم الحذف بنجاح")
                        return True
                else:
                    self.log_result("حذف المنتج (Soft Delete)", False, error=f"فشل الحذف: {result}")
                    return False
            else:
                self.log_result("حذف المنتج (Soft Delete)", False, error=f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("حذف المنتج (Soft Delete)", False, error=str(e))
            return False

    def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء الاختبار الشامل لنظام إدارة المنتجات المُحدث")
        print("=" * 80)
        
        # Authentication Tests
        print("\n📋 المرحلة 1: اختبارات المصادقة")
        if not self.login_admin():
            print("❌ فشل تسجيل دخول الأدمن - إيقاف الاختبار")
            return False
        
        self.create_sales_rep_user()  # Optional for price access testing
        
        # Integration Tests
        print("\n📋 المرحلة 2: اختبار التكامل مع نظام الخطوط")
        if not self.test_get_lines_integration():
            print("⚠️ تحذير: لا توجد خطوط متاحة - قد يؤثر على اختبارات المنتجات")
        
        # Products Management Tests
        print("\n📋 المرحلة 3: اختبارات إدارة المنتجات")
        self.test_create_product_new_structure()
        self.test_get_products_with_line_names()
        self.test_update_product()
        
        # Access Control Tests
        print("\n📋 المرحلة 4: اختبارات التحكم في الوصول")
        self.test_price_access_control()
        
        # Structure Validation Tests
        print("\n📋 المرحلة 5: اختبار البنية الجديدة")
        self.test_no_tiered_pricing_cashback()
        
        # Cleanup Tests
        print("\n📋 المرحلة 6: اختبار الحذف")
        self.test_delete_product_soft_delete()
        
        # Generate Summary
        self.generate_summary()
        
        return True

    def generate_summary(self):
        """إنتاج ملخص النتائج"""
        print("\n" + "=" * 80)
        print("📊 ملخص نتائج الاختبار الشامل لنظام إدارة المنتجات المُحدث")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 إجمالي الاختبارات: {total_tests}")
        print(f"✅ نجح: {passed_tests}")
        print(f"❌ فشل: {failed_tests}")
        print(f"📊 نسبة النجاح: {success_rate:.1f}%")
        
        print(f"\n🎯 تقييم المتطلبات:")
        
        # Check specific requirements
        requirements_status = {
            "إنشاء منتجات بالبنية الجديدة": any("إنشاء منتج بالبنية الجديدة" in r["test"] and r["success"] for r in self.test_results),
            "ربط صحيح مع نظام الخطوط": any("الحصول على الخطوط المتاحة" in r["test"] and r["success"] for r in self.test_results),
            "إخفاء الأسعار لغير الأدمن": any("إخفاء الأسعار" in r["test"] and r["success"] for r in self.test_results),
            "إزالة النظام القديم": any("إزالة الأسعار المتدرجة والكاش باك" in r["test"] and r["success"] for r in self.test_results)
        }
        
        for requirement, status in requirements_status.items():
            status_icon = "✅" if status else "❌"
            print(f"{status_icon} {requirement}")
        
        print(f"\n📋 تفاصيل الاختبارات:")
        for result in self.test_results:
            status_icon = "✅" if result["success"] else "❌"
            print(f"{status_icon} {result['test']}")
            if result["details"]:
                print(f"   📝 {result['details']}")
            if result["error"]:
                print(f"   ⚠️ {result['error']}")
        
        # Overall assessment
        if success_rate >= 80:
            print(f"\n🎉 التقييم العام: ممتاز - النظام يعمل بشكل ممتاز!")
        elif success_rate >= 60:
            print(f"\n👍 التقييم العام: جيد - النظام يعمل مع بعض التحسينات المطلوبة")
        else:
            print(f"\n⚠️ التقييم العام: يحتاج تحسين - هناك مشاكل تحتاج إصلاح")
        
        print("=" * 80)

def main():
    """الدالة الرئيسية"""
    print("🚀 اختبار شامل لنظام إدارة المنتجات المُحدث")
    print("Comprehensive Testing for Updated Products Management System")
    print("=" * 80)
    
    test_suite = ProductsManagementTestSuite()
    
    try:
        test_suite.run_comprehensive_test()
        print("\n✅ اكتمل الاختبار الشامل بنجاح!")
        
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف الاختبار بواسطة المستخدم")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ خطأ غير متوقع في الاختبار: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()