import { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';

const STORAGE_KEY = 'RENTVERSE_THEME';

export const ThemeConext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem(STORAGE_KEY);
    return storedTheme ? JSON.parse(storedTheme) : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      // in case of private mode or etc
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
    }),
    [theme, toggleTheme]
  );

  return <ThemeConext.Provider value={value}>{children}</ThemeConext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeConext);

  return context;
};
