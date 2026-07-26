import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

// How long a new business gets full access before the paywall kicks in.
const TRIAL_DAYS = 7;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const businessId = (session.user as { id: string }).id;
  const business = await Business.findById(businessId).select("plan createdAt trialEndsAt").lean();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const now = new Date();

  // Prefer an explicit trialEndsAt field if the schema has one; otherwise fall
  // back to createdAt + TRIAL_DAYS so this works even before that field exists.
  const trialEndsAt = business.trialEndsAt
    ? new Date(business.trialEndsAt)
    : new Date(new Date(business.createdAt).getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const tier = business.plan?.tier || "free";
  const planExpiresAt = business.plan?.expiresAt ? new Date(business.plan.expiresAt) : null;
  const planActive = Boolean(
    tier === "pro" && business.plan?.status === "active" && planExpiresAt && planExpiresAt > now
  );

  const inTrial = !planActive && trialEndsAt > now;
  const daysLeftInTrial = inTrial
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
    : 0;

  // Blocked = not on an active paid plan AND the trial window has passed.
  const blocked = !planActive && !inTrial;

  return NextResponse.json({
    tier,
    planActive,
    inTrial,
    daysLeftInTrial,
    blocked,
    trialEndsAt: trialEndsAt.toISOString(),
    planExpiresAt: planExpiresAt ? planExpiresAt.toISOString() : null,
  });
}