const { pool, monitoredQuery } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Lending Analytics Model
 * Provides comprehensive analytics for lending system performance and trends
 */
class LendingAnalytics {
  /**
   * Get lending statistics overview
   * @returns {Promise<Object>} Overview statistics
   */
  static async getOverviewStatistics() {
    try {
      const [overviewStats] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_transactions,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_transactions,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_transactions,
          SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost_transactions,
          AVG(DATEDIFF(COALESCE(return_date, CURDATE()), lend_date)) as avg_lending_period,
          COUNT(DISTINCT borrower_id) as unique_borrowers,
          COUNT(DISTINCT product_id) as products_lent
        FROM lending_transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      const [productStats] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_products,
          SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available_products,
          SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as unavailable_products,
          COUNT(DISTINCT category_id) as total_categories
        FROM lending_products
      `);

      const [utilizationStats] = await monitoredQuery(`
        SELECT 
          ROUND((COUNT(DISTINCT lt.product_id) / COUNT(DISTINCT lp.id)) * 100, 2) as utilization_rate
        FROM lending_products lp
        LEFT JOIN lending_transactions lt ON lp.id = lt.product_id 
          AND lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      return {
        transactions: overviewStats[0],
        products: productStats[0],
        utilization: utilizationStats[0]
      };
    } catch (error) {
      logger.error('Error getting overview statistics:', error);
      throw error;
    }
  }

  /**
   * Get lending trends over time
   * @param {Object} options - Options for trend analysis
   * @returns {Promise<Array>} Trend data
   */
  static async getLendingTrends(options = {}) {
    try {
      const { period = '12months', groupBy = 'month' } = options;
      
      let dateFormat, intervalClause;
      switch (groupBy) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          intervalClause = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
          break;
        case 'week':
          dateFormat = '%Y-%u';
          intervalClause = 'DATE_SUB(CURDATE(), INTERVAL 12 WEEK)';
          break;
        case 'month':
        default:
          dateFormat = '%Y-%m';
          intervalClause = 'DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
          break;
      }

      const [trends] = await monitoredQuery(`
        SELECT 
          DATE_FORMAT(lend_date, '${dateFormat}') as period,
          COUNT(*) as total_lendings,
          COUNT(DISTINCT borrower_id) as unique_borrowers,
          COUNT(DISTINCT product_id) as unique_products,
          SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_count,
          SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          AVG(DATEDIFF(COALESCE(return_date, CURDATE()), lend_date)) as avg_lending_period
        FROM lending_transactions
        WHERE lend_date >= ${intervalClause}
        GROUP BY DATE_FORMAT(lend_date, '${dateFormat}')
        ORDER BY period ASC
      `);

      return trends;
    } catch (error) {
      logger.error('Error getting lending trends:', error);
      throw error;
    }
  }

  /**
   * Get popular products analytics
   * @param {Object} options - Options for popular products analysis
   * @returns {Promise<Array>} Popular products data
   */
  static async getPopularProducts(options = {}) {
    try {
      const { limit = 10, period = '12months' } = options;
      
      let dateFilter = '';
      if (period !== 'all') {
        const months = period === '12months' ? 12 : period === '6months' ? 6 : 3;
        dateFilter = `WHERE lt.created_at >= DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)`;
      }

      const [popularProducts] = await monitoredQuery(`
        SELECT 
          lp.id,
          lp.name as product_name,
          lp.brand,
          lp.model,
          pc.name as category_name,
          COUNT(lt.id) as lending_count,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_lending_period,
          SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          ROUND((SUM(CASE WHEN lt.status = 'returned' THEN 1 ELSE 0 END) / COUNT(lt.id)) * 100, 2) as return_rate
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        LEFT JOIN product_categories pc ON lp.category_id = pc.id
        ${dateFilter}
        GROUP BY lp.id, lp.name, lp.brand, lp.model, pc.name
        ORDER BY lending_count DESC
        LIMIT ?
      `, [limit]);

      return popularProducts;
    } catch (error) {
      logger.error('Error getting popular products:', error);
      throw error;
    }
  }

  /**
   * Get category analytics
   * @returns {Promise<Array>} Category analytics data
   */
  static async getCategoryAnalytics() {
    try {
      const [categoryStats] = await monitoredQuery(`
        SELECT 
          pc.name as category_name,
          COUNT(DISTINCT lp.id) as total_products,
          COUNT(lt.id) as total_lendings,
          SUM(CASE WHEN lp.is_available = 1 THEN 1 ELSE 0 END) as available_products,
          SUM(CASE WHEN lt.status = 'active' THEN 1 ELSE 0 END) as active_lendings,
          SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) as overdue_lendings,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_lending_period,
          ROUND((COUNT(lt.id) / COUNT(DISTINCT lp.id)), 2) as avg_lendings_per_product
        FROM product_categories pc
        LEFT JOIN lending_products lp ON pc.id = lp.category_id
        LEFT JOIN lending_transactions lt ON lp.id = lt.product_id 
          AND lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        WHERE pc.parent_id IS NULL
        GROUP BY pc.id, pc.name
        ORDER BY total_lendings DESC
      `);

      return categoryStats;
    } catch (error) {
      logger.error('Error getting category analytics:', error);
      throw error;
    }
  }

  /**
   * Get user behavior analytics
   * @param {Object} options - Options for user analytics
   * @returns {Promise<Object>} User behavior data
   */
  static async getUserBehaviorAnalytics(options = {}) {
    try {
      const { limit = 10 } = options;

      // Top borrowers
      const [topBorrowers] = await monitoredQuery(`
        SELECT 
          u.id,
          u.username,
          u.email,
          COUNT(lt.id) as total_lendings,
          SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          SUM(CASE WHEN lt.status = 'returned' THEN 1 ELSE 0 END) as returned_count,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_lending_period,
          ROUND((SUM(CASE WHEN lt.status = 'returned' THEN 1 ELSE 0 END) / COUNT(lt.id)) * 100, 2) as return_rate
        FROM users u
        JOIN lending_transactions lt ON u.id = lt.borrower_id
        WHERE lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY u.id, u.username, u.email
        ORDER BY total_lendings DESC
        LIMIT ?
      `, [limit]);

      // Borrowing patterns
      const [borrowingPatterns] = await monitoredQuery(`
        SELECT 
          DAYNAME(lend_date) as day_of_week,
          COUNT(*) as lending_count,
          AVG(DATEDIFF(COALESCE(return_date, CURDATE()), lend_date)) as avg_lending_period
        FROM lending_transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DAYOFWEEK(lend_date), DAYNAME(lend_date)
        ORDER BY DAYOFWEEK(lend_date)
      `);

      // Monthly user engagement
      const [monthlyEngagement] = await monitoredQuery(`
        SELECT 
          DATE_FORMAT(lend_date, '%Y-%m') as month,
          COUNT(DISTINCT borrower_id) as active_users,
          COUNT(*) as total_lendings,
          ROUND(COUNT(*) / COUNT(DISTINCT borrower_id), 2) as avg_lendings_per_user
        FROM lending_transactions
        WHERE lend_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(lend_date, '%Y-%m')
        ORDER BY month ASC
      `);

      return {
        topBorrowers,
        borrowingPatterns,
        monthlyEngagement
      };
    } catch (error) {
      logger.error('Error getting user behavior analytics:', error);
      throw error;
    }
  }

  /**
   * Get overdue analytics
   * @returns {Promise<Object>} Overdue analytics data
   */
  static async getOverdueAnalytics() {
    try {
      const [overdueStats] = await monitoredQuery(`
        SELECT 
          COUNT(*) as total_overdue,
          AVG(DATEDIFF(CURDATE(), due_date)) as avg_days_overdue,
          MAX(DATEDIFF(CURDATE(), due_date)) as max_days_overdue,
          COUNT(DISTINCT borrower_id) as unique_overdue_borrowers,
          COUNT(DISTINCT product_id) as unique_overdue_products
        FROM lending_transactions
        WHERE status = 'overdue'
      `);

      const [overdueByCategory] = await monitoredQuery(`
        SELECT 
          pc.name as category_name,
          COUNT(lt.id) as overdue_count,
          AVG(DATEDIFF(CURDATE(), lt.due_date)) as avg_days_overdue
        FROM lending_transactions lt
        JOIN lending_products lp ON lt.product_id = lp.id
        JOIN product_categories pc ON lp.category_id = pc.id
        WHERE lt.status = 'overdue'
        GROUP BY pc.id, pc.name
        ORDER BY overdue_count DESC
      `);

      const [overdueByUser] = await monitoredQuery(`
        SELECT 
          u.username,
          u.email,
          COUNT(lt.id) as overdue_count,
          AVG(DATEDIFF(CURDATE(), lt.due_date)) as avg_days_overdue,
          MAX(DATEDIFF(CURDATE(), lt.due_date)) as max_days_overdue
        FROM lending_transactions lt
        JOIN users u ON lt.borrower_id = u.id
        WHERE lt.status = 'overdue'
        GROUP BY u.id, u.username, u.email
        ORDER BY overdue_count DESC
        LIMIT 10
      `);

      return {
        overview: overdueStats[0] || {},
        byCategory: overdueByCategory,
        byUser: overdueByUser
      };
    } catch (error) {
      logger.error('Error getting overdue analytics:', error);
      throw error;
    }
  }

  /**
   * Get predictive analytics for popular items and lending patterns
   * @returns {Promise<Object>} Predictive analytics data
   */
  static async getPredictiveAnalytics() {
    try {
      // Predict popular items based on recent trends
      const [trendingProducts] = await monitoredQuery(`
        SELECT 
          lp.id,
          lp.name as product_name,
          lp.brand,
          lp.model,
          pc.name as category_name,
          COUNT(lt.id) as recent_lendings,
          COUNT(lt2.id) as historical_lendings,
          ROUND(((COUNT(lt.id) - COUNT(lt2.id)) / NULLIF(COUNT(lt2.id), 0)) * 100, 2) as growth_rate
        FROM lending_products lp
        LEFT JOIN product_categories pc ON lp.category_id = pc.id
        LEFT JOIN lending_transactions lt ON lp.id = lt.product_id 
          AND lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        LEFT JOIN lending_transactions lt2 ON lp.id = lt2.product_id 
          AND lt2.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
          AND lt2.created_at < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        GROUP BY lp.id, lp.name, lp.brand, lp.model, pc.name
        HAVING recent_lendings > 0
        ORDER BY growth_rate DESC
        LIMIT 10
      `);

      // Predict peak lending periods
      const [peakPeriods] = await monitoredQuery(`
        SELECT 
          HOUR(created_at) as hour_of_day,
          COUNT(*) as lending_count,
          AVG(COUNT(*)) OVER() as avg_hourly_lendings,
          ROUND((COUNT(*) / AVG(COUNT(*)) OVER()) * 100, 2) as relative_activity
        FROM lending_transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
        GROUP BY HOUR(created_at)
        ORDER BY lending_count DESC
      `);

      // Predict items likely to be overdue based on patterns
      const [overdueRiskProducts] = await monitoredQuery(`
        SELECT 
          lp.id,
          lp.name as product_name,
          lp.brand,
          lp.model,
          COUNT(lt.id) as total_lendings,
          SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
          ROUND((SUM(CASE WHEN lt.status = 'overdue' THEN 1 ELSE 0 END) / COUNT(lt.id)) * 100, 2) as overdue_rate,
          AVG(DATEDIFF(COALESCE(lt.return_date, CURDATE()), lt.lend_date)) as avg_lending_period
        FROM lending_products lp
        JOIN lending_transactions lt ON lp.id = lt.product_id
        WHERE lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY lp.id, lp.name, lp.brand, lp.model
        HAVING total_lendings >= 3 AND overdue_rate > 20
        ORDER BY overdue_rate DESC
        LIMIT 10
      `);

      return {
        trendingProducts,
        peakPeriods,
        overdueRiskProducts
      };
    } catch (error) {
      logger.error('Error getting predictive analytics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics for lending system efficiency
   * @returns {Promise<Object>} Performance metrics
   */
  static async getPerformanceMetrics() {
    try {
      const [systemMetrics] = await monitoredQuery(`
        SELECT 
          AVG(DATEDIFF(COALESCE(return_date, CURDATE()), lend_date)) as avg_lending_duration,
          ROUND((SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as return_rate,
          ROUND((SUM(CASE WHEN return_date <= due_date THEN 1 ELSE 0 END) / SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END)) * 100, 2) as on_time_return_rate,
          AVG(CASE WHEN return_date > due_date THEN DATEDIFF(return_date, due_date) ELSE 0 END) as avg_overdue_days,
          COUNT(DISTINCT borrower_id) / COUNT(DISTINCT DATE(created_at)) as avg_daily_unique_users
        FROM lending_transactions
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      const [inventoryTurnover] = await monitoredQuery(`
        SELECT 
          pc.name as category_name,
          COUNT(DISTINCT lp.id) as total_products,
          COUNT(lt.id) as total_lendings,
          ROUND(COUNT(lt.id) / COUNT(DISTINCT lp.id), 2) as turnover_rate,
          ROUND((COUNT(DISTINCT lt.product_id) / COUNT(DISTINCT lp.id)) * 100, 2) as utilization_rate
        FROM product_categories pc
        LEFT JOIN lending_products lp ON pc.id = lp.category_id
        LEFT JOIN lending_transactions lt ON lp.id = lt.product_id 
          AND lt.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        WHERE pc.parent_id IS NULL
        GROUP BY pc.id, pc.name
        ORDER BY turnover_rate DESC
      `);

      const [responseMetrics] = await monitoredQuery(`
        SELECT 
          AVG(TIMESTAMPDIFF(HOUR, created_at, 
            CASE WHEN status = 'returned' THEN return_date ELSE NULL END)) as avg_resolution_hours,
          COUNT(CASE WHEN TIMESTAMPDIFF(DAY, created_at, return_date) <= 1 THEN 1 END) as same_day_returns,
          COUNT(*) as total_completed_transactions,
          ROUND((COUNT(CASE WHEN TIMESTAMPDIFF(DAY, created_at, return_date) <= 1 THEN 1 END) / COUNT(*)) * 100, 2) as same_day_return_rate
        FROM lending_transactions
        WHERE status = 'returned' 
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      `);

      return {
        system: systemMetrics[0] || {},
        inventoryTurnover,
        response: responseMetrics[0] || {}
      };
    } catch (error) {
      logger.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analytics report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Complete analytics report
   */
  static async generateAnalyticsReport(options = {}) {
    try {
      const { includeDetails = true } = options;

      const report = {
        generatedAt: new Date(),
        overview: await this.getOverviewStatistics(),
        trends: await this.getLendingTrends(),
        performance: await this.getPerformanceMetrics()
      };

      if (includeDetails) {
        report.popularProducts = await this.getPopularProducts();
        report.categoryAnalytics = await this.getCategoryAnalytics();
        report.userBehavior = await this.getUserBehaviorAnalytics();
        report.overdueAnalytics = await this.getOverdueAnalytics();
        report.predictiveAnalytics = await this.getPredictiveAnalytics();
      }

      return report;
    } catch (error) {
      logger.error('Error generating analytics report:', error);
      throw error;
    }
  }
}

module.exports = {
  LendingAnalytics
};