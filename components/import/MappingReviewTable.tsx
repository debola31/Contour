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
import type { MappingReviewTableProps } from './types';
import ConfidenceChip from './ConfidenceChip';
import StatusCards from './StatusCards';
import ReassignmentDialog from './ReassignmentDialog';

/**
 * Unified table for reviewing and editing AI-suggested column mappings.
 * Works for both customers and parts imports.
 *
 * Features:
 * - 4-column layout: CSV Column, Maps To, Confidence, Reasoning
 * - Status cards for unmapped optional and discarded columns
 * - Row highlighting on dropdown interaction
 * - Rich ConfidenceChip with icons
 */
export default function MappingReviewTable({
  mappings,
  fields,
  unmappedRequired,
  unmappedOptional,
  discardedColumns,
  onMappingChange,
}: MappingReviewTableProps) {
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    csvColumn: string;
    newDbField: string;
    existingCsvColumn: string;
  } | null>(null);

  // Track which row has its dropdown open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Get which db fields are already assigned
  const assignedFields = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.db_field) {
      assignedFields.set(m.db_field, m.csv_column);
    }
  });

  // Count rows needing review
  const needsReviewCount = mappings.filter(
    (m) => m.needs_review && m.db_field !== null
  ).length;

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

  // Get row styling based on state
  const getRowSx = (csvColumn: string, needsReview: boolean, hasMapping: boolean) => {
    const isDropdownOpen = openDropdown === csvColumn;
    return {
      bgcolor: isDropdownOpen
        ? 'rgba(70, 130, 180, 0.15)'
        : needsReview && hasMapping
          ? 'rgba(245, 158, 11, 0.1)'
          : 'transparent',
      outline: isDropdownOpen ? '2px solid rgba(70, 130, 180, 0.5)' : 'none',
      outlineOffset: '-2px',
      transition: 'background-color 0.15s, outline 0.15s',
    };
  };

  // Menu props for dropdown styling
  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: '#1a1f4a',
        backgroundImage: 'none',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
    },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Status Cards */}
      <StatusCards
        unmappedRequired={unmappedRequired}
        unmappedOptional={unmappedOptional}
        discardedColumns={discardedColumns}
        fields={fields}
      />

      {/* Needs Review Alert */}
      {needsReviewCount > 0 && (
        <Alert severity="warning">
          <Typography variant="body2">
            {needsReviewCount} column{needsReviewCount > 1 ? 's' : ''} need
            {needsReviewCount === 1 ? 's' : ''} review (highlighted in yellow below)
          </Typography>
        </Alert>
      )}

      {/* Column Mappings Table */}
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
                  <TableCell sx={{ fontWeight: 600 }}>Maps To</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Confidence</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reasoning</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/* Column Mapping Rows */}
                {mappings.map((mapping) => (
                  <TableRow
                    key={mapping.csv_column}
                    sx={getRowSx(
                      mapping.csv_column,
                      mapping.needs_review,
                      !!mapping.db_field
                    )}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {mapping.csv_column}
                      </Typography>
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
                          onOpen={() => setOpenDropdown(mapping.csv_column)}
                          onClose={() => setOpenDropdown(null)}
                          displayEmpty
                          MenuProps={menuProps}
                          renderValue={(selected) => {
                            if (!selected) {
                              return <em>Skip (don&apos;t import)</em>;
                            }
                            const field = fields.find((f) => f.key === selected);
                            return field
                              ? `${field.label}${field.required ? ' *' : ''}`
                              : selected;
                          }}
                        >
                          <MenuItem value="">
                            <em>Skip (don&apos;t import)</em>
                          </MenuItem>
                          {fields.map((field) => {
                            const isAssigned = assignedFields.has(field.key);
                            const assignedTo = assignedFields.get(field.key);
                            const isCurrentlySelected = mapping.db_field === field.key;
                            const isDisabled = field.disabled;

                            return (
                              <MenuItem
                                key={field.key}
                                value={field.key}
                                disabled={isDisabled}
                                sx={{
                                  bgcolor:
                                    isAssigned && !isCurrentlySelected
                                      ? 'rgba(245, 158, 11, 0.1)'
                                      : 'transparent',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  opacity: isDisabled ? 0.5 : 1,
                                }}
                              >
                                <Typography variant="body1">
                                  {field.label}
                                  {field.required ? ' *' : ''}
                                </Typography>
                                {isAssigned && !isCurrentlySelected && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: 'warning.main' }}
                                  >
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
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {mapping.reasoning}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Reassignment Confirmation Dialog */}
      <ReassignmentDialog
        open={confirmDialog?.open || false}
        csvColumn={confirmDialog?.csvColumn || ''}
        newDbField={confirmDialog?.newDbField || ''}
        existingCsvColumn={confirmDialog?.existingCsvColumn || ''}
        fieldLabel={
          fields.find((f) => f.key === confirmDialog?.newDbField)?.label || ''
        }
        onCancel={() => setConfirmDialog(null)}
        onConfirm={handleConfirmReassign}
      />
    </Box>
  );
}
