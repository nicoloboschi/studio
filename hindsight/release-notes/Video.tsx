import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Appear, Bg } from "../../src/lib/components";
import "../../src/lib/fonts"; // registers Inter + JetBrains Mono (product fonts)
import { hindsight } from "../design";
import data from "./data.json";

const FPS = 30;

type CurationAction = { verb: string; desc: string; before: string; beforeStrike?: boolean; after: string; note: string };

type Example =
  | { kind: "config-redact"; codeTitle: string; code: string; beforeLabel: string; before: string; afterLabel: string; after: string; neutral?: boolean; caption: string }
  | { kind: "dry-run"; endpoint: string; content: string; variants: { mission: string; facts: string[]; newFrom?: number }[]; caption: string }
  | { kind: "curation-actions"; actions: CurationAction[]; caption: string }
  | {
      kind: "scopes-table";
      setupLine: string;
      setupTags: string[];
      modes: { name: string; tag?: string; highlight?: boolean; built: string; answers: string }[];
      recalls: { code: string; result: string }[];
      caption: string;
    }
  | { kind: "ui-shot"; image: string; url: string; bullets: string[]; caption: string };

type Feature = { category: string; title: string; summary: string; example: Example };
type BoardItem = string | { text: string; hot?: boolean };
type Board = { kicker: string; title: string; groups: { label: string; items: BoardItem[] }[]; highlight?: string; highlightLabel?: string };

const D = data as unknown as {
  version: string;
  date: string;
  kicker: string;
  tagline: string;
  blogUrl: string;
  docsUrl: string;
  homeUrl: string;
  repo: string;
  stars: string;
  features: Feature[];
  board: Board;
};

// ---------- shared bits ----------

const Dot: React.FC<{ c: string; size?: number }> = ({ c, size = 7 }) => (
  <span style={{ display: "inline-block", width: size, height: size, borderRadius: "50%", background: c, flexShrink: 0 }} />
);

/** Modern flat card — like the control-plane: uniform hairline border, rounded, soft shadow, no accent bar. */
const card = (t: ReturnType<typeof useDesign>): React.CSSProperties => ({
  background: t.panel,
  border: `1px solid ${t.panelBorder}`,
  borderRadius: 14,
  boxShadow: "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.22)",
});

/** shadcn-style pill badge — semantics live here (color) instead of a left bar. */
const Badge: React.FC<{ c?: string; children: React.ReactNode }> = ({ c, children }) => {
  const t = useDesign();
  const col = c ?? t.accent;
  return (
    <span style={{ fontFamily: t.mono, fontSize: 18, color: col, background: `${col}1f`, border: `1px solid ${col}55`, borderRadius: 999, padding: "3px 13px", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
};

const GradientText: React.FC<{ children: React.ReactNode; size: number }> = ({ children, size }) => {
  const t = useDesign();
  return (
    <span
      style={{
        fontFamily: t.mono,
        fontSize: size,
        fontWeight: 800,
        lineHeight: 1.05,
        background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </span>
  );
};

const Header: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => {
  const t = useDesign();
  return (
    <Appear>
      <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 25, letterSpacing: 3, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ fontSize: 60, fontWeight: 800, marginTop: 8, lineHeight: 1.08 }}>{title}</div>
    </Appear>
  );
};

const Caption: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const t = useDesign();
  return (
    <Appear delay={delay}>
      <div style={{ position: "absolute", bottom: 46, left: 130, right: 130, fontSize: 25, color: t.faint, lineHeight: 1.4 }}>{children}</div>
    </Appear>
  );
};

/** Highlight [REDACTED:type] tokens in amber; everything else plain. */
const withRedactions = (s: string, t: ReturnType<typeof useDesign>): React.ReactNode =>
  s.split(/(\[REDACTED:[a-z_]+\])/g).map((p, i) =>
    p.startsWith("[REDACTED")
      ? <span key={i} style={{ color: t.amber, background: `${t.amber}1a`, borderRadius: 5, padding: "1px 5px" }}>{p}</span>
      : <span key={i}>{p}</span>,
  );

/** Naive code tint: comments faint, strings green, keys cyan, booleans amber, prompt green. */
const colorize = (line: string, t: ReturnType<typeof useDesign>): React.ReactNode => {
  if (line.trimStart().startsWith("#")) return <span style={{ color: t.faint }}>{line}</span>;
  const parts: React.ReactNode[] = [];
  const re = /("[^"]*"\s*:)|("[^"]*")|(\btrue\b|\bfalse\b)|(\$\s)/g;
  let last = 0, m: RegExpExecArray | null, k = 0;
  while ((m = re.exec(line))) {
    if (m.index > last) parts.push(<span key={k++} style={{ color: t.dim }}>{line.slice(last, m.index)}</span>);
    if (m[1]) parts.push(<span key={k++} style={{ color: t.accent2 }}>{m[1]}</span>);
    else if (m[2]) parts.push(<span key={k++} style={{ color: t.good }}>{m[2]}</span>);
    else if (m[3]) parts.push(<span key={k++} style={{ color: t.amber }}>{m[3]}</span>);
    else parts.push(<span key={k++} style={{ color: t.good }}>{m[4]}</span>);
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push(<span key={k++} style={{ color: t.dim }}>{line.slice(last)}</span>);
  return parts;
};

const CodeCard: React.FC<{ title: string; code: string; delay: number; fontSize?: number }> = ({ title, code, delay, fontSize = 26 }) => {
  const t = useDesign();
  return (
    <Appear delay={delay}>
      <div style={{ background: "#141417", border: `1px solid ${t.panelBorder}`, borderRadius: 14, boxShadow: "0 30px 80px rgba(0,0,0,0.45)", overflow: "hidden", fontFamily: t.mono }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 18px", background: "#0E0E11", borderBottom: `1px solid ${t.panelBorder}` }}>
          <Dot c="#FF5F57" /><Dot c="#FEBC2E" /><Dot c="#28C840" />
          <span style={{ color: t.faint, fontSize: 20, marginLeft: 8 }}>{title}</span>
        </div>
        <div style={{ padding: "22px 26px", fontSize, lineHeight: 1.5 }}>
          {code.split("\n").map((ln, i) => <div key={i} style={{ whiteSpace: "pre", color: t.text }}>{colorize(ln, t)}</div>)}
        </div>
      </div>
    </Appear>
  );
};

/** A real screenshot framed as a browser window (chrome bar + address pill). */
const BrowserShot: React.FC<{ image: string; url: string; width: number }> = ({ image, url, width }) => {
  const t = useDesign();
  return (
    <div style={{ width, borderRadius: 14, overflow: "hidden", border: `1px solid ${t.panelBorder}`, boxShadow: "0 40px 100px rgba(0,0,0,0.55)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "12px 16px", background: "#0E0E11", borderBottom: `1px solid ${t.panelBorder}` }}>
        <Dot c="#FF5F57" /><Dot c="#FEBC2E" /><Dot c="#28C840" />
        <div style={{ marginLeft: 14, flex: 1, background: "#141417", border: `1px solid ${t.panelBorder}`, borderRadius: 8, padding: "5px 14px", fontFamily: t.mono, fontSize: 18, color: t.faint }}>{url}</div>
      </div>
      <Img src={staticFile(image)} style={{ display: "block", width: "100%" }} />
    </div>
  );
};

// ---------- example renderers ----------

const ConfigRedact: React.FC<{ ex: Extract<Example, { kind: "config-redact" }> }> = ({ ex }) => {
  const t = useDesign();
  const row = (label: string, text: React.ReactNode, color: string, delay: number) => (
    <Appear delay={delay}>
      <div style={{ ...card(t), padding: "18px 22px" }}>
        <div style={{ marginBottom: 11 }}><Badge c={color}>{label}</Badge></div>
        <div style={{ fontFamily: t.mono, fontSize: 24, color: t.text, lineHeight: 1.45, wordBreak: "break-all" }}>{text}</div>
      </div>
    </Appear>
  );
  return (
    <div style={{ display: "flex", gap: 44, marginTop: 30 }}>
      <div style={{ flex: 1 }}>
        <CodeCard title={ex.codeTitle} code={ex.code} delay={18} fontSize={25} />
      </div>
      <div style={{ flex: 1.05, display: "flex", flexDirection: "column", gap: 18, justifyContent: "center" }}>
        {row(ex.beforeLabel, ex.before, ex.neutral ? t.accent2 : t.bad, 30)}
        {row(ex.afterLabel, withRedactions(ex.after, t), t.good, 44)}
      </div>
    </div>
  );
};

const DryRun: React.FC<{ ex: Extract<Example, { kind: "dry-run" }> }> = ({ ex }) => {
  const t = useDesign();
  return (
    <div style={{ marginTop: 22 }}>
      {/* the request + content */}
      <Appear delay={10}>
        <div style={{ ...card(t), padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Badge>{ex.endpoint}</Badge>
            <span style={{ color: t.faint, fontFamily: t.mono, fontSize: 18 }}>content · nothing stored</span>
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 21, color: t.dim, lineHeight: 1.45 }}>“{ex.content}”</div>
        </div>
      </Appear>
      {/* same content, different retain_mission → different facts */}
      <div style={{ display: "flex", gap: 36, marginTop: 20 }}>
        {ex.variants.map((v, i) => (
          <Appear key={i} delay={26 + i * 16} style={{ flex: 1 }}>
            <div style={{ ...card(t), padding: "20px 24px", minHeight: 232 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
                <Badge c={t.accent2}>retain_mission</Badge>
                <span style={{ fontSize: 23, color: t.text }}>{v.mission}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {v.facts.map((f, j) => {
                  const isNew = v.newFrom != null && j >= v.newFrom;
                  return (
                    <div key={j} style={{ display: "flex", alignItems: "baseline", gap: 12, fontSize: 23, color: isNew ? t.good : t.text, lineHeight: 1.4 }}>
                      <span style={{ position: "relative", top: -3 }}><Dot c={isNew ? t.good : t.faint} /></span>
                      <span>{f}{isNew && <span style={{ color: t.good, fontFamily: t.mono, fontSize: 17 }}>  ← captured now</span>}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Appear>
        ))}
      </div>
    </div>
  );
};

const CurationActions: React.FC<{ ex: Extract<Example, { kind: "curation-actions" }> }> = ({ ex }) => {
  const t = useDesign();
  return (
    <div style={{ display: "flex", gap: 40, marginTop: 32 }}>
      {ex.actions.map((a, i) => {
        const accent = a.verb === "edit" ? t.accent2 : t.amber;
        return (
          <Appear key={a.verb} delay={22 + i * 14} style={{ flex: 1 }}>
            <div style={{ ...card(t), padding: "26px 28px", height: 360 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Badge c={accent}>{a.verb}</Badge>
                <span style={{ fontSize: 24, color: t.dim }}>{a.desc}</span>
              </div>
              <div style={{ marginTop: 26, fontSize: 28, color: t.dim, fontFamily: t.mono, textDecoration: a.beforeStrike ? "line-through" : "none" }}>{a.before}</div>
              <div style={{ margin: "12px 0", fontSize: 20, color: t.faint, fontFamily: t.mono, letterSpacing: 1 }}>becomes</div>
              <div style={{ fontSize: 28, color: a.verb === "edit" ? t.text : t.dim, fontFamily: t.mono, fontWeight: a.verb === "edit" ? 700 : 400 }}>{a.after}</div>
              <div style={{ marginTop: 26, fontSize: 23, color: t.faint, lineHeight: 1.4 }}>{a.note}</div>
            </div>
          </Appear>
        );
      })}
    </div>
  );
};

const ScopesTable: React.FC<{ ex: Extract<Example, { kind: "scopes-table" }> }> = ({ ex }) => {
  const t = useDesign();
  return (
    <div style={{ marginTop: 22 }}>
      <Appear delay={10}>
        <div style={{ fontSize: 26, color: t.dim, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span>{ex.setupLine}</span>
        </div>
      </Appear>
      <Appear delay={16}>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {ex.setupTags.map((tg) => (
            <span key={tg} style={{ fontFamily: t.mono, fontSize: 22, color: t.accent2, background: `${t.accent2}12`, border: `1px solid ${t.accent2}44`, borderRadius: 8, padding: "5px 12px" }}>{tg}</span>
          ))}
        </div>
      </Appear>
      {/* mode table */}
      <div style={{ marginTop: 22 }}>
        {ex.modes.map((m, i) => {
          const c = m.highlight ? t.good : t.text;
          return (
            <Appear key={m.name} delay={26 + i * 9}>
              <div style={{ display: "grid", gridTemplateColumns: "260px 360px 1fr", alignItems: "center", gap: 20, padding: "12px 18px", borderBottom: `1px solid ${t.panelBorder}`, background: m.highlight ? `${t.good}12` : "transparent", borderRadius: m.highlight ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontFamily: t.mono, fontSize: 25, fontWeight: 700, color: m.highlight ? t.good : t.accent }}>{m.name}</span>
                  {m.tag && <span style={{ fontSize: 17, color: t.faint }}>{m.tag}</span>}
                </div>
                <div style={{ fontFamily: t.mono, fontSize: 21, color: t.dim }}>{m.built}</div>
                <div style={{ fontSize: 23, color: c }}>{m.answers}</div>
              </div>
            </Appear>
          );
        })}
      </div>
      {/* concrete recalls: different tags → different scoped observations */}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
        {ex.recalls.map((r, i) => (
          <Appear key={i} delay={80 + i * 12}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: t.mono, fontSize: 20, color: t.dim, background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 9, padding: "8px 13px", whiteSpace: "pre" }}>{colorize(r.code, t)}</span>
              <span style={{ color: t.faint, fontSize: 20 }}>→</span>
              <span style={{ fontSize: 22, color: t.good }}>{r.result}</span>
            </div>
          </Appear>
        ))}
      </div>
    </div>
  );
};

const UiShot: React.FC<{ ex: Extract<Example, { kind: "ui-shot" }> }> = ({ ex }) => {
  const t = useDesign();
  return (
    <div style={{ marginTop: 24, display: "flex", gap: 56, alignItems: "center" }}>
      <Appear delay={16}>
        <BrowserShot image={ex.image} url={ex.url} width={1180} />
      </Appear>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 26 }}>
        {ex.bullets.map((b, i) => (
          <Appear key={b} delay={34 + i * 10}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 13, fontSize: 27, color: t.text, lineHeight: 1.35 }}>
              <Dot c={t.accent2} /><span>{b}</span>
            </div>
          </Appear>
        ))}
      </div>
    </div>
  );
};

const FeatureScene: React.FC<{ f: Feature }> = ({ f }) => {
  const t = useDesign();
  const ex = f.example;
  return (
    <Bg>
      <div style={{ padding: "60px 130px", height: "100%" }}>
        <Header kicker={f.category} title={f.title} />
        <Appear delay={12}>
          <div style={{ fontSize: 34, color: t.text, marginTop: 16, maxWidth: 1500, fontWeight: 600 }}>{f.summary}</div>
        </Appear>
        {ex.kind === "config-redact" && <ConfigRedact ex={ex} />}
        {ex.kind === "dry-run" && <DryRun ex={ex} />}
        {ex.kind === "curation-actions" && <CurationActions ex={ex} />}
        {ex.kind === "scopes-table" && <ScopesTable ex={ex} />}
        {ex.kind === "ui-shot" && <UiShot ex={ex} />}
      </div>
      <Caption delay={80}>{ex.caption}</Caption>
    </Bg>
  );
};

// ---------- intro / board / outro ----------

const Intro: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 160px" }}>
        <Appear delay={2}>
          <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 30, letterSpacing: 6, textTransform: "uppercase" }}>Hindsight · {D.kicker}</div>
        </Appear>
        <Appear delay={12}>
          <div style={{ marginTop: 16 }}><GradientText size={150}>{D.version}</GradientText></div>
        </Appear>
        <Appear delay={22}>
          <div style={{ fontSize: 40, color: t.text, marginTop: 16, textAlign: "center", maxWidth: 1400, lineHeight: 1.35 }}>{D.tagline}</div>
        </Appear>
        <Appear delay={34}>
          <div style={{ marginTop: 30, fontFamily: t.mono, fontSize: 26, color: t.faint }}>{D.date}</div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

// Fast, low-animation summary board — "everything else in this release".
const BoardScene: React.FC = () => {
  const t = useDesign();
  const b = D.board;
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  return (
    <Bg>
      <div style={{ padding: "60px 110px", opacity: fade }}>
        <div style={{ color: t.accent2, fontFamily: t.mono, fontSize: 25, letterSpacing: 3, textTransform: "uppercase" }}>{b.kicker}</div>
        <div style={{ fontSize: 60, fontWeight: 800, marginTop: 8 }}>{b.title}</div>
        <div style={{ display: "flex", gap: 70, marginTop: 38 }}>
          {b.groups.map((g) => (
            <div key={g.label} style={{ flex: 1 }}>
              <div style={{ fontFamily: t.mono, fontSize: 23, color: t.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 18 }}>{g.label}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {g.items.map((raw, i) => {
                  const it = typeof raw === "string" ? { text: raw, hot: false } : raw;
                  const on = interpolate(frame, [8 + i * 3, 14 + i * 3], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 14, opacity: on, fontSize: 25, color: it.hot ? t.amber : t.text, fontWeight: it.hot ? 700 : 400, lineHeight: 1.35 }}>
                      <span style={{ position: "relative", top: -4 }}><Dot c={it.hot ? t.amber : t.accent} /></span>
                      <span>{it.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {b.highlight && (() => {
          const label = b.highlightLabel ?? "one more";
          const hot = /crit|must|upgrade|security/i.test(label);
          const c = hot ? t.amber : t.accent2;
          return (
            <div style={{ marginTop: 40, display: "flex", alignItems: "center", gap: 16, opacity: interpolate(frame, [40, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), background: `${c}10`, border: `1px solid ${c}55`, borderRadius: 12, padding: "16px 22px" }}>
              <span style={{ fontFamily: t.mono, fontSize: 22, color: c, textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" }}>{label}</span>
              <span style={{ fontSize: 27, color: t.text }}>{b.highlight}</span>
            </div>
          );
        })()}
      </div>
    </Bg>
  );
};

const GitHubMark: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill={color} aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 012-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

const Outro: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Appear delay={2}>
          <div style={{ fontSize: 80, fontWeight: 800, textAlign: "center" }}>
            Hindsight <GradientText size={80}>{D.version}</GradientText>
          </div>
        </Appear>
        <Appear delay={16}>
          <div style={{ marginTop: 22, fontFamily: t.mono, fontSize: 30, color: t.accent }}>{D.homeUrl}</div>
        </Appear>
        <Appear delay={28}>
          <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14, background: t.panel, border: `1px solid ${t.panelBorder}`, borderRadius: 999, padding: "11px 22px" }}>
            <GitHubMark size={30} color={t.text} />
            <span style={{ fontFamily: t.mono, fontSize: 26, color: t.text }}>{D.repo}</span>
            <span style={{ width: 1, height: 24, background: t.panelBorder }} />
            <span style={{ fontFamily: t.mono, fontSize: 26, color: t.amber }}>★ {D.stars}</span>
          </div>
        </Appear>
        <Appear delay={42}>
          <div style={{ fontSize: 28, color: t.faint, marginTop: 44, fontFamily: t.mono }}>
            <span style={{ color: t.accent }}>Hindsight</span> — Agent Memory That Learns
          </div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

// ---------- timeline ----------

const FEATURE_FRAMES: Record<Example["kind"], number> = {
  "config-redact": 250,
  "dry-run": 300,
  "curation-actions": 240,
  "scopes-table": 360,
  "ui-shot": 240,
};

type Beat = { key: string; duration: number; node: React.ReactNode };

const beats: Beat[] = [
  { key: "intro", duration: 140, node: <Intro /> },
  ...D.features.map((f, i): Beat => ({ key: `feat-${i}`, duration: FEATURE_FRAMES[f.example.kind], node: <FeatureScene f={f} /> })),
  { key: "board", duration: 220, node: <BoardScene /> },
  { key: "outro", duration: 150, node: <Outro /> },
];

const TOTAL = beats.reduce((s, b) => s + b.duration, 0);

const Scenes: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: hindsight.bg }}>
      {beats.map((b) => {
        const seq = <Sequence key={b.key} from={from} durationInFrames={b.duration}>{b.node}</Sequence>;
        from += b.duration;
        return seq;
      })}
    </AbsoluteFill>
  );
};

// Background music — Mixkit Free License (commercial use, no attribution required).
// Swap the track by changing this one line (files live in /public/music).
const MUSIC_SRC = "music/placeit-world.mixkit.mp3";
const MUSIC_VOL = 0.3;

const Music: React.FC = () => (
  <Audio
    src={staticFile(MUSIC_SRC)}
    volume={(f) => interpolate(f, [0, 30, TOTAL - 55, TOTAL], [0, MUSIC_VOL, MUSIC_VOL, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
);

export const ReleaseNotesVideo: React.FC = () => (
  <DesignProvider design={hindsight}>
    <Music />
    <Scenes />
  </DesignProvider>
);

export const releaseNotesMeta = { id: "hindsight-release-notes", durationInFrames: TOTAL, fps: FPS, width: 1920, height: 1080 };
