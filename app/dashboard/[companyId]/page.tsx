'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function DashboardPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <Box>
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
    </Box>
  );
}
