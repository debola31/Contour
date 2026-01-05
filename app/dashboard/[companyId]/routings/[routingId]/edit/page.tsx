'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import RoutingWizard from '@/components/routings/RoutingWizard';

export default function EditRoutingPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const routingId = params.routingId as string;

  return (
    <Box>
      <RoutingWizard companyId={companyId} routingId={routingId} />
    </Box>
  );
}
