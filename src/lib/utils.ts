export function generateBarcodeValue(): string {
  // 12-digit numeric code (UPC-A compatible length), time-based + random for uniqueness
  const time = Date.now().toString().slice(-8);
  const rand = Math.floor(100 + Math.random() * 900);
  return `2${time}${rand}`.slice(0, 12);
}

export function generateReceiptNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RCT-${y}${m}${day}-${rand}`;
}

export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${base}-${rand}`;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function whatsappShareUrl(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const withCountryCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
