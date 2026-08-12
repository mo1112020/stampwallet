import { Skeleton } from "@/components/ui/skeleton";

// Settings-specific fallback: the dashboard-wide loading.tsx is shaped like
// KPI cards + list rows, which doesn't match any settings form, so it
// flashed an unrelated layout on every settings nav click. This mirrors the
// actual settings page shape (intro line + a handful of labeled fields).
export default function SettingsLoading() {
  return (
    <div className="max-w-md space-y-6">
      <Skeleton className="h-4 w-3/4" />
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-24" />
    </div>
  );
}
