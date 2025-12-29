'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Header() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        px: 3,
        py: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        bgcolor: 'rgba(17, 20, 57, 0.4)',
        backdropFilter: 'blur(8px)',
        minHeight: 64,
      }}
    >
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
