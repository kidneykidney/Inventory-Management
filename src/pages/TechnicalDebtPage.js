import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import TechnicalDebtDashboard from '../components/technical-debt/TechnicalDebtDashboard';
import CodeQualityMetrics from '../components/technical-debt/CodeQualityMetrics';
import TechnicalDebtForm from '../components/technical-debt/TechnicalDebtForm';
import { useToast } from '../hooks/use-toast';
import { logger } from '../utils/logger';

/**
 * Technical Debt Page - Main page for technical debt management
 */
const TechnicalDebtPage = () => {
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateTechnicalDebt = (technicalDebtStory) => {
    // In a real application, this would save to the backend
    logger.info('Technical debt story created', technicalDebtStory);
    
    toast({
      title: 'Technical Debt Story Created',
      description: `"${technicalDebtStory.title}" has been added to the backlog`
    });

    setIsFormOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="border-b">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Technical Debt Dashboard</TabsTrigger>
              <TabsTrigger value="metrics">Code Quality Metrics</TabsTrigger>
              <TabsTrigger value="trends">Trends & Analysis</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-0">
          <TechnicalDebtDashboard onCreateDebt={() => setIsFormOpen(true)} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-0">
          <CodeQualityMetrics />
        </TabsContent>

        <TabsContent value="trends" className="mt-0">
          <div className="p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-muted-foreground">Trends & Analysis</h2>
              <p className="text-muted-foreground mt-2">
                Historical trends and predictive analysis coming soon
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TechnicalDebtForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateTechnicalDebt}
      />
    </div>
  );
};

export default TechnicalDebtPage;