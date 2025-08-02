// Enhanced Debts and Collection Management - إدارة المديونيات والتحصيل
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../localization/translations.js';
import { activityLogger } from '../../utils/activityLogger.js';
import axios from 'axios';

const DebtsAndCollection = ({ user, language, isRTL }) => {
  const [activeTab, setActiveTab] = useState('my_debts');
  const [debts, setDebts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    payment_method: 'cash',
    notes: ''
  });

  const { t } = useTranslation(language);
  const API = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001') + '/api';
  
  // Role-based access
  const isRep = user?.role === 'medical_rep';
  const isManager = ['manager', 'district_manager', 'gm'].includes(user?.role);
  const isAdmin = ['admin', 'gm'].includes(user?.role);

  useEffect(() => {
    fetchDebtsAndCollections();
    // Log access to debts section
    activityLogger.logSystemAccess('إدارة المديونيات والتحصيل', {
      userRole: user?.role,
      accessType: isRep ? 'rep_view' : 'management_view'
    });
  }, []);

  const fetchDebtsAndCollections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Enhanced mock data for debts (based on approved orders)
      const mockDebts = [
        {
          id: 'debt-001',
          order_id: 'ORD-001',
          rep_id: 'rep-001',
          rep_name: 'محمد أحمد المندوب',
          clinic_name: 'عيادة الدكتور أحمد محمد',
          original_amount: 1500.00,
          paid_amount: 500.00,
          remaining_amount: 1000.00,
          created_at: '2024-01-15T10:30:00Z',
          due_date: '2024-02-15T00:00:00Z',
          status: 'partial_paid',
          payment_location: {
            latitude: 30.0444,
            longitude: 31.2357,
            address: 'المنصورة، مصر'
          },
          payments: [
            {
              id: 'pay-001',
              amount: 500.00,
              payment_date: '2024-01-20T14:30:00Z',
              method: 'cash',
              collected_by: user?.full_name,
              location: {
                latitude: 30.0444,
                longitude: 31.2357,
                address: 'المنصورة، مصر'
              }
            }
          ]
        },
        {
          id: 'debt-002',
          order_id: 'ORD-002',
          rep_id: 'rep-001',
          rep_name: 'محمد أحمد المندوب',
          clinic_name: 'عيادة الدكتورة فاطمة سعد',
          original_amount: 890.00,
          paid_amount: 0.00,
          remaining_amount: 890.00,
          created_at: '2024-01-14T14:20:00Z',
          due_date: '2024-02-14T00:00:00Z',
          status: 'unpaid',
          payments: []
        },
        {
          id: 'debt-003',
          order_id: 'ORD-004',
          rep_id: 'rep-001',
          rep_name: 'محمد أحمد المندوب',
          clinic_name: 'مركز الطب الحديث',
          original_amount: 750.50,
          paid_amount: 750.50,
          remaining_amount: 0.00,
          created_at: '2024-01-12T16:45:00Z',
          due_date: '2024-02-12T00:00:00Z',
          status: 'paid',
          payments: [
            {
              id: 'pay-002',
              amount: 750.50,
              payment_date: '2024-01-18T12:00:00Z',
              method: 'bank_transfer',
              collected_by: user?.full_name,
              location: {
                latitude: 30.0626,
                longitude: 31.2497,
                address: 'القاهرة، مصر'
              }
            }
          ]
        }
      ];

      // Filter debts based on user role
      let filteredDebts = mockDebts;
      if (isRep) {
        filteredDebts = mockDebts.filter(debt => debt.rep_id === user.id);
      }

      setDebts(filteredDebts);
      
      // Calculate statistics
      const totalDebts = filteredDebts.reduce((sum, debt) => sum + debt.original_amount, 0);
      const totalPaid = filteredDebts.reduce((sum, debt) => sum + debt.paid_amount, 0);
      const totalRemaining = filteredDebts.reduce((sum, debt) => sum + debt.remaining_amount, 0);
      const overdueDebts = filteredDebts.filter(debt => 
        debt.remaining_amount > 0 && new Date(debt.due_date) < new Date()
      ).length;

      setStats({
        totalDebts,
        totalPaid,
        totalRemaining,
        overdueDebts,
        totalDebtsCount: filteredDebts.length,
        paidDebtsCount: filteredDebts.filter(debt => debt.status === 'paid').length
      });

      // Set collections (payment history)
      const allPayments = filteredDebts.flatMap(debt => 
        debt.payments.map(payment => ({
          ...payment,
          debt_id: debt.id,
          order_id: debt.order_id,
          clinic_name: debt.clinic_name,
          rep_name: debt.rep_name
        }))
      );
      setCollections(allPayments);

    } catch (error) {
      console.error('Error fetching debts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!selectedDebt || !paymentData.amount) return;
    
    const paymentAmount = parseFloat(paymentData.amount);
    if (paymentAmount > selectedDebt.remaining_amount) {
      alert('المبلغ أكبر من المتبقي');
      return;
    }

    try {
      // Get current location for payment record
      const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          } else {
            reject(new Error('Geolocation not supported'));
          }
        });
      };

      const position = await getCurrentLocation();
      
      const token = localStorage.getItem('access_token');
      const paymentRecord = {
        debt_id: selectedDebt.id,
        amount: paymentAmount,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
        payment_date: new Date().toISOString(),
        collected_by: user.id,
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date().toISOString()
        }
      };

      // Log the payment activity
      await activityLogger.logDebtPayment(selectedDebt.id, paymentAmount, {
        order_id: selectedDebt.order_id,
        clinic_name: selectedDebt.clinic_name,
        payment_method: paymentData.payment_method,
        remaining_after: selectedDebt.remaining_amount - paymentAmount,
        location: paymentRecord.location
      });

      console.log('💰 تم تسجيل دفع مديونية:', paymentRecord);
      
      // Reset form and close modal
      setPaymentData({ amount: '', payment_method: 'cash', notes: '' });
      setShowPaymentModal(false);
      setSelectedDebt(null);
      
      // Refresh data
      await fetchDebtsAndCollections();
      
      alert('تم تسجيل الدفع بنجاح مع الموقع الجغرافي');
      
    } catch (error) {
      console.error('خطأ في تسجيل الدفع:', error);
      alert('حدث خطأ أثناء تسجيل الدفع');
    }
  };

  const getDebtStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'partial_paid': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'unpaid': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'overdue': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'paid': 'مدفوع',
      'partial_paid': 'مدفوع جزئياً',
      'unpaid': 'غير مدفوع',
      'overdue': 'متأخر'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>جاري تحميل بيانات المديونيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="debts-management-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl text-white">💰</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {isRep ? 'مديونياتي وتحصيلي' : 'إدارة المديونيات والتحصيل'}
              </h1>
              <p className="text-lg opacity-75">
                {isRep ? 'عرض المديونيات الخاصة بي فقط' : 'إدارة شاملة لجميع المديونيات'}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-blue-300">{stats.totalDebts?.toFixed(2) || '0.00'}ج.م</div>
            <div className="text-sm opacity-75">إجمالي المديونيات</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-green-300">{stats.totalPaid?.toFixed(2) || '0.00'}ج.م</div>
            <div className="text-sm opacity-75">المحصل</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-orange-300">{stats.totalRemaining?.toFixed(2) || '0.00'}ج.م</div>
            <div className="text-sm opacity-75">المتبقي</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-red-300">{stats.overdueDebts || 0}</div>
            <div className="text-sm opacity-75">متأخرة</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-purple-300">{stats.totalDebtsCount || 0}</div>
            <div className="text-sm opacity-75">عدد المديونيات</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
            <div className="text-2xl font-bold text-teal-300">{stats.paidDebtsCount || 0}</div>
            <div className="text-sm opacity-75">مدفوعة كاملة</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setActiveTab('my_debts')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'my_debts' 
                ? 'bg-green-600 text-white' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            💰 {isRep ? 'مديونياتي' : 'المديونيات'}
          </button>
          
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'collections' 
                ? 'bg-green-600 text-white' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            📊 سجل التحصيل
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'my_debts' && (
        <DebtsList 
          debts={debts}
          onPayment={(debt) => {
            setSelectedDebt(debt);
            setShowPaymentModal(true);
          }}
          getDebtStatusColor={getDebtStatusColor}
          getStatusLabel={getStatusLabel}
          isAdmin={isAdmin}
          canMakePayment={isRep || isAdmin}
        />
      )}

      {activeTab === 'collections' && (
        <CollectionsList 
          collections={collections}
          isAdmin={isAdmin}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedDebt && (
        <PaymentModal
          debt={selectedDebt}
          paymentData={paymentData}
          setPaymentData={setPaymentData}
          onSubmit={handlePayment}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedDebt(null);
            setPaymentData({ amount: '', payment_method: 'cash', notes: '' });
          }}
        />
      )}
    </div>
  );
};

// Debts List Component
const DebtsList = ({ debts, onPayment, getDebtStatusColor, getStatusLabel, isAdmin, canMakePayment }) => {
  if (debts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💰</div>
        <h3 className="text-xl font-bold mb-2">لا توجد مديونيات</h3>
        <p className="text-gray-600">لا توجد مديونيات مسجلة حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {debts.map((debt) => (
        <div key={debt.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-white">{debt.clinic_name}</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDebtStatusColor(debt.status)}`}>
                  {getStatusLabel(debt.status)}
                </span>
              </div>
              
              <p className="text-white/70 mb-1">الطلبية: {debt.order_id}</p>
              <p className="text-white/60 text-sm">المندوب: {debt.rep_name}</p>
              <p className="text-white/60 text-sm">
                التاريخ: {new Date(debt.created_at).toLocaleDateString('ar-EG')}
              </p>
              <p className="text-white/60 text-sm">
                موعد الاستحقاق: {new Date(debt.due_date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
              <div className="text-lg font-bold text-blue-300">{debt.original_amount.toFixed(2)}ج.م</div>
              <div className="text-xs text-blue-200">المبلغ الأصلي</div>
            </div>
            
            <div className="text-center bg-green-500/10 rounded-lg p-3 border border-green-500/20">
              <div className="text-lg font-bold text-green-300">{debt.paid_amount.toFixed(2)}ج.م</div>
              <div className="text-xs text-green-200">المدفوع</div>
            </div>
            
            <div className="text-center bg-orange-500/10 rounded-lg p-3 border border-orange-500/20">
              <div className="text-lg font-bold text-orange-300">{debt.remaining_amount.toFixed(2)}ج.م</div>
              <div className="text-xs text-orange-200">المتبقي</div>
            </div>
          </div>

          {/* Payment History */}
          {debt.payments.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-bold text-white mb-2">سجل المدفوعات:</h4>
              <div className="space-y-2">
                {debt.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-white/70">
                      {new Date(payment.payment_date).toLocaleDateString('ar-EG')} - {payment.method}
                    </span>
                    <span className="text-green-300 font-medium">{payment.amount.toFixed(2)}ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {canMakePayment && debt.remaining_amount > 0 && (
              <button
                onClick={() => onPayment(debt)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                💳 تسجيل دفع
              </button>
            )}
            
            {isAdmin && debt.payment_location && (
              <button
                onClick={() => {
                  const { latitude, longitude } = debt.payment_location;
                  window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                📍 الموقع
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Collections List Component
const CollectionsList = ({ collections, isAdmin }) => {
  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold mb-2">لا توجد عمليات تحصيل</h3>
        <p className="text-gray-600">لا توجد عمليات تحصيل مسجلة</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-2xl font-bold text-white mb-6">سجل التحصيل</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-white/80 font-medium">التاريخ</th>
              <th className="text-right py-3 px-4 text-white/80 font-medium">العيادة</th>
              <th className="text-right py-3 px-4 text-white/80 font-medium">المندوب</th>
              <th className="text-right py-3 px-4 text-white/80 font-medium">المبلغ</th>
              <th className="text-right py-3 px-4 text-white/80 font-medium">الطريقة</th>
              {isAdmin && (
                <th className="text-right py-3 px-4 text-white/80 font-medium">الموقع</th>
              )}
            </tr>
          </thead>
          <tbody>
            {collections.map((collection) => (
              <tr key={collection.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-3 px-4 text-white">
                  {new Date(collection.payment_date).toLocaleDateString('ar-EG')}
                </td>
                <td className="py-3 px-4 text-white">{collection.clinic_name}</td>
                <td className="py-3 px-4 text-white/70">{collection.rep_name}</td>
                <td className="py-3 px-4">
                  <span className="text-green-300 font-medium">{collection.amount.toFixed(2)}ج.م</span>
                </td>
                <td className="py-3 px-4 text-white/70">{collection.method}</td>
                {isAdmin && (
                  <td className="py-3 px-4">
                    {collection.location ? (
                      <button
                        onClick={() => {
                          const { latitude, longitude } = collection.location;
                          window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
                        }}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        📍 عرض
                      </button>
                    ) : (
                      <span className="text-gray-500">غير متوفر</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Payment Modal Component
const PaymentModal = ({ debt, paymentData, setPaymentData, onSubmit, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white">تسجيل دفع</h3>
              <p className="text-white/70">{debt.clinic_name}</p>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl">✕</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                المبلغ المدفوع (الحد الأقصى: {debt.remaining_amount.toFixed(2)}ج.م)
              </label>
              <input
                type="number"
                step="0.01"
                max={debt.remaining_amount}
                value={paymentData.amount}
                onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">طريقة الدفع</label>
              <select
                value={paymentData.payment_method}
                onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              >
                <option value="cash" className="text-black">نقداً</option>
                <option value="bank_transfer" className="text-black">تحويل بنكي</option>
                <option value="check" className="text-black">شيك</option>
                <option value="credit_card" className="text-black">بطاقة ائتمان</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">ملاحظات</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                rows="3"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white resize-none"
                placeholder="ملاحظات إضافية..."
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                🔒 سيتم تسجيل الموقع الجغرافي مع الدفع (مخفي عن المندوب)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                تسجيل الدفع
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DebtsAndCollection;