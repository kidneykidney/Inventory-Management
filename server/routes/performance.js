const express = require('express');
const router = express.Router();
const performanceMonitor = require('../utils/performanceMonitor');
const logger = require('../utils/logger');

// Store frontend performance metrics
const frontendMetrics = {
  pageLoads: [],
  coreWebVitals: [],
  userInteractions: [],
  routeChanges: [],
};

// POST /api/v1/performance/metrics - Receive frontend metrics
router.post('/metrics', (req, res) => {
  try {
    const { type, data, userAgent, url, timestamp } = req.body;

    const metric = {
      ...data,
      userAgent,
      url,
      timestamp: new Date(timestamp),
      ip: req.ip,
    };

    switch (type) {
      case 'page_load':
        frontendMetrics.pageLoads.push(metric);
        // Keep only last 1000 page loads
        if (frontendMetrics.pageLoads.length > 1000) {
          frontendMetrics.pageLoads.shift();
        }
        break;

      case 'core_web_vitals':
        frontendMetrics.coreWebVitals.push(metric);
        // Keep only last 1000 measurements
        if (frontendMetrics.coreWebVitals.length > 1000) {
          frontendMetrics.coreWebVitals.shift();
        }
        break;

      case 'user_interaction':
        frontendMetrics.userInteractions.push(metric);
        // Keep only last 500 interactions
        if (frontendMetrics.userInteractions.length > 500) {
          frontendMetrics.userInteractions.shift();
        }
        break;

      case 'route_change':
        frontendMetrics.routeChanges.push(metric);
        // Keep only last 500 route changes
        if (frontendMetrics.routeChanges.length > 500) {
          frontendMetrics.routeChanges.shift();
        }
        break;

      default:
        return res.status(400).json({ error: 'Unknown metric type' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error storing performance metric:', error);
    res.status(500).json({ error: 'Failed to store metric' });
  }
});

// GET /api/v1/performance/summary - Get performance summary
router.get('/summary', (req, res) => {
  try {
    const backendSummary = performanceMonitor.getPerformanceSummary();

    // Calculate frontend metrics summary
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recentPageLoads = frontendMetrics.pageLoads.filter(
      p => p.timestamp.getTime() > oneHourAgo
    );

    const recentCoreWebVitals = frontendMetrics.coreWebVitals.filter(
      c => c.timestamp.getTime() > oneHourAgo
    );

    const frontendSummary = {
      pageLoads: {
        count: recentPageLoads.length,
        avgLoadTime:
          recentPageLoads.length > 0
            ? Math.round(
                recentPageLoads.reduce((sum, p) => sum + p.loadTime, 0) /
                  recentPageLoads.length
              )
            : 0,
        avgFirstContentfulPaint:
          recentPageLoads.length > 0
            ? Math.round(
                recentPageLoads.reduce(
                  (sum, p) => sum + (p.firstContentfulPaint || 0),
                  0
                ) / recentPageLoads.length
              )
            : 0,
      },
      coreWebVitals: {
        lcp: {
          count: recentCoreWebVitals.filter(c => c.metric === 'LCP').length,
          avgValue: this.calculateAvgCoreWebVital(recentCoreWebVitals, 'LCP'),
          goodCount: recentCoreWebVitals.filter(
            c => c.metric === 'LCP' && c.rating === 'good'
          ).length,
        },
        fid: {
          count: recentCoreWebVitals.filter(c => c.metric === 'FID').length,
          avgValue: this.calculateAvgCoreWebVital(recentCoreWebVitals, 'FID'),
          goodCount: recentCoreWebVitals.filter(
            c => c.metric === 'FID' && c.rating === 'good'
          ).length,
        },
        cls: {
          count: recentCoreWebVitals.filter(c => c.metric === 'CLS').length,
          avgValue: this.calculateAvgCoreWebVital(recentCoreWebVitals, 'CLS'),
          goodCount: recentCoreWebVitals.filter(
            c => c.metric === 'CLS' && c.rating === 'good'
          ).length,
        },
      },
    };

    res.json({
      backend: backendSummary,
      frontend: frontendSummary,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting performance summary:', error);
    res.status(500).json({ error: 'Failed to get performance summary' });
  }
});

// GET /api/v1/performance/alerts - Get performance alerts
router.get('/alerts', (req, res) => {
  try {
    const backendAlerts = performanceMonitor.checkPerformanceRegression();
    const frontendAlerts = checkFrontendPerformanceAlerts();

    res.json({
      backend: backendAlerts,
      frontend: frontendAlerts,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting performance alerts:', error);
    res.status(500).json({ error: 'Failed to get performance alerts' });
  }
});

// GET /api/v1/performance/baseline - Get performance baseline
router.get('/baseline', (req, res) => {
  try {
    const baseline = {
      backend: {
        responseTime: 500, // ms
        memoryUsage: 512, // MB
        errorRate: 1, // percentage
      },
      frontend: performanceMonitor.getCoreWebVitalsBaseline(),
    };

    res.json(baseline);
  } catch (error) {
    logger.error('Error getting performance baseline:', error);
    res.status(500).json({ error: 'Failed to get performance baseline' });
  }
});

// GET /api/v1/performance/trends - Get performance trends
router.get('/trends', (req, res) => {
  try {
    const { period = '24h' } = req.query;

    let timeRange;
    switch (period) {
      case '1h':
        timeRange = 60 * 60 * 1000;
        break;
      case '24h':
        timeRange = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        timeRange = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        timeRange = 24 * 60 * 60 * 1000;
    }

    const now = Date.now();
    const startTime = now - timeRange;

    const trends = {
      pageLoadTrend: calculatePageLoadTrend(startTime),
      coreWebVitalsTrend: calculateCoreWebVitalsTrend(startTime),
      apiResponseTrend: calculateApiResponseTrend(startTime),
    };

    res.json(trends);
  } catch (error) {
    logger.error('Error getting performance trends:', error);
    res.status(500).json({ error: 'Failed to get performance trends' });
  }
});

// GET /api/v1/performance/capacity-planning - Get capacity planning data
router.get('/capacity-planning', (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;

    // Get current system metrics
    const summary = performanceMonitor.getPerformanceSummary();

    // Generate capacity planning data
    const capacityData = generateCapacityPlanningData(summary, timeframe);

    res.json(capacityData);
  } catch (error) {
    logger.error('Error getting capacity planning data:', error);
    res.status(500).json({ error: 'Failed to get capacity planning data' });
  }
});

// POST /api/v1/performance/load-test - Trigger load test
router.post('/load-test', async (req, res) => {
  try {
    const { scenarios, baseUrl } = req.body;

    // This would typically trigger an async load test
    // For now, return a mock response
    const loadTestResult = {
      id: `load-test-${Date.now()}`,
      status: 'started',
      scenarios: scenarios || ['default'],
      baseUrl: baseUrl || 'http://localhost:5000',
      startTime: new Date().toISOString(),
    };

    res.json(loadTestResult);
  } catch (error) {
    logger.error('Error starting load test:', error);
    res.status(500).json({ error: 'Failed to start load test' });
  }
});

// GET /api/v1/performance/load-test/:id - Get load test results
router.get('/load-test/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Mock load test results
    const mockResults = {
      id,
      status: 'completed',
      summary: {
        totalRequests: 1000,
        successfulRequests: 985,
        failedRequests: 15,
        averageResponseTime: 245,
        throughput: 42.3,
      },
      scenarios: [
        {
          name: 'API Health Check',
          requests: 500,
          averageResponseTime: 120,
          successRate: 99.2,
        },
        {
          name: 'Get Epics',
          requests: 300,
          averageResponseTime: 340,
          successRate: 97.8,
        },
        {
          name: 'Get User Stories',
          requests: 200,
          averageResponseTime: 380,
          successRate: 96.5,
        },
      ],
      completedAt: new Date().toISOString(),
    };

    res.json(mockResults);
  } catch (error) {
    logger.error('Error getting load test results:', error);
    res.status(500).json({ error: 'Failed to get load test results' });
  }
});

// Helper functions
function calculateAvgCoreWebVital(metrics, metricType) {
  const filtered = metrics.filter(m => m.metric === metricType);
  if (filtered.length === 0) return 0;

  return Math.round(
    filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length
  );
}

function checkFrontendPerformanceAlerts() {
  const alerts = [];
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;

  // Check recent page loads
  const recentPageLoads = frontendMetrics.pageLoads.filter(
    p => p.timestamp.getTime() > oneHourAgo
  );

  if (recentPageLoads.length > 0) {
    const avgLoadTime =
      recentPageLoads.reduce((sum, p) => sum + p.loadTime, 0) /
      recentPageLoads.length;
    if (avgLoadTime > 3000) {
      alerts.push({
        type: 'slow_page_load',
        value: Math.round(avgLoadTime),
        threshold: 3000,
        count: recentPageLoads.length,
      });
    }
  }

  // Check Core Web Vitals
  const recentCoreWebVitals = frontendMetrics.coreWebVitals.filter(
    c => c.timestamp.getTime() > oneHourAgo
  );

  const poorLCP = recentCoreWebVitals.filter(
    c => c.metric === 'LCP' && c.rating === 'poor'
  );
  if (poorLCP.length > 0) {
    alerts.push({
      type: 'poor_lcp',
      count: poorLCP.length,
      threshold: 4000,
    });
  }

  const poorFID = recentCoreWebVitals.filter(
    c => c.metric === 'FID' && c.rating === 'poor'
  );
  if (poorFID.length > 0) {
    alerts.push({
      type: 'poor_fid',
      count: poorFID.length,
      threshold: 300,
    });
  }

  const poorCLS = recentCoreWebVitals.filter(
    c => c.metric === 'CLS' && c.rating === 'poor'
  );
  if (poorCLS.length > 0) {
    alerts.push({
      type: 'poor_cls',
      count: poorCLS.length,
      threshold: 0.25,
    });
  }

  return alerts;
}

function calculatePageLoadTrend(startTime) {
  const relevantMetrics = frontendMetrics.pageLoads.filter(
    p => p.timestamp.getTime() > startTime
  );

  if (relevantMetrics.length === 0) return [];

  // Group by hour
  const hourlyData = {};
  relevantMetrics.forEach(metric => {
    const hour = new Date(metric.timestamp).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = [];
    }
    hourlyData[hour].push(metric.loadTime);
  });

  return Object.entries(hourlyData).map(([hour, loadTimes]) => ({
    hour: parseInt(hour),
    avgLoadTime: Math.round(
      loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length
    ),
    count: loadTimes.length,
  }));
}

function calculateCoreWebVitalsTrend(startTime) {
  const relevantMetrics = frontendMetrics.coreWebVitals.filter(
    c => c.timestamp.getTime() > startTime
  );

  const trends = {
    lcp: [],
    fid: [],
    cls: [],
  };

  ['LCP', 'FID', 'CLS'].forEach(metric => {
    const metricData = relevantMetrics.filter(m => m.metric === metric);
    const hourlyData = {};

    metricData.forEach(data => {
      const hour = new Date(data.timestamp).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(data.value);
    });

    const trendKey = metric.toLowerCase();
    trends[trendKey] = Object.entries(hourlyData).map(([hour, values]) => ({
      hour: parseInt(hour),
      avgValue:
        Math.round(
          (values.reduce((sum, val) => sum + val, 0) / values.length) * 100
        ) / 100,
      count: values.length,
    }));
  });

  return trends;
}

function calculateApiResponseTrend(startTime) {
  // This would typically come from the backend performance monitor
  // For now, return empty array as placeholder
  return [];
}

function generateCapacityPlanningData(summary, timeframe) {
  // Mock capacity planning data based on current metrics
  const baseMemory = summary.system.memoryUsage || 256;
  const baseResponseTime = summary.requests.avgResponseTime || 200;

  return {
    timestamp: new Date().toISOString(),
    timeframe,
    cpu: {
      current: Math.min(
        Math.round(baseResponseTime / 10 + Math.random() * 20),
        100
      ),
      average: Math.min(
        Math.round(baseResponseTime / 12 + Math.random() * 15),
        100
      ),
      peak: Math.min(
        Math.round(baseResponseTime / 8 + Math.random() * 25),
        100
      ),
      trend: baseResponseTime > 500 ? 'increasing' : 'stable',
    },
    memory: {
      current: Math.min(Math.round(baseMemory / 10 + Math.random() * 20), 100),
      average: Math.min(Math.round(baseMemory / 12 + Math.random() * 15), 100),
      peak: Math.min(Math.round(baseMemory / 8 + Math.random() * 25), 100),
      trend: baseMemory > 512 ? 'increasing' : 'stable',
    },
    users: {
      current: Math.round(Math.random() * 50 + 10),
      capacity: 100,
      trend: 'increasing',
    },
    responseTime: {
      current: baseResponseTime,
      p95: Math.round(baseResponseTime * 1.5),
      trend: baseResponseTime > 1000 ? 'increasing' : 'stable',
    },
    alerts: generateCapacityAlerts(baseMemory, baseResponseTime),
    recommendations: generateScalingRecommendations(
      baseMemory,
      baseResponseTime
    ),
    forecast: generateCapacityForecast(baseMemory, baseResponseTime, timeframe),
    optimization: generateOptimizationSuggestions(baseMemory, baseResponseTime),
  };
}

function generateCapacityAlerts(memoryUsage, responseTime) {
  const alerts = [];

  if (responseTime > 1000) {
    alerts.push({
      severity: responseTime > 2000 ? 'critical' : 'warning',
      title: 'High Response Time',
      description: `Average response time of ${responseTime}ms exceeds recommended threshold`,
      metric: 'responseTime',
      value: responseTime,
      threshold: 1000,
    });
  }

  if (memoryUsage > 512) {
    alerts.push({
      severity: memoryUsage > 1024 ? 'critical' : 'warning',
      title: 'High Memory Usage',
      description: `Memory usage of ${memoryUsage}MB is approaching capacity limits`,
      metric: 'memory',
      value: memoryUsage,
      threshold: 512,
    });
  }

  return alerts;
}

function generateScalingRecommendations(memoryUsage, responseTime) {
  const recommendations = [];

  if (responseTime > 1000) {
    recommendations.push({
      title: 'Scale Application Instances',
      description: 'High response times indicate need for horizontal scaling',
      priority: responseTime > 2000 ? 'high' : 'medium',
      actions: [
        'Add additional application server instances',
        'Implement load balancing across instances',
        'Consider auto-scaling based on response time metrics',
      ],
      estimatedImpact: '30-50% response time improvement',
    });
  }

  if (memoryUsage > 512) {
    recommendations.push({
      title: 'Optimize Memory Usage',
      description: 'Memory usage is approaching capacity limits',
      priority: memoryUsage > 1024 ? 'high' : 'medium',
      actions: [
        'Implement memory caching strategies',
        'Optimize database query patterns',
        'Consider memory profiling and optimization',
      ],
      estimatedImpact: '20-40% memory reduction',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Monitor and Maintain',
      description: 'Current capacity is within acceptable limits',
      priority: 'low',
      actions: [
        'Continue monitoring capacity trends',
        'Plan for future growth scenarios',
        'Maintain regular performance testing',
      ],
      estimatedImpact: 'Proactive capacity management',
    });
  }

  return recommendations;
}

function generateCapacityForecast(memoryUsage, responseTime, timeframe) {
  const multiplier = timeframe === '30d' ? 1.5 : timeframe === '7d' ? 1.2 : 1.1;

  return [
    {
      resource: 'CPU',
      timeframe,
      current: '45%',
      projected: `${Math.round(45 * multiplier)}%`,
      recommended: `${Math.round(45 * multiplier * 1.3)}%`,
    },
    {
      resource: 'Memory',
      timeframe,
      current: `${memoryUsage}MB`,
      projected: `${Math.round(memoryUsage * multiplier)}MB`,
      recommended: `${Math.round(memoryUsage * multiplier * 1.3)}MB`,
    },
    {
      resource: 'Storage',
      timeframe,
      current: '2.1GB',
      projected: `${(2.1 * multiplier).toFixed(1)}GB`,
      recommended: `${(2.1 * multiplier * 1.3).toFixed(1)}GB`,
    },
    {
      resource: 'Network',
      timeframe,
      current: '15Mbps',
      projected: `${Math.round(15 * multiplier)}Mbps`,
      recommended: `${Math.round(15 * multiplier * 1.3)}Mbps`,
    },
  ];
}

function generateOptimizationSuggestions(memoryUsage, responseTime) {
  return {
    database: [
      {
        suggestion: 'Add indexes for frequently queried columns',
        impact: 'High',
      },
      {
        suggestion: 'Implement query result caching',
        impact: 'Medium',
      },
      {
        suggestion: 'Optimize slow queries identified in monitoring',
        impact: responseTime > 1000 ? 'High' : 'Medium',
      },
      {
        suggestion: 'Consider read replicas for read-heavy workloads',
        impact: 'Medium',
      },
    ],
    infrastructure: [
      {
        suggestion: 'Implement CDN for static assets',
        impact: 'Medium',
      },
      {
        suggestion: 'Enable gzip compression for API responses',
        impact: 'Low',
      },
      {
        suggestion: 'Configure connection pooling',
        impact: 'Medium',
      },
      {
        suggestion:
          memoryUsage > 512
            ? 'Increase server memory allocation'
            : 'Monitor memory usage trends',
        impact: memoryUsage > 512 ? 'High' : 'Low',
      },
    ],
  };
}

module.exports = router;
