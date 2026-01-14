'use client';

import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SkipNextIcon from '@mui/icons-material/SkipNext';

import type { JobOperation } from '@/types/job';

interface SkipOperationDialogProps {
  open: boolean;
  operation: JobOperation | null;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  loading?: boolean;
}

export default function SkipOperationDialog({
  open,
  operation,
  onClose,
  onConfirm,
  loading = false,
}: SkipOperationDialogProps) {
  const [reason, setReason] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm(reason.trim() || undefined);
  };

  if (!operation) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Skip Operation?</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Are you sure you want to skip{' '}
          <strong>
            {operation.sequence}. {operation.operation_name}
          </strong>
          ?
        </Typography>

        <TextField
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={2}
          fullWidth
          size="small"
          placeholder="Why is this operation being skipped?"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="warning"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SkipNextIcon />}
        >
          {loading ? 'Skipping...' : 'Skip Operation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
