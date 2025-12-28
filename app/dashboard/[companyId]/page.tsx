'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import { useAuth } from '@/components/providers/AuthProvider';
import { verifyCompanyAccess, setLastCompany } from '@/utils/companyAccess';

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, loading: authLoading, signOut } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    async function checkAccess() {
      try {
        const access = await verifyCompanyAccess(user!.id, companyId);
        setHasAccess(access);

        if (access) {
          // Update last company preference
          await setLastCompany(user!.id, companyId);
        }
      } catch (err) {
        console.error('Error checking access:', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [user, authLoading, companyId, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const handleSwitchCompany = () => {
    router.push('/select-company');
  };

  // Show loading while checking auth status or access
  if (authLoading || loading) {
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

  // User not logged in (should have been redirected)
  if (!user) {
    return null;
  }

  // User doesn't have access to this company
  if (!hasAccess) {
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
          <Alert severity="error" sx={{ mb: 3 }}>
            You don&apos;t have access to this company.
          </Alert>
          <Button variant="contained" onClick={() => router.push('/select-company')}>
            Select a Different Company
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Jigged
          </Typography>
          <Button color="inherit" onClick={handleSwitchCompany} sx={{ mr: 1 }}>
            Switch Company
          </Button>
          <Button color="inherit" onClick={handleSignOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>

        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="text.secondary">
              Welcome to Jigged
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Dashboard features coming soon.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Company ID: <code>{companyId}</code>
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
