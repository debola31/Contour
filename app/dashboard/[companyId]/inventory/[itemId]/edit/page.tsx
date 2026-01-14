'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import InventoryForm from '@/components/inventory/InventoryForm';
import { getInventoryItemWithTransactionCount } from '@/utils/inventoryAccess';
import { inventoryItemToFormData } from '@/types/inventory';
import type { InventoryItemWithRelations, InventoryItemFormData } from '@/types/inventory';

export default function EditInventoryItemPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const itemId = params.itemId as string;

  const [item, setItem] = useState<InventoryItemWithRelations | null>(null);
  const [formData, setFormData] = useState<InventoryItemFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await getInventoryItemWithTransactionCount(itemId);
        if (!data) {
          setError('Item not found');
          return;
        }
        setItem(data);
        setFormData(inventoryItemToFormData(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading item');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !item || !formData) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error || 'Item not found'}
      </Alert>
    );
  }

  return (
    <Box>
      <InventoryForm
        mode="edit"
        companyId={companyId}
        itemId={itemId}
        item={item}
        initialData={formData}
      />
    </Box>
  );
}
