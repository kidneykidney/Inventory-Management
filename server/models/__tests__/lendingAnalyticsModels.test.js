const { LendingAnalytics } = require('../lendingAnalyticsModels');
const { pool } = require('../../config/database');

// Mock the database
jest.mock('../../config/database', () => ({
  pool: {
    execute: jest.fn(),
    getConnection: jest.fn(),
  },
  monitoredQuery: jest.fn(),
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

describe('LendingAnalytics Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOverviewStatistics', () => {
    it('should return overview statistics with correct structure', async () => {
      const mockOverviewStats = [
        {
          total_transactions: 100,
          active_transactions: 20,
          overdue_transactions: 5,
          returned_transactions: 70,
          lost_transactions: 5,
          avg_lending_period: 15.5,
          unique_borrowers: 25,
          products_lent: 40,
        },
      ];

      const mockProductStats = [
        {
          total_products: 50,
          available_products: 30,
          unavailable_products: 20,
          total_categories: 8,
        },
      ];

      const mockUtilizationStats = [
        {
          utilization_rate: 80.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([mockOverviewStats])
        .mockResolvedValueOnce([mockProductStats])
        .mockResolvedValueOnce([mockUtilizationStats]);

      const result = await LendingAnalytics.getOverviewStatistics();

      expect(result).toEqual({
        transactions: mockOverviewStats[0],
        products: mockProductStats[0],
        utilization: mockUtilizationStats[0],
      });

      expect(monitoredQuery).toHaveBeenCalledTimes(3);
    });

    it('should handle database errors gracefully', async () => {
      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockRejectedValue(new Error('Database connection failed'));

      await expect(LendingAnalytics.getOverviewStatistics()).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getLendingTrends', () => {
    it('should return lending trends with default parameters', async () => {
      const mockTrends = [
        {
          period: '2024-01',
          total_lendings: 15,
          unique_borrowers: 8,
          unique_products: 12,
          returned_count: 12,
          overdue_count: 2,
          avg_lending_period: 14.5,
        },
        {
          period: '2024-02',
          total_lendings: 18,
          unique_borrowers: 10,
          unique_products: 15,
          returned_count: 15,
          overdue_count: 1,
          avg_lending_period: 13.2,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockResolvedValue([mockTrends]);

      const result = await LendingAnalytics.getLendingTrends();

      expect(result).toEqual(mockTrends);
      expect(monitoredQuery).toHaveBeenCalledTimes(1);
    });

    it('should handle different groupBy options', async () => {
      const mockTrends = [
        {
          period: '2024-01-15',
          total_lendings: 5,
          unique_borrowers: 3,
          unique_products: 4,
          returned_count: 4,
          overdue_count: 0,
          avg_lending_period: 12.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockResolvedValue([mockTrends]);

      const result = await LendingAnalytics.getLendingTrends({
        groupBy: 'day',
      });

      expect(result).toEqual(mockTrends);
      expect(monitoredQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPopularProducts', () => {
    it('should return popular products with correct data', async () => {
      const mockPopularProducts = [
        {
          id: 'product-1',
          product_name: 'MacBook Pro',
          brand: 'Apple',
          model: 'M2',
          category_name: 'Electronics',
          lending_count: 25,
          avg_lending_period: 14.5,
          overdue_count: 2,
          return_rate: 92.0,
        },
        {
          id: 'product-2',
          product_name: 'Dell Monitor',
          brand: 'Dell',
          model: 'U2720Q',
          category_name: 'Electronics',
          lending_count: 20,
          avg_lending_period: 18.2,
          overdue_count: 1,
          return_rate: 95.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockResolvedValue([mockPopularProducts]);

      const result = await LendingAnalytics.getPopularProducts({ limit: 10 });

      expect(result).toEqual(mockPopularProducts);
      expect(monitoredQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY lending_count DESC'),
        [10]
      );
    });

    it('should handle period filtering', async () => {
      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockResolvedValue([[]]);

      await LendingAnalytics.getPopularProducts({ period: '6months' });

      expect(monitoredQuery).toHaveBeenCalledWith(
        expect.stringContaining('INTERVAL 6 MONTH'),
        expect.any(Array)
      );
    });
  });

  describe('getCategoryAnalytics', () => {
    it('should return category analytics with correct structure', async () => {
      const mockCategoryStats = [
        {
          category_name: 'Electronics',
          total_products: 25,
          total_lendings: 150,
          available_products: 15,
          active_lendings: 10,
          overdue_lendings: 2,
          avg_lending_period: 16.5,
          avg_lendings_per_product: 6.0,
        },
        {
          category_name: 'Office Supplies',
          total_products: 20,
          total_lendings: 80,
          available_products: 12,
          active_lendings: 8,
          overdue_lendings: 1,
          avg_lending_period: 12.3,
          avg_lendings_per_product: 4.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery.mockResolvedValue([mockCategoryStats]);

      const result = await LendingAnalytics.getCategoryAnalytics();

      expect(result).toEqual(mockCategoryStats);
      expect(monitoredQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserBehaviorAnalytics', () => {
    it('should return user behavior analytics with all components', async () => {
      const mockTopBorrowers = [
        {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          total_lendings: 15,
          overdue_count: 1,
          returned_count: 14,
          avg_lending_period: 13.5,
          return_rate: 93.33,
        },
      ];

      const mockBorrowingPatterns = [
        { day_of_week: 'Monday', lending_count: 25, avg_lending_period: 14.2 },
        { day_of_week: 'Tuesday', lending_count: 30, avg_lending_period: 15.1 },
      ];

      const mockMonthlyEngagement = [
        {
          month: '2024-01',
          active_users: 15,
          total_lendings: 45,
          avg_lendings_per_user: 3.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([mockTopBorrowers])
        .mockResolvedValueOnce([mockBorrowingPatterns])
        .mockResolvedValueOnce([mockMonthlyEngagement]);

      const result = await LendingAnalytics.getUserBehaviorAnalytics();

      expect(result).toEqual({
        topBorrowers: mockTopBorrowers,
        borrowingPatterns: mockBorrowingPatterns,
        monthlyEngagement: mockMonthlyEngagement,
      });

      expect(monitoredQuery).toHaveBeenCalledTimes(3);
    });
  });

  describe('getOverdueAnalytics', () => {
    it('should return overdue analytics with correct structure', async () => {
      const mockOverdueStats = [
        {
          total_overdue: 8,
          avg_days_overdue: 5.5,
          max_days_overdue: 15,
          unique_overdue_borrowers: 6,
          unique_overdue_products: 7,
        },
      ];

      const mockOverdueByCategory = [
        {
          category_name: 'Electronics',
          overdue_count: 5,
          avg_days_overdue: 6.2,
        },
      ];

      const mockOverdueByUser = [
        {
          username: 'late_user',
          email: 'late@example.com',
          overdue_count: 3,
          avg_days_overdue: 8.5,
          max_days_overdue: 15,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([mockOverdueStats])
        .mockResolvedValueOnce([mockOverdueByCategory])
        .mockResolvedValueOnce([mockOverdueByUser]);

      const result = await LendingAnalytics.getOverdueAnalytics();

      expect(result).toEqual({
        overview: mockOverdueStats[0],
        byCategory: mockOverdueByCategory,
        byUser: mockOverdueByUser,
      });
    });

    it('should handle empty overdue stats gracefully', async () => {
      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([[]]);

      const result = await LendingAnalytics.getOverdueAnalytics();

      expect(result).toEqual({
        overview: {},
        byCategory: [],
        byUser: [],
      });
    });
  });

  describe('getPredictiveAnalytics', () => {
    it('should return predictive analytics with trending products', async () => {
      const mockTrendingProducts = [
        {
          id: 'product-1',
          product_name: 'iPad Pro',
          brand: 'Apple',
          model: '12.9"',
          category_name: 'Electronics',
          recent_lendings: 8,
          historical_lendings: 5,
          growth_rate: 60.0,
        },
      ];

      const mockPeakPeriods = [
        {
          hour_of_day: 9,
          lending_count: 25,
          avg_hourly_lendings: 15.5,
          relative_activity: 161.29,
        },
      ];

      const mockOverdueRiskProducts = [
        {
          id: 'product-2',
          product_name: 'Expensive Camera',
          brand: 'Canon',
          model: 'EOS R5',
          total_lendings: 10,
          overdue_count: 3,
          overdue_rate: 30.0,
          avg_lending_period: 25.5,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([mockTrendingProducts])
        .mockResolvedValueOnce([mockPeakPeriods])
        .mockResolvedValueOnce([mockOverdueRiskProducts]);

      const result = await LendingAnalytics.getPredictiveAnalytics();

      expect(result).toEqual({
        trendingProducts: mockTrendingProducts,
        peakPeriods: mockPeakPeriods,
        overdueRiskProducts: mockOverdueRiskProducts,
      });
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics with system, inventory, and response data', async () => {
      const mockSystemMetrics = [
        {
          avg_lending_duration: 14.5,
          return_rate: 92.5,
          on_time_return_rate: 88.2,
          avg_overdue_days: 3.2,
          avg_daily_unique_users: 5.8,
        },
      ];

      const mockInventoryTurnover = [
        {
          category_name: 'Electronics',
          total_products: 25,
          total_lendings: 150,
          turnover_rate: 6.0,
          utilization_rate: 80.0,
        },
      ];

      const mockResponseMetrics = [
        {
          avg_resolution_hours: 336.5,
          same_day_returns: 15,
          total_completed_transactions: 100,
          same_day_return_rate: 15.0,
        },
      ];

      const { monitoredQuery } = require('../../config/database');
      monitoredQuery
        .mockResolvedValueOnce([mockSystemMetrics])
        .mockResolvedValueOnce([mockInventoryTurnover])
        .mockResolvedValueOnce([mockResponseMetrics]);

      const result = await LendingAnalytics.getPerformanceMetrics();

      expect(result).toEqual({
        system: mockSystemMetrics[0],
        inventoryTurnover: mockInventoryTurnover,
        response: mockResponseMetrics[0],
      });
    });
  });

  describe('generateAnalyticsReport', () => {
    it('should generate comprehensive analytics report', async () => {
      // Mock all the required methods
      const mockOverview = { transactions: { total_transactions: 100 } };
      const mockTrends = [{ period: '2024-01', total_lendings: 15 }];
      const mockPerformance = { system: { return_rate: 92.5 } };

      jest
        .spyOn(LendingAnalytics, 'getOverviewStatistics')
        .mockResolvedValue(mockOverview);
      jest
        .spyOn(LendingAnalytics, 'getLendingTrends')
        .mockResolvedValue(mockTrends);
      jest
        .spyOn(LendingAnalytics, 'getPerformanceMetrics')
        .mockResolvedValue(mockPerformance);
      jest.spyOn(LendingAnalytics, 'getPopularProducts').mockResolvedValue([]);
      jest
        .spyOn(LendingAnalytics, 'getCategoryAnalytics')
        .mockResolvedValue([]);
      jest
        .spyOn(LendingAnalytics, 'getUserBehaviorAnalytics')
        .mockResolvedValue({});
      jest.spyOn(LendingAnalytics, 'getOverdueAnalytics').mockResolvedValue({});
      jest
        .spyOn(LendingAnalytics, 'getPredictiveAnalytics')
        .mockResolvedValue({});

      const result = await LendingAnalytics.generateAnalyticsReport({
        includeDetails: true,
      });

      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('overview', mockOverview);
      expect(result).toHaveProperty('trends', mockTrends);
      expect(result).toHaveProperty('performance', mockPerformance);
      expect(result).toHaveProperty('popularProducts');
      expect(result).toHaveProperty('categoryAnalytics');
      expect(result).toHaveProperty('userBehavior');
      expect(result).toHaveProperty('overdueAnalytics');
      expect(result).toHaveProperty('predictiveAnalytics');
    });

    it('should generate basic report without details', async () => {
      const mockOverview = { transactions: { total_transactions: 100 } };
      const mockTrends = [{ period: '2024-01', total_lendings: 15 }];
      const mockPerformance = { system: { return_rate: 92.5 } };

      jest
        .spyOn(LendingAnalytics, 'getOverviewStatistics')
        .mockResolvedValue(mockOverview);
      jest
        .spyOn(LendingAnalytics, 'getLendingTrends')
        .mockResolvedValue(mockTrends);
      jest
        .spyOn(LendingAnalytics, 'getPerformanceMetrics')
        .mockResolvedValue(mockPerformance);

      const result = await LendingAnalytics.generateAnalyticsReport({
        includeDetails: false,
      });

      expect(result).toHaveProperty('generatedAt');
      expect(result).toHaveProperty('overview', mockOverview);
      expect(result).toHaveProperty('trends', mockTrends);
      expect(result).toHaveProperty('performance', mockPerformance);
      expect(result).not.toHaveProperty('popularProducts');
      expect(result).not.toHaveProperty('categoryAnalytics');
    });
  });
});
