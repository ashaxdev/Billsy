import Link from "next/link";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { formatINR } from "@/lib/utils";

export default async function DashboardHome() {
  const session = await auth();
  const businessId = (session?.user as { id: string })?.id;

  await dbConnect();
  const [productCount, orders] = await Promise.all([
    Product.countDocuments({ businessId }),
    Order.find({ businessId }).sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todayOrders = await Order.find({ businessId, createdAt: { $gte: startOfDay } }).lean();
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Good to see you, {session?.user?.name}.
      </h1>
      <p className="mt-1 text-sm text-ink-2">Here&rsquo;s how the counter looks today.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Today's sales" value={formatINR(todayRevenue)} />
        <StatCard label="Receipts today" value={String(todayOrders.length)} />
        <StatCard label="Products in catalog" value={String(productCount)} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard/billing"
          className="rounded-full bg-signal px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90"
        >
          Start a new bill
        </Link>
        <Link
          href="/dashboard/products"
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink-2 hover:bg-paper-2"
        >
          Add a product
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink">Recent receipts</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate">
            No receipts yet — they&rsquo;ll show up here once you bill your first customer.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper-2 text-xs uppercase tracking-wide text-slate">
                <tr>
                  <th className="px-4 py-2.5">Receipt</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={String(o._id)} className="border-t border-line">
                    <td className="font-data px-4 py-2.5 text-ink">
                      <Link href={`/receipt/${o._id}`} className="hover:underline">
                        {o.receiptNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-ink-2">{o.customerName || "Walk-in"}</td>
                    <td className="font-data px-4 py-2.5 text-right text-ink">
                      {formatINR(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate">{label}</p>
      <p className="font-display mt-1.5 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
