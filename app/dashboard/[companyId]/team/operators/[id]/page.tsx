'use client';

import { useState, useEffect } from 'react';
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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import QrCodeIcon from '@mui/icons-material/QrCode';
import { getOperator, updateOperator } from '@/utils/operatorAccess';
import type { Operator } from '@/types/operator';

/**
 * Edit Operator Page.
 */
export default function EditOperatorPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const operatorId = params.id as string;

  const [operator, setOperator] = useState<Operator | null>(null);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQrBadge, setShowQrBadge] = useState(false);

  // Load operator data
  useEffect(() => {
    async function load() {
      try {
        const data = await getOperator(operatorId);
        setOperator(data);
        setName(data.name);
        setIsActive(data.is_active);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load operator');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [operatorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (pin && !/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateOperator(operatorId, {
        name: name.trim(),
        pin: pin || undefined, // Only update if provided
        is_active: isActive,
      });

      router.push(`/dashboard/${companyId}/team`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update operator');
    } finally {
      setSaving(false);
    }
  };

  const generateQrBadgeUrl = (): string => {
    if (!operator?.qr_code_id) return '';
    return `${window.location.origin}/operator/${companyId}/auth?badge=${operator.qr_code_id}`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!operator) {
    return (
      <Box>
        <Alert severity="error">Operator not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/team`)}
          sx={{ mt: 2 }}
        >
          Back to Team
        </Button>
      </Box>
    );
  }

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
          Edit Operator
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
          />

          <TextField
            label="New PIN (leave blank to keep current)"
            fullWidth
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPin(value);
            }}
            sx={{ mb: 3 }}
            placeholder="4-6 digits"
            helperText="Only fill in to change the PIN"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPin(!showPin)} edge="end">
                      {showPin ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="primary"
              />
            }
            label="Active"
            sx={{ mb: 3, display: 'block' }}
          />

          <Divider sx={{ my: 3 }} />

          {/* QR Badge Section */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            QR Badge
          </Typography>

          {operator.qr_code_id ? (
            <Box sx={{ mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<QrCodeIcon />}
                onClick={() => setShowQrBadge(!showQrBadge)}
              >
                {showQrBadge ? 'Hide QR Code' : 'Show QR Code'}
              </Button>

              {showQrBadge && (
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: 'white',
                    borderRadius: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                    {operator.name}
                  </Typography>
                  {/* QR Code would be generated here using a library like qrcode */}
                  <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                    {generateQrBadgeUrl()}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              No QR badge generated yet. Save the operator to generate one.
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              onClick={() => router.push(`/dashboard/${companyId}/team`)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Last Login Info */}
      {operator.last_login_at && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Last login: {new Date(operator.last_login_at).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}
