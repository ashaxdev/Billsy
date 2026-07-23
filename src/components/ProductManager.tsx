"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import BarcodeCanvas from "@/components/BarcodeCanvas";
import { formatINR } from "@/lib/utils";

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  barcode: string;
}

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async (q?: string) => {
    setLoading(true);
    const res = await fetch(`/api/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const data = await res.json();
    if (res.ok) setProducts(data.products);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Product removed");
      setProducts((p) => p.filter((x) => x._id !== id));
    } else {
      toast.error("Could not remove product");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-2">
            Every product gets its own barcode automatically.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper hover:bg-ink-2"
        >
          + Add product
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or barcode…"
        className="mt-5 w-full max-w-sm rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
      />

      {loading ? (
        <p className="mt-8 text-sm text-slate">Loading products…</p>
      ) : products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-sm text-slate">
            No products yet. Add your first product to generate its barcode.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p._id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-paper-2">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-ink">{p.name}</p>
                  <p className="font-data text-sm text-signal">{formatINR(p.price)}</p>
                  <p className="text-xs text-slate">Stock: {p.stock}</p>
                </div>
                <button
                  onClick={() => handleDelete(p._id)}
                  className="h-fit shrink-0 rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
              <div className="mt-3 flex flex-col items-center rounded-lg bg-paper-2/60 py-2">
                <BarcodeCanvas value={p.barcode} height={40} width={1.5} fontSize={10} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormModal
          onClose={() => setShowForm(false)}
          onCreated={(product) => {
            setProducts((p) => [product, ...p]);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function handleFile(file: File | null) {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !price) {
      toast.error("Name and price are required.");
      return;
    }
    setSaving(true);

    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;

    try {
      if (imagePreview) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: imagePreview }),
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        imageUrl = uploadData.url;
        imagePublicId = uploadData.publicId;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          stock: stock ? parseInt(stock) : 0,
          category: category || undefined,
          imageUrl,
          imagePublicId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Product added with a new barcode");
      onCreated(data.product);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-paper p-6 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">Add product</h2>
          <button onClick={onClose} className="text-sm text-slate hover:text-ink">
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              Photo
            </label>
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-lg bg-paper-2">
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              Product name
            </label>
            <input
              required
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
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
              Category (optional)
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              placeholder="Dairy"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save product & generate barcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
