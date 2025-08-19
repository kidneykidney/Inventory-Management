#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Setting up Git workflow and branch management...\n');

// Function to execute shell commands
function runCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${description} completed\n`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        process.exit(1);
    }
}

// Function to check if we're in a Git repository
function checkGitRepo() {
    try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Initialize Git repository if not already initialized
if (!checkGitRepo()) {
    runCommand('git init', 'Initializing Git repository');
}

// Configure Git hooks path
runCommand('git config core.hooksPath .githooks', 'Configuring Git hooks path');

// Create .gitignore if it doesn't exist
const gitignorePath = '.gitignore';
if (!fs.existsSync(gitignorePath)) {
    const gitignoreContent = `# Dependencies
node_modules/
server/node_modules/

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
server/logs/*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
*.tmp
*.temp
`;
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Created .gitignore file\n');
}

// Create branch protection configuration
const branchProtectionConfig = {
    main: {
        protection: true,
        requiredReviews: 2,
        dismissStaleReviews: true,
        requireCodeOwnerReviews: false,
        requiredStatusChecks: ['ci/tests', 'ci/lint', 'ci/build']
    },
    develop: {
        protection: true,
        requiredReviews: 1,
        dismissStaleReviews: true,
        requireCodeOwnerReviews: false,
        requiredStatusChecks: ['ci/tests', 'ci/lint']
    }
};

fs.writeFileSync(
    'scripts/branch-protection-config.json',
    JSON.stringify(branchProtectionConfig, null, 2)
);
console.log('✅ Created branch protection configuration\n');

// Create merge request template
const mrTemplatePath = '.github/pull_request_template.md';
const mrTemplateDir = path.dirname(mrTemplatePath);

if (!fs.existsSync(mrTemplateDir)) {
    fs.mkdirSync(mrTemplateDir, { recursive: true });
}

const mrTemplate = `## Description
Brief description of the changes made in this PR.

## Related Story
- Story ID: STORY-XXX or #XXX
- Story Title: [Brief title of the user story]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test coverage improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Code coverage maintained or improved

## Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review of code completed
- [ ] Code is properly commented
- [ ] No console.log or debugging code left in
- [ ] Error handling implemented where needed

## Documentation
- [ ] Documentation updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] README updated (if needed)

## Screenshots (if applicable)
Add screenshots or GIFs to help explain your changes.

## Additional Notes
Any additional information that reviewers should know.

## Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
`;

fs.writeFileSync(mrTemplatePath, mrTemplate);
console.log('✅ Created pull request template\n');

// Create branch naming guide
const branchGuide = `# Git Branch Naming Convention

## Branch Types

### Feature Branches
- **Format**: \`feature/description-here\`
- **Purpose**: New features or enhancements
- **Examples**: 
  - \`feature/user-authentication\`
  - \`feature/inventory-dashboard\`
  - \`feature/story-estimation\`

### Bug Fix Branches
- **Format**: \`bugfix/description-here\`
- **Purpose**: Bug fixes and issue resolution
- **Examples**:
  - \`bugfix/login-validation-error\`
  - \`bugfix/chart-rendering-issue\`

### Hotfix Branches
- **Format**: \`hotfix/description-here\`
- **Purpose**: Critical fixes that need immediate deployment
- **Examples**:
  - \`hotfix/security-vulnerability\`
  - \`hotfix/data-corruption-fix\`

### Release Branches
- **Format**: \`release/version-number\`
- **Purpose**: Preparing releases
- **Examples**:
  - \`release/v1.0.0\`
  - \`release/v2.1.0\`

## Branch Workflow

1. **Create branch from develop**: \`git checkout develop && git pull && git checkout -b feature/your-feature\`
2. **Work on your feature**: Make commits following conventional commit format
3. **Push branch**: \`git push -u origin feature/your-feature\`
4. **Create Pull Request**: Use the PR template to describe your changes
5. **Code Review**: Address feedback and make necessary changes
6. **Merge**: Once approved, merge into develop branch

## Protected Branches

- **main**: Production-ready code, requires 2 reviewers
- **develop**: Integration branch, requires 1 reviewer

## Commit Message Format

Follow conventional commits:
- \`feat(scope): add new feature\`
- \`fix(scope): resolve bug\`
- \`docs: update documentation\`
- \`style: format code\`
- \`refactor: restructure code\`
- \`test: add tests\`
- \`chore: update dependencies\`
`;

fs.writeFileSync('docs/git-workflow.md', branchGuide);
console.log('✅ Created Git workflow documentation\n');

console.log('🎉 Git workflow setup completed successfully!');
console.log('\nNext steps:');
console.log('1. Review the branch protection configuration in scripts/branch-protection-config.json');
console.log('2. Set up your Git hosting platform (GitHub/GitLab) with the protection rules');
console.log('3. Train your team on the new workflow using docs/git-workflow.md');
console.log('4. Test the hooks by making a commit');