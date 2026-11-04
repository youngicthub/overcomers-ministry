import type { Metadata } from 'next';
import { GalleryPage } from '@/components/site/site-pages';

export const metadata: Metadata = { title: 'Gallery' };

export default function Page() {
  return <GalleryPage />;
}
