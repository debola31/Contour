'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import type { InventoryTransactionWithRelations } from '@/types/inventory';
import { getTransactionTypeDisplay, formatTransactionDate, formatQuantityWithUnit } from '@/types/inventory';
import { getItemTransactions } from '@/utils/inventoryAccess';

interface TransactionHistoryTableProps {
  itemId: string;
  companyId: string;
  /** Trigger a refresh from parent */
  refreshKey?: number;
}

export default function TransactionHistoryTable({
  itemId,
  companyId,
  refreshKey = 0,
}: TransactionHistoryTableProps) {
  const [transactions, setTransactions] = useState<InventoryTransactionWithRelations[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const { transactions: data, total: count } = await getItemTransactions(
          itemId,
          page * rowsPerPage,
          rowsPerPage
        );
        setTransactions(data);
        setTotal(count);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [itemId, page, rowsPerPage, refreshKey]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && transactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!loading && transactions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No transactions recorded yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Quantity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Converted</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Related Job</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => {
              const typeDisplay = getTransactionTypeDisplay(transaction.type);

              return (
                <TableRow key={transaction.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {formatTransactionDate(transaction.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={typeDisplay.label}
                      size="small"
                      color={typeDisplay.color}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color:
                          transaction.type === 'addition'
                            ? 'success.main'
                            : transaction.type === 'depletion'
                            ? 'error.main'
                            : 'info.main',
                      }}
                    >
                      {typeDisplay.sign}
                      {formatQuantityWithUnit(transaction.quantity, transaction.unit)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {transaction.unit !== transaction.item_name && (
                      <Typography variant="body2" color="text.secondary">
                        {formatQuantityWithUnit(transaction.converted_quantity, '')} base
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.job ? (
                      <Link
                        component={NextLink}
                        href={`/dashboard/${companyId}/jobs/${transaction.job.id}`}
                        underline="hover"
                      >
                        {transaction.job.job_number}
                      </Link>
                    ) : transaction.job_operation ? (
                      <Typography variant="body2" color="text.secondary">
                        Op: {transaction.job_operation.operation_name}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={transaction.notes || undefined}
                    >
                      {transaction.notes || '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Paper>
  );
}
