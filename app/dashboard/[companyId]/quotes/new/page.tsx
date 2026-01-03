'use client';

import Box from '@mui/material/Box';
import QuoteForm from '@/components/quotes/QuoteForm';
import { EMPTY_QUOTE_FORM } from '@/types/quote';

export default function NewQuotePage() {
  return (
    <Box>
      <QuoteForm mode="create" initialData={EMPTY_QUOTE_FORM} />
    </Box>
  );
}
