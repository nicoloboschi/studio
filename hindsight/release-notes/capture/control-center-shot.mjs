// control-center-shot.mjs — capture a REAL screenshot of the Hindsight Embed Control Center
// (the local control center web app) AND extract its live CSS design tokens, so the video can be
// styled as an extension of the product.
//
// Prereq: the control center is running, e.g.  uvx hindsight-embed@latest -p <profile> control start
// Then:   node hindsight/release-notes/capture/control-center-shot.mjs
//
// Output:
//   public/captures/control-center.png            — screenshot used by the ui-shot scene
//   hindsight/release-notes/capture/ui-tokens.json — extracted color/font/radius tokens (reference)

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const outDir = join(root, "public", "captures");
mkdirSync(outDir, { recursive: true });

const URL = process.env.CC_URL || "http://localhost:7878/?profile=desktop";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });

console.log("opening", URL);
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => console.log("goto warn:", e.message));
await page.waitForTimeout(5000);

// --- extract live design tokens (resolve CSS vars to concrete rgb, capture computed styles) ---
const tokens = await page.evaluate(() => {
  const SENT = "rgb(1, 2, 3)";
  const probe = document.createElement("div");
  document.body.appendChild(probe);
  const resolveColor = (expr) => {
    probe.style.color = SENT;
    probe.style.color = expr;
    const c = getComputedStyle(probe).color;
    return c && c !== SENT ? c : null;
  };
  // shadcn-style vars are often bare HSL/oklch components; try wrappers.
  const resolveVar = (name) => resolveColor(`var(${name})`) || resolveColor(`hsl(var(${name}))`) || resolveColor(`oklch(var(${name}))`) || null;
  const varNames = ["--background", "--foreground", "--card", "--card-foreground", "--popover", "--primary", "--primary-foreground", "--secondary", "--muted", "--muted-foreground", "--accent", "--accent-foreground", "--destructive", "--border", "--input", "--ring", "--radius", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--sidebar", "--sidebar-primary", "--sidebar-accent"];
  // collect distinct accent-ish colors from real elements (links, buttons, svg, gradients)
  const palette = () => {
    const out = { links: new Set(), buttons: new Set(), svg: new Set(), gradients: new Set(), borders: new Set() };
    document.querySelectorAll("a, [role=link]").forEach((e) => out.links.add(getComputedStyle(e).color));
    document.querySelectorAll("button, [role=button]").forEach((e) => { const s = getComputedStyle(e); out.buttons.add(s.backgroundColor + " | " + s.color); });
    document.querySelectorAll("svg [fill], svg[fill], path[fill]").forEach((e) => out.svg.add(e.getAttribute("fill")));
    document.querySelectorAll("*").forEach((e) => { const bi = getComputedStyle(e).backgroundImage; if (bi && bi.includes("gradient")) out.gradients.add(bi.slice(0, 160)); });
    document.querySelectorAll("[class*=card i], [class*=border i]").forEach((e) => { const s = getComputedStyle(e); if (s.borderTopWidth !== "0px") out.borders.add(s.borderColor + " r=" + s.borderRadius); });
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v].slice(0, 10)]));
  };
  const grab = () => {
    const vars = {};
    for (const n of varNames) vars[n] = resolveVar(n);
    const cs = getComputedStyle(document.body);
    // sample a card-like element + a button + a heading
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, border: s.borderColor, radius: s.borderRadius, shadow: s.boxShadow, font: s.fontFamily, weight: s.fontWeight };
    };
    return {
      htmlClass: document.documentElement.className,
      body: { bg: cs.backgroundColor, color: cs.color, font: cs.fontFamily },
      vars,
      card: pick('[class*="card" i],[data-slot="card"],.rounded-lg,.rounded-xl'),
      button: pick("button"),
      heading: pick("h1,h2,h3"),
      mono: pick("code,pre,[class*='mono' i]"),
      palette: palette(),
    };
  };
  const light = grab();
  document.documentElement.classList.add("dark");
  const dark = grab();
  document.documentElement.classList.remove("dark");
  return { light, dark, url: location.href, radiusRaw: getComputedStyle(document.documentElement).getPropertyValue("--radius").trim() };
});
writeFileSync(join(here, "ui-tokens.json"), JSON.stringify(tokens, null, 2) + "\n");
console.log("tokens written; body bg:", tokens.light.body.bg, "/ dark:", tokens.dark.body.bg);

// --- screenshot: clip out the left PROFILES sidebar (it lists every local profile — privacy) ---
// Derive the main-content left edge from the "desktop" heading rather than guessing.
const contentLeft = await page.evaluate(() => {
  const h = [...document.querySelectorAll("h1,h2,h3")].find((e) => /^desktop$/i.test(e.textContent.trim()));
  const el = h || document.querySelector("main");
  return el ? Math.max(0, Math.floor(el.getBoundingClientRect().left) - 28) : 250;
});
const clip = { x: contentLeft, y: 0, width: 1920 - contentLeft, height: 1080 };
await page.screenshot({ path: join(outDir, "control-center.png"), clip });
console.log("shot: control-center.png (content left =", contentLeft + ")");
const toggled = await (async () => {
  for (const l of [page.getByRole("button", { name: /dark|theme|mode|appearance/i }), page.locator('[aria-label*="theme" i]'), page.locator('[aria-label*="dark" i]')]) {
    try { if ((await l.count()) && (await l.first().isVisible())) { await l.first().click({ timeout: 3000 }); return true; } } catch {}
  }
  return false;
})();
if (toggled) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(outDir, "control-center-dark.png") });
  console.log("shot: control-center-dark.png");
}

await browser.close();
console.log("done");
