'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import UploadIcon from '@mui/icons-material/Upload';
import { getResourcesGrouped, deleteResource } from '@/utils/resourcesAccess';
import type { ResourcesGroupedResponse, ResourceGroup } from '@/types/resources';
import ResourceGroupModal from '@/components/resources/ResourceGroupModal';
import ResourceRow from '@/components/resources/ResourceRow';

export default function ResourcesPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  const [data, setData] = useState<ResourcesGroupedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group modal state
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ResourceGroup | null>(null);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getResourcesGrouped(companyId, debouncedSearch || undefined);
      setData(result);

      // Expand all groups by default
      const groupIds = new Set(result.groups.map((g) => g.id));
      if (result.ungrouped.length > 0) groupIds.add('ungrouped');
      setExpandedGroups(groupIds);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [companyId, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const handleEditGroup = (group: ResourceGroup) => {
    setEditingGroup(group);
    setGroupModalOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupModalOpen(true);
  };

  const handleGroupSaved = () => {
    setGroupModalOpen(false);
    setEditingGroup(null);
    fetchData();
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
      await deleteResource(resourceId);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete resource');
    }
  };

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Actions */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3} gap={1}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/resources/import`)}
        >
          Import
        </Button>
        <Button variant="outlined" onClick={handleCreateGroup}>
          + New Group
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/dashboard/${companyId}/resources/new`)}
        >
          New Resource
        </Button>
      </Box>

      {/* Search */}
      <TextField
        placeholder="Search resources by name or code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3, maxWidth: 400 }}
        fullWidth
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {data && data.groups.length === 0 && data.ungrouped.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No resources yet
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Create your first resource or import from your legacy system.
          </Typography>
          <Box display="flex" gap={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => router.push(`/dashboard/${companyId}/resources/import`)}
            >
              Import Resources
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push(`/dashboard/${companyId}/resources/new`)}
            >
              Create Resource
            </Button>
          </Box>
        </Box>
      )}

      {/* Grouped Resources */}
      {data?.groups.map((group) => (
        <Accordion
          key={group.id}
          expanded={expandedGroups.has(group.id)}
          onChange={() => handleToggleGroup(group.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {group.name}
              </Typography>
              <Chip
                label={`${group.resources?.length || 0} resources`}
                size="small"
                variant="outlined"
              />
              <Box flex={1} />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditGroup(group);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {group.resources?.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                onEdit={() =>
                  router.push(`/dashboard/${companyId}/resources/${resource.id}/edit`)
                }
                onDelete={() => handleDeleteResource(resource.id)}
              />
            ))}
            {(!group.resources || group.resources.length === 0) && (
              <Box p={2} textAlign="center">
                <Typography color="text.secondary" variant="body2">
                  No resources in this group
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Ungrouped Resources */}
      {data && data.ungrouped.length > 0 && (
        <Accordion
          expanded={expandedGroups.has('ungrouped')}
          onChange={() => handleToggleGroup('ungrouped')}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={2} flex={1}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.secondary">
                Ungrouped
              </Typography>
              <Chip
                label={`${data.ungrouped.length} resources`}
                size="small"
                variant="outlined"
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {data.ungrouped.map((resource) => (
              <ResourceRow
                key={resource.id}
                resource={resource}
                onEdit={() =>
                  router.push(`/dashboard/${companyId}/resources/${resource.id}/edit`)
                }
                onDelete={() => handleDeleteResource(resource.id)}
              />
            ))}
          </AccordionDetails>
        </Accordion>
      )}

      {/* Group Modal */}
      <ResourceGroupModal
        open={groupModalOpen}
        onClose={() => {
          setGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSaved={handleGroupSaved}
        companyId={companyId}
        group={editingGroup}
      />
    </Box>
  );
}
