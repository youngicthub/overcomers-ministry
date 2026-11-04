import type { Metadata } from 'next';
import { Contact } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Contact' };

export default function Page() {
  return <Contact />;
}
