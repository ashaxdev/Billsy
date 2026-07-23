import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const business = await Business.findById(businessId).select("defaultTaxPercent").lean();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  return NextResponse.json({ defaultTaxPercent: business.defaultTaxPercent ?? 0 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { defaultTaxPercent } = body;

  if (typeof defaultTaxPercent !== "number" || defaultTaxPercent < 0 || defaultTaxPercent > 100) {
    return NextResponse.json({ error: "Tax percent must be a number between 0 and 100." }, { status: 400 });
  }

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const business = await Business.findByIdAndUpdate(
    businessId,
    { $set: { defaultTaxPercent } },
    { new: true }
  ).lean();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({ defaultTaxPercent: business.defaultTaxPercent });
}