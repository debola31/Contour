'use client';

import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { getEdgeFunctionUrl } from '@/lib/supabase';
import type { TeamMemberCreateResponse } from '@/types/team';

/**
 * Get the Edge Function URL for unified team endpoint.
 */
const getTeamUrl = () => getEdgeFunctionUrl('team');

/**
 * Create New Team Member Page.
 *
 * Creates an admin, user, or operator with Supabase Auth (email/password).
 * Admin sets a temporary password; user must change on first login.
 */
export default function NewTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const companyId = params.companyId as string;
  const defaultRole = searchParams.get('role') as 'admin' | 'user' | 'operator' || 'user';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'operator'>(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Edge Function to create team member with Supabase user
      const url = getTeamUrl();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create team member' }));
        throw new Error(errorData.error || 'Failed to create team member');
      }

      const data: TeamMemberCreateResponse = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to create team member');
      }

      // Navigate back to team page with appropriate tab
      const tabIndex = role === 'admin' ? 0 : role === 'user' ? 1 : 2;
      router.push(`/dashboard/${companyId}/team?tab=${tabIndex}`);
    } catch (err) {
      console.error('Error creating team member:', err);
      setError(err instanceof Error ? err.message : 'Failed to create team member');
    } finally {
      setLoading(false);
    }
  };

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
          New {role === 'admin' ? 'Admin' : 'User'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create a new team member with email login access.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
            autoFocus
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
          />

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as 'admin' | 'user' | 'operator')}
            >
              <MenuItem value="admin">Admin - Full access, can manage team</MenuItem>
              <MenuItem value="user">User - Can use all modules, cannot manage team</MenuItem>
              <MenuItem value="operator">Operator - Shop floor access only</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Temporary Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
            helperText="User will be required to change this on first login"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => router.push(`/dashboard/${companyId}/team`)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Creating...' : `Create ${role === 'admin' ? 'Admin' : 'User'}`}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
