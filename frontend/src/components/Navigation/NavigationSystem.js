// EP Group System - Central Navigation System
// نظام التنقل المركزي

import React, { useState, useEffect } from 'react';
import { 
  SYSTEM_TABS, 
  TAB_GROUPS, 
  getAvailableTabGroups, 
  hasPermission 
} from '../../config/systemConfig.js';

const NavigationSystem = ({ user, activeTab, setActiveTab, language, isRTL }) => {
  const [availableGroups, setAvailableGroups] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    if (user?.role) {
      const groups = getAvailableTabGroups(user.role);
      setAvailableGroups(groups);
      
      // Expand all groups by default
      const expanded = {};
      Object.keys(groups).forEach(groupKey => {
        expanded[groupKey] = true;
      });
      setExpandedGroups(expanded);
    }
  }, [user?.role]);

  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleTabClick = (tabId) => {
    if (hasPermission(user?.role, tabId)) {
      setActiveTab(tabId);
    }
  };

  const getTabDisplayName = (tab) => {
    return language === 'ar' ? tab.name.ar : tab.name.en;
  };

  const getGroupDisplayName = (group) => {
    return language === 'ar' ? group.name.ar : group.name.en;
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

      {/* Navigation Groups */}
      <div className="nav-groups space-y-4">
        {Object.entries(availableGroups).map(([groupKey, group]) => (
          <div key={groupKey} className="nav-group">
            {/* Group Header */}
            <div 
              className="nav-group-header flex items-center justify-between p-3 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {group.tabs[0]?.icon || '📁'}
                </span>
                <span className="font-medium">
                  {getGroupDisplayName(group)}
                </span>
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  {group.tabs.length}
                </span>
              </div>
              <span className={`transform transition-transform ${expandedGroups[groupKey] ? 'rotate-90' : ''}`}>
                ▶️
              </span>
            </div>

            {/* Group Tabs */}
            {expandedGroups[groupKey] && (
              <div className="nav-group-tabs mt-2 space-y-1 pl-4">
                {group.tabs.map((tab) => (
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
            )}
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="quick-access mt-8">
        <h3 className="text-lg font-bold mb-3">
          {language === 'ar' ? 'الوصول السريع' : 'Quick Access'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Most commonly used tabs */}
          {[SYSTEM_TABS.DASHBOARD, SYSTEM_TABS.CLINIC_REGISTRATION].map((tab) => {
            if (!hasPermission(user?.role, tab.id)) return null;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`quick-tab p-3 rounded-lg text-center transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <div className="text-2xl mb-1">{tab.icon}</div>
                <div className="text-xs font-medium">
                  {getTabDisplayName(tab)}
                </div>
              </button>
            );
          })}
        </div>
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
            <strong>{language === 'ar' ? 'الأقسام المتاحة:' : 'Available Sections:'}</strong> {Object.values(availableGroups).reduce((total, group) => total + group.tabs.length, 0)}
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

        .quick-tab:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default NavigationSystem;