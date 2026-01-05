'use client';

import { useState, useEffect } from 'react';
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
import { getRoutingsForPart } from '@/utils/jobsAccess';

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
  const [routingId, setRoutingId] = useState('');
  const [routings, setRoutings] = useState<Array<{ id: string; name: string; is_default: boolean }>>([]);
  const [loadingRoutings, setLoadingRoutings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch routings when modal opens and quote has a part
  useEffect(() => {
    const fetchRoutings = async () => {
      if (!open || !quote.part_id) {
        setRoutings([]);
        setRoutingId('');
        return;
      }

      setLoadingRoutings(true);
      try {
        const data = await getRoutingsForPart(quote.company_id, quote.part_id);
        setRoutings(data);
        // Auto-select default routing
        const defaultRouting = data.find(r => r.is_default);
        if (defaultRouting) {
          setRoutingId(defaultRouting.id);
        } else if (data.length > 0) {
          setRoutingId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching routings:', err);
      } finally {
        setLoadingRoutings(false);
      }
    };
    fetchRoutings();
  }, [open, quote.part_id, quote.company_id]);

  const handleConvert = async () => {
    setLoading(true);
    setError(null);

    try {
      const jobData: ConvertToJobData = {
        due_date: dueDate || '',
        priority,
        routing_id: routingId || undefined,
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
      setRoutingId('');
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
              {quote.parts?.part_number || '—'}
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

            {/* Routing Selector - only show if part has routings */}
            {quote.part_id && (
              <FormControl fullWidth disabled={loading || loadingRoutings}>
                <InputLabel>Routing</InputLabel>
                <Select
                  value={routingId}
                  label="Routing"
                  onChange={(e) => setRoutingId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>No routing</em>
                  </MenuItem>
                  {routings.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                      {r.is_default && ' (Default)'}
                    </MenuItem>
                  ))}
                </Select>
                {routings.length === 0 && !loadingRoutings && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                    No routings defined for this part
                  </Typography>
                )}
                {routingId && (
                  <Typography variant="caption" color="primary" sx={{ mt: 0.5, ml: 1.5 }}>
                    Operations will be copied from routing to job
                  </Typography>
                )}
              </FormControl>
            )}
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
