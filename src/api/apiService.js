import axios from 'axios';
import { logger } from '../utils/logger';

/**
 * Base API configuration
 * Configures axios for API calls with error handling
 */
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const TOKEN_KEY = 'inventory_auth_token';

/**
 * Configure axios instance for API calls
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  timeoutErrorMessage: 'Server request timed out. Please try again.',
});

/**
 * Add request interceptor to include authentication token
 */
apiClient.interceptors.request.use(
  config => {
    // Add auth token to headers if available
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    logger.debug('API Request:', {
      url: config.url,
      method: config.method,
      params: config.params,
    });

    return config;
  },
  error => {
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Add response interceptor for error handling
 */
apiClient.interceptors.response.use(
  response => {
    logger.debug('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  error => {
    if (error.response) {
      // Handle authentication errors
      if (error.response.status === 401) {
        logger.warn('Authentication error, logging out user');
        localStorage.removeItem(TOKEN_KEY);
        window.location.reload();
      }

      logger.error('API Error Response:', {
        url: error.config.url,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      logger.error('API No Response:', { request: error.request });
    } else {
      logger.error('API Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Authentication API endpoints
 */
const authAPI = {
  /**
   * Login user
   * @param {Object} credentials - User credentials
   * @returns {Promise} - API response
   */
  login: async credentials => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      return response.data;
    } catch (error) {
      logger.error('Login API Error:', error);
      throw error;
    }
  },

  /**
   * Register new user
   * @param {Object} userData - New user data
   * @returns {Promise} - API response
   */
  register: async userData => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      logger.error('Register API Error:', error);
      throw error;
    }
  },

  /**
   * Get current user data
   * @returns {Promise} - API response with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/user');
      return response.data;
    } catch (error) {
      logger.error('Get Current User API Error:', error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    logger.info('User logged out');
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - Authentication status
   */
  isAuthenticated: () => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

/**
 * Inventory API endpoints
 */
const inventoryAPI = {
  /**
   * Get all inventory items
   * @returns {Promise} - API response with inventory items
   */
  getItems: async () => {
    try {
      const response = await apiClient.get('/inventory');
      return response.data;
    } catch (error) {
      logger.error('Get Inventory Items API Error:', error);
      throw error;
    }
  },

  /**
   * Get a single inventory item
   * @param {number} id - Item ID
   * @returns {Promise} - API response with inventory item
   */
  getItem: async id => {
    try {
      const response = await apiClient.get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Get Inventory Item API Error (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Create new inventory item
   * @param {Object} itemData - New item data
   * @returns {Promise} - API response with created item
   */
  createItem: async itemData => {
    try {
      const response = await apiClient.post('/inventory', itemData);
      return response.data;
    } catch (error) {
      logger.error('Create Inventory Item API Error:', error);
      throw error;
    }
  },

  /**
   * Update inventory item
   * @param {number} id - Item ID
   * @param {Object} itemData - Updated item data
   * @returns {Promise} - API response with updated item
   */
  updateItem: async (id, itemData) => {
    try {
      const response = await apiClient.put(`/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      logger.error(`Update Inventory Item API Error (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Delete inventory item
   * @param {number} id - Item ID
   * @returns {Promise} - API response
   */
  deleteItem: async id => {
    try {
      const response = await apiClient.delete(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Delete Inventory Item API Error (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Process inventory transaction (lend/give)
   * @param {number} id - Item ID
   * @param {Object} transactionData - Transaction details
   * @returns {Promise} - API response
   */
  processTransaction: async (id, transactionData) => {
    try {
      const response = await apiClient.post(
        `/inventory/${id}/transaction`,
        transactionData
      );
      return response.data;
    } catch (error) {
      logger.error(
        `Process Inventory Transaction API Error (ID: ${id}):`,
        error
      );
      throw error;
    }
  },
};

/**
 * Products API endpoints
 */
const productsAPI = {
  /**
   * Get all products
   * @returns {Promise} - API response with products
   */
  getProducts: async () => {
    try {
      const response = await apiClient.get('/products');
      return response.data;
    } catch (error) {
      logger.error('Get Products API Error:', error);
      throw error;
    }
  },

  /**
   * Get a single product
   * @param {number} id - Product ID
   * @returns {Promise} - API response with product
   */
  getProduct: async id => {
    try {
      const response = await apiClient.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Get Product API Error (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Create new product
   * @param {Object} productData - New product data
   * @returns {Promise} - API response with created product
   */
  createProduct: async productData => {
    try {
      const response = await apiClient.post('/products', productData);
      return response.data;
    } catch (error) {
      logger.error('Create Product API Error:', error);
      throw error;
    }
  },

  /**
   * Update product
   * @param {number} id - Product ID
   * @param {Object} productData - Updated product data
   * @returns {Promise} - API response with updated product
   */
  updateProduct: async (id, productData) => {
    try {
      const response = await apiClient.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      logger.error(`Update Product API Error (ID: ${id}):`, error);
      throw error;
    }
  },

  /**
   * Delete product
   * @param {number} id - Product ID
   * @returns {Promise} - API response
   */
  deleteProduct: async id => {
    try {
      const response = await apiClient.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      logger.error(`Delete Product API Error (ID: ${id}):`, error);
      throw error;
    }
  },
};

/**
 * User profile API endpoints
 */
const profileAPI = {
  /**
   * Get user profile
   * @returns {Promise} - API response with user profile
   */
  getProfile: async () => {
    try {
      const response = await apiClient.get('/users/profile');
      return response.data;
    } catch (error) {
      logger.error('Get Profile API Error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} - API response with updated profile
   */
  updateProfile: async profileData => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      return response.data;
    } catch (error) {
      logger.error('Update Profile API Error:', error);
      throw error;
    }
  },
};

/**
 * Progress Tracking API endpoints
 */
const progressAPI = {
  /**
   * Get sprint velocity data
   * @returns {Promise} - API response with velocity data
   */
  getVelocityData: async () => {
    try {
      const response = await apiClient.get('/sprints/velocity');
      return response.data;
    } catch (error) {
      logger.error('Get Velocity Data API Error:', error);
      throw error;
    }
  },

  /**
   * Get sprint burnup data
   * @param {string} sprintId - Sprint ID
   * @returns {Promise} - API response with burnup data
   */
  getBurnupData: async (sprintId) => {
    try {
      const response = await apiClient.get(`/sprints/${sprintId}/burnup`);
      return response.data;
    } catch (error) {
      logger.error(`Get Burnup Data API Error (Sprint: ${sprintId}):`, error);
      throw error;
    }
  },

  /**
   * Get team capacity data
   * @param {string} sprintId - Sprint ID
   * @returns {Promise} - API response with team capacity data
   */
  getTeamCapacity: async (sprintId) => {
    try {
      const response = await apiClient.get(`/sprints/${sprintId}/capacity`);
      return response.data;
    } catch (error) {
      logger.error(`Get Team Capacity API Error (Sprint: ${sprintId}):`, error);
      throw error;
    }
  },

  /**
   * Get progress metrics
   * @param {string} sprintId - Sprint ID
   * @returns {Promise} - API response with progress metrics
   */
  getProgressMetrics: async (sprintId) => {
    try {
      const response = await apiClient.get(`/sprints/${sprintId}/metrics`);
      return response.data;
    } catch (error) {
      logger.error(`Get Progress Metrics API Error (Sprint: ${sprintId}):`, error);
      throw error;
    }
  },

  /**
   * Get real-time dashboard data
   * @returns {Promise} - API response with dashboard data
   */
  getDashboardData: async () => {
    try {
      const response = await apiClient.get('/progress/dashboard');
      return response.data;
    } catch (error) {
      logger.error('Get Dashboard Data API Error:', error);
      throw error;
    }
  },
};

// Export all API services
export const apiService = {
  auth: authAPI,
  inventory: inventoryAPI,
  products: productsAPI,
  profile: profileAPI,
  progress: progressAPI,
  // Direct access methods for backward compatibility
  get: (url) => apiClient.get(url),
  post: (url, data) => apiClient.post(url, data),
  put: (url, data) => apiClient.put(url, data),
  delete: (url) => apiClient.delete(url),
};
