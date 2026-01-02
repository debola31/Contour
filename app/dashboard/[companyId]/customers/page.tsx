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
import EditIcon from '@mui/icons-material/Edit';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  ICellRendererParams,
} from 'ag-grid-community';

// Register AG Grid modules (required for v35+)
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom dark theme for Jigged using new Theming API
const jiggedDarkTheme = themeQuartz.withParams({
  // Background colors
  backgroundColor: 'transparent',
  oddRowBackgroundColor: 'rgba(255, 255, 255, 0.02)',
  headerBackgroundColor: 'rgba(255, 255, 255, 0.05)',

  // Text colors
  foregroundColor: '#ffffff',
  textColor: '#ffffff',
  headerTextColor: '#ffffff',

  // Borders
  borderColor: 'rgba(255, 255, 255, 0.12)',
  rowBorder: true,

  // Selection and interaction
  rowHoverColor: 'rgba(255, 255, 255, 0.04)',
  selectedRowBackgroundColor: 'rgba(90, 150, 201, 0.2)',
  rangeSelectionBackgroundColor: 'rgba(90, 150, 201, 0.3)',

  // Accent color (Steel Blue)
  accentColor: '#4682B4',

  // Typography
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: 16,

  // Spacing
  spacing: 8,
  cellHorizontalPadding: 16,

  // Row and header heights
  rowHeight: 52,
  headerHeight: 56,

  // Icons
  iconSize: 20,
});

import { getAllCustomers, softDeleteCustomer, bulkSoftDeleteCustomers } from '@/utils/customerAccess';
import ExportCsvButton from '@/components/common/ExportCsvButton';
import type { Customer } from '@/types/customer';

export default function CustomersPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
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
  const gridRef = useRef<AgGridReact<Customer>>(null);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    customerId?: string;
    customerName?: string;
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

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers(
        companyId,
        'all',
        searchDebounced,
        sortModel.field,
        sortModel.sort
      );
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced, sortModel]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  }, [searchDebounced]);

  // Calculate grid height dynamically
  const gridHeight = useMemo(() => {
    if (loading || customers.length === 0) return 600;

    const headerHeight = 56;
    const rowHeight = 52;
    const paginationHeight = 56;
    const displayedRows = Math.min(customers.length, 25); // Show max 25 rows per page (default)

    return Math.max(
      headerHeight + (rowHeight * displayedRows) + paginationHeight,
      400
    );
  }, [loading, customers.length]);

  const handleGridReady = (event: GridReadyEvent<Customer>) => {
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

  const handleSelectionChanged = (event: SelectionChangedEvent<Customer>) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes
      .map((node) => node.data?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedIds(selectedData);
  };

  const handleEditCustomer = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    router.push(`/dashboard/${companyId}/customers/${customer.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation(); // Prevent row click
    setDeleteDialog({
      open: true,
      type: 'single',
      customerId: customer.id,
      customerName: customer.name,
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
      if (deleteDialog.type === 'single' && deleteDialog.customerId) {
        await softDeleteCustomer(deleteDialog.customerId);
      } else if (deleteDialog.type === 'bulk') {
        await bulkSoftDeleteCustomers(selectedIds as string[]);
        setSelectedIds([]);
        // Clear grid selection
        if (gridRef.current?.api) {
          gridRef.current.api.deselectAll();
        }
      }
      await fetchCustomers();
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

  const columnDefs: ColDef<Customer>[] = [
    {
      field: 'customer_code',
      headerName: 'Code',
      width: 120,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'contact_name',
      headerName: 'Contact',
      width: 250,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      field: 'contact_email',
      headerName: 'Email',
      flex: 2,
      minWidth: 200,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      field: 'contact_phone',
      headerName: 'Phone',
      width: 180,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      colId: 'location',
      headerName: 'Location',
      flex: 1.5,
      minWidth: 180,
      sortable: false,
      valueGetter: (params) => {
        if (!params.data) return '—';
        const parts = [params.data.city, params.data.state].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '—';
      },
    },
    {
      colId: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<Customer>) => {
        if (!params.data) return null;
        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={(e) => handleEditCustomer(e, params.data!)}
                sx={{ color: 'text.secondary' }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={(e) => handleDeleteClick(e, params.data!)}
                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
          placeholder="Search customers..."
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

        {/* Export and Delete buttons - show when items selected */}
        {selectedIds.length > 0 && (
          <>
            <ExportCsvButton
              gridRef={gridRef}
              fileName="customers-export"
              selectedCount={selectedIds.length}
            />
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleBulkDeleteClick}
            >
              Delete ({selectedIds.length})
            </Button>
          </>
        )}

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/customers/import`)}
        >
          Import
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/customers/new`)}
        >
          New Customer
        </Button>
      </Box>

      {/* Data Grid or Empty State */}
      {!loading && customers.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <PeopleOutlineIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No customers yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchDebounced
                ? 'No customers match your search.'
                : 'Create your first customer or import from CSV.'}
            </Typography>
            {!searchDebounced && (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() =>
                    router.push(`/dashboard/${companyId}/customers/import`)
                  }
                >
                  Import CSV
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    router.push(`/dashboard/${companyId}/customers/new`)
                  }
                >
                  Add Customer
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
              // Additional style overrides
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
            <AgGridReact<Customer>
              ref={gridRef}
              rowData={customers}
              columnDefs={columnDefs}
              theme={jiggedDarkTheme}
              defaultColDef={{
                sortable: true,
                resizable: true,
              }}
              // Row selection
              rowSelection={{
                mode: 'multiRow',
                checkboxes: true,
                headerCheckbox: true,
                enableClickSelection: false,
                selectAll: 'all',
              }}
              onSelectionChanged={handleSelectionChanged}
              // Pagination
              pagination={true}
              paginationPageSize={25}
              paginationPageSizeSelector={[25, 50, 100]}
              suppressPaginationPanel={false}
              domLayout="normal"
              // Sorting
              onSortChanged={handleSortChanged}
              // Grid ready
              onGridReady={handleGridReady}
              // Loading
              loading={loading}
              // Misc
              suppressCellFocus={true}
              suppressMenuHide={false}
              getRowId={(params) => params.data.id}
              // Accessibility
              enableCellTextSelection={true}
              ensureDomOrder={true}
            />
          </Box>
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
          {deleteDialog.type === 'single' ? 'Delete Customer' : 'Delete Customers'}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {deleteDialog.type === 'single' ? (
                <>
                  Are you sure you want to delete <strong>{deleteDialog.customerName}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedIds.length}</strong> customer{selectedIds.length > 1 ? 's' : ''}?
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
