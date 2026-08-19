import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";

type Section = { heading: string; paragraphs?: string[]; bullets?: string[] };

const LAST_UPDATED = "August 19, 2026";

const EN: { eyebrow: string; title: string; description: string; sections: Section[] } = {
  eyebrow: "Legal",
  title: "Privacy Policy",
  description: `Last updated: ${LAST_UPDATED}`,
  sections: [
    {
      heading: "1. Who we are",
      paragraphs: [
        "WalletOS (walletos.online) is a loyalty platform that lets merchants create stamp card, points, and reward-journey programs their customers add to Apple Wallet or Google Wallet -- no separate app, no customer account or login.",
        "WalletOS is currently operated by its founder, Ahmed Mekled, as a pre-launch product. This policy will be updated with formal company details once the operating entity is registered.",
      ],
    },
    {
      heading: "2. Information we collect",
      paragraphs: [
        "If you're a merchant using WalletOS to run a loyalty program:",
      ],
      bullets: [
        "Account information: business name, email, phone (optional), industry, and login credentials (via Supabase Auth).",
        "Billing information: processed directly by Stripe. WalletOS never sees or stores your card number -- only what Stripe returns, such as subscription status and invoice history.",
        "Business assets you upload: logo, brand colors, store locations, and loyalty program configuration.",
        "Staff you invite: name and email of any team members you add, and the role you assign them.",
      ],
    },
    {
      heading: "",
      paragraphs: ["If you're a customer enrolling in a merchant's loyalty program through WalletOS:"],
      bullets: [
        "Whatever the merchant's enrollment form asks for -- typically name, phone number, and/or email. Birthday is only collected if the merchant's program uses it.",
        "Your stamp/point/reward progress, and the timestamps of each scan or redemption.",
        "A device identifier and push token from Apple Wallet or Google Wallet, used only to deliver updates to your pass (a new stamp, a reward unlocked, etc.).",
        "No account or password is ever created for you. Everything happens through the wallet pass itself.",
      ],
    },
    {
      heading: "3. How we use information",
      bullets: [
        "To operate the loyalty program you're enrolled in or managing -- tracking progress, issuing rewards, and keeping your wallet pass up to date.",
        "To send wallet-native notifications (a stamp was added, a reward is ready) directly through Apple Wallet / Google Wallet -- WalletOS does not send loyalty notifications by email or SMS.",
        "To send transactional emails to merchants (account, billing, invitations) via our email provider, Resend.",
        "To process merchant subscription billing via Stripe.",
        "To prevent abuse -- for example, rate-limiting enrollment and scan endpoints against automated attacks.",
        "To provide merchants with analytics about their own program's performance.",
      ],
    },
    {
      heading: "4. Who we share information with",
      paragraphs: [
        "We don't sell personal information, ever. We share information only with the service providers necessary to run WalletOS, each of whom only receives what they need to perform their function:",
      ],
      bullets: [
        "Supabase -- our database, authentication, and file storage provider. Data is hosted in the EU (eu-west-1 / Ireland).",
        "Stripe -- payment processing for merchant subscriptions.",
        "Resend -- transactional email delivery.",
        "Apple Inc. and Google LLC -- required to issue and update Apple Wallet / Google Wallet passes. Apple and Google's own privacy policies govern how they handle wallet pass data on-device.",
        "Vercel -- application hosting. Our functions are pinned to the Dublin (dub1) region to keep processing close to where the data is stored.",
      ],
    },
    {
      heading: "5. Where information is stored",
      paragraphs: [
        "WalletOS's infrastructure is hosted in the European Union (Ireland). We chose this deliberately to keep data handling consistent regardless of where a merchant or their customers are located.",
      ],
    },
    {
      heading: "6. How long we keep information",
      paragraphs: [
        "We keep merchant and customer data for as long as the merchant's account is active. If a merchant deletes their account, their business data and every enrolled customer's progress, scan history, and redemption records are permanently deleted -- this cascades automatically and cannot be undone, so we ask merchants to export any data they want to keep first.",
      ],
    },
    {
      heading: "7. Your rights",
      paragraphs: [
        "If you're in the EU/EEA, UK, or a jurisdiction with similar protections, you have the right to access, correct, delete, or export your personal information, and to object to certain processing. Merchants can exercise these rights directly for their own account, or manage them on behalf of an enrolled customer at that customer's request (merchants are the primary point of contact for their own customers' data).",
        "To make a request, contact us using the details in Section 10.",
      ],
    },
    {
      heading: "8. Cookies",
      paragraphs: [
        "WalletOS uses only the cookies necessary to keep you signed in (via Supabase Auth session cookies). We do not currently use third-party analytics or advertising cookies.",
      ],
    },
    {
      heading: "9. Children's privacy",
      paragraphs: [
        "WalletOS is intended for use by businesses and their adult customers. It is not directed at children, and we do not knowingly collect personal information from anyone under 16.",
      ],
    },
    {
      heading: "10. Contact us",
      paragraphs: [
        "Questions about this policy or your data: support@walletos.online, or message us on WhatsApp from our Support page.",
      ],
    },
    {
      heading: "11. Changes to this policy",
      paragraphs: [
        "We'll update this page as WalletOS evolves -- including once the operating company is formally registered. Material changes will be reflected in the \"Last updated\" date above.",
      ],
    },
  ],
};

const AR: { eyebrow: string; title: string; description: string; sections: Section[] } = {
  eyebrow: "قانوني",
  title: "سياسة الخصوصية",
  description: `آخر تحديث: ${LAST_UPDATED}`,
  sections: [
    {
      heading: "١. من نحن",
      paragraphs: [
        "WalletOS (walletos.online) هي منصة ولاء تتيح للتجار إنشاء برامج بطاقات الأختام والنقاط ورحلات المكافآت التي يضيفها عملاؤهم إلى Apple Wallet أو Google Wallet -- دون تطبيق منفصل، ودون حساب أو تسجيل دخول للعميل.",
        "يُدار WalletOS حاليًا من قِبل مؤسسه، أحمد مقلد، كمنتج في مرحلة ما قبل الإطلاق. سيتم تحديث هذه السياسة بالتفاصيل الرسمية للشركة بعد تسجيل الكيان المشغّل.",
      ],
    },
    {
      heading: "٢. المعلومات التي نجمعها",
      paragraphs: ["إذا كنت تاجرًا يستخدم WalletOS لإدارة برنامج ولاء:"],
      bullets: [
        "معلومات الحساب: اسم النشاط التجاري، البريد الإلكتروني، الهاتف (اختياري)، المجال، وبيانات تسجيل الدخول (عبر Supabase Auth).",
        "معلومات الفوترة: تُعالَج مباشرة عبر Stripe. لا يرى WalletOS أو يخزّن رقم بطاقتك أبدًا -- فقط ما يُعيده Stripe، مثل حالة الاشتراك وسجل الفواتير.",
        "أصول العمل التي تُحمّلها: الشعار، ألوان العلامة التجارية، مواقع الفروع، وإعدادات برنامج الولاء.",
        "الموظفون الذين تدعوهم: اسم وبريد أي عضو فريق تضيفه، والدور الذي تسنده له.",
      ],
    },
    {
      heading: "",
      paragraphs: ["إذا كنت عميلًا تسجّل في برنامج ولاء تابع لتاجر عبر WalletOS:"],
      bullets: [
        "أيًا كان ما يطلبه نموذج التسجيل الخاص بالتاجر -- عادةً الاسم، رقم الهاتف، و/أو البريد الإلكتروني. يُجمع تاريخ الميلاد فقط إذا كان برنامج التاجر يستخدمه.",
        "تقدمك في الأختام/النقاط/المكافآت، وأوقات كل عملية مسح أو استبدال.",
        "معرّف جهاز ورمز إشعارات من Apple Wallet أو Google Wallet، يُستخدم فقط لتحديث بطاقتك (ختم جديد، مكافأة مفتوحة، إلخ).",
        "لا يُنشأ لك أي حساب أو كلمة مرور مطلقًا. كل شيء يحدث عبر بطاقة المحفظة نفسها.",
      ],
    },
    {
      heading: "٣. كيف نستخدم المعلومات",
      bullets: [
        "لتشغيل برنامج الولاء الذي أنت مسجّل فيه أو تديره -- تتبع التقدم، منح المكافآت، وتحديث بطاقة محفظتك.",
        "لإرسال إشعارات عبر المحفظة مباشرة (ختم جديد، مكافأة جاهزة) من خلال Apple Wallet / Google Wallet -- لا يرسل WalletOS إشعارات الولاء عبر البريد الإلكتروني أو الرسائل النصية.",
        "لإرسال رسائل بريد إلكتروني تشغيلية للتجار (الحساب، الفوترة، الدعوات) عبر مزوّد البريد لدينا، Resend.",
        "لمعالجة فوترة اشتراك التاجر عبر Stripe.",
        "لمنع إساءة الاستخدام -- مثل تقييد معدل نقاط النهاية للتسجيل والمسح ضد الهجمات الآلية.",
        "لتزويد التجار بتحليلات حول أداء برنامجهم الخاص.",
      ],
    },
    {
      heading: "٤. مع من نشارك المعلومات",
      paragraphs: [
        "لا نبيع المعلومات الشخصية أبدًا. نشارك المعلومات فقط مع مزودي الخدمة الضروريين لتشغيل WalletOS، ولا يحصل كل منهم إلا على ما يلزمه لأداء وظيفته:",
      ],
      bullets: [
        "Supabase -- مزوّد قاعدة البيانات والمصادقة وتخزين الملفات. تُستضاف البيانات في الاتحاد الأوروبي (eu-west-1 / أيرلندا).",
        "Stripe -- معالجة المدفوعات لاشتراكات التجار.",
        "Resend -- إرسال البريد الإلكتروني التشغيلي.",
        "Apple Inc. و Google LLC -- ضروريان لإصدار وتحديث بطاقات Apple Wallet / Google Wallet. تحكم سياسات خصوصية Apple و Google الخاصة بهما كيفية تعاملهما مع بيانات بطاقة المحفظة على الجهاز.",
        "Vercel -- استضافة التطبيق. وظائفنا مثبّتة على منطقة دبلن (dub1) لإبقاء المعالجة قريبة من مكان تخزين البيانات.",
      ],
    },
    {
      heading: "٥. أين تُخزَّن المعلومات",
      paragraphs: [
        "تُستضاف بنية WalletOS التحتية في الاتحاد الأوروبي (أيرلندا). اخترنا ذلك عن قصد للحفاظ على تعامل ثابت مع البيانات بغض النظر عن مكان وجود التاجر أو عملائه.",
      ],
    },
    {
      heading: "٦. مدة الاحتفاظ بالمعلومات",
      paragraphs: [
        "نحتفظ ببيانات التاجر والعميل طالما كان حساب التاجر نشطًا. إذا حذف التاجر حسابه، تُحذف بيانات نشاطه التجاري وتقدم كل عميل مسجّل وسجل المسح والاستبدال نهائيًا -- يحدث هذا تلقائيًا ولا يمكن التراجع عنه، لذا نطلب من التجار تصدير أي بيانات يرغبون بالاحتفاظ بها أولاً.",
      ],
    },
    {
      heading: "٧. حقوقك",
      paragraphs: [
        "إذا كنت في الاتحاد الأوروبي/المنطقة الاقتصادية الأوروبية، أو المملكة المتحدة، أو ولاية قضائية ذات حماية مماثلة، يحق لك الوصول إلى معلوماتك الشخصية أو تصحيحها أو حذفها أو تصديرها، والاعتراض على معالجة معينة. يمكن للتجار ممارسة هذه الحقوق مباشرة لحسابهم الخاص، أو إدارتها نيابة عن عميل مسجّل بناءً على طلب ذلك العميل (التجار هم جهة الاتصال الأساسية لبيانات عملائهم).",
        "لتقديم طلب، تواصل معنا عبر التفاصيل في القسم ١٠.",
      ],
    },
    {
      heading: "٨. ملفات تعريف الارتباط",
      paragraphs: [
        "يستخدم WalletOS فقط ملفات تعريف الارتباط الضرورية لإبقائك مسجّل الدخول (عبر ملفات جلسة Supabase Auth). لا نستخدم حاليًا ملفات تعريف ارتباط تحليلية أو إعلانية من جهات خارجية.",
      ],
    },
    {
      heading: "٩. خصوصية الأطفال",
      paragraphs: [
        "WalletOS مخصص للاستخدام من قِبل الشركات وعملائها البالغين. وهو غير موجّه للأطفال، ولا نجمع عن قصد معلومات شخصية من أي شخص دون سن ١٦ عامًا.",
      ],
    },
    {
      heading: "١٠. تواصل معنا",
      paragraphs: [
        "أسئلة حول هذه السياسة أو بياناتك: support@walletos.online، أو راسلنا عبر واتساب من صفحة الدعم.",
      ],
    },
    {
      heading: "١١. تغييرات على هذه السياسة",
      paragraphs: [
        "سنحدّث هذه الصفحة مع تطور WalletOS -- بما في ذلك بعد التسجيل الرسمي للشركة المشغّلة. ستنعكس التغييرات الجوهرية في تاريخ \"آخر تحديث\" أعلاه.",
      ],
    },
  ],
};

const SEO_DESCRIPTION_EN =
  "How WalletOS collects, uses, and protects merchant and customer data across our loyalty platform.";
const SEO_DESCRIPTION_AR = "كيف يجمع WalletOS بيانات التجار والعملاء ويستخدمها ويحميها عبر منصة الولاء لدينا.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = locale === "ar" ? AR : EN;
  return {
    title: content.title,
    description: locale === "ar" ? SEO_DESCRIPTION_AR : SEO_DESCRIPTION_EN,
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const content = locale === "ar" ? AR : EN;

  return (
    <main>
      <PageHero eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-10">
          {content.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2 className="text-xl font-semibold text-[var(--ink)]">{section.heading}</h2>
              )}
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
                  {p}
                </p>
              ))}
              {section.bullets && (
                <ul className="mt-3 list-disc space-y-2 ps-5 text-[15px] leading-relaxed text-[var(--muted)]">
                  {section.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
