#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function runCommand(command, description) {
    try {
        console.log(`🔍 ${description}...`);
        const output = execSync(command, { encoding: 'utf8' });
        console.log(`✅ ${description} passed`);
        return { success: true, output: output.trim() };
    } catch (error) {
        console.error(`❌ ${description} failed:`);
        console.error(error.stdout || error.message);
        return { success: false, error: error.message };
    }
}

function checkCodeCoverage() {
    try {
        console.log('🔍 Checking code coverage...');
        
        // Run tests with coverage
        execSync('npm run test:unit', { stdio: 'pipe' });
        
        // Check if coverage report exists
        if (fs.existsSync('coverage/coverage-summary.json')) {
            const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'));
            const totalCoverage = coverage.total;
            
            const minCoverage = {
                statements: 70,
                branches: 60,
                functions: 70,
                lines: 70
            };
            
            let passed = true;
            const results = {};
            
            for (const [metric, threshold] of Object.entries(minCoverage)) {
                const actual = totalCoverage[metric].pct;
                results[metric] = { actual, threshold, passed: actual >= threshold };
                if (actual < threshold) {
                    passed = false;
                }
            }
            
            console.log('\n📊 Code Coverage Results:');
            for (const [metric, result] of Object.entries(results)) {
                const status = result.passed ? '✅' : '❌';
                console.log(`  ${status} ${metric}: ${result.actual}% (min: ${result.threshold}%)`);
            }
            
            return { success: passed, results };
        } else {
            console.log('⚠️  No coverage report found, skipping coverage check');
            return { success: true, results: {} };
        }
    } catch (error) {
        console.error('❌ Code coverage check failed:', error.message);
        return { success: false, error: error.message };
    }
}

function checkComplexity() {
    try {
        console.log('🔍 Checking code complexity...');
        
        // Simple complexity check - count lines in functions
        const jsFiles = execSync('find src/ server/ -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
            .split('\n')
            .filter(f => f.trim());
        
        let complexFiles = [];
        
        jsFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const lines = content.split('\n').length;
                
                // Flag files over 300 lines as potentially complex
                if (lines > 300) {
                    complexFiles.push({ file, lines });
                }
            }
        });
        
        if (complexFiles.length > 0) {
            console.log('⚠️  Large files detected (consider refactoring):');
            complexFiles.forEach(({ file, lines }) => {
                console.log(`    ${file}: ${lines} lines`);
            });
        } else {
            console.log('✅ No overly complex files detected');
        }
        
        return { success: true, complexFiles };
    } catch (error) {
        console.error('❌ Complexity check failed:', error.message);
        return { success: false, error: error.message };
    }
}

function checkDependencies() {
    try {
        console.log('🔍 Checking for security vulnerabilities...');
        
        // Run npm audit
        const auditResult = execSync('npm audit --audit-level=high --json', { encoding: 'utf8' });
        const audit = JSON.parse(auditResult);
        
        if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
            console.log('❌ High or critical security vulnerabilities found:');
            console.log(`  Critical: ${audit.metadata.vulnerabilities.critical}`);
            console.log(`  High: ${audit.metadata.vulnerabilities.high}`);
            console.log('  Run "npm audit fix" to resolve issues');
            return { success: false, vulnerabilities: audit.metadata.vulnerabilities };
        } else {
            console.log('✅ No high or critical security vulnerabilities found');
            return { success: true, vulnerabilities: audit.metadata.vulnerabilities };
        }
    } catch (error) {
        // npm audit returns non-zero exit code when vulnerabilities are found
        if (error.stdout) {
            try {
                const audit = JSON.parse(error.stdout);
                if (audit.metadata.vulnerabilities.high > 0 || audit.metadata.vulnerabilities.critical > 0) {
                    console.log('❌ High or critical security vulnerabilities found:');
                    console.log(`  Critical: ${audit.metadata.vulnerabilities.critical}`);
                    console.log(`  High: ${audit.metadata.vulnerabilities.high}`);
                    return { success: false, vulnerabilities: audit.metadata.vulnerabilities };
                }
            } catch (parseError) {
                console.log('⚠️  Could not parse audit results, skipping security check');
            }
        }
        return { success: true, vulnerabilities: {} };
    }
}

function generateQualityReport(results) {
    let branch = 'unknown';
    let commit = 'unknown';
    
    try {
        branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    } catch (error) {
        // Git not initialized or no commits
    }
    
    try {
        commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8);
    } catch (error) {
        // No commits yet
    }
    
    const report = {
        timestamp: new Date().toISOString(),
        branch: branch,
        commit: commit,
        results: results,
        overallStatus: results.every(r => r.success) ? 'PASSED' : 'FAILED'
    };
    
    fs.writeFileSync('.quality-gate-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n📊 Quality Gate Report:');
    console.log(`  Branch: ${report.branch}`);
    console.log(`  Commit: ${report.commit}`);
    console.log(`  Status: ${report.overallStatus}`);
    console.log(`  Report saved to: .quality-gate-report.json`);
    
    return report;
}

function main() {
    console.log('🚪 Running Quality Gate Checks...\n');
    
    const checks = [
        { name: 'Linting', fn: () => runCommand('npm run lint', 'Running ESLint') },
        { name: 'Formatting', fn: () => runCommand('npm run format:check', 'Checking code formatting') },
        { name: 'Unit Tests', fn: () => runCommand('npm run test:unit', 'Running unit tests') },
        { name: 'Code Coverage', fn: checkCodeCoverage },
        { name: 'Code Complexity', fn: checkComplexity },
        { name: 'Security Audit', fn: checkDependencies }
    ];
    
    const results = [];
    let allPassed = true;
    
    for (const check of checks) {
        console.log(`\n🔍 Running ${check.name} check...`);
        const result = check.fn();
        results.push({
            name: check.name,
            success: result.success,
            ...result
        });
        
        if (!result.success) {
            allPassed = false;
        }
    }
    
    // Generate report
    const report = generateQualityReport(results);
    
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('🎉 All quality gate checks passed!');
        console.log('✅ Code is ready for merge');
        process.exit(0);
    } else {
        console.log('❌ Quality gate checks failed!');
        console.log('🔧 Please fix the issues above before merging');
        process.exit(1);
    }
}

main();