"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DiscountType = "percent" | "flat";

export default function SettingsPage() {
  const [taxPercent, setTaxPercent] = useState("0");
  const [discountType, setDiscountType] = useState<DiscountType>("percent");
  const [discountValue, setDiscountValue] = useState("0");
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok) {
        setTaxPercent(String(data.defaultTaxPercent ?? 0));
        setDiscountType((data.defaultDiscountType as DiscountType) ?? "percent");
        setDiscountValue(String(data.defaultDiscountValue ?? 0));
        setFssaiNumber(data.fssaiNumber ?? "");
      }
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const tax = parseFloat(taxPercent);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      toast.error("Enter a valid tax percentage between 0 and 100.");
      return;
    }

    const discount = parseFloat(discountValue);
    if (isNaN(discount) || discount < 0 || (discountType === "percent" && discount > 100)) {
      toast.error("Enter a valid discount value.");
      return;
    }

    const trimmedFssai = fssaiNumber.trim();
    if (trimmedFssai && !/^\d{14}$/.test(trimmedFssai)) {
      toast.error("FSSAI number should be exactly 14 digits.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultTaxPercent: tax,
          defaultDiscountType: discountType,
          defaultDiscountValue: discount,
          fssaiNumber: trimmedFssai,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Settings saved — they'll auto-fill on new bills.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
      <p className="mt-1 text-sm text-ink-2">
        Defaults applied to every new bill and shown on your receipts.
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-slate">Loading…</p>
      ) : (
        <form onSubmit={handleSave} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-line bg-white p-5">
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
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              Default bill discount
            </label>
            <div className="flex gap-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                className="rounded-lg border border-line bg-white px-2 py-2.5 text-sm outline-none focus:border-ink"
              >
                <option value="percent">%</option>
                <option value="flat">₹</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
            </div>
            <p className="mt-2 text-xs text-slate">
              Applied automatically to new bills — still editable per bill.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              FSSAI license number
            </label>
            <input
              value={fssaiNumber}
              onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))}
              placeholder="14-digit FSSAI number"
              inputMode="numeric"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
            <p className="mt-2 text-xs text-slate">
              Shown on every receipt. Leave blank to hide it.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </div>
  );
}