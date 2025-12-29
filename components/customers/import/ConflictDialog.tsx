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
import Alert from '@mui/material/Alert';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ConflictInfo, ValidationError } from '@/types/import';

interface ConflictDialogProps {
  open: boolean;
  conflicts: ConflictInfo[];
  validationErrors: ValidationError[];
  validRowsCount: number;
  totalRows: number;
  onCancel: () => void;
  onSkipConflicts: () => void;
}

/**
 * Dialog showing import conflicts and options for handling them.
 */
export default function ConflictDialog({
  open,
  conflicts,
  validationErrors,
  validRowsCount,
  totalRows,
  onCancel,
  onSkipConflicts,
}: ConflictDialogProps) {
  // Calculate unique rows with issues
  const conflictRowNumbers = new Set(conflicts.map((c) => c.row_number));
  const errorRowNumbers = new Set(validationErrors.map((e) => e.row_number));
  const totalSkippedRows = new Set([...conflictRowNumbers, ...errorRowNumbers]).size;

  // Limit displayed conflicts
  const displayedConflicts = conflicts.slice(0, 20);
  const hasMoreConflicts = conflicts.length > 20;

  // Separate CSV internal duplicates from DB duplicates for clearer messaging
  const csvDuplicates = conflicts.filter(
    (c) => c.conflict_type === 'csv_duplicate_code' || c.conflict_type === 'csv_duplicate_name'
  );
  const dbDuplicates = conflicts.filter(
    (c) => c.conflict_type === 'duplicate_code' || c.conflict_type === 'duplicate_name'
  );

  // Helper to get user-friendly conflict type label
  const getConflictLabel = (type: ConflictInfo['conflict_type']) => {
    switch (type) {
      case 'csv_duplicate_code':
        return 'Duplicate Code in CSV';
      case 'csv_duplicate_name':
        return 'Duplicate Name in CSV';
      case 'duplicate_code':
        return 'Code Exists in Database';
      case 'duplicate_name':
        return 'Name Exists in Database';
      default:
        return 'Duplicate';
    }
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Conflicts Detected
      </DialogTitle>
      <DialogContent>
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
                <TableCell sx={{ fontWeight: 600 }}>Customer Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conflict</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conflicting With</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedConflicts.map((conflict) => (
                <TableRow key={conflict.row_number}>
                  <TableCell>{conflict.row_number}</TableCell>
                  <TableCell>{conflict.csv_customer_code || '—'}</TableCell>
                  <TableCell>{conflict.csv_name || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {getConflictLabel(conflict.conflict_type)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {conflict.existing_value}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {hasMoreConflicts && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            ... and {conflicts.length - 20} more conflicts
          </Typography>
        )}
          </>
        )}

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
                  {validationErrors.slice(0, 20).map((error) => (
                    <TableRow key={error.row_number}>
                      <TableCell>{error.row_number}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error.main">
                          Missing: {error.field === 'customer_code' ? 'Customer Code' : 'Company Name'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {validationErrors.length > 20 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ... and {validationErrors.length - 20} more errors
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
          onClick={onSkipConflicts}
          variant="contained"
          color="primary"
          disabled={validRowsCount === 0}
        >
          Import {validRowsCount} Customers
        </Button>
      </DialogActions>
    </Dialog>
  );
}
