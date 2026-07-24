"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonRow } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { LocationPushPreview } from "@/components/dashboard/settings/location-preview";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import type { Plan, StoreLocation } from "@/types";

const LocationMap = dynamic(
  () => import("@/components/dashboard/settings/location-map").then((m) => m.LocationMap),
  { ssr: false }
);

const METERS_TO_FEET = 3.28084;

const emptyForm = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius_meters: "150",
  relevant_text: "",
  program_ids: [] as string[],
};

export default function LocationsSettingsPage() {
  const t = useTranslations("settings.locations");
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [merchant, setMerchant] = useState<{ business_name: string; logo_url: string | null; plan: Plan } | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [locRes, progRes, merchantRes] = await Promise.all([
      fetch("/api/settings/locations"),
      fetch("/api/programs"),
      fetch("/api/merchants/me"),
    ]);
    const locJson = await locRes.json();
    if (locRes.ok) setLocations(locJson.data ?? []);
    const progJson = await progRes.json();
    if (progRes.ok) setPrograms(progJson.data ?? []);
    const merchantJson = await merchantRes.json();
    if (merchantRes.ok) setMerchant(merchantJson.data ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const limit = merchant ? PLAN_LIMITS[merchant.plan].maxLocations : null;
  const atLimit = limit !== null && locations.length >= limit;

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/settings/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius_meters: Number(form.radius_meters) || 150,
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
    load();
  }

  async function toggleActive(location: StoreLocation) {
    await fetch(`/api/settings/locations/${location.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !location.is_active }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/settings/locations/${id}`, { method: "DELETE" });
    load();
  }

  function toggleProgram(id: string) {
    setForm((prev) => ({
      ...prev,
      program_ids: prev.program_ids.includes(id) ? prev.program_ids.filter((p) => p !== id) : [...prev.program_ids, id],
    }));
  }

  const previewLat = Number(form.latitude);
  const previewLng = Number(form.longitude);
  const hasPreview = form.latitude !== "" && form.longitude !== "" && !Number.isNaN(previewLat) && !Number.isNaN(previewLng);
  const radiusMeters = Number(form.radius_meters) || 150;

  const applyToCardsLabel =
    form.program_ids.length === 0
      ? t("allCards")
      : form.program_ids.length === programs.length
        ? t("allCards")
        : `${form.program_ids.length} selected`;

  const previewMessage =
    form.relevant_text.trim() || t("messagePlaceholder", { business: merchant?.business_name || "Your business" });

  return (
    <div className="max-w-5xl">
      <Reveal as="div" className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      </Reveal>
      <Badge variant="primary" className="mt-3">
        <MapPin className="h-3 w-3" />
        {t("geoPushBadge", { meters: radiusMeters, feet: Math.round(radiusMeters * METERS_TO_FEET) })}
      </Badge>
      {limit !== null && (
        <p className="mt-2 text-xs text-[var(--muted)]">{t("limitNote", { limit })}</p>
      )}

      {atLimit && (
        <div className="mt-4 rounded-xl bg-[var(--surface-2)] px-4 py-3 text-center text-sm text-[var(--muted)]">
          {t("limitReached")}
        </div>
      )}

      {!atLimit && (
        <div className="mt-6 flex flex-col-reverse gap-8 lg:flex-row lg:items-start">
          <form onSubmit={addLocation} className="flex-1 space-y-5">
            <Card className="space-y-4 p-6">
              <div>
                <Label htmlFor="name">{t("name")}</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="address">{t("address")}</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lat">{t("latitude")}</Label>
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    required
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lng">{t("longitude")}</Label>
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    required
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="radius">{t("radius")}</Label>
                <Input
                  id="radius"
                  type="number"
                  min={20}
                  max={5000}
                  value={form.radius_meters}
                  onChange={(e) => setForm({ ...form, radius_meters: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="message">{t("message")}</Label>
                <Textarea
                  id="message"
                  rows={2}
                  maxLength={200}
                  value={form.relevant_text}
                  onChange={(e) => setForm({ ...form, relevant_text: e.target.value })}
                  placeholder={t("messagePlaceholder", { business: merchant?.business_name || "Your business" })}
                />
              </div>

              <div>
                <Label>{t("applyToCards")}</Label>
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
                <p className="mt-1.5 text-xs text-[var(--muted)]">{t("allCards")}</p>
              </div>

              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <Button type="submit" disabled={saving}>
                {saving ? t("saving") : t("addLocation")}
              </Button>
            </Card>

            {hasPreview && (
              <Card className="p-4">
                <LocationMap latitude={previewLat} longitude={previewLng} radiusMeters={radiusMeters} />
              </Card>
            )}
          </form>

          <div className="w-full shrink-0 lg:sticky lg:top-8 lg:w-[260px]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">{t("previewTitle")}</p>
            <LocationPushPreview
              message={previewMessage}
              businessName={merchant?.business_name ?? ""}
              logoUrl={merchant?.logo_url}
              active
            />
            <p className="mt-3 text-center text-xs text-[var(--muted)]">{t("previewCaption")}</p>
          </div>
        </div>
      )}

      <div className="mt-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("listTitle")}</p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : locations.length === 0 ? (
          <Card className="mt-3">
            <p className="p-5 text-sm text-[var(--muted)]">{t("noLocations")}</p>
          </Card>
        ) : (
          <StaggerGroup className="mt-3 space-y-2">
            {locations.map((loc) => (
              <Card key={loc.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--ink)]">{loc.name}</p>
                  <p className="truncate text-sm text-[var(--muted)]">
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
                      "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                      loc.is_active ? "bg-[var(--success)]" : "bg-[var(--surface-3)]"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                        loc.is_active ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0.5 rtl:-translate-x-0.5"
                      )}
                    />
                  </button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(loc.id)}>
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
