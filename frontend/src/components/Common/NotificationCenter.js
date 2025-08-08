// Advanced Notification System - نظام الإشعارات المتقدم
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const NotificationCenter = ({ user, language = 'ar' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: '',
    search: ''
  });
  const [stats, setStats] = useState({});
  const [wsConnection, setWsConnection] = useState(null);
  const dropdownRef = useRef(null);
  const wsRef = useRef(null);

  // Get backend URL from environment
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  // WebSocket connection for real-time notifications
  useEffect(() => {
    if (user?.id) {
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user?.id]);

  const connectWebSocket = () => {
    try {
      const wsUrl = `${backendUrl.replace('http', 'ws')}/api/notifications/ws/${user.id}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected for notifications');
        setWsConnection(ws);
        wsRef.current = ws;
        
        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        
        ws.pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          
          if (event.data === 'pong') return; // Ignore pong responses
          
          // Add new notification to the top of the list
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification if permitted
          showBrowserNotification(notification);
          
          // Play notification sound
          playNotificationSound(notification.priority);
          
        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setWsConnection(null);
        
        // Clear ping interval
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }
        
        // Reconnect after 5 seconds
        setTimeout(() => {
          if (user?.id) {
            connectWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error connecting WebSocket:', error);
    }
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('limit', '50');
      
      const response = await axios.get(`${backendUrl}/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, backendUrl]);

  // Load notification stats
  const loadStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/notifications/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data);
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadStats();
    }
  }, [loadNotifications, loadStats, user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`${backendUrl}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, status: 'read', read_at: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(`${backendUrl}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read', read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Dismiss notification
  const dismissNotification = async (notificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${backendUrl}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification?.status === 'unread' ? prev - 1 : prev;
      });
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification) => {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.notification_id
      });
    }
  };

  // Play notification sound
  const playNotificationSound = (priority) => {
    try {
      const audio = new Audio();
      audio.volume = 0.3;
      
      // Different sounds for different priorities
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent-notification.mp3';
          break;
        case 'high':
          audio.src = '/sounds/high-notification.mp3';
          break;
        default:
          audio.src = '/sounds/notification.mp3';
      }
      
      audio.play().catch(() => {
        // Ignore if audio fails to play
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = () => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const iconMap = {
      order_new: '📦',
      order_approved: '✅',
      order_rejected: '❌',
      debt_warning: '⚠️',
      debt_critical: '🚨',
      visit_reminder: '📅',
      visit_overdue: '⏰',
      stock_low: '📉',
      stock_out: '🔴',
      approval_pending: '⏳',
      task_assigned: '📋',
      task_completed: '✅',
      system_alert: '🔧',
      performance_alert: '📊'
    };
    return iconMap[type] || '🔔';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colorMap = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-500'
    };
    return colorMap[priority] || 'bg-gray-500';
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return language === 'ar' ? 'الآن' : 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}${language === 'ar' ? ' د' : 'm'}`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}${language === 'ar' ? ' س' : 'h'}`;
    return `${Math.floor(diff / 86400000)}${language === 'ar' ? ' ي' : 'd'}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          requestNotificationPermission();
        }}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        title={language === 'ar' ? 'الإشعارات' : 'Notifications'}
      >
        <span className="text-xl">🔔</span>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Connection Status */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-white ${
          wsConnection ? 'bg-green-500' : 'bg-red-500'
        }`} />
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {language === 'ar' ? 'الإشعارات' : 'Notifications'}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  {unreadCount} {language === 'ar' ? 'غير مقروء' : 'unread'}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  >
                    {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="text-xs border rounded px-2 py-1 flex-1"
              >
                <option value="">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
                <option value="order_new">{language === 'ar' ? 'طلبات جديدة' : 'New Orders'}</option>
                <option value="debt_warning">{language === 'ar' ? 'تحذير مديونية' : 'Debt Warning'}</option>
                <option value="visit_reminder">{language === 'ar' ? 'تذكير زيارة' : 'Visit Reminder'}</option>
              </select>
              
              <select
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                className="text-xs border rounded px-2 py-1 flex-1"
              >
                <option value="">{language === 'ar' ? 'كل الأولويات' : 'All Priorities'}</option>
                <option value="urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</option>
                <option value="high">{language === 'ar' ? 'مرتفع' : 'High'}</option>
                <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl mb-2 block">🔔</span>
                <p>{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    notification.status === 'unread' ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon & Priority */}
                    <div className="flex-shrink-0 relative">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(notification.priority)}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm mb-1"
                          style={{color: 'var(--text-primary)'}}>
                        {notification.title}
                      </h4>
                      <p className="text-xs mb-2 line-clamp-2"
                         style={{color: 'var(--text-secondary)'}}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between text-xs"
                           style={{color: 'var(--text-muted)'}}>
                        <span>{formatTime(notification.timestamp || notification.created_at)}</span>
                        <div className="flex gap-1">
                          {notification.status === 'unread' && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="hover:text-blue-600 transition-colors"
                              title={language === 'ar' ? 'تحديد كمقروء' : 'Mark as read'}
                            >
                              ✓
                            </button>
                          )}
                          <button
                            onClick={() => dismissNotification(notification.id)}
                            className="hover:text-red-600 transition-colors"
                            title={language === 'ar' ? 'إلغاء' : 'Dismiss'}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
            <button
              onClick={() => {
                setShowDropdown(false);
                // Navigate to notifications page (to be implemented)
              }}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {language === 'ar' ? 'عرض جميع الإشعارات' : 'View all notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;