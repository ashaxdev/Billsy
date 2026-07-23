"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Could not create account.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    if (signInRes?.error) {
      toast.success("Account created — please log in.");
      router.push("/login");
      return;
    }

    toast.success("Business account created!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display block text-center text-lg font-bold text-ink">
          Billsy
        </Link>
        <div className="receipt-edge-top receipt-edge-bottom mt-6 border border-line bg-white p-7">
          <h1 className="font-display text-xl font-bold text-ink">Create your business</h1>
          <p className="mt-1 text-sm text-ink-2">
            Free forever for up to 30 products.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Business name">
              <input
                required
                value={form.businessName}
                onChange={(e) => update("businessName", e.target.value)}
                className="input"
                placeholder="Meena General Store"
              />
            </Field>
            <Field label="Your name">
              <input
                required
                value={form.ownerName}
                onChange={(e) => update("ownerName", e.target.value)}
                className="input"
                placeholder="Meena Kumari"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="input"
                placeholder="you@shop.com"
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="input"
                placeholder="98765 43210"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input"
                placeholder="At least 6 characters"
              />
            </Field>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create business account"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-ink-2">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-line);
          background: white;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-ink);
          outline: none;
        }
        .input:focus {
          border-color: var(--color-ink);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
        {label}
      </label>
      {children}
    </div>
  );
}
