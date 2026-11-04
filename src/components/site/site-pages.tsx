'use client';

import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, Compass, Cross, Facebook, Gift, HeartHandshake, Headphones,
  Instagram, Loader2, Mail, MapPin, Menu, Phone, Play, PlayCircle,
  Quote, Radio, Search, Send, ShieldCheck, Sparkles, Users, Video, X, Youtube,
} from 'lucide-react';
import {
  useCreateConsultation, useCreateContactMessage, useCreatePrayerRequest,
  useGetHomeContent, useGetTodayDevotional, useHealthCheck,
  useListArticles, useListEvents, useListMinistries, useListSermons, useListTestimonies,
  useListVideos, useListGalleryPhotos, type GalleryPhoto,
  useRegisterMember, type Video as VideoRecord,
} from '@/lib/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LiveBroadcastPage } from '@/components/site/live-broadcast';

const logoUrl = '/overcomers-logo.jpg';

// Minimal top-level nav — only the items people look for most.
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/sermons', label: 'Sermons' },
  { href: '/events', label: 'Events' },
  { href: '/give', label: 'Give' },
];

// Everything else lives one tap away, under "More", so nothing is lost.
const moreNavItems = [
  { href: '/about', label: 'Our story' },
  { href: '/ministries', label: 'Ministries' },
  { href: '/articles', label: 'Articles' },
  { href: '/videos', label: 'Videos' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/daily-devotional', label: 'Daily devotional' },
  { href: '/testimonies', label: 'Stories of grace' },
  { href: '/prayer-request', label: 'Prayer request' },
  { href: '/new-member', label: "I'm new here" },
  { href: '/consultation', label: 'Request consultation' },
  { href: '/contact', label: 'Contact' },
];

function formatDate(date?: string) {
  if (!date) return 'Date to be announced';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed);
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const location = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-[hsl(var(--border)/.7)] bg-[hsl(var(--background)/.9)] backdrop-blur-lg">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3" data-testid="link-home">
          <img src={logoUrl} alt="Overcomers Ministry of Believers Fellowship" className="h-11 w-11 rounded-full border-2 border-secondary bg-white object-cover shadow-sm" />
          <span className="leading-tight">
            <span className="block font-display text-[17px] font-semibold tracking-tight text-primary">Overcomers Ministry</span>
            <span className="block text-[9px] font-bold uppercase tracking-[.2em] text-muted-foreground">of Believers Fellowship</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} data-testid={`link-nav-${item.href === '/' ? 'home' : item.href.slice(1)}`} className={`text-[13px] font-semibold transition-colors hover:text-accent ${location === item.href ? 'text-accent' : 'text-foreground/70'}`}>
              {item.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" data-testid="button-nav-more" className="flex items-center gap-1 text-[13px] font-semibold text-foreground/70 transition-colors hover:text-accent focus:outline-none">
                More <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[220px]">
              {moreNavItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} data-testid={`link-nav-more-${item.href.slice(1)}`} className="w-full cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/live" data-testid="link-watch-live" className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2.5 text-[12px] font-bold text-primary transition-colors hover:border-secondary hover:bg-secondary/10">
            <Radio size={14} /> Watch live
          </Link>
          <Link href="/give" data-testid="link-give-header" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[12px] font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5">
            <Gift size={14} /> Give
          </Link>
        </div>
        <button type="button" data-testid="button-menu" className="rounded-md p-2 text-primary lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} data-testid={`link-mobile-${item.href === '/' ? 'home' : item.href.slice(1)}`} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted">{item.label}</Link>
            ))}
            <Link href="/live" onClick={() => setOpen(false)} data-testid="link-mobile-live" className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-muted">Watch live</Link>
            <div className="mt-2 border-t border-border pt-2">
              <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">More</p>
              {moreNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} data-testid={`link-mobile-more-${item.href.slice(1)}`} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted">{item.label}</Link>
              ))}
            </div>
            <Link href="/give" onClick={() => setOpen(false)} data-testid="link-mobile-give" className="mt-2 rounded-lg bg-primary px-3 py-3 text-center text-sm font-bold text-primary-foreground">Give online</Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const health = useHealthCheck({ staleTime: 60000 });
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_1fr] lg:px-8">
        <div>
          <div className="mb-5 flex items-center gap-3"><img src={logoUrl} alt="Overcomers Ministry of Believers Fellowship" className="h-11 w-11 rounded-full border-2 border-secondary bg-white object-cover" /><span className="font-display text-xl">Overcomers Ministry</span></div>
          <p className="max-w-xs text-sm leading-7 text-primary-foreground/70">A people growing in the knowledge of Christ, walking in freedom, and making room for one another.</p>
          <div className="mt-6 flex gap-2">
            {[{ icon: Instagram, label: 'Instagram' }, { icon: Youtube, label: 'YouTube' }, { icon: Facebook, label: 'Facebook' }].map(({ icon: Icon, label }) => <button key={label} type="button" data-testid={`button-social-${label.toLowerCase()}`} aria-label={label} className="grid h-9 w-9 place-items-center rounded-full border border-primary-foreground/20 text-primary-foreground/75 transition-colors hover:border-secondary hover:text-secondary"><Icon size={15} /></button>)}
          </div>
        </div>
        <div><p className="eyebrow mb-5 text-secondary">Explore</p><div className="flex flex-col gap-3 text-sm text-primary-foreground/70"><Link href="/about" data-testid="link-footer-about" className="transition-colors hover:text-secondary">Our story</Link><Link href="/ministries" data-testid="link-footer-ministries" className="transition-colors hover:text-secondary">Ministries</Link><Link href="/sermons" data-testid="link-footer-sermons" className="transition-colors hover:text-secondary">Sermons</Link><Link href="/events" data-testid="link-footer-events" className="transition-colors hover:text-secondary">Events</Link><Link href="/articles" data-testid="link-footer-articles" className="transition-colors hover:text-secondary">Articles</Link><Link href="/videos" data-testid="link-footer-videos" className="transition-colors hover:text-secondary">Videos</Link><Link href="/gallery" data-testid="link-footer-gallery" className="transition-colors hover:text-secondary">Gallery</Link><Link href="/daily-devotional" data-testid="link-footer-devotional" className="transition-colors hover:text-secondary">Daily devotional</Link></div></div>
        <div><p className="eyebrow mb-5 text-secondary">Find your place</p><div className="flex flex-col gap-3 text-sm text-primary-foreground/70"><Link href="/new-member" data-testid="link-footer-member" className="transition-colors hover:text-secondary">Become a member</Link><Link href="/give" data-testid="link-footer-give" className="transition-colors hover:text-secondary">Give online</Link><Link href="/consultation" data-testid="link-footer-consultation" className="transition-colors hover:text-secondary">Request counseling</Link><Link href="/contact" data-testid="link-footer-contact" className="transition-colors hover:text-secondary">Contact the church</Link></div></div>
        <div><p className="eyebrow mb-5 text-secondary">Visit us</p><p className="text-sm leading-7 text-primary-foreground/70">Sunday worship<br />7:00 AM and 9:00 AM<br />No 40 NTA Road, Port Harcourt</p><div className="mt-5 flex items-center gap-2 text-xs text-primary-foreground/50"><span className={`h-2 w-2 rounded-full ${health.isError ? 'bg-accent' : 'bg-secondary'}`} /> {health.isError ? 'Online services available' : 'Ministry website online'}</div></div>
      </div>
      <div className="border-t border-primary-foreground/10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-5 py-5 text-xs text-primary-foreground/45 sm:flex-row lg:px-8"><span>© {new Date().getFullYear()} Overcomers Ministry of Believers Fellowship</span><span>Christ at the centre. People at the heart.</span></div></div>
    </footer>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return <div className="texture min-h-[100dvh]"><SiteHeader /><main>{children}</main><SiteFooter /></div>;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex items-center gap-3 text-secondary"><span className="gold-rule" /><span className="eyebrow">{children}</span></div>;
}

function PageIntro({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <section className="bg-primary px-5 py-16 text-primary-foreground sm:py-20 lg:px-8"><div className="mx-auto max-w-7xl"><SectionLabel>{eyebrow}</SectionLabel><h1 className="max-w-3xl font-display text-4xl leading-[1.08] sm:text-6xl">{title}</h1><p className="mt-5 max-w-2xl text-base leading-7 text-primary-foreground/70">{copy}</p></div></section>;
}

function QueryMessage({ kind, onRetry }: { kind: 'loading' | 'error' | 'empty'; onRetry?: () => void }) {
  if (kind === 'loading') return <div className="grid gap-3 py-8">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>;
  if (kind === 'error') return <div className="rounded-2xl border border-accent/30 bg-accent/5 px-6 py-8 text-center"><p className="font-display text-xl text-primary">We could not bring that through.</p><p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>{onRetry && <button type="button" data-testid="button-retry" onClick={onRetry} className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground">Try again</button>}</div>;
  return <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center"><Compass className="mx-auto text-secondary" size={28} /><p className="mt-3 font-display text-xl text-primary">Nothing here just yet</p><p className="mt-2 text-sm text-muted-foreground">Check back soon for the next chapter.</p></div>;
}

// Scroll-triggered fade/slide-up wrapper used throughout the Home page.
function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.65, delay, ease: [0.2, 0.8, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Placeholder photography (freely reusable, from Lorem Picsum/Unsplash) so
// the design can be judged with real imagery in place. Swap these URLs for
// photos of your own building, congregation, and services whenever you
// have them — nothing else needs to change.
// Real, appropriately-licensed photography (Pexels License: free for
// commercial use, no attribution required) so the design shows genuine
// worship/church-life imagery rather than random placeholder photos.
// Swap these for photos of your own building and congregation whenever
// you have them — nothing else needs to change.
const heroImages = [
  'https://images.pexels.com/photos/19130852/pexels-photo-19130852.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/34328510/pexels-photo-34328510.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/39009429/pexels-photo-39009429.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://images.pexels.com/photos/15852743/pexels-photo-15852743.jpeg?auto=compress&cs=tinysrgb&w=1600',
];

const galleryImages = [
  {
    src: 'https://images.pexels.com/photos/29117524/pexels-photo-29117524.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'Sunday Worship',
    context: 'Gathering as one family to sing, pray, and hear God\u2019s Word together.',
  },
  {
    src: 'https://images.pexels.com/photos/12639128/pexels-photo-12639128.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'United in Prayer',
    context: 'Bringing our needs and praises before God, together.',
  },
  {
    src: 'https://images.pexels.com/photos/34625181/pexels-photo-34625181.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'Voices of Praise',
    context: 'Lifting our hearts to God through heartfelt worship.',
  },
  {
    src: 'https://images.pexels.com/photos/36752683/pexels-photo-36752683.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'Hearing the Word',
    context: 'Sound, practical teaching from Scripture, every week.',
  },
  {
    src: 'https://images.pexels.com/photos/38786011/pexels-photo-38786011.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'The Lord\u2019s Table',
    context: 'Remembering Christ\u2019s sacrifice together in communion.',
  },
  {
    src: 'https://images.pexels.com/photos/8674183/pexels-photo-8674183.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'Rooted in Scripture',
    context: 'Daily time in God\u2019s Word shapes how we live.',
  },
  {
    src: 'https://images.pexels.com/photos/30101082/pexels-photo-30101082.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'A Quiet Moment',
    context: 'Coming before the Lord in reverence and stillness.',
  },
  {
    src: 'https://images.pexels.com/photos/7219006/pexels-photo-7219006.jpeg?auto=compress&cs=tinysrgb&w=900',
    title: 'The Living Word',
    context: 'Scripture read and taught with care, every service.',
  },
];

// A concise Statement of Faith — the four or five core convictions most
// evangelical/Bible-believing churches hold in common, each anchored to
// a short scripture reference. Edit the text to match your church's own
// doctrinal statement if it differs on any point.
const statementOfFaith = [
  {
    title: 'The Scriptures',
    body: 'The Bible is God\u2019s inspired, trustworthy Word \u2014 our final authority for faith and life.',
    reference: '2 Timothy 3:16',
  },
  {
    title: 'One God, Three Persons',
    body: 'We believe in one God, eternally existing in three persons: Father, Son, and Holy Spirit.',
    reference: 'Matthew 28:19',
  },
  {
    title: 'Salvation by Grace',
    body: 'We are saved by grace, through faith in Jesus Christ alone \u2014 not by our own works.',
    reference: 'Ephesians 2:8\u20139',
  },
  {
    title: 'The Church',
    body: 'The Church is the family of believers, called to worship, grow, and serve together as one body.',
    reference: '1 Corinthians 12:27',
  },
  {
    title: 'Christ\u2019s Return',
    body: 'Jesus Christ will return in glory, and every believer\u2019s hope is anchored in that promise.',
    reference: 'Titus 2:13',
  },
];

// Crossfading, auto-advancing hero background with a slow "Ken Burns" zoom
// on each image, dot navigation, and prev/next controls.
function HeroSlider({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % images.length), 6000);
    return () => window.clearInterval(id);
  }, [paused, images.length]);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={images[index]}
          src={images[index]}
          alt=""
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.1, ease: 'easeInOut' }, scale: { duration: 6.5, ease: 'easeOut' } }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/85 to-primary/50" />
      <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2 sm:bottom-8">
        {images.map((src, dotIndex) => (
          <button
            key={src}
            type="button"
            aria-label={`Show slide ${dotIndex + 1}`}
            data-testid={`button-hero-dot-${dotIndex}`}
            onClick={() => setIndex(dotIndex)}
            className={`h-1.5 rounded-full transition-all ${dotIndex === index ? 'w-7 bg-secondary' : 'w-1.5 bg-primary-foreground/40 hover:bg-primary-foreground/70'}`}
          />
        ))}
      </div>
      <button type="button" aria-label="Previous slide" data-testid="button-hero-prev" onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-primary-foreground/25 bg-primary/40 p-2 text-primary-foreground backdrop-blur transition-colors hover:border-secondary hover:text-secondary sm:grid">
        <ChevronLeft size={18} />
      </button>
      <button type="button" aria-label="Next slide" data-testid="button-hero-next" onClick={() => setIndex((current) => (current + 1) % images.length)} className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-primary-foreground/25 bg-primary/40 p-2 text-primary-foreground backdrop-blur transition-colors hover:border-secondary hover:text-secondary sm:grid">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function Home() {
  const query = useGetHomeContent({ staleTime: 120000 });
  const home = query.data;
  const events = home?.events ?? [];
  const sermons = home?.sermons ?? [];
  const devotional = home?.devotional;
  const live = home?.live;
  const videos = home?.videos ?? [];
  const uploadedPhotos = useListGalleryPhotos({ staleTime: 60000 }).data ?? [];
  return (
    <>
      {live?.isLive && (
        <Link href="/live" data-testid="link-home-live-banner" className="flex items-center justify-center gap-2 bg-red-600 px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-red-700">
          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" /></span>
          We're live right now — tap to watch <ArrowRight size={14} />
        </Link>
      )}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <HeroSlider images={heroImages} />
        <div className="absolute -right-28 -top-32 z-[1] h-[500px] w-[500px] rounded-full border border-secondary/20" /><div className="absolute -right-12 -top-16 z-[1] h-[340px] w-[340px] rounded-full border border-secondary/15" />
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:pb-28 sm:pt-24 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }} className="relative z-10"><SectionLabel>A church for the journey</SectionLabel><h1 className="max-w-2xl font-display text-5xl leading-[1.03] tracking-tight sm:text-7xl">There is room<br /><span className="text-secondary">for you here.</span></h1><p className="mt-7 max-w-lg text-base leading-7 text-primary-foreground/70">Come as you are. Find a faith that is alive, a people who will walk with you, and a place to grow into all God has called you to be.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/about" data-testid="link-hero-story" className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5">Discover our story <ArrowRight size={16} /></Link><Link href="/events" data-testid="link-hero-gatherings" className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:border-secondary hover:text-secondary">Plan a visit</Link></div></motion.div>
          <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }} className="relative min-h-[310px] sm:min-h-[390px]"><div className="absolute right-0 top-0 h-64 w-64 rounded-t-[8rem] rounded-br-[8rem] border border-secondary/50 sm:h-80 sm:w-80" /><div className="absolute bottom-1 left-4 h-56 w-56 rounded-full bg-secondary/10 blur-2xl sm:left-14" /><div className="absolute bottom-8 right-6 max-w-[320px] border-l-2 border-secondary pl-5 sm:right-12"><p className="font-display text-xl italic leading-snug">“Go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.”</p><p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-secondary">Matthew 28:19–20</p></div><span className="absolute right-16 top-16 text-secondary"><Sparkles size={25} /></span></motion.div>
        </div>
        <div className="relative z-10 mx-auto flex max-w-7xl items-center gap-4 px-5 pb-5 text-xs text-primary-foreground/45 lg:px-8"><span className="h-px w-12 bg-secondary/60" /> Sunday worship · First service 7:30 AM & 9:30 AM</div>
      </section>
      <section className="bg-primary/5 px-5 py-20 sm:py-24 lg:px-8">
        <Reveal className="mx-auto max-w-4xl text-center">
          <SectionLabel>Our vision</SectionLabel>
          <h2 className="font-display text-4xl leading-tight text-primary sm:text-5xl">The vision of Overcomers Ministry is to be a global ministry that is guided by the love of Jesus Christ.</h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">Overcomers Ministry believes that life is all about Jesus.</p>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.15em] text-secondary">Matthew 28:19–20</p>
        </Reveal>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:items-center">
        <Reveal><div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]"><img src="https://images.pexels.com/photos/34328516/pexels-photo-34328516.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="A member of the Overcomers congregation raising hands in worship during a Sunday service" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" /><div className="absolute inset-x-6 bottom-6 rounded-2xl bg-primary/90 px-5 py-4 text-primary-foreground backdrop-blur"><p className="font-display text-lg leading-snug">“A people who will walk with you.”</p></div></div></Reveal>
        <div><Reveal><SectionLabel>This is us</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary sm:text-5xl">Faith that meets you in real life.</h2></Reveal><Reveal delay={0.1}><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">We are a community learning to follow Jesus with open hands and open hearts. Our worship is sincere, our teaching is practical, and our tables are always being set for one more.</p></Reveal><motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} transition={{ staggerChildren: 0.12, delayChildren: 0.15 }} className="mt-8 grid gap-4 sm:grid-cols-3">{[{ n: '01', t: 'Encounter God honestly' }, { n: '02', t: 'Grow with good people' }, { n: '03', t: 'Live with purpose' }].map((item) => <motion.div key={item.n} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] } } }} className="border-t-2 border-secondary pt-4"><p className="font-display text-2xl text-primary">{item.n}</p><p className="mt-1 text-sm text-muted-foreground">{item.t}</p></motion.div>)}</motion.div></div>
      </section>
      <section className="border-y border-border bg-card px-5 py-20 sm:py-24 lg:px-8">
        <Reveal className="mx-auto max-w-7xl text-center"><SectionLabel>What we believe</SectionLabel><h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight text-primary sm:text-5xl">The convictions that anchor everything we do.</h2></Reveal>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} transition={{ staggerChildren: 0.1 }} className="mx-auto mt-12 grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {statementOfFaith.map((belief) => (
            <motion.div key={belief.title} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }} className="rounded-2xl border border-border bg-muted/40 p-6">
              <Cross className="text-secondary" size={22} />
              <h3 className="mt-4 font-display text-lg text-primary">{belief.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{belief.body}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-secondary">{belief.reference}</p>
            </motion.div>
          ))}
        </motion.div>
        <Reveal delay={0.15} className="mx-auto mt-10 max-w-7xl text-center"><Link href="/about" data-testid="link-home-beliefs" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">Read our full statement of faith <ArrowRight size={15} /></Link></Reveal>
      </section>
      <section className="bg-muted/60 px-5 py-20 sm:py-24 lg:px-8"><Reveal className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><SectionLabel>Next at Overcomers</SectionLabel><h2 className="font-display text-4xl text-primary">Make room in your week.</h2></div><Link href="/events" data-testid="link-home-events" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">See all gatherings <ArrowRight size={15} /></Link></div>{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : events.length === 0 ? <QueryMessage kind="empty" /> : <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} transition={{ staggerChildren: 0.12 }} className="mt-10 grid gap-4 lg:grid-cols-3">{events.slice(0, 3).map((event, index) => <motion.article key={event.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }} data-testid={`card-home-event-${event.id}`} className={`hover-lift rounded-2xl border border-border bg-card p-6 ${index === 0 ? 'border-t-4 border-t-secondary' : ''}`}><div className="flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary/15 text-center text-primary"><span className="text-[10px] font-bold uppercase">{event.date ? new Date(event.date).toLocaleString('en', { month: 'short' }) : 'TBD'}</span><span className="font-display text-xl leading-4">{event.date ? new Date(event.date).getDate() : '—'}</span></div><span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{event.category || 'Gathering'}</span></div><h3 className="mt-6 font-display text-2xl text-primary">{event.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{event.description}</p><div className="mt-5 space-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Clock3 size={13} className="text-secondary" />{event.time}</span><span className="flex items-center gap-2"><MapPin size={13} className="text-secondary" />{event.location}</span></div></motion.article>)}</motion.div>}</Reveal></section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:py-24 lg:grid-cols-[1fr_.85fr] lg:px-8">
        <Reveal><div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground sm:p-12"><img src="https://images.pexels.com/photos/11696719/pexels-photo-11696719.jpeg?auto=compress&cs=tinysrgb&w=1200" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-15" /><div className="relative"><SectionLabel>Today’s quiet moment</SectionLabel><p className="font-display text-3xl leading-snug sm:text-4xl">“{devotional?.verse ?? 'The Lord is near to all who call on him, to all who call on him in truth.'}”</p><p className="mt-5 text-xs font-bold uppercase tracking-[.15em] text-secondary">{devotional?.reference ?? 'Psalm 145:18'}</p><Link href="/daily-devotional" data-testid="link-home-devotional" className="mt-10 inline-flex items-center gap-2 text-sm font-bold text-secondary">Read today’s devotional <ArrowUpRight size={15} /></Link></div></div></Reveal>
        <Reveal delay={0.1}><div className="flex h-full flex-col justify-center"><SectionLabel>Listen and watch</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary">A word for where you are.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Catch up on a recent message, or join us live when the room is open.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/sermons" data-testid="link-home-sermons" className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground"><Headphones size={16} /> Sermon library</Link><Link href="/videos" data-testid="link-home-videos" className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-3 text-sm font-bold text-primary hover:bg-primary hover:text-primary-foreground"><Video size={16} /> Watch videos</Link><Link href="/live" data-testid="link-home-live" className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-3 text-sm font-bold text-primary hover:bg-secondary/80"><Play size={15} /> {live?.isLive ? 'Join live now' : 'Live schedule'}</Link></div></div></Reveal>
      </section>
      {videos.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <Reveal><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><SectionLabel>Latest videos</SectionLabel><h2 className="font-display text-4xl text-primary">Watch a recent moment.</h2></div><Link href="/videos" data-testid="link-home-all-videos" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">See all videos <ArrowRight size={15} /></Link></div></Reveal>
          <Reveal delay={0.1}><div className="mt-10 grid gap-4 sm:grid-cols-3"><VideoGrid videos={videos.slice(0, 3)} /></div></Reveal>
        </section>
      )}
      <section className="px-5 py-20 sm:py-24 lg:px-8">
        <Reveal className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><SectionLabel>A glimpse of church life</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary sm:text-5xl">Moments from our community.</h2></div><Link href="/gallery" data-testid="link-home-gallery" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-accent">See full gallery <ArrowRight size={15} /></Link></Reveal>
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} transition={{ staggerChildren: 0.1 }} className="mx-auto mt-10 grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-4">
          {uploadedPhotos.length > 0 ? uploadedPhotos.slice(0, 8).map((photo) => (
            <motion.div key={photo.id} variants={{ hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img src={photo.url} alt={photo.caption ?? 'A moment from Overcomers'} loading="lazy" className="h-full w-full object-cover object-[50%_22%] transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/15 to-transparent" />
              {photo.caption && <div className="absolute inset-x-3 bottom-3"><span className="block text-sm font-bold text-primary-foreground">{photo.caption}</span></div>}
            </motion.div>
          )) : galleryImages.map((item) => (
            <motion.div key={item.src} variants={{ hidden: { opacity: 0, scale: 0.94 }, show: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } } }} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
              <img src={item.src} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/15 to-transparent" />
              <div className="absolute inset-x-3 bottom-3"><span className="block text-sm font-bold text-primary-foreground">{item.title}</span><span className="mt-1 block text-xs leading-4 text-primary-foreground/80">{item.context}</span></div>
            </motion.div>
          ))}
        </motion.div>
      </section>
      <section className="bg-secondary/15 px-5 py-16 sm:py-20 lg:px-8"><Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div><SectionLabel>Start where you are</SectionLabel><h2 className="font-display text-3xl text-primary">A next step can be simple.</h2><p className="mt-2 text-sm text-muted-foreground">Ask for prayer, find a ministry, or tell us you’re coming.</p></div><div className="flex flex-wrap gap-3"><Link href="/prayer-request" data-testid="link-home-prayer" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">I need prayer</Link><Link href="/new-member" data-testid="link-home-member" className="rounded-full border border-primary/25 px-5 py-3 text-sm font-bold text-primary">I’m new here</Link></div></Reveal></section>
    </>
  );
}

export function About() {
  return <><PageIntro eyebrow="Our story" title="A church learning to love like Jesus." copy="Overcomers began with a simple conviction: faith should be both deeply spiritual and beautifully practical. We are becoming a people who make the presence of God feel near and the goodness of community feel possible." /><section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><SectionLabel>What we believe</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary sm:text-5xl">Rooted in truth.<br />Open to people.</h2></div><div className="grid gap-8 sm:grid-cols-2"><div><Cross className="text-secondary" size={25} /><h3 className="mt-4 font-display text-2xl text-primary">Jesus is our centre</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">We look to the life, death, and resurrection of Jesus as the clearest picture of God’s love and our way forward.</p></div><div><HeartHandshake className="text-secondary" size={25} /><h3 className="mt-4 font-display text-2xl text-primary">People belong here</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Every person is made in God’s image. We create room for honest questions, healing, friendship, and growth.</p></div><div><BookOpen className="text-secondary" size={25} /><h3 className="mt-4 font-display text-2xl text-primary">Scripture forms us</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">The Bible is our trusted story and living guide, shaping our worship, decisions, and everyday practice.</p></div><div><Users className="text-secondary" size={25} /><h3 className="mt-4 font-display text-2xl text-primary">We serve the city</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">Faith becomes visible when it moves outward. We partner with our neighbours in tangible acts of care.</p></div></div></section><section className="bg-primary px-5 py-20 text-primary-foreground sm:py-24 lg:px-8"><div className="mx-auto max-w-4xl text-center"><Quote className="mx-auto mb-5 text-secondary" size={32} /><p className="font-display text-3xl leading-snug sm:text-5xl">“We are not building a perfect church. We are becoming a faithful people.”</p><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-secondary">Our shared confession</p></div></section></>;
}

export function Ministries() {
  const query = useListMinistries({ staleTime: 120000 });
  const fallback = [{ id: 'worship', name: 'Worship & Arts', description: 'Create spaces where people can respond to God with honesty, beauty, and joy.', accent: 'Gold' }, { id: 'next-gen', name: 'Next Generation', description: 'Help children and young people discover a faith they can own for themselves.', accent: 'Navy' }, { id: 'care', name: 'Care & Community', description: 'Walk beside people through prayer, practical support, and the ordinary work of belonging.', accent: 'Terracotta' }, { id: 'groups', name: 'Life Groups', description: 'Small circles for Scripture, shared meals, difficult questions, and deep friendships.', accent: 'Sage' }];
  const ministries = query.data?.length ? query.data : fallback;
  return <><PageIntro eyebrow="Find your place" title="There is a way to contribute here." copy="Church is more than a Sunday service. Discover the people and practices that help Overcomers feel like home." /><section className="mx-auto max-w-7xl px-5 py-20 sm:py-28 lg:px-8">{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : <div className="grid gap-4 md:grid-cols-2">{ministries.map((ministry, index) => <article key={ministry.id} data-testid={`card-ministry-${ministry.id}`} className="hover-lift group rounded-2xl border border-border bg-card p-7 sm:p-9"><div className="flex items-center justify-between"><span className="font-display text-4xl text-secondary">0{index + 1}</span><ArrowUpRight className="text-muted-foreground transition-colors group-hover:text-accent" size={20} /></div><h2 className="mt-10 font-display text-3xl text-primary">{ministry.name}</h2><p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{ministry.description}</p><div className="mt-7 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-accent">Get connected <ChevronRight size={14} /></div></article>)}</div>}</section><section className="bg-muted px-5 py-16 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><SectionLabel>Not sure yet?</SectionLabel><h2 className="font-display text-3xl text-primary">Start with a conversation.</h2></div><Link href="/contact" data-testid="link-ministries-contact" className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Ask a question <ArrowRight className="ml-2 inline" size={15} /></Link></div></section></>;
}

export function Events() {
  const query = useListEvents({ staleTime: 60000 });
  const events = query.data ?? [];
  return <><PageIntro eyebrow="Gatherings" title="There is always a table being set." copy="Worship, prayer, learning, serving, and the simple joy of being together. Find the next gathering for you." /><section className="mx-auto max-w-5xl px-5 py-20 sm:py-28 lg:px-8">{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : events.length === 0 ? <QueryMessage kind="empty" /> : <div className="divide-y divide-border">{events.map((event) => <article key={event.id} data-testid={`row-event-${event.id}`} className="group grid gap-5 py-8 sm:grid-cols-[110px_1fr_auto] sm:items-center"><div className="flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-secondary/20 text-primary"><span className="text-xs font-bold uppercase">{event.date ? new Date(event.date).toLocaleString('en', { month: 'short' }) : 'TBD'}</span><span className="font-display text-3xl leading-7">{event.date ? new Date(event.date).getDate() : '—'}</span></div><div><span className="eyebrow text-accent">{event.category || 'Church gathering'}</span><h2 className="mt-2 font-display text-2xl text-primary sm:text-3xl">{event.title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{event.description}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 size={13} className="text-secondary" />{event.time}</span><span className="flex items-center gap-1.5"><MapPin size={13} className="text-secondary" />{event.location}</span></div></div><button type="button" data-testid={`button-event-interest-${event.id}`} onClick={() => window.alert('We look forward to seeing you there.')} className="inline-flex items-center gap-2 self-start text-sm font-bold text-primary hover:text-accent sm:self-center">I’m interested <ArrowUpRight size={15} /></button></article>)}</div>}</section></>;
}

export function Sermons() {
  const [search, setSearch] = useState('');
  const query = useListSermons(search || undefined, { staleTime: 60000 });
  const sermons = query.data ?? [];
  return <><PageIntro eyebrow="Sermon library" title="Words to carry into Monday." copy="Listen for a message that meets you where you are. Search by title, speaker, or theme." /><section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8"><div className="relative max-w-xl"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-sermon-search" placeholder="Search sermons" className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-5 text-sm outline-none transition-colors focus:border-secondary" /></div>{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : sermons.length === 0 ? <div className="mt-10"><QueryMessage kind="empty" /></div> : <div className="mt-10 grid gap-4 lg:grid-cols-2">{sermons.map((sermon) => <article key={sermon.id} data-testid={`card-sermon-${sermon.id}`} className="hover-lift flex flex-col justify-between rounded-2xl border border-border bg-card p-6 sm:p-7"><div><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="rounded-full bg-secondary/15 px-3 py-1 font-bold uppercase tracking-wider text-primary">{sermon.series || 'Sunday message'}</span><span>{formatDate(sermon.date)}</span></div><h2 className="mt-6 font-display text-2xl text-primary">{sermon.title}</h2><p className="mt-2 text-sm font-semibold text-accent">{sermon.speaker}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{sermon.description}</p></div><div className="mt-7 flex items-center justify-between border-t border-border pt-5"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14} /> {sermon.duration}</span><div className="flex gap-2">{sermon.audioUrl && <a href={sermon.audioUrl} target="_blank" rel="noreferrer" data-testid={`link-sermon-audio-${sermon.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 px-3 py-2 text-xs font-bold text-primary"><Headphones size={13} /> Audio</a>}{sermon.videoUrl && <a href={sermon.videoUrl} target="_blank" rel="noreferrer" data-testid={`link-sermon-video-${sermon.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"><Video size={13} /> Watch</a>}</div></div></article>)}</div>}</section></>;
}

export function Articles() {
  const [search, setSearch] = useState('');
  const [openArticleId, setOpenArticleId] = useState<number | null>(null);
  const query = useListArticles(search || undefined, undefined, { staleTime: 60000 });
  const articles = query.data ?? [];
  const openArticle = articles.find((article) => article.id === openArticleId) ?? null;
  return <><PageIntro eyebrow="Articles" title="Small thoughts for a faithful life." copy="Stories, practices, and honest reflections written by our team — published straight from the Media Admin dashboard." /><section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="relative max-w-md flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-article-search" placeholder="Search articles" className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-5 text-sm outline-none focus:border-secondary" /></div><span className="text-sm text-muted-foreground">{articles.length} articles</span></div>{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : articles.length === 0 ? <div className="mt-10"><QueryMessage kind="empty" /></div> : <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{articles.map((article, index) => <article key={article.id} data-testid={`card-article-${article.id}`} onClick={() => setOpenArticleId(article.id)} className={`hover-lift cursor-pointer rounded-2xl border border-border bg-card p-6 ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}><span className="eyebrow text-accent">{article.category || 'Article'}</span><h2 className="mt-5 font-display text-2xl leading-tight text-primary">{article.title}</h2><p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{article.excerpt}</p><div className="mt-7 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>{article.author}</span><span>{article.readTime}</span></div></article>)}</div>}</section>
    {openArticle && (
      <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-5" onClick={() => setOpenArticleId(null)}>
        <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-card p-7 sm:p-10" onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => setOpenArticleId(null)} data-testid="button-close-article" className="ml-auto flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-primary"><X size={18} /></button>
          <span className="eyebrow text-accent">{openArticle.category}</span>
          <h2 className="mt-3 font-display text-3xl leading-tight text-primary">{openArticle.title}</h2>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground"><span>{openArticle.author}</span><span>·</span><span>{formatDate(openArticle.date)}</span><span>·</span><span>{openArticle.readTime}</span></div>
          <div className="mt-6 space-y-4 text-sm leading-7 text-foreground/80">{openArticle.content.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
        </div>
      </div>
    )}
  </>;
}

// Clicking a video plays it inline via a responsive iframe (YouTube links
// are normalised server-side to a youtube-nocookie embed URL; other
// direct file links render with a native <video> element instead).
function VideoCard({ video, onPlay }: { video: VideoRecord; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      data-testid={`card-video-${video.id}`}
      className="hover-lift group relative aspect-video w-full overflow-hidden rounded-2xl bg-primary text-left shadow-sm"
    >
      {video.thumbnailUrl ? (
        <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-70" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-primary/90"><Video className="text-secondary" size={28} /></div>
      )}
      <span className="absolute inset-0 grid place-items-center"><PlayCircle className="text-white drop-shadow-lg transition-transform group-hover:scale-110" size={48} /></span>
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <span className="block font-display text-base leading-tight text-white">{video.title}</span>
        {video.category && <span className="mt-1 block text-[11px] font-bold uppercase tracking-wider text-secondary">{video.category}</span>}
      </span>
    </button>
  );
}

function VideoGrid({ videos }: { videos: VideoRecord[] }) {
  const [playing, setPlaying] = useState<VideoRecord | null>(null);
  return (
    <>
      {videos.map((video) => <VideoCard key={video.id} video={video} onPlay={() => setPlaying(video)} />)}
      {playing && (
        <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5" onClick={() => setPlaying(null)}>
          <div className="w-full max-w-4xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between pb-3"><h2 className="font-display text-lg text-white">{playing.title}</h2><button type="button" onClick={() => setPlaying(null)} data-testid="button-close-video" className="text-white/80 hover:text-white"><X size={22} /></button></div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              {playing.isDirectFile ? (
                <video src={playing.embedUrl} controls autoPlay className="h-full w-full" />
              ) : (
                <iframe
                  src={`${playing.embedUrl}${playing.embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                  title={playing.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              )}
            </div>
            {playing.description && <p className="mt-4 text-sm leading-6 text-white/70">{playing.description}</p>}
          </div>
        </div>
      )}
    </>
  );
}

export function GalleryPage() {
  const query = useListGalleryPhotos({ staleTime: 60000 });
  const photos = query.data ?? [];
  const [openPhoto, setOpenPhoto] = useState<GalleryPhoto | null>(null);
  return <><PageIntro eyebrow="Gallery" title="A picture of church life." copy="Photos from our services, community life, and time together — shared straight from the Media Admin dashboard." /><section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8">{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : photos.length === 0 ? <QueryMessage kind="empty" /> : <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">{photos.map((photo) => <button key={photo.id} type="button" onClick={() => setOpenPhoto(photo)} data-testid={`button-gallery-photo-${photo.id}`} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl"><img src={photo.url} alt={photo.caption ?? ''} loading="lazy" className="h-auto w-full transition-transform duration-700 group-hover:scale-105" />{photo.caption && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 to-transparent p-3 text-left text-xs font-semibold text-primary-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">{photo.caption}</div>}</button>)}</div>}</section>
    {openPhoto && (
      <div role="dialog" aria-modal className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-5" onClick={() => setOpenPhoto(null)}>
        <div className="max-h-[85vh] max-w-4xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-end pb-3"><button type="button" onClick={() => setOpenPhoto(null)} data-testid="button-close-gallery-photo" className="text-white/80 hover:text-white"><X size={22} /></button></div>
          <img src={openPhoto.url} alt={openPhoto.caption ?? ''} className="max-h-[70vh] w-full rounded-2xl object-contain" />
          {openPhoto.caption && <p className="mt-4 text-center text-sm text-white/80">{openPhoto.caption}</p>}
        </div>
      </div>
    )}
  </>;
}

export function Videos() {
  const [search, setSearch] = useState('');
  const query = useListVideos(search || undefined, undefined, { staleTime: 60000 });
  const videos = query.data ?? [];
  return <><PageIntro eyebrow="Videos" title="Watch a moment from Overcomers." copy="Highlights, testimonies, and messages our media team has shared — click any video to play it right here." /><section className="mx-auto max-w-7xl px-5 py-16 sm:py-24 lg:px-8"><div className="relative max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-video-search" placeholder="Search videos" className="w-full rounded-full border border-border bg-card py-3.5 pl-11 pr-5 text-sm outline-none focus:border-secondary" /></div>{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : videos.length === 0 ? <div className="mt-10"><QueryMessage kind="empty" /></div> : <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><VideoGrid videos={videos} /></div>}</section></>;
}

export function Live() {
  return <LiveBroadcastPage />;
}

export function DailyDevotional() {
  const query = useGetTodayDevotional({ staleTime: 60000 });
  const devotional = query.data;
  return <><PageIntro eyebrow="Daily devotional" title="A little light for today." copy="A quiet moment with Scripture, an honest reflection, and a prayer you can carry with you." /><section className="mx-auto max-w-4xl px-5 py-16 sm:py-24 lg:px-8">{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : !devotional ? <QueryMessage kind="empty" /> : <article className="rounded-[2rem] border border-border bg-card p-7 sm:p-12"><div className="flex items-center justify-between border-b border-border pb-6"><span className="eyebrow text-accent">Today · {formatDate(devotional.date)}</span><BookOpen className="text-secondary" size={22} /></div><blockquote className="mt-10 font-display text-3xl leading-snug text-primary sm:text-5xl">“{devotional.verse}”</blockquote><p className="mt-5 text-sm font-bold uppercase tracking-[.15em] text-accent">{devotional.reference}</p><div className="mt-12 grid gap-10 border-t border-border pt-10 sm:grid-cols-2"><div><h2 className="font-display text-2xl text-primary">Reflect</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{devotional.reflection}</p></div><div className="rounded-xl bg-muted p-6"><h2 className="font-display text-2xl text-primary">Pray</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{devotional.prayerPoint}</p></div></div></article>}</section></>;
}

export function Testimonies() {
  const query = useListTestimonies({ staleTime: 120000 });
  const testimonies = query.data ?? [];
  return <><PageIntro eyebrow="Stories of grace" title="God is still writing stories." copy="These are the voices of people in our community. Ordinary lives, met by an extraordinary grace." /><section className="mx-auto max-w-7xl px-5 py-20 sm:py-28 lg:px-8">{query.isLoading ? <QueryMessage kind="loading" /> : query.isError ? <QueryMessage kind="error" onRetry={() => query.refetch()} /> : testimonies.length === 0 ? <QueryMessage kind="empty" /> : <div className="columns-1 gap-5 md:columns-2 lg:columns-3">{testimonies.map((story) => <article key={story.id} data-testid={`card-testimony-${story.id}`} className="mb-5 break-inside-avoid rounded-2xl border border-border bg-card p-7"><Quote className="text-secondary" size={22} /><p className="mt-5 text-base leading-7 text-foreground/80">“{story.content}”</p><div className="mt-7 flex items-center gap-3 border-t border-border pt-5"><div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-xs font-bold text-secondary">{story.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div><p className="text-sm font-bold text-primary">{story.name}</p><p className="text-xs text-muted-foreground">{story.location}</p></div></div></article>)}</div>}</section><section className="bg-secondary/15 px-5 py-16 text-center"><h2 className="font-display text-3xl text-primary">Your story matters too.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Share what God has been doing in your life with the Overcomers family.</p><Link href="/contact" data-testid="link-testimony-share" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Tell us your story <ArrowRight size={15} /></Link></section></>;
}

type FormState = 'idle' | 'success' | 'error';
function FormNotice({ state, message }: { state: FormState; message?: string }) {
  if (state === 'idle') return null;
  return <div role="status" data-testid={`status-form-${state}`} className={`mb-5 flex items-start gap-3 rounded-xl p-4 text-sm ${state === 'success' ? 'bg-secondary/15 text-primary' : 'bg-accent/10 text-accent'}`}><CheckCircle2 className="mt-0.5 shrink-0" size={17} /><span>{message || (state === 'success' ? 'Thank you. Your message has been received.' : 'Something went wrong. Please try again.')}</span></div>;
}
function Field({ label, name, value, onChange, type = 'text', placeholder, required = true, textarea = false }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; required?: boolean; textarea?: boolean }) {
  const common = { id: name, name, value, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value), placeholder, required, 'data-testid': `input-${name}`, className: 'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15' };
  return <label htmlFor={name} className="block text-sm font-semibold text-primary">{label}{textarea ? <textarea {...common} rows={5} /> : <input {...common} type={type} />}</label>;
}

export function PrayerRequest() {
  const mutation = useCreatePrayerRequest();
  const [form, setForm] = useState({ name: '', request: '', anonymous: false });
  const [state, setState] = useState<FormState>('idle');
  const submit = (event: FormEvent) => { event.preventDefault(); setState('idle'); mutation.mutate(form, { onSuccess: () => { setState('success'); setForm({ name: '', request: '', anonymous: false }); }, onError: () => setState('error') }); };
  return <><PageIntro eyebrow="Prayer request" title="You do not have to carry it alone." copy="Our prayer team would be honoured to stand with you. Share as much or as little as you feel ready to." /><section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><SectionLabel>A quiet promise</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary">We will treat your story with care.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">Every request is read by a trusted member of our pastoral team. You can submit anonymously, and we will never publish your details without permission.</p><div className="mt-8 flex items-center gap-3 text-sm font-semibold text-primary"><ShieldCheck className="text-secondary" size={22} /> Confidential and prayerfully held</div></div><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-9"><FormNotice state={state} message={state === 'success' ? 'Your prayer request is with our team. We are standing with you.' : undefined} /><div className="grid gap-5"><Field label="Your name (optional)" name="prayer-name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="How may we address you?" required={false} /><Field label="What would you like prayer for?" name="prayer-request" value={form.request} onChange={(request) => setForm({ ...form, request })} placeholder="Share what is on your heart..." textarea /><label className="flex items-center gap-3 text-sm text-muted-foreground"><input type="checkbox" checked={form.anonymous} onChange={(event) => setForm({ ...form, anonymous: event.target.checked })} data-testid="input-prayer-anonymous" className="h-4 w-4 accent-[hsl(var(--primary))]" /> Please keep my request anonymous</label><button type="submit" disabled={mutation.isPending} data-testid="button-submit-prayer" className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send prayer request</button></div></form></section></>;
}

export function NewMember() {
  const mutation = useRegisterMember();
  const [state, setState] = useState<FormState>('idle');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', gender: '', occupation: '', address: '', birthday: '', prayerRequest: '' });
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); setState('idle'); mutation.mutate({ ...form, birthday: form.birthday || null }, { onSuccess: () => { setState('success'); }, onError: () => setState('error') }); };
  return <><PageIntro eyebrow="New here" title="Let’s get to know each other." copy="Whether this is your first Sunday or your first step back to church, we would love to welcome you properly." /><section className="mx-auto max-w-4xl px-5 py-16 sm:py-24 lg:px-8"><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-10"><FormNotice state={state} message={state === 'success' ? 'Welcome to the family. A member of our team will be in touch soon.' : undefined} /><div className="grid gap-5 sm:grid-cols-2"><Field label="First name" name="member-first-name" value={form.firstName} onChange={update('firstName')} placeholder="Your first name" /><Field label="Last name" name="member-last-name" value={form.lastName} onChange={update('lastName')} placeholder="Your last name" /><Field label="Email address" name="member-email" value={form.email} onChange={update('email')} type="email" placeholder="you@example.com" /><Field label="Phone number" name="member-phone" value={form.phone} onChange={update('phone')} type="tel" placeholder="+234" /><Field label="Gender" name="member-gender" value={form.gender} onChange={update('gender')} placeholder="How do you identify?" required={false} /><Field label="Occupation" name="member-occupation" value={form.occupation} onChange={update('occupation')} placeholder="What do you do?" /><Field label="Birthday" name="member-birthday" value={form.birthday} onChange={update('birthday')} type="date" required={false} /><Field label="Home address" name="member-address" value={form.address} onChange={update('address')} placeholder="Where do you live?" /></div><div className="mt-5"><Field label="Is there anything you would like us to pray with you about?" name="member-prayer" value={form.prayerRequest} onChange={update('prayerRequest')} placeholder="Optional" required={false} textarea /></div><button type="submit" disabled={mutation.isPending} data-testid="button-submit-member" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />} Register with Overcomers</button></form></section></>;
}

export function Consultation() {
  const mutation = useCreateConsultation();
  const [state, setState] = useState<FormState>('idle');
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => { event.preventDefault(); setState('idle'); mutation.mutate(form, { onSuccess: () => setState('success'), onError: () => setState('error') }); };
  return <><PageIntro eyebrow="Private consultation" title="A safe place to talk things through." copy="Our pastoral team offers thoughtful, confidential conversations for seasons that need a little extra care." /><section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[.75fr_1.25fr] lg:px-8"><div><SectionLabel>Pastoral care</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary">You can ask for help.</h2><p className="mt-5 text-sm leading-7 text-muted-foreground">Tell us a little about what you need and a member of our team will reach out to arrange a private conversation. For urgent medical or safety needs, please contact local emergency services.</p><div className="mt-8 space-y-4 text-sm text-muted-foreground"><p className="flex items-center gap-3"><ShieldCheck className="text-secondary" size={19} /> Your details stay confidential.</p><p className="flex items-center gap-3"><HeartHandshake className="text-secondary" size={19} /> You will be met without judgement.</p></div></div><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-9"><FormNotice state={state} message={state === 'success' ? 'Thank you. Our care team will contact you soon.' : undefined} /><div className="grid gap-5 sm:grid-cols-2"><Field label="Your name" name="consultation-name" value={form.name} onChange={update('name')} placeholder="Your name" /><Field label="Email address" name="consultation-email" value={form.email} onChange={update('email')} type="email" placeholder="you@example.com" /><Field label="Phone number" name="consultation-phone" value={form.phone} onChange={update('phone')} type="tel" placeholder="+234" /><Field label="What can we help with?" name="consultation-subject" value={form.subject} onChange={update('subject')} placeholder="A brief subject" /></div><div className="mt-5"><Field label="Tell us a little more" name="consultation-message" value={form.message} onChange={update('message')} placeholder="You can share at your own pace..." textarea /></div><button type="submit" disabled={mutation.isPending} data-testid="button-submit-consultation" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Request a consultation</button></form></section></>;
}

function GiveOption({ icon: Icon, title, children }: { icon: typeof Gift; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-7">
      <Icon className="text-secondary" size={24} />
      <h2 className="mt-4 font-display text-2xl text-primary">{title}</h2>
      <div className="mt-3 text-sm leading-7 text-muted-foreground">{children}</div>
    </div>
  );
}

export function Give() {
  return (
    <>
      <PageIntro
        eyebrow="Give"
        title="Generosity that builds the kingdom."
        copy="Every gift helps Overcomers care for our city, support our ministries, and make room for one more person to encounter God. Thank you for sowing with us."
      />
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:py-24 md:grid-cols-2 lg:px-8">
        <GiveOption icon={ArrowUpRight} title="Bank transfer">
          <p>Account name: <span className="font-semibold text-primary">Overcomers Ministry of Believers Fellowship</span></p>
          <p className="mt-1">Bank: To be confirmed by the finance office</p>
          <p className="mt-1">Account number: To be confirmed by the finance office</p>
          <p className="mt-4 text-xs text-muted-foreground/80">Ask the church office for current account details, or use one of the options below.</p>
        </GiveOption>
        <GiveOption icon={Gift} title="Give in person">
          <p>Bring your offering to any Sunday service — 7:00 AM or 9:00 AM — or drop it at the church office during the week.</p>
          <p className="mt-3">No 40 NTA Road, Port Harcourt</p>
        </GiveOption>
      </section>
      <section className="bg-secondary/15 px-5 py-16 text-center lg:px-8">
        <h2 className="font-display text-3xl text-primary">Have a question about giving?</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Reach out and our team will be glad to help.</p>
        <Link href="/contact" data-testid="link-give-contact" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground">Contact the church <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}

export function Contact() {
  const mutation = useCreateContactMessage();
  const [state, setState] = useState<FormState>('idle');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); setState('idle'); mutation.mutate(form, { onSuccess: () => { setState('success'); setForm({ name: '', email: '', message: '' }); }, onError: () => setState('error') }); };
  return <><PageIntro eyebrow="Contact" title="We would love to hear from you." copy="A question about visiting, serving, a ministry, or anything else? Send a note and our team will get back to you." /><section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-8"><div><SectionLabel>Come say hello</SectionLabel><h2 className="font-display text-4xl leading-tight text-primary">Church is better when it is a conversation.</h2><div className="mt-10 space-y-6"><div className="flex gap-4"><MapPin className="mt-1 shrink-0 text-secondary" size={21} /><div><p className="font-bold text-primary">Find us</p><p className="mt-1 text-sm leading-6 text-muted-foreground">No 40 NTA Road<br />Port Harcourt</p></div></div><div className="flex gap-4"><Mail className="mt-1 shrink-0 text-secondary" size={21} /><div><p className="font-bold text-primary">Email us</p><p className="mt-1 text-sm text-muted-foreground">hello@overcomersfaith.org</p></div></div><div className="flex gap-4"><Phone className="mt-1 shrink-0 text-secondary" size={21} /><div><p className="font-bold text-primary">Call us</p><p className="mt-1 text-sm text-muted-foreground">+234 800 000 0000</p></div></div></div></div><form onSubmit={submit} className="rounded-2xl border border-border bg-card p-6 sm:p-9"><FormNotice state={state} message={state === 'success' ? 'Your message is on its way. Thank you for reaching out.' : undefined} /><div className="grid gap-5 sm:grid-cols-2"><Field label="Your name" name="contact-name" value={form.name} onChange={(name) => setForm({ ...form, name })} placeholder="Your name" /><Field label="Email address" name="contact-email" value={form.email} onChange={(email) => setForm({ ...form, email })} type="email" placeholder="you@example.com" /></div><div className="mt-5"><Field label="Your message" name="contact-message" value={form.message} onChange={(message) => setForm({ ...form, message })} placeholder="How can we help?" textarea /></div><button type="submit" disabled={mutation.isPending} data-testid="button-submit-contact" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Send message</button></form></section></>;
}
