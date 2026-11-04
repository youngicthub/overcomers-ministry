import type { ReactNode } from 'react';
import { Layout } from '@/components/site/site-pages';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
