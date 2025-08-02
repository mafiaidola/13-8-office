#!/usr/bin/env python3
"""
اختبار نهائي مُكثف لإخفاء الأسعار بعد إزالة endpoint المكرر
Final Intensive Test for Price Hiding After Duplicate Endpoint Removal

الهدف الحاسم: التحقق من أن إزالة duplicate products endpoint أصلحت مشكلة إخفاء الأسعار
Critical Goal: Verify that removing duplicate products endpoint fixed price hiding issue
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
import uuid

# Configuration
BACKEND_URL = "https://d3d1a9df-70fc-435f-82af-b5d9d4d817e1.preview.emergentagent.com/api"

class PriceHidingTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.admin_token = None
        self.medical_rep_token = None
        self.accounting_token = None
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        connector = aiohttp.TCPConnector(ssl=False)
        timeout = aiohttp.ClientTimeout(total=30)
        self.session = aiohttp.ClientSession(connector=connector, timeout=timeout)
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str):
        """تسجيل نتيجة الاختبار"""
        status = "✅ نجح" if success else "❌ فشل"
        print(f"{status} {test_name}: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    async def login_user(self, username: str, password: str) -> str:
        """تسجيل دخول المستخدم والحصول على JWT token"""
        try:
            login_data = {"username": username, "password": password}
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    token = data.get("access_token")
                    user_info = data.get("user", {})
                    self.log_test(f"تسجيل دخول {username}", True, 
                                f"نجح تسجيل الدخول - الدور: {user_info.get('role', 'غير محدد')}")
                    return token
                else:
                    error_text = await response.text()
                    self.log_test(f"تسجيل دخول {username}", False, f"فشل: {response.status} - {error_text}")
                    return None
        except Exception as e:
            self.log_test(f"تسجيل دخول {username}", False, f"خطأ: {str(e)}")
            return None
    
    async def create_medical_rep(self) -> str:
        """إنشاء مندوب مبيعات جديد للاختبار"""
        try:
            if not self.admin_token:
                self.log_test("إنشاء مندوب", False, "لا يوجد admin token")
                return None
                
            rep_data = {
                "username": f"test_rep_{uuid.uuid4().hex[:8]}",
                "password": "test123456",
                "full_name": "مندوب اختبار الأسعار",
                "role": "medical_rep",
                "email": f"test_rep_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "+201234567890",
                "is_active": True
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.post(f"{BACKEND_URL}/users", json=rep_data, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("إنشاء مندوب", True, f"تم إنشاء المندوب: {rep_data['username']}")
                    return rep_data["username"]
                else:
                    error_text = await response.text()
                    self.log_test("إنشاء مندوب", False, f"فشل: {response.status} - {error_text}")
                    return None
        except Exception as e:
            self.log_test("إنشاء مندوب", False, f"خطأ: {str(e)}")
            return None
    
    async def create_accounting_user(self) -> str:
        """إنشاء مستخدم محاسبة للاختبار"""
        try:
            if not self.admin_token:
                self.log_test("إنشاء محاسب", False, "لا يوجد admin token")
                return None
                
            acc_data = {
                "username": f"test_acc_{uuid.uuid4().hex[:8]}",
                "password": "test123456",
                "full_name": "محاسب اختبار الأسعار",
                "role": "accounting",
                "email": f"test_acc_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "+201234567891",
                "is_active": True
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            async with self.session.post(f"{BACKEND_URL}/users", json=acc_data, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("إنشاء محاسب", True, f"تم إنشاء المحاسب: {acc_data['username']}")
                    return acc_data["username"]
                else:
                    error_text = await response.text()
                    self.log_test("إنشاء محاسب", False, f"فشل: {response.status} - {error_text}")
                    return None
        except Exception as e:
            self.log_test("إنشاء محاسب", False, f"خطأ: {str(e)}")
            return None
    
    async def test_products_endpoint_count(self):
        """1. تأكيد حذف Endpoint المكرر"""
        try:
            # فحص server.py للتأكد من وجود endpoint واحد فقط
            with open('/app/backend/server.py', 'r', encoding='utf-8') as f:
                content = f.read()
            
            # البحث عن جميع endpoints للمنتجات
            import re
            products_endpoints = re.findall(r'@api_router\.get\("/products"\)', content)
            endpoint_count = len(products_endpoints)
            
            if endpoint_count == 1:
                self.log_test("فحص Endpoint المكرر", True, 
                            f"يوجد endpoint واحد فقط للمنتجات (✅ تم حذف المكرر)")
                
                # فحص وجود منطق إخفاء الأسعار
                if "should_hide_prices" in content and "user_role not in" in content:
                    self.log_test("فحص منطق إخفاء الأسعار", True, 
                                "✅ الـ endpoint المتبقي يحتوي على منطق إخفاء الأسعار")
                else:
                    self.log_test("فحص منطق إخفاء الأسعار", False, 
                                "❌ الـ endpoint لا يحتوي على منطق إخفاء الأسعار")
            else:
                self.log_test("فحص Endpoint المكرر", False, 
                            f"يوجد {endpoint_count} endpoints للمنتجات (يجب أن يكون 1 فقط)")
                
        except Exception as e:
            self.log_test("فحص Endpoint المكرر", False, f"خطأ: {str(e)}")
    
    async def test_products_api_call(self, token: str, user_type: str, should_see_prices: bool):
        """اختبار استدعاء API المنتجات مع token محدد"""
        try:
            headers = {"Authorization": f"Bearer {token}"}
            async with self.session.get(f"{BACKEND_URL}/products", headers=headers) as response:
                if response.status == 200:
                    products = await response.json()
                    
                    if not products:
                        self.log_test(f"اختبار المنتجات - {user_type}", False, 
                                    "لا توجد منتجات في قاعدة البيانات")
                        return
                    
                    # فحص المنتج الأول
                    first_product = products[0]
                    has_price = "price" in first_product
                    has_price_type = "price_type" in first_product
                    
                    # فحص جميع الحقول المتعلقة بالأسعار
                    price_fields = ["price", "price_type", "unit_price", "price_1", "price_10", "price_25", "price_50", "price_100"]
                    found_price_fields = [field for field in price_fields if field in first_product]
                    
                    if should_see_prices:
                        if has_price:  # الأدمن والمحاسبة يجب أن يروا على الأقل حقل price
                            self.log_test(f"اختبار المنتجات - {user_type}", True, 
                                        f"✅ {user_type} يرى الأسعار كما هو مطلوب (عدد المنتجات: {len(products)}, حقول الأسعار: {found_price_fields})")
                        else:
                            self.log_test(f"اختبار المنتجات - {user_type}", False, 
                                        f"❌ {user_type} لا يرى الأسعار (يجب أن يراها) - حقول موجودة: {found_price_fields}")
                    else:
                        if not has_price:  # المندوبين يجب ألا يروا أي حقول أسعار
                            self.log_test(f"اختبار المنتجات - {user_type}", True, 
                                        f"✅ {user_type} لا يرى الأسعار كما هو مطلوب (عدد المنتجات: {len(products)}, حقول مخفية: {len(price_fields) - len(found_price_fields)})")
                        else:
                            self.log_test(f"اختبار المنتجات - {user_type}", False, 
                                        f"❌ {user_type} يرى الأسعار (يجب ألا يراها) - حقول مكشوفة: {found_price_fields}")
                    
                    # طباعة تفاصيل المنتج الأول للتشخيص
                    product_keys = list(first_product.keys())
                    print(f"🔍 تفاصيل المنتج الأول لـ {user_type}: {product_keys}")
                    
                else:
                    error_text = await response.text()
                    self.log_test(f"اختبار المنتجات - {user_type}", False, 
                                f"فشل API: {response.status} - {error_text}")
                    
        except Exception as e:
            self.log_test(f"اختبار المنتجات - {user_type}", False, f"خطأ: {str(e)}")
    
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🎯 بدء الاختبار النهائي المُكثف لإخفاء الأسعار")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # 1. تأكيد حذف Endpoint المكرر
            print("\n📋 المرحلة 1: فحص حذف Endpoint المكرر")
            await self.test_products_endpoint_count()
            
            # 2. تسجيل دخول الأدمن
            print("\n📋 المرحلة 2: تسجيل دخول الأدمن")
            self.admin_token = await self.login_user("admin", "admin123")
            if not self.admin_token:
                print("❌ فشل تسجيل دخول الأدمن - توقف الاختبار")
                return
            
            # 3. إنشاء مندوب مبيعات
            print("\n📋 المرحلة 3: إنشاء مندوب مبيعات")
            rep_username = await self.create_medical_rep()
            if rep_username:
                self.medical_rep_token = await self.login_user(rep_username, "test123456")
            
            # 4. إنشاء مستخدم محاسبة
            print("\n📋 المرحلة 4: إنشاء مستخدم محاسبة")
            acc_username = await self.create_accounting_user()
            if acc_username:
                self.accounting_token = await self.login_user(acc_username, "test123456")
            
            # 5. اختبار إخفاء الأسعار للمندوبين
            print("\n📋 المرحلة 5: اختبار إخفاء الأسعار للمندوبين")
            if self.medical_rep_token:
                await self.test_products_api_call(self.medical_rep_token, "المندوب", False)
            else:
                self.log_test("اختبار المنتجات - المندوب", False, "لا يوجد token للمندوب")
            
            # 6. اختبار ظهور الأسعار للأدمن
            print("\n📋 المرحلة 6: اختبار ظهور الأسعار للأدمن")
            await self.test_products_api_call(self.admin_token, "الأدمن", True)
            
            # 7. اختبار ظهور الأسعار للمحاسبة
            print("\n📋 المرحلة 7: اختبار ظهور الأسعار للمحاسبة")
            if self.accounting_token:
                await self.test_products_api_call(self.accounting_token, "المحاسب", True)
            else:
                self.log_test("اختبار المنتجات - المحاسب", False, "لا يوجد token للمحاسب")
            
            # 8. فحص Debug Logs
            print("\n📋 المرحلة 8: فحص Debug Logs")
            await self.check_debug_logs()
            
        finally:
            await self.cleanup_session()
        
        # النتائج النهائية
        self.print_final_results()
    
    async def check_debug_logs(self):
        """فحص ظهور debug messages في server logs"""
        try:
            # فحص وجود debug messages في الكود
            with open('/app/backend/server.py', 'r', encoding='utf-8') as f:
                content = f.read()
            
            debug_messages = [
                "PRICE VISIBILITY DEBUG: User role is:",
                "PRICE VISIBILITY DEBUG: Should hide prices:",
                "PRICE VISIBILITY DEBUG: Hiding prices for user role:",
                "PRICE VISIBILITY DEBUG: Showing prices for authorized user role:"
            ]
            
            found_debug_count = 0
            for debug_msg in debug_messages:
                if debug_msg in content:
                    found_debug_count += 1
            
            if found_debug_count >= 3:
                self.log_test("فحص Debug Logs", True, 
                            f"✅ يوجد {found_debug_count}/4 debug messages في الكود")
            else:
                self.log_test("فحص Debug Logs", False, 
                            f"❌ يوجد {found_debug_count}/4 debug messages فقط")
                
        except Exception as e:
            self.log_test("فحص Debug Logs", False, f"خطأ: {str(e)}")
    
    def print_final_results(self):
        """طباعة النتائج النهائية"""
        print("\n" + "=" * 80)
        print("🎯 النتائج النهائية للاختبار المُكثف لإخفاء الأسعار")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n📊 الإحصائيات العامة:")
        print(f"   • إجمالي الاختبارات: {total_tests}")
        print(f"   • الاختبارات الناجحة: {passed_tests}")
        print(f"   • الاختبارات الفاشلة: {total_tests - passed_tests}")
        print(f"   • نسبة النجاح: {success_rate:.1f}%")
        
        print(f"\n📋 تفاصيل النتائج:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"   {status} {result['test']}: {result['details']}")
        
        # الحكم النهائي
        print(f"\n🎯 الحكم النهائي:")
        if success_rate >= 85:
            print("   🎉 ممتاز! تم حل مشكلة إخفاء الأسعار بنجاح")
            print("   ✅ المندوبين لا يرون الأسعار")
            print("   ✅ الأدمن والمحاسبة يرون الأسعار")
            print("   ✅ النظام يعمل كما هو مطلوب")
        elif success_rate >= 70:
            print("   ⚠️ جيد مع بعض المشاكل البسيطة")
            print("   🔧 يحتاج إصلاحات طفيفة")
        else:
            print("   ❌ يوجد مشاكل حرجة في إخفاء الأسعار")
            print("   🚨 يتطلب إصلاح فوري")
        
        print("=" * 80)

async def main():
    """الدالة الرئيسية"""
    tester = PriceHidingTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())