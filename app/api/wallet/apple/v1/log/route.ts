// Apple's devices POST client-side error logs here. We just capture them
// for visibility — see docs/05-wallet-integration.md ("log every wallet
// generation/update call").
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { logs?: string[] } | null;
  for (const line of body?.logs ?? []) {
    console.warn("[wallet:apple:device-log]", line);
  }
  return new Response(null, { status: 200 });
}
