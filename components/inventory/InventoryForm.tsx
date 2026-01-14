'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type {
  InventoryItem,
  InventoryItemWithRelations,
  InventoryItemFormData,
  UnitConversionFormData,
} from '@/types/inventory';
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  checkSkuExists,
} from '@/utils/inventoryAccess';
import { UNITS_BY_CATEGORY, getSuggestedConversionFactor } from '@/lib/unitPresets';

interface InventoryFormProps {
  mode: 'create' | 'edit';
  companyId: string;
  initialData: InventoryItemFormData;
  itemId?: string;
  item?: InventoryItemWithRelations;
  onSuccess?: (item?: InventoryItem) => void;
  onCancel?: () => void;
}

export default function InventoryForm({
  mode,
  companyId,
  initialData,
  itemId,
  item,
  onSuccess,
  onCancel,
}: InventoryFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<InventoryItemFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  // Build unit options from presets
  const unitOptions = UNITS_BY_CATEGORY.flatMap((category) =>
    category.units.map((unit) => ({
      value: unit,
      label: unit,
      category: category.category,
    }))
  );

  const handleChange =
    (field: keyof InventoryItemFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (field === 'quantity' || field === 'cost_per_unit') {
        // Handle numeric fields
        setFormData((prev) => ({
          ...prev,
          [field]: value === '' ? (field === 'quantity' ? 0 : null) : parseFloat(value),
        }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }
      // Clear field error
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUnit = e.target.value;
    setFormData((prev) => ({ ...prev, primary_unit: newUnit }));
    // Clear field error
    if (fieldErrors.primary_unit) {
      setFieldErrors((prev) => ({ ...prev, primary_unit: '' }));
    }
  };

  // Unit conversion handlers
  const handleAddConversion = () => {
    // Find a unit that isn't already used
    const usedUnits = new Set([formData.primary_unit, ...formData.unit_conversions.map((c) => c.from_unit)]);
    const availableUnit = unitOptions.find((u) => !usedUnits.has(u.value))?.value || '';

    const suggestedFactor = availableUnit
      ? getSuggestedConversionFactor(availableUnit, formData.primary_unit)
      : 1;

    setFormData((prev) => ({
      ...prev,
      unit_conversions: [
        ...prev.unit_conversions,
        { from_unit: availableUnit, to_primary_factor: suggestedFactor },
      ],
    }));
  };

  const handleRemoveConversion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      unit_conversions: prev.unit_conversions.filter((_, i) => i !== index),
    }));
  };

  const handleConversionChange = (
    index: number,
    field: keyof UnitConversionFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      unit_conversions: prev.unit_conversions.map((conv, i) => {
        if (i !== index) return conv;

        if (field === 'from_unit') {
          // When changing the unit, suggest a conversion factor
          const suggestedFactor = getSuggestedConversionFactor(value, formData.primary_unit);
          return { ...conv, from_unit: value, to_primary_factor: suggestedFactor };
        } else {
          return { ...conv, to_primary_factor: parseFloat(value) || 1 };
        }
      }),
    }));
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    // Name required
    if (!formData.name.trim()) {
      errors.name = 'Item name is required';
    }

    // Primary unit required
    if (!formData.primary_unit.trim()) {
      errors.primary_unit = 'Primary unit is required';
    }

    // Quantity must be non-negative
    if (formData.quantity < 0) {
      errors.quantity = 'Quantity cannot be negative';
    }

    // Cost must be non-negative if provided
    if (formData.cost_per_unit !== null && formData.cost_per_unit < 0) {
      errors.cost_per_unit = 'Cost cannot be negative';
    }

    // Check SKU uniqueness if provided
    if (formData.sku.trim()) {
      try {
        const exists = await checkSkuExists(companyId, formData.sku, mode === 'edit' ? itemId : undefined);
        if (exists) {
          errors.sku = 'This SKU is already in use';
        }
      } catch {
        setError('Error validating SKU');
        return false;
      }
    }

    // Validate unit conversions
    const conversionUnits = new Set<string>();
    for (let i = 0; i < formData.unit_conversions.length; i++) {
      const conv = formData.unit_conversions[i];
      if (!conv.from_unit) {
        errors[`conversion_${i}_unit`] = 'Unit is required';
      } else if (conv.from_unit === formData.primary_unit) {
        errors[`conversion_${i}_unit`] = 'Cannot convert from primary unit';
      } else if (conversionUnits.has(conv.from_unit)) {
        errors[`conversion_${i}_unit`] = 'Duplicate unit';
      } else {
        conversionUnits.add(conv.from_unit);
      }

      if (conv.to_primary_factor <= 0) {
        errors[`conversion_${i}_factor`] = 'Factor must be positive';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    const isValid = await validateForm();
    if (!isValid) return;

    setLoading(true);

    try {
      if (mode === 'create') {
        const newItem = await createInventoryItem(companyId, formData);
        if (onSuccess) {
          onSuccess(newItem);
        } else {
          router.push(`/dashboard/${companyId}/inventory/${newItem.id}`);
        }
      } else if (itemId) {
        const updatedItem = await updateInventoryItem(itemId, formData);
        if (onSuccess) {
          onSuccess(updatedItem);
        } else {
          router.push(`/dashboard/${companyId}/inventory/${itemId}`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemId) return;

    setLoading(true);
    try {
      await deleteInventoryItem(itemId);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/dashboard/${companyId}/inventory`);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'An error occurred',
        severity: 'error',
      });
      setDeleteDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/dashboard/${companyId}/inventory`);
    }
  };

  // Get available units for conversion (exclude primary and already-used units)
  const getAvailableUnitsForConversion = (currentIndex: number) => {
    const usedUnits = new Set([
      formData.primary_unit,
      ...formData.unit_conversions.filter((_, i) => i !== currentIndex).map((c) => c.from_unit),
    ]);
    return unitOptions.filter((u) => !usedUnits.has(u.value));
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="Item Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name || 'e.g., "4140 Steel Bar", "Aluminum 6061 Sheet"'}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="SKU"
                value={formData.sku}
                onChange={handleChange('sku')}
                error={!!fieldErrors.sku}
                helperText={fieldErrors.sku || 'Optional internal identifier code'}
                disabled={loading}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleChange('description')}
                disabled={loading}
                multiline
                rows={2}
                placeholder="Detailed description of this inventory item"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Units & Quantity */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Units & Quantity
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                required
                label="Primary Unit"
                value={formData.primary_unit}
                onChange={handleUnitChange}
                error={!!fieldErrors.primary_unit}
                helperText={fieldErrors.primary_unit || 'Base unit for this item'}
                disabled={loading || (mode === 'edit' && (item?.transaction_count || 0) > 0)}
              >
                {UNITS_BY_CATEGORY.map((category) => [
                  <MenuItem key={`header-${category.category}`} disabled sx={{ fontWeight: 600, opacity: 1 }}>
                    {category.category}
                  </MenuItem>,
                  ...category.units.map((unit) => (
                    <MenuItem key={unit} value={unit} sx={{ pl: 4 }}>
                      {unit}
                    </MenuItem>
                  )),
                ])}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleChange('quantity')}
                error={!!fieldErrors.quantity}
                helperText={fieldErrors.quantity || (mode === 'edit' ? 'Use transactions to adjust' : 'Initial quantity')}
                disabled={loading || mode === 'edit'}
                InputProps={{
                  endAdornment: formData.primary_unit ? (
                    <InputAdornment position="end">{formData.primary_unit}</InputAdornment>
                  ) : undefined,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label="Cost per Unit"
                type="number"
                value={formData.cost_per_unit ?? ''}
                onChange={handleChange('cost_per_unit')}
                error={!!fieldErrors.cost_per_unit}
                helperText={fieldErrors.cost_per_unit || 'Cost per primary unit'}
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Unit Conversions */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Unit Conversions
            </Typography>
            <Button startIcon={<AddIcon />} onClick={handleAddConversion} disabled={loading} size="small">
              Add Conversion
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Define how other units convert to your primary unit ({formData.primary_unit || '...'})
          </Typography>

          {formData.unit_conversions.length > 0 ? (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>From Unit</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Conversion Factor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Preview</TableCell>
                  <TableCell width={60}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formData.unit_conversions.map((conv, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={conv.from_unit}
                        onChange={(e) => handleConversionChange(index, 'from_unit', e.target.value)}
                        disabled={loading}
                        error={!!fieldErrors[`conversion_${index}_unit`]}
                        sx={{ minWidth: 120 }}
                      >
                        {conv.from_unit && (
                          <MenuItem value={conv.from_unit}>{conv.from_unit}</MenuItem>
                        )}
                        {getAvailableUnitsForConversion(index).map((u) => (
                          <MenuItem key={u.value} value={u.value}>
                            {u.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={conv.to_primary_factor}
                        onChange={(e) => handleConversionChange(index, 'to_primary_factor', e.target.value)}
                        disabled={loading}
                        error={!!fieldErrors[`conversion_${index}_factor`]}
                        inputProps={{ min: 0.0001, step: 0.0001 }}
                        sx={{ width: 140 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        1 {conv.from_unit || '?'} = {conv.to_primary_factor} {formData.primary_unit || '?'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveConversion(index)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No additional unit conversions defined. Click &quot;Add Conversion&quot; to define secondary units.
            </Typography>
          )}
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
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Inventory Item?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete &quot;{formData.name}&quot;?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. Transaction history will remain for audit purposes
            but will no longer be linked to this item.
          </Alert>
          {item && (item.transaction_count || 0) > 0 && (
            <Alert severity="info">
              This item has {item.transaction_count} transaction
              {item.transaction_count !== 1 ? 's' : ''} in its history.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
