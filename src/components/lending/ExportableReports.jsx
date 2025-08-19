import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Download,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const ExportableReports = () => {
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [format, setFormat] = useState('json');
  const [filters, setFilters] = useState({
    categoryId: '',
    userId: '',
    status: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportTypes = [
    {
      id: 'overview',
      name: 'Overview Report',
      description: 'Comprehensive lending system overview with key metrics',
      icon: BarChart3,
      endpoint: '/api/v1/lending-analytics/report',
    },
    {
      id: 'trends',
      name: 'Lending Trends',
      description: 'Historical lending trends and patterns over time',
      icon: TrendingUp,
      endpoint: '/api/v1/lending-analytics/trends',
    },
    {
      id: 'popular-products',
      name: 'Popular Products',
      description: 'Most frequently borrowed items and their statistics',
      icon: Package,
      endpoint: '/api/v1/lending-analytics/popular-products',
    },
    {
      id: 'user-behavior',
      name: 'User Behavior',
      description: 'User lending patterns and engagement metrics',
      icon: Users,
      endpoint: '/api/v1/lending-analytics/user-behavior',
    },
    {
      id: 'overdue-tracking',
      name: 'Overdue Tracking',
      description: 'Detailed overdue items with escalation information',
      icon: AlertTriangle,
      endpoint: '/api/v1/lending-analytics/overdue-tracking',
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      description: 'System efficiency and performance indicators',
      icon: Clock,
      endpoint: '/api/v1/lending-analytics/performance',
    },
    {
      id: 'usage-statistics',
      name: 'Usage Statistics',
      description: 'Custom date range usage statistics with filters',
      icon: FileText,
      endpoint: '/api/v1/lending-analytics/usage-statistics',
    },
  ];

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'Machine-readable format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible' },
    { value: 'pdf', label: 'PDF', description: 'Print-friendly format' },
  ];

  const generateReport = async () => {
    if (!reportType) {
      setError('Please select a report type');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const selectedReport = reportTypes.find(r => r.id === reportType);
      let url = selectedReport.endpoint;
      const params = new URLSearchParams();

      // Add date range if specified
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);

      // Add filters
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.status) params.append('status', filters.status);

      // Add format
      params.append('format', format);

      // Add report-specific parameters
      if (reportType === 'overview') {
        params.append('includeDetails', 'true');
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();

      // Handle different export formats
      if (format === 'json') {
        downloadJSON(
          data.data,
          `${reportType}-report-${new Date().toISOString().split('T')[0]}`
        );
      } else if (format === 'csv') {
        downloadCSV(
          data.data,
          `${reportType}-report-${new Date().toISOString().split('T')[0]}`
        );
      } else if (format === 'pdf') {
        // For now, we'll generate a simple text-based PDF
        downloadPDF(
          data.data,
          `${reportType}-report-${new Date().toISOString().split('T')[0]}`
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${filename}.json`);
  };

  const downloadCSV = (data, filename) => {
    let csvContent = '';

    if (Array.isArray(data)) {
      if (data.length > 0) {
        // Get headers from first object
        const headers = Object.keys(data[0]);
        csvContent += headers.join(',') + '\n';

        // Add data rows
        data.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          });
          csvContent += values.join(',') + '\n';
        });
      }
    } else if (typeof data === 'object') {
      // Handle object data by flattening it
      const flattenObject = (obj, prefix = '') => {
        const flattened = {};
        for (const key in obj) {
          if (
            obj[key] !== null &&
            typeof obj[key] === 'object' &&
            !Array.isArray(obj[key])
          ) {
            Object.assign(
              flattened,
              flattenObject(obj[key], `${prefix}${key}.`)
            );
          } else {
            flattened[`${prefix}${key}`] = obj[key];
          }
        }
        return flattened;
      };

      const flattened = flattenObject(data);
      const headers = Object.keys(flattened);
      csvContent += headers.join(',') + '\n';
      csvContent +=
        headers.map(header => flattened[header] || '').join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const downloadPDF = (data, filename) => {
    // Simple text-based PDF content
    let textContent = `Lending Analytics Report\n`;
    textContent += `Generated: ${new Date().toLocaleString()}\n`;
    textContent += `Report Type: ${reportTypes.find(r => r.id === reportType)?.name}\n\n`;
    textContent += JSON.stringify(data, null, 2);

    const blob = new Blob([textContent], { type: 'text/plain' });
    downloadBlob(blob, `${filename}.txt`);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickReports = [
    {
      name: "Today's Activity",
      description: 'Lending activity for today',
      action: () => {
        const today = new Date().toISOString().split('T')[0];
        setReportType('usage-statistics');
        setDateRange({ start: today, end: today });
        setFormat('json');
      },
    },
    {
      name: "This Week's Overdue",
      description: 'All overdue items this week',
      action: () => {
        setReportType('overdue-tracking');
        setFormat('csv');
      },
    },
    {
      name: 'Monthly Summary',
      description: 'Complete monthly overview',
      action: () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        setReportType('overview');
        setDateRange({
          start: firstDay.toISOString().split('T')[0],
          end: lastDay.toISOString().split('T')[0],
        });
        setFormat('pdf');
      },
    },
  ];

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Exportable Reports</h1>
        <p className='text-muted-foreground'>
          Generate and export comprehensive lending analytics reports
        </p>
      </div>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reports</CardTitle>
          <CardDescription>
            Pre-configured reports for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {quickReports.map((report, index) => (
              <Card
                key={index}
                className='cursor-pointer hover:shadow-md transition-shadow'
              >
                <CardHeader>
                  <CardTitle className='text-lg'>{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={report.action} className='w-full'>
                    <Download className='h-4 w-4 mr-2' />
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Report Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Build and export custom reports with specific parameters
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Report Type Selection */}
          <div className='space-y-2'>
            <Label htmlFor='reportType'>Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder='Select a report type' />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className='flex items-center'>
                      <type.icon className='h-4 w-4 mr-2' />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reportType && (
              <p className='text-sm text-muted-foreground'>
                {reportTypes.find(r => r.id === reportType)?.description}
              </p>
            )}
          </div>

          {/* Date Range */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='startDate'>Start Date</Label>
              <Input
                id='startDate'
                type='date'
                value={dateRange.start}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, start: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='endDate'>End Date</Label>
              <Input
                id='endDate'
                type='date'
                value={dateRange.end}
                onChange={e =>
                  setDateRange(prev => ({ ...prev, end: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Filters */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='categoryFilter'>Category Filter</Label>
              <Input
                id='categoryFilter'
                placeholder='Category ID (optional)'
                value={filters.categoryId}
                onChange={e =>
                  setFilters(prev => ({ ...prev, categoryId: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='userFilter'>User Filter</Label>
              <Input
                id='userFilter'
                placeholder='User ID (optional)'
                value={filters.userId}
                onChange={e =>
                  setFilters(prev => ({ ...prev, userId: e.target.value }))
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='statusFilter'>Status Filter</Label>
              <Select
                value={filters.status}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='overdue'>Overdue</SelectItem>
                  <SelectItem value='returned'>Returned</SelectItem>
                  <SelectItem value='lost'>Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Export Format */}
          <div className='space-y-2'>
            <Label>Export Format</Label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {formatOptions.map(option => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-colors ${
                    format === option.value
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setFormat(option.value)}
                >
                  <CardContent className='p-4'>
                    <div className='flex items-center space-x-2'>
                      <FileText className='h-4 w-4' />
                      <div>
                        <p className='font-medium'>{option.label}</p>
                        <p className='text-sm text-muted-foreground'>
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Generate Button */}
          <Button
            onClick={generateReport}
            disabled={loading || !reportType}
            className='w-full'
          >
            {loading ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                Generating Report...
              </>
            ) : (
              <>
                <Download className='h-4 w-4 mr-2' />
                Generate & Download Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Available Report Types</CardTitle>
          <CardDescription>
            Detailed information about each report type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {reportTypes.map(type => (
              <Card key={type.id}>
                <CardHeader>
                  <CardTitle className='flex items-center text-lg'>
                    <type.icon className='h-5 w-5 mr-2' />
                    {type.name}
                  </CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setReportType(type.id)}
                  >
                    Select This Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExportableReports;
