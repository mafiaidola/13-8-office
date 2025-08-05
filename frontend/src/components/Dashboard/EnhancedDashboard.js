// Enhanced Admin Dashboard - لوحة تحكم الأدمن المحسنة والمترابطة
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EnhancedDashboard = ({ user, language = 'ar', isRTL = true, setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');
  const [dashboardData, setDashboardData] = useState({
    orders: { count: 0, total_amount: 0, pending: 0, completed: 0 },
    visits: { count: 0, successful: 0, pending: 0, success_rate: 0 },
    debts: { outstanding: 0, collected: 0, total_amount: 0 },
    collections: { today: 0, this_month: 0, total: 0 },
    users: { active: 0, total: 0 },
    products: { count: 0, low_stock: 0 },
    clinics: { active: 0, total: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);

  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';

  // Load dashboard data based on time filter
  const loadDashboardData = async () => {
    if (user?.role !== 'admin') {
      console.log('⚠️ Dashboard access restricted to admin users only');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { Authorization: `Bearer ${token}` };

      console.log(`📊 Loading dashboard data for timeframe: ${timeFilter}`);

      // Load multiple data sources in parallel
      const requests = [
        axios.get(`${API}/dashboard/stats?time_filter=${timeFilter}`, { headers }),
        axios.get(`${API}/orders?time_filter=${timeFilter}`, { headers }),
        axios.get(`${API}/visits?time_filter=${timeFilter}`, { headers }),
        axios.get(`${API}/debts?status=outstanding`, { headers }),
        axios.get(`${API}/payments?time_filter=${timeFilter}`, { headers }),
        axios.get(`${API}/users`, { headers }),
        axios.get(`${API}/products`, { headers }),
        axios.get(`${API}/clinics`, { headers })
      ];

      const responses = await Promise.allSettled(requests);
      
      // Process dashboard stats (from first request)
      let newDashboardData = { ...dashboardData };
      
      if (responses[0].status === 'fulfilled') {
        const statsData = responses[0].value.data;
        if (statsData) {
          newDashboardData = { ...statsData };
        }
      }

      // Process orders data
      if (responses[1].status === 'fulfilled') {
        const orders = responses[1].value.data || [];
        const orderStats = orders.reduce((acc, order) => {
          acc.count += 1;
          acc.total_amount += order.total_amount || 0;
          if (order.status === 'pending') acc.pending += 1;
          if (order.status === 'completed') acc.completed += 1;
          return acc;
        }, { count: 0, total_amount: 0, pending: 0, completed: 0 });
        
        newDashboardData.orders = orderStats;
      }

      // Process visits data
      if (responses[2].status === 'fulfilled') {
        const visits = responses[2].value.data || [];
        const visitStats = visits.reduce((acc, visit) => {
          acc.count += 1;
          if (visit.status === 'successful') acc.successful += 1;
          if (visit.status === 'pending') acc.pending += 1;
          return acc;
        }, { count: 0, successful: 0, pending: 0 });
        
        visitStats.success_rate = visitStats.count > 0 ? (visitStats.successful / visitStats.count) * 100 : 0;
        newDashboardData.visits = visitStats;
      }

      // Process debts data
      if (responses[3].status === 'fulfilled') {
        const debts = responses[3].value.data || [];
        const debtStats = debts.reduce((acc, debt) => {
          if (debt.status === 'outstanding') {
            acc.outstanding += 1;
            acc.total_amount += debt.remaining_amount || 0;
          }
          return acc;
        }, { outstanding: 0, total_amount: 0 });
        
        newDashboardData.debts = debtStats;
      }

      // Process payments data
      if (responses[4].status === 'fulfilled') {
        const payments = responses[4].value.data || [];
        const collectionStats = payments.reduce((acc, payment) => {
          acc.total += payment.payment_amount || 0;
          
          const paymentDate = new Date(payment.payment_date);
          const today = new Date();
          
          if (paymentDate.toDateString() === today.toDateString()) {
            acc.today += payment.payment_amount || 0;
          }
          
          if (paymentDate.getMonth() === today.getMonth() && 
              paymentDate.getFullYear() === today.getFullYear()) {
            acc.this_month += payment.payment_amount || 0;
          }
          
          return acc;
        }, { today: 0, this_month: 0, total: 0 });
        
        newDashboardData.collections = collectionStats;
      }

      // Process users data
      if (responses[5].status === 'fulfilled') {
        const users = responses[5].value.data || [];
        const userStats = users.reduce((acc, user) => {
          acc.total += 1;
          if (user.is_active !== false) acc.active += 1;
          return acc;
        }, { active: 0, total: 0 });
        
        newDashboardData.users = userStats;
      }

      // Process products data
      if (responses[6].status === 'fulfilled') {
        const products = responses[6].value.data || [];
        const productStats = products.reduce((acc, product) => {
          if (product.is_active !== false) {
            acc.count += 1;
            if ((product.current_stock || 0) <= (product.min_stock || 0)) {
              acc.low_stock += 1;
            }
          }
          return acc;
        }, { count: 0, low_stock: 0 });
        
        newDashboardData.products = productStats;
      }

      // Process clinics data
      if (responses[7].status === 'fulfilled') {
        const clinics = responses[7].value.data || [];
        const clinicStats = clinics.reduce((acc, clinic) => {
          acc.total += 1;
          if (clinic.is_active !== false) acc.active += 1;
          return acc;
        }, { active: 0, total: 0 });
        
        newDashboardData.clinics = clinicStats;
      }

      setDashboardData(newDashboardData);
      console.log('✅ Dashboard data loaded successfully:', newDashboardData);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      
      // If no real data, show zeros instead of mock data
      setDashboardData({
        orders: { count: 0, total_amount: 0, pending: 0, completed: 0 },
        visits: { count: 0, successful: 0, pending: 0, success_rate: 0 },
        debts: { outstanding: 0, collected: 0, total_amount: 0 },
        collections: { today: 0, this_month: 0, total: 0 },
        users: { active: 0, total: 0 },
        products: { count: 0, low_stock: 0 },
        clinics: { active: 0, total: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  // Load recent activities
  const loadRecentActivities = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // This would ideally come from an activity log API
      const activities = [
        {
          id: 1,
          type: 'order_created',
          description: 'تم إنشاء طلب جديد',
          user: 'أحمد محمد',
          timestamp: new Date().toISOString(),
          details: { order_id: 'ORD-001', amount: 1500 }
        },
        {
          id: 2,
          type: 'visit_completed',
          description: 'تم إكمال زيارة عيادة',
          user: 'فاطمة أحمد',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: { clinic_name: 'عيادة الأمل' }
        }
      ];
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setRecentActivities([]);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadRecentActivities();
  }, [timeFilter, user]);

  // Handle section click for detailed view
  const handleSectionClick = (sectionType, data) => {
    setSelectedSection({ type: sectionType, data });
    
    // Navigate to appropriate section
    switch (sectionType) {
      case 'orders':
        setActiveTab && setActiveTab('orders');
        break;
      case 'visits':
        setActiveTab && setActiveTab('visit_management');
        break;
      case 'debts':
        setActiveTab && setActiveTab('debt_collection');
        break;
      case 'users':
        setActiveTab && setActiveTab('users');
        break;
      case 'products':
        setActiveTab && setActiveTab('products');
        break;
      case 'clinics':
        setActiveTab && setActiveTab('clinics');
        break;
      default:
        break;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-EG').format(num || 0);
  };

  // Get time filter label
  const getTimeFilterLabel = (filter) => {
    const labels = {
      today: 'اليوم',
      week: 'هذا الأسبوع',
      month: 'هذا الشهر',
      year: 'هذا العام'
    };
    return labels[filter] || filter;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-xl font-bold text-red-800 mb-4">🚫 وصول محظور</h2>
          <p className="text-red-700">هذه اللوحة متاحة للأدمن فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Enhanced Header */}
      <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              مرحباً {user?.full_name || 'المدير'}
            </h1>
            <p className="text-blue-100 text-lg">
              لوحة التحكم الرئيسية - نظرة عامة شاملة
            </p>
          </div>
          
          {/* Time Filter - Now Functional */}
          <div className="flex items-center gap-3">
            <label className="text-blue-100 font-medium">الفترة الزمنية:</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 backdrop-blur-sm hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="today" className="text-gray-800">اليوم</option>
              <option value="week" className="text-gray-800">هذا الأسبوع</option>
              <option value="month" className="text-gray-800">هذا الشهر</option>
              <option value="year" className="text-gray-800">هذا العام</option>
            </select>
            
            <button
              onClick={() => loadDashboardData()}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              تحديث
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-blue-100">
          📊 عرض بيانات: {getTimeFilterLabel(timeFilter)} | آخر تحديث: {new Date().toLocaleString('ar-EG')}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="text-gray-700">جاري تحميل البيانات...</span>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      {!loading && (
        <>
          {/* Orders and Visits Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Orders Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📦</span>
                  الطلبيات
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleSectionClick('orders', dashboardData.orders)}
                    className="bg-green-50 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
                  >
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(dashboardData.orders.count)}
                    </div>
                    <div className="text-green-700 text-sm">إجمالي الطلبات</div>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(dashboardData.orders.total_amount)}
                    </div>
                    <div className="text-blue-700 text-sm">قيمة الطلبات</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(dashboardData.orders.pending)}
                    </div>
                    <div className="text-yellow-700 text-sm">طلبات معلقة</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(dashboardData.orders.completed)}
                    </div>
                    <div className="text-purple-700 text-sm">طلبات مكتملة</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visits Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>🚗</span>
                  الزيارات
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleSectionClick('visits', dashboardData.visits)}
                    className="bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(dashboardData.visits.count)}
                    </div>
                    <div className="text-blue-700 text-sm">إجمالي الزيارات</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(dashboardData.visits.successful)}
                    </div>
                    <div className="text-green-700 text-sm">زيارات ناجحة</div>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatNumber(dashboardData.visits.pending)}
                    </div>
                    <div className="text-orange-700 text-sm">زيارات معلقة</div>
                  </div>
                  
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-indigo-600">
                      {dashboardData.visits.success_rate.toFixed(1)}%
                    </div>
                    <div className="text-indigo-700 text-sm">معدل النجاح</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Debts and Collections Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Debts Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>⚠️</span>
                  المديونيات
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => handleSectionClick('debts', dashboardData.debts)}
                    className="bg-red-50 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
                  >
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(dashboardData.debts.outstanding)}
                    </div>
                    <div className="text-red-700 text-sm">ديون مستحقة</div>
                  </div>
                  
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-pink-600">
                      {formatCurrency(dashboardData.debts.total_amount)}
                    </div>
                    <div className="text-pink-700 text-sm">إجمالي المبلغ</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Collections Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>💰</span>
                  التحصيل
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatCurrency(dashboardData.collections.today)}
                    </div>
                    <div className="text-emerald-700 text-sm">تحصيل اليوم</div>
                  </div>
                  
                  <div className="bg-teal-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-teal-600">
                      {formatCurrency(dashboardData.collections.this_month)}
                    </div>
                    <div className="text-teal-700 text-sm">تحصيل الشهر</div>
                  </div>
                  
                  <div 
                    className="bg-green-50 rounded-lg p-4 col-span-2 cursor-pointer hover:bg-green-100 transition-colors"
                    onClick={() => handleSectionClick('collections', dashboardData.collections)}
                  >
                    <div className="text-3xl font-bold text-green-600">
                      {formatCurrency(dashboardData.collections.total)}
                    </div>
                    <div className="text-green-700">إجمالي التحصيل</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Enhanced with New Sections */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>⚡</span>
                الإجراءات السريعة
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                
                <button 
                  onClick={() => handleSectionClick('users', dashboardData.users)}
                  className="bg-blue-50 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">👥</div>
                  <div className="font-semibold text-blue-800">المستخدمين</div>
                  <div className="text-blue-600 text-sm">{formatNumber(dashboardData.users.active)}/{formatNumber(dashboardData.users.total)}</div>
                </button>

                <button 
                  onClick={() => handleSectionClick('products', dashboardData.products)}
                  className="bg-green-50 hover:bg-green-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📦</div>
                  <div className="font-semibold text-green-800">المنتجات</div>
                  <div className="text-green-600 text-sm">{formatNumber(dashboardData.products.count)} منتج</div>
                  {dashboardData.products.low_stock > 0 && (
                    <div className="text-red-500 text-xs">⚠️ {dashboardData.products.low_stock} نفد</div>
                  )}
                </button>

                <button 
                  onClick={() => handleSectionClick('clinics', dashboardData.clinics)}
                  className="bg-purple-50 hover:bg-purple-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏥</div>
                  <div className="font-semibold text-purple-800">العيادات</div>
                  <div className="text-purple-600 text-sm">{formatNumber(dashboardData.clinics.active)}/{formatNumber(dashboardData.clinics.total)}</div>
                </button>

                <button 
                  onClick={() => setActiveTab && setActiveTab('analytics')}
                  className="bg-orange-50 hover:bg-orange-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
                  <div className="font-semibold text-orange-800">التحليلات</div>
                  <div className="text-orange-600 text-sm">تقارير متقدمة</div>
                </button>

                <button 
                  onClick={() => setActiveTab && setActiveTab('warehouse')}
                  className="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏪</div>
                  <div className="font-semibold text-indigo-800">المخازن</div>
                  <div className="text-indigo-600 text-sm">إدارة المخزون</div>
                </button>

                <button 
                  onClick={() => setActiveTab && setActiveTab('system_management')}
                  className="bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-center transition-colors group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
                  <div className="font-semibold text-gray-800">الإعدادات</div>
                  <div className="text-gray-600 text-sm">إدارة النظام</div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="bg-gradient-to-r from-gray-500 to-slate-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📋</span>
                  الأنشطة الحديثة
                </h3>
                <button 
                  onClick={() => setActiveTab && setActiveTab('activity_tracking')}
                  className="text-white hover:text-gray-200 text-sm"
                >
                  عرض الكل ←
                </button>
              </div>
            </div>
            <div className="p-6">
              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{activity.type === 'order_created' ? '🛒' : '👨‍⚕️'}</div>
                        <div>
                          <div className="font-semibold text-gray-800">{activity.description}</div>
                          <div className="text-sm text-gray-600">بواسطة: {activity.user}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  لا توجد أنشطة حديثة
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EnhancedDashboard;