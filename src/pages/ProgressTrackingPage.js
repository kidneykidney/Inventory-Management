import React from 'react';
import ProgressTrackingDashboard from '../components/agile/ProgressTrackingDashboard';

/**
 * Progress Tracking Page Component
 * Main page for progress tracking and visualization
 */
const ProgressTrackingPage = () => {
  return (
    <div className='min-h-screen bg-gray-50'>
      <ProgressTrackingDashboard />
    </div>
  );
};

export default ProgressTrackingPage;
