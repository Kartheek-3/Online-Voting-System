import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  toggleHighContrast: () => void;
  largeText: boolean;
  toggleLargeText: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem('largeText') === 'true';
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    localStorage.setItem('highContrast', String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    if (largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    localStorage.setItem('largeText', String(largeText));
  }, [largeText]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);
  const toggleLargeText = () => setLargeText(prev => !prev);

  return (
    <AccessibilityContext.Provider value={{ highContrast, toggleHighContrast, largeText, toggleLargeText }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
