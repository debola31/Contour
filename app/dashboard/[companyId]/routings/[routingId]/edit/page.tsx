'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import { RoutingWorkflowBuilder } from '@/components/routings';
import { getRouting } from '@/utils/routingsAccess';
import type { RoutingWithPart } from '@/types/routings';

export default function EditRoutingPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const routingId = params.routingId as string;

  const [routing, setRouting] = useState<RoutingWithPart | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function loadRouting() {
      try {
        const data = await getRouting(routingId);
        setRouting(data);
      } catch (err) {
        console.error('Failed to load routing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRouting();
  }, [routingId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!routing) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Routing not found
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/routings`)}
        >
          Back to Routings
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 2,
          pb: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Tooltip title="Back to routings">
          <IconButton
            onClick={() => router.push(`/dashboard/${companyId}/routings`)}
            sx={{ color: 'text.secondary' }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {routing.name}
            </Typography>
            <Chip
              label={`Rev ${routing.revision}`}
              size="small"
              variant="outlined"
            />
            {routing.is_default && (
              <Chip label="Default" size="small" color="primary" variant="outlined" />
            )}
          </Box>
          {routing.part && (
            <Typography variant="body2" color="text.secondary">
              {routing.part.part_number} - {routing.part.name}
            </Typography>
          )}
        </Box>

        <Tooltip title="Routing settings">
          <IconButton
            onClick={() => router.push(`/dashboard/${companyId}/routings/new?edit=${routingId}`)}
            sx={{ color: 'text.secondary' }}
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Workflow Builder */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <RoutingWorkflowBuilder
          routingId={routingId}
          companyId={companyId}
          onRoutingUpdate={() => {
            // Refresh routing data if needed
          }}
        />
      </Box>
    </Box>
  );
}
