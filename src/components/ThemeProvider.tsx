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

    useEffect(() => {
        // Fetch user settings
        fetch("/api/auth/me")
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    if (data.user.theme) setTheme(data.user.theme);
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
        <ThemeContext.Provider value={{ theme, accentColor, setTheme, setAccentColor }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
