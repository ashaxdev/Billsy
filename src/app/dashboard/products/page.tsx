import type { Metadata } from "next";
import ProductManager from "@/components/ProductManager";

export const metadata: Metadata = {
  title: "Products",
};

export default function ProductsPage() {
  return <ProductManager />;
}
