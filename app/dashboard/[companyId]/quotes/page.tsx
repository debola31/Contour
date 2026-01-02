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
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  SelectionChangedEvent,
  SortChangedEvent,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Create custom dark theme
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

import {
  getAllQuotes,
  deleteQuote,
  bulkDeleteQuotes,
} from '@/utils/quotesAccess';
import { getAllCustomers } from '@/utils/customerAccess';
import QuoteStatusChip from '@/components/quotes/QuoteStatusChip';
import SearchableSelect, { type SelectOption } from '@/components/common/SearchableSelect';
import type { QuoteWithRelations, QuoteStatus, QuoteFilters } from '@/types/quote';
import type { Customer } from '@/types/customer';

export default function QuotesPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [quotes, setQuotes] = useState<QuoteWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('');
  const [sortModel, setSortModel] = useState<{ field: string; sort: 'asc' | 'desc' }>({
    field: 'created_at',
    sort: 'desc',
  });

  // Customer list for filter
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Grid ref
  const gridRef = useRef<AgGridReact<QuoteWithRelations>>(null);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    quoteId?: string;
    quoteNumber?: string;
  }>({ open: false, type: 'single' });
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'success';
  }>({
    open: false,
    message: '',
    severity: 'error',
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load customers for filter dropdown
  useEffect(() => {
    getAllCustomers(companyId).then(setCustomers).catch(console.error);
  }, [companyId]);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const filters: QuoteFilters = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (customerFilter) filters.customerId = customerFilter;
      if (searchDebounced) filters.search = searchDebounced;

      const data = await getAllQuotes(companyId, filters, sortModel.field, sortModel.sort);
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced, statusFilter, customerFilter, sortModel]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Clear selection on filter change
  useEffect(() => {
    setSelectedIds([]);
    if (gridRef.current?.api) {
      gridRef.current.api.deselectAll();
    }
  }, [searchDebounced, statusFilter, customerFilter]);

  // Grid height calculation
  const gridHeight = useMemo(() => {
    if (loading || quotes.length === 0) return 600;

    const headerHeight = 56;
    const rowHeight = 52;
    const paginationHeight = 56;
    const displayedRows = Math.min(quotes.length, 25);

    return Math.max(headerHeight + rowHeight * displayedRows + paginationHeight, 400);
  }, [loading, quotes.length]);

  const handleGridReady = (event: GridReadyEvent<QuoteWithRelations>) => {
    event.api.applyColumnState({
      state: [{ colId: 'created_at', sort: 'desc' }],
      defaultState: { sort: null },
    });
  };

  const handleSortChanged = (event: SortChangedEvent) => {
    const columnState = event.api.getColumnState();
    const sortedColumn = columnState.find((col) => col.sort !== null);

    if (sortedColumn && sortedColumn.sort) {
      setSortModel({
        field: sortedColumn.colId || 'created_at',
        sort: sortedColumn.sort as 'asc' | 'desc',
      });
    } else {
      setSortModel({ field: 'created_at', sort: 'desc' });
    }
  };

  const handleSelectionChanged = (event: SelectionChangedEvent<QuoteWithRelations>) => {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedData = selectedNodes
      .map((node) => node.data?.id)
      .filter((id): id is string => id !== undefined);
    setSelectedIds(selectedData);
  };

  const handleViewQuote = (e: React.MouseEvent, quote: QuoteWithRelations) => {
    e.stopPropagation();
    router.push(`/dashboard/${companyId}/quotes/${quote.id}`);
  };

  const handleEditQuote = (e: React.MouseEvent, quote: QuoteWithRelations) => {
    e.stopPropagation();
    router.push(`/dashboard/${companyId}/quotes/${quote.id}`);
  };

  const handleConvertQuote = (e: React.MouseEvent, quote: QuoteWithRelations) => {
    e.stopPropagation();
    router.push(`/dashboard/${companyId}/quotes/${quote.id}?convert=true`);
  };

  const handleDeleteClick = (e: React.MouseEvent, quote: QuoteWithRelations) => {
    e.stopPropagation();
    setDeleteDialog({
      open: true,
      type: 'single',
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
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
      if (deleteDialog.type === 'single' && deleteDialog.quoteId) {
        await deleteQuote(deleteDialog.quoteId);
      } else if (deleteDialog.type === 'bulk') {
        await bulkDeleteQuotes(selectedIds);
        setSelectedIds([]);
        if (gridRef.current?.api) {
          gridRef.current.api.deselectAll();
        }
      }
      await fetchQuotes();
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

  const formatCurrency = (value: number | null): string => {
    if (value === null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
  };

  const columnDefs: ColDef<QuoteWithRelations>[] = [
    {
      field: 'quote_number',
      headerName: 'Quote #',
      width: 120,
    },
    {
      colId: 'customer',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) => params.data?.customers?.name || '—',
    },
    {
      colId: 'part',
      headerName: 'Part',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) =>
        params.data?.parts?.part_number || params.data?.part_number_text || '—',
    },
    {
      field: 'quantity',
      headerName: 'Qty',
      width: 80,
      type: 'numericColumn',
    },
    {
      field: 'total_price',
      headerName: 'Total',
      width: 120,
      valueFormatter: (params: ValueFormatterParams) => formatCurrency(params.value),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params: ICellRendererParams<QuoteWithRelations>) => {
        if (!params.data) return null;
        return <QuoteStatusChip status={params.data.status} />;
      },
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params: ValueFormatterParams) =>
        params.value ? formatDate(params.value) : '—',
    },
    {
      colId: 'actions',
      headerName: '',
      width: 140,
      sortable: false,
      cellRenderer: (params: ICellRendererParams<QuoteWithRelations>) => {
        if (!params.data) return null;
        const quote = params.data;
        const isDraft = quote.status === 'draft';
        const isApproved = quote.status === 'approved';
        const canConvert = isApproved && !quote.converted_to_job_id;

        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View">
              <IconButton
                size="small"
                onClick={(e) => handleViewQuote(e, quote)}
                sx={{ color: 'text.secondary' }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isDraft && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  onClick={(e) => handleEditQuote(e, quote)}
                  sx={{ color: 'text.secondary' }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canConvert && (
              <Tooltip title="Convert to Job">
                <IconButton
                  size="small"
                  onClick={(e) => handleConvertQuote(e, quote)}
                  sx={{ color: 'primary.main' }}
                >
                  <PlayArrowIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isDraft && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteClick(e, quote)}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
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
          placeholder="Search quotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: 250 }}
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

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="pending_approval">Pending Approval</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ minWidth: 220 }}>
          <SearchableSelect
            options={customers.map((c): SelectOption => ({
              id: c.id,
              label: c.name,
              secondaryLabel: c.customer_code,
            }))}
            value={customerFilter}
            onChange={setCustomerFilter}
            label="Customer"
            allowNone
            noneLabel="All Customers"
            size="small"
          />
        </Box>

        {/* Delete button when items selected */}
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
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/quotes/new`)}
        >
          New Quote
        </Button>
      </Box>

      {/* Grid or Empty State */}
      {!loading && quotes.length === 0 ? (
        <Card elevation={2}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <DescriptionOutlinedIcon
              sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No quotes yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchDebounced || statusFilter !== 'all' || customerFilter
                ? 'No quotes match your filters.'
                : 'Create your first quote to get started.'}
            </Typography>
            {!searchDebounced && statusFilter === 'all' && !customerFilter && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push(`/dashboard/${companyId}/quotes/new`)}
              >
                Create Quote
              </Button>
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
            <AgGridReact<QuoteWithRelations>
              ref={gridRef}
              rowData={quotes}
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
              onGridReady={handleGridReady}
              loading={loading}
              suppressCellFocus={true}
              suppressMenuHide={false}
              getRowId={(params) => params.data.id}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              onRowClicked={(event) => {
                if (event.data) {
                  router.push(`/dashboard/${companyId}/quotes/${event.data.id}`);
                }
              }}
            />
          </Box>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, type: 'single' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ pb: 2 }}>
          {deleteDialog.type === 'single' ? 'Delete Quote' : 'Delete Quotes'}
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {deleteDialog.type === 'single' ? (
                <>
                  Are you sure you want to delete <strong>{deleteDialog.quoteNumber}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to delete <strong>{selectedIds.length}</strong> quote
                  {selectedIds.length > 1 ? 's' : ''}?
                </>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Only draft quotes can be deleted. This action cannot be undone.
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
            startIcon={
              deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />
            }
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
