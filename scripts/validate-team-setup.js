#!/usr/bin/env node

/**
 * Repository Structure Validator
 * Checks if the 3-branch team structure is properly set up
 */

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, silent = true) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' }).trim();
    } catch (error) {
        return null;
    }
}

function checkBranchExists(branchName) {
    return runCommand(`git show-ref --verify --quiet refs/heads/${branchName}`) !== null;
}

function checkRemoteBranchExists(branchName) {
    return runCommand(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`) !== null;
}

function main() {
    console.log('🔍 Validating Repository Structure for Team Collaboration\n');

    // Check if we're in a Git repository
    if (!runCommand('git rev-parse --git-dir')) {
        console.log('❌ Not in a Git repository');
        process.exit(1);
    }

    let score = 0;
    const checks = [];

    // Check main branch
    if (checkBranchExists('main')) {
        console.log('✅ Main branch exists');
        score++;
        checks.push('✅ Main branch');
    } else {
        console.log('❌ Main branch missing');
        checks.push('❌ Main branch');
    }

    // Check develop branch
    if (checkBranchExists('develop')) {
        console.log('✅ Develop branch exists');
        score++;
        checks.push('✅ Develop branch');
    } else {
        console.log('❌ Develop branch missing');
        checks.push('❌ Develop branch');
    }

    // Check for feature branches
    const branches = runCommand('git branch').split('\n').map(b => b.trim().replace('* ', ''));
    const featureBranches = branches.filter(b => b.startsWith('feature/'));
    
    console.log(`✅ Found ${featureBranches.length} feature branch(es):`);
    featureBranches.forEach(branch => {
        console.log(`   - ${branch}`);
    });

    if (featureBranches.length >= 1) {
        score++;
        checks.push('✅ Feature branches');
    } else {
        checks.push('❌ No feature branches');
    }

    // Check for documentation
    const docFiles = [
        'TEAM_SETUP_GUIDE.md',
        'docs/team-collaboration-setup.md',
        'docs/git-workflow.md'
    ];

    docFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ Documentation: ${file}`);
            score++;
            checks.push(`✅ ${file}`);
        } else {
            console.log(`❌ Missing: ${file}`);
            checks.push(`❌ ${file}`);
        }
    });

    // Check for setup script
    if (fs.existsSync('scripts/setup-team-repository.js')) {
        console.log('✅ Setup script available');
        score++;
        checks.push('✅ Setup script');
    } else {
        console.log('❌ Setup script missing');
        checks.push('❌ Setup script');
    }

    console.log('\n📊 Repository Setup Score:');
    console.log(`${score}/${checks.length} checks passed\n`);

    if (score === checks.length) {
        console.log('🎉 Perfect! Your repository is ready for team collaboration.');
        console.log('\n📋 Next Steps:');
        console.log('1. Add team members as collaborators on GitHub');
        console.log('2. Set up branch protection rules');
        console.log('3. Share TEAM_SETUP_GUIDE.md with your team');
        console.log('4. Each team member should clone and set up their feature branch');
    } else {
        console.log('⚠️  Repository setup incomplete. Missing items:');
        checks.forEach(check => {
            if (check.startsWith('❌')) {
                console.log(`   ${check}`);
            }
        });
        console.log('\n💡 Run the setup script to fix missing items:');
        console.log('   node scripts/setup-team-repository.js');
    }

    console.log('\n📚 Documentation Available:');
    console.log('- TEAM_SETUP_GUIDE.md - Quick start guide');
    console.log('- docs/team-collaboration-setup.md - Detailed collaboration guide');
    console.log('- docs/git-workflow.md - Git workflow documentation');
}

if (require.main === module) {
    main();
}

module.exports = { main };