"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/billing", label: "Bill now" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Receipts" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/subscription", label: "Plan" },
];

type SubscriptionStatus = {
  plan: "free" | "pro";
  daysLeft: number;
  trialActive: boolean;
  trialExpired: boolean;
};

export default function DashboardNav({
  businessName,
}: {
  businessName: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStatus(data);
      })
      .catch(() => {
        // fail silently — nav should never break if this call fails
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const trialBadge = status && status.plan === "free" && (
    <Link
      href="/dashboard/subscription"
      className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:inline ${
        status.trialExpired
          ? "bg-danger/10 text-danger"
          : "bg-amber/15 text-ink-2"
      }`}
    >
      {status.trialExpired
        ? "Trial ended — upgrade to continue"
        : `${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"} left in trial`}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-display text-base font-bold text-ink">
            Billsy
          </Link>
          <span className="hidden text-sm text-slate sm:inline">/ {businessName}</span>
          {trialBadge}
        </div>

        <button
          className="rounded-md border border-line px-3 py-1.5 text-sm sm:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                pathname === l.href
                  ? "bg-ink text-paper"
                  : "text-ink-2 hover:bg-paper-2"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="ml-2 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-ink-2 hover:bg-paper-2"
          >
            Log out
          </button>
        </nav>
      </div>

      {status?.plan === "free" && (
        <div
          className={`px-4 py-1.5 text-center text-xs font-medium sm:hidden ${
            status.trialExpired ? "bg-danger/10 text-danger" : "bg-amber/15 text-ink-2"
          }`}
        >
          {status.trialExpired
            ? "Trial ended — upgrade to continue"
            : `${status.daysLeft} day${status.daysLeft === 1 ? "" : "s"} left in trial`}
        </div>
      )}

      {open && (
        <nav className="flex flex-col gap-1 border-t border-line px-4 py-3 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === l.href ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg px-3 py-2 text-left text-sm font-medium text-danger"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}