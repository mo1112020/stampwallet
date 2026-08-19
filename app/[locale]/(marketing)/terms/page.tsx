import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { buildPageMetadata } from "@/lib/seo/metadata";

type Section = { heading: string; paragraphs?: string[]; bullets?: string[] };

const LAST_UPDATED = "August 19, 2026";

const EN: { eyebrow: string; title: string; description: string; sections: Section[] } = {
  eyebrow: "Legal",
  title: "Terms of Service",
  description: `Last updated: ${LAST_UPDATED}`,
  sections: [
    {
      heading: "1. Agreement to these terms",
      paragraphs: [
        "By creating a WalletOS account or using walletos.online, you agree to these Terms of Service. If you're signing up on behalf of a business, you're confirming you have the authority to bind that business to these terms.",
      ],
    },
    {
      heading: "2. What WalletOS is",
      paragraphs: [
        "WalletOS is a loyalty platform: merchants create stamp card, points, or reward-journey programs; their customers add a digital pass to Apple Wallet or Google Wallet to participate. WalletOS does not require customers to create an account, download an app, or provide payment information to enroll in a merchant's program.",
      ],
    },
    {
      heading: "3. Accounts and staff",
      paragraphs: [
        "You're responsible for keeping your account credentials secure and for all activity under your account. If you invite staff members, you're responsible for the roles and permissions you assign them, and for removing access when it's no longer needed.",
      ],
    },
    {
      heading: "4. Your customers' data",
      paragraphs: [
        "When you enroll a customer in your loyalty program, you are the data controller for that customer's information -- you're responsible for having a lawful basis to collect it and for honoring any request that customer makes about their data. WalletOS acts as your data processor: we store and process that information only to operate the service on your behalf, per our Privacy Policy.",
      ],
    },
    {
      heading: "5. Subscription plans and billing",
      bullets: [
        "WalletOS offers a Free plan and paid Starter/Pro plans, billed monthly, quarterly, or yearly, plus an Enterprise plan by custom agreement. Current pricing is shown on our Pricing page.",
        "Paid subscriptions are billed in advance and processed by Stripe. By subscribing, you authorize us to charge your payment method on a recurring basis until you cancel.",
        "You can cancel anytime from your dashboard; your plan remains active until the end of the current billing period.",
        "If a payment fails and isn't resolved, we may suspend certain features (per the limits of your last active plan) until billing is resolved -- we'll always try to notify you first.",
      ],
    },
    {
      heading: "6. Acceptable use",
      paragraphs: ["You agree not to use WalletOS to:"],
      bullets: [
        "Collect customer data you don't have a legitimate right to collect, or use it for anything beyond running your loyalty program without that customer's consent.",
        "Send spam, misleading, or abusive notifications to enrolled customers.",
        "Attempt to circumvent rate limits, security controls, or plan limits.",
        "Use the service for any unlawful purpose.",
      ],
    },
    {
      heading: "7. Intellectual property",
      paragraphs: [
        "WalletOS and its underlying software remain our property. You retain all rights to your own business name, logo, brand assets, and program content that you upload -- you're granting us only the license needed to display and process it as part of operating your loyalty program.",
      ],
    },
    {
      heading: "8. Termination",
      paragraphs: [
        "You can delete your account at any time from Settings -- this permanently and immediately deletes your business data and every enrolled customer's records, and cannot be undone. We may suspend or terminate accounts that violate these terms, with notice where reasonably possible.",
      ],
    },
    {
      heading: "9. Service availability",
      paragraphs: [
        "We aim to keep WalletOS available and reliable, but we don't guarantee uninterrupted access. Some wallet-pass features depend on Apple's and Google's own services being available, which is outside our control.",
      ],
    },
    {
      heading: "10. Disclaimer and limitation of liability",
      paragraphs: [
        "WalletOS is provided \"as is,\" without warranties of any kind, express or implied. To the maximum extent permitted by law, WalletOS is not liable for indirect, incidental, or consequential damages arising from your use of the service. Our total liability for any claim is limited to the amount you paid us in the 3 months before the claim arose.",
      ],
    },
    {
      heading: "11. Governing law",
      paragraphs: [
        "WalletOS's operating company is not yet formally registered. The governing law and jurisdiction for these terms will be specified here once that registration is complete, and this section will be updated accordingly -- if you have questions in the meantime, contact us directly.",
      ],
    },
    {
      heading: "12. Changes to these terms",
      paragraphs: [
        "We may update these terms as WalletOS evolves. We'll update the \"Last updated\" date above when we do, and for material changes, we'll make a reasonable effort to notify active merchants directly.",
      ],
    },
    {
      heading: "13. Contact us",
      paragraphs: [
        "Questions about these terms: support@walletos.online, or message us on WhatsApp from our Support page.",
      ],
    },
  ],
};

const AR: { eyebrow: string; title: string; description: string; sections: Section[] } = {
  eyebrow: "قانوني",
  title: "شروط الخدمة",
  description: `آخر تحديث: ${LAST_UPDATED}`,
  sections: [
    {
      heading: "١. الموافقة على هذه الشروط",
      paragraphs: [
        "بإنشائك حساب WalletOS أو استخدامك لـ walletos.online، فإنك توافق على شروط الخدمة هذه. إذا كنت تسجّل نيابة عن نشاط تجاري، فإنك تؤكد أن لديك الصلاحية لإلزام ذلك النشاط بهذه الشروط.",
      ],
    },
    {
      heading: "٢. ما هو WalletOS",
      paragraphs: [
        "WalletOS منصة ولاء: ينشئ التجار برامج بطاقات أختام أو نقاط أو رحلات مكافآت؛ ويضيف عملاؤهم بطاقة رقمية إلى Apple Wallet أو Google Wallet للمشاركة. لا يتطلب WalletOS من العملاء إنشاء حساب أو تحميل تطبيق أو تقديم معلومات دفع للتسجيل في برنامج التاجر.",
      ],
    },
    {
      heading: "٣. الحسابات والموظفون",
      paragraphs: [
        "أنت مسؤول عن الحفاظ على أمان بيانات اعتماد حسابك وعن جميع الأنشطة ضمن حسابك. إذا دعوت أعضاء فريق، فأنت مسؤول عن الأدوار والصلاحيات التي تسندها لهم، وعن إزالة الوصول عندما لا تعود هناك حاجة إليه.",
      ],
    },
    {
      heading: "٤. بيانات عملائك",
      paragraphs: [
        "عند تسجيل عميل في برنامج الولاء الخاص بك، فأنت المتحكم في بيانات ذلك العميل -- أنت مسؤول عن وجود أساس قانوني لجمعها وعن تلبية أي طلب يقدمه ذلك العميل بشأن بياناته. يعمل WalletOS كمعالج بيانات نيابة عنك: نخزّن ونعالج تلك المعلومات فقط لتشغيل الخدمة نيابة عنك، وفقًا لسياسة الخصوصية الخاصة بنا.",
      ],
    },
    {
      heading: "٥. خطط الاشتراك والفوترة",
      bullets: [
        "يقدم WalletOS خطة مجانية وخطط Starter/Pro مدفوعة، تُفوتر شهريًا أو ربع سنوي أو سنويًا، بالإضافة إلى خطة Enterprise باتفاق مخصص. تظهر الأسعار الحالية في صفحة الأسعار لدينا.",
        "تُفوتر الاشتراكات المدفوعة مقدمًا وتُعالَج عبر Stripe. بالاشتراك، فإنك تخوّلنا بخصم وسيلة الدفع الخاصة بك بشكل متكرر حتى تُلغي الاشتراك.",
        "يمكنك الإلغاء في أي وقت من لوحة التحكم؛ تبقى خطتك نشطة حتى نهاية فترة الفوترة الحالية.",
        "إذا فشلت عملية دفع ولم تُحل، فقد نُعلّق بعض الميزات (وفق حدود آخر خطة نشطة لديك) حتى تُحل الفوترة -- سنحاول دائمًا إخطارك أولاً.",
      ],
    },
    {
      heading: "٦. الاستخدام المقبول",
      paragraphs: ["توافق على عدم استخدام WalletOS من أجل:"],
      bullets: [
        "جمع بيانات عملاء ليس لديك حق مشروع في جمعها، أو استخدامها لأي غرض يتجاوز تشغيل برنامج الولاء دون موافقة ذلك العميل.",
        "إرسال إشعارات مزعجة أو مضللة أو تعسفية للعملاء المسجّلين.",
        "محاولة تجاوز حدود المعدل، أو الضوابط الأمنية، أو حدود الخطة.",
        "استخدام الخدمة لأي غرض غير قانوني.",
      ],
    },
    {
      heading: "٧. الملكية الفكرية",
      paragraphs: [
        "يبقى WalletOS والبرمجيات الأساسية له ملكًا لنا. تحتفظ بجميع الحقوق في اسم نشاطك التجاري وشعارك وأصول علامتك التجارية ومحتوى برنامجك الذي تُحمّله -- وأنت تمنحنا فقط الترخيص اللازم لعرضها ومعالجتها كجزء من تشغيل برنامج الولاء الخاص بك.",
      ],
    },
    {
      heading: "٨. الإنهاء",
      paragraphs: [
        "يمكنك حذف حسابك في أي وقت من الإعدادات -- يؤدي هذا إلى حذف بيانات نشاطك التجاري وسجلات كل عميل مسجّل بشكل نهائي وفوري، ولا يمكن التراجع عنه. قد نُعلّق أو نُنهي الحسابات التي تنتهك هذه الشروط، مع إشعار حيثما أمكن ذلك بشكل معقول.",
      ],
    },
    {
      heading: "٩. توفر الخدمة",
      paragraphs: [
        "نسعى للحفاظ على توفر WalletOS وموثوقيته، لكننا لا نضمن وصولاً دون انقطاع. تعتمد بعض ميزات بطاقة المحفظة على توفر خدمات Apple و Google الخاصة، وهو أمر خارج عن سيطرتنا.",
      ],
    },
    {
      heading: "١٠. إخلاء المسؤولية وتحديد المسؤولية",
      paragraphs: [
        "يُقدَّم WalletOS \"كما هو\"، دون أي ضمانات من أي نوع، صريحة أو ضمنية. إلى أقصى حد يسمح به القانون، لا يكون WalletOS مسؤولاً عن الأضرار غير المباشرة أو العرضية أو التبعية الناشئة عن استخدامك للخدمة. تقتصر مسؤوليتنا الإجمالية عن أي مطالبة على المبلغ الذي دفعته لنا خلال الأشهر الثلاثة السابقة لنشوء المطالبة.",
      ],
    },
    {
      heading: "١١. القانون الحاكم",
      paragraphs: [
        "لم تُسجَّل الشركة المشغّلة لـ WalletOS رسميًا بعد. سيُحدَّد القانون الحاكم والاختصاص القضائي لهذه الشروط هنا بمجرد اكتمال ذلك التسجيل، وسيُحدَّث هذا القسم وفقًا لذلك -- إذا كانت لديك أسئلة في هذه الأثناء، تواصل معنا مباشرة.",
      ],
    },
    {
      heading: "١٢. تغييرات على هذه الشروط",
      paragraphs: [
        "قد نُحدّث هذه الشروط مع تطور WalletOS. سنُحدّث تاريخ \"آخر تحديث\" أعلاه عند القيام بذلك، وبالنسبة للتغييرات الجوهرية، سنبذل جهدًا معقولاً لإخطار التجار النشطين مباشرة.",
      ],
    },
    {
      heading: "١٣. تواصل معنا",
      paragraphs: [
        "أسئلة حول هذه الشروط: support@walletos.online، أو راسلنا عبر واتساب من صفحة الدعم.",
      ],
    },
  ],
};

const SEO_DESCRIPTION_EN =
  "The terms that govern using WalletOS as a merchant, including billing, acceptable use, and account termination.";
const SEO_DESCRIPTION_AR = "الشروط التي تحكم استخدام WalletOS كتاجر، بما في ذلك الفوترة والاستخدام المقبول وإنهاء الحساب.";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const content = locale === "ar" ? AR : EN;
  return buildPageMetadata({
    locale,
    path: "terms",
    title: content.title,
    description: locale === "ar" ? SEO_DESCRIPTION_AR : SEO_DESCRIPTION_EN,
  });
}

export default async function TermsPage({
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
