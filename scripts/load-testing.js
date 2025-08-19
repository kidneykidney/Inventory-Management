#!/usr/bin/env node

/**
 * Load Testing Framework
 * 
 * This script provides automated load testing capabilities for the application:
 * 1. Configurable load testing scenarios
 * 2. Performance metrics collection
 * 3. Automated reporting and alerting
 * 4. Integration with CI/CD pipelines
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class LoadTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5000';
    this.scenarios = options.scenarios || this.getDefaultScenarios();
    this.results = [];
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Get default load testing scenarios
   */
  getDefaultScenarios() {
    return [
      {
        name: 'API Health Check',
        method: 'GET',
        path: '/api/health',
        concurrent: 10,
        requests: 100,
        timeout: 5000
      },
      {
        name: 'Get Epics',
        method: 'GET',
        path: '/api/v1/agile/epics',
        concurrent: 5,
        requests: 50,
        timeout: 10000
      },
      {
        name: 'Get User Stories',
        method: 'GET',
        path: '/api/v1/agile/stories',
        concurrent: 5,
        requests: 50,
        timeout: 10000
      },
      {
        name: 'Get Sprints',
        method: 'GET',
        path: '/api/v1/sprints',
        concurrent: 3,
        requests: 30,
        timeout: 10000
      },
      {
        name: 'Performance Metrics',
        method: 'GET',
        path: '/api/v1/performance/summary',
        concurrent: 2,
        requests: 20,
        timeout: 15000
      }
    ];
  }

  /**
   * Run all load testing scenarios
   */
  async runLoadTests() {
    console.log('🚀 Starting load testing...');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Scenarios: ${this.scenarios.length}`);
    
    this.startTime = Date.now();
    
    for (const scenario of this.scenarios) {
      console.log(`\n📊 Running scenario: ${scenario.name}`);
      const result = await this.runScenario(scenario);
      this.results.push(result);
      
      // Brief pause between scenarios
      await this.sleep(1000);
    }
    
    this.endTime = Date.now();
    
    // Generate and save report
    const report = this.generateReport();
    await this.saveReport(report);
    
    // Output summary
    this.outputSummary(report);
    
    return report;
  }

  /**
   * Run a single load testing scenario
   */
  async runScenario(scenario) {
    const { name, method, path, concurrent, requests, timeout } = scenario;
    const url = `${this.baseUrl}${path}`;
    
    const results = {
      scenario: name,
      url,
      method,
      concurrent,
      totalRequests: requests,
      startTime: Date.now(),
      responses: [],
      errors: [],
      metrics: {}
    };

    // Create batches for concurrent execution
    const batchSize = concurrent;
    const batches = Math.ceil(requests / batchSize);
    
    console.log(`  Concurrent requests: ${concurrent}`);
    console.log(`  Total requests: ${requests}`);
    console.log(`  Batches: ${batches}`);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchStart = Date.now();
      const currentBatchSize = Math.min(batchSize, requests - (batch * batchSize));
      
      // Create promises for concurrent requests
      const promises = Array(currentBatchSize).fill().map(() => 
        this.makeRequest(url, method, timeout)
      );
      
      // Execute batch
      const batchResults = await Promise.allSettled(promises);
      
      // Process results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.responses.push(result.value);
        } else {
          results.errors.push({
            error: result.reason.message,
            timestamp: Date.now()
          });
        }
      });
      
      const batchDuration = Date.now() - batchStart;
      console.log(`  Batch ${batch + 1}/${batches} completed in ${batchDuration}ms`);
      
      // Brief pause between batches to avoid overwhelming the server
      if (batch < batches - 1) {
        await this.sleep(100);
      }
    }
    
    results.endTime = Date.now();
    results.metrics = this.calculateMetrics(results);
    
    console.log(`  ✅ Completed: ${results.responses.length} successful, ${results.errors.length} errors`);
    console.log(`  📈 Avg response time: ${results.metrics.avgResponseTime}ms`);
    console.log(`  🎯 Success rate: ${results.metrics.successRate}%`);
    
    return results;
  }

  /**
   * Make a single HTTP request
   */
  async makeRequest(url, method = 'GET', timeout = 5000) {
    const startTime = Date.now();
    
    try {
      const response = await axios({
        method,
        url,
        timeout,
        validateStatus: () => true // Don't throw on HTTP error status
      });
      
      const endTime = Date.now();
      
      return {
        statusCode: response.status,
        responseTime: endTime - startTime,
        size: JSON.stringify(response.data).length,
        timestamp: startTime,
        success: response.status >= 200 && response.status < 400
      };
    } catch (error) {
      const endTime = Date.now();
      
      return {
        statusCode: 0,
        responseTime: endTime - startTime,
        size: 0,
        timestamp: startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate performance metrics for a scenario
   */
  calculateMetrics(results) {
    const { responses, errors } = results;
    const totalRequests = responses.length + errors.length;
    
    if (responses.length === 0) {
      return {
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        errorRate: 100,
        throughput: 0
      };
    }
    
    const responseTimes = responses.map(r => r.responseTime);
    const successfulResponses = responses.filter(r => r.success);
    
    // Sort response times for percentile calculations
    responseTimes.sort((a, b) => a - b);
    
    const duration = (results.endTime - results.startTime) / 1000; // seconds
    
    return {
      avgResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      successRate: Math.round((successfulResponses.length / totalRequests) * 100 * 100) / 100,
      errorRate: Math.round((errors.length / totalRequests) * 100 * 100) / 100,
      throughput: Math.round((totalRequests / duration) * 100) / 100 // requests per second
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Generate comprehensive load testing report
   */
  generateReport() {
    const totalDuration = (this.endTime - this.startTime) / 1000; // seconds
    const totalRequests = this.results.reduce((sum, result) => sum + result.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, result) => sum + result.responses.length, 0);
    const totalErrors = this.results.reduce((sum, result) => sum + result.errors.length, 0);
    
    const overallMetrics = {
      totalDuration,
      totalRequests,
      totalSuccessful,
      totalErrors,
      overallSuccessRate: Math.round((totalSuccessful / totalRequests) * 100 * 100) / 100,
      overallThroughput: Math.round((totalRequests / totalDuration) * 100) / 100
    };
    
    // Identify performance issues
    const issues = this.identifyPerformanceIssues();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);
    
    return {
      timestamp: new Date().toISOString(),
      summary: overallMetrics,
      scenarios: this.results.map(result => ({
        name: result.scenario,
        url: result.url,
        metrics: result.metrics,
        requestCount: result.totalRequests,
        errorCount: result.errors.length
      })),
      issues,
      recommendations,
      rawResults: this.results
    };
  }

  /**
   * Identify performance issues from test results
   */
  identifyPerformanceIssues() {
    const issues = [];
    
    this.results.forEach(result => {
      const { scenario, metrics } = result;
      
      // Check for slow response times
      if (metrics.avgResponseTime > 2000) {
        issues.push({
          type: 'slow_response',
          severity: metrics.avgResponseTime > 5000 ? 'critical' : 'high',
          scenario,
          metric: 'avgResponseTime',
          value: metrics.avgResponseTime,
          threshold: 2000,
          description: `Average response time of ${metrics.avgResponseTime}ms exceeds acceptable threshold`
        });
      }
      
      // Check for high error rates
      if (metrics.errorRate > 5) {
        issues.push({
          type: 'high_error_rate',
          severity: metrics.errorRate > 20 ? 'critical' : 'high',
          scenario,
          metric: 'errorRate',
          value: metrics.errorRate,
          threshold: 5,
          description: `Error rate of ${metrics.errorRate}% is too high`
        });
      }
      
      // Check for low throughput
      if (metrics.throughput < 10) {
        issues.push({
          type: 'low_throughput',
          severity: metrics.throughput < 5 ? 'high' : 'medium',
          scenario,
          metric: 'throughput',
          value: metrics.throughput,
          threshold: 10,
          description: `Throughput of ${metrics.throughput} req/s is below expected performance`
        });
      }
      
      // Check for high P99 response times
      if (metrics.p99ResponseTime > 10000) {
        issues.push({
          type: 'high_p99',
          severity: 'medium',
          scenario,
          metric: 'p99ResponseTime',
          value: metrics.p99ResponseTime,
          threshold: 10000,
          description: `99th percentile response time of ${metrics.p99ResponseTime}ms indicates performance outliers`
        });
      }
    });
    
    return issues;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(issues) {
    const recommendations = [];
    
    // Group issues by type
    const issuesByType = issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {});
    
    // Generate recommendations based on issue patterns
    if (issuesByType.slow_response) {
      recommendations.push({
        category: 'Performance Optimization',
        priority: 'high',
        title: 'Optimize Slow API Endpoints',
        description: 'Several endpoints are showing slow response times',
        actions: [
          'Add database query optimization and indexing',
          'Implement response caching for frequently accessed data',
          'Consider API response pagination for large datasets',
          'Profile and optimize slow business logic'
        ],
        affectedScenarios: issuesByType.slow_response.map(i => i.scenario)
      });
    }
    
    if (issuesByType.high_error_rate) {
      recommendations.push({
        category: 'Reliability',
        priority: 'critical',
        title: 'Address High Error Rates',
        description: 'High error rates detected in multiple scenarios',
        actions: [
          'Review application logs for error patterns',
          'Implement proper error handling and retry logic',
          'Add health checks and monitoring alerts',
          'Consider circuit breaker patterns for external dependencies'
        ],
        affectedScenarios: issuesByType.high_error_rate.map(i => i.scenario)
      });
    }
    
    if (issuesByType.low_throughput) {
      recommendations.push({
        category: 'Scalability',
        priority: 'medium',
        title: 'Improve System Throughput',
        description: 'System throughput is below expected levels',
        actions: [
          'Scale application instances horizontally',
          'Optimize database connection pooling',
          'Implement load balancing',
          'Consider asynchronous processing for heavy operations'
        ],
        affectedScenarios: issuesByType.low_throughput.map(i => i.scenario)
      });
    }
    
    // General recommendations
    if (issues.length === 0) {
      recommendations.push({
        category: 'Maintenance',
        priority: 'low',
        title: 'Continue Performance Monitoring',
        description: 'Current performance is within acceptable limits',
        actions: [
          'Maintain regular load testing schedule',
          'Monitor performance trends over time',
          'Plan for capacity increases as usage grows',
          'Consider performance testing in CI/CD pipeline'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Save report to file
   */
  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `load-test-report-${timestamp}.json`;
    const filepath = path.join(__dirname, '../reports', filename);
    
    try {
      // Ensure reports directory exists
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      
      // Save detailed report
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
      
      // Save summary report
      const summaryFilepath = path.join(__dirname, '../reports/latest-load-test-summary.json');
      const summary = {
        timestamp: report.timestamp,
        summary: report.summary,
        scenarios: report.scenarios,
        issueCount: report.issues.length,
        criticalIssues: report.issues.filter(i => i.severity === 'critical').length
      };
      await fs.writeFile(summaryFilepath, JSON.stringify(summary, null, 2));
      
      console.log(`\n📄 Report saved: ${filepath}`);
    } catch (error) {
      console.warn('⚠️  Failed to save report:', error.message);
    }
  }

  /**
   * Output test summary to console
   */
  outputSummary(report) {
    console.log('\n🎯 Load Testing Summary');
    console.log('======================');
    console.log(`Duration: ${report.summary.totalDuration.toFixed(2)}s`);
    console.log(`Total Requests: ${report.summary.totalRequests}`);
    console.log(`Successful: ${report.summary.totalSuccessful}`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Success Rate: ${report.summary.overallSuccessRate}%`);
    console.log(`Throughput: ${report.summary.overallThroughput} req/s`);
    
    if (report.issues.length > 0) {
      console.log(`\n⚠️  Issues Found: ${report.issues.length}`);
      
      const criticalIssues = report.issues.filter(i => i.severity === 'critical');
      const highIssues = report.issues.filter(i => i.severity === 'high');
      const mediumIssues = report.issues.filter(i => i.severity === 'medium');
      
      if (criticalIssues.length > 0) {
        console.log(`🚨 Critical: ${criticalIssues.length}`);
      }
      if (highIssues.length > 0) {
        console.log(`🔴 High: ${highIssues.length}`);
      }
      if (mediumIssues.length > 0) {
        console.log(`🟡 Medium: ${mediumIssues.length}`);
      }
      
      console.log('\nTop Issues:');
      report.issues.slice(0, 3).forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.description} (${issue.severity.toUpperCase()})`);
      });
    } else {
      console.log('\n✅ No performance issues detected');
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 Top Recommendations:');
      report.recommendations.slice(0, 2).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.title} (${rec.priority.toUpperCase()})`);
      });
    }
  }

  /**
   * Utility function for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const concurrent = parseInt(process.env.CONCURRENT_USERS) || undefined;
  const requests = parseInt(process.env.TOTAL_REQUESTS) || undefined;
  
  // Override default scenarios if environment variables are provided
  let scenarios;
  if (concurrent && requests) {
    scenarios = [
      {
        name: 'Custom Load Test',
        method: 'GET',
        path: process.env.TEST_PATH || '/api/health',
        concurrent,
        requests,
        timeout: parseInt(process.env.TIMEOUT) || 10000
      }
    ];
  }
  
  const loadTester = new LoadTester({
    baseUrl,
    scenarios
  });
  
  loadTester.runLoadTests()
    .then(report => {
      const hasIssues = report.issues.some(issue => 
        issue.severity === 'critical' || issue.severity === 'high'
      );
      process.exit(hasIssues ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Load testing failed:', error);
      process.exit(1);
    });
}

module.exports = LoadTester;