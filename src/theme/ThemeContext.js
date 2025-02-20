import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState({
    primary: '#ff4081',
    background: '#FFFFFF',
    text: '#000000',
    cardBackground: '#F5F5F5',
    iconBackground: '#E3F2FD',
  });

  const updateTheme = (newTheme) => {
    setTheme({ ...theme, ...newTheme });
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};