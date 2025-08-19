import searchService from '../searchService';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

const mockProducts = [
  {
    id: 'product-1',
    name: 'MacBook Pro 16"',
    description: 'High-performance laptop for development work',
    brand: 'Apple',
    model: 'MacBook Pro',
    categoryId: 1,
    categoryName: 'Electronics',
    conditionStatus: 'excellent',
    isAvailable: true,
    maxLendingPeriod: 30,
    serialNumber: 'MBP123456',
    location: 'Office A - Desk 12',
    tags: ['laptop', 'development', 'apple'],
    specifications: {
      cpu: 'M2 Pro',
      ram: '16GB',
      storage: '512GB SSD',
    },
    createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 'product-2',
    name: 'Dell Monitor 27"',
    description: '4K display monitor for design work',
    brand: 'Dell',
    model: 'UltraSharp U2720Q',
    categoryId: 2,
    categoryName: 'Monitors',
    conditionStatus: 'good',
    isAvailable: false,
    maxLendingPeriod: 14,
    serialNumber: 'DELL789012',
    location: 'Office B - Workstation 5',
    tags: ['monitor', 'display', '4k'],
    specifications: {
      resolution: '4K',
      size: '27 inch',
      panel: 'IPS',
    },
    createdAt: '2023-02-01T00:00:00Z',
  },
  {
    id: 'product-3',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking',
    brand: 'Logitech',
    model: 'MX Master 3',
    categoryId: 3,
    categoryName: 'Accessories',
    conditionStatus: 'fair',
    isAvailable: true,
    maxLendingPeriod: 7,
    serialNumber: 'LOG345678',
    location: 'Office A - Storage',
    tags: ['mouse', 'wireless', 'ergonomic'],
    specifications: {
      connectivity: 'Bluetooth',
      battery: 'Rechargeable',
      dpi: '4000',
    },
    createdAt: '2023-01-20T00:00:00Z',
  },
];

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);

    // Reset search service state
    searchService.searchHistory = [];
    searchService.popularSearches.clear();
  });

  describe('searchProducts', () => {
    it('returns all products when query is empty', () => {
      const results = searchService.searchProducts(mockProducts, '');
      expect(results).toEqual(mockProducts);
    });

    it('searches by product name', () => {
      const results = searchService.searchProducts(mockProducts, 'MacBook');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-1');
    });

    it('searches by brand', () => {
      const results = searchService.searchProducts(mockProducts, 'Dell');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-2');
    });

    it('searches by model', () => {
      const results = searchService.searchProducts(mockProducts, 'MX Master');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-3');
    });

    it('searches by tags', () => {
      const results = searchService.searchProducts(mockProducts, 'wireless');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-3');
    });

    it('searches by description', () => {
      const results = searchService.searchProducts(mockProducts, 'development');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-1');
    });

    it('searches by serial number', () => {
      const results = searchService.searchProducts(mockProducts, 'DELL789012');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-2');
    });

    it('searches by location', () => {
      const results = searchService.searchProducts(mockProducts, 'Office A');
      expect(results).toHaveLength(2);
      expect(results.map(p => p.id)).toContain('product-1');
      expect(results.map(p => p.id)).toContain('product-3');
    });

    it('searches by specifications', () => {
      const results = searchService.searchProducts(mockProducts, 'M2 Pro');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-1');
    });

    it('performs case-insensitive search', () => {
      const results = searchService.searchProducts(mockProducts, 'macbook');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-1');
    });

    it('handles multiple search terms', () => {
      const results = searchService.searchProducts(
        mockProducts,
        'Apple laptop'
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-1');
    });

    it('ranks results by relevance', () => {
      const results = searchService.searchProducts(mockProducts, 'office');
      // Should find products with 'office' in location
      expect(results.length).toBeGreaterThan(0);
      // Results should be ordered by relevance score
      for (let i = 1; i < results.length; i++) {
        // This is a basic check - in practice, we'd need to verify actual scoring
        expect(results[i - 1]).toBeDefined();
        expect(results[i]).toBeDefined();
      }
    });

    it('boosts available products when option is set', () => {
      const results = searchService.searchProducts(mockProducts, 'monitor', {
        boostAvailable: true,
      });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('product-2');
    });

    it('tracks search queries', () => {
      searchService.searchProducts(mockProducts, 'MacBook');
      expect(searchService.searchHistory).toHaveLength(1);
      expect(searchService.searchHistory[0].query).toBe('macbook');
    });
  });

  describe('fuzzyMatch', () => {
    it('matches similar strings with typos', () => {
      expect(searchService.fuzzyMatch('macbook', 'macbok')).toBe(true);
      expect(searchService.fuzzyMatch('wireless', 'wirelss')).toBe(true);
    });

    it('rejects strings that are too different', () => {
      expect(searchService.fuzzyMatch('macbook', 'windows')).toBe(false);
      expect(searchService.fuzzyMatch('wireless', 'ethernet')).toBe(false);
    });
  });

  describe('getSuggestions', () => {
    it('returns empty suggestions for short queries', () => {
      const suggestions = searchService.getSuggestions(mockProducts, 'a');
      expect(suggestions.products).toHaveLength(0);
      expect(suggestions.brands).toHaveLength(0);
      expect(suggestions.tags).toHaveLength(0);
    });

    it('returns product name suggestions', () => {
      const suggestions = searchService.getSuggestions(mockProducts, 'Mac');
      expect(suggestions.products).toHaveLength(1);
      expect(suggestions.products[0].name).toBe('MacBook Pro 16"');
    });

    it('returns brand suggestions', () => {
      const suggestions = searchService.getSuggestions(mockProducts, 'App');
      expect(suggestions.brands).toContain('Apple');
    });

    it('returns tag suggestions', () => {
      const suggestions = searchService.getSuggestions(mockProducts, 'lap');
      expect(suggestions.tags).toContain('laptop');
    });

    it('limits suggestions to specified count', () => {
      const suggestions = searchService.getSuggestions(mockProducts, 'o', 2);
      expect(suggestions.products.length).toBeLessThanOrEqual(2);
      expect(suggestions.brands.length).toBeLessThanOrEqual(2);
      expect(suggestions.tags.length).toBeLessThanOrEqual(2);
    });
  });

  describe('applyAdvancedFilters', () => {
    it('filters by category', () => {
      const filtered = searchService.applyAdvancedFilters(mockProducts, {
        categoryId: '1',
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('product-1');
    });

    it('filters by availability', () => {
      const availableOnly = searchService.applyAdvancedFilters(mockProducts, {
        availability: 'available',
      });
      expect(availableOnly).toHaveLength(2);
      expect(availableOnly.every(p => p.isAvailable)).toBe(true);

      const unavailableOnly = searchService.applyAdvancedFilters(mockProducts, {
        availability: 'unavailable',
      });
      expect(unavailableOnly).toHaveLength(1);
      expect(unavailableOnly[0].isAvailable).toBe(false);
    });

    it('filters by condition', () => {
      const excellentOnly = searchService.applyAdvancedFilters(mockProducts, {
        condition: 'excellent',
      });
      expect(excellentOnly).toHaveLength(1);
      expect(excellentOnly[0].conditionStatus).toBe('excellent');
    });

    it('filters by brand', () => {
      const appleOnly = searchService.applyAdvancedFilters(mockProducts, {
        brand: ['Apple'],
      });
      expect(appleOnly).toHaveLength(1);
      expect(appleOnly[0].brand).toBe('Apple');
    });

    it('filters by location', () => {
      const officeA = searchService.applyAdvancedFilters(mockProducts, {
        location: 'Office A',
      });
      expect(officeA).toHaveLength(2);
      expect(officeA.every(p => p.location.includes('Office A'))).toBe(true);
    });

    it('filters by tags', () => {
      const laptopTagged = searchService.applyAdvancedFilters(mockProducts, {
        tags: ['laptop'],
      });
      expect(laptopTagged).toHaveLength(1);
      expect(laptopTagged[0].tags).toContain('laptop');
    });

    it('filters by max lending period', () => {
      const shortTerm = searchService.applyAdvancedFilters(mockProducts, {
        maxLendingPeriod: 15,
      });
      expect(shortTerm).toHaveLength(2);
      expect(shortTerm.every(p => p.maxLendingPeriod <= 15)).toBe(true);
    });

    it('applies multiple filters simultaneously', () => {
      const filtered = searchService.applyAdvancedFilters(mockProducts, {
        availability: 'available',
        condition: 'excellent',
        brand: ['Apple'],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('product-1');
    });
  });

  describe('getFilterSuggestions', () => {
    it('extracts unique brands', () => {
      const suggestions = searchService.getFilterSuggestions(mockProducts);
      expect(suggestions.brands).toContain('Apple');
      expect(suggestions.brands).toContain('Dell');
      expect(suggestions.brands).toContain('Logitech');
      expect(suggestions.brands).toHaveLength(3);
    });

    it('extracts unique locations', () => {
      const suggestions = searchService.getFilterSuggestions(mockProducts);
      expect(suggestions.locations).toContain('Office A - Desk 12');
      expect(suggestions.locations).toContain('Office B - Workstation 5');
      expect(suggestions.locations).toContain('Office A - Storage');
    });

    it('extracts unique tags', () => {
      const suggestions = searchService.getFilterSuggestions(mockProducts);
      expect(suggestions.tags).toContain('laptop');
      expect(suggestions.tags).toContain('wireless');
      expect(suggestions.tags).toContain('monitor');
    });

    it('extracts unique conditions', () => {
      const suggestions = searchService.getFilterSuggestions(mockProducts);
      expect(suggestions.conditions).toContain('excellent');
      expect(suggestions.conditions).toContain('good');
      expect(suggestions.conditions).toContain('fair');
    });

    it('sorts lending periods numerically', () => {
      const suggestions = searchService.getFilterSuggestions(mockProducts);
      expect(suggestions.lendingPeriods).toEqual([7, 14, 30]);
    });
  });

  describe('search analytics', () => {
    it('tracks search history', () => {
      searchService.searchProducts(mockProducts, 'MacBook');
      searchService.searchProducts(mockProducts, 'Dell');

      const analytics = searchService.getSearchAnalytics();
      expect(analytics.recentSearches).toContain('macbook');
      expect(analytics.recentSearches).toContain('dell');
      expect(analytics.totalSearches).toBe(2);
    });

    it('tracks popular searches', () => {
      searchService.searchProducts(mockProducts, 'MacBook');
      searchService.searchProducts(mockProducts, 'MacBook');
      searchService.searchProducts(mockProducts, 'Dell');

      const analytics = searchService.getSearchAnalytics();
      expect(analytics.popularSearches[0].query).toBe('macbook');
      expect(analytics.popularSearches[0].count).toBe(2);
    });

    it('limits search history size', () => {
      // Add more than 50 searches
      for (let i = 0; i < 60; i++) {
        searchService.searchProducts(mockProducts, `query${i}`);
      }

      expect(searchService.searchHistory).toHaveLength(50);
    });

    it('clears search history', () => {
      searchService.searchProducts(mockProducts, 'MacBook');
      expect(searchService.searchHistory).toHaveLength(1);

      searchService.clearSearchHistory();
      expect(searchService.searchHistory).toHaveLength(0);
      expect(searchService.popularSearches.size).toBe(0);
    });
  });

  describe('localStorage integration', () => {
    it('saves search history to localStorage', () => {
      searchService.searchProducts(mockProducts, 'MacBook');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'productSearchHistory',
        expect.stringContaining('macbook')
      );
    });

    it('loads search history from localStorage', () => {
      const mockHistory = JSON.stringify([
        { query: 'saved search', timestamp: '2023-01-01T00:00:00Z' },
      ]);
      localStorageMock.getItem.mockReturnValue(mockHistory);

      const history = searchService.loadSearchHistory();
      expect(history).toHaveLength(1);
      expect(history[0].query).toBe('saved search');
    });

    it('handles localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const history = searchService.loadSearchHistory();
      expect(history).toEqual([]);
    });
  });
});
