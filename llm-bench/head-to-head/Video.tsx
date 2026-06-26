import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { llmBench, PAIR } from "../design";
import "../../src/lib/fonts"; // Space Grotesk + IBM Plex Mono
import data from "./data.json";

type Side = {
  name: string; icon: string | null; params_b: number; size_gb: number; downloads: number;
  single: number; prefill: number; levels: { c: number; agg: number }[]; schema_ok: number; schema_total: number; ifeval: number | null; gsm8k: number | null;
};
const D = data as unknown as { machine: string; runtime: string; repo: string; music?: string; a: Side; b: Side };

// GitHub "Invertocat" mark
const GitHubMark: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ display: "block" }}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);
const FPS = 30;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const A = PAIR.a, B = PAIR.b;
const A_NAME = D.a.name, B_NAME = D.b.name; // specific model names

// model logo (public/icons/<key>.png) with a colored-dot fallback for models without an icon yet
const ModelIcon: React.FC<{ icon: string | null; color: string; size: number }> = ({ icon, color, size }) =>
  icon ? (
    <Img src={staticFile(`icons/${icon}.png`)} style={{ width: size, height: size, objectFit: "contain", borderRadius: 6, flexShrink: 0 }} />
  ) : (
    <div style={{ width: size * 0.6, height: size * 0.6, borderRadius: "50%", background: color, flexShrink: 0 }} />
  );

// model name with its icon, inline
const NameTag: React.FC<{ s: Side; color: string; fontSize: number; gap?: number; nameColor?: string; center?: boolean }> = ({ s, color, fontSize, gap = 14, nameColor, center }) => {
  const t = useDesign();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap }}>
      <ModelIcon icon={s.icon} color={color} size={fontSize * 1.05} />
      <span style={{ fontFamily: t.sans, fontSize, fontWeight: 600, color: nameColor ?? t.text }}>{s.name}</span>
    </div>
  );
};
const peakA = D.a.levels[D.a.levels.length - 1].agg, peakB = D.b.levels[D.b.levels.length - 1].agg;
const gmax = Math.max(peakA, peakB);

// layout adapts to canvas height: tall 9:16 vs square 1:1 (sq = compact). Same components serve both.
const useSq = () => useVideoConfig().height < 1300;

// round winners computed from the data — correct for ANY pair, not just the canonical one
const lastAgg = (s: Side) => s.levels[s.levels.length - 1].agg;
// "a" | "b" | "tie" — a true tie favors NEITHER side
const winner = (av: number, bv: number, lowerBetter = false): "a" | "b" | "tie" =>
  av === bv ? "tie" : (lowerBetter ? av < bv : av > bv) ? "a" : "b";
const WIN: Record<string, "a" | "b" | "tie"> = {
  single: winner(D.a.single, D.b.single),
  parallel: winner(lastAgg(D.a), lastAgg(D.b)),
  prefill: winner(D.a.prefill, D.b.prefill),
  schema: winner(D.a.schema_ok, D.b.schema_ok),
  ifeval: winner(D.a.ifeval ?? 0, D.b.ifeval ?? 0),
  gsm8k: winner(D.a.gsm8k ?? 0, D.b.gsm8k ?? 0),
  size: winner(D.a.size_gb, D.b.size_gb, true),
};
// each round = quick reveal, then a generous HOLD on the settled result before cutting
const ROUND_DUR: Record<string, number> = { single: 150, parallel: 96, prefill: 92, schema: 96, ifeval: 96, gsm8k: 96, size: 100 };
const ORDER = ["single", "parallel", "prefill", "schema", "ifeval", "gsm8k", "size"];
let _acc = 0;
const ROUNDS = ORDER.map((key) => { const r = { key, from: _acc, dur: ROUND_DUR[key], win: WIN[key] }; _acc += ROUND_DUR[key]; return r; });
const ROUNDS_END = _acc;
const RECAP_DUR = 132;
const TOTAL = ROUNDS_END + RECAP_DUR;
const SEQ: Record<string, { from: number; dur: number }> = Object.fromEntries(ROUNDS.map((r) => [r.key, r]));
const resolveFrame = (r: { from: number; dur: number }) => r.from + Math.floor(r.dur * 0.62);

const Watermark: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const sq = useSq();
  return <div style={{ position: "absolute", top: sq ? -40 : -70, right: 30, fontFamily: t.mono, fontSize: sq ? 360 : 560, fontWeight: 700, color: t.faint, opacity: 0.06, lineHeight: 1 }}>{n}</div>;
};

const Title: React.FC<{ text: string; unit: string }> = ({ text, unit }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const s = spring({ frame: f, fps: FPS, config: { damping: 200, mass: 0.4 } });
  const wipe = interpolate(f, [4, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = text.length > 12 ? (sq ? 56 : 78) : (sq ? 74 : 96);
  return (
    <div style={{ position: "absolute", top: sq ? 158 : 280, left: 80, right: 80, transform: `translateX(${(1 - s) * -50}px)`, opacity: s }}>
      <div style={{ fontFamily: t.sans, fontSize: size, fontWeight: 700, color: t.text, letterSpacing: -1, lineHeight: 1 }}>{text}</div>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${A}, ${B})`, marginTop: sq ? 10 : 14, width: `${wipe * 100}%`, maxWidth: sq ? 440 : 560 }} />
      <div style={{ fontFamily: t.mono, fontSize: sq ? 22 : 26, color: t.faint, marginTop: sq ? 10 : 14, letterSpacing: 1 }}>{unit}</div>
    </div>
  );
};

const WinStamp: React.FC<{ color: string; x: number; y: number; at: number }> = ({ color, x, y, at }) => {
  const f = useCurrentFrame();
  const t = useDesign();
  const s = spring({ frame: f - at, fps: FPS, config: { damping: 11, mass: 0.4 } });
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s}) rotate(-8deg)`, background: t.bg, border: `4px solid ${color}`, borderRadius: 12, padding: "4px 18px", fontFamily: t.mono, fontSize: 36, fontWeight: 800, letterSpacing: 4, color }}>WIN</div>
  );
};

// ===== speed round =====
const SpeedRound: React.FC<{ n: number; mkey: "single" | "prefill"; title: string }> = ({ n, mkey, title }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const gp = clamp01((f - 10) / 34);
  const av = D.a[mkey], bv = D.b[mkey], best = Math.max(av, bv);
  const fmt = mkey === "prefill" ? (v: number) => `${Math.round(v)}` : (v: number) => v.toFixed(1);
  const FINISHX = 660;
  const ay = sq ? 472 : 740, by = sq ? 716 : 1120, barH = sq ? 104 : 132, numFs = sq ? 84 : 100, nameFs = sq ? 40 : 46;
  const lane = (val: number, color: string, name: string, side: "a" | "b") => {
    const len = (FINISHX - 80) * (val / best) * gp;
    const won = WIN[mkey] === side;
    const y = side === "a" ? ay : by;
    return (
      <>
        <div style={{ position: "absolute", left: 80, top: y - (sq ? 56 : 64) }}><NameTag s={side === "a" ? D.a : D.b} color={color} fontSize={nameFs} /></div>
        <div style={{ position: "absolute", left: 80, top: y, width: len, height: barH, borderRadius: 12, background: color, boxShadow: `0 0 60px ${color}40` }} />
        <div style={{ position: "absolute", right: 56, top: y + (sq ? 8 : 14), textAlign: "right", fontFamily: t.mono, fontSize: numFs, fontWeight: 700, color }}>{fmt(val * Math.min(1, gp))}</div>
        {won && <WinStamp color={color} x={FINISHX - 170} y={y + (sq ? 22 : 28)} at={44} />}
      </>
    );
  };
  return (
    <Bg>
      <Watermark n={n} />
      <Title text={title} unit="tok/s" />
      <div style={{ position: "absolute", left: FINISHX, top: ay - 70, width: 3, height: by + barH - (ay - 70) + 6, background: t.faint, opacity: 0.4 }} />
      {lane(av, A, A_NAME, "a")}
      {lane(bv, B, B_NAME, "b")}
    </Bg>
  );
};

// ===== single stream round — stream the same answer at each model's real tok/s =====
const STREAM_TEXT = `Sure! Here's a small helper that reverses a string:

def reverse(s):
    return s[::-1]

It walks the characters backwards with slice notation (step -1) and builds a new string. It runs in O(n) time, allocates a single copy, and works on any sliceable sequence — call reverse("hello") to get "olleh".`;

const StreamRound: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const REVEAL = 96;
  const maxS = Math.max(D.a.single, D.b.single);
  const panelH = sq ? 300 : 612, top0 = sq ? 300 : 472, gap = sq ? 18 : 34, bodyFs = sq ? 20 : 27;
  const win = WIN.single;
  const panel = (s: Side, color: string, idx: number) => {
    const frac = clamp01((s.single / maxS) * ((f - 6) / REVEAL));
    const chars = Math.floor(STREAM_TEXT.length * frac);
    const tokens = Math.round(chars / 4);
    const done = frac >= 1;
    const cursorOn = f % 18 < 9;
    const py = top0 + idx * (panelH + gap);
    return (
      <div style={{ position: "absolute", left: 60, right: 60, top: py, height: panelH, background: t.panel, border: `1px solid ${done ? color : t.panelBorder}`, borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: sq ? "12px 18px" : "16px 22px", borderBottom: `1px solid ${t.panelBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ModelIcon icon={s.icon} color={color} size={sq ? 30 : 36} />
            <span style={{ fontFamily: t.sans, fontSize: sq ? 28 : 34, fontWeight: 600, color: t.text }}>{s.name}</span>
            <span style={{ fontFamily: t.mono, fontSize: sq ? 22 : 26, color, marginLeft: 6 }}>{s.single.toFixed(1)} tok/s</span>
          </div>
          <span style={{ fontFamily: t.mono, fontSize: sq ? 26 : 30, fontWeight: 700, color: done ? t.good : t.dim }}>{tokens}<span style={{ color: t.faint, fontSize: sq ? 18 : 22 }}> tok</span></span>
        </div>
        <div style={{ flex: 1, padding: sq ? "14px 18px" : "18px 22px", fontFamily: t.mono, fontSize: bodyFs, lineHeight: 1.45, color: t.text, whiteSpace: "pre-wrap", wordBreak: "break-word", overflow: "hidden" }}>
          {STREAM_TEXT.slice(0, chars)}
          <span style={{ opacity: done ? 0 : cursorOn ? 1 : 0, color }}>▌</span>
        </div>
        <div style={{ padding: sq ? "0 18px 16px" : "0 22px 18px" }}>
          <div style={{ height: sq ? 12 : 14, borderRadius: 7, background: t.bg2, border: `1px solid ${t.panelBorder}`, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${frac * 100}%`, background: color, boxShadow: `0 0 16px ${color}99` }} />
          </div>
        </div>
      </div>
    );
  };
  const wy = top0 + (win === "b" ? 1 : 0) * (panelH + gap);
  return (
    <Bg>
      <Watermark n={n} />
      <Title text="SINGLE STREAM" unit="tok/s · same answer, streamed live" />
      {panel(D.a, A, 0)}
      {panel(D.b, B, 1)}
      {win !== "tie" && <WinStamp color={win === "a" ? A : B} x={sq ? 590 : 760} y={wy + panelH - (sq ? 66 : 80)} at={REVEAL + 8} />}
    </Bg>
  );
};

// ===== parallelism round — all concurrency levels at once =====
const ParallelRound: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const LX = 210, TRACK = 900 - LX;
  const start = sq ? 372 : 640, step = sq ? 130 : 152;
  return (
    <Bg>
      <Watermark n={n} />
      <Title text="PARALLELISM" unit="aggregate tok/s at every concurrency level" />
      {D.a.levels.map((lv, j) => {
        const peak = j === D.a.levels.length - 1;
        const g = spring({ frame: f - 10 - j * 4, fps: FPS, config: { damping: 18, mass: 0.6 } });
        const ly = start + j * step;
        const barH = peak ? (sq ? 36 : 42) : (sq ? 26 : 32);
        const aLen = (D.a.levels[j].agg / gmax) * TRACK * g;
        const bLen = (D.b.levels[j].agg / gmax) * TRACK * g;
        const vFs = peak ? (sq ? 30 : 36) : (sq ? 22 : 26);
        const bar = (len: number, val: number, color: string, top: number) => (
          <>
            <div style={{ position: "absolute", left: LX, top, width: len, height: barH, borderRadius: 6, background: color }} />
            <div style={{ position: "absolute", left: LX + len + 12, top: top + barH / 2 - vFs * 0.55, fontFamily: t.mono, fontSize: vFs, fontWeight: 700, color }}>{Math.round(val * g)}</div>
          </>
        );
        return (
          <div key={lv.c}>
            <span style={{ position: "absolute", left: 80, top: ly + barH - 8, fontFamily: t.mono, fontSize: peak ? (sq ? 38 : 44) : (sq ? 28 : 34), fontWeight: peak ? 800 : 500, color: peak ? t.text : t.faint }}>c{lv.c}</span>
            {bar(aLen, D.a.levels[j].agg, A, ly)}
            {bar(bLen, D.b.levels[j].agg, B, ly + barH + (sq ? 8 : 12))}
          </div>
        );
      })}
      {WIN.parallel !== "tie" && <WinStamp color={WIN.parallel === "a" ? A : B} x={744} y={sq ? 300 : 556} at={48} />}
    </Bg>
  );
};

// ===== structured output round =====
const SchemaRound: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const pip = sq ? 74 : 92, gap = sq ? 12 : 16, ratioFs = sq ? 64 : 84, nameFs = sq ? 40 : 44;
  const row = (s: Side, color: string, name: string, y: number, win: boolean) => (
    <div style={{ position: "absolute", left: 80, top: y }}>
      <div style={{ marginBottom: sq ? 12 : 16 }}><NameTag s={s} color={color} fontSize={nameFs} /></div>
      <div style={{ display: "flex", alignItems: "center", gap }}>
        {Array.from({ length: s.schema_total }).map((_, i) => {
          const pop = spring({ frame: f - 14 - i * 5, fps: FPS, config: { damping: 11, mass: 0.4 } });
          const ok = i < s.schema_ok;
          return (
            <div key={i} style={{ width: pip, height: pip, borderRadius: 16, transform: `scale(${pop})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: pip * 0.54, fontWeight: 800, background: ok ? `${t.good}22` : `${t.bad}1c`, border: `3px solid ${ok ? t.good : t.bad}`, color: ok ? t.good : t.bad }}>
              {ok ? "✓" : "✗"}
            </div>
          );
        })}
        <div style={{ fontFamily: t.mono, fontSize: ratioFs, fontWeight: 700, color: win ? color : t.dim, marginLeft: 22 }}>{s.schema_ok}/{s.schema_total}</div>
        {win && <WinStamp color={color} x={sq ? 588 : 760} y={2} at={44} />}
      </div>
    </div>
  );
  return (
    <Bg>
      <Watermark n={n} />
      <Title text="STRUCTURED OUTPUT" unit="returns valid JSON that follows the requested schema" />
      <div style={{ position: "absolute", top: sq ? 304 : 560, left: 80, right: 80, fontFamily: t.mono, fontSize: sq ? 22 : 24, color: t.dim }}>
        5 extraction tasks · how many parsed as schema-valid JSON?
      </div>
      {row(D.a, A, A_NAME, sq ? 440 : 680, WIN.schema === "a")}
      {row(D.b, B, B_NAME, sq ? 700 : 1020, WIN.schema === "b")}
    </Bg>
  );
};

// ===== size round =====
const SizeRound: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const k = (sq ? 196 : 280) / Math.sqrt(Math.max(D.a.size_gb, D.b.size_gb));
  const cy = sq ? 556 : 1060;
  const block = (s: Side, name: string, win: boolean, cx: number) => {
    const pop = spring({ frame: f - 12, fps: FPS, config: { damping: 13, mass: 0.6 } });
    const side = Math.sqrt(s.size_gb) * k * pop;
    return (
      <>
        <div style={{ position: "absolute", left: cx - side / 2, top: cy - side / 2, width: side, height: side, borderRadius: 20, background: t.panel, border: `3px solid ${win ? t.text : t.panelBorder}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: t.mono, fontSize: sq ? 52 : 64, fontWeight: 700, color: t.text }}>{s.size_gb.toFixed(1)}</span>
          <span style={{ fontFamily: t.mono, fontSize: sq ? 22 : 26, color: t.faint, letterSpacing: 2 }}>GB</span>
        </div>
        <div style={{ position: "absolute", left: cx - 200, top: cy + (sq ? 150 : 250), width: 400 }}>
          <NameTag s={s} color={s === D.a ? A : B} fontSize={sq ? 34 : 40} nameColor={win ? t.text : t.dim} center />
        </div>
        {win && <WinStamp color={s === D.a ? A : B} x={cx - 70} y={cy + (sq ? 206 : 316)} at={32} />}
      </>
    );
  };
  return (
    <Bg>
      <Watermark n={n} />
      <Title text="SIZE" unit="on disk · smaller wins" />
      {block(D.a, A_NAME, WIN.size === "a", 360)}
      {block(D.b, B_NAME, WIN.size === "b", 760)}
    </Bg>
  );
};

// ===== accuracy round (ifeval / gsm8k) — bars on an absolute 0–100% scale =====
const AccuracyRound: React.FC<{ n: number; mkey: "ifeval" | "gsm8k"; title: string; unit: string }> = ({ n, mkey, title, unit }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const gp = clamp01((f - 10) / 42);
  const av = D.a[mkey] ?? 0, bv = D.b[mkey] ?? 0;
  const FINISHX = 660;
  const ay = sq ? 472 : 740, by = sq ? 716 : 1120, barH = sq ? 104 : 132, numFs = sq ? 80 : 96;
  const lane = (val: number, color: string, side: "a" | "b") => {
    const len = (FINISHX - 80) * val * gp; // 100% = full track
    const won = WIN[mkey] === side;
    const y = side === "a" ? ay : by;
    return (
      <>
        <div style={{ position: "absolute", left: 80, top: y - (sq ? 56 : 64) }}><NameTag s={side === "a" ? D.a : D.b} color={color} fontSize={sq ? 40 : 46} /></div>
        <div style={{ position: "absolute", left: 80, top: y, width: len, height: barH, borderRadius: 12, background: color, boxShadow: `0 0 50px ${color}40` }} />
        <div style={{ position: "absolute", right: 56, top: y + (sq ? 14 : 18), textAlign: "right", fontFamily: t.mono, fontSize: numFs, fontWeight: 700, color }}>{Math.round(val * 100 * Math.min(1, gp))}<span style={{ fontSize: numFs * 0.5, color: t.faint }}>%</span></div>
        {won && <WinStamp color={color} x={FINISHX - 170} y={y + (sq ? 22 : 28)} at={46} />}
      </>
    );
  };
  return (
    <Bg>
      <Watermark n={n} />
      <Title text={title} unit={unit} />
      {/* 100% reference line */}
      <div style={{ position: "absolute", left: FINISHX, top: ay - 70, width: 2, height: by + barH - (ay - 70) + 6, background: t.faint, opacity: 0.4 }} />
      {lane(av, A, "a")}
      {lane(bv, B, "b")}
    </Bg>
  );
};

const ScoreBar: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();
  let winsA = 0, winsB = 0, popA = 1, popB = 1;
  ROUNDS.forEach((r) => {
    const rf = resolveFrame(r);
    if (f >= rf) {
      if (r.win === "a") { winsA++; if (f - rf < 9) popA = 1 + 0.5 * (1 - (f - rf) / 9); }
      else if (r.win === "b") { winsB++; if (f - rf < 9) popB = 1 + 0.5 * (1 - (f - rf) / 9); }
    }
  });
  const dot = (i: number) => (f >= resolveFrame(ROUNDS[i]) ? (ROUNDS[i].win === "a" ? A : ROUNDS[i].win === "b" ? B : t.dim) : f >= ROUNDS[i].from ? t.faint : t.panelBorder);
  return (
    <>
    <div style={{ position: "absolute", top: 56, left: 56, right: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <ModelIcon icon={D.a.icon} color={A} size={30} />
        <span style={{ fontFamily: t.sans, fontSize: 26, fontWeight: 600, color: A }}>{A_NAME}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: t.mono, fontSize: 40, fontWeight: 800, color: t.text, transform: `scale(${popA})`, display: "inline-block" }}>{winsA}</span>
        <div style={{ display: "flex", gap: 8 }}>{ROUNDS.map((_, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: dot(i) }} />)}</div>
        <span style={{ fontFamily: t.mono, fontSize: 40, fontWeight: 800, color: t.text, transform: `scale(${popB})`, display: "inline-block" }}>{winsB}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <span style={{ fontFamily: t.sans, fontSize: 26, fontWeight: 600, color: B }}>{B_NAME}</span>
        <ModelIcon icon={D.b.icon} color={B} size={30} />
      </div>
    </div>
    {/* GitHub source footer */}
    <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 11 }}>
      <GitHubMark size={24} color={t.faint} />
      <span style={{ fontFamily: t.mono, fontSize: 22, color: t.faint, letterSpacing: 1 }}>{D.repo} · {D.runtime}</span>
    </div>
    </>
  );
};

// ===== final recap — score + tale-of-the-tape across all categories =====
const CATS: { key: string; label: string; fmt: (s: Side) => string }[] = [
  { key: "single", label: "single tok/s", fmt: (s) => s.single.toFixed(0) },
  { key: "parallel", label: "peak tok/s", fmt: (s) => `${Math.round(lastAgg(s))}` },
  { key: "prefill", label: "prefill tok/s", fmt: (s) => `${Math.round(s.prefill)}` },
  { key: "schema", label: "structured", fmt: (s) => `${s.schema_ok}/${s.schema_total}` },
  { key: "ifeval", label: "instruction", fmt: (s) => `${Math.round((s.ifeval ?? 0) * 100)}%` },
  { key: "gsm8k", label: "math", fmt: (s) => `${Math.round((s.gsm8k ?? 0) * 100)}%` },
  { key: "size", label: "size (GB)", fmt: (s) => s.size_gb.toFixed(1) },
];

const Recap: React.FC = () => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const winsA = ROUNDS.filter((r) => r.win === "a").length;
  const winsB = ROUNDS.filter((r) => r.win === "b").length;
  const drawn = winsA === winsB;
  const champ = winsA > winsB ? { s: D.a, color: A } : { s: D.b, color: B };
  const pop = (d: number) => spring({ frame: f - d, fps: FPS, config: { damping: 12 } });
  const valFs = sq ? 30 : 42, labelFs = sq ? 20 : 26, rowH = sq ? 56 : 92, tableTop = sq ? 322 : 548;
  return (
    <Bg>
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ fontFamily: t.mono, fontSize: sq ? 22 : 26, letterSpacing: 4, color: t.faint, marginTop: sq ? 44 : 78 }}>FINAL TALLY</div>
        <div style={{ display: "flex", alignItems: "center", gap: sq ? 28 : 44, marginTop: sq ? 14 : 24, fontFamily: t.mono, fontWeight: 800 }}>
          <span style={{ fontSize: sq ? 88 : 132, color: A, transform: `scale(${pop(4)})`, display: "inline-block" }}>{winsA}</span>
          <span style={{ fontSize: sq ? 50 : 72, color: t.faint }}>–</span>
          <span style={{ fontSize: sq ? 88 : 132, color: B, transform: `scale(${pop(10)})`, display: "inline-block" }}>{winsB}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: sq ? 22 : 40, marginTop: sq ? 4 : 14, fontFamily: t.sans, fontWeight: 600, fontSize: sq ? 25 : 34 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: A }}><ModelIcon icon={D.a.icon} color={A} size={sq ? 26 : 34} />{D.a.name}</span>
          <span style={{ color: t.faint, fontFamily: t.mono, fontSize: sq ? 20 : 28 }}>vs</span>
          <span style={{ display: "flex", alignItems: "center", gap: 10, color: B }}>{D.b.name}<ModelIcon icon={D.b.icon} color={B} size={sq ? 26 : 34} /></span>
        </div>
      </AbsoluteFill>
      {CATS.map((c, i) => {
        const s = pop(18 + i * 6);
        const av = c.fmt(D.a), bv = c.fmt(D.b), w = WIN[c.key];
        return (
          <div key={c.key} style={{ position: "absolute", left: 64, right: 64, top: tableTop + i * rowH, display: "flex", alignItems: "center", opacity: s, transform: `translateY(${(1 - s) * 12}px)` }}>
            <span style={{ flex: 1, textAlign: "right", fontFamily: t.mono, fontSize: valFs, fontWeight: w === "a" ? 800 : 600, color: w === "a" ? A : w === "tie" ? A : t.faint }}>{av}</span>
            <span style={{ width: sq ? 290 : 410, textAlign: "center", fontFamily: t.mono, fontSize: labelFs, color: t.dim, letterSpacing: 1 }}>{c.label}</span>
            <span style={{ flex: 1, textAlign: "left", fontFamily: t.mono, fontSize: valFs, fontWeight: w === "b" ? 800 : 600, color: w === "b" ? B : w === "tie" ? B : t.faint }}>{bv}</span>
          </div>
        );
      })}
      <div style={{ position: "absolute", bottom: sq ? 92 : 152, left: 0, right: 0, textAlign: "center", fontFamily: t.sans, fontSize: sq ? 32 : 46, fontWeight: 700, color: drawn ? t.text : champ.color, opacity: pop(18 + CATS.length * 6 + 8) }}>
        {drawn ? "it's a draw" : `${champ.s.name} wins`}
      </div>
      <div style={{ position: "absolute", bottom: 30, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 11 }}>
        <GitHubMark size={24} color={t.faint} />
        <span style={{ fontFamily: t.mono, fontSize: 22, color: t.faint }}>{D.repo} · {D.runtime}</span>
      </div>
    </Bg>
  );
};

const Round: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <Sequence from={SEQ[k].from} durationInFrames={SEQ[k].dur}>{children}</Sequence>
);

const Match: React.FC = () => (
  <AbsoluteFill style={{ background: llmBench.bg }}>
    {D.music ? (
      <Audio
        src={staticFile(`music/${D.music}`)}
        volume={(f) => interpolate(f, [0, 8, TOTAL - 22, TOTAL], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    ) : null}
    <Round k="single"><StreamRound n={1} /></Round>
    <Round k="parallel"><ParallelRound n={2} /></Round>
    <Round k="prefill"><SpeedRound n={3} mkey="prefill" title="PREFILL" /></Round>
    <Round k="schema"><SchemaRound n={4} /></Round>
    <Round k="ifeval"><AccuracyRound n={5} mkey="ifeval" title="INSTRUCTION FOLLOWING" unit="IFEval · prompt-level strict" /></Round>
    <Round k="gsm8k"><AccuracyRound n={6} mkey="gsm8k" title="MATH" unit="GSM8K · exact match" /></Round>
    <Round k="size"><SizeRound n={7} /></Round>
    <Sequence durationInFrames={ROUNDS_END}><ScoreBar /></Sequence>
    <Sequence from={ROUNDS_END} durationInFrames={RECAP_DUR}><Recap /></Sequence>
  </AbsoluteFill>
);

export const HeadToHeadVideo: React.FC = () => (
  <DesignProvider design={llmBench}>
    <Match />
  </DesignProvider>
);

export const headToHeadMeta = { id: "llm-bench-head-to-head", durationInFrames: TOTAL, fps: FPS, width: 1080, height: 1920 };
export const headToHeadSquareMeta = { id: "llm-bench-head-to-head-x", durationInFrames: TOTAL, fps: FPS, width: 1080, height: 1080 };
