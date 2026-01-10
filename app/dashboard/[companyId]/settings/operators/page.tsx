'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import QrCodeIcon from '@mui/icons-material/QrCode';
import GroupIcon from '@mui/icons-material/Group';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  ICellRendererParams,
  SelectionChangedEvent,
  RowClickedEvent,
  CellKeyDownEvent,
} from 'ag-grid-community';

// Register AG Grid modules (required for v35+)
ModuleRegistry.registerModules([AllCommunityModule]);

import { jiggedAgGridTheme } from '@/lib/agGridTheme';
import { getSupabase } from '@/lib/supabase';
import ExportCsvButton from '@/components/common/ExportCsvButton';
import type { Operator } from '@/types/operator';

/**
 * Admin Operators List Page.
 *
 * AG Grid table for managing operator accounts.
 */
export default function OperatorsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const gridRef = useRef<AgGridReact<Operator>>(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    id?: string;
    name?: string;
  }>({ open: false, type: 'single' });
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'success';
  }>({ open: false, message: '', severity: 'success' });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load operators
  const loadOperators = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabase();
      let query = supabase
        .from('operators')
        .select('id, company_id, name, qr_code_id, is_active, last_login_at, created_at, updated_at')
        .eq('company_id', companyId)
        .order('name');

      if (searchDebounced) {
        query = query.ilike('name', `%${searchDebounced}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOperators(data || []);
    } catch (err) {
      console.error('Error loading operators:', err);
      setSnackbar({
        open: true,
        message: 'Failed to load operators',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced]);

  useEffect(() => {
    loadOperators();
  }, [loadOperators]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  }, [searchDebounced]);

  // Calculate grid height dynamically
  const gridHeight = useMemo(() => {
    if (loading || operators.length === 0) return 600;
    const headerHeight = 56;
    const rowHeight = 52;
    const paginationHeight = 56;
    const displayedRows = Math.min(operators.length, 25);
    return Math.max(headerHeight + rowHeight * displayedRows + paginationHeight, 400);
  }, [loading, operators.length]);

  // Delete operator(s)
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = getSupabase();

      if (deleteDialog.type === 'single' && deleteDialog.id) {
        const { error } = await supabase
          .from('operators')
          .delete()
          .eq('id', deleteDialog.id);

        if (error) throw error;

        setSnackbar({
          open: true,
          message: 'Operator deleted',
          severity: 'success',
        });
      } else if (deleteDialog.type === 'bulk') {
        const { error } = await supabase
          .from('operators')
          .delete()
          .in('id', selectedIds);

        if (error) throw error;

        setSnackbar({
          open: true,
          message: `${selectedIds.length} operator${selectedIds.length > 1 ? 's' : ''} deleted`,
          severity: 'success',
        });
        setSelectedIds([]);
        if (gridRef.current?.api) {
          gridRef.current.api.deselectAll();
        }
      }

      setDeleteDialog({ open: false, type: 'single' });
      loadOperators();
    } catch (err) {
      console.error('Error deleting operator(s):', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete operator(s)',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Selection change handler
  const handleSelectionChanged = (event: SelectionChangedEvent<Operator>) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes
      .map((node) => node.data?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedIds(selectedData);
  };

  // Row click navigation
  const handleRowClicked = (event: RowClickedEvent<Operator>) => {
    if (event.data) {
      router.push(`/dashboard/${companyId}/settings/operators/${event.data.id}`);
    }
  };

  // Keyboard navigation
  const handleCellKeyDown = (event: CellKeyDownEvent<Operator>) => {
    const keyboardEvent = event.event as KeyboardEvent | undefined;
    if (keyboardEvent?.key === 'Enter' && event.data) {
      router.push(`/dashboard/${companyId}/settings/operators/${event.data.id}`);
    }
  };

  // Bulk delete click handler
  const handleBulkDeleteClick = () => {
    setDeleteDialog({
      open: true,
      type: 'bulk',
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // AG Grid column definitions
  const columnDefs: ColDef<Operator>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1,
        minWidth: 150,
      },
      {
        field: 'is_active',
        headerName: 'Status',
        width: 120,
        cellRenderer: (params: ICellRendererParams<Operator>) => (
          <Chip
            label={params.value ? 'Active' : 'Inactive'}
            size="small"
            color={params.value ? 'success' : 'default'}
          />
        ),
      },
      {
        field: 'last_login_at',
        headerName: 'Last Login',
        width: 130,
        valueFormatter: (params) => formatRelativeTime(params.value),
      },
      {
        field: 'qr_code_id',
        headerName: 'QR Badge',
        width: 100,
        cellRenderer: (params: ICellRendererParams<Operator>) => (
          params.value ? (
            <QrCodeIcon color="primary" fontSize="small" />
          ) : (
            <span style={{ color: '#666' }}>—</span>
          )
        ),
      },
      {
        field: 'id',
        headerName: 'Actions',
        width: 120,
        sortable: false,
        cellRenderer: (params: ICellRendererParams<Operator>) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() =>
                router.push(
                  `/dashboard/${companyId}/settings/operators/${params.data?.id}`
                )
              }
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() =>
                setDeleteDialog({
                  open: true,
                  id: params.data?.id,
                  name: params.data?.name,
                })
              }
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    [companyId, router]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    []
  );

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <Box>
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          placeholder="Search operators..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() =>
            router.push(`/dashboard/${companyId}/settings/operators/new`)
          }
        >
          New Operator
        </Button>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* AG Grid */}
      {!loading && (
        <Box sx={{ height: 500 }}>
          <AgGridReact<Operator>
            ref={gridRef}
            rowData={operators}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            theme={jiggedAgGridTheme}
            onGridReady={onGridReady}
            rowSelection="single"
            animateRows
            suppressCellFocus
          />
        </Box>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false })}
      >
        <DialogTitle>Delete Operator</DialogTitle>
        <DialogContent>
          Are you sure you want to delete operator &quot;{deleteDialog.name}&quot;?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false })}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
