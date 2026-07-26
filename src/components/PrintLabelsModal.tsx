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

type LabelSize = "small" | "medium" | "large";

const SIZE_CONFIG: Record<
  LabelSize,
  {
    label: string;
    barcodeHeight: number;
    barcodeWidth: number;
    fontSize: number;
    printColumns: number;
    gridCols: string;
    padding: string;
    nameSize: string;
    priceSize: string;
  }
> = {
  small: {
    label: "Small",
    barcodeHeight: 26,
    barcodeWidth: 1,
    fontSize: 7,
    printColumns: 4,
    gridCols: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    padding: "px-1.5 py-2",
    nameSize: "text-[10px]",
    priceSize: "text-[11px]",
  },
  medium: {
    label: "Medium",
    barcodeHeight: 38,
    barcodeWidth: 1.3,
    fontSize: 9,
    printColumns: 3,
    gridCols: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    padding: "px-2 py-3",
    nameSize: "text-[11px]",
    priceSize: "text-xs",
  },
  large: {
    label: "Large",
    barcodeHeight: 56,
    barcodeWidth: 1.8,
    fontSize: 12,
    printColumns: 2,
    gridCols: "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2",
    padding: "px-3 py-4",
    nameSize: "text-sm",
    priceSize: "text-sm",
  },
};

export default function PrintLabelsModal({
  products,
  onClose,
}: {
  products: LabelProduct[];
  onClose: () => void;
}) {
  const [copiesPerProduct, setCopiesPerProduct] = useState("1");
  const [labelSize, setLabelSize] = useState<LabelSize>("medium");
  const copies = Math.max(1, parseInt(copiesPerProduct) || 1);
  const labels = products.flatMap((p) => Array.from({ length: copies }, () => p));
  const cfg = SIZE_CONFIG[labelSize];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/40 backdrop-blur-sm">
      <div className="no-print flex flex-col gap-3 border-b border-line bg-paper px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-bold text-ink sm:text-lg">
            Print labels ({products.length} product{products.length !== 1 ? "s" : ""})
          </h2>
          <p className="text-xs text-slate">Barcode, name and price on each label.</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {/* Label size selector */}
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-slate">
              Label size
            </span>
            <div className="inline-flex rounded-full border border-line bg-paper-2 p-1">
              {(Object.keys(SIZE_CONFIG) as LabelSize[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setLabelSize(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    labelSize === s ? "bg-white text-ink shadow-sm" : "text-ink-2"
                  }`}
                >
                  {SIZE_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <label className="flex items-center justify-between gap-2 text-sm text-ink-2 sm:justify-start">
              <span className="whitespace-nowrap">Copies each</span>
              <input
                type="number"
                min="1"
                value={copiesPerProduct}
                onChange={(e) => setCopiesPerProduct(e.target.value)}
                className="w-20 shrink-0 rounded-lg border border-line bg-white px-2 py-1.5 text-sm outline-none focus:border-ink"
              />
            </label>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <button
                onClick={() => window.print()}
                disabled={products.length === 0}
                className="w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                Print
              </button>
              <button
                onClick={onClose}
                className="w-full rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-paper-2 sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-hidden overflow-y-auto bg-paper-2 p-3 sm:p-6">
        {products.length === 0 ? (
          <p className="text-center text-sm text-slate">No products selected.</p>
        ) : (
          <div
            className={`print-area mx-auto grid max-w-4xl gap-2.5 rounded-xl bg-white p-3 sm:gap-3 sm:p-4 ${cfg.gridCols}`}
          >
            {labels.map((p, i) => (
              <div
                key={`${p._id}-${i}`}
                className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border border-line text-center ${cfg.padding}`}
                style={{ breakInside: "avoid" }}
              >
                <p className={`w-full truncate font-semibold text-ink ${cfg.nameSize}`}>{p.name}</p>
                <div className="flex w-full justify-center overflow-hidden">
                  <BarcodeCanvas
                    value={p.barcode}
                    height={cfg.barcodeHeight}
                    width={cfg.barcodeWidth}
                    fontSize={cfg.fontSize}
                    className="max-w-full"
                  />
                </div>
                <p className={`font-data font-bold text-ink ${cfg.priceSize}`}>{formatINR(p.price)}</p>
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
            grid-template-columns: repeat(${cfg.printColumns}, 1fr) !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}