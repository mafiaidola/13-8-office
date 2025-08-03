// Clinic Mini Profile Component - الملف التعريفي المصغر للعيادة
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import axios from 'axios';

const ClinicMiniProfile = ({ clinic, onClose, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profileData, setProfileData] = useState({
    orders: [],
    debts: [],
    visits: [],
    payments: []
  });
  const [loading, setLoading] = useState(true);
  
  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  useEffect(() => {
    if (clinic?.id) {
      fetchClinicProfile();
    }
  }, [clinic?.id]);

  const fetchClinicProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Mock data for clinic profile
      setProfileData({
        orders: [
          {
            id: 'order-001',
            order_number: 'ORD-2024-001',
            date: '2024-02-01T10:30:00Z',
            total_amount: 1250.00,
            status: 'delivered',
            items_count: 5,
            rep_name: 'محمد علي أحمد'
          },
          {
            id: 'order-002',
            order_number: 'ORD-2024-002',
            date: '2024-01-28T14:15:00Z',
            total_amount: 850.00,
            status: 'pending',
            items_count: 3,
            rep_name: 'سارة محمود'
          },
          {
            id: 'order-003',
            order_number: 'ORD-2024-003',
            date: '2024-01-25T09:45:00Z',
            total_amount: 650.00,
            status: 'cancelled',
            items_count: 2,
            rep_name: 'أحمد حسام'
          }
        ],
        debts: [
          {
            id: 'debt-001',
            invoice_number: 'INV-2024-001',
            due_date: '2024-02-15T00:00:00Z',
            original_amount: 1250.00,
            paid_amount: 750.00,
            remaining_amount: 500.00,
            days_overdue: 0,
            status: 'partial'
          },
          {
            id: 'debt-002',
            invoice_number: 'INV-2024-002',
            due_date: '2024-01-30T00:00:00Z',
            original_amount: 850.00,
            paid_amount: 0.00,
            remaining_amount: 850.00,
            days_overdue: 5,
            status: 'overdue'
          }
        ],
        visits: [
          {
            id: 'visit-001',
            visit_date: '2024-02-01T09:30:00Z',
            rep_name: 'محمد علي أحمد',
            visit_type: 'routine',
            duration_minutes: 45,
            order_created: true,
            order_value: 1250.00,
            notes: 'زيارة روتينية، تم عرض المنتجات الجديدة'
          },
          {
            id: 'visit-002',
            visit_date: '2024-01-28T11:00:00Z',
            rep_name: 'سارة محمود',
            visit_type: 'follow_up',
            duration_minutes: 30,
            order_created: false,
            order_value: 0,
            notes: 'متابعة الطلب السابق'
          },
          {
            id: 'visit-003',
            visit_date: '2024-01-25T14:30:00Z',
            rep_name: 'أحمد حسام',
            visit_type: 'presentation',
            duration_minutes: 60,
            order_created: true,
            order_value: 650.00,
            notes: 'عرض منتجات جديدة للموسم'
          }
        ],
        payments: [
          {
            id: 'pay-001',
            payment_date: '2024-02-02T15:20:00Z',
            amount: 750.00,
            method: 'cash',
            invoice_number: 'INV-2024-001',
            reference: 'REF-001'
          },
          {
            id: 'pay-002',
            payment_date: '2024-01-20T10:30:00Z',
            amount: 1000.00,
            method: 'bank_transfer',
            invoice_number: 'INV-2023-025',
            reference: 'TRF-445'
          }
        ]
      });

    } catch (error) {
      console.error('خطأ في جلب بيانات العيادة:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToPDF = (section) => {
    let content = '';
    const clinicName = clinic.clinic_name || 'عيادة غير محددة';
    
    switch (section) {
      case 'orders':
        content = `
تقرير طلبات العيادة
====================

العيادة: ${clinicName}
الطبيب: ${clinic.doctor_name}
تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}

الطلبات:
--------
${profileData.orders.map((order, index) => `
${index + 1}. ${order.order_number}
   التاريخ: ${formatDate(order.date)}
   المبلغ: ${formatCurrency(order.total_amount)}
   عدد العناصر: ${order.items_count}
   المندوب: ${order.rep_name}
   الحالة: ${getOrderStatusLabel(order.status)}
`).join('\n')}

الإجمالي: ${profileData.orders.length} طلب
إجمالي القيمة: ${formatCurrency(calculateTotals().totalOrderValue)}
        `;
        break;
      case 'debts':
        content = `
تقرير مديونيات العيادة
=====================

العيادة: ${clinicName}
الطبيب: ${clinic.doctor_name}
تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}

المديونيات:
-----------
${profileData.debts.map((debt, index) => `
${index + 1}. ${debt.invoice_number}
   تاريخ الاستحقاق: ${formatDate(debt.due_date)}
   المبلغ الأصلي: ${formatCurrency(debt.original_amount)}
   المدفوع: ${formatCurrency(debt.paid_amount)}
   المتبقي: ${formatCurrency(debt.remaining_amount)}
   الحالة: ${debt.status === 'overdue' ? `متأخر ${debt.days_overdue} يوم` : debt.status}
`).join('\n')}

إجمالي المديونيات: ${formatCurrency(calculateTotals().totalDebt)}
        `;
        break;
      case 'visits':
        content = `
تقرير زيارات العيادة
===================

العيادة: ${clinicName}
الطبيب: ${clinic.doctor_name}
تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}

الزيارات:
---------
${profileData.visits.map((visit, index) => `
${index + 1}. ${formatDateTime(visit.visit_date)}
   المندوب: ${visit.rep_name}
   النوع: ${visit.visit_type === 'routine' ? 'روتينية' :
           visit.visit_type === 'follow_up' ? 'متابعة' :
           visit.visit_type === 'presentation' ? 'عرض منتجات' : visit.visit_type}
   المدة: ${visit.duration_minutes} دقيقة
   طلب: ${visit.order_created ? `تم - ${formatCurrency(visit.order_value)}` : 'لم يتم'}
   ${visit.notes ? `الملاحظات: ${visit.notes}` : ''}
`).join('\n')}

إجمالي الزيارات: ${calculateTotals().totalVisits}
        `;
        break;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${clinicName}_${section}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`تم تصدير تقرير ${section === 'orders' ? 'الطلبات' : section === 'debts' ? 'المديونيات' : 'الزيارات'} بنجاح!`);
  };

  const printSection = (section) => {
    const printWindow = window.open('', '_blank');
    const clinicName = clinic.clinic_name || 'عيادة غير محددة';
    
    let content = '';
    switch (section) {
      case 'orders':
        content = `
          <h2>تقرير طلبات العيادة</h2>
          <p><strong>العيادة:</strong> ${clinicName}</p>
          <p><strong>الطبيب:</strong> ${clinic.doctor_name}</p>
          <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>رقم الطلب</th>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>عدد العناصر</th>
              <th>المندوب</th>
              <th>الحالة</th>
            </tr>
            ${profileData.orders.map(order => `
              <tr>
                <td>${order.order_number}</td>
                <td>${formatDate(order.date)}</td>
                <td>${formatCurrency(order.total_amount)}</td>
                <td>${order.items_count}</td>
                <td>${order.rep_name}</td>
                <td>${getOrderStatusLabel(order.status)}</td>
              </tr>
            `).join('')}
          </table>
        `;
        break;
      case 'debts':
      case 'visits':
        content = `<h2>تقرير ${section === 'debts' ? 'المديونيات' : 'الزيارات'}</h2>`;
        break;
    }
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>${clinicName} - تقرير ${section}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const showOrderDetails = (order) => {
    const details = `
تفاصيل الطلب: ${order.order_number}

التاريخ: ${formatDate(order.date)}
المبلغ: ${formatCurrency(order.total_amount)}
عدد العناصر: ${order.items_count}
المندوب: ${order.rep_name}
حالة الطلب: ${getOrderStatusLabel(order.status)}

العيادة: ${clinic.clinic_name}
الطبيب: ${clinic.doctor_name}
    `;
    alert(details);
  };

  const showDebtDetails = (debt) => {
    const details = `
تفاصيل المديونية: ${debt.invoice_number}

تاريخ الاستحقاق: ${formatDate(debt.due_date)}
المبلغ الأصلي: ${formatCurrency(debt.original_amount)}
المبلغ المدفوع: ${formatCurrency(debt.paid_amount)}
المبلغ المتبقي: ${formatCurrency(debt.remaining_amount)}
الحالة: ${debt.status === 'overdue' ? `متأخر ${debt.days_overdue} يوم` : debt.status}

العيادة: ${clinic.clinic_name}
الطبيب: ${clinic.doctor_name}

${debt.status === 'overdue' ? 
  `⚠️ تنبيه: هذه المديونية متأخرة ${debt.days_overdue} يوم!` : 
  '✅ المديونية ضمن المدة المسموحة'}
    `;
    alert(details);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStatusLabel = (status) => {
    const labels = {
      'pending': 'معلق',
      'approved': 'معتمد',
      'delivered': 'تم التسليم',
      'cancelled': 'ملغي'
    };
    return labels[status] || status;
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-300',
      'approved': 'bg-blue-500/20 text-blue-300',
      'delivered': 'bg-green-500/20 text-green-300',
      'cancelled': 'bg-red-500/20 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const getDebtStatusColor = (status) => {
    const colors = {
      'paid': 'bg-green-500/20 text-green-300',
      'partial': 'bg-yellow-500/20 text-yellow-300',
      'pending': 'bg-blue-500/20 text-blue-300',
      'overdue': 'bg-red-500/20 text-red-300'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-300';
  };

  const calculateTotals = () => {
    const totalOrders = profileData.orders.length;
    const totalOrderValue = profileData.orders.reduce((sum, order) => sum + order.total_amount, 0);
    const totalDebt = profileData.debts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
    const totalVisits = profileData.visits.length;
    const totalPayments = profileData.payments.reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalOrders,
      totalOrderValue,
      totalDebt,
      totalVisits,
      totalPayments
    };
  };

  const totals = calculateTotals();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Clinic Info */}
      <div className="bg-white/5 rounded-xl p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">🏥</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold">{clinic.clinic_name}</h3>
            <p className="text-lg opacity-75">{clinic.doctor_name}</p>
            <p className="text-sm opacity-60">{clinic.specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 rounded text-xs ${clinic.classification ? 
                clinic.classification === 'A' ? 'bg-green-500/20 text-green-300' :
                clinic.classification === 'B' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'
              }`}>
                تصنيف {clinic.classification || 'غير محدد'}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                clinic.credit_status === 'good' ? 'bg-green-500/20 text-green-300' :
                clinic.credit_status === 'average' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-red-500/20 text-red-300'
              }`}>
                حالة ائتمانية: {clinic.credit_status === 'good' ? 'جيدة' : 
                              clinic.credit_status === 'average' ? 'متوسطة' : 'ضعيفة'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg">{totals.totalOrders}</div>
            <div className="opacity-75">إجمالي الطلبات</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-green-400">{formatCurrency(totals.totalOrderValue)}</div>
            <div className="opacity-75">قيمة الطلبات</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-red-400">{formatCurrency(totals.totalDebt)}</div>
            <div className="opacity-75">إجمالي المديونية</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{totals.totalVisits}</div>
            <div className="opacity-75">عدد الزيارات</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="font-medium">آخر طلب</div>
              <div className="text-sm opacity-75">
                {profileData.orders.length > 0 
                  ? `${profileData.orders[0].order_number} - ${formatCurrency(profileData.orders[0].total_amount)}`
                  : 'لا توجد طلبات'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <div className="font-medium">آخر زيارة</div>
              <div className="text-sm opacity-75">
                {profileData.visits.length > 0 
                  ? `${formatDate(profileData.visits[0].visit_date)} - ${profileData.visits[0].rep_name}`
                  : 'لا توجد زيارات'
                }
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-medium">آخر دفعة</div>
              <div className="text-sm opacity-75">
                {profileData.payments.length > 0 
                  ? `${formatDate(profileData.payments[0].payment_date)} - ${formatCurrency(profileData.payments[0].amount)}`
                  : 'لا توجد دفعات'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-4">
      {/* Orders Header with Export Options */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">طلبات العيادة ({profileData.orders.length})</h4>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('orders')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>📄</span>
            تصدير PDF
          </button>
          <button
            onClick={() => printSection('orders')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>🖨️</span>
            طباعة
          </button>
        </div>
      </div>
      
      {profileData.orders.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📦</div>
          <p className="text-gray-400">لا توجد طلبات</p>
        </div>
      ) : (
        profileData.orders.map(order => (
          <div 
            key={order.id} 
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => showOrderDetails(order)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-blue-400">{order.order_number}</div>
              <span className={`px-2 py-1 rounded text-xs ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="opacity-75">التاريخ:</div>
                <div>{formatDate(order.date)}</div>
              </div>
              <div>
                <div className="opacity-75">المبلغ:</div>
                <div className="font-medium">{formatCurrency(order.total_amount)}</div>
              </div>
              <div>
                <div className="opacity-75">عدد العناصر:</div>
                <div>{order.items_count}</div>
              </div>
              <div>
                <div className="opacity-75">المندوب:</div>
                <div>{order.rep_name}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-300 flex items-center gap-1">
              <span>👆</span>
              اضغط لعرض التفاصيل الكاملة
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDebts = () => (
    <div className="space-y-4">
      {/* Debts Header with Export Options */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">مديونيات العيادة ({profileData.debts.length})</h4>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('debts')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>📄</span>
            تصدير PDF
          </button>
          <button
            onClick={() => printSection('debts')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>🖨️</span>
            طباعة
          </button>
        </div>
      </div>
      
      {profileData.debts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💳</div>
          <p className="text-gray-400">لا توجد مديونيات</p>
        </div>
      ) : (
        profileData.debts.map(debt => (
          <div 
            key={debt.id} 
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => showDebtDetails(debt)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-orange-400">{debt.invoice_number}</div>
              <span className={`px-2 py-1 rounded text-xs ${getDebtStatusColor(debt.status)}`}>
                {debt.status === 'overdue' ? `متأخر ${debt.days_overdue} يوم` : debt.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="opacity-75">تاريخ الاستحقاق:</div>
                <div>{formatDate(debt.due_date)}</div>
              </div>
              <div>
                <div className="opacity-75">المبلغ الأصلي:</div>
                <div>{formatCurrency(debt.original_amount)}</div>
              </div>
              <div>
                <div className="opacity-75">المبلغ المدفوع:</div>
                <div className="text-green-400">{formatCurrency(debt.paid_amount)}</div>
              </div>
              <div>
                <div className="opacity-75">المبلغ المتبقي:</div>
                <div className="text-red-400 font-medium">{formatCurrency(debt.remaining_amount)}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-orange-300 flex items-center gap-1">
              <span>👆</span>
              اضغط لعرض التفاصيل الكاملة والمحاسبة
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderVisits = () => (
    <div className="space-y-4">
      {/* Visits Header with Export Options */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">سجل زيارات العيادة ({profileData.visits.length})</h4>
        <div className="flex gap-2">
          <button
            onClick={() => exportToPDF('visits')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>📄</span>
            تصدير PDF
          </button>
          <button
            onClick={() => printSection('visits')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <span>🖨️</span>
            طباعة
          </button>
        </div>
      </div>
      
      {profileData.visits.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏥</div>
          <p className="text-gray-400">لا توجد زيارات</p>
        </div>
      ) : (
        profileData.visits.map(visit => (
          <div 
            key={visit.id} 
            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => showVisitDetails(visit)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{formatDateTime(visit.visit_date)}</div>
              <div className="text-sm">
                {visit.visit_type === 'routine' ? '📋 روتينية' :
                 visit.visit_type === 'follow_up' ? '🔄 متابعة' :
                 visit.visit_type === 'presentation' ? '📊 عرض منتجات' : visit.visit_type}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <div className="opacity-75">المندوب:</div>
                <div>{visit.rep_name}</div>
              </div>
              <div>
                <div className="opacity-75">المدة:</div>
                <div>{visit.duration_minutes} دقيقة</div>
              </div>
              <div>
                <div className="opacity-75">طلب:</div>
                <div className={visit.order_created ? 'text-green-400' : 'text-gray-400'}>
                  {visit.order_created 
                    ? `✅ تم - ${formatCurrency(visit.order_value)}`
                    : '❌ لم يتم'
                  }
                </div>
              </div>
            </div>
            {visit.notes && (
              <div className="text-sm opacity-75 bg-white/5 rounded p-2 mb-2">
                <div className="opacity-75 mb-1">ملاحظات:</div>
                <div>{visit.notes}</div>
              </div>
            )}
            <div className="mt-2 text-xs text-blue-300 flex items-center gap-1">
              <span>👆</span>
              اضغط لعرض التفاصيل الكاملة للزيارة
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>جاري تحميل ملف العيادة...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20">
        {/* Header */}
        <div className="sticky top-0 bg-white/10 backdrop-blur-lg border-b border-white/20 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">الملف التعريفي للعيادة</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10">
          <div className="flex overflow-x-auto">
            {[
              { id: 'overview', name: 'نظرة عامة', icon: '📊' },
              { id: 'orders', name: 'الطلبات', icon: '📦' },
              { id: 'debts', name: 'المديونيات', icon: '💳' },
              { id: 'visits', name: 'سجل الزيارات', icon: '🏥' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-300 border-b-2 border-blue-400 bg-white/5'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'orders' && renderOrders()}
          {activeTab === 'debts' && renderDebts()}
          {activeTab === 'visits' && renderVisits()}
        </div>
      </div>
    </div>
  );
};

export default ClinicMiniProfile;