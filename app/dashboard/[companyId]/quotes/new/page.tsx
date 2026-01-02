'use client';

import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import QuoteForm from '@/components/quotes/QuoteForm';
import { EMPTY_QUOTE_FORM } from '@/types/quote';

export default function NewQuotePage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <Box>
      <QuoteForm mode="create" initialData={EMPTY_QUOTE_FORM} />
    </Box>
  );
}
