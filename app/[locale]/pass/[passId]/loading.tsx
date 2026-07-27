export default function PassLoading() {
  return (
    <main
      className="min-h-screen px-4 py-10 sm:py-14"
      style={{ backgroundColor: "#f6f6f6" }}
    >
      <div className="mx-auto flex w-full max-w-sm animate-pulse flex-col items-center">
        <div className="h-14 w-14 rounded-2xl bg-black/[0.06]" />
        <div className="mt-3 h-4 w-32 rounded-full bg-black/[0.06]" />
        <div className="mt-2 h-3 w-24 rounded-full bg-black/[0.06]" />

        <div className="mt-6 h-[220px] w-full rounded-2xl bg-black/[0.06]" />
        <div className="mt-5 h-[104px] w-full rounded-2xl bg-black/[0.06]" />
        <div className="mt-5 h-12 w-full rounded-full bg-black/[0.06]" />
        <div className="mt-2.5 h-12 w-full rounded-full bg-black/[0.06]" />
      </div>
    </main>
  );
}
