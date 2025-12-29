'use client';

import { useRouter, usePathname } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/components/providers/AuthProvider';

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  // pathname like /dashboard/[companyId]/customers/new -> segments = ['dashboard', companyId, 'customers', 'new']

  // Map route segments to display titles
  const titleMap: Record<string, string> = {
    jobs: 'Jobs',
    routings: 'Routings',
    customers: 'Customers',
    new: 'New Customer',
    edit: 'Edit Customer',
    import: 'Import Customers',
  };

  // Check from the end backwards for known segments
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (titleMap[segment]) {
      return titleMap[segment];
    }
  }

  // If we found 'customers' in the path but didn't match a specific action,
  // it's likely a customer detail page (e.g., /customers/[id])
  if (segments.includes('customers')) {
    return 'Customer Details';
  }

  // Default to Dashboard
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
