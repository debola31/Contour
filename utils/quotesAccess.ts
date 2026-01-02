import { getSupabase } from '@/lib/supabase';
import type {
  Quote,
  QuoteWithRelations,
  QuoteFormData,
  QuoteFilters,
  QuoteStatus,
  ConvertToJobData,
} from '@/types/quote';
import { calculateTotalPrice } from '@/types/quote';
import type { PricingTier } from '@/types/part';

// ============== CRUD Operations ==============

/**
 * Get paginated list of quotes for a company
 */
export async function getQuotes(
  companyId: string,
  filters: QuoteFilters = {},
  page: number = 1,
  limit: number = 25,
  sortField: string = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<{ data: QuoteWithRelations[]; total: number }> {
  const supabase = getSupabase();
  const offset = (page - 1) * limit;

  let query = supabase
    .from('quotes')
    .select(
      `
      *,
      customers!left(id, name, customer_code),
      parts!left(id, part_number, description, pricing),
      jobs:converted_to_job_id!left(id, job_number, status)
    `,
      { count: 'exact' }
    )
    .eq('company_id', companyId)
    .order(sortField, { ascending: sortDirection === 'asc' })
    .range(offset, offset + limit - 1);

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  if (filters.search?.trim()) {
    query = query.or(
      `quote_number.ilike.%${filters.search}%,part_number_text.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching quotes:', error);
    throw error;
  }

  return { data: (data || []) as QuoteWithRelations[], total: count || 0 };
}

/**
 * Get all quotes for a company (no pagination).
 * Fetches in batches of 1000 to bypass Supabase's default row limit.
 * Use this for client-side pagination in AG Grid.
 */
export async function getAllQuotes(
  companyId: string,
  filters: QuoteFilters = {},
  sortField: string = 'created_at',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<QuoteWithRelations[]> {
  const supabase = getSupabase();
  const BATCH_SIZE = 1000;
  let allData: QuoteWithRelations[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('quotes')
      .select(
        `
        *,
        customers!left(id, name, customer_code),
        parts!left(id, part_number, description, pricing),
        jobs:converted_to_job_id!left(id, job_number, status)
      `
      )
      .eq('company_id', companyId)
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(offset, offset + BATCH_SIZE - 1);

    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }

    if (filters.search?.trim()) {
      query = query.or(
        `quote_number.ilike.%${filters.search}%,part_number_text.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching quotes batch:', error);
      throw error;
    }

    allData = [...allData, ...((data || []) as QuoteWithRelations[])];
    hasMore = (data?.length || 0) === BATCH_SIZE;
    offset += BATCH_SIZE;
  }

  return allData;
}

/**
 * Get total count of quotes for a company
 */
export async function getQuotesCount(
  companyId: string,
  filters: QuoteFilters = {}
): Promise<number> {
  const supabase = getSupabase();

  let query = supabase
    .from('quotes')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.customerId) {
    query = query.eq('customer_id', filters.customerId);
  }

  if (filters.search?.trim()) {
    query = query.or(
      `quote_number.ilike.%${filters.search}%,part_number_text.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching quotes count:', error);
    throw error;
  }

  return count || 0;
}

/**
 * Get a single quote by ID
 */
export async function getQuote(quoteId: string): Promise<Quote | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quote:', error);
    throw error;
  }

  return data;
}

/**
 * Get a quote with all relations
 */
export async function getQuoteWithRelations(quoteId: string): Promise<QuoteWithRelations | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('quotes')
    .select(
      `
      *,
      customers!left(id, name, customer_code),
      parts!left(id, part_number, description, pricing),
      jobs:converted_to_job_id!left(id, job_number, status)
    `
    )
    .eq('id', quoteId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching quote with relations:', error);
    throw error;
  }

  return data as QuoteWithRelations | null;
}

/**
 * Create a new quote (always starts as draft)
 */
export async function createQuote(
  companyId: string,
  formData: QuoteFormData
): Promise<Quote> {
  const supabase = getSupabase();

  const quantity = parseInt(formData.quantity, 10) || 1;
  const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : null;
  const totalPrice = calculateTotalPrice(quantity, unitPrice);
  const leadTimeDays = formData.estimated_lead_time_days
    ? parseInt(formData.estimated_lead_time_days, 10)
    : null;

  const { data, error } = await supabase
    .from('quotes')
    .insert({
      company_id: companyId,
      customer_id: formData.customer_id,
      part_id: formData.part_type === 'existing' && formData.part_id ? formData.part_id : null,
      part_number_text:
        formData.part_type === 'adhoc' && formData.part_number_text.trim()
          ? formData.part_number_text.trim()
          : null,
      description: formData.description.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      estimated_lead_time_days: leadTimeDays,
      valid_until: formData.valid_until || null,
      status: 'draft',
      // quote_number is auto-generated by database trigger
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating quote:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing quote (draft only)
 */
export async function updateQuote(quoteId: string, formData: QuoteFormData): Promise<Quote> {
  const supabase = getSupabase();

  // First check if quote is in draft status
  const { data: existing, error: checkError } = await supabase
    .from('quotes')
    .select('status')
    .eq('id', quoteId)
    .single();

  if (checkError) {
    console.error('Error checking quote status:', checkError);
    throw checkError;
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft quotes can be edited');
  }

  const quantity = parseInt(formData.quantity, 10) || 1;
  const unitPrice = formData.unit_price ? parseFloat(formData.unit_price) : null;
  const totalPrice = calculateTotalPrice(quantity, unitPrice);
  const leadTimeDays = formData.estimated_lead_time_days
    ? parseInt(formData.estimated_lead_time_days, 10)
    : null;

  const { data, error } = await supabase
    .from('quotes')
    .update({
      customer_id: formData.customer_id,
      part_id: formData.part_type === 'existing' && formData.part_id ? formData.part_id : null,
      part_number_text:
        formData.part_type === 'adhoc' && formData.part_number_text.trim()
          ? formData.part_number_text.trim()
          : null,
      description: formData.description.trim() || null,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      estimated_lead_time_days: leadTimeDays,
      valid_until: formData.valid_until || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote:', error);
    throw error;
  }

  return data;
}

/**
 * Delete a quote (draft only)
 */
export async function deleteQuote(quoteId: string): Promise<void> {
  const supabase = getSupabase();

  // First check if quote is in draft status
  const { data: existing, error: checkError } = await supabase
    .from('quotes')
    .select('status')
    .eq('id', quoteId)
    .single();

  if (checkError) {
    console.error('Error checking quote status:', checkError);
    throw checkError;
  }

  if (existing.status !== 'draft') {
    throw new Error('Only draft quotes can be deleted');
  }

  const { error } = await supabase.from('quotes').delete().eq('id', quoteId);

  if (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
}

/**
 * Bulk delete quotes (draft only)
 */
export async function bulkDeleteQuotes(quoteIds: string[]): Promise<void> {
  if (quoteIds.length === 0) return;

  const validIds = quoteIds.filter((id) => id && typeof id === 'string');
  if (validIds.length === 0) return;

  const supabase = getSupabase();
  const BATCH_SIZE = 100;

  for (let i = 0; i < validIds.length; i += BATCH_SIZE) {
    const batch = validIds.slice(i, i + BATCH_SIZE);

    // Only delete quotes that are in draft status
    const { error } = await supabase
      .from('quotes')
      .delete()
      .in('id', batch)
      .eq('status', 'draft');

    if (error) {
      if (error.code === '23503') {
        throw new Error('Cannot delete some quotes because they have associated jobs.');
      }
      if (error.code === '42501' || error.message?.includes('policy')) {
        throw new Error('Permission denied. You may not have permission to delete these quotes.');
      }
      console.error('Error bulk deleting quotes:', error);
      throw new Error(error.message || 'Failed to delete quotes');
    }
  }
}

// ============== Status Transitions ==============

/**
 * Helper to update quote status with validation
 */
async function updateQuoteStatus(
  quoteId: string,
  expectedCurrentStatus: QuoteStatus | QuoteStatus[],
  newStatus: QuoteStatus
): Promise<Quote> {
  const supabase = getSupabase();

  const { data: existing, error: checkError } = await supabase
    .from('quotes')
    .select('status')
    .eq('id', quoteId)
    .single();

  if (checkError) {
    console.error('Error checking quote status:', checkError);
    throw checkError;
  }

  const allowedStatuses = Array.isArray(expectedCurrentStatus)
    ? expectedCurrentStatus
    : [expectedCurrentStatus];

  if (!allowedStatuses.includes(existing.status as QuoteStatus)) {
    throw new Error(`Cannot change status from ${existing.status} to ${newStatus}`);
  }

  const { data, error } = await supabase
    .from('quotes')
    .update({
      status: newStatus,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (error) {
    console.error('Error updating quote status:', error);
    throw error;
  }

  return data;
}

/**
 * Mark quote as pending approval (draft → pending_approval)
 */
export async function markQuoteAsPendingApproval(quoteId: string): Promise<Quote> {
  return updateQuoteStatus(quoteId, 'draft', 'pending_approval');
}

/**
 * Mark quote as approved (pending_approval → approved)
 */
export async function markQuoteAsApproved(quoteId: string): Promise<Quote> {
  return updateQuoteStatus(quoteId, 'pending_approval', 'approved');
}

/**
 * Mark quote as rejected (pending_approval → rejected)
 */
export async function markQuoteAsRejected(quoteId: string): Promise<Quote> {
  return updateQuoteStatus(quoteId, 'pending_approval', 'rejected');
}

// ============== Convert to Job ==============

export interface ConvertToJobResult {
  quote: Quote;
  job: {
    id: string;
    job_number: string;
  };
}

/**
 * Convert an accepted quote to a job
 */
export async function convertQuoteToJob(
  quoteId: string,
  jobData: ConvertToJobData
): Promise<ConvertToJobResult> {
  const supabase = getSupabase();

  // 1. Get quote with full details
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single();

  if (quoteError) {
    console.error('Error fetching quote:', quoteError);
    throw quoteError;
  }

  // 2. Validate quote status
  if (quote.status !== 'approved') {
    throw new Error('Only approved quotes can be converted to jobs');
  }

  if (quote.converted_to_job_id) {
    throw new Error('This quote has already been converted to a job');
  }

  // 3. Create job
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      company_id: quote.company_id,
      quote_id: quoteId,
      customer_id: quote.customer_id,
      part_id: quote.part_id,
      part_number_text: quote.part_number_text,
      description: quote.description,
      quantity_ordered: quote.quantity,
      quantity_completed: 0,
      quantity_scrapped: 0,
      due_date: jobData.due_date || null,
      priority: jobData.priority || 'normal',
      status: 'pending',
      // job_number is auto-generated by database trigger
    })
    .select('id, job_number')
    .single();

  if (jobError) {
    console.error('Error creating job:', jobError);
    throw jobError;
  }

  // 4. Update quote with job reference
  const { data: updatedQuote, error: updateError } = await supabase
    .from('quotes')
    .update({
      converted_to_job_id: job.id,
      converted_at: new Date().toISOString(),
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', quoteId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating quote with job reference:', updateError);
    throw updateError;
  }

  return {
    quote: updatedQuote,
    job,
  };
}

// ============== Helper Functions ==============

/**
 * Get parts for a customer (customer's parts + generic parts)
 */
export async function getCustomerParts(
  companyId: string,
  customerId: string
): Promise<
  Array<{
    id: string;
    part_number: string;
    description: string | null;
    pricing: PricingTier[];
  }>
> {
  const supabase = getSupabase();

  // Get parts for this customer only (no shared parts)
  const { data, error } = await supabase
    .from('parts')
    .select('id, part_number, description, pricing')
    .eq('company_id', companyId)
    .eq('customer_id', customerId)
    .order('part_number');

  if (error) {
    console.error('Error fetching customer parts:', error);
    throw error;
  }

  return (data || []) as Array<{
    id: string;
    part_number: string;
    description: string | null;
    pricing: PricingTier[];
  }>;
}

/**
 * Get a single part with pricing
 */
export async function getPartWithPricing(
  partId: string
): Promise<{
  id: string;
  part_number: string;
  description: string | null;
  pricing: PricingTier[];
} | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('parts')
    .select('id, part_number, description, pricing')
    .eq('id', partId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching part:', error);
    return null;
  }

  return data as {
    id: string;
    part_number: string;
    description: string | null;
    pricing: PricingTier[];
  } | null;
}
