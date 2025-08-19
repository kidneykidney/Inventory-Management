const performanceTracker = require('../performanceTracker');

// Mock fetch for testing
global.fetch = jest.fn();

// Mock performance API
const mockPerformance = {
  getEntriesByType: jest.fn(),
  now: jest.fn(() => Date.now()),
  getEntriesByName: jest.fn()
};

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn();
mockPerformanceObserver.prototype.observe = jest.fn();
mockPerformanceObserver.prototype.disconnect = jest.fn();

global.performance = mockPerformance;
global.PerformanceObserver = mockPerformanceObserver;

describe('PerformanceTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    
    // Reset metrics
    performanceTracker.metrics = {
      pageLoads: [],
      userInteractions: [],
      apiCalls: [],
      coreWebVitals: {}
    };
  });

  describe('init', () => {
    it('should initialize performance tracking when supported', () => {
      performanceTracker.isSupported = true;
      
      const trackPageLoadSpy = jest.spyOn(performanceTracker, 'trackPageLoad');
      const trackCoreWebVitalsSpy = jest.spyOn(performanceTracker, 'trackCoreWebVitals');
      const setupNavigationObserverSpy = jest.spyOn(performanceTracker, 'setupNavigationObserver');
      const setupResourceObserverSpy = jest.spyOn(performanceTracker, 'setupResourceObserver');

      performanceTracker.init();

      expect(trackPageLoadSpy).toHaveBeenCalled();
      expect(trackCoreWebVitalsSpy).toHaveBeenCalled();
      expect(setupNavigationObserverSpy).toHaveBeenCalled();
      expect(setupResourceObserverSpy).toHaveBeenCalled();
    });

    it('should warn when performance API is not supported', () => {
      performanceTracker.isSupported = false;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      performanceTracker.init();

      expect(consoleSpy).toHaveBeenCalledWith('Performance API not supported');
      consoleSpy.mockRestore();
    });
  });

  describe('trackApiCall', () => {
    it('should track API call metrics', () => {
      const apiMetric = {
        url: '/api/v1/test',
        duration: 150,
        size: 1024,
        timestamp: new Date().toISOString()
      };

      performanceTracker.trackApiCall(apiMetric);

      expect(performanceTracker.metrics.apiCalls).toHaveLength(1);
      expect(performanceTracker.metrics.apiCalls[0]).toEqual(apiMetric);
    });

    it('should limit stored API calls to 100', () => {
      // Add 101 API calls
      for (let i = 0; i < 101; i++) {
        performanceTracker.trackApiCall({
          url: `/api/v1/test${i}`,
          duration: 100,
          size: 1024,
          timestamp: new Date().toISOString()
        });
      }

      expect(performanceTracker.metrics.apiCalls).toHaveLength(100);
    });

    it('should warn about slow API calls', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      performanceTracker.trackApiCall({
        url: '/api/v1/slow',
        duration: 4000, // Exceeds 3000ms threshold
        size: 1024,
        timestamp: new Date().toISOString()
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Slow API call detected: /api/v1/slow took 4000ms'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('trackUserInteraction', () => {
    it('should track user interactions', () => {
      const mockElement = {
        tagName: 'BUTTON',
        id: 'test-button'
      };

      performanceTracker.trackUserInteraction('click', mockElement, 50);

      expect(performanceTracker.metrics.userInteractions).toHaveLength(1);
      expect(performanceTracker.metrics.userInteractions[0]).toMatchObject({
        action: 'click',
        element: 'BUTTON',
        elementId: 'test-button',
        duration: 50
      });
    });

    it('should limit stored interactions to 50', () => {
      const mockElement = { tagName: 'BUTTON', id: 'test' };

      // Add 51 interactions
      for (let i = 0; i < 51; i++) {
        performanceTracker.trackUserInteraction('click', mockElement);
      }

      expect(performanceTracker.metrics.userInteractions).toHaveLength(50);
    });

    it('should send metrics to server', () => {
      const mockElement = { tagName: 'BUTTON', id: 'test' };
      
      performanceTracker.trackUserInteraction('click', mockElement);

      expect(fetch).toHaveBeenCalledWith('/api/v1/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('user_interaction')
      });
    });
  });

  describe('getMetricsSummary', () => {
    it('should return metrics summary', () => {
      // Add test data
      performanceTracker.metrics.pageLoads = [
        { url: '/test', loadTime: 1000, timestamp: new Date().toISOString() }
      ];
      performanceTracker.metrics.coreWebVitals = {
        lcp: { value: 2000, rating: 'good' }
      };
      performanceTracker.metrics.apiCalls = Array(15).fill().map((_, i) => ({
        url: `/api/test${i}`,
        duration: 100,
        timestamp: new Date().toISOString()
      }));
      performanceTracker.metrics.userInteractions = Array(15).fill().map((_, i) => ({
        action: 'click',
        element: 'BUTTON',
        timestamp: new Date().toISOString()
      }));

      const summary = performanceTracker.getMetricsSummary();

      expect(summary).toHaveProperty('pageLoads');
      expect(summary).toHaveProperty('coreWebVitals');
      expect(summary).toHaveProperty('apiCalls');
      expect(summary).toHaveProperty('userInteractions');

      // Should return last 10 API calls and interactions
      expect(summary.apiCalls).toHaveLength(10);
      expect(summary.userInteractions).toHaveLength(10);
    });
  });

  describe('Core Web Vitals rating', () => {
    it('should rate LCP correctly', () => {
      expect(performanceTracker.rateLCP(2000)).toBe('good');
      expect(performanceTracker.rateLCP(3000)).toBe('needs-improvement');
      expect(performanceTracker.rateLCP(5000)).toBe('poor');
    });

    it('should rate FID correctly', () => {
      expect(performanceTracker.rateFID(50)).toBe('good');
      expect(performanceTracker.rateFID(200)).toBe('needs-improvement');
      expect(performanceTracker.rateFID(400)).toBe('poor');
    });

    it('should rate CLS correctly', () => {
      expect(performanceTracker.rateCLS(0.05)).toBe('good');
      expect(performanceTracker.rateCLS(0.15)).toBe('needs-improvement');
      expect(performanceTracker.rateCLS(0.3)).toBe('poor');
    });
  });

  describe('checkPerformanceBudget', () => {
    it('should detect page load time violations', () => {
      performanceTracker.metrics.pageLoads = [{
        loadTime: 4000, // Exceeds 3000ms budget
        timestamp: new Date().toISOString()
      }];

      const violations = performanceTracker.checkPerformanceBudget();

      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({
        metric: 'Page Load Time',
        value: 4000,
        budget: 3000
      });
    });

    it('should detect Core Web Vitals violations', () => {
      performanceTracker.metrics.coreWebVitals = {
        lcp: { value: 3000 }, // Exceeds 2500ms budget
        fid: { value: 150 },  // Exceeds 100ms budget
        cls: { value: 0.2 }   // Exceeds 0.1 budget
      };

      const violations = performanceTracker.checkPerformanceBudget();

      expect(violations).toHaveLength(3);
      expect(violations.some(v => v.metric === 'LCP')).toBe(true);
      expect(violations.some(v => v.metric === 'FID')).toBe(true);
      expect(violations.some(v => v.metric === 'CLS')).toBe(true);
    });

    it('should return empty array when no violations', () => {
      performanceTracker.metrics.pageLoads = [{
        loadTime: 2000, // Within budget
        timestamp: new Date().toISOString()
      }];
      performanceTracker.metrics.coreWebVitals = {
        lcp: { value: 2000 }, // Within budget
        fid: { value: 80 },   // Within budget
        cls: { value: 0.05 }  // Within budget
      };

      const violations = performanceTracker.checkPerformanceBudget();

      expect(violations).toHaveLength(0);
    });
  });

  describe('sendMetricsToServer', () => {
    it('should send metrics to server successfully', async () => {
      fetch.mockResolvedValueOnce({ ok: true });

      await performanceTracker.sendMetricsToServer('test_metric', { value: 100 });

      expect(fetch).toHaveBeenCalledWith('/api/v1/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('test_metric')
      });
    });

    it('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await performanceTracker.sendMetricsToServer('test_metric', { value: 100 });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send performance metrics:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});