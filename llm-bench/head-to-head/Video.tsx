import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { llmBench, PAIR } from "../design";
import "../../src/lib/fonts"; // Space Grotesk + IBM Plex Mono
import data from "./data.json";

type Side = {
  name: string; icon: string | null; params_b: number; size_gb: number; downloads: number;
  single: number; prefill: number; levels: { c: number; agg: number }[]; schema_ok: number; schema_total: number;
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

const R_DUR = { single: 60, parallel: 78, prefill: 58, schema: 62, size: 72 };
const ROUNDS = [
  { from: 0, dur: R_DUR.single, win: "a" as const },
  { from: 60, dur: R_DUR.parallel, win: "a" as const },
  { from: 138, dur: R_DUR.prefill, win: "a" as const },
  { from: 196, dur: R_DUR.schema, win: "b" as const },
  { from: 258, dur: R_DUR.size, win: "a" as const },
];
const TOTAL = 258 + R_DUR.size;
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
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${s}) rotate(-8deg)`, border: `4px solid ${color}`, borderRadius: 12, padding: "4px 18px", fontFamily: t.mono, fontSize: 36, fontWeight: 800, letterSpacing: 4, color }}>WIN</div>
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
    const won = val >= best;
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

// ===== parallelism round — all concurrency levels at once =====
const ParallelRound: React.FC<{ n: number }> = ({ n }) => {
  const t = useDesign();
  const f = useCurrentFrame();
  const sq = useSq();
  const LX = 210, TRACK = 900 - LX;
  const won = peakA >= peakB;
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
      {won && <WinStamp color={A} x={744} y={sq ? 300 : 556} at={48} />}
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
      {row(D.a, A, A_NAME, sq ? 440 : 680, false)}
      {row(D.b, B, B_NAME, sq ? 700 : 1020, true)}
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
        {win && <WinStamp color={A} x={cx - 70} y={cy + (sq ? 206 : 316)} at={32} />}
      </>
    );
  };
  return (
    <Bg>
      <Watermark n={n} />
      <Title text="SIZE" unit="on disk · smaller wins" />
      {block(D.a, A_NAME, true, 360)}
      {block(D.b, B_NAME, false, 760)}
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
      else { winsB++; if (f - rf < 9) popB = 1 + 0.5 * (1 - (f - rf) / 9); }
    }
  });
  const dot = (i: number) => (f >= resolveFrame(ROUNDS[i]) ? (ROUNDS[i].win === "a" ? A : B) : f >= ROUNDS[i].from ? t.faint : t.panelBorder);
  return (
    <>
    {/* runtime badge (MLX · chip) */}
    <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", fontFamily: t.mono, fontSize: 21, fontWeight: 500, letterSpacing: 3, color: t.faint }}>{D.runtime}</div>
    <div style={{ position: "absolute", top: 62, left: 56, right: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
      <span style={{ fontFamily: t.mono, fontSize: 22, color: t.faint, letterSpacing: 1 }}>{D.repo}</span>
    </div>
    </>
  );
};

const Match: React.FC = () => (
  <AbsoluteFill style={{ background: llmBench.bg }}>
    {D.music ? (
      <Audio
        src={staticFile(`music/${D.music}`)}
        volume={(f) => interpolate(f, [0, 8, TOTAL - 22, TOTAL], [0, 0.85, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
      />
    ) : null}
    <Sequence durationInFrames={ROUNDS[0].dur}><SpeedRound n={1} mkey="single" title="SINGLE STREAM" /></Sequence>
    <Sequence from={ROUNDS[1].from} durationInFrames={ROUNDS[1].dur}><ParallelRound n={2} /></Sequence>
    <Sequence from={ROUNDS[2].from} durationInFrames={ROUNDS[2].dur}><SpeedRound n={3} mkey="prefill" title="PREFILL" /></Sequence>
    <Sequence from={ROUNDS[3].from} durationInFrames={ROUNDS[3].dur}><SchemaRound n={4} /></Sequence>
    <Sequence from={ROUNDS[4].from} durationInFrames={ROUNDS[4].dur}><SizeRound n={5} /></Sequence>
    <Sequence durationInFrames={TOTAL}><ScoreBar /></Sequence>
  </AbsoluteFill>
);

export const HeadToHeadVideo: React.FC = () => (
  <DesignProvider design={llmBench}>
    <Match />
  </DesignProvider>
);

export const headToHeadMeta = { id: "llm-bench-head-to-head", durationInFrames: TOTAL, fps: FPS, width: 1080, height: 1920 };
export const headToHeadSquareMeta = { id: "llm-bench-head-to-head-x", durationInFrames: TOTAL, fps: FPS, width: 1080, height: 1080 };
