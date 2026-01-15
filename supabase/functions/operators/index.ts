/**
 * Operators Edge Function
 *
 * Handles operator management operations that require service role:
 * - GET /operators?company_id=xxx - List operators with emails
 * - GET /operators/:id - Get single operator with email
 * - POST /operators - Create operator (auth user + operator record)
 * - POST /operators/:id/reset-password - Reset operator password
 */

import {
  getServiceRoleClient,
  handleCors,
  jsonResponse,
  errorResponse,
} from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Path: /operators or /operators/:id or /operators/:id/reset-password

  try {
    const supabase = getServiceRoleClient();

    // GET /operators?company_id=xxx - List all operators
    if (req.method === 'GET' && pathParts.length === 1) {
      const companyId = url.searchParams.get('company_id');
      if (!companyId) {
        return errorResponse('company_id is required', 400);
      }

      // Get operators for this company
      const { data: operators, error: opError } = await supabase
        .from('operators')
        .select('id, company_id, user_id, name, last_login_at, created_at, updated_at')
        .eq('company_id', companyId)
        .order('name');

      if (opError) {
        console.error('Error fetching operators:', opError);
        return errorResponse('Failed to fetch operators', 500);
      }

      if (!operators || operators.length === 0) {
        return jsonResponse([]);
      }

      // Build email map from auth.users
      const userIds = operators.map((op) => op.user_id).filter(Boolean);
      const emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError && users?.users) {
          for (const user of users.users) {
            if (userIds.includes(user.id)) {
              emailMap[user.id] = user.email || '';
            }
          }
        }
      }

      // Combine data
      const result = operators.map((op) => ({
        ...op,
        email: emailMap[op.user_id] || null,
      }));

      return jsonResponse(result);
    }

    // GET /operators/:id - Get single operator
    if (req.method === 'GET' && pathParts.length === 2) {
      const operatorId = pathParts[1];

      const { data: operator, error: opError } = await supabase
        .from('operators')
        .select('id, company_id, user_id, name, last_login_at, created_at, updated_at')
        .eq('id', operatorId)
        .single();

      if (opError || !operator) {
        return errorResponse('Operator not found', 404);
      }

      // Get email
      let email = null;
      if (operator.user_id) {
        const { data: userData } = await supabase.auth.admin.getUserById(operator.user_id);
        email = userData?.user?.email || null;
      }

      return jsonResponse({ ...operator, email });
    }

    // POST /operators - Create new operator
    if (req.method === 'POST' && pathParts.length === 1) {
      const body = await req.json();
      const { company_id, name, email, password } = body;

      if (!company_id || !name || !email || !password) {
        return errorResponse('company_id, name, email, and password are required', 400);
      }

      if (password.length < 8) {
        return errorResponse('Password must be at least 8 characters', 400);
      }

      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u) => u.email === email);

      if (existingUser) {
        // Check if operator record already exists for this company
        const { data: existingOp } = await supabase
          .from('operators')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('company_id', company_id)
          .single();

        if (existingOp) {
          return errorResponse('An operator with this email already exists for this company', 400);
        }

        // Create operator for existing user
        const operatorId = crypto.randomUUID();
        await supabase.from('operators').insert({
          id: operatorId,
          company_id,
          user_id: existingUser.id,
          name,
        });

        // Check/create user_company_access
        const { data: accessCheck } = await supabase
          .from('user_company_access')
          .select('id')
          .eq('user_id', existingUser.id)
          .eq('company_id', company_id)
          .single();

        if (!accessCheck) {
          await supabase.from('user_company_access').insert({
            user_id: existingUser.id,
            company_id,
            role: 'operator',
          });
        }

        return jsonResponse({
          success: true,
          operator_id: operatorId,
          user_id: existingUser.id,
          message: 'Operator created for existing user',
        });
      }

      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          needs_password_change: true,
          name,
        },
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return errorResponse(`Failed to create user: ${authError?.message || 'Unknown error'}`, 500);
      }

      const userId = authData.user.id;

      // Create operator record
      const operatorId = crypto.randomUUID();
      const { error: opError } = await supabase.from('operators').insert({
        id: operatorId,
        company_id,
        user_id: userId,
        name,
      });

      if (opError) {
        console.error('Error creating operator:', opError);
        // Rollback: delete the auth user
        await supabase.auth.admin.deleteUser(userId);
        return errorResponse('Failed to create operator record', 500);
      }

      // Create user_company_access record
      const { error: accessError } = await supabase.from('user_company_access').insert({
        user_id: userId,
        company_id,
        role: 'operator',
      });

      if (accessError) {
        console.error('Error creating user_company_access:', accessError);
        // Continue anyway - can be fixed later
      }

      return jsonResponse({
        success: true,
        operator_id: operatorId,
        user_id: userId,
        message: 'Operator created successfully',
      });
    }

    // POST /operators/:id/reset-password
    if (req.method === 'POST' && pathParts.length === 3 && pathParts[2] === 'reset-password') {
      const operatorId = pathParts[1];
      const body = await req.json();
      const { new_password } = body;

      if (!new_password || new_password.length < 8) {
        return errorResponse('new_password must be at least 8 characters', 400);
      }

      // Get operator
      const { data: operator, error: opError } = await supabase
        .from('operators')
        .select('user_id, name')
        .eq('id', operatorId)
        .single();

      if (opError || !operator) {
        return errorResponse('Operator not found', 404);
      }

      if (!operator.user_id) {
        return errorResponse('Operator has no linked user account', 400);
      }

      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(operator.user_id, {
        password: new_password,
        user_metadata: {
          needs_password_change: true,
        },
      });

      if (updateError) {
        console.error('Error resetting password:', updateError);
        return errorResponse('Failed to reset password', 500);
      }

      return jsonResponse({
        success: true,
        message: `Password reset for ${operator.name}. They will be required to change it on next login.`,
      });
    }

    return errorResponse('Not found', 404);
  } catch (error) {
    console.error('Operators function error:', error);
    return errorResponse(`Internal server error: ${error.message}`, 500);
  }
});
