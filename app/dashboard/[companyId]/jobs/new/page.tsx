'use client';

import { JobForm } from '@/components/jobs';
import { EMPTY_JOB_FORM } from '@/types/job';

export default function NewJobPage() {
  return <JobForm mode="create" initialData={EMPTY_JOB_FORM} />;
}
