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
import Chip from '@mui/material/Chip';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ConflictInfo } from '@/types/import';

interface ConflictDialogProps {
  open: boolean;
  conflicts: ConflictInfo[];
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
  validRowsCount,
  totalRows,
  onCancel,
  onSkipConflicts,
}: ConflictDialogProps) {
  // Limit displayed conflicts
  const displayedConflicts = conflicts.slice(0, 20);
  const hasMoreConflicts = conflicts.length > 20;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Conflicts Detected
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{conflicts.length}</strong> row{conflicts.length > 1 ? 's' : ''} conflict with existing customers.
            These rows have a duplicate customer code or company name.
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {validRowsCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Can be imported
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="error.main">
              {conflicts.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Conflicts
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" color="text.secondary">
              {totalRows}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total rows
            </Typography>
          </Box>
        </Box>

        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Conflicting Rows
        </Typography>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Row</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer Code</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Conflict Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedConflicts.map((conflict) => (
                <TableRow key={conflict.row_number}>
                  <TableCell>{conflict.row_number}</TableCell>
                  <TableCell>{conflict.csv_customer_code || '—'}</TableCell>
                  <TableCell>{conflict.csv_name || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={
                        conflict.conflict_type === 'duplicate_code'
                          ? 'Duplicate Code'
                          : 'Duplicate Name'
                      }
                      size="small"
                      color="error"
                      variant="outlined"
                    />
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
          Import {validRowsCount} Non-Conflicting Rows
        </Button>
      </DialogActions>
    </Dialog>
  );
}
