import mongoose, { Schema, models, model } from "mongoose";

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
  plan: {
    tier: "free" | "pro";
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
    plan: {
      tier: { type: String, enum: ["free", "pro"], default: "free" },
      status: { type: String, enum: ["active", "expired"], default: "active" },
      expiresAt: { type: Date },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default models.Business || model<IBusiness>("Business", BusinessSchema);
