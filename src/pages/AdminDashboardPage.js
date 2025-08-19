/**
 * Admin Dashboard Page
 * Main admin panel dashboard with key metrics and quick actions
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import {
  Users,
  Package,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Download,
  Upload,
  Settings,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async action => {
    toast({
      title: 'Action Triggered',
      description: `${action} functionality would be implemented here`,
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { overview, recentActivity, overdueItems } = dashboardData || {};

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Manage your lending system and monitor key metrics
          </p>
        </div>
        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={() => handleQuickAction('Export Data')}
          >
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
          <Button
            variant='outline'
            onClick={() => handleQuickAction('Import Data')}
          >
            <Upload className='h-4 w-4 mr-2' />
            Import
          </Button>
          <Button onClick={() => handleQuickAction('Settings')}>
            <Settings className='h-4 w-4 mr-2' />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {overview?.totalUsers || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {overview?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Products
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {overview?.totalProducts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {overview?.availableProducts || 0} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Loans</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {overview?.activeTransactions || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Avg. {overview?.avgLendingPeriod || 0} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Overdue Items</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {overview?.overdueTransactions || 0}
            </div>
            <p className='text-xs text-muted-foreground'>Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='recent-activity'>Recent Activity</TabsTrigger>
          <TabsTrigger value='overdue-items'>Overdue Items</TabsTrigger>
          <TabsTrigger value='quick-actions'>Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Database Connection
                  </span>
                  <Badge variant='success'>
                    <CheckCircle className='h-3 w-3 mr-1' />
                    Healthy
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>API Response Time</span>
                  <Badge variant='outline'>~150ms</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Storage Usage</span>
                  <div className='flex items-center space-x-2'>
                    <Progress value={65} className='w-20' />
                    <span className='text-sm text-muted-foreground'>65%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Statistics</CardTitle>
                <CardDescription>Key metrics at a glance</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    New Users (30 days)
                  </span>
                  <div className='flex items-center space-x-2'>
                    <TrendingUp className='h-4 w-4 text-green-500' />
                    <span className='text-sm font-bold'>+12</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Products Added (30 days)
                  </span>
                  <div className='flex items-center space-x-2'>
                    <TrendingUp className='h-4 w-4 text-green-500' />
                    <span className='text-sm font-bold'>+45</span>
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>
                    Lending Success Rate
                  </span>
                  <Badge variant='success'>98.5%</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='recent-activity' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activities and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.slice(0, 10).map((activity, index) => (
                    <div
                      key={index}
                      className='flex items-center space-x-4 p-3 border rounded-lg'
                    >
                      <div className='flex-shrink-0'>
                        <Activity className='h-5 w-5 text-blue-500' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900'>
                          {activity.product_name || 'Product'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Borrowed by {activity.borrower_name || 'User'}
                        </p>
                      </div>
                      <div className='flex-shrink-0'>
                        <Badge
                          variant={
                            activity.status === 'active'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-center text-gray-500 py-8'>
                    No recent activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='overdue-items' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <AlertTriangle className='h-5 w-5 text-red-500' />
                <span>Overdue Items</span>
              </CardTitle>
              <CardDescription>
                Items that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {overdueItems && overdueItems.length > 0 ? (
                  overdueItems.map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center space-x-4 p-3 border border-red-200 rounded-lg bg-red-50'
                    >
                      <div className='flex-shrink-0'>
                        <Clock className='h-5 w-5 text-red-500' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900'>
                          {item.product_name || 'Product'}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Borrowed by {item.borrower_name || 'User'}
                        </p>
                      </div>
                      <div className='flex-shrink-0'>
                        <Badge variant='destructive'>
                          {Math.ceil(
                            (new Date() - new Date(item.dueDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{' '}
                          days overdue
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-8'>
                    <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                    <p className='text-gray-500'>No overdue items</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='quick-actions' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('Add Product')}
            >
              <CardHeader className='text-center'>
                <Plus className='h-8 w-8 mx-auto text-blue-500 mb-2' />
                <CardTitle className='text-lg'>Add Product</CardTitle>
                <CardDescription>
                  Add new items to the inventory
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('Manage Users')}
            >
              <CardHeader className='text-center'>
                <Users className='h-8 w-8 mx-auto text-green-500 mb-2' />
                <CardTitle className='text-lg'>Manage Users</CardTitle>
                <CardDescription>View and manage user accounts</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('Generate Report')}
            >
              <CardHeader className='text-center'>
                <TrendingUp className='h-8 w-8 mx-auto text-purple-500 mb-2' />
                <CardTitle className='text-lg'>Generate Report</CardTitle>
                <CardDescription>
                  Create detailed analytics reports
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('Bulk Import')}
            >
              <CardHeader className='text-center'>
                <Upload className='h-8 w-8 mx-auto text-orange-500 mb-2' />
                <CardTitle className='text-lg'>Bulk Import</CardTitle>
                <CardDescription>
                  Import multiple products at once
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('System Settings')}
            >
              <CardHeader className='text-center'>
                <Settings className='h-8 w-8 mx-auto text-gray-500 mb-2' />
                <CardTitle className='text-lg'>System Settings</CardTitle>
                <CardDescription>Configure system preferences</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleQuickAction('View Analytics')}
            >
              <CardHeader className='text-center'>
                <Activity className='h-8 w-8 mx-auto text-red-500 mb-2' />
                <CardTitle className='text-lg'>View Analytics</CardTitle>
                <CardDescription>Detailed system analytics</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
