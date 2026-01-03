/**
 * Job attachment record from database
 */
export interface JobAttachment {
  id: string;
  job_id: string;
  company_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  source_quote_attachment_id: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
}

/**
 * Job record (basic structure - extend as needed)
 */
export interface Job {
  id: string;
  company_id: string;
  job_number: string;
  quote_id: string | null;
  customer_id: string;
  part_id: string | null;
  description: string | null;
  quantity_ordered: number;
  quantity_completed: number;
  quantity_scrapped: number;
  due_date: string | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

/**
 * Job with attachments included
 */
export interface JobWithAttachments extends Job {
  attachments: JobAttachment[];
}
