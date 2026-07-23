import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRazorpay, PRO_PLAN_PRICE_INR } from "@/lib/razorpay";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: PRO_PLAN_PRICE_INR * 100, // paise
      currency: "INR",
      receipt: `pro_${(session.user as { id: string }).id}_${Date.now()}`,
      notes: { businessId: (session.user as { id: string }).id, plan: "pro-monthly" },
    });

    return NextResponse.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create payment order." }, { status: 500 });
  }
}
