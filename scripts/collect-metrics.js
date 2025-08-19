#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8' }).trim();
    } catch (error) {
        return null;
    }
}

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return {
            total: content.split('\n').length,
            code: content.split('\n').filter(line => line.trim() && !line.trim().startsWith('//')).length,
            comments: content.split('\n').filter(line => line.trim().startsWith('//')).length
        };
    } catch (error) {
        return { total: 0, code: 0, comments: 0 };
    }
}

function analyzeCodebase() {
    console.log('📊 Analyzing codebase...');
    
    const extensions = ['.js', '.jsx', '.ts', '.tsx'];
    const directories = ['src/', 'server/'];
    
    let totalFiles = 0;
    let totalLines = { total: 0, code: 0, comments: 0 };
    let filesByType = {};
    let largestFiles = [];
    
    directories.forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = runCommand(`find ${dir} -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" \\)`);
            if (files) {
                files.split('\n').forEach(file => {
                    if (file.trim()) {
                        totalFiles++;
                        const ext = path.extname(file);
                        filesByType[ext] = (filesByType[ext] || 0) + 1;
                        
                        const lines = countLines(file);
                        totalLines.total += lines.total;
                        totalLines.code += lines.code;
                        totalLines.comments += lines.comments;
                        
                        if (lines.total > 100) {
                            largestFiles.push({ file, lines: lines.total });
                        }
                    }
                });
            }
        }
    });
    
    // Sort largest files
    largestFiles.sort((a, b) => b.lines - a.lines);
    largestFiles = largestFiles.slice(0, 10);
    
    return {
        totalFiles,
        totalLines,
        filesByType,
        largestFiles,
        averageLinesPerFile: totalFiles > 0 ? Math.round(totalLines.total / totalFiles) : 0
    };
}

function analyzeTestCoverage() {
    console.log('🧪 Analyzing test coverage...');
    
    try {
        // Run tests with coverage
        runCommand('npm run test:unit');
        
        if (fs.existsSync('coverage/coverage-summary.json')) {
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            return coverage.total;
        }
    } catch (error) {
        console.log('⚠️  Could not analyze test coverage');
    }
    
    return null;
}

function analyzeGitMetrics() {
    console.log('📈 Analyzing Git metrics...');
    
    const metrics = {};
    
    // Commit frequency (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split('T')[0];
    
    const recentCommits = runCommand(`git log --since="${since}" --oneline`);
    metrics.commitsLast30Days = recentCommits ? recentCommits.split('\n').length : 0;
    
    // Contributors
    const contributors = runCommand('git log --format="%an" | sort | uniq');
    metrics.totalContributors = contributors ? contributors.split('\n').length : 0;
    
    // Branch info
    const branches = runCommand('git branch -r');
    metrics.totalBranches = branches ? branches.split('\n').length : 0;
    
    // Most active files
    const activeFiles = runCommand('git log --name-only --pretty=format: | sort | uniq -c | sort -nr | head -10');
    metrics.mostActiveFiles = activeFiles ? activeFiles.split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        return { file: parts.slice(1).join(' '), changes: parseInt(parts[0]) || 0 };
    }).filter(item => item.file) : [];
    
    return metrics;
}

function analyzeDependencies() {
    console.log('📦 Analyzing dependencies...');
    
    const metrics = {};
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        metrics.dependencies = Object.keys(packageJson.dependencies || {}).length;
        metrics.devDependencies = Object.keys(packageJson.devDependencies || {}).length;
        metrics.totalDependencies = metrics.dependencies + metrics.devDependencies;
        
        // Check for outdated packages
        const outdated = runCommand('npm outdated --json');
        if (outdated) {
            const outdatedPackages = JSON.parse(outdated);
            metrics.outdatedPackages = Object.keys(outdatedPackages).length;
        } else {
            metrics.outdatedPackages = 0;
        }
        
        // Security audit
        const audit = runCommand('npm audit --json');
        if (audit) {
            const auditResult = JSON.parse(audit);
            metrics.vulnerabilities = auditResult.metadata?.vulnerabilities || {};
        } else {
            metrics.vulnerabilities = {};
        }
        
    } catch (error) {
        console.log('⚠️  Could not analyze dependencies');
        metrics.dependencies = 0;
        metrics.devDependencies = 0;
        metrics.totalDependencies = 0;
        metrics.outdatedPackages = 0;
        metrics.vulnerabilities = {};
    }
    
    return metrics;
}

function calculateQualityScore(metrics) {
    let score = 100;
    
    // Deduct points for issues
    if (metrics.coverage && metrics.coverage.statements.pct < 70) {
        score -= 20;
    }
    
    if (metrics.codebase.averageLinesPerFile > 200) {
        score -= 10;
    }
    
    if (metrics.dependencies.vulnerabilities.high > 0) {
        score -= 15;
    }
    
    if (metrics.dependencies.vulnerabilities.critical > 0) {
        score -= 25;
    }
    
    if (metrics.dependencies.outdatedPackages > 10) {
        score -= 10;
    }
    
    if (metrics.git.commitsLast30Days < 5) {
        score -= 5;
    }
    
    return Math.max(0, score);
}

function generateReport(metrics) {
    const report = {
        timestamp: new Date().toISOString(),
        branch: runCommand('git branch --show-current'),
        commit: runCommand('git rev-parse HEAD')?.substring(0, 8),
        qualityScore: calculateQualityScore(metrics),
        metrics: metrics
    };
    
    // Save detailed report
    fs.writeFileSync('.code-metrics.json', JSON.stringify(report, null, 2));
    
    // Generate summary report
    const summary = [
        '# Code Quality Metrics Report',
        '',
        `**Generated**: ${new Date().toLocaleString()}`,
        `**Branch**: ${report.branch}`,
        `**Commit**: ${report.commit}`,
        `**Quality Score**: ${report.qualityScore}/100`,
        '',
        '## Codebase Overview',
        `- **Total Files**: ${metrics.codebase.totalFiles}`,
        `- **Total Lines**: ${metrics.codebase.totalLines.total.toLocaleString()}`,
        `- **Code Lines**: ${metrics.codebase.totalLines.code.toLocaleString()}`,
        `- **Average Lines per File**: ${metrics.codebase.averageLinesPerFile}`,
        '',
        '## Test Coverage',
    ];
    
    if (metrics.coverage) {
        summary.push(`- **Statements**: ${metrics.coverage.statements.pct}%`);
        summary.push(`- **Branches**: ${metrics.coverage.branches.pct}%`);
        summary.push(`- **Functions**: ${metrics.coverage.functions.pct}%`);
        summary.push(`- **Lines**: ${metrics.coverage.lines.pct}%`);
    } else {
        summary.push('- No coverage data available');
    }
    
    summary.push('');
    summary.push('## Dependencies');
    summary.push(`- **Production**: ${metrics.dependencies.dependencies}`);
    summary.push(`- **Development**: ${metrics.dependencies.devDependencies}`);
    summary.push(`- **Outdated**: ${metrics.dependencies.outdatedPackages}`);
    summary.push(`- **Vulnerabilities**: ${JSON.stringify(metrics.dependencies.vulnerabilities)}`);
    
    summary.push('');
    summary.push('## Git Activity');
    summary.push(`- **Commits (30 days)**: ${metrics.git.commitsLast30Days}`);
    summary.push(`- **Contributors**: ${metrics.git.totalContributors}`);
    summary.push(`- **Branches**: ${metrics.git.totalBranches}`);
    
    if (metrics.codebase.largestFiles.length > 0) {
        summary.push('');
        summary.push('## Largest Files');
        metrics.codebase.largestFiles.slice(0, 5).forEach(file => {
            summary.push(`- ${file.file}: ${file.lines} lines`);
        });
    }
    
    fs.writeFileSync('.code-metrics-summary.md', summary.join('\n'));
    
    return report;
}

function main() {
    console.log('📊 Collecting Code Quality Metrics...\n');
    
    const metrics = {
        codebase: analyzeCodebase(),
        coverage: analyzeTestCoverage(),
        git: analyzeGitMetrics(),
        dependencies: analyzeDependencies()
    };
    
    const report = generateReport(metrics);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Code Quality Metrics Summary');
    console.log('='.repeat(50));
    console.log(`Quality Score: ${report.qualityScore}/100`);
    console.log(`Total Files: ${metrics.codebase.totalFiles}`);
    console.log(`Total Lines: ${metrics.codebase.totalLines.total.toLocaleString()}`);
    
    if (metrics.coverage) {
        console.log(`Test Coverage: ${metrics.coverage.statements.pct}%`);
    }
    
    console.log(`Dependencies: ${metrics.dependencies.totalDependencies}`);
    console.log(`Recent Commits: ${metrics.git.commitsLast30Days}`);
    
    console.log('\n📄 Detailed reports saved:');
    console.log('  - .code-metrics.json (detailed data)');
    console.log('  - .code-metrics-summary.md (summary report)');
    
    if (report.qualityScore < 70) {
        console.log('\n⚠️  Quality score is below 70. Consider addressing the issues above.');
    } else {
        console.log('\n✅ Good code quality score!');
    }
}

main();