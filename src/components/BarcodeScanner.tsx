"use client";

import { useEffect, useRef, useState } from "react";

const REGION_ID = "billsy-barcode-scanner-region";

export default function BarcodeScanner({
  onScan,
  onClose,
}: {
  onScan: (value: string) => void;
  onClose: () => void;
}) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastScanRef = useRef<{ value: string; time: number }>({ value: "", time: 0 });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 140 } },
          (decodedText) => {
            const now = Date.now();
            // debounce duplicate reads of the same barcode within 1.5s
            if (lastScanRef.current.value === decodedText && now - lastScanRef.current.time < 1500) {
              return;
            }
            lastScanRef.current = { value: decodedText, time: now };
            onScan(decodedText);
          },
          () => {
            // per-frame decode failures are expected while aiming — ignore
          }
        );
      } catch {
        setError("Camera access failed. Check permissions and try again.");
      }
    })();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 text-paper">
        <span className="font-display text-sm tracking-wide uppercase">Scan barcode</span>
        <button
          onClick={onClose}
          className="rounded-full border border-paper/30 px-3 py-1 text-xs hover:bg-paper/10"
        >
          Close
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border-2 border-amber">
          <div id={REGION_ID} className="w-full" />
        </div>
      </div>
      <div className="px-6 pb-8 text-center text-xs text-paper/70">
        {error ? error : "Hold the barcode steady inside the frame"}
      </div>
    </div>
  );
}
