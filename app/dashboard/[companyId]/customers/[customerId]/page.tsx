'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import { CustomerStatusChip } from '@/components/customers';
import { getCustomerWithRelations } from '@/utils/customerAccess';
import type { CustomerWithRelations } from '@/types/customer';

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value || '—'}</Typography>
    </Box>
  );
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<CustomerWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomer() {
      try {
        const data = await getCustomerWithRelations(customerId);
        if (!data) {
          setError('Customer not found');
        } else {
          setCustomer(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error || 'Customer not found'}
      </Alert>
    );
  }

  const addressParts = [
    customer.address_line1,
    customer.address_line2,
    [customer.city, customer.state, customer.postal_code].filter(Boolean).join(', '),
    customer.country !== 'USA' ? customer.country : null,
  ].filter(Boolean);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/customers`)}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/customers/${customerId}/edit`)}
        >
          Edit
        </Button>
      </Box>

      {/* Customer Header Card */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {customer.name}
                </Typography>
                <CustomerStatusChip isActive={customer.is_active} />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Code: {customer.customer_code}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Contact Information */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Contact Information
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Company
              </Typography>
              <DetailRow label="Phone" value={customer.phone} />
              <DetailRow label="Email" value={customer.email} />
              <DetailRow label="Website" value={customer.website} />

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Primary Contact
              </Typography>
              <DetailRow label="Name" value={customer.contact_name} />
              <DetailRow label="Phone" value={customer.contact_phone} />
              <DetailRow label="Email" value={customer.contact_email} />
            </CardContent>
          </Card>
        </Grid>

        {/* Address */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Address
              </Typography>
              {addressParts.length > 0 ? (
                addressParts.map((line, i) => (
                  <Typography key={i} variant="body1">
                    {line}
                  </Typography>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No address on file
                </Typography>
              )}
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
                  label={`${customer.quotes_count} Quotes`}
                  variant="outlined"
                />
                <Chip
                  icon={<WorkIcon />}
                  label={`${customer.jobs_count} Jobs`}
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Notes
              </Typography>
              <Typography variant="body1" color={customer.notes ? 'text.primary' : 'text.secondary'}>
                {customer.notes || 'No notes'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
