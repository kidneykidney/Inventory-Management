import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useToast } from '../../hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  Calendar,
  Download,
  Filter
} from 'lucide-react';

const LendingAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedTab, setSelectedTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
    fetchStatistics();
    fetchHistory();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/v1/lending-transactions/analytics/trends?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch analytics data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/v1/lending-transactions/statistics/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setStatistics(data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/v1/lending-transactions/history?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      let data;
      let filename;
      
      switch (type) {
        case 'analytics':
          data = analytics;
          filename = `lending-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'history':
          data = history;
          filename = `lending-history-${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'statistics':
          data = statistics;
          filename = `lending-statistics-${new Date().toISOString().split('T')[0]}.json`;
          break;
        default:
          return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${type} data has been exported`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Lending Analytics</h1>
            <p className="text-gray-600">Comprehensive analytics and insights for the lending system</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold">{statistics.overview.total_transactions}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Loans</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.overview.active_transactions}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Items</p>
                  <p className="text-2xl font-bold text-red-600">{statistics.overview.overdue_transactions}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Return Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round((statistics.overview.returned_transactions / statistics.overview.total_transactions) * 100)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            {statistics && statistics.monthly && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Monthly Lending Trends</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportData('statistics')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statistics.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="transactions_count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Popular Products */}
            {statistics && statistics.popularProducts && (
              <Card>
                <CardHeader>
                  <CardTitle>Most Popular Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.popularProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{product.product_name}</p>
                          <p className="text-sm text-gray-600">{product.brand} {product.model}</p>
                        </div>
                        <Badge variant="outline">{product.lending_count} loans</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          {analytics && analytics.trends && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Lending Trends Over Time</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportData('analytics')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analytics.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_lendings" fill="#8884d8" name="Total Lendings" />
                    <Bar dataKey="returned_count" fill="#82ca9d" name="Returned" />
                    <Bar dataKey="overdue_count" fill="#ff7c7c" name="Overdue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          {analytics && analytics.categories && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lending by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="lending_count"
                      >
                        {analytics.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.categories.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{category.category}</span>
                          <Badge variant="outline">{category.lending_count} loans</Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Avg Duration: {Math.round(category.avg_duration)} days
                          {category.overdue_count > 0 && (
                            <span className="text-red-600 ml-2">
                              • {category.overdue_count} overdue
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          {analytics && analytics.topBorrowers && (
            <Card>
              <CardHeader>
                <CardTitle>Top Borrowers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topBorrowers.map((user, index) => (
                    <div key={index} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{user.total_lendings} total loans</p>
                        <div className="text-sm text-gray-600">
                          {user.returned_count} returned • {user.overdue_count} overdue
                        </div>
                        <div className="text-sm text-gray-600">
                          Avg: {Math.round(user.avg_duration)} days
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LendingAnalytics;