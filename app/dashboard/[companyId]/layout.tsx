'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import { Sidebar, Header } from '@/components/layout';
import { AuthGuard } from '@/components/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <AuthGuard companyId={companyId} requireCompany>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', ml: '240px', minWidth: 0 }}>
          <Header />
          <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
