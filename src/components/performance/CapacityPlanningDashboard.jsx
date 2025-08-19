import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Alert, AlertDescription } from '../ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
} from 'lucide-react';

const CapacityPlanningDashboard = () => {
  const [capacityData, setCapacityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    fetchCapacityData();
  }, [selectedTimeframe]);

  const fetchCapacityData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/performance/capacity-planning?timeframe=${selectedTimeframe}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch capacity data');
      }
      const data = await response.json();
      setCapacityData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = status => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = status => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className='h-4 w-4' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4' />;
      case 'critical':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Activity className='h-4 w-4' />;
    }
  };

  const getTrendIcon = trend => {
    return trend === 'increasing' ? (
      <TrendingUp className='h-4 w-4 text-red-500' />
    ) : (
      <TrendingDown className='h-4 w-4 text-green-500' />
    );
  };

  if (loading) {
    return (
      <div className='p-6 space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Capacity Planning
            </h1>
            <p className='text-gray-600 mt-1'>
              Monitor system capacity and plan for scaling
            </p>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(4)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardContent className='p-6'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-1/2'></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <Alert className='border-red-200 bg-red-50'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            Failed to load capacity planning data: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!capacityData) {
    return null;
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Capacity Planning
          </h1>
          <p className='text-gray-600 mt-1'>
            Monitor system capacity and plan for scaling
          </p>
        </div>
        <div className='flex gap-2'>
          {['24h', '7d', '30d'].map(timeframe => (
            <Button
              key={timeframe}
              variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              {timeframe}
            </Button>
          ))}
        </div>
      </div>

      {/* System Status Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>CPU Usage</CardTitle>
            <div className='p-2 rounded-md bg-blue-50'>
              <Server className='h-4 w-4 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {capacityData.cpu.current}%
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <Progress value={capacityData.cpu.current} className='flex-1' />
              {getTrendIcon(capacityData.cpu.trend)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Peak: {capacityData.cpu.peak}% | Avg: {capacityData.cpu.average}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Memory Usage</CardTitle>
            <div className='p-2 rounded-md bg-green-50'>
              <Database className='h-4 w-4 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {capacityData.memory.current}%
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <Progress
                value={capacityData.memory.current}
                className='flex-1'
              />
              {getTrendIcon(capacityData.memory.trend)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Peak: {capacityData.memory.peak}% | Avg:{' '}
              {capacityData.memory.average}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <div className='p-2 rounded-md bg-purple-50'>
              <Users className='h-4 w-4 text-purple-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {capacityData.users.current}
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <Progress
                value={
                  (capacityData.users.current / capacityData.users.capacity) *
                  100
                }
                className='flex-1'
              />
              {getTrendIcon(capacityData.users.trend)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Capacity: {capacityData.users.capacity} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Response Time</CardTitle>
            <div className='p-2 rounded-md bg-orange-50'>
              <Clock className='h-4 w-4 text-orange-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {capacityData.responseTime.current}ms
            </div>
            <div className='flex items-center gap-2 mt-2'>
              <Progress
                value={Math.min(
                  (capacityData.responseTime.current / 2000) * 100,
                  100
                )}
                className='flex-1'
              />
              {getTrendIcon(capacityData.responseTime.trend)}
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              Target: &lt;1000ms | P95: {capacityData.responseTime.p95}ms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Alerts */}
      {capacityData.alerts && capacityData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-orange-500' />
              Capacity Alerts
            </CardTitle>
            <CardDescription>
              Current capacity issues requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {capacityData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 border rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    {getStatusIcon(alert.severity)}
                    <div>
                      <div className='font-medium'>{alert.title}</div>
                      <div className='text-sm text-muted-foreground'>
                        {alert.description}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(alert.severity)}>
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scaling Recommendations */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Scaling Recommendations</CardTitle>
            <CardDescription>
              Suggested actions based on current capacity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {capacityData.recommendations.map((rec, index) => (
                <div key={index} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium'>{rec.title}</h4>
                    <Badge
                      variant='outline'
                      className={
                        rec.priority === 'high'
                          ? 'border-red-200 text-red-700'
                          : rec.priority === 'medium'
                            ? 'border-yellow-200 text-yellow-700'
                            : 'border-green-200 text-green-700'
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className='text-sm text-muted-foreground mb-3'>
                    {rec.description}
                  </p>
                  <div className='space-y-1'>
                    {rec.actions.map((action, actionIndex) => (
                      <div
                        key={actionIndex}
                        className='text-sm flex items-center gap-2'
                      >
                        <div className='w-1 h-1 bg-gray-400 rounded-full'></div>
                        {action}
                      </div>
                    ))}
                  </div>
                  {rec.estimatedImpact && (
                    <div className='mt-3 text-xs text-muted-foreground'>
                      Estimated impact: {rec.estimatedImpact}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Capacity Forecast</CardTitle>
            <CardDescription>
              Projected capacity needs based on current trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {capacityData.forecast.map((item, index) => (
                <div key={index} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium'>{item.resource}</h4>
                    <Badge variant='outline'>{item.timeframe}</Badge>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Current Usage:</span>
                      <span className='font-medium'>{item.current}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Projected Usage:</span>
                      <span className='font-medium'>{item.projected}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Recommended Capacity:</span>
                      <span className='font-medium text-blue-600'>
                        {item.recommended}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={
                      (parseFloat(item.projected) /
                        parseFloat(item.recommended)) *
                      100
                    }
                    className='mt-3'
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization</CardTitle>
          <CardDescription>
            Database and infrastructure optimization recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='font-medium mb-3'>Database Optimization</h4>
              <div className='space-y-2'>
                {capacityData.optimization.database.map((item, index) => (
                  <div key={index} className='flex items-center gap-2 text-sm'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <span>{item.suggestion}</span>
                    {item.impact && (
                      <Badge variant='outline' className='ml-auto text-xs'>
                        {item.impact}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className='font-medium mb-3'>Infrastructure Optimization</h4>
              <div className='space-y-2'>
                {capacityData.optimization.infrastructure.map((item, index) => (
                  <div key={index} className='flex items-center gap-2 text-sm'>
                    <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                    <span>{item.suggestion}</span>
                    {item.impact && (
                      <Badge variant='outline' className='ml-auto text-xs'>
                        {item.impact}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapacityPlanningDashboard;
