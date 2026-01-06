'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import RoutingWizard from '@/components/routings/RoutingWizard';

export default function NewRoutingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const initialPartId = searchParams.get('partId') || undefined;

  return (
    <Box>
      <RoutingWizard companyId={companyId} initialPartId={initialPartId} />
    </Box>
  );
}
