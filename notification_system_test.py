#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🔔 Advanced Notification System Testing - اختبار نظام الإشعارات المتقدم
Testing comprehensive notification system APIs and functionality
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import sys
import os

# Configuration
BACKEND_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class NotificationSystemTester:
    def __init__(self):
        self.session = None
        self.admin_token = None
        self.test_results = []
        self.start_time = time.time()
        
    async def setup_session(self):
        """إعداد جلسة HTTP"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={"Content-Type": "application/json"}
        )
        
    async def cleanup_session(self):
        """تنظيف الجلسة"""
        if self.session:
            await self.session.close()
            
    async def admin_login(self) -> bool:
        """تسجيل دخول الأدمن"""
        try:
            async with self.session.post(f"{BACKEND_URL}/auth/login", json=ADMIN_CREDENTIALS) as response:
                if response.status == 200:
                    data = await response.json()
                    self.admin_token = data.get("access_token")
                    print(f"✅ Admin login successful - Token: {self.admin_token[:20]}...")
                    return True
                else:
                    print(f"❌ Admin login failed - Status: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Admin login error: {e}")
            return False
            
    def get_auth_headers(self) -> Dict[str, str]:
        """الحصول على headers المصادقة"""
        return {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
    async def test_create_single_notification(self) -> bool:
        """اختبار إنشاء إشعار واحد"""
        try:
            notification_data = {
                "title": "إشعار اختبار",
                "message": "هذا إشعار اختبار للنظام المتقدم",
                "type": "system_alert",
                "priority": "medium",
                "recipient_id": "admin-user-id",
                "recipient_role": "admin",
                "metadata": {
                    "test": True,
                    "created_by": "automated_test"
                },
                "action_url": "/dashboard"
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/notifications/",
                json=notification_data,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Single notification created - ID: {data.get('notification_id', 'N/A')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Single notification creation failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Single notification creation error: {e}")
            return False
            
    async def test_create_bulk_notifications(self) -> bool:
        """اختبار إنشاء إشعارات متعددة"""
        try:
            bulk_data = {
                "recipients": ["admin-user-id"],
                "recipient_roles": ["medical_rep"],
                "title": "إشعار جماعي للمندوبين",
                "message": "رسالة مهمة لجميع المندوبين الطبيين",
                "type": "task_assigned",
                "priority": "high",
                "metadata": {
                    "bulk_test": True,
                    "target_group": "medical_reps"
                }
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/notifications/bulk",
                json=bulk_data,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Bulk notifications created - Message: {data.get('message', 'N/A')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Bulk notifications creation failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Bulk notifications creation error: {e}")
            return False
            
    async def test_get_my_notifications(self) -> bool:
        """اختبار جلب إشعاراتي"""
        try:
            params = {
                "limit": 20,
                "offset": 0
            }
            
            async with self.session.get(
                f"{BACKEND_URL}/notifications/",
                params=params,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("data", {}).get("notifications", [])
                    total_count = data.get("data", {}).get("total_count", 0)
                    print(f"✅ Retrieved notifications - Count: {len(notifications)}, Total: {total_count}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Get notifications failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Get notifications error: {e}")
            return False
            
    async def test_notification_filtering(self) -> bool:
        """اختبار فلترة الإشعارات"""
        try:
            # اختبار فلترة حسب النوع
            params = {
                "type": "system_alert",
                "limit": 10
            }
            
            async with self.session.get(
                f"{BACKEND_URL}/notifications/",
                params=params,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("data", {}).get("notifications", [])
                    print(f"✅ Filtered notifications by type - Count: {len(notifications)}")
                    
                    # اختبار فلترة حسب الأولوية
                    params = {
                        "priority": "high",
                        "limit": 10
                    }
                    
                    async with self.session.get(
                        f"{BACKEND_URL}/notifications/",
                        params=params,
                        headers=self.get_auth_headers()
                    ) as response2:
                        if response2.status == 200:
                            data2 = await response2.json()
                            high_priority = data2.get("data", {}).get("notifications", [])
                            print(f"✅ Filtered notifications by priority - Count: {len(high_priority)}")
                            return True
                        else:
                            print(f"❌ Priority filtering failed - Status: {response2.status}")
                            return False
                else:
                    error_text = await response.text()
                    print(f"❌ Type filtering failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Notification filtering error: {e}")
            return False
            
    async def test_mark_notification_as_read(self) -> bool:
        """اختبار تحديد إشعار كمقروء"""
        try:
            # أولاً، الحصول على إشعار للاختبار
            async with self.session.get(
                f"{BACKEND_URL}/notifications/",
                params={"limit": 1},
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("data", {}).get("notifications", [])
                    
                    if notifications:
                        notification_id = notifications[0].get("id")
                        
                        # تحديد الإشعار كمقروء
                        async with self.session.patch(
                            f"{BACKEND_URL}/notifications/{notification_id}/read",
                            headers=self.get_auth_headers()
                        ) as read_response:
                            if read_response.status == 200:
                                read_data = await read_response.json()
                                print(f"✅ Notification marked as read - Message: {read_data.get('message', 'N/A')}")
                                return True
                            else:
                                error_text = await read_response.text()
                                print(f"❌ Mark as read failed - Status: {read_response.status}, Error: {error_text}")
                                return False
                    else:
                        print("⚠️ No notifications found to mark as read")
                        return True  # لا يعتبر فشل إذا لم توجد إشعارات
                else:
                    print(f"❌ Failed to get notifications for read test - Status: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Mark as read error: {e}")
            return False
            
    async def test_mark_all_notifications_as_read(self) -> bool:
        """اختبار تحديد جميع الإشعارات كمقروءة"""
        try:
            async with self.session.patch(
                f"{BACKEND_URL}/notifications/read-all",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    updated_count = data.get("updated_count", 0)
                    print(f"✅ All notifications marked as read - Updated: {updated_count}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Mark all as read failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Mark all as read error: {e}")
            return False
            
    async def test_dismiss_notification(self) -> bool:
        """اختبار حذف إشعار"""
        try:
            # إنشاء إشعار للحذف
            notification_data = {
                "title": "إشعار للحذف",
                "message": "هذا الإشعار سيتم حذفه",
                "type": "system_alert",
                "priority": "low",
                "recipient_id": "admin-user-id"
            }
            
            async with self.session.post(
                f"{BACKEND_URL}/notifications/",
                json=notification_data,
                headers=self.get_auth_headers()
            ) as create_response:
                if create_response.status == 200:
                    create_data = await create_response.json()
                    notification_id = create_data.get("notification_id")
                    
                    # حذف الإشعار
                    async with self.session.delete(
                        f"{BACKEND_URL}/notifications/{notification_id}",
                        headers=self.get_auth_headers()
                    ) as delete_response:
                        if delete_response.status == 200:
                            delete_data = await delete_response.json()
                            print(f"✅ Notification dismissed - Message: {delete_data.get('message', 'N/A')}")
                            return True
                        else:
                            error_text = await delete_response.text()
                            print(f"❌ Notification dismiss failed - Status: {delete_response.status}, Error: {error_text}")
                            return False
                else:
                    print(f"❌ Failed to create notification for dismiss test - Status: {create_response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Dismiss notification error: {e}")
            return False
            
    async def test_notification_stats(self) -> bool:
        """اختبار إحصائيات الإشعارات"""
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications/stats",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    total = data.get("total_notifications", 0)
                    unread = data.get("unread_count", 0)
                    by_type = data.get("by_type", {})
                    print(f"✅ Notification stats retrieved - Total: {total}, Unread: {unread}, Types: {len(by_type)}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Notification stats failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Notification stats error: {e}")
            return False
            
    async def test_unread_count(self) -> bool:
        """اختبار عدد الإشعارات غير المقروءة"""
        try:
            async with self.session.get(
                f"{BACKEND_URL}/notifications/unread-count",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    unread_count = data.get("unread_count", 0)
                    print(f"✅ Unread count retrieved - Count: {unread_count}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Unread count failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Unread count error: {e}")
            return False
            
    async def test_automatic_order_notification(self) -> bool:
        """اختبار الإشعارات التلقائية للطلبات"""
        try:
            async with self.session.post(
                f"{BACKEND_URL}/notifications/test/order-notification",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Order notification test successful - Message: {data.get('message', 'N/A')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Order notification test failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Order notification test error: {e}")
            return False
            
    async def test_automatic_debt_notification(self) -> bool:
        """اختبار الإشعارات التلقائية للمديونية"""
        try:
            async with self.session.post(
                f"{BACKEND_URL}/notifications/test/debt-notification",
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Debt notification test successful - Message: {data.get('message', 'N/A')}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Debt notification test failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Debt notification test error: {e}")
            return False
            
    async def test_admin_all_notifications(self) -> bool:
        """اختبار عرض جميع الإشعارات للأدمن"""
        try:
            params = {
                "limit": 50,
                "offset": 0
            }
            
            async with self.session.get(
                f"{BACKEND_URL}/notifications/admin/all",
                params=params,
                headers=self.get_auth_headers()
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    notifications = data.get("data", {}).get("notifications", [])
                    total_count = data.get("data", {}).get("total_count", 0)
                    print(f"✅ Admin all notifications retrieved - Count: {len(notifications)}, Total: {total_count}")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Admin all notifications failed - Status: {response.status}, Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Admin all notifications error: {e}")
            return False
            
    async def test_permissions_and_security(self) -> bool:
        """اختبار الصلاحيات والأمان"""
        try:
            # اختبار الوصول بدون token
            async with self.session.get(f"{BACKEND_URL}/notifications/") as response:
                if response.status == 401:
                    print("✅ Unauthorized access properly blocked (401)")
                    
                    # اختبار الوصول بـ token غير صحيح
                    invalid_headers = {
                        "Authorization": "Bearer invalid-token-12345",
                        "Content-Type": "application/json"
                    }
                    
                    async with self.session.get(
                        f"{BACKEND_URL}/notifications/",
                        headers=invalid_headers
                    ) as invalid_response:
                        if invalid_response.status == 401:
                            print("✅ Invalid token properly rejected (401)")
                            return True
                        else:
                            print(f"❌ Invalid token not rejected - Status: {invalid_response.status}")
                            return False
                else:
                    print(f"❌ Unauthorized access not blocked - Status: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Permissions test error: {e}")
            return False
            
    async def test_database_operations(self) -> bool:
        """اختبار عمليات قاعدة البيانات"""
        try:
            # إنشاء إشعار واختبار حفظه
            notification_data = {
                "title": "اختبار قاعدة البيانات",
                "message": "اختبار حفظ واسترجاع البيانات",
                "type": "system_alert",
                "priority": "medium",
                "recipient_id": "admin-user-id",
                "metadata": {
                    "database_test": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
            
            # إنشاء الإشعار
            async with self.session.post(
                f"{BACKEND_URL}/notifications/",
                json=notification_data,
                headers=self.get_auth_headers()
            ) as create_response:
                if create_response.status == 200:
                    create_data = await create_response.json()
                    notification_id = create_data.get("notification_id")
                    
                    # التحقق من وجود الإشعار في قاعدة البيانات
                    async with self.session.get(
                        f"{BACKEND_URL}/notifications/",
                        params={"limit": 100},
                        headers=self.get_auth_headers()
                    ) as get_response:
                        if get_response.status == 200:
                            get_data = await get_response.json()
                            notifications = get_data.get("data", {}).get("notifications", [])
                            
                            # البحث عن الإشعار المُنشأ
                            found = any(n.get("id") == notification_id for n in notifications)
                            if found:
                                print("✅ Database operations working - Notification saved and retrieved")
                                return True
                            else:
                                print("❌ Database operations failed - Notification not found after creation")
                                return False
                        else:
                            print(f"❌ Database retrieval failed - Status: {get_response.status}")
                            return False
                else:
                    print(f"❌ Database creation failed - Status: {create_response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Database operations error: {e}")
            return False
            
    async def test_performance(self) -> bool:
        """اختبار الأداء"""
        try:
            # اختبار سرعة الاستجابة
            start_time = time.time()
            
            async with self.session.get(
                f"{BACKEND_URL}/notifications/",
                params={"limit": 20},
                headers=self.get_auth_headers()
            ) as response:
                end_time = time.time()
                response_time = (end_time - start_time) * 1000  # بالميلي ثانية
                
                if response.status == 200:
                    data = await response.json()
                    notifications_count = len(data.get("data", {}).get("notifications", []))
                    
                    print(f"✅ Performance test - Response time: {response_time:.2f}ms, Notifications: {notifications_count}")
                    
                    # اختبار الحمولة المتعددة
                    tasks = []
                    for i in range(5):
                        task = self.session.get(
                            f"{BACKEND_URL}/notifications/unread-count",
                            headers=self.get_auth_headers()
                        )
                        tasks.append(task)
                    
                    concurrent_start = time.time()
                    responses = await asyncio.gather(*tasks, return_exceptions=True)
                    concurrent_end = time.time()
                    concurrent_time = (concurrent_end - concurrent_start) * 1000
                    
                    successful_requests = sum(1 for r in responses if hasattr(r, 'status') and r.status == 200)
                    print(f"✅ Concurrent requests test - {successful_requests}/5 successful in {concurrent_time:.2f}ms")
                    
                    # إغلاق الاستجابات
                    for response in responses:
                        if hasattr(response, 'close'):
                            response.close()
                    
                    return response_time < 1000 and successful_requests >= 4  # أقل من ثانية و 80% نجاح
                else:
                    print(f"❌ Performance test failed - Status: {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Performance test error: {e}")
            return False
            
    async def run_comprehensive_test(self):
        """تشغيل الاختبار الشامل"""
        print("🔔 بدء اختبار نظام الإشعارات المتقدم - Advanced Notification System Testing")
        print("=" * 80)
        
        await self.setup_session()
        
        try:
            # تسجيل الدخول
            if not await self.admin_login():
                print("❌ فشل تسجيل الدخول - إيقاف الاختبار")
                return
            
            # قائمة الاختبارات
            tests = [
                ("تسجيل الدخول", True),  # تم بالفعل
                ("إنشاء إشعار واحد", await self.test_create_single_notification()),
                ("إنشاء إشعارات متعددة", await self.test_create_bulk_notifications()),
                ("جلب إشعاراتي", await self.test_get_my_notifications()),
                ("فلترة الإشعارات", await self.test_notification_filtering()),
                ("تحديد كمقروء", await self.test_mark_notification_as_read()),
                ("تحديد الكل كمقروء", await self.test_mark_all_notifications_as_read()),
                ("حذف إشعار", await self.test_dismiss_notification()),
                ("إحصائيات الإشعارات", await self.test_notification_stats()),
                ("عدد غير المقروء", await self.test_unread_count()),
                ("إشعار الطلبات التلقائي", await self.test_automatic_order_notification()),
                ("إشعار المديونية التلقائي", await self.test_automatic_debt_notification()),
                ("عرض جميع الإشعارات (أدمن)", await self.test_admin_all_notifications()),
                ("اختبار الصلاحيات", await self.test_permissions_and_security()),
                ("عمليات قاعدة البيانات", await self.test_database_operations()),
                ("اختبار الأداء", await self.test_performance())
            ]
            
            # حساب النتائج
            passed_tests = sum(1 for _, result in tests if result)
            total_tests = len(tests)
            success_rate = (passed_tests / total_tests) * 100
            
            print("\n" + "=" * 80)
            print("📊 نتائج اختبار نظام الإشعارات المتقدم")
            print("=" * 80)
            
            for test_name, result in tests:
                status = "✅ نجح" if result else "❌ فشل"
                print(f"{status} - {test_name}")
            
            print(f"\n🎯 معدل النجاح: {success_rate:.1f}% ({passed_tests}/{total_tests})")
            
            # تقييم شامل
            if success_rate >= 90:
                print("🎉 ممتاز! نظام الإشعارات يعمل بشكل مثالي")
            elif success_rate >= 75:
                print("✅ جيد! نظام الإشعارات يعمل بشكل جيد مع بعض المشاكل البسيطة")
            elif success_rate >= 50:
                print("⚠️ متوسط! نظام الإشعارات يحتاج تحسينات")
            else:
                print("❌ ضعيف! نظام الإشعارات يحتاج إصلاحات جوهرية")
            
            # تفاصيل الأداء
            total_time = time.time() - self.start_time
            print(f"⏱️ وقت الاختبار الإجمالي: {total_time:.2f} ثانية")
            
            # توصيات
            print("\n📋 التوصيات:")
            if success_rate < 100:
                failed_tests = [name for name, result in tests if not result]
                print("🔧 المناطق التي تحتاج إصلاح:")
                for test in failed_tests:
                    print(f"   - {test}")
            else:
                print("✨ النظام جاهز للإنتاج!")
                
        finally:
            await self.cleanup_session()

async def main():
    """الدالة الرئيسية"""
    tester = NotificationSystemTester()
    await tester.run_comprehensive_test()

if __name__ == "__main__":
    asyncio.run(main())