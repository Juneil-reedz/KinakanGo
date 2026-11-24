import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'kkg_theme'; // new key: everyone starts on the dark glass theme

// index.html applies the saved theme before React loads (no flash);
// this reads that initial state and keeps <html> in sync. The app is always
// the dark glass theme; "light" only turns the bottom navigation bar light
// (class "light-nav").
const readTheme = () => (document.documentElement.classList.contains('light-nav') ? 'light' : 'dark');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('light-nav', theme === 'light');
    document.documentElement.classList.remove('light', 'dim');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, isLight: theme === 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
