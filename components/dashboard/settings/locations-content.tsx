"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronDown, Crosshair, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { LocationPushPreview } from "@/components/dashboard/settings/location-preview";
import { toast } from "@/components/ui/toaster";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import type { Plan, StoreLocation } from "@/types";

const LocationMap = dynamic(
  () => import("@/components/dashboard/settings/location-map").then((m) => m.LocationMap),
  { ssr: false }
);

const METERS_TO_FEET = 3.28084;
const FALLBACK_CENTER = { lat: 24.7136, lng: 46.6753 };
// Geo-push radius is fixed, not a per-location setting — see the comment on
// storeLocationSchema (lib/validators/index.ts) for why it's locked here and
// enforced again server-side rather than trusted from the client.
const RADIUS_METERS = 150;

const emptyForm = {
  name: "",
  address: "",
  relevant_text: "",
  program_ids: [] as string[],
};

export function LocationsContent({
  locations,
  programs,
  merchant,
}: {
  locations: StoreLocation[];
  programs: { id: string; name: string }[];
  merchant: { business_name: string; logo_url: string | null; plan: Plan };
}) {
  const t = useTranslations("settings.locations");
  const router = useRouter();
  // Optimistic local mirror of the `locations` prop — toggling/removing a
  // location used to only update the fetch(...).then(router.refresh())
  // round trip finished, so the switch appeared to do nothing (no
  // animation, stale until an actual page reload) for however long that
  // took. This flips instantly, then reconciles with the server.
  const [localLocations, setLocalLocations] = useState(locations);
  useEffect(() => setLocalLocations(locations), [locations]);
  const [form, setForm] = useState(emptyForm);
  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState(FALLBACK_CENTER);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Best-effort: center the map near the merchant on first load, silently falling
  // back if geolocation is unavailable or denied — never blocks the page.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 5000 }
    );
  }, []);

  const limit = PLAN_LIMITS[merchant.plan].maxLocations;
  const atLimit = limit !== null && localLocations.length >= limit;

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickedLat(pos.coords.latitude);
        setPickedLng(pos.coords.longitude);
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    if (pickedLat === null || pickedLng === null) {
      setError(t("previewHint"));
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address || null,
        latitude: pickedLat,
        longitude: pickedLng,
        relevant_text: form.relevant_text || null,
        program_ids: form.program_ids,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error?.message ?? t("saveFailed"));
      return;
    }
    setForm(emptyForm);
    setPickedLat(null);
    setPickedLng(null);
    router.refresh();
  }

  async function toggleActive(location: StoreLocation) {
    const nextActive = !location.is_active;
    setLocalLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, is_active: nextActive } : l)));
    const res = await fetch(`/api/settings/locations/${location.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: nextActive }),
    });
    if (!res.ok) {
      setLocalLocations((prev) => prev.map((l) => (l.id === location.id ? { ...l, is_active: location.is_active } : l)));
      toast.error(t("saveFailed"));
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    const removed = localLocations.find((l) => l.id === id);
    setLocalLocations((prev) => prev.filter((l) => l.id !== id));
    const res = await fetch(`/api/settings/locations/${id}`, { method: "DELETE" });
    if (!res.ok && removed) {
      setLocalLocations((prev) => [...prev, removed]);
      toast.error(t("saveFailed"));
      return;
    }
    router.refresh();
  }

  function toggleProgram(id: string) {
    setForm((prev) => ({
      ...prev,
      program_ids: prev.program_ids.includes(id) ? prev.program_ids.filter((p) => p !== id) : [...prev.program_ids, id],
    }));
  }

  const hasPicked = pickedLat !== null && pickedLng !== null;

  const applyToCardsLabel =
    form.program_ids.length === 0
      ? t("allCards")
      : form.program_ids.length === programs.length
        ? t("allCards")
        : `${form.program_ids.length} selected`;

  const previewMessage =
    form.relevant_text.trim() || t("messagePlaceholder", { business: merchant.business_name || "Your business" });

  return (
    <div className="max-w-5xl">
      <Reveal as="div" className="flex flex-wrap items-center gap-3">
        <p className="text-xs text-[var(--muted)] sm:text-sm">{t("intro")}</p>
      </Reveal>
      <Badge variant="primary" className="mt-3 text-[11px] sm:text-xs">
        <MapPin className="h-3 w-3" />
        {t("geoPushBadge", { meters: RADIUS_METERS, feet: Math.round(RADIUS_METERS * METERS_TO_FEET) })}
      </Badge>
      {limit !== null && (
        <p className="mt-2 text-[11px] text-[var(--muted)] sm:text-xs">{t("limitNote", { limit })}</p>
      )}

      {atLimit && (
        <div className="mt-4 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-center text-xs text-[var(--muted)] sm:text-sm">
          {t("limitReached")}
        </div>
      )}

      {!atLimit && (
        <div className="mt-6 flex flex-col-reverse gap-8 lg:flex-row lg:items-start">
          <form onSubmit={addLocation} className="flex-1 space-y-5">
            <Card className="space-y-4 p-5 sm:p-6">
              <div>
                <Label htmlFor="name" className="text-xs sm:text-[13px]">{t("name")}</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="address" className="text-xs sm:text-[13px]">{t("address")}</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs sm:text-[13px]">{hasPicked ? "" : t("previewHint")}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
                    {locating ? <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" /> : <Crosshair className="me-1.5 h-3.5 w-3.5" />}
                    Use my location
                  </Button>
                </div>
                <div className="mt-2">
                  <LocationMap
                    latitude={pickedLat ?? mapCenter.lat}
                    longitude={pickedLng ?? mapCenter.lng}
                    radiusMeters={RADIUS_METERS}
                    onPick={(lat, lng) => {
                      setPickedLat(lat);
                      setPickedLng(lng);
                    }}
                    interactive
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message" className="text-xs sm:text-[13px]">{t("message")}</Label>
                <Textarea
                  id="message"
                  rows={2}
                  maxLength={200}
                  value={form.relevant_text}
                  onChange={(e) => setForm({ ...form, relevant_text: e.target.value })}
                  placeholder={t("messagePlaceholder", { business: merchant.business_name || "Your business" })}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-[13px]">{t("applyToCards")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm text-[var(--ink)] transition-colors hover:border-[var(--line-strong)]"
                    >
                      {programs.length === 0 ? t("nothingSelected") : applyToCardsLabel}
                      <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2" align="start">
                    {programs.length === 0 ? (
                      <p className="p-2 text-sm text-[var(--muted)]">{t("nothingSelected")}</p>
                    ) : (
                      programs.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-[var(--ink)] hover:bg-[var(--surface-2)]"
                        >
                          <input
                            type="checkbox"
                            checked={form.program_ids.includes(p.id)}
                            onChange={() => toggleProgram(p.id)}
                            className="h-4 w-4 rounded border-[var(--line-strong)] text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          {p.name}
                        </label>
                      ))
                    )}
                  </PopoverContent>
                </Popover>
                <p className="mt-1.5 text-[11px] text-[var(--muted)] sm:text-xs">{t("allCards")}</p>
              </div>

              {error && <p className="text-xs text-[var(--danger)] sm:text-sm">{error}</p>}
              <Button type="submit" disabled={saving} className="text-sm">
                {saving ? t("saving") : t("addLocation")}
              </Button>
            </Card>
          </form>

          <div className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[260px]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
              {t("previewTitle")}
            </p>
            <LocationPushPreview
              message={previewMessage}
              businessName={merchant.business_name ?? ""}
              logoUrl={merchant.logo_url}
              active
            />
            <p className="mt-3 text-center text-[11px] text-[var(--muted)] sm:text-xs">{t("previewCaption")}</p>
          </div>
        </div>
      )}

      <div className="mt-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] sm:text-sm">{t("listTitle")}</p>
        {localLocations.length === 0 ? (
          <Card className="mt-3">
            <p className="p-5 text-xs text-[var(--muted)] sm:text-sm">{t("noLocations")}</p>
          </Card>
        ) : (
          <StaggerGroup className="mt-3 space-y-2">
            {localLocations.map((loc) => (
              <Card key={loc.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ink)]">{loc.name}</p>
                  <p className="truncate text-xs text-[var(--muted)] sm:text-sm">
                    {loc.address || `${loc.latitude}, ${loc.longitude}`} · {loc.radius_meters}m
                    {loc.program_ids.length > 0 && ` · ${loc.program_ids.length} program(s)`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(loc)}
                    role="switch"
                    aria-checked={loc.is_active}
                    className={cn(
                      "h-6 w-11 shrink-0 rounded-full transition-colors active:scale-95 [transition-property:background-color,transform] duration-150",
                      loc.is_active ? "bg-[var(--success)]" : "bg-[var(--surface-3)]"
                    )}
                  >
                    {/* Not `absolute` — same non-absolute translate-x pattern as the
                     * other toggles in this app (email/notification prefs), which
                     * render correctly on mobile Safari. `absolute` here with no
                     * explicit left/start anchor left the knob's horizontal position
                     * up to the browser's "static position" fallback, which iOS
                     * Safari resolved outside the track instead of inside it. */}
                    <span
                      className={cn(
                        "block h-5 w-5 translate-x-0.5 rtl:-translate-x-0.5 rounded-full bg-white shadow transition-transform",
                        loc.is_active && "translate-x-[22px] rtl:-translate-x-[22px]"
                      )}
                    />
                  </button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(loc.id)} className="text-xs sm:text-sm">
                    {t("remove")}
                  </Button>
                </div>
              </Card>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
