'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getAdminSession } from '@/lib/api';

// A single, memorable entry point (yourdomain.com/admin) that sends the
// visitor to the dashboard if they're already signed in, or to the login
// page if not.
export function AdminEntry() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    getAdminSession()
      .then(() => { if (active) router.replace('/admin/dashboard'); })
      .catch(() => { if (active) router.replace('/admin/login'); });
    return () => { active = false; };
  }, [router]);

  return <main className="grid min-h-[60dvh] place-items-center px-5"><Loader2 className="animate-spin text-primary" size={28} /></main>;
}
