'use client';

import { createTheme } from '@mui/material/styles';

const jiggedTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4682B4',      // Steel Blue (per design system spec)
      light: '#6FA3D8',     // Hover state
      dark: '#3A6B94',      // Pressed state
      contrastText: '#fff',
    },
    secondary: {
      main: '#B0B3B8',      // Neutral Gray
      light: '#c5c7cc',
      dark: '#9a9da1',
    },
    background: {
      default: '#111439',   // Deep Indigo (per design system spec)
      paper: '#1a1f4a',     // Solid paper background for cards
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
      defaultProps: {
        elevation: 2,  // Standard cards use elevation 2 per design system
      },
      styleOverrides: {
        root: {
          border: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
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
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#111439',  // Deep Indigo (per design system spec)
          backgroundImage: 'linear-gradient(135deg, #111439 0%, #1a1f4a 100%)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
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
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1f4a',  // Solid Deep Indigo for dropdown menus
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1f4a',  // Solid Deep Indigo for popovers (Select menus)
          backgroundImage: 'none',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1a1f4a',  // Solid Deep Indigo for autocomplete dropdowns
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        option: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&[aria-selected="true"]': {
            backgroundColor: 'rgba(70, 130, 180, 0.2)',
          },
        },
        groupLabel: {
          fontWeight: 600,
          color: '#4682B4',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
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
