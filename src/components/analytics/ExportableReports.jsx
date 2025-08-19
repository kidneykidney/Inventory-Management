import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Download,
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Clock,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

const ExportableReports = ({
  sprintData = [],
  teamData = {},
  retrospectiveData = [],
  performanceMetrics = {},
}) => {
  const [selectedReport, setSelectedReport] = useState('sprint-summary');
  const [dateRange, setDateRange] = useState('last6sprints');
  const printRef = useRef();

  const generateSprintSummaryData = () => {
    const recentSprints = sprintData.slice(-6);
    return recentSprints.map(sprint => ({
      sprintNumber: sprint.number,
      startDate: format(new Date(sprint.startDate), 'MMM dd, yyyy'),
      endDate: format(new Date(sprint.endDate), 'MMM dd, yyyy'),
      plannedPoints: sprint.plannedPoints || 0,
      completedPoints: sprint.completedPoints || 0,
      velocity: sprint.velocity || 0,
      completionRate: sprint.stories?.length
        ? Math.round(
            (sprint.stories.filter(s => s.status === 'done').length /
              sprint.stories.length) *
              100
          )
        : 0,
      bugCount: sprint.bugCount || 0,
      testCoverage: sprint.testCoverage || 0,
    }));
  };

  const generateTeamPerformanceData = () => {
    const recentRetros = retrospectiveData.slice(-6);
    return recentRetros.map(retro => ({
      sprintNumber: retro.sprintId,
      teamMorale: retro.teamMorale || 0,
      velocityRating: retro.velocityRating || 0,
      qualityRating: retro.qualityRating || 0,
      communicationRating: retro.communicationRating || 0,
      actionItemsCount: retro.actionItems?.length || 0,
      improvementAreas: retro.whatCouldImprove?.length || 0,
    }));
  };

  const generateVelocityTrendData = () => {
    const recentSprints = sprintData.slice(-12);
    return recentSprints.map(sprint => ({
      sprint: `Sprint ${sprint.number}`,
      velocity: sprint.velocity || 0,
      trend: sprint.velocityTrend || 'stable',
      predictedNext: sprint.predictedVelocity || 0,
    }));
  };

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const SprintSummaryReport = () => {
    const data = generateSprintSummaryData();
    const totalPlanned = data.reduce(
      (sum, sprint) => sum + sprint.plannedPoints,
      0
    );
    const totalCompleted = data.reduce(
      (sum, sprint) => sum + sprint.completedPoints,
      0
    );
    const avgVelocity = Math.round(
      data.reduce((sum, sprint) => sum + sprint.velocity, 0) / data.length
    );
    const avgCompletionRate = Math.round(
      data.reduce((sum, sprint) => sum + sprint.completionRate, 0) / data.length
    );

    return (
      <div className='space-y-6'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 no-print'>
          <Card>
            <CardContent className='p-4 text-center'>
              <Target className='h-8 w-8 mx-auto mb-2 text-blue-500' />
              <div className='text-2xl font-bold'>{totalPlanned}</div>
              <div className='text-sm text-gray-600'>Total Planned Points</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <Award className='h-8 w-8 mx-auto mb-2 text-green-500' />
              <div className='text-2xl font-bold'>{totalCompleted}</div>
              <div className='text-sm text-gray-600'>
                Total Completed Points
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <TrendingUp className='h-8 w-8 mx-auto mb-2 text-purple-500' />
              <div className='text-2xl font-bold'>{avgVelocity}</div>
              <div className='text-sm text-gray-600'>Average Velocity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <BarChart3 className='h-8 w-8 mx-auto mb-2 text-orange-500' />
              <div className='text-2xl font-bold'>{avgCompletionRate}%</div>
              <div className='text-sm text-gray-600'>Avg Completion Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sprint Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Planned</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Velocity</TableHead>
                  <TableHead>Completion %</TableHead>
                  <TableHead>Bugs</TableHead>
                  <TableHead>Test Coverage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((sprint, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>
                      Sprint {sprint.sprintNumber}
                    </TableCell>
                    <TableCell>
                      {sprint.startDate} - {sprint.endDate}
                    </TableCell>
                    <TableCell>{sprint.plannedPoints}</TableCell>
                    <TableCell>{sprint.completedPoints}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sprint.velocity >= avgVelocity
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {sprint.velocity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sprint.completionRate >= 80
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {sprint.completionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sprint.bugCount > 5 && (
                        <AlertTriangle className='h-4 w-4 inline mr-1 text-red-500' />
                      )}
                      {sprint.bugCount}
                    </TableCell>
                    <TableCell>{sprint.testCoverage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <div className='flex space-x-2 no-print'>
          <Button onClick={() => exportToCSV(data, 'sprint-summary-report')}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' onClick={exportToPDF}>
            <FileText className='h-4 w-4 mr-2' />
            Export PDF
          </Button>
        </div>
      </div>
    );
  };

  const TeamPerformanceReport = () => {
    const data = generateTeamPerformanceData();
    const avgMorale =
      Math.round(
        (data.reduce((sum, item) => sum + item.teamMorale, 0) / data.length) *
          10
      ) / 10;
    const totalActionItems = data.reduce(
      (sum, item) => sum + item.actionItemsCount,
      0
    );

    return (
      <div className='space-y-6'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 no-print'>
          <Card>
            <CardContent className='p-4 text-center'>
              <Users className='h-8 w-8 mx-auto mb-2 text-blue-500' />
              <div className='text-2xl font-bold'>{avgMorale}</div>
              <div className='text-sm text-gray-600'>Average Team Morale</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <Target className='h-8 w-8 mx-auto mb-2 text-green-500' />
              <div className='text-2xl font-bold'>{totalActionItems}</div>
              <div className='text-sm text-gray-600'>Total Action Items</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <TrendingUp className='h-8 w-8 mx-auto mb-2 text-purple-500' />
              <div className='text-2xl font-bold'>{data.length}</div>
              <div className='text-sm text-gray-600'>
                Retrospectives Completed
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Team Morale</TableHead>
                  <TableHead>Velocity Rating</TableHead>
                  <TableHead>Quality Rating</TableHead>
                  <TableHead>Communication</TableHead>
                  <TableHead>Action Items</TableHead>
                  <TableHead>Improvement Areas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>
                      Sprint {item.sprintNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.teamMorale >= 7
                            ? 'default'
                            : item.teamMorale >= 5
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {item.teamMorale}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.velocityRating >= 7 ? 'default' : 'secondary'
                        }
                      >
                        {item.velocityRating}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.qualityRating >= 7 ? 'default' : 'secondary'
                        }
                      >
                        {item.qualityRating}/10
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.communicationRating >= 7
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {item.communicationRating}/10
                      </Badge>
                    </TableCell>
                    <TableCell>{item.actionItemsCount}</TableCell>
                    <TableCell>{item.improvementAreas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <div className='flex space-x-2 no-print'>
          <Button onClick={() => exportToCSV(data, 'team-performance-report')}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' onClick={exportToPDF}>
            <FileText className='h-4 w-4 mr-2' />
            Export PDF
          </Button>
        </div>
      </div>
    );
  };

  const VelocityTrendReport = () => {
    const data = generateVelocityTrendData();
    const currentVelocity = data[data.length - 1]?.velocity || 0;
    const previousVelocity = data[data.length - 2]?.velocity || 0;
    const velocityChange = currentVelocity - previousVelocity;

    return (
      <div className='space-y-6'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 no-print'>
          <Card>
            <CardContent className='p-4 text-center'>
              <TrendingUp className='h-8 w-8 mx-auto mb-2 text-blue-500' />
              <div className='text-2xl font-bold'>{currentVelocity}</div>
              <div className='text-sm text-gray-600'>Current Velocity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <BarChart3 className='h-8 w-8 mx-auto mb-2 text-green-500' />
              <div className='text-2xl font-bold'>
                {velocityChange > 0 ? '+' : ''}
                {velocityChange}
              </div>
              <div className='text-sm text-gray-600'>Velocity Change</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 text-center'>
              <Target className='h-8 w-8 mx-auto mb-2 text-purple-500' />
              <div className='text-2xl font-bold'>
                {data[data.length - 1]?.predictedNext || 0}
              </div>
              <div className='text-sm text-gray-600'>Predicted Next Sprint</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>Velocity Trend Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprint</TableHead>
                  <TableHead>Velocity</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Predicted Next</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{item.sprint}</TableCell>
                    <TableCell>
                      <Badge variant='default'>{item.velocity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.trend === 'increasing'
                            ? 'default'
                            : item.trend === 'decreasing'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {item.trend}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.predictedNext}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Export Actions */}
        <div className='flex space-x-2 no-print'>
          <Button onClick={() => exportToCSV(data, 'velocity-trend-report')}>
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
          <Button variant='outline' onClick={exportToPDF}>
            <FileText className='h-4 w-4 mr-2' />
            Export PDF
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div ref={printRef} className='space-y-6'>
      {/* Print Header */}
      <div className='print-only'>
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-bold'>Team Performance Report</h1>
          <p className='text-gray-600'>
            Generated on {format(new Date(), 'MMMM dd, yyyy')}
          </p>
        </div>
      </div>

      <Tabs
        value={selectedReport}
        onValueChange={setSelectedReport}
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-3 no-print'>
          <TabsTrigger value='sprint-summary'>Sprint Summary</TabsTrigger>
          <TabsTrigger value='team-performance'>Team Performance</TabsTrigger>
          <TabsTrigger value='velocity-trend'>Velocity Trend</TabsTrigger>
        </TabsList>

        <TabsContent value='sprint-summary'>
          <SprintSummaryReport />
        </TabsContent>

        <TabsContent value='team-performance'>
          <TeamPerformanceReport />
        </TabsContent>

        <TabsContent value='velocity-trend'>
          <VelocityTrendReport />
        </TabsContent>
      </Tabs>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            font-size: 12px;
          }
          .card {
            border: 1px solid #e5e7eb;
            break-inside: avoid;
          }
          table {
            font-size: 10px;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default ExportableReports;
