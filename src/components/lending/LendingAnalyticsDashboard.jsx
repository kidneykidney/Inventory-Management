import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, Clock, AlertTriangle,
  Download, RefreshCw, Calendar, Target, Activity
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const LendingAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch comprehensive analytics report
      const response = await fetch(`/api/v1/lending-analytics/report?includeDetails=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  const exportReport = async (format = 'json') => {
    try {
      const response = await fetch(`/api/v1/lending-analytics/report?format=${format}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lending-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading analytics: {error}
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm" className="ml-2">
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert className="m-4">
        <AlertDescription>No analytics data available</AlertDescription>
      </Alert>
    );
  }

  const { overview, trends, popularProducts, categoryAnalytics, userBehavior, overdueAnalytics, predictiveAnalytics, performance } = analyticsData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lending Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Generated on {new Date(analyticsData.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => exportReport('json')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.transactions.total_transactions}</div>
            <p className="text-xs text-muted-foreground">
              {overview.transactions.active_transactions} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.products.available_products}</div>
            <p className="text-xs text-muted-foreground">
              of {overview.products.total_products} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.utilization.utilization_rate}%</div>
            <Progress value={overview.utilization.utilization_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overview.transactions.overdue_transactions}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg {overview.transactions.avg_lending_period?.toFixed(1)} days lending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="products">Popular Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">User Behavior</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Tracking</TabsTrigger>
          <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lending Trends Over Time</CardTitle>
              <CardDescription>Monthly lending activity and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="total_lendings" 
                    stackId="1"
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Total Lendings"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="returned_count" 
                    stackId="2"
                    stroke="#82ca9d" 
                    fill="#82ca9d" 
                    name="Returned"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="overdue_count" 
                    stackId="3"
                    stroke="#ff7c7c" 
                    fill="#ff7c7c" 
                    name="Overdue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Popular Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Products</CardTitle>
              <CardDescription>Products with highest lending frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={popularProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="product_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lending_count" fill="#8884d8" name="Lending Count" />
                  <Bar dataKey="overdue_count" fill="#ff7c7c" name="Overdue Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {popularProducts.slice(0, 6).map((product, index) => (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{product.product_name}</CardTitle>
                  <CardDescription>{product.brand} {product.model}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Lending Count</span>
                    <Badge variant="secondary">{product.lending_count}</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Return Rate</span>
                    <Badge variant={product.return_rate > 90 ? "default" : "destructive"}>
                      {product.return_rate}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Period</span>
                    <span className="text-sm">{product.avg_lending_period?.toFixed(1)} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Lending activity by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryAnalytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total_lendings"
                    >
                      {categoryAnalytics.map((entry, index) => (
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
                <CardDescription>Utilization and turnover rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryAnalytics.map((category, index) => (
                    <div key={category.category_name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{category.category_name}</span>
                        <Badge variant="outline">
                          {category.avg_lendings_per_product} avg/product
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <span>{category.total_products} products</span>
                        <span>{category.total_lendings} lendings</span>
                        <span>{category.overdue_lendings} overdue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Behavior Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Borrowers</CardTitle>
                <CardDescription>Most active users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userBehavior.topBorrowers?.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{user.total_lendings} lendings</p>
                        <p className="text-sm text-muted-foreground">
                          {user.return_rate}% return rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Borrowing Patterns</CardTitle>
                <CardDescription>Activity by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={userBehavior.borrowingPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day_of_week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="lending_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly User Engagement</CardTitle>
              <CardDescription>Active users and lending activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userBehavior.monthlyEngagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="active_users" 
                    stroke="#8884d8" 
                    name="Active Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_lendings_per_user" 
                    stroke="#82ca9d" 
                    name="Avg Lendings/User"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overdue Tracking Tab */}
        <TabsContent value="overdue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Overdue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Overdue</span>
                    <Badge variant="destructive">{overdueAnalytics.overview.total_overdue}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Days Overdue</span>
                    <span>{overdueAnalytics.overview.avg_days_overdue?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Days Overdue</span>
                    <span>{overdueAnalytics.overview.max_days_overdue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Affected Users</span>
                    <span>{overdueAnalytics.overview.unique_overdue_borrowers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Overdue by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueAnalytics.byCategory?.map((category) => (
                    <div key={category.category_name} className="flex justify-between">
                      <span>{category.category_name}</span>
                      <Badge variant="outline">{category.overdue_count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Overdue Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overdueAnalytics.byUser?.slice(0, 5).map((user) => (
                    <div key={user.username} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{user.username}</span>
                        <Badge variant="destructive">{user.overdue_count}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Avg {user.avg_days_overdue?.toFixed(1)} days overdue
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trending Products</CardTitle>
                <CardDescription>Products with increasing demand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveAnalytics.trendingProducts?.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.brand} {product.model}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                          <span className="text-green-500 font-medium">
                            {product.growth_rate}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.recent_lendings} recent lendings
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>High-Risk Products</CardTitle>
                <CardDescription>Products likely to be overdue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveAnalytics.overdueRiskProducts?.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.brand} {product.model}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{product.overdue_rate}% overdue</Badge>
                        <p className="text-sm text-muted-foreground">
                          {product.total_lendings} total lendings
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Peak Activity Hours</CardTitle>
              <CardDescription>Optimal times for lending activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictiveAnalytics.peakPeriods}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour_of_day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="lending_count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LendingAnalyticsDashboard;