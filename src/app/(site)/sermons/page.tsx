import type { Metadata } from 'next';
import { Sermons } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Sermons' };

export default function Page() {
  return <Sermons />;
}
