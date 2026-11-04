import type { Metadata } from 'next';
import { PrayerRequest } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Prayer request' };

export default function Page() {
  return <PrayerRequest />;
}
