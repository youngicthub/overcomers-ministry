import type { Metadata } from 'next';
import { NewMember } from '@/components/site/site-pages';

export const metadata: Metadata = { title: "I'm new here" };

export default function Page() {
  return <NewMember />;
}
