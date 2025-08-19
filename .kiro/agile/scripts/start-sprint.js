#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Start the current sprint
 */
function startSprint() {
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(backlogPath)) {
    console.error('❌ Backlog file not found.');
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  const currentSprintNumber = backlog.currentSprint;
  
  if (currentSprintNumber === 0) {
    console.error('❌ No sprint initialized. Run "npm run agile:init" first.');
    process.exit(1);
  }
  
  const sprintPath = path.join(__dirname, `../sprints/sprint-${currentSprintNumber.toString().padStart(3, '0')}.json`);
  
  if (!fs.existsSync(sprintPath)) {
    console.error(`❌ Sprint file not found: ${sprintPath}`);
    process.exit(1);
  }
  
  const sprint = JSON.parse(fs.readFileSync(sprintPath, 'utf8'));
  
  if (sprint.status === 'active') {
    console.log(`⚠️  Sprint ${currentSprintNumber} is already active.`);
    return;
  }
  
  sprint.status = 'active';
  sprint.startDate = new Date().toISOString().split('T')[0];
  
  // Initialize burndown with starting point
  const totalPoints = sprint.stories.reduce((sum, storyId) => {
    const story = backlog.stories.find(s => s.id === storyId);
    return sum + (story ? story.storyPoints : 0);
  }, 0);
  
  sprint.burndown = [{
    date: sprint.startDate,
    remainingPoints: totalPoints,
    completedPoints: 0
  }];
  
  fs.writeFileSync(sprintPath, JSON.stringify(sprint, null, 2));
  
  console.log(`🚀 Sprint ${currentSprintNumber} started successfully!`);
  console.log(`📅 Start Date: ${sprint.startDate}`);
  console.log(`🎯 Sprint Goal: ${sprint.goal}`);
  console.log(`📊 Total Story Points: ${totalPoints}`);
  console.log(`📋 Stories in Sprint: ${sprint.stories.length}`);
}

if (require.main === module) {
  startSprint();
}

module.exports = { startSprint };