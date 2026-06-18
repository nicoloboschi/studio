// build-data.mjs — produces ../data.json for the Hindsight release-notes video.
//
// This is the reproducible "capture" for a release-notes video. A release-notes video is NOT a
// paraphrase of the blog post — for every headline feature we (1) investigate how it actually works
// in Hindsight (real API / CLI / config), and (2) show a concrete example that delivers value
// INSTANTLY (a command + its visible outcome). This file is where that curated, verified material
// lives; running it emits data.json.
//
// TO CUT THE NEXT RELEASE VIDEO:
//   1. Read the new release blog post for the feature list.
//   2. For each HEADLINE feature, investigate the real mechanics before writing copy:
//        - Load the `hindsight-docs` skill and grep references/ (openapi.json, developer/api/*,
//          sdks/*, changelog/index.md) for the real endpoint / CLI / config / env var.
//        - If the feature is newer than the bundled docs, fall back to the blog's verbatim snippet
//          and Hindsight's documented API conventions. Never invent an endpoint or flag.
//      Then pick the example `kind` that shows value fastest (see schema below) and fill real values.
//   3. Update `release` below: version, date, tagline, blogUrl, features[], board.
//   4. (optional) archive the current data: cp ../data.json capture/releases/<old-version>.json
//   5. Run:  node hindsight/release-notes/capture/build-data.mjs
//   6. Preview:  npm run studio  →  composition "hindsight-release-notes"
//   7. Render:   npm run render -- hindsight-release-notes out/hindsight-release-notes.mp4
//
// FEATURE EXAMPLE KINDS (each headline feature.example.kind → a scene layout in Video.tsx):
//   "config-redact"   config code (left) + a before→after transform (right). Wrap redacted spans as
//                     [REDACTED:type] and they render highlighted. Fields: codeTitle, code,
//                     beforeLabel, before, afterLabel, after, caption.
//   "curation-actions" ONE card per action (e.g. edit vs invalidate), each contrasting before→after.
//                     Fields: actions[]{verb, desc, before, beforeStrike?, after, note}, caption.
//   "scopes-table"    all scope modes as a table (mode → observations built → a query it unlocks),
//                     one row highlighted, grounded by several recall() calls with different tags.
//                     Fields: setupLine, setupTags[], modes[]{name, tag?, highlight?, built, answers},
//                     recalls[]{code, result}, caption.
//   "ui-shot"         a REAL screenshot framed as a browser window + capability bullets. Capture it
//                     live (see capture/control-center-shot.mjs) — never mock a UI. Fields: image
//                     (path under /public), url, bullets[], caption.
// The `board` is the fast, low-animation "everything else" closer: two labelled groups + 1 highlight.
//
// ACCURACY RULE: if you can't verify a command/endpoint/port in the docs or blog, DON'T show one,
// and never mock a UI. For the control center we stood up a real isolated daemon profile and
// screenshotted the actual Control Plane (see script.md → "Capturing the control center").
//
// Sources for THIS cut:
//   - Blog: https://hindsight.vectorize.io/blog/2026/06/18/version-0-8-3
//   - dry-run endpoint + REAL extracted facts: POST /v1/default/banks/{bank}/memories/dry-run-extract
//     (run live against an isolated 0.8.3 daemon; facts below are its actual output)
//   - tags_match enum (incl. `exact`): live openapi RecallRequest.tags_match
//   - OCR / markitdown parser: hindsight-docs references/developer/configuration.md
//   - docs site: docs.hindsight.vectorize.io
// Prior releases archived under capture/releases/<version>.json.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const release = {
  version: "0.8.3",
  date: "June 18, 2026",
  kicker: "release notes",
  tagline: "Preview extraction, OCR ingestion, and sharper retrieval.",
  blogUrl: "hindsight.vectorize.io/blog/2026/06/18/version-0-8-3",
  docsUrl: "docs.hindsight.vectorize.io",
  homeUrl: "hindsight.vectorize.io",
  repo: "vectorize-io/hindsight",
  stars: "16.5k", // snapshot 2026-06-18 (github stargazers_count 16,544)

  features: [
    {
      category: "preview",
      title: "Dry-Run Fact Extraction",
      summary: "Preview the facts a document yields — and tune your retain mission before you store.",
      example: {
        // variants[] is the REAL differential output of the dry-run-extract endpoint (gpt-4o-mini):
        // same content, two retain_mission values → the broad mission also captures the personal fact.
        kind: "dry-run",
        endpoint: "POST /banks/demo/memories/dry-run-extract",
        content: "Priya left Stripe to start Verdana, a climate-fintech startup, and is hiring two backend engineers. She loves bouldering and just adopted a cat named Pixel.",
        variants: [
          { mission: "professional only", facts: ["Priya left Stripe to start Verdana, hiring two backend engineers."] },
          {
            mission: "+ personal details",
            facts: ["Priya left Stripe to start Verdana, hiring two backend engineers.", "Priya loves bouldering and adopted a cat named Pixel."],
            newFrom: 1,
          },
        ],
        caption: "Pass a candidate retain_mission (or any retain param), preview the facts, repeat — all without storing. The fast loop for dialing in a bank.",
      },
    },
    {
      category: "ingestion",
      title: "Document OCR",
      summary: "Point MarkItDown's image OCR at a vision LLM — turn scans & photos into memory.",
      example: {
        kind: "config-redact",
        neutral: true,
        codeTitle: "server config",
        // The change in 0.8.3 isn't MarkItDown (already there) — it's the OpenAI-compatible vision OCR path.
        code: "# MarkItDown already reads PDF/DOCX — 0.8.3 OCRs images via a vision LLM\nHINDSIGHT_API_FILE_PARSER_MARKITDOWN_OCR_ENABLED=true\nHINDSIGHT_API_FILE_PARSER_MARKITDOWN_OCR_MODEL=gpt-4o-mini",
        beforeLabel: "scanned image",
        before: "receipt-042.jpg · photo of a printed receipt",
        afterLabel: "retained as text",
        after: "Acme Corp — Rust consulting · Apr 15 · $1,240",
        caption: "MarkItDown handled PDF, DOCX, PPTX, XLSX already; 0.8.3 adds an OpenAI-compatible vision endpoint, so images & scans become memory.",
      },
    },
    {
      category: "retrieval",
      title: "Sharper Retrieval",
      summary: "Pinpoint recall with exact tag matching — now surfaced everywhere.",
      example: {
        kind: "scopes-table",
        setupLine: "A memory tagged [user:alice, team:eng] — tags_match decides which filters return it:",
        setupTags: ["user:alice", "team:eng"],
        modes: [
          { name: "any", tag: "default", built: "OR · includes untagged", answers: "any of the filter tags overlap" },
          { name: "all", built: "AND · includes untagged", answers: "all filter tags are present" },
          { name: "any_strict", built: "OR · tagged only", answers: "any overlap, never untagged" },
          { name: "all_strict", built: "AND · tagged only", answers: "all present, never untagged" },
          { name: "exact", tag: "surfaced in 0.8.3", highlight: true, built: "set equality", answers: "exactly these tags — nothing broader" },
        ],
        recalls: [
          { code: 'recall(tags=["user:alice"],            tags_match="all_strict")', result: "matches — it has user:alice (plus more)" },
          { code: 'recall(tags=["user:alice"],            tags_match="exact")', result: "no match — it also carries team:eng" },
          { code: 'recall(tags=["user:alice","team:eng"], tags_match="exact")', result: "matches — tags line up exactly" },
        ],
        caption:
          "Sharper across 0.8.3: exact tag matching, better Chinese time-expression parsing, and recency that falls back to effective time when a timestamp is missing.",
      },
    },
  ],

  board: {
    kicker: "also in 0.8.3",
    title: "Everything else",
    groups: [
      {
        label: "operational",
        items: [
          "Async-operation & backlog gauges on /metrics",
          "Parallel tenant migrations — faster schema upgrades",
          "Gemini service-tier configuration",
          "Leaner API responses — null fields omitted",
        ],
      },
      {
        label: "fixes",
        items: [
          { text: "Critical: retain-chunking fix — oversized documents no longer lose content on ingest", hot: true },
          "LiteLLM timeout hard-cap — no more indefinite hangs",
          "Bank-config disposition & mission overlay consistency",
          "Consolidation robustness for single-value source_fact_ids",
          "Provider quota-reset retry deferral",
          "Output sanitization — strips malformed tags & unclosed blocks",
        ],
      },
    ],
  },
};

const out = join(dirname(fileURLToPath(import.meta.url)), "..", "data.json");
writeFileSync(out, JSON.stringify(release, null, 2) + "\n");
console.log(`wrote ${out} — Hindsight ${release.version} (${release.features.length} headline features + board)`);
