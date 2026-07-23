import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const { businessName, ownerName, email, phone, password } = await req.json();

    if (!businessName || !ownerName || !email || !phone || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    await dbConnect();

    const existing = await Business.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const slug = slugify(businessName);

    const business = await Business.create({
      businessName,
      ownerName,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      slug,
      plan: { tier: "free", status: "active" },
    });

    return NextResponse.json({ id: business._id, slug: business.slug }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
