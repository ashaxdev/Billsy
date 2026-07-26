import Link from "next/link";
import BarcodeCanvas from "@/components/BarcodeCanvas";

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Billsy
          </span>
          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-ink-2 hover:text-ink sm:inline"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-2"
            >
              Start billing free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-16 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="font-data mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper-2 px-3 py-1 text-xs tracking-wide text-slate uppercase">
            Made for kirana stores, salons &amp; small shops
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
            Your phone is now
            <br />
            the billing counter.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-2 sm:text-lg">
            Scan a product&rsquo;s barcode, generate the bill in seconds, then
            print a receipt or send it straight to your customer&rsquo;s
            WhatsApp. No POS machine, no extra hardware &mdash; just Billsy on
            the phone you already carry.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="rounded-full bg-signal px-6 py-3 text-sm font-semibold text-paper shadow-sm transition hover:opacity-90"
            >
              Create your business account
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate">
            Free for up to 30 products. Upgrade to Pro anytime, no lock-in.
          </p>
        </div>

        {/* Signature element: a torn receipt card with a real, scannable barcode */}
        <div className="mx-auto w-full max-w-sm">
          <div className="receipt-edge-top receipt-edge-bottom bg-white px-6 pb-8 pt-7 shadow-[0_20px_45px_-20px_rgba(22,32,43,0.35)]">
            <div className="text-center">
              <p className="font-display text-sm font-bold tracking-wide text-ink">
                MEENA GENERAL STORE
              </p>
              <p className="font-data mt-0.5 text-[11px] text-slate">
                RCT-260723-4821 &middot; Today, 4:12 PM
              </p>
            </div>
            <div className="my-5 border-t border-dashed border-line" />
            <ul className="font-data space-y-2 text-[13px] text-ink-2">
              <li className="flex justify-between">
                <span>Amul Milk 500ml x2</span>
                <span>₹64.00</span>
              </li>
              <li className="flex justify-between">
                <span>Parle-G Biscuit x3</span>
                <span>₹30.00</span>
              </li>
              <li className="flex justify-between">
                <span>Tata Salt 1kg x1</span>
                <span>₹28.00</span>
              </li>
            </ul>
            <div className="my-5 border-t border-dashed border-line" />
            <div className="font-data flex justify-between text-sm font-bold text-ink">
              <span>TOTAL</span>
              <span>₹122.00</span>
            </div>
            <div className="mt-6 flex flex-col items-center">
              <BarcodeCanvas value="4821607230122" height={44} width={1.6} fontSize={11} />
            </div>
          </div>

          {/* Print / WhatsApp action row under the receipt */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-2">
              🖨️ Print receipt
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-2 px-3 py-1.5 text-xs font-medium text-ink-2">
              💬 Send on WhatsApp
            </span>
          </div>
        </div>
      </section>

      <div className="barcode-stripe" aria-hidden="true" />

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-display max-w-xl text-2xl font-bold text-ink sm:text-3xl">
          Everything a small shop needs to bill faster.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Scan to bill",
              copy: "Point your phone's camera at any barcode and it drops straight into the cart, priced and ready.",
            },
            {
              title: "Auto-generate barcodes",
              copy: "Upload a new product with a photo and Billsy prints it a unique barcode instantly.",
            },
            {
              title: "Print or share receipts",
              copy: "Connect a receipt printer for an instant paper copy, or send the same bill as a link on WhatsApp — whatever your counter needs.",
            },
            {
              title: "Multiple businesses",
              copy: "Run more than one shop? Each business gets its own login, catalog and receipts.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-line bg-paper-2/60 p-5 transition hover:border-ink/30"
            >
              <h3 className="font-display text-base font-semibold text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{f.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — a real sequence, so numbering is earned */}
      <section id="how-it-works" className="border-y border-line bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            From new product to paid customer, in three steps.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Add your products",
                copy: "Snap a photo, set the price, and Billsy generates a barcode you can print or scan straight off your phone screen.",
              },
              {
                n: "02",
                title: "Scan at the counter",
                copy: "Scan each item as the customer picks it up. Billsy builds the cart and totals it automatically.",
              },
              {
                n: "03",
                title: "Print or share the receipt",
                copy: "Tap print for a paper copy from a connected receipt printer, or tap share to send it straight to your customer's WhatsApp.",
              },
            ].map((s) => (
              <div key={s.n}>
                <span className="font-data text-3xl font-bold text-amber">{s.n}</span>
                <h3 className="font-display mt-3 text-base font-semibold text-ink">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Simple pricing, pay only when you outgrow free.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 sm:max-w-2xl">
          <div className="receipt-edge-top receipt-edge-bottom border border-line bg-white p-7">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate">
              Monthly
            </p>
            <p className="font-display mt-2 text-3xl font-bold text-ink">₹499/mo</p>
            <ul className="mt-5 space-y-2 text-sm text-ink-2">
              <li>Unlimited products</li>
              <li>Print &amp; WhatsApp receipts</li>
              <li>Priority support</li>
              <li>Everything in Free</li>
            </ul>
          </div>
          <div className="receipt-edge-top receipt-edge-bottom border border-ink bg-ink p-7 text-paper">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-amber">
              Yearly &middot; Save 17%
            </p>
            <p className="font-display mt-2 text-3xl font-bold">₹5,000/yr</p>
            <ul className="mt-5 space-y-2 text-sm text-paper/85">
              <li>Unlimited products</li>
              <li>Print &amp; WhatsApp receipts</li>
              <li>Priority support</li>
              <li>Everything in Free</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-slate sm:flex-row">
          <span className="font-display font-semibold text-ink">Billsy</span>
          <p>Billing, barcodes, printing and receipts for small businesses.</p>
          <p>
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
      </footer>
    </div>
  );
}