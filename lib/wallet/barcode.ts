import type { BarcodeStyle } from "@/types";

export function googleBarcodeType(style: BarcodeStyle | undefined): "QR_CODE" | "PDF_417" {
  return style === "pdf417" ? "PDF_417" : "QR_CODE";
}

export function appleBarcodeFormat(style: BarcodeStyle | undefined): "PKBarcodeFormatQR" | "PKBarcodeFormatPDF417" {
  return style === "pdf417" ? "PKBarcodeFormatPDF417" : "PKBarcodeFormatQR";
}
