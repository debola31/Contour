'use client';

import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useAuth } from '@/components/providers/AuthProvider';

export default function Header() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSwitchCompany = () => {
    router.push('/select-company');
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
      }}
    >
      <Button
        color="inherit"
        onClick={handleSwitchCompany}
        sx={{ mr: 1, color: 'text.secondary' }}
      >
        Switch Company
      </Button>
      <Button
        color="inherit"
        onClick={handleSignOut}
        sx={{ color: 'text.secondary' }}
      >
        Sign Out
      </Button>
    </Box>
  );
}
