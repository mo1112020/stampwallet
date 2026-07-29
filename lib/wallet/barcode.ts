import type { BarcodeStyle } from "@/types";

export function googleBarcodeType(style: BarcodeStyle | undefined): "QR_CODE" | "CODE_128" {
  return style === "code128" ? "CODE_128" : "QR_CODE";
}

export function appleBarcodeFormat(style: BarcodeStyle | undefined): "PKBarcodeFormatQR" | "PKBarcodeFormatCode128" {
  return style === "code128" ? "PKBarcodeFormatCode128" : "PKBarcodeFormatQR";
}
