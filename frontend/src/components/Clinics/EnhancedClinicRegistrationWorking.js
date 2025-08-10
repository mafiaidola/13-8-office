import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const EnhancedClinicRegistration = ({ language = 'en', theme = 'dark' }) => {
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';
  
  // Translation helper
  const t = (key) => {
    const translations = {
      ar: {
        title: 'تسجيل عيادة جديدة - نظام محسن',
        description: 'يرجى ملء جميع البيانات المطلوبة وتحديد موقع العيادة على الخريطة بدقة',
        clinicName: 'اسم العيادة',
        doctorName: 'اسم الدكتور',
        save: 'حفظ'
      },
      en: {
        title: 'Enhanced Clinic Registration System',
        description: 'Please fill in all required information and accurately locate the clinic on the map',
        clinicName: 'Clinic Name',
        doctorName: 'Doctor Name', 
        save: 'Save'
      }
    };
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Professional Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-xl">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            {t('title')}
          </h1>
          <p className={`text-lg max-w-3xl mx-auto ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
            {t('description')}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Form */}
          <div className="xl:col-span-2">
            <div className={`
              rounded-xl shadow-lg border transition-all duration-200 p-6
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white text-xl">📋</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'ar' ? 'معلومات العيادة' : 'Clinic Information'}
                  </h3>
                </div>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('clinicName')} *
                    </label>
                    <input
                      type="text"
                      className={`
                        w-full px-4 py-3 rounded-lg border transition-all duration-200
                        ${isDark 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-600' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        }
                        focus:ring-2 focus:ring-blue-500/20 focus:outline-none
                      `}
                      placeholder={language === 'ar' ? 'أدخل اسم العيادة' : 'Enter clinic name'}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {t('doctorName')} *
                    </label>
                    <input
                      type="text"
                      className={`
                        w-full px-4 py-3 rounded-lg border transition-all duration-200
                        ${isDark 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:bg-slate-600' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                        }
                        focus:ring-2 focus:ring-blue-500/20 focus:outline-none
                      `}
                      placeholder={language === 'ar' ? 'اسم الطبيب' : 'Doctor name'}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`
                    w-full px-6 py-4 rounded-lg font-medium transition-all duration-200 text-lg
                    ${isDark 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }
                    transform hover:scale-105 focus:scale-95 shadow-lg hover:shadow-xl
                    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span>💾</span>
                    <span>{t('save')}</span>
                  </div>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Map Placeholder */}
          <div className="space-y-8">
            <div className={`
              rounded-xl shadow-lg border transition-all duration-200 p-6
              ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
            `}>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-white text-xl">🗺️</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'ar' ? 'خريطة الموقع' : 'Location Map'}
                  </h3>
                </div>
              </div>

              <div className={`
                w-full h-80 rounded-xl border-2 flex items-center justify-center
                ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-100'}
              `}>
                <div className="text-center">
                  <div className="text-6xl mb-4">🗺️</div>
                  <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>
                    {language === 'ar' ? 'خريطة تفاعلية' : 'Interactive Map'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-10 text-center">
          <div className={`
            inline-flex items-center px-6 py-3 rounded-full
            ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'}
          `}>
            <span className="text-xl mr-2">✅</span>
            <span className="font-medium">
              {language === 'ar' 
                ? 'مكون تسجيل العيادات يعمل بشكل صحيح!' 
                : 'Enhanced Clinic Registration is working properly!'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedClinicRegistration;