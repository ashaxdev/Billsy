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
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    defaultTaxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    trialEndsAt: {
      type: Date,
    },
    plan: {
      tier: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },
      cycle: {
        type: String,
        enum: ["monthly", "yearly"],
      },
      status: {
        type: String,
        enum: ["active", "expired"],
        default: "active",
      },
      expiresAt: {
        type: Date,
      },
      razorpayOrderId: {
        type: String,
      },
      razorpayPaymentId: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Automatically set the trial period for new businesses
BusinessSchema.pre("save", function () {
  if (this.isNew && !this.trialEndsAt) {
    this.trialEndsAt = new Date(
      Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000
    );
  }
});

const Business =
  models.Business || model<IBusiness>("Business", BusinessSchema);

export default Business;