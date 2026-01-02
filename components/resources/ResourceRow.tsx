'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Resource } from '@/types/resources';

interface ResourceRowProps {
  resource: Resource;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Formats labor rate for display.
 * Returns dash for null/undefined rates.
 */
function formatRate(rate: number | null): string {
  if (rate === null || rate === undefined) return '—';
  return `$${rate.toFixed(2)}/hr`;
}

/**
 * Single resource row displayed within an accordion.
 */
export default function ResourceRow({ resource, onEdit, onDelete }: ResourceRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        px: 3,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      {/* Name and code */}
      <Box flex={2} minWidth={0}>
        <Typography variant="body1" noWrap>
          {resource.name}
        </Typography>
        {resource.code && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {resource.code}
          </Typography>
        )}
      </Box>

      {/* Labor rate */}
      <Box flex={1} minWidth={80}>
        <Typography variant="body2" color="text.secondary">
          {formatRate(resource.labor_rate)}
        </Typography>
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Edit">
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={onDelete} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
