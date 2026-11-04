import type { Metadata } from 'next';
import { Live } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Watch live' };

export default function Page() {
  return <Live />;
}
