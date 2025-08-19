import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';

// Layout components (keep these loaded immediately)
import EnhancedDashboard from './components/layout/EnhancedDashboard';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

// Lazy load pages for code splitting
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const InventoryPage = React.lazy(() => import('./pages/InventoryPage'));
const LendingSystemPage = React.lazy(() => import('./pages/LendingSystemPage'));
const ProductsPage = React.lazy(() => import('./pages/ProductsPage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const SuppliersPage = React.lazy(() => import('./pages/SuppliersPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const AgileBacklogPage = React.lazy(() => import('./pages/AgileBacklogPage'));
const SprintPlanningPage = React.lazy(() => import('./pages/SprintPlanningPage'));
const TechnicalDebtPage = React.lazy(() => import('./pages/TechnicalDebtPage'));
const StakeholderDashboardPage = React.lazy(() => import('./pages/StakeholderDashboardPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const AdminPanelPage = React.lazy(() => import('./pages/AdminPanelPage'));

// Error handling and utilities
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProviderWrapper } from './utils/ThemeContext';
import ToastProvider from './components/ui/toast-provider';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
);

// Utilities
import { logger } from './utils/logger';
const performanceTracker = require('./utils/performanceTracker');

// Global styles
import './styles/global.css';

/**
 * Main App component
 * Handles routing and authentication state
 * @returns {JSX.Element} App component
 */
function App() {
  // Skip login by default
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);

  // Log application start and initialize performance tracking
  React.useEffect(() => {
    logger.info('Inventory Management System initialized');
    
    // Initialize performance tracking
    performanceTracker.init();
    
    // Track initial page load
    performanceTracker.trackUserInteraction('app_start', document.body);
  }, []);

  // Authentication handlers
  const login = () => {
    logger.info('User logged in');
    setIsAuthenticated(true);
  };

  const logout = () => {
    logger.info('User logged out');
    setIsAuthenticated(false);
  };

  return (
    <ThemeProviderWrapper>
      <CssBaseline />
      <ErrorBoundary>
        <Router>
          {!isAuthenticated ? (
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path='*' element={<LoginPage onLogin={login} />} />
              </Routes>
            </Suspense>
          ) : (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
              <Navbar onLogout={logout} />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                  <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                      <Route path='/' element={<EnhancedDashboard />} />
                      <Route path='/inventory' element={<InventoryPage />} />
                      <Route path='/lending' element={<LendingSystemPage />} />
                      <Route path='/products' element={<ProductsPage />} />
                      <Route path='/orders' element={<OrdersPage />} />
                      <Route path='/suppliers' element={<SuppliersPage />} />
                      <Route path='/reports' element={<ReportsPage />} />
                      <Route path='/settings' element={<SettingsPage />} />
                      <Route path='/profile' element={<ProfilePage />} />
                      <Route path='/agile' element={<AgileBacklogPage />} />
                      <Route
                        path='/sprint-planning'
                        element={<SprintPlanningPage />}
                      />
                      <Route path='/technical-debt' element={<TechnicalDebtPage />} />
                      <Route path='/stakeholder-dashboard' element={<StakeholderDashboardPage />} />
                      <Route path='/analytics' element={<AnalyticsPage />} />
                      <Route path='/admin' element={<AdminPanelPage />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </div>
          )}
        </Router>
      </ErrorBoundary>
    </ThemeProviderWrapper>
  );
}

export default App;
