'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { CustomerForm } from '@/components/customers';
import { getCustomer } from '@/utils/customerAccess';
import { customerToFormData, EMPTY_CUSTOMER_FORM } from '@/types/customer';
import type { CustomerFormData } from '@/types/customer';

export default function EditCustomerPage() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [initialData, setInitialData] = useState<CustomerFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const customer = await getCustomer(customerId);
        if (!customer) {
          setError('Customer not found');
          setInitialData(EMPTY_CUSTOMER_FORM);
        } else {
          setInitialData(customerToFormData(customer));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setInitialData(EMPTY_CUSTOMER_FORM);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [customerId]);

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
      <CustomerForm mode="edit" initialData={initialData} customerId={customerId} />
    </Box>
  );
}
