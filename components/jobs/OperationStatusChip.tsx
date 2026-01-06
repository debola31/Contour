import Chip from '@mui/material/Chip';
import type { OperationStatus } from '@/types/job';
import { OPERATION_STATUS_CONFIG } from '@/types/job';

interface OperationStatusChipProps {
  status: OperationStatus;
  size?: 'small' | 'medium';
}

export default function OperationStatusChip({ status, size = 'small' }: OperationStatusChipProps) {
  const config = OPERATION_STATUS_CONFIG[status] || { label: status, color: 'default' as const };

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
