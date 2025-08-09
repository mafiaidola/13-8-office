import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExcelManager = ({ dataType, title, icon, onImportComplete, className = "" }) => {
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMode, setImportMode] = useState('append');
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const getBackendUrl = () => {
    return process.env.REACT_APP_BACKEND_URL || import.meta.env.VITE_REACT_APP_BACKEND_URL;
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // تصدير البيانات إلى Excel
  const handleExport = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      
      const response = await axios.get(
        `${backendUrl}/api/excel/export/${dataType}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          responseType: 'blob'
        }
      );

      // إنشاء رابط تحميل
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // اسم الملف مع التاريخ
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `تصدير_${title}_${timestamp}.xlsx`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // إشعار نجاح
      alert(`✅ تم تصدير بيانات ${title} بنجاح!`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'حدث خطأ غير معروف';
      alert(`❌ فشل التصدير: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // تحميل مثال للاستيراد
  const handleDownloadTemplate = async () => {
    try {
      setLoading(true);
      const backendUrl = getBackendUrl();
      
      const response = await axios.get(
        `${backendUrl}/api/excel/template/${dataType}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          responseType: 'blob'
        }
      );

      // إنشاء رابط تحميل
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const filename = `مثال_استيراد_${title}.xlsx`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert(`✅ تم تحميل مثال ${title} للاستيراد!`);
      
    } catch (error) {
      console.error('Error downloading template:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'حدث خطأ غير معروف';
      alert(`❌ فشل تحميل المثال: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // معالجة اختيار الملف
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        alert('❌ يجب اختيار ملف Excel (.xlsx أو .xls)');
        event.target.value = '';
      }
    }
  };

  // استيراد البيانات
  const handleImport = async () => {
    if (!selectedFile) {
      alert('⚠️ يرجى اختيار ملف Excel للاستيراد');
      return;
    }

    try {
      setImportLoading(true);
      const backendUrl = getBackendUrl();
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('import_mode', importMode);

      const response = await axios.post(
        `${backendUrl}/api/excel/import/${dataType}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImportResult(response.data);
      
      // إشعار بالنجاح
      alert(`✅ ${response.data.message}\nتم استيراد ${response.data.imported_count} عنصر`);
      
      // إعادة تعيين النموذج
      setSelectedFile(null);
      document.querySelector('input[type="file"]').value = '';
      
      // إشعار المكون الأب بالتحديث
      if (onImportComplete) {
        onImportComplete(response.data);
      }
      
    } catch (error) {
      console.error('Error importing data:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'حدث خطأ غير معروف';
      alert(`❌ فشل الاستيراد: ${errorMessage}`);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className={`excel-manager bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* عنوان القسم */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-lg font-bold text-gray-800">إدارة Excel - {title}</h3>
            <p className="text-sm text-gray-600">تصدير واستيراد بيانات {title}</p>
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات الأساسية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* زر التصدير */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              جاري التصدير...
            </>
          ) : (
            <>
              <span className="ml-2">📊</span>
              تصدير البيانات
            </>
          )}
        </button>

        {/* زر مثال للاستيراد */}
        <button
          onClick={handleDownloadTemplate}
          disabled={loading}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              جاري التحميل...
            </>
          ) : (
            <>
              <span className="ml-2">📝</span>
              مثال للاستيراد
            </>
          )}
        </button>

        {/* زر فتح نافذة الاستيراد */}
        <button
          onClick={() => setShowImportModal(true)}
          className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <span className="ml-2">📥</span>
          استيراد البيانات
        </button>
      </div>

      {/* نافذة الاستيراد المنبثقة */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">استيراد {title}</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* خيارات الاستيراد */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الاستيراد:
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="ml-2"
                  />
                  <div>
                    <div className="font-medium">إضافة البيانات الجديدة</div>
                    <div className="text-xs text-gray-600">الاحتفاظ بالبيانات الحالية وإضافة الجديدة</div>
                  </div>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="importMode"
                    value="overwrite"
                    checked={importMode === 'overwrite'}
                    onChange={(e) => setImportMode(e.target.value)}
                    className="ml-2"
                  />
                  <div>
                    <div className="font-medium text-red-600">استبدال جميع البيانات</div>
                    <div className="text-xs text-red-500">⚠️ سيتم حذف البيانات الحالية</div>
                  </div>
                </label>
              </div>
            </div>

            {/* اختيار الملف */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختيار ملف Excel:
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✅ تم اختيار: {selectedFile.name}
                </div>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!selectedFile || importLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block ml-2"></div>
                    جاري الاستيراد...
                  </>
                ) : (
                  'بدء الاستيراد'
                )}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                إلغاء
              </button>
            </div>

            {/* نتيجة الاستيراد */}
            {importResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800">
                  <div className="font-bold">✅ تم الاستيراد بنجاح!</div>
                  <div>عدد العناصر المستوردة: {importResult.imported_count}</div>
                  <div>الطريقة: {importResult.import_mode === 'append' ? 'إضافة' : 'استبدال'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelManager;