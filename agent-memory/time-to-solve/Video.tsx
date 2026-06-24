import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DesignProvider, useDesign } from "../../src/lib/design";
import { Bg } from "../../src/lib/components";
import { agentMemory } from "../design";
import data from "./data.json";

const D = data as unknown as { speedup: number; memoryRecallSec: number; agenticSearchSec: number; credit: string };

const FPS = 30;

// --- geometry ---
const W = 1080;
const PAD = 80; // side padding
const R = 50; // ball radius
const INNER = 18; // gap between ball and the lane wall
const TRACK_W = W - 2 * PAD;
const CX_MIN = PAD + INNER + R; // ball-center range
const CX_MAX = W - PAD - INNER - R;

// --- timing: the fast lane runs `speedup`× the laps of the slow lane, and the whole thing loops ---
const SPEEDUP = D.speedup; // 10 — from ~90% lower latency (Mem0/Zep), see data.json
const SLOW_CYCLE = 90; // frames for one there-and-back on the slow (no-memory) lane
const FAST_CYCLE = Math.round(SLOW_CYCLE / SPEEDUP); // 9 — much quicker
const LOOP = SLOW_CYCLE * 2; // 180 → 2 slow laps / 20 fast laps: seamless loop

// ball center-x at frame `f` for a given lap length — a constant-speed bounce (triangle wave).
const cxAt = (f: number, cycle: number) => {
  const phase = (((f % cycle) + cycle) % cycle) / cycle; // 0..1
  const tri = 1 - Math.abs(2 * phase - 1); // 0 → 1 → 0 (left → right → left)
  return CX_MIN + tri * (CX_MAX - CX_MIN);
};

// completed round-trips so far (for the live lap counter).
const lapsAt = (f: number, cycle: number) => Math.floor(f / cycle);

const Lane: React.FC<{ label: string; sub: string; color: string; cycle: number; cy: number }> = ({ label, sub, color, cycle, cy }) => {
  const t = useDesign();
  const frame = useCurrentFrame();
  const cx = cxAt(frame, cycle);
  const answers = lapsAt(frame, cycle); // each there-and-back = one query answered
  // motion trail — faded ghosts at earlier frames (longer/denser for the faster ball).
  const ghosts = [4, 8, 12, 16, 20].map((d, i) => ({ x: cxAt(frame - d, cycle), o: 0.28 - i * 0.05 }));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: cy - 150 }}>
      {/* label row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: `0 ${PAD}px`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: color, boxShadow: `0 0 14px ${color}`, marginTop: 12 }} />
          <div>
            <div style={{ fontSize: 38, fontWeight: 700, color: t.text }}>{label}</div>
            <div style={{ fontSize: 24, color: t.faint, marginTop: 2 }}>{sub}</div>
          </div>
        </div>
        <span style={{ fontFamily: t.mono, fontSize: 34, fontWeight: 700, color, marginTop: 6 }}>
          {answers} <span style={{ color: t.faint, fontSize: 26, fontWeight: 500 }}>answered</span>
        </span>
      </div>
      {/* the track */}
      <div style={{ position: "relative", margin: `0 ${PAD}px`, height: 120, borderRadius: 60, background: t.panel, border: `1px solid ${t.panelBorder}` }}>
        {/* ghosts */}
        {ghosts.map((g, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: 60 - R,
              left: g.x - PAD - R,
              width: R * 2,
              height: R * 2,
              borderRadius: "50%",
              background: color,
              opacity: g.o,
              filter: "blur(2px)",
            }}
          />
        ))}
        {/* ball */}
        <div
          style={{
            position: "absolute",
            top: 60 - R,
            left: cx - PAD - R,
            width: R * 2,
            height: R * 2,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 32%, #ffffff, ${color})`,
            boxShadow: `0 0 36px ${color}cc, inset 0 0 18px ${color}`,
          }}
        />
      </div>
    </div>
  );
};

const Scene: React.FC = () => {
  const t = useDesign();
  return (
    <Bg>
      <AbsoluteFill style={{ justifyContent: "center" }}>
        <div style={{ position: "relative", height: 760 }}>
          <Lane label="Agentic search" sub="re-reads the files every query" color={t.bad} cycle={SLOW_CYCLE} cy={250} />
          <Lane label="Memory system" sub="one recall" color={t.accent} cycle={FAST_CYCLE} cy={620} />
        </div>
      </AbsoluteFill>
      {/* one-line takeaway */}
      <div style={{ position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center", fontSize: 40, color: t.dim, fontWeight: 600 }}>
        <span style={{ fontFamily: t.mono, fontWeight: 800, color: t.accent }}>{SPEEDUP}×</span> faster — recall once vs re-read every time.
      </div>
    </Bg>
  );
};

export const TimeToSolveVideo: React.FC = () => (
  <DesignProvider design={agentMemory}>
    <Scene />
  </DesignProvider>
);

export const timeToSolveMeta = { id: "agent-memory-time-to-solve", durationInFrames: LOOP, fps: FPS, width: W, height: 1920 };
