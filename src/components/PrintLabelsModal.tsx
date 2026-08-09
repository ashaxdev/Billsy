"use client";

import { useRef, useState } from "react";
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
    nameLineHeight: string;
    nameMinHeight: string;
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
    nameLineHeight: "leading-[13px]",
    nameMinHeight: "min-h-[26px]",
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
    nameLineHeight: "leading-[15px]",
    nameMinHeight: "min-h-[30px]",
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
    nameLineHeight: "leading-[19px]",
    nameMinHeight: "min-h-[38px]",
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const copies = Math.max(1, parseInt(copiesPerProduct) || 1);
  const labels = products.flatMap((p) => Array.from({ length: copies }, () => p));
  const cfg = SIZE_CONFIG[labelSize];

  async function handleDownloadPDF() {
    if (!printAreaRef.current || products.length === 0 || isGeneratingPDF) return;

    setIsGeneratingPDF(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const node = printAreaRef.current;
      const originalGridTemplate = node.style.gridTemplateColumns;
      node.style.gridTemplateColumns = `repeat(${cfg.printColumns}, 1fr)`;

      // Wait for all fonts to finish loading — html2canvas will otherwise
      // substitute a fallback font mid-capture and clip text that was
      // measured/laid out against the real font's metrics.
      await document.fonts.ready;

      // Let layout settle after forcing the grid columns
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      // Measure each label's top/bottom (in CSS px, relative to the container)
      // so we can find safe row-boundary cut points and never slice through a label.
      const nodeRect = node.getBoundingClientRect();
      const children = Array.from(node.children) as HTMLElement[];
      const rects = children.map((child) => {
        const r = child.getBoundingClientRect();
        return { top: r.top - nodeRect.top, bottom: r.bottom - nodeRect.top };
      });

      // Group into rows (items with ~same top belong to the same row),
      // with a small safety margin so a page cut never grazes text.
      const ROW_SAFETY_PX = 4;
      const rowBottoms: number[] = [];
      let lastTop = -Infinity;
      for (const r of rects) {
        if (Math.abs(r.top - lastTop) > 2) {
          rowBottoms.push(r.bottom + ROW_SAFETY_PX);
          lastTop = r.top;
        } else {
          rowBottoms[rowBottoms.length - 1] = Math.max(
            rowBottoms[rowBottoms.length - 1],
            r.bottom + ROW_SAFETY_PX
          );
        }
      }

      const canvas = await html2canvas(node, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      node.style.gridTemplateColumns = originalGridTemplate;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidthMm = pdf.internal.pageSize.getWidth();
      const pageHeightMm = pdf.internal.pageSize.getHeight();

      // px-per-mm derived from the actual captured canvas vs the CSS width of the node
      const scaleFactor = canvas.width / nodeRect.width;
      const pxPerMm = canvas.width / pageWidthMm;
      const pageHeightPx = pageHeightMm * pxPerMm;

      // Convert row-bottom CSS px to canvas px
      const rowBoundariesPx = rowBottoms.map((b) => b * scaleFactor);

      let cutStart = 0;
      let first = true;

      while (cutStart < canvas.height - 1) {
        const maxCut = cutStart + pageHeightPx;

        // Pick the furthest row boundary that still fits on this page
        let cutEnd = 0;
        for (const b of rowBoundariesPx) {
          if (b > cutStart && b <= maxCut) cutEnd = b;
        }
        // Fallback: no row fits (a single row taller than a page) — hard cut
        if (cutEnd <= cutStart) cutEnd = Math.min(maxCut, canvas.height);
        // Last page: don't overshoot the canvas
        cutEnd = Math.min(cutEnd, canvas.height);

        const sliceHeightPx = cutEnd - cutStart;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            cutStart,
            canvas.width,
            sliceHeightPx,
            0,
            0,
            canvas.width,
            sliceHeightPx
          );
        }

        const imgData = pageCanvas.toDataURL("image/png", 1.0);
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        if (!first) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, 0, pageWidthMm, sliceHeightMm);

        cutStart = cutEnd;
        first = false;
      }

      pdf.save(`labels-${labelSize}-${Date.now()}.pdf`);
    } catch (err) {
      console.error("Failed to generate labels PDF", err);
    } finally {
      setIsGeneratingPDF(false);
    }
  }

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

            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3">
              <button
                onClick={() => window.print()}
                disabled={products.length === 0}
                className="w-full rounded-full bg-signal px-4 py-2 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={products.length === 0 || isGeneratingPDF}
                className="w-full rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink-2 hover:bg-paper-2 disabled:opacity-50 sm:w-auto"
              >
                {isGeneratingPDF ? "Generating…" : "Download PDF"}
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
            ref={printAreaRef}
            className={`print-area mx-auto grid max-w-4xl gap-2.5 rounded-xl bg-white p-3 sm:gap-3 sm:p-4 ${cfg.gridCols}`}
          >
            {labels.map((p, i) => (
              <div
                key={`${p._id}-${i}`}
                className={`flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-line text-center ${cfg.padding}`}
                style={{ breakInside: "avoid" }}
              >
                <p
                  className={`flex w-full items-center justify-center overflow-hidden font-semibold text-ink ${cfg.nameSize} ${cfg.nameLineHeight} ${cfg.nameMinHeight}`}
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {p.name}
                </p>
                <div className="flex w-full justify-center overflow-visible">
                  <BarcodeCanvas
                    value={p.barcode}
                    height={cfg.barcodeHeight}
                    width={cfg.barcodeWidth}
                    fontSize={cfg.fontSize}
                    className="max-w-full"
                  />
                </div>
                <p className={`font-data font-bold text-ink leading-normal pb-0.5 ${cfg.priceSize}`}>
                  {formatINR(p.price)}
                </p>
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