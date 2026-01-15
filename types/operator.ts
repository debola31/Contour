/**
 * TypeScript types for the Operator View module.
 *
 * Authentication is handled via Supabase Auth (email/password).
 * Operators authenticate the same way as admin users, but access
 * a dedicated operator interface and have operator-specific records.
 */

// ============================================================================
// OPERATOR TYPES
// ============================================================================

/**
 * Operator data as stored in the database.
 * Note: Email is stored in auth.users, not duplicated here.
 * Use OperatorWithEmail when displaying email is needed.
 */
export interface Operator {
  id: string;
  company_id: string;
  user_id: string;
  name: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Operator with email fetched from auth.users.
 * Used for display purposes in admin views.
 */
export interface OperatorWithEmail extends Operator {
  email: string | null;
}

/**
 * Request body for creating a new operator.
 */
export interface OperatorCreateRequest {
  company_id: string;
  name: string;
  email: string;
  password: string; // Temporary password, operator must change on first login
}

/**
 * Response from creating an operator.
 */
export interface OperatorCreateResponse {
  success: boolean;
  operator_id: string;
  user_id: string;
  message: string;
}

/**
 * Request body for updating an operator.
 */
export interface OperatorUpdateRequest {
  name?: string;
}

// ============================================================================
// AUTHENTICATION - Handled by Supabase Auth
// ============================================================================

// Note: Operator authentication uses standard Supabase Auth (email/password).
// Use supabase.auth.signInWithPassword() for login.
// Use supabase.auth.signOut() for logout.
// Use supabase.auth.updateUser() for password changes.

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
