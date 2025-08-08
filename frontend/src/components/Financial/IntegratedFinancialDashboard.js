// نظام الإدارة الطبية المتكامل - لوحة التحكم المالية المتكاملة
// Medical Management System - Integrated Financial Dashboard

import React, { useState, useEffect } from 'react';

const IntegratedFinancialDashboard = ({ user, language = 'ar' }) => {
  const [loading, setLoading] = useState(true);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [agingAnalysis, setAgingAnalysis] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [error, setError] = useState('');

  // النصوص متعددة اللغات
  const texts = {
    ar: {
      title: 'لوحة التحكم المالية المتكاملة',
      overview: 'نظرة عامة',
      invoices: 'الفواتير',
      debts: 'الديون والمديونيات',
      payments: 'المدفوعات',
      reports: 'التقارير المالية',
      totalInvoiced: 'إجمالي المفوتر',
      totalCollected: 'إجمالي المحصل',
      totalOutstanding: 'إجمالي المتبقي',
      collectionRate: 'معدل التحصيل',
      agingAnalysis: 'تحليل تقادم الديون',
      highRiskClients: 'عملاء عالي المخاطر',
      recentActivity: 'النشاط الحديث',
      thisMonth: 'هذا الشهر',
      thisWeek: 'هذا الأسبوع',
      today: 'اليوم',
      currency: 'ج.م',
      viewDetails: 'عرض التفاصيل',
      createInvoice: 'إنشاء فاتورة جديدة',
      processPayment: 'تسجيل دفعة',
      generateReport: 'إنشاء تقرير',
      current: 'حالي',
      days30: '30 يوم',
      days60: '60 يوم',
      days90: '90 يوم',
      over90: 'أكثر من 90 يوم',
      riskLevel: 'مستوى المخاطرة',
      low: 'منخفض',
      medium: 'متوسط',
      high: 'عالي',
      critical: 'حرج'
    },
    en: {
      title: 'Integrated Financial Dashboard',
      overview: 'Overview',
      invoices: 'Invoices',
      debts: 'Debts & Collections',
      payments: 'Payments',
      reports: 'Financial Reports',
      totalInvoiced: 'Total Invoiced',
      totalCollected: 'Total Collected',
      totalOutstanding: 'Total Outstanding',
      collectionRate: 'Collection Rate',
      agingAnalysis: 'Aging Analysis',
      highRiskClients: 'High Risk Clients',
      recentActivity: 'Recent Activity',
      thisMonth: 'This Month',
      thisWeek: 'This Week',
      today: 'Today',
      currency: 'EGP',
      viewDetails: 'View Details',
      createInvoice: 'Create Invoice',
      processPayment: 'Process Payment',
      generateReport: 'Generate Report',
      current: 'Current',
      days30: '30 Days',
      days60: '60 Days',
      days90: '90 Days',
      over90: 'Over 90 Days',
      riskLevel: 'Risk Level',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Critical'
    }
  };

  const t = texts[language];

  useEffect(() => {
    loadFinancialOverview();
  }, [selectedPeriod]);

  const loadFinancialOverview = async () => {
    try {
      setLoading(true);
      
      // استخدام fetch بدلاً من axios
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('لم يتم العثور على رمز الدخول');
        setLoading(false);
        return;
      }
      
      // جلب النظرة العامة
      const overviewResponse = await fetch(`${backendUrl}/api/financial/dashboard/financial-overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (overviewResponse.ok) {
        const overviewData = await overviewResponse.json();
        setFinancialOverview(overviewData);
        
        // جلب تحليل التقادم
        const agingResponse = await fetch(`${backendUrl}/api/financial/reports/aging-analysis`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (agingResponse.ok) {
          const agingData = await agingResponse.json();
          setAgingAnalysis(Array.isArray(agingData) ? agingData : []);
        }
      } else {
        setError('خطأ في تحميل البيانات المالية');
      }
      
      setError('');
    } catch (err) {
      console.error('Error loading financial overview:', err);
      setError('خطأ في تحميل البيانات المالية');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      low: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100', 
      high: 'text-orange-600 bg-orange-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[riskLevel] || colors.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-lg">جاري تحميل البيانات المالية...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <div className="flex items-center">
          <span className="text-xl ml-2">⚠️</span>
          <span>{error}</span>
        </div>
        <button 
          onClick={loadFinancialOverview}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان وأزرار الفترة */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="flex space-x-2">
          {['today', 'week', 'month'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t[period === 'week' ? 'thisWeek' : period === 'month' ? 'thisMonth' : 'today']}
            </button>
          ))}
        </div>
      </div>

      {/* البطاقات المالية الرئيسية */}
      {financialOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">{t.totalInvoiced}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financialOverview.monthly_summary?.total_invoices_amount?.amount || 0)}
                </p>
                <p className="text-blue-100 text-xs">{t.currency}</p>
              </div>
              <div className="text-4xl opacity-80">📄</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">{t.totalCollected}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financialOverview.monthly_summary?.total_payments_amount?.amount || 0)}
                </p>
                <p className="text-green-100 text-xs">{t.currency}</p>
              </div>
              <div className="text-4xl opacity-80">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">{t.totalOutstanding}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financialOverview.aging_overview?.total_outstanding || 0)}
                </p>
                <p className="text-orange-100 text-xs">{t.currency}</p>
              </div>
              <div className="text-4xl opacity-80">⏰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">{t.collectionRate}</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(financialOverview.monthly_summary?.collection_rate || 0)}%
                </p>
                <p className="text-purple-100 text-xs">معدل</p>
              </div>
              <div className="text-4xl opacity-80">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* أزرار العمليات السريعة */}
      <div className="flex flex-wrap gap-4">
        <button className="flex-1 min-w-48 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <span className="text-lg ml-2">➕</span>
          {t.createInvoice}
        </button>
        <button className="flex-1 min-w-48 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <span className="text-lg ml-2">💳</span>
          {t.processPayment}
        </button>
        <button className="flex-1 min-w-48 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          <span className="text-lg ml-2">📋</span>
          {t.generateReport}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تحليل تقادم الديون */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl ml-3">📈</span>
            {t.agingAnalysis}
          </h3>
          
          <div className="space-y-3">
            {agingAnalysis.slice(0, 5).map((analysis, index) => (
              <div key={analysis.clinic_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {analysis.clinic_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    المتبقي: {formatCurrency(analysis.total_outstanding?.amount || 0)} {t.currency}
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRiskLevelColor(analysis.risk_level)}`}>
                      {t[analysis.risk_level] || analysis.risk_level}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>{t.current}: {formatCurrency(analysis.current?.amount || 0)}</div>
                    <div>{t.days30}: {formatCurrency(analysis.days_30?.amount || 0)}</div>
                    <div>{t.over90}: {formatCurrency(analysis.over_90?.amount || 0)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {agingAnalysis.length > 5 && (
            <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              عرض المزيد ({agingAnalysis.length - 5} عميل إضافي)
            </button>
          )}
        </div>

        {/* العملاء عالي المخاطر */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl ml-3">⚠️</span>
            {t.highRiskClients}
          </h3>
          
          <div className="space-y-3">
            {financialOverview?.top_risk_clients?.filter(client => 
              client.risk_level === 'high' || client.risk_level === 'critical'
            ).slice(0, 5).map((client, index) => (
              <div key={client.clinic_id} className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {client.clinic_name}
                  </div>
                  <div className="text-sm text-red-600">
                    دين متأخر: {formatCurrency(client.over_90?.amount || 0)} {t.currency}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {client.recommended_action}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`px-3 py-1 text-sm rounded-full ${getRiskLevelColor(client.risk_level)}`}>
                    {t[client.risk_level] || client.risk_level}
                  </span>
                  <div className="text-sm text-gray-600 mt-2">
                    إجمالي: {formatCurrency(client.total_outstanding?.amount || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ملخص سريع */}
      {financialOverview?.aging_overview && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">ملخص الوضع المالي</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {financialOverview.monthly_summary?.total_invoices_count || 0}
              </div>
              <div className="text-sm text-gray-600">فاتورة هذا الشهر</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {financialOverview.monthly_summary?.total_payments_count || 0}
              </div>
              <div className="text-sm text-gray-600">عملية دفع</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {financialOverview.aging_overview?.total_clients_with_debts || 0}
              </div>
              <div className="text-sm text-gray-600">عميل لديه ديون</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {financialOverview.aging_overview?.high_risk_clients_count || 0}
              </div>
              <div className="text-sm text-gray-600">عميل عالي المخاطر</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegratedFinancialDashboard;