#!/usr/bin/env node
/**
 * GitHub stats card (assets/github-stats.png), rendered locally.
 *
 * The usual github-readme-stats.vercel.app cards were dropped: the public
 * instance answers 503 DEPLOYMENT_PAUSED, which renders as a broken image in
 * the README. This draws the same numbers in the site's black/phosphor-green
 * language, from the GitHub API via the `gh` CLI, with no third-party runtime
 * in the critical path.
 *
 * The card is a snapshot — re-run it to refresh (npm run stats).
 *
 * Usage: node scripts/gen-stats-card.mjs
 */

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const USER = "rubenmarcus";

const gh = (args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8" }));

const user = gh(["api", `users/${USER}`]);
const g = gh([
  "api",
  "graphql",
  "-f",
  `query={ user(login:"${USER}") {
    contributionsCollection { totalCommitContributions totalPullRequestContributions }
    repositories(first:100, ownerAffiliations:OWNER, isFork:false, orderBy:{field:STARGAZERS,direction:DESC}) {
      nodes { name stargazerCount }
    }
  } }`,
]);

const repos = g.data.user.repositories.nodes;
const stars = repos.reduce((n, r) => n + r.stargazerCount, 0);
const top = repos.filter((r) => r.stargazerCount > 0).slice(0, 5);
const { totalCommitContributions: commits, totalPullRequestContributions: prs } =
  g.data.user.contributionsCollection;

const W = 1600;
const H = 440;
const GREEN = "#00ff41";
const INK = "#f5f1ea";
const MUTED = "#8a9488";
const DIM = "#2a2f2a";
const M = 76;

const n = (v) => v.toLocaleString("en-US");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Left column: four headline tiles in a 2×2 grid.
const tiles = [
  { v: n(stars), l: "stars on my repos" },
  { v: n(user.public_repos), l: "public repos" },
  { v: n(user.followers), l: "followers" },
  { v: `${n(commits)} / ${n(prs)}`, l: "commits / PRs, last year" },
];
const tileSvg = tiles
  .map((t, i) => {
    const x = M + (i % 2) * 320;
    const y = 150 + Math.floor(i / 2) * 130;
    return `<text x="${x}" y="${y}" font-family="Menlo, monospace" font-weight="bold" font-size="52" fill="${GREEN}">${t.v}</text>
    <text x="${x}" y="${y + 34}" font-family="Menlo, monospace" font-size="20" fill="${MUTED}">${esc(t.l)}</text>`;
  })
  .join("\n");

// Right column: top repos as star-proportional bars.
const BAR_X = 860;
const BAR_W = 660;
const max = top[0].stargazerCount;
const repoSvg = top
  .map((r, i) => {
    const y = 132 + i * 58;
    const w = Math.max(4, Math.round((r.stargazerCount / max) * BAR_W));
    return `<text x="${BAR_X}" y="${y}" font-family="Menlo, monospace" font-size="22" fill="${INK}">${esc(r.name)}</text>
    <text x="${BAR_X + BAR_W}" y="${y}" text-anchor="end" font-family="Menlo, monospace" font-size="22" fill="${GREEN}">★ ${n(r.stargazerCount)}</text>
    <rect x="${BAR_X}" y="${y + 12}" width="${BAR_W}" height="4" fill="${DIM}"/>
    <rect x="${BAR_X}" y="${y + 12}" width="${w}" height="4" fill="${GREEN}"/>`;
  })
  .join("\n");

const stamp = new Date().toISOString().slice(0, 10);
const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#000000"/>
  <text x="${M}" y="74" font-family="Menlo, monospace" font-size="20" letter-spacing="4" fill="${GREEN}">GITHUB / ${USER.toUpperCase()}</text>
  <text x="${BAR_X}" y="74" font-family="Menlo, monospace" font-size="20" letter-spacing="4" fill="${MUTED}">MOST STARRED</text>
  <rect x="${M}" y="96" width="${W - M * 2}" height="1" fill="${DIM}"/>
  ${tileSvg}
  ${repoSvg}
  <text x="${M}" y="${H - 34}" font-family="Menlo, monospace" font-size="17" fill="${DIM}">snapshot ${stamp} · since ${user.created_at.slice(0, 4)}</text>
</svg>`;

const out = join(root, "assets/github-stats.png");
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`saved ${out} (${W}×${H}) — ${n(stars)} stars, ${n(user.public_repos)} repos`);
