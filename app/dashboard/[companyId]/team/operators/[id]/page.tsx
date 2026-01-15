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
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getSupabase } from '@/lib/supabase';
import type { OperatorWithEmail } from '@/types/operator';

/**
 * Get the API URL for operator endpoints.
 */
const getOperatorApiUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (baseUrl.endsWith('/api')) {
    return `${baseUrl}/operators`;
  }
  return `${baseUrl}/api/operators`;
};

/**
 * Edit Operator Page.
 *
 * Allows editing operator name and active status.
 * Email is read-only (stored in auth.users).
 * Password reset sends a password reset email.
 */
export default function EditOperatorPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const operatorId = params.id as string;

  const [operator, setOperator] = useState<OperatorWithEmail | null>(null);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const supabase = getSupabase();

  // Load operator data from API (includes email)
  useEffect(() => {
    async function load() {
      try {
        const url = `${getOperatorApiUrl()}/${operatorId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch operator');
        }

        const operatorData: OperatorWithEmail = await response.json();

        setOperator(operatorData);
        setName(operatorData.name);
        setEmail(operatorData.email || '');
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

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from('operators')
        .update({
          name: name.trim(),
        })
        .eq('id', operatorId);

      if (updateError) throw new Error(updateError.message);

      setSuccess('Operator updated successfully');
      setTimeout(() => {
        router.push(`/dashboard/${companyId}/team`);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update operator');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenResetDialog = () => {
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setResetDialogOpen(true);
  };

  const handleCloseResetDialog = () => {
    if (!resettingPassword) {
      setResetDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setResetError(null);
    }
  };

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword.trim()) {
      setResetError('Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResettingPassword(true);
    setResetError(null);
    setError(null);
    setSuccess(null);

    try {
      const url = `${getOperatorApiUrl()}/${operatorId}/reset-password`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      setResetDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(
        `Password has been reset. Please share the temporary password with ${operator?.name || 'the operator'}. They will be required to change it on their next login.`
      );
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
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

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
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
            label="Email"
            fullWidth
            value={email}
            disabled
            sx={{ mb: 3 }}
            helperText="Email cannot be changed"
          />

          <Divider sx={{ my: 3 }} />

          {/* Password Reset Section */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Password
          </Typography>

          <Button
            variant="outlined"
            startIcon={<LockResetIcon />}
            onClick={handleOpenResetDialog}
            disabled={resettingPassword}
            sx={{ mb: 3 }}
          >
            Reset Password
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
            Set a temporary password that the operator must change on next login
          </Typography>

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

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onClose={handleCloseResetDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Set a temporary password for {operator?.name || 'this operator'}. They will be required to
            change it on their next login.
          </Typography>

          {resetError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetError}
            </Alert>
          )}

          <TextField
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={resettingPassword}
            sx={{ mb: 2 }}
            helperText="Minimum 8 characters"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      size="small"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={resettingPassword}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      size="small"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseResetDialog} disabled={resettingPassword}>
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={resettingPassword}
            startIcon={resettingPassword ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {resettingPassword ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
