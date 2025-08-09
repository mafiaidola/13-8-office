// Role-Based Dashboard Component - لوحة التحكم المخصصة للأدوار
import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import GMDashboard from './GMDashboard';
import MedicalRepDashboard from './MedicalRepDashboard';
import AccountingDashboard from './AccountingDashboard';
import ManagerDashboard from './ManagerDashboard';
import SalesRepresentativeDashboard from './SalesRepresentativeDashboard';
import MedicalRepresentativeDashboard from './MedicalRepresentativeDashboard';

const RoleBasedDashboard = ({ user, language = 'ar', isRTL = true }) => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // تحديد نوع لوحة التحكم حسب دور المستخدم
  const getDashboardType = (userRole) => {
    const roleMapping = {
      'admin': 'admin',
      'gm': 'gm', 
      'line_manager': 'line_manager',
      'area_manager': 'area_manager',
      'district_manager': 'manager',
      'medical_rep': 'medical_rep',
      'medical_representative': 'medical_representative',
      'sales_rep': 'sales_rep',
      'key_account': 'sales_rep',
      'accounting': 'accounting',
      'finance': 'finance'
    };
    return roleMapping[userRole?.toLowerCase()] || 'medical_rep';
  };

  const dashboardType = getDashboardType(user?.role);

  // تحميل بيانات لوحة التحكم
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('يرجى تسجيل الدخول مرة أخرى');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/dashboard/stats/${dashboardType}?time_filter=${timeFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
      setError(null);
      
      console.log(`✅ تم تحميل بيانات لوحة التحكم للدور: ${dashboardType}`, data);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل بيانات لوحة التحكم:', error);
      setError(`خطأ في تحميل البيانات: ${error.message}`);
      
      // في حالة الخطأ، استخدام بيانات افتراضية فارغة
      setDashboardData({
        total_users: 0,
        total_clinics: 0,
        total_products: 0,
        orders_in_period: 0,
        visits_in_period: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role) {
      loadDashboardData();
    }
  }, [user?.role, timeFilter, dashboardType]);

  // معالج تغيير المرشح الزمني
  const handleTimeFilterChange = (newFilter) => {
    setTimeFilter(newFilter);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl text-red-500">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              خطأ في تحميل لوحة التحكم
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // الـ props المشتركة لجميع أنواع لوحات التحكم
  const commonProps = {
    user,
    language,
    isRTL,
    dashboardData,
    timeFilter,
    onTimeFilterChange: handleTimeFilterChange,
    onRefresh: loadDashboardData
  };

  // عرض لوحة التحكم المناسبة حسب الدور
  switch (dashboardType) {
    case 'admin':
      return <AdminDashboard {...commonProps} />;
    
    case 'gm':
      return <GMDashboard {...commonProps} />;
    
    case 'medical_rep':
      return <MedicalRepDashboard {...commonProps} />;
    
    case 'medical_representative':
      return <MedicalRepresentativeDashboard {...commonProps} />;
    
    case 'sales_rep':
      return <SalesRepresentativeDashboard {...commonProps} />;
    
    case 'accounting':
    case 'finance':
      return <AccountingDashboard {...commonProps} />;
    
    case 'line_manager':
    case 'area_manager':
    case 'manager':
      return <ManagerDashboard {...commonProps} />;
    
    default:
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-6">
          <div className="flex items-center">
            <span className="text-2xl text-yellow-500 mr-3">⚠️</span>
            <div>
              <h3 className="text-lg font-medium text-yellow-800">
                دور المستخدم غير مدعوم
              </h3>
              <p className="text-yellow-700 mt-1">
                الدور "{user?.role}" غير مدعوم حالياً في لوحة التحكم
              </p>
            </div>
          </div>
        </div>
      );
  }
};

export default RoleBasedDashboard;