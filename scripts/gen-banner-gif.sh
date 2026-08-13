#!/usr/bin/env bash
# Animated profile banner (1200×450 GIF) for the GitHub README.
#
# GitHub renders GIFs inline in a README; MP4 in an <img> does not play. So the
# rubenmarcus.dev hero loop gets re-cut here: the pillarboxed portrait video is
# cropped out, parked on the right of a wide black canvas, and the headline is
# burned in from assets/gif-overlay.png (built by scripts/gen-banner.mjs).
#
# Two passes — palette first, then apply — because a single-pass split into
# palettegen stalls on the infinite color/image sources feeding the graph.
#
# Usage: scripts/gen-banner-gif.sh [path/to/hero-loop.mp4]
# Output: assets/banner.gif
set -euo pipefail

cd "$(dirname "$0")/.."
SRC="${1:-assets/hero-loop.mp4}"
OUT="assets/banner.gif"
PALETTE="$(mktemp -t banner-palette).png"
trap 'rm -f "$PALETTE"' EXIT

# 4s of the 8s loop at 12fps keeps the file small; the source has no hard cut,
# so it still reads as a continuous loop.
FILTER="[0:v]fps=12,crop=562:720:358:0,scale=-1:525,crop=410:450:0:60[v];\
color=c=black:s=1200x450:r=12:d=4[bg];\
[bg][v]overlay=798:0:shortest=1[bv];\
[bv][1:v]overlay=0:0[out]"

ffmpeg -v error -t 4 -i "$SRC" -loop 1 -t 4 -i assets/gif-overlay.png \
  -filter_complex "${FILTER};[out]palettegen=max_colors=64:stats_mode=diff" \
  -frames:v 1 -y "$PALETTE"

ffmpeg -v error -t 4 -i "$SRC" -loop 1 -t 4 -i assets/gif-overlay.png -i "$PALETTE" \
  -filter_complex "${FILTER};[out][2:v]paletteuse=dither=bayer:bayer_scale=3" \
  -loop 0 -y "$OUT"

echo "saved $OUT ($(du -h "$OUT" | cut -f1))"
