"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Welcome back!");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="you@shop.com"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-paper transition hover:bg-ink-2 disabled:opacity-60"
      >
        {loading ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display block text-center text-lg font-bold text-ink">
          Billsy
        </Link>
        <div className="receipt-edge-top receipt-edge-bottom mt-6 border border-line bg-white p-7">
          <h1 className="font-display text-xl font-bold text-ink">Log in</h1>
          <p className="mt-1 text-sm text-ink-2">Welcome back to your billing counter.</p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-ink-2">
          New to Billsy?{" "}
          <Link href="/register" className="font-medium text-ink underline underline-offset-4">
            Create a business account
          </Link>
        </p>
      </div>
    </div>
  );
}
