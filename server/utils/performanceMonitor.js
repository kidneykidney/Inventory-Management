const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      database: new Map(),
      memory: [],
      cpu: [],
      errors: [],
    };
    this.thresholds = {
      responseTime: 1000, // ms
      memoryUsage: 80, // percentage
      cpuUsage: 80, // percentage
      errorRate: 5, // percentage
    };
  }

  // Track HTTP request performance
  trackRequest(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      const metric = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      };

      performanceMonitor.recordRequestMetric(metric);
      originalSend.call(this, data);
    };

    next();
  }

  // Record request metrics
  recordRequestMetric(metric) {
    const key = `${metric.method}:${metric.url}`;

    if (!this.metrics.requests.has(key)) {
      this.metrics.requests.set(key, []);
    }

    this.metrics.requests.get(key).push(metric);

    // Keep only last 1000 requests per endpoint
    if (this.metrics.requests.get(key).length > 1000) {
      this.metrics.requests.get(key).shift();
    }

    // Check thresholds
    if (metric.duration > this.thresholds.responseTime) {
      logger.warn(`Slow request detected: ${key} took ${metric.duration}ms`);
    }
  }

  // Track database query performance
  trackDatabaseQuery(query, duration, error = null) {
    const metric = {
      query: query.substring(0, 100), // Truncate for privacy
      duration,
      error: error ? error.message : null,
      timestamp: new Date(),
    };

    if (!this.metrics.database.has('queries')) {
      this.metrics.database.set('queries', []);
    }

    this.metrics.database.get('queries').push(metric);

    // Keep only last 1000 queries
    if (this.metrics.database.get('queries').length > 1000) {
      this.metrics.database.get('queries').shift();
    }

    if (error) {
      logger.error(`Database query error: ${error.message}`);
    } else if (duration > 1000) {
      logger.warn(`Slow database query: ${duration}ms`);
    }
  }

  // Record system metrics
  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const memMetric = {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      timestamp: new Date(),
    };

    const cpuMetric = {
      user: cpuUsage.user,
      system: cpuUsage.system,
      timestamp: new Date(),
    };

    this.metrics.memory.push(memMetric);
    this.metrics.cpu.push(cpuMetric);

    // Keep only last 1000 measurements
    if (this.metrics.memory.length > 1000) {
      this.metrics.memory.shift();
    }
    if (this.metrics.cpu.length > 1000) {
      this.metrics.cpu.shift();
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentRequests = [];
    for (const [endpoint, requests] of this.metrics.requests) {
      const recent = requests.filter(r => r.timestamp.getTime() > oneHourAgo);
      if (recent.length > 0) {
        const avgDuration =
          recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
        const errorCount = recent.filter(r => r.statusCode >= 400).length;
        const errorRate = (errorCount / recent.length) * 100;

        recentRequests.push({
          endpoint,
          requestCount: recent.length,
          avgResponseTime: Math.round(avgDuration),
          errorRate: Math.round(errorRate * 100) / 100,
          slowRequests: recent.filter(
            r => r.duration > this.thresholds.responseTime
          ).length,
        });
      }
    }

    const recentMemory = this.metrics.memory.filter(
      m => m.timestamp.getTime() > oneHourAgo
    );
    const avgMemoryUsage =
      recentMemory.length > 0
        ? recentMemory.reduce((sum, m) => sum + m.heapUsed, 0) /
          recentMemory.length
        : 0;

    return {
      timestamp: new Date(),
      requests: {
        total: recentRequests.reduce((sum, r) => sum + r.requestCount, 0),
        endpoints: recentRequests,
        avgResponseTime:
          recentRequests.length > 0
            ? Math.round(
                recentRequests.reduce((sum, r) => sum + r.avgResponseTime, 0) /
                  recentRequests.length
              )
            : 0,
      },
      system: {
        memoryUsage: Math.round(avgMemoryUsage / 1024 / 1024), // MB
        uptime: Math.round(process.uptime()),
        nodeVersion: process.version,
      },
      database: {
        queryCount: this.metrics.database.get('queries')?.length || 0,
        slowQueries:
          this.metrics.database.get('queries')?.filter(q => q.duration > 1000)
            .length || 0,
      },
    };
  }

  // Get Core Web Vitals baseline
  getCoreWebVitalsBaseline() {
    return {
      LCP: { threshold: 2500, good: 2500, poor: 4000 }, // Largest Contentful Paint
      FID: { threshold: 100, good: 100, poor: 300 }, // First Input Delay
      CLS: { threshold: 0.1, good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
    };
  }

  // Start monitoring
  startMonitoring() {
    // Record system metrics every 30 seconds
    setInterval(() => {
      this.recordSystemMetrics();
    }, 30000);

    logger.info('Performance monitoring started');
  }

  // Check for performance regressions
  checkPerformanceRegression() {
    const summary = this.getPerformanceSummary();
    const alerts = [];

    // Check response time regression
    summary.requests.endpoints.forEach(endpoint => {
      if (endpoint.avgResponseTime > this.thresholds.responseTime) {
        alerts.push({
          type: 'slow_response',
          endpoint: endpoint.endpoint,
          value: endpoint.avgResponseTime,
          threshold: this.thresholds.responseTime,
        });
      }

      if (endpoint.errorRate > this.thresholds.errorRate) {
        alerts.push({
          type: 'high_error_rate',
          endpoint: endpoint.endpoint,
          value: endpoint.errorRate,
          threshold: this.thresholds.errorRate,
        });
      }
    });

    // Check memory usage
    const memoryUsagePercent =
      (summary.system.memoryUsage / (1024 * 1024)) * 100; // Rough estimate
    if (memoryUsagePercent > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'high_memory_usage',
        value: memoryUsagePercent,
        threshold: this.thresholds.memoryUsage,
      });
    }

    if (alerts.length > 0) {
      logger.warn('Performance regression detected', { alerts });
    }

    return alerts;
  }
}

const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
