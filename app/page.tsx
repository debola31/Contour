'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '@/components/providers/AuthProvider';
import { getPostLoginRoute } from '@/utils/companyAccess';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    async function redirect() {
      if (!user) {
        // Not logged in, go to login page
        router.replace('/login');
        return;
      }

      // Logged in, determine where to redirect
      const route = await getPostLoginRoute(user.id);
      router.replace(route);
    }

    redirect();
  }, [user, loading, router]);

  // Show loading spinner while determining redirect
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}
