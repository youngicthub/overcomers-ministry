import type { Metadata } from 'next';
import { Videos } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Videos' };

export default function Page() {
  return <Videos />;
}
