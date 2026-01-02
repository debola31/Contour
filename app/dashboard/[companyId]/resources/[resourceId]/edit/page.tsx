'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ResourceForm from '@/components/resources/ResourceForm';
import { getResource } from '@/utils/resourcesAccess';
import { resourceToFormData, EMPTY_RESOURCE_FORM } from '@/types/resources';
import type { ResourceFormData } from '@/types/resources';

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const resourceId = params.resourceId as string;

  const [initialData, setInitialData] = useState<ResourceFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResource() {
      try {
        const resource = await getResource(resourceId);
        if (!resource) {
          setError('Resource not found');
          return;
        }
        setInitialData(resourceToFormData(resource));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resource');
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [resourceId]);

  const handleCancel = () => {
    router.push(`/dashboard/${companyId}/resources`);
  };

  const handleSaved = () => {
    router.push(`/dashboard/${companyId}/resources`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !initialData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Resource not found'}</Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mt: 2 }}
        >
          Back to Resources
        </Button>
      </Box>
    );
  }

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
          Edit Resource
        </Typography>
      </Box>

      {/* Form */}
      <ResourceForm
        companyId={companyId}
        resourceId={resourceId}
        initialData={initialData}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    </Box>
  );
}
