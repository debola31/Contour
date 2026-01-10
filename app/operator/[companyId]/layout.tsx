'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import LogoutIcon from '@mui/icons-material/Logout';
import WorkIcon from '@mui/icons-material/Work';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import {
  isOperatorAuthenticated,
  decodeOperatorToken,
  operatorLogout,
  isTokenExpired,
} from '@/utils/operatorAccess';

/**
 * Operator View layout.
 *
 * Mobile-first layout with:
 * - Minimal top header with operator name and logout
 * - Bottom navigation bar (Jobs, Active, Profile)
 * - No sidebar (unlike admin dashboard)
 */
export default function OperatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const companyId = params.companyId as string;

  const [operatorName, setOperatorName] = useState<string>('');
  const [navValue, setNavValue] = useState(0);

  // Check authentication on mount
  useEffect(() => {
    // Skip auth check on login page
    if (pathname?.includes('/login')) {
      return;
    }

    if (!isOperatorAuthenticated() || isTokenExpired()) {
      router.push(`/operator/${companyId}/login`);
      return;
    }

    const decoded = decodeOperatorToken();
    if (decoded) {
      setOperatorName(decoded.operator_name);
    }
  }, [companyId, router, pathname]);

  // Update nav value based on current path
  useEffect(() => {
    if (pathname?.includes('/jobs') && !pathname?.includes('/active')) {
      setNavValue(0);
    } else if (pathname?.includes('/active')) {
      setNavValue(1);
    } else if (pathname?.includes('/profile')) {
      setNavValue(2);
    }
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await operatorLogout();
    } finally {
      router.push(`/operator/${companyId}/login`);
    }
  };

  const handleNavChange = (_event: React.SyntheticEvent, newValue: number) => {
    setNavValue(newValue);
    switch (newValue) {
      case 0:
        router.push(`/operator/${companyId}/jobs`);
        break;
      case 1:
        // Active - shows current working job or jobs list
        router.push(`/operator/${companyId}/jobs`);
        break;
      case 2:
        // Profile - for now, just show jobs
        router.push(`/operator/${companyId}/jobs`);
        break;
    }
  };

  // Don't show header/nav on login page
  const isLoginPage = pathname?.includes('/login');

  if (isLoginPage) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      {/* Top App Bar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(17, 20, 57, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Toolbar sx={{ minHeight: 56 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontWeight: 500 }}
          >
            {operatorName || 'Operator'}
          </Typography>
          <IconButton
            color="inherit"
            onClick={handleLogout}
            aria-label="logout"
            sx={{ minWidth: 48, minHeight: 48 }}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '56px', // AppBar height
          mb: '56px', // BottomNavigation height
          overflow: 'auto',
          p: 2,
        }}
      >
        {children}
      </Box>

      {/* Bottom Navigation */}
      <Paper
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={navValue}
          onChange={handleNavChange}
          showLabels
          sx={{
            bgcolor: 'rgba(17, 20, 57, 0.98)',
            '& .MuiBottomNavigationAction-root': {
              color: 'rgba(255, 255, 255, 0.5)',
              minWidth: 80,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Jobs"
            icon={<WorkIcon />}
            sx={{ minHeight: 56 }}
          />
          <BottomNavigationAction
            label="Active"
            icon={<PlayArrowIcon />}
            sx={{ minHeight: 56 }}
          />
          <BottomNavigationAction
            label="Profile"
            icon={<PersonIcon />}
            sx={{ minHeight: 56 }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
