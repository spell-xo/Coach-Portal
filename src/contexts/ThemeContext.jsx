import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { themes } from '../styles/themeOptions';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to 'blackPrimary'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || 'blackPrimary';
  });

  // Persist theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  // Get the current theme object
  const currentTheme = useMemo(() => {
    return themes[themeMode] || themes.blackPrimary;
  }, [themeMode]);

  // Check if current theme is dark mode
  const isDarkMode = themeMode === 'dark';

  // Toggle between dark and light (blackPrimary) mode
  const toggleDarkMode = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'blackPrimary' : 'dark'));
  };

  // Switch to a specific theme
  const setTheme = (themeName) => {
    if (themes[themeName]) {
      setThemeMode(themeName);
    }
  };

  const value = {
    themeMode,
    setTheme,
    toggleDarkMode,
    isDarkMode,
    availableThemes: Object.keys(themes),
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={currentTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
