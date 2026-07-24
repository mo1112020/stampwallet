import { toPng } from "html-to-image";
import jsPDF from "jspdf";

/** Filter out browser extension-injected attributes/styles that html-to-image can choke on. */
const EXPORT_OPTS = { cacheBust: true, skipFonts: false };

export async function exportNodeAsPng(node: HTMLElement, filename: string, pixelRatio = 3) {
  const dataUrl = await toPng(node, { ...EXPORT_OPTS, pixelRatio });
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/** widthMm/heightMm describe the physical print size; the node's own pixel size only affects resolution. */
export async function exportNodeAsPdf(
  node: HTMLElement,
  filename: string,
  widthMm: number,
  heightMm: number,
  pixelRatio = 3
) {
  const dataUrl = await toPng(node, { ...EXPORT_OPTS, pixelRatio });
  const pdf = new jsPDF({
    orientation: widthMm >= heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, widthMm, heightMm);
  pdf.save(filename);
}
