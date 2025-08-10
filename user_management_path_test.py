#!/usr/bin/env python3
"""
اختبار مسار المستخدمين للتأكد من أنه يعمل بشكل صحيح
Testing user management path to ensure it works correctly
"""

import requests
import json
import time
from datetime import datetime

# استخدام URL الخارجي من متغيرات البيئة
BACKEND_URL = "https://cba90dd5-7cf4-442d-a7f2-53754dd99b9e.preview.emergentagent.com/api"

def test_user_management_path():
    """اختبار شامل لمسار إدارة المستخدمين"""
    print("🚀 بدء اختبار مسار إدارة المستخدمين...")
    print("=" * 60)
    
    results = []
    start_time = time.time()
    
    try:
        # 1) تسجيل دخول admin/admin123 للحصول على JWT token
        print("1️⃣ اختبار تسجيل دخول admin/admin123...")
        login_start = time.time()
        
        login_response = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=10
        )
        
        login_time = (time.time() - login_start) * 1000
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            jwt_token = login_data.get("access_token")
            user_info = login_data.get("user", {})
            
            print(f"   ✅ تسجيل دخول ناجح ({login_time:.2f}ms)")
            print(f"   👤 المستخدم: {user_info.get('full_name', 'غير محدد')}")
            print(f"   🔑 الدور: {user_info.get('role', 'غير محدد')}")
            print(f"   🎫 JWT Token: {jwt_token[:50]}...")
            
            results.append({
                "test": "Admin Login",
                "status": "✅ نجح",
                "time_ms": login_time,
                "details": f"User: {user_info.get('full_name')}, Role: {user_info.get('role')}"
            })
            
            headers = {"Authorization": f"Bearer {jwt_token}"}
            
        else:
            print(f"   ❌ فشل تسجيل الدخول: {login_response.status_code}")
            print(f"   📝 الاستجابة: {login_response.text}")
            results.append({
                "test": "Admin Login",
                "status": "❌ فشل",
                "time_ms": login_time,
                "details": f"HTTP {login_response.status_code}: {login_response.text}"
            })
            return results
            
    except Exception as e:
        print(f"   ❌ خطأ في تسجيل الدخول: {str(e)}")
        results.append({
            "test": "Admin Login",
            "status": "❌ خطأ",
            "time_ms": 0,
            "details": str(e)
        })
        return results
    
    # 2) اختبار GET /api/users - الحصول على قائمة المستخدمين
    print("\n2️⃣ اختبار GET /api/users - جلب قائمة المستخدمين...")
    try:
        users_start = time.time()
        
        users_response = requests.get(
            f"{BACKEND_URL}/users",
            headers=headers,
            timeout=10
        )
        
        users_time = (time.time() - users_start) * 1000
        
        if users_response.status_code == 200:
            users_data = users_response.json()
            
            # التحقق من نوع البيانات المُرجعة
            if isinstance(users_data, list):
                users_list = users_data
                total_users = len(users_list)
            elif isinstance(users_data, dict):
                users_list = users_data.get("users", users_data.get("data", []))
                total_users = len(users_list) if isinstance(users_list, list) else 0
            else:
                users_list = []
                total_users = 0
            
            print(f"   ✅ جلب المستخدمين ناجح ({users_time:.2f}ms)")
            print(f"   👥 إجمالي المستخدمين: {total_users}")
            
            # عرض تفاصيل المستخدمين
            if users_list and len(users_list) > 0:
                print("   📋 قائمة المستخدمين:")
                for i, user in enumerate(users_list[:5]):  # عرض أول 5 مستخدمين
                    username = user.get("username", "غير محدد")
                    full_name = user.get("full_name", "غير محدد")
                    role = user.get("role", "غير محدد")
                    is_active = user.get("is_active", True)
                    status_icon = "🟢" if is_active else "🔴"
                    print(f"      {i+1}. {status_icon} {username} - {full_name} ({role})")
                
                if len(users_list) > 5:
                    print(f"      ... و {len(users_list) - 5} مستخدم آخر")
            
            results.append({
                "test": "GET /api/users",
                "status": "✅ نجح",
                "time_ms": users_time,
                "details": f"إجمالي المستخدمين: {total_users}"
            })
            
        else:
            print(f"   ❌ فشل جلب المستخدمين: HTTP {users_response.status_code}")
            print(f"   📝 الاستجابة: {users_response.text}")
            
            results.append({
                "test": "GET /api/users",
                "status": "❌ فشل",
                "time_ms": users_time,
                "details": f"HTTP {users_response.status_code}: {users_response.text}"
            })
            
            # إذا كان الخطأ 404، قد يكون endpoint غير موجود
            if users_response.status_code == 404:
                print("   ⚠️ تحذير: endpoint /api/users غير موجود - قد يحتاج تطبيق")
                
    except Exception as e:
        print(f"   ❌ خطأ في جلب المستخدمين: {str(e)}")
        results.append({
            "test": "GET /api/users",
            "status": "❌ خطأ",
            "time_ms": 0,
            "details": str(e)
        })
    
    # 3) اختبار إنشاء مستخدم تجريبي إذا لم توجد مستخدمين
    print("\n3️⃣ اختبار POST /api/users - إنشاء مستخدم تجريبي...")
    try:
        create_user_start = time.time()
        
        # بيانات مستخدم تجريبي حقيقية
        test_user_data = {
            "username": f"test_user_{int(time.time())}",
            "password": "test123456",
            "full_name": "مستخدم تجريبي للاختبار",
            "email": f"test_{int(time.time())}@example.com",
            "phone": "01234567890",
            "role": "medical_rep",
            "is_active": True,
            "area_id": "test_area",
            "line_id": "test_line"
        }
        
        create_response = requests.post(
            f"{BACKEND_URL}/users",
            headers=headers,
            json=test_user_data,
            timeout=10
        )
        
        create_time = (time.time() - create_user_start) * 1000
        
        if create_response.status_code in [200, 201]:
            create_data = create_response.json()
            print(f"   ✅ إنشاء مستخدم ناجح ({create_time:.2f}ms)")
            print(f"   🆔 معرف المستخدم: {create_data.get('user_id', 'غير محدد')}")
            
            results.append({
                "test": "POST /api/users",
                "status": "✅ نجح",
                "time_ms": create_time,
                "details": f"تم إنشاء مستخدم: {test_user_data['username']}"
            })
            
        else:
            print(f"   ❌ فشل إنشاء المستخدم: HTTP {create_response.status_code}")
            print(f"   📝 الاستجابة: {create_response.text}")
            
            results.append({
                "test": "POST /api/users",
                "status": "❌ فشل",
                "time_ms": create_time,
                "details": f"HTTP {create_response.status_code}: {create_response.text}"
            })
            
    except Exception as e:
        print(f"   ❌ خطأ في إنشاء المستخدم: {str(e)}")
        results.append({
            "test": "POST /api/users",
            "status": "❌ خطأ",
            "time_ms": 0,
            "details": str(e)
        })
    
    # 4) اختبار الصلاحيات - التأكد من أن admin يمكنه الوصول
    print("\n4️⃣ اختبار الصلاحيات - فحص وصول الأدمن...")
    try:
        permissions_start = time.time()
        
        # اختبار الوصول لإحصائيات النظام
        stats_response = requests.get(
            f"{BACKEND_URL}/dashboard/stats/admin",
            headers=headers,
            timeout=10
        )
        
        permissions_time = (time.time() - permissions_start) * 1000
        
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            total_users = stats_data.get("total_users", 0)
            total_clinics = stats_data.get("total_clinics", 0)
            
            print(f"   ✅ وصول الأدمن للإحصائيات ناجح ({permissions_time:.2f}ms)")
            print(f"   📊 إحصائيات النظام:")
            print(f"      👥 المستخدمين: {total_users}")
            print(f"      🏥 العيادات: {total_clinics}")
            print(f"      🎯 نوع الداشبورد: {stats_data.get('dashboard_type', 'غير محدد')}")
            
            results.append({
                "test": "Admin Permissions Check",
                "status": "✅ نجح",
                "time_ms": permissions_time,
                "details": f"المستخدمين: {total_users}, العيادات: {total_clinics}"
            })
            
        else:
            print(f"   ❌ فشل فحص الصلاحيات: HTTP {stats_response.status_code}")
            print(f"   📝 الاستجابة: {stats_response.text}")
            
            results.append({
                "test": "Admin Permissions Check",
                "status": "❌ فشل",
                "time_ms": permissions_time,
                "details": f"HTTP {stats_response.status_code}: {stats_response.text}"
            })
            
    except Exception as e:
        print(f"   ❌ خطأ في فحص الصلاحيات: {str(e)}")
        results.append({
            "test": "Admin Permissions Check",
            "status": "❌ خطأ",
            "time_ms": 0,
            "details": str(e)
        })
    
    # 5) فحص endpoints إدارة المستخدمين المتاحة
    print("\n5️⃣ فحص endpoints إدارة المستخدمين المتاحة...")
    try:
        # اختبار endpoints مختلفة للعثور على user management
        user_endpoints_to_test = [
            "/auth/me",
            "/dashboard/widgets/admin",
            "/health"
        ]
        
        available_endpoints = []
        
        for endpoint in user_endpoints_to_test:
            try:
                test_start = time.time()
                response = requests.get(
                    f"{BACKEND_URL}{endpoint}",
                    headers=headers,
                    timeout=5
                )
                test_time = (time.time() - test_start) * 1000
                
                if response.status_code == 200:
                    available_endpoints.append(f"{endpoint} ✅ ({test_time:.1f}ms)")
                    
                    # إذا كان /auth/me، عرض معلومات المستخدم
                    if endpoint == "/auth/me":
                        me_data = response.json()
                        user_data = me_data.get("user", {})
                        print(f"      👤 معلومات المستخدم الحالي:")
                        print(f"         🆔 المعرف: {user_data.get('id', 'غير محدد')}")
                        print(f"         👤 الاسم: {user_data.get('full_name', 'غير محدد')}")
                        print(f"         🔑 الدور: {user_data.get('role', 'غير محدد')}")
                        print(f"         📧 البريد: {user_data.get('email', 'غير محدد')}")
                else:
                    available_endpoints.append(f"{endpoint} ❌ HTTP {response.status_code}")
                    
            except Exception as e:
                available_endpoints.append(f"{endpoint} ❌ {str(e)[:30]}")
        
        print("   📡 Endpoints المتاحة:")
        for endpoint in available_endpoints:
            print(f"      {endpoint}")
            
        results.append({
            "test": "User Management Endpoints Check",
            "status": "✅ مكتمل",
            "time_ms": 0,
            "details": f"تم فحص {len(user_endpoints_to_test)} endpoints"
        })
        
    except Exception as e:
        print(f"   ❌ خطأ في فحص endpoints: {str(e)}")
        results.append({
            "test": "User Management Endpoints Check",
            "status": "❌ خطأ",
            "time_ms": 0,
            "details": str(e)
        })
    
    # النتائج النهائية
    total_time = time.time() - start_time
    successful_tests = len([r for r in results if "✅" in r["status"]])
    total_tests = len(results)
    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    avg_response_time = sum([r["time_ms"] for r in results if r["time_ms"] > 0]) / len([r for r in results if r["time_ms"] > 0]) if any(r["time_ms"] > 0 for r in results) else 0
    
    print("\n" + "=" * 60)
    print("📊 النتائج النهائية:")
    print(f"   🎯 معدل النجاح: {success_rate:.1f}% ({successful_tests}/{total_tests})")
    print(f"   ⏱️ متوسط وقت الاستجابة: {avg_response_time:.2f}ms")
    print(f"   🕐 إجمالي وقت التنفيذ: {total_time:.2f}s")
    
    print("\n📋 تفاصيل النتائج:")
    for result in results:
        print(f"   {result['status']} {result['test']} ({result['time_ms']:.1f}ms)")
        if result['details']:
            print(f"      📝 {result['details']}")
    
    # تحليل النتائج وتوصيات
    print("\n🔍 التحليل والتوصيات:")
    
    if any("404" in str(r) and "/api/users" in str(r) for r in results):
        print("   ⚠️ endpoint /api/users غير موجود - يحتاج تطبيق في الباكند")
        print("   💡 التوصية: إضافة user management endpoints في server.py")
        print("   🔧 المطلوب: GET /api/users, POST /api/users, PUT /api/users/{id}, DELETE /api/users/{id}")
    elif successful_tests == total_tests:
        print("   🎉 جميع اختبارات إدارة المستخدمين نجحت!")
        print("   ✅ النظام جاهز للاستخدام مع إدارة المستخدمين")
    else:
        print("   ⚠️ بعض اختبارات إدارة المستخدمين فشلت")
        print("   💡 التوصية: فحص وإصلاح المشاكل المحددة أعلاه")
    
    if success_rate >= 80:
        print("   🏆 النظام يعمل بشكل جيد جداً!")
    elif success_rate >= 60:
        print("   👍 النظام يعمل بشكل مقبول مع تحسينات مطلوبة")
    else:
        print("   ⚠️ النظام يحتاج إصلاحات جوهرية")
    
    return results

if __name__ == "__main__":
    print("🔬 اختبار مسار المستخدمين - User Management Path Testing")
    print("🎯 الهدف: التأكد من أن API endpoint /users يعمل ويرجع بيانات المستخدمين بشكل صحيح للواجهة الأمامية")
    print("📅 التاريخ والوقت:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print()
    
    results = test_user_management_path()
    
    print("\n🏁 انتهى الاختبار!")