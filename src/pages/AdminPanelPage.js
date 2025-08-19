/**
 * Admin Panel Page
 * Main admin interface with navigation and component management
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart3,
  Settings,
  Shield,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import AdminDashboardPage from './AdminDashboardPage';
import ProductManagement from '../components/admin/ProductManagement';
import UserManagement from '../components/admin/UserManagement';
import ReportingDashboard from '../components/admin/ReportingDashboard';

const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch('/api/v1/auth/user', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to verify user');
      }

      const data = await response.json();
      const user = data.user;

      if (user.role !== 'admin') {
        toast({
          title: 'Access Denied',
          description: "You don't have permission to access the admin panel",
          variant: 'destructive',
        });
        // Redirect to main app or show error
        window.location.href = '/';
        return;
      }

      setUserRole(user.role);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify admin access',
        variant: 'destructive',
      });
      // Redirect to login
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Card className='w-96'>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Shield className='h-5 w-5 text-red-500' />
              <span>Access Denied</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                You don't have permission to access the admin panel. Please
                contact your administrator.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Admin Header */}
      <div className='bg-white border-b border-gray-200'>
        <div className='px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Shield className='h-6 w-6 text-blue-600' />
                <h1 className='text-xl font-bold text-gray-900'>Admin Panel</h1>
              </div>
              <Badge variant='default'>
                <CheckCircle className='h-3 w-3 mr-1' />
                Administrator
              </Badge>
            </div>
            <div className='flex items-center space-x-4'>
              <div className='text-sm text-gray-600'>
                System Status:{' '}
                <span className='text-green-600 font-medium'>Healthy</span>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => (window.location.href = '/')}
              >
                Back to App
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className='p-6'>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-5'>
            <TabsTrigger
              value='dashboard'
              className='flex items-center space-x-2'
            >
              <LayoutDashboard className='h-4 w-4' />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value='products'
              className='flex items-center space-x-2'
            >
              <Package className='h-4 w-4' />
              <span>Products</span>
            </TabsTrigger>
            <TabsTrigger value='users' className='flex items-center space-x-2'>
              <Users className='h-4 w-4' />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger
              value='reports'
              className='flex items-center space-x-2'
            >
              <BarChart3 className='h-4 w-4' />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger
              value='settings'
              className='flex items-center space-x-2'
            >
              <Settings className='h-4 w-4' />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value='dashboard' className='space-y-6'>
            <AdminDashboardPage />
          </TabsContent>

          <TabsContent value='products' className='space-y-6'>
            <ProductManagement />
          </TabsContent>

          <TabsContent value='users' className='space-y-6'>
            <UserManagement />
          </TabsContent>

          <TabsContent value='reports' className='space-y-6'>
            <ReportingDashboard />
          </TabsContent>

          <TabsContent value='settings' className='space-y-6'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              {/* System Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <Settings className='h-5 w-5' />
                    <span>System Configuration</span>
                  </CardTitle>
                  <CardDescription>
                    Manage global system settings
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Default Lending Period</p>
                      <p className='text-sm text-gray-500'>
                        Default number of days for lending
                      </p>
                    </div>
                    <Badge variant='outline'>30 days</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Auto Approval</p>
                      <p className='text-sm text-gray-500'>
                        Automatically approve lending requests
                      </p>
                    </div>
                    <Badge variant='secondary'>Disabled</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Email Reminders</p>
                      <p className='text-sm text-gray-500'>
                        Send automated email reminders
                      </p>
                    </div>
                    <Badge variant='success'>Enabled</Badge>
                  </div>
                  <Button className='w-full'>Configure Settings</Button>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center space-x-2'>
                    <Activity className='h-5 w-5' />
                    <span>System Health</span>
                  </CardTitle>
                  <CardDescription>
                    Monitor system performance and status
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Database Status</p>
                      <p className='text-sm text-gray-500'>
                        Connection and performance
                      </p>
                    </div>
                    <Badge variant='success'>
                      <CheckCircle className='h-3 w-3 mr-1' />
                      Healthy
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>API Response Time</p>
                      <p className='text-sm text-gray-500'>
                        Average response time
                      </p>
                    </div>
                    <Badge variant='outline'>~150ms</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Email Service</p>
                      <p className='text-sm text-gray-500'>
                        Email delivery status
                      </p>
                    </div>
                    <Badge variant='success'>
                      <CheckCircle className='h-3 w-3 mr-1' />
                      Operational
                    </Badge>
                  </div>
                  <Button variant='outline' className='w-full'>
                    View Detailed Logs
                  </Button>
                </CardContent>
              </Card>

              {/* Backup & Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle>Backup & Maintenance</CardTitle>
                  <CardDescription>
                    System backup and maintenance operations
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Last Backup</p>
                      <p className='text-sm text-gray-500'>
                        Database backup status
                      </p>
                    </div>
                    <Badge variant='success'>Today 2:00 AM</Badge>
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='font-medium'>Maintenance Mode</p>
                      <p className='text-sm text-gray-500'>
                        System maintenance status
                      </p>
                    </div>
                    <Badge variant='secondary'>Disabled</Badge>
                  </div>
                  <div className='space-y-2'>
                    <Button variant='outline' className='w-full'>
                      Create Backup
                    </Button>
                    <Button variant='outline' className='w-full'>
                      Schedule Maintenance
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* User Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Admin Activity</CardTitle>
                  <CardDescription>
                    Latest administrative actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    <div className='flex items-center space-x-3 text-sm'>
                      <Badge variant='outline'>INFO</Badge>
                      <span>System backup completed successfully</span>
                      <span className='text-gray-500 ml-auto'>2 hours ago</span>
                    </div>
                    <div className='flex items-center space-x-3 text-sm'>
                      <Badge variant='outline'>ACTION</Badge>
                      <span>User permissions updated</span>
                      <span className='text-gray-500 ml-auto'>4 hours ago</span>
                    </div>
                    <div className='flex items-center space-x-3 text-sm'>
                      <Badge variant='outline'>INFO</Badge>
                      <span>New product category created</span>
                      <span className='text-gray-500 ml-auto'>1 day ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanelPage;
