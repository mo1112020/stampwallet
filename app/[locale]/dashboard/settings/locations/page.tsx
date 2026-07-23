"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SkeletonRow } from "@/components/ui/skeleton";
import type { StoreLocation } from "@/types";

const LocationMap = dynamic(
  () => import("@/components/dashboard/settings/location-map").then((m) => m.LocationMap),
  { ssr: false }
);

const emptyForm = {
  name: "",
  address: "",
  latitude: "",
  longitude: "",
  radius_meters: "150",
};

export default function LocationsSettingsPage() {
  const t = useTranslations("settings.locations");
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/settings/locations");
    const json = await res.json();
    if (res.ok) setLocations(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const previewLat = Number(form.latitude);
  const previewLng = Number(form.longitude);
  const hasPreview = form.latitude !== "" && form.longitude !== "" && !Number.isNaN(previewLat) && !Number.isNaN(previewLng);

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>

      <form
        onSubmit={addLocation}
        className="mt-6 grid gap-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 md:grid-cols-2"
      >
        <div className="space-y-4">
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
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("addLocation")}
          </Button>
        </div>

        <div>
          {hasPreview ? (
            <LocationMap latitude={previewLat} longitude={previewLng} radiusMeters={Number(form.radius_meters) || 150} />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[var(--line)] text-sm text-[var(--muted)]">
              {t("previewHint")}
            </div>
          )}
        </div>
      </form>

      <div className="mt-8">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("listTitle")}</p>
        {loading ? (
          <div className="mt-3 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : locations.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noLocations")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">{loc.name}</p>
                  <p className="text-[var(--muted)]">
                    {loc.address || `${loc.latitude}, ${loc.longitude}`} · {loc.radius_meters}m
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(loc)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      loc.is_active
                        ? "bg-[var(--success-soft)] text-[var(--success)]"
                        : "bg-[var(--surface-2)] text-[var(--muted)]"
                    }`}
                  >
                    {loc.is_active ? t("active") : t("inactive")}
                  </button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => remove(loc.id)}>
                    {t("remove")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
