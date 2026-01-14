'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { createOperator } from '@/utils/operatorAccess';

/**
 * Create New Operator Page.
 */
export default function NewOperatorPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!pin || !/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createOperator({
        company_id: companyId,
        name: name.trim(),
        pin,
      });

      router.push(`/dashboard/${companyId}/team`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create operator');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/dashboard/${companyId}/team`)}
        sx={{ mb: 3 }}
      >
        Back to Team
      </Button>

      <Paper
        elevation={2}
        sx={{
          p: 4,
          maxWidth: 500,
          bgcolor: 'rgba(17, 20, 57, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          New Operator
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="John Smith"
          />

          <TextField
            label="PIN"
            fullWidth
            required
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => {
              // Only allow digits
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(value);
            }}
            sx={{ mb: 3 }}
            placeholder="4-6 digits"
            helperText="Operator will use this PIN to log in"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPin(!showPin)}
                      edge="end"
                    >
                      {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => router.push(`/dashboard/${companyId}/team`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Operator'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
