import { Schema, models, model, Types } from "mongoose";

export interface IOrderItem {
  productId?: Types.ObjectId;
  name: string;
  barcode: string;
  price: number;
  qty: number;
  discountType?: "percent" | "flat";
  discountValue?: number;
}

export interface IOrder {
  _id: string;
  businessId: Types.ObjectId;
  receiptNumber: string;
  items: IOrderItem[];
  subtotal: number;
  itemDiscountsTotal: number;
  billDiscountType: "percent" | "flat";
  billDiscountAmount: number;
  taxableAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  customerName?: string;
  customerPhone?: string;
  paymentMode: "cash" | "upi" | "card" | "other";
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    barcode: { type: String, required: true },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    discountType: { type: String, enum: ["percent", "flat"], default: "percent" },
    discountValue: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    receiptNumber: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    itemDiscountsTotal: { type: Number, default: 0 },
    billDiscountType: { type: String, enum: ["percent", "flat"], default: "percent" },
    billDiscountAmount: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    customerName: { type: String },
    customerPhone: { type: String },
    paymentMode: { type: String, enum: ["cash", "upi", "card", "other"], default: "cash" },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default models.Order || model<IOrder>("Order", OrderSchema);