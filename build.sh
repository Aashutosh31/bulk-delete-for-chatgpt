#!/usr/bin/env bash
# Assembles loadable extension folders and store-ready zip files.
# No network access; needs only coreutils + zip.
set -euo pipefail
cd "$(dirname "$0")"

VERSION="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' manifests/manifest.firefox.json | head -n1)"
[ -n "$VERSION" ] || { echo "could not read version" >&2; exit 1; }

rm -rf build dist
mkdir -p dist

for target in firefox chrome; do
  out="build/$target"
  mkdir -p "$out"
  cp -R src "$out/src"
  cp -R icons "$out/icons"
  cp "manifests/manifest.$target.json" "$out/manifest.json"

  (cd "$out" && zip -qr "../../dist/bulk-delete-for-chatgpt-$target-$VERSION.zip" .)
done

cat <<EOF
Built version $VERSION

  build/firefox   -> about:debugging#/runtime/this-firefox
                     Load Temporary Add-on -> build/firefox/manifest.json
  build/chrome    -> chrome://extensions
                     Developer mode -> Load unpacked -> build/chrome

  dist/bulk-delete-for-chatgpt-firefox-$VERSION.zip
  dist/bulk-delete-for-chatgpt-chrome-$VERSION.zip
EOF
