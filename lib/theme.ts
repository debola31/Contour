'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Shared theme options
const sharedThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48, // Touch target size for shop floor
        },
        sizeLarge: {
          padding: '12px 24px',
        },
        sizeMedium: {
          padding: '8px 16px',
        },
        sizeSmall: {
          padding: '4px 12px',
          minHeight: 36,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 48, // Touch target size
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default gradient
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 48, // Touch target size
        },
      },
    },
  },
};

// Light theme
export const lightTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: '#4682B4',      // Steel Blue
      light: '#5a96c9',     // Hover state
      dark: '#3a6f9a',      // Pressed state
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#B0B3B8',      // Neutral Gray
      light: '#c5c7cc',
      dark: '#9a9da1',
      contrastText: '#1a1d29',
    },
    background: {
      default: '#f0f4f8',   // Light gradient start
      paper: '#ffffff',     // Cards, surfaces
    },
    text: {
      primary: '#1a1d29',
      secondary: '#64748b',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
  },
  components: {
    ...sharedThemeOptions.components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

// Dark theme
export const darkTheme = createTheme({
  ...sharedThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4682B4',      // Steel Blue
      light: '#5a96c9',     // Hover state
      dark: '#3a6f9a',      // Pressed state
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#B0B3B8',      // Neutral Gray
      light: '#c5c7cc',
      dark: '#9a9da1',
      contrastText: '#1a1d29',
    },
    background: {
      default: '#111439',   // Deep Indigo
      paper: '#1a1f4a',     // Elevated surfaces
    },
    text: {
      primary: '#f8fafc',
      secondary: '#B0B3B8',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  components: {
    ...sharedThemeOptions.components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

// Background gradients for use in components
export const backgroundGradients = {
  light: 'linear-gradient(135deg, #f0f4f8 0%, #d4dce6 100%)',
  dark: 'linear-gradient(135deg, #111439 0%, #1a1f4a 100%)',
};

// Work order status color mapping
export const statusColors = {
  requested: 'default',
  approved: 'info',
  in_progress: 'primary',
  completed: 'success',
  on_hold: 'warning',
  cancelled: 'error',
  overdue: 'error',
} as const;

export type StatusColorKey = keyof typeof statusColors;
