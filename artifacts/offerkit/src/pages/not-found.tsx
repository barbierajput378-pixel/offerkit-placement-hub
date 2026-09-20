import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="container-shell grid min-h-[72vh] place-items-center py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-primary">
          <Compass size={28} />
        </div>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[.2em] text-accent">Wrong turn</p>
        <h1 className="mt-3 font-display text-5xl font-bold tracking-[-.07em]">This page took a different route.</h1>
        <p className="mt-5 text-muted-foreground">The link may have moved, or it was never part of the plan. Let us get you back to something useful.</p>
        <Link href="/" className="btn mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground" data-testid="link-not-found-home">
          <ArrowLeft size={15} /> Back to OfferKit
        </Link>
      </div>
    </div>
  );
}