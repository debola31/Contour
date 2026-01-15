/**
 * Team member types for Admin/User management.
 */

export interface TeamMember {
  id: string;
  user_id: string;
  company_id: string;
  role: 'admin' | 'user';
  email: string | null;
  name: string | null;
  created_at: string;
}

export interface TeamMemberCreateRequest {
  company_id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface TeamMemberCreateResponse {
  success: boolean;
  id: string;
  user_id: string;
  message: string;
}
