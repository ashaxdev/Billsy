"use client";

import { useState } from "react";
import BarcodeCanvas from "@/components/BarcodeCanvas";
import { formatINR } from "@/lib/utils";

interface LabelProduct {
  _id: string;
  name: string;
  price: number;
  barcode: string;
}

export default function PrintLabelsModal({
  products,
  onClose,
}: {
  products: LabelProduct[];
  onClose: () => void;
}) {
  const [copiesPerProduct, setCopiesPerProduct] = useState("1");
  const copies = Math.max(1, parseInt(copiesPerProduct) || 1);
  const labels = products.flatMap((p) => Array.from({ length: copies }, () => p));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">
            Print labels ({products.length} product{products.length !== 1 ? "s" : ""})
          </h2>
          <p className="text-xs text-slate">Barcode, name and price on each label.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-ink-2">
            Copies each
            <input
              type="number"
              min="1"
              value={copiesPerProduct}
              onChange={(e) => setCopiesPerProduct(e.target.value)}
              className="w-16 rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink"
            />
          </label>
          <button
            onClick={() => window.print()}
            disabled={products.length === 0}
            className="rounded-full bg-signal px-4 py-2 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-paper-2"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-paper-2 p-6">
        {products.length === 0 ? (
          <p className="text-center text-sm text-slate">No products selected.</p>
        ) : (
          <div className="print-area mx-auto grid max-w-4xl grid-cols-3 gap-3 rounded-xl bg-white p-4">
            {labels.map((p, i) => (
              <div
                key={`${p._id}-${i}`}
                className="flex flex-col items-center rounded-lg border border-line px-2 py-3 text-center"
                style={{ breakInside: "avoid" }}
              >
                <p className="w-full truncate text-[11px] font-semibold text-ink">{p.name}</p>
                <BarcodeCanvas value={p.barcode} height={38} width={1.3} fontSize={9} />
                <p className="font-data text-xs font-bold text-ink">{formatINR(p.price)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid !important;
            grid-template-columns: repeat(3, 1fr);
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}