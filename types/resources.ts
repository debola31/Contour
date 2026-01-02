/**
 * Resource Group - Category for organizing resources
 */
export interface ResourceGroup {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Resource Group with nested resources (for grouped display)
 */
export interface ResourceGroupWithResources extends ResourceGroup {
  resources: Resource[];
  resource_count: number;
}

/**
 * Resource - Operation type with labor rate
 */
export interface Resource {
  id: string;
  company_id: string;
  resource_group_id: string | null;
  name: string;
  code: string | null;
  labor_rate: number | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Resource with group info (for flat lists)
 */
export interface ResourceWithGroup extends Resource {
  resource_group: { id: string; name: string } | null;
}

/**
 * Grouped response structure for main page
 */
export interface ResourcesGroupedResponse {
  groups: ResourceGroupWithResources[];
  ungrouped: Resource[];
}

/**
 * Form data for Resource Group create/edit
 */
export interface ResourceGroupFormData {
  name: string;
  description: string;
  display_order: number;
}

/**
 * Form data for Resource create/edit
 */
export interface ResourceFormData {
  name: string;
  code: string;
  resource_group_id: string;
  labor_rate: string;
  description: string;
}

/**
 * Resource with relation counts for delete constraint checks
 */
export interface ResourceWithRelations extends Resource {
  routing_operations_count: number;
}

/**
 * Import result for resources
 */
export interface ResourceImportResult {
  imported: number;
  skipped: number;
  groups_created: number;
  errors: { row: number; reason: string }[];
}

/**
 * Empty form data for new resource
 */
export const EMPTY_RESOURCE_FORM: ResourceFormData = {
  name: '',
  code: '',
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
  display_order: 0,
};

/**
 * Convert Resource entity to form data
 */
export function resourceToFormData(resource: Resource): ResourceFormData {
  return {
    name: resource.name,
    code: resource.code || '',
    resource_group_id: resource.resource_group_id || '',
    labor_rate: resource.labor_rate !== null ? String(resource.labor_rate) : '',
    description: resource.description || '',
  };
}

/**
 * Convert ResourceGroup entity to form data
 */
export function resourceGroupToFormData(group: ResourceGroup): ResourceGroupFormData {
  return {
    name: group.name,
    description: group.description || '',
    display_order: group.display_order,
  };
}
