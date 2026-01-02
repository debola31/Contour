'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import ResourceForm from '@/components/resources/ResourceForm';
import { EMPTY_RESOURCE_FORM } from '@/types/resources';

export default function NewResourcePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const handleCancel = () => {
    router.push(`/dashboard/${companyId}/resources`);
  };

  const handleSaved = (resourceId: string) => {
    router.push(`/dashboard/${companyId}/resources`);
  };

  return (
    <Box>
      {/* Form */}
      <ResourceForm
        companyId={companyId}
        initialData={EMPTY_RESOURCE_FORM}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    </Box>
  );
}
