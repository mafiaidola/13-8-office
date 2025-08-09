import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ModernProfessionalHeader = ({ 
  user, 
  language, 
  setLanguage, 
  theme, 
  setTheme, 
  isRTL, 
  setIsRTL, 
  onSearch,
  systemSettings,
  onToggleSidebar // New prop for sidebar toggle
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const userMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);

  const API_BASE = process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;

  // Available themes
  const availableThemes = {
    dark: { name: 'Dark Mode', icon: '🌙', class: 'dark' },
    light: { name: 'Light Mode', icon: '☀️', class: 'light' },
    blue: { name: 'Corporate Blue', icon: '💼', class: 'blue' },
    green: { name: 'Medical Green', icon: '🏥', class: 'green' }
  };

  // Available languages
  const availableLanguages = {
    en: { name: 'English', flag: '🇺🇸', dir: 'ltr' },
    ar: { name: 'العربية', flag: '🇪🇬', dir: 'rtl' }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setShowSettingsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load user profile
  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE}/api/users/${user.id}/comprehensive-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUserProfile(response.data.profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (query) => {
    if (!query.trim()) return;
    if (onSearch) {
      onSearch(query);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Get user avatar
  const getUserAvatar = () => {
    if (user?.avatar) return user.avatar;
    const initials = user?.full_name ? 
      user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 
      user?.username?.charAt(0).toUpperCase() || 'U';
    return initials;
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      'admin': 'bg-red-500',
      'gm': 'bg-purple-500',
      'medical_rep': 'bg-green-500',
      'sales_rep': 'bg-blue-500',
      'accounting': 'bg-yellow-500',
      'line_manager': 'bg-orange-500'
    };
    return colors[role] || 'bg-gray-500';
  };

  return (
    <>
      {/* Modern Header */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4">
          
          {/* Left Section - Logo and Sidebar Toggle */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Sidebar Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              title="Toggle Sidebar"
            >
              <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo and System Name */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">Medical Management System</h1>
                <p className="text-xs text-gray-500">Comprehensive Healthcare Solution</p>
              </div>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 rtl:inset-y-0 rtl:right-0 rtl:left-auto pl-3 rtl:pr-3 flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Search patients, clinics, orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute inset-y-0 right-0 rtl:inset-y-0 rtl:left-0 rtl:right-auto pr-3 rtl:pl-3 flex items-center"
                >
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors">
                    Search
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Right Section - Settings and User Menu */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            
            {/* Language Selector */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
                title="Language & Settings"
              >
                <span className="text-lg">{availableLanguages[language]?.flag}</span>
              </button>
              
              {showSettingsMenu && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700">Language & Theme</h3>
                  </div>
                  
                  {/* Languages */}
                  <div className="px-2 py-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1">Language</p>
                    {Object.entries(availableLanguages).map(([code, lang]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code);
                          setIsRTL(lang.dir === 'rtl');
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors ${
                          language === code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 rtl:ml-3 rtl:mr-0">{lang.flag}</span>
                        {lang.name}
                        {language === code && (
                          <svg className="w-4 h-4 ml-auto rtl:mr-auto rtl:ml-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Themes */}
                  <div className="px-2 py-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1">Theme</p>
                    {Object.entries(availableThemes).map(([key, themeOption]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setTheme(key);
                          setShowSettingsMenu(false);
                        }}
                        className={`w-full flex items-center px-2 py-2 text-sm rounded-md transition-colors ${
                          theme === key ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-3 rtl:ml-3 rtl:mr-0">{themeOption.icon}</span>
                        {themeOption.name}
                        {theme === key && (
                          <svg className="w-4 h-4 ml-auto rtl:mr-auto rtl:ml-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group relative">
              <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5z M11.25 3c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9z" />
              </svg>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </button>

            {/* User Profile Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 rtl:space-x-reverse p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.full_name} 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {getUserAvatar()}
                  </div>
                )}
                
                <div className="hidden md:block text-left rtl:text-right">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {user?.full_name || user?.username}
                  </p>
                  <div className="flex items-center">
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 rtl:ml-2 rtl:mr-0 ${getRoleBadgeColor(user?.role)}`}></span>
                    <p className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.full_name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-medium">
                          {getUserAvatar()}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {user?.full_name || user?.username}
                        </h3>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-block w-2 h-2 rounded-full mr-2 rtl:ml-2 rtl:mr-0 ${getRoleBadgeColor(user?.role)}`}></span>
                          <span className="text-xs text-gray-600 capitalize">
                            {user?.role?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowUserMenu(false);
                        loadUserProfile();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      View Profile
                    </button>

                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Account Settings
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 rtl:ml-3 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* User Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3">Loading profile...</span>
                </div>
              ) : userProfile ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    {userProfile.avatar ? (
                      <img 
                        src={userProfile.avatar} 
                        alt={userProfile.full_name} 
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                        {getUserAvatar()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{userProfile.full_name}</h3>
                      <p className="text-gray-600">{userProfile.email}</p>
                      <div className="flex items-center mt-2">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 rtl:ml-2 rtl:mr-0 ${getRoleBadgeColor(userProfile.role)}`}></span>
                        <span className="text-sm text-gray-600 capitalize">
                          {userProfile.role?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600">Username</label>
                          <p className="font-medium">{userProfile.username}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">Phone</label>
                          <p className="font-medium">{userProfile.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">Address</label>
                          <p className="font-medium">{userProfile.address || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Work Information</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600">Employee ID</label>
                          <p className="font-medium">{userProfile.employee_id || 'Not assigned'}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">Department</label>
                          <p className="font-medium">{userProfile.department || 'General'}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600">Status</label>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            userProfile.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {userProfile.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t border-gray-200 pt-6 flex justify-end space-x-3 rtl:space-x-reverse">
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Unable to load profile information.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModernProfessionalHeader;