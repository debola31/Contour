'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import jiggedTheme from '@/lib/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MuiThemeProvider theme={jiggedTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #111439 0%, #4682B4 50%, #111439 100%)',
          backgroundAttachment: 'fixed',
        }}
      >
        {children}
      </Box>
    </MuiThemeProvider>
  );
}
