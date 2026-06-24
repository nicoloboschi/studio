// gallery.mjs — build a browser gallery of every studio video and open it (play-only, no editing).
//
//   npm run gallery            render any missing/stale MP4s into out/, build out/gallery.html, open it
//   npm run gallery -- --force re-render every composition first
//   npm run gallery -- --no-open  just build, don't open the browser
//
// Each video's MP4 is (re)rendered only when it's missing or older than its source files, so repeat
// runs are fast. The gallery is a static HTML file referencing the local MP4s — it only plays them.

import { execSync, execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, statSync, readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const ENTRY = "src/index.ts";
const FORCE = process.argv.includes("--force");
const NO_OPEN = process.argv.includes("--no-open");

mkdirSync(OUT, { recursive: true });

// --- 1. ask Remotion for the registered compositions -------------------------------------------
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, "");
const raw = stripAnsi(execSync(`npx remotion compositions ${ENTRY}`, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
// table rows look like: "agent-memory-time-to-solve   30   1080x1920   180 (6.00 sec)"
const comps = raw
  .split("\n")
  .map((l) => l.trim().match(/^(\S+)\s+(\d+)\s+(\d+x\d+)\s+(\d+)\s+\(([\d.]+)\s*sec\)/))
  .filter(Boolean)
  .map((m) => ({ id: m[1], fps: +m[2], dims: m[3], frames: +m[4], secs: +m[5] }));

if (!comps.length) {
  console.error("No compositions found — is src/Root.tsx registering any?");
  process.exit(1);
}

// --- 2. render incrementally: a video is re-rendered only if its own folder or the shared src/ changed
const newestIn = (dir) => {
  let newest = 0;
  if (!existsSync(dir)) return newest;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "out" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) newest = Math.max(newest, newestIn(p));
    else if (/\.(tsx?|json)$/.test(e.name)) newest = Math.max(newest, statSync(p).mtimeMs);
  }
  return newest;
};

// composition id is `<brandDir>-<videoDir>` — map each id back to its source folder.
// Shared visual deps live in src/lib (design tokens, components, fonts); src/Root.tsx & index.ts
// only register compositions and don't change any existing video's frames, so they're excluded.
const sharedNewest = newestIn(join(ROOT, "src", "lib"));
const folderById = {};
for (const brand of readdirSync(ROOT, { withFileTypes: true })) {
  if (!brand.isDirectory() || brand.name.startsWith(".") || ["node_modules", "out", "src", "scripts", "public"].includes(brand.name)) continue;
  const brandPath = join(ROOT, brand.name);
  for (const video of readdirSync(brandPath, { withFileTypes: true })) {
    if (!video.isDirectory()) continue;
    if (existsSync(join(brandPath, video.name, "Video.tsx"))) folderById[`${brand.name}-${video.name}`] = join(brandPath, video.name);
  }
}

// exact id → folder, else longest folder key the id is prefixed by (one folder can emit many comps)
const folderFor = (id) => folderById[id] || Object.entries(folderById).find(([k]) => id.startsWith(k + "-"))?.[1];

for (const c of comps) {
  const mp4 = join(OUT, `${c.id}.mp4`);
  const folder = folderFor(c.id);
  const srcNewest = Math.max(sharedNewest, folder ? newestIn(folder) : 0);
  const stale = !existsSync(mp4) || statSync(mp4).mtimeMs < srcNewest;
  if (FORCE || stale) {
    console.log(`▸ rendering ${c.id} …`);
    execSync(`npx remotion render ${ENTRY} ${c.id} out/${c.id}.mp4`, { cwd: ROOT, stdio: "inherit" });
  } else {
    console.log(`✓ ${c.id} up to date`);
  }
}

// --- 3. gather per-video metadata (what it's about + the source blog post) from each data.json --
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const quoteMeta = {}; // comp id -> { sentence, source, url, concept }
const folderMeta = {}; // folder path -> { desc, source, url, concept } (for single-composition videos)
for (const folder of new Set(Object.values(folderById))) {
  let d;
  try { d = JSON.parse(readFileSync(join(folder, "data.json"), "utf8")); } catch { continue; }
  if (Array.isArray(d.quotes)) for (const q of d.quotes) if (q.id) quoteMeta[q.id] = { sentence: q.sentence, source: q.source, url: q.url, concept: q.concept };
  folderMeta[folder] = { desc: d.headline || d.title || d.subtitle || null, source: d.source || null, url: d.url || null, concept: d.concept || null };
}

// --- 4. build a static, play-only gallery (card shows what it's about + a link to the blog post) -
const cards = comps
  .map((c) => {
    const [w, h] = c.dims.split("x").map(Number);
    const vertical = h > w;
    const abs = join(OUT, `${c.id}.mp4`);
    const fm = folderMeta[folderFor(c.id)] || {};
    const info = quoteMeta[c.id] || { sentence: fm.desc, source: fm.source, url: fm.url, concept: fm.concept };
    const about = info.sentence ? `<p class="about">${esc(info.sentence)}</p>` : "";
    const src = info.url
      ? `<div class="srcrow">${info.concept ? `<span class="tag">${esc(info.concept)}</span>` : ""}<a class="src" href="${esc(info.url)}" target="_blank" rel="noopener" title="${esc(info.url)}">↗ ${esc(info.source || "source")}</a></div>`
      : info.concept ? `<div class="srcrow"><span class="tag">${esc(info.concept)}</span></div>` : "";
    return `      <figure class="card${vertical ? " vertical" : ""}">
        <video src="./${c.id}.mp4" controls loop muted autoplay playsinline preload="metadata"></video>
        <figcaption>
          <div class="toprow"><span class="id">${c.id}</span><span class="meta">${c.dims} · ${c.secs}s · ${c.fps}fps</span></div>
          ${about}
          ${src}
          <code class="path" title="click to select & copy">${abs}</code>
        </figcaption>
      </figure>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Studio · video gallery</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #0B0A12; color: #F4F2F8;
      font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    header { padding: 40px 48px 8px; }
    header h1 { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.5px; }
    header p { margin: 6px 0 0; color: #B5B1C2; font-size: 16px; }
    .grid { display: grid; gap: 28px; padding: 32px 48px 64px;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); }
    .card { margin: 0; background: #16131F; border: 1px solid #2A2633; border-radius: 16px;
      overflow: hidden; display: flex; flex-direction: column; }
    .card video { width: 100%; background: #000; display: block; max-height: 70vh; object-fit: contain; }
    .card.vertical video { max-height: 78vh; }
    figcaption { display: flex; flex-direction: column; gap: 8px; padding: 14px 18px; border-top: 1px solid #2A2633; }
    .toprow { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .id { font-weight: 700; font-size: 16px; }
    .meta { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 13px; color: #7C7790; white-space: nowrap; }
    .about { margin: 0; font-size: 16px; line-height: 1.4; color: #F4F2F8; font-weight: 500; }
    .srcrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .tag { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: #A78BFA; background: rgba(167,139,250,.12); border: 1px solid rgba(167,139,250,.4); border-radius: 6px; padding: 2px 8px; }
    .src { font-size: 14px; color: #F472B6; text-decoration: none; border-bottom: 1px solid transparent; }
    .src:hover { border-bottom-color: #F472B6; }
    .path { font-family: "JetBrains Mono", ui-monospace, Menlo, monospace; font-size: 12px; color: #B5B1C2;
      background: #0B0A12; border: 1px solid #2A2633; border-radius: 8px; padding: 8px 10px; word-break: break-all; cursor: text; transition: border-color .15s; }
    .path:hover { border-color: #A78BFA; }
    .path.copied { border-color: #4ADE80; color: #4ADE80; }
  </style>
</head>
<body>
  <header>
    <h1>Studio · video gallery</h1>
    <p>${comps.length} video${comps.length === 1 ? "" : "s"} · play-only. Re-run <code>npm run gallery</code> to refresh.</p>
  </header>
  <main class="grid">
${cards}
  </main>
  <script>
    // click a path to select it (and copy where the browser allows)
    document.querySelectorAll('.path').forEach((p) =>
      p.addEventListener('click', () => {
        const range = document.createRange();
        range.selectNodeContents(p);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        let ok = false;
        try { ok = document.execCommand('copy'); } catch {}
        if (ok) { p.classList.add('copied'); setTimeout(() => p.classList.remove('copied'), 1200); }
      }),
    );
  </script>
</body>
</html>
`;

const dest = join(OUT, "gallery.html");
writeFileSync(dest, html);
console.log(`\n✓ gallery → ${dest}`);

if (!NO_OPEN) {
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    execFileSync(opener, [dest], { stdio: "ignore" });
    console.log("✓ opened in your browser");
  } catch {
    console.log(`Open it manually: file://${dest}`);
  }
}
