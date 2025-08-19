import React, { createContext, useState, useMemo, useContext } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

/**
 * Context for theme management
 * Provides functionality to switch between light and dark themes
 */
const ThemeContext = createContext();

/**
 * ThemeProviderWrapper component to manage theme state
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Theme provider
 */
export const ThemeProviderWrapper = ({ children }) => {
  // State to track if dark mode is enabled
  const [darkMode, setDarkMode] = useState(false);

  // Toggle theme function
  const toggleTheme = () => {
    console.log('Toggling theme');
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);

    // Toggle dark class on document element for Tailwind CSS
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Create theme based on current mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      }),
    [darkMode]
  );

  // Effect to load theme preference from localStorage on initial load
  React.useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const isDarkMode = savedMode === 'true';
    setDarkMode(isDarkMode);

    // Apply dark class to document element for Tailwind CSS
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Context value
  const contextValue = {
    darkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 * @returns {Object} Theme context value
 */
export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext;
