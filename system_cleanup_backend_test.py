#!/usr/bin/env python3
"""
تنظيف شامل للنظام وإعداد للاستخدام الفعلي - اختبار شامل للباكند
Comprehensive System Cleanup and Production Readiness Backend Test

المطلوب:
1. حذف المستخدمين التجريبيين (test, demo, تجربة)
2. حذف جميع المنتجات الحالية (HARD DELETE)
3. تصفير الإحصائيات والأرقام
4. اختبار إضافة منتج جديد
5. اختبار ربط المنتجات بالحسابات والفواتير

الهدف: نظام نظيف جاهز للاستخدام الفعلي مع تكامل كامل
"""

import requests
import json
import time
from datetime import datetime
import sys
import os

# Configuration
BACKEND_URL = "https://a41c2fca-1f1f-4701-a590-4467215de5fe.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

class SystemCleanupTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        self.cleanup_stats = {
            "users_before": 0,
            "users_after": 0,
            "products_before": 0,
            "products_after": 0,
            "test_users_deleted": 0,
            "products_deleted": 0
        }
        
    def log_result(self, test_name, success, message, details=None):
        """تسجيل نتيجة الاختبار"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} | {test_name}: {message}")
        if details:
            print(f"   التفاصيل: {json.dumps(details, ensure_ascii=False, indent=2)}")
    
    def admin_login(self):
        """تسجيل دخول الأدمن"""
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.admin_token}"})
                
                user_info = data.get("user", {})
                self.log_result(
                    "تسجيل دخول الأدمن",
                    True,
                    f"تم تسجيل الدخول بنجاح للمستخدم: {user_info.get('full_name', 'غير محدد')} ({user_info.get('role', 'غير محدد')})",
                    f"Response time: {response.elapsed.total_seconds()*1000:.2f}ms"
                )
                return True
            else:
                self.log_result(
                    "تسجيل دخول الأدمن",
                    False,
                    f"فشل تسجيل الدخول: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("تسجيل دخول الأدمن", False, f"خطأ في الاتصال: {str(e)}")
            return False
    
    def get_system_statistics_before_cleanup(self):
        """الحصول على إحصائيات النظام قبل التنظيف"""
        try:
            # جلب المستخدمين
            users_response = self.session.get(f"{BACKEND_URL}/users")
            if users_response.status_code == 200:
                users = users_response.json()
                self.cleanup_stats["users_before"] = len(users)
                
                # تحليل المستخدمين التجريبيين
                test_users = []
                real_users = []
                
                for user in users:
                    username = user.get("username", "").lower()
                    full_name = user.get("full_name", "").lower()
                    
                    if ("test" in username or "demo" in username or 
                        "test" in full_name or "تجربة" in full_name):
                        test_users.append({
                            "id": user.get("id"),
                            "username": user.get("username"),
                            "full_name": user.get("full_name"),
                            "role": user.get("role")
                        })
                    else:
                        real_users.append({
                            "username": user.get("username"),
                            "full_name": user.get("full_name"),
                            "role": user.get("role")
                        })
                
                self.log_result(
                    "إحصائيات المستخدمين قبل التنظيف",
                    True,
                    f"إجمالي المستخدمين: {len(users)}, تجريبيين: {len(test_users)}, حقيقيين: {len(real_users)}",
                    {
                        "total_users": len(users),
                        "test_users_count": len(test_users),
                        "real_users_count": len(real_users),
                        "test_users_sample": test_users[:5],
                        "real_users_sample": real_users[:5]
                    }
                )
                
                # حفظ قائمة المستخدمين التجريبيين للحذف
                self.test_users_to_delete = test_users
                
            # جلب المنتجات
            products_response = self.session.get(f"{BACKEND_URL}/products")
            if products_response.status_code == 200:
                products = products_response.json()
                self.cleanup_stats["products_before"] = len(products)
                
                # تحليل المنتجات
                categories = {}
                lines = {}
                for product in products:
                    category = product.get("category", "غير محدد")
                    categories[category] = categories.get(category, 0) + 1
                    
                    line_name = product.get("line_name", "غير محدد")
                    lines[line_name] = lines.get(line_name, 0) + 1
                
                self.log_result(
                    "إحصائيات المنتجات قبل التنظيف",
                    True,
                    f"إجمالي المنتجات: {len(products)}",
                    {
                        "total_products": len(products),
                        "categories": categories,
                        "lines": lines,
                        "sample_products": [p.get("name") for p in products[:5]]
                    }
                )
                
                # حفظ قائمة المنتجات للحذف
                self.products_to_delete = products
            
            # جلب إحصائيات أخرى
            other_stats = {}
            endpoints = [
                ("clinics", "العيادات"),
                ("orders", "الطلبات"),
                ("visits", "الزيارات")
            ]
            
            for endpoint, name in endpoints:
                try:
                    response = self.session.get(f"{BACKEND_URL}/{endpoint}")
                    if response.status_code == 200:
                        data = response.json()
                        other_stats[name] = len(data)
                except:
                    other_stats[name] = "غير متاح"
            
            self.log_result(
                "إحصائيات النظام العامة",
                True,
                "تم جلب إحصائيات النظام بنجاح",
                other_stats
            )
            
            return True
            
        except Exception as e:
            self.log_result(
                "الحصول على إحصائيات النظام",
                False,
                f"خطأ في جلب الإحصائيات: {str(e)}"
            )
            return False
    
    def delete_test_users(self):
        """حذف المستخدمين التجريبيين"""
        if not hasattr(self, 'test_users_to_delete'):
            self.log_result(
                "حذف المستخدمين التجريبيين",
                False,
                "لا توجد قائمة بالمستخدمين التجريبيين"
            )
            return False
        
        deleted_users = []
        failed_deletions = []
        
        for user in self.test_users_to_delete:
            try:
                user_id = user.get("id")
                user_name = user.get("full_name", user.get("username", "غير محدد"))
                
                # تجنب حذف الأدمن
                if user.get("role") == "admin":
                    continue
                
                response = self.session.delete(f"{BACKEND_URL}/users/{user_id}")
                
                if response.status_code == 200:
                    deleted_users.append({
                        "id": user_id,
                        "name": user_name,
                        "role": user.get("role")
                    })
                    print(f"   ✅ تم حذف المستخدم: {user_name}")
                else:
                    failed_deletions.append({
                        "id": user_id,
                        "name": user_name,
                        "error": f"HTTP {response.status_code}"
                    })
                    print(f"   ❌ فشل حذف المستخدم: {user_name} - {response.status_code}")
                
                # تأخير قصير بين العمليات
                time.sleep(0.1)
                
            except Exception as e:
                failed_deletions.append({
                    "id": user.get("id"),
                    "name": user.get("full_name", "غير محدد"),
                    "error": str(e)
                })
        
        self.cleanup_stats["test_users_deleted"] = len(deleted_users)
        
        success = len(deleted_users) > 0
        message = f"تم حذف {len(deleted_users)} مستخدم تجريبي، فشل في حذف {len(failed_deletions)}"
        
        self.log_result(
            "حذف المستخدمين التجريبيين",
            success,
            message,
            {
                "deleted_count": len(deleted_users),
                "failed_count": len(failed_deletions),
                "deleted_users": deleted_users,
                "failed_deletions": failed_deletions[:3]  # عرض أول 3 فقط
            }
        )
        
        return success
    
    def delete_all_products(self):
        """حذف جميع المنتجات (HARD DELETE)"""
        if not hasattr(self, 'products_to_delete'):
            self.log_result(
                "حذف جميع المنتجات",
                False,
                "لا توجد قائمة بالمنتجات للحذف"
            )
            return False
        
        deleted_products = []
        failed_deletions = []
        
        for product in self.products_to_delete:
            try:
                product_id = product.get("id")
                product_name = product.get("name", "غير محدد")
                
                response = self.session.delete(f"{BACKEND_URL}/products/{product_id}")
                
                if response.status_code == 200:
                    deleted_products.append({
                        "id": product_id,
                        "name": product_name,
                        "category": product.get("category"),
                        "line_name": product.get("line_name")
                    })
                    print(f"   ✅ تم حذف المنتج: {product_name}")
                else:
                    failed_deletions.append({
                        "id": product_id,
                        "name": product_name,
                        "error": f"HTTP {response.status_code}"
                    })
                    print(f"   ❌ فشل حذف المنتج: {product_name} - {response.status_code}")
                
                # تأخير قصير بين العمليات
                time.sleep(0.1)
                
            except Exception as e:
                failed_deletions.append({
                    "id": product.get("id"),
                    "name": product.get("name", "غير محدد"),
                    "error": str(e)
                })
        
        self.cleanup_stats["products_deleted"] = len(deleted_products)
        
        success = len(deleted_products) > 0
        message = f"تم حذف {len(deleted_products)} منتج، فشل في حذف {len(failed_deletions)}"
        
        self.log_result(
            "حذف جميع المنتجات (HARD DELETE)",
            success,
            message,
            {
                "deleted_count": len(deleted_products),
                "failed_count": len(failed_deletions),
                "deleted_products": deleted_products[:5],  # عرض أول 5 فقط
                "failed_deletions": failed_deletions[:3]
            }
        )
        
        return success
    
    def verify_cleanup_results(self):
        """التحقق من نتائج التنظيف"""
        try:
            # التحقق من المستخدمين بعد التنظيف
            users_response = self.session.get(f"{BACKEND_URL}/users")
            if users_response.status_code == 200:
                users = users_response.json()
                self.cleanup_stats["users_after"] = len(users)
                
                # فحص وجود مستخدمين تجريبيين متبقيين
                remaining_test_users = []
                for user in users:
                    username = user.get("username", "").lower()
                    full_name = user.get("full_name", "").lower()
                    
                    if ("test" in username or "demo" in username or 
                        "test" in full_name or "تجربة" in full_name):
                        remaining_test_users.append(user.get("full_name", user.get("username")))
                
                users_cleanup_success = len(remaining_test_users) == 0
                
                self.log_result(
                    "التحقق من تنظيف المستخدمين",
                    users_cleanup_success,
                    f"المستخدمين قبل التنظيف: {self.cleanup_stats['users_before']}, بعد التنظيف: {len(users)}, متبقي تجريبي: {len(remaining_test_users)}",
                    {
                        "users_before": self.cleanup_stats["users_before"],
                        "users_after": len(users),
                        "remaining_test_users": remaining_test_users
                    }
                )
            
            # التحقق من المنتجات بعد التنظيف
            products_response = self.session.get(f"{BACKEND_URL}/products")
            if products_response.status_code == 200:
                products = products_response.json()
                self.cleanup_stats["products_after"] = len(products)
                
                products_cleanup_success = len(products) == 0
                
                self.log_result(
                    "التحقق من تنظيف المنتجات",
                    products_cleanup_success,
                    f"المنتجات قبل التنظيف: {self.cleanup_stats['products_before']}, بعد التنظيف: {len(products)}",
                    {
                        "products_before": self.cleanup_stats["products_before"],
                        "products_after": len(products),
                        "remaining_products": [p.get("name") for p in products[:5]] if products else []
                    }
                )
            
            return users_cleanup_success and products_cleanup_success
            
        except Exception as e:
            self.log_result(
                "التحقق من نتائج التنظيف",
                False,
                f"خطأ في التحقق: {str(e)}"
            )
            return False
    
    def test_add_new_product(self):
        """اختبار إضافة منتج جديد"""
        try:
            # الحصول على خط متاح
            lines_response = self.session.get(f"{BACKEND_URL}/lines")
            if lines_response.status_code != 200:
                self.log_result(
                    "اختبار إضافة منتج جديد",
                    False,
                    "فشل في جلب الخطوط المتاحة"
                )
                return False
            
            lines = lines_response.json()
            if not lines:
                self.log_result(
                    "اختبار إضافة منتج جديد",
                    False,
                    "لا توجد خطوط متاحة لإضافة المنتج"
                )
                return False
            
            # بيانات منتج حقيقي للاختبار
            new_product_data = {
                "name": "دواء الضغط الجديد - أملوديبين 10 مجم",
                "description": "دواء لعلاج ضغط الدم المرتفع، تركيز 10 مجم، علبة 30 قرص",
                "category": "أدوية القلب والأوعية الدموية",
                "unit": "علبة",
                "line_id": lines[0]["id"],
                "price": 45.50,
                "price_type": "fixed",
                "current_stock": 100,
                "is_active": True
            }
            
            response = self.session.post(f"{BACKEND_URL}/products", json=new_product_data)
            
            if response.status_code == 200:
                created_product = response.json().get("product", {})
                
                # التحقق من أن المنتج تم إنشاؤه بالبيانات الصحيحة
                verification_checks = {
                    "name_correct": created_product.get("name") == new_product_data["name"],
                    "price_correct": created_product.get("price") == new_product_data["price"],
                    "category_correct": created_product.get("category") == new_product_data["category"],
                    "line_assigned": created_product.get("line_id") == new_product_data["line_id"],
                    "has_id": bool(created_product.get("id"))
                }
                
                all_checks_passed = all(verification_checks.values())
                
                self.log_result(
                    "اختبار إضافة منتج جديد",
                    all_checks_passed,
                    f"تم إنشاء المنتج: {created_product.get('name')} بسعر {created_product.get('price')} ج.م",
                    {
                        "product_id": created_product.get("id"),
                        "product_name": created_product.get("name"),
                        "verification_checks": verification_checks,
                        "response_time": f"{response.elapsed.total_seconds()*1000:.2f}ms"
                    }
                )
                
                # حفظ معرف المنتج للاختبارات التالية
                self.test_product_id = created_product.get("id")
                return all_checks_passed
                
            else:
                self.log_result(
                    "اختبار إضافة منتج جديد",
                    False,
                    f"فشل في إنشاء المنتج: HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "اختبار إضافة منتج جديد",
                False,
                f"خطأ في اختبار إضافة المنتج: {str(e)}"
            )
            return False
    
    def test_product_integration_with_orders(self):
        """اختبار ربط المنتجات بالطلبات والفواتير"""
        if not hasattr(self, 'test_product_id'):
            self.log_result(
                "اختبار ربط المنتجات بالطلبات",
                False,
                "لا يوجد منتج تجريبي للاختبار"
            )
            return False
        
        try:
            # الحصول على عيادة متاحة
            clinics_response = self.session.get(f"{BACKEND_URL}/clinics")
            if clinics_response.status_code != 200:
                self.log_result(
                    "اختبار ربط المنتجات بالطلبات",
                    False,
                    "فشل في جلب العيادات المتاحة"
                )
                return False
            
            clinics = clinics_response.json()
            if not clinics:
                self.log_result(
                    "اختبار ربط المنتجات بالطلبات",
                    False,
                    "لا توجد عيادات متاحة لإنشاء الطلب"
                )
                return False
            
            # الحصول على مخزن متاح
            warehouses_response = self.session.get(f"{BACKEND_URL}/warehouses")
            if warehouses_response.status_code != 200:
                self.log_result(
                    "اختبار ربط المنتجات بالطلبات",
                    False,
                    "فشل في جلب المخازن المتاحة"
                )
                return False
            
            warehouses = warehouses_response.json()
            if not warehouses:
                self.log_result(
                    "اختبار ربط المنتجات بالطلبات",
                    False,
                    "لا توجد مخازن متاحة لإنشاء الطلب"
                )
                return False
            
            # إنشاء طلب يحتوي على المنتج الجديد
            order_data = {
                "clinic_id": clinics[0]["id"],
                "warehouse_id": warehouses[0]["id"],
                "items": [
                    {
                        "product_id": self.test_product_id,
                        "quantity": 5
                    }
                ],
                "line": "خط اختبار",
                "area_id": "منطقة اختبار",
                "notes": "طلب اختبار لفحص ربط المنتجات بالطلبات والفواتير",
                "debt_warning_acknowledged": True
            }
            
            response = self.session.post(f"{BACKEND_URL}/orders", json=order_data)
            
            if response.status_code == 200:
                order_result = response.json()
                order_id = order_result.get("order_id")
                
                # التحقق من تفاصيل الطلب
                order_detail_response = self.session.get(f"{BACKEND_URL}/orders/{order_id}")
                
                if order_detail_response.status_code == 200:
                    order_details = order_detail_response.json()
                    
                    # فحص ربط المنتج بالطلب
                    order_items = order_details.get("items", [])
                    product_found_in_order = any(
                        item.get("product_id") == self.test_product_id 
                        for item in order_items
                    )
                    
                    integration_checks = {
                        "order_created": bool(order_id),
                        "product_linked": product_found_in_order,
                        "total_amount": order_details.get("total_amount", 0) > 0,
                        "clinic_linked": bool(order_details.get("clinic_details")),
                        "items_count": len(order_items) > 0
                    }
                    
                    all_integration_checks = all(integration_checks.values())
                    
                    self.log_result(
                        "اختبار ربط المنتجات بالطلبات",
                        all_integration_checks,
                        f"تم إنشاء الطلب {order_result.get('order_number')} بقيمة {order_result.get('total_amount')} ج.م",
                        {
                            "order_id": order_id,
                            "order_number": order_result.get("order_number"),
                            "total_amount": order_result.get("total_amount"),
                            "integration_checks": integration_checks,
                            "clinic_name": order_details.get("clinic_details", {}).get("name", "غير محدد")
                        }
                    )
                    
                    return all_integration_checks
                else:
                    self.log_result(
                        "اختبار ربط المنتجات بالطلبات",
                        False,
                        f"فشل في جلب تفاصيل الطلب: HTTP {order_detail_response.status_code}"
                    )
                    return False
            else:
                self.log_result(
                    "اختبار ربط المنتجات بالطلبات",
                    False,
                    f"فشل في إنشاء الطلب: HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "اختبار ربط المنتجات بالطلبات",
                False,
                f"خطأ في اختبار الربط: {str(e)}"
            )
            return False
    
    def test_debt_system_integration(self):
        """اختبار تكامل نظام المديونية"""
        try:
            # اختبار إحصائيات الديون
            debt_stats_response = self.session.get(f"{BACKEND_URL}/debts/summary/statistics")
            
            debt_stats_success = debt_stats_response.status_code == 200
            if debt_stats_success:
                debt_stats = debt_stats_response.json()
                
                self.log_result(
                    "اختبار نظام المديونية - الإحصائيات",
                    True,
                    f"إحصائيات الديون: إجمالي {debt_stats.get('total_debt', 0)} ج.م، عدد الديون {debt_stats.get('debt_count', 0)}",
                    debt_stats
                )
            else:
                self.log_result(
                    "اختبار نظام المديونية - الإحصائيات",
                    False,
                    f"فشل في جلب إحصائيات الديون: HTTP {debt_stats_response.status_code}"
                )
            
            # اختبار سجلات الديون
            debts_response = self.session.get(f"{BACKEND_URL}/debts")
            
            debts_success = debts_response.status_code == 200
            if debts_success:
                debts = debts_response.json()
                debt_count = len(debts) if isinstance(debts, list) else 0
                
                self.log_result(
                    "اختبار نظام المديونية - السجلات",
                    True,
                    f"تم جلب {debt_count} سجل دين",
                    {"debt_count": debt_count}
                )
            else:
                self.log_result(
                    "اختبار نظام المديونية - السجلات",
                    False,
                    f"فشل في جلب سجلات الديون: HTTP {debts_response.status_code}"
                )
            
            # اختبار نظام التحصيل
            collections_response = self.session.get(f"{BACKEND_URL}/debts/collections")
            
            collections_success = collections_response.status_code == 200
            if collections_success:
                collections = collections_response.json()
                collection_count = len(collections) if isinstance(collections, list) else 0
                
                self.log_result(
                    "اختبار نظام التحصيل",
                    True,
                    f"تم جلب {collection_count} سجل تحصيل",
                    {"collection_count": collection_count}
                )
            else:
                self.log_result(
                    "اختبار نظام التحصيل",
                    False,
                    f"فشل في جلب سجلات التحصيل: HTTP {collections_response.status_code}"
                )
            
            return debt_stats_success and debts_success and collections_success
            
        except Exception as e:
            self.log_result(
                "اختبار تكامل نظام المديونية",
                False,
                f"خطأ في اختبار نظام المديونية: {str(e)}"
            )
            return False
    
    def test_accounting_system_integration(self):
        """اختبار التكامل مع النظام المحاسبي"""
        try:
            # اختبار إعدادات النظام
            settings_response = self.session.get(f"{BACKEND_URL}/admin/settings")
            
            settings_success = settings_response.status_code == 200
            if settings_success:
                self.log_result(
                    "اختبار النظام المحاسبي - الإعدادات",
                    True,
                    "تم جلب إعدادات النظام بنجاح"
                )
            else:
                self.log_result(
                    "اختبار النظام المحاسبي - الإعدادات",
                    False,
                    f"فشل في جلب إعدادات النظام: HTTP {settings_response.status_code}"
                )
            
            # اختبار إحصائيات الداشبورد
            dashboard_response = self.session.get(f"{BACKEND_URL}/dashboard/stats")
            
            dashboard_success = dashboard_response.status_code == 200
            if dashboard_success:
                dashboard_stats = dashboard_response.json()
                
                self.log_result(
                    "اختبار النظام المحاسبي - الداشبورد",
                    True,
                    f"إحصائيات الداشبورد: مستخدمين {dashboard_stats.get('total_users', 0)}, عيادات {dashboard_stats.get('total_clinics', 0)}, منتجات {dashboard_stats.get('total_products', 0)}",
                    dashboard_stats
                )
            else:
                self.log_result(
                    "اختبار النظام المحاسبي - الداشبورد",
                    False,
                    f"فشل في جلب إحصائيات الداشبورد: HTTP {dashboard_response.status_code}"
                )
            
            return settings_success and dashboard_success
            
        except Exception as e:
            self.log_result(
                "اختبار التكامل مع النظام المحاسبي",
                False,
                f"خطأ في اختبار النظام المحاسبي: {str(e)}"
            )
            return False
    
    def generate_final_report(self):
        """إنشاء التقرير النهائي"""
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        execution_time = time.time() - self.start_time
        
        print("\n" + "="*80)
        print("🎯 التقرير النهائي لتنظيف النظام وإعداده للاستخدام الفعلي")
        print("="*80)
        
        print(f"\n📊 ملخص النتائج:")
        print(f"   إجمالي الاختبارات: {total_tests}")
        print(f"   الاختبارات الناجحة: {successful_tests} ✅")
        print(f"   الاختبارات الفاشلة: {failed_tests} ❌")
        print(f"   معدل النجاح: {success_rate:.1f}%")
        print(f"   وقت التنفيذ: {execution_time:.2f} ثانية")
        
        print(f"\n🧹 إحصائيات التنظيف:")
        print(f"   المستخدمين قبل التنظيف: {self.cleanup_stats['users_before']}")
        print(f"   المستخدمين بعد التنظيف: {self.cleanup_stats['users_after']}")
        print(f"   المستخدمين التجريبيين المحذوفين: {self.cleanup_stats['test_users_deleted']}")
        print(f"   المنتجات قبل التنظيف: {self.cleanup_stats['products_before']}")
        print(f"   المنتجات بعد التنظيف: {self.cleanup_stats['products_after']}")
        print(f"   المنتجات المحذوفة: {self.cleanup_stats['products_deleted']}")
        
        print(f"\n🔍 تفاصيل الاختبارات:")
        
        # تجميع النتائج حسب الفئة
        categories = {
            "تنظيف النظام": [],
            "اختبار المنتجات": [],
            "اختبار التكامل": []
        }
        
        for result in self.test_results:
            test_name = result["test"]
            if any(keyword in test_name for keyword in ["تنظيف", "حذف", "إحصائيات"]):
                categories["تنظيف النظام"].append(result)
            elif any(keyword in test_name for keyword in ["منتج", "طلب"]):
                categories["اختبار المنتجات"].append(result)
            else:
                categories["اختبار التكامل"].append(result)
        
        for category, results in categories.items():
            if results:
                print(f"\n📋 {category}:")
                for result in results:
                    status = "✅" if result["success"] else "❌"
                    print(f"   {status} {result['test']}: {result['message']}")
        
        # النتائج الحاسمة
        print(f"\n🎯 النتائج الحاسمة للمتطلبات:")
        
        # التحقق من المتطلبات الأساسية
        cleanup_success = self.cleanup_stats['test_users_deleted'] > 0 and self.cleanup_stats['products_deleted'] > 0
        if cleanup_success:
            print(f"   ✅ تنظيف النظام: تم حذف {self.cleanup_stats['test_users_deleted']} مستخدم تجريبي و {self.cleanup_stats['products_deleted']} منتج")
        else:
            print(f"   ❌ تنظيف النظام: فشل في التنظيف الكامل")
        
        product_test = next((r for r in self.test_results if "إضافة منتج جديد" in r["test"]), None)
        if product_test and product_test["success"]:
            print(f"   ✅ إضافة منتج جديد: يعمل بشكل صحيح")
        else:
            print(f"   ❌ إضافة منتج جديد: يحتاج إصلاح")
        
        integration_test = next((r for r in self.test_results if "ربط المنتجات بالطلبات" in r["test"]), None)
        if integration_test and integration_test["success"]:
            print(f"   ✅ ربط المنتجات بالطلبات: يعمل بشكل صحيح")
        else:
            print(f"   ❌ ربط المنتجات بالطلبات: يحتاج إصلاح")
        
        debt_test = next((r for r in self.test_results if "نظام المديونية" in r["test"]), None)
        if debt_test and debt_test["success"]:
            print(f"   ✅ نظام المديونية: متكامل ويعمل")
        else:
            print(f"   ⚠️ نظام المديونية: قد يحتاج مراجعة")
        
        # التوصيات
        print(f"\n💡 التوصيات:")
        if success_rate >= 90:
            print("   🎉 النظام نظيف وجاهز للاستخدام الفعلي!")
            print("   📝 يمكن البدء في إدخال البيانات الحقيقية")
        elif success_rate >= 75:
            print("   👍 النظام في حالة جيدة مع بعض التحسينات المطلوبة")
            print("   🔧 يرجى مراجعة الاختبارات الفاشلة قبل الاستخدام الفعلي")
        else:
            print("   ⚠️ النظام يحتاج إلى مراجعة شاملة قبل الاستخدام الفعلي")
            print("   🚫 لا ينصح بالاستخدام الفعلي حتى إصلاح المشاكل")
        
        if self.cleanup_stats['products_after'] == 0:
            print("   ✅ قاعدة البيانات نظيفة من المنتجات - جاهزة لإدخال المنتجات الحقيقية")
        
        if self.cleanup_stats['users_after'] < self.cleanup_stats['users_before']:
            print("   ✅ تم تنظيف المستخدمين التجريبيين - النظام جاهز للمستخدمين الحقيقيين")
        
        print("\n" + "="*80)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "execution_time": execution_time,
            "cleanup_stats": self.cleanup_stats,
            "test_results": self.test_results
        }
    
    def run_all_tests(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء تنظيف شامل للنظام وإعداده للاستخدام الفعلي")
        print("="*80)
        
        # تسجيل دخول الأدمن
        if not self.admin_login():
            print("❌ فشل في تسجيل دخول الأدمن. إيقاف الاختبارات.")
            return self.generate_final_report()
        
        # الحصول على إحصائيات النظام قبل التنظيف
        print(f"\n📊 الحصول على إحصائيات النظام قبل التنظيف:")
        self.get_system_statistics_before_cleanup()
        
        # تنظيف النظام
        print(f"\n🧹 بدء عملية التنظيف:")
        self.delete_test_users()
        self.delete_all_products()
        
        # التحقق من نتائج التنظيف
        print(f"\n✅ التحقق من نتائج التنظيف:")
        self.verify_cleanup_results()
        
        # اختبار إضافة منتج جديد
        print(f"\n🆕 اختبار إضافة منتج جديد:")
        self.test_add_new_product()
        
        # اختبار التكامل
        print(f"\n🔗 اختبار التكامل:")
        self.test_product_integration_with_orders()
        self.test_debt_system_integration()
        self.test_accounting_system_integration()
        
        # إنشاء التقرير النهائي
        return self.generate_final_report()

def main():
    """الدالة الرئيسية"""
    tester = SystemCleanupTester()
    
    try:
        report = tester.run_all_tests()
        
        # حفظ التقرير في ملف
        with open("/app/system_cleanup_test_report.json", "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 تم حفظ التقرير التفصيلي في: /app/system_cleanup_test_report.json")
        
        return report["success_rate"] >= 75
        
    except KeyboardInterrupt:
        print("\n⏹️ تم إيقاف الاختبار بواسطة المستخدم")
        return False
    except Exception as e:
        print(f"\n💥 خطأ عام في تشغيل الاختبارات: {str(e)}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)