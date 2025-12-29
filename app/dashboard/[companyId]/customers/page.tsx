'use client';

import { useState, useEffect, useCallback } from 'react';
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
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { getCustomers, softDeleteCustomer, bulkSoftDeleteCustomers } from '@/utils/customerAccess';
import type { Customer } from '@/types/customer';

export default function CustomersPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 25;

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'single' | 'bulk';
    customerId?: string;
    customerName?: string;
  }>({ open: false, type: 'single' });
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCustomers(
        companyId,
        'all',
        searchDebounced,
        page + 1,
        pageSize
      );
      setCustomers(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, searchDebounced, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedIds([]);
  }, [searchDebounced]);

  const handleRowClick = (params: { id: string | number }) => {
    router.push(`/dashboard/${companyId}/customers/${params.id}`);
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
      }
      await fetchCustomers();
      setDeleteDialog({ open: false, type: 'single' });
    } catch (error) {
      console.error('Error deleting customer(s):', error);
    } finally {
      setDeleting(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'customer_code',
      headerName: 'Code',
      width: 120,
      sortable: false,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
      sortable: false,
    },
    {
      field: 'contact_name',
      headerName: 'Contact',
      width: 150,
      sortable: false,
      valueGetter: (value: string | null) => value || '—',
    },
    {
      field: 'contact_email',
      headerName: 'Email',
      width: 200,
      sortable: false,
      valueGetter: (value: string | null) => value || '—',
    },
    {
      field: 'contact_phone',
      headerName: 'Phone',
      width: 140,
      sortable: false,
      valueGetter: (value: string | null) => value || '—',
    },
    {
      field: 'location',
      headerName: 'Location',
      width: 150,
      sortable: false,
      valueGetter: (_, row) => {
        const parts = [row.city, row.state].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : '—';
      },
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={(e) => handleDeleteClick(e, params.row)}
            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
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

        {/* Bulk delete button - shows when items selected */}
        {selectedIds.length > 0 && (
          <Button
            variant="outlined"
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
        <Card elevation={2}>
          <DataGrid
            rows={customers}
            columns={columns}
            loading={loading}
            rowCount={total}
            pageSizeOptions={[25]}
            paginationModel={{ page, pageSize }}
            paginationMode="server"
            onPaginationModelChange={(model) => setPage(model.page)}
            onRowClick={handleRowClick}
            checkboxSelection
            rowSelectionModel={{ type: 'include', ids: new Set(selectedIds) }}
            onRowSelectionModelChange={(model) => setSelectedIds(Array.from(model.ids) as string[])}
            keepNonExistentRowsSelected
            disableColumnFilter
            disableColumnMenu
            autoHeight
            sx={{
              border: 'none',
              '& .MuiDataGrid-row': {
                cursor: 'pointer',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.04)',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeader:focus': {
                outline: 'none',
              },
            }}
            slots={{
              loadingOverlay: () => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress />
                </Box>
              ),
            }}
          />
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => !deleting && setDeleteDialog({ open: false, type: 'single' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {deleteDialog.type === 'single' ? 'Delete Customer' : 'Delete Customers'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {deleteDialog.type === 'single' ? (
              <>
                Are you sure you want to delete <strong>{deleteDialog.customerName}</strong>?
              </>
            ) : (
              <>
                Are you sure you want to delete <strong>{selectedIds.length}</strong> customer{selectedIds.length > 1 ? 's' : ''}?
              </>
            )}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            This will mark the customer{deleteDialog.type === 'bulk' && selectedIds.length > 1 ? 's' : ''} as inactive.
            They will no longer appear in the active customers list but historical data will be preserved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, type: 'single' })}
            disabled={deleting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
