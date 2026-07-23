import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { image } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const businessId = (session.user as { id: string }).id;

    const result = await cloudinary.uploader.upload(image, {
      folder: `billsy/${businessId}/products`,
      resource_type: "image",
      transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
    });

    return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
