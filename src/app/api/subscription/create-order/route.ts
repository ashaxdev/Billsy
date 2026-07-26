import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRazorpay, PRO_PLAN_PRICE_INR, PRO_PLAN_YEARLY_PRICE_INR } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const cycle: "monthly" | "yearly" = body.cycle === "yearly" ? "yearly" : "monthly";
  const priceInr = cycle === "yearly" ? PRO_PLAN_YEARLY_PRICE_INR : PRO_PLAN_PRICE_INR;

  try {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: priceInr * 100, // paise
      currency: "INR",
      receipt: `pro_${(session.user as { id: string }).id}_${Date.now()}`,
      notes: {
        businessId: (session.user as { id: string }).id,
        plan: cycle === "yearly" ? "pro-yearly" : "pro-monthly",
        cycle,
      },
    });

    return NextResponse.json({ order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Could not create payment order." }, { status: 500 });
  }
}