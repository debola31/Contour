'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type {
  CustomerMatchMode,
  PricingColumnPair,
  PartColumnMapping,
  PartAnalyzeResponse,
  PartValidateResponse,
  PartExecuteResponse,
  PartConflictInfo,
  PartValidationError,
} from '@/types/parts-import';
import { PART_FIELDS } from '@/types/parts-import';
import { getAllCustomers } from '@/utils/customerAccess';
import type { Customer } from '@/types/customer';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

const steps = ['Upload & Settings', 'AI Analysis', 'Review Mappings', 'Validate', 'Import'];

type ImportStep = 'upload' | 'analyzing' | 'review' | 'validating' | 'conflicts' | 'importing' | 'complete';

// Confidence chip component
function ConfidenceChip({ confidence }: { confidence: number }) {
  const color = confidence >= 0.9 ? 'success' : confidence >= 0.7 ? 'warning' : 'error';
  return (
    <Chip
      label={`${Math.round(confidence * 100)}%`}
      size="small"
      color={color}
      sx={{ minWidth: 50 }}
    />
  );
}

export default function ImportPartsPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  // State
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<PartColumnMapping[]>([]);
  const [pricingColumns, setPricingColumns] = useState<PricingColumnPair[]>([]);
  const [unmappedRequired, setUnmappedRequired] = useState<string[]>([]);
  const [discardedColumns, setDiscardedColumns] = useState<string[]>([]);
  const [unmappedOptional, setUnmappedOptional] = useState<string[]>([]);

  // Customer matching
  const [customerMatchMode, setCustomerMatchMode] = useState<CustomerMatchMode>('all_generic');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  // Validation & import
  const [conflicts, setConflicts] = useState<PartConflictInfo[]>([]);
  const [validationErrors, setValidationErrors] = useState<PartValidationError[]>([]);
  const [validRowsCount, setValidRowsCount] = useState(0);
  const [importResult, setImportResult] = useState<PartExecuteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [showUnmappedConfirmDialog, setShowUnmappedConfirmDialog] = useState(false);

  // Temp state for file before customer mode selection
  const [pendingFile, setPendingFile] = useState<{ headers: string[]; rows: string[][] } | null>(null);

  // Load customers on mount
  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllCustomers(companyId);
        setCustomers(data);
      } catch (err) {
        console.error('Error loading customers:', err);
      } finally {
        setCustomersLoading(false);
      }
    }
    loadCustomers();
  }, [companyId]);

  // Get active step index for stepper
  const getActiveStepIndex = (): number => {
    switch (currentStep) {
      case 'upload':
        return 0;
      case 'analyzing':
        return 1;
      case 'review':
        return 2;
      case 'validating':
      case 'conflicts':
        return 3;
      case 'importing':
      case 'complete':
        return 4;
      default:
        return 0;
    }
  };

  // Handle file selection (just parses, doesn't start analysis)
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
        setPendingFile({ headers: headerRow, rows: dataRows });
      } catch {
        setError('Error reading file');
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
    };

    reader.readAsText(file);
  }, []);

  // Start analysis after file is selected and customer mode is chosen
  const handleStartAnalysis = async () => {
    if (!pendingFile) return;

    // Validate customer mode settings
    if (customerMatchMode === 'all_to_one' && !selectedCustomerId) {
      setError('Please select a customer when using "Assign all to one customer" mode');
      return;
    }

    setHeaders(pendingFile.headers);
    setAllRows(pendingFile.rows);
    setCurrentStep('analyzing');
    setLoading(true);
    setError(null);

    try {
      const sampleRows = pendingFile.rows.slice(0, 5);
      const response = await fetch(`${API_BASE_URL}/api/parts/import/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          headers: pendingFile.headers,
          sample_rows: sampleRows,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze CSV');
      }

      const data: PartAnalyzeResponse = await response.json();
      setMappings(data.mappings);
      setPricingColumns(data.pricing_columns);
      setUnmappedRequired(data.unmapped_required);
      setDiscardedColumns(data.discarded_columns);

      // Calculate unmapped optional fields
      const mappedFields = new Set(data.mappings.filter((m) => m.db_field).map((m) => m.db_field));
      const optionalFields = PART_FIELDS.filter((f) => !f.required).map((f) => f.key);
      // Don't count customer_code as unmapped if we're not using BY_COLUMN mode
      let filteredOptional = optionalFields.filter((f) => !mappedFields.has(f));
      if (customerMatchMode !== 'by_column') {
        filteredOptional = filteredOptional.filter((f) => f !== 'customer_code');
      }
      setUnmappedOptional(filteredOptional);

      setCurrentStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analyzing CSV');
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  // Handle mapping change
  const handleMappingChange = (csvColumn: string, dbField: string | null) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.csv_column === csvColumn
          ? {
              ...m,
              db_field: dbField,
              is_manual: true,
              reasoning: 'Manually selected by user',
              needs_review: false,
            }
          : m
      )
    );

    // Recalculate unmapped fields
    const mappedFields = new Set(
      mappings
        .map((m) => (m.csv_column === csvColumn ? dbField : m.db_field))
        .filter(Boolean)
    );

    // Update unmapped required
    const requiredFields = PART_FIELDS.filter((f) => f.required).map((f) => f.key);
    setUnmappedRequired(requiredFields.filter((f) => !mappedFields.has(f)));

    // Update unmapped optional
    let optionalFields = PART_FIELDS.filter((f) => !f.required).map((f) => f.key);
    if (customerMatchMode !== 'by_column') {
      optionalFields = optionalFields.filter((f) => f !== 'customer_code');
    }
    setUnmappedOptional(optionalFields.filter((f) => !mappedFields.has(f)));
  };

  // Pricing column pair management
  const handleAddPricingPair = () => {
    setPricingColumns((prev) => [...prev, { qty_column: '', price_column: '' }]);
  };

  const handleRemovePricingPair = (index: number) => {
    setPricingColumns((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePricingPairChange = (
    index: number,
    field: 'qty_column' | 'price_column',
    value: string
  ) => {
    setPricingColumns((prev) =>
      prev.map((pair, i) => (i === index ? { ...pair, [field]: value } : pair))
    );
  };

  // Check for unmapped fields and show confirmation if needed
  const handleContinueToImport = () => {
    if (unmappedOptional.length > 0) {
      setShowUnmappedConfirmDialog(true);
    } else {
      handleValidate();
    }
  };

  // Validate mappings and check for conflicts
  const handleValidate = async () => {
    setShowUnmappedConfirmDialog(false);

    // Check required fields
    const mappedFields = new Set(mappings.filter((m) => m.db_field).map((m) => m.db_field));
    if (!mappedFields.has('part_number')) {
      setError('Part Number must be mapped');
      return;
    }

    // Check customer_code mapping for BY_COLUMN mode
    if (customerMatchMode === 'by_column' && !mappedFields.has('customer_code')) {
      setError('Customer Code must be mapped when using "Match by column" mode');
      return;
    }

    setCurrentStep('validating');
    setLoading(true);
    setError(null);

    try {
      // Build mappings object
      const mappingsObj: Record<string, string> = {};
      mappings.forEach((m) => {
        if (m.db_field) {
          mappingsObj[m.csv_column] = m.db_field;
        }
      });

      // Filter out empty pricing pairs
      const validPricingColumns = pricingColumns.filter(
        (p) => p.qty_column && p.price_column
      );

      // Convert rows to objects
      const rowObjects = allRows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      const response = await fetch(`${API_BASE_URL}/api/parts/import/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          mappings: mappingsObj,
          pricing_columns: validPricingColumns,
          rows: rowObjects,
          customer_match_mode: customerMatchMode,
          selected_customer_id: customerMatchMode === 'all_to_one' ? selectedCustomerId : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Validation failed');
      }

      const data: PartValidateResponse = await response.json();

      if (data.has_conflicts || data.validation_errors.length > 0) {
        setConflicts(data.conflicts);
        setValidationErrors(data.validation_errors);
        setValidRowsCount(data.valid_rows_count);
        setCurrentStep('conflicts');
        setShowConflictDialog(true);
      } else {
        // No conflicts, proceed to import
        await executeImport(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
      setCurrentStep('review');
    } finally {
      setLoading(false);
    }
  };

  // Execute the import
  const executeImport = async (skipConflicts: boolean) => {
    setCurrentStep('importing');
    setLoading(true);
    setError(null);
    setShowConflictDialog(false);

    try {
      // Build mappings object
      const mappingsObj: Record<string, string> = {};
      mappings.forEach((m) => {
        if (m.db_field) {
          mappingsObj[m.csv_column] = m.db_field;
        }
      });

      // Filter out empty pricing pairs
      const validPricingColumns = pricingColumns.filter(
        (p) => p.qty_column && p.price_column
      );

      // Convert rows to objects
      const rowObjects = allRows.map((row) => {
        const obj: Record<string, string> = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      const response = await fetch(`${API_BASE_URL}/api/parts/import/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          mappings: mappingsObj,
          pricing_columns: validPricingColumns,
          rows: rowObjects,
          customer_match_mode: customerMatchMode,
          selected_customer_id: customerMatchMode === 'all_to_one' ? selectedCustomerId : undefined,
          skip_conflicts: skipConflicts,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Import failed');
      }

      const data: PartExecuteResponse = await response.json();
      setImportResult(data);
      setCurrentStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setCurrentStep('review');
    } finally {
      setLoading(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setCurrentStep('upload');
    setHeaders([]);
    setAllRows([]);
    setMappings([]);
    setPricingColumns([]);
    setUnmappedRequired([]);
    setUnmappedOptional([]);
    setDiscardedColumns([]);
    setConflicts([]);
    setValidationErrors([]);
    setValidRowsCount(0);
    setImportResult(null);
    setError(null);
    setPendingFile(null);
    setCustomerMatchMode('all_generic');
    setSelectedCustomerId('');
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Button
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/parts`)}
        >
          Back
        </Button>
        {currentStep === 'review' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="primary" onClick={handleReset}>
              Start Over
            </Button>
            <Button
              variant="contained"
              onClick={handleContinueToImport}
              disabled={loading || unmappedRequired.length > 0}
            >
              Continue to Import ({allRows.length} rows)
            </Button>
          </Box>
        )}
      </Box>

      {/* Stepper */}
      <Stepper activeStep={getActiveStepIndex()} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Step: Upload & Settings */}
      {currentStep === 'upload' && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <UploadFileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Parts CSV
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select a CSV file with part data. The first row should contain column headers.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="body2" color="primary.main">
                  AI will automatically map your columns and detect pricing tiers
                </Typography>
              </Box>
              <Button variant="contained" component="label">
                Choose File
                <input type="file" accept=".csv" hidden onChange={handleFileChange} />
              </Button>
              {pendingFile && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  {pendingFile.rows.length} rows loaded
                </Typography>
              )}
            </Box>

            {pendingFile && (
              <>
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3, mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Customer Assignment
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    How should customers be assigned to imported parts?
                  </Typography>

                  <RadioGroup
                    value={customerMatchMode}
                    onChange={(e) => setCustomerMatchMode(e.target.value as CustomerMatchMode)}
                  >
                    <FormControlLabel
                      value="all_generic"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Generic Parts (No Customer)</Typography>
                          <Typography variant="body2" color="text.secondary">
                            All imported parts will be generic, not tied to any customer
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="all_to_one"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Assign All to One Customer</Typography>
                          <Typography variant="body2" color="text.secondary">
                            All imported parts will be assigned to a single customer
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="by_column"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="body1">Match by Customer Code Column</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Use a CSV column to match parts to existing customers
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>

                  {customerMatchMode === 'all_to_one' && (
                    <FormControl fullWidth sx={{ mt: 2 }} disabled={customersLoading}>
                      <InputLabel>Select Customer</InputLabel>
                      <Select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                        label="Select Customer"
                      >
                        {customers.map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.customer_code} - {customer.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="contained"
                    onClick={handleStartAnalysis}
                    disabled={customerMatchMode === 'all_to_one' && !selectedCustomerId}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Analyze CSV
                  </Button>
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step: Analyzing */}
      {currentStep === 'analyzing' && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Analyzing Your CSV
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                AI is mapping your columns to part fields and detecting pricing tiers...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step: Review Mappings */}
      {currentStep === 'review' && (
        <>
          {/* Mapping Status Alerts */}
          {unmappedRequired.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Required fields not mapped: {unmappedRequired.join(', ')}
            </Alert>
          )}

          {customerMatchMode === 'by_column' && !mappings.some((m) => m.db_field === 'customer_code') && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Customer Code column not mapped. Required for "Match by column" mode.
            </Alert>
          )}

          {/* Column Mappings Table */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Column Mappings
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>CSV Column</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Maps To</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Confidence</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reasoning</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mappings.map((mapping) => (
                    <TableRow key={mapping.csv_column}>
                      <TableCell>{mapping.csv_column}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <Select
                            value={mapping.db_field || ''}
                            onChange={(e) =>
                              handleMappingChange(
                                mapping.csv_column,
                                e.target.value || null
                              )
                            }
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Skip this column</em>
                            </MenuItem>
                            {PART_FIELDS.map((field) => (
                              <MenuItem
                                key={field.key}
                                value={field.key}
                                disabled={
                                  field.key === 'customer_code' && customerMatchMode !== 'by_column'
                                }
                              >
                                {field.label}
                                {field.required && ' *'}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <ConfidenceChip confidence={mapping.confidence} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {mapping.reasoning}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pricing Tier Mappings */}
          <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pricing Tier Mappings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Map quantity and price column pairs for each pricing tier
                  </Typography>
                </Box>
                <Button startIcon={<AddIcon />} onClick={handleAddPricingPair} size="small">
                  Add Tier
                </Button>
              </Box>

              {pricingColumns.length === 0 ? (
                <Alert severity="info">
                  No pricing columns detected. Click "Add Tier" to manually map pricing columns,
                  or leave empty if parts don't have volume pricing.
                </Alert>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 80 }}>Tier</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Quantity Column</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 40 }}></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Price Column</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 60 }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pricingColumns.map((pair, index) => (
                      <TableRow key={index}>
                        <TableCell>Tier {index + 1}</TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={pair.qty_column}
                              onChange={(e) =>
                                handlePricingPairChange(index, 'qty_column', e.target.value)
                              }
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select column</em>
                              </MenuItem>
                              {headers.map((h) => (
                                <MenuItem key={h} value={h}>
                                  {h}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <ArrowForwardIcon color="disabled" />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={pair.price_column}
                              onChange={(e) =>
                                handlePricingPairChange(index, 'price_column', e.target.value)
                              }
                              displayEmpty
                            >
                              <MenuItem value="">
                                <em>Select column</em>
                              </MenuItem>
                              {headers.map((h) => (
                                <MenuItem key={h} value={h}>
                                  {h}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleRemovePricingPair(index)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Step: Validating */}
      {currentStep === 'validating' && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Checking for Conflicts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Verifying data against existing parts...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Step: Importing */}
      {currentStep === 'importing' && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Importing Parts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we import your data...
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Step: Complete */}
      {currentStep === 'complete' && importResult && (
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              {importResult.imported_count > 0 ? (
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
                    {importResult.imported_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Imported
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {importResult.skipped_count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Skipped
                  </Typography>
                </Box>
              </Box>
            </Box>

            {importResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {importResult.errors.length} row{importResult.errors.length > 1 ? 's' : ''} had errors
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button variant="outlined" onClick={handleReset}>
                Import Another File
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push(`/dashboard/${companyId}/parts`)}
              >
                View Parts
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Unmapped Fields Confirmation Dialog */}
      <Dialog
        open={showUnmappedConfirmDialog}
        onClose={() => setShowUnmappedConfirmDialog(false)}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="info" />
          Some Fields Not Mapped
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            The following optional fields are not mapped and will be left empty:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {unmappedOptional.map((fieldKey) => {
              const field = PART_FIELDS.find((f) => f.key === fieldKey);
              return (
                <Box
                  key={fieldKey}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'info.main',
                    color: 'info.contrastText',
                    borderRadius: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  {field?.label || fieldKey}
                </Box>
              );
            })}
          </Box>
          <Typography variant="body2" color="text.secondary">
            You can go back to map more columns, or proceed with the import.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnmappedConfirmDialog(false)} color="inherit">
            Go Back
          </Button>
          <Button onClick={handleValidate} variant="contained" color="primary">
            Proceed Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Conflict Dialog */}
      <Dialog
        open={showConflictDialog}
        onClose={() => {
          setShowConflictDialog(false);
          setCurrentStep('review');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Conflicts & Errors Found
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Found {conflicts.length + validationErrors.length} issues that need attention.
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
              <Box>
                <Typography variant="h5" color="success.main">
                  {validRowsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valid rows
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" color="error.main">
                  {conflicts.length + validationErrors.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  With issues
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Conflicts List */}
          {conflicts.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Conflicts
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {conflicts.slice(0, 10).map((conflict, i) => (
                  <Alert key={i} severity="warning" sx={{ mb: 1 }}>
                    Row {conflict.row_number}: {conflict.existing_value}
                  </Alert>
                ))}
                {conflicts.length > 10 && (
                  <Typography variant="body2" color="text.secondary">
                    ...and {conflicts.length - 10} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Validation Errors List */}
          {validationErrors.length > 0 && (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Validation Errors
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                {validationErrors.slice(0, 10).map((error, i) => (
                  <Alert key={i} severity="error" sx={{ mb: 1 }}>
                    Row {error.row_number}: {error.message}
                  </Alert>
                ))}
                {validationErrors.length > 10 && (
                  <Typography variant="body2" color="text.secondary">
                    ...and {validationErrors.length - 10} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowConflictDialog(false);
              setCurrentStep('review');
            }}
            color="inherit"
          >
            Go Back
          </Button>
          {validRowsCount > 0 && (
            <Button
              onClick={() => executeImport(true)}
              variant="contained"
              color="warning"
            >
              Import {validRowsCount} Valid Rows
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
