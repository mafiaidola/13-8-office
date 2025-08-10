import React, { useState, useMemo } from 'react';
import { SYSTEM_TABS, getAvailableTabs } from '../../config/systemConfig';

const ModernSidebar = ({ 
  isCollapsed, 
  toggleSidebar, 
  activeTab, 
  switchTab, 
  currentUser, 
  isRTL = false,  // Default to LTR (English)
  language = 'en' // Default to English
}) => {
  const [expandedSections, setExpandedSections] = useState({});

  // Get available tabs for current user
  const availableTabs = useMemo(() => {
    return getAvailableTabs(currentUser?.role || 'admin');
  }, [currentUser?.role]);

  // Group tabs by category
  const groupedTabs = useMemo(() => {
    const groups = {
      core: { 
        title: language === 'ar' ? 'العمليات الأساسية' : 'Core Operations', 
        icon: '🏠', 
        items: [] 
      },
      clinical: { 
        title: language === 'ar' ? 'العمليات الطبية' : 'Clinical Operations', 
        icon: '🏥', 
        items: [] 
      },
      financial: { 
        title: language === 'ar' ? 'الإدارة المالية' : 'Financial Management', 
        icon: '💰', 
        items: [] 
      },
      inventory: { 
        title: language === 'ar' ? 'المخزون والمنتجات' : 'Inventory & Products', 
        icon: '📦', 
        items: [] 
      },
      analytics: { 
        title: language === 'ar' ? 'التحليلات والتقارير' : 'Analytics & Reports', 
        icon: '📊', 
        items: [] 
      },
      system: { 
        title: language === 'ar' ? 'إدارة النظام' : 'System Management', 
        icon: '⚙️', 
        items: [] 
      }
    };

    availableTabs.forEach(tab => {
      const tabData = {
        id: tab.id,
        title: tab.name[language] || tab.name.en || tab.id,
        icon: tab.icon,
        path: tab.path,
        description: tab.description[language] || tab.description.en || ''
      };

      // Categorize tabs
      if (['dashboard'].includes(tab.id)) {
        groups.core.items.push(tabData);
      } else if (['clinic_registration', 'clinics_management', 'visits', 'lines_areas'].includes(tab.id)) {
        groups.clinical.items.push(tabData);
      } else if (['integrated_financial', 'accounting', 'debt_collection_management'].includes(tab.id)) {
        groups.financial.items.push(tabData);
      } else if (['products', 'orders', 'warehouses'].includes(tab.id)) {
        groups.inventory.items.push(tabData);
      } else if (['analytics', 'activity_tracking'].includes(tab.id)) {
        groups.analytics.items.push(tabData);
      } else if (['users', 'system_management', 'excel_management'].includes(tab.id)) {
        groups.system.items.push(tabData);
      } else {
        // Default to core for uncategorized items
        groups.core.items.push(tabData);
      }
    });

    // Remove empty groups
    return Object.fromEntries(
      Object.entries(groups).filter(([_, group]) => group.items.length > 0)
    );
  }, [availableTabs, language]);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  return (
    <div className={`
      fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-sm
      transition-all duration-300 ease-in-out z-40
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <svg 
            className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Content */}
      <div className="overflow-y-auto h-full pb-6">
        <div className="p-2">
          
          {Object.entries(navigationSections).map(([sectionId, section]) => {
            const hasVisibleItems = section.items.some(item => hasPermission(item));
            if (!hasVisibleItems) return null;

            return (
              <div key={sectionId} className="mb-6">
                
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(sectionId)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm font-medium
                    text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg
                    transition-all duration-200
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? section.title : ''}
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{section.icon}</span>
                    {!isCollapsed && <span>{section.title}</span>}
                  </div>
                  {!isCollapsed && (
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedSections[sectionId] ? 'rotate-90' : ''
                      }`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>

                {/* Section Items */}
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${(expandedSections[sectionId] && !isCollapsed) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                  ${isCollapsed ? 'hidden' : ''}
                `}>
                  <div className="mt-2 ml-6 space-y-1">
                    {section.items.map((item) => {
                      if (!hasPermission(item)) return null;

                      const isActive = activeTab === item.id;
                      const isHovered = hoveredTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => onTabChange(item.id)}
                          onMouseEnter={() => setHoveredTab(item.id)}
                          onMouseLeave={() => setHoveredTab(null)}
                          className={`
                            w-full flex items-center px-3 py-2 text-sm rounded-lg
                            transition-all duration-200 group relative
                            ${isActive 
                              ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' 
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }
                          `}
                          title={item.description}
                        >
                          <span className={`text-base mr-3 transition-transform duration-200 ${
                            isActive || isHovered ? 'scale-110' : ''
                          }`}>
                            {item.icon}
                          </span>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{item.title}</div>
                            {isHovered && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.description}
                              </div>
                            )}
                          </div>
                          
                          {isActive && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Collapsed Mode - Items on Hover */}
                {isCollapsed && (
                  <div className="space-y-1 mt-2">
                    {section.items.map((item) => {
                      if (!hasPermission(item)) return null;

                      const isActive = activeTab === item.id;

                      return (
                        <div key={item.id} className="relative group">
                          <button
                            onClick={() => onTabChange(item.id)}
                            className={`
                              w-full flex items-center justify-center p-3 rounded-lg
                              transition-all duration-200 relative
                              ${isActive 
                                ? 'bg-blue-50 text-blue-700' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              }
                            `}
                            title={item.title}
                          >
                            <span className="text-lg">{item.icon}</span>
                            {isActive && (
                              <div className="absolute right-0 w-1 h-6 bg-blue-600 rounded-l"></div>
                            )}
                          </button>

                          {/* Tooltip on Hover */}
                          <div className="
                            absolute left-full ml-2 top-1/2 transform -translate-y-1/2
                            bg-gray-900 text-white text-sm px-3 py-2 rounded-lg
                            opacity-0 group-hover:opacity-100 pointer-events-none
                            transition-opacity duration-200 whitespace-nowrap z-50
                          ">
                            <div className="font-medium">{item.title}</div>
                            <div className="text-xs text-gray-300 mt-1">{item.description}</div>
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">System Online</span>
            </div>
          )}
          
          <button
            className={`
              p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200
              ${isCollapsed ? '' : 'ml-auto'}
            `}
            title="System Status"
          >
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModernSidebar;