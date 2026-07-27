// Generic instant-navigation fallback for every dashboard route that doesn't
// define its own more specific loading.tsx — Next.js wraps this segment's
// page.tsx (and any nested route without its own loading.tsx) in a
// <Suspense> boundary, so this paints immediately on click instead of
// leaving the screen frozen while the target page's data fetch resolves.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-40 rounded-full bg-[var(--surface-3)]" />
      <div className="mt-4 h-8 w-64 rounded-full bg-[var(--surface-3)]" />
      <div className="mt-2 h-4 w-96 max-w-full rounded-full bg-[var(--surface-3)]" />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-24 rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-24 rounded-2xl bg-[var(--surface-2)]" />
        <div className="h-24 rounded-2xl bg-[var(--surface-2)]" />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-14 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-14 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-14 rounded-xl bg-[var(--surface-2)]" />
        <div className="h-14 rounded-xl bg-[var(--surface-2)]" />
      </div>
    </div>
  );
}
