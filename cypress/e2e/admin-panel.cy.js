/**
 * Admin Panel E2E Tests
 * End-to-end tests for admin panel workflows
 */

describe('Admin Panel', () => {
  let adminUser;
  let regularUser;

  beforeEach(() => {
    // Mock users for testing
    adminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'admin',
      token: 'mock-admin-token'
    };

    regularUser = {
      id: 'user-123',
      email: 'user@test.com',
      name: 'Regular User',
      role: 'user',
      token: 'mock-user-token'
    };

    // Mock API responses
    cy.intercept('GET', '/api/v1/auth/user', (req) => {
      const token = req.headers.authorization?.split(' ')[1];
      if (token === 'mock-admin-token') {
        req.reply({ statusCode: 200, body: { success: true, user: adminUser } });
      } else if (token === 'mock-user-token') {
        req.reply({ statusCode: 200, body: { success: true, user: regularUser } });
      } else {
        req.reply({ statusCode: 401, body: { success: false, message: 'Unauthorized' } });
      }
    }).as('getUserInfo');

    cy.intercept('GET', '/api/v1/admin/dashboard', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          overview: {
            totalUsers: 150,
            activeUsers: 142,
            totalProducts: 500,
            availableProducts: 450,
            activeTransactions: 75,
            overdueTransactions: 5,
            avgLendingPeriod: 25
          },
          recentActivity: [
            {
              id: '1',
              product_name: 'MacBook Pro',
              borrower_name: 'John Doe',
              status: 'active'
            }
          ],
          overdueItems: [
            {
              id: '1',
              product_name: 'iPad Pro',
              borrower_name: 'Jane Smith',
              dueDate: '2024-01-01'
            }
          ]
        }
      }
    }).as('getDashboardData');

    cy.intercept('GET', '/api/v1/admin/users*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@test.com',
            role: 'user',
            status: 'active',
            department: 'Engineering',
            lastLogin: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@test.com',
            role: 'admin',
            status: 'active',
            department: 'IT',
            lastLogin: '2024-01-15T09:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      }
    }).as('getUsers');

    cy.intercept('GET', '/api/v1/admin/products*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            id: '1',
            name: 'MacBook Pro',
            brand: 'Apple',
            model: 'M2',
            category_name: 'Electronics',
            conditionStatus: 'excellent',
            isAvailable: true,
            location: 'Office A'
          },
          {
            id: '2',
            name: 'iPad Pro',
            brand: 'Apple',
            model: '12.9"',
            category_name: 'Electronics',
            conditionStatus: 'good',
            isAvailable: false,
            location: 'Office B'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          pages: 1
        }
      }
    }).as('getProducts');

    cy.intercept('GET', '/api/v1/admin/categories', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: '1', name: 'Electronics' },
          { id: '2', name: 'Office Supplies' }
        ]
      }
    }).as('getCategories');

    cy.intercept('GET', '/api/v1/admin/reports/lending-analytics', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          lendingOverview: {
            total_transactions: 1000,
            active_transactions: 75,
            overdue_transactions: 5,
            returned_transactions: 920,
            avg_lending_period: 25
          },
          monthlyTrends: [
            { month: '2024-01', transactions_count: 85 },
            { month: '2024-02', transactions_count: 92 }
          ],
          popularProducts: [
            { product_name: 'MacBook Pro', brand: 'Apple', model: 'M2', lending_count: 45 }
          ],
          productDistribution: [
            { category: 'Electronics', count: 300 },
            { category: 'Office Supplies', count: 200 }
          ],
          conditionAnalysis: [
            { condition_status: 'excellent', count: 200 },
            { condition_status: 'good', count: 250 }
          ],
          overdueAnalysis: {
            count: 5,
            items: [
              { productName: 'iPad Pro', borrowerName: 'Jane Smith', daysOverdue: 3 }
            ]
          }
        }
      }
    }).as('getAnalytics');
  });

  describe('Access Control', () => {
    it('should allow admin users to access admin panel', () => {
      localStorage.setItem('token', 'mock-admin-token');
      
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      cy.contains('Admin Panel').should('be.visible');
      cy.contains('Administrator').should('be.visible');
      cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    });

    it('should deny access to regular users', () => {
      localStorage.setItem('token', 'mock-user-token');
      
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      cy.contains('Access Denied').should('be.visible');
      cy.contains('You don\'t have permission to access the admin panel').should('be.visible');
    });

    it('should redirect unauthenticated users to login', () => {
      localStorage.removeItem('token');
      
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      // Should redirect to login page
      cy.url().should('include', '/login');
    });
  });

  describe('Dashboard Functionality', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      cy.wait('@getDashboardData');
    });

    it('should display key metrics correctly', () => {
      cy.contains('150').should('be.visible'); // Total Users
      cy.contains('500').should('be.visible'); // Total Products
      cy.contains('75').should('be.visible');  // Active Loans
      cy.contains('5').should('be.visible');   // Overdue Items
    });

    it('should show recent activity', () => {
      cy.get('[data-state="active"][value="recent-activity"]').click();
      cy.contains('MacBook Pro').should('be.visible');
      cy.contains('John Doe').should('be.visible');
    });

    it('should display overdue items', () => {
      cy.get('[data-state="inactive"][value="overdue-items"]').click();
      cy.contains('iPad Pro').should('be.visible');
      cy.contains('Jane Smith').should('be.visible');
    });

    it('should provide quick actions', () => {
      cy.get('[data-state="inactive"][value="quick-actions"]').click();
      cy.contains('Add Product').should('be.visible');
      cy.contains('Manage Users').should('be.visible');
      cy.contains('Generate Report').should('be.visible');
    });
  });

  describe('Product Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      // Navigate to products tab
      cy.get('[value="products"]').click();
      cy.wait('@getProducts');
      cy.wait('@getCategories');
    });

    it('should display products list', () => {
      cy.contains('MacBook Pro').should('be.visible');
      cy.contains('iPad Pro').should('be.visible');
      cy.contains('Apple').should('be.visible');
    });

    it('should filter products by search', () => {
      cy.get('input[placeholder="Search products..."]').type('MacBook');
      cy.contains('MacBook Pro').should('be.visible');
    });

    it('should open add product dialog', () => {
      cy.contains('Add Product').click();
      cy.contains('Add New Product').should('be.visible');
      cy.get('input[id="name"]').should('be.visible');
    });

    it('should handle product creation', () => {
      cy.intercept('POST', '/api/v1/admin/products', {
        statusCode: 201,
        body: { success: true, message: 'Product created successfully' }
      }).as('createProduct');

      cy.contains('Add Product').click();
      cy.get('input[id="name"]').type('Test Product');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@createProduct');
      cy.contains('Product created successfully').should('be.visible');
    });

    it('should handle bulk import', () => {
      cy.intercept('POST', '/api/v1/admin/products/bulk-import', {
        statusCode: 200,
        body: {
          success: true,
          data: { successful: [{ name: 'Product 1' }], failed: [] }
        }
      }).as('bulkImport');

      cy.contains('Bulk Import').click();
      cy.get('textarea[id="bulk-data"]').type('[{"name": "Product 1", "categoryId": "1"}]');
      cy.contains('Import Products').click();
      
      cy.wait('@bulkImport');
      cy.contains('1 products imported successfully').should('be.visible');
    });
  });

  describe('User Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      // Navigate to users tab
      cy.get('[value="users"]').click();
      cy.wait('@getUsers');
    });

    it('should display users list', () => {
      cy.contains('John Doe').should('be.visible');
      cy.contains('Jane Smith').should('be.visible');
      cy.contains('john@test.com').should('be.visible');
    });

    it('should filter users by role', () => {
      cy.get('select').first().select('admin');
      cy.contains('Jane Smith').should('be.visible');
    });

    it('should open edit user dialog', () => {
      cy.get('button').contains('Edit').first().click();
      cy.contains('Edit User').should('be.visible');
      cy.get('input[id="edit-name"]').should('be.visible');
    });

    it('should handle user updates', () => {
      cy.intercept('PUT', '/api/v1/admin/users/*', {
        statusCode: 200,
        body: { success: true, message: 'User updated successfully' }
      }).as('updateUser');

      cy.get('button').contains('Edit').first().click();
      cy.get('input[id="edit-name"]').clear().type('Updated Name');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateUser');
      cy.contains('User updated successfully').should('be.visible');
    });
  });

  describe('Reporting Dashboard', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      // Navigate to reports tab
      cy.get('[value="reports"]').click();
      cy.wait('@getAnalytics');
    });

    it('should display analytics metrics', () => {
      cy.contains('1000').should('be.visible'); // Total Transactions
      cy.contains('75').should('be.visible');   // Active Loans
      cy.contains('25 days').should('be.visible'); // Avg Lending Period
    });

    it('should show different report tabs', () => {
      cy.get('[value="trends"]').click();
      cy.contains('Monthly Transaction Trends').should('be.visible');
      
      cy.get('[value="products"]').click();
      cy.contains('Most Popular Products').should('be.visible');
      
      cy.get('[value="overdue"]').click();
      cy.contains('Overdue Summary').should('be.visible');
    });

    it('should handle export functionality', () => {
      cy.contains('Export PDF').click();
      cy.contains('Export Started').should('be.visible');
    });
  });

  describe('Settings Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      // Navigate to settings tab
      cy.get('[value="settings"]').click();
    });

    it('should display system configuration', () => {
      cy.contains('System Configuration').should('be.visible');
      cy.contains('Default Lending Period').should('be.visible');
      cy.contains('30 days').should('be.visible');
    });

    it('should show system health status', () => {
      cy.contains('System Health').should('be.visible');
      cy.contains('Database Status').should('be.visible');
      cy.contains('Healthy').should('be.visible');
    });

    it('should display backup information', () => {
      cy.contains('Backup & Maintenance').should('be.visible');
      cy.contains('Last Backup').should('be.visible');
      cy.contains('Today 2:00 AM').should('be.visible');
    });
  });

  describe('Navigation and UI', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
    });

    it('should navigate between tabs correctly', () => {
      // Test tab navigation
      cy.get('[value="products"]').click();
      cy.contains('Product Management').should('be.visible');
      
      cy.get('[value="users"]').click();
      cy.contains('User Management').should('be.visible');
      
      cy.get('[value="reports"]').click();
      cy.contains('Reporting Dashboard').should('be.visible');
      
      cy.get('[value="settings"]').click();
      cy.contains('System Configuration').should('be.visible');
      
      cy.get('[value="dashboard"]').click();
      cy.contains('Admin Dashboard').should('be.visible');
    });

    it('should show admin status and back button', () => {
      cy.contains('Administrator').should('be.visible');
      cy.contains('System Status: Healthy').should('be.visible');
      cy.contains('Back to App').should('be.visible');
    });

    it('should handle back to app navigation', () => {
      cy.contains('Back to App').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
    });

    it('should handle API errors gracefully', () => {
      cy.intercept('GET', '/api/v1/admin/dashboard', {
        statusCode: 500,
        body: { success: false, message: 'Server error' }
      }).as('getDashboardError');

      cy.visit('/admin');
      cy.wait('@getUserInfo');
      cy.wait('@getDashboardError');
      
      cy.contains('Failed to load dashboard data').should('be.visible');
    });

    it('should handle network errors', () => {
      cy.intercept('GET', '/api/v1/admin/users*', { forceNetworkError: true }).as('getUsersError');

      cy.visit('/admin');
      cy.wait('@getUserInfo');
      
      cy.get('[value="users"]').click();
      cy.wait('@getUsersError');
      
      cy.contains('Failed to load users').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-admin-token');
    });

    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      cy.wait('@getDashboardData');
      
      cy.contains('Admin Panel').should('be.visible');
      cy.get('[value="dashboard"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/admin');
      cy.wait('@getUserInfo');
      cy.wait('@getDashboardData');
      
      cy.contains('Admin Panel').should('be.visible');
      cy.get('[value="products"]').click();
      cy.wait('@getProducts');
      cy.contains('Product Management').should('be.visible');
    });
  });
});