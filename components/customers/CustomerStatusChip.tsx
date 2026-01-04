'use client';

import Chip from '@mui/material/Chip';

interface CustomerStatusChipProps {
  isActive: boolean;
  size?: 'small' | 'medium';
}

export default function CustomerStatusChip({ isActive, size = 'small' }: CustomerStatusChipProps) {
  return (
    <Chip
      label={isActive ? 'Active' : 'Inactive'}
      size={size}
      sx={{
        bgcolor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(156, 163, 175, 0.15)',
        color: isActive ? 'success.main' : 'text.secondary',
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      }}
    />
  );
}
