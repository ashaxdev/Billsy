"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

type BillingCycle = "monthly" | "yearly";

type SubscriptionStatus = {
  plan: "free" | "pro";
  cycle: BillingCycle | null;
  trialEndsAt: string;
  daysLeft: number;
  trialActive: boolean;
  trialExpired: boolean;
};

export default function SubscriptionPage() {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetch("/api/subscription/status")
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => toast.error("Couldn't load your plan status"))
      .finally(() => setStatusLoading(false));
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycle }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Billsy Pro",
        description:
          cycle === "yearly"
            ? "Yearly subscription — unlimited products"
            : "Monthly subscription — unlimited products",
        order_id: orderData.order.id,
        theme: { color: "#16202b" },
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok) {
            toast.success("You're on Billsy Pro now!");
            await update();
            setStatus((s) => (s ? { ...s, plan: "pro" } : s));
          } else {
            toast.error(verifyData.error || "Verification failed");
          }
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setLoading(false);
    }
  }

  const plan = status?.plan ?? "free";

  return (
    <div className="mx-auto max-w-2xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="font-display text-2xl font-bold text-ink">Your plan</h1>
      <p className="mt-1 text-sm text-ink-2">
        You&rsquo;re currently on the <strong className="capitalize">{plan}</strong> plan.
      </p>

      {!statusLoading && status && status.plan === "free" && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm ${
            status.trialExpired
              ? "border-danger/30 bg-danger/5 text-danger"
              : "border-amber/30 bg-amber/10 text-ink-2"
          }`}
        >
          {status.trialExpired ? (
            <>Your free trial has ended. Upgrade to Pro to keep billing without interruption.</>
          ) : (
            <>
              You have <strong>{status.daysLeft}</strong> day
              {status.daysLeft === 1 ? "" : "s"} left in your free trial (ends{" "}
              {new Date(status.trialEndsAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
              ).
            </>
          )}
        </div>
      )}

      {plan !== "pro" && (
        <div className="mt-6 inline-flex rounded-full border border-line bg-paper-2 p-1">
          <button
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cycle === "monthly" ? "bg-white text-ink shadow-sm" : "text-ink-2"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle("yearly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              cycle === "yearly" ? "bg-white text-ink shadow-sm" : "text-ink-2"
            }`}
          >
            Yearly
            <span className="ml-1.5 rounded-full bg-signal px-1.5 py-0.5 text-[10px] font-semibold text-paper">
              Save 17%
            </span>
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="receipt-edge-top receipt-edge-bottom border border-line bg-white p-6">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate">
            Free
          </p>
          <p className="font-display mt-2 text-3xl font-bold text-ink">₹0</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li>Up to 30 products</li>
            <li>Unlimited billing &amp; receipts</li>
            <li>Print &amp; WhatsApp receipt sharing</li>
          </ul>
          {plan === "free" && (
            <p className="font-data mt-5 text-xs uppercase tracking-wide text-signal">
              Current plan
            </p>
          )}
        </div>

        <div className="receipt-edge-top receipt-edge-bottom border border-ink bg-ink p-6 text-paper">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
            Pro
          </p>
          <p className="font-display mt-2 text-3xl font-bold">
            {cycle === "yearly" ? "₹5,000/yr" : "₹499/mo"}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-paper/85">
            <li>Unlimited products</li>
            <li>Print &amp; WhatsApp receipts</li>
            <li>Priority support</li>
            <li>Everything in Free</li>
          </ul>
          {plan === "pro" ? (
            <p className="font-data mt-5 text-xs uppercase tracking-wide text-amber">
              Current plan
            </p>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="mt-5 w-full rounded-full bg-amber py-2.5 text-sm font-semibold text-ink hover:opacity-90 disabled:opacity-60"
            >
              {loading
                ? "Starting checkout…"
                : `Upgrade to Pro — ${cycle === "yearly" ? "₹5,000/yr" : "₹499/mo"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}