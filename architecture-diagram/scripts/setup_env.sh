#!/usr/bin/env bash
# Runtime check for the architecture-diagram scripts.
#   * runtime: Node.js >= 18  (diagram.mjs imports only node built-ins: fs, path)
#   * no third-party packages — nothing to install
#
# Read-only and idempotent: it only verifies the runtime is present, then prints usage.
set -u

echo "== node runtime =="
if command -v node >/dev/null 2>&1; then
  echo "found node $(node -v)"
else
  echo "ERROR: node not found on PATH. Install Node.js >= 18 (no other deps needed)."
  exit 1
fi

echo "== usage =="
echo "  node scripts/diagram.mjs <input.json> [--out <dir>]"
echo "  # input.json single: {title, layers:[{name,nodes:[{label,anchor,id}]}], flow:[{from,to,label}]}"
echo "  # input.json compare: {title, readOnce, A:{layers,flow}, B:{layers,flow}}"
echo "  # writes <base>.mmd (Mermaid) and <base>.html (self-contained)"
echo "  # see examples/dsh-core.json"
