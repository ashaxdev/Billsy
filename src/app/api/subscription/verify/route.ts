import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import { getRazorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Pull the cycle back off the order's notes so we know whether this was a
  // monthly or yearly purchase (set at creation time in create-order).
  let cycle: "monthly" | "yearly" = "monthly";
  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (order?.notes?.cycle === "yearly") cycle = "yearly";
  } catch (err) {
    console.error("Could not fetch order to determine billing cycle, defaulting to monthly:", err);
  }

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const expiresAt = new Date();
  if (cycle === "yearly") {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 30);
  }

  await Business.findByIdAndUpdate(businessId, {
    plan: {
      tier: "pro",
      cycle,
      status: "active",
      expiresAt,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    },
  });

  return NextResponse.json({ success: true, cycle, expiresAt });
}