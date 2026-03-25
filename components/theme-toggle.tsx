'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className="theme-toggle-btn"
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        transition: 'background 0.15s ease, color 0.15s ease, transform 0.3s ease',
        flexShrink: 0,
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--border)';
        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
      }}
    >
      <span
        style={{
          display: 'flex',
          transition: 'transform 0.3s ease, opacity 0.2s ease',
          transform: theme === 'dark' ? 'rotate(0deg)' : 'rotate(180deg)',
        }}
      >
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
      </span>
    </button>
  );
}
