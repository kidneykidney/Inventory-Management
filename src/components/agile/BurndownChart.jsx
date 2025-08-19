import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Burndown Chart Component
 * Displays sprint burndown chart with ideal vs actual progress
 */
const BurndownChart = ({ data, sprint }) => {
  if (!data || !data.burndownData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Burndown Chart</CardTitle>
          <CardDescription>Sprint progress visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-64 text-muted-foreground'>
            No burndown data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const labels = data.burndownData.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const idealData = data.burndownData.map(point => point.idealRemaining);
  const actualData = data.burndownData.map(point => point.actualRemaining);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ideal Burndown',
        data: idealData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
      },
      {
        label: 'Actual Burndown',
        data: actualData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
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
          text: 'Sprint Days',
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Story Points Remaining',
        },
        beginAtZero: true,
        max: data.totalStoryPoints,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  // Calculate trend
  const getTrendInfo = () => {
    const { currentProgress } = data;
    if (!currentProgress) {
      return null;
    }

    const variance = currentProgress.variance;
    const isOnTrack = currentProgress.isOnTrack;

    if (isOnTrack) {
      return {
        icon: Minus,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        text: 'On Track',
        description: 'Sprint is progressing as planned',
      };
    } else if (variance > 0) {
      return {
        icon: TrendingUp,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Behind Schedule',
        description: `${Math.abs(variance)} points behind ideal`,
      };
    } else {
      return {
        icon: TrendingDown,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        text: 'Ahead of Schedule',
        description: `${Math.abs(variance)} points ahead of ideal`,
      };
    }
  };

  const trendInfo = getTrendInfo();

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>Burndown Chart</CardTitle>
            <CardDescription>
              Sprint {sprint.number} progress tracking
            </CardDescription>
          </div>
          {trendInfo && (
            <div className='flex items-center gap-2'>
              <div className={`p-2 rounded-md ${trendInfo.bgColor}`}>
                <trendInfo.icon className={`h-4 w-4 ${trendInfo.color}`} />
              </div>
              <div>
                <Badge className={`${trendInfo.bgColor} ${trendInfo.color}`}>
                  {trendInfo.text}
                </Badge>
                <p className='text-xs text-muted-foreground mt-1'>
                  {trendInfo.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className='h-64 mb-4'>
          <Line data={chartData} options={options} />
        </div>

        {/* Progress Summary */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
          <div className='text-center'>
            <div className='text-lg font-semibold text-blue-600'>
              {data.totalStoryPoints}
            </div>
            <div className='text-sm text-muted-foreground'>Total Points</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-semibold text-green-600'>
              {data.completedStoryPoints}
            </div>
            <div className='text-sm text-muted-foreground'>Completed</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-semibold text-orange-600'>
              {data.remainingStoryPoints}
            </div>
            <div className='text-sm text-muted-foreground'>Remaining</div>
          </div>
          <div className='text-center'>
            <div className='text-lg font-semibold text-purple-600'>
              {data.completionRate}%
            </div>
            <div className='text-sm text-muted-foreground'>Complete</div>
          </div>
        </div>

        {/* Sprint Timeline */}
        <div className='mt-4 pt-4 border-t'>
          <div className='flex justify-between items-center text-sm'>
            <div className='text-muted-foreground'>
              Day {data.daysElapsed} of {data.workingDays}
            </div>
            <div className='text-muted-foreground'>
              {data.workingDays - data.daysElapsed} working days remaining
            </div>
          </div>
          <div className='mt-2'>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                style={{
                  width: `${data.workingDays > 0 ? (data.daysElapsed / data.workingDays) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BurndownChart;
