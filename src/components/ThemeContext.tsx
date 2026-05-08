import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'blue' | 'orange';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'blue',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('blue');

  useEffect(() => {
    // Remove both themes to be safe, then add the current one
    document.documentElement.classList.remove('theme-blue', 'theme-orange');
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  // Make sure we have a default class on body to render correctly
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
