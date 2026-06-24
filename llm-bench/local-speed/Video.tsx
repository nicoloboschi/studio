import React from "react";
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Appear, Bg } from "../../src/lib/components";
import { llmBench, RACER_COLORS, MEDALS } from "../design";
import data from "./data.json";

type Model = { name: string; single: number; peak: number; conc: string; prefill: number; schema: number };
const D = data as unknown as { title: string; raceMetric: "peak" | "single"; raceLabel: string; models: Model[] };
const M = D.models;
const FPS = 30;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const fmt1 = (x: number) => x.toFixed(1);

const maxPeak = Math.max(...M.map((m) => m.peak));

const grad = (t: ReturnType<typeof useDesign>): React.CSSProperties => ({
  background: `linear-gradient(100deg, ${t.accent}, ${t.accent2})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
});

// ============ intro ============
const Intro: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
        <Appear delay={2}>
          <div style={{ color: t.accent, fontFamily: t.mono, fontSize: 28, letterSpacing: 5, textTransform: "uppercase" }}>local llm</div>
        </Appear>
        <Appear delay={12}>
          <div style={{ fontSize: 116, fontWeight: 800, lineHeight: 1.05, ...grad(t) }}>SPEED TEST</div>
        </Appear>
        <Appear delay={28}>
          <div style={{ marginTop: 30, fontSize: 38, color: t.dim, fontWeight: 600 }}>
            {M.length} models · racing on <span style={{ color: t.text }}>{D.raceLabel}</span>
          </div>
        </Appear>
      </AbsoluteFill>
    </Bg>
  );
};

// ============ the race ============
const START = 24;
const DUR = 234;
const TRACK0 = 70;
const FINISH = 980;
const CHIP_W = 250;
const LANE0 = 372;
const LANE_H = 232;

const Checkered: React.FC<{ x: number; top: number; height: number }> = ({ x, top, height }) => {
  const rows = Math.ceil(height / 26);
  return (
    <div style={{ position: "absolute", left: x, top, width: 26, height }}>
      {Array.from({ length: rows }).map((_, r) =>
        [0, 1].map((c) => (
          <div key={`${r}-${c}`} style={{ position: "absolute", left: c * 13, top: r * 26 + (c ? 13 : 0), width: 13, height: 13, background: (r + c) % 2 ? "#EAF2F8" : "#0A0E14" }} />
        )),
      )}
    </div>
  );
};

const RaceScene: React.FC = () => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const gp = clamp01((frame - START) / DUR);
  const winnerHome = gp >= 0.999;
  return (
    <Bg>
      {/* header */}
      <div style={{ position: "absolute", top: 70, left: 70, right: 70, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: t.mono, fontSize: 30, color: t.accent, letterSpacing: 2 }}>● RACE</span>
        <span style={{ fontFamily: t.mono, fontSize: 26, color: t.faint }}>{D.raceLabel}</span>
      </div>
      {/* finish line */}
      <Checkered x={FINISH} top={LANE0 - 30} height={LANE_H * M.length - 40} />

      {M.map((m, i) => {
        const color = RACER_COLORS[i % RACER_COLORS.length];
        const p = clamp01(gp * (m.peak / maxPeak));
        const x = TRACK0 + p * (FINISH - TRACK0 - CHIP_W);
        const y = LANE0 + i * LANE_H;
        const val = m.peak * gp;
        const lead = i === 0 && winnerHome;
        return (
          <div key={m.name} style={{ position: "absolute", left: 0, right: 0, top: y, height: LANE_H }}>
            {/* track */}
            <div style={{ position: "absolute", left: TRACK0, right: 1080 - FINISH, top: 92, height: 4, background: t.panelBorder, borderRadius: 2 }} />
            {/* speed streak */}
            <div style={{ position: "absolute", left: TRACK0, top: 54, width: x - TRACK0 + CHIP_W, height: 80, background: `linear-gradient(90deg, transparent, ${color}22, ${color}44)`, borderRadius: 40 }} />
            {/* number above the runner */}
            <div style={{ position: "absolute", left: x, top: 6, width: CHIP_W, textAlign: "center", fontFamily: t.mono, fontSize: 40, fontWeight: 800, color }}>
              {fmt1(val)}
            </div>
            {/* runner chip */}
            <div
              style={{
                position: "absolute",
                left: x,
                top: 54,
                width: CHIP_W,
                height: 80,
                borderRadius: 18,
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                boxShadow: lead ? `0 0 50px ${color}` : `0 8px 20px rgba(0,0,0,0.4)`,
                transform: lead ? "scale(1.05)" : "none",
              }}
            >
              <span style={{ fontFamily: t.mono, fontSize: 32, fontWeight: 800, color: "#0A0E14" }}>{m.name}</span>
            </div>
          </div>
        );
      })}

      {/* confetti when the winner crosses */}
      {gp > 0.97 &&
        Array.from({ length: 22 }).map((_, i) => {
          const age = frame - (START + DUR);
          const ang = i * 2.399;
          const cx = FINISH + Math.cos(ang) * 30;
          const cy = LANE0 - 10 + Math.sin(ang) * 20 + Math.max(0, age) * (3 + (i % 4));
          const color = RACER_COLORS[i % RACER_COLORS.length];
          return <div key={i} style={{ position: "absolute", left: cx, top: cy, width: 12, height: 16, background: color, opacity: clamp01(1 - age / 60), transform: `rotate(${age * (i % 2 ? 8 : -8)}deg)` }} />;
        })}
    </Bg>
  );
};

// ============ leaderboard ============
const Metric: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => {
  const t = useDesign();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontFamily: t.mono, fontSize: 20, color: t.faint, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontFamily: t.mono, fontSize: 30, fontWeight: 700, color: color ?? t.text }}>{value}</span>
    </div>
  );
};

const Row: React.FC<{ m: Model; i: number }> = ({ m, i }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const s = spring({ frame: frame - 14 - i * 10, fps: FPS, config: { damping: 200 } });
  const color = RACER_COLORS[i % RACER_COLORS.length];
  const medal = MEDALS[i];
  const win = i === 0;
  return (
    <div
      style={{
        opacity: s,
        transform: `translateX(${(1 - s) * 40}px)`,
        display: "flex",
        alignItems: "center",
        gap: 22,
        background: win ? `${t.accent}14` : t.panel,
        border: `1px solid ${win ? t.accent : t.panelBorder}`,
        borderLeft: `6px solid ${color}`,
        borderRadius: 18,
        padding: "20px 24px",
        marginBottom: 18,
        boxShadow: win ? `0 0 36px ${t.accent}33` : "none",
      }}
    >
      <div style={{ width: 56, height: 56, flexShrink: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: t.mono, fontWeight: 800, fontSize: 28, color: "#0A0E14", background: medal ?? t.faint }}>
        {i + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 38, fontWeight: 800, color: t.text, marginBottom: 12 }}>
          {m.name}
          {win && <span style={{ marginLeft: 14, fontFamily: t.mono, fontSize: 18, fontWeight: 700, letterSpacing: 3, color: t.accent }}>WIN</span>}
        </div>
        <div style={{ display: "flex", gap: 30 }}>
          <Metric label="single" value={fmt1(m.single)} />
          <Metric label={`peak @${m.conc}`} value={fmt1(m.peak)} color={color} />
          <Metric label="prefill" value={`${m.prefill}`} />
          <Metric label="schema" value={m.schema.toFixed(1)} color={m.schema < 1 ? t.amber : t.good} />
        </div>
      </div>
    </div>
  );
};

const Leaderboard: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <div style={{ padding: "80px 60px 0" }}>
        <Appear>
          <div style={{ color: t.accent, fontFamily: t.mono, fontSize: 28, letterSpacing: 3, textTransform: "uppercase" }}>leaderboard</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: t.text, marginTop: 4 }}>peak tok/s · all OK</div>
        </Appear>
        <div style={{ marginTop: 40 }}>
          {M.map((m, i) => (
            <Row key={m.name} m={m} i={i} />
          ))}
        </div>
      </div>
    </Bg>
  );
};

// ============ outro ============
const Outro: React.FC = () => {
  const t = useDesign();
  const win = M[0];
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px", textAlign: "center" }}>
        <Appear delay={2}>
          <div style={{ fontSize: 40, color: t.dim, fontWeight: 600 }}>fastest</div>
        </Appear>
        <Appear delay={10}>
          <div style={{ fontSize: 72, fontWeight: 800, color: t.text }}>{win.name}</div>
        </Appear>
        <Appear delay={20}>
          <div style={{ fontSize: 132, fontWeight: 800, fontFamily: t.mono, ...grad(t) }}>{fmt1(win.peak)}</div>
        </Appear>
        <Appear delay={26}>
          <div style={{ fontSize: 32, color: t.faint, fontFamily: t.mono, marginTop: -6 }}>peak tok/s @ {win.conc}</div>
        </Appear>
        <Appear delay={40}>
          <div style={{ marginTop: 44, fontSize: 34, color: t.dim, fontWeight: 600, maxWidth: 860 }}>
            Smallest model, most tokens — <span style={{ color: t.amber }}>at schema {win.schema.toFixed(1)}</span>.
          </div>
        </Appear>
      </AbsoluteFill>
      <div style={{ position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", fontFamily: t.mono, fontSize: 26, color: t.faint, letterSpacing: 3 }}>llm-bench</div>
    </Bg>
  );
};

const Scenes: React.FC = () => (
  <AbsoluteFill style={{ background: llmBench.bg }}>
    <Sequence durationInFrames={70}><Intro /></Sequence>
    <Sequence from={70} durationInFrames={300}><RaceScene /></Sequence>
    <Sequence from={370} durationInFrames={280}><Leaderboard /></Sequence>
    <Sequence from={650} durationInFrames={100}><Outro /></Sequence>
  </AbsoluteFill>
);

export const LocalSpeedVideo: React.FC = () => (
  <DesignProvider design={llmBench}>
    <Scenes />
  </DesignProvider>
);

export const localSpeedMeta = { id: "llm-bench-local-speed", durationInFrames: 750, fps: FPS, width: 1080, height: 1920 };
