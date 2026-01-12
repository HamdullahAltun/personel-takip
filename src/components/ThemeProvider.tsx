"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "LIGHT" | "DARK" | "SYSTEM";
type ThemeContextType = {
    theme: Theme;
    accentColor: string;
    setTheme: (theme: Theme) => void;
    setAccentColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("LIGHT");
    const [accentColor, setAccentColor] = useState("#4f46e5");

    const updateTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        // Persist to backend
        fetch('/api/settings/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: newTheme })
        }).catch(err => console.error("Failed to save theme", err));
    };

    const updateAccentColor = (newColor: string) => {
        setAccentColor(newColor);
        // Persist to backend
        fetch('/api/settings/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accentColor: newColor })
        }).catch(err => console.error("Failed to save accent color", err));
    };

    useEffect(() => {
        // Fetch user settings
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    // Check if DB has values, otherwise keep defaults (LIGHT / #4f46e5)
                    if (data.user.theme) setTheme(data.user.theme as Theme);
                    if (data.user.accentColor) setAccentColor(data.user.accentColor);
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove old theme classes
        root.classList.remove("light", "dark");

        let appliedTheme = theme;
        if (theme === "SYSTEM") {
            appliedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "DARK" : "LIGHT";
        }

        root.classList.add(appliedTheme.toLowerCase());
        root.style.setProperty("--primary", accentColor);
        root.style.setProperty("--color-primary", accentColor);
    }, [theme, accentColor]);

    return (
        <ThemeContext.Provider value={{ theme, accentColor, setTheme: updateTheme, setAccentColor: updateAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
