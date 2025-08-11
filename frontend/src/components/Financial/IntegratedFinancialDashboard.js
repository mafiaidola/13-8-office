// Integrated Financial Dashboard - لوحة التحكم المالية المتكاملة (تم تحديثه لحل مشكلة Mixed Content)
import React, { useState, useEffect } from 'react';
import { useGlobalTranslation } from '../../localization/completeTranslations';

const IntegratedFinancialDashboard = ({ language = 'ar', theme = 'dark', user }) => {
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalDebts: 0,
    paidAmount: 0,
    pendingAmount: 0,
    invoices: [],
    debts: [],
    payments: []
  });
  const [loading, setLoading] = useState(false);

  const { t, tc, tm } = useGlobalTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'https://localhost:8001') + '/api';

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load all financial data
      const [invoicesRes, debtsRes, paymentsRes] = await Promise.all([
        fetch(`${API}/invoices`, { headers }),
        fetch(`${API}/debts`, { headers }),
        fetch(`${API}/payments`, { headers })
      ]);

      const invoices = invoicesRes.ok ? await invoicesRes.json() : [];
      const debts = debtsRes.ok ? await debtsRes.json() : [];
      const payments = paymentsRes.ok ? await paymentsRes.json() : [];

      // Calculate totals
      const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const totalDebts = debts.reduce((sum, debt) => sum + (debt.amount || 0), 0);
      const paidAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

      setFinancialData({
        totalRevenue,
        totalDebts,
        paidAmount,
        pendingAmount: totalDebts - paidAmount,
        invoices: invoices.slice(0, 10), // Show latest 10
        debts: debts.slice(0, 10),
        payments: payments.slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  return (
    <div className="integrated-financial-dashboard p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-2">
          <span className="text-green-600 ml-3 text-4xl">💰</span>
          النظام المالي المتكامل
        </h1>
        <p className="text-gray-600 text-lg">
          إدارة شاملة للأمور المالية - الفواتير والديون والمدفوعات
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-gray-600 text-lg">جاري تحميل البيانات المالية...</p>
        </div>
      ) : (
        <>
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.totalRevenue)}</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">إجمالي الديون</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.totalDebts)}</p>
                </div>
                <div className="text-3xl">💳</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">المبلغ المحصل</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.paidAmount)}</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">المبلغ المعلق</p>
                  <p className="text-2xl font-bold">{formatCurrency(financialData.pendingAmount)}</p>
                </div>
                <div className="text-3xl">⏳</div>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Invoices */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-green-600 ml-3 text-2xl">📄</span>
                  آخر الفواتير
                </h3>
              </div>
              <div className="p-4">
                {financialData.invoices.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد فواتير</p>
                ) : (
                  <div className="space-y-3">
                    {financialData.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                          <p className="text-gray-600 text-sm">{invoice.clinic_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(invoice.amount)}</p>
                          <p className="text-gray-500 text-sm">{invoice.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Debts */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-red-600 ml-3 text-2xl">💳</span>
                  آخر الديون
                </h3>
              </div>
              <div className="p-4">
                {financialData.debts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد ديون</p>
                ) : (
                  <div className="space-y-3">
                    {financialData.debts.map((debt) => (
                      <div key={debt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{debt.clinic_name}</p>
                          <p className="text-gray-600 text-sm">{debt.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{formatCurrency(debt.amount)}</p>
                          <p className="text-gray-500 text-sm">{debt.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="text-blue-600 ml-3 text-2xl">💰</span>
                  آخر المدفوعات
                </h3>
              </div>
              <div className="p-4">
                {financialData.payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">لا توجد مدفوعات</p>
                ) : (
                  <div className="space-y-3">
                    {financialData.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{payment.clinic_name}</p>
                          <p className="text-gray-600 text-sm">{payment.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blue-600">{formatCurrency(payment.amount)}</p>
                          <p className="text-gray-500 text-sm">{payment.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IntegratedFinancialDashboard;