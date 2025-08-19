import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

const RealTimeMonitoringDashboard = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [realtimeData, setRealtimeData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    startRealTimeMonitoring();
    return () => stopRealTimeMonitoring();
  }, []);

  const startRealTimeMonitoring = () => {
    setIsConnected(true);
    fetchSystemHealth();

    // Update every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchSystemHealth();
      fetchRealtimeMetrics();
    }, 30000);
  };

  const stopRealTimeMonitoring = () => {
    setIsConnected(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/v1/lending-analytics/performance', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch system health');
      }

      const data = await response.json();
      setSystemHealth(data.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealtimeMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `/api/v1/lending-analytics/usage-statistics?startDate=${today}&endDate=${today}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch realtime metrics');
      }

      const data = await response.json();

      // Add timestamp and update realtime data
      const newDataPoint = {
        timestamp: new Date().toLocaleTimeString(),
        ...(data.data[0] || {
          total_lendings: 0,
          unique_borrowers: 0,
          unique_products: 0,
          returned_count: 0,
          overdue_count: 0,
        }),
      };

      setRealtimeData(prev => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });

      // Generate alerts based on data
      generateAlerts(newDataPoint);
    } catch (err) {
      console.error('Failed to fetch realtime metrics:', err);
    }
  };

  const generateAlerts = data => {
    const newAlerts = [];
    const now = new Date();

    // High overdue count alert
    if (data.overdue_count > 5) {
      newAlerts.push({
        id: `overdue-${now.getTime()}`,
        type: 'warning',
        title: 'High Overdue Count',
        message: `${data.overdue_count} items are currently overdue`,
        timestamp: now,
      });
    }

    // Low return rate alert
    const returnRate =
      data.total_lendings > 0
        ? (data.returned_count / data.total_lendings) * 100
        : 0;
    if (returnRate < 80 && data.total_lendings > 0) {
      newAlerts.push({
        id: `return-rate-${now.getTime()}`,
        type: 'error',
        title: 'Low Return Rate',
        message: `Return rate is ${returnRate.toFixed(1)}% - below 80% threshold`,
        timestamp: now,
      });
    }

    // High activity alert
    if (data.total_lendings > 20) {
      newAlerts.push({
        id: `high-activity-${now.getTime()}`,
        type: 'info',
        title: 'High Activity',
        message: `${data.total_lendings} lendings today - above normal activity`,
        timestamp: now,
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => {
        const updated = [...prev, ...newAlerts];
        // Keep only last 10 alerts
        return updated.slice(-10);
      });
    }
  };

  const getHealthStatus = () => {
    if (!systemHealth) return { status: 'unknown', color: 'gray' };

    const returnRate = systemHealth.system.return_rate || 0;
    const onTimeRate = systemHealth.system.on_time_return_rate || 0;

    if (returnRate >= 95 && onTimeRate >= 90) {
      return { status: 'excellent', color: 'green' };
    } else if (returnRate >= 85 && onTimeRate >= 80) {
      return { status: 'good', color: 'blue' };
    } else if (returnRate >= 75 && onTimeRate >= 70) {
      return { status: 'fair', color: 'yellow' };
    } else {
      return { status: 'poor', color: 'red' };
    }
  };

  const healthStatus = getHealthStatus();

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex items-center space-x-2'>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <span>Initializing real-time monitoring...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Real-Time System Monitoring</h1>
          <p className='text-muted-foreground'>
            Live monitoring of lending system health and performance
          </p>
        </div>
        <div className='flex items-center space-x-4'>
          <div className='flex items-center space-x-2'>
            {isConnected ? (
              <>
                <Wifi className='h-4 w-4 text-green-500' />
                <span className='text-sm text-green-500'>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className='h-4 w-4 text-red-500' />
                <span className='text-sm text-red-500'>Disconnected</span>
              </>
            )}
          </div>
          <Button
            onClick={
              isConnected ? stopRealTimeMonitoring : startRealTimeMonitoring
            }
            variant={isConnected ? 'destructive' : 'default'}
          >
            {isConnected ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>System Health</CardTitle>
            <Activity className={`h-4 w-4 text-${healthStatus.color}-500`} />
          </CardHeader>
          <CardContent>
            <div className='flex items-center space-x-2'>
              <Badge
                variant={
                  healthStatus.color === 'green' ? 'default' : 'destructive'
                }
              >
                {healthStatus.status.toUpperCase()}
              </Badge>
              {healthStatus.status === 'excellent' && (
                <CheckCircle className='h-4 w-4 text-green-500' />
              )}
              {healthStatus.status === 'poor' && (
                <AlertTriangle className='h-4 w-4 text-red-500' />
              )}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Return Rate</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {systemHealth?.system.return_rate?.toFixed(1) || 0}%
            </div>
            <Progress
              value={systemHealth?.system.return_rate || 0}
              className='mt-2'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              On-Time Returns
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {systemHealth?.system.on_time_return_rate?.toFixed(1) || 0}%
            </div>
            <Progress
              value={systemHealth?.system.on_time_return_rate || 0}
              className='mt-2'
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Resolution
            </CardTitle>
            <Zap className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {systemHealth?.response.avg_resolution_hours?.toFixed(0) || 0}h
            </div>
            <p className='text-xs text-muted-foreground'>
              {systemHealth?.response.same_day_return_rate?.toFixed(1) || 0}%
              same day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Activity</CardTitle>
          <CardDescription>
            Live lending activity over the last 10 minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {realtimeData.length > 0 ? (
            <ResponsiveContainer width='100%' height={300}>
              <LineChart data={realtimeData}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='timestamp' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type='monotone'
                  dataKey='total_lendings'
                  stroke='#8884d8'
                  name='Total Lendings'
                  strokeWidth={2}
                />
                <Line
                  type='monotone'
                  dataKey='unique_borrowers'
                  stroke='#82ca9d'
                  name='Active Users'
                  strokeWidth={2}
                />
                <Line
                  type='monotone'
                  dataKey='overdue_count'
                  stroke='#ff7c7c'
                  name='Overdue Items'
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className='flex items-center justify-center h-64 text-muted-foreground'>
              <div className='text-center'>
                <Activity className='h-12 w-12 mx-auto mb-4 opacity-50' />
                <p>Collecting real-time data...</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Real-time alerts and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className='space-y-3'>
              {alerts
                .slice()
                .reverse()
                .map(alert => (
                  <Alert
                    key={alert.id}
                    className={
                      alert.type === 'error'
                        ? 'border-red-200 bg-red-50'
                        : alert.type === 'warning'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-blue-200 bg-blue-50'
                    }
                  >
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        alert.type === 'error'
                          ? 'text-red-500'
                          : alert.type === 'warning'
                            ? 'text-yellow-500'
                            : 'text-blue-500'
                      }`}
                    />
                    <AlertDescription>
                      <div className='flex justify-between items-start'>
                        <div>
                          <p className='font-medium'>{alert.title}</p>
                          <p className='text-sm'>{alert.message}</p>
                        </div>
                        <span className='text-xs text-muted-foreground'>
                          {alert.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <CheckCircle className='h-12 w-12 mx-auto mb-4 opacity-50' />
              <p>No alerts - system running smoothly</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Utilization</CardTitle>
            <CardDescription>
              Real-time inventory turnover by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            {systemHealth?.inventoryTurnover ? (
              <ResponsiveContainer width='100%' height={250}>
                <BarChart data={systemHealth.inventoryTurnover}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='category_name' />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey='utilization_rate'
                    fill='#8884d8'
                    name='Utilization %'
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex items-center justify-center h-64 text-muted-foreground'>
                <p>Loading inventory data...</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>
                  Average Lending Duration
                </span>
                <Badge variant='outline'>
                  {systemHealth?.system.avg_lending_duration?.toFixed(1) || 0}{' '}
                  days
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>
                  Average Overdue Days
                </span>
                <Badge variant='destructive'>
                  {systemHealth?.system.avg_overdue_days?.toFixed(1) || 0} days
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Daily Active Users</span>
                <Badge variant='secondary'>
                  {systemHealth?.system.avg_daily_unique_users?.toFixed(0) || 0}
                </Badge>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm font-medium'>Same Day Returns</span>
                <Badge variant='default'>
                  {systemHealth?.response.same_day_return_rate?.toFixed(1) || 0}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            Connection error: {error}
            <Button
              onClick={startRealTimeMonitoring}
              variant='outline'
              size='sm'
              className='ml-2'
            >
              Reconnect
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default RealTimeMonitoringDashboard;
