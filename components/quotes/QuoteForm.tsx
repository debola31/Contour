'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Autocomplete from '@mui/material/Autocomplete';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import InputAdornment from '@mui/material/InputAdornment';
import type { QuoteFormData } from '@/types/quote';
import { calculateUnitPrice, calculateTotalPrice } from '@/types/quote';
import type { PricingTier } from '@/types/part';
import { createQuote, updateQuote, deleteQuote, getCustomerParts } from '@/utils/quotesAccess';
import { getAllCustomers } from '@/utils/customerAccess';

interface QuoteFormProps {
  mode: 'create' | 'edit';
  initialData: QuoteFormData;
  quoteId?: string;
}

interface CustomerOption {
  id: string;
  name: string;
  customer_code: string;
}

interface PartOption {
  id: string;
  part_number: string;
  description: string | null;
  pricing: PricingTier[];
}

export default function QuoteForm({ mode, initialData, quoteId }: QuoteFormProps) {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [formData, setFormData] = useState<QuoteFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Dropdown options
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingParts, setLoadingParts] = useState(false);

  // Selected objects for display
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [selectedPart, setSelectedPart] = useState<PartOption | null>(null);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await getAllCustomers(companyId);
        const customerOptions = data.map((c) => ({
          id: c.id,
          name: c.name,
          customer_code: c.customer_code,
        }));
        setCustomers(customerOptions);

        // If editing, find and set the selected customer
        if (initialData.customer_id) {
          const found = customerOptions.find((c) => c.id === initialData.customer_id);
          if (found) setSelectedCustomer(found);
        }
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };
    loadCustomers();
  }, [companyId, initialData.customer_id]);

  // Load parts when customer changes
  const loadParts = useCallback(async (customerId: string) => {
    if (!customerId) {
      setParts([]);
      return;
    }
    setLoadingParts(true);
    try {
      const data = await getCustomerParts(companyId, customerId);
      setParts(data);

      // If editing with existing part, find and set it
      if (initialData.part_id) {
        const found = data.find((p) => p.id === initialData.part_id);
        if (found) setSelectedPart(found);
      }
    } catch (err) {
      console.error('Error loading parts:', err);
    } finally {
      setLoadingParts(false);
    }
  }, [companyId, initialData.part_id]);

  useEffect(() => {
    if (formData.customer_id) {
      loadParts(formData.customer_id);
    }
  }, [formData.customer_id, loadParts]);

  // Auto-fill price when part or quantity changes
  useEffect(() => {
    if (formData.part_type === 'existing' && selectedPart?.pricing?.length) {
      const qty = parseInt(formData.quantity, 10) || 1;
      const suggestedPrice = calculateUnitPrice(selectedPart.pricing, qty);
      if (suggestedPrice !== null) {
        setFormData((prev) => ({
          ...prev,
          unit_price: String(suggestedPrice),
        }));
      }
    }
  }, [selectedPart, formData.quantity, formData.part_type]);

  // Auto-fill description from part
  useEffect(() => {
    if (
      formData.part_type === 'existing' &&
      selectedPart?.description &&
      !formData.description
    ) {
      setFormData((prev) => ({
        ...prev,
        description: selectedPart.description || '',
      }));
    }
  }, [selectedPart, formData.part_type, formData.description]);

  const handleChange =
    (field: keyof QuoteFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const handleCustomerChange = (_: unknown, value: CustomerOption | null) => {
    setSelectedCustomer(value);
    setSelectedPart(null);
    setFormData((prev) => ({
      ...prev,
      customer_id: value?.id || '',
      part_id: '',
    }));
    if (fieldErrors.customer_id) {
      setFieldErrors((prev) => ({ ...prev, customer_id: '' }));
    }
  };

  const handlePartChange = (_: unknown, value: PartOption | null) => {
    setSelectedPart(value);
    setFormData((prev) => ({
      ...prev,
      part_id: value?.id || '',
      description: value?.description || prev.description,
    }));
    if (fieldErrors.part_id) {
      setFieldErrors((prev) => ({ ...prev, part_id: '' }));
    }
  };

  const handlePartTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newType = e.target.value as 'existing' | 'adhoc';
    setSelectedPart(null);
    setFormData((prev) => ({
      ...prev,
      part_type: newType,
      part_id: '',
      part_number_text: '',
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.customer_id) {
      errors.customer_id = 'Customer is required';
    }

    if (formData.part_type === 'adhoc' && !formData.part_number_text.trim()) {
      errors.part_number_text = 'Part number is required for ad-hoc parts';
    }

    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 1) {
      errors.quantity = 'Quantity must be at least 1';
    }

    const price = formData.unit_price ? parseFloat(formData.unit_price) : null;
    if (price !== null && price < 0) {
      errors.unit_price = 'Price cannot be negative';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'create') {
        const quote = await createQuote(companyId, formData);
        router.push(`/dashboard/${companyId}/quotes/${quote.id}`);
      } else if (quoteId) {
        await updateQuote(quoteId, formData);
        router.push(`/dashboard/${companyId}/quotes/${quoteId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quoteId) return;

    setLoading(true);
    try {
      await deleteQuote(quoteId);
      router.push(`/dashboard/${companyId}/quotes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancel = () => {
    if (mode === 'edit' && quoteId) {
      router.push(`/dashboard/${companyId}/quotes/${quoteId}`);
    } else {
      router.push(`/dashboard/${companyId}/quotes`);
    }
  };

  // Calculate total for display
  const quantity = parseInt(formData.quantity, 10) || 0;
  const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : null;
  const totalPrice = calculateTotalPrice(quantity, unitPrice);

  const formatCurrency = (value: number | null): string => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Customer Selection */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Customer
          </Typography>
          <Autocomplete
            options={customers}
            getOptionLabel={(option) =>
              option.customer_code
                ? `${option.name} (${option.customer_code})`
                : option.name
            }
            value={selectedCustomer}
            onChange={handleCustomerChange}
            loading={loadingCustomers}
            disabled={loading}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Customer"
                required
                error={!!fieldErrors.customer_id}
                helperText={fieldErrors.customer_id}
              />
            )}
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Part Selection */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Part
          </Typography>

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">Part Type</FormLabel>
            <RadioGroup
              row
              value={formData.part_type}
              onChange={handlePartTypeChange}
            >
              <FormControlLabel
                value="existing"
                control={<Radio />}
                label="Existing Part"
                disabled={loading}
              />
              <FormControlLabel
                value="adhoc"
                control={<Radio />}
                label="New/Ad-hoc Part"
                disabled={loading}
              />
            </RadioGroup>
          </FormControl>

          {formData.part_type === 'existing' ? (
            <>
              <Autocomplete
                options={parts}
                getOptionLabel={(option) =>
                  option.description
                    ? `${option.part_number} - ${option.description}`
                    : option.part_number
                }
                value={selectedPart}
                onChange={handlePartChange}
                loading={loadingParts}
                disabled={loading || !formData.customer_id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Part"
                    error={!!fieldErrors.part_id}
                    helperText={
                      fieldErrors.part_id ||
                      (!formData.customer_id ? 'Select a customer first' : '')
                    }
                  />
                )}
                fullWidth
              />

              {/* Pricing Tiers Display */}
              {selectedPart?.pricing && selectedPart.pricing.length > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Pricing Tiers:
                  </Typography>
                  {[...selectedPart.pricing]
                    .sort((a, b) => a.qty - b.qty)
                    .map((tier, i) => (
                      <Typography key={i} variant="body2" color="text.secondary">
                        {tier.qty}+ units: {formatCurrency(tier.price)}/ea
                      </Typography>
                    ))}
                </Box>
              )}
            </>
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Part Number"
                  value={formData.part_number_text}
                  onChange={handleChange('part_number_text')}
                  error={!!fieldErrors.part_number_text}
                  helperText={fieldErrors.part_number_text}
                  disabled={loading}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleChange('description')}
                  multiline
                  rows={2}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Pricing
          </Typography>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                required
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                error={!!fieldErrors.quantity}
                helperText={fieldErrors.quantity}
                disabled={loading}
                slotProps={{
                  htmlInput: { min: 1 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Unit Price"
                type="number"
                value={formData.unit_price}
                onChange={handleChange('unit_price')}
                error={!!fieldErrors.unit_price}
                helperText={fieldErrors.unit_price}
                disabled={loading}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  },
                  htmlInput: { min: 0, step: 0.01 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={600}>
                  {formatCurrency(totalPrice)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Timeline
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Estimated Lead Time"
                type="number"
                value={formData.estimated_lead_time_days}
                onChange={handleChange('estimated_lead_time_days')}
                disabled={loading}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position="end">days</InputAdornment>,
                  },
                  htmlInput: { min: 0 },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Valid Until"
                type="date"
                value={formData.valid_until}
                onChange={handleChange('valid_until')}
                disabled={loading}
                slotProps={{
                  inputLabel: { shrink: true },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Notes
          </Typography>
          <TextField
            fullWidth
            label="Internal Notes"
            value={formData.notes}
            onChange={handleChange('notes')}
            multiline
            rows={3}
            disabled={loading}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {mode === 'edit' && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={loading}
          >
            Delete
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Save as Draft' : 'Save'}
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Quote?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this quote? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
