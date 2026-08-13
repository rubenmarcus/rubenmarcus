#!/usr/bin/env node
/**
 * Wide profile banner (1600×600) for the GitHub profile README.
 *
 * Same visual language as the rubenmarcus.dev hero: pure black void, phosphor
 * green (#00ff41) scanline portrait. The portrait is the site hero asset
 * (assets/hero-source.png) placed on the right with a soft left fade; the
 * headline is composited locally with sharp via SVG (Menlo) so the type is
 * deterministic and typo-free.
 *
 * Usage: node scripts/gen-banner.mjs
 * Output: assets/banner.png
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const W = 1600;
const H = 600;
const GREEN = "#00ff41";
const INK = "#f5f1ea";
const MUTED = "#8a9488";
const M = 76; // left margin

// ── portrait: scale to full height, park it on the right ──────────────────
// Oversize then crop: at 1:1 height the subject reads too small in a 1600px
// banner, so scale up and keep the face-to-keyboard band.
const portrait = await sharp(join(root, "assets/hero-source.png"))
  .resize({ height: 800 })
  .extract({ left: 0, top: 150, width: 622, height: H })
  .toBuffer();
const pw = (await sharp(portrait).metadata()).width;
const px = W - pw + 10; // small bleed so the frame edge stays black

// Feather the left edge of the portrait into the void — the source already
// has a dark left third, the mask just kills the seam.
const fade = Buffer.from(
  `<svg width="${pw}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" x2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.28" stop-color="#fff" stop-opacity="1"/>
    </linearGradient></defs>
    <rect width="${pw}" height="${H}" fill="url(#g)"/>
  </svg>`,
);
const faded = await sharp(portrait)
  .composite([{ input: fade, blend: "dest-in" }])
  .png()
  .toBuffer();

// ── type ──────────────────────────────────────────────────────────────────
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${M}" y="150" font-family="Menlo, monospace" font-size="22" letter-spacing="5" fill="${GREEN}">RUBENMARCUS.DEV</text>
  <text x="${M}" y="272" font-family="Menlo, monospace" font-weight="bold" font-size="70" fill="${INK}">I build agent-ready</text>
  <text x="${M}" y="352" font-family="Menlo, monospace" font-weight="bold" font-size="70" fill="${INK}">products<tspan fill="${GREEN}">.</tspan></text>
  <rect x="${M}" y="404" width="120" height="2" fill="${GREEN}"/>
  <text x="${M}" y="456" font-family="Menlo, monospace" font-size="23" fill="${MUTED}">Senior AI Fullstack Engineer  ·  14 years shipping  ·  Lisbon</text>
  <text x="${M}" y="494" font-family="Menlo, monospace" font-size="23" fill="${GREEN}">agents, harnesses, evals, MCP</text>
</svg>`;

// ── overlay for the animated GIF (gen-banner-gif.sh) ──────────────────────
// Transparent PNG at GIF size: the same type, plus a black→transparent band
// that feathers the video's left edge into the void.
const GW = 1200;
const GH = 450;
const GS = GH / H; // type scales with the canvas
const VIDEO_X = 798; // must match gen-banner-gif.sh
const s = (n) => Math.round(n * GS);
const overlay = `<svg width="${GW}" height="${GH}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="f" x1="0" x2="1">
    <stop offset="0" stop-color="#000" stop-opacity="1"/>
    <stop offset="1" stop-color="#000" stop-opacity="0"/>
  </linearGradient></defs>
  <rect x="${VIDEO_X}" y="0" width="130" height="${GH}" fill="url(#f)"/>
  <text x="${s(M)}" y="${s(150)}" font-family="Menlo, monospace" font-size="${s(22)}" letter-spacing="4" fill="${GREEN}">RUBENMARCUS.DEV</text>
  <text x="${s(M)}" y="${s(272)}" font-family="Menlo, monospace" font-weight="bold" font-size="${s(70)}" fill="${INK}">I build agent-ready</text>
  <text x="${s(M)}" y="${s(352)}" font-family="Menlo, monospace" font-weight="bold" font-size="${s(70)}" fill="${INK}">products<tspan fill="${GREEN}">.</tspan></text>
  <rect x="${s(M)}" y="${s(404)}" width="${s(120)}" height="2" fill="${GREEN}"/>
  <text x="${s(M)}" y="${s(456)}" font-family="Menlo, monospace" font-size="${s(23)}" fill="${MUTED}">Senior AI Fullstack Engineer · 14 years shipping</text>
  <text x="${s(M)}" y="${s(494)}" font-family="Menlo, monospace" font-size="${s(23)}" fill="${GREEN}">agents, harnesses, evals, MCP</text>
</svg>`;
await sharp(Buffer.from(overlay)).png().toFile(join(root, "assets/gif-overlay.png"));
console.log(`saved ${join(root, "assets/gif-overlay.png")} (${GW}×${GH})`);

const out = join(root, "assets/banner.png");
const buf = await sharp({
  create: { width: W, height: H, channels: 4, background: "#000000" },
})
  .composite([
    { input: faded, left: px, top: 0 },
    { input: Buffer.from(svg), left: 0, top: 0 },
  ])
  .png()
  .toBuffer();

writeFileSync(out, buf);
console.log(`saved ${out} (${W}×${H})`);
