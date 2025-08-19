import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  BarChart3, FileText, TrendingUp, Users, 
  Calendar, Download, Settings, RefreshCw
} from 'lucide-react';

import SprintRetrospectiveForm from './SprintRetrospectiveForm';
import TeamPerformanceDashboard from './TeamPerformanceDashboard';
import ExportableReports from './ExportableReports';
import PredictiveAnalytics from './PredictiveAnalytics';

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sprintData, setSprintData] = useState([]);
  const [teamData, setTeamData] = useState({});
  const [retrospectiveData, setRetrospectiveData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load sprint data
      const sprintsResponse = await fetch('/api/sprints');
      const sprints = await sprintsResponse.json();
      setSprintData(sprints);

      // Load team data
      const teamResponse = await fetch('/api/team/metrics');
      const team = await teamResponse.json();
      setTeamData(team);

      // Load retrospective data
      const retrospectiveResponse = await fetch('/api/retrospectives');
      const retrospectives = await retrospectiveResponse.json();
      setRetrospectiveData(retrospectives);

      // Calculate performance metrics
      calculatePerformanceMetrics(sprints, retrospectives);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceMetrics = (sprints, retrospectives) => {
    if (!sprints || sprints.length === 0) return;

    const recentSprints = sprints.slice(-6);
    const totalVelocity = recentSprints.reduce((sum, sprint) => sum + (sprint.velocity || 0), 0);
    const averageVelocity = Math.round(totalVelocity / recentSprints.length);

    const completionRates = recentSprints.map(sprint => {
      if (!sprint.stories || sprint.stories.length === 0) return 0;
      return (sprint.stories.filter(story => story.status === 'done').length / sprint.stories.length) * 100;
    });
    const averageCompletion = Math.round(completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length);

    const satisfactionScores = retrospectives.slice(-6).map(retro => 
      ((retro.teamMorale || 0) + (retro.velocityRating || 0) + (retro.qualityRating || 0) + (retro.communicationRating || 0)) / 4
    );
    const averageSatisfaction = satisfactionScores.length > 0 ? 
      Math.round((satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length) * 10) / 10 : 0;

    const totalActionItems = retrospectives.slice(-6).reduce((sum, retro) => 
      sum + (retro.actionItems ? retro.actionItems.length : 0), 0);

    setPerformanceMetrics({
      averageVelocity,
      averageCompletion,
      averageSatisfaction,
      totalActionItems,
      sprintsAnalyzed: recentSprints.length,
      retrospectivesCompleted: retrospectives.length
    });
  };

  const handleRetrospectiveSubmit = async (retrospectiveData) => {
    try {
      const response = await fetch('/api/retrospectives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retrospectiveData),
      });

      if (response.ok) {
        // Reload data to reflect changes
        await loadAnalyticsData();
        // Show success message
        console.log('Retrospective saved successfully');
      }
    } catch (error) {
      console.error('Error saving retrospective:', error);
    }
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Velocity</p>
                <p className="text-2xl font-bold">{performanceMetrics.averageVelocity || 0}</p>
                <p className="text-xs text-gray-500">Last 6 sprints</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">{performanceMetrics.averageCompletion || 0}%</p>
                <p className="text-xs text-gray-500">Story completion</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Satisfaction</p>
                <p className="text-2xl font-bold">{performanceMetrics.averageSatisfaction || 0}</p>
                <p className="text-xs text-gray-500">Out of 10</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Action Items</p>
                <p className="text-2xl font-bold">{performanceMetrics.totalActionItems || 0}</p>
                <p className="text-xs text-gray-500">Recent retrospectives</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {performanceMetrics.sprintsAnalyzed || 0}
              </div>
              <p className="text-gray-600">Sprints Analyzed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {performanceMetrics.retrospectivesCompleted || 0}
              </div>
              <p className="text-gray-600">Retrospectives Completed</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {sprintData.length > 0 ? Math.round((Date.now() - new Date(sprintData[0].startDate)) / (1000 * 60 * 60 * 24 * 7)) : 0}
              </div>
              <p className="text-gray-600">Weeks of Data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {retrospectiveData.slice(-3).map((retro, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Sprint {retro.sprintId} Retrospective</p>
                  <p className="text-sm text-gray-600">
                    {retro.actionItems?.length || 0} action items, 
                    Team morale: {retro.teamMorale || 0}/10
                  </p>
                </div>
                <Badge variant="outline">
                  {new Date(retro.createdAt || Date.now()).toLocaleDateString()}
                </Badge>
              </div>
            ))}
            {retrospectiveData.length === 0 && (
              <p className="text-gray-500 text-center py-4">No retrospectives completed yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-gray-600">
            Comprehensive team performance and sprint analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </Badge>
          <Button variant="outline" onClick={loadAnalyticsData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="retrospective">Retrospective</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="retrospective" className="space-y-4">
          <SprintRetrospectiveForm
            sprintId={sprintData.length > 0 ? sprintData[sprintData.length - 1].number : 1}
            onSubmit={handleRetrospectiveSubmit}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <TeamPerformanceDashboard
            teamData={teamData}
            sprintData={sprintData}
            retrospectiveData={retrospectiveData}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ExportableReports
            sprintData={sprintData}
            teamData={teamData}
            retrospectiveData={retrospectiveData}
            performanceMetrics={performanceMetrics}
          />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <PredictiveAnalytics
            sprintData={sprintData}
            teamData={teamData}
            historicalData={retrospectiveData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;