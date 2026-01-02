'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button
          variant="text"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Resource
        </Typography>
      </Box>

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
