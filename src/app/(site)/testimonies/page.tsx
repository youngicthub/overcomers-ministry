import type { Metadata } from 'next';
import { Testimonies } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Stories of grace' };

export default function Page() {
  return <Testimonies />;
}
