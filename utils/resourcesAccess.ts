import { getSupabase } from '@/lib/supabase';
import type {
  Resource,
  ResourceGroup,
  ResourceGroupFormData,
  ResourceFormData,
  ResourcesGroupedResponse,
  ResourceGroupWithResources,
  ResourceWithRelations,
  ResourceImportResult,
} from '@/types/resources';

// ============== Resource Groups ==============

/**
 * Get all resource groups for a company
 */
export async function getResourceGroups(
  companyId: string,
  sortField: string = 'display_order',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<ResourceGroup[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resource_groups')
    .select('*')
    .eq('company_id', companyId)
    .order(sortField, { ascending: sortDirection === 'asc' })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching resource groups:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single resource group by ID
 */
export async function getResourceGroup(groupId: string): Promise<ResourceGroup | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resource_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching resource group:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new resource group
 */
export async function createResourceGroup(
  companyId: string,
  formData: ResourceGroupFormData
): Promise<ResourceGroup> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resource_groups')
    .insert({
      company_id: companyId,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      display_order: formData.display_order,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resource group:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing resource group
 */
export async function updateResourceGroup(
  groupId: string,
  formData: ResourceGroupFormData
): Promise<ResourceGroup> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resource_groups')
    .update({
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      display_order: formData.display_order,
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resource group:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a resource group.
 * Resources in this group will become ungrouped (resource_group_id = NULL).
 */
export async function deleteResourceGroup(groupId: string): Promise<void> {
  const supabase = getSupabase();

  // First, ungroup all resources in this group
  const { error: ungroupError } = await supabase
    .from('resources')
    .update({ resource_group_id: null, updated_at: new Date().toISOString() })
    .eq('resource_group_id', groupId);

  if (ungroupError) {
    console.error('Error ungrouping resources:', ungroupError);
    throw ungroupError;
  }

  // Then delete the group
  const { error } = await supabase
    .from('resource_groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    console.error('Error deleting resource group:', error);
    throw error;
  }
}

// ============== Resources ==============

/**
 * Get resources grouped by resource_group for the main page accordion view.
 * Returns groups with nested resources + ungrouped resources separately.
 */
export async function getResourcesGrouped(
  companyId: string,
  search: string = ''
): Promise<ResourcesGroupedResponse> {
  const supabase = getSupabase();

  // Get all groups
  const { data: groupsData, error: groupsError } = await supabase
    .from('resource_groups')
    .select('*')
    .eq('company_id', companyId)
    .order('display_order', { ascending: true })
    .order('name', { ascending: true });

  if (groupsError) {
    console.error('Error fetching resource groups:', groupsError);
    throw groupsError;
  }

  // Get all resources
  let resourcesQuery = supabase
    .from('resources')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (search.trim()) {
    resourcesQuery = resourcesQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data: resourcesData, error: resourcesError } = await resourcesQuery;

  if (resourcesError) {
    console.error('Error fetching resources:', resourcesError);
    throw resourcesError;
  }

  // Build grouped structure
  const groupsMap: Record<string, ResourceGroupWithResources> = {};
  for (const group of groupsData || []) {
    groupsMap[group.id] = {
      ...group,
      resources: [],
      resource_count: 0,
    };
  }

  const ungrouped: Resource[] = [];

  for (const resource of resourcesData || []) {
    if (resource.resource_group_id && groupsMap[resource.resource_group_id]) {
      groupsMap[resource.resource_group_id].resources.push(resource);
      groupsMap[resource.resource_group_id].resource_count++;
    } else {
      ungrouped.push(resource);
    }
  }

  return {
    groups: Object.values(groupsMap),
    ungrouped,
  };
}

/**
 * Get all resources as a flat list (for dropdowns, etc.)
 */
export async function getResourcesFlat(
  companyId: string,
  options?: { search?: string; groupId?: string }
): Promise<Resource[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('resources')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (options?.search?.trim()) {
    query = query.or(`name.ilike.%${options.search}%,code.ilike.%${options.search}%`);
  }

  if (options?.groupId) {
    query = query.eq('resource_group_id', options.groupId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single resource by ID
 */
export async function getResource(resourceId: string): Promise<Resource | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching resource:', error);
    throw error;
  }

  return data;
}

/**
 * Get a resource with relation counts for delete constraint checks
 */
export async function getResourceWithRelations(
  resourceId: string
): Promise<ResourceWithRelations | null> {
  const supabase = getSupabase();

  // Get resource
  const { data: resource, error: resourceError } = await supabase
    .from('resources')
    .select('*')
    .eq('id', resourceId)
    .single();

  if (resourceError && resourceError.code !== 'PGRST116') {
    console.error('Error fetching resource:', resourceError);
    throw resourceError;
  }

  if (!resource) {
    return null;
  }

  // Get routing_operations count
  const { count: routingOpsCount, error: opsError } = await supabase
    .from('routing_operations')
    .select('*', { count: 'exact', head: true })
    .eq('resource_id', resourceId);

  if (opsError) {
    console.error('Error fetching routing operations count:', opsError);
  }

  return {
    ...resource,
    routing_operations_count: routingOpsCount || 0,
  };
}

/**
 * Check if a resource name already exists for a company
 */
export async function checkResourceNameExists(
  companyId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();

  let query = supabase
    .from('resources')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', name);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking resource name:', error);
    throw error;
  }

  return (data?.length || 0) > 0;
}

/**
 * Create a new resource
 */
export async function createResource(
  companyId: string,
  formData: ResourceFormData
): Promise<Resource> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resources')
    .insert({
      company_id: companyId,
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      resource_group_id: formData.resource_group_id || null,
      labor_rate: formData.labor_rate ? parseFloat(formData.labor_rate) : null,
      description: formData.description.trim() || null,
      metadata: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating resource:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing resource
 */
export async function updateResource(
  resourceId: string,
  formData: ResourceFormData
): Promise<Resource> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('resources')
    .update({
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      resource_group_id: formData.resource_group_id || null,
      labor_rate: formData.labor_rate ? parseFloat(formData.labor_rate) : null,
      description: formData.description.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', resourceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resource:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a resource
 */
export async function deleteResource(resourceId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId);

  if (error) {
    // FK constraint violation
    if (error.code === '23503') {
      throw new Error(
        'Cannot delete this resource because it is used in routing operations. Remove those references first.'
      );
    }
    console.error('Error deleting resource:', error);
    throw error;
  }
}

/**
 * Bulk delete resources
 */
export async function bulkDeleteResources(resourceIds: string[]): Promise<void> {
  if (resourceIds.length === 0) return;

  const validIds = resourceIds.filter((id) => id && typeof id === 'string');
  if (validIds.length === 0) return;

  const supabase = getSupabase();
  const BATCH_SIZE = 100;

  for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
    const batch = validIds.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('resources')
      .delete()
      .in('id', batch);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Cannot delete some resources because they are used in routing operations. Remove those references first.'
        );
      }
      console.error('Error bulk deleting resources:', error);
      throw new Error(error.message || 'Failed to delete resources');
    }
  }
}

// ============== Import Helpers ==============

/**
 * Bulk import resources from CSV data.
 * Optionally auto-creates resource groups.
 */
export async function bulkImportResources(
  companyId: string,
  rows: Array<{
    name: string;
    code?: string;
    labor_rate?: string;
    resource_group?: string;
    description?: string;
    legacy_id?: string;
  }>,
  createGroups: boolean = true
): Promise<ResourceImportResult> {
  const supabase = getSupabase();
  const results: ResourceImportResult = {
    imported: 0,
    skipped: 0,
    groups_created: 0,
    errors: [],
  };

  // Pre-fetch existing resources to check for duplicates
  const { data: existing } = await supabase
    .from('resources')
    .select('name')
    .eq('company_id', companyId);

  const existingNames = new Set(
    (existing || []).map((r: { name: string }) => r.name.toLowerCase())
  );

  // Pre-fetch existing groups
  const { data: existingGroups } = await supabase
    .from('resource_groups')
    .select('id, name')
    .eq('company_id', companyId);

  const groupMap: Record<string, string> = {};
  for (const g of existingGroups || []) {
    groupMap[g.name.toLowerCase()] = g.id;
  }

  // Track names added during import
  const importedNames = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed and header row

    // Validation: name required
    if (!row.name?.trim()) {
      results.errors.push({ row: rowNum, reason: 'Missing name' });
      results.skipped++;
      continue;
    }

    const nameKey = row.name.trim().toLowerCase();

    // Check for existing name in database
    if (existingNames.has(nameKey)) {
      results.errors.push({
        row: rowNum,
        reason: `Resource "${row.name}" already exists`,
      });
      results.skipped++;
      continue;
    }

    // Check for duplicate within the import file
    if (importedNames.has(nameKey)) {
      results.errors.push({
        row: rowNum,
        reason: `Duplicate resource "${row.name}" in file`,
      });
      results.skipped++;
      continue;
    }

    // Handle group creation/assignment
    let resourceGroupId: string | null = null;
    if (row.resource_group?.trim() && createGroups) {
      const groupKey = row.resource_group.trim().toLowerCase();
      if (!groupMap[groupKey]) {
        // Create new group
        const { data: newGroup, error: groupError } = await supabase
          .from('resource_groups')
          .insert({
            company_id: companyId,
            name: row.resource_group.trim(),
            display_order: 0,
          })
          .select()
          .single();

        if (newGroup && !groupError) {
          groupMap[groupKey] = newGroup.id;
          results.groups_created++;
        }
      }
      resourceGroupId = groupMap[groupKey] || null;
    }

    // Insert resource
    const { error } = await supabase.from('resources').insert({
      company_id: companyId,
      name: row.name.trim(),
      code: row.code?.trim() || null,
      resource_group_id: resourceGroupId,
      labor_rate: row.labor_rate ? parseFloat(row.labor_rate) : null,
      description: row.description?.trim() || null,
      metadata: row.legacy_id ? { legacy_id: row.legacy_id } : {},
    });

    if (error) {
      results.errors.push({ row: rowNum, reason: error.message });
      results.skipped++;
    } else {
      results.imported++;
      importedNames.add(nameKey);
      existingNames.add(nameKey);
    }
  }

  return results;
}
