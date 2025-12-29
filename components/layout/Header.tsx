'use client';

import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/components/providers/AuthProvider';

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // pathname like /dashboard/[companyId]/jobs -> segments = ['dashboard', companyId, 'jobs']
  const lastSegment = segments[segments.length - 1];

  // Map route segments to display titles
  const titleMap: Record<string, string> = {
    jobs: 'Jobs',
    routings: 'Routings',
  };

  // If last segment is in titleMap, use that; otherwise it's the dashboard
  if (titleMap[lastSegment]) {
    return titleMap[lastSegment];
  }

  // Default to Dashboard (when on /dashboard/[companyId])
  return 'Dashboard';
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useAuth();
  const pageTitle = getPageTitle(pathname);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 3,
        py: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(17, 20, 57, 0.4)',
        backdropFilter: 'blur(8px)',
        minHeight: 64,
      }}
    >
      <Typography variant="h5" component="h1" sx={{ fontWeight: 600, color: 'white' }}>
        {pageTitle}
      </Typography>
      <Button
        onClick={handleSignOut}
        startIcon={<LogoutIcon />}
        sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
          },
        }}
      >
        Sign Out
      </Button>
    </Box>
  );
}
