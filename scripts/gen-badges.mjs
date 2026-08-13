#!/usr/bin/env node
/**
 * Link badges (assets/badge-*.png), rendered locally.
 *
 * shields.io would do this in one URL, but the badges are the first thing on
 * the page and a third-party outage turns them into broken images — which is
 * exactly what happened to the github-readme-stats cards. These are drawn here
 * instead, in the banner's language: black pill, phosphor-green hairline
 * border, Menlo label, brand glyph on the left.
 *
 * Icon paths are the site's own (src/lib/assets/svg/ui.ts — simple-icons
 * bodies), copied in so this repo stays standalone.
 *
 * Usage: node scripts/gen-badges.mjs
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const GREEN = "#00ff41";
const INK = "#f5f1ea";
const BORDER = "#1e2a1e";
const BG = "#080a08";

// 24×24 bodies. `fill` marks paint solid; `stroke` marks are outlines.
const ICONS = {
  globe: {
    kind: "stroke",
    body: `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>`,
  },
  mcp: {
    kind: "stroke",
    body: `<circle cx="12" cy="12" r="3"/><path d="M12 2v7M12 15v7M2 12h7M15 12h7"/>`,
  },
  telegram: {
    kind: "stroke",
    body: `<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>`,
  },
  x: {
    kind: "fill",
    body: `<path d="M18.244 2H21.5l-7.5 8.572L23 22h-6.91l-4.81-6.288L5.7 22H2.44l8.02-9.166L1.5 2h7.05l4.34 5.745L18.244 2z"/>`,
  },
  linkedin: {
    kind: "fill",
    body: `<path d="M4 4h4v16H4zM6 2.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h3.8v2.2h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V20h-4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8h-4V8z"/>`,
  },
  mail: {
    kind: "stroke",
    body: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>`,
  },
  pdf: {
    kind: "stroke",
    body: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15h6"/>`,
  },
};

const BADGES = [
  { out: "site", icon: "globe", label: "rubenmarcus.dev", accent: true },
  { out: "mcp", icon: "mcp", label: "connect your agent", accent: true },
  { out: "telegram", icon: "telegram", label: "@rubenmarcus" },
  { out: "x", icon: "x", label: "@rubenmarcus_dev" },
  { out: "linkedin", icon: "linkedin", label: "in/rubenmarcus" },
  { out: "cv", icon: "pdf", label: "CV" },
  { out: "email", icon: "mail", label: "ruben@rubenmarcus.dev" },
];

// Rendered at 3× and displayed at height=28, so the type stays crisp on
// retina and inside GitHub's image proxy.
const SCALE = 3;
const H = 34 * SCALE;
const PAD = 15 * SCALE;
const GAP = 9 * SCALE;
const ICON = 15 * SCALE;
const FONT = 13.5 * SCALE;
const CHAR = FONT * 0.6; // Menlo advance width

for (const b of BADGES) {
  const color = b.accent ? GREEN : INK;
  const textW = Math.ceil(b.label.length * CHAR);
  const W = PAD * 2 + ICON + GAP + textW;
  const icon = ICONS[b.icon];
  const iconAttrs =
    icon.kind === "fill"
      ? `fill="${color}" stroke="none"`
      : `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${H / 2}" fill="${BG}" stroke="${b.accent ? GREEN : BORDER}" stroke-width="${b.accent ? 2 : 2}"/>
    <g transform="translate(${PAD}, ${(H - ICON) / 2}) scale(${ICON / 24})" ${iconAttrs}>${icon.body}</g>
    <text x="${PAD + ICON + GAP}" y="${H / 2}" dominant-baseline="central" font-family="Menlo, monospace" font-size="${FONT}" fill="${color}">${b.label}</text>
  </svg>`;

  const out = join(root, `assets/badge-${b.out}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`saved ${out} (${W}×${H})`);
}
