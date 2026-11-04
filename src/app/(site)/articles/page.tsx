import type { Metadata } from 'next';
import { Articles } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Articles' };

export default function Page() {
  return <Articles />;
}
