#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Verify Agile development setup
 */
function verifySetup() {
  console.log('🔍 AGILE SETUP VERIFICATION');
  console.log('===========================\n');
  
  const checks = [
    {
      name: 'Configuration Files',
      files: [
        '.kiro/agile/config.json',
        '.kiro/agile/backlog.json',
        '.kiro/agile/development.md',
        '.kiro/agile/README.md',
        '.kiro/agile/SETUP.md'
      ]
    },
    {
      name: 'Sprint Management',
      files: [
        '.kiro/agile/sprints/sprint-template.json'
      ]
    },
    {
      name: 'Automation Scripts',
      files: [
        '.kiro/agile/scripts/init-sprint.js',
        '.kiro/agile/scripts/start-sprint.js',
        '.kiro/agile/scripts/add-story.js',
        '.kiro/agile/scripts/update-story.js',
        '.kiro/agile/scripts/generate-report.js',
        '.kiro/agile/scripts/generate-burndown.js',
        '.kiro/agile/scripts/setup-git-hooks.js'
      ]
    },
    {
      name: 'Git Hooks',
      files: [
        '.kiro/agile/git-hooks/pre-commit',
        '.kiro/agile/git-hooks/commit-msg'
      ]
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    console.log(`📂 ${check.name}`);
    console.log('-'.repeat(check.name.length + 3));
    
    check.files.forEach(file => {
      const exists = fs.existsSync(file);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${file}`);
      
      if (!exists) {
        allPassed = false;
      }
    });
    
    console.log('');
  });
  
  // Check package.json scripts
  console.log('📦 Package.json Scripts');
  console.log('-----------------------');
  
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const requiredScripts = [
      'agile:init',
      'agile:start-sprint',
      'agile:add-story',
      'agile:update-story',
      'agile:report',
      'agile:burndown',
      'agile:setup-hooks',
      'test:unit'
    ];
    
    requiredScripts.forEach(script => {
      const exists = packageData.scripts && packageData.scripts[script];
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${script}`);
      
      if (!exists) {
        allPassed = false;
      }
    });
  } else {
    console.log('❌ package.json not found');
    allPassed = false;
  }
  
  console.log('\n🧪 FUNCTIONALITY TESTS');
  console.log('======================');
  
  // Test report generation
  try {
    const { generateReport } = require('./generate-report.js');
    console.log('✅ Report generation script loads correctly');
  } catch (error) {
    console.log('❌ Report generation script has issues:', error.message);
    allPassed = false;
  }
  
  // Test configuration loading
  try {
    const config = JSON.parse(fs.readFileSync('.kiro/agile/config.json', 'utf8'));
    const backlog = JSON.parse(fs.readFileSync('.kiro/agile/backlog.json', 'utf8'));
    console.log('✅ Configuration files are valid JSON');
    console.log(`   - Project: ${config.project.name}`);
    console.log(`   - Epics: ${backlog.epics.length}`);
    console.log(`   - Stories: ${backlog.stories.length}`);
  } catch (error) {
    console.log('❌ Configuration files have JSON errors:', error.message);
    allPassed = false;
  }
  
  console.log('\n📊 SETUP SUMMARY');
  console.log('================');
  
  if (allPassed) {
    console.log('🎉 All checks passed! Agile development setup is complete.');
    console.log('\nNext steps:');
    console.log('1. Initialize your first sprint: npm run agile:init');
    console.log('2. Add user stories: npm run agile:add-story');
    console.log('3. Start development: npm run dev');
    console.log('4. Track progress: npm run agile:report');
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
    console.log('Run the setup again or check the SETUP.md guide.');
  }
  
  return allPassed;
}

if (require.main === module) {
  const success = verifySetup();
  process.exit(success ? 0 : 1);
}

module.exports = { verifySetup };