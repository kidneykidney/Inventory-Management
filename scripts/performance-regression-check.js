#!/usr/bin/env node

/**
 * Performance Regression Detection Script
 * 
 * This script runs automated performance regression checks by:
 * 1. Collecting current performance metrics
 * 2. Comparing against historical baselines
 * 3. Detecting significant regressions
 * 4. Generating alerts and reports
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class PerformanceRegressionChecker {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5000';
    this.thresholds = {
      responseTimeIncrease: 0.2, // 20% increase
      errorRateIncrease: 0.05,   // 5% increase
      memoryIncrease: 0.3,       // 30% increase
      ...options.thresholds
    };
    this.historyFile = path.join(__dirname, '../performance-history.json');
  }

  /**
   * Run complete performance regression check
   */
  async runCheck() {
    try {
      console.log('🔍 Starting performance regression check...');
      
      // Collect current metrics
      const currentMetrics = await this.collectCurrentMetrics();
      
      // Load historical data
      const historicalData = await this.loadHistoricalData();
      
      // Compare and detect regressions
      const regressions = await this.detectRegressions(currentMetrics, historicalData);
      
      // Save current metrics to history
      await this.saveToHistory(currentMetrics);
      
      // Generate report
      const report = this.generateReport(regressions, currentMetrics);
      
      // Output results
      this.outputResults(report);
      
      // Exit with appropriate code
      process.exit(regressions.length > 0 ? 1 : 0);
      
    } catch (error) {
      console.error('❌ Performance regression check failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Collect current performance metrics from the server
   */
  async collectCurrentMetrics() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/performance/summary`);
      const summary = response.data;
      
      return {
        timestamp: new Date().toISOString(),
        backend: {
          avgResponseTime: summary.backend.requests.avgResponseTime,
          totalRequests: summary.backend.requests.total,
          memoryUsage: summary.backend.system.memoryUsage,
          uptime: summary.backend.system.uptime,
          slowQueries: summary.backend.database.slowQueries,
          queryCount: summary.backend.database.queryCount
        },
        frontend: {
          avgLoadTime: summary.frontend.pageLoads.avgLoadTime,
          pageLoadCount: summary.frontend.pageLoads.count,
          avgFirstContentfulPaint: summary.frontend.pageLoads.avgFirstContentfulPaint,
          lcpGoodCount: summary.frontend.coreWebVitals.lcp.goodCount,
          lcpTotalCount: summary.frontend.coreWebVitals.lcp.count,
          fidGoodCount: summary.frontend.coreWebVitals.fid.goodCount,
          fidTotalCount: summary.frontend.coreWebVitals.fid.count,
          clsGoodCount: summary.frontend.coreWebVitals.cls.goodCount,
          clsTotalCount: summary.frontend.coreWebVitals.cls.count
        }
      };
    } catch (error) {
      throw new Error(`Failed to collect current metrics: ${error.message}`);
    }
  }

  /**
   * Load historical performance data
   */
  async loadHistoricalData() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty history
        return { entries: [] };
      }
      throw new Error(`Failed to load historical data: ${error.message}`);
    }
  }

  /**
   * Detect performance regressions by comparing current vs historical metrics
   */
  async detectRegressions(currentMetrics, historicalData) {
    const regressions = [];
    
    if (historicalData.entries.length === 0) {
      console.log('📊 No historical data available, establishing baseline...');
      return regressions;
    }

    // Get baseline from last 7 days or last 10 entries
    const baseline = this.calculateBaseline(historicalData.entries);
    
    // Check backend regressions
    const backendRegressions = this.checkBackendRegressions(currentMetrics.backend, baseline.backend);
    regressions.push(...backendRegressions);
    
    // Check frontend regressions
    const frontendRegressions = this.checkFrontendRegressions(currentMetrics.frontend, baseline.frontend);
    regressions.push(...frontendRegressions);
    
    return regressions;
  }

  /**
   * Calculate baseline metrics from historical data
   */
  calculateBaseline(entries) {
    // Use last 10 entries or entries from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentEntries = entries
      .filter(entry => new Date(entry.timestamp) > sevenDaysAgo)
      .slice(-10);

    if (recentEntries.length === 0) {
      return null;
    }

    const backend = {
      avgResponseTime: this.calculateAverage(recentEntries, 'backend.avgResponseTime'),
      memoryUsage: this.calculateAverage(recentEntries, 'backend.memoryUsage'),
      slowQueries: this.calculateAverage(recentEntries, 'backend.slowQueries')
    };

    const frontend = {
      avgLoadTime: this.calculateAverage(recentEntries, 'frontend.avgLoadTime'),
      avgFirstContentfulPaint: this.calculateAverage(recentEntries, 'frontend.avgFirstContentfulPaint'),
      lcpGoodRate: this.calculateGoodRate(recentEntries, 'lcp'),
      fidGoodRate: this.calculateGoodRate(recentEntries, 'fid'),
      clsGoodRate: this.calculateGoodRate(recentEntries, 'cls')
    };

    return { backend, frontend };
  }

  /**
   * Calculate average value from nested object path
   */
  calculateAverage(entries, path) {
    const values = entries
      .map(entry => this.getNestedValue(entry, path))
      .filter(value => value != null && !isNaN(value));
    
    return values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0;
  }

  /**
   * Calculate good rate for Core Web Vitals
   */
  calculateGoodRate(entries, metric) {
    const goodCounts = entries
      .map(entry => this.getNestedValue(entry, `frontend.${metric}GoodCount`) || 0);
    const totalCounts = entries
      .map(entry => this.getNestedValue(entry, `frontend.${metric}TotalCount`) || 0);
    
    const totalGood = goodCounts.reduce((sum, val) => sum + val, 0);
    const totalAll = totalCounts.reduce((sum, val) => sum + val, 0);
    
    return totalAll > 0 ? totalGood / totalAll : 0;
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Check for backend performance regressions
   */
  checkBackendRegressions(current, baseline) {
    const regressions = [];
    
    if (!baseline) return regressions;

    // Check response time regression
    if (current.avgResponseTime > baseline.avgResponseTime * (1 + this.thresholds.responseTimeIncrease)) {
      regressions.push({
        type: 'backend',
        metric: 'avgResponseTime',
        current: current.avgResponseTime,
        baseline: baseline.avgResponseTime,
        increase: ((current.avgResponseTime - baseline.avgResponseTime) / baseline.avgResponseTime * 100).toFixed(1),
        severity: this.calculateSeverity(current.avgResponseTime, baseline.avgResponseTime, this.thresholds.responseTimeIncrease)
      });
    }

    // Check memory usage regression
    if (current.memoryUsage > baseline.memoryUsage * (1 + this.thresholds.memoryIncrease)) {
      regressions.push({
        type: 'backend',
        metric: 'memoryUsage',
        current: current.memoryUsage,
        baseline: baseline.memoryUsage,
        increase: ((current.memoryUsage - baseline.memoryUsage) / baseline.memoryUsage * 100).toFixed(1),
        severity: this.calculateSeverity(current.memoryUsage, baseline.memoryUsage, this.thresholds.memoryIncrease)
      });
    }

    // Check slow queries regression
    if (current.slowQueries > baseline.slowQueries * 2) {
      regressions.push({
        type: 'backend',
        metric: 'slowQueries',
        current: current.slowQueries,
        baseline: baseline.slowQueries,
        increase: baseline.slowQueries > 0 
          ? ((current.slowQueries - baseline.slowQueries) / baseline.slowQueries * 100).toFixed(1)
          : 'N/A',
        severity: 'high'
      });
    }

    return regressions;
  }

  /**
   * Check for frontend performance regressions
   */
  checkFrontendRegressions(current, baseline) {
    const regressions = [];
    
    if (!baseline) return regressions;

    // Check page load time regression
    if (current.avgLoadTime > baseline.avgLoadTime * (1 + this.thresholds.responseTimeIncrease)) {
      regressions.push({
        type: 'frontend',
        metric: 'avgLoadTime',
        current: current.avgLoadTime,
        baseline: baseline.avgLoadTime,
        increase: ((current.avgLoadTime - baseline.avgLoadTime) / baseline.avgLoadTime * 100).toFixed(1),
        severity: this.calculateSeverity(current.avgLoadTime, baseline.avgLoadTime, this.thresholds.responseTimeIncrease)
      });
    }

    // Check First Contentful Paint regression
    if (current.avgFirstContentfulPaint > baseline.avgFirstContentfulPaint * (1 + this.thresholds.responseTimeIncrease)) {
      regressions.push({
        type: 'frontend',
        metric: 'avgFirstContentfulPaint',
        current: current.avgFirstContentfulPaint,
        baseline: baseline.avgFirstContentfulPaint,
        increase: ((current.avgFirstContentfulPaint - baseline.avgFirstContentfulPaint) / baseline.avgFirstContentfulPaint * 100).toFixed(1),
        severity: this.calculateSeverity(current.avgFirstContentfulPaint, baseline.avgFirstContentfulPaint, this.thresholds.responseTimeIncrease)
      });
    }

    // Check Core Web Vitals regressions
    const currentLcpGoodRate = current.lcpTotalCount > 0 ? current.lcpGoodCount / current.lcpTotalCount : 0;
    if (currentLcpGoodRate < baseline.lcpGoodRate - this.thresholds.errorRateIncrease) {
      regressions.push({
        type: 'frontend',
        metric: 'lcpGoodRate',
        current: (currentLcpGoodRate * 100).toFixed(1) + '%',
        baseline: (baseline.lcpGoodRate * 100).toFixed(1) + '%',
        decrease: ((baseline.lcpGoodRate - currentLcpGoodRate) * 100).toFixed(1),
        severity: 'medium'
      });
    }

    return regressions;
  }

  /**
   * Calculate severity based on the magnitude of regression
   */
  calculateSeverity(current, baseline, threshold) {
    const increase = (current - baseline) / baseline;
    
    if (increase > threshold * 2) return 'critical';
    if (increase > threshold * 1.5) return 'high';
    if (increase > threshold) return 'medium';
    return 'low';
  }

  /**
   * Save current metrics to historical data
   */
  async saveToHistory(currentMetrics) {
    try {
      const historicalData = await this.loadHistoricalData();
      
      // Add current metrics
      historicalData.entries = historicalData.entries || [];
      historicalData.entries.push(currentMetrics);
      
      // Keep only last 100 entries
      if (historicalData.entries.length > 100) {
        historicalData.entries = historicalData.entries.slice(-100);
      }
      
      await fs.writeFile(this.historyFile, JSON.stringify(historicalData, null, 2));
    } catch (error) {
      console.warn('⚠️  Failed to save metrics to history:', error.message);
    }
  }

  /**
   * Generate performance regression report
   */
  generateReport(regressions, currentMetrics) {
    return {
      timestamp: new Date().toISOString(),
      status: regressions.length === 0 ? 'PASS' : 'FAIL',
      regressionsFound: regressions.length,
      regressions,
      currentMetrics,
      summary: {
        critical: regressions.filter(r => r.severity === 'critical').length,
        high: regressions.filter(r => r.severity === 'high').length,
        medium: regressions.filter(r => r.severity === 'medium').length,
        low: regressions.filter(r => r.severity === 'low').length
      }
    };
  }

  /**
   * Output results to console
   */
  outputResults(report) {
    console.log('\n📊 Performance Regression Check Results');
    console.log('=====================================');
    
    if (report.status === 'PASS') {
      console.log('✅ No performance regressions detected');
    } else {
      console.log(`❌ ${report.regressionsFound} performance regression(s) detected`);
      
      if (report.summary.critical > 0) {
        console.log(`🚨 Critical: ${report.summary.critical}`);
      }
      if (report.summary.high > 0) {
        console.log(`🔴 High: ${report.summary.high}`);
      }
      if (report.summary.medium > 0) {
        console.log(`🟡 Medium: ${report.summary.medium}`);
      }
      if (report.summary.low > 0) {
        console.log(`🟢 Low: ${report.summary.low}`);
      }
      
      console.log('\nDetailed Regressions:');
      report.regressions.forEach((regression, index) => {
        console.log(`\n${index + 1}. ${regression.type.toUpperCase()} - ${regression.metric}`);
        console.log(`   Current: ${regression.current}`);
        console.log(`   Baseline: ${regression.baseline}`);
        if (regression.increase) {
          console.log(`   Increase: ${regression.increase}%`);
        }
        if (regression.decrease) {
          console.log(`   Decrease: ${regression.decrease}%`);
        }
        console.log(`   Severity: ${regression.severity.toUpperCase()}`);
      });
    }
    
    console.log('\nCurrent Performance Metrics:');
    console.log(`Backend Response Time: ${report.currentMetrics.backend.avgResponseTime}ms`);
    console.log(`Backend Memory Usage: ${report.currentMetrics.backend.memoryUsage}MB`);
    console.log(`Frontend Load Time: ${report.currentMetrics.frontend.avgLoadTime}ms`);
    console.log(`Frontend FCP: ${report.currentMetrics.frontend.avgFirstContentfulPaint}ms`);
  }
}

// CLI execution
if (require.main === module) {
  const checker = new PerformanceRegressionChecker({
    baseUrl: process.env.BASE_URL || 'http://localhost:5000',
    thresholds: {
      responseTimeIncrease: parseFloat(process.env.RESPONSE_TIME_THRESHOLD) || 0.2,
      errorRateIncrease: parseFloat(process.env.ERROR_RATE_THRESHOLD) || 0.05,
      memoryIncrease: parseFloat(process.env.MEMORY_THRESHOLD) || 0.3
    }
  });
  
  checker.runCheck();
}

module.exports = PerformanceRegressionChecker;