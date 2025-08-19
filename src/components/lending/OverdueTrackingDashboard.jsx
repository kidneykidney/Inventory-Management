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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Alert, AlertDescription } from '../ui/alert';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertTriangle,
  Clock,
  Mail,
  Phone,
  User,
  Package,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Send,
} from 'lucide-react';

const OverdueTrackingDashboard = () => {
  const [overdueItems, setOverdueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [escalationFilter, setEscalationFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOverdueItems();
  }, []);

  const fetchOverdueItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        '/api/v1/lending-analytics/overdue-tracking',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch overdue items');
      }

      const data = await response.json();
      setOverdueItems(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOverdueItems();
    setRefreshing(false);
  };

  const sendReminder = async transactionId => {
    try {
      const response = await fetch(
        `/api/v1/email-notifications/send-reminder`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ transactionId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }

      // Refresh the data to update reminder count
      await fetchOverdueItems();
    } catch (err) {
      setError('Failed to send reminder: ' + err.message);
    }
  };

  const getEscalationBadge = level => {
    const variants = {
      Low: 'default',
      Medium: 'secondary',
      High: 'destructive',
      Critical: 'destructive',
    };

    const colors = {
      Low: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      High: 'bg-orange-100 text-orange-800',
      Critical: 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant={variants[level]} className={colors[level]}>
        {level}
      </Badge>
    );
  };

  const filteredItems = overdueItems.filter(item => {
    const matchesSearch =
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.borrower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.borrower_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEscalation =
      escalationFilter === 'all' ||
      item.escalation_level.toLowerCase() === escalationFilter.toLowerCase();

    return matchesSearch && matchesEscalation;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex items-center space-x-2'>
          <RefreshCw className='h-4 w-4 animate-spin' />
          <span>Loading overdue items...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className='m-4'>
        <AlertTriangle className='h-4 w-4' />
        <AlertDescription>
          Error loading overdue items: {error}
          <Button
            onClick={fetchOverdueItems}
            variant='outline'
            size='sm'
            className='ml-2'
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const escalationCounts = overdueItems.reduce((acc, item) => {
    acc[item.escalation_level] = (acc[item.escalation_level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Overdue Item Tracking</h1>
          <p className='text-muted-foreground'>
            Monitor and manage overdue lending transactions
          </p>
        </div>
        <Button onClick={handleRefresh} variant='outline' disabled={refreshing}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Escalation Level Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Low Priority</CardTitle>
            <Clock className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {escalationCounts.Low || 0}
            </div>
            <p className='text-xs text-muted-foreground'>1-7 days overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Medium Priority
            </CardTitle>
            <Clock className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {escalationCounts.Medium || 0}
            </div>
            <p className='text-xs text-muted-foreground'>8-14 days overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>High Priority</CardTitle>
            <AlertTriangle className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {escalationCounts.High || 0}
            </div>
            <p className='text-xs text-muted-foreground'>15-30 days overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Critical</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {escalationCounts.Critical || 0}
            </div>
            <p className='text-xs text-muted-foreground'>30+ days overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Overdue Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex space-x-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by product, borrower name, or email...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-8'
                />
              </div>
            </div>
            <Select
              value={escalationFilter}
              onValueChange={setEscalationFilter}
            >
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by escalation level' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Levels</SelectItem>
                <SelectItem value='low'>Low Priority</SelectItem>
                <SelectItem value='medium'>Medium Priority</SelectItem>
                <SelectItem value='high'>High Priority</SelectItem>
                <SelectItem value='critical'>Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Items ({filteredItems.length})</CardTitle>
          <CardDescription>
            Items that are past their due date and require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className='text-center py-8'>
              <Package className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-muted-foreground'>No overdue items found</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Escalation</TableHead>
                    <TableHead>Reminders</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.transaction_id}>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{item.product_name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {item.brand} {item.model}
                          </p>
                          <Badge variant='outline' className='mt-1'>
                            {item.category_name}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{item.borrower_name}</p>
                          <p className='text-sm text-muted-foreground'>
                            {item.borrower_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center'>
                          <Calendar className='h-4 w-4 mr-2 text-muted-foreground' />
                          {new Date(item.due_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='destructive'>
                          {item.days_overdue} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getEscalationBadge(item.escalation_level)}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <Mail className='h-4 w-4 text-muted-foreground' />
                          <span>{item.reminders_sent}</span>
                          {item.last_reminder_sent && (
                            <span className='text-xs text-muted-foreground'>
                              (Last:{' '}
                              {new Date(
                                item.last_reminder_sent
                              ).toLocaleDateString()}
                              )
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex space-x-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => sendReminder(item.transaction_id)}
                          >
                            <Send className='h-4 w-4 mr-1' />
                            Send Reminder
                          </Button>
                          {item.escalation_level === 'Critical' && (
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() => {
                                // Handle escalation to management
                                window.open(
                                  `mailto:${item.borrower_email}?subject=URGENT: Overdue Item Return Required&body=Your borrowed item "${item.product_name}" is ${item.days_overdue} days overdue. Please return immediately.`
                                );
                              }}
                            >
                              <Phone className='h-4 w-4 mr-1' />
                              Escalate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Escalation Workflow Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Escalation Workflow</CardTitle>
          <CardDescription>
            Automated escalation process for overdue items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Clock className='h-6 w-6 text-green-600' />
              </div>
              <h3 className='font-medium text-green-600'>Low Priority</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                1-7 days overdue
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                • Automated email reminder • Daily notifications
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Mail className='h-6 w-6 text-yellow-600' />
              </div>
              <h3 className='font-medium text-yellow-600'>Medium Priority</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                8-14 days overdue
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                • Enhanced email reminders • CC to supervisor
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <AlertTriangle className='h-6 w-6 text-orange-600' />
              </div>
              <h3 className='font-medium text-orange-600'>High Priority</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                15-30 days overdue
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                • Manager notification • Phone call required
              </p>
            </div>

            <div className='text-center'>
              <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2'>
                <Phone className='h-6 w-6 text-red-600' />
              </div>
              <h3 className='font-medium text-red-600'>Critical</h3>
              <p className='text-sm text-muted-foreground mt-1'>
                30+ days overdue
              </p>
              <p className='text-xs text-muted-foreground mt-2'>
                • Executive escalation • Recovery process
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverdueTrackingDashboard;
