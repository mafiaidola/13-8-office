// CRM Management Component - نظام إدارة العلاقات مع العملاء
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CRMManagement = ({ language = 'ar' }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState({});
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [searchFilters, setSearchFilters] = useState({
    status: '',
    priority: '',
    search_text: '',
    last_interaction_days: ''
  });

  // Get backend URL from environment
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // Load CRM dashboard
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/crm/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDashboard(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  // Search clients
  const searchClients = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      const params = new URLSearchParams();
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await axios.get(`${backendUrl}/api/crm/clients/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setClients(response.data.data.profiles || []);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [searchFilters, backendUrl]);

  // Load client interactions
  const loadClientInteractions = useCallback(async (clientId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/crm/interactions/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setInteractions(response.data.data.interactions || []);
      }
    } catch (error) {
      console.error('Error loading interactions:', error);
    }
  }, [backendUrl]);

  // Load client analytics
  const loadClientAnalytics = useCallback(async (clientId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/crm/analytics/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, [backendUrl]);

  // Load pending tasks
  const loadTasks = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/crm/tasks/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setTasks(response.data.data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [backendUrl]);

  // Create sample data for testing
  const createSampleData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${backendUrl}/api/crm/test/create-sample-data`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert(language === 'ar' ? 'تم إنشاء بيانات تجريبية بنجاح!' : 'Sample data created successfully!');
        loadDashboard();
        searchClients();
      }
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert(language === 'ar' ? 'خطأ في إنشاء البيانات التجريبية' : 'Error creating sample data');
    }
  };

  // Initialize
  useEffect(() => {
    loadDashboard();
    loadTasks();
    searchClients();
  }, [loadDashboard, loadTasks, searchClients]);

  // Handle client selection
  const handleClientSelect = (client) => {
    setSelectedClient(client);
    loadClientInteractions(client.clinic_id);
    loadClientAnalytics(client.clinic_id);
    setActiveTab('client-details');
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      vip: 'bg-purple-100 text-purple-800',
      strategic: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      lead: 'bg-yellow-100 text-yellow-800',
      prospect: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      lost: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.lead;
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US').format(num || 0);
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return language === 'ar' ? 'غير محدد' : 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'ar' ? '🤝 نظام إدارة العلاقات مع العملاء' : '🤝 CRM Management'}
        </h1>
        
        <div className="flex gap-2">
          <button
            onClick={createSampleData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            {language === 'ar' ? 'إنشاء بيانات تجريبية' : 'Create Sample Data'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { id: 'dashboard', name: language === 'ar' ? 'لوحة المعلومات' : 'Dashboard', icon: '📊' },
            { id: 'clients', name: language === 'ar' ? 'العملاء' : 'Clients', icon: '👥' },
            { id: 'tasks', name: language === 'ar' ? 'المهام' : 'Tasks', icon: '📋' },
            { id: 'client-details', name: language === 'ar' ? 'تفاصيل العميل' : 'Client Details', icon: '🔍' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </span>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'إجمالي العملاء' : 'Total Clients'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboard.total_clients)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'العملاء النشطون' : 'Active Clients'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboard.active_clients)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🆕</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'عملاء جدد هذا الشهر' : 'New This Month'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboard.new_clients_this_month)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-2xl">📋</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {language === 'ar' ? 'مهام معلقة' : 'Pending Tasks'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatNumber(dashboard.pending_follow_ups)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Clients */}
          {dashboard.top_clients && dashboard.top_clients.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {language === 'ar' ? '🏆 أفضل العملاء' : '🏆 Top Clients'}
              </h3>
              <div className="space-y-3">
                {dashboard.top_clients.map((client, index) => (
                  <div key={client.clinic_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{client.clinic_name}</p>
                        <p className="text-sm text-gray-500">
                          {language === 'ar' ? 'قيمة الطلبات:' : 'Order Value:'} {formatNumber(client.total_order_value)} {language === 'ar' ? 'ج.م' : 'EGP'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClientSelect({clinic_id: client.clinic_id, clinic_info: {name: client.clinic_name}})}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Search Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={searchFilters.status}
                  onChange={(e) => setSearchFilters(prev => ({...prev, status: e.target.value}))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
                  <option value="lead">{language === 'ar' ? 'عميل محتمل' : 'Lead'}</option>
                  <option value="prospect">{language === 'ar' ? 'احتمالية عالية' : 'Prospect'}</option>
                  <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                  <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'الأولوية' : 'Priority'}
                </label>
                <select
                  value={searchFilters.priority}
                  onChange={(e) => setSearchFilters(prev => ({...prev, priority: e.target.value}))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === 'ar' ? 'جميع الأولويات' : 'All Priorities'}</option>
                  <option value="low">{language === 'ar' ? 'منخفضة' : 'Low'}</option>
                  <option value="medium">{language === 'ar' ? 'متوسطة' : 'Medium'}</option>
                  <option value="high">{language === 'ar' ? 'عالية' : 'High'}</option>
                  <option value="vip">{language === 'ar' ? 'مميز' : 'VIP'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'البحث' : 'Search'}
                </label>
                <input
                  type="text"
                  value={searchFilters.search_text}
                  onChange={(e) => setSearchFilters(prev => ({...prev, search_text: e.target.value}))}
                  placeholder={language === 'ar' ? 'ابحث عن عيادة...' : 'Search for clinic...'}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={searchClients}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {language === 'ar' ? 'بحث' : 'Search'}
                </button>
              </div>
            </div>
          </div>

          {/* Clients List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.clinic_id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {client.clinic_info?.name || 'غير محدد'}
                  </h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                      {client.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(client.priority)}`}>
                      {client.priority}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{language === 'ar' ? 'العنوان:' : 'Address:'}</span> {client.clinic_info?.address || 'غير محدد'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{language === 'ar' ? 'الهاتف:' : 'Phone:'}</span> {client.clinic_info?.phone || 'غير محدد'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{language === 'ar' ? 'إجمالي الطلبات:' : 'Total Orders:'}</span> {formatNumber(client.total_orders)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{language === 'ar' ? 'قيمة الطلبات:' : 'Order Value:'}</span> {formatNumber(client.total_order_value)} {language === 'ar' ? 'ج.م' : 'EGP'}
                  </p>
                </div>

                <button
                  onClick={() => handleClientSelect(client)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {language === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                </button>
              </div>
            ))}
          </div>

          {clients.length === 0 && !loading && (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">👥</span>
              <p className="text-gray-500">
                {language === 'ar' ? 'لا توجد عملاء' : 'No clients found'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900">{task.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.is_overdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.is_overdue ? (language === 'ar' ? 'متأخر' : 'Overdue') : (language === 'ar' ? 'معلق' : 'Pending')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 mb-3">{task.description}</p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {language === 'ar' ? 'العميل:' : 'Client:'} {task.client_name}
                </span>
                <span>
                  {language === 'ar' ? 'الاستحقاق:' : 'Due:'} {formatDate(task.due_date)}
                </span>
              </div>
            </div>
          ))}

          {tasks.length === 0 && !loading && (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">📋</span>
              <p className="text-gray-500">
                {language === 'ar' ? 'لا توجد مهام معلقة' : 'No pending tasks'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client Details Tab */}
      {activeTab === 'client-details' && selectedClient && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedClient.clinic_info?.name || 'تفاصيل العميل'}
            </h2>

            {/* Analytics Summary */}
            {analytics.client_id && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">
                    {language === 'ar' ? 'إجمالي التفاعلات' : 'Total Interactions'}
                  </p>
                  <p className="text-2xl font-bold text-blue-800">{analytics.total_interactions}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">
                    {language === 'ar' ? 'معدل نجاح الزيارات' : 'Visit Success Rate'}
                  </p>
                  <p className="text-2xl font-bold text-green-800">{analytics.visit_success_rate?.toFixed(1)}%</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">
                    {language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
                  </p>
                  <p className="text-2xl font-bold text-purple-800">{analytics.total_orders}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">
                    {language === 'ar' ? 'نقاط الصحة' : 'Health Score'}
                  </p>
                  <p className="text-2xl font-bold text-orange-800">{analytics.health_score?.toFixed(0)}/100</p>
                </div>
              </div>
            )}

            {/* Recent Interactions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {language === 'ar' ? '📋 التفاعلات الأخيرة' : '📋 Recent Interactions'}
              </h3>
              <div className="space-y-3">
                {interactions.slice(0, 5).map((interaction) => (
                  <div key={interaction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">{interaction.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        interaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {interaction.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{interaction.description}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{interaction.interaction_type}</span>
                      <span>{formatDate(interaction.scheduled_date)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {interactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  {language === 'ar' ? 'لا توجد تفاعلات' : 'No interactions found'}
                </p>
              )}
            </div>

            {/* Recommendations */}
            {analytics.recommendations && analytics.recommendations.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {language === 'ar' ? '💡 التوصيات' : '💡 Recommendations'}
                </h3>
                <div className="space-y-2">
                  {analytics.recommendations.map((recommendation, index) => (
                    <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800 text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CRMManagement;