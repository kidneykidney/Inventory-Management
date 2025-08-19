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

function extractStoryId(commitMessage) {
    // Look for STORY-XXX or #XXX patterns
    const storyPatterns = [
        /STORY-(\d+)/i,
        /#(\d+)/,
        /story[:\s]+(\d+)/i
    ];
    
    for (const pattern of storyPatterns) {
        const match = commitMessage.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

function determineStatusFromCommit(commitMessage) {
    const message = commitMessage.toLowerCase();
    
    // Check for completion keywords
    if (message.includes('complete') || message.includes('finish') || message.includes('done')) {
        return 'done';
    }
    
    // Check for review keywords
    if (message.includes('review') || message.includes('ready for review')) {
        return 'review';
    }
    
    // Check for testing keywords
    if (message.includes('test') && (message.includes('add') || message.includes('implement'))) {
        return 'in-progress';
    }
    
    // Check for initial/start keywords
    if (message.includes('initial') || message.includes('start') || message.includes('begin')) {
        return 'in-progress';
    }
    
    // Default to in-progress for any commit
    return 'in-progress';
}

function updateBacklogFile(storyId, newStatus, commitMessage) {
    const backlogPath = '.kiro/agile/backlog.json';
    
    if (!fs.existsSync(backlogPath)) {
        console.log('⚠️  Backlog file not found, creating new one...');
        const initialBacklog = {
            stories: [],
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(backlogPath, JSON.stringify(initialBacklog, null, 2));
    }
    
    try {
        const backlog = JSON.parse(fs.readFileSync(backlogPath, 'utf8'));
        
        // Find existing story or create new one
        let story = backlog.stories.find(s => s.id === storyId);
        
        if (!story) {
            story = {
                id: storyId,
                title: `Story ${storyId}`,
                status: 'todo',
                createdAt: new Date().toISOString(),
                commits: []
            };
            backlog.stories.push(story);
        }
        
        // Update story status
        const oldStatus = story.status;
        story.status = newStatus;
        story.lastUpdated = new Date().toISOString();
        
        // Add commit reference
        story.commits = story.commits || [];
        story.commits.push({
            message: commitMessage,
            timestamp: new Date().toISOString(),
            hash: runCommand('git rev-parse HEAD').substring(0, 8)
        });
        
        // Update backlog metadata
        backlog.lastUpdated = new Date().toISOString();
        
        // Save updated backlog
        fs.writeFileSync(backlogPath, JSON.stringify(backlog, null, 2));
        
        return { oldStatus, newStatus, story };
    } catch (error) {
        console.error('❌ Error updating backlog file:', error.message);
        return null;
    }
}

function generateStatusUpdateReport(updates) {
    if (updates.length === 0) {
        return 'No story status updates found.';
    }
    
    const report = ['# Story Status Updates', ''];
    
    updates.forEach(update => {
        report.push(`## Story ${update.storyId}`);
        report.push(`- **Status**: ${update.oldStatus} → ${update.newStatus}`);
        report.push(`- **Commit**: ${update.commitHash}`);
        report.push(`- **Message**: ${update.commitMessage}`);
        report.push(`- **Updated**: ${new Date().toLocaleString()}`);
        report.push('');
    });
    
    return report.join('\n');
}

function main() {
    console.log('📝 Checking for story status updates...\n');
    
    try {
        // Get recent commits (last 5)
        const commits = runCommand('git log --oneline -5').split('\n').filter(line => line.trim());
        
        if (commits.length === 0) {
            console.log('❌ No commits found');
            process.exit(1);
        }
        
        const updates = [];
        
        commits.forEach(commit => {
            const [hash, ...messageParts] = commit.split(' ');
            const message = messageParts.join(' ');
            
            const storyId = extractStoryId(message);
            if (storyId) {
                const newStatus = determineStatusFromCommit(message);
                const result = updateBacklogFile(storyId, newStatus, message);
                
                if (result) {
                    updates.push({
                        storyId,
                        oldStatus: result.oldStatus,
                        newStatus: result.newStatus,
                        commitHash: hash,
                        commitMessage: message
                    });
                    
                    console.log(`✅ Updated Story ${storyId}: ${result.oldStatus} → ${result.newStatus}`);
                }
            }
        });
        
        if (updates.length === 0) {
            console.log('ℹ️  No story references found in recent commits');
            console.log('   Use STORY-XXX or #XXX in commit messages to track stories');
        } else {
            // Generate and save report
            const report = generateStatusUpdateReport(updates);
            fs.writeFileSync('.story-updates.md', report);
            
            console.log(`\n📊 Updated ${updates.length} story status(es)`);
            console.log('📄 Report saved to: .story-updates.md');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run automatically if called directly
if (require.main === module) {
    main();
}

module.exports = { extractStoryId, determineStatusFromCommit, updateBacklogFile };