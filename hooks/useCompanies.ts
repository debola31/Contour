'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { getUserCompanies, UserCompanyAccess } from '@/utils/companyAccess';

export function useCompanies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<UserCompanyAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchCompanies() {
      try {
        const data = await getUserCompanies(user!.id);
        setCompanies(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, [user]);

  return { companies, loading, error };
}
