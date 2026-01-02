'use client';

import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import OperationForm from '@/components/operations/OperationForm';
import { EMPTY_OPERATION_FORM } from '@/types/operations';

export default function NewOperationPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const handleCancel = () => {
    router.push(`/dashboard/${companyId}/operations`);
  };

  const handleSaved = (operationId: string) => {
    router.push(`/dashboard/${companyId}/operations`);
  };

  return (
    <Box>
      {/* Form */}
      <OperationForm
        companyId={companyId}
        initialData={EMPTY_OPERATION_FORM}
        onCancel={handleCancel}
        onSaved={handleSaved}
      />
    </Box>
  );
}
