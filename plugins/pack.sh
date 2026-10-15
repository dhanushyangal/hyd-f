#!/usr/bin/env bash
# Build downloadable plugin zips into public/plugins/
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$(cd "$ROOT/../public/plugins" && pwd)"
SHARED="$ROOT/shared"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUT"

pack_dir() {
  local name="$1"
  local src="$2"
  local dest="$TMP/$name"
  rm -rf "$dest"
  mkdir -p "$dest"
  cp -R "$src"/. "$dest"/
  (cd "$TMP" && zip -qr "$OUT/$name.zip" "$name")
  echo "Wrote $OUT/$name.zip"
}

# Blender: folder name must match addon package
rm -rf "$TMP/hydrilla_blender"
mkdir -p "$TMP/hydrilla_blender"
cp -R "$ROOT/blender/hydrilla_blender"/. "$TMP/hydrilla_blender"/
find "$TMP/hydrilla_blender" -name '__pycache__' -type d -exec rm -rf {} + 2>/dev/null || true
find "$TMP/hydrilla_blender" -name '*.pyc' -delete 2>/dev/null || true
rm -f "$OUT/hydrilla-blender.zip"
(cd "$TMP" && zip -qr "$OUT/hydrilla-blender.zip" hydrilla_blender)
echo "Wrote $OUT/hydrilla-blender.zip"

# Maya + shared clients + embedded bridge
rm -rf "$TMP/hydrilla-maya"
mkdir -p "$TMP/hydrilla-maya"
cp "$ROOT/maya/hydrilla_maya.py" "$TMP/hydrilla-maya/"
cp "$SHARED/hydrilla_api.py" "$TMP/hydrilla-maya/"
cp "$SHARED/hydrilla_bridge_client.py" "$TMP/hydrilla-maya/"
cp "$SHARED/bridge_server.py" "$TMP/hydrilla-maya/"
(cd "$TMP" && zip -qr "$OUT/hydrilla-maya.zip" hydrilla-maya)
echo "Wrote $OUT/hydrilla-maya.zip"

# 3ds Max
rm -rf "$TMP/hydrilla-3dsmax"
mkdir -p "$TMP/hydrilla-3dsmax"
cp "$ROOT/max/hydrilla_max.py" "$TMP/hydrilla-3dsmax/"
cp "$SHARED/hydrilla_api.py" "$TMP/hydrilla-3dsmax/"
cp "$SHARED/hydrilla_bridge_client.py" "$TMP/hydrilla-3dsmax/"
(cd "$TMP" && zip -qr "$OUT/hydrilla-3dsmax.zip" hydrilla-3dsmax)
echo "Wrote $OUT/hydrilla-3dsmax.zip"

# Unity
rm -rf "$TMP/Hydrilla"
mkdir -p "$TMP/Hydrilla/Editor"
cp "$ROOT/unity/Editor/HydrillaWindow.cs" "$TMP/Hydrilla/Editor/"
(cd "$TMP" && zip -qr "$OUT/hydrilla-unity.zip" Hydrilla)
echo "Wrote $OUT/hydrilla-unity.zip"

# Unreal
rm -rf "$TMP/hydrilla-unreal"
mkdir -p "$TMP/hydrilla-unreal/Hydrilla/shared"
cp "$ROOT/unreal/Hydrilla/hydrilla_unreal.py" "$TMP/hydrilla-unreal/Hydrilla/"
cp "$SHARED/hydrilla_api.py" "$TMP/hydrilla-unreal/Hydrilla/shared/"
cp "$SHARED/hydrilla_bridge_client.py" "$TMP/hydrilla-unreal/Hydrilla/shared/"
(cd "$TMP" && zip -qr "$OUT/hydrilla-unreal.zip" hydrilla-unreal)
echo "Wrote $OUT/hydrilla-unreal.zip"

# Godot
rm -rf "$TMP/hydrilla-godot"
mkdir -p "$TMP/hydrilla-godot"
cp -R "$ROOT/godot/addons" "$TMP/hydrilla-godot/"
(cd "$TMP" && zip -qr "$OUT/hydrilla-godot.zip" hydrilla-godot)
echo "Wrote $OUT/hydrilla-godot.zip"

# MCP
rm -rf "$TMP/hydrilla-mcp"
mkdir -p "$TMP/hydrilla-mcp"
cp -R "$ROOT/mcp/." "$TMP/hydrilla-mcp/"
rm -rf "$TMP/hydrilla-mcp/node_modules" "$TMP/hydrilla-mcp/dist"
(cd "$TMP" && zip -qr "$OUT/hydrilla-mcp.zip" hydrilla-mcp)
echo "Wrote $OUT/hydrilla-mcp.zip"

echo "Done."
