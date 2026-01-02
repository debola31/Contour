import { getSupabase } from '@/lib/supabase';
import type {
  Operation,
  ResourceGroup,
  ResourceGroupFormData,
  OperationFormData,
  OperationsGroupedResponse,
  ResourceGroupWithOperations,
  OperationWithRelations,
  OperationImportResult,
  OperationWithGroup,
} from '@/types/operations';

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
 * Operations in this group will become ungrouped (resource_group_id = NULL).
 */
export async function deleteResourceGroup(groupId: string): Promise<void> {
  const supabase = getSupabase();

  // First, ungroup all operations in this group
  const { error: ungroupError } = await supabase
    .from('operation_types')
    .update({ resource_group_id: null, updated_at: new Date().toISOString() })
    .eq('resource_group_id', groupId);

  if (ungroupError) {
    console.error('Error ungrouping operations:', ungroupError);
    throw ungroupError;
  }

  // Then delete the group
  const { error } = await supabase.from('resource_groups').delete().eq('id', groupId);

  if (error) {
    console.error('Error deleting resource group:', error);
    throw error;
  }
}

/**
 * Get count of operations in a resource group
 */
export async function getResourceGroupOperationCount(groupId: string): Promise<number> {
  const supabase = getSupabase();

  const { count, error } = await supabase
    .from('operation_types')
    .select('*', { count: 'exact', head: true })
    .eq('resource_group_id', groupId);

  if (error) {
    console.error('Error counting operations in group:', error);
    return 0;
  }

  return count || 0;
}

// ============== Operations ==============

/**
 * Get all operations as a flat list with resource group info for AG Grid display.
 */
export async function getAllOperations(
  companyId: string,
  search?: string,
  sortField: string = 'name',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<OperationWithGroup[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('operation_types')
    .select(
      `
      *,
      resource_group:resource_groups(id, name)
    `
    )
    .eq('company_id', companyId)
    .order(sortField, { ascending: sortDirection === 'asc' });

  if (search?.trim()) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching operations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get operations grouped by resource_group (legacy accordion view).
 * Returns groups with nested operations + ungrouped operations separately.
 */
export async function getOperationsGrouped(
  companyId: string,
  search: string = ''
): Promise<OperationsGroupedResponse> {
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

  // Get all operations
  let operationsQuery = supabase
    .from('operation_types')
    .select('*')
    .eq('company_id', companyId)
    .order('name', { ascending: true });

  if (search.trim()) {
    operationsQuery = operationsQuery.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data: operationsData, error: operationsError } = await operationsQuery;

  if (operationsError) {
    console.error('Error fetching operations:', operationsError);
    throw operationsError;
  }

  // Build grouped structure
  const groupsMap: Record<string, ResourceGroupWithOperations> = {};
  for (const group of groupsData || []) {
    groupsMap[group.id] = {
      ...group,
      operations: [],
      operation_count: 0,
    };
  }

  const ungrouped: Operation[] = [];

  for (const operation of operationsData || []) {
    if (operation.resource_group_id && groupsMap[operation.resource_group_id]) {
      groupsMap[operation.resource_group_id].operations.push(operation);
      groupsMap[operation.resource_group_id].operation_count++;
    } else {
      ungrouped.push(operation);
    }
  }

  return {
    groups: Object.values(groupsMap),
    ungrouped,
  };
}

/**
 * Get all operations as a flat list (for dropdowns, etc.)
 */
export async function getOperationsFlat(
  companyId: string,
  options?: { search?: string; groupId?: string }
): Promise<Operation[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('operation_types')
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
    console.error('Error fetching operations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single operation by ID
 */
export async function getOperation(operationId: string): Promise<Operation | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('operation_types')
    .select('*')
    .eq('id', operationId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching operation:', error);
    throw error;
  }

  return data;
}

/**
 * Get an operation with relation counts for delete constraint checks
 */
export async function getOperationWithRelations(
  operationId: string
): Promise<OperationWithRelations | null> {
  const supabase = getSupabase();

  // Get operation
  const { data: operation, error: operationError } = await supabase
    .from('operation_types')
    .select('*')
    .eq('id', operationId)
    .single();

  if (operationError && operationError.code !== 'PGRST116') {
    console.error('Error fetching operation:', operationError);
    throw operationError;
  }

  if (!operation) {
    return null;
  }

  // Get routing_operations count (if operation_type_id exists on routing_operations)
  // NOTE: routing_operations may not have a direct FK to operation_types
  // This check is for future compatibility
  const { count: routingOpsCount, error: opsError } = await supabase
    .from('routing_operations')
    .select('*', { count: 'exact', head: true })
    .eq('operation_type_id', operationId);

  if (opsError) {
    // If the column doesn't exist, that's fine - just return 0
    console.warn('Note: routing_operations may not have operation_type_id column');
  }

  return {
    ...operation,
    routing_operations_count: routingOpsCount || 0,
  };
}

/**
 * Check if an operation name already exists for a company
 */
export async function checkOperationNameExists(
  companyId: string,
  name: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();

  let query = supabase
    .from('operation_types')
    .select('id')
    .eq('company_id', companyId)
    .ilike('name', name);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking operation name:', error);
    throw error;
  }

  return (data?.length || 0) > 0;
}

/**
 * Create a new operation
 */
export async function createOperation(
  companyId: string,
  formData: OperationFormData
): Promise<Operation> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('operation_types')
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
    console.error('Error creating operation:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing operation
 */
export async function updateOperation(
  operationId: string,
  formData: OperationFormData
): Promise<Operation> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('operation_types')
    .update({
      name: formData.name.trim(),
      code: formData.code.trim() || null,
      resource_group_id: formData.resource_group_id || null,
      labor_rate: formData.labor_rate ? parseFloat(formData.labor_rate) : null,
      description: formData.description.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating operation:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an operation
 */
export async function deleteOperation(operationId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('operation_types').delete().eq('id', operationId);

  if (error) {
    // FK constraint violation
    if (error.code === '23503') {
      throw new Error(
        'Cannot delete this operation because it is used in routing operations. Remove those references first.'
      );
    }
    console.error('Error deleting operation:', error);
    throw error;
  }
}

/**
 * Bulk delete operations
 */
export async function bulkDeleteOperations(operationIds: string[]): Promise<void> {
  if (operationIds.length === 0) return;

  const validIds = operationIds.filter((id) => id && typeof id === 'string');
  if (validIds.length === 0) return;

  const supabase = getSupabase();
  const BATCH_SIZE = 100;

  for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
    const batch = validIds.slice(i, i + BATCH_SIZE);

    const { error } = await supabase.from('operation_types').delete().in('id', batch);

    if (error) {
      if (error.code === '23503') {
        throw new Error(
          'Cannot delete some operations because they are used in routing operations. Remove those references first.'
        );
      }
      console.error('Error bulk deleting operations:', error);
      throw new Error(error.message || 'Failed to delete operations');
    }
  }
}

// ============== Import Helpers ==============

/**
 * Bulk import operations from CSV data.
 * Optionally auto-creates resource groups.
 */
export async function bulkImportOperations(
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
): Promise<OperationImportResult> {
  const supabase = getSupabase();
  const results: OperationImportResult = {
    imported: 0,
    skipped: 0,
    groups_created: 0,
    errors: [],
  };

  // Pre-fetch existing operations to check for duplicates
  const { data: existing } = await supabase
    .from('operation_types')
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
        reason: `Operation "${row.name}" already exists`,
      });
      results.skipped++;
      continue;
    }

    // Check for duplicate within the import file
    if (importedNames.has(nameKey)) {
      results.errors.push({
        row: rowNum,
        reason: `Duplicate operation "${row.name}" in file`,
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

    // Insert operation
    const { error } = await supabase.from('operation_types').insert({
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
