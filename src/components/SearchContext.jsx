import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');



  const updateSearchQuery = useCallback((query) => {
    setSearchQuery(query);
  }, [searchQuery]);

  const clearSearchQuery = useCallback(() => {
    setSearchQuery('');
  }, [searchQuery]);



  return (
    <SearchContext.Provider value={{
      searchQuery,
      updateSearchQuery,
      clearSearchQuery
    }}>
      {children}
    </SearchContext.Provider>
  );
};
