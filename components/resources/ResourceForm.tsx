'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import {
  createResource,
  updateResource,
  deleteResource,
  getResourceGroups,
  checkResourceNameExists,
  getResourceWithRelations,
} from '@/utils/resourcesAccess';
import type {
  ResourceFormData,
  ResourceGroup,
  EMPTY_RESOURCE_FORM,
} from '@/types/resources';

interface ResourceFormProps {
  companyId: string;
  resourceId?: string; // undefined for create mode
  initialData: ResourceFormData;
  onCancel: () => void;
  onSaved: (resourceId: string) => void;
}

/**
 * Form for creating/editing resources.
 */
export default function ResourceForm({
  companyId,
  resourceId,
  initialData,
  onCancel,
  onSaved,
}: ResourceFormProps) {
  const router = useRouter();
  const isEdit = !!resourceId;

  const [formData, setFormData] = useState<ResourceFormData>(initialData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Load resource groups for dropdown
  useEffect(() => {
    async function loadGroups() {
      try {
        const data = await getResourceGroups(companyId);
        setGroups(data);
      } catch (err) {
        console.error('Failed to load resource groups:', err);
      } finally {
        setLoadingGroups(false);
      }
    }
    loadGroups();
  }, [companyId]);

  // Handle field change
  const handleChange = (field: keyof ResourceFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validate = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    // Required: name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else {
      // Check uniqueness
      const exists = await checkResourceNameExists(
        companyId,
        formData.name.trim(),
        resourceId
      );
      if (exists) {
        errors.name = 'A resource with this name already exists';
      }
    }

    // Validate labor rate (if provided)
    if (formData.labor_rate) {
      const rate = parseFloat(formData.labor_rate);
      if (isNaN(rate)) {
        errors.labor_rate = 'Invalid number';
      } else if (rate < 0) {
        errors.labor_rate = 'Rate cannot be negative';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const isValid = await validate();
    if (!isValid) return;

    setLoading(true);

    try {
      let savedId: string;
      if (isEdit && resourceId) {
        const updated = await updateResource(resourceId, formData);
        savedId = updated.id;
      } else {
        const created = await createResource(companyId, formData);
        savedId = created.id;
      }
      onSaved(savedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!resourceId) return;

    // Check for relations
    const resourceWithRelations = await getResourceWithRelations(resourceId);
    if (resourceWithRelations && resourceWithRelations.routing_operations_count > 0) {
      setError(
        `Cannot delete: This resource is used in ${resourceWithRelations.routing_operations_count} routing operation(s).`
      );
      return;
    }

    if (!confirm('Are you sure you want to delete this resource?')) return;

    setLoading(true);
    try {
      await deleteResource(resourceId);
      router.push(`/dashboard/${companyId}/resources`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={handleChange('name')}
                required
                fullWidth
                disabled={loading}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name || 'e.g., HURCO Mill, Mazak Lathe'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Code"
                value={formData.code}
                onChange={handleChange('code')}
                fullWidth
                disabled={loading}
                error={!!fieldErrors.code}
                helperText={fieldErrors.code || 'Short code for display (optional)'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Resource Group"
                value={formData.resource_group_id}
                onChange={handleChange('resource_group_id')}
                fullWidth
                disabled={loading || loadingGroups}
                helperText="Category for this resource (optional)"
              >
                <MenuItem value="">
                  <em>None (Ungrouped)</em>
                </MenuItem>
                {groups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Labor Rate"
                value={formData.labor_rate}
                onChange={handleChange('labor_rate')}
                fullWidth
                disabled={loading}
                error={!!fieldErrors.labor_rate}
                helperText={fieldErrors.labor_rate || 'Hourly rate in dollars'}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    endAdornment: <InputAdornment position="end">/hr</InputAdornment>,
                  },
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Description */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Description
          </Typography>
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            helperText="Additional notes about this resource"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {isEdit && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            Delete
          </Button>
        )}
        <Box flex={1} />
        <Button variant="outlined" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Resource'}
        </Button>
      </Box>
    </Box>
  );
}
