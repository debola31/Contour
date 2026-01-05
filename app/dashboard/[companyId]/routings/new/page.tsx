'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import RoutingWizard from '@/components/routings/RoutingWizard';

export default function NewRoutingPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <Box>
      <RoutingWizard companyId={companyId} />
    </Box>
  );
}
