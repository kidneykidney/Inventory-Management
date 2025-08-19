import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import {
  RefreshCw,
  Mail,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

const NotificationAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [failedNotifications, setFailedNotifications] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchFailedNotifications(),
        fetchSchedulerStatus(),
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('inventory_auth_token');
    const response = await fetch(
      `/api/v1/email-notifications/stats?days=${selectedPeriod}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setStats(data.data);
    }
  };

  const fetchFailedNotifications = async () => {
    const token = localStorage.getItem('inventory_auth_token');
    const response = await fetch(
      '/api/v1/email-notifications/failed?limit=50',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setFailedNotifications(data.data);
    }
  };

  const fetchSchedulerStatus = async () => {
    const token = localStorage.getItem('inventory_auth_token');
    const response = await fetch(
      '/api/v1/email-notifications/scheduler/status',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      setSchedulerStatus(data.data);
    }
  };

  const handleRetryNotification = async notificationId => {
    setRetrying(notificationId);
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch(
        `/api/v1/email-notifications/retry/${notificationId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Notification retry initiated',
        });
        fetchFailedNotifications();
      } else {
        throw new Error('Failed to retry notification');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry notification',
        variant: 'destructive',
      });
    } finally {
      setRetrying(null);
    }
  };

  const handleSchedulerAction = async action => {
    try {
      const token = localStorage.getItem('inventory_auth_token');
      const response = await fetch(
        `/api/v1/email-notifications/scheduler/${action}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Scheduler ${action}ed successfully`,
        });
        fetchSchedulerStatus();
      } else {
        throw new Error(`Failed to ${action} scheduler`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} scheduler`,
        variant: 'destructive',
      });
    }
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleString();
  };

  const getNotificationTypeIcon = type => {
    switch (type) {
      case 'lending_confirmation':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'return_reminder':
        return <Clock className='w-4 h-4 text-blue-500' />;
      case 'overdue_notice':
        return <AlertTriangle className='w-4 h-4 text-red-500' />;
      case 'return_confirmation':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      default:
        return <Mail className='w-4 h-4 text-gray-500' />;
    }
  };

  const getNotificationTypeLabel = type => {
    const labels = {
      lending_confirmation: 'Lending Confirmation',
      return_reminder: 'Return Reminder',
      overdue_notice: 'Overdue Notice',
      return_confirmation: 'Return Confirmation',
      lending_request_approval: 'Request Approval',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <h2 className='text-2xl font-bold'>Notification Analytics</h2>
        <div className='flex items-center space-x-2'>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' onClick={fetchData}>
            <RefreshCw className='w-4 h-4 mr-2' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-2'>
                <Mail className='w-8 h-8 text-blue-500' />
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.summary.total_notifications || 0}
                  </p>
                  <p className='text-sm text-gray-500'>Total Notifications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-2'>
                <CheckCircle className='w-8 h-8 text-green-500' />
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.summary.sent_count || 0}
                  </p>
                  <p className='text-sm text-gray-500'>Successfully Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-2'>
                <XCircle className='w-8 h-8 text-red-500' />
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.summary.failed_count || 0}
                  </p>
                  <p className='text-sm text-gray-500'>Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center space-x-2'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 font-bold'>%</span>
                </div>
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.summary.success_rate || 0}%
                  </p>
                  <p className='text-sm text-gray-500'>Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scheduler Status */}
      {schedulerStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Email Scheduler Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='space-y-2'>
                <div className='flex items-center space-x-2'>
                  <Badge
                    variant={
                      schedulerStatus.isRunning ? 'default' : 'secondary'
                    }
                  >
                    {schedulerStatus.isRunning ? 'Running' : 'Stopped'}
                  </Badge>
                  <span className='text-sm text-gray-500'>
                    Active Jobs:{' '}
                    {schedulerStatus.activeJobs?.join(', ') || 'None'}
                  </span>
                </div>
                {schedulerStatus.nextReminderRun && (
                  <p className='text-sm text-gray-500'>
                    Next Reminder Run:{' '}
                    {formatDate(schedulerStatus.nextReminderRun)}
                  </p>
                )}
                {schedulerStatus.nextOverdueRun && (
                  <p className='text-sm text-gray-500'>
                    Next Overdue Run:{' '}
                    {formatDate(schedulerStatus.nextOverdueRun)}
                  </p>
                )}
              </div>
              <div className='space-x-2'>
                {schedulerStatus.isRunning ? (
                  <Button
                    variant='outline'
                    onClick={() => handleSchedulerAction('stop')}
                  >
                    Stop Scheduler
                  </Button>
                ) : (
                  <Button onClick={() => handleSchedulerAction('start')}>
                    Start Scheduler
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Failed Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {failedNotifications.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              No failed notifications found.
            </div>
          ) : (
            <div className='space-y-4'>
              {failedNotifications.map(notification => (
                <div key={notification.id} className='border rounded-lg p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-2'>
                      <div className='flex items-center space-x-2'>
                        {getNotificationTypeIcon(notification.type)}
                        <span className='font-medium'>
                          {getNotificationTypeLabel(notification.type)}
                        </span>
                        <Badge variant='destructive'>Failed</Badge>
                      </div>
                      <p className='text-sm text-gray-600'>
                        To: {notification.recipient_email}
                      </p>
                      <p className='text-sm font-mono bg-gray-50 px-2 py-1 rounded'>
                        {notification.subject}
                      </p>
                      <p className='text-sm text-gray-500'>
                        Failed: {formatDate(notification.sent_date)}
                      </p>
                      {notification.error_message && (
                        <Alert>
                          <AlertTriangle className='w-4 h-4' />
                          <AlertDescription className='text-sm'>
                            {notification.error_message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleRetryNotification(notification.id)}
                      disabled={retrying === notification.id}
                    >
                      {retrying === notification.id ? (
                        <div className='flex items-center space-x-2'>
                          <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                          <span>Retrying...</span>
                        </div>
                      ) : (
                        <>
                          <RefreshCw className='w-4 h-4 mr-2' />
                          Retry
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationAnalytics;
