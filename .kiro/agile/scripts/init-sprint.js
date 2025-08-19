#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Initialize a new sprint with basic structure
 */
function initSprint() {
  const configPath = path.join(__dirname, '../config.json');
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(configPath) || !fs.existsSync(backlogPath)) {
    console.error('❌ Agile configuration files not found. Please ensure config.json and backlog.json exist.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  
  const nextSprintNumber = backlog.currentSprint + 1;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + config.sprints.duration);
  
  const newSprint = {
    id: `sprint-${nextSprintNumber.toString().padStart(3, '0')}`,
    number: nextSprintNumber,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    goal: `Sprint ${nextSprintNumber} - To be defined`,
    status: 'planning',
    stories: [],
    velocity: {
      planned: 0,
      completed: 0
    },
    burndown: [],
    retrospective: {
      whatWentWell: [],
      whatCouldImprove: [],
      actionItems: []
    },
    review: {
      completed: [],
      incomplete: [],
      stakeholderFeedback: []
    }
  };
  
  const sprintPath = path.join(__dirname, `../sprints/sprint-${nextSprintNumber.toString().padStart(3, '0')}.json`);
  fs.writeFileSync(sprintPath, JSON.stringify(newSprint, null, 2));
  
  // Update backlog with current sprint
  backlog.currentSprint = nextSprintNumber;
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  
  console.log(`✅ Sprint ${nextSprintNumber} initialized successfully!`);
  console.log(`📅 Duration: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
  console.log(`📁 Sprint file: ${sprintPath}`);
}

if (require.main === module) {
  initSprint();
}

module.exports = { initSprint };