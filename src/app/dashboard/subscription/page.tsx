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

export default function SubscriptionPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const plan = (session?.user as { plan?: string })?.plan || "free";

  useEffect(() => {
    // refresh session on mount so plan status reflects latest DB state after redirects
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const orderRes = await fetch("/api/subscription/create-order", { method: "POST" });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Billsy Pro",
        description: "Monthly subscription — unlimited products",
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

  return (
    <div className="mx-auto max-w-2xl">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <h1 className="font-display text-2xl font-bold text-ink">Your plan</h1>
      <p className="mt-1 text-sm text-ink-2">
        You&rsquo;re currently on the <strong className="capitalize">{plan}</strong> plan.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="receipt-edge-top receipt-edge-bottom border border-line bg-white p-6">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate">
            Free
          </p>
          <p className="font-display mt-2 text-3xl font-bold text-ink">₹0</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-2">
            <li>Up to 30 products</li>
            <li>Unlimited billing &amp; receipts</li>
            <li>WhatsApp receipt sharing</li>
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
          <p className="font-display mt-2 text-3xl font-bold">₹499/mo</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/85">
            <li>Unlimited products</li>
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
              {loading ? "Starting checkout…" : "Upgrade to Pro"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
