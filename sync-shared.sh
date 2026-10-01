#!/usr/bin/env bash
# Copies shared/ into web/src/shared and app/shared. Always edit shared/, never the copies.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/shared"

copy_to() {
  local dest="$1"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$SRC"/. "$dest"/
  rm -f "$dest/.gitkeep"
  echo "Synced shared/ -> ${dest#"$ROOT"/}"
}

copy_to "$ROOT/web/src/shared"

if [ -d "$ROOT/app" ]; then
  copy_to "$ROOT/app/shared"
else
  echo "Skipped app/shared (no app/ folder yet)"
fi
