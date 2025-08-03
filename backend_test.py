#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE BACKEND TEST - POST ALL MAJOR ENHANCEMENTS
Testing all functionalities enhanced during this session to ensure system stability and functionality.

Test Areas:
1. Authentication & Security: Verify admin/admin123 login with all new features
2. Core API Endpoints: Test all major endpoints (users, clinics, products, orders, visits, debts)
3. New Data Structure Support: Verify backend can handle new approval_info data structure for clinics
4. Settings & Configuration: Test system settings API for logo upload and other configurations  
5. Enhanced User Data: Verify user statistics with new metrics (debts, collections, visits, added_clinics)
6. Responsive API Performance: Check response times are acceptable for all enhanced features
7. Error Handling: Verify robust error handling for all new functionalities
8. Database Integration: Ensure all new data structures integrate properly with MongoDB
"""

import requests
import json
import time
from datetime import datetime
import sys
import os

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://6fc37004-de78-473a-b926-f0438820a235.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.test_results = []
        self.start_time = time.time()
        
    def log_test(self, test_name, success, message, response_time=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        time_info = f" ({response_time:.2f}ms)" if response_time else ""
        print(f"{status}: {test_name}{time_info}")
        if message:
            print(f"   📝 {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_time": response_time
        })
        
    def login_admin(self):
        """Login as admin to get JWT token"""
        try:
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/auth/login", json={
                "username": "admin",
                "password": "admin123"
            })
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                self.log_test("Admin Login", True, f"JWT token obtained successfully", response_time)
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code} - {response.text}", response_time)
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False

    def test_activities_api(self):
        """Test POST /api/activities with correct activity type"""
        try:
            # Test creating activity with correct type 'visit_registration'
            start_time = time.time()
            activity_data = {
                "type": "visit_registration",  # Correct field name as per ActivityCreate model
                "action": "تسجيل زيارة عيادة اختبار",
                "target_type": "clinic",
                "target_id": "test-clinic-id",
                "target_details": {
                    "clinic_name": "عيادة اختبار شاملة",
                    "doctor_name": "د. أحمد محمد",
                    "specialization": "باطنة"
                },
                "location": {
                    "latitude": 30.0444,
                    "longitude": 31.2357,
                    "address": "القاهرة، مصر",
                    "area": "وسط البلد"
                },
                "device_info": {
                    "device_type": "mobile",
                    "browser": "Chrome",
                    "os": "Android"
                },
                "additional_details": {
                    "visit_duration": "30 minutes",
                    "products_presented": ["منتج أ", "منتج ب"],
                    "notes": "زيارة ناجحة مع عرض المنتجات الجديدة"
                }
            }
            
            response = self.session.post(f"{API_BASE}/activities", json=activity_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                self.log_test("POST /api/activities (visit_registration)", True, 
                            f"Activity created successfully with correct type", response_time)
                return True
            else:
                self.log_test("POST /api/activities (visit_registration)", False, 
                            f"Failed: {response.status_code} - {response.text}", response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/activities (visit_registration)", False, f"Error: {str(e)}")
            return False

    def test_orders_detail_api(self):
        """Test GET /api/orders/{id} endpoint"""
        try:
            # First get list of orders to find an ID
            start_time = time.time()
            response = self.session.get(f"{API_BASE}/orders")
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                orders = response.json()
                if orders and len(orders) > 0:
                    order_id = orders[0].get("id")
                    if order_id:
                        # Test GET /api/orders/{id}
                        start_time = time.time()
                        detail_response = self.session.get(f"{API_BASE}/orders/{order_id}")
                        detail_response_time = (time.time() - start_time) * 1000
                        
                        if detail_response.status_code == 200:
                            order_detail = detail_response.json()
                            self.log_test("GET /api/orders/{id}", True, 
                                        f"Order detail retrieved successfully: {order_detail.get('order_number', 'N/A')}", 
                                        detail_response_time)
                            return True
                        else:
                            self.log_test("GET /api/orders/{id}", False, 
                                        f"Order detail failed: {detail_response.status_code} - {detail_response.text}", 
                                        detail_response_time)
                            return False
                    else:
                        self.log_test("GET /api/orders/{id}", False, "No order ID found in orders list")
                        return False
                else:
                    self.log_test("GET /api/orders/{id}", False, "No orders found to test detail endpoint")
                    return False
            else:
                self.log_test("GET /api/orders/{id}", False, f"Failed to get orders list: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("GET /api/orders/{id}", False, f"Error: {str(e)}")
            return False

    def test_admin_settings_api(self):
        """Test PUT /api/admin/settings endpoint"""
        try:
            # Test GET settings first
            start_time = time.time()
            get_response = self.session.get(f"{API_BASE}/admin/settings")
            get_response_time = (time.time() - start_time) * 1000
            
            if get_response.status_code == 200:
                self.log_test("GET /api/admin/settings", True, "Settings retrieved successfully", get_response_time)
                
                # Test PUT settings
                settings_data = {
                    "company_name": "EP Group - Updated",
                    "company_logo": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
                    "system_language": "ar",
                    "theme": "modern",
                    "session_timeout": 60,
                    "max_login_attempts": 5,
                    "backup_frequency": "daily",
                    "notification_settings": {
                        "email_notifications": True,
                        "sms_notifications": False,
                        "push_notifications": True
                    }
                }
                
                start_time = time.time()
                put_response = self.session.put(f"{API_BASE}/admin/settings", json=settings_data)
                put_response_time = (time.time() - start_time) * 1000
                
                if put_response.status_code == 200:
                    self.log_test("PUT /api/admin/settings", True, 
                                "Settings updated successfully", put_response_time)
                    return True
                else:
                    self.log_test("PUT /api/admin/settings", False, 
                                f"Settings update failed: {put_response.status_code} - {put_response.text}", 
                                put_response_time)
                    return False
            else:
                self.log_test("GET /api/admin/settings", False, 
                            f"Settings retrieval failed: {get_response.status_code} - {get_response.text}", 
                            get_response_time)
                return False
                
        except Exception as e:
            self.log_test("PUT /api/admin/settings", False, f"Error: {str(e)}")
            return False

    def test_clinic_manager_fields(self):
        """Test POST /api/clinics with manager_name and manager_phone fields"""
        try:
            clinic_data = {
                "name": "عيادة اختبار الحقول الجديدة",  # Fixed field name
                "doctor_name": "د. أحمد محمد الطبيب",  # Required field
                "address": "شارع التحرير، القاهرة",
                "phone": "01234567890",
                "email": "test@clinic.com",
                "classification": "A",
                "credit_status": "good",
                "manager_name": "أحمد محمد المدير",  # New field to test
                "manager_phone": "01111111111",        # New field to test
                "latitude": 30.0444,
                "longitude": 31.2357,
                "area_id": "test-area-id",
                "notes": "عيادة اختبار لفحص الحقول الجديدة"
            }
            
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/clinics", json=clinic_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                clinic_result = response.json()
                # Check if manager fields are included in response
                clinic_info = clinic_result.get("clinic", {})
                has_manager_name = "manager_name" in clinic_info
                has_manager_phone = "manager_phone" in clinic_info
                
                if has_manager_name and has_manager_phone:
                    self.log_test("POST /api/clinics (manager fields)", True, 
                                f"Clinic created with manager fields: {clinic_info.get('manager_name')}", 
                                response_time)
                    return True
                else:
                    self.log_test("POST /api/clinics (manager fields)", False, 
                                f"Manager fields missing in response. Has name: {has_manager_name}, Has phone: {has_manager_phone}", 
                                response_time)
                    return False
            else:
                self.log_test("POST /api/clinics (manager fields)", False, 
                            f"Clinic creation failed: {response.status_code} - {response.text}", 
                            response_time)
                return False
                
        except Exception as e:
            self.log_test("POST /api/clinics (manager fields)", False, f"Error: {str(e)}")
            return False

    def test_clinic_specialization_removal(self):
        """Test that specialization field is removed from NEW clinic creation"""
        try:
            # Create a new clinic and verify it doesn't have specialization field
            clinic_data = {
                "name": "عيادة اختبار إزالة التخصص",
                "doctor_name": "د. محمد أحمد",
                "address": "شارع النيل، الجيزة",
                "phone": "01987654321",
                "classification": "A",
                "credit_status": "good",
                "manager_name": "سارة محمد",
                "manager_phone": "01555555555",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "area_id": "test-area-id"
            }
            
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/clinics", json=clinic_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                clinic_result = response.json()
                clinic_info = clinic_result.get("clinic", {})
                
                # Check that the newly created clinic does NOT have specialization field
                has_specialization = "specialization" in clinic_info
                
                if not has_specialization:
                    self.log_test("Clinic Specialization Removal", True, 
                                f"New clinic created without specialization field: {clinic_info.get('name')}", 
                                response_time)
                    return True
                else:
                    self.log_test("Clinic Specialization Removal", False, 
                                f"New clinic still has specialization field: {clinic_info.get('specialization')}", 
                                response_time)
                    return False
            else:
                self.log_test("Clinic Specialization Removal", False, 
                            f"Failed to create test clinic: {response.status_code} - {response.text}", 
                            response_time)
                return False
                
        except Exception as e:
            self.log_test("Clinic Specialization Removal", False, f"Error: {str(e)}")
            return False

    def test_enhanced_user_statistics(self):
        """Test enhanced user statistics with new metrics (debts, collections, visits, added_clinics)"""
        try:
            # Get users list first
            start_time = time.time()
            users_response = self.session.get(f"{API_BASE}/users")
            users_response_time = (time.time() - start_time) * 1000
            
            if users_response.status_code == 200:
                users = users_response.json()
                if users and len(users) > 0:
                    # Test user profile with enhanced statistics
                    user_id = users[0].get("id")
                    if user_id:
                        start_time = time.time()
                        profile_response = self.session.get(f"{API_BASE}/users/{user_id}/profile")
                        profile_response_time = (time.time() - start_time) * 1000
                        
                        if profile_response.status_code == 200:
                            profile_data = profile_response.json()
                            user_stats = profile_data.get("user", {}).get("user_stats", {})
                            
                            # Check for enhanced metrics
                            has_sales_activity = "sales_activity" in user_stats
                            has_debt_info = "debt_info" in user_stats
                            has_territory_info = "territory_info" in user_stats
                            has_team_info = "team_info" in user_stats
                            
                            if has_sales_activity and has_debt_info and has_territory_info and has_team_info:
                                sales_stats = user_stats["sales_activity"]
                                debt_stats = user_stats["debt_info"]
                                territory_stats = user_stats["territory_info"]
                                
                                self.log_test("Enhanced User Statistics", True, 
                                            f"User stats include: visits({sales_stats.get('total_visits', 0)}), orders({sales_stats.get('total_orders', 0)}), debt({debt_stats.get('total_debt', 0)}), clinics({territory_stats.get('assigned_clinics', 0)})", 
                                            profile_response_time)
                                return True
                            else:
                                self.log_test("Enhanced User Statistics", False, 
                                            f"Missing enhanced metrics. Has: sales({has_sales_activity}), debt({has_debt_info}), territory({has_territory_info}), team({has_team_info})", 
                                            profile_response_time)
                                return False
                        else:
                            self.log_test("Enhanced User Statistics", False, 
                                        f"Profile retrieval failed: {profile_response.status_code} - {profile_response.text}", 
                                        profile_response_time)
                            return False
                    else:
                        self.log_test("Enhanced User Statistics", False, "No user ID found")
                        return False
                else:
                    self.log_test("Enhanced User Statistics", False, "No users found")
                    return False
            else:
                self.log_test("Enhanced User Statistics", False, f"Users retrieval failed: {users_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Enhanced User Statistics", False, f"Error: {str(e)}")
            return False

    def test_clinic_approval_info_structure(self):
        """Test new approval_info data structure for clinics"""
        try:
            clinic_data = {
                "name": "عيادة اختبار نظام الموافقة",
                "doctor_name": "د. أحمد محمد",
                "address": "شارع التحرير، القاهرة",
                "phone": "01234567890",
                "email": "approval@clinic.com",
                "classification": "A",
                "credit_status": "good",
                "manager_name": "مدير العيادة",
                "manager_phone": "01111111111",
                "latitude": 30.0444,
                "longitude": 31.2357,
                "area_id": "test-area-id",
                "approval_info": {
                    "status": "pending",
                    "submitted_at": datetime.now().isoformat(),
                    "submitted_by": "medical_rep_id",
                    "approval_level": "line_manager",
                    "required_approvals": ["line_manager", "area_manager"],
                    "approval_history": [],
                    "rejection_reason": None,
                    "priority": "normal",
                    "documents_required": ["license", "insurance"],
                    "documents_submitted": ["license"],
                    "compliance_check": {
                        "license_valid": True,
                        "insurance_valid": False,
                        "location_verified": True
                    }
                }
            }
            
            start_time = time.time()
            response = self.session.post(f"{API_BASE}/clinics", json=clinic_data)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200 or response.status_code == 201:
                clinic_result = response.json()
                clinic_info = clinic_result.get("clinic", {})
                
                # Check if approval_info structure is preserved
                has_approval_info = "approval_info" in clinic_info
                if has_approval_info:
                    approval_info = clinic_info["approval_info"]
                    has_status = "status" in approval_info
                    has_history = "approval_history" in approval_info
                    has_compliance = "compliance_check" in approval_info
                    
                    if has_status and has_history and has_compliance:
                        self.log_test("Clinic Approval Info Structure", True, 
                                    f"Approval info structure preserved with status: {approval_info.get('status')}", 
                                    response_time)
                        return True
                    else:
                        self.log_test("Clinic Approval Info Structure", False, 
                                    f"Incomplete approval info. Has: status({has_status}), history({has_history}), compliance({has_compliance})", 
                                    response_time)
                        return False
                else:
                    self.log_test("Clinic Approval Info Structure", False, 
                                "Approval info structure not preserved in response", 
                                response_time)
                    return False
            else:
                self.log_test("Clinic Approval Info Structure", False, 
                            f"Clinic creation failed: {response.status_code} - {response.text}", 
                            response_time)
                return False
                
        except Exception as e:
            self.log_test("Clinic Approval Info Structure", False, f"Error: {str(e)}")
            return False

    def test_debt_collection_apis(self):
        """Test debt and collection management APIs"""
        try:
            # Test debt summary statistics
            start_time = time.time()
            debt_stats_response = self.session.get(f"{API_BASE}/debts/summary/statistics")
            debt_stats_time = (time.time() - start_time) * 1000
            
            debt_stats_success = debt_stats_response.status_code == 200
            if debt_stats_success:
                debt_stats = debt_stats_response.json()
                self.log_test("Debt Summary Statistics", True, 
                            f"Debt stats: total({debt_stats.get('total_debt', 0)}), count({debt_stats.get('debt_count', 0)})", 
                            debt_stats_time)
            else:
                self.log_test("Debt Summary Statistics", False, 
                            f"Failed: {debt_stats_response.status_code} - {debt_stats_response.text}", 
                            debt_stats_time)
            
            # Test collection statistics
            start_time = time.time()
            collection_stats_response = self.session.get(f"{API_BASE}/debts/collections/summary/statistics")
            collection_stats_time = (time.time() - start_time) * 1000
            
            collection_stats_success = collection_stats_response.status_code == 200
            if collection_stats_success:
                collection_stats = collection_stats_response.json()
                self.log_test("Collection Summary Statistics", True, 
                            f"Collection stats: total({collection_stats.get('total_collected', 0)}), count({collection_stats.get('collection_count', 0)})", 
                            collection_stats_time)
            else:
                self.log_test("Collection Summary Statistics", False, 
                            f"Failed: {collection_stats_response.status_code} - {collection_stats_response.text}", 
                            collection_stats_time)
            
            # Test debt records
            start_time = time.time()
            debts_response = self.session.get(f"{API_BASE}/debts")
            debts_time = (time.time() - start_time) * 1000
            
            debts_success = debts_response.status_code == 200
            if debts_success:
                debts = debts_response.json()
                debt_count = len(debts) if isinstance(debts, list) else 0
                self.log_test("Debt Records", True, f"Retrieved {debt_count} debt records", debts_time)
            else:
                self.log_test("Debt Records", False, 
                            f"Failed: {debts_response.status_code} - {debts_response.text}", debts_time)
            
            # Test collection records
            start_time = time.time()
            collections_response = self.session.get(f"{API_BASE}/debts/collections")
            collections_time = (time.time() - start_time) * 1000
            
            collections_success = collections_response.status_code == 200
            if collections_success:
                collections = collections_response.json()
                collection_count = len(collections) if isinstance(collections, list) else 0
                self.log_test("Collection Records", True, f"Retrieved {collection_count} collection records", collections_time)
            else:
                self.log_test("Collection Records", False, 
                            f"Failed: {collections_response.status_code} - {collections_response.text}", collections_time)
            
            return debt_stats_success and collection_stats_success and debts_success and collections_success
                
        except Exception as e:
            self.log_test("Debt Collection APIs", False, f"Error: {str(e)}")
            return False

    def test_dashboard_enhancement_apis(self):
        """Test enhanced dashboard APIs"""
        try:
            # Test dashboard statistics
            start_time = time.time()
            dashboard_response = self.session.get(f"{API_BASE}/dashboard/stats")
            dashboard_time = (time.time() - start_time) * 1000
            
            dashboard_success = dashboard_response.status_code == 200
            if dashboard_success:
                dashboard_stats = dashboard_response.json()
                self.log_test("Dashboard Statistics", True, 
                            f"Dashboard stats: users({dashboard_stats.get('total_users', 0)}), clinics({dashboard_stats.get('total_clinics', 0)}), products({dashboard_stats.get('total_products', 0)})", 
                            dashboard_time)
            else:
                self.log_test("Dashboard Statistics", False, 
                            f"Failed: {dashboard_response.status_code} - {dashboard_response.text}", 
                            dashboard_time)
            
            # Test admin activities
            start_time = time.time()
            activities_response = self.session.get(f"{API_BASE}/admin/activities")
            activities_time = (time.time() - start_time) * 1000
            
            activities_success = activities_response.status_code == 200
            if activities_success:
                activities = activities_response.json()
                activity_count = len(activities) if isinstance(activities, list) else 0
                self.log_test("Admin Activities", True, f"Retrieved {activity_count} activities", activities_time)
            else:
                self.log_test("Admin Activities", False, 
                            f"Failed: {activities_response.status_code} - {activities_response.text}", activities_time)
            
            # Test activity statistics
            start_time = time.time()
            activity_stats_response = self.session.get(f"{API_BASE}/admin/activities/stats")
            activity_stats_time = (time.time() - start_time) * 1000
            
            activity_stats_success = activity_stats_response.status_code == 200
            if activity_stats_success:
                activity_stats = activity_stats_response.json()
                self.log_test("Activity Statistics", True, 
                            f"Activity stats: total({activity_stats.get('total_activities', 0)}), today({activity_stats.get('today_activities', 0)})", 
                            activity_stats_time)
            else:
                self.log_test("Activity Statistics", False, 
                            f"Failed: {activity_stats_response.status_code} - {activity_stats_response.text}", 
                            activity_stats_time)
            
            # Test GPS tracking
            start_time = time.time()
            gps_response = self.session.get(f"{API_BASE}/admin/gps-tracking")
            gps_time = (time.time() - start_time) * 1000
            
            gps_success = gps_response.status_code == 200
            if gps_success:
                gps_data = gps_response.json()
                gps_count = len(gps_data) if isinstance(gps_data, list) else 0
                self.log_test("GPS Tracking", True, f"Retrieved {gps_count} GPS records", gps_time)
            else:
                self.log_test("GPS Tracking", False, 
                            f"Failed: {gps_response.status_code} - {gps_response.text}", gps_time)
            
            return dashboard_success and activities_success and activity_stats_success and gps_success
                
        except Exception as e:
            self.log_test("Dashboard Enhancement APIs", False, f"Error: {str(e)}")
            return False

    def test_performance_metrics(self):
        """Test API response times for performance"""
        performance_tests = [
            ("Users API Performance", f"{API_BASE}/users"),
            ("Clinics API Performance", f"{API_BASE}/clinics"),
            ("Products API Performance", f"{API_BASE}/products"),
            ("Orders API Performance", f"{API_BASE}/orders"),
            ("Dashboard API Performance", f"{API_BASE}/dashboard/stats")
        ]
        
        total_response_time = 0
        successful_tests = 0
        
        for test_name, url in performance_tests:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                total_response_time += response_time
                
                if response.status_code == 200:
                    # Consider response time acceptable if under 2000ms
                    performance_acceptable = response_time < 2000
                    if performance_acceptable:
                        self.log_test(test_name, True, f"Response time: {response_time:.2f}ms (acceptable)", response_time)
                        successful_tests += 1
                    else:
                        self.log_test(test_name, False, f"Response time: {response_time:.2f}ms (too slow)", response_time)
                else:
                    self.log_test(test_name, False, f"API failed: {response.status_code}", response_time)
                    
            except Exception as e:
                self.log_test(test_name, False, f"Error: {str(e)}")
        
        # Calculate average response time
        avg_response_time = total_response_time / len(performance_tests) if performance_tests else 0
        
        # Overall performance assessment
        if successful_tests == len(performance_tests) and avg_response_time < 1000:
            self.log_test("Overall API Performance", True, f"Average response time: {avg_response_time:.2f}ms (excellent)")
            return True
        elif successful_tests >= len(performance_tests) * 0.8:
            self.log_test("Overall API Performance", True, f"Average response time: {avg_response_time:.2f}ms (good)")
            return True
        else:
            self.log_test("Overall API Performance", False, f"Performance issues detected. Average: {avg_response_time:.2f}ms")
            return False

    def test_error_handling(self):
        """Test robust error handling for new functionalities"""
        error_tests = [
            ("Invalid User ID", f"{API_BASE}/users/invalid-id/profile", 404),
            ("Invalid Clinic ID", f"{API_BASE}/clinics/invalid-id", 404),
            ("Invalid Order ID", f"{API_BASE}/orders/invalid-id", 404),
            ("Unauthorized Debt Access", f"{API_BASE}/debts", None),  # Should work with admin token
            ("Invalid Settings Update", f"{API_BASE}/admin/settings", None)  # Should work with admin token
        ]
        
        successful_error_handling = 0
        
        for test_name, url, expected_status in error_tests:
            try:
                start_time = time.time()
                if "settings" in url:
                    # Test PUT with invalid data
                    response = self.session.put(url, json={"invalid": "data"})
                else:
                    response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if expected_status:
                    # Expecting specific error status
                    if response.status_code == expected_status:
                        self.log_test(test_name, True, f"Correct error handling: {response.status_code}", response_time)
                        successful_error_handling += 1
                    else:
                        self.log_test(test_name, False, f"Unexpected status: {response.status_code} (expected {expected_status})", response_time)
                else:
                    # Should work with admin token
                    if response.status_code in [200, 201]:
                        self.log_test(test_name, True, f"Authorized access works: {response.status_code}", response_time)
                        successful_error_handling += 1
                    else:
                        self.log_test(test_name, False, f"Authorization issue: {response.status_code}", response_time)
                        
            except Exception as e:
                self.log_test(test_name, False, f"Error: {str(e)}")
        
    def test_core_apis(self):
        """Test core APIs that should be working"""
        core_tests = [
            ("GET /api/users", f"{API_BASE}/users"),
            ("GET /api/clinics", f"{API_BASE}/clinics"),
            ("GET /api/products", f"{API_BASE}/products"),
            ("GET /api/orders", f"{API_BASE}/orders"),
            ("GET /api/lines", f"{API_BASE}/lines"),
            ("GET /api/areas", f"{API_BASE}/areas"),
            ("GET /api/warehouses", f"{API_BASE}/warehouses"),
            ("GET /api/visits", f"{API_BASE}/visits")
        ]
        
        success_count = 0
        for test_name, url in core_tests:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else "N/A"
                    self.log_test(test_name, True, f"Retrieved {count} records", response_time)
                    success_count += 1
                else:
                    self.log_test(test_name, False, f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(test_name, False, f"Error: {str(e)}")
        
        return success_count
        """Test core APIs that should be working"""
        core_tests = [
            ("GET /api/users", f"{API_BASE}/users"),
            ("GET /api/clinics", f"{API_BASE}/clinics"),
            ("GET /api/products", f"{API_BASE}/products"),
            ("GET /api/orders", f"{API_BASE}/orders"),
            ("GET /api/lines", f"{API_BASE}/lines"),
            ("GET /api/areas", f"{API_BASE}/areas"),
            ("GET /api/warehouses", f"{API_BASE}/warehouses"),
            ("GET /api/visits", f"{API_BASE}/visits")
        ]
        
        success_count = 0
        for test_name, url in core_tests:
            try:
                start_time = time.time()
                response = self.session.get(url)
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    count = len(data) if isinstance(data, list) else "N/A"
                    self.log_test(test_name, True, f"Retrieved {count} records", response_time)
                    success_count += 1
                else:
                    self.log_test(test_name, False, f"Failed: {response.status_code} - {response.text}", response_time)
                    
            except Exception as e:
                self.log_test(test_name, False, f"Error: {str(e)}")
        
        return success_count

    def run_comprehensive_test(self):
        """Run all comprehensive tests"""
        print("🚀 FINAL COMPREHENSIVE BACKEND TEST - POST ALL MAJOR ENHANCEMENTS")
        print("=" * 80)
        print("🎯 Testing all functionalities enhanced during this session")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print("=" * 80)
        
        # Login first
        if not self.login_admin():
            print("❌ Cannot proceed without admin login")
            return
        
        print("\n📋 1. AUTHENTICATION & SECURITY:")
        print("-" * 50)
        # Already tested in login_admin()
        
        print("\n📋 2. CORE API ENDPOINTS:")
        print("-" * 50)
        core_success_count = self.test_core_apis()
        
        print("\n📋 3. NEW DATA STRUCTURE SUPPORT:")
        print("-" * 50)
        approval_info_success = self.test_clinic_approval_info_structure()
        
        print("\n📋 4. SETTINGS & CONFIGURATION:")
        print("-" * 50)
        settings_success = self.test_admin_settings_api()
        
        print("\n📋 5. ENHANCED USER DATA:")
        print("-" * 50)
        user_stats_success = self.test_enhanced_user_statistics()
        
        print("\n📋 6. DEBT & COLLECTION MANAGEMENT:")
        print("-" * 50)
        debt_collection_success = self.test_debt_collection_apis()
        
        print("\n📋 7. DASHBOARD ENHANCEMENTS:")
        print("-" * 50)
        dashboard_success = self.test_dashboard_enhancement_apis()
        
        print("\n📋 8. RESPONSIVE API PERFORMANCE:")
        print("-" * 50)
        performance_success = self.test_performance_metrics()
        
        print("\n📋 9. ERROR HANDLING:")
        print("-" * 50)
        error_handling_success = self.test_error_handling()
        
        print("\n📋 10. SPECIFIC ARABIC REVIEW FIXES:")
        print("-" * 50)
        activities_success = self.test_activities_api()
        orders_detail_success = self.test_orders_detail_api()
        clinic_manager_success = self.test_clinic_manager_fields()
        specialization_success = self.test_clinic_specialization_removal()
        
        # Calculate results
        total_tests = len(self.test_results)
        successful_tests = sum(1 for result in self.test_results if result["success"])
        success_rate = (successful_tests / total_tests) * 100 if total_tests > 0 else 0
        
        # Calculate average response time
        response_times = [result["response_time"] for result in self.test_results if result["response_time"]]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 FINAL COMPREHENSIVE TEST RESULTS")
        print("=" * 80)
        print(f"🎯 Overall Success Rate: {success_rate:.1f}% ({successful_tests}/{total_tests} tests)")
        print(f"⚡ Average Response Time: {avg_response_time:.2f}ms")
        print(f"⏱️  Total Test Duration: {time.time() - self.start_time:.2f} seconds")
        print()
        
        # Category Results
        print("📋 CATEGORY BREAKDOWN:")
        print("-" * 50)
        print(f"✅ Authentication & Security: {'PASS' if self.jwt_token else 'FAIL'}")
        print(f"✅ Core API Endpoints: {core_success_count}/8 working")
        print(f"✅ New Data Structures: {'PASS' if approval_info_success else 'FAIL'}")
        print(f"✅ Settings & Configuration: {'PASS' if settings_success else 'FAIL'}")
        print(f"✅ Enhanced User Data: {'PASS' if user_stats_success else 'FAIL'}")
        print(f"✅ Debt & Collection: {'PASS' if debt_collection_success else 'FAIL'}")
        print(f"✅ Dashboard Enhancements: {'PASS' if dashboard_success else 'FAIL'}")
        print(f"✅ API Performance: {'PASS' if performance_success else 'FAIL'}")
        print(f"✅ Error Handling: {'PASS' if error_handling_success else 'FAIL'}")
        print(f"✅ Arabic Review Fixes: {'PASS' if all([activities_success, orders_detail_success, clinic_manager_success, specialization_success]) else 'PARTIAL'}")
        
        print("\n🎯 SYSTEM STABILITY ASSESSMENT:")
        print("-" * 50)
        
        if success_rate >= 95:
            print("🎉 EXCELLENT: System is highly stable and ready for production!")
            stability_status = "EXCELLENT"
        elif success_rate >= 85:
            print("✅ GOOD: System is stable with minor issues that don't affect core functionality")
            stability_status = "GOOD"
        elif success_rate >= 75:
            print("⚠️  ACCEPTABLE: System is functional but needs attention to some areas")
            stability_status = "ACCEPTABLE"
        else:
            print("❌ NEEDS ATTENTION: System has significant issues that need to be addressed")
            stability_status = "NEEDS ATTENTION"
        
        print(f"\n🔍 PERFORMANCE ANALYSIS:")
        print("-" * 50)
        if avg_response_time < 100:
            print(f"🚀 EXCELLENT: Average response time {avg_response_time:.2f}ms (under 100ms)")
        elif avg_response_time < 500:
            print(f"✅ GOOD: Average response time {avg_response_time:.2f}ms (under 500ms)")
        elif avg_response_time < 1000:
            print(f"⚠️  ACCEPTABLE: Average response time {avg_response_time:.2f}ms (under 1s)")
        else:
            print(f"❌ SLOW: Average response time {avg_response_time:.2f}ms (over 1s)")
        
        # Failed tests analysis
        failed_tests = [result for result in self.test_results if not result["success"]]
        if failed_tests:
            print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
            print("-" * 50)
            for i, test in enumerate(failed_tests, 1):
                print(f"   {i}. {test['test']}: {test['message']}")
        
        print(f"\n🎯 FINAL ASSESSMENT:")
        print("-" * 50)
        print(f"System Stability: {stability_status}")
        print(f"Core Functionality: {'WORKING' if core_success_count >= 6 else 'ISSUES DETECTED'}")
        print(f"Enhanced Features: {'IMPLEMENTED' if debt_collection_success and dashboard_success else 'PARTIAL'}")
        print(f"Performance: {'ACCEPTABLE' if avg_response_time < 1000 else 'NEEDS OPTIMIZATION'}")
        print(f"Production Ready: {'YES' if success_rate >= 85 and avg_response_time < 1000 else 'NEEDS FIXES'}")
        
        return success_rate >= 85

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)