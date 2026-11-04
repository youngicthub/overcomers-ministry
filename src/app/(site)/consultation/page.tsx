import type { Metadata } from 'next';
import { Consultation } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Request consultation' };

export default function Page() {
  return <Consultation />;
}
