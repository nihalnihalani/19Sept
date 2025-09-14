'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

type Theme = 'light' | 'dark';

interface ThemeSwitcherProps {
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeSwitcher({ onThemeChange }: ThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');

  const themes = [
    { id: 'light' as Theme, icon: Sun, name: 'Light' },
    { id: 'dark' as Theme, icon: Moon, name: 'Dark' },
  ];

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    
    // Apply theme to document
    const root = document.documentElement;
    root.className = theme === 'light' ? '' : 'dark';
    
    onThemeChange?.(theme);
  };

  useEffect(() => {
    // Initialize theme on mount - default to dark mode
    const root = document.documentElement;
    root.classList.add('dark');
    setCurrentTheme('dark');
  }, []);

  return (
    <div className="flex items-center gap-2">
      {themes.map((theme) => {
        const Icon = theme.icon;
        return (
          <Button
            key={theme.id}
            variant={currentTheme === theme.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleThemeChange(theme.id)}
            className="relative"
          >
            <Icon className="h-4 w-4" />
            <span className="ml-2">{theme.name}</span>
          </Button>
        );
      })}
    </div>
  );
}