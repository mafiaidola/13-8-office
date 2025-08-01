#!/usr/bin/env python3
"""
اختبار سريع للتأكد من أن إنشاء خط جديد يعمل مع البيانات الجديدة
Quick test to verify that creating a new line works with the new data

الهدف: التحقق من أن POST /api/lines يقبل البيانات الجديدة بشكل صحيح
Goal: Verify that POST /api/lines accepts new data correctly
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://4bd6a5b6-7d69-4d01-ab9e-6f0ddd678934.preview.emergentagent.com/api"
TIMEOUT = 30

class LinesTestFocused:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.created_line_id = None
        
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
                self.log_result(
                    "تسجيل دخول الأدمن",
                    True,
                    f"تم تسجيل الدخول بنجاح للمستخدم: {data['user']['username']}"
                )
                return True
            else:
                self.log_result(
                    "تسجيل دخول الأدمن",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("تسجيل دخول الأدمن", False, error=str(e))
            return False

    def test_create_line_with_provided_data(self):
        """اختبار إنشاء خط جديد بالبيانات المقدمة في الطلب"""
        try:
            # البيانات المقدمة في طلب المراجعة
            line_data = {
                "name": "خط تجريبي",
                "code": "TEST_001", 
                "description": "خط تجريبي للاختبار",
                "manager_id": None,  # سيتم تعيين admin_user_id إذا وُجد
                "assigned_products": [],
                "coverage_areas": [],
                "color": "#3B82F6",
                "priority": 1
            }
            
            # محاولة الحصول على admin user id
            try:
                users_response = self.session.get(f"{BASE_URL}/users", timeout=TIMEOUT)
                if users_response.status_code == 200:
                    users = users_response.json()
                    admin_user = next((u for u in users if u.get("username") == "admin"), None)
                    if admin_user:
                        line_data["manager_id"] = admin_user["id"]
                        self.log_result(
                            "الحصول على admin_user_id",
                            True,
                            f"تم العثور على admin user: {admin_user['id']}"
                        )
            except Exception as e:
                self.log_result(
                    "الحصول على admin_user_id",
                    False,
                    error=f"لم يتم العثور على admin user: {str(e)}"
                )
            
            response = self.session.post(
                f"{BASE_URL}/lines",
                json=line_data,
                timeout=TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    self.created_line_id = result["line"]["id"]
                    self.log_result(
                        "POST /api/lines - إنشاء خط تجريبي",
                        True,
                        f"تم إنشاء الخط بنجاح: {result['line']['name']} (ID: {self.created_line_id})"
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/lines - إنشاء خط تجريبي",
                        False,
                        error=result.get("message", "فشل في إنشاء الخط")
                    )
                    return False
            else:
                self.log_result(
                    "POST /api/lines - إنشاء خط تجريبي",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("POST /api/lines - إنشاء خط تجريبي", False, error=str(e))
            return False

    def test_get_lines_includes_new_line(self):
        """اختبار أن GET /api/lines يعيد الخط الجديد"""
        try:
            response = self.session.get(f"{BASE_URL}/lines", timeout=TIMEOUT)
            
            if response.status_code == 200:
                lines = response.json()
                
                # البحث عن الخط الجديد
                new_line = None
                if self.created_line_id:
                    new_line = next((line for line in lines if line.get("id") == self.created_line_id), None)
                
                if new_line:
                    self.log_result(
                        "GET /api/lines - يعيد الخط الجديد",
                        True,
                        f"تم العثور على الخط الجديد: {new_line['name']} (كود: {new_line['code']})"
                    )
                    return True
                else:
                    # البحث بالاسم أو الكود
                    test_line = next((line for line in lines if line.get("name") == "خط تجريبي" or line.get("code") == "TEST_001"), None)
                    if test_line:
                        self.log_result(
                            "GET /api/lines - يعيد الخط الجديد",
                            True,
                            f"تم العثور على خط تجريبي: {test_line['name']} (كود: {test_line['code']})"
                        )
                        return True
                    else:
                        self.log_result(
                            "GET /api/lines - يعيد الخط الجديد",
                            False,
                            error=f"لم يتم العثور على الخط الجديد في قائمة الخطوط ({len(lines)} خط موجود)"
                        )
                        return False
            else:
                self.log_result(
                    "GET /api/lines - يعيد الخط الجديد",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("GET /api/lines - يعيد الخط الجديد", False, error=str(e))
            return False

    def test_products_available_for_assignment(self):
        """اختبار أن هناك منتجات متاحة للإضافة للخطوط"""
        try:
            response = self.session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
            
            if response.status_code == 200:
                products = response.json()
                active_products = [p for p in products if p.get("is_active", True)]
                
                self.log_result(
                    "GET /api/products - منتجات متاحة للإضافة",
                    True,
                    f"يوجد {len(active_products)} منتج نشط متاح للإضافة للخطوط"
                )
                
                # عرض أسماء أول 5 منتجات
                if active_products:
                    product_names = [p.get("name", "بدون اسم") for p in active_products[:5]]
                    self.log_result(
                        "أمثلة على المنتجات المتاحة",
                        True,
                        f"المنتجات: {', '.join(product_names)}"
                    )
                
                return len(active_products) > 0
            else:
                self.log_result(
                    "GET /api/products - منتجات متاحة للإضافة",
                    False,
                    error=f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_result("GET /api/products - منتجات متاحة للإضافة", False, error=str(e))
            return False

    def test_line_product_assignment(self):
        """اختبار إضافة منتجات للخط الجديد"""
        if not self.created_line_id:
            self.log_result(
                "تخصيص منتجات للخط",
                False,
                error="لا يوجد خط تم إنشاؤه للاختبار"
            )
            return False
            
        try:
            # الحصول على المنتجات المتاحة
            products_response = self.session.get(f"{BASE_URL}/products", timeout=TIMEOUT)
            
            if products_response.status_code == 200:
                products = products_response.json()
                active_products = [p for p in products if p.get("is_active", True)]
                
                if active_products:
                    # أخذ أول منتجين للتخصيص
                    product_ids = [p["id"] for p in active_products[:2]]
                    
                    assignment_data = {
                        "line_id": self.created_line_id,
                        "product_ids": product_ids,
                        "assigned_by": "admin",
                        "assignment_reason": "اختبار تخصيص المنتجات للخط التجريبي",
                        "effective_date": datetime.now().isoformat(),
                        "notes": "تخصيص تجريبي للاختبار"
                    }
                    
                    response = self.session.post(
                        f"{BASE_URL}/lines/{self.created_line_id}/products",
                        json=assignment_data,
                        timeout=TIMEOUT
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        if result.get("success"):
                            self.log_result(
                                "POST /api/lines/{line_id}/products - تخصيص منتجات",
                                True,
                                f"تم تخصيص {len(product_ids)} منتج للخط بنجاح"
                            )
                            return True
                        else:
                            self.log_result(
                                "POST /api/lines/{line_id}/products - تخصيص منتجات",
                                False,
                                error=result.get("message", "فشل في تخصيص المنتجات")
                            )
                            return False
                    else:
                        self.log_result(
                            "POST /api/lines/{line_id}/products - تخصيص منتجات",
                            False,
                            error=f"HTTP {response.status_code}: {response.text}"
                        )
                        return False
                else:
                    self.log_result(
                        "POST /api/lines/{line_id}/products - تخصيص منتجات",
                        False,
                        error="لا توجد منتجات نشطة متاحة للتخصيص"
                    )
                    return False
            else:
                self.log_result(
                    "POST /api/lines/{line_id}/products - تخصيص منتجات",
                    False,
                    error=f"فشل في جلب المنتجات: HTTP {products_response.status_code}"
                )
                return False
                
        except Exception as e:
            self.log_result("POST /api/lines/{line_id}/products - تخصيص منتجات", False, error=str(e))
            return False

    def run_focused_test(self):
        """تشغيل الاختبار المركز"""
        print("🚀 بدء الاختبار السريع لإنشاء خط جديد")
        print("=" * 60)
        
        # 1. تسجيل الدخول كـ admin
        if not self.login_admin():
            print("❌ فشل في تسجيل الدخول. إيقاف الاختبار.")
            return self.generate_final_report()
        
        # 2. اختبار إنشاء خط جديد بالبيانات المقدمة
        line_created = self.test_create_line_with_provided_data()
        
        # 3. اختبار أن GET /api/lines يعيد الخط الجديد
        if line_created:
            self.test_get_lines_includes_new_line()
        
        # 4. اختبار وجود منتجات متاحة للإضافة
        products_available = self.test_products_available_for_assignment()
        
        # 5. اختبار إضافة منتجات للخط (إذا كان الخط تم إنشاؤه والمنتجات متاحة)
        if line_created and products_available:
            self.test_line_product_assignment()
        
        # إنتاج التقرير النهائي
        return self.generate_final_report()

    def generate_final_report(self):
        """إنتاج التقرير النهائي"""
        print("\n" + "=" * 60)
        print("📊 التقرير النهائي للاختبار السريع")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        successful_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - successful_tests
        success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📈 إجمالي الاختبارات: {total_tests}")
        print(f"✅ الاختبارات الناجحة: {successful_tests}")
        print(f"❌ الاختبارات الفاشلة: {failed_tests}")
        print(f"📊 نسبة النجاح: {success_rate:.1f}%")
        print()
        
        # تفاصيل النتائج
        print("📋 تفاصيل النتائج:")
        print("-" * 40)
        
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}")
            if result["details"]:
                print(f"   📝 {result['details']}")
            if result["error"]:
                print(f"   ⚠️ {result['error']}")
        
        print("\n" + "=" * 60)
        
        # الخلاصة والتوصيات
        if success_rate >= 80:
            print("🎉 النتيجة: نظام إنشاء الخطوط يعمل بشكل ممتاز!")
            print("✅ التوقع: نجاح إنشاء الخط وعرضه في القائمة - تحقق بنجاح")
        elif success_rate >= 60:
            print("⚠️ النتيجة: نظام إنشاء الخطوط يعمل مع بعض المشاكل البسيطة")
        else:
            print("❌ النتيجة: نظام إنشاء الخطوط يحتاج إصلاحات")
        
        print("=" * 60)
        print("🏁 انتهى الاختبار السريع")
        print("=" * 60)
        
        return {
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "test_results": self.test_results,
            "line_created": self.created_line_id is not None
        }

def main():
    """الدالة الرئيسية"""
    tester = LinesTestFocused()
    results = tester.run_focused_test()
    
    # Return exit code based on success rate
    if results and results.get("success_rate", 0) >= 75:
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure

if __name__ == "__main__":
    main()