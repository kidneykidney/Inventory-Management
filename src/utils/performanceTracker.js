// Frontend performance tracking utility
class PerformanceTracker {
  constructor() {
    this.metrics = {
      pageLoads: [],
      userInteractions: [],
      apiCalls: [],
      coreWebVitals: {},
    };
    this.isSupported = 'performance' in window;
  }

  // Initialize performance tracking
  init() {
    if (!this.isSupported) {
      console.warn('Performance API not supported');
      return;
    }

    this.trackPageLoad();
    this.trackCoreWebVitals();
    this.setupNavigationObserver();
    this.setupResourceObserver();
  }

  // Track page load performance
  trackPageLoad() {
    if (!this.isSupported) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          const metrics = {
            url: window.location.pathname,
            loadTime: navigation.loadEventEnd - navigation.fetchStart,
            domContentLoaded:
              navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint(),
            timestamp: new Date().toISOString(),
          };

          this.metrics.pageLoads.push(metrics);
          this.sendMetricsToServer('page_load', metrics);
        }
      }, 0);
    });
  }

  // Track Core Web Vitals
  trackCoreWebVitals() {
    if (!this.isSupported) return;

    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();
  }

  // Observe Largest Contentful Paint
  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.metrics.coreWebVitals.lcp = {
          value: lastEntry.startTime,
          rating: this.rateLCP(lastEntry.startTime),
          timestamp: new Date().toISOString(),
        };

        this.sendMetricsToServer('core_web_vitals', {
          metric: 'LCP',
          value: lastEntry.startTime,
          rating: this.rateLCP(lastEntry.startTime),
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }

  // Observe First Input Delay
  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.metrics.coreWebVitals.fid = {
            value: entry.processingStart - entry.startTime,
            rating: this.rateFID(entry.processingStart - entry.startTime),
            timestamp: new Date().toISOString(),
          };

          this.sendMetricsToServer('core_web_vitals', {
            metric: 'FID',
            value: entry.processingStart - entry.startTime,
            rating: this.rateFID(entry.processingStart - entry.startTime),
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    }
  }

  // Observe Cumulative Layout Shift
  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        this.metrics.coreWebVitals.cls = {
          value: clsValue,
          rating: this.rateCLS(clsValue),
          timestamp: new Date().toISOString(),
        };

        this.sendMetricsToServer('core_web_vitals', {
          metric: 'CLS',
          value: clsValue,
          rating: this.rateCLS(clsValue),
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }

  // Setup navigation observer for SPA routing
  setupNavigationObserver() {
    // Track route changes in React Router
    let currentPath = window.location.pathname;

    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        const navigationTime = performance.now();
        currentPath = window.location.pathname;

        this.trackRouteChange(currentPath, navigationTime);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Setup resource observer
  setupResourceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (
            entry.initiatorType === 'fetch' ||
            entry.initiatorType === 'xmlhttprequest'
          ) {
            this.trackApiCall({
              url: entry.name,
              duration: entry.responseEnd - entry.requestStart,
              size: entry.transferSize,
              timestamp: new Date().toISOString(),
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }
  }

  // Track route changes
  trackRouteChange(path, navigationTime) {
    const metric = {
      path,
      navigationTime,
      timestamp: new Date().toISOString(),
    };

    this.sendMetricsToServer('route_change', metric);
  }

  // Track API calls
  trackApiCall(apiMetric) {
    this.metrics.apiCalls.push(apiMetric);

    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }

    // Alert on slow API calls
    if (apiMetric.duration > 3000) {
      console.warn(
        `Slow API call detected: ${apiMetric.url} took ${apiMetric.duration}ms`
      );
    }
  }

  // Track user interactions
  trackUserInteraction(action, element, duration = null) {
    const metric = {
      action,
      element: element?.tagName || 'unknown',
      elementId: element?.id || null,
      duration,
      timestamp: new Date().toISOString(),
    };

    this.metrics.userInteractions.push(metric);

    // Keep only last 50 interactions
    if (this.metrics.userInteractions.length > 50) {
      this.metrics.userInteractions.shift();
    }

    this.sendMetricsToServer('user_interaction', metric);
  }

  // Get performance metrics summary
  getMetricsSummary() {
    return {
      pageLoads: this.metrics.pageLoads,
      coreWebVitals: this.metrics.coreWebVitals,
      apiCalls: this.metrics.apiCalls.slice(-10), // Last 10 API calls
      userInteractions: this.metrics.userInteractions.slice(-10), // Last 10 interactions
    };
  }

  // Rating functions for Core Web Vitals
  rateLCP(value) {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  rateFID(value) {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  rateCLS(value) {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  // Helper functions
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(
      entry => entry.name === 'first-contentful-paint'
    );
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }

  // Send metrics to server
  async sendMetricsToServer(type, data) {
    try {
      await fetch('/api/v1/performance/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          userAgent: navigator.userAgent,
          url: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
    }
  }

  // Performance budget checker
  checkPerformanceBudget() {
    const budget = {
      pageLoadTime: 3000,
      apiResponseTime: 1000,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
    };

    const violations = [];

    // Check latest page load
    const latestPageLoad =
      this.metrics.pageLoads[this.metrics.pageLoads.length - 1];
    if (latestPageLoad && latestPageLoad.loadTime > budget.pageLoadTime) {
      violations.push({
        metric: 'Page Load Time',
        value: latestPageLoad.loadTime,
        budget: budget.pageLoadTime,
      });
    }

    // Check Core Web Vitals
    if (
      this.metrics.coreWebVitals.lcp &&
      this.metrics.coreWebVitals.lcp.value > budget.lcp
    ) {
      violations.push({
        metric: 'LCP',
        value: this.metrics.coreWebVitals.lcp.value,
        budget: budget.lcp,
      });
    }

    if (
      this.metrics.coreWebVitals.fid &&
      this.metrics.coreWebVitals.fid.value > budget.fid
    ) {
      violations.push({
        metric: 'FID',
        value: this.metrics.coreWebVitals.fid.value,
        budget: budget.fid,
      });
    }

    if (
      this.metrics.coreWebVitals.cls &&
      this.metrics.coreWebVitals.cls.value > budget.cls
    ) {
      violations.push({
        metric: 'CLS',
        value: this.metrics.coreWebVitals.cls.value,
        budget: budget.cls,
      });
    }

    return violations;
  }
}

// Create singleton instance
const performanceTracker = new PerformanceTracker();

module.exports = performanceTracker;
