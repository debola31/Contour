import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createClient();
  }
  return supabaseInstance;
}

// Export a convenience alias
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;

/**
 * Get the base URL for Supabase Edge Functions.
 * Edge Functions are deployed at: https://<project-ref>.supabase.co/functions/v1/<function-name>
 */
export function getEdgeFunctionUrl(functionName: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured');
  }
  return `${baseUrl}/functions/v1/${functionName}`;
}
