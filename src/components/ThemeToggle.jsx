import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { isLight, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme} title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`w-9 h-9 glass rounded-xl flex items-center justify-center text-forest-100 hover:glass-green transition-all flex-shrink-0 ${className}`}>
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </button>
  );
}
