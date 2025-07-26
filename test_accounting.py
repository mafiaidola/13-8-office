#!/usr/bin/env python3
"""
Test script specifically for the new Comprehensive Accounting System APIs
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend_test import BackendTester

def main():
    print("🧮 TESTING COMPREHENSIVE ACCOUNTING SYSTEM APIs")
    print("=" * 60)
    print("Focus: Accounting Overview, Invoices, Expenses, Profit-Loss, Customers, Dashboard Stats")
    print("=" * 60)
    
    tester = BackendTester()
    
    # Setup phase - login and create users
    print("\n🔐 SETUP PHASE")
    print("-" * 30)
    
    if not tester.test_admin_login():
        print("❌ CRITICAL: Admin login failed. Cannot continue.")
        return
    
    if not tester.test_jwt_token_validation():
        print("❌ CRITICAL: JWT validation failed. Cannot continue.")
        return
    
    # Create accounting user
    tester.test_create_accounting_user()
    tester.test_create_manager_user()
    tester.test_create_sales_rep_user()
    
    # Setup test data
    tester.setup_test_products_and_warehouses()
    
    print("\n🧮 ACCOUNTING SYSTEM TESTS")
    print("-" * 30)
    
    # Run accounting tests
    accounting_tests = [
        tester.test_accounting_overview,
        tester.test_accounting_invoices,
        tester.test_accounting_expenses_get,
        tester.test_accounting_expenses_post,
        tester.test_accounting_profit_loss_report,
        tester.test_accounting_customers,
        tester.test_accounting_dashboard_stats,
        tester.test_accounting_role_based_access,
        tester.test_accounting_user_access
    ]
    
    passed = 0
    failed = 0
    
    for test in accounting_tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            tester.log_test(test.__name__, False, f"Exception: {str(e)}")
            failed += 1
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 ACCOUNTING SYSTEM TEST SUMMARY")
    print("=" * 60)
    print(f"Total Tests: {passed + failed}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {(passed/(passed+failed)*100):.1f}%")
    print("=" * 60)
    
    if failed > 0:
        print("\n❌ FAILED TESTS:")
        for result in tester.test_results:
            if not result["success"] and "accounting" in result["test"].lower():
                print(f"  - {result['test']}: {result['details']}")

if __name__ == "__main__":
    main()