'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { RoutingNodeFormData, OperationNodeData } from '@/types/routings';

interface NodeEditModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: RoutingNodeFormData) => Promise<void>;
  nodeData: OperationNodeData | null;
}

/**
 * Modal for editing routing node details (times and instructions).
 * The operation type cannot be changed here - nodes must be deleted and re-added.
 */
export default function NodeEditModal({
  open,
  onClose,
  onSave,
  nodeData,
}: NodeEditModalProps) {
  const [formData, setFormData] = useState<RoutingNodeFormData>({
    operation_type_id: '',
    setup_time: '',
    run_time_per_unit: '',
    instructions: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open && nodeData) {
      setFormData({
        operation_type_id: nodeData.operationTypeId,
        setup_time: nodeData.setupTime !== null ? String(nodeData.setupTime) : '',
        run_time_per_unit:
          nodeData.runTimePerUnit !== null ? String(nodeData.runTimePerUnit) : '',
        instructions: nodeData.instructions || '',
      });
      setErrors({});
    }
  }, [open, nodeData]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate setup_time if provided
    if (formData.setup_time && isNaN(parseFloat(formData.setup_time))) {
      newErrors.setup_time = 'Must be a valid number';
    } else if (formData.setup_time && parseFloat(formData.setup_time) < 0) {
      newErrors.setup_time = 'Cannot be negative';
    }

    // Validate run_time_per_unit if provided
    if (formData.run_time_per_unit && isNaN(parseFloat(formData.run_time_per_unit))) {
      newErrors.run_time_per_unit = 'Must be a valid number';
    } else if (
      formData.run_time_per_unit &&
      parseFloat(formData.run_time_per_unit) < 0
    ) {
      newErrors.run_time_per_unit = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error('Error saving node:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!nodeData) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" component="span">
            Edit Operation
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {nodeData.operationName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Time Estimates Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Time Estimates
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Setup Time"
                value={formData.setup_time}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, setup_time: e.target.value }))
                }
                type="number"
                inputProps={{ min: 0, step: 0.5 }}
                error={!!errors.setup_time}
                helperText={errors.setup_time || 'Minutes'}
                disabled={saving}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Run Time per Unit"
                value={formData.run_time_per_unit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    run_time_per_unit: e.target.value,
                  }))
                }
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                error={!!errors.run_time_per_unit}
                helperText={errors.run_time_per_unit || 'Minutes per unit'}
                disabled={saving}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>

          {/* Instructions Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Work Instructions
            </Typography>
            <TextField
              label="Instructions"
              value={formData.instructions}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, instructions: e.target.value }))
              }
              multiline
              rows={4}
              fullWidth
              placeholder="Enter work instructions for this operation..."
              disabled={saving}
              helperText="Notes or instructions for operators performing this operation"
            />
          </Box>

          {/* Labor Rate Display (read-only) */}
          {nodeData.laborRate !== null && (
            <Box
              sx={{
                p: 2,
                bgcolor: 'rgba(70, 130, 180, 0.1)',
                borderRadius: 1,
                border: '1px solid rgba(70, 130, 180, 0.2)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Labor Rate: ${nodeData.laborRate.toFixed(2)}/hr
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Set in Operations configuration
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
