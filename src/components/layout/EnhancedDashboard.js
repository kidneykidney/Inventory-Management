import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DashboardSkeleton } from '../ui/skeleton';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  DollarSign,
  Users,
  ShoppingCart,
  Plus,
  RefreshCw
} from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, color = 'blue' }) => {
  return (
    <Card className="glass-card hover:shadow-xl transition-all duration-300 hover:scale-105">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {label}
        </CardTitle>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
      </CardContent>
    </Card>
  );
};

const QuickActionCard = ({ icon: Icon, title, description, color = 'blue' }) => {
  return (
    <Card className="glass-card hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EnhancedDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setMetrics({
        totalProducts: 1247,
        totalValue: '$124,750',
        lowStock: 23,
        activeOrders: 156,
        totalSuppliers: 42,
        monthlyRevenue: '$85,420'
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Welcome back! Here's what's happening with your inventory.
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <MetricCard
          icon={Package}
          label="Total Products"
          value={metrics.totalProducts?.toLocaleString()}
          color="blue"
        />
        <MetricCard
          icon={DollarSign}
          label="Total Value"
          value={metrics.totalValue}
          color="green"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Low Stock Items"
          value={metrics.lowStock}
          color="yellow"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Active Orders"
          value={metrics.activeOrders}
          color="purple"
        />
        <MetricCard
          icon={Users}
          label="Suppliers"
          value={metrics.totalSuppliers}
          color="indigo"
        />
        <MetricCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={metrics.monthlyRevenue}
          color="green"
        />
      </div>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={Plus}
              title="Add Product"
              description="Create a new product entry"
              color="blue"
            />
            <QuickActionCard
              icon={Package}
              title="Manage Inventory"
              description="Update stock levels and details"
              color="green"
            />
            <QuickActionCard
              icon={Users}
              title="Suppliers"
              description="Manage supplier relationships"
              color="purple"
            />
            <QuickActionCard
              icon={TrendingUp}
              title="Reports"
              description="View analytics and insights"
              color="indigo"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Product added: Gaming Laptop', time: '2 minutes ago', type: 'success' },
              { action: 'Low stock alert: Wireless Mouse', time: '15 minutes ago', type: 'warning' },
              { action: 'Order completed: #12345', time: '1 hour ago', type: 'info' },
              { action: 'Supplier updated: TechCorp Ltd', time: '2 hours ago', type: 'info' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDashboard;
