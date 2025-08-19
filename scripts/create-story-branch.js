#!/usr/bin/env node

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

function runCommand(command, description) {
    try {
        console.log(`📋 ${description}...`);
        const output = execSync(command, { encoding: 'utf8' });
        console.log(`✅ ${description} completed`);
        return output.trim();
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        process.exit(1);
    }
}

function validateBranchName(name) {
    const regex = /^[a-z0-9-]+$/;
    return regex.test(name) && name.length >= 3 && name.length <= 50;
}

function sanitizeBranchName(input) {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

async function main() {
    console.log('🌟 Automated Story Branch Creation\n');

    try {
        // Check if we're in a Git repository
        runCommand('git rev-parse --git-dir', 'Checking Git repository');

        // Get current branch
        const currentBranch = runCommand('git branch --show-current', 'Getting current branch');
        console.log(`Current branch: ${currentBranch}\n`);

        // Ensure we're on develop branch
        if (currentBranch !== 'develop') {
            const switchToDevelop = await question('Switch to develop branch? (y/n): ');
            if (switchToDevelop.toLowerCase() === 'y') {
                runCommand('git checkout develop', 'Switching to develop branch');
                runCommand('git pull origin develop', 'Pulling latest changes');
            }
        } else {
            runCommand('git pull origin develop', 'Pulling latest changes');
        }

        // Get story information
        const storyId = await question('Enter Story ID (e.g., STORY-123 or #123): ');
        const storyTitle = await question('Enter Story Title: ');
        const branchType = await question('Branch type (feature/bugfix/hotfix) [feature]: ') || 'feature';

        // Validate inputs
        if (!storyId.trim()) {
            console.error('❌ Story ID is required');
            process.exit(1);
        }

        if (!storyTitle.trim()) {
            console.error('❌ Story Title is required');
            process.exit(1);
        }

        if (!['feature', 'bugfix', 'hotfix'].includes(branchType)) {
            console.error('❌ Invalid branch type. Use: feature, bugfix, or hotfix');
            process.exit(1);
        }

        // Create branch name
        const sanitizedTitle = sanitizeBranchName(storyTitle);
        const sanitizedStoryId = storyId.replace(/[^a-z0-9]/gi, '').toLowerCase();
        const branchName = `${branchType}/${sanitizedStoryId}-${sanitizedTitle}`;

        if (!validateBranchName(sanitizedTitle)) {
            console.error('❌ Invalid story title. Use only letters, numbers, and hyphens.');
            process.exit(1);
        }

        console.log(`\nProposed branch name: ${branchName}`);
        const confirm = await question('Create this branch? (y/n): ');

        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Branch creation cancelled');
            process.exit(0);
        }

        // Create and switch to new branch
        runCommand(`git checkout -b ${branchName}`, 'Creating new branch');

        // Create initial commit with story reference
        const initialCommitMessage = `chore: initialize ${branchType} branch for ${storyId}

Story: ${storyId}
Title: ${storyTitle}
Type: ${branchType}

This commit initializes the branch for implementing the user story.`;

        // Create a placeholder file to make the initial commit
        const fs = require('fs');
        const placeholderPath = `.story-${sanitizedStoryId}.md`;
        const placeholderContent = `# ${storyTitle}

**Story ID**: ${storyId}
**Branch**: ${branchName}
**Type**: ${branchType}

## Description
${storyTitle}

## Acceptance Criteria
- [ ] TODO: Add acceptance criteria

## Tasks
- [ ] TODO: Break down into implementation tasks

## Notes
- Created: ${new Date().toISOString()}
- Branch: ${branchName}
`;

        fs.writeFileSync(placeholderPath, placeholderContent);
        runCommand(`git add ${placeholderPath}`, 'Adding story placeholder file');
        runCommand(`git commit -m "${initialCommitMessage}"`, 'Creating initial commit');

        // Push branch to remote
        const pushBranch = await question('Push branch to remote? (y/n): ');
        if (pushBranch.toLowerCase() === 'y') {
            runCommand(`git push -u origin ${branchName}`, 'Pushing branch to remote');
        }

        console.log('\n🎉 Story branch created successfully!');
        console.log(`\nBranch: ${branchName}`);
        console.log(`Story: ${storyId} - ${storyTitle}`);
        console.log(`\nNext steps:`);
        console.log(`1. Edit ${placeholderPath} to add acceptance criteria and tasks`);
        console.log(`2. Start implementing the story`);
        console.log(`3. Make commits with conventional commit format`);
        console.log(`4. Reference the story ID in commit messages`);
        console.log(`5. Create a pull request when ready`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();