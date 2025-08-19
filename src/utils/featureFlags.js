import { logger } from './logger';

/**
 * Feature flag configuration
 * Controls which features are enabled/disabled
 */
const FEATURE_FLAGS = {
  // Lending system features
  LENDING_SYSTEM: {
    enabled: true,
    description: 'Modern lending system with Shadcn UI',
    rolloutPercentage: 100,
  },

  // Advanced search features
  ADVANCED_SEARCH: {
    enabled: true,
    description: 'Enhanced search with filters and tags',
    rolloutPercentage: 100,
  },

  // Email notifications
  EMAIL_NOTIFICATIONS: {
    enabled: false,
    description: 'Automated email reminders for lending',
    rolloutPercentage: 0,
  },

  // Analytics dashboard
  ANALYTICS_DASHBOARD: {
    enabled: false,
    description: 'Lending analytics and reporting',
    rolloutPercentage: 0,
  },

  // Admin panel features
  ADMIN_PANEL: {
    enabled: false,
    description: 'Administrative management interface',
    rolloutPercentage: 0,
  },
};

/**
 * Check if a feature flag is enabled
 * @param {string} flagName - Name of the feature flag
 * @param {string} userId - User ID for percentage-based rollout (optional)
 * @returns {boolean} Whether the feature is enabled
 */
export const isFeatureEnabled = (flagName, userId = null) => {
  const flag = FEATURE_FLAGS[flagName];

  if (!flag) {
    logger.warn(`Feature flag '${flagName}' not found`);
    return false;
  }

  if (!flag.enabled) {
    return false;
  }

  // If rollout percentage is 100%, always enable
  if (flag.rolloutPercentage >= 100) {
    return true;
  }

  // If rollout percentage is 0%, always disable
  if (flag.rolloutPercentage <= 0) {
    return false;
  }

  // For percentage-based rollout, use user ID hash
  if (userId) {
    const hash = simpleHash(userId);
    const userPercentage = hash % 100;
    return userPercentage < flag.rolloutPercentage;
  }

  // Default to enabled if no user ID provided and percentage > 0
  return true;
};

/**
 * Get all enabled feature flags
 * @param {string} userId - User ID for percentage-based rollout (optional)
 * @returns {Object} Object with feature names as keys and boolean values
 */
export const getEnabledFeatures = (userId = null) => {
  const enabledFeatures = {};

  Object.keys(FEATURE_FLAGS).forEach(flagName => {
    enabledFeatures[flagName] = isFeatureEnabled(flagName, userId);
  });

  return enabledFeatures;
};

/**
 * Get feature flag configuration
 * @param {string} flagName - Name of the feature flag
 * @returns {Object|null} Feature flag configuration or null if not found
 */
export const getFeatureConfig = flagName => {
  return FEATURE_FLAGS[flagName] || null;
};

/**
 * Update feature flag (for admin use)
 * @param {string} flagName - Name of the feature flag
 * @param {Object} config - New configuration
 */
export const updateFeatureFlag = (flagName, config) => {
  if (FEATURE_FLAGS[flagName]) {
    FEATURE_FLAGS[flagName] = { ...FEATURE_FLAGS[flagName], ...config };
    logger.info(`Feature flag '${flagName}' updated`, config);
  } else {
    logger.warn(`Cannot update non-existent feature flag '${flagName}'`);
  }
};

/**
 * Simple hash function for consistent user-based rollout
 * @param {string} str - String to hash
 * @returns {number} Hash value
 */
const simpleHash = str => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
};

/**
 * Feature flag hook for React components
 * @param {string} flagName - Name of the feature flag
 * @param {string} userId - User ID for percentage-based rollout (optional)
 * @returns {boolean} Whether the feature is enabled
 */
export const useFeatureFlag = (flagName, userId = null) => {
  return isFeatureEnabled(flagName, userId);
};

// Export feature flag names as constants
export const FEATURES = {
  LENDING_SYSTEM: 'LENDING_SYSTEM',
  ADVANCED_SEARCH: 'ADVANCED_SEARCH',
  EMAIL_NOTIFICATIONS: 'EMAIL_NOTIFICATIONS',
  ANALYTICS_DASHBOARD: 'ANALYTICS_DASHBOARD',
  ADMIN_PANEL: 'ADMIN_PANEL',
};
