'use client';

import { useState, useEffect } from 'react';
import Color from 'color';
import { Button } from '@/components/ui/button';
import { 
  ColorPicker, 
  ColorPickerSelection, 
  ColorPickerHue, 
  ColorPickerAlpha, 
  ColorPickerFormat, 
  ColorPickerOutput,
  ColorPickerEyeDropper 
} from '@/components/ui/color-picker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Palette, Sun, Moon, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'light' | 'dark' | 'custom';

interface ThemeSwitcherProps {
  onThemeChange?: (theme: Theme) => void;
}

export function ThemeSwitcher({ onThemeChange }: ThemeSwitcherProps) {
  const [currentTheme, setCurrentTheme] = useState<Theme>('dark');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#8b5cf6',
    secondary: '#1e293b',
    accent: '#f59e0b',
  });

  const themes = [
    { id: 'light' as Theme, icon: Sun, name: 'Light' },
    { id: 'dark' as Theme, icon: Moon, name: 'Dark' },
    { id: 'custom' as Theme, icon: Palette, name: 'Custom' },
  ];

  const handleThemeChange = (theme: Theme) => {
    setCurrentTheme(theme);
    
    // Apply theme to document
    const root = document.documentElement;
    root.className = theme === 'light' ? '' : 'dark';
    
    if (theme === 'custom') {
      root.style.setProperty('--primary', customColors.primary);
      root.style.setProperty('--secondary', customColors.secondary);
      root.style.setProperty('--accent', customColors.accent);
    }
    
    onThemeChange?.(theme);
  };

  const handleColorChange = (colorType: string) => (value: Parameters<typeof Color.rgb>[0]) => {
    const rgbaArray = value as [number, number, number, number];
    const hexColor = `#${rgbaArray.slice(0, 3).map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
    
    setCustomColors(prev => ({
      ...prev,
      [colorType]: hexColor
    }));

    if (currentTheme === 'custom') {
      document.documentElement.style.setProperty(`--${colorType}`, hexColor);
    }
  };

  useEffect(() => {
    // Initialize theme on mount
    const isDark = document.documentElement.classList.contains('dark');
    setCurrentTheme(isDark ? 'dark' : 'light');
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {themes.map((theme) => {
          const Icon = theme.icon;
          return (
            <Button
              key={theme.id}
              variant={currentTheme === theme.id ? "default" : "outline"}
              size="sm"
              onClick={() => {
                if (theme.id === 'custom') {
                  setShowColorPicker(!showColorPicker);
                }
                handleThemeChange(theme.id);
              }}
              className="relative"
            >
              <Icon className="h-4 w-4" />
              <span className="ml-2">{theme.name}</span>
            </Button>
          );
        })}
      </div>

      <AnimatePresence>
        {showColorPicker && currentTheme === 'custom' && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full right-0 mt-2 z-50"
          >
            <Card className="w-80 bg-background/95 backdrop-blur-sm border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Custom Theme Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(customColors).map(([colorType, color]) => (
                  <div key={colorType} className="space-y-3">
                    <label className="text-sm font-medium capitalize">
                      {colorType} Color
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border border-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-muted-foreground font-mono">
                          {color}
                        </span>
                        <ColorPickerEyeDropper />
                      </div>
                      
                      <ColorPicker
                        value={color}
                        onChange={handleColorChange(colorType)}
                        className="w-full"
                      >
                        <div className="space-y-3">
                          <ColorPickerSelection className="h-32 w-full" />
                          <ColorPickerHue />
                          <ColorPickerAlpha />
                          <div className="flex items-center gap-2">
                            <ColorPickerFormat className="flex-1" />
                            <ColorPickerOutput />
                          </div>
                        </div>
                      </ColorPicker>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowColorPicker(false)}
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Save custom theme to localStorage
                      localStorage.setItem('custom-theme', JSON.stringify(customColors));
                      setShowColorPicker(false);
                    }}
                  >
                    Save Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}