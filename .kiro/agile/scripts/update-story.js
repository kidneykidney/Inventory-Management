#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Update story status
 */
function updateStory() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: npm run agile:update-story <story-id> <status>');
    console.log('Status options: backlog, todo, in-progress, review, done');
    process.exit(1);
  }
  
  const [storyId, newStatus] = args;
  const validStatuses = ['backlog', 'todo', 'in-progress', 'review', 'done'];
  
  if (!validStatuses.includes(newStatus)) {
    console.error(`❌ Invalid status. Valid options: ${validStatuses.join(', ')}`);
    process.exit(1);
  }
  
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(backlogPath)) {
    console.error('❌ Backlog file not found.');
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  const story = backlog.stories.find(s => s.id === storyId);
  
  if (!story) {
    console.error(`❌ Story ${storyId} not found.`);
    process.exit(1);
  }
  
  const oldStatus = story.status;
  story.status = newStatus;
  story.lastUpdated = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  
  console.log(`✅ Story ${storyId} status updated: ${oldStatus} → ${newStatus}`);
  
  // Update burndown if story is completed
  if (newStatus === 'done' && oldStatus !== 'done') {
    updateBurndown(storyId, story.storyPoints);
  }
}

function updateBurndown(storyId, storyPoints) {
  const backlogPath = path.join(__dirname, '../backlog.json');
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  const currentSprintNumber = backlog.currentSprint;
  
  if (currentSprintNumber === 0) return;
  
  const sprintPath = path.join(__dirname, `../sprints/sprint-${currentSprintNumber.toString().padStart(3, '0')}.json`);
  
  if (!fs.existsSync(sprintPath)) return;
  
  const sprint = JSON.parse(fs.readFileSync(sprintPath, 'utf8'));
  
  if (sprint.status !== 'active') return;
  
  const today = new Date().toISOString().split('T')[0];
  const lastBurndown = sprint.burndown[sprint.burndown.length - 1];
  
  if (lastBurndown.date === today) {
    // Update today's entry
    lastBurndown.completedPoints += storyPoints;
    lastBurndown.remainingPoints -= storyPoints;
  } else {
    // Add new entry for today
    sprint.burndown.push({
      date: today,
      remainingPoints: lastBurndown.remainingPoints - storyPoints,
      completedPoints: lastBurndown.completedPoints + storyPoints
    });
  }
  
  fs.writeFileSync(sprintPath, JSON.stringify(sprint, null, 2));
  console.log(`📈 Burndown updated: ${storyPoints} points completed`);
}

if (require.main === module) {
  updateStory();
}

module.exports = { updateStory };