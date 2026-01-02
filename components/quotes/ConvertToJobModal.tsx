'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import type { QuoteWithRelations, ConvertToJobData } from '@/types/quote';
import { convertQuoteToJob } from '@/utils/quotesAccess';

interface ConvertToJobModalProps {
  open: boolean;
  onClose: () => void;
  quote: QuoteWithRelations;
  onConverted: (jobId: string) => void;
}

export default function ConvertToJobModal({
  open,
  onClose,
  quote,
  onConverted,
}: ConvertToJobModalProps) {
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'rush'>('normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);

    try {
      const jobData: ConvertToJobData = {
        due_date: dueDate || '',
        priority,
        notes: notes?.trim() || '',
      };

      const result = await convertQuoteToJob(quote.id, jobData);
      onConverted(result.job.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert quote to job');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDueDate('');
      setPriority('normal');
      setNotes('');
      setError(null);
      onClose();
    }
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Convert to Job</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" gutterBottom>
            Create job from <strong>{quote.quote_number}</strong>?
          </Typography>

          {/* Quote Summary */}
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              p: 2,
              borderRadius: 1,
              my: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Customer:</strong> {quote.customers?.name || '—'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Part:</strong>{' '}
              {quote.parts?.part_number || quote.part_number_text || '—'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Quantity:</strong> {quote.quantity}
            </Typography>
            <Typography variant="body2">
              <strong>Total:</strong> {formatCurrency(quote.total_price)}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Job Details
          </Typography>

          {/* Job Details Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={loading}
              fullWidth
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />

            <FormControl fullWidth disabled={loading}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) =>
                  setPriority(e.target.value as 'low' | 'normal' | 'high' | 'rush')
                }
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="rush">Rush</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Additional Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              disabled={loading}
              fullWidth
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConvert}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creating...' : 'Create Job'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
