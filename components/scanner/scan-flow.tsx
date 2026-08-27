"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CameraScanner } from "@/components/scanner/camera-scanner";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import type { LoyaltyProgram, Progress } from "@/types";

type LookupResult = {
  pass_id: string;
  progress: Progress;
  program: Pick<LoyaltyProgram, "id" | "name" | "type" | "config" | "is_active">;
  customer: { name: string | null; phone: string | null; email: string | null } | null;
  business_name: string;
};

type SearchResult = {
  pass_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  program_name: string;
  program_active: boolean;
};

const SEARCH_DEBOUNCE_MS = 300;

type ScanOutcome = {
  reward_available: boolean;
  reward_description: string;
};

type HistoryEntry = {
  id: string;
  delta: Record<string, number>;
  resulted_in_reward: boolean;
  created_at: string;
  customer_progress: {
    customers: { name: string | null } | null;
    loyalty_programs: { name: string } | null;
  } | null;
};

type Stage = "scanning" | "loading" | "confirm" | "submitting" | "result" | "error" | "sessionExpired" | "offline";

const AUTO_RESUME_MS = 2500;

/**
 * The scan/confirm/result/history flow shared by the dashboard's Scan page
 * and the standalone Scanner PWA — same backend (/api/scan, /api/scan/
 * lookup, /api/scan/history), different chrome around it. Callers own the
 * page title and layout; this owns the interactive part.
 */
export function ScanFlow({ dark = false }: { dark?: boolean }) {
  const t = useTranslations("scanner");
  const td = useTranslations("dashboard");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) ?? "en";
  // Dashboard's embedded Scan page and the standalone Scanner PWA sit under
  // different auth gates (/login vs /scan-app/login) — `dark` already
  // distinguishes the two contexts everywhere else in this component, so
  // it doubles as the signal for where "log in again" should send you.
  const loginPath = dark ? `/${locale}/scan-app/login` : `/${locale}/login`;

  const [stage, setStage] = useState<Stage>("scanning");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  // Kept as the raw string the input shows rather than a number, so the
  // field can sit empty mid-edit (e.g. backspacing "1" to type "5")
  // instead of a Number("") || 1 fallback snapping it back to "1" before
  // the next keystroke lands.
  const [amount, setAmount] = useState("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<ScanOutcome | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const resumeTimerRef = useRef<number | null>(null);

  // Manual fallback for whenever the camera can't read a code — bad
  // lighting, a cracked/dirty phone screen, denied camera permission, or a
  // device with no camera at all. Always visible above the camera rather
  // than only appearing after a camera error, so it's available regardless
  // of why scanning isn't working.
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounceRef = useRef<number | null>(null);
  const searchRequestIdRef = useRef(0);

  // Shared by every request this component makes: a 401 mid-session means
  // the merchant/staff session expired (or was revoked elsewhere) — that's
  // a distinct, recoverable state from "this specific scan failed" and
  // needs its own screen rather than surfacing as a generic error. A
  // network failure (offline) is likewise distinct from a server-side
  // rejection: retrying a scan without connectivity risks the request
  // silently never reaching the rate limiter/unique-constraint checks that
  // prevent double-awarding, so it gets its own clear "no connection" state
  // instead of a queued/retried write (see public/sw.js's same reasoning).
  const authedFetch = useCallback(
    async (input: string, init?: RequestInit) => {
      let res: Response;
      try {
        res = await fetch(input, init);
      } catch {
        setStage("offline");
        return null;
      }
      if (res.status === 401) {
        setStage("sessionExpired");
        return null;
      }
      return res;
    },
    []
  );

  const loadHistory = useCallback(async () => {
    const res = await authedFetch("/api/scan/history?limit=10");
    if (!res || !res.ok) return;
    const json = await res.json();
    setHistory(json.data ?? []);
  }, [authedFetch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // Debounced so every keystroke doesn't fire its own request; a stale
  // response landing after a newer one is dropped via the request-id guard
  // rather than a naive "last fetch wins by timing," which isn't reliable
  // when requests can complete out of order.
  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchDebounceRef.current = window.setTimeout(async () => {
      const requestId = ++searchRequestIdRef.current;
      const res = await authedFetch(`/api/scan/search?q=${encodeURIComponent(query)}`);
      if (requestId !== searchRequestIdRef.current) return;
      setSearching(false);
      if (!res || !res.ok) return;
      const json = await res.json();
      if (requestId !== searchRequestIdRef.current) return;
      setSearchResults(json.data ?? []);
    }, SEARCH_DEBOUNCE_MS);
  }, [searchQuery, authedFetch]);

  function clearSearch() {
    setSearchQuery("");
    setSearchResults([]);
    setSearching(false);
  }

  function reset() {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    setStage("scanning");
    setLookup(null);
    setOutcome(null);
    setErrorMessage(null);
    setAmount("1");
    clearSearch();
  }

  function goToLogin() {
    router.push(loginPath);
  }

  async function handleScan(passId: string) {
    setStage("loading");
    const res = await authedFetch(`/api/scan/lookup?pass_id=${encodeURIComponent(passId)}`);
    if (!res) return;
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error?.message ?? t("notFound"));
      setStage("error");
      return;
    }
    setLookup(json.data);
    setStage("confirm");
  }

  async function submit(action: "award" | "redeem") {
    if (!lookup) return;
    setStage("submitting");
    const res = await authedFetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pass_id: lookup.pass_id,
        action,
        amount: action === "award" ? Math.max(1, parseInt(amount, 10) || 1) : undefined,
      }),
    });
    if (!res) return;
    const json = await res.json();
    if (!res.ok) {
      setErrorMessage(json.error?.message ?? "Scan failed");
      setStage("error");
      return;
    }
    setOutcome({
      reward_available: json.data.reward_available,
      reward_description: json.data.reward_description,
    });
    setStage("result");
    loadHistory();
    // Standalone Scanner PWA only: a merchant scanning a line of customers
    // shouldn't have to tap "Scan next" every time — auto-resume after a
    // brief moment to read the result. The dashboard's embedded Scan page
    // keeps manual control since it's used in a lower-volume, browse-around
    // context alongside the rest of the dashboard.
    if (dark) {
      resumeTimerRef.current = window.setTimeout(reset, AUTO_RESUME_MS);
    }
  }

  const fields =
    lookup &&
    renderPassFields(lookup.program.type, lookup.program.config, lookup.progress, lookup.business_name);
  const showAmountInput = lookup?.program.type === "points" || lookup?.program.type === "steps";

  const cardClass = dark
    ? "rounded-2xl border border-white/10 bg-white/5 p-6"
    : "rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6";
  const mutedClass = dark ? "text-white/60" : "text-[var(--muted)]";

  return (
    <div>
      <div>
        {stage === "scanning" && (
          <div className="mb-4">
            <div className="relative">
              <Search className={`pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${mutedClass}`} />
              <Input
                type="search"
                inputMode="search"
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10 pe-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label={t("clearSearch")}
                  className={`absolute end-1.5 top-1/2 -translate-y-1/2 rounded-full p-2.5 opacity-60 transition-opacity hover:opacity-100`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {(searching || searchResults.length > 0) && (
              <div
                className={`mt-2 overflow-hidden rounded-2xl border ${
                  dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                {searching ? (
                  <p className={`p-4 text-sm ${mutedClass}`}>{t("searching")}</p>
                ) : searchResults.length === 0 ? (
                  <p className={`p-4 text-sm ${mutedClass}`}>{t("noResults")}</p>
                ) : (
                  <ul className={`divide-y ${dark ? "divide-white/10" : "divide-[var(--line)]"}`}>
                    {searchResults.map((r, i) => (
                      <li key={`${r.pass_id}-${i}`}>
                        <button
                          type="button"
                          onClick={() => {
                            clearSearch();
                            handleScan(r.pass_id);
                          }}
                          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-start transition-colors ${
                            dark ? "hover:bg-white/5" : "hover:bg-[var(--surface-2)]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.customer_name || t("unknownCustomer")}</p>
                            <p className={`truncate text-xs ${mutedClass}`}>
                              {[r.customer_phone, r.program_name].filter(Boolean).join(" · ")}
                            </p>
                          </div>
                          {!r.program_active && (
                            <span className={`shrink-0 text-xs ${mutedClass}`}>{t("inactiveProgram")}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {stage === "scanning" && <CameraScanner onScan={handleScan} />}

        {(stage === "loading" || stage === "submitting") && (
          <div
            className={`flex aspect-square w-full items-center justify-center rounded-2xl border ${
              dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <p className={`text-sm ${mutedClass}`}>{t("lookingUp")}</p>
          </div>
        )}

        {stage === "error" && (
          <div
            className={`rounded-2xl border p-6 text-center ${
              dark ? "border-red-400/20 bg-red-500/10" : "border-[var(--danger)]/20 bg-[var(--danger-soft)]"
            }`}
          >
            <p className={`text-sm ${dark ? "text-red-300" : "text-[var(--danger)]"}`}>{errorMessage}</p>
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}

        {stage === "sessionExpired" && (
          <div
            className={`rounded-2xl border p-6 text-center ${
              dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
            }`}
          >
            <p className="text-lg font-semibold">{t("sessionExpiredTitle")}</p>
            <p className={`mt-1 text-sm ${mutedClass}`}>{t("sessionExpiredBody")}</p>
            <Button className="mt-4" onClick={goToLogin}>
              {t("logInAgain")}
            </Button>
          </div>
        )}

        {stage === "offline" && (
          <div
            className={`rounded-2xl border p-6 text-center ${
              dark ? "border-amber-400/20 bg-amber-500/10" : "border-amber-300 bg-amber-50"
            }`}
          >
            <p className={`text-lg font-semibold ${dark ? "text-amber-300" : "text-amber-700"}`}>
              {t("offlineTitle")}
            </p>
            <p className={`mt-1 text-sm ${mutedClass}`}>{t("offlineBody")}</p>
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}

        {stage === "confirm" && lookup && fields && (
          <div className={`space-y-4 ${cardClass}`}>
            <div>
              <p className="font-semibold">{lookup.customer?.name || t("unknownCustomer")}</p>
              {lookup.customer?.phone && (
                <p className={`text-sm ${mutedClass}`}>{lookup.customer.phone}</p>
              )}
              <p className={`mt-1 text-sm ${mutedClass}`}>{lookup.program.name}</p>
            </div>

            <div className={dark ? "rounded-xl bg-white/10 p-4 text-sm" : "rounded-xl bg-[var(--surface-2)] p-4 text-sm"}>
              <p className={mutedClass}>{fields.primaryLabel}</p>
              <p className="text-lg font-semibold">{fields.primaryValue}</p>
              {fields.rewardAvailable && (
                <p className="mt-2 font-semibold text-[var(--accent)]">{td("rewardAvailable")}</p>
              )}
            </div>

            {!lookup.program.is_active && (
              <p className={`text-sm ${dark ? "text-red-400" : "text-[var(--danger)]"}`}>{t("programInactive")}</p>
            )}

            {showAmountInput && (
              <div>
                <Label htmlFor="amount">{td("pointsAmount")}</Label>
                <Input
                  id="amount"
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => setAmount(String(Math.max(1, parseInt(amount, 10) || 1)))}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={!lookup.program.is_active}
                onClick={() => submit("award")}
              >
                {td("award")}
              </Button>
              {fields.rewardAvailable && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={!lookup.program.is_active}
                  onClick={() => submit("redeem")}
                >
                  {td("redeem")}
                </Button>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={reset}>
              {t("cancel")}
            </Button>
          </div>
        )}

        {stage === "result" && outcome && (
          <div className={`text-center ${cardClass}`}>
            <p className="text-lg font-semibold">
              {outcome.reward_available ? t("redeemSuccess") : t("awardSuccess")}
            </p>
            {outcome.reward_description && (
              <p className={`mt-1 text-sm ${mutedClass}`}>{outcome.reward_description}</p>
            )}
            <Button className="mt-4" onClick={reset}>
              {t("scanAgain")}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className={`text-sm font-semibold ${mutedClass}`}>{t("recentScans")}</h2>
        {history.length === 0 ? (
          <p className={`mt-2 text-sm ${mutedClass}`}>{t("noHistory")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${
                  dark ? "border-white/10 bg-white/5" : "border-[var(--line)] bg-[var(--surface)]"
                }`}
              >
                <div>
                  <p className="font-medium">
                    {entry.customer_progress?.customers?.name || t("unknownCustomer")}
                  </p>
                  <p className={mutedClass}>{entry.customer_progress?.loyalty_programs?.name}</p>
                </div>
                <div className={`text-right ${mutedClass}`}>
                  {entry.resulted_in_reward && (
                    <span className="me-2 text-[var(--accent)]">🎁</span>
                  )}
                  {new Date(entry.created_at).toLocaleTimeString()}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
