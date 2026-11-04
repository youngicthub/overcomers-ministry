import Link from 'next/link';
import { Layout } from '@/components/site/site-pages';

export default function NotFound() {
  return (
    <Layout>
      <section className="mx-auto grid min-h-[50dvh] max-w-3xl place-items-center px-5 py-24 text-center">
        <div>
          <p className="eyebrow text-accent">404</p>
          <h1 className="mt-3 font-display text-4xl text-primary sm:text-5xl">We couldn&rsquo;t find that page.</h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">The link may be old, or the page may have moved.</p>
          <Link href="/" className="mt-8 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Back to home</Link>
        </div>
      </section>
    </Layout>
  );
}
