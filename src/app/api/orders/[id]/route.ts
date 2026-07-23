import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Business from "@/models/Business";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  const order = await Order.findById(id).lean();
  if (!order) return NextResponse.json({ error: "Receipt not found" }, { status: 404 });

  const business = await Business.findById(order.businessId)
    .select("businessName logoUrl address phone")
    .lean();

  return NextResponse.json({ order, business });
}
