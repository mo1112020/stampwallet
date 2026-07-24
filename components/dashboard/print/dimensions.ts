export type TemplateId =
  | "a4Poster"
  | "counterStand"
  | "tableTent"
  | "flyer"
  | "windowSticker"
  | "qrOnly"
  | "socialSquare"
  | "instagramStory";

export type TemplateDimension = {
  widthPx: number;
  heightPx: number;
  widthMm?: number;
  heightMm?: number;
  kind: "print" | "digital";
};

export const TEMPLATE_DIMENSIONS: Record<TemplateId, TemplateDimension> = {
  a4Poster: { widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297, kind: "print" },
  counterStand: { widthPx: 384, heightPx: 576, widthMm: 101.6, heightMm: 152.4, kind: "print" },
  tableTent: { widthPx: 384, heightPx: 384, widthMm: 101.6, heightMm: 101.6, kind: "print" },
  flyer: { widthPx: 559, heightPx: 794, widthMm: 148, heightMm: 210, kind: "print" },
  windowSticker: { widthPx: 384, heightPx: 384, widthMm: 101.6, heightMm: 101.6, kind: "print" },
  qrOnly: { widthPx: 384, heightPx: 576, widthMm: 101.6, heightMm: 152.4, kind: "print" },
  socialSquare: { widthPx: 1080, heightPx: 1080, kind: "digital" },
  instagramStory: { widthPx: 1080, heightPx: 1920, kind: "digital" },
};
