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
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid';
import SearchableSelect, { type SelectOption } from '@/components/common/SearchableSelect';
import {
  type RoutingFormData,
  type Routing,
  EMPTY_ROUTING_FORM,
  routingToFormData,
} from '@/types/routings';
import {
  createRouting,
  updateRouting,
  deleteRouting,
  checkRoutingNameExists,
  getRouting,
} from '@/utils/routingsAccess';
import { getAllParts } from '@/utils/partsAccess';
import type { Part } from '@/types/part';

interface RoutingFormProps {
  companyId: string;
  routingId?: string;
  initialData?: RoutingFormData;
  onCancel: () => void;
  onSaved: (routingId: string) => void;
}

export default function RoutingForm({
  companyId,
  routingId,
  initialData,
  onCancel,
  onSaved,
}: RoutingFormProps) {
  const router = useRouter();
  const isEdit = !!routingId;

  const [formData, setFormData] = useState<RoutingFormData>(
    initialData || EMPTY_ROUTING_FORM
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parts for dropdown
  const [parts, setParts] = useState<Part[]>([]);
  const [loadingParts, setLoadingParts] = useState(true);

  // Load parts for dropdown
  useEffect(() => {
    async function loadParts() {
      try {
        const data = await getAllParts(companyId);
        setParts(data);
      } catch (err) {
        console.error('Failed to load parts:', err);
      } finally {
        setLoadingParts(false);
      }
    }
    loadParts();
  }, [companyId]);

  // Validate form
  const validate = async (): Promise<boolean> => {
    const errors: Record<string, string> = {};

    // Required: name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else {
      // Check uniqueness
      const exists = await checkRoutingNameExists(
        companyId,
        formData.name.trim(),
        routingId
      );
      if (exists) {
        errors.name = 'A routing with this name already exists';
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
      if (isEdit && routingId) {
        const updated = await updateRouting(routingId, formData);
        savedId = updated.id;
      } else {
        const created = await createRouting(companyId, formData);
        savedId = created.id;
      }
      onSaved(savedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save routing');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!routingId) return;

    if (!confirm('Are you sure you want to delete this routing? This will also delete all operations in the workflow.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteRouting(routingId);
      router.push(`/dashboard/${companyId}/routings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete routing');
      setLoading(false);
    }
  };

  const partOptions: SelectOption[] = parts.map((p) => ({
    id: p.id,
    label: `${p.part_number}${p.description ? ` - ${p.description}` : ''}`,
  }));

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Basic Information Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Routing Information
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                fullWidth
                disabled={loading}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name || 'e.g., Standard Widget Process'}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <SearchableSelect
                options={partOptions}
                value={formData.part_id}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, part_id: value }))
                }
                label="Part"
                disabled={loading || loadingParts}
                loading={loadingParts}
                allowNone
                noneLabel="No Part (Standalone Routing)"
                helperText="Link this routing to a specific part"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_default}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        is_default: e.target.checked,
                      }))
                    }
                    disabled={loading || !formData.part_id}
                  />
                }
                label="Set as default routing for this part"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                fullWidth
                multiline
                rows={3}
                disabled={loading}
                helperText="Additional notes about this routing"
              />
            </Grid>
          </Grid>
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
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Routing'}
        </Button>
      </Box>
    </Box>
  );
}
