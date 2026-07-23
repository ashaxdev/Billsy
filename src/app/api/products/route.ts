import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import Business from "@/models/Business";
import { generateBarcodeValue } from "@/lib/utils";

const FREE_PRODUCT_LIMIT = 30;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const search = req.nextUrl.searchParams.get("q");
  const filter: Record<string, unknown> = { businessId: (session.user as { id: string }).id };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { barcode: { $regex: search, $options: "i" } },
    ];
  }

  const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;

  const business = await Business.findById(businessId).lean();
  if (business?.plan?.tier === "free") {
    const count = await Product.countDocuments({ businessId });
    if (count >= FREE_PRODUCT_LIMIT) {
      return NextResponse.json(
        { error: `Free plan is limited to ${FREE_PRODUCT_LIMIT} products. Upgrade to Pro for unlimited products.` },
        { status: 403 }
      );
    }
  }

  const body = await req.json();
  const { name, price, stock, category, imageUrl, imagePublicId, barcode } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "Name and price are required." }, { status: 400 });
  }

  let finalBarcode = (barcode || generateBarcodeValue()).trim();
  // ensure uniqueness in the unlikely event of collision
  let attempts = 0;
  while (await Product.findOne({ barcode: finalBarcode }) && attempts < 5) {
    finalBarcode = generateBarcodeValue();
    attempts++;
  }

  const product = await Product.create({
    businessId,
    name,
    price,
    stock: stock ?? 0,
    category,
    imageUrl,
    imagePublicId,
    barcode: finalBarcode,
  });

  return NextResponse.json({ product }, { status: 201 });
}
