#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup Git hooks for Agile workflow
 */
function setupGitHooks() {
  const gitHooksDir = path.join(process.cwd(), '.git', 'hooks');
  const agileHooksDir = path.join(__dirname, '../git-hooks');
  
  if (!fs.existsSync(gitHooksDir)) {
    console.error('❌ Git repository not found. Initialize git first.');
    process.exit(1);
  }
  
  if (!fs.existsSync(agileHooksDir)) {
    console.error('❌ Agile git hooks directory not found.');
    process.exit(1);
  }
  
  const hooks = ['pre-commit', 'commit-msg'];
  
  console.log('🔧 Setting up Git hooks for Agile workflow...\n');
  
  hooks.forEach(hook => {
    const sourcePath = path.join(agileHooksDir, hook);
    const targetPath = path.join(gitHooksDir, hook);
    
    if (fs.existsSync(sourcePath)) {
      // Backup existing hook if it exists
      if (fs.existsSync(targetPath)) {
        const backupPath = `${targetPath}.backup`;
        fs.copyFileSync(targetPath, backupPath);
        console.log(`📦 Backed up existing ${hook} to ${hook}.backup`);
      }
      
      // Copy new hook
      fs.copyFileSync(sourcePath, targetPath);
      fs.chmodSync(targetPath, '755');
      console.log(`✅ Installed ${hook} hook`);
    }
  });
  
  console.log('\n🎉 Git hooks setup complete!');
  console.log('\nHooks installed:');
  console.log('  • pre-commit: Runs linting and tests before commit');
  console.log('  • commit-msg: Validates commit message format');
  console.log('\nCommit message format: type(story-XXX): description');
  console.log('Example: feat(story-001): add user authentication');
}

if (require.main === module) {
  setupGitHooks();
}

module.exports = { setupGitHooks };