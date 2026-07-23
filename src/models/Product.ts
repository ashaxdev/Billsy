import { Schema, models, model, Types } from "mongoose";

export interface IProduct {
  _id: string;
  businessId: Types.ObjectId;
  name: string;
  barcode: string;
  price: number;
  stock: number;
  category?: string;
  imageUrl?: string;
  imagePublicId?: string;
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    name: { type: String, required: true, trim: true },
    barcode: { type: String, required: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    category: { type: String, trim: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

ProductSchema.index({ businessId: 1, name: "text" });

export default models.Product || model<IProduct>("Product", ProductSchema);
