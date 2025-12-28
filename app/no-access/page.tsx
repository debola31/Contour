'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAuth } from '@/components/providers/AuthProvider';
import CircularProgress from '@mui/material/CircularProgress';

export default function NoAccessPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to login
      router.replace('/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

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
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Card elevation={3}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <WarningAmberIcon
                sx={{ fontSize: 64, color: 'warning.main' }}
              />
            </Box>

            <Typography variant="h5" component="h1" gutterBottom>
              No Company Access
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Your account doesn&apos;t have access to any companies yet.
              Please contact your administrator to get access.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Signed in as: <strong>{user.email}</strong>
            </Typography>

            <Button
              variant="outlined"
              onClick={handleSignOut}
              fullWidth
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
