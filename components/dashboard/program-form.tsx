"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PhoneMockup } from "@/components/dashboard/phone-mockup";
import { JoinPagePhonePreview } from "@/components/dashboard/join-page-phone-preview";
import { PreviewCrossfade } from "@/components/motion/preview-crossfade";
import { cn } from "@/lib/utils";
import type { EnrollmentPageConfig, EnrollmentPageStyle, ProgramConfig, ProgramType, StepsConfig } from "@/types";
import {
  Coffee, Pizza, Scissors, ShoppingBag, Gift, Star,
  Dumbbell, Music, BookOpen, Bike, Car, Smile,
  Utensils, Croissant, Beer, Flower2, Shirt, Dog,
  Gamepad2, Paintbrush, Wine, Flame, CircleDot,
  Heart, Camera, Zap, Globe, Home, Leaf, Sun, Moon,
  Ticket, Apple, Soup, IceCream, Sandwich, ChevronDown, ChevronUp, ImageUp,
} from "lucide-react";

// Pre-made background images (Unsplash)
const PRESET_IMAGES = [
  { id: "none", label: "None", url: undefined },
  { id: "coffee",     label: "Coffee",     url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
  { id: "bakery",     label: "Bakery",      url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7f?w=400&q=80" },
  { id: "pizza",      label: "Pizza",       url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" },
  { id: "restaurant", label: "Restaurant",  url: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80" },
  { id: "bbq",        label: "BBQ",         url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80" },
  { id: "salon",      label: "Salon",       url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80" },
  { id: "barber",     label: "Barber",      url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80" },
  { id: "gym",        label: "Gym",         url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80" },
  { id: "bike",       label: "Bike",        url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80" },
  { id: "gaming",     label: "Gaming",      url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80" },
  { id: "spa",        label: "Spa",         url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80" },
  { id: "bookstore",  label: "Bookstore",   url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400&q=80" },
  { id: "music",      label: "Music",       url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&q=80" },
  { id: "fashion",    label: "Fashion",     url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80" },
  { id: "petshop",    label: "Pets",        url: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80" },
  { id: "art",        label: "Art",         url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80" },
  { id: "bar",        label: "Bar",         url: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=80" },
];

// Organized icon categories
const ICON_CATEGORIES = [
  {
    label: "Food & Drink",
    icons: [
      { name: "Coffee", icon: Coffee },
      { name: "Pizza", icon: Pizza },
      { name: "Croissant", icon: Croissant },
      { name: "Utensils", icon: Utensils },
      { name: "Beer", icon: Beer },
      { name: "Wine", icon: Wine },
      { name: "Apple", icon: Apple },
      { name: "Soup", icon: Soup },
      { name: "IceCream", icon: IceCream },
      { name: "Sandwich", icon: Sandwich },
    ],
  },
  {
    label: "Sports & Fitness",
    icons: [
      { name: "Dumbbell", icon: Dumbbell },
      { name: "Bike", icon: Bike },
      { name: "Gamepad2", icon: Gamepad2 },
      { name: "CircleDot", icon: CircleDot },
      { name: "Flame", icon: Flame },
      { name: "Zap", icon: Zap },
    ],
  },
  {
    label: "Retail & Services",
    icons: [
      { name: "ShoppingBag", icon: ShoppingBag },
      { name: "Scissors", icon: Scissors },
      { name: "Shirt", icon: Shirt },
      { name: "Ticket", icon: Ticket },
      { name: "Gift", icon: Gift },
      { name: "Car", icon: Car },
    ],
  },
  {
    label: "Culture & Lifestyle",
    icons: [
      { name: "Music", icon: Music },
      { name: "BookOpen", icon: BookOpen },
      { name: "Paintbrush", icon: Paintbrush },
      { name: "Camera", icon: Camera },
      { name: "Flower2", icon: Flower2 },
      { name: "Leaf", icon: Leaf },
    ],
  },
  {
    label: "Other",
    icons: [
      { name: "Star", icon: Star },
      { name: "Heart", icon: Heart },
      { name: "Smile", icon: Smile },
      { name: "Dog", icon: Dog },
      { name: "Globe", icon: Globe },
      { name: "Home", icon: Home },
      { name: "Sun", icon: Sun },
      { name: "Moon", icon: Moon },
    ],
  },
];

const defaultConfigs: Record<ProgramType, ProgramConfig> = {
  stamp: { stamps_required: 10, reward_description: "Free item", icon: "Coffee" },
  points: { points_per_reward: 1000, reward_description: "Free gift", points_label: "pts" },
  steps: {
    stages: [
      { key: "welcome", label: "Welcome Gift", threshold: 0 },
      { key: "free_drink", label: "Free Drink", threshold: 5 },
      { key: "discount", label: "10% Discount", threshold: 10 },
      { key: "vip", label: "VIP Member", threshold: 20 },
    ],
  },
};

// Both create and edit walk the same six steps — editing a program should feel identical
// to creating one, just pre-filled.
const STEPS = ["Basic information", "Branding", "Rewards", "Wallet setup", "Card appearance", "Review & save"] as const;
const STEP_BASIC = 0;
const STEP_BRANDING = 1;
const STEP_REWARDS = 2;
const STEP_WALLET = 3;
const STEP_CARD = 4;
const STEP_REVIEW = 5;
const LAST_STEP = STEPS.length - 1;

function ReviewRow({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
      <dd className={cn("mt-1 text-sm font-medium text-[var(--ink)]", className)}>{value}</dd>
    </div>
  );
}

type Props = {
  mode: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    type: ProgramType;
    config: ProgramConfig;
    is_active: boolean;
  };
  initialName?: string;
  businessName?: string;
  businessLogo?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  initialIconName?: string;
  initialBackgroundImage?: string;
};

export function ProgramForm({
  mode,
  initial,
  initialName = "",
  businessName = "Your business",
  businessLogo,
  primaryColor: initPrimaryColor = "#3E0856",
  secondaryColor: initSecondaryColor = "#FAAE62",
  initialIconName = "Coffee",
  initialBackgroundImage,
}: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;


  const [name, setName] = useState(initial?.name ?? initialName);
  const [type, setType] = useState<ProgramType>(initial?.type ?? "stamp");
  const [config, setConfig] = useState<ProgramConfig>(initial?.config ?? defaultConfigs.stamp);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [primaryColor, setPrimaryColor] = useState((initial?.config as any)?.primary_color ?? initPrimaryColor);
  const [secondaryColor, setSecondaryColor] = useState((initial?.config as any)?.secondary_color ?? initSecondaryColor);
  const [step, setStep] = useState(0);
  // The wallet card is the primary product being designed, so it's the default preview;
  // it only steps aside for the Wallet setup step, where the join page is what's being edited.
  const [previewMode, setPreviewMode] = useState<"join" | "card">("card");
  const [selectedIcon, setSelectedIcon] = useState(
    (initial?.config as any)?.icon ?? initialIconName
  );
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(
    initialBackgroundImage ?? (initial?.config as any)?.background_image_url
  );
  const [showAllIcons, setShowAllIcons] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const logoUploadInputRef = useRef<HTMLInputElement>(null);
  const enrollment = ((config as any).enrollment_page ?? {}) as EnrollmentPageConfig;

  // The preview follows the step being edited — join page only while editing Wallet
  // setup, the wallet card everywhere else (including Card appearance, so the flip shows).
  useEffect(() => {
    setPreviewMode(step === STEP_WALLET ? "join" : "card");
  }, [step]);

  const stampsRequired = (config as any).stamps_required ?? 10;

  function switchType(next: ProgramType) {
    setType(next);
    const appearance = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      ...(backgroundImage ? { background_image_url: backgroundImage } : {}),
      ...((config as any).details ? { details: (config as any).details } : {}),
      ...((config as any).enrollment_page ? { enrollment_page: (config as any).enrollment_page } : {}),
    };
    setConfig(
      next === "stamp"
        ? { ...defaultConfigs.stamp, ...appearance, icon: selectedIcon }
        : { ...defaultConfigs[next], ...appearance }
    );
  }

  function pickIcon(iconName: string) {
    setSelectedIcon(iconName);
    if (type === "stamp") {
      setConfig((prev) => ({ ...prev, icon: iconName } as ProgramConfig));
    }
  }

  function setBackground(url?: string) {
    setBackgroundImage(url);
    setConfig((prev) => {
      const next = { ...(prev as any) };
      if (url) next.background_image_url = url;
      else delete next.background_image_url;
      return next as ProgramConfig;
    });
  }

  function setCardColor(kind: "primary_color" | "secondary_color", value: string) {
    if (kind === "primary_color") setPrimaryColor(value);
    else setSecondaryColor(value);
    setConfig((prev) => ({ ...(prev as any), [kind]: value } as ProgramConfig));
  }

  function goToNextStep() {
    if (step === STEP_BASIC && !name.trim()) {
      setError("Give your program a name before continuing.");
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, LAST_STEP));
  }

  function updateEnrollment(next: Partial<EnrollmentPageConfig>) {
    setConfig((prev) => ({
      ...(prev as any),
      enrollment_page: { ...((prev as any).enrollment_page ?? {}), ...next },
    } as ProgramConfig));
  }

  async function uploadBackground(file: File) {
    setUploadingImage(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await response.json();
    setUploadingImage(false);
    if (!response.ok) {
      setUploadError(result.error ?? "Could not upload that image.");
      return;
    }
    setBackground(result.url);
  }

  async function uploadJoinLogo(file: File) {
    setUploadingImage(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const result = await response.json();
    setUploadingImage(false);
    if (!response.ok) {
      setUploadError(result.error ?? "Could not upload that logo.");
      return;
    }
    updateEnrollment({ logo_url: result.url });
  }


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = mode === "create" ? "/api/programs" : `/api/programs/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const body =
      mode === "create"
        ? { name, type, config }
        : { name, config, is_active: isActive };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error?.message ?? "Failed");
      return;
    }

    // A freshly created program has nothing to manage yet — the print studio (posters,
    // stickers, social assets) is the natural next stop. Editing returns to the program.
    router.push(
      mode === "create"
        ? `/${locale}/dashboard/programs/${json.data.id}/print`
        : `/${locale}/dashboard/programs/${json.data.id}`
    );
    router.refresh();
  }

  async function deleteProgram() {
    if (!initial) return;
    if (!window.confirm(`Delete “${name}”? This permanently removes the program and its member progress.`)) return;
    setLoading(true);
    const res = await fetch(`/api/programs/${initial.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      router.push(`/${locale}/dashboard/programs`);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col-reverse lg:flex-row lg:items-start gap-10">
      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-8 pb-10">

        <nav aria-label="Program steps" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              aria-current={step === index ? "step" : undefined}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors",
                step === index
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : index < step
                    ? "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"
              )}
            >
              <span className="mr-1.5 text-xs">{index + 1}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Step 1 — Basic information */}
        <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_BASIC && "hidden")}>
          <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Basic information</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">Name the program and choose how members earn rewards.</p>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-[var(--muted)]">Program name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 text-lg"
                placeholder="e.g. VIP Club"
              />
            </div>

            {mode === "create" && (
              <div>
                <Label className="text-[var(--muted)]">Program Type</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {(["stamp", "points", "steps"] as ProgramType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={type === t}
                      onClick={() => switchType(t)}
                      className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
                        type === t
                          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      <span className="block capitalize">{t}</span>
                      <span className="mt-0.5 block text-xs font-normal opacity-75">
                        {t === "stamp" ? "Collect visits" : t === "points" ? "Earn a balance" : "Unlock milestones"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === "edit" && (
              <label className="flex items-center gap-3 text-sm font-medium text-[var(--ink)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5 rounded border-[var(--line-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Program is active
              </label>
            )}
          </div>
        </div>

        {/* Step 2 — Branding */}
        <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_BRANDING && "hidden")}>
          <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Branding</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">Set the card's colors and background image.</p>

          <div className="mb-6 flex flex-wrap items-center gap-6 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
            <div className="flex-1">
              <Label htmlFor="primaryColor" className="text-[var(--muted)]">Card Color</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-[var(--line)] shadow-sm">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setCardColor("primary_color", e.target.value)}
                    className="absolute -inset-2 h-16 w-20 cursor-pointer"
                  />
                </div>
                <span className="font-mono text-sm font-medium uppercase text-[var(--ink)]">{primaryColor}</span>
              </div>
            </div>
            
            <div className="flex-1">
              <Label htmlFor="secondaryColor" className="text-[var(--muted)]">Accent Color</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="relative h-10 w-14 overflow-hidden rounded-lg border border-[var(--line)] shadow-sm">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setCardColor("secondary_color", e.target.value)}
                    className="absolute -inset-2 h-16 w-20 cursor-pointer"
                  />
                </div>
                <span className="font-mono text-sm font-medium uppercase text-[var(--ink)]">{secondaryColor}</span>
              </div>
            </div>
          </div>

          {/* Background image selection */}
          <div>
            <Label className="text-[var(--muted)]">Background Image</Label>
            <p className="mt-1 mb-4 text-sm text-[var(--muted)]">Choose a photo for your card background.</p>
            
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface-3)] shadow-sm flex items-center justify-center">
                {backgroundImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={backgroundImage} alt="Background" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-medium text-[var(--muted)]">None</span>
                )}
              </div>
              <Button type="button" variant="outline" onClick={() => setShowAllPhotos(true)}>
                Choose a photo
              </Button>
            </div>
          </div>
          
          {/* Photo Selection Modal */}
          {showAllPhotos && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)] p-4 animate-in fade-in duration-200">
              <div className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl bg-[var(--surface)] shadow-2xl">
                <div className="flex items-center justify-between border-b p-5">
                  <h3 className="text-lg font-semibold text-[var(--ink)]">Choose a photo</h3>
                  <button type="button" onClick={() => setShowAllPhotos(false)} className="rounded-full p-2 text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)] transition-colors">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {PRESET_IMAGES.map((img) => {
                      const selected = backgroundImage === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            setBackground(img.url);
                            setShowAllPhotos(false);
                          }}
                          className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                            selected
                              ? "border-[var(--primary)] ring-2 ring-[var(--primary)] ring-offset-2"
                              : "border-transparent hover:border-[var(--line-strong)] shadow-sm hover:shadow-md"
                          }`}
                        >
                          {img.url ? (
                            <div className="aspect-video w-full">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-3)] text-sm font-medium text-[var(--muted)]">
                              None
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 p-2">
                            <span className="text-[10px] font-semibold text-white tracking-wide uppercase">{img.label}</span>
                          </div>
                          {selected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-[var(--primary)]/20">
                              <div className="rounded-full bg-[var(--primary)] p-1 text-white">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-2)] p-5 rounded-b-2xl">
                  <div className="flex items-center gap-3">
                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        if (file) {
                          uploadBackground(file);
                          setShowAllPhotos(false);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                    <Button type="button" variant="outline" onClick={() => uploadInputRef.current?.click()} disabled={uploadingImage}>
                      <ImageUp className="mr-2 h-4 w-4" />
                      {uploadingImage ? "Uploading…" : "Upload your own"}
                    </Button>
                    {uploadError && <span className="text-sm text-[var(--danger)]">{uploadError}</span>}
                  </div>
                  <Button type="button" onClick={() => setShowAllPhotos(false)}>Done</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 5 — Card appearance (the pass's "back" — this is what the live preview flips to) */}
        <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_CARD && "hidden")}>
          <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Card appearance</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">These appear when a member opens “More details” on their pass — the back of the card in the preview.</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardDescription" className="text-[var(--muted)]">Welcome message</Label>
              <Textarea
                id="cardDescription"
                rows={3}
                value={(config as any).details?.description ?? ""}
                onChange={(event) => setConfig((prev) => ({ ...(prev as any), details: { ...(prev as any).details, description: event.target.value } } as ProgramConfig))}
                placeholder="Tell members what they can expect from this program."
                className="min-h-[84px]"
              />
            </div>
            <div>
              <Label htmlFor="cardTerms" className="text-[var(--muted)]">Terms and conditions</Label>
              <Textarea
                id="cardTerms"
                rows={3}
                value={(config as any).details?.terms ?? ""}
                onChange={(event) => setConfig((prev) => ({ ...(prev as any), details: { ...(prev as any).details, terms: event.target.value } } as ProgramConfig))}
                placeholder="For example: one reward per visit, cannot be combined with other offers."
                className="min-h-[84px]"
              />
            </div>
            <div>
              <Label htmlFor="cardWebsite" className="text-[var(--muted)]">Website or contact link</Label>
              <Input
                id="cardWebsite"
                type="url"
                value={(config as any).details?.website ?? ""}
                onChange={(event) => setConfig((prev) => ({ ...(prev as any), details: { ...(prev as any).details, website: event.target.value } } as ProgramConfig))}
                placeholder="https://yourbusiness.com"
              />
            </div>
          </div>
        </div>

        {/* Step 4 — Wallet setup (the join/enrollment page members see before adding the pass) */}
        <section
          id="join-page"
          className={cn("scroll-mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_WALLET && "hidden")}
        >
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">Wallet setup</h2>
              <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">This is the public join page people see before adding your loyalty pass to their wallet. It starts with your business details.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => updateEnrollment({ business_name: "", program_name: "", description: "", logo_url: "" })}>
              Use business defaults
            </Button>
          </div>

          <div className="mb-7">
            <Label className="text-[var(--muted)]">Choose a style</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {([
                ["classic", "Classic", "Clear, familiar and focused"],
                ["editorial", "Editorial", "Warm welcome with a strong story"],
                ["spotlight", "Spotlight", "Bold color and a compact sign-up"],
              ] as [EnrollmentPageStyle, string, string][]).map(([style, title, detail]) => (
                <button key={style} type="button" onClick={() => updateEnrollment({ style })} aria-pressed={(enrollment.style ?? "classic") === style} className={`rounded-xl border p-4 text-left ${((enrollment.style ?? "classic") === style) ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}>
                  <span className="block text-sm font-semibold text-[var(--ink)]">{title}</span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">{detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-7 grid gap-4 rounded-xl bg-[var(--surface-2)] p-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="joinBackgroundColor" className="text-[var(--muted)]">Page background</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input id="joinBackgroundColor" type="color" value={enrollment.background_color ?? (enrollment.style === "spotlight" ? primaryColor : "#F6F6F6")} onChange={(event) => updateEnrollment({ background_color: event.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1" />
                <span className="font-mono text-sm font-medium uppercase text-[var(--ink)]">{enrollment.background_color ?? (enrollment.style === "spotlight" ? primaryColor : "#F6F6F6")}</span>
              </div>
            </div>
            <div>
              <Label htmlFor="joinButtonColor" className="text-[var(--muted)]">Join button color</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <input id="joinButtonColor" type="color" value={enrollment.button_color ?? primaryColor} onChange={(event) => updateEnrollment({ button_color: event.target.value })} className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--line)] bg-[var(--surface)] p-1" />
                <span className="font-mono text-sm font-medium uppercase text-[var(--ink)]">{enrollment.button_color ?? primaryColor}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="joinBusinessName" className="text-[var(--muted)]">Business name</Label>
              <Input id="joinBusinessName" value={enrollment.business_name ?? ""} onChange={(event) => updateEnrollment({ business_name: event.target.value })} placeholder={businessName} />
              <p className="mt-1.5 text-xs text-[var(--muted)]">Leave blank to use your business name.</p>
            </div>
            <div>
              <Label htmlFor="joinProgramName" className="text-[var(--muted)]">Program name</Label>
              <Input id="joinProgramName" value={enrollment.program_name ?? ""} onChange={(event) => updateEnrollment({ program_name: event.target.value })} placeholder={name || "Your loyalty program"} />
              <p className="mt-1.5 text-xs text-[var(--muted)]">Leave blank to use the program name above.</p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="joinLogo" className="text-[var(--muted)]">Logo URL</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input id="joinLogo" type="url" value={enrollment.logo_url ?? ""} onChange={(event) => updateEnrollment({ logo_url: event.target.value })} placeholder={businessLogo ?? "https://example.com/logo.png"} />
                <input ref={logoUploadInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.currentTarget.files?.[0]; if (file) uploadJoinLogo(file); event.currentTarget.value = ""; }} />
                <Button type="button" variant="outline" onClick={() => logoUploadInputRef.current?.click()} disabled={uploadingImage}><ImageUp className="mr-2 h-4 w-4" />{uploadingImage ? "Uploading…" : "Upload logo"}</Button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--muted)]">Upload a logo, paste a URL, or leave blank to use your business logo.</p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="joinDescription" className="text-[var(--muted)]">Welcome message</Label>
              <Textarea id="joinDescription" value={enrollment.description ?? ""} onChange={(event) => updateEnrollment({ description: event.target.value })} placeholder="Join today, collect rewards, and keep your pass in your phone wallet." className="min-h-[100px]" />
            </div>
          </div>

        </section>

        {/* Step 3 — Rewards */}
      <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_REWARDS && "hidden")}>
        <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Rewards</h2>
        <p className="mb-5 text-sm text-[var(--muted)]">
          {type === "stamp" && "Decide how many visits unlock the reward."}
          {type === "points" && "Set the balance members need before they can claim their reward."}
          {type === "steps" && "Add the milestones members unlock in order."}
        </p>

        {/* Stamp-specific fields */}
        {type === "stamp" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-[var(--muted)]">Stamps Required for Reward (1–25)</Label>
                <Input
                  type="number"
                  min={1}
                  max={25}
                  value={(config as any).stamps_required}
                  onChange={(e) =>
                    setConfig({ ...(config as any), stamps_required: Number(e.target.value) } as ProgramConfig)
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[var(--muted)]">Reward Description</Label>
                <Input
                  value={(config as any).reward_description}
                  onChange={(e) =>
                    setConfig({ ...(config as any), reward_description: e.target.value } as ProgramConfig)
                  }
                  className="mt-1.5"
                  placeholder="e.g. Free Coffee"
                />
              </div>
            </div>

            {/* Icon picker - categorized */}
            <div>
              <Label className="text-[var(--muted)]">Stamp Icon</Label>
              <p className="mt-1 text-sm text-[var(--muted)]">Choose an icon for each completed visit.</p>
              <div className="mt-3 space-y-5">
                {(showAllIcons ? ICON_CATEGORIES : ICON_CATEGORIES.slice(0, 1)).map((cat) => (
                  <div key={cat.label}>
                    <p className="mb-1 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">{cat.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {(showAllIcons ? cat.icons : cat.icons.slice(0, 6)).map(({ name: iconName, icon: IconComp }) => (
                        <button
                          key={iconName}
                          type="button"
                          title={iconName}
                          onClick={() => pickIcon(iconName)}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
                            selectedIcon === iconName
                              ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] scale-110 shadow-sm"
                              : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setShowAllIcons((visible) => !visible)}>
                {showAllIcons ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {showAllIcons ? "Show fewer icons" : "Browse all icons"}
              </Button>
            </div>
          </div>
        )}

        {/* Points fields */}
        {type === "points" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <Label className="text-[var(--muted)]">Points Per Reward</Label>
                <Input
                  type="number"
                  min={1}
                  value={(config as any).points_per_reward}
                  onChange={(e) =>
                    setConfig({ ...(config as any), points_per_reward: Number(e.target.value) } as ProgramConfig)
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-[var(--muted)]">Points Label (e.g. pts, stars)</Label>
                <Input
                  value={(config as any).points_label}
                  onChange={(e) =>
                    setConfig({ ...(config as any), points_label: e.target.value } as ProgramConfig)
                  }
                  className="mt-1.5"
                  placeholder="pts"
                />
              </div>
            </div>
            <div>
              <Label className="text-[var(--muted)]">Reward Description</Label>
              <Input
                value={(config as any).reward_description}
                onChange={(e) =>
                  setConfig({ ...(config as any), reward_description: e.target.value } as ProgramConfig)
                }
                className="mt-1.5"
                placeholder="e.g. $10 Off"
              />
            </div>
          </div>
        )}

        {/* Steps fields */}
        {type === "steps" && (
          <div className="space-y-5">
            <Label className="text-[var(--muted)]">Stages</Label>
            <div className="rounded-xl border border-[var(--line)] p-4 bg-[var(--surface-2)]">
              <div className="space-y-3">
                {(config as StepsConfig).stages.map((stage, idx) => (
                  <div key={stage.key} className="grid grid-cols-[1fr_100px_auto] items-center gap-3">
                    <Input
                      value={stage.label}
                      onChange={(e) => {
                        const stages = [...(config as StepsConfig).stages];
                        stages[idx] = { ...stage, label: e.target.value };
                        setConfig({ stages });
                      }}
                      placeholder="Stage name"
                    />
                    <Input
                      type="number"
                      value={stage.threshold}
                      onChange={(e) => {
                        const stages = [...(config as StepsConfig).stages];
                        stages[idx] = { ...stage, threshold: Number(e.target.value) };
                        setConfig({ stages });
                      }}
                      placeholder="Threshold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={(config as StepsConfig).stages.length === 1}
                      className="h-11 w-11 px-0 text-[var(--danger)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-35"
                      onClick={() => {
                        const stages = (config as StepsConfig).stages.filter((_, i) => i !== idx);
                        setConfig({ stages });
                      }}
                    >
                      <span className="sr-only">Remove</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 w-full border-dashed"
                onClick={() => {
                  const stages = [
                    ...(config as StepsConfig).stages,
                    {
                      key: `stage_${Date.now()}`,
                      label: "New stage",
                      threshold: ((config as StepsConfig).stages.at(-1)?.threshold ?? 0) + 5,
                    },
                  ];
                  setConfig({ stages });
                }}
              >
                + Add Stage
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Step 6 — Review & save */}
      <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm", step !== STEP_REVIEW && "hidden")}>
        <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Review & save</h2>
        <p className="mb-5 text-sm text-[var(--muted)]">
          Double-check the details below, then {mode === "create" ? "create" : "save"} your program.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <ReviewRow label="Program name" value={name || "Untitled"} />
          <ReviewRow label="Type" value={type} className="capitalize" />
          <ReviewRow
            label="Reward rule"
            value={
              type === "stamp"
                ? `${stampsRequired} stamps → ${(config as any).reward_description || "reward"}`
                : type === "points"
                  ? `${(config as any).points_per_reward} ${(config as any).points_label || "pts"} → ${(config as any).reward_description || "reward"}`
                  : `${(config as StepsConfig).stages.length} stages`
            }
          />
          <ReviewRow
            label="Colors"
            value={
              <span className="inline-flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full border border-[var(--line)]" style={{ background: primaryColor }} />
                <span className="h-4 w-4 rounded-full border border-[var(--line)]" style={{ background: secondaryColor }} />
              </span>
            }
          />
          <ReviewRow label="Background image" value={backgroundImage ? "Custom photo" : "None"} />
          <ReviewRow label="Join page style" value={enrollment.style ?? "classic"} className="capitalize" />
          <ReviewRow
            label="Card details"
            value={
              (config as any).details?.description || (config as any).details?.terms || (config as any).details?.website
                ? "Added"
                : "Not set"
            }
          />
          {mode === "edit" && <ReviewRow label="Status" value={isActive ? "Active" : "Inactive"} />}
        </dl>
      </div>

      {error && (
        <div className="rounded-xl bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)] border border-[var(--danger)]/20">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row">
        {step > 0 && (
          <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
            Back
          </Button>
        )}
        {step < LAST_STEP ? (
          <Button type="button" className="w-full sm:w-auto h-11 px-8 text-base font-semibold" onClick={goToNextStep}>
            Continue
          </Button>
        ) : (
          <Button type="submit" className="w-full sm:w-auto h-11 px-8 text-base font-semibold" disabled={loading}>
            {loading ? "Saving…" : mode === "create" ? "Create program" : "Save changes"}
          </Button>
        )}
        {mode === "edit" && (
          <Button type="button" variant="danger" className="w-full sm:w-auto h-11 px-6 font-medium" disabled={loading} onClick={deleteProgram}>
            Delete program
          </Button>
        )}
      </div>
    </form>

      {/* Live Phone Mockup Preview */}
      <div className="flex flex-col items-center gap-4 lg:sticky lg:top-8 w-full max-w-[280px] mx-auto lg:mx-0 shrink-0 mb-8 lg:mb-0">
        <div className="flex items-center justify-between w-full">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Live preview</p>
        </div>
        <div className="flex w-full rounded-lg bg-[var(--surface-2)] p-1 text-xs font-semibold">
          <button type="button" onClick={() => setPreviewMode("join")} className={`flex-1 rounded-md px-2 py-1.5 transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none ${previewMode === "join" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}>Join page</button>
          <button type="button" onClick={() => setPreviewMode("card")} className={`flex-1 rounded-md px-2 py-1.5 transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] motion-reduce:transition-none ${previewMode === "card" ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)]"}`}>Wallet card</button>
        </div>
        
        <div className="relative h-[532px] w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 shadow-sm">
          <PreviewCrossfade
            activeKey={previewMode}
            panels={[
              {
                key: "join",
                content: (
                  <JoinPagePhonePreview
                    businessName={enrollment.business_name || businessName}
                    programName={enrollment.program_name || name || "Your loyalty program"}
                    description={enrollment.description || "Join today, collect rewards, and keep your pass in your phone wallet."}
                    logoUrl={enrollment.logo_url || businessLogo}
                    backgroundColor={enrollment.background_color ?? (enrollment.style === "spotlight" ? primaryColor : "#F6F6F6")}
                    buttonColor={enrollment.button_color ?? primaryColor}
                    style={enrollment.style ?? "classic"}
                  />
                ),
              },
              {
                key: "card",
                content: (
                  <PhoneMockup
                    name={name || businessName}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    iconName={selectedIcon}
                    backgroundImage={backgroundImage}
                    programType={type}
                    programConfig={config}
                    stampsRequired={stampsRequired}
                    stampsCollected={3}
                    previewOnly
                    flipped={step === STEP_CARD}
                    cardDetails={(config as any).details}
                  />
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
