import type { Metadata } from 'next';
import { About } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Our story' };

export default function Page() {
  return <About />;
}
