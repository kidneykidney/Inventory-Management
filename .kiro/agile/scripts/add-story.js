#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Interactive story creation
 */
async function addStory() {
  const backlogPath = path.join(__dirname, '../backlog.json');
  
  if (!fs.existsSync(backlogPath)) {
    console.error('❌ Backlog file not found.');
    process.exit(1);
  }

  const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
  
  console.log('📝 Creating a new user story...\n');
  
  const story = {
    id: `story-${backlog.nextStoryId.toString().padStart(3, '0')}`,
    title: await question('Story title: '),
    description: await question('Story description: '),
    acceptanceCriteria: [],
    storyPoints: parseInt(await question('Story points (1,2,3,5,8,13,21): ')) || 0,
    priority: await question('Priority (High/Medium/Low): ') || 'Medium',
    status: 'backlog',
    assignee: await question('Assignee (optional): ') || null,
    epic: await question('Epic ID (optional): ') || null,
    tasks: [],
    createdDate: new Date().toISOString().split('T')[0]
  };
  
  // Add acceptance criteria
  console.log('\n📋 Add acceptance criteria (press Enter on empty line to finish):');
  let criteria = '';
  let criteriaIndex = 1;
  while (true) {
    criteria = await question(`  ${criteriaIndex}. `);
    if (!criteria.trim()) break;
    story.acceptanceCriteria.push(criteria);
    criteriaIndex++;
  }
  
  backlog.stories.push(story);
  backlog.nextStoryId++;
  
  fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
  
  console.log(`\n✅ Story ${story.id} created successfully!`);
  console.log(`📊 Story Points: ${story.storyPoints}`);
  console.log(`🎯 Priority: ${story.priority}`);
  
  rl.close();
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

if (require.main === module) {
  addStory().catch(console.error);
}

module.exports = { addStory };