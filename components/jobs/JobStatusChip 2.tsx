import Chip from '@mui/material/Chip';
import type { JobStatus } from '@/types/job';
import { JOB_STATUS_CONFIG } from '@/types/job';

interface JobStatusChipProps {
  status: JobStatus;
  size?: 'small' | 'medium';
}

export default function JobStatusChip({ status, size = 'small' }: JobStatusChipProps) {
  const config = JOB_STATUS_CONFIG[status] || { label: status, color: 'default' as const };

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
