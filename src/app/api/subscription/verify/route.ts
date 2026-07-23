import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

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

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await Business.findByIdAndUpdate(businessId, {
    plan: {
      tier: "pro",
      status: "active",
      expiresAt,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    },
  });

  return NextResponse.json({ success: true, expiresAt });
}
