"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icon paths break under most bundlers unless
// pointed at CDN-hosted images explicitly — a well-known Leaflet+webpack
// gotcha, not something WalletOS-specific.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng, map]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationMap({
  latitude,
  longitude,
  radiusMeters,
  onPick,
  interactive = false,
}: {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  /** When provided, clicking (and dragging the marker) sets the location — the map becomes the picker. */
  onPick?: (lat: number, lng: number) => void;
  interactive?: boolean;
}) {
  const t = useTranslations("settings.locations");
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-[var(--line)]">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", cursor: onPick ? "crosshair" : undefined }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[latitude, longitude]}
          icon={markerIcon}
          draggable={Boolean(onPick)}
          eventHandlers={
            onPick
              ? {
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const pos = marker.getLatLng();
                    onPick(pos.lat, pos.lng);
                  },
                }
              : undefined
          }
        />
        <Circle center={[latitude, longitude]} radius={radiusMeters} pathOptions={{ color: "#3E0856" }} />
        <Recenter lat={latitude} lng={longitude} />
        {onPick && <ClickToPick onPick={onPick} />}
      </MapContainer>
      {interactive && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2.5 text-center text-xs font-medium text-white">
          {t("mapPickHint")}
        </div>
      )}
    </div>
  );
}
