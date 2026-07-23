"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function BarcodeCanvas({
  value,
  height = 60,
  width = 2,
  fontSize = 14,
  className = "",
}: {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        lineColor: "#16202b",
        background: "transparent",
        width,
        height,
        fontSize,
        fontOptions: "",
        font: "monospace",
        margin: 4,
      });
    } catch {
      // invalid barcode value, ignore render
    }
  }, [value, height, width, fontSize]);

  return <svg ref={svgRef} className={className} />;
}
