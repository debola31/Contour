/**
 * Resource Group - Category for organizing operations
 * NOTE: "Resource Group" terminology stays as-is per PRD
 */
export interface ResourceGroup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Resource Group with nested operations (for grouped display)
 */
export interface ResourceGroupWithOperations extends ResourceGroup {
  operations: Operation[];
  operation_count: number;
}

/**
 * Operation - Operation type with labor rate
 * NOTE: Database table is "operation_types"
 */
export interface Operation {
  id: string;
  company_id: string;
  resource_group_id: string | null;
  name: string;
  labor_rate: number | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Operation with group info (for flat lists with AG Grid)
 */
export interface OperationWithGroup extends Operation {
  resource_group: { id: string; name: string } | null;
}

/**
 * Grouped response structure (legacy - for accordion view)
 */
export interface OperationsGroupedResponse {
  groups: ResourceGroupWithOperations[];
  ungrouped: Operation[];
}

/**
 * Form data for Resource Group create/edit
 */
export interface ResourceGroupFormData {
  name: string;
  description: string;
}

/**
 * Form data for Operation create/edit
 */
export interface OperationFormData {
  name: string;
  resource_group_id: string;
  labor_rate: string;
  description: string;
}

/**
 * Operation with relation counts for delete constraint checks
 */
export interface OperationWithRelations extends Operation {
  routing_operations_count: number;
}

/**
 * Import result for operations
 */
export interface OperationImportResult {
  imported: number;
  skipped: number;
  groups_created: number;
  errors: { row: number; reason: string }[];
}

/**
 * Empty form data for new operation
 */
export const EMPTY_OPERATION_FORM: OperationFormData = {
  name: '',
  resource_group_id: '',
  labor_rate: '',
  description: '',
};

/**
 * Empty form data for new resource group
 */
export const EMPTY_RESOURCE_GROUP_FORM: ResourceGroupFormData = {
  name: '',
  description: '',
};

/**
 * Convert Operation entity to form data
 */
export function operationToFormData(operation: Operation): OperationFormData {
  return {
    name: operation.name,
    resource_group_id: operation.resource_group_id || '',
    labor_rate: operation.labor_rate !== null ? String(operation.labor_rate) : '',
    description: operation.description || '',
  };
}

/**
 * Convert ResourceGroup entity to form data
 */
export function resourceGroupToFormData(group: ResourceGroup): ResourceGroupFormData {
  return {
    name: group.name,
    description: group.description || '',
  };
}
