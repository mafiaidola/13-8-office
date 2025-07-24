import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Theme Context with Language Support
const ThemeContext = createContext();

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'en'; // English as default
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    // Apply theme to document element and body
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
    // Force theme variables update
    updateThemeVariables(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
    // Apply direction based on language
    document.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const updateThemeVariables = (currentTheme) => {
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.style.setProperty('--primary-bg', '#ffffff');
      root.style.setProperty('--secondary-bg', '#f8fafc');
      root.style.setProperty('--accent-bg', '#e2e8f0');
      root.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.95)');
      root.style.setProperty('--glass-bg', 'rgba(248, 250, 252, 0.8)');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-muted', '#64748b');
      root.style.setProperty('--gradient-dark', 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)');
    } else {
      root.style.setProperty('--primary-bg', '#0f172a');
      root.style.setProperty('--secondary-bg', '#1e293b');
      root.style.setProperty('--accent-bg', '#334155');
      root.style.setProperty('--card-bg', 'rgba(30, 41, 59, 0.95)');
      root.style.setProperty('--glass-bg', 'rgba(15, 23, 42, 0.8)');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-muted', '#94a3b8');
      root.style.setProperty('--gradient-dark', 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    updateThemeVariables(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      language, 
      setLanguage 
    }}>
      <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '🌙' : '☀️'}
      {theme === 'dark' ? 'داكن' : 'فاتح'}
    </button>
  );
};

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password
      });
      
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'حدث خطأ في تسجيل الدخول'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Component
// Enhanced Login Page with Logo Support
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState(null);
  const { login } = useAuth();

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings`);
      setSystemSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="floating">
          <div className="card-modern w-full max-w-md p-8 fade-in-up glass-effect">
            <div className="text-center mb-8">
              {/* Logo Section */}
              <div className="mb-6">
                {systemSettings?.logo_image ? (
                  <img 
                    src={systemSettings.logo_image} 
                    alt="شعار الشركة"
                    className="w-24 h-24 mx-auto rounded-full object-cover glow-pulse"
                  />
                ) : (
                  <div className="w-24 h-24 mx-auto card-gradient-orange rounded-full flex items-center justify-center glow-pulse">
                    <span className="text-4xl">🏥</span>
                  </div>
                )}
              </div>
              
              {/* Company Name */}
              <h1 className="text-4xl font-bold text-gradient mb-3">
                {systemSettings?.company_name || 'نظام إدارة المناديب'}
              </h1>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>منصة إدارة المناديب الطبية المتقدمة</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 form-modern">
              <div>
                <label>
                  <span className="text-shadow-glow">🧑‍💼 اسم المستخدم</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>

              <div>
                <label>
                  <span className="text-shadow-glow">🔒 كلمة المرور</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full focus-visible"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>

              {error && (
                <div className="alert-modern alert-error scale-in">
                  <span className="ml-2">⚠️</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري التحقق...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🚀</span>
                    <span>تسجيل الدخول</span>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="card-gradient-blue p-6 rounded-2xl text-center">
                <h3 className="font-bold mb-3 flex items-center justify-center gap-2">
                  <span>💡</span>
                  <span>بيانات التجربة</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">أدمن:</span>
                    <span>admin / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold">مندوب:</span>
                    <span>أنشئ من لوحة الأدمن</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Settings Component for Admin
const SystemSettings = () => {
  const [settings, setSettings] = useState({
    logo_image: '',
    company_name: 'نظام إدارة المناديب',
    primary_color: '#ff6b35',
    secondary_color: '#0ea5e9'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (error) {
      setError('خطأ في جلب الإعدادات');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSettings({...settings, logo_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="card-modern p-8 page-transition">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">⚙️</span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gradient">إعدادات النظام</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>تخصيص شكل ومظهر النظام</p>
            </div>
          </div>

          {error && (
            <div className="alert-modern alert-error mb-6 scale-in">
              <span className="ml-2">⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div className="alert-modern alert-success mb-6 scale-in">
              <span className="ml-2">✅</span>
              {success}
            </div>
          )}

          <div className="space-y-8 form-modern">
            {/* Logo Section */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <span>شعار الشركة</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    رفع شعار جديد
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="w-full p-4 border-2 border-dashed rounded-xl hover:border-orange-500 transition-colors"
                    style={{ 
                      background: 'var(--glass-bg)',
                      borderColor: 'var(--brand-orange)',
                      borderOpacity: 0.3
                    }}
                  />
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                    يُفضل أن يكون الشعار مربع الشكل وبحجم أقصى 5 ميجابايت
                  </p>
                </div>

                <div className="text-center">
                  <label className="block text-sm font-bold mb-2">
                    معاينة الشعار الحالي
                  </label>
                  {settings.logo_image ? (
                    <img 
                      src={settings.logo_image} 
                      alt="شعار الشركة"
                      className="w-32 h-32 mx-auto rounded-full object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 mx-auto card-gradient-orange rounded-full flex items-center justify-center">
                      <span className="text-4xl">🏥</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🏢</span>
                <span>معلومات الشركة</span>
              </h3>
              
              <div>
                <label className="block text-sm font-bold mb-2">
                  اسم الشركة
                </label>
                <input
                  type="text"
                  value={settings.company_name}
                  onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                  className="w-full"
                  placeholder="اسم الشركة أو المؤسسة"
                />
              </div>
            </div>

            {/* Color Theme */}
            <div className="card-modern p-6">  
              <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <span>ألوان النظام</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الأساسي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#ff6b35"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">
                    اللون الثانوي
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="w-16 h-12 rounded-lg border-2 cursor-pointer"
                      style={{ borderColor: 'var(--accent-bg)' }}
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings({...settings, secondary_color: e.target.value})}
                      className="flex-1"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="text-center">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-primary text-xl py-4 px-8 neon-glow"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                    <span>جاري الحفظ...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>💾</span>
                    <span>حفظ الإعدادات</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notifications Component
const NotificationsCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications(); // Refresh
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'SUCCESS': return '✅';
      case 'WARNING': return '⚠️';
      case 'ERROR': return '❌';
      case 'REMINDER': return '⏰';
      default: return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600';
      case 'WARNING': return 'text-orange-600';
      case 'ERROR': return 'text-red-600';
      case 'REMINDER': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-3 rounded-full hover:bg-opacity-10 hover:bg-white transition-colors"
        style={{ color: 'var(--text-primary)' }}
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto card-modern border shadow-lg z-50">
          <div className="p-4 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
              الإشعارات ({unreadCount} غير مقروءة)
            </h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>
                <span className="text-4xl block mb-2">📭</span>
                لا توجد إشعارات
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b cursor-pointer hover:bg-opacity-5 hover:bg-white transition-colors ${
                    !notification.is_read ? 'bg-blue-50 bg-opacity-10' : ''
                  }`}
                  style={{ borderColor: 'var(--accent-bg)' }}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-semibold ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.created_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 text-center border-t" style={{ borderColor: 'var(--accent-bg)' }}>
              <button 
                onClick={() => {
                  // Mark all as read
                  notifications.filter(n => !n.is_read).forEach(n => markAsRead(n.id));
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Chat System Component
const ChatSystem = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.filter(u => u.id !== user.id)); // Exclude current user
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createConversation = async () => {
    if (!selectedUserId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/conversations`, {
        participants: [selectedUserId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowNewChat(false);
      setSelectedUserId('');
      fetchConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const sendMessage = async (messageType = 'TEXT', messageData = null) => {
    if (!selectedConversation) return;
    
    const messagePayload = {
      message_type: messageType,
      ...(messageType === 'TEXT' ? { message_text: newMessage } : {}),
      ...(messageType === 'VOICE' ? { voice_note: messageData } : {})
    };

    if (messageType === 'TEXT' && !newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/conversations/${selectedConversation.id}/messages`, messagePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (messageType === 'TEXT') {
        setNewMessage('');
      }
      fetchMessages(selectedConversation.id);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendMessage('VOICE', base64Audio);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">💬</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">نظام المحادثات</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>تواصل مع المناديب والمديرين</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
          {/* Conversations List */}
          <div className="card-modern p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">المحادثات</h3>
              <button
                onClick={() => setShowNewChat(true)}
                className="btn-primary text-sm py-2 px-4"
              >
                + محادثة جديدة
              </button>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-80">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-orange-100 bg-opacity-20' : 'hover:bg-gray-100 hover:bg-opacity-10'
                  }`}
                >
                  <div className="font-semibold">{conv.participant_names?.join(', ')}</div>
                  <div className="text-sm text-gray-500 truncate">
                    {conv.last_message?.message_text || 'رسالة صوتية'}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conv.last_message_at).toLocaleTimeString('ar-EG')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 card-modern flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
                  <h3 className="font-bold">{selectedConversation.participant_names?.join(', ')}</h3>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user.id
                            ? 'bg-orange-500 text-white'
                            : 'glass-effect'
                        }`}
                      >
                        {message.message_type === 'TEXT' ? (
                          <p>{message.message_text}</p>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>🎵</span>
                            <audio controls className="w-32">
                              <source src={message.voice_note} type="audio/wav" />
                            </audio>
                          </div>
                        )}
                        <div className="text-xs opacity-75 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('ar-EG')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--accent-bg)' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 form-modern"
                    />
                    <button
                      onClick={() => sendMessage()}
                      className="btn-primary px-4"
                    >
                      📤
                    </button>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`px-4 py-2 rounded-lg ${isRecording ? 'bg-red-500 text-white' : 'btn-success'}`}
                    >
                      {isRecording ? '🛑' : '🎤'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-6xl block mb-4">💬</span>
                  <p>اختر محادثة للبدء</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-modern p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">محادثة جديدة</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">اختر مستخدم:</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full form-modern"
                >
                  <option value="">اختر مستخدم</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={createConversation}
                  className="btn-primary flex-1"
                >
                  بدء المحادثة
                </button>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="btn-warning flex-1"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Admin Statistics Dashboard
const AdminStatsDashboard = () => {
  const [stats, setStats] = useState({});
  const [weeklyComparison, setWeeklyComparison] = useState({});
  const [monthlyComparison, setMonthlyComparison] = useState({});
  const [activeManagers, setActiveManagers] = useState([]);
  const [activeSalesReps, setActiveSalesReps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all stats in parallel
      const [statsRes, usersRes, visitsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/visits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setStats(statsRes.data);
      
      // Calculate manager and sales rep statistics
      const users = usersRes.data;
      const visits = visitsRes.data;
      const orders = ordersRes.data || [];
      
      const managers = users.filter(u => u.role === 'manager');
      const salesReps = users.filter(u => u.role === 'sales_rep');
      
      // Enhanced manager stats
      const managerStats = managers.map(manager => {
        const managedReps = salesReps.filter(rep => rep.manager_id === manager.id);
        const managerOrders = orders.filter(order => 
          order.approved_by === manager.id || 
          managedReps.some(rep => rep.id === order.sales_rep_id)
        );
        const approvedOrders = managerOrders.filter(order => order.status === 'APPROVED');
        const teamVisits = visits.filter(visit => 
          managedReps.some(rep => rep.id === visit.sales_rep_id)
        );

        return {
          ...manager,
          team_size: managedReps.length,
          total_orders_managed: managerOrders.length,
          approved_orders: approvedOrders.length,
          approval_rate: managerOrders.length > 0 ? (approvedOrders.length / managerOrders.length * 100).toFixed(1) : 0,
          team_visits: teamVisits.length,
          is_active: teamVisits.some(visit => {
            const visitDate = new Date(visit.created_at);
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            return visitDate > oneWeekAgo;
          })
        };
      });

      // Enhanced sales rep stats
      const salesRepStats = salesReps.map(rep => {
        const repVisits = visits.filter(visit => visit.sales_rep_id === rep.id);
        const repOrders = orders.filter(order => order.sales_rep_id === rep.id);
        const thisWeekVisits = repVisits.filter(visit => {
          const visitDate = new Date(visit.created_at);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return visitDate > oneWeekAgo;
        });

        return {
          ...rep,
          total_visits: repVisits.length,
          total_orders: repOrders.length,
          this_week_visits: thisWeekVisits.length,
          is_active: thisWeekVisits.length > 0,
          last_visit: repVisits.length > 0 ? repVisits[repVisits.length - 1].created_at : null
        };
      });

      setActiveManagers(managerStats);
      setActiveSalesReps(salesRepStats);
      
    } catch (error) {
      console.error('Error fetching enhanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 loading-shimmer rounded-full ml-4"></div>
          <div>
            <div className="w-48 h-8 loading-shimmer rounded mb-2"></div>
            <div className="w-64 h-4 loading-shimmer rounded"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="loading-shimmer h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-gradient">إحصائيات النظام الشاملة</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            نظرة شاملة على أداء النظام والفرق
          </p>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(stats).map(([key, value]) => {
          const statConfig = {
            total_users: { title: 'إجمالي المستخدمين', icon: '👥', color: 'text-blue-600', bg: 'bg-gradient-to-r from-blue-500 to-blue-600' },
            total_clinics: { title: 'إجمالي العيادات', icon: '🏥', color: 'text-green-600', bg: 'bg-gradient-to-r from-green-500 to-green-600' },
            total_doctors: { title: 'إجمالي الأطباء', icon: '⚕️', color: 'text-purple-600', bg: 'bg-gradient-to-r from-purple-500 to-purple-600' },
            total_visits: { title: 'إجمالي الزيارات', icon: '📋', color: 'text-indigo-600', bg: 'bg-gradient-to-r from-indigo-500 to-indigo-600' },
            total_products: { title: 'إجمالي المنتجات', icon: '📦', color: 'text-yellow-600', bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600' },
            total_warehouses: { title: 'إجمالي المخازن', icon: '🏭', color: 'text-pink-600', bg: 'bg-gradient-to-r from-pink-500 to-pink-600' },
            today_visits: { title: 'زيارات اليوم', icon: '📅', color: 'text-emerald-600', bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600' },
            pending_reviews: { title: 'مراجعات معلقة', icon: '⏳', color: 'text-orange-600', bg: 'bg-gradient-to-r from-orange-500 to-orange-600' }
          };
          
          const config = statConfig[key] || { title: key, icon: '📊', color: 'text-gray-600', bg: 'bg-gradient-to-r from-gray-500 to-gray-600' };
          
          return (
            <div key={key} className="card-modern p-6 interactive-element hover:scale-105 transition-transform">
              <div className="flex items-center mb-4">
                <div className={`w-14 h-14 ${config.bg} rounded-full flex items-center justify-center ml-4 shadow-lg`}>
                  <span className="text-2xl text-white">{config.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.color}`}>{value}</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${config.bg} h-2 rounded-full`} style={{ width: `${Math.min(100, (value / 100) * 100)}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Managers Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">👔</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المديرين</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>إحصائيات مفصلة عن أداء فريق الإدارة</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeManagers.map((manager) => (
            <div key={manager.id} className="glass-effect p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${manager.is_active ? 'bg-green-500' : 'bg-gray-400'}`}>
                    <span className="text-white font-bold">{manager.full_name.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold" style={{ color: 'var(--text-primary)' }}>{manager.full_name}</h4>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {manager.is_active ? '🟢 نشط' : '🔴 غير نشط'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-600">{manager.approval_rate}%</span>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>معدل الموافقة</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">{manager.team_size}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>حجم الفريق</div>
                </div>
                <div className="text-center p-3 bg-green-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{manager.approved_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات موافق عليها</div>
                </div>
                <div className="text-center p-3 bg-purple-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">{manager.total_orders_managed}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>إجمالي الطلبات</div>
                </div>
                <div className="text-center p-3 bg-orange-50 bg-opacity-10 rounded-lg">
                  <div className="text-xl font-bold text-orange-600">{manager.team_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات الفريق</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Reps Performance Section */}
      <div className="card-modern p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">🎯</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>أداء المناديب</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>المناديب النشطة والخاملة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="text-center p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => rep.is_active).length}
            </div>
            <div className="text-lg">مناديب نشطة</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white">
            <div className="text-4xl font-bold mb-2">
              {activeSalesReps.filter(rep => !rep.is_active).length}
            </div>
            <div className="text-lg">مناديب خاملة</div>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {activeSalesReps.map((rep) => (
            <div key={rep.id} className="flex items-center justify-between p-4 glass-effect rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${rep.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                  {rep.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{rep.full_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {rep.last_visit ? `آخر زيارة: ${new Date(rep.last_visit).toLocaleDateString('ar-EG')}` : 'لا توجد زيارات'}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-blue-600">{rep.total_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>زيارات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-green-600">{rep.total_orders}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>طلبات</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-purple-600">{rep.this_week_visits}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>هذا الأسبوع</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <span style={{ color: 'var(--text-primary)' }}>إجراءات سريعة</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn-primary p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-sm">تقرير شامل</div>
          </button>
          <button className="btn-success p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm">إضافة مستخدم</div>
          </button>
          <button className="btn-info p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">📢</div>
            <div className="text-sm">إرسال إشعار</div>
          </button>
          <button className="btn-warning p-4 text-center rounded-xl">
            <div className="text-2xl mb-2">⚙️</div>
            <div className="text-sm">إعدادات النظام</div>
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Visits Log Component
const EnhancedVisitsLog = () => {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterEffectiveness, setFilterEffectiveness] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchVisits();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [visits, searchTerm, filterStatus, filterEffectiveness, filterDate, sortBy, sortOrder]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits/comprehensive`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitDetails = async (visitId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits/${visitId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedVisit(response.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching visit details:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...visits];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(visit =>
        visit.sales_rep_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.clinic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visit.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Effectiveness filter
    if (filterEffectiveness !== 'all') {
      filtered = filtered.filter(visit => {
        if (filterEffectiveness === 'effective') return visit.is_effective === true;
        if (filterEffectiveness === 'ineffective') return visit.is_effective === false;
        if (filterEffectiveness === 'unreviewed') return visit.is_effective === null;
        return true;
      });
    }

    // Date filter
    if (filterDate !== 'all') {
      const now = new Date();
      const filterDate_ms = {
        'today': now.setHours(0,0,0,0),
        'week': now.getTime() - (7 * 24 * 60 * 60 * 1000),
        'month': now.getTime() - (30 * 24 * 60 * 60 * 1000)
      };
      
      if (filterDate_ms[filterDate]) {
        filtered = filtered.filter(visit => 
          new Date(visit.created_at).getTime() >= filterDate_ms[filterDate]
        );
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredVisits(filtered);
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <h2 className="text-4xl font-bold text-gradient">سجل الزيارات الشامل</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              جميع تفاصيل الزيارات والملاحظات والتقييمات
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">البحث:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث في المندوب، الطبيب، العيادة..."
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">الفعالية:</label>
              <select
                value={filterEffectiveness}
                onChange={(e) => setFilterEffectiveness(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الزيارات</option>
                <option value="effective">فعالة</option>
                <option value="ineffective">غير فعالة</option>
                <option value="unreviewed">لم يتم التقييم</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">التاريخ:</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع التواريخ</option>
                <option value="today">اليوم</option>
                <option value="week">هذا الأسبوع</option>
                <option value="month">هذا الشهر</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">ترتيب حسب:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-modern w-full"
              >
                <option value="created_at">التاريخ</option>
                <option value="sales_rep_name">المندوب</option>
                <option value="doctor_name">الطبيب</option>
                <option value="clinic_name">العيادة</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="btn-info flex-1 flex items-center justify-center gap-2"
              >
                {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                {sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{filteredVisits.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي الزيارات</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {filteredVisits.filter(v => v.is_effective === true).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات فعالة</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {filteredVisits.filter(v => v.voice_notes_count > 0).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات بملاحظات صوتية</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {filteredVisits.filter(v => v.orders_count > 0).length}
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>زيارات بطلبات</div>
          </div>
        </div>

        {/* Visits Table */}
        <div className="card-modern overflow-hidden">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>📋</span>
              <span>سجل الزيارات ({filteredVisits.length})</span>
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">التاريخ</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الطبيب/العيادة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الفعالية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المحتوى</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {new Date(visit.created_at).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(visit.created_at).toLocaleTimeString('ar-EG')}
                        </div>
                        {visit.duration_minutes && (
                          <div className="text-xs text-blue-600">
                            مدة الزيارة: {visit.duration_minutes} دقيقة
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {visit.sales_rep_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {visit.sales_rep_name}
                            </div>
                            {visit.sales_rep_phone && (
                              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {visit.sales_rep_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          د. {visit.doctor_name}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {visit.clinic_name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {visit.clinic_type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          visit.is_effective === true ? 'badge-success' :
                          visit.is_effective === false ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {getEffectivenessText(visit.is_effective)}
                        </span>
                        {visit.reviewed_by_name && (
                          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                            بواسطة: {visit.reviewed_by_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 text-xs">
                          {visit.voice_notes_count > 0 && (
                            <span className="badge-modern badge-info">
                              🎵 {visit.voice_notes_count} صوتي
                            </span>
                          )}
                          {visit.orders_count > 0 && (
                            <span className="badge-modern badge-success">
                              📦 {visit.orders_count} طلب
                            </span>
                          )}
                          {visit.doctor_rating && (
                            <span className="badge-modern badge-warning">
                              ⭐ {visit.doctor_rating}/5
                            </span>
                          )}
                        </div>
                        {visit.total_order_amount > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            إجمالي: {visit.total_order_amount} ج.م
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => fetchVisitDetails(visit.id)}
                          className="btn-primary text-xs px-3 py-1"
                        >
                          📄 التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visit Details Modal */}
        {showDetails && selectedVisit && (
          <VisitDetailsModal 
            visit={selectedVisit} 
            onClose={() => setShowDetails(false)} 
          />
        )}
      </div>
    </div>
  );
};

// Helper functions for visit effectiveness
const getEffectivenessColor = (effectiveness) => {
  if (effectiveness === true) return 'text-green-600';
  if (effectiveness === false) return 'text-red-600';
  return 'text-gray-500';
};

const getEffectivenessText = (effectiveness) => {
  if (effectiveness === true) return '✅ فعالة';
  if (effectiveness === false) return '❌ غير فعالة';
  return '⏳ لم يتم التقييم';
};

// Visit Details Modal Component
const VisitDetailsModal = ({ visit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="modal-modern p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gradient">تفاصيل الزيارة الشاملة</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>ℹ️</span>
              <span>معلومات أساسية</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">تاريخ الزيارة:</label>
                <p>{new Date(visit.created_at).toLocaleString('ar-EG')}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">مدة الزيارة:</label>
                <p>{visit.duration_minutes ? `${visit.duration_minutes} دقيقة` : 'غير محدد'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الفعالية:</label>
                <p className={getEffectivenessColor(visit.is_effective)}>
                  {getEffectivenessText(visit.is_effective)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">تقييم بواسطة:</label>
                <p>{visit.reviewed_by_name || 'لا يوجد'}</p>
              </div>
            </div>
          </div>

          {/* Sales Rep Details */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>👨‍💼</span>
              <span>تفاصيل المندوب</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">الاسم:</label>
                <p>{visit.sales_rep_details?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">رقم الموظف:</label>
                <p>{visit.sales_rep_details?.employee_id || 'غير محدد'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">البريد الإلكتروني:</label>
                <p>{visit.sales_rep_details?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الهاتف:</label>
                <p>{visit.sales_rep_details?.phone || 'غير محدد'}</p>
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚕️</span>
              <span>تفاصيل الطبيب</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">الاسم:</label>
                <p>د. {visit.doctor_details?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">التخصص:</label>
                <p>{visit.doctor_details?.specialty}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الهاتف:</label>
                <p>{visit.doctor_details?.phone || 'غير محدد'}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">البريد الإلكتروني:</label>
                <p>{visit.doctor_details?.email || 'غير محدد'}</p>
              </div>
            </div>
          </div>

          {/* Clinic Details */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>🏥</span>
              <span>تفاصيل العيادة</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">اسم العيادة:</label>
                <p>{visit.clinic_details?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">نوع العيادة:</label>
                <p>{visit.clinic_details?.clinic_type}</p>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">العنوان:</label>
                <p>{visit.clinic_details?.address}</p>
              </div>
            </div>
          </div>

          {/* Visit Notes */}
          <div className="card-modern p-6">
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>📝</span>
              <span>ملاحظات الزيارة</span>
            </h4>
            <div className="p-4 bg-gray-50 bg-opacity-10 rounded-lg">
              <p className="whitespace-pre-wrap">{visit.notes || 'لا توجد ملاحظات'}</p>
            </div>
          </div>

          {/* Voice Notes */}
          {visit.voice_notes && visit.voice_notes.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>🎵</span>
                <span>الملاحظات الصوتية ({visit.voice_notes.length})</span>
              </h4>
              <div className="space-y-3">
                {visit.voice_notes.map((note, index) => (
                  <div key={note.id} className="glass-effect p-4 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold">#{index + 1}</span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        بواسطة: {note.created_by_name}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        المدة: {note.duration}ث
                      </span>
                    </div>
                    <audio controls className="w-full h-8">
                      <source src={note.audio_data} type="audio/wav" />
                    </audio>
                    {note.transcript && (
                      <div className="mt-2 text-sm p-2 bg-blue-50 bg-opacity-10 rounded">
                        <strong>النص:</strong> {note.transcript}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Orders */}
          {visit.orders && visit.orders.length > 0 && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>📦</span>
                <span>الطلبات المرتبطة ({visit.orders.length})</span>
              </h4>
              <div className="space-y-4">
                {visit.orders.map((order) => (
                  <div key={order.id} className="glass-effect p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-bold">رقم الطلب: #{order.id.slice(-8)}</span>
                        <span className={`badge-modern ml-2 ${
                          order.status === 'APPROVED' ? 'badge-success' :
                          order.status === 'PENDING' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {order.total_amount} ج.م
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 bg-opacity-5 rounded">
                          <div className="flex-1">
                            <div className="font-medium">{item.product_details?.name}</div>
                            <div className="text-sm text-gray-500">
                              الكمية: {item.quantity} | السعر: {item.unit_price} ج.م
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {(visit.doctor_rating_details || visit.clinic_rating_details) && (
            <div className="card-modern p-6">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span>⭐</span>
                <span>التقييمات</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visit.doctor_rating_details && (
                  <div className="glass-effect p-4 rounded-lg">
                    <h5 className="font-bold mb-2">تقييم الطبيب</h5>
                    <div className="text-2xl text-yellow-500 mb-2">
                      {'⭐'.repeat(visit.doctor_rating_details.rating)}
                    </div>
                    {visit.doctor_rating_details.feedback && (
                      <p className="text-sm">{visit.doctor_rating_details.feedback}</p>
                    )}
                  </div>
                )}
                {visit.clinic_rating_details && (
                  <div className="glass-effect p-4 rounded-lg">
                    <h5 className="font-bold mb-2">تقييم العيادة</h5>
                    <div className="text-2xl text-yellow-500 mb-2">
                      {'⭐'.repeat(visit.clinic_rating_details.rating)}
                    </div>
                    {visit.clinic_rating_details.feedback && (
                      <p className="text-sm">{visit.clinic_rating_details.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-3"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Statistics Dashboard Component
const EnhancedStatisticsDashboard = ({ stats, user }) => {
  const [timeRange, setTimeRange] = useState('week');
  const [comparison, setComparison] = useState({});
  const [quickActions, setQuickActions] = useState([]);
  const [filteredStats, setFilteredStats] = useState(stats);
  const [loading, setLoading] = useState(false);
  const { analytics, loading: analyticsLoading } = useRealTimeAnalytics();
  const { language } = useContext(ThemeContext);

  const translations = {
    en: {
      title: "📊 Comprehensive Statistics Dashboard",
      subtitle: "Complete overview of system and team performance",
      today: "Today",
      week: "Week", 
      month: "Month",
      quarter: "Quarter",
      live: "Live",
      quickActions: "⚡ Quick Actions",
      liveStats: "🔴 Live Statistics",
      updatesEvery30: "(Updates every 30 seconds)",
      visitsToday: "Visits Today",
      activeSalesReps: "Active Sales Reps",
      pendingOrders: "Pending Orders",
      totalUsers: "Total Users",
      totalClinics: "Total Clinics",
      totalVisits: "Total Visits",
      totalWarehouses: "Total Warehouses",
      lowStockItems: "Low Stock Items",
      todayVisits: "Today's Visits",
      lastUpdated: "Last updated:"
    },
    ar: {
      title: "📊 لوحة الإحصائيات الشاملة",
      subtitle: "نظرة شاملة على أداء النظام والفريق",
      today: "اليوم",
      week: "الأسبوع",
      month: "الشهر", 
      quarter: "الربع",
      live: "مباشر",
      quickActions: "⚡ إجراءات سريعة",
      liveStats: "🔴 الإحصائيات المباشرة",
      updatesEvery30: "(يتم التحديث كل 30 ثانية)",
      visitsToday: "زيارات اليوم",
      activeSalesReps: "مناديب نشطين الآن",
      pendingOrders: "طلبيات معلقة",
      totalUsers: "إجمالي المستخدمين",
      totalClinics: "إجمالي العيادات", 
      totalVisits: "إجمالي الزيارات",
      totalWarehouses: "إجمالي المخازن",
      lowStockItems: "منتجات نقص مخزون",
      todayVisits: "زيارات اليوم",
      lastUpdated: "آخر تحديث:"
    }
  };

  const t = translations[language] || translations.en;

  useEffect(() => {
    fetchComparisonData();
    fetchQuickActions();
    applyTimeFilter();
  }, [timeRange]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      // Simulate filtered data based on timeRange
      let filtered = { ...stats };
      
      switch (timeRange) {
        case 'today':
          // Fetch today's data
          const token = localStorage.getItem('token');
          const todayResponse = await axios.get(`${API}/dashboard/stats?period=today`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = todayResponse.data;
          break;
        case 'week':
          // This week's data - default
          break;
        case 'month':
          // This month's data
          const monthResponse = await axios.get(`${API}/dashboard/stats?period=month`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = monthResponse.data;
          break;
        case 'quarter':
          // This quarter's data
          const quarterResponse = await axios.get(`${API}/dashboard/stats?period=quarter`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          filtered = quarterResponse.data;
          break;
      }
      
      setFilteredStats(filtered);
      setComparison({
        users_growth: '+12%',
        visits_growth: '+8%',
        clinics_growth: '+15%',
        revenue_growth: '+22%'
      });
    } catch (error) {
      console.error('Error fetching time-filtered data:', error);
      setFilteredStats(stats);
    } finally {
      setLoading(false);
    }
  };

  const applyTimeFilter = async () => {
    await fetchComparisonData();
  };

  const fetchQuickActions = async () => {
    const actions = [];
    if (filteredStats.pending_reviews > 0) {
      actions.push({ type: 'reviews', count: filteredStats.pending_reviews, text: language === 'ar' ? 'مراجعات تحتاج موافقة' : 'Reviews Need Approval' });
    }
    if (filteredStats.low_stock_items > 0) {
      actions.push({ type: 'stock', count: filteredStats.low_stock_items, text: language === 'ar' ? 'منتجات نقص مخزون' : 'Low Stock Items' });
    }
    if (filteredStats.pending_clinics > 0) {
      actions.push({ type: 'clinics', count: filteredStats.pending_clinics, text: language === 'ar' ? 'عيادات تحتاج موافقة' : 'Clinics Need Approval' });
    }
    setQuickActions(actions);
  };

  // Updated stats config - removed doctors and products as requested
  const statsConfig = [
    { key: 'total_users', title: t.totalUsers, icon: '👥', color: 'bg-blue-500', growth: comparison.users_growth },
    { key: 'total_clinics', title: t.totalClinics, icon: '🏥', color: 'bg-green-500', growth: comparison.clinics_growth },
    { key: 'total_visits', title: t.totalVisits, icon: '📋', color: 'bg-indigo-500', growth: comparison.visits_growth },
    { key: 'total_warehouses', title: t.totalWarehouses, icon: '🏪', color: 'bg-pink-500', growth: '+0%' },
    { key: 'today_visits', title: t.todayVisits, icon: '📅', color: 'bg-teal-500', growth: '+18%' },
    { key: 'low_stock_items', title: t.lowStockItems, icon: '⚠️', color: 'bg-red-500', isAlert: true }
  ];

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="space-y-8">
        {/* Header with Time Range Selector and Real-time Indicator */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-gradient">{t.title}</h2>
              {analytics && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>{t.live}</span>
                </div>
              )}
            </div>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {t.subtitle} - {t.lastUpdated} {analytics?.timestamp ? new Date(analytics.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US') : language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {['today', 'week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                }}
                disabled={loading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range ? 'btn-primary' : 'btn-secondary'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && timeRange === range ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  t[range]
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Live Stats */}
        {analytics && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🔴</span>
              <span>{t.liveStats}</span>
              <span className="text-sm text-green-600 animate-pulse">{t.updatesEvery30}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-effect p-4 rounded-lg border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{analytics.live_stats.visits_today}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.visitsToday}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{analytics.live_stats.active_sales_reps}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.activeSalesReps}</div>
              </div>
              <div className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                <div className="text-3xl font-bold text-orange-600">{analytics.live_stats.pending_orders}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.pendingOrders}</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>{t.quickActions}</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <div key={index} className="glass-effect p-4 rounded-lg border-l-4 border-orange-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{action.text}</p>
                      <p className="text-2xl font-bold text-orange-500">{action.count}</p>
                    </div>
                    <button className="btn-warning text-sm">
                      {language === 'ar' ? 'عرض' : 'View'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((config) => {
            const value = stats[config.key] || 0;
            return (
              <div key={config.key} className="card-modern p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 -mr-10 -mt-10" 
                     style={{ background: config.color.replace('bg-', '') }}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {config.icon}
                    </div>
                    {config.growth && (
                      <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
                        config.isAlert ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {config.growth}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                  </h3>
                  <p className={`text-3xl font-bold ${config.isAlert ? 'text-red-500' : ''}`} 
                     style={{ color: config.isAlert ? undefined : 'var(--text-primary)' }}>
                    {value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart Placeholder */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>📈</span>
              <span>أداء الزيارات</span>
            </h3>
            <div className="h-64 flex items-center justify-center glass-effect rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p style={{ color: 'var(--text-secondary)' }}>رسم بياني لأداء الزيارات</p>
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  يتم تحميل البيانات...
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🕐</span>
              <span>النشاطات الأخيرة</span>
            </h3>
            <div className="space-y-3">
              {[
                { type: 'visit', text: 'زيارة جديدة تمت للدكتور أحمد', time: 'منذ 5 دقائق', color: 'text-green-500' },
                { type: 'clinic', text: 'تم إضافة عيادة جديدة', time: 'منذ 15 دقيقة', color: 'text-blue-500' },
                { type: 'order', text: 'طلبية جديدة تحتاج موافقة', time: 'منذ 30 دقيقة', color: 'text-orange-500' },
                { type: 'user', text: 'مستخدم جديد انضم للنظام', time: 'منذ ساعة', color: 'text-purple-500' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 glass-effect rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${activity.color.replace('text-', 'bg-')}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {activity.text}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {user.role === 'admin' && (
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>👑</span>
              <span>إجراءات المدير</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="btn-primary flex items-center justify-center gap-2 py-3">
                <span>📊</span>
                <span>تصدير التقارير</span>
              </button>
              <button className="btn-info flex items-center justify-center gap-2 py-3">
                <span>👥</span>
                <span>إدارة المستخدمين</span>
              </button>
              <button className="btn-success flex items-center justify-center gap-2 py-3">
                <span>⚙️</span>
                <span>إعدادات النظام</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced User Management Component
// Enhanced User Management Component
const EnhancedUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: '',
    phone: '',
    manager_id: '',
    department: '',
    employee_id: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bulkAction, setBulkAction] = useState('');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [userStats, setUserStats] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      setError('خطأ في جلب المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/auth/register`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إنشاء المستخدم بنجاح');
      setShowCreateUser(false);
      setNewUser({
        username: '', email: '', password: '', full_name: '', role: '', 
        phone: '', manager_id: '', department: '', employee_id: ''
      });
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في إنشاء المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const updateData = { ...selectedUser };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      
      await axios.patch(`${API}/users/${selectedUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم تحديث المستخدم بنجاح');
      setShowEditUser(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تحديث المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم حذف المستخدم بنجاح');
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في حذف المستخدم');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const action = currentStatus ? 'تعطيل' : 'تنشيط';
      setSuccess(`تم ${action} المستخدم بنجاح`);
      fetchUsers();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تغيير حالة المستخدم');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    const confirmed = window.confirm(`هل أنت متأكد من تطبيق "${bulkAction}" على ${selectedUsers.size} مستخدم؟`);
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedUsers).map(userId => {
        if (bulkAction === 'activate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (bulkAction === 'deactivate') {
          return axios.patch(`${API}/users/${userId}/toggle-status`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });

      await Promise.all(promises);
      setSuccess(`تم تطبيق الإجراء على ${selectedUsers.size} مستخدم`);
      setSelectedUsers(new Set());
      setBulkAction('');
      fetchUsers();
    } catch (error) {
      setError('خطأ في تطبيق الإجراء الجماعي');
    }
  };

  const openEditModal = (user) => {
    setSelectedUser({ ...user });
    setShowEditUser(true);
  };

  const openDetailsModal = async (user) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(response.data);
      setShowUserDetails(true);
    } catch (error) {
      setError('خطأ في جلب تفاصيل المستخدم');
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'مدير النظام',
      manager: 'مدير',
      sales_rep: 'مندوب مبيعات',
      warehouse_manager: 'مدير مخزن',
      accounting: 'محاسب'
    };
    return roles[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">👥</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">إدارة المستخدمين الشاملة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                إدارة كاملة للمستخدمين مع جميع الصلاحيات والإحصائيات
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateUser(true)}
            className="btn-primary flex items-center gap-2 px-6 py-3 neon-glow"
          >
            <span>➕</span>
            <span>مستخدم جديد</span>
          </button>
        </div>

        {/* User Statistics */}
        {userStats.total_users && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{userStats.total_users}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي المستخدمين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{userStats.active_distribution?.active || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين نشطين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-red-600">{userStats.active_distribution?.inactive || 0}</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>مستخدمين معطلين</div>
            </div>
            <div className="card-modern p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.keys(userStats.role_distribution || {}).length}
              </div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>أنواع الأدوار</div>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">❌</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold mb-2">البحث:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم أو البريد..."
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالدور:</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الأدوار</option>
                <option value="admin">مدير النظام</option>
                <option value="manager">مدير</option>
                <option value="sales_rep">مندوب مبيعات</option>
                <option value="warehouse_manager">مدير مخزن</option>
                <option value="accounting">محاسب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">فلترة بالحالة:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-modern w-full"
              >
                <option value="all">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إجراء جماعي:</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="form-modern w-full"
              >
                <option value="">اختر إجراء</option>
                <option value="activate">تنشيط المحدد</option>
                <option value="deactivate">تعطيل المحدد</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchUsers}
                className="btn-info flex-1 flex items-center justify-center gap-2"
              >
                <span>🔄</span>
                <span>تحديث</span>
              </button>
              {selectedUsers.size > 0 && bulkAction && (
                <button
                  onClick={handleBulkAction}
                  className="btn-warning flex-1 flex items-center justify-center gap-2"
                >
                  <span>⚡</span>
                  <span>تطبيق</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="card-modern overflow-hidden">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>📋</span>
              <span>قائمة المستخدمين ({filteredUsers.length})</span>
              {selectedUsers.size > 0 && (
                <span className="badge-modern badge-info">
                  {selectedUsers.size} محدد
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                          } else {
                            setSelectedUsers(new Set());
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المستخدم</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الدور</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">آخر دخول</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedUsers);
                            if (e.target.checked) {
                              newSelected.add(user.id);
                            } else {
                              newSelected.delete(user.id);
                            }
                            setSelectedUsers(newSelected);
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            user.is_active ? 'bg-green-500' : 'bg-gray-500'
                          }`}>
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {user.full_name}
                            </div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              {user.username} • {user.email}
                            </div>
                            {user.phone && (
                              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                📱 {user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.role === 'admin' ? 'badge-danger' :
                          user.role === 'manager' ? 'badge-warning' :
                          user.role === 'sales_rep' ? 'badge-info' :
                          user.role === 'warehouse_manager' ? 'badge-success' : 'badge-secondary'
                        }`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge-modern ${
                          user.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {user.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {user.last_login ? 
                            new Date(user.last_login).toLocaleDateString('ar-EG') : 
                            'لم يسجل دخول'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailsModal(user)}
                            className="btn-info text-xs px-3 py-1"
                            title="التفاصيل"
                          >
                            👁️
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="btn-primary text-xs px-3 py-1"
                            title="تعديل"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active)}
                            className={`text-xs px-3 py-1 rounded ${
                              user.is_active ? 'btn-warning' : 'btn-success'
                            }`}
                            title={user.is_active ? 'تعطيل' : 'تنشيط'}
                          >
                            {user.is_active ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="btn-danger text-xs px-3 py-1"
                            title="حذف"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">➕ إضافة مستخدم جديد</h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم *</label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني *</label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل *</label>
                    <input
                      type="text"
                      value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                      className="form-modern w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="form-modern w-full"
                      required
                    >
                      <option value="">اختر الدور</option>
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={newUser.department}
                      onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الموظف</label>
                    <input
                      type="text"
                      value={newUser.employee_id}
                      onChange={(e) => setNewUser({...newUser, employee_id: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري الإنشاء...' : '✅ إنشاء المستخدم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">✏️ تعديل المستخدم</h3>
                <button
                  onClick={() => setShowEditUser(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">اسم المستخدم</label>
                    <input
                      type="text"
                      value={selectedUser.username}
                      onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">البريد الإلكتروني</label>
                    <input
                      type="email"
                      value={selectedUser.email}
                      onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم الكامل</label>
                    <input
                      type="text"
                      value={selectedUser.full_name}
                      onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={selectedUser.phone || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الدور</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                      className="form-modern w-full"
                    >
                      <option value="admin">مدير النظام</option>
                      <option value="manager">مدير</option>
                      <option value="sales_rep">مندوب مبيعات</option>
                      <option value="warehouse_manager">مدير مخزن</option>
                      <option value="accounting">محاسب</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">القسم</label>
                    <input
                      type="text"
                      value={selectedUser.department || ''}
                      onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                      className="form-modern w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1"
                  >
                    {loading ? 'جاري التحديث...' : '✅ حفظ التغييرات'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditUser(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">👁️ تفاصيل المستخدم</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">المعلومات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500">الاسم الكامل</label>
                      <p className="text-lg font-medium">{selectedUser.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">اسم المستخدم</label>
                      <p className="text-lg font-medium">{selectedUser.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">البريد الإلكتروني</label>
                      <p className="text-lg font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">رقم الهاتف</label>
                      <p className="text-lg font-medium">{selectedUser.phone || 'غير محدد'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الدور</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.role === 'admin' ? 'badge-danger' :
                          selectedUser.role === 'manager' ? 'badge-warning' :
                          selectedUser.role === 'sales_rep' ? 'badge-info' : 'badge-success'
                        }`}>
                          {getRoleText(selectedUser.role)}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">الحالة</label>
                      <p className="text-lg font-medium">
                        <span className={`badge-modern ${
                          selectedUser.is_active ? 'badge-success' : 'badge-danger'
                        }`}>
                          {selectedUser.is_active ? '✅ نشط' : '❌ معطل'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {selectedUser.statistics && (
                  <div className="card-modern p-6">
                    <h4 className="text-lg font-bold mb-4">الإحصائيات</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedUser.statistics.total_visits !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الزيارات</label>
                          <p className="text-2xl font-bold text-blue-600">{selectedUser.statistics.total_visits}</p>
                        </div>
                      )}
                      {selectedUser.statistics.total_orders !== undefined && (
                        <div>
                          <label className="text-sm font-bold text-gray-500">إجمالي الطلبات</label>
                          <p className="text-2xl font-bold text-green-600">{selectedUser.statistics.total_orders}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                <div className="card-modern p-6">
                  <h4 className="text-lg font-bold mb-4">معلومات النشاط</h4>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-bold text-gray-500">تاريخ الإنشاء</label>
                      <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500">آخر دخول</label>
                      <p className="text-lg">
                        {selectedUser.last_login ? 
                          new Date(selectedUser.last_login).toLocaleString('ar-EG') : 
                          'لم يسجل دخول بعد'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="btn-primary px-6 py-3"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components and Sub-systems

// Helper utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Real-time Analytics Hook
const useRealTimeAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/analytics/realtime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching real-time analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { analytics, loading };
};

// Enhanced Global Search Component with Better Design
const GlobalSearchBox = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { language } = useContext(ThemeContext);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults({});
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/search/global?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(response.data);
      setShowResults(true);
      if (onResults) onResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const debounceSearch = useCallback(
    debounce((query) => handleSearch(query), 500),
    []
  );

  useEffect(() => {
    debounceSearch(query);
  }, [query, debounceSearch]);

  const getTotalResults = () => {
    return Object.values(results).reduce((total, category) => total + (category?.length || 0), 0);
  };

  const translations = {
    en: {
      placeholder: "🔍 Search across the system...",
      users: "👥 Users",
      clinics: "🏥 Clinics", 
      doctors: "👨‍⚕️ Doctors",
      products: "📦 Products",
      noResults: "No results found"
    },
    ar: {
      placeholder: "🔍 بحث عام في النظام...",
      users: "👥 المستخدمين",
      clinics: "🏥 العيادات",
      doctors: "👨‍⚕️ الأطباء", 
      products: "📦 المنتجات",
      noResults: "لا توجد نتائج"
    }
  };

  const t = translations[language] || translations.en;

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="w-full px-4 py-2.5 pr-10 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="text-gray-400 text-lg">🔍</span>
          )}
        </div>
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white/95 backdrop-blur-lg shadow-2xl rounded-xl border border-gray-200 max-h-96 overflow-y-auto">
          {getTotalResults() === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>{t.noResults}</p>
            </div>
          ) : (
            Object.entries(results).map(([category, items]) => {
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                    <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2">
                      <span>{t[category]}</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                        {items.length}
                      </span>
                    </h4>
                  </div>
                  <div className="p-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors duration-150 border border-transparent hover:border-blue-200"
                        onClick={() => {
                          setShowResults(false);
                          setQuery('');
                          // Handle navigation to item details
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {(item.full_name || item.name || item.username)?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-sm">
                              {item.full_name || item.name || item.username}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {category === 'users' && item.role && `${item.email} • ${item.role}`}
                              {category === 'clinics' && item.address}
                              {category === 'doctors' && item.specialty}
                              {category === 'products' && `${item.price} EGP • ${item.unit}`}
                            </div>
                          </div>
                          <div className="text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

// Advanced Reports Component
const AdvancedReports = () => {
  const [reportType, setReportType] = useState('visits_performance');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        report_type: reportType,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date
      });
      
      const response = await axios.get(`${API}/reports/advanced?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange]);

  const ChartRenderer = ({ data, type, title }) => {
    if (!data || !data.data) return <div>لا توجد بيانات للعرض</div>;

    return (
      <div className="card-modern p-6">
        <h3 className="text-xl font-bold mb-4 text-center">{title}</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-600">رسم بياني تفاعلي</p>
            <p className="text-sm text-gray-500 mt-2">
              {data.data.length} نقطة بيانات
            </p>
            <div className="mt-4 text-xs text-gray-400">
              {data.data.slice(0, 3).map((point, index) => (
                <div key={index}>
                  {point._id}: {point.total_visits || point.total_orders || 'N/A'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-green rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">📈</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">التقارير التفاعلية المتقدمة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                تحليلات وتقارير شاملة مع رسوم بيانية تفاعلية
              </p>
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="card-modern p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">نوع التقرير:</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="form-modern w-full"
              >
                <option value="visits_performance">أداء الزيارات</option>
                <option value="sales_by_rep">المبيعات بواسطة المناديب</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">من تاريخ:</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">إلى تاريخ:</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                className="form-modern w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="loading-shimmer w-4 h-4 rounded-full"></div>
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>تحديث التقرير</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Display */}
        {reportData && (
          <ChartRenderer 
            data={reportData} 
            type={reportData.type} 
            title={reportData.title}
          />
        )}
      </div>
    </div>
  );
};

// QR Code Scanner Component
const QRCodeScanner = ({ onScan, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('لا يمكن الوصول للكاميرا. تأكد من السماح للموقع باستخدام الكاميرا.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setScanning(false);
  };

  const captureAndScan = () => {
    if (canvasRef.current && videoRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // Simulate QR code scanning (in real app, use a QR code library)
      const imageData = canvas.toDataURL();
      onScan({ 
        type: 'clinic', 
        id: 'sample-clinic-id',
        name: 'عيادة تجريبية',
        address: 'عنوان تجريبي' 
      });
    }
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="modal-modern p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gradient">📱 مسح QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '1' }}>
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-4 border-2 border-green-400 rounded-lg animate-pulse"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <button
                    onClick={captureAndScan}
                    className="btn-success w-full flex items-center justify-center gap-2"
                  >
                    <span>📷</span>
                    <span>مسح الكود</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">📱</div>
                  <p className="text-lg mb-4">اضغط لبدء المسح</p>
                  <button
                    onClick={startScanning}
                    className="btn-primary"
                  >
                    🎥 تشغيل الكاميرا
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          <div className="text-center">
            <p className="text-sm text-gray-500">
              📋 وجه الكاميرا نحو QR Code للعيادة أو المنتج
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Language Selector with English as Primary
const LanguageSelector = () => {
  const { language, setLanguage } = useContext(ThemeContext);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' }
  ];

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
    
    // Apply RTL/LTR direction
    const selectedLang = languages.find(l => l.code === lang);
    document.dir = selectedLang?.dir || 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <div className="relative">
      <select 
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
        style={{ direction: 'ltr' }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

// Offline Status Component
const OfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    
    if (offlineData.visits.length === 0 && offlineData.orders.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/offline/sync`, offlineData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Clear offline data after successful sync
      localStorage.removeItem('offline_data');
      setPendingSync([]);
      
      console.log('Offline data synced successfully:', response.data);
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  const addOfflineData = (type, data) => {
    const offlineData = JSON.parse(localStorage.getItem('offline_data') || '{"visits": [], "orders": []}');
    offlineData[type].push({
      ...data,
      local_id: Date.now().toString(),
      offline_created_at: new Date().toISOString()
    });
    localStorage.setItem('offline_data', JSON.stringify(offlineData));
    setPendingSync([...pendingSync, { type, data }]);
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-3 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl">📡</span>
        <div className="flex-1">
          <div className="font-medium">وضع عدم الاتصال</div>
          <div className="text-sm">سيتم مزامنة البيانات عند عودة الاتصال</div>
          {pendingSync.length > 0 && (
            <div className="text-xs mt-1">
              {pendingSync.length} عناصر في انتظار المزامنة
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Accounting Role Component
const AccountingDashboard = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [approvedOrders, setApprovedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch pending orders (manager approved, waiting for accounting)
      const pendingRes = await axios.get(`${API}/orders?status=MANAGER_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(pendingRes.data);

      // Fetch accounting approved orders
      const approvedRes = await axios.get(`${API}/orders?status=ACCOUNTING_APPROVED`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedOrders(approvedRes.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/orders/${orderId}/approve`, {
        notes: approvalNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('خطأ في الموافقة على الطلبية');
    }
  };

  const getOrderTotal = (order) => {
    return order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
  };

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 card-gradient-yellow rounded-full flex items-center justify-center ml-4 glow-pulse">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gradient">لوحة تحكم المحاسبة</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                مراجعة وموافقة الطلبيات المالية
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{pendingOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تحتاج موافقة</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{approvedOrders.length}</div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبيات تمت الموافقة عليها</div>
          </div>
          <div className="card-modern p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {pendingOrders.reduce((total, order) => total + getOrderTotal(order), 0).toLocaleString()} ريال
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>إجمالي القيمة المعلقة</div>
          </div>
        </div>

        {/* Pending Orders for Approval */}
        <div className="card-modern mb-8">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>⏳</span>
              <span>طلبيات تحتاج موافقة المحاسبة ({pendingOrders.length})</span>
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="loading-shimmer w-16 h-16 rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--text-secondary)' }}>جاري التحميل...</p>
            </div>
          ) : (
            <div className="table-modern">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الإنشاء</th>
                    <th className="px-6 py-4 text-right text-sm font-bold uppercase">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                          #{order.id.substring(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.sales_rep_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ color: 'var(--text-primary)' }}>
                          {order.clinic_name || 'غير محدد'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-green-600">
                          {getOrderTotal(order).toLocaleString()} ريال
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(order.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowApprovalModal(true);
                            }}
                            className="btn-success text-xs px-3 py-1"
                            title="موافقة"
                          >
                            ✅ موافقة
                          </button>
                          <button
                            className="btn-info text-xs px-3 py-1"
                            title="تفاصيل"
                          >
                            👁️ تفاصيل
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approved Orders */}
        <div className="card-modern">
          <div className="p-6 border-b" style={{ borderColor: 'var(--accent-bg)' }}>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <span>✅</span>
              <span>طلبيات تمت الموافقة عليها ({approvedOrders.length})</span>
            </h3>
          </div>
          
          <div className="table-modern">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">رقم الطلبية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">المندوب</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">العيادة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">القيمة الإجمالية</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">تاريخ الموافقة</th>
                  <th className="px-6 py-4 text-right text-sm font-bold uppercase">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {approvedOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 hover:bg-opacity-5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        #{order.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.sales_rep_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div style={{ color: 'var(--text-primary)' }}>
                        {order.clinic_name || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-lg font-bold text-green-600">
                        {getOrderTotal(order).toLocaleString()} ريال
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {order.approved_at_accounting ? 
                          new Date(order.approved_at_accounting).toLocaleDateString('ar-EG') : 
                          'غير محدد'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge-modern badge-success">
                        في انتظار المخزن
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Approval Modal */}
        {showApprovalModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="modal-modern p-8 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gradient">💰 موافقة الطلبية</h3>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Details */}
                <div className="card-modern p-4">
                  <h4 className="font-bold mb-3">تفاصيل الطلبية:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">رقم الطلبية:</span>
                      <span className="mr-2">#{selectedOrder.id.substring(0, 8)}</span>
                    </div>
                    <div>
                      <span className="font-medium">المندوب:</span>
                      <span className="mr-2">{selectedOrder.sales_rep_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">العيادة:</span>
                      <span className="mr-2">{selectedOrder.clinic_name}</span>
                    </div>
                    <div>
                      <span className="font-medium">إجمالي القيمة:</span>
                      <span className="mr-2 text-green-600 font-bold">
                        {getOrderTotal(selectedOrder).toLocaleString()} ريال
                      </span>
                    </div>
                  </div>
                </div>

                {/* Approval Notes */}
                <div>
                  <label className="block text-sm font-bold mb-2">ملاحظات الموافقة:</label>
                  <textarea
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={4}
                    className="form-modern w-full"
                    placeholder="أضف أي ملاحظات خاصة بالموافقة المالية..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => approveOrder(selectedOrder.id)}
                    className="btn-success flex-1 flex items-center justify-center gap-2"
                  >
                    <span>✅</span>
                    <span>الموافقة على الطلبية</span>
                  </button>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="btn-secondary flex-1"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Warehouse Management Component

// Warehouse Management Component
// Enhanced Warehouse Management Component  
const WarehouseManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [movementHistory, setMovementHistory] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchWarehouseStats();
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory(selectedWarehouse);
      fetchMovementHistory(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouseStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/warehouse-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouseStats(response.data);
    } catch (error) {
      console.error('Error fetching warehouse stats:', error);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/orders/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  const fetchMovementHistory = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses/${warehouseId}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMovementHistory(response.data);
    } catch (error) {
      console.error('Error fetching movement history:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
      if (response.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(response.data[0].id);
      }
    } catch (error) {
      setError('خطأ في جلب المخازن');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      setError('خطأ في جلب المنتجات');
    }
  };

  const fetchInventory = async (warehouseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/inventory/${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      setError('خطأ في جلب المخزون');
    }
  };

  const updateInventory = async (productId, quantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/inventory/${selectedWarehouse}/${productId}`, {
        quantity: parseInt(quantity)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم تحديث المخزون بنجاح');
      fetchInventory(selectedWarehouse);
      fetchWarehouseStats();
    } catch (error) {
      setError(error.response?.data?.detail || 'خطأ في تحديث المخزون');
    }
  };

  // Warehouse Dashboard Component
  const WarehouseDashboard = () => (
    <div className="space-y-8 page-transition">
      <div className="flex items-center mb-8">
        <div className="w-16 h-16 card-gradient-blue rounded-full flex items-center justify-center ml-4 glow-pulse">
          <span className="text-3xl">📊</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gradient">لوحة تحكم المخزن</h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>إحصائيات ومعلومات شاملة عن المخزن</p>
        </div>
      </div>

      {warehouseStats && (
        <>
          {/* Main Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">📦</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>المنتجات المتوفرة</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>في المخزن</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-green-600">{warehouseStats.available_products}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>إجمالي المخازن</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>تحت إدارتك</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-600">{warehouseStats.total_warehouses}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>نقص المخزون</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>منتجات قليلة</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-orange-600">{warehouseStats.low_stock_products}</p>
            </div>

            <div className="card-modern p-6 interactive-element">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center ml-4">
                  <span className="text-2xl">📤</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>منتجات مسحوبة</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>هذا الشهر</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-purple-600">{warehouseStats.withdrawn_products}</p>
            </div>
          </div>

          {/* Orders Statistics */}
          <div className="card-modern p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <span style={{ color: 'var(--text-primary)' }}>إحصائيات الطلبات</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📅</div>
                <div className="text-2xl font-bold text-green-600">{warehouseStats.orders.today}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات اليوم</div>
              </div>
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold text-blue-600">{warehouseStats.orders.week}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات الأسبوع</div>
              </div>
              <div className="text-center p-4 glass-effect rounded-xl">
                <div className="text-3xl mb-2">📈</div>
                <div className="text-2xl font-bold text-purple-600">{warehouseStats.orders.month}</div>
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>طلبات الشهر</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      <ThemeToggle />
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📊</span>
            لوحة التحكم
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📦</span>
            إدارة المخزن
          </button>
          <button
            onClick={() => setActiveTab('pending-orders')}
            className={`nav-tab ${activeTab === 'pending-orders' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">⏳</span>
            الطلبات المنتظرة
            {pendingOrders.length > 0 && (
              <span className="badge-modern badge-warning mr-2">{pendingOrders.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('warehouse-log')}
            className={`nav-tab ${activeTab === 'warehouse-log' ? 'active' : ''} flex items-center`}
          >
            <span className="ml-2">📋</span>
            سجل المخزن
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && <WarehouseDashboard />}
        
        {activeTab === 'inventory' && (
          <div className="space-y-6 page-transition">
            <div className="card-modern p-6">
              <h3 className="text-xl font-bold mb-4">إدارة المخزن</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((item, index) => (
                  <div key={index} className="glass-effect p-4 rounded-xl">
                    <div className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {item.product_name}
                    </div>
                    <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      الكمية: {item.quantity} {item.product_unit}
                    </div>
                    <div className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                      السعر: {item.product_price} ج.م
                    </div>
                    {item.low_stock && (
                      <div className="text-sm text-red-500 font-bold">⚠️ مخزون قليل</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending-orders' && (
          <div className="space-y-6 page-transition">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">⏳</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gradient">الطلبات المنتظرة</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>طلبات تحتاج إلى المراجعة والتنفيذ</p>
              </div>
            </div>

            <div className="grid gap-6">
              {pendingOrders.map((order) => (
                <div key={order.id} className="card-modern p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>المندوب:</span>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.sales_rep_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>العيادة:</span>
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{order.clinic_name}</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>المبلغ الإجمالي:</span>
                      <p className="font-semibold text-green-600">{order.total_amount} ج.م</p>
                    </div>
                    <div>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>موافقة المدير:</span>
                      <span className={`badge-modern ${order.manager_approved ? 'badge-success' : 'badge-warning'}`}>
                        {order.manager_approved ? '✅ تمت الموافقة' : '⏳ في الانتظار'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4" style={{ borderColor: 'var(--accent-bg)' }}>
                    <h4 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>المنتجات المطلوبة:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 glass-effect rounded-lg">
                          {item.product_image && (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{item.product_name}</div>
                            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              الكمية: {item.quantity} {item.product_unit} | السعر: {item.unit_price} ج.م
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'warehouse-log' && (
          <div className="space-y-6 page-transition">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 card-gradient-purple rounded-full flex items-center justify-center ml-4 glow-pulse">
                <span className="text-3xl">📋</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gradient">سجل المخزن</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>سجل جميع حركات المخزن والأدوية</p>
              </div>
            </div>

            {selectedWarehouse && (
              <div className="mb-6">
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  اختر المخزن:
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="form-modern w-full max-w-md"
                >
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - {warehouse.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="card-modern overflow-hidden">
              <div className="table-modern">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">المنتج</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">نوع الحركة</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">الكمية</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">السبب</th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">بواسطة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementHistory.map((movement, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(movement.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {movement.product_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge-modern ${
                            movement.movement_type === 'IN' ? 'badge-success' : 
                            movement.movement_type === 'OUT' ? 'badge-danger' : 'badge-info'
                          }`}>
                            {movement.movement_type === 'IN' ? '📥 إدخال' : 
                             movement.movement_type === 'OUT' ? '📤 إخراج' : '🔄 تعديل'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {movement.quantity} {movement.product_unit}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {movement.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {movement.created_by_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reports Component
const ReportsSection = () => {
  const [inventoryReport, setInventoryReport] = useState([]);
  const [usersReport, setUsersReport] = useState(null);
  const [activeReport, setActiveReport] = useState('inventory');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeReport === 'inventory') {
      fetchInventoryReport();
    } else if (activeReport === 'users') {
      fetchUsersReport();
    }
  }, [activeReport]);

  const fetchInventoryReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventoryReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المخزون');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsersReport = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersReport(response.data);
    } catch (error) {
      setError('خطأ في جلب تقرير المستخدمين');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalInventoryValue = () => {
    return inventoryReport.reduce((total, item) => total + item.total_value, 0).toFixed(2);
  };

  const getLowStockCount = () => {
    return inventoryReport.filter(item => item.low_stock).length;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المخزون
          </button>
          <button
            onClick={() => setActiveReport('users')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeReport === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تقرير المستخدمين
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">جاري تحميل التقرير...</p>
          </div>
        )}

        {/* Inventory Report */}
        {activeReport === 'inventory' && !isLoading && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المخزون الشامل</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي قيمة المخزون</h3>
                <p className="text-2xl font-bold text-blue-600">{getTotalInventoryValue()} ريال</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">منتجات نقص مخزون</h3>
                <p className="text-2xl font-bold text-red-600">{getLowStockCount()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">إجمالي المنتجات</h3>
                <p className="text-2xl font-bold text-green-600">{inventoryReport.length}</p>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المخزن
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المنتج
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكمية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحد الأدنى
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      القيمة الإجمالية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryReport.map((item, index) => (
                    <tr key={index} className={item.low_stock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.warehouse_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.minimum_stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_value.toFixed(2)} ريال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.low_stock
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.low_stock ? 'نقص مخزون' : 'متوفر'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Report */}
        {activeReport === 'users' && !isLoading && usersReport && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">تقرير المستخدمين</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800">إجمالي المستخدمين</h3>
                <p className="text-2xl font-bold text-blue-600">{usersReport.total_users}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800">مستخدمين نشطين</h3>
                <p className="text-2xl font-bold text-green-600">{usersReport.active_distribution.active}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800">مستخدمين معطلين</h3>
                <p className="text-2xl font-bold text-red-600">{usersReport.active_distribution.inactive}</p>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">توزيع الأدوار</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(usersReport.role_distribution).map(([role, count]) => {
                  const roleNames = {
                    admin: 'أدمن',
                    warehouse_manager: 'مدير مخزن',
                    manager: 'مدير',
                    sales_rep: 'مندوب'
                  };
                  return (
                    <div key={role} className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-sm text-gray-600">{roleNames[role] || role}</p>
                      <p className="text-xl font-bold text-gray-800">{count}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersReport.users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.full_name}
                        <div className="text-xs text-gray-500">@{user.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.role === 'admin' && 'أدمن'}
                        {user.role === 'warehouse_manager' && 'مدير مخزن'}
                        {user.role === 'manager' && 'مدير'}
                        {user.role === 'sales_rep' && 'مندوب'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Sales Rep Dashboard
const SalesRepDashboard = () => {
  const [detailedStats, setDetailedStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDetailedStats();
  }, []);

  const fetchDetailedStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/sales-rep-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDetailedStats(response.data);
    } catch (error) {
      console.error('Error fetching detailed stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">جاري تحميل الإحصائيات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      {/* Visit Statistics Section */}
      <div className="card-modern p-6">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center ml-4">
            <span className="text-2xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gradient">قسم الزيارات</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="stat-card stat-green text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌅</span>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">زيارات اليوم</h3>
            <p className="text-4xl font-bold text-green-600 pulse-gentle">{detailedStats.visits?.today || 0}</p>
          </div>
          <div className="stat-card stat-blue text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">زيارات الأسبوع</h3>
            <p className="text-4xl font-bold text-blue-600 pulse-gentle">{detailedStats.visits?.week || 0}</p>
          </div>
          <div className="stat-card stat-purple text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗓️</span>
            </div>
            <h3 className="text-lg font-semibold text-purple-800 mb-2">زيارات الشهر</h3>
            <p className="text-4xl font-bold text-purple-600 pulse-gentle">{detailedStats.visits?.month || 0}</p>
          </div>
          <div className="stat-card stat-orange text-center scale-in">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏆</span>
            </div>
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">إجمالي الزيارات</h3>
            <p className="text-4xl font-bold text-indigo-600 pulse-gentle">{detailedStats.visits?.total || 0}</p>
          </div>
        </div>
      </div>

      {/* General Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">🏥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">إجمالي العيادات المضافة</h3>
              <p className="text-sm text-gray-500">عن طريقك</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">{detailedStats.total_clinics_added || 0}</p>
        </div>

        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">👨‍⚕️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">إجمالي الأطباء المسجلين</h3>
              <p className="text-sm text-gray-500">عن طريقك</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-green-600">{detailedStats.total_doctors_added || 0}</p>
        </div>

        <div className="card-modern p-6 interactive-element">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center ml-4">
              <span className="text-2xl">⏳</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">في انتظار الموافقة</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">👁️</span>زيارات:</span>
              <span className="badge-modern badge-warning">{detailedStats.pending?.visits || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">🏥</span>عيادات:</span>
              <span className="badge-modern badge-info">{detailedStats.pending?.clinic_requests || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600 flex items-center"><span className="ml-2">📦</span>أوردرات:</span>
              <span className="badge-modern badge-success">{detailedStats.pending?.orders || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Clinic Registration Component
const ClinicRegistration = () => {
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_phone: '',
    doctor_name: '',
    clinic_class: '',
    doctor_address: '',
    clinic_manager_name: '',
    address: '',
    notes: '',
    clinic_image: ''
  });
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(newLocation);
          
          // Convert coordinates to address (placeholder - will be enhanced with Google Maps)
          try {
            setLocationAddress(`الموقع: ${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          } catch (error) {
            setLocationAddress(`${newLocation.latitude.toFixed(6)}, ${newLocation.longitude.toFixed(6)}`);
          }
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({...formData, clinic_image: event.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل العيادة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        ...formData,
        doctor_specialty: formData.clinic_class, // Map clinic_class to doctor_specialty for backend
        latitude: location.latitude,
        longitude: location.longitude
      };

      await axios.post(`${API}/clinic-requests`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال طلب تسجيل العيادة بنجاح. في انتظار موافقة المدير');
      setFormData({
        clinic_name: '',
        clinic_phone: '',
        doctor_name: '',
        clinic_class: '',
        doctor_address: '',
        clinic_manager_name: '',
        address: '',
        notes: '',
        clinic_image: ''
      });
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ThemeToggle />
      <div className="card-modern p-8 page-transition">
        <div className="flex items-center mb-8">
          <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
            <span className="text-3xl">🏥</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gradient">تسجيل عيادة جديدة</h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>أضف عيادة طبية جديدة إلى النظام</p>
          </div>
        </div>

        {error && (
          <div className="alert-modern alert-error mb-6 scale-in">
            <span className="ml-2">⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className="alert-modern alert-success mb-6 scale-in">
            <span className="ml-2">✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 form-modern">
          {/* Location Banner */}
          <div className="card-gradient-success p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              <span>الموقع الجغرافي الحالي</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {location ? (
                <>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">📍</span>
                      <span className="font-bold">الإحداثيات:</span>
                    </div>
                    <p className="text-sm font-mono">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
                  </div>
                  <div className="glass-effect p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">🏠</span>
                      <span className="font-bold">العنوان:</span>
                    </div>
                    <p className="text-sm">{locationAddress}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center">
                  <div className="gps-indicator">
                    <span>جاري تحديد الموقع...</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Placeholder for Google Maps */}
            <div className="mt-6 h-48 glass-effect rounded-xl flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🗺️</span>
                <p className="font-bold">خريطة Google Maps</p>
                <p className="text-sm opacity-75">سيتم عرض الموقع هنا بعد إضافة مفتاح الخرائط</p>
              </div>
            </div>
          </div>

          {/* Clinic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">🏥 اسم العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_name}
                onChange={(e) => setFormData({...formData, clinic_name: e.target.value})}
                className="w-full"
                placeholder="مثال: عيادة النور الطبية"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📞 رقم العيادة</span>
              </label>
              <input
                type="tel"
                value={formData.clinic_phone}
                onChange={(e) => setFormData({...formData, clinic_phone: e.target.value})}
                className="w-full"
                placeholder="0501234567"
              />
            </div>
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👨‍⚕️ اسم الطبيب</span>
              </label>
              <input
                type="text"
                value={formData.doctor_name}
                onChange={(e) => setFormData({...formData, doctor_name: e.target.value})}
                className="w-full"
                placeholder="د. أحمد محمد"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">🏆 تصنيف العيادة</span>
              </label>
              <select
                value={formData.clinic_class}
                onChange={(e) => setFormData({...formData, clinic_class: e.target.value})}
                className="w-full"
                required
              >
                <option value="">اختر تصنيف العيادة</option>
                <option value="A Class">A Class - عيادة درجة أولى</option>
                <option value="B Class">B Class - عيادة درجة ثانية</option>
                <option value="C Class">C Class - عيادة درجة ثالثة</option>
              </select>
            </div>
          </div>

          <div>
            <label>
              <span className="text-shadow-glow">🏠 عنوان الطبيب</span>
            </label>
            <input
              type="text"
              value={formData.doctor_address}
              onChange={(e) => setFormData({...formData, doctor_address: e.target.value})}
              className="w-full"
              placeholder="حي الملز، شارع الملك فهد"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label>
                <span className="text-shadow-glow">👔 المسؤول عن إدارة العيادة</span>
              </label>
              <input
                type="text"
                value={formData.clinic_manager_name}
                onChange={(e) => setFormData({...formData, clinic_manager_name: e.target.value})}
                className="w-full"
                placeholder="اسم مدير العيادة"
                required
              />
            </div>

            <div>
              <label>
                <span className="text-shadow-glow">📍 عنوان العيادة</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full"
                placeholder="العنوان الكامل للعيادة"
                required
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label>
              <span className="text-shadow-glow">📸 صورة العيادة من الخارج (اختياري)</span>
            </label>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full p-4 border-2 border-dashed border-orange-300 rounded-xl hover:border-orange-500 transition-colors"
                style={{ 
                  background: 'var(--glass-bg)',
                  borderColor: 'var(--brand-orange)',
                  borderOpacity: 0.3
                }}
              />
              {formData.clinic_image && (
                <div className="mt-4">
                  <img
                    src={formData.clinic_image}
                    alt="صورة العيادة"
                    className="h-48 w-full object-cover rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label>
              <span className="text-shadow-glow">📝 ملاحظات العيادة</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={5}
              className="w-full"
              placeholder="أضف أي ملاحظات مهمة عن العيادة، ساعات العمل، أو معلومات خاصة..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !location}
            className="w-full btn-primary text-xl py-4 neon-glow"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="loading-shimmer w-6 h-6 rounded-full"></div>
                <span>جاري الإرسال...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <span>🚀</span>
                <span>إرسال طلب تسجيل العيادة</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

// Order Creation Component
const OrderCreation = () => {
  const [doctors, setDoctors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orderData, setOrderData] = useState({
    doctor_id: '',
    order_type: 'DEMO',
    warehouse_id: '',
    notes: '',
    items: []
  });
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show approved doctors
      setDoctors(response.data.filter(doctor => doctor.approved_by));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarehouses(response.data);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const addProductToOrder = (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && !selectedProducts.find(p => p.id === productId)) {
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }
  };

  const updateProductQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? {...p, quantity: parseInt(quantity)} : p
    ));
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('يجب إضافة منتج واحد على الأقل');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const doctor = doctors.find(d => d.id === orderData.doctor_id);
      
      const requestData = {
        ...orderData,
        clinic_id: doctor.clinic_id,
        items: selectedProducts.map(p => ({
          product_id: p.id,
          quantity: p.quantity
        }))
      };

      await axios.post(`${API}/orders`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('تم إرسال الطلبية بنجاح. في انتظار موافقة المدير');
      setOrderData({
        doctor_id: '',
        order_type: 'DEMO',
        warehouse_id: '',
        notes: '',
        items: []
      });
      setSelectedProducts([]);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في إرسال الطلبية');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">عمل طلبية</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">اختيار الطبيب</label>
          <select
            value={orderData.doctor_id}
            onChange={(e) => setOrderData({...orderData, doctor_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الطلبية</label>
            <select
              value={orderData.order_type}
              onChange={(e) => setOrderData({...orderData, order_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEMO">ديمو (مجاني)</option>
              <option value="SALE">أوردر مدفوع</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">اختيار المخزن</label>
            <select
              value={orderData.warehouse_id}
              onChange={(e) => setOrderData({...orderData, warehouse_id: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- اختر المخزن --</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} - {warehouse.location}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">إضافة منتجات</label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                addProductToOrder(e.target.value);
                e.target.value = '';
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- اختر منتج لإضافته --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {product.price} ريال ({product.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">المنتجات المختارة</h3>
            <div className="space-y-3">
              {selectedProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.price} ريال / {product.unit}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      min="1"
                      value={product.quantity}
                      onChange={(e) => updateProductQuantity(product.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {(product.price * product.quantity).toFixed(2)} ريال
                    </span>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">إجمالي الطلبية:</span>
                  <span className="text-xl font-bold text-blue-600">{getTotalAmount().toFixed(2)} ريال</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات الأوردر</label>
          <textarea
            value={orderData.notes}
            onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف أي ملاحظات خاصة بالطلبية..."
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || selectedProducts.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الإرسال...' : 'إرسال الطلبية'}
        </button>
      </form>
    </div>
  );
};

const VisitRegistration = () => {
  const [doctors, setDoctors] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedClinic, setSelectedClinic] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [currentVisitId, setCurrentVisitId] = useState(null);

  useEffect(() => {
    fetchDoctors();
    fetchClinics();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          setError('لا يمكن الحصول على موقعك الحالي. تأكد من تفعيل GPS');
        }
      );
    } else {
      setError('المتصفح لا يدعم تحديد الموقع');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          if (currentVisitId) {
            await addVoiceNote(currentVisitId, base64Audio, blob.size / 1000); // duration in seconds estimate
          } else {
            // Store temporarily until visit is created
            setVoiceNotes([...voiceNotes, { audio: base64Audio, duration: blob.size / 1000 }]);
          }
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('خطأ في بدء تسجيل الصوت');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const addVoiceNote = async (visitId, audioData, duration) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/visits/${visitId}/voice-notes`, {
        audio_data: audioData,
        duration: Math.round(duration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('تم إضافة الملاحظة الصوتية بنجاح');
    } catch (error) {
      console.error('Error adding voice note:', error);
      setError('خطأ في إضافة الملاحظة الصوتية');
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchClinics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/clinics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClinics(response.data);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) {
      setError('لا يمكن تسجيل الزيارة بدون تحديد الموقع');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/visits`, {
        doctor_id: selectedDoctor,
        clinic_id: selectedClinic,
        latitude: location.latitude,
        longitude: location.longitude,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentVisitId(response.data.visit_id);
      
      // Add any pending voice notes
      for (const voiceNote of voiceNotes) {
        await addVoiceNote(response.data.visit_id, voiceNote.audio, voiceNote.duration);
      }
      setVoiceNotes([]);

      setSuccess('تم تسجيل الزيارة بنجاح');
      setSelectedDoctor('');
      setSelectedClinic('');
      setNotes('');
      setCurrentVisitId(null);
    } catch (error) {
      setError(error.response?.data?.detail || 'حدث خطأ في تسجيل الزيارة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">تسجيل زيارة جديدة</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر الطبيب
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر الطبيب --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                د. {doctor.name} - {doctor.specialty}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر العيادة
          </label>
          <select
            value={selectedClinic}
            onChange={(e) => setSelectedClinic(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">-- اختر العيادة --</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name} - {clinic.address}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات الزيارة
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="أضف تفاصيل الزيارة..."
            required
          />
        </div>

        {/* Voice Notes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ملاحظات صوتية (اختيارية)
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <span className="ml-2">🛑</span>
                    إيقاف التسجيل
                  </>
                ) : (
                  <>
                    <span className="ml-2">🎤</span>
                    بدء تسجيل صوتي
                  </>
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">جاري التسجيل...</span>
                </div>
              )}
            </div>

            {voiceNotes.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">الملاحظات الصوتية المسجلة:</h4>
                {voiceNotes.map((note, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm">🎵</span>
                    <audio controls className="flex-1 h-8">
                      <source src={note.audio} type="audio/wav" />
                    </audio>
                    <span className="text-xs text-gray-500">
                      {Math.round(note.duration)}ث
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              💡 يمكنك تسجيل عدة ملاحظات صوتية لحفظ تفاصيل مهمة أثناء الزيارة
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 ml-2">📍</div>
            <div>
              <p className="text-sm font-medium text-blue-800">الموقع الحالي</p>
              {location ? (
                <p className="text-xs text-blue-600">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              ) : (
                <p className="text-xs text-blue-600">جاري تحديد الموقع...</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !location}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري التسجيل...' : 'تسجيل الزيارة'}
        </button>
      </form>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({});
  const [visits, setVisits] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchVisits();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/visits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVisits(response.data);
    } catch (error) {
      console.error('Error fetching visits:', error);
    }
  };

  const getRoleText = (role) => {
    const roles = {
      admin: 'أدمن',
      warehouse_manager: 'مدير مخزن',
      manager: 'مدير',
      sales_rep: 'مندوب',
      accounting: 'محاسب'
    };
    return roles[role] || role;
  };

  const canAccessTab = (tabName) => {
    const permissions = {
      users: ['admin', 'warehouse_manager', 'manager'],
      warehouse: ['admin', 'warehouse_manager'],
      visit: ['sales_rep'],
      reports: ['admin', 'warehouse_manager', 'manager', 'accounting'],
      accounting: ['admin', 'accounting']
    };
    
    return permissions[tabName]?.includes(user.role) || false;
  };

  return (
    <>
      <ThemeToggle />
      <div className="min-h-screen page-transition">
        {/* Header */}
        <header className="header-modern">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-16 h-16 card-gradient-orange rounded-full flex items-center justify-center ml-4 glow-pulse">
                  <span className="text-3xl">🏥</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gradient">نظام إدارة المناديب</h1>
                  <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <div className="flex items-center gap-2">
                      <span>👤</span>
                      <span>مرحباً، {user.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🎭</span>
                      <span className="badge-modern badge-info">{getRoleText(user.role)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <GlobalSearchBox />
                <LanguageSelector />
                <NotificationsCenter />
                <button
                  onClick={logout}
                  className="btn-warning flex items-center gap-2"
                >
                  <span>🚪</span>
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4 overflow-x-auto bg-white/80 backdrop-blur-lg rounded-2xl p-2 shadow-lg" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📊</span>
              {user.role === 'admin' ? 'الإحصائيات' : 'لوحة التحكم'}
            </button>
            
            {canAccessTab('users') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`nav-tab ${activeTab === 'users' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">👥</span>
                إدارة المستخدمين
              </button>
            )}
            
            {canAccessTab('warehouse') && (
              <button
                onClick={() => setActiveTab('warehouse')}
                className={`nav-tab ${activeTab === 'warehouse' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏭</span>
                إدارة المخازن
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('clinic-registration')}
                className={`nav-tab ${activeTab === 'clinic-registration' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">🏥</span>
                تسجيل عيادة
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('order-creation')}
                className={`nav-tab ${activeTab === 'order-creation' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📦</span>
                عمل طلبية
              </button>
            )}
            
            {canAccessTab('visit') && (
              <button
                onClick={() => setActiveTab('visit')}
                className={`nav-tab ${activeTab === 'visit' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📝</span>
                تسجيل زيارة
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('visits')}
              className={`nav-tab ${activeTab === 'visits' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">📋</span>
              سجل الزيارات
            </button>

            {canAccessTab('reports') && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`nav-tab ${activeTab === 'reports' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">📈</span>
                التقارير
              </button>
            )}
            
            {/* Accounting tab for accounting role */}
            {canAccessTab('accounting') && (
              <button
                onClick={() => setActiveTab('accounting')}
                className={`nav-tab ${activeTab === 'accounting' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">💰</span>
                المحاسبة
              </button>
            )}
            
            {/* Chat System for all users */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`nav-tab ${activeTab === 'chat' ? 'active' : ''} flex items-center whitespace-nowrap`}
            >
              <span className="ml-2">💬</span>
              المحادثات
            </button>
            
            {/* System Settings only for Admin */}
            {user.role === 'admin' && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`nav-tab ${activeTab === 'settings' ? 'active' : ''} flex items-center whitespace-nowrap`}
              >
                <span className="ml-2">⚙️</span>
                إعدادات النظام
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && user.role === 'sales_rep' && (
          <SalesRepDashboard />
        )}

        {activeTab === 'dashboard' && user.role !== 'sales_rep' && (
          <EnhancedStatisticsDashboard stats={stats} user={user} />
        )}

        {activeTab === 'clinic-registration' && user.role === 'sales_rep' && (
          <ClinicRegistration />
        )}

        {activeTab === 'order-creation' && user.role === 'sales_rep' && (
          <OrderCreation />
        )}

        {activeTab === 'users' && canAccessTab('users') && (
          <EnhancedUserManagement />
        )}

        {activeTab === 'warehouse' && canAccessTab('warehouse') && (
          <WarehouseManagement />
        )}

        {activeTab === 'visit' && user.role === 'sales_rep' && (
          <VisitRegistration />
        )}

        {activeTab === 'visits' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">سجل الزيارات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الطبيب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      العيادة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المندوب
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(visit.visit_date).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.doctor_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.clinic_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {visit.sales_rep_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          visit.is_effective === null
                            ? 'bg-yellow-100 text-yellow-800'
                            : visit.is_effective
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {visit.is_effective === null
                            ? 'في انتظار المراجعة'
                            : visit.is_effective
                            ? 'مجدية'
                            : 'غير مجدية'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && canAccessTab('reports') && (
          <AdvancedReports />
        )}
        
        {activeTab === 'accounting' && canAccessTab('accounting') && (
          <AccountingDashboard />
        )}
        
        {activeTab === 'chat' && (
          <ChatSystem />
        )}
        
        {activeTab === 'settings' && user.role === 'admin' && (
          <SystemSettings />
        )}
        </div>
      </div>
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleQRScan = async (qrData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/qr/scan`, {
        content: qrData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.action === 'prefill_visit_form') {
        // Navigate to visit registration and prefill
        alert(`تم مسح عيادة: ${response.data.data.name}`);
      } else if (response.data.action === 'add_to_order') {
        // Navigate to order creation and add product
        alert(`تم مسح منتج: ${response.data.data.name}`);
      }
      
      setShowQRScanner(false);
    } catch (error) {
      console.error('QR scan error:', error);
      alert('خطأ في معالجة QR Code');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)' }}>
        <div className="text-center">
          <div className="w-20 h-20 loading-shimmer rounded-full mx-auto mb-6"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '18px' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App" style={{ background: 'var(--gradient-dark)', color: 'var(--text-primary)', minHeight: '100vh' }}>
      {user ? <Dashboard /> : <LoginPage />}
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRCodeScanner 
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
      
      {/* Offline Status */}
      <OfflineStatus />
      
      {/* Floating QR Scanner Button */}
      {user && (
        <button
          onClick={() => setShowQRScanner(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40 flex items-center justify-center"
          title="مسح QR Code"
        >
          <span className="text-xl">📱</span>
        </button>
      )}
    </div>
  );
};

export default App;