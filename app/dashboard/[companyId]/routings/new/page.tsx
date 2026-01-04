'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import { RoutingForm } from '@/components/routings';

export default function NewRoutingPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  return (
    <Box>
      <RoutingForm
        companyId={companyId}
        onCancel={() => router.back()}
        onSaved={(routingId) =>
          router.push(`/dashboard/${companyId}/routings/${routingId}/edit`)
        }
      />
    </Box>
  );
}
