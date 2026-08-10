import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { handwrittenFont } from "@/lib/fonts/handwritten";

export interface PricingTier {
  name: string;
  icon: React.ReactNode;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular?: boolean;
}

/**
 * Sketchy/doodle pricing cards — rotated, hard comic-shadow borders, sticker
 * "Popular!" badge. Colors are pulled from the app's design tokens (--ink,
 * --surface, --primary, --warning, --muted) rather than a fixed palette, so
 * this follows the same light/dark theme everything else in the app does.
 */
export function CreativePricing({
  tag = "Simple Pricing",
  title,
  description,
  tiers,
}: {
  tag?: string;
  title: string;
  description: string;
  tiers: PricingTier[];
}) {
  return (
    <div className={cn(handwrittenFont.variable, "w-full max-w-6xl mx-auto px-4")}>
      <div className="relative text-center space-y-6 mb-16">
        <div className="font-handwritten text-xl text-[var(--primary)] rotate-[-1deg]">{tag}</div>
        <div className="relative">
          <h2 className="font-handwritten text-4xl md:text-5xl font-bold text-[var(--ink)] rotate-[-1deg]">
            {title}
            <span className="absolute -right-8 top-0 text-[var(--warning)] rotate-12" aria-hidden="true">
              ✨
            </span>
            <span className="absolute -left-8 bottom-0 text-[var(--primary)] -rotate-12" aria-hidden="true">
              ⭐️
            </span>
          </h2>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-[var(--primary-soft)] rotate-[-1deg] rounded-full blur-sm" />
        </div>
        <p className="font-handwritten text-xl text-[var(--muted)] rotate-[-1deg]">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={cn(
              "relative group",
              "transition-all duration-300",
              index === 0 && "rotate-[-1deg]",
              index === 1 && "rotate-[1deg]",
              index === 2 && "rotate-[-2deg]"
            )}
          >
            <div
              className={cn(
                "absolute inset-0 bg-[var(--surface)]",
                "border-2 border-[var(--ink)]",
                "rounded-lg shadow-[4px_4px_0px_0px_var(--ink)]",
                "transition-all duration-300",
                "group-hover:shadow-[8px_8px_0px_0px_var(--ink)]",
                "group-hover:translate-x-[-4px]",
                "group-hover:translate-y-[-4px]"
              )}
            />

            <div className="relative p-6">
              {tier.popular && (
                <div
                  className="absolute -top-2 -right-2 bg-[var(--warning)] text-[var(--ink)]
                  font-handwritten px-3 py-1 rounded-full rotate-12 text-sm border-2 border-[var(--ink)]"
                >
                  Popular!
                </div>
              )}

              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-full mb-4 flex items-center justify-center
                  border-2 border-[var(--ink)] text-[var(--primary)]"
                >
                  {tier.icon}
                </div>
                <h3 className="font-handwritten text-2xl text-[var(--ink)]">{tier.name}</h3>
                <p className="font-handwritten text-[var(--muted)]">{tier.description}</p>
              </div>

              <div className="mb-6 font-handwritten">
                <span className="text-4xl font-bold text-[var(--ink)]">{tier.price}</span>
                {tier.period && <span className="text-[var(--muted)]">{tier.period}</span>}
              </div>

              <div className="space-y-3 mb-6">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 shrink-0 rounded-full border-2 border-[var(--ink)] flex items-center justify-center">
                      <Check className="w-3 h-3 text-[var(--ink)]" />
                    </div>
                    <span className="font-handwritten text-lg text-[var(--ink)]">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={tier.href}
                className={cn(
                  buttonVariants({ variant: tier.popular ? "default" : "outline" }),
                  "w-full h-12 font-handwritten text-lg relative",
                  "border-2 border-[var(--ink)] rounded-full",
                  "shadow-[4px_4px_0px_0px_var(--ink)]",
                  "hover:shadow-[6px_6px_0px_0px_var(--ink)]",
                  "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                  tier.popular && "bg-[var(--warning)] text-[var(--ink)] hover:bg-[var(--warning)] hover:opacity-90"
                )}
              >
                {tier.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute -z-10 inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-40 left-20 text-4xl rotate-12 text-[var(--muted)]">✎</div>
        <div className="absolute bottom-40 right-20 text-4xl -rotate-12 text-[var(--muted)]">✏️</div>
      </div>
    </div>
  );
}
