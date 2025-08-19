#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

// Performance test configuration
const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiUrl: process.env.API_URL || 'http://localhost:5000/api',
    concurrency: process.env.CONCURRENCY || 10,
    duration: process.env.DURATION || '30s',
    thresholds: {
        responseTime: 2000, // ms
        errorRate: 0.05, // 5%
        throughput: 10 // requests per second
    }
};

function runCommand(command, description) {
    try {
        console.log(`🔄 ${description}...`);
        const output = execSync(command, { encoding: 'utf8' });
        console.log(`✅ ${description} completed`);
        return output;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        throw error;
    }
}

function createK6Script() {
    const k6Script = `
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
    stages: [
        { duration: '2m', target: ${config.concurrency} }, // Ramp up
        { duration: '5m', target: ${config.concurrency} }, // Stay at load
        { duration: '2m', target: 0 }, // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<${config.thresholds.responseTime}'],
        errors: ['rate<${config.thresholds.errorRate}'],
        http_reqs: ['rate>${config.thresholds.throughput}'],
    },
};

const BASE_URL = '${config.baseUrl}';
const API_URL = '${config.apiUrl}';

export default function() {
    // Test homepage load
    let response = http.get(BASE_URL);
    check(response, {
        'homepage status is 200': (r) => r.status === 200,
        'homepage loads in <2s': (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);

    sleep(1);

    // Test API health endpoint
    response = http.get(\`\${API_URL}/health\`);
    check(response, {
        'health endpoint status is 200': (r) => r.status === 200,
        'health endpoint responds in <500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);

    // Test inventory API
    response = http.get(\`\${API_URL}/v1/inventory\`);
    check(response, {
        'inventory API status is 200': (r) => r.status === 200,
        'inventory API responds in <1s': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);

    // Test products API
    response = http.get(\`\${API_URL}/v1/products\`);
    check(response, {
        'products API status is 200': (r) => r.status === 200,
        'products API responds in <1s': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(2);
}

export function handleSummary(data) {
    return {
        'performance-results.json': JSON.stringify(data, null, 2),
        'performance-summary.html': htmlReport(data),
    };
}

function htmlReport(data) {
    const metrics = data.metrics;
    
    return \`
<!DOCTYPE html>
<html>
<head>
    <title>Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { background-color: #d4edda; border-color: #c3e6cb; }
        .fail { background-color: #f8d7da; border-color: #f5c6cb; }
        .summary { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Performance Test Results</h1>
    <div class="summary">
        Test Duration: \${Math.round(data.state.testRunDurationMs / 1000)}s<br>
        Total Requests: \${metrics.http_reqs.count}<br>
        Average Response Time: \${Math.round(metrics.http_req_duration.avg)}ms<br>
        Error Rate: \${(metrics.errors.rate * 100).toFixed(2)}%
    </div>
    
    <h2>Metrics</h2>
    <div class="metric \${metrics.http_req_duration.avg < ${config.thresholds.responseTime} ? 'pass' : 'fail'}">
        <strong>Response Time:</strong> \${Math.round(metrics.http_req_duration.avg)}ms (avg), \${Math.round(metrics.http_req_duration.p95)}ms (95th percentile)
    </div>
    
    <div class="metric \${metrics.errors.rate < ${config.thresholds.errorRate} ? 'pass' : 'fail'}">
        <strong>Error Rate:</strong> \${(metrics.errors.rate * 100).toFixed(2)}%
    </div>
    
    <div class="metric \${metrics.http_reqs.rate > ${config.thresholds.throughput} ? 'pass' : 'fail'}">
        <strong>Throughput:</strong> \${Math.round(metrics.http_reqs.rate)} requests/second
    </div>
</body>
</html>
    \`;
}
`;

    fs.writeFileSync('performance-test.k6.js', k6Script);
    console.log('✅ Created K6 performance test script');
}

function installK6() {
    try {
        execSync('k6 version', { stdio: 'ignore' });
        console.log('✅ K6 is already installed');
    } catch (error) {
        console.log('📦 Installing K6...');
        
        // Try different installation methods based on OS
        try {
            if (process.platform === 'darwin') {
                execSync('brew install k6', { stdio: 'inherit' });
            } else if (process.platform === 'linux') {
                execSync('sudo apt-get update && sudo apt-get install -y k6', { stdio: 'inherit' });
            } else {
                console.log('⚠️  Please install K6 manually: https://k6.io/docs/getting-started/installation/');
                return false;
            }
        } catch (installError) {
            console.log('⚠️  Could not install K6 automatically. Please install manually.');
            return false;
        }
    }
    return true;
}

function runPerformanceTest() {
    console.log('🚀 Starting performance test...');
    console.log(`Target: ${config.baseUrl}`);
    console.log(`API: ${config.apiUrl}`);
    console.log(`Concurrency: ${config.concurrency} users`);
    console.log(`Duration: ${config.duration}`);
    
    try {
        const output = execSync('k6 run performance-test.k6.js', { encoding: 'utf8' });
        console.log(output);
        
        // Parse results
        if (fs.existsSync('performance-results.json')) {
            const results = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
            const metrics = results.metrics;
            
            console.log('\n📊 Performance Test Summary:');
            console.log('='.repeat(50));
            console.log(`Total Requests: ${metrics.http_reqs.count}`);
            console.log(`Average Response Time: ${Math.round(metrics.http_req_duration.avg)}ms`);
            console.log(`95th Percentile: ${Math.round(metrics.http_req_duration.p95)}ms`);
            console.log(`Error Rate: ${(metrics.errors.rate * 100).toFixed(2)}%`);
            console.log(`Throughput: ${Math.round(metrics.http_reqs.rate)} req/s`);
            
            // Check thresholds
            const responseTimePass = metrics.http_req_duration.avg < config.thresholds.responseTime;
            const errorRatePass = metrics.errors.rate < config.thresholds.errorRate;
            const throughputPass = metrics.http_reqs.rate > config.thresholds.throughput;
            
            console.log('\n🎯 Threshold Results:');
            console.log(`Response Time: ${responseTimePass ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`Error Rate: ${errorRatePass ? '✅ PASS' : '❌ FAIL'}`);
            console.log(`Throughput: ${throughputPass ? '✅ PASS' : '❌ FAIL'}`);
            
            if (responseTimePass && errorRatePass && throughputPass) {
                console.log('\n🎉 All performance thresholds passed!');
                return true;
            } else {
                console.log('\n⚠️  Some performance thresholds failed');
                return false;
            }
        }
        
    } catch (error) {
        console.error('❌ Performance test failed:', error.message);
        return false;
    }
}

function generateLighthouseReport() {
    console.log('🔍 Running Lighthouse audit...');
    
    try {
        const lighthouseCmd = `npx lighthouse ${config.baseUrl} --output=html --output-path=lighthouse-report.html --chrome-flags="--headless"`;
        execSync(lighthouseCmd, { stdio: 'inherit' });
        console.log('✅ Lighthouse report generated: lighthouse-report.html');
    } catch (error) {
        console.log('⚠️  Lighthouse audit failed:', error.message);
    }
}

function main() {
    console.log('🏃‍♂️ Performance Testing Suite');
    console.log('='.repeat(50));
    
    try {
        // Create K6 script
        createK6Script();
        
        // Install K6 if needed
        if (!installK6()) {
            console.log('❌ K6 installation failed. Skipping load testing.');
        } else {
            // Run performance test
            const testPassed = runPerformanceTest();
            
            if (!testPassed) {
                process.exit(1);
            }
        }
        
        // Generate Lighthouse report
        generateLighthouseReport();
        
        console.log('\n🎉 Performance testing completed!');
        console.log('📄 Reports generated:');
        console.log('  - performance-results.json');
        console.log('  - performance-summary.html');
        console.log('  - lighthouse-report.html');
        
    } catch (error) {
        console.error('❌ Performance testing failed:', error.message);
        process.exit(1);
    }
}

main();