import Razorpay from "razorpay";

let instance: Razorpay | null = null;

export function getRazorpay() {
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID as string,
      key_secret: process.env.RAZORPAY_KEY_SECRET as string,
    });
  }
  return instance;
}

export const PRO_PLAN_PRICE_INR = 499; // per month
export const PRO_PLAN_YEARLY_PRICE_INR = 5000; // per year (~17% cheaper than 12x monthly)