#!/usr/bin/env bash
# Runtime check for the codebase-walkthrough scripts.
#   * runtime: Node.js >= 18  (scan.mjs imports only node built-ins: fs, path)
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
echo "  node scripts/scan.mjs [dir] [--out report.md] [--depth N] [--top N]"
echo "  # prints a repo skeleton: ext distribution, likely entry points, biggest files, README digest"
echo "  # see examples/scan-sample.md"
