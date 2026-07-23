"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/billing", label: "Bill now" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/orders", label: "Receipts" },
  { href: "/dashboard/subscription", label: "Plan" },
];

export default function DashboardNav({
  businessName,
  plan,
}: {
  businessName: string;
  plan: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-display text-base font-bold text-ink">
            Billsy
          </Link>
          <span className="hidden text-sm text-slate sm:inline">/ {businessName}</span>
          <span
            className={`font-data rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              plan === "pro" ? "bg-amber-light text-amber" : "bg-paper-2 text-slate"
            }`}
          >
            {plan}
          </span>
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
