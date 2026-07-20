#!/usr/bin/env bash
# Place Barnule + Flexing trial fonts into public/fonts/
# Avona is already included. Commercial projects need paid licenses.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/public/fonts"
mkdir -p "$DEST"

echo "Download personal-use trial fonts and copy them here:"
echo "  $DEST"
echo ""
echo "Required filenames:"
echo "  Barnule-Regular.ttf   (from https://zarmatype.com/ or FontSpace Barnule & Mauren trial)"
echo "  Flexing-Regular.ttf   (from https://www.1001fonts.com/flexing-demo-font.html)"
echo "  Avona-Regular.ttf     (already present)"
echo ""
echo "After copying, restart: npm run dev"
