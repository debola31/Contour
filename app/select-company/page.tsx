'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout, CompanySelector } from '@/components/auth';
import { useAuth } from '@/components/providers/AuthProvider';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function SelectCompanyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to login
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking auth status
  if (loading) {
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

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  return (
    <AuthLayout>
      <CompanySelector />
    </AuthLayout>
  );
}
