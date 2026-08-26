import type { MDXComponents } from "mdx/types";
import Link from "next/link";

/**
 * Required by @next/mdx for App Router (see node_modules/next/dist/docs/
 * 01-app/02-guides/mdx.md). Styled by hand against the site's existing
 * "Stamp & Verdict" CSS custom properties (app/globals.css .ws-stamp) rather
 * than the Tailwind Typography plugin — that plugin isn't installed anywhere
 * else in this project, and hand-mapping keeps blog prose visually identical
 * to the rest of the marketing site instead of introducing a second look.
 */
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2 className="mt-12 text-2xl font-[900] tracking-tight text-[var(--ink)] md:text-3xl">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-8 text-xl font-bold text-[var(--ink)]">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-relaxed text-[var(--ink)]">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 ps-6 text-base leading-relaxed text-[var(--ink)]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 ps-6 text-base leading-relaxed text-[var(--ink)]">{children}</ol>
  ),
  li: ({ children }) => <li className="marker:text-[var(--primary)]">{children}</li>,
  a: ({ href, children }) => {
    const isInternal = typeof href === "string" && href.startsWith("/");
    if (isInternal) {
      return (
        <Link href={href} className="font-semibold text-[var(--primary)] underline underline-offset-2">
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[var(--primary)] underline underline-offset-2"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-s-4 border-[var(--primary)] bg-[var(--surface-2)] px-5 py-4 text-[var(--ink)]">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => <strong className="font-bold text-[var(--ink)]">{children}</strong>,
  hr: () => <hr className="ws-perforated mt-10 border-0" />,
  code: ({ children }) => (
    <code className="rounded-none bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[0.9em] text-[var(--ink)]">
      {children}
    </code>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
