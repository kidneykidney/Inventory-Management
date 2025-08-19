/**
 * Application configuration settings
 * Contains environment variables and other configuration
 */
module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'inventory_management',
    port: process.env.DB_PORT || 3306,
  },

  // JWT configuration for authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'inventory-management-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // API configuration
  api: {
    prefix: '/api',
    version: '/v1',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
};
