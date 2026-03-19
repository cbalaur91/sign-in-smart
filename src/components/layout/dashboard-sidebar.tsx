"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "◻" },
  { href: "/events", label: "Events", icon: "🏠" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

function SidebarContent({
  agentName,
  agentEmail,
  pathname,
  onSignOut,
}: {
  agentName: string;
  agentEmail: string;
  pathname: string;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="border-b border-border px-6 py-5">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight">
          SignIn<span className="text-neon-cyan">Smart</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{agentName}</p>
          <p className="text-xs text-muted-foreground truncate">{agentEmail}</p>
        </div>
        <button
          onClick={onSignOut}
          className="w-full rounded-md border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );
}

export function DashboardSidebar({
  agentName,
  agentEmail,
}: {
  agentName: string;
  agentEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-card text-foreground md:hidden"
        aria-label="Open navigation"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {/* Mobile overlay sidebar */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "visible" : "invisible"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        {/* Sidebar drawer */}
        <aside
          className={`absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <SidebarContent
            agentName={agentName}
            agentEmail={agentEmail}
            pathname={pathname}
            onSignOut={handleSignOut}
          />
        </aside>
      </div>

      {/* Desktop static sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <SidebarContent
          agentName={agentName}
          agentEmail={agentEmail}
          pathname={pathname}
          onSignOut={handleSignOut}
        />
      </aside>
    </>
  );
}
