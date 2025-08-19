import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import DownloadIcon from '@mui/icons-material/Download';
import PrintIcon from '@mui/icons-material/Print';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { logger } from '../utils/logger';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

/**
 * ReportsPage component for analytics and reporting
 * Displays various charts and data analyses
 * @returns {JSX.Element} ReportsPage component
 */
const ReportsPage = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Filter state
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [category, setCategory] = useState('all');

  /**
   * Log component mount
   */
  useEffect(() => {
    logger.info('ReportsPage mounted');

    return () => {
      logger.info('ReportsPage unmounted');
    };
  }, []);

  /**
   * Handle tab change
   * @param {Event} event - Tab change event
   * @param {number} newValue - New tab index
   */
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  /**
   * Handle period change
   * @param {Event} e - Change event
   */
  const handlePeriodChange = e => {
    const value = e.target.value;
    setPeriod(value);

    // Update date range based on selected period
    const today = new Date();
    let start = new Date();

    switch (value) {
      case 'week':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
        break;
      case 'quarter':
        start = new Date(
          today.getFullYear(),
          today.getMonth() - 3,
          today.getDate()
        );
        break;
      case 'year':
        start = new Date(
          today.getFullYear() - 1,
          today.getMonth(),
          today.getDate()
        );
        break;
      default:
        break;
    }

    setStartDate(start);
    setEndDate(today);
  };

  /**
   * Generate sample data for inventory value chart
   * @returns {Object} Chart data
   */
  const getInventoryValueData = () => {
    // Sample data for inventory value over time
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      datasets: [
        {
          label: 'Total Inventory Value (₹)',
          data: [
            150000, 175000, 165000, 180000, 200000, 190000, 210000, 205000,
            220000,
          ],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  };

  /**
   * Generate sample data for sales chart
   * @returns {Object} Chart data
   */
  const getSalesData = () => {
    // Sample data for sales over time
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
      datasets: [
        {
          label: 'Sales (₹)',
          data: [45000, 52000, 49000, 60000, 62000, 58000, 65000, 63000, 70000],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderWidth: 2,
        },
      ],
    };
  };

  /**
   * Generate sample data for category distribution chart
   * @returns {Object} Chart data
   */
  const getCategoryData = () => {
    // Sample data for inventory by category
    return {
      labels: [
        'Electronics',
        'Furniture',
        'Office Supplies',
        'IT Equipment',
        'Stationery',
      ],
      datasets: [
        {
          label: 'Inventory by Category',
          data: [35, 25, 20, 15, 5],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  /**
   * Generate sample data for stock status chart
   * @returns {Object} Chart data
   */
  const getStockStatusData = () => {
    // Sample data for inventory stock status
    return {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [
        {
          label: 'Stock Status',
          data: [70, 20, 10],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(255, 99, 132, 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  /**
   * Generate sample data for top products chart
   * @returns {Object} Chart data
   */
  const getTopProductsData = () => {
    // Sample data for top products by volume
    return {
      labels: ['Laptops', 'Office Chairs', 'Smartphones', 'Printers', 'Desks'],
      datasets: [
        {
          label: 'Units Sold',
          data: [120, 80, 70, 50, 40],
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
      ],
    };
  };

  /**
   * Chart options for line charts
   */
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  /**
   * Chart options for bar charts
   */
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  /**
   * Chart options for doughnut charts
   */
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  /**
   * Format date for display
   * @param {Date} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = date => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Print current report
   */
  const handlePrint = () => {
    logger.info('Printing report');
    window.print();
  };

  /**
   * Download report data
   */
  const handleDownload = () => {
    logger.info('Downloading report data');
    // In a real app, would implement CSV/Excel export
    alert('Report downloaded successfully');
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Reports & Analytics
      </Typography>

      {/* Filters */}
      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems='center'>
          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size='small'>
              <InputLabel id='period-label'>Time Period</InputLabel>
              <Select
                labelId='period-label'
                id='period'
                value={period}
                label='Time Period'
                onChange={handlePeriodChange}
              >
                <MenuItem value='week'>Last Week</MenuItem>
                <MenuItem value='month'>Last Month</MenuItem>
                <MenuItem value='quarter'>Last Quarter</MenuItem>
                <MenuItem value='year'>Last Year</MenuItem>
                <MenuItem value='custom'>Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {period === 'custom' && (
            <>
              <Grid item xs={12} sm={3} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='Start Date'
                    value={startDate}
                    onChange={newValue => setStartDate(newValue)}
                    renderInput={params => (
                      <TextField size='small' fullWidth {...params} />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={3} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label='End Date'
                    value={endDate}
                    onChange={newValue => setEndDate(newValue)}
                    renderInput={params => (
                      <TextField size='small' fullWidth {...params} />
                    )}
                  />
                </LocalizationProvider>
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={3} md={2}>
            <FormControl fullWidth size='small'>
              <InputLabel id='category-label'>Category</InputLabel>
              <Select
                labelId='category-label'
                id='category'
                value={category}
                label='Category'
                onChange={e => setCategory(e.target.value)}
              >
                <MenuItem value='all'>All Categories</MenuItem>
                <MenuItem value='electronics'>Electronics</MenuItem>
                <MenuItem value='furniture'>Furniture</MenuItem>
                <MenuItem value='office'>Office Supplies</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={3} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant='outlined'
                startIcon={<CalendarTodayIcon />}
                size='small'
              >
                Schedule Report
              </Button>
              <Tooltip title='Print Report'>
                <IconButton onClick={handlePrint}>
                  <PrintIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Download Data'>
                <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Date Range Display */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography variant='subtitle1' sx={{ fontWeight: 'medium' }}>
          Showing data for:
        </Typography>
        <Typography variant='subtitle1' sx={{ ml: 1, fontWeight: 'bold' }}>
          {formatDate(startDate)} - {formatDate(endDate)}
        </Typography>
      </Box>

      {/* Report Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor='primary'
        textColor='primary'
        variant='scrollable'
        scrollButtons='auto'
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label='Overview' />
        <Tab label='Inventory Analysis' />
        <Tab label='Sales Analysis' />
        <Tab label='Stock Movement' />
      </Tabs>

      {/* Overview Tab */}
      {tabValue === 0 && (
        <Box>
          {/* Key Metrics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Total Items in Inventory
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    523
                  </Typography>
                  <Typography
                    variant='body2'
                    color='success.main'
                    sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                  >
                    +12 since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Inventory Value
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    ₹220,450
                  </Typography>
                  <Typography
                    variant='body2'
                    color='success.main'
                    sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                  >
                    +₹15,200 since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Low Stock Items
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    24
                  </Typography>
                  <Typography
                    variant='body2'
                    color='warning.main'
                    sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                  >
                    -3 since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={2} sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography
                    variant='subtitle2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Out of Stock Items
                  </Typography>
                  <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                    8
                  </Typography>
                  <Typography
                    variant='body2'
                    color='error.main'
                    sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
                  >
                    +2 since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Inventory Value Trend
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Line data={getInventoryValueData()} options={lineOptions} />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Inventory by Category
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={getCategoryData()}
                    options={doughnutOptions}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Stock Status Distribution
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Doughnut
                    data={getStockStatusData()}
                    options={doughnutOptions}
                  />
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant='h6' gutterBottom>
                  Top Products by Volume
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ height: 300 }}>
                  <Bar data={getTopProductsData()} options={barOptions} />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Inventory Analysis Tab */}
      {tabValue === 1 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Inventory Analysis
          </Typography>
          <Typography variant='body1'>
            Detailed inventory analysis content will be shown here.
          </Typography>
        </Box>
      )}

      {/* Sales Analysis Tab */}
      {tabValue === 2 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Sales Analysis
          </Typography>
          <Typography variant='body1'>
            Sales analysis content will be shown here.
          </Typography>
        </Box>
      )}

      {/* Stock Movement Tab */}
      {tabValue === 3 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Stock Movement
          </Typography>
          <Typography variant='body1'>
            Stock movement analysis content will be shown here.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
