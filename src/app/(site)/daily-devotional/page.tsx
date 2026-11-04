import type { Metadata } from 'next';
import { DailyDevotional } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Daily devotional' };

export default function Page() {
  return <DailyDevotional />;
}
