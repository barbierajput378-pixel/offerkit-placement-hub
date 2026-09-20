import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import {
  ArrowRight, BarChart3 as BarChartIcon, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck as ClipboardIcon, Clock3 as ClockIcon,
  FileText, Filter, GraduationCap, HeartHandshake, Laptop, Link2, Loader2, Mail, Menu, MessageCircle,
  Search, Send, ShieldCheck, Users as UsersIcon, Moon, Sun, Github, Linkedin, Instagram,
  Target, TrendingUp, X, Zap,
} from 'lucide-react';
import {
  getGetAnalyticsQueryKey, getGetPostQueryKey, useCheckResume, useCreateAdminSession,
  useGeneratePlanner, useGetAnalytics, useGetPost, useListPosts, useListResources,
  useSubmitContact, useSubmitQuizResult, useSubscribeNewsletter, useTrackEvent,
} from '@workspace/api-client-react';
import type { BlogPost, Resource } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const BarChart3: any = BarChartIcon;
const ClipboardCheck: any = ClipboardIcon;
const Clock3: any = ClockIcon;
const Users: any = UsersIcon;

const queryClient = new QueryClient();
const visitorKey = 'offerkit-visitor-id';
const visitorId = () => {
  const existing = localStorage.getItem(visitorKey);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(visitorKey, id);
  return id;
};

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

function sendGtag(event: string, params: Record<string, unknown> = {}) {
  const analyticsWindow = window as AnalyticsWindow;
  analyticsWindow.gtag?.('event', event, params);
}

function setPageMeta(title: string, description: string) {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  meta?.setAttribute('content', description);
}

function browserName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  return 'Other';
}

function osName() {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Android')) return 'Android';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Windows')) return 'Windows';
  return 'Other';
}

const fallbackPosts: BlogPost[] = [
  { slug: 'first-placement-season-without-panic', title: 'The first placement season does not need to feel like a fire drill', excerpt: 'A calmer way to decide what to learn, what to skip, and what to do this week.', category: 'Mindset', date: '2024-08-18', readTime: 6, views: 1840, image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80', content: '<p>Placement season rewards consistent preparation more than heroic last-minute effort. Start with a small, visible plan.</p><h2>Trade panic for a weekly rhythm</h2><p>Pick one technical block, one application block, and one conversation every week. Small loops compound.</p>', tags: ['mindset', 'planning'] },
  { slug: 'resume-bullets-that-show-your-work', title: 'Resume bullets that show your work, not just your job title', excerpt: 'A practical rewrite guide for engineering students with projects, internships, and little space.', category: 'Resume', date: '2024-08-11', readTime: 8, views: 2310, image: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=1200&q=80', content: '<p>Your resume has one job: make the next conversation easier. Strong bullets make the work concrete.</p><h2>The evidence formula</h2><p>Use action, object, and evidence. Replace “worked on an app” with what changed because you built it.</p>', tags: ['resume', 'projects'] },
  { slug: 'off-campus-roles-actually-worth-applying-to', title: 'How to tell if an off-campus role is worth your evening', excerpt: 'A quick filter for noisy job boards, vague descriptions, and roles that teach you something.', category: 'Applications', date: '2024-07-29', readTime: 5, views: 1274, image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200&q=80', content: '<p>Not every opportunity deserves an application. Look for learning signal, a real team, and a hiring loop you can understand.</p>', tags: ['applications', 'careers'] },
  { slug: 'system-design-for-your-first-interview', title: 'System design for your first interview: start with the user', excerpt: 'You do not need to know everything. You need a way to make sensible trade-offs out loud.', category: 'Interviews', date: '2024-07-15', readTime: 10, views: 3126, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80', content: '<p>For early-career system design, clarity beats jargon. Begin with users, constraints, and the simplest useful version.</p>', tags: ['system design', 'interviews'] },
];

const fallbackResources: Resource[] = [
  { id: 'r1', title: 'DSA patterns, without the 400-question guilt', description: 'A focused map of the patterns that show up most often in entry-level interviews.', category: 'Technical', level: 'Beginner', duration: '12 min read', href: '/blog/system-design-for-your-first-interview' },
  { id: 'r2', title: 'Resume bullet rewrite kit', description: 'Before-and-after examples for projects, internships, and campus roles.', category: 'Resume', level: 'All levels', duration: '9 min read', href: '/blog/resume-bullets-that-show-your-work' },
  { id: 'r3', title: 'The mock interview scorecard', description: 'A simple rubric to review a mock without turning it into a performance review.', category: 'Interviews', level: 'Intermediate', duration: 'PDF worksheet', href: '/tools' },
  { id: 'r4', title: '30-day placement planner', description: 'Turn a target role and two weak areas into a plan you can actually finish.', category: 'Planning', level: 'All levels', duration: 'Interactive tool', href: '/tools' },
  { id: 'r5', title: 'Questions to ask your interviewer', description: 'Thoughtful questions that help you learn about the role and leave a signal.', category: 'Interviews', level: 'All levels', duration: '6 min read', href: '/blog/first-placement-season-without-panic' },
  { id: 'r6', title: 'A gentler approach to aptitude rounds', description: 'How to practice speed and accuracy without spending every evening on mocks.', category: 'Technical', level: 'Beginner', duration: '8 min read', href: '/blog' },
];

function trackPayload(event: string, label?: string) {
  const params = new URLSearchParams(window.location.search);
  return {
    visitorId: visitorId(),
    event,
    path: window.location.pathname,
    label: label ?? null,
    referrer: document.referrer || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    browser: browserName(),
    os: osName(),
    screen: `${window.innerWidth}x${window.innerHeight}`,
  };
}

function AnalyticsScript() {
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_ID;
    if (!measurementId || document.getElementById('offerkit-ga')) return;
    const analyticsWindow = window as AnalyticsWindow;
    analyticsWindow.dataLayer = analyticsWindow.dataLayer ?? [];
    analyticsWindow.gtag = (...args: unknown[]) => analyticsWindow.dataLayer?.push(args);
    analyticsWindow.gtag('js', new Date());
    analyticsWindow.gtag('config', measurementId, { send_page_view: false });
    const script = document.createElement('script');
    script.id = 'offerkit-ga';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }, []);
  return null;
}

function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('offerkit-theme') === 'dark');
  const [exitOpen, setExitOpen] = useState(false);
  const [exitEmail, setExitEmail] = useState('');
  const [location] = useLocation();
  const track = useTrackEvent();
  const exitSubscribe = useSubscribeNewsletter();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('offerkit-theme', dark ? 'dark' : 'light');
  }, [dark]);
  useEffect(() => {
    track.mutate({ data: trackPayload('page_view') });
    sendGtag('page_view', { page_path: location });
  }, [location]);
  useEffect(() => {
    const titles: Record<string, [string, string]> = {
      '/': ['OfferKit — From campus to CTC.', 'Practical placement preparation for engineering students in India.'],
      '/resources': ['Resources — OfferKit', 'Focused explainers, worksheets, and tools for placement preparation.'],
      '/blog': ['Field notes — OfferKit', 'Honest, useful notes about resumes, interviews, aptitude, DSA, and placement season.'],
      '/tools': ['Practical tools — OfferKit', 'Check your readiness, score your resume, and build a 30-day preparation plan.'],
      '/about': ['Our story — OfferKit', 'Why OfferKit exists and how we think about placement preparation.'],
      '/contact': ['Contact — OfferKit', 'Have a question, correction, or good idea? Write to the OfferKit team.'],
      '/prep-bootcamp': ['Prep bootcamp — OfferKit', 'A focused 30-day placement preparation sprint for engineering students.'],
      '/admin/analytics': ['Analytics — OfferKit', 'Private first-party analytics for the OfferKit team.'],
    };
    const [title, description] = titles[location] ?? ['OfferKit — Field notes', 'From campus to CTC.'];
    setPageMeta(title, description);
  }, [location]);
  useEffect(() => {
    if (sessionStorage.getItem('offerkit-exit-intent') === 'seen') return;
    const onMouseOut = (event: MouseEvent) => {
      if (event.clientY <= 0) {
        sessionStorage.setItem('offerkit-exit-intent', 'seen');
        setExitOpen(true);
      }
    };
    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, []);
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md">
        <div className="container-shell flex h-[72px] items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3" data-testid="link-logo">
            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-primary text-primary-foreground"><span className="font-display text-xl font-bold">O</span></span>
            <span className="font-display text-[21px] font-bold tracking-[-.06em]">offer<span className="text-accent">kit</span></span>
          </Link>
          <nav className={`${open ? 'absolute left-0 right-0 top-[72px] flex border-b bg-background p-5' : 'hidden'} flex-col gap-4 md:static md:flex md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0`} aria-label="Main navigation">
            <NavLink href="/" active={location === '/'}>Home</NavLink>
            <NavLink href="/resources" active={location === '/resources'}>Resources</NavLink>
            <NavLink href="/blog" active={location.startsWith('/blog')}>Field notes</NavLink>
            <NavLink href="/tools" active={location === '/tools'}>Tools</NavLink>
            <NavLink href="/about" active={location === '/about'}>Our story</NavLink>
            <NavLink href="/contact" active={location === '/contact'}>Contact</NavLink>
            <Link href="/prep-bootcamp" onClick={() => { track.mutate({ data: trackPayload('cta_click', 'bootcamp-nav') }); sendGtag('cta_click', { label: 'bootcamp-nav' }); }} className="btn mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground md:ml-3 md:mt-0" data-testid="link-bootcamp-nav">Join the bootcamp <ArrowRight size={15} /></Link>
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setDark(value => !value)} className="rounded-lg p-2 text-muted-foreground hover:text-primary" aria-label={dark ? 'Use light mode' : 'Use dark mode'} data-testid="button-theme-toggle">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => setOpen(!open)} className="rounded-lg p-2 md:hidden" aria-label="Toggle menu" data-testid="button-menu">{open ? <X size={21} /> : <Menu size={21} />}</button>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
      {exitOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Newsletter signup"><div className="relative w-full max-w-md rounded-3xl border bg-card p-8 shadow-2xl"><button onClick={() => setExitOpen(false)} className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:text-foreground" aria-label="Close newsletter popup"><X size={18} /></button><Eyebrow>Before you go</Eyebrow><h2 className="font-display text-3xl font-bold tracking-[-.05em]">Keep one useful idea close.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">A short weekly note for placement prep. No noise, no fake urgency.</p><form onSubmit={event => { event.preventDefault(); exitSubscribe.mutate({ data: { email: exitEmail, source: 'exit-intent' } }, { onSuccess: () => { sendGtag('newsletter_signup', { source: 'exit-intent' }); setExitOpen(false); } }); }} className="mt-6 flex gap-2"><input autoFocus required type="email" value={exitEmail} onChange={event => setExitEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 rounded-full border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" /><button disabled={exitSubscribe.isPending} className="btn rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground">Join</button></form></div></div>}
    </div>
  );
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return <Link href={href} className={`text-sm font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`} data-testid={`link-nav-${href.slice(1)}`}>{children}</Link>;
}

function Footer() {
  const subscribe = useSubscribeNewsletter();
  const track = useTrackEvent();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent) => { e.preventDefault(); if (!email) return; subscribe.mutate({ data: { email, source: 'footer' } }, { onSuccess: () => { setSent(true); setEmail(''); track.mutate({ data: trackPayload('newsletter_signup', 'footer') }); sendGtag('newsletter_signup', { source: 'footer' }); } }); };
  return <footer className="mt-24 border-t bg-[hsl(38_40%_93%)]">
    <div className="container-shell grid gap-12 py-14 md:grid-cols-[1.1fr_.7fr_.9fr]">
      <div><Link href="/" className="font-display text-xl font-bold tracking-[-.05em]" data-testid="link-footer-logo">offer<span className="text-accent">kit</span></Link><p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">Useful preparation for the part of college nobody gives you a syllabus for.</p><div className="mt-6 flex gap-3 text-muted-foreground"><a href="https://www.linkedin.com" aria-label="OfferKit on LinkedIn" className="transition-colors hover:text-primary"><Linkedin size={16} /></a><a href="https://www.instagram.com" aria-label="OfferKit on Instagram" className="transition-colors hover:text-primary"><Instagram size={16} /></a><a href="https://github.com" aria-label="OfferKit on GitHub" className="transition-colors hover:text-primary"><Github size={16} /></a></div><p className="mt-6 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Made for the next good conversation</p></div>
      <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Explore</p><div className="mt-4 grid gap-3 text-sm font-semibold"><Link href="/resources" data-testid="link-footer-resources">Resource library</Link><Link href="/tools" data-testid="link-footer-tools">Practical tools</Link><Link href="/blog" data-testid="link-footer-blog">Field notes</Link><Link href="/about" data-testid="link-footer-about">Our story</Link></div></div>
      <div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">A small note, weekly</p><p className="mt-3 text-sm leading-6 text-muted-foreground">One useful idea for placement prep. No noise, no fake urgency.</p><form onSubmit={submit} className="mt-4 flex gap-2"><input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="you@example.com" className="min-w-0 flex-1 rounded-lg border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" aria-label="Email for newsletter" data-testid="input-newsletter-email" /><button disabled={subscribe.isPending} className="btn rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground" data-testid="button-newsletter-submit">{sent ? <Check size={17} /> : <Send size={16} />}</button></form>{sent && <p className="mt-2 text-xs font-semibold text-primary" data-testid="status-newsletter-success">You are on the list.</p>}</div>
    </div><div className="container-shell flex flex-col justify-between gap-2 border-t py-5 text-xs text-muted-foreground sm:flex-row"><span>© 2024 OfferKit</span><Link href="/contact" data-testid="link-footer-contact">Have a question? Write in.</Link></div>
  </footer>;
}

function Eyebrow({ children }: { children: ReactNode }) { return <div className="mb-5 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{children}</div>; }
function ButtonLink({ href, children, secondary = false, testId }: { href: string; children: ReactNode; secondary?: boolean; testId: string }) { return <Link href={href} className={`btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold ${secondary ? 'border bg-card text-foreground hover:border-primary' : 'bg-primary text-primary-foreground hover:bg-[hsl(173_48%_25%)]'}`} data-testid={testId}>{children}</Link>; }

function Home() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const subscribe = useSubscribeNewsletter();
  const track = useTrackEvent();
  const postsQuery = useListPosts();
  const posts = postsQuery.data ?? fallbackPosts;
  const submit = (e: FormEvent) => { e.preventDefault(); subscribe.mutate({ data: { email, source: 'home-hero' } }, { onSuccess: () => { setSent(true); setEmail(''); track.mutate({ data: trackPayload('newsletter_signup', 'home-hero') }); sendGtag('newsletter_signup', { source: 'home-hero' }); } }); };
  return <div>
    <section className="relative overflow-hidden border-b"><div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-secondary/60 blur-3xl" /><div className="container-shell relative grid gap-12 py-16 md:grid-cols-[1.05fr_.95fr] md:items-center md:py-24">
      <div className="reveal"><Eyebrow>For the season ahead</Eyebrow><h1 className="font-display max-w-xl text-[clamp(3.2rem,7vw,6.3rem)] font-bold leading-[.94] tracking-[-.075em]">Get ready for your <span className="text-primary">next yes.</span></h1><p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">OfferKit is the practical companion for engineering students navigating placements — clear plans, honest advice, and tools that make today feel doable.</p><div className="mt-9 flex flex-wrap gap-3"><ButtonLink href="/tools" testId="link-hero-tools">Find my next step <ArrowRight size={16} /></ButtonLink><ButtonLink href="/prep-bootcamp" secondary testId="link-hero-bootcamp">Explore the bootcamp</ButtonLink></div><div className="mt-10 flex items-center gap-3 text-xs text-muted-foreground"><div className="flex -space-x-2"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-[#e8b98b] text-[10px] font-bold text-[#653e29]">AS</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-[#9fc4b5] text-[10px] font-bold text-[#23463e]">RM</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-background bg-[#d9a2a6] text-[10px] font-bold text-[#632d36]">NK</span></div><span>Joined by 2,400+ students this season</span></div></div>
      <div className="relative reveal [animation-delay:.1s]"><div className="overflow-hidden rounded-[2rem] border bg-[#dfeae4] p-3 shadow-[0_25px_70px_rgba(39,58,55,.12)]"><div className="relative overflow-hidden rounded-[1.5rem]"><img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=85" alt="Engineering students collaborating around a table" className="h-[390px] w-full object-cover md:h-[480px]" /><div className="absolute inset-0 bg-gradient-to-t from-[#173c37]/75 via-transparent to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6 text-[#fbf6eb]"><div className="font-mono text-[10px] uppercase tracking-[.2em] text-[#c8dcca]">A little less panic</div><p className="mt-2 max-w-xs font-display text-2xl font-semibold leading-tight">A clear next step is still progress.</p></div></div></div><div className="absolute -bottom-5 -left-5 hidden rounded-2xl border bg-card p-4 shadow-xl sm:block"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-primary"><Target size={18} /></div><div><p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Today's focus</p><p className="text-sm font-bold">One honest hour</p></div></div></div></div>
    </div></section>
    <section className="container-shell py-20"><div className="grid gap-10 md:grid-cols-[.75fr_1.25fr]"><div><Eyebrow>Why OfferKit</Eyebrow><h2 className="font-display max-w-sm text-4xl font-bold leading-tight tracking-[-.055em]">Preparation should feel like a path, not a pile.</h2></div><div className="grid gap-8 sm:grid-cols-3"><Value icon={<Target />} title="Know what matters" text="Spend your time on the skills and stories recruiters actually ask about." /><Value icon={<HeartHandshake />} title="Learn from peers" text="No polished career theatre. Just lessons from students one step ahead." /><Value icon={<Zap />} title="Keep moving" text="Small tools turn a vague goal into a useful thing to do next." /></div></div></section>
    <section className="bg-primary py-20 text-primary-foreground"><div className="container-shell grid gap-10 md:grid-cols-[1fr_1.2fr] md:items-end"><div><Eyebrow>Start here</Eyebrow><h2 className="font-display max-w-md text-4xl font-bold leading-tight tracking-[-.055em] text-primary-foreground">Your prep does not need to be perfect to begin.</h2></div><div className="grid gap-3 sm:grid-cols-3"><QuickCard n="01" title="Check your readiness" href="/tools" /><QuickCard n="02" title="Build a 30-day plan" href="/tools" /><QuickCard n="03" title="Read the field notes" href="/blog" /></div></div></section>
    <section className="container-shell py-20"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Eyebrow>From the field notes</Eyebrow><h2 className="font-display text-4xl font-bold tracking-[-.055em]">Useful things, written plainly.</h2></div><ButtonLink href="/blog" secondary testId="link-home-all-posts">Read all notes <ArrowRight size={15} /></ButtonLink></div><div className="mt-9 grid gap-6 md:grid-cols-3">{posts.slice(0, 3).map((post, i) => <PostCard key={post.slug} post={post} featured={i === 0} />)}</div></section>
    <section className="container-shell pb-24"><div className="relative overflow-hidden rounded-[1.6rem] bg-secondary p-8 md:p-12"><div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-accent/20" /><div className="relative max-w-2xl"><Eyebrow>A note for your inbox</Eyebrow><h2 className="font-display text-3xl font-bold tracking-[-.05em] md:text-4xl">One useful idea for placement prep, once a week.</h2><p className="mt-3 text-muted-foreground">No noise, no fake urgency. Just a better thing to read with your chai.</p><form onSubmit={submit} className="mt-6 flex max-w-md gap-2"><input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="Your college email or personal one" className="min-w-0 flex-1 rounded-full border bg-card px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" data-testid="input-home-newsletter" /><button className="btn rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground" disabled={subscribe.isPending} data-testid="button-home-newsletter">{sent ? <Check size={16} /> : 'Subscribe'}</button></form>{sent && <p className="mt-2 text-xs font-bold text-primary" data-testid="status-home-newsletter">Welcome in.</p>}</div></div></section>
  </div>;
}

function Value({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <div><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</div><h3 className="font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>; }
function QuickCard({ n, title, href }: { n: string; title: string; href: string }) { return <Link href={href} className="group rounded-2xl border border-primary-foreground/20 bg-primary-foreground/5 p-5 transition-colors hover:bg-primary-foreground/10" data-testid={`link-quick-${n}`}><span className="font-mono text-[10px] text-[#a8cec2]">{n}</span><p className="mt-7 font-display font-semibold">{title}</p><ArrowRight size={16} className="mt-5 transition-transform group-hover:translate-x-1" /></Link>; }
function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) { return <Link href={`/blog/${post.slug}`} className={`lift group overflow-hidden rounded-2xl border bg-card ${featured ? 'md:col-span-2 md:grid md:grid-cols-[1fr_1fr]' : ''}`} data-testid={`card-post-${post.slug}`}><div className={`overflow-hidden ${featured ? 'h-56 md:h-full' : 'h-48'}`}><img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="p-5"><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span className="text-primary">{post.category}</span><span>·</span><span>{post.readTime} min</span></div><h3 className={`mt-3 font-display font-bold leading-tight tracking-[-.03em] ${featured ? 'text-2xl' : 'text-lg'}`}>{post.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{post.excerpt}</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">Read note <ArrowRight size={14} /></span></div></Link>; }

function Resources() {
  const query = useListResources();
  const resources = query.data ?? fallbackResources;
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const categories = ['All', ...Array.from(new Set(resources.map(r => r.category)))];
  const filtered = resources.filter(r => (category === 'All' || r.category === category) && (level === 'All' || r.level === level));
  return <PageFrame eyebrow="The library" title="Useful, not overwhelming." intro="A focused shelf of explainers, worksheets, and tools for the moments placement prep gets fuzzy."><div className="flex flex-col gap-3 border-y py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-bold"><Filter size={16} className="text-primary" /> Filter by</div><div className="flex flex-wrap gap-2">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${category === c ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`} data-testid={`button-filter-${c.toLowerCase()}`}>{c}</button>)}<select value={level} onChange={e => setLevel(e.target.value)} className="rounded-full border bg-card px-3 py-1.5 text-xs font-bold outline-none" data-testid="select-resource-level"><option>All</option><option>Beginner</option><option>Intermediate</option><option>All levels</option></select></div></div><div className="mt-8 grid gap-4 md:grid-cols-2">{query.isLoading ? [1,2,3,4].map(i => <div key={i} className="skeleton h-52 rounded-2xl" />) : filtered.map(resource => <ResourceCard key={resource.id} resource={resource} />)}</div>{!query.isLoading && filtered.length === 0 && <Empty title="Nothing in this corner yet" text="Try widening the filters. The useful thing might be one click away." />}</PageFrame>;
}
function ResourceCard({ resource }: { resource: Resource }) { return <Link href={resource.href} className="lift group flex flex-col justify-between rounded-2xl border bg-card p-6" data-testid={`card-resource-${resource.id}`}><div><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-secondary px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-primary">{resource.category}</span><span className="text-xs text-muted-foreground">{resource.duration}</span></div><h3 className="mt-6 font-display text-xl font-bold tracking-[-.03em]">{resource.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{resource.description}</p></div><div className="mt-7 flex items-center justify-between text-xs font-bold"><span className="text-muted-foreground">{resource.level}</span><span className="inline-flex items-center gap-1 text-primary">Open resource <ArrowRight size={14} /></span></div></Link>; }

function Blog() {
  const query = useListPosts();
  const posts = query.data ?? fallbackPosts;
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...Array.from(new Set(posts.map(p => p.category)))];
  const filtered = posts.filter(p => (category === 'All' || p.category === category) && `${p.title} ${p.excerpt}`.toLowerCase().includes(search.toLowerCase()));
  const popularTags = Array.from(new Set(posts.flatMap(post => post.tags))).slice(0, 8);
  return <PageFrame eyebrow="Field notes" title="The things students wish someone had said sooner." intro="Short, useful essays about resumes, interviews, applications, and the odd emotional weather of placement season."><div className="grid gap-10 lg:grid-cols-[1fr_280px]"><div><div className="mb-7 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the notes" className="w-full rounded-xl border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary" data-testid="input-blog-search" /></div><select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border bg-card px-4 text-sm font-semibold outline-none" data-testid="select-blog-category">{categories.map(c => <option key={c}>{c}</option>)}</select></div><div className="grid gap-5 sm:grid-cols-2">{filtered.map(post => <PostCard key={post.slug} post={post} />)}</div>{filtered.length === 0 && <Empty title="No notes matched that search" text="Try a simpler phrase or browse every category." />}</div><aside className="h-fit rounded-2xl border bg-secondary/60 p-6"><Eyebrow>Good to know</Eyebrow><p className="font-display text-xl font-bold leading-tight">The best preparation is specific enough to start.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">Save the note that answers the question you have today. There will be another tomorrow.</p><div className="mt-8 border-t pt-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Recent notes</p><div className="mt-3 grid gap-3">{posts.slice(0, 3).map(post => <Link key={post.slug} href={`/blog/${post.slug}`} className="text-sm font-semibold leading-5 hover:text-primary">{post.title}</Link>)}</div></div><div className="mt-8 border-t pt-6"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Popular tags</p><div className="mt-3 flex flex-wrap gap-2">{popularTags.map(tag => <button key={tag} onClick={() => setSearch(tag)} className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">{tag}</button>)}</div></div><Link href="/tools" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-blog-sidebar-tools">Try a tool <ArrowRight size={14} /></Link></aside></div></PageFrame>;
}

function Article() {
  const { slug } = useParams<{ slug: string }>();
  const query = useGetPost(slug ?? '', { query: { enabled: Boolean(slug), queryKey: getGetPostQueryKey(slug ?? '') } });
  const allPosts = useListPosts();
  const post = query.data ?? fallbackPosts.find(p => p.slug === slug) ?? fallbackPosts[0];
  const related = (allPosts.data ?? fallbackPosts).filter(item => item.slug !== post.slug).slice(0, 2);
  const articleBody = post.content.includes('<') ? <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:tracking-[-.04em] prose-p:leading-8 prose-a:text-primary" dangerouslySetInnerHTML={{ __html: post.content }} /> : <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:tracking-[-.04em] prose-p:leading-8 prose-a:text-primary">{post.content.split(/\n\n+/).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>;
  const [copied, setCopied] = useState(false);
  const track = useTrackEvent();
  useEffect(() => {
    setPageMeta(`${post.title} — OfferKit`, `${post.excerpt} Read more practical placement preparation from OfferKit.`);
    track.mutate({ data: trackPayload('blog_read', post.slug) });
    sendGtag('blog_read', { slug: post.slug });
  }, [post.title, post.excerpt]);
  const copy = () => { navigator.clipboard?.writeText(window.location.href); setCopied(true); track.mutate({ data: trackPayload('share_click', 'copy_link') }); sendGtag('share_click', { method: 'copy_link', content_type: 'blog' }); setTimeout(() => setCopied(false), 1800); };
  return <article className="container-shell py-12 md:py-20"><div className="mx-auto max-w-4xl"><Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" data-testid="link-article-breadcrumb"><ChevronRight size={14} className="rotate-180" /> All field notes</Link><div className="mt-10 max-w-3xl"><Eyebrow>{post.category} · {post.readTime} min read</Eyebrow><h1 className="font-display text-[clamp(2.7rem,6vw,5.5rem)] font-bold leading-[.96] tracking-[-.075em]">{post.title}</h1><p className="mt-6 text-xl leading-8 text-muted-foreground">{post.excerpt}</p><div className="mt-7 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>·</span><span>{post.views.toLocaleString()} reads</span><button onClick={copy} className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-bold text-foreground hover:border-primary" data-testid="button-share-article"><Link2 size={13} /> {copied ? 'Link copied' : 'Share note'}</button></div></div><img src={post.image} alt={post.title} className="mt-12 h-[280px] w-full rounded-2xl object-cover md:h-[470px]" /><div className="mt-12 grid gap-12 md:grid-cols-[1fr_220px]"><div>{articleBody}</div><aside className="h-fit border-l pl-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Filed under</p><div className="mt-3 flex flex-wrap gap-2">{post.tags.map(tag => <span key={tag} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{tag}</span>)}</div><div className="mt-8"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Next step</p><Link href="/tools" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary" data-testid="link-article-tools">Check your readiness <ArrowRight size={14} /></Link></div></aside></div><section className="mt-16 border-t pt-10"><Eyebrow>Keep reading</Eyebrow><div className="grid gap-5 md:grid-cols-2">{related.map(item => <PostCard key={item.slug} post={item} />)}</div></section></div></article>;
}

function Tools() {
  const [tool, setTool] = useState<'quiz' | 'resume' | 'planner'>('quiz');
  return <PageFrame eyebrow="Practical tools" title="Make the next step visible." intro="Three small tools for the three questions that tend to follow you around: Am I ready? Is my resume saying enough? What should I do this month?"><div className="grid gap-4 border-b pb-4 md:grid-cols-3">{[['quiz', 'Readiness quiz', 'Find your starting point', <ClipboardCheck size={19} />], ['resume', 'Resume score', 'Make your work legible', <FileText size={19} />], ['planner', '30-day planner', 'Turn intent into rhythm', <CalendarDays size={19} />]].map(([id, title, desc, icon]) => <button key={id as string} onClick={() => setTool(id as 'quiz')} className={`rounded-2xl border p-5 text-left transition-all ${tool === id ? 'border-primary bg-primary text-primary-foreground shadow-lg' : 'bg-card hover:border-primary'}`} data-testid={`button-tool-${id}`}><span className="flex items-center justify-between">{icon}<ChevronRight size={16} /></span><p className="mt-7 font-display text-lg font-bold">{title}</p><p className={`mt-1 text-sm ${tool === id ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{desc}</p></button>)}</div><div className="mt-10">{tool === 'quiz' && <ReadinessQuiz />}{tool === 'resume' && <ResumeChecker />}{tool === 'planner' && <Planner />}</div></PageFrame>;
}
function ToolBox({ children, title, text }: { children: ReactNode; title: string; text: string }) { return <div className="mx-auto max-w-3xl rounded-3xl border bg-card p-6 shadow-[var(--shadow-soft)] md:p-10"><div className="mb-8"><h2 className="font-display text-3xl font-bold tracking-[-.05em]">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>{children}</div>; }
function ReadinessQuiz() {
  const questions = ['I can explain two projects without reading from my resume.', 'I have practiced at least five common DSA patterns.', 'I can talk through a bug or failure I learned from.', 'I know which roles and companies I am targeting.', 'I have done a timed mock interview recently.', 'I can explain a DBMS or operating systems concept in plain language.', 'I have a resume tailored to the kind of role I want.', 'I have completed at least one timed aptitude set this month.', 'I can ask thoughtful questions at the end of an interview.', 'I know what I will practise in my next preparation session.'];
  const [answers, setAnswers] = useState<number[]>(Array(5).fill(-1));
  const [result, setResult] = useState<{ score: number; level: string; nextSteps: string[] } | null>(null);
  const mutation = useSubmitQuizResult();
  const track = useTrackEvent();
  const finish = () => { const score = Math.round((answers.filter(a => a === 1).length / 10) * 100); const level = score > 75 ? 'Ready to sharpen' : score > 40 ? 'Building momentum' : 'A strong place to start'; mutation.mutate({ data: { visitorId: visitorId(), score, answers, level } }, { onSuccess: result => { setResult(result); track.mutate({ data: trackPayload('quiz_complete', level) }); sendGtag('quiz_complete', { score }); }, onError: () => setResult({ score, level, nextSteps: ['Pick one weak area and give it an honest hour today.', 'Write down a project story in your own words.'] }) }); };
  if (result) return <ToolBox title={`${result.score}% — ${result.level}`} text="You do not need to fix everything at once. Here is a good next move." ><div className="grid gap-3">{result.nextSteps.map((step, i) => <div key={step} className="flex gap-3 rounded-xl bg-secondary p-4 text-sm leading-6"><span className="font-mono text-xs text-primary">0{i + 1}</span>{step}</div>)}</div><button onClick={() => setResult(null)} className="mt-6 text-sm font-bold text-primary" data-testid="button-quiz-retry">Take it again</button></ToolBox>;
  return <ToolBox title="A two-minute reality check" text="Answer honestly. This is not a test you can fail — it is a useful place to begin."><div className="grid gap-4">{questions.map((question, i) => <div key={question} className="rounded-xl border p-4"><p className="text-sm font-semibold leading-6">{question}</p><div className="mt-3 flex gap-2">{['Not yet', 'Sometimes', 'Yes'].map((label, value) => <button key={label} onClick={() => setAnswers(a => a.map((x, index) => index === i ? value : x))} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${answers[i] === value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`} data-testid={`button-quiz-${i}-${value}`}>{label}</button>)}</div></div>)}</div><button onClick={finish} disabled={answers.includes(-1) || mutation.isPending} className="btn mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-quiz-submit">{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'See my starting point'} <ArrowRight size={15} /></button></ToolBox>;
}
function ResumeChecker() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ score: number; strengths: string[]; improvements: string[] } | null>(null);
  const mutation = useCheckResume();
  const track = useTrackEvent();
  const check = () => mutation.mutate({ data: { visitorId: visitorId(), resumeText: text } }, { onSuccess: result => { setResult(result); track.mutate({ data: trackPayload('resume_check', 'resume-score') }); sendGtag('resume_check', { score: result.score }); } });
  return <ToolBox title="Give your resume a useful first pass" text="Paste the text from your resume. We will look for evidence, clarity, and the details that help a recruiter keep reading."><textarea value={text} onChange={e => setText(e.target.value)} rows={10} placeholder="Paste resume text here..." className="w-full resize-y rounded-xl border bg-background p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-primary" data-testid="textarea-resume" />{result ? <div className="mt-6 grid gap-5 sm:grid-cols-[150px_1fr]"><div className="grid h-36 w-36 place-items-center rounded-full border-[10px] border-accent text-center"><div><strong className="font-display text-4xl">{result.score}</strong><span className="block font-mono text-[9px] uppercase">out of 100</span></div></div><div><h3 className="font-display text-lg font-bold">What is working</h3><ul className="mt-2 grid gap-2 text-sm text-muted-foreground">{result.strengths.map(s => <li key={s} className="flex gap-2"><Check size={15} className="mt-1 shrink-0 text-primary" />{s}</li>)}</ul><h3 className="mt-5 font-display text-lg font-bold">Worth improving</h3><ul className="mt-2 grid gap-2 text-sm text-muted-foreground">{result.improvements.map(s => <li key={s} className="flex gap-2"><ArrowRight size={15} className="mt-1 shrink-0 text-accent" />{s}</li>)}</ul></div></div> : <button onClick={check} disabled={text.length < 30 || mutation.isPending} className="btn mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50" data-testid="button-resume-check">{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Score my resume'} <ArrowRight size={15} /></button>}</ToolBox>;
}
function Planner() {
  const [role, setRole] = useState('Software engineer');
  const [weak, setWeak] = useState<string[]>([]);
  const [plan, setPlan] = useState<{ targetRole: string; days: { day: number; title: string; tasks: string[] }[] } | null>(null);
  const mutation = useGeneratePlanner();
  const track = useTrackEvent();
  const areas = ['DSA', 'Projects', 'Resume', 'Communication'];
  const generate = () => mutation.mutate({ data: { visitorId: visitorId(), targetRole: role, weakAreas: weak } }, { onSuccess: result => { setPlan(result); track.mutate({ data: trackPayload('planner_generate', role) }); sendGtag('planner_generate', { target_role: role }); } });
  return <ToolBox title="Build a month you can actually finish" text="Choose a role and up to three areas. Your plan will prioritize momentum over heroic schedules.">{plan ? <div><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-primary">Your plan for</p><h3 className="mt-1 font-display text-2xl font-bold">{plan.targetRole}</h3></div><button onClick={() => setPlan(null)} className="text-xs font-bold text-primary" data-testid="button-planner-reset">Edit inputs</button></div><div className="mt-7 grid gap-3 sm:grid-cols-2">{plan.days.map(day => <div key={day.day} className="rounded-xl border p-4"><div className="flex justify-between"><span className="font-mono text-xs text-accent">DAY {day.day}</span><Check size={16} className="text-primary" /></div><h4 className="mt-3 font-bold">{day.title}</h4><ul className="mt-2 grid gap-1 text-xs leading-5 text-muted-foreground">{day.tasks.map(task => <li key={task}>· {task}</li>)}</ul></div>)}</div></div> : <><label className="text-sm font-bold">Target role<select value={role} onChange={e => setRole(e.target.value)} className="mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm font-normal outline-none focus:ring-2 focus:ring-primary" data-testid="select-planner-role"><option>Software engineer</option><option>Data analyst</option><option>Product engineer</option><option>Frontend developer</option></select></label><p className="mt-7 text-sm font-bold">Where do you want more confidence?</p><div className="mt-3 flex flex-wrap gap-2">{areas.map(area => <button key={area} onClick={() => setWeak(a => a.includes(area) ? a.filter(x => x !== area) : a.length < 3 ? [...a, area] : a)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${weak.includes(area) ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary'}`} data-testid={`button-planner-area-${area.toLowerCase()}`}>{area}</button>)}</div><button onClick={generate} disabled={mutation.isPending} className="btn mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="button-planner-generate">{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Make my 30-day plan'} <ArrowRight size={15} /></button></>}</ToolBox>;
}

function About() { return <PageFrame eyebrow="Our story" title="A little more signal. A lot less noise." intro="OfferKit started with a simple observation: smart engineering students were spending too much time preparing for preparation, and too little time doing the next useful thing."><div className="grid gap-12 md:grid-cols-2 md:items-center"><div className="overflow-hidden rounded-3xl"><img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80" alt="Students collaborating in a bright study space" className="h-[400px] w-full object-cover" /></div><div><Eyebrow>Why we exist</Eyebrow><h2 className="font-display text-3xl font-bold leading-tight tracking-[-.05em]">Placement prep is practical work. It should have practical support.</h2><p className="mt-5 leading-8 text-muted-foreground">Not another list of companies. Not another dashboard that tells you to optimize yourself. OfferKit is a small, opinionated corner for getting better at the things that create options: clear communication, thoughtful projects, technical foundations, and showing up consistently.</p><p className="mt-5 leading-8 text-muted-foreground">We write for the student studying between labs, the person applying off-campus after dinner, and the friend who wants to help but does not know what to say.</p></div></div><div className="mt-20 grid gap-6 md:grid-cols-3"><Value icon={<Target />} title="Our mission" text="Make credible placement preparation accessible, specific, and less lonely." /><Value icon={<BookOpen />} title="Our vision" text="A campus culture where students share useful signal, not just referral codes." /><Value icon={<Users />} title="Our promise" text="We will always choose honest guidance over polished career theatre." /></div><div className="mt-20 border-l-4 border-accent pl-6 md:pl-10"><p className="font-display max-w-3xl text-3xl font-bold leading-tight tracking-[-.05em]">“The goal is not to become interview-proof. It is to become a little more ready for the next conversation.”</p><p className="mt-5 font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">— The OfferKit field note</p></div></PageFrame>; }

function Contact() { const mutation = useSubmitContact(); const track = useTrackEvent(); const [sent, setSent] = useState(false); const [error, setError] = useState(false); const [form, setForm] = useState({ name: '', email: '', message: '' }); const submit = (e: React.FormEvent) => { e.preventDefault(); setError(false); mutation.mutate({ data: form }, { onSuccess: () => { setSent(true); track.mutate({ data: trackPayload('contact_submit', 'contact-form') }); sendGtag('contact_submit'); }, onError: () => setError(true) }); }; return <PageFrame eyebrow="Say hello" title="A question, a correction, or a good idea?" intro="We read every note. If you are stuck on something specific, tell us where — it helps us make OfferKit more useful."><div className="grid gap-12 md:grid-cols-[.7fr_1.3fr]"><div className="rounded-2xl bg-primary p-7 text-primary-foreground"><MessageCircle size={24} /><h2 className="mt-12 font-display text-2xl font-bold">We are a small team. That is the point.</h2><p className="mt-4 text-sm leading-7 text-primary-foreground/75">Expect a thoughtful reply, not a ticket number. Usually within two working days.</p><div className="mt-10 grid gap-3 text-sm"><div className="flex items-center gap-3"><Mail size={16} /> hello@offerkit.in</div><div className="flex items-center gap-3"><GraduationCap size={16} /> Built around campus life</div></div></div>{sent ? <div className="grid place-items-center rounded-2xl border bg-card p-10 text-center"><div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-primary"><Check /></div><h2 className="mt-5 font-display text-2xl font-bold">Message received.</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Thanks for taking the time to write. We will get back to you soon.</p><button onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }); }} className="mt-7 text-sm font-bold text-primary" data-testid="button-contact-another">Send another note</button></div> : <form onSubmit={submit} className="grid gap-5 rounded-2xl border bg-card p-6 md:p-8"><label className="grid gap-2 text-sm font-bold">Name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-name" /></label><label className="grid gap-2 text-sm font-bold">Email<input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" data-testid="input-contact-email" /></label><label className="grid gap-2 text-sm font-bold">What is on your mind?<textarea required minLength={10} rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="resize-y rounded-xl border bg-background px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-primary" data-testid="textarea-contact-message" /></label>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm font-semibold text-destructive" data-testid="status-contact-error">That did not go through. Please try again.</p>}<button disabled={mutation.isPending} className="btn inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50" data-testid="button-contact-submit">{mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Send my note'} <Send size={15} /></button></form>}</div></PageFrame>; }

function Bootcamp() { return <div><section className="overflow-hidden bg-primary py-16 text-primary-foreground md:py-24"><div className="container-shell grid gap-12 md:grid-cols-[1fr_.85fr] md:items-center"><div><Eyebrow>OfferKit / focused practice</Eyebrow><h1 className="font-display max-w-2xl text-[clamp(3.2rem,7vw,6rem)] font-bold leading-[.92] tracking-[-.08em]">Thirty days to feel less lost.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-primary-foreground/75">A guided placement sprint for students who are done collecting tabs and ready to build a rhythm that shows up in interviews.</p><ButtonLink href="/tools" secondary testId="link-bootcamp-start">See your plan <ArrowRight size={16} /></ButtonLink></div><div className="relative rounded-3xl bg-[#d8e7dd] p-5 text-foreground"><div className="rounded-2xl bg-card p-6"><div className="flex items-center justify-between border-b pb-5"><span className="font-mono text-[10px] uppercase tracking-wider text-primary">The sprint</span><span className="rounded-full bg-secondary px-3 py-1 font-mono text-[10px]">30 days</span></div>{['Build your story', 'Practice the patterns', 'Ship your confidence'].map((x, i) => <div key={x} className="flex items-center gap-4 border-b py-5 last:border-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary font-mono text-xs text-primary-foreground">0{i + 1}</span><span className="font-display font-bold">{x}</span><Check size={16} className="ml-auto text-primary" /></div>)}</div></div></div></section><section className="container-shell py-20"><div className="grid gap-8 md:grid-cols-3"><Value icon={<Target />} title="Choose your target" text="Stop preparing for every job at once. Get clear about the role you are moving toward." /><Value icon={<Laptop />} title="Practice in public" text="Turn projects and problem-solving into stories a real interviewer can follow." /><Value icon={<TrendingUp />} title="Review the week" text="A simple feedback loop keeps the plan honest when campus life gets busy." /></div><div className="mt-20 flex flex-col justify-between gap-6 rounded-3xl bg-secondary p-8 md:flex-row md:items-center md:p-12"><div><Eyebrow>Ready when you are</Eyebrow><h2 className="font-display text-3xl font-bold tracking-[-.05em]">Your first day can be today.</h2><p className="mt-2 text-muted-foreground">Build a plan around your role and your actual weak spots.</p></div><ButtonLink href="/tools" testId="link-bootcamp-tools">Start the sprint <ArrowRight size={16} /></ButtonLink></div></section></div>; }

function AdminAnalytics() {
  const [password, setPassword] = useState('');
  const [authorized, setAuthorized] = useState(sessionStorage.getItem('offerkit-admin') === 'yes');
  const [range, setRange] = useState<7 | 30>(7);
  const [exporting, setExporting] = useState(false);
  const auth = useCreateAdminSession();
  const storedPassword = sessionStorage.getItem('offerkit-admin-password') ?? '';
  const analytics = useGetAnalytics({ range }, { query: { enabled: authorized, queryKey: getGetAnalyticsQueryKey({ range }) }, request: { headers: { 'x-admin-password': storedPassword } } });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    auth.mutate({ data: { password } }, { onSuccess: result => { if (result.authorized) { sessionStorage.setItem('offerkit-admin', 'yes'); sessionStorage.setItem('offerkit-admin-password', password); setAuthorized(true); } } });
  };
  const exportCsv = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/admin/analytics/export', { headers: { 'x-admin-password': sessionStorage.getItem('offerkit-admin-password') ?? '' } });
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'offerkit-analytics.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } finally {
      setExporting(false);
    }
  };
  if (!authorized) return <div className="container-shell grid min-h-[70vh] place-items-center py-16"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-[var(--shadow-soft)]"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck size={21} /></div><h1 className="mt-6 font-display text-2xl font-bold">Private dashboard</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">This view is for the OfferKit team. Enter the dashboard password to continue.</p><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-6 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary" placeholder="Dashboard password" data-testid="input-admin-password" />{auth.isError && <p className="mt-2 text-xs font-semibold text-destructive" data-testid="status-admin-error">That password was not accepted.</p>}<button disabled={auth.isPending} className="btn mt-4 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground" data-testid="button-admin-login">{auth.isPending ? 'Checking…' : 'Open analytics'}</button></form></div>;
  const data = analytics.data;
  return <div className="container-shell py-12"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><Eyebrow>First-party analytics</Eyebrow><h1 className="font-display text-4xl font-bold tracking-[-.06em]">What is helping?</h1></div><div className="flex flex-wrap gap-2"><button onClick={() => setRange(7)} className={`rounded-full border px-4 py-2 text-xs font-bold ${range === 7 ? 'bg-primary text-primary-foreground' : 'bg-card'}`} data-testid="button-analytics-7">7 days</button><button onClick={() => setRange(30)} className={`rounded-full border px-4 py-2 text-xs font-bold ${range === 30 ? 'bg-primary text-primary-foreground' : 'bg-card'}`} data-testid="button-analytics-30">30 days</button><button onClick={exportCsv} disabled={exporting} className="rounded-full border bg-card px-4 py-2 text-xs font-bold" data-testid="button-analytics-export">{exporting ? 'Preparing…' : 'Export CSV'}</button><button onClick={() => { sessionStorage.removeItem('offerkit-admin'); sessionStorage.removeItem('offerkit-admin-password'); setAuthorized(false); }} className="rounded-full border px-4 py-2 text-xs font-bold" data-testid="button-admin-logout">Log out</button></div></div>{analytics.isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div> : data ? <><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Visits', data.totalVisits, BarChart3], ['Unique visitors', data.uniqueVisitors, Users], ['Avg. session', `${data.averageSessionSeconds}s`, Clock3], ['Quiz completions', data.quizCompletions, ClipboardCheck]].map(([label, value, Icon]) => <div key={label as string} className="rounded-2xl border bg-card p-5"><Icon size={18} className="text-primary" /><p className="mt-5 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-3xl font-bold">{value as ReactNode}</p></div>)}</div><div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-2xl border bg-card p-6"><h2 className="font-display text-lg font-bold">Visits over time</h2><div className="mt-7 flex h-48 items-end gap-2 border-b border-l px-3 pb-0">{data.series.map(point => <div key={point.date} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="w-full rounded-t bg-primary/80 transition-all group-hover:bg-accent" style={{ height: `${Math.max(5, (point.visits / Math.max(...data.series.map(x => x.visits), 1)) * 100)}%` }} title={`${point.visits} visits`} /><span className="font-mono text-[8px] text-muted-foreground">{point.date.slice(5)}</span></div>)}</div></div><div className="rounded-2xl border bg-card p-6"><h2 className="font-display text-lg font-bold">Top pages</h2><div className="mt-5 grid gap-4">{data.topPages.slice(0, 5).map(page => <div key={page.label}><div className="flex justify-between text-xs"><span>{page.label}</span><strong>{page.value}</strong></div><div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, page.value / Math.max(data.topPages[0]?.value ?? 1, 1) * 100)}%` }} /></div></div>)}</div></div></div></> : <Empty title="No analytics yet" text="Once visitors arrive, the useful patterns will show up here." />}</div>;
}

function PageFrame({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) { return <div className="container-shell py-14 md:py-20"><div className="max-w-3xl"><Eyebrow>{eyebrow}</Eyebrow><h1 className="font-display text-[clamp(2.8rem,6vw,5rem)] font-bold leading-[.96] tracking-[-.075em]">{title}</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p></div><div className="mt-14">{children}</div></div>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-2xl border border-dashed p-10 text-center"><p className="font-display text-xl font-bold">{title}</p><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>; }

function Router() { const [location] = useLocation(); return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/resources" component={Resources} /><Route path="/blog" component={Blog} /><Route path="/blog/:slug" component={Article} /><Route path="/tools" component={Tools} /><Route path="/about" component={About} /><Route path="/contact" component={Contact} /><Route path="/prep-bootcamp" component={Bootcamp} /><Route path="/admin/analytics" component={AdminAnalytics} /><Route component={NotFound} /></Switch></ErrorBoundary>; }
function App() { return <QueryClientProvider client={queryClient}><TooltipProvider><AnalyticsScript /><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Router /></Shell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>; }
export default App;