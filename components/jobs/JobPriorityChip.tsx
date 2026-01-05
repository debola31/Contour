import Chip from '@mui/material/Chip';
import type { JobPriority } from '@/types/job';
import { JOB_PRIORITY_CONFIG } from '@/types/job';

interface JobPriorityChipProps {
  priority: JobPriority;
  size?: 'small' | 'medium';
}

export default function JobPriorityChip({ priority, size = 'small' }: JobPriorityChipProps) {
  const config = JOB_PRIORITY_CONFIG[priority] || { label: priority, color: 'default' as const };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
}
