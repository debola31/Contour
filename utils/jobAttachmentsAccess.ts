import { getSupabase } from '@/lib/supabase';
import type { JobAttachment } from '@/types/job';
import { getSignedUrl } from './storageHelpers';

/**
 * Get attachments for a job
 */
export async function getJobAttachments(
  jobId: string
): Promise<JobAttachment[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('job_attachments')
    .select('*')
    .eq('job_id', jobId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching job attachments:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get signed URL for job attachment download
 */
export async function getJobAttachmentUrl(filePath: string): Promise<string> {
  return getSignedUrl(filePath, 3600);
}
