import type { Metadata } from 'next';
import { Ministries } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Ministries' };

export default function Page() {
  return <Ministries />;
}
