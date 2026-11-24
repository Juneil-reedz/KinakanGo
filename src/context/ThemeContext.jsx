import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'kkg_mode'; // new key: everyone starts on the light clay theme

// index.html applies the saved theme before React loads (no flash);
// this reads that initial state and keeps <html> in sync. Cards stay white in
// both modes (class "light" is always on); dark mode adds "dim", which only
// deepens the page background and the header/sidebar bars.
const readTheme = () => (document.documentElement.classList.contains('dim') ? 'dark' : 'light');

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.classList.add('light');
    document.documentElement.classList.toggle('dim', theme === 'dark');
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
