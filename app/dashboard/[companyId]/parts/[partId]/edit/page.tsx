'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { PartForm } from '@/components/parts';
import { getPartWithRelations } from '@/utils/partsAccess';
import { partToFormData, EMPTY_PART_FORM } from '@/types/part';
import type { Part, PartFormData } from '@/types/part';

export default function EditPartPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const partId = params.partId as string;

  const [part, setPart] = useState<Part | null>(null);
  const [initialData, setInitialData] = useState<PartFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPart() {
      try {
        const data = await getPartWithRelations(partId);
        if (!data) {
          setError('Part not found');
          setInitialData(EMPTY_PART_FORM);
        } else {
          setPart(data);
          setInitialData(partToFormData(data));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setInitialData(EMPTY_PART_FORM);
      } finally {
        setLoading(false);
      }
    }

    fetchPart();
  }, [partId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <Box>
      <PartForm
        mode="edit"
        companyId={companyId}
        initialData={initialData}
        partId={partId}
        part={part ?? undefined}
        onSuccess={() => router.push(`/dashboard/${companyId}/parts`)}
        onCancel={() => router.back()}
      />
    </Box>
  );
}
