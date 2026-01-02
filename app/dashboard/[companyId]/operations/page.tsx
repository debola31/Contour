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
import BuildIcon from '@mui/icons-material/Build';

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

import { getAllOperations, deleteOperation, bulkDeleteOperations } from '@/utils/operationsAccess';
import ResourceGroupModal from '@/components/operations/ResourceGroupModal';
import type { OperationWithGroup, ResourceGroup } from '@/types/operations';

export default function OperationsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [operations, setOperations] = useState<OperationWithGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({
    field: 'name',
    sort: 'asc',
  });

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Grid ref for API access
  const gridRef = useRef<AgGridReact<OperationWithGroup>>(null);

  // Group modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ResourceGroup | null>(null);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    operationId?: string;
    operationName?: string;
  }>({ open: false, type: 'single' });
  const [deleting, setDeleting] = useState(false);

  // Snackbar for errors
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'success';
  }>({
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

  // Fetch operations
  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllOperations(companyId, searchDebounced, sortModel.field, sortModel.sort);
      setOperations(data);
    } catch (error) {
      console.error('Error fetching operations:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced, sortModel]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  }, [searchDebounced]);

  // Calculate grid height dynamically
  const gridHeight = useMemo(() => {
    if (loading || operations.length === 0) return 600;

    const headerHeight = 56;
    const rowHeight = 52;
    const paginationHeight = 56;
    const displayedRows = Math.min(operations.length, 25);

    return Math.max(headerHeight + rowHeight * displayedRows + paginationHeight, 400);
  }, [loading, operations.length]);

  const handleRowClick = (event: RowClickedEvent<OperationWithGroup>) => {
    if (event.data?.id) {
      router.push(`/dashboard/${companyId}/operations/${event.data.id}/edit`);
    }
  };

  const handleGridReady = (event: GridReadyEvent<OperationWithGroup>) => {
    event.api.applyColumnState({
      state: [{ colId: 'name', sort: 'asc' }],
      defaultState: { sort: null },
    });
  };

  const handleSortChanged = (event: SortChangedEvent) => {
    const columnState = event.api.getColumnState();
    const sortedColumn = columnState.find((col) => col.sort !== null);

    if (sortedColumn && sortedColumn.sort) {
      setSortModel({
        field: sortedColumn.colId || 'name',
        sort: sortedColumn.sort as 'asc' | 'desc',
      });
    } else {
      setSortModel({ field: 'name', sort: 'asc' });
    }
  };

  const handleSelectionChanged = (event: SelectionChangedEvent<OperationWithGroup>) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes
      .map((node) => node.data?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedIds(selectedData);
  };

  const handleDeleteClick = (e: React.MouseEvent, operation: OperationWithGroup) => {
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      type: 'single',
      operationId: operation.id,
      operationName: operation.name,
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
      if (deleteDialog.type === 'single' && deleteDialog.operationId) {
        await deleteOperation(deleteDialog.operationId);
      } else if (deleteDialog.type === 'bulk') {
        await bulkDeleteOperations(selectedIds as string[]);
        setSelectedIds([]);
        if (gridRef.current?.api) {
          gridRef.current.api.deselectAll();
        }
      }
      await fetchOperations();
      setDeleteDialog({ open: false, type: 'single' });
    } catch (error) {
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

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  };

  const handleGroupSaved = () => {
    setGroupModalOpen(false);
    setEditingGroup(null);
    fetchOperations(); // Refresh to show updated group names
  };

  const columnDefs: ColDef<OperationWithGroup>[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'code',
      headerName: 'Code',
      width: 120,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      colId: 'resource_group',
      headerName: 'Resource Group',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => {
        if (!params.data) return '—';
        return params.data.resource_group?.name ?? 'Ungrouped';
      },
    },
    {
      field: 'labor_rate',
      headerName: 'Labor Rate',
      width: 150,
      valueFormatter: (params) =>
        params.value != null ? `$${Number(params.value).toFixed(2)}/hr` : '—',
    },
    {
      colId: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<OperationWithGroup>) => {
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
          placeholder="Search operations..."
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
          onClick={() => router.push(`/dashboard/${companyId}/operations/import`)}
        >
          Import
        </Button>

        <Button variant="outlined" onClick={handleCreateGroup}>
          + New Group
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/operations/new`)}
        >
          New Operation
        </Button>
      </Box>

      {/* Data Grid or Empty State */}
      {!loading && operations.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No operations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchDebounced
                ? 'No operations match your search.'
                : 'Create your first operation or import from CSV.'}
            </Typography>
            {!searchDebounced && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => router.push(`/dashboard/${companyId}/operations/import`)}
                >
                  Import CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => router.push(`/dashboard/${companyId}/operations/new`)}
                >
                  Add Operation
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
            <AgGridReact<OperationWithGroup>
              ref={gridRef}
              rowData={operations}
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
        </Card>
      )}

      {/* Resource Group Modal */}
      <ResourceGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onSaved={handleGroupSaved}
        companyId={companyId}
        group={editingGroup}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, type: 'single' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          {deleteDialog.type === 'single' ? 'Delete Operation' : 'Delete Operations'}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {deleteDialog.type === 'single' ? (
                <>
                  Are you sure you want to delete <strong>{deleteDialog.operationName}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedIds.length}</strong> operation
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
