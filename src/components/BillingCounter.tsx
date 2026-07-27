"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import BarcodeScanner from "@/components/BarcodeScanner";
import QuickAddProductModal from "@/components/QuickAddProductModal";
import { formatINR, whatsappShareUrl } from "@/lib/utils";

type DiscountType = "percent" | "flat";

interface CartItem {
  productId?: string;
  name: string;
  barcode: string;
  price: number;
  qty: number;
  discountType: DiscountType;
  discountValue: number;
}

interface CreatedOrder {
  _id: string;
  receiptNumber: string;
  total: number;
}

function lineDiscountAmount(item: CartItem) {
  const lineGross = item.price * item.qty;
  const raw =
    item.discountType === "percent"
      ? (lineGross * item.discountValue) / 100
      : item.discountValue * item.qty;
  return Math.min(Math.max(raw, 0), lineGross);
}

export default function BillingCounter() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState
   < { _id: string; name: string; price: number; barcode: string; stock: number }[]
  >([]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [defaultTaxPercent, setDefaultTaxPercent] = useState("0");
  const [billDiscountType, setBillDiscountType] = useState<DiscountType>("percent");
  const [billDiscountValue, setBillDiscountValue] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi" | "card" | "other">("cash");
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CreatedOrder | null>(null);
  const [businessName, setBusinessName] = useState("Receipt");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch the business's saved default tax % and prefill the bill with it.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.defaultTaxPercent === "number") {
            const val = String(data.defaultTaxPercent);
            setDefaultTaxPercent(val);
            setTaxPercent(val);
          }
          if (typeof data.businessName === "string" && data.businessName.trim()) {
            setBusinessName(data.businessName);
          }
        }
      } catch {
        // if settings fetch fails, just fall back to 0 — non-fatal
      }
    })();
  }, []);

  function addToCart(item: { _id?: string; name: string; price: number; barcode: string }) {
    setCart((prev) => {
      const existing = prev.find((i) => i.barcode === item.barcode);
      if (existing) {
        return prev.map((i) => (i.barcode === item.barcode ? { ...i, qty: i.qty + 1 } : i));
      }
      return [
        ...prev,
        {
          productId: item._id,
          name: item.name,
          price: item.price,
          barcode: item.barcode,
          qty: 1,
          discountType: "percent",
          discountValue: 0,
        },
      ];
    });
  }

  async function handleScan(barcode: string) {
    const res = await fetch(`/api/products/${encodeURIComponent(barcode)}`);
    if (!res.ok) {
      setScanning(false);
      setUnknownBarcode(barcode);
      return;
    }
    const { product } = await res.json();
    addToCart(product);
    toast.success(`${product.name} added`);
  }

  function updateSearch(value: string) {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/products?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      if (res.ok) setSearchResults(data.products.slice(0, 6));
    }, 250);
  }

  function updateQty(barcode: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => (i.barcode === barcode ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  }

  function updateItemDiscount(barcode: string, field: "discountType" | "discountValue", value: string) {
    setCart((prev) =>
      prev.map((i) =>
        i.barcode === barcode
          ? {
              ...i,
              [field]:
                field === "discountValue" ? Math.max(0, parseFloat(value) || 0) : (value as DiscountType),
            }
          : i
      )
    );
  }

  // --- Totals ---
  const grossSubtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const itemDiscountsTotal = cart.reduce((sum, i) => sum + lineDiscountAmount(i), 0);
  const afterItemDiscounts = grossSubtotal - itemDiscountsTotal;

  const billDiscountRaw =
    billDiscountType === "percent"
      ? (afterItemDiscounts * (parseFloat(billDiscountValue || "0") || 0)) / 100
      : parseFloat(billDiscountValue || "0") || 0;
  const billDiscountAmount = +Math.min(Math.max(billDiscountRaw, 0), afterItemDiscounts).toFixed(2);

  const taxableAmount = Math.max(afterItemDiscounts - billDiscountAmount, 0);
  const tax = +(taxableAmount * (parseFloat(taxPercent || "0") / 100)).toFixed(2);
  const total = +(taxableAmount + tax).toFixed(2);

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Add at least one item first.");
      return;
    }
    setCheckingOut(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId,
            name: i.name,
            barcode: i.barcode,
            price: i.price,
            qty: i.qty,
            discountType: i.discountType,
            discountValue: i.discountValue,
          })),
          taxPercent: parseFloat(taxPercent || "0"),
          billDiscountType,
          billDiscountValue: parseFloat(billDiscountValue || "0"),
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          paymentMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCompletedOrder(data.order);
      toast.success("Receipt generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  }

  function startNewBill() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setTaxPercent(defaultTaxPercent);
    setBillDiscountType("percent");
    setBillDiscountValue("0");
    setCompletedOrder(null);
  }

  function printReceipt(orderId: string) {
    const receiptWindow = window.open(`/receipt/${orderId}?print=1`, "_blank");
    if (!receiptWindow) {
      toast.error("Please allow pop-ups to print the receipt.");
      return;
    }
    receiptWindow.addEventListener("load", () => {
      receiptWindow.focus();
      receiptWindow.print();
    });
  }

  // --- PDF generation ---
  // Builds a narrow, thermal-receipt-style PDF from the data already in
  // state (cart / customer / totals are still populated at this point,
  // since startNewBill() hasn't run yet).
  function buildReceiptPdf(order: CreatedOrder) {
    const pageWidth = 226; // ~80mm receipt width in points
    const doc = new jsPDF({ unit: "pt", format: [pageWidth, 600] });
    const marginX = 14;
    let y = 24;
    const lineGap = 14;

    const center = (text: string, size = 11, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.text(text, pageWidth / 2, y, { align: "center" });
      y += lineGap;
    };
    const row = (left: string, right: string, bold = false) => {
      doc.setFont("courier", bold ? "bold" : "normal");
      doc.setFontSize(9.5);
      doc.text(left, marginX, y);
      doc.text(right, pageWidth - marginX, y, { align: "right" });
      y += 12;
    };
    const rule = () => {
      doc.setLineDashPattern([2, 1], 0);
      doc.line(marginX, y, pageWidth - marginX, y);
      y += 10;
    };

    center(businessName, 13, true);
    center(order.receiptNumber, 9);
    y += 2;
    rule();

    if (customerName) row("Customer", customerName);
    if (customerPhone) row("Phone", customerPhone);
    if (customerName || customerPhone) rule();

    cart.forEach((item) => {
      const disc = lineDiscountAmount(item);
      const lineTotal = item.price * item.qty - disc;
      row(`${item.name} x${item.qty}`, formatINR(lineTotal));
      if (disc > 0) {
        doc.setFont("courier", "normal");
        doc.setFontSize(8.5);
        doc.text(`  (disc -${formatINR(disc)})`, marginX, y);
        y += 11;
      }
    });
    rule();

    row("Subtotal", formatINR(grossSubtotal));
    if (itemDiscountsTotal > 0) row("Item discounts", `-${formatINR(itemDiscountsTotal)}`);
    if (billDiscountAmount > 0) row("Bill discount", `-${formatINR(billDiscountAmount)}`);
    row("Tax", formatINR(tax));
    rule();
    row("TOTAL", formatINR(order.total), true);
    y += 6;
    row("Payment", paymentMode.toUpperCase());
    y += 10;

    center("Thank you for your business!", 9);

    return doc;
  }

  async function downloadReceiptPdf() {
    if (!completedOrder) return;
    setGeneratingPdf(true);
    try {
      const doc = buildReceiptPdf(completedOrder);
      doc.save(`${completedOrder.receiptNumber}.pdf`);
    } finally {
      setGeneratingPdf(false);
    }
  }

  async function shareReceiptPdf() {
    if (!completedOrder) return;
    setGeneratingPdf(true);
    try {
      const doc = buildReceiptPdf(completedOrder);
      const blob = doc.output("blob");
      const file = new File([blob], `${completedOrder.receiptNumber}.pdf`, {
        type: "application/pdf",
      });

      // Prefer the native share sheet (lets the user pick WhatsApp, etc.)
      // when the browser supports sharing files.
      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: completedOrder.receiptNumber,
          text: `Receipt ${completedOrder.receiptNumber} — ${formatINR(completedOrder.total)}`,
        });
      } else {
        // Fallback: just download it, since a wa.me link can't attach a file directly.
        doc.save(`${completedOrder.receiptNumber}.pdf`);
        toast.success("PDF downloaded — attach it in WhatsApp manually.");
      }
    } catch (err) {
      // AbortError fires when the user cancels the native share sheet — not a real error.
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Couldn't share the PDF.");
      }
    } finally {
      setGeneratingPdf(false);
    }
  }

  if (completedOrder) {
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const receiptUrl = `${siteUrl}/receipt/${completedOrder._id}`;
    return (
      <div className="mx-auto max-w-md">
        <div className="receipt-edge-top receipt-edge-bottom border border-line bg-white p-7 text-center">
          <p className="font-data text-xs uppercase tracking-wide text-slate">{completedOrder.receiptNumber}</p>
          <h1 className="font-display mt-2 text-2xl font-bold text-ink">Bill complete</h1>
          <p className="font-data mt-1 text-3xl font-bold text-signal">{formatINR(completedOrder.total)}</p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => printReceipt(completedOrder._id)}
              className="rounded-full bg-ink py-2.5 text-sm font-semibold text-paper hover:bg-ink-2"
            >
              🖨️ Print receipt
            </button>
            <button
              onClick={downloadReceiptPdf}
              disabled={generatingPdf}
              className="rounded-full border border-line py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper-2 disabled:opacity-60"
            >
              ⬇️ Download PDF
            </button>
            <button
              onClick={shareReceiptPdf}
              disabled={generatingPdf}
              className="rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
            >
              📄 Share receipt as PDF
            </button>
            {customerPhone && (
               <a href={whatsappShareUrl(customerPhone, `Here's your receipt from us: ${receiptUrl}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-line py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper-2"
              >
                💬 Share link on WhatsApp
              </a>
            )}
            <Link
             href={`/receipt/${completedOrder._id}`}
              target="_blank"
              className="rounded-full border border-line py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper-2"
            >
              View receipt
            </Link>
            <button
              onClick={startNewBill}
              className="rounded-full bg-amber py-2.5 text-sm font-semibold text-ink hover:opacity-90"
            >
              Start next bill
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Bill now</h1>
          <p className="mt-1 text-sm text-ink-2">Scan or search products to build the cart.</p>
        </div>
        <button
          onClick={() => setScanning(true)}
          className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-ink hover:opacity-90"
        >
          Scan barcode
        </button>
      </div>

      <div className="relative mt-5">
        <input
          value={searchTerm}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search product by name or barcode…"
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-line bg-white shadow-lg">
            {searchResults.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  addToCart(p);
                  setSearchTerm("");
                  setSearchResults([]);
                }}
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm hover:bg-paper-2"
              >
                <span>{p.name}</span>
                <span className="font-data text-signal">{formatINR(p.price)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-line bg-white">
          {cart.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate">
              Cart is empty — scan or search a product to begin.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {cart.map((item) => {
                const discAmt = lineDiscountAmount(item);
                return (
                  <li key={item.barcode} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <p className="font-data text-xs text-slate">{formatINR(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.barcode, -1)}
                          className="h-7 w-7 rounded-full border border-line text-sm hover:bg-paper-2"
                        >
                          −
                        </button>
                        <span className="font-data w-5 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.barcode, 1)}
                          className="h-7 w-7 rounded-full border border-line text-sm hover:bg-paper-2"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-data w-20 shrink-0 text-right text-sm font-semibold text-ink">
                        {formatINR(item.price * item.qty - discAmt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-0.5">
                      <span className="text-[11px] text-slate">Discount</span>
                      <select
                        value={item.discountType}
                        onChange={(e) => updateItemDiscount(item.barcode, "discountType", e.target.value)}
                        className="rounded border border-line bg-white px-1.5 py-1 text-xs outline-none"
                      >
                        <option value="percent">%</option>
                        <option value="flat">₹</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        value={item.discountValue || ""}
                        onChange={(e) => updateItemDiscount(item.barcode, "discountValue", e.target.value)}
                        placeholder="0"
                        className="w-16 rounded border border-line bg-white px-1.5 py-1 text-xs outline-none"
                      />
                      {discAmt > 0 && (
                        <span className="font-data text-[11px] text-signal">−{formatINR(discAmt)}</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="space-y-3">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />
            <input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Customer WhatsApp number"
              className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
            />

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate">
                Bill discount
              </label>
              <div className="flex gap-2">
                <select
                  value={billDiscountType}
                  onChange={(e) => setBillDiscountType(e.target.value as DiscountType)}
                  className="rounded-lg border border-line bg-white px-2 py-2.5 text-sm outline-none focus:border-ink"
                >
                  <option value="percent">%</option>
                  <option value="flat">₹</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={billDiscountValue}
                  onChange={(e) => setBillDiscountValue(e.target.value)}
                  placeholder="0"
                  className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                placeholder="Tax %"
                className="w-24 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              />
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}
                className="flex-1 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="font-data mt-5 space-y-1.5 border-t border-dashed border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-2">
              <span>Subtotal</span>
              <span>{formatINR(grossSubtotal)}</span>
            </div>
            {itemDiscountsTotal > 0 && (
              <div className="flex justify-between text-signal">
                <span>Item discounts</span>
                <span>−{formatINR(itemDiscountsTotal)}</span>
              </div>
            )}
            {billDiscountAmount > 0 && (
              <div className="flex justify-between text-signal">
                <span>Bill discount</span>
                <span>−{formatINR(billDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-ink-2">
              <span>Tax</span>
              <span>{formatINR(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={checkingOut}
            className="mt-5 w-full rounded-full bg-signal py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-60"
          >
            {checkingOut ? "Generating receipt…" : "Generate receipt"}
          </button>
        </div>
      </div>

      {scanning && (
        <>
          <BarcodeScanner onScan={(value) => handleScan(value)} onClose={() => setScanning(false)} />

          {/* Live receipt — bottom half, updates instantly as items are scanned */}
          <div className="fixed inset-x-0 bottom-0 z-50 flex h-[42vh] flex-col rounded-t-2xl border-t border-line bg-white shadow-[0_-15px_35px_-20px_rgba(22,32,43,0.4)] sm:h-[38vh]">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-sm font-semibold text-ink">
                Current bill
                {cart.length > 0 && (
                  <span className="ml-1.5 font-normal text-slate">
                    &middot; {cart.length} item{cart.length > 1 ? "s" : ""}
                  </span>
                )}
              </span>
              <button
                onClick={() => setScanning(false)}
                className="rounded-full bg-signal px-4 py-1.5 text-xs font-semibold text-paper hover:opacity-90"
              >
                Done scanning
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate">
                  Scan an item — it&rsquo;ll show up here instantly.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {cart.map((item) => (
                    <li key={item.barcode} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                        <p className="font-data text-xs text-slate">{formatINR(item.price)} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQty(item.barcode, -1)}
                          className="h-6 w-6 shrink-0 rounded-full border border-line text-xs hover:bg-paper-2"
                        >
                          −
                        </button>
                        <span className="font-data w-4 text-center text-sm">{item.qty}</span>
                        <button
                          onClick={() => updateQty(item.barcode, 1)}
                          className="h-6 w-6 shrink-0 rounded-full border border-line text-xs hover:bg-paper-2"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-data w-16 shrink-0 text-right text-sm font-semibold text-ink">
                        {formatINR(item.price * item.qty - lineDiscountAmount(item))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="font-data flex items-center justify-between border-t border-dashed border-line px-4 py-3">
              <span className="text-sm text-ink-2">Running total</span>
              <span className="text-base font-bold text-ink">{formatINR(total)}</span>
            </div>
          </div>
        </>
      )}

      {unknownBarcode && (
        <QuickAddProductModal
          barcode={unknownBarcode}
          onClose={() => setUnknownBarcode(null)}
          onCreated={(product) => {
            addToCart(product);
            toast.success(`${product.name} added`);
            setUnknownBarcode(null);
          }}
        />
      )}
    </div>
  );
}