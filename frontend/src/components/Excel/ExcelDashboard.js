import React, { useState, useEffect } from 'react';
import ExcelManager from './ExcelManager';
import axios from 'axios';

const ExcelDashboard = ({ user, language, isRTL }) => {
  const [stats, setStats] = useState({
    clinics: 0,
    users: 0,
    orders: 0,
    debts: 0,
    payments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // جلب إحصائيات سريعة من النظام
      const [clinicsRes, usersRes] = await Promise.allSettled([
        axios.get(`${backendUrl}/api/clinics`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${backendUrl}/api/users`, { headers }).catch(() => ({ data: [] }))
      ]);

      setStats({
        clinics: clinicsRes.status === 'fulfilled' ? (Array.isArray(clinicsRes.value?.data) ? clinicsRes.value.data.length : 0) : 0,
        users: usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value?.data) ? usersRes.value.data.length : 0) : 0,
        orders: 0, // يمكن إضافتها لاحقاً
        debts: 0,  // يمكن إضافتها لاحقاً
        payments: 0 // يمكن إضافتها لاحقاً
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportComplete = (result) => {
    console.log('Import completed:', result);
    // إعادة تحميل الإحصائيات بعد الاستيراد
    loadStats();
    
    // إظهار إشعار نجاح
    alert(`✅ تم استيراد ${result.imported_count} عنصر من ${result.data_type} بنجاح!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>جاري تحميل لوحة تحكم Excel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="excel-dashboard-container p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
          <span className="text-4xl text-white">📊</span>
        </div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          مركز إدارة Excel
        </h1>
        <p className="text-lg opacity-75 max-w-2xl mx-auto">
          تصدير واستيراد جميع بيانات النظام بصيغة Excel مع إمكانية الاختيار بين الإضافة أو الاستبدال
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">🏥</div>
          <div className="text-2xl font-bold">{stats.clinics.toLocaleString('ar-EG')}</div>
          <div className="text-sm opacity-75">العيادات</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats.users.toLocaleString('ar-EG')}</div>
          <div className="text-sm opacity-75">المستخدمين</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">📋</div>
          <div className="text-2xl font-bold">{stats.orders.toLocaleString('ar-EG')}</div>
          <div className="text-sm opacity-75">الطلبات</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-2xl font-bold">{stats.debts.toLocaleString('ar-EG')}</div>
          <div className="text-sm opacity-75">المديونية</div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 text-center">
          <div className="text-2xl mb-2">💳</div>
          <div className="text-2xl font-bold">{stats.payments.toLocaleString('ar-EG')}</div>
          <div className="text-sm opacity-75">التحصيل</div>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-3xl">ℹ️</div>
          <div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">كيفية استخدام نظام Excel</h3>
            <ul className="text-blue-700 space-y-2 text-sm">
              <li><strong>📊 التصدير:</strong> قم بتحميل جميع البيانات الحالية من النظام بصيغة Excel</li>
              <li><strong>📝 مثال للاستيراد:</strong> قم بتحميل ملف Excel فارغ مع الأعمدة المطلوبة كمثال</li>
              <li><strong>📥 الاستيراد:</strong> قم برفع ملف Excel مع البيانات واختيار طريقة الاستيراد:</li>
              <li className="mr-4">• <strong>الإضافة:</strong> إضافة البيانات الجديدة مع الاحتفاظ بالحالية</li>
              <li className="mr-4">• <strong>الاستبدال:</strong> حذف جميع البيانات الحالية واستبدالها بالجديدة</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Excel Managers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinics Excel Manager */}
        <ExcelManager
          dataType="clinics"
          title="العيادات"
          icon="🏥"
          onImportComplete={handleImportComplete}
        />

        {/* Users Excel Manager */}
        <ExcelManager
          dataType="users"
          title="المستخدمين"
          icon="👥"
          onImportComplete={handleImportComplete}
        />

        {/* Orders Excel Manager */}
        <ExcelManager
          dataType="orders"
          title="الطلبات"
          icon="📋"
          onImportComplete={handleImportComplete}
        />

        {/* Debts Excel Manager */}
        <ExcelManager
          dataType="debts"
          title="المديونية"
          icon="💰"
          onImportComplete={handleImportComplete}
        />

        {/* Payments Excel Manager */}
        <ExcelManager
          dataType="payments"
          title="التحصيل"
          icon="💳"
          onImportComplete={handleImportComplete}
        />

        {/* General Data Backup Card */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">💾</span>
            <div>
              <h3 className="text-xl font-bold">نسخة احتياطية شاملة</h3>
              <p className="text-sm opacity-75">تصدير جميع البيانات دفعة واحدة</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              onClick={() => alert('ميزة قيد التطوير...')}
            >
              <span className="ml-2">📤</span>
              تصدير نسخة احتياطية كاملة
            </button>
            
            <button 
              className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              onClick={() => alert('ميزة قيد التطوير...')}
            >
              <span className="ml-2">📥</span>
              استرجاع من نسخة احتياطية
            </button>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
        <div className="text-red-600 font-bold mb-2">⚠️ تحذير مهم</div>
        <p className="text-red-700 text-sm">
          عند اختيار "استبدال جميع البيانات" سيتم حذف جميع البيانات الحالية نهائياً. 
          يُنصح بأخذ نسخة احتياطية قبل القيام بأي عملية استبدال.
        </p>
      </div>
    </div>
  );
};

export default ExcelDashboard;