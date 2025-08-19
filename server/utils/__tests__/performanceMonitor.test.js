const performanceMonitor = require('../performanceMonitor');

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    performanceMonitor.metrics.requests.clear();
    performanceMonitor.metrics.database.clear();
    performanceMonitor.metrics.memory = [];
    performanceMonitor.metrics.cpu = [];
    performanceMonitor.metrics.errors = [];
  });

  describe('trackRequest', () => {
    it('should track HTTP request metrics', done => {
      const mockReq = {
        method: 'GET',
        url: '/api/v1/test',
        get: jest.fn().mockReturnValue('test-agent'),
        ip: '127.0.0.1',
      };

      const mockRes = {
        statusCode: 200,
        send: jest.fn(),
      };

      const mockNext = jest.fn();

      // Apply middleware
      performanceMonitor.trackRequest(mockReq, mockRes, mockNext);

      // Simulate response
      setTimeout(() => {
        mockRes.send('test response');

        // Check if metrics were recorded
        const key = `${mockReq.method}:${mockReq.url}`;
        expect(performanceMonitor.metrics.requests.has(key)).toBe(true);

        const metrics = performanceMonitor.metrics.requests.get(key);
        expect(metrics).toHaveLength(1);
        expect(metrics[0]).toMatchObject({
          method: 'GET',
          url: '/api/v1/test',
          statusCode: 200,
          userAgent: 'test-agent',
          ip: '127.0.0.1',
        });
        expect(metrics[0].duration).toBeGreaterThan(0);

        done();
      }, 10);
    });

    it('should call next middleware', () => {
      const mockReq = {
        method: 'GET',
        url: '/test',
        get: jest.fn(),
        ip: '127.0.0.1',
      };
      const mockRes = { send: jest.fn() };
      const mockNext = jest.fn();

      performanceMonitor.trackRequest(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('recordRequestMetric', () => {
    it('should record request metrics correctly', () => {
      const metric = {
        method: 'POST',
        url: '/api/v1/users',
        statusCode: 201,
        duration: 150,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };

      performanceMonitor.recordRequestMetric(metric);

      const key = `${metric.method}:${metric.url}`;
      expect(performanceMonitor.metrics.requests.has(key)).toBe(true);

      const metrics = performanceMonitor.metrics.requests.get(key);
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toEqual(metric);
    });

    it('should limit stored metrics to 1000 per endpoint', () => {
      const metric = {
        method: 'GET',
        url: '/api/v1/test',
        statusCode: 200,
        duration: 100,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      };

      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceMonitor.recordRequestMetric({
          ...metric,
          timestamp: new Date(Date.now() + i),
        });
      }

      const key = `${metric.method}:${metric.url}`;
      const metrics = performanceMonitor.metrics.requests.get(key);
      expect(metrics).toHaveLength(1000);
    });
  });

  describe('trackDatabaseQuery', () => {
    it('should track successful database queries', () => {
      const query = 'SELECT * FROM users WHERE id = ?';
      const duration = 50;

      performanceMonitor.trackDatabaseQuery(query, duration);

      const queries = performanceMonitor.metrics.database.get('queries');
      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({
        query: query.substring(0, 100),
        duration,
        error: null,
      });
    });

    it('should track failed database queries', () => {
      const query = 'SELECT * FROM nonexistent_table';
      const duration = 25;
      const error = new Error('Table does not exist');

      performanceMonitor.trackDatabaseQuery(query, duration, error);

      const queries = performanceMonitor.metrics.database.get('queries');
      expect(queries).toHaveLength(1);
      expect(queries[0]).toMatchObject({
        query: query.substring(0, 100),
        duration,
        error: error.message,
      });
    });

    it('should truncate long queries for privacy', () => {
      const longQuery = 'SELECT * FROM users WHERE ' + 'a'.repeat(200);
      const duration = 30;

      performanceMonitor.trackDatabaseQuery(longQuery, duration);

      const queries = performanceMonitor.metrics.database.get('queries');
      expect(queries[0].query).toHaveLength(100);
    });
  });

  describe('recordSystemMetrics', () => {
    it('should record memory and CPU metrics', () => {
      performanceMonitor.recordSystemMetrics();

      expect(performanceMonitor.metrics.memory).toHaveLength(1);
      expect(performanceMonitor.metrics.cpu).toHaveLength(1);

      const memMetric = performanceMonitor.metrics.memory[0];
      expect(memMetric).toHaveProperty('rss');
      expect(memMetric).toHaveProperty('heapTotal');
      expect(memMetric).toHaveProperty('heapUsed');
      expect(memMetric).toHaveProperty('external');
      expect(memMetric).toHaveProperty('timestamp');

      const cpuMetric = performanceMonitor.metrics.cpu[0];
      expect(cpuMetric).toHaveProperty('user');
      expect(cpuMetric).toHaveProperty('system');
      expect(cpuMetric).toHaveProperty('timestamp');
    });

    it('should limit stored metrics to 1000', () => {
      // Add 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceMonitor.recordSystemMetrics();
      }

      expect(performanceMonitor.metrics.memory).toHaveLength(1000);
      expect(performanceMonitor.metrics.cpu).toHaveLength(1000);
    });
  });

  describe('getPerformanceSummary', () => {
    it('should return performance summary', () => {
      // Add some test data
      performanceMonitor.recordRequestMetric({
        method: 'GET',
        url: '/api/v1/test',
        statusCode: 200,
        duration: 150,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });

      performanceMonitor.recordSystemMetrics();
      performanceMonitor.trackDatabaseQuery('SELECT * FROM users', 50);

      const summary = performanceMonitor.getPerformanceSummary();

      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('requests');
      expect(summary).toHaveProperty('system');
      expect(summary).toHaveProperty('database');

      expect(summary.requests).toHaveProperty('total');
      expect(summary.requests).toHaveProperty('endpoints');
      expect(summary.requests).toHaveProperty('avgResponseTime');

      expect(summary.system).toHaveProperty('memoryUsage');
      expect(summary.system).toHaveProperty('uptime');
      expect(summary.system).toHaveProperty('nodeVersion');

      expect(summary.database).toHaveProperty('queryCount');
      expect(summary.database).toHaveProperty('slowQueries');
    });
  });

  describe('getCoreWebVitalsBaseline', () => {
    it('should return Core Web Vitals baseline values', () => {
      const baseline = performanceMonitor.getCoreWebVitalsBaseline();

      expect(baseline).toHaveProperty('LCP');
      expect(baseline).toHaveProperty('FID');
      expect(baseline).toHaveProperty('CLS');

      expect(baseline.LCP).toMatchObject({
        threshold: 2500,
        good: 2500,
        poor: 4000,
      });

      expect(baseline.FID).toMatchObject({
        threshold: 100,
        good: 100,
        poor: 300,
      });

      expect(baseline.CLS).toMatchObject({
        threshold: 0.1,
        good: 0.1,
        poor: 0.25,
      });
    });
  });

  describe('checkPerformanceRegression', () => {
    it('should detect slow response times', () => {
      // Add slow request
      performanceMonitor.recordRequestMetric({
        method: 'GET',
        url: '/api/v1/slow',
        statusCode: 200,
        duration: 2000, // Exceeds threshold of 1000ms
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });

      const alerts = performanceMonitor.checkPerformanceRegression();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toMatchObject({
        type: 'slow_response',
        endpoint: 'GET:/api/v1/slow',
        value: 2000,
        threshold: 1000,
      });
    });

    it('should detect high error rates', () => {
      // Add requests with high error rate
      for (let i = 0; i < 10; i++) {
        performanceMonitor.recordRequestMetric({
          method: 'GET',
          url: '/api/v1/error-prone',
          statusCode: i < 7 ? 500 : 200, // 70% error rate
          duration: 100,
          timestamp: new Date(),
          userAgent: 'test-agent',
          ip: '127.0.0.1',
        });
      }

      const alerts = performanceMonitor.checkPerformanceRegression();

      expect(alerts.some(alert => alert.type === 'high_error_rate')).toBe(true);
    });

    it('should return empty array when no regressions detected', () => {
      // Add normal request
      performanceMonitor.recordRequestMetric({
        method: 'GET',
        url: '/api/v1/normal',
        statusCode: 200,
        duration: 100,
        timestamp: new Date(),
        userAgent: 'test-agent',
        ip: '127.0.0.1',
      });

      const alerts = performanceMonitor.checkPerformanceRegression();

      expect(alerts).toHaveLength(0);
    });
  });
});
