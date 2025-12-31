'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import { getPartWithRelations } from '@/utils/partsAccess';
import type { Part } from '@/types/part';

function DetailRow({ label, value }: { label: string; value: string | number | null }) {
  const displayValue = value != null ? String(value) : '—';
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{displayValue}</Typography>
    </Box>
  );
}

export default function PartDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const partId = params.partId as string;

  const [part, setPart] = useState<Part | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPart() {
      try {
        const data = await getPartWithRelations(partId);
        if (!data) {
          setError('Part not found');
        } else {
          setPart(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchPart();
  }, [partId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !part) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error || 'Part not found'}
      </Alert>
    );
  }

  const customerDisplay = part.customer
    ? `${part.customer.customer_code} - ${part.customer.name}`
    : part.customer_id
      ? 'Unknown (deleted)'
      : 'Generic Part';

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push(`/dashboard/${companyId}/parts`)}>
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/parts/${partId}/edit`)}
        >
          Edit
        </Button>
      </Box>

      {/* Part Header Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                {part.part_number}
              </Typography>
              {part.description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  {part.description}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Customer:{' '}
                {part.customer ? (
                  <Link
                    href={`/dashboard/${companyId}/customers/${part.customer.id}`}
                    style={{ color: 'inherit', textDecoration: 'underline' }}
                  >
                    {customerDisplay}
                  </Link>
                ) : (
                  customerDisplay
                )}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Pricing Tiers */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Pricing Tiers
              </Typography>
              {part.pricing.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Min Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {part.pricing.map((tier, index) => (
                      <TableRow key={index}>
                        <TableCell>{tier.qty}</TableCell>
                        <TableCell>${tier.price.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No pricing tiers defined
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Cost Information
              </Typography>
              <DetailRow
                label="Material Cost"
                value={part.material_cost != null ? `$${part.material_cost.toFixed(2)}` : null}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Related Records */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Related Records
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip
                  icon={<DescriptionIcon />}
                  label={`${part.quotes_count || 0} Quotes`}
                  variant="outlined"
                />
                <Chip icon={<WorkIcon />} label={`${part.jobs_count || 0} Jobs`} variant="outlined" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        {part.notes && (
          <Grid size={{ xs: 12 }}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {part.notes}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
