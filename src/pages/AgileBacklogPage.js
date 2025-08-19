import React from 'react';
import BacklogManagement from '../components/agile/BacklogManagement';

/**
 * Agile Backlog Page component
 * Displays the backlog management interface for epics and user stories
 * @returns {JSX.Element} AgileBacklogPage component
 */
function AgileBacklogPage() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <BacklogManagement />
    </div>
  );
}

export default AgileBacklogPage;
