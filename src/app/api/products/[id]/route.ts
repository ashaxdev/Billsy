import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const businessId = (session.user as { id: string }).id;

  // Allow lookup either by Mongo _id or by barcode value (for the POS scanner)
  const product = await Product.findOne({
    businessId,
    $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }, { barcode: id }],
  }).lean();

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const businessId = (session.user as { id: string }).id;
  const body = await req.json();

  const product = await Product.findOneAndUpdate(
    { _id: id, businessId },
    { $set: body },
    { new: true }
  );

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const { id } = await params;
  const businessId = (session.user as { id: string }).id;

  const product = await Product.findOneAndDelete({ _id: id, businessId });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  if (product.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(product.imagePublicId);
    } catch {
      // non-fatal
    }
  }

  return NextResponse.json({ success: true });
}
