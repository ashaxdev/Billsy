import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Order, { IOrderItem } from "@/models/Order";
import Business from "@/models/Business";
import BarcodeCanvas from "@/components/BarcodeCanvas";
import { formatINR } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Receipt ${id.slice(-6).toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await dbConnect();
  const order = await Order.findById(id).lean();
  if (!order) notFound();

  const business = await Business.findById(order.businessId)
    .select("businessName address phone")
    .lean();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-2 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="receipt-edge-top receipt-edge-bottom bg-white px-6 pb-8 pt-7 shadow-[0_20px_45px_-20px_rgba(22,32,43,0.35)] print:shadow-none">
          <div className="text-center">
            <p className="font-display text-base font-bold text-ink">
              {business?.businessName || "Receipt"}
            </p>
            {business?.address && <p className="mt-0.5 text-xs text-slate">{business.address}</p>}
            <p className="font-data mt-1 text-[11px] text-slate">
              {order.receiptNumber} &middot;{" "}
              {new Date(order.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {(order.customerName || order.customerPhone) && (
            <p className="mt-3 text-center text-xs text-ink-2">
              Billed to: {order.customerName || "Customer"}
              {order.customerPhone ? ` · ${order.customerPhone}` : ""}
            </p>
          )}

          <div className="my-5 border-t border-dashed border-line" />

          <ul className="font-data space-y-2 text-[13px] text-ink-2">
            {order.items.map((item: IOrderItem, idx: number) => (
              <li key={idx} className="flex justify-between gap-3">
                <span className="min-w-0 flex-1 truncate">
                  {item.name} x{item.qty}
                </span>
                <span>{formatINR(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="my-5 border-t border-dashed border-line" />

          <div className="font-data space-y-1 text-sm text-ink-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            {order.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax ({order.taxPercent}%)</span>
                <span>{formatINR(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-1.5 text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>

          <p className="font-data mt-3 text-center text-[11px] uppercase tracking-wide text-slate">
            Paid via {order.paymentMode}
          </p>

          <div className="mt-6 flex flex-col items-center">
            <BarcodeCanvas value={order.receiptNumber.replace(/[^0-9A-Za-z]/g, "")} height={44} width={1.6} fontSize={10} />
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate">
          Generated with Billsy — billing for small businesses.
          <br />
          Developed by{" "}
          <a
            href="https://www.nexirasolution.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
          >
            Nexira Solution
          </a>
        </p>
      </div>
    </div>
  );
}