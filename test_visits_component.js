// Test script to verify VisitsManagement component loading
// اختبار تحميل مكون إدارة الزيارات

console.log('Testing VisitsManagement component loading...');

// Try to import the component directly
try {
  // Dynamic import test
  import('./frontend/src/components/Visits/VisitsManagement.js')
    .then(module => {
      console.log('✅ VisitsManagement component loaded successfully');
      console.log('Module:', module);
      console.log('Default export exists:', !!module.default);
    })
    .catch(error => {
      console.error('❌ Error loading VisitsManagement component:', error);
    });
} catch (error) {
  console.error('❌ Import error:', error);
}