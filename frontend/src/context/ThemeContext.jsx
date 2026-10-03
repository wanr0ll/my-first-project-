import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// Accent color definitions — each provides HSL values for primary, primary-dark, primary-light
const ACCENT_COLORS = {
    default: null, // Use the theme's built-in primary
    emerald: { primary: '160 60% 40%', dark: '160 60% 30%', light: '160 50% 55%' },
    ocean: { primary: '200 80% 45%', dark: '200 80% 35%', light: '200 70% 58%' },
    sunset: { primary: '20 85% 52%', dark: '20 85% 42%', light: '20 75% 62%' },
    purple: { primary: '270 60% 50%', dark: '270 60% 38%', light: '270 50% 62%' },
    rose: { primary: '340 70% 52%', dark: '340 70% 40%', light: '340 60% 64%' },
};

export const ACCENT_LIST = [
    { id: 'default', label: 'Default', colors: ['#3b5998', '#2d4373'] },
    { id: 'emerald', label: 'Emerald', colors: ['#2d9f6f', '#1f7a54'] },
    { id: 'ocean', label: 'Ocean', colors: ['#1a8fcb', '#0e6fa0'] },
    { id: 'sunset', label: 'Sunset', colors: ['#e8632b', '#c44e1e'] },
    { id: 'purple', label: 'Purple', colors: ['#7c3aed', '#5b21b6'] },
    { id: 'rose', label: 'Rose', colors: ['#e43670', '#b91d56'] },
];

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('gha_theme') || 'navy';
    });

    const [accentColor, setAccentColor] = useState(() => {
        return localStorage.getItem('gha_accent') || 'default';
    });

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove previous themes
        root.classList.remove('theme-light', 'theme-dark', 'theme-navy');

        // Add current theme
        root.classList.add(`theme-${theme}`);
        root.setAttribute('data-theme', theme);
        localStorage.setItem('gha_theme', theme);

        // Apply accent color override
        const accent = ACCENT_COLORS[accentColor];
        if (accent) {
            root.style.setProperty('--primary', `hsl(${accent.primary})`);
            root.style.setProperty('--primary-dark', `hsl(${accent.dark})`);
            root.style.setProperty('--primary-light', `hsl(${accent.light})`);
        } else {
            // Remove overrides so theme defaults take effect
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-dark');
            root.style.removeProperty('--primary-light');
        }
        localStorage.setItem('gha_accent', accentColor);
    }, [theme, accentColor]);

    const toggleTheme = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: toggleTheme, accentColor, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
};
