#!/usr/bin/env python3
"""
Integrated Gamification System APIs Testing
Tests the new gamification endpoints as requested in the Arabic review
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://229cfa0c-fab1-4318-9691-b4fa0c2c30ce.preview.emergentagent.com/api"
DEFAULT_ADMIN = {"username": "admin", "password": "admin123"}

class GamificationTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.sales_rep_token = None
        self.manager_token = None
        self.sales_rep_id = None
        self.manager_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
        print()
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, token: str = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response.status_code, response.json() if response.content else {}
        except requests.exceptions.RequestException as e:
            return 500, {"error": str(e)}
        except json.JSONDecodeError:
            return response.status_code, {"error": "Invalid JSON response"}
    
    def setup_test_users(self):
        """Setup admin, manager, and sales rep users for testing"""
        print("🔧 Setting up test users...")
        
        # Login as admin
        status_code, response = self.make_request("POST", "/auth/login", DEFAULT_ADMIN)
        if status_code == 200 and "token" in response:
            self.admin_token = response["token"]
            print(f"✅ Admin login successful")
        else:
            print(f"❌ Admin login failed: {status_code}")
            return False
        
        # Create manager user
        timestamp = str(int(time.time()))
        manager_data = {
            "username": f"manager_gam_{timestamp}",
            "email": f"manager_gam_{timestamp}@test.com",
            "password": "manager123",
            "role": "manager",
            "full_name": "مدير التجريبي للألعاب",
            "phone": "+966502222222"
        }
        
        status_code, response = self.make_request("POST", "/auth/register", manager_data, self.admin_token)
        if status_code == 200:
            self.manager_id = response.get('user_id')
            # Login as manager
            login_data = {"username": f"manager_gam_{timestamp}", "password": "manager123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.manager_token = login_response["token"]
                print(f"✅ Manager created and logged in")
        
        # Create sales rep user
        sales_rep_data = {
            "username": f"sales_gam_{timestamp}",
            "email": f"sales_gam_{timestamp}@test.com",
            "password": "sales123",
            "role": "sales_rep",
            "full_name": "مندوب المبيعات للألعاب",
            "phone": "+966501111111",
            "managed_by": self.manager_id
        }
        
        status_code, response = self.make_request("POST", "/auth/register", sales_rep_data, self.admin_token)
        if status_code == 200:
            self.sales_rep_id = response.get('user_id')
            # Login as sales rep
            login_data = {"username": f"sales_gam_{timestamp}", "password": "sales123"}
            status_code, login_response = self.make_request("POST", "/auth/login", login_data)
            if status_code == 200:
                self.sales_rep_token = login_response["token"]
                print(f"✅ Sales rep created and logged in")
        
        return True
    
    def test_gamification_user_profile_admin(self):
        """Test 1: GET /api/gamification/user-profile/{user_id} - Admin accessing sales rep profile"""
        if not self.admin_token or not self.sales_rep_id:
            self.log_test("Gamification User Profile (Admin)", False, "Missing admin token or sales rep ID")
            return False
        
        status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.admin_token)
        
        if status_code == 200:
            # Verify complete structure as requested
            required_sections = ["user_info", "gamification_stats", "points_breakdown", "performance_stats", "achievements", "active_challenges", "leaderboard"]
            
            if all(section in response for section in required_sections):
                # Check gamification_stats structure
                gamification_stats = response.get("gamification_stats", {})
                required_gamification_fields = ["total_points", "level", "next_level_points", "points_to_next_level", "level_progress"]
                
                if all(field in gamification_stats for field in required_gamification_fields):
                    # Check points_breakdown structure
                    points_breakdown = response.get("points_breakdown", {})
                    required_breakdown_fields = ["visit_points", "effectiveness_bonus", "order_points", "approval_bonus", "clinic_points"]
                    
                    if all(field in points_breakdown for field in required_breakdown_fields):
                        # Check performance_stats integration
                        performance_stats = response.get("performance_stats", {})
                        required_performance_fields = ["total_visits", "effective_visits", "effectiveness_rate", "total_orders", "approved_orders", "approval_rate", "clinics_added", "visit_streak"]
                        
                        if all(field in performance_stats for field in required_performance_fields):
                            # Check leaderboard position
                            leaderboard = response.get("leaderboard", {})
                            required_leaderboard_fields = ["position", "total_participants", "top_3", "percentile"]
                            
                            if all(field in leaderboard for field in required_leaderboard_fields):
                                # Verify level system (10 levels from 1,000 to 100,000 points)
                                level = gamification_stats.get("level", 0)
                                if 1 <= level <= 10:
                                    self.log_test("Gamification User Profile (Admin)", True, f"Complete gamification profile with level {level}, {gamification_stats['total_points']} points, position {leaderboard['position']}")
                                    return True
                                else:
                                    self.log_test("Gamification User Profile (Admin)", False, f"Invalid level: {level}")
                            else:
                                self.log_test("Gamification User Profile (Admin)", False, "Missing leaderboard fields")
                        else:
                            self.log_test("Gamification User Profile (Admin)", False, "Missing performance stats fields")
                    else:
                        self.log_test("Gamification User Profile (Admin)", False, "Missing points breakdown fields")
                else:
                    self.log_test("Gamification User Profile (Admin)", False, "Missing gamification stats fields")
            else:
                self.log_test("Gamification User Profile (Admin)", False, f"Missing required sections: {list(response.keys())}")
        else:
            self.log_test("Gamification User Profile (Admin)", False, f"Status: {status_code}", response)
        return False

    def test_gamification_user_profile_sales_rep(self):
        """Test 2: GET /api/gamification/user-profile/{user_id} - Sales rep accessing own profile"""
        if not self.sales_rep_token or not self.sales_rep_id:
            self.log_test("Gamification User Profile (Sales Rep)", False, "Missing sales rep token or ID")
            return False
        
        status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.sales_rep_token)
        
        if status_code == 200:
            # Verify points calculation based on real performance
            points_breakdown = response.get("points_breakdown", {})
            performance_stats = response.get("performance_stats", {})
            
            # Verify points calculation formula accuracy
            expected_visit_points = performance_stats.get("total_visits", 0) * 10
            expected_effectiveness_bonus = performance_stats.get("effective_visits", 0) * 20
            expected_order_points = performance_stats.get("total_orders", 0) * 50
            expected_approval_bonus = performance_stats.get("approved_orders", 0) * 100
            expected_clinic_points = performance_stats.get("clinics_added", 0) * 200
            
            actual_visit_points = points_breakdown.get("visit_points", 0)
            actual_effectiveness_bonus = points_breakdown.get("effectiveness_bonus", 0)
            actual_order_points = points_breakdown.get("order_points", 0)
            actual_approval_bonus = points_breakdown.get("approval_bonus", 0)
            actual_clinic_points = points_breakdown.get("clinic_points", 0)
            
            if (actual_visit_points == expected_visit_points and
                actual_effectiveness_bonus == expected_effectiveness_bonus and
                actual_order_points == expected_order_points and
                actual_approval_bonus == expected_approval_bonus and
                actual_clinic_points == expected_clinic_points):
                
                # Check achievements with Arabic descriptions
                achievements = response.get("achievements", [])
                has_arabic_descriptions = all("title" in achievement and any(ord(char) > 127 for char in achievement["title"]) for achievement in achievements) if achievements else True
                
                if has_arabic_descriptions:
                    self.log_test("Gamification User Profile (Sales Rep)", True, f"Points calculation accurate, Arabic descriptions present, {len(achievements)} achievements unlocked")
                    return True
                else:
                    self.log_test("Gamification User Profile (Sales Rep)", False, "Missing Arabic descriptions in achievements")
            else:
                self.log_test("Gamification User Profile (Sales Rep)", False, f"Points calculation mismatch: expected vs actual - visits: {expected_visit_points} vs {actual_visit_points}")
        else:
            self.log_test("Gamification User Profile (Sales Rep)", False, f"Status: {status_code}", response)
        return False

    def test_gamification_leaderboard_all_time(self):
        """Test 3: GET /api/gamification/leaderboard?period=all_time"""
        if not self.admin_token:
            self.log_test("Gamification Leaderboard (All Time)", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/gamification/leaderboard?period=all_time&limit=10", token=self.admin_token)
        
        if status_code == 200:
            required_fields = ["period", "leaderboard", "statistics", "generated_at"]
            
            if all(field in response for field in required_fields):
                # Check leaderboard entries structure
                leaderboard = response.get("leaderboard", [])
                if len(leaderboard) > 0:
                    entry = leaderboard[0]
                    required_entry_fields = ["user_id", "username", "full_name", "total_points", "level", "performance", "badges", "position"]
                    
                    if all(field in entry for field in required_entry_fields):
                        # Check performance metrics
                        performance = entry.get("performance", {})
                        required_performance_fields = ["visits", "effective_visits", "effectiveness_rate", "orders", "approved_orders", "approval_rate", "clinics_added"]
                        
                        if all(field in performance for field in required_performance_fields):
                            # Check statistics
                            statistics = response.get("statistics", {})
                            required_stats_fields = ["total_participants", "average_points", "highest_score", "period_label"]
                            
                            if all(field in statistics for field in required_stats_fields):
                                # Verify Arabic period label
                                period_label = statistics.get("period_label", "")
                                if "كل الأوقات" in period_label:
                                    self.log_test("Gamification Leaderboard (All Time)", True, f"Found {len(leaderboard)} participants, highest score: {statistics['highest_score']}, Arabic labels present")
                                    return True
                                else:
                                    self.log_test("Gamification Leaderboard (All Time)", False, f"Missing Arabic period label: {period_label}")
                            else:
                                self.log_test("Gamification Leaderboard (All Time)", False, "Missing statistics fields")
                        else:
                            self.log_test("Gamification Leaderboard (All Time)", False, "Missing performance fields")
                    else:
                        self.log_test("Gamification Leaderboard (All Time)", False, "Missing entry fields")
                else:
                    self.log_test("Gamification Leaderboard (All Time)", True, "No participants in leaderboard (expected if no sales reps with activity)")
                    return True
            else:
                self.log_test("Gamification Leaderboard (All Time)", False, f"Missing required fields: {list(response.keys())}")
        else:
            self.log_test("Gamification Leaderboard (All Time)", False, f"Status: {status_code}", response)
        return False

    def test_gamification_leaderboard_monthly(self):
        """Test 4: GET /api/gamification/leaderboard?period=monthly"""
        if not self.admin_token:
            self.log_test("Gamification Leaderboard (Monthly)", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/gamification/leaderboard?period=monthly&limit=5", token=self.admin_token)
        
        if status_code == 200:
            # Verify period filtering
            if response.get("period") == "monthly":
                statistics = response.get("statistics", {})
                period_label = statistics.get("period_label", "")
                
                if "هذا الشهر" in period_label:
                    # Check badges and performance metrics
                    leaderboard = response.get("leaderboard", [])
                    if len(leaderboard) > 0:
                        # Check for badges
                        top_entry = leaderboard[0]
                        badges = top_entry.get("badges", [])
                        
                        # Verify badge structure if present
                        if badges:
                            badge = badges[0]
                            required_badge_fields = ["icon", "title", "color"]
                            if all(field in badge for field in required_badge_fields):
                                self.log_test("Gamification Leaderboard (Monthly)", True, f"Monthly leaderboard with {len(badges)} badges, Arabic labels correct")
                                return True
                            else:
                                self.log_test("Gamification Leaderboard (Monthly)", False, "Invalid badge structure")
                        else:
                            self.log_test("Gamification Leaderboard (Monthly)", True, "Monthly leaderboard working, no badges (expected)")
                            return True
                    else:
                        self.log_test("Gamification Leaderboard (Monthly)", True, "Monthly leaderboard empty (expected)")
                        return True
                else:
                    self.log_test("Gamification Leaderboard (Monthly)", False, f"Missing Arabic monthly label: {period_label}")
            else:
                self.log_test("Gamification Leaderboard (Monthly)", False, f"Wrong period: {response.get('period')}")
        else:
            self.log_test("Gamification Leaderboard (Monthly)", False, f"Status: {status_code}", response)
        return False

    def test_gamification_leaderboard_weekly(self):
        """Test 5: GET /api/gamification/leaderboard?period=weekly"""
        if not self.sales_rep_token:
            self.log_test("Gamification Leaderboard (Weekly)", False, "No sales rep token available")
            return False
        
        status_code, response = self.make_request("GET", "/gamification/leaderboard?period=weekly&limit=20", token=self.sales_rep_token)
        
        if status_code == 200:
            # Verify weekly period and Arabic labels
            if response.get("period") == "weekly":
                statistics = response.get("statistics", {})
                period_label = statistics.get("period_label", "")
                
                if "هذا الأسبوع" in period_label:
                    # Verify user ranking by real points
                    leaderboard = response.get("leaderboard", [])
                    
                    # Check if leaderboard is sorted by total_points (descending)
                    if len(leaderboard) > 1:
                        is_sorted = all(leaderboard[i]["total_points"] >= leaderboard[i+1]["total_points"] for i in range(len(leaderboard)-1))
                        if is_sorted:
                            self.log_test("Gamification Leaderboard (Weekly)", True, f"Weekly leaderboard correctly sorted by points, {len(leaderboard)} participants")
                            return True
                        else:
                            self.log_test("Gamification Leaderboard (Weekly)", False, "Leaderboard not sorted by points")
                    else:
                        self.log_test("Gamification Leaderboard (Weekly)", True, "Weekly leaderboard working (single or no participants)")
                        return True
                else:
                    self.log_test("Gamification Leaderboard (Weekly)", False, f"Missing Arabic weekly label: {period_label}")
            else:
                self.log_test("Gamification Leaderboard (Weekly)", False, f"Wrong period: {response.get('period')}")
        else:
            self.log_test("Gamification Leaderboard (Weekly)", False, f"Status: {status_code}", response)
        return False

    def test_gamification_achievements_catalog(self):
        """Test 6: GET /api/gamification/achievements - Achievement catalog with unlock conditions"""
        if not self.admin_token:
            self.log_test("Gamification Achievements Catalog", False, "No admin token available")
            return False
        
        status_code, response = self.make_request("GET", "/gamification/achievements", token=self.admin_token)
        
        if status_code == 200:
            required_fields = ["achievements", "categories", "total_achievements", "total_possible_points"]
            
            if all(field in response for field in required_fields):
                achievements = response.get("achievements", [])
                categories = response.get("categories", [])
                total_possible_points = response.get("total_possible_points", 0)
                
                if len(achievements) > 0:
                    # Check achievement structure
                    achievement = achievements[0]
                    required_achievement_fields = ["id", "title", "description", "icon", "category", "unlock_condition", "points_reward"]
                    
                    if all(field in achievement for field in required_achievement_fields):
                        # Verify categories
                        expected_categories = ["visits", "effectiveness", "orders", "clinics", "consistency"]
                        if all(cat in categories for cat in expected_categories):
                            # Verify Arabic descriptions
                            has_arabic_titles = all(any(ord(char) > 127 for char in ach["title"]) for ach in achievements)
                            has_arabic_descriptions = all(any(ord(char) > 127 for char in ach["description"]) for ach in achievements)
                            
                            if has_arabic_titles and has_arabic_descriptions:
                                # Verify points_reward for each achievement
                                all_have_points = all(ach.get("points_reward", 0) > 0 for ach in achievements)
                                
                                if all_have_points:
                                    self.log_test("Gamification Achievements Catalog", True, f"Found {len(achievements)} achievements across {len(categories)} categories, total possible points: {total_possible_points}")
                                    return True
                                else:
                                    self.log_test("Gamification Achievements Catalog", False, "Some achievements missing points_reward")
                            else:
                                self.log_test("Gamification Achievements Catalog", False, "Missing Arabic descriptions")
                        else:
                            self.log_test("Gamification Achievements Catalog", False, f"Missing expected categories: {categories}")
                    else:
                        self.log_test("Gamification Achievements Catalog", False, "Missing achievement fields")
                else:
                    self.log_test("Gamification Achievements Catalog", False, "No achievements found")
            else:
                self.log_test("Gamification Achievements Catalog", False, f"Missing required fields: {list(response.keys())}")
        else:
            self.log_test("Gamification Achievements Catalog", False, f"Status: {status_code}", response)
        return False

    def test_gamification_security_permissions(self):
        """Test 7: Gamification APIs role-based access control"""
        if not self.sales_rep_token or not self.manager_token or not self.admin_token:
            self.log_test("Gamification Security Permissions", False, "Missing required tokens")
            return False
        
        # Test sales rep can access own profile
        status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.sales_rep_token)
        if status_code != 200:
            self.log_test("Gamification Security Permissions", False, "Sales rep cannot access own profile")
            return False
        
        # Test sales rep cannot access other user's profile (if manager exists)
        if self.manager_id:
            status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.manager_id}", token=self.sales_rep_token)
            if status_code != 403:
                self.log_test("Gamification Security Permissions", False, f"Sales rep should not access other profiles: {status_code}")
                return False
        
        # Test manager can access subordinate profiles
        status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.manager_token)
        if status_code != 200:
            self.log_test("Gamification Security Permissions", False, "Manager cannot access subordinate profile")
            return False
        
        # Test admin can access any profile
        status_code, response = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.admin_token)
        if status_code != 200:
            self.log_test("Gamification Security Permissions", False, "Admin cannot access user profile")
            return False
        
        # Test leaderboard access for different roles
        for token_name, token in [("sales_rep", self.sales_rep_token), ("manager", self.manager_token), ("admin", self.admin_token)]:
            status_code, response = self.make_request("GET", "/gamification/leaderboard", token=token)
            if status_code != 200:
                self.log_test("Gamification Security Permissions", False, f"{token_name} cannot access leaderboard")
                return False
        
        # Test achievements catalog access
        status_code, response = self.make_request("GET", "/gamification/achievements", token=self.sales_rep_token)
        if status_code != 200:
            self.log_test("Gamification Security Permissions", False, "Sales rep cannot access achievements catalog")
            return False
        
        self.log_test("Gamification Security Permissions", True, "All role-based access controls working correctly")
        return True

    def test_gamification_integration_with_real_data(self):
        """Test 8: Verify gamification integration with real data (visits, orders, clinics)"""
        if not self.admin_token or not self.sales_rep_id:
            self.log_test("Gamification Integration with Real Data", False, "Missing admin token or sales rep ID")
            return False
        
        # Get current gamification profile
        status_code, profile_before = self.make_request("GET", f"/gamification/user-profile/{self.sales_rep_id}", token=self.admin_token)
        if status_code != 200:
            self.log_test("Gamification Integration with Real Data", False, "Cannot get initial profile")
            return False
        
        initial_points = profile_before.get("gamification_stats", {}).get("total_points", 0)
        initial_visits = profile_before.get("performance_stats", {}).get("total_visits", 0)
        initial_orders = profile_before.get("performance_stats", {}).get("total_orders", 0)
        
        # Verify points calculation matches real data
        points_breakdown = profile_before.get("points_breakdown", {})
        performance_stats = profile_before.get("performance_stats", {})
        
        expected_total = (
            performance_stats.get("total_visits", 0) * 10 +
            performance_stats.get("effective_visits", 0) * 20 +
            performance_stats.get("total_orders", 0) * 50 +
            performance_stats.get("approved_orders", 0) * 100 +
            performance_stats.get("clinics_added", 0) * 200
        )
        
        actual_total = sum(points_breakdown.values())
        
        if abs(expected_total - actual_total) < 0.01:  # Allow for floating point precision
            # Verify level calculation (10 levels from 1,000 to 100,000 points)
            level = profile_before.get("gamification_stats", {}).get("level", 0)
            level_thresholds = [0, 1000, 3000, 6000, 10000, 15000, 25000, 40000, 60000, 100000]
            
            expected_level = 1
            for i, threshold in enumerate(level_thresholds):
                if actual_total >= threshold:
                    expected_level = i + 1
            
            if level == expected_level:
                # Check achievements are based on real performance
                achievements = profile_before.get("achievements", [])
                
                # Verify visit-based achievements
                has_10_visits_achievement = any(ach["id"] == "first_10_visits" for ach in achievements)
                should_have_10_visits = performance_stats.get("total_visits", 0) >= 10
                
                if has_10_visits_achievement == should_have_10_visits:
                    self.log_test("Gamification Integration with Real Data", True, f"Points calculation accurate ({actual_total} points), level {level} correct, achievements match real performance ({len(achievements)} unlocked)")
                    return True
                else:
                    self.log_test("Gamification Integration with Real Data", False, f"Achievement mismatch: has_10_visits={has_10_visits_achievement}, should_have={should_have_10_visits}")
            else:
                self.log_test("Gamification Integration with Real Data", False, f"Level calculation error: expected {expected_level}, got {level}")
        else:
            self.log_test("Gamification Integration with Real Data", False, f"Points calculation error: expected {expected_total}, got {actual_total}")
        return False

    def run_all_gamification_tests(self):
        """Run all gamification tests"""
        print("🎮 INTEGRATED GAMIFICATION SYSTEM TESTING")
        print("=" * 60)
        print("Testing the new gamification endpoints as requested in Arabic review:")
        print("1. GET /api/gamification/user-profile/{user_id}")
        print("2. GET /api/gamification/leaderboard")
        print("3. GET /api/gamification/achievements")
        print("=" * 60)
        
        # Setup test users
        if not self.setup_test_users():
            print("❌ Failed to setup test users")
            return
        
        print("\n🎯 RUNNING GAMIFICATION TESTS")
        print("-" * 40)
        
        # Run all tests
        self.test_gamification_user_profile_admin()
        self.test_gamification_user_profile_sales_rep()
        self.test_gamification_leaderboard_all_time()
        self.test_gamification_leaderboard_monthly()
        self.test_gamification_leaderboard_weekly()
        self.test_gamification_achievements_catalog()
        self.test_gamification_security_permissions()
        self.test_gamification_integration_with_real_data()
        
        # Summary
        print("=" * 60)
        print("📋 GAMIFICATION TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎉 GAMIFICATION TESTING COMPLETED!")
        return passed, total

if __name__ == "__main__":
    tester = GamificationTester()
    tester.run_all_gamification_tests()