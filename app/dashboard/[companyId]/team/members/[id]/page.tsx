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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockResetIcon from '@mui/icons-material/LockReset';
import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { getSupabase, getEdgeFunctionUrl } from '@/lib/supabase';
import type { TeamMember } from '@/types/team';

/**
 * Get the Edge Function URL for team members.
 */
const getTeamMembersUrl = () => getEdgeFunctionUrl('team-members');

/**
 * Edit Team Member Page.
 *
 * Allows viewing and editing team member role.
 * Email and name are read-only (stored in auth.users).
 * Includes password reset functionality.
 */
export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.companyId as string;
  const memberId = params.id as string;

  const [member, setMember] = useState<TeamMember | null>(null);
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password reset dialog
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load member data
  useEffect(() => {
    const loadMember = async () => {
      try {
        const url = `${getTeamMembersUrl()}/${memberId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to load team member');
        }

        const data: TeamMember = await response.json();
        setMember(data);
        setRole(data.role);
      } catch (err) {
        console.error('Error loading team member:', err);
        setError('Failed to load team member');
      } finally {
        setLoading(false);
      }
    };

    loadMember();
  }, [memberId]);

  // Save role change
  const handleSaveRole = async () => {
    if (!member || role === member.role) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from('user_company_access')
        .update({ role })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setMember({ ...member, role });
      setSuccess(`Role updated to ${role}`);
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  // Reset password
  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setResetting(true);
    setError(null);

    try {
      const url = `${getTeamMembersUrl()}/${memberId}/reset-password`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to reset password' }));
        throw new Error(errorData.error || 'Failed to reset password');
      }

      setResetDialogOpen(false);
      setNewPassword('');
      setSuccess('Password has been reset');
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  // Delete member
  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { error: deleteError } = await supabase
        .from('user_company_access')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      // Navigate back to team page
      const tabIndex = member?.role === 'admin' ? 0 : 1;
      router.push(`/dashboard/${companyId}/team?tab=${tabIndex}`);
    } catch (err) {
      console.error('Error deleting team member:', err);
      setError('Failed to delete team member');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!member) {
    return (
      <Box>
        <Alert severity="error">Team member not found</Alert>
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
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/dashboard/${companyId}/team`)}
        sx={{ mb: 2 }}
      >
        Back to Team
      </Button>

      <Paper sx={{ p: 4, maxWidth: 500 }}>
        <Typography variant="h5" gutterBottom>
          {member.name || 'Team Member'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {member.email}
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

        <TextField
          label="Name"
          value={member.name || ''}
          fullWidth
          disabled
          sx={{ mb: 3 }}
          helperText="Name is managed in user settings"
        />

        <TextField
          label="Email"
          value={member.email || ''}
          fullWidth
          disabled
          sx={{ mb: 3 }}
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            label="Role"
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
          >
            <MenuItem value="admin">Admin - Full access, can manage team</MenuItem>
            <MenuItem value="user">User - Can use all modules, cannot manage team</MenuItem>
          </Select>
        </FormControl>

        {role !== member.role && (
          <Button
            variant="contained"
            onClick={handleSaveRole}
            disabled={saving}
            sx={{ mb: 3 }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : 'Save Role Change'}
          </Button>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" gutterBottom>
          Account Actions
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<LockResetIcon />}
            onClick={() => setResetDialogOpen(true)}
          >
            Reset Password
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Remove from Team
          </Button>
        </Box>
      </Paper>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => !resetting && setResetDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Set a new temporary password. The user will be required to change it on next login.
          </Typography>
          <TextField
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            autoFocus
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setResetDialogOpen(false)}
            disabled={resetting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResetPassword}
            variant="contained"
            disabled={resetting || !newPassword}
            startIcon={resetting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {resetting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove from Team</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove <strong>{member.name || member.email}</strong> from this company?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            They will lose access to this company but their account will remain active.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
