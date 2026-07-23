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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const body = await req.json();
  const { items, taxPercent = 0, customerName, customerPhone, paymentMode = "cash" } = body;

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "At least one item is required." }, { status: 400 });
  }

  const subtotal = items.reduce(
    (sum: number, it: { price: number; qty: number }) => sum + it.price * it.qty,
    0
  );
  const taxAmount = +(subtotal * (taxPercent / 100)).toFixed(2);
  const total = +(subtotal + taxAmount).toFixed(2);

  const order = await Order.create({
    businessId,
    receiptNumber: generateReceiptNumber(),
    items,
    subtotal,
    taxPercent,
    taxAmount,
    total,
    customerName,
    customerPhone,
    paymentMode,
  });

  // Best-effort stock deduction; does not block receipt creation if it fails
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
