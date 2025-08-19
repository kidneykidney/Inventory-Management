import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Clock,
  Star,
  Trash2,
  Search,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  X,
  Edit2,
  Save
} from 'lucide-react';
import searchService from '../../services/searchService';

/**
 * SearchHistory Component
 * Manages search history and saved searches functionality
 */
const SearchHistory = ({ 
  onSearchSelect,
  onSavedSearchSelect,
  className = ""
}) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [editingSearch, setEditingSearch] = useState(null);
  const [editName, setEditName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [currentSearchToSave, setCurrentSearchToSave] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadSearchData();
  }, []);

  // Load search data from service and localStorage
  const loadSearchData = () => {
    const analytics = searchService.getSearchAnalytics();
    setSearchHistory(analytics.recentSearches);
    setPopularSearches(analytics.popularSearches);
    
    // Load saved searches from localStorage
    const saved = loadSavedSearches();
    setSavedSearches(saved);
  };

  // Load saved searches from localStorage
  const loadSavedSearches = () => {
    try {
      const saved = localStorage.getItem('savedProductSearches');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Failed to load saved searches:', error);
      return [];
    }
  };

  // Save searches to localStorage
  const saveSavedSearches = (searches) => {
    try {
      localStorage.setItem('savedProductSearches', JSON.stringify(searches));
    } catch (error) {
      console.warn('Failed to save searches:', error);
    }
  };

  // Save a search
  const saveSearch = (query, name = '') => {
    const searchName = name || `Search: ${query}`;
    const newSavedSearch = {
      id: Date.now().toString(),
      name: searchName,
      query,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1
    };

    const updatedSaved = [newSavedSearch, ...savedSearches.filter(s => s.query !== query)];
    setSavedSearches(updatedSaved);
    saveSavedSearches(updatedSaved);
    setShowSaveDialog(false);
    setCurrentSearchToSave('');
  };

  // Delete a saved search
  const deleteSavedSearch = (id) => {
    const updatedSaved = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updatedSaved);
    saveSavedSearches(updatedSaved);
  };

  // Update saved search name
  const updateSavedSearchName = (id, newName) => {
    const updatedSaved = savedSearches.map(s => 
      s.id === id ? { ...s, name: newName } : s
    );
    setSavedSearches(updatedSaved);
    saveSavedSearches(updatedSaved);
    setEditingSearch(null);
    setEditName('');
  };

  // Use a saved search
  const handleUseSavedSearch = (savedSearch) => {
    // Update use count and last used
    const updatedSaved = savedSearches.map(s => 
      s.id === savedSearch.id 
        ? { ...s, useCount: s.useCount + 1, lastUsed: new Date().toISOString() }
        : s
    );
    setSavedSearches(updatedSaved);
    saveSavedSearches(updatedSaved);
    
    onSavedSearchSelect?.(savedSearch);
  };

  // Clear search history
  const clearSearchHistory = () => {
    searchService.clearSearchHistory();
    setSearchHistory([]);
    setPopularSearches([]);
  };

  // Handle search selection
  const handleSearchSelect = (query) => {
    onSearchSelect?.(query);
  };

  // Start editing a saved search name
  const startEditing = (savedSearch) => {
    setEditingSearch(savedSearch.id);
    setEditName(savedSearch.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingSearch(null);
    setEditName('');
  };

  // Show save dialog
  const showSaveSearchDialog = (query) => {
    setCurrentSearchToSave(query);
    setShowSaveDialog(true);
  };

  // Check if a search is already saved
  const isSearchSaved = (query) => {
    return savedSearches.some(s => s.query === query);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recent Searches */}
      {searchHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                Recent Searches
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSearchHistory}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {searchHistory.slice(0, 10).map((query, index) => (
                <div key={index} className="flex items-center justify-between group">
                  <button
                    onClick={() => handleSearchSelect(query)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 flex-1 text-left"
                  >
                    <Search className="h-3 w-3 text-gray-400" />
                    {query}
                  </button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isSearchSaved(query) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showSaveSearchDialog(query)}
                        className="h-6 w-6 p-0"
                        title="Save search"
                      >
                        <Bookmark className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-gray-500" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedSearches
                .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
                .map((savedSearch) => (
                <div key={savedSearch.id} className="group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {editingSearch === savedSearch.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="text-sm h-8"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateSavedSearchName(savedSearch.id, editName);
                              } else if (e.key === 'Escape') {
                                cancelEditing();
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSavedSearchName(savedSearch.id, editName)}
                            className="h-6 w-6 p-0"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            className="h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleUseSavedSearch(savedSearch)}
                          className="text-left w-full"
                        >
                          <div className="font-medium text-sm text-gray-900 hover:text-blue-600 truncate">
                            {savedSearch.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                            <span>"{savedSearch.query}"</span>
                            <span>•</span>
                            <span>Used {savedSearch.useCount} times</span>
                            <span>•</span>
                            <span>{new Date(savedSearch.lastUsed).toLocaleDateString()}</span>
                          </div>
                        </button>
                      )}
                    </div>
                    
                    {editingSearch !== savedSearch.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(savedSearch)}
                          className="h-6 w-6 p-0"
                          title="Edit name"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedSearch(savedSearch.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Delete saved search"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Searches */}
      {popularSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              Popular Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {popularSearches.slice(0, 8).map((search, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                    onClick={() => handleSearchSelect(search.query)}
                  >
                    {search.query}
                    <span className="text-xs text-gray-500">({search.count})</span>
                  </Badge>
                  {!isSearchSaved(search.query) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showSaveSearchDialog(search.query)}
                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      title="Save search"
                    >
                      <Bookmark className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Save Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query
                </label>
                <Input
                  value={currentSearchToSave}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name (optional)
                </label>
                <Input
                  placeholder={`Search: ${currentSearchToSave}`}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveSearch(currentSearchToSave, editName);
                    } else if (e.key === 'Escape') {
                      setShowSaveDialog(false);
                      setEditName('');
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setEditName('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveSearch(currentSearchToSave, editName)}
                >
                  Save Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {searchHistory.length === 0 && savedSearches.length === 0 && popularSearches.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">No search history yet</h3>
              <p className="text-sm text-gray-600">
                Start searching to see your recent and popular searches here.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchHistory;