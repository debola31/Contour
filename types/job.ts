/**
 * Job status values
 */
export type JobStatus = 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'shipped' | 'cancelled';

/**
 * Job priority values
 */
export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Job attachment record from database
 */
export interface JobAttachment {
  id: string;
  job_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  source_quote_attachment_id: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

/**
 * Job operation record from database
 */
export interface JobOperation {
  id: string;
  job_id: string;
  sequence: number;
  operation_name: string;
  operation_type_id: string | null;
  estimated_setup_hours: number;
  estimated_run_hours_per_unit: number;
  actual_setup_hours: number | null;
  actual_run_hours: number | null;
  quantity_completed: number;
  quantity_scrapped: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  started_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  completed_by: string | null;
  instructions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined operation type data
  operation_type?: {
    id: string;
    name: string;
    labor_rate: number | null;
  } | null;
}

/**
 * Job record from database
 */
export interface Job {
  id: string;
  company_id: string;
  job_number: string;
  quote_id: string | null;
  routing_id: string | null;
  customer_id: string;
  part_id: string | null;
  description: string | null;
  quantity_ordered: number;
  quantity_completed: number;
  quantity_scrapped: number;
  due_date: string | null;
  priority: JobPriority;
  status: JobStatus;
  status_changed_at: string | null;
  current_operation_sequence: number | null;
  started_at: string | null;
  completed_at: string | null;
  shipped_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Job with joined relation data
 */
export interface JobWithRelations extends Job {
  // Joined customer data
  customers?: {
    id: string;
    name: string;
    customer_code: string | null;
  } | null;
  // Joined part data
  parts?: {
    id: string;
    part_number: string;
    description: string | null;
  } | null;
  // Joined quote data (if created from quote)
  quotes?: {
    id: string;
    quote_number: string;
    total_price: number | null;
  } | null;
  // Joined routing data
  routings?: {
    id: string;
    name: string;
  } | null;
  // Joined operations
  job_operations?: JobOperation[];
  // Joined attachments
  job_attachments?: JobAttachment[];
}

/**
 * Job with attachments included (legacy - use JobWithRelations)
 */
export interface JobWithAttachments extends Job {
  attachments: JobAttachment[];
}

/**
 * Form data for creating/editing jobs
 */
export interface JobFormData {
  customer_id: string;
  part_id: string;
  routing_id: string;
  description: string;
  quantity_ordered: string; // String for form input
  due_date: string;
  priority: JobPriority;
}

/**
 * Filters for jobs list
 */
export interface JobFilters {
  status?: JobStatus | 'all' | 'active'; // 'active' = not shipped/cancelled
  customerId?: string;
  search?: string;
}

/**
 * Empty form defaults for NEW jobs
 */
export const EMPTY_JOB_FORM: JobFormData = {
  customer_id: '',
  part_id: '',
  routing_id: '',
  description: '',
  quantity_ordered: '1',
  due_date: '',
  priority: 'normal',
};

/**
 * Convert Job to JobFormData for edit forms
 */
export function jobToFormData(job: Job): JobFormData {
  return {
    customer_id: job.customer_id,
    part_id: job.part_id || '',
    routing_id: job.routing_id || '',
    description: job.description || '',
    quantity_ordered: String(job.quantity_ordered),
    due_date: job.due_date || '',
    priority: job.priority,
  };
}

/**
 * Status display configuration
 */
export const JOB_STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }
> = {
  pending: { label: 'Pending', color: 'default' },
  in_progress: { label: 'In Progress', color: 'info' },
  on_hold: { label: 'On Hold', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
  shipped: { label: 'Shipped', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

/**
 * Priority display configuration
 */
export const JOB_PRIORITY_CONFIG: Record<
  JobPriority,
  { label: string; color: 'default' | 'info' | 'warning' | 'error' }
> = {
  low: { label: 'Low', color: 'default' },
  normal: { label: 'Normal', color: 'info' },
  high: { label: 'High', color: 'warning' },
  urgent: { label: 'Urgent', color: 'error' },
};
