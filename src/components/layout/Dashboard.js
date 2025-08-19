import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  // Mock data for charts
  const salesData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Sales',
        data: [12000, 19000, 15000, 22000, 18000, 25000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const inventoryData = {
    labels: ['Category A', 'Category B', 'Category C', 'Category D'],
    datasets: [
      {
        label: 'Inventory by Category',
        data: [120, 80, 65, 95],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const ordersData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Orders',
        data: [55, 70, 60, 90, 78, 95],
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  };

  // KPI data
  const kpiData = [
    { title: 'Total Products', value: '523' },
    { title: 'Low Stock Items', value: '24' },
    { title: 'Out of Stock', value: '8' },
    { title: 'Monthly Revenue', value: '$25,430' },
  ];

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant='h4' gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={2}
              sx={{
                padding: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              <Typography variant='h6' color='text.secondary' gutterBottom>
                {kpi.title}
              </Typography>
              <Typography variant='h4' sx={{ fontWeight: 'bold' }}>
                {kpi.value}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            elevation={2}
            sx={{
              padding: 3,
              height: '100%',
              borderRadius: 2,
            }}
          >
            <Typography variant='h6' gutterBottom>
              Sales Overview
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line
                data={salesData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper
            elevation={2}
            sx={{
              padding: 3,
              height: '100%',
              borderRadius: 2,
            }}
          >
            <Typography variant='h6' gutterBottom>
              Inventory by Category
            </Typography>
            <Box
              sx={{ height: 300, display: 'flex', justifyContent: 'center' }}
            >
              <Doughnut
                data={inventoryData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              padding: 3,
              borderRadius: 2,
            }}
          >
            <Typography variant='h6' gutterBottom>
              Order Trends
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar
                data={ordersData}
                options={{
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
