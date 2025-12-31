'use client';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ConflictDialogProps } from './types';

/**
 * Shared dialog for displaying import conflicts and validation errors.
 * Works for both customers and parts imports.
 */
export default function ConflictDialog<
  TConflict extends { row_number: number },
  TError extends { row_number: number; message?: string; field?: string }
>({
  open,
  conflicts,
  validationErrors,
  validRowsCount,
  totalRows,
  onCancel,
  onConfirm,
  entityName,
  conflictColumns,
  getConflictLabel,
  getErrorMessage,
}: ConflictDialogProps<TConflict, TError>) {
  // Calculate unique rows with issues
  const conflictRowNumbers = new Set(conflicts.map((c) => c.row_number));
  const errorRowNumbers = new Set(validationErrors.map((e) => e.row_number));
  const totalSkippedRows = new Set([...conflictRowNumbers, ...errorRowNumbers]).size;

  // Limit displayed items
  const maxDisplayed = 8;
  const displayedConflicts = conflicts.slice(0, maxDisplayed);
  const hasMoreConflicts = conflicts.length > maxDisplayed;
  const displayedErrors = validationErrors.slice(0, 5);
  const hasMoreErrors = validationErrors.length > 5;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Issues Detected
      </DialogTitle>
      <DialogContent>
        {/* Stats Row */}
        <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={600}>
              {validRowsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Can be imported
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={600} color="warning.main">
              {totalSkippedRows}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Will be skipped
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={600} color="text.secondary">
              {totalRows}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total rows
            </Typography>
          </Box>
        </Box>

        {/* Conflicts Table */}
        {conflicts.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Conflicting Rows ({conflicts.length})
            </Typography>
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                    {conflictColumns.map((col) => (
                      <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                        {col.label}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 600 }}>Conflict</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Conflicting With</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedConflicts.map((conflict, idx) => (
                    <TableRow key={`${conflict.row_number}-${idx}`}>
                      <TableCell>{conflict.row_number}</TableCell>
                      {conflictColumns.map((col) => (
                        <TableCell key={col.key}>
                          {(conflict as Record<string, unknown>)[col.key] as string || '—'}
                        </TableCell>
                      ))}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {getConflictLabel(conflict)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {(conflict as Record<string, unknown>).existing_value as string || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {hasMoreConflicts && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ... and {conflicts.length - maxDisplayed} more conflicts
              </Typography>
            )}
          </>
        )}

        {/* Validation Errors Table */}
        {validationErrors.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mt: 3 }}>
              Validation Errors ({validationErrors.length})
            </Typography>
            <TableContainer sx={{ maxHeight: 200 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedErrors.map((error, idx) => (
                    <TableRow key={`${error.row_number}-${idx}`}>
                      <TableCell>{error.row_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main">
                          {getErrorMessage(error)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {hasMoreErrors && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ... and {validationErrors.length - 5} more errors
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onCancel} color="inherit">
          Cancel Import
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="primary"
          disabled={validRowsCount === 0}
        >
          Import {validRowsCount} {entityName}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
