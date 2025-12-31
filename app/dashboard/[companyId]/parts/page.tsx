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
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  ICellRendererParams,
} from 'ag-grid-community';

// Register AG Grid modules (required for v35+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom dark theme for Jigged using new Theming API
const jiggedDarkTheme = themeQuartz.withParams({
  backgroundColor: 'transparent',
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.02)',
  headerBackgroundColor: 'rgba(255, 255, 255, 0.05)',
  foregroundColor: '#ffffff',
  textColor: '#ffffff',
  headerTextColor: '#ffffff',
  borderColor: 'rgba(255, 255, 255, 0.12)',
  rowBorder: true,
  rowHoverColor: 'rgba(255, 255, 255, 0.04)',
  selectedRowBackgroundColor: 'rgba(90, 150, 201, 0.2)',
  rangeSelectionBackgroundColor: 'rgba(90, 150, 201, 0.3)',
  accentColor: '#4682B4',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 16,
  spacing: 8,
  cellHorizontalPadding: 16,
  rowHeight: 52,
  headerHeight: 56,
  iconSize: 20,
});

import { getAllParts, deletePart, bulkDeleteParts } from '@/utils/partsAccess';
import type { Part } from '@/types/part';

export default function PartsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({
    field: 'part_number',
    sort: 'asc',
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Grid ref for API access
  const gridRef = useRef<AgGridReact<Part>>(null);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    partId?: string;
    partNumber?: string;
  }>({ open: false, type: 'single' });
  const [deleting, setDeleting] = useState(false);

  // Snackbar for errors
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'error' | 'success' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch parts - uses batch fetching to get all data
  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllParts(
        companyId,
        undefined, // All customers
        searchDebounced,
        sortModel.field,
        sortModel.sort
      );
      setParts(data);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced, sortModel]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  }, [searchDebounced]);

  // Calculate grid height dynamically
  const gridHeight = useMemo(() => {
    if (loading || parts.length === 0) return 600;

    const headerHeight = 56;
    const rowHeight = 52;
    const paginationHeight = 56;
    const displayedRows = Math.min(parts.length, 25);

    return Math.max(headerHeight + rowHeight * displayedRows + paginationHeight, 400);
  }, [loading, parts.length]);

  const handleRowClick = (event: RowClickedEvent<Part>) => {
    if (event.data?.id) {
      router.push(`/dashboard/${companyId}/parts/${event.data.id}`);
    }
  };

  const handleGridReady = (event: GridReadyEvent<Part>) => {
    event.api.applyColumnState({
      state: [{ colId: 'part_number', sort: 'asc' }],
      defaultState: { sort: null },
    });
  };

  const handleSortChanged = (event: SortChangedEvent) => {
    const columnState = event.api.getColumnState();
    const sortedColumn = columnState.find((col) => col.sort !== null);

    if (sortedColumn && sortedColumn.sort) {
      setSortModel({
        field: sortedColumn.colId || 'part_number',
        sort: sortedColumn.sort as 'asc' | 'desc',
      });
    } else {
      setSortModel({ field: 'part_number', sort: 'asc' });
    }
  };

  const handleSelectionChanged = (event: SelectionChangedEvent<Part>) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes
      .map((node) => node.data?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedIds(selectedData);
  };

  const handleDeleteClick = (e: React.MouseEvent, part: Part) => {
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      type: 'single',
      partId: part.id,
      partNumber: part.part_number,
    });
  };

  const handleBulkDeleteClick = () => {
    setDeleteDialog({
      open: true,
      type: 'bulk',
    });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      if (deleteDialog.type === 'single' && deleteDialog.partId) {
        await deletePart(deleteDialog.partId);
      } else if (deleteDialog.type === 'bulk') {
        await bulkDeleteParts(selectedIds as string[]);
        setSelectedIds([]);
        if (gridRef.current?.api) {
          gridRef.current.api.deselectAll();
        }
      }
      await fetchParts();
      setDeleteDialog({ open: false, type: 'single' });
    } catch (error) {
      // Show error in snackbar
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'An error occurred',
        severity: 'error',
      });
      setDeleteDialog({ open: false, type: 'single' });
    } finally {
      setDeleting(false);
    }
  };

  const columnDefs: ColDef<Part>[] = [
    {
      field: 'part_number',
      headerName: 'Part Number',
      width: 180,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      colId: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        if (!params.data) return '';
        if (!params.data.customer_id) return '—';
        // Customer was deleted (SET NULL fired but we still have stale reference)
        if (!params.data.customer) return 'Unknown (deleted)';
        return `${params.data.customer.customer_code} - ${params.data.customer.name}`;
      },
    },
    {
      colId: 'pricing',
      headerName: 'Qty/Price',
      flex: 1,
      minWidth: 200,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<Part>) => {
        const pricing = params.data?.pricing;
        if (!pricing || pricing.length === 0) return '—';

        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              overflow: 'hidden',
              fontSize: '0.875rem',
            }}
          >
            {pricing.map((tier, idx) => (
              <Box key={idx} component="span" sx={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                {idx > 0 && (
                  <Box component="span" sx={{ color: 'text.disabled', mx: 0.5 }}>•</Box>
                )}
                <Box component="span" sx={{ color: 'text.secondary', mr: 0.5 }}>×{tier.qty}</Box>
                <Box component="span" sx={{ fontWeight: 500 }}>${tier.price.toFixed(2)}</Box>
              </Box>
            ))}
          </Box>
        );
      },
    },
    {
      field: 'material_cost',
      headerName: 'Material Cost',
      width: 150,
      valueFormatter: (params) => (params.value != null ? `$${params.value.toFixed(2)}` : '—'),
    },
    {
      colId: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<Part>) => {
        if (!params.data) return null;
        return (
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={(e) => handleDeleteClick(e, params.data!)}
              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      },
    },
  ];

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
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 300 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />

        {/* Bulk delete button - shows when items selected */}
        {selectedIds.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDeleteClick}
          >
            Delete ({selectedIds.length})
          </Button>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/parts/import`)}
        >
          Import
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/parts/new`)}
        >
          New Part
        </Button>
      </Box>

      {/* Data Grid or Empty State */}
      {!loading && parts.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No parts yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchDebounced
                ? 'No parts match your search.'
                : 'Create your first part or import from CSV.'}
            </Typography>
            {!searchDebounced && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => router.push(`/dashboard/${companyId}/parts/import`)}
                >
                  Import CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push(`/dashboard/${companyId}/parts/new`)}
                >
                  Add Part
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card elevation={2} sx={{ position: 'relative', minHeight: 600 }}>
          <Box
            sx={{
              width: '100%',
              height: gridHeight,
              minHeight: 500,
              '& .ag-root-wrapper': {
                border: 'none',
              },
              '& .ag-row': {
                cursor: 'pointer',
              },
              '& .ag-cell:focus, & .ag-header-cell:focus': {
                outline: 'none !important',
                border: 'none !important',
              },
            }}
          >
            <AgGridReact<Part>
              ref={gridRef}
              rowData={parts}
              columnDefs={columnDefs}
              theme={jiggedDarkTheme}
              defaultColDef={{
                sortable: true,
                resizable: true,
              }}
              rowSelection={{
                mode: 'multiRow',
                checkboxes: true,
                headerCheckbox: true,
                enableClickSelection: false,
                selectAll: 'all',
              }}
              onSelectionChanged={handleSelectionChanged}
              pagination={true}
              paginationPageSize={25}
              paginationPageSizeSelector={[25, 50, 100]}
              suppressPaginationPanel={false}
              domLayout="normal"
              onSortChanged={handleSortChanged}
              onRowClicked={handleRowClick}
              onGridReady={handleGridReady}
              loading={loading}
              suppressCellFocus={true}
              suppressMenuHide={false}
              getRowId={(params) => params.data.id}
              enableCellTextSelection={true}
              ensureDomOrder={true}
            />
          </Box>
          {/* Custom loading overlay */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(4px)',
                zIndex: 10,
                borderRadius: 1,
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, type: 'single' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          {deleteDialog.type === 'single' ? 'Delete Part' : 'Delete Parts'}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {deleteDialog.type === 'single' ? (
                <>
                  Are you sure you want to delete <strong>{deleteDialog.partNumber}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedIds.length}</strong> part
                  {selectedIds.length > 1 ? 's' : ''}?
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, type: 'single' })}
            disabled={deleting}
            color="inherit"
            size="large"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
            size="large"
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
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
