#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Generate Agile project reports
 */
function generateReport() {
  const configPath = path.join(__dirname, '../config.json');
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(configPath) || !fs.existsSync(backlogPath)) {
    console.error('❌ Configuration files not found.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  
  console.log('📊 AGILE PROJECT REPORT');
  console.log('========================\n');
  
  // Project Overview
  console.log(`🏗️  Project: ${config.project.name}`);
  console.log(`📅 Start Date: ${config.project.startDate}`);
  console.log(`🏃 Current Sprint: ${backlog.currentSprint}`);
  console.log(`👥 Team Size: ${config.team.size}\n`);
  
  // Epic Summary
  console.log('📚 EPICS SUMMARY');
  console.log('================');
  backlog.epics.forEach(epic => {
    console.log(`${epic.id}: ${epic.title} (${epic.status})`);
    console.log(`   Target Sprint: ${epic.targetSprint}`);
    console.log(`   Stories: ${epic.storyIds.length}`);
  });
  console.log('');
  
  // Story Summary
  const storyStats = {
    total: backlog.stories.length,
    backlog: backlog.stories.filter(s => s.status === 'backlog').length,
    todo: backlog.stories.filter(s => s.status === 'todo').length,
    inProgress: backlog.stories.filter(s => s.status === 'in-progress').length,
    review: backlog.stories.filter(s => s.status === 'review').length,
    done: backlog.stories.filter(s => s.status === 'done').length
  };
  
  console.log('📋 STORY SUMMARY');
  console.log('================');
  console.log(`Total Stories: ${storyStats.total}`);
  console.log(`📦 Backlog: ${storyStats.backlog}`);
  console.log(`📝 To Do: ${storyStats.todo}`);
  console.log(`🔄 In Progress: ${storyStats.inProgress}`);
  console.log(`👀 Review: ${storyStats.review}`);
  console.log(`✅ Done: ${storyStats.done}\n`);
  
  // Story Points Summary
  const totalPoints = backlog.stories.reduce((sum, story) => sum + story.storyPoints, 0);
  const completedPoints = backlog.stories
    .filter(s => s.status === 'done')
    .reduce((sum, story) => sum + story.storyPoints, 0);
  
  console.log('🎯 STORY POINTS');
  console.log('===============');
  console.log(`Total Points: ${totalPoints}`);
  console.log(`Completed Points: ${completedPoints}`);
  console.log(`Completion Rate: ${totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0}%\n`);
  
  // Sprint Files
  const sprintsDir = path.join(__dirname, '../sprints');
  if (fs.existsSync(sprintsDir)) {
    const sprintFiles = fs.readdirSync(sprintsDir)
      .filter(file => file.startsWith('sprint-') && file.endsWith('.json'))
      .filter(file => file !== 'sprint-template.json');
    
    console.log('🏃 SPRINTS');
    console.log('==========');
    console.log(`Total Sprints: ${sprintFiles.length}`);
    sprintFiles.forEach(file => {
      const sprintData = JSON.parse(fs.readFileSync(path.join(sprintsDir, file), 'utf8'));
      console.log(`${sprintData.id}: ${sprintData.goal} (${sprintData.status})`);
    });
  }
  
  console.log('\n📈 Report generated successfully!');
}

if (require.main === module) {
  generateReport();
}

module.exports = { generateReport };