#!/usr/bin/env node

/**
 * Team Repository Setup Script
 * Initializes a 3-branch Git repository structure for collaborative development
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function runCommand(command, description, silent = false) {
    try {
        if (!silent) console.log(`📋 ${description}...`);
        const output = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
        if (!silent) console.log(`✅ ${description} completed`);
        return output.trim();
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        if (error.message.includes('already exists')) {
            console.log(`ℹ️  Branch already exists, continuing...`);
            return null;
        }
        process.exit(1);
    }
}

function checkGitRepo() {
    try {
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function getCurrentBranch() {
    try {
        return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch {
        return 'main';
    }
}

function branchExists(branchName) {
    try {
        execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function remoteBranchExists(branchName) {
    try {
        execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

async function main() {
    console.log('🚀 Team Repository Setup for 3-Person Development Team\n');
    
    try {
        // Check if we're in a Git repository
        if (!checkGitRepo()) {
            console.log('❌ This directory is not a Git repository.');
            console.log('Please run this script from the root of your Git repository.');
            process.exit(1);
        }

        // Get team information
        console.log('📝 Team Setup Information:');
        const teamMember1 = await question('Enter name for team member 1: ');
        const teamMember2 = await question('Enter name for team member 2: ');
        const teamMember3 = await question('Enter name for team member 3: ');

        if (!teamMember1.trim() || !teamMember2.trim() || !teamMember3.trim()) {
            console.error('❌ All team member names are required');
            process.exit(1);
        }

        console.log('\n🔧 Setting up repository structure...\n');

        // Check current branch
        const currentBranch = getCurrentBranch();
        console.log(`Current branch: ${currentBranch}`);

        // Ensure we're working from main branch
        if (currentBranch !== 'main') {
            if (branchExists('main')) {
                runCommand('git checkout main', 'Switching to main branch');
            } else {
                console.log('ℹ️  Creating main branch from current branch');
                runCommand('git checkout -b main', 'Creating main branch');
            }
        }

        // Pull latest changes if remote exists
        try {
            runCommand('git pull origin main', 'Pulling latest changes from remote main', true);
        } catch {
            console.log('ℹ️  No remote main branch found, continuing...');
        }

        // Create develop branch
        if (!branchExists('develop')) {
            runCommand('git checkout -b develop', 'Creating develop branch');
            
            try {
                runCommand('git push -u origin develop', 'Pushing develop branch to remote');
            } catch {
                console.log('ℹ️  Could not push to remote, you may need to set up remote later');
            }
        } else {
            console.log('ℹ️  Develop branch already exists');
            runCommand('git checkout develop', 'Switching to develop branch');
        }

        // Create initial feature branches for team members
        const sanitize = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const branches = [
            `feature/${sanitize(teamMember1)}-initial-setup`,
            `feature/${sanitize(teamMember2)}-initial-setup`,
            `feature/${sanitize(teamMember3)}-initial-setup`
        ];

        for (let i = 0; i < branches.length; i++) {
            const branchName = branches[i];
            const memberName = [teamMember1, teamMember2, teamMember3][i];
            
            if (!branchExists(branchName)) {
                runCommand(`git checkout -b ${branchName}`, `Creating branch for ${memberName}`);
                
                // Create a placeholder file for the team member
                const placeholderContent = `# ${memberName}'s Development Branch

This is your personal feature branch. You can:

1. Make changes and commit them
2. Push to this branch: \`git push -u origin ${branchName}\`
3. Create pull requests to merge into develop branch

## Getting Started

1. Make your changes
2. Stage them: \`git add .\`
3. Commit: \`git commit -m "feat: your feature description"\`
4. Push: \`git push origin ${branchName}\`
5. Create a Pull Request on GitHub to merge into develop

## Branch Commands Quick Reference

\`\`\`bash
# Switch to your branch
git checkout ${branchName}

# Get latest changes from develop
git checkout develop
git pull origin develop
git checkout ${branchName}
git merge develop

# Push your changes
git push origin ${branchName}
\`\`\`
`;

                require('fs').writeFileSync(`${sanitize(memberName)}-README.md`, placeholderContent);
                runCommand(`git add ${sanitize(memberName)}-README.md`, `Adding placeholder file for ${memberName}`, true);
                runCommand(`git commit -m "feat: add initial setup for ${memberName}"`, `Creating initial commit for ${memberName}`, true);

                try {
                    runCommand(`git push -u origin ${branchName}`, `Pushing ${memberName}'s branch to remote`);
                } catch {
                    console.log(`ℹ️  Could not push ${branchName} to remote, you may need to set up remote later`);
                }
            } else {
                console.log(`ℹ️  Branch ${branchName} already exists`);
            }
        }

        // Return to develop branch
        runCommand('git checkout develop', 'Returning to develop branch');

        console.log('\n🎉 Team repository setup completed successfully!\n');
        
        // Display summary
        console.log('📊 Repository Structure:');
        console.log('├── main (production-ready code)');
        console.log('├── develop (integration branch)');
        branches.forEach((branch, index) => {
            const memberName = [teamMember1, teamMember2, teamMember3][index];
            console.log(`└── ${branch} (${memberName}'s feature branch)`);
        });

        console.log('\n📋 Next Steps for Repository Owner:');
        console.log('1. Set up branch protection rules on GitHub:');
        console.log('   - Protect main branch (require 2 reviewers)');
        console.log('   - Protect develop branch (require 1 reviewer)');
        console.log('2. Add team members as collaborators to the repository');
        console.log('3. Share the repository URL with your team');

        console.log('\n👥 Instructions for Team Members:');
        console.log('1. Clone the repository:');
        console.log('   git clone <repository-url>');
        console.log('2. Configure your Git identity:');
        console.log('   git config --global user.name "Your Name"');
        console.log('   git config --global user.email "your.email@example.com"');
        console.log('3. Switch to your feature branch:');
        branches.forEach((branch, index) => {
            const memberName = [teamMember1, teamMember2, teamMember3][index];
            console.log(`   ${memberName}: git checkout ${branch}`);
        });

        console.log('\n📖 Documentation:');
        console.log('- Team collaboration guide: docs/team-collaboration-setup.md');
        console.log('- Git workflow guide: docs/git-workflow.md');
        console.log('- Agile development guide: .kiro/agile/development.md');

        console.log('\n✨ Your team is ready to start collaborating!');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };