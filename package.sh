#!/bin/bash

# Script to bundle the GNOME Window Limiter extension

UUID="gnome-window-limiter@sobeitnow0.github.com"
SRC_DIR="$(dirname "$(realpath "$0")")"
ZIP_NAME="${UUID}.shell-extension.zip"

echo "=== GNOME Window Limiter Extension Packager ==="

# Check if gnome-extensions tool is available
if ! command -v gnome-extensions &> /dev/null; then
    echo "Error: 'gnome-extensions' tool is not installed or not in PATH."
    echo "Please install it (usually part of gnome-shell package) to package the extension."
    exit 1
fi

PACK_ARGS=(
    "$SRC_DIR"
    --out-dir="$SRC_DIR"
    --force
    --podir="$SRC_DIR/po"
    --gettext-domain="gnome-window-limiter"
)

if [ -f "$SRC_DIR/logo.png" ]; then
    PACK_ARGS+=(--extra-source="logo.png")
fi

# Run gnome-extensions pack
echo "Packaging extension..."
gnome-extensions pack "${PACK_ARGS[@]}"

if [ -f "$SRC_DIR/$ZIP_NAME" ]; then
    echo "Success! Package created:"
    echo "  $SRC_DIR/$ZIP_NAME"
    echo ""
    echo "You can now distribute this ZIP file or attach it to GitHub Releases."
else
    echo "Error: Failed to create package."
    exit 1
fi
