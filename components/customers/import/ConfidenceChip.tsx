'use client';

import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';

interface ConfidenceChipProps {
  confidence: number;
  reasoning?: string;
  size?: 'small' | 'medium';
  isManual?: boolean;
}

/**
 * Visual indicator for AI mapping confidence level or manual selection.
 * - Manual: Blue chip with "Manual" label
 * - >= 0.8: Green (high confidence)
 * - 0.5 - 0.79: Yellow (medium confidence, review suggested)
 * - < 0.5: Red (low confidence, manual selection needed)
 */
export default function ConfidenceChip({
  confidence,
  reasoning,
  size = 'small',
  isManual = false,
}: ConfidenceChipProps) {
  // Manual selection - show different indicator
  if (isManual) {
    const chip = (
      <Chip
        icon={<PersonIcon sx={{ fontSize: size === 'small' ? 14 : 18 }} />}
        label="Manual"
        color="info"
        size={size}
        variant="outlined"
        sx={{
          height: size === 'small' ? 24 : 32,
          fontSize: size === 'small' ? '0.75rem' : '0.875rem',
          fontWeight: 600,
        }}
      />
    );

    return (
      <Tooltip title="Manually selected by user" arrow>
        {chip}
      </Tooltip>
    );
  }

  // AI confidence
  const percentage = Math.round(confidence * 100);

  let color: 'success' | 'warning' | 'error';
  let Icon: typeof CheckCircleIcon;
  let label: string;

  if (confidence >= 0.8) {
    color = 'success';
    Icon = CheckCircleIcon;
    label = `${percentage}%`;
  } else if (confidence >= 0.5) {
    color = 'warning';
    Icon = WarningIcon;
    label = `${percentage}%`;
  } else {
    color = 'error';
    Icon = ErrorIcon;
    label = `${percentage}%`;
  }

  const chip = (
    <Chip
      icon={<Icon sx={{ fontSize: size === 'small' ? 14 : 18 }} />}
      label={label}
      color={color}
      size={size}
      sx={{
        height: size === 'small' ? 24 : 32,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        fontWeight: 600,
      }}
    />
  );

  if (reasoning) {
    return (
      <Tooltip title={reasoning} arrow>
        {chip}
      </Tooltip>
    );
  }

  return chip;
}
