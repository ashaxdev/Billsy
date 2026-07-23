import type { Metadata } from "next";
import BillingCounter from "@/components/BillingCounter";

export const metadata: Metadata = {
  title: "Bill now",
};

export default function BillingPage() {
  return <BillingCounter />;
}
