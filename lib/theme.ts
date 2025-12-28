'use client';

import { createTheme } from '@mui/material/styles';

const jiggedTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5a96c9',      // Brighter Steel Blue
      light: '#6fa3d8',     // Hover state
      dark: '#4682B4',      // Pressed state
      contrastText: '#fff',
    },
    secondary: {
      main: '#B0B3B8',      // Neutral Gray
      light: '#c5c7cc',
      dark: '#9a9da1',
    },
    background: {
      default: '#0a0e1a',   // Very dark for gradient overlay
      paper: 'rgba(26, 31, 74, 0.35)',  // More transparent cards on gradient
    },
    text: {
      primary: '#ffffff',
      secondary: '#B0B3B8',
    },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    info: { main: '#3b82f6' },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2, color: '#ffffff' },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.3, color: '#ffffff' },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3, color: '#ffffff' },
    h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4, color: '#ffffff' },
    h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, color: '#ffffff' },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, color: '#ffffff' },
    body1: { fontSize: '1rem', lineHeight: 1.6, color: '#ffffff' },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: '#B0B3B8' },
    button: { textTransform: 'none', fontWeight: 500 },
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
          padding: '10px 20px',
          minHeight: 48, // Touch target size for shop floor
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: '0 4px 12px rgba(70, 130, 180, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(70, 130, 180, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
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
          backgroundColor: 'rgba(26, 31, 74, 0.35)',  // 35% opacity - very transparent
          backdropFilter: 'blur(15px)',               // Strong blur
          WebkitBackdropFilter: 'blur(15px)',         // Safari support
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
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
});

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

export default jiggedTheme;
