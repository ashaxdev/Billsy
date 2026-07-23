"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [taxPercent, setTaxPercent] = useState("0");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) setTaxPercent(String(data.defaultTaxPercent ?? 0));
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(taxPercent);
    if (isNaN(value) || value < 0 || value > 100) {
      toast.error("Enter a valid tax percentage between 0 and 100.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultTaxPercent: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Default tax saved — it'll auto-fill on new bills.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-2">Set a default tax rate applied to every new bill.</p>

      {loading ? (
        <p className="mt-6 text-sm text-slate">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-6 rounded-2xl border border-line bg-white p-5">
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
            Default tax %
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxPercent}
              onChange={(e) => setTaxPercent(e.target.value)}
              className="w-32 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
            <span className="text-sm text-ink-2">%</span>
          </div>
          <p className="mt-2 text-xs text-slate">
            This is just a starting point — you can still edit the tax on any individual bill.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="mt-4 w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}