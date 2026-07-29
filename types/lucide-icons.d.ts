// lucide-react ships each icon's raw path data at a deep import path with no
// declaration file of its own (only the package's top-level public API is
// typed) — see lib/wallet/stampIcons.ts for why we import these directly.
declare module "lucide-react/dist/esm/icons/*.mjs" {
  export const __iconNode: [string, Record<string, string>][];
}
