import { getSupabase } from '@/lib/supabase';
import type { Part, PartFormData, PricingTier } from '@/types/part';
import { sortPricingTiers } from '@/types/part';

/**
 * Get all parts for a company with optional filters
 * Use this for client-side pagination in AG Grid
 */
export async function getAllParts(
  companyId: string,
  customerId?: string | null, // undefined=all, null/'generic'=generic only, string=specific customer
  search: string = '',
  sortField: string = 'part_number',
  sortDirection: 'asc' | 'desc' = 'asc'
): Promise<Part[]> {
  const supabase = getSupabase();

  let query = supabase
    .from('parts')
    .select(
      `
      *,
      customers!left (
        id,
        name,
        customer_code
      )
    `
    )
    .eq('company_id', companyId)
    .order(sortField, { ascending: sortDirection === 'asc' });

  // Filter by customer
  if (customerId === null || customerId === 'generic') {
    query = query.is('customer_id', null);
  } else if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  // Apply search (part_number or description)
  if (search.trim()) {
    query = query.or(`part_number.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching all parts:', error);
    throw error;
  }

  // Transform the joined data and sort pricing tiers
  return (data || []).map((part) => ({
    ...part,
    customer: part.customers || null,
    pricing: sortPricingTiers(part.pricing || []),
  }));
}

/**
 * Get a single part by ID
 */
export async function getPart(partId: string): Promise<Part | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('parts')
    .select(
      `
      *,
      customers!left (
        id,
        name,
        customer_code
      )
    `
    )
    .eq('id', partId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching part:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    customer: data.customers || null,
    pricing: sortPricingTiers(data.pricing || []),
  };
}

/**
 * Get a part with related quotes and jobs counts
 */
export async function getPartWithRelations(partId: string): Promise<Part | null> {
  const supabase = getSupabase();

  // Get part with customer
  const { data: part, error: partError } = await supabase
    .from('parts')
    .select(
      `
      *,
      customers!left (
        id,
        name,
        customer_code
      )
    `
    )
    .eq('id', partId)
    .single();

  if (partError && partError.code !== 'PGRST116') {
    console.error('Error fetching part:', partError);
    throw partError;
  }

  if (!part) {
    return null;
  }

  // Get quotes count for this part
  const { count: quotesCount, error: quotesError } = await supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('part_id', partId);

  if (quotesError) {
    console.error('Error fetching quotes count:', quotesError);
  }

  // Get jobs count for this part
  const { count: jobsCount, error: jobsError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('part_id', partId);

  if (jobsError) {
    console.error('Error fetching jobs count:', jobsError);
  }

  return {
    ...part,
    customer: part.customers || null,
    pricing: sortPricingTiers(part.pricing || []),
    quotes_count: quotesCount || 0,
    jobs_count: jobsCount || 0,
  };
}

/**
 * Check if a part number already exists for a company+customer combination.
 * CRITICAL: Uses .is() for NULL customer_id checks, not .eq()
 *
 * @param companyId - Company ID
 * @param partNumber - Part number to check
 * @param customerId - Customer ID, or null for generic parts
 * @param excludeId - Part ID to exclude (for edit mode)
 */
export async function checkPartNumberExists(
  companyId: string,
  partNumber: string,
  customerId: string | null,
  excludeId?: string
): Promise<boolean> {
  const supabase = getSupabase();

  let query = supabase
    .from('parts')
    .select('id')
    .eq('company_id', companyId)
    .ilike('part_number', partNumber);

  // CRITICAL: Use .is() for NULL, not .eq()
  if (customerId === null) {
    query = query.is('customer_id', null);
  } else {
    query = query.eq('customer_id', customerId);
  }

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error checking part number:', error);
    throw error;
  }

  return (data?.length || 0) > 0;
}

/**
 * Create a new part
 */
export async function createPart(companyId: string, formData: PartFormData): Promise<Part> {
  const supabase = getSupabase();

  // Sort pricing tiers before insert
  const sortedPricing = sortPricingTiers(formData.pricing);

  const { data, error } = await supabase
    .from('parts')
    .insert({
      company_id: companyId,
      customer_id: formData.customer_id.trim() || null,
      part_number: formData.part_number.trim(),
      description: formData.description.trim() || null,
      pricing: sortedPricing,
      material_cost: formData.material_cost
        ? parseFloat(parseFloat(formData.material_cost).toFixed(2))
        : null,
      notes: formData.notes.trim() || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating part:', error);
    throw error;
  }

  return {
    ...data,
    pricing: sortPricingTiers(data.pricing || []),
  };
}

/**
 * Update an existing part
 */
export async function updatePart(partId: string, formData: PartFormData): Promise<Part> {
  const supabase = getSupabase();

  // Sort pricing tiers before update
  const sortedPricing = sortPricingTiers(formData.pricing);

  const { data, error } = await supabase
    .from('parts')
    .update({
      customer_id: formData.customer_id.trim() || null,
      part_number: formData.part_number.trim(),
      description: formData.description.trim() || null,
      pricing: sortedPricing,
      material_cost: formData.material_cost
        ? parseFloat(parseFloat(formData.material_cost).toFixed(2))
        : null,
      notes: formData.notes.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', partId)
    .select()
    .single();

  if (error) {
    console.error('Error updating part:', error);
    throw error;
  }

  return {
    ...data,
    pricing: sortPricingTiers(data.pricing || []),
  };
}

/**
 * Delete a part permanently.
 * CRITICAL: Catches FK constraint error and throws user-friendly message.
 */
export async function deletePart(partId: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('parts').delete().eq('id', partId);

  if (error) {
    // FK constraint violation
    if (error.code === '23503') {
      throw new Error(
        'Cannot delete this part because it is referenced by quotes or jobs. Remove those references first.'
      );
    }
    console.error('Error deleting part:', error);
    throw error;
  }
}

/**
 * Bulk delete parts permanently.
 * CRITICAL: Catches FK constraint error and throws user-friendly message.
 */
export async function bulkDeleteParts(partIds: string[]): Promise<void> {
  if (partIds.length === 0) return;

  const supabase = getSupabase();

  const { error } = await supabase.from('parts').delete().in('id', partIds);

  if (error) {
    // FK constraint violation
    if (error.code === '23503') {
      throw new Error(
        'Cannot delete some parts because they are referenced by quotes or jobs. Remove those references first.'
      );
    }
    console.error('Error bulk deleting parts:', error);
    throw error;
  }
}
