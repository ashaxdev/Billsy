"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface QuickAddResult {
  _id: string;
  name: string;
  price: number;
  barcode: string;
  stock: number;
}

export default function QuickAddProductModal({
  barcode,
  onClose,
  onCreated,
}: {
  barcode: string;
  onClose: () => void;
  onCreated: (product: QuickAddResult) => void;
}) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [lookupFound, setLookupFound] = useState(false);
  const [saving, setSaving] = useState(false);

  // Try external barcode lookup once, on open, to prefill details
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
        const data = await res.json();
        if (!cancelled && data.status === 1 && data.product) {
          setName(data.product.product_name || "");
          setBrand(data.product.brands || "");
          setImageUrl(data.product.image_front_small_url || undefined);
          setLookupFound(true);
        }
      } catch {
        // external lookup is best-effort only — ignore failures
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [barcode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Name and price are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand ? `${name} (${brand})` : name,
          price: parseFloat(price),
          stock: stock ? parseInt(stock) : 0,
          imageUrl,
          barcode, // reuse the scanned barcode instead of generating a new one
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Product saved — added to bill");
      onCreated(data.product);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-6 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">New barcode scanned</h2>
          <button onClick={onClose} className="text-sm text-slate hover:text-ink">
            Close
          </button>
        </div>

        <p className="font-data mt-1 text-xs text-slate">{barcode}</p>

        {lookupLoading ? (
          <p className="mt-3 text-xs text-slate">Checking product databases…</p>
        ) : lookupFound ? (
          <p className="mt-3 text-xs text-signal">Found a match — details prefilled below, review and save.</p>
        ) : (
          <p className="mt-3 text-xs text-slate">Not found anywhere — enter the details once, it'll scan instantly next time.</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {imageUrl && (
            <div className="h-16 w-16 overflow-hidden rounded-lg bg-paper-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              Product name
            </label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              placeholder="Amul Milk 500ml"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
                Price (₹)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                placeholder="32.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                placeholder="20"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & add to bill"}
          </button>
        </form>
      </div>
    </div>
  );
}