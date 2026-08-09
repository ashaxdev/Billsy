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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    try {
      JsBarcode(canvasRef.current, value, {
        format: "CODE128",
        lineColor: "#16202b",
        background: "#ffffff",
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

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}