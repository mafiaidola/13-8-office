// Component Registry - سجل المكونات المركزي
import React from 'react';

// Import all components
import Dashboard from '../Dashboard/Dashboard';
import UserManagement from '../Users/UserManagement';
import ProfessionalUserManagement from '../Users/ProfessionalUserManagement';
import ProfessionalAccountingSystem from '../Accounting/ProfessionalAccountingSystem';
import EnhancedProfessionalAccountingSystem from '../Accounting/EnhancedProfessionalAccountingSystem';
import EnhancedClinicRegistrationAdvanced from '../Clinics/EnhancedClinicRegistrationAdvanced';
import ProfessionalClinicProfile from '../Clinics/ProfessionalClinicProfile';
import ClinicsManagement from '../Clinics/ClinicsManagement';
import EnhancedVisitsManagement from '../Visits/EnhancedVisitsManagement';
import AdvancedVisitsManagement from '../Visits/AdvancedVisitsManagement';
import ProductManagement from '../Products/ProductManagement';
import IntegratedFinancialDashboard from '../Financial/IntegratedFinancialDashboard';
import ExcelDashboard from '../Excel/ExcelDashboard';
import LinesAreasManagement from '../Geographic/LinesAreasManagement';
import EnhancedLinesAreasManagement from '../Geographic/EnhancedLinesAreasManagement';
import EnhancedProfessionalClinicsManagement from '../Clinics/EnhancedProfessionalClinicsManagement.js';
import WarehouseManagement from '../Warehouses/WarehouseManagement';
import EnhancedActivityTracking from '../ActivityTracking/EnhancedActivityTracking';
import SuperAdminActivityDashboard from '../ActivityTracking/SuperAdminActivityDashboard';
import Settings from '../Settings/Settings';

// Component Registry Object
const COMPONENT_REGISTRY = {
  // Core Components
  'Dashboard': Dashboard,
  
  // User Management
  'UserManagement': UserManagement,
  'ProfessionalUserManagement': ProfessionalUserManagement,
  
  // Accounting System
  'ProfessionalAccountingSystem': ProfessionalAccountingSystem,
  'EnhancedProfessionalAccountingSystem': EnhancedProfessionalAccountingSystem,
  
  // Clinic Management
  'EnhancedClinicRegistrationAdvanced': EnhancedClinicRegistrationAdvanced,
  'ProfessionalClinicProfile': ProfessionalClinicProfile,
  'ClinicsManagement': ClinicsManagement,
  
  // Visits Management
  'EnhancedVisitsManagement': EnhancedVisitsManagement,
  'AdvancedVisitsManagement': AdvancedVisitsManagement,
  
  // Product Management
  'ProductManagement': ProductManagement,
  
  // Financial Management
  'IntegratedFinancialDashboard': IntegratedFinancialDashboard,
  
  // Excel Management
  'ExcelDashboard': ExcelDashboard,
  
  // Geographic Management
  'LinesAreasManagement': LinesAreasManagement,
  'EnhancedLinesAreasManagement': EnhancedLinesAreasManagement,
  
  // Warehouse Management
  'WarehouseManagement': WarehouseManagement,
  
  // Activity Tracking & Monitoring
  'EnhancedActivityTracking': EnhancedActivityTracking,
  'SuperAdminActivityDashboard': SuperAdminActivityDashboard,
  
  // System Settings
  'Settings': Settings
};

/**
 * Dynamic Component Renderer
 * @param {string} componentName - Name of the component to render
 * @param {object} props - Props to pass to the component
 * @returns {React.Component} - The rendered component
 */
export const renderComponent = (componentName, props = {}) => {
  const Component = COMPONENT_REGISTRY[componentName];
  
  if (!Component) {
    console.error(`Component "${componentName}" not found in registry`);
    return (
      <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4 text-red-500">❌</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            خطأ في تحميل المكون
          </h3>
          <p className="text-red-600">
            المكون "{componentName}" غير موجود في السجل
          </p>
        </div>
      </div>
    );
  }
  
  return <Component {...props} />;
};

/**
 * Get all registered component names
 * @returns {Array<string>} - Array of component names
 */
export const getRegisteredComponents = () => {
  return Object.keys(COMPONENT_REGISTRY);
};

/**
 * Check if component is registered
 * @param {string} componentName - Name of the component to check
 * @returns {boolean} - Whether the component is registered
 */
export const isComponentRegistered = (componentName) => {
  return COMPONENT_REGISTRY.hasOwnProperty(componentName);
};

/**
 * Register a new component dynamically
 * @param {string} name - Component name
 * @param {React.Component} component - Component to register
 */
export const registerComponent = (name, component) => {
  if (COMPONENT_REGISTRY[name]) {
    console.warn(`Component "${name}" is already registered. Overwriting...`);
  }
  COMPONENT_REGISTRY[name] = component;
  console.log(`Component "${name}" registered successfully`);
};

/**
 * Unregister a component
 * @param {string} name - Component name to unregister
 */
export const unregisterComponent = (name) => {
  if (COMPONENT_REGISTRY[name]) {
    delete COMPONENT_REGISTRY[name];
    console.log(`Component "${name}" unregistered successfully`);
  } else {
    console.warn(`Component "${name}" is not registered`);
  }
};

export default COMPONENT_REGISTRY;