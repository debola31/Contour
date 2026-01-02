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

  // Check for parts routes first (more specific matching)
  if (segments.includes('parts')) {
    if (segments.includes('new')) return 'New Part';
    if (segments.includes('edit')) return 'Edit Part';
    if (segments.includes('import')) return 'Import Parts';
    // Check if there's a partId (detail page)
    const partsIndex = segments.indexOf('parts');
    if (partsIndex < segments.length - 1 && !['new', 'edit', 'import'].includes(segments[partsIndex + 1])) {
      return 'Part Details';
    }
    return 'Parts';
  }

  // Check for customers routes
  if (segments.includes('customers')) {
    if (segments.includes('new')) return 'New Customer';
    if (segments.includes('edit')) return 'Edit Customer';
    if (segments.includes('import')) return 'Import Customers';
    // Check if there's a customerId (detail page)
    const customersIndex = segments.indexOf('customers');
    if (customersIndex < segments.length - 1 && !['new', 'edit', 'import'].includes(segments[customersIndex + 1])) {
      return 'Customer Details';
    }
    return 'Customers';
  }

  // Check for operations routes
  if (segments.includes('operations')) {
    if (segments.includes('new')) return 'New Operation';
    if (segments.includes('edit')) return 'Edit Operation';
    if (segments.includes('import')) return 'Import Operations';
    return 'Operations';
  }

  // Map other route segments to display titles
  const titleMap: Record<string, string> = {
    jobs: 'Jobs',
    routings: 'Routings',
  };

  // Check from the end backwards for known segments
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];
    if (titleMap[segment]) {
      return titleMap[segment];
    }
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
        py: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(17, 20, 57, 0.4)',
        backdropFilter: 'blur(8px)',
        minHeight: 48,
        position: 'sticky',
        top: 0,
        zIndex: 1100,
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
