'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ColumnMapping } from '@/types/import';
import { CUSTOMER_FIELDS } from '@/types/import';
import ConfidenceChip from './ConfidenceChip';

interface MappingReviewTableProps {
  mappings: ColumnMapping[];
  onMappingChange: (csvColumn: string, dbField: string | null) => void;
  unmappedRequired: string[];
  unmappedOptional: string[];
  discardedColumns: string[];
}

/**
 * Table for reviewing and editing AI-suggested column mappings.
 * Shows three sections:
 * 1. Mapped columns with confidence indicators
 * 2. Alert for missing required fields
 * 3. Discarded columns list
 */
export default function MappingReviewTable({
  mappings,
  onMappingChange,
  unmappedRequired,
  unmappedOptional,
  discardedColumns,
}: MappingReviewTableProps) {
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    csvColumn: string;
    newDbField: string;
    existingCsvColumn: string;
  } | null>(null);

  // Get which db fields are already assigned
  const assignedFields = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.db_field) {
      assignedFields.set(m.db_field, m.csv_column);
    }
  });

  // Separate mapped and unmapped
  const needsReview = mappings.filter((m) => m.needs_review && m.db_field !== null);

  // Handle mapping change with duplicate check
  const handleMappingChange = (csvColumn: string, newDbField: string | null) => {
    if (newDbField && assignedFields.has(newDbField)) {
      const existingCsvColumn = assignedFields.get(newDbField)!;
      if (existingCsvColumn !== csvColumn) {
        // Show confirmation dialog
        setConfirmDialog({
          open: true,
          csvColumn,
          newDbField,
          existingCsvColumn,
        });
        return;
      }
    }
    onMappingChange(csvColumn, newDbField);
  };

  // Confirm reassignment
  const handleConfirmReassign = () => {
    if (confirmDialog) {
      // First, unassign the existing column
      onMappingChange(confirmDialog.existingCsvColumn, null);
      // Then assign the new column
      onMappingChange(confirmDialog.csvColumn, confirmDialog.newDbField);
      setConfirmDialog(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Missing Required Fields Alert */}
      {unmappedRequired.length > 0 && (
        <Alert severity="error">
          <Typography variant="body2" fontWeight={600}>
            Missing required fields:
          </Typography>
          <Typography variant="body2">
            {unmappedRequired
              .map((f) => CUSTOMER_FIELDS.find((cf) => cf.key === f)?.label || f)
              .join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Needs Review Alert */}
      {needsReview.length > 0 && (
        <Alert severity="warning">
          <Typography variant="body2">
            {needsReview.length} column{needsReview.length > 1 ? 's' : ''} need{needsReview.length === 1 ? 's' : ''} review (highlighted in yellow below)
          </Typography>
        </Alert>
      )}

      {/* Unmapped Optional Fields */}
      {unmappedOptional.length > 0 && (
        <Card elevation={1} sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              Optional fields that are missing ({unmappedOptional.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              These fields will be left empty for imported customers. You can proceed without mapping them.
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {unmappedOptional.map((fieldKey) => {
                const field = CUSTOMER_FIELDS.find((f) => f.key === fieldKey);
                return (
                  <Chip
                    key={fieldKey}
                    label={field?.label || fieldKey}
                    size="small"
                    color="warning"
                    variant="outlined"
                  />
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Discarded Columns */}
      {discardedColumns.length > 0 && (
        <Card elevation={1} sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              CSV columns that will be skipped ({discardedColumns.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {discardedColumns.map((col) => (
                <Chip
                  key={col}
                  label={col}
                  size="small"
                  variant="outlined"
                  sx={{ opacity: 0.7 }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Mapped Columns */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Column Mappings
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>CSV Column</TableCell>
                  <TableCell sx={{ width: 40 }} />
                  <TableCell sx={{ fontWeight: 600 }}>Maps To</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow
                    key={mapping.csv_column}
                    sx={{
                      bgcolor: mapping.needs_review && mapping.db_field
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {mapping.csv_column}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ArrowForwardIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={mapping.db_field || ''}
                          onChange={(e) =>
                            handleMappingChange(
                              mapping.csv_column,
                              e.target.value === '' ? null : e.target.value
                            )
                          }
                          displayEmpty
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1a1f4a',
                                backgroundImage: 'none',
                                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                              },
                            },
                          }}
                          renderValue={(selected) => {
                            if (!selected) {
                              return <em>Skip (don&apos;t import)</em>;
                            }
                            const field = CUSTOMER_FIELDS.find((f) => f.key === selected);
                            return field ? `${field.label}${field.required ? ' *' : ''}` : selected;
                          }}
                        >
                          <MenuItem value="">
                            <em>Skip (don&apos;t import)</em>
                          </MenuItem>
                          {CUSTOMER_FIELDS.map((field) => {
                            const isAssigned = assignedFields.has(field.key);
                            const assignedTo = assignedFields.get(field.key);
                            const isCurrentlySelected = mapping.db_field === field.key;

                            return (
                              <MenuItem
                                key={field.key}
                                value={field.key}
                                sx={{
                                  bgcolor: isAssigned && !isCurrentlySelected
                                    ? 'rgba(245, 158, 11, 0.1)'
                                    : 'transparent',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Typography variant="body1">
                                  {field.label}{field.required ? ' *' : ''}
                                </Typography>
                                {isAssigned && !isCurrentlySelected && (
                                  <Typography variant="caption" sx={{ color: 'warning.main' }}>
                                    Already assigned to &quot;{assignedTo}&quot;
                                  </Typography>
                                )}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {mapping.db_field && (
                        <ConfidenceChip
                          confidence={mapping.confidence}
                          reasoning={mapping.reasoning}
                          isManual={mapping.is_manual}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Reassignment */}
      <Dialog
        open={confirmDialog?.open || false}
        onClose={() => setConfirmDialog(null)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Field Already Assigned
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            <strong>
              {CUSTOMER_FIELDS.find((f) => f.key === confirmDialog?.newDbField)?.label}
            </strong>{' '}
            is already mapped to <strong>&quot;{confirmDialog?.existingCsvColumn}&quot;</strong>.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Do you want to reassign it to <strong>&quot;{confirmDialog?.csvColumn}&quot;</strong>?
            The previous mapping will be removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmReassign} variant="contained" color="warning">
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
