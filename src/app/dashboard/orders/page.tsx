import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { formatINR } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Receipts",
};

export default async function OrdersPage() {
  const session = await auth();
  const businessId = (session?.user as { id: string })?.id;

  await dbConnect();
  const orders = await Order.find({ businessId }).sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Receipts</h1>
      <p className="mt-1 text-sm text-ink-2">Every bill you&rsquo;ve generated, most recent first.</p>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="text-sm text-slate">No receipts yet.</p>
          <Link
            href="/dashboard/billing"
            className="mt-4 inline-block rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90"
          >
            Bill your first customer
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-paper-2 text-xs uppercase tracking-wide text-slate">
              <tr>
                <th className="px-4 py-2.5">Receipt</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={String(o._id)} className="border-t border-line">
                  <td className="font-data px-4 py-2.5 text-ink">
                    <Link href={`/receipt/${o._id}`} target="_blank" className="hover:underline">
                      {o.receiptNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-ink-2">{o.customerName || "Walk-in"}</td>
                  <td className="px-4 py-2.5 text-ink-2">{o.items.length}</td>
                  <td className="px-4 py-2.5 text-ink-2">
                    {new Date(o.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </td>
                  <td className="font-data px-4 py-2.5 text-right font-semibold text-ink">
                    {formatINR(o.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
