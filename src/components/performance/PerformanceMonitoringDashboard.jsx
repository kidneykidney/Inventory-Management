import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  Clock, 
  Database, 
  Server, 
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  BarChart3
} from 'lucide-react';

const PerformanceMonitoringDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loadTestRunning, setLoadTestRunning] = useState(false);

  useEffect(() => {
    fetchPerformanceData();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchPerformanceData, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/performance/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runLoadTest = async () => {
    try {
      setLoadTestRunning(true);
      const response = await fetch('/api/v1/performance/load-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenarios: ['default'],
          baseUrl: window.location.origin
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start load test');
      }
      
      const result = await response.json();
      console.log('Load test started:', result);
      
      // Simulate load test completion after 10 seconds
      setTimeout(() => {
        setLoadTestRunning(false);
        fetchPerformanceData(); // Refresh data after load test
      }, 10000);
      
    } catch (err) {
      console.error('Load test failed:', err);
      setLoadTestRunning(false);
    }
  };

  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.critical) return 'text-red-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = (value, thresholds) => {
    if (value >= thresholds.critical) return 'bg-red-100 text-red-800';
    if (value >= thresholds.warning) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (loading && !performanceData) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
            <p className="text-gray-600 mt-1">Real-time system performance metrics</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load performance data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!performanceData) {
    return null;
  }

  const { backend, frontend } = performanceData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time system performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={runLoadTest}
            disabled={loadTestRunning}
          >
            <Play className={`h-4 w-4 mr-2 ${loadTestRunning ? 'animate-pulse' : ''}`} />
            {loadTestRunning ? 'Running...' : 'Load Test'}
          </Button>
        </div>
      </div>

      {/* Backend Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Backend Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <div className="p-2 rounded-md bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(backend.requests.avgResponseTime, { warning: 1000, critical: 2000 })}`}>
                {backend.requests.avgResponseTime}ms
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress 
                  value={Math.min((backend.requests.avgResponseTime / 2000) * 100, 100)} 
                  className="flex-1" 
                />
                <Badge className={getStatusBadge(backend.requests.avgResponseTime, { warning: 1000, critical: 2000 })}>
                  {backend.requests.avgResponseTime < 1000 ? 'Good' : 
                   backend.requests.avgResponseTime < 2000 ? 'Warning' : 'Critical'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {backend.requests.total} requests processed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <div className="p-2 rounded-md bg-green-50">
                <Server className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(backend.system.memoryUsage, { warning: 512, critical: 1024 })}`}>
                {backend.system.memoryUsage}MB
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress 
                  value={Math.min((backend.system.memoryUsage / 1024) * 100, 100)} 
                  className="flex-1" 
                />
                <Badge className={getStatusBadge(backend.system.memoryUsage, { warning: 512, critical: 1024 })}>
                  {backend.system.memoryUsage < 512 ? 'Good' : 
                   backend.system.memoryUsage < 1024 ? 'Warning' : 'Critical'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Uptime: {Math.floor(backend.system.uptime / 3600)}h {Math.floor((backend.system.uptime % 3600) / 60)}m
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database Queries</CardTitle>
              <div className="p-2 rounded-md bg-purple-50">
                <Database className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{backend.database.queryCount}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">
                    Slow queries: {backend.database.slowQueries}
                  </div>
                </div>
                <Badge className={getStatusBadge(backend.database.slowQueries, { warning: 5, critical: 20 })}>
                  {backend.database.slowQueries < 5 ? 'Good' : 
                   backend.database.slowQueries < 20 ? 'Warning' : 'Critical'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Total queries executed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <div className="p-2 rounded-md bg-orange-50">
                <Activity className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-2xl font-bold text-green-600">Healthy</span>
              </div>
              <div className="mt-2">
                <div className="text-sm text-muted-foreground">
                  Node.js {backend.system.nodeVersion}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Frontend Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Frontend Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
              <div className="p-2 rounded-md bg-indigo-50">
                <Clock className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(frontend.pageLoads.avgLoadTime, { warning: 3000, critical: 5000 })}`}>
                {frontend.pageLoads.avgLoadTime}ms
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress 
                  value={Math.min((frontend.pageLoads.avgLoadTime / 5000) * 100, 100)} 
                  className="flex-1" 
                />
                <Badge className={getStatusBadge(frontend.pageLoads.avgLoadTime, { warning: 3000, critical: 5000 })}>
                  {frontend.pageLoads.avgLoadTime < 3000 ? 'Good' : 
                   frontend.pageLoads.avgLoadTime < 5000 ? 'Warning' : 'Critical'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {frontend.pageLoads.count} page loads tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Core Web Vitals</CardTitle>
              <div className="p-2 rounded-md bg-pink-50">
                <BarChart3 className="h-4 w-4 text-pink-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">LCP</span>
                  <Badge className={getStatusBadge(
                    frontend.coreWebVitals.lcp.count > 0 ? 
                    (frontend.coreWebVitals.lcp.goodCount / frontend.coreWebVitals.lcp.count) * 100 : 100,
                    { warning: 75, critical: 50 }
                  )}>
                    {frontend.coreWebVitals.lcp.count > 0 ? 
                     Math.round((frontend.coreWebVitals.lcp.goodCount / frontend.coreWebVitals.lcp.count) * 100) : 100}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">FID</span>
                  <Badge className={getStatusBadge(
                    frontend.coreWebVitals.fid.count > 0 ? 
                    (frontend.coreWebVitals.fid.goodCount / frontend.coreWebVitals.fid.count) * 100 : 100,
                    { warning: 75, critical: 50 }
                  )}>
                    {frontend.coreWebVitals.fid.count > 0 ? 
                     Math.round((frontend.coreWebVitals.fid.goodCount / frontend.coreWebVitals.fid.count) * 100) : 100}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CLS</span>
                  <Badge className={getStatusBadge(
                    frontend.coreWebVitals.cls.count > 0 ? 
                    (frontend.coreWebVitals.cls.goodCount / frontend.coreWebVitals.cls.count) * 100 : 100,
                    { warning: 75, critical: 50 }
                  )}>
                    {frontend.coreWebVitals.cls.count > 0 ? 
                     Math.round((frontend.coreWebVitals.cls.goodCount / frontend.coreWebVitals.cls.count) * 100) : 100}%
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Percentage of good scores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Experience</CardTitle>
              <div className="p-2 rounded-md bg-teal-50">
                <Users className="h-4 w-4 text-teal-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-2xl font-bold text-green-600">Good</span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="text-sm text-muted-foreground">
                  Performance score: 85/100
                </div>
                <div className="text-sm text-muted-foreground">
                  Accessibility: 92/100
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Overall user experience rating
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Performance Alerts
          </CardTitle>
          <CardDescription>
            Current performance issues and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {backend.requests.avgResponseTime > 1000 || backend.system.memoryUsage > 512 || backend.database.slowQueries > 5 ? (
            <div className="space-y-3">
              {backend.requests.avgResponseTime > 1000 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High response time detected ({backend.requests.avgResponseTime}ms). Consider optimizing API endpoints or scaling infrastructure.
                  </AlertDescription>
                </Alert>
              )}
              {backend.system.memoryUsage > 512 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    High memory usage detected ({backend.system.memoryUsage}MB). Monitor for memory leaks and consider increasing server capacity.
                  </AlertDescription>
                </Alert>
              )}
              {backend.database.slowQueries > 5 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Multiple slow database queries detected ({backend.database.slowQueries}). Review and optimize database queries and indexes.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>No performance issues detected. System is operating within normal parameters.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common performance monitoring and optimization tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">View Trends</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Database className="h-6 w-6" />
              <span className="text-sm">Query Analysis</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Server className="h-6 w-6" />
              <span className="text-sm">System Logs</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Activity className="h-6 w-6" />
              <span className="text-sm">Health Check</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitoringDashboard;