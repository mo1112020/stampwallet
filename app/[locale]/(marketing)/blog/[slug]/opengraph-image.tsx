import { renderBlogCard, OG_SIZE } from "@/lib/og/blog-card";
import { getPost } from "@/content/blog/manifest";
import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

const MESSAGES = { en, ar } as const;

export const alt = "WalletOS Blog";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);
  const eyebrow = MESSAGES[locale as "en" | "ar"]?.site.blog.eyebrow ?? MESSAGES.en.site.blog.eyebrow;

  return renderBlogCard({ eyebrow, title: post?.title ?? "WalletOS", locale });
}
