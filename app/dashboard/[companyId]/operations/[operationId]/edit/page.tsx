'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OperationForm from '@/components/operations/OperationForm';
import { getOperation } from '@/utils/operationsAccess';
import { operationToFormData } from '@/types/operations';
import type { OperationFormData } from '@/types/operations';

export default function EditOperationPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const operationId = params.operationId as string;

  const [initialData, setInitialData] = useState<OperationFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOperation() {
      try {
        const operation = await getOperation(operationId);
        if (!operation) {
          setError('Operation not found');
          return;
        }
        setInitialData(operationToFormData(operation));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operation');
      } finally {
        setLoading(false);
      }
    }
    loadOperation();
  }, [operationId]);

  const handleCancel = () => {
    router.push(`/dashboard/${companyId}/operations`);
  };

  const handleSaved = () => {
    router.push(`/dashboard/${companyId}/operations`);
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
      <Box>
        <Alert severity="error">{error || 'Operation not found'}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ color: 'text.secondary', mt: 2 }}
        >
          Back to Operations
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Form */}
      <OperationForm
        companyId={companyId}
        operationId={operationId}
        initialData={initialData}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    </Box>
  );
}
