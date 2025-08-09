// Accounting Dashboard - لوحة تحكم المحاسبة
import React, { useState } from 'react';
import StatCard from './StatCard';
import FinancialChart from './FinancialChart';

const AccountingDashboard = ({ user, dashboardData, timeFilter, onTimeFilterChange, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat('ar-EG').format(num);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0 ج.م';
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="accounting-dashboard p-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen" dir="rtl">
      {/* Header مالي للمحاسبة */}
      <div className="dashboard-header mb-8">
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-xl p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-4xl">💰</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  لوحة تحكم المحاسبة المالية
                </h1>
                <p className="text-green-100 text-lg">
                  مرحباً، {user?.full_name || user?.username} - الإدارة المالية المتقدمة
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    📊 التحليل المالي
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full">
                    💳 إدارة الديون
                  </span>
                </div>
              </div>
            </div>

            {/* Time Filter مالي */}
            <div className="time-filters bg-white/20 rounded-lg p-2">
              {[
                { key: 'month', label: 'الشهر', icon: '📅' },
                { key: 'quarter', label: 'الربع', icon: '📊' },
                { key: 'year', label: 'السنة', icon: '📈' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => onTimeFilterChange(filter.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    timeFilter === filter.key
                      ? 'bg-white text-green-600 shadow-lg'
                      : 'text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* المؤشرات المالية الرئيسية */}
      <div className="financial-kpis-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي الفواتير"
          value={formatNumber(dashboardData.financial_summary?.total_invoices || 0)}
          icon="📄"
          color="blue"
          trend="فاتورة نشطة"
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="المبلغ الإجمالي"
          value={formatCurrency(dashboardData.financial_summary?.total_amount || 0)}
          icon="💎"
          color="purple"
          trend="قيمة إجمالية"
          isFinancial={true}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="المبلغ المستحق"
          value={formatCurrency(dashboardData.financial_summary?.outstanding_amount || 0)}
          icon="⚠️"
          color="red"
          trend="غير مدفوع"
          isFinancial={true}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="المبلغ المحصل"
          value={formatCurrency(dashboardData.financial_summary?.settled_amount || 0)}
          icon="✅"
          color="green"
          trend="محصل بنجاح"
          isFinancial={true}
          className="hover:scale-105 transition-transform"
        />
      </div>

      {/* مؤشرات المدفوعات */}
      <div className="payments-metrics-grid grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="المدفوعات اليوم"
          value={formatNumber(dashboardData.payments_summary?.payments_count || 0)}
          icon="📥"
          color="teal"
          trend={formatCurrency(dashboardData.payments_summary?.total_collected || 0)}
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="الديون المتأخرة"
          value={formatNumber(dashboardData.overdue_debts_count || 0)}
          icon="🔴"
          color="orange"
          trend="تتطلب متابعة عاجلة"
          className="hover:scale-105 transition-transform"
        />
        
        <StatCard
          title="معدل التحصيل"
          value="87%"
          icon="📊"
          color="emerald"
          trend="أداء ممتاز"
          className="hover:scale-105 transition-transform"
        />
      </div>

      {/* تبويبات المحاسبة */}
      <div className="accounting-tabs mb-6">
        <div className="flex gap-2 bg-white rounded-lg p-1 shadow-lg overflow-x-auto">
          {[
            { key: 'overview', label: 'نظرة عامة', icon: '📊' },
            { key: 'invoices', label: 'الفواتير', icon: '📄' },
            { key: 'payments', label: 'المدفوعات', icon: '💳' },
            { key: 'debts', label: 'الديون', icon: '⚠️' },
            { key: 'reports', label: 'التقارير', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 rounded-md font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* محتوى التبويبات */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-content space-y-6">
            {/* ملخص مالي شامل */}
            <div className="financial-summary bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-green-500">💰</span>
                الملخص المالي الشامل
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="summary-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    ملخص الفواتير
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-600">إجمالي الفواتير:</span>
                      <span className="font-bold text-blue-800">
                        {formatNumber(dashboardData.financial_summary?.total_invoices || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">القيمة الإجمالية:</span>
                      <span className="font-bold text-blue-800">
                        {formatCurrency(dashboardData.financial_summary?.total_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">متوسط الفاتورة:</span>
                      <span className="font-bold text-blue-800">
                        {formatCurrency(
                          (dashboardData.financial_summary?.total_amount || 0) / 
                          (dashboardData.financial_summary?.total_invoices || 1)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="summary-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                    <span>💳</span>
                    ملخص المدفوعات
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-600">المبلغ المحصل:</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(dashboardData.financial_summary?.settled_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">المبلغ المستحق:</span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(dashboardData.financial_summary?.outstanding_amount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">معدل التحصيل:</span>
                      <span className="font-bold text-green-800">
                        {Math.round(
                          ((dashboardData.financial_summary?.settled_amount || 0) / 
                          (dashboardData.financial_summary?.total_amount || 1)) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* طرق الدفع */}
            <div className="payment-methods bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-blue-500">💳</span>
                تحليل طرق الدفع
              </h2>
              
              {dashboardData.payment_methods_breakdown && dashboardData.payment_methods_breakdown.length > 0 ? (
                <div className="payment-methods-grid grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dashboardData.payment_methods_breakdown.map((method, index) => (
                    <div key={method._id || index} className="method-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-2xl mb-2">
                          {method._id === 'cash' ? '💵' : 
                           method._id === 'check' ? '📄' : 
                           method._id === 'bank_transfer' ? '🏦' : '💳'}
                        </div>
                        <h3 className="font-bold text-purple-800 mb-2">
                          {method._id === 'cash' ? 'نقداً' : 
                           method._id === 'check' ? 'شيك' : 
                           method._id === 'bank_transfer' ? 'تحويل بنكي' : method._id}
                        </h3>
                        <div className="space-y-1">
                          <div className="text-sm text-purple-600">
                            {formatNumber(method.count)} عملية
                          </div>
                          <div className="font-bold text-purple-800">
                            {formatCurrency(method.total_amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">💳</div>
                  <p className="text-gray-500">لا توجد بيانات طرق دفع حالياً</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="invoices-content">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-blue-500">📄</span>
                إدارة الفواتير
              </h2>
              
              <div className="invoices-analytics grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="analytics-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">📄</div>
                  <div className="text-2xl font-bold text-blue-800 mb-2">
                    {formatNumber(dashboardData.financial_summary?.total_invoices || 0)}
                  </div>
                  <div className="text-blue-600">إجمالي الفواتير</div>
                </div>
                
                <div className="analytics-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">✅</div>
                  <div className="text-2xl font-bold text-green-800 mb-2">
                    {formatCurrency(dashboardData.financial_summary?.settled_amount || 0)}
                  </div>
                  <div className="text-green-600">فواتير مدفوعة</div>
                </div>
                
                <div className="analytics-card bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-4">⏳</div>
                  <div className="text-2xl font-bold text-red-800 mb-2">
                    {formatCurrency(dashboardData.financial_summary?.outstanding_amount || 0)}
                  </div>
                  <div className="text-red-600">فواتير معلقة</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="payments-content">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-green-500">💳</span>
                تتبع المدفوعات
              </h2>
              
              <div className="payments-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-800 mb-1">
                    {formatNumber(dashboardData.payments_summary?.payments_count || 0)}
                  </div>
                  <div className="text-sm text-green-600">عدد المدفوعات</div>
                </div>
                
                <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-800 mb-1">
                    {formatCurrency(dashboardData.payments_summary?.total_collected || 0)}
                  </div>
                  <div className="text-sm text-blue-600">إجمالي المحصل</div>
                </div>
                
                <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-800 mb-1">
                    {formatCurrency(
                      (dashboardData.payments_summary?.total_collected || 0) / 
                      (dashboardData.payments_summary?.payments_count || 1)
                    )}
                  </div>
                  <div className="text-sm text-purple-600">متوسط الدفعة</div>
                </div>
                
                <div className="stat-card bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-orange-800 mb-1">87%</div>
                  <div className="text-sm text-orange-600">كفاءة التحصيل</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'debts' && (
          <div className="debts-content">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                إدارة الديون
              </h2>
              
              <div className="debts-overview grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="debt-card bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white text-xl">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="font-bold text-red-800">ديون متأخرة</h3>
                      <p className="text-sm text-red-600">تتطلب متابعة</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-800 mb-2">
                    {formatNumber(dashboardData.overdue_debts_count || 0)}
                  </div>
                  <div className="text-sm text-red-600">دين متأخر</div>
                </div>

                <div className="debt-card bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl">
                      ⏳
                    </div>
                    <div>
                      <h3 className="font-bold text-yellow-800">ديون جارية</h3>
                      <p className="text-sm text-yellow-600">ضمن المدة</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-800 mb-2">
                    {formatCurrency(dashboardData.financial_summary?.outstanding_amount || 0)}
                  </div>
                  <div className="text-sm text-yellow-600">مبلغ مستحق</div>
                </div>

                <div className="debt-card bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                      ✅
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800">ديون محصلة</h3>
                      <p className="text-sm text-green-600">تم السداد</p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-800 mb-2">
                    {formatCurrency(dashboardData.financial_summary?.settled_amount || 0)}
                  </div>
                  <div className="text-sm text-green-600">مبلغ محصل</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-content">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-purple-500">📈</span>
                التقارير المالية
              </h2>
              
              <div className="reports-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'تقرير الفواتير الشهري', icon: '📄', color: 'blue' },
                  { title: 'تقرير المدفوعات اليومي', icon: '💳', color: 'green' },
                  { title: 'تقرير الديون المتأخرة', icon: '⚠️', color: 'red' },
                  { title: 'تحليل التدفق النقدي', icon: '💰', color: 'purple' },
                  { title: 'تقرير طرق الدفع', icon: '📊', color: 'orange' },
                  { title: 'مقارنة الأداء الشهري', icon: '📈', color: 'teal' }
                ].map((report, index) => (
                  <button
                    key={index}
                    className={`report-card bg-gradient-to-br from-${report.color}-50 to-${report.color}-100 rounded-lg p-6 text-center hover:shadow-lg transition-shadow`}
                  >
                    <div className="text-4xl mb-4">{report.icon}</div>
                    <h3 className={`font-bold text-${report.color}-800 mb-2`}>{report.title}</h3>
                    <div className={`text-sm text-${report.color}-600`}>انقر للتحميل</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingDashboard;