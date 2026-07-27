import Link from "next/link";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";
import { formatINR } from "@/lib/utils";

const SUPPORT_WHATSAPP_NUMBER = "919486350579"; // 91 + 9486350579

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

      <FloatingSupportButton />
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

function FloatingSupportButton() {
  return (
    <a
      href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        "Hi, I need some help with my billing account."
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      title="Chat with support on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(37,211,102,0.6)] transition hover:scale-105 hover:opacity-95"
    >
      <svg
        viewBox="0 0 32 32"
        width="28"
        height="28"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.004 2.667c-7.363 0-13.333 5.97-13.333 13.333 0 2.353.615 4.66 1.784 6.687L2.667 29.333l6.822-1.789a13.28 13.28 0 0 0 6.515 1.72h.006c7.363 0 13.333-5.97 13.333-13.333s-5.97-13.264-13.339-13.264Zm0 24.4h-.005a11.1 11.1 0 0 1-5.653-1.548l-.405-.24-4.049 1.062 1.081-3.946-.264-.406a11.06 11.06 0 0 1-1.696-5.925c0-6.127 4.987-11.113 11.117-11.113 2.97 0 5.76 1.157 7.859 3.257a11.04 11.04 0 0 1 3.253 7.863c-.003 6.126-4.99 11.05-11.238 11.05Zm6.098-8.283c-.334-.167-1.978-.976-2.284-1.087-.306-.111-.529-.167-.751.167-.223.334-.862 1.087-1.057 1.31-.195.223-.39.25-.724.084-.334-.167-1.411-.52-2.688-1.658-.994-.886-1.665-1.98-1.86-2.314-.195-.334-.021-.514.146-.68.15-.15.334-.39.501-.585.167-.195.223-.334.334-.557.111-.223.056-.418-.028-.585-.084-.167-.751-1.81-1.029-2.478-.271-.65-.546-.562-.751-.573l-.64-.012c-.223 0-.585.084-.891.418-.306.334-1.169 1.142-1.169 2.786 0 1.644 1.196 3.232 1.363 3.455.167.223 2.354 3.594 5.703 5.04.797.344 1.418.55 1.902.704.799.254 1.526.218 2.101.132.641-.096 1.978-.809 2.257-1.591.279-.782.279-1.452.195-1.591-.084-.14-.306-.223-.64-.39Z" />
      </svg>
    </a>
  );
}