import React from 'react';
import StakeholderDashboard from '../components/notifications/StakeholderDashboard';
import FeedbackCollectionForm from '../components/notifications/FeedbackCollectionForm';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

/**
 * Stakeholder Dashboard Page
 * Provides comprehensive project insights and feedback collection for stakeholders
 */
const StakeholderDashboardPage = () => {
  const handleFeedbackSubmitted = () => {
    // Refresh dashboard data or show success message
    console.log('Feedback submitted, refreshing dashboard...');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Overview</h1>
          <p className="text-muted-foreground">
            Real-time insights into project progress and team performance
          </p>
        </div>
        <FeedbackCollectionForm 
          sprintId="current-sprint" 
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      </div>

      {/* Main Dashboard */}
      <StakeholderDashboard projectId="current-project" />

      {/* Additional Information Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Real-time Updates</h4>
              <p className="text-sm text-muted-foreground">
                All metrics are updated in real-time as the development team makes progress.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Provide Feedback</h4>
              <p className="text-sm text-muted-foreground">
                Use the "Provide Feedback" button to share your thoughts on sprint progress, 
                team performance, or suggest improvements.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Sprint Health</h4>
              <p className="text-sm text-muted-foreground">
                Monitor project health through color-coded indicators: Green (on track), 
                Yellow (at risk), Red (needs attention).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics Explained</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Velocity</h4>
              <p className="text-sm text-muted-foreground">
                Average story points completed per sprint. Higher velocity indicates 
                increased team productivity.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Burndown Chart</h4>
              <p className="text-sm text-muted-foreground">
                Shows remaining work over time. The actual line should track close to 
                the planned line for healthy sprint progress.
              </p>
            </div>
            <div>
              <h4 className="font-semibold">Team Capacity</h4>
              <p className="text-sm text-muted-foreground">
                Percentage of available team capacity being utilized. Optimal range 
                is typically 80-90%.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StakeholderDashboardPage;