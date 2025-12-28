'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';

export default function RoutingsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Routings
      </Typography>

      <Card elevation={2}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Production Routings
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Define manufacturing processes and routing steps here.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Company ID: <code>{companyId}</code>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
