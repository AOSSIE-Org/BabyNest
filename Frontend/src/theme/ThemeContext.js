import React, { createContext, useState, useContext } from 'react';
import { Button } from 'react-native-paper';

const ThemeContext = createContext();

const themes = {
  default: {
    primary:'#DC5881',
    background: '#fff',
    text: 'rgb(0, 0, 0)',
    cardBackgroundprimary: 'rgb(35,79,147)',
    cardBackgroundsecondary: 'rgb(90,110,203)',
    iconBackground: '#ff4081',
    iconText: 'rgb(255, 255, 255)',
    button: 'rgb(218,79,122)',
    factcardprimary: 'rgb(246,199,210)',
    factcardsecondary: 'rgb(249, 234, 234)',
    appointment: '#fce4ec'
  },
  light: {
    primary: '#d4a373', 
    background: '#fff', 
    text: 'rgb(0,0,0)', 
    cardBackgroundprimary: '#ccd5ae', 
    cardBackgroundsecondary: '#ccd5ae', 
    iconBackground: '#d4a373', 
    button: '#d4a373', 
    factcardprimary: '#e9edc9', 
    factcardsecondary: '#e9edc9', 
    appointment: '#faedcd',
    iconText:'#FFFFFF' 
  },
  dark: {
    primary: '#9e2a2b', 
    background: '#fff', 
    text: 'fff3b0', 
    cardBackgroundprimary: '#e09f3e', 
    cardBackgroundsecondary: '#e09f3e', 
    iconBackground: '#9e2a2b', 
    iconText: 'fff3b0',
    button: '#9e2a2b', 
    factcardprimary: '#e09f3e', 
    factcardsecondary: '#e09f3e', 
    appointment: '#fff3b0',
    iconText:'#FFFFFF' 
  },
  pastel: {
    primary: '#AC87C5',
    background: '#fff', 
    text: '#5F5F5F', 
    cardBackgroundprimary: '#E8D8E0', 
    cardBackgroundsecondary: '#E0AED0', 
    iconBackground: '#D6E8D6',
    button: '#AC87C5', 
    factcardprimary: '#E0AED0', 
    factcardsecondary:'#E0AED0', 
    appointment: '#DFCCFB',
  }
};


export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(themes.light);

  const updateTheme = (themeName) => {
    if (themes[themeName]) {
      setTheme(themes[themeName]);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
