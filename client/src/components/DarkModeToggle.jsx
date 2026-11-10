import { useTheme } from '../context/ThemeContext.jsx';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="theme-icon" aria-hidden="true">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
    </button>
  );
}