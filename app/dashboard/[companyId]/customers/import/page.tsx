'use client';

import { useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Chip from '@mui/material/Chip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { bulkImportCustomers } from '@/utils/customerAccess';
import type { CustomerFormData, ImportResult } from '@/types/customer';

const CUSTOMER_FIELDS: { key: keyof CustomerFormData; label: string; required?: boolean }[] = [
  { key: 'customer_code', label: 'Customer Code', required: true },
  { key: 'name', label: 'Company Name', required: true },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'address_line1', label: 'Address Line 1' },
  { key: 'address_line2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'notes', label: 'Notes' },
];

// Common CSV column names mapped to our fields
const AUTO_MAP: Record<string, keyof CustomerFormData> = {
  code: 'customer_code',
  customer_code: 'customer_code',
  'customer code': 'customer_code',
  cust_code: 'customer_code',
  name: 'name',
  customer_name: 'name',
  'customer name': 'name',
  company: 'name',
  'company name': 'name',
  phone: 'phone',
  telephone: 'phone',
  tel: 'phone',
  email: 'email',
  'e-mail': 'email',
  website: 'website',
  web: 'website',
  url: 'website',
  contact: 'contact_name',
  'contact name': 'contact_name',
  contact_name: 'contact_name',
  'contact phone': 'contact_phone',
  contact_phone: 'contact_phone',
  'contact email': 'contact_email',
  contact_email: 'contact_email',
  address: 'address_line1',
  address1: 'address_line1',
  'address line 1': 'address_line1',
  address_line1: 'address_line1',
  street: 'address_line1',
  address2: 'address_line2',
  'address line 2': 'address_line2',
  address_line2: 'address_line2',
  suite: 'address_line2',
  city: 'city',
  state: 'state',
  province: 'state',
  zip: 'postal_code',
  zipcode: 'postal_code',
  'zip code': 'postal_code',
  postal: 'postal_code',
  'postal code': 'postal_code',
  postal_code: 'postal_code',
  country: 'country',
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
};

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

const steps = ['Upload CSV', 'Map Columns', 'Import'];

export default function ImportCustomersPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [activeStep, setActiveStep] = useState(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, keyof CustomerFormData | ''>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);

        if (parsed.length < 2) {
          setError('CSV file must have a header row and at least one data row');
          return;
        }

        const [headerRow, ...dataRows] = parsed;
        setHeaders(headerRow);
        setRows(dataRows);

        // Auto-map columns
        const mapping: Record<string, keyof CustomerFormData | ''> = {};
        headerRow.forEach((header) => {
          const normalized = header.toLowerCase().trim();
          mapping[header] = AUTO_MAP[normalized] || '';
        });
        setColumnMapping(mapping);

        setActiveStep(1);
      } catch {
        setError('Error parsing CSV file');
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  }, []);

  const handleMappingChange = (header: string, field: keyof CustomerFormData | '') => {
    setColumnMapping((prev) => ({ ...prev, [header]: field }));
  };

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping).filter(Boolean);

    // Check required fields are mapped
    if (!mappedFields.includes('customer_code')) {
      setError('Customer Code field must be mapped');
      return false;
    }
    if (!mappedFields.includes('name')) {
      setError('Company Name field must be mapped');
      return false;
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateMapping()) return;

    setLoading(true);
    setError(null);

    try {
      // Convert rows to CustomerFormData using mapping
      const mappedRows: CustomerFormData[] = rows.map((row) => {
        const data: Record<string, string> = {};
        headers.forEach((header, index) => {
          const field = columnMapping[header];
          if (field) {
            data[field] = row[index] || '';
          }
        });

        return {
          customer_code: data.customer_code || '',
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || 'USA',
          is_active: true,
          notes: data.notes || '',
        };
      });

      const result = await bulkImportCustomers(companyId, mappedRows);
      setImportResult(result);
      setActiveStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const previewRows = rows.slice(0, 10);

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
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Step 0: Upload */}
      {activeStep === 0 && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <UploadFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload CSV File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a CSV file with customer data. The first row should contain column headers.
            </Typography>
            <Button variant="contained" component="label">
              Choose File
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Map Columns */}
      {activeStep === 1 && (
        <>
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Map Columns
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Match your CSV columns to customer fields. Required fields are marked with *.
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {headers.map((header) => (
                  <FormControl key={header} size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>{header}</InputLabel>
                    <Select
                      value={columnMapping[header] || ''}
                      label={header}
                      onChange={(e) =>
                        handleMappingChange(header, e.target.value as keyof CustomerFormData | '')
                      }
                    >
                      <MenuItem value="">
                        <em>Skip</em>
                      </MenuItem>
                      {CUSTOMER_FIELDS.map((field) => (
                        <MenuItem key={field.key} value={field.key}>
                          {field.label}
                          {field.required && ' *'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Box>
            </CardContent>
          </Card>

          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Preview (First {previewRows.length} rows)
              </Typography>
              <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (
                        <TableCell key={header}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {header}
                          </Typography>
                          {columnMapping[header] && (
                            <Chip
                              size="small"
                              label={CUSTOMER_FIELDS.find((f) => f.key === columnMapping[header])?.label}
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        {row.map((cell, j) => (
                          <TableCell key={j}>{cell || '—'}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setActiveStep(0)}>Back</Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Importing...' : `Import ${rows.length} Customers`}
            </Button>
          </Box>
        </>
      )}

      {/* Step 2: Results */}
      {activeStep === 2 && importResult && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {importResult.imported > 0 ? (
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              ) : (
                <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              )}
              <Typography variant="h5" gutterBottom>
                Import Complete
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', mt: 2 }}>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {importResult.imported}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Imported
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {importResult.skipped}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skipped
                  </Typography>
                </Box>
              </Box>
            </Box>

            {importResult.errors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Skipped Rows
                </Typography>
                <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importResult.errors.slice(0, 20).map((error, i) => (
                        <TableRow key={i}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {importResult.errors.length > 20 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    ... and {importResult.errors.length - 20} more
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setActiveStep(0);
                  setHeaders([]);
                  setRows([]);
                  setColumnMapping({});
                  setImportResult(null);
                }}
              >
                Import Another File
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push(`/dashboard/${companyId}/customers`)}
              >
                View Customers
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
