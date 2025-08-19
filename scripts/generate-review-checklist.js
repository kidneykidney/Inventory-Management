#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
        return '';
    }
}

function analyzeChanges(files) {
    const analysis = {
        hasTests: false,
        hasComponents: false,
        hasAPI: false,
        hasDatabase: false,
        hasStyles: false,
        hasConfig: false,
        fileCount: files.length,
        riskLevel: 'low'
    };

    files.forEach(file => {
        if (file.includes('test') || file.includes('spec') || file.includes('__tests__')) {
            analysis.hasTests = true;
        }
        if (file.includes('components/') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
            analysis.hasComponents = true;
        }
        if (file.includes('api/') || file.includes('routes/') || file.includes('server/')) {
            analysis.hasAPI = true;
        }
        if (file.includes('migration') || file.includes('schema') || file.includes('database')) {
            analysis.hasDatabase = true;
        }
        if (file.endsWith('.css') || file.endsWith('.scss') || file.includes('styles/')) {
            analysis.hasStyles = true;
        }
        if (file.includes('config') || file.includes('.env') || file.endsWith('.json')) {
            analysis.hasConfig = true;
        }
    });

    // Determine risk level
    if (analysis.fileCount > 10 || analysis.hasDatabase || analysis.hasConfig) {
        analysis.riskLevel = 'high';
    } else if (analysis.fileCount > 5 || analysis.hasAPI) {
        analysis.riskLevel = 'medium';
    }

    return analysis;
}

function generateChecklist(analysis, branchName, commitCount) {
    const checklist = [];

    // Header
    checklist.push('# Code Review Checklist');
    checklist.push('');
    checklist.push(`**Branch**: ${branchName}`);
    checklist.push(`**Commits**: ${commitCount}`);
    checklist.push(`**Files Changed**: ${analysis.fileCount}`);
    checklist.push(`**Risk Level**: ${analysis.riskLevel.toUpperCase()}`);
    checklist.push('');

    // General checks
    checklist.push('## General Code Quality');
    checklist.push('- [ ] Code follows project style guidelines');
    checklist.push('- [ ] No console.log or debugging code left in');
    checklist.push('- [ ] Variable and function names are descriptive');
    checklist.push('- [ ] Code is properly commented where necessary');
    checklist.push('- [ ] No duplicate code or logic');
    checklist.push('- [ ] Error handling is implemented appropriately');
    checklist.push('');

    // Component-specific checks
    if (analysis.hasComponents) {
        checklist.push('## React Components');
        checklist.push('- [ ] Components are properly structured and follow React best practices');
        checklist.push('- [ ] Props are validated (PropTypes or TypeScript)');
        checklist.push('- [ ] Components are reusable and not overly complex');
        checklist.push('- [ ] Hooks are used correctly (dependencies, cleanup)');
        checklist.push('- [ ] State management is appropriate');
        checklist.push('- [ ] Accessibility attributes are included where needed');
        checklist.push('');
    }

    // API-specific checks
    if (analysis.hasAPI) {
        checklist.push('## API/Backend');
        checklist.push('- [ ] API endpoints follow RESTful conventions');
        checklist.push('- [ ] Input validation is implemented');
        checklist.push('- [ ] Error responses are consistent and informative');
        checklist.push('- [ ] Authentication/authorization is properly handled');
        checklist.push('- [ ] Database queries are optimized');
        checklist.push('- [ ] No sensitive data is exposed');
        checklist.push('');
    }

    // Database-specific checks
    if (analysis.hasDatabase) {
        checklist.push('## Database Changes');
        checklist.push('- [ ] Migration scripts are reversible');
        checklist.push('- [ ] Database schema changes are backward compatible');
        checklist.push('- [ ] Indexes are added for performance where needed');
        checklist.push('- [ ] Data integrity constraints are maintained');
        checklist.push('- [ ] Migration has been tested on sample data');
        checklist.push('');
    }

    // Testing checks
    checklist.push('## Testing');
    if (analysis.hasTests) {
        checklist.push('- [x] Tests are included for new functionality');
        checklist.push('- [ ] Tests cover edge cases and error scenarios');
        checklist.push('- [ ] Test names are descriptive and clear');
        checklist.push('- [ ] Tests are independent and can run in any order');
    } else {
        checklist.push('- [ ] ⚠️  Tests are missing - consider adding tests for new functionality');
    }
    checklist.push('- [ ] All existing tests still pass');
    checklist.push('- [ ] Code coverage is maintained or improved');
    checklist.push('');

    // Security checks
    checklist.push('## Security');
    checklist.push('- [ ] No hardcoded secrets or credentials');
    checklist.push('- [ ] User input is properly sanitized');
    checklist.push('- [ ] SQL injection vulnerabilities are prevented');
    checklist.push('- [ ] XSS vulnerabilities are prevented');
    checklist.push('- [ ] Authentication tokens are handled securely');
    checklist.push('');

    // Performance checks
    checklist.push('## Performance');
    checklist.push('- [ ] No unnecessary re-renders in React components');
    checklist.push('- [ ] Database queries are efficient');
    checklist.push('- [ ] Large datasets are paginated');
    checklist.push('- [ ] Images and assets are optimized');
    checklist.push('- [ ] No memory leaks introduced');
    checklist.push('');

    // Documentation checks
    checklist.push('## Documentation');
    checklist.push('- [ ] README updated if needed');
    checklist.push('- [ ] API documentation updated if endpoints changed');
    checklist.push('- [ ] Inline comments explain complex logic');
    checklist.push('- [ ] Breaking changes are documented');
    checklist.push('');

    // Risk-specific checks
    if (analysis.riskLevel === 'high') {
        checklist.push('## High Risk Changes');
        checklist.push('- [ ] Changes have been tested in staging environment');
        checklist.push('- [ ] Rollback plan is documented');
        checklist.push('- [ ] Database backup is available');
        checklist.push('- [ ] Monitoring and alerting are in place');
        checklist.push('- [ ] Stakeholders have been notified');
        checklist.push('');
    }

    // Final approval
    checklist.push('## Final Review');
    checklist.push('- [ ] All automated checks pass (CI/CD)');
    checklist.push('- [ ] Manual testing completed');
    checklist.push('- [ ] Code review feedback addressed');
    checklist.push('- [ ] Ready for merge');

    return checklist.join('\n');
}

function main() {
    console.log('🔍 Generating code review checklist...\n');

    try {
        // Get current branch
        const currentBranch = runCommand('git branch --show-current');
        
        // Get changed files
        const changedFiles = runCommand('git diff --name-only HEAD~1').split('\n').filter(f => f.trim());
        
        // Get commit count
        const commitCount = runCommand('git rev-list --count HEAD ^origin/develop 2>/dev/null || git rev-list --count HEAD').split('\n').length;

        if (changedFiles.length === 0) {
            console.log('❌ No changes detected. Make sure you have commits to review.');
            process.exit(1);
        }

        // Analyze changes
        const analysis = analyzeChanges(changedFiles);

        // Generate checklist
        const checklist = generateChecklist(analysis, currentBranch, commitCount);

        // Save checklist
        const checklistPath = '.review-checklist.md';
        fs.writeFileSync(checklistPath, checklist);

        console.log('✅ Code review checklist generated!');
        console.log(`📄 Saved to: ${checklistPath}`);
        console.log(`🔍 Risk Level: ${analysis.riskLevel.toUpperCase()}`);
        console.log(`📁 Files Changed: ${analysis.fileCount}`);
        console.log('\nReview areas identified:');
        if (analysis.hasComponents) console.log('  - React Components');
        if (analysis.hasAPI) console.log('  - API/Backend');
        if (analysis.hasDatabase) console.log('  - Database Changes');
        if (analysis.hasStyles) console.log('  - Styling');
        if (analysis.hasConfig) console.log('  - Configuration');
        if (analysis.hasTests) console.log('  - Tests');

        console.log('\n📋 Use this checklist during code review to ensure quality and completeness.');

    } catch (error) {
        console.error('❌ Error generating checklist:', error.message);
        process.exit(1);
    }
}

main();