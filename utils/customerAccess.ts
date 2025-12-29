import { getSupabase } from '@/lib/supabase';
import type {
  Customer,
  CustomerFormData,
  CustomerFilter,
  CustomerWithRelations,
  ImportResult,
} from '@/types/customer';

/**
 * Get paginated list of customers for a company
 */
export async function getCustomers(
  companyId: string,
  filter: CustomerFilter = 'all',
  search: string = '',
  page: number = 1,
  limit: number = 25
): Promise<{ data: Customer[]; total: number }> {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('company_id', companyId)
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  // Apply filter
  if (filter === 'active') {
    query = query.eq('is_active', true);
  } else if (filter === 'inactive') {
    query = query.eq('is_active', false);
  }

  // Apply search (name or code)
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%,customer_code.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  return { data: data || [], total: count || 0 };
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer:', error);
    throw error;
  }

  return data;
}

/**
 * Get a customer with related quotes and jobs counts
 */
export async function getCustomerWithRelations(
  customerId: string
): Promise<CustomerWithRelations | null> {
  const supabase = getSupabase();

  // Get customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (customerError && customerError.code !== 'PGRST116') {
    console.error('Error fetching customer:', customerError);
    throw customerError;
  }

  if (!customer) {
    return null;
  }

  // Get quotes count
  const { count: quotesCount, error: quotesError } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  if (quotesError) {
    console.error('Error fetching quotes count:', quotesError);
  }

  // Get jobs count
  const { count: jobsCount, error: jobsError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId);

  if (jobsError) {
    console.error('Error fetching jobs count:', jobsError);
  }

  return {
    ...customer,
    quotes_count: quotesCount || 0,
    jobs_count: jobsCount || 0,
  };
}

/**
 * Check if a customer code already exists for a company
 */
export async function checkCustomerCodeExists(
  companyId: string,
  customerCode: string,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();

  let query = supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId)
    .ilike('customer_code', customerCode);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking customer code:', error);
    throw error;
  }

  return (data?.length || 0) > 0;
}

/**
 * Create a new customer
 */
export async function createCustomer(
  companyId: string,
  formData: CustomerFormData
): Promise<Customer> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_id: companyId,
      customer_code: formData.customer_code.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      website: formData.website.trim() || null,
      contact_name: formData.contact_name.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_email: formData.contact_email.trim() || null,
      address_line1: formData.address_line1.trim() || null,
      address_line2: formData.address_line2.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      country: formData.country.trim() || 'USA',
      is_active: formData.is_active,
      notes: formData.notes.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing customer
 */
export async function updateCustomer(
  customerId: string,
  formData: CustomerFormData
): Promise<Customer> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('customers')
    .update({
      customer_code: formData.customer_code.trim(),
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      website: formData.website.trim() || null,
      contact_name: formData.contact_name.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      contact_email: formData.contact_email.trim() || null,
      address_line1: formData.address_line1.trim() || null,
      address_line2: formData.address_line2.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      postal_code: formData.postal_code.trim() || null,
      country: formData.country.trim() || 'USA',
      is_active: formData.is_active,
      notes: formData.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  return data;
}

/**
 * Soft delete a customer (mark as inactive)
 */
export async function softDeleteCustomer(customerId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('customers')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);

  if (error) {
    console.error('Error soft deleting customer:', error);
    throw error;
  }
}

/**
 * Bulk import customers from CSV data
 */
export async function bulkImportCustomers(
  companyId: string,
  rows: CustomerFormData[]
): Promise<ImportResult> {
  const supabase = getSupabase();
  const results: ImportResult = { imported: 0, skipped: 0, errors: [] };

  // Pre-fetch existing codes for efficiency
  const { data: existing } = await supabase
    .from('customers')
    .select('customer_code')
    .eq('company_id', companyId);

  const existingCodes = new Set(
    (existing || []).map((c: { customer_code: string }) => c.customer_code.toLowerCase())
  );

  // Track codes added during this import to detect duplicates within the file
  const importedCodes = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 for 1-indexed and header row

    // Validation: customer_code required
    if (!row.customer_code?.trim()) {
      results.errors.push({ row: rowNum, reason: 'Missing customer code' });
      results.skipped++;
      continue;
    }

    // Validation: name required
    if (!row.name?.trim()) {
      results.errors.push({ row: rowNum, reason: 'Missing name' });
      results.skipped++;
      continue;
    }

    const codeKey = row.customer_code.trim().toLowerCase();

    // Check for existing code in database
    if (existingCodes.has(codeKey)) {
      results.errors.push({
        row: rowNum,
        reason: `Customer code "${row.customer_code}" already exists`,
      });
      results.skipped++;
      continue;
    }

    // Check for duplicate within the import file
    if (importedCodes.has(codeKey)) {
      results.errors.push({
        row: rowNum,
        reason: `Duplicate customer code "${row.customer_code}" in file`,
      });
      results.skipped++;
      continue;
    }

    // Insert
    const { error } = await supabase.from('customers').insert({
      company_id: companyId,
      customer_code: row.customer_code.trim(),
      name: row.name.trim(),
      phone: row.phone?.trim() || null,
      email: row.email?.trim() || null,
      website: row.website?.trim() || null,
      contact_name: row.contact_name?.trim() || null,
      contact_phone: row.contact_phone?.trim() || null,
      contact_email: row.contact_email?.trim() || null,
      address_line1: row.address_line1?.trim() || null,
      address_line2: row.address_line2?.trim() || null,
      city: row.city?.trim() || null,
      state: row.state?.trim() || null,
      postal_code: row.postal_code?.trim() || null,
      country: row.country?.trim() || 'USA',
      is_active: true,
      notes: row.notes?.trim() || null,
    });

    if (error) {
      results.errors.push({ row: rowNum, reason: error.message });
      results.skipped++;
    } else {
      results.imported++;
      importedCodes.add(codeKey);
      existingCodes.add(codeKey);
    }
  }

  return results;
}
