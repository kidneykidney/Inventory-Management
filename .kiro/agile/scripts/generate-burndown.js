#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate burndown chart data for current sprint
 */
function generateBurndown() {
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(backlogPath)) {
    console.error('❌ Backlog file not found.');
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  const currentSprintNumber = backlog.currentSprint;
  
  if (currentSprintNumber === 0) {
    console.error('❌ No active sprint found.');
    process.exit(1);
  }
  
  const sprintPath = path.join(__dirname, `../sprints/sprint-${currentSprintNumber.toString().padStart(3, '0')}.json`);
  
  if (!fs.existsSync(sprintPath)) {
    console.error(`❌ Sprint file not found: ${sprintPath}`);
    process.exit(1);
  }
  
  const sprint = JSON.parse(fs.readFileSync(sprintPath, 'utf8'));
  
  console.log(`📈 BURNDOWN CHART - Sprint ${currentSprintNumber}`);
  console.log('='.repeat(50));
  console.log(`🎯 Goal: ${sprint.goal}`);
  console.log(`📅 Duration: ${sprint.startDate} to ${sprint.endDate}`);
  console.log(`📊 Status: ${sprint.status}\n`);
  
  if (sprint.burndown.length === 0) {
    console.log('⚠️  No burndown data available. Start the sprint first.');
    return;
  }
  
  console.log('Date       | Remaining | Completed | Progress');
  console.log('-'.repeat(50));
  
  sprint.burndown.forEach(point => {
    const progress = point.completedPoints + point.remainingPoints > 0 
      ? Math.round((point.completedPoints / (point.completedPoints + point.remainingPoints)) * 100)
      : 0;
    
    console.log(
      `${point.date} |    ${point.remainingPoints.toString().padStart(3)} pts |    ${point.completedPoints.toString().padStart(3)} pts |   ${progress.toString().padStart(3)}%`
    );
  });
  
  // Calculate ideal burndown
  const totalPoints = sprint.burndown[0].remainingPoints + sprint.burndown[0].completedPoints;
  const sprintDays = calculateSprintDays(sprint.startDate, sprint.endDate);
  const dailyIdealBurn = totalPoints / sprintDays;
  
  console.log('\n📊 SPRINT METRICS');
  console.log('-'.repeat(30));
  console.log(`Total Story Points: ${totalPoints}`);
  console.log(`Sprint Days: ${sprintDays}`);
  console.log(`Ideal Daily Burn: ${dailyIdealBurn.toFixed(1)} pts`);
  
  const currentPoint = sprint.burndown[sprint.burndown.length - 1];
  const daysElapsed = calculateDaysElapsed(sprint.startDate, currentPoint.date);
  const idealRemaining = Math.max(0, totalPoints - (dailyIdealBurn * daysElapsed));
  
  console.log(`Current Remaining: ${currentPoint.remainingPoints} pts`);
  console.log(`Ideal Remaining: ${idealRemaining.toFixed(1)} pts`);
  console.log(`Variance: ${(currentPoint.remainingPoints - idealRemaining).toFixed(1)} pts`);
  
  if (currentPoint.remainingPoints > idealRemaining) {
    console.log('⚠️  Behind schedule - consider scope adjustment');
  } else if (currentPoint.remainingPoints < idealRemaining) {
    console.log('🎉 Ahead of schedule - great work!');
  } else {
    console.log('✅ On track with ideal burndown');
  }
}

function calculateSprintDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateDaysElapsed(startDate, currentDate) {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

if (require.main === module) {
  generateBurndown();
}

module.exports = { generateBurndown };