/**
 * Team member types for all roles (admin, user, operator).
 * All roles use the same unified structure.
 */

export interface TeamMember {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'user' | 'operator';
  name: string | null;
  email: string | null;
  last_sign_in_at: string | null;
  created_at: string;
}

export interface TeamMemberCreateRequest {
  company_id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'operator';
}

export interface TeamMemberCreateResponse {
  success: boolean;
  id: string;
  user_id: string;
  message: string;
}
