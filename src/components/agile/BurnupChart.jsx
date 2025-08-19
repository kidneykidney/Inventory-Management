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
import {
  BarChart3,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

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
 * Burnup Chart Component
 * Displays sprint scope and completion tracking with modern card wrapper
 */
const BurnupChart = ({ data, sprint }) => {
  if (!data || !data.burnupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Burnup Chart
          </CardTitle>
          <CardDescription>
            Sprint scope and completion tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-64 text-muted-foreground'>
            No burnup data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const labels = data.burnupData.map(point => {
    const date = new Date(point.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const totalScopeData = data.burnupData.map(point => point.totalScope);
  const completedWorkData = data.burnupData.map(point => point.completedWork);
  const projectedCompletionData = data.burnupData.map(
    point => point.projectedCompletion || null
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Total Scope',
        data: totalScopeData,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        stepped: true, // Show scope changes as steps
      },
      {
        label: 'Completed Work',
        data: completedWorkData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Projected Completion',
        data: projectedCompletionData,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 2,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.4,
      },
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
          text: 'Sprint Days',
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
        max: Math.max(...totalScopeData) * 1.1, // Add 10% padding
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

  // Calculate sprint health indicators
  const getSprintHealth = () => {
    const currentData = data.burnupData[data.burnupData.length - 1];
    if (!currentData) return null;

    const completionRate =
      currentData.totalScope > 0
        ? (currentData.completedWork / currentData.totalScope) * 100
        : 0;

    const scopeChange = data.scopeChange || 0;
    const isOnTrack =
      data.isOnTrack !== undefined ? data.isOnTrack : completionRate >= 70;

    return {
      completionRate: Math.round(completionRate),
      scopeChange,
      isOnTrack,
      totalScope: currentData.totalScope,
      completedWork: currentData.completedWork,
      remainingWork: currentData.totalScope - currentData.completedWork,
    };
  };

  const sprintHealth = getSprintHealth();

  const getHealthIcon = () => {
    if (!sprintHealth) return Target;
    if (sprintHealth.isOnTrack) return CheckCircle;
    return AlertTriangle;
  };

  const getHealthColor = () => {
    if (!sprintHealth) return 'text-gray-600';
    if (sprintHealth.isOnTrack) return 'text-green-600';
    return 'text-orange-600';
  };

  const getHealthBgColor = () => {
    if (!sprintHealth) return 'bg-gray-50';
    if (sprintHealth.isOnTrack) return 'bg-green-50';
    return 'bg-orange-50';
  };

  const HealthIcon = getHealthIcon();

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Burnup Chart
            </CardTitle>
            <CardDescription>
              Sprint {sprint?.number} scope and completion tracking
            </CardDescription>
          </div>
          {sprintHealth && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getHealthBgColor()}`}
            >
              <HealthIcon className={`h-4 w-4 ${getHealthColor()}`} />
              <div className='text-sm'>
                <div className={`font-medium ${getHealthColor()}`}>
                  {sprintHealth.isOnTrack ? 'On Track' : 'At Risk'}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {sprintHealth.completionRate}% Complete
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Chart */}
        <div className='h-64 mb-6'>
          <Line data={chartData} options={options} />
        </div>

        {/* Sprint Statistics */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-red-600'>
              {sprintHealth?.totalScope || 0}
            </div>
            <div className='text-sm text-muted-foreground'>Total Scope</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {sprintHealth?.completedWork || 0}
            </div>
            <div className='text-sm text-muted-foreground'>Completed</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {sprintHealth?.remainingWork || 0}
            </div>
            <div className='text-sm text-muted-foreground'>Remaining</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {sprintHealth?.completionRate || 0}%
            </div>
            <div className='text-sm text-muted-foreground'>Complete</div>
          </div>
        </div>

        {/* Scope Change Indicator */}
        {sprintHealth && sprintHealth.scopeChange !== 0 && (
          <div className='mt-4 pt-4 border-t'>
            <div className='flex items-center gap-2'>
              <TrendingUp
                className={`h-4 w-4 ${sprintHealth.scopeChange > 0 ? 'text-red-600' : 'text-green-600'}`}
              />
              <span className='text-sm font-medium'>
                Scope {sprintHealth.scopeChange > 0 ? 'Increased' : 'Decreased'}
                :
              </span>
              <Badge
                className={
                  sprintHealth.scopeChange > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }
              >
                {sprintHealth.scopeChange > 0 ? '+' : ''}
                {sprintHealth.scopeChange} points
              </Badge>
            </div>
            <div className='text-xs text-muted-foreground mt-1'>
              {sprintHealth.scopeChange > 0
                ? 'New stories were added to the sprint'
                : 'Stories were removed from the sprint'}
            </div>
          </div>
        )}

        {/* Sprint Progress Bar */}
        <div className='mt-4 pt-4 border-t'>
          <div className='flex justify-between items-center text-sm mb-2'>
            <span className='text-muted-foreground'>Sprint Progress</span>
            <span className='font-medium'>
              {sprintHealth?.completionRate || 0}%
            </span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-3'>
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                sprintHealth?.isOnTrack ? 'bg-green-600' : 'bg-orange-600'
              }`}
              style={{
                width: `${sprintHealth?.completionRate || 0}%`,
              }}
            />
          </div>
          <div className='flex justify-between text-xs text-muted-foreground mt-1'>
            <span>0 points</span>
            <span>{sprintHealth?.totalScope || 0} points</span>
          </div>
        </div>

        {/* Projection Information */}
        {data.projectionAccuracy && (
          <div className='mt-4 pt-4 border-t'>
            <div className='text-sm'>
              <div className='font-medium mb-1'>Projection Accuracy</div>
              <div className='text-muted-foreground'>
                Based on current velocity, the sprint is projected to complete{' '}
                <span className='font-medium'>
                  {Math.round(data.projectionAccuracy)}%
                </span>{' '}
                of planned work.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BurnupChart;
