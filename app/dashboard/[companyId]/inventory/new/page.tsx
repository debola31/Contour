'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import InventoryForm from '@/components/inventory/InventoryForm';
import { EMPTY_INVENTORY_FORM } from '@/types/inventory';

export default function NewInventoryItemPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <Box>
      <InventoryForm
        mode="create"
        companyId={companyId}
        initialData={EMPTY_INVENTORY_FORM}
      />
    </Box>
  );
}
