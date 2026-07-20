"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { PhoneMockup } from "@/components/dashboard/phone-mockup";
import type { ProgramConfig, ProgramType, StepsConfig } from "@/types";
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
  const [createStep, setCreateStep] = useState(0);
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

  const stampsRequired = (config as any).stamps_required ?? 10;

  function switchType(next: ProgramType) {
    setType(next);
    const appearance = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      ...(backgroundImage ? { background_image_url: backgroundImage } : {}),
      ...((config as any).details ? { details: (config as any).details } : {}),
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
    if (createStep === 0 && !name.trim()) {
      setError("Give your program a name before continuing.");
      return;
    }
    setError(null);
    setCreateStep((step) => Math.min(step + 1, 2));
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

    router.push(`/${locale}/dashboard/programs/${json.data.id}`);
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

        {mode === "create" && (
          <nav aria-label="Program creation steps" className="order-0 grid grid-cols-3 gap-2">
            {["Set up", "Rules", "Appearance"].map((label, index) => (
              <button key={label} type="button" onClick={() => setCreateStep(index)} className={`rounded-xl border px-3 py-2 text-left text-sm font-medium ${createStep === index ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]" : index < createStep ? "border-[var(--line)] bg-white text-[var(--ink)]" : "border-[var(--line)] bg-white text-[var(--muted)]"}`}>
                <span className="mr-1.5 text-xs">{index + 1}</span>{label}
              </button>
            ))}
          </nav>
        )}

        {/* Program setup */}
        <div className={`order-1 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm ${mode === "create" && createStep !== 0 ? "hidden" : ""}`}>
          <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Program setup</h2>
          <p className="mb-5 text-sm text-[var(--muted)]">Name the program, choose how members earn rewards, then set its rules below.</p>
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
                          ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] shadow-sm" 
                          : "border-[var(--line)] text-[var(--muted)] hover:border-gray-300 hover:bg-gray-50"
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
          </div>
        </div>

        {/* Appearance Section */}
        <div className={`order-3 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm ${mode === "create" && createStep !== 2 ? "hidden" : ""}`}>
          <h2 className="mb-4 text-lg font-semibold text-[var(--ink)]">Appearance</h2>
          
          <div className="mb-6 grid grid-cols-2 gap-6">
          <div>
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
          
          <div>
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

        {/* Background image — preset picker */}
        <div>
          <Label className="text-[var(--muted)]">Background Image</Label>
          <p className="mt-1 text-sm text-[var(--muted)]">Choose a preset, upload your own photo, or leave it blank for a colour gradient.</p>
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {(showAllPhotos ? PRESET_IMAGES : PRESET_IMAGES.slice(0, 8)).map((img) => {
              const selected = backgroundImage === img.url;
              return (
                <button
                  key={img.id}
                  type="button"
                  title={img.label}
                  onClick={() => setBackground(img.url)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selected
                      ? "border-[var(--brand)] ring-2 ring-[var(--brand)] ring-offset-1"
                      : "border-transparent hover:border-gray-300"
                  }`}
                >
                  {img.url ? (
                    <div className="aspect-video w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.label}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-gray-100 text-[10px] text-[var(--muted)]">
                      None
                    </div>
                  )}
                  {selected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand)]/20">
                      <div className="rounded-full bg-[var(--brand)] p-0.5">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) uploadBackground(file);
                event.currentTarget.value = "";
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()} disabled={uploadingImage}>
              <ImageUp className="mr-2 h-4 w-4" />
              {uploadingImage ? "Uploading…" : "Upload your own"}
            </Button>
            {PRESET_IMAGES.length > 8 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAllPhotos((visible) => !visible)}>
                {showAllPhotos ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                {showAllPhotos ? "Show fewer photos" : `Show ${PRESET_IMAGES.length - 8} more photos`}
              </Button>
            )}
            {backgroundImage && !PRESET_IMAGES.some((image) => image.url === backgroundImage) && (
              <span className="text-sm font-medium text-[var(--ink)]">Custom photo selected</span>
            )}
          </div>
          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        </div>

        <div className="mt-8 border-t border-[var(--line)] pt-6">
          <h3 className="text-sm font-semibold text-[var(--ink)]">Card details</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">These appear when a member opens “More details” on their pass.</p>
          <div className="mt-4 space-y-4">
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
      </div>

        {/* Program rules */}
      <div className={`order-2 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm ${mode === "create" && createStep !== 1 ? "hidden" : ""}`}>
        <h2 className="mb-1 text-lg font-semibold text-[var(--ink)]">Program rules</h2>
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
                              ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)] scale-110 shadow-sm"
                              : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
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
            <div className="rounded-xl border border-[var(--line)] p-4 bg-gray-50/50">
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
                      className="h-11 w-11 px-0 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-35"
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

      {mode === "edit" && (
        <div className="order-4 rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
          <label className="flex items-center gap-3 text-sm font-medium text-[var(--ink)] cursor-pointer">
            <input 
              type="checkbox" 
              checked={isActive} 
              onChange={(e) => setIsActive(e.target.checked)} 
              className="h-5 w-5 rounded border-gray-300 text-[var(--brand)] focus:ring-[var(--brand)]"
            />
            Program is Active
          </label>
        </div>
      )}

      {error && (
        <div className="order-5 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      <div className="order-6 flex flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row">
        {mode === "create" && createStep > 0 && (
          <Button type="button" variant="outline" onClick={() => setCreateStep((step) => step - 1)}>
            Back
          </Button>
        )}
        {mode === "create" && createStep < 2 ? (
          <Button type="button" className="w-full sm:w-auto h-11 px-8 text-base font-semibold" onClick={goToNextStep}>
            Continue
          </Button>
        ) : (
          <Button type="submit" className="w-full sm:w-auto h-11 px-8 text-base font-semibold" disabled={loading}>
            {loading ? "Saving…" : "Save program"}
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
        
        {/* Subtle decorative background for the preview container */}
        <div className="relative p-6 rounded-[50px] bg-white/50 backdrop-blur-sm border border-[var(--line)] shadow-sm">
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
          />
        </div>
      </div>
    </div>
  );
}
