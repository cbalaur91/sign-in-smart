import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background mesh gradient */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-neon-cyan/8 blur-[120px] animate-glow-pulse" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-neon-purple/8 blur-[120px] animate-glow-pulse [animation-delay:1.5s]" />
        <div className="absolute -bottom-1/4 left-1/3 h-[400px] w-[400px] rounded-full bg-primary/6 blur-[120px] animate-glow-pulse [animation-delay:3s]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
              <span className="text-sm font-bold text-neon-cyan font-mono">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight font-[family-name:var(--font-display)]">
              SignIn<span className="text-neon-cyan">Smart</span>
            </span>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-foreground px-5 py-2 text-sm font-medium text-background transition-all hover:bg-foreground/90 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up">
            <span className="inline-block rounded-full border border-neon-cyan/20 bg-neon-cyan/5 px-4 py-1.5 font-mono text-xs font-medium uppercase tracking-widest text-neon-cyan">
              Real Estate Tech
            </span>
          </div>

          <h1 className="mt-8 font-[family-name:var(--font-display)] text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl animate-fade-up [animation-delay:0.1s]">
            Every visitor.{" "}
            <span className="bg-gradient-to-r from-neon-cyan via-primary to-neon-purple bg-clip-text text-transparent">
              Every lead.
            </span>
            <br />
            Captured instantly.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground animate-fade-up [animation-delay:0.2s]">
            The open house management platform that turns walk-ins into warm leads.
            QR sign-in, real-time visitor tracking, and instant follow-up — all on autopilot.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-up [animation-delay:0.3s]">
            <Link
              href="/login"
              className="group relative inline-flex items-center gap-2 rounded-xl bg-neon-cyan px-8 py-3.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              Get Started Free
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-sm font-medium text-muted-foreground transition-all hover:border-muted-foreground/50 hover:text-foreground hover:-translate-y-0.5"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Terminal preview */}
        <div className="mx-auto mt-20 max-w-2xl animate-fade-up [animation-delay:0.5s]">
          <div className="rounded-xl border border-border/60 bg-card/80 p-1 shadow-2xl shadow-neon-cyan/5 backdrop-blur-sm">
            <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-destructive/60" />
              <div className="h-3 w-3 rounded-full bg-neon-amber/60" />
              <div className="h-3 w-3 rounded-full bg-neon-lime/60" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">signinsmart.com/dashboard</span>
            </div>
            <div className="space-y-3 px-5 py-5 font-mono text-sm">
              <div className="flex items-center gap-3">
                <span className="text-neon-cyan">$</span>
                <span className="text-muted-foreground">today&apos;s open house</span>
                <span className="ml-auto rounded-full bg-neon-lime/10 px-2 py-0.5 text-xs text-neon-lime">LIVE</span>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed">
                <div className="flex justify-between">
                  <span className="text-foreground">123 Oak Street, Austin TX</span>
                  <span className="text-neon-amber">24 visitors</span>
                </div>
                <div className="mt-2 flex gap-4 text-muted-foreground">
                  <span>14 buyers</span>
                  <span>6 neighbors</span>
                  <span>4 investors</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon-purple">+</span>
                <span className="text-foreground/80">New sign-in:</span>
                <span className="text-foreground">Sarah Chen</span>
                <span className="text-muted-foreground">— buyer</span>
                <span className="ml-auto text-xs text-muted-foreground">just now</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-neon-purple">+</span>
                <span className="text-foreground/80">New sign-in:</span>
                <span className="text-foreground">Mike Torres</span>
                <span className="text-muted-foreground">— investor</span>
                <span className="ml-auto text-xs text-muted-foreground">2m ago</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative border-t border-border/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center">
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-neon-purple">Features</span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need at the door
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<QrIcon />}
              color="cyan"
              title="QR Code Sign-In"
              description="Generate unique QR codes for each event. Visitors scan, sign in, done. No paper forms."
            />
            <FeatureCard
              icon={<UsersIcon />}
              color="purple"
              title="Visitor Tracking"
              description="See every sign-in in real time. Segment by buyer, neighbor, investor — know your audience."
            />
            <FeatureCard
              icon={<ChartIcon />}
              color="amber"
              title="Live Analytics"
              description="Track page views, sign-in rates, and engagement. Know what's working before the open house ends."
            />
            <FeatureCard
              icon={<GlobeIcon />}
              color="lime"
              title="Property Pages"
              description="Beautiful micro-pages for each listing. Share the link, embed it, or print the QR."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative border-t border-border/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="text-center">
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-neon-amber">Pricing</span>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-muted-foreground">No subscriptions. No hidden fees. Pay per open house.</p>
          </div>

          <div className="mx-auto mt-12 max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-neon-cyan/20 bg-card/60 p-8 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-neon-cyan/10 blur-[50px]" />

              <div className="relative">
                <div className="inline-block rounded-full bg-neon-lime/10 px-3 py-1 text-xs font-semibold text-neon-lime">
                  First open house free
                </div>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-bold text-neon-cyan">$9.99</span>
                  <span className="text-muted-foreground">/ open house</span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">
                  After your free open house, each additional event is a one-time payment.
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    "Unlimited visitor sign-ins",
                    "Real-time analytics dashboard",
                    "QR code & shareable property page",
                    "CSV export of all leads",
                    "Peak hours & visitor segmentation",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <svg className="h-4 w-4 shrink-0 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-neon-cyan px-8 py-3.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                >
                  Start Free
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-border/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid gap-8 sm:grid-cols-3">
            <StatBlock value="100%" label="Lead capture rate" accent="cyan" />
            <StatBlock value="< 5s" label="Average sign-in time" accent="purple" />
            <StatBlock value="0" label="Paper forms needed" accent="lime" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-12 text-center backdrop-blur-sm">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-neon-cyan/10 blur-[60px]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-neon-purple/10 blur-[60px]" />
            <h2 className="relative font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight md:text-4xl">
              Ready to capture every lead?
            </h2>
            <p className="relative mt-4 text-muted-foreground">
              Set up your first open house in under 2 minutes. Free to start.
            </p>
            <Link
              href="/login"
              className="group relative mt-8 inline-flex items-center gap-2 rounded-xl bg-neon-cyan px-8 py-3.5 text-sm font-semibold text-background transition-all hover:-translate-y-0.5 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]"
            >
              Get Started Free
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <span className="font-mono text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} SignInSmart
          </span>
          <span className="font-mono text-xs text-muted-foreground/50">
            Built for agents, by agents.
          </span>
        </div>
      </footer>
    </div>
  );
}

/* ── Feature Card ── */

const colorMap = {
  cyan: { border: "border-neon-cyan/20", bg: "bg-neon-cyan/5", text: "text-neon-cyan", glow: "group-hover:shadow-neon-cyan/5" },
  purple: { border: "border-neon-purple/20", bg: "bg-neon-purple/5", text: "text-neon-purple", glow: "group-hover:shadow-neon-purple/5" },
  amber: { border: "border-neon-amber/20", bg: "bg-neon-amber/5", text: "text-neon-amber", glow: "group-hover:shadow-neon-amber/5" },
  lime: { border: "border-neon-lime/20", bg: "bg-neon-lime/5", text: "text-neon-lime", glow: "group-hover:shadow-neon-lime/5" },
} as const;

function FeatureCard({
  icon,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  color: keyof typeof colorMap;
  title: string;
  description: string;
}) {
  const c = colorMap[color];
  return (
    <div className={`group relative rounded-xl border ${c.border} bg-card/40 p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${c.glow} hover:border-opacity-40`}>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-display)] text-base font-semibold">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className={`mt-4 h-0.5 w-8 rounded-full ${c.bg} transition-all group-hover:w-12`} />
    </div>
  );
}

/* ── Stat Block ── */

function StatBlock({ value, label, accent }: { value: string; label: string; accent: keyof typeof colorMap }) {
  const c = colorMap[accent];
  return (
    <div className="text-center">
      <div className={`font-[family-name:var(--font-display)] text-5xl font-bold ${c.text} md:text-6xl`}>
        {value}
      </div>
      <div className="mt-2 font-mono text-sm uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* ── Icons ── */

function QrIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}
