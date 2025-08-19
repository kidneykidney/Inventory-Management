import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  Activity
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Velocity Chart Component
 * Displays team velocity trends with modern styling and chart containers
 */
const VelocityChart = ({ data, currentSprint }) => {
  const [chartType, setChartType] = React.useState('line'); // 'line' or 'bar'

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5' />
            Team Velocity
          </CardTitle>
          <CardDescription>Sprint velocity tracking and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-64 text-muted-foreground'>
            No velocity data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const labels = data.map(sprint => `Sprint ${sprint.number}`);
  const plannedPoints = data.map(sprint => sprint.plannedPoints || 0);
  const completedPoints = data.map(sprint => sprint.completedPoints || 0);
  const velocityTrend = data.map(sprint => sprint.velocity || 0);

  // Calculate average velocity
  const averageVelocity = velocityTrend.length > 0 
    ? Math.round(velocityTrend.reduce((sum, v) => sum + v, 0) / velocityTrend.length)
    : 0;

  // Calculate velocity trend
  const getVelocityTrend = () => {
    if (velocityTrend.length < 2) return null;
    
    const recent = velocityTrend.slice(-3); // Last 3 sprints
    const older = velocityTrend.slice(-6, -3); // Previous 3 sprints
    
    if (older.length === 0) return null;
    
    const recentAvg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    const olderAvg = older.reduce((sum, v) => sum + v, 0) / older.length;
    
    const trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    return {
      percentage: Math.abs(trendPercentage).toFixed(1),
      direction: trendPercentage > 5 ? 'up' : trendPercentage < -5 ? 'down' : 'stable',
      recentAvg: Math.round(recentAvg),
      olderAvg: Math.round(olderAvg)
    };
  };

  const trend = getVelocityTrend();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Planned Points',
        data: plannedPoints,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: chartType === 'bar' ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.1)',
        borderWidth: chartType === 'line' ? 2 : 0,
        fill: chartType === 'line',
        tension: 0.4,
      },
      {
        label: 'Completed Points',
        data: completedPoints,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: chartType === 'bar' ? 'rgba(34, 197, 94, 0.8)' : 'rgba(34, 197, 94, 0.1)',
        borderWidth: chartType === 'line' ? 3 : 0,
        fill: chartType === 'line',
        tension: 0.4,
      },
      ...(chartType === 'line' ? [{
        label: 'Average Velocity',
        data: new Array(labels.length).fill(averageVelocity),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }] : [])
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${context.parsed.y} points`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Sprints',
          font: {
            weight: 'bold',
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Story Points',
          font: {
            weight: 'bold',
          },
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  const getTrendIcon = () => {
    if (!trend) return Minus;
    switch (trend.direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    switch (trend.direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendBgColor = () => {
    if (!trend) return 'bg-gray-50';
    switch (trend.direction) {
      case 'up': return 'bg-green-50';
      case 'down': return 'bg-red-50';
      default: return 'bg-gray-50';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='h-5 w-5' />
              Team Velocity
            </CardTitle>
            <CardDescription>
              Sprint velocity tracking and performance trends
            </CardDescription>
          </div>
          <div className='flex items-center gap-2'>
            {/* Chart Type Toggle */}
            <div className='flex bg-gray-100 rounded-lg p-1'>
              <Button
                variant={chartType === 'line' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setChartType('line')}
                className='h-8 px-3'
              >
                Line
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'ghost'}
                size='sm'
                onClick={() => setChartType('bar')}
                className='h-8 px-3'
              >
                <BarChart3 className='h-4 w-4' />
              </Button>
            </div>
            
            {/* Trend Indicator */}
            {trend && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getTrendBgColor()}`}>
                <TrendIcon className={`h-4 w-4 ${getTrendColor()}`} />
                <div className='text-sm'>
                  <div className={`font-medium ${getTrendColor()}`}>
                    {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
                    {trend.percentage}%
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {trend.direction === 'stable' ? 'Stable' : 'Trend'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className='h-64 mb-6'>
          {chartType === 'line' ? (
            <Line data={chartData} options={options} />
          ) : (
            <Bar data={chartData} options={options} />
          )}
        </div>

        {/* Velocity Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {averageVelocity}
            </div>
            <div className='text-sm text-muted-foreground'>Avg Velocity</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {data.length > 0 ? Math.max(...completedPoints) : 0}
            </div>
            <div className='text-sm text-muted-foreground'>Best Sprint</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {data.length > 0 ? completedPoints[completedPoints.length - 1] || 0 : 0}
            </div>
            <div className='text-sm text-muted-foreground'>Last Sprint</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {trend ? trend.recentAvg : averageVelocity}
            </div>
            <div className='text-sm text-muted-foreground'>Recent Avg</div>
          </div>
        </div>

        {/* Current Sprint Highlight */}
        {currentSprint && (
          <div className='mt-4 pt-4 border-t'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>Current Sprint {currentSprint.number}</div>
                <div className='text-sm text-muted-foreground'>
                  {currentSprint.goal}
                </div>
              </div>
              <Badge 
                className={
                  currentSprint.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }
              >
                {currentSprint.status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VelocityChart;