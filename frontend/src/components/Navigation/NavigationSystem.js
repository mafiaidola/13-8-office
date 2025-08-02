// EP Group System - Central Navigation System
// نظام التنقل المركزي

import React, { useState, useEffect } from 'react';
import { 
  SYSTEM_TABS, 
  getAvailableTabs, 
  hasPermission 
} from '../../config/systemConfig.js';

const NavigationSystem = ({ user, activeTab, setActiveTab, language, isRTL }) => {
  const [availableTabs, setAvailableTabs] = useState([]);

  useEffect(() => {
    if (user?.role) {
      const tabs = getAvailableTabs(user.role);
      setAvailableTabs(tabs);
    }
  }, [user?.role]);

  const handleTabClick = (tabId) => {
    if (hasPermission(user?.role, tabId)) {
      setActiveTab(tabId);
    }
  };

  const getTabDisplayName = (tab) => {
    return language === 'ar' ? tab.name.ar : tab.name.en;
  };

  if (!user) return null;

  return (
    <div className="navigation-system">
      {/* Navigation Header */}
      <div className="nav-header mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🧭</span>
          <span>{language === 'ar' ? 'نظام التنقل' : 'Navigation System'}</span>
        </h2>
        <div className="text-sm opacity-75">
          {language === 'ar' ? `مرحباً ${user.full_name || user.username}` : `Welcome ${user.full_name || user.username}`}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs space-y-2">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`nav-tab w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                : 'bg-white/5 hover:bg-white/10 hover:transform hover:translate-x-1'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <div className="flex-1">
              <div className="font-medium">{getTabDisplayName(tab)}</div>
              {tab.description && (
                <div className="text-xs opacity-75 mt-1">
                  {language === 'ar' ? tab.description.ar : tab.description.en}
                </div>
              )}
            </div>
            {activeTab === tab.id && (
              <span className="text-sm">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* User Role Info */}
      <div className="user-info mt-6 p-4 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span>👤</span>
          <span className="font-medium">
            {language === 'ar' ? 'معلومات المستخدم' : 'User Information'}
          </span>
        </div>
        <div className="text-sm space-y-1">
          <div>
            <strong>{language === 'ar' ? 'الاسم:' : 'Name:'}</strong> {user.full_name || user.username}
          </div>
          <div>
            <strong>{language === 'ar' ? 'الدور:' : 'Role:'}</strong> {user.role}
          </div>
          <div>
            <strong>{language === 'ar' ? 'الأقسام المتاحة:' : 'Available Sections:'}</strong> {availableTabs.length}
          </div>
        </div>
      </div>

      <style jsx>{`
        .navigation-system {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-tab:hover {
          transform: translateX(${isRTL ? '-4px' : '4px'});
        }

        .nav-tab.active {
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

export default NavigationSystem;