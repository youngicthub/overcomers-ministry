import type { Metadata } from 'next';
import { Events } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Events' };

export default function Page() {
  return <Events />;
}
