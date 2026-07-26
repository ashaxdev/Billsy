"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

interface SubscriptionStatus {
  tier: string;
  planActive: boolean;
  inTrial: boolean;
  daysLeftInTrial: number;
  blocked: boolean;
  trialEndsAt: string;
  planExpiresAt: string | null;
}

export default function TrialGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/subscription/status");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setStatus(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-check every time the route changes (e.g. right after returning from checkout)
  }, [pathname]);

  // While we're still checking, render normally rather than flashing a gate.
  if (loading || !status) return <>{children}</>;

  const isSubscriptionPage = pathname === "/dashboard/subscription";
  const showHardGate = status.blocked && !isSubscriptionPage;

  return (
    <>
      {status.inTrial && !bannerDismissed && (
        <div className="flex items-center justify-between gap-3 border-b border-line bg-amber-light px-4 py-2 text-sm text-ink">
          <span>
            {status.daysLeftInTrial > 0
              ? `${status.daysLeftInTrial} day${status.daysLeftInTrial === 1 ? "" : "s"} left in your free trial.`
              : "Your free trial ends today."}{" "}
            <a href="/dashboard/subscription" className="font-semibold underline underline-offset-2">
              Upgrade to Pro
            </a>{" "}
            to keep billing without interruption.
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 text-xs text-ink-2 hover:text-ink"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      <div className={showHardGate ? "pointer-events-none select-none blur-sm" : ""}>{children}</div>

      {showHardGate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 px-4 backdrop-blur-sm">
          <div className="receipt-edge-top receipt-edge-bottom w-full max-w-sm bg-white p-7 text-center shadow-2xl">
            <p className="font-data text-xs uppercase tracking-wide text-signal">Trial ended</p>
            <h2 className="font-display mt-2 text-xl font-bold text-ink">
              Your free trial has ended
            </h2>
            <p className="mt-2 text-sm text-ink-2">
              Subscribe to Billsy Pro to keep billing, printing and sharing receipts. Your products
              and past receipts are safe and waiting for you.
            </p>
            <button
              onClick={() => router.push("/dashboard/subscription")}
              className="mt-6 w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90"
            >
              Subscribe now
            </button>
          </div>
        </div>
      )}
    </>
  );
}