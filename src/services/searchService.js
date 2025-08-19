/**
 * Advanced Search Service
 * Provides full-text search, fuzzy matching, and search analytics
 */

class SearchService {
  constructor() {
    this.searchHistory = this.loadSearchHistory();
    this.popularSearches = new Map();
  }

  /**
   * Perform full-text search across products
   * @param {Array} products - Array of products to search
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Filtered and ranked products
   */
  searchProducts(products, query, options = {}) {
    if (!query || query.trim().length === 0) {
      return products;
    }

    const normalizedQuery = query.toLowerCase().trim();
    this.trackSearch(normalizedQuery);

    const searchTerms = this.extractSearchTerms(normalizedQuery);
    const results = products
      .map(product => ({
        product,
        score: this.calculateRelevanceScore(product, searchTerms, options),
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(result => result.product);

    return results;
  }

  /**
   * Extract search terms from query
   * @param {string} query - Search query
   * @returns {Array} Array of search terms
   */
  extractSearchTerms(query) {
    // Split by spaces and filter out empty strings
    const terms = query.split(/\s+/).filter(term => term.length > 0);

    // Add the full query as a term for exact phrase matching
    if (terms.length > 1) {
      terms.push(query);
    }

    return terms;
  }

  /**
   * Calculate relevance score for a product
   * @param {Object} product - Product to score
   * @param {Array} searchTerms - Search terms
   * @param {Object} options - Search options
   * @returns {number} Relevance score
   */
  calculateRelevanceScore(product, searchTerms, options = {}) {
    let score = 0;
    let hasMatch = false;
    const weights = {
      name: 10,
      brand: 8,
      model: 8,
      tags: 6,
      description: 4,
      serialNumber: 3,
      location: 2,
      specifications: 2,
    };

    // Search in different fields
    searchTerms.forEach(term => {
      // Name matching (highest weight)
      if (product.name && this.matchesField(product.name, term)) {
        score += weights.name * this.getMatchQuality(product.name, term);
        hasMatch = true;
      }

      // Brand matching
      if (product.brand && this.matchesField(product.brand, term)) {
        score += weights.brand * this.getMatchQuality(product.brand, term);
        hasMatch = true;
      }

      // Model matching
      if (product.model && this.matchesField(product.model, term)) {
        score += weights.model * this.getMatchQuality(product.model, term);
        hasMatch = true;
      }

      // Tags matching
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          if (this.matchesField(tag, term)) {
            score += weights.tags * this.getMatchQuality(tag, term);
            hasMatch = true;
          }
        });
      }

      // Description matching
      if (product.description && this.matchesField(product.description, term)) {
        score +=
          weights.description * this.getMatchQuality(product.description, term);
        hasMatch = true;
      }

      // Serial number matching
      if (
        product.serialNumber &&
        this.matchesField(product.serialNumber, term)
      ) {
        score +=
          weights.serialNumber *
          this.getMatchQuality(product.serialNumber, term);
        hasMatch = true;
      }

      // Location matching
      if (product.location && this.matchesField(product.location, term)) {
        score +=
          weights.location * this.getMatchQuality(product.location, term);
        hasMatch = true;
      }

      // Specifications matching
      if (
        product.specifications &&
        typeof product.specifications === 'object'
      ) {
        Object.entries(product.specifications).forEach(([key, value]) => {
          const specText = `${key} ${value}`.toLowerCase();
          if (this.matchesField(specText, term)) {
            score +=
              weights.specifications * this.getMatchQuality(specText, term);
            hasMatch = true;
          }
        });
      }
    });

    // Only return score if there was at least one match
    if (!hasMatch) {
      return 0;
    }

    // Apply availability boost if specified
    if (options.boostAvailable && product.isAvailable) {
      score += 5;
    }

    // Apply condition boost
    const conditionBoost = {
      excellent: 4,
      good: 3,
      fair: 2,
      needs_repair: 1,
    };
    score += conditionBoost[product.conditionStatus] || 0;

    return score;
  }

  /**
   * Check if a field matches a search term
   * @param {string} field - Field value
   * @param {string} term - Search term
   * @returns {boolean} Whether field matches term
   */
  matchesField(field, term) {
    if (!field || !term) return false;

    const normalizedField = field.toLowerCase();
    const normalizedTerm = term.toLowerCase();

    // Exact match
    if (normalizedField.includes(normalizedTerm)) {
      return true;
    }

    // Fuzzy match for typos (simple Levenshtein-based)
    if (term.length > 3) {
      return this.fuzzyMatch(normalizedField, normalizedTerm);
    }

    return false;
  }

  /**
   * Get match quality score
   * @param {string} field - Field value
   * @param {string} term - Search term
   * @returns {number} Match quality (0-1)
   */
  getMatchQuality(field, term) {
    if (!field || !term) return 0;

    const normalizedField = field.toLowerCase();
    const normalizedTerm = term.toLowerCase();

    // Exact match at start of field
    if (normalizedField.startsWith(normalizedTerm)) {
      return 1.0;
    }

    // Exact match anywhere in field
    if (normalizedField.includes(normalizedTerm)) {
      return 0.8;
    }

    // Fuzzy match
    if (this.fuzzyMatch(normalizedField, normalizedTerm)) {
      return 0.6;
    }

    return 0;
  }

  /**
   * Simple fuzzy matching using Levenshtein distance
   * @param {string} field - Field value
   * @param {string} term - Search term
   * @returns {boolean} Whether strings are similar enough
   */
  fuzzyMatch(field, term) {
    // Split field into words and check each word
    const words = field.split(/\s+/);

    return words.some(word => {
      const distance = this.levenshteinDistance(word, term);
      const maxLength = Math.max(word.length, term.length);
      const similarity = 1 - distance / maxLength;

      // Allow up to 20% difference for fuzzy matching
      return similarity >= 0.8;
    });
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get search suggestions based on query
   * @param {Array} products - Array of products
   * @param {string} query - Partial query
   * @param {number} limit - Maximum suggestions
   * @returns {Object} Suggestions object
   */
  getSuggestions(products, query, limit = 5) {
    if (!query || query.length < 2) {
      return {
        products: [],
        brands: [],
        tags: [],
        categories: [],
      };
    }

    const normalizedQuery = query.toLowerCase();
    const suggestions = {
      products: [],
      brands: new Set(),
      tags: new Set(),
      categories: new Set(),
    };

    products.forEach(product => {
      // Product name suggestions
      if (
        product.name &&
        product.name.toLowerCase().includes(normalizedQuery)
      ) {
        if (suggestions.products.length < limit) {
          suggestions.products.push({
            id: product.id,
            name: product.name,
            type: 'product',
          });
        }
      }

      // Brand suggestions
      if (
        product.brand &&
        product.brand.toLowerCase().includes(normalizedQuery)
      ) {
        suggestions.brands.add(product.brand);
      }

      // Tag suggestions
      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => {
          if (tag.toLowerCase().includes(normalizedQuery)) {
            suggestions.tags.add(tag);
          }
        });
      }

      // Category suggestions (if category name is available)
      if (
        product.categoryName &&
        product.categoryName.toLowerCase().includes(normalizedQuery)
      ) {
        suggestions.categories.add(product.categoryName);
      }
    });

    return {
      products: suggestions.products,
      brands: Array.from(suggestions.brands).slice(0, limit),
      tags: Array.from(suggestions.tags).slice(0, limit),
      categories: Array.from(suggestions.categories).slice(0, limit),
    };
  }

  /**
   * Track search query for analytics
   * @param {string} query - Search query
   */
  trackSearch(query) {
    // Update search history
    this.searchHistory.unshift({
      query,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 searches
    this.searchHistory = this.searchHistory.slice(0, 50);
    this.saveSearchHistory();

    // Update popular searches
    const count = this.popularSearches.get(query) || 0;
    this.popularSearches.set(query, count + 1);
  }

  /**
   * Get search analytics
   * @returns {Object} Search analytics data
   */
  getSearchAnalytics() {
    const popularSearches = Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    const recentSearches = this.searchHistory
      .slice(0, 10)
      .map(entry => entry.query);

    return {
      popularSearches,
      recentSearches,
      totalSearches: this.searchHistory.length,
    };
  }

  /**
   * Clear search history
   */
  clearSearchHistory() {
    this.searchHistory = [];
    this.popularSearches.clear();
    this.saveSearchHistory();
  }

  /**
   * Load search history from localStorage
   * @returns {Array} Search history
   */
  loadSearchHistory() {
    try {
      const stored = localStorage.getItem('productSearchHistory');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  /**
   * Save search history to localStorage
   */
  saveSearchHistory() {
    try {
      localStorage.setItem(
        'productSearchHistory',
        JSON.stringify(this.searchHistory)
      );
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  /**
   * Advanced filtering with multiple criteria
   * @param {Array} products - Products to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered products
   */
  applyAdvancedFilters(products, filters) {
    return products.filter(product => {
      // Category filter
      if (filters.categoryId && filters.categoryId !== 'all') {
        if (product.categoryId !== parseInt(filters.categoryId)) {
          return false;
        }
      }

      // Availability filter
      if (filters.availability && filters.availability !== 'all') {
        if (filters.availability === 'available' && !product.isAvailable) {
          return false;
        }
        if (filters.availability === 'unavailable' && product.isAvailable) {
          return false;
        }
      }

      // Condition filter
      if (filters.condition && filters.condition !== 'all') {
        if (product.conditionStatus !== filters.condition) {
          return false;
        }
      }

      // Brand filter
      if (filters.brand && filters.brand.length > 0) {
        if (!product.brand || !filters.brand.includes(product.brand)) {
          return false;
        }
      }

      // Location filter
      if (filters.location && filters.location.trim()) {
        if (
          !product.location ||
          !product.location
            .toLowerCase()
            .includes(filters.location.toLowerCase())
        ) {
          return false;
        }
      }

      // Tags filter (product must have at least one of the specified tags)
      if (filters.tags && filters.tags.length > 0) {
        if (
          !product.tags ||
          !product.tags.some(tag => filters.tags.includes(tag))
        ) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange) {
        const productDate = new Date(product.createdAt || product.purchaseDate);
        if (
          filters.dateRange.start &&
          productDate < new Date(filters.dateRange.start)
        ) {
          return false;
        }
        if (
          filters.dateRange.end &&
          productDate > new Date(filters.dateRange.end)
        ) {
          return false;
        }
      }

      // Lending period filter
      if (filters.maxLendingPeriod) {
        if (product.maxLendingPeriod > filters.maxLendingPeriod) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get filter suggestions based on current products
   * @param {Array} products - Products to analyze
   * @returns {Object} Filter suggestions
   */
  getFilterSuggestions(products) {
    const suggestions = {
      brands: new Set(),
      locations: new Set(),
      tags: new Set(),
      conditions: new Set(),
      lendingPeriods: new Set(),
    };

    products.forEach(product => {
      if (product.brand) suggestions.brands.add(product.brand);
      if (product.location) suggestions.locations.add(product.location);
      if (product.conditionStatus)
        suggestions.conditions.add(product.conditionStatus);
      if (product.maxLendingPeriod)
        suggestions.lendingPeriods.add(product.maxLendingPeriod);

      if (product.tags && Array.isArray(product.tags)) {
        product.tags.forEach(tag => suggestions.tags.add(tag));
      }
    });

    return {
      brands: Array.from(suggestions.brands).sort(),
      locations: Array.from(suggestions.locations).sort(),
      tags: Array.from(suggestions.tags).sort(),
      conditions: Array.from(suggestions.conditions).sort(),
      lendingPeriods: Array.from(suggestions.lendingPeriods).sort(
        (a, b) => a - b
      ),
    };
  }
}

// Create singleton instance
const searchService = new SearchService();

export default searchService;
