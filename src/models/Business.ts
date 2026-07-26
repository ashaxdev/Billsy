import mongoose, { Schema, models, model } from "mongoose";

const TRIAL_DAYS = 7;

export interface IBusiness {
  _id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string;
  slug: string;
  logoUrl?: string;
  address?: string;
  defaultTaxPercent: number;
  trialEndsAt?: Date;
  plan: {
    tier: "free" | "pro";
    cycle?: "monthly" | "yearly";
    status: "active" | "expired";
    expiresAt?: Date;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  createdAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    logoUrl: { type: String },
    address: { type: String },
    defaultTaxPercent: { type: Number, default: 0, min: 0, max: 100 },
    // When the free trial ends for this business. Defaulted on creation below;
    // /api/subscription/status also falls back to createdAt + 7 days if this
    // is ever missing (e.g. for businesses created before this field existed).
    trialEndsAt: { type: Date },
    plan: {
      tier: { type: String, enum: ["free", "pro"], default: "free" },
      cycle: { type: String, enum: ["monthly", "yearly"] },
      status: { type: String, enum: ["active", "expired"], default: "active" },
      expiresAt: { type: Date },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Stamp the trial end date once, at creation, so it's explicit and persisted
// rather than only ever being computed on the fly.
BusinessSchema.pre("save", function (next) {
  if (this.isNew && !this.trialEndsAt) {
    this.trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  }
  next();
});

export default models.Business || model<IBusiness>("Business", BusinessSchema);