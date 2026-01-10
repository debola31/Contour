/**
 * Operator View API utilities.
 *
 * These functions call the FastAPI backend for operator authentication
 * and job operations. Uses JWT tokens stored in localStorage.
 */

import type {
  OperatorLoginRequest,
  OperatorLoginResponse,
  OperatorJob,
  OperatorJobDetail,
  OperatorSession,
  ActiveSession,
  JobStartRequest,
  JobStopRequest,
  JobCompleteRequest,
  JobCompleteResponse,
  Operator,
  OperatorCreateRequest,
  OperatorUpdateRequest,
} from '@/types/operator';

// API base URL - uses FastAPI backend
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

// Token storage key
const TOKEN_KEY = 'operator_token';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get the stored operator JWT token.
 */
export function getOperatorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store the operator JWT token.
 */
export function setOperatorToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove the operator JWT token.
 */
export function clearOperatorToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if an operator is authenticated.
 */
export function isOperatorAuthenticated(): boolean {
  return !!getOperatorToken();
}

/**
 * Decode JWT token payload (without verification).
 * Used to extract operator info client-side.
 */
export function decodeOperatorToken(): {
  operator_id: string;
  company_id: string;
  operator_name: string;
  operation_type_id: string | null;
  exp: number;
} | null {
  const token = getOperatorToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Check if the operator token is expired.
 */
export function isTokenExpired(): boolean {
  const decoded = decodeOperatorToken();
  if (!decoded) return true;

  const now = Date.now() / 1000;
  return decoded.exp < now;
}

// ============================================================================
// API HELPERS
// ============================================================================

/**
 * Make an authenticated API request.
 */
async function operatorFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getOperatorToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    clearOperatorToken();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Request failed');
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============================================================================
// OPERATOR AUTHENTICATION
// ============================================================================

/**
 * Log in an operator via PIN or QR badge.
 */
export async function operatorLogin(
  request: OperatorLoginRequest
): Promise<OperatorLoginResponse> {
  const response = await fetch(`${API_BASE}/operator/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  const data: OperatorLoginResponse = await response.json();

  // Store the token
  setOperatorToken(data.token);

  return data;
}

/**
 * Log out the current operator.
 */
export async function operatorLogout(): Promise<void> {
  try {
    await operatorFetch('/operator/logout', { method: 'POST' });
  } finally {
    clearOperatorToken();
  }
}

// ============================================================================
// OPERATOR JOB OPERATIONS
// ============================================================================

/**
 * Get list of jobs available for the operator.
 * Optionally filtered by operation type (station).
 */
export async function getOperatorJobs(
  operationTypeId?: string
): Promise<OperatorJob[]> {
  const params = operationTypeId
    ? `?operation_type_id=${operationTypeId}`
    : '';
  return operatorFetch<OperatorJob[]>(`/operator/jobs${params}`);
}

/**
 * Get detailed job information.
 */
export async function getOperatorJobDetail(
  jobId: string,
  operationTypeId?: string
): Promise<OperatorJobDetail> {
  const params = operationTypeId
    ? `?operation_type_id=${operationTypeId}`
    : '';
  return operatorFetch<OperatorJobDetail>(`/operator/jobs/${jobId}${params}`);
}

/**
 * Start working on a job.
 */
export async function startJob(
  jobId: string,
  request: JobStartRequest
): Promise<OperatorSession> {
  return operatorFetch<OperatorSession>(`/operator/jobs/${jobId}/start`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Stop (pause) work on a job.
 */
export async function stopJob(
  jobId: string,
  request?: JobStopRequest
): Promise<OperatorSession> {
  return operatorFetch<OperatorSession>(`/operator/jobs/${jobId}/stop`, {
    method: 'POST',
    body: JSON.stringify(request || {}),
  });
}

/**
 * Mark a job operation as complete.
 */
export async function completeJob(
  jobId: string,
  request: JobCompleteRequest
): Promise<JobCompleteResponse> {
  return operatorFetch<JobCompleteResponse>(`/operator/jobs/${jobId}/complete`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Get the operator's current active session, if any.
 */
export async function getActiveSession(): Promise<ActiveSession | null> {
  try {
    return await operatorFetch<ActiveSession>('/operator/active');
  } catch (error) {
    // 404 means no active session
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// ============================================================================
// ADMIN OPERATOR CRUD
// ============================================================================

/**
 * List all operators for a company (admin).
 */
export async function listOperators(companyId: string): Promise<Operator[]> {
  return operatorFetch<Operator[]>(`/operators?company_id=${companyId}`);
}

/**
 * Get a single operator by ID (admin).
 */
export async function getOperator(operatorId: string): Promise<Operator> {
  return operatorFetch<Operator>(`/operators/${operatorId}`);
}

/**
 * Create a new operator (admin).
 */
export async function createOperator(
  request: OperatorCreateRequest
): Promise<Operator> {
  return operatorFetch<Operator>('/operators', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Update an operator (admin).
 */
export async function updateOperator(
  operatorId: string,
  request: OperatorUpdateRequest
): Promise<Operator> {
  return operatorFetch<Operator>(`/operators/${operatorId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

/**
 * Delete an operator (admin).
 */
export async function deleteOperator(
  operatorId: string
): Promise<{ success: boolean }> {
  return operatorFetch<{ success: boolean }>(`/operators/${operatorId}`, {
    method: 'DELETE',
  });
}

/**
 * Get work session history for an operator (admin).
 */
export async function getOperatorSessions(
  operatorId: string,
  limit: number = 50
): Promise<OperatorSession[]> {
  return operatorFetch<OperatorSession[]>(
    `/operators/${operatorId}/sessions?limit=${limit}`
  );
}
