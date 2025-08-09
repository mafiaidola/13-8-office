// Enhanced Dashboard Component - لوحة التحكم المحسنة
import React from 'react';
import RoleBasedDashboard from './RoleBasedDashboard';

const Dashboard = ({ user, language = 'ar', isRTL = true, setActiveTab }) => {
  console.log('🎯 Dashboard loaded for user:', user?.role, user?.username);
  
  return (
    <RoleBasedDashboard 
      user={user} 
      language={language} 
      isRTL={isRTL}
      setActiveTab={setActiveTab}
    />
  );
};

export default Dashboard;