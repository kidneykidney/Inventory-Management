describe('Advanced Search Interface', () => {
  beforeEach(() => {
    // Visit the lending system page with search interface
    cy.visit('/lending-system');
    
    // Wait for the page to load
    cy.get('[data-testid="modern-search-interface"]', { timeout: 10000 }).should('be.visible');
  });

  describe('Search Functionality', () => {
    it('should perform basic text search', () => {
      // Type in search query
      cy.get('[data-testid="search-input"]').type('laptop');
      
      // Click search button or press enter
      cy.get('[data-testid="search-button"]').click();
      
      // Verify search results are displayed
      cy.get('[data-testid="search-results"]').should('be.visible');
      cy.get('[data-testid="search-results-count"]').should('contain', 'results');
      
      // Verify search query is highlighted in results
      cy.get('[data-testid="search-query-display"]').should('contain', 'laptop');
    });

    it('should show auto-complete suggestions', () => {
      // Type partial search query
      cy.get('[data-testid="search-input"]').type('lap');
      
      // Wait for suggestions to appear
      cy.get('[data-testid="search-suggestions"]', { timeout: 5000 }).should('be.visible');
      
      // Verify different types of suggestions
      cy.get('[data-testid="product-suggestions"]').should('exist');
      cy.get('[data-testid="brand-suggestions"]').should('exist');
      cy.get('[data-testid="tag-suggestions"]').should('exist');
      
      // Click on a suggestion
      cy.get('[data-testid="suggestion-item"]').first().click();
      
      // Verify search is performed with selected suggestion
      cy.get('[data-testid="search-results"]').should('be.visible');
    });

    it('should handle keyboard navigation in suggestions', () => {
      // Type search query
      cy.get('[data-testid="search-input"]').type('computer');
      
      // Wait for suggestions
      cy.get('[data-testid="search-suggestions"]').should('be.visible');
      
      // Use arrow keys to navigate
      cy.get('[data-testid="search-input"]').type('{downarrow}');
      cy.get('[data-testid="suggestion-item"].selected').should('exist');
      
      // Navigate down more
      cy.get('[data-testid="search-input"]').type('{downarrow}');
      
      // Select with Enter
      cy.get('[data-testid="search-input"]').type('{enter}');
      
      // Verify search is performed
      cy.get('[data-testid="search-results"]').should('be.visible');
    });

    it('should clear search results', () => {
      // Perform a search
      cy.get('[data-testid="search-input"]').type('mouse');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify results are shown
      cy.get('[data-testid="search-results"]').should('be.visible');
      
      // Clear search
      cy.get('[data-testid="clear-search-button"]').click();
      
      // Verify search is cleared
      cy.get('[data-testid="search-input"]').should('have.value', '');
      cy.get('[data-testid="search-results"]').should('not.contain', 'mouse');
    });
  });

  describe('Advanced Filtering', () => {
    it('should open and close filter sidebar', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Verify sidebar is visible
      cy.get('[data-testid="filter-sidebar"]').should('be.visible');
      
      // Close filters
      cy.get('[data-testid="close-filters-button"]').click();
      
      // Verify sidebar is hidden
      cy.get('[data-testid="filter-sidebar"]').should('not.be.visible');
    });

    it('should filter by category', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Expand category section
      cy.get('[data-testid="category-filter-section"]').click();
      
      // Select electronics category
      cy.get('[data-testid="category-electronics"]').click();
      
      // Verify filter is applied
      cy.get('[data-testid="active-filters"]').should('contain', 'electronics');
      cy.get('[data-testid="search-results"]').should('be.visible');
    });

    it('should filter by availability', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Select available items only
      cy.get('[data-testid="availability-available"]').click();
      
      // Verify filter is applied
      cy.get('[data-testid="active-filters"]').should('contain', 'Available');
      
      // Verify all results show available items
      cy.get('[data-testid="product-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="availability-badge"]').should('contain', 'Available');
      });
    });

    it('should filter by multiple criteria', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Apply category filter
      cy.get('[data-testid="category-electronics"]').click();
      
      // Apply availability filter
      cy.get('[data-testid="availability-available"]').click();
      
      // Apply condition filter
      cy.get('[data-testid="condition-excellent"]').click();
      
      // Verify multiple filters are active
      cy.get('[data-testid="active-filters"]').should('contain', 'electronics');
      cy.get('[data-testid="active-filters"]').should('contain', 'Available');
      cy.get('[data-testid="active-filters"]').should('contain', 'Excellent');
      
      // Verify filter count
      cy.get('[data-testid="filter-count-badge"]').should('contain', '3');
    });

    it('should clear individual filters', () => {
      // Apply multiple filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      cy.get('[data-testid="category-electronics"]').click();
      cy.get('[data-testid="availability-available"]').click();
      
      // Remove one filter
      cy.get('[data-testid="active-filters"]').find('[data-testid="remove-filter-electronics"]').click();
      
      // Verify filter is removed
      cy.get('[data-testid="active-filters"]').should('not.contain', 'electronics');
      cy.get('[data-testid="active-filters"]').should('contain', 'Available');
    });

    it('should clear all filters', () => {
      // Apply multiple filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      cy.get('[data-testid="category-electronics"]').click();
      cy.get('[data-testid="availability-available"]').click();
      
      // Clear all filters
      cy.get('[data-testid="clear-all-filters-button"]').click();
      
      // Verify all filters are cleared
      cy.get('[data-testid="active-filters"]').should('not.exist');
      cy.get('[data-testid="filter-count-badge"]').should('not.exist');
    });

    it('should filter by tags', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Expand tags section
      cy.get('[data-testid="tags-filter-section"]').click();
      
      // Select a tag
      cy.get('[data-testid="tag-filter-item"]').first().click();
      
      // Verify tag filter is applied
      cy.get('[data-testid="active-filters"]').should('contain', 'tags:');
    });

    it('should filter by location', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Expand location section
      cy.get('[data-testid="location-filter-section"]').click();
      
      // Type location
      cy.get('[data-testid="location-filter-input"]').type('Office A');
      
      // Verify location filter is applied
      cy.get('[data-testid="active-filters"]').should('contain', 'Office A');
    });

    it('should filter by date range', () => {
      // Open filters
      cy.get('[data-testid="toggle-filters-button"]').click();
      
      // Expand date range section
      cy.get('[data-testid="date-range-filter-section"]').click();
      
      // Set start date
      cy.get('[data-testid="date-range-start"]').type('2024-01-01');
      
      // Set end date
      cy.get('[data-testid="date-range-end"]').type('2024-12-31');
      
      // Verify date range filter is applied
      cy.get('[data-testid="active-filters"]').should('contain', 'dateRange:');
    });
  });

  describe('Search Results Display', () => {
    beforeEach(() => {
      // Perform a search to get results
      cy.get('[data-testid="search-input"]').type('computer');
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid="search-results"]').should('be.visible');
    });

    it('should switch between grid and list view', () => {
      // Verify grid view is default
      cy.get('[data-testid="grid-view-button"]').should('have.class', 'active');
      cy.get('[data-testid="results-grid"]').should('be.visible');
      
      // Switch to list view
      cy.get('[data-testid="list-view-button"]').click();
      
      // Verify list view is active
      cy.get('[data-testid="list-view-button"]').should('have.class', 'active');
      cy.get('[data-testid="results-list"]').should('be.visible');
      
      // Switch back to grid view
      cy.get('[data-testid="grid-view-button"]').click();
      cy.get('[data-testid="results-grid"]').should('be.visible');
    });

    it('should sort search results', () => {
      // Sort by name
      cy.get('[data-testid="sort-by-name"]').click();
      
      // Verify sorting is applied
      cy.get('[data-testid="sort-by-name"]').should('have.class', 'active');
      
      // Sort by date
      cy.get('[data-testid="sort-by-date"]').click();
      cy.get('[data-testid="sort-by-date"]').should('have.class', 'active');
      
      // Toggle sort order
      cy.get('[data-testid="sort-by-date"]').click();
      cy.get('[data-testid="sort-order-desc"]').should('be.visible');
    });

    it('should paginate search results', () => {
      // Verify pagination is visible if needed
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="pagination"]').length > 0) {
          // Go to next page
          cy.get('[data-testid="next-page-button"]').click();
          
          // Verify page changed
          cy.get('[data-testid="current-page"]').should('contain', '2');
          
          // Go to previous page
          cy.get('[data-testid="prev-page-button"]').click();
          cy.get('[data-testid="current-page"]').should('contain', '1');
        }
      });
    });

    it('should change items per page', () => {
      // Change items per page
      cy.get('[data-testid="items-per-page-select"]').select('24');
      
      // Verify more items are shown
      cy.get('[data-testid="results-count"]').should('contain', '24');
    });

    it('should display product details on click', () => {
      // Click on first product
      cy.get('[data-testid="product-card"]').first().click();
      
      // Verify product detail modal opens
      cy.get('[data-testid="product-detail-modal"]').should('be.visible');
      
      // Close modal
      cy.get('[data-testid="close-modal-button"]').click();
      cy.get('[data-testid="product-detail-modal"]').should('not.be.visible');
    });
  });

  describe('Search History and Saved Searches', () => {
    it('should show search history', () => {
      // Perform a search
      cy.get('[data-testid="search-input"]').type('keyboard');
      cy.get('[data-testid="search-button"]').click();
      
      // Open history
      cy.get('[data-testid="history-button"]').click();
      
      // Verify history sidebar is visible
      cy.get('[data-testid="search-history-sidebar"]').should('be.visible');
      
      // Verify recent search appears
      cy.get('[data-testid="recent-searches"]').should('contain', 'keyboard');
    });

    it('should save a search', () => {
      // Perform a search
      cy.get('[data-testid="search-input"]').type('monitor');
      cy.get('[data-testid="search-button"]').click();
      
      // Open history
      cy.get('[data-testid="history-button"]').click();
      
      // Save the search
      cy.get('[data-testid="save-search-button"]').click();
      
      // Enter search name
      cy.get('[data-testid="search-name-input"]').type('Monitor Search');
      cy.get('[data-testid="confirm-save-button"]').click();
      
      // Verify search is saved
      cy.get('[data-testid="saved-searches"]').should('contain', 'Monitor Search');
    });

    it('should use saved search', () => {
      // Assuming we have a saved search, open history
      cy.get('[data-testid="history-button"]').click();
      
      // Click on saved search
      cy.get('[data-testid="saved-search-item"]').first().click();
      
      // Verify search is performed
      cy.get('[data-testid="search-results"]').should('be.visible');
      cy.get('[data-testid="search-history-sidebar"]').should('not.be.visible');
    });

    it('should delete saved search', () => {
      // Open history
      cy.get('[data-testid="history-button"]').click();
      
      // Delete a saved search
      cy.get('[data-testid="delete-saved-search"]').first().click();
      
      // Confirm deletion
      cy.get('[data-testid="confirm-delete-button"]').click();
      
      // Verify search is removed
      cy.get('[data-testid="saved-searches"]').should('not.contain', 'deleted search');
    });

    it('should clear search history', () => {
      // Open history
      cy.get('[data-testid="history-button"]').click();
      
      // Clear history
      cy.get('[data-testid="clear-history-button"]').click();
      
      // Confirm clearing
      cy.get('[data-testid="confirm-clear-button"]').click();
      
      // Verify history is cleared
      cy.get('[data-testid="recent-searches"]').should('be.empty');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Set mobile viewport
      cy.viewport('iphone-x');
    });

    it('should show mobile-friendly interface', () => {
      // Verify mobile header is visible
      cy.get('[data-testid="mobile-header"]').should('be.visible');
      
      // Verify desktop elements are hidden
      cy.get('[data-testid="desktop-sidebar"]').should('not.be.visible');
    });

    it('should open filters in mobile overlay', () => {
      // Open filters on mobile
      cy.get('[data-testid="mobile-filters-button"]').click();
      
      // Verify overlay is visible
      cy.get('[data-testid="mobile-filter-overlay"]').should('be.visible');
      
      // Close overlay by clicking outside
      cy.get('[data-testid="overlay-backdrop"]').click({ force: true });
      cy.get('[data-testid="mobile-filter-overlay"]').should('not.be.visible');
    });

    it('should open history in mobile overlay', () => {
      // Open history on mobile
      cy.get('[data-testid="mobile-history-button"]').click();
      
      // Verify overlay is visible
      cy.get('[data-testid="mobile-history-overlay"]').should('be.visible');
      
      // Close overlay
      cy.get('[data-testid="close-history-button"]').click();
      cy.get('[data-testid="mobile-history-overlay"]').should('not.be.visible');
    });
  });

  describe('Export and Share Functionality', () => {
    beforeEach(() => {
      // Perform a search to get results
      cy.get('[data-testid="search-input"]').type('laptop');
      cy.get('[data-testid="search-button"]').click();
      cy.get('[data-testid="search-results"]').should('be.visible');
    });

    it('should export search results', () => {
      // Click export button
      cy.get('[data-testid="export-results-button"]').click();
      
      // Verify download is triggered (check downloads folder or mock)
      cy.readFile('cypress/downloads/search-results-*.json').should('exist');
    });

    it('should share search results', () => {
      // Mock navigator.share
      cy.window().then((win) => {
        cy.stub(win.navigator, 'share').resolves();
      });
      
      // Click share button
      cy.get('[data-testid="share-results-button"]').click();
      
      // Verify share was called
      cy.window().its('navigator.share').should('have.been.called');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should be accessible', () => {
      // Check for accessibility violations
      cy.injectAxe();
      cy.checkA11y();
    });

    it('should handle large result sets efficiently', () => {
      // Perform a broad search that returns many results
      cy.get('[data-testid="search-input"]').type('a');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify results load within reasonable time
      cy.get('[data-testid="search-results"]', { timeout: 5000 }).should('be.visible');
      
      // Verify pagination is used for large result sets
      cy.get('[data-testid="pagination"]').should('be.visible');
    });

    it('should debounce search input', () => {
      // Type rapidly
      cy.get('[data-testid="search-input"]').type('test', { delay: 50 });
      
      // Verify search is not triggered immediately
      cy.get('[data-testid="search-loading"]').should('not.exist');
      
      // Wait for debounce
      cy.wait(500);
      
      // Verify search is triggered after debounce
      cy.get('[data-testid="search-results"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle search errors gracefully', () => {
      // Mock search service to throw error
      cy.window().then((win) => {
        cy.stub(win.searchService, 'searchProducts').throws(new Error('Search failed'));
      });
      
      // Perform search
      cy.get('[data-testid="search-input"]').type('error test');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify error is handled
      cy.get('[data-testid="search-error"]').should('be.visible');
      cy.get('[data-testid="search-error"]').should('contain', 'Search failed');
    });

    it('should handle empty search results', () => {
      // Search for something that doesn\'t exist
      cy.get('[data-testid="search-input"]').type('nonexistentproduct12345');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify empty state is shown
      cy.get('[data-testid="empty-results"]').should('be.visible');
      cy.get('[data-testid="empty-results"]').should('contain', 'No products found');
    });

    it('should handle network errors', () => {
      // Intercept and fail API calls
      cy.intercept('GET', '/api/products*', { forceNetworkError: true });
      
      // Perform search
      cy.get('[data-testid="search-input"]').type('network error');
      cy.get('[data-testid="search-button"]').click();
      
      // Verify network error is handled
      cy.get('[data-testid="network-error"]').should('be.visible');
    });
  });
});