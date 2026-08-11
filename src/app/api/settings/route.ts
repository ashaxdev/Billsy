import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

const FSSAI_REGEX = /^\d{14}$/;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const business = await Business.findById(businessId)
    .select("defaultTaxPercent defaultDiscountType defaultDiscountValue fssaiNumber")
    .lean();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  return NextResponse.json({
    defaultTaxPercent: business.defaultTaxPercent ?? 0,
    defaultDiscountType: business.defaultDiscountType ?? "percent",
    defaultDiscountValue: business.defaultDiscountValue ?? 0,
    fssaiNumber: business.fssaiNumber ?? "",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { defaultTaxPercent, defaultDiscountType, defaultDiscountValue, fssaiNumber } = body;

  if (typeof defaultTaxPercent !== "number" || defaultTaxPercent < 0 || defaultTaxPercent > 100) {
    return NextResponse.json({ error: "Tax percent must be a number between 0 and 100." }, { status: 400 });
  }

  if (defaultDiscountType !== undefined && !["percent", "flat"].includes(defaultDiscountType)) {
    return NextResponse.json({ error: "Discount type must be 'percent' or 'flat'." }, { status: 400 });
  }

  if (defaultDiscountValue !== undefined) {
    if (typeof defaultDiscountValue !== "number" || defaultDiscountValue < 0) {
      return NextResponse.json({ error: "Discount value must be a positive number." }, { status: 400 });
    }
    if (defaultDiscountType === "percent" && defaultDiscountValue > 100) {
      return NextResponse.json({ error: "Discount percent cannot exceed 100." }, { status: 400 });
    }
  }

  const trimmedFssai = typeof fssaiNumber === "string" ? fssaiNumber.trim() : "";
  if (trimmedFssai && !FSSAI_REGEX.test(trimmedFssai)) {
    return NextResponse.json(
      { error: "FSSAI license number must be exactly 14 digits." },
      { status: 400 }
    );
  }

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const business = await Business.findByIdAndUpdate(
    businessId,
    {
      $set: {
        defaultTaxPercent,
        defaultDiscountType: defaultDiscountType ?? "percent",
        defaultDiscountValue: defaultDiscountValue ?? 0,
        fssaiNumber: trimmedFssai,
      },
    },
    { new: true }
  ).lean();

  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
  return NextResponse.json({
    defaultTaxPercent: business.defaultTaxPercent,
    defaultDiscountType: business.defaultDiscountType,
    defaultDiscountValue: business.defaultDiscountValue,
    fssaiNumber: business.fssaiNumber,
  });
}