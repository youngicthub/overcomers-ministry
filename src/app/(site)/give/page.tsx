import type { Metadata } from 'next';
import { Give } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Give' };

export default function Page() {
  return <Give />;
}
