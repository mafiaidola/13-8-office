// Dashboard Widget Component - مكون ويدجت لوحة التحكم
import React from 'react';

const DashboardWidget = ({ title, type, data, className = '' }) => {
  const renderContent = () => {
    switch (type) {
      case 'pie_chart':
        return renderPieChart();
      case 'bar_chart':
        return renderBarChart();
      case 'system_health':
        return renderSystemHealth();
      case 'list':
        return renderList();
      default:
        return <div className="text-center text-gray-500">نوع الويدجت غير مدعوم</div>;
    }
  };

  const renderPieChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">لا توجد بيانات للعرض</p>
        </div>
      );
    }

    return (
      <div className="pie-chart-widget">
        <div className="grid grid-cols-1 gap-4">
          {data.map((item, index) => (
            <div key={item._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className={`w-4 h-4 rounded-full`}
                  style={{ backgroundColor: getColorByIndex(index) }}
                ></div>
                <span className="font-medium">{getRoleLabel(item._id)}</span>
              </div>
              <span className="text-lg font-bold text-gray-800">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-gray-500">لا توجد بيانات للعرض</p>
        </div>
      );
    }

    const maxCount = Math.max(...data.map(item => item.count));

    return (
      <div className="bar-chart-widget space-y-3">
        {data.map((item, index) => (
          <div key={item._id || index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{getClassificationLabel(item._id)}</span>
              <span className="text-gray-600">{item.count}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500`}
                style={{ 
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: getColorByIndex(index)
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSystemHealth = () => {
    const healthData = data || {};
    const isHealthy = healthData.database_health === 'healthy';

    return (
      <div className="system-health-widget space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">حالة قاعدة البيانات</span>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isHealthy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isHealthy ? '✅ سليمة' : '❌ خطأ'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">المستخدمين النشطين:</span>
              <span className="font-bold">{healthData.active_users || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">متصل حديثاً:</span>
              <span className="font-bold">{healthData.recent_users || 0}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">وقت التشغيل:</span>
              <span className="font-bold text-green-600">{healthData.system_uptime || '99.9%'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">آخر نسخة احتياطية:</span>
              <span className="font-bold text-blue-600">اليوم</span>
            </div>
          </div>
        </div>

        {healthData.total_records && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">إحصائيات قاعدة البيانات:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(healthData.total_records).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-500">{getTableLabel(key)}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderList = () => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-gray-500">لا توجد عناصر للعرض</p>
        </div>
      );
    }

    return (
      <div className="list-widget space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="font-medium">{item.title || item.name || 'عنصر'}</span>
            <span className="text-sm text-gray-600">{item.value || item.count || ''}</span>
          </div>
        ))}
      </div>
    );
  };

  // Helper functions
  const getColorByIndex = (index) => {
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#8B5CF6', // purple
      '#F59E0B', // orange
      '#EF4444', // red
      '#14B8A6', // teal
      '#6366F1', // indigo
      '#F97316', // amber
    ];
    return colors[index % colors.length];
  };

  const getRoleLabel = (role) => {
    const roleLabels = {
      'admin': 'مدير النظام',
      'gm': 'مدير عام',
      'line_manager': 'مدير خط',
      'area_manager': 'مدير منطقة',
      'medical_rep': 'مندوب طبي',
      'accounting': 'محاسب',
      'finance': 'مالية'
    };
    return roleLabels[role] || role;
  };

  const getClassificationLabel = (classification) => {
    const classificationLabels = {
      'class_a_star': 'فئة أ نجمة',
      'class_a': 'فئة أ',
      'class_b': 'فئة ب',
      'class_c': 'فئة ج',
      'class_d': 'فئة د'
    };
    return classificationLabels[classification] || classification;
  };

  const getTableLabel = (table) => {
    const tableLabels = {
      'users': 'المستخدمين',
      'clinics': 'العيادات',
      'orders': 'الطلبات',
      'visits': 'الزيارات',
      'debts': 'الديون',
      'payments': 'المدفوعات'
    };
    return tableLabels[table] || table;
  };

  return (
    <div className={`dashboard-widget bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
      
      <div className="widget-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardWidget;