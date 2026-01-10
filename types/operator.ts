/**
 * TypeScript types for the Operator View module.
 *
 * Matches the Pydantic models in api/models/operators_models.py
 */

// ============================================================================
// OPERATOR TYPES
// ============================================================================

/**
 * Operator data as seen in admin views.
 * Note: PIN is never included in responses.
 */
export interface Operator {
  id: string;
  company_id: string;
  name: string;
  qr_code_id: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Request body for creating a new operator.
 */
export interface OperatorCreateRequest {
  company_id: string;
  name: string;
  pin: string; // 4-6 digits
  qr_code_id?: string;
}

/**
 * Request body for updating an operator.
 */
export interface OperatorUpdateRequest {
  name?: string;
  pin?: string; // 4-6 digits, will be re-hashed
  qr_code_id?: string;
  is_active?: boolean;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Request body for operator login.
 */
export interface OperatorLoginRequest {
  company_id: string;
  pin?: string; // 4-6 digits
  qr_code_id?: string;
  operation_type_id?: string; // Station from QR code
}

/**
 * Response from successful operator login.
 */
export interface OperatorLoginResponse {
  success: boolean;
  operator_id: string;
  operator_name: string;
  token: string;
  expires_in_hours: number;
}

// ============================================================================
// SESSION TYPES
// ============================================================================

/**
 * Work session data.
 */
export interface OperatorSession {
  id: string;
  operator_id: string;
  job_id: string;
  job_operation_id: string | null;
  operation_type_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  duration_seconds?: number;
}

/**
 * Active session with additional job details.
 */
export interface ActiveSession {
  id: string;
  operator_id: string;
  job_id: string;
  job_number: string | null;
  job_operation_id: string | null;
  operation_name: string | null;
  operation_type_id: string;
  started_at: string;
  notes: string | null;
}

// ============================================================================
// JOB TYPES
// ============================================================================

/**
 * Job data as seen by operators in the job list.
 */
export interface OperatorJob {
  id: string;
  job_number: string;
  customer_name: string | null;
  part_name: string | null;
  part_number: string | null;
  due_date: string | null;
  status: string;
  quantity_ordered: number | null;
  quantity_completed: number | null;
  // Current operation for this station
  operation_id: string | null;
  operation_name: string | null;
  operation_status: string | null;
  // Who is currently working on this operation
  current_operator_name: string | null;
}

/**
 * Detailed job data for active job view.
 */
export interface OperatorJobDetail {
  id: string;
  job_number: string;
  customer_name: string | null;
  part_name: string | null;
  part_number: string | null;
  due_date: string | null;
  status: string;
  quantity_ordered: number | null;
  quantity_completed: number | null;
  // Operation details
  operation_id: string | null;
  operation_name: string | null;
  operation_status: string | null;
  instructions: string | null;
  estimated_hours: number | null;
  // Active session info
  active_session_id: string | null;
  session_started_at: string | null;
  current_operator_id: string | null;
  current_operator_name: string | null;
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request body for starting work on a job.
 */
export interface JobStartRequest {
  operation_type_id: string;
}

/**
 * Request body for stopping work on a job.
 */
export interface JobStopRequest {
  notes?: string;
}

/**
 * Request body for completing a job operation.
 */
export interface JobCompleteRequest {
  notes?: string;
  quantity_completed?: number;
  quantity_scrapped?: number;
}

/**
 * Response from completing a job.
 */
export interface JobCompleteResponse {
  success: boolean;
  session_id: string;
  duration_seconds: number;
  job_completed: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Due date status for visual indicators.
 */
export type DueDateStatus = 'on_time' | 'at_risk' | 'overdue';

/**
 * Calculate due date status based on days remaining.
 */
export function getDueDateStatus(dueDate: string | null): DueDateStatus {
  if (!dueDate) return 'on_time';

  const now = new Date();
  const due = new Date(dueDate);
  const daysRemaining = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 3) return 'at_risk';
  return 'on_time';
}

/**
 * Format duration in seconds to HH:MM:SS.
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}
