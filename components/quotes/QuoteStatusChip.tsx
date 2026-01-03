import Chip from '@mui/material/Chip';
import type { QuoteStatus } from '@/types/quote';
import { QUOTE_STATUS_CONFIG } from '@/types/quote';

interface QuoteStatusChipProps {
  status: QuoteStatus;
  size?: 'small' | 'medium';
}

export default function QuoteStatusChip({ status, size = 'small' }: QuoteStatusChipProps) {
  const config = QUOTE_STATUS_CONFIG[status] || { label: status, color: 'default' as const };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="filled"
      sx={{ fontWeight: 500 }}
    />
  );
}
