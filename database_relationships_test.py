#!/usr/bin/env python3
"""
🔍 **فحص قواعد البيانات والترابط المنطقي - Critical Database Relationship Analysis**

This comprehensive test analyzes database relationships and logical consistency
as requested in the Arabic review.

Test Areas:
1. Database Relationships Verification
2. Logical Numbers Analysis  
3. Cross-Reference Testing
4. Count Matching Verification
5. Statistics Consistency Check
"""

import requests
import json
import time
from datetime import datetime
import sys

# Configuration
BACKEND_URL = "https://3cda3dc5-f9f2-4f37-9cc1-77fdfe8786ca.preview.emergentagent.com/api"
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class DatabaseRelationshipTester:
    def __init__(self):
        self.token = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.start_time = time.time()
        
        # Data storage for relationship analysis
        self.users_data = []
        self.clinics_data = []
        self.orders_data = []
        self.visits_data = []
        self.lines_data = []
        self.areas_data = []
        self.products_data = []
        self.warehouses_data = []
        self.doctors_data = []
        
    def log_test(self, test_name, success, details="", response_time=0):
        """Log test results"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            self.failed_tests += 1
            status = "❌ FAIL"
            
        result = {
            "test": test_name,
            "status": status,
            "details": details,
            "response_time": f"{response_time:.2f}ms"
        }
        self.test_results.append(result)
        print(f"{status} | {test_name} | {details} | {response_time:.2f}ms")
        
    def authenticate(self):
        """Authenticate and get JWT token"""
        try:
            start_time = time.time()
            response = requests.post(f"{BACKEND_URL}/auth/login", json=ADMIN_CREDENTIALS)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                user_info = data.get("user", {})
                self.log_test(
                    "Authentication", 
                    True, 
                    f"Admin login successful - User: {user_info.get('full_name', 'admin')}, Role: {user_info.get('role', 'admin')}", 
                    response_time
                )
                return True
            else:
                self.log_test("Authentication", False, f"Login failed: {response.status_code}", response_time)
                return False
        except Exception as e:
            self.log_test("Authentication", False, f"Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def fetch_all_data(self):
        """Fetch all data for relationship analysis"""
        print("\n🔍 **PHASE 1: DATA COLLECTION FOR RELATIONSHIP ANALYSIS**")
        
        endpoints = [
            ("users", "Users"),
            ("clinics", "Clinics"), 
            ("orders", "Orders"),
            ("visits", "Visits"),
            ("lines", "Lines"),
            ("areas", "Areas"),
            ("products", "Products"),
            ("warehouses", "Warehouses"),
            ("doctors", "Doctors")
        ]
        
        for endpoint, name in endpoints:
            try:
                start_time = time.time()
                response = requests.get(f"{BACKEND_URL}/{endpoint}", headers=self.get_headers())
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    data = response.json()
                    setattr(self, f"{endpoint}_data", data)
                    count = len(data) if isinstance(data, list) else 1
                    self.log_test(
                        f"Fetch {name}",
                        True,
                        f"Retrieved {count} {name.lower()} records",
                        response_time
                    )
                else:
                    self.log_test(f"Fetch {name}", False, f"HTTP {response.status_code}", response_time)
                    setattr(self, f"{endpoint}_data", [])
            except Exception as e:
                self.log_test(f"Fetch {name}", False, f"Error: {str(e)}")
                setattr(self, f"{endpoint}_data", [])
    
    def analyze_user_clinic_relationships(self):
        """1. التحقق من ترابط Users مع Clinics"""
        print("\n🔍 **PHASE 2: USER-CLINIC RELATIONSHIP ANALYSIS**")
        
        try:
            # Count medical reps
            medical_reps = [u for u in self.users_data if u.get('role') in ['medical_rep', 'key_account']]
            medical_rep_count = len(medical_reps)
            
            # Count clinics assigned to reps
            assigned_clinics = [c for c in self.clinics_data if c.get('assigned_rep_id')]
            assigned_clinic_count = len(assigned_clinics)
            
            # Count unassigned clinics
            unassigned_clinics = [c for c in self.clinics_data if not c.get('assigned_rep_id')]
            unassigned_clinic_count = len(unassigned_clinics)
            
            # Verify relationship integrity
            rep_ids = {u['id'] for u in medical_reps}
            orphaned_clinics = [c for c in assigned_clinics if c.get('assigned_rep_id') not in rep_ids]
            orphaned_count = len(orphaned_clinics)
            
            # Calculate assignment ratio
            assignment_ratio = (assigned_clinic_count / len(self.clinics_data) * 100) if self.clinics_data else 0
            
            details = f"Medical Reps: {medical_rep_count}, Assigned Clinics: {assigned_clinic_count}, Unassigned: {unassigned_clinic_count}, Orphaned: {orphaned_count}, Assignment Ratio: {assignment_ratio:.1f}%"
            
            # Test passes if there are no orphaned clinics and assignment ratio is reasonable
            success = orphaned_count == 0 and assignment_ratio > 0
            
            self.log_test(
                "User-Clinic Relationship Integrity",
                success,
                details
            )
            
            # Additional analysis: Rep workload distribution
            rep_workload = {}
            for clinic in assigned_clinics:
                rep_id = clinic.get('assigned_rep_id')
                rep_workload[rep_id] = rep_workload.get(rep_id, 0) + 1
            
            if rep_workload:
                avg_workload = sum(rep_workload.values()) / len(rep_workload)
                max_workload = max(rep_workload.values())
                min_workload = min(rep_workload.values())
                
                workload_details = f"Avg clinics per rep: {avg_workload:.1f}, Max: {max_workload}, Min: {min_workload}"
                workload_balanced = (max_workload - min_workload) <= (avg_workload * 0.5)  # Within 50% of average
                
                self.log_test(
                    "Rep Workload Distribution",
                    workload_balanced,
                    workload_details
                )
            
        except Exception as e:
            self.log_test("User-Clinic Relationship Analysis", False, f"Error: {str(e)}")
    
    def analyze_order_relationships(self):
        """2. فحص ترابط Orders مع Users و Clinics و Products"""
        print("\n🔍 **PHASE 3: ORDER RELATIONSHIP ANALYSIS**")
        
        try:
            # Verify order-user relationships
            user_ids = {u['id'] for u in self.users_data}
            orders_with_valid_reps = [o for o in self.orders_data if o.get('medical_rep_id') in user_ids]
            orphaned_orders_users = len(self.orders_data) - len(orders_with_valid_reps)
            
            # Verify order-clinic relationships  
            clinic_ids = {c['id'] for c in self.clinics_data}
            orders_with_valid_clinics = [o for o in self.orders_data if o.get('clinic_id') in clinic_ids]
            orphaned_orders_clinics = len(self.orders_data) - len(orders_with_valid_clinics)
            
            # Analyze order distribution by rep
            rep_order_count = {}
            for order in self.orders_data:
                rep_id = order.get('medical_rep_id')
                if rep_id:
                    rep_order_count[rep_id] = rep_order_count.get(rep_id, 0) + 1
            
            active_reps_with_orders = len(rep_order_count)
            total_medical_reps = len([u for u in self.users_data if u.get('role') in ['medical_rep', 'key_account']])
            rep_activity_ratio = (active_reps_with_orders / total_medical_reps * 100) if total_medical_reps > 0 else 0
            
            details = f"Orders: {len(self.orders_data)}, Valid Rep Links: {len(orders_with_valid_reps)}, Valid Clinic Links: {len(orders_with_valid_clinics)}, Active Reps: {active_reps_with_orders}/{total_medical_reps} ({rep_activity_ratio:.1f}%)"
            
            success = orphaned_orders_users == 0 and orphaned_orders_clinics == 0
            
            self.log_test(
                "Order Relationship Integrity",
                success,
                details
            )
            
            # Analyze order-clinic debt correlation
            if hasattr(self, 'debt_data'):
                clinics_with_orders = {o.get('clinic_id') for o in self.orders_data}
                clinics_with_debt = {d.get('clinic_id') for d in getattr(self, 'debt_data', [])}
                overlap = len(clinics_with_orders.intersection(clinics_with_debt))
                
                debt_correlation = (overlap / len(clinics_with_orders) * 100) if clinics_with_orders else 0
                self.log_test(
                    "Order-Debt Correlation",
                    True,
                    f"Clinics with both orders and debt: {overlap}, Correlation: {debt_correlation:.1f}%"
                )
            
        except Exception as e:
            self.log_test("Order Relationship Analysis", False, f"Error: {str(e)}")
    
    def analyze_visit_relationships(self):
        """3. فحص ترابط Visits مع Users و Clinics و Doctors"""
        print("\n🔍 **PHASE 4: VISIT RELATIONSHIP ANALYSIS**")
        
        try:
            # Verify visit-user relationships
            user_ids = {u['id'] for u in self.users_data}
            visits_with_valid_reps = [v for v in self.visits_data if v.get('sales_rep_id') in user_ids]
            orphaned_visits_users = len(self.visits_data) - len(visits_with_valid_reps)
            
            # Verify visit-clinic relationships
            clinic_ids = {c['id'] for c in self.clinics_data}
            visits_with_valid_clinics = [v for v in self.visits_data if v.get('clinic_id') in clinic_ids]
            orphaned_visits_clinics = len(self.visits_data) - len(visits_with_valid_clinics)
            
            # Verify visit-doctor relationships
            doctor_ids = {d['id'] for d in self.doctors_data}
            visits_with_valid_doctors = [v for v in self.visits_data if v.get('doctor_id') in doctor_ids]
            orphaned_visits_doctors = len(self.visits_data) - len(visits_with_valid_doctors)
            
            # Analyze visit frequency per rep
            rep_visit_count = {}
            for visit in self.visits_data:
                rep_id = visit.get('sales_rep_id')
                if rep_id:
                    rep_visit_count[rep_id] = rep_visit_count.get(rep_id, 0) + 1
            
            active_reps_with_visits = len(rep_visit_count)
            total_medical_reps = len([u for u in self.users_data if u.get('role') in ['medical_rep', 'key_account']])
            visit_activity_ratio = (active_reps_with_visits / total_medical_reps * 100) if total_medical_reps > 0 else 0
            
            details = f"Visits: {len(self.visits_data)}, Valid Rep: {len(visits_with_valid_reps)}, Valid Clinic: {len(visits_with_valid_clinics)}, Valid Doctor: {len(visits_with_valid_doctors)}, Active Reps: {active_reps_with_visits}/{total_medical_reps} ({visit_activity_ratio:.1f}%)"
            
            success = orphaned_visits_users == 0 and orphaned_visits_clinics == 0 and orphaned_visits_doctors == 0
            
            self.log_test(
                "Visit Relationship Integrity", 
                success,
                details
            )
            
            # Analyze visit-order correlation
            clinics_with_visits = {v.get('clinic_id') for v in self.visits_data}
            clinics_with_orders = {o.get('clinic_id') for o in self.orders_data}
            overlap = len(clinics_with_visits.intersection(clinics_with_orders))
            
            visit_order_correlation = (overlap / len(clinics_with_visits) * 100) if clinics_with_visits else 0
            
            self.log_test(
                "Visit-Order Correlation",
                True,
                f"Clinics with both visits and orders: {overlap}, Correlation: {visit_order_correlation:.1f}%"
            )
            
        except Exception as e:
            self.log_test("Visit Relationship Analysis", False, f"Error: {str(e)}")
    
    def analyze_geographic_relationships(self):
        """4. فحص ترابط Lines مع Areas مع Products"""
        print("\n🔍 **PHASE 5: GEOGRAPHIC RELATIONSHIP ANALYSIS**")
        
        try:
            # Verify line-area relationships
            line_ids = {l['id'] for l in self.lines_data}
            areas_with_valid_lines = [a for a in self.areas_data if a.get('parent_line_id') in line_ids]
            orphaned_areas = len(self.areas_data) - len(areas_with_valid_lines)
            
            # Verify line-product assignments
            product_ids = {p['id'] for p in self.products_data}
            lines_with_products = []
            total_assigned_products = 0
            
            for line in self.lines_data:
                assigned_products = line.get('assigned_products', [])
                if assigned_products:
                    valid_products = [pid for pid in assigned_products if pid in product_ids]
                    if valid_products:
                        lines_with_products.append(line)
                        total_assigned_products += len(valid_products)
            
            # Calculate coverage metrics
            line_coverage = (len(lines_with_products) / len(self.lines_data) * 100) if self.lines_data else 0
            area_coverage = (len(areas_with_valid_lines) / len(self.areas_data) * 100) if self.areas_data else 0
            
            # Analyze geographic distribution
            areas_per_line = {}
            for area in areas_with_valid_lines:
                line_id = area.get('parent_line_id')
                areas_per_line[line_id] = areas_per_line.get(line_id, 0) + 1
            
            avg_areas_per_line = sum(areas_per_line.values()) / len(areas_per_line) if areas_per_line else 0
            
            details = f"Lines: {len(self.lines_data)}, Areas: {len(self.areas_data)}, Valid Area-Line Links: {len(areas_with_valid_lines)}, Lines with Products: {len(lines_with_products)}, Avg Areas/Line: {avg_areas_per_line:.1f}"
            
            success = orphaned_areas == 0 and line_coverage > 0
            
            self.log_test(
                "Geographic Relationship Integrity",
                success,
                details
            )
            
            # Analyze clinic distribution across areas
            clinics_per_area = {}
            for clinic in self.clinics_data:
                area_id = clinic.get('area_id')
                if area_id:
                    clinics_per_area[area_id] = clinics_per_area.get(area_id, 0) + 1
            
            areas_with_clinics = len(clinics_per_area)
            total_areas = len(self.areas_data)
            area_utilization = (areas_with_clinics / total_areas * 100) if total_areas > 0 else 0
            
            self.log_test(
                "Area Clinic Distribution",
                True,
                f"Areas with clinics: {areas_with_clinics}/{total_areas} ({area_utilization:.1f}%)"
            )
            
        except Exception as e:
            self.log_test("Geographic Relationship Analysis", False, f"Error: {str(e)}")
    
    def analyze_financial_relationships(self):
        """5. فحص ترابط Financial (Debts/Collections) مع Clinics و Users"""
        print("\n🔍 **PHASE 6: FINANCIAL RELATIONSHIP ANALYSIS**")
        
        try:
            # Try to fetch debt data - check multiple possible endpoints
            debt_endpoints = ["/debts", "/debts/", "/api/debts", "/debt", "/financial/debts"]
            debt_data = []
            debt_endpoint_found = False
            
            for endpoint in debt_endpoints:
                try:
                    start_time = time.time()
                    response = requests.get(f"{BACKEND_URL.replace('/api', '')}{endpoint}", headers=self.get_headers())
                    response_time = (time.time() - start_time) * 1000
                    
                    if response.status_code == 200:
                        debt_data = response.json()
                        debt_endpoint_found = True
                        self.log_test("Fetch Debt Data", True, f"Retrieved {len(debt_data)} debt records from {endpoint}", response_time)
                        break
                    elif response.status_code == 403:
                        continue  # Try next endpoint
                    else:
                        continue  # Try next endpoint
                except:
                    continue
            
            if debt_endpoint_found and debt_data:
                # Verify debt-clinic relationships
                clinic_ids = {c['id'] for c in self.clinics_data}
                debts_with_valid_clinics = [d for d in debt_data if d.get('clinic_id') in clinic_ids]
                orphaned_debts = len(debt_data) - len(debts_with_valid_clinics)
                
                # Verify debt-user relationships (medical reps)
                user_ids = {u['id'] for u in self.users_data}
                debts_with_valid_reps = [d for d in debt_data if d.get('medical_rep_id') in user_ids]
                
                # Calculate financial metrics
                total_debt_amount = sum(d.get('amount', 0) for d in debt_data)
                clinics_with_debt = len(set(d.get('clinic_id') for d in debt_data if d.get('clinic_id')))
                debt_penetration = (clinics_with_debt / len(self.clinics_data) * 100) if self.clinics_data else 0
                
                details = f"Debts: {len(debt_data)}, Valid Clinic Links: {len(debts_with_valid_clinics)}, Valid Rep Links: {len(debts_with_valid_reps)}, Total Amount: {total_debt_amount:.2f}, Clinics with Debt: {clinics_with_debt} ({debt_penetration:.1f}%)"
                
                success = orphaned_debts == 0
                
                self.log_test(
                    "Financial Relationship Integrity",
                    success,
                    details
                )
                
            else:
                self.log_test("Fetch Debt Data", False, "No debt endpoints found or accessible - Debt system not implemented", 0)
                
                # Alternative: Check for order amounts as financial indicators
                total_order_amount = sum(o.get('total_amount', 0) for o in self.orders_data)
                orders_with_amounts = len([o for o in self.orders_data if o.get('total_amount', 0) > 0])
                
                self.log_test(
                    "Order Financial Analysis",
                    True,
                    f"Orders with amounts: {orders_with_amounts}/{len(self.orders_data)}, Total Value: {total_order_amount:.2f}"
                )
                
        except Exception as e:
            self.log_test("Financial Relationship Analysis", False, f"Error: {str(e)}")
    
    def verify_count_consistency(self):
        """6. فحص التطابق في العدد"""
        print("\n🔍 **PHASE 7: COUNT CONSISTENCY VERIFICATION**")
        
        try:
            # Test dashboard stats consistency
            start_time = time.time()
            response = requests.get(f"{BACKEND_URL}/dashboard/stats", headers=self.get_headers())
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                dashboard_response = response.json()
                dashboard_stats = dashboard_response.get('data', dashboard_response)  # Handle nested data
                
                # Compare dashboard counts with actual data counts
                comparisons = [
                    ("users", len(self.users_data), dashboard_stats.get('total_users', 0)),
                    ("clinics", len(self.clinics_data), dashboard_stats.get('total_clinics', 0)),
                    ("orders", len(self.orders_data), dashboard_stats.get('total_orders', 0)),
                    ("visits", len(self.visits_data), dashboard_stats.get('total_visits', 0)),
                    ("products", len(self.products_data), dashboard_stats.get('total_products', 0))
                ]
                
                consistent_counts = 0
                total_comparisons = len(comparisons)
                
                for entity, actual_count, dashboard_count in comparisons:
                    is_consistent = actual_count == dashboard_count
                    if is_consistent:
                        consistent_counts += 1
                    
                    self.log_test(
                        f"Count Consistency - {entity.title()}",
                        is_consistent,
                        f"Actual: {actual_count}, Dashboard: {dashboard_count}"
                    )
                
                consistency_rate = (consistent_counts / total_comparisons * 100)
                
                self.log_test(
                    "Overall Count Consistency",
                    consistency_rate >= 80,  # 80% threshold
                    f"Consistent counts: {consistent_counts}/{total_comparisons} ({consistency_rate:.1f}%)"
                )
                
            else:
                self.log_test("Dashboard Stats Fetch", False, f"HTTP {response.status_code}", response_time)
                
        except Exception as e:
            self.log_test("Count Consistency Verification", False, f"Error: {str(e)}")
    
    def analyze_data_logic(self):
        """7. منطقية الأرقام"""
        print("\n🔍 **PHASE 8: DATA LOGIC ANALYSIS**")
        
        try:
            # Analyze user distribution logic
            role_distribution = {}
            for user in self.users_data:
                role = user.get('role', 'unknown')
                role_distribution[role] = role_distribution.get(role, 0) + 1
            
            # Check if role distribution makes business sense
            medical_reps = role_distribution.get('medical_rep', 0)
            managers = sum(role_distribution.get(role, 0) for role in ['manager', 'line_manager', 'area_manager', 'district_manager'])
            admin_users = role_distribution.get('admin', 0)
            
            # Business logic checks
            rep_to_manager_ratio = medical_reps / managers if managers > 0 else 0
            reasonable_ratio = 2 <= rep_to_manager_ratio <= 20  # 2-20 reps per manager is reasonable
            
            self.log_test(
                "User Role Distribution Logic",
                reasonable_ratio,
                f"Medical Reps: {medical_reps}, Managers: {managers}, Ratio: {rep_to_manager_ratio:.1f}:1, Admin: {admin_users}"
            )
            
            # Analyze clinic-to-rep assignment logic
            if medical_reps > 0:
                clinics_per_rep = len(self.clinics_data) / medical_reps
                reasonable_workload = 5 <= clinics_per_rep <= 50  # 5-50 clinics per rep is reasonable
                
                self.log_test(
                    "Clinic Assignment Logic",
                    reasonable_workload,
                    f"Avg clinics per rep: {clinics_per_rep:.1f} (Range: 5-50 is reasonable)"
                )
            
            # Analyze visit frequency logic
            if self.visits_data and medical_reps > 0:
                visits_per_rep = len(self.visits_data) / medical_reps
                reasonable_visits = 1 <= visits_per_rep <= 100  # 1-100 visits per rep is reasonable
                
                self.log_test(
                    "Visit Frequency Logic",
                    reasonable_visits,
                    f"Avg visits per rep: {visits_per_rep:.1f} (Range: 1-100 is reasonable)"
                )
            
            # Analyze order value logic
            if self.orders_data:
                order_amounts = [o.get('total_amount', 0) for o in self.orders_data if o.get('total_amount', 0) > 0]
                if order_amounts:
                    avg_order_value = sum(order_amounts) / len(order_amounts)
                    reasonable_value = 100 <= avg_order_value <= 50000  # 100-50000 is reasonable order range
                    
                    self.log_test(
                        "Order Value Logic",
                        reasonable_value,
                        f"Avg order value: {avg_order_value:.2f} (Range: 100-50000 is reasonable)"
                    )
            
        except Exception as e:
            self.log_test("Data Logic Analysis", False, f"Error: {str(e)}")
    
    def generate_comprehensive_report(self):
        """Generate final comprehensive report"""
        print("\n" + "="*80)
        print("🎯 **COMPREHENSIVE DATABASE RELATIONSHIP ANALYSIS REPORT**")
        print("="*80)
        
        end_time = time.time()
        total_duration = end_time - self.start_time
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        
        print(f"\n📊 **EXECUTIVE SUMMARY:**")
        print(f"✅ Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        print(f"⏱️ Total Duration: {total_duration:.2f} seconds")
        
        print(f"\n📋 **DATA OVERVIEW:**")
        print(f"👥 Users: {len(self.users_data)}")
        print(f"🏥 Clinics: {len(self.clinics_data)}")
        print(f"📦 Orders: {len(self.orders_data)}")
        print(f"🚶 Visits: {len(self.visits_data)}")
        print(f"📍 Lines: {len(self.lines_data)}")
        print(f"🗺️ Areas: {len(self.areas_data)}")
        print(f"📦 Products: {len(self.products_data)}")
        print(f"🏪 Warehouses: {len(self.warehouses_data)}")
        print(f"👨‍⚕️ Doctors: {len(self.doctors_data)}")
        
        print(f"\n🔍 **DETAILED TEST RESULTS:**")
        for result in self.test_results:
            print(f"{result['status']} | {result['test']} | {result['details']} | {result['response_time']}")
        
        # Final assessment
        if success_rate >= 90:
            assessment = "🎉 EXCELLENT - Database relationships are highly consistent and logical"
        elif success_rate >= 75:
            assessment = "✅ GOOD - Database relationships are mostly consistent with minor issues"
        elif success_rate >= 60:
            assessment = "⚠️ FAIR - Database relationships have some inconsistencies that need attention"
        else:
            assessment = "❌ POOR - Database relationships have significant issues requiring immediate attention"
        
        print(f"\n🎯 **FINAL ASSESSMENT:** {assessment}")
        
        return success_rate >= 75  # Consider 75% as passing threshold

def main():
    """Main test execution"""
    print("🔍 **فحص قواعد البيانات والترابط المنطقي - Critical Database Relationship Analysis**")
    print("="*80)
    
    tester = DatabaseRelationshipTester()
    
    # Phase 1: Authentication
    if not tester.authenticate():
        print("❌ Authentication failed. Cannot proceed with testing.")
        return False
    
    # Phase 2: Data Collection
    tester.fetch_all_data()
    
    # Phase 3: Relationship Analysis
    tester.analyze_user_clinic_relationships()
    tester.analyze_order_relationships()
    tester.analyze_visit_relationships()
    tester.analyze_geographic_relationships()
    tester.analyze_financial_relationships()
    
    # Phase 4: Consistency Verification
    tester.verify_count_consistency()
    tester.analyze_data_logic()
    
    # Phase 5: Final Report
    success = tester.generate_comprehensive_report()
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)