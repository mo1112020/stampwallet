export type PrintLocale = "en" | "ar";

export const PRINT_COPY: Record<PrintLocale, {
  scanToJoin: string;
  addToWallet: string;
  instructions: string;
  poweredBy: string;
  joinTheProgram: string;
}> = {
  en: {
    scanToJoin: "Scan to join",
    addToWallet: "Add to your phone wallet",
    instructions: "Scan the code with your phone camera to add your card — no app to download.",
    poweredBy: "Powered by StampWallet",
    joinTheProgram: "Join our loyalty program",
  },
  ar: {
    scanToJoin: "امسح للانضمام",
    addToWallet: "أضف البطاقة إلى محفظة هاتفك",
    instructions: "امسح الرمز بكاميرا هاتفك لإضافة بطاقتك — بلا تحميل تطبيق.",
    poweredBy: "بواسطة StampWallet",
    joinTheProgram: "انضم إلى برنامج الولاء",
  },
};
