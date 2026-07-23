import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { generateReceiptNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const orders = await Order.find({ businessId }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ orders });
}

type DiscountType = "percent" | "flat";

function lineDiscountAmount(item: { price: number; qty: number; discountType?: DiscountType; discountValue?: number }) {
  const lineGross = item.price * item.qty;
  const value = item.discountValue || 0;
  const raw = item.discountType === "flat" ? value * item.qty : (lineGross * value) / 100;
  return Math.min(Math.max(raw, 0), lineGross);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const body = await req.json();
  const {
    items,
    taxPercent = 0,
    billDiscountType = "percent",
    billDiscountValue = 0,
    customerName,
    customerPhone,
    paymentMode = "cash",
  } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required." }, { status: 400 });
  }

  // Recompute everything server-side rather than trusting client-sent totals.
  const grossSubtotal = items.reduce((sum: number, it: { price: number; qty: number }) => sum + it.price * it.qty, 0);

  const itemDiscountsTotal = items.reduce(
    (sum: number, it: { price: number; qty: number; discountType?: DiscountType; discountValue?: number }) =>
      sum + lineDiscountAmount(it),
    0
  );

  const afterItemDiscounts = grossSubtotal - itemDiscountsTotal;

  const billDiscountRaw =
    billDiscountType === "flat" ? billDiscountValue : (afterItemDiscounts * billDiscountValue) / 100;
  const billDiscountAmount = +Math.min(Math.max(billDiscountRaw, 0), afterItemDiscounts).toFixed(2);

  const taxableAmount = Math.max(afterItemDiscounts - billDiscountAmount, 0);
  const taxAmount = +(taxableAmount * (taxPercent / 100)).toFixed(2);
  const total = +(taxableAmount + taxAmount).toFixed(2);

  const order = await Order.create({
    businessId,
    receiptNumber: generateReceiptNumber(),
    items,
    subtotal: grossSubtotal,
    itemDiscountsTotal,
    billDiscountType,
    billDiscountAmount,
    taxableAmount,
    taxPercent,
    taxAmount,
    total,
    customerName,
    customerPhone,
    paymentMode,
  });

  try {
    for (const it of items) {
      if (it.productId) {
        await Product.findByIdAndUpdate(it.productId, { $inc: { stock: -it.qty } });
      }
    }
  } catch {
    // non-fatal
  }

  return NextResponse.json({ order }, { status: 201 });
}